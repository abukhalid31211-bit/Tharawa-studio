// ─────────────────────────────────────────────────────────────
// 4.11 (Main-Pages) — Reports التقارير الإدارية
// توليد تقارير الأداء + سجل التقارير + تصدير CSV
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import { FileBarChart2, Download, Play } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useClients, useTransactions, usePortfolios, useMessages, ADMIN_KEYS, nextCode, addAuditEntry } from '@/lib/adminData';
import { usePlatformDataState } from '@/lib/platformState';
import { useReportsSummary } from '@/lib/queries';
import {
  PageHeader, Panel, PanelHeader, Pill, StatCard, Field, SelectBox,
  PrimaryBtn, EmptyState, DataTable, Tr, Td, useToast, exportCSV,
} from '@/components/admin/ui';

interface ReportRecord {
  id: string;
  type: string;
  typeEn: string;
  period: string;
  createdAt: string;
  rows: number;
  size: string;
  format: string;
}

const REPORT_TYPES = [
  { value: 'platform', ar: 'تقرير أداء المنصة الشامل', en: 'Overall Platform Performance' },
  { value: 'clients', ar: 'تقرير العملاء والأرصدة', en: 'Clients & Balances Report' },
  { value: 'transactions', ar: 'تقرير المعاملات المالية', en: 'Financial Transactions Report' },
  { value: 'portfolios', ar: 'تقرير المحافظ والعوائد', en: 'Portfolios & Returns Report' },
  { value: 'support', ar: 'تقرير تذاكر الدعم', en: 'Support Tickets Report' },
];

const PERIODS = [
  { value: 'month', ar: 'آخر 30 يوماً', en: 'Last 30 days' },
  { value: 'quarter', ar: 'الربع الحالي', en: 'Current quarter' },
  { value: 'year', ar: 'السنة الحالية', en: 'Current year' },
  { value: 'all', ar: 'كل الفترات', en: 'All time' },
];

