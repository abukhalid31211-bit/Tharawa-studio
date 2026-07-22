import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Client login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'MissingFields', message: 'البريد وكلمة المرور مطلوبان' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'InvalidCredentials', message: 'بيانات الدخول غير صحيحة' });
    }

    // Note: In production, compare with hashed password from PostgreSQL
    // This is a placeholder for the JWT flow
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

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tier: user.tier,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'MissingFields', message: 'البريد وكلمة المرور مطلوبان' });
    }

    const admin = await prisma.subAdmin.findFirst({
      where: { email },
      include: { user: true },
    });

    if (!admin || admin.status !== 'active') {
      return res.status(401).json({ error: 'InvalidCredentials', message: 'بيانات الدخول غير صحيحة' });
    }

    const token = jwt.sign(
      { sub: admin.user_id, email: admin.email, role: 'sub', permissions: admin.permissions },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.json({ token, user: { id: admin.user_id, email: admin.email, name: admin.name, role: 'sub' } });
  } catch (err: any) {
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

    const newToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, tier: user.tier },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.json({ token: newToken });
  } catch (err: any) {
    res.status(403).json({ error: 'InvalidRefreshToken', message: err.message });
  }
});

// Protected profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ error: 'NotFound' });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, tier: user.tier, status: user.status } });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

export default router;
