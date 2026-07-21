'use client';
import React, { use } from 'react';
import { 
  ShieldCheck, AlertTriangle, Fingerprint, Coins, Award, Grid, Users, 
  Settings, Monitor, Mail, Link, Activity, Shield, Key
} from 'lucide-react';
import WalletCenter from '@/components/dashboard/modules/WalletCenter';
import WalletIntelligence from '@/components/dashboard/modules/WalletIntelligence';
import AvatarCenter from '@/components/dashboard/modules/AvatarCenter';
import IdentityGraph from '@/components/dashboard/modules/IdentityGraph';

import ThreatInterception from '@/components/dashboard/modules/ThreatInterception';
import BurnerDID from '@/components/dashboard/modules/BurnerDID';
import BiometricVault from '@/components/dashboard/modules/BiometricVault';
import DIDMail from '@/components/dashboard/modules/DIDMail';
import CredentialVault from '@/components/dashboard/modules/CredentialVault';
import SecurityCenter from '@/components/dashboard/modules/SecurityCenter';
import CrossChainIdentity from '@/components/dashboard/modules/CrossChainIdentity';
import ConnectedDApps from '@/components/dashboard/modules/ConnectedDApps';
import IdentityCore from '@/components/dashboard/modules/IdentityCore';
import RecoveryCenter from '@/components/dashboard/modules/RecoveryCenter';
import AIGuardian from '@/components/dashboard/modules/AIGuardian';
import TrustAnalytics from '@/components/dashboard/modules/TrustAnalytics';
import ThreatIntelligence from '@/components/dashboard/modules/ThreatIntelligence';
import AdaptiveContext from '@/components/dashboard/modules/AdaptiveContext';
import DigitalTwin from '@/components/dashboard/modules/DigitalTwin';
import TimeMachine from '@/components/dashboard/modules/TimeMachine';
import ReplayStudio from '@/components/dashboard/modules/ReplayStudio';
import HumanityIndex from '@/components/dashboard/modules/HumanityIndex';
import GuardianManagement from '@/components/dashboard/modules/GuardianManagement';
import IdentityMarketplace from '@/components/dashboard/modules/IdentityMarketplace';
import LiveNetworkMonitor from '@/components/dashboard/modules/LiveNetworkMonitor';
import Preferences from '@/components/dashboard/modules/Preferences';
import IdentityPassport from '@/components/dashboard/IdentityPassport';

export default function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const resolvedParams = use(params);
  const moduleId = resolvedParams.module;

  // Format module ID to Title Case (e.g., 'threat-interception' -> 'Threat Interception')
  const title = (moduleId || '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // A basic placeholder renderer based on the module ID
  const renderModuleContent = () => {
    switch(moduleId) {
      case 'burner-did': return <BurnerDID />;
      case 'biometric-vault': return <BiometricVault />;
      case 'adaptive-context': return <AdaptiveContext />;
      case 'digital-twin': return <DigitalTwin />;
      case 'time-machine': return <TimeMachine />;
      case 'ai-guardian': return <AIGuardian />;
      case 'trust-analytics': return <TrustAnalytics />;
      case 'threat-intelligence': return <ThreatIntelligence />;
      case 'threat-interception': return <ThreatInterception />;
      case 'avatar-center': return <AvatarCenter />;
      case 'identity-core': return <IdentityCore />;
      case 'recovery-center': return <RecoveryCenter />;
      case 'credential-vault': return <CredentialVault />;
      case 'cross-chain-identity': return <CrossChainIdentity />;
      case 'connected-dapps': return <ConnectedDApps />;
      case 'security-center': return <SecurityCenter />;
      case 'identity-graph': return <IdentityGraph />;
      case 'wallet-center': return <WalletCenter />;
      case 'wallet-intelligence': return <WalletIntelligence />;
      case 'humanity-index': return <HumanityIndex />;
      case 'guardian-management': return <GuardianManagement />;
      case 'identity-marketplace': return <IdentityMarketplace />;
      case 'live-network-monitor': return <LiveNetworkMonitor />;
      case 'identity-passport': return <IdentityPassport />;
      case 'activity-timeline': return <TimeMachine />;
      case 'identity-replay': return <ReplayStudio />;
      case 'did-mail': return <DIDMail />;
      case 'settings': return <Preferences />;

      default:
        // Generic fallback for any other module
        return (
          <div className="empty-state">
            <Monitor size={32} />
            <h4>{title} Module</h4>
            <p>This module is currently being built for the new MetaGo OS. It will feature real-time backend integrations in the upcoming release.</p>
          </div>
        );
    }
  };

  return (
    <>
      {renderModuleContent()}
    </>
  );
}
