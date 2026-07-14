'use client';
import Link from 'next/link';

const css = `
  :root{--bg:#06070d;--card:#0f111c;--cb:rgba(255,255,255,0.08);--text:#f5f6fa;--dim:#979bb0;--faint:#63677c;--blue:#4f7bff;--purple:#9b5bff;--green:#34d399;--grad:linear-gradient(90deg,#4f7bff,#9b5bff);}
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;}
  a{text-decoration:none;color:inherit;}
  .cr-wrap{max-width:1100px;margin:0 auto;padding:0 24px;}
  .cr-hero{padding:120px 0 64px;text-align:center;}
  .cr-eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:#8fb4ff;background:rgba(79,123,255,0.1);border:1px solid rgba(79,123,255,0.25);padding:6px 14px;border-radius:20px;margin-bottom:22px;}
  .cr-h1{font-size:44px;font-weight:800;letter-spacing:-0.02em;margin-bottom:16px;}
  .cr-grad{background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;}
  .cr-sub{font-size:16px;line-height:1.65;color:var(--dim);max-width:620px;margin:0 auto;}
  .cr-section{padding:0 0 72px;}
  .cr-sec-eyebrow{font-size:11px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:var(--purple);margin-bottom:10px;}
  .cr-sec-title{font-size:26px;font-weight:800;letter-spacing:-0.015em;margin-bottom:12px;}
  .cr-sec-desc{font-size:14.5px;color:var(--dim);line-height:1.65;max-width:600px;margin-bottom:36px;}
  .focus-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}
  .focus-card{background:var(--card);border:1px solid var(--cb);border-radius:14px;padding:24px;transition:border-color .2s,transform .2s;}
  .focus-card:hover{border-color:rgba(155,91,255,0.35);transform:translateY(-2px);}
  .focus-card h3{font-size:15px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:9px;}
  .focus-card p{font-size:13px;color:var(--dim);line-height:1.6;}
  .focus-tag{font-size:10px;padding:2px 8px;border-radius:4px;font-weight:600;}
  .tag-zk{background:rgba(155,91,255,0.12);border:1px solid rgba(155,91,255,0.25);color:#9b5bff;}
  .tag-sol{background:rgba(79,123,255,0.12);border:1px solid rgba(79,123,255,0.25);color:#4f7bff;}
  .tag-bio{background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.25);color:#34d399;}
  .tag-chain{background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.25);color:#fbbf24;}
  .tag-full{background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.25);color:#a855f7;}
  .values-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:48px;}
  .value-card{background:var(--card);border:1px solid var(--cb);border-radius:12px;padding:20px;text-align:center;}
  .value-card .icon{font-size:24px;margin-bottom:10px;}
  .value-card h4{font-size:13px;font-weight:700;margin-bottom:6px;}
  .value-card p{font-size:12px;color:var(--dim);line-height:1.5;}
  .notice-box{background:rgba(79,123,255,0.06);border:1px solid rgba(79,123,255,0.2);border-radius:14px;padding:24px 28px;margin-bottom:48px;}
  .notice-box p{font-size:14px;color:#a0aec0;line-height:1.7;}
  .cta-box{background:linear-gradient(160deg,#241a4a 0%,#171233 45%,#0a0b16 100%);border:1px solid rgba(155,91,255,0.25);border-radius:20px;padding:52px 40px;text-align:center;margin-bottom:48px;}
  .cta-box h2{font-size:26px;font-weight:800;margin-bottom:10px;}
  .cta-box p{font-size:15px;color:var(--dim);margin-bottom:24px;}
  .cr-btn{display:inline-flex;align-items:center;gap:9px;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;}
  .cr-btn-primary{background:var(--grad);color:#fff;box-shadow:0 4px 20px rgba(79,123,255,0.3);}
  @media(max-width:700px){.focus-grid,.values-row{grid-template-columns:1fr;}.cr-h1{font-size:30px;}}
`;

