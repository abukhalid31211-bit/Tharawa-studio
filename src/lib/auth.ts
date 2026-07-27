/**
 * Tharwah Capital - Secure Authentication Layer v3
 * Backend JWT only
 */
import { getStorage, setStorage, removeStorage, KEYS, clearAllAuthStorage } from './store';
import { signSession, verifySessionSignature, generateSecureToken } from './crypto';
import { createSecureSessionPayload, isSessionExpired, loginRateLimiter, sanitizeEmail } from './security';
import { logger } from './logger';

/**
 * UI TAMPER-EVIDENCE ONLY — NOT A SECURITY BOUNDARY
 * VITE_SESSION_SECRET is a public build-time value included in the JS bundle.
 * The `signSession`/`verifySessionSignature` calls below (using this constant)
 * do NOT provide cryptographic security guarantees — anyone with browser
 * devtools can read this value and forge a matching signature. All real
 * authorization is enforced server-side via JWT verification in
 * `backend/src/middleware/auth.middleware.ts`. This exists only to detect
 * accidental localStorage corruption, not to resist a motivated attacker.
 */
const SESSION_SECRET = (import.meta.env.VITE_SESSION_SECRET as string) || (import.meta.env.PROD ? '' : 'tharwah-dev-secret-change-in-production');


// Access token: memory only — never in any browser storage — immune to XSS theft.
// Refresh token: HttpOnly cookie managed exclusively by the backend — JS cannot read it.

let _jwtTokenMemory: string | null = null;

export function getJwtToken(): string | null {
  return _jwtTokenMemory;
}

export function setJwtToken(token: string): void {
  _jwtTokenMemory = token;
  // Purge any legacy entries from previous versions
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('tharwah_jwt_token');
      localStorage.removeItem('tharwah_refresh_token');
      sessionStorage.removeItem('tharwah_refresh_token');
    } catch { /* ignore */ }
  }
}

export function removeJwtToken(): void {
  _jwtTokenMemory = null;
}

// Second parameter kept optional for backward-compat call sites; it is intentionally ignored.
// Refresh token is handled solely via HttpOnly cookie by the backend.
export function setAuthTokens(token: string, _refreshToken?: string): void {
  setJwtToken(token);
}

export function clearAuthTokens(): void {
  removeJwtToken();
  // No client-side refresh token to clear — the backend clears the HttpOnly cookie on logout.
}

export interface AdminSession {
  email: string;
  name: string;
  role: 'super' | 'sub' | 'admin';
  permissions: string[];
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
  signature?: string;
}

export interface ClientSession {
  id: string;
  email: string;
  name: string;
  tier: string;
  role: string;
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
  signature?: string;
}

export async function createAdminSession(email: string, name: string, role: 'super' | 'sub' | 'admin', permissions: string[] = []): Promise<AdminSession> {
  const sanitizedEmail = sanitizeEmail(email);
  const payload = createSecureSessionPayload(sanitizedEmail, role, 8);

  const session: AdminSession = {
    email: sanitizedEmail,
    name: name.trim().slice(0, 100),
    role,
    permissions: permissions.slice(0, 20),
    sessionId: payload.jti,
    issuedAt: payload.iat,
    expiresAt: payload.exp,
  };

  try {
    const payloadStr = JSON.stringify({ email: session.email, role: session.role, exp: session.expiresAt, jti: session.sessionId });
    session.signature = await signSession(payloadStr, SESSION_SECRET);
  } catch {
    logger.warn('Failed to sign admin session');
  }

  return session;
}

export async function createClientSession(id: string, email: string, name: string, tier = 'Regular', role = 'client'): Promise<ClientSession> {
  const sanitizedEmail = sanitizeEmail(email);
  const payload = createSecureSessionPayload(sanitizedEmail, 'client', 24);

  const session: ClientSession = {
    id: id.slice(0, 50),
    email: sanitizedEmail,
    name: name.trim().slice(0, 100),
    tier,
    role,
    sessionId: payload.jti,
    issuedAt: payload.iat,
    expiresAt: payload.exp,
  };

  try {
    const payloadStr = JSON.stringify({ email: session.email, id: session.id, exp: session.expiresAt, jti: session.sessionId });
    session.signature = await signSession(payloadStr, SESSION_SECRET);
  } catch {
    logger.warn('Failed to sign client session');
  }

  return session;
}

