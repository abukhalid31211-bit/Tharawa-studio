import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'featured' | 'glass' | 'stat';
}

export function Card({ variant = 'default', className, children, ...props }: CardProps) {
  const base = 'rounded-xl p-8';
  const variants = {
    default: 'bg-primary border border-border-light shadow-sm',
    interactive: 'bg-primary border border-border-light shadow-sm hover:border-border-gold hover:-translate-y-[3px] hover:shadow-gold-sm transition-all duration-200',
    featured: 'bg-primary border border-border-gold shadow-gold-sm hover:-translate-y-[3px] transition-all duration-200',
    glass: 'bg-white/90 dark:bg-[#13132A]/80 backdrop-blur-[20px] border border-white/30 shadow-lg',
    stat: 'bg-primary border border-border-light border-l-4 border-l-gold-primary p-6'
  };

  return (
    <div className={cn(base, variants[variant], className)} {...props}>
      {children}
    </div>
  );
}
