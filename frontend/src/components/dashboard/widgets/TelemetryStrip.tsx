'use client';
import React from 'react';
import { Hexagon, Shield, Share2, ShieldCheck, Activity } from 'lucide-react';

const RadarIcon = ({ color = 'text-blue-500', innerIcon: Icon }: { color?: string, innerIcon: any }) => (
  <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
    {/* Outer dashed ring */}
    <div className={`absolute inset-0 rounded-full border border-dashed ${color} opacity-30 animate-[spin_10s_linear_infinite]`} />
    {/* Inner solid ring */}
    <div className={`absolute inset-1.5 rounded-full border border-solid ${color} opacity-20`} />
    {/* Crosshairs */}
    <div className={`absolute inset-0 flex items-center justify-center opacity-20`}>
      <div className={`w-full h-[1px] ${color} bg-current`} />
      <div className={`absolute h-full w-[1px] ${color} bg-current`} />
    </div>
    {/* Glow effect */}
    <div className={`absolute inset-3 rounded-full bg-current opacity-20 blur-md ${color}`} />
    {/* Center Icon */}
    <Icon className={`relative z-10 w-5 h-5 ${color}`} style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} fill="currentColor" fillOpacity={0.2} />
    {/* Radar dots */}
    <div className={`absolute top-1 right-2 w-1 h-1 rounded-full bg-current ${color} opacity-80 animate-ping`} />
  </div>
);

export default function TelemetryStrip({ 
  identityScore = 98.7, 
  credentials = 24, 
  connections = 38, 
  trustScore = 98.7 
}: {
  identityScore?: number;
  credentials?: number;
  connections?: number;
  trustScore?: number;
}) {
  const metrics = [
    { 
      title: 'Identity Score', 
      value: identityScore, 
      status: 'Excellent', 
      statusColor: 'text-emerald-400', 
      color: 'text-blue-500', 
      Icon: Hexagon,
      chart: true
    },
    { 
      title: 'Credentials', 
      value: credentials, 
      status: 'Verified', 
      statusColor: 'text-emerald-400', 
      color: 'text-blue-400', 
      Icon: Hexagon 
    },
    { 
      title: 'Connections', 
      value: connections, 
      status: 'Active', 
      statusColor: 'text-emerald-400', 
      color: 'text-sky-400', 
      Icon: Share2 
    },
    { 
      title: 'Trust Score', 
      value: trustScore, 
      status: 'Excellent', 
      statusColor: 'text-emerald-400', 
      color: 'text-purple-500', 
      Icon: Shield 
    },
    { 
      title: 'Security Status', 
      value: 'Secure', 
      status: 'All Systems Protected', 
      statusColor: 'text-emerald-400', 
      color: 'text-emerald-400', 
      Icon: ShieldCheck 
    },
  ];

  return (
    <div className="w-full flex items-center bg-[#05050a]/80 border border-blue-900/20 rounded-2xl overflow-hidden backdrop-blur-xl mb-6 shadow-2xl shadow-blue-900/10">
      {metrics.map((m, i) => (
        <div key={i} className={`flex-1 flex items-center gap-3 p-4 relative ${i !== metrics.length - 1 ? 'border-r border-blue-900/20' : ''}`}>
          <RadarIcon color={m.color} innerIcon={m.Icon} />
          
          <div className="flex flex-col z-10">
            <span className="text-zinc-300 text-xs font-medium mb-0.5">{m.title}</span>
            <div className="flex items-end gap-2">
              <span className="text-white text-2xl font-bold font-mono tracking-tight leading-none">{m.value}</span>
              <span className={`text-[10px] font-bold tracking-wide leading-relaxed ${m.statusColor}`}>
                {m.status}
              </span>
            </div>
          </div>

          {/* Optional Sparkline Chart */}
          {m.chart && (
            <svg className="absolute bottom-1 right-2 w-16 h-6 opacity-40 text-emerald-400" viewBox="0 0 100 30" preserveAspectRatio="none">
              <polyline 
                points="0,25 20,20 40,25 60,10 80,15 100,5" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}
