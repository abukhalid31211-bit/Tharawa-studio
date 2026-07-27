import { createFileRoute } from '@tanstack/react-router';
import { useLang } from '@/contexts/LanguageContext';
import { ArrowLeft, ShieldCheck, CheckCircle2, ChevronDown } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { SERVICE_DETAILS, SERVICE_ICON_MAP, GENERIC_SERVICE_DETAILS, usePublicServices } from '@/lib/publicContent';

export const Route = createFileRoute('/service/$id')({
  component: ServiceDetailsPage,
});

function ServiceDetailsPage() {
  const { lang, t } = useLang();
  const { id } = Route.useParams();
  const { content } = usePublicServices();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const service = useMemo(() => content.services.find((item) => item.id === id) || content.services[0], [content.services, id]);
  // Only use SERVICE_DETAILS for services that actually have matching hardcoded
  // figures; any other service (e.g. newly added via /Akadmin/services_mgr with
  // a custom id) gets an honest generic placeholder instead of silently
  // borrowing another service's numbers.
  const details = SERVICE_DETAILS[id] || SERVICE_DETAILS[service?.id || ''] || GENERIC_SERVICE_DETAILS;
  const isAr = lang === 'ar';
  const features = (isAr ? service?.featuresAr : service?.featuresEn) || [
    isAr ? 'تحليل يومي معمّق' : 'In-depth Daily Analysis',
    isAr ? 'محافظ مخصصة بالكامل' : 'Fully Custom Portfolios',
    isAr ? 'تقارير شهرية مفصلة' : 'Detailed Monthly Reports',
    isAr ? 'دعم مباشر 24/7' : '24/7 Direct Support',
  ];
  const Icon = SERVICE_ICON_MAP[service?.icon || 'TrendingUp'] || SERVICE_ICON_MAP.TrendingUp;

  return (
    <div className="w-full min-h-screen bg-primary dark:bg-[#0D0D1A]">
      {/* Hero */}
      <section className="relative pt-32 pb-16 bg-gradient-to-b from-[#FFFBF0] to-white dark:from-[#13132A] dark:to-[#0D0D1A] overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
            <Link to="/" className="hover:text-gold-deep">{isAr ? 'الرئيسية' : 'Home'}</Link>
            <ArrowLeft className="w-3 h-3" />
            <Link to="/services" className="hover:text-gold-deep">{isAr ? 'خدماتنا' : 'Services'}</Link>
            <ArrowLeft className="w-3 h-3" />
            <span className="text-gold-deep font-semibold">{isAr ? service?.title : service?.titleEn}</span>
          </div>
          <h1 className="font-black text-4xl md:text-6xl text-text-primary mb-6 leading-tight flex items-center gap-3">
            <Icon className="w-10 h-10 text-gold-deep shrink-0" />
            <span>{isAr ? service?.title : service?.titleEn}</span>
          </h1>
          <p className="text-xl text-text-secondary max-w-[700px] leading-relaxed">{isAr ? service?.desc : service?.descEn}</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 bg-secondary dark:bg-[#13132A] border-y border-border-light">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-xl bg-white dark:bg-[#1A1A3A] border border-border-light">
              <div className="text-2xl font-mono font-black text-success">{isAr ? details.returnAr : details.returnEn}</div>
              <div className="text-xs text-text-muted mt-1">{isAr ? 'متوسط العائد السنوي' : 'Avg Annual Return'}</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-white dark:bg-[#1A1A3A] border border-border-light">
              <div className="text-xl font-bold text-warning">{isAr ? details.riskAr : details.riskEn}</div>
              <div className="text-xs text-text-muted mt-1">{isAr ? 'مستوى المخاطر' : 'Risk Level'}</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-white dark:bg-[#1A1A3A] border border-border-light">
              <div className="text-xl font-mono font-bold text-text-primary">{details.minimum}</div>
              <div className="text-xs text-text-muted mt-1">{isAr ? 'الحد الأدنى' : 'Minimum'}</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-white dark:bg-[#1A1A3A] border border-border-light">
              <div className="text-sm font-semibold text-info">{isAr ? details.durationAr : details.durationEn}</div>
              <div className="text-xs text-text-muted mt-1">{isAr ? 'أفق الاستثمار' : 'Horizon'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 max-w-[1280px] mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-10">
            <div>
              <h2 className="text-2xl font-black mb-4 flex items-center gap-2">{isAr ? 'نظرة عامة' : 'Overview'} <ShieldCheck className="text-gold-deep w-5 h-5" /></h2>
              <p className="text-text-secondary leading-relaxed text-base">{isAr ? service?.desc : service?.descEn}</p>
            </div>

            <div>
              <h2 className="text-2xl font-black mb-4">{isAr ? 'ما يشمله البرنامج' : 'What It Includes'}</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary dark:bg-[#13132A] border border-border-light">
                    <CheckCircle2 className="w-5 h-5 text-gold-primary shrink-0" />
                    <span className="text-sm font-medium text-text-primary">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black mb-4">{isAr ? 'الأسواق المغطاة' : 'Markets Covered'}</h2>
              <div className="flex flex-wrap gap-2">
                {(isAr ? details.marketsAr : details.marketsEn).length > 0 ? (
                  (isAr ? details.marketsAr : details.marketsEn).map((m: string, i: number) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold bg-gold-subtle text-gold-deep border border-border-gold">{m}</span>
                  ))
                ) : (
                  <span className="text-sm text-text-muted">{isAr ? 'تواصل مع فريقنا للاطلاع على الأسواق المتاحة لهذه الخدمة.' : 'Contact our team for the markets available under this service.'}</span>
                )}
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h2 className="text-2xl font-black mb-4">{isAr ? 'أسئلة شائعة' : 'FAQ'}</h2>
              <div className="space-y-2">
                {[
                  { q: isAr ? 'هل الخدمة متوافقة مع الشريعة؟' : 'Is the service Shariah-compliant?', a: details.shariah ? (isAr ? 'نعم، هذه الخدمة متوافقة مع أحكام الشريعة ومعتمدة من هيئة الرقابة الشرعية.' : 'Yes, this service complies with Shariah rulings and is approved by the Shariah Supervisory Board.') : (isAr ? 'لا، هذا المنتج لا يحمل علامة التوافق الشرعي ضمن إعداداته الحالية.' : 'No. This product is not marked as Sharia-compliant in its current configuration.') },
                  { q: isAr ? 'ما هو الحد الأدنى للاستثمار؟' : 'What is the minimum investment?', a: isAr ? `الحد الأدنى هو ${details.minimum} حسب نوع المحفظة.` : `The minimum is ${details.minimum} depending on portfolio type.` },
                ].map((faq, i) => (
                  <div key={i} className="border border-border-light rounded-xl overflow-hidden bg-white dark:bg-[#13132A]">
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full text-left px-5 py-4 flex items-center justify-between font-bold text-text-primary hover:bg-gold-subtle transition-colors">
                      <span className="flex items-center gap-2">{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-gold-deep transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`px-5 overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 py-3' : 'max-h-0'}`}>
                      <p className="text-sm text-text-secondary">{faq.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl bg-gradient-to-br from-[#F5C518] to-[#E6AF00] p-6 text-white shadow-xl">
                <h3 className="font-black text-xl mb-2">{isAr ? 'ابدأ استثمارك الآن' : 'Start Investing Now'}</h3>
                <p className="text-sm text-white/90 mb-4">{isAr ? 'استشارة مجانية مع خبير متخصص' : 'Free consultation with a specialist'}</p>
                <Link to="/contact"><button className="w-full py-3 rounded-lg bg-white text-[#C9920A] font-black hover:-translate-y-1 transition-transform shadow-md">{isAr ? 'احجز استشارة مجانية' : 'Book Free Consultation'}</button></Link>
              </div>
              <div className="rounded-2xl bg-white dark:bg-[#13132A] border border-border-light p-6">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2">{isAr ? 'ملخص الخدمة' : 'Service Summary'}</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-text-muted">{isAr ? 'العائد المتوقع' : 'Expected Return'}</span><span className="font-mono font-bold text-success">{isAr ? details.returnAr : details.returnEn}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">{isAr ? 'مستوى المخاطر' : 'Risk'}</span><span className="font-bold text-warning">{isAr ? details.riskAr : details.riskEn}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">{isAr ? 'الحد الأدنى' : 'Minimum'}</span><span className="font-mono font-bold">{details.minimum}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">{isAr ? 'الأفق' : 'Duration'}</span><span className="font-bold">{isAr ? details.durationAr : details.durationEn}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">{isAr ? 'التوافق الشرعي' : 'Shariah'}</span><span className="font-bold text-gold-deep">{details.shariah ? (isAr ? 'متوافق' : 'Compliant') : (isAr ? 'غير متوافق' : 'Not Compliant')}</span></div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
