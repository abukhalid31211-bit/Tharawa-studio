// ─────────────────────────────────────────────────────────────
// CMS — FAQManager إدارة الأسئلة الشائعة
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, HelpCircle, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCmsFaq, FaqItem, nextCode, addAuditEntry } from '@/lib/adminData';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import {
  PageHeader, Panel, Pill, StatCard, Modal, ConfirmDialog, Field,
  TextInput, TextArea, PrimaryBtn, GhostBtn, IconBtn,
  EmptyState, SearchInput, FilterTabs, Toggle, useToast,
} from '@/components/admin/ui';

const EMPTY = { question: '', questionEn: '', answer: '', answerEn: '', category: 'البداية', published: true };

export function FAQManager() {
  const { t, lang } = useLang();
  const [faq, setFaq] = useCmsFaq();
  const { show, ToastView } = useToast();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState<FaqItem | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getContent('faq')
      .then((res: any) => {
        const remoteFaq = res.data?.content_data;
        if (Array.isArray(remoteFaq)) setFaq(remoteFaq);
      })
      .catch(error => logger.warn('Failed to load remote FAQ content', error));
  }, [setFaq]);

  const categories = useMemo(() => Array.from(new Set(faq.map(f => f.category))), [faq]);
  const published = faq.filter(f => f.published).length;

  const sorted = useMemo(() => [...faq].sort((a, b) => a.order - b.order), [faq]);
  const filtered = useMemo(() => sorted.filter(f => {
    const okQ = !search || f.question.includes(search) || f.questionEn.toLowerCase().includes(search.toLowerCase()) || f.answer.includes(search);
    const okC = catFilter === 'all' || f.category === catFilter;
    return okQ && okC;
  }), [sorted, search, catFilter]);

  const syncToBackend = async (updatedFaq: FaqItem[]) => {
    setSaving(true);
    try {
      await api.updateContent('faq', { content_data: updatedFaq });
      addAuditEntry('admin@tharwah.com', 'تحديث بنك الأسئلة الشائعة', 'Updated FAQ bank');
    } catch (error: any) {
      show(error?.message || t('فشل الحفظ', 'Save failed'), 'error');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => { setEditing(null); setForm(EMPTY); setEditOpen(true); };
  const openEdit = (f: FaqItem) => {
    setEditing(f);
    setForm({ question: f.question, questionEn: f.questionEn, answer: f.answer, answerEn: f.answerEn, category: f.category, published: f.published });
    setEditOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    let updatedFaq: FaqItem[];
    if (editing) {
      updatedFaq = faq.map(f => f.id === editing.id ? { ...f, ...form } : f);
      show(t('تم تحديث السؤال', 'FAQ updated'));
    } else {
      const maxOrder = faq.reduce((m, f) => Math.max(m, f.order), 0);
      updatedFaq = [...faq, { id: nextCode(faq, 'F'), ...form, order: maxOrder + 1 }];
      show(t('تمت إضافة السؤال لبنك الأسئلة', 'Question added to FAQ bank'));
    }
    setFaq(updatedFaq);
    await syncToBackend(updatedFaq);
    setEditOpen(false);
  };

  const move = async (f: FaqItem, dir: -1 | 1) => {
    const arr = [...sorted];
    const i = arr.findIndex(x => x.id === f.id);
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    const updatedFaq = arr.map((x, idx) => ({ ...x, order: idx + 1 }));
    setFaq(updatedFaq);
    await syncToBackend(updatedFaq);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('إدارة الأسئلة الشائعة', 'FAQ Manager')}
        subtitle={t('إضافة وتحديث بنك الأسئلة والأجوبة التي يراها الزوار في الموقع', 'Manage the Q&A bank that visitors see on the site')}
        actions={
          <>
            {saving && <Loader2 className="w-5 h-5 animate-spin text-gold-primary" />}
            <PrimaryBtn icon={Plus} onClick={openAdd}>{t('إضافة سؤال', 'Add Question')}</PrimaryBtn>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label={t('كل الأسئلة', 'All Questions')} value={faq.length} icon="❓" color="#F59E0B" />
        <StatCard label={t('منشورة', 'Published')} value={published} icon="✅" color="#00D97E" />
        <StatCard label={t('التصنيفات', 'Categories')} value={categories.length} icon="🗂️" color="#3B82F6" />
      </div>

      <Panel className="flex flex-col md:flex-row md:items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder={t('بحث في الأسئلة...', 'Search questions...')} className="md:max-w-xs" />
        <div className="md:ms-auto">
          <FilterTabs value={catFilter} onChange={setCatFilter}
            options={[{ value: 'all', label: t('كل التصنيفات', 'All Categories'), count: faq.length }, ...categories.map(c => ({ value: c, label: c, count: faq.filter(f => f.category === c).length }))]} />
        </div>
      </Panel>

      {filtered.length === 0 ? (
        <Panel><EmptyState icon="❓" text={t('لا توجد أسئلة مطابقة', 'No questions match')} /></Panel>
      ) : (
        <div className="space-y-3">
          {filtered.map((f, i) => (
            <Panel key={f.id} className={`transition-opacity ${!f.published ? 'opacity-55' : ''}`}>
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-text-primary">{lang === 'ar' ? f.question : f.questionEn}</h3>
                    <Pill text={f.category} color="#3B82F6" />
                    <Pill text={f.published ? t('منشور', 'Published') : t('مسودة', 'Draft')} color={f.published ? '#00D97E' : '#94A3B8'} dot />
                  </div>
                  <p className="text-[11px] text-text-muted mt-1.5 leading-relaxed">{lang === 'ar' ? f.answer : f.answerEn}</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <IconBtn icon={ArrowUp} label={t('أعلى', 'Move up')} onClick={() => move(f, -1)} />
                  <IconBtn icon={ArrowDown} label={t('أسفل', 'Move down')} onClick={() => move(f, 1)} />
                  <IconBtn icon={Pencil} label={t('تعديل', 'Edit')} onClick={() => openEdit(f)} />
                  <IconBtn icon={Trash2} label={t('حذف', 'Delete')} onClick={() => setDeleting(f)} hoverColor="#FF4560" />
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* نموذج */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={editing ? t('تعديل السؤال', 'Edit Question') : t('إضافة سؤال جديد', 'Add New Question')}
        icon={HelpCircle} iconColor="#F59E0B"
        footer={
          <>
            <GhostBtn onClick={() => setEditOpen(false)}>{t('إلغاء', 'Cancel')}</GhostBtn>
            <PrimaryBtn onClick={() => (document.getElementById('faq-form') as HTMLFormElement)?.requestSubmit()}>{t('حفظ', 'Save')}</PrimaryBtn>
          </>
        }
      >
        <form id="faq-form" onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('السؤال (عربي)', 'Question (Arabic)')}>
              <TextInput required value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} />
            </Field>
            <Field label="Question (English)">
              <TextInput required value={form.questionEn} onChange={e => setForm({ ...form, questionEn: e.target.value })} dir="ltr" />
            </Field>
          </div>
          <Field label={t('الإجابة (عربي)', 'Answer (Arabic)')}>
            <TextArea required rows={3} value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} />
          </Field>
          <Field label="Answer (English)">
            <TextArea required rows={3} value={form.answerEn} onChange={e => setForm({ ...form, answerEn: e.target.value })} dir="ltr" />
          </Field>
          <div className="grid grid-cols-2 gap-4 items-center">
            <Field label={t('التصنيف', 'Category')}>
              <TextInput required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} list="faq-cats" />
            </Field>
            <div className="pt-5">
              <Toggle checked={form.published} onChange={v => setForm({ ...form, published: v })} label={t('نشر السؤال في الموقع', 'Publish on site')} />
            </div>
          </div>
          <datalist id="faq-cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          const updatedFaq = faq.filter(f => f.id !== deleting.id);
          setFaq(updatedFaq);
          void syncToBackend(updatedFaq);
          show(t('تم حذف السؤال', 'Question deleted'));
          setDeleting(null);
        }}
        title={t('حذف السؤال', 'Delete Question')}
        message={t(`حذف «${deleting?.question}» من بنك الأسئلة؟`, `Delete "${deleting?.questionEn}" from FAQ bank?`)}
        confirmText={t('حذف', 'Delete')}
      />
      {ToastView}
    </div>
  );
}
