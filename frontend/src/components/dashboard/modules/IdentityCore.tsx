'use client';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Network, ZoomIn, ZoomOut, Search, Activity, AlertTriangle } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';

export default function IdentityCore() {
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [error, setError] = useState<string | null>(null);

  const { address } = useAccount();
  const dummyAddress = address;

  useEffect(() => {
    // Set dimensions based on container
    const updateDimensions = () => {
      const container = document.getElementById('graph-container');
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: container.clientHeight
        });
      }
    };
    
    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    async function fetchGraph() {
      try {
        const res = await fetch(`http://localhost:8001/api/did/graph?address=${dummyAddress}`);
        if (!res.ok) throw new Error('Failed to fetch graph data');
        const data = await res.json();
        
        // Add coordinates to avoid zero-start bunching
        const nodes = data.nodes.map((n: any) => ({
          ...n,
          x: Math.random() * 200 - 100,
          y: Math.random() * 200 - 100
        }));

        setGraphData({ nodes, links: data.links });
        setStats(data.stats);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchGraph();
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const getNodeColor = (group: number) => {
    switch(group) {
      case 1: return '#8b7bff'; // Root/Wallet
      case 2: return '#3ecf8e'; // SBT
      case 3: return '#ff5fa8'; // ZK Proof
      case 4: return '#5b8cff'; // DApp
      default: return '#93939f';
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Identity Engine</div>
          <h1 className="page-title">
            <div className="picon"><Network size={18} /></div>
            Identity Graph
          </h1>
          <p className="page-desc">
            A real-time relationship map of your connected credentials, biometric anchors, and DApp interactions.
          </p>
        </div>
      </div>

      <div className="card stack" style={{ height: '70vh', padding: 0, overflow: 'hidden', position: 'relative' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)' }}>
            <div className="pulse" style={{ display: 'inline-block', marginRight: '10px' }}></div>
            Computing spatial identity relations...
          </div>
        ) : error ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--danger)' }}>
            <AlertTriangle size={24} style={{ marginRight: '10px' }}/> {error}
          </div>
        ) : (
          <div id="graph-container" style={{ width: '100%', height: '100%', background: 'var(--bg)' }}>
            
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', gap: '10px' }}>
              <div className="stat-card" style={{ padding: '12px 20px', background: 'rgba(10,10,12,0.8)', backdropFilter: 'blur(10px)' }}>
                <div className="stat-label">Total Nodes</div>
                <div className="stat-value" style={{ fontSize: '18px' }}>{stats?.node_count || 0}</div>
              </div>
              <div className="stat-card" style={{ padding: '12px 20px', background: 'rgba(10,10,12,0.8)', backdropFilter: 'blur(10px)' }}>
                <div className="stat-label">Graph Depth</div>
                <div className="stat-value" style={{ fontSize: '18px' }}>{stats?.depth || 0}</div>
              </div>
            </div>

            <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 10, display: 'flex', gap: '8px' }}>
              <button className="icon-btn" style={{ background: 'var(--panel)' }}><ZoomIn size={18}/></button>
              <button className="icon-btn" style={{ background: 'var(--panel)' }}><ZoomOut size={18}/></button>
              <button className="icon-btn" style={{ background: 'var(--panel)' }}><Search size={18}/></button>
            </div>

            {/* We only render ForceGraph2D if window is defined (Next.js SSR safety) */}
            {typeof window !== 'undefined' && graphData.nodes.length > 0 && (
              <ForceGraph2D
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                nodeColor={(node: any) => getNodeColor(node.group)}
                nodeRelSize={6}
                nodeVal={(node: any) => node.val}
                nodeLabel={(node: any) => `${node.label} ${node.desc ? `\n${node.desc}` : ''}`}
                linkColor={() => 'rgba(255,255,255,0.1)'}
                linkWidth={1.5}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                backgroundColor="transparent"
              />
            )}

            {graphData.nodes.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)' }}>
                No relationship nodes found.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
