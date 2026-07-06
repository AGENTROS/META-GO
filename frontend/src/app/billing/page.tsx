'use client';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { useAccount } from 'wagmi';
import { Check, Zap, Shield, Building2, ChevronRight, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Plan {
  id: string;
  name: string;
  priceUsd: number | null;
  billing: string;
  limits: Record<string, any>;
  features: string[];
  popular?: boolean;
}

const FALLBACK_PLANS: Plan[] = [
  { id: 'free', name: 'Personal', priceUsd: 0, billing: 'forever', limits: {}, features: ['1 sovereign identity', 'Up to 10 credentials', 'Basic ZK proof', 'Email support'] },
  { id: 'starter', name: 'Starter', priceUsd: 29, billing: 'monthly', limits: {}, features: ['5 identities', '100 credentials', '5K verifications/mo', 'Cross-chain DIDs', 'API access', 'Priority email'] },
  { id: 'pro', name: 'Pro', priceUsd: 149, billing: 'monthly', limits: {}, features: ['50 identities', '1,000 credentials', '100K verifications/mo', 'Webhook events', 'Dedicated relay', 'Phone support'], popular: true },
  { id: 'enterprise', name: 'Enterprise', priceUsd: null, billing: 'custom', limits: {}, features: ['Unlimited everything', 'On-prem deploy', 'Custom SLAs', 'GDPR/SOC2 audit pack', 'Dedicated CSM', '24/7 support'] },
];

export default function BillingPage() {
  const { address } = useAccount();
  const [plans, setPlans] = useState<Plan[]>(FALLBACK_PLANS);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    fetch(`${backend}/api/billing/plans`).then(r => r.json()).then(d => { if (d.plans?.length) setPlans(d.plans); }).catch(() => {});
    if (address) {
      fetch(`${backend}/api/billing/subscription/${address}`).then(r => r.json()).then(d => setCurrentPlan(d.plan || 'free')).catch(() => {});
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('simulated') === 'true') {
        const plan = params.get('plan');
        if (plan) {
          toast.success(`Simulated subscription to ${plan.toUpperCase()} activated!`);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, [address]);

  async function subscribe(planId: string) {
    if (!address) {
      toast.error('Please connect your wallet first.');
      return;
    }
    setLoading(true);
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    try {
      const res = await fetch(`${backend}/api/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, walletAddress: address }),
      });
      const data = await res.json();
      if (data.type === 'activated') {
        toast.success('Free plan activated');
        setCurrentPlan('free');
      } else if (data.type === 'contact_sales') {
        toast.success('Sales team will contact you within 24h');
      } else if (data.type === 'checkout_redirect') {
        toast.success(`Redirecting to checkout for ${planId.toUpperCase()}...`);
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      }
    } catch (e) {
      toast.error('Checkout failed');
    } finally {
      setLoading(false);
    }
  }

  const ICONS: Record<string, any> = { free: Sparkles, starter: Zap, pro: Shield, enterprise: Building2 };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Navbar />
      <main className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-450 mb-2">
          <Link href="/" className="hover:text-blue-600">Meta Go</Link>
          <ChevronRight size={10} /><span className="text-blue-600 font-bold">Subscription</span>
        </div>
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            Identity <span className="gradient-text">as a Service</span>
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Embed sovereign, deepfake-resistant identity into your product. Pay only for what you verify.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map(p => {
            const Icon = ICONS[p.id] || Sparkles;
            const isCurrent = currentPlan === p.id;
            return (
              <GlassCard key={p.id} className={clsx('p-6 relative', p.popular && 'border-blue-500/60 shadow-lg shadow-blue-500/10')}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    Most popular
                  </div>
                )}
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{p.name}</h3>
                <div className="mt-2 mb-4">
                  {p.priceUsd === null ? (
                    <p className="text-2xl font-extrabold">Custom</p>
                  ) : p.priceUsd === 0 ? (
                    <p className="text-2xl font-extrabold">Free</p>
                  ) : (
                    <p className="text-2xl font-extrabold">${p.priceUsd}<span className="text-xs text-zinc-500 font-semibold">/mo</span></p>
                  )}
                </div>
                <ul className="space-y-2 mb-6 text-xs">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                      <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <NeonButton onClick={() => subscribe(p.id)} disabled={isCurrent || loading}
                  data-testid={`subscribe-${p.id}`}
                  className={clsx('w-full', p.popular && 'bg-blue-600 hover:bg-blue-700 text-white')}>
                  {isCurrent ? '✓ Current Plan' : p.priceUsd === null ? 'Contact Sales' : p.priceUsd === 0 ? 'Activate' : 'Subscribe'}
                </NeonButton>
              </GlassCard>
            );
          })}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-xs uppercase tracking-wider font-mono text-zinc-500 mb-2">Payment Methods</p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Stripe · Razorpay · Crypto (USDC on Polygon) — all gated by your sovereign identity, not a credit card alone.
          </p>
        </div>
      </main>
    </div>
  );
}
