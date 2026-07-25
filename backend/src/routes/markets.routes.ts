import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// Public market data is maintained internally by the admin CMS. No external
// provider or generated values are used here.
router.get('/ticker', async (_req, res) => {
  try {
    const section = await prisma.contentSection.findUnique({ where: { section_key: 'markets' } });
    const value = section?.is_active ? section.content_data : null;
    const markets = value && typeof value === 'object' && !Array.isArray(value)
      ? (value as { markets?: unknown }).markets
      : null;
    const data = Array.isArray(markets) ? markets : [];
    return res.json({ data, timestamp: new Date().toISOString(), source: 'internal-postgresql' });
  } catch (error) {
    console.error('[Markets Ticker]', error);
    return res.status(503).json({ error: 'MarketDataUnavailable', data: [] });
  }
});

export default router;
