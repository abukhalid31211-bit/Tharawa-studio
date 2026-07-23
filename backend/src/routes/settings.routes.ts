import { Router } from 'express';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { broadcastPublicUpdate } from '../lib/socket.js';

const router = Router();

// Public: get settings
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.siteSetting.findMany();
    const result: Record<string, any> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    res.json({ data: result });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

router.get('/:key', async (req, res) => {
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: req.params.key } });
    if (!setting) return res.status(404).json({ error: 'NotFound' });
    res.json({ data: setting.value });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

router.use(authenticateToken);

router.put('/:key', requireRole('super', 'admin', 'sub'), async (req: AuthRequest, res) => {
  try {
    const { value, description } = req.body;
    const updated = await prisma.siteSetting.upsert({
      where: { key: req.params.key },
      update: {
        value: value || {},
        ...(description && { description }),
        updated_by: req.user!.userId,
      },
      create: {
        key: req.params.key,
        value: value || {},
        description: description || '',
        updated_by: req.user!.userId,
      },
    });

    broadcastPublicUpdate('settings_updated', { key: req.params.key, value: updated.value });
    res.json({ data: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

export default router;
