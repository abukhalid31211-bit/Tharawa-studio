import React from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { UserPlus, Wallet, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function HowItWorks() {
  const { t, lang } = useLang();

  const steps = [
    {
      num: '01',
      icon: UserPlus,
      titleAr: 'حجز استشارة',
      titleEn: 'Book Consultation',
      descAr: 'تحدث مع مستشارك المالي لفهم أهدافك وتحديد مستوى المخاطر المناسب لك.',
      descEn: 'Talk to your financial advisor to understand your goals and risk tolerance.',
    },
    {
      num: '02',
      icon: Wallet,
      titleAr: 'بناء المحفظة',
      titleEn: 'Build Portfolio',
      descAr: 'نقوم بتصميم محفظة استثمارية متنوعة مخصصة بالكامل لاحتياجاتك.',
      descEn: 'We design a fully customized and diversified investment portfolio for your needs.',
    },
    {
      num: '03',
      icon: TrendingUp,
      titleAr: 'إدارة وتنمية',
      titleEn: 'Manage & Grow',
      descAr: 'نراقب أداء محفظتك على مدار الساعة ونجري التعديلات اللازمة لاقتناص الفرص.',
      descEn: 'We monitor your portfolio around the clock and adjust to seize opportunities.',
    }
  ];

  return (
    <section className="py-24 bg-primary dark:bg-elevated relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        
        <div className="text-center mb-16">
          <span className="font-black text-[11px] text-gold-deep tracking-[0.2em] uppercase mb-4 block">
            {t('آلية العمل', 'HOW IT WORKS')}
          </span>
          <h2 className="font-black text-3xl md:text-4xl text-text-primary mb-6">
            {t('رحلتك الاستثمارية في ثلاث خطوات', 'Your Investment Journey in 3 Steps')}
          </h2>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-12 left-16 right-16 h-[1px] border-t-2 border-dashed border-border-gold/50 z-0" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-secondary dark:bg-[#13132A] border-4 border-primary dark:border-elevated shadow-gold-sm flex items-center justify-center mb-6 relative group-hover:scale-105 transition-transform duration-300">
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full gradient-gold flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {step.num}
                  </div>
                  <step.icon className="w-10 h-10 text-gold-deep" />
                </div>
                <h3 className="font-bold text-xl text-text-primary mb-3">{lang === 'ar' ? step.titleAr : step.titleEn}</h3>
                <p className="text-text-secondary text-sm leading-relaxed max-w-[280px]">{lang === 'ar' ? step.descAr : step.descEn}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
