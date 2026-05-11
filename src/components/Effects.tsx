/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store';
import * as THREE from 'three';
import { useRef, useMemo, useEffect } from 'react';

const MAX_PARTICLES = 1000;

export function Effects() {
  const lasers = useGameStore(state => state.lasers);
  const particles = useGameStore(state => state.particles);
  const activePowerUps = useGameStore(state => state.activePowerUps);
  const now = Date.now();

  return (
    <>
      {lasers.map(laser => (
        <Laser key={laser.id} start={laser.start} end={laser.end} color={laser.color} />
      ))}
      <ParticleSystem particles={particles} />
      {activePowerUps.shield > now && <ShieldEffect />}
    </>
  );
}

function ParticleSystem({ particles }: { particles: any[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    let i = 0;
    particles.forEach((p, idx) => {
      const age = (state.clock.elapsedTime * 1000 - p.timestamp % 1000000000) / 800; // Normalized age 0-1
      if (age > 1) return;

      const scale = Math.max(0, 0.2 * (1 - age));
      tempObject.position.set(...p.position as [number, number, number]);
      // Simple physics simulation for instances
      tempObject.position.y += Math.sin(age * Math.PI) * 2;
      tempObject.scale.set(scale, scale, scale);
      tempObject.updateMatrix();
      meshRef.current?.setMatrixAt(i++, tempObject.matrix);
    });

    meshRef.current.count = i;
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#00ffff" toneMapped={false} transparent opacity={0.6} />
    </instancedMesh>
  );
}

function Laser({ start, end, color }: { start: [number, number, number], end: [number, number, number], color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  
  const { position, rotation, length } = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const length = s.distanceTo(e);
    const position = s.clone().lerp(e, 0.5);
    
    const direction = e.clone().sub(s).normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      direction
    );
    const rotation = new THREE.Euler().setFromQuaternion(quaternion);
    
    return { position, rotation, length };
  }, [start, end]);

  useFrame((state, delta) => {
    if (ref.current && ref.current.material) {
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, mat.opacity - delta * 3);
      
      // Pulse scale slightly for a more "energetic" look
      const s = 1 + Math.sin(state.clock.elapsedTime * 20) * 0.1;
      ref.current.scale.set(s, s, 1);
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Outer Glow */}
      <mesh scale={[1.5, 1.5, 1]}>
        <boxGeometry args={[0.3, 0.3, length]} />
        <meshBasicMaterial color={color || '#00ffff'} transparent opacity={0.2} toneMapped={false} />
      </mesh>
      {/* Core Beam */}
      <mesh ref={ref}>
        <boxGeometry args={[0.1, 0.1, length]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} transparent opacity={1} />
      </mesh>
    </group>
  );
}

function ShieldEffect() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.copy(state.camera.position);
      meshRef.current.rotation.y += 0.02;
      meshRef.current.rotation.z += 0.02;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 16, 16]} />
      <meshBasicMaterial 
        color="#00ccff" 
        transparent 
        opacity={0.15} 
        wireframe 
        toneMapped={false}
      />
    </mesh>
  );
}
