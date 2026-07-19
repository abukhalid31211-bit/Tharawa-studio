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
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export const Route = createFileRoute('/dashboard')({ component: DashboardPage });

const INITIAL_TRANSACTIONS = [
  { id: 'TX-1092', type: 'deposit' as const, amount: 15000, date: '2026-07-15', status: 'completed', method: 'Saudi National Bank (SNB)' },
  { id: 'TX-1091', type: 'dividend' as const, amount: 2450, date: '2026-06-10', status: 'completed', method: 'Portfolio Reinvestment' },
  { id: 'TX-1090', type: 'withdrawal' as const, amount: 10000, date: '2026-05-05', status: 'completed', method: 'Al Rajhi Bank' },
  { id: 'TX-1089', type: 'deposit' as const, amount: 50000, date: '2026-04-20', status: 'completed', method: 'Saudi National Bank (SNB)' },
  { id: 'TX-1088', type: 'deposit' as const, amount: 100000, date: '2026-03-15', status: 'completed', method: 'Saudi National Bank (SNB)' },
  { id: 'TX-1087', type: 'deposit' as const, amount: 50000, date: '2026-03-12', status: 'completed', method: 'Saudi National Bank (SNB)' },
];

const INITIAL_TICKETS = [
  { id: 'TK-302', title: 'استفسار بخصوص الأرباح الموزعة', titleEn: 'Dividend distribution inquiry', status: 'answered', date: '2026-07-10', reply: 'تمت إعادة استثمار الأرباح تلقائياً في محفظتك الاستثمارية بناء على تفضيلاتك الحالية.' },
  { id: 'TK-301', title: 'طلب تحديث المحفظة الاستثمارية', titleEn: 'Portfolio update request', status: 'pending', date: '2026-07-18', reply: null },
];

const INITIAL_MEETINGS = [
  { id: 'MT-501', advisor: 'خالد بن الوليد', date: '2026-07-24', time: '10:00 AM', status: 'confirmed' }
];

