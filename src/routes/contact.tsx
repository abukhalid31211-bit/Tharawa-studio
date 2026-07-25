import { createFileRoute } from '@tanstack/react-router';
import { useLang } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { usePublicSiteSettings } from '@/lib/publicSite';

export const Route = createFileRoute('/contact')({ component: ContactPage });

function ContactPage() {
  const { t, lang } = useLang();
  const { data: publicSettings } = usePublicSiteSettings();
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get('name') as string || '').trim();
    const phone = (fd.get('phone') as string || '').trim();
    const email = (fd.get('email') as string || '').trim();
    const subject = (fd.get('subject') as string || '').trim();
    const message = (fd.get('message') as string || '').trim();
    if (!name || !email || !subject || !message) return;
    setFormState('loading');
    try {
      await api.submitContact({ name, email, phone, subject, message });
      setFormState('success');
    } catch {
      setFormState('idle');
    }
  };

  const address = lang === 'ar' ? publicSettings.contact_address_ar : publicSettings.contact_address_en;
  const businessHours = lang === 'ar' ? publicSettings.business_hours_ar : publicSettings.business_hours_en;

  return (
    <div className="w-full">
      <section className="relative w-full bg-primary dark:bg-elevated pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-primary),var(--color-secondary))] dark:bg-[linear-gradient(to_bottom,#0D0D1A,#13132A)] opacity-80" />
        <div className="max-w-[1280px] mx-auto px-4 relative z-10 text-center">
          <span className="font-black text-[11px] text-gold-deep tracking-[0.2em] uppercase mb-4 block">
            {t('تواصل معنا', 'CONTACT US')}
          </span>
          <h1 className="font-black text-4xl md:text-5xl text-text-primary mb-6">
            {t('نحن هنا لخدمتك', 'We Are Here to Serve You')}
          </h1>
          <p className="text-lg text-text-secondary max-w-[580px] mx-auto">
            {t('لا تتردد في التواصل معنا. فريقنا من الخبراء جاهز للرد على جميع استفساراتك وتقديم الاستشارة المالية التي تحتاجها.', 'Feel free to reach out. Our team of experts is ready to answer all your inquiries and provide the financial consultation you need.')}
          </p>
        </div>
      </section>

      <section className="py-20 bg-primary">
        <div className="max-w-[1280px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          <div className="space-y-8">
            <h2 className="font-bold text-2xl text-text-primary mb-6">{t('معلومات التواصل', 'Contact Information')}</h2>
            
            <Card className="flex items-start gap-4 p-6">
              <div className="w-12 h-12 rounded-full bg-gold-subtle flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-gold-deep" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-text-primary mb-1">{t('المقر الرئيسي', 'Headquarters')}</h3>
                <p className="text-text-secondary">{address || t('سيتم تحديث العنوان من لوحة الإدارة قريباً', 'The address will be updated from the admin panel soon')}</p>
              </div>
            </Card>

            <Card className="flex items-start gap-4 p-6">
              <div className="w-12 h-12 rounded-full bg-gold-subtle flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6 text-gold-deep" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-text-primary mb-1">{t('الهاتف المجاني', 'Toll-Free Phone')}</h3>
                <p className="text-text-secondary font-mono">{publicSettings.support_phone || t('سيتم تحديث الرقم قريباً', 'Phone number will be updated soon')}</p>
              </div>
            </Card>

            <Card className="flex items-start gap-4 p-6">
              <div className="w-12 h-12 rounded-full bg-gold-subtle flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-gold-deep" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-text-primary mb-1">{t('البريد الإلكتروني', 'Email Address')}</h3>
                <p className="text-text-secondary font-mono">{publicSettings.support_email || t('سيتم تحديث البريد قريباً', 'Email will be updated soon')}</p>
              </div>
            </Card>

            <Card className="flex items-start gap-4 p-6">
              <div className="w-12 h-12 rounded-full bg-gold-subtle flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-gold-deep" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-text-primary mb-1">{t('ساعات العمل', 'Business Hours')}</h3>
                <p className="text-text-secondary">{businessHours || t('سيتم تحديث ساعات العمل قريباً', 'Business hours will be updated soon')}</p>
              </div>
            </Card>
          </div>

          <div>
            <Card className="p-8">
              <h2 className="font-bold text-2xl text-text-primary mb-6">{t('أرسل رسالة', 'Send a Message')}</h2>
              {formState === 'success' ? (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-success mb-4" />
                  <h3 className="font-bold text-xl text-text-primary mb-2">{t('تم إرسال رسالتك بنجاح', 'Message Sent Successfully')}</h3>
                  <p className="text-text-secondary">{t('سيتواصل معك فريقنا في أقرب وقت ممكن.', 'Our team will contact you as soon as possible.')}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-text-secondary">{t('الاسم الكامل', 'Full Name')}</label>
                      <input required type="text" name="name" className="w-full bg-secondary border border-border-default rounded-md px-4 py-2.5 focus:border-gold-primary focus:outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-text-secondary">{t('رقم الهاتف', 'Phone Number')}</label>
                      <input required type="tel" name="phone" className="w-full bg-secondary border border-border-default rounded-md px-4 py-2.5 focus:border-gold-primary focus:outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-text-secondary">{t('البريد الإلكتروني', 'Email Address')}</label>
                    <input required type="email" name="email" className="w-full bg-secondary border border-border-default rounded-md px-4 py-2.5 focus:border-gold-primary focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-text-secondary">{t('موضوع الرسالة', 'Subject')}</label>
                    <select name="subject" className="w-full bg-secondary border border-border-default rounded-md px-4 py-2.5 focus:border-gold-primary focus:outline-none">
                      <option>{t('استفسار عام', 'General Inquiry')}</option>
                      <option>{t('فتح حساب استثماري', 'Open Investment Account')}</option>
                      <option>{t('الدعم الفني', 'Technical Support')}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-text-secondary">{t('الرسالة', 'Message')}</label>
                    <textarea required name="message" rows={4} className="w-full bg-secondary border border-border-default rounded-md px-4 py-2.5 focus:border-gold-primary focus:outline-none"></textarea>
                  </div>
                  <Button type="submit" className="w-full gap-2 mt-4" isLoading={formState === 'loading'}>
                    <Send className="w-4 h-4" /> {t('إرسال الرسالة', 'Send Message')}
                  </Button>
                </form>
              )}
            </Card>
          </div>

        </div>
      </section>
    </div>
  );
}
