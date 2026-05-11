/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, useRapier, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore, EnemyData } from '../store';
import { Text } from '@react-three/drei';
import { soundManager } from '../services/soundService';

  const ENEMY_SPEED = {
    grunt: 4,
    heavy: 2.5,
    scout: 6.5
  };
  const CHASE_DIST = 35;
  const SHOOT_DIST = {
    grunt: 20,
    heavy: 25,
    scout: 15
  };
  const SHOOT_COOLDOWN = {
    grunt: 1500,
    heavy: 3000,
    scout: 800
  };
const STRAFE_TIME = 2000;

export function Enemy({ data }: { data: EnemyData }) {
  const body = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const { world, rapier } = useRapier();
  
  const gameState = useGameStore(state => state.gameState);
  const playerState = useGameStore(state => state.playerState);
  const otherPlayers = useGameStore(state => state.otherPlayers);
  const powerUps = useGameStore(state => state.powerUps);
  const hitPlayer = useGameStore(state => state.hitPlayer);
  const hitEnemy = useGameStore(state => state.hitEnemy);
  const addLaser = useGameStore(state => state.addLaser);
  const addParticles = useGameStore(state => state.addParticles);

  const lastShootTime = useRef(0);
  const patrolTarget = useRef(new THREE.Vector3());
  const lastPatrolChange = useRef(0);
  const state = useRef<'patrol' | 'chase' | 'search'>('patrol');
  const isCrouching = useRef(false);
  const crouchTimer = useRef(0);
  const jumpTimer = useRef(0);
  const strafeTimer = useRef(0);
  const strafeDir = useRef(1);

  const groupRef = useRef<THREE.Group>(null);
  const flashTimer = useRef(0);
  const lastHealth = useRef(data.health);
  const frameCounter = useRef(Math.floor(Math.random() * 60)); // Stagger enemies
  const cachedTargetPos = useRef<THREE.Vector3 | null>(null);
  const cachedTargetType = useRef<string>('player');
  const cachedObstacleAvoidance = useRef<THREE.Vector3>(new THREE.Vector3());

  // Initialize patrol target
  useMemo(() => {
    patrolTarget.current.set(
      data.position[0] + (Math.random() - 0.5) * 10,
      data.position[1],
      data.position[2] + (Math.random() - 0.5) * 10
    );
  }, [data.position]);

  useFrame((state_fiber, delta) => {
    if (data.health < lastHealth.current) flashTimer.current = 0.15;
    lastHealth.current = data.health;
    if (flashTimer.current > 0) flashTimer.current -= delta;

    if (meshRef.current && meshRef.current.material) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (flashTimer.current > 0) {
        mat.emissiveIntensity = 4;
        mat.color.set('#ffffff');
      } else {
        mat.emissiveIntensity = data.state === 'disabled' ? 0 : 0.4;
        mat.color.set(data.state === 'disabled' ? '#444' : color);
      }
    }

    if (!body.current || gameState !== 'playing' || data.state === 'disabled') {
      if (body.current) {
        try {
          const vel = body.current.linvel();
          body.current.setLinvel({ x: 0, y: vel.y, z: 0 }, true);
        } catch (e) {
          // Ignore physics errors during transition
        }
      }
      return;
    }

    const frameCount = frameCounter.current++;
    
    const pos = body.current.translation();
    const currentPos = new THREE.Vector3(pos.x, pos.y, pos.z);

    // AI Jumping / Crouching / Strafing
    crouchTimer.current -= delta;
    jumpTimer.current -= delta;
    strafeTimer.current -= delta;

    if (strafeTimer.current <= 0) {
      strafeTimer.current = 1 + Math.random() * STRAFE_TIME / 1000;
      strafeDir.current = Math.random() > 0.5 ? 1 : -1;
    }

    if (crouchTimer.current <= 0) {
      if (Math.random() < 0.05) { // Increased chance
        isCrouching.current = true;
        crouchTimer.current = 0.5 + Math.random() * 1.5;
      } else {
        isCrouching.current = false;
        crouchTimer.current = 1 + Math.random() * 3;
      }
    }

    if (frameCount % 60 === 0 && jumpTimer.current <= 0 && Math.random() < 0.1 && body.current) { // Jump randomly - checked every 60 frames
      const ray = new rapier.Ray({ x: pos.x, y: pos.y + 0.1, z: pos.z }, { x: 0, y: -1, z: 0 });
      const groundHit = world.castRay(ray, 0.5, true);
      if (groundHit) {
        body.current.applyImpulse({ x: 0, y: 6, z: 0 }, true);
        jumpTimer.current = 1 + Math.random() * 2;
      }
    }

    // Visual crouching - lerp every frame is fine
    if (groupRef.current) {
      const targetScale = isCrouching.current ? 0.4 : 1.0;
      groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, targetScale, delta * 15);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, isCrouching.current ? -0.5 : 0, delta * 15);
    }
    
    // Throttled target prioritization (every 10 frames)
    if (frameCount % 10 === 0) {
      let closestTargetPos: THREE.Vector3 | null = null;
      let closestDist = CHASE_DIST;
      let targetType = 'player';

      // Check human player
      if (playerState === 'active') {
        const playerPos = camera.position.clone();
        playerPos.y = pos.y;
        const distToPlayer = currentPos.distanceTo(playerPos);
        if (distToPlayer < closestDist) {
          closestDist = distToPlayer;
          closestTargetPos = playerPos;
          targetType = 'player';
        }
      }

      // Check other human players
      Object.values(otherPlayers).forEach(p => {
        if (p.state === 'active') {
          const pPos = new THREE.Vector3(p.position[0], pos.y, p.position[2]);
          const distToOther = currentPos.distanceTo(pPos);
          if (distToOther < closestDist) {
            closestDist = distToOther;
            closestTargetPos = pPos;
            targetType = 'player';
          }
        }
      });

      // Check power-ups
      powerUps.forEach(pu => {
        const puPos = new THREE.Vector3(pu.position[0], pos.y, pu.position[2]);
        const distToPu = currentPos.distanceTo(puPos);
        if (distToPu < 10 && distToPu < closestDist) {
          closestDist = distToPu;
          closestTargetPos = puPos;
          targetType = 'powerup';
        }
      });

      // Check other bots
      if (!closestTargetPos || targetType === 'powerup') {
        const allEnemies = useGameStore.getState().enemies;
        allEnemies.forEach(e => {
          if (e.id !== data.id && e.state === 'active') {
            const ePos = new THREE.Vector3(e.position[0], pos.y, e.position[2]);
            const distToEnemy = currentPos.distanceTo(ePos);
            if (distToEnemy < closestDist) {
              closestDist = distToEnemy;
              closestTargetPos = ePos;
              targetType = 'enemy';
            }
          }
        });
      }
      
      cachedTargetPos.current = closestTargetPos;
      cachedTargetType.current = targetType;
    }

    const closestTargetPos = cachedTargetPos.current;
    const targetType = cachedTargetType.current;
    const closestDist = closestTargetPos ? currentPos.distanceTo(closestTargetPos) : CHASE_DIST;

    // AI Logic
    if (closestTargetPos) {
      state.current = 'chase';
    } else if (state.current === 'chase') {
      state.current = 'patrol';
      lastPatrolChange.current = 0; 
    }

    const direction = new THREE.Vector3();
    const desiredVel = new THREE.Vector3();

    if (state.current === 'chase' && closestTargetPos) {
      direction.subVectors(closestTargetPos, currentPos).normalize();
      desiredVel.copy(direction).multiplyScalar(ENEMY_SPEED[data.type]);

      if (targetType !== 'powerup') {
        const strafe = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
        desiredVel.addScaledVector(strafe, strafeDir.current * 3);
      }

      // Throttled Avoidance (every 5 frames)
      if (frameCount % 5 === 0 && body.current) {
        const rayStart = new THREE.Vector3(currentPos.x, pos.y + 0.5, currentPos.z);
        const rayForward = desiredVel.clone().normalize();
        const obsRay = new rapier.Ray(rayStart, rayForward);
        const obsHit = world.castRay(obsRay, 3, true, undefined, undefined, undefined, body.current || undefined);
        if (obsHit && obsHit.collider) {
          const avoidDir = new THREE.Vector3().crossVectors(rayForward, new THREE.Vector3(0, 1, 0)).normalize();
          cachedObstacleAvoidance.current.copy(avoidDir).multiplyScalar(5);
        } else {
          cachedObstacleAvoidance.current.set(0, 0, 0);
        }
      }
      desiredVel.add(cachedObstacleAvoidance.current);
      
      // Shooting logic - still checked every frame but cooldown is large anyway
      const now = Date.now();
      const currentShootCooldown = SHOOT_COOLDOWN[data.type];
      const currentShootDist = SHOOT_DIST[data.type];

      if (targetType !== 'powerup' && closestDist < currentShootDist && now - lastShootTime.current > currentShootCooldown) {
        const rayDir = new THREE.Vector3().subVectors(closestTargetPos, currentPos).normalize();
        
        // Better accuracy, but still misses sometimes
        const spread = targetType === 'player' ? 0.08 : 0.12;
        rayDir.x += (Math.random() - 0.5) * spread;
        rayDir.y += (Math.random() - 0.5) * spread;
        rayDir.z += (Math.random() - 0.5) * spread;
        rayDir.normalize();
        
        const startPos = new THREE.Vector3(currentPos.x, currentPos.y + 0.5, currentPos.z);
        startPos.add(rayDir.clone().multiplyScalar(1.2));

        soundManager.playShoot([startPos.x, startPos.y, startPos.z], [camera.position.x, camera.position.y, camera.position.z]);

        const shootRay = new rapier.Ray(startPos, rayDir);
        const hit = world.castRay(shootRay, currentShootDist, true, undefined, undefined, undefined, body.current || undefined);

        if (hit) {
          const rb = hit.collider.parent();
          if (rb && rb.userData) {
            const userData = rb.userData as { name?: string };
            if (userData.name === 'player') {
              hitPlayer(Math.atan2(rayDir.x, rayDir.z));
              addParticles([camera.position.x, camera.position.y, camera.position.z], '#ff0000');
              addLaser([startPos.x, startPos.y, startPos.z], [camera.position.x, camera.position.y, camera.position.z], '#ff0000');
              lastShootTime.current = now;
            } else if (userData.name && otherPlayers[userData.name]) {
              // Hit other human player in multiplayer
              hitEnemy(userData.name); // Using hitEnemy for multiplayer target
              const hitPoint = shootRay.pointAt(hit.timeOfImpact);
              addParticles([hitPoint.x, hitPoint.y, hitPoint.z], '#ff0000');
              addLaser([startPos.x, startPos.y, startPos.z], [hitPoint.x, hitPoint.y, hitPoint.z], '#ff0000');
              lastShootTime.current = now;
            } else if (userData.name?.startsWith('bot-')) {
              hitEnemy(userData.name);
              const hitPoint = shootRay.pointAt(hit.timeOfImpact);
              addParticles([hitPoint.x, hitPoint.y, hitPoint.z], '#ff0000');
              addLaser([startPos.x, startPos.y, startPos.z], [hitPoint.x, hitPoint.y, hitPoint.z], '#ff0000');
              lastShootTime.current = now;
            } else {
              const hitPoint = shootRay.pointAt(hit.timeOfImpact);
              addParticles([hitPoint.x, hitPoint.y, hitPoint.z], '#ff0000');
              addLaser([startPos.x, startPos.y, startPos.z], [hitPoint.x, hitPoint.y, hitPoint.z], '#ff0000');
              lastShootTime.current = now;
            }
          }
        }
      }
    } else {
      // Patrol
      const now = Date.now();
      if (currentPos.distanceTo(patrolTarget.current) < 3 || now - lastPatrolChange.current > 6000) {
        patrolTarget.current.set(
          (Math.random() - 0.5) * 160,
          currentPos.y,
          (Math.random() - 0.5) * 160
        );
        lastPatrolChange.current = now;
      }
      direction.subVectors(patrolTarget.current, currentPos).normalize();
      desiredVel.copy(direction).multiplyScalar(ENEMY_SPEED[data.type] * 0.8);
    }

    // Apply movement
    if (!body.current) return;
    const velocity = body.current.linvel();
    const currentSpeed = ENEMY_SPEED[data.type];

    body.current.setLinvel({
      x: desiredVel.x,
      y: velocity.y,
      z: desiredVel.z
    }, true);

    // Rotate to face direction
    if (groupRef.current && direction.lengthSq() > 0.1) {
      const targetRotation = Math.atan2(direction.x, direction.z);
      // Simple lerp for rotation
      const currentRotation = groupRef.current.rotation.y;
      // Handle angle wrap-around
      let diff = targetRotation - currentRotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      groupRef.current.rotation.y += diff * 0.1;
    }
  });

  const color = useMemo(() => {
    if (data.state === 'disabled') return '#444';
    if (data.type === 'heavy') return '#ffcc00';
    if (data.type === 'scout') return '#00ffcc';
    return '#ff0055';
  }, [data.type, data.state]);

  const scale = useMemo(() => {
    if (data.type === 'heavy') return 1.6;
    if (data.type === 'scout') return 0.7;
    return 1.0;
  }, [data.type]);

  return (
    <RigidBody
      ref={body}
      colliders={false}
      mass={scale}
      type="dynamic"
      position={data.position}
      enabledRotations={[false, false, false]}
      userData={{ name: data.id }}
    >
      <CapsuleCollider args={[0.5 * scale, 0.5 * scale]} position={[0, scale, 0]} />
      <group ref={groupRef} position={[0, 0, 0]} scale={scale}>
        {/* Body */}
        <mesh ref={meshRef} castShadow position={[0, 1, 0]}>
          <capsuleGeometry args={[0.5, 1]} />
          <meshStandardMaterial 
            color={color} 
            roughness={0.3} 
            metalness={0.8} 
            emissive={color}
            emissiveIntensity={data.state === 'disabled' ? 0 : 0.4}
            transparent
            opacity={data.state === 'disabled' ? 0.4 : 1.0}
          />
        </mesh>
        
        {/* Eye/Visor */}
        <mesh position={[0, 1.6, 0.45]}>
          <boxGeometry args={[0.6, 0.2, 0.2]} />
          <meshBasicMaterial color={data.state === 'disabled' ? '#111' : '#ffffff'} />
        </mesh>

        {/* Username Label */}
        <Text
          position={[0, 2.5, 0]}
          fontSize={0.3}
          color={data.state === 'active' ? color : '#666666'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {data.id}
        </Text>
      </group>
    </RigidBody>
  );
}
