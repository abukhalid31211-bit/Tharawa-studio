import React, { useEffect, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const TICKER_ITEMS = [
  { id: 1, nameAr: 'بيتكوين', nameEn: 'Bitcoin', symbol: 'BTC/USD', price: '$71,240', change: '+2.4%', isUp: true },
  { id: 2, nameAr: 'إيثيريوم', nameEn: 'Ethereum', symbol: 'ETH/USD', price: '$3,850', change: '+1.8%', isUp: true },
  { id: 3, nameAr: 'أرامكو', nameEn: 'Saudi Aramco', symbol: '2222.SR', price: '32.15 SAR', change: '-0.4%', isUp: false },
  { id: 4, nameAr: 'سابك', nameEn: 'SABIC', symbol: '2010.SR', price: '85.40 SAR', change: '+0.2%', isUp: true },
  { id: 5, nameAr: 'الذهب', nameEn: 'Gold', symbol: 'XAU/USD', price: '$2,340', change: '+0.9%', isUp: true },
  { id: 6, nameAr: 'برنت الخام', nameEn: 'Brent Crude', symbol: 'BZ', price: '$82.50', change: '-1.2%', isUp: false },
  { id: 7, nameAr: 'أبل', nameEn: 'Apple', symbol: 'AAPL', price: '$190.15', change: '+0.5%', isUp: true },
  { id: 8, nameAr: 'جوجل', nameEn: 'Google', symbol: 'GOOGL', price: '$175.40', change: '+1.1%', isUp: true },
  { id: 9, nameAr: 'الفضة', nameEn: 'Silver', symbol: 'XAG/USD', price: '$28.30', change: '-0.3%', isUp: false },
  { id: 10, nameAr: 'إمارات NBD', nameEn: 'Emirates NBD', symbol: 'ENBD', price: '16.80 AED', change: '+0.8%', isUp: true },
];

export function LiveTicker() {
  const { lang } = useLang();
  const [isPaused, setIsPaused] = useState(false);
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="w-full h-[42px] bg-secondary border-y border-border-gold/30 overflow-hidden relative flex items-center">
      <div className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-secondary to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-l from-secondary to-transparent z-10 pointer-events-none" />
      
      <div 
        className={cn(
          "flex items-center min-w-max",
          lang === 'ar' ? "animate-[ticker-scroll-ar_35s_linear_infinite]" : "animate-[ticker-scroll-en_35s_linear_infinite]"
        )}
        style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {items.map((item, index) => (
          <div key={`${item.id}-${index}`} className="flex items-center gap-3 px-6 hover:scale-102 hover:opacity-100 opacity-70 transition-all duration-200 cursor-default">
            <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", item.isUp ? "bg-success-light" : "bg-error-light")}>
              {item.isUp ? <TrendingUp className="w-3 h-3 text-success" /> : <TrendingDown className="w-3 h-3 text-error" />}
            </div>
            <div className="font-bold text-[13px] text-text-primary whitespace-nowrap">{lang === 'ar' ? item.nameAr : item.nameEn}</div>
            <div className="font-mono text-[13px] text-text-secondary whitespace-nowrap">{item.price}</div>
            <div className={cn("font-mono font-bold text-[12px] whitespace-nowrap", item.isUp ? "text-success" : "text-error")}>
              {item.isUp ? '▲' : '▼'} {item.change}
            </div>
            <div className="w-[1px] h-4 bg-border-light mx-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
