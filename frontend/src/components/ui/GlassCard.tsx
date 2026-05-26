'use client';
import { ReactNode, HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  intensity?: 'low' | 'medium' | 'high';
  hover?: boolean;
}

export function GlassCard({ children, intensity = 'medium', hover = true, className, ...rest }: GlassCardProps) {
  return (
    <div
      {...rest}
      className={clsx(
        'relative rounded-2xl border bg-white dark:bg-zinc-900',
        'border-zinc-200/80 dark:border-zinc-800/80',
        intensity === 'high' && 'shadow-md',
        intensity === 'medium' && 'shadow-sm',
        intensity === 'low' && 'shadow-none',
        hover && 'transition-all duration-300 hover:border-blue-500/40 hover:shadow-md',
        className
      )}
    >
      {children}
    </div>
  );
}
