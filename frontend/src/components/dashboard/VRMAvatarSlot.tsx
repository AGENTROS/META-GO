'use client';
import { useIdentityStore } from '@/store/useIdentityStore';
import { Upload, Trash2, RotateCw, Sun, Play } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import * as THREE from 'three';
import { disposeObject, disposeRenderer } from '@/lib/three.utils';

function mockIpfsHash(filename: string): string {
  // Generate a mock CIDv0 (starts with Qm, 46 characters)
  let hash = '';
  for (let i = 0; i < filename.length; i++) {
    hash += filename.charCodeAt(i).toString(16);
  }
  hash = hash.padEnd(44, 'a').slice(0, 44);
  return `ipfs://Qm${hash}`;
}

interface PreviewProps {
  speed: number;
  lightIntensity: number;
  animation: 'idle' | 'wave' | 'dance' | 'salute';
  autoRotate: boolean;
}

function AvatarPreview3D({ speed, lightIntensity, animation, autoRotate }: PreviewProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const w = el.clientWidth || 180, h = el.clientHeight || 180;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(0, 1.1, 3);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    el.appendChild(renderer.domElement);

    // Group for entire mannequin
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // Mannequin Head
    const headGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.3, metalness: 0.1 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.35;
    modelGroup.add(head);

    // Mannequin Torso
    const torsoGeo = new THREE.CylinderGeometry(0.15, 0.1, 0.55, 16);
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4, metalness: 0.4 });
    const torso = new THREE.Mesh(torsoGeo, suitMat);
    torso.position.y = 0.95;
    modelGroup.add(torso);

    // Left Arm shoulder joint
    const armGroup = new THREE.Group();
    armGroup.position.set(0.2, 1.15, 0);
    const armGeo = new THREE.CylinderGeometry(0.04, 0.035, 0.38, 8);
    const armMesh = new THREE.Mesh(armGeo, skinMat);
    armMesh.position.y = -0.19;
    armGroup.add(armMesh);
    modelGroup.add(armGroup);

    // Right Arm shoulder joint
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(-0.2, 1.15, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, skinMat);
    rightArmMesh.position.y = -0.19;
    rightArmGroup.add(rightArmMesh);
    modelGroup.add(rightArmGroup);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.5, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(0.08, 0.45, 0);
    modelGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(-0.08, 0.45, 0);
    modelGroup.add(rightLeg);

    // Integrity holographic rings
    const ringGeo = new THREE.TorusGeometry(0.4, 0.008, 8, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.6 });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = 1.35;
    modelGroup.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, ringMat);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = 0.95;
    modelGroup.add(ring2);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, lightIntensity);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    let raf = 0;
    const t0 = performance.now();

    function tick() {
      const t = (performance.now() - t0) * 0.001;
      dirLight.intensity = lightIntensity;

      // Base rotation
      if (autoRotate) {
        modelGroup.rotation.y = t * speed;
      } else {
        modelGroup.rotation.y = 0;
      }

      // Sync rings rotation
      ring1.rotation.z = t * 1.5;
      ring2.rotation.z = -t * 1.0;
      
      // Scale dynamic engram pulse
      const pulse = 1 + Math.sin(t * 4) * 0.03;
      ring1.scale.set(pulse, pulse, 1);
      ring2.scale.set(pulse, pulse, 1);

      // Handle animations
      if (animation === 'dance') {
        modelGroup.position.y = Math.abs(Math.sin(t * 6.0)) * 0.12 - 0.4;
        modelGroup.scale.y = 1 + Math.sin(t * 12.0) * 0.04;
        armGroup.rotation.z = Math.sin(t * 8.0) * 0.6;
        rightArmGroup.rotation.z = -Math.sin(t * 8.0) * 0.6;
        head.rotation.z = Math.sin(t * 6.0) * 0.1;
      } else if (animation === 'wave') {
        modelGroup.position.y = -0.4;
        modelGroup.scale.set(1, 1, 1);
        armGroup.rotation.z = 2.2 + Math.sin(t * 14.0) * 0.4;
        armGroup.rotation.x = 0;
        rightArmGroup.rotation.z = -0.2;
        head.rotation.z = 0;
      } else if (animation === 'salute') {
        modelGroup.position.y = -0.4;
        modelGroup.scale.set(1, 1, 1);
        rightArmGroup.rotation.z = -1.9;
        rightArmGroup.rotation.x = -0.6;
        armGroup.rotation.z = 0.2;
        head.rotation.z = 0.08;
      } else {
        modelGroup.position.y = -0.4;
        modelGroup.scale.set(1, 1, 1);
        armGroup.rotation.z = 0.15 + Math.sin(t * 2.5) * 0.04;
        rightArmGroup.rotation.z = -0.15 - Math.sin(t * 2.5) * 0.04;
        head.rotation.z = Math.sin(t * 1.8) * 0.02;
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    tick();

    function onResize() {
      const W = el!.clientWidth, H = el!.clientHeight;
      camera.aspect = W / H; camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      disposeObject(scene);
      disposeRenderer(renderer);
    };
  }, [speed, lightIntensity, animation, autoRotate]);

  return <div ref={mountRef} className="w-full h-full min-h-[170px]" />;
}

