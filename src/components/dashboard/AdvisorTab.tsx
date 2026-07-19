import React from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Calendar, Check } from 'lucide-react';

interface Meeting {
  id: string; advisor: string; date: string; time: string; status: string;
}

interface AdvisorTabProps {
  meetings: Meeting[];
  newMeetingDate: string;
  newMeetingTime: string;
  onMeetingDateChange: (val: string) => void;
  onMeetingTimeChange: (val: string) => void;
  onBookMeeting: (e: React.FormEvent) => void;
}

export function AdvisorTab({ meetings, newMeetingDate, newMeetingTime, onMeetingDateChange, onMeetingTimeChange, onBookMeeting }: AdvisorTabProps) {
  const { t } = useLang();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black">{t('المستشار المالي المخصص لحسابك', 'Personal Financial Advisor')}</h2>
          <p className="text-xs text-text-muted">{t('تواصل مع خبير إدارة الثروات المسؤول عن محفظتك', 'Consult with the wealth expert managing your account')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-1 text-center space-y-4">
          <div className="w-24 h-24 rounded-full gradient-gold mx-auto flex items-center justify-center text-white text-3xl font-black shadow-gold-md">
            خ
          </div>
          <div>
            <h3 className="font-black text-lg text-text-primary">خالد بن الوليد</h3>
            <p className="text-xs text-text-muted">{t('رئيس قسم إدارة الثروات', 'Head of Wealth Management')}</p>
          </div>
          <div className="text-xs font-bold text-text-secondary space-y-2 border-t pt-4 text-right">
            <div>📧 Email: <span className="font-mono text-text-primary">khaled.w@tharwahcapital.com</span></div>
            <div>📞 {t('الهاتف', 'Direct Line')}: <span className="font-mono text-text-primary">+966 11 942 1052</span></div>
            <div>💼 {t('الخبرة', 'Experience')}: <span className="text-text-primary">12 {t('عاماً', 'years')}</span></div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-black text-base flex items-center gap-1.5">
              <Calendar className="w-5 h-5 text-gold-deep" /> {t('حجز موعد استشارة', 'Book Consultation')}
            </h3>
            <form onSubmit={onBookMeeting} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary block">{t('اختر التاريخ', 'Select Date')}</label>
                <input required type="date" value={newMeetingDate} onChange={e => onMeetingDateChange(e.target.value)} className="w-full bg-secondary border border-border-default rounded-md py-2.5 px-3 focus:border-gold-primary outline-none text-xs font-bold" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary block">{t('اختر التوقيت', 'Select Time')}</label>
                <select value={newMeetingTime} onChange={e => onMeetingTimeChange(e.target.value)} className="w-full bg-secondary border border-border-default rounded-md py-2.5 px-3 focus:border-gold-primary outline-none text-xs font-bold">
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="01:00 PM">01:00 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                </select>
              </div>
              <div className="md:col-span-2 pt-2">
                <Button type="submit" className="w-full py-3 text-xs font-bold gap-1.5">
                  <Check className="w-4 h-4" /> {t('تأكيد حجز الموعد', 'Confirm Booking')}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-black text-base">{t('المواعيد المحجوزة', 'Upcoming Consultations')}</h3>
            <div className="space-y-3">
              {meetings.map((meet) => (
                <div key={meet.id} className="p-4 rounded-xl border bg-[#F8FAFC] dark:bg-primary/50 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-black text-sm text-text-primary">{meet.advisor}</h4>
                    <div className="text-xs text-text-secondary flex items-center gap-4">
                      <span>📅 {meet.date}</span>
                      <span>⏰ {meet.time}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 text-xs font-black uppercase">
                    {meet.status === 'confirmed' ? t('مؤكد', 'Confirmed') : meet.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
