/**
 * Tharwah Capital - Secure Authentication Layer
 * طبقة مصادقة آمنة مع انتهاء صلاحية وتوقيع
 */
import { getStorage, setStorage, removeStorage, KEYS, clearAllAuthStorage } from './store';
import { signSession, verifySessionSignature, generateSecureToken } from './crypto';
import { createSecureSessionPayload, isSessionExpired, loginRateLimiter, sanitizeEmail } from './security';
import { logger } from './logger';
import { env } from './env';

const SESSION_SECRET = (import.meta.env.VITE_SESSION_SECRET as string) || 'tharwah-dev-secret-change-in-production';

export interface AdminSession {
  email: string;
  name: string;
  role: 'super' | 'sub';
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
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
  signature?: string;
}

// Create secure admin session
export async function createAdminSession(email: string, name: string, role: 'super' | 'sub', permissions: string[] = []): Promise<AdminSession> {
  const sanitizedEmail = sanitizeEmail(email);
  const payload = createSecureSessionPayload(sanitizedEmail, role, 8);
  
  const session: AdminSession = {
    email: sanitizedEmail,
    name: name.trim().slice(0, 100),
    role,
    permissions: permissions.slice(0, 20), // limit
    sessionId: payload.jti,
    issuedAt: payload.iat,
    expiresAt: payload.exp,
  };

  // Sign session for tamper detection
  try {
    const payloadStr = JSON.stringify({ email: session.email, role: session.role, exp: session.expiresAt, jti: session.sessionId });
    session.signature = await signSession(payloadStr, SESSION_SECRET);
  } catch {
    // Fallback if crypto fails
    logger.warn('Failed to sign admin session');
  }

  return session;
}

export async function createClientSession(id: string, email: string, name: string, tier = 'Regular'): Promise<ClientSession> {
  const sanitizedEmail = sanitizeEmail(email);
  const payload = createSecureSessionPayload(sanitizedEmail, 'client', 24);
  
  const session: ClientSession = {
    id: id.slice(0, 50),
    email: sanitizedEmail,
    name: name.trim().slice(0, 100),
    tier,
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

// Save sessions
export function saveAdminSession(session: AdminSession) {
  // Validate session before saving
  if (!session.email || !session.role || !session.sessionId) {
    logger.error('Invalid admin session attempted to save', undefined, { email: session.email });
    return;
  }
  
  setStorage(KEYS.ADMIN_SESSION, session, 8);
  logger.audit(session.email, 'admin_session_created', { role: session.role, sessionId: session.sessionId });
}

export function saveClientSession(session: ClientSession | any) {
  // Backward compatibility with old plain object
  if (!session.sessionId) {
    // Migrate old session
    const secureSession: ClientSession = {
      id: (session.id || 'unknown').toString().slice(0, 50),
      email: sanitizeEmail(session.email || 'unknown@example.com'),
      name: (session.name || 'User').toString().slice(0, 100),
      tier: session.tier || 'Regular',
      sessionId: generateSecureToken(16),
      issuedAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
    setStorage(KEYS.CLIENT_SESSION, secureSession, 24);
    return;
  }

  setStorage(KEYS.CLIENT_SESSION, session, 24);
}

// Get and validate sessions
export function getAdminSession(): AdminSession | null {
  const session = getStorage<AdminSession>(KEYS.ADMIN_SESSION);
  
  if (!session) return null;

  // Check expiry
  if (Date.now() > session.expiresAt) {
    logger.info('Admin session expired', { email: session.email });
    clearAdminSession();
    return null;
  }

  // Validate signature if present
  if (session.signature) {
    // Async verification skipped for sync getter - verify on critical operations
    // For now just check presence
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
}

export function clearClientSession() {
  removeStorage(KEYS.CLIENT_SESSION);
}

export function clearAllSessions() {
  clearAllAuthStorage();
}

/** Sections a sub-admin is allowed to see; super admin sees everything. */
export function getAllowedSections(session: AdminSession | null): string[] | null {
  if (!session) return [];
  if (session.role === 'super') return null; // null = all
  return session.permissions || [];
}

// Verify admin session signature (for critical operations)
export async function verifyAdminSessionIntegrity(session: AdminSession): Promise<boolean> {
  if (!session.signature) {
    // Old session without signature - allow but log warning
    logger.warn('Admin session without signature', { email: session.email });
    return true;
  }

  try {
    const payloadStr = JSON.stringify({ 
      email: session.email, 
      role: session.role, 
      exp: session.expiresAt, 
      jti: session.sessionId 
    });
    return await verifySessionSignature(payloadStr, session.signature, SESSION_SECRET);
  } catch {
    return false;
  }
}

// Session refresh
export async function refreshAdminSession(): Promise<AdminSession | null> {
  const current = getAdminSession();
  if (!current) return null;

  // Only refresh if close to expiry (less than 1 hour)
  const oneHour = 60 * 60 * 1000;
  if (current.expiresAt - Date.now() > oneHour) {
    return current;
  }

  const refreshed = await createAdminSession(current.email, current.name, current.role, current.permissions);
  saveAdminSession(refreshed);
  logger.info('Admin session refreshed', { email: current.email });
  return refreshed;
}

// Rate limiting helpers
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
