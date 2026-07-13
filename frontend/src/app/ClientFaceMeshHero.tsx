'use client';
import dynamic from 'next/dynamic';

const DynamicFaceMeshHero = dynamic(() => import('@/components/ui/FaceMeshHero').then(mod => mod.FaceMeshHero), {
  ssr: false,
  loading: () => (
    <div className="relative aspect-square max-w-md mx-auto w-full rounded-3xl bg-zinc-100/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center animate-pulse shimmer">
      <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
    </div>
  ),
});

export default function ClientFaceMeshHero() {
  return <DynamicFaceMeshHero />;
}
