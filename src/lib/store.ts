export const KEYS = {
  ADMIN_SESSION: 'tharwah_admin_session',
  CLIENT_SESSION: 'tharwah_client_session',
  LANG: 'tharwah_lang',
  SETTINGS: 'tharwah_settings'
};

export function getStorage(key: string, defaultValue: any = null) {
  if (typeof window === 'undefined') return defaultValue;
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : defaultValue;
}

export function setStorage(key: string, value: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeStorage(key: string) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}
