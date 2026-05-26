'use client';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import { useIdentityStore } from '@/store/useIdentityStore';

export function IdentityRadar() {
  const m = useIdentityStore(s => s.identityMetrics);
  const data = [
    { axis: 'Sovereignty', value: m?.sovereignty ?? 70, full: 100 },
    { axis: 'Trust', value: m?.trustScore ?? 65, full: 100 },
    { axis: 'Security', value: m?.securityDepth ?? 80, full: 100 },
    { axis: 'Integrity', value: m?.dataIntegrity ?? 90, full: 100 },
    { axis: 'Presence', value: m?.presenceIndex ?? 60, full: 100 },
  ];
  return (
    <div className="w-full h-48" data-testid="identity-radar">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
          <PolarGrid stroke="rgba(113,113,122,0.25)" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar dataKey="value" stroke="#2563eb" strokeWidth={2} fill="#2563eb" fillOpacity={0.3} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
