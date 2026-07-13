import { Navbar } from '@/components/layout/Navbar';
import SBTGalleryClient from './SBTGalleryClient';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function SBTGallery() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Navbar />
      
      <main className="pt-24 pb-20 px-4 max-w-7xl mx-auto flex-grow w-full">
        {/* Navigation Breadcrumbs - Static Server Render */}
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-450 mb-2">
          <Link href="/" className="hover:text-blue-600">Meta Go</Link>
          <ChevronRight size={10} />
          <span className="text-blue-600 font-bold">Soulbound Tokens</span>
        </div>
        
        {/* Static Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Soulbound <span className="gradient-text font-bold">Credentials</span>
          </h1>
          <p className="text-sm text-zinc-450 mt-1">
            Non-transferable ERC-721 tokens that prove your verified status.
          </p>
        </div>

        {/* Client Gallery Grid */}
        <SBTGalleryClient />
      </main>
    </div>
  );
}
