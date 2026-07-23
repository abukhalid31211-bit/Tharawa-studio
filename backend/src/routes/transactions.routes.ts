import { Router } from 'express';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { broadcastAdminUpdate, broadcastClientUpdate } from '../lib/socket.js';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { user_id, status, type } = req.query;
    const where: any = {};
    if (user_id) where.user_id = user_id;
    if (status) where.status = status;
    if (type) where.type = type;

    if (req.user!.role === 'client') {
      where.user_id = req.user!.userId;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } }, portfolio: { select: { id: true, name: true } } },
      orderBy: { created_at: 'desc' },
      take: 500,
    });
    res.json({ data: transactions, count: transactions.length });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: { user: true, portfolio: true },
    });
    if (!transaction) return res.status(404).json({ error: 'NotFound' });
    if (req.user!.role === 'client' && transaction.user_id !== req.user!.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json({ data: transaction });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

// Client can create pending transaction (deposit/withdrawal request)
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { user_id, portfolio_id, type, amount, currency, method, notes } = req.body;
    if (!user_id || !type || !amount) return res.status(400).json({ error: 'MissingFields' });

    // Client can only create for themselves
    if (req.user!.role === 'client' && user_id !== req.user!.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        user_id,
        portfolio_id: portfolio_id || null,
        type,
        amount: parseFloat(amount),
        currency: currency || 'SAR',
        method: method || '',
        status: 'pending',
        notes: notes || '',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    broadcastAdminUpdate({ action: 'transaction_created', transactionId: transaction.id, clientId: user_id });
    broadcastClientUpdate(user_id, { action: 'transaction_created', transactionId: transaction.id });

    res.status(201).json({ data: transaction, message: 'تم إنشاء الطلب وهو قيد المراجعة' });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

// Admin updates transaction status
router.put('/:id', requireRole('super', 'admin', 'sub'), async (req: AuthRequest, res) => {
  try {
    const { status, notes } = req.body;
    const updated = await prisma.transaction.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    broadcastAdminUpdate({ action: 'transaction_updated', transactionId: updated.id, clientId: updated.user_id, status });
    broadcastClientUpdate(updated.user_id, { action: 'transaction_updated', transactionId: updated.id, status });

    res.json({ data: updated, message: 'تم تحديث المعاملة' });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'NotFound' });
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

export default router;
