'use client';
import Link from 'next/link';

const css = `
  :root{--bg:#06070d;--card:#0f111c;--cb:rgba(255,255,255,0.08);--text:#f5f6fa;--dim:#979bb0;--faint:#63677c;--blue:#4f7bff;--purple:#9b5bff;--green:#34d399;--grad:linear-gradient(90deg,#4f7bff,#9b5bff);}
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;}
  a{text-decoration:none;color:inherit;}
  .bl-wrap{max-width:1100px;margin:0 auto;padding:0 24px;}
  .bl-hero{padding:120px 0 48px;text-align:center;}
  .bl-eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:#8fb4ff;background:rgba(79,123,255,0.1);border:1px solid rgba(79,123,255,0.25);padding:6px 14px;border-radius:20px;margin-bottom:22px;}
  .bl-h1{font-size:42px;font-weight:800;letter-spacing:-0.02em;margin-bottom:14px;}
  .bl-grad{background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;}
  .bl-sub{font-size:16px;line-height:1.65;color:var(--dim);max-width:600px;margin:0 auto 32px;}
  .bl-notice{background:rgba(79,123,255,0.06);border:1px solid rgba(79,123,255,0.2);border-radius:12px;padding:16px 22px;margin-bottom:48px;text-align:center;}
  .bl-notice p{font-size:13.5px;color:#a0aec0;line-height:1.6;}
  .bl-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-bottom:64px;}
  .bl-card{background:var(--card);border:1px solid var(--cb);border-radius:16px;padding:28px;transition:border-color .2s,transform .2s;display:flex;flex-direction:column;}
  .bl-card:hover{border-color:rgba(155,91,255,0.35);transform:translateY(-2px);}
  .bl-card-top{display:flex;align-items:center;gap:10px;margin-bottom:14px;}
  .bl-badge{font-size:10.5px;padding:3px 10px;border-radius:5px;font-weight:700;letter-spacing:0.02em;}
  .bl-badge-eng{background:rgba(79,123,255,0.12);border:1px solid rgba(79,123,255,0.25);color:#4f7bff;}
  .bl-badge-res{background:rgba(155,91,255,0.12);border:1px solid rgba(155,91,255,0.25);color:#9b5bff;}
  .bl-badge-sdk{background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.25);color:#34d399;}
  .bl-date{font-size:11px;color:var(--faint);margin-left:auto;}
  .bl-card h3{font-size:16px;font-weight:700;margin-bottom:10px;line-height:1.35;}
  .bl-card p{font-size:13px;color:var(--dim);line-height:1.7;flex:1;}
  .bl-card-footer{display:flex;align-items:center;justify-content:space-between;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.06);}
  .bl-status{font-size:11px;font-weight:600;display:flex;align-items:center;gap:5px;}
  .bl-status-dot{width:6px;height:6px;border-radius:50%;background:#34d399;box-shadow:0 0 6px #34d399;}
  .bl-readmore{font-size:12px;font-weight:600;color:var(--blue);}
  .bl-future{margin-bottom:64px;}
  .bl-future-title{font-size:22px;font-weight:800;margin-bottom:20px;}
  .bl-future-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;}
  .bl-future-card{background:var(--card);border:1px solid var(--cb);border-radius:12px;padding:20px;display:flex;gap:12px;align-items:flex-start;}
  .bl-future-icon{width:36px;height:36px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(155,91,255,0.1);border:1px solid rgba(155,91,255,0.2);font-size:16px;}
  .bl-future-card h4{font-size:14px;font-weight:700;margin-bottom:4px;}
  .bl-future-card p{font-size:12.5px;color:var(--dim);line-height:1.6;}
  @media(max-width:700px){.bl-grid,.bl-future-grid{grid-template-columns:1fr;}.bl-h1{font-size:30px;}}
`;

const NOTES = [
  { badge:'Engineering', badgeClass:'bl-badge-eng', date:'2024', title:'Building Local-First Biometric Verification with TensorFlow.js FaceMesh', summary:'How Meta Go runs FaceMesh entirely in the browser — measuring Eye Aspect Ratio (EAR) for blink detection and nose-to-eye horizontal distance ratios for head rotation — without ever sending video or images to a server. The 4-step liveness sequence (Center → Left → Right → Blink) was designed to defeat static photo and replay attacks.' },
  { badge:'Research', badgeClass:'bl-badge-res', date:'2024', title:'Zero-Knowledge Identity Registration with Groth16 and Circom', summary:'An overview of the identity.circom ZK circuit, the Poseidon hash commitment scheme (poseidon_sim_hash), and how the Groth16 proving system (BN128 curve, snarkjs) generates a proof that a user is a unique human without revealing biometric data. The nullifier system prevents double-registration at the protocol level.' },
  { badge:'Engineering', badgeClass:'bl-badge-eng', date:'2024', title:'Non-Transferable Soulbound Tokens: Implementing ERC-5192 in Solidity', summary:'Deep dive into CelestialSBT.sol — how transfers are blocked at the _update() hook level, how approvals are disabled, and how the ERC-5192 locked() function always returns true. The token name "Meta Go Sovereign ID" (MGSID) serves as a proof-of-humanity badge.' },
  { badge:'Research', badgeClass:'bl-badge-res', date:'2024', title:'Cross-Chain Identity Synchronization with Chainlink CCIP', summary:'How Chainlink CCIP enables a Meta Go identity minted on Polygon Amoy to be verified on Ethereum and Arbitrum. The relayer role in IdentityRegistry.sol handles cross-chain registration via registerCrossChain() with the RELAYER_ROLE.' },
  { badge:'Engineering', badgeClass:'bl-badge-eng', date:'2024', title:'Smart Contract Social Recovery: 2-of-3 Guardian Consensus', summary:'A technical walkthrough of the social recovery flow in IdentityRegistry.sol — setting up minimum 3 guardians, initiating recovery sessions, guardian approval with hasApproved mapping, and the 2/3 threshold execution that migrates identity to a new wallet.' },
  { badge:'SDK', badgeClass:'bl-badge-sdk', date:'2024', title:'Unity SDK Integration: Bringing Sovereign Identity to the Metaverse', summary:'How MetaGoSDK.cs enables Unity game developers to integrate Meta Go SIWE authentication via WebSocket relay. The flow: StartLogin() → OIDC browser popup → WebSocket listener → auth_success payload → MetaUserInfo deserialization → VRM avatar IPFS loading.' },
];

