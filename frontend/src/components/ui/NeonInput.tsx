'use client';
import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import { clsx } from 'clsx';

interface NeonInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
}

export const NeonInput = forwardRef<HTMLInputElement, NeonInputProps>(function NeonInput(
  { icon, className, ...rest }, ref
) {
  return (
    <div className="relative w-full">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">{icon}</div>}
      <input
        ref={ref}
        {...rest}
        className={clsx(
          'w-full px-4 py-2.5 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-950',
          'border border-zinc-200 dark:border-zinc-800',
          'text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600',
          'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15',
          'transition-all',
          icon ? 'pl-10' : '',
          className
        )}
      />
    </div>
  );
});
