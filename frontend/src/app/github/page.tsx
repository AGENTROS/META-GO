'use client';

import Link from 'next/link';

const css = `
  *{margin:0;padding:0;box-sizing:border-box;}
  :root{--bg:#06070d;--card:#0f111c;--cb:rgba(255,255,255,0.08);--text:#f5f6fa;--dim:#979bb0;--faint:#63677c;--blue:#4f7bff;--purple:#9b5bff;--green:#34d399;}
  body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;}
  a{text-decoration:none;color:inherit;}
  .gh-hero{padding:100px 0 60px;text-align:center;}
  .gh-eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:#8fb4ff;background:rgba(79,123,255,0.1);border:1px solid rgba(79,123,255,0.25);padding:6px 14px;border-radius:20px;margin-bottom:22px;}
  .gh-h1{font-size:42px;font-weight:800;letter-spacing:-0.02em;margin-bottom:16px;}
  .gh-grad{background:linear-gradient(90deg,#4f7bff,#9b5bff);-webkit-background-clip:text;background-clip:text;color:transparent;}
  .gh-sub{font-size:16px;line-height:1.65;color:#979bb0;max-width:600px;margin:0 auto 36px;}
  .gh-btn{display:inline-flex;align-items:center;gap:9px;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;text-decoration:none;}
  .gh-btn-primary{background:linear-gradient(90deg,#4f7bff,#9b5bff);color:#fff;box-shadow:0 4px 20px rgba(79,123,255,0.3);}
  .gh-btn-secondary{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);color:#f5f6fa;}
  .gh-btn:hover{opacity:0.9;transform:translateY(-1px);}
  .section{max-width:1100px;margin:0 auto;padding:0 24px 72px;}
  .sec-head{margin-bottom:36px;}
  .sec-eyebrow{font-size:11px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#9b5bff;margin-bottom:10px;}
  .sec-title{font-size:26px;font-weight:800;letter-spacing:-0.015em;margin-bottom:10px;}
  .sec-desc{font-size:14.5px;color:#979bb0;line-height:1.65;}
  .tree-card{background:var(--card);border:1px solid var(--cb);border-radius:16px;padding:28px 32px;}
  .tree{font-family:monospace;font-size:13px;line-height:2;color:#979bb0;}
  .tree .dir{color:#4f7bff;font-weight:600;}
  .tree .file{color:#f5f6fa;}
  .tree .comment{color:#63677c;}
  .repo-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}
  .repo-card{background:var(--card);border:1px solid var(--cb);border-radius:14px;padding:22px 24px;transition:border-color .2s,transform .2s;}
  .repo-card:hover{border-color:rgba(155,91,255,0.35);transform:translateY(-2px);}
  .repo-card h3{font-size:15px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:8px;}
  .repo-card p{font-size:13px;color:#979bb0;line-height:1.6;}
  .repo-card .tag{font-size:11px;padding:2px 8px;background:rgba(79,123,255,0.12);border:1px solid rgba(79,123,255,0.25);border-radius:4px;color:#4f7bff;font-weight:600;}
  .steps-list{display:flex;flex-direction:column;gap:0;}
  .step-item{display:flex;gap:18px;align-items:flex-start;padding:22px 0;border-bottom:1px solid rgba(255,255,255,0.06);}
  .step-item:last-child{border-bottom:none;}
  .step-num{min-width:36px;height:36px;border-radius:50%;background:rgba(155,91,255,0.12);border:1px solid rgba(155,91,255,0.25);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#9b5bff;flex-shrink:0;}
  .step-body h4{font-size:14.5px;font-weight:700;margin-bottom:6px;}
  .step-body p{font-size:13px;color:#979bb0;line-height:1.6;margin-bottom:10px;}
  .code-snippet{background:#0a0b15;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px 16px;font-family:monospace;font-size:12px;color:#34d399;overflow-x:auto;}
  .divider{height:1px;background:rgba(255,255,255,0.06);margin:48px 0;}
  .contrib-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
  .contrib-card{background:var(--card);border:1px solid var(--cb);border-radius:14px;padding:20px;transition:border-color .2s;}
  .contrib-card:hover{border-color:rgba(79,123,255,0.3);}
  .contrib-card h4{font-size:14px;font-weight:700;margin-bottom:6px;}
  .contrib-card p{font-size:12.5px;color:#979bb0;line-height:1.6;}
  .cta-box{background:linear-gradient(160deg,#241a4a 0%,#171233 45%,#0a0b16 100%);border:1px solid rgba(155,91,255,0.25);border-radius:20px;padding:52px 40px;text-align:center;}
  .cta-box h2{font-size:26px;font-weight:800;margin-bottom:10px;}
  .cta-box p{font-size:15px;color:#979bb0;margin-bottom:28px;}
  @media(max-width:700px){
    .repo-grid{grid-template-columns:1fr;}
    .contrib-grid{grid-template-columns:1fr;}
    .gh-h1{font-size:30px;}
    .section{padding:0 16px 56px;}
  }
`;