export default function CareersPage() {
  return (
    <div style={{ background:'#06070d',minHeight:'100vh',color:'#f5f6fa' }}>
      <style>{css}</style>
      {/* Nav */}
      <header style={{ position:'fixed',top:0,left:0,right:0,zIndex:100,background:'rgba(6,7,13,0.88)',backdropFilter:'blur(18px)',borderBottom:'1px solid rgba(255,255,255,0.08)',height:58,display:'flex',alignItems:'center' }}>
        <div style={{ maxWidth:1200,margin:'0 auto',padding:'0 28px',width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <Link href="/" style={{ display:'flex',alignItems:'center',gap:9 }}>
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" style={{ filter:'drop-shadow(0 0 5px rgba(107,91,255,0.5))' }}><defs><linearGradient id="cg" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#4f7bff"/><stop offset="55%" stopColor="#8f6bff"/><stop offset="100%" stopColor="#c56bff"/></linearGradient></defs><circle cx="16" cy="16" r="11" fill="url(#cg)"/><g stroke="#0b0d18" strokeWidth="0.9" opacity="0.5" fill="none"><ellipse cx="16" cy="16" rx="11" ry="4.2"/><ellipse cx="16" cy="16" rx="4.2" ry="11"/></g><ellipse cx="16" cy="17" rx="15" ry="5" transform="rotate(-16 16 17)" stroke="#dfe6ff" strokeWidth="1.1" fill="none" opacity="0.9"/></svg>
            <span style={{ fontWeight:700,fontSize:15,color:'#f5f6fa' }}>Meta<span style={{ color:'#4f7bff' }}>Go</span></span>
          </Link>
          <div style={{ display:'flex',gap:24,alignItems:'center' }}>
            <Link href="/docs" style={{ fontSize:12,fontWeight:600,color:'#979bb0',letterSpacing:'0.04em' }}>Docs</Link>
            <Link href="/about" style={{ fontSize:12,fontWeight:600,color:'#979bb0',letterSpacing:'0.04em' }}>About</Link>
            <Link href="/auth" style={{ padding:'6px 16px',background:'linear-gradient(90deg,#4f7bff,#9b5bff)',borderRadius:7,fontSize:12,fontWeight:700,color:'#fff' }}>Connect</Link>
          </div>
        </div>
      </header>

      <div className="cr-wrap">
        {/* Hero */}
        <div className="cr-hero">
          <div className="cr-eyebrow">🔬 Research &amp; Development</div>
          <h1 className="cr-h1">Build the Future of<br/><span className="cr-grad">Sovereign Identity</span></h1>
          <p className="cr-sub">Meta Go is building cryptographic infrastructure that protects users from password theft, identity leaks, and AI-generated fraud. We welcome researchers, engineers, and cryptographers.</p>
        </div>

        {/* Values */}
        <div className="cr-section">
          <p className="cr-sec-eyebrow">What We Believe</p>
          <div className="values-row">
            {[
              { icon:'🔐', title:'Zero Passwords', desc:'Cryptographic wallet signatures replace every password.' },
              { icon:'🛡', title:'Zero Tracking', desc:'No centralized login provider monitors your behavior.' },
              { icon:'🧬', title:'Zero Identity Leaks', desc:'Biometric data never leaves the user\'s browser.' },
              { icon:'👤', title:'User Sovereignty', desc:'You own your wallet. You own your DID. You own your identity.' },
            ].map((v, i) => (
              <div className="value-card" key={i}>
                <div className="icon">{v.icon}</div>
                <h4>{v.title}</h4>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Focus Areas */}
        <div className="cr-section">
          <p className="cr-sec-eyebrow">Focus Areas</p>
          <h2 className="cr-sec-title">Current Research &amp; Engineering</h2>
          <p className="cr-sec-desc">These are the active areas of development in the Meta Go protocol. We are looking for contributors with expertise in these domains.</p>
          <div className="focus-grid">
            {[
              { icon:'🔮', tag:'tag-zk', tagText:'Circom / Groth16', title:'Zero-Knowledge Proof Circuits', desc:'Optimize the identity.circom circuit — reduce constraint count, extend public signal inputs, explore Poseidon hash alternatives, and research recursive proof composition for multi-factor identity attestation.' },
              { icon:'⛓', tag:'tag-sol', tagText:'Solidity / OpenZeppelin', title:'Smart Contract Security', desc:'Audit and harden IdentityRegistry.sol (UUPS upgradeable, AccessControl, ReentrancyGuard) and CelestialSBT.sol (ERC-5192). Review social recovery flow — guardian consensus, hasApproved mapping, 2/3 threshold execution.' },
              { icon:'🧬', tag:'tag-bio', tagText:'TensorFlow.js', title:'Biometric Privacy Systems', desc:'Enhance the FaceMesh liveness pipeline — improve Eye Aspect Ratio (EAR) threshold calibration for diverse demographics, add eye-tracking, and research voice biometric integration as an additional liveness factor.' },
              { icon:'🌐', tag:'tag-chain', tagText:'Chainlink CCIP', title:'Cross-Chain Protocol Engineering', desc:'Extend Chainlink CCIP integration beyond Polygon Amoy, Ethereum, and Arbitrum. Research L2 rollup compatibility and non-EVM bridge adapters for universal identity portability.' },
              { icon:'💻', tag:'tag-full', tagText:'Next.js / FastAPI / wagmi', title:'Full-Stack Web3 Development', desc:'Build new frontend pages, improve the FastAPI backend (4000+ lines), enhance the Zustand identity store, and optimize the wagmi/viem wallet connection experience.' },
            ].map((f, i) => (
              <div className="focus-card" key={i}>
                <h3><span style={{ fontSize:18 }}>{f.icon}</span>{f.title}<span className={`focus-tag ${f.tag}`}>{f.tagText}</span></h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Open Source */}
        <div className="cr-section">
          <p className="cr-sec-eyebrow">Open Source</p>
          <h2 className="cr-sec-title">Contribute to the Codebase</h2>
          <div className="notice-box">
            <p>Meta Go is currently in the research and development phase. The full codebase — <code style={{ fontFamily:'monospace',color:'#4f7bff' }}>frontend/</code>, <code style={{ fontFamily:'monospace',color:'#4f7bff' }}>backend/</code>, <code style={{ fontFamily:'monospace',color:'#4f7bff' }}>contracts-hardhat/</code>, and <code style={{ fontFamily:'monospace',color:'#4f7bff' }}>sdk/</code> — is available for contribution. We welcome pull requests, security audit reports, and research proposals from the community.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="cta-box">
          <h2>Ready to Contribute?</h2>
          <p>Explore the codebase on GitHub and start building with us.</p>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="cr-btn cr-btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            View GitHub Repository
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.08)',padding:'32px 0 24px' }}>
        <div style={{ maxWidth:1100,margin:'0 auto',padding:'0 24px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16 }}>
          <span style={{ fontSize:12,color:'#63677c' }}>© 2024 Meta Go Labs. All rights reserved.</span>
          <div style={{ display:'flex',gap:24 }}>
            <Link href="/privacy" style={{ fontSize:12,color:'#63677c' }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize:12,color:'#63677c' }}>Terms</Link>
            <Link href="/security" style={{ fontSize:12,color:'#63677c' }}>Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
