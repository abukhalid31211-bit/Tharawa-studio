// ─────────────────────────────────────────────────────────────
// CMS — PrivacyPolicyManager إدارة سياسة الخصوصية والبنود القانونية
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { ShieldCheck, Save, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCmsPrivacy, PrivacySection, nextCode, addAuditEntry } from '@/lib/adminData';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import {
  PageHeader, Panel, PanelHeader, Pill, StatCard, Modal, ConfirmDialog,
  Field, TextInput, TextArea, PrimaryBtn, GhostBtn, IconBtn,
  EmptyState, useToast,
} from '@/components/admin/ui';

const EMPTY = { title: '', titleEn: '', body: '', bodyEn: '' };

export function PrivacyPolicyManager() {
  const { t, lang } = useLang();
  const [doc, setDoc] = useCmsPrivacy();
  const { show, ToastView } = useToast();

  const [metaDraft, setMetaDraft] = useState({ intro: doc.intro, introEn: doc.introEn, lastUpdated: doc.lastUpdated });
  const metaDirty = JSON.stringify(metaDraft) !== JSON.stringify({ intro: doc.intro, introEn: doc.introEn, lastUpdated: doc.lastUpdated });

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<PrivacySection | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState<PrivacySection | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getContent('privacy')
      .then((res: any) => {
        const remotePrivacy = res.data?.content_data;
        if (remotePrivacy && typeof remotePrivacy === 'object') {
          setDoc(remotePrivacy);
          setMetaDraft({
            intro: remotePrivacy.intro || '',
            introEn: remotePrivacy.introEn || '',
            lastUpdated: remotePrivacy.lastUpdated || '',
          });
        }
      })
      .catch(error => logger.warn('Failed to load remote privacy content', error));
  }, [setDoc]);

  const sections = [...doc.sections].sort((a, b) => a.order - b.order);

  const syncToBackend = async (updatedDoc: typeof doc) => {
    setSaving(true);
    try {
      await api.updateContent('privacy', { content_data: updatedDoc });
      addAuditEntry('admin@tharwah.com', 'تعديل بنود سياسة الخصوصية', 'Edited privacy policy clauses');
    } catch (error: any) {
      show(error?.message || t('فشل الحفظ', 'Save failed'), 'error');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const saveMeta = async () => {
    const updatedDoc = { ...doc, ...metaDraft };
    setDoc(updatedDoc);
    await syncToBackend(updatedDoc);
    addAuditEntry('admin@tharwah.com', 'تحديث مقدمة سياسة الخصوصية', 'Updated privacy policy intro');
    show(t('تم حفظ المقدمة وتاريخ التحديث', 'Intro and update date saved'));
  };

  const openAdd = () => { setEditing(null); setForm(EMPTY); setEditOpen(true); };
  const openEdit = (s: PrivacySection) => {
    setEditing(s);
    setForm({ title: s.title, titleEn: s.titleEn, body: s.body, bodyEn: s.bodyEn });
    setEditOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    let updatedDoc: typeof doc;
    if (editing) {
      updatedDoc = { ...doc, sections: doc.sections.map(s => s.id === editing.id ? { ...s, ...form } : s) };
      show(t('تم تحديث البند', 'Clause updated'));
    } else {
      const maxOrder = doc.sections.reduce((m, s) => Math.max(m, s.order), 0);
      updatedDoc = { ...doc, sections: [...doc.sections, { id: nextCode(doc.sections, 'P'), ...form, order: maxOrder + 1 }] };
      show(t('تمت إضافة البند لسياسة الخصوصية', 'Clause added to privacy policy'));
    }
    setDoc(updatedDoc);
    await syncToBackend(updatedDoc);
    setEditOpen(false);
  };

  const move = async (s: PrivacySection, dir: -1 | 1) => {
    const arr = [...sections];
    const i = arr.findIndex(x => x.id === s.id);
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    const updatedDoc = { ...doc, sections: arr.map((x, idx) => ({ ...x, order: idx + 1 })) };
    setDoc(updatedDoc);
    await syncToBackend(updatedDoc);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('إدارة سياسة الخصوصية والأحكام', 'Privacy Policy Manager')}
        subtitle={t('صياغة بنود الخصوصية والأحكام القانونية والشرعية المعتمدة في المنصة', 'Draft privacy clauses and legal/sharia terms adopted by the platform')}
        actions={
          <>
            {saving && <Loader2 className="w-5 h-5 animate-spin text-gold-primary" />}
            <PrimaryBtn icon={Plus} color="#C9A84C" colorHover="#B8912F" onClick={openAdd}>{t('إضافة بند', 'Add Clause')}</PrimaryBtn>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label={t('بنود السياسة', 'Policy Clauses')} value={doc.sections.length} icon="📜" color="#C9A84C" />
        <StatCard label={t('آخر تحديث', 'Last Updated')} value={doc.lastUpdated} icon="🗓️" color="#0EA5E9" />
        <StatCard label={t('الإطار القانوني', 'Legal Framework')} value="PDPL" icon="⚖️" color="#8B5CF6" />
      </div>

      {/* المقدمة وتاريخ التحديث */}
      <Panel>
        <PanelHeader icon={ShieldCheck} iconColor="#C9A84C" title={t('المقدمة وتاريخ السريان', 'Introduction & Effective Date')} />
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t('المقدمة (عربي)', 'Intro (Arabic)')}>
              <TextArea rows={3} value={metaDraft.intro} onChange={e => setMetaDraft({ ...metaDraft, intro: e.target.value })} />
            </Field>
            <Field label="Intro (English)">
              <TextArea rows={3} value={metaDraft.introEn} onChange={e => setMetaDraft({ ...metaDraft, introEn: e.target.value })} dir="ltr" />
            </Field>
          </div>
          <div className="flex items-end gap-3 flex-wrap">
            <Field label={t('تاريخ آخر تحديث', 'Last Update Date')}>
              <TextInput type="date" value={metaDraft.lastUpdated} onChange={e => setMetaDraft({ ...metaDraft, lastUpdated: e.target.value })} dir="ltr" className="max-w-[200px]" />
            </Field>
            <PrimaryBtn icon={Save} onClick={() => void saveMeta()} disabled={!metaDirty || saving}>{t('حفظ المقدمة', 'Save Intro')}</PrimaryBtn>
            {metaDirty && <Pill text={t('غير محفوظ', 'Unsaved')} color="#F59E0B" dot />}
          </div>
        </div>
      </Panel>

      {/* البنود */}
      {sections.length === 0 ? (
        <Panel><EmptyState icon="📜" text={t('لا توجد بنود بعد', 'No clauses yet')} /></Panel>
      ) : (
        <div className="space-y-3">
          {sections.map((s, i) => (
            <Panel key={s.id} className="flex items-start gap-4">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black shrink-0" style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.25)' }}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-text-primary">{lang === 'ar' ? s.title : s.titleEn}</h3>
                <p className="text-xs text-text-secondary leading-relaxed mt-1.5">{lang === 'ar' ? s.body : s.bodyEn}</p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <IconBtn icon={ArrowUp} label={t('أعلى', 'Move up')} onClick={() => move(s, -1)} hoverColor="#C9A84C" />
                <IconBtn icon={ArrowDown} label={t('أسفل', 'Move down')} onClick={() => move(s, 1)} hoverColor="#C9A84C" />
                <IconBtn icon={Pencil} label={t('تعديل', 'Edit')} onClick={() => openEdit(s)} hoverColor="#C9A84C" />
                <IconBtn icon={Trash2} label={t('حذف', 'Delete')} onClick={() => setDeleting(s)} hoverColor="#FF4560" />
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* معاينة قانونية */}
      <Panel className="!bg-[#FFFBF2]" >
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">👁️ {t('معاينة صفحة سياسة الخصوصية', 'Privacy policy page preview')}</p>
        <div className="max-w-2xl">
          <h2 className="text-base font-black text-text-primary">{t('سياسة الخصوصية — ثروة كابيتال', 'Privacy Policy — Tharwah Capital')}</h2>
          <p className="text-[10px] text-text-muted mt-1">{t('آخر تحديث:', 'Last updated:')} {doc.lastUpdated}</p>
          <p className="text-xs text-text-secondary leading-relaxed mt-3">{lang === 'ar' ? metaDraft.intro : metaDraft.introEn}</p>
          <ol className="mt-3 space-y-1.5">
            {sections.slice(0, 3).map(s => (
              <li key={s.id} className="text-xs font-bold text-text-primary">{s.order}. {lang === 'ar' ? s.title : s.titleEn}</li>
            ))}
            {sections.length > 3 && <li className="text-[10px] text-text-muted">+{sections.length - 3} {t('بنود أخرى…', 'more clauses…')}</li>}
          </ol>
        </div>
      </Panel>

      {/* نموذج البند */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={editing ? t('تعديل بند', 'Edit Clause') : t('إضافة بند قانوني', 'Add Legal Clause')}
        icon={ShieldCheck} iconColor="#C9A84C"
        footer={
          <>
            <GhostBtn onClick={() => setEditOpen(false)}>{t('إلغاء', 'Cancel')}</GhostBtn>
            <PrimaryBtn color="#C9A84C" colorHover="#B8912F" onClick={() => (document.getElementById('prv-form') as HTMLFormElement)?.requestSubmit()}>{t('حفظ', 'Save')}</PrimaryBtn>
          </>
        }
      >
        <form id="prv-form" onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('عنوان البند (عربي)', 'Clause Title (Arabic)')}>
              <TextInput required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Clause Title (English)">
              <TextInput required value={form.titleEn} onChange={e => setForm({ ...form, titleEn: e.target.value })} dir="ltr" />
            </Field>
          </div>
          <Field label={t('نص البند (عربي)', 'Clause Body (Arabic)')}>
            <TextArea required rows={4} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
          </Field>
          <Field label="Clause Body (English)">
            <TextArea required rows={4} value={form.bodyEn} onChange={e => setForm({ ...form, bodyEn: e.target.value })} dir="ltr" />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          const updatedDoc = { ...doc, sections: doc.sections.filter(s => s.id !== deleting.id) };
          setDoc(updatedDoc);
          void syncToBackend(updatedDoc);
          show(t('تم حذف البند', 'Clause deleted'));
          setDeleting(null);
        }}
        title={t('حذف بند قانوني', 'Delete Legal Clause')}
        message={t(`حذف بند «${deleting?.title}» من سياسة الخصوصية المنشورة؟ هذا تعديل قانوني حساس.`, `Delete "${deleting?.titleEn}" from the published privacy policy? This is a sensitive legal change.`)}
        confirmText={t('حذف', 'Delete')}
      />
      {ToastView}
    </div>
  );
}