export default function GitHubPage() {
  return (
    <div style={{ background:'#06070d', minHeight:'100vh', color:'#f5f6fa' }}>
      <style>{css}</style>

      {/* Nav */}
      <header style={{ position:'fixed',top:0,left:0,right:0,zIndex:100,background:'rgba(6,7,13,0.88)',backdropFilter:'blur(18px)',borderBottom:'1px solid rgba(255,255,255,0.08)',height:58,display:'flex',alignItems:'center' }}>
        <div style={{ maxWidth:1200,margin:'0 auto',padding:'0 28px',width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <Link href="/" style={{ display:'flex',alignItems:'center',gap:9 }}>
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" style={{ filter:'drop-shadow(0 0 5px rgba(107,91,255,0.5))' }}>
              <defs><linearGradient id="ghg" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#4f7bff"/><stop offset="55%" stopColor="#8f6bff"/><stop offset="100%" stopColor="#c56bff"/></linearGradient></defs>
              <circle cx="16" cy="16" r="11" fill="url(#ghg)"/>
              <g stroke="#0b0d18" strokeWidth="0.9" opacity="0.5" fill="none"><ellipse cx="16" cy="16" rx="11" ry="4.2"/><ellipse cx="16" cy="16" rx="4.2" ry="11"/></g>
              <ellipse cx="16" cy="17" rx="15" ry="5" transform="rotate(-16 16 17)" stroke="#dfe6ff" strokeWidth="1.1" fill="none" opacity="0.9"/>
            </svg>
            <span style={{ fontWeight:700,fontSize:15,color:'#f5f6fa' }}>Meta<span style={{ color:'#4f7bff' }}>Go</span></span>
          </Link>
          <div style={{ display:'flex',gap:24,alignItems:'center' }}>
            <Link href="/docs" style={{ fontSize:12,fontWeight:600,color:'#979bb0',letterSpacing:'0.04em' }}>Docs</Link>
            <Link href="/developers" style={{ fontSize:12,fontWeight:600,color:'#979bb0',letterSpacing:'0.04em' }}>Developers</Link>
            <Link href="/auth" style={{ padding:'6px 16px',background:'linear-gradient(90deg,#4f7bff,#9b5bff)',borderRadius:7,fontSize:12,fontWeight:700,color:'#fff' }}>Connect</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="gh-hero">
        <div className="gh-eyebrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          Open Source Project
        </div>
        <h1 className="gh-h1">Meta Go <span className="gh-grad">Repository</span></h1>
        <p className="gh-sub">Explore the source code, architecture, smart contracts, and SDK powering the Meta Go sovereign identity protocol.</p>
        <div style={{ display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap' }}>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="gh-btn gh-btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            View on GitHub
          </a>
          <Link href="/docs" className="gh-btn gh-btn-secondary">Read Docs →</Link>
        </div>
      </div>

      {/* Repository Structure */}
      <div className="section">
        <div className="sec-head">
          <p className="sec-eyebrow">Repository</p>
          <h2 className="sec-title">Project Structure</h2>
          <p className="sec-desc">The Meta Go monorepo contains four top-level modules, each handling a distinct layer of the identity stack.</p>
        </div>
        <div className="tree-card">
          <div className="tree">
            <div><span className="dir">META GO/</span></div>
            <div>├── <span className="dir">frontend/</span>          <span className="comment"># Next.js 16 app — UI, biometrics, wallet connection</span></div>
            <div>│   ├── <span className="dir">src/app/</span>          <span className="comment"># App Router pages</span></div>
            <div>│   ├── <span className="dir">src/components/</span>   <span className="comment"># Shared components (Navbar, GlassCard, BiometricScanner)</span></div>
            <div>│   ├── <span className="dir">src/hooks/</span>        <span className="comment"># Custom hooks (useSIWE.ts, useIdentityStore)</span></div>
            <div>│   └── <span className="dir">src/store/</span>        <span className="comment"># Zustand identity state store</span></div>
            <div>│</div>
            <div>├── <span className="dir">backend/</span>            <span className="comment"># FastAPI Python microservice — port 8005</span></div>
            <div>│   ├── <span className="file">server.py</span>         <span className="comment"># 4000+ line FastAPI app — auth, biometric, ZK, recovery</span></div>
            <div>│   ├── <span className="file">zk_verifier.py</span>    <span className="comment"># Groth16 structural + cryptographic verification</span></div>
            <div>│   ├── <span className="file">relayer.py</span>        <span className="comment"># Blockchain relayer — contract interactions</span></div>
            <div>│   └── <span className="dir">tests/</span>            <span className="comment"># Pytest integration + performance test suite</span></div>
            <div>│</div>
            <div>├── <span className="dir">contracts-hardhat/</span>  <span className="comment"># EVM smart contracts + ZK circuits</span></div>
            <div>│   ├── <span className="dir">contracts/</span>        <span className="comment"># Solidity contracts</span></div>
            <div>│   │   ├── <span className="file">IdentityRegistry.sol</span>   <span className="comment"># UUPS upgradeable, social recovery</span></div>
            <div>│   │   ├── <span className="file">CelestialSBT.sol</span>       <span className="comment"># ERC-721 + ERC-5192 Soulbound Token</span></div>
            <div>│   │   ├── <span className="file">Groth16Verifier.sol</span>    <span className="comment"># On-chain ZK proof verifier</span></div>
            <div>│   │   └── <span className="file">CredentialVault.sol</span>    <span className="comment"># Encrypted credential storage</span></div>
            <div>│   ├── <span className="dir">circuits/</span>          <span className="comment"># Circom ZK circuits</span></div>
            <div>│   │   └── <span className="file">identity.circom</span>        <span className="comment"># Groth16/BN128 identity proof circuit</span></div>
            <div>│   └── <span className="dir">scripts/</span>           <span className="comment"># Hardhat deployment scripts</span></div>
            <div>│</div>
            <div>└── <span className="dir">sdk/</span>                <span className="comment"># Third-party integration SDK</span></div>
            <div>{'    '}└── <span className="file">MetaGoSDK.cs</span>      <span className="comment"># C#/.NET Unity SDK — WebSocket OIDC relay</span></div>
          </div>
        </div>
      </div>

      {/* Module Descriptions */}
      <div className="section">
        <div className="sec-head">
          <p className="sec-eyebrow">Modules</p>
          <h2 className="sec-title">What Each Module Does</h2>
        </div>
        <div className="repo-grid">
          {[
            { icon:'⚛', tag:'Next.js 16', name:'frontend/', desc:'React application with Wagmi/Viem for wallet connection, TensorFlow.js FaceMesh for in-browser biometric liveness detection, snarkjs for client-side ZK proof generation, and Zustand for identity state.' },
            { icon:'🐍', tag:'FastAPI', name:'backend/', desc:'Python microservice handling SIWE authentication, biometric pipeline validation, Groth16 ZK proof verification, social recovery orchestration, and Chainlink CCIP cross-chain synchronization. Connects to MongoDB and Hardhat EVM.' },
            { icon:'⛓', tag:'Solidity ^0.8.24', name:'contracts-hardhat/', desc:'OpenZeppelin upgradeable smart contracts. IdentityRegistry handles on-chain registration with ZK proof validation. CelestialSBT implements ERC-5192 soulbound tokens. Groth16Verifier performs cryptographic proof checks on-chain.' },
            { icon:'🎮', tag:'C# / Unity', name:'sdk/', desc:'MetaGoRelayClient for Unity and standalone C# applications. Opens the OIDC browser flow, connects a WebSocket relay, and fires an event with the authenticated MetaUserInfo (DID, handle, wallet, IPFS VRM avatar) once authentication succeeds.' },
          ].map((m, i) => (
            <div className="repo-card" key={i}>
              <h3><span style={{ fontSize:18 }}>{m.icon}</span>{m.name}<span className="tag">{m.tag}</span></h3>
              <p>{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Start */}
      <div className="section">
        <div className="sec-head">
          <p className="sec-eyebrow">Getting Started</p>
          <h2 className="sec-title">Local Development Setup</h2>
          <p className="sec-desc">The full stack runs locally. Follow these four steps to get up and running.</p>
        </div>
        <div className="steps-list">
          {[
            { title:'Clone & Install', desc:'Clone the repository and install dependencies for frontend and contracts.', code:'git clone https://github.com/[repo]/meta-go\ncd contracts-hardhat && npm install\ncd ../frontend && npm install' },
            { title:'Start Hardhat Node', desc:'Spin up a local Ethereum blockchain node using Hardhat. Keep this terminal open.', code:'cd contracts-hardhat\nnpx hardhat node' },
            { title:'Deploy Smart Contracts', desc:'Deploy IdentityRegistry, CelestialSBT, Groth16Verifier, and CredentialVault to the local Hardhat network.', code:'npx hardhat run scripts/deploy.ts --network localhost' },
            { title:'Start Backend', desc:'Activate the Python virtual environment and start the FastAPI server in test mode.', code:'cd backend\npython -m venv venv && venv\\Scripts\\activate\npip install -r requirements.txt\n$env:TEST_MODE="1"\npython -m uvicorn backend.server:app --port 8005 --reload' },
            { title:'Start Frontend', desc:'Launch the Next.js development server. Open http://localhost:3005 in your browser.', code:'cd frontend\nnpm run dev\n# → http://localhost:3005' },
          ].map((s, i) => (
            <div className="step-item" key={i}>
              <div className="step-num">{i + 1}</div>
              <div className="step-body">
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
                <div className="code-snippet">{s.code}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contributing */}
      <div className="section">
        <div className="sec-head">
          <p className="sec-eyebrow">Contributing</p>
          <h2 className="sec-title">Ways to Contribute</h2>
        </div>
        <div className="contrib-grid">
          {[
            { icon:'🔬', title:'ZK Circuit Research', desc:'Improve the identity.circom Circom circuit — reduce constraint count, add additional biometric inputs, or extend to voice biometrics.' },
            { icon:'🔒', title:'Smart Contract Auditing', desc:'Review IdentityRegistry.sol and CelestialSBT.sol for security vulnerabilities. Social recovery flow and UUPS upgrade logic are priority areas.' },
            { icon:'🧬', title:'Biometric Pipeline', desc:'Enhance the TensorFlow.js FaceMesh pipeline — improve EAR threshold calibration, add eye-tracking, or integrate additional liveness signals.' },
            { icon:'🌐', title:'Cross-Chain Support', desc:'Extend Chainlink CCIP integration to additional chains. Add support for L2 networks and non-EVM chains via bridge adapters.' },
            { icon:'📱', title:'Mobile SDK', desc:'The current SDK targets Unity/C#. A native iOS (Swift) or Android (Kotlin) SDK for mobile wallet authentication is a high-priority research area.' },
            { icon:'📄', title:'Documentation', desc:'Improve technical documentation, write tutorials, translate to other languages, or create integration examples for popular frameworks.' },
          ].map((c, i) => (
            <div className="contrib-card" key={i}>
              <h4><span style={{ marginRight:8,fontSize:16 }}>{c.icon}</span>{c.title}</h4>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="section">
        <div className="cta-box">
          <h2>Start Building on Meta Go</h2>
          <p>Read the full technical documentation or open GitHub to explore the source code.</p>
          <div style={{ display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap' }}>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="gh-btn gh-btn-primary">View GitHub Repository</a>
            <Link href="/docs" className="gh-btn gh-btn-secondary">Read Documentation</Link>
          </div>
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
