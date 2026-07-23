// ─────────────────────────────────────────────────────────────
// 4.13 — Settings إعدادات المنصة العامة
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Globe2, Shield } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { usePlatformSettings, addAuditEntry } from '@/lib/adminData';
import {
  PageHeader, Panel, PanelHeader, Field, TextInput, SelectBox,
  PrimaryBtn, Toggle, useToast, Pill,
} from '@/components/admin/ui';

export function SettingsPage() {
  const { t, lang } = useLang();
  const [settings, setSettings] = usePlatformSettings();
  const [draft, setDraft] = useState(settings);
  const { show, ToastView } = useToast();

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  const save = () => {
    setSettings(draft);
    addAuditEntry('admin@tharwah.com', 'تحديث إعدادات المنصة العامة', 'Updated platform settings');
    show(t('تم حفظ إعدادات المنصة العامة', 'Platform settings saved'));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('إعدادات المنصة العامة', 'Platform Settings')}
        subtitle={t('تغيير هوية المنصة وأوقات العملات ونسب النمو الافتراضية وسياسات التسجيل', 'Change platform identity, currencies, default rates and signup policies')}
        actions={
          <>
            {dirty && <Pill text={t('تغييرات غير محفوظة', 'Unsaved changes')} color="#F59E0B" dot />}
            <PrimaryBtn icon={Save} onClick={save} disabled={!dirty}>{t('حفظ كل التغييرات', 'Save All Changes')}</PrimaryBtn>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* الهوية والتواصل */}
        <Panel>
          <PanelHeader icon={Globe2} iconColor="#0EA5E9" title={t('هوية المنصة والتواصل', 'Platform Identity & Contact')} />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Field label={t('اسم الموقع (عربي)', 'Site Name (Arabic)')}>
              <TextInput value={draft.siteName} onChange={e => setDraft({ ...draft, siteName: e.target.value })} />
            </Field>
            <Field label={t('اسم الموقع (إنجليزي)', 'Site Name (English)')}>
              <TextInput value={draft.siteNameEn} onChange={e => setDraft({ ...draft, siteNameEn: e.target.value })} dir="ltr" />
            </Field>
            <Field label={t('رقم الدعم الموحد', 'Support Hotline')}>
              <TextInput value={draft.supportPhone} onChange={e => setDraft({ ...draft, supportPhone: e.target.value })} dir="ltr" />
            </Field>
            <Field label={t('بريد الدعم', 'Support Email')}>
              <TextInput type="email" value={draft.supportEmail} onChange={e => setDraft({ ...draft, supportEmail: e.target.value })} dir="ltr" />
            </Field>
            <Field label={t('العملة الافتراضية', 'Default Currency')}>
              <SelectBox value={draft.defaultCurrency} onChange={e => setDraft({ ...draft, defaultCurrency: e.target.value })}
                options={[{ value: 'SAR', label: t('ريال سعودي (SAR)', 'Saudi Riyal (SAR)') }, { value: 'USD', label: t('دولار أمريكي (USD)', 'US Dollar (USD)') }, { value: 'AED', label: t('درهم إماراتي (AED)', 'UAE Dirham (AED)') }]} />
            </Field>
            <Field label={t('اللغة الافتراضية', 'Default Language')}>
              <SelectBox value={draft.defaultLanguage} onChange={e => setDraft({ ...draft, defaultLanguage: e.target.value as 'ar' | 'en' })}
                options={[{ value: 'ar', label: t('العربية', 'Arabic') }, { value: 'en', label: t('الإنجليزية', 'English') }]} />
            </Field>
            <Field label={t('مهلة الجلسة (ساعات)', 'Session Timeout (hours)')}>
              <TextInput type="number" min={1} max={24} value={draft.sessionTimeout} onChange={e => setDraft({ ...draft, sessionTimeout: Number(e.target.value) })} dir="ltr" />
            </Field>
          </div>
        </Panel>

        {/* التشغيل والسياسات */}
        <Panel>
          <PanelHeader icon={SettingsIcon} iconColor="#C9A84C" title={t('سياسات التشغيل', 'Operating Policies')} />
          <div className="space-y-3.5 mt-4">
            {[
              {
                key: 'registrationOpen' as const, icon: '📝',
                title: t('فتح التسجيل للعملاء الجدد', 'Open client registration'),
                desc: t('السماح للزوار بإنشاء حسابات استثمارية جديدة', 'Allow visitors to create new investment accounts'),
              },
              {
                key: 'maintenanceMode' as const, icon: '🚧',
                title: t('وضع الصيانة', 'Maintenance mode'),
                desc: t('إيقاف الموقع العام مؤقتاً مع صفحة صيانة رسمية', 'Temporarily pause the public site with an official maintenance page'),
                danger: true,
              },
              {
                key: 'twoFactorRequired' as const, icon: '🔑',
                title: t('إلزام المصادقة الثنائية', 'Enforce 2FA'),
                desc: t('لجميع حسابات المشرفين والعملاء من فئة VIP', 'For all admin accounts and VIP clients'),
              },
              {
                key: 'weeklyDigest' as const, icon: '📧',
                title: t('الملخص الأسبوعي للعملاء', 'Weekly client digest'),
                desc: t('بريد أسبوعي بأداء المحفظة كل أحد صباحاً', 'Weekly portfolio performance email every Sunday morning'),
              },
              {
                key: 'instantAlerts' as const, icon: '⚡',
                title: t('تنبيهات العمليات الفورية', 'Instant transaction alerts'),
                desc: t('إشعار فوري عند أي إيداع أو سحب جديد', 'Instant alert on every new deposit or withdrawal'),
              },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between rounded-lg border border-[#E2E8F0] dark:border-border-default p-3 gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-text-primary">{item.icon} {item.title}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">{item.desc}</div>
                </div>
                <Toggle
                  checked={draft[item.key] as boolean}
                  onChange={v => setDraft({ ...draft, [item.key]: v })}
                />
              </div>
            ))}
          </div>

          {draft.maintenanceMode && (
            <div className="mt-4 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(255,69,96,0.06)', border: '1px solid rgba(255,69,96,0.2)' }}>
              <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#FF4560' }} />
              <p className="text-[11px] leading-relaxed" style={{ color: '#C0392B' }}>
                {t('تحذير: وضع الصيانة سيمنع وصول العملاء والزوار للموقع بعد الحفظ حتى إلغائه.', 'Warning: maintenance mode will block client and visitor access once saved until disabled.')}
              </p>
            </div>
          )}
        </Panel>
      </div>

      {/* معلومات البيئة */}
      <Panel>
        <PanelHeader icon={Shield} iconColor="#00D97E" title={t('معلومات البيئة والنظام', 'Environment & System Info')} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {[
            { label: t('إصدار المنصة', 'Platform Version'), value: 'v3.2.1', mono: true },
            { label: t('قاعدة البيانات', 'Database'), value: 'PostgreSQL', mono: true },
            { label: t('آخر نسخة احتياطية', 'Last Backup'), value: t('اليوم 03:00', 'Today 03:00'), mono: false },
            { label: t('حالة التخزين', 'Storage Status'), value: t('42% مستخدم', '42% used'), mono: false },
          ].map((x, i) => (
            <div key={i} className="rounded-lg border border-[#E2E8F0] dark:border-border-default p-3">
              <div className="text-[10px] text-text-muted">{x.label}</div>
              <div className={`text-sm font-bold text-text-primary mt-1 ${x.mono ? 'font-mono' : ''}`}>{x.value}</div>
            </div>
          ))}
        </div>
      </Panel>
      {ToastView}
    </div>
  );
}
