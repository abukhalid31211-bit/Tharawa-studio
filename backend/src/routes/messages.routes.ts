import { Router } from 'express';
import { z } from 'zod';
import { AuthRequest, authenticateToken, requireClientOrPermission, requirePermission } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { broadcastAdminUpdate, broadcastClientUpdate } from '../lib/socket.js';

const router = Router();

router.use(authenticateToken);

router.get('/', requireClientOrPermission('messages:read'), async (req: AuthRequest, res) => {
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
      include: { user: { select: { id: true, name: true, email: true } }, assignee: { select: { id: true, name: true } }, replies: { orderBy: { created_at: 'asc' } } },
      orderBy: { created_at: 'desc' },
      take: 500,
    });
    let data: any[] = tickets;
    // Public contact submissions are stored internally in PlatformData because
    // they do not have a registered user. Merge them into the same admin inbox
    // without exposing them to client accounts.
    if (req.user!.role !== 'client') {
      const contactStore = await prisma.platformData.findUnique({ where: { key: 'messages' } });
      const contactMessages = Array.isArray(contactStore?.value)
        ? (contactStore.value as any[])
          .filter(item => item?._source === 'contact')
          .filter(item => !status || item.status === status)
          .map(item => ({
            id: item.id,
            user_id: null,
            title: item.subject || 'Contact message',
            message: item.text || '',
            status: item.status || 'pending',
            priority: item.priority || 'medium',
            reply: item.replies?.at(-1)?.text || null,
            created_at: item.date || new Date().toISOString(),
            updated_at: item.date || new Date().toISOString(),
            user: { id: null, name: item._contactName || '', email: item._contactEmail || '' },
            replies: item.replies || [],
            _source: 'contact',
          }))
        : [];
      data = [...data, ...contactMessages].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 500);
    }
    return res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر معالجة الطلب' : err.message });
  }
});

router.get('/:id', requireClientOrPermission('messages:read'), async (req: AuthRequest, res) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, name: true, email: true } }, assignee: { select: { id: true, name: true } }, replies: { orderBy: { created_at: 'asc' } } },
    });
    if (!ticket) return res.status(404).json({ error: 'NotFound' });
    if (req.user!.role === 'client' && ticket.user_id !== req.user!.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json({ data: ticket });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر معالجة الطلب' : err.message });
  }
});

// Client creates ticket
router.post('/', requireClientOrPermission('messages:write'), async (req: AuthRequest, res) => {
  try {
    const { user_id: requestedUserId, title, message, priority } = req.body;
    const user_id = req.user!.role === 'client' ? req.user!.userId : requestedUserId;
    if (!user_id || typeof title !== 'string' || !title.trim() || title.length > 200 || typeof message !== 'string' || !message.trim() || message.length > 4000) {
      return res.status(400).json({ error: 'InvalidInput' });
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

    // مزامنة مع PlatformData 'messages' لتظهر في لوحة الإدارة → Messages panel
    try {
      const existing = await prisma.platformData.findUnique({ where: { key: 'messages' } });
      const currentMsgs: any[] = Array.isArray(existing?.value) ? (existing!.value as any[]) : [];
      const now = new Date();
      const newMsg = {
        id: ticket.id,
        clientId: ticket.user_id,
        subject: ticket.title,
        text: ticket.message,
        date: now.toISOString().slice(0, 10),
        status: 'pending',
        priority: ticket.priority || 'medium',
        replies: [],
        _ticketId: ticket.id,
        _source: 'client',
        _clientName: ticket.user?.name || '',
        _clientEmail: ticket.user?.email || '',
      };
      const updatedMsgs = [newMsg, ...currentMsgs.filter((m: any) => m.id !== ticket.id)];
      await prisma.platformData.upsert({
        where: { key: 'messages' },
        update: { value: updatedMsgs as any },
        create: { key: 'messages', value: updatedMsgs as any },
      });
    } catch (syncErr) {
      console.error('[Messages] Failed to sync ticket to PlatformData:', syncErr);
    }

    broadcastAdminUpdate({ action: 'message_created', ticketId: ticket.id, clientId: user_id });
    broadcastClientUpdate(user_id, { action: 'message_created', ticketId: ticket.id });

    res.status(201).json({ data: ticket, message: 'تم إرسال التذكرة' });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر معالجة الطلب' : err.message });
  }
});

// Admin replies / updates ticket
router.put('/:id', requirePermission('messages:write'), async (req: AuthRequest, res) => {
  try {
    const parsed = z.object({
      status: z.enum(['pending', 'answered', 'closed']).optional(),
      reply: z.string().max(4000).optional(),
      assigned_to: z.string().uuid().nullable().optional(),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'InvalidInput', details: parsed.error.flatten() });
    const { status, reply, assigned_to } = parsed.data;
    const messageId = String(req.params.id);
    if (messageId.startsWith('CT-')) {
      const store = await prisma.platformData.findUnique({ where: { key: 'messages' } });
      const messages = Array.isArray(store?.value) ? [...(store!.value as any[])] : [];
      const index = messages.findIndex(item => item?.id === messageId && item?._source === 'contact');
      if (index < 0) return res.status(404).json({ error: 'NotFound' });
      const current = messages[index];
      const replies = Array.isArray(current.replies) ? [...current.replies] : [];
      if (reply?.trim()) replies.push({ from: 'admin', sender_role: req.user!.role, text: reply.trim(), message: reply.trim(), date: new Date().toISOString(), created_at: new Date().toISOString() });
      messages[index] = { ...current, status: status || current.status, replies, updated_at: new Date().toISOString() };
      await prisma.platformData.update({ where: { key: 'messages' }, data: { value: messages as any } });
      broadcastAdminUpdate({ action: 'message_updated', messageId, source: 'contact' });
      return res.json({ data: messages[index], message: 'تم تحديث الرسالة' });
    }
    if (assigned_to) {
      const assignee = await prisma.user.findFirst({ where: { id: assigned_to, role: { in: ['super', 'admin', 'sub'] }, status: 'active' }, select: { id: true } });
      if (!assignee) return res.status(400).json({ error: 'InvalidAssignee' });
    }
    const updated = await prisma.$transaction(async (tx: any) => {
      const ticket = await tx.supportTicket.update({
        where: { id: req.params.id },
        data: {
          ...(status && { status }),
          ...(reply !== undefined && { reply }),
          ...(assigned_to && { assigned_to }),
        },
      });
      if (typeof reply === 'string' && reply.trim()) {
        await tx.ticketMessage.create({ data: { ticket_id: ticket.id, sender_id: req.user!.userId, sender_role: req.user!.role, message: reply.trim() } });
      }
      return tx.supportTicket.findUniqueOrThrow({
        where: { id: ticket.id },
        include: { user: { select: { id: true, name: true, email: true } }, replies: { orderBy: { created_at: 'asc' } } },
      });
    });

    broadcastAdminUpdate({ action: 'message_updated', ticketId: updated.id, clientId: updated.user_id });
    broadcastClientUpdate(updated.user_id, { action: 'message_updated', ticketId: updated.id });

    res.json({ data: updated, message: 'تم تحديث التذكرة' });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'NotFound' });
    res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر معالجة الطلب' : err.message });
  }
});

export default router;
