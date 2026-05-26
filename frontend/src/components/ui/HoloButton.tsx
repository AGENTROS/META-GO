'use client';
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

interface HoloButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'cyan' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function HoloButton({ children, variant = 'primary', size = 'md', loading, className, disabled, ...rest }: HoloButtonProps) {
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  const variants = {
    primary: 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200',
    cyan: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20',
    ghost: 'bg-transparent border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-500/40 hover:text-blue-600',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizes[size], variants[variant], className
      )}
    >
      {loading && <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}
