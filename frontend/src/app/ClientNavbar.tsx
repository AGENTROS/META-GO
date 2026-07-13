'use client';
import dynamic from 'next/dynamic';

const DynamicNavbar = dynamic(() => import('@/components/layout/Navbar').then(mod => mod.Navbar), {
  ssr: false,
  loading: () => (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/70 dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-zinc-800 backdrop-blur-md" />
  ),
});

export default function ClientNavbar() {
  return <DynamicNavbar />;
}
