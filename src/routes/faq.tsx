import { createFileRoute, Link } from '@tanstack/react-router';
import { useLang } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Search, HelpCircle, TrendingUp, ChevronDown, Rocket, Briefcase, DollarSign, ShieldAlert, CreditCard, Lock, Moon, HeadphonesIcon, Zap } from 'lucide-react';

export const Route = createFileRoute('/faq')({ component: FAQPage });

const faqs = [
  {
    category: 'start',
    categoryAr: 'البداية والتسجيل',
    categoryEn: 'Getting Started',
    emoji: '🚀',
    questions: [
      {
        qAr: 'كيف أبدأ الاستثمار مع ثروة كابيتال؟',
        qEn: 'How do I start investing with Tharwah Capital?',
        aAr: 'البداية بسيطة وسهلة — ما عليك سوى حجز استشارة مجانية عبر صفحة التواصل معنا. سيتواصل معك أحد مستشارينا الماليين المعتمدين خلال 24 ساعة لتحديد أهدافك المالية ومستوى تحملك للمخاطر وأفق استثمارك الزمني.',
        aEn: 'Getting started is simple and easy — all you need to do is book a free consultation through our contact page. One of our certified financial advisors will reach out within 24 hours to identify your financial goals and risk tolerance.',
      },
      {
        qAr: 'ما هي المستندات المطلوبة لفتح حساب استثماري؟',
        qEn: 'What documents are required to open an investment account?',
        aAr: 'نحتاج لمستندات بسيطة لإتمام إجراءات التحقق من الهوية (KYC): صورة من بطاقة الهوية الوطنية أو جواز السفر، وإثبات عنوان.',
        aEn: 'We require simple documents to complete KYC procedures: a copy of National ID or Passport, and proof of address.',
      }
    ]
  },
  {
    category: 'portfolio',
    categoryAr: 'المحفظة والاستثمار',
    categoryEn: 'Portfolio & Investment',
    emoji: '💼',
    questions: [
      {
        qAr: 'ما هو الحد الأدنى للاستثمار؟',
        qEn: 'What is the minimum investment?',
        aAr: 'الحد الأدنى يختلف حسب نوع المحفظة، يبدأ من 10,000 دولار للمحافظ الأساسية.',
        aEn: 'The minimum varies by portfolio type, starting at $10,000 for basic portfolios.',
      }
    ]
  }
];

const categories = [
  { id: 'all', ar: 'الكل', en: 'All', icon: '📋' },
  { id: 'start', ar: 'البداية والتسجيل', en: 'Getting Started', icon: '🚀' },
  { id: 'portfolio', ar: 'المحفظة والاستثمار', en: 'Portfolio & Investment', icon: '💼' },
  { id: 'fees', ar: 'الرسوم والتكاليف', en: 'Fees & Costs', icon: '💰' },
  { id: 'risk', ar: 'إدارة المخاطر', en: 'Risk Management', icon: '🛡️' },
];

