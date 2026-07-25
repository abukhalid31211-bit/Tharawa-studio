import { createFileRoute } from '@tanstack/react-router';
import { useLang } from '@/contexts/LanguageContext';
import { ArrowLeft, Clock, Calendar, User } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { usePublicNewsArticles } from '@/lib/publicContent';

export const Route = createFileRoute('/article/$slug')({
  component: ArticleDetailsPage,
});

function ArticleDetailsPage() {
  const { t, lang } = useLang();
  const { slug } = Route.useParams();
  const { articles } = usePublicNewsArticles();

  const article = articles.find((item) => item.slug === slug) || articles[0];

  if (!article) {
    return (
      <div className="w-full min-h-screen bg-primary dark:bg-[#0D0D1A] flex items-center justify-center px-4">
        <div className="text-center text-text-muted">
          <div className="text-5xl mb-4">📰</div>
          <p>{t('المقال غير متاح حالياً', 'The article is not available right now')}</p>
        </div>
      </div>
    );
  }

  const body = lang === 'ar' ? article.bodyAr : article.bodyEn;

  return (
    <div className="w-full min-h-screen bg-primary dark:bg-[#0D0D1A]">
      <section className="pt-28 pb-10 bg-gradient-to-b from-[#FFFBF0] to-white dark:from-[#13132A] dark:to-[#0D0D1A]">
        <div className="max-w-[860px] mx-auto px-4 md:px-8">
          <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
            <Link to="/" className="hover:text-gold-deep">{t('الرئيسية', 'Home')}</Link>
            <ArrowLeft className="w-3 h-3" />
            <Link to="/news" className="hover:text-gold-deep">{t('الأخبار', 'News')}</Link>
            <ArrowLeft className="w-3 h-3" />
            <span className="text-gold-deep font-semibold">{lang === 'ar' ? article.categoryAr : article.categoryEn}</span>
          </div>
          <h1 className="font-black text-3xl md:text-5xl text-text-primary mb-6 leading-tight">{lang === 'ar' ? article.title : article.titleEn}</h1>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <span className="flex items-center gap-2"><User className="w-4 h-4" /> {lang === 'ar' ? article.author : article.authorEn}</span>
            <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {lang === 'ar' ? article.date : article.dateEn}</span>
            <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {lang === 'ar' ? article.readTime : article.readTimeEn}</span>
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
