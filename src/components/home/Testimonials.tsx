import React, { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/Card';
import { Star, ChevronRight, ChevronLeft, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Testimonials() {
  const { t, lang } = useLang();
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials = [
    {
      nameAr: 'أحمد الغامدي',
      nameEn: 'Ahmed Al-Ghamdi',
      roleAr: 'رجل أعمال',
      roleEn: 'Businessman',
      textAr: 'تعاملي مع ثروة كابيتال كان نقطة تحول في محفظتي الاستثمارية. شفافية تامة، دعم متواصل، وتحليلات دقيقة ساعدتني على اتخاذ قرارات ناجحة.',
      textEn: 'My experience with Tharwah Capital was a turning point for my investment portfolio. Complete transparency, continuous support, and accurate analysis.',
      rating: 5,
      avatar: 'أ'
    },
    {
      nameAr: 'سارة خالد',
      nameEn: 'Sara Khalid',
      roleAr: 'مستثمرة مستقلة',
      roleEn: 'Independent Investor',
      textAr: 'كمبتدئة في الأسواق المالية، وجدت في فريق ثروة كابيتال الموجه والمرشد. منصتهم سهلة الاستخدام واستشاراتهم دائماً في الصميم.',
      textEn: 'As a beginner in financial markets, I found a guide and mentor in Tharwah Capital team. Their platform is easy to use and their consultations are always spot on.',
      rating: 5,
      avatar: 'س'
    },
    {
      nameAr: 'فهد العتيبي',
      nameEn: 'Fahad Al-Otaibi',
      roleAr: 'مدير مالي',
      roleEn: 'Financial Manager',
      textAr: 'التنوع في الأسواق المتاحة لديهم استثنائي. استطعت تنويع استثماراتي بين الأسهم الخليجية والعالمية وصناديق المؤشرات بكل سهولة.',
      textEn: 'The diversity of available markets is exceptional. I was able to diversify my investments between Gulf and global equities and ETFs with ease.',
      rating: 5,
      avatar: 'ف'
    }
  ];

  const next = () => setActiveIndex((prev) => (prev + 1) % testimonials.length);
  const prev = () => setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="py-24 bg-secondary dark:bg-[#13132A] relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        
        <div className="text-center mb-16">
          <span className="font-black text-[11px] text-gold-deep tracking-[0.2em] uppercase mb-4 block">
            {t('آراء العملاء', 'TESTIMONIALS')}
          </span>
          <h2 className="font-black text-3xl md:text-4xl text-text-primary mb-6">
            {t('قصص نجاح يشاركنا بها عملاؤنا', 'Success Stories Shared by Our Clients')}
          </h2>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <Quote className="absolute -top-10 -right-10 w-24 h-24 text-gold-subtle opacity-50 z-0 rtl:scale-x-[-1]" />
          
          <div className="relative z-10 overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-out" 
              style={{ transform: `translateX(${lang === 'ar' ? activeIndex * 100 : -(activeIndex * 100)}%)` }}
            >
              {testimonials.map((test, i) => (
                <div key={i} className="w-full shrink-0 px-4">
                  <Card className="bg-primary p-8 md:p-12 text-center border-border-gold/30">
                    <div className="flex justify-center mb-6">
                      {[...Array(test.rating)].map((_, j) => <Star key={j} className="w-5 h-5 text-gold-primary fill-current" />)}
                    </div>
                    <p className="text-lg md:text-xl text-text-primary font-medium leading-relaxed mb-8 italic">
                      "{lang === 'ar' ? test.textAr : test.textEn}"
                    </p>
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center text-white font-bold text-lg mb-3 shadow-gold-sm">
                        {test.avatar}
                      </div>
                      <div className="font-bold text-text-primary">{lang === 'ar' ? test.nameAr : test.nameEn}</div>
                      <div className="text-sm text-text-muted">{lang === 'ar' ? test.roleAr : test.roleEn}</div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center items-center gap-4 mt-8">
            <button onClick={lang === 'ar' ? prev : next} className="w-12 h-12 rounded-full bg-primary border border-border-default flex items-center justify-center hover:bg-gold-subtle hover:text-gold-deep transition-colors">
              <ChevronRight className="w-6 h-6 rtl:rotate-180" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveIndex(i)}
                  className={cn("h-2.5 rounded-full transition-all duration-300", i === activeIndex ? "w-8 bg-gold-primary" : "w-2.5 bg-border-medium")}
                />
              ))}
            </div>
            <button onClick={lang === 'ar' ? next : prev} className="w-12 h-12 rounded-full bg-primary border border-border-default flex items-center justify-center hover:bg-gold-subtle hover:text-gold-deep transition-colors">
              <ChevronLeft className="w-6 h-6 rtl:rotate-180" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}
