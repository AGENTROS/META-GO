'use client';
import React, { useState, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useIdentityStore } from '@/store/useIdentityStore';
import { authenticatedFetch } from '@/lib/api';
import toast from 'react-hot-toast';
import { UploadCloud, ShieldCheck, CheckCircle2, FileImage, Shield, Cpu, Activity, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CredentialsUploadPage() {
  const { address } = useAccount();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('Aadhaar');
  const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'SCANNING' | 'REVIEW' | 'MINTING' | 'SUCCESS'>('IDLE');
  
  // OCR Extracted Data
  const [ocrData, setOcrData] = useState<any>(null);
  const [confidence, setConfidence] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const startUpload = async () => {
    if (!file || !address) return;
    setStatus('UPLOADING');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', docType);

    try {
      setTimeout(() => setStatus('SCANNING'), 1500); // UI visual delay for uploading
      
      const res = await authenticatedFetch(`/api/v1/credentials/upload`, {
        method: 'POST',
        body: formData,
        // Omit Content-Type so browser sets boundary for multipart/form-data
        headers: {} 
      });

      if (!res.ok) throw new Error("OCR Processing Failed");
      
      const data = await res.json();
      setOcrData(data.fields);
      setConfidence(data.overall_confidence);
      setStatus('REVIEW');
    } catch (err) {
      console.error(err);
      toast.error("Failed to process document");
      setStatus('IDLE');
    }
  };

  const confirmAndMint = async () => {
    if (!address || !ocrData) return;
    setStatus('MINTING');
    
    try {
      const plainData = Object.keys(ocrData).reduce((acc: any, key) => {
        acc[key] = ocrData[key].value;
        return acc;
      }, {});

      const res = await authenticatedFetch(`/api/v1/credentials/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          document_type: docType,
          extracted_data: plainData
        })
      });

      if (!res.ok) throw new Error("Minting Failed");
      
      // Update local state store to immediately reflect the new valid credential
      const d = await res.json();
      useIdentityStore.getState().addCredential({
        id: d.credential.id,
        name: docType,
        issuer: "MetaGo IDaaS",
        issuedAt: Date.now(),
        type: "OFF_CHAIN",
        proofStrength: Math.round(confidence * 100),
        revocationStatus: "VALID",
        domain: "IDENTITY"
      });

      setStatus('SUCCESS');
      toast.success("Zero-Knowledge Credential Minted!");
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (err) {
      console.error(err);
      toast.error("Failed to mint credential");
      setStatus('REVIEW');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--fg)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <ShieldCheck size={24} style={{ color: 'var(--blue)' }} />
          Verify Government Identity
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: '8px', fontSize: '15px' }}>
          Upload your physical document. Our Zero-Knowledge AI pipeline will extract the required fields, generate a cryptographic commitment, and destroy the raw image.
        </p>
      </div>

      {status === 'IDLE' && (
        <div style={{ background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>Document Type</label>
            <select 
              value={docType} 
              onChange={e => setDocType(e.target.value)}
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', outline: 'none' }}
            >
              <option value="Aadhaar">Aadhaar Card (India)</option>
              <option value="Passport">Passport (Global)</option>
              <option value="PAN">PAN Card (India)</option>
              <option value="DL">Driving License</option>
            </select>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{ border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '12px', padding: '60px 20px', textAlign: 'center', cursor: 'pointer', background: file ? 'rgba(91,140,255,0.05)' : 'transparent', transition: 'all 0.2s' }}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/jpeg, image/png, application/pdf" />
            {file ? (
              <>
                <FileImage size={40} style={{ color: 'var(--blue)', margin: '0 auto 16px auto' }} />
                <div style={{ fontSize: '16px', fontWeight: 600 }}>{file.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>{(file.size / 1024 / 1024).toFixed(2)} MB • Ready to Scan</div>
              </>
            ) : (
              <>
                <UploadCloud size={40} style={{ color: 'var(--muted)', margin: '0 auto 16px auto' }} />
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--muted)' }}>Drag & Drop Document Here</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>Supports JPG, PNG, PDF (Max 10MB)</div>
              </>
            )}
          </div>

          <button 
            disabled={!file}
            onClick={startUpload}
            className="tbtn primary" 
            style={{ width: '100%', padding: '16px', fontSize: '16px', opacity: file ? 1 : 0.5 }}
          >
            Start Encrypted OCR Scan
          </button>
        </div>
      )}

      {(status === 'UPLOADING' || status === 'SCANNING' || status === 'MINTING') && (
        <div style={{ textAlign: 'center', padding: '100px 20px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}>
          <div className="pulse" style={{ width: '60px', height: '60px', margin: '0 auto 24px auto', borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            {status === 'UPLOADING' && <UploadCloud size={24} />}
            {status === 'SCANNING' && <Activity size={24} />}
            {status === 'MINTING' && <Cpu size={24} />}
          </div>
          <h2 style={{ fontSize: '20px', margin: '0 0 12px 0' }}>
            {status === 'UPLOADING' && 'Securing Pipeline...'}
            {status === 'SCANNING' && 'Running OpenCV & EasyOCR...'}
            {status === 'MINTING' && 'Generating Zero-Knowledge Proof...'}
          </h2>
          <p style={{ color: 'var(--muted)' }}>
            {status === 'UPLOADING' && 'Transferring bytes to memory buffer'}
            {status === 'SCANNING' && 'Enhancing image contrast and extracting sovereign fields'}
            {status === 'MINTING' && 'Committing cryptographic hash. Raw image is being deleted from RAM.'}
          </p>
        </div>
      )}

      {status === 'REVIEW' && ocrData && (
        <div style={{ background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ background: 'rgba(62,207,142,0.1)', padding: '12px', borderRadius: '12px' }}>
              <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px' }}>OCR Extraction Successful</h2>
              <div style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} style={{ color: 'var(--warning)' }} /> 
                Overall Engine Confidence: {(confidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
            {Object.keys(ocrData).map((key) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <div style={{ textTransform: 'capitalize', color: 'var(--muted)', fontSize: '13px' }}>{key.replace('_', ' ')}</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#fff' }}>{ocrData[key].value}</div>
                  <div style={{ fontSize: '11px', color: 'var(--success)', marginTop: '4px' }}>{(ocrData[key].confidence * 100).toFixed(1)}% Match</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={() => setStatus('IDLE')} className="tbtn" style={{ flex: 1, padding: '16px' }}>Rescan Image</button>
            <button onClick={confirmAndMint} className="tbtn primary" style={{ flex: 2, padding: '16px', background: 'var(--panel)' }}>Confirm & Mint ZK Credential</button>
          </div>
        </div>
      )}

      {status === 'SUCCESS' && (
        <div style={{ textAlign: 'center', padding: '100px 20px', background: 'rgba(62,207,142,0.05)', border: '1px solid rgba(62,207,142,0.2)', borderRadius: '16px' }}>
          <ShieldCheck size={60} style={{ color: 'var(--success)', margin: '0 auto 24px auto' }} />
          <h2 style={{ fontSize: '24px', margin: '0 0 12px 0', color: 'var(--success)' }}>Credential Minted Successfully</h2>
          <p style={{ color: 'var(--muted)', maxWidth: '400px', margin: '0 auto' }}>
            Your Zero-Knowledge commitment has been mapped to your Universal Passport. Redirecting you back to the Command Center...
          </p>
        </div>
      )}

    </div>
  );
}
