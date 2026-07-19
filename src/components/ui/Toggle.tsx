import React from 'react';
import { cn } from '@/lib/utils';

interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  labelEn?: string;
  lang?: 'ar' | 'en';
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked = false, onChange, label, labelEn, lang = 'ar', disabled, className }: ToggleProps) {
  return (
    <label className={cn('inline-flex items-center gap-3 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className={cn(
          'w-11 h-6 rounded-full transition-all duration-300',
          checked ? 'bg-gold-primary' : 'bg-border-medium'
        )}>
          <div className={cn(
            'w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 absolute top-0.5',
            checked ? (lang === 'ar' ? 'right-0.5' : 'left-0.5') : (lang === 'ar' ? 'left-0.5' : 'right-0.5'),
          )} />
        </div>
      </div>
      {(label || labelEn) && (
        <span className="text-sm font-bold text-text-secondary">
          {lang === 'ar' ? label : (labelEn || label)}
        </span>
      )}
    </label>
  );
}
