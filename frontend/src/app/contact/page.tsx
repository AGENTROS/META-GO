'use client';
import { useState } from 'react';
import Link from 'next/link';

const css = `
  :root{--bg:#06070d;--card:#0f111c;--cb:rgba(255,255,255,0.08);--text:#f5f6fa;--dim:#979bb0;--faint:#63677c;--blue:#4f7bff;--purple:#9b5bff;--green:#34d399;--grad:linear-gradient(90deg,#4f7bff,#9b5bff);}
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;}
  a{text-decoration:none;color:inherit;}
  .ct-wrap{max-width:900px;margin:0 auto;padding:0 24px;}
  .ct-hero{padding:120px 0 48px;text-align:center;}
  .ct-eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:#8fb4ff;background:rgba(79,123,255,0.1);border:1px solid rgba(79,123,255,0.25);padding:6px 14px;border-radius:20px;margin-bottom:22px;}
  .ct-h1{font-size:42px;font-weight:800;letter-spacing:-0.02em;margin-bottom:14px;}
  .ct-grad{background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;}
  .ct-sub{font-size:16px;line-height:1.65;color:var(--dim);max-width:550px;margin:0 auto;}
  .ch-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:56px;}
  .ch-card{background:var(--card);border:1px solid var(--cb);border-radius:14px;padding:24px;transition:border-color .2s,transform .2s;}
  .ch-card:hover{border-color:rgba(79,123,255,0.3);transform:translateY(-2px);}
  .ch-card h3{font-size:15px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:9px;}
  .ch-card p{font-size:13px;color:var(--dim);line-height:1.6;}
  .ch-icon{font-size:20px;}
  .form-section{margin-bottom:64px;}
  .form-title{font-size:22px;font-weight:800;margin-bottom:8px;}
  .form-desc{font-size:13.5px;color:var(--dim);margin-bottom:24px;}
  .form-card{background:var(--card);border:1px solid var(--cb);border-radius:16px;padding:32px;}
  .form-group{margin-bottom:18px;}
  .form-label{display:block;font-size:12px;font-weight:700;letter-spacing:0.04em;color:var(--dim);margin-bottom:7px;}
  .form-input{width:100%;padding:11px 16px;background:rgba(255,255,255,0.04);border:1px solid var(--cb);border-radius:9px;color:var(--text);font-size:13.5px;font-family:inherit;outline:none;transition:border-color .2s;}
  .form-input:focus{border-color:rgba(79,123,255,0.5);}
  .form-textarea{min-height:120px;resize:vertical;}
  .form-submit{padding:12px 32px;background:var(--grad);border:none;border-radius:9px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;transition:opacity .2s;}
  .form-submit:hover{opacity:0.9;}
  .form-submit:disabled{opacity:0.5;cursor:not-allowed;}
  .form-note{font-size:12px;color:var(--faint);margin-top:14px;line-height:1.6;padding:12px 16px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.15);border-radius:8px;}
  .success-msg{padding:16px 20px;background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.25);border-radius:10px;color:#34d399;font-size:14px;font-weight:600;text-align:center;}
  @media(max-width:600px){.ch-grid{grid-template-columns:1fr;}.ct-h1{font-size:30px;}}
`;

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div style={{ background:'#06070d',minHeight:'100vh',color:'#f5f6fa' }}>
      <style>{css}</style>
      {/* Nav */}
      <header style={{ position:'fixed',top:0,left:0,right:0,zIndex:100,background:'rgba(6,7,13,0.88)',backdropFilter:'blur(18px)',borderBottom:'1px solid rgba(255,255,255,0.08)',height:58,display:'flex',alignItems:'center' }}>
        <div style={{ maxWidth:1200,margin:'0 auto',padding:'0 28px',width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <Link href="/" style={{ display:'flex',alignItems:'center',gap:9 }}>
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" style={{ filter:'drop-shadow(0 0 5px rgba(107,91,255,0.5))' }}><defs><linearGradient id="ctg" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#4f7bff"/><stop offset="55%" stopColor="#8f6bff"/><stop offset="100%" stopColor="#c56bff"/></linearGradient></defs><circle cx="16" cy="16" r="11" fill="url(#ctg)"/><g stroke="#0b0d18" strokeWidth="0.9" opacity="0.5" fill="none"><ellipse cx="16" cy="16" rx="11" ry="4.2"/><ellipse cx="16" cy="16" rx="4.2" ry="11"/></g><ellipse cx="16" cy="17" rx="15" ry="5" transform="rotate(-16 16 17)" stroke="#dfe6ff" strokeWidth="1.1" fill="none" opacity="0.9"/></svg>
            <span style={{ fontWeight:700,fontSize:15,color:'#f5f6fa' }}>Meta<span style={{ color:'#4f7bff' }}>Go</span></span>
          </Link>
          <div style={{ display:'flex',gap:24,alignItems:'center' }}>
            <Link href="/docs" style={{ fontSize:12,fontWeight:600,color:'#979bb0',letterSpacing:'0.04em' }}>Docs</Link>
            <Link href="/about" style={{ fontSize:12,fontWeight:600,color:'#979bb0',letterSpacing:'0.04em' }}>About</Link>
            <Link href="/auth" style={{ padding:'6px 16px',background:'linear-gradient(90deg,#4f7bff,#9b5bff)',borderRadius:7,fontSize:12,fontWeight:700,color:'#fff' }}>Connect</Link>
          </div>
        </div>
      </header>

      <div className="ct-wrap">
        <div className="ct-hero">
          <div className="ct-eyebrow">✉ Contact</div>
          <h1 className="ct-h1">Get in <span className="ct-grad">Touch</span></h1>
          <p className="ct-sub">Whether you're a developer integrating Meta Go, a researcher interested in ZK identity, or reporting a vulnerability — here's how to reach us.</p>
        </div>

        {/* Channels */}
        <div className="ch-grid">
          {[
            { icon:'🐛', title:'Bug Reports & Features', desc:'Found a bug in the API, frontend, or smart contracts? Submit an issue on our GitHub repository for tracking and resolution.', link:'https://github.com', linkText:'GitHub Issues →' },
            { icon:'💬', title:'Architecture Discussions', desc:'Questions about ZK proof circuits, smart contract design, or cross-chain identity? Use GitHub Discussions for protocol-level conversations.', link:'https://github.com', linkText:'GitHub Discussions →' },
            { icon:'🔒', title:'Security Vulnerabilities', desc:'For responsible disclosure of security vulnerabilities in the Meta Go protocol, smart contracts, or API — review our security architecture first.', link:'/security', linkText:'Security Page →' },
            { icon:'📖', title:'Technical Questions', desc:'For integration questions, API usage, SDK issues, and deployment help — our documentation covers all endpoints, flows, and error codes.', link:'/docs', linkText:'Read Documentation →' },
          ].map((ch, i) => (
            <div className="ch-card" key={i}>
              <h3><span className="ch-icon">{ch.icon}</span>{ch.title}</h3>
              <p>{ch.desc}</p>
              <Link href={ch.link} style={{ display:'inline-block',marginTop:12,fontSize:13,fontWeight:600,color:'#4f7bff' }}>{ch.linkText}</Link>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="form-section">
          <h2 className="form-title">Send a Message</h2>
          <p className="form-desc">Have a question that doesn't fit into the categories above?</p>
          <div className="form-card">
            {sent ? (
              <div className="success-msg">✓ Message received. For official support, please use GitHub Issues.</div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Name or Handle</label>
                  <input className="form-input" type="text" placeholder="@your-handle" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input className="form-input" type="text" placeholder="Integration question, research proposal, etc." value={subject} onChange={e => setSubject(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea className="form-input form-textarea" placeholder="Describe your question or proposal..." value={message} onChange={e => setMessage(e.target.value)} required />
                </div>
                <button type="submit" className="form-submit">Send Message</button>
                <p className="form-note">⚠ This form is for demonstration purposes. For official support and issue tracking, please use <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color:'#4f7bff',textDecoration:'underline' }}>GitHub Issues</a>.</p>
              </form>
            )}
          </div>
        </div>

        {/* Research */}
        <div style={{ background:'rgba(79,123,255,0.06)',border:'1px solid rgba(79,123,255,0.2)',borderRadius:16,padding:'28px 32px',marginBottom:64 }}>
          <h3 style={{ fontSize:16,fontWeight:700,marginBottom:8 }}>🔬 Research Collaboration</h3>
          <p style={{ fontSize:14,color:'#a0aec0',lineHeight:1.7 }}>Meta Go is an academic-grade decentralized identity protocol built on W3C DID specifications, ERC-5192 Soulbound Tokens, and Groth16 zero-knowledge proofs. Researchers interested in ZK proof systems, biometric privacy, cross-chain identity standards, or post-quantum cryptography are welcome to engage via GitHub.</p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.08)',padding:'32px 0 24px' }}>
        <div style={{ maxWidth:900,margin:'0 auto',padding:'0 24px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16 }}>
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
