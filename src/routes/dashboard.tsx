import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useLang } from '@/contexts/LanguageContext';
import { clearClientSession, isClientAuthed, getClientSession } from '@/lib/auth';
import { useEffect, useState, useMemo } from 'react';
import { Check } from 'lucide-react';
import { DashboardLayout, DashboardTab } from '@/components/dashboard/DashboardLayout';
import { DashboardHome } from '@/components/dashboard/DashboardHome';
import { InvestmentsTab } from '@/components/dashboard/InvestmentsTab';
import { PerformanceTab } from '@/components/dashboard/PerformanceTab';
import { BankingTab } from '@/components/dashboard/BankingTab';
import { TransactionsTab } from '@/components/dashboard/TransactionsTab';
import { ReportsTab } from '@/components/dashboard/ReportsTab';
import { SupportTab } from '@/components/dashboard/SupportTab';
import { AdvisorTab } from '@/components/dashboard/AdvisorTab';
import { SettingsTab } from '@/components/dashboard/SettingsTab';
import { useTransactions, useMessages, useMeetings, usePortfolios } from '@/lib/queries';
import { useProfile } from '@/lib/queries';
import { api } from '@/lib/api';
import { jsPDF } from 'jspdf';


export const Route = createFileRoute('/dashboard')({ component: DashboardPage });

