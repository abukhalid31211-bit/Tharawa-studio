import React from 'react';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  variant?: 'gold' | 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'default';
  status?: 'online' | 'offline' | 'away';
  className?: string;
}

const gradientMap = {
  gold: 'from-gold-primary to-gold-deep',
  blue: 'from-blue-500 to-blue-600',
  purple: 'from-violet-500 to-purple-600',
  green: 'from-emerald-500 to-teal-600',
  orange: 'from-orange-400 to-amber-500',
  pink: 'from-pink-500 to-rose-500',
  default: 'from-slate-400 to-slate-500',
};

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-22 h-22 text-2xl',
  hero: 'w-24 h-24 text-3xl',
};

const statusSizeMap = {
  sm: 'w-2.5 h-2.5 border',
  md: 'w-3 h-3 border-2',
  lg: 'w-4 h-4 border-2',
  xl: 'w-5 h-5 border-3',
  hero: 'w-5 h-5 border-3',
};

const statusColors = {
  online: 'bg-emerald-500',
  offline: 'bg-gray-400',
  away: 'bg-amber-400',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({ name, src, size = 'md', variant = 'gold', status, className }: AvatarProps) {
  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={cn('rounded-full object-cover', sizeMap[size])}
        />
      ) : (
        <div className={cn(
          'rounded-full bg-gradient-to-br flex items-center justify-center font-black text-white shadow-gold-sm',
          sizeMap[size],
          gradientMap[variant]
        )}>
          {size === 'sm' || size === 'md' ? (
            <span>{getInitials(name)}</span>
          ) : (
            <User className="w-1/2 h-1/2 opacity-70" />
          )}
        </div>
      )}
      {status && (
        <span className={cn(
          'absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-primary',
          statusSizeMap[size],
          statusColors[status]
        )} />
      )}
    </div>
  );
}
