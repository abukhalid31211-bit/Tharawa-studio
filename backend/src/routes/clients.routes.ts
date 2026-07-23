import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AuthRequest, authenticateToken, requirePermission, requireRole } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { broadcastAdminUpdate, broadcastClientUpdate } from '../lib/socket.js';
import { logAudit } from '../lib/audit.js';

const router = Router();
const idSchema = z.string().uuid();
const createSchema = z.object({
  email: z.string().email().max(254), name: z.string().min(2).max(100), phone: z.string().max(30).optional(),
  tier: z.string().max(30).default('Regular'), status: z.enum(['pending', 'active', 'suspended']).default('pending'),
  password: z.string().min(8).max(128).optional(), profile_data: z.unknown().optional(),
}).passthrough();
const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(), tier: z.string().max(30).optional(),
  status: z.enum(['pending', 'active', 'suspended']).optional(), phone: z.string().max(30).nullable().optional(),
  kyc_status: z.enum(['pending', 'review', 'verified', 'rejected']).optional(), profile_data: z.unknown().optional(),
}).passthrough();

const safeUser = {
  id: true, email: true, name: true, role: true, tier: true, status: true, portfolio_code: true,
  phone: true, kyc_status: true, profile_data: true, created_at: true, updated_at: true,
} as const;

router.use(authenticateToken);

router.get('/', requirePermission('clients:read'), async (req: AuthRequest, res) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.slice(0, 100) : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const tier = typeof req.query.tier === 'string' ? req.query.tier : undefined;
    const take = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const where: any = { role: 'client' };
    if (status) where.status = status;
    if (tier) where.tier = tier;
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }, { portfolio_code: { contains: search, mode: 'insensitive' } }];
    const [clients, count] = await prisma.$transaction([
      prisma.user.findMany({ where, orderBy: { created_at: 'desc' }, take, select: { ...safeUser, portfolios: { take: 1, orderBy: { created_at: 'desc' }, select: { id: true, total_valuation: true, growth_percent: true } }, _count: { select: { transactions: true, tickets: true } } } }),
      prisma.user.count({ where }),
    ]);
    return res.json({ data: clients, count });
  } catch (error) {
    console.error('[Clients List]', error);
    return res.status(500).json({ error: 'ServerError', message: 'تعذر تحميل العملاء' });
  }
});

router.get('/:id', requirePermission('clients:read'), async (req: AuthRequest, res) => {
  if (!idSchema.safeParse(req.params.id).success) return res.status(400).json({ error: 'InvalidId' });
  const client = await prisma.user.findFirst({
    where: { id: req.params.id, role: 'client' }, select: { ...safeUser,
      portfolios: { include: { assets: true } }, transactions: { take: 50, orderBy: { created_at: 'desc' } },
      tickets: { take: 20, orderBy: { created_at: 'desc' }, include: { replies: { orderBy: { created_at: 'asc' } } } },
      meetings: { take: 20, orderBy: { meeting_date: 'desc' } },
    },
  });
  if (!client) return res.status(404).json({ error: 'NotFound' });
  return res.json({ data: client });
});

router.post('/', requirePermission('clients:write'), async (req: AuthRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'InvalidInput', details: parsed.error.issues });
  try {
    const { email, name, phone, tier, status, password, profile_data } = parsed.data;
    const client = await prisma.user.create({ data: { email: email.toLowerCase(), name, phone, role: 'client', tier, status, password_hash: password ? await bcrypt.hash(password, 12) : null, profile_data: (profile_data || {}) as any }, select: safeUser });
    broadcastAdminUpdate({ action: 'client_created', clientId: client.id });
    await logAudit({ actor_email: req.user!.email, user_id: req.user!.userId, action: 'إنشاء عميل', action_en: 'Created client', resource_type: 'client', resource_id: client.id, ip_address: req.ip, user_agent: req.get('user-agent') });
    return res.status(201).json({ data: client, message: 'تم إنشاء العميل بنجاح' });
  } catch (error: any) {
    if (error?.code === 'P2002') return res.status(409).json({ error: 'DuplicateEmail', message: 'البريد مستخدم مسبقاً' });
    return res.status(500).json({ error: 'ServerError', message: 'تعذر إنشاء العميل' });
  }
});

router.put('/:id', requirePermission('clients:write'), async (req: AuthRequest, res) => {
  if (!idSchema.safeParse(req.params.id).success) return res.status(400).json({ error: 'InvalidId' });
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'InvalidInput', details: parsed.error.issues });
  const existing = await prisma.user.findFirst({ where: { id: req.params.id, role: 'client' } });
  if (!existing) return res.status(404).json({ error: 'NotFound' });
  const updated = await prisma.user.update({ where: { id: existing.id }, data: parsed.data as any, select: safeUser });
  broadcastAdminUpdate({ action: 'client_updated', clientId: updated.id });
  broadcastClientUpdate(updated.id, { action: 'client_updated' });
  await logAudit({ actor_email: req.user!.email, user_id: req.user!.userId, action: 'تحديث عميل', action_en: 'Updated client', resource_type: 'client', resource_id: updated.id, details: parsed.data as any, ip_address: req.ip, user_agent: req.get('user-agent') });
  return res.json({ data: updated, message: 'تم التحديث' });
});

// The visible delete action archives the client to preserve the advisory and financial history.
router.delete('/:id', requireRole('super'), async (req: AuthRequest, res) => {
  const clientId = String(req.params.id);
  if (!idSchema.safeParse(clientId).success) return res.status(400).json({ error: 'InvalidId' });
  const result = await prisma.user.updateMany({ where: { id: clientId, role: 'client' }, data: { status: 'suspended' } });
  if (!result.count) return res.status(404).json({ error: 'NotFound' });
  await prisma.refreshSession.updateMany({ where: { user_id: clientId, revoked_at: null }, data: { revoked_at: new Date() } });
  broadcastAdminUpdate({ action: 'client_archived', clientId });
  broadcastClientUpdate(clientId, { action: 'client_archived' });
  await logAudit({ actor_email: req.user!.email, user_id: req.user!.userId, action: 'أرشفة عميل', action_en: 'Archived client', resource_type: 'client', resource_id: clientId, ip_address: req.ip, user_agent: req.get('user-agent') });
  return res.json({ message: 'تمت أرشفة العميل' });
});

export default router;
