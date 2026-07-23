import React, { useEffect, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, BarChart3, ShieldCheck, Sparkles, TrendingUp, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCmsSection } from '@/lib/cms';

interface HeroStats {
  value: string;
  label: string;
  labelEn: string;
}

interface HeroContent {
  badge?: string;
  badgeEn?: string;
  title?: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  ctaPrimary?: string;
  ctaPrimaryEn?: string;
  ctaSecondary?: string;
  ctaSecondaryEn?: string;
  stats?: HeroStats[];
}

const FALLBACK_HERO: HeroContent = {
  badge: 'شركة استثمارية مرخصة رسمياً • منذ عام 2010',
  badgeEn: 'Officially Licensed Investment Firm • Since 2010',
  title: 'نمِّ ثروتك بأمان وذكاء متوافق مع الشريعة',
  titleEn: 'Grow Your Wealth Securely with Sharia-Compliant Intelligence',
  subtitle: 'نحو مستقبل مالي أكثر ثباتاً وازدهاراً',
  subtitleEn: 'Toward a More Stable and Prosperous Financial Future',
  ctaPrimary: 'تواصل مع مستشار مالي',
  ctaPrimaryEn: 'Talk to a Financial Advisor',
  ctaSecondary: 'استكشف خدماتنا',
  ctaSecondaryEn: 'Explore Our Services',
  stats: [
    { value: '+2.1B', label: 'ريال أصول مدارة', labelEn: 'SAR Assets Managed' },
    { value: '+5,240', label: 'عميل نشط', labelEn: 'Active Clients' },
    { value: '98%', label: 'رضا العملاء', labelEn: 'Client Satisfaction' },
    { value: '+18%', label: 'متوسط العائد السنوي', labelEn: 'Avg. Annual Return' },
  ],
};

