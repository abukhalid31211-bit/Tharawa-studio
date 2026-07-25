import { createRootRouteWithContext, Outlet, ScrollRestoration, useRouterState } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import React from 'react';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { AnnouncementBar } from '@/components/site/AnnouncementBar';
import { BackToTop } from '@/components/site/BackToTop';
import { WhatsappButton } from '@/components/site/WhatsappButton';
import { CookieBanner } from '@/components/site/CookieBanner';
import { usePublicSiteSettings } from '@/lib/publicSite';

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { data: publicSettings } = usePublicSiteSettings();
  const isAppArea = pathname === '/dashboard' || pathname.startsWith('/Akadmin');
  const isAuthArea = pathname === '/login' || pathname === '/forgot-password';

  // The dashboard and admin panel have their own full-screen shells. Rendering
  // the public header/footer around them makes two separate layouts occupy the
  // same viewport, which is the source of the overlapping "screens" effect.
  if (isAppArea) {
    return (
      <>
        <ScrollRestoration />
        <Outlet />
      </>
    );
  }

  if (publicSettings.maintenance_mode && !isAuthArea) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary px-4 text-center">
        <ScrollRestoration />
        <div className="max-w-xl rounded-2xl border border-border-gold/30 bg-secondary p-10 shadow-xl">
          <div className="text-5xl mb-4">🚧</div>
          <h1 className="text-2xl font-black text-text-primary mb-3">الموقع في وضع الصيانة</h1>
          <p className="text-text-secondary leading-relaxed mb-6">
            نعمل حالياً على تحديث المنصة. يمكنك التواصل مع فريق الدعم عبر {publicSettings.support_email || 'قنوات الدعم الرسمية'} أو الهاتف {publicSettings.support_phone || 'المسجل في الإدارة'}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollRestoration />
      <AnnouncementBar />
      {/* Sticky keeps the header in the document flow, so it cannot cover the
          announcement bar or the first section of the page. */}
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <BackToTop />
      <WhatsappButton />
      <CookieBanner />
    </div>
  );
}
