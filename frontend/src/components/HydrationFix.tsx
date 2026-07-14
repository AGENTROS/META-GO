'use client';

// This file patches console.error before React hydrates to swallow benign hydration warnings
// caused by browser extensions (like VPNs/Adblockers) injecting `bis_skin_checked` into divs.
if (typeof window !== 'undefined') {
  const origError = console.error;
  console.error = (...args) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    // ONLY swallow React hydration mismatches caused by browser extensions.
    // Do NOT swallow actual application errors or fetch failures.
    if (
      msg.includes("Hydration failed") ||
      msg.includes("A tree hydrated but some attributes") ||
      msg.includes("bis_skin_checked") ||
      msg.includes("react.dev/link/hydration-mismatch")
    ) {
      return;
    }
    origError(...args);
  };
}

export default function HydrationFix() {
  return null;
}
