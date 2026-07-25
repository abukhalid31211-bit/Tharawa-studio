import React from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Download } from 'lucide-react';

interface ReportsTabProps {
  onExportPDF: () => void;
  /** Real client transactions from the backend */
  transactions?: any[];
  /** Real authenticated client profile from the backend */
  profile?: any;
}

export function ReportsTab({ onExportPDF, transactions, profile }: ReportsTabProps) {
  const { t } = useLang();
  const transactionsCount = transactions?.length ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black">{t('التقارير وكشوفات الحساب المعتمدة', 'Investment Reports & Statements')}</h2>
          <p className="text-xs text-text-muted">{t('توليد وتصدير التقارير المالية الدورية', 'Generate and download certified financial reports')}</p>
        </div>
        <div className="hidden md:flex flex-col items-end gap-0.5 text-[11px] font-bold text-text-muted">
          {profile?.name && <span className="text-text-secondary">{profile.name}</span>}
          <span className="font-mono">{t('عدد المعاملات', 'Total Transactions')}: {transactionsCount}</span>
        </div>
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b pb-6">
          <div className="space-y-1">
            <h3 className="font-black text-base">{t('تقرير الأداء الشامل والربع سنوي', 'Comprehensive Quarterly Valuation Report')}</h3>
            <p className="text-xs text-text-secondary">{t('كشف رسمي معتمد يوضح القيمة الدقيقة للأصول', 'Certified statement of all holdings and valuations')}</p>
          </div>
          <Button onClick={onExportPDF} className="gap-1.5 whitespace-nowrap text-xs font-black py-2.5 px-4">
            <Download className="w-4 h-4" /> {t('توليد وتحميل التقرير PDF', 'Generate Certified Report')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {transactionsCount > 0 ? (
            <div className="p-4 bg-secondary rounded-xl border flex items-center justify-between col-span-2">
              <div>
                <h4 className="font-black text-sm text-text-primary">{t('كشف الحساب الموحد', 'Consolidated Account Statement')}</h4>
                <span className="text-[10px] text-text-muted">{t('جاهز للتحميل ويشمل كافة الحركات المالية حتى تاريخ اليوم', 'Ready to download, includes all financial activity up to today')}</span>
              </div>
              <button onClick={onExportPDF} className="p-2 rounded-lg bg-gold-light text-gold-deep hover:bg-gold-primary hover:text-white transition-all">
                <Download className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-4 bg-secondary/50 rounded-xl border border-dashed flex flex-col items-center justify-center col-span-2 py-8 text-center">
              <p className="text-xs text-text-muted font-bold">{t('لا توجد تقارير متاحة حالياً لعدم وجود حركات مالية في حسابك', 'No reports available currently as there are no financial transactions in your account')}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
