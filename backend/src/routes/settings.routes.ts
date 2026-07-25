import { Router } from 'express';
import { AuthRequest, authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { broadcastPublicUpdate } from '../lib/socket.js';

const router = Router();

// Only explicitly whitelisted settings are public. The route also supports the
// legacy aggregated `platform` object so existing seeded databases keep working
// while the admin panel progressively mirrors each field into dedicated keys.
const PUBLIC_SETTING_KEYS = [
  'platform_name',
  'platform_name_en',
  'support_phone',
  'support_email',
  'maintenance_mode',
  'contact_address_ar',
  'contact_address_en',
  'whatsapp_number',
  'business_hours_ar',
  'business_hours_en',
] as const;

const PUBLIC_SETTING_KEY_SET = new Set<string>(PUBLIC_SETTING_KEYS);

const LEGACY_PLATFORM_MAP: Record<string, string> = {
  platform_name: 'siteName',
  platform_name_en: 'siteNameEn',
  support_phone: 'supportPhone',
  support_email: 'supportEmail',
  maintenance_mode: 'maintenanceMode',
  contact_address_ar: 'contactAddressAr',
  contact_address_en: 'contactAddressEn',
  whatsapp_number: 'whatsappNumber',
  business_hours_ar: 'businessHoursAr',
  business_hours_en: 'businessHoursEn',
};

function legacyValue(platformSetting: unknown, publicKey: string) {
  if (!platformSetting || typeof platformSetting !== 'object' || Array.isArray(platformSetting)) return undefined;
  const legacyKey = LEGACY_PLATFORM_MAP[publicKey];
  return legacyKey ? (platformSetting as Record<string, unknown>)[legacyKey] : undefined;
}

async function publicSettingsSnapshot() {
  const records = await prisma.siteSetting.findMany({
    where: { key: { in: [...PUBLIC_SETTING_KEYS, 'platform'] } },
  });

  const legacyPlatform = records.find((record: any) => record.key === 'platform')?.value;
  const result: Record<string, unknown> = {};

  for (const key of PUBLIC_SETTING_KEYS) {
    const direct = records.find((record: any) => record.key === key)?.value;
    result[key] = direct ?? legacyValue(legacyPlatform, key) ?? null;
  }

  return result;
}

// Public: get settings
router.get('/', async (_req, res) => {
  try {
    return res.json({ data: await publicSettingsSnapshot() });
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'production' ? 'تعذر معالجة الطلب' : err.message });
  }
});

router.get('/:key', async (req, res) => {
  if (!PUBLIC_SETTING_KEY_SET.has(req.params.key)) return res.status(404).json({ error: 'NotFound' });
  try {
    const snapshot = await publicSettingsSnapshot();
    if (!(req.params.key in snapshot)) return res.status(404).json({ error: 'NotFound' });
    return res.json({ data: snapshot[req.params.key] });
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
