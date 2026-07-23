import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routeTree } from './routeTree.gen';
import './styles/globals.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { SiteSettingsProvider } from './contexts/SiteSettingsContext';
import { SocketProvider } from './contexts/SocketContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { env, logEnvStatus, validateEnv } from './lib/env';
import { logger } from './lib/logger';

// Validate environment on startup
const envValidation = validateEnv();
if (!envValidation.isValid && env.isProduction) {
  console.error('[Fatal] Missing required environment variables:', envValidation.missing);
}

if (env.isDevelopment) {
  logEnvStatus();
}

// Configure QueryClient with production defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

const router = createRouter({ 
  routeTree, 
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Global error handler
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', event.reason);
  // Prevent default browser error overlay in production
  if (env.isProduction) {
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  logger.error('Global error', event.error, {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
  });
});

// Performance monitoring
if (env.isProduction && 'performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (perfData) {
        logger.info('Page load performance', {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
          totalTime: perfData.loadEventEnd - perfData.fetchStart,
        });
      }
    }, 0);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <SiteSettingsProvider>
            <SocketProvider>
              <RouterProvider router={router} />
            </SocketProvider>
          </SiteSettingsProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
