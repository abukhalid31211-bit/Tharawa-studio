// ─────────────────────────────────────────────────────────────
// CMS — AboutManager إدارة صفحة من نحن (الرسالة والرؤية والقيم)
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { Info, Save, Plus, Trash2, Landmark, Telescope, Loader2 } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCmsAbout, nextCode, addAuditEntry } from '@/lib/adminData';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import {
  PageHeader, Panel, PanelHeader, Pill, Field, TextInput, TextArea,
  PrimaryBtn, GhostBtn, IconBtn, useToast,
} from '@/components/admin/ui';

const VALUE_ICONS = ['🛡️', '🔍', '🕌', '🚀', '🤝', '💡', '🌟', '📈'];
const TEAM_AVATARS = ['خ', 'س', 'ف', 'ل', 'أ', 'ن', 'ر', 'م'];

export function AboutManager() {
  const { t, lang } = useLang();
  const [about, setAbout] = useCmsAbout();
  const [draft, setDraft] = useState(about);
  const { show, ToastView } = useToast();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getContent('about')
      .then((res: any) => {
        if (res.data?.content_data) {
          setAbout(res.data.content_data);
          setDraft(res.data.content_data);
        }
      })
      .catch(error => logger.warn('Failed to load remote about content', error));
  }, [setAbout]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(about);

  const save = async () => {
    setSaving(true);
    try {
      await api.updateContent('about', {
        title_ar: draft.missionTitle,
        title_en: draft.missionTitleEn,
        content_data: draft,
      });
      setAbout(draft);
      addAuditEntry('admin@tharwah.com', 'تحديث صفحة من نحن', 'Updated About page');
      show(t('تم نشر تعديلات صفحة من نحن', 'About page changes published'));
    } catch (error: any) {
      show(error?.message || t('فشل الحفظ', 'Save failed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateValue = (id: string, patch: Partial<typeof draft.values[0]>) => {
    setDraft(d => ({ ...d, values: d.values.map(v => v.id === id ? { ...v, ...patch } : v) }));
  };

  const updateTeam = (index: number, patch: Record<string, string>) => {
    setDraft(d => ({
      ...d,
      team: (d.team || []).map((member, memberIndex) => memberIndex === index ? { ...member, ...patch } : member),
    }));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('إدارة صفحة من نحن', 'About Page Manager')}
        subtitle={t('الرسالة والرؤية والقصة المؤسسية والقيم الظاهرة للزوار', 'Mission, vision, corporate story and values shown to visitors')}
        actions={
          <>
            {dirty && <Pill text={t('تغييرات غير منشورة', 'Unpublished changes')} color="#F59E0B" dot />}
            {saving && <Loader2 className="w-5 h-5 animate-spin text-gold-primary" />}
            <PrimaryBtn icon={Save} onClick={() => void save()} disabled={!dirty || saving}>{t('حفظ ونشر', 'Save & Publish')}</PrimaryBtn>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* الرسالة */}
        <Panel>
          <PanelHeader icon={Landmark} iconColor="#0EA5E9" title={lang === 'ar' ? draft.missionTitle : draft.missionTitleEn} />
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('عنوان الرسالة (ع)', 'Mission Title (Ar)')}>
                <TextInput value={draft.missionTitle} onChange={e => setDraft({ ...draft, missionTitle: e.target.value })} />
              </Field>
              <Field label="Mission Title (En)">
                <TextInput value={draft.missionTitleEn} onChange={e => setDraft({ ...draft, missionTitleEn: e.target.value })} dir="ltr" />
              </Field>
            </div>
            <Field label={t('نص الرسالة (عربي)', 'Mission Text (Arabic)')}>
              <TextArea rows={4} value={draft.mission} onChange={e => setDraft({ ...draft, mission: e.target.value })} />
            </Field>
            <Field label="Mission Text (English)">
              <TextArea rows={4} value={draft.missionEn} onChange={e => setDraft({ ...draft, missionEn: e.target.value })} dir="ltr" />
            </Field>
          </div>
        </Panel>

        {/* الرؤية */}
        <Panel>
          <PanelHeader icon={Telescope} iconColor="#C9A84C" title={lang === 'ar' ? draft.visionTitle : draft.visionTitleEn} />
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('عنوان الرؤية (ع)', 'Vision Title (Ar)')}>
                <TextInput value={draft.visionTitle} onChange={e => setDraft({ ...draft, visionTitle: e.target.value })} />
              </Field>
              <Field label="Vision Title (En)">
                <TextInput value={draft.visionTitleEn} onChange={e => setDraft({ ...draft, visionTitleEn: e.target.value })} dir="ltr" />
              </Field>
            </div>
            <Field label={t('نص الرؤية (عربي)', 'Vision Text (Arabic)')}>
              <TextArea rows={3} value={draft.vision} onChange={e => setDraft({ ...draft, vision: e.target.value })} />
            </Field>
            <Field label="Vision Text (English)">
              <TextArea rows={3} value={draft.visionEn} onChange={e => setDraft({ ...draft, visionEn: e.target.value })} dir="ltr" />
            </Field>
          </div>
        </Panel>
      </div>

      {/* القصة */}
      <Panel>
        <PanelHeader icon={Info} iconColor="#8B5CF6" title={t('قصة التأسيس', 'Founding Story')} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <Field label={t('القصة (عربي)', 'Story (Arabic)')}>
            <TextArea rows={4} value={draft.story} onChange={e => setDraft({ ...draft, story: e.target.value })} />
          </Field>
          <Field label="Story (English)">
            <TextArea rows={4} value={draft.storyEn} onChange={e => setDraft({ ...draft, storyEn: e.target.value })} dir="ltr" />
          </Field>
        </div>
      </Panel>

      {/* القيم */}
      <Panel>
        <PanelHeader
          icon={Plus} iconColor="#00D97E"
          title={t('قيمنا المؤسسية', 'Corporate Values')}
          subtitle={`${draft.values.length} ${t('قيم ظاهرة في الصفحة', 'values shown on the page')}`}
          action={
            <GhostBtn icon={Plus} disabled={draft.values.length >= 8}
              onClick={() => setDraft(d => ({ ...d, values: [...d.values, { id: nextCode(d.values, 'V'), icon: '🌟', title: 'قيمة جديدة', titleEn: 'New Value', desc: '', descEn: '' }] }))}>
              {t('إضافة قيمة', 'Add Value')}
            </GhostBtn>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {draft.values.map(v => (
            <div key={v.id} className="rounded-lg border border-[#E2E8F0] dark:border-border-default p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {VALUE_ICONS.map(ic => (
                    <button key={ic} type="button" onClick={() => updateValue(v.id, { icon: ic })}
                      className="w-7 h-7 rounded-md text-sm flex items-center justify-center border transition-all"
                      style={{ borderColor: v.icon === ic ? '#00D97E' : '#E2E8F0', background: v.icon === ic ? 'rgba(0,217,126,0.08)' : 'transparent' }}>
                      {ic}
                    </button>
                  ))}
                </div>
                <IconBtn icon={Trash2} label={t('حذف', 'Delete')} onClick={() => setDraft(d => ({ ...d, values: d.values.filter(x => x.id !== v.id) }))} hoverColor="#FF4560" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TextInput value={v.title} onChange={e => updateValue(v.id, { title: e.target.value })} placeholder={t('العنوان (ع)', 'Title (Ar)')} />
                <TextInput value={v.titleEn} onChange={e => updateValue(v.id, { titleEn: e.target.value })} placeholder="Title (En)" dir="ltr" />
              </div>
              <TextArea rows={2} value={v.desc} onChange={e => updateValue(v.id, { desc: e.target.value })} placeholder={t('الوصف (عربي)', 'Description (Arabic)')} />
              <TextArea rows={2} value={v.descEn} onChange={e => updateValue(v.id, { descEn: e.target.value })} placeholder="Description (English)" dir="ltr" />
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          icon={Plus}
          iconColor="#0EA5E9"
          title={t('فريق صفحة من نحن', 'About Page Team')}
          subtitle={`${(draft.team || []).length} ${t('أعضاء ظاهرون في الصفحة', 'members shown on the page')}`}
          action={
            <GhostBtn icon={Plus} onClick={() => setDraft(d => ({
              ...d,
              team: [...(d.team || []), {
                avatar: TEAM_AVATARS[(d.team || []).length % TEAM_AVATARS.length],
                nameAr: 'عضو جديد',
                nameEn: 'New Member',
                roleAr: 'منصب جديد',
                roleEn: 'New Role',
                descAr: '',
                descEn: '',
              }],
            }))}>
              {t('إضافة عضو', 'Add Member')}
            </GhostBtn>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {(draft.team || []).map((member, index) => (
            <div key={`${member.nameAr}-${index}`} className="rounded-lg border border-[#E2E8F0] dark:border-border-default p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  {TEAM_AVATARS.map(avatar => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => updateTeam(index, { avatar })}
                      className="w-7 h-7 rounded-md text-sm flex items-center justify-center border transition-all"
                      style={{ borderColor: member.avatar === avatar ? '#0EA5E9' : '#E2E8F0', background: member.avatar === avatar ? 'rgba(14,165,233,0.08)' : 'transparent' }}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
                <IconBtn icon={Trash2} label={t('حذف', 'Delete')} onClick={() => setDraft(d => ({ ...d, team: (d.team || []).filter((_, teamIndex) => teamIndex !== index) }))} hoverColor="#FF4560" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TextInput value={member.nameAr} onChange={e => updateTeam(index, { nameAr: e.target.value })} placeholder={t('الاسم (ع)', 'Name (Ar)')} />
                <TextInput value={member.nameEn} onChange={e => updateTeam(index, { nameEn: e.target.value })} placeholder="Name (En)" dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TextInput value={member.roleAr} onChange={e => updateTeam(index, { roleAr: e.target.value })} placeholder={t('المنصب (ع)', 'Role (Ar)')} />
                <TextInput value={member.roleEn} onChange={e => updateTeam(index, { roleEn: e.target.value })} placeholder="Role (En)" dir="ltr" />
              </div>
              <TextArea rows={2} value={member.descAr} onChange={e => updateTeam(index, { descAr: e.target.value })} placeholder={t('الوصف (عربي)', 'Description (Arabic)')} />
              <TextArea rows={2} value={member.descEn} onChange={e => updateTeam(index, { descEn: e.target.value })} placeholder="Description (English)" dir="ltr" />
            </div>
          ))}
        </div>
      </Panel>

      {/* معاينة القيم */}
      <Panel>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">👁️ {t('معاينة', 'Preview')}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {draft.values.map(v => (
            <div key={v.id} className="text-center rounded-xl border border-[#E2E8F0] dark:border-border-default p-4">
              <span className="text-2xl">{v.icon}</span>
              <h4 className="text-xs font-black text-text-primary mt-2">{lang === 'ar' ? v.title : v.titleEn}</h4>
            </div>
          ))}
        </div>
        {(draft.team || []).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#E2E8F0] dark:border-border-default">
            {(draft.team || []).map((member, index) => (
              <div key={`${member.nameAr}-${index}-preview`} className="text-center rounded-xl border border-[#E2E8F0] dark:border-border-default p-4">
                <div className="w-12 h-12 rounded-full gradient-gold mx-auto flex items-center justify-center text-white font-black text-lg mb-2">
                  {lang === 'ar' ? (member.avatar || member.nameAr?.charAt(0) || 'ث') : (member.nameEn?.charAt(0) || 'T')}
                </div>
                <h4 className="text-xs font-black text-text-primary">{lang === 'ar' ? member.nameAr : member.nameEn}</h4>
                <p className="text-[10px] text-text-muted mt-1">{lang === 'ar' ? member.roleAr : member.roleEn}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>
      {ToastView}
    </div>
  );
}
