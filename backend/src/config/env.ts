/**
 * Tharwah Capital - Backend Config
 * كل الإعدادات تقرأ من Environment Variables فقط — لا هاردكود نهائياً
 */
import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value || value === '') {
    if (defaultValue !== undefined) return defaultValue;
    if (process.env.NODE_ENV === 'production') {
      console.error(`[ENV ERROR] Missing required env var: ${key}`);
      process.exit(1);
    }
    return '';
  }
  return value;
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  // URLs مرنة لأي دومين
  appUrl: process.env.APP_URL || 'https://www.your-domain.com',
  apiUrl: process.env.API_URL || 'https://api.your-domain.com',
  socketUrl: process.env.SOCKET_URL || 'https://api.your-domain.com',

  // JWT
  jwtSecret: requireEnv('JWT_SECRET', process.env.NODE_ENV === 'production' ? '' : 'dev-jwt-secret-change-in-prod-min-32-chars'),
  jwtRefreshSecret: requireEnv('JWT_REFRESH_SECRET', process.env.NODE_ENV === 'production' ? '' : 'dev-refresh-secret-change-in-prod-min-32-chars'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // CORS مرن
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(o => o.length > 0),

  // Database
  databaseUrl: requireEnv('DATABASE_URL', process.env.NODE_ENV === 'production' ? '' : 'postgresql://postgres:postgres@localhost:5432/tharwah'),

  // Security
  sessionTimeoutHours: parseInt(process.env.SESSION_TIMEOUT_HOURS || '8', 10),
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
  lockoutDurationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '30', 10),

  // Rate Limit
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),

  // SSL
  sslCertPath: process.env.SSL_CERT_PATH || '',
  sslKeyPath: process.env.SSL_KEY_PATH || '',

  // Admin
  superAdminEmail: requireEnv('SUPER_ADMIN_EMAIL', 'admin@your-domain.com').toLowerCase(),
  superAdminPasswordHash: process.env.SUPER_ADMIN_PASSWORD_HASH || '',
  superAdminSalt: process.env.SUPER_ADMIN_SALT || '',
  // Plain password for seeding only — never use in production
  superAdminPlainPassword: process.env.SUPER_ADMIN_PLAIN_PASSWORD || '',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validation — تأكد من وجود القيم الضرورية في الإنتاج
if (config.nodeEnv === 'production') {
  const required = [
    { key: 'JWT_SECRET', value: config.jwtSecret, minLength: 32 },
    { key: 'JWT_REFRESH_SECRET', value: config.jwtRefreshSecret, minLength: 32 },
    { key: 'DATABASE_URL', value: config.databaseUrl },
    { key: 'ALLOWED_ORIGINS', value: process.env.ALLOWED_ORIGINS },
    { key: 'SUPER_ADMIN_EMAIL', value: config.superAdminEmail },
  ];
  const missing: string[] = [];
  for (const r of required) {
    if (!r.value || r.value === '') {
      missing.push(r.key);
    } else if (r.minLength && r.value.length < r.minLength) {
      console.error(`[ENV ERROR] ${r.key} must be at least ${r.minLength} characters`);
      process.exit(1);
    }
  }
  if (missing.length > 0) {
    console.error(`[ENV ERROR] Missing required production env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
  console.info('[ENV] Production environment validated — no hardcoded secrets');
}
