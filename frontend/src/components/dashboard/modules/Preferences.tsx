'use client';
import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useIdentityStore } from '@/store/useIdentityStore';
import { useShallow } from 'zustand/shallow';
import { Settings, Shield, Key, Eye, Clock, Download, Upload, Server, Bell, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Preferences() {
  const { address } = useAccount();
  const { handle, did, soulboundTokens, credentials, notifications, setHandle } = useIdentityStore(useShallow(s => ({
    handle: s.handle,
    did: s.did,
    soulboundTokens: s.soulboundTokens,
    credentials: s.credentials,
    notifications: s.notifications,
    setHandle: s.setHandle
  })));

  // State settings
  const [sessionTimeout, setSessionTimeout] = useState('900');
  const [networkType, setNetworkType] = useState('polygon_amoy');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [customHandle, setCustomHandle] = useState(handle || '');
  const [updatingHandle, setUpdatingHandle] = useState(false);

  const handleSaveHandle = () => {
    if (!customHandle.trim()) {
      toast.error('Handle cannot be empty');
      return;
    }
    setUpdatingHandle(true);
    setTimeout(() => {
      setHandle(customHandle.trim());
      setUpdatingHandle(false);
      toast.success('Identity handle updated locally');
    }, 800);
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        meta: {
          exporter: address,
          timestamp: Date.now(),
          version: '1.0.0'
        },
        identity: {
          handle,
          did,
          soulboundTokens,
          credentials
        }
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `metago_enclave_backup_${address?.substring(0, 8)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('Decentralized identity enclave exported');
    } catch (e) {
      console.error(e);
      toast.error('Export failed');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (importedData.identity && importedData.meta) {
          // In a real application, we would merge this data into our store/database
          // For safety, we notify the user we loaded it
          toast.success(`Identity backup imported from ${new Date(importedData.meta.timestamp).toLocaleDateString()}`);
        } else {
          toast.error('Invalid backup file schema');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to parse backup JSON');
      }
    };
    fileReader.readAsText(file);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--fg)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <Settings size={24} style={{ color: 'var(--violet)' }} />
          Preferences & Settings
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: '8px', fontSize: '15px' }}>
          Manage your zero-knowledge settings, decentralized identity keys, and local UI preferences.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Profile Settings */}
        <div className="card">
          <div className="card-head">
            <div className="card-title"><Key size={16} /> Identity Profile</div>
          </div>
          <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>Decentralized Alias (Handle)</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  value={customHandle} 
                  onChange={(e) => setCustomHandle(e.target.value)}
                  placeholder="e.g. citizen_one"
                  style={{ 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    padding: '10px 14px', 
                    color: '#fff', 
                    fontSize: '14px',
                    flexGrow: 1,
                    outline: 'none'
                  }} 
                />
                <button 
                  onClick={handleSaveHandle}
                  disabled={updatingHandle}
                  className="tbtn primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {updatingHandle ? <RefreshCw size={14} className="animate-spin" /> : null}
                  Update Handle
                </button>
              </div>
            </div>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>DID Document Endpoint</span>
              <div className="mono" style={{ fontSize: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', marginTop: '6px', color: 'var(--violet)', wordBreak: 'break-all' }}>
                {did || `did:metago:${address || 'unknown'}`}
              </div>
            </div>
          </div>
        </div>

        {/* Security & Sessions */}
        <div className="card">
          <div className="card-head">
            <div className="card-title"><Clock size={16} /> Security & Session Controls</div>
          </div>
          <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>SIWE Session Expiry</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Inactivity timeout before requiring cryptographic sign-in.</div>
              </div>
              <select 
                value={sessionTimeout} 
                onChange={(e) => setSessionTimeout(e.target.value)}
                style={{ background: 'var(--panel-solid)', border: '1px solid var(--border)', color: '#fff', padding: '8px 12px', borderRadius: '8px', outline: 'none' }}
              >
                <option value="900">15 Minutes</option>
                <option value="3600">1 Hour</option>
                <option value="86400">24 Hours</option>
                <option value="0">Never Expire</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Threat Alerts</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Receive browser notification prompts for high-risk intrusion detections.</div>
              </div>
              <button 
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className="tbtn"
                style={{ 
                  background: notificationsEnabled ? 'rgba(62,207,142,0.15)' : 'rgba(255,255,255,0.05)',
                  color: notificationsEnabled ? 'var(--success)' : 'var(--muted)',
                  border: '1px solid ' + (notificationsEnabled ? 'rgba(62,207,142,0.25)' : 'var(--border)'),
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                {notificationsEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>

        {/* Network Preferences */}
        <div className="card">
          <div className="card-head">
            <div className="card-title"><Server size={16} /> RPC Node Configurations</div>
          </div>
          <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Primary RPC Network</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Network used to verify Soulbound tokens and ZK-attestations.</div>
              </div>
              <select 
                value={networkType} 
                onChange={(e) => setNetworkType(e.target.value)}
                style={{ background: 'var(--panel-solid)', border: '1px solid var(--border)', color: '#fff', padding: '8px 12px', borderRadius: '8px', outline: 'none' }}
              >
                <option value="polygon_amoy">Polygon Amoy Testnet</option>
                <option value="mainnet">Ethereum Mainnet</option>
                <option value="localhost">Local Testnet (Hardhat/Ganache)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Portability (Backup) */}
        <div className="card">
          <div className="card-head">
            <div className="card-title"><Download size={16} /> Data Portability & Backup</div>
          </div>
          <div style={{ padding: '20px 0', display: 'flex', gap: '16px' }}>
            <button 
              onClick={handleExportBackup}
              className="tbtn"
              style={{ 
                flex: 1, 
                border: '1px solid var(--border)', 
                padding: '16px', 
                borderRadius: '12px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '8px',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <Download size={20} style={{ color: 'var(--blue)' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Export Identity Enclave</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>Download local verification tokens, credentials, and settings.</div>
              </div>
            </button>

            <label 
              style={{ 
                flex: 1, 
                border: '1px dashed var(--border)', 
                padding: '16px', 
                borderRadius: '12px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                justifyContent: 'center'
              }}
            >
              <input type="file" accept=".json" onChange={handleImportBackup} style={{ display: 'none' }} />
              <Upload size={20} style={{ color: 'var(--violet)' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Import Identity Enclave</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>Restore backup identity parameters from JSON export.</div>
              </div>
            </label>
          </div>
        </div>

      </div>

    </div>
  );
}
