'use client';
import React, { useState } from 'react';
import { Mail, Send, Inbox, Star, Archive, Search, Lock, Edit3, CornerUpLeft } from 'lucide-react';

const MOCK_MAILS = [
  { id: 1, from: 'vitalik.eth', subject: 'Ethereum 2.0 Identity Protocol Integration', preview: 'We should discuss how MetaGo can seamlessly integrate with the upcoming identity precompiles...', time: '10:42 AM', unread: true },
  { id: 2, from: 'did:metago:0x89...342', subject: 'Encrypted: Biometric Vault Sync', preview: 'Your recent Soulbound Token transfer requires multi-sig approval. Please review the attached ZK proof.', time: 'Yesterday', unread: true },
  { id: 3, from: 'Aave Governance', subject: 'Proposal 482 - Voting Required', preview: 'A new proposal regarding the collateralization of identity scores is live. Cast your vote securely.', time: 'Jul 12', unread: false },
  { id: 4, from: 'MetaGo Security', subject: 'Security Alert: New Device Login', preview: 'A new login was detected from IP 192.168.1.1. If this was not you, please lock your account immediately.', time: 'Jul 10', unread: false },
];

export default function DIDMail() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [activeMail, setActiveMail] = useState<any>(MOCK_MAILS[0]);
  const [isComposing, setIsComposing] = useState(false);

  return (
    <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-head" style={{ marginBottom: '20px' }}>
        <div>
          <div className="page-eyebrow">Communications</div>
          <h1 className="page-title">
            <div className="picon"><Mail size={18} /></div>
            Secure Mail
          </h1>
          <p className="page-desc">
            Zero-Knowledge encrypted, P2P messaging built entirely on your Decentralized Identifier.
          </p>
        </div>
        <button 
          className="tbtn primary" 
          onClick={() => setIsComposing(true)}
          style={{ background: 'var(--violet)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold' }}
        >
          <Edit3 size={16} style={{ marginRight: '8px' }}/> Compose
        </button>
      </div>

      <div className="card" style={{ flex: 1, padding: 0, display: 'flex', overflow: 'hidden', background: 'rgba(20,20,25,0.7)', backdropFilter: 'blur(30px)', border: '1px solid var(--border)' }}>
        
        {/* Mail Sidebar */}
        <div style={{ width: '240px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px' }}>
            <div className="searchbar" style={{ width: '100%', marginBottom: '20px', background: 'rgba(255,255,255,0.03)' }}>
              <Search size={14} />
              <input type="text" placeholder="Search..." style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className={`nav-item ${activeTab === 'inbox' ? 'active' : ''}`} onClick={() => setActiveTab('inbox')} style={{ cursor: 'pointer', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', background: activeTab === 'inbox' ? 'rgba(139,123,255,0.1)' : 'transparent', color: activeTab === 'inbox' ? 'var(--violet)' : 'var(--muted)' }}>
                <Inbox size={16} /> <span style={{ flex: 1, fontWeight: 600 }}>Inbox</span>
                <span className="nav-badge" style={{ background: 'var(--violet)' }}>2</span>
              </div>
              <div className="nav-item" style={{ cursor: 'pointer', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--muted)' }}>
                <Send size={16} /> <span style={{ fontWeight: 600 }}>Sent</span>
              </div>
              <div className="nav-item" style={{ cursor: 'pointer', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--muted)' }}>
                <Star size={16} /> <span style={{ fontWeight: 600 }}>Starred</span>
              </div>
              <div className="nav-item" style={{ cursor: 'pointer', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--muted)' }}>
                <Archive size={16} /> <span style={{ fontWeight: 600 }}>Archive</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mail List */}
        {!isComposing && (
          <div style={{ width: '350px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Primary Inbox
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {MOCK_MAILS.map(mail => (
                <div 
                  key={mail.id} 
                  onClick={() => setActiveMail(mail)}
                  style={{ 
                    padding: '16px 20px', 
                    borderBottom: '1px solid var(--border)', 
                    cursor: 'pointer',
                    background: activeMail?.id === mail.id ? 'rgba(255,255,255,0.03)' : 'transparent',
                    borderLeft: activeMail?.id === mail.id ? '3px solid var(--violet)' : '3px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontWeight: mail.unread ? 700 : 500, color: mail.unread ? '#fff' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {mail.unread && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--violet)' }}></div>}
                      {mail.from}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{mail.time}</div>
                  </div>
                  <div style={{ fontWeight: mail.unread ? 600 : 500, fontSize: '13px', color: '#fff', marginBottom: '6px' }}>
                    {mail.subject}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {mail.preview}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mail Content Pane */}
        {!isComposing ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {activeMail ? (
              <>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', marginBottom: '12px', color: '#fff' }}>{activeMail.subject}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="user-avatar" style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, var(--violet), var(--pink))', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {activeMail.from.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{activeMail.from}</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Lock size={10} className="text-success" /> End-to-end encrypted
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '12px' }}>{activeMail.time}</div>
                </div>
                <div style={{ padding: '30px', flex: 1, overflowY: 'auto', color: 'var(--text)', lineHeight: '1.7' }}>
                  <p>{activeMail.preview}</p>
                  <p style={{ marginTop: '16px' }}>This message was securely transmitted over the MetaGo decentralized network and decrypted locally using your private keys. No central server has access to the contents of this communication.</p>
                  
                  <div style={{ marginTop: '40px', padding: '16px', background: 'rgba(62, 207, 142, 0.1)', border: '1px solid rgba(62, 207, 142, 0.2)', borderRadius: '12px', color: 'var(--success)', display: 'inline-block' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>ZK-Signature Valid</div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>Identity verified cryptographically without revealing private data.</div>
                  </div>
                </div>
                <div style={{ padding: '20px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
                  <div className="searchbar" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', padding: '12px 20px' }}>
                    <CornerUpLeft size={16} />
                    <input type="text" placeholder="Reply securely..." style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%' }} />
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                Select a message to read
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', color: '#fff' }}>New Secure Message</h2>
              <button className="tbtn" onClick={() => setIsComposing(false)}>Discard</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <div style={{ width: '60px', color: 'var(--muted)', fontWeight: 600 }}>To:</div>
                <input type="text" placeholder="Wallet Address or MetaGo Handle" style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', flex: 1 }} />
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <div style={{ width: '60px', color: 'var(--muted)', fontWeight: 600 }}>Subject:</div>
                <input type="text" placeholder="Enter subject" style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', flex: 1 }} />
              </div>
              
              <textarea 
                placeholder="Write your encrypted message here..." 
                style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', color: '#fff', outline: 'none', resize: 'none', marginTop: '10px' }}
              />
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  className="tbtn primary" 
                  onClick={() => setIsComposing(false)}
                  style={{ background: 'var(--violet)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold' }}
                >
                  <Send size={16} style={{ marginRight: '8px' }}/> Encrypt & Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
