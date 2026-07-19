import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useLang } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft, ArrowRight, Shield, Hash } from 'lucide-react';
import { useState } from 'react';
import { saveClientSession } from '@/lib/auth';

export const Route = createFileRoute('/login')({ component: LoginPage });

function LoginPage() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'account'>('email');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      saveClientSession({ id: '123', name: 'أحمد الغامدي', email: 'ahmed@example.com' });
      navigate({ to: '/dashboard' });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-secondary dark:bg-[#13132A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold-deep/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[480px] relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-gold-deep transition-colors mb-6 mx-auto w-max">
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
            {loginMethod === 'email' ? (
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-text-secondary block">{t('البريد الإلكتروني', 'Email Address')}</label>
                <div className="relative">
                  <Mail className="absolute rtl:right-4 ltr:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input required type="email" className="w-full bg-secondary border border-border-default rounded-md py-3 rtl:pr-12 rtl:pl-4 ltr:pl-12 ltr:pr-4 focus:border-gold-primary focus:shadow-[0_0_0_3px_var(--color-gold-subtle)] outline-none transition-all" />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 animate-in fade-in">
                <label className="text-[13px] font-bold text-text-secondary block">{t('رقم الحساب', 'Account Number')}</label>
                <div className="relative">
                  <Hash className="absolute rtl:right-4 ltr:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input required type="text" className="w-full bg-secondary border border-border-default rounded-md py-3 rtl:pr-12 rtl:pl-4 ltr:pl-12 ltr:pr-4 focus:border-gold-primary focus:shadow-[0_0_0_3px_var(--color-gold-subtle)] outline-none transition-all font-mono" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-bold text-text-secondary">{t('كلمة المرور', 'Password')}</label>
                <button type="button" className="text-[12px] font-semibold text-gold-deep hover:text-gold-dark hover:underline">{t('نسيت كلمة المرور؟', 'Forgot Password?')}</button>
              </div>
              <div className="relative">
                <Lock className="absolute rtl:right-4 ltr:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input required type={showPassword ? "text" : "password"} className="w-full bg-secondary border border-border-default rounded-md py-3 rtl:pr-12 rtl:pl-12 ltr:pl-12 ltr:pr-12 focus:border-gold-primary focus:shadow-[0_0_0_3px_var(--color-gold-subtle)] outline-none transition-all font-mono" />
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
            <div className="flex items-center gap-1">🛡️ {t('2FA متاح', '2FA Available')}</div>
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
