import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// Public home payload assembled from internal PostgreSQL content only.
// It intentionally returns empty collections when the administrator has not
// published content yet; it never invents financial or market values.
router.get('/', async (_req, res) => {
  try {
    const [sections, settings] = await Promise.all([
      prisma.contentSection.findMany({
        where: { is_active: true, section_key: { in: ['hero', 'services', 'markets', 'testimonials', 'about', 'faq', 'privacy'] } },
        orderBy: { order_index: 'asc' },
        select: { section_key: true, title_ar: true, title_en: true, content_ar: true, content_en: true, content_data: true, order_index: true },
      }),
      prisma.siteSetting.findMany({
        where: { key: { in: ['platform_name', 'support_phone', 'support_email', 'maintenance_mode'] } },
        select: { key: true, value: true },
      }),
    ]);

    const content: Record<string, unknown> = {};
    for (const section of sections) content[section.section_key] = section;
    const publicSettings: Record<string, unknown> = {};
    for (const setting of settings) publicSettings[setting.key] = setting.value;

    return res.json({ data: { content, settings: publicSettings } });
  } catch (error) {
    console.error('[Home Data]', error);
    return res.status(503).json({ error: 'HomeDataUnavailable', data: { content: {}, settings: {} } });
  }
});

export default router;
