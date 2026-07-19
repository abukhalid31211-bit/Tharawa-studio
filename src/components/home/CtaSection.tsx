import React from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Rocket, Mail, CheckCircle } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';

export function CtaSection() {
  const { t } = useLang();
  
  return (
    <section className="relative w-full gradient-gold py-24 overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[80px] -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-[60px] translate-y-1/2" />

      <div className="max-w-[800px] mx-auto px-4 text-center relative z-10 text-white flex flex-col items-center">
        <Rocket className="w-12 h-12 mb-4 animate-[float_3s_ease-in-out_infinite]" />
        
        <span className="font-black text-[11px] tracking-[0.3em] uppercase mb-4 opacity-80">
          {t('لا تنتظر — ابدأ الآن', "DON'T WAIT — START NOW")}
        </span>
        
        <h2 className="font-black text-3xl md:text-5xl mb-6">
          {t('ثروتك تنتظر القرار الصحيح', 'Your Wealth Awaits the Right Decision')}
        </h2>
        
        <p className="text-lg md:text-xl opacity-85 mb-10 max-w-[620px]">
          {t('كل يوم تؤخر فيه قراراك هو يوم يخسر فيه مالك قيمته أمام التضخم. استثمر الآن بثقة مع فريق من أفضل المختصين الماليين في المنطقة', 'Every day you delay your decision is a day your money loses value to inflation. Invest now with confidence.')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-10 w-full sm:w-auto">
          <Link to="/contact" className="w-full sm:w-auto">
            <Button className="bg-white text-gold-deep px-8 py-4 text-base w-full gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:-translate-y-1">
              <Mail className="w-5 h-5" /> {t('احجز استشارتك المجانية الآن', 'Book Your Free Consultation Now')}
            </Button>
          </Link>
          <a href="https://wa.me/97141234567" target="_blank" rel="noreferrer" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-white/50 text-white font-bold px-8 py-4 rounded-md hover:bg-white/10 transition-colors">
            <WhatsappIcon className="w-5 h-5 text-white fill-current shrink-0" />
            {t('أو تحدث معنا عبر واتساب', 'Or Chat With Us on WhatsApp')}
          </a>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-sm opacity-85">
          <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4"/> {t('لا رسوم خفية على الإطلاق', 'No Hidden Fees')}</div>
          <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4"/> {t('إلغاء في أي وقت', 'Cancel Anytime')}</div>
        </div>
      </div>
    </section>
  );
}
