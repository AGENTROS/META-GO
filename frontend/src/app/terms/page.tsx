'use client';

import Link from 'next/link';

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
  html { scroll-behavior: smooth; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
  }
  a { color: var(--blue); }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 14px;
    border-radius: 999px;
    border: 1px solid rgba(79,123,255,0.28);
    background: rgba(79,123,255,0.08);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--blue);
    margin-bottom: 20px;
    text-transform: uppercase;
  }

  .toc-link {
    display: block;
    padding: 7px 0;
    font-size: 13px;
    color: var(--dim);
    text-decoration: none;
    border-left: 2px solid transparent;
    padding-left: 14px;
    transition: color 0.18s, border-color 0.18s;
  }
  .toc-link:hover {
    color: var(--text);
    border-left-color: var(--blue);
  }

  .section-card {
    background: var(--card);
    border: 1px solid var(--cb);
    border-radius: 14px;
    padding: 32px 36px;
    margin-bottom: 18px;
    transition: border-color 0.2s;
  }
  .section-card:hover {
    border-color: rgba(79,123,255,0.22);
  }

  .section-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: rgba(79,123,255,0.14);
    font-size: 12px;
    font-weight: 800;
    color: var(--blue);
    margin-right: 12px;
    flex-shrink: 0;
  }

  .section-title {
    font-size: 17px;
    font-weight: 700;
    color: var(--text);
    display: flex;
    align-items: center;
    margin-bottom: 14px;
  }

  .section-body {
    font-size: 14px;
    color: var(--dim);
    line-height: 1.8;
    padding-left: 40px;
  }

  .section-body strong {
    color: var(--text);
    font-weight: 600;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    margin-left: 8px;
    letter-spacing: 0.04em;
  }
  .chip-green { background: rgba(52,211,153,0.12); color: #34d399; }
  .chip-amber { background: rgba(245,158,11,0.12); color: #f59e0b; }
  .chip-red   { background: rgba(239,68,68,0.12);  color: #ef4444; }
  .chip-blue  { background: rgba(79,123,255,0.12); color: var(--blue); }

  .notice-box {
    border-radius: 10px;
    padding: 16px 20px;
    font-size: 13px;
    color: var(--dim);
    margin-bottom: 32px;
    border: 1px solid;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    line-height: 1.7;
  }
  .notice-box.amber {
    background: rgba(245,158,11,0.07);
    border-color: rgba(245,158,11,0.22);
    color: #d4a017;
  }

  @media(max-width: 900px) {
    .layout { flex-direction: column !important; }
    .toc-sidebar { display: none !important; }
    .main-col { max-width: 100% !important; }
    .section-card { padding: 22px 18px !important; }
    .section-body { padding-left: 0 !important; }
  }
`;

const LogoMark = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <rect width="26" height="26" rx="7" fill="url(#lg)" />
    <path d="M7 19V10l6-3 6 3v9" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 19v-5h6v5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="lg" x1="0" y1="0" x2="26" y2="26" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4f7bff" />
        <stop offset="1" stopColor="#9b5bff" />
      </linearGradient>
    </defs>
  </svg>
);

const sections = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    chip: null,
    body: (
      <>
        By connecting your wallet, initiating the SIWE (Sign-In With Ethereum) flow, or otherwise accessing Meta Go, you unconditionally agree to be bound by these Terms of Service. If you do not agree to any part of these terms, you must immediately cease use of the protocol. These terms form a binding legal agreement between you and Meta Go Labs.
      </>
    ),
  },
  {
    id: 'non-custodial',
    title: 'Non-Custodial Protocol',
    chip: { label: 'Self-Sovereign', style: 'chip-green' },
    body: (
      <>
        Meta Go is a <strong>fully non-custodial protocol</strong>. At no point does Meta Go Labs hold, control, store, or have any access to your private keys, seed phrases, wallet funds, or signing credentials. All cryptographic operations — including SIWE nonce signing and ZK proof generation — are performed entirely within your own environment. You are solely and exclusively responsible for the security of your wallet. Loss of access to your private key constitutes permanent loss of identity control unless social recovery has been configured.
      </>
    ),
  },
  {
    id: 'identity',
    title: 'Identity Registration',
    chip: { label: 'On-Chain', style: 'chip-blue' },
    body: (
      <>
        When you complete the identity registration flow — including biometric verification and ZK proof submission — a <strong>Soulbound Token (SBT)</strong> is minted to your wallet address on the active chain (Polygon Amoy, Ethereum, or Arbitrum). This token is issued under the <strong>CelestialSBT contract</strong> ("Meta Go Sovereign ID", symbol: MGSID) and is non-transferable per the <strong>ERC-5192</strong> standard. Transfers and approvals are disabled at the Solidity hook level. Your <strong>handle</strong> and <strong>Decentralized Identifier (DID)</strong> are permanently anchored to your wallet address via the IdentityRegistry contract. This action is <strong>irreversible</strong>.
      </>
    ),
  },
  {
    id: 'recovery',
    title: 'Social Recovery',
    chip: { label: '2-of-3 Consensus', style: 'chip-amber' },
    body: (
      <>
        You may optionally configure social recovery through the Meta Go dashboard by nominating a <strong>minimum of 3 guardians</strong>. Recovery of your identity requires <strong>2-of-3 guardian consensus</strong> as mediated by the IdentityRegistry smart contract. A passphrase hash is stored on-chain. Meta Go Labs is not a party to your recovery configuration and is not responsible for loss of access in the event that guardians become unavailable, collude, or refuse to participate. Loss of your passphrase cannot be remedied by Meta Go Labs. We strongly recommend maintaining guardian contact details securely and independently.
      </>
    ),
  },
  {
    id: 'zkp',
    title: 'Zero-Knowledge Proofs & Biometrics',
    chip: { label: 'Privacy Preserving', style: 'chip-green' },
    body: (
      <>
        By using the biometric registration flow, you consent to the <strong>local, in-browser computation</strong> of facial landmark hashes using TensorFlow.js FaceMesh. No webcam stream, image, video, or raw biometric data is ever transmitted to Meta Go servers. The browser computes a deterministic <strong>Poseidon hash commitment</strong> from landmark coordinates. This commitment is used to generate a <strong>Groth16 BN128 ZK proof</strong> (via Circom / snarkjs) which is submitted to the backend solely to verify uniqueness via the nullifier system. The resulting proof is verified on-chain by <strong>Groth16Verifier.sol</strong>. Used nullifiers are permanently recorded to prevent duplicate registrations.
      </>
    ),
  },
  {
    id: 'subscriptions',
    title: 'Subscription Services',
    chip: { label: 'Billing', style: 'chip-blue' },
    body: (
      <>
        Meta Go offers the following plans: <strong>Free</strong> ($0/month, 10 verifications/month), <strong>Developer</strong> ($49/month, 5,000 verifications/month, full API access, OAuth/OIDC integration), and <strong>Enterprise</strong> (custom pricing, unlimited verifications, SLA guarantees, GDPR/SOC2 compliance packs). Paid subscriptions are billed in advance on a monthly basis. <strong>Refunds are not available for used verification credits.</strong> Unused credits do not roll over between billing periods unless otherwise stated in your Enterprise agreement. You are responsible for all charges incurred under your account.
      </>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable Use',
    chip: { label: 'Enforcement', style: 'chip-red' },
    body: (
      <>
        You may not use Meta Go to create <strong>duplicate, fraudulent, or synthetic identities</strong>. The protocol enforces uniqueness at the cryptographic layer via a nullifier system and Bloom filter — each biometric commitment may only be registered once. Attempts to circumvent these controls, including submission of manipulated landmark data, fabricated ZK proofs, or replay of used nullifiers, constitute a material breach of these terms and will result in immediate account suspension, revocation of the associated SBT, and potential reporting to relevant authorities. You may not use Meta Go for any unlawful purpose or in violation of any applicable laws or regulations.
      </>
    ),
  },
  {
    id: 'immutability',
    title: 'Blockchain Immutability',
    chip: { label: 'Irreversible', style: 'chip-amber' },
    body: (
      <>
        All on-chain actions executed through Meta Go — including identity registration, SBT minting, guardian configuration, and recovery operations — are <strong>irreversible by nature of blockchain technology</strong>. Meta Go Labs does not have administrative keys to reverse, modify, or delete on-chain state after confirmation. You acknowledge and accept that blockchain transactions are final. Cross-chain synchronization via <strong>Chainlink CCIP</strong> is similarly irreversible once confirmed across connected networks (Polygon Amoy, Ethereum, Arbitrum).
      </>
    ),
  },
  {
    id: 'warranties',
    title: 'Disclaimer of Warranties',
    chip: null,
    body: (
      <>
        Meta Go is provided <strong>"as is"</strong> and <strong>"as available"</strong> without warranties of any kind, express or implied. Meta Go Labs expressly disclaims all warranties, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the protocol will be available 100% of the time, free from errors or bugs, or that smart contracts are free from vulnerabilities. Use of this protocol is entirely at your own risk.
      </>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    chip: null,
    body: (
      <>
        To the fullest extent permitted by applicable law, Meta Go Labs, its officers, directors, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from: loss of private keys or seed phrases; smart contract vulnerabilities or exploits; blockchain network failures, congestion, or forks; third-party guardian actions; biometric computation errors; or any unauthorized access to your wallet. Our aggregate liability to you for any direct damages shall not exceed the total fees paid by you to Meta Go Labs in the 12 months preceding the claim.
      </>
    ),
  },
  {
    id: 'modifications',
    title: 'Modifications to Terms',
    chip: null,
    body: (
      <>
        Meta Go Labs reserves the right to update or modify these Terms of Service at any time. When material changes are made, we will update the "Last Updated" date at the top of this page. In cases of significant changes, we may provide additional notice via the platform dashboard or registered contact methods. <strong>Continued use of the protocol after any modifications constitutes your acceptance of the revised terms.</strong> It is your responsibility to review these terms periodically. If you disagree with any changes, you must discontinue use of the protocol immediately.
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <>
      <style>{css}</style>

      {/* ── Nav ── */}
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

      {/* ── Main ── */}
      <main style={{ paddingTop: 100, paddingBottom: 60, minHeight: '100vh' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

          {/* Hero */}
          <div style={{ maxWidth: 720, margin: '0 auto 52px', textAlign: 'center' }}>
            <div className="hero-badge">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1L7.5 4.5H11L8.25 6.75L9.25 10.5L6 8.25L2.75 10.5L3.75 6.75L1 4.5H4.5L6 1Z" fill="#4f7bff" />
              </svg>
              Legal
            </div>
            <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.02em' }}>
              Terms of{' '}
              <span style={{ background: 'linear-gradient(90deg,#4f7bff,#9b5bff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Service
              </span>
            </h1>
            <p style={{ fontSize: 15, color: '#979bb0', lineHeight: 1.7, marginBottom: 20 }}>
              These terms govern your use of the Meta Go non-custodial identity protocol. Please read them carefully before connecting your wallet.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: '#63677c' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#63677c" strokeWidth="1.2"/><path d="M7 4v3.5l2 1.5" stroke="#63677c" strokeWidth="1.2" strokeLinecap="round"/></svg>
              Last Updated: July 2024
            </div>
          </div>

          {/* Warning notice */}
          <div style={{ maxWidth: 900, margin: '0 auto 40px' }}>
            <div className="notice-box amber">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M9 2L16.5 15H1.5L9 2Z" stroke="#f59e0b" strokeWidth="1.4" strokeLinejoin="round"/>
                <path d="M9 7v4" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round"/>
                <circle cx="9" cy="13" r="0.6" fill="#f59e0b"/>
              </svg>
              <span>
                <strong style={{ color: '#f59e0b' }}>Important: </strong>
                On-chain actions including identity registration, SBT minting, and recovery configuration are irreversible. By connecting your wallet, you accept these terms in full.
              </span>
            </div>
          </div>

          {/* Layout: sidebar TOC + main content */}
          <div className="layout" style={{ display: 'flex', gap: 40, alignItems: 'flex-start', maxWidth: 1100, margin: '0 auto' }}>

            {/* TOC Sidebar */}
            <aside className="toc-sidebar" style={{ width: 220, flexShrink: 0, position: 'sticky', top: 80 }}>
              <div style={{ background: 'var(--card)', border: '1px solid var(--cb)', borderRadius: 12, padding: '20px 16px' }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--faint)', textTransform: 'uppercase', marginBottom: 12, paddingLeft: 14 }}>Contents</p>
                {sections.map((s, i) => (
                  <a key={s.id} href={`#${s.id}`} className="toc-link">
                    <span style={{ color: 'var(--faint)', marginRight: 6, fontSize: 11 }}>{String(i + 1).padStart(2, '0')}.</span>
                    {s.title}
                  </a>
                ))}
              </div>
            </aside>

            {/* Main Sections */}
            <div className="main-col" style={{ flex: 1, maxWidth: 860 }}>
              {sections.map((s, i) => (
                <div key={s.id} id={s.id} className="section-card">
                  <div className="section-title">
                    <span className="section-num">{i + 1}</span>
                    {s.title}
                    {s.chip && <span className={`chip ${s.chip.style}`}>{s.chip.label}</span>}
                  </div>
                  <p className="section-body">{s.body}</p>
                </div>
              ))}

              {/* Contact row */}
              <div style={{ marginTop: 32, padding: '24px 28px', background: 'linear-gradient(135deg, rgba(79,123,255,0.08), rgba(155,91,255,0.06))', border: '1px solid rgba(79,123,255,0.2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Questions about these terms?</p>
                  <p style={{ fontSize: 13, color: 'var(--dim)' }}>Contact the Meta Go Labs legal team for clarification on any section.</p>
                </div>
                <a href="mailto:legal@metago.xyz" style={{ padding: '9px 20px', background: 'linear-gradient(90deg,#4f7bff,#9b5bff)', borderRadius: 9, fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  Contact Legal
                </a>
              </div>

              {/* Related links */}
              <div style={{ marginTop: 18, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <Link href="/privacy" style={{ flex: 1, minWidth: 160, padding: '16px 20px', background: 'var(--card)', border: '1px solid var(--cb)', borderRadius: 12, textDecoration: 'none', display: 'block' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Privacy Policy →</p>
                  <p style={{ fontSize: 12, color: 'var(--dim)' }}>How we handle data and biometric privacy</p>
                </Link>
                <Link href="/security" style={{ flex: 1, minWidth: 160, padding: '16px 20px', background: 'var(--card)', border: '1px solid var(--cb)', borderRadius: 12, textDecoration: 'none', display: 'block' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Security Architecture →</p>
                  <p style={{ fontSize: 12, color: 'var(--dim)' }}>ZK proofs, SIWE, and SBT security model</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '40px 0 24px', marginTop: 80 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontSize: 12, color: '#63677c' }}>© 2024 Meta Go Labs. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/privacy" style={{ fontSize: 12, color: '#63677c', textDecoration: 'none' }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize: 12, color: '#4f7bff', textDecoration: 'none', fontWeight: 600 }}>Terms</Link>
            <Link href="/security" style={{ fontSize: 12, color: '#63677c', textDecoration: 'none' }}>Security</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
