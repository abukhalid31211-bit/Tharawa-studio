import { Router } from 'express';
import { z } from 'zod';
import { AuthRequest, authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { broadcastClientUpdate, broadcastAdminUpdate, getIo } from '../lib/socket.js';

const router = Router();
router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const isClient = req.user!.role === 'client';
    const notifications = await prisma.notification.findMany({
      where: isClient ? { OR: [{ user_id: req.user!.userId }, { user_id: null }] } : {},
      include: isClient ? { receipts: { where: { user_id: req.user!.userId }, select: { read_at: true } } } : undefined,
      orderBy: { created_at: 'desc' }, take: 200,
    });
    return res.json({ data: notifications.map((item: any) => ({ ...item, is_read: isClient ? !!item.receipts?.[0]?.read_at : item.is_read, receipts: undefined })) });
  } catch (error) {
    console.error('[Notifications List]', error);
    return res.status(500).json({ error: 'ServerError', message: 'تعذر تحميل الإشعارات' });
  }
});

router.post('/:id/read', async (req: AuthRequest, res) => {
  if (!z.string().uuid().safeParse(req.params.id).success) return res.status(400).json({ error: 'InvalidId' });
  const notification = await prisma.notification.findFirst({ where: { id: req.params.id, OR: [{ user_id: req.user!.userId }, { user_id: null }] } });
  if (!notification && req.user!.role === 'client') return res.status(404).json({ error: 'NotFound' });
  if (req.user!.role === 'client') {
    const receipt = await prisma.notificationReceipt.upsert({
      where: { uq_notification_user: { notification_id: req.params.id, user_id: req.user!.userId } },
      update: { read_at: new Date() }, create: { notification_id: req.params.id, user_id: req.user!.userId, read_at: new Date() },
    });
    return res.json({ data: receipt });
  }
  const updated = await prisma.notification.update({ where: { id: req.params.id }, data: { is_read: true } });
  return res.json({ data: updated });
});

router.post('/', requirePermission('messages:write'), async (req: AuthRequest, res) => {
  const parsed = z.object({
    user_id: z.string().uuid().nullable().optional(), title: z.string().min(1).max(200), title_en: z.string().max(200).optional(),
    message: z.string().min(1).max(2000), message_en: z.string().max(2000).optional(), type: z.string().max(30).optional(), action_url: z.string().max(500).optional(),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'InvalidInput', details: parsed.error.issues });
  const notification = await prisma.notification.create({ data: { ...parsed.data, user_id: parsed.data.user_id || null, type: parsed.data.type || 'info' } });
  if (notification.user_id) broadcastClientUpdate(notification.user_id, { action: 'notification_created', notificationId: notification.id });
  else {
    getIo().emit('client_update', { timestamp: new Date().toISOString(), type: 'data_changed', data: { action: 'notification_created', notificationId: notification.id } });
    broadcastAdminUpdate({ action: 'notification_broadcast', notificationId: notification.id });
  }
  return res.status(201).json({ data: notification });
});

export default router;
