// ─────────────────────────────────────────────────────────────
// SubAdmins - SECURE v2 - No plaintext passwords
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import { Plus, Eye, Pencil, Trash2, Shield, Key } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useSubAdmins, SubAdmin, nextCode, addAuditEntry } from '@/lib/adminData';
import {
  PageHeader, Panel, Pill, StatCard, SearchInput, FilterTabs,
  Modal, ConfirmDialog, Field, TextInput, SelectBox, PrimaryBtn,
  GhostBtn, IconBtn, EmptyState, DataTable, Tr, Td, useToast,
  ClientAvatar,
} from '@/components/admin/ui';
import { hashPassword, generateSalt } from '@/lib/crypto';
import { emailSchema, phoneSchema } from '@/lib/validations';
import { sanitizeEmail, sanitizeInput } from '@/lib/security';
import { logger } from '@/lib/logger';

const EMPTY_FORM = { name: '', email: '', phone: '', password: '', permissions: [] as string[] };

const PERMISSIONS = [
  { id: 'clients', ar: 'العملاء', en: 'Clients' },
  { id: 'portfolios', ar: 'المحافظ', en: 'Portfolios' },
  { id: 'transactions', ar: 'العمليات', en: 'Transactions' },
  { id: 'messages', ar: 'الرسائل', en: 'Messages' },
  { id: 'content', ar: 'المحتوى', en: 'Content' },
  { id: 'reports', ar: 'التقارير', en: 'Reports' },
];

