import React, { useState, useEffect } from 'react';
import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
import { useLang } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { isClientAuthed, getClientSession, clearClientSession } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  Menu, X, TrendingUp, Globe, Bitcoin, Building2, Gem, Fuel,
  Star, Phone, Bell, LogIn, LogOut, ChevronDown, BarChart3, User, FileText, Moon, Sun
} from 'lucide-react';

export function SiteHeader() {
  const { lang, setLang, t } = useLang();
  const { theme, setTheme } = useSiteSettings();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const isAuthed = isClientAuthed();
  const userSession = getClientSession();

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Calculate progress
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (currentScrollY / docHeight) * 100 : 0;
      setScrollProgress(progress);

      // Scrolled state
      if (currentScrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Hide/Show on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHidden(true);
      } else {
        setHidden(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsServicesOpen(false);
    setIsProfileOpen(false);
    setIsNotificationsOpen(false);
  }, [currentPath]);

  const navLinks = [
    { nameAr: 'الرئيسية', nameEn: 'Home', path: '/' },
    { nameAr: 'من نحن', nameEn: 'About', path: '/about' },
    { nameAr: 'خدماتنا', nameEn: 'Services', path: '/services', hasMega: true },
    { nameAr: 'الأسواق', nameEn: 'Markets', path: '/markets' },
    { nameAr: 'الأخبار', nameEn: 'News', path: '/news' },
    { nameAr: 'الأسئلة الشائعة', nameEn: 'FAQ', path: '/faq' },
    { nameAr: 'تواصل معنا', nameEn: 'Contact', path: '/contact' },
  ];

  return (
    <header className={cn(
      'sticky top-0 left-0 right-0 z-50 transition-all duration-400',
      hidden ? '-translate-y-full' : 'translate-y-0',
      scrolled ? (theme === 'dark' ? 'bg-[#13132AEE] backdrop-blur-[20px] shadow-md border-b border-border-gold' : 'bg-[#FFFFFFEE] backdrop-blur-[20px] shadow-md border-b border-border-gold') : 'bg-transparent'
    )}>
      {/* Scroll Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] z-50">
        <div className="h-full gradient-gold" style={{ width: `${scrollProgress}%` }} />
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-5 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 gradient-gold rounded-md shadow-gold-sm flex items-center justify-center transition-transform group-hover:-translate-y-[2px]">
            <span className="font-sans font-black text-white text-xl">ر</span>
          </div>
          <div className="flex flex-col">
            <span className="font-sans font-bold text-text-primary leading-tight">ثروة كابيتال</span>
            <span className={cn(
              "font-en font-medium text-gold-deep text-[10px] tracking-[0.15em] transition-opacity duration-300",
              (!scrolled && scrollProgress === 0) ? "opacity-0 h-0" : "opacity-100"
            )}>THARWAH CAPITAL</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 relative">
          {navLinks.map((link) => (
            <div key={link.path} className="relative"
              onMouseEnter={() => link.hasMega && setIsServicesOpen(true)}
              onMouseLeave={() => link.hasMega && setIsServicesOpen(false)}
            >
              <Link to={link.path} className={cn(
                "px-3.5 py-2 font-semibold text-[15px] rounded-md transition-colors relative block",
                currentPath === link.path ? "text-gold-deep bg-gold-light" : "text-text-secondary hover:text-text-gold hover:bg-gold-subtle"
              )}>
                {t(link.nameAr, link.nameEn)}
                {currentPath === link.path && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[2px] gradient-gold scale-100 transition-transform origin-center" />
                )}
              </Link>

              {/* Mega Menu */}
              {link.hasMega && isServicesOpen && (
                <div className="absolute top-full right-0 pt-2 w-[800px] animate-in fade-in slide-in-from-top-2 duration-250">
                  <div className="bg-primary backdrop-blur-sm border border-border-gold rounded-xl shadow-xl overflow-hidden">
                    <div className="p-6 grid grid-cols-3 gap-6">
                      
                      {/* Column 1 */}
                      <div>
                        <div className="text-gold-deep font-bold text-[11px] uppercase tracking-[0.15em] border-b border-border-gold pb-2 mb-3">📈 أسواق الأسهم</div>
                        <Link to="/services" className="block p-2 rounded-md hover:bg-gold-subtle hover:translate-x-[-4px] transition-all group">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-gold-primary" />
                            <span className="font-semibold text-[14px] text-text-primary">الأسهم الخليجية والعربية</span>
                          </div>
                          <p className="text-muted text-[12px] mt-1 pr-6">استثمر في أسواق السعودية، الإمارات، الكويت ومصر</p>
                        </Link>
                        <Link to="/services" className="block p-2 rounded-md hover:bg-gold-subtle hover:translate-x-[-4px] transition-all group mt-2">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gold-primary" />
                            <span className="font-semibold text-[14px] text-text-primary">الأسهم العالمية</span>
                          </div>
                          <p className="text-muted text-[12px] mt-1 pr-6">وول ستريت، ناسداك، لندن وطوكيو</p>
                        </Link>
                      </div>

                      {/* Column 2 */}
                      <div>
                        <div className="text-gold-deep font-bold text-[11px] uppercase tracking-[0.15em] border-b border-border-gold pb-2 mb-3">💰 أسواق بديلة</div>
                        <Link to="/services" className="block p-2 rounded-md hover:bg-gold-subtle transition-all group">
                          <div className="flex items-center gap-2">
                            <Bitcoin className="w-4 h-4 text-gold-primary" />
                            <span className="font-semibold text-[14px] text-text-primary">العملات الرقمية</span>
                          </div>
                        </Link>
                        <Link to="/services" className="block p-2 rounded-md hover:bg-gold-subtle transition-all group">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gold-primary" />
                            <span className="font-semibold text-[14px] text-text-primary">صناديق الاستثمار</span>
                          </div>
                        </Link>
                        <Link to="/services" className="block p-2 rounded-md hover:bg-gold-subtle transition-all group">
                          <div className="flex items-center gap-2">
                            <Gem className="w-4 h-4 text-gold-primary" />
                            <span className="font-semibold text-[14px] text-text-primary">المعادن والذهب</span>
                          </div>
                        </Link>
                        <Link to="/services" className="block p-2 rounded-md hover:bg-gold-subtle transition-all group">
                          <div className="flex items-center gap-2">
                            <Fuel className="w-4 h-4 text-gold-primary" />
                            <span className="font-semibold text-[14px] text-text-primary">النفط والطاقة</span>
                          </div>
                        </Link>
                      </div>

                      {/* Column 3 */}
                      <div>
                        <div className="text-gold-deep font-bold text-[11px] uppercase tracking-[0.15em] border-b border-border-gold pb-2 mb-3">🔥 الأكثر طلباً</div>
                        <div className="space-y-3 pt-2">
                          {['الأسهم الخليجية', 'Bitcoin والعملات الرقمية', 'الذهب والفضة', 'صناديق ETF العالمية'].map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Star className="w-3 h-3 text-gold-primary" />
                              <span className="text-sm text-text-secondary">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                    {/* Bottom Bar */}
                    <div className="bg-tertiary border-t border-border-light p-3 px-5 flex items-center justify-between">
                      <span className="text-[13px] text-text-secondary">🎯 {t('ابدأ رحلتك الاستثمارية بمحادثة مجانية مع خبرائنا', 'Start your journey with a free consultation')}</span>
                      <Link to="/contact">
                        <Button size="sm" className="gap-2 text-[12px] h-8 px-3">
                          <Phone className="w-3 h-3" />
                          {t('تحدث مع مستشار', 'Talk to Advisor')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Toolbar */}
        <div className="hidden lg:flex items-center gap-3">
          
          {/* Theme Switcher */}
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-10 h-10 rounded-md bg-tertiary hover:bg-gold-subtle flex items-center justify-center transition-colors group">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-gold-primary group-hover:rotate-12 transition-transform" /> : <Moon className="w-5 h-5 text-text-secondary group-hover:-rotate-12 transition-transform" />}
          </button>

          {/* Language Switcher */}
          <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="px-3 h-10 rounded-md border border-border-default hover:border-border-gold flex items-center gap-2 transition-colors">
            <Globe className="w-4 h-4 text-text-secondary" />
            <div className="flex items-center gap-1 text-[13px]">
              <span className={lang === 'en' ? 'text-gold-deep font-bold' : 'text-text-muted'}>EN</span>
              <span className="text-border-medium">|</span>
              <span className={lang === 'ar' ? 'text-gold-deep font-bold' : 'text-text-muted'}>ع</span>
            </div>
          </button>

          {/* User Area */}
          {isAuthed ? (
            <div className="flex items-center gap-3 relative">
              <button className="w-10 h-10 rounded-md hover:bg-gold-subtle flex items-center justify-center text-text-secondary relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full animate-pulse" />
              </button>
              
              <div className="relative">
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 bg-tertiary border border-border-default rounded-lg p-1 pr-2 hover:border-border-gold transition-colors">
                  <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center text-white font-bold text-sm">
                    {userSession?.name?.charAt(0) || 'م'}
                  </div>
                  <div className="flex flex-col items-start hidden xl:flex">
                    <span className="font-semibold text-[13px] text-text-primary leading-none">{userSession?.name || 'مستخدم'}</span>
                    <span className="font-mono text-[11px] text-gold-deep">W-1029</span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-text-secondary transition-transform ml-1", isProfileOpen && "rotate-180")} />
                </button>

                {isProfileOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-primary/90 backdrop-blur-md border border-border-light rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 bg-gold-light/50 border-b border-border-light">
                      <div className="font-bold text-text-primary">{userSession?.name || 'مستخدم'}</div>
                      <div className="text-xs text-text-muted">{userSession?.email || 'user@example.com'}</div>
                    </div>
                    <div className="p-2 space-y-1">
                      <Link to="/dashboard" className="flex items-center gap-2 p-2 rounded-md hover:bg-tertiary text-sm text-text-primary">
                        <BarChart3 className="w-4 h-4" /> لوحة التحكم
                      </Link>
                      <Link to="/dashboard" className="flex items-center gap-2 p-2 rounded-md hover:bg-tertiary text-sm text-text-primary">
                        <User className="w-4 h-4" /> ملفي الشخصي
                      </Link>
                    </div>
                    <div className="p-2 border-t border-border-light">
                      <button onClick={() => { clearClientSession(); navigate({to: '/'}); }} className="flex items-center gap-2 p-2 rounded-md hover:bg-error-light text-sm text-error w-full text-start">
                        <LogOut className="w-4 h-4" /> تسجيل الخروج
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link to="/login">
              <Button className="gap-2">
                <LogIn className="w-4 h-4" />
                {t('دخول العملاء', 'Client Login')}
              </Button>
            </Link>
          )}

        </div>

        {/* Mobile Menu Button */}
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden w-10 h-10 rounded-md bg-tertiary flex items-center justify-center text-text-primary">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed top-20 left-0 right-0 bg-primary/95 backdrop-blur-[20px] border-b border-border-gold max-h-[calc(100vh-5rem)] overflow-y-auto animate-in fade-in slide-in-from-top-4 shadow-xl z-40">
          <div className="p-4 space-y-4">
            
            {isAuthed && (
              <div className="p-4 bg-gold-light rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center text-white font-bold">
                  {userSession?.name?.charAt(0) || 'م'}
                </div>
                <div>
                  <div className="font-bold text-text-primary">{userSession?.name || 'مستخدم'}</div>
                  <div className="font-mono text-xs text-gold-deep">W-1029</div>
                </div>
              </div>
            )}

            <div className="flex flex-col">
              {navLinks.map((link) => (
                <div key={link.path}>
                  <Link to={link.path} className={cn(
                    "block px-4 py-3 font-semibold text-[16px] rounded-md transition-colors",
                    currentPath === link.path ? "bg-gold-light text-gold-deep border-r-4 border-gold-primary" : "text-text-primary hover:bg-tertiary"
                  )}>
                    {t(link.nameAr, link.nameEn)}
                  </Link>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border-light flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="w-10 h-10 rounded-md border border-border-default flex items-center justify-center">
                  <span className="font-bold text-[14px] text-text-secondary">{lang === 'ar' ? 'EN' : 'ع'}</span>
                </button>
                <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-10 h-10 rounded-md border border-border-default flex items-center justify-center">
                  {theme === 'dark' ? <Sun className="w-5 h-5 text-gold-primary" /> : <Moon className="w-5 h-5 text-text-secondary" />}
                </button>
              </div>
              
              {!isAuthed ? (
                <Link to="/login" className="flex-1">
                  <Button className="w-full gap-2"><LogIn className="w-4 h-4"/> {t('دخول العملاء', 'Client Login')}</Button>
                </Link>
              ) : (
                <Link to="/dashboard" className="flex-1">
                  <Button className="w-full gap-2"><BarChart3 className="w-4 h-4"/> لوحة التحكم</Button>
                </Link>
              )}
            </div>

          </div>
        </div>
      )}

    </header>
  );
}
