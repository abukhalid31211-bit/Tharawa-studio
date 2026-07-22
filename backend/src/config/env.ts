/**
 * Tharwah Capital - Backend Config
 * كل الإعدادات تقرأ من Environment Variables فقط — لا هاردكود نهائياً
 */
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  // URLs مرنة لأي دومين
  appUrl: process.env.APP_URL || 'https://www.your-domain.com',
  apiUrl: process.env.API_URL || 'https://api.your-domain.com',
  socketUrl: process.env.SOCKET_URL || 'https://api.your-domain.com',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev-secret-change-in-prod'),
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev-refresh-secret'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // CORS مرن
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(o => o.length > 0),
  
  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  
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
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL || '',
  superAdminPasswordHash: process.env.SUPER_ADMIN_PASSWORD_HASH || '',
  superAdminSalt: process.env.SUPER_ADMIN_SALT || '',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validation — تأكد من وجود القيم الضرورية في الإنتاج
if (config.nodeEnv === 'production') {
  const required = [
    { key: 'JWT_SECRET', value: config.jwtSecret },
    { key: 'JWT_REFRESH_SECRET', value: config.jwtRefreshSecret },
    { key: 'DATABASE_URL', value: config.databaseUrl },
    { key: 'ALLOWED_ORIGINS', value: process.env.ALLOWED_ORIGINS },
  ];
  const missing = required.filter(r => !r.value || r.value === '').map(r => r.key);
  if (missing.length > 0) {
    console.error(`[ENV ERROR] Missing required production env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
  console.info('[ENV] Production environment validated — no hardcoded secrets');
}
