'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { Sparkles, Send, Shield, Activity, Hexagon, BrainCircuit } from 'lucide-react';

export default function AIGuardian() {
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: 'I am your MetaGo AI Identity Guardian. I monitor your trust score, humanity index, and security logs in real time. How can I assist you today?', context: null }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const { address } = useAccount();
  const dummyAddress = address;

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userQuery = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:8001/api/dashboard/intelligence/ask?address=${dummyAddress}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply, context: data.context_snapshot }]);
      } else {
        throw new Error('Failed to fetch AI response');
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Neural link disrupted. I cannot reach the backend right now.', context: null }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-head" style={{ marginBottom: '20px' }}>
        <div>
          <div className="page-eyebrow" style={{ color: 'var(--violet)' }}>
            <BrainCircuit size={12} style={{ display: 'inline', marginRight: '4px' }}/> Hybrid Intelligence
          </div>
          <h1 className="page-title">AI Identity Guardian</h1>
          <p className="page-desc">Your deterministic copilot. All insights are grounded directly in your cryptographic state.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 220px)', minHeight: '600px', background: 'rgba(20,20,25,0.7)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
        
        {/* Chat History */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '30px'
            }}>
              <div style={{ 
                maxWidth: '70%', 
                background: msg.role === 'user' ? 'rgba(255,255,255,0.05)' : 'transparent',
                padding: msg.role === 'user' ? '16px 20px' : '0',
                borderRadius: '16px',
                border: msg.role === 'user' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                color: 'var(--fg)',
                fontSize: msg.role === 'user' ? '15px' : '16px',
                lineHeight: '1.6'
              }}>
                {msg.role === 'assistant' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--violet)', fontWeight: 600 }}>
                    <Sparkles size={16} /> MetaGo Guardian
                  </div>
                )}
                {msg.content}
              </div>

              {/* Explainability Widgets (Inline JSON Context Rendering) */}
              {msg.context && (
                <div style={{ marginTop: '20px', width: '100%', maxWidth: '70%', background: 'rgba(10,10,12,0.8)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Context Source</div>
                  
                  {/* Trust Score Rendering */}
                  {msg.context.score !== undefined && msg.context.recommendations !== undefined && (
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div className="stat-card" style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '16px' }}>
                        <div className="stat-label">Calculated Score</div>
                        <div className="stat-value text-success">{msg.context.score}</div>
                      </div>
                      <div style={{ flex: 2 }}>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>Recommended Actions</div>
                        {msg.context.recommendations.length > 0 ? msg.context.recommendations.map((r:any, i:number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', marginBottom: '8px', fontSize: '13px' }}>
                            <span>{r.action}</span>
                            <span className="text-success">{r.impact}</span>
                          </div>
                        )) : (
                          <div style={{ color: 'var(--muted)', fontSize: '13px' }}>No pending recommendations. Optimization complete.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Threat Context Rendering */}
                  {msg.context.threats && (
                    <div>
                      {msg.context.threats.length === 0 ? (
                        <div className="stag ok"><Shield size={12} style={{marginRight:'4px'}}/> No Threats Detected</div>
                      ) : (
                        msg.context.threats.map((t:any, i:number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,92,114,0.1)', border: '1px solid var(--danger)', borderRadius: '6px', marginBottom: '8px', fontSize: '13px' }}>
                            <span style={{ color: 'var(--danger)' }}>{t.event}</span>
                            <span style={{ color: 'var(--muted)' }}>{t.time}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--violet)' }}>
              <div className="pulse" style={{ background: 'var(--violet)' }}></div> Analyzing cryptographic state...
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '20px 40px', background: 'rgba(10,10,12,0.9)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Guardian about your trust score, security posture, or identity state..."
              style={{ 
                flex: 1, 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '24px', 
                padding: '16px 24px', 
                color: 'var(--fg)', 
                fontSize: '15px',
                outline: 'none',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
              }}
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              style={{
                background: 'var(--violet)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '54px',
                height: '54px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.5 : 1,
                boxShadow: '0 4px 15px rgba(118,103,255,0.4)'
              }}
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
