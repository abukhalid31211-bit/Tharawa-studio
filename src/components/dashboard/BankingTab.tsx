import React, { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Shield, Check } from 'lucide-react';
import { api } from '@/lib/api';

interface BankingAccount {
  name?: string;
  bank?: string;
  accountNumber?: string;
  iban?: string;
  status?: string;
  isPrimary?: boolean;
}

interface BankingTabProps {
  bankRequestSent: boolean;
  onRequestBankUpdate: () => void;
  onShowToast: (msg: string) => void;
  /** Real authenticated client profile from the backend */
  profile?: any;
  bankAccounts?: BankingAccount[];
}

function maskIban(value?: string) {
  if (!value) return '—';
  if (value.length <= 8) return value;
  return `${value.slice(0, 4)} ${'•'.repeat(Math.max(value.length - 8, 4))} ${value.slice(-4)}`;
}

function maskAccount(value?: string) {
  if (!value) return '—';
  if (value.length <= 4) return value;
  return `${'•'.repeat(Math.max(value.length - 4, 4))}${value.slice(-4)}`;
}

export function BankingTab({ bankRequestSent, onRequestBankUpdate, onShowToast, profile, bankAccounts = [] }: BankingTabProps) {
  const { t } = useLang();
  const [submitting, setSubmitting] = useState(false);

  const handleRequestBankUpdate = async () => {
    setSubmitting(true);
    try {
      await api.submitContact({
        name: profile?.name || t('العميل', 'Client'),
        email: profile?.email || '',
        subject: t('طلب تحديث الحساب البنكي', 'Bank account update request'),
        message: t('يرجى تحديث بياناتي البنكية المرتبطة بالحساب.', 'Please update the bank details linked to my account.'),
      });
      onRequestBankUpdate();
    } catch (err: any) {
      onShowToast(err?.message || t('تعذر إرسال الطلب، حاول مرة أخرى', 'Failed to submit request, please try again'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black">{t('الحسابات البنكية ومطابقة التحويلات', 'Linked Bank Accounts')}</h2>
          <p className="text-xs text-text-muted">{t('إدارة حساباتك البنكية المعتمدة لعمليات السحب والإيداع السريعة', 'Manage your verified bank accounts')}</p>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-black text-sm text-text-primary">{t('أمان الحساب وحمايتك هي أولويتنا القصوى', 'Account Security and Client Protection')}</h4>
          <p className="text-xs text-text-secondary leading-relaxed">
            {t('لا يسمح بإجراء سحوبات إلا للحسابات المسجلة باسمك والمعتمدة مسبقاً', 'Withdrawals are only permitted to accounts matching your legal name.')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bankAccounts.length === 0 ? (
          <Card className="p-8 text-center text-text-muted md:col-span-2">
            {t('لا توجد حسابات بنكية موثقة حالياً. اطلب من فريق ثروة كابيتال إضافة حساباتك من خلال الزر أدناه.', 'There are no verified bank accounts yet. Ask the Tharwah team to add your accounts using the button below.')}
          </Card>
        ) : bankAccounts.map((acct, i) => (
          <Card key={i} className={`p-6 space-y-4 border-l-4 ${acct.isPrimary ? 'border-l-emerald-500' : 'border-l-sky-500'} relative overflow-hidden`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-0.5 rounded font-black ${acct.isPrimary ? 'bg-emerald-500/10 text-emerald-600' : 'bg-sky-500/10 text-sky-600'}`}>
                {acct.name || (acct.isPrimary ? t('الحساب البنكي الرئيسي', 'Primary Account') : t('الحساب البنكي الثانوي', 'Secondary Account'))}
              </span>
              <span className="text-xs font-mono font-bold text-text-muted">{acct.bank || '—'}</span>
            </div>
            <div className="space-y-2">
              <div className="text-[11px] text-text-muted uppercase tracking-wider">{t('رقم الحساب', 'Account Number')}</div>
              <div className="text-lg font-black font-mono">{maskAccount(acct.accountNumber)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] text-text-muted uppercase tracking-wider">IBAN</div>
              <div className="text-sm font-bold font-mono">{maskIban(acct.iban)}</div>
            </div>
            <div className="flex justify-between items-center text-xs font-bold pt-2 border-t text-text-muted">
              <span>
                {t('حالة الحساب', 'Status')}: <span className="text-emerald-500">✓ {acct.status || t('موثق ونشط', 'Verified & Active')}</span></span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="font-black text-base">{t('طلب إضافة أو تعديل الحسابات البنكية', 'Add or Modify Bank Account')}</h3>
        <p className="text-xs text-text-secondary">
          {t('لتعديل بيانات الحساب أو تسجيل بنك جديد، يرجى تقديم طلب رسمي.', 'To update banking data please submit your request.')}
        </p>
        {bankRequestSent ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-xs text-emerald-600 font-bold flex items-center gap-2">
            <Check className="w-4 h-4" /> {t('تم إرسال الطلب بنجاح وهو قيد المراجعة حالياً.', 'Your request was submitted and is being processed.')}
          </div>
        ) : (
          <Button onClick={handleRequestBankUpdate} isLoading={submitting} className="text-xs font-black py-2.5 px-4">
            {t('تقديم طلب تحديث البيانات البنكية', 'Request Bank Update')}
          </Button>
        )}
      </Card>
    </div>
  );
}
