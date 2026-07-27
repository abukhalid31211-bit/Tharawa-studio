// ─────────────────────────────────────────────────────────────
// 4.10 (Main-Pages) — Content إدارة محتوى الموقع (مركز التحكم)
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Layout, Ticket, TrendingUp, HelpCircle, Star, Info, Palette, ShieldCheck, Newspaper, FileText } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCmsServices, useCmsMarkets, useCmsFaq, useCmsTestimonials, useCmsPrivacy, useCmsAbout } from '@/lib/adminData';
import { usePlatformDataState } from '@/lib/platformState';
import { PageHeader, Panel, Pill } from '@/components/admin/ui';

export function Content() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [services] = useCmsServices();
  const [markets] = useCmsMarkets();
  const [faq] = useCmsFaq();
  const [testimonials] = useCmsTestimonials();
  const [privacy] = useCmsPrivacy();
  const [about] = useCmsAbout();
  const [newsCms] = usePlatformDataState<{ articles?: any[] }>('tharwah_cms_news_v2', { articles: [] });

  const sections = [
    { to: '/Akadmin/hero', icon: Layout, color: '#0EA5E9', ar: 'قسم البطل', en: 'Hero Section', descAr: 'عنوان الصفحة الرئيسية وأزرار الإجراء والإحصائيات', descEn: 'Homepage headline, CTAs & stats', count: t('4 إحصائيات', '4 stats') },
    { to: '/Akadmin/services_mgr', icon: Ticket, color: '#3B82F6', ar: 'الخدمات الاستثمارية', en: 'Services', descAr: 'خدمات المنصة الست الظاهرة في الموقع', descEn: 'The six platform services on the site', count: `${services.filter(s => s.active).length} ${t('نشطة', 'active')}` },
    { to: '/Akadmin/markets_mgr', icon: TrendingUp, color: '#00D97E', ar: 'الأسواق والمؤشرات', en: 'Markets', descAr: 'أسعار الأصول المعروضة في شريط الأسواق', descEn: 'Asset prices in the markets ticker', count: `${markets.filter(m => m.visible).length} ${t('ظاهرة', 'visible')}` },
    { to: '/Akadmin/faq_mgr', icon: HelpCircle, color: '#F59E0B', ar: 'الأسئلة الشائعة', en: 'FAQs', descAr: 'بنك الأسئلة والأجوبة لمساعدة الزوار', descEn: 'Q&A bank helping visitors', count: `${faq.filter(f => f.published).length} ${t('منشور', 'published')}` },
    { to: '/Akadmin/testimonials', icon: Star, color: '#C9A84C', ar: 'شهادات العملاء', en: 'Testimonials', descAr: 'آراء المستثمرين واعتماد النشر', descEn: 'Investor reviews & publishing approval', count: `${testimonials.filter(x => x.status === 'pending').length} ${t('معلق', 'pending')}` },
    { to: '/Akadmin/about_mgr', icon: Info, color: '#8B5CF6', ar: 'صفحة من نحن', en: 'About Page', descAr: 'الرسالة والرؤية والقيم المؤسسية', descEn: 'Mission, vision & corporate values', count: `${about.values.length} ${t('قيم', 'values')}` },
    { to: '/Akadmin/site_design', icon: Palette, color: '#EC4899', ar: 'التصميم والتنقل', en: 'Design & Navigation', descAr: 'الألوان والشعار وعناصر الواجهة', descEn: 'Colors, logo & UI elements', count: t('هوية ذهبية', 'Gold identity') },
    { to: '/Akadmin/privacy_policy', icon: ShieldCheck, color: '#B8912F', ar: 'سياسة الخصوصية', en: 'Privacy Policy', descAr: 'بنود حماية البيانات والأحكام القانونية', descEn: 'Data protection clauses & legal terms', count: `${privacy.sections.length} ${t('بنود', 'clauses')}` },
    { to: '/Akadmin/news_mgr', icon: Newspaper, color: '#0EA5E9', ar: 'الأخبار والمقالات', en: 'News & Articles', descAr: 'إدارة المقالات التحليلية والأخبار الاستثمارية', descEn: 'Analytical articles & investment news', count: `${(newsCms?.articles || []).length} ${t('مقالات', 'articles')}` },
  ];

  const pendingTestimonials = testimonials.filter(x => x.status === 'pending').length;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('إدارة محتوى الموقع', 'Website Content Management')}
        subtitle={t('تحكم موحّد في كل أقسام الموقع العام — كل تغيير ينعكس فورياً على المنصة', 'Unified control over all public site sections — every change reflects instantly')}
        actions={
          pendingTestimonials > 0 ? (
            <Pill color="#FF4560" dot text={t(`${pendingTestimonials} شهادات بانتظار الاعتماد`, `${pendingTestimonials} testimonials pending approval`)} />
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {sections.map((s, i) => (
          <button
            key={i}
            onClick={() => navigate({ to: s.to as any })}
            className="text-start"
          >
            <Panel className="h-full flex flex-col gap-3 hover:border-[#0EA5E9]/30 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}12` }}>
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <Pill text={s.count} color={s.color} />
              </div>
              <div>
                <h3 className="font-black text-sm text-text-primary">{lang === 'ar' ? s.ar : s.en}</h3>
                <p className="text-[11px] text-text-muted mt-1 leading-relaxed">{lang === 'ar' ? s.descAr : s.descEn}</p>
              </div>
              <span className="text-[11px] font-semibold mt-auto" style={{ color: s.color }}>
                {t('فتح المدير ←', 'Open manager →')}
              </span>
            </Panel>
          </button>
        ))}
      </div>

      <Panel className="flex items-center gap-3" >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(14,165,233,0.1)' }}>
          <FileText className="w-4 h-4" style={{ color: '#0EA5E9' }} />
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          {t(
            'نصيحة: التعديلات على المحتوى تُحفظ فور الضغط على "حفظ" وتظهر مباشرة في الموقع العام. استخدم صفحات كل قسم للوصول للنماذج الكاملة باللغتين العربية والإنجليزية.',
            'Tip: content edits are stored the moment you press "Save" and appear instantly on the public site. Use each section page for full bilingual forms.'
          )}
        </p>
      </Panel>
    </div>
  );
}
