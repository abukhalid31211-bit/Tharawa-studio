import React from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { CheckCircle2, ShieldCheck, PieChart, HeadphonesIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function WhyChooseUs() {
  const { t, lang } = useLang();

  const reasons = [
    {
      icon: ShieldCheck,
      titleAr: 'أمان وموثوقية',
      titleEn: 'Security & Reliability',
      descAr: 'تخضع جميع عملياتنا لمعايير تنظيمية صارمة مع حماية كاملة للبيانات والأموال.',
      descEn: 'All our operations are subject to strict regulatory standards with full data and funds protection.'
    },
    {
      icon: PieChart,
      titleAr: 'تنوع استثماري',
      titleEn: 'Investment Diversity',
      descAr: 'استراتيجيات استثمارية مرنة تتيح لك توزيع مخاطرك على قطاعات متعددة.',
      descEn: 'Flexible investment strategies allowing you to distribute risks across multiple sectors.'
    },
    {
      icon: HeadphonesIcon,
      titleAr: 'دعم على مدار الساعة',
      titleEn: '24/7 Support',
      descAr: 'فريق دعم فني ومستشارون ماليون متاحون للإجابة على استفساراتك في أي وقت.',
      descEn: 'Technical support team and financial advisors available to answer your queries anytime.'
    }
  ];

  return (
    <section className="py-24 bg-primary dark:bg-elevated relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="font-black text-[11px] text-gold-deep tracking-[0.2em] uppercase mb-4 block">
              {t('لماذا ثروة كابيتال', 'WHY THARWAH CAPITAL')}
            </span>
            <h2 className="font-black text-3xl md:text-4xl text-text-primary mb-6 leading-tight">
              {t('شريكك الاستراتيجي في بناء ثروتك', 'Your Strategic Partner in Building Wealth')}
            </h2>
            <p className="text-lg text-text-secondary mb-10 leading-relaxed">
              {t('نحن لا نقدم مجرد منصة تداول، بل نقدم شراكة مالية متكاملة. نضع خبراتنا ومواردنا بين يديك لنضمن أن خطواتك الاستثمارية مبنية على أسس صلبة.', 'We don’t just offer a trading platform; we offer a comprehensive financial partnership. We put our expertise and resources at your fingertips to ensure your investment steps are built on solid foundations.')}
            </p>

            <div className="space-y-6">
              {reasons.map((r, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gold-subtle flex items-center justify-center shrink-0">
                    <r.icon className="w-6 h-6 text-gold-deep" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-text-primary mb-1">{lang === 'ar' ? r.titleAr : r.titleEn}</h3>
                    <p className="text-sm text-text-secondary">{lang === 'ar' ? r.descAr : r.descEn}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-gold-primary/20 to-transparent rounded-2xl transform rotate-3" />
            <Card className="relative bg-primary/90 dark:bg-elevated/90 backdrop-blur-md shadow-2xl p-8 rounded-2xl border border-border-gold transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="flex flex-col gap-6">
                <div className="pb-6 border-b border-border-light">
                  <div className="font-bold text-2xl text-text-primary mb-2">98.5%</div>
                  <div className="text-sm text-text-secondary">{t('معدل رضا العملاء السنوي', 'Annual Client Satisfaction Rate')}</div>
                </div>
                <div className="pb-6 border-b border-border-light">
                  <div className="font-bold text-2xl text-text-primary mb-2">+150</div>
                  <div className="text-sm text-text-secondary">{t('خبير ومستشار مالي معتمد', 'Certified Financial Experts & Advisors')}</div>
                </div>
                <div>
                  <div className="font-bold text-2xl text-text-primary mb-2">$2B+</div>
                  <div className="text-sm text-text-secondary">{t('حجم الأصول تحت الإدارة', 'Assets Under Management')}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

      </div>
    </section>
  );
}
