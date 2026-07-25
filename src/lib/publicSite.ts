import { useMemo } from 'react';
import { useContent, useSettings } from './queries';

export interface PublicSiteSettings {
  platform_name: string;
  platform_name_en: string;
  support_phone: string;
  support_email: string;
  maintenance_mode: boolean;
  contact_address_ar: string;
  contact_address_en: string;
  whatsapp_number: string;
  business_hours_ar: string;
  business_hours_en: string;
}

export interface SiteDesignContent {
  primaryColor: string;
  goldAccent: string;
  darkModeDefault: boolean;
  showAnnouncementBar: boolean;
  showLiveTicker: boolean;
  showWhatsapp: boolean;
  showCookieBanner: boolean;
  logoText: string;
  logoTextEn: string;
  announcement: string;
  announcementEn: string;
}

const DEFAULT_SETTINGS: PublicSiteSettings = {
  platform_name: 'ثروة كابيتال',
  platform_name_en: 'Tharwah Capital',
  support_phone: '',
  support_email: '',
  maintenance_mode: false,
  contact_address_ar: '',
  contact_address_en: '',
  whatsapp_number: '',
  business_hours_ar: '',
  business_hours_en: '',
};

export const DEFAULT_SITE_DESIGN: SiteDesignContent = {
  primaryColor: '#0EA5E9',
  goldAccent: '#C9A84C',
  darkModeDefault: false,
  showAnnouncementBar: true,
  showLiveTicker: true,
  showWhatsapp: true,
  showCookieBanner: true,
  logoText: 'ثروة كابيتال',
  logoTextEn: 'Tharwah Capital',
  announcement: '',
  announcementEn: '',
};

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function usePublicSiteSettings() {
  const { data, isLoading, error } = useSettings();

  const normalized = useMemo<PublicSiteSettings>(() => {
    const raw = (data as any)?.data ?? {};
    return {
      platform_name: asString(raw.platform_name, DEFAULT_SETTINGS.platform_name),
      platform_name_en: asString(raw.platform_name_en, DEFAULT_SETTINGS.platform_name_en),
      support_phone: asString(raw.support_phone),
      support_email: asString(raw.support_email),
      maintenance_mode: asBoolean(raw.maintenance_mode),
      contact_address_ar: asString(raw.contact_address_ar),
      contact_address_en: asString(raw.contact_address_en),
      whatsapp_number: asString(raw.whatsapp_number),
      business_hours_ar: asString(raw.business_hours_ar),
      business_hours_en: asString(raw.business_hours_en),
    };
  }, [data]);

  return { data: normalized, isLoading, error };
}

export function useSiteDesignContent() {
  const { data, isLoading, error } = useContent('design');

  const normalized = useMemo<SiteDesignContent>(() => {
    const raw = ((data as any)?.data?.content_data ?? (data as any)?.data ?? {}) as Record<string, unknown>;
    return {
      primaryColor: asString(raw.primaryColor, DEFAULT_SITE_DESIGN.primaryColor),
      goldAccent: asString(raw.goldAccent, DEFAULT_SITE_DESIGN.goldAccent),
      darkModeDefault: asBoolean(raw.darkModeDefault, DEFAULT_SITE_DESIGN.darkModeDefault),
      showAnnouncementBar: asBoolean(raw.showAnnouncementBar, DEFAULT_SITE_DESIGN.showAnnouncementBar),
      showLiveTicker: asBoolean(raw.showLiveTicker, DEFAULT_SITE_DESIGN.showLiveTicker),
      showWhatsapp: asBoolean(raw.showWhatsapp, DEFAULT_SITE_DESIGN.showWhatsapp),
      showCookieBanner: asBoolean(raw.showCookieBanner, DEFAULT_SITE_DESIGN.showCookieBanner),
      logoText: asString(raw.logoText, DEFAULT_SITE_DESIGN.logoText),
      logoTextEn: asString(raw.logoTextEn, DEFAULT_SITE_DESIGN.logoTextEn),
      announcement: asString(raw.announcement),
      announcementEn: asString(raw.announcementEn),
    };
  }, [data]);

  return { data: normalized, isLoading, error };
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}
