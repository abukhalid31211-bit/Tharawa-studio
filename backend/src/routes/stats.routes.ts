import { Router } from 'express';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/public', async (_req, res) => {
  try {
    const [
      activeClients,
      portfolioAgg,
      activePortfolios,
      marketsSection,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'client', status: 'active' } }),
      prisma.portfolio.aggregate({ _sum: { total_valuation: true }, where: { is_active: true } }),
      prisma.portfolio.count({ where: { is_active: true } }),
      prisma.contentSection.findUnique({ where: { section_key: 'markets' }, select: { content_data: true, is_active: true } }),
    ]);

    const markets = marketsSection?.is_active && marketsSection.content_data && typeof marketsSection.content_data === 'object' && !Array.isArray(marketsSection.content_data)
      ? (marketsSection.content_data as { markets?: unknown }).markets
      : [];

    const visibleMarkets = Array.isArray(markets)
      ? markets.filter((item: any) => item?.visible !== false).length
      : 0;

    return res.json({
      data: {
        activeClients,
        totalAum: Number(portfolioAgg._sum.total_valuation ?? 0),
        activePortfolios,
        visibleMarkets,
      },
    });
  } catch (err: any) {
    console.error('[Public Stats]', err);
    return res.status(500).json({
      error: 'ServerError',
      message: process.env.NODE_ENV === 'production' ? 'تعذر جلب الإحصائيات العامة' : err.message,
    });
  }
});

router.use(authenticateToken);

/**
 * GET /api/stats/overview
 * Real aggregated statistics for the admin Overview dashboard.
 * Replaces all hardcoded chart constants (AUM_DATA, REVENUE_DATA, DISTRIBUTION).
 */
