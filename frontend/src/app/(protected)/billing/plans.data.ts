export interface Plan {
  id: string;
  name: string;
  priceUsd: number | null;
  billing: string;
  limits: Record<string, any>;
  features: string[];
  popular?: boolean;
}

export const FALLBACK_PLANS: Plan[] = [
  { id: 'free', name: 'Personal', priceUsd: 0, billing: 'forever', limits: {}, features: ['1 sovereign identity', 'Up to 10 credentials', 'Basic ZK proof', 'Email support'] },
  { id: 'starter', name: 'Starter', priceUsd: 29, billing: 'monthly', limits: {}, features: ['5 identities', '100 credentials', '5K verifications/mo', 'Cross-chain DIDs', 'API access', 'Priority email'] },
  { id: 'pro', name: 'Pro', priceUsd: 149, billing: 'monthly', limits: {}, features: ['50 identities', '1,000 credentials', '100K verifications/mo', 'Webhook events', 'Dedicated relay', 'Phone support'], popular: true },
  { id: 'enterprise', name: 'Enterprise', priceUsd: null, billing: 'custom', limits: {}, features: ['Unlimited everything', 'On-prem deploy', 'Custom SLAs', 'GDPR/SOC2 audit pack', 'Dedicated CSM', '24/7 support'] },
];
