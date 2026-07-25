import React, { useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/Card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, Legend } from 'recharts';

interface PerformanceTabProps {
  totalBalance: number;
  /** Real client portfolio from the backend */
  portfolio?: any;
  /** Real client transactions from the backend */
  transactions?: any[];
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function PerformanceTab({ totalBalance, portfolio, transactions }: PerformanceTabProps) {
  const { t } = useLang();

  const fallbackChartData = [
    { name: 'Jan', value: totalBalance * 0.85, market: totalBalance * 0.88 },
    { name: 'Feb', value: totalBalance * 0.88, market: totalBalance * 0.89 },
    { name: 'Mar', value: totalBalance * 0.91, market: totalBalance * 0.87 },
    { name: 'Apr', value: totalBalance * 0.94, market: totalBalance * 0.91 },
    { name: 'May', value: totalBalance * 0.97, market: totalBalance * 0.92 },
    { name: 'Jun', value: totalBalance, market: totalBalance * 0.93 },
  ];

  // Real monthly deposits vs withdrawals over the last 6 months
  const realChartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return null;

    const now = new Date();
    const buckets: { key: string; name: string; value: number; market: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        name: MONTH_LABELS[d.getMonth()],
        value: 0,
        market: 0,
      });
    }

    let matched = 0;
    transactions.forEach((tx: any) => {
      const rawDate = tx?.date || tx?.created_at;
      if (!rawDate) return;
      const key = String(rawDate).slice(0, 7);
      const bucket = buckets.find(b => b.key === key);
      if (!bucket) return;
      const amount = Math.abs(Number(tx?.amount ?? 0)) || 0;
      const type = String(tx?.type || '').toLowerCase();
      if (type === 'deposit') { bucket.value += amount; matched++; }
      else if (type === 'withdrawal') { bucket.market += amount; matched++; }
    });

    if (matched === 0) return null;
    return buckets.map(({ name, value, market }) => ({ name, value, market }));
  }, [transactions]);

  const usingRealData = realChartData !== null;
  const chartData = realChartData ?? fallbackChartData;

  const portfolioValuation = Number(portfolio?.total_valuation ?? 0) || totalBalance;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black">{t('تحليل الأداء التاريخي والنمو', 'Portfolio Performance Analytics')}</h2>
          <p className="text-xs text-text-muted">{t('تحليل ومقارنة لمؤشرات الأداء ومستويات التقلب', 'Deep dive into performance indicators')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="font-black text-sm">{usingRealData ? t('حركة الإيداعات والسحوبات — آخر 6 أشهر', 'Deposits vs Withdrawals — Last 6 Months') : t('مقارنة العوائد بالمؤشرات العالمية المرجعية', 'Returns Comparison with Benchmark Indices')}</h3>
            <span className="text-[11px] font-bold text-text-muted font-mono">{t('قيمة المحفظة', 'Portfolio Value')}: SAR {portfolioValuation.toLocaleString()}</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <ChartTooltip />
                <Legend />
                <Bar name={usingRealData ? t('الإيداعات', 'Deposits') : t('محفظة ثروة الخاصة بك', 'My Tharwah Portfolio')} dataKey="value" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                <Bar name={usingRealData ? t('السحوبات', 'Withdrawals') : t('مؤشر السوق العام TASI', 'TASI Stock Index')} dataKey="market" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-black text-sm">{t('تحليل المخاطر والأمان', 'Risk & Protection Ratios')}</h3>
          <div className="space-y-4 text-xs font-bold text-text-secondary">
            {[
              { label: t('نسبة شارب', 'Sharpe Ratio'), value: '1.82', note: t('أداء ممتاز نسبة للمخاطر', 'Excellent risk-adjusted returns'), color: 'text-emerald-500' },
              { label: t('التقلب السنوي', 'Annualized Volatility'), value: '4.21%', note: t('تقلب منخفض ومستقر', 'Stable and secure'), color: 'text-emerald-500' },
              { label: t('أقصى هبوط', 'Max Drawdown'), value: '-1.5%', note: t('حماية فائقة لراس المال', 'High principal protection'), color: 'text-emerald-500' },
            ].map((item, i) => (
              <div key={i} className="p-3 bg-secondary rounded-lg border">
                <div className="text-text-muted mb-1">{item.label}</div>
                <div className="text-lg font-black font-mono text-text-primary">{item.value}</div>
                <span className={`text-[10px] ${item.color}`}>★ {item.note}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
