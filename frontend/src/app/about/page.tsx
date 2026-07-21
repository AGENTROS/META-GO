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
    min-height: 100vh;
    overflow-x: hidden;
  }
  .grad-text {
    background: linear-gradient(90deg, #4f7bff, #9b5bff, #c56bff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .glass-card {
    background: var(--card);
    border: 1px solid var(--cb);
    border-radius: 16px;
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .glass-card:hover {
    border-color: rgba(159,91,255,0.35);
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(79,123,255,0.08);
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 14px;
    background: rgba(79,123,255,0.1);
    border: 1px solid rgba(79,123,255,0.25);
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #4f7bff;
    text-transform: uppercase;
    margin-bottom: 20px;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp 0.7s ease both; }
  @keyframes pulse-ring {
    0%,100% { opacity: 0.15; transform: scale(1); }
    50%      { opacity: 0.35; transform: scale(1.06); }
  }
  .hero-glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    pointer-events: none;
  }
  table { width: 100%; border-collapse: collapse; }
  th {
    text-align: left;
    padding: 12px 16px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--faint);
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid var(--cb);
  }
  td {
    padding: 13px 16px;
    font-size: 13px;
    color: var(--dim);
    border-bottom: 1px solid rgba(255,255,255,0.04);
    vertical-align: top;
    line-height: 1.6;
  }
  td:first-child {
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
    width: 140px;
  }
  tr:last-child td { border-bottom: none; }
  .arch-box {
    background: rgba(6,7,13,0.8);
    border: 1px solid rgba(79,123,255,0.2);
    border-radius: 12px;
    padding: 20px 24px;
    font-family: 'Menlo','Courier New',monospace;
    font-size: 13px;
    line-height: 1.9;
    color: #a0b0ff;
    position: relative;
    overflow: hidden;
  }
  .arch-box::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(79,123,255,0.04) 0%, transparent 60%);
    pointer-events: none;
  }
  .problem-icon {
    width: 44px; height: 44px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }
  .research-tag {
    display: inline-flex;
    padding: 4px 12px;
    background: rgba(155,91,255,0.08);
    border: 1px solid rgba(155,91,255,0.2);
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--purple);
    margin: 4px;
  }
  .pillar-icon-bg {
    width: 48px; height: 48px;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
    margin-bottom: 16px;
    flex-shrink: 0;
  }
  @media (max-width: 900px) {
    .pillars-grid { grid-template-columns: 1fr 1fr !important; }
  }
  @media (max-width: 640px) {
    .hero-title { font-size: 36px !important; }
    .pillars-grid { grid-template-columns: 1fr !important; }
    .problems-grid { grid-template-columns: 1fr !important; }
    .arch-flex { flex-direction: column !important; }
    .arch-right { flex: none !important; width: 100% !important; }
  }
