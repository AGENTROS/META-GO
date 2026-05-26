'use client';
import { useEffect, useRef, useState } from 'react';
import { useIdentityStore } from '@/store/useIdentityStore';

export function TrustGraph() {
  const peers = useIdentityStore(s => s.peers);
  const ref = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; peer: any } | null>(null);
  const positionsRef = useRef<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const w = 280, h = 200;
    const cx = w / 2, cy = h / 2;
    positionsRef.current = peers.map((_, i) => {
      const a = (i / peers.length) * Math.PI * 2;
      return { x: cx + Math.cos(a) * 70, y: cy + Math.sin(a) * 60 };
    });
  }, [peers]);

  const w = 280, h = 200;
  const cx = w / 2, cy = h / 2;
  const colors = { MUTUAL: '#06b6d4', OUTBOUND: '#8b5cf6', INBOUND: '#f59e0b' };

  return (
    <div className="relative">
      <svg ref={ref} width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        {peers.map((p, i) => {
          const pos = positionsRef.current[i] || { x: cx, y: cy };
          return (
            <line key={`edge-${i}`} x1={cx} y1={cy} x2={pos.x} y2={pos.y}
              stroke={(colors as any)[p.direction]} strokeWidth={p.trustWeight * 2.5} opacity={0.6} />
          );
        })}
        <circle cx={cx} cy={cy} r={11} fill="#2563eb" stroke="#fff" strokeWidth={2} />
        <text x={cx} y={cy + 3} textAnchor="middle" fontSize={9} fill="#fff" fontWeight={700}>YOU</text>
        {peers.map((p, i) => {
          const pos = positionsRef.current[i] || { x: cx, y: cy };
          return (
            <g key={`node-${i}`} onMouseEnter={() => setTooltip({ x: pos.x, y: pos.y, peer: p })} onMouseLeave={() => setTooltip(null)} style={{ cursor: 'pointer' }}>
              <circle cx={pos.x} cy={pos.y} r={7} fill={(colors as any)[p.direction]} />
              <text x={pos.x} y={pos.y + 18} textAnchor="middle" fontSize={8} fill="#71717a">{p.address.slice(0, 6)}</text>
            </g>
          );
        })}
      </svg>
      {tooltip && (
        <div className="absolute z-10 px-2.5 py-1.5 bg-zinc-900 text-white text-[10px] rounded-md shadow-lg pointer-events-none font-mono"
          style={{ left: tooltip.x, top: tooltip.y - 36 }}>
          <p>{tooltip.peer.address}</p>
          <p className="text-blue-300">Trust: {(tooltip.peer.trustScore).toFixed(0)}</p>
        </div>
      )}
      <div className="flex items-center gap-3 mt-3 text-[9px] font-mono text-zinc-450">
        <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-cyan-500" />Mutual</span>
        <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-violet-500" />Outbound</span>
        <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-amber-500" />Inbound</span>
      </div>
    </div>
  );
}
