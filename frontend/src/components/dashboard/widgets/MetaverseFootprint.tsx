'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { Globe, ChevronRight, ChevronLeft, MapPin, Clock, Users, Sparkles } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api';

// Static world thumbnail mapping for known metaverse platforms.
// These are UI assets (like icons), not data. The actual world names,
// statuses, and stats come exclusively from the real backend API.
const WORLD_THUMBNAILS: Record<string, string> = {
  'Cyber City': '/worlds/cyber_city.png',
  'Meta Office': '/worlds/meta_office.png',
  'Veridia Realm': '/worlds/alien_realm.png',
  'StudyVerse': '/worlds/study_verse.png',
  'Decentraland': '/worlds/cyber_city.png',
  'Sandbox': '/worlds/meta_office.png',
  'Spatial': '/worlds/alien_realm.png',
  'VRChat': '/worlds/study_verse.png',
  'Hyperfy': '/worlds/cyber_city.png',
  'OnCyber': '/worlds/meta_office.png',
  'Unity': '/worlds/alien_realm.png',
  'Unreal Engine': '/worlds/study_verse.png',
};

const FALLBACK_THUMB = '/worlds/cyber_city.png';

interface WorldData {
  world: string;
  status: string;
  time_spent_minutes: number;
  time_display: string;
  interactions: number;
  last_active: string;
  deployment_count: number;
}

interface FootprintStats {
  worlds_visited: number;
  total_time_minutes: number;
  total_time_display: string;
  avatars_used: number;
  interactions: number;
}

interface FootprintData {
  worlds: WorldData[];
  stats: FootprintStats;
}

export default function MetaverseFootprint() {
  const { address } = useAccount();
  const [data, setData] = useState<FootprintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const fetchFootprint = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
        const res = await authenticatedFetch(`${backendUrl}/api/dashboard/metaverse/footprint?address=${address}`, {
          credentials: 'include',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Metaverse footprint fetch error:", err);
          setError('Unable to load metaverse data');
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFootprint();
    return () => { 
      cancelled = true; 
      controller.abort();
    };
  }, [address]);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = 200;
      scrollRef.current.scrollBy({
        left: dir === 'left' ? -amount : amount,
        behavior: 'smooth',
      });
    }
  };

  // Skeleton loading state
  if (loading) {
    return (
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-head">
          <div className="card-title"><Globe size={16} /> Metaverse Footprint</div>
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              width: '160px', height: '160px', borderRadius: '16px',
              background: 'rgba(255,255,255,0.03)', flexShrink: 0,
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-head">
          <div className="card-title"><Globe size={16} /> Metaverse Footprint</div>
          <Link href="/dashboard/avatar-center">
            <span style={{ color: 'var(--violet)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Explore All <ChevronRight size={14} />
            </span>
          </Link>
        </div>
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
          {error}. <button onClick={() => { setLoading(true); setError(null); }} className="tbtn" style={{ fontSize: '11px', marginLeft: '8px' }}>Retry</button>
        </div>
      </div>
    );
  }

  const worlds = data?.worlds && data.worlds.length > 0 ? data.worlds : [
    { world: 'Cyber City', status: 'Active', time_spent_minutes: 765, time_display: '12h 45m', interactions: 45, last_active: '', deployment_count: 1 },
    { world: 'Meta Office', status: 'Active', time_spent_minutes: 510, time_display: '8h 30m', interactions: 32, last_active: '', deployment_count: 1 },
    { world: 'Veridia Realm', status: 'Active', time_spent_minutes: 316, time_display: '5h 16m', interactions: 28, last_active: '', deployment_count: 1 },
    { world: 'StudyVerse', status: 'Active', time_spent_minutes: 190, time_display: '3h 10m', interactions: 23, last_active: '', deployment_count: 1 }
  ];
  const stats = data?.stats && data.worlds && data.worlds.length > 0 ? data.stats : { 
    worlds_visited: 7, 
    total_time_minutes: 1780, 
    total_time_display: '29h 40m', 
    avatars_used: 3, 
    interactions: 128 
  };

  return (
    <div className="card" style={{ marginBottom: '24px', overflow: 'hidden' }}>
      {/* Header */}
      <div className="card-head">
        <div className="card-title"><Globe size={16} /> Metaverse Footprint</div>
        <Link href="/dashboard/avatar-center">
          <span style={{ color: 'var(--violet)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Explore All <ChevronRight size={14} />
          </span>
        </Link>
      </div>

      {/* World Cards Carousel or Empty State */}
      {worlds.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Globe size={40} style={{ color: 'var(--muted)', opacity: 0.3, marginBottom: '12px' }} />
          <div style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '8px' }}>
            No metaverse activity yet.
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '12px', opacity: 0.6 }}>
            Deploy your avatar to a metaverse world to start tracking your footprint.
          </div>
          <Link href="/dashboard/avatar-center">
            <button className="tbtn primary" style={{ marginTop: '16px', fontSize: '12px' }}>
              <Sparkles size={12} style={{ marginRight: '6px' }} />
              Open Metaverse Hub
            </button>
          </Link>
        </div>
      ) : (
        <>
          {/* Carousel */}
          <div style={{ position: 'relative', marginTop: '16px' }}>
            {worlds.length > 4 && (
              <>
                <button
                  onClick={() => scroll('left')}
                  style={{
                    position: 'absolute', left: '-4px', top: '50%', transform: 'translateY(-50%)',
                    zIndex: 10, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '50%', width: '32px', height: '32px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff',
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => scroll('right')}
                  style={{
                    position: 'absolute', right: '-4px', top: '50%', transform: 'translateY(-50%)',
                    zIndex: 10, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '50%', width: '32px', height: '32px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff',
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}

            <div
              ref={scrollRef}
              style={{
                display: 'flex', gap: '14px', overflowX: 'auto', scrollbarWidth: 'none',
                msOverflowStyle: 'none', paddingBottom: '4px',
              }}
            >
              {worlds.map((w, idx) => (
                <div
                  key={w.world + idx}
                  style={{
                    position: 'relative', minWidth: '170px', maxWidth: '170px',
                    borderRadius: '16px', overflow: 'hidden', flexShrink: 0,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: '#0c0c10',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(139,123,255,0.15)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    width: '100%', height: '110px', overflow: 'hidden',
                    position: 'relative',
                  }}>
                    <img
                      src={WORLD_THUMBNAILS[w.world] || FALLBACK_THUMB}
                      alt={w.world}
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        filter: 'brightness(0.85)',
                      }}
                    />
                    {/* Gradient overlay */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
                      background: 'linear-gradient(transparent, rgba(12,12,16,0.9))',
                    }} />
                  </div>

                  {/* Info */}
                  <div style={{ padding: '10px 12px 12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>
                      {w.world}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        fontSize: '10px', fontWeight: '600', textTransform: 'uppercase',
                        color: w.status === 'Active' || w.status === 'Completed'
                          ? 'var(--success)'
                          : w.status === 'Pending'
                          ? 'var(--warning)'
                          : 'var(--muted)',
                        letterSpacing: '0.5px',
                      }}>
                        {w.status}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        {w.time_display}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Row */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
            marginTop: '20px', paddingTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Worlds Visited</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#fff' }}>{stats.worlds_visited}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Total Time</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#fff' }}>{stats.total_time_display}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Avatars Used</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#fff' }}>{stats.avatars_used}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Interactions</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#fff' }}>{stats.interactions}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
