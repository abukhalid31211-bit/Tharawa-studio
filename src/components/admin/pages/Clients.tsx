// ─────────────────────────────────────────────────────────────
// 4.4 — Clients إدارة العملاء والحسابات
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Eye, Pencil, Trash2, UserCheck, UserX } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useClients, Client, ClientStatus, nextCode } from '@/lib/adminData';
import {
  PageHeader, Panel, Pill, StatCard, SearchInput, FilterTabs,
  Modal, ConfirmDialog, Field, TextInput, SelectBox, PrimaryBtn,
  GhostBtn, IconBtn, EmptyState, DataTable, Tr, Td, useToast,
  exportCSV, ClientAvatar,
} from '@/components/admin/ui';

const STATUS_STYLES: Record<ClientStatus, { color: string; ar: string; en: string }> = {
  active: { color: '#00D97E', ar: 'نشط', en: 'Active' },
  pending: { color: '#F59E0B', ar: 'بانتظار الاعتماد', en: 'Pending' },
  suspended: { color: '#FF4560', ar: 'موقوف', en: 'Suspended' },
};

const TIER_COLORS: Record<string, string> = {
  Regular: '#64748B', Silver: '#94A3B8', Gold: '#C9A84C', Platinum: '#8B5CF6', VIP: '#EC4899',
};

const EMPTY_FORM = { name: '', nameEn: '', email: '', phone: '', country: 'السعودية', tier: 'Regular', riskProfile: 'متوازن', initialBalance: '' };

