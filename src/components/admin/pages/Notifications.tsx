// ─────────────────────────────────────────────────────────────
// Notifications — إشعارات النظام وبث الإشعارات للعملاء
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Send, CheckCheck, Trash2, Megaphone } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { relativeTime } from '@/lib/adminData';
import { api } from '@/lib/api';
import {
  PageHeader, Panel, PanelHeader, Pill, StatCard, FilterTabs,
  Field, TextInput, TextArea, SelectBox, PrimaryBtn, GhostBtn,
  EmptyState, useToast,
} from '@/components/admin/ui';

const ALERT_META: Record<string, { icon: string; color: string; ar: string; en: string }> = {
  critical: { icon: '🔴', color: '#FF4560', ar: 'حرج', en: 'Critical' },
  warning: { icon: '🟡', color: '#F59E0B', ar: 'تحذيري', en: 'Warning' },
  info: { icon: '🔵', color: '#0EA5E9', ar: 'معلوماتي', en: 'Info' },
  success: { icon: '🟢', color: '#00D97E', ar: 'نجاح', en: 'Success' },
};

export function Notifications() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const { show, ToastView } = useToast();

  useEffect(() => {
    void api.getNotifications().then((response: any) => {
      const mapped = (response?.data || []).map((item: any) => ({
        id: item.id,
        type: item.type || 'info',
        title: item.title || '',
        titleEn: item.title_en || item.title || '',
        desc: item.message || '',
        descEn: item.message_en || item.message || '',
        date: item.created_at || '',
        read: Boolean(item.is_read),
        page: item.action_url || '/Akadmin/overview',
      }));
      setNotifications(mapped);
    }).catch(error => console.error('[Notifications] load failed', error));
  }, [setNotifications]);

  const [filter, setFilter] = useState('all');
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [bc, setBc] = useState({ title: '', titleEn: '', desc: '', type: 'info', page: '/Akadmin/overview' });

  const unread = notifications.filter(n => !n.read).length;

  const filtered = useMemo(() => notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  }), [notifications, filter]);

  const markRead = (id: string, page?: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (/^[0-9a-f-]{36}$/i.test(id)) {
      void api.markNotificationRead(id).catch(error => console.error('[Notifications] mark read failed', error));
    }
    if (page) navigate({ to: page as any });
  };

  const markAll = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    show(t('تم تعليم كل الإشعارات كمقروءة', 'All notifications marked as read'));
  };

  const clearRead = () => {
    setNotifications(prev => prev.filter(n => !n.read));
    show(t('تم حذف الإشعارات المقروءة', 'Read notifications cleared'));
  };

  const sendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    const meta = ALERT_META[bc.type];
    try {
      const response: any = await api.createNotification({
        user_id: null,
        title: bc.title,
        title_en: bc.titleEn || bc.title,
        message: bc.desc,
        message_en: bc.desc,
        type: bc.type,
        action_url: bc.page,
      });
      const created = response?.data;
      if (created?.id) {
        setNotifications(prev => [{
          id: created.id,
          type: (created.type || bc.type) as any,
          title: created.title || bc.title,
          titleEn: created.title_en || bc.titleEn || bc.title,
          desc: created.message || bc.desc,
          descEn: created.message_en || bc.desc,
          date: created.created_at || new Date().toISOString(),
          read: false,
          page: created.action_url || bc.page,
        }, ...prev]);
      }
      setBroadcastOpen(false);
      setBc({ title: '', titleEn: '', desc: '', type: 'info', page: '/Akadmin/overview' });
      show(t('تم بث الإشعار لجميع العملاء', 'Notification broadcast to all clients'));
    } catch (error) {
      console.error('[Notifications] broadcast failed', error);
      show(t('تعذر بث الإشعار', 'Failed to broadcast notification'), 'error');
    }
    void meta;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('إشعارات النظام وجداول البث', 'System Notifications & Broadcasts')}
        subtitle={t('متابعة تنبيهات المنصة وبث إشعارات مخصصة لجميع مستثمري ثروة كابيتال', 'Track platform alerts and broadcast custom notifications to all investors')}
        actions={
          <>
            {unread > 0 && <GhostBtn icon={CheckCheck} onClick={markAll}>{t('تعليم الكل مقروء', 'Mark All Read')}</GhostBtn>}
            <GhostBtn icon={Trash2} onClick={clearRead}>{t('حذف المقروء', 'Clear Read')}</GhostBtn>
            <PrimaryBtn icon={Megaphone} onClick={() => setBroadcastOpen(o => !o)}>{t('بث إشعار جديد', 'New Broadcast')}</PrimaryBtn>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t('كل الإشعارات', 'All Notifications')} value={notifications.length} icon="🔔" color="#3B82F6" />
        <StatCard label={t('غير مقروءة', 'Unread')} value={unread} icon="🔴" color="#FF4560" />
        <StatCard label={t('تنبيهات حرجة', 'Critical Alerts')} value={notifications.filter(n => n.type === 'critical').length} icon="🚨" color="#FF4560" />
        <StatCard label={t('تحذيرات', 'Warnings')} value={notifications.filter(n => n.type === 'warning').length} icon="🟡" color="#F59E0B" />
      </div>

      {/* نموذج البث */}
      {broadcastOpen && (
        <Panel>
          <PanelHeader icon={Megaphone} iconColor="#C9A84C" title={t('بث إشعار لجميع العملاء', 'Broadcast to All Clients')} subtitle={t('سيظهر الإشعار في لوحة تحكم كل مستثمر فوراً', 'The notification appears instantly in every investor dashboard')} />
          <form onSubmit={sendBroadcast} className="grid grid-cols-2 gap-4 mt-4">
            <Field label={t('العنوان (عربي)', 'Title (Arabic)')}>
              <TextInput required value={bc.title} onChange={e => setBc({ ...bc, title: e.target.value })} />
            </Field>
            <Field label={t('العنوان (إنجليزي)', 'Title (English)')}>
              <TextInput value={bc.titleEn} onChange={e => setBc({ ...bc, titleEn: e.target.value })} dir="ltr" />
            </Field>
            <div className="col-span-2">
              <Field label={t('نص الإشعار', 'Notification Body')}>
                <TextArea required rows={3} value={bc.desc} onChange={e => setBc({ ...bc, desc: e.target.value })} placeholder={t('اكتب الإشعار الذي سيُبث لجميع مستثمري المنصة...', 'Write the notification to broadcast to all investors...')} />
              </Field>
            </div>
            <Field label={t('نوع الإشعار', 'Type')}>
              <SelectBox value={bc.type} onChange={e => setBc({ ...bc, type: e.target.value })}
                options={Object.entries(ALERT_META).map(([k, v]) => ({ value: k, label: `${v.icon} ${lang === 'ar' ? v.ar : v.en}` }))} />
            </Field>
            <div className="flex items-end justify-end gap-2">
              <GhostBtn onClick={() => setBroadcastOpen(false)}>{t('إلغاء', 'Cancel')}</GhostBtn>
              <PrimaryBtn icon={Send} type="submit" onClick={() => {}}>{t('إرسال وبث الآن', 'Send & Broadcast')}</PrimaryBtn>
            </div>
          </form>
        </Panel>
      )}

      {/* التصفية */}
      <FilterTabs
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: t('الكل', 'All'), count: notifications.length },
          { value: 'unread', label: t('غير مقروءة', 'Unread'), count: unread },
          ...Object.entries(ALERT_META).map(([k, v]) => ({ value: k, label: `${v.icon} ${lang === 'ar' ? v.ar : v.en}`, count: notifications.filter(n => n.type === k).length })),
        ]}
      />

      {/* القائمة */}
      <Panel padded={false}>
        {filtered.length === 0 ? (
          <EmptyState icon="✅" text={t('لا توجد إشعارات هنا', 'No notifications here')} sub={t('كل التنبيهات تحت السيطرة', 'All alerts are under control')} />
        ) : (
          <div className="divide-y divide-[#E2E8F0]/60 dark:divide-border-default/60">
            {filtered.map(n => {
              const meta = ALERT_META[n.type];
              return (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id, n.page)}
                  className="w-full text-start flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-[#0EA5E9]/[0.05]"
                  style={{
                    background: n.read ? 'transparent' : `${meta.color}08`,
                    boxShadow: n.read ? 'none' : `inset ${lang === 'ar' ? '-3px' : '3px'} 0 0 ${meta.color}`,
                  }}
                >
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0" style={{ background: `${meta.color}15` }}>{meta.icon}</span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-text-primary">{lang === 'ar' ? n.title : n.titleEn}</span>
                      {!n.read && <Pill text={t('جديد', 'New')} color={meta.color} />}
                    </span>
                    <span className="block text-[11px] text-text-muted mt-0.5">{lang === 'ar' ? n.desc : n.descEn}</span>
                  </span>
                  <span className="text-[10px] text-text-muted shrink-0 mt-1">{relativeTime(n.date, lang)}</span>
                </button>
              );
            })}
          </div>
        )}
      </Panel>
      {ToastView}
    </div>
  );
}
