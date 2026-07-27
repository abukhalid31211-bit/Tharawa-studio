/**
 * Tharwah Capital - Security Utilities
 * أدوات الحماية والتطهير
 */
import { z } from 'zod';

// Rate limiting in-memory (for client-side, server should have Redis)
class RateLimiter {
  private attempts: Map<string, { count: number; firstAttempt: number; blockedUntil?: number }> = new Map();

  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000, // 15 minutes
    private blockDuration: number = 30 * 60 * 1000 // 30 minutes
  ) {}

  isBlocked(key: string): { blocked: boolean; remainingTime?: number; attemptsLeft: number } {
    const record = this.attempts.get(key);
    const now = Date.now();

    if (!record) {
      return { blocked: false, attemptsLeft: this.maxAttempts };
    }

    if (record.blockedUntil && record.blockedUntil > now) {
      return {
        blocked: true,
        remainingTime: Math.ceil((record.blockedUntil - now) / 1000 / 60),
        attemptsLeft: 0,
      };
    }

    // Reset if window expired
    if (now - record.firstAttempt > this.windowMs) {
      this.attempts.delete(key);
      return { blocked: false, attemptsLeft: this.maxAttempts };
    }

    const attemptsLeft = Math.max(0, this.maxAttempts - record.count);
    return {
      blocked: record.count >= this.maxAttempts,
      attemptsLeft,
    };
  }

  recordAttempt(key: string, success: boolean): void {
    const now = Date.now();

    if (success) {
      this.attempts.delete(key);
      return;
    }

    const existing = this.attempts.get(key);

    if (!existing || now - existing.firstAttempt > this.windowMs) {
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return;
    }

    const newCount = existing.count + 1;
    if (newCount >= this.maxAttempts) {
      this.attempts.set(key, {
        ...existing,
        count: newCount,
        blockedUntil: now + this.blockDuration,
      });
    } else {
      this.attempts.set(key, { ...existing, count: newCount });
    }
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  clear(): void {
    this.attempts.clear();
  }
}

export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000, 30 * 60 * 1000);

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    // Remove potential XSS vectors
    .replace(/[<>]/g, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Limit length
    .slice(0, 1000);
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim().slice(0, 254);
}

export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - for production consider DOMPurify
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

// CSV Injection prevention
export function sanitizeCsvValue(value: string): string {
  // Prevent formula injection
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  const trimmed = value.trim();
  
  if (dangerousPrefixes.some(prefix => trimmed.startsWith(prefix))) {
    return `'${value}`;
  }
  
  return value;
}

// Validation schemas
export const emailSchema = z.string().email('بريد إلكتروني غير صالح').max(254);
export const passwordSchema = z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل').max(128);
export const phoneSchema = z.string().regex(/^\+?[0-9\s\-()]+$/, 'رقم هاتف غير صالح').min(8).max(20);

// Secure session validation
/**
 * UI TAMPER-EVIDENCE ONLY — NOT A SECURITY BOUNDARY
 * This local session payload (and the `createAdminSession`/`createClientSession`
 * signature built from it in `src/lib/auth.ts`) is signed with `VITE_SESSION_SECRET`,
 * which is a public build-time value bundled into the client JS. It cannot function
 * as a real cryptographic secret against a user who controls their own browser.
 * All real authorization is enforced server-side via JWT verification in
 * `backend/src/middleware/auth.middleware.ts`. This mechanism exists only to
 * detect accidental/incidental localStorage corruption, not to resist a
 * motivated attacker.
 */
export interface SecureSessionPayload {

  email: string;
  role: 'super' | 'admin' | 'sub' | 'client';
  exp: number; // expiry timestamp
  iat: number; // issued at
  jti: string; // JWT ID
}

export function isSessionExpired(session: SecureSessionPayload): boolean {
  return Date.now() > session.exp;
}

export function createSecureSessionPayload(
  email: string,
  role: 'super' | 'admin' | 'sub' | 'client',
  expiresInHours = 8
): SecureSessionPayload {
  const now = Date.now();
  return {
    email: sanitizeEmail(email),
    role,
    iat: now,
    exp: now + expiresInHours * 60 * 60 * 1000,
    jti: crypto.randomUUID(),
  };
}

// NOTE: The Content Security Policy for this app is defined and enforced via
// real HTTP response headers in `vercel.json` (frontend) and
// `backend/nginx/tharwah.conf` (API), not from any client-side helper. A
// `<meta http-equiv="Content-Security-Policy">` tag cannot enforce every CSP
// directive (e.g. frame-ancestors), so `vercel.json` is the single source of
// truth for the deployed CSP — see AUDIT-REPORT.md §4.10 for background.

// Audit logging
export interface AuditEvent {
  actor: string;
  action: string;
  resource?: string;
  result: 'success' | 'failed';
  ip?: string;
  userAgent?: string;
  timestamp: string;
}

export function createAuditEvent(
  actor: string,
  action: string,
  result: 'success' | 'failed' = 'success',
  resource?: string
): AuditEvent {
  return {
    actor: sanitizeEmail(actor),
    action: sanitizeInput(action),
    resource: resource ? sanitizeInput(resource) : undefined,
    result,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : undefined,
  };
}

// Check if running in secure context
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return true;
  return window.isSecureContext || window.location.hostname === 'localhost';
}