function DashboardPage() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const session = getClientSession();
  const { data: profileData } = useProfile();
  const { data: transactionsData } = useTransactions();
  const { data: messagesData } = useMessages();
  const { data: meetingsData } = useMeetings();
  const { data: portfoliosData } = usePortfolios();

  const profile = (profileData as any)?.user;
  // First active portfolio (clients typically have one)
  const myPortfolio = useMemo(() => {
    const list = (portfoliosData as any)?.data ?? [];
    return list.find((p: any) => p.is_active !== false) ?? list[0] ?? null;
  }, [portfoliosData]);

  useEffect(() => {
    if (!isClientAuthed()) navigate({ to: '/login' });
  }, [navigate]);

  const [activeTab, setActiveTab] = useState<DashboardTab>('info');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') return document.documentElement.classList.contains('dark');
    return false;
  });

  const [clientPhone, setClientPhone] = useState('');
  const [bankRequestSent, setBankRequestSent] = useState(false);

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferType, setTransferType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferBank, setTransferBank] = useState('snb');

  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');

  const [newMeetingDate, setNewMeetingDate] = useState('');
  const [newMeetingTime, setNewMeetingTime] = useState('10:00 AM');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('صباح الخير', 'Good Morning');
    if (hour < 17) return t('مساء الخير', 'Good Afternoon');
    return t('مساء النور', 'Good Evening');
  }, [t]);

  // Normalize backend data
  const transactions = useMemo(() => {
    return (transactionsData?.data || []).map((tx: any) => ({
      id: tx.id.slice(0, 12),
      type: tx.type,
      amount: Number(tx.amount),
      date: tx.created_at ? tx.created_at.slice(0, 10) : '—',
      status: tx.status,
      method: tx.method || '—',
    }));
  }, [transactionsData]);

  const tickets = useMemo(() => {
    return (messagesData?.data || []).map((tk: any) => ({
      id: tk.id.slice(0, 12),
      title: tk.title,
      titleEn: tk.title,
      status: tk.status,
      date: tk.created_at ? tk.created_at.slice(0, 10) : '—',
      reply: tk.reply,
    }));
  }, [messagesData]);

  const meetings = useMemo(() => {
    return (meetingsData?.data || []).map((mt: any) => ({
      id: mt.id.slice(0, 12),
      advisor: mt.advisor_name,
      date: mt.meeting_date ? mt.meeting_date.slice(0, 10) : '—',
      time: mt.meeting_time,
      status: mt.status,
    }));
  }, [meetingsData]);

  const totalBalance = useMemo(() => {
    // Prefer real portfolio total_valuation; fall back to transaction-based computation
    if (myPortfolio?.total_valuation && Number(myPortfolio.total_valuation) > 0) {
      return Number(myPortfolio.total_valuation);
    }
    return transactions.reduce((acc: number, t: any) => {
      if (t.status !== 'completed') return acc;
      if (t.type === 'deposit') return acc + t.amount;
      if (t.type === 'withdrawal' || t.type === 'withdraw') return acc - t.amount;
      return acc;
    }, 0);
  }, [transactions, myPortfolio]);

  const portfolioGrowth = myPortfolio?.growth_percent !== null && myPortfolio?.growth_percent !== undefined
    ? Number(myPortfolio.growth_percent)
    : 0;
  const profitAmount = totalBalance * (portfolioGrowth / 100);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(transferAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast(t('يرجى إدخال مبلغ صحيح', 'Please enter a valid amount'));
      return;
    }
    if (transferType === 'withdrawal' && amountNum > totalBalance) {
      showToast(t('رصيدك غير كافٍ', 'Insufficient balance'));
      return;
    }

    try {
      await api.createTransaction({
        user_id: session?.id,
        type: transferType,
        amount: amountNum,
        currency: 'SAR',
        method: transferBank === 'snb' ? 'Saudi National Bank (SNB)' : 'Al Rajhi Bank',
      });
      setTransferAmount('');
      setTransferModalOpen(false);
      showToast(t('تم إرسال الطلب وهو قيد المراجعة', 'Request submitted and pending review'));
    } catch (err: any) {
      showToast(err.message || t('فشل إرسال الطلب', 'Failed to submit request'));
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketTitle || !newTicketMessage) {
      showToast(t('يرجى ملء جميع الحقول', 'Please fill in all fields'));
      return;
    }
    try {
      await api.createMessage({
        user_id: session?.id,
        title: newTicketTitle,
        message: newTicketMessage,
        priority: 'medium',
      });
      setNewTicketTitle('');
      setNewTicketMessage('');
      showToast(t('تم إرسال التذكرة بنجاح', 'Ticket sent successfully'));
    } catch (err: any) {
      showToast(err.message || t('فشل إرسال التذكرة', 'Failed to send ticket'));
    }
  };

  const handleBookMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingDate) {
      showToast(t('يرجى اختيار التاريخ', 'Please select a date'));
      return;
    }
    try {
      await api.createMeeting({
        user_id: session?.id,
        advisor_name: 'خالد بن الوليد',
        meeting_date: newMeetingDate,
        meeting_time: newMeetingTime,
        duration_minutes: 60,
        type: 'consultation',
      });
      setNewMeetingDate('');
      showToast(t('تم حجز الموعد بنجاح', 'Meeting booked successfully'));
    } catch (err: any) {
      showToast(err.message || t('فشل حجز الموعد', 'Failed to book meeting'));
    }
  };

  const exportToExcel = () => {
    const escapeCell = (value: unknown) => {
      const raw = String(value ?? '');
      const safe = /^[=+\-@]/.test(raw.trim()) ? `'${raw}` : raw;
      return safe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    const headers = ['Transaction ID', 'Type', 'Amount', 'Date', 'Status', 'Method'];
    const rows: unknown[][] = transactions.map((item: any) => [item.id, item.type.toUpperCase(), item.amount, item.date, item.status.toUpperCase(), item.method]);
    const table = `<table><thead><tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr></thead><tbody>${rows.map((row: unknown[]) => `<tr>${row.map((cell: unknown) => `<td>${escapeCell(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const url = URL.createObjectURL(new Blob([`\ufeff${table}`], { type: 'application/vnd.ms-excel;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Tharwah_Transactions_${session?.name || 'Client'}.xls`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast(t('تم تحميل كشف الحساب بصيغة Excel', 'Excel statement downloaded'));
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont("Helvetica", "bold");
    doc.text("THARWAH CAPITAL - PORTFOLIO REPORT", 20, 20);
    doc.setFont("Helvetica", "normal");
    doc.text(`Client Name: ${session?.name || ''}`, 20, 30);
    doc.text(`Account No: ${profile?.portfolio_code || 'TH-0000000'}`, 20, 40);
    doc.text(`Total Valuation: SAR ${totalBalance.toLocaleString()}`, 20, 50);
    doc.text(`Date of Report: ${new Date().toISOString().slice(0, 10)}`, 20, 60);
    doc.text(`Total Transactions: ${transactions?.length ?? 0}`, 20, 70);
    doc.save(`Tharwah_Report_${session?.name || 'Client'}.pdf`);
    showToast(t('تم تحميل التقرير بصيغة PDF', 'PDF report downloaded'));
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'info':
        return <DashboardHome totalBalance={totalBalance} profitAmount={profitAmount} greeting={greeting} sessionName={session?.name || ''} onOpenTransfer={(type) => { setTransferType(type); setTransferModalOpen(true); }} lang={lang} portfolioCode={profile?.portfolio_code ?? myPortfolio?.portfolio_code} tier={profile?.tier ?? undefined} growthPercent={portfolioGrowth} assets={myPortfolio?.assets || []} />;
      case 'investments':
        return <InvestmentsTab totalBalance={totalBalance} onExportPDF={exportToPDF} portfolio={myPortfolio} />;
      case 'performance':
        return <PerformanceTab totalBalance={totalBalance} portfolio={myPortfolio} transactions={transactions} />;
      case 'banking':
        return <BankingTab bankRequestSent={bankRequestSent} onRequestBankUpdate={() => { setBankRequestSent(true); showToast(t('تم تقديم طلب تحديث البيانات البنكية', 'Bank update request submitted')); }} onShowToast={showToast} profile={profile} />;
      case 'transactions':
        return <TransactionsTab transactions={transactions} onNewTransfer={() => { setTransferType('deposit'); setTransferModalOpen(true); }} onExportExcel={exportToExcel} />;
      case 'reports':
        return <ReportsTab onExportPDF={exportToPDF} transactions={transactions} profile={profile} />;
      case 'support':
        return <SupportTab tickets={tickets} newTicketTitle={newTicketTitle} newTicketMessage={newTicketMessage} onTicketTitleChange={setNewTicketTitle} onTicketMessageChange={setNewTicketMessage} onCreateTicket={handleCreateTicket} />;
      case 'advisor':
        return <AdvisorTab meetings={meetings} newMeetingDate={newMeetingDate} newMeetingTime={newMeetingTime} onMeetingDateChange={setNewMeetingDate} onMeetingTimeChange={setNewMeetingTime} onBookMeeting={handleBookMeeting} />;
      case 'settings':
        return <SettingsTab clientPhone={clientPhone} onClientPhoneChange={setClientPhone} onShowToast={showToast} profile={profile} />;
      default:
        return null;
    }
  };

  if (!isClientAuthed() || !session) return null;

  return (
    <>
      {toastMessage && (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 bg-white dark:bg-[#20203A] border border-gold-primary rounded-xl p-4 shadow-2xl z-[100] flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="w-8 h-8 rounded-full bg-gold-primary/20 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 text-gold-deep" />
          </div>
          <span className="text-sm font-bold text-text-primary">{toastMessage}</span>
        </div>
      )}

      {transferModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1C34] border border-gold-primary/30 w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black">{transferType === 'deposit' ? t('طلب إيداع أموال', 'Request Deposit') : t('طلب سحب أموال', 'Request Withdrawal')}</h3>
              <button onClick={() => setTransferModalOpen(false)} className="text-text-muted hover:text-text-primary">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary block">{t('نوع المعاملة', 'Transaction Type')}</label>
                <div className="grid grid-cols-2 gap-2 bg-[#F1F5F9] dark:bg-[#13132A] p-1 rounded-lg">
                  <button type="button" onClick={() => setTransferType('deposit')} className={`py-2 rounded-md text-xs font-bold transition-all ${transferType === 'deposit' ? 'bg-white dark:bg-[#20203A] text-gold-deep shadow-sm' : 'text-text-muted'}`}>{t('إيداع', 'Deposit')}</button>
                  <button type="button" onClick={() => setTransferType('withdrawal')} className={`py-2 rounded-md text-xs font-bold transition-all ${transferType === 'withdrawal' ? 'bg-white dark:bg-[#20203A] text-red-500 shadow-sm' : 'text-text-muted'}`}>{t('سحب', 'Withdrawal')}</button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary block">{t('المبلغ', 'Amount')}</label>
                <div className="relative">
                  <input required type="number" min="100" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="w-full bg-[#F8FAFC] dark:bg-[#13132A] border border-border-default rounded-md py-3 px-4 focus:border-gold-primary outline-none text-lg font-bold" />
                  <span className="absolute rtl:left-4 ltr:right-4 top-1/2 -translate-y-1/2 text-sm text-text-muted font-bold">SAR</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary block">{t('البنك المرتبط', 'Associated Bank')}</label>
                <select value={transferBank} onChange={(e) => setTransferBank(e.target.value)} className="w-full bg-[#F8FAFC] dark:bg-[#13132A] border border-border-default rounded-md py-3 px-4 focus:border-gold-primary outline-none font-bold">
                  <option value="snb">{t('البنك الأهلي السعودي', 'Saudi National Bank - SNB')}</option>
                  <option value="alrajhi">{t('مصرف الراجحي', 'Al Rajhi Bank')}</option>
                </select>
              </div>
              <div className="pt-2 flex items-center gap-3">
                <button type="submit" className="flex-1 py-3 rounded-md gradient-gold text-white font-bold text-sm shadow-gold-sm hover:-translate-y-0.5 transition-all">{t('إرسال الطلب', 'Submit Request')}</button>
                <button type="button" onClick={() => setTransferModalOpen(false)} className="flex-1 py-3 rounded-md border border-border-default text-text-secondary font-bold text-sm hover:bg-secondary transition-all">{t('إلغاء', 'Cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DashboardLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        sessionName={session.name}
      >
        {renderActiveTab()}
      </DashboardLayout>
    </>
  );
}
