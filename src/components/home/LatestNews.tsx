import React from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Link } from '@tanstack/react-router';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePublicNewsArticles } from '@/lib/publicContent';

export function LatestNews() {
  const { t, lang } = useLang();
  const { articles } = usePublicNewsArticles();
  const news = articles.slice(0, 3);

  return (
    <section className="py-24 bg-secondary dark:bg-[#13132A] relative">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="font-black text-[11px] text-gold-deep tracking-[0.2em] uppercase mb-4 block">
              {t('المعرفة قوة', 'KNOWLEDGE IS POWER')}
            </span>
            <h2 className="font-black text-3xl md:text-4xl text-text-primary">
              {t('أحدث التحليلات والأخبار المالية', 'Latest Financial Analysis & News')}
            </h2>
          </div>
          <Link to="/news" className="inline-flex items-center gap-2 font-bold text-sm text-gold-deep hover:text-gold-dark group transition-colors">
            {t('كل المقالات والتحليلات', 'All Articles & Analysis')}
            <ArrowLeft className={cn('w-4 h-4 transition-transform', lang === 'ar' ? 'group-hover:-translate-x-1' : 'rotate-180 group-hover:translate-x-1')} />
          </Link>
        </div>

        {news.length === 0 ? (
          <Card className="p-8 text-center text-text-muted">
            {t('لا توجد مقالات منشورة حالياً', 'No published articles are available right now')}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item) => (
              <Link to="/article/$slug" params={{ slug: item.slug }} key={item.id} className="group outline-none">
                <Card variant="interactive" className="p-0 overflow-hidden h-full flex flex-col hover:-translate-y-2 transition-all duration-300">
                  <div className="w-full h-[200px] bg-gradient-to-b from-gold-subtle to-secondary flex items-center justify-center relative shrink-0">
                    {item.featured && (
                      <div className="absolute top-4 rtl:right-4 ltr:left-4 bg-gradient-to-r from-gold-primary to-gold-deep text-white text-[11px] font-bold px-3 py-1 rounded-sm shadow-sm">
                        {t('⭐ مميز', '⭐ Featured')}
                      </div>
                    )}
                    <span className="text-6xl">{item.emoji}</span>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gold-subtle border border-border-gold rounded-sm px-2 py-1 text-[11px] font-bold text-gold-deep uppercase">
                        {lang === 'ar' ? item.categoryAr : item.categoryEn}
                      </div>
                      <div className="flex items-center gap-1 text-[12px] text-text-muted">
                        <Calendar className="w-3 h-3" /> {lang === 'ar' ? item.date : item.dateEn}
                      </div>
                      <div className="flex items-center gap-1 text-[12px] text-text-muted">
                        <Clock className="w-3 h-3" /> {lang === 'ar' ? item.readTime : item.readTimeEn}
                      </div>
                    </div>

                    <h3 className="font-bold text-lg text-text-primary mb-3 group-hover:text-gold-deep transition-colors line-clamp-2">
                      {lang === 'ar' ? item.title : item.titleEn}
                    </h3>

                    <p className="text-sm text-text-secondary leading-relaxed line-clamp-2 mb-6 flex-1">
                      {lang === 'ar' ? item.excerpt : item.excerptEn}
                    </p>

                    <div className="flex items-center justify-between border-t border-border-light pt-4 mt-auto">
                      <div className="font-bold text-[13px] text-gold-deep flex items-center gap-2">
                        {t('اقرأ المقال كاملاً', 'Read Full Article')} <ArrowLeft className={cn('w-3.5 h-3.5 transition-transform', lang === 'ar' ? 'group-hover:-translate-x-1' : 'rotate-180 group-hover:translate-x-1')} />
                      </div>
                      <div className="flex items-center gap-2 text-[13px] text-text-secondary">
                        <div className="w-6 h-6 rounded-full bg-gold-subtle flex items-center justify-center text-xs font-bold text-gold-deep">
                          {(lang === 'ar' ? item.author : item.authorEn).charAt(0)}
                        </div>
                        <span>{lang === 'ar' ? item.author : item.authorEn}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
