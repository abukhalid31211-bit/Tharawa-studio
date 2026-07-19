import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'gold' | 'success' | 'error' | 'info' | 'warning';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const barColors = {
  gold: 'bg-gradient-to-r from-gold-primary to-gold-deep',
  success: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
  error: 'bg-gradient-to-r from-rose-400 to-red-500',
  info: 'bg-gradient-to-r from-sky-400 to-blue-500',
  warning: 'bg-gradient-to-r from-amber-400 to-orange-500',
};

const heights = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export function Progress({ value, max = 100, size = 'md', variant = 'gold', showLabel, label, className }: ProgressProps) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('space-y-1', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs font-medium text-text-muted">{label}</span>}
          {showLabel && (
            <span className="text-xs font-bold font-mono text-text-primary">{Math.round(percent)}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-border-light rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn('rounded-full transition-all duration-800 ease-out', barColors[variant], heights[size])}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