export function Hero() {
  const { t, lang } = useLang();
  const { data: cms } = useCmsSection<HeroContent>('hero', FALLBACK_HERO);
  const [typedText, setTypedText] = useState('');
  const fullText = t('استثماراتك', 'Your Investments');

  useEffect(() => {
    let currentText = '';
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        currentText += fullText.charAt(index);
        setTypedText(currentText);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [fullText]);

  const titleAr = cms.title || FALLBACK_HERO.title!;
  const titleEn = cms.titleEn || FALLBACK_HERO.titleEn!;
  const subtitleAr = cms.subtitle || FALLBACK_HERO.subtitle!;
  const subtitleEn = cms.subtitleEn || FALLBACK_HERO.subtitleEn!;
  const badgeAr = cms.badge || FALLBACK_HERO.badge!;
  const badgeEn = cms.badgeEn || FALLBACK_HERO.badgeEn!;
  const ctaPrimary = lang === 'ar' ? (cms.ctaPrimary || FALLBACK_HERO.ctaPrimary!) : (cms.ctaPrimaryEn || FALLBACK_HERO.ctaPrimaryEn!);
  const ctaSecondary = lang === 'ar' ? (cms.ctaSecondary || FALLBACK_HERO.ctaSecondary!) : (cms.ctaSecondaryEn || FALLBACK_HERO.ctaSecondaryEn!);
  const stats = cms.stats || FALLBACK_HERO.stats!;

  return (
    <section className="relative w-full min-h-[90vh] flex items-center overflow-hidden bg-primary dark:bg-elevated">
      <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_bottom,var(--color-primary),var(--color-secondary))] dark:bg-[linear-gradient(to_bottom,#0D0D1A,#13132A)] opacity-80" />
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(var(--color-border-gold) 1px, transparent 1px), linear-gradient(90deg, var(--color-border-gold) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        opacity: 0.06
      }} />
      <div className="absolute top-0 left-0 w-96 h-96 bg-gold-primary/15 blur-[80px] rounded-full animate-pulse-slow" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-gold-deep/10 blur-[60px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-32 relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
        <div className="flex flex-col items-start gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 bg-gold-subtle border border-border-gold rounded-full py-2 px-4">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="font-semibold text-[13px] text-gold-deep">
              {lang === 'ar' ? badgeAr : badgeEn}
            </span>
          </div>

          <h1 className="flex flex-col gap-2">
            <span className="font-black text-4xl md:text-5xl lg:text-6xl gradient-gold bg-clip-text text-transparent">
              {typedText}
              <span className="text-gold-primary animate-pulse ml-1">|</span>
            </span>
            <span className="font-black text-4xl md:text-5xl lg:text-6xl text-text-primary">
              {lang === 'ar' ? titleAr : titleEn}
            </span>
            <span className="font-bold text-xl md:text-2xl lg:text-3xl text-text-secondary mt-2">
              {lang === 'ar' ? subtitleAr : subtitleEn}
            </span>
          </h1>

          <p className="text-lg text-text-secondary leading-relaxed max-w-[540px]">
            {t(
              'نُدير استثماراتك في أسواق الأسهم العربية والعالمية، العملات الرقمية، المعادن النفيسة والطاقة، بخبرة احترافية تمتد لأكثر من خمسة عشر عاماً وفريق من أفضل المحللين الماليين المعتمدين',
              'We manage your investments across Arab and global stock markets, cryptocurrencies, precious metals, and energy, with professional expertise spanning over fifteen years and a team of the best certified financial analysts'
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            <Link to="/contact" className="w-full sm:w-auto">
              <Button className="w-full px-8 py-4 text-lg gap-2 group">
                {ctaPrimary}
                <ArrowLeft className={cn("w-5 h-5 transition-transform", lang === 'ar' ? "group-hover:-translate-x-1" : "rotate-180 group-hover:translate-x-1")} />
              </Button>
            </Link>
            <Link to="/services" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full px-8 py-4 text-lg gap-2 bg-primary">
                <BarChart3 className="w-5 h-5" />
                {ctaSecondary}
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-y-2 gap-x-4 mt-4">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-gold-primary" />
              <span className="text-[13px] text-text-secondary">{t('ترخيص رسمي معتمد', 'Officially Licensed')}</span>
            </div>
            <div className="w-[1px] h-4 bg-border-light hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-gold-primary" />
              <span className="text-[13px] text-text-secondary">{t('استشارة أولى مجانية', 'Free First Consultation')}</span>
            </div>
            <div className="w-[1px] h-4 bg-border-light hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-gold-primary" />
              <span className="text-[13px] text-text-secondary">{t('أكثر من $2 مليار أصول مُدارة', 'Over $2B AUM')}</span>
            </div>
          </div>

          <div className="flex gap-8 border-t border-border-gold/30 pt-8 mt-4 w-full">
            {stats.slice(0, 3).map((stat, i) => (
              <div key={i}>
                <div className="font-mono font-black text-2xl text-gold-deep">{stat.value}</div>
                <div className="text-xs text-text-muted">{lang === 'ar' ? stat.label : stat.labelEn}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex justify-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <div className="absolute inset-0 border border-border-gold/20 rounded-full scale-110" />
          <div className="absolute inset-0 border border-border-gold/15 rounded-full scale-125" />

          <div className="relative bg-primary dark:bg-elevated border border-border-gold/30 rounded-2xl shadow-gold-md p-6 w-full max-w-[440px] z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-xs text-text-muted mb-1">{t('قيمة المحفظة الإجمالية', 'Total Portfolio Value')}</div>
                <div className="font-mono font-black text-2xl text-text-primary">$1,284,920</div>
              </div>
              <div className="bg-success-light border border-success/30 rounded-sm px-2 py-1 text-success font-mono font-bold text-[13px]">
                ▲ +12.4%
              </div>
            </div>

            <div className="w-full h-[100px] bg-gradient-to-b from-gold-primary/20 to-transparent relative mb-6 rounded-b-lg border-b-2 border-gold-primary">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0,80 Q10,70 20,60 T40,50 T60,30 T80,40 T100,10" fill="none" stroke="var(--color-gold-primary)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { title: t('أسهم', 'Equities'), val: '62%' },
                { title: t('رقمية', 'Crypto'), val: '21%' },
                { title: t('ذهب', 'Metals'), val: '17%' }
              ].map((item, i) => (
                <div key={i} className="bg-secondary dark:bg-tertiary border border-border-light rounded-md p-3">
                  <div className="text-[10px] text-text-muted mb-1">{item.title}</div>
                  <div className="font-black text-base text-gold-deep mb-2">{item.val}</div>
                  <div className="w-full h-1 bg-border-light rounded-full overflow-hidden">
                    <div className="h-full gradient-gold rounded-full" style={{ width: item.val }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute -top-6 -right-6 bg-primary border border-border-gold/30 rounded-lg shadow-md p-3 px-4 z-20 animate-[float_3s_ease-in-out_infinite]">
            <div className="font-bold text-[10px] text-text-muted">BTC/USD</div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-lg text-success">+2.4%</span>
              <TrendingUp className="w-3.5 h-3.5 text-success" />
            </div>
          </div>

          <div className="absolute -bottom-6 -left-6 bg-primary border border-border-gold/30 rounded-lg shadow-md p-3 px-4 z-20 animate-[float_3s_ease-in-out_infinite_1s]">
            <div className="font-bold text-[10px] text-text-muted">XAU/USD</div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-lg text-success">+0.9%</span>
              <TrendingUp className="w-3.5 h-3.5 text-success" />
            </div>
          </div>

          <div className="absolute top-1/2 -right-12 gradient-gold rounded-lg shadow-gold-sm p-3 z-20 flex items-center gap-3 animate-[float_3.5s_ease-in-out_infinite_0.5s]">
            <Bell className="w-5 h-5 text-white animate-pulse" />
            <div className="hidden sm:block">
              <div className="font-bold text-xs text-white leading-tight">{t('فرصة استثمار جديدة', 'New Investment Opportunity')}</div>
              <div className="text-[10px] text-white/80">{t('اكتشف التفاصيل الآن', 'Discover details now')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