export function Clients() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [clients, setClients] = useClients();
  const { show, ToastView } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleting, setDeleting] = useState<Client | null>(null);

  const counts = useMemo(() => ({
    all: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    pending: clients.filter(c => c.status === 'pending').length,
    suspended: clients.filter(c => c.status === 'suspended').length,
    balances: clients.reduce((s, c) => s + c.balance, 0),
  }), [clients]);

  const filtered = useMemo(() => clients.filter(c => {
    const q = search.trim().toLowerCase();
    const okQ = !q || c.name.includes(search) || c.nameEn.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.phone.includes(q);
    const okS = statusFilter === 'all' || c.status === statusFilter;
    return okQ && okS;
  }), [clients, search, statusFilter]);

  const approve = (c: Client) => {
    setClients(prev => prev.map(x => x.id === c.id ? { ...x, status: 'active' } : x));
    show(t(`تم اعتماد حساب ${c.name}`, `${c.nameEn}'s account approved`));
  };

  const toggleSuspend = (c: Client) => {
    const next: ClientStatus = c.status === 'suspended' ? 'active' : 'suspended';
    setClients(prev => prev.map(x => x.id === c.id ? { ...x, status: next } : x));
    show(next === 'suspended' ? t('تم إيقاف الحساب', 'Account suspended') : t('تم تفعيل الحساب', 'Account activated'));
  };

  const handleDelete = () => {
    if (!deleting) return;
    setClients(prev => prev.filter(x => x.id !== deleting.id));
    show(t('تم حذف العميل نهائياً', 'Client permanently deleted'));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Client = {
      id: nextCode(clients, 'C'),
      name: form.name,
      nameEn: form.nameEn || form.name,
      email: form.email,
      phone: form.phone,
      nationalId: '—',
      country: form.country,
      countryEn: form.country === 'السعودية' ? 'Saudi Arabia' : form.country,
      city: '—',
      tier: form.tier as Client['tier'],
      status: 'pending',
      balance: Number(form.initialBalance) || 0,
      riskProfile: form.riskProfile,
      riskProfileEn: form.riskProfile,
      advisor: '—', advisorEn: '—',
      joinDate: new Date().toISOString().slice(0, 10),
      lastActivity: t('الآن', 'Now'),
    };
    setClients(prev => [newClient, ...prev]);
    setAddOpen(false);
    setForm(EMPTY_FORM);
    show(t('تمت إضافة العميل بنجاح — بانتظار الاعتماد', 'Client added — pending approval'));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('إدارة العملاء والحسابات', 'Clients & Accounts')}
        subtitle={t('مراقبة حسابات المستثمرين واعتماد التسجيلات وإدارة مستويات العضوية', 'Monitor investor accounts, approve registrations, and manage membership tiers')}
        actions={
          <>
            <GhostBtn icon={undefined} onClick={() => exportCSV('clients.csv',
              ['ID', 'Name', 'Email', 'Phone', 'Tier', 'Status', 'Balance'],
              filtered.map(c => [c.id, lang === 'ar' ? c.name : c.nameEn, c.email, c.phone, c.tier, c.status, c.balance])
            )}>{t('تصدير CSV', 'Export CSV')}</GhostBtn>
            <PrimaryBtn icon={Plus} onClick={() => setAddOpen(true)}>{t('إضافة عميل جديد', 'Add New Client')}</PrimaryBtn>
          </>
        }
      />

      {/* إحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label={t('إجمالي العملاء', 'Total Clients')} value={counts.all} icon="👥" color="#3B82F6" />
        <StatCard label={t('عملاء نشطون', 'Active')} value={counts.active} icon="✅" color="#00D97E" />
        <StatCard label={t('بانتظار الاعتماد', 'Pending')} value={counts.pending} icon="⏳" color="#F59E0B" />
        <StatCard label={t('حسابات موقوفة', 'Suspended')} value={counts.suspended} icon="🚫" color="#FF4560" />
        <StatCard label={t('إجمالي الأرصدة (ر.س)', 'Total Balances (SAR)')} value={counts.balances.toLocaleString()} icon="💰" color="#C9A84C" />
      </div>

      {/* أدوات التصفية */}
      <Panel className="flex flex-col md:flex-row md:items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder={t('بحث بالاسم أو البريد أو الجوال أو المعرف...', 'Search by name, email, phone or ID...')} className="md:max-w-sm" />
        <div className="md:ms-auto">
          <FilterTabs
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: t('الكل', 'All'), count: counts.all },
              { value: 'active', label: t('نشط', 'Active'), count: counts.active },
              { value: 'pending', label: t('معلق', 'Pending'), count: counts.pending },
              { value: 'suspended', label: t('موقوف', 'Suspended'), count: counts.suspended },
            ]}
          />
        </div>
      </Panel>

      {/* الجدول */}
      <Panel padded={false}>
        {filtered.length === 0 ? (
          <EmptyState text={t('لا يوجد عملاء مطابقون للبحث', 'No clients match your search')} icon="🔍" />
        ) : (
          <DataTable headers={[t('العميل', 'Client'), t('التواصل', 'Contact'), t('العضوية', 'Tier'), t('الرصيد', 'Balance'), t('الحالة', 'Status'), t('التسجيل', 'Joined'), t('العمليات', 'Actions')]}>
            {filtered.map(c => {
              const st = STATUS_STYLES[c.status];
              return (
                <Tr key={c.id} onClick={() => navigate({ to: '/Akadmin/clients/$clientId', params: { clientId: c.id } })}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <ClientAvatar name={lang === 'ar' ? c.name : c.nameEn} idSeed={c.id} size={30} />
                      <div className="min-w-0">
                        <div className="font-bold text-text-primary truncate">{lang === 'ar' ? c.name : c.nameEn}</div>
                        <div className="text-[10px] text-text-muted font-mono">{c.id}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="font-mono text-[11px]">{c.email}</div>
                    <div className="text-[10px] text-text-muted font-mono mt-0.5" dir="ltr">{c.phone}</div>
                  </Td>
                  <Td><Pill text={c.tier} color={TIER_COLORS[c.tier]} /></Td>
                  <Td mono bold>{c.balance.toLocaleString()} <span className="text-text-muted font-normal">SAR</span></Td>
                  <Td><Pill text={lang === 'ar' ? st.ar : st.en} color={st.color} dot /></Td>
                  <Td mono>{c.joinDate}</Td>
                  <Td>
                    <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                      <IconBtn icon={Eye} label={t('عرض الملف', 'View profile')} onClick={() => navigate({ to: '/Akadmin/clients/$clientId', params: { clientId: c.id } })} />
                      {c.status === 'pending' && (
                        <IconBtn icon={UserCheck} label={t('اعتماد الحساب', 'Approve account')} onClick={() => approve(c)} hoverColor="#00D97E" />
                      )}
                      <IconBtn icon={UserX} label={c.status === 'suspended' ? t('تفعيل', 'Activate') : t('إيقاف', 'Suspend')} onClick={() => toggleSuspend(c)} hoverColor="#F59E0B" />
                      <IconBtn icon={Trash2} label={t('حذف', 'Delete')} onClick={() => setDeleting(c)} hoverColor="#FF4560" />
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </DataTable>
        )}
      </Panel>

      {/* نموذج إضافة عميل */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t('إضافة مستثمر جديد', 'Add New Investor')}
        icon={Plus}
        footer={
          <>
            <GhostBtn onClick={() => setAddOpen(false)}>{t('إلغاء', 'Cancel')}</GhostBtn>
            <PrimaryBtn onClick={() => (document.getElementById('add-client-form') as HTMLFormElement)?.requestSubmit()}>{t('حفظ العميل', 'Save Client')}</PrimaryBtn>
          </>
        }
      >
        <form id="add-client-form" onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
          <Field label={t('الاسم الكامل (عربي)', 'Full Name (Arabic)')}>
            <TextInput required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="أحمد الغامدي" />
          </Field>
          <Field label={t('الاسم (إنجليزي)', 'Name (English)')}>
            <TextInput value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} placeholder="Ahmed Al-Ghamdi" dir="ltr" />
          </Field>
          <Field label={t('البريد الإلكتروني', 'Email')}>
            <TextInput required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="client@example.com" dir="ltr" />
          </Field>
          <Field label={t('رقم الجوال', 'Phone')}>
            <TextInput required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+966 5x xxx xxxx" dir="ltr" />
          </Field>
          <Field label={t('الدولة', 'Country')}>
            <SelectBox value={form.country} onChange={e => setForm({ ...form, country: e.target.value })}
              options={['السعودية', 'الإمارات', 'الكويت', 'قطر', 'البحرين', 'عُمان'].map(c => ({ value: c, label: c }))} />
          </Field>
          <Field label={t('مستوى العضوية', 'Membership Tier')}>
            <SelectBox value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })}
              options={['Regular', 'Silver', 'Gold', 'Platinum', 'VIP'].map(tier => ({ value: tier, label: tier }))} />
          </Field>
          <Field label={t('الملف الاستثماري', 'Risk Profile')}>
            <SelectBox value={form.riskProfile} onChange={e => setForm({ ...form, riskProfile: e.target.value })}
              options={[
                { value: 'محافظ جداً', label: t('محافظ جداً', 'Very Conservative') },
                { value: 'محافظ', label: t('محافظ', 'Conservative') },
                { value: 'متوازن', label: t('متوازن', 'Balanced') },
                { value: 'نمو', label: t('نمو', 'Growth') },
                { value: 'نمو جريء', label: t('نمو جريء', 'Aggressive Growth') },
              ]} />
          </Field>
          <Field label={t('الرصيد الافتتاحي (ر.س)', 'Opening Balance (SAR)')}>
            <TextInput type="number" min="0" value={form.initialBalance} onChange={e => setForm({ ...form, initialBalance: e.target.value })} placeholder="0" dir="ltr" />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title={t('حذف العميل نهائياً', 'Delete Client Permanently')}
        message={t(`سيتم حذف حساب ${deleting?.name} وجميع بياناته المرتبطة. هذا الإجراء لا يمكن التراجع عنه.`, `This will permanently delete ${deleting?.nameEn}'s account and all linked data. This action cannot be undone.`)}
        confirmText={t('حذف نهائي', 'Delete Permanently')}
      />
      {ToastView}
    </div>
  );
}
