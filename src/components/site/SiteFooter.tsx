import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useLang } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';
import {
  Megaphone, X, Mail, CheckCircle2, Shield, Award, MapPin, Phone, Clock, Globe,
  Calendar, MessageSquare, Camera, Video, Share2
} from 'lucide-react';

export function SiteFooter() {
  const { lang, t } = useLang();
  const [isAnnouncementVisible, setAnnouncementVisible] = useState(() => {
    return !sessionStorage.getItem('tharwah_announcement_closed');
  });
  const [newsletterState, setNewsletterState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [email, setEmail] = useState('');
  const [isPrivacyModalOpen, setPrivacyModalOpen] = useState(false);

  const handleCloseAnnouncement = () => {
    setAnnouncementVisible(false);
    sessionStorage.setItem('tharwah_announcement_closed', 'true');
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setNewsletterState('error'); return; }
    setNewsletterState('loading');
    setTimeout(() => {
      setNewsletterState('success');
      setEmail('');
    }, 1500);
  };

  return (
    <footer className="w-full relative mt-auto">
      {/* 1. Announcement Bar */}
      {isAnnouncementVisible && (
        <div className="gradient-gold text-white py-3 px-5 flex items-center justify-center relative animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            <span className="font-semibold text-sm">
              {t('إعلان عاجل: افتتحنا فرعنا الجديد في الرياض!', 'Announcement: We opened our new branch in Riyadh!')}
            </span>
            <a href="#" className="font-bold text-sm underline hover:opacity-80 transition-opacity ml-2 mr-2">
              {t('اعرف المزيد ←', 'Learn More →')}
            </a>
          </div>
          <button onClick={handleCloseAnnouncement} className="absolute left-4 opacity-80 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Main CTA Section */}
      <div className="gradient-gold py-16 px-4 md:px-8 relative overflow-hidden flex flex-col items-center justify-center text-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <span className="font-black text-[11px] text-white/85 tracking-[0.3em] uppercase mb-4">
          {t('ابدأ اليوم', 'GET STARTED')}
        </span>
        <h2 className="font-black text-4xl md:text-5xl text-white mb-6">
          {t('استثمارك يستحق أفضل رعاية', 'Your Investments Deserve the Best Care')}
        </h2>
        <p className="font-normal text-lg text-white/85 max-w-2xl mb-8">
          {t('احجز استشارتك المجانية مع أحد خبرائنا الماليين المعتمدين واكتشف كيف يمكننا مضاعفة ثروتك بأمان واحترافية', 'Book your free consultation with one of our certified financial experts and discover how we can grow your wealth safely and professionally')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link to="/contact">
            <Button className="bg-white text-gold-deep shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:-translate-y-[3px] gap-2 px-8">
              <Mail className="w-4 h-4" /> {t('احجز استشارة مجانية', 'Book Free Consultation')}
            </Button>
          </Link>
          <a href="https://wa.me/97141234567" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 border-2 border-white/50 text-white font-bold px-8 py-3.5 rounded-md hover:bg-white/10 transition-colors">
            <WhatsappIcon className="w-5 h-5 text-white fill-current shrink-0" />
            {t('تواصل عبر واتساب', 'Chat on WhatsApp')}
          </a>
        </div>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-white/80 text-[13px]">
          {[
            t('استشارة مجانية بلا التزام', 'Free Consultation'),
            t('فريق معتمد دولياً', 'Internationally Certified Team'),
            t('أصول مُدارة تتجاوز $2 مليار', 'AUM exceeding $2B'),
            t('رد خلال 24 ساعة', 'Reply within 24h')
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Main Info Grid */}
      <div className="bg-secondary py-20 border-t border-border-gold px-4 md:px-8">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Col 1 */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 gradient-gold rounded-md flex items-center justify-center shadow-gold-sm">
                <span className="font-sans font-black text-white text-xl">ر</span>
              </div>
              <div className="flex flex-col">
                <span className="font-sans font-bold text-text-primary leading-tight">ثروة كابيتال</span>
                <span className="font-en font-medium text-gold-deep text-[10px] tracking-[0.15em]">THARWAH CAPITAL</span>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
              {t('ثروة كابيتال شركة استثمارية رائدة متخصصة في إدارة الثروات وتنويع المحافظ الاستثمارية...', 'Tharwah Capital is a leading investment firm specializing in wealth management...')}
            </p>
            <div className="flex gap-2 mb-6">
              <div className="bg-gold-subtle border border-border-gold rounded-sm flex items-center gap-1 px-2 py-1">
                <Shield className="w-3 h-3 text-gold-deep" /> <span className="text-[11px] font-bold text-gold-deep">{t('مرخص رسمياً', 'Officially Licensed')}</span>
              </div>
              <div className="bg-gold-subtle border border-border-gold rounded-sm flex items-center gap-1 px-2 py-1">
                <Award className="w-3 h-3 text-gold-deep" /> <span className="text-[11px] font-bold text-gold-deep">ISO 27001</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-md bg-tertiary border border-border-default hover:border-border-gold hover:text-gold-deep hover:-translate-y-1 transition-all flex items-center justify-center text-text-secondary"><Share2 className="w-4 h-4" /></button>
              <button className="w-10 h-10 rounded-md bg-tertiary border border-border-default hover:border-border-gold hover:text-gold-deep hover:-translate-y-1 transition-all flex items-center justify-center text-text-secondary"><MessageSquare className="w-4 h-4" /></button>
              <button className="w-10 h-10 rounded-md bg-tertiary border border-border-default hover:border-border-gold hover:text-gold-deep hover:-translate-y-1 transition-all flex items-center justify-center text-text-secondary"><Camera className="w-4 h-4" /></button>
              <button className="w-10 h-10 rounded-md bg-tertiary border border-border-default hover:border-border-gold hover:text-gold-deep hover:-translate-y-1 transition-all flex items-center justify-center text-text-secondary"><Video className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-black text-[11px] text-gold-deep tracking-[0.2em] uppercase mb-4 pb-3 border-b border-border-gold/30">{t('الشركة', 'COMPANY')}</h4>
            <div className="flex flex-col space-y-2">
              <Link to="/about" className="text-sm text-text-secondary hover:text-gold-deep transition-all hover:translate-x-1">{t('من نحن', 'About Us')}</Link>
              <Link to="/services" className="text-sm text-text-secondary hover:text-gold-deep transition-all hover:translate-x-1">{t('خدماتنا', 'Our Services')}</Link>
              <Link to="/markets" className="text-sm text-text-secondary hover:text-gold-deep transition-all hover:translate-x-1">{t('الأسواق', 'Markets')}</Link>
              <Link to="/faq" className="text-sm text-text-secondary hover:text-gold-deep transition-all hover:translate-x-1">{t('الأسئلة الشائعة', 'FAQ')}</Link>
              <Link to="/contact" className="text-sm text-text-secondary hover:text-gold-deep transition-all hover:translate-x-1">{t('تواصل معنا', 'Contact Us')}</Link>
            </div>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-black text-[11px] text-gold-deep tracking-[0.2em] uppercase mb-4 pb-3 border-b border-border-gold/30">{t('خدماتنا', 'OUR SERVICES')}</h4>
            <div className="flex flex-col space-y-2">
              <Link to="/services" className="text-sm text-text-secondary hover:text-gold-deep transition-all hover:translate-x-1">{t('الأسهم الخليجية', 'Gulf Equities')}</Link>
              <Link to="/services" className="text-sm text-text-secondary hover:text-gold-deep transition-all hover:translate-x-1">{t('الأسهم العالمية', 'Global Equities')}</Link>
              <Link to="/services" className="text-sm text-text-secondary hover:text-gold-deep transition-all hover:translate-x-1">{t('صناديق الاستثمار', 'Investment Funds')}</Link>
            </div>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="font-black text-[11px] text-gold-deep tracking-[0.2em] uppercase mb-4 pb-3 border-b border-border-gold/30">{t('تواصل معنا', 'GET IN TOUCH')}</h4>
            <div className="space-y-4">
              <div className="flex gap-3">
                <MapPin className="w-4 h-4 text-gold-primary mt-1" />
                <div>
                  <div className="text-[11px] font-bold text-text-muted mb-1">{t('العنوان', 'Address')}</div>
                  <div className="text-[13px] text-text-secondary leading-relaxed">{t('برج المركز المالي، دبي', 'DIFC, Dubai')}</div>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="w-4 h-4 text-gold-primary mt-1" />
                <div>
                  <div className="text-[11px] font-bold text-text-muted mb-1">{t('هاتف', 'Phone')}</div>
                  <div className="text-[14px] text-text-primary font-mono">+971 4 123 4567</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Newsletter Bar */}
      <div className="bg-tertiary border-y border-border-gold/30 py-12 px-4 md:px-8">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gold-subtle flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-gold-deep" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-text-primary mb-2">{t('اشترك في نشرتنا الأسبوعية', 'Subscribe to Our Weekly Newsletter')}</h3>
              <p className="text-sm text-text-secondary">{t('تحليلات مالية معمّقة وأخبار الأسواق', 'In-depth financial analysis and market news')}</p>
            </div>
          </div>
          <div>
            {newsletterState === 'success' ? (
              <div className="flex items-center gap-2 p-4 bg-success-light text-success-text rounded-md animate-in fade-in">
                <CheckCircle2 className="w-5 h-5" /> {t('تم الاشتراك بنجاح!', 'Successfully subscribed!')}
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="w-full">
                <div className="flex w-full">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('أدخل بريدك الإلكتروني', 'Enter your email')}
                    className="flex-1 px-4 py-3 bg-primary border border-border-default rounded-r-md focus:outline-none focus:border-gold-primary text-sm rtl:rounded-r-md ltr:rounded-l-md rtl:rounded-l-none ltr:rounded-r-none"
                    disabled={newsletterState === 'loading'}
                  />
                  <Button type="submit" isLoading={newsletterState === 'loading'} className="rtl:rounded-r-none ltr:rounded-l-none px-6">
                    {t('اشتراك', 'Subscribe')}
                  </Button>
                </div>
                {newsletterState === 'error' && <p className="text-error-text text-xs mt-2">Error</p>}
                <div className="flex items-center gap-1 mt-2 text-text-muted text-xs">
                  <Shield className="w-3 h-3" /> {t('لن نرسل spam أبداً', 'We never send spam')}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* 5. Copyright Bar */}
      <div className="bg-primary border-t border-border-light py-5 px-4 md:px-8">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[13px] text-text-muted">
            {t(`© ${new Date().getFullYear()} ثروة كابيتال. جميع الحقوق محفوظة`, `© ${new Date().getFullYear()} Tharwah Capital. All Rights Reserved`)}
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-tertiary border border-border-light rounded-sm px-2 py-1 text-xs text-text-muted hover:text-text-primary">Visa</div>
            <div className="bg-tertiary border border-border-light rounded-sm px-2 py-1 text-xs text-text-muted hover:text-text-primary">MC</div>
            <div className="bg-tertiary border border-border-light rounded-sm px-2 py-1 text-xs text-text-muted hover:text-text-primary">ApplePay</div>
          </div>
          <div className="flex items-center gap-4 text-[13px] text-text-muted">
            <button onClick={() => setPrivacyModalOpen(true)} className="hover:text-gold-deep">{t('سياسة الخصوصية', 'Privacy Policy')}</button>
            <span className="text-border-light">|</span>
            <a href="#" className="hover:text-gold-deep">{t('الشروط والأحكام', 'Terms')}</a>
          </div>
        </div>
      </div>

      {/* Privacy Modal */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPrivacyModalOpen(false)} />
          <div className="relative bg-primary w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 max-h-[85vh]">
            <div className="p-5 border-b border-border-light flex items-center justify-between bg-secondary rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md gradient-gold flex items-center justify-center text-white"><Shield className="w-4 h-4"/></div>
                <h3 className="font-bold text-lg text-text-primary">{t('سياسة الخصوصية', 'Privacy Policy')}</h3>
              </div>
              <button onClick={() => setPrivacyModalOpen(false)} className="w-8 h-8 rounded-full bg-tertiary hover:bg-error-light hover:text-error flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="flex flex-col items-center justify-center text-center py-12 text-text-muted">
                <Shield className="w-16 h-16 mb-4 opacity-50" />
                <p>{t('سيتم إضافة سياسة الخصوصية قريباً', 'Privacy policy will be added soon')}</p>
              </div>
            </div>
            <div className="p-4 border-t border-border-light flex items-center justify-between">
              <Button onClick={() => setPrivacyModalOpen(false)} size="sm">{t('إغلاق', 'Close')}</Button>
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Calendar className="w-3 h-3" /> {t('آخر تحديث: يناير 2024', 'Last updated: Jan 2024')}
              </div>
            </div>
          </div>
        </div>
      )}

    </footer>
  );
}
