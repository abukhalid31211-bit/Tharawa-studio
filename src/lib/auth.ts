import { getStorage, setStorage, removeStorage, KEYS } from './store';

export interface AdminSession {
  email: string;
  name: string;
  role: 'super' | 'sub';
  permissions: string[];
}

export function saveAdminSession(session: AdminSession) { setStorage(KEYS.ADMIN_SESSION, session); }
export function clearAdminSession() { removeStorage(KEYS.ADMIN_SESSION); }
export function getAdminSession(): AdminSession | null { return getStorage(KEYS.ADMIN_SESSION); }
export function isAdminAuthed() { return !!getAdminSession(); }

/** Sections a sub-admin is allowed to see; super admin sees everything. */
export function getAllowedSections(session: AdminSession | null): string[] | null {
  if (!session) return [];
  if (session.role === 'super') return null; // null = all
  return session.permissions || [];
}

export function saveClientSession(session: any) { setStorage(KEYS.CLIENT_SESSION, session); }
export function clearClientSession() { removeStorage(KEYS.CLIENT_SESSION); }
export function getClientSession() { return getStorage(KEYS.CLIENT_SESSION); }
export function isClientAuthed() { return !!getClientSession(); }
