import { useMemo } from 'react';
import { Building2, Fuel, Gem, Globe, TrendingUp, Bitcoin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCmsSection } from './cms';

export interface ServiceItem {
  id: string;
  icon: string;
  title: string;
  titleEn: string;
  desc: string;
  descEn: string;
  active?: boolean;
  featuresAr?: string[];
  featuresEn?: string[];
}

export interface ServicesContent {
  title?: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  services?: ServiceItem[];
}

export type NewsCategoryKey = 'all' | 'analysis' | 'gulf' | 'global' | 'crypto' | 'metals' | 'energy' | 'strategy';

export interface NewsArticle {
  id: string;
  emoji: string;
  category: Exclude<NewsCategoryKey, 'all'>;
  categoryAr: string;
  categoryEn: string;
  title: string;
  titleEn: string;
  excerpt: string;
  excerptEn: string;
  author: string;
  authorEn: string;
  role: string;
  roleEn: string;
  date: string;
  dateEn: string;
  readTime: string;
  readTimeEn: string;
  views: string;
  trending: boolean;
  featured?: boolean;
  slug: string;
  bodyAr: string[];
  bodyEn: string[];
}

export interface FaqItem {
  id: string;
  question: string;
  questionEn: string;
  answer: string;
  answerEn: string;
  category: string;
  published: boolean;
  order: number;
}

