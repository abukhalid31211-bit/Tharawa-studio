import { Router, Request } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { config } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { AuthRequest, authenticateToken } from '../middleware/auth.middleware.js';
import { logAudit } from '../lib/audit.js';

const router = Router();
const loginSchema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(128) });
const refreshSchema = z.object({ refreshToken: z.string().min(20).max(4096) });
const accessExpiry = config.jwtExpiresIn as SignOptions['expiresIn'];
const refreshExpiry = config.jwtRefreshExpiresIn as SignOptions['expiresIn'];

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function requestMeta(req: Request) {
  return { ip_address: req.ip, user_agent: req.get('user-agent')?.slice(0, 500) };
}

function expiryDate(value: string): Date {
  const match = /^(\d+)([mhd])$/.exec(value);
  const amount = match ? Number(match[1]) : 7;
  const unit = match?.[2] || 'd';
  const multiplier = unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return new Date(Date.now() + amount * multiplier);
}

function accessToken(user: { id: string; email: string; role: string; tier: string | null }) {
  return jwt.sign(
    { email: user.email, role: user.role, tier: user.tier, tokenType: 'access' },
    config.jwtSecret,
    { algorithm: 'HS256', expiresIn: accessExpiry, issuer: config.jwtIssuer, audience: config.jwtAudience, subject: user.id }
  );
}

async function createTokens(user: { id: string; email: string; role: string; tier: string | null }, req: Request) {
  const sessionId = randomUUID();
  const refreshToken = jwt.sign(
    { tokenType: 'refresh', sid: sessionId },
    config.jwtRefreshSecret,
    { algorithm: 'HS256', expiresIn: refreshExpiry, issuer: config.jwtIssuer, audience: config.jwtAudience, subject: user.id, jwtid: sessionId }
  );
  await prisma.refreshSession.create({
    data: {
      id: sessionId,
      user_id: user.id,
      token_hash: tokenHash(refreshToken),
      expires_at: expiryDate(config.jwtRefreshExpiresIn),
      ...requestMeta(req),
    },
  });
  return { token: accessToken(user), refreshToken };
}

async function recordLogin(req: Request, email: string, result: 'success' | 'failed', failure_reason?: string) {
  await prisma.loginAttempt.create({ data: { email, result, failure_reason, ...requestMeta(req) } }).catch(() => undefined);
}

async function isLocked(email: string) {
  const since = new Date(Date.now() - config.lockoutDurationMinutes * 60_000);
  const failures = await prisma.loginAttempt.count({ where: { email, result: 'failed', created_at: { gte: since } } });
  return failures >= config.maxLoginAttempts;
}

async function verifySuperAdmin(email: string, password: string): Promise<boolean> {
  if (email !== config.superAdminEmail || !config.superAdminPasswordHash) return false;
  return bcrypt.compare(password, config.superAdminPasswordHash);
}

function permissionsFrom(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  if (typeof value === 'string') {
    try { return permissionsFrom(JSON.parse(value)); } catch { return []; }
  }
  return [];
}

