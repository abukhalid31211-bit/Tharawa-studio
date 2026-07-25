import React from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Users, Briefcase, Globe, Award } from 'lucide-react';
import { usePublicStats } from '@/lib/queries';

function formatAum(value: number) {
  if (value >= 1_000_000_000) return `+${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `+${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `+${Math.round(value / 1_000)}K`;
  return `+${Math.round(value)}`;
}

export function StatsSection() {
  const { t } = useLang();
  const { data } = usePublicStats();
  const stats = (data as any)?.data;

  const cards = [
    { icon: Users, num: stats?.activeClients ? `+${stats.activeClients.toLocaleString()}` : '—', labelAr: 'مستثمر نشط', labelEn: 'Active Investors' },
    { icon: Briefcase, num: typeof stats?.totalAum === 'number' ? formatAum(stats.totalAum) : '—', labelAr: 'أصول مُدارة', labelEn: 'Assets Under Management' },
    { icon: Globe, num: stats?.visibleMarkets ? `${stats.visibleMarkets}+` : '—', labelAr: 'سوق ظاهر', labelEn: 'Visible Markets' },
    { icon: Award, num: stats?.activePortfolios ? `+${stats.activePortfolios.toLocaleString()}` : '—', labelAr: 'محفظة نشطة', labelEn: 'Active Portfolios' },
  ];

  return (
    <section className="py-20 bg-secondary dark:bg-[#13132A] border-y border-border-light relative">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center">
          {cards.map((stat, i) => (
            <div key={i} className="flex flex-col items-center justify-center space-y-3 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="w-12 h-12 rounded-full bg-gold-subtle flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-gold-deep" />
              </div>
              <div className="font-mono font-black text-4xl text-text-primary">{stat.num}</div>
              <div className="font-semibold text-sm text-text-muted uppercase tracking-wider">{t(stat.labelAr, stat.labelEn)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