`;

const LogoMark = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect width="28" height="28" rx="8" fill="url(#lgAbout)"/>
    <path d="M7 19L11.5 9L14 14.5L16.5 9L21 19" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="14" cy="14" r="2.5" fill="#fff" fillOpacity="0.9"/>
    <defs>
      <linearGradient id="lgAbout" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4f7bff"/>
        <stop offset="1" stopColor="#9b5bff"/>
      </linearGradient>
    </defs>
  </svg>
);

const problems = [
  {
    icon: '🔓',
    color: 'rgba(239,68,68,0.15)',
    iconColor: '#ef4444',
    title: 'Password Theft',
    desc: 'Over 24 billion passwords were exposed in 2023 alone. Credential stuffing attacks exploit reused passwords across services, compromising millions of accounts per breach.',
  },
  {
    icon: '👁️',
    color: 'rgba(234,179,8,0.12)',
    iconColor: '#eab308',
    title: 'Centralized Social Tracking',
    desc: '"Sign in with Google / Facebook" hands your behavioral data, login timestamps, and cross-site activity to advertising platforms — with zero user control.',
  },
  {
    icon: '📁',
    color: 'rgba(249,115,22,0.12)',
    iconColor: '#f97316',
    title: 'KYC Identity Leaks',
    desc: 'Passport scans, selfies, and government IDs uploaded to third-party KYC providers create honeypots of sensitive PII. A single breach exposes your biometric data permanently.',
  },
  {
    icon: '🤖',
    color: 'rgba(155,91,255,0.12)',
    iconColor: '#9b5bff',
    title: 'AI Bots & Deepfakes',
    desc: 'Generative AI has eliminated naive "liveness" checks. Automated deepfake-based sign-ups flood platforms, compromising community trust and enabling fraud at scale.',
  },
];

const pillars = [
  {
    icon: '🔐',
    bg: 'rgba(79,123,255,0.12)',
    label: 'SIWE',
    title: 'Sign-In With Ethereum',
    desc: 'Wallet-based authentication with no passwords. Users sign an EIP-4361 nonce with MetaMask or any EIP-1193 wallet. The backend verifies the signature cryptographically — no secret ever leaves the client.',
    tags: ['EIP-4361', 'MetaMask', 'Wagmi/Viem', 'Nonce Verification'],
  },
  {
    icon: '🧠',
    bg: 'rgba(52,211,153,0.10)',
    label: 'BIOMETRICS',
    title: 'TensorFlow.js FaceMesh',
    desc: '4-step in-browser liveness detection: Center → Turn Left → Turn Right → Blink. EAR (Eye Aspect Ratio) powers blink detection. Nose-to-eye ratio measures head rotation. Zero video or images sent to the server — only landmark coordinates hashed locally.',
    tags: ['FaceMesh 468 pts', 'EAR Blink', 'Nose-Eye Ratio', 'Local Hash Only'],
  },
  {
    icon: '⚡',
    bg: 'rgba(155,91,255,0.12)',
    label: 'ZK PROOFS',
    title: 'Groth16 Zero-Knowledge Proofs',
    desc: 'Circom circuits on the BN128 elliptic curve generate succinct proofs of biometric validity without revealing the underlying data. snarkjs powers client-side proof generation. Poseidon hash creates a deterministic commitment. 4 public signals verified on-chain by Groth16Verifier.sol.',
    tags: ['Circom', 'BN128', 'snarkjs', 'Poseidon Hash', 'Groth16Verifier.sol'],
  },
  {
    icon: '🏅',
    bg: 'rgba(197,107,255,0.12)',
    label: 'SBT',
    title: 'Soulbound Tokens ERC-5192',
    desc: 'CelestialSBT mints "Meta Go Sovereign ID" (MGSID) — a non-transferable ERC-721 locked under ERC-5192. Transfer and approval hooks are disabled at the contract level. Your on-chain identity badge cannot be sold, traded, or stolen.',
    tags: ['ERC-5192', 'MGSID', 'Non-transferable', 'CelestialSBT.sol'],
  },
  {
    icon: '🌐',
    bg: 'rgba(79,123,255,0.10)',
    label: 'CROSS-CHAIN',
    title: 'Chainlink CCIP',
    desc: 'Identity attestations sync across Polygon Amoy, Ethereum, and Arbitrum via Chainlink CCIP. One registration, universal recognition. IdentityRegistry.sol exposes syncCrossChain() for seamless multi-chain deployment.',
    tags: ['CCIP', 'Polygon Amoy', 'Ethereum', 'Arbitrum', 'syncCrossChain()'],
  },
  {
    icon: '🛡️',
    bg: 'rgba(52,211,153,0.10)',
    label: 'RECOVERY',
    title: 'Social Recovery',
    desc: 'Minimum 3 guardians required via setupRecovery(). 2-of-3 consensus triggers approveRecovery() on IdentityRegistry.sol. PassphraseHash stored on-chain. Smart contract managed — no central authority can lock you out of your identity.',
    tags: ['3 Guardians', '2/3 Consensus', 'IdentityRegistry.sol', 'PassphraseHash'],
  },
];

const researchFoundations = [
  'W3C DID Specification',
  'ERC-5192 Minimal Soulbound Tokens',
  'Groth16 Proving System',
  'Chainlink CCIP Protocol',
  'EIP-4361 SIWE Standard',
  'BN128 Elliptic Curve Cryptography',
  'Poseidon Hash Function',
  'ERC-721 NFT Standard',
];

const lifecycleSteps = [
  ['1','Wallet Connect','EIP-1193 provider, MetaMask'],
  ['2','SIWE Auth','Nonce sign → /api/auth/verify'],
  ['3','Biometric Scan','FaceMesh 4-step liveness'],
  ['4','ZK Proof Gen','Circom Groth16 in browser'],
  ['5','On-Chain Register','IdentityRegistry.sol'],
  ['6','SBT Mint','CelestialSBT MGSID'],
  ['7','CCIP Sync','Polygon + ETH + Arbitrum'],
];

export default function AboutPage() {
  return (
    <>
      <style>{css}</style>

      <header style={{
        position:'fixed',top:0,left:0,right:0,zIndex:100,
        background:'rgba(6,7,13,0.82)',backdropFilter:'blur(18px)',
        borderBottom:'1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px',height:58,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <Link href="/" style={{display:'flex',alignItems:'center',gap:9,textDecoration:'none'}}>
            <LogoMark />
            <span style={{fontWeight:700,fontSize:16,color:'#f5f6fa'}}>Meta<span style={{color:'#4f7bff'}}>Go</span></span>
          </Link>
          <div style={{display:'flex',gap:28}}>
            <Link href="/developers" style={{fontSize:12,fontWeight:600,color:'#979bb0',textDecoration:'none',letterSpacing:'0.04em'}}>Developers</Link>
            <Link href="/docs" style={{fontSize:12,fontWeight:600,color:'#979bb0',textDecoration:'none',letterSpacing:'0.04em'}}>Docs</Link>
            <Link href="/about" style={{fontSize:12,fontWeight:600,color:'#f5f6fa',textDecoration:'none',letterSpacing:'0.04em'}}>About</Link>
          </div>
          <Link href="/auth" style={{padding:'7px 18px',background:'linear-gradient(90deg,#4f7bff,#9b5bff)',borderRadius:8,fontSize:12,fontWeight:700,color:'#fff',textDecoration:'none'}}>Connect</Link>
        </div>
      </header>

      <main style={{paddingTop:58}}>

        {/* HERO */}
        <section style={{position:'relative',padding:'100px 24px 80px',textAlign:'center',overflow:'hidden'}}>
          <div className="hero-glow" style={{width:600,height:600,background:'rgba(79,123,255,0.12)',top:-200,left:'50%',transform:'translateX(-50%)',animation:'pulse-ring 6s ease-in-out infinite'}}/>
          <div className="hero-glow" style={{width:400,height:400,background:'rgba(155,91,255,0.1)',top:-100,left:'50%',transform:'translateX(-50%)',animation:'pulse-ring 6s ease-in-out infinite 1s'}}/>
          <div style={{position:'relative',maxWidth:800,margin:'0 auto'}}>
            <div className="pill fade-up"><span>⬡</span> Sovereign Identity Protocol</div>
            <h1 className="hero-title fade-up" style={{fontSize:58,fontWeight:800,lineHeight:1.1,marginBottom:24,letterSpacing:'-0.025em',animationDelay:'0.1s'}}>
              The <span className="grad-text">Sovereign Identity</span> Protocol
            </h1>
            <p className="fade-up" style={{fontSize:18,color:'#979bb0',lineHeight:1.75,maxWidth:640,margin:'0 auto 40px',animationDelay:'0.2s'}}>
              Meta Go replaces passwords, centralized social logins, and insecure KYC with cryptographic proof-of-humanity — giving every user a self-sovereign identity that lives on-chain and belongs to no corporation.
            </p>
            <div className="fade-up" style={{display:'inline-block',padding:'18px 36px',background:'rgba(15,17,28,0.9)',border:'1px solid rgba(155,91,255,0.3)',borderRadius:14,animationDelay:'0.3s'}}>
              <p style={{fontSize:17,fontWeight:700,letterSpacing:'-0.01em',lineHeight:1.5}}>
                <span className="grad-text">"One cryptographic identity.</span><br/>
                Verifiable on any chain.<br/>
                Owned only by you."
              </p>
            </div>
          </div>
        </section>

        {/* PROBLEMS */}
        <section style={{padding:'60px 24px 80px'}}>
          <div style={{maxWidth:1200,margin:'0 auto'}}>
            <div style={{textAlign:'center',marginBottom:56}}>
              <div className="pill" style={{background:'rgba(239,68,68,0.08)',borderColor:'rgba(239,68,68,0.2)',color:'#ef4444'}}>⚠ The Problem</div>
              <h2 style={{fontSize:38,fontWeight:800,letterSpacing:'-0.02em',marginBottom:14}}>
                Four Failures of <span className="grad-text">Modern Identity</span>
              </h2>
              <p style={{fontSize:15,color:'#979bb0',maxWidth:520,margin:'0 auto',lineHeight:1.7}}>
                Today's identity infrastructure was built for a web that no longer exists. These four failures cost users their privacy, security, and autonomy every day.
              </p>
            </div>
            <div className="problems-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
              {problems.map((p) => (
                <div key={p.title} className="glass-card" style={{padding:'28px 28px'}}>
                  <div style={{display:'flex',gap:18,alignItems:'flex-start'}}>
                    <div className="problem-icon" style={{background:p.color}}>{p.icon}</div>
                    <div>
                      <h3 style={{fontSize:17,fontWeight:700,marginBottom:8,color:p.iconColor}}>{p.title}</h3>
                      <p style={{fontSize:14,color:'#979bb0',lineHeight:1.75}}>{p.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PILLARS */}
        <section style={{padding:'40px 24px 80px',background:'rgba(255,255,255,0.01)'}}>
          <div style={{maxWidth:1200,margin:'0 auto'}}>
            <div style={{textAlign:'center',marginBottom:56}}>
              <div className="pill">⚙ Technology</div>
              <h2 style={{fontSize:38,fontWeight:800,letterSpacing:'-0.02em',marginBottom:14}}>
                Six <span className="grad-text">Cryptographic Pillars</span>
              </h2>
              <p style={{fontSize:15,color:'#979bb0',maxWidth:520,margin:'0 auto',lineHeight:1.7}}>
                Every layer of Meta Go is purpose-built around a single principle: the user is the only authority over their own identity.
              </p>
            </div>
            <div className="pillars-grid" style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:20}}>
              {pillars.map((p) => (
                <div key={p.title} className="glass-card" style={{padding:'28px 24px'}}>
                  <div className="pillar-icon-bg" style={{background:p.bg}}>{p.icon}</div>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.1em',color:'#979bb0',marginBottom:8,textTransform:'uppercase'}}>{p.label}</div>
                  <h3 style={{fontSize:16,fontWeight:700,marginBottom:12,lineHeight:1.3}}>{p.title}</h3>
                  <p style={{fontSize:13.5,color:'#979bb0',lineHeight:1.75,marginBottom:16}}>{p.desc}</p>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {p.tags.map((t) => (
                      <span key={t} style={{padding:'3px 9px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:5,fontSize:11,fontWeight:600,color:'#63677c',fontFamily:'Menlo,monospace'}}>{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ARCHITECTURE */}
        <section style={{padding:'60px 24px 80px'}}>
          <div style={{maxWidth:1200,margin:'0 auto'}}>
            <div style={{textAlign:'center',marginBottom:48}}>
              <div className="pill">🏗 Architecture</div>
              <h2 style={{fontSize:38,fontWeight:800,letterSpacing:'-0.02em',marginBottom:14}}>
                System <span className="grad-text">Architecture</span>
              </h2>
              <p style={{fontSize:15,color:'#979bb0',maxWidth:480,margin:'0 auto',lineHeight:1.7}}>
                A layered, decoupled stack — each layer communicates through well-defined interfaces.
              </p>
            </div>
            <div className="arch-flex" style={{display:'flex',gap:24,alignItems:'stretch'}}>
              <div className="arch-box" style={{flex:'1 1 0'}}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.08em',color:'#63677c',marginBottom:16,textTransform:'uppercase'}}>{'// data flow'}</div>
                <div style={{color:'#6bf5b5'}}>Browser (Next.js 14 / React)</div>
                <div style={{paddingLeft:20,color:'#a0b0ff'}}>├── Wagmi / Viem (wallet connect)</div>
                <div style={{paddingLeft:20,color:'#a0b0ff'}}>├── TensorFlow.js FaceMesh (biometrics)</div>
                <div style={{paddingLeft:20,color:'#a0b0ff'}}>└── snarkjs (ZK proof generation)</div>
                <div style={{color:'#63677c',margin:'8px 0'}}>{'       ↓  HTTPS / WebSocket'}</div>
                <div style={{color:'#c56bff'}}>FastAPI BFF  (port 8005)</div>
                <div style={{paddingLeft:20,color:'#a0b0ff'}}>├── SIWE nonce + verify</div>
                <div style={{paddingLeft:20,color:'#a0b0ff'}}>├── Biometric pipeline</div>
                <div style={{paddingLeft:20,color:'#a0b0ff'}}>├── ZK proof verifier</div>
                <div style={{paddingLeft:20,color:'#a0b0ff'}}>└── WebSocket relay (Unity SDK)</div>
                <div style={{color:'#63677c',margin:'8px 0'}}>{'       ↓'}</div>
                <div style={{color:'#fbbf24'}}>{'MongoDB  (users, sessions, sbts,'}</div>
                <div style={{paddingLeft:20,color:'#fbbf24'}}>{'         audit_logs, recovery_sessions)'}</div>
                <div style={{color:'#63677c',margin:'8px 0'}}>{'       ↓  Web3.py / Hardhat JSON-RPC'}</div>
                <div style={{color:'#4f7bff'}}>Ethereum / Polygon Amoy / Arbitrum</div>
                <div style={{paddingLeft:20,color:'#a0b0ff'}}>├── IdentityRegistry.sol (UUPS)</div>
                <div style={{paddingLeft:20,color:'#a0b0ff'}}>├── CelestialSBT.sol (ERC-5192)</div>
                <div style={{paddingLeft:20,color:'#a0b0ff'}}>├── Groth16Verifier.sol</div>
                <div style={{paddingLeft:20,color:'#a0b0ff'}}>└── Chainlink CCIP (cross-chain sync)</div>
              </div>
              <div className="arch-right" style={{flex:'0 0 320px',display:'flex',flexDirection:'column',gap:12}}>
                <div style={{fontSize:12,fontWeight:700,color:'#63677c',letterSpacing:'0.08em',textTransform:'uppercase',paddingLeft:4}}>Identity Lifecycle</div>
                {lifecycleSteps.map(([num, title, sub]) => (
                  <div key={num} style={{display:'flex',gap:14,alignItems:'center',background:'var(--card)',border:'1px solid var(--cb)',borderRadius:10,padding:'12px 16px'}}>
                    <div style={{width:26,height:26,borderRadius:8,background:'linear-gradient(135deg,#4f7bff,#9b5bff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff',flexShrink:0}}>{num}</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:'#f5f6fa'}}>{title}</div>
                      <div style={{fontSize:11,color:'#63677c',marginTop:2,fontFamily:'Menlo,monospace'}}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* STACK TABLE */}
        <section style={{padding:'40px 24px 80px',background:'rgba(255,255,255,0.01)'}}>
          <div style={{maxWidth:1200,margin:'0 auto'}}>
            <div style={{textAlign:'center',marginBottom:48}}>
              <div className="pill">🛠 Stack</div>
              <h2 style={{fontSize:38,fontWeight:800,letterSpacing:'-0.02em',marginBottom:14}}>
                Full <span className="grad-text">Technology Stack</span>
              </h2>
            </div>
            <div className="glass-card" style={{overflow:'hidden'}}>
              <table>
                <thead>
                  <tr>
                    <th>Layer</th>
                    <th>Technologies</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Frontend</td><td>Next.js 14, React, Wagmi, Viem, TensorFlow.js FaceMesh, snarkjs, Ethers.js</td></tr>
                  <tr><td>Backend</td><td>FastAPI, PyMongo, PyJWT, Web3.py, Python SIWE, Uvicorn, WebSockets</td></tr>
                  <tr><td>Blockchain</td><td>Hardhat, Solidity ^0.8.24, Circom, OpenZeppelin Upgradeable, Chainlink CCIP</td></tr>
                  <tr><td>Database</td><td>MongoDB (users, sessions, sbts, audit_logs, used_nullifiers, recovery_sessions)</td></tr>
                  <tr><td>Game SDK</td><td>C# / .NET, Unity compatible — MetaGoSDK.cs, WebSocket relay (ws://localhost:8001)</td></tr>
                  <tr><td>Chains</td><td>Polygon Amoy (primary), Ethereum testnet, Arbitrum — cross-chain via Chainlink CCIP</td></tr>
                  <tr><td>Auth</td><td>SIWE (EIP-4361), Browser cookie sessions, JWT refresh tokens, HTTP-only cookies</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* RESEARCH */}
        <section style={{padding:'40px 24px 80px'}}>
          <div style={{maxWidth:1200,margin:'0 auto'}}>
            <div style={{textAlign:'center',marginBottom:48}}>
              <div className="pill" style={{background:'rgba(52,211,153,0.08)',borderColor:'rgba(52,211,153,0.2)',color:'#34d399'}}>📚 Research</div>
              <h2 style={{fontSize:38,fontWeight:800,letterSpacing:'-0.02em',marginBottom:14}}>
                Research <span className="grad-text">Foundations</span>
              </h2>
              <p style={{fontSize:15,color:'#979bb0',maxWidth:520,margin:'0 auto',lineHeight:1.7}}>
                Meta Go is built on open, peer-reviewed standards and proven cryptographic primitives — not proprietary black boxes.
              </p>
            </div>
            <div style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:0,maxWidth:800,margin:'0 auto 60px'}}>
              {researchFoundations.map((r) => (
                <span key={r} className="research-tag">{r}</span>
              ))}
            </div>

            {/* MISSION CALLOUT */}
            <div style={{textAlign:'center',padding:'56px 40px',background:'linear-gradient(135deg, rgba(79,123,255,0.06) 0%, rgba(155,91,255,0.06) 100%)',border:'1px solid rgba(155,91,255,0.2)',borderRadius:20,maxWidth:760,margin:'0 auto'}}>
              <div style={{fontSize:40,marginBottom:20}}>⬡</div>
              <h3 style={{fontSize:30,fontWeight:800,letterSpacing:'-0.02em',marginBottom:16}}>
                <span className="grad-text">One cryptographic identity.</span>
              </h3>
              <p style={{fontSize:18,fontWeight:600,color:'#f5f6fa',marginBottom:8}}>Verifiable on any chain.</p>
              <p style={{fontSize:18,fontWeight:600,color:'#f5f6fa',marginBottom:24}}>Owned only by you.</p>
              <p style={{fontSize:14,color:'#979bb0',lineHeight:1.75,maxWidth:520,margin:'0 auto 32px'}}>
                Meta Go is redefining what it means to prove you are human online — without trusting any company, database, or central authority with your identity.
              </p>
              <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
                <Link href="/auth" style={{padding:'12px 28px',background:'linear-gradient(90deg,#4f7bff,#9b5bff)',borderRadius:10,fontSize:14,fontWeight:700,color:'#fff',textDecoration:'none'}}>
                  Create Your Identity →
                </Link>
                <Link href="/docs" style={{padding:'12px 28px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,fontSize:14,fontWeight:700,color:'#f5f6fa',textDecoration:'none'}}>
                  Read the Docs
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer style={{borderTop:'1px solid rgba(255,255,255,0.08)',padding:'40px 0 24px',marginTop:80}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
          <span style={{fontSize:12,color:'#63677c'}}>© 2024 Meta Go Labs. All rights reserved.</span>
          <div style={{display:'flex',gap:24}}>
            <Link href="/privacy" style={{fontSize:12,color:'#63677c',textDecoration:'none'}}>Privacy</Link>
            <Link href="/terms" style={{fontSize:12,color:'#63677c',textDecoration:'none'}}>Terms</Link>
            <Link href="/security" style={{fontSize:12,color:'#63677c',textDecoration:'none'}}>Security</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
