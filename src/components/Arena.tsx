/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { RigidBody } from '@react-three/rapier';
import { Grid, Stars } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../store';
import { soundManager } from '../services/soundService';

// Seeded PRNG for consistent multiplayer obstacle generation
function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export function Arena() {
  const isMobile = useGameStore(state => state.isMobile);
  
  const obstacles = useMemo(() => {
    const count = isMobile ? 40 : 100;
    const rngLocal = mulberry32(12345);
    return Array.from({ length: count }).map(() => {
      const x = (rngLocal() - 0.5) * 160;
      const z = (rngLocal() - 0.5) * 160;
      
      if (Math.abs(x) < 25 && Math.abs(z) < 25) return null;

      const height = rngLocal() * 10 + 4;
      const isHorizontal = rngLocal() > 0.5;
      const width = isHorizontal ? rngLocal() * 20 + 8 : rngLocal() * 3 + 1;
      const depth = isHorizontal ? rngLocal() * 3 + 1 : rngLocal() * 20 + 8;
      const color = rngLocal() > 0.5 ? "#00ffff" : "#ff00ff";

      return { type: 'box', position: [x, height / 2 - 0.5, z], size: [width, height, depth], rotation: [0, 0, 0], color };
    }).filter(Boolean);
  }, [isMobile]);

  return (
    <group>
      {/* Floor */}
      <RigidBody type="fixed" name="floor" friction={0}>
        <mesh receiveShadow={!isMobile} position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#050510" roughness={0.2} metalness={0.8} />
        </mesh>
      </RigidBody>
      <Grid 
        position={[0, -0.49, 0]} 
        args={[200, 200]} 
        cellColor="#333" 
        sectionColor="#00ffff" 
        fadeDistance={80} 
        cellThickness={0.5} 
        sectionThickness={1.5} 
        infiniteGrid
      />

      {/* Ceiling */}
      <RigidBody type="fixed" name="ceiling">
        <mesh position={[0, 25, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#000" roughness={1} />
        </mesh>
      </RigidBody>

      {/* Atmosphere */}
      {!isMobile && (
        <>
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={1} fade speed={1} />
          <AmbientParticles />
        </>
      )}

      {/* Walls */}
      <Wall name="wall-n" position={[0, 5, -100]} rotation={[0, 0, 0]} isMobile={isMobile} />
      <Wall name="wall-s" position={[0, 5, 100]} rotation={[0, Math.PI, 0]} isMobile={isMobile} />
      <Wall name="wall-e" position={[100, 5, 0]} rotation={[0, -Math.PI / 2, 0]} isMobile={isMobile} />
      <Wall name="wall-w" position={[-100, 5, 0]} rotation={[0, Math.PI / 2, 0]} isMobile={isMobile} />
      
      {/* Vertical Platforms */}
      <FloatingPlatforms isMobile={isMobile} />

      {/* Jump Pads */}
      <JumpPads isMobile={isMobile} />

      {/* Neural Core Centerpiece */}
      <NeuralCore isMobile={isMobile} />

      {/* Dynamic Laser Hazards */}
      {!isMobile && (
        <>
          <MovingHazard axis="x" range={60} speed={0.5} position={[0, 0, 40]} color="#ff00ff" />
          <MovingHazard axis="x" range={60} speed={0.4} position={[0, 0, -40]} color="#ff00ff" />
          <MovingHazard axis="z" range={60} speed={0.3} position={[40, 0, 0]} color="#00ffff" />
          <MovingHazard axis="z" range={60} speed={0.6} position={[-40, 0, 0]} color="#00ffff" />
        </>
      )}

      {/* Obstacles */}
      {obstacles.map((obs, i) => {
        if (!obs) return null;
        return (
          <RigidBody 
            key={i} 
            type="fixed" 
            colliders={obs.type === 'box' ? "cuboid" : "hull"}
            name={`obstacle-${i}`}
            position={obs.position as [number, number, number]}
            rotation={obs.rotation as [number, number, number]}
          >
            <mesh receiveShadow={!isMobile} castShadow={!isMobile}>
              {obs.type === 'box' ? (
                <boxGeometry args={obs.size as [number, number, number]} />
              ) : (
                <cylinderGeometry args={[obs.size[0]/2, obs.size[0]/2, obs.size[1], 16]} />
              )}
              <meshStandardMaterial color="#1a1a2e" roughness={0.6} metalness={0.5} />
              
              {/* Neon accent on obstacles */}
              <mesh position={[0, obs.size[1]/2 - 0.5, 0]}>
                {obs.type === 'box' ? (
                  <boxGeometry args={[obs.size[0] + 0.1, 0.2, obs.size[2] + 0.1]} />
                ) : (
                  <cylinderGeometry args={[obs.size[0]/2 + 0.1, obs.size[0]/2 + 0.1, 0.2, 16]} />
                )}
                <meshBasicMaterial color={obs.color} toneMapped={false} />
              </mesh>
            </mesh>
          </RigidBody>
        );
      })}
    </group>
  );
}

function Wall({ name, position, rotation, isMobile }: { name: string, position: [number, number, number], rotation: [number, number, number], isMobile: boolean }) {
  return (
    <RigidBody type="fixed" name={name} position={position} rotation={rotation}>
      {/* Solid Wall */}
      <mesh>
        <boxGeometry args={[200, 20, 1]} />
        <meshStandardMaterial color="#0a0a1a" roughness={0.8} metalness={0.2} />
      </mesh>
      {/* Glowing Bottom Line */}
      <mesh position={[0, -9.5, 0.51]}>
        <planeGeometry args={[200, 0.5]} />
        <meshBasicMaterial color="cyan" toneMapped={false} />
      </mesh>
    </RigidBody>
  );
}

function JumpPads({ isMobile }: { isMobile: boolean }) {
  const pads = useMemo(() => [
    { position: [30, 0, 30] as [number, number, number] },
    { position: [-30, 0, -30] as [number, number, number] },
    { position: [30, 0, -30] as [number, number, number] },
    { position: [-30, 0, 30] as [number, number, number] },
  ], []);

  return (
    <>
      {pads.map((p, i) => (
        <JumpPad key={i} position={p.position} />
      ))}
    </>
  );
}

function JumpPad({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 10) * 0.1);
    }
  });

  return (
    <RigidBody 
      type="fixed" 
      sensor 
      position={position}
      onIntersectionEnter={({ other }) => {
        if (other.rigidBodyObject?.name === 'player') {
          other.rigidBody?.applyImpulse({ x: 0, y: 15, z: 0 }, true);
          soundManager.playJump();
        }
      }}
    >
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[2, 32]} />
        <meshBasicMaterial color="#00ffff" toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[2.1, 2.5, 32]} />
        <meshBasicMaterial color="#ff00ff" toneMapped={false} />
      </mesh>
    </RigidBody>
  );
}

