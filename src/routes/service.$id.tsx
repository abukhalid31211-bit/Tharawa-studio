import { createFileRoute } from '@tanstack/react-router';
import { useLang } from '@/contexts/LanguageContext';
import { ArrowLeft, ShieldCheck, TrendingUp, Clock, BarChart3, CheckCircle2, ChevronDown } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/service/$id')({
  component: ServiceDetailsPage,
});

function ServiceDetailsPage() {
  const { lang } = useLang();
  const { id } = Route.useParams();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const serviceData: Record<string, any> = {
    'gulf-stocks': {
      titleAr: 'الأسهم الخليجية والعربية', titleEn: 'Gulf & Arab Equities',
      descAr: 'استثمار في أسرع أسواق المال نمواً في المنطقة مع دعم تحليلي يومي وفريق محلي متخصص.',
      descEn: 'Invest in the fastest-growing capital markets in the region with daily analytical support and a specialized local team.',
      icon: TrendingUp, emoji: '📈',
      stats: { return: '+18.5%', risk: 'متوسط', min: '5,000 ريال', duration: '1-5 سنوات', liquidity: 'عالية', shariah: true },
      sectorsAr: ['البنوك', 'الطاقة', 'العقارات', 'التكنولوجيا', 'الرعاية الصحية', 'الاتصالات'],
      sectorsEn: ['Banking', 'Energy', 'Real Estate', 'Technology', 'Healthcare', 'Telecom'],
      marketsAr: ['تداول السعودية', 'أبوظبي', 'دبي', 'الكويت', 'مصر', 'قطر', 'البحرين'],
      marketsEn: ['Saudi Tadawul', 'Abu Dhabi', 'Dubai', 'Kuwait', 'Egypt', 'Qatar', 'Bahrain'],
    },
    'global-stocks': {
      titleAr: 'الأسهم العالمية', titleEn: 'Global Equities',
      descAr: 'وصول مباشر لـ 15 سوق مالي عالمي بما فيها وول ستريت وناسداك ولندن وطوكيو.',
      descEn: 'Direct access to 15 global financial markets including Wall Street, NASDAQ, London and Tokyo.',
      icon: TrendingUp, emoji: '🌍',
      stats: { return: '+22.3%', risk: 'متوسط إلى مرتفع', min: '10,000 ريال', duration: '3-10 سنوات', liquidity: 'عالية', shariah: false },
      sectorsAr: ['التكنولوجيا', 'الطاقة المتجددة', 'الرعاية الصحية', 'المال', 'الاستهلاك', 'الصناعة'],
      sectorsEn: ['Technology', 'Renewable Energy', 'Healthcare', 'Finance', 'Consumer', 'Industry'],
      marketsAr: ['NYSE', 'NASDAQ', 'لندن', 'طوكيو', 'هونغ كونغ', 'فرانكفورت'],
      marketsEn: ['NYSE', 'NASDAQ', 'London', 'Tokyo', 'Hong Kong', 'Frankfurt'],
    },
    'crypto': {
      titleAr: 'العملات الرقمية', titleEn: 'Cryptocurrencies',
      descAr: 'محافظ منوّعة من العملات الرقمية مع حفظ بارد بنسبة 95% وتأمين مؤسسي.',
      descEn: 'Diversified digital currency portfolios with 95% cold storage and institutional insurance.',
      icon: TrendingUp, emoji: '₿',
      stats: { return: '+45.8%', risk: 'مرتفع', min: '2,000 ريال', duration: '2-7 سنوات', liquidity: 'متوسطة', shariah: false },
      sectorsAr: ['بيتكوين', 'إيثيريوم', 'سولانا', 'بينانس كوين', 'ريبل', 'كارديانو'],
      sectorsEn: ['Bitcoin', 'Ethereum', 'Solana', 'BNB', 'Ripple', 'Cardano'],
      marketsAr: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'BNB/USD', 'XRP/USD', 'ADA/USD'],
      marketsEn: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'BNB/USD', 'XRP/USD', 'ADA/USD'],
    },
    'funds': {
      titleAr: 'صناديق الاستثمار', titleEn: 'Investment Funds',
      descAr: 'صناديق متخصصة بمستويات مخاطر متعددة مع إدارة احترافية من أفضل المحللين.',
      descEn: 'Specialized funds with multiple risk levels managed by top certified analysts.',
      icon: TrendingUp, emoji: '🏛',
      stats: { return: '+14.2%', risk: 'منخفض إلى مرتفع', min: '1,000 ريال', duration: '1-10 سنوات', liquidity: 'مرنة', shariah: true },
      sectorsAr: ['صناديق نقدية', 'دخل ثابت', 'متوازنة', 'أسهم', 'نمو', 'إسلامية'],
      sectorsEn: ['Money Market', 'Fixed Income', 'Balanced', 'Equity', 'Growth', 'Islamic'],
      marketsAr: ['صندوق النقد', 'صندوق الدخل', 'صندوق النمو', 'صندوق متوازن', 'صندوق إسلامي'],
      marketsEn: ['Money Fund', 'Income Fund', 'Growth Fund', 'Balanced Fund', 'Islamic Fund'],
    },
    'metals': {
      titleAr: 'المعادن والذهب', titleEn: 'Metals & Gold',
      descAr: 'تحوط ذكي عبر الذهب والفضة والبلاتين مع خيار الذهب الفيزيائي وخدمة التخزين الآمن.',
      descEn: 'Smart hedging through gold, silver, and platinum with physical gold option and secure storage.',
      icon: TrendingUp, emoji: '💎',
      stats: { return: '+11.7%', risk: 'منخفض', min: '3,000 ريال', duration: '5-15 سنة', liquidity: 'عالية', shariah: true },
      sectorsAr: ['ذهب', 'فضة', 'بلاتين', 'بلاديوم'],
      sectorsEn: ['Gold', 'Silver', 'Platinum', 'Palladium'],
      marketsAr: ['XAU/USD', 'XAG/USD', 'XPT/USD', 'XPD/USD'],
      marketsEn: ['XAU/USD', 'XAG/USD', 'XPT/USD', 'XPD/USD'],
    },
    'energy': {
      titleAr: 'النفط والطاقة', titleEn: 'Oil & Energy',
      descAr: 'استثمارات في عقود النفط الخام وأسهم شركات الطاقة المتجددة العالمية.',
      descEn: 'Investments in crude oil contracts and global renewable energy company equities.',
      icon: TrendingUp, emoji: '⛽',
      stats: { return: '+16.9%', risk: 'متوسط إلى مرتفع', min: '4,000 ريال', duration: '3-8 سنوات', liquidity: 'عالية', shariah: false },
      sectorsAr: ['نفط WTI', 'برنت', 'غاز طبيعي', 'طاقة شمسية', 'طاقة رياح', 'تكرير'],
      sectorsEn: ['WTI Oil', 'Brent Crude', 'Natural Gas', 'Solar', 'Wind', 'Refinery'],
      marketsAr: ['CL (WTI)', 'BZ (Brent)', 'NG (Gas)', 'أسهم طاقة متجددة'],
      marketsEn: ['CL (WTI)', 'BZ (Brent)', 'NG (Gas)', 'Renewable Equities'],
    },
  };

  const data = serviceData[id] || serviceData['gulf-stocks'];
  const isAr = lang === 'ar';

  const features = [
    { ar: 'تحليل يومي معمّق', en: 'In-depth Daily Analysis' },
    { ar: 'محافظ مخصصة بالكامل', en: 'Fully Custom Portfolios' },
    { ar: 'تقارير شهرية مفصلة', en: 'Detailed Monthly Reports' },
    { ar: 'دعم مباشر 24/7', en: '24/7 Direct Support' },
  ];

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
            <span className="text-gold-deep font-semibold">{isAr ? data.titleAr : data.titleEn}</span>
          </div>
          <h1 className="font-black text-4xl md:text-6xl text-text-primary mb-6 leading-tight">{isAr ? data.titleAr : data.titleEn}</h1>
          <p className="text-xl text-text-secondary max-w-[700px] leading-relaxed">{isAr ? data.descAr : data.descEn}</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 bg-secondary dark:bg-[#13132A] border-y border-border-light">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-xl bg-white dark:bg-[#1A1A3A] border border-border-light">
              <div className="text-2xl font-mono font-black text-success">{data.stats.return}</div>
              <div className="text-xs text-text-muted mt-1">{isAr ? 'متوسط العائد السنوي' : 'Avg Annual Return'}</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-white dark:bg-[#1A1A3A] border border-border-light">
              <div className="text-xl font-bold text-warning">{data.stats.risk}</div>
              <div className="text-xs text-text-muted mt-1">{isAr ? 'مستوى المخاطر' : 'Risk Level'}</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-white dark:bg-[#1A1A3A] border border-border-light">
              <div className="text-xl font-mono font-bold text-text-primary">{data.stats.min}</div>
              <div className="text-xs text-text-muted mt-1">{isAr ? 'الحد الأدنى' : 'Minimum'}</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-white dark:bg-[#1A1A3A] border border-border-light">
              <div className="text-sm font-semibold text-info">{data.stats.duration}</div>
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
              <p className="text-text-secondary leading-relaxed text-base">{data.descAr}</p>
            </div>

            <div>
              <h2 className="text-2xl font-black mb-4">{isAr ? 'ما يشمله البرنامج' : 'What It Includes'}</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary dark:bg-[#13132A] border border-border-light">
                    <CheckCircle2 className="w-5 h-5 text-gold-primary shrink-0" />
                    <span className="text-sm font-medium text-text-primary">{isAr ? f.ar : f.en}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black mb-4">{isAr ? 'الأسواق المغطاة' : 'Markets Covered'}</h2>
              <div className="flex flex-wrap gap-2">
                {(isAr ? data.marketsAr : data.marketsEn).map((m: string, i: number) => (
                  <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold bg-gold-subtle text-gold-deep border border-border-gold">{m}</span>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h2 className="text-2xl font-black mb-4">{isAr ? 'أسئلة شائعة' : 'FAQ'}</h2>
              <div className="space-y-2">
                {[
                  { q: isAr ? 'هل الخدمة متوافقة مع الشريعة؟' : 'Is the service Shariah-compliant?', a: isAr ? 'نعم، هذه الخدمة متوافقة مع أحكام الشريعة ومعتمدة من هيئة الرقابة الشرعية.' : 'Yes, this service complies with Shariah rulings and is approved by the Shariah Supervisory Board.' },
                  { q: isAr ? 'ما هو الحد الأدنى للاستثمار؟' : 'What is the minimum investment?', a: isAr ? `الحد الأدنى هو ${data.stats.min} حسب نوع المحفظة.` : `The minimum is ${data.stats.min} depending on portfolio type.` },
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
                  <div className="flex justify-between"><span className="text-text-muted">{isAr ? 'العائد المتوقع' : 'Expected Return'}</span><span className="font-mono font-bold text-success">{data.stats.return}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">{isAr ? 'مستوى المخاطر' : 'Risk'}</span><span className="font-bold text-warning">{data.stats.risk}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">{isAr ? 'الحد الأدنى' : 'Minimum'}</span><span className="font-mono font-bold">{data.stats.min}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">{isAr ? 'الأفق' : 'Duration'}</span><span className="font-bold">{data.stats.duration}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">{isAr ? 'التوافق الشرعي' : 'Shariah'}</span><span className="font-bold text-gold-deep">{data.stats.shariah ? (isAr ? 'متوافق' : 'Compliant') : (isAr ? 'غير متوافق' : 'Not Compliant')}</span></div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
