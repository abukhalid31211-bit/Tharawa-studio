import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'success' | 'error' | 'warning' | 'info' | 'gold' | 'default';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', size = 'md', dot, pulse, children, className }: BadgeProps) {
  const base = 'inline-flex items-center gap-1.5 font-semibold rounded-full leading-none';

  const variants = {
    success: 'bg-success-light text-success-text',
    error: 'bg-error-light text-error-text',
    warning: 'bg-warning-light text-warning-text',
    info: 'bg-info-light text-info-text',
    gold: 'bg-gold-light text-gold-deep',
    default: 'bg-tertiary text-text-secondary border border-border-default',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  const dotColors = {
    success: 'bg-success',
    error: 'bg-error',
    warning: 'bg-warning',
    info: 'bg-info',
    gold: 'bg-gold-deep',
    default: 'bg-text-muted',
  };

  return (
    <span className={cn(base, variants[variant], sizes[size], className)}>
      {(dot || pulse) && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          dotColors[variant],
          pulse && 'animate-pulse'
        )} />
      )}
      {children}
    </span>
  );
}