function AmbientParticles() {
  const count = 1500;
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const [positions, sizes] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
      sizes[i] = Math.random() * 0.8 + 0.4; // Smaller particles
    }
    return [positions, sizes];
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#ffffff') } // White color
  }), []);

  useFrame((state) => {
    if (materialRef.current && materialRef.current.uniforms) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`
          uniform float uTime;
          attribute float aSize;
          varying float vPointOpacity;
          void main() {
            vec3 pos = position;
            // Slow upward drift and wobble
            pos.y += uTime * 0.5;
            pos.x += sin(uTime * 0.2 + pos.y) * 2.0;
            pos.z += cos(uTime * 0.2 + pos.y) * 2.0;
            
            // Wrap around Y
            pos.y = mod(pos.y, 40.0);
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            
            // Size attenuation
            gl_PointSize = aSize * (300.0 / -mvPosition.z);
            
            // Fade out near top and bottom
            vPointOpacity = smoothstep(0.0, 5.0, pos.y) * smoothstep(40.0, 35.0, pos.y);
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          varying float vPointOpacity;
          void main() {
            // Distance from center of point
            float d = length(gl_PointCoord - vec2(0.5));
            // Soft circle using smoothstep
            float finalOpacity = smoothstep(0.5, 0.1, d) * 0.5 * vPointOpacity;
            if (finalOpacity < 0.01) discard;
            gl_FragColor = vec4(uColor, finalOpacity);
          }
        `}
      />
    </points>
  );
}

