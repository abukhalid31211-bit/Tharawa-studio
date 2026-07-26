import { Router } from 'express';
import { AuthRequest, authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const router = Router();
router.use(authenticateToken);
router.use(requirePermission('reports:read'));

function sinceFromPeriod(period: string): Date | undefined {
  const now = new Date();
  if (period === 'week') return new Date(now.getTime() - 7 * 86_400_000);
  if (period === 'month') return new Date(now.getTime() - 30 * 86_400_000);
  if (period === 'quarter') return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  if (period === 'year') return new Date(now.getFullYear(), 0, 1);
  return undefined; // 'all'
}

/**
 * GET /api/reports/summary
 * Server-side aggregated summary — replaces client-side computation in Reports page
 */
router.get('/summary', async (req: AuthRequest, res) => {
  try {
    const period = String(req.query.period || 'month');
    const since = sinceFromPeriod(period);
    const dateFilter = since ? { gte: since } : undefined;

    const [clientStats, portfolioAgg, txStats, txByType, txByStatus, ticketStats, auditCount] =
      await Promise.all([
        prisma.user.groupBy({ by: ['status', 'tier'], where: { role: 'client', ...(dateFilter ? { created_at: dateFilter } : {}) }, _count: true }),
        prisma.portfolio.aggregate({ _sum: { total_valuation: true }, _avg: { growth_percent: true }, where: { is_active: true } }),
        prisma.transaction.aggregate({ _sum: { amount: true }, _count: true, where: { ...(dateFilter ? { created_at: dateFilter } : {}) } }),
        prisma.transaction.groupBy({ by: ['type'], where: { ...(dateFilter ? { created_at: dateFilter } : {}) }, _count: true, _sum: { amount: true } }),
        prisma.transaction.groupBy({ by: ['status'], where: { ...(dateFilter ? { created_at: dateFilter } : {}) }, _count: true }),
        prisma.supportTicket.groupBy({ by: ['status', 'priority'], where: { ...(dateFilter ? { created_at: dateFilter } : {}) }, _count: true }),
        prisma.auditLog.count({ where: { ...(dateFilter ? { created_at: dateFilter } : {}) } }),
      ]);

    return res.json({
      data: {
        period,
        since: since?.toISOString() ?? null,
        clients: { byStatus: clientStats, totalNew: clientStats.reduce((s, g) => s + g._count, 0) },
        portfolios: { totalAum: Number(portfolioAgg._sum.total_valuation ?? 0), avgGrowth: Number(portfolioAgg._avg.growth_percent ?? 0) },
        transactions: { total: txStats._count, totalAmount: Number(txStats._sum.amount ?? 0), byType: txByType, byStatus: txByStatus },
        tickets: { byStatus: ticketStats, total: ticketStats.reduce((s, g) => s + g._count, 0) },
        auditEvents: auditCount,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر توليد التقرير' : err.message });
  }
});

/** GET /api/reports/clients — paginated client list for export */
router.get('/clients', async (_req: AuthRequest, res) => {
  try {
    const [clients, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: { role: 'client' },
        select: { id: true, email: true, name: true, phone: true, tier: true, status: true, kyc_status: true, portfolio_code: true, created_at: true },
        orderBy: { created_at: 'desc' },
        take: 1000,
      }),
      prisma.user.count({ where: { role: 'client' } }),
    ]);
    return res.json({ data: clients, total });
  } catch (err: any) {
    return res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر تحميل البيانات' : err.message });
  }
});

/** GET /api/reports/transactions — paginated transactions for export */
router.get('/transactions', async (req: AuthRequest, res) => {
  try {
    const period = String(req.query.period || 'all');
    const since = sinceFromPeriod(period);
    const where = since ? { created_at: { gte: since } } : {};
    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } }, portfolio: { select: { id: true, name: true } } },
        orderBy: { created_at: 'desc' },
        take: 1000,
      }),
      prisma.transaction.count({ where }),
    ]);
    return res.json({ data: transactions, total });
  } catch (err: any) {
    return res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر تحميل البيانات' : err.message });
  }
});

export default router;
