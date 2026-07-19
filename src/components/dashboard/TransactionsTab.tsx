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

      <Card className="p-0 overflow-hidden border-none lg:border lg:border-border-default shadow-none lg:shadow-sm">
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto p-6">
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

        {/* Mobile View */}
        <div className="lg:hidden space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-white dark:bg-[#1C1C34] border border-border-light dark:border-[#2D2D50] rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${
                    tx.type === 'deposit' ? 'bg-emerald-500/10' : tx.type === 'withdrawal' ? 'bg-rose-500/10' : 'bg-gold-primary/10'
                  }`}>
                    {tx.type === 'deposit' && <ArrowUpRight className="w-4 h-4 text-emerald-500" />}
                    {tx.type === 'withdrawal' && <ArrowDownLeft className="w-4 h-4 text-rose-500" />}
                    {tx.type === 'dividend' && <Star className="w-4 h-4 text-gold-deep" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-text-primary">
                      {tx.type === 'deposit' ? t('إيداع أموال', 'Deposit') : tx.type === 'withdrawal' ? t('سحب أموال', 'Withdrawal') : t('توزيع أرباح', 'Dividend')}
                    </h4>
                    <span className="text-[10px] text-text-muted font-mono">{tx.id}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-black font-mono ${tx.type === 'withdrawal' ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {tx.type === 'withdrawal' ? '-' : '+'}{tx.amount.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-text-muted">SAR</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-dashed border-border-light text-[11px]">
                <span className="text-text-secondary font-medium">{tx.date}</span>
                <span className="text-text-muted">{tx.method}</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-black">{t('مكتملة', 'Done')}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
