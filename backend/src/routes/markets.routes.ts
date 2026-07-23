import { Router } from 'express';

const router = Router();

router.get('/ticker', (_req, res) => {
  // بيانات تجريبية — في الإنتاج يجب الربط مع API أسواق حقيقي
  const tickerData = [
    { symbol: 'BTC/USD', name: 'Bitcoin', nameAr: 'بيتكوين', price: 67240, change: 2.4, changePercent: '+2.4%', isUp: true },
    { symbol: 'ETH/USD', name: 'Ethereum', nameAr: 'إيثيريوم', price: 3180, change: 1.8, isUp: true },
    { symbol: '2222.SR', name: 'Saudi Aramco', nameAr: 'أرامكو السعودية', price: 35.20, currency: 'SAR', change: -0.3, isUp: false },
    { symbol: 'XAU/USD', name: 'Gold', nameAr: 'الذهب', price: 2340, change: 0.9, isUp: true },
    { symbol: 'AAPL', name: 'Apple', price: 192.53, change: 0.8, isUp: true },
  ];

  res.json({
    data: tickerData,
    timestamp: new Date().toISOString(),
    source: 'Tharwah Market Data API',
    disclaimer: 'Mock data — integrate with real market API in production',
  });
});

export default router;
