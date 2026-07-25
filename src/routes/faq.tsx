import { createFileRoute, Link } from '@tanstack/react-router';
import { useLang } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { Search, TrendingUp, ChevronDown, HeadphonesIcon, Zap } from 'lucide-react';
import { usePublicFaqItems } from '@/lib/publicContent';

export const Route = createFileRoute('/faq')({ component: FAQPage });

function emojiForCategory(category: string) {
  if (/بداية|تسجيل/i.test(category)) return '🚀';
  if (/محفظة|استثمار/i.test(category)) return '💼';
  if (/رسوم|تكاليف/i.test(category)) return '💰';
  if (/مخاطر|حماية/i.test(category)) return '🛡️';
  if (/دعم|تواصل/i.test(category)) return '🎧';
  return '❓';
}

function iconForCategory(category: string) {
  if (/بداية|تسجيل/i.test(category)) return '🚀';
  if (/محفظة|استثمار/i.test(category)) return '💼';
  if (/رسوم|تكاليف/i.test(category)) return '💰';
  if (/مخاطر|حماية/i.test(category)) return '🛡️';
  return '📋';
}

function FAQPage() {
  const { t, lang } = useLang();
  const { items } = usePublicFaqItems();
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [openQ, setOpenQ] = useState<string | null>(null);

  const groupedFaqs = useMemo(() => {
    const map = new Map<string, { category: string; questions: typeof items }>();
    for (const item of items) {
      const key = item.category || 'عام';
      if (!map.has(key)) map.set(key, { category: key, questions: [] as typeof items });
      map.get(key)!.questions.push(item);
    }
    return Array.from(map.values());
  }, [items]);

  const categories = useMemo(() => [
    { id: 'all', label: t('الكل', 'All'), icon: '📋' },
    ...groupedFaqs.map((group) => ({ id: group.category, label: group.category, icon: iconForCategory(group.category) })),
  ], [groupedFaqs, t]);

  const filteredFaqs = useMemo(() => groupedFaqs
    .filter((cat) => activeCategory === 'all' || cat.category === activeCategory)
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter((q) =>
        q.question.includes(search) ||
        q.questionEn.toLowerCase().includes(search.toLowerCase()) ||
        q.answer.includes(search) ||
        q.answerEn.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.questions.length > 0), [activeCategory, groupedFaqs, search]);

  const totalQuestions = items.length;
  const toggleQ = (q: string) => setOpenQ(openQ === q ? null : q);

  return (
    <div className="w-full">
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
            {t('جمعنا هنا إجابات واضحة وشفافة للأسئلة التي يطرحها المستثمرون قبل وأثناء استخدام المنصة.', 'We gathered clear and transparent answers to the questions investors ask before and during their use of the platform.')}
          </p>

          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="font-mono font-black text-3xl text-gold-deep">{totalQuestions || '—'}</div>
              <div className="text-xs text-text-muted mt-1">{t('سؤال وجواب شامل', 'Comprehensive Q&A')}</div>
            </div>
            <div className="text-center">
              <div className="font-mono font-black text-3xl text-gold-deep">{Math.max(groupedFaqs.length, 1)}</div>
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

      <section className="bg-primary py-8 border-b border-border-light relative z-20">
        <div className="max-w-[680px] mx-auto px-4">
          <div className="relative">
            <div className="flex items-center bg-primary border-2 border-border-default rounded-xl p-2 px-4 shadow-sm focus-within:border-gold-primary focus-within:shadow-[0_0_0_4px_var(--color-gold-subtle)] transition-all">
              <Search className="w-5 h-5 text-gold-primary shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('ابحث عن سؤالك هنا...', 'Search for your question here...')}
                className="flex-1 bg-transparent border-none outline-none px-4 text-text-primary placeholder-text-muted"
              />
              {search && <Button size="sm" className="h-8 px-4 rounded-lg">{t('بحث', 'Search')}</Button>}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary py-4 border-b border-border-light sticky top-20 z-30 shadow-sm overflow-x-auto">
        <div className="max-w-[1280px] mx-auto px-4 flex items-center gap-2 min-w-max">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'rounded-full px-4 py-2 flex items-center gap-2 transition-all whitespace-nowrap',
                activeCategory === cat.id
                  ? 'gradient-gold shadow-gold-sm text-white border-none'
                  : 'bg-secondary border border-border-default text-text-secondary hover:bg-tertiary'
              )}
            >
              <span>{cat.icon}</span>
              <span className="font-semibold text-[13px]">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-primary py-10">
        <div className="max-w-[1280px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-8">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
                <p className="text-text-secondary">{search ? t('لم نجد سؤالاً مطابقاً — جرب كلمات مختلفة', 'No matching question found — try different words') : t('لا توجد أسئلة منشورة حالياً', 'No FAQs are published yet')}</p>
              </div>
            ) : (
              filteredFaqs.map((cat, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center justify-between bg-gold-subtle border border-border-gold rounded-lg px-5 py-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span>{emojiForCategory(cat.category)}</span>
                      <h2 className="font-black text-sm text-gold-deep">{cat.category}</h2>
                    </div>
                    <div className="font-mono text-xs text-text-muted">{cat.questions.length} {t('أسئلة', 'Questions')}</div>
                  </div>

                  {cat.questions.map((q, j) => {
                    const key = q.id || q.question;
                    const isOpen = openQ === key;
                    return (
                      <div key={j} className={cn('bg-primary dark:bg-elevated border rounded-xl overflow-hidden transition-all duration-200', isOpen ? 'border-gold-primary' : 'border-border-light hover:border-border-gold')}>
                        <button onClick={() => toggleQ(key)} className={cn('w-full flex items-center justify-between p-5 text-start', isOpen && 'bg-gold-subtle')}>
                          <div className="flex items-center gap-3">
                            <TrendingUp className="w-4 h-4 text-gold-primary shrink-0" />
                            <span className="font-bold text-base text-text-primary">{lang === 'ar' ? q.question : q.questionEn}</span>
                          </div>
                          <ChevronDown className={cn('w-5 h-5 text-text-muted transition-transform duration-300', isOpen && 'rotate-180')} />
                        </button>
                        <div className={cn('overflow-hidden transition-all duration-300 ease-out', isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0')}>
                          <div className="p-6 pt-0 border-t border-border-light mt-4 mx-6 text-[15px] text-text-secondary leading-relaxed">
                            {lang === 'ar' ? q.answer : q.answerEn}
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
