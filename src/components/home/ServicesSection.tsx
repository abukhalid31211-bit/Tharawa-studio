import React from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Link } from '@tanstack/react-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TrendingUp, Globe, Bitcoin, Building2, Gem, Fuel, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ServicesSection() {
  const { t, lang } = useLang();

  const services = [
    {
      id: 'gulf-stocks',
      icon: TrendingUp,
      titleAr: 'الأسهم الخليجية والعربية',
      titleEn: 'Gulf & Arab Equities',
      descAr: 'استثمر في أسواق السعودية والإمارات والكويت. نوفر لك تحليلات دقيقة وأدوات متقدمة لاقتناص الفرص في أسرع الأسواق نمواً.',
      descEn: 'Invest in Saudi, UAE, and Kuwait markets. We provide accurate analysis and advanced tools to seize opportunities.',
    },
    {
      id: 'global-stocks',
      icon: Globe,
      titleAr: 'الأسهم العالمية',
      titleEn: 'Global Equities',
      descAr: 'وصول مباشر إلى وول ستريت، ناسداك، والأسواق الأوروبية والآسيوية. نوّع محفظتك بأسهم كبرى الشركات التقنية والطبية.',
      descEn: 'Direct access to Wall Street, Nasdaq, European and Asian markets. Diversify your portfolio with major tech and medical stocks.',
    },
    {
      id: 'crypto',
      icon: Bitcoin,
      titleAr: 'العملات الرقمية',
      titleEn: 'Cryptocurrencies',
      descAr: 'تداول البيتكوين والإيثيريوم والأصول الرقمية بأمان تام. نقدم لك محافظ مؤمّنة وتحديثات لحظية لحركة السوق.',
      descEn: 'Trade Bitcoin, Ethereum, and digital assets safely. We offer secured wallets and real-time market updates.',
    },
    {
      id: 'funds',
      icon: Building2,
      titleAr: 'صناديق الاستثمار',
      titleEn: 'Investment Funds',
      descAr: 'اختر من بين باقة متنوعة من صناديق الاستثمار المشتركة و صناديق المؤشرات المتداولة (ETFs) التي تناسب مستوى مخاطرتك.',
      descEn: 'Choose from a variety of mutual funds and ETFs that suit your risk level.',
    },
    {
      id: 'metals',
      icon: Gem,
      titleAr: 'المعادن والذهب',
      titleEn: 'Metals & Gold',
      descAr: 'الملاذ الآمن لأموالك. استثمر في عقود الذهب والفضة والبلاتين لحماية محفظتك من التضخم وتقلبات الأسواق.',
      descEn: 'The safe haven for your money. Invest in Gold, Silver, and Platinum contracts to protect against inflation.',
    },
    {
      id: 'energy',
      icon: Fuel,
      titleAr: 'النفط والطاقة',
      titleEn: 'Oil & Energy',
      descAr: 'شارك في قطاع الطاقة الحيوي. تداول عقود النفط الخام والغاز الطبيعي واستثمر في شركات الطاقة المتجددة لمستقبل مستدام.',
      descEn: 'Participate in the vital energy sector. Trade crude oil and natural gas, and invest in renewable energy companies.',
    }
  ];

  return (
    <section className="py-24 bg-primary dark:bg-elevated relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4">
          <span className="font-black text-[11px] text-gold-deep tracking-[0.2em] uppercase mb-4 block">
            {t('خدماتنا الاستثمارية', 'OUR INVESTMENT SERVICES')}
          </span>
          <h2 className="font-black text-3xl md:text-4xl text-text-primary mb-6">
            {t('نوّع محفظتك وحقق أهدافك المالية', 'Diversify Your Portfolio & Achieve Financial Goals')}
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            {t('نقدم مجموعة متكاملة من الحلول الاستثمارية المصممة بعناية لتناسب مختلف مستويات المخاطر والتطلعات المالية.', 'We offer a comprehensive suite of carefully designed investment solutions to suit different risk levels and financial aspirations.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv, idx) => (
            <Card key={srv.id} variant="interactive" className="p-8 group animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="w-14 h-14 bg-gold-subtle rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold-primary transition-colors duration-300">
                <srv.icon className="w-7 h-7 text-gold-deep group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-bold text-xl text-text-primary mb-3 group-hover:text-gold-dark transition-colors">
                {lang === 'ar' ? srv.titleAr : srv.titleEn}
              </h3>
              <p className="text-sm text-text-secondary mb-6 leading-relaxed line-clamp-3">
                {lang === 'ar' ? srv.descAr : srv.descEn}
              </p>
              <Link to={`/service/$id`} params={{ id: srv.id }} className="inline-flex items-center gap-2 font-bold text-[14px] text-gold-deep group-hover:text-gold-dark">
                {t('اكتشف المزيد', 'Explore More')} <ArrowLeft className={cn("w-4 h-4 transition-transform", lang === 'ar' ? "group-hover:-translate-x-1" : "rotate-180 group-hover:translate-x-1")} />
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
