// ─────────────────────────────────────────────────────────────
// 4.6 — Transactions إدارة المعاملات والعمليات المالية
// الموافقة/الرفض + تصدير + تصفية متقدمة
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import { Check, X, Plus } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useTransactions, useClients, AdminTransaction, nextCode, addAuditEntry } from '@/lib/adminData';
import {
  PageHeader, Panel, Pill, StatCard, SearchInput, FilterTabs,
  Modal, Field, TextInput, SelectBox, PrimaryBtn, GhostBtn,
  EmptyState, DataTable, Tr, Td, useToast, exportCSV, ClientAvatar,
} from '@/components/admin/ui';

const TYPE_STYLE: Record<string, { ar: string; en: string; color: string }> = {
  deposit: { ar: 'إيداع', en: 'Deposit', color: '#00D97E' },
  withdraw: { ar: 'سحب', en: 'Withdrawal', color: '#FF4560' },
  buy: { ar: 'شراء', en: 'Buy', color: '#3B82F6' },
  sell: { ar: 'بيع', en: 'Sell', color: '#F59E0B' },
  transfer: { ar: 'تحويل', en: 'Transfer', color: '#8B5CF6' },
};
const STATUS_STYLE: Record<string, { ar: string; en: string; color: string }> = {
  completed: { ar: 'مكتملة', en: 'Completed', color: '#00D97E' },
  pending: { ar: 'بانتظار الموافقة', en: 'Pending', color: '#F59E0B' },
  rejected: { ar: 'مرفوضة', en: 'Rejected', color: '#FF4560' },
};

