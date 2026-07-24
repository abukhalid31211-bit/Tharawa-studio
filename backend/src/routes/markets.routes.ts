import { Router } from 'express';
import { config } from '../config/env.js';

const router = Router();

type MarketQuote = {
  symbol: string;
  name: string;
  nameAr?: string;
  price: number;
  currency?: string;
  change: number;
  changePercent?: string;
  isUp: boolean;
};

function normalizeQuote(value: unknown): MarketQuote | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const symbol = String(item.symbol ?? item.ticker ?? '').trim();
  const price = Number(item.price ?? item.close ?? item.last);
  const change = Number(item.change ?? item.changeValue ?? 0);
  if (!symbol || !Number.isFinite(price) || !Number.isFinite(change)) return null;
  return {
    symbol,
    name: String(item.name ?? item.nameEn ?? symbol),
    ...(item.nameAr ? { nameAr: String(item.nameAr) } : {}),
    price,
    ...(item.currency ? { currency: String(item.currency) } : {}),
    change,
    changePercent: item.changePercent != null ? String(item.changePercent) : `${change >= 0 ? '+' : ''}${change}%`,
    isUp: change >= 0,
  };
}

/**
 * Returns live quotes from the configured provider.
 * The provider must return either an array of quote objects or { data: [...] }.
 * No fabricated market values are returned when the provider is unavailable.
 */
router.get('/ticker', async (_req, res) => {
  if (!config.marketDataUrl) {
    return res.status(503).json({
      error: 'MarketDataUnavailable',
      message: 'مزود بيانات الأسواق غير مضبوط',
      messageEn: 'Live market data provider is not configured',
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const url = new URL(config.marketDataUrl);
    if (config.marketDataApiKey) url.searchParams.set('api_key', config.marketDataApiKey);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'Tharwah-Capital/2.0' },
    });
    if (!response.ok) {
      return res.status(502).json({ error: 'MarketProviderError', message: 'تعذر الوصول إلى مزود بيانات الأسواق' });
    }
    const payload = await response.json() as unknown;
    const raw: unknown[] = Array.isArray(payload)
      ? payload
      : payload && typeof payload === 'object' && Array.isArray((payload as Record<string, unknown>).data)
        ? (payload as Record<string, unknown>).data as unknown[]
        : [];
    const data = raw.map((item: unknown) => normalizeQuote(item)).filter((quote: MarketQuote | null): quote is MarketQuote => quote !== null);
    if (!data.length) {
      return res.status(502).json({ error: 'InvalidMarketPayload', message: 'استجابة بيانات الأسواق غير صالحة' });
    }
    return res.json({ data, timestamp: new Date().toISOString(), source: 'configured-market-provider' });
  } catch (error) {
    console.error('[Market Data]', error);
    return res.status(502).json({ error: 'MarketProviderError', message: 'تعذر قراءة بيانات الأسواق' });
  } finally {
    clearTimeout(timeout);
  }
});

export default router;
