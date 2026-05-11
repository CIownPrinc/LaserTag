/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore, PowerUpData } from '../store';
import { soundManager } from '../services/soundService';

interface PowerUpProps {
  data: PowerUpData;
}

const TYPE_COLORS = {
  speed: '#ffff00',
  shield: '#00ccff',
  rapidfire: '#ff00ff',
  health: '#00ff00'
};

const TYPE_LABELS = {
  speed: 'SPD',
  shield: 'SHD',
  rapidfire: 'ATK',
  health: 'MED'
};

export function PowerUp({ data }: PowerUpProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const collectPowerUp = useGameStore(state => state.collectPowerUp);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02;
    }
    if (glowRef.current && glowRef.current.material) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
      glowRef.current.scale.setScalar(pulse);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = 0.2 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      }
    }
  });

  return (
    <group position={data.position}>
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <RigidBody
          type="fixed"
          colliders={false}
          sensor
          onIntersectionEnter={(payload) => {
            const rb = payload.other.rigidBody;
            const userData = rb?.userData as any;
            const name = userData?.name || payload.other.rigidBodyObject?.userData?.name;
            
            if (name === 'player') {
              soundManager.playPowerup(data.position, [camera.position.x, camera.position.y, camera.position.z]);
              collectPowerUp(data.id);
            }
          }}
        >
          {/* Main Gem */}
          <mesh ref={meshRef}>
            <octahedronGeometry args={[0.5, 0]} />
            <meshStandardMaterial
              color={TYPE_COLORS[data.type]}
              emissive={TYPE_COLORS[data.type]}
              emissiveIntensity={4}
              metalness={0.9}
              roughness={0.1}
              transparent
              opacity={0.9}
            />
          </mesh>
          
          {/* Pulsing Outer Glow */}
          <mesh ref={glowRef} scale={[1.2, 1.2, 1.2]}>
            <octahedronGeometry args={[0.6, 0]} />
            <meshBasicMaterial 
              color={TYPE_COLORS[data.type]} 
              transparent 
              opacity={0.3} 
              toneMapped={false} 
            />
          </mesh>

          {/* Dynamic Light */}
          <pointLight color={TYPE_COLORS[data.type]} intensity={5} distance={5} />

          <CuboidCollider args={[0.6, 0.6, 0.6]} />
          
          <Text
            position={[0, 0.8, 0]}
            fontSize={0.3}
            color={TYPE_COLORS[data.type]}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {TYPE_LABELS[data.type]}
          </Text>
        </RigidBody>
      </Float>
      
      {/* Ground Glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.45, 0]}>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial
          color={TYPE_COLORS[data.type]}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