export const SERVICE_ICON_MAP: Record<string, LucideIcon> = {
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

export const FALLBACK_SERVICES_CONTENT: ServicesContent = {
  title: 'خدماتنا الاستثمارية',
  titleEn: 'OUR INVESTMENT SERVICES',
  subtitle: 'نوّع محفظتك وحقق أهدافك المالية',
  subtitleEn: 'Diversify Your Portfolio & Achieve Financial Goals',
  services: [
    {
      id: 'gulf-stocks',
      icon: 'TrendingUp',
      title: 'الأسهم الخليجية والعربية',
      titleEn: 'Gulf & Arab Equities',
      desc: 'استثمر في أسواق السعودية والإمارات والكويت. نوفر لك تحليلات دقيقة وأدوات متقدمة.',
      descEn: 'Invest in Saudi, UAE, and Kuwait markets with accurate analysis and advanced tools.',
      active: true,
      featuresAr: ['تحديث لحظي للأسعار', 'تحليلات للسوق المالي', 'تقارير أرباح الشركات'],
      featuresEn: ['Real-time prices', 'Financial market analysis', 'Company earnings reports'],
    },
    {
      id: 'global-stocks',
      icon: 'Globe',
      title: 'الأسهم العالمية',
      titleEn: 'Global Equities',
      desc: 'وصول مباشر إلى وول ستريت، ناسداك، والأسواق الأوروبية والآسيوية.',
      descEn: 'Direct access to Wall Street, Nasdaq, European and Asian markets.',
      active: true,
      featuresAr: ['أسهم قطاع التكنولوجيا', 'تداول قبل وبعد الإغلاق', 'تغطية عالمية'],
      featuresEn: ['Tech sector stocks', 'Pre/Post market trading', 'Global coverage'],
    },
    {
      id: 'crypto',
      icon: 'Bitcoin',
      title: 'العملات الرقمية',
      titleEn: 'Cryptocurrencies',
      desc: 'تداول البيتكوين والإيثيريوم والأصول الرقمية بأمان تام.',
      descEn: 'Trade Bitcoin, Ethereum, and digital assets safely.',
      active: true,
      featuresAr: ['محافظ باردة آمنة', 'تداول 24/7', 'رسوم منخفضة'],
      featuresEn: ['Secure cold wallets', '24/7 Trading', 'Low fees'],
    },
    {
      id: 'funds',
      icon: 'Building2',
      title: 'صناديق الاستثمار',
      titleEn: 'Investment Funds',
      desc: 'اختر من بين باقة متنوعة من صناديق الاستثمار المشتركة و ETFs.',
      descEn: 'Choose from a variety of mutual funds and ETFs.',
      active: true,
      featuresAr: ['صناديق إسلامية', 'عائد توزيعات ثابت', 'إدارة احترافية'],
      featuresEn: ['Islamic funds', 'Fixed dividend yield', 'Professional management'],
    },
    {
      id: 'metals',
      icon: 'Gem',
      title: 'المعادن والذهب',
      titleEn: 'Metals & Gold',
      desc: 'الملاذ الآمن لأموالك. استثمر في الذهب والفضة والبلاتين.',
      descEn: 'The safe haven. Invest in Gold, Silver, and Platinum.',
      active: true,
      featuresAr: ['حماية من التضخم', 'رافعة مالية مرنة', 'أسعار لحظية'],
      featuresEn: ['Inflation hedge', 'Flexible leverage', 'Real-time pricing'],
    },
    {
      id: 'energy',
      icon: 'Fuel',
      title: 'النفط والطاقة',
      titleEn: 'Oil & Energy',
      desc: 'شارك في قطاع الطاقة الحيوي عبر النفط الخام والغاز الطبيعي.',
      descEn: 'Participate in the energy sector via crude oil and natural gas.',
      active: true,
      featuresAr: ['عقود آجلة', 'طاقة متجددة', 'تحليلات جيوسياسية'],
      featuresEn: ['Futures contracts', 'Renewable energy', 'Geopolitical analysis'],
    },
  ],
};

export const SERVICE_DETAILS: Record<string, {
  returnAr: string;
  returnEn: string;
  riskAr: string;
  riskEn: string;
  minimum: string;
  durationAr: string;
  durationEn: string;
  liquidityAr: string;
  liquidityEn: string;
  shariah: boolean;
  marketsAr: string[];
  marketsEn: string[];
}> = {
  'gulf-stocks': {
    returnAr: '+18.5%', returnEn: '+18.5%', riskAr: 'متوسط', riskEn: 'Balanced', minimum: '5,000 ريال', durationAr: '1-5 سنوات', durationEn: '1-5 Years', liquidityAr: 'عالية', liquidityEn: 'High', shariah: true,
    marketsAr: ['تداول السعودية', 'أبوظبي', 'دبي', 'الكويت', 'مصر', 'قطر', 'البحرين'],
    marketsEn: ['Saudi Tadawul', 'Abu Dhabi', 'Dubai', 'Kuwait', 'Egypt', 'Qatar', 'Bahrain'],
  },
  'global-stocks': {
    returnAr: '+22.3%', returnEn: '+22.3%', riskAr: 'متوسط إلى مرتفع', riskEn: 'Medium to High', minimum: '10,000 ريال', durationAr: '3-10 سنوات', durationEn: '3-10 Years', liquidityAr: 'عالية', liquidityEn: 'High', shariah: false,
    marketsAr: ['NYSE', 'NASDAQ', 'لندن', 'طوكيو', 'هونغ كونغ', 'فرانكفورت'],
    marketsEn: ['NYSE', 'NASDAQ', 'London', 'Tokyo', 'Hong Kong', 'Frankfurt'],
  },
  crypto: {
    returnAr: '+45.8%', returnEn: '+45.8%', riskAr: 'مرتفع', riskEn: 'High', minimum: '2,000 ريال', durationAr: '2-7 سنوات', durationEn: '2-7 Years', liquidityAr: 'متوسطة', liquidityEn: 'Medium', shariah: false,
    marketsAr: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'BNB/USD', 'XRP/USD', 'ADA/USD'],
    marketsEn: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'BNB/USD', 'XRP/USD', 'ADA/USD'],
  },
  funds: {
    returnAr: '+14.2%', returnEn: '+14.2%', riskAr: 'منخفض إلى مرتفع', riskEn: 'Low to High', minimum: '1,000 ريال', durationAr: '1-10 سنوات', durationEn: '1-10 Years', liquidityAr: 'مرنة', liquidityEn: 'Flexible', shariah: true,
    marketsAr: ['صندوق النقد', 'صندوق الدخل', 'صندوق النمو', 'صندوق متوازن', 'صندوق إسلامي'],
    marketsEn: ['Money Fund', 'Income Fund', 'Growth Fund', 'Balanced Fund', 'Islamic Fund'],
  },
  metals: {
    returnAr: '+11.7%', returnEn: '+11.7%', riskAr: 'منخفض', riskEn: 'Low', minimum: '3,000 ريال', durationAr: '5-15 سنة', durationEn: '5-15 Years', liquidityAr: 'عالية', liquidityEn: 'High', shariah: true,
    marketsAr: ['XAU/USD', 'XAG/USD', 'XPT/USD', 'XPD/USD'],
    marketsEn: ['XAU/USD', 'XAG/USD', 'XPT/USD', 'XPD/USD'],
  },
  energy: {
    returnAr: '+16.9%', returnEn: '+16.9%', riskAr: 'متوسط إلى مرتفع', riskEn: 'Medium to High', minimum: '4,000 ريال', durationAr: '3-8 سنوات', durationEn: '3-8 Years', liquidityAr: 'عالية', liquidityEn: 'High', shariah: false,
    marketsAr: ['CL (WTI)', 'BZ (Brent)', 'NG (Gas)', 'أسهم طاقة متجددة'],
    marketsEn: ['CL (WTI)', 'BZ (Brent)', 'NG (Gas)', 'Renewable Equities'],
  },
};

