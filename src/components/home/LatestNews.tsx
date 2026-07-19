import React from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Link } from '@tanstack/react-router';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LatestNews() {
  const { t, lang } = useLang();

  const news = [
    {
      id: 'bitcoin-records',
      categoryAr: 'العملات الرقمية',
      categoryEn: 'Crypto',
      titleAr: 'بيتكوين يسجل مستويات قياسية جديدة — ماذا يعني للمستثمر العربي؟',
      titleEn: 'Bitcoin Hits New Records — What Does It Mean for Arab Investors?',
      descAr: 'بعد ارتفاع نسبته 45% خلال الربع الأول من 2025، سجّل Bitcoin مستويات قياسية جديدة تجاوزت $70,000. نحلل الأسباب وما إذا كانت فرصة الدخول لا تزال قائمة',
      descEn: 'After a 45% surge in Q1 2025, Bitcoin recorded new highs exceeding $70,000. We analyze the reasons and whether the entry opportunity still exists',
      date: '18 Jul 2026',
      readTime: '5 min',
      isFeatured: true,
      emoji: '📰',
      authorAr: 'م. فيصل العمري',
      authorEn: 'Faisal Al-Omari'
    },
    {
      id: 'gulf-markets-q2',
      categoryAr: 'الأسهم الخليجية',
      categoryEn: 'Gulf Stocks',
      titleAr: 'تحليل أداء أسواق الخليج في الربع الثاني — الفرص والمخاطر',
      titleEn: 'Gulf Markets Q2 Performance Analysis — Opportunities and Risks',
      descAr: 'يستعرض تقريرنا أداء أسواق الخليج في الربع الثاني مع التركيز على القطاعات الأكثر نمواً وتلك التي تُقدم فرصاً استثمارية واعدة في المرحلة القادمة',
      descEn: 'Our report reviews Gulf market performance in Q2, focusing on the fastest-growing sectors and those offering promising investment opportunities in the coming period',
      date: '15 Jul 2026',
      readTime: '8 min',
      isFeatured: false,
      emoji: '📄',
      authorAr: 'د. سارة المطيري',
      authorEn: 'Dr. Sara Al-Mutairi'
    },
    {
      id: 'gold-inflation',
      categoryAr: 'المعادن',
      categoryEn: 'Metals',
      titleAr: 'الذهب كسلاح ضد التضخم — هل حان وقت التراجع؟',
      titleEn: 'Gold as an Inflation Hedge — Is a Pullback Due?',
      descAr: 'مع تراجع مؤشرات التضخم تدريجياً في الاقتصادات الكبرى، نحلل ما إذا كان الذهب لا يزال الملاذ الأمثل وما هو التوزيع المثالي في المحفظة',
      descEn: 'As inflation indicators gradually decline in major economies, we analyze whether gold remains the optimal safe haven and what the ideal portfolio allocation should be',
      date: '10 Jul 2026',
      readTime: '6 min',
      isFeatured: false,
      emoji: '📊',
      authorAr: 'م. خالد الحربي',
      authorEn: 'Khalid Al-Harbi'
    }
  ];

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
            <ArrowLeft className={cn("w-4 h-4 transition-transform", lang === 'ar' ? "group-hover:-translate-x-1" : "rotate-180 group-hover:translate-x-1")} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item, i) => (
            <Link to={`/article/$slug`} params={{ slug: item.id }} key={item.id} className="group outline-none">
              <Card variant="interactive" className="p-0 overflow-hidden h-full flex flex-col hover:-translate-y-2 transition-all duration-300">
                <div className="w-full h-[200px] bg-gradient-to-b from-gold-subtle to-secondary flex items-center justify-center relative shrink-0">
                  {item.isFeatured && (
                    <div className="absolute top-4 rtl:right-4 ltr:left-4 bg-gradient-to-r from-gold-primary to-gold-deep text-white text-[11px] font-bold px-3 py-1 rounded-sm shadow-sm">
                      {t('⭐ مميز', '⭐ Featured')}
                    </div>
                  )}
                  <span className="text-6xl">{item.emoji}</span>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-gold-subtle border border-border-gold rounded-sm px-2 py-1 text-[11px] font-bold text-gold-deep uppercase">
                      {t(item.categoryAr, item.categoryEn)}
                    </div>
                    <div className="flex items-center gap-1 text-[12px] text-text-muted">
                      <Calendar className="w-3 h-3" /> {item.date}
                    </div>
                    <div className="flex items-center gap-1 text-[12px] text-text-muted">
                      <Clock className="w-3 h-3" /> {item.readTime}
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-lg text-text-primary mb-3 group-hover:text-gold-deep transition-colors line-clamp-2">
                    {t(item.titleAr, item.titleEn)}
                  </h3>
                  
                  <p className="text-sm text-text-secondary leading-relaxed line-clamp-2 mb-6 flex-1">
                    {t(item.descAr, item.descEn)}
                  </p>

                  <div className="flex items-center justify-between border-t border-border-light pt-4 mt-auto">
                    <div className="font-bold text-[13px] text-gold-deep flex items-center gap-2">
                      {t('اقرأ المقال كاملاً', 'Read Full Article')} <ArrowLeft className={cn("w-3.5 h-3.5 transition-transform", lang === 'ar' ? "group-hover:-translate-x-1" : "rotate-180 group-hover:translate-x-1")} />
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-text-secondary">
                      <div className="w-6 h-6 rounded-full bg-gold-subtle flex items-center justify-center text-xs font-bold text-gold-deep">
                        {t(item.authorAr, item.authorEn).charAt(lang==='ar'?3:0)}
                      </div>
                      <span>{t(item.authorAr, item.authorEn)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
