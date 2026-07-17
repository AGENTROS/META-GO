'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMLoaderPlugin, VRM, VRMUtils } from '@pixiv/three-vrm';
import * as THREE from 'three';

export default function AvatarRig({ 
  url, 
  activeMotion = 'idle' 
}: { 
  url: string; 
  activeMotion?: string;
}) {
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [gltfModel, setGltfModel] = useState<THREE.Group | null>(null);
  const { camera, scene, pointer } = useThree();
  
  // A target object for the avatar to look at
  const lookAtTarget = useRef(new THREE.Object3D());
  const mixer = useRef<THREE.AnimationMixer | null>(null);
  
  // For standard GLB bone guessing
  const gltfBones = useRef<Record<string, THREE.Bone | null>>({
    spine: null, chest: null, head: null, 
    leftUpperArm: null, rightUpperArm: null,
    leftHand: null, rightHand: null,
    leftUpperLeg: null, rightUpperLeg: null,
    hips: null
  });
  const restQuaternions = useRef<Record<string, THREE.Quaternion>>({});
  const baseY = useRef<number>(-1.8);

  useEffect(() => {
    if (!url) return;
    scene.add(lookAtTarget.current);

    const loader = new GLTFLoader();
    
    // Register VRM Plugin
    loader.register((parser) => {
      return new VRMLoaderPlugin(parser);
    });

    loader.load(
      url,
      (gltf) => {
        const vrmData = gltf.userData.vrm;

        if (vrmData) {
          // It's a VRM!
          VRMUtils.removeUnnecessaryVertices(gltf.scene);
          VRMUtils.removeUnnecessaryJoints(gltf.scene);

          vrmData.scene.rotation.y = Math.PI; // Face the camera
          // Ensure VRM is properly scaled and positioned
          vrmData.scene.position.set(0, -1.8, 0);
          vrmData.scene.scale.setScalar(2.2);
          
          if (vrmData.lookAt) {
            vrmData.lookAt.target = lookAtTarget.current;
          }

          setVrm(vrmData);
          setGltfModel(null);
        } else {
          // Standard GLB
          
          // Try to guess bones for standard GLBs
          let foundBones = false;
          gltf.scene.traverse((child: any) => {
            if (child.isBone || child.type === 'Bone' || child.type === 'Object3D' || child.type === 'Mesh') {
              const name = child.name.toLowerCase();
              let key = '';
              if (name.includes('hips') || name.includes('pelvis')) key = 'hips';
              else if (name.includes('chest') || name.includes('spine2') || name.includes('spine_2') || name.includes('spine02')) key = 'chest';
              else if (name.includes('spine') || name.includes('abdomen')) key = 'spine';
              else if (name.includes('head') || name.includes('neck')) key = 'head';
              else if (name.includes('left') && (name.includes('arm') || name.includes('shoulder'))) key = 'leftUpperArm';
              else if (name.includes('right') && (name.includes('arm') || name.includes('shoulder'))) key = 'rightUpperArm';
              else if (name.includes('left') && name.includes('leg') && !name.includes('lower') && !name.includes('calf')) key = 'leftUpperLeg';
              else if (name.includes('right') && name.includes('leg') && !name.includes('lower') && !name.includes('calf')) key = 'rightUpperLeg';
              
              if (key && !gltfBones.current[key]) { // Only save the first match to avoid hands/fingers overriding arms
                gltfBones.current[key] = child;
                restQuaternions.current[key] = child.quaternion.clone();
                foundBones = true;
              }
            }
          });

          // Center and scale the model automatically
          const box = new THREE.Box3().setFromObject(gltf.scene);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          
          // Normalize scale to be roughly 5.0 units tall (much larger)
          const maxDim = Math.max(size.x, size.y, size.z);
          if (maxDim > 0) {
            const scale = 5.0 / maxDim;
            gltf.scene.scale.setScalar(scale);
          }
          
          // Center it
          gltf.scene.position.x = -center.x * gltf.scene.scale.x;
          baseY.current = -box.min.y * gltf.scene.scale.y - 1.8;
          gltf.scene.position.y = baseY.current; // Base exactly at Y=-1.8
          gltf.scene.position.z = -center.z * gltf.scene.scale.z;
          
          // Face camera
          gltf.scene.rotation.y = Math.PI;

          setGltfModel(gltf.scene);
          setVrm(null);
          
          if (!foundBones && gltf.animations && gltf.animations.length > 0) {
            mixer.current = new THREE.AnimationMixer(gltf.scene);
            const action = mixer.current.clipAction(gltf.animations[0]);
            action.play();
          }
        }
      },
      (progress) => console.log('Loading model...', 100.0 * (progress.loaded / progress.total), '%'),
      (error) => console.error(error)
    );

    return () => {
      if (vrm) {
        VRMUtils.deepDispose(vrm.scene);
      } else if (gltfModel) {
        VRMUtils.deepDispose(gltfModel);
      }
      scene.remove(lookAtTarget.current);
    };
  }, [url]);

  useFrame((state, delta) => {
    // 1. Update LookAt Target based on mouse
    // Map normalized pointer (-1 to 1) to a 3D coordinate in front of the avatar
    lookAtTarget.current.position.x = pointer.x * 2;
    lookAtTarget.current.position.y = pointer.y * 2 + 1.5; // Roughly head height
    lookAtTarget.current.position.z = 2; // In front

    // 2. Procedural Animation for VRM
    if (vrm) {
      const time = state.clock.elapsedTime;
      const h = vrm.humanoid;

      // Reset base posture smoothly (we do this to allow transitions, but for now we set absolute)
      const spine = h.getNormalizedBoneNode('spine');
      const chest = h.getNormalizedBoneNode('chest');
      const head = h.getNormalizedBoneNode('head');
      const leftArm = h.getNormalizedBoneNode('leftUpperArm');
      const rightArm = h.getNormalizedBoneNode('rightUpperArm');
      const leftHand = h.getNormalizedBoneNode('leftHand');
      const rightHand = h.getNormalizedBoneNode('rightHand');
      const leftLeg = h.getNormalizedBoneNode('leftUpperLeg');
      const rightLeg = h.getNormalizedBoneNode('rightUpperLeg');
      const hips = h.getNormalizedBoneNode('hips');

      // Default A-Pose / Idle breathing
      if (activeMotion === 'idle') {
        if (chest) chest.rotation.x = Math.sin(time * 2) * 0.02;
        if (spine) spine.rotation.y = Math.sin(time * 0.5) * 0.05;
        if (leftArm) leftArm.rotation.z = 1.2;
        if (rightArm) rightArm.rotation.z = -1.2;
        
        // Random blinking
        if (vrm.expressionManager) {
          const blinkValue = Math.sin(time * 3) > 0.95 ? 1 : 0;
          vrm.expressionManager.setValue('blink', blinkValue);
        }
      } 
      else if (activeMotion === 'walk') {
        if (hips) hips.position.y = Math.abs(Math.sin(time * 5)) * 0.05;
        if (chest) chest.rotation.y = Math.sin(time * 5) * 0.1;
        if (leftArm) leftArm.rotation.x = Math.sin(time * 5) * 0.5;
        if (leftArm) leftArm.rotation.z = 1.2;
        if (rightArm) rightArm.rotation.x = -Math.sin(time * 5) * 0.5;
        if (rightArm) rightArm.rotation.z = -1.2;
        if (leftLeg) leftLeg.rotation.x = -Math.sin(time * 5) * 0.5;
        if (rightLeg) rightLeg.rotation.x = Math.sin(time * 5) * 0.5;
      }
      else if (activeMotion === 'wave') {
        if (leftArm) {
          leftArm.rotation.z = 1.5;
          leftArm.rotation.x = 0;
        }
        if (rightArm) {
          rightArm.rotation.z = -2.5 + Math.sin(time * 10) * 0.5; // waving hand high
          rightArm.rotation.x = 0;
        }
        if (chest) chest.rotation.y = 0.2;
      }
      else if (activeMotion === 'dance') {
        if (hips) {
          hips.position.y = Math.abs(Math.sin(time * 4)) * 0.1;
          hips.rotation.y = Math.sin(time * 2) * 0.5;
        }
        if (chest) chest.rotation.y = Math.sin(time * 4) * 0.2;
        if (leftArm) leftArm.rotation.z = 2.0 + Math.sin(time * 4) * 0.5;
        if (rightArm) rightArm.rotation.z = -2.0 - Math.sin(time * 4) * 0.5;
        if (head) head.rotation.z = Math.sin(time * 4) * 0.1;
      }
      else if (activeMotion === 'inspect') {
        if (spine) spine.rotation.x = 0.2;
        if (head) head.rotation.x = -0.1;
        if (leftArm) leftArm.rotation.z = 1.0;
        if (rightArm) rightArm.rotation.z = -1.0;
        
        // Squint slightly
        if (vrm.expressionManager) {
          vrm.expressionManager.setValue('happy', Math.abs(Math.sin(time)));
        }
      }

      // Update VRM (this processes SpringBones, Expressions, and LookAt)
      vrm.update(delta);
    } 
    
    // Procedural Animation for Standard GLB
    else if (gltfModel) {
      const time = state.clock.elapsedTime;
      const b = gltfBones.current;
      const rq = restQuaternions.current;
      
      const applyOffset = (boneKey: string, xOff: number, yOff: number, zOff: number) => {
        const bone = b[boneKey];
        const restQ = rq[boneKey];
        if (bone && restQ) {
          const offsetQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(xOff, yOff, zOff));
          bone.quaternion.copy(restQ).multiply(offsetQ);
        }
      };

      if (activeMotion === 'idle') {
        applyOffset('chest', Math.sin(time * 2) * 0.1, 0, 0); // Exaggerated breathing
        applyOffset('spine', 0, Math.sin(time * 0.5) * 0.1, 0);
        applyOffset('head', Math.sin(time * 1.5) * 0.1, 0, 0);
        applyOffset('leftUpperArm', 0, 0, Math.sin(time * 2) * 0.1);
        applyOffset('rightUpperArm', 0, 0, -Math.sin(time * 2) * 0.1);
        gltfModel.position.y = baseY.current;
      }
      else if (activeMotion === 'dance') {
        gltfModel.position.y = baseY.current + Math.abs(Math.sin(time * 6)) * 0.3; // BIG jumps
        applyOffset('hips', 0, Math.sin(time * 3) * 0.5, 0);
        applyOffset('chest', Math.sin(time * 6) * 0.4, 0, Math.sin(time * 3) * 0.4);
        applyOffset('head', 0, 0, Math.sin(time * 3) * 0.4);
        applyOffset('leftUpperArm', Math.sin(time * 6) * 1.0, 0, 1.0 + Math.sin(time * 3) * 0.8); // Wild arms
        applyOffset('rightUpperArm', -Math.sin(time * 6) * 1.0, 0, -1.0 - Math.sin(time * 3) * 0.8);
        applyOffset('leftUpperLeg', -0.5 + Math.sin(time * 6) * 0.5, 0, 0);
        applyOffset('rightUpperLeg', -0.5 - Math.sin(time * 6) * 0.5, 0, 0);
      }
      else if (activeMotion === 'walk') {
        gltfModel.position.y = baseY.current + Math.abs(Math.sin(time * 8)) * 0.1;
        applyOffset('leftUpperArm', Math.sin(time * 8) * 1.2, 0, 0.2); // Big arm swing
        applyOffset('rightUpperArm', -Math.sin(time * 8) * 1.2, 0, -0.2);
        applyOffset('leftUpperLeg', -Math.sin(time * 8) * 1.0, 0, 0); // Big leg swing
        applyOffset('rightUpperLeg', Math.sin(time * 8) * 1.0, 0, 0);
        applyOffset('chest', 0, Math.sin(time * 8) * 0.2, 0);
      }
      else if (activeMotion === 'wave') {
        applyOffset('leftUpperArm', 0, 0, 0.3);
        applyOffset('rightUpperArm', 0, 0, -2.5 + Math.sin(time * 15) * 0.8); // Crazy fast wave
        applyOffset('head', 0, Math.sin(time * 2) * 0.3, 0);
        gltfModel.position.y = baseY.current;
      }
      else if (activeMotion === 'inspect') {
        applyOffset('spine', 0.4, 0, 0); // Deep lean
        applyOffset('head', -0.2, 0, 0);
        applyOffset('leftUpperArm', 0, 0, 0.5);
        applyOffset('rightUpperArm', 0, 0, -0.5);
        gltfModel.position.y = baseY.current;
      }
    }
    
    // 3. Update Standard GLTF Animation Mixer
    if (mixer.current) {
      mixer.current.update(delta);
    }
  });

  // The 3D Stage Platform
  const Stage = () => (
    <group position={[0, -1.85, 0]}>
      {/* Core glowing disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 64]} />
        <meshBasicMaterial color="#4F46E5" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* Outer ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.55, 64]} />
        <meshBasicMaterial color="#22D3EE" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Soft large glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <circleGeometry args={[2.5, 64]} />
        <meshBasicMaterial color="#4F46E5" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );

  return (
    <>
      <Stage />
      {vrm ? <primitive object={vrm.scene} /> : null}
      {gltfModel ? <primitive object={gltfModel} /> : null}
    </>
  );
}
