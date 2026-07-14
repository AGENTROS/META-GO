'use client';
import Link from 'next/link';

const css = `
  :root{--bg:#06070d;--card:#0f111c;--cb:rgba(255,255,255,0.08);--text:#f5f6fa;--dim:#979bb0;--faint:#63677c;--blue:#4f7bff;--purple:#9b5bff;}
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;}
  a{text-decoration:none;color:inherit;}
  .pp-wrap{max-width:800px;margin:0 auto;padding:0 24px;}
  .pp-hero{padding:120px 0 48px;}
  .pp-eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:#8fb4ff;background:rgba(79,123,255,0.1);border:1px solid rgba(79,123,255,0.25);padding:6px 14px;border-radius:20px;margin-bottom:18px;}
  .pp-h1{font-size:36px;font-weight:800;letter-spacing:-0.02em;margin-bottom:10px;}
  .pp-updated{font-size:13px;color:var(--faint);margin-bottom:8px;}
  .pp-lead{font-size:15.5px;line-height:1.7;color:var(--dim);}
  .pp-section{background:var(--card);border:1px solid var(--cb);border-radius:14px;padding:28px 32px;margin-bottom:16px;}
  .pp-section h2{font-size:17px;font-weight:800;margin-bottom:12px;display:flex;align-items:center;gap:9px;}
  .pp-section p,.pp-section li{font-size:14px;line-height:1.75;color:var(--dim);}
  .pp-section ul{list-style:none;padding:0;margin:10px 0 0;}
  .pp-section li{padding:4px 0 4px 20px;position:relative;}
  .pp-section li::before{content:"✓";position:absolute;left:0;color:#34d399;font-size:12px;font-weight:700;}
  .pp-no li::before{content:"✗";color:#f87171;}
  .pp-highlight{background:rgba(79,123,255,0.06);border:1px solid rgba(79,123,255,0.2);border-radius:10px;padding:14px 18px;margin:14px 0;font-size:13px;line-height:1.7;color:#a0aec0;}
  @media(max-width:600px){.pp-h1{font-size:28px;}.pp-section{padding:20px;}}
`;