function NeuralCore({ isMobile }: { isMobile: boolean }) {
  const multiplier = useGameStore(state => state.multiplier);
  const sync = useGameStore(state => state.syncLevel);
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const time = clock.elapsedTime;
      const syncMult = sync / 50; // normalizes around 1.0 at 50%
      const pulse = Math.sin(time * (1 + multiplier * 0.5 + syncMult)) * 0.5 + 0.5;
      meshRef.current.scale.setScalar(2 + pulse * 0.5 + multiplier * 0.2 + syncMult * 0.5);
      meshRef.current.rotation.y += 0.01 * (1 + multiplier + syncMult);
      meshRef.current.rotation.z += 0.005 * (1 + multiplier + syncMult);
      
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.2 + pulse * 0.4 + (sync > 80 ? 0.3 : 0);
      mat.color.set(sync > 80 ? '#f5f' : '#0ff');
    }
    if (lightRef.current) {
      lightRef.current.intensity = (8 + multiplier * 4 + (sync / 10)) * (Math.sin(clock.elapsedTime * 2) * 0.5 + 0.5);
      lightRef.current.color.set(sync > 80 ? '#f5f' : '#0ff');
    }
  });

  return (
    <group position={[0, -0.5, 0]}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[4, 1]} />
        <meshBasicMaterial color="#00ffff" wireframe transparent opacity={0.4} />
      </mesh>
      {!isMobile && (
        <pointLight ref={lightRef} color="#00ffff" distance={100} decay={2} position={[0, 10, 0]} />
      )}
      
      {/* Dynamic ring based on sync */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[15, 15.2 + (sync / 20), 64]} />
        <meshBasicMaterial color={sync > 80 ? "#f5f" : "#ff00ff"} transparent opacity={0.3 + (sync / 200)} toneMapped={false} />
      </mesh>
    </group>
  );
}

function MovingHazard({ axis, range, speed, position, color }: { axis: 'x' | 'z', range: number, speed: number, position: [number, number, number], color: string }) {
  const ref = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const hitPlayer = useGameStore(state => state.hitPlayer);

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.elapsedTime * speed;
      const offset = Math.sin(t) * range;
      if (axis === 'x') ref.current.position.x = position[0] + offset;
      else ref.current.position.z = position[2] + offset;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.05;
    }
  });

  return (
    <group ref={ref} position={position}>
      <RigidBody 
        type="kinematicPosition" 
        sensor 
        onIntersectionEnter={({ other }) => {
          if (other.rigidBodyObject?.name === 'player') {
            hitPlayer();
            useGameStore.setState(state => ({ 
              syncLevel: Math.max(0, state.syncLevel - 15),
              screenShake: 0.6
            }));
            soundManager.playError();
          }
        }}
      >
        <mesh ref={meshRef}>
          <boxGeometry args={[4, 20, 0.5]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} toneMapped={false} />
        </mesh>
        <pointLight color={color} intensity={2} distance={10} />
      </RigidBody>
    </group>
  );
}

function FloatingPlatforms({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 8 : 15;
  const platforms = useMemo(() => {
    const rng = mulberry32(9876);
    return Array.from({ length: count }).map(() => {
      const x = (rng() - 0.5) * 150;
      const z = (rng() - 0.5) * 150;
      const y = 6 + rng() * 6; // Mid-air
      const width = 6 + rng() * 6;
      const depth = 6 + rng() * 6;
      const color = rng() > 0.5 ? '#00ffff' : '#ff00ff';
      return { position: [x, y, z], size: [width, 0.4, depth], color };
    });
  }, [isMobile, count]);

  return (
    <>
      {platforms.map((p, i) => (
        <RigidBody key={i} type="fixed" position={p.position as [number, number, number]} friction={0}>
          <mesh receiveShadow={!isMobile} castShadow={!isMobile}>
            <boxGeometry args={p.size as [number, number, number]} />
            <meshStandardMaterial color="#222" roughness={0.1} metalness={0.9} />
            <mesh position={[0, -0.21, 0]}>
              <boxGeometry args={[p.size[0] + 0.1, 0.05, p.size[2] + 0.1]} />
              <meshBasicMaterial color={p.color} toneMapped={false} transparent opacity={0.6} />
            </mesh>
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}
