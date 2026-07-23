// ─────────────────────────────────────────────────────────────
// 4.2 — AdminLayout الهيكل العام للوحة المشرف
// Sidebar (220px/64px) + Topbar (60px) + منطقة المحتوى
// Super Admin: وصول كامل — Sub Admin: حسب الصلاحيات
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useLang } from '@/contexts/LanguageContext';
import {
  Home, Users, Briefcase, CreditCard, MessageSquare,
  FileText, BarChart2, UserCheck, Layout, Ticket,
  TrendingUp, HelpCircle, Star, Info, Palette, ShieldCheck,
  Bell, Settings, Lock, UserCog, Menu, ChevronRight, ChevronLeft,
  LogOut, Search, CalendarDays, ListTodo,
} from 'lucide-react';
import { clearAdminSession, getAdminSession, getRefreshToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { useClients, useTransactions, useMessages, useNotifications, useSubAdmins } from '@/lib/queries';
import { ADMIN_KEYS, relativeTime } from '@/lib/adminData';

interface MenuItem {
  key: string;
  to: string;
  icon: any;
  ar: string;
  en: string;
  badge?: number;
  special?: boolean;
}
interface MenuGroup { ar: string; en: string; items: MenuItem[] }

const PAGE_NAMES: Record<string, [string, string]> = {
  overview: ['لوحة التحكم', 'Dashboard'],
  clients: ['العملاء', 'Clients'],
  portfolios: ['المحافظ', 'Portfolios'],
  transactions: ['العمليات', 'Transactions'],
  messages: ['الرسائل', 'Messages'],
  content: ['المحتوى', 'Content'],
  reports: ['التقارير', 'Reports'],
  team: ['الفريق', 'Team'],
  notifications: ['الإشعارات', 'Notifications'],
  settings: ['الإعدادات', 'Settings'],
  security: ['الأمان', 'Security'],
  hero: ['قسم البطل', 'Hero Section'],
  services_mgr: ['إدارة الخدمات', 'Manage Services'],
  markets_mgr: ['إدارة الأسواق', 'Manage Markets'],
  faq_mgr: ['الأسئلة الشائعة', 'FAQs'],
  testimonials: ['الشهادات', 'Testimonials'],
  site_design: ['التصميم والتنقل', 'Design & Navigation'],
  about_mgr: ['صفحة من نحن', 'About Page'],
  sub_admins: ['إدارة المشرفين', 'Manage Admins'],
  privacy_policy: ['سياسة الخصوصية', 'Privacy Policy'],
  calendar: ['التقويم', 'Calendar'],
  tasks: ['المهام', 'Tasks'],
  search: ['البحث العالمي', 'Global Search'],
};

// صفحات Sub Admin الأساسية الممكنة
const SUB_SECTIONS: Record<string, { to: string; icon: any; ar: string; en: string }> = {
  clients: { to: '/Akadmin/clients', icon: Users, ar: 'العملاء', en: 'Clients' },
  portfolios: { to: '/Akadmin/portfolios', icon: Briefcase, ar: 'المحافظ', en: 'Portfolios' },
  transactions: { to: '/Akadmin/transactions', icon: CreditCard, ar: 'العمليات', en: 'Transactions' },
  messages: { to: '/Akadmin/messages', icon: MessageSquare, ar: 'الرسائل', en: 'Messages' },
  content: { to: '/Akadmin/content', icon: FileText, ar: 'المحتوى', en: 'Content' },
  reports: { to: '/Akadmin/reports', icon: BarChart2, ar: 'التقارير', en: 'Reports' },
};

function useSidebarCollapsed(): [boolean, (v: boolean) => void] {
  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ADMIN_KEYS.SIDEBAR_COLLAPSED) || 'false'); } catch { return false; }
  });
  const set = (v: boolean) => {
    setCollapsed(v);
    localStorage.setItem(ADMIN_KEYS.SIDEBAR_COLLAPSED, JSON.stringify(v));
  };
  return [collapsed, set];
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLang();
  const session = getAdminSession();
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const { data: clientsData } = useClients();
  const { data: transactionsData } = useTransactions();
  const { data: messagesData } = useMessages();
  const { data: notificationsData } = useNotifications();
  const { data: subAdminsData } = useSubAdmins();

  const clients = clientsData?.data || [];
  const transactions = transactionsData?.data || [];
  const messages = messagesData?.data || [];
  const notifications = notificationsData?.data || [];
  const subAdmins = subAdminsData?.data || [];

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const isSuper = session?.role === 'super';
  const permissions: string[] = session?.permissions || [];

  // ── إغلاق القوائم المنسدلة عند الضغط خارجها ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── اختصار ⌘K للبحث العالمي ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        navigate({ to: '/Akadmin/search' });
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate]);

  // ── تسجيل خروج تلقائي للـ Sub Admin إذا عُطّل أو حُذف ──
  useEffect(() => {
    if (isSuper || !session) return;
    const check = () => {
      const me = subAdmins.find((sa: any) => sa.email === session.email);
      const forced = localStorage.getItem('tharwah_force_logout');
      if (!me || me.status !== 'active' || forced) {
        localStorage.removeItem('tharwah_force_logout');
        clearAdminSession();
        navigate({ to: '/Akadmin' });
      }
    };
    check();
    const id = setInterval(check, 30000);
    window.addEventListener('storage', check);
    return () => { clearInterval(id); window.removeEventListener('storage', check); };
  }, [isSuper, session, subAdmins, navigate]);

  // ── العدادات الحية للشارات ──
  const pendingClients = clients.filter((c: any) => c.status === 'pending').length;
  const pendingTxs = transactions.filter((tx: any) => tx.status === 'pending').length;
  const pendingMessages = messages.filter((m: any) => m.status === 'pending').length;
  const unreadNotifs = localNotifications.filter((n: any) => !n.read).length;

  // ── مجموعات القائمة (Super Admin) ──
  const superGroups: MenuGroup[] = useMemo(() => [
    { ar: 'الرئيسية', en: 'Main', items: [
      { key: 'overview', to: '/Akadmin/overview', icon: Home, ar: 'لوحة التحكم', en: 'Dashboard' },
    ] },
    { ar: 'إدارة العملاء ومحافظهم', en: 'Clients & Portfolios', items: [
      { key: 'clients', to: '/Akadmin/clients', icon: Users, ar: 'العملاء والحسابات', en: 'Clients & Accounts', badge: pendingClients || undefined },
      { key: 'portfolios', to: '/Akadmin/portfolios', icon: Briefcase, ar: 'المحافظ الاستثمارية', en: 'Portfolios' },
      { key: 'transactions', to: '/Akadmin/transactions', icon: CreditCard, ar: 'العمليات', en: 'Transactions', badge: pendingTxs || undefined },
      { key: 'messages', to: '/Akadmin/messages', icon: MessageSquare, ar: 'الرسائل', en: 'Messages', badge: pendingMessages || undefined },
    ] },
    { ar: 'المنصة', en: 'Platform', items: [
      { key: 'content', to: '/Akadmin/content', icon: FileText, ar: 'المحتوى', en: 'Content' },
      { key: 'reports', to: '/Akadmin/reports', icon: BarChart2, ar: 'التقارير', en: 'Reports' },
      { key: 'team', to: '/Akadmin/team', icon: UserCheck, ar: 'الفريق', en: 'Team' },
    ] },
    { ar: 'إدارة الموقع', en: 'Website', items: [
      { key: 'hero', to: '/Akadmin/hero', icon: Layout, ar: 'قسم البطل', en: 'Hero Section' },
      { key: 'services_mgr', to: '/Akadmin/services_mgr', icon: Ticket, ar: 'الخدمات', en: 'Services' },
      { key: 'markets_mgr', to: '/Akadmin/markets_mgr', icon: TrendingUp, ar: 'الأسواق', en: 'Markets' },
      { key: 'faq_mgr', to: '/Akadmin/faq_mgr', icon: HelpCircle, ar: 'الأسئلة الشائعة', en: 'FAQs' },
      { key: 'testimonials', to: '/Akadmin/testimonials', icon: Star, ar: 'الشهادات', en: 'Testimonials' },
      { key: 'about_mgr', to: '/Akadmin/about_mgr', icon: Info, ar: 'من نحن', en: 'About Us' },
      { key: 'site_design', to: '/Akadmin/site_design', icon: Palette, ar: 'التصميم والتنقل', en: 'Design & Nav' },
      { key: 'privacy_policy', to: '/Akadmin/privacy_policy', icon: ShieldCheck, ar: 'سياسة الخصوصية', en: 'Privacy Policy', special: true },
    ] },
    { ar: 'النظام', en: 'System', items: [
      { key: 'notifications', to: '/Akadmin/notifications', icon: Bell, ar: 'الإشعارات', en: 'Notifications', badge: unreadNotifs || undefined },
      { key: 'settings', to: '/Akadmin/settings', icon: Settings, ar: 'الإعدادات', en: 'Settings' },
      { key: 'security', to: '/Akadmin/security', icon: Lock, ar: 'الأمان', en: 'Security' },
    ] },
    { ar: 'أدوات المشرف', en: 'Admin Tools', items: [
      { key: 'calendar', to: '/Akadmin/calendar', icon: CalendarDays, ar: 'التقويم', en: 'Calendar' },
      { key: 'tasks', to: '/Akadmin/tasks', icon: ListTodo, ar: 'المهام', en: 'Tasks' },
    ] },
    { ar: 'إدارة الصلاحيات', en: 'Permissions', items: [
      { key: 'sub_admins', to: '/Akadmin/sub_admins', icon: UserCog, ar: 'إضافة مشرف', en: 'Add Admin', special: true },
    ] },
  ], [pendingClients, pendingTxs, pendingMessages, unreadNotifs]);

  // ── قائمة Sub Admin: الأقسام المتاحة فقط ──
  const subItems: MenuItem[] = useMemo(() =>
    permissions
      .filter(p => SUB_SECTIONS[p])
      .map(p => ({
        key: p,
        to: SUB_SECTIONS[p].to,
        icon: SUB_SECTIONS[p].icon,
        ar: SUB_SECTIONS[p].ar,
        en: SUB_SECTIONS[p].en,
        badge: p === 'messages' ? pendingMessages || undefined : p === 'transactions' ? pendingTxs || undefined : p === 'clients' ? pendingClients || undefined : undefined,
      })),
    [permissions, pendingClients, pendingTxs, pendingMessages]
  );

  // ── حماية الصفحات: توجيه الـ Sub لأول صفحة مسموحة ──
  const safePage = useMemo(() => {
    if (isSuper) return null;
    const first = subItems[0]?.to || '/Akadmin/overview';
    const path = location.pathname;
    const allowed = subItems.some(i => path.startsWith(i.to));
    return allowed ? null : first;
  }, [isSuper, subItems, location.pathname]);

  useEffect(() => {
    if (!isSuper && subItems.length === 0) {
      // مشرف فرعي بلا أي صلاحيات → خروج قسري
      clearAdminSession();
      navigate({ to: '/Akadmin' });
      return;
    }
    if (safePage) navigate({ to: safePage as any });
  }, [isSuper, subItems.length, safePage, navigate]);

  if (!session) return null;

  const currentPath = location.pathname;
  const isActive = (to: string) => currentPath === to || currentPath.startsWith(to + '/');

  // اسم الصفحة الحالية للـ Breadcrumb
  const pageKey = (() => {
    const seg = currentPath.replace(/^\/Akadmin\/?/, '');
    if (!seg || seg === 'overview') return 'overview';
    if (seg.startsWith('clients/')) return 'clients';
    return (seg.split('/')[0] || 'overview') as string;
  })();
  const pageName = PAGE_NAMES[pageKey] ? (lang === 'ar' ? PAGE_NAMES[pageKey][0] : PAGE_NAMES[pageKey][1]) : pageKey;

  const handleLogout = () => {
    const refreshToken = getRefreshToken();
    void api.logout(refreshToken).finally(() => {
      clearAdminSession();
      localStorage.removeItem('admin_permissions');
      navigate({ to: '/Akadmin' });
    });
  };

  const markAllRead = () => setLocalNotifications(prev => prev.map((n: any) => ({ ...n, read: true })));
  const markRead = (id: string, page: string) => {
    setLocalNotifications(prev => prev.map((n: any) => n.id === id ? { ...n, read: true } : n));
    setNotifOpen(false);
    if (page) navigate({ to: page as any });
  };

  const renderItem = (item: MenuItem) => {
    const active = isActive(item.to);
    const special = item.special;
    return (
      <Link
        key={item.key}
        to={item.to as any}
        title={collapsed ? (lang === 'ar' ? item.ar : item.en) : undefined}
        aria-current={active ? 'page' : undefined}
        className="relative flex items-center rounded-lg transition-all duration-150 group"
        style={{
          padding: collapsed ? '11px 0' : '9px 14px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? 0 : 12,
          background: active
            ? (special ? 'rgba(201,168,76,0.1)' : 'rgba(14,165,233,0.1)')
            : special ? 'rgba(201,168,76,0.05)' : 'transparent',
          boxShadow: active ? `inset ${lang === 'ar' ? '-2px' : '2px'} 0 0 #C9A84C` : 'none',
          border: special && !active ? '1px solid rgba(201,168,76,0.3)' : '1px solid transparent',
          color: active ? (special ? '#B8912F' : '#0EA5E9') : special ? '#C9A84C' : '#475569',
          fontWeight: active ? 700 : special ? 600 : 400,
          marginBottom: 2,
        }}
        onMouseEnter={e => {
          if (!active) {
            e.currentTarget.style.background = special ? 'rgba(201,168,76,0.12)' : 'rgba(14,165,233,0.04)';
            e.currentTarget.style.color = special ? '#B8912F' : '#0EA5E9';
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            e.currentTarget.style.background = special ? 'rgba(201,168,76,0.05)' : 'transparent';
            e.currentTarget.style.color = special ? '#C9A84C' : '#475569';
          }
        }}
      >
        <item.icon style={{ width: 16, height: 16, flexShrink: 0 }} />
        {!collapsed && (
          <>
            <span className="truncate" style={{ fontSize: 13 }}>{lang === 'ar' ? item.ar : item.en}</span>
            {item.badge !== undefined && (
              <span
                className="ms-auto text-white font-bold text-center shrink-0"
                style={{ background: '#FF4560', borderRadius: 999, padding: '1px 6px', fontSize: 9, minWidth: 18 }}
              >
                {item.badge}
              </span>
            )}
          </>
        )}
        {collapsed && item.badge !== undefined && (
          <span className="absolute rounded-full" style={{ width: 6, height: 6, background: '#FF4560', top: 4, insetInlineEnd: 4 }} />
        )}
      </Link>
    );
  };

  return (
    <div
      className="font-[Cairo]"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{ minHeight: '100vh', display: 'flex', background: '#F0F4F8', color: '#1E293B', minWidth: 1280 }}
    >
      {/* ════════ 4.2.1 — Sidebar ════════ */}
      <aside
        role="navigation"
        className="sticky top-0 h-screen bg-white flex flex-col shrink-0 transition-all duration-300"
        style={{
          width: collapsed ? 64 : 220,
          borderInlineEnd: '1px solid #E2E8F0',
          boxShadow: lang === 'ar' ? '-2px 0 8px rgba(0,0,0,0.03)' : '2px 0 8px rgba(0,0,0,0.03)',
          overflowX: 'hidden',
        }}
      >
        {/* اللوغو */}
        <div className="flex items-center justify-between shrink-0" style={{ height: 60, borderBottom: '1px solid #E2E8F0', padding: '0 12px' }}>
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', fontSize: 16 }}
                >
                  ⚡
                </div>
                <div className="leading-tight min-w-0">
                  <div className="font-extrabold text-[#1E293B] truncate" style={{ fontSize: 13 }}>Golden Horizon</div>
                  <div style={{ fontSize: 10, color: '#0EA5E9' }}>Admin Panel</div>
                </div>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="text-[#94A3B8] hover:text-[#0EA5E9] transition-colors shrink-0 p-1"
                aria-label="Collapse sidebar"
              >
                {lang === 'ar' ? <ChevronRight style={{ width: 15, height: 15 }} /> : <ChevronLeft style={{ width: 15, height: 15 }} />}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 w-full">
              <div className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', fontSize: 16 }}>⚡</div>
              <button onClick={() => setCollapsed(false)} className="text-[#94A3B8] hover:text-[#0EA5E9] transition-colors" aria-label="Expand sidebar">
                <Menu style={{ width: 15, height: 15 }} />
              </button>
            </div>
          )}
        </div>

        {/* Badge الدور */}
        {!collapsed && (
          <div className="mx-3 mt-2 font-bold text-center" style={{
            padding: '5px 10px', borderRadius: 10, fontSize: 10,
            background: isSuper ? 'rgba(201,168,76,0.12)' : 'rgba(14,165,233,0.08)',
            border: `1px solid ${isSuper ? 'rgba(201,168,76,0.3)' : 'rgba(14,165,233,0.2)'}`,
            color: isSuper ? '#C9A84C' : '#0EA5E9',
          }}>
            {isSuper ? '👑 Super Admin' : t('🔵 مدير نظام', '🔵 System Admin')}
          </div>
        )}

        {/* القائمة الرئيسية */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1 px-1.5" style={{ scrollbarWidth: 'none' }}>
          {isSuper ? (
            superGroups.map((group, gi) => (
              <div key={gi}>
                {!collapsed && gi > 0 && <div className="mx-3 my-1" style={{ height: 1, background: 'rgba(203,213,225,0.5)' }} />}
                {!collapsed && (
                  <h3 className="uppercase font-bold" style={{ fontSize: 9, letterSpacing: '1.5px', color: '#94A3B8', padding: '8px 14px 4px' }}>
                    {lang === 'ar' ? group.ar : group.en}
                  </h3>
                )}
                {collapsed && gi > 0 && <div className="mx-2 my-1.5" style={{ height: 1, background: 'rgba(203,213,225,0.5)' }} />}
                {group.items.map(renderItem)}
              </div>
            ))
          ) : (
            <div>
              {!collapsed && (
                <h3 className="uppercase font-bold" style={{ fontSize: 9, letterSpacing: '1.5px', color: '#94A3B8', padding: '8px 14px 4px' }}>
                  {t('الأقسام المتاحة', 'Available Sections')}
                </h3>
              )}
              {subItems.map(renderItem)}
            </div>
          )}
        </nav>

        {/* بطاقة المشرف */}
        <div className="relative shrink-0" style={{ borderTop: '1px solid #E2E8F0', padding: '10px 8px' }} ref={profileRef}>
          {!collapsed ? (
            <button
              onClick={() => setProfileOpen(o => !o)}
              className="w-full flex items-center gap-3 rounded-lg cursor-pointer transition-colors"
              style={{ padding: 8, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)' }}
            >
              <span
                className="flex items-center justify-center rounded-full text-white font-extrabold shrink-0"
                style={{
                  width: 28, height: 28, fontSize: 11,
                  background: isSuper ? 'linear-gradient(135deg, #C9A84C, #E8C96A)' : 'linear-gradient(135deg, #0EA5E9, #38BDF8)',
                }}
              >
                {session.name.charAt(0).toUpperCase()}
              </span>
              <span className="text-start min-w-0 flex-1">
                <span className="block font-bold text-[#1E293B] truncate" style={{ fontSize: 12 }}>{session.name}</span>
                <span className="block" style={{ fontSize: 9, color: isSuper ? '#C9A84C' : '#0EA5E9' }}>
                  {isSuper ? 'Super Admin' : t('مدير نظام', 'System Admin')}
                </span>
              </span>
            </button>
          ) : (
            <button onClick={() => setProfileOpen(o => !o)} className="w-full flex justify-center" title={session.name}>
              <span
                className="flex items-center justify-center rounded-full text-white font-extrabold"
                style={{
                  width: 28, height: 28, fontSize: 11,
                  background: isSuper ? 'linear-gradient(135deg, #C9A84C, #E8C96A)' : 'linear-gradient(135deg, #0EA5E9, #38BDF8)',
                }}
              >
                {session.name.charAt(0).toUpperCase()}
              </span>
            </button>
          )}

          {/* Dropdown ─ يفتح للأعلى */}
          {profileOpen && (
            <div
              className="absolute bg-white rounded-lg overflow-hidden"
              style={{
                bottom: '100%', insetInlineStart: 8, marginBottom: 6,
                width: collapsed ? 180 : 'calc(100% - 16px)',
                border: '1px solid #E2E8F0', boxShadow: '0 -4px 12px rgba(0,0,0,0.08)', zIndex: 200,
              }}
            >
              {isSuper && (
                <button
                  onClick={() => { setProfileOpen(false); navigate({ to: '/Akadmin/settings' }); }}
                  className="w-full flex items-center gap-2 text-[#475569] transition-colors hover:bg-[#0EA5E9]/[0.08]"
                  style={{ padding: '10px 12px', fontSize: 12 }}
                >
                  <Settings style={{ width: 13, height: 13, color: '#64748B' }} />
                  {t('الإعدادات', 'Settings')}
                </button>
              )}
              <div className="truncate" style={{ padding: '8px 12px', fontSize: 11, color: '#94A3B8', fontFamily: 'monospace', borderTop: '1px solid #CBD5E1' }} dir="ltr">
                {session.email}
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 text-[#FF4560] transition-colors hover:bg-[#FF4560]/[0.08]"
                style={{ padding: '10px 12px', fontSize: 12, borderTop: '1px solid #F1F5F9' }}
              >
                <LogOut style={{ width: 13, height: 13 }} />
                {t('خروج', 'Sign Out')}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ════════ منطقة المحتوى ════════ */}
      <div className="flex-1 flex flex-col" style={{ minWidth: 0 }}>
        {/* 4.2.2 — Topbar */}
        <header
          className="sticky top-0 bg-white flex items-center justify-between gap-4"
          style={{ height: 60, borderBottom: '1px solid #E2E8F0', padding: '0 20px', zIndex: 90 }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span style={{ fontSize: 13, color: '#64748B' }}>Golden Horizon</span>
            <ChevronRight style={{ width: 12, height: 12, color: '#64748B', transform: lang === 'ar' ? 'scaleX(-1)' : 'none' }} />
            <span className="font-semibold text-[#1E293B]" style={{ fontSize: 13 }}>{pageName}</span>
          </div>

          {/* البحث */}
          <button
            onClick={() => navigate({ to: '/Akadmin/search' })}
            className="flex items-center gap-2 rounded-lg transition-colors hover:border-[#0EA5E9]/40"
            style={{ flex: 1, maxWidth: 360, background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '7px 12px' }}
          >
            <Search style={{ width: 13, height: 13, color: '#64748B' }} />
            <span style={{ fontSize: 12, color: '#94A3B8' }}>{t('بحث...', 'Search...')}</span>
            <kbd className="ms-auto rounded" style={{ background: '#CBD5E1', padding: '1px 5px', fontSize: 10, color: '#64748B' }}>⌘K</kbd>
          </button>

          {/* الأدوات */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Badge مباشر */}
            <div
              className="flex items-center gap-1.5 rounded cursor-default select-none"
              style={{ background: 'rgba(0,217,126,0.08)', border: '1px solid rgba(0,217,126,0.2)', padding: '5px 10px' }}
            >
              <span className="rounded-full" style={{ width: 6, height: 6, background: '#00D97E', animation: 'adminBlink 1.5s infinite' }} />
              <span style={{ fontSize: 11, color: '#00A867' }}>{t('مباشر', 'Live')}</span>
            </div>

            {/* الإشعارات — Super فقط */}
            {isSuper && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(o => !o)}
                  className="relative flex items-center justify-center rounded-lg transition-colors"
                  style={{
                    width: 36, height: 36,
                    background: notifOpen ? 'rgba(14,165,233,0.1)' : '#F1F5F9',
                    border: `1px solid ${notifOpen ? 'rgba(14,165,233,0.3)' : '#E2E8F0'}`,
                  }}
                  aria-label={t('الإشعارات', 'Notifications')}
                >
                  <Bell style={{ width: 15, height: 15, color: '#64748B' }} />
                  {unreadNotifs > 0 && (
                    <span className="absolute rounded-full" style={{ width: 7, height: 7, background: '#FF4560', top: -2, insetInlineEnd: -2, border: '2px solid white' }} />
                  )}
                </button>

                {notifOpen && (
                  <div
                    className="absolute bg-white overflow-hidden"
                    style={{
                      top: '100%', insetInlineEnd: 0, marginTop: 8, width: 320,
                      border: '1px solid #E2E8F0', borderRadius: 16,
                      boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 200,
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between" style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0' }}>
                      <span className="font-bold text-[#1E293B]" style={{ fontSize: 13 }}>{t('الإشعارات', 'Notifications')}</span>
                      <button onClick={markAllRead} className="transition-colors hover:underline" style={{ fontSize: 11, color: '#0EA5E9' }}>
                        {t('تعليم الكل مقروء', 'Mark All Read')}
                      </button>
                    </div>
                    {/* القائمة — أول 5 */}
                    <div>
                      {localNotifications.slice(0, 5).map((n: any) => {
                        const colors: Record<string, string> = { critical: '#FF4560', warning: '#F59E0B', info: '#0EA5E9', success: '#00D97E' };
                        const icons: Record<string, string> = { critical: '🔴', warning: '🟡', info: '🔵', success: '🟢' };
                        return (
                          <button
                            key={n.id}
                            onClick={() => markRead(n.id, n.page)}
                            className="w-full text-start flex items-start gap-2.5 transition-colors hover:bg-[#0EA5E9]/[0.06]"
                            style={{
                              padding: '10px 14px',
                              borderBottom: '1px solid rgba(203,213,225,0.5)',
                              background: n.read ? 'transparent' : 'rgba(14,165,233,0.03)',
                            }}
                          >
                            <span style={{ fontSize: 17, flexShrink: 0 }}>{icons[n.type]}</span>
                            <span className="flex-1 min-w-0">
                              <span className="block font-semibold text-[#1E293B] truncate" style={{ fontSize: 12 }}>{lang === 'ar' ? n.title : n.titleEn}</span>
                              <span className="block mt-0.5" style={{ fontSize: 11, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lang === 'ar' ? n.desc : n.descEn}</span>
                            </span>
                            <span style={{ fontSize: 10, color: '#94A3B8', flexShrink: 0 }}>{relativeTime(n.date, lang)}</span>
                          </button>
                        );
                      })}
                    </div>
                    {/* Footer */}
                    <button
                      onClick={() => { setNotifOpen(false); navigate({ to: '/Akadmin/notifications' }); }}
                      className="w-full transition-colors hover:bg-[#0EA5E9]/[0.06]"
                      style={{ padding: 10, fontSize: 12, color: '#0EA5E9', borderTop: '1px solid #E2E8F0' }}
                    >
                      {t('عرض الكل', 'View All')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* 4.2.3 — المحتوى */}
        <main className="flex-1" style={{ padding: 24, overflowY: 'auto' }}>
          {React.Children.map(children, child => <>{child}</>)}
        </main>
      </div>

      {/* CSS المضمّن */}
      <style>{`
        @keyframes adminBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
      `}</style>
    </div>
  );
}
