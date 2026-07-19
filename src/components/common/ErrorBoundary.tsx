/**
 * Tharwah Capital - Error Boundary
 * حدود الأخطاء لالتقاط الأعطال وعرض واجهة احتياطية
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log to console in dev
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    
    // In production, send to Sentry
    // if (import.meta.env.PROD) {
    //   Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    // }

    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC] dark:bg-[#0D0D1A]" dir="rtl">
          <div className="max-w-lg w-full bg-white dark:bg-[#13132A] border border-[#E2E8F0] dark:border-[#2A2A4A] rounded-2xl p-8 shadow-xl text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FEF0EC] dark:bg-[#FF4560]/10 flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-[#FF4560]" />
            </div>
            
            <h1 className="text-xl font-black text-[#1E293B] dark:text-white mb-2">
              حدث خطأ غير متوقع
            </h1>
            <p className="text-sm text-[#64748B] dark:text-[#9090B0] mb-2">
              نأسف للإزعاج. حدث خطأ أثناء تحميل هذه الصفحة.
            </p>
            <p className="text-xs text-[#94A3B8] dark:text-[#5A5A7A] mb-6 font-mono">
              {this.state.error?.message || 'Unknown error'}
            </p>

            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="text-left mb-6 p-3 bg-[#F1F5F9] dark:bg-[#1A1A3A] rounded-lg">
                <summary className="text-xs font-bold text-[#475569] cursor-pointer">تفاصيل الخطأ (DEV)</summary>
                <pre className="mt-2 text-[10px] text-[#64748B] overflow-auto max-h-32 whitespace-pre-wrap">
                  {this.state.error?.stack}
                  {'\n\n'}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-lg bg-[#0EA5E9] text-white text-sm font-bold flex items-center gap-2 hover:bg-[#0284C7] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة المحاولة
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="px-5 py-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#2A2A4A] text-[#475569] dark:text-[#9090B0] text-sm font-bold flex items-center gap-2 hover:bg-[#F1F5F9] dark:hover:bg-[#1A1A3A] transition-colors"
              >
                <Home className="w-4 h-4" />
                الرئيسية
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E2E8F0] dark:border-[#2A2A4A]">
              <button
                onClick={this.handleReload}
                className="text-xs text-[#94A3B8] hover:text-[#0EA5E9] transition-colors"
              >
                تحديث الصفحة بالكامل
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    console.error('[useErrorHandler]', error, errorInfo);
  };
}

// Lightweight fallback for non-critical sections
export function ErrorFallback({ 
  error, 
  resetError 
}: { 
  error?: Error; 
  resetError?: () => void;
}) {
  return (
    <div className="p-6 bg-[#FEF0EC] border border-[#FF4560]/20 rounded-xl text-center">
      <AlertTriangle className="w-6 h-6 text-[#FF4560] mx-auto mb-2" />
      <p className="text-sm font-bold text-[#1E293B] mb-1">حدث خطأ في تحميل هذا القسم</p>
      <p className="text-xs text-[#64748B] mb-3">{error?.message || 'Unknown error'}</p>
      {resetError && (
        <button
          onClick={resetError}
          className="px-3 py-1.5 rounded-lg bg-white border border-[#FF4560]/20 text-xs font-bold text-[#FF4560] hover:bg-[#FF4560]/5"
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}
