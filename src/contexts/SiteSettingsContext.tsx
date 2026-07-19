import React, { createContext, useContext, useState } from 'react';

interface SiteSettings {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const SiteSettingsContext = createContext<SiteSettings | undefined>(undefined);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<'light'|'dark'>('light');

  const setTheme = (t: 'light'|'dark') => {
    setThemeState(t);
    if(t === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  return (
    <SiteSettingsContext.Provider value={{ theme, setTheme }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) throw new Error('useSiteSettings must be used within SiteSettingsProvider');
  return context;
}
