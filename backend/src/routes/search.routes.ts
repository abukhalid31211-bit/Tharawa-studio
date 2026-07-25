import { Router } from 'express';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRole('super', 'admin', 'sub'));

router.get('/', async (req: AuthRequest, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 50) : '';
  if (!q || q.length < 2) return res.json({ data: [] });

  try {
    const [clients, portfolios, transactions, messages] = await Promise.all([
      // Clients
      prisma.user.findMany({
        where: {
          role: 'client',
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
            { portfolio_code: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: { id: true, name: true, email: true, tier: true, status: true, portfolio_code: true },
      }),
      // Portfolios
      prisma.portfolio.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { name_en: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
        include: { user: { select: { name: true } } },
      }),
      // Transactions
      prisma.transaction.findMany({
        where: {
          OR: [
            { reference_code: { contains: q, mode: 'insensitive' } },
            { notes: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
        include: { user: { select: { name: true } } },
      }),
      // Messages (Support Tickets)
      prisma.supportTicket.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { message: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
        include: { user: { select: { name: true } } },
      }),
    ]);

    const results = [
      ...clients.map(c => ({
        type: 'client',
        id: c.id,
        title: c.name,
        subtitle: `${c.email} | ${c.portfolio_code || 'No Code'}`,
        badge: c.tier,
        to: `/Akadmin/clients/${c.id}`,
      })),
      ...portfolios.map(p => ({
        type: 'portfolio',
        id: p.id,
        title: p.name,
        subtitle: `Client: ${p.user.name} | SAR ${Number(p.total_valuation).toLocaleString()}`,
        to: `/Akadmin/portfolios`,
      })),
      ...transactions.map(t => ({
        type: 'transaction',
        id: t.id,
        title: `TX: ${t.type.toUpperCase()} - SAR ${Number(t.amount).toLocaleString()}`,
        subtitle: `Client: ${t.user.name} | ${t.status}`,
        to: `/Akadmin/transactions`,
      })),
      ...messages.map(m => ({
        type: 'message',
        id: m.id,
        title: m.title,
        subtitle: `From: ${m.user.name} | Status: ${m.status}`,
        to: `/Akadmin/messages`,
      })),
    ];

    return res.json({ data: results });
  } catch (error) {
    console.error('[Search Error]', error);
    return res.status(500).json({ error: 'ServerError' });
  }
});

export default router;
