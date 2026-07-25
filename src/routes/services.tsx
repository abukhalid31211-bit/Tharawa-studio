import { createFileRoute, Link } from '@tanstack/react-router';
import { useLang } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, Clock, CheckCircle2, ShieldCheck, PieChart, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CtaSection } from '@/components/home/CtaSection';
import { SERVICE_ICON_MAP, usePublicServices } from '@/lib/publicContent';

export const Route = createFileRoute('/services')({ component: ServicesPage });

function ServicesPage() {
  const { t, lang } = useLang();
  const { content } = usePublicServices();
  const services = content.services;

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative w-full bg-primary dark:bg-elevated pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-primary),var(--color-secondary))] dark:bg-[linear-gradient(to_bottom,#0D0D1A,#13132A)] opacity-80" />
        <div className="max-w-[1280px] mx-auto px-4 relative z-10 text-center">
          <span className="font-black text-[11px] text-gold-deep tracking-[0.2em] uppercase mb-4 block">
            {lang === 'ar' ? content.title : content.titleEn}
          </span>
          <h1 className="font-black text-4xl md:text-5xl text-text-primary mb-6">
            {lang === 'ar' ? content.subtitle : content.subtitleEn}
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
            {services.length === 0 ? (
              <Card className="p-8 text-center text-text-muted lg:col-span-3">
                {t('لا توجد خدمات منشورة حالياً', 'No services are currently published')}
              </Card>
            ) : services.map((srv, i) => {
              const Icon = SERVICE_ICON_MAP[srv.icon] || SERVICE_ICON_MAP.TrendingUp;
              const featureList = lang === 'ar' ? (srv.featuresAr || []) : (srv.featuresEn || []);
              return (
                <Card key={i} variant="interactive" className="p-8 flex flex-col h-full hover:-translate-y-2 transition-transform duration-300 bg-primary group">
                  <div className="w-16 h-16 bg-gold-subtle rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold-primary transition-colors">
                    <Icon className="w-8 h-8 text-gold-deep group-hover:text-white" />
                  </div>
                  <h3 className="font-bold text-2xl text-text-primary mb-3 group-hover:text-gold-dark transition-colors">{lang === 'ar' ? srv.title : srv.titleEn}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-6 flex-1">
                    {lang === 'ar' ? srv.desc : srv.descEn}
                  </p>
                  {featureList.length > 0 && (
                    <div className="space-y-2 mb-8">
                      {featureList.map((feat, j) => (
                        <div key={j} className="flex items-center gap-2 text-[13px] text-text-secondary">
                          <CheckCircle2 className="w-4 h-4 text-gold-primary shrink-0" /> {feat}
                        </div>
                      ))}
                    </div>
                  )}
                  <Link to="/service/$id" params={{ id: srv.id }} className="w-full">
                    <button className="w-full py-3 rounded-md bg-secondary border border-border-default font-bold text-sm text-text-secondary group-hover:border-gold-primary group-hover:text-gold-deep transition-colors">
                      {t('اكتشف التفاصيل والأسعار', 'Discover Details & Pricing')}
                    </button>
                  </Link>
                </Card>
              );
            })}
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
