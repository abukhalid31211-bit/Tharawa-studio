import { createRootRouteWithContext, Outlet, ScrollRestoration } from '@tanstack/react-router';
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
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollRestoration />
      <AnnouncementBar />
      <SiteHeader />
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
      <SiteFooter />
      <BackToTop />
      <WhatsappButton />
      <CookieBanner />
    </div>
  );
}
