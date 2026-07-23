import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest, authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { broadcastAdminUpdate, broadcastPublicUpdate } from '../lib/socket.js';
import { logAudit } from '../lib/audit.js';

const router = Router();
const keySchema = z.string().min(1).max(120).regex(/^[a-zA-Z0-9_-]+$/);
const bodySchema = z.object({ value: z.unknown() });

const cmsKeys: Record<string, string> = {
  tharwah_cms_hero_v2: 'hero',
  tharwah_cms_services_v2: 'services',
  tharwah_cms_markets_v2: 'markets',
  tharwah_cms_faq_v2: 'faq',
  tharwah_cms_testimonials_v2: 'testimonials',
  tharwah_cms_about_v2: 'about',
  tharwah_cms_design_v2: 'design',
  tharwah_cms_privacy_v2: 'privacy',
};

router.use(authenticateToken);

function platformPermission(mode: 'read' | 'write') {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const key = String(req.params.key || '');
    const section = key.includes('clients') ? 'clients'
      : key.includes('portfolios') ? 'portfolios'
      : key.includes('transactions') ? 'transactions'
      : key.includes('messages') || key.includes('notifications') || key.includes('events') ? 'messages'
      : key.includes('cms_') ? 'content'
      : key.includes('reports') ? 'reports'
      : 'platform';
    return requirePermission(`${section}:${mode}`)(req, res, next);
  };
}

router.get('/:key', platformPermission('read'), async (req: AuthRequest, res) => {
  const parsedKey = keySchema.safeParse(req.params.key);
  if (!parsedKey.success) return res.status(400).json({ error: 'InvalidKey' });

  try {
    const cmsSection = cmsKeys[parsedKey.data];
    if (cmsSection) {
      const content = await prisma.contentSection.findUnique({ where: { section_key: cmsSection } });
      return res.json({ data: content?.content_data ?? null });
    }

    const entry = await prisma.platformData.findUnique({ where: { key: parsedKey.data } });
    return res.json({ data: entry?.value ?? null });
  } catch (error) {
    console.error('[Platform Data Read]', error);
    return res.status(500).json({ error: 'ServerError', message: 'تعذر قراءة البيانات' });
  }
});

router.put('/:key', platformPermission('write'), async (req: AuthRequest, res) => {
  const parsedKey = keySchema.safeParse(req.params.key);
  const parsedBody = bodySchema.safeParse(req.body);
  if (!parsedKey.success || !parsedBody.success) return res.status(400).json({ error: 'InvalidInput' });

  try {
    const cmsSection = cmsKeys[parsedKey.data];
    if (cmsSection) {
      const content = await prisma.contentSection.upsert({
        where: { section_key: cmsSection },
        update: { content_data: parsedBody.data.value as any, updated_by: req.user!.userId },
        create: {
          section_key: cmsSection,
          content_data: parsedBody.data.value as any,
          updated_by: req.user!.userId,
          is_active: true,
        },
      });
      broadcastPublicUpdate('content_updated', { key: cmsSection });
      broadcastAdminUpdate({ action: 'content_updated', key: cmsSection });
      await logAudit({
        actor_email: req.user!.email,
        user_id: req.user!.userId,
        action: `تحديث محتوى ${cmsSection}`,
        action_en: `Updated ${cmsSection} content`,
        resource_type: 'content',
        resource_id: content.id,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
      });
      return res.json({ data: content.content_data });
    }

    const entry = await prisma.platformData.upsert({
      where: { key: parsedKey.data },
      update: { value: parsedBody.data.value as any, updated_by: req.user!.userId },
      create: { key: parsedKey.data, value: parsedBody.data.value as any, updated_by: req.user!.userId },
    });
    broadcastAdminUpdate({ action: 'platform_data_updated', key: entry.key });
    await logAudit({
      actor_email: req.user!.email,
      user_id: req.user!.userId,
      action: `تحديث بيانات ${entry.key}`,
      action_en: `Updated platform data ${entry.key}`,
      resource_type: 'platform_data',
      resource_id: entry.key,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });
    return res.json({ data: entry.value });
  } catch (error) {
    console.error('[Platform Data Write]', error);
    return res.status(500).json({ error: 'ServerError', message: 'تعذر حفظ البيانات' });
  }
});

export default router;
