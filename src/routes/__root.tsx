import { createRootRouteWithContext, Outlet, ScrollRestoration, useRouterState } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import React from 'react';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { AnnouncementBar } from '@/components/site/AnnouncementBar';
import { BackToTop } from '@/components/site/BackToTop';
import { WhatsappButton } from '@/components/site/WhatsappButton';
import { CookieBanner } from '@/components/site/CookieBanner';

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isAppArea = pathname === '/dashboard' || pathname.startsWith('/Akadmin');

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
