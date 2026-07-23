import { Router } from 'express';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { broadcastClientUpdate, broadcastAdminUpdate } from '../lib/socket.js';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const where: any = {};
    if (req.user!.role === 'client') {
      where.OR = [{ user_id: req.user!.userId }, { user_id: null }];
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 200,
    });
    res.json({ data: notifications });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

router.post('/:id/read', async (req: AuthRequest, res) => {
  try {
    const where: any = { id: req.params.id };
    if (req.user!.role === 'client') {
      where.OR = [{ user_id: req.user!.userId }, { user_id: null }];
    }

    const updated = await prisma.notification.updateMany({
      where,
      data: { is_read: true },
    });
    res.json({ data: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

// Admin creates notification (broadcast or targeted)
router.post('/', requireRole('super', 'admin', 'sub'), async (req: AuthRequest, res) => {
  try {
    const { user_id, title, title_en, message, message_en, type, action_url } = req.body;
    if (!title || !message) return res.status(400).json({ error: 'MissingFields' });

    const notification = await prisma.notification.create({
      data: {
        user_id: user_id || null,
        title,
        title_en,
        message,
        message_en,
        type: type || 'info',
        action_url,
      },
    });

    if (user_id) {
      broadcastClientUpdate(user_id, { action: 'notification_created', notificationId: notification.id });
    } else {
      broadcastAdminUpdate({ action: 'notification_broadcast', notificationId: notification.id });
    }

    res.status(201).json({ data: notification });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

export default router;
