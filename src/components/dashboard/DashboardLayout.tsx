import React, { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useNavigate, Link } from '@tanstack/react-router';
import { clearClientSession, getClientSession } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  Home, BarChart3, TrendingUp, Landmark, FileText, BarChart2,
  MessageSquare, UserCircle, Settings, LogOut, Globe,
  ChevronRight, ChevronLeft, Menu, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export type DashboardTab = 'info' | 'investments' | 'performance' | 'banking' | 'transactions' | 'reports' | 'support' | 'advisor' | 'settings';

interface DashboardLayoutProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  children: React.ReactNode;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  sessionName: string;
}

export function DashboardLayout({ activeTab, onTabChange, children, isDarkMode, onToggleDarkMode, sessionName }: DashboardLayoutProps) {
  const { t, lang, setLang } = useLang();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const handleSignOut = () => {
    void api.logout().finally(() => {
      clearClientSession();
      navigate({ to: '/' });
    });
  };

  const tabLabels: Record<DashboardTab, { label: string; labelEn: string; icon: React.ElementType }> = {
    info: { label: t('الرئيسية', 'Overview'), labelEn: 'Overview', icon: Home },
    investments: { label: t('استثماراتي', 'My Investments'), labelEn: 'My Investments', icon: BarChart3 },
    performance: { label: t('الأداء', 'Performance'), labelEn: 'Performance', icon: TrendingUp },
    banking: { label: t('البنوك', 'Banking'), labelEn: 'Banking', icon: Landmark },
    transactions: { label: t('المعاملات', 'Transactions'), labelEn: 'Transactions', icon: FileText },
    reports: { label: t('التقارير', 'Reports'), labelEn: 'Reports', icon: BarChart2 },
    support: { label: t('الدعم', 'Support'), labelEn: 'Support', icon: MessageSquare },
    advisor: { label: t('مستشاري', 'My Advisor'), labelEn: 'My Advisor', icon: UserCircle },
    settings: { label: t('الإعدادات', 'Settings'), labelEn: 'Settings', icon: Settings },
  };

  const menuGroups = [
    {
      title: t('المحفظة', 'PORTFOLIO'),
      items: ['info', 'investments', 'performance'] as DashboardTab[],
    },
    {
      title: t('المالية', 'FINANCE'),
      items: ['banking', 'transactions', 'reports'] as DashboardTab[],
    },
    {
      title: t('التواصل', 'COMMUNICATION'),
      items: ['support', 'advisor', 'settings'] as DashboardTab[],
    },
  ];

  // Mobile Bottom Nav items
  const mobileNavItems: DashboardTab[] = ['info', 'investments', 'banking', 'transactions', 'support', 'settings'];

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0D0D1A] flex font-[Cairo] relative text-text-primary transition-colors duration-300" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Logout Modal */}
      {logoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1C34] border border-border-light dark:border-[#2D2D50] w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black mb-2">{t('هل تريد تسجيل الخروج؟', 'Do you want to sign out?')}</h3>
            <p className="text-sm text-text-secondary mb-6">{t('سيتم إنهاء جلستك الحالية وسيتعين عليك تسجيل الدخول مرة أخرى للوصول إلى محفظتك.', 'Your session will be closed and you will have to login again to access your portfolio.')}</p>
            <div className="flex items-center gap-3">
              <Button variant="danger" onClick={handleSignOut} className="flex-1 py-3">{t('نعم، اخرج', 'Yes, Sign Out')}</Button>
              <Button variant="ghost" onClick={() => setLogoutModalOpen(false)} className="flex-1 py-3 border border-border-default">{t('إلغاء', 'Cancel')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR - Hidden on mobile */}
      <aside className={`hidden lg:flex sticky top-0 h-screen bg-white dark:bg-[#20203A] border-r dark:border-l border-[#E2E8F0] dark:border-[#2D2D50] shadow-xl flex-col transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[260px]'} z-90`}>
        {/* Header */}
        <div className="h-[64px] border-b border-[#E2E8F0] dark:border-[#2D2D50] flex items-center px-4 justify-between shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center shadow-gold-sm">
                <span className="font-black text-white text-lg">ر</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-black text-text-primary">{t('ثروة كابيتال', 'Tharwah Capital')}</span>
                <span className="text-[10px] font-medium text-text-muted">{t('لوحة المستثمر', 'Investor Dashboard')}</span>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center shadow-gold-sm mx-auto">
              <span className="font-black text-white text-lg">ر</span>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded bg-secondary hover:bg-gold-light border border-border-default text-text-muted hover:text-gold-deep transition-all">
            {collapsed ? <Menu className="w-4 h-4" /> : (lang === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />)}
          </button>
        </div>

        {/* Client Profile */}
        {!collapsed ? (
          <div className="m-3 p-4 bg-gold-light border border-border-gold rounded-xl flex items-center gap-3">
            <div className="w-11 h-11 rounded-full gradient-gold flex items-center justify-center text-white font-black text-lg shadow-gold-sm relative">
              {sessionName[0] || 'A'}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white ring-1 ring-emerald-500/20" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-text-primary truncate">{sessionName}</h4>
              <p className="text-[10px] text-text-muted font-mono truncate">TH-9842105</p>
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[9px] font-black">{t('ذهبي', 'Gold')}</span>
            </div>
          </div>
        ) : (
          <div className="my-4 flex justify-center">
            <div className="w-11 h-11 rounded-full gradient-gold flex items-center justify-center text-white font-black text-lg shadow-gold-sm relative">
              {sessionName[0] || 'A'}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white ring-1 ring-emerald-500/20" />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
          {menuGroups.map((group, gi) => (
            <div key={gi}>
              {!collapsed && <h5 className="text-[10px] font-bold text-text-muted tracking-widest uppercase px-3 mb-2">{group.title}</h5>}
              <div className="space-y-1">
                {group.items.map((tab) => {
                  const info = tabLabels[tab];
                  return (
                    <button key={tab} onClick={() => onTabChange(tab)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === tab ? 'bg-gold-light text-gold-deep border-r-4 border-gold-primary font-black' : 'text-text-secondary hover:bg-gold-light/40 hover:text-gold-deep'
                    } ${collapsed ? 'justify-center' : ''}`}>
                      <info.icon className={`w-[18px] h-[18px] shrink-0 ${activeTab === tab ? 'text-gold-deep stroke-[2.5]' : 'text-text-muted'}`} />
                      {!collapsed && <span>{info.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-[#E2E8F0] dark:border-[#2D2D50] p-2 space-y-1 shrink-0">
          <button onClick={onToggleDarkMode} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold text-text-secondary hover:bg-secondary transition-all ${collapsed ? 'justify-center' : ''}`}>
            {isDarkMode ? '☀️' : '🌙'}
            {!collapsed && <span>{isDarkMode ? t('المظهر الفاتح', 'Light Mode') : t('المظهر الداكن', 'Dark Mode')}</span>}
          </button>
          <Link to="/" className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold text-text-secondary hover:text-gold-deep hover:bg-secondary transition-all ${collapsed ? 'justify-center' : ''}`}>
            <Globe className="w-4 h-4 text-text-muted" />
            {!collapsed && <span>{t('العودة للموقع الرئيسي', 'Return to Main Site')}</span>}
          </Link>
          <button onClick={() => setLogoutModalOpen(true)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all ${collapsed ? 'justify-center' : ''}`}>
            <LogOut className="w-[18px] h-[18px]" />
            {!collapsed && <span>{t('تسجيل الخروج', 'Sign Out')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header - Fixed on top */}
        <header className="lg:hidden sticky top-0 z-[100] h-[60px] bg-white dark:bg-[#13132A] border-b border-[#E2E8F0] dark:border-[#2D2D50] flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center shadow-gold-sm">
              <span className="font-black text-white text-sm">ر</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] text-text-muted font-bold">{t('ثروة كابيتال', 'Tharwah Capital')}</span>
              <span className="text-sm font-black text-text-primary">{tabLabels[activeTab]?.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary text-[10px] font-black">
              {lang === 'ar' ? 'EN' : 'ع'}
            </button>
            <div className="w-9 h-9 rounded-full gradient-gold flex items-center justify-center text-white font-black text-sm shadow-gold-sm border-2 border-white/20">
              {sessionName[0] || 'A'}
            </div>
          </div>
        </header>

        {/* Desktop Topbar */}
        <header className="hidden lg:flex sticky top-0 z-80 h-[64px] bg-white/80 dark:bg-[#13132A]/80 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#2D2D50] items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">{t('لوحة المستثمر', 'Investor')}</span>
            <ChevronLeft className={`w-3.5 h-3.5 text-text-muted ${lang === 'ar' ? 'rotate-180' : ''}`} />
            <span className="text-xs font-black text-gold-deep">{tabLabels[activeTab]?.label}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-4">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-emerald-600">{t('المحفظة نشطة', 'Portfolio Active')}</span>
            </div>
            <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="px-2.5 py-1.5 rounded-lg border border-border-default bg-secondary hover:bg-gold-light text-xs font-black text-text-primary transition-all">
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
            <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="relative p-2 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-[#20203A] text-text-secondary transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white ring-1 ring-rose-500/20" />
            </button>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6 space-y-6">
          {children}
        </main>

        {/* Mobile Bottom Navigation - Fixed on bottom */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[68px] bg-white dark:bg-[#13132A] border-t border-[#E2E8F0] dark:border-[#2D2D50] flex items-center justify-around px-2 z-[100]">
          {mobileNavItems.map((tab) => {
            const info = tabLabels[tab];
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all relative ${
                  active ? 'text-gold-deep' : 'text-text-muted'
                }`}
              >
                {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-gold-primary rounded-b-full" />}
                <info.icon className={`${active ? 'w-6 h-6 stroke-[2.5]' : 'w-5 h-5'}`} />
                <span className={`text-[10px] font-bold ${active ? 'font-black' : ''}`}>{info.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
