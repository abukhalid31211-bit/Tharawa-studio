// ─────────────────────────────────────────────────────────────
// CMS — SiteDesign إدارة تصميم الموقع والهوية البصرية والتنقل
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Palette, Save, RotateCcw, Megaphone, ToggleRight, Type } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCmsDesign, SITE_DESIGN_SEED, addAuditEntry } from '@/lib/adminData';
import {
  PageHeader, Panel, PanelHeader, Pill, Field, TextInput,
  PrimaryBtn, GhostBtn, Toggle, useToast,
} from '@/components/admin/ui';

const PALETTE_PRESETS = [
  { name: 'الأزرق السماوي الذهبي (افتراضي)', nameEn: 'Sky Blue & Gold (Default)', primary: '#0EA5E9', gold: '#C9A84C' },
  { name: 'الأخضر الزمردي', nameEn: 'Emerald Green', primary: '#10B981', gold: '#D4AF37' },
  { name: 'البنفسجي الملكي', nameEn: 'Royal Purple', primary: '#8B5CF6', gold: '#F59E0B' },
  { name: 'الأزرق الداكن الكلاسيكي', nameEn: 'Classic Navy', primary: '#1E3A8A', gold: '#C9A84C' },
  { name: 'الوردي العصري', nameEn: 'Modern Rose', primary: '#EC4899', gold: '#F97316' },
];

