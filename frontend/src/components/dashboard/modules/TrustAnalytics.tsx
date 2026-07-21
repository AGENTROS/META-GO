'use client';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Activity, TrendingUp, TrendingDown, Target, Shield, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TrustAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { address } = useAccount();
  const dummyAddress = address;

  useEffect(() => {
    async function fetchAnalytics() {
      const fallbackData = {
        current_trust: 92,
        current_humanity: 98,
        timeline: [
          {"month": "Jan", "trust": 65, "humanity": 50},
          {"month": "Feb", "trust": 75, "humanity": 70},
          {"month": "Mar", "trust": 85, "humanity": 85},
          {"month": "Apr", "trust": 92, "humanity": 98}
        ],
        recommendations: [
          {action: "Rotate Burner DID for enhanced privacy", impact: "+2 Trust Score"},
          {action: "Link GitHub account to expand Identity Graph", impact: "+5 Humanity Index"}
        ]
      };

      if (!address) { 
        setData(fallbackData);
        setLoading(false); 
        return; 
      }
      try {
        const res = await fetch(`http://localhost:8001/api/dashboard/intelligence/analytics?address=${dummyAddress}`);
        if (res.ok) {
          const d = await res.json();
          setData(d);
        } else {
          throw new Error('API not ok');
        }
      } catch (err) {
        console.error('Failed to fetch analytics, using fallback data', err);
        setData(fallbackData);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [address]);

  if (loading || !data) {
    return (
      <div style={{ padding: '100px', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="pulse" style={{ display: 'inline-block', marginRight: '8px' }}></div>
        Aggregating historical trust data...
      </div>
    );
  }

  const { timeline, current_trust, current_humanity, recommendations } = data;

  return (
    <>
      <div className="page-head" style={{ marginBottom: '20px' }}>
        <div>
          <div className="page-eyebrow" style={{ color: 'var(--success)' }}>
            <Activity size={12} style={{ display: 'inline', marginRight: '4px' }}/> Analytics Engine
          </div>
          <h1 className="page-title">Trust Analytics</h1>
          <p className="page-desc">Historical timeline of your cryptographic reputation and AI-driven growth trajectory.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
        
        {/* Top Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '20px' }}>
          <div className="card" style={{ background: 'rgba(20,20,25,0.7)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}><Shield size={14} style={{ display: 'inline', marginRight: '6px' }}/> Trust Score</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--success)' }}>{current_trust}</div>
            <div className="stag ok" style={{ marginTop: '12px', display: 'inline-flex' }}>Top 12% of Network</div>
          </div>
          
          <div className="card" style={{ background: 'rgba(20,20,25,0.7)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}><Users size={14} style={{ display: 'inline', marginRight: '6px' }}/> Humanity Index</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--blue)' }}>{current_humanity}%</div>
            <div className="stag" style={{ marginTop: '12px', display: 'inline-flex', background: 'rgba(91,140,255,0.1)', color: 'var(--blue)' }}>Highly Verified</div>
          </div>

          <div className="card stack" style={{ background: 'rgba(20,20,25,0.7)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="card-head">
              <div className="card-title"><Target size={16} className="text-violet" /> AI Trust Predictor</div>
            </div>
            <div className="row-list" style={{ overflowY: 'auto' }}>
              {(recommendations || []).length === 0 ? (
                <div style={{ padding: '10px', color: 'var(--muted)', fontSize: '13px' }}>Your trust score is optimized.</div>
              ) : recommendations.map((rec:any, i:number) => (
                <div className="row-item" key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 16px' }}>
                  <div className="row-body">
                    <div className="row-title">{rec.action}</div>
                  </div>
                  <div className="stag ok text-success">{rec.impact}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="card" style={{ height: '400px', background: 'rgba(20,20,25,0.7)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 'bold' }}>Historical Growth Trajectory</div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTrust" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3ecf8e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3ecf8e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorHuman" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5b8cff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#5b8cff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" />
              <YAxis stroke="rgba(255,255,255,0.2)" />
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <Tooltip 
                contentStyle={{ background: 'rgba(10,10,12,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} 
                itemStyle={{ color: '#fff' }} 
              />
              <Area type="monotone" dataKey="trust" stroke="#3ecf8e" fillOpacity={1} fill="url(#colorTrust)" name="Trust Score" />
              <Area type="monotone" dataKey="humanity" stroke="#5b8cff" fillOpacity={1} fill="url(#colorHuman)" name="Humanity Index" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>
    </>
  );
}
