import { Router } from 'express';
import { z } from 'zod';
import { AuthRequest, authenticateToken, requireClientOrPermission, requirePermission, requireRole } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { broadcastAdminUpdate, broadcastClientUpdate } from '../lib/socket.js';

const idSchema = z.string().uuid();
const createPortfolioSchema = z.object({
  user_id: z.string().uuid(),
  name: z.string().min(2).max(200),
  name_en: z.string().max(200).optional(),
  total_valuation: z.coerce.number().min(0).default(0),
  risk_profile: z.string().max(40).default('balanced'),
  currency: z.string().max(10).default('SAR'),
  growth_percent: z.coerce.number().default(0),
  portfolio_data: z.unknown().optional(),
  assets: z.array(z.unknown()).optional(),
});
const updatePortfolioSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  name_en: z.string().max(200).optional(),
  total_valuation: z.coerce.number().min(0).optional(),
  risk_profile: z.string().max(40).optional(),
  currency: z.string().max(10).optional(),
  growth_percent: z.coerce.number().optional(),
  portfolio_data: z.unknown().optional(),
});
const assetSchema = z.object({
  symbol: z.string().max(30),
  name: z.string().max(200),
  name_en: z.string().max(200).optional(),
  asset_class: z.string().max(60),
  weight_percent: z.coerce.number().default(0),
  quantity: z.coerce.number().default(0),
  avg_price: z.coerce.number().default(0),
  valuation: z.coerce.number().default(0),
  annual_yield: z.coerce.number().default(0),
  status: z.string().max(30).default('active'),
});

const router = Router();

router.use(authenticateToken);

// List portfolios with optional filters
router.get('/', requireClientOrPermission('portfolios:read'), async (req: AuthRequest, res) => {
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
    res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر معالجة الطلب' : err.message });
  }
});

// Get single portfolio
router.get('/:id', requireClientOrPermission('portfolios:read'), async (req: AuthRequest, res) => {
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
    res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر معالجة الطلب' : err.message });
  }
});

// Create portfolio (admin/super only)
router.post('/', requirePermission('portfolios:write'), async (req: AuthRequest, res) => {
  try {
    const parsed = createPortfolioSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'InvalidInput', details: parsed.error.flatten() });
    const { user_id, name, name_en, total_valuation, risk_profile, currency, growth_percent, portfolio_data, assets } = parsed.data;

    const portfolio = await prisma.portfolio.create({
      data: {
        user_id,
        name,
        name_en,
        total_valuation: total_valuation ?? 0,
        risk_profile: risk_profile || 'balanced',
        currency: currency || 'SAR',
        growth_percent: growth_percent ?? 0,
        portfolio_data: portfolio_data || {},
        assets: { create: (assets as any[]) || [] },
      },
      include: { assets: true, user: { select: { id: true, name: true, email: true } } },
    });

    broadcastAdminUpdate({ action: 'portfolio_created', portfolioId: portfolio.id, clientId: portfolio.user_id });
    broadcastClientUpdate(portfolio.user_id, { action: 'portfolio_created', portfolioId: portfolio.id });

    res.status(201).json({ data: portfolio, message: 'تم إنشاء المحفظة بنجاح' });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر معالجة الطلب' : err.message });
  }
});

// Update portfolio
router.put('/:id', requirePermission('portfolios:write'), async (req: AuthRequest, res) => {
  try {
    if (!idSchema.safeParse(req.params.id).success) return res.status(400).json({ error: 'InvalidId' });
    const parsed = updatePortfolioSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'InvalidInput', details: parsed.error.flatten() });
    const { name, name_en, total_valuation, risk_profile, currency, growth_percent, portfolio_data } = parsed.data;
    const updated = await prisma.portfolio.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(name_en !== undefined && { name_en }),
        ...(total_valuation !== undefined && { total_valuation }),
        ...(risk_profile !== undefined && { risk_profile }),
        ...(currency !== undefined && { currency }),
        ...(growth_percent !== undefined && { growth_percent }),
        ...(portfolio_data !== undefined && { portfolio_data }),
      },
      include: { assets: true, user: { select: { id: true, name: true, email: true } } },
    });

    broadcastAdminUpdate({ action: 'portfolio_updated', portfolioId: updated.id, clientId: updated.user_id });
    broadcastClientUpdate(updated.user_id, { action: 'portfolio_updated', portfolioId: updated.id });

    res.json({ data: updated, message: 'تم التحديث' });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'NotFound' });
    res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر معالجة الطلب' : err.message });
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
    res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر معالجة الطلب' : err.message });
  }
});

// Add/Update asset in portfolio
router.post('/:id/assets', requirePermission('portfolios:write'), async (req: AuthRequest, res) => {
  try {
    const portfolio = await prisma.portfolio.findUnique({ where: { id: req.params.id } });
    if (!portfolio) return res.status(404).json({ error: 'NotFound' });

    const parsed = assetSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'InvalidInput', details: parsed.error.flatten() });
    const { symbol, name, name_en, asset_class, weight_percent, quantity, avg_price, valuation, annual_yield, status } = parsed.data;
    const asset = await prisma.asset.create({
      data: { portfolio_id: req.params.id, symbol, name, name_en, asset_class,
        weight_percent, quantity, avg_price, valuation, annual_yield, status },
    });

    broadcastAdminUpdate({ action: 'portfolio_asset_added', portfolioId: req.params.id, assetId: asset.id });
    broadcastClientUpdate(portfolio.user_id, { action: 'portfolio_updated', portfolioId: req.params.id });

    res.status(201).json({ data: asset });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر معالجة الطلب' : err.message });
  }
});

export default router;
