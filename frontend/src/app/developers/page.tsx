'use client';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';

export default function DevelopersPage() {
  const css = `
    :root { --bg:#06070d; --card:#0f111c; --cb:rgba(255,255,255,0.08); --text:#f5f6fa; --dim:#979bb0; --faint:#63677c; --blue:#4f7bff; --purple:#9b5bff; --grad:linear-gradient(90deg,#4f7bff,#9b5bff); }
    .dev-body { background:var(--bg); color:var(--text); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; -webkit-font-smoothing:antialiased; min-height:100vh; }
    .dev-wrap { max-width:1100px; margin:0 auto; padding:40px; }
    .dev-grad { background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; }
    .dev-eyebrow { font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--purple); margin-bottom:12px; }
    .dev-hero { padding:80px 0 56px; border-bottom:1px solid rgba(255,255,255,0.06); margin-bottom:60px; }
    .dev-hero h1 { font-size:46px; font-weight:800; line-height:1.1; letter-spacing:-0.02em; margin-bottom:16px; }
    .dev-hero p { font-size:16px; color:var(--dim); line-height:1.65; max-width:560px; margin-bottom:30px; }
    .dev-badges { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:36px; }
    .dev-badge { display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:20px; font-size:12px; font-weight:600; border:1px solid rgba(79,123,255,0.25); background:rgba(79,123,255,0.08); color:#8fb4ff; }
    .dev-ctas { display:flex; gap:14px; flex-wrap:wrap; }
    .dev-btn { display:inline-flex; align-items:center; gap:7px; padding:11px 22px; border-radius:9px; font-size:14px; font-weight:600; cursor:pointer; border:none; transition:all .2s; font-family:inherit; text-decoration:none; }
    .dev-btn-primary { background:var(--grad); color:#fff; box-shadow:0 4px 16px rgba(107,91,255,0.35); }
    .dev-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 22px rgba(107,91,255,0.55); }
    .dev-btn-outline { background:transparent; color:var(--text); border:1px solid rgba(255,255,255,0.16); }
    .dev-btn-outline:hover { border-color:rgba(255,255,255,0.32); background:rgba(255,255,255,0.04); }
    .dev-section-title { font-size:22px; font-weight:800; letter-spacing:-0.01em; margin-bottom:24px; }
    .dev-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:60px; }
    .dev-card { background:var(--card); border:1px solid var(--cb); border-radius:16px; padding:24px; transition:border-color .2s,transform .2s; }
    .dev-card:hover { border-color:rgba(155,91,255,0.4); transform:translateY(-2px); }
    .dev-card-icon { width:40px; height:40px; border-radius:11px; background:rgba(107,91,255,0.12); border:1px solid rgba(107,91,255,0.22); display:flex; align-items:center; justify-content:center; margin-bottom:18px; font-size:18px; }
    .dev-card h3 { font-size:15px; font-weight:700; margin-bottom:8px; }
    .dev-card p { font-size:13px; color:var(--dim); line-height:1.6; margin-bottom:16px; }
    .dev-card-link { font-size:12px; color:var(--purple); font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:4px; }
    .dev-card-link:hover { color:#c56bff; }
    .dev-code-block { background:#090b12; border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:24px; font-family:monospace; font-size:13px; color:#c9d1d9; line-height:1.7; margin-bottom:60px; overflow-x:auto; }
    .dev-code-block .co { color:#8b949e; }
    .dev-code-block .kw { color:#79c0ff; }
    .dev-code-block .st { color:#a5d6ff; }
    .dev-code-block .fn { color:#d2a8ff; }
    .dev-code-block .nu { color:#f0883e; }
    .dev-sdk-row { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; margin-bottom:60px; }
    .dev-sdk-card { background:var(--card); border:1px solid var(--cb); border-radius:14px; padding:20px; display:flex; align-items:center; gap:16px; transition:border-color .2s; }
    .dev-sdk-card:hover { border-color:rgba(79,123,255,0.35); }
    .dev-sdk-icon { width:44px; height:44px; border-radius:10px; background:rgba(255,255,255,0.04); border:1px solid var(--cb); display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
    .dev-sdk-card h4 { font-size:14px; font-weight:700; margin-bottom:4px; }
    .dev-sdk-card p { font-size:12px; color:var(--dim); }
    .dev-sdk-card a { font-size:12px; color:var(--purple); font-weight:600; text-decoration:none; }
    @media(max-width:768px){ .dev-grid{grid-template-columns:1fr;} .dev-sdk-row{grid-template-columns:1fr;} .dev-hero h1{font-size:32px;} .dev-wrap{padding:20px;} }
  `;

  return (
    <div className="dev-body">
      <style>{css}</style>
      <Navbar />
      <div className="dev-wrap">

        {/* Hero */}
        <div className="dev-hero">
          <div className="dev-eyebrow">Developer Platform</div>
          <h1>Build on <span className="dev-grad">MetaGo Protocol.</span></h1>
          <p>
            Everything you need to integrate sovereign identity into your application.
            Open APIs, battle-tested SDKs, and deep documentation.
          </p>
          <div className="dev-badges">
            <span className="dev-badge">⚡ REST API</span>
            <span className="dev-badge">🔗 WebSocket</span>
            <span className="dev-badge">🔐 SIWE Auth</span>
            <span className="dev-badge">🪪 W3C DID</span>
            <span className="dev-badge">🔮 ZK Proofs</span>
            <span className="dev-badge">⛓️ 12 Chains</span>
          </div>
          <div className="dev-ctas">
            <Link href="/docs" className="dev-btn dev-btn-primary">
              API Reference
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="dev-btn dev-btn-outline">
              GitHub
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9c0-1.1.4-1.8.8-2.2-2.7-.3-5.6-1.4-5.6-6.1 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.4 1.2a11.6 11.6 0 0 1 6.2 0c2.4-1.5 3.4-1.2 3.4-1.2.6 1.7.2 3 .1 3.3.8.8 1.2 1.9 1.2 3.2 0 4.7-2.9 5.8-5.6 6.1.4.4.8 1.2.8 2.4V22"/></svg>
            </a>
          </div>
        </div>

        {/* Quick Start */}
        <div className="dev-section-title">Quick Start</div>
        <div className="dev-code-block">
          <div><span className="co"># 1. Get a nonce for wallet sign-in</span></div>
          <div><span className="kw">GET</span> <span className="st">{`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8005'}/api/auth/nonce`}</span></div>
          <br />
          <div><span className="co"># 2. Sign with wallet (SIWE) and verify</span></div>
          <div><span className="kw">POST</span> <span className="st">/api/auth/verify</span></div>
          <div><span className="co">{`  { "message": "<siwe_msg>", "signature": "0x..." }`}</span></div>
          <br />
          <div><span className="co"># 3. Sync identity to backend</span></div>
          <div><span className="kw">POST</span> <span className="st">/api/user/sync</span></div>
          <div><span className="co">{`  { "handle": "alice", "did": "did:metago:...", "zkProof": {...} }`}</span></div>
          <br />
          <div><span className="co"># 4. Get authenticated user profile</span></div>
          <div><span className="kw">GET</span> <span className="st">/api/user/me</span></div>
        </div>

        {/* SDK Cards */}
        <div className="dev-section-title">SDKs & Integrations</div>
        <div className="dev-sdk-row">
          {[
            { icon: '🟨', name: 'JavaScript / TypeScript', desc: 'Full wagmi + viem integration. Works with Next.js, React, Vue.', badge: 'npm install @metago/sdk' },
            { icon: '🐍', name: 'Python', desc: 'FastAPI-ready client library for backend integrations.', badge: 'pip install metago-python' },
            { icon: '🦀', name: 'Rust', desc: 'High-performance identity verification and ZK proof generation.', badge: 'Coming Soon' },
            { icon: '☕', name: 'Java / Kotlin', desc: 'Android and JVM server-side identity integration.', badge: 'Coming Soon' },
          ].map((sdk, i) => (
            <div key={i} className="dev-sdk-card">
              <div className="dev-sdk-icon">{sdk.icon}</div>
              <div>
                <h4>{sdk.name}</h4>
                <p>{sdk.desc}</p>
                <a href="#" style={{ fontFamily: 'monospace', fontSize: 11 }}>{sdk.badge}</a>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="dev-section-title">Core Developer APIs</div>
        <div className="dev-grid">
          {[
            { icon: '🪪', title: 'DID Resolution', desc: 'W3C-compliant federated DID document resolver across multiple methods and chains.', href: '/docs' },
            { icon: '🔐', title: 'SIWE Authentication', desc: 'Sign-In With Ethereum. Stateless nonce issuance, signature verification and session management.', href: '/docs' },
            { icon: '🔮', title: 'ZK Proof Verification', desc: 'Server-side Groth16 zk-SNARK structural verification for privacy-preserving identity claims.', href: '/docs' },
            { icon: '🏅', title: 'Soulbound Tokens', desc: 'Issue and query non-transferable SBT credentials linked to an identity.', href: '/docs' },
            { icon: '⛓️', title: 'Cross-Chain Attestation', desc: 'Identity attestation status across all 12 supported EVM-compatible networks.', href: '/docs' },
            { icon: '📋', title: 'Verifiable Credentials', desc: 'Import, validate and verify W3C Verifiable Credential JSON payloads.', href: '/docs' },
          ].map((f, i) => (
            <div key={i} className="dev-card">
              <div className="dev-card-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <Link href={f.href} className="dev-card-link">
                Read docs →
              </Link>
            </div>
          ))}
        </div>

        {/* Base URL */}
        <div className="dev-section-title">Base URL</div>
        <div className="dev-code-block" style={{ marginBottom: 40 }}>
          <span className="kw">Base URL: </span>
          <span className="st">{process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8005'}/api</span>
          <br /><br />
          <span className="co"># Authentication: SIWE session cookie (HttpOnly)</span><br />
          <span className="co"># Rate Limiting: 5 req/min on relay endpoints</span><br />
          <span className="co"># Content-Type: application/json</span>
        </div>

        {/* Footer note */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 32, paddingBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ color: 'var(--faint)', fontSize: 13 }}>© 2024 Meta Go Labs — Developer Platform</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/" style={{ color: 'var(--dim)', fontSize: 13, textDecoration: 'none' }}>Home</Link>
            <Link href="/docs" style={{ color: 'var(--dim)', fontSize: 13, textDecoration: 'none' }}>API Reference</Link>
            <Link href="/dashboard" style={{ color: 'var(--dim)', fontSize: 13, textDecoration: 'none' }}>Dashboard</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
