import React from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Plus, ArrowUpRight, ArrowDownLeft, Star, FileSpreadsheet } from 'lucide-react';

interface Transaction {
  id: string; type: 'deposit' | 'withdrawal' | 'dividend'; amount: number;
  date: string; status: string; method: string;
}

interface TransactionsTabProps {
  transactions: Transaction[];
  onNewTransfer: () => void;
  onExportExcel: () => void;
}

export function TransactionsTab({ transactions, onNewTransfer, onExportExcel }: TransactionsTabProps) {
  const { t } = useLang();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black">{t('سجل المعاملات والعمليات المالية', 'Financial Transactions History')}</h2>
          <p className="text-xs text-text-muted">{t('متابعة كل العمليات المالية', 'Monitor all cash flows')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onNewTransfer} className="gap-1 px-3 py-2 text-xs">
            <Plus className="w-4 h-4" /> {t('طلب معاملة جديدة', 'New Transfer')}
          </Button>
          <Button onClick={onExportExcel} variant="ghost" className="gap-1 px-3 py-2 text-xs border border-border-default hover:bg-secondary">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> {t('تصدير إكسل', 'Export Excel')}
          </Button>
        </div>
      </div>

      <Card className="p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-bold text-text-secondary text-right">
            <thead>
              <tr className="border-b text-xs text-text-muted uppercase">
                <th className="pb-3">{t('معرف العملية', 'ID')}</th>
                <th className="pb-3">{t('النوع', 'Type')}</th>
                <th className="pb-3">{t('المبلغ', 'Amount')}</th>
                <th className="pb-3">{t('التاريخ', 'Date')}</th>
                <th className="pb-3">{t('الطريقة', 'Method')}</th>
                <th className="pb-3">{t('الحالة', 'Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-secondary/40 transition-colors">
                  <td className="py-3.5 text-text-primary font-mono">{tx.id}</td>
                  <td className="py-3.5">
                    <span className="flex items-center gap-1.5">
                      {tx.type === 'deposit' && <ArrowUpRight className="w-4 h-4 text-emerald-500" />}
                      {tx.type === 'withdrawal' && <ArrowDownLeft className="w-4 h-4 text-rose-500" />}
                      {tx.type === 'dividend' && <Star className="w-4 h-4 text-gold-deep" />}
                      {tx.type === 'deposit' ? t('إيداع', 'Deposit') : tx.type === 'withdrawal' ? t('سحب', 'Withdrawal') : t('أرباح', 'Dividend')}
                    </span>
                  </td>
                  <td className={`py-3.5 font-mono ${tx.type === 'withdrawal' ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {tx.type === 'withdrawal' ? '-' : '+'}{tx.amount.toLocaleString()} SAR
                  </td>
                  <td className="py-3.5 font-mono">{tx.date}</td>
                  <td className="py-3.5 text-xs font-medium">{tx.method}</td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-xs font-black">{t('مكتملة', 'Completed')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
