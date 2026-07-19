import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect' | 'card' | 'chart';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({ variant = 'text', width, height, className }: SkeletonProps) {
  const base = 'animate-pulse bg-border-light rounded-md';

  const variants = {
    text: 'h-4 w-full',
    circle: 'rounded-full',
    rect: 'rounded-lg',
    card: 'rounded-xl h-48 w-full',
    chart: 'rounded-xl h-64 w-full',
  };

  return (
    <div
      className={cn(base, variants[variant], className)}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-primary border border-border-light rounded-xl p-6 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" width={40} height={40} />
        <div className="space-y-2 flex-1">
          <Skeleton width="60%" />
          <Skeleton width="40%" />
        </div>
      </div>
      <Skeleton variant="text" />
      <Skeleton variant="text" width="80%" />
      <div className="pt-2">
        <Skeleton variant="rect" height={32} width={120} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex items-center gap-4 pb-3 border-b border-border-light">
        {[40, 25, 20, 15].map((w, i) => (
          <Skeleton key={i} width={`${w}%`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-border-light last:border-0">
          <Skeleton width="35%" />
          <Skeleton width="20%" />
          <Skeleton width="25%" />
          <Skeleton width="15%" />
        </div>
      ))}
    </div>
  );
}
