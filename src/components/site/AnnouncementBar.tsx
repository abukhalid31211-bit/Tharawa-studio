import React from 'react';
import { Megaphone, X } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

export function AnnouncementBar() {
  const { t } = useLang();
  const [visible, setVisible] = React.useState(true);

  if (!visible) return null;

  return (
    <div className="relative bg-gradient-to-r from-[#C9920A] to-[#F5C518] text-white overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 h-10 flex items-center justify-center gap-3 text-xs md:text-sm font-bold">
        <Megaphone className="w-4 h-4 shrink-0" />
        <span>
          {t(
            '🎉 عرض خاص: احصل على استشارة مجانية مع خبير ثروة كابيتال — سجّل الآن عبر صفحة تواصل معنا!',
            '🎉 Special Offer: Get a free consultation with a Tharwah Capital expert — Register now via our Contact page!'
          )}
        </span>
        <button
          onClick={() => setVisible(false)}
          aria-label="Close announcement"
          className="ml-auto shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {/* Subtle light shimmer */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_3s_infinite]" />
    </div>
  );
}