// Honest, non-misleading placeholder used for any service the admin creates via
// /Akadmin/services_mgr whose id has no matching entry in SERVICE_DETAILS above.
// Previously the detail page silently fell back to the 'gulf-stocks' numbers for
// any unknown id, which would show factually wrong figures for a new/renamed
// service. This fallback instead shows an honest "contact us" placeholder.
export const GENERIC_SERVICE_DETAILS: (typeof SERVICE_DETAILS)[string] = {
  returnAr: 'تواصل معنا', returnEn: 'Contact us', riskAr: '—', riskEn: '—', minimum: 'يحدَّد عند الاستشارة', durationAr: '—', durationEn: '—', liquidityAr: '—', liquidityEn: '—', shariah: false,
  marketsAr: [], marketsEn: [],
};

export const FALLBACK_FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'كيف أبدأ الاستثمار مع ثروة كابيتال؟',
    questionEn: 'How do I start investing with Tharwah Capital?',
    answer: 'البداية بسيطة: احجز استشارة مجانية، أكمل التحقق من الهوية، ثم يحدد مستشارك الاستراتيجية المناسبة لك.',
    answerEn: 'It starts simply: book a free consultation, complete identity verification, then your advisor selects the right strategy for you.',
    category: 'البداية والتسجيل',
    published: true,
    order: 1,
  },
  {
    id: 'faq-2',
    question: 'ما هو الحد الأدنى للاستثمار؟',
    questionEn: 'What is the minimum investment?',
    answer: 'يختلف الحد الأدنى حسب نوع المحفظة، ويبدأ من 10,000 ريال للمحافظ الأساسية.',
    answerEn: 'The minimum varies by portfolio type and starts from SAR 10,000 for core portfolios.',
    category: 'المحفظة والاستثمار',
    published: true,
    order: 2,
  },
  {
    id: 'faq-3',
    question: 'هل الاستثمارات متوافقة مع الشريعة؟',
    questionEn: 'Are the investments Sharia-compliant?',
    answer: 'نعم، المنتجات الاستثمارية التي تحمل علامة التوافق الشرعي تخضع لرقابة شرعية معتمدة.',
    answerEn: 'Yes. Investment products marked as Sharia-compliant are reviewed by an accredited Sharia board.',
    category: 'المحفظة والاستثمار',
    published: true,
    order: 3,
  },
];