export function Transactions() {
  const { t, lang } = useLang();
  const [txs, setTxs] = useTransactions();
  const [clients] = useClients();
  const { show, ToastView } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ clientId: '', type: 'deposit', amount: '', method: 'تحويل بنكي', note: '' });

  const clientOf = (id: string) => clients.find(c => c.id === id);

  const counts = useMemo(() => ({
    all: txs.length,
    pending: txs.filter(x => x.status === 'pending').length,
    completed: txs.filter(x => x.status === 'completed').length,
    deposits: txs.filter(x => x.type === 'deposit' && x.status === 'completed').reduce((s, x) => s + x.amount, 0),
    withdrawals: txs.filter(x => x.type === 'withdraw' && x.status === 'completed').reduce((s, x) => s + x.amount, 0),
  }), [txs]);

  const filtered = useMemo(() => txs.filter(x => {
    const c = clientOf(x.clientId);
    const q = search.trim().toLowerCase();
    const okQ = !q || x.id.toLowerCase().includes(q) || (c && (c.name.includes(search) || c.nameEn.toLowerCase().includes(q))) || x.note.includes(search);
    const okS = statusFilter === 'all' || x.status === statusFilter;
    const okT = typeFilter === 'all' || x.type === typeFilter;
    return okQ && okS && okT;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [txs, clients, search, statusFilter, typeFilter]);

  const approve = (id: string) => {
    setTxs(prev => prev.map(x => x.id === id ? { ...x, status: 'completed' } : x));
    addAuditEntry('admin@tharwah.com', `اعتماد معاملة ${id}`, `Approved transaction ${id}`);
    show(t(`تم اعتماد المعاملة ${id}`, `Transaction ${id} approved`));
  };

  const reject = (id: string) => {
    setTxs(prev => prev.map(x => x.id === id ? { ...x, status: 'rejected' } : x));
    addAuditEntry('admin@tharwah.com', `رفض معاملة ${id}`, `Rejected transaction ${id}`);
    show(t(`تم رفض المعاملة ${id}`, `Transaction ${id} rejected`), 'error');
  };

  const approveAll = () => {
    setTxs(prev => prev.map(x => x.status === 'pending' ? { ...x, status: 'completed' } : x));
    show(t('تم اعتماد جميع المعاملات المعلقة', 'All pending transactions approved'));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const tx: AdminTransaction = {
      id: nextCode(txs, 'TX'),
      clientId: form.clientId,
      type: form.type as AdminTransaction['type'],
      amount: Number(form.amount),
      currency: 'SAR',
      status: 'pending',
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      method: form.method,
      note: form.note || t('عملية مسجلة يدوياً', 'Manually recorded transaction'),
      noteEn: form.note || 'Manually recorded transaction',
    };
    setTxs(prev => [tx, ...prev]);
    setAddOpen(false);
    setForm({ clientId: '', type: 'deposit', amount: '', method: 'تحويل بنكي', note: '' });
    show(t('تم تسجيل العملية — بانتظار الاعتماد', 'Transaction recorded — pending approval'));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('إدارة العمليات والمعاملات', 'Transactions Management')}
        subtitle={t('مراجعة واعتماد الإيداعات والسحوبات وصفقات البيع والشراء', 'Review and approve deposits, withdrawals, and trade orders')}
        actions={
          <>
            {counts.pending > 0 && <GhostBtn icon={Check} onClick={approveAll}>{t(`اعتماد الكل (${counts.pending})`, `Approve All (${counts.pending})`)}</GhostBtn>}
            <GhostBtn onClick={() => exportCSV('transactions.csv',
              ['ID', 'Client', 'Type', 'Amount', 'Currency', 'Status', 'Method', 'Date'],
              filtered.map(x => [x.id, lang === 'ar' ? clientOf(x.clientId)?.name || '' : clientOf(x.clientId)?.nameEn || '', x.type, x.amount, x.currency, x.status, x.method, x.date])
            )}>{t('تصدير CSV', 'Export CSV')}</GhostBtn>
            <PrimaryBtn icon={Plus} onClick={() => setAddOpen(true)}>{t('تسجيل عملية', 'New Transaction')}</PrimaryBtn>
          </>
        }
      />

      {/* إحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t('إجمالي الإيداعات المكتملة (ر.س)', 'Completed Deposits (SAR)')} value={counts.deposits.toLocaleString()} icon="💰" color="#00D97E" />
        <StatCard label={t('إجمالي السحوبات المكتملة (ر.س)', 'Completed Withdrawals (SAR)')} value={counts.withdrawals.toLocaleString()} icon="🏦" color="#FF4560" />
        <StatCard label={t('بانتظار المراجعة', 'Needs Review')} value={counts.pending} icon="📋" color="#F59E0B" />
        <StatCard label={t('إجمالي العمليات', 'Total Transactions')} value={counts.all} icon="⚡" color="#0EA5E9" />
      </div>

      {/* التصفية */}
      <Panel className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder={t('بحث برقم العملية أو العميل أو الملاحظة...', 'Search by ID, client or note...')} className="md:max-w-sm" />
          <div className="md:ms-auto">
            <FilterTabs
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: t('كل الحالات', 'All'), count: counts.all },
                { value: 'pending', label: t('معلقة', 'Pending'), count: counts.pending },
                { value: 'completed', label: t('مكتملة', 'Completed'), count: counts.completed },
                { value: 'rejected', label: t('مرفوضة', 'Rejected'), count: txs.filter(x => x.status === 'rejected').length },
              ]}
            />
          </div>
        </div>
        <FilterTabs
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: 'all', label: t('كل الأنواع', 'All Types') },
            ...Object.entries(TYPE_STYLE).map(([k, v]) => ({ value: k, label: lang === 'ar' ? v.ar : v.en })),
          ]}
        />
      </Panel>

      {/* الجدول */}
      <Panel padded={false}>
        {filtered.length === 0 ? (
          <EmptyState icon="🧾" text={t('لا توجد معاملات مطابقة', 'No transactions match')} />
        ) : (
          <DataTable headers={[t('المعرف', 'ID'), t('العميل', 'Client'), t('النوع', 'Type'), t('المبلغ', 'Amount'), t('الوسيلة', 'Method'), t('الحالة', 'Status'), t('التاريخ', 'Date'), t('إجراءات', 'Actions')]}>
            {filtered.map(tx => {
              const c = clientOf(tx.clientId);
              return (
                <Tr key={tx.id}>
                  <Td mono bold>{tx.id}</Td>
                  <Td>
                    {c ? (
                      <div className="flex items-center gap-2">
                        <ClientAvatar name={lang === 'ar' ? c.name : c.nameEn} idSeed={c.id} size={24} />
                        <span className="font-semibold text-text-primary">{lang === 'ar' ? c.name : c.nameEn}</span>
                      </div>
                    ) : '—'}
                  </Td>
                  <Td><Pill text={lang === 'ar' ? TYPE_STYLE[tx.type].ar : TYPE_STYLE[tx.type].en} color={TYPE_STYLE[tx.type].color} /></Td>
                  <Td mono bold>{tx.amount.toLocaleString()} <span className="text-text-muted font-normal text-[10px]">{tx.currency}</span></Td>
                  <Td>{tx.method}</Td>
                  <Td><Pill text={lang === 'ar' ? STATUS_STYLE[tx.status].ar : STATUS_STYLE[tx.status].en} color={STATUS_STYLE[tx.status].color} dot /></Td>
                  <Td mono>{tx.date}</Td>
                  <Td>
                    {tx.status === 'pending' ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => approve(tx.id)} className="px-2.5 py-1 rounded-md bg-[#00B894] hover:bg-[#00A07F] text-white text-[10px] font-bold flex items-center gap-1 transition-colors">
                          <Check className="w-3 h-3" /> {t('قبول', 'Approve')}
                        </button>
                        <button onClick={() => reject(tx.id)} className="px-2.5 py-1 rounded-md bg-[#FF4560] hover:bg-[#E03A50] text-white text-[10px] font-bold flex items-center gap-1 transition-colors">
                          <X className="w-3 h-3" /> {t('رفض', 'Reject')}
                        </button>
                      </div>
                    ) : (
                      <span className="text-text-muted text-[11px]">—</span>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </DataTable>
        )}
      </Panel>

      {/* تسجيل عملية */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t('تسجيل عملية مالية جديدة', 'Record New Transaction')}
        icon={Plus}
        footer={
          <>
            <GhostBtn onClick={() => setAddOpen(false)}>{t('إلغاء', 'Cancel')}</GhostBtn>
            <PrimaryBtn onClick={() => (document.getElementById('add-tx-form') as HTMLFormElement)?.requestSubmit()}>{t('حفظ العملية', 'Save')}</PrimaryBtn>
          </>
        }
      >
        <form id="add-tx-form" onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
          <Field label={t('العميل', 'Client')}>
            <SelectBox required value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}
              options={[{ value: '', label: t('اختر العميل...', 'Select client...') }, ...clients.map(c => ({ value: c.id, label: `${lang === 'ar' ? c.name : c.nameEn} (${c.id})` }))]} />
          </Field>
          <Field label={t('نوع العملية', 'Type')}>
            <SelectBox value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              options={Object.entries(TYPE_STYLE).map(([k, v]) => ({ value: k, label: lang === 'ar' ? v.ar : v.en }))} />
          </Field>
          <Field label={t('المبلغ (ر.س)', 'Amount (SAR)')}>
            <TextInput required type="number" min="1" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} dir="ltr" />
          </Field>
          <Field label={t('وسيلة التنفيذ', 'Method')}>
            <SelectBox value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}
              options={[
                { value: 'تحويل بنكي', label: t('تحويل بنكي', 'Bank Transfer') },
                { value: 'شيك مصدق', label: t('شيك مصدق', 'Certified Check') },
                { value: 'محفظة داخلية', label: t('محفظة داخلية', 'Internal Wallet') },
                { value: 'تحويل داخلي', label: t('تحويل داخلي', 'Internal Transfer') },
              ]} />
          </Field>
          <div className="col-span-2">
            <Field label={t('ملاحظة', 'Note')}>
              <TextInput value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder={t('وصف مختصر للعملية...', 'Short description...')} />
            </Field>
          </div>
        </form>
      </Modal>
      {ToastView}
    </div>
  );
}
