import { Navbar } from '@/components/layout/Navbar';

export default function VaultLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      <Navbar />

      <main className="pt-24 pb-20 px-4 max-w-7xl mx-auto space-y-8">
        {/* HEADER SKELETON */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-md shimmer" />
            <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg shimmer" />
            <div className="h-4 w-96 bg-zinc-200 dark:bg-zinc-800 rounded-md shimmer" />
          </div>
          <div className="h-9 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl shimmer" />
        </div>

        {/* VAULT LAYOUT SKELETON */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main credentials list (Left 8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg shimmer" />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-850 shimmer" />
                    <div className="h-5 w-14 bg-zinc-200 dark:bg-zinc-850 rounded shimmer" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-850 rounded shimmer" />
                    <div className="h-3.5 w-1/3 bg-zinc-200 dark:bg-zinc-850 rounded shimmer" />
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-850 rounded shimmer" />
                    <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-850 rounded shimmer" />
                  </div>
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                    <div className="flex justify-between">
                      <div className="h-2.5 w-16 bg-zinc-200 dark:bg-zinc-855 rounded shimmer" />
                      <div className="h-2.5 w-8 bg-zinc-200 dark:bg-zinc-855 rounded shimmer" />
                    </div>
                    <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-855 rounded-full shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Backup and ZK panel (Right 4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* IPFS Sync Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-4">
              <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
                <div className="h-3 w-4/5 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
              </div>
              <div className="h-16 w-full bg-zinc-100 dark:bg-zinc-950 rounded-xl shimmer" />
              <div className="flex gap-2">
                <div className="h-8 flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg shimmer" />
                <div className="h-8 flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg shimmer" />
              </div>
            </div>

            {/* ZK Disclosure Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-4">
              <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
                <div className="h-3 w-4/5 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
              </div>
              <div className="space-y-2 pt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-3.5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
                    <div className="w-4 h-4 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
                  </div>
                ))}
              </div>
              <div className="h-8 w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg shimmer" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
