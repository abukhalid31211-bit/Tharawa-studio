import React, { useState, useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useNavigate } from '@tanstack/react-router';
import {
  Users, Briefcase, TrendingUp, CreditCard, BarChart3, Activity,
  MessageSquare, Bell, Calendar, Download, Heart, Zap, AlertTriangle,
  CheckCircle, Eye, ChevronRight, ChevronLeft, Plus, FileText, Send, UserPlus,
  TrendingDown
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  useClients, useTransactions, useMessages, useAdminNotifications,
  relativeTime,
} from '@/lib/adminData';

// ─── Mock Chart Data (static per design doc 4.3) ────────────
const AUM_DATA = [
  { month: 'Jul', aum: 1420 }, { month: 'Aug', aum: 1480 }, { month: 'Sep', aum: 1560 },
  { month: 'Oct', aum: 1620 }, { month: 'Nov', aum: 1710 }, { month: 'Dec', aum: 1780 },
  { month: 'Jan', aum: 1840 }, { month: 'Feb', aum: 1920 }, { month: 'Mar', aum: 1980 },
  { month: 'Apr', aum: 1960 }, { month: 'May', aum: 2040 }, { month: 'Jun', aum: 2120 },
];

const REVENUE_DATA = [
  { month: 'Jan', revenue: 142, profit: 38 },
  { month: 'Feb', revenue: 168, profit: 45 },
  { month: 'Mar', revenue: 195, profit: 52 },
  { month: 'Apr', revenue: 178, profit: 48 },
  { month: 'May', revenue: 212, profit: 58 },
  { month: 'Jun', revenue: 234, profit: 64 },
];

const DISTRIBUTION = [
  { name: 'الأسهم', nameEn: 'Equities', pct: 35, color: '#0EA5E9' },
  { name: 'المعادن', nameEn: 'Metals', pct: 20, color: '#C9A84C' },
  { name: 'العملات الرقمية', nameEn: 'Crypto', pct: 18, color: '#F59E0B' },
  { name: 'صناديق', nameEn: 'Funds', pct: 15, color: '#00D97E' },
  { name: 'طاقة', nameEn: 'Energy', pct: 12, color: '#8B5CF6' },
];

// Live data derived from the shared admin store (see component below).

const QUICK_ACTIONS = [
  { emoji: '➕', label: 'إضافة عميل', labelEn: 'Add Client', color: '#3B82F6', to: '/Akadmin/clients' },
  { emoji: '💸', label: 'صفقة جديدة', labelEn: 'New Trade', color: '#0EA5E9', to: '/Akadmin/transactions' },
  { emoji: '📊', label: 'إنشاء تقرير', labelEn: 'Create Report', color: '#00D97E', to: '/Akadmin/reports' },
  { emoji: '📰', label: 'نشر خبر', labelEn: 'Publish News', color: '#F59E0B', to: '/Akadmin/content' },
  { emoji: '👤', label: 'إضافة مشرف', labelEn: 'Add Admin', color: '#8B5CF6', to: '/Akadmin/sub_admins' },
  { emoji: '📧', label: 'إرسال بريد', labelEn: 'Send Email', color: '#EC4899', to: '/Akadmin/messages' },
];

const MARKET_TICKER = [
  { name: 'بيتكوين', nameEn: 'BTC/USD', price: '$67,240', change: '+2.4%', up: true },
  { name: 'إيثيريوم', nameEn: 'ETH/USD', price: '$3,180', change: '+1.8%', up: true },
  { name: 'أرامكو', nameEn: '2222.SR', price: '35.20 ر.س', change: '-0.3%', up: false },
  { name: 'الذهب', nameEn: 'XAU/USD', price: '$2,340', change: '+0.9%', up: true },
  { name: 'برنت', nameEn: 'BZ', price: '$83.10', change: '-0.4%', up: false },
  { name: 'أبل', nameEn: 'AAPL', price: '$192.53', change: '+0.8%', up: true },
];

