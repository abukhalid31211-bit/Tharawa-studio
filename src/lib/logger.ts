/**
 * Tharwah Capital - Structured Logger
 * نظام سجل منظم مع دعم Sentry مستقبلاً
 */
import { env } from './env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDev = env.isDevelopment;
  private isProd = env.isProduction;

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const ctx = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${ctx}`;
  }

  debug(message: string, context?: LogContext): void {
    if (!this.isDev) return;
    console.debug(this.formatMessage('debug', message, context));
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
    
    // في الإنتاج، يمكن إرسال التحذيرات إلى Sentry
    if (this.isProd && env.sentryDsn) {
      // Sentry.captureMessage(message, 'warning');
    }
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: this.isDev ? error.stack : undefined,
      } : error,
    };

    console.error(this.formatMessage('error', message, errorContext));

    // في الإنتاج، إرسال إلى Sentry
    if (this.isProd && env.sentryDsn) {
      // Sentry.captureException(error, { extra: context });
    }
  }

  // Audit log - يُحفظ دائماً
  audit(actor: string, action: string, details?: LogContext): void {
    const auditEntry = {
      actor,
      action,
      timestamp: new Date().toISOString(),
      details,
    };
    
    console.info(this.formatMessage('info', `AUDIT: ${actor} -> ${action}`, auditEntry));
    
    // حفظ في localStorage للمراجعة + إرسال للbackend إن وجد
    try {
      const logs = JSON.parse(localStorage.getItem('tharwah_audit_logs') || '[]');
      logs.unshift(auditEntry);
      localStorage.setItem('tharwah_audit_logs', JSON.stringify(logs.slice(0, 100)));
    } catch {}
  }
}

export const logger = new Logger();

// Performance monitoring
export function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;
    
    if (duration > 100) {
      logger.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    } else {
      logger.debug(`Operation ${name} completed`, { duration: duration.toFixed(2) });
    }
    
    return result;
  } catch (error) {
    logger.error(`Operation ${name} failed`, error);
    throw error;
  }
}

export async function measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    if (duration > 500) {
      logger.warn(`Slow async operation: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    logger.error(`Async operation ${name} failed`, error);
    throw error;
  }
}