async function login(req: Request, res: any, adminOnly: boolean) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'InvalidInput', message: 'بيانات الدخول غير صالحة' });
  const email = parsed.data.email.toLowerCase().trim();
  const password = parsed.data.password;

  try {
    if (await isLocked(email)) return res.status(429).json({ error: 'AccountLocked', message: 'تم تجاوز عدد محاولات الدخول المسموح' });

    let user = await prisma.user.findUnique({ where: { email } });
    const superValid = await verifySuperAdmin(email, password);
    if (superValid && !user) {
      user = await prisma.user.create({ data: { email, name: 'Super Admin', role: 'super', tier: 'VIP+', status: 'active' } });
    }

    let valid = superValid;
    if (!valid && user?.password_hash) valid = await bcrypt.compare(password, user.password_hash);
    const allowedRole = user && (!adminOnly || ['super', 'admin', 'sub'].includes(user.role));
    if (!user || user.status !== 'active' || !valid || !allowedRole) {
      await recordLogin(req, email, 'failed', 'invalid_credentials');
      return res.status(401).json({ error: 'InvalidCredentials', message: 'بيانات الدخول غير صحيحة' });
    }

    let permissions: string[] = user.role === 'super' ? ['*'] : [];
    if (['super', 'admin', 'sub'].includes(user.role)) {
      const subAdmin = await prisma.subAdmin.upsert({
        where: { user_id: user.id },
        update: { last_active_at: new Date(), status: user.status },
        create: { user_id: user.id, name: user.name, email: user.email, permissions: user.role === 'super' ? ['*'] : [], status: 'active' },
      });
      permissions = user.role === 'super' ? ['*'] : permissionsFrom(subAdmin.permissions);
    }

    const tokens = await createTokens(user, req);
    await recordLogin(req, email, 'success');
    await logAudit({ actor_email: email, user_id: user.id, action: 'تسجيل دخول', action_en: 'Signed in', ...requestMeta(req) });
    return res.json({ ...tokens, user: { id: user.id, email: user.email, name: user.name, role: user.role, tier: user.tier, permissions } });
  } catch (error) {
    console.error('[Auth Login]', error);
    return res.status(500).json({ error: 'ServerError', message: 'تعذر تسجيل الدخول' });
  }
}

router.post('/login', (req, res) => login(req, res, false));
router.post('/admin/login', (req, res) => login(req, res, true));

router.post('/refresh', async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) return res.status(401).json({ error: 'NoRefreshToken' });
  try {
    const payload = jwt.verify(parsed.data.refreshToken, config.jwtRefreshSecret, {
      issuer: config.jwtIssuer, audience: config.jwtAudience, algorithms: ['HS256'],
    }) as JwtPayload;
    if (payload.tokenType !== 'refresh' || !payload.sub || !payload.sid) throw new Error('Invalid refresh token');
    const session = await prisma.refreshSession.findUnique({ where: { token_hash: tokenHash(parsed.data.refreshToken) } });
    if (!session || session.revoked_at || session.expires_at <= new Date() || session.user_id !== payload.sub) {
      throw new Error('Revoked refresh token');
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'active') throw new Error('Inactive user');
    await prisma.refreshSession.update({ where: { id: session.id }, data: { revoked_at: new Date() } });
    const tokens = await createTokens(user, req);
    return res.json(tokens);
  } catch {
    return res.status(403).json({ error: 'InvalidRefreshToken', message: 'جلسة التجديد غير صالحة' });
  }
});

router.post('/logout', async (req, res) => {
  const token = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : '';
  if (token) await prisma.refreshSession.updateMany({ where: { token_hash: tokenHash(token), revoked_at: null }, data: { revoked_at: new Date() } });
  return res.json({ success: true });
});

router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
  const user = await prisma.user.findFirst({ where: { id: req.user!.userId, status: 'active' }, include: { portfolios: true } });
  if (!user) return res.status(404).json({ error: 'NotFound' });
  return res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, tier: user.tier, status: user.status, portfolio_code: user.portfolio_code, phone: user.phone, kyc_status: user.kyc_status, profile_data: user.profile_data } });
});

router.post('/change-password', authenticateToken, async (req: AuthRequest, res) => {
  const parsed = z.object({ currentPassword: z.string().min(1).max(128), newPassword: z.string().min(8).max(128) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'InvalidInput', message: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل' });
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(404).json({ error: 'NotFound' });
  const valid = user.role === 'super'
    ? (!!user.password_hash && await bcrypt.compare(parsed.data.currentPassword, user.password_hash)) || await verifySuperAdmin(user.email, parsed.data.currentPassword)
    : !!user.password_hash && await bcrypt.compare(parsed.data.currentPassword, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'InvalidCurrentPassword' });
  const password_hash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password_hash } }),
    prisma.refreshSession.updateMany({ where: { user_id: user.id, revoked_at: null }, data: { revoked_at: new Date() } }),
  ]);
  await logAudit({ actor_email: user.email, user_id: user.id, action: 'تغيير كلمة المرور', action_en: 'Changed password', ...requestMeta(req) });
  return res.json({ success: true });
});

export default router;