export function SubAdmins() {
  const { t, lang } = useLang();
  const [subAdmins, setSubAdmins] = useSubAdmins();
  const { show, ToastView } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubAdmin | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleting, setDeleting] = useState<SubAdmin | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const counts = useMemo(() => ({
    all: subAdmins.length,
    active: subAdmins.filter(s => s.status === 'active').length,
    suspended: subAdmins.filter(s => s.status === 'suspended').length,
  }), [subAdmins]);

  const filtered = useMemo(() => subAdmins.filter(s => {
    const q = search.trim().toLowerCase();
    const okQ = !q || s.name.includes(search) || s.email.toLowerCase().includes(q) || s.phone.includes(q);
    const okS = statusFilter === 'all' || s.status === statusFilter;
    return okQ && okS;
  }), [subAdmins, search, statusFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (sa: SubAdmin) => {
    setEditing(sa);
    setForm({ name: sa.name, email: sa.email, phone: sa.phone, password: '', permissions: [...sa.permissions] });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (!form.name.trim() || form.name.length < 2) {
        show(t('الاسم قصير جداً', 'Name too short'), 'error');
        setIsSubmitting(false);
        return;
      }

      const emailValidation = emailSchema.safeParse(form.email);
      if (!emailValidation.success) {
        show(t('بريد إلكتروني غير صالح', 'Invalid email'), 'error');
        setIsSubmitting(false);
        return;
      }

      const sanitizedEmail = sanitizeEmail(form.email);
      
      // Check duplicate (excluding self when editing)
      const duplicate = subAdmins.find(s => s.email.toLowerCase() === sanitizedEmail.toLowerCase() && s.id !== editing?.id);
      if (duplicate) {
        show(t('البريد الإلكتروني مسجل مسبقاً', 'Email already registered'), 'error');
        setIsSubmitting(false);
        return;
      }

      if (form.permissions.length === 0) {
        show(t('يجب اختيار صلاحية واحدة على الأقل', 'Select at least one permission'), 'error');
        setIsSubmitting(false);
        return;
      }

      // Password required for new, optional for edit
      if (!editing && (!form.password || form.password.length < 8)) {
        show(t('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'Password must be at least 8 characters'), 'error');
        setIsSubmitting(false);
        return;
      }

      if (form.password && form.password.length > 0 && form.password.length < 8) {
        show(t('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'Password must be at least 8 characters'), 'error');
        setIsSubmitting(false);
        return;
      }

      if (editing) {
        // Update existing
        let updatedAdmins: SubAdmin[];
        
        if (form.password && form.password.length >= 8) {
          // Hash new password
          const salt = generateSalt();
          const { hash } = await hashPassword(form.password, salt);
          
          updatedAdmins = subAdmins.map(sa => 
            sa.id === editing.id 
              ? { 
                  ...sa, 
                  name: sanitizeInput(form.name),
                  email: sanitizedEmail,
                  phone: form.phone.trim(),
                  passwordHash: hash,
                  salt,
                  permissions: form.permissions,
                  password: undefined, // Remove legacy
                }
              : sa
          );
          logger.audit(sanitizedEmail, 'sub_admin_password_changed');
        } else {
          updatedAdmins = subAdmins.map(sa => 
            sa.id === editing.id 
              ? { 
                  ...sa, 
                  name: sanitizeInput(form.name),
                  email: sanitizedEmail,
                  phone: form.phone.trim(),
                  permissions: form.permissions,
                }
              : sa
          );
        }
        
        setSubAdmins(updatedAdmins);
        addAuditEntry('super_admin', `تعديل مشرف فرعي ${form.name}`, `Updated sub-admin ${form.name}`);
        show(t('تم تحديث المشرف بنجاح', 'Sub-admin updated successfully'));
      } else {
        // Create new with hashed password
        const salt = generateSalt();
        const { hash } = await hashPassword(form.password, salt);
        
        const newAdmin: SubAdmin = {
          id: nextCode(subAdmins, 'SA'),
          name: sanitizeInput(form.name),
          email: sanitizedEmail,
          phone: form.phone.trim(),
          passwordHash: hash,
          salt,
          permissions: form.permissions,
          status: 'active',
          lastActive: '—',
          createdAt: new Date().toISOString().slice(0, 10),
        };
        
        setSubAdmins(prev => [newAdmin, ...prev]);
        addAuditEntry('super_admin', `إضافة مشرف فرعي ${form.name}`, `Added sub-admin ${form.name}`);
        show(t('تمت إضافة المشرف بنجاح', 'Sub-admin added successfully'));
        logger.audit(sanitizedEmail, 'sub_admin_created', { permissions: form.permissions.length });
      }

      setModalOpen(false);
      setForm(EMPTY_FORM);
      setEditing(null);
    } catch (error: any) {
      logger.error('Failed to save sub-admin', error);
      show(t('حدث خطأ أثناء الحفظ', 'Error while saving'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = (sa: SubAdmin) => {
    const nextStatus = sa.status === 'active' ? 'suspended' : 'active';
    setSubAdmins(prev => prev.map(s => s.id === sa.id ? { ...s, status: nextStatus } : s));
    
    if (nextStatus === 'suspended') {
      localStorage.setItem('tharwah_force_logout', '1');
    }
    
    addAuditEntry('super_admin', 
      nextStatus === 'suspended' ? `إيقاف مشرف ${sa.name}` : `تفعيل مشرف ${sa.name}`,
      nextStatus === 'suspended' ? `Suspended ${sa.name}` : `Activated ${sa.name}`
    );
    show(nextStatus === 'suspended' ? t('تم إيقاف المشرف', 'Admin suspended') : t('تم تفعيل المشرف', 'Admin activated'));
  };

  const handleDelete = () => {
    if (!deleting) return;
    setSubAdmins(prev => prev.filter(s => s.id !== deleting.id));
    localStorage.setItem('tharwah_force_logout', '1');
    addAuditEntry('super_admin', `حذف مشرف فرعي ${deleting.name}`, `Deleted sub-admin ${deleting.name}`);
    show(t('تم حذف المشرف', 'Admin deleted'));
    logger.audit(deleting.email, 'sub_admin_deleted');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('إدارة المشرفين الفرعيين', 'Sub-Admins Management')}
        subtitle={t('إضافة مشرفين فرعيين وتحديد صلاحياتهم — كلمات المرور مشفرة وآمنة', 'Add sub-admins with encrypted secure passwords')}
        actions={
          <>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D97E]/10 border border-[#00D97E]/20 text-[10px] font-bold text-[#00D97E]">
              <Shield className="w-3 h-3" />
              SECURE v2 - Hashed Passwords
            </div>
            <PrimaryBtn icon={Plus} onClick={openAdd}>{t('إضافة مشرف', 'Add Admin')}</PrimaryBtn>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label={t('إجمالي المشرفين', 'Total Admins')} value={counts.all} icon="👥" color="#3B82F6" />
        <StatCard label={t('نشطون', 'Active')} value={counts.active} icon="✅" color="#00D97E" />
        <StatCard label={t('موقوفون', 'Suspended')} value={counts.suspended} icon="🚫" color="#FF4560" />
      </div>

      <Panel className="flex flex-col md:flex-row md:items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder={t('بحث بالاسم أو البريد...', 'Search by name or email...')} className="md:max-w-sm" />
        <div className="md:ms-auto">
          <FilterTabs
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: t('الكل', 'All'), count: counts.all },
              { value: 'active', label: t('نشط', 'Active'), count: counts.active },
              { value: 'suspended', label: t('موقوف', 'Suspended'), count: counts.suspended },
            ]}
          />
        </div>
      </Panel>

      <Panel padded={false}>
        {filtered.length === 0 ? (
          <EmptyState text={t('لا يوجد مشرفون', 'No admins found')} icon="👥" />
        ) : (
          <DataTable headers={[t('المشرف', 'Admin'), t('التواصل', 'Contact'), t('الصلاحيات', 'Permissions'), t('الحالة', 'Status'), t('آخر نشاط', 'Last Active'), t('العمليات', 'Actions')]}>
            {filtered.map(sa => (
              <Tr key={sa.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <ClientAvatar name={sa.name} idSeed={sa.id} size={32} />
                    <div>
                      <div className="font-bold text-text-primary">{sa.name}</div>
                      <div className="text-[10px] text-text-muted font-mono">{sa.id}</div>
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="font-mono text-[11px]">{sa.email}</div>
                  <div className="text-[10px] text-text-muted" dir="ltr">{sa.phone}</div>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {sa.permissions.slice(0, 3).map(p => (
                      <Pill key={p} text={p} color="#0EA5E9" />
                    ))}
                    {sa.permissions.length > 3 && <Pill text={`+${sa.permissions.length - 3}`} color="#94A3B8" />}
                  </div>
                </Td>
                <Td>
                  <Pill text={sa.status === 'active' ? t('نشط', 'Active') : t('موقوف', 'Suspended')} color={sa.status === 'active' ? '#00D97E' : '#FF4560'} dot />
                </Td>
                <Td mono>{sa.lastActive}</Td>
                <Td>
                  <div className="flex items-center gap-0.5">
                    <IconBtn icon={Pencil} label={t('تعديل', 'Edit')} onClick={() => openEdit(sa)} />
                    <IconBtn icon={sa.status === 'active' ? Shield : Shield} label={sa.status === 'active' ? t('إيقاف', 'Suspend') : t('تفعيل', 'Activate')} onClick={() => toggleStatus(sa)} hoverColor={sa.status === 'active' ? '#F59E0B' : '#00D97E'} />
                    <IconBtn icon={Trash2} label={t('حذف', 'Delete')} onClick={() => setDeleting(sa)} hoverColor="#FF4560" />
                  </div>
                </Td>
              </Tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('تعديل مشرف', 'Edit Admin') : t('إضافة مشرف فرعي', 'Add Sub-Admin')}
        icon={Shield}
        footer={
          <>
            <GhostBtn onClick={() => setModalOpen(false)}>{t('إلغاء', 'Cancel')}</GhostBtn>
            <PrimaryBtn 
              onClick={() => (document.getElementById('subadmin-form') as HTMLFormElement)?.requestSubmit()} 
              icon={Key}
              color="#00D97E"
            >
              {isSubmitting ? t('جاري الحفظ...', 'Saving...') : editing ? t('تحديث', 'Update') : t('إضافة', 'Add')}
            </PrimaryBtn>
          </>
        }
      >
        <form id="subadmin-form" onSubmit={handleSave} className="space-y-4">
          <Field label={t('الاسم الكامل', 'Full Name')}>
            <TextInput required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} maxLength={100} />
          </Field>
          
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('البريد الإلكتروني', 'Email')}>
              <TextInput required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} dir="ltr" maxLength={254} />
            </Field>
            <Field label={t('الهاتف', 'Phone')}>
              <TextInput required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} dir="ltr" maxLength={20} />
            </Field>
          </div>

          <Field label={editing ? t('كلمة المرور الجديدة (اتركه فارغاً للاحتفاظ بالحالية)', 'New Password (leave empty to keep current)') : t('كلمة المرور', 'Password')}>
            <div className="relative">
              <Key className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" style={{ insetInlineStart: 10 }} />
              <TextInput 
                required={!editing} 
                type="password" 
                value={form.password} 
                onChange={e => setForm({ ...form, password: e.target.value })} 
                dir="ltr" 
                style={{ paddingInlineStart: 34 }} 
                placeholder={editing ? '••••••••' : t('8 أحرف على الأقل', 'Min 8 chars')}
                maxLength={128}
              />
            </div>
            <p className="text-[10px] text-[#00D97E] mt-1 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {t('سيتم تشفير كلمة المرور بـ PBKDF2 + SHA-256', 'Password will be encrypted with PBKDF2 + SHA-256')}
            </p>
          </Field>

          <Field label={t('الصلاحيات', 'Permissions')}>
            <div className="grid grid-cols-2 gap-2">
              {PERMISSIONS.map(perm => (
                <label key={perm.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E2E8F0] hover:border-[#0EA5E9]/30 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(perm.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setForm({ ...form, permissions: [...form.permissions, perm.id] });
                      } else {
                        setForm({ ...form, permissions: form.permissions.filter(p => p !== perm.id) });
                      }
                    }}
                    className="w-4 h-4 rounded border-[#CBD5E1] text-[#0EA5E9] focus:ring-[#0EA5E9]/20"
                  />
                  <span className="text-xs font-medium text-text-primary">{lang === 'ar' ? perm.ar : perm.en}</span>
                </label>
              ))}
            </div>
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title={t('حذف المشرف', 'Delete Admin')}
        message={t(`سيتم حذف المشرف ${deleting?.name} نهائياً — سيتم تسجيل خروجه فوراً.`, `Admin ${deleting?.name} will be deleted permanently — will be logged out immediately.`)}
        confirmText={t('حذف', 'Delete')}
      />

      {ToastView}
    </div>
  );
}
