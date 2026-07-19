import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="العودة للأعلى"
      className={cn(
        "fixed left-6 z-40 w-11 h-11 rounded-md bg-primary dark:bg-elevated border border-border-gold/30 shadow-md flex items-center justify-center transition-all duration-300",
        "hover:gradient-gold hover:border-gold-primary hover:text-white hover:-translate-y-[3px] hover:shadow-gold-sm text-gold-deep",
        isVisible ? "opacity-100 visible bottom-[88px] translate-y-0" : "opacity-0 invisible bottom-[88px] translate-y-3"
      )}
    >
      <ChevronUp className="w-6 h-6" />
    </button>
  );
}
