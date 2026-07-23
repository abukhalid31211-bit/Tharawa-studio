import { Router } from 'express';
import { AuthRequest, authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { broadcastAdminUpdate, broadcastClientUpdate } from '../lib/socket.js';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { user_id, advisor_id } = req.query;
    const where: any = {};
    if (user_id) where.user_id = user_id;
    if (advisor_id) where.advisor_id = advisor_id;

    if (req.user!.role === 'client') {
      where.user_id = req.user!.userId;
    }

    const meetings = await prisma.meeting.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } }, advisor: { select: { id: true, name: true } } },
      orderBy: { meeting_date: 'asc' },
      take: 500,
    });
    res.json({ data: meetings });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { user_id: requestedUserId, advisor_id, advisor_name, meeting_date, meeting_time, duration_minutes, type, notes } = req.body;
    const user_id = req.user!.role === 'client' ? req.user!.userId : requestedUserId;
    if (!user_id || !meeting_date || typeof meeting_time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d(?:\s?[AP]M)?$/i.test(meeting_time)) {
      return res.status(400).json({ error: 'InvalidInput' });
    }

    const meeting = await prisma.meeting.create({
      data: {
        user_id,
        advisor_id: advisor_id || null,
        advisor_name: advisor_name || 'مستشار ثروة كابيتال',
        meeting_date: new Date(meeting_date),
        meeting_time,
        duration_minutes: duration_minutes ? parseInt(duration_minutes) : 60,
        type: type || 'consultation',
        notes: notes || '',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    broadcastAdminUpdate({ action: 'meeting_created', meetingId: meeting.id, clientId: user_id });
    broadcastClientUpdate(user_id, { action: 'meeting_created', meetingId: meeting.id });

    res.status(201).json({ data: meeting, message: 'تم حجز الموعد' });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

router.put('/:id', requirePermission('messages:write'), async (req: AuthRequest, res) => {
  try {
    const { status, advisor_id, advisor_name, notes } = req.body;
    const updated = await prisma.meeting.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(advisor_id && { advisor_id }),
        ...(advisor_name && { advisor_name }),
        ...(notes !== undefined && { notes }),
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    broadcastAdminUpdate({ action: 'meeting_updated', meetingId: updated.id, clientId: updated.user_id });
    broadcastClientUpdate(updated.user_id, { action: 'meeting_updated', meetingId: updated.id });

    res.json({ data: updated });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'NotFound' });
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

router.delete('/:id', requirePermission('messages:write'), async (req: AuthRequest, res) => {
  try {
    const meeting = await prisma.meeting.delete({ where: { id: req.params.id } });
    broadcastAdminUpdate({ action: 'meeting_deleted', meetingId: req.params.id, clientId: meeting.user_id });
    broadcastClientUpdate(meeting.user_id, { action: 'meeting_deleted', meetingId: req.params.id });
    res.json({ message: 'تم حذف الموعد' });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'NotFound' });
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

export default router;
