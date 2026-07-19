import { createFileRoute } from '@tanstack/react-router';
import { useLang } from '@/contexts/LanguageContext';
import { ArrowLeft, Clock, Calendar, User } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/article/$slug')({
  component: ArticleDetailsPage,
});

function ArticleDetailsPage() {
  const { t, lang } = useLang();
  const { slug } = Route.useParams();

  const articles: Record<string, any> = {
    'bitcoin-records': {
      titleAr: 'بيتكوين يسجل مستويات قياسية جديدة — ماذا يعني للمستثمر العربي؟',
      titleEn: 'Bitcoin Hits New Records — What Does It Mean for Arab Investors?',
      categoryAr: 'العملات الرقمية', categoryEn: 'Crypto',
      date: '18 Jul 2026', readTime: '5 min',
      authorAr: 'م. فيصل العمري', authorEn: 'Faisal Al-Omari',
      bodyAr: [
        'بعد ارتفاع نسبته 45% خلال الربع الأول من 2025، سجّل Bitcoin مستويات قياسية جديدة تجاوزت $70,000.',
        'نحلل الأسباب وراء هذا الارتفاع وما إذا كانت فرصة الدخول لا تزال قائمة للمستثمر العربي.',
        'تُظهر البيانات أن الطلب المؤسسي على العملات الرقمية في المنطقة العربية نما بنسبة 120% خلال العام الماضي.'
      ],
      bodyEn: [
        'After a 45% surge in Q1 2025, Bitcoin recorded new highs exceeding $70,000.',
        'We analyze the reasons behind this rally and whether the entry opportunity still exists for Arab investors.',
        'Data shows institutional demand for cryptocurrencies in the Arab region grew by 120% over the past year.'
      ],
    },
  };

  const art = articles[slug] || articles['bitcoin-records'];
  const body = lang === 'ar' ? art.bodyAr : art.bodyEn;

  return (
    <div className="w-full min-h-screen bg-primary dark:bg-[#0D0D1A]">
      <section className="pt-28 pb-10 bg-gradient-to-b from-[#FFFBF0] to-white dark:from-[#13132A] dark:to-[#0D0D1A]">
        <div className="max-w-[860px] mx-auto px-4 md:px-8">
          <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
            <Link to="/" className="hover:text-gold-deep">{t('الرئيسية', 'Home')}</Link>
            <ArrowLeft className="w-3 h-3" />
            <Link to="/news" className="hover:text-gold-deep">{t('الأخبار', 'News')}</Link>
            <ArrowLeft className="w-3 h-3" />
            <span className="text-gold-deep font-semibold">{lang === 'ar' ? art.categoryAr : art.categoryEn}</span>
          </div>
          <h1 className="font-black text-3xl md:text-5xl text-text-primary mb-6 leading-tight">{lang === 'ar' ? art.titleAr : art.titleEn}</h1>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <span className="flex items-center gap-2"><User className="w-4 h-4" /> {lang === 'ar' ? art.authorAr : art.authorEn}</span>
            <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {art.date}</span>
            <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {art.readTime}</span>
          </div>
        </div>
      </section>
      <article className="max-w-[860px] mx-auto px-4 md:px-8 py-12">
        <div className="prose prose-lg max-w-none text-text-secondary leading-relaxed space-y-6">
          {body.map((paragraph: string, i: number) => (
            <p key={i} className="text-base md:text-lg">{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  );
}
