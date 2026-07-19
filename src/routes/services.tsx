import { createFileRoute, Link } from '@tanstack/react-router';
import { useLang } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/Card';
import { TrendingUp, Globe, Bitcoin, Building2, Gem, Fuel, ArrowLeft, BarChart3, Clock, CheckCircle2, ShieldCheck, PieChart, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CtaSection } from '@/components/home/CtaSection';

export const Route = createFileRoute('/services')({ component: ServicesPage });

function ServicesPage() {
  const { t, lang } = useLang();

  const services = [
    {
      id: 'gulf-stocks',
      icon: TrendingUp,
      titleAr: 'الأسهم الخليجية والعربية',
      titleEn: 'Gulf & Arab Equities',
      descAr: 'استثمر في أسواق السعودية والإمارات والكويت. نوفر لك تحليلات دقيقة وأدوات متقدمة.',
      descEn: 'Invest in Saudi, UAE, and Kuwait markets with accurate analysis and advanced tools.',
      featuresAr: ['تحديث لحظي للأسعار', 'تحليلات للسوق المالي', 'تقارير أرباح الشركات'],
      featuresEn: ['Real-time prices', 'Financial market analysis', 'Company earnings reports']
    },
    {
      id: 'global-stocks',
      icon: Globe,
      titleAr: 'الأسهم العالمية',
      titleEn: 'Global Equities',
      descAr: 'وصول مباشر إلى وول ستريت، ناسداك، والأسواق الأوروبية والآسيوية.',
      descEn: 'Direct access to Wall Street, Nasdaq, European and Asian markets.',
      featuresAr: ['أسهم قطاع التكنولوجيا', 'تداول قبل وبعد الإغلاق', 'تغطية عالمية'],
      featuresEn: ['Tech sector stocks', 'Pre/Post market trading', 'Global coverage']
    },
    {
      id: 'crypto',
      icon: Bitcoin,
      titleAr: 'العملات الرقمية',
      titleEn: 'Cryptocurrencies',
      descAr: 'تداول البيتكوين والإيثيريوم والأصول الرقمية بأمان تام.',
      descEn: 'Trade Bitcoin, Ethereum, and digital assets safely.',
      featuresAr: ['محافظ باردة آمنة', 'تداول 24/7', 'رسوم منخفضة'],
      featuresEn: ['Secure cold wallets', '24/7 Trading', 'Low fees']
    },
    {
      id: 'funds',
      icon: Building2,
      titleAr: 'صناديق الاستثمار',
      titleEn: 'Investment Funds',
      descAr: 'اختر من بين باقة متنوعة من صناديق الاستثمار المشتركة و ETFs.',
      descEn: 'Choose from a variety of mutual funds and ETFs.',
      featuresAr: ['صناديق إسلامية', 'عائد توزيعات ثابت', 'إدارة احترافية'],
      featuresEn: ['Islamic funds', 'Fixed dividend yield', 'Professional management']
    },
    {
      id: 'metals',
      icon: Gem,
      titleAr: 'المعادن والذهب',
      titleEn: 'Metals & Gold',
      descAr: 'الملاذ الآمن لأموالك. استثمر في الذهب والفضة والبلاتين.',
      descEn: 'The safe haven. Invest in Gold, Silver, and Platinum.',
      featuresAr: ['حماية من التضخم', 'رافعة مالية مرنة', 'أسعار لحظية'],
      featuresEn: ['Inflation hedge', 'Flexible leverage', 'Real-time pricing']
    },
    {
      id: 'energy',
      icon: Fuel,
      titleAr: 'النفط والطاقة',
      titleEn: 'Oil & Energy',
      descAr: 'شارك في قطاع الطاقة الحيوي عبر النفط الخام والغاز الطبيعي.',
      descEn: 'Participate in the energy sector via crude oil and natural gas.',
      featuresAr: ['عقود آجلة', 'طاقة متجددة', 'تحليلات جيوسياسية'],
      featuresEn: ['Futures contracts', 'Renewable energy', 'Geopolitical analysis']
    }
  ];

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative w-full bg-primary dark:bg-elevated pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-primary),var(--color-secondary))] dark:bg-[linear-gradient(to_bottom,#0D0D1A,#13132A)] opacity-80" />
        <div className="max-w-[1280px] mx-auto px-4 relative z-10 text-center">
          <span className="font-black text-[11px] text-gold-deep tracking-[0.2em] uppercase mb-4 block">
            {t('خدماتنا الاستثمارية', 'OUR INVESTMENT SERVICES')}
          </span>
          <h1 className="font-black text-4xl md:text-5xl text-text-primary mb-6">
            {t('بوابتك الموثوقة لتنمية ثروتك', 'Your Trusted Gateway to Growing Wealth')}
          </h1>
          <p className="text-lg text-text-secondary max-w-[620px] mx-auto mb-10">
            {t('نقدم لك مجموعة متكاملة من الحلول الاستثمارية التي تُدار باحترافية لتناسب تطلعاتك المالية ومستوى تحملك للمخاطر، مع ضمان أعلى معايير الشفافية والأمان.', 'We offer a comprehensive suite of investment solutions professionally managed to suit your financial aspirations and risk tolerance.')}
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-secondary dark:bg-[#13132A]">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((srv, i) => (
              <Card key={i} variant="interactive" className="p-8 flex flex-col h-full hover:-translate-y-2 transition-transform duration-300 bg-primary group">
                <div className="w-16 h-16 bg-gold-subtle rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold-primary transition-colors">
                  <srv.icon className="w-8 h-8 text-gold-deep group-hover:text-white" />
                </div>
                <h3 className="font-bold text-2xl text-text-primary mb-3 group-hover:text-gold-dark transition-colors">{lang === 'ar' ? srv.titleAr : srv.titleEn}</h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-6 flex-1">
                  {lang === 'ar' ? srv.descAr : srv.descEn}
                </p>
                <div className="space-y-2 mb-8">
                  {(lang === 'ar' ? srv.featuresAr : srv.featuresEn).map((feat, j) => (
                    <div key={j} className="flex items-center gap-2 text-[13px] text-text-secondary">
                      <CheckCircle2 className="w-4 h-4 text-gold-primary shrink-0" /> {feat}
                    </div>
                  ))}
                </div>
                <Link to="/service/$id" params={{ id: srv.id }} className="w-full">
                  <button className="w-full py-3 rounded-md bg-secondary border border-border-default font-bold text-sm text-text-secondary group-hover:border-gold-primary group-hover:text-gold-deep transition-colors">
                    {t('اكتشف التفاصيل والأسعار', 'Discover Details & Pricing')}
                  </button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-24 bg-primary border-y border-border-light text-center">
        <div className="max-w-[1280px] mx-auto px-4">
          <h2 className="font-black text-3xl mb-12 text-text-primary">{t('لماذا تتداول عبر منصتنا؟', 'Why Trade via Our Platform?')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-10 h-10 text-gold-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">{t('أمان وموثوقية', 'Security & Reliability')}</h3>
            </div>
            <div className="flex flex-col items-center">
              <PieChart className="w-10 h-10 text-gold-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">{t('تنوع استثماري', 'Investment Diversity')}</h3>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="w-10 h-10 text-gold-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">{t('تنفيذ سريع لحظي', 'Fast Execution')}</h3>
            </div>
            <div className="flex flex-col items-center">
              <Users className="w-10 h-10 text-gold-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">{t('دعم مستمر للمستثمر', 'Continuous Support')}</h3>
            </div>
          </div>
        </div>
      </section>

      <CtaSection />
    </div>
  );
}
