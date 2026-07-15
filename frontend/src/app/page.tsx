'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useIdentityStore } from '@/store/useIdentityStore';
import { useShallow } from 'zustand/shallow';

// ─── Config ────────────────────────────────────────────────────────────────
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8005';

interface PlatformStats {
  identitiesCreated: number;
  successfulVerifications: number;
  activeWallets: number;
  credentialsIssued: number;
  supportedChains: number;
  uptime: number;
  apiLatency: number;
}
interface SystemStatus {
  api_health: string;
  database: string;
  redis: string;
  blockchain: string;
}

// ─── Logo SVG ────────────────────────────────────────────────────────────────
function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none"
      style={{ filter: 'drop-shadow(0 0 6px rgba(107,91,255,0.6))' }}>
      <defs>
        <linearGradient id="lgoG" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4f7bff" />
          <stop offset="55%" stopColor="#8f6bff" />
          <stop offset="100%" stopColor="#c56bff" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="11" fill="url(#lgoG)" />
      <g stroke="#0b0d18" strokeWidth="0.9" opacity="0.55" fill="none">
        <ellipse cx="16" cy="16" rx="11" ry="4.2" />
        <ellipse cx="16" cy="16" rx="4.2" ry="11" />
        <path d="M6.2 11.2c4 2.6 15.6 2.6 19.6 0M6.2 20.8c4-2.6 15.6-2.6 19.6 0" />
      </g>
      <ellipse cx="16" cy="17" rx="15" ry="5" transform="rotate(-16 16 17)"
        stroke="#dfe6ff" strokeWidth="1.1" fill="none" opacity="0.9" />
    </svg>
  );
}

