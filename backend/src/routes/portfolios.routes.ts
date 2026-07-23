import { Router } from 'express';
import { AuthRequest, authenticateToken, requirePermission, requireRole } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { broadcastAdminUpdate, broadcastClientUpdate } from '../lib/socket.js';

const router = Router();

router.use(authenticateToken);

// List portfolios with optional filters
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { user_id, search } = req.query;
    const where: any = {};
    if (user_id) where.user_id = user_id;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { name_en: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Clients can only see their own portfolios
    if (req.user!.role === 'client') {
      where.user_id = req.user!.userId;
    }

    const portfolios = await prisma.portfolio.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } }, assets: true },
      orderBy: { created_at: 'desc' },
      take: 200,
    });
    res.json({ data: portfolios, count: portfolios.length });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

// Get single portfolio
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, name: true, email: true } }, assets: true, transactions: { take: 20, orderBy: { created_at: 'desc' } } },
    });
    if (!portfolio) return res.status(404).json({ error: 'NotFound' });

    if (req.user!.role === 'client' && portfolio.user_id !== req.user!.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ data: portfolio });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

// Create portfolio (admin/super only)
router.post('/', requirePermission('portfolios:write'), async (req: AuthRequest, res) => {
  try {
    const { user_id, name, name_en, total_valuation, risk_profile, currency, growth_percent, portfolio_data, assets } = req.body;
    if (!user_id || !name) return res.status(400).json({ error: 'MissingFields' });

    const portfolio = await prisma.portfolio.create({
      data: {
        user_id,
        name,
        name_en,
        total_valuation: total_valuation ? parseFloat(total_valuation) : 0,
        risk_profile: risk_profile || 'balanced',
        currency: currency || 'SAR',
        growth_percent: growth_percent ? parseFloat(growth_percent) : 0,
        portfolio_data: portfolio_data || {},
        assets: {
          create: assets || [],
        },
      },
      include: { assets: true, user: { select: { id: true, name: true, email: true } } },
    });

    broadcastAdminUpdate({ action: 'portfolio_created', portfolioId: portfolio.id, clientId: portfolio.user_id });
    broadcastClientUpdate(portfolio.user_id, { action: 'portfolio_created', portfolioId: portfolio.id });

    res.status(201).json({ data: portfolio, message: 'تم إنشاء المحفظة بنجاح' });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

// Update portfolio
router.put('/:id', requirePermission('portfolios:write'), async (req: AuthRequest, res) => {
  try {
    const { name, name_en, total_valuation, risk_profile, currency, growth_percent, portfolio_data } = req.body;
    const updated = await prisma.portfolio.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(name_en !== undefined && { name_en }),
        ...(total_valuation !== undefined && { total_valuation: parseFloat(total_valuation) }),
        ...(risk_profile !== undefined && { risk_profile }),
        ...(currency !== undefined && { currency }),
        ...(growth_percent !== undefined && { growth_percent: parseFloat(growth_percent) }),
        ...(portfolio_data !== undefined && { portfolio_data }),
      },
      include: { assets: true, user: { select: { id: true, name: true, email: true } } },
    });

    broadcastAdminUpdate({ action: 'portfolio_updated', portfolioId: updated.id, clientId: updated.user_id });
    broadcastClientUpdate(updated.user_id, { action: 'portfolio_updated', portfolioId: updated.id });

    res.json({ data: updated, message: 'تم التحديث' });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'NotFound' });
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

// Delete portfolio
router.delete('/:id', requireRole('super'), async (req: AuthRequest, res) => {
  try {
    const portfolio = await prisma.portfolio.delete({
      where: { id: req.params.id },
    });
    broadcastAdminUpdate({ action: 'portfolio_deleted', portfolioId: req.params.id, clientId: portfolio.user_id });
    broadcastClientUpdate(portfolio.user_id, { action: 'portfolio_deleted', portfolioId: req.params.id });
    res.json({ message: 'تم حذف المحفظة' });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'NotFound' });
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

// Add/Update asset in portfolio
router.post('/:id/assets', requirePermission('portfolios:write'), async (req: AuthRequest, res) => {
  try {
    const portfolio = await prisma.portfolio.findUnique({ where: { id: req.params.id } });
    if (!portfolio) return res.status(404).json({ error: 'NotFound' });

    const { symbol, name, name_en, asset_class, weight_percent, quantity, avg_price, valuation, annual_yield, status } = req.body;
    if (!symbol || !name || !asset_class) return res.status(400).json({ error: 'MissingFields' });
    const asset = await prisma.asset.create({
      data: { portfolio_id: req.params.id, symbol, name, name_en, asset_class,
        weight_percent: Number(weight_percent || 0), quantity: Number(quantity || 0), avg_price: Number(avg_price || 0),
        valuation: Number(valuation || 0), annual_yield: Number(annual_yield || 0), status: status || 'active' },
    });

    broadcastAdminUpdate({ action: 'portfolio_asset_added', portfolioId: req.params.id, assetId: asset.id });
    broadcastClientUpdate(portfolio.user_id, { action: 'portfolio_updated', portfolioId: req.params.id });

    res.status(201).json({ data: asset });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

export default router;
