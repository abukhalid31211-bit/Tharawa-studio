import React, { useMemo, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Link } from '@tanstack/react-router';
import {
  Search, Clock, Calendar, Eye, ArrowLeft, ArrowRight,
  ChevronDown, CheckCircle, Mail, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { usePublicNewsArticles, type NewsArticle, type NewsCategoryKey } from '@/lib/publicContent';
import { api } from '@/lib/api';

type SortKey = 'newest' | 'oldest' | 'mostread' | 'longest';

const CATEGORY_LABEL_MAP: Record<NewsCategoryKey, { ar: string; en: string }> = {
  all: { ar: 'الكل', en: 'All' },
  analysis: { ar: 'تحليلات', en: 'Analysis' },
  gulf: { ar: 'الأسهم الخليجية', en: 'Gulf Stocks' },
  global: { ar: 'الأسهم العالمية', en: 'Global Stocks' },
  crypto: { ar: 'العملات الرقمية', en: 'Crypto' },
  metals: { ar: 'المعادن', en: 'Metals' },
  energy: { ar: 'الطاقة', en: 'Energy' },
  strategy: { ar: 'استراتيجية', en: 'Strategy' },
};

function ArticleCard({ article, featured }: { article: NewsArticle; featured?: boolean }) {
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
                {isAr ? article.categoryAr : article.categoryEn}
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
              {isAr ? article.categoryAr : article.categoryEn}
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

export function NewsPage() {
  const { t, lang } = useLang();
  const { articles } = usePublicNewsArticles();
  const [activeCategory, setActiveCategory] = useState<NewsCategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [activeWriter, setActiveWriter] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(6);
  const [subscribed, setSubscribed] = useState(false);
  const [subName, setSubName] = useState('');
  const [subEmail, setSubEmail] = useState('');

  const categories = useMemo(() => {
    const usedCategories = new Set<NewsCategoryKey>(['all']);
    articles.forEach((article) => usedCategories.add(article.category));
    return Array.from(usedCategories).map((key) => ({ key, ...CATEGORY_LABEL_MAP[key] }));
  }, [articles]);

  const writers = useMemo(() => Array.from(new Map(
    articles.map((article) => [article.authorEn, {
      initial: article.author[0] || 'ث',
      initialEn: article.authorEn[0] || 'T',
      name: article.author,
      nameEn: article.authorEn,
    }])
  ).values()), [articles]);

  const filteredArticles = useMemo(() => {
    let list = articles;
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
    const sortFn = (a: NewsArticle, b: NewsArticle) => {
      switch (sortKey) {
        case 'newest': return parseInt(b.id) - parseInt(a.id);
        case 'oldest': return parseInt(a.id) - parseInt(b.id);
        case 'mostread': return parseInt(b.views.replace(/,/g, '')) - parseInt(a.views.replace(/,/g, ''));
        case 'longest': return parseInt(b.readTime) - parseInt(a.readTime);
        default: return 0;
      }
    };
    return [...list].sort(sortFn);
  }, [activeCategory, articles, searchQuery, sortKey, activeWriter]);

  const featuredArticle = filteredArticles.find(a => a.featured);
  const gridArticles = filteredArticles.filter(a => !a.featured);
  const displayed = featuredArticle ? [featuredArticle, ...gridArticles.slice(0, displayCount - 1)] : gridArticles.slice(0, displayCount);
  const hasMore = displayed.length < filteredArticles.length;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName || !subEmail) return;
    await api.submitContact({
      name: subName,
      email: subEmail,
      subject: 'الاشتراك في النشرة التحليلية',
      message: `طلب اشتراك في النشرة التحليلية من صفحة الأخبار. الاسم: ${subName}`,
    });
    setSubscribed(true);
    setSubName('');
    setSubEmail('');
  };

  return (
    <div className="w-full">
      <section className="relative pt-28 pb-16 bg-gradient-to-b from-white via-secondary to-tertiary dark:from-[#0D0D1A] dark:via-[#13132A] dark:to-[#1A1A3A] text-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03 dark:opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, #C9A84C 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <span className="inline-block text-xs font-black uppercase tracking-[0.2em] text-gold-deep mb-4">{t('المعرفة المالية', 'FINANCIAL KNOWLEDGE')}</span>
          <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-4">{t('تحليلات ورؤى مالية من خبراء موثوقين', 'Financial Analysis and Insights from Trusted Experts')}</h1>
          <p className="text-text-secondary text-base max-w-2xl mx-auto leading-relaxed">{t('تُدار مقالات الأخبار والتحليلات من داخل المنصة، وتظهر هنا مباشرة بعد النشر من الإدارة.', 'News and analysis articles are managed from inside the platform and appear here immediately after publishing from the admin panel.')}</p>

          <div className="mt-10 flex items-center justify-center gap-8 md:gap-16">
            {[
              { num: articles.length || '—', label: t('مقال وتحليل منشور', 'Published Articles & Analysis') },
              { num: Math.max(categories.length - 1, 0), label: t('تصنيفات تغطي كل الأسواق', 'Categories Covering All Markets') },
              { num: t('داخلي', 'Internal'), label: t('نشر من لوحة الإدارة', 'Published from Admin') },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-black font-mono text-gold-deep">{stat.num}</div>
                <div className="text-xs text-text-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {writers.length > 0 && (
            <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
              <span className="text-xs text-text-muted">{t('يكتب لنا:', 'Written by:')}</span>
              {writers.map((w, i) => (
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
          )}
        </div>
      </section>

      <section className="sticky top-0 z-40 bg-primary border-b border-border-light py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-text-muted font-medium">{t('تصفح حسب:', 'Browse by:')}</span>
              {categories.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                    activeCategory === cat.key
                      ? 'gradient-gold text-white shadow-gold-sm'
                      : 'bg-secondary border border-border-default text-text-secondary hover:border-gold-primary hover:text-gold-deep'
                  }`}
                >
                  {lang === 'ar' ? cat.ar : cat.en}
                </button>
              ))}
            </div>

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
        </div>
      </section>

      <section className="bg-primary py-8">
        <div className="max-w-7xl mx-auto px-4">
          {displayed.length > 0 ? (
            <div className="space-y-8">
              {featuredArticle && activeCategory === 'all' && !searchQuery && !activeWriter && (
                <ArticleCard article={featuredArticle} featured />
              )}

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
              <h3 className="text-lg font-bold text-text-muted mb-2">{t('لا توجد مقالات منشورة حالياً', 'No published articles are available right now')}</h3>
              <p className="text-sm text-text-muted mb-4">{t('ستظهر هنا المقالات فور نشرها من لوحة الإدارة الداخلية', 'Articles will appear here as soon as they are published from the internal admin panel')}</p>
              <Button onClick={() => { setSearchQuery(''); setActiveCategory('all'); setActiveWriter(null); }}>
                {t('تحديث العرض', 'Refresh View')}
              </Button>
            </div>
          )}

          <div className="py-10 text-center">
            {hasMore ? (
              <Button variant="ghost" onClick={() => setDisplayCount(prev => prev + 3)} className="px-10 py-4 border-gold-primary text-gold-deep font-bold hover:bg-gold-subtle">
                <ChevronDown className="w-4 h-4 ml-1" />
                {t('تحميل مقالات إضافية', 'Load More Articles')}
              </Button>
            ) : filteredArticles.length > 0 ? (
              <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>{t('لقد شاهدت كل المقالات المتاحة', 'You have viewed all available articles')}</span>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-gold-subtle border-y border-gold-primary/20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-primary border border-gold-primary rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center shadow-gold-sm">
                  <span className="text-2xl">📬</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-text-primary">
                  {t('كن أول من يطّلع على تحليلاتنا الأسبوعية', 'Be the First to Access Our Weekly Analysis')}
                </h3>
                <p className="text-base text-text-secondary leading-relaxed">
                  {t('يمكنك الاشتراك ليرسل فريقنا الداخلي لك التحديثات والتحليلات الدورية عبر البريد.', 'You can subscribe so our internal team sends you periodic updates and analysis by email.')}
                </p>
              </div>

              <div>
                {subscribed ? (
                  <div className="text-center py-8 animate-in zoom-in-95">
                    <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                    <h4 className="text-xl font-black text-success">
                      {t('تم تسجيل طلب اشتراكك بنجاح', 'Your subscription request has been recorded successfully')}
                    </h4>
                  </div>
                ) : (
                  <Card className="p-6 space-y-4">
                    <form onSubmit={handleSubscribe} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-secondary">{t('اسمك الكريم', 'Your Name')}</label>
                        <input type="text" required value={subName} onChange={e => setSubName(e.target.value)} className="w-full bg-secondary border border-border-default rounded-md py-2.5 px-4 text-xs font-bold outline-none focus:border-gold-primary transition-colors" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-secondary">{t('بريدك الإلكتروني', 'Your Email')}</label>
                        <input type="email" required value={subEmail} onChange={e => setSubEmail(e.target.value)} className="w-full bg-secondary border border-border-default rounded-md py-2.5 px-4 text-xs font-bold outline-none focus:border-gold-primary transition-colors" />
                      </div>
                      <Button type="submit" className="w-full py-3">
                        <Mail className="w-4 h-4 ml-1" />
                        {t('اشتراك مجاني — بلا إزعاج', 'Free Subscription — No Spam')}
                      </Button>
                    </form>
                    <div className="flex items-center gap-2 text-[11px] text-text-muted">
                      <Shield className="w-3.5 h-3.5" />
                      <span>{t('يتم حفظ طلبات الاشتراك داخلياً داخل المنصة', 'Subscription requests are stored internally inside the platform')}</span>
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
