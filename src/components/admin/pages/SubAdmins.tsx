// ─────────────────────────────────────────────────────────────
// 4.14 — SubAdmins إدارة المشرفين الفرعيين والصلاحيات
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Plus, Pencil, Trash2, ShieldCheck, ShieldOff, UserCog, KeyRound } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useSubAdmins, SubAdmin, nextCode, addAuditEntry, relativeTime } from '@/lib/adminData';
import {
  PageHeader, Panel, Pill, StatCard, Modal, ConfirmDialog, Field,
  TextInput, PrimaryBtn, GhostBtn, IconBtn, EmptyState,
  DataTable, Tr, Td, useToast, ClientAvatar,
} from '@/components/admin/ui';

const PERMISSIONS: { key: string; ar: string; en: string; icon: string }[] = [
  { key: 'clients', ar: 'العملاء', en: 'Clients', icon: '👥' },
  { key: 'portfolios', ar: 'المحافظ', en: 'Portfolios', icon: '💼' },
  { key: 'transactions', ar: 'العمليات', en: 'Transactions', icon: '💳' },
  { key: 'messages', ar: 'الرسائل', en: 'Messages', icon: '💬' },
  { key: 'content', ar: 'المحتوى', en: 'Content', icon: '📄' },
  { key: 'reports', ar: 'التقارير', en: 'Reports', icon: '📊' },
];

const EMPTY_FORM = { name: '', email: '', phone: '', password: 'admin123', permissions: [] as string[] };

