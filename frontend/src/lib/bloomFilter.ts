// Simulated Bloom Filter for handle availability checks.
const TAKEN = new Set([
  'admin', 'root', 'satoshi', 'vitalik', 'metago', 'celestial', 'system',
  'identity', 'wallet', 'metamask', 'ethereum', 'polygon', 'test', 'demo',
  'support', 'help', 'official', 'verified', 'metaverse'
]);

export async function checkHandleAvailability(handle: string): Promise<{ available: boolean }> {
  await new Promise(r => setTimeout(r, 300));
  if (!/^[a-z0-9_]{3,20}$/.test(handle)) return { available: false };
  return { available: !TAKEN.has(handle) };
}
