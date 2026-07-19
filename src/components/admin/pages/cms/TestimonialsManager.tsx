// ─────────────────────────────────────────────────────────────
// CMS — TestimonialsManager إدارة شهادات وتقييمات العملاء
// اعتماد / رفض / تعديل آراء المستثمرين
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import { Star, Check, X, Pencil, Trash2 } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCmsTestimonials, TestimonialItem, addAuditEntry } from '@/lib/adminData';
import {
  PageHeader, Panel, Pill, StatCard, FilterTabs, Modal, ConfirmDialog,
  Field, TextInput, TextArea, PrimaryBtn, GhostBtn, IconBtn,
  EmptyState, useToast, ClientAvatar,
} from '@/components/admin/ui';

const STATUS: Record<TestimonialItem['status'], { ar: string; en: string; color: string }> = {
  approved: { ar: 'معتمدة', en: 'Approved', color: '#00D97E' },
  pending: { ar: 'بانتظار الاعتماد', en: 'Pending', color: '#F59E0B' },
  rejected: { ar: 'مرفوضة', en: 'Rejected', color: '#FF4560' },
};

function Stars({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className="w-3.5 h-3.5" style={{ color: i < n ? '#F59E0B' : '#CBD5E1' }} fill={i < n ? '#F59E0B' : 'none'} />
      ))}
    </span>
  );
}

