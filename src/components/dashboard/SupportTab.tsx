import React from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MessageSquare, Send } from 'lucide-react';

interface Ticket {
  id: string; title: string; titleEn: string; status: string; date: string; reply: string | null;
}

interface SupportTabProps {
  tickets: Ticket[];
  newTicketTitle: string;
  newTicketMessage: string;
  onTicketTitleChange: (val: string) => void;
  onTicketMessageChange: (val: string) => void;
  onCreateTicket: (e: React.FormEvent) => void;
}

export function SupportTab({ tickets, newTicketTitle, newTicketMessage, onTicketTitleChange, onTicketMessageChange, onCreateTicket }: SupportTabProps) {
  const { t, lang } = useLang();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black">{t('الدعم المباشر والطلبات الاستشارية', 'Support & Communication')}</h2>
          <p className="text-xs text-text-muted">{t('افتح تذكرة جديدة لمستشارك المالي', 'Open a new ticket for your financial advisor')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-1 space-y-4 h-fit">
          <h3 className="font-black text-base flex items-center gap-1.5">
            <MessageSquare className="w-5 h-5 text-gold-deep" /> {t('أرسل تذكرة دعم', 'Submit Support Ticket')}
          </h3>
          <form onSubmit={onCreateTicket} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary block">{t('موضوع الطلب', 'Subject')}</label>
              <input required type="text" value={newTicketTitle} onChange={e => onTicketTitleChange(e.target.value)} placeholder={t('مثال: استفسار بخصوص الأرباح', 'e.g. Dividend inquiry')} className="w-full bg-secondary border border-border-default rounded-md py-2 px-3 focus:border-gold-primary outline-none text-xs font-bold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary block">{t('رسالتك', 'Message')}</label>
              <textarea required rows={4} value={newTicketMessage} onChange={e => onTicketMessageChange(e.target.value)} placeholder={t('اكتب استفسارك هنا...', 'Describe your inquiry...')} className="w-full bg-secondary border border-border-default rounded-md py-2 px-3 focus:border-gold-primary outline-none text-xs font-bold resize-none" />
            </div>
            <Button type="submit" className="w-full py-2.5 text-xs gap-1.5">
              <Send className="w-4 h-4" /> {t('إرسال التذكرة', 'Send Message')}
            </Button>
          </form>
        </Card>

        <Card className="p-6 lg:col-span-2 space-y-4">
          <h3 className="font-black text-base">{t('طلبات الدعم السابقة', 'Support Tickets History')}</h3>
          {tickets.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-xs font-bold">
              {t('لا توجد طلبات دعم سابقة', 'No previous support tickets')}
            </div>
          ) : (
            <div className="space-y-3.5">
              {tickets.map((tk) => (
                <div key={tk.id} className="p-4 rounded-xl border bg-secondary/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-text-primary font-black">{lang === 'ar' ? tk.title : tk.titleEn}</span>
                    <span className="font-mono text-[10px] text-text-muted">{tk.date} • {tk.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-text-muted">{t('النوع: تذكرة دعم مالي', 'Type: Financial Ticket')}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${tk.status === 'answered' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                      {tk.status === 'answered' ? t('تم الرد', 'Answered') : t('قيد المراجعة', 'Pending')}
                    </span>
                  </div>
                  {tk.reply && (
                    <div className="mt-3 p-3 rounded-lg bg-gold-light/40 border border-border-gold text-xs leading-relaxed text-text-secondary">
                      <span className="font-black block text-gold-deep mb-1">💬 {t('رد المستشار:', 'Advisor Reply:')}</span>
                      {tk.reply}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
