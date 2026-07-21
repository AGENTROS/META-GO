'use client';
import { useIdentityStore } from '@/store/useIdentityStore';
import { X, CheckCircle2, AlertTriangle, Shield, Clock } from 'lucide-react';
import { clsx } from 'clsx';

import { useShallow } from 'zustand/shallow';

const ICONS: Record<string, any> = {
  SBT_ISSUED: CheckCircle2,
  THREAT_DETECTED: AlertTriangle,
  PROOF_EXPIRING: Clock,
  GUARDIAN_CONFIRMED: Shield,
  SYSTEM: Shield,
};

const COLORS: Record<string, string> = {
  SBT_ISSUED: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20',
  THREAT_DETECTED: 'text-red-500 bg-red-50 dark:bg-red-950/20',
  PROOF_EXPIRING: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20',
  GUARDIAN_CONFIRMED: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20',
  SYSTEM: 'text-zinc-500 bg-zinc-50 dark:bg-zinc-900',
};

export function NotificationCenter({ onClose }: { onClose: () => void }) {
  const { notifications, markAllRead, clearNotifications } = useIdentityStore(useShallow(s => ({
    notifications: s.notifications,
    markAllRead: s.markAllRead,
    clearNotifications: s.clearNotifications
  })));
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed top-16 right-4 z-50 w-80 max-h-[70vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden flex flex-col" data-testid="notifications-panel">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Notifications</h3>
          <div className="flex gap-2">
            <button onClick={markAllRead} className="text-[10px] text-zinc-500 hover:text-blue-600 font-semibold uppercase">Mark all read</button>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><X size={14} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-xs text-zinc-450">No notifications yet</div>
          ) : (
            notifications.map(n => {
              const Icon = ICONS[n.type] || Shield;
              return (
                <div key={n.id} className={clsx('flex items-start gap-3 p-3 rounded-xl transition-colors', !n.read && 'bg-blue-50/40 dark:bg-blue-950/10')}>
                  <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', COLORS[n.type])}>
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-snug">{n.message}</p>
                    <p className="text-[10px] text-zinc-450 mt-1 font-mono">{new Date(n.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800">
            <button onClick={clearNotifications} className="text-[10px] text-red-500 hover:text-red-600 font-semibold uppercase">Clear all</button>
          </div>
        )}
      </div>
    </>
  );
}