export function TestimonialsManager() {
  const { t, lang } = useLang();
  const [testimonials, setTestimonials] = useCmsTestimonials();
  const { show, ToastView } = useToast();

  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState<TestimonialItem | null>(null);
  const [form, setForm] = useState({ name: '', role: '', text: '', textEn: '', rating: 5 });
  const [deleting, setDeleting] = useState<TestimonialItem | null>(null);

  const counts = useMemo(() => ({
    all: testimonials.length,
    approved: testimonials.filter(x => x.status === 'approved').length,
    pending: testimonials.filter(x => x.status === 'pending').length,
    avg: testimonials.length ? (testimonials.reduce((s, x) => s + x.rating, 0) / testimonials.length).toFixed(1) : '0',
  }), [testimonials]);

  const filtered = useMemo(() => testimonials.filter(x => filter === 'all' || x.status === filter), [testimonials, filter]);

  const setStatus = (x: TestimonialItem, status: TestimonialItem['status']) => {
    setTestimonials(prev => prev.map(y => y.id === x.id ? { ...y, status } : y));
    addAuditEntry('admin@tharwah.com',
      status === 'approved' ? `اعتماد شهادة ${x.name}` : status === 'rejected' ? `رفض شهادة ${x.name}` : `تعليق شهادة ${x.name}`,
      status === 'approved' ? `Approved testimonial by ${x.nameEn}` : status === 'rejected' ? `Rejected testimonial by ${x.nameEn}` : `Held testimonial by ${x.nameEn}`);
    show(status === 'approved' ? t('اعتُمدت الشهادة وستظهر في الموقع', 'Testimonial approved — now visible on site') : status === 'rejected' ? t('رُفضت الشهادة', 'Testimonial rejected') : t('أُعيدت الشهادة للمراجعة', 'Testimonial returned to review'),
      status === 'rejected' ? 'error' : 'success');
  };

  const openEdit = (x: TestimonialItem) => {
    setEditing(x);
    setForm({ name: x.name, role: x.role, text: x.text, textEn: x.textEn, rating: x.rating });
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setTestimonials(prev => prev.map(y => y.id === editing!.id ? { ...y, ...form, nameEn: y.nameEn, roleEn: y.roleEn } : y));
    show(t('تم تحديث الشهادة', 'Testimonial updated'));
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('إدارة شهادات وتقييمات العملاء', 'Client Testimonials Manager')}
        subtitle={t('اعتماد ومراجعة آراء المستثمرين قبل نشرها في الصفحة الرئيسية', 'Review and approve investor reviews before they appear on the homepage')}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t('كل الشهادات', 'All Testimonials')} value={counts.all} icon="💬" color="#3B82F6" />
        <StatCard label={t('معتمدة ومنشورة', 'Approved & Live')} value={counts.approved} icon="✅" color="#00D97E" />
        <StatCard label={t('بانتظار الاعتماد', 'Pending Review')} value={counts.pending} icon="⏳" color="#F59E0B" />
        <StatCard label={t('متوسط التقييم', 'Average Rating')} value={counts.avg} icon="⭐" color="#C9A84C" />
      </div>

      <FilterTabs
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: t('الكل', 'All'), count: counts.all },
          { value: 'pending', label: t('معلقة', 'Pending'), count: counts.pending },
          { value: 'approved', label: t('معتمدة', 'Approved'), count: counts.approved },
          { value: 'rejected', label: t('مرفوضة', 'Rejected'), count: testimonials.filter(x => x.status === 'rejected').length },
        ]}
      />

      {filtered.length === 0 ? (
        <Panel><EmptyState icon="⭐" text={t('لا توجد شهادات هنا', 'No testimonials here')} /></Panel>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(x => {
            const st = STATUS[x.status];
            return (
              <Panel key={x.id} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ClientAvatar name={lang === 'ar' ? x.name : x.nameEn} idSeed={x.id} size={40} />
                    <div>
                      <h3 className="font-black text-sm text-text-primary">{lang === 'ar' ? x.name : x.nameEn}</h3>
                      <p className="text-[10px] text-text-muted">{lang === 'ar' ? x.role : x.roleEn} · {x.date}</p>
                    </div>
                  </div>
                  <Pill text={lang === 'ar' ? st.ar : st.en} color={st.color} dot />
                </div>

                <div className="rounded-xl p-3 flex-1" style={{ background: 'rgba(201,168,76,0.05)', borderInlineStart: '3px solid #C9A84C' }}>
                  <Stars n={x.rating} />
                  <p className="text-xs text-text-secondary leading-relaxed mt-2">"{lang === 'ar' ? x.text : x.textEn}"</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] dark:border-border-default">
                  <div className="flex items-center gap-1.5">
                    {x.status !== 'approved' && (
                      <button onClick={() => setStatus(x, 'approved')} className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white flex items-center gap-1 transition-colors bg-[#00B894] hover:bg-[#00A07F]">
                        <Check className="w-3 h-3" /> {t('اعتماد', 'Approve')}
                      </button>
                    )}
                    {x.status !== 'rejected' && (
                      <button onClick={() => setStatus(x, 'rejected')} className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-[#FF4560] border border-[#FF4560]/25 hover:bg-[#FF4560]/5 flex items-center gap-1 transition-colors">
                        <X className="w-3 h-3" /> {t('رفض', 'Reject')}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5">
                    <IconBtn icon={Pencil} label={t('تعديل', 'Edit')} onClick={() => openEdit(x)} />
                    <IconBtn icon={Trash2} label={t('حذف', 'Delete')} onClick={() => setDeleting(x)} hoverColor="#FF4560" />
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {/* تعديل شهادة */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={t('تعديل الشهادة', 'Edit Testimonial')}
        icon={Pencil}
        footer={
          <>
            <GhostBtn onClick={() => setEditing(null)}>{t('إلغاء', 'Cancel')}</GhostBtn>
            <PrimaryBtn onClick={() => (document.getElementById('tst-form') as HTMLFormElement)?.requestSubmit()}>{t('حفظ', 'Save')}</PrimaryBtn>
          </>
        }
      >
        <form id="tst-form" onSubmit={saveEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('اسم العميل', 'Client Name')}>
              <TextInput required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label={t('الصفة', 'Role')}>
              <TextInput required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
            </Field>
          </div>
          <Field label={t('نص الشهادة (عربي)', 'Testimonial (Arabic)')}>
            <TextArea required rows={3} value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} />
          </Field>
          <Field label="Testimonial (English)">
            <TextArea required rows={3} value={form.textEn} onChange={e => setForm({ ...form, textEn: e.target.value })} dir="ltr" />
          </Field>
          <div>
            <label className="block text-[11px] font-bold text-text-muted mb-2">{t('التقييم', 'Rating')}</label>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <button key={i} type="button" onClick={() => setForm({ ...form, rating: i + 1 })}>
                  <Star className="w-6 h-6" style={{ color: i < form.rating ? '#F59E0B' : '#CBD5E1' }} fill={i < form.rating ? '#F59E0B' : 'none'} />
                </button>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => { setTestimonials(prev => prev.filter(x => x.id !== deleting!.id)); show(t('تم حذف الشهادة', 'Testimonial deleted')); }}
        title={t('حذف الشهادة', 'Delete Testimonial')}
        message={t(`حذف شهادة ${deleting?.name} نهائياً؟`, `Permanently delete ${deleting?.nameEn}'s testimonial?`)}
        confirmText={t('حذف', 'Delete')}
      />
      {ToastView}
    </div>
  );
}