export default function PrivacyPage() {
  return (
    <div style={{ background:'#06070d',minHeight:'100vh',color:'#f5f6fa' }}>
      <style>{css}</style>
      {/* Nav */}
      <header style={{ position:'fixed',top:0,left:0,right:0,zIndex:100,background:'rgba(6,7,13,0.88)',backdropFilter:'blur(18px)',borderBottom:'1px solid rgba(255,255,255,0.08)',height:58,display:'flex',alignItems:'center' }}>
        <div style={{ maxWidth:1200,margin:'0 auto',padding:'0 28px',width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <Link href="/" style={{ display:'flex',alignItems:'center',gap:9 }}>
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" style={{ filter:'drop-shadow(0 0 5px rgba(107,91,255,0.5))' }}><defs><linearGradient id="pg" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#4f7bff"/><stop offset="55%" stopColor="#8f6bff"/><stop offset="100%" stopColor="#c56bff"/></linearGradient></defs><circle cx="16" cy="16" r="11" fill="url(#pg)"/><g stroke="#0b0d18" strokeWidth="0.9" opacity="0.5" fill="none"><ellipse cx="16" cy="16" rx="11" ry="4.2"/><ellipse cx="16" cy="16" rx="4.2" ry="11"/></g><ellipse cx="16" cy="17" rx="15" ry="5" transform="rotate(-16 16 17)" stroke="#dfe6ff" strokeWidth="1.1" fill="none" opacity="0.9"/></svg>
            <span style={{ fontWeight:700,fontSize:15,color:'#f5f6fa' }}>Meta<span style={{ color:'#4f7bff' }}>Go</span></span>
          </Link>
          <div style={{ display:'flex',gap:24,alignItems:'center' }}>
            <Link href="/docs" style={{ fontSize:12,fontWeight:600,color:'#979bb0',letterSpacing:'0.04em' }}>Docs</Link>
            <Link href="/about" style={{ fontSize:12,fontWeight:600,color:'#979bb0',letterSpacing:'0.04em' }}>About</Link>
            <Link href="/auth" style={{ padding:'6px 16px',background:'linear-gradient(90deg,#4f7bff,#9b5bff)',borderRadius:7,fontSize:12,fontWeight:700,color:'#fff' }}>Connect</Link>
          </div>
        </div>
      </header>

      <div className="pp-wrap">
        <div className="pp-hero">
          <div className="pp-eyebrow">🔒 Legal</div>
          <h1 className="pp-h1">Privacy Policy</h1>
          <p className="pp-updated">Last updated: July 2024</p>
          <p className="pp-lead">Meta Go is a non-custodial, privacy-first sovereign identity protocol. This policy explains exactly what data is collected, how it is used, and what is never collected — based on the actual system implementation.</p>
        </div>

        <div className="pp-section">
          <h2>🟢 1. What We Collect</h2>
          <ul>
            <li><strong>Wallet address</strong> — Your Ethereum wallet public key. This is public by nature of the blockchain.</li>
            <li><strong>Username handle</strong> — Chosen by you during identity registration. Stored in MongoDB.</li>
            <li><strong>Biometric commitment hash</strong> — A mathematical hash of facial landmark coordinates, computed locally in your browser by TensorFlow.js FaceMesh. This is NOT your face image — it is a Poseidon hash of coordinate ratios that is immediately discarded after proof generation.</li>
            <li><strong>Session tokens</strong> — Short-lived JWT access and refresh tokens, stored in HTTP-only cookies. Refresh Token Rotation (RTR) is implemented with family breach detection.</li>
            <li><strong>Audit logs</strong> — Login events, IP addresses, user agents, biometric verification attempts, ZK proof submissions, and recovery operations. Stored in the MongoDB <code style={{fontFamily:'monospace',color:'#4f7bff'}}>audit_logs</code> collection for security monitoring.</li>
          </ul>
        </div>

        <div className="pp-section">
          <h2>🔴 2. What We Do NOT Collect</h2>
          <ul className="pp-no">
            <li><strong>Face images or video</strong> — FaceMesh runs entirely in your browser. No webcam stream is ever transmitted to our servers.</li>
            <li><strong>Private keys or seed phrases</strong> — Meta Go is non-custodial. We never see, store, or have access to your wallet private key.</li>
            <li><strong>Your real name, address, or email</strong> — Unless you voluntarily provide them (e.g., via the contact form). None are required for registration.</li>
            <li><strong>Tracking data</strong> — No third-party analytics. No advertising trackers. No behavioral profiling.</li>
          </ul>
        </div>

        <div className="pp-section">
          <h2>⛓ 3. On-Chain Data</h2>
          <p>Identity registration, Soulbound Token (SBT) minting, and social recovery events are recorded on public blockchains (Polygon Amoy, Ethereum, Arbitrum). This data is publicly visible and permanently immutable by the nature of blockchain technology. On-chain data includes your wallet address, DID identifier, handle, and proof hash.</p>
        </div>

        <div className="pp-section">
          <h2>🔮 4. Zero-Knowledge Proofs</h2>
          <p>Your biometric identity is proven using Groth16 ZK-SNARKs (BN128 curve, compiled from identity.circom). The proof demonstrates you are a unique human without revealing any biometric data. Only the cryptographic proof structure (pi_a, pi_b, pi_c) and 4 public signals (commitment, nullifier, walletHash, timestamp) are submitted. The nullifier ensures one-time-only registration per biometric identity.</p>
        </div>

        <div className="pp-section">
          <h2>🍪 5. Cookies</h2>
          <p>We use HTTP-only session cookies for authentication after SIWE verification. These cookies contain JWT tokens and are not readable by JavaScript. We do not use tracking cookies, third-party cookies, or analytics cookies of any kind.</p>
        </div>

        <div className="pp-section">
          <h2>⏱ 6. Data Retention</h2>
          <ul>
            <li><strong>Audit logs</strong> — Retained for 90 days, then eligible for deletion.</li>
            <li><strong>Session tokens</strong> — Expire based on JWT expiry configuration. Refresh token rotation ensures old tokens are invalidated.</li>
            <li><strong>On-chain data</strong> — Permanent and immutable. Cannot be deleted by design.</li>
            <li><strong>MongoDB user records</strong> — Retained as long as the identity is active. Can be deleted upon account deletion request.</li>
          </ul>
        </div>

        <div className="pp-section">
          <h2>👤 7. User Rights</h2>
          <p>You own your wallet. You own your DID. You own your identity. You can request deletion of off-chain data (audit logs, session data, user profile) by initiating a logout and contacting us via GitHub Issues. On-chain data (SBTs, identity registrations) cannot be deleted due to blockchain immutability.</p>
        </div>

        <div className="pp-section">
          <h2>🇪🇺 8. GDPR Considerations</h2>
          <p>Meta Go processes minimal personal data. Wallet addresses are pseudonymous public keys. IP addresses are logged exclusively for fraud detection and security monitoring (legitimate interest under GDPR Article 6(1)(f)). No personal names, emails, or government IDs are processed unless voluntarily provided. We do not sell or share data with third parties.</p>
        </div>

        <div className="pp-section">
          <h2>📬 9. Contact</h2>
          <p>For privacy questions, data deletion requests, or GDPR inquiries, please open an issue on our <a href="https://github.com" target="_blank" rel="noreferrer" style={{color:'#4f7bff'}}>GitHub repository</a> or visit our <Link href="/contact" style={{color:'#4f7bff'}}>Contact page</Link>.</p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.08)',padding:'32px 0 24px',marginTop:64 }}>
        <div style={{ maxWidth:800,margin:'0 auto',padding:'0 24px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16 }}>
          <span style={{ fontSize:12,color:'#63677c' }}>© 2024 Meta Go Labs. All rights reserved.</span>
          <div style={{ display:'flex',gap:24 }}>
            <Link href="/terms" style={{ fontSize:12,color:'#63677c' }}>Terms</Link>
            <Link href="/security" style={{ fontSize:12,color:'#63677c' }}>Security</Link>
            <Link href="/contact" style={{ fontSize:12,color:'#63677c' }}>Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