export const FALLBACK_NEWS_ARTICLES: NewsArticle[] = [
  {
    id: '1',
    emoji: '📊',
    category: 'analysis',
    categoryAr: 'تحليلات',
    categoryEn: 'Analysis',
    title: 'بيتكوين يسجل مستويات قياسية جديدة تتجاوز $70,000 — ماذا يعني ذلك للمستثمر العربي؟',
    titleEn: 'Bitcoin Records New Highs Above $70,000 — What Does It Mean for Arab Investors?',
    excerpt: 'بعد ارتفاع قوي خلال الأشهر الماضية، نحلل أسباب الصعود وما إذا كانت فرصة الدخول لا تزال قائمة للمستثمر العربي.',
    excerptEn: 'After a strong multi-month rally, we analyse the drivers of the move and whether an entry opportunity still exists for Arab investors.',
    author: 'م. فيصل العمري',
    authorEn: 'Faisal Al-Omari',
    role: 'محلل مالي أول',
    roleEn: 'Senior Financial Analyst',
    date: '15 يونيو 2026',
    dateEn: 'June 15, 2026',
    readTime: '8 دقائق',
    readTimeEn: '8 min',
    views: '12,450',
    trending: true,
    featured: true,
    slug: 'bitcoin-all-time-high-2026',
    bodyAr: [
      'بعد موجة طلب مؤسسي قوية، عاد البيتكوين إلى الواجهة كأحد أكثر الأصول متابعة لدى المستثمرين في المنطقة.',
      'الارتفاع الأخير لا يعني بالضرورة أن نقطة الدخول المثالية انتهت، لكنه يفرض إدارة أكثر انضباطاً للمخاطر وتوزيعاً أدق لرأس المال.',
      'في ثروة كابيتال ننظر إلى الأصول الرقمية ضمن محفظة منوّعة لا كمكوّن منفرد معزول عن بقية فئات الأصول.'
    ],
    bodyEn: [
      'After a wave of strong institutional demand, Bitcoin has returned to the spotlight as one of the region’s most closely watched assets.',
      'The latest rally does not necessarily mean that the ideal entry point is gone, but it does require stricter risk management and tighter capital allocation.',
      'At Tharwah Capital, we treat digital assets as part of a diversified portfolio rather than an isolated standalone allocation.'
    ],
  },
  {
    id: '2',
    emoji: '📈',
    category: 'gulf',
    categoryAr: 'الأسهم الخليجية',
    categoryEn: 'Gulf Stocks',
    title: 'تحليل أداء أسواق الخليج — أين تكمن الفرص الأقوى هذا الربع؟',
    titleEn: 'Gulf Market Performance Analysis — Where Are the Strongest Opportunities This Quarter?',
    excerpt: 'نظرة تحليلية على القطاعات القيادية في الأسواق الخليجية والأوزان التي تستحق المراقبة في المحافظ الإقليمية.',
    excerptEn: 'An analytical look at the leading sectors in Gulf markets and the weights worth monitoring inside regional portfolios.',
    author: 'د. سارة المطيري',
    authorEn: 'Dr. Sara Al-Mutairi',
    role: 'محللة أسواق أولى',
    roleEn: 'Senior Market Analyst',
    date: '10 يونيو 2026',
    dateEn: 'June 10, 2026',
    readTime: '12 دقيقة',
    readTimeEn: '12 min',
    views: '8,230',
    trending: false,
    slug: 'gulf-markets-quarterly-analysis-2026',
    bodyAr: [
      'تظهر الأسواق الخليجية تماسكاً ملحوظاً مدعوماً بأرباح تشغيلية قوية في قطاعات البنوك والطاقة والاتصالات.',
      'المستثمر طويل الأجل لا يبحث فقط عن الارتفاع السعري، بل عن جودة الربحية واستدامة التوزيعات النقدية.',
      'ولهذا تظل عملية الانتقاء النوعي للأصول أهم من مجرد التعرض العام للمؤشر.'
    ],
    bodyEn: [
      'Gulf markets continue to show notable resilience, supported by strong operating earnings in banking, energy, and telecom.',
      'Long-term investors should not look only at price momentum, but also at earnings quality and dividend sustainability.',
      'That is why selective asset picking remains more important than broad index exposure alone.'
    ],
  },
  {
    id: '3',
    emoji: '💎',
    category: 'metals',
    categoryAr: 'المعادن',
    categoryEn: 'Metals',
    title: 'الذهب والتحوّط من التضخم — هل ما زال يحتفظ بدوره الدفاعي؟',
    titleEn: 'Gold and Inflation Hedging — Does It Still Maintain Its Defensive Role?',
    excerpt: 'قراءة في دور الذهب ضمن المحافظ المتوازنة في بيئة أسعار فائدة متحركة وتوقعات تضخم متغيرة.',
    excerptEn: 'A reading of gold’s role inside balanced portfolios in a changing-rate and shifting-inflation environment.',
    author: 'م. خالد الحربي',
    authorEn: 'Khalid Al-Harbi',
    role: 'محلل معادن نفيسة',
    roleEn: 'Precious Metals Analyst',
    date: '5 يونيو 2026',
    dateEn: 'June 5, 2026',
    readTime: '6 دقائق',
    readTimeEn: '6 min',
    views: '5,670',
    trending: false,
    slug: 'gold-inflation-hedge-2026',
    bodyAr: [
      'رغم تغيّر توقعات التضخم، ما زال الذهب يلعب دوراً دفاعياً مهماً عند بناء المحافظ المتوازنة.',
      'تكمن القيمة الحقيقية للذهب في قدرته على تخفيف حدة التقلب حين ترتفع المخاطر الجيوسياسية أو تتراجع الثقة في الأصول عالية المخاطرة.'
    ],
    bodyEn: [
      'Despite changing inflation expectations, gold still plays a meaningful defensive role inside balanced portfolios.',
      'Its real value lies in its ability to dampen volatility when geopolitical risks rise or confidence in higher-risk assets declines.'
    ],
  },
];

