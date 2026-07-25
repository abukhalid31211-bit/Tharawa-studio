import React, { useState, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useSiteDesignContent } from '@/lib/publicSite';
import { Button } from '@/components/ui/Button';

export function CookieBanner() {
  const { t } = useLang();
  const { data: design } = useSiteDesignContent();
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookies-accepted');
    if (!accepted) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cookies-accepted', '1');
    setIsVisible(false);
  };

  if (!design.showCookieBanner || !isVisible) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 w-full z-50 bg-[#FFFFFFFA] dark:bg-[#13132AFA] backdrop-blur-[16px] border-t border-border-gold/30 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] py-4 px-5 animate-in slide-in-from-bottom-full duration-500">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-3">
            <span className="text-xl">🍪</span>
            <div>
              <div className="font-bold text-[15px] text-text-primary mb-1">{t('نستخدم ملفات تعريف الارتباط', 'We use cookies')}</div>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                {t('نستخدم ملفات تعريف الارتباط لتحسين تجربتك، تحليل أداء الموقع، وتخصيص المحتوى. استمرارك في التصفح يعني موافقتك على', 'We use cookies to improve your experience, analyze website performance, and personalize content. Continuing to browse means you agree to our')}
                {' '}
                <button onClick={() => setShowModal(true)} className="font-bold text-gold-deep hover:underline">{t('سياسة الخصوصية', 'Privacy Policy')}</button>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <Button variant="ghost" size="sm" onClick={() => setShowModal(true)} className="flex-1 md:flex-none">
              {t('إعدادات الخصوصية', 'Privacy Settings')}
            </Button>
            <Button size="sm" onClick={handleAcceptAll} className="flex-1 md:flex-none">
              {t('قبول الكل', 'Accept All')}
            </Button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-primary w-full max-w-lg rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-border-light flex items-center justify-between bg-secondary rounded-t-2xl">
              <h3 className="font-bold text-lg text-text-primary">{t('إعدادات الخصوصية', 'Privacy Settings')}</h3>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-error">×</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-bold text-[14px]">{t('ضرورية للعمل', 'Strictly Necessary')}</div>
                  <div className="text-[12px] text-text-muted">{t('هذه الملفات ضرورية لعمل الموقع بشكل صحيح ولا يمكن تعطيلها', 'These cookies are necessary for the website to function properly and cannot be disabled')}</div>
                </div>
                <div className="w-11 h-6 bg-gold-primary rounded-full relative opacity-50 cursor-not-allowed">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 rtl:left-0.5 ltr:right-0.5" />
                </div>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-bold text-[14px]">{t('التحليل والأداء', 'Analytics & Performance')}</div>
                  <div className="text-[12px] text-text-muted">{t('تساعدنا في فهم كيفية استخدامك للموقع لتحسين تجربتك', 'Help us understand how you use the website to improve your experience')}</div>
                </div>
                <div className="w-11 h-6 bg-gold-primary rounded-full relative cursor-pointer">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 rtl:left-0.5 ltr:right-0.5" />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border-light flex items-center gap-3 bg-secondary rounded-b-2xl">
              <Button onClick={() => { handleAcceptAll(); setShowModal(false); }} className="flex-1">{t('حفظ التفضيلات', 'Save Preferences')}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
