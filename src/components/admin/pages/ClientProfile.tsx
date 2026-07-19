// ─────────────────────────────────────────────────────────────
// 4.8 — ClientProfile الملف الشخصي للعميل
// البيانات الشخصية والمالية + المحفظة + سجل التواصل
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ArrowRight, ArrowLeft, Mail, Phone, MapPin, UserCheck, UserX, MessageSquare, Save } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useClients, usePortfolios, useTransactions, useMessages, relativeTime } from '@/lib/adminData';
import {
  Panel, PanelHeader, Pill, StatCard, FilterTabs, EmptyState,
  DataTable, Tr, Td, PrimaryBtn, GhostBtn, TextArea, useToast, ClientAvatar,
} from '@/components/admin/ui';

const TX_TYPE: Record<string, { ar: string; en: string; color: string }> = {
  deposit: { ar: 'إيداع', en: 'Deposit', color: '#00D97E' },
  withdraw: { ar: 'سحب', en: 'Withdrawal', color: '#FF4560' },
  buy: { ar: 'شراء', en: 'Buy', color: '#3B82F6' },
  sell: { ar: 'بيع', en: 'Sell', color: '#F59E0B' },
  transfer: { ar: 'تحويل', en: 'Transfer', color: '#8B5CF6' },
};
const TX_STATUS: Record<string, { ar: string; en: string; color: string }> = {
  completed: { ar: 'مكتمل', en: 'Completed', color: '#00D97E' },
  pending: { ar: 'معلق', en: 'Pending', color: '#F59E0B' },
  rejected: { ar: 'مرفوض', en: 'Rejected', color: '#FF4560' },
};

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#E2E8F0]/60 dark:border-border-default/60 last:border-0">
      <span className="text-[11px] text-text-muted">{label}</span>
      <span className={`text-xs font-semibold text-text-primary ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
  );
}

export function ClientProfile() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const { clientId } = useParams({ from: '/Akadmin/clients/$clientId' });
  const [clients, setClients] = useClients();
  const [portfolios] = usePortfolios();
  const [transactions] = useTransactions();
  const [messages] = useMessages();
  const { show, ToastView } = useToast();

  const [tab, setTab] = useState('overview');
  const [notesDraft, setNotesDraft] = useState<string | null>(null);

  const client = clients.find(c => c.id === clientId);
  const portfolio = portfolios.find(p => p.clientId === clientId);
  const clientTxs = useMemo(() => transactions.filter(tx => tx.clientId === clientId), [transactions, clientId]);
  const clientMsgs = useMemo(() => messages.filter(m => m.clientId === clientId), [messages, clientId]);

  if (!client) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate({ to: '/Akadmin/clients' })} className="text-xs text-[#0EA5E9] flex items-center gap-1 hover:underline">
          {lang === 'ar' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />} {t('العودة للعملاء', 'Back to Clients')}
        </button>
        <EmptyState icon="🙁" text={t('العميل غير موجود', 'Client not found')} sub={t('ربما حُذف الحساب أو تغيّر المعرف', 'The account may have been deleted or the ID changed')} />
      </div>
    );
  }

  const deposits = clientTxs.filter(x => x.type === 'deposit' && x.status === 'completed').reduce((s, x) => s + x.amount, 0);
  const withdrawals = clientTxs.filter(x => x.type === 'withdraw' && x.status === 'completed').reduce((s, x) => s + x.amount, 0);

  const toggleSuspend = () => {
    const next = client.status === 'suspended' ? 'active' : 'suspended';
    setClients(prev => prev.map(x => x.id === client.id ? { ...x, status: next } : x));
    show(next === 'suspended' ? t('تم إيقاف الحساب', 'Account suspended') : t('تم تفعيل الحساب', 'Account activated'));
  };

  const approve = () => {
    setClients(prev => prev.map(x => x.id === client.id ? { ...x, status: 'active' } : x));
    show(t('تم اعتماد الحساب', 'Account approved'));
  };

  const saveNotes = () => {
    if (notesDraft === null) return;
    setClients(prev => prev.map(x => x.id === client.id ? { ...x, notes: notesDraft } : x));
    setNotesDraft(null);
    show(t('تم حفظ الملاحظات', 'Notes saved'));
  };

  const statusColor = client.status === 'active' ? '#00D97E' : client.status === 'pending' ? '#F59E0B' : '#FF4560';

  return (
    <div className="space-y-5">
      {/* رأس الصفحة */}
      <button onClick={() => navigate({ to: '/Akadmin/clients' })} className="text-xs text-[#0EA5E9] flex items-center gap-1 hover:underline font-semibold">
        {lang === 'ar' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
        {t('العودة لقائمة العملاء', 'Back to Clients')}
      </button>

      <Panel className="flex flex-col lg:flex-row lg:items-center gap-5">
        <div className="flex items-center gap-4">
          <ClientAvatar name={lang === 'ar' ? client.name : client.nameEn} idSeed={client.id} size={64} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-text-primary">{lang === 'ar' ? client.name : client.nameEn}</h1>
              <span className="text-[11px] font-mono text-text-muted">{client.id}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <Pill text={client.tier} color="#C9A84C" />
              <Pill text={client.status === 'active' ? t('نشط', 'Active') : client.status === 'pending' ? t('بانتظار الاعتماد', 'Pending') : t('موقوف', 'Suspended')} color={statusColor} dot />
              <Pill text={lang === 'ar' ? client.riskProfile : client.riskProfileEn} color="#0EA5E9" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap lg:ms-auto">
          <GhostBtn icon={Mail} onClick={() => { window.location.href = `mailto:${client.email}`; }}>{t('مراسلة', 'Email')}</GhostBtn>
          <GhostBtn icon={MessageSquare} onClick={() => navigate({ to: '/Akadmin/messages' })}>{t('التذاكر', 'Tickets')}</GhostBtn>
          {client.status === 'pending' && (
            <PrimaryBtn icon={UserCheck} color="#00B894" colorHover="#00A87D" onClick={approve}>{t('اعتماد الحساب', 'Approve')}</PrimaryBtn>
          )}
          <GhostBtn icon={UserX} danger={client.status !== 'suspended'} onClick={toggleSuspend}>
            {client.status === 'suspended' ? t('تفعيل الحساب', 'Activate') : t('إيقاف الحساب', 'Suspend')}
          </GhostBtn>
        </div>
      </Panel>

      {/* إحصائيات مالية */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t('الرصيد الحالي (ر.س)', 'Current Balance (SAR)')} value={client.balance.toLocaleString()} icon="💰" color="#C9A84C" />
        <StatCard label={t('قيمة المحفظة (ر.س)', 'Portfolio Value (SAR)')} value={(portfolio?.value || 0).toLocaleString()} icon="💼" color="#0EA5E9" />
        <StatCard label={t('العائد التراكمي', 'Cumulative Return')} value={portfolio ? `%${portfolio.growth}+` : '—'} icon="📈" color="#00D97E" />
        <StatCard label={t('صافي التدفقات (ر.س)', 'Net Flows (SAR)')} value={(deposits - withdrawals).toLocaleString()} icon="⚖️" color="#3B82F6" />
      </div>

      {/* التبويبات */}
      <FilterTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'overview', label: t('نظرة عامة', 'Overview') },
          { value: 'portfolio', label: t('المحفظة الاستثمارية', 'Portfolio') },
          { value: 'transactions', label: t('المعاملات', 'Transactions'), count: clientTxs.length },
          { value: 'communication', label: t('سجل التواصل', 'Communication'), count: clientMsgs.length },
          { value: 'notes', label: t('ملاحظات المشرف', 'Admin Notes') },
        ]}
      />

      {/* ── نظرة عامة ── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Panel>
            <PanelHeader icon={UserCheck} iconColor="#3B82F6" title={t('البيانات الشخصية', 'Personal Information')} />
            <div className="mt-3">
              <InfoRow label={t('الاسم الكامل', 'Full Name')} value={lang === 'ar' ? client.name : client.nameEn} />
              <InfoRow label={t('رقم الهوية / الإقامة', 'National ID / Iqama')} value={client.nationalId} mono />
              <InfoRow label={t('البريد الإلكتروني', 'Email')} value={client.email} mono />
              <InfoRow label={t('الجوال', 'Phone')} value={client.phone} mono />
              <InfoRow label={t('الدولة / المدينة', 'Country / City')} value={`${lang === 'ar' ? client.country : client.countryEn} — ${client.city}`} />
              <InfoRow label={t('تاريخ التسجيل', 'Join Date')} value={client.joinDate} mono />
              <InfoRow label={t('آخر نشاط', 'Last Activity')} value={relativeTime(client.lastActivity, lang)} />
            </div>
          </Panel>
          <Panel>
            <PanelHeader icon={Phone} iconColor="#C9A84C" title={t('البيانات المالية والحساب', 'Financial & Account Data')} />
            <div className="mt-3">
              <InfoRow label={t('مستوى العضوية', 'Membership Tier')} value={client.tier} />
              <InfoRow label={t('الملف الاستثماري', 'Risk Profile')} value={lang === 'ar' ? client.riskProfile : client.riskProfileEn} />
              <InfoRow label={t('المستشار المعيّن', 'Assigned Advisor')} value={lang === 'ar' ? client.advisor : client.advisorEn} />
              <InfoRow label={t('إجمالي الإيداعات', 'Total Deposits')} value={`${deposits.toLocaleString()} SAR`} mono />
              <InfoRow label={t('إجمالي السحوبات', 'Total Withdrawals')} value={`${withdrawals.toLocaleString()} SAR`} mono />
              <InfoRow label={t('عدد المعاملات', 'Transactions Count')} value={String(clientTxs.length)} mono />
              <InfoRow label={t('تذاكر الدعم', 'Support Tickets')} value={String(clientMsgs.length)} mono />
            </div>
          </Panel>
        </div>
      )}

      {/* ── المحفظة ── */}
      {tab === 'portfolio' && (
        portfolio ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Panel className="lg:col-span-2" padded={false}>
              <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-border-default">
                <PanelHeader icon={undefined} title={lang === 'ar' ? portfolio.name : portfolio.nameEn} subtitle={lang === 'ar' ? portfolio.strategy : portfolio.strategyEn} />
              </div>
              <DataTable headers={[t('الأصل', 'Asset'), t('الرمز', 'Symbol'), t('الوزن', 'Weight'), t('القيمة (ر.س)', 'Value (SAR)'), t('التغير اليومي', 'Daily Change')]}>
                {portfolio.holdings.map((h, i) => (
                  <Tr key={i}>
                    <Td bold>{lang === 'ar' ? h.name : h.nameEn}</Td>
                    <Td mono>{h.symbol}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 rounded-full bg-[#E2E8F0] dark:bg-tertiary overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${h.weight}%`, background: '#0EA5E9' }} />
                        </div>
                        <span className="font-mono text-[11px]">{h.weight}%</span>
                      </div>
                    </Td>
                    <Td mono>{h.value.toLocaleString()}</Td>
                    <Td><span className="font-mono font-bold" style={{ color: h.change >= 0 ? '#00D97E' : '#FF4560' }}>{h.change >= 0 ? '▲' : '▼'} {Math.abs(h.change)}%</span></Td>
                  </Tr>
                ))}
              </DataTable>
            </Panel>
            <Panel>
              <PanelHeader icon={undefined} title={t('ملخص المحفظة', 'Portfolio Summary')} />
              <div className="mt-3 space-y-1">
                <InfoRow label={t('رقم المحفظة', 'Portfolio ID')} value={portfolio.id} mono />
                <InfoRow label={t('تاريخ الإنشاء', 'Inception')} value={portfolio.inception} mono />
                <InfoRow label={t('مستوى المخاطر', 'Risk Level')} value={lang === 'ar' ? portfolio.risk : portfolio.riskEn} />
                <InfoRow label={t('عدد الأصول', 'Holdings')} value={String(portfolio.holdings.length)} mono />
                <InfoRow label={t('القيمة السوقية', 'Market Value')} value={`${portfolio.value.toLocaleString()} SAR`} mono />
              </div>
              <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(0,217,126,0.07)', border: '1px solid rgba(0,217,126,0.15)' }}>
                <div className="text-[11px] text-text-muted">{t('العائد منذ الإنشاء', 'Return since inception')}</div>
                <div className="text-2xl font-black font-mono" style={{ color: '#00D97E' }}>+{portfolio.growth}%</div>
              </div>
            </Panel>
          </div>
        ) : (
          <Panel><EmptyState icon="💼" text={t('لا توجد محفظة لهذا العميل بعد', 'No portfolio for this client yet')} sub={t('تُنشأ المحفظة تلقائياً بعد أول إيداع معتمد', 'A portfolio is created after the first approved deposit')} /></Panel>
        )
      )}

      {/* ── المعاملات ── */}
      {tab === 'transactions' && (
        <Panel padded={false}>
          {clientTxs.length === 0 ? (
            <EmptyState icon="🧾" text={t('لا توجد معاملات مسجلة', 'No transactions recorded')} />
          ) : (
            <DataTable headers={[t('المعرف', 'ID'), t('النوع', 'Type'), t('المبلغ', 'Amount'), t('الحالة', 'Status'), t('الوسيلة', 'Method'), t('التاريخ', 'Date')]}>
              {clientTxs.map(tx => (
                <Tr key={tx.id}>
                  <Td mono>{tx.id}</Td>
                  <Td><Pill text={lang === 'ar' ? TX_TYPE[tx.type].ar : TX_TYPE[tx.type].en} color={TX_TYPE[tx.type].color} /></Td>
                  <Td mono bold>{tx.amount.toLocaleString()} {tx.currency}</Td>
                  <Td><Pill text={lang === 'ar' ? TX_STATUS[tx.status].ar : TX_STATUS[tx.status].en} color={TX_STATUS[tx.status].color} dot /></Td>
                  <Td>{tx.method}</Td>
                  <Td mono>{tx.date}</Td>
                </Tr>
              ))}
            </DataTable>
          )}
        </Panel>
      )}

      {/* ── سجل التواصل ── */}
      {tab === 'communication' && (
        <div className="space-y-4">
          {clientMsgs.length === 0 ? (
            <Panel><EmptyState icon="📬" text={t('لا يوجد سجل تواصل مع هذا العميل', 'No communication record with this client')} /></Panel>
          ) : clientMsgs.map(m => (
            <Panel key={m.id}>
              <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-border-default pb-2 mb-3">
                <div className="font-bold text-sm text-text-primary">{m.subject} <span className="text-[10px] font-mono text-text-muted ms-1">{m.id}</span></div>
                <Pill text={m.status === 'answered' ? t('تم الرد', 'Answered') : m.status === 'pending' ? t('بانتظار الرد', 'Pending') : t('مغلقة', 'Closed')}
                  color={m.status === 'answered' ? '#00D97E' : m.status === 'pending' ? '#F59E0B' : '#64748B'} />
              </div>
              <div className="space-y-2.5">
                <div className="flex gap-2.5">
                  <ClientAvatar name={lang === 'ar' ? client.name : client.nameEn} idSeed={client.id} size={26} />
                  <div className="flex-1 rounded-xl rounded-ss-sm p-3" style={{ background: 'rgba(14,165,233,0.06)' }}>
                    <p className="text-xs text-text-secondary leading-relaxed">{m.text}</p>
                    <span className="text-[9px] text-text-muted mt-1 block">{relativeTime(m.date, lang)}</span>
                  </div>
                </div>
                {m.replies.map((r, i) => (
                  <div key={i} className="flex gap-2.5 justify-end">
                    <div className="flex-1 rounded-xl rounded-se-sm p-3" style={{ background: 'rgba(201,168,76,0.07)', maxWidth: '92%' }}>
                      <p className="text-xs text-text-secondary leading-relaxed">{r.text}</p>
                      <span className="text-[9px] text-text-muted mt-1 block">{t('فريق الدعم', 'Support Team')} · {relativeTime(r.date, lang)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* ── ملاحظات المشرف ── */}
      {tab === 'notes' && (
        <Panel>
          <PanelHeader icon={undefined} title={t('ملاحظات داخلية — لا يراها العميل', 'Internal notes — not visible to the client')} />
          <div className="mt-4">
            <TextArea
              rows={6}
              value={notesDraft ?? client.notes ?? ''}
              onChange={e => setNotesDraft(e.target.value)}
              placeholder={t('اكتب ملاحظاتك حول هذا العميل هنا (تفضيلاته، ظروفه، تنبيهات داخلية)...', 'Write your notes about this client (preferences, circumstances, internal alerts)...')}
            />
            <div className="mt-3 flex justify-end">
              <PrimaryBtn icon={Save} onClick={saveNotes} disabled={notesDraft === null}>{t('حفظ الملاحظات', 'Save Notes')}</PrimaryBtn>
            </div>
          </div>
        </Panel>
      )}
      {ToastView}
    </div>
  );
}
