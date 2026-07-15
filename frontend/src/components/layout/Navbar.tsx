'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import { Bell, Menu, ChevronDown, Shield, Settings, LogOut, User, BarChart3 } from 'lucide-react';
import { useIdentityStore } from '@/store/useIdentityStore';
import toast from 'react-hot-toast';
import { NotificationCenter } from './NotificationCenter';
import { MobileNav } from './MobileNav';
import { clsx } from 'clsx';

import { useShallow } from 'zustand/shallow';

function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none"
      style={{ filter: 'drop-shadow(0 0 6px rgba(107,91,255,0.6))' }}>
      <defs>
        <linearGradient id="lgoG" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4f7bff" />
          <stop offset="55%" stopColor="#8f6bff" />
          <stop offset="100%" stopColor="#c56bff" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="11" fill="url(#lgoG)" />
      <g stroke="#0b0d18" strokeWidth="0.9" opacity="0.55" fill="none">
        <ellipse cx="16" cy="16" rx="11" ry="4.2" />
        <ellipse cx="16" cy="16" rx="4.2" ry="11" />
        <path d="M6.2 11.2c4 2.6 15.6 2.6 19.6 0M6.2 20.8c4-2.6 15.6-2.6 19.6 0" />
      </g>
      <ellipse cx="16" cy="17" rx="15" ry="5" transform="rotate(-16 16 17)"
        stroke="#dfe6ff" strokeWidth="1.1" fill="none" opacity="0.9" />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { handle, unreadCount, logout } = useIdentityStore(useShallow(s => ({
    handle: s.handle,
    unreadCount: s.unreadCount,
    logout: s.logout
  })));
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const isAdmin = mounted && typeof document !== 'undefined' && document.cookie.includes('celestial_admin');

  useEffect(() => {
    setMounted(true);
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setAvatarOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setAvatarOpen(false);
    setNotifsOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  function handleLogout() {
    disconnect();
    logout();
    toast.success('Session ended');
    router.push('/');
  }

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

    const navLinks = (mounted && isConnected && shortAddress) ? [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/sbt-gallery', label: 'Credentials' },
    { href: '/vault', label: 'Vault' },
    { href: '/billing', label: 'Plans' },
    { href: '/docs', label: 'Docs' },
  ] : [
    { href: '/#features', label: 'Features' },
    { href: '/billing', label: 'Pricing' },
    { href: '/#demo', label: 'Demo' },
    { href: '/docs', label: 'Docs' },
  ];
  return (
    <>
      <nav className="fixed top-4 left-4 right-4 z-50 rounded-2xl border border-white/8 bg-[#0a0a0c]/60 backdrop-blur-[20px] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]" data-testid="primary-navbar">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" data-testid="brand-link">
            <LogoMark size={24} />
            <span className="font-sans text-[13px] font-bold text-white tracking-tight">
              Meta <span className="text-blue-500">Go</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} data-testid={`nav-${link.label.toLowerCase()}`}
                onMouseEnter={() => router.prefetch(link.href)}
                className={clsx('text-[10px] font-semibold tracking-wider uppercase transition-colors',
                  pathname === link.href ? 'text-blue-500' : 'text-zinc-400 hover:text-white'
                )}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setNotifsOpen(!notifsOpen)}
              className="relative p-2 text-zinc-400 hover:text-white transition-colors"
              aria-label={`Notifications (${unreadCount} unread)`}
              data-testid="notifications-toggle-btn">
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-blue-500 rounded-full text-[9px] font-sans text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {mounted && isConnected && shortAddress ? (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setAvatarOpen(!avatarOpen)}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-xl border border-white/8 bg-zinc-950/40 hover:bg-zinc-900/60 transition-all"
                  aria-label="Account menu" data-testid="account-menu-btn">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500" />
                  <span className="text-[10px] font-semibold text-zinc-300 hidden sm:block">
                    {handle ? `@${handle}` : shortAddress}
                  </span>
                  <ChevronDown size={10} className="text-zinc-400" />
                </button>

                {avatarOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs text-zinc-550 font-mono">{shortAddress}</p>
                    </div>
                    {[
                      { icon: User, label: 'Profile', href: '/profile' },
                      { icon: Settings, label: 'Settings', href: '/settings' },
                      { icon: Shield, label: 'Security Center', href: '/security' },
                      ...(isAdmin ? [{ icon: BarChart3, label: 'Admin Panel', href: '/admin' }] : []),
                    ].map(item => (
                      <Link key={item.href} href={item.href} onClick={() => setTimeout(() => setAvatarOpen(false), 0)}
                        onMouseEnter={() => router.prefetch(item.href)}
                        data-testid={`menu-${item.label.toLowerCase().replace(' ', '-')}`}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-blue-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                        <item.icon size={14} />{item.label}
                      </Link>
                    ))}
                    <button onClick={handleLogout} data-testid="menu-logout"
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors border-t border-zinc-100 dark:border-zinc-800">
                      <LogOut size={14} />Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth" className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-transparent bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-850 dark:hover:bg-zinc-200 transition-all" data-testid="connect-cta">
                Connect
              </Link>
            )}

            <button className="md:hidden p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white" onClick={() => setMobileOpen(true)} aria-label="Open menu" data-testid="mobile-menu-btn">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {notifsOpen && <NotificationCenter onClose={() => setNotifsOpen(false)} />}
      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} links={navLinks} address={shortAddress} onLogout={handleLogout} />
    </>
  );
}
