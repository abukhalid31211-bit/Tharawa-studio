// ─────────────────────────────────────────────────────────────
// 4.7 — Messages إدارة رسائل وتذاكر دعم العملاء
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import { Send, Reply, CheckCircle, Archive, User } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useMessages, useClients, SupportMessage, relativeTime } from '@/lib/adminData';
import {
  PageHeader, Panel, Pill, StatCard, SearchInput, FilterTabs,
  TextArea, PrimaryBtn, GhostBtn, EmptyState, useToast, ClientAvatar,
} from '@/components/admin/ui';

const PRIORITY: Record<string, { ar: string; en: string; color: string }> = {
  high: { ar: 'عالية', en: 'High', color: '#FF4560' },
  medium: { ar: 'متوسطة', en: 'Medium', color: '#F59E0B' },
  low: { ar: 'منخفضة', en: 'Low', color: '#3B82F6' },
};

export function Messages() {
  const { t, lang } = useLang();
  const [messages, setMessages] = useMessages();
  const [clients] = useClients();
  const { show, ToastView } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const clientOf = (id: string) => clients.find(c => c.id === id);

  const counts = useMemo(() => ({
    all: messages.length,
    pending: messages.filter(m => m.status === 'pending').length,
    answered: messages.filter(m => m.status === 'answered').length,
    closed: messages.filter(m => m.status === 'closed').length,
  }), [messages]);

  const filtered = useMemo(() => messages.filter(m => {
    const c = clientOf(m.clientId);
    const q = search.trim();
    const okQ = !q || m.subject.includes(q) || m.text.includes(q) || m.id.toLowerCase().includes(q.toLowerCase()) || (c && (c.name.includes(q) || c.nameEn.toLowerCase().includes(q.toLowerCase())));
    const okS = statusFilter === 'all' || m.status === statusFilter;
    return okQ && okS;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [messages, clients, search, statusFilter]);

  const sendReply = (id: string) => {
    if (!replyText.trim()) return;
    setMessages(prev => prev.map(m => m.id === id
      ? { ...m, status: 'answered', replies: [...m.replies, { from: 'admin' as const, text: replyText.trim(), date: new Date().toISOString().slice(0, 16).replace('T', ' ') }] }
      : m
    ));
    setReplyText('');
    setOpenId(null);
    show(t('تم إرسال الرد للعميل', 'Reply sent to client'));
  };

  const closeTicket = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'closed' } : m));
    show(t('تم إغلاق التذكرة', 'Ticket closed'));
  };

  const reopenTicket = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'answered' } : m));
    show(t('تمت إعادة فتح التذكرة', 'Ticket reopened'));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('إدارة الرسائل وتذاكر الدعم', 'Messages & Support Tickets')}
        subtitle={t('الرد المباشر على استفسارات وطلبات المستثمرين لتجربة تواصل مثالية', 'Respond directly to investor inquiries for a seamless communication experience')}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t('كل التذاكر', 'All Tickets')} value={counts.all} icon="📬" color="#3B82F6" />
        <StatCard label={t('بانتظار الرد', 'Awaiting Reply')} value={counts.pending} icon="⏳" color="#F59E0B" />
        <StatCard label={t('تم الرد عليها', 'Answered')} value={counts.answered} icon="✅" color="#00D97E" />
        <StatCard label={t('مغلقة', 'Closed')} value={counts.closed} icon="📁" color="#64748B" />
      </div>

      <Panel className="flex flex-col md:flex-row md:items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder={t('بحث بموضوع التذكرة أو اسم العميل...', 'Search by subject or client...')} className="md:max-w-sm" />
        <div className="md:ms-auto">
          <FilterTabs
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: t('الكل', 'All'), count: counts.all },
              { value: 'pending', label: t('معلقة', 'Pending'), count: counts.pending },
              { value: 'answered', label: t('تم الرد', 'Answered'), count: counts.answered },
              { value: 'closed', label: t('مغلقة', 'Closed'), count: counts.closed },
            ]}
          />
        </div>
      </Panel>

      {filtered.length === 0 ? (
        <Panel><EmptyState icon="📭" text={t('لا توجد تذاكر مطابقة', 'No tickets match')} /></Panel>
      ) : (
        <div className="space-y-4">
          {filtered.map(m => {
            const c = clientOf(m.clientId);
            const isOpen = openId === m.id;
            return (
              <Panel key={m.id}>
                {/* رأس التذكرة */}
                <div className="flex items-center justify-between gap-3 flex-wrap pb-3 border-b border-[#E2E8F0] dark:border-border-default">
                  <div className="flex items-center gap-2.5">
                    {c && <ClientAvatar name={lang === 'ar' ? c.name : c.nameEn} idSeed={c.id} size={30} />}
                    <div>
                      <div className="font-bold text-sm text-text-primary">{lang === 'ar' ? c?.name : c?.nameEn} <span className="text-[10px] font-mono text-text-muted font-normal">({m.id})</span></div>
                      <div className="text-[10px] text-text-muted">{relativeTime(m.date, lang)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Pill text={lang === 'ar' ? PRIORITY[m.priority].ar : PRIORITY[m.priority].en} color={PRIORITY[m.priority].color} />
                    <Pill
                      text={m.status === 'answered' ? t('تم الرد', 'Answered') : m.status === 'pending' ? t('بانتظار الرد', 'Pending') : t('مغلقة', 'Closed')}
                      color={m.status === 'answered' ? '#00D97E' : m.status === 'pending' ? '#F59E0B' : '#64748B'} dot
                    />
                  </div>
                </div>

                {/* المحادثة */}
                <div className="space-y-3 mt-4">
                  <div className="flex gap-2.5">
                    {c && <ClientAvatar name={lang === 'ar' ? c.name : c.nameEn} idSeed={c.id} size={26} />}
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-text-primary mb-1">{m.subject}</h4>
                      <div className="rounded-xl rounded-ss-sm p-3" style={{ background: 'rgba(14,165,233,0.06)' }}>
                        <p className="text-xs text-text-secondary leading-relaxed">{m.text}</p>
                      </div>
                    </div>
                  </div>
                  {m.replies.map((r, i) => (
                    <div key={i} className="flex gap-2.5 justify-end">
                      <div className="rounded-xl rounded-se-sm p-3" style={{ background: 'rgba(201,168,76,0.07)', maxWidth: '88%' }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <User className="w-3 h-3" style={{ color: '#C9A84C' }} />
                          <span className="text-[10px] font-bold" style={{ color: '#C9A84C' }}>{t('فريق الدعم', 'Support Team')}</span>
                          <span className="text-[9px] text-text-muted">· {relativeTime(r.date, lang)}</span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">{r.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* الإجراءات */}
                <div className="flex items-center gap-2 pt-3 mt-3 border-t border-[#E2E8F0] dark:border-border-default">
                  {m.status !== 'closed' && !isOpen && (
                    <PrimaryBtn icon={Reply} onClick={() => { setOpenId(m.id); setReplyText(''); }}>{t('كتابة رد', 'Reply')}</PrimaryBtn>
                  )}
                  {m.status !== 'closed' ? (
                    <GhostBtn icon={Archive} onClick={() => closeTicket(m.id)}>{t('إغلاق التذكرة', 'Close Ticket')}</GhostBtn>
                  ) : (
                    <GhostBtn icon={CheckCircle} onClick={() => reopenTicket(m.id)}>{t('إعادة فتح', 'Reopen')}</GhostBtn>
                  )}
                </div>

                {/* نموذج الرد */}
                {isOpen && m.status !== 'closed' && (
                  <div className="pt-3 mt-3 border-t border-[#E2E8F0] dark:border-border-default space-y-2.5">
                    <TextArea
                      rows={3}
                      autoFocus
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder={t('اكتب ردك الرسمي هنا — سيصل للعميل في لوحة تحكمه...', 'Write your official reply — it will appear in the client dashboard...')}
                    />
                    <div className="flex gap-2 justify-end">
                      <GhostBtn onClick={() => { setOpenId(null); setReplyText(''); }}>{t('إلغاء', 'Cancel')}</GhostBtn>
                      <PrimaryBtn icon={Send} color="#00B894" colorHover="#00A07F" disabled={!replyText.trim()} onClick={() => sendReply(m.id)}>
                        {t('إرسال الرد', 'Send Reply')}
                      </PrimaryBtn>
                    </div>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      )}
      {ToastView}
    </div>
  );
}
