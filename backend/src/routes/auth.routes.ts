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

router.patch('/profile', authenticateToken, async (req: AuthRequest, res) => {
  const parsed = z.object({
    phone: z.string().max(30).optional(),
    profile_data: z.record(z.string(), z.unknown()).optional(),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'InvalidInput', message: 'بيانات الملف الشخصي غير صالحة' });

  const existing = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!existing || existing.status !== 'active') return res.status(404).json({ error: 'NotFound' });

  const mergedProfile = parsed.data.profile_data
    ? { ...(existing.profile_data && typeof existing.profile_data === 'object' && !Array.isArray(existing.profile_data) ? existing.profile_data as Record<string, unknown> : {}), ...parsed.data.profile_data }
    : existing.profile_data;

  const updated = await prisma.user.update({
    where: { id: existing.id },
    data: {
      ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
      ...(parsed.data.profile_data !== undefined ? { profile_data: mergedProfile as any } : {}),
    },
  });
  await logAudit({ actor_email: updated.email, user_id: updated.id, action: 'تحديث الملف الشخصي', action_en: 'Updated profile', ...requestMeta(req) });
  return res.json({ user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role, tier: updated.tier, status: updated.status, portfolio_code: updated.portfolio_code, phone: updated.phone, kyc_status: updated.kyc_status, profile_data: updated.profile_data } });
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

// ─── Forgot Password (token stored in platform_data — no external email service) ───
router.post('/forgot-password', async (req, res) => {
  const parsed = z.object({ email: z.string().email().max(254) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'InvalidInput', message: 'البريد الإلكتروني غير صالح' });
  const email = parsed.data.email.toLowerCase().trim();
  // Always return 200 to prevent user enumeration
  const user = await prisma.user.findUnique({ where: { email } }).catch(() => null);
  if (user && user.status === 'active') {
    const token = randomUUID();
    const tokenKey = `pwd_reset_${createHash('sha256').update(email).digest('hex').slice(0, 24)}`;
    await prisma.platformData.upsert({
      where: { key: tokenKey },
      update: { value: { token: createHash('sha256').update(token).digest('hex'), email, expires: Date.now() + 3_600_000 } as any },
      create: { key: tokenKey, value: { token: createHash('sha256').update(token).digest('hex'), email, expires: Date.now() + 3_600_000 } as any },
    });
    await logAudit({ actor_email: email, user_id: user.id, action: 'طلب إعادة تعيين كلمة المرور', action_en: 'Password reset requested', ...requestMeta(req) }).catch(() => undefined);
    // In development, return the raw token so the super-admin can relay it manually
    if (config.nodeEnv !== 'production') {
      return res.json({ success: true, debug_token: token, debug_note: 'dev-only — not returned in production' });
    }
  }
  return res.json({ success: true, message: 'إذا كان البريد مسجلاً ونشطاً، أبلغ المشرف لإرسال رابط إعادة التعيين' });
});

router.post('/reset-password', async (req, res) => {
  const parsed = z.object({
    email: z.string().email().max(254),
    token: z.string().min(10).max(200),
    newPassword: z.string().min(8).max(128),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'InvalidInput', message: 'بيانات غير صالحة' });
  const { email, token, newPassword } = parsed.data;
  const tokenKey = `pwd_reset_${createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 24)}`;
  const entry = await prisma.platformData.findUnique({ where: { key: tokenKey } }).catch(() => null);
  const stored = entry?.value as any;
  if (!stored || Date.now() > stored.expires) return res.status(400).json({ error: 'TokenExpired', message: 'رمز إعادة التعيين منتهي الصلاحية أو غير صالح' });
  if (createHash('sha256').update(token).digest('hex') !== stored.token) return res.status(400).json({ error: 'InvalidToken', message: 'رمز إعادة التعيين غير صالح' });
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || user.status !== 'active') return res.status(404).json({ error: 'NotFound' });
  const password_hash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password_hash } }),
    prisma.platformData.delete({ where: { key: tokenKey } }),
    prisma.refreshSession.updateMany({ where: { user_id: user.id, revoked_at: null }, data: { revoked_at: new Date() } }),
  ]);
  await logAudit({ actor_email: email, user_id: user.id, action: 'إعادة تعيين كلمة المرور', action_en: 'Password reset completed', ...requestMeta(req) }).catch(() => undefined);
  return res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
});

// ─── Public Registration (gated by registration_open setting) ───
router.post('/register', async (req, res) => {
  try {
    const regSetting = await prisma.siteSetting.findUnique({ where: { key: 'registration_open' } });
    const isOpen = regSetting?.value === true
      || (typeof regSetting?.value === 'object' && (regSetting.value as any)?.value === true);
    if (!isOpen) return res.status(403).json({ error: 'RegistrationClosed', message: 'التسجيل الذاتي مغلق حالياً. تواصل مع الإدارة لفتح حساب.' });
    const parsed = z.object({
      email: z.string().email().max(254),
      name: z.string().min(2).max(100),
      phone: z.string().max(30).optional(),
      password: z.string().min(8).max(128),
      tier: z.string().max(30).default('Regular'),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'InvalidInput', details: parsed.error.issues });
    const { email, name, phone, password, tier } = parsed.data;
    const password_hash = await bcrypt.hash(password, 12);
    const client = await prisma.user.create({
      data: { email: email.toLowerCase(), name, phone, role: 'client', tier, status: 'pending', password_hash },
      select: { id: true, email: true, name: true, role: true, tier: true, status: true },
    });
    await logAudit({ actor_email: email, user_id: client.id, action: 'تسجيل عميل جديد', action_en: 'New client self-registration', ...requestMeta(req) }).catch(() => undefined);
    return res.status(201).json({ data: client, message: 'تم تسجيلك بنجاح. حسابك قيد المراجعة من قِبَل الإدارة.' });
  } catch (error: any) {
    if (error?.code === 'P2002') return res.status(409).json({ error: 'DuplicateEmail', message: 'البريد الإلكتروني مستخدم مسبقاً' });
    return res.status(500).json({ error: 'ServerError', message: 'تعذر إتمام التسجيل' });
  }
});

export default router;