export function Reports() {
  const { t, lang } = useLang();
  const [clients] = useClients();
  const [transactions] = useTransactions();
  const [portfolios] = usePortfolios();
  const [messages] = useMessages();
  const [period, setPeriod] = useState('month');
  const { data: summaryData } = useReportsSummary(period);
  const summary = (summaryData as any)?.data;
  const [history, setHistory] = usePlatformDataState<ReportRecord[]>(ADMIN_KEYS.REPORTS_HISTORY, [
    { id: 'RPT-3', type: 'تقرير أداء المنصة الشامل', typeEn: 'Overall Platform Performance', period: 'الربع الحالي', createdAt: '2026-07-01 09:00', rows: 18, size: '42 KB', format: 'CSV' },
    { id: 'RPT-2', type: 'تقرير العملاء والأرصدة', typeEn: 'Clients & Balances Report', period: 'السنة الحالية', createdAt: '2026-06-15 13:30', rows: 9, size: '15 KB', format: 'CSV' },
    { id: 'RPT-1', type: 'تقرير المعاملات المالية', typeEn: 'Financial Transactions Report', period: 'آخر 30 يوماً', createdAt: '2026-06-01 10:12', rows: 10, size: '11 KB', format: 'CSV' },
  ]);
  const { show, ToastView } = useToast();

  const [reportType, setReportType] = useState('platform');
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<{ headers: string[]; rows: (string | number)[][] } | null>(null);

  // KPIs: prefer server-side aggregation from /api/reports/summary; fall back to local calculation
  const kpis = useMemo(() => {
    if (summary) {
      return {
        aum: Number(summary.totalAum ?? summary.total_aum ?? 0),
        active: Number(summary.activeClients ?? summary.active_clients ?? clients.filter(c => c.status === 'active').length),
        pending: Number(summary.pendingTransactions ?? summary.pending_transactions ?? transactions.filter(x => x.status === 'pending').length),
        completion: Number(summary.completionRate ?? summary.completion_rate ?? (transactions.length ? Math.round((transactions.filter(x => x.status === 'completed').length / transactions.length) * 100) : 0)),
      };
    }
    return {
      aum: portfolios.reduce((s, p) => s + p.value, 0),
      active: clients.filter(c => c.status === 'active').length,
      pending: transactions.filter(x => x.status === 'pending').length,
      completion: transactions.length ? Math.round((transactions.filter(x => x.status === 'completed').length / transactions.length) * 100) : 0,
    };
  }, [summary, clients, transactions, portfolios]);

  const buildRows = (): { headers: string[]; rows: (string | number)[][]; count: number } => {
    switch (reportType) {
      case 'clients':
        return {
          headers: ['ID', lang === 'ar' ? 'الاسم' : 'Name', 'Email', lang === 'ar' ? 'العضوية' : 'Tier', lang === 'ar' ? 'الحالة' : 'Status', lang === 'ar' ? 'الرصيد (ر.س)' : 'Balance (SAR)', lang === 'ar' ? 'التسجيل' : 'Joined'],
          rows: clients.map(c => [c.id, lang === 'ar' ? c.name : c.nameEn, c.email, c.tier, c.status, c.balance, c.joinDate]),
          count: clients.length,
        };
      case 'transactions':
        return {
          headers: ['ID', lang === 'ar' ? 'العميل' : 'Client', lang === 'ar' ? 'النوع' : 'Type', lang === 'ar' ? 'المبلغ' : 'Amount', lang === 'ar' ? 'الحالة' : 'Status', lang === 'ar' ? 'التاريخ' : 'Date'],
          rows: transactions.map(x => {
            const c = clients.find(cl => cl.id === x.clientId);
            return [x.id, lang === 'ar' ? c?.name || '' : c?.nameEn || '', x.type, x.amount, x.status, x.date];
          }),
          count: transactions.length,
        };
      case 'portfolios':
        return {
          headers: ['ID', lang === 'ar' ? 'المحفظة' : 'Portfolio', lang === 'ar' ? 'العميل' : 'Client', lang === 'ar' ? 'القيمة (ر.س)' : 'Value (SAR)', lang === 'ar' ? 'العائد %' : 'Return %', lang === 'ar' ? 'الأصول' : 'Holdings'],
          rows: portfolios.map(p => {
            const c = clients.find(cl => cl.id === p.clientId);
            return [p.id, lang === 'ar' ? p.name : p.nameEn, lang === 'ar' ? c?.name || '' : c?.nameEn || '', p.value, p.growth, p.holdings.length];
          }),
          count: portfolios.length,
        };
      case 'support':
        return {
          headers: ['ID', lang === 'ar' ? 'العميل' : 'Client', lang === 'ar' ? 'الموضوع' : 'Subject', lang === 'ar' ? 'الأولوية' : 'Priority', lang === 'ar' ? 'الحالة' : 'Status', lang === 'ar' ? 'التاريخ' : 'Date'],
          rows: messages.map(m => {
            const c = clients.find(cl => cl.id === m.clientId);
            return [m.id, lang === 'ar' ? c?.name || '' : c?.nameEn || '', m.subject, m.priority, m.status, m.date];
          }),
          count: messages.length,
        };
      default:
        return {
          headers: [lang === 'ar' ? 'المؤشر' : 'Metric', lang === 'ar' ? 'القيمة' : 'Value'],
          rows: [
            [t('إجمالي العملاء', 'Total Clients'), clients.length],
            [t('العملاء النشطون', 'Active Clients'), kpis.active],
            [t('إجمالي الأصول المدارة (ر.س)', 'Total AUM (SAR)'), kpis.aum],
            [t('عدد المحافظ', 'Portfolios'), portfolios.length],
            [t('إجمالي المعاملات', 'Total Transactions'), transactions.length],
            [t('معاملات معلقة', 'Pending Transactions'), kpis.pending],
            [t('نسبة إتمام العمليات', 'Completion Rate'), `${kpis.completion}%`],
            [t('تذاكر الدعم المفتوحة', 'Open Support Tickets'), messages.filter(m => m.status !== 'closed').length],
            [t('متوسط عائد المحافظ', 'Avg. Portfolio Return'), `${(portfolios.reduce((s, p) => s + p.growth, 0) / (portfolios.length || 1)).toFixed(1)}%`],
          ],
          count: 9,
        };
    }
  };

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      const built = buildRows();
      setPreview(built);
      const typeMeta = REPORT_TYPES.find(r => r.value === reportType)!;
      const periodMeta = PERIODS.find(p => p.value === period)!;
      const record: ReportRecord = {
        id: nextCode(history, 'RPT'),
        type: typeMeta.ar,
        typeEn: typeMeta.en,
        period: lang === 'ar' ? periodMeta.ar : periodMeta.en,
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        rows: built.count,
        size: `${Math.max(8, built.count * 3)} KB`,
        format: 'CSV',
      };
      setHistory(prev => [record, ...prev].slice(0, 30));
      addAuditEntry('admin@tharwah.com', `توليد تقرير ${typeMeta.ar}`, `Generated ${typeMeta.en}`);
      setGenerating(false);
      show(t('تم توليد التقرير بنجاح', 'Report generated successfully'));
    }, 900);
  };

  const downloadPreview = () => {
    if (!preview) return;
    const typeMeta = REPORT_TYPES.find(r => r.value === reportType)!;
    exportCSV(`${typeMeta.en.replace(/\s+/g, '_')}.csv`, preview.headers, preview.rows);
    show(t('تم تنزيل ملف CSV', 'CSV file downloaded'));
  };

  const typeOptions = REPORT_TYPES.map(r => ({ value: r.value, label: lang === 'ar' ? r.ar : r.en }));
  const periodOptions = PERIODS.map(p => ({ value: p.value, label: lang === 'ar' ? p.ar : p.en }));

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('التقارير المالية والتحليل الشامل', 'Financial Reports & Analytics')}
        subtitle={t('توليد وتصدير تقارير أداء المنصة والعملاء والمحافظ بصيغة قابلة للمشاركة', 'Generate and export platform, client & portfolio reports in shareable formats')}
      />

      {/* مؤشرات سريعة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t('إجمالي الأصول المدارة (ر.س)', 'Total AUM (SAR)')} value={(kpis.aum / 1000).toFixed(0) + 'K'} icon="🏦" color="#C9A84C" />
        <StatCard label={t('معدل إتمام العمليات', 'Completion Rate')} value={`${kpis.completion}%`} icon="⚡" color="#00D97E" />
        <StatCard label={t('معاملات بانتظار الاعتماد', 'Pending Approvals')} value={kpis.pending} icon="📋" color="#F59E0B" />
        <StatCard label={t('تقارير مولّدة هذا الشهر', 'Reports This Month')} value={history.length} icon="📊" color="#0EA5E9" />
      </div>

      {/* مولّد التقارير */}
      <Panel>
        <PanelHeader icon={FileBarChart2} iconColor="#0EA5E9" title={t('توليد تقرير جديد', 'Generate New Report')} subtitle={t('اختر نوع التقرير والفترة الزمنية ثم اضغط توليد', 'Pick report type and period, then generate')} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 items-end">
          <Field label={t('نوع التقرير', 'Report Type')}>
            <SelectBox value={reportType} onChange={e => setReportType(e.target.value)} options={typeOptions} />
          </Field>
          <Field label={t('الفترة الزمنية', 'Time Period')}>
            <SelectBox value={period} onChange={e => setPeriod(e.target.value)} options={periodOptions} />
          </Field>
          <PrimaryBtn icon={Play} onClick={generate} disabled={generating}>
            {generating ? t('⏳ جارٍ التوليد...', '⏳ Generating...') : t('توليد التقرير', 'Generate Report')}
          </PrimaryBtn>
        </div>
      </Panel>

      {/* معاينة */}
      {preview && (
        <Panel padded={false}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] dark:border-border-default">
            <PanelHeader icon={FileBarChart2} iconColor="#00D97E" title={lang === 'ar' ? REPORT_TYPES.find(r => r.value === reportType)!.ar : REPORT_TYPES.find(r => r.value === reportType)!.en} subtitle={lang === 'ar' ? PERIODS.find(p => p.value === period)!.ar : PERIODS.find(p => p.value === period)!.en} />
            <PrimaryBtn icon={Download} color="#00B894" colorHover="#00A07F" onClick={downloadPreview}>{t('تنزيل CSV', 'Download CSV')}</PrimaryBtn>
          </div>
          <DataTable headers={preview.headers.map(String)}>
            {preview.rows.slice(0, 10).map((row, ri) => (
              <Tr key={ri}>
                {row.map((cell, ci) => <Td key={ci} mono={typeof cell === 'number'}>{String(cell)}</Td>)}
              </Tr>
            ))}
          </DataTable>
          {preview.rows.length > 10 && (
            <div className="px-5 py-3 text-center text-[11px] text-text-muted border-t border-[#E2E8F0] dark:border-border-default">
              {t(`معاينة أول 10 صفوف من أصل ${preview.rows.length} — نزّل الملف للاطلاع على الكل`, `Previewing 10 of ${preview.rows.length} rows — download the file for the full report`)}
            </div>
          )}
        </Panel>
      )}

      {/* سجل التقارير */}
      <Panel padded={false}>
        <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-border-default">
          <PanelHeader icon={Download} iconColor="#C9A84C" title={t('سجل التقارير المولّدة', 'Generated Reports History')} />
        </div>
        {history.length === 0 ? (
          <EmptyState icon="📄" text={t('لم يتم توليد تقارير بعد', 'No reports generated yet')} />
        ) : (
          <DataTable headers={[t('المعرف', 'ID'), t('التقرير', 'Report'), t('الفترة', 'Period'), t('الصفوف', 'Rows'), t('الحجم', 'Size'), t('الصيغة', 'Format'), t('تاريخ التوليد', 'Generated At')]}>
            {history.map(r => (
              <Tr key={r.id}>
                <Td mono bold>{r.id}</Td>
                <Td bold>{lang === 'ar' ? r.type : r.typeEn}</Td>
                <Td>{r.period}</Td>
                <Td mono>{r.rows}</Td>
                <Td mono>{r.size}</Td>
                <Td><Pill text={r.format} color="#0EA5E9" /></Td>
                <Td mono>{r.createdAt}</Td>
              </Tr>
            ))}
          </DataTable>
        )}
      </Panel>
      {ToastView}
    </div>
  );
}
