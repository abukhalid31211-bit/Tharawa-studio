// ─────────────────────────────────────────────────────────────
// AdminLogin - SECURE v3 - Backend JWT
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertTriangle, Shield, ShieldAlert } from 'lucide-react';
import { saveAdminSession, createAdminSession, checkLoginRateLimit, recordLoginAttempt, setAuthTokens } from '@/lib/auth';
import { api } from '@/lib/api';
import { useNavigate } from '@tanstack/react-router';
import { useLang } from '@/contexts/LanguageContext';
import {
  getLoginLock,
  setLoginLock,
  resetLoginLock,
} from '@/lib/adminData';
import { emailSchema } from '@/lib/validations';
import { sanitizeEmail } from '@/lib/security';
import { logger } from '@/lib/logger';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 30;

export function AdminLogin() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [shaking, setShaking] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
    document.title = t('لوحة تحكم المشرفين — ثروة كابيتال', 'Admin Panel — Tharwah Capital');
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow, noarchive';
    document.head.appendChild(metaRobots);

    const metaCSP = document.createElement('meta');
    metaCSP.httpEquiv = 'Content-Security-Policy';
    metaCSP.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:;";
    document.head.appendChild(metaCSP);

    const metaViewport = document.querySelector('meta[name="viewport"]');
    const prevViewport = metaViewport?.getAttribute('content') || '';
    metaViewport?.setAttribute('content', 'width=1280');

    logger.info('Admin login page loaded', { lang });

    return () => {
      try {
        document.head.removeChild(metaRobots);
        document.head.removeChild(metaCSP);
      } catch {}
      if (metaViewport) metaViewport.setAttribute('content', prevViewport || 'width=device-width, initial-scale=1.0');
    };
  }, [t, lang]);

  useEffect(() => {
    if (!lockedUntil) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const isLocked = !!lockedUntil && lockedUntil > now;
  const lockMinsLeft = isLocked ? Math.max(1, Math.ceil((lockedUntil! - now) / 60000)) : 0;

  const triggerShake = () => {
    setShaking(false);
    requestAnimationFrame(() => setShaking(true));
    setTimeout(() => setShaking(false), 550);
  };

  const failAttempt = (mail: string, message: string) => {
    const lock = getLoginLock(mail);
    const attempts = lock.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      const until = Date.now() + LOCK_MINUTES * 60000;
      setLoginLock(mail, { attempts, lockedUntil: until });
      setLockedUntil(until);
      setError(t(
        'تم قفل الحساب بسبب محاولات متعددة — حاول بعد 30 دقيقة',
        'Account locked due to multiple attempts — try again in 30 minutes'
      ));
      setAttemptsLeft(0);
      logger.warn('Account locked due to failed attempts', { email: mail, attempts });
    } else {
      setLoginLock(mail, { attempts, lockedUntil: null });
      setAttemptsLeft(MAX_ATTEMPTS - attempts);
      setError(message);
    }
    recordLoginAttempt(mail, false);
    triggerShake();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const emailValidation = emailSchema.safeParse(email.trim());
    if (!emailValidation.success) {
      setError(t('بريد إلكتروني غير صالح', 'Invalid email address'));
      triggerShake();
      return;
    }

    if (!password || password.length < 1) {
      setError(t('كلمة المرور مطلوبة', 'Password is required'));
      triggerShake();
      return;
    }

    const mail = sanitizeEmail(email.trim());

    const rateLimit = checkLoginRateLimit(mail);
    if (!rateLimit.allowed) {
      setLockedUntil(Date.now() + (rateLimit.remainingTime || 30) * 60000);
      setError(t(
        `الحساب مقفل مؤقتاً — حاول بعد ${rateLimit.remainingTime} دقيقة`,
        `Account temporarily locked — try again in ${rateLimit.remainingTime} minutes`
      ));
      triggerShake();
      return;
    }

    const lock = getLoginLock(mail);
    if (lock.lockedUntil && lock.lockedUntil > Date.now()) {
      setLockedUntil(lock.lockedUntil);
      setError(t('الحساب مقفل مؤقتاً — حاول لاحقاً', 'Account temporarily locked — try later'));
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.adminLogin(mail, password);

      if (response.user && response.token) {
        setAuthTokens(response.token, response.refreshToken);
        const role = response.user.role as 'super' | 'sub' | 'admin';
        const permissions = Array.isArray(response.user.permissions) ? response.user.permissions : [];
        const session = await createAdminSession(mail, response.user.name, role, permissions);
        saveAdminSession(session);
        resetLoginLock(mail);
        recordLoginAttempt(mail, true);
        logger.audit(mail, `${role}_admin_login_success`);
        navigate({ to: '/Akadmin/overview' });
        return;
      }

      throw new Error(t('فشل تسجيل الدخول', 'Login failed'));
    } catch (err: any) {
      const message = err instanceof Error ? err.message : t('حدث خطأ غير متوقع', 'Unexpected error');
      setLoading(false);
      failAttempt(mail, message);
      logger.warn('Admin login failed', { email: mail, error: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center px-5 relative overflow-hidden"
      style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #EFF6FF, #F0F9FF)' }}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(14,165,233,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: '20%', insetInlineEnd: '20%', width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(14,165,233,0.12), transparent 70%)',
          filter: 'blur(80px)', animation: 'adminFloat 6s ease-in-out infinite',
        }}
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full bg-white border border-[#E2E8F0] overflow-hidden"
        style={{
          maxWidth: 460,
          borderRadius: 24,
          boxShadow: '0 4px 32px rgba(14,165,233,0.12), 0 1px 4px rgba(0,0,0,0.06)',
          animation: shaking ? 'adminShake 0.5s' : 'adminCardIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        noValidate
      >
        <div style={{ height: 2, background: 'linear-gradient(to left, transparent, #C9A84C, #E8C96A, #C9A84C, transparent)' }} />

        <div className="px-8 pt-8 pb-4 text-center">
          <div
            className="mx-auto flex items-center justify-center"
            style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(14,165,233,0.05))',
              border: '2px solid rgba(14,165,233,0.3)',
              boxShadow: '0 4px 16px rgba(14,165,233,0.2)',
            }}
          >
            <span style={{ fontSize: 28 }}>🔰</span>
          </div>
          <h1 className="font-black text-[#1E293B] mt-4" style={{ fontSize: 20 }}>
            {t('لوحة تحكم المشرفين', 'Admin Control Panel')}
          </h1>
          <p className="text-[#64748B] mt-2" style={{ fontSize: 13 }}>
            {t('منطقة مقيدة — للمشرفين المعتمدين فقط', 'Restricted Area — Authorized Admins Only')}
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D97E]/10 border border-[#00D97E]/20">
            <div className="w-2 h-2 rounded-full bg-[#00D97E] animate-pulse" />
            <span className="text-[10px] font-bold text-[#00D97E]">BACKEND JWT • Encrypted</span>
          </div>
        </div>

        <div className="px-6 py-5">
          {error && (
            <div
              className="flex items-center gap-2 rounded-lg mb-5"
              style={{ background: 'rgba(255,69,96,0.1)', border: '1px solid rgba(255,69,96,0.3)', padding: '12px 16px' }}
              role="alert"
            >
              {isLocked ? <ShieldAlert className="w-4 h-4 shrink-0" color="#FF4560" /> : <AlertTriangle className="w-4 h-4 shrink-0" color="#FF4560" />}
              <span className="font-semibold" style={{ fontSize: 13, color: '#FF4560' }}>
                {error}
              </span>
            </div>
          )}

          {!isLocked && attemptsLeft !== null && attemptsLeft > 0 && (
            <div
              className="flex items-center gap-2 rounded-md mb-4"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', padding: 12 }}
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" color="#F59E0B" />
              <span className="font-semibold" style={{ fontSize: 12, color: '#9A6600' }}>
                {t(`تحذير: باقي ${attemptsLeft} محاولات قبل القفل المؤقت لمدة 30 دقيقة`, `Warning: ${attemptsLeft} attempts remaining before 30-minute temporary lock`)}
              </span>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="adm-email" className="block font-semibold text-[#64748B] mb-1.5" style={{ fontSize: 12 }}>
              📧 {t('البريد الإلكتروني', 'Email Address')}
            </label>
            <div className="relative">
              <input
                ref={emailRef}
                id="adm-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-md text-[#1E293B] outline-none transition-colors focus:border-[#0EA5E9] peer"
                style={{ padding: '12px 40px 12px 16px', fontSize: 14 }}
                maxLength={254}
              />
              <Mail
                className="absolute top-1/2 -translate-y-1/2 pointer-events-none transition-colors peer-focus:!text-[#0EA5E9]"
                style={{ insetInlineEnd: 14, width: 16, height: 16, color: '#64748B' }}
              />
            </div>
          </div>

          <div className="mb-5">
            <label htmlFor="adm-pw" className="block font-semibold text-[#64748B] mb-1.5" style={{ fontSize: 12 }}>
              🔒 {t('كلمة المرور', 'Password')}
            </label>
            <div className="relative">
              <input
                id="adm-pw"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-md text-[#1E293B] outline-none transition-colors focus:border-[#0EA5E9]"
                style={{ padding: '12px 40px 12px 40px', fontSize: 14 }}
                maxLength={128}
              />
              <Lock style={{ position: 'absolute', insetInlineEnd: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#64748B', pointerEvents: 'none' }} />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                aria-label={t('إظهار/إخفاء كلمة المرور', 'Show/hide password')}
                className="absolute top-1/2 -translate-y-1/2 transition-colors hover:text-[#0EA5E9]"
                style={{ insetInlineStart: 12, color: '#64748B' }}
              >
                {showPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </div>

          {isLocked ? (
            <div
              className="w-full flex items-center justify-center gap-2 rounded-lg font-semibold cursor-not-allowed"
              style={{ background: '#F1F5F9', border: '1px solid rgba(255,69,96,0.3)', padding: '14px 0', color: '#FF4560', fontSize: 13 }}
            >
              <Lock style={{ width: 14, height: 14 }} />
              🔒 {t(`الحساب مقفل — انتظر ${lockMinsLeft} دقيقة`, `Account locked — wait ${lockMinsLeft} min`)}
            </div>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg text-white font-black transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-wait disabled:hover:translate-y-0"
              style={{
                background: 'linear-gradient(135deg, #0EA5E9, #38BDF8)',
                boxShadow: '0 4px 16px rgba(14,165,233,0.35)',
                padding: '15px 0', fontSize: 15,
              }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ⏳ {t('جاري التحقق...', 'Verifying...')}
                </>
              ) : (
                <>🔐 {t('دخول للوحة التحكم', 'Enter Admin Panel')}</>
              )}
            </button>
          )}
        </div>

        <div className="px-4 py-5 border-t border-[#E2E8F0]">
          <div
            className="flex items-center gap-2 rounded-lg"
            style={{ background: 'rgba(255,180,0,0.06)', border: '1px solid rgba(255,180,0,0.2)', padding: '12px 16px' }}
          >
            <Shield style={{ width: 14, height: 14, color: 'rgba(202,138,4,0.9)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'rgba(180,120,0,0.95)' }}>
              {t('هذه منطقة محمية — كل محاولات الوصول غير المصرح به مُراقبة ومُسجَّلة', 'This is a protected area — all unauthorized access attempts are monitored and logged')}
            </span>
          </div>
          <p className="text-center text-[#64748B] mt-4" style={{ fontSize: 12 }}>
            {t('نسيت كلمة المرور؟ تواصل مع المشرف الرئيسي', 'Forgot password? Contact the super admin')}
          </p>
        </div>
      </form>

      <style>{`
        @keyframes adminFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-18px); } }
        @keyframes adminCardIn { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes adminShake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(5px); } }
      `}</style>
    </div>
  );
}
