import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'search' | 'error' | 'success';
  icon?: React.ReactNode;
  errorMessage?: string;
}

export function Input({ variant = 'default', icon, errorMessage, className, ...props }: InputProps) {
  const baseStyles = 'w-full bg-secondary border border-border-default rounded-md py-3 px-4 outline-none text-sm font-bold text-text-primary placeholder:text-text-muted transition-all duration-200';
  
  const variants = {
    default: 'focus:border-gold-primary focus:ring-2 focus:ring-gold-subtle',
    search: 'bg-tertiary border-none rounded-full py-2.5 px-4 focus:ring-2 focus:ring-gold-primary/30',
    error: 'border-error focus:border-error focus:ring-2 focus:ring-error/15',
    success: 'border-success focus:border-success focus:ring-2 focus:ring-success/15',
  };

  const inputStyles = cn(
    baseStyles,
    variants[variant],
    icon && (props.dir === 'rtl' ? 'pr-10' : 'pl-10'),
    className
  );

  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 text-text-muted">
          {icon}
        </div>
      )}
      <input className={inputStyles} {...props} />
      {variant === 'success' && (
        <span className="absolute rtl:left-3 ltr:right-3 top-1/2 -translate-y-1/2 text-success">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
      {errorMessage && (
        <p className="mt-1 text-xs text-error-text font-medium">{errorMessage}</p>
      )}
    </div>
  );
}
