import { Router } from 'express';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { broadcastAdminUpdate } from '../server.js';

const router = Router();

router.get('/:key', async (req, res) => {
  try {
    const section = await prisma.contentSection.findUnique({
      where: { section_key: req.params.key, is_active: true },
    });
    if (!section) return res.status(404).json({ error: 'NotFound', message: 'المحتوى غير موجود' });
    res.json({ data: section });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

router.get('/', requireRole('super', 'sub', 'admin'), async (req: AuthRequest, res) => {
  try {
    const sections = await prisma.contentSection.findMany({
      orderBy: { order_index: 'asc' },
    });
    res.json({ data: sections });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

router.put('/:key', requireRole('super'), async (req: AuthRequest, res) => {
  try {
    const { title_ar, title_en, content_ar, content_en, content_data, is_active, order_index } = req.body;
    const updated = await prisma.contentSection.update({
      where: { section_key: req.params.key },
      data: {
        ...(title_ar !== undefined && { title_ar }),
        ...(title_en !== undefined && { title_en }),
        ...(content_ar !== undefined && { content_ar }),
        ...(content_en !== undefined && { content_en }),
        ...(content_data !== undefined && { content_data }),
        ...(is_active !== undefined && { is_active }),
        ...(order_index !== undefined && { order_index }),
      },
    });
    broadcastAdminUpdate({ action: 'content_updated', key: updated.section_key });
    res.json({ data: updated, message: 'تم تحديث المحتوى' });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'NotFound' });
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
});

export default router;
