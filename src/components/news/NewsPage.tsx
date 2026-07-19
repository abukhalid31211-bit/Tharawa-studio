import React, { useState, useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Link } from '@tanstack/react-router';
import {
  Search, Clock, Calendar, Eye, ArrowLeft, ArrowRight,
  ChevronDown, CheckCircle, Mail, Shield, Check, X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// ─── Types ───────────────────────────────────────────────
type CategoryKey = 'all' | 'analysis' | 'gulf' | 'global' | 'crypto' | 'metals' | 'energy' | 'strategy';
type SortKey = 'newest' | 'oldest' | 'mostread' | 'longest';

interface Article {
  id: string; emoji: string; category: CategoryKey;
  title: string; titleEn: string; excerpt: string; excerptEn: string;
  author: string; authorEn: string; role: string; roleEn: string;
  date: string; dateEn: string; readTime: string; readTimeEn: string;
  views: string; trending: boolean; featured?: boolean;
  slug: string;
}

// ─── Mock Data ───────────────────────────────────────────
const ARTICLES: Article[] = [
  {
    id: '1', emoji: '📊', category: 'analysis', featured: true,
    title: 'بيتكوين يسجل مستويات قياسية جديدة تتجاوز $70,000 — ماذا يعني ذلك للمستثمر العربي في 2025؟',
    titleEn: 'Bitcoin Records New All-Time Highs Exceeding $70,000 — What Does It Mean for Arab Investors in 2025?',
    excerpt: 'بعد ارتفاع نسبته 45% خلال الربع الأول من 2025، سجّل Bitcoin مستويات قياسية جديدة تجاوزت $70,000 للعملة الواحدة. هذا الارتفاع المتسارع يطرح تساؤلات جوهرية حول ما إذا كانت فرصة الدخول لا تزال قائمة للمستثمر العربي، وكيف يمكن الاستفادة من هذه الدورة الجديدة بحكمة وتوازن',
    excerptEn: 'After a 45% surge in Q1 2025, Bitcoin recorded new highs exceeding $70,000 per coin. This rapid rise raises fundamental questions about whether the entry opportunity still exists for Arab investors, and how to benefit from this new cycle wisely and in a balanced manner',
    author: 'م. فيصل العمري', authorEn: 'Faisal Al-Omari',
    role: 'محلل مالي أول', roleEn: 'Senior Financial Analyst',
    date: '15 يونيو 2025', dateEn: 'June 15, 2025',
    readTime: '8 دقائق', readTimeEn: '8 min',
    views: '12,450', trending: true, slug: 'bitcoin-all-time-high-2025',
  },
  {
    id: '2', emoji: '📈', category: 'gulf',
    title: 'تحليل أداء أسواق الخليج في الربع الثاني من 2025 — الفرص الحقيقية والمخاطر المخفية',
    titleEn: 'Gulf Markets Performance Analysis in Q2 2025 — Real Opportunities and Hidden Risks',
    excerpt: 'يستعرض تقريرنا الشامل أداء أسواق السعودية وأبوظبي ودبي والكويت في الربع الثاني، مع التركيز على القطاعات الأكثر نمواً وتحديد الأسهم التي تُقدم قيمة استثمارية حقيقية في المرحلة الراهنة',
    excerptEn: 'Our comprehensive report reviews the performance of Saudi, Abu Dhabi, Dubai, and Kuwait markets in Q2, focusing on the fastest-growing sectors and identifying stocks that offer real investment value in the current phase',
    author: 'د. سارة المطيري', authorEn: 'Dr. Sara Al-Mutairi',
    role: 'محللة أسواق أولى', roleEn: 'Senior Market Analyst',
    date: '10 يونيو 2025', dateEn: 'June 10, 2025',
    readTime: '12 دقيقة', readTimeEn: '12 min',
    views: '8,230', trending: false, slug: 'gulf-markets-q2-2025',
  },
  {
    id: '3', emoji: '💎', category: 'metals',
    title: 'الذهب كسلاح ضد التضخم — هل حان الوقت للتراجع؟ قراءة تحليلية معمّقة',
    titleEn: 'Gold as an Inflation Weapon — Is It Time for a Pullback? An In-Depth Analytical Reading',
    excerpt: 'مع تراجع مؤشرات التضخم تدريجياً في الاقتصادات الكبرى والتوقعات المتباينة حول قرارات الفائدة، نُحلل الدور الاستراتيجي للذهب في المحفظة المتوازنة ونُجيب على سؤال يؤرق كثيراً من المستثمرين',
    excerptEn: 'As inflation indicators gradually decline in major economies amid divergent expectations about interest rate decisions, we analyze the strategic role of gold in a balanced portfolio and answer a question that troubles many investors',
    author: 'م. خالد الحربي', authorEn: 'Khalid Al-Harbi',
    role: 'محلل معادن نفيسة', roleEn: 'Precious Metals Analyst',
    date: '5 يونيو 2025', dateEn: 'June 5, 2025',
    readTime: '6 دقائق', readTimeEn: '6 min',
    views: '5,670', trending: false, slug: 'gold-inflation-weapon-2025',
  },
  {
    id: '4', emoji: '🌐', category: 'global',
    title: 'أسهم الذكاء الاصطناعي في 2025 — بين الفرصة الحقيقية والمبالغة في التقييم',
    titleEn: 'AI Stocks in 2025 — Between Real Opportunity and Overvaluation',
    excerpt: 'NVIDIA وMeta وGoogle تُسجل أرباحاً قياسية، لكن هل التقييمات الحالية مبررة اقتصادياً أم أننا أمام فقاعة قادمة؟ نُقدم تحليلاً معمقاً لأبرز أسهم التقنية المرتبطة بالذكاء الاصطناعي',
    excerptEn: 'NVIDIA, Meta, and Google post record earnings, but are current valuations economically justified or are we facing an approaching bubble? We present an in-depth analysis of the most prominent AI-related technology stocks',
    author: 'م. أحمد الزهراني', authorEn: 'Ahmed Al-Zahrani',
    role: 'محلل تقنية مالية', roleEn: 'Financial Technology Analyst',
    date: '1 يونيو 2025', dateEn: 'June 1, 2025',
    readTime: '10 دقائق', readTimeEn: '10 min',
    views: '15,800', trending: true, slug: 'ai-stocks-2025-analysis',
  },
  {
    id: '5', emoji: '⛽', category: 'energy',
    title: 'أسعار النفط بعد قرارات أوبك+ الأخيرة — ماذا يتوقع المحللون حتى نهاية 2025؟',
    titleEn: 'Oil Prices After Latest OPEC+ Decisions — What Do Analysts Expect Through End of 2025?',
    excerpt: 'بعد قرار أوبك+ بتمديد خفض الإنتاج لربع إضافي، نستعرض توقعات أسعار النفط حتى نهاية العام والقطاعات والشركات الأكثر استفادة من هذا القرار',
    excerptEn: 'After OPEC+\'s decision to extend production cuts for an additional quarter, we review oil price forecasts through year-end and the sectors and companies most benefiting from this decision',
    author: 'م. هند القحطاني', authorEn: 'Hind Al-Qahtani',
    role: 'محللة طاقة', roleEn: 'Energy Analyst',
    date: '25 مايو 2025', dateEn: 'May 25, 2025',
    readTime: '7 دقائق', readTimeEn: '7 min',
    views: '4,320', trending: false, slug: 'oil-prices-opec-2025',
  },
  {
    id: '6', emoji: '📋', category: 'strategy',
    title: 'دليل تنويع المحفظة الاستثمارية للمستثمر العربي في 2025 — كيف توزع أصولك بذكاء؟',
    titleEn: 'Portfolio Diversification Guide for the Arab Investor in 2025 — How to Allocate Your Assets Wisely?',
    excerpt: 'كيف توزع أصولك بذكاء بين الأسهم والمعادن والعملات الرقمية والطاقة؟ دليل عملي شامل مع أمثلة واقعية من السوق ونماذج محافظ مقترحة لمستويات مختلفة من رأس المال والمخاطر',
    excerptEn: 'How to wisely allocate your assets among equities, metals, cryptocurrencies, and energy? A comprehensive practical guide with real market examples and suggested portfolio models for different levels of capital and risk',
    author: 'د. سارة المطيري', authorEn: 'Dr. Sara Al-Mutairi',
    role: 'مستشارة استثمارات', roleEn: 'Investment Advisor',
    date: '20 مايو 2025', dateEn: 'May 20, 2025',
    readTime: '15 دقيقة', readTimeEn: '15 min',
    views: '9,110', trending: false, slug: 'portfolio-diversification-guide-2025',
  },
];

const WRITERS = [
  { initial: 'ف', initialEn: 'F', name: 'م. فيصل العمري', nameEn: 'Faisal Al-Omari' },
  { initial: 'س', initialEn: 'S', name: 'د. سارة المطيري', nameEn: 'Dr. Sara Al-Mutairi' },
  { initial: 'خ', initialEn: 'K', name: 'م. خالد الحربي', nameEn: 'Khalid Al-Harbi' },
  { initial: 'أ', initialEn: 'A', name: 'م. أحمد الزهراني', nameEn: 'Ahmed Al-Zahrani' },
  { initial: 'ه', initialEn: 'H', name: 'م. هند القحطاني', nameEn: 'Hind Al-Qahtani' },
];

const CATEGORIES: { key: CategoryKey; label: string; labelEn: string }[] = [
  { key: 'all', label: 'الكل', labelEn: 'All' },
  { key: 'analysis', label: 'تحليلات', labelEn: 'Analysis' },
  { key: 'gulf', label: 'الأسهم الخليجية', labelEn: 'Gulf Stocks' },
  { key: 'global', label: 'الأسهم العالمية', labelEn: 'Global Stocks' },
  { key: 'crypto', label: 'العملات الرقمية', labelEn: 'Crypto' },
  { key: 'metals', label: 'المعادن', labelEn: 'Metals' },
  { key: 'energy', label: 'الطاقة', labelEn: 'Energy' },
  { key: 'strategy', label: 'استراتيجية', labelEn: 'Strategy' },
];

const CATEGORY_LABEL_MAP: Record<CategoryKey, string> = {
  all: 'الكل', analysis: 'تحليلات', gulf: 'الأسهم الخليجية',
  global: 'الأسهم العالمية', crypto: 'العملات الرقمية',
  metals: 'المعادن', energy: 'الطاقة', strategy: 'استراتيجية',
};
const CATEGORY_LABEL_EN_MAP: Record<CategoryKey, string> = {
  all: 'All', analysis: 'Analysis', gulf: 'Gulf Stocks',
  global: 'Global Stocks', crypto: 'Crypto',
  metals: 'Metals', energy: 'Energy', strategy: 'Strategy',
};

// ─── Article Card ─────────────────────────────────────────
function ArticleCard({ article, featured }: { article: Article; featured?: boolean }) {
  const { lang } = useLang();
  const isAr = lang === 'ar';

  if (featured) {
    return (
      <Link to="/article/$slug" params={{ slug: article.slug }} className="block group">
        <Card className="overflow-hidden p-0 hover:border-gold-primary hover:shadow-gold-sm hover:-translate-y-0.5 transition-all duration-200">
          <div className="h-[280px] bg-gradient-to-br from-gold-subtle to-secondary relative flex items-center justify-center">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20px 20px, #C9A84C 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <span className="text-6xl relative z-10">{article.emoji}</span>
            <span className="absolute top-4 rtl:right-4 ltr:left-4 gradient-gold text-white text-[11px] font-bold px-3 py-1 rounded-sm">
              {isAr ? '⭐ المقال المميز' : '⭐ Featured Article'}
            </span>
          </div>
          <div className="p-8 space-y-4">
            <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
              <span className="bg-gold-subtle border border-border-gold text-gold-deep font-bold px-2.5 py-1 rounded-sm">
                {isAr ? CATEGORY_LABEL_MAP[article.category] : CATEGORY_LABEL_EN_MAP[article.category]}
              </span>
              {article.trending && <span className="bg-error-light text-error font-bold px-2.5 py-1 rounded-sm">🔥 {isAr ? 'رائج' : 'Trending'}</span>}
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{isAr ? article.date : article.dateEn}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{isAr ? article.readTime : article.readTimeEn}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{article.views}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-text-primary group-hover:text-gold-deep transition-colors line-clamp-2">
              {isAr ? article.title : article.titleEn}
            </h2>
            <p className="text-base text-text-secondary leading-relaxed line-clamp-3">
              {isAr ? article.excerpt : article.excerptEn}
            </p>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center text-white text-xs font-black">
                  {isAr ? article.author[0] : article.authorEn[0]}
                </div>
                <div>
                  <span className="text-sm font-bold text-text-secondary">{isAr ? article.author : article.authorEn}</span>
                  <span className="text-xs text-text-muted mx-1">•</span>
                  <span className="text-xs text-text-muted">{isAr ? article.role : article.roleEn}</span>
                </div>
              </div>
              <span className="flex items-center gap-1 text-sm font-bold text-gold-deep group-hover:gap-2 transition-all">
                {isAr ? 'اقرأ التحليل الكامل' : 'Read Full Analysis'}
                {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              </span>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link to="/article/$slug" params={{ slug: article.slug }} className="block group">
      <Card className="overflow-hidden p-0 hover:border-gold-primary hover:shadow-gold-sm hover:-translate-y-1 transition-all duration-200 h-full">
        <div className="h-[200px] bg-gradient-to-br from-gold-subtle/50 to-secondary flex items-center justify-center relative">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 15px 15px, #C9A84C 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <span className="text-5xl relative z-10">{article.emoji}</span>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap">
            <span className="bg-gold-subtle border border-border-gold text-gold-deep font-bold px-2 py-0.5 rounded-sm">
              {isAr ? CATEGORY_LABEL_MAP[article.category] : CATEGORY_LABEL_EN_MAP[article.category]}
            </span>
            {article.trending && <span className="bg-error-light text-error font-bold px-2 py-0.5 rounded-sm">🔥</span>}
            <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{isAr ? article.readTime : article.readTimeEn}</span>
          </div>
          <h3 className="font-bold text-text-primary leading-snug line-clamp-2 group-hover:text-gold-deep transition-colors">
            {isAr ? article.title : article.titleEn}
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
            {isAr ? article.excerpt : article.excerptEn}
          </p>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <div className="w-6 h-6 rounded-full gradient-gold flex items-center justify-center text-white text-[9px] font-black">
                {isAr ? article.author[0] : article.authorEn[0]}
              </div>
              <span>{isAr ? article.author : article.authorEn}</span>
              <span>•</span>
              <span>{isAr ? article.date : article.dateEn}</span>
            </div>
            <span className="text-gold-primary group-hover:translate-x-1 transition-transform duration-200">
              {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// ─── Main Component ──────────────────────────────────────
export function NewsPage() {
  const { t, lang } = useLang();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [activeWriter, setActiveWriter] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(6);
  const [subscribed, setSubscribed] = useState(false);

  // Newsletter form
  const [subName, setSubName] = useState('');
  const [subEmail, setSubEmail] = useState('');

  const filteredArticles = useMemo(() => {
    let list = ARTICLES;
    if (activeCategory !== 'all') list = list.filter(a => a.category === activeCategory);
    if (activeWriter) list = list.filter(a => a.authorEn === activeWriter || a.author === activeWriter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) || a.titleEn.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) || a.excerptEn.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q) || a.authorEn.toLowerCase().includes(q)
      );
    }
    const sortFn = (a: Article, b: Article) => {
      switch (sortKey) {
        case 'newest': return parseInt(b.id) - parseInt(a.id);
        case 'oldest': return parseInt(a.id) - parseInt(b.id);
        case 'mostread': return parseInt(b.views.replace(/,/g, '')) - parseInt(a.views.replace(/,/g, ''));
        case 'longest': return parseInt(b.readTime) - parseInt(a.readTime);
        default: return 0;
      }
    };
    return [...list].sort(sortFn);
  }, [activeCategory, searchQuery, sortKey, activeWriter]);

  const sortedArticles = filteredArticles;
  const featuredArticle = sortedArticles.find(a => a.featured);
  const gridArticles = sortedArticles.filter(a => !a.featured);
  const displayed = featuredArticle ? [featuredArticle, ...gridArticles.slice(0, displayCount - 1)] : gridArticles.slice(0, displayCount);
  const hasMore = displayed.length < sortedArticles.length;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (subName && subEmail) setSubscribed(true);
  };

  return (
    <div className="w-full">
      {/* 2.6.1 — Hero */}
      <section className="relative pt-28 pb-16 bg-gradient-to-b from-white via-secondary to-tertiary dark:from-[#0D0D1A] dark:via-[#13132A] dark:to-[#1A1A3A] text-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03 dark:opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, #C9A84C 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <span className="inline-block text-xs font-black uppercase tracking-[0.2em] text-gold-deep mb-4">{t('المعرفة المالية', 'FINANCIAL KNOWLEDGE')}</span>
          <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-4">{t('تحليلات ورؤى مالية من خبراء موثوقين', 'Financial Analysis and Insights from Trusted Experts')}</h1>
          <p className="text-text-secondary text-base max-w-2xl mx-auto leading-relaxed">{t(
            'فريق محللينا المعتمدين يُقدم أعمق التحليلات وأكثرها موضوعية لأسواق المال العربية والعالمية — مجاناً ودون قيود. لأن المستثمر المتعلم هو المستثمر الناجح',
            'Our team of certified analysts delivers the deepest and most objective analysis of Arab and global financial markets — free and without restrictions.'
          )}</p>

          {/* Stats Strip */}
          <div className="mt-10 flex items-center justify-center gap-8 md:gap-16">
            {[
              { num: '150+', label: t('مقال وتحليل منشور', 'Published Articles & Analysis') },
              { num: '6', label: t('تصنيفات تغطي كل الأسواق', 'Categories Covering All Markets') },
              { num: t('أسبوعياً', 'Weekly'), label: t('تحديثات ومقالات جديدة', 'Updates and New Articles') },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-black font-mono text-gold-deep">{stat.num}</div>
                <div className="text-xs text-text-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Writers Bar */}
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <span className="text-xs text-text-muted">{t('يكتب لنا:', 'Written by:')}</span>
            {WRITERS.map((w, i) => (
              <button
                key={i}
                onClick={() => setActiveWriter(activeWriter === w.name ? null : w.name)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeWriter === w.name
                    ? 'gradient-gold text-white shadow-gold-sm'
                    : 'bg-secondary border border-border-default text-text-secondary hover:border-gold-primary'
                }`}
              >
                <div className="w-6 h-6 rounded-full gradient-gold flex items-center justify-center text-white text-[9px] font-black">
                  {lang === 'ar' ? w.initial : w.initialEn}
                </div>
                <span>{lang === 'ar' ? w.name : w.nameEn}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2.6.2 — Filters & Search */}
      <section className="sticky top-0 z-40 bg-primary border-b border-border-light py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Categories */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-text-muted font-medium">{t('تصفح حسب:', 'Browse by:')}</span>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                    activeCategory === cat.key
                      ? 'gradient-gold text-white shadow-gold-sm'
                      : 'bg-secondary border border-border-default text-text-secondary hover:border-gold-primary hover:text-gold-deep'
                  }`}
                >
                  {lang === 'ar' ? cat.label : cat.labelEn}
                </button>
              ))}
            </div>

            {/* Search & Sort */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('ابحث في المقالات والتحليلات...', 'Search articles and analysis...')}
                  className="w-52 bg-secondary border border-border-default rounded-md py-2 rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3 text-xs font-bold outline-none focus:border-gold-primary transition-colors"
                />
              </div>
              <select
                value={sortKey}
                onChange={e => setSortKey(e.target.value as SortKey)}
                className="bg-secondary border border-border-default rounded-md py-2 px-3 text-xs font-bold text-text-secondary outline-none focus:border-gold-primary"
              >
                <option value="newest">{t('الأحدث أولاً', 'Newest First')}</option>
                <option value="oldest">{t('الأقدم أولاً', 'Oldest First')}</option>
                <option value="mostread">{t('الأكثر قراءة', 'Most Read')}</option>
                <option value="longest">{t('الأطول قراءة', 'Longest Read')}</option>
              </select>
            </div>
          </div>

          {/* Search Results info */}
          {searchQuery && (
            <div className="mt-2 text-xs text-text-muted flex items-center gap-2">
              <span>{t(`نتائج البحث عن: '${searchQuery}' — ${filteredArticles.length} مقال`, `Search results for: '${searchQuery}' — ${filteredArticles.length} articles`)}</span>
              <button onClick={() => setSearchQuery('')} className="text-gold-deep font-bold hover:underline">
                {t('مسح البحث', 'Clear Search')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 2.6.3 & 2.6.4 — Articles */}
      <section className="bg-primary py-8">
        <div className="max-w-7xl mx-auto px-4">
          {displayed.length > 0 ? (
            <div className="space-y-8">
              {/* Featured Article */}
              {featuredArticle && activeCategory === 'all' && !searchQuery && !activeWriter && (
                <ArticleCard article={featuredArticle} featured />
              )}

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(featuredArticle && activeCategory === 'all' && !searchQuery && !activeWriter
                  ? gridArticles.slice(0, displayCount - 1)
                  : displayed
                ).map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-lg font-bold text-text-muted mb-2">{t('لا توجد مقالات تطابق بحثك', 'No Articles Match Your Search')}</h3>
              <p className="text-sm text-text-muted mb-4">{t('جرب كلمات بحث مختلفة أو اختر تصنيفاً آخر', 'Try different search terms or select another category')}</p>
              <Button onClick={() => { setSearchQuery(''); setActiveCategory('all'); setActiveWriter(null); }}>
                {t('عرض كل المقالات', 'Show All Articles')}
              </Button>
            </div>
          )}

          {/* 2.6.5 — Load More */}
          <div className="py-10 text-center">
            {hasMore ? (
              <Button
                variant="ghost"
                onClick={() => setDisplayCount(prev => prev + 3)}
                className="px-10 py-4 border-gold-primary text-gold-deep font-bold hover:bg-gold-subtle"
              >
                <ChevronDown className="w-4 h-4 ml-1" />
                {t('تحميل مقالات إضافية', 'Load More Articles')}
              </Button>
            ) : sortedArticles.length > 0 ? (
              <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>{t('لقد شاهدت كل المقالات المتاحة', 'You have viewed all available articles')}</span>
              </div>
            ) : null}

            {/* Progress bar */}
            {sortedArticles.length > 0 && (
              <div className="mt-6 max-w-xs mx-auto">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-border-light rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-gold rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((displayed.length / sortedArticles.length) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-muted whitespace-nowrap">
                    {displayed.length} {t('من', 'of')} {sortedArticles.length}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2.6.6 — Newsletter */}
      <section className="bg-gold-subtle border-y border-gold-primary/20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-primary border border-gold-primary rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Left - Content */}
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center shadow-gold-sm">
                  <span className="text-2xl">📬</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-text-primary">
                  {t('كن أول من يطّلع على تحليلاتنا الأسبوعية', 'Be the First to Access Our Weekly Analysis')}
                </h3>
                <p className="text-base text-text-secondary leading-relaxed">
                  {t(
                    'كل ثلاثاء صباحاً نُرسل لك أفضل التحليلات المالية ونظرة على الفرص الاستثمارية للأسبوع القادم — مجاناً ودون أي إزعاج إضافي',
                    'Every Tuesday morning we send you the best financial analysis and a look at investment opportunities for the coming week — free and without any additional spam'
                  )}
                </p>
                <ul className="space-y-2">
                  {[
                    { ar: 'تحليل أسبوعي معمّق للأسواق', en: 'Weekly in-depth market analysis' },
                    { ar: 'فرص استثمارية مختارة بعناية', en: 'Carefully selected investment opportunities' },
                    { ar: 'ملخص أداء محافظ ثروة كابيتال', en: 'Tharwah Capital portfolio performance summary' },
                    { ar: 'نصائح وتوصيات المحللين المعتمدين', en: 'Tips from certified analysts' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                      <CheckCircle className="w-4 h-4 text-gold-deep shrink-0" />
                      <span>{lang === 'ar' ? item.ar : item.en}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right - Form */}
              <div>
                {subscribed ? (
                  <div className="text-center py-8 animate-in zoom-in-95">
                    <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                    <h4 className="text-xl font-black text-success">
                      {t('تم الاشتراك بنجاح! 🎉 سنتواصل معك كل ثلاثاء', 'Successfully subscribed! 🎉 We will contact you every Tuesday')}
                    </h4>
                  </div>
                ) : (
                  <Card className="p-6 space-y-4">
                    <form onSubmit={handleSubscribe} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-secondary">{t('اسمك الكريم', 'Your Name')}</label>
                        <input
                          type="text"
                          required
                          value={subName}
                          onChange={e => setSubName(e.target.value)}
                          className="w-full bg-secondary border border-border-default rounded-md py-2.5 px-4 text-xs font-bold outline-none focus:border-gold-primary transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-secondary">{t('بريدك الإلكتروني', 'Your Email')}</label>
                        <input
                          type="email"
                          required
                          value={subEmail}
                          onChange={e => setSubEmail(e.target.value)}
                          className="w-full bg-secondary border border-border-default rounded-md py-2.5 px-4 text-xs font-bold outline-none focus:border-gold-primary transition-colors"
                        />
                      </div>
                      <Button type="submit" className="w-full py-3">
                        <Mail className="w-4 h-4 ml-1" />
                        {t('اشتراك مجاني — بلا إزعاج', 'Free Subscription — No Spam')}
                      </Button>
                    </form>
                    <div className="flex items-center gap-2 text-[11px] text-text-muted">
                      <Shield className="w-3.5 h-3.5" />
                      <span>{t('لا spam أبداً. بياناتك آمنة تماماً. يمكن إلغاء الاشتراك بنقرة واحدة', 'No spam ever. Your data is completely safe. Unsubscribe with one click')}</span>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
