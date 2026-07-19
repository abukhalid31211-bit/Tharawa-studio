import React from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Download } from 'lucide-react';

interface InvestmentsTabProps {
  totalBalance: number;
  onExportPDF: () => void;
}

export function InvestmentsTab({ totalBalance, onExportPDF }: InvestmentsTabProps) {
  const { t } = useLang();

  const assets = [
    { name: t('صندوق الراجحي العقاري الوقفي', 'Al Rajhi RE Waqf Fund'), type: t('عقارات', 'Real Estate'), weight: '12%', val: totalBalance * 0.12, profit: '+14.5%', status: 'active' },
    { name: t('صكوك الحكومة السعودية السيادية', 'KSA Sovereign Sukuk V5'), type: t('صكوك', 'Sukuk'), weight: '20%', val: totalBalance * 0.20, profit: '+5.4%', status: 'active' },
    { name: t('أسهم مايكروسوفت متوافقة', 'Microsoft Corp Shariah Stock'), type: t('أسهم عالمية', 'Global Equities'), weight: '15%', val: totalBalance * 0.15, profit: '+24.1%', status: 'active' },
    { name: t('أسهم شركة أبل متوافقة', 'Apple Inc Shariah Stock'), type: t('أسهم عالمية', 'Global Equities'), weight: '12%', val: totalBalance * 0.12, profit: '+18.2%', status: 'active' },
    { name: t('محفظة النقد السائل المرنة', 'Tharwah Liquid Cash Fund'), type: t('نقد وسيولة', 'Liquid Cash'), weight: '5%', val: totalBalance * 0.05, profit: '+3.2%', status: 'active' },
  ];

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          { border: 'border-l-gold-primary', emoji: '🏢', name: t('عقارات وأصول مدرة للدخل', 'Real Estate Funds'), pct: '20%', val: totalBalance * 0.20, desc: t('صناديق ريت عقارية مرخصة محلياً وعالمياً', 'Licensed REIT real estate funds'), yield: '+7.2%' },
          { border: 'border-l-sky-500', emoji: '📜', name: t('صكوك تمويلية وسندات', 'Sukuk & Fixed Income'), pct: '25%', val: totalBalance * 0.25, desc: t('صكوك سيادية وحكومية منخفضة المخاطر', 'Low-risk sovereign Sukuk'), yield: '+5.8%' },
          { border: 'border-l-violet-500', emoji: '🌍', name: t('الأسهم العالمية المتوافقة', 'Global Shariah Equities'), pct: '35%', val: totalBalance * 0.35, desc: t('أسهم القيادة والنمو', 'Blue-chip growth stocks'), yield: '+12.4%' },
        ].map((item, i) => (
          <Card key={i} className={`p-5 border-l-4 ${item.border}`}>
            <h4 className="font-black text-sm text-text-primary mb-2 flex items-center justify-between">
              <span>{item.emoji} {item.name}</span>
              <span className="text-xs bg-gold-light text-gold-deep px-2 py-0.5 rounded font-mono">{item.pct}</span>
            </h4>
            <div className="text-xl font-black mb-1">SAR {item.val.toLocaleString()}</div>
            <p className="text-xs text-text-muted mb-4">{item.desc}</p>
            <div className="text-xs font-bold text-text-secondary space-y-1.5 border-t pt-3">
              <div className="flex justify-between"><span>{t('العائد المتوقع', 'Annual Yield')}</span><span className="text-emerald-500 font-mono">{item.yield}</span></div>
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
                  <td className="py-3.5 text-emerald-500 font-mono">{asset.profit}</td>
                  <td className="py-3.5"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-xs font-black">{t('نشط', 'Active')}</span></td>
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
                <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">{asset.profit}</span>
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
    </div>
  );
}
