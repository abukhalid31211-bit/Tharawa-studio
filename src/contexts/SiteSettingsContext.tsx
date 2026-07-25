import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSiteDesignContent } from '@/lib/publicSite';

interface SiteSettings {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const SiteSettingsContext = createContext<SiteSettings | undefined>(undefined);
const THEME_STORAGE_KEY = 'tharwah_site_theme';

function applyTheme(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  if (theme === 'dark') document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
}

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const { data: design } = useSiteDesignContent();
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return 'light';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return;
    const preferred = design.darkModeDefault ? 'dark' : 'light';
    setThemeState(preferred);
    applyTheme(preferred);
  }, [design.darkModeDefault]);

  useEffect(() => {
    applyTheme(theme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  const value = useMemo<SiteSettings>(() => ({
    theme,
    setTheme: setThemeState,
  }), [theme]);

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) throw new Error('useSiteSettings must be used within SiteSettingsProvider');
  return context;
}
