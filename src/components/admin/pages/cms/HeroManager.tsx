// ─────────────────────────────────────────────────────────────
// CMS — HeroManager إدارة قسم البطل في الصفحة الرئيسية
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Layout, Save, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCmsHero, HERO_SEED, addAuditEntry } from '@/lib/adminData';
import {
  PageHeader, Panel, PanelHeader, Pill, Field, TextInput, TextArea,
  PrimaryBtn, GhostBtn, IconBtn, useToast,
} from '@/components/admin/ui';

export function HeroManager() {
  const { t, lang } = useLang();
  const [hero, setHero] = useCmsHero();
  const [draft, setDraft] = useState(hero);
  const { show, ToastView } = useToast();

  const dirty = JSON.stringify(draft) !== JSON.stringify(hero);

  const save = () => {
    setHero(draft);
    addAuditEntry('admin@tharwah.com', 'تحديث محتوى قسم البطل', 'Updated Hero section content');
    show(t('تم نشر تعديلات قسم البطل على الموقع', 'Hero section changes published to site'));
  };

  const reset = () => { setDraft(HERO_SEED); show(t('تمت استعادة المحتوى الافتراضي', 'Default content restored')); };

  const updateStat = (i: number, patch: Partial<typeof draft.stats[0]>) => {
    setDraft(d => ({ ...d, stats: d.stats.map((s, j) => j === i ? { ...s, ...patch } : s) }));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('إدارة قسم البطل (Hero)', 'Hero Section Manager')}
        subtitle={t('القسم الأول الذي يراه الزائر في الصفحة الرئيسية — العنوان والوصف وأزرار الإجراء', "The first thing visitors see — headline, subtext and call-to-action buttons")}
        actions={
          <>
            {dirty && <Pill text={t('تغييرات غير منشورة', 'Unpublished changes')} color="#F59E0B" dot />}
            <GhostBtn icon={RotateCcw} onClick={reset}>{t('استعادة الافتراضي', 'Restore Default')}</GhostBtn>
            <PrimaryBtn icon={Save} onClick={save} disabled={!dirty}>{t('حفظ ونشر', 'Save & Publish')}</PrimaryBtn>
          </>
        }
      />

      {/* معاينة مبسطة */}
      <Panel className="text-center !py-8" >
        <div className="max-w-xl mx-auto space-y-3">
          <Pill text={lang === 'ar' ? draft.badge : draft.badgeEn} color="#C9A84C" />
          <h2 className="text-xl font-black text-text-primary leading-relaxed">{lang === 'ar' ? draft.title : draft.titleEn}</h2>
          <p className="text-xs text-text-muted leading-relaxed">{lang === 'ar' ? draft.subtitle : draft.subtitleEn}</p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="px-4 py-2 rounded-lg text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96A)' }}>{lang === 'ar' ? draft.ctaPrimary : draft.ctaPrimaryEn}</span>
            <span className="px-4 py-2 rounded-lg border border-[#C9A84C]/40 text-xs font-bold" style={{ color: '#B8912F' }}>{lang === 'ar' ? draft.ctaSecondary : draft.ctaSecondaryEn}</span>
          </div>
          <p className="text-[10px] text-text-muted pt-1">👁️ {t('معاينة حية للتصميم الحالي', 'Live preview of current draft')}</p>
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* النصوص العربية */}
        <Panel>
          <PanelHeader icon={Layout} iconColor="#0EA5E9" title={t('المحتوى العربي', 'Arabic Content')} />
          <div className="space-y-4 mt-4">
            <Field label={t('شارة الترخيص', 'License Badge')}>
              <TextInput value={draft.badge} onChange={e => setDraft({ ...draft, badge: e.target.value })} />
            </Field>
            <Field label={t('العنوان الرئيسي', 'Main Headline')}>
              <TextInput value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label={t('الوصف التفصيلي', 'Sub-headline')}>
              <TextArea rows={3} value={draft.subtitle} onChange={e => setDraft({ ...draft, subtitle: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('الزر الرئيسي', 'Primary CTA')}>
                <TextInput value={draft.ctaPrimary} onChange={e => setDraft({ ...draft, ctaPrimary: e.target.value })} />
              </Field>
              <Field label={t('الزر الثانوي', 'Secondary CTA')}>
                <TextInput value={draft.ctaSecondary} onChange={e => setDraft({ ...draft, ctaSecondary: e.target.value })} />
              </Field>
            </div>
          </div>
        </Panel>

        {/* النصوص الإنجليزية */}
        <Panel>
          <PanelHeader icon={Layout} iconColor="#3B82F6" title={t('المحتوى الإنجليزي', 'English Content')} />
          <div className="space-y-4 mt-4">
            <Field label="License Badge">
              <TextInput value={draft.badgeEn} onChange={e => setDraft({ ...draft, badgeEn: e.target.value })} dir="ltr" />
            </Field>
            <Field label="Main Headline">
              <TextInput value={draft.titleEn} onChange={e => setDraft({ ...draft, titleEn: e.target.value })} dir="ltr" />
            </Field>
            <Field label="Sub-headline">
              <TextArea rows={3} value={draft.subtitleEn} onChange={e => setDraft({ ...draft, subtitleEn: e.target.value })} dir="ltr" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Primary CTA">
                <TextInput value={draft.ctaPrimaryEn} onChange={e => setDraft({ ...draft, ctaPrimaryEn: e.target.value })} dir="ltr" />
              </Field>
              <Field label="Secondary CTA">
                <TextInput value={draft.ctaSecondaryEn} onChange={e => setDraft({ ...draft, ctaSecondaryEn: e.target.value })} dir="ltr" />
              </Field>
            </div>
          </div>
        </Panel>
      </div>

      {/* شريط الإحصائيات */}
      <Panel>
        <PanelHeader
          icon={Plus} iconColor="#C9A84C"
          title={t('إحصائيات شريط الثقة', 'Trust Stats Bar')}
          subtitle={t('تظهر أسفل أزرار الإجراء في قسم البطل', 'Shown below the hero CTAs')}
          action={
            <GhostBtn icon={Plus} disabled={draft.stats.length >= 6} onClick={() => setDraft(d => ({ ...d, stats: [...d.stats, { value: '100%', label: 'عنصر جديد', labelEn: 'New item' }] }))}>
              {t('إضافة إحصائية', 'Add Stat')}
            </GhostBtn>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {draft.stats.map((s, i) => (
            <div key={i} className="rounded-lg border border-[#E2E8F0] dark:border-border-default p-3 flex items-end gap-2">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <Field label={t('القيمة', 'Value')}>
                  <TextInput value={s.value} onChange={e => updateStat(i, { value: e.target.value })} dir="ltr" />
                </Field>
                <Field label={t('الوصف (ع)', 'Label (Ar)')}>
                  <TextInput value={s.label} onChange={e => updateStat(i, { label: e.target.value })} />
                </Field>
                <Field label="Label (En)">
                  <TextInput value={s.labelEn} onChange={e => updateStat(i, { labelEn: e.target.value })} dir="ltr" />
                </Field>
              </div>
              <IconBtn icon={Trash2} label={t('حذف', 'Delete')} onClick={() => setDraft(d => ({ ...d, stats: d.stats.filter((_, j) => j !== i) }))} hoverColor="#FF4560" />
            </div>
          ))}
        </div>
      </Panel>
      {ToastView}
    </div>
  );
}
