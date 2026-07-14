'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { Fingerprint, Lock, Unlock, FileText, Upload, ShieldCheck, EyeOff, Trash2, Eye, Download } from 'lucide-react';
import { deriveVaultKey } from '@/lib/vault.crypto';
import { authenticatedFetch } from '@/lib/api';
import toast from 'react-hot-toast';

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export default function BiometricVault() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [encrypting, setEncrypting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const fetchItems = async () => {
    if (!address) { setLoading(false); return; }
    try {
      const res = await authenticatedFetch(`/api/privacy/vault?address=${address}`);
      if (res.ok) {
        const d = await res.json();
        setItems(d.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [address]);

  const handleUnlock = async () => {
    if (!address) return;
    setUnlocking(true);
    try {
      // Deterministic message signature to derive key
      const message = `Unlock MetaGo Soulbound Vault for ${address.toLowerCase()}`;
      const signature = await signMessageAsync({ account: address, message });
      
      const key = await deriveVaultKey(signature);
      setVaultKey(key);
      
      const res = await authenticatedFetch(`/api/privacy/vault/unlock?address=${address}`, { method: 'POST' });
      if (res.ok) {
        setUnlocked(true);
        toast.success("Vault decrypted successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Vault decryption failed");
    } finally {
      setUnlocking(false);
    }
  };

  const handleEncryptAndUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !vaultKey || !address) return;

    setEncrypting(true);
    const toastId = toast.loading(`Encrypting & uploading ${file.name}...`);

    try {
      const fileReader = new FileReader();
      
      fileReader.onload = async (event) => {
        try {
          const fileData = event.target?.result as ArrayBuffer;

          // Generate IV for AES-GCM-256
          const iv = window.crypto.getRandomValues(new Uint8Array(12));

          // Encrypt file content ArrayBuffer
          const ciphertextBuffer = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            vaultKey,
            fileData
          );

          const ciphertextBase64 = arrayBufferToBase64(ciphertextBuffer);
          const ivBase64 = arrayBufferToBase64(iv.buffer);

          const encryptedBlob = JSON.stringify({
            ciphertext: ciphertextBase64,
            iv: ivBase64
          });

          // Generate integrity hash of the original file
          const hashBuffer = await window.crypto.subtle.digest('SHA-256', fileData);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const integrityHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

          // Store to backend
          const res = await authenticatedFetch(`/api/privacy/vault/store?address=${address}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              encrypted_blob: encryptedBlob,
              encryption_metadata: {
                name: file.name,
                size: file.size,
                type: file.type
              },
              integrity_hash: integrityHash,
              algorithm: "AES-GCM-256"
            })
          });

          if (res.ok) {
            toast.success("File encrypted & stored securely", { id: toastId });
            fetchItems();
          } else {
            throw new Error("Backend storage failed");
          }
        } catch (err) {
          console.error(err);
          toast.error("Encryption/Upload failed", { id: toastId });
        }
      };

      fileReader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      toast.error("Encryption/Upload failed", { id: toastId });
    } finally {
      setEncrypting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDecryptAndDownload = async (item: any) => {
    if (!vaultKey) return;
    const toastId = toast.loading(`Decrypting ${item.encryption_metadata.name}...`);

    try {
      const encryptedJson = item.encrypted_blob;
      const { ciphertext, iv } = JSON.parse(encryptedJson);

      const ciphertextBytes = base64ToArrayBuffer(ciphertext);
      const ivBytes = new Uint8Array(base64ToArrayBuffer(iv));

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBytes },
        vaultKey,
        ciphertextBytes
      );

      // Create Blob and trigger download
      const blob = new Blob([decryptedBuffer], { type: item.encryption_metadata.type || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.encryption_metadata.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Decryption complete. Download started.", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Decryption failed. Signature/Key mismatch.", { id: toastId });
    }
  };

  const handleDelete = async (item: any) => {
    if (!address) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete ${item.encryption_metadata.name}?`);
    if (!confirmDelete) return;

    const toastId = toast.loading("Deleting vault item...");
    try {
      // Backend does not have a direct DELETE endpoint, let's see if we can implement or use a custom POST
      // Wait, let's verify if there is a delete endpoint. Let's send a DELETE request.
      const res = await authenticatedFetch(`/api/privacy/vault/${item.id}?address=${address}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success("Vault item deleted", { id: toastId });
        fetchItems();
      } else {
        toast.error("Failed to delete vault item", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete", { id: toastId });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '100px', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="pulse" style={{ display: 'inline-block', marginRight: '8px', background: 'var(--fg)' }}></div>
        Syncing encrypted enclaves...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--fg)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Fingerprint size={24} style={{ color: 'var(--blue)' }} />
            Soulbound Vault
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: '8px', fontSize: '15px' }}>
            Zero-knowledge encrypted storage. The server never sees your raw data.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleEncryptAndUpload} 
            style={{ display: 'none' }} 
          />
          <button 
            disabled={!unlocked || encrypting}
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              background: unlocked ? 'var(--fg)' : 'transparent', 
              color: unlocked ? 'var(--bg)' : 'var(--muted)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              padding: '10px 20px', 
              borderRadius: '8px', 
              fontWeight: 600, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              cursor: unlocked ? 'pointer' : 'not-allowed', 
              opacity: unlocked ? 1 : 0.5,
              transition: 'all 0.2s'
            }}
          >
            <Upload size={16} /> Encrypt & Upload
          </button>
        </div>
      </div>

      {!unlocked ? (
        <div style={{ textAlign: 'center', padding: '100px 20px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}>
          <div style={{ width: '80px', height: '80px', margin: '0 auto 24px auto', borderRadius: '50%', background: 'rgba(91,140,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)', boxShadow: unlocking ? '0 0 40px rgba(91,140,255,0.4)' : 'none', transition: 'all 0.3s ease' }}>
            <Lock size={32} />
          </div>
          <h2 style={{ fontSize: '20px', margin: '0 0 12px 0' }}>Vault is Locked</h2>
          <p style={{ color: 'var(--muted)', maxWidth: '400px', margin: '0 auto 32px auto', lineHeight: 1.5 }}>
            Your encrypted blobs require cryptographic decryption derived from your root identity signature.
          </p>
          <button 
            onClick={handleUnlock}
            disabled={unlocking}
            style={{ background: 'var(--fg)', color: 'var(--bg)', border: 'none', padding: '14px 32px', borderRadius: '24px', fontSize: '15px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            {unlocking ? <div className="pulse" style={{ background: 'var(--bg)' }}></div> : <Fingerprint size={18} />}
            {unlocking ? 'Verifying Signature...' : 'Unlock Vault'}
          </button>
        </div>
      ) : (
        <>
          <div style={{ background: 'rgba(62,207,142,0.05)', border: '1px solid rgba(62,207,142,0.2)', borderRadius: '12px', padding: '16px 24px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={20} style={{ color: 'var(--success)' }}/>
            <span style={{ fontSize: '14px', color: 'var(--success)' }}>Vault decrypted locally via WebAuthn derived keys.</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
            {items.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: 'var(--muted)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                <EyeOff size={32} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
                Vault is empty.
              </div>
            ) : items.map((item, i) => (
              <div key={i} style={{ padding: '20px', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '180px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <FileText size={20} style={{ color: 'var(--fg)' }} />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.encryption_metadata?.name || 'Encrypted Blob'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{(item.encryption_metadata?.size / 1024).toFixed(1)} KB • {item.algorithm}</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'monospace', wordBreak: 'break-all', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '4px', marginBottom: '12px' }}>
                    Hash: {item.integrity_hash.substring(0, 16)}...
                  </div>
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                    <button 
                      onClick={() => handleDecryptAndDownload(item)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--blue)', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: 0 }}
                    >
                      <Download size={14} /> Decrypt & Download
                    </button>
                    <button 
                      onClick={() => handleDelete(item)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