export function SubAdmins() {
  const { t, lang } = useLang();
  const [subAdmins, setSubAdmins] = useSubAdmins();
  const { show, ToastView } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<SubAdmin | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleting, setDeleting] = useState<SubAdmin | null>(null);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setEditOpen(true); };
  const openEdit = (sa: SubAdmin) => {
    setEditing(sa);
    setForm({ name: sa.name, email: sa.email, phone: sa.phone, password: sa.password, permissions: [...sa.permissions] });
    setEditOpen(true);
  };

  const togglePerm = (key: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key) ? f.permissions.filter(p => p !== key) : [...f.permissions, key],
    }));
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.permissions.length === 0) {
      show(t('اختر صلاحية واحدة على الأقل', 'Select at least one permission'), 'error');
      return;
    }
    if (editing) {
      setSubAdmins(prev => prev.map(s => s.id === editing.id ? { ...s, ...form } : s));
      addAuditEntry('admin@tharwah.com', `تعديل صلاحيات المشرف ${editing.name}`, `Updated sub-admin ${editing.name}`);
      show(t('تم تحديث المشرف الفرعي', 'Sub-admin updated'));
    } else {
      if (subAdmins.some(s => s.email.toLowerCase() === form.email.toLowerCase())) {
        show(t('البريد مسجل لمشرف آخر', 'Email already registered to another admin'), 'error');
        return;
      }
      setSubAdmins(prev => [...prev, {
        id: nextCode(subAdmins, 'SA'),
        ...form,
        status: 'active',
        lastActive: t('لم يسجل دخوله بعد', 'Never signed in'),
        createdAt: new Date().toISOString().slice(0, 10),
      }]);
      addAuditEntry('admin@tharwah.com', `إضافة مشرف فرعي ${form.name}`, `Added sub-admin ${form.name}`);
      show(t('تمت إضافة المشرف الفرعي — يمكنه الدخول الآن', 'Sub-admin added — they can sign in now'));
    }
    setEditOpen(false);
  };

  const toggleStatus = (sa: SubAdmin) => {
    const next = sa.status === 'active' ? 'suspended' : 'active';
    setSubAdmins(prev => prev.map(s => s.id === sa.id ? { ...s, status: next } : s));
    if (next === 'suspended') {
      // إجبار الجلسة الحالية على الخروج
      localStorage.setItem('tharwah_force_logout', '1');
    }
    addAuditEntry('admin@tharwah.com',
      next === 'suspended' ? `إيقاف المشرف ${sa.name}` : `تفعيل المشرف ${sa.name}`,
      next === 'suspended' ? `Suspended sub-admin ${sa.name}` : `Activated sub-admin ${sa.name}`);
    show(next === 'suspended' ? t('تم إيقاف المشرف — سيُسجل خروجه فوراً', 'Sub-admin suspended — current session will sign out') : t('تم تفعيل المشرف', 'Sub-admin activated'));
  };

  const active = subAdmins.filter(s => s.status === 'active').length;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('إدارة المشرفين الفرعيين', 'Sub-Admins Management')}
        subtitle={t('إضافة وتعديل وحذف المشرفين الفرعيين مع تحديد صلاحياتهم ومستويات الوصول', 'Add, edit, and remove sub-admins with granular permissions and access levels')}
        actions={<PrimaryBtn icon={Plus} color="#C9A84C" colorHover="#B8912F" onClick={openAdd}>{t('إضافة مشرف جديد', 'Add New Admin')}</PrimaryBtn>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t('مشرف رئيسي', 'Super Admins')} value={1} icon="👑" color="#C9A84C" />
        <StatCard label={t('مشرفون فرعيون نشطون', 'Active Sub-Admins')} value={active} icon="🔵" color="#0EA5E9" />
        <StatCard label={t('مشرفون موقوفون', 'Suspended')} value={subAdmins.length - active} icon="🚫" color="#FF4560" />
        <StatCard label={t('أقسام الصلاحيات المتاحة', 'Permission Sections')} value={PERMISSIONS.length} icon="🗂️" color="#8B5CF6" />
      </div>

      {/* المشرف الرئيسي */}
      <Panel className="flex items-center gap-4" >
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shadow-md" style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96A)' }}>
          S
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-sm text-text-primary">Super Admin</h3>
            <Pill text={t('وصول كامل لكل الأقسام', 'Full access to all sections')} color="#C9A84C" />
          </div>
          <p className="text-[11px] text-text-muted font-mono mt-1">admin@tharwah.com</p>
        </div>
        <Pill text={t('نشط دائم', 'Always Active')} color="#00D97E" dot />
      </Panel>

      {/* جدول المشرفين الفرعيين */}
      <Panel padded={false}>
        {subAdmins.length === 0 ? (
          <EmptyState icon="🛡️" text={t('لا يوجد مشرفون فرعيون بعد', 'No sub-admins yet')} sub={t('أضف مشرفاً فرعياً لتفويض مهام محددة', 'Add a sub-admin to delegate specific tasks')} />
        ) : (
          <DataTable headers={[t('المشرف', 'Admin'), t('التواصل', 'Contact'), t('الأقسام المصرّح بها', 'Allowed Sections'), t('آخر نشاط', 'Last Active'), t('الحالة', 'Status'), t('العمليات', 'Actions')]}>
            {subAdmins.map(sa => (
              <Tr key={sa.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <ClientAvatar name={sa.name} idSeed={sa.id} size={30} />
                    <div>
                      <div className="font-bold text-text-primary">{sa.name}</div>
                      <div className="text-[10px] text-text-muted">{t('أُضيف:', 'Added:')} {sa.createdAt}</div>
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="font-mono text-[11px]">{sa.email}</div>
                  <div className="font-mono text-[10px] text-text-muted mt-0.5" dir="ltr">{sa.phone}</div>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1 max-w-[240px]">
                    {sa.permissions.map(p => {
                      const perm = PERMISSIONS.find(x => x.key === p);
                      return perm ? <Pill key={p} text={`${perm.icon} ${lang === 'ar' ? perm.ar : perm.en}`} color="#0EA5E9" /> : null;
                    })}
                  </div>
                </Td>
                <Td>{sa.lastActive.match(/^\d{4}/) ? relativeTime(sa.lastActive, lang) : sa.lastActive}</Td>
                <Td>
                  <Pill
                    text={sa.status === 'active' ? t('نشط', 'Active') : t('موقوف', 'Suspended')}
                    color={sa.status === 'active' ? '#00D97E' : '#FF4560'} dot
                  />
                </Td>
                <Td>
                  <div className="flex items-center gap-0.5">
                    <IconBtn icon={Pencil} label={t('تعديل الصلاحيات', 'Edit permissions')} onClick={() => openEdit(sa)} />
                    <IconBtn
                      icon={sa.status === 'active' ? ShieldOff : ShieldCheck}
                      label={sa.status === 'active' ? t('إيقاف', 'Suspend') : t('تفعيل', 'Activate')}
                      onClick={() => toggleStatus(sa)}
                      hoverColor={sa.status === 'active' ? '#F59E0B' : '#00D97E'}
                    />
                    <IconBtn icon={Trash2} label={t('حذف', 'Delete')} onClick={() => setDeleting(sa)} hoverColor="#FF4560" />
                  </div>
                </Td>
              </Tr>
            ))}
          </DataTable>
        )}
      </Panel>

      {/* نموذج إضافة/تعديل */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={editing ? t('تعديل المشرف الفرعي', 'Edit Sub-Admin') : t('إضافة مشرف فرعي جديد', 'Add New Sub-Admin')}
        icon={UserCog} iconColor="#C9A84C"
        footer={
          <>
            <GhostBtn onClick={() => setEditOpen(false)}>{t('إلغاء', 'Cancel')}</GhostBtn>
            <PrimaryBtn color="#C9A84C" colorHover="#B8912F" onClick={() => (document.getElementById('sa-form') as HTMLFormElement)?.requestSubmit()}>
              {editing ? t('حفظ التعديلات', 'Save Changes') : t('إنشاء الحساب', 'Create Account')}
            </PrimaryBtn>
          </>
        }
      >
        <form id="sa-form" onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('الاسم الكامل', 'Full Name')}>
              <TextInput required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="أحمد السديري" />
            </Field>
            <Field label={t('رقم الجوال', 'Phone')}>
              <TextInput required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} dir="ltr" placeholder="+966 5x xxx xxxx" />
            </Field>
          </div>
          <Field label={t('البريد الإلكتروني (لتسجيل الدخول)', 'Login Email')}>
            <TextInput required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} dir="ltr" placeholder="name@tharwah.com" />
          </Field>
          <Field label={t('كلمة المرور المؤقتة', 'Temporary Password')} hint={t('يُنصح بمطالبة المشرف بتغييرها عند أول دخول', 'Recommend requiring a change on first sign-in')}>
            <div className="relative">
              <TextInput required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} dir="ltr" style={{ paddingInlineStart: 34 }} />
              <KeyRound className="absolute top-1/2 -translate-y-1/2 text-text-muted" style={{ insetInlineStart: 10, width: 14, height: 14 }} />
            </div>
          </Field>
          <div>
            <label className="block text-[11px] font-bold text-text-muted mb-2">{t('الأقسام المصرّح بالوصول إليها', 'Allowed sections')}</label>
            <div className="grid grid-cols-3 gap-2">
              {PERMISSIONS.map(p => {
                const checked = form.permissions.includes(p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => togglePerm(p.key)}
                    className="rounded-lg border p-2.5 text-center transition-all duration-150"
                    style={{
                      borderColor: checked ? '#C9A84C' : '#E2E8F0',
                      background: checked ? 'rgba(201,168,76,0.08)' : 'transparent',
                      color: checked ? '#B8912F' : '#64748B',
                    }}
                  >
                    <div className="text-base">{p.icon}</div>
                    <div className="text-[11px] font-bold mt-1">{lang === 'ar' ? p.ar : p.en}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          setSubAdmins(prev => prev.filter(s => s.id !== deleting!.id));
          addAuditEntry('admin@tharwah.com', `حذف المشرف ${deleting!.name}`, `Deleted sub-admin ${deleting!.name}`);
          show(t('تم حذف المشرف الفرعي نهائياً', 'Sub-admin permanently deleted'));
        }}
        title={t('حذف مشرف فرعي', 'Delete Sub-Admin')}
        message={t(`سيفقد ${deleting?.name} الوصول للوحة التحكم فوراً ولن يتمكن من تسجيل الدخول مجدداً.`, `${deleting?.name} will immediately lose admin panel access and won't be able to sign in again.`)}
        confirmText={t('حذف نهائي', 'Delete Permanently')}
      />
      {ToastView}
    </div>
  );
}
