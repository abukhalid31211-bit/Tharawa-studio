import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useLang } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft, ArrowRight, Shield, Hash, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { createClientSession, saveClientSession, setAuthTokens, checkLoginRateLimit, recordLoginAttempt } from '@/lib/auth';
import { api } from '@/lib/api';
import { emailSchema } from '@/lib/validations';
import { sanitizeEmail, loginRateLimiter } from '@/lib/security';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';

export const Route = createFileRoute('/login')({ component: LoginPage });

function LoginPage() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'account'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const identifier = loginMethod === 'email' ? email : accountNumber;
    const rateCheck = loginRateLimiter.isBlocked(sanitizeEmail(identifier || 'unknown'));
    if (rateCheck.blocked) {
      setError(t(`محاولات كثيرة — انتظر ${rateCheck.remainingTime} دقيقة`, `Too many attempts — wait ${rateCheck.remainingTime} min`));
      return;
    }

    if (loginMethod === 'email') {
      const validation = emailSchema.safeParse(email);
      if (!validation.success) {
        setError(t('بريد إلكتروني غير صالح', 'Invalid email'));
        return;
      }
      if (!password || password.length < 1) {
        setError(t('كلمة المرور مطلوبة', 'Password required'));
        return;
      }
    } else {
      if (!accountNumber.trim()) {
        setError(t('رقم الحساب مطلوب', 'Account number required'));
        return;
      }
      if (!password) {
        setError(t('كلمة المرور مطلوبة', 'Password required'));
        return;
      }
    }

    setLoading(true);

    try {
      // Send identifier as-is: email or raw account number — no @tharwah.local conversion
      const loginIdentifier = loginMethod === 'email' ? email.trim() : accountNumber.trim();
      const response = await api.login(loginIdentifier, password);

      if (response.user && response.token) {
        setAuthTokens(response.token);
        const session = await createClientSession(
          response.user.id,
          response.user.email,
          response.user.name,
          response.user.tier || 'Regular',
          response.user.role || 'client'
        );
        saveClientSession(session);
        loginRateLimiter.recordAttempt(sanitizeEmail(loginIdentifier), true);
        logger.audit(response.user.email, 'client_login_success');
        navigate({ to: '/dashboard' });
        return;
      }

      throw new Error(t('فشل تسجيل الدخول — تحقق من البيانات', 'Login failed — check credentials'));
    } catch (err: any) {
      const message = err instanceof Error ? err.message : t('حدث خطأ غير متوقع', 'Unexpected error');
      setError(message);

      const identifier = loginMethod === 'email' ? email : accountNumber;
      loginRateLimiter.recordAttempt(sanitizeEmail(identifier), false);
      const remaining = loginRateLimiter.isBlocked(sanitizeEmail(identifier));
      if (!remaining.blocked && remaining.attemptsLeft < 5) {
        setAttemptsLeft(remaining.attemptsLeft);
      }

      logger.warn('Client login failed', { identifier, error: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary dark:bg-[#13132A] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold-deep/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[480px] relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-gold-deep transition-colors mb-6">
          {lang === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {t('العودة للموقع الرئيسي', 'Return to Main Website')}
        </Link>

        <Card className="p-8 md:p-10 shadow-xl border-border-gold/30">
          <div className="text-center mb-8">
            <div className="w-14 h-14 gradient-gold rounded-xl mx-auto flex items-center justify-center shadow-gold-sm mb-4">
              <span className="font-sans font-black text-white text-2xl">ر</span>
            </div>
            <h1 className="font-black text-2xl text-text-primary mb-2">{t('تسجيل دخول العميل', 'Client Login')}</h1>
            <p className="text-sm text-text-muted">{t('مرحباً بعودتك لمحفظتك الاستثمارية', 'Welcome back to your investment portfolio')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#FEF0EC] border border-[#FF4560]/20 text-[#FF4560] text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {attemptsLeft !== null && attemptsLeft > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#FFFBEB] border border-[#F59E0B]/20 text-[#92400E] text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{t(`تحذير: باقي ${attemptsLeft} محاولات`, `Warning: ${attemptsLeft} attempts left`)}</span>
              </div>
            )}

            {loginMethod === 'email' ? (
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-text-secondary block">{t('البريد الإلكتروني', 'Email Address')}</label>
                <div className="relative">
                  <Mail className="absolute rtl:right-4 ltr:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ahmed@example.com"
                    maxLength={254}
                    className="w-full bg-secondary border border-border-default rounded-md py-3 rtl:pr-12 rtl:pl-4 ltr:pl-12 ltr:pr-4 focus:border-gold-primary focus:shadow-[0_0_0_3px_var(--color-gold-subtle)] outline-none transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-text-secondary block">{t('رقم الحساب', 'Account Number')}</label>
                <div className="relative">
                  <Hash className="absolute rtl:right-4 ltr:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    required
                    type="text"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    placeholder="TH-9842105"
                    maxLength={20}
                    className="w-full bg-secondary border border-border-default rounded-md py-3 rtl:pr-12 rtl:pl-4 ltr:pl-12 ltr:pr-4 focus:border-gold-primary focus:shadow-[0_0_0_3px_var(--color-gold-subtle)] outline-none transition-all font-mono"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-bold text-text-secondary">{t('كلمة المرور', 'Password')}</label>
                <Link to="/forgot-password" className="text-[12px] font-semibold text-gold-deep hover:text-gold-dark hover:underline">{t('نسيت كلمة المرور؟', 'Forgot Password?')}</Link>
              </div>
              <div className="relative">
                <Lock className="absolute rtl:right-4 ltr:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  maxLength={128}
                  className="w-full bg-secondary border border-border-default rounded-md py-3 rtl:pr-12 rtl:pl-12 ltr:pl-12 ltr:pr-12 focus:border-gold-primary focus:shadow-[0_0_0_3px_var(--color-gold-subtle)] outline-none transition-all font-mono"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute rtl:left-4 ltr:right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-gold-primary">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="w-4 h-4 rounded-sm border-border-default accent-gold-primary" />
              <label htmlFor="remember" className="text-[13px] text-text-secondary cursor-pointer">{t('تذكرني لمدة 30 يوماً', 'Remember me for 30 days')}</label>
            </div>

            <Button type="submit" className="w-full py-3.5 gap-2 text-base mt-2" isLoading={loading}>
              <LogIn className="w-5 h-5" /> {t('دخول لمحفظتي', 'Enter My Portfolio')}
            </Button>

            {env.isDevelopment && (
              <div className="p-3 rounded-lg bg-[#F0FDF4] border border-[#00D97E]/20 text-xs">
                <p className="font-bold text-[#065F46] mb-1">🔧 Demo Credentials (DEV):</p>
                <p className="text-[#047857] font-mono">ahmed@example.com / ClientDemo2026!</p>
                <p className="text-[10px] text-[#059669] mt-1">⚠️ استخدم حساباً حقيقياً في الإنتاج</p>
              </div>
            )}
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-[1px] bg-border-light" />
            <span className="text-[12px] text-text-muted">{t('أو', 'OR')}</span>
            <div className="flex-1 h-[1px] bg-border-light" />
          </div>

          <button
            onClick={() => setLoginMethod(m => m === 'email' ? 'account' : 'email')}
            className="w-full bg-secondary border border-border-default rounded-md py-3 flex items-center justify-center gap-2 hover:border-gold-primary hover:text-gold-deep transition-colors text-sm font-semibold text-text-secondary"
          >
            {loginMethod === 'email' ? (
              <><Hash className="w-4 h-4" /> {t('الدخول برقم الحساب', 'Sign In with Account Number')}</>
            ) : (
              <><Mail className="w-4 h-4" /> {t('الدخول بالبريد الإلكتروني', 'Sign In with Email')}</>
            )}
          </button>
        </Card>

        <div className="mt-6 bg-tertiary dark:bg-primary border border-border-light rounded-xl p-4 flex flex-col items-center justify-center gap-3 shadow-sm">
          <div className="flex items-center gap-2 text-[12px] text-text-muted">
            <Shield className="w-4 h-4 text-success" /> {t('اتصال آمن ومشفر بتقنية TLS 1.3', 'Secure encrypted connection with TLS 1.3')}
          </div>
          <div className="flex items-center gap-6 text-[11px] text-text-muted">
            <div className="flex items-center gap-1">🔒 {t('SSL محمي', 'SSL Protected')}</div>
            <div className="flex items-center gap-1">🛡️ {t('JWT Auth', 'JWT Auth')}</div>
            <div className="flex items-center gap-1">✅ {t('مرخص', 'Licensed')}</div>
          </div>
        </div>

        <div className="mt-8 text-center text-[13px] text-text-muted">
          {t('لست عميلاً بعد؟', 'Not a client yet?')} <Link to="/contact" className="font-bold text-gold-deep hover:underline">{t('تواصل معنا للبدء', 'Contact us to get started')}</Link>
        </div>
      </div>
    </div>
  );
}