export default function BlogPage() {
  return (
    <div style={{ background:'#06070d',minHeight:'100vh',color:'#f5f6fa' }}>
      <style>{css}</style>
      {/* Nav */}
      <header style={{ position:'fixed',top:0,left:0,right:0,zIndex:100,background:'rgba(6,7,13,0.88)',backdropFilter:'blur(18px)',borderBottom:'1px solid rgba(255,255,255,0.08)',height:58,display:'flex',alignItems:'center' }}>
        <div style={{ maxWidth:1200,margin:'0 auto',padding:'0 28px',width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <Link href="/" style={{ display:'flex',alignItems:'center',gap:9 }}>
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" style={{ filter:'drop-shadow(0 0 5px rgba(107,91,255,0.5))' }}><defs><linearGradient id="blg" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#4f7bff"/><stop offset="55%" stopColor="#8f6bff"/><stop offset="100%" stopColor="#c56bff"/></linearGradient></defs><circle cx="16" cy="16" r="11" fill="url(#blg)"/><g stroke="#0b0d18" strokeWidth="0.9" opacity="0.5" fill="none"><ellipse cx="16" cy="16" rx="11" ry="4.2"/><ellipse cx="16" cy="16" rx="4.2" ry="11"/></g><ellipse cx="16" cy="17" rx="15" ry="5" transform="rotate(-16 16 17)" stroke="#dfe6ff" strokeWidth="1.1" fill="none" opacity="0.9"/></svg>
            <span style={{ fontWeight:700,fontSize:15,color:'#f5f6fa' }}>Meta<span style={{ color:'#4f7bff' }}>Go</span></span>
          </Link>
          <div style={{ display:'flex',gap:24,alignItems:'center' }}>
            <Link href="/docs" style={{ fontSize:12,fontWeight:600,color:'#979bb0',letterSpacing:'0.04em' }}>Docs</Link>
            <Link href="/about" style={{ fontSize:12,fontWeight:600,color:'#979bb0',letterSpacing:'0.04em' }}>About</Link>
            <Link href="/auth" style={{ padding:'6px 16px',background:'linear-gradient(90deg,#4f7bff,#9b5bff)',borderRadius:7,fontSize:12,fontWeight:700,color:'#fff' }}>Connect</Link>
          </div>
        </div>
      </header>

      <div className="bl-wrap">
        <div className="bl-hero">
          <div className="bl-eyebrow">📝 Blog</div>
          <h1 className="bl-h1">Engineering Notes &amp; <span className="bl-grad">Research</span></h1>
          <p className="bl-sub">Technical deep-dives into the cryptographic systems powering Meta Go's sovereign identity protocol.</p>
        </div>

        <div className="bl-notice">
          <p>Meta Go is in active development. These are engineering notes documenting real implementations in the codebase — not marketing content. Formal research papers will be published as the protocol matures.</p>
        </div>

        {/* Notes Grid */}
        <div className="bl-grid">
          {NOTES.map((note, i) => (
            <div className="bl-card" key={i}>
              <div className="bl-card-top">
                <span className={`bl-badge ${note.badgeClass}`}>{note.badge}</span>
                <span className="bl-date">{note.date}</span>
              </div>
              <h3>{note.title}</h3>
              <p>{note.summary}</p>
              <div className="bl-card-footer">
                <span className="bl-status"><span className="bl-status-dot" /> Published</span>
                <Link href="/docs" className="bl-readmore">Read in docs →</Link>
              </div>
            </div>
          ))}
        </div>

        {/* Future Research */}
        <div className="bl-future">
          <h2 className="bl-future-title">Future Research Directions</h2>
          <div className="bl-future-grid">
            {[
              { icon:'🎙', title:'Voice Biometric Integration', desc:'Adding voice pattern analysis as a second liveness factor alongside FaceMesh facial detection.' },
              { icon:'📜', title:'W3C Verifiable Credentials', desc:'Full compliance with the W3C Verifiable Credentials Data Model for interoperable credential exchange.' },
              { icon:'🔑', title:'MPC Threshold Signatures', desc:'Decentralized key management using Multi-Party Computation for enhanced wallet security without seed phrases.' },
              { icon:'📱', title:'Mobile SDK (iOS / Android)', desc:'Native Swift and Kotlin SDKs for mobile applications, extending beyond the current Unity C# SDK.' },
            ].map((f, i) => (
              <div className="bl-future-card" key={i}>
                <div className="bl-future-icon">{f.icon}</div>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
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