// ─── Globe Visual (SVG with CSS animation) ───────────────────────────────────
function GlobeVisual({ allOk }: { allOk: boolean }) {
  return (
    <div style={{
      background: 'linear-gradient(160deg,#0e1024,#0a0b16)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20,
      padding: 12,
      boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
    }}>
      {/* Globe Box */}
      <div style={{
        position: 'relative', height: 320, borderRadius: 14, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 45%, #12142c 0%, #06070d 72%)',
      }}>
        <style>{`
          @keyframes rotateRingA { from{transform-origin:200px 178px; transform:rotate(-18deg);} to{transform-origin:200px 178px; transform:rotate(342deg);} }
          @keyframes rotateRingB { from{transform-origin:200px 178px; transform:rotate(14deg);} to{transform-origin:200px 178px; transform:rotate(374deg);} }
          @keyframes pulseNode { 0%,100%{opacity:1} 50%{opacity:0.25} }
          @keyframes pulseNode2 { 0%,100%{opacity:0.4} 50%{opacity:1} }
          @keyframes floatGlobe { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
          .globe-svg { animation: floatGlobe 5s ease-in-out infinite; }
          .ring-a { animation: rotateRingA 18s linear infinite; }
          .ring-b { animation: rotateRingB 24s linear infinite reverse; }
          .n1{animation:pulseNode 3s ease-in-out infinite}
          .n2{animation:pulseNode2 2.4s ease-in-out infinite}
          .n3{animation:pulseNode 2.8s ease-in-out infinite}
          .n4{animation:pulseNode2 3.4s ease-in-out infinite}
          .n5{animation:pulseNode 2.2s ease-in-out infinite}
          .n6{animation:pulseNode2 3s ease-in-out infinite}
          .n7{animation:pulseNode 2.6s ease-in-out infinite}
        `}</style>
        <svg className="globe-svg" style={{ width: '88%', height: '88%' }} viewBox="0 0 400 350" fill="none">
          <defs>
            <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="28%" stopColor="#c56bff" />
              <stop offset="65%" stopColor="#5b3fd6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#06070d" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="ringGradA" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f7bff" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#9b5bff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#4f7bff" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="ringGradB" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c56bff" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#4f7bff" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#c56bff" stopOpacity="0.1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Background stars */}
          <g fill="#ffffff" opacity="0.55">
            <circle cx="34" cy="44" r="1" /><circle cx="366" cy="58" r="1.1" />
            <circle cx="24" cy="286" r="1" /><circle cx="374" cy="296" r="1" />
            <circle cx="200" cy="18" r="1" /><circle cx="196" cy="332" r="1" />
            <circle cx="46" cy="168" r="0.9" /><circle cx="356" cy="178" r="0.9" />
            <circle cx="70" cy="320" r="0.8" /><circle cx="330" cy="30" r="0.8" />
          </g>

          {/* Rotating rings */}
          <ellipse className="ring-a" cx="200" cy="178" rx="188" ry="62"
            stroke="url(#ringGradA)" strokeWidth="1" fill="none" opacity="0.9" />
          <ellipse className="ring-b" cx="200" cy="178" rx="205" ry="46"
            stroke="url(#ringGradB)" strokeWidth="0.8" fill="none" opacity="0.75" />

          {/* Wireframe sphere: meridians */}
          <g stroke="#5b6bd9" strokeWidth="0.6" opacity="0.5" fill="none">
            <ellipse cx="200" cy="178" rx="0.6" ry="145" />
            <ellipse cx="200" cy="178" rx="55.5" ry="145" />
            <ellipse cx="200" cy="178" rx="102.5" ry="145" />
            <ellipse cx="200" cy="178" rx="134" ry="145" />
            <ellipse cx="200" cy="178" rx="145" ry="145" />
          </g>
          {/* Wireframe sphere: parallels */}
          <g stroke="#5b6bd9" strokeWidth="0.6" opacity="0.45" fill="none">
            <ellipse cx="200" cy="308.6" rx="62.9" ry="20.1" />
            <ellipse cx="200" cy="268.4" rx="113.4" ry="36.3" />
            <ellipse cx="200" cy="210.3" rx="141.4" ry="45.2" />
            <ellipse cx="200" cy="145.7" rx="141.4" ry="45.2" />
            <ellipse cx="200" cy="87.6" rx="113.4" ry="36.3" />
            <ellipse cx="200" cy="47.4" rx="62.9" ry="20.1" />
          </g>
          <circle cx="200" cy="178" r="145" stroke="#6b7bdb" strokeWidth="0.8" opacity="0.55" fill="none" />

          {/* Sphere nodes */}
          <g fill="#8fa0ff">
            {[
              [205.7,307.2,1.3,0.58],[115.2,294.6,1.0,0.40],[279.4,288.3,1.2,0.52],
              [150.6,275.7,1.4,0.68],[251.6,256.8,1.5,0.73],[88.4,244.2,1.3,0.57],
              [329.0,237.9,1.1,0.45],[182.4,225.3,1.7,0.82],[300.8,206.4,1.5,0.70],
              [107.6,193.8,1.5,0.73],[62.7,162.2,1.1,0.50],[330.1,155.9,1.2,0.56],
              [152.3,143.3,1.6,0.81],[272.9,124.4,1.5,0.74],[98.0,111.8,1.3,0.62],
              [325.1,105.5,1.0,0.39],[200.6,92.9,1.5,0.75],[280.5,74.0,1.2,0.56],
              [154.1,61.4,1.3,0.60],[217.9,42.5,1.2,0.52],
            ].map(([cx,cy,r,op], i) => (
              <circle key={i} cx={cx} cy={cy} r={r} opacity={op} />
            ))}
          </g>

          {/* Constellation links */}
          <g stroke="#a78bff" strokeWidth="0.5" opacity="0.55" fill="none" filter="url(#glow)">
            <path d="M231.8 178 L107.6 193.8 M231.8 178 L152.3 143.3 M231.8 178 L300.8 206.4 M107.6 193.8 L88.4 244.2 M152.3 143.3 L98.0 111.8" />
          </g>

          {/* Glowing core */}
          <circle cx="231.8" cy="178" r="40" fill="url(#coreGlow)" />
          <circle cx="231.8" cy="178" r="3.4" fill="#ffffff" filter="url(#glow)" />

          {/* Twinkling nodes */}
          <circle className="n1" cx="90" cy="95" r="2.1" fill="#dfe6ff" />
          <circle className="n2" cx="313" cy="118" r="1.9" fill="#7ee8d8" />
          <circle className="n3" cx="272" cy="256" r="2" fill="#ff8fd6" />
          <circle className="n4" cx="118" cy="262" r="1.7" fill="#dfe6ff" />
          <circle className="n5" cx="330" cy="197" r="1.7" fill="#c9b6ff" />
          <circle className="n6" cx="70" cy="188" r="1.9" fill="#7ee8d8" />
          <circle className="n7" cx="200" cy="46" r="1.6" fill="#a9b6ff" />
        </svg>
      </div>

      {/* Status Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 14px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: allOk ? '#34d399' : '#f59e0b',
            boxShadow: allOk ? '0 0 8px #34d399' : '0 0 8px #f59e0b',
            display: 'inline-block', flexShrink: 0,
          }} />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#f5f6fa' }}>Live network status</div>
            <div style={{ fontSize: 11, color: '#63677c' }}>
              {allOk ? 'All systems operational' : 'Systems degraded'}
            </div>
          </div>
        </div>
        <svg width="68" height="22" viewBox="0 0 70 24">
          <polyline
            points="0,12 10,12 15,4 20,20 25,8 30,16 35,12 45,12 50,6 55,18 60,12 70,12"
            fill="none" stroke="#9b5bff" strokeWidth="1.6"
          />
        </svg>
      </div>
    </div>
  );
}

// ─── Feature Icon inline SVGs ──────────────────────────────────────────────
const FeatureIcons = {
  shield: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a9b3ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 3 7v6c0 5 4 8.5 9 9 5-.5 9-4 9-9V7l-9-5Z"/></svg>,
  doc:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a9b3ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>,
  bio:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a9b3ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5Z"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/></svg>,
  chain:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a9b3ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>,
  check:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a9b3ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 3 7v6c0 5 4 8.5 9 9 5-.5 9-4 9-9V7l-9-5Z"/><path d="M9 12l2 2 4-4"/></svg>,
  code:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a9b3ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m8 9-4 3 4 3M16 9l4 3-4 3M13 6l-2 12"/></svg>,
};

// ─── Step Icon inline SVGs ─────────────────────────────────────────────────
const StepIcons = [
  <svg key="s1" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#a9b3ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 21v-1a7 7 0 0 1 14 0v1M19 8v6M16 11h6"/></svg>,
  <svg key="s2" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#a9b3ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 3 7v6c0 5 4 8.5 9 9 5-.5 9-4 9-9V7l-9-5Z"/></svg>,
  <svg key="s3" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#a9b3ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>,
  <svg key="s4" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#a9b3ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>,
  <svg key="s5" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#a9b3ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="15" r="4"/><path d="m10.5 12.5 8-8M16 5l3 3M13 8l3 3"/></svg>,
];

// ─── Main Component ────────────────────────────────────────────────────────
export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();
  const { connect } = useConnect();
  const { isAuthenticated } = useIdentityStore(
    useShallow((s) => ({ isAuthenticated: s.isAuthenticated }))
  );

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  // TanStack Query initial load
  const { data: initialStats } = useQuery<PlatformStats>({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const res = await fetch(`${BACKEND_URL}/api/public/platform-stats`);
      if (!res.ok) throw new Error('stats failed');
      return res.json();
    },
    refetchInterval: 30000,
  });
  const { data: initialStatus } = useQuery<SystemStatus>({
    queryKey: ['system-status'],
    queryFn: async () => {
      const res = await fetch(`${BACKEND_URL}/api/system/status`);
      if (!res.ok) throw new Error('status failed');
      return res.json();
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    setMounted(true);
    if (initialStats) setStats(initialStats);
  }, [initialStats]);
  useEffect(() => {
    if (initialStatus) setStatus(initialStatus);
  }, [initialStatus]);

  // WebSocket real-time updates
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let ws: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout>;
    function connect() {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = BACKEND_URL.replace(/^https?:\/\//, '');
      ws = new WebSocket(`${proto}//${host}/api/ws/stats`);
      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.type === 'update') {
            if (d.stats) setStats(d.stats);
            if (d.status) setStatus(d.status);
          }
        } catch {}
      };
      ws.onclose = () => { timer = setTimeout(connect, 4000); };
      ws.onerror = () => ws?.close();
    }
    connect();
    return () => { ws?.close(); clearTimeout(timer); };
  }, []);

  const fmt = (n: number | undefined, suf = '+') => {
    if (n === undefined) return '...';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M${suf}`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K${suf}`;
    return `${n}${suf}`;
  };

  const allOk = !!(
    status?.api_health === 'online' &&
    status?.database === 'online' &&
    status?.redis === 'online' &&
    status?.blockchain === 'online'
  );

  // ─── Shared CSS vars (inline for SSR safety) ───────────────────────────
  const css = `
    :root {
      --bg:#06070d; --card:#0f111c; --cb:rgba(255,255,255,0.08);
      --text:#f5f6fa; --dim:#979bb0; --faint:#63677c;
      --blue:#4f7bff; --purple:#9b5bff; --pink:#c56bff;
      --grad:linear-gradient(90deg,#4f7bff,#9b5bff);
      --green:#34d399;
    }
    .lp-body { background:var(--bg); color:var(--text); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased; overflow-x:hidden; }
    .lp-body a { text-decoration:none; color:inherit; }
    .lp-wrap { max-width:1180px; margin:0 auto; padding:0 40px; }
    @media(max-width:640px){ .lp-wrap{padding:0 20px;} }

    /* glow bg */
    .lp-body::before { content:""; position:fixed; top:-260px; left:50%; width:1000px; height:760px; transform:translateX(-50%); background:radial-gradient(circle,rgba(107,91,255,0.16),transparent 68%); pointer-events:none; z-index:0; }

    /* NAV */
    .lp-header { position:sticky; top:0; z-index:50; background:rgba(6,7,13,0.82); backdrop-filter:blur(14px); border-bottom:1px solid rgba(255,255,255,0.06); }
    .lp-nav { display:flex; align-items:center; justify-content:space-between; padding:16px 40px; max-width:1180px; margin:0 auto; }
    .lp-logo { display:flex; align-items:center; gap:9px; font-weight:700; font-size:16.5px; letter-spacing:-0.01em; }
    .lp-logo sup { font-size:11px; color:var(--purple); font-weight:700; margin-left:1px; }
    .lp-nav-links { display:flex; align-items:center; gap:34px; }
    .lp-nav-links a { font-size:14px; color:var(--dim); font-weight:500; transition:color .2s; }
    .lp-nav-links a:hover, .lp-nav-links a.active { color:var(--text); }
    .lp-nav-links a.active { position:relative; }

    /* BUTTONS */
    .lp-btn { display:inline-flex; align-items:center; gap:7px; padding:10px 19px; border-radius:9px; font-size:14px; font-weight:600; cursor:pointer; border:none; transition:transform .15s,box-shadow .2s,opacity .2s,background .2s; white-space:nowrap; font-family:inherit; }
    .lp-btn-primary { background:var(--grad); color:#fff; box-shadow:0 4px 16px rgba(107,91,255,0.35); }
    .lp-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 22px rgba(107,91,255,0.55); }
    .lp-btn-outline { background:transparent; color:var(--text); border:1px solid rgba(255,255,255,0.16); }
    .lp-btn-outline:hover { border-color:rgba(255,255,255,0.32); background:rgba(255,255,255,0.04); }

    /* HERO */
    .lp-hero { position:relative; z-index:1; padding:76px 0 56px; display:grid; grid-template-columns:1.05fr 0.95fr; gap:56px; align-items:center; }
    .lp-eyebrow { display:inline-flex; align-items:center; gap:7px; font-size:12px; font-weight:600; color:#8fb4ff; background:rgba(79,123,255,0.1); border:1px solid rgba(79,123,255,0.25); padding:6px 14px; border-radius:20px; margin-bottom:22px; }
    .lp-h1 { font-size:50px; line-height:1.1; font-weight:800; letter-spacing:-0.02em; margin-bottom:20px; }
    .lp-grad { background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; }
    .lp-hero-desc { font-size:16px; line-height:1.65; color:var(--dim); max-width:470px; margin-bottom:30px; }
    .lp-hero-ctas { display:flex; gap:14px; margin-bottom:44px; flex-wrap:wrap; }
    .lp-stats-row { display:flex; gap:38px; flex-wrap:wrap; }
    .lp-stat { display:flex; flex-direction:column; gap:5px; }
    .lp-stat-num { display:flex; align-items:center; gap:6px; font-size:18px; font-weight:700; }
    .lp-stat-label { font-size:12px; color:var(--faint); }

    /* SECTIONS */
    .lp-section { position:relative; z-index:1; padding:84px 0; }
    .lp-sec-eyebrow { font-size:12px; font-weight:700; letter-spacing:0.09em; text-transform:uppercase; color:var(--purple); margin-bottom:12px; }
    .lp-sec-title { font-size:32px; font-weight:800; letter-spacing:-0.015em; line-height:1.28; margin-bottom:12px; }
    .lp-sec-desc { font-size:15px; color:var(--dim); line-height:1.6; }
    .lp-sec-head { margin-bottom:48px; max-width:620px; }
    .lp-center { text-align:center; margin-left:auto; margin-right:auto; }

    /* FEATURES */
    .lp-features-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
    .lp-feature-card { background:var(--card); border:1px solid var(--cb); border-radius:16px; padding:24px; transition:border-color .2s,transform .2s,background .2s; position:relative; cursor:default; }
    .lp-feature-card:hover { border-color:rgba(155,91,255,0.4); transform:translateY(-2px); background:#111428; }
    .lp-feature-icon { width:40px; height:40px; border-radius:11px; display:flex; align-items:center; justify-content:center; background:rgba(107,91,255,0.12); border:1px solid rgba(107,91,255,0.22); margin-bottom:18px; }
    .lp-feature-card h3 { font-size:15.5px; font-weight:700; margin-bottom:8px; }
    .lp-feature-card p { font-size:13.5px; color:var(--dim); line-height:1.6; padding-right:6px; }
    .lp-feature-plus { position:absolute; right:22px; bottom:22px; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.14); color:var(--faint); font-size:13px; transition:border-color .2s,color .2s,transform .3s; }
    .lp-feature-card:hover .lp-feature-plus { border-color:var(--purple); color:var(--purple); transform:rotate(90deg); }

    /* STEPS */
    .lp-steps-row { display:grid; grid-template-columns:repeat(5,1fr); gap:0; }
    .lp-step { 
      background:var(--card); 
      border:1px solid var(--cb); 
      border-right:none; 
      padding:20px 18px; 
      position:relative; 
      cursor:pointer;
      outline:none;
      transition: background 0.3s ease, transform 0.3s ease;
    }
    .lp-step:last-child { border-right:1px solid var(--cb); border-radius:0 14px 14px 0; }
    .lp-step:first-child { border-radius:14px 0 0 14px; }
    
    /* Overlay for GPU-accelerated smooth border fades without layout shifts */
    .lp-step::after {
      content: "";
      position: absolute;
      inset: -1px;
      border: 1px solid #9b5bff;
      border-radius: inherit;
      opacity: 0;
      transition: opacity 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
      z-index: 5;
      pointer-events: none;
    }
    .lp-step:first-child::after { border-radius:14px 0 0 14px; }
    .lp-step:last-child::after { border-radius:0 14px 14px 0; border-right:1px solid rgba(155, 91, 255, 0.6); }

    .lp-step::before { content:""; position:absolute; top:36px; right:-9px; width:18px; height:1px; border-top:1.5px dashed rgba(255,255,255,0.2); z-index:2; transition: opacity 0.3s ease; }
    .lp-step:last-child::before { display:none; }
    .lp-step-num { font-size:12.5px; font-weight:800; color:var(--purple); margin-bottom:14px; letter-spacing:0.02em; transition: all 0.3s ease; }
    .lp-step-icon { width:30px; height:30px; margin-bottom:14px; display:flex; align-items:center; justify-content:center; transition: all 0.3s ease; }
    .lp-step h4 { font-size:13.5px; font-weight:700; margin-bottom:6px; transition: all 0.3s ease; }
    .lp-step p { font-size:11.5px; color:var(--dim); line-height:1.5; transition: all 0.3s ease; }

    .lp-step:hover {
      background: #111428;
    }
    .lp-step:hover::after {
      opacity: 0.45;
      border-color: rgba(155, 91, 255, 0.6);
    }
    .lp-step.active, .lp-step:focus-visible {
      background: #111428;
      z-index: 10;
    }
    .lp-step.active::after, .lp-step:focus-visible::after {
      opacity: 1 !important;
      border-color: #9b5bff !important;
      box-shadow: 0 0 20px rgba(155, 91, 255, 0.25), inset 0 0 12px rgba(155, 91, 255, 0.15);
    }
    .lp-step.active {
      transform: translateY(-2px);
    }
    .lp-step.active .lp-step-num {
      color: var(--pink);
      transform: scale(1.05);
      text-shadow: 0 0 8px rgba(197, 107, 255, 0.5);
    }
    .lp-step.active .lp-step-icon {
      transform: scale(1.1);
      filter: drop-shadow(0 0 6px var(--purple));
    }
    .lp-step.active h4 {
      color: #fff;
    }
    .lp-step.active::before {
      opacity: 0.5;
    }

    .lp-step-indicator {
      position: absolute;
      right: 14px;
      bottom: 14px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: var(--faint);
      transition: all 0.3s ease;
      opacity: 0;
      transform: scale(0.8);
      background: rgba(155, 91, 255, 0.1);
      z-index: 6;
    }
    
    /* Plus indicator is strictly bound to the active step */
    .lp-step.active .lp-step-indicator {
      opacity: 1;
      transform: scale(1);
      border-color: var(--purple);
      color: var(--purple);
    }

    /* COMPLIANCE */
    .lp-comp-cards { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; max-width:800px; margin:0 auto; }
    .lp-comp-card { background:var(--card); border:1px solid var(--cb); border-radius:14px; padding:18px; display:flex; align-items:flex-start; gap:12px; text-align:left; transition:border-color .2s,transform .2s; }
    .lp-comp-card:hover { border-color:rgba(155,91,255,0.35); transform:translateY(-1px); }
    .lp-comp-icon { width:34px; height:34px; border-radius:9px; flex-shrink:0; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.04); border:1px solid var(--cb); }
    .lp-comp-card h4 { font-size:13.5px; font-weight:700; margin-bottom:4px; }
    .lp-comp-card p { font-size:12px; color:var(--dim); line-height:1.5; }

    /* CTA BANNER */
    .lp-cta-banner { position:relative; overflow:hidden; background:linear-gradient(160deg,#241a4a 0%,#171233 45%,#0a0b16 100%); border:1px solid rgba(155,91,255,0.25); border-radius:22px; padding:60px 40px 56px; text-align:center; }
    .lp-cta-banner::before { content:""; position:absolute; inset:0; background:radial-gradient(circle at 50% -10%,rgba(107,91,255,0.4),transparent 55%); }
    .lp-cta-icon { width:50px; height:50px; border-radius:50%; margin:0 auto 20px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.16); position:relative; z-index:1; }
    .lp-cta-banner h2 { font-size:26px; font-weight:800; margin-bottom:10px; position:relative; z-index:1; }
    .lp-cta-banner > p { color:var(--dim); margin-bottom:26px; position:relative; z-index:1; font-size:14.5px; }
    .lp-cta-banner .lp-btn { position:relative; z-index:1; }

    /* FOOTER */
    .lp-footer { position:relative; z-index:1; border-top:1px solid var(--cb); padding:52px 0 24px; }
    .lp-footer-grid { display:grid; grid-template-columns:1.6fr 1fr 1fr 1fr 1fr; gap:28px; margin-bottom:40px; }
    .lp-footer-brand p { font-size:12.5px; color:var(--faint); line-height:1.6; margin-top:14px; max-width:210px; }
    .lp-footer-col h5 { font-size:11.5px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:var(--faint); margin-bottom:15px; }
    .lp-footer-col a { display:block; font-size:13px; color:var(--dim); margin-bottom:10px; transition:color .2s; }
    .lp-footer-col a:hover { color:var(--text); }
    .lp-footer-bottom { display:flex; align-items:center; justify-content:space-between; padding-top:22px; border-top:1px solid var(--cb); font-size:12px; color:var(--faint); }
    .lp-footer-social { display:flex; gap:14px; }
    .lp-footer-social a { opacity:.55; transition:opacity .2s; }
    .lp-footer-social a:hover { opacity:1; }
    .lp-status-dot { width:7px; height:7px; border-radius:50%; display:inline-block; flex-shrink:0; }

    /* Responsive */
    @media(max-width:980px){
      .lp-hero{grid-template-columns:1fr;padding-top:44px;}
      .lp-features-grid{grid-template-columns:repeat(2,1fr);}
      .lp-steps-row{grid-template-columns:repeat(3,1fr);}
      .lp-step{border-right:1px solid var(--cb);border-radius:0!important;}
      .lp-step::before{display:none;}
      .lp-comp-cards{grid-template-columns:1fr;}
      .lp-footer-grid{grid-template-columns:repeat(2,1fr);}
      .lp-nav-links{display:none;}
    }
    @media(max-width:640px){
      .lp-hero{padding:44px 0 40px;}
      .lp-h1{font-size:34px;}
      .lp-features-grid{grid-template-columns:1fr;}
      .lp-steps-row{grid-template-columns:repeat(2,1fr);}
      .lp-footer-grid{grid-template-columns:1fr;}
      .lp-footer-bottom{flex-direction:column;gap:14px;align-items:flex-start;}
      .lp-cta-banner{padding:44px 22px;}
      .lp-cta-banner h2{font-size:21px;}
      .lp-nav{padding:14px 20px;}
    }
  `;

  return (
    <div className="lp-body">
      <style>{css}</style>

      {/* ── HEADER / NAV ─────────────────────────────── */}
      <header className="lp-header">
        <nav className="lp-nav">
          <Link href="/" className="lp-logo">
            <LogoMark size={26} />
            MetaGo<sup>+</sup>
          </Link>
          <div className="lp-nav-links">
            <Link href="/" className="active">Home</Link>
            <Link href="#protocol">Protocol</Link>
            <Link href="/developers" id="nav-developers">Developers</Link>
            <Link href="/docs" id="nav-docs">Docs</Link>
            <Link href="#about">About</Link>
          </div>
          {mounted && (
            isAuthenticated ? (
              <Link href="/dashboard" className="lp-btn lp-btn-primary" id="nav-dashboard-btn">
                Dashboard
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </Link>
            ) : isConnected ? (
              <Link href="/auth/signup" className="lp-btn lp-btn-primary" id="nav-getstarted-btn">
                Get Started
              </Link>
            ) : (
              <button
                className="lp-btn lp-btn-primary"
                id="connectWalletBtn"
                onClick={() => connect({ connector: injected() })}
              >
                Connect Wallet
              </button>
            )
          )}
          {!mounted && (
            <button className="lp-btn lp-btn-primary" disabled>Connect Wallet</button>
          )}
        </nav>
      </header>

      <main className="lp-wrap">

        {/* ── HERO ─────────────────────────────────────── */}
        <section className="lp-hero">
          <div>
            <div className="lp-eyebrow">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8fb4ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 3 7v6c0 5 4 8.5 9 9 5-.5 9-4 9-9V7l-9-5Z"/>
              </svg>
              The future of digital identity
            </div>

            <h1 className="lp-h1">
              The <span className="lp-grad">sovereign identity</span> protocol for Web3.
            </h1>

            <p className="lp-hero-desc">
              Meta Go is a next-generation cryptographic identity layer built for full user sovereignty,
              privacy by design and interoperability across ecosystems.
            </p>

            <div className="lp-hero-ctas">
              {mounted && isAuthenticated ? (
                <Link href="/dashboard" className="lp-btn lp-btn-primary" id="hero-cta-dashboard">
                  Open Dashboard
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </Link>
              ) : (
                <Link href="/auth/signup" className="lp-btn lp-btn-primary" id="hero-cta-start">
                  Start Building
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </Link>
              )}
              <Link href="/docs" className="lp-btn lp-btn-outline" id="hero-cta-docs">
                Explore Docs
              </Link>
            </div>

            {/* Live Stats */}
            <div className="lp-stats-row">
              <div className="lp-stat">
                <div className="lp-stat-num">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b93ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  {fmt(stats?.identitiesCreated)}
                </div>
                <div className="lp-stat-label">Identities Created</div>
              </div>
              <div className="lp-stat">
                <div className="lp-stat-num">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b93ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z"/></svg>
                  {stats ? `${stats.uptime.toFixed(1)}%` : '...'}
                </div>
                <div className="lp-stat-label">Uptime &amp; Reliability</div>
              </div>
              <div className="lp-stat">
                <div className="lp-stat-num">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b93ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>
                  {fmt(stats?.supportedChains, '+')}
                </div>
                <div className="lp-stat-label">Supported Chains</div>
              </div>
              <div className="lp-stat">
                <div className="lp-stat-num">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b93ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                  {fmt(stats?.successfulVerifications)}
                </div>
                <div className="lp-stat-label">Verifications</div>
              </div>
            </div>
          </div>

          {/* Hero Globe Visual */}
          <GlobeVisual allOk={allOk} />
        </section>

        {/* ── FEATURES ─────────────────────────────────── */}
        <section className="lp-section" id="protocol">
          <div className="lp-sec-head">
            <div className="lp-sec-eyebrow">Core Features</div>
            <h2 className="lp-sec-title">
              Built on cryptography. Designed for <span className="lp-grad">humans.</span>
            </h2>
            <p className="lp-sec-desc">
              Every layer of Meta Go is cryptographically verifiable, user-centric, and built to scale with Web3.
            </p>
          </div>
          <div className="lp-features-grid">
            {[
              { icon: FeatureIcons.shield, title: 'Non-Custodial Identities', desc: 'Users own their identities. No central authority. No lock-in. Full control, forever.' },
              { icon: FeatureIcons.doc,    title: 'Verifiable Credentials',   desc: 'Issue, store and share verifiable credentials with privacy and transparency.' },
              { icon: FeatureIcons.bio,    title: 'Multi-Modal Verification', desc: 'Biometric, behavioral and crypto verification for strong, sybil-resistant identity.' },
              { icon: FeatureIcons.chain,  title: 'Cross-Chain IDs',          desc: 'One identity for all chains. Interoperable by design, portable across ecosystems.' },
              { icon: FeatureIcons.check,  title: 'Secure & Anti-Sybil',      desc: 'Advanced cryptographic proofs and reputation systems to ensure real humans only.' },
              { icon: FeatureIcons.code,   title: 'Developer First Foundation',desc: 'Modular APIs, SDKs and open standards to build the future of decentralized identity.' },
            ].map((f, i) => (
              <div key={i} className="lp-feature-card">
                <div className="lp-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <span className="lp-feature-plus">+</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── STEPS ────────────────────────────────────── */}
        <section className="lp-section">
          <div className="lp-sec-head lp-center">
            <div className="lp-sec-eyebrow">Why MetaGo</div>
            <h2 className="lp-sec-title">Five steps. <span className="lp-grad">Zero compromises.</span></h2>
          </div>
          <div className="lp-steps-row">
            {[
              { n: '01', title: 'Create Identity',   desc: 'Generate your decentralized identity in seconds.' },
              { n: '02', title: 'Verify Securely',   desc: 'Complete biometric & crypto verification privately.' },
              { n: '03', title: 'Issue Credentials', desc: 'Get verifiable credentials issued by trusted sources.' },
              { n: '04', title: 'Use Anywhere',      desc: 'Access dApps and services across multiple chains.' },
              { n: '05', title: 'Stay in Control',   desc: 'You own your data. Forever.' },
            ].map((s, i) => (
              <div 
                key={i} 
                className={`lp-step ${activeStep === i ? 'active' : ''}`}
                tabIndex={0}
                role="button"
                aria-pressed={activeStep === i}
                onClick={() => setActiveStep(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveStep(i);
                  }
                }}
              >
                <div className="lp-step-num">{s.n}</div>
                <div className="lp-step-icon">{StepIcons[i]}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
                <span className="lp-step-indicator">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── COMPLIANCE ───────────────────────────────── */}
        <section className="lp-section">
          <div className="lp-sec-head lp-center">
            <div className="lp-sec-eyebrow">Enterprise Grade</div>
            <h2 className="lp-sec-title">Compliant by architecture.</h2>
            <p className="lp-sec-desc">
              Security, privacy and compliance are not features — they&apos;re the foundation of Meta Go.
            </p>
          </div>
          <div className="lp-comp-cards">
            {[
              {
                icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a9b3ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>,
                title: 'Privacy First',
                desc: 'Zero-knowledge proofs and data minimization.',
              },
              {
                icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a9b3ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 3 7v6c0 5 4 8.5 9 9 5-.5 9-4 9-9V7l-9-5Z"/></svg>,
                title: 'Built Secure',
                desc: 'Audited smart contracts and encryption at every layer.',
              },
              {
                icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a9b3ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z"/></svg>,
                title: 'Compliant Ready',
                desc: 'Designed for global standards (GDPR, ISO, SOC2).',
              },
            ].map((c, i) => (
              <div key={i} className="lp-comp-card">
                <div className="lp-comp-icon">{c.icon}</div>
                <div>
                  <h4>{c.title}</h4>
                  <p>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA BANNER ───────────────────────────────── */}
        <section className="lp-section" style={{ paddingTop: 0 }}>
          <div className="lp-cta-banner">
            {/* Wave SVG */}
            <svg style={{ position:'absolute', left:0, right:0, bottom:0, width:'100%', opacity:0.6 }}
              viewBox="0 0 800 120" preserveAspectRatio="none">
              <path d="M0,80 C150,30 300,110 450,60 C600,20 700,90 800,50 L800,120 L0,120 Z"
                fill="rgba(107,91,255,0.15)"/>
              <path d="M0,95 C180,55 320,120 480,80 C620,45 720,100 800,70 L800,120 L0,120 Z"
                fill="rgba(197,107,255,0.12)"/>
            </svg>

            <div className="lp-cta-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a9b3ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 21v-1a8 8 0 0 1 16 0v1"/>
              </svg>
            </div>

            <h2>
              Ready to claim your <span className="lp-grad">sovereign identity</span>?
            </h2>
            <p>Join thousands of users and builders who trust Meta Go.</p>

            {mounted && isAuthenticated ? (
              <Link href="/dashboard" className="lp-btn lp-btn-primary" id="cta-dashboard-btn">
                Open Dashboard
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </Link>
            ) : (
              <Link href="/auth/signup" className="lp-btn lp-btn-primary" id="cta-get-started-btn">
                Get Started
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </Link>
            )}
          </div>
        </section>

      </main>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-wrap">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <Link href="/" className="lp-logo" style={{ display:'inline-flex' }}>
                <LogoMark size={24} />
                <span style={{ marginLeft:9, fontWeight:700, fontSize:16 }}>MetaGo</span>
              </Link>
              <p>The sovereign identity protocol for Web3. Privacy by design. User by default.</p>
            </div>
            <div className="lp-footer-col">
              <h5>Product</h5>
              <Link href="/#protocol">Protocol</Link>
              <Link href="/developers" id="footer-developers">Developers</Link>
              <Link href="/docs" id="footer-docs">Docs</Link>
              <Link href="/use-cases">Use Cases</Link>
            </div>
            <div className="lp-footer-col">
              <h5>Resources</h5>
              <Link href="/docs">Documentation</Link>
              <Link href="/docs#api-reference">API Reference</Link>
              <Link href="/github">GitHub</Link>
              <Link href="/blog">Blog</Link>
            </div>
            <div className="lp-footer-col">
              <h5>Company</h5>
              <Link href="/about">About Us</Link>
              <Link href="/careers">Careers</Link>
              <Link href="/contact">Contact</Link>
            </div>
            <div className="lp-footer-col">
              <h5>Legal</h5>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/security">Security</Link>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <span>© 2024 Meta Go Labs. All rights reserved.</span>
            <div style={{ display:'flex', alignItems:'center', gap:20 }}>
              <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span className="lp-status-dot" style={{
                  background: allOk ? '#34d399' : '#f59e0b',
                  boxShadow: allOk ? '0 0 8px #34d399' : '0 0 8px #f59e0b',
                }} />
                {allOk ? 'All systems operational' : 'Degraded'}
              </span>
              <div className="lp-footer-social">
                <a href="https://github.com" aria-label="GitHub" target="_blank" rel="noreferrer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ stroke:'#979bb0' }}>
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9c0-1.1.4-1.8.8-2.2-2.7-.3-5.6-1.4-5.6-6.1 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.4 1.2a11.6 11.6 0 0 1 6.2 0c2.4-1.5 3.4-1.2 3.4-1.2.6 1.7.2 3 .1 3.3.8.8 1.2 1.9 1.2 3.2 0 4.7-2.9 5.8-5.6 6.1.4.4.8 1.2.8 2.4V22"/>
                  </svg>
                </a>
                <a href="#" aria-label="Twitter">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#979bb0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4l16 16M20 4 4 20"/>
                  </svg>
                </a>
                <a href="#" aria-label="Discord">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#979bb0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 12h.01M16 12h.01M7 5c-2 .6-3.5 1.6-4 3-1 3-1 8 0 11 1.5 1 3 1.6 4.5 1.8l1-2M17 5c2 .6 3.5 1.6 4 3 1 3 1 8 0 11-1.5 1-3 1.6-4.5 1.8l-1-2M8.5 15.5c3 1 4 1 7 0"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
