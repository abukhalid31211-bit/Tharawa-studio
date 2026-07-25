import { Router } from 'express';
import { AuthRequest, authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.use(authenticateToken);
router.use(requirePermission('reports:read'));

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { actor, action, limit = '100' } = req.query;
    const where: any = {};
    if (actor) where.actor_email = { contains: actor as string, mode: 'insensitive' };
    if (action) where.action = { contains: action as string, mode: 'insensitive' };

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: parseInt(limit as string),
      include: { user: { select: { id: true, name: true } } },
    });
    res.json({ data: logs });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر معالجة الطلب' : err.message });
  }
});

router.get('/login-attempts', async (req: AuthRequest, res) => {
  try {
    const { email, result, limit = '100' } = req.query;
    const where: any = {};
    if (email) where.email = { contains: email as string, mode: 'insensitive' };
    if (result) where.result = result;

    const attempts = await prisma.loginAttempt.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: parseInt(limit as string),
    });
    res.json({ data: attempts });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر معالجة الطلب' : err.message });
  }
});

export default router;
