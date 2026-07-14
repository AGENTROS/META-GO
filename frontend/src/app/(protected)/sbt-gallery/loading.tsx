import { Navbar } from '@/components/layout/Navbar';

export default function SBTGalleryLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      <Navbar />

      <main className="pt-24 pb-20 px-4 max-w-7xl mx-auto space-y-8">
        {/* HEADER SKELETON */}
        <div className="space-y-3">
          <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-md shimmer" />
          <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg shimmer" />
          <div className="h-4 w-96 bg-zinc-200 dark:bg-zinc-800 rounded-md shimmer" />
        </div>

        {/* GALLERY CARDS SKELETON */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm space-y-4 pb-4">
              <div className="h-32 bg-zinc-200 dark:bg-zinc-850 relative shimmer" />
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-850 rounded shimmer" />
                  <div className="h-4.5 w-12 bg-zinc-200 dark:bg-zinc-850 rounded shimmer" />
                </div>
                <div className="h-3 w-1/4 bg-zinc-200 dark:bg-zinc-850 rounded shimmer" />
                <div className="space-y-1.5 pt-2">
                  <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-850 rounded shimmer" />
                  <div className="h-3 w-5/6 bg-zinc-200 dark:bg-zinc-850 rounded shimmer" />
                </div>
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                  <div className="h-2.5 w-24 bg-zinc-200 dark:bg-zinc-850 rounded shimmer" />
                  <div className="h-2.5 w-10 bg-zinc-200 dark:bg-zinc-850 rounded shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