export function usePublicServices() {
  const { data } = useCmsSection<ServicesContent>('services', import.meta.env.DEV ? FALLBACK_SERVICES_CONTENT : {});
  const services = useMemo(() => {
    const source = Array.isArray(data.services) ? data.services : (import.meta.env.DEV ? (FALLBACK_SERVICES_CONTENT.services || []) : []);
    return source.filter((item) => item.active !== false);
  }, [data]);

  return {
    content: {
      title: data.title || FALLBACK_SERVICES_CONTENT.title || '',
      titleEn: data.titleEn || FALLBACK_SERVICES_CONTENT.titleEn || '',
      subtitle: data.subtitle || FALLBACK_SERVICES_CONTENT.subtitle || '',
      subtitleEn: data.subtitleEn || FALLBACK_SERVICES_CONTENT.subtitleEn || '',
      services,
    },
  };
}

export function usePublicFaqItems() {
  const { data } = useCmsSection<FaqItem[]>('faq', import.meta.env.DEV ? FALLBACK_FAQ_ITEMS : []);
  const items = useMemo(() => {
    const source = Array.isArray(data) ? data : [];
    const normalized = source.length > 0 ? source : (import.meta.env.DEV ? FALLBACK_FAQ_ITEMS : []);
    return normalized.filter((item) => item.published !== false).sort((a, b) => a.order - b.order);
  }, [data]);
  return { items };
}

export function usePublicNewsArticles() {
  const { data } = useCmsSection<{ articles?: NewsArticle[] }>('news', import.meta.env.DEV ? { articles: FALLBACK_NEWS_ARTICLES } : { articles: [] });
  const articles = useMemo(() => {
    const source = Array.isArray(data.articles) ? data.articles : (import.meta.env.DEV ? FALLBACK_NEWS_ARTICLES : []);
    return source;
  }, [data]);
  return { articles };
}
