import { Router } from 'express';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { broadcastAdminUpdate, broadcastClientUpdate } from '../lib/socket.js';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { user_id, status } = req.query;
    const where: any = {};
    if (user_id) where.user_id = user_id;
    if (status) where.status = status;

    if (req.user!.role === 'client') {
      where.user_id = req.user!.userId;
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } }, assignee: { select: { id: true, name: true } } },
      orderBy: { created_at: 'desc' },
      take: 500,
    });
    res.json({ data: tickets });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: { user: true, assignee: true },
    });
    if (!ticket) return res.status(404).json({ error: 'NotFound' });
    if (req.user!.role === 'client' && ticket.user_id !== req.user!.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json({ data: ticket });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

// Client creates ticket
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { user_id, title, message, priority } = req.body;
    if (!user_id || !title || !message) return res.status(400).json({ error: 'MissingFields' });

    if (req.user!.role === 'client' && user_id !== req.user!.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        user_id,
        title,
        message,
        priority: priority || 'medium',
        status: 'pending',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    broadcastAdminUpdate({ action: 'message_created', ticketId: ticket.id, clientId: user_id });
    broadcastClientUpdate(user_id, { action: 'message_created', ticketId: ticket.id });

    res.status(201).json({ data: ticket, message: 'تم إرسال التذكرة' });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

// Admin replies / updates ticket
router.put('/:id', requireRole('super', 'admin', 'sub'), async (req: AuthRequest, res) => {
  try {
    const { status, reply, assigned_to } = req.body;
    const updated = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(reply !== undefined && { reply }),
        ...(assigned_to && { assigned_to }),
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    broadcastAdminUpdate({ action: 'message_updated', ticketId: updated.id, clientId: updated.user_id });
    broadcastClientUpdate(updated.user_id, { action: 'message_updated', ticketId: updated.id });

    res.json({ data: updated, message: 'تم تحديث التذكرة' });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'NotFound' });
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

export default router;
