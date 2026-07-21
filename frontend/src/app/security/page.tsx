'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8005';

const css = `
  :root{--bg:#06070d;--card:#0f111c;--cb:rgba(255,255,255,0.08);--text:#f5f6fa;--dim:#979bb0;--faint:#63677c;--blue:#4f7bff;--purple:#9b5bff;--green:#34d399;--grad:linear-gradient(90deg,#4f7bff,#9b5bff);}
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;}
  a{text-decoration:none;color:inherit;}
  .sec-wrap{max-width:1100px;margin:0 auto;padding:0 24px;}
  .sec-hero{padding:120px 0 36px;text-align:center;}
  .sec-eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:#8fb4ff;background:rgba(79,123,255,0.1);border:1px solid rgba(79,123,255,0.25);padding:6px 14px;border-radius:20px;margin-bottom:22px;}
  .sec-h1{font-size:42px;font-weight:800;letter-spacing:-0.02em;margin-bottom:14px;}
  .sec-grad{background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;}
  .sec-sub{font-size:16px;line-height:1.65;color:var(--dim);max-width:600px;margin:0 auto;}
  .tabs{display:flex;gap:0;border-bottom:1px solid var(--cb);margin-bottom:36px;margin-top:36px;}
  .tab{padding:12px 24px;font-size:13px;font-weight:700;color:var(--faint);cursor:pointer;border-bottom:2px solid transparent;transition:color .2s,border-color .2s;}
  .tab:hover{color:var(--dim);}
  .tab.active{color:var(--blue);border-bottom-color:var(--blue);}
  .arch-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:48px;}
  .arch-card{background:var(--card);border:1px solid var(--cb);border-radius:14px;padding:24px;transition:border-color .2s;}
  .arch-card:hover{border-color:rgba(155,91,255,0.3);}
  .arch-card h3{font-size:15px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:9px;}
  .arch-card p{font-size:13px;color:var(--dim);line-height:1.65;}
  .arch-icon{font-size:18px;}
  .arch-highlight{background:rgba(79,123,255,0.06);border:1px solid rgba(79,123,255,0.18);border-radius:8px;padding:10px 14px;margin-top:10px;font-size:12px;color:#8fb4ff;font-family:monospace;}
  .log-table{width:100%;border-collapse:collapse;font-size:13px;}
  .log-table th{text-align:left;padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--faint);border-bottom:1px solid var(--cb);background:rgba(255,255,255,0.02);}
  .log-table td{padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.04);vertical-align:top;}
  .log-table tr:hover td{background:rgba(79,123,255,0.03);}
  .action-badge{display:inline-block;padding:3px 8px;border-radius:5px;font-size:11px;font-weight:700;font-family:monospace;}
  .action-login{background:rgba(52,211,153,0.12);color:#34d399;}
  .action-failed{background:rgba(239,68,68,0.12);color:#f87171;}
  .action-recovery{background:rgba(251,191,36,0.12);color:#fbbf24;}
  .action-zk{background:rgba(155,91,255,0.12);color:#9b5bff;}
  .action-other{background:rgba(255,255,255,0.06);color:var(--dim);}
  .empty-state{text-align:center;padding:64px 24px;color:var(--faint);font-size:14px;}
  .loading-state{text-align:center;padding:48px 24px;color:var(--dim);font-size:13px;}
  .connect-prompt{background:var(--card);border:1px solid var(--cb);border-radius:14px;padding:48px 32px;text-align:center;}
  .connect-prompt h3{font-size:18px;font-weight:700;margin-bottom:10px;}
  .connect-prompt p{font-size:14px;color:var(--dim);margin-bottom:20px;}
  .conn-btn{display:inline-block;padding:10px 24px;background:var(--grad);border-radius:8px;font-size:13px;font-weight:700;color:#fff;}
  @media(max-width:700px){.arch-grid{grid-template-columns:1fr;}.sec-h1{font-size:30px;}}
`;

interface AuditLog {
  _id: string;
  action: string;
  walletAddress: string;
  timestamp: string;
  details?: Record<string, string>;
}

function actionClass(action: string): string {
  if (action.includes('login') || action === 'token_refresh') return 'action-login';
  if (action.includes('failed') || action.includes('revocation')) return 'action-failed';
  if (action.includes('recovery')) return 'action-recovery';
  if (action.includes('zk') || action.includes('biometric') || action.includes('bloom')) return 'action-zk';
  return 'action-other';
}

