'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8005';

const css = `
  *{margin:0;padding:0;box-sizing:border-box;}
  :root{--bg:#06070d;--card:#0f111c;--cb:rgba(255,255,255,0.08);--text:#f5f6fa;--dim:#979bb0;--faint:#63677c;--blue:#4f7bff;--purple:#9b5bff;--green:#34d399;}
  body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;}
  a{text-decoration:none;color:inherit;}
  .docs-layout{min-height:100vh;padding-top:58px;}
  .docs-sidebar{position:fixed;top:58px;left:0;width:260px;height:calc(100vh - 58px);overflow-y:auto;border-right:1px solid var(--cb);padding:24px 0 40px;background:rgba(6,7,13,0.95);}
  .docs-sidebar::-webkit-scrollbar{width:4px;}
  .docs-sidebar::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px;}
  .docs-content{margin-left:260px;padding:40px 60px 80px;max-width:900px;}
  .sidebar-section{padding:0 20px;margin-bottom:8px;}
  .sidebar-label{font-size:10.5px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:var(--faint);padding:14px 0 6px;}
  .sidebar-link{display:block;font-size:13px;color:var(--dim);padding:5px 0;transition:color .2s;cursor:pointer;}
  .sidebar-link:hover,.sidebar-link.active{color:var(--blue);}
  .sidebar-link.active{font-weight:600;}
  .doc-section{margin-bottom:64px;scroll-margin-top:80px;}
  .doc-h1{font-size:30px;font-weight:800;letter-spacing:-0.02em;margin-bottom:10px;}
  .doc-h2{font-size:20px;font-weight:700;letter-spacing:-0.01em;margin:36px 0 14px;}
  .doc-h3{font-size:15px;font-weight:700;margin:24px 0 10px;color:var(--purple);}
  .doc-p{font-size:14.5px;line-height:1.7;color:var(--dim);margin-bottom:14px;}
  .doc-lead{font-size:16px;line-height:1.65;color:#b0b4cc;margin-bottom:28px;}
  .badge{display:inline-block;padding:3px 8px;border-radius:5px;font-size:11px;font-weight:700;font-family:monospace;}
  .badge-get{background:rgba(52,211,153,0.15);color:#34d399;}
  .badge-post{background:rgba(79,123,255,0.15);color:#4f7bff;}
  .badge-ws{background:rgba(155,91,255,0.15);color:#9b5bff;}
  .endpoint-card{background:var(--card);border:1px solid var(--cb);border-radius:12px;margin-bottom:12px;overflow:hidden;transition:border-color .2s;}
  .endpoint-card:hover{border-color:rgba(79,123,255,0.3);}
  .endpoint-header{display:flex;align-items:center;gap:12px;padding:14px 18px;}
  .endpoint-path{font-family:monospace;font-size:13.5px;color:var(--text);}
  .endpoint-desc{font-size:12.5px;color:var(--dim);padding:0 18px 14px;}
  .code-block{background:#0a0b15;border:1px solid var(--cb);border-radius:10px;padding:18px 20px;font-family:monospace;font-size:12.5px;line-height:1.7;color:#e2e8f0;margin:14px 0;overflow-x:auto;}
  .code-block .kw{color:#9b5bff;}
  .code-block .str{color:#34d399;}
  .code-block .cm{color:#4a5568;}
  .info-card{background:rgba(79,123,255,0.06);border:1px solid rgba(79,123,255,0.2);border-radius:10px;padding:16px 18px;margin:16px 0;}
  .info-card p{font-size:13px;line-height:1.6;color:#a0aec0;}
  .warn-card{background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.2);border-radius:10px;padding:16px 18px;margin:16px 0;}
  .warn-card p{font-size:13px;line-height:1.6;color:#d4a017;}
  .step-list{list-style:none;counter-reset:steps;}
  .step-list li{counter-increment:steps;display:flex;gap:14px;margin-bottom:20px;align-items:flex-start;}
  .step-list li::before{content:counter(steps);min-width:28px;height:28px;background:rgba(155,91,255,0.15);border:1px solid rgba(155,91,255,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--purple);flex-shrink:0;}
  .step-text{flex:1;}
  .step-text strong{display:block;font-size:13.5px;margin-bottom:4px;}
  .step-text span{font-size:12.5px;color:var(--dim);line-height:1.6;}
  .status-dot{width:8px;height:8px;border-radius:50%;display:inline-block;}
  .status-dot.ok{background:#34d399;box-shadow:0 0 8px #34d399;}
  .status-dot.warn{background:#f59e0b;box-shadow:0 0 8px #f59e0b;}
  .status-dot.err{background:#ef4444;box-shadow:0 0 8px #ef4444;}
  .status-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--cb);font-size:13px;}
  .status-row:last-child{border-bottom:none;}
  .toc-header{border-bottom:1px solid var(--cb);padding-bottom:16px;margin-bottom:24px;}
  .error-table{width:100%;border-collapse:collapse;font-size:12.5px;}
  .error-table th{text-align:left;padding:8px 14px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--faint);border-bottom:1px solid var(--cb);}
  .error-table td{padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.04);vertical-align:top;}
  .error-table tr:last-child td{border-bottom:none;}
  .chain-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;background:var(--card);border:1px solid var(--cb);border-radius:20px;font-size:12.5px;font-weight:600;margin:4px;}
  @media(max-width:840px){
    .docs-layout{grid-template-columns:1fr;}
    .docs-sidebar{display:none;}
    .docs-content{margin-left:0;padding:24px 20px 60px;}
  }
`;

