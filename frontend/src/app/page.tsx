import Link from 'next/link';
import ClientNavbar from './ClientNavbar';
import ClientFaceMeshHero from './ClientFaceMeshHero';
import { Shield, Fingerprint, Eye, Zap, Lock, Network, ArrowRight, CheckCircle2, Cpu } from 'lucide-react';

const FEATURES = [
  { icon: Fingerprint, title: 'Zero-Knowledge Biometrics', desc: 'Prove your identity without revealing your face. 468-point FaceMesh mapped locally, then permanently discarded.' },
  { icon: Lock, title: 'Soulbound Credentials', desc: 'Non-transferable ERC-721 SBTs minted on Polygon. Identity that cannot be sold, traded, or stolen.' },
  { icon: Shield, title: 'Multi-Factor Defense', desc: 'Wallet + Face + Voice triple-modal biometric authentication. Bypass-resistant by cryptographic design.' },
  { icon: Network, title: 'Cross-Platform DIDs', desc: 'W3C-compliant decentralized identifiers resolvable across Web3 services and EVM-compatible chains.' },
  { icon: Eye, title: 'Liveness & Anti-Deepfake', desc: 'Real-time eye-blink and depth analysis blocks photo, video, and AI-generated synthetic face attacks.' },
  { icon: Cpu, title: 'Client-Side Proof Generation', desc: 'Groth16 zk-SNARK proofs computed entirely in your browser. No server ever sees your biometrics.' },
];

const STATS = [
  { v: '468', l: 'Facial landmarks' },
  { v: '< 8s', l: 'Proof generation' },
  { v: '0 KB', l: 'Biometric data stored' },
  { v: 'EIP-712', l: 'Gasless relay' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <ClientNavbar />

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-60 pointer-events-none" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
          
          {/* Static Anim Wrapper using simple CSS animation */}
          <div className="animate-fade-in-up duration-700 ease-out">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600">DZBIP v1.0 — Live on Polygon Amoy</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] mb-6">
              The <span className="gradient-text font-extrabold">sovereign identity</span><br />
              protocol for Web3.
            </h1>
            <p className="text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mb-8 leading-relaxed">
              Meta Go fuses zero-knowledge cryptography, biometric liveness, and Soulbound tokens into a single
              passwordless identity primitive — privacy-first, audit-ready, Metaverse-native.
            </p>
            <div className="flex flex-wrap gap-3" data-testid="hero-cta-row">
              <Link href="/auth/signup" data-testid="hero-cta-primary"
                className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl text-sm font-bold transition-all duration-250">
                Forge Your Identity <ArrowRight size={14} />
              </Link>
              <Link href="#demo" data-testid="hero-cta-secondary"
                className="inline-flex items-center gap-2 px-6 py-3 border border-zinc-300 dark:border-zinc-700 hover:border-blue-500 hover:text-blue-600 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-bold transition-all duration-250">
                See it in action
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
              {STATS.map(s => (
                <div key={s.l}>
                  <p className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white">{s.v}</p>
                  <p className="text-[10px] font-mono text-zinc-450 uppercase tracking-wider mt-1">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative aspect-square max-w-md mx-auto w-full animate-fade-in-up duration-1000 ease-out delay-150">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 via-transparent to-indigo-100/40 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-3xl" />
            <ClientFaceMeshHero />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-3 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Liveness Active</span>
              </div>
              <span className="text-[10px] font-mono text-blue-600">468 / 468 landmarks</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-16">
            <p className="text-[10px] font-mono uppercase tracking-widest text-blue-600 mb-3">Core capabilities</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-4">
              Built on cryptography. Designed for humans.
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Every layer of Meta Go enforces a single principle: you alone hold your identity, and you alone decide what to reveal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={f.title}
                className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-500/40 hover:shadow-md transition-all duration-300 group hover:scale-[1.02] cursor-default">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon size={18} className="text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="demo" className="py-24 px-4 bg-white dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-16">
            <p className="text-[10px] font-mono uppercase tracking-widest text-blue-600 mb-3">The Identity Forge</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-4">
              Five steps. Zero compromises.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { n: '01', t: 'Choose Handle', d: 'Reserve your unique username on the Meta Go network.' },
              { n: '02', t: 'Connect Wallet', d: 'Sign-In With Ethereum verifies wallet ownership cryptographically.' },
              { n: '03', t: 'Biometric Scan', d: 'TF.js FaceMesh maps your topology with liveness checks.' },
              { n: '04', t: 'Voice MFA', d: 'Vocal frequency print becomes your second cryptographic factor.' },
              { n: '05', t: 'Mint SBT', d: 'A non-transferable on-chain credential binds it all together.' },
            ].map(s => (
              <div key={s.n} className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:scale-[1.02] transition-transform duration-300">
                <p className="text-2xl font-bold gradient-text mb-3">{s.n}</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white mb-1.5">{s.t}</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPLIANCE */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[10px] font-mono uppercase tracking-widest text-blue-600 mb-3">Governance</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-6">
            Compliant by architecture.
          </h2>
          <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Zero-storage biometrics means there is no PII to leak. We comply with global privacy regulations by design, not by policy.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {[
              { t: 'GDPR Aligned', d: 'Zero raw biometric storage. Right to erasure satisfied by cryptographic primitive.' },
              { t: 'SOC2 Ready', d: 'Client-side prover, encrypted sessions, audit-grade event logging.' },
              { t: 'W3C DID Standard', d: 'Decentralized identifiers compatible with Verifiable Credentials.' },
            ].map(c => (
              <div key={c.t} className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:scale-[1.01] transition-transform duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{c.t}</p>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto p-10 md:p-14 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Ready to claim your sovereign identity?</h2>
            <p className="text-base text-blue-50 mb-8 max-w-xl mx-auto">Join the Meta Go protocol in under 60 seconds. No passwords. No data leakage. Just math.</p>
            <Link href="/auth/signup" data-testid="footer-cta"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-zinc-900 hover:bg-zinc-100 rounded-xl text-sm font-bold transition-all duration-200">
              Get Started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Meta Go Protocol. Sovereign and decentralized.</p>
          <div className="flex gap-4">
            <Link href="/docs" className="hover:underline">Documentation</Link>
            <Link href="/security" className="hover:underline">Security Audit</Link>
            <Link href="/billing" className="hover:underline">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