export default function SecurityPage() {
  const [tab, setTab] = useState<'architecture'|'logs'>('architecture');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    if (tab === 'logs') {
      setLoading(true);
      fetch(`${BACKEND}/api/user/audit-logs`, { credentials:'include' })
        .then(r => {
          if (r.status === 401) { setAuthed(false); setLoading(false); return null; }
          setAuthed(true);
          return r.json();
        })
        .then(data => { if (data) setLogs(data); setLoading(false); })
        .catch(() => { setAuthed(false); setLoading(false); });
    }
  }, [tab]);

  return (
    <div style={{ background:'#06070d',minHeight:'100vh',color:'#f5f6fa' }}>
      <style>{css}</style>
      {/* Nav */}
      <header style={{ position:'fixed',top:0,left:0,right:0,zIndex:100,background:'rgba(6,7,13,0.88)',backdropFilter:'blur(18px)',borderBottom:'1px solid rgba(255,255,255,0.08)',height:58,display:'flex',alignItems:'center' }}>
        <div style={{ maxWidth:1200,margin:'0 auto',padding:'0 28px',width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <Link href="/" style={{ display:'flex',alignItems:'center',gap:9 }}>
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" style={{ filter:'drop-shadow(0 0 5px rgba(107,91,255,0.5))' }}><defs><linearGradient id="sg" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#4f7bff"/><stop offset="55%" stopColor="#8f6bff"/><stop offset="100%" stopColor="#c56bff"/></linearGradient></defs><circle cx="16" cy="16" r="11" fill="url(#sg)"/><g stroke="#0b0d18" strokeWidth="0.9" opacity="0.5" fill="none"><ellipse cx="16" cy="16" rx="11" ry="4.2"/><ellipse cx="16" cy="16" rx="4.2" ry="11"/></g><ellipse cx="16" cy="17" rx="15" ry="5" transform="rotate(-16 16 17)" stroke="#dfe6ff" strokeWidth="1.1" fill="none" opacity="0.9"/></svg>
            <span style={{ fontWeight:700,fontSize:15,color:'#f5f6fa' }}>Meta<span style={{ color:'#4f7bff' }}>Go</span></span>
          </Link>
          <div style={{ display:'flex',gap:24,alignItems:'center' }}>
            <Link href="/docs" style={{ fontSize:12,fontWeight:600,color:'#979bb0',letterSpacing:'0.04em' }}>Docs</Link>
            <Link href="/about" style={{ fontSize:12,fontWeight:600,color:'#979bb0',letterSpacing:'0.04em' }}>About</Link>
            <Link href="/auth" style={{ padding:'6px 16px',background:'linear-gradient(90deg,#4f7bff,#9b5bff)',borderRadius:7,fontSize:12,fontWeight:700,color:'#fff' }}>Connect</Link>
          </div>
        </div>
      </header>

      <div className="sec-wrap">
        <div className="sec-hero">
          <div className="sec-eyebrow">🛡 Security</div>
          <h1 className="sec-h1">Security <span className="sec-grad">Center</span></h1>
          <p className="sec-sub">Explore Meta Go's cryptographic security architecture and review your personal audit log.</p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <div className={`tab ${tab === 'architecture' ? 'active' : ''}`} onClick={() => setTab('architecture')}>Security Architecture</div>
          <div className={`tab ${tab === 'logs' ? 'active' : ''}`} onClick={() => setTab('logs')}>My Audit Logs</div>
        </div>

        {/* Architecture Tab */}
        {tab === 'architecture' && (
          <div>
            <div className="arch-grid">
              {[
                { icon:'🔑', title:'SIWE Authentication', desc:'Challenge-response authentication using wallet signatures (EIP-4361). The backend generates a unique nonce per session. The user signs this nonce with their private key via MetaMask or any EIP-1193 wallet. No passwords exist in the system.', highlight:'Nonce-based replay protection. Session cookies are HTTP-only.' },
                { icon:'🧬', title:'Biometric Privacy', desc:'TensorFlow.js FaceMesh runs entirely inside the user\'s browser. The 4-step liveness sequence (Center, Turn Left, Turn Right, Blink) uses Eye Aspect Ratio (EAR) and nose-to-eye distance ratios. No webcam stream, images, or video are ever transmitted to the server.', highlight:'Landmark coordinates are hashed locally via poseidon_sim_hash() and immediately discarded.' },
                { icon:'🔮', title:'Zero-Knowledge Proofs', desc:'Groth16 proving system on the BN128 curve. The identity.circom circuit compiles to a snarkjs-compatible proving key. The proof demonstrates the user is a unique human without revealing any biometric data. The nullifier prevents double-registration.', highlight:'On-chain verification via Groth16Verifier.sol. Public signals: [commitment, nullifier, walletHash, timestamp]' },
                { icon:'⛓', title:'Soulbound Tokens (ERC-5192)', desc:'CelestialSBT.sol implements ERC-721 with transfer and approval permanently disabled at the Solidity hook level. The locked() function always returns true. Each wallet holds at most one "Meta Go Sovereign ID" (MGSID) token.', highlight:'Transfer revert: "SOULBOUND: transfer disabled". Approval revert: "SOULBOUND: approval disabled".' },
                { icon:'🛡', title:'Social Recovery', desc:'Smart contract-based recovery in IdentityRegistry.sol. Users nominate minimum 3 guardians. Recovery requires 2-of-3 guardian consensus. The passphrase hash is stored on-chain. No company involvement needed — fully autonomous.', highlight:'Guardian approvals tracked in hasApproved mapping. Threshold: session.approvals.length >= 2.' },
                { icon:'🔄', title:'Session Management', desc:'JWT access tokens + refresh tokens stored in HTTP-only cookies. Refresh Token Rotation (RTR) is implemented — each refresh generates a new token pair and invalidates the old. Token reuse triggers full family revocation and a security audit event.', highlight:'Family breach detection: "Refresh token reuse detected (RTR family breach)".' },
                { icon:'⏱', title:'Rate Limiting', desc:'Per-IP rate limits on all sensitive endpoints. Biometric verification, ZK proof submission, and nonce generation are limited to 5–15 requests per minute per IP. Exceeding the limit returns HTTP 429.', highlight:'check_rate_limit("verify_proof", ip, 15)' },
                { icon:'📋', title:'Audit Logging', desc:'All authentication events, biometric verification attempts, ZK proof submissions, recovery operations, and cross-chain syncs are logged to the MongoDB audit_logs collection with timestamps, wallet addresses, IP addresses, and user agents.', highlight:'26 unique audit event types tracked across the backend.' },
              ].map((card, i) => (
                <div className="arch-card" key={i}>
                  <h3><span className="arch-icon">{card.icon}</span>{card.title}</h3>
                  <p>{card.desc}</p>
                  <div className="arch-highlight">{card.highlight}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Logs Tab */}
        {tab === 'logs' && (
          <div>
            {loading && <div className="loading-state">Loading audit logs…</div>}
            {!loading && authed === false && (
              <div className="connect-prompt">
                <h3>🔒 Authentication Required</h3>
                <p>Connect your wallet and sign in to view your personal security audit log.</p>
                <Link href="/auth" className="conn-btn">Connect Wallet</Link>
              </div>
            )}
            {!loading && authed && logs.length === 0 && (
              <div className="empty-state">
                <p>No audit events found for your wallet.</p>
                <p style={{ marginTop:8,fontSize:12 }}>Events are recorded when you sign in, submit biometric verifications, generate ZK proofs, or interact with recovery features.</p>
              </div>
            )}
            {!loading && authed && logs.length > 0 && (
              <div style={{ background:'var(--card)',border:'1px solid var(--cb)',borderRadius:14,overflow:'hidden' }}>
                <table className="log-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Timestamp</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr key={log._id || i}>
                        <td><span className={`action-badge ${actionClass(log.action)}`}>{log.action}</span></td>
                        <td style={{ fontSize:12,color:'var(--dim)',fontFamily:'monospace' }}>{log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}</td>
                        <td style={{ fontSize:12,color:'var(--faint)',maxWidth:300,wordBreak:'break-word' }}>
                          {log.details ? Object.entries(log.details).map(([k, v]) => (
                            <span key={k} style={{ display:'block' }}><strong style={{ color:'var(--dim)' }}>{k}:</strong> {typeof v === 'string' ? v : JSON.stringify(v)}</span>
                          )) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.08)',padding:'32px 0 24px',marginTop:80 }}>
        <div style={{ maxWidth:1100,margin:'0 auto',padding:'0 24px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16 }}>
          <span style={{ fontSize:12,color:'#63677c' }}>© 2024 Meta Go Labs. All rights reserved.</span>
          <div style={{ display:'flex',gap:24 }}>
            <Link href="/privacy" style={{ fontSize:12,color:'#63677c' }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize:12,color:'#63677c' }}>Terms</Link>
            <Link href="/docs" style={{ fontSize:12,color:'#63677c' }}>Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
