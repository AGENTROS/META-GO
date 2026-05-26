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

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { handle, unreadCount, logout } = useIdentityStore();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const isAdmin = typeof document !== 'undefined' && document.cookie.includes('celestial_admin');

  useEffect(() => {
    setMounted(true);
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setAvatarOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
    { href: '/api-docs', label: 'Docs' },
  ] : [
    { href: '/#features', label: 'Features' },
    { href: '/billing', label: 'Pricing' },
    { href: '/#demo', label: 'Demo' },
    { href: '/api-docs', label: 'Docs' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md" data-testid="primary-navbar">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" data-testid="brand-link">
            <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-600/30 flex items-center justify-center">
              <span className="text-blue-600 text-xs font-sans font-bold">M</span>
            </div>
            <span className="font-sans text-sm font-bold text-zinc-900 dark:text-white hidden sm:block tracking-tight">
              Meta<span className="text-blue-600"> Go</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} data-testid={`nav-${link.label.toLowerCase()}`}
                className={clsx('text-xs font-semibold tracking-wide uppercase transition-colors',
                  pathname === link.href ? 'text-blue-600' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                )}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setNotifsOpen(!notifsOpen)}
              className="relative p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              aria-label={`Notifications (${unreadCount} unread)`}
              data-testid="notifications-toggle-btn">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 rounded-full text-[10px] font-sans text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {mounted && isConnected && shortAddress ? (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setAvatarOpen(!avatarOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                  aria-label="Account menu" data-testid="account-menu-btn">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500" />
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hidden sm:block">
                    {handle ? `@${handle}` : shortAddress}
                  </span>
                  <ChevronDown size={12} className="text-zinc-400" />
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
                      <Link key={item.href} href={item.href} onClick={() => setAvatarOpen(false)} data-testid={`menu-${item.label.toLowerCase().replace(' ', '-')}`}
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