export function SiteDesign() {
  const { t, lang } = useLang();
  const [design, setDesign] = useCmsDesign();
  const [draft, setDraft] = useState(design);
  const { show, ToastView } = useToast();

  const dirty = JSON.stringify(draft) !== JSON.stringify(design);

  const save = () => {
    setDesign(draft);
    addAuditEntry('admin@tharwah.com', 'تحديث هوية الموقع البصرية', 'Updated site visual identity');
    show(t('تم تطبيق الهوية البصرية الجديدة على الموقع', 'New visual identity applied to site'));
  };

  const reset = () => { setDraft(SITE_DESIGN_SEED); show(t('تمت استعادة الهوية الافتراضية', 'Default identity restored')); };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('إدارة تصميم الموقع والهوية البصرية', 'Site Design & Visual Identity')}
        subtitle={t('الألوان والشعار وشريط الإعلانات وعناصر الواجهة للموقع العام', 'Colors, logo, announcement bar and UI elements of the public site')}
        actions={
          <>
            {dirty && <Pill text={t('تغييرات غير محفوظة', 'Unsaved changes')} color="#F59E0B" dot />}
            <GhostBtn icon={RotateCcw} onClick={reset}>{t('استعادة الافتراضي', 'Restore Default')}</GhostBtn>
            <PrimaryBtn icon={Save} onClick={save} disabled={!dirty}>{t('حفظ ونشر', 'Save & Publish')}</PrimaryBtn>
          </>
        }
      />

      {/* معاينة الهوية */}
      <Panel className="!p-0 overflow-hidden">
        <div className="px-5 py-3 flex items-center justify-between" style={{ background: draft.primaryColor }}>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-black" style={{ background: 'rgba(255,255,255,0.2)' }}>ث</span>
            <span className="text-white font-black text-sm">{lang === 'ar' ? draft.logoText : draft.logoTextEn}</span>
          </div>
          <div className="flex items-center gap-4 text-white/90 text-[11px] font-semibold">
            <span>{t('الرئيسية', 'Home')}</span><span>{t('الأسواق', 'Markets')}</span><span>{t('الخدمات', 'Services')}</span>
            <span className="px-2.5 py-1 rounded-md font-bold" style={{ background: draft.goldAccent }}>{t('ابدأ الآن', 'Start Now')}</span>
          </div>
        </div>
        {draft.showAnnouncementBar && (
          <div className="px-4 py-2 text-center text-[11px] font-semibold text-white" style={{ background: draft.goldAccent }}>
            {lang === 'ar' ? draft.announcement : draft.announcementEn}
          </div>
        )}
        <div className="px-5 py-2 text-[10px] text-text-muted border-t border-[#E2E8F0] dark:border-border-default">👁️ {t('معاينة حية لترويسة الموقع', 'Live preview of the site header')}</div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* الألوان */}
        <Panel>
          <PanelHeader icon={Palette} iconColor="#EC4899" title={t('ألوان الهوية', 'Identity Colors')} />
          <div className="space-y-3 mt-4">
            {PALETTE_PRESETS.map(p => {
              const active = draft.primaryColor === p.primary && draft.goldAccent === p.gold;
              return (
                <button
                  key={p.primary}
                  onClick={() => setDraft({ ...draft, primaryColor: p.primary, goldAccent: p.gold })}
                  className="w-full flex items-center gap-3 rounded-xl border-2 p-3 transition-all text-start"
                  style={{ borderColor: active ? p.primary : '#E2E8F0', background: active ? `${p.primary}08` : 'transparent' }}
                >
                  <span className="flex gap-1">
                    <span className="w-7 h-7 rounded-full border-2 border-white shadow" style={{ background: p.primary }} />
                    <span className="w-7 h-7 rounded-full border-2 border-white shadow -ms-2" style={{ background: p.gold }} />
                  </span>
                  <span className="flex-1 text-xs font-bold text-text-primary">{lang === 'ar' ? p.name : p.nameEn}</span>
                  {active && <Pill text={t('مفعلة', 'Active')} color={p.primary} dot />}
                </button>
              );
            })}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Field label={t('اللون الرئيسي (مخصص)', 'Primary (Custom)')}>
                <div className="flex items-center gap-2">
                  <input type="color" value={draft.primaryColor} onChange={e => setDraft({ ...draft, primaryColor: e.target.value })} className="w-9 h-9 rounded-lg cursor-pointer border border-[#E2E8F0]" />
                  <TextInput value={draft.primaryColor} onChange={e => setDraft({ ...draft, primaryColor: e.target.value })} dir="ltr" />
                </div>
              </Field>
              <Field label={t('اللون الذهبي (مخصص)', 'Gold Accent (Custom)')}>
                <div className="flex items-center gap-2">
                  <input type="color" value={draft.goldAccent} onChange={e => setDraft({ ...draft, goldAccent: e.target.value })} className="w-9 h-9 rounded-lg cursor-pointer border border-[#E2E8F0]" />
                  <TextInput value={draft.goldAccent} onChange={e => setDraft({ ...draft, goldAccent: e.target.value })} dir="ltr" />
                </div>
              </Field>
            </div>
          </div>
        </Panel>

        {/* الشعار والواجهة */}
        <div className="space-y-5">
          <Panel>
            <PanelHeader icon={Type} iconColor="#0EA5E9" title={t('الشعار النصي', 'Text Logo')} />
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Field label={t('الاسم (عربي)', 'Name (Arabic)')}>
                <TextInput value={draft.logoText} onChange={e => setDraft({ ...draft, logoText: e.target.value })} />
              </Field>
              <Field label="Name (English)">
                <TextInput value={draft.logoTextEn} onChange={e => setDraft({ ...draft, logoTextEn: e.target.value })} dir="ltr" />
              </Field>
            </div>
          </Panel>

          <Panel>
            <PanelHeader icon={ToggleRight} iconColor="#00D97E" title={t('عناصر الواجهة', 'UI Elements')} />
            <div className="space-y-3 mt-4">
              {[
                { key: 'showAnnouncementBar' as const, label: t('شريط الإعلانات العلوي', 'Top announcement bar'), desc: t('شريط متحرك أعلى الموقع للعروض', 'Scrolling bar at the top for offers') },
                { key: 'showLiveTicker' as const, label: t('شريط الأسعار الحي', 'Live price ticker'), desc: t('أسعار الأسواق المتحركة أسفل الترويسة', 'Moving market prices below the header') },
                { key: 'showWhatsapp' as const, label: t('زر الواتساب العائم', 'Floating WhatsApp button'), desc: t('تواصل فوري مع فريق المبيعات', 'Instant contact with the sales team') },
                { key: 'showCookieBanner' as const, label: t('بانر ملفات الارتباط', 'Cookie consent banner'), desc: t('إشعار قانوني لزوار الموقع', 'Legal notice for site visitors') },
                { key: 'darkModeDefault' as const, label: t('الوضع الليلي افتراضياً', 'Dark mode by default'), desc: t('يفتح الموقع بالثيم الداكن للزوار الجدد', 'Site opens in dark theme for new visitors') },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between rounded-lg border border-[#E2E8F0] dark:border-border-default p-3 gap-3">
                  <div>
                    <div className="text-xs font-bold text-text-primary">{item.label}</div>
                    <div className="text-[10px] text-text-muted mt-0.5">{item.desc}</div>
                  </div>
                  <Toggle checked={draft[item.key]} onChange={v => setDraft({ ...draft, [item.key]: v })} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader icon={Megaphone} iconColor="#F59E0B" title={t('نص شريط الإعلانات', 'Announcement Bar Text')} />
            <div className="space-y-3 mt-4">
              <Field label={t('الإعلان (عربي)', 'Announcement (Arabic)')}>
                <TextInput value={draft.announcement} onChange={e => setDraft({ ...draft, announcement: e.target.value })} disabled={!draft.showAnnouncementBar} />
              </Field>
              <Field label="Announcement (English)">
                <TextInput value={draft.announcementEn} onChange={e => setDraft({ ...draft, announcementEn: e.target.value })} dir="ltr" disabled={!draft.showAnnouncementBar} />
              </Field>
            </div>
          </Panel>
        </div>
      </div>
      {ToastView}
    </div>
  );
}