function FAQPage() {
  const { t, lang } = useLang();
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [openQ, setOpenQ] = useState<string | null>(null);

  const toggleQ = (q: string) => setOpenQ(openQ === q ? null : q);

  const filteredFaqs = faqs.filter(cat => activeCategory === 'all' || cat.category === activeCategory).map(cat => ({
    ...cat,
    questions: cat.questions.filter(q => 
      q.qAr.includes(search) || q.qEn.toLowerCase().includes(search.toLowerCase()) ||
      q.aAr.includes(search) || q.aEn.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative w-full bg-primary dark:bg-elevated pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-primary),var(--color-secondary))] dark:bg-[linear-gradient(to_bottom,#0D0D1A,#13132A)] opacity-80" />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(var(--color-border-gold) 1px, transparent 1px), linear-gradient(90deg, var(--color-border-gold) 1px, transparent 1px)', backgroundSize: '60px 60px', opacity: 0.06 }} />
        
        <div className="max-w-[1280px] mx-auto px-4 relative z-10 text-center flex flex-col items-center">
          <span className="font-black text-[11px] text-gold-deep tracking-[0.2em] uppercase mb-4 block">
            {t('مركز المساعدة', 'HELP CENTER')}
          </span>
          <h1 className="font-black text-4xl md:text-5xl text-text-primary mb-6">
            {t('كيف يمكننا مساعدتك اليوم؟', 'How Can We Help You Today?')}
          </h1>
          <p className="text-lg text-text-secondary max-w-[580px] mb-12">
            {t('وجدنا أن معظم المستثمرين لديهم نفس الأسئلة قبل اتخاذ قرار الاستثمار. جمعنا هنا إجابات واضحة وشفافة لكل ما قد يدور في ذهنك', 'We found that most investors have the same questions before making an investment decision. We have gathered here clear and transparent answers.')}
          </p>

          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="font-mono font-black text-3xl text-gold-deep">48+</div>
              <div className="text-xs text-text-muted mt-1">{t('سؤال وجواب شامل', 'Comprehensive Q&A')}</div>
            </div>
            <div className="text-center">
              <div className="font-mono font-black text-3xl text-gold-deep">6</div>
              <div className="text-xs text-text-muted mt-1">{t('تصنيفات رئيسية', 'Main Categories')}</div>
            </div>
            <div className="text-center">
              <div className="font-mono font-black text-3xl text-gold-deep">24/7</div>
              <div className="text-xs text-text-muted mt-1">{t('دعم مباشر', 'Direct Support')}</div>
            </div>
          </div>

          <div className="bg-gold-subtle border border-border-gold rounded-xl p-6 w-full max-w-[600px] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-semibold text-text-primary">
              <Zap className="w-5 h-5 text-gold-primary" /> {t('تحتاج إجابة فورية؟', 'Need an Immediate Answer?')}
            </div>
            <Link to="/contact">
              <Button size="sm" className="shadow-gold-sm">{t('تحدث مع مستشار الآن', 'Talk to an Advisor Now')}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Search Box */}
      <section className="bg-primary py-8 border-b border-border-light relative z-20">
        <div className="max-w-[680px] mx-auto px-4">
          <div className="relative">
            <div className="flex items-center bg-primary border-2 border-border-default rounded-xl p-2 px-4 shadow-sm focus-within:border-gold-primary focus-within:shadow-[0_0_0_4px_var(--color-gold-subtle)] transition-all">
              <Search className="w-5 h-5 text-gold-primary shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('ابحث عن سؤالك هنا... مثلاً: ما الحد الأدنى للاستثمار؟', 'Search for your question here... e.g., minimum investment?')}
                className="flex-1 bg-transparent border-none outline-none px-4 text-text-primary placeholder-text-muted"
              />
              {search && <Button size="sm" className="h-8 px-4 rounded-lg">{t('بحث', 'Search')}</Button>}
            </div>
          </div>

          {!search && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-xs text-text-muted mr-1">{t('الأكثر بحثاً:', 'Most Searched:')}</span>
              {['الحد الأدنى للاستثمار', 'رسوم الإدارة', 'كيف أسحب أموالي؟'].map((term, i) => (
                <button key={i} onClick={() => setSearch(term)} className="bg-secondary border border-border-default rounded-full px-3 py-1 text-xs text-text-secondary hover:bg-gold-subtle hover:border-border-gold hover:text-gold-deep transition-colors">
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-primary py-4 border-b border-border-light sticky top-20 z-30 shadow-sm overflow-x-auto">
        <div className="max-w-[1280px] mx-auto px-4 flex items-center gap-2 min-w-max">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "rounded-full px-4 py-2 flex items-center gap-2 transition-all whitespace-nowrap",
                activeCategory === cat.id 
                  ? "gradient-gold shadow-gold-sm text-white border-none" 
                  : "bg-secondary border border-border-default text-text-secondary hover:bg-tertiary"
              )}
            >
              <span>{cat.icon}</span>
              <span className="font-semibold text-[13px]">{lang === 'ar' ? cat.ar : cat.en}</span>
            </button>
          ))}
        </div>
      </section>

      {/* FAQ Accordion & Sidebar */}
      <section className="bg-primary py-10">
        <div className="max-w-[1280px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          
          <div className="space-y-8">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
                <p className="text-text-secondary">{t('لم نجد سؤالاً مطابقاً — جرب كلمات مختلفة', 'No matching question found — try different words')}</p>
              </div>
            ) : (
              filteredFaqs.map((cat, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center justify-between bg-gold-subtle border border-border-gold rounded-lg px-5 py-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span>{cat.emoji}</span>
                      <h2 className="font-black text-sm text-gold-deep">{lang === 'ar' ? cat.categoryAr : cat.categoryEn}</h2>
                    </div>
                    <div className="font-mono text-xs text-text-muted">{cat.questions.length} {t('أسئلة', 'Questions')}</div>
                  </div>
                  
                  {cat.questions.map((q, j) => {
                    const isOpen = openQ === q.qAr;
                    return (
                      <div key={j} className={cn(
                        "bg-primary dark:bg-elevated border rounded-xl overflow-hidden transition-all duration-200",
                        isOpen ? "border-gold-primary" : "border-border-light hover:border-border-gold"
                      )}>
                        <button 
                          onClick={() => toggleQ(q.qAr)} 
                          className={cn("w-full flex items-center justify-between p-5 text-start", isOpen && "bg-gold-subtle")}
                        >
                          <div className="flex items-center gap-3">
                            <TrendingUp className="w-4 h-4 text-gold-primary shrink-0" />
                            <span className="font-bold text-base text-text-primary">{lang === 'ar' ? q.qAr : q.qEn}</span>
                          </div>
                          <ChevronDown className={cn("w-5 h-5 text-text-muted transition-transform duration-300", isOpen && "rotate-180")} />
                        </button>
                        <div className={cn("overflow-hidden transition-all duration-300 ease-out", isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
                          <div className="p-6 pt-0 border-t border-border-light mt-4 mx-6 text-[15px] text-text-secondary leading-relaxed">
                            {lang === 'ar' ? q.aAr : q.aEn}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <div className="space-y-6">
            <Card variant="featured" className="p-6 text-center flex flex-col items-center">
              <HeadphonesIcon className="w-10 h-10 text-gold-primary mb-4" />
              <h3 className="font-bold text-lg text-text-primary mb-2">{t('لم تجد ما تبحث عنه؟', "Didn't find what you're looking for?")}</h3>
              <p className="text-sm text-text-secondary mb-6">{t('فريقنا متاح 24/7 للإجابة على جميع استفساراتك.', 'Our team is available 24/7 to answer all your queries.')}</p>
              <Link to="/contact" className="w-full">
                <Button className="w-full">{t('تواصل معنا', 'Contact Us')}</Button>
              </Link>
            </Card>
          </div>

        </div>
      </section>

    </div>
  );
}
