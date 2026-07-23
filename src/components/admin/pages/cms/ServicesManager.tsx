// ─────────────────────────────────────────────────────────────
// CMS — ServicesManager إدارة الخدمات الاستثمارية (Backend-connected)
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Ticket, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCmsServices, ServiceItem, nextCode, addAuditEntry } from '@/lib/adminData';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import {
  PageHeader, Panel, Pill, StatCard, Modal, ConfirmDialog, Field,
  TextInput, TextArea, PrimaryBtn, GhostBtn, IconBtn, EmptyState,
  Toggle, useToast,
} from '@/components/admin/ui';

const EMOJIS = ['📊', '🕌', '🌍', '🤖', '👨‍💼', '🎓', '💼', '📈', '🏦', '💎', '🛡️', '📱'];
const EMPTY = { icon: '📊', title: '', titleEn: '', desc: '', descEn: '', active: true };

export function ServicesManager() {
  const { t, lang } = useLang();
  const [services, setServices] = useCmsServices();
  const { show, ToastView } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState<ServiceItem | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getContent('services')
      .then((res: any) => {
        if (res.data?.content_data?.services) {
          setServices(res.data.content_data.services);
        }
      })
      .catch(err => logger.warn('Failed to load remote services content', err));
  }, []);

  const syncToBackend = async (updatedServices: ServiceItem[]) => {
    setSaving(true);
    try {
      await api.updateContent('services', {
        content_data: { services: updatedServices },
      });
      addAuditEntry('admin@tharwah.com', 'تحديث محتوى الخدمات', 'Updated services content');
    } catch (err: any) {
      show(err.message || t('فشل الحفظ', 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => { setEditing(null); setForm(EMPTY); setEditOpen(true); };
  const openEdit = (s: ServiceItem) => {
    setEditing(s);
    setForm({ icon: s.icon, title: s.title, titleEn: s.titleEn, desc: s.desc, descEn: s.descEn, active: s.active });
    setEditOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    let updated: ServiceItem[];
    if (editing) {
      updated = services.map(s => s.id === editing.id ? { ...s, ...form } : s);
      show(t('تم تحديث الخدمة', 'Service updated'));
    } else {
      updated = [...services, { id: nextCode(services, 'S'), ...form }];
      show(t('تمت إضافة الخدمة للموقع', 'Service added to site'));
    }
    setServices(updated);
    await syncToBackend(updated);
    setEditOpen(false);
  };

  const toggleActive = async (s: ServiceItem) => {
    const updated = services.map(x => x.id === s.id ? { ...x, active: !x.active } : x);
    setServices(updated);
    show(s.active ? t('أُخفيت الخدمة من الموقع', 'Service hidden from site') : t('أُظهرت الخدمة في الموقع', 'Service visible on site'));
    await syncToBackend(updated);
  };

  const move = async (s: ServiceItem, dir: -1 | 1) => {
    const arr = [...services];
    const i = arr.findIndex(x => x.id === s.id);
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setServices(arr);
    await syncToBackend(arr);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const updated = services.filter(s => s.id !== deleting.id);
    setServices(updated);
    await syncToBackend(updated);
    show(t('تم حذف الخدمة', 'Service deleted'));
    setDeleting(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('إدارة الخدمات الاستثمارية', 'Investment Services Manager')}
        subtitle={t('إضافة وتعديل وحذف وترتيب الخدمات الظاهرة في الموقع العام', 'Add, edit, delete and reorder services shown on the public site')}
        actions={
          <>
            {saving && <Loader2 className="w-5 h-5 animate-spin text-gold-primary" />}
            <PrimaryBtn icon={Plus} onClick={openAdd}>{t('إضافة خدمة', 'Add Service')}</PrimaryBtn>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label={t('كل الخدمات', 'All Services')} value={services.length} icon="🗂️" color="#3B82F6" />
        <StatCard label={t('ظاهرة في الموقع', 'Visible on Site')} value={services.filter(s => s.active).length} icon="👁️" color="#00D97E" />
        <StatCard label={t('مخفية', 'Hidden')} value={services.filter(s => !s.active).length} icon="🚫" color="#F59E0B" />
      </div>

      {services.length === 0 ? (
        <Panel><EmptyState icon="🎫" text={t('لا توجد خدمات', 'No services yet')} /></Panel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {services.map((s, i) => (
            <Panel key={s.id} className={`flex flex-col gap-3 transition-opacity ${!s.active ? 'opacity-55' : ''}`}>
              <div className="flex items-start justify-between">
                <span className="text-3xl">{s.icon}</span>
                <div className="flex items-center gap-1">
                  <Pill text={s.active ? t('ظاهرة', 'Visible') : t('مخفية', 'Hidden')} color={s.active ? '#00D97E' : '#94A3B8'} dot />
                  <span className="font-mono text-[10px] text-text-muted">{s.id}</span>
                </div>
              </div>
              <div>
                <h3 className="font-black text-sm text-text-primary">{lang === 'ar' ? s.title : s.titleEn}</h3>
                <p className="text-[11px] text-text-muted mt-1 leading-relaxed line-clamp-3">{lang === 'ar' ? s.desc : s.descEn}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0] dark:border-border-default mt-auto">
                <div className="flex items-center gap-0.5">
                  <IconBtn icon={ArrowUp} label={t('أعلى', 'Move up')} onClick={() => move(s, -1)} />
                  <IconBtn icon={ArrowDown} label={t('أسفل', 'Move down')} onClick={() => move(s, 1)} />
                </div>
                <Toggle checked={s.active} onChange={() => toggleActive(s)} />
                <div className="flex items-center gap-0.5">
                  <IconBtn icon={Pencil} label={t('تعديل', 'Edit')} onClick={() => openEdit(s)} />
                  <IconBtn icon={Trash2} label={t('حذف', 'Delete')} onClick={() => setDeleting(s)} hoverColor="#FF4560" />
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={editing ? t('تعديل خدمة', 'Edit Service') : t('إضافة خدمة استثمارية', 'Add Investment Service')}
        icon={Ticket}
        footer={
          <>
            <GhostBtn onClick={() => setEditOpen(false)}>{t('إلغاء', 'Cancel')}</GhostBtn>
            <PrimaryBtn onClick={() => (document.getElementById('svc-form') as HTMLFormElement)?.requestSubmit()} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('حفظ', 'Save')}
            </PrimaryBtn>
          </>
        }
      >
        <form id="svc-form" onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-text-muted mb-2">{t('الأيقونة', 'Icon')}</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setForm({ ...form, icon: e })}
                  className="w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-all"
                  style={{ borderColor: form.icon === e ? '#0EA5E9' : '#E2E8F0', background: form.icon === e ? 'rgba(14,165,233,0.08)' : 'transparent' }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('العنوان (عربي)', 'Title (Arabic)')}>
              <TextInput required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Title (English)">
              <TextInput required value={form.titleEn} onChange={e => setForm({ ...form, titleEn: e.target.value })} dir="ltr" />
            </Field>
          </div>
          <Field label={t('الوصف (عربي)', 'Description (Arabic)')}>
            <TextArea required rows={2} value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} />
          </Field>
          <Field label="Description (English)">
            <TextArea required rows={2} value={form.descEn} onChange={e => setForm({ ...form, descEn: e.target.value })} dir="ltr" />
          </Field>
          <Toggle checked={form.active} onChange={v => setForm({ ...form, active: v })} label={t('إظهار الخدمة في الموقع', 'Show service on site')} />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={t('حذف الخدمة', 'Delete Service')}
        message={t(`ستختفي خدمة «${deleting?.title}» من الموقع العام فوراً.`, `"${deleting?.title}" will disappear from the public site immediately.`)}
        confirmText={t('حذف', 'Delete')}
      />
      {ToastView}
    </div>
  );
}
