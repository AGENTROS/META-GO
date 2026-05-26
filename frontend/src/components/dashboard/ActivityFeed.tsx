'use client';
import { useEffect } from 'react';
import { useIdentityStore } from '@/store/useIdentityStore';
import { Shield, AlertTriangle, CheckCircle2, Zap, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const ICONS: Record<string, any> = {
  SBT_ISSUED: CheckCircle2,
  THREAT_DETECTED: AlertTriangle,
  PROOF_EXPIRING: Clock,
  GUARDIAN_CONFIRMED: Shield,
  SYSTEM: Zap,
};

const COLORS: Record<string, string> = {
  SBT_ISSUED: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20',
  THREAT_DETECTED: 'text-red-500 bg-red-50 dark:bg-red-950/20',
  PROOF_EXPIRING: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20',
  GUARDIAN_CONFIRMED: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20',
  SYSTEM: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20',
};

const SEED_EVENTS = [
  { type: 'SBT_ISSUED', message: 'Genesis Citizen SBT minted successfully' },
  { type: 'SYSTEM', message: 'ZK proof verified — integrity score 92%' },
  { type: 'GUARDIAN_CONFIRMED', message: 'Identity peer trust link established' },
  { type: 'PROOF_EXPIRING', message: 'Biometric proof refresh recommended in 30 days' },
  { type: 'SYSTEM', message: 'Polygon Amoy block #4,892,201 confirmed' },
];

export default function ActivityFeed() {
  const { notifications, addNotification } = useIdentityStore();

  useEffect(() => {
    if (notifications.length === 0) {
      SEED_EVENTS.forEach((e, i) => {
        setTimeout(() => addNotification(e as any), i * 400);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full overflow-y-auto space-y-2 pr-1">
      {notifications.map((n, i) => {
        const Icon = ICONS[n.type] || Shield;
        return (
          <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${COLORS[n.type]}`}>
              <Icon size={12} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-snug">{n.message}</p>
              <p className="text-[10px] text-zinc-450 mt-0.5 font-mono">{new Date(n.timestamp).toLocaleTimeString()}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
