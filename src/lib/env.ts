/**
 * Tharwah Capital - Environment Validation
 * يتحقق من المتغيرات البيئية ويوفر قيم افتراضية آمنة للتطوير
 */

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

const optionalEnvVars = [
  'VITE_API_URL',
  'VITE_APP_URL',
  'VITE_SENTRY_DSN',
  'VITE_POSTHOG_KEY',
  'VITE_SUPER_ADMIN_EMAIL',
] as const;

interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
}

export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // في الإنتاج يجب أن تكون المتغيرات المطلوبة موجودة
  const isProduction = import.meta.env.PROD;

  for (const key of requiredEnvVars) {
    const value = import.meta.env[key];
    if (!value) {
      if (isProduction) {
        missing.push(key);
      } else {
        warnings.push(`[DEV] Missing ${key} - using mock mode`);
      }
    }
  }

  for (const key of optionalEnvVars) {
    if (!import.meta.env[key]) {
      warnings.push(`Optional ${key} not set`);
    }
  }

  // تحقق من صيغة URL
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl && !isValidUrl(supabaseUrl)) {
    missing.push(`${requiredEnvVars[0]} (invalid URL format)`);
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  supabaseServiceRole: import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined,
  apiUrl: (import.meta.env.VITE_API_URL as string) || '/api/v1',
  appUrl: (import.meta.env.VITE_APP_URL as string) || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
  sentryDsn: import.meta.env.VITE_SENTRY_DSN as string | undefined,
  posthogKey: import.meta.env.VITE_POSTHOG_KEY as string | undefined,
  superAdminEmail: (import.meta.env.VITE_SUPER_ADMIN_EMAIL as string) || '',
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
  mode: import.meta.env.MODE as string,
  isMockMode: !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY,
};

export function logEnvStatus() {
  if (env.isDevelopment) {
    const result = validateEnv();
    if (result.warnings.length > 0) {
      console.warn('[Env] Warnings:', result.warnings);
    }
    if (env.isMockMode) {
      console.warn('[Env] Running in MOCK MODE - Supabase not configured. Data will be stored in localStorage only.');
      console.info('[Env] To enable production mode, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    } else {
      console.info('[Env] Production mode - Supabase configured');
    }
  }
}
