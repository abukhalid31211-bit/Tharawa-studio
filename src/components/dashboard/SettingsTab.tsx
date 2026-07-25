import React, { useEffect, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Lock, User, Phone, AlertTriangle, Save } from 'lucide-react';
import { api } from '@/lib/api';

interface SettingsTabProps {
  clientPhone: string;
  onClientPhoneChange: (val: string) => void;
  onShowToast: (msg: string) => void;
  /** Real authenticated client profile from the backend */
  profile?: any;
}

export function SettingsTab({ clientPhone, onClientPhoneChange, onShowToast, profile }: SettingsTabProps) {
  const { t } = useLang();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    if (profile?.phone) onClientPhoneChange(profile.phone);
  }, [onClientPhoneChange, profile?.phone]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError(t('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل', 'New password must be at least 8 characters'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('كلمتا المرور غير متطابقتين', 'Passwords do not match'));
      return;
    }

    setPasswordLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onShowToast(t('تم تحديث كلمة المرور بنجاح', 'Password updated successfully'));
    } catch (err: any) {
      setPasswordError(err?.message || t('تعذر تحديث كلمة المرور', 'Failed to update password'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveContact = async () => {
    setContactLoading(true);
    try {
      await api.updateProfile({
        phone: clientPhone,
        profile_data: {
          ...(profile?.profile_data || {}),
          contactPhone: clientPhone,
        },
      });
      onShowToast(t('تم تحديث معلومات التواصل', 'Contact info updated'));
    } catch (err: any) {
      onShowToast(err?.message || t('تعذر تحديث معلومات التواصل', 'Failed to update contact info'));
    } finally {
      setContactLoading(false);
    }
  };

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
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#FEF0EC] border border-[#FF4560]/20 text-[#FF4560] text-xs font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary block">{t('كلمة المرور الحالية', 'Current Password')}</label>
              <input required type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} disabled={passwordLoading} className="w-full bg-secondary border border-border-default rounded-md py-2.5 px-3 focus:border-gold-primary outline-none text-xs font-bold disabled:opacity-60" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary block">{t('كلمة المرور الجديدة', 'New Password')}</label>
              <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={passwordLoading} minLength={8} className="w-full bg-secondary border border-border-default rounded-md py-2.5 px-3 focus:border-gold-primary outline-none text-xs font-bold disabled:opacity-60" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary block">{t('تأكيد كلمة المرور الجديدة', 'Confirm New Password')}</label>
              <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={passwordLoading} minLength={8} className="w-full bg-secondary border border-border-default rounded-md py-2.5 px-3 focus:border-gold-primary outline-none text-xs font-bold disabled:opacity-60" />
            </div>
            <Button type="submit" isLoading={passwordLoading} className="w-full py-2.5 text-xs font-bold">{t('حفظ وتحديث كلمة المرور', 'Update Password')}</Button>
          </form>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-black text-base flex items-center gap-1.5">
            <User className="w-5 h-5 text-gold-deep" /> {t('معلومات التواصل', 'Contact Information')}
          </h3>
          <div className="space-y-4 text-xs font-bold text-text-secondary">
            <div className="space-y-1">
              <label className="text-text-muted">{t('الاسم القانوني', 'Legal Name')}</label>
              <div className="p-2.5 bg-secondary rounded border text-text-primary font-black">{profile?.name || '—'}</div>
            </div>
            <div className="space-y-1">
              <label className="text-text-muted">{t('البريد الإلكتروني', 'Registered Email')}</label>
              <div className="p-2.5 bg-secondary rounded border text-text-primary font-black font-mono">{profile?.email || '—'}</div>
            </div>
            <div className="space-y-1.5">
              <label className="text-text-muted">{t('رقم الجوال', 'Phone Number')}</label>
              <div className="relative">
                <Phone className="absolute rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input type="text" value={clientPhone} onChange={e => onClientPhoneChange(e.target.value)} className="w-full bg-secondary border border-border-default rounded-md py-2.5 rtl:pr-10 rtl:pl-4 ltr:pl-10 ltr:pr-4 focus:border-gold-primary outline-none text-xs font-bold font-mono" />
              </div>
            </div>
            <Button onClick={() => void handleSaveContact()} isLoading={contactLoading} className="w-full py-2.5 text-xs font-bold gap-1.5">
              <Save className="w-4 h-4" /> {t('حفظ تعديلات التواصل', 'Save Contact Info')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
