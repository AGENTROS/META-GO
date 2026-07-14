import { Navbar } from '@/components/layout/Navbar';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      <Navbar />

      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto space-y-8">
        {/* HEADER SKELETON */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-md shimmer" />
            <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg shimmer" />
            <div className="h-4 w-96 bg-zinc-200 dark:bg-zinc-800 rounded-md shimmer" />
          </div>
          <div className="flex gap-3">
            <div className="h-9 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl shimmer" />
            <div className="h-9 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-xl shimmer" />
          </div>
        </header>

        {/* TIMELINE SKELETON */}
        <div className="h-28 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
            <div className="h-3.5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
          </div>
          <div className="flex justify-between items-center pt-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="h-2 w-8 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 shimmer" />
                <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
              </div>
            ))}
          </div>
        </div>

        {/* GRID STRUCTURE */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* LEFT PANELS */}
          <div className="md:col-span-5 space-y-6">
            {/* Holographic Passport Skeleton */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-5">
              <div className="flex justify-between items-center">
                <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
                <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 shimmer" />
                <div className="space-y-2 flex-grow">
                  <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
                  <div className="h-3 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
                    <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
                  </div>
                ))}
              </div>
            </div>

            {/* Access Gate Skeleton */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
                <div className="w-4 h-4 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
              </div>
              <div className="h-12 w-full bg-zinc-100 dark:bg-zinc-950 rounded-xl shimmer" />
              <div className="h-9 w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl shimmer" />
            </div>
          </div>

          {/* RIGHT PANELS */}
          <div className="md:col-span-7 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 3D Visualizer Skeleton */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl flex flex-col items-center justify-center min-h-[300px] space-y-4">
                <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded shimmer self-start" />
                <div className="w-36 h-36 rounded-full bg-zinc-200 dark:bg-zinc-800 shimmer" />
                <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
              </div>

              {/* Chart Skeleton */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-6">
                <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
                <div className="h-36 w-full flex items-end gap-3 justify-center">
                  {[40, 60, 45, 80, 50].map((h, i) => (
                    <div key={i} className="bg-zinc-200 dark:bg-zinc-800 rounded shimmer flex-grow" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Activity Feed Skeleton */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-4">
              <div className="h-3.5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
              <div className="space-y-3 pt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 mt-1.5 shrink-0 shimmer" />
                    <div className="space-y-1.5 flex-grow">
                      <div className="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
                      <div className="h-2.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