router.get('/overview', requireRole('super', 'admin', 'sub'), async (_req: AuthRequest, res) => {
  try {
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 3600 * 1000);

    const [
      clientGroups,
      portfolioAgg,
      txGroups,
      pendingMessages,
      recentTxs,
      assetDist,
      profitableCount,
      neutralCount,
      lossCount,
    ] = await Promise.all([
      prisma.user.groupBy({ by: ['status'], where: { role: 'client' }, _count: true }),
      prisma.portfolio.aggregate({
        _sum: { total_valuation: true },
        _avg: { growth_percent: true },
        where: { is_active: true },
      }),
      prisma.transaction.groupBy({ by: ['status'], _count: true }),
      prisma.supportTicket.count({ where: { status: 'pending' } }),
      prisma.transaction.findMany({
        where: { created_at: { gte: oneYearAgo } },
        select: { amount: true, created_at: true, status: true, type: true },
        orderBy: { created_at: 'asc' },
      }),
      prisma.asset.groupBy({
        by: ['asset_class'],
        _sum: { valuation: true },
        orderBy: { _sum: { valuation: 'desc' } },
      }),
      prisma.portfolio.count({ where: { is_active: true, growth_percent: { gt: 5 } } }),
      prisma.portfolio.count({ where: { is_active: true, growth_percent: { gte: -5, lte: 5 } } }),
      prisma.portfolio.count({ where: { is_active: true, growth_percent: { lt: -5 } } }),
    ]);

    // ── Client counts ─────────────────────────────────────
    const totalClients = clientGroups.reduce((s: number, g: any) => s + g._count, 0);
    const activeClients = clientGroups.find((g: any) => g.status === 'active')?._count ?? 0;
    const pendingClients = clientGroups.find((g: any) => g.status === 'pending')?._count ?? 0;

    // ── AUM ───────────────────────────────────────────────
    const totalAUM = Number(portfolioAgg._sum.total_valuation ?? 0);
    const avgGrowth = Math.round(Number(portfolioAgg._avg.growth_percent ?? 0) * 100) / 100;

    // ── Transaction counts ────────────────────────────────
    const totalTransactions = txGroups.reduce((s: number, g: any) => s + g._count, 0);
    const pendingTransactions = txGroups.find((g: any) => g.status === 'pending')?._count ?? 0;
    const completedTransactions = txGroups.find((g: any) => g.status === 'completed')?._count ?? 0;

    // ── Last-12-month labels ──────────────────────────────
    const now = new Date();
    const monthLabels: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthLabels.push(d.toLocaleDateString('en-US', { month: 'short' }));
    }

    // Group completed transactions by month
    const monthlyDeposit: Record<string, number> = {};
    const monthlyWithdraw: Record<string, number> = {};
    for (const label of monthLabels) { monthlyDeposit[label] = 0; monthlyWithdraw[label] = 0; }

    for (const tx of recentTxs) {
      if (tx.status !== 'completed') continue;
      const label = (tx.created_at as Date).toLocaleDateString('en-US', { month: 'short' });
      if (!(label in monthlyDeposit)) continue;
      const amount = Number(tx.amount);
      if (tx.type === 'deposit') monthlyDeposit[label] += amount;
      else if (tx.type === 'withdrawal' || tx.type === 'withdraw') monthlyWithdraw[label] += amount;
    }

    // AUM trend: approximate by working forward from (currentAUM − totalNetInPeriod)
    const totalNetInPeriod = monthLabels.reduce((s, m) => s + monthlyDeposit[m] - monthlyWithdraw[m], 0);
    let cumNet = 0;
    const aumByMonth = monthLabels.map((month) => {
      const net = monthlyDeposit[month] - monthlyWithdraw[month];
      const approxAUM = Math.max(totalAUM - totalNetInPeriod + cumNet + net, 0);
      cumNet += net;
      return { month, aum: Math.round(approxAUM / 1_000_000 * 10) / 10 };
    });

    // Revenue by month (last 6) — deposit volume × 2% management fee approximation
    const revenueByMonth = monthLabels.slice(-6).map((month) => {
      const volume = monthlyDeposit[month];
      return {
        month,
        revenue: Math.round(volume / 1_000),
        profit: Math.round(volume * 0.02 / 1_000),
      };
    });

    // Asset class distribution
    const totalAssets = assetDist.reduce((s: number, g: any) => s + Number(g._sum.valuation ?? 0), 0);
    const COLORS = ['#0EA5E9', '#C9A84C', '#F59E0B', '#00D97E', '#8B5CF6', '#EC4899'];
    const distribution = assetDist.slice(0, 6).map((g: any, i: number) => ({
      name: g.asset_class,
      nameEn: g.asset_class,
      value: Number(g._sum.valuation ?? 0),
      pct: totalAssets > 0 ? Math.round((Number(g._sum.valuation ?? 0) / totalAssets) * 100) : 0,
      color: COLORS[i % COLORS.length],
    }));

    // ── Portfolio health ──────────────────────────────────────
    const totalHealthPortfolios = profitableCount + neutralCount + lossCount;
    const portfolioHealth = {
      profitable: profitableCount,
      neutral: neutralCount,
      loss: lossCount,
      total: totalHealthPortfolios,
      profitablePct: totalHealthPortfolios > 0 ? Math.round((profitableCount / totalHealthPortfolios) * 100) : 0,
      neutralPct: totalHealthPortfolios > 0 ? Math.round((neutralCount / totalHealthPortfolios) * 100) : 0,
      lossPct: totalHealthPortfolios > 0 ? Math.round((lossCount / totalHealthPortfolios) * 100) : 0,
    };

    // ── Activity heatmap from transaction timestamps (7 days × 8 three-hour buckets) ──
    // Rows: [0,3,6,9,12,15,18,21] → bucket = Math.floor(hour/3). Cols: day 0=Sun … 6=Sat.
    const heatmapRaw: number[][] = Array.from({ length: 7 }, () => Array(8).fill(0));
    for (const tx of recentTxs) {
      const d = new Date(tx.created_at as Date);
      heatmapRaw[d.getDay()][Math.floor(d.getHours() / 3)]++;
    }
    const heatmapMax = Math.max(...heatmapRaw.flat(), 1);
    const heatmap = heatmapRaw.map(row => row.map(v => Math.round((v / heatmapMax) * 100)));

    return res.json({
      data: {
        totalClients, activeClients, pendingClients,
        totalAUM, avgGrowth,
        totalTransactions, pendingTransactions, completedTransactions,
        pendingMessages,
        aumByMonth, revenueByMonth, distribution,
        portfolioHealth, heatmap,
      },
    });
  } catch (err: any) {
    console.error('[Stats Overview]', err);
    return res.status(500).json({
      error: 'ServerError',
      message: process.env.NODE_ENV === 'production' ? 'تعذر جلب الإحصائيات' : err.message,
    });
  }
});

export default router;
