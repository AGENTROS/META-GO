import { Navbar } from '@/components/layout/Navbar';
import BillingPageClient from './BillingPageClient';
import { FALLBACK_PLANS } from './plans.data';

export const revalidate = 3600; // Cache billing plans for 1 hour

export default async function Page() {
  let plans = FALLBACK_PLANS;
  
  try {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
    // Server-side fetch with caching
    const res = await fetch(`${backend}/api/billing/plans`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      if (data.plans?.length) {
        plans = data.plans;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch billing plans server-side, falling back to static metadata:', e);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      <Navbar />
      <BillingPageClient initialPlans={plans} />
    </div>
  );
}
