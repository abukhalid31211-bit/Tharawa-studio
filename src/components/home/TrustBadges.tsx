import React from 'react';
import { useLang } from '@/contexts/LanguageContext';

export function TrustBadges() {
  const { t } = useLang();
  return (
    <section className="w-full bg-secondary dark:bg-[#13132A] py-10 border-y border-border-light overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-4">
        <p className="text-center text-sm font-bold text-text-muted mb-6">{t('جهات نثق بها ونتعاون معها', 'Trusted Partners & Collaborators')}</p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          {/* Mock Logos */}
          <div className="font-mono text-xl font-bold">Bloomberg</div>
          <div className="font-mono text-xl font-bold">REUTERS</div>
          <div className="font-mono text-xl font-bold">Forbes</div>
          <div className="font-mono text-xl font-bold">Nasdaq</div>
          <div className="font-mono text-xl font-bold">DowJones</div>
        </div>
      </div>
    </section>
  );
}
