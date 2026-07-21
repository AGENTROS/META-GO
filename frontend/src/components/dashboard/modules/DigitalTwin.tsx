'use client';
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Network, Database, Cloud, MapPin, Globe } from 'lucide-react';
import dynamic from 'next/dynamic';
import { forceCollide, forceRadial } from 'd3-force';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export default function DigitalTwin() {
  const [loading, setLoading] = useState(true);
  const graphRef = useRef<any>(null);
  const lastClearRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const graphData = useMemo(() => {
    const loadImage = (url: string) => {
      if (typeof window === 'undefined') return null;
      const img = new window.Image();
      img.src = url;
      return img;
    };

    const categories = [
      { id: 'cat_web3', name: 'WEB3 WALLETS', group: 1, val: 20, color: '#7B61FF', type: 'category' },
      { id: 'cat_web2', name: 'WEB2 ACCOUNTS', group: 2, val: 20, color: '#3AA0FF', type: 'category' },
      { id: 'cat_dapps', name: 'CONNECTED DAPPS', group: 3, val: 20, color: '#10b981', type: 'category' },
      { id: 'cat_creds', name: 'CREDENTIALS', group: 4, val: 20, color: '#f59e0b', type: 'category' },
      { id: 'cat_threats', name: 'THREATS / ALERTS', group: 5, val: 20, color: '#ef4444', type: 'category' }
    ];

    const leafNodes = [
      { id: 'metamask', name: 'MetaMask', group: 1, val: 16, parent: 'cat_web3', imgUrl: 'https://cdn.brandfetch.io/metamask.io/icon/theme/dark/fallback/transparent' },
      { id: 'walletconnect', name: 'WalletConnect', group: 1, val: 16, parent: 'cat_web3', imgUrl: 'https://cdn.brandfetch.io/walletconnect.com/icon/theme/dark/fallback/transparent' },
      { id: 'trust', name: 'Trust Wallet', group: 1, val: 16, parent: 'cat_web3', imgUrl: 'https://cdn.brandfetch.io/trustwallet.com/icon/theme/dark/fallback/transparent' },
      { id: 'google', name: 'Google', group: 2, val: 16, parent: 'cat_web2', imgUrl: 'https://cdn.brandfetch.io/google.com/icon/theme/dark/fallback/transparent' },
      { id: 'github', name: 'GitHub', group: 2, val: 16, parent: 'cat_web2', imgUrl: 'https://cdn.brandfetch.io/github.com/icon/theme/dark/fallback/transparent' },
      { id: 'linkedin', name: 'LinkedIn', group: 2, val: 16, parent: 'cat_web2', imgUrl: 'https://cdn.brandfetch.io/linkedin.com/icon/theme/dark/fallback/transparent' },
      { id: 'twitter', name: 'X (Twitter)', group: 2, val: 16, parent: 'cat_web2', imgUrl: 'https://cdn.brandfetch.io/twitter.com/icon/theme/dark/fallback/transparent' },
      { id: 'email', name: 'Email', group: 2, val: 16, parent: 'cat_web2', imgUrl: 'https://cdn-icons-png.flaticon.com/512/732/732200.png' },
      { id: 'uniswap', name: 'Uniswap', group: 3, val: 16, parent: 'cat_dapps', imgUrl: 'https://cdn.brandfetch.io/uniswap.org/icon/theme/dark/fallback/transparent' },
      { id: 'opensea', name: 'OpenSea', group: 3, val: 16, parent: 'cat_dapps', imgUrl: 'https://cdn.brandfetch.io/opensea.io/icon/theme/dark/fallback/transparent' },
      { id: 'lens', name: 'Lens Protocol', group: 3, val: 16, parent: 'cat_dapps', imgUrl: 'https://cdn.brandfetch.io/lens.xyz/icon/theme/dark/fallback/transparent' },
      { id: 'ens', name: 'ENS', group: 3, val: 16, parent: 'cat_dapps', imgUrl: 'https://cdn.brandfetch.io/ens.domains/icon/theme/dark/fallback/transparent' },
      { id: 'aave', name: 'Aave', group: 3, val: 16, parent: 'cat_dapps', imgUrl: 'https://cdn.brandfetch.io/aave.com/icon/theme/dark/fallback/transparent' },
      { id: 'cred_email', name: 'Email Verified', group: 4, val: 16, parent: 'cat_creds', imgUrl: 'https://cdn-icons-png.flaticon.com/512/190/190411.png' },
      { id: 'cred_kyc', name: 'KYC Verified', group: 4, val: 16, parent: 'cat_creds', imgUrl: 'https://cdn-icons-png.flaticon.com/512/6584/6584347.png' },
      { id: 'cred_uni', name: 'University ID', group: 4, val: 16, parent: 'cat_creds', imgUrl: 'https://cdn-icons-png.flaticon.com/512/4762/4762311.png' },
      { id: 'threat_leak', name: 'Leak Detected', group: 5, val: 16, parent: 'cat_threats', imgUrl: 'https://cdn-icons-png.flaticon.com/512/564/564821.png' },
      { id: 'threat_phish', name: 'Phishing Alert', group: 5, val: 16, parent: 'cat_threats', imgUrl: 'https://cdn-icons-png.flaticon.com/512/5753/5753051.png' },
      { id: 'threat_login', name: 'Suspicious Login', group: 5, val: 16, parent: 'cat_threats', imgUrl: 'https://cdn-icons-png.flaticon.com/512/1157/1157077.png' }
    ];

    const allNodes: any[] = [
      { 
        id: 'root', 
        name: 'Sharvan Koul', 
        subname: 'DID: MetaGo...E71a', 
        group: 0, 
        val: 50, 
        color: '#FFFFFF', 
        type: 'root',
        imgUrl: '/avatar.jpeg'
      },
      ...categories,
      ...leafNodes
    ];

    allNodes.forEach(node => {
      // Remove any fixed coordinates that might be left over from previous dagMode/fast-refresh
      delete node.fx;
      delete node.fy;
      
      // Give them a random starting position so the physics engine doesn't deadlock at exactly 0,0
      if (node.x === undefined) node.x = (Math.random() - 0.5) * 200;
      if (node.y === undefined) node.y = (Math.random() - 0.5) * 200;
      
      if (node.imgUrl) {
        node.img = loadImage(node.imgUrl);
      }
    });

    const links: any[] = [];
    categories.forEach(cat => {
      links.push({ source: 'root', target: cat.id, color: cat.color, value: 4, isCategoryLink: true });
    });

    leafNodes.forEach(leaf => {
      const cat = categories.find(c => c.id === leaf.parent);
      if (cat) {
        links.push({ source: cat.id, target: leaf.id, color: cat.color, value: 2, isCategoryLink: false });
      }
    });

    return { nodes: allNodes, links };
  }, []);

  // Bulletproof physics engine setup that applies cleanly on mount and fast-refresh
  useEffect(() => {
    if (graphRef.current && !loading) {
      const fg = graphRef.current;
      
      // FORCIBLY STRIP fx/fy FROM ALL NODES to kill dagMode's ghost!
      graphData.nodes.forEach((n: any) => {
         delete n.fx;
         delete n.fy;
      });
      
      // 1. GENTLE repulsion so they don't explode into straight lines (default is -30, we use -150)
      fg.d3Force('charge').strength(-150).distanceMax(800);
      
      // 2. Exact link distances to match the reference image (Root->Cat=250, Cat->Leaf=150)
      fg.d3Force('link').distance((link: any) => link.isCategoryLink ? 250 : 150);
      
      // 3. Precise collision to space out siblings perfectly into a flower-petal arc
      fg.d3Force('collide', forceCollide((node: any) => (node.val || 20) + 15));
      
      // 4. Lock Categories into a perfect 250px circular orbit (exactly like reference image)
      fg.d3Force('radial', forceRadial(250, 0, 0).strength((node: any) => node.type === 'category' ? 0.8 : 0));
      
      // Re-trigger simulation so it expands immediately
      fg.d3ReheatSimulation();
    }
  }, [loading, graphData]);

  if (loading) {
    return (
      <div style={{ padding: '100px', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="pulse" style={{ display: 'inline-block', marginRight: '8px', background: 'var(--blue)' }}></div>
        Mapping Identity Presence...
      </div>
    );
  }

  const paintLink = (link: any, ctx: CanvasRenderingContext2D) => {
    const now = performance.now();
    // Manual Hack to CLEAR the canvas properly before drawing anything on this frame
    // This strictly bypasses the react-force-graph zooming trail bug!
    if (now - lastClearRef.current > 10) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset zoom transform to identity
      ctx.clearRect(0, 0, 99999, 99999);
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 99999, 99999);
      ctx.restore();
      lastClearRef.current = now;
    }

    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.strokeStyle = link.color || 'rgba(255,255,255,0.2)';
    ctx.lineWidth = link.value || 2;
    if (!link.isCategoryLink) {
      ctx.setLineDash([4, 4]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.stroke();
    // Reset dash so it doesn't affect other canvas operations
    ctx.setLineDash([]);
  };

  const paintNode = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isRoot = node.type === 'root';
    const isCategory = node.type === 'category';
    const radius = node.val;

    if (isCategory) {
      const text = node.name;
      const fontSize = 11;
      ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
      const textWidth = ctx.measureText(text).width;
      const bckgDimensions = [textWidth + 24, fontSize + 16];

      ctx.fillStyle = '#0f111a';
      ctx.beginPath();
      ctx.roundRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1], 16);
      ctx.fill();
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = node.color;
      ctx.fillText(text, node.x, node.y);
      return;
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#0f111a';
    ctx.fill();
    ctx.lineWidth = isRoot ? 4 : 2;
    ctx.strokeStyle = node.color || '#fff';
    
    ctx.shadowColor = node.color || '#fff';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (node.img && node.img.complete && node.img.naturalHeight !== 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius - 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      
      const imgSize = radius * 2;
      ctx.drawImage(node.img, node.x - imgSize/2, node.y - imgSize/2, imgSize, imgSize);
      ctx.restore();
    } else {
      ctx.font = `bold ${radius}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = node.color || '#fff';
      ctx.fillText(node.name.charAt(0), node.x, node.y);
    }

    const label = node.name;
    const fontSize = isRoot ? 16 : 14;
    ctx.font = `${isRoot ? 'bold' : 'normal'} ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff';
    // Add text shadow for readability
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText(label, node.x, node.y + radius + 12);
    ctx.shadowBlur = 0;

    if (isRoot && node.subname) {
      ctx.font = `12px Inter, system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(node.subname, node.x, node.y + radius + 32);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', color: 'var(--fg)', fontFamily: 'system-ui, -apple-system, sans-serif', height: 'calc(100vh - 80px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Network size={24} style={{ color: 'var(--blue)' }} />
            Identity Presence Map
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: '8px', fontSize: '14px' }}>
            A complete topological graph of your digital twin across Web2 and Web3.
          </p>
        </div>
      </div>

      <div style={{ position: 'relative', display: 'flex', gap: '20px', height: 'calc(100% - 80px)' }}>
        <div style={{ flex: 1, position: 'relative', background: '#09090b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 20, left: 20, color: 'var(--muted)', fontSize: '12px', display: 'flex', gap: '16px', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7B61FF' }}></div> Web3 Wallets</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div> Connected DApps</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3AA0FF' }}></div> Web2 Accounts</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div> Credentials</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></div> Threats / Alerts</div>
          </div>

          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            backgroundColor="rgba(9,9,11,0)"
            nodeCanvasObject={paintNode}
            linkCanvasObject={paintLink}
            nodePointerAreaPaint={(node, color, ctx) => {
              ctx.fillStyle = color;
              const r = node.type === 'category' ? 40 : (node.val as number);
              ctx.beginPath();
              ctx.arc(node.x as number, node.y as number, r, 0, 2 * Math.PI, false);
              ctx.fill();
            }}
            enableNodeDrag={true}
            enableZoomInteraction={true}
            cooldownTicks={200}
            onEngineStop={() => {
              if (graphRef.current) graphRef.current.zoomToFit(400, 100);
            }}
          />
        </div>

        <div style={{ width: '320px', background: '#0f111a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '30px', overflowY: 'auto' }}>
          <div>
            <h3 style={{ fontSize: '14px', color: '#fff', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              Identity Node
              <span style={{ color: 'var(--muted)', cursor: 'pointer' }}>«</span>
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid #7B61FF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src="/avatar.jpeg" alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#fff' }}>Sharvan Koul</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>DID: MetaGo...E71a</div>
                <div style={{ fontSize: '10px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px', display: 'inline-block', marginTop: '4px' }}>Verified Identity</div>
              </div>
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '14px', color: '#fff', marginBottom: '16px' }}>Network Overview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Network size={14}/> Total Connections</span> <span>24</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={14}/> Web3 Wallets</span> <span>4</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Database size={14}/> DApps</span> <span>5</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}><span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Cloud size={14}/> Web2 Accounts</span> <span>5</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