export function saveAdminSession(session: AdminSession) {
  if (!session.email || !session.role || !session.sessionId) {
    logger.error('Invalid admin session attempted to save', undefined, { email: session.email });
    return;
  }
  setStorage(KEYS.ADMIN_SESSION, session, 8);
  logger.audit(session.email, 'admin_session_created', { role: session.role, sessionId: session.sessionId });
}

export function saveClientSession(session: ClientSession | any) {
  if (!session.sessionId) {
    const secureSession: ClientSession = {
      id: (session.id || 'unknown').toString().slice(0, 50),
      email: sanitizeEmail(session.email || 'unknown@example.com'),
      name: (session.name || 'User').toString().slice(0, 100),
      tier: session.tier || 'Regular',
      role: session.role || 'client',
      sessionId: generateSecureToken(16),
      issuedAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
    setStorage(KEYS.CLIENT_SESSION, secureSession, 24);
    return;
  }
  setStorage(KEYS.CLIENT_SESSION, session, 24);
}

export function getAdminSession(): AdminSession | null {
  const session = getStorage<AdminSession>(KEYS.ADMIN_SESSION);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    logger.info('Admin session expired', { email: session.email });
    clearAdminSession();
    return null;
  }

  return session;
}

export function getClientSession(): ClientSession | null {
  const session = getStorage<ClientSession>(KEYS.CLIENT_SESSION);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    clearClientSession();
    return null;
  }

  return session;
}

export function isAdminAuthed(): boolean {
  const session = getAdminSession();
  return !!session && Date.now() < session.expiresAt;
}

export function isClientAuthed(): boolean {
  const session = getClientSession();
  return !!session && Date.now() < session.expiresAt;
}

export function clearAdminSession() {
  const session = getStorage<AdminSession>(KEYS.ADMIN_SESSION);
  if (session) {
    logger.audit(session.email, 'admin_session_cleared');
  }
  removeStorage(KEYS.ADMIN_SESSION);
  localStorage.removeItem('admin_permissions');
  clearAuthTokens();
}

export function clearClientSession() {
  removeStorage(KEYS.CLIENT_SESSION);
  clearAuthTokens();
}

export function clearAllSessions() {
  clearAllAuthStorage();
  clearAuthTokens();
}

export function getAllowedSections(session: AdminSession | null): string[] | null {
  if (!session) return [];
  if (session.role === 'super') return null;
  return session.permissions || [];
}

export async function verifyAdminSessionIntegrity(session: AdminSession): Promise<boolean> {
  if (!session.signature) {
    logger.warn('Admin session without signature', { email: session.email });
    return true;
  }

  try {
    const payloadStr = JSON.stringify({
      email: session.email,
      role: session.role,
      exp: session.expiresAt,
      jti: session.sessionId,
    });
    return await verifySessionSignature(payloadStr, session.signature, SESSION_SECRET);
  } catch {
    return false;
  }
}

export async function refreshAdminSession(): Promise<AdminSession | null> {
  const current = getAdminSession();
  if (!current) return null;

  const oneHour = 60 * 60 * 1000;
  if (current.expiresAt - Date.now() > oneHour) {
    return current;
  }

  const refreshed = await createAdminSession(current.email, current.name, current.role, current.permissions);
  saveAdminSession(refreshed);
  logger.info('Admin session refreshed', { email: current.email });
  return refreshed;
}

export function checkLoginRateLimit(email: string): { allowed: boolean; remainingTime?: number; attemptsLeft: number } {
  const result = loginRateLimiter.isBlocked(sanitizeEmail(email));
  return {
    allowed: !result.blocked,
    remainingTime: result.remainingTime,
    attemptsLeft: result.attemptsLeft,
  };
}

export function recordLoginAttempt(email: string, success: boolean): void {
  loginRateLimiter.recordAttempt(sanitizeEmail(email), success);
}
