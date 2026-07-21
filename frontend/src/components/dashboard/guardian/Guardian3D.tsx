import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Sphere, Box, Cylinder, RoundedBox } from '@react-three/drei';
import { GuardianState } from './GuardianTTSProvider';
import * as THREE from 'three';

// --------------------------------------------------------------------
// Fallback Procedural Guardian
// --------------------------------------------------------------------
function Guardian3DFallback({ state, audioLevel }: { state: GuardianState, audioLevel: number }) {
  const group = useRef<THREE.Group>(null);
  const head = useRef<THREE.Mesh>(null);
  const coreLight = useRef<THREE.PointLight>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const visor = useRef<THREE.Mesh>(null);
  const leftEar = useRef<THREE.Mesh>(null);
  const rightEar = useRef<THREE.Mesh>(null);

  useFrame((stateObj, delta) => {
    if (!group.current || !head.current || !visor.current || !leftEar.current || !rightEar.current) return;

    const time = stateObj.clock.elapsedTime;
    
    // Base Idle animation (slow floating)
    group.current.position.y = Math.sin(time * 2) * 0.1;
    head.current.rotation.y = Math.sin(time * 0.5) * 0.2;

    // React to Audio Level
    const pulse = 1 + audioLevel * 0.5;
    if (coreLight.current) {
      coreLight.current.intensity = 2 + audioLevel * 8;
    }
    
    // Voice mouth animation
    if (state === 'speaking' && mouth.current) {
      mouth.current.scale.set(1 + audioLevel * 3, 1 + audioLevel * 6, 1);
    } else if (mouth.current) {
      mouth.current.scale.set(1, 0.1, 1);
    }

    // State Colors
    let targetColor = new THREE.Color(0x00aaff); // Idle (Blue/Cyan)
    if (state === 'listening') {
      targetColor = new THREE.Color(0x00ffff);
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, 0.2, 0.1);
    } else if (state === 'processing') {
      targetColor = new THREE.Color(0x9933ff);
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, -0.1, 0.1);
      head.current.rotation.y = time * 2;
    } else if (state === 'speaking') {
      targetColor = new THREE.Color(0x00ffaa);
    } else if (state === 'alert') {
      targetColor = new THREE.Color(0xff3333);
      head.current.rotation.y = Math.sin(time * 10) * 0.2;
    } else {
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, 0, 0.1);
    }

    // Apply colors smoothly
    if (coreLight.current) coreLight.current.color.lerp(targetColor, 0.1);
    (visor.current.material as THREE.MeshStandardMaterial).emissive.lerp(targetColor, 0.1);
    (leftEar.current.material as THREE.MeshStandardMaterial).emissive.lerp(targetColor, 0.1);
    (rightEar.current.material as THREE.MeshStandardMaterial).emissive.lerp(targetColor, 0.1);
    (mouth.current.material as THREE.MeshBasicMaterial).color.lerp(targetColor, 0.1);
    
    // Pulse ears
    leftEar.current.scale.set(1, pulse, pulse);
    rightEar.current.scale.set(1, pulse, pulse);
  });

  return (
    <group ref={group} scale={1.2} position={[0, -0.5, 0]}>
      {/* Holographic Base Grid */}
      <Sphere args={[1.5, 32, 32]} position={[0, -2.5, 0]} scale={[1, 0.05, 1]}>
        <meshStandardMaterial color="#00ffff" transparent opacity={0.15} wireframe />
      </Sphere>

      {/* Floating Neck/Core */}
      <Cylinder args={[0.2, 0.2, 0.5, 16]} position={[0, -0.8, 0]}>
         <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
      </Cylinder>
      <Sphere args={[0.3, 16, 16]} position={[0, -0.8, 0]}>
        <meshBasicMaterial color="#00aaff" transparent opacity={0.5} />
      </Sphere>
      <pointLight ref={coreLight} position={[0, -0.8, 0.5]} distance={5} intensity={2} color="#00aaff" />

      {/* Head Group */}
      <group ref={head} position={[0, 0.2, 0]}>
        {/* Main Head Dome */}
        <RoundedBox args={[1.4, 1.2, 1.4]} radius={0.3} smoothness={4}>
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
        </RoundedBox>
        
        {/* Visor Screen */}
        <Box ref={visor} args={[1.2, 0.5, 0.1]} position={[0, 0.2, 0.72]}>
          <meshStandardMaterial color="#000" emissive="#00aaff" emissiveIntensity={0.2} metalness={1} roughness={0} />
        </Box>

        {/* Digital Eyes */}
        <Sphere args={[0.1, 16, 16]} position={[-0.3, 0.2, 0.75]} scale={[1, 0.5, 0.1]}>
          <meshBasicMaterial color="#ffffff" />
        </Sphere>
        <Sphere args={[0.1, 16, 16]} position={[0.3, 0.2, 0.75]} scale={[1, 0.5, 0.1]}>
          <meshBasicMaterial color="#ffffff" />
        </Sphere>

        {/* Audio Reactive Mouth */}
        <Box ref={mouth} args={[0.4, 0.02, 0.05]} position={[0, -0.25, 0.72]}>
          <meshBasicMaterial color="#00aaff" />
        </Box>

        {/* Ear Modules (Sensors) */}
        <Cylinder ref={leftEar} args={[0.2, 0.2, 0.2, 16]} position={[-0.8, 0, 0]} rotation={[0, 0, Math.PI/2]}>
          <meshStandardMaterial color="#111" emissive="#00aaff" emissiveIntensity={0.5} />
        </Cylinder>
        <Cylinder ref={rightEar} args={[0.2, 0.2, 0.2, 16]} position={[0.8, 0, 0]} rotation={[0, 0, Math.PI/2]}>
          <meshStandardMaterial color="#111" emissive="#00aaff" emissiveIntensity={0.5} />
        </Cylinder>
        
        {/* Antenna */}
        <Cylinder args={[0.02, 0.02, 0.4, 8]} position={[0, 0.8, -0.2]}>
          <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
        </Cylinder>
        <Sphere args={[0.06, 16, 16]} position={[0, 1.0, -0.2]}>
          <meshBasicMaterial color="#ff3333" />
        </Sphere>
      </group>
    </group>
  );
}

