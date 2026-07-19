/**
 * Tharwah Capital - Secure Storage Layer
 * طبقة تخزين آمنة مع تشويش و انتهاء صلاحية
 */
import { obfuscateData, deobfuscateData } from './crypto';
import { logger } from './logger';

export const KEYS = {
  ADMIN_SESSION: 'tharwah_admin_session_v2',
  CLIENT_SESSION: 'tharwah_client_session_v2',
  LANG: 'tharwah_lang',
  SETTINGS: 'tharwah_settings',
  // Deprecated - for migration
  ADMIN_SESSION_OLD: 'tharwah_admin_session',
  CLIENT_SESSION_OLD: 'tharwah_client_session',
};

// Session with expiry
interface StoredValue<T> {
  value: T;
  timestamp: number;
  expiresAt?: number;
  version: number;
}

const CURRENT_VERSION = 2;
const DEFAULT_EXPIRY_HOURS = 8;

function isExpired(item: StoredValue<any>): boolean {
  if (!item.expiresAt) return false;
  return Date.now() > item.expiresAt;
}

export function getStorage<T>(key: string, defaultValue: T | null = null): T | null {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      // Try migration from old key
      if (key === KEYS.ADMIN_SESSION) {
        const old = localStorage.getItem(KEYS.ADMIN_SESSION_OLD);
        if (old) {
          logger.info('Migrating old admin session');
          return JSON.parse(old) as T;
        }
      }
      if (key === KEYS.CLIENT_SESSION) {
        const old = localStorage.getItem(KEYS.CLIENT_SESSION_OLD);
        if (old) {
          return JSON.parse(old) as T;
        }
      }
      return defaultValue;
    }

    // Try to parse as new secure format first
    try {
      const deobfuscated = deobfuscateData(raw);
      const parsed = JSON.parse(deobfuscated) as StoredValue<T>;
      
      // Check if it's new format
      if (parsed && typeof parsed === 'object' && 'value' in parsed && 'version' in parsed) {
        if (isExpired(parsed)) {
          logger.info(`Storage key ${key} expired, removing`);
          localStorage.removeItem(key);
          return defaultValue;
        }
        return parsed.value as T;
      }
    } catch {
      // Fall back to old format
    }

    // Old format - plain JSON
    return JSON.parse(raw) as T;
  } catch (error) {
    logger.warn(`Failed to parse storage key ${key}`, { error });
    return defaultValue;
  }
}

export function setStorage<T>(key: string, value: T, expiryHours: number = DEFAULT_EXPIRY_HOURS): void {
  if (typeof window === 'undefined') return;
  
  try {
    const stored: StoredValue<T> = {
      value,
      timestamp: Date.now(),
      expiresAt: expiryHours > 0 ? Date.now() + expiryHours * 60 * 60 * 1000 : undefined,
      version: CURRENT_VERSION,
    };

    const serialized = JSON.stringify(stored);
    const obfuscated = obfuscateData(serialized);
    localStorage.setItem(key, obfuscated);
  } catch (error) {
    logger.error(`Failed to set storage key ${key}`, error);
    
    // Quota exceeded - try to clear old data
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      logger.warn('Storage quota exceeded, attempting cleanup');
      cleanupOldStorage();
      try {
        const stored: StoredValue<T> = {
          value,
          timestamp: Date.now(),
          expiresAt: Date.now() + expiryHours * 60 * 60 * 1000,
          version: CURRENT_VERSION,
        };
        localStorage.setItem(key, obfuscateData(JSON.stringify(stored)));
      } catch (retryError) {
        logger.error('Failed to store even after cleanup', retryError);
      }
    }
  }
}

export function removeStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
    // Also remove old version
    if (key === KEYS.ADMIN_SESSION) {
      localStorage.removeItem(KEYS.ADMIN_SESSION_OLD);
      localStorage.removeItem('admin_permissions');
    }
    if (key === KEYS.CLIENT_SESSION) {
      localStorage.removeItem(KEYS.CLIENT_SESSION_OLD);
    }
  } catch (error) {
    logger.warn(`Failed to remove storage key ${key}`, { error });
  }
}

function cleanupOldStorage(): void {
  // Remove expired items and old audit logs
  const keysToCheck = Object.values(KEYS);
  for (const key of keysToCheck) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      
      const deobfuscated = deobfuscateData(raw);
      const parsed = JSON.parse(deobfuscated) as StoredValue<any>;
      
      if (parsed && isExpired(parsed)) {
        localStorage.removeItem(key);
      }
    } catch {}
  }

  // Clean old audit logs if too large
  try {
    const auditLogs = localStorage.getItem('tharwah_audit_logs');
    if (auditLogs && auditLogs.length > 50000) {
      const logs = JSON.parse(auditLogs);
      localStorage.setItem('tharwah_audit_logs', JSON.stringify(logs.slice(0, 50)));
    }
  } catch {}
}

// Secure check for sensitive operations
export function clearAllAuthStorage(): void {
  removeStorage(KEYS.ADMIN_SESSION);
  removeStorage(KEYS.CLIENT_SESSION);
  localStorage.removeItem('tharwah_force_logout');
  localStorage.removeItem('admin_permissions');
  localStorage.removeItem('tharwah_admin_login_lock');
}

// Export for testing
export const __internal = {
  isExpired,
  cleanupOldStorage,
};
