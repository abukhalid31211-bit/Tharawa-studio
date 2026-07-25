import type { ElementType } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useLang } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Users, Download, Shield, Award, Globe, ShieldCheck, Briefcase, Calendar, Phone } from 'lucide-react';
import { CtaSection } from '@/components/home/CtaSection'; // Reusing CTA
import { useCmsSection } from '@/lib/cms';
import { usePublicStats } from '@/lib/queries';

export const Route = createFileRoute('/about')({ component: AboutPage });

function AboutPage() {
  const { t, lang } = useLang();
  const { data: managedAbout } = useCmsSection<any>('about', {});
  const { data: publicStatsData } = usePublicStats();
  const publicStats = (publicStatsData as any)?.data;

  const fallbackValues = [
    { icon: Shield, titleAr: 'الثقة والشفافية الكاملة', titleEn: 'Trust & Full Transparency', descAr: 'نُقدم تقارير شهرية مفصلة تُوضح كل معاملة وكل قرار استثماري. شفافية كاملة في كل خطوة', descEn: 'We provide detailed monthly reports clarifying every transaction. Complete transparency at every step' },
    { icon: Award, titleAr: 'التميز المهني الدائم', titleEn: 'Perpetual Professional Excellence', descAr: 'فريقنا يضم حاملي شهادات CFA وCFP وFRM من أفضل مؤسسات العالم', descEn: 'Our team includes CFA, CFP, and FRM holders from top global institutions' },
    { icon: Users, titleAr: 'خدمة شخصية لكل عميل', titleEn: 'Personalized Service', descAr: 'نرفض النماذج الجاهزة — كل خطة استثمارية نصممها مخصصة بالكامل لشخص واحد: أنت', descEn: 'Every investment plan we design is fully customized for one person: you' },
    { icon: Globe, titleAr: 'وصول عالمي بفهم محلي', titleEn: 'Global Access, Local Understanding', descAr: 'شراكات استراتيجية مع أبرز البنوك والمؤسسات المالية في أكثر من 30 دولة', descEn: 'Strategic partnerships with leading banks in more than 30 countries' }
  ];
  const values = managedAbout.values?.length ? managedAbout.values.map((value: any) => ({
    icon: Shield, titleAr: value.title, titleEn: value.titleEn, descAr: value.desc, descEn: value.descEn,
  })) : (import.meta.env.DEV ? fallbackValues : []);

  const team = Array.isArray(managedAbout.team)
    ? managedAbout.team
    : (import.meta.env.DEV ? [
        { avatar: 'خ', nameAr: 'م. خالد الحربي', nameEn: 'Khalid Al-Harbi', roleAr: 'الرئيس التنفيذي', roleEn: 'CEO & Co-Founder', descAr: '25 عاماً من الخبرة في الأسواق المالية الخليجية والعالمية. حاصل على CFA وماجستير إدارة الأعمال.', descEn: '25 years experience in Gulf and global markets. CFA holder and MBA.' },
        { avatar: 'س', nameAr: 'د. سارة المطيري', nameEn: 'Dr. Sara Al-Mutairi', roleAr: 'مديرة الاستثمار والمحافظ', roleEn: 'Director of Investment', descAr: 'دكتوراه في الاقتصاد المالي من MIT، متخصصة في الأسواق الناشئة وتحليل المخاطر.', descEn: 'PhD in Financial Economics from MIT, specializing in emerging markets and risk analysis.' },
        { avatar: 'ف', nameAr: 'م. فيصل العمري', nameEn: 'Faisal Al-Omari', roleAr: 'رئيس قسم البحث والتحليل', roleEn: 'Head of Research', descAr: 'محلل مالي CFA معتمد بخبرة 18 عاماً في أسواق وول ستريت وبورصات الخليج.', descEn: 'Certified CFA financial analyst with 18 years experience in Wall Street and Gulf exchanges.' }
      ] : []);

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative w-full bg-primary dark:bg-elevated pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-primary),var(--color-secondary))] dark:bg-[linear-gradient(to_bottom,#0D0D1A,#13132A)] opacity-80" />
        <div className="max-w-[1280px] mx-auto px-4 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="font-black text-[11px] text-gold-deep tracking-[0.2em] uppercase mb-4 block">
              {t('قصتنا', 'OUR STORY')}
            </span>
            <h1 className="font-black text-4xl md:text-5xl text-text-primary mb-6">
              {t('خمسة عشر عاماً من الثقة والنتائج', 'Fifteen Years of Trust and Results')}
            </h1>
            <p className="text-lg text-text-secondary mb-6 leading-relaxed">
              {lang === 'ar' ? (managedAbout.story || t('بدأت ثروة كابيتال عام 2010 برؤية واضحة: جعل عالم الاستثمار المؤسسي متاحاً للمستثمر العربي الفرد بنفس المستوى من الاحترافية والشفافية التي تحظى بها المؤسسات الكبرى', '')) : (managedAbout.storyEn || t('', 'Tharwah Capital began in 2010 with a clear vision: making institutional investment accessible to individual Arab investors with high professionalism.'))}
            </p>
            <p className="text-lg text-text-secondary mb-8 leading-relaxed">
              {t('اليوم نُدير أكثر من $2 مليار من أصول عملائنا في 15 سوقاً مالياً عالمياً، مع فريق يضم أكثر من 50 خبيراً.', 'Today we manage over $2 billion in client assets across 15 global markets, with a team of over 50 experts.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="gap-2 px-8" onClick={() => document.getElementById('team')?.scrollIntoView({ behavior: 'smooth' })}>
                <Users className="w-4 h-4" /> {t('تعرف على فريقنا', 'Meet Our Team')}
              </Button>
              <Button variant="secondary" className="gap-2 px-8 bg-primary">
                <Download className="w-4 h-4" /> {t('تحميل ملف الشركة', 'Download Profile')}
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <Card className="grid grid-cols-2 gap-6 bg-primary dark:bg-elevated border-border-gold/30 shadow-gold-sm">
              <div className="text-center p-4 border-b border-border-light rtl:border-l ltr:border-r">
                <div className="text-3xl mb-2">👥</div>
                <div className="font-mono font-black text-2xl md:text-3xl text-gold-deep mb-1">{publicStats?.activeClients ? `+${publicStats.activeClients.toLocaleString()}` : '—'}</div>
                <div className="text-xs text-text-muted">{t('مستثمر نشط', 'Active Investors')}</div>
              </div>
              <div className="text-center p-4 border-b border-border-light">
                <div className="text-3xl mb-2">🌍</div>
                <div className="font-mono font-black text-2xl md:text-3xl text-gold-deep mb-1">{publicStats?.visibleMarkets ? `${publicStats.visibleMarkets}+` : '—'}</div>
                <div className="text-xs text-text-muted">{t('سوق ظاهر', 'Visible Markets')}</div>
              </div>
              <div className="text-center p-4 rtl:border-l ltr:border-r border-border-light">
                <div className="text-3xl mb-2">💼</div>
                <div className="font-mono font-black text-2xl md:text-3xl text-gold-deep mb-1">{typeof publicStats?.totalAum === 'number' ? `+${(publicStats.totalAum / 1_000_000_000).toFixed(1)}B` : '—'}</div>
                <div className="text-xs text-text-muted">{t('أصول مُدارة', 'Assets Under Management')}</div>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">📁</div>
                <div className="font-mono font-black text-2xl md:text-3xl text-gold-deep mb-1">{publicStats?.activePortfolios ? `+${publicStats.activePortfolios.toLocaleString()}` : '—'}</div>
                <div className="text-xs text-text-muted">{t('محفظة نشطة', 'Active Portfolios')}</div>
              </div>
            </Card>
            <div className="mt-4 bg-gold-subtle border border-border-gold rounded-lg py-3 px-4 flex justify-center items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gold-deep" />
              <span className="font-semibold text-xs text-gold-deep">{t('مرخصون ومنظمون من هيئة الأوراق المالية — دبي', 'Licensed & Regulated by Securities Authority — Dubai')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-secondary dark:bg-[#13132A] border-y border-border-gold/20">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="text-center mb-16">
            <span className="font-black text-[11px] text-gold-deep tracking-[0.2em] uppercase mb-4 block">
              {t('ما نؤمن به', 'WHAT WE BELIEVE IN')}
            </span>
            <h2 className="font-black text-3xl md:text-4xl text-text-primary mb-6">
              {t('قيمنا التي لا نساوم عليها', 'Our Non-Negotiable Values')}
            </h2>
            <p className="text-lg text-text-secondary max-w-[620px] mx-auto">
              {t('هذه القيم ليست مجرد كلمات على ورق — هي الأساس الذي بنينا عليه كل قرار وكل علاقة لعملائنا.', 'These values are the foundation upon which we built every decision and relationship for our clients.')}
            </p>
          </div>

          {values.length === 0 ? (
            <Card className="p-8 text-center text-text-muted">
              {t('سيتم نشر قيم الشركة من لوحة الإدارة قريباً', 'Company values will be published from the admin panel soon')}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              {values.map((v: { icon: ElementType; titleAr: string; titleEn: string; descAr: string; descEn: string }, i: number) => (
                <Card key={i} variant="interactive" className="p-8 flex flex-col items-center hover:-translate-y-1">
                  <div className="w-16 h-16 rounded-xl bg-gold-subtle border border-border-gold flex items-center justify-center mb-6">
                    <v.icon className="w-7 h-7 text-gold-deep" />
                  </div>
                  <h3 className="font-bold text-lg text-text-primary mb-3">{lang === 'ar' ? v.titleAr : v.titleEn}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{lang === 'ar' ? v.descAr : v.descEn}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-24 bg-primary dark:bg-elevated relative">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="text-center mb-16">
            <span className="font-black text-[11px] text-gold-deep tracking-[0.2em] uppercase mb-4 block">
              {t('العقول خلف النجاح', 'THE MINDS BEHIND THE SUCCESS')}
            </span>
            <h2 className="font-black text-3xl md:text-4xl text-text-primary mb-6">
              {t('فريق قيادي من الأفضل عالمياً', 'A Leadership Team Among the Global Best')}
            </h2>
          </div>

          {team.length === 0 ? (
            <Card className="p-8 text-center text-text-muted">
              {t('سيتم نشر أعضاء الفريق من لوحة الإدارة قريباً', 'Team members will be published from the admin panel soon')}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {team.map((m: any, i: number) => (
                <Card key={i} variant="interactive" className="p-8 text-center hover:-translate-y-1">
                  <div className="w-20 h-20 rounded-full gradient-gold mx-auto flex items-center justify-center text-white font-black text-3xl mb-4 shadow-gold-sm">
                    {lang === 'ar' ? (m.avatar || m.nameAr?.charAt(0) || 'ث') : (m.nameEn?.charAt(0) || 'T')}
                  </div>
                  <h3 className="font-bold text-xl text-text-primary mb-1">{lang === 'ar' ? m.nameAr : m.nameEn}</h3>
                  <div className="font-semibold text-sm text-gold-deep mb-4">{lang === 'ar' ? m.roleAr : m.roleEn}</div>
                  <p className="text-sm text-text-secondary leading-relaxed">{lang === 'ar' ? m.descAr : m.descEn}</p>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-12 bg-gold-subtle border border-border-gold rounded-xl p-8 max-w-[560px] mx-auto text-center">
            <Briefcase className="w-8 h-8 text-gold-deep mx-auto mb-4" />
            <h3 className="font-bold text-xl text-text-primary mb-2">{t('انضم إلى فريق ثروة كابيتال', 'Join the Tharwah Capital Team')}</h3>
            <p className="text-sm text-text-secondary mb-6">{t('نبحث دائماً عن المواهب المتميزة التي تشاركنا شغف بناء ثروات العملاء', 'We are always looking for exceptional talents who share our passion.')}</p>
            <Button size="sm">{t('عرض فرص العمل', 'View Career Opportunities')}</Button>
          </div>
        </div>
      </section>

      {/* Partners - Quick Banner */}
      <section className="py-16 bg-secondary dark:bg-[#13132A] border-y border-border-gold/20 text-center">
        <h3 className="font-bold text-2xl text-text-primary mb-8">{t('شركاؤنا وشهاداتنا الدولية', 'Our Partners & International Certifications')}</h3>
        <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all">
          <div className="font-mono text-xl font-bold">Goldman Sachs</div>
          <div className="font-mono text-xl font-bold">Bloomberg</div>
          <div className="font-mono text-xl font-bold">MSCI</div>
          <div className="font-mono text-xl font-bold">Refinitiv</div>
        </div>
      </section>

      <CtaSection />
    </div>
  );
}
