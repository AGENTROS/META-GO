'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Grid, Contact, Clock, Bell, Shield, Users, Mail, Settings, 
  Activity, Globe, Search, RefreshCw, CheckCircle2, AlertTriangle, 
  Menu, X, LogOut
} from 'lucide-react';
import RightRail from '@/components/dashboard/RightRail';

import '@/styles/dashboard.css'; // Import the new dashboard OS styles

import { LucideIcon } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: React.ReactNode;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  { group: 'Overview', items: [
    { id: '', label: 'Dashboard', icon: Grid },
  ]},
  { group: 'Identity', items: [
    { id: 'identity-passport', label: 'Identity Passport', icon: Contact },
    { id: 'credential-vault', label: 'Credentials', icon: Shield },
    { id: 'humanity-index', label: 'Humanity Score', icon: Users },
    { id: 'identity-core', label: 'Identity Graph', icon: Activity },
  ]},
  { group: 'Avatar', items: [
    { id: 'avatar-center', label: 'Metaverse Hub', icon: Globe },
  ]},
  { group: 'Wallet', items: [
    { id: 'wallet-intelligence', label: 'Wallet Intelligence', icon: Grid },
    { id: 'connected-dapps', label: 'DApps', icon: Activity },
    { id: 'cross-chain-identity', label: 'Cross Chain', icon: Activity },
  ]},
  { group: 'Security', items: [
    { id: 'security-center', label: 'Security Center', icon: Shield },
    { id: 'recovery-center', label: 'Recovery Center', icon: Users },
    { id: 'threat-interception', label: 'Threats', icon: AlertTriangle },
    { id: 'activity-timeline', label: 'Audit Logs', icon: Clock },
  ]},
  { group: 'Intelligence', items: [
    { id: 'ai-guardian', label: 'AI Guardian', icon: Shield },
    { id: 'trust-analytics', label: 'Trust Analytics', icon: Activity },
    { id: 'identity-replay', label: 'Replay Studio', icon: Activity },
    { id: 'time-machine', label: 'Time Machine', icon: Clock },
  ]},
  { group: 'Privacy', items: [
    { id: 'burner-did', label: 'Burner DIDs', icon: Shield },
    { id: 'biometric-vault', label: 'Soulbound Vault', icon: Shield },
    { id: 'adaptive-context', label: 'Adaptive Context', icon: Activity },
    { id: 'digital-twin', label: 'Presence Map', icon: Globe },
    { id: 'did-mail', label: 'Secure Mail', icon: Mail },
  ]},
  { group: 'Settings', items: [
    { id: 'settings', label: 'Preferences', icon: Settings },
  ]}
];

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

export default function DashboardOSLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  // Get current active ID based on pathname
  const currentPath = (pathname || '').split('/').pop();
  const activeId = currentPath === 'dashboard' ? '' : currentPath;
  
  // Find current label for topbar breadcrumb
  let currentLabel = 'Dashboard';
  NAV_GROUPS.forEach(g => {
    g.items.forEach(i => {
      if (i.id === activeId) currentLabel = i.label;
    });
  });

  return (
    <div className="dashboard-os">
      <div className="app">
        {/* SIDEBAR */}
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-brand">
            <div className="flex-shrink-0" style={{ marginRight: '-2px' }}>
              <LogoMark size={26} />
            </div>
            <div className="brand-text">MetaGo<sup>+</sup></div>
          </div>
          
          <nav className="sidebar-scroll">
            {NAV_GROUPS.map((group, idx) => (
              <div key={idx} className="nav-group">
                <div className="nav-group-label">{group.group}</div>
                {group.items.map(item => (
                  <Link 
                    href={item.id ? `/dashboard/${item.id}` : '/dashboard'} 
                    key={item.id}
                    className={`nav-item ${activeId === item.id ? 'active' : ''}`}
                  >
                    <item.icon className="nav-ic" />
                    <span>{item.label}</span>
                    {item.badge && <span className="nav-badge">{item.badge}</span>}
                  </Link>
                ))}
              </div>
            ))}
          </nav>

          <div className="sidebar-foot">
            <Link href="/dashboard/settings" className="user-chip">
              <div className="user-avatar">SK</div>
              <div className="user-meta">
                <div className="user-name">Sharvan Koul</div>
                <div className="user-id mono">did:metago:...E71a</div>
              </div>
            </Link>
            <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <Menu size={12} /> : <X size={12} />}
              <span>{collapsed ? '' : 'Collapse'}</span>
            </button>
          </div>
        </aside>

        {/* MAIN AREA */}
        <div className="main">
          <header className="topbar">
            <div className="crumb">MetaGo / <b>{currentLabel}</b></div>
            
            <div className="searchbar">
              <Search size={14} />
              <span>Search identity, wallet, credentials…</span>
              <span className="kbd">⌘K</span>
            </div>
            
            <div className="top-actions">
              <button className="tbtn">
                <RefreshCw size={14} /> Refresh
              </button>
              <button className="tbtn primary" onClick={() => router.push('/dashboard/credential-vault')}>
                <CheckCircle2 size={14} /> Verify Credentials
              </button>
              <button className="icon-btn">
                <Bell size={15} />
                <span className="dot-badge">5</span>
              </button>
              <button className="icon-btn" onClick={() => router.push('/dashboard/settings')} title="Settings">
                <Settings size={15} />
              </button>
              <button className="icon-btn" onClick={() => router.push('/auth/signin')} title="Log Out" style={{ color: 'var(--red, #ef4444)' }}>
                <LogOut size={15} />
              </button>
            </div>
          </header>

          <div className="workspace">
            {/* INJECTED CHILD PAGE CONTENT */}
            <section className="content fade-in">
              {children}
            </section>
            
            {/* RIGHT RAIL: Activity Feed */}
            <RightRail />
          </div>
        </div>
      </div>
    </div>
  );
}
