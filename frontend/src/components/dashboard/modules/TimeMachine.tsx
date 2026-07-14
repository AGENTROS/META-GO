'use client';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Network, Database, Cloud, Clock, ShieldCheck, FileText, AlertCircle, Eye } from 'lucide-react';

export default function TimeMachine() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const { address } = useAccount();
  const dummyAddress = address;

  useEffect(() => {
    async function fetchTimeline() {
      if (!address) { setLoading(false); return; }
      try {
        const res = await fetch(`http://localhost:8001/api/privacy/time-machine?address=${dummyAddress}`);
        if (res.ok) {
          const d = await res.json();
          setEvents(d.timeline || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTimeline();
  }, [address]);

  if (loading) {
    return (
      <div style={{ padding: '100px', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="pulse" style={{ display: 'inline-block', marginRight: '8px', background: 'var(--fg)' }}></div>
        Accessing temporal identity logs...
      </div>
    );
  }

  const filtered = filter === 'All' ? events : events.filter(e => e.type === filter.toLowerCase());

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--fg)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Clock size={24} style={{ color: 'var(--violet)' }} />
            Identity Time Machine
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: '8px', fontSize: '15px' }}>
            A complete temporal map of your digital evolution and privacy events.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['All', 'Privacy', 'Audit'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? 'var(--fg)' : 'rgba(255,255,255,0.05)',
                color: filter === f ? 'var(--bg)' : 'var(--muted)',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', paddingLeft: '24px' }}>
        {/* Vertical Timeline Line */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '7px', width: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
        
        {filtered.length === 0 ? (
          <div style={{ padding: '40px', color: 'var(--muted)' }}>No events recorded.</div>
        ) : filtered.map((e, i) => (
          <div key={i} style={{ position: 'relative', marginBottom: '32px' }}>
            {/* Timeline Node */}
            <div style={{ 
              position: 'absolute', left: '-22px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', 
              background: e.type === 'privacy' ? 'var(--violet)' : 'var(--blue)',
              boxShadow: `0 0 10px ${e.type === 'privacy' ? 'var(--violet)' : 'var(--blue)'}`
            }}></div>
            
            <div style={{ background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {e.type === 'privacy' ? <Eye size={16} className="text-violet"/> : <ShieldCheck size={16} className="text-blue"/>}
                    {e.event}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{new Date(e.time).toLocaleString()}</div>
                </div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: e.type === 'privacy' ? 'var(--violet)' : 'var(--blue)', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '4px' }}>
                  {e.type} Event
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
