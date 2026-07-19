import React from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Lock, User, Phone } from 'lucide-react';

interface SettingsTabProps {
  clientPhone: string;
  onClientPhoneChange: (val: string) => void;
  onShowToast: (msg: string) => void;
}

export function SettingsTab({ clientPhone, onClientPhoneChange, onShowToast }: SettingsTabProps) {
  const { t } = useLang();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black">{t('إعدادات وتفضيلات حساب المستثمر', 'Account Preferences & Security')}</h2>
          <p className="text-xs text-text-muted">{t('تغيير تفضيلات العرض واللغة وتحديث معلومات التواصل', 'Change language, display preferences and security')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="font-black text-base flex items-center gap-1.5">
            <Lock className="w-5 h-5 text-gold-deep" /> {t('أمان الحساب وكلمة المرور', 'Account Security')}
          </h3>
          <form onSubmit={(e) => { e.preventDefault(); onShowToast(t('تم تحديث كلمة المرور بنجاح', 'Password updated successfully')); }} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary block">{t('كلمة المرور الحالية', 'Current Password')}</label>
              <input required type="password" placeholder="••••••••" className="w-full bg-secondary border border-border-default rounded-md py-2.5 px-3 focus:border-gold-primary outline-none text-xs font-bold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary block">{t('كلمة المرور الجديدة', 'New Password')}</label>
              <input required type="password" placeholder="••••••••" className="w-full bg-secondary border border-border-default rounded-md py-2.5 px-3 focus:border-gold-primary outline-none text-xs font-bold" />
            </div>
            <Button type="submit" className="w-full py-2.5 text-xs font-bold">{t('حفظ وتحديث كلمة المرور', 'Update Password')}</Button>
          </form>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-black text-base flex items-center gap-1.5">
            <User className="w-5 h-5 text-gold-deep" /> {t('معلومات التواصل', 'Contact Information')}
          </h3>
          <div className="space-y-4 text-xs font-bold text-text-secondary">
            <div className="space-y-1">
              <label className="text-text-muted">{t('الاسم القانوني', 'Legal Name')}</label>
              <div className="p-2.5 bg-secondary rounded border text-text-primary font-black">أحمد الغامدي</div>
            </div>
            <div className="space-y-1">
              <label className="text-text-muted">{t('البريد الإلكتروني', 'Registered Email')}</label>
              <div className="p-2.5 bg-secondary rounded border text-text-primary font-black font-mono">ahmed@example.com</div>
            </div>
            <div className="space-y-1.5">
              <label className="text-text-muted">{t('رقم الجوال', 'Phone Number')}</label>
              <div className="relative">
                <Phone className="absolute rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input type="text" value={clientPhone} onChange={e => onClientPhoneChange(e.target.value)} className="w-full bg-secondary border border-border-default rounded-md py-2.5 rtl:pr-10 rtl:pl-4 ltr:pl-10 ltr:pr-4 focus:border-gold-primary outline-none text-xs font-bold font-mono" />
              </div>
            </div>
            <Button onClick={() => onShowToast(t('تم تحديث معلومات التواصل', 'Contact info updated'))} className="w-full py-2.5 text-xs font-bold">
              {t('حفظ تعديلات التواصل', 'Save Contact Info')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