// --------------------------------------------------------------------
// Real Model (if GLB exists)
// --------------------------------------------------------------------
function GuardianModel({ state, audioLevel, url }: { state: GuardianState, audioLevel: number, url: string }) {
  const { scene, animations } = useGLTF(url);
  // Real implementation would use AnimationMixer here based on state
  // Since we don't know the node structure, we'll just render it for now
  return <primitive object={scene} scale={2} position={[0, -1, 0]} />;
}

// --------------------------------------------------------------------
// Main 3D Wrapper Component
// --------------------------------------------------------------------
export default function Guardian3D({ state, audioLevel, isDashboardCard = false }: { state: GuardianState, audioLevel: number, isDashboardCard?: boolean }) {
  const [modelExists, setModelExists] = useState(false);

  // In a real scenario we'd check if /models/metago-guardian.glb exists, but for now we default to fallback
  
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, isDashboardCard ? 6 : 4], fov: 45 }}
        dpr={[1, 1.5]}
        frameloop={isDashboardCard ? "demand" : "always"}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
        <directionalLight position={[-10, 10, -10]} intensity={2} color="#7c3aed" />
        
        {modelExists ? (
          <GuardianModel state={state} audioLevel={audioLevel} url="/models/metago-guardian.glb" />
        ) : (
          <Guardian3DFallback state={state} audioLevel={audioLevel} />
        )}
        
        <OrbitControls enableZoom={!isDashboardCard} enablePan={false} maxPolarAngle={Math.PI / 2 + 0.1} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
