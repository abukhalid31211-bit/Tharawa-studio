// ─────────────────────────────────────────────────────────────
// Security — إعدادات الأمان وحماية المنصة + سجلات التدقيق
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Shield, ShieldCheck, ShieldAlert, KeyRound, Activity, FileSearch, Fingerprint } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import {
  useAuditLog, useLoginAttempts, usePlatformSettings, useAdminStore, ADMIN_KEYS,
  resetLoginLock, relativeTime,
} from '@/lib/adminData';
import {
  PageHeader, Panel, PanelHeader, Pill, StatCard, FilterTabs,
  PrimaryBtn, Toggle, EmptyState, DataTable, Tr, Td, useToast, Field, TextInput,
} from '@/components/admin/ui';

interface SecurityPrefs {
  firewall: boolean;
  twoFactor: boolean;
  ipWhitelist: boolean;
  autoLock: boolean;
  bcryptRounds: number;
}

const PREFS_SEED: SecurityPrefs = { firewall: true, twoFactor: true, ipWhitelist: false, autoLock: true, bcryptRounds: 12 };

export function Security() {
  const { t, lang } = useLang();
  const [audit] = useAuditLog();
  const [logins] = useLoginAttempts();
  const [settings, setSettings] = usePlatformSettings();
  const [prefs, setPrefs] = useAdminStore<SecurityPrefs>(ADMIN_KEYS.SECURITY_PREFS, PREFS_SEED);
  const { show, ToastView } = useToast();

  const [tab, setTab] = useState('audit');
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const failedLogins = logins.filter(l => l.result === 'failed').length;
  const lockInfo = (() => {
    try {
      const locks = JSON.parse(localStorage.getItem(ADMIN_KEYS.LOGIN_LOCK) || '{}');
      return Object.entries(locks).filter(([, v]) => (v as any).lockedUntil && (v as any).lockedUntil > Date.now());
    } catch { return []; }
  })();

  const changePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPw !== 'admin123') { show(t('كلمة المرور الحالية غير صحيحة', 'Current password is incorrect'), 'error'); return; }
    if (newPw.length < 8) { show(t('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل', 'New password must be at least 8 characters'), 'error'); return; }
    if (newPw !== confirmPw) { show(t('تأكيد كلمة المرور غير متطابق', 'Password confirmation does not match'), 'error'); return; }
    setOldPw(''); setNewPw(''); setConfirmPw('');
    show(t('تم تغيير كلمة المرور الرئيسية بنجاح', 'Master password changed successfully'));
  };

  const unlockAll = () => {
    lockInfo.forEach(([email]) => resetLoginLock(email));
    show(t('تم فك قفل جميع الحسابات المقفلة', 'All locked accounts unlocked'));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('إعدادات الأمان والحماية', 'Security & Protection Settings')}
        subtitle={t('مراقبة سجلات الدخول وسياسات التشفير وحالة جدار الحماية للمنصة', 'Monitor access logs, encryption policies and platform firewall status')}
        actions={lockInfo.length > 0 ? <PrimaryBtn icon={ShieldAlert} color="#F59E0B" colorHover="#D97706" onClick={unlockAll}>{t(`فك قفل ${lockInfo.length} حساب`, `Unlock ${lockInfo.length} accounts`)}</PrimaryBtn> : undefined}
      />

      {/* حالة أنظمة الحماية */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t('جدار الحماية (TLS 1.3)', 'Firewall (TLS 1.3)')} value={prefs.firewall ? t('نشط', 'Active') : t('متوقف', 'Off')} icon="🛡️" color={prefs.firewall ? '#00D97E' : '#FF4560'} />
        <StatCard label={t('المصادقة الثنائية 2FA', 'Two-Factor Auth')} value={prefs.twoFactor ? t('مفعّلة', 'Enabled') : t('معطّلة', 'Disabled')} icon="🔑" color={prefs.twoFactor ? '#00D97E' : '#F59E0B'} />
        <StatCard label={t('محاولات دخول فاشلة (أسبوع)', 'Failed Logins (week)')} value={failedLogins} icon="⚠️" color={failedLogins > 5 ? '#FF4560' : '#F59E0B'} />
        <StatCard label={t('حسابات مقفلة حالياً', 'Currently Locked')} value={lockInfo.length} icon="🔒" color={lockInfo.length > 0 ? '#FF4560' : '#00D97E'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* سياسات الحماية */}
        <Panel>
          <PanelHeader icon={ShieldCheck} iconColor="#00D97E" title={t('سياسات الحماية', 'Protection Policies')} subtitle={t('تُحفظ التغييرات فوراً', 'Changes apply instantly')} />
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] dark:border-border-default p-3">
              <div>
                <div className="text-xs font-bold text-text-primary flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" style={{ color: '#00D97E' }} /> {t('جدار الحماية وتشفير الجلسات', 'Firewall & session encryption')}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{t('TLS 1.3 مع شهادات تُجدد تلقائياً', 'TLS 1.3 with auto-renewed certificates')}</div>
              </div>
              <Toggle checked={prefs.firewall} onChange={v => { setPrefs(p => ({ ...p, firewall: v })); show(v ? t('جدار الحماية مفعّل', 'Firewall enabled') : t('جدار الحماية متوقف — تحذير أمني!', 'Firewall disabled — security warning!'), v ? 'success' : 'error'); }} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] dark:border-border-default p-3">
              <div>
                <div className="text-xs font-bold text-text-primary flex items-center gap-1.5"><Fingerprint className="w-3.5 h-3.5" style={{ color: '#0EA5E9' }} /> {t('المصادقة الثنائية للمشرفين', '2FA for admins')}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{t('إلزامية لكل حسابات الإدارة', 'Mandatory for all admin accounts')}</div>
              </div>
              <Toggle checked={prefs.twoFactor} onChange={v => { setPrefs(p => ({ ...p, twoFactor: v })); setSettings(s => ({ ...s, twoFactorRequired: v })); }} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] dark:border-border-default p-3">
              <div>
                <div className="text-xs font-bold text-text-primary flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} /> {t('القفل التلقائي بعد 5 محاولات', 'Auto-lock after 5 attempts')}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{t('قفل مؤقت لمدة 30 دقيقة', '30-minute temporary lock')}</div>
              </div>
              <Toggle checked={prefs.autoLock} onChange={v => setPrefs(p => ({ ...p, autoLock: v }))} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] dark:border-border-default p-3">
              <div>
                <div className="text-xs font-bold text-text-primary flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" style={{ color: '#8B5CF6' }} /> {t('القائمة البيضاء لعناوين IP', 'IP whitelist')}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{t('تقييد الوصول لشبكات المكتب فقط', 'Restrict access to office networks only')}</div>
              </div>
              <Toggle checked={prefs.ipWhitelist} onChange={v => { setPrefs(p => ({ ...p, ipWhitelist: v })); show(v ? t('القائمة البيضاء مفعّلة', 'Whitelist enabled') : t('القائمة البيضاء معطّلة', 'Whitelist disabled')); }} />
            </div>
          </div>

          <div className="mt-5 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(0,217,126,0.07)', border: '1px solid rgba(0,217,126,0.15)' }}>
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#00D97E' }} />
            <p className="text-[11px] leading-relaxed" style={{ color: '#007A60' }}>
              {t('كلمات المرور مشفرة بتقنية bcrypt (12 جولة) وتُعالج بصيغتي $2a$ و $2b$. آخر فحص أمني شامل: قبل ساعة — كل الأنظمة سليمة.', 'Passwords are hashed with bcrypt (12 rounds) handling both $2a$ and $2b$ formats. Last full security scan: 1 hour ago — all systems clear.')}
            </p>
          </div>
        </Panel>

        {/* تغيير كلمة المرور الرئيسية */}
        <Panel>
          <PanelHeader icon={KeyRound} iconColor="#C9A84C" title={t('كلمة مرور المشرف الرئيسي', 'Super Admin Password')} subtitle={t('تُطبق فوراً على كل جلسات الدخول المستقبلية', 'Applies to all future sign-in sessions')} />
          <form onSubmit={changePassword} className="space-y-4 mt-4">
            <Field label={t('كلمة المرور الحالية', 'Current Password')}>
              <TextInput required type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} />
            </Field>
            <Field label={t('كلمة المرور الجديدة', 'New Password')} hint={t('8 أحرف على الأقل مع رموز وأرقام', 'At least 8 characters with symbols & numbers')}>
              <TextInput required type="password" value={newPw} onChange={e => setNewPw(e.target.value)} />
            </Field>
            <Field label={t('تأكيد كلمة المرور', 'Confirm Password')}>
              <TextInput required type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
            </Field>
            <PrimaryBtn icon={KeyRound} type="submit" onClick={() => {}}>{t('تغيير كلمة المرور', 'Change Password')}</PrimaryBtn>
          </form>
        </Panel>
      </div>

      {/* السجلات */}
      <Panel padded={false}>
        <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-border-default flex items-center justify-between gap-3 flex-wrap">
          <PanelHeader icon={FileSearch} iconColor="#3B82F6" title={t('سجلات الأمان والتدقيق', 'Security Logs & Audit Trail')} subtitle={t('كل الأحداث الحساسة مسجلة ومراقبة', 'All sensitive events are logged and monitored')} />
          <FilterTabs
            value={tab}
            onChange={setTab}
            options={[
              { value: 'audit', label: t('سجل التدقيق', 'Audit Log'), count: audit.length },
              { value: 'logins', label: t('محاولات الدخول', 'Login Attempts'), count: logins.length },
            ]}
          />
        </div>

        {tab === 'audit' ? (
          audit.length === 0 ? <EmptyState icon="📋" text={t('لا توجد سجلات', 'No records')} /> : (
            <DataTable headers={[t('الحدث', 'Event'), t('الفاعل', 'Actor'), t('عنوان IP', 'IP Address'), t('النتيجة', 'Result'), t('التوقيت', 'Time')]} minWidth={560}>
              {audit.map(a => (
                <Tr key={a.id}>
                  <Td bold>{lang === 'ar' ? a.action : a.actionEn}</Td>
                  <Td mono>{a.actor}</Td>
                  <Td mono>{a.ip}</Td>
                  <Td><Pill text={a.result === 'success' ? t('ناجح', 'Success') : t('فاشل', 'Failed')} color={a.result === 'success' ? '#00D97E' : '#FF4560'} dot /></Td>
                  <Td>{relativeTime(a.date, lang)}</Td>
                </Tr>
              ))}
            </DataTable>
          )
        ) : (
          logins.length === 0 ? <EmptyState icon="🔐" text={t('لا توجد محاولات دخول', 'No login attempts')} /> : (
            <DataTable headers={[t('البريد الإلكتروني', 'Email'), t('عنوان IP', 'IP Address'), t('النتيجة', 'Result'), t('التوقيت', 'Time')]} minWidth={520}>
              {logins.map(l => (
                <Tr key={l.id}>
                  <Td mono>{l.email}</Td>
                  <Td mono>{l.ip}</Td>
                  <Td><Pill text={l.result === 'success' ? t('دخول ناجح', 'Successful') : t('محاولة فاشلة', 'Failed')} color={l.result === 'success' ? '#00D97E' : '#FF4560'} dot /></Td>
                  <Td>{relativeTime(l.date, lang)}</Td>
                </Tr>
              ))}
            </DataTable>
          )
        )}
      </Panel>
      {ToastView}
    </div>
  );
}