const ENDPOINTS = [
  { m:'GET',  path:'/api/auth/nonce',               desc:'Issues an EIP-4361 SIWE nonce for wallet sign-in.',                              auth:false },
  { m:'POST', path:'/api/auth/verify',              desc:'Verifies SIWE message + signature. Sets HTTP-only session cookie.',               auth:false },
  { m:'POST', path:'/api/auth/refresh',             desc:'Rotates refresh token (RTR). Returns new access + refresh token pair.',           auth:false },
  { m:'POST', path:'/api/auth/logout',              desc:'Invalidates session cookie and refresh token family.',                           auth:true  },
  { m:'GET',  path:'/api/user/me',                  desc:'Returns the authenticated user profile (handle, DID, subscription, SBT status).', auth:true  },
  { m:'GET',  path:'/api/user/audit-logs',          desc:'Returns the last 50 security audit events for the authenticated wallet.',         auth:true  },
  { m:'POST', path:'/api/user/sync',                desc:'Finalises identity registration — persists DID, handle, ZK proof to database.',   auth:true  },
  { m:'POST', path:'/api/biometric/verify-pipeline',desc:'Validates biometric landmark data and liveness sequence from FaceMesh.',          auth:true  },
  { m:'POST', path:'/api/verify-proof',             desc:'Structural + cryptographic Groth16 ZK-SNARK verification.',                       auth:true  },
  { m:'GET',  path:'/api/did/resolve/{did}',        desc:'W3C DID Document resolver. Returns the DID Document for a given did:meta identifier.', auth:false },
  { m:'GET',  path:'/api/did/cross-chain/{address}',desc:'Cross-chain attestation status for an Ethereum address across all supported chains.',  auth:false },
  { m:'POST', path:'/api/recovery/setup',           desc:'Configures social recovery with a minimum of 3 guardian wallet addresses.',        auth:true  },
  { m:'POST', path:'/api/recovery/initiate',        desc:'Initiates a recovery session by providing old wallet address and passphrase hash.',auth:false },
  { m:'POST', path:'/api/recovery/approve',         desc:'Guardian signs to approve a pending recovery session. Needs 2/3 guardians.',      auth:false },
  { m:'GET',  path:'/api/sbt/gallery',              desc:'Returns Soulbound Token metadata for the authenticated wallet.',                  auth:true  },
  { m:'GET',  path:'/api/public/platform-stats',    desc:'Live platform statistics: registered identities, verifications, chains, uptime.',  auth:false },
  { m:'GET',  path:'/api/system/status',            desc:'Real-time system health: API, MongoDB, Redis, Blockchain connectivity.',          auth:false },
  { m:'WS',   path:'/api/ws/stats',                 desc:'WebSocket. Streams live platform statistics to connected clients every 25 seconds.',auth:false },
  { m:'WS',   path:'/api/ws/game/{session_id}',     desc:'WebSocket relay for Unity SDK. Delivers auth_success payload after SIWE flow.',   auth:false },
];

const SECTIONS = ['introduction','architecture','authentication','biometrics','zkp','sbt','recovery','ccip','api-reference','sdk','error-codes','deployment'];

