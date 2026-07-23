import { Router } from 'express';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRole('super', 'admin'));

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
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

export default router;
