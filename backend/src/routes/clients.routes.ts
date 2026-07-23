import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { broadcastAdminUpdate, broadcastClientUpdate } from '../lib/socket.js';

const router = Router();

router.use(authenticateToken);

router.get('/', requireRole('super', 'admin', 'sub'), async (req: AuthRequest, res) => {
  try {
    const { search, status, tier } = req.query;
    const where: any = { role: 'client' };
    if (status) where.status = status;
    if (tier) where.tier = tier;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { portfolio_code: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const clients = await prisma.user.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 500,
      include: {
        portfolios: { take: 1, orderBy: { created_at: 'desc' } },
        _count: { select: { transactions: true, tickets: true } },
      },
    });
    res.json({ data: clients, count: clients.length });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

router.get('/:id', requireRole('super', 'admin', 'sub'), async (req: AuthRequest, res) => {
  try {
    const client = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        portfolios: { include: { assets: true } },
        transactions: { take: 20, orderBy: { created_at: 'desc' } },
        tickets: { take: 10, orderBy: { created_at: 'desc' } },
        meetings: { take: 10, orderBy: { meeting_date: 'desc' } },
      },
    });
    if (!client) return res.status(404).json({ error: 'NotFound' });
    res.json({ data: client });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

router.post('/', requireRole('super', 'admin'), async (req: AuthRequest, res) => {
  try {
    const { email, name, phone, tier = 'Regular', status = 'pending', password } = req.body;
    if (!email || !name) return res.status(400).json({ error: 'MissingFields' });

    const passwordHash = password ? await bcrypt.hash(password, 12) : null;

    const client = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name,
        phone,
        role: 'client',
        tier,
        status,
        password_hash: passwordHash,
      },
    });

    broadcastAdminUpdate({ action: 'client_created', clientId: client.id, email: client.email });
    res.status(201).json({ data: client, message: 'تم إنشاء العميل بنجاح' });
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'DuplicateEmail', message: 'البريد مستخدم مسبقاً' });
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

router.put('/:id', requireRole('super', 'admin', 'sub'), async (req: AuthRequest, res) => {
  try {
    const { name, tier, status, phone, kyc_status } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(tier && { tier }),
        ...(status && { status }),
        ...(phone !== undefined && { phone }),
        ...(kyc_status && { kyc_status }),
      },
    });

    broadcastAdminUpdate({ action: 'client_updated', clientId: updated.id });
    broadcastClientUpdate(updated.id, { action: 'client_updated', clientId: updated.id });

    res.json({ data: updated, message: 'تم التحديث' });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'NotFound' });
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

router.delete('/:id', requireRole('super'), async (req: AuthRequest, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    broadcastAdminUpdate({ action: 'client_deleted', clientId: req.params.id });
    broadcastClientUpdate(req.params.id, { action: 'client_deleted', clientId: req.params.id });
    res.json({ message: 'تم حذف العميل' });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'NotFound' });
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

export default router;
