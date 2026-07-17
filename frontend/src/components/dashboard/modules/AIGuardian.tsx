'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { Mic, MicOff, BrainCircuit, Activity, ShieldAlert, Sparkles, StopCircle, User, Send } from 'lucide-react';
import dynamic from 'next/dynamic';
import { GuardianState } from '../guardian/GuardianTTSProvider';
import { GuardianVoiceController } from '../guardian/GuardianVoiceController';

// Dynamically import Guardian3D to prevent SSR and dashboard block
const Guardian3D = dynamic(() => import('../guardian/Guardian3D'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="pulse" style={{ background: 'var(--violet)' }}></div>
    </div>
  )
});

export default function AIGuardian() {
  const [state, setState] = useState<GuardianState>('idle');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [messages, setMessages] = useState<{role: string, content: string, context?: any}[]>([]);
  const [textInput, setTextInput] = useState('');
  
  const voiceControllerRef = useRef<GuardianVoiceController | null>(null);
  
  const { address } = useAccount();
  const dummyAddress = address || '0x0000000000000000000000000000000000000000';
  const sessionId = useRef(`session_${Date.now()}`).current;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Voice Controller
    voiceControllerRef.current = new GuardianVoiceController(
      (newState) => setState(newState),
      (level) => setAudioLevel(level),
      (res) => {
        setMessages(prev => [
          ...prev, 
          { role: 'assistant', content: res.reply, context: res.context_snapshot }
        ]);
      }
    );

    voiceControllerRef.current.onUserTranscript = (text) => {
      setMessages(prev => [...prev, { role: 'user', content: text }]);
    };

    return () => {
      voiceControllerRef.current?.cleanup();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleMic = () => {
    if (!voiceControllerRef.current) return;
    
    if (state === 'listening') {
      voiceControllerRef.current.stopListening(dummyAddress, sessionId);
    } else {
      voiceControllerRef.current.startListening();
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !voiceControllerRef.current) return;
    
    // Add user message to UI immediately for perceived responsiveness
    setMessages(prev => [...prev, { role: 'user', content: textInput }]);
    
    // Send to backend via controller
    voiceControllerRef.current.sendTextQuery(textInput, dummyAddress, sessionId);
    setTextInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="page-head" style={{ marginBottom: '20px' }}>
        <div>
          <div className="page-eyebrow" style={{ color: 'var(--violet)' }}>
            <BrainCircuit size={12} style={{ display: 'inline', marginRight: '4px' }}/> Hybrid Intelligence
          </div>
          <h1 className="page-title">AI Identity Guardian</h1>
          <p className="page-desc">Interactive 3D secure voice assistant. Powered by MetaGo Intelligence.</p>
        </div>
        <div className="status-pill" style={{ background: 'rgba(91,140,255,0.1)', color: 'var(--blue)', textTransform: 'uppercase' }}>
          State: {state}
        </div>
      </div>

      {/* Main Container */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        gap: '20px',
        flexDirection: 'row', // Default desktop: 3D on left, chat on right
        minHeight: 0
      }}>
        
        {/* Left: 3D Guardian Stage */}
        <div style={{ 
          flex: 1, 
          background: 'rgba(10,10,15,0.8)', 
          borderRadius: '24px', 
          border: '1px solid rgba(255,255,255,0.05)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: 'inset 0 0 50px rgba(0,255,255,0.05)'
        }}>
          <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
            <Activity size={14} /> 
            Live Audio Reactivity: {(audioLevel * 100).toFixed(0)}%
          </div>
          
          <div style={{ flex: 1, width: '100%', minHeight: '300px' }}>
            <Guardian3D state={state} audioLevel={audioLevel} />
          </div>

          {/* Voice Control Bar */}
          <div style={{ 
            padding: '30px', 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
          }}>
            
            {/* Visual Waveform placeholder when listening */}
            <div style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              {state === 'listening' ? (
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[...Array(20)].map((_, i) => (
                    <div key={i} style={{
                      width: '4px',
                      background: 'var(--cyan)',
                      height: `${Math.max(4, audioLevel * 100 * Math.random())}px`,
                      borderRadius: '2px',
                      transition: 'height 0.1s'
                    }} />
                  ))}
                </div>
              ) : state === 'processing' ? (
                <div className="pulse" style={{ background: 'var(--violet)' }}></div>
              ) : null}
            </div>

            <button 
              onClick={toggleMic}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: state === 'listening' ? 'rgba(255,50,50,0.2)' : 'rgba(14, 165, 233, 0.2)',
                border: `2px solid ${state === 'listening' ? 'var(--danger)' : 'var(--cyan)'}`,
                color: state === 'listening' ? 'var(--danger)' : 'var(--cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: `0 0 20px ${state === 'listening' ? 'rgba(255,50,50,0.4)' : 'rgba(14,165,233,0.4)'}`
              }}
            >
              {state === 'listening' ? <StopCircle size={30} /> : <Mic size={30} />}
            </button>
            <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
              {state === 'listening' ? 'Tap to Stop Recording' : state === 'speaking' ? 'Tap to Interrupt' : 'Hold or Tap to Speak'}
            </div>
          </div>
        </div>

        {/* Right: Conversation Context */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          background: 'rgba(20,20,25,0.7)', 
          backdropFilter: 'blur(30px)', 
          border: '1px solid rgba(255,255,255,0.08)', 
          borderRadius: '24px', 
          overflow: 'hidden' 
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} className="text-violet" /> Intelligence Transcript
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', marginTop: '40px' }}>
                Press the microphone and ask about your Trust Score, humanity index, or security status.
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} style={{ 
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth: '85%',
                  background: msg.role === 'user' ? 'rgba(255,255,255,0.05)' : 'rgba(124, 58, 237, 0.1)',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  border: msg.role === 'user' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(124, 58, 237, 0.2)',
                  color: 'var(--fg)',
                  fontSize: '15px',
                  lineHeight: '1.6'
                }}>
                  {msg.role === 'assistant' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--violet)', fontWeight: 600, fontSize: '13px' }}>
                      <Sparkles size={14} /> AI Guardian
                    </div>
                  )}
                  {msg.role === 'user' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--muted)', fontWeight: 600, fontSize: '13px' }}>
                      <User size={14} /> You
                    </div>
                  )}
                  {msg.content}
                </div>
                
                {/* Context Explainability Cards */}
                {msg.context && msg.context.score !== undefined && (
                  <div style={{ marginTop: '12px', background: 'rgba(10,10,12,0.8)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', width: '85%' }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Explainability Context</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div className="stat-card" style={{ flex: 1, padding: '12px' }}>
                        <div className="stat-label">Calculated Score</div>
                        <div className="stat-value text-success" style={{ fontSize: '18px' }}>{msg.context.score}</div>
                      </div>
                    </div>
                  </div>
                )}
                {msg.context && msg.context.threats && msg.context.threats.length > 0 && (
                  <div style={{ marginTop: '12px', background: 'rgba(255,92,114,0.1)', border: '1px solid var(--danger)', borderRadius: '12px', padding: '16px', width: '85%' }}>
                    <div style={{ fontSize: '12px', color: 'var(--danger)', marginBottom: '8px', textTransform: 'uppercase' }}><ShieldAlert size={12} style={{display:'inline'}}/> Active Security Threat</div>
                    {msg.context.threats.map((t:any, i:number) => (
                      <div key={i} style={{ fontSize: '13px', color: 'var(--fg)' }}>{t.event} ({t.time})</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Chat Input */}
          <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
            <form onSubmit={handleSendText} style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type a message or use voice..."
                disabled={state === 'listening' || state === 'processing'}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '14px 20px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '15px'
                }}
              />
              <button 
                type="submit"
                disabled={!textInput.trim() || state === 'listening' || state === 'processing'}
                style={{
                  background: 'var(--violet)',
                  border: 'none',
                  borderRadius: '12px',
                  width: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  cursor: (!textInput.trim() || state === 'listening' || state === 'processing') ? 'not-allowed' : 'pointer',
                  opacity: (!textInput.trim() || state === 'listening' || state === 'processing') ? 0.5 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
