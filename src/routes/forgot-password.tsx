import { createFileRoute, Link } from '@tanstack/react-router';
import { useLang } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Mail, User, MessageSquare, Send, ArrowLeft, ArrowRight, Shield, AlertTriangle, CheckCircle2, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { emailSchema } from '@/lib/validations';
import { sanitizeEmail } from '@/lib/security';

export const Route = createFileRoute('/forgot-password')({ component: ForgotPasswordPage });

function ForgotPasswordPage() {
  const { t, lang } = useLang();
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setState('error');
      setError(t('الاسم الكامل مطلوب', 'Full name is required'));
      return;
    }

    const validation = emailSchema.safeParse(form.email);
    if (!validation.success) {
      setState('error');
      setError(t('بريد إلكتروني غير صالح', 'Invalid email address'));
      return;
    }

    setState('loading');

    try {
      await api.submitContact({
        name: form.name,
        email: sanitizeEmail(form.email),
        subject: 'نسيان كلمة المرور',
        message: `طلب استعادة كلمة المرور\n\nالاسم: ${form.name}\nالبريد: ${form.email}\n\nرسالة العميل:\n${form.message || 'لا توجد رسالة إضافية'}`,
      });
      setState('success');
    } catch (err: any) {
      setState('error');
      setError(err?.message || t('تعذر إرسال الطلب — حاول مرة أخرى', 'Failed to submit request — please try again'));
    }
  };

  return (
    <div className="min-h-screen bg-secondary dark:bg-[#13132A] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold-deep/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[480px] relative z-10">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-gold-deep transition-colors mb-6">
          {lang === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {t('العودة لتسجيل الدخول', 'Back to Login')}
        </Link>

        <Card className="p-8 md:p-10 shadow-xl border-border-gold/30">
          <div className="text-center mb-8">
            <div className="w-14 h-14 gradient-gold rounded-xl mx-auto flex items-center justify-center shadow-gold-sm mb-4">
              <KeyRound className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-black text-2xl text-text-primary mb-2">{t('استعادة كلمة المرور', 'Password Recovery')}</h1>
            <p className="text-sm text-text-muted">
              {t('أرسل طلباً لفريق الدعم وسنتواصل معك لاستعادة الوصول لحسابك', 'Send a request to our support team and we will help you regain access')}
            </p>
          </div>

          {state === 'success' ? (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[#F0FDF4] border border-[#00D97E]/20 text-[#065F46]">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="text-sm font-bold leading-relaxed">
                  {t('تم إرسال طلبك بنجاح — سيتواصل معك فريق الدعم خلال 24 ساعة', 'Your request was sent successfully — our support team will contact you within 24 hours')}
                </span>
              </div>
              <Link to="/login" className="block">
                <Button className="w-full py-3.5 gap-2 text-base">
                  {lang === 'ar' ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                  {t('العودة لتسجيل الدخول', 'Back to Login')}
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {state === 'error' && error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#FEF0EC] border border-[#FF4560]/20 text-[#FF4560] text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-text-secondary block">{t('الاسم الكامل', 'Full Name')}</label>
                <div className="relative">
                  <User className="absolute rtl:right-4 ltr:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder={t('الاسم كما هو مسجل لدينا', 'Name as registered with us')}
                    maxLength={100}
                    disabled={state === 'loading'}
                    className="w-full bg-secondary border border-border-default rounded-md py-3 rtl:pr-12 rtl:pl-4 ltr:pl-12 ltr:pr-4 focus:border-gold-primary focus:shadow-[0_0_0_3px_var(--color-gold-subtle)] outline-none transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-text-secondary block">{t('البريد الإلكتروني المسجل', 'Registered Email')}</label>
                <div className="relative">
                  <Mail className="absolute rtl:right-4 ltr:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="ahmed@example.com"
                    maxLength={254}
                    disabled={state === 'loading'}
                    className="w-full bg-secondary border border-border-default rounded-md py-3 rtl:pr-12 rtl:pl-4 ltr:pl-12 ltr:pr-4 focus:border-gold-primary focus:shadow-[0_0_0_3px_var(--color-gold-subtle)] outline-none transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-text-secondary block">
                  {t('رسالة إضافية', 'Additional Message')} <span className="text-text-muted font-normal">({t('اختياري', 'optional')})</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute rtl:right-4 ltr:left-4 top-4 w-5 h-5 text-text-muted" />
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    placeholder={t('مثلاً: رقم حسابي هو TH-XXXXXXX', 'e.g. My account number is TH-XXXXXXX')}
                    maxLength={2000}
                    disabled={state === 'loading'}
                    className="w-full bg-secondary border border-border-default rounded-md py-3 rtl:pr-12 rtl:pl-4 ltr:pl-12 ltr:pr-4 focus:border-gold-primary focus:shadow-[0_0_0_3px_var(--color-gold-subtle)] outline-none transition-all resize-none disabled:opacity-60"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full py-3.5 gap-2 text-base mt-2" isLoading={state === 'loading'}>
                <Send className="w-5 h-5" /> {t('إرسال الطلب', 'Send Request')}
              </Button>
            </form>
          )}

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-[1px] bg-border-light" />
            <span className="text-[12px] text-text-muted">{t('أو', 'OR')}</span>
            <div className="flex-1 h-[1px] bg-border-light" />
          </div>

          <Link
            to="/contact"
            className="w-full bg-secondary border border-border-default rounded-md py-3 flex items-center justify-center gap-2 hover:border-gold-primary hover:text-gold-deep transition-colors text-sm font-semibold text-text-secondary"
          >
            <MessageSquare className="w-4 h-4" /> {t('التواصل مع خدمة العملاء', 'Contact Customer Support')}
          </Link>
        </Card>

        <div className="mt-6 bg-tertiary dark:bg-primary border border-border-light rounded-xl p-4 flex flex-col items-center justify-center gap-3 shadow-sm">
          <div className="flex items-center gap-2 text-[12px] text-text-muted">
            <Shield className="w-4 h-4 text-success" /> {t('اتصال آمن ومشفر بتقنية TLS 1.3', 'Secure encrypted connection with TLS 1.3')}
          </div>
          <div className="flex items-center gap-6 text-[11px] text-text-muted">
            <div className="flex items-center gap-1">🔒 {t('SSL محمي', 'SSL Protected')}</div>
            <div className="flex items-center gap-1">🛡️ {t('لا نطلب كلمة المرور أبداً', 'We never ask for your password')}</div>
          </div>
        </div>

        <div className="mt-8 text-center text-[13px] text-text-muted">
          {t('تذكرت كلمة المرور؟', 'Remembered your password?')}{' '}
          <Link to="/login" className="font-bold text-gold-deep hover:underline">{t('سجّل الدخول', 'Sign in')}</Link>
        </div>
      </div>
    </div>
  );
}
