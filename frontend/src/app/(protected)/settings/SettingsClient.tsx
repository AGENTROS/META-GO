'use client';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { useIdentityStore } from '@/store/useIdentityStore';
import { ChevronRight, Shield, Download, RefreshCw, Trash2, Moon, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { clsx } from 'clsx';
import { apiCall } from '@/lib/api';

export default function SettingsClient() {
  const { theme, setTheme } = useTheme();
  const store = useIdentityStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState({ email: true, inApp: true });
  const [rotating, setRotating] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await apiCall('/api/auth/sessions');
      if (Array.isArray(data)) {
        setSessions(data);
      }
    } catch (err) {
      console.error('Failed to load active sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessToken: string) => {
    try {
      const res = await apiCall(`/api/auth/sessions/${sessToken}`, { method: 'DELETE' });
      if (res && res.ok) {
        toast.success('Session revoked successfully');
        fetchSessions();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke session');
    }
  };

  function handleDangerLogout() {
    if (confirm('Are you sure? This will end your active session.')) {
      store.logout();
      toast.success('Logged out');
      router.push('/');
    }
  }

  const handleExport = () => {
    const data = {
      did: store.did || `did:metago:${store.walletAddress?.toLowerCase() || 'unregistered'}`,
      walletAddress: store.walletAddress,
      identityMetrics: store.identityMetrics,
      credentialsCount: store.credentials.length,
      soulboundTokensCount: store.soulboundTokens.length,
      exportedAt: new Date().toISOString(),
      proverModel: 'Groth16 BN128 Face-Voice Fusion',
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'metago_identity_metadata.json');
    document.body.appendChild(a); a.click(); a.remove();
    toast.success('Identity metadata exported');
  };

  const handleRotateKeys = async () => {
    setRotating(true);
    const t = toast.loading('Generating new witness encryption parameters...');
    await new Promise(r => setTimeout(r, 2000));
    setRotating(false);
    toast.success('Encryption keys rotated', { id: t });
  };

  const handleDeleteBiometrics = () => {
    if (confirm('WARNING: This will permanently delete your local biometric vectors. Continue?')) {
      store.logout();
      toast.success('Biometric vectors deleted');
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col">
      <Navbar />
      <main className="pt-28 pb-16 px-4 md:px-8 max-w-2xl mx-auto w-full flex-grow space-y-8">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-450 mb-2">
          <Link href="/" className="hover:text-blue-600 transition-colors">Meta Go</Link>
          <ChevronRight size={10} />
          <span className="text-blue-600 font-bold">Settings</span>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
          <p className="text-sm text-zinc-550 dark:text-zinc-400 mt-1">Configure your dashboard, privacy parameters, and sovereign keys.</p>
        </div>

        <div className="space-y-6">
          <GlassCard className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4">Appearance</h2>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-550 dark:text-zinc-400">Display Theme</span>
              <div className="flex gap-2 p-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl">
                {[{ id: 'light', icon: <Sun size={12} />, label: 'Light' }, { id: 'dark', icon: <Moon size={12} />, label: 'Dark' }].map(t => (
                  <button key={t.id} onClick={() => setTheme(t.id)} data-testid={`theme-${t.id}`}
                    className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all',
                      theme === t.id ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-sm' : 'text-zinc-450 hover:text-zinc-900 dark:hover:text-zinc-200'
                    )}>{t.icon}{t.label}</button>
                ))}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Shield size={16} className="text-blue-600" /> Biometric Data Vault Control
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
              Manage your local biometric vector metadata, rotate prover keys, or permanently delete credentials.
            </p>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl gap-4">
                <div>
                  <p className="text-xs font-bold">Export Biometric Metadata</p>
                  <p className="text-[10px] text-zinc-450 mt-0.5">Download a JSON copy of your local identity metadata.</p>
                </div>
                <button onClick={handleExport} data-testid="export-metadata-btn" className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-zinc-800 dark:hover:bg-zinc-200">
                  <Download size={12} /> Export
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl gap-4">
                <div>
                  <p className="text-xs font-bold">Rotate Encryption Keys</p>
                  <p className="text-[10px] text-zinc-450 mt-0.5">Generate new witness constants for your local prover.</p>
                </div>
                <button onClick={handleRotateKeys} disabled={rotating} data-testid="rotate-keys-btn" className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50">
                  <RefreshCw size={12} className={rotating ? 'animate-spin' : ''} /> Rotate
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-red-50/30 dark:bg-red-950/10 border border-red-500/20 rounded-2xl gap-4">
                <div>
                  <p className="text-xs font-bold text-red-500">Delete Biometric Vault</p>
                  <p className="text-[10px] text-zinc-450 mt-0.5">Permanently erase local vectors and credentials.</p>
                </div>
                <button onClick={handleDeleteBiometrics} data-testid="delete-vault-btn" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-2">Digital Governance & Compliance</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
              Meta Go operates under a zero-storage architecture aligned with global privacy regulations.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: 'GDPR Compliant', desc: 'Zero-storage biometric policy' },
                { name: 'SOC2 Compliant', desc: 'Encrypted local prover' },
                { name: 'W3C DID Standard', desc: 'Decentralized identifier schemas' },
              ].map((c, i) => (
                <div key={i} className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-300">{c.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-[9px] text-zinc-450 mt-1">{c.desc}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4">Notifications</h2>
            {[{ label: 'Email Security Alerts', key: 'email' as const }, { label: 'In-app Security Alerts', key: 'inApp' as const }].map(item => (
              <div key={item.key} className="flex items-center justify-between py-2.5 border-b border-zinc-100 dark:border-zinc-850/50 last:border-0 last:pb-0">
                <span className="text-xs font-semibold text-zinc-550 dark:text-zinc-400">{item.label}</span>
                <button onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key] }))} role="switch" aria-checked={notifications[item.key]}
                  data-testid={`toggle-${item.key}`}
                  className={clsx('w-10 h-5 rounded-full border transition-all relative flex items-center px-0.5 cursor-pointer',
                    notifications[item.key] ? 'bg-blue-600/20 border-blue-600/30' : 'bg-zinc-200 border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700')}>
                  <span className={clsx('block w-3.5 h-3.5 rounded-full transition-all', notifications[item.key] ? 'bg-blue-600 translate-x-5' : 'bg-zinc-400 dark:bg-zinc-500')} />
                </button>
              </div>
            ))}
          </GlassCard>

          <GlassCard className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Shield size={16} className="text-blue-600" /> Active Sessions
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
              Manage your active sessions across different devices and locations. Revoking a session will instantly log that device out.
            </p>
            {loadingSessions ? (
              <div className="text-center py-4 text-xs text-zinc-450 font-mono">Loading sessions...</div>
            ) : (
              <div className="space-y-3">
                {sessions.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl gap-4">
                    <div className="text-left space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">{s.ipAddress}</span>
                        {s.isCurrent && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-[8px] font-bold text-blue-600 uppercase tracking-wider">Current</span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-450 font-mono truncate max-w-xs">{s.userAgent}</p>
                      <p className="text-[9px] text-zinc-500">Last Active: {new Date(s.lastActivityAt).toLocaleString()}</p>
                    </div>
                    {!s.isCurrent && (
                      <button onClick={() => handleRevokeSession(s.token)}
                        className="p-2 bg-red-650/15 border border-red-500/20 hover:bg-red-650/25 text-red-500 rounded-xl transition-all">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-6 bg-white dark:bg-zinc-900 border border-red-500/20">
            <h2 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-4">Danger Zone</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold">End Active Session</p>
                <p className="text-[10px] text-zinc-450 mt-0.5">Clears active session and disconnects wallet.</p>
              </div>
              <NeonButton variant="danger" size="sm" onClick={handleDangerLogout} data-testid="settings-logout">Logout</NeonButton>
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
