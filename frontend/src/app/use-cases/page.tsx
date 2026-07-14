'use client';

import Link from 'next/link';
import { useState } from 'react';

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #06070d;
    --card: #0f111c;
    --cb: rgba(255,255,255,0.08);
    --text: #f5f6fa;
    --dim: #979bb0;
    --faint: #63677c;
    --blue: #4f7bff;
    --purple: #9b5bff;
    --pink: #c56bff;
    --grad: linear-gradient(90deg, #4f7bff, #9b5bff);
    --green: #34d399;
  }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes gridPulse {
    0%, 100% { opacity: 0.035; }
    50%       { opacity: 0.06; }
  }
  .fade-up { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) both; }
  .fade-up-1 { animation-delay: 0.08s; }
  .fade-up-2 { animation-delay: 0.16s; }
  .fade-up-3 { animation-delay: 0.24s; }
  .uc-card {
    background: var(--card);
    border: 1px solid var(--cb);
    border-radius: 16px;
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    transition: border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
    position: relative;
    overflow: hidden;
  }
  .uc-card:hover {
    border-color: rgba(79,123,255,0.35);
    transform: translateY(-3px);
    box-shadow: 0 20px 60px rgba(79,123,255,0.08);
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .badge-blue   { background: rgba(79,123,255,0.14); color: #4f7bff; border: 1px solid rgba(79,123,255,0.25); }
  .badge-purple { background: rgba(155,91,255,0.14); color: #9b5bff; border: 1px solid rgba(155,91,255,0.25); }
  .badge-green  { background: rgba(52,211,153,0.14); color: #34d399; border: 1px solid rgba(52,211,153,0.25); }
  .badge-pink   { background: rgba(197,107,255,0.14); color: #c56bff; border: 1px solid rgba(197,107,255,0.25); }
  .tag {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    background: rgba(255,255,255,0.05);
    color: var(--dim);
    border: 1px solid var(--cb);
  }
  .divider {
    height: 1px;
    background: var(--cb);
    width: 100%;
  }
  .step-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--cb);
    font-size: 11px;
    font-weight: 600;
    color: var(--dim);
  }
  .cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 13px 28px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    transition: opacity 0.2s, transform 0.2s;
  }
  .cta-btn:hover { opacity: 0.88; transform: translateY(-1px); }
  .cta-primary { background: linear-gradient(90deg,#4f7bff,#9b5bff); color: #fff; }
  .cta-ghost   { background: rgba(255,255,255,0.06); color: #f5f6fa; border: 1px solid rgba(255,255,255,0.08); }
  @media (max-width: 768px) {
    .uc-card { padding: 22px 18px; }
    .hero-title { font-size: 32px !important; }
    .hero-sub { font-size: 15px !important; }
    .grid-2 { grid-template-columns: 1fr !important; }
  }
`;

const LogoMark = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="url(#lm1)"/>
    <path d="M9 23V12l7-4 7 4v11l-7 4-7-4z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M9 12l7 4 7-4M16 16v7" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
    <defs>
      <linearGradient id="lm1" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4f7bff"/>
        <stop offset="1" stopColor="#9b5bff"/>
      </linearGradient>
    </defs>
  </svg>
);

interface UseCase {
  icon: React.ReactNode;
  number: string;
  title: string;
  badgeLabel: string;
  badgeClass: string;
  accentColor: string;
  problem: string;
  solution: string;
  detail?: string;
  steps?: { label: string; color: string }[];
  tags: string[];
}

const useCases: UseCase[] = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6L12 2z" stroke="#4f7bff" strokeWidth="1.6" strokeLinejoin="round"/>
        <path d="M9 12l2 2 4-4" stroke="#4f7bff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    number: '01',
    title: 'AI Bot & Deepfake Protection',
    badgeLabel: 'Proof of Humanity',
    badgeClass: 'badge-blue',
    accentColor: '#4f7bff',
    problem: 'LLMs generate human-like text and auto-fill forms at scale. Traditional CAPTCHAs are fully broken by modern vision models and CAPTCHA-solving services.',
    solution: 'Proof-of-Humanity via Groth16 ZK-SNARK + TensorFlow.js FaceMesh liveness check. Platforms require a valid MGSID Soulbound Token to allow posting, voting, or account creation.',
    detail: '4-step liveness sequence (Center → Turn Left → Turn Right → Blink) generates landmark coordinates hashed locally using poseidon_sim_hash. A ZK proof is generated in-browser and verified on-chain via Groth16Verifier.sol. A non-transferable SBT is minted as the proof result.',
    steps: [
      { label: 'Center', color: '#4f7bff' },
      { label: 'Turn Left', color: '#9b5bff' },
      { label: 'Turn Right', color: '#c56bff' },
      { label: 'Blink', color: '#34d399' },
    ],
    tags: ['ZK-SNARK', 'FaceMesh', 'SBT', 'Groth16', 'EAR Detection'],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="8" width="18" height="13" rx="2" stroke="#9b5bff" strokeWidth="1.6"/>
        <path d="M7 8V6a5 5 0 0110 0v2" stroke="#9b5bff" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M9 14l2 2 4-4" stroke="#9b5bff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    number: '02',
    title: 'Sybil-Resistant DAO Voting',
    badgeLabel: 'Governance',
    badgeClass: 'badge-purple',
    accentColor: '#9b5bff',
    problem: 'A single actor can create thousands of wallets to manipulate DAO governance — a fundamental Sybil attack that undermines decentralized democracy.',
    solution: '"One wallet = one SBT" enforced at the protocol level. The Bloom filter combined with the usedNullifiers mapping in IdentityRegistry.sol prevents any address from registering twice.',
    detail: 'Each wallet can hold exactly one MGSID token. DAOs gate voting rights on MGSID ownership without collecting personal data. True on-chain "one person, one vote" semantics — enforced by cryptography, not trust.',
    tags: ['Nullifier', 'DAO', 'IdentityRegistry', 'ERC-5192', 'Bloom Filter'],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#34d399" strokeWidth="1.6"/>
        <path d="M8 12s1.5-2 4-2 4 2 4 2" stroke="#34d399" strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="12" cy="15" r="2" fill="#34d399"/>
      </svg>
    ),
    number: '03',
    title: 'Privacy-Preserving KYC',
    badgeLabel: 'Privacy',
    badgeClass: 'badge-green',
    accentColor: '#34d399',
    problem: 'Traditional KYC uploads passport photos and documents to third-party servers. A single database breach permanently exposes millions of identities.',
    solution: 'ZK proof proves "I am a unique human" without revealing name, face, photo, or any personal data. No document uploads required. The biometric hash never leaves the user\'s browser.',
    detail: 'The poseidon_sim_hash of FaceMesh landmark coordinates is computed in-browser. Only the ZK proof and its 4 public signals are submitted on-chain. The user\'s raw biometric data exists only in browser memory during verification — it is never stored or transmitted.',
    tags: ['ZK Proof', 'Poseidon Hash', 'Browser-Only', 'No Data Upload', 'Circom'],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="8" cy="12" r="4" stroke="#4f7bff" strokeWidth="1.6"/>
        <path d="M12 12h8M18 10v4" stroke="#4f7bff" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    number: '04',
    title: 'Passwordless Enterprise Login',
    badgeLabel: 'Authentication',
    badgeClass: 'badge-blue',
    accentColor: '#4f7bff',
    problem: 'Enterprise passwords are stolen via phishing, credential stuffing, and breaches. SSO providers like Google and Okta track employee login behavior at scale.',
    solution: 'SIWE-based authentication — employees sign a nonce challenge with their hardware or browser wallet. No password database exists. OAuth/OIDC endpoints integrate with existing enterprise systems on the Developer Plan.',
    detail: 'The SIWE flow: backend issues a nonce via POST /api/auth/nonce → user signs with wallet → POST /api/auth/verify returns session token. OAuth/OIDC endpoints allow drop-in replacement for Google/Okta SSO. Zero password attack surface. Cryptographic login proofs are non-replayable.',
    tags: ['SIWE', 'OAuth/OIDC', 'No Passwords', 'Enterprise', 'Nonce'],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#c56bff" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#c56bff" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    number: '05',
    title: 'Cross-Chain DeFi Identity',
    badgeLabel: 'Multi-Chain',
    badgeClass: 'badge-pink',
    accentColor: '#c56bff',
    problem: 'DeFi protocols are siloed by chain. A user verified on Polygon has no way to prove identity or reputation on Ethereum or Arbitrum without repeating the entire process.',
    solution: 'Chainlink CCIP synchronizes the Soulbound Token from the origin chain (Polygon Amoy) to Ethereum and Arbitrum. The relayer role in IdentityRegistry.sol calls syncCrossChain() to broadcast identity across all supported networks.',
    steps: [
      { label: 'Polygon Amoy', color: '#9b5bff' },
      { label: 'Ethereum', color: '#4f7bff' },
      { label: 'Arbitrum', color: '#34d399' },
    ],
    tags: ['Chainlink CCIP', 'Polygon Amoy', 'Ethereum', 'Arbitrum', 'syncCrossChain'],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="20" height="12" rx="4" stroke="#34d399" strokeWidth="1.6"/>
        <path d="M8 13h4M10 11v4M16 13h.01M18 13h.01" stroke="#34d399" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    number: '06',
    title: 'Metaverse & Gaming Identity',
    badgeLabel: 'SDK / Unity',
    badgeClass: 'badge-green',
    accentColor: '#34d399',
    problem: 'Game accounts are sold, shared, and botted. Players have no portable, verified identity that travels with them across virtual worlds and platforms.',
    solution: 'MetaGoSDK.cs (Unity C# SDK) integrates directly into Unity games. Players authenticate via SIWE through a WebSocket relay, receiving a DID and VRM avatar IPFS URI — all cryptographically linked to their sovereign identity.',
    detail: 'SDK flow: StartLogin() → OIDC browser popup → WebSocket listener on ws://localhost:8001/api/ws/game/{session_id} → auth_success payload received → MetaUserInfo deserialized {sub, did, handle, email, avatar, wallet_address} → VRM avatar loaded from IPFS.',
    tags: ['Unity SDK', 'SIWE', 'VRM Avatar', 'IPFS', 'DID', 'WebSocket'],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="14" height="17" rx="2" stroke="#9b5bff" strokeWidth="1.6"/>
        <path d="M7 9h6M7 13h4" stroke="#9b5bff" strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="18" cy="17" r="3" stroke="#9b5bff" strokeWidth="1.6"/>
      </svg>
    ),
    number: '07',
    title: 'Academic & Institutional Credentials',
    badgeLabel: 'Credentials',
    badgeClass: 'badge-purple',
    accentColor: '#9b5bff',
    problem: 'Paper diplomas can be forged. Digital certificates are stored in centralized institutional databases that can be shut down, hacked, or become permanently inaccessible.',
    solution: 'Institutions issue verifiable credentials as SBTs via CelestialSBT.sol. Tokens are non-transferable and permanently anchored to the student\'s wallet. CredentialVault.sol stores encrypted credential metadata on-chain.',
    detail: 'The SBT is locked via ERC-5192 — the locked() function always returns true and transfers are blocked at the _update() hook level. Approvals are fully disabled. Credentials are verifiable by anyone without contacting the issuing institution. Forgery is cryptographically impossible.',
    tags: ['CelestialSBT', 'CredentialVault', 'ERC-5192', 'Non-Transferable', 'On-Chain'],
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 4v5h5" stroke="#4f7bff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 9a8 8 0 1013.65-5.65L17 5" stroke="#4f7bff" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    number: '08',
    title: 'Social Account Recovery',
    badgeLabel: 'Recovery',
    badgeClass: 'badge-blue',
    accentColor: '#4f7bff',
    problem: 'A lost private key means permanent loss of identity, funds, credentials, and digital life — with zero recourse. There is no "forgot password" for a blockchain wallet.',
    solution: 'Social Recovery with minimum 3 guardians via setupRecovery() in IdentityRegistry.sol. When a key is lost, 2 of 3 guardians approve via approveRecovery(). The contract migrates the identity and SBT to the new wallet. No company involvement required.',
    detail: 'Guardian setup: minimum 3 addresses stored in IdentityRegistry.sol. Recovery flow: initiateRecovery() → each guardian calls approveRecovery() tracked in hasApproved mapping → at 2/3 threshold, identity migrates atomically. PassphraseHash stored on-chain prevents unauthorized recovery initiation.',
    steps: [
      { label: 'Setup Guardians', color: '#4f7bff' },
      { label: 'Initiate Recovery', color: '#9b5bff' },
      { label: '2/3 Approve', color: '#c56bff' },
      { label: 'Migrated', color: '#34d399' },
    ],
    tags: ['Social Recovery', '2/3 Threshold', 'IdentityRegistry', 'Guardian Consensus'],
  },
];

export default function UseCasesPage() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <>
      <style>{css}</style>
      <div style={{ background: '#06070d', minHeight: '100vh', color: '#f5f6fa' }}>

        {/* ── NAV ── */}
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: 'rgba(6,7,13,0.82)', backdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
              <LogoMark />
              <span style={{ fontWeight: 700, fontSize: 16, color: '#f5f6fa' }}>Meta<span style={{ color: '#4f7bff' }}>Go</span></span>
            </Link>
            <div style={{ display: 'flex', gap: 28 }}>
              <Link href="/developers" style={{ fontSize: 12, fontWeight: 600, color: '#979bb0', textDecoration: 'none', letterSpacing: '0.04em' }}>Developers</Link>
              <Link href="/docs" style={{ fontSize: 12, fontWeight: 600, color: '#979bb0', textDecoration: 'none', letterSpacing: '0.04em' }}>Docs</Link>
              <Link href="/about" style={{ fontSize: 12, fontWeight: 600, color: '#979bb0', textDecoration: 'none', letterSpacing: '0.04em' }}>About</Link>
            </div>
            <Link href="/auth" style={{ padding: '7px 18px', background: 'linear-gradient(90deg,#4f7bff,#9b5bff)', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#fff', textDecoration: 'none' }}>Connect</Link>
          </div>
        </header>

        {/* ── HERO ── */}
        <section style={{ position: 'relative', paddingTop: 140, paddingBottom: 80, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            backgroundImage: 'linear-gradient(rgba(79,123,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(79,123,255,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: 800, height: 450,
            background: 'radial-gradient(ellipse, rgba(79,123,255,0.12) 0%, transparent 70%)',
            pointerEvents: 'none', zIndex: 0,
          }} />

          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div className="fade-up" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 20,
              background: 'rgba(79,123,255,0.1)', border: '1px solid rgba(79,123,255,0.25)',
              fontSize: 12, fontWeight: 700, color: '#4f7bff',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: 28,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4f7bff', display: 'inline-block' }} />
              Protocol Applications
            </div>

            <h1 className="fade-up fade-up-1 hero-title" style={{
              fontSize: 52, fontWeight: 800, lineHeight: 1.1,
              letterSpacing: '-0.03em', marginBottom: 24,
              background: 'linear-gradient(135deg, #f5f6fa 40%, #979bb0)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Real-World Applications<br />of Sovereign Identity
            </h1>
            <p className="fade-up fade-up-2 hero-sub" style={{
              fontSize: 18, color: '#979bb0', maxWidth: 640, margin: '0 auto 52px',
              lineHeight: 1.7,
            }}>
              Meta Go's zero-knowledge biometric identity protocol enables use cases that were previously impossible without sacrificing privacy.
            </p>

            <div className="fade-up fade-up-3" style={{ display: 'flex', justifyContent: 'center', gap: 56, flexWrap: 'wrap' }}>
              {[
                { value: '8', label: 'Use Cases' },
                { value: 'ZK', label: 'Privacy Preserving' },
                { value: '3+', label: 'Supported Chains' },
                { value: '0', label: 'Data Exposed' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 30, fontWeight: 800, background: 'linear-gradient(90deg, #4f7bff, #9b5bff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#63677c', fontWeight: 600, marginTop: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── USE CASE CARDS ── */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
          <div className="grid-2" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 24,
          }}>
            {useCases.map((uc, i) => {
              const isExpanded = expanded === i;
              return (
                <div key={i} className="uc-card fade-up" style={{ animationDelay: `${0.05 * i}s` }}>
                  {/* Accent top bar */}
                  <div style={{
                    position: 'absolute', top: 0, left: 24, right: 24, height: 1,
                    background: `linear-gradient(90deg, transparent, ${uc.accentColor}55, transparent)`,
                  }} />

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: `${uc.accentColor}14`,
                        border: `1px solid ${uc.accentColor}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {uc.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#63677c', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 3 }}>
                          CASE {uc.number}
                        </div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f5f6fa', lineHeight: 1.3 }}>
                          {uc.title}
                        </h3>
                      </div>
                    </div>
                    <span className={`badge ${uc.badgeClass}`} style={{ flexShrink: 0, marginTop: 2 }}>
                      {uc.badgeLabel}
                    </span>
                  </div>

                  {/* Problem */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#ff6b6b', letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M12 2L2 20h20L12 2z" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      THE PROBLEM
                    </div>
                    <p style={{ fontSize: 13.5, color: '#979bb0', lineHeight: 1.65 }}>
                      {uc.problem}
                    </p>
                  </div>

                  {/* Solution */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: uc.accentColor, letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke={uc.accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      META GO SOLUTION
                    </div>
                    <p style={{ fontSize: 13.5, color: '#f5f6fa', lineHeight: 1.65, opacity: 0.88 }}>
                      {uc.solution}
                    </p>
                  </div>

                  {/* Step chips */}
                  {uc.steps && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {uc.steps.map((step, si) => (
                        <span key={si} className="step-chip">
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: step.color, display: 'inline-block' }} />
                          {step.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expandable detail */}
                  {uc.detail && (
                    <>
                      <button
                        onClick={() => setExpanded(isExpanded ? null : i)}
                        style={{
                          all: 'unset', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          fontSize: 12, fontWeight: 600, color: '#4f7bff',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                          <path d="M6 9l6 6 6-6" stroke="#4f7bff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {isExpanded ? 'Hide technical detail' : 'How it works'}
                      </button>
                      {isExpanded && (
                        <div style={{
                          background: 'rgba(79,123,255,0.05)',
                          border: '1px solid rgba(79,123,255,0.15)',
                          borderRadius: 10, padding: '14px 18px',
                          fontSize: 13, color: '#979bb0', lineHeight: 1.75,
                          marginTop: -8,
                        }}>
                          {uc.detail}
                        </div>
                      )}
                    </>
                  )}

                  <div className="divider" />

                  {/* Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {uc.tags.map(t => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── IDENTITY LIFECYCLE BANNER ── */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(79,123,255,0.07) 0%, rgba(155,91,255,0.07) 100%)',
            border: '1px solid rgba(79,123,255,0.18)',
            borderRadius: 20, padding: '48px',
            textAlign: 'center',
          }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>
              One Identity. Every Use Case.
            </h2>
            <p style={{ fontSize: 15, color: '#979bb0', maxWidth: 540, margin: '0 auto 40px', lineHeight: 1.7 }}>
              A single biometric proof generates a sovereign identity that works across every scenario above — with zero personal data exposed.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0, marginBottom: 40 }}>
              {[
                { step: 'Wallet Connect', icon: '🔗' },
                { step: 'SIWE Sign', icon: '✍️' },
                { step: 'FaceMesh Liveness', icon: '👁' },
                { step: 'ZK Proof', icon: '🔐' },
                { step: 'SBT Minted', icon: '🏅' },
                { step: 'Cross-Chain Sync', icon: '⛓' },
              ].map((s, i, arr) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center', padding: '0 14px' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'linear-gradient(90deg,#4f7bff,#9b5bff)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, margin: '0 auto 10px',
                    }}>{s.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#979bb0', whiteSpace: 'nowrap' }}>{s.step}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ width: 32, height: 1, background: 'linear-gradient(90deg, #4f7bff55, #9b5bff55)', flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
              <Link href="/try" className="cta-btn cta-primary">
                Verify Your Identity
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
              <Link href="/developers" className="cta-btn cta-ghost">
                Integrate the SDK
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '40px 0 24px', marginTop: 80 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <span style={{ fontSize: 12, color: '#63677c' }}>© 2024 Meta Go Labs. All rights reserved.</span>
            <div style={{ display: 'flex', gap: 24 }}>
              <Link href="/privacy" style={{ fontSize: 12, color: '#63677c', textDecoration: 'none' }}>Privacy</Link>
              <Link href="/terms" style={{ fontSize: 12, color: '#63677c', textDecoration: 'none' }}>Terms</Link>
              <Link href="/security" style={{ fontSize: 12, color: '#63677c', textDecoration: 'none' }}>Security</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