export default function DocsPage() {
  const [active, setActive] = useState('introduction');
  const [status, setStatus] = useState<Record<string,string> | null>(null);

  useEffect(() => {
    fetch(`${BACKEND}/api/system/status`).then(r => r.json()).then(setStatus).catch(() => null);
  }, []);

  const scrollTo = (id: string) => {
    setActive(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const dot = (s: string) => {
    if (!s) return 'warn';
    const l = s.toLowerCase();
    if (l === 'ok' || l === 'connected' || l === 'running') return 'ok';
    if (l === 'unavailable' || l === 'error' || l === 'down') return 'err';
    return 'warn';
  };

  return (
    <div style={{ background:'#06070d', minHeight:'100vh', color:'#f5f6fa' }}>
      <style>{css}</style>

      {/* ── NAVBAR ── */}
      <header style={{ position:'fixed',top:0,left:0,right:0,zIndex:100,background:'rgba(6,7,13,0.88)',backdropFilter:'blur(18px)',borderBottom:'1px solid rgba(255,255,255,0.08)',height:58,display:'flex',alignItems:'center' }}>
        <div style={{ maxWidth:'100%', padding:'0 28px', width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Link href="/" style={{ display:'flex',alignItems:'center',gap:9 }}>
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" style={{ filter:'drop-shadow(0 0 6px rgba(107,91,255,0.5))' }}>
              <defs><linearGradient id="dg" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#4f7bff"/><stop offset="55%" stopColor="#8f6bff"/><stop offset="100%" stopColor="#c56bff"/></linearGradient></defs>
              <circle cx="16" cy="16" r="11" fill="url(#dg)"/>
              <g stroke="#0b0d18" strokeWidth="0.9" opacity="0.5" fill="none"><ellipse cx="16" cy="16" rx="11" ry="4.2"/><ellipse cx="16" cy="16" rx="4.2" ry="11"/></g>
              <ellipse cx="16" cy="17" rx="15" ry="5" transform="rotate(-16 16 17)" stroke="#dfe6ff" strokeWidth="1.1" fill="none" opacity="0.9"/>
            </svg>
            <span style={{ fontWeight:700,fontSize:15,color:'#f5f6fa' }}>Meta<span style={{ color:'#4f7bff' }}>Go</span></span>
            <span style={{ marginLeft:8,fontSize:11,padding:'2px 8px',background:'rgba(79,123,255,0.15)',border:'1px solid rgba(79,123,255,0.3)',borderRadius:4,color:'#4f7bff',fontWeight:600 }}>Docs</span>
          </Link>
          <div style={{ display:'flex',gap:24,alignItems:'center' }}>
            <Link href="/developers" style={{ fontSize:12,fontWeight:600,color:'#979bb0',letterSpacing:'0.04em' }}>Developers</Link>
            <Link href="/about" style={{ fontSize:12,fontWeight:600,color:'#979bb0',letterSpacing:'0.04em' }}>About</Link>
            <Link href="/auth" style={{ padding:'6px 16px',background:'linear-gradient(90deg,#4f7bff,#9b5bff)',borderRadius:7,fontSize:12,fontWeight:700,color:'#fff' }}>Connect</Link>
          </div>
        </div>
      </header>

      <div className="docs-layout">
        {/* ── SIDEBAR ── */}
        <aside className="docs-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">Getting Started</div>
            <span className="sidebar-link" onClick={() => scrollTo('introduction')}>Introduction</span>
            <span className="sidebar-link" onClick={() => scrollTo('architecture')}>Architecture</span>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label">Protocol</div>
            <span className="sidebar-link" onClick={() => scrollTo('authentication')}>Authentication (SIWE)</span>
            <span className="sidebar-link" onClick={() => scrollTo('biometrics')}>Biometrics (FaceMesh)</span>
            <span className="sidebar-link" onClick={() => scrollTo('zkp')}>Zero-Knowledge Proofs</span>
            <span className="sidebar-link" onClick={() => scrollTo('sbt')}>Soulbound Tokens</span>
            <span className="sidebar-link" onClick={() => scrollTo('recovery')}>Social Recovery</span>
            <span className="sidebar-link" onClick={() => scrollTo('ccip')}>Cross-Chain (CCIP)</span>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label">Reference</div>
            <span className="sidebar-link" onClick={() => scrollTo('api-reference')}>REST API</span>
            <span className="sidebar-link" onClick={() => scrollTo('sdk')}>SDK (Unity / C#)</span>
            <span className="sidebar-link" onClick={() => scrollTo('error-codes')}>Error Codes</span>
            <span className="sidebar-link" onClick={() => scrollTo('deployment')}>Deployment</span>
          </div>
          <div className="sidebar-section" style={{ marginTop:24 }}>
            <div className="sidebar-label">System Status</div>
            {status ? (
              <>
                <div className="status-row"><span className={`status-dot ${dot(status.api_health)}`}/> API <span style={{marginLeft:'auto',fontSize:11,color:'#63677c'}}>{status.api_health}</span></div>
                <div className="status-row"><span className={`status-dot ${dot(status.database)}`}/> Database <span style={{marginLeft:'auto',fontSize:11,color:'#63677c'}}>{status.database}</span></div>
                <div className="status-row"><span className={`status-dot ${dot(status.blockchain)}`}/> Blockchain <span style={{marginLeft:'auto',fontSize:11,color:'#63677c'}}>{status.blockchain}</span></div>
              </>
            ) : (
              <p style={{ fontSize:12,color:'#63677c',paddingTop:6 }}>Fetching status…</p>
            )}
          </div>
        </aside>

        {/* ── CONTENT ── */}
        <main className="docs-content">

          {/* Introduction */}
          <section className="doc-section" id="introduction">
            <p style={{ fontSize:11,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'#9b5bff',marginBottom:10 }}>Documentation</p>
            <h1 className="doc-h1">Meta Go Protocol</h1>
            <p className="doc-lead">Meta Go is a decentralized sovereign identity and verification protocol. It integrates local WebGL biometric face-mesh extraction, Poseidon zero-knowledge commitments, and on-chain Soulbound Tokens (SBTs) to provide secure, privacy-preserving identity attestation across EVM-compatible chains.</p>
            <div className="info-card">
              <p>✦ Base URL: <code style={{ color:'#34d399',fontFamily:'monospace' }}>{BACKEND}/api</code><br/>All responses are JSON. Authentication uses HTTP-only session cookies set after SIWE verification.</p>
            </div>
          </section>

          {/* Architecture */}
          <section className="doc-section" id="architecture">
            <h2 className="doc-h2">Architecture</h2>
            <p className="doc-p">Meta Go consists of four layers:</p>
            <div className="code-block">
              <span className="kw">Next.js Frontend</span> (React, Wagmi/Viem, TensorFlow.js FaceMesh, snarkjs){'\n'}
              {'  '}↓ REST + WebSocket{'\n'}
              <span className="kw">FastAPI Backend</span> (PyMongo, PyJWT, Web3.py, Python SIWE) <span className="cm">← port 8005</span>{'\n'}
              {'  '}↓ MongoDB (users, sessions, audit_logs, sbts, recovery_sessions){'\n'}
              {'  '}↓ Hardhat / EVM Blockchain (Polygon Amoy, Ethereum, Arbitrum){'\n'}
              <span className="kw">contracts/</span>{'\n'}
              {'  '}├ IdentityRegistry.sol  <span className="cm">— UUPS upgradeable, registerIdentity(), social recovery</span>{'\n'}
              {'  '}├ CelestialSBT.sol      <span className="cm">— ERC-721 + ERC-5192, "Meta Go Sovereign ID" (MGSID)</span>{'\n'}
              {'  '}├ Groth16Verifier.sol   <span className="cm">— On-chain ZK proof verification</span>{'\n'}
              {'  '}└ CredentialVault.sol   <span className="cm">— Encrypted credential storage</span>
            </div>
          </section>

          {/* Authentication */}
          <section className="doc-section" id="authentication">
            <h2 className="doc-h2">Authentication — Sign-In With Ethereum (SIWE)</h2>
            <p className="doc-p">Meta Go uses EIP-4361 Sign-In With Ethereum. There are no passwords. Authentication is a cryptographic challenge-response using the user's wallet.</p>
            <ol className="step-list">
              <li><div className="step-text"><strong>Request Nonce</strong><span>GET /api/auth/nonce — Returns a unique, time-limited nonce string.</span></div></li>
              <li><div className="step-text"><strong>Construct SIWE Message</strong><span>Frontend builds an EIP-4361 message including the nonce, domain, and chain ID.</span></div></li>
              <li><div className="step-text"><strong>Sign with Wallet</strong><span>User signs the message using MetaMask or any EIP-1193 compatible wallet (wagmi injected connector).</span></div></li>
              <li><div className="step-text"><strong>Verify Signature</strong><span>POST /api/auth/verify — Backend uses Python SIWE to verify the signature. On success, sets HTTP-only session cookie + issues JWT access/refresh token pair.</span></div></li>
              <li><div className="step-text"><strong>Session Management</strong><span>Refresh Token Rotation (RTR) is implemented. Refresh token families are tracked — a reuse attempt triggers full family revocation and logs a token_revocation audit event.</span></div></li>
            </ol>
          </section>

          {/* Biometrics */}
          <section className="doc-section" id="biometrics">
            <h2 className="doc-h2">Biometric Verification — TensorFlow.js FaceMesh</h2>
            <p className="doc-p">Liveness detection runs entirely inside the user's browser using TensorFlow.js FaceMesh. No video, images, or raw landmark data is ever transmitted to the server.</p>
            <h3 className="doc-h3">4-Step Liveness Sequence</h3>
            <ol className="step-list">
              <li><div className="step-text"><strong>Center Face</strong><span>Detects face in frame. Measures nose-tip position relative to frame center.</span></div></li>
              <li><div className="step-text"><strong>Turn Left</strong><span>Measures nose-to-eye horizontal distance ratio. Left turn threshold: ratio &lt; 0.6.</span></div></li>
              <li><div className="step-text"><strong>Turn Right</strong><span>Same ratio check. Right turn threshold: ratio &gt; 1.4.</span></div></li>
              <li><div className="step-text"><strong>Blink</strong><span>Eye Aspect Ratio (EAR) measurement. EAR = (vertical eye landmarks) / (horizontal eye landmarks). Blink detected when EAR &lt; 0.2.</span></div></li>
            </ol>
            <div className="warn-card"><p>⚠ Privacy guarantee: After biometric steps are completed, landmark coordinates are hashed locally using poseidon_sim_hash() and the raw data is immediately discarded. The hash is used as input to the ZK proof circuit — it is never stored or transmitted in any identifiable form.</p></div>
          </section>

          {/* ZKP */}
          <section className="doc-section" id="zkp">
            <h2 className="doc-h2">Zero-Knowledge Proofs — Groth16 / BN128</h2>
            <p className="doc-p">Identity is proven using a Groth16 SNARK generated with snarkjs on the user's device. The circuit is compiled from identity.circom.</p>
            <div className="code-block">
              <span className="cm">// Proof structure (BN128 curve)</span>{'\n'}
              {'{'}{'\n'}
              {'  '}protocol: <span className="str">"groth16"</span>,{'\n'}
              {'  '}curve: <span className="str">"bn128"</span>,{'\n'}
              {'  '}pi_a: [<span className="cm">x: bigint</span>, <span className="cm">y: bigint</span>],{'\n'}
              {'  '}pi_b: [[<span className="cm">x0</span>, <span className="cm">x1</span>], [<span className="cm">y0</span>, <span className="cm">y1</span>]],{'\n'}
              {'  '}pi_c: [<span className="cm">x: bigint</span>, <span className="cm">y: bigint</span>]{'\n'}
              {'}'}{'\n'}{'\n'}
              <span className="cm">// Public signals (4 values)</span>{'\n'}
              publicSignals: [<span className="cm">commitment</span>, <span className="cm">nullifier</span>, <span className="cm">walletHash</span>, <span className="cm">timestamp</span>]
            </div>
            <p className="doc-p">The <code style={{ fontFamily:'monospace',color:'#9b5bff' }}>nullifier</code> is stored in the <code style={{ fontFamily:'monospace',color:'#9b5bff' }}>usedNullifiers</code> mapping on-chain — preventing the same biometric identity from registering twice. The Groth16Verifier.sol contract performs cryptographic verification on every registration call.</p>
          </section>

          {/* SBT */}
          <section className="doc-section" id="sbt">
            <h2 className="doc-h2">Soulbound Tokens — ERC-5192 (CelestialSBT)</h2>
            <p className="doc-p">Upon successful identity registration, a Soulbound Token is minted to the user's wallet. The token conforms to ERC-5192: Minimal Soulbound NFTs.</p>
            <div className="code-block">
              <span className="cm">// CelestialSBT.sol</span>{'\n'}
              contract CelestialSBT is ERC721, Ownable, IERC5192 {'\n'}
              {'  '}<span className="cm">// Token: "Meta Go Sovereign ID" (MGSID)</span>{'\n'}
              {'  '}function locked(uint256 tokenId) external view returns (bool) {'{'}{'\n'}
              {'    '}return <span className="kw">true</span>; <span className="cm">// Always soulbound</span>{'\n'}
              {'  '}{'}'}{'\n'}
              {'  '}<span className="cm">// Transfer blocked at _update() hook level</span>{'\n'}
              {'  '}<span className="cm">// Approvals disabled — setApprovalForAll() reverts</span>{'\n'}
              {'}'}
            </div>
            <div className="info-card"><p>Each wallet can hold exactly one MGSID token. Tokens carry a domain (the chain they were minted on) and a tokenURI pointing to credential metadata.</p></div>
          </section>

          {/* Recovery */}
          <section className="doc-section" id="recovery">
            <h2 className="doc-h2">Social Recovery</h2>
            <p className="doc-p">Meta Go implements smart contract-based social recovery in IdentityRegistry.sol. If a user loses access to their wallet, nominated guardians can collectively migrate the identity to a new wallet.</p>
            <h3 className="doc-h3">Recovery Flow</h3>
            <ol className="step-list">
              <li><div className="step-text"><strong>Setup Guardians</strong><span>POST /api/recovery/setup — Provide minimum 3 unique guardian wallet addresses + a passphrase hash. Stored on-chain via setupRecovery().</span></div></li>
              <li><div className="step-text"><strong>Initiate Recovery Session</strong><span>POST /api/recovery/initiate — Provide old wallet, passphrase hash, and new wallet address. Creates a recovery session on-chain.</span></div></li>
              <li><div className="step-text"><strong>Guardian Approval</strong><span>Each guardian calls POST /api/recovery/approve. Guardian signatures tracked in hasApproved mapping.</span></div></li>
              <li><div className="step-text"><strong>Execution</strong><span>When 2-of-3 guardians have approved, the smart contract automatically migrates the identity to the new wallet address.</span></div></li>
            </ol>
          </section>

          {/* CCIP */}
          <section className="doc-section" id="ccip">
            <h2 className="doc-h2">Cross-Chain Identity — Chainlink CCIP</h2>
            <p className="doc-p">Meta Go uses Chainlink CCIP to sync identity attestations across EVM-compatible chains. Supported chains:</p>
            <div style={{ margin:'16px 0' }}>
              <span className="chain-pill">🟣 Polygon Amoy</span>
              <span className="chain-pill">🔵 Ethereum</span>
              <span className="chain-pill">🔷 Arbitrum</span>
            </div>
            <p className="doc-p">When a user calls syncCrossChain() on the IdentityRegistry, the contract emits CrossChainSyncInitiated. The backend relayer picks this up and calls the CCIP router to register the identity on the destination chain via registerCrossChain() with the RELAYER_ROLE.</p>
          </section>

          {/* API Reference */}
          <section className="doc-section" id="api-reference">
            <h2 className="doc-h2">REST API Reference</h2>
            <p className="doc-p" style={{ marginBottom:20 }}>All endpoints are served from <code style={{ fontFamily:'monospace',color:'#34d399' }}>{BACKEND}/api</code>. Authenticated endpoints require a valid session cookie.</p>
            {ENDPOINTS.map((ep, i) => (
              <div className="endpoint-card" key={i}>
                <div className="endpoint-header">
                  <span className={`badge badge-${ep.m.toLowerCase()}`}>{ep.m}</span>
                  <span className="endpoint-path">{ep.path}</span>
                  {ep.auth && <span style={{ marginLeft:'auto',fontSize:11,color:'#63677c',padding:'2px 7px',border:'1px solid rgba(255,255,255,0.08)',borderRadius:4 }}>Auth required</span>}
                </div>
                <p className="endpoint-desc">{ep.desc}</p>
              </div>
            ))}
          </section>

          {/* SDK */}
          <section className="doc-section" id="sdk">
            <h2 className="doc-h2">SDK — Unity / C#</h2>
            <p className="doc-p">MetaGoSDK.cs provides a C#/.NET SDK compatible with Unity 5.3+ for integrating Meta Go sovereign identity into metaverse games and applications.</p>
            <div className="code-block">
              <span className="cm">// MetaGoRelayClient — Unity C# integration</span>{'\n'}
              {'\n'}
              <span className="kw">var</span> client = <span className="kw">new</span> MetaGoRelayClient();{'\n'}
              client.OnLoginSuccess += (user) {'=> {'}{'\n'}
              {'  '}Debug.Log($<span className="str">"DID: {'{'}user.did{'}'}"</span>);{'\n'}
              {'  '}Debug.Log($<span className="str">"Handle: @{'{'}user.handle{'}'}"</span>);{'\n'}
              {'  '}Debug.Log($<span className="str">"Avatar VRM: {'{'}user.avatar{'}'}"</span>); <span className="cm">// ipfs:// URI</span>{'\n'}
              {'}'};{'\n'}
              {'\n'}
              client.StartLogin(); <span className="cm">// Opens browser, connects WebSocket relay</span>
            </div>
            <p className="doc-p">The SDK opens the OIDC authorization URL in the system browser, then connects to <code style={{ fontFamily:'monospace',color:'#9b5bff' }}>ws://[host]/api/ws/game/{'{session_id}'}</code> to await the auth_success payload. On success, MetaUserInfo is deserialized and the OnLoginSuccess event is fired.</p>
          </section>

          {/* Error Codes */}
          <section className="doc-section" id="error-codes">
            <h2 className="doc-h2">Error Codes</h2>
            <table className="error-table">
              <thead><tr><th>HTTP</th><th>Code / Message</th><th>Meaning</th></tr></thead>
              <tbody>
                {[
                  ['401','Unauthorized','No valid session cookie. Call /api/auth/nonce + /api/auth/verify first.'],
                  ['400','InvalidZKProof','Groth16 proof failed structural or cryptographic validation.'],
                  ['400','NullifierUsed','This biometric commitment has already been registered.'],
                  ['400','HandleTaken','Requested username handle is already claimed.'],
                  ['400','DIDTaken','DID already anchored to another wallet.'],
                  ['400','AlreadyRegistered','This wallet address already has an active identity.'],
                  ['400','InvalidGuardianCount','Social recovery requires a minimum of 3 guardians.'],
                  ['400','InvalidPassphraseHash','Passphrase hash does not match recovery configuration.'],
                  ['429','RateLimitExceeded','Too many requests. Sensitive endpoints are limited to 5–15 req/min per IP.'],
                  ['500','Pipeline verification failed','Backend error during biometric or ZK pipeline. Check system status.'],
                ].map(([code, name, desc], i) => (
                  <tr key={i}>
                    <td><span style={{ fontFamily:'monospace',fontSize:12,color:code.startsWith('4') ? '#f87171' : '#f59e0b' }}>{code}</span></td>
                    <td><code style={{ fontFamily:'monospace',fontSize:12,color:'#9b5bff' }}>{name}</code></td>
                    <td style={{ color:'#979bb0' }}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Deployment */}
          <section className="doc-section" id="deployment">
            <h2 className="doc-h2">Deployment</h2>
            <h3 className="doc-h3">Step 1 — Smart Contracts</h3>
            <div className="code-block">cd contracts-hardhat{'\n'}npm install{'\n'}npx hardhat node{'\n'}npx hardhat run scripts/deploy.ts --network localhost</div>
            <h3 className="doc-h3">Step 2 — Backend</h3>
            <div className="code-block">cd backend{'\n'}python -m venv venv{'\n'}venv\Scripts\activate{'\n'}pip install -r requirements.txt{'\n'}$env:TEST_MODE="1"{'\n'}python -m uvicorn backend.server:app --port 8005</div>
            <h3 className="doc-h3">Step 3 — Frontend</h3>
            <div className="code-block">cd frontend{'\n'}npm install{'\n'}npm run dev   # Development: http://localhost:3005</div>
            <div className="info-card"><p>The frontend reads <code style={{ fontFamily:'monospace',color:'#34d399' }}>NEXT_PUBLIC_BACKEND_URL</code> from environment variables. Set this to your production backend URL for deployment.</p></div>
          </section>

        </main>
      </div>
    </div>
  );
}
