'use client';
import Link from 'next/link';
import { X, LogOut } from 'lucide-react';
import { clsx } from 'clsx';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  links: { href: string; label: string }[];
  address: string | null;
  onLogout: () => void;
}

export function MobileNav({ isOpen, onClose, links, address, onLogout }: MobileNavProps) {
  return (
    <div className={clsx('fixed inset-0 z-[60] md:hidden transition-all duration-300', isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className={clsx('absolute top-0 right-0 h-full w-72 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 p-6 transition-transform duration-300', isOpen ? 'translate-x-0' : 'translate-x-full')}>
        <div className="flex items-center justify-between mb-8">
          <span className="text-sm font-bold text-zinc-900 dark:text-white">Meta<span className="text-blue-600"> Go</span></span>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <nav className="space-y-1">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={onClose}
              className="block px-3 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
              {l.label}
            </Link>
          ))}
        </nav>
        {address && (
          <div className="absolute bottom-6 left-6 right-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-[10px] font-mono text-zinc-450 mb-2">{address}</p>
            <button onClick={onLogout} className="flex items-center gap-2 text-xs text-red-500 font-semibold">
              <LogOut size={14} />Logout
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
