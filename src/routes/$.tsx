import { createFileRoute, Link } from '@tanstack/react-router';
import { useLang } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';

// Catch-all splat route: matches any path not handled by a more specific route,
// so unmatched URLs get the site's own branded 404 instead of the router's
// default bare fallback. See AUDIT-REPORT.md §7.5.
export const Route = createFileRoute('/$')({
  component: NotFoundPage,
});

function NotFoundPage() {
  const { t } = useLang();

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4 text-center">
      <div className="max-w-xl rounded-2xl border border-border-gold/30 bg-secondary p-10 shadow-xl">
        <div className="text-6xl font-black text-gold-primary mb-4">404</div>
        <h1 className="text-2xl font-black text-text-primary mb-3">
          {t('الصفحة غير موجودة', 'Page not found')}
        </h1>
        <p className="text-text-secondary leading-relaxed mb-8">
          {t(
            'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.',
            'Sorry, the page you are looking for does not exist or has been moved.'
          )}
        </p>
        <Link to="/">
          <Button variant="primary">
            {t('العودة إلى الصفحة الرئيسية', 'Back to homepage')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
