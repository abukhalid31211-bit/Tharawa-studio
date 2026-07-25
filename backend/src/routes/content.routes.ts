import { Router } from 'express';
import { AuthRequest, authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { broadcastAdminUpdate, broadcastPublicUpdate } from '../lib/socket.js';

const router = Router();

router.get('/:key', async (req, res) => {
  try {
    const section = await prisma.contentSection.findUnique({
      where: { section_key: req.params.key },
    });
    if (!section || !section.is_active) return res.status(404).json({ error: 'NotFound', message: 'المحتوى غير موجود' });
    res.json({ data: section });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر معالجة الطلب' : err.message });
  }
});

router.get('/', authenticateToken, requirePermission('content:read'), async (_req: AuthRequest, res) => {
  try {
    const sections = await prisma.contentSection.findMany({
      orderBy: { order_index: 'asc' },
    });
    res.json({ data: sections });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر معالجة الطلب' : err.message });
  }
});

router.put('/:key', authenticateToken, requirePermission('content:write'), async (req: AuthRequest, res) => {
  try {
    const { title_ar, title_en, content_ar, content_en, content_data, is_active, order_index } = req.body;
    const updated = await prisma.contentSection.upsert({
      where: { section_key: req.params.key },
      update: {
        ...(title_ar !== undefined && { title_ar }),
        ...(title_en !== undefined && { title_en }),
        ...(content_ar !== undefined && { content_ar }),
        ...(content_en !== undefined && { content_en }),
        ...(content_data !== undefined && { content_data }),
        ...(is_active !== undefined && { is_active }),
        ...(order_index !== undefined && { order_index }),
        updated_by: req.user!.userId,
      },
      create: {
        section_key: req.params.key,
        title_ar,
        title_en,
        content_ar,
        content_en,
        content_data: content_data || {},
        is_active: is_active !== undefined ? is_active : true,
        order_index: order_index || 0,
        updated_by: req.user!.userId,
      },
    });

    broadcastAdminUpdate({ action: 'content_updated', key: updated.section_key });
    broadcastPublicUpdate('content_updated', { key: updated.section_key, data: updated });

    res.json({ data: updated, message: 'تم تحديث المحتوى' });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر معالجة الطلب' : err.message });
  }
});

export default router;