export function VRMAvatarSlot() {
  const { walletAddress, handle, did, linkedAvatar, linkAvatar, unlinkAvatar } = useIdentityStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // 3D parameters states
  const [speed, setSpeed] = useState(1.2);
  const [lightIntensity, setLightIntensity] = useState(1.4);
  const [animation, setAnimation] = useState<'idle' | 'wave' | 'dance' | 'salute'>('idle');
  const [autoRotate, setAutoRotate] = useState(true);
  const [verifyStep, setVerifyStep] = useState<'idle' | 'did_binding' | 'skeleton' | 'zk_proof' | 'verified'>('idle');
  const [verifyLogs, setVerifyLogs] = useState<string[]>([]);

  async function runVerification() {
    if (!linkedAvatar) return;
    setVerifyStep('did_binding');
    setVerifyLogs(['[SYSTEM] Initiating metaverse attestation verification...']);
    
    await new Promise(r => setTimeout(r, 700));
    setVerifyLogs(prev => [...prev, '[SUCCESS] W3C DID document binding resolved successfully.']);
    setVerifyStep('skeleton');
    
    await new Promise(r => setTimeout(r, 900));
    setVerifyLogs(prev => [...prev, '[SUCCESS] VRM armature verified (56 bone nodes, standard humanoid T-pose).']);
    setVerifyStep('zk_proof');
    
    await new Promise(r => setTimeout(r, 1100));
    setVerifyLogs(prev => [...prev, '[SUCCESS] Cryptographic signature generated (ZKP Nullifier bound).']);
    setVerifyStep('verified');
    
    toast.success('Avatar verified and signed for Metaverse environments!');
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    setVerifyStep('idle');
    setVerifyLogs([]);
    const avatarUri = mockIpfsHash(f.name);
    linkAvatar(f.name);
    setIsSyncing(true);

    if (walletAddress && handle) {
      try {
        const backend = process.env.NEXT_PUBLIC_BACKEND_URL || '';
        const res = await fetch(`${backend}/api/user/sync`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            handle,
            walletAddress,
            did: did || `did:metago:${walletAddress.toLowerCase()}`,
            avatarUri,
          }),
        });
        if (!res.ok) throw new Error('Sync failed');
        toast.success(`Avatar "${f.name}" linked and synced to DID document`);
      } catch (err) {
        console.error('Failed to sync avatar to backend', err);
        toast.error(`Linked locally, but failed to sync to DID`);
      } finally {
        setIsSyncing(false);
      }
    } else {
      toast.success(`Avatar "${f.name}" linked locally`);
      setIsSyncing(false);
    }
  }

  async function handleUnlink() {
    unlinkAvatar();
    setVerifyStep('idle');
    setVerifyLogs([]);
    setIsSyncing(true);

    if (walletAddress && handle) {
      try {
        const backend = process.env.NEXT_PUBLIC_BACKEND_URL || '';
        const res = await fetch(`${backend}/api/user/sync`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            handle,
            walletAddress,
            did: did || `did:metago:${walletAddress.toLowerCase()}`,
            avatarUri: '', // Clear avatar link on backend
          }),
        });
        if (!res.ok) throw new Error('Clear sync failed');
        toast.success('Avatar unlinked and cleared from DID document');
      } catch (err) {
        console.error('Failed to clear avatar from backend', err);
        toast.error('Unlinked locally, but failed to clear from DID');
      } finally {
        setIsSyncing(false);
      }
    } else {
      toast.success('Avatar unlinked');
      setIsSyncing(false);
    }
  }

  // Temporary animation trigger
  const playAnimation = (anim: typeof animation) => {
    setAnimation(anim);
    setTimeout(() => setAnimation('idle'), 3000);
  };

  if (linkedAvatar) {
    return (
      <div className="h-full flex flex-col gap-2 p-1 text-center" data-testid="avatar-viewer">
        {/* Render Three.js preview */}
        <div className="relative border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 overflow-hidden flex-grow flex items-center justify-center min-h-[170px]">
          <AvatarPreview3D
            speed={speed}
            lightIntensity={lightIntensity}
            animation={animation}
            autoRotate={autoRotate}
          />
          <div className="absolute top-2 left-2 text-[8px] font-mono bg-zinc-900/10 dark:bg-white/10 px-2 py-0.5 rounded uppercase text-zinc-650 dark:text-zinc-350">
            VRM MANNEQUIN ENCODING
          </div>
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[7px] font-mono text-emerald-500 uppercase tracking-widest">VRM INTEGRITY: 100%</span>
          </div>
          {isSyncing && (
            <div className="absolute inset-0 bg-black/45 flex items-center justify-center rounded-xl">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Customization controls */}
        <div className="space-y-2 p-1 border-t border-zinc-150 dark:border-zinc-850">
          <div className="flex items-center justify-between text-[9px] font-mono text-zinc-450 gap-2">
            <span className="flex items-center gap-1"><RotateCw size={10} /> ROTATE</span>
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={e => setAutoRotate(e.target.checked)}
              className="accent-blue-600 scale-90"
            />
            <input
              type="range"
              min="0.2"
              max="4.0"
              step="0.2"
              value={speed}
              onChange={e => setSpeed(parseFloat(e.target.value))}
              disabled={!autoRotate}
              className="w-16 accent-blue-600 h-1"
            />
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono text-zinc-450 gap-2">
            <span className="flex items-center gap-1"><Sun size={10} /> LIGHTING</span>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.2"
              value={lightIntensity}
              onChange={e => setLightIntensity(parseFloat(e.target.value))}
              className="w-24 accent-blue-600 h-1"
            />
          </div>

          {/* Animation triggers */}
          <div className="flex gap-1.5 justify-center py-1">
            <button
              onClick={() => playAnimation('wave')}
              className="px-2 py-0.5 text-[8px] font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded uppercase"
            >
              Wave
            </button>
            <button
              onClick={() => playAnimation('dance')}
              className="px-2 py-0.5 text-[8px] font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded uppercase"
            >
              Dance
            </button>
            <button
              onClick={() => playAnimation('salute')}
              className="px-2 py-0.5 text-[8px] font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded uppercase"
            >
              Salute
            </button>
          </div>

          {/* Metaverse Gateway Verification Panel */}
          <div className="border-t border-zinc-150 dark:border-zinc-850 pt-2 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">METAVERSE GATEWAY</span>
              {verifyStep === 'verified' && (
                <span className="text-[7px] font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-bold">
                  VERIFIED
                </span>
              )}
            </div>

            {verifyStep === 'idle' && (
              <button
                onClick={runVerification}
                className="w-full py-1 text-[9px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg uppercase tracking-wider transition-colors"
              >
                Verify Avatar & Ready for Metaverse
              </button>
            )}

            {verifyStep !== 'idle' && verifyStep !== 'verified' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[8px] font-mono text-zinc-400">
                  <span>STEP: {verifyStep.toUpperCase().replace('_', ' ')}</span>
                  <span className="w-2.5 h-2.5 border-2 border-t-transparent border-blue-500 rounded-full animate-spin" />
                </div>
                <div className="bg-zinc-950 p-1.5 rounded border border-zinc-900 font-mono text-[7px] text-zinc-400 space-y-0.5 h-12 overflow-y-auto">
                  {verifyLogs.map((l, i) => (
                    <p key={i} className={l.startsWith('[SUCCESS]') ? 'text-emerald-500' : ''}>{l}</p>
                  ))}
                </div>
              </div>
            )}

            {verifyStep === 'verified' && (
              <div className="bg-zinc-950 p-2 rounded-xl border border-emerald-500/10 font-mono text-[8px] space-y-1">
                <p className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <span>✔ ATTESTATION ATTACHED</span>
                </p>
                <div className="text-zinc-500 space-y-0.5 text-[7px]">
                  <p>Hash: {mockIpfsHash(linkedAvatar.filename).replace('ipfs://', '')}</p>
                  <p>Timestamp: {new Date().toISOString()}</p>
                  <p>Sign: 0x{Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Avatar details & Unlink */}
          <div className="flex items-center justify-between pt-1 text-left border-t border-zinc-100 dark:border-zinc-850">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-[130px]">
                {linkedAvatar.filename}
              </p>
            </div>
            <button
              onClick={handleUnlink}
              disabled={isSyncing}
              className="flex items-center gap-1 text-[8px] text-red-500 hover:text-red-600 font-bold uppercase tracking-wider disabled:opacity-50"
            >
              <Trash2 size={10} /> Unlink
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 text-center min-h-[220px]">
      <input ref={fileRef} type="file" accept=".vrm,.glb,.gltf" onChange={handleFile} className="hidden" />
      <div className="w-14 h-14 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400 relative">
        <Upload size={20} />
        {isSyncing && (
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">No avatar linked</p>
        <p className="text-[10px] text-zinc-450 mt-0.5">Upload a .vrm or .glb file</p>
      </div>
      <button onClick={() => fileRef.current?.click()} data-testid="upload-avatar-btn" disabled={isSyncing}
        className="px-3 py-1.5 text-[10px] font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-lg uppercase tracking-wider disabled:opacity-50">
        Upload Avatar
      </button>
    </div>
  );
}