function DashboardPage() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const session = getClientSession();

  useEffect(() => {
    if (!isClientAuthed()) navigate({ to: '/login' });
  }, [navigate]);

  const [activeTab, setActiveTab] = useState<DashboardTab>('info');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') return document.documentElement.classList.contains('dark');
    return false;
  });

  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [meetings, setMeetings] = useState(INITIAL_MEETINGS);
  const [clientPhone, setClientPhone] = useState('+966 50 123 4567');
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
  }, [lang]);

  if (!isClientAuthed() || !session) return null;

  const totalBalance = 245000 + transactions.reduce((acc, t) => {
    if (t.status !== 'completed') return acc;
    if (t.type === 'deposit') return acc + t.amount;
    if (t.type === 'withdrawal') return acc - t.amount;
    return acc;
  }, 0);

  const profitAmount = totalBalance * 0.185;

  const handleCreateTransfer = (e: React.FormEvent) => {
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
    const newTx = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      type: transferType,
      amount: amountNum,
      date: new Date().toISOString().split('T')[0] || '2026-07-19',
      status: 'completed',
      method: transferBank === 'snb' ? 'Saudi National Bank (SNB)' : 'Al Rajhi Bank'
    };
    setTransactions([newTx, ...transactions]);
    setTransferAmount('');
    setTransferModalOpen(false);
    showToast(t('تمت العملية بنجاح', 'Operation completed successfully'));
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketTitle || !newTicketMessage) {
      showToast(t('يرجى ملء جميع الحقول', 'Please fill in all fields'));
      return;
    }
    const newTk = {
      id: `TK-${Math.floor(300 + Math.random() * 700)}`,
      title: newTicketTitle,
      titleEn: newTicketTitle,
      status: 'pending',
      date: new Date().toISOString().split('T')[0] || '2026-07-19',
      reply: null
    };
    setTickets([newTk, ...tickets]);
    setNewTicketTitle('');
    setNewTicketMessage('');
    showToast(t('تم إرسال التذكرة بنجاح', 'Ticket sent successfully'));
  };

  const handleBookMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingDate) {
      showToast(t('يرجى اختيار التاريخ', 'Please select a date'));
      return;
    }
    const newMeet = {
      id: `MT-${Math.floor(500 + Math.random() * 500)}`,
      advisor: 'خالد بن الوليد',
      date: newMeetingDate,
      time: newMeetingTime,
      status: 'confirmed'
    };
    setMeetings([newMeet, ...meetings]);
    setNewMeetingDate('');
    showToast(t('تم حجز الموعد بنجاح', 'Meeting booked successfully'));
  };

  const exportToExcel = () => {
    const data = transactions.map(t => ({
      'Transaction ID': t.id, 'Type': t.type.toUpperCase(), 'Amount': t.amount,
      'Date': t.date, 'Status': t.status.toUpperCase(), 'Method': t.method
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    XLSX.writeFile(workbook, `Tharwah_Transactions_${session.name}.xlsx`);
    showToast(t('تم تحميل كشف الحساب بصيغة Excel', 'Excel statement downloaded'));
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont("Helvetica", "bold");
    doc.text("THARWAH CAPITAL - PORTFOLIO REPORT", 20, 20);
    doc.setFont("Helvetica", "normal");
    doc.text(`Client Name: ${session.name}`, 20, 30);
    doc.text(`Account No: TH-9842105`, 20, 40);
    doc.text(`Total Valuation: SAR ${totalBalance.toLocaleString()}`, 20, 50);
    doc.text(`Date of Report: 2026-07-19`, 20, 60);
    doc.save(`Tharwah_Report_${session.name}.pdf`);
    showToast(t('تم تحميل التقرير بصيغة PDF', 'PDF report downloaded'));
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'info':
        return <DashboardHome totalBalance={totalBalance} profitAmount={profitAmount} greeting={greeting} sessionName={session.name} onOpenTransfer={(type) => { setTransferType(type); setTransferModalOpen(true); }} lang={lang} />;
      case 'investments':
        return <InvestmentsTab totalBalance={totalBalance} onExportPDF={exportToPDF} />;
      case 'performance':
        return <PerformanceTab totalBalance={totalBalance} />;
      case 'banking':
        return <BankingTab bankRequestSent={bankRequestSent} onRequestBankUpdate={() => { setBankRequestSent(true); showToast(t('تم تقديم طلب تحديث البيانات البنكية', 'Bank update request submitted')); }} onShowToast={showToast} />;
      case 'transactions':
        return <TransactionsTab transactions={transactions} onNewTransfer={() => { setTransferType('deposit'); setTransferModalOpen(true); }} onExportExcel={exportToExcel} />;
      case 'reports':
        return <ReportsTab onExportPDF={exportToPDF} />;
      case 'support':
        return <SupportTab tickets={tickets} newTicketTitle={newTicketTitle} newTicketMessage={newTicketMessage} onTicketTitleChange={setNewTicketTitle} onTicketMessageChange={setNewTicketMessage} onCreateTicket={handleCreateTicket} />;
      case 'advisor':
        return <AdvisorTab meetings={meetings} newMeetingDate={newMeetingDate} newMeetingTime={newMeetingTime} onMeetingDateChange={setNewMeetingDate} onMeetingTimeChange={setNewMeetingTime} onBookMeeting={handleBookMeeting} />;
      case 'settings':
        return <SettingsTab clientPhone={clientPhone} onClientPhoneChange={setClientPhone} onShowToast={showToast} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 bg-white dark:bg-[#20203A] border border-gold-primary rounded-xl p-4 shadow-2xl z-[100] flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="w-8 h-8 rounded-full bg-gold-primary/20 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 text-gold-deep" />
          </div>
          <span className="text-sm font-bold text-text-primary">{toastMessage}</span>
        </div>
      )}

      {/* Transfer Modal */}
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
