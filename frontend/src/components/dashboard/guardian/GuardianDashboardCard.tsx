import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Guardian3D = dynamic(() => import('./Guardian3D'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="pulse" style={{ background: 'var(--violet)' }}></div>
    </div>
  )
});

export default function GuardianDashboardCard({ isConnected, unreadNotifs }: { isConnected: boolean, unreadNotifs: number }) {
  const [mounted, setMounted] = useState(false);
  const [isInView, setIsInView] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    // Simple lazy load intersection observer
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    });
    
    const el = document.getElementById('guardian-dashboard-card');
    if (el) observer.observe(el);
    
    return () => observer.disconnect();
  }, []);

  // Determine actual system status instead of hardcoding "Monitoring 24/7"
  const guardianStatus = !isConnected ? 'Offline' : unreadNotifs > 0 ? 'Security Alert' : 'AI Guardian Ready';
  const guardianState = !isConnected ? 'error' : unreadNotifs > 0 ? 'alert' : 'idle';

  return (
    <div className="card" id="guardian-dashboard-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-head">
        <div className="card-title"><Activity size={16} /> AI Guardian Intelligence</div>
      </div>
      
      <div style={{ padding: '20px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          display: 'flex', 
          background: 'rgba(10,10,15,0.6)', 
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.05)',
          padding: '16px',
          gap: '16px',
          marginBottom: '20px',
          height: '140px', // Fixed height for 3D mini view
          alignItems: 'center'
        }}>
          {/* Mini 3D Stage */}
          <div style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            boxShadow: 'inset 0 0 20px rgba(0,255,255,0.1)',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {mounted && isInView ? (
              <Guardian3D state={guardianState} audioLevel={0} isDashboardCard={true} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="pulse"></div>
              </div>
            )}
          </div>
          
          {/* Status Text */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Status</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: guardianState === 'alert' ? 'var(--danger)' : '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {guardianState === 'alert' ? <ShieldAlert size={14} /> : <CheckCircle2 size={14} className="text-success" />}
              {guardianStatus}
            </div>
            
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', marginTop: '12px', marginBottom: '4px' }}>Context</div>
            <div style={{ fontSize: '13px', color: 'var(--violet)', fontWeight: 500 }}>
              Identity & Security Linked
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
          <Link href="/dashboard/ai-guardian" style={{ flex: 1 }}>
            <button className="tbtn" style={{ width: '100%', fontSize: '12px', background: 'rgba(124,58,237,0.15)', color: '#fff', border: '1px solid rgba(124,58,237,0.3)' }}>
              Chat With Guardian
            </button>
          </Link>
          <Link href="/dashboard/trust-analytics" style={{ flex: 1 }}>
            <button className="tbtn" style={{ width: '100%', fontSize: '12px' }}>
              Analytics
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
