import React from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from '@tanstack/react-router';
import { TrendingUp, TrendingDown, ArrowLeft, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCmsSection } from '@/lib/cms';

interface MarketItem {
  id: string;
  name: string;
  nameEn: string;
  symbol: string;
  price: string;
  change: number;
  visible?: boolean;
}

interface MarketsContent {
  markets?: MarketItem[];
}

const FALLBACK_MARKETS: MarketItem[] = [
  { id: '1', name: 'تاسي (السعودية)', nameEn: 'TASI (Saudi Arabia)', symbol: 'TASI', price: '11,940.50', change: 0.8 },
  { id: '2', name: 'سوق دبي المالي', nameEn: 'DFM (Dubai)', symbol: 'DFMGI', price: '4,120.30', change: 1.2 },
  { id: '3', name: 'ناسداك (أمريكا)', nameEn: 'NASDAQ (US)', symbol: 'IXIC', price: '16,240.80', change: -0.4 },
  { id: '4', name: 'الذهب', nameEn: 'Gold', symbol: 'XAU/USD', price: '$2,345.10', change: 0.2 },
  { id: '5', name: 'بيتكوين', nameEn: 'Bitcoin', symbol: 'BTC/USD', price: '$68,450.00', change: 3.5 },
  { id: '6', name: 'برنت الخام', nameEn: 'Brent Crude', symbol: 'BZ', price: '$82.30', change: -1.1 },
];

export function MarketsPreview() {
  const { t, lang } = useLang();
  const { data: cms } = useCmsSection<MarketsContent>('markets', import.meta.env.DEV ? { markets: FALLBACK_MARKETS } : { markets: [] });
  const markets = (Array.isArray(cms.markets) ? cms.markets : (import.meta.env.DEV ? FALLBACK_MARKETS : [])).filter(m => m.visible !== false);

  return (
    <section className="py-24 bg-secondary dark:bg-[#13132A] relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="font-black text-[11px] text-gold-deep tracking-[0.2em] uppercase mb-4 block">
              {t('نظرة حية', 'LIVE OVERVIEW')}
            </span>
            <h2 className="font-black text-3xl md:text-4xl text-text-primary mb-4">
              {t('نبض الأسواق المالية', 'Financial Markets Pulse')}
            </h2>
            <p className="text-text-secondary text-sm md:text-base max-w-xl">
              {t('تابع أداء أهم الأسواق العالمية والمحلية لحظة بلحظة.', 'Monitor the performance of the most important global and local markets moment by moment.')}
            </p>
          </div>
          <Link to="/markets">
            <Button variant="secondary" className="gap-2">
              <Activity className="w-4 h-4" /> {t('عرض كل الأسواق', 'View All Markets')}
            </Button>
          </Link>
        </div>

        {markets.length === 0 ? (
          <Card className="p-8 text-center text-text-muted">
            {t('لا توجد بيانات أسواق منشورة حالياً', 'No market records are published yet')}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.map((m, i) => (
              <Card key={m.id} variant="interactive" className="p-6 flex flex-col justify-between h-full bg-primary group animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="font-bold text-lg text-text-primary mb-1 group-hover:text-gold-deep transition-colors">{lang === 'ar' ? m.name : m.nameEn}</div>
                    <div className="text-xs font-mono text-text-muted">{m.symbol}</div>
                  </div>
                  <div className={cn("flex items-center gap-1 rounded-sm px-2 py-1 text-[12px] font-mono font-bold", m.change >= 0 ? "bg-success-light text-success" : "bg-error-light text-error")}>
                    {m.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {m.change > 0 ? '+' : ''}{m.change}%
                  </div>
                </div>
                <div className="font-mono font-black text-2xl text-text-primary">{m.price}</div>
                <div className="mt-4 pt-4 border-t border-border-light text-[11px] text-text-muted text-center group-hover:text-gold-deep transition-colors">
                  {t('مؤشرات حية', 'Live Indicators')}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
