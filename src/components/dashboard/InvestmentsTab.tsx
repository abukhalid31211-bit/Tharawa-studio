import React, { useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Download, PackageOpen } from 'lucide-react';

interface InvestmentsTabProps {
  totalBalance: number;
  onExportPDF: () => void;
  /** Real client portfolio coming from the backend (includes `assets`) */
  portfolio?: any;
}

interface AssetRow {
  name: string;
  type: string;
  weight: string;
  val: number;
  profit: string;
  profitNegative?: boolean;
  status: string;
}

const GROUP_STYLES = [
  { border: 'border-l-gold-primary', emoji: '🏢' },
  { border: 'border-l-sky-500', emoji: '📜' },
  { border: 'border-l-violet-500', emoji: '🌍' },
  { border: 'border-l-emerald-500', emoji: '💠' },
  { border: 'border-l-amber-500', emoji: '📈' },
  { border: 'border-l-rose-500', emoji: '🧾' },
];

export function InvestmentsTab({ totalBalance, onExportPDF, portfolio }: InvestmentsTabProps) {
  const { t } = useLang();

  const realAssets = useMemo<any[]>(() => (Array.isArray(portfolio?.assets) ? portfolio.assets : []), [portfolio]);
  const hasRealAssets = realAssets.length > 0;
  // The prop is provided by the dashboard (may be `null` when the client has no
  // portfolio yet). Only when the prop is completely absent do we keep the old
  // indicative sample data as a visual fallback.
  const showEmptyState = portfolio !== undefined && !hasRealAssets;

  const assets = useMemo<AssetRow[]>(() => {
    // Indicative sample rows kept only as a visual fallback
    if (!hasRealAssets) return [
      { name: t('صندوق الراجحي العقاري الوقفي', 'Al Rajhi RE Waqf Fund'), type: t('عقارات', 'Real Estate'), weight: '12%', val: totalBalance * 0.12, profit: '+14.5%', status: 'active' },
      { name: t('صكوك الحكومة السعودية السيادية', 'KSA Sovereign Sukuk V5'), type: t('صكوك', 'Sukuk'), weight: '20%', val: totalBalance * 0.20, profit: '+5.4%', status: 'active' },
      { name: t('أسهم مايكروسوفت متوافقة', 'Microsoft Corp Shariah Stock'), type: t('أسهم عالمية', 'Global Equities'), weight: '15%', val: totalBalance * 0.15, profit: '+24.1%', status: 'active' },
      { name: t('أسهم شركة أبل متوافقة', 'Apple Inc Shariah Stock'), type: t('أسهم عالمية', 'Global Equities'), weight: '12%', val: totalBalance * 0.12, profit: '+18.2%', status: 'active' },
      { name: t('محفظة النقد السائل المرنة', 'Tharwah Liquid Cash Fund'), type: t('نقد وسيولة', 'Liquid Cash'), weight: '5%', val: totalBalance * 0.05, profit: '+3.2%', status: 'active' },
    ];
    return realAssets.map((asset: any) => {
      const val = Number(asset?.valuation ?? 0) || 0;
      const weightRaw = asset?.weight ?? asset?.weight_percent;
      const weightNum = Number(weightRaw);
      const weight = weightRaw !== undefined && weightRaw !== null && !isNaN(weightNum)
        ? `${weightNum.toFixed(weightNum % 1 === 0 ? 0 : 1)}%`
        : totalBalance > 0 ? `${((val / totalBalance) * 100).toFixed(1)}%` : '—';
      const plRaw = asset?.profit_loss_percent ?? asset?.annual_yield;
      const plNum = Number(plRaw);
      const profit = plRaw !== undefined && plRaw !== null && !isNaN(plNum)
        ? `${plNum >= 0 ? '+' : ''}${plNum.toFixed(1)}%`
        : '—';
      return {
        name: asset?.asset_name || asset?.name || asset?.symbol || t('أصل غير مسمى', 'Unnamed asset'),
        type: asset?.asset_class || t('غير مصنّف', 'Uncategorized'),
        weight,
        val,
        profit,
        profitNegative: !isNaN(plNum) && plNum < 0,
        status: asset?.status || 'active',
      };
    });
  }, [realAssets, hasRealAssets, totalBalance, t]);

  // Group real assets by their class for the three summary cards
  const summaryGroups = useMemo(() => {
    if (!hasRealAssets) {
      return [
        { border: GROUP_STYLES[0].border, emoji: GROUP_STYLES[0].emoji, name: t('عقارات وأصول مدرة للدخل', 'Real Estate Funds'), pct: '20%', val: totalBalance * 0.20, desc: t('صناديق ريت عقارية مرخصة محلياً وعالمياً', 'Licensed REIT real estate funds'), yield: '+7.2%' },
        { border: GROUP_STYLES[1].border, emoji: GROUP_STYLES[1].emoji, name: t('صكوك تمويلية وسندات', 'Sukuk & Fixed Income'), pct: '25%', val: totalBalance * 0.25, desc: t('صكوك سيادية وحكومية منخفضة المخاطر', 'Low-risk sovereign Sukuk'), yield: '+5.8%' },
        { border: GROUP_STYLES[2].border, emoji: GROUP_STYLES[2].emoji, name: t('الأسهم العالمية المتوافقة', 'Global Shariah Equities'), pct: '35%', val: totalBalance * 0.35, desc: t('أسهم القيادة والنمو', 'Blue-chip growth stocks'), yield: '+12.4%' },
      ];
    }

    const grouped = new Map<string, { val: number; count: number; yieldSum: number; yieldCount: number }>();
    realAssets.forEach((asset: any) => {
      const key = String(asset?.asset_class || t('غير مصنّف', 'Uncategorized'));
      const val = Number(asset?.valuation ?? 0) || 0;
      const plNum = Number(asset?.profit_loss_percent ?? asset?.annual_yield);
      const bucket = grouped.get(key) || { val: 0, count: 0, yieldSum: 0, yieldCount: 0 };
      bucket.val += val;
      bucket.count += 1;
      if (!isNaN(plNum)) { bucket.yieldSum += plNum; bucket.yieldCount += 1; }
      grouped.set(key, bucket);
    });

    const totalVal = Array.from(grouped.values()).reduce((sum, g) => sum + g.val, 0) || 1;
    return Array.from(grouped.entries())
      .sort((a, b) => b[1].val - a[1].val)
      .slice(0, 3)
      .map(([name, bucket], i) => {
        const avgYield = bucket.yieldCount > 0 ? bucket.yieldSum / bucket.yieldCount : null;
        return {
          border: GROUP_STYLES[i % GROUP_STYLES.length].border,
          emoji: GROUP_STYLES[i % GROUP_STYLES.length].emoji,
          name,
          pct: `${((bucket.val / totalVal) * 100).toFixed(0)}%`,
          val: bucket.val,
          desc: t(`${bucket.count} أصل ضمن هذه الفئة`, `${bucket.count} asset(s) in this class`),
          yield: avgYield === null ? '—' : `${avgYield >= 0 ? '+' : ''}${avgYield.toFixed(1)}%`,
        };
      });
  }, [realAssets, hasRealAssets, totalBalance, t]);

  const emptyState = (
    <Card className="p-10 flex flex-col items-center justify-center text-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-gold-light flex items-center justify-center">
        <PackageOpen className="w-7 h-7 text-gold-deep" />
      </div>
      <h3 className="font-black text-base text-text-primary">
        {t('لا توجد أصول في محفظتك حتى الآن — تواصل مع مستشارك', 'No assets in your portfolio yet — please contact your advisor')}
      </h3>
      <p className="text-xs text-text-muted max-w-md leading-relaxed">
        {t('سيظهر هنا تفصيل كامل لأصولك فور اعتماد محفظتك من فريق الاستثمار.', 'A full breakdown of your holdings will appear here once your portfolio is activated by our investment team.')}
      </p>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black">{t('تفاصيل ومكونات الأصول الاستثمارية', 'Portfolio Asset Holdings')}</h2>
          <p className="text-xs text-text-muted">{t('كشف بكافة الأصول والأسهم والصكوك المملوكة لمحفظتك حالياً', 'List of all assets, stocks, and sukuk owned by your portfolio')}</p>
        </div>
        <Button onClick={onExportPDF} className="gap-1.5 text-xs py-2 px-3">
          <Download className="w-4 h-4" /> {t('تحميل ملف الأصول PDF', 'Export PDF')}
        </Button>
      </div>

      {showEmptyState ? emptyState : (
      <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {summaryGroups.map((item, i) => (
          <Card key={i} className={`p-5 border-l-4 ${item.border}`}>
            <h4 className="font-black text-sm text-text-primary mb-2 flex items-center justify-between">
              <span>{item.emoji} {item.name}</span>
              <span className="text-xs bg-gold-light text-gold-deep px-2 py-0.5 rounded font-mono">{item.pct}</span>
            </h4>
            <div className="text-xl font-black mb-1">SAR {item.val.toLocaleString()}</div>
            <p className="text-xs text-text-muted mb-4">{item.desc}</p>
            <div className="text-xs font-bold text-text-secondary space-y-1.5 border-t pt-3">
              <div className="flex justify-between"><span>{t('العائد المتوقع', 'Annual Yield')}</span><span className={`font-mono ${item.yield.startsWith('-') ? 'text-red-500' : 'text-emerald-500'}`}>{item.yield}</span></div>
              <div className="flex justify-between"><span>{t('القيمة السوقية', 'Valuation')}</span><span className="font-mono">SAR {item.val.toLocaleString()}</span></div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-0 overflow-hidden border-none lg:border lg:border-border-default shadow-none lg:shadow-sm">
        <h3 className="font-black text-base mb-4 hidden lg:block p-6 pb-0">{t('أداء وتفاصيل الأصول الفردية', 'Individual Asset Breakdown')}</h3>
        
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto p-6 pt-0">
          <table className="w-full text-sm font-bold text-text-secondary text-right">
            <thead>
              <tr className="border-b text-xs text-text-muted uppercase">
                <th className="pb-3">{t('الأصل الاستثماري', 'Asset')}</th>
                <th className="pb-3">{t('فئة الأصول', 'Class')}</th>
                <th className="pb-3">{t('نسبة التوزيع', 'Weight')}</th>
                <th className="pb-3">{t('القيمة الإجمالية', 'Valuation')}</th>
                <th className="pb-3">{t('معدل الربح/الخسارة', 'P/L')}</th>
                <th className="pb-3">{t('حالة الأصل', 'Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assets.map((asset, i) => (
                <tr key={i} className="hover:bg-secondary/40 transition-colors">
                  <td className="py-3.5 text-text-primary font-black">{asset.name}</td>
                  <td className="py-3.5">{asset.type}</td>
                  <td className="py-3.5 font-mono">{asset.weight}</td>
                  <td className="py-3.5 font-mono">SAR {asset.val.toLocaleString()}</td>
                  <td className={`py-3.5 font-mono ${asset.profitNegative ? 'text-red-500' : 'text-emerald-500'}`}>{asset.profit}</td>
                  <td className="py-3.5"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-xs font-black">{asset.status === 'active' ? t('نشط', 'Active') : asset.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-3">
          <h3 className="font-black text-sm px-1 mb-2 text-text-muted uppercase tracking-wider">{t('الأصول الفردية', 'Individual Assets')}</h3>
          {assets.map((asset, i) => (
            <div key={i} className="bg-white dark:bg-[#1C1C34] border border-border-light dark:border-[#2D2D50] rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="text-sm font-black text-text-primary mb-1">{asset.name}</h4>
                  <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-text-muted font-bold">{asset.type}</span>
                </div>
                <span className={`text-xs font-black px-2 py-1 rounded-lg ${asset.profitNegative ? 'text-red-500 bg-red-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>{asset.profit}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-dashed border-border-light">
                <div>
                  <span className="text-[10px] text-text-muted block mb-0.5">{t('القيمة الإجمالية', 'Total Value')}</span>
                  <span className="text-sm font-black text-text-primary font-mono">SAR {asset.val.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block mb-0.5">{t('نسبة التوزيع', 'Allocation')}</span>
                  <span className="text-sm font-black text-gold-deep font-mono">{asset.weight}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      </>
      )}
    </div>
  );
}
