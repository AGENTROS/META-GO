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
        'relative rounded-[24px] border backdrop-blur-[20px] saturate-[160%]',
        'bg-zinc-950/40 border-white/8',
        intensity === 'high' && 'shadow-[0_12px_40px_0_rgba(0,0,0,0.6)]',
        intensity === 'medium' && 'shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]',
        intensity === 'low' && 'shadow-none',
        hover && 'transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_0_24px_rgba(59,130,246,0.15)]',
        className
      )}
    >
      {children}
    </div>
  );
}
