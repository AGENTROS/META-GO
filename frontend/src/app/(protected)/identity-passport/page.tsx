import React from 'react';
import AvatarViewer from '@/components/Identity/AvatarViewer';
import { Shield, BadgeCheck, QrCode } from 'lucide-react';

export default function IdentityPassportPage() {
  return (
    <div className="w-full min-h-screen bg-[#020202] text-[#e5e2e1] p-8 font-sans">
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none" />
      
      <div className="max-w-[1440px] mx-auto pt-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Identity Passport
          </h1>
          <p className="text-[#c7c4d8]">Manage your sovereign Web3 identity and biometric parameters.</p>
        </div>

        {/* The Spatial Protocol Variant Layout */}
        <div className="relative w-full rounded-3xl border-[1px] border-white/10 bg-[#141313]/60 backdrop-blur-2xl shadow-2xl p-6 lg:p-10 flex flex-col lg:flex-row gap-10 overflow-hidden">
          
          {/* Inner Glow to match design system */}
          <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(79,70,229,0.05)] pointer-events-none" />

          {/* LEFT SECTION: 3D Avatar */}
          <div className="w-full lg:w-[40%] flex-shrink-0 relative z-10">
             <AvatarViewer />
          </div>

          {/* CENTER & RIGHT SECTION: Data Container */}
          <div className="w-full lg:w-[60%] flex flex-col justify-between py-4 relative z-10">
            
            <div className="flex flex-col h-full gap-8">
              {/* Top Row */}
              <div className="flex justify-between items-start border-b border-white/10 pb-6">
                <div>
                  <h3 className="text-[#c7c4d8] text-sm tracking-widest font-mono mb-3">METAGO IDENTITY PASSPORT</h3>
                  <div className="flex items-center gap-4">
                    <h2 className="text-5xl font-bold flex items-center gap-3">
                      CITIZEN <BadgeCheck className="w-8 h-8 text-[#4F46E5]" />
                    </h2>
                    <span className="px-3 py-1 mt-1 rounded-full bg-indigo-900/50 border border-[#4F46E5]/50 text-[#c3c0ff] text-xs font-mono tracking-wider shadow-[0_0_10px_rgba(79,70,229,0.5)]">
                      LEVEL 1
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/40 border border-emerald-500/30">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />
                  <span className="text-emerald-400 text-xs font-mono tracking-wider font-semibold">ACTIVE</span>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow">
                {/* Left Data Column */}
                <div className="flex flex-col gap-6">
                  <div>
                    <p className="text-[#918fa1] text-xs font-mono mb-2 tracking-wider">DID</p>
                    <p className="font-mono text-sm tracking-wide bg-black/40 px-4 py-3 rounded-xl border border-white/5 text-[#22D3EE]">
                      did:metago:0xabc123...c8d64
                    </p>
                  </div>
                  <div>
                    <p className="text-[#918fa1] text-xs font-mono mb-2 tracking-wider">WALLET</p>
                    <p className="font-mono text-sm tracking-wide bg-black/40 px-4 py-3 rounded-xl border border-white/5 text-[#c7c4d8]">
                      0xABc1...C8d64
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[#918fa1] text-xs font-mono mb-2 tracking-wider">ISSUED ON</p>
                      <p className="text-sm text-[#e5e2e1] font-medium">12 Jan 2024</p>
                    </div>
                    <div>
                      <p className="text-[#918fa1] text-xs font-mono mb-2 tracking-wider">LAST VERIFIED</p>
                      <p className="text-sm text-[#e5e2e1] font-medium">Today, 11:24 AM</p>
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
                <div className="flex flex-col items-center justify-center lg:border-l border-white/5 lg:pl-8 mt-8 lg:mt-0">
                  <div className="p-6 rounded-2xl bg-white border-2 border-[#22D3EE]/50 shadow-[0_0_40px_rgba(34,211,238,0.2)] mb-6 transition-transform hover:scale-105 duration-300">
                    <QrCode className="w-40 h-40 text-black" strokeWidth={1} />
                  </div>
                  <div className="flex items-center gap-2 text-[#22D3EE] bg-[#22D3EE]/10 px-4 py-2 rounded-full border border-[#22D3EE]/30">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs font-mono tracking-widest font-semibold">SCAN TO VERIFY</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Footer */}
            <div className="mt-10 pt-8 border-t border-white/10 flex justify-center text-center">
              <p className="text-[#918fa1] text-xs font-mono tracking-[0.25em]">
                SOULBOUND <span className="mx-4 text-[#4F46E5] opacity-50">•</span> NON-TRANSFERABLE <span className="mx-4 text-[#4F46E5] opacity-50">•</span> VERIFIABLE <span className="mx-4 text-[#4F46E5] opacity-50">•</span> USER SOVEREIGN
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
