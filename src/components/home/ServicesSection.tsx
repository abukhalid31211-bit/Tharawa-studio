import React from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Link } from '@tanstack/react-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TrendingUp, Globe, Bitcoin, Building2, Gem, Fuel, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCmsSection } from '@/lib/cms';

const ICON_MAP: Record<string, React.ElementType> = {
  '📊': TrendingUp,
  '🕌': Building2,
  '🌍': Globe,
  '🤖': TrendingUp,
  '👨‍💼': Building2,
  '🎓': TrendingUp,
  TrendingUp,
  Globe,
  Bitcoin,
  Building2,
  Gem,
  Fuel,
};

interface ServiceItem {
  id: string;
  icon: string;
  title: string;
  titleEn: string;
  desc: string;
  descEn: string;
  active?: boolean;
}

interface ServicesContent {
  title?: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  services?: ServiceItem[];
}

const FALLBACK_SERVICES: ServiceItem[] = [
  { id: 'gulf-stocks', icon: 'TrendingUp', title: 'الأسهم الخليجية والعربية', titleEn: 'Gulf & Arab Equities', desc: 'استثمر في أسواق السعودية والإمارات والكويت. نوفر لك تحليلات دقيقة وأدوات متقدمة.', descEn: 'Invest in Saudi, UAE, and Kuwait markets.' },
  { id: 'global-stocks', icon: 'Globe', title: 'الأسهم العالمية', titleEn: 'Global Equities', desc: 'وصول مباشر إلى وول ستريت، ناسداك، والأسواق الأوروبية والآسيوية.', descEn: 'Direct access to Wall Street, Nasdaq, European and Asian markets.' },
  { id: 'crypto', icon: 'Bitcoin', title: 'العملات الرقمية', titleEn: 'Cryptocurrencies', desc: 'تداول البيتكوين والإيثيريوم والأصول الرقمية بأمان تام.', descEn: 'Trade Bitcoin, Ethereum, and digital assets safely.' },
  { id: 'funds', icon: 'Building2', title: 'صناديق الاستثمار', titleEn: 'Investment Funds', desc: 'اختر من بين باقة متنوعة من صناديق الاستثمار المشتركة وETFs.', descEn: 'Choose from mutual funds and ETFs.' },
  { id: 'metals', icon: 'Gem', title: 'المعادن والذهب', titleEn: 'Metals & Gold', desc: 'الملاذ الآمن لأموالك. استثمر في عقود الذهب والفضة والبلاتين.', descEn: 'Safe haven investment in Gold, Silver, and Platinum.' },
  { id: 'energy', icon: 'Fuel', title: 'النفط والطاقة', titleEn: 'Oil & Energy', desc: 'شارك في قطاع الطاقة الحيوي. تداول عقود النفط والغاز.', descEn: 'Participate in the vital energy sector.' },
];

const FALLBACK_CONTENT: ServicesContent = {
  title: 'خدماتنا الاستثمارية',
  titleEn: 'OUR INVESTMENT SERVICES',
  subtitle: 'نوّع محفظتك وحقق أهدافك المالية',
  subtitleEn: 'Diversify Your Portfolio & Achieve Financial Goals',
  services: FALLBACK_SERVICES,
};

function getIcon(iconName: string): React.ElementType {
  return ICON_MAP[iconName] || Building2;
}

export function ServicesSection() {
  const { t, lang } = useLang();
  const { data: cms } = useCmsSection<ServicesContent>('services', FALLBACK_CONTENT);

  const title = lang === 'ar' ? (cms.title || FALLBACK_CONTENT.title) : (cms.titleEn || FALLBACK_CONTENT.titleEn);
  const subtitle = lang === 'ar' ? (cms.subtitle || FALLBACK_CONTENT.subtitle) : (cms.subtitleEn || FALLBACK_CONTENT.subtitleEn);
  const services = (cms.services || FALLBACK_CONTENT.services!).filter(s => s.active !== false);

  return (
    <section className="py-24 bg-primary dark:bg-elevated relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4">
          <span className="font-black text-[11px] text-gold-deep tracking-[0.2em] uppercase mb-4 block">
            {title}
          </span>
          <h2 className="font-black text-3xl md:text-4xl text-text-primary mb-6">
            {subtitle}
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            {t('نقدم مجموعة متكاملة من الحلول الاستثمارية المصممة بعناية لتناسب مختلف مستويات المخاطر والتطلعات المالية.', 'We offer a comprehensive suite of carefully designed investment solutions to suit different risk levels and financial aspirations.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv, idx) => {
            const Icon = getIcon(srv.icon);
            return (
              <Card key={srv.id} variant="interactive" className="p-8 group animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="w-14 h-14 bg-gold-subtle rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold-primary transition-colors duration-300">
                  <Icon className="w-7 h-7 text-gold-deep group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-bold text-xl text-text-primary mb-3 group-hover:text-gold-dark transition-colors">
                  {lang === 'ar' ? srv.title : srv.titleEn}
                </h3>
                <p className="text-sm text-text-secondary mb-6 leading-relaxed line-clamp-3">
                  {lang === 'ar' ? srv.desc : srv.descEn}
                </p>
                <Link to={`/service/$id`} params={{ id: srv.id }} className="inline-flex items-center gap-2 font-bold text-[14px] text-gold-deep group-hover:text-gold-dark">
                  {t('اكتشف المزيد', 'Explore More')} <ArrowLeft className={cn("w-4 h-4 transition-transform", lang === 'ar' ? "group-hover:-translate-x-1" : "rotate-180 group-hover:translate-x-1")} />
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
