import React from 'react';
import { cn } from '@/lib/utils'; // I'll create this utility later

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', isLoading, className, children, ...props }: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all duration-150 rounded-md disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-br from-[#F5C518] to-[#E6AF00] text-white shadow-[0_4px_16px_rgba(245,197,24,0.2)] hover:-translate-y-[2px] hover:shadow-[0_8px_32px_rgba(245,197,24,0.28)] active:translate-y-0',
    secondary: 'bg-transparent border-2 border-gold-primary text-gold-deep hover:bg-gold-subtle hover:-translate-y-[2px]',
    ghost: 'bg-transparent border border-border-default text-text-secondary hover:border-border-gold hover:text-text-gold hover:bg-gold-subtle',
    danger: 'bg-error-light border border-error text-error-text hover:bg-[#FEE0D8]',
    icon: 'w-10 h-10 p-0 bg-transparent text-text-secondary hover:bg-tertiary hover:text-text-primary rounded-md'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-7 py-3.5 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <button className={cn(baseStyles, variants[variant], variant !== 'icon' && sizes[size], className)} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </button>
  );
}
