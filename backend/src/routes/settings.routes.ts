import { Router } from 'express';
import { AuthRequest, authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { broadcastPublicUpdate } from '../lib/socket.js';

const router = Router();

// Only these settings are intentionally public. Operational and security
// settings remain protected and are never returned by the public API.
const PUBLIC_SETTING_KEYS = new Set(['platform_name', 'support_phone', 'support_email', 'maintenance_mode']);

// Public: get settings
router.get('/', async (_req, res) => {
  try {
    const settings = await prisma.siteSetting.findMany({ where: { key: { in: [...PUBLIC_SETTING_KEYS] } } });
    const result: Record<string, unknown> = {};
    for (const s of settings) result[s.key] = s.value;
    return res.json({ data: result });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر معالجة الطلب' : err.message });
  }
});

router.get('/:key', async (req, res) => {
  if (!PUBLIC_SETTING_KEYS.has(req.params.key)) return res.status(404).json({ error: 'NotFound' });
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: req.params.key } });
    if (!setting) return res.status(404).json({ error: 'NotFound' });
    return res.json({ data: setting.value });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر معالجة الطلب' : err.message });
  }
});

router.use(authenticateToken);

router.put('/:key', requirePermission('content:write'), async (req: AuthRequest, res) => {
  try {
    const { value, description } = req.body;
    const updated = await prisma.siteSetting.upsert({
      where: { key: req.params.key },
      update: {
        value: value ?? {},
        ...(description !== undefined && { description }),
        updated_by: req.user!.userId,
      },
      create: {
        key: req.params.key,
        value: value ?? {},
        description: description ?? '',
        updated_by: req.user!.userId,
      },
    });

    broadcastPublicUpdate('settings_updated', { key: req.params.key, value: updated.value });
    res.json({ data: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر معالجة الطلب' : err.message });
  }
});

export default router;
