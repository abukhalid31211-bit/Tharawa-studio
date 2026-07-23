import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

function generateTokens(user: any) {
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, tier: user.tier },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
  const refreshToken = jwt.sign(
    { sub: user.id },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn }
  );
  return { token, refreshToken };
}

async function verifySuperAdmin(email: string, password: string): Promise<boolean> {
  if (email.toLowerCase() !== config.superAdminEmail) return false;

  // If hash configured in ENV
  if (config.superAdminPasswordHash && config.superAdminSalt) {
    try {
      const result = await bcrypt.hash(password, config.superAdminSalt);
      return result === config.superAdminPasswordHash;
    } catch {
      return false;
    }
  }

  // If plain password configured for seed/setup only (not recommended for production)
  if (config.superAdminPlainPassword) {
    return password === config.superAdminPlainPassword;
  }

  return false;
}

// Client / Super Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'MissingFields', message: 'البريد وكلمة المرور مطلوبان' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check super admin
    if (await verifySuperAdmin(normalizedEmail, password)) {
      let superUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!superUser) {
        superUser = await prisma.user.create({
          data: {
            email: normalizedEmail,
            name: 'Super Admin',
            role: 'super',
            tier: 'VIP+',
            status: 'active',
          },
        });
      }
      const tokens = generateTokens(superUser);
      await prisma.subAdmin.upsert({
        where: { user_id: superUser.id },
        update: { last_active_at: new Date() },
        create: {
          user_id: superUser.id,
          name: superUser.name,
          email: superUser.email,
          permissions: JSON.stringify(['*']),
          status: 'active',
        },
      });
      return res.json({
        ...tokens,
        user: {
          id: superUser.id,
          email: superUser.email,
          name: superUser.name,
          role: superUser.role,
          tier: superUser.tier,
        },
      });
    }

    // Check regular user/client/sub-admin
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'InvalidCredentials', message: 'بيانات الدخول غير صحيحة' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: 'InvalidCredentials', message: 'الحساب غير مفعّل — تواصل مع الدعم' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'InvalidCredentials', message: 'بيانات الدخول غير صحيحة' });
    }

    const tokens = generateTokens(user);

    if (user.role === 'admin' || user.role === 'sub') {
      await prisma.subAdmin.updateMany({
        where: { user_id: user.id },
        data: { last_active_at: new Date() },
      });
    }

    return res.json({
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tier: user.tier,
      },
    });
  } catch (err: any) {
    console.error('[Auth Login Error]', err);
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

// Admin / Sub-admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'MissingFields', message: 'البريد وكلمة المرور مطلوبان' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Super admin
    if (await verifySuperAdmin(normalizedEmail, password)) {
      let superUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!superUser) {
        superUser = await prisma.user.create({
          data: {
            email: normalizedEmail,
            name: 'Super Admin',
            role: 'super',
            tier: 'VIP+',
            status: 'active',
          },
        });
      }
      const tokens = generateTokens(superUser);
      await prisma.subAdmin.upsert({
        where: { user_id: superUser.id },
        update: { last_active_at: new Date() },
        create: {
          user_id: superUser.id,
          name: superUser.name,
          email: superUser.email,
          permissions: JSON.stringify(['*']),
          status: 'active',
        },
      });
      return res.json({
        ...tokens,
        user: {
          id: superUser.id,
          email: superUser.email,
          name: superUser.name,
          role: 'super',
          tier: superUser.tier,
        },
      });
    }

    // Sub-admin / admin
    const subAdmin = await prisma.subAdmin.findUnique({
      where: { email: normalizedEmail },
      include: { user: true },
    });

    if (!subAdmin || subAdmin.status !== 'active' || !subAdmin.user) {
      return res.status(401).json({ error: 'InvalidCredentials', message: 'بيانات الدخول غير صحيحة' });
    }

    if (!subAdmin.user.password_hash) {
      return res.status(401).json({ error: 'InvalidCredentials', message: 'الحساب غير مفعّل — تواصل مع الدعم' });
    }

    const validPassword = await bcrypt.compare(password, subAdmin.user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'InvalidCredentials', message: 'بيانات الدخول غير صحيحة' });
    }

    const tokens = generateTokens(subAdmin.user);
    await prisma.subAdmin.update({
      where: { id: subAdmin.id },
      data: { last_active_at: new Date() },
    });

    return res.json({
      ...tokens,
      user: {
        id: subAdmin.user.id,
        email: subAdmin.user.email,
        name: subAdmin.user.name,
        role: subAdmin.user.role,
        tier: subAdmin.user.tier,
      },
    });
  } catch (err: any) {
    console.error('[Admin Login Error]', err);
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'NoRefreshToken' });

    const payload = jwt.verify(refreshToken, config.jwtRefreshSecret) as any;
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: 'UserNotFound' });

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, tier: user.tier },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.json({ token });
  } catch (err: any) {
    res.status(403).json({ error: 'InvalidRefreshToken', message: err.message });
  }
});

// Protected profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { portfolios: true },
    });
    if (!user) return res.status(404).json({ error: 'NotFound' });
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tier: user.tier,
        status: user.status,
        portfolio_code: user.portfolio_code,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

// Change password (admin/super)
router.post('/change-password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'InvalidInput', message: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل' });
    }

    // For super admin verify against ENV hash
    if (req.user!.role === 'super') {
      const valid = await verifySuperAdmin(req.user!.email, currentPassword);
      if (!valid) return res.status(401).json({ error: 'InvalidCurrentPassword' });
      // Cannot change ENV password via API — admin must update server ENV
      return res.status(403).json({ error: 'Forbidden', message: 'يجب تحديث كلمة مرور Super Admin من متغيرات البيئة على الخادم' });
    }

    res.status(501).json({ error: 'NotImplemented', message: 'تغيير كلمة المرور للمشرفين الفرعيين غير مفعل بعد' });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

export default router;
