import { Router } from 'express';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { broadcastAdminUpdate } from '../server.js';

const router = Router();

// All routes protected
router.use(authenticateToken);

router.get('/', requireRole('super', 'sub', 'admin'), async (req: AuthRequest, res) => {
  try {
    const clients = await prisma.user.findMany({
      where: { role: 'client' },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
    res.json({ data: clients, count: clients.length });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

router.get('/:id', requireRole('super', 'sub', 'admin'), async (req: AuthRequest, res) => {
  try {
    const client = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { portfolios: true, transactions: { take: 10, orderBy: { created_at: 'desc' } } },
    });
    if (!client) return res.status(404).json({ error: 'NotFound' });
    res.json({ data: client });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

router.post('/', requireRole('super'), async (req: AuthRequest, res) => {
  try {
    const { email, name, tier = 'Regular', status = 'pending' } = req.body;
    if (!email || !name) return res.status(400).json({ error: 'MissingFields' });

    const client = await prisma.user.create({
      data: { email, name, role: 'client', tier, status },
    });

    broadcastAdminUpdate({ action: 'client_created', clientId: client.id, email: client.email });
    res.status(201).json({ data: client, message: 'تم إنشاء العميل بنجاح' });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

router.put('/:id', requireRole('super', 'sub'), async (req: AuthRequest, res) => {
  try {
    const { name, tier, status } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(tier && { tier }), ...(status && { status }) },
    });
    broadcastAdminUpdate({ action: 'client_updated', clientId: updated.id });
    res.json({ data: updated, message: 'تم التحديث' });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

router.delete('/:id', requireRole('super'), async (req: AuthRequest, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    broadcastAdminUpdate({ action: 'client_deleted', clientId: req.params.id });
    res.json({ message: 'تم حذف العميل' });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

export default router;
