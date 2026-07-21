'use client';
import React from 'react';
import { useAccount } from 'wagmi';
import { useIdentityStore } from '@/store/useIdentityStore';
import { useShallow } from 'zustand/shallow';
import { CheckCircle2, Shield, Users, Activity, Copy, BadgeCheck } from 'lucide-react';
import QRCode from 'react-qr-code';
import AvatarViewer from '@/components/Identity/AvatarViewer';

export default function IdentityPassport() {
  const { address } = useAccount();
  
  const { handle, did, identityMetrics } = useIdentityStore(useShallow(s => ({
    handle: s.handle,
    did: s.did,
    identityMetrics: s.identityMetrics,
  })));

  const handleCopy = () => {
    if (did) {
      navigator.clipboard.writeText(did);
    }
  };

  const didStr = did || 'did:metago:unverified';
  const walletStr = address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : 'Not Connected';
  const level = 1; // Assuming constant for MVP or grab from store if exists
  const trustScore = identityMetrics?.trustScore || 65;
  const humanityIdx = (identityMetrics?.sovereignty && identityMetrics.sovereignty > 0) ? `${identityMetrics.sovereignty}%` : '70%';

  return (
    <div className="mb-8 w-full text-[#e5e2e1] font-sans">
      <div className="relative w-full rounded-3xl border-[1px] border-white/10 bg-[#141313]/60 backdrop-blur-2xl shadow-2xl p-6 lg:p-10 flex flex-col lg:flex-row gap-10 overflow-hidden">
        
        {/* Inner Glow */}
        <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(79,70,229,0.05)] pointer-events-none" />

        {/* LEFT SECTION: 3D Avatar */}
        <div className="w-full lg:w-[40%] flex-shrink-0 relative z-10 min-h-[400px]">
           <AvatarViewer />
        </div>

        {/* CENTER & RIGHT SECTION: Data Container */}
        <div className="w-full lg:w-[60%] flex flex-col justify-between py-4 relative z-10">
          <div className="flex flex-col h-full gap-8">
            {/* Top Row */}
            <div className="flex justify-between items-start border-b border-white/10 pb-6">
              <div>
                <h3 className="text-[#c7c4d8] text-sm tracking-widest font-mono mb-3 uppercase">METAGO IDENTITY PASSPORT</h3>
                <div className="flex items-center gap-4">
                  <h2 className="text-4xl sm:text-5xl font-bold flex items-center gap-3">
                    {handle || 'Citizen'} <BadgeCheck className="w-8 h-8 text-[#4F46E5]" />
                  </h2>
                  <span className="px-3 py-1 mt-1 rounded-full bg-indigo-900/50 border border-[#4F46E5]/50 text-[#c3c0ff] text-xs font-mono tracking-wider shadow-[0_0_10px_rgba(79,70,229,0.5)]">
                    LEVEL {level}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/40 border border-emerald-500/30">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />
                <span className="text-emerald-400 text-xs font-mono tracking-wider font-semibold">ACTIVE</span>
              </div>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
              {/* Left Data Column */}
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-[#918fa1] text-xs font-mono mb-2 tracking-wider">DID</p>
                  <div className="flex items-center gap-3 bg-black/40 px-4 py-3 rounded-xl border border-white/5">
                    <p className="font-mono text-sm tracking-wide text-[#22D3EE] truncate max-w-[200px]">
                      {didStr}
                    </p>
                    <Copy className="w-4 h-4 text-[#c7c4d8] cursor-pointer hover:text-white transition-colors" onClick={handleCopy} />
                  </div>
                </div>
                <div>
                  <p className="text-[#918fa1] text-xs font-mono mb-2 tracking-wider">WALLET</p>
                  <p className="font-mono text-sm tracking-wide bg-black/40 px-4 py-3 rounded-xl border border-white/5 text-[#c7c4d8]">
                    {walletStr}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[#918fa1] text-xs font-mono mb-2 tracking-wider">TRUST SCORE</p>
                    <p className="text-2xl text-emerald-400 font-bold">{trustScore}</p>
                  </div>
                  <div>
                    <p className="text-[#918fa1] text-xs font-mono mb-2 tracking-wider">HUMANITY INDEX</p>
                    <p className="text-2xl text-[#22D3EE] font-bold">{humanityIdx}</p>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-[#918fa1] text-xs font-mono mb-2 tracking-wider">PASSPORT STATUS</p>
                  <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/20 w-max px-4 py-2 rounded-lg border border-emerald-500/20">
                    <Shield className="w-5 h-5" />
                    <span className="font-medium tracking-wide">Verified Identity</span>
                  </div>
                </div>
              </div>

              {/* Right Data Column / QR Code */}
              <div className="flex flex-col items-center justify-center md:border-l border-white/5 md:pl-8 mt-8 md:mt-0">
                <div className="p-4 rounded-2xl bg-white border-2 border-[#22D3EE]/50 shadow-[0_0_40px_rgba(34,211,238,0.2)] mb-6 transition-transform hover:scale-105 duration-300">
                  <QRCode value={didStr} size={150} bgColor="#ffffff" fgColor="#000000" level="H" />
                </div>
                <div className="flex items-center gap-2 text-[#22D3EE] bg-[#22D3EE]/10 px-4 py-2 rounded-full border border-[#22D3EE]/30">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs font-mono tracking-widest font-semibold">SCAN TO VERIFY</span>
                </div>
              </div>
            </div>

            {/* Badges Row from old UI */}
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-[#c7c4d8]"><Shield className="w-3 h-3"/> ZK-Verified</div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-[#c7c4d8]"><Users className="w-3 h-3"/> Humanity-SBT Linked</div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-[#c7c4d8]"><Activity className="w-3 h-3"/> Sybil-Resistant</div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 flex justify-center text-center">
            <p className="text-[#918fa1] text-[10px] sm:text-xs font-mono tracking-[0.1em] sm:tracking-[0.25em]">
              SOULBOUND <span className="mx-2 sm:mx-4 text-[#4F46E5] opacity-50">•</span> NON-TRANSFERABLE <span className="mx-2 sm:mx-4 text-[#4F46E5] opacity-50">•</span> VERIFIABLE <span className="mx-2 sm:mx-4 text-[#4F46E5] opacity-50">•</span> USER SOVEREIGN
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
