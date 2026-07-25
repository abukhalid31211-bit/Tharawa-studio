import React, { useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Plus, ArrowUpRight, ArrowDownLeft, TrendingUp, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as ChartTooltip, PieChart, Pie, Cell } from 'recharts';

interface DashboardHomeProps {
  totalBalance: number;
  profitAmount: number;
  greeting: string;
  sessionName: string;
  onOpenTransfer: (type: 'deposit' | 'withdrawal') => void;
  lang: 'ar' | 'en';
  /** Real portfolio reference code from the backend (e.g. "TH-1234567") */
  portfolioCode?: string;
  /** Client membership tier from the backend (e.g. "Gold", "Platinum") */
  tier?: string;
  /** Real growth percentage from the backend portfolio */
  growthPercent?: number;
  /** Real assets belonging to the client portfolio (from the backend) */
  assets?: any[];
}

/** Fixed, deterministic palette used when rendering real backend asset classes */
const ALLOCATION_COLORS = ['#C9A84C', '#334155', '#0EA5E9', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#14B8A6'];

export function DashboardHome({ totalBalance, profitAmount, greeting, sessionName, onOpenTransfer, portfolioCode, tier, growthPercent = 18.5, assets }: DashboardHomeProps) {
  const { t } = useLang();

  const chartData = [
    { name: 'Jan', value: totalBalance * 0.85, market: totalBalance * 0.88 },
    { name: 'Feb', value: totalBalance * 0.88, market: totalBalance * 0.89 },
    { name: 'Mar', value: totalBalance * 0.91, market: totalBalance * 0.87 },
    { name: 'Apr', value: totalBalance * 0.94, market: totalBalance * 0.91 },
    { name: 'May', value: totalBalance * 0.97, market: totalBalance * 0.92 },
    { name: 'Jun', value: totalBalance, market: totalBalance * 0.93 },
  ];

  // Real allocation grouped by asset_class when the backend returned assets,
  // otherwise fall back to the indicative relative split.
  const pieData = useMemo(() => {
    if (assets && assets.length > 0) {
      const grouped = new Map<string, number>();
      assets.forEach((asset: any) => {
        const key = String(asset?.asset_class || t('أخرى', 'Other'));
        const value = Number(asset?.valuation ?? 0);
        grouped.set(key, (grouped.get(key) || 0) + (isNaN(value) ? 0 : value));
      });
      const entries = Array.from(grouped.entries()).sort((a, b) => b[1] - a[1]);
      if (entries.length > 0 && entries.some(([, value]) => value > 0)) {
        return entries.map(([name, value], index) => ({
          name,
          value,
          color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],
        }));
      }
    }
    return [
      { name: t('الأسهم العالمية', 'Global Equities'), value: totalBalance * 0.35, color: ALLOCATION_COLORS[0] },
      { name: t('الصكوك والسندات', 'Sukuk & Fixed Income'), value: totalBalance * 0.25, color: ALLOCATION_COLORS[1] },
      { name: t('العقارات', 'Real Estate'), value: totalBalance * 0.20, color: ALLOCATION_COLORS[2] },
      { name: t('رأس المال الجريء', 'Venture Capital'), value: totalBalance * 0.15, color: ALLOCATION_COLORS[3] },
      { name: t('النقد والسيولة', 'Cash & Liquid'), value: totalBalance * 0.05, color: ALLOCATION_COLORS[4] },
    ];
  }, [assets, totalBalance, t]);

  const allocationTotal = useMemo(
    () => pieData.reduce((sum, item) => sum + (Number(item.value) || 0), 0),
    [pieData]
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-gold-primary/10 to-gold-deep/5 border border-border-gold rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">
          <h2 className="text-2xl font-black text-text-primary">{greeting}، {sessionName} 👋</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            {t('نحن فخورون بمواكبة رحلتك المالية وتنمية ثروتك باحترافية وأمان ومطابقة كاملة للقيم الشرعية.', 'We are proud to partner on your financial journey, growing your wealth professionally and securely.')}
          </p>
          <div className="flex flex-wrap gap-4 text-xs font-bold text-text-secondary pt-2">
            <span className="bg-white dark:bg-primary border px-2.5 py-1 rounded-lg">📍 {t('الرقم المرجعي', 'Acc No')}: {portfolioCode || 'TH-0000000'}</span>
            <span className="bg-white dark:bg-primary border px-2.5 py-1 rounded-lg">⭐ {t('العضوية', 'Tier')}: {tier || t('ذهبي', 'Gold')}</span>
            <span className="bg-white dark:bg-primary border px-2.5 py-1 rounded-lg">📈 {t('معدل النمو', 'Returns')}: +{growthPercent.toFixed(1)}%</span>
          </div>
        </div>
        <div className="flex gap-2 relative z-10">
          <Button onClick={() => onOpenTransfer('deposit')} className="gap-1.5 text-xs py-2.5 px-4">
            <Plus className="w-4 h-4" /> {t('إيداع أموال', 'Deposit')}
          </Button>
          <Button variant="ghost" onClick={() => onOpenTransfer('withdrawal')} className="gap-1.5 text-xs py-2.5 px-4 border border-border-default">
            <ArrowDownLeft className="w-4 h-4 text-red-500" /> {t('طلب سحب', 'Withdraw')}
          </Button>
        </div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-gold-primary/20 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-gold-deep/10 rounded-full blur-[40px] pointer-events-none" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-text-muted text-xs font-bold mb-1">{t('القيمة الإجمالية للمحفظة', 'Total Portfolio Valuation')}</div>
          <div className="text-2xl font-black text-text-primary mb-1">SAR {totalBalance.toLocaleString()}</div>
          <div className="text-xs text-emerald-500 font-bold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +{growthPercent.toFixed(1)}% (+SAR {profitAmount.toLocaleString()})
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-text-muted text-xs font-bold mb-1">{t('صافي أرباح المحفظة', 'Net Profit / Growth')}</div>
          <div className="text-2xl font-black text-emerald-600 mb-1">SAR {profitAmount.toLocaleString()}</div>
          <div className="text-xs text-text-muted">{t('منذ تاريخ بدء الاستثمار', 'Since inception date')}</div>
        </Card>
        <Card className="p-6">
          <div className="text-text-muted text-xs font-bold mb-1">{t('مستوى المخاطرة', 'Risk profile level')}</div>
          <div className="text-2xl font-black text-text-primary mb-1">{t('متوازن ومحافظ', 'Balanced/Conservative')}</div>
          <div className="text-xs text-gold-deep font-bold">💎 {t('متوافق مع الشريعة', '100% Shariah Compliant')}</div>
        </Card>
        <Card className="p-6">
          <div className="text-text-muted text-xs font-bold mb-1">{t('أصول مستثمرة نشطة', 'Active Assets')}</div>
          <div className="text-2xl font-black text-text-primary mb-1">{assets && assets.length > 0 ? assets.length : 5} {t('أصول', 'Assets')}</div>
          <div className="text-xs text-text-muted">{t('موزعة بين العقار والأسهم والصكوك', 'Allocated across sectors')}</div>
        </Card>
      </div>

      {/* Chart & Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold-deep" /> {t('أداء المحفظة ونمو الثروة', 'Portfolio Performance & Growth')}
            </h3>
            <span className="text-[11px] text-text-muted">{t('آخر 6 أشهر', 'Past 6 Months')}</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <ChartTooltip />
                <Area type="monotone" name={t('محفظتي', 'My Portfolio')} dataKey="value" stroke="#C9A84C" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVal)" />
                <Area type="monotone" name={t('مؤشر السوق', 'Market Index')} dataKey="market" stroke="#0EA5E9" strokeWidth={1.5} strokeDasharray="3 3" fillOpacity={1} fill="url(#colorMarket)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-base font-black flex items-center gap-2">
            <Activity className="w-5 h-5 text-gold-deep" /> {t('توزيع وتكامل الأصول', 'Asset Allocation')}
          </h3>
          <div className="h-44 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-[11px] text-text-muted block">{t('رأس المال', 'Valuation')}</span>
              <span className="text-sm font-black text-text-primary">SAR {(totalBalance/1000).toFixed(0)}k</span>
            </div>
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs font-bold text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="font-mono">{allocationTotal > 0 ? ((item.value / allocationTotal) * 100).toFixed(0) : '0'}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
