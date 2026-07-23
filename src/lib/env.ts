/**
 * Tharwah Capital - Environment Validation
 * Backend-only setup
 */

const requiredEnvVars = [
  'VITE_API_URL',
] as const;

const optionalEnvVars = [
  'VITE_APP_URL',
  'VITE_SOCKET_URL',
  'VITE_SENTRY_DSN',
  'VITE_POSTHOG_KEY',
] as const;

interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
}

export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  const isProduction = import.meta.env.PROD;

  for (const key of requiredEnvVars) {
    const value = import.meta.env[key];
    if (!value) {
      if (isProduction) {
        missing.push(key);
      } else {
        warnings.push(`[DEV] Missing ${key} - using fallback`);
      }
    }
  }

  for (const key of optionalEnvVars) {
    if (!import.meta.env[key]) {
      warnings.push(`Optional ${key} not set`);
    }
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && !isValidUrl(apiUrl)) {
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
  apiUrl: (import.meta.env.VITE_API_URL as string) || (import.meta.env.PROD ? 'https://api.yourdomain.com' : 'http://localhost:3000'),
  socketUrl: (import.meta.env.VITE_SOCKET_URL as string) || (import.meta.env.VITE_API_URL as string) || (import.meta.env.PROD ? 'https://api.yourdomain.com' : 'http://localhost:3000'),
  appUrl: (import.meta.env.VITE_APP_URL as string) || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
  sentryDsn: import.meta.env.VITE_SENTRY_DSN as string | undefined,
  posthogKey: import.meta.env.VITE_POSTHOG_KEY as string | undefined,
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
  mode: import.meta.env.MODE as string,
};

export function logEnvStatus() {
  if (env.isDevelopment) {
    const result = validateEnv();
    if (result.warnings.length > 0) {
      console.warn('[Env] Warnings:', result.warnings);
    }
    console.info('[Env] API URL:', env.apiUrl);
    console.info('[Env] Socket URL:', env.socketUrl);
  }
}