// ─── SVG Chart Helpers ───────────────────────────────────
function SparklineSVG({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const w = 200;
  const min = Math.min(...data); const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  const base = height;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
      <defs><linearGradient id={`aum-grad`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.3} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
      <polygon points={`0,${base} ${pts} ${w},${base}`} fill={`url(#aum-grad)`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}

function MiniBarChart({ data, colors }: { data: { label: string; value: number }[]; colors: string[] }) {
  const maxVal = Math.max(...data.map(d => d.value));
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-sm transition-all duration-500" style={{ height: `${(d.value / maxVal) * 100}%`, backgroundColor: colors[i % colors.length], minHeight: 4 }} />
          <span className="text-[8px] text-text-muted font-medium">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments, centerLabel, centerSub }: { segments: { pct: number; color: string }[]; centerLabel: string; centerSub: string }) {
  const total = segments.reduce((s, x) => s + x.pct, 0);
  let cumulative = 0;
  
  const getArcPath = (seg: { pct: number; color: string }, startAngle: number, endAngle: number) => {
    const r = 65; const cx = 100; const cy = 100;
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = seg.pct > 50 ? 1 : 0;
    return { d: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`, color: seg.color };
  };

  const paths = segments.map((seg) => {
    const startAngle = (cumulative / total) * 360;
    cumulative += seg.pct;
    const endAngle = (cumulative / total) * 360;
    return getArcPath(seg, startAngle, endAngle);
  });

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 200 200" role="img" aria-label="Donut chart">
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill="none" stroke={p.color} strokeWidth={18} strokeLinecap="round" />
        ))}
      </svg>
      <div className="absolute text-center pointer-events-none">
        <div className="text-2xl font-black font-mono" style={{ color: segments[0]?.color }}>{centerLabel}</div>
        <div className="text-[11px] text-text-muted">{centerSub}</div>
      </div>
    </div>
  );
}

function HeatmapCell({ level }: { level: number }) {
  const colors = ['#F1F5F9', 'rgba(201,168,76,0.15)', 'rgba(201,168,76,0.35)', 'rgba(201,168,76,0.60)', 'rgba(201,168,76,0.90)'];
  const idx = Math.min(Math.floor(level / 25), 4);
  return <div className="w-5 h-5 rounded-sm transition-colors" style={{ backgroundColor: colors[idx] }} />;
}

// ─── Main Component ──────────────────────────────────────
export function Overview() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('this-month');

  // ── Live platform data from the shared admin store ──
  const [clients] = useClients();
  const [transactions] = useTransactions();
  const [messages] = useMessages();
  const [notifications, setNotifications] = useAdminNotifications();

  const activeClients = clients.filter(c => c.status === 'active').length;
  const doneDeposits = transactions.filter(x => x.type === 'deposit' && x.status === 'completed').reduce((s, x) => s + x.amount, 0);
  const doneWithdrawals = transactions.filter(x => x.type === 'withdraw' && x.status === 'completed').reduce((s, x) => s + x.amount, 0);
  const pendingMessages = messages.filter(m => m.status === 'pending').length;
  const pendingTxs = transactions.filter(x => x.status === 'pending').length;

  const KPI_CARDS = [
    { emoji: '👥', label: 'إجمالي العملاء', labelEn: 'Total Clients', value: clients.length.toLocaleString(), detail: `${activeClients} ${t('نشط', '')}`.trim(), detailEn: `${activeClients} Active`, color: '#3B82F6', progress: clients.length ? Math.round(activeClients / clients.length * 100) : 0 },
    { emoji: '✅', label: 'عملاء نشطون', labelEn: 'Active Clients', value: activeClients.toLocaleString(), detail: `${clients.length - activeClients} غير نشط`, detailEn: `${clients.length - activeClients} Inactive`, color: '#00D97E', progress: 85 },
    { emoji: '💰', label: 'إجمالي الإيداعات', labelEn: 'Total Deposits', value: doneDeposits >= 1000000 ? `$${(doneDeposits / 1000000).toFixed(1)}M` : `$${(doneDeposits / 1000).toFixed(0)}K`, detail: 'مكتملة', detailEn: 'Completed', color: '#0EA5E9', progress: 78 },
    { emoji: '📈', label: 'صافي الأصول', labelEn: 'Net Assets', value: (doneDeposits - doneWithdrawals) >= 1000000 ? `$${((doneDeposits - doneWithdrawals) / 1000000).toFixed(1)}M` : `$${((doneDeposits - doneWithdrawals) / 1000).toFixed(0)}K`, detail: 'إيداع — سحب', detailEn: 'Deposit — Withdrawal', color: '#C9A84C', progress: 72 },
    { emoji: '💬', label: 'رسائل جديدة', labelEn: 'New Messages', value: String(pendingMessages), detail: `من ${messages.length} رسالة`, detailEn: `of ${messages.length} messages`, color: '#F59E0B', progress: messages.length ? Math.round(pendingMessages / messages.length * 100) : 0, highlight: pendingMessages > 0 },
    { emoji: '📋', label: 'معاملات معلقة', labelEn: 'Pending Transactions', value: String(pendingTxs), detail: 'تحتاج مراجعة', detailEn: 'Needs Review', color: '#FF4560', progress: 15, highlight: pendingTxs > 0 },
    { emoji: '⚡', label: 'إجمالي المعاملات', labelEn: 'Total Transactions', value: String(transactions.length), detail: 'في النظام', detailEn: 'In System', color: '#0EA5E9', progress: 60 },
    { emoji: '🛡️', label: 'حالة النظام', labelEn: 'System Status', value: '✅ طبيعي', valueEn: '✅ Normal', detail: 'آخر فحص: الآن', detailEn: 'Last Check: Now', color: '#00D97E', progress: 100 },
  ];

  const RECENT_CLIENTS = [...clients]
    .sort((a, b) => b.joinDate.localeCompare(a.joinDate))
    .slice(0, 5)
    .map(c => ({ name: c.name, nameEn: c.nameEn, status: c.status === 'active' ? 'active' as const : 'pending' as const, date: c.joinDate, initial: c.name.trim().charAt(0) }));

  const TRANSACTIONS = [...transactions].slice(0, 5).map(x => {
    const c = clients.find(cl => cl.id === x.clientId);
    return {
      client: c?.name || '—', clientEn: c?.nameEn || '—',
      type: x.type, amount: x.amount, currency: x.currency, status: x.status,
      date: x.date.slice(0, 10),
    };
  });

  const ALERTS = notifications.map(n => ({
    id: n.id, type: n.type, read: n.read,
    title: n.title, titleEn: n.titleEn, desc: n.desc, descEn: n.descEn,
    time: relativeTime(n.date, 'ar'), timeEn: relativeTime(n.date, 'en'),
    page: n.page,
  }));
  const unreadAlerts = ALERTS.filter(a => !a.read).length;
  const markAlertRead = (id: string, page?: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (page) navigate({ to: page as any });
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('صباح الخير 👋', 'Good Morning 👋') : hour < 17 ? t('مساء الخير 👋', 'Good Afternoon 👋') : t('مساء النور 👋', 'Good Evening 👋');

  const today = new Date();
  const dateStr = lang === 'ar'
    ? today.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const txTypeColors: Record<string, string> = {
    deposit: 'rgba(0,217,126,0.1)', withdraw: 'rgba(255,69,96,0.1)', buy: 'rgba(59,130,246,0.1)',
    sell: 'rgba(245,158,11,0.1)', transfer: 'rgba(139,92,246,0.1)',
  };
  const txTypeTextColors: Record<string, string> = {
    deposit: '#00D97E', withdraw: '#FF4560', buy: '#3B82F6',
    sell: '#F59E0B', transfer: '#8B5CF6',
  };
  const txTypeLabels: Record<string, string> = {
    deposit: 'إيداع', withdraw: 'سحب', buy: 'شراء', sell: 'بيع', transfer: 'تحويل',
  };
  const txTypeLabelsEn: Record<string, string> = {
    deposit: 'Deposit', withdraw: 'Withdrawal', buy: 'Buy', sell: 'Sell', transfer: 'Transfer',
  };
  const txStatusColors: Record<string, string> = {
    completed: 'rgba(0,217,126,0.1)', pending: 'rgba(245,158,11,0.1)', rejected: 'rgba(255,69,96,0.1)',
  };
  const txStatusTextColors: Record<string, string> = {
    completed: '#00D97E', pending: '#F59E0B', rejected: '#FF4560',
  };
  const txStatusLabels: Record<string, string> = { completed: 'مكتمل', pending: 'معلق', rejected: 'مرفوض' };
  const txStatusLabelsEn: Record<string, string> = { completed: 'Completed', pending: 'Pending', rejected: 'Rejected' };

  const alertIcons: Record<string, string> = { critical: '🔴', warning: '🟡', info: '🔵', success: '🟢' };
  const alertBorderColors: Record<string, string> = {
    critical: '#FF4560', warning: '#F59E0B', info: '#0EA5E9', success: '#00D97E',
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = lang === 'ar' ? ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* 4.3.1 — Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary">{greeting}</h1>
          <div className="flex items-center gap-2 text-sm text-text-muted mt-1">
            <span>{dateStr}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              {t('جميع الأنظمة تعمل بشكل طبيعي', 'All Systems Operating Normally')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border-default text-xs text-text-muted hover:bg-secondary transition-colors">
            <Calendar className="w-3.5 h-3.5" />
            {t('هذا الشهر', 'This Month')}
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs text-white font-bold transition-all" style={{ background: 'linear-gradient(135deg, #0EA5E9, #38BDF8)' }}>
            <Download className="w-3.5 h-3.5" />
            {t('تصدير', 'Export')}
          </button>
        </div>
      </div>

      {/* 4.3.2 — Market Ticker */}
      <div className="bg-[#F8FAFC] dark:bg-secondary border border-border-light rounded-xl p-3 flex items-center gap-6 overflow-x-auto scrollbar-none">
        <span className="text-[11px] text-text-muted font-medium shrink-0">{t('الأسواق:', 'Markets:')}</span>
        {MARKET_TICKER.map((m, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-text-primary">{lang === 'ar' ? m.name : m.nameEn}</span>
            <span className="text-xs font-mono text-text-primary">{m.price}</span>
            <span className={`text-[11px] font-bold font-mono ${m.up ? 'text-success' : 'text-error'}`}>
              {m.up ? '▲' : '▼'} {m.change}
            </span>
          </div>
        ))}
      </div>

      {/* 4.3.3 — KPI Grid (8 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {KPI_CARDS.map((kpi, i) => (
          <div
            key={i}
            className="bg-[#F8FAFC] dark:bg-secondary border border-border-light rounded-xl p-4 flex flex-col gap-2.5 hover:shadow-sm transition-shadow duration-200"
            style={(kpi as any).highlight ? { background: `${kpi.color}0D`, borderColor: `${kpi.color}33` } : undefined}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-text-muted">{lang === 'ar' ? kpi.label : kpi.labelEn}</span>
              <span className="text-lg shrink-0">{kpi.emoji}</span>
            </div>
            <div className="text-2xl font-black font-mono leading-none" style={{ color: kpi.color }}>
              {lang === 'ar' ? kpi.value : (kpi.valueEn || kpi.value)}
            </div>
            <div className="text-[11px]" style={{ color: kpi.color }}>
              {lang === 'ar' ? kpi.detail : (kpi.detailEn || kpi.detail)}
            </div>
            <div className="w-full h-1 bg-[#CBD5E1] dark:bg-border-default rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${kpi.progress}%`, backgroundColor: kpi.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* 4.3.4 + 4.3.5 — AUM Chart + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AUM Chart */}
        <div className="lg:col-span-2 bg-[#F8FAFC] dark:bg-secondary border border-border-light rounded-xl p-5 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-text-primary">{t('نمو الأصول المُدارة (AUM)', 'Assets Under Management (AUM) Growth')}</h3>
            <p className="text-[11px] text-text-muted">{t('بالمليون دولار — آخر 12 شهراً', 'In USD Millions — Last 12 Months')}</p>
          </div>
          <SparklineSVG data={AUM_DATA.map(d => d.aum)} color="#C9A84C" height={180} />
        </div>

        {/* Distribution Pie */}
        <div className="bg-[#F8FAFC] dark:bg-secondary border border-border-light rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-text-primary">{t('توزيع المحافظ', 'Portfolio Distribution')}</h3>
          <div className="flex items-center justify-center">
            <DonutChart
              segments={DISTRIBUTION.map(d => ({ pct: d.pct, color: d.color }))}
              centerLabel="100%"
              centerSub={t('إجمالي المحافظ', 'Total')}
            />
          </div>
          <div className="space-y-1.5">
            {DISTRIBUTION.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-text-primary">{lang === 'ar' ? d.name : d.nameEn}</span>
                </div>
                <span className="font-mono text-text-muted">{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4.3.6 + 4.3.7 + 4.3.8 — Revenue + Clients + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-5 bg-[#F8FAFC] dark:bg-secondary border border-border-light rounded-xl p-5 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-text-primary">{t('الإيرادات والأرباح', 'Revenue & Profits')}</h3>
            <p className="text-[11px] text-text-muted">{t('بالألف دولار', 'In USD Thousands')}</p>
          </div>
          <MiniBarChart
            data={REVENUE_DATA.map(d => ({ label: d.month, value: d.revenue }))}
            colors={['#3B82F6', '#C9A84C']}
          />
        </div>

        {/* Recent Clients */}
        <div className="lg:col-span-4 bg-[#F8FAFC] dark:bg-secondary border border-border-light rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-text-primary">{t('آخر العملاء المسجلين', 'Latest Registered Clients')}</h3>
          <div className="divide-y divide-border-light/60">
            {RECENT_CLIENTS.map((c, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-[11px] font-bold text-blue-500 shrink-0">
                  {c.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-text-primary truncate">{lang === 'ar' ? c.name : c.nameEn}</div>
                  <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    c.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  }`}>
                    {c.status === 'active' ? t('نشط', 'Active') : t('معلق', 'Pending')}
                  </span>
                </div>
                <span className="text-[10px] text-text-muted">{c.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-3 bg-[#F8FAFC] dark:bg-secondary border border-border-light rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-text-primary">{t('إجراءات سريعة', 'Quick Actions')}</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                onClick={() => navigate({ to: action.to as any })}
                className="flex flex-col items-center gap-1 p-2.5 rounded-lg transition-colors cursor-pointer hover:opacity-80"
                style={{ backgroundColor: `${action.color}11`, borderColor: `${action.color}33`, border: '1px solid' }}
              >
                <span className="text-lg">{action.emoji}</span>
                <span className="text-[10px] text-center leading-tight" style={{ color: '#1E293B' }}>
                  {lang === 'ar' ? action.label : action.labelEn}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4.3.9 — Latest Transactions */}
      <div className="bg-[#F8FAFC] dark:bg-secondary border border-border-light rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <h3 className="text-sm font-bold text-text-primary">{t('آخر المعاملات', 'Latest Transactions')}</h3>
          <button onClick={() => navigate({ to: '/Akadmin/transactions' })} className="text-xs font-medium hover:underline" style={{ color: '#0EA5E9' }}>
            {t('عرض الكل ←', 'View All →')}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F1F5F9] dark:bg-tertiary border-b border-border-light">
                {[t('العميل', 'Client'), t('النوع', 'Type'), t('المبلغ', 'Amount'), t('العملة', 'Currency'), t('الحالة', 'Status'), t('التاريخ', 'Date')].map((h, i) => (
                  <th key={i} className="text-right py-2.5 px-4 text-[11px] font-semibold uppercase text-text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light/60">
              {TRANSACTIONS.slice(0, 5).map((tx, i) => (
                <tr key={i} className="hover:bg-[#0EA5E9]/[0.03] transition-colors duration-150">
                  <td className="py-2.5 px-4 text-sm text-text-primary">{lang === 'ar' ? tx.client : tx.clientEn}</td>
                  <td className="py-2.5 px-4">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor: txTypeColors[tx.type], color: txTypeTextColors[tx.type] }}>
                      {lang === 'ar' ? txTypeLabels[tx.type] : txTypeLabelsEn[tx.type]}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-sm font-bold font-mono text-text-primary">{tx.amount.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-xs text-text-muted">{tx.currency}</td>
                  <td className="py-2.5 px-4">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor: txStatusColors[tx.status], color: txStatusTextColors[tx.status] }}>
                      {lang === 'ar' ? txStatusLabels[tx.status] : txStatusLabelsEn[tx.status]}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-[11px] text-text-muted">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4.3.10 — Heatmap + 4.3.11 — Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap */}
        <div className="bg-[#F8FAFC] dark:bg-secondary border border-border-light rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-gold-deep" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">{t('خريطة حرارة نشاط العملاء', 'Client Activity Heatmap')}</h3>
              <p className="text-[11px] text-text-muted">{t('أوقات الذروة خلال الأسبوع', 'Peak Hours During the Week')}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr>
                  <th className="w-8" />
                  {days.map((d, i) => <th key={i} className="text-[9px] text-text-muted font-medium pb-1 text-center w-10">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => (
                  <tr key={hour}>
                    <td className="text-[9px] text-text-muted font-mono text-left pr-1">
                      {hour === 0 ? '12ص' : hour === 12 ? '12م' : hour > 12 ? `${hour - 12}م` : `${hour}ص`}
                    </td>
                    {days.map((_, di) => {
                      const isPeak = (di < 5 && (hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 17));
                      const isLow = di === 5 && hour <= 11;
                      const level = isPeak ? 85 : isLow ? 40 : hour >= 22 || hour <= 5 ? 0 : 15 - di * 2;
                      return (
                        <td key={di} className="p-0.5">
                          <HeatmapCell level={level} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Scale */}
          <div className="flex items-center gap-1 justify-end text-[9px] text-text-muted">
            <span>{t('منخفض', 'Low')}</span>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="w-4 h-3 rounded-sm" style={{ backgroundColor: ['#F1F5F9', 'rgba(201,168,76,0.15)', 'rgba(201,168,76,0.35)', 'rgba(201,168,76,0.60)', 'rgba(201,168,76,0.90)'][i] }} />
            ))}
            <span>{t('مرتفع', 'High')}</span>
          </div>
        </div>

        {/* Portfolio Health */}
        <div className="bg-[#F8FAFC] dark:bg-secondary border border-border-light rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-success" />
            <h3 className="text-sm font-bold text-text-primary">{t('مؤشر صحة المحافظ', 'Portfolio Health Indicator')}</h3>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <DonutChart
              segments={[{ pct: 72, color: '#00D97E' }, { pct: 18, color: '#F59E0B' }, { pct: 10, color: '#FF4560' }]}
              centerLabel="72%"
              centerSub={t('رابحة', 'Profitable')}
            />
            <div className="space-y-3 flex-1 w-full">
              {[
                { label: t('محافظ رابحة', 'Profitable Portfolios'), pct: 72, color: '#00D97E', count: '1,326' },
                { label: t('محافظ محايدة (±5%)', 'Neutral Portfolios (±5%)'), pct: 18, color: '#F59E0B', count: '332' },
                { label: t('محافظ خاسرة', 'Loss-Making Portfolios'), pct: 10, color: '#FF4560', count: '184' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-text-primary">{item.label}</span>
                  </div>
                  <span className="font-bold font-mono" style={{ color: item.color }}>{item.pct}% ({item.count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4.3.12 — Smart Alerts */}
      <div className="bg-[#F8FAFC] dark:bg-secondary border border-border-light rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-gold-deep" />
            <h3 className="text-sm font-bold text-text-primary">{t('التنبيهات الذكية', 'Smart Alerts')}</h3>
            {unreadAlerts > 0 && <span className="bg-error text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadAlerts}</span>}
          </div>
          <button onClick={() => navigate({ to: '/Akadmin/notifications' })} className="text-xs font-medium hover:underline" style={{ color: '#0EA5E9' }}>
            {t('عرض كل الإشعارات', 'View All Notifications')}
          </button>
        </div>
        <div className="divide-y divide-border-light/50">
          {ALERTS.map((alert) => (
            <div
              key={alert.id}
              onClick={() => markAlertRead(alert.id, alert.page)}
              className="flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-[#0EA5E9]/[0.06]"
              style={{ borderRight: `3px solid ${alertBorderColors[alert.type]}`, backgroundColor: !alert.read ? `${alertBorderColors[alert.type]}08` : 'transparent' }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-lg" style={{ backgroundColor: `${alertBorderColors[alert.type]}18` }}>
                {alertIcons[alert.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-text-primary">{lang === 'ar' ? alert.title : alert.titleEn}</div>
                <div className="text-[11px] text-text-muted mt-0.5">{lang === 'ar' ? alert.desc : alert.descEn}</div>
              </div>
              <span className="text-[10px] text-text-muted shrink-0">{lang === 'ar' ? alert.time : alert.timeEn}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
