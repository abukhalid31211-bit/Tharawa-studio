import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  labelEn?: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  placeholderEn?: string;
  label?: string;
  labelEn?: string;
  lang?: 'ar' | 'en';
  error?: string;
  className?: string;
}

export function Select({ options, value, onChange, placeholder = 'اختر...', placeholderEn = 'Select...', label, labelEn, lang = 'ar', error, className }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);
  const displayText = selectedOption ? (lang === 'ar' ? selectedOption.label : (selectedOption.labelEn || selectedOption.label)) : (lang === 'ar' ? placeholder : placeholderEn);

  return (
    <div ref={ref} className="relative w-full">
      {label && (
        <label className="block text-xs font-bold text-text-secondary mb-1.5">
          {lang === 'ar' ? label : (labelEn || label)}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full bg-secondary border border-border-default rounded-md py-3 px-4 flex items-center justify-between text-sm font-bold transition-all duration-200',
          selectedOption ? 'text-text-primary' : 'text-text-muted',
          open && 'border-gold-primary ring-2 ring-gold-subtle',
          error && 'border-error ring-2 ring-error/15',
          className
        )}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown className={cn('w-4 h-4 text-text-muted transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 w-full bg-white dark:bg-[#1C1C34] border border-border-default rounded-xl shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange?.(opt.value); setOpen(false); }}
                className={cn(
                  'w-full px-4 py-2.5 text-sm font-bold text-right flex items-center justify-between gap-3 transition-colors',
                  isSelected ? 'text-gold-deep bg-gold-subtle' : 'text-text-primary hover:bg-secondary'
                )}
              >
                <span>{lang === 'ar' ? opt.label : (opt.labelEn || opt.label)}</span>
                {isSelected && <Check className="w-4 h-4 text-gold-deep shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-error-text font-medium">{error}</p>}
    </div>
  );
}
