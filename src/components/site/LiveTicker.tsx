import React, { useEffect, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCmsSection } from '@/lib/cms';

export function LiveTicker() {
  const { lang } = useLang();
  const [isPaused, setIsPaused] = useState(false);
  const { data: managed } = useCmsSection<any>('markets', { markets: [] });
  const sourceItems = Array.isArray(managed.markets) ? managed.markets.filter((item: any) => item.visible !== false).map((item: any, index: number) => ({
    id: item.id || index, nameAr: item.name, nameEn: item.nameEn, symbol: item.symbol, price: item.price,
    change: `${Number(item.change) >= 0 ? '+' : ''}${item.change}%`, isUp: Number(item.change) >= 0,
  })) : [];
  const items = [...sourceItems, ...sourceItems];

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
