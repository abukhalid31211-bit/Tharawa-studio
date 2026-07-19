import React, { useState, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';

export function WhatsappButton() {
  const { t } = useLang();
  const [isTopVisible, setIsTopVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsTopVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <a
      href="https://wa.me/97141234567"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل معنا عبر واتساب"
      className={cn(
        "fixed left-6 z-40 bg-[#25D366] rounded-2xl shadow-[0_8px_24px_rgba(37,211,102,0.40)] flex items-center p-3.5 group transition-all duration-300",
        "hover:-translate-y-[3px] hover:shadow-[0_12px_32px_rgba(37,211,102,0.55)] animate-[pulse-whatsapp_2.5s_ease-in-out_infinite]",
        isTopVisible ? "bottom-[32px]" : "bottom-[32px]"
      )}
    >
      <WhatsappIcon className="w-[22px] h-[22px] text-white fill-current shrink-0" />
      <span className="font-bold text-[14px] text-white whitespace-nowrap overflow-hidden max-w-0 group-hover:max-w-[120px] transition-all duration-400 ease-out rtl:group-hover:mr-2 ltr:group-hover:ml-2">
        {t('تحدث معنا', 'Chat with us')}
      </span>
    </a>
  );
}
