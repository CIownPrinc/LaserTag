/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, useRapier, CapsuleCollider } from '@react-three/rapier';
import { PointerLockControls, useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store';
import { soundManager } from '../services/soundService';
import { PLAYER_BASE_SPEED, MAX_LASER_DISTANCE } from '../systems/player/constants';
import { getFireRate } from '../systems/player/combat';
import { clampPitch } from '../systems/player/camera';
import { getMoveAxes, getPlanarBasis } from '../systems/player/input';

export function Player() {
  const body = useRef<RapierRigidBody>(null);
  const { camera } = useThree();
  const { rapier, world } = useRapier();
  const [, getKeys] = useKeyboardControls();
  
  const playerState = useGameStore(state => state.playerState);
  const gameState = useGameStore(state => state.gameState);
  const sensitivity = useGameStore(state => state.sensitivity);
  const screenShake = useGameStore(state => state.screenShake);
  const addLaser = useGameStore(state => state.addLaser);
  const setShooting = useGameStore(state => state.setShooting);
  const hitEnemy = useGameStore(state => state.hitEnemy);
  const addParticles = useGameStore(state => state.addParticles);
  const signalColor = useGameStore(state => state.signalColor);

  const isMobile = useGameStore(state => state.isMobile);
  
  const isGrounded = useRef(false);
  const wasGrounded = useRef(false);
  const isCrouching = useRef(false);
  const lastEmitTime = useRef(0);
  const lastShootTime = useRef(0);
  const stepTimer = useRef(0);

  const gunGroupRef = useRef<THREE.Group>(null);
  const gunVisualRef = useRef<THREE.Group>(null);
  const gunBarrelRef = useRef<THREE.Group>(null);
  const bobTimer = useRef(0);
  const tiltAngle = useRef(0);
  const targetTilt = useRef(0);
  const recoilOffset = useRef(new THREE.Vector2(0, 0));
  const landingDip = useRef(0);

  const updatePlayerPosition = useGameStore(state => state.updatePlayerPosition);
  const setSprinting = useGameStore(state => state.setSprinting);

  // Shooting logic function
  const shoot = () => {
    if (gameState !== 'playing' || playerState !== 'active') return;
    
    const { isOverheated, addEvent } = useGameStore.getState();
    if (isOverheated) {
      soundManager.playError();
      addEvent("CRITICAL: NEURAL OVERHEAT");
      return;
    }

    // Rate limit shooting
    const activePowerUps = useGameStore.getState().activePowerUps;
    const now = Date.now();
    const fireRate = getFireRate(activePowerUps.rapidfire, now);
    
    if (now - lastShootTime.current < fireRate) return;
    lastShootTime.current = now;
    soundManager.playShoot();

    // Raycaster logic...
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    // Start raycast slightly ahead of the camera to avoid hitting the player's own collider
    const rayStart = camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(0.8));
    const ray = new rapier.Ray(rayStart, raycaster.ray.direction);
    const hit = world.castRay(ray, MAX_LASER_DISTANCE, true, undefined, undefined, undefined, body.current || undefined);

    const startPosVec = new THREE.Vector3();
    if (gunBarrelRef.current) {
      gunBarrelRef.current.getWorldPosition(startPosVec);
    } else {
      startPosVec.copy(camera.position);
    }
    const startPos: [number, number, number] = [startPosVec.x, startPosVec.y, startPosVec.z];

    // Apply recoil
    if (gunVisualRef.current) {
      gunVisualRef.current.position.z = -0.4;
      gunVisualRef.current.rotation.x = 0.1;
    }

    // Camera Kick - Apply to offset ref instead of direct rotation to avoid PL conflict
    recoilOffset.current.x += (Math.random() - 0.5) * 0.02;
    recoilOffset.current.y += 0.05 + Math.random() * 0.05;

    let endPos: [number, number, number];

    if (hit) {
      const hitPoint = ray.pointAt(hit.timeOfImpact);
      endPos = [hitPoint.x, hitPoint.y, hitPoint.z];
      
      const collider = hit.collider;
      const rb = collider.parent();
      if (rb && rb.userData) {
        const userData = rb.userData as { name?: string };
        const name = userData.name;
        
        if (name) {
          // Check if it's a bot
          if (name.startsWith('bot-')) {
            hitEnemy(name, true);
          } 
          // Check if it's another player (socket ID)
          else if (name !== 'player' && useGameStore.getState().otherPlayers[name]) {
            hitEnemy(name, true);
          }
        }
      }
      
      addParticles(endPos, signalColor);
      soundManager.playHit(endPos, [camera.position.x, camera.position.y, camera.position.z]);
    } else {
      endPos = [
        camera.position.x + raycaster.ray.direction.x * MAX_LASER_DISTANCE,
        camera.position.y + raycaster.ray.direction.y * MAX_LASER_DISTANCE,
        camera.position.z + raycaster.ray.direction.z * MAX_LASER_DISTANCE
      ];
      useGameStore.getState().missShot();
    }

    addLaser(startPos, endPos, signalColor);
    
    // UI Feedback for shooting
    setShooting(true);
    setTimeout(() => setShooting(false), 100);
  };

  useFrame((state, delta) => {
    if (gameState !== 'playing') return;

    const currentCamera = state.camera;
    const mobileInput = useGameStore.getState().mobileInput;
    const activePowerUps = useGameStore.getState().activePowerUps;
    const now = Date.now();
    const k = getKeys();

    if (body.current) {
      if (body.current.isSleeping()) body.current.wakeUp();
        
      // Continuous Shooting Logic
      const isMouseDown = !isMobile && document.pointerLockElement !== null && useGameStore.getState().isMouseDown;
      if (mobileInput.shooting || isMouseDown) shoot();

      const currentSpeed = activePowerUps.speed > now ? PLAYER_BASE_SPEED * 1.8 : PLAYER_BASE_SPEED;
      const velocity = body.current.linvel();
      
      // Ground check
      const ray = new rapier.Ray(
        { x: body.current.translation().x, y: body.current.translation().y, z: body.current.translation().z },
        { x: 0, y: -1, z: 0 }
      );
      const groundHit = world.castRay(ray, 1.1, true);
      wasGrounded.current = isGrounded.current;
      isGrounded.current = !!groundHit;

      // Handle Landing
      if (isGrounded.current && !wasGrounded.current) {
        landingDip.current = 0.3;
        soundManager.playWalk(); // Impact sound
      }
      landingDip.current = THREE.MathUtils.lerp(landingDip.current, 0, delta * 10);

      // Input mapping
      const crouchPressed = k.crouch || mobileInput.crouch;
      const wasCrouching = isCrouching.current;
      isCrouching.current = crouchPressed;

      if (isCrouching.current && !wasCrouching) soundManager.playCrouch();

      // Sprinting
      const sprintPressed = k.sprint && k.forward && !isCrouching.current && isGrounded.current;
      setSprinting(sprintPressed);

      if ((k.jump || mobileInput.jump) && isGrounded.current) {
        body.current.applyImpulse({ x: 0, y: 8.5, z: 0 }, true);
        soundManager.playJump();
        isGrounded.current = false;
        landingDip.current = -0.1; // Slight upward kick on jump
      }

      // Dash
      const { dashCooldown, performDash } = useGameStore.getState();
      if (k.dash && dashCooldown === 0 && (k.forward || k.backward || k.left || k.right)) {
        const dashDir = new THREE.Vector3();
        const { forward, right } = getPlanarBasis(currentCamera.quaternion);

        if (k.forward) dashDir.add(forward);
        if (k.backward) dashDir.add(forward.clone().negate());
        if (k.left) dashDir.add(right.clone().negate());
        if (k.right) dashDir.add(right);
        
        if (dashDir.lengthSq() > 0) {
          dashDir.normalize();
          body.current.applyImpulse({ x: dashDir.x * 30, y: 0, z: dashDir.z * 30 }, true);
          performDash();
          soundManager.playJump(); 
          useGameStore.setState({ screenShake: 0.4 });
        }
      }

      // Horizontal Movement
      const { forward, right } = getPlanarBasis(currentCamera.quaternion);
      
      const { moveX: combinedMoveX, moveZ: combinedMoveZ } = getMoveAxes(k, mobileInput.move);

      const isSprinting = k.sprint && combinedMoveZ > 0 && !isCrouching.current && isGrounded.current;

      // View tilting
      targetTilt.current = -combinedMoveX * 0.04;
      tiltAngle.current = THREE.MathUtils.lerp(tiltAngle.current, targetTilt.current, delta * 5);

      const direction = new THREE.Vector3();
      direction.addScaledVector(forward, combinedMoveZ);
      direction.addScaledVector(right, combinedMoveX);
      
      if (direction.lengthSq() > 0) {
        if (direction.lengthSq() > 1) direction.normalize();
        let moveSpeed = isCrouching.current ? currentSpeed * 0.4 : currentSpeed;
        if (isSprinting) moveSpeed *= 1.5;
        direction.multiplyScalar(moveSpeed);
      }

      // Smoothly interpolate to target velocity for a weightier feel
      const lerpFactor = isGrounded.current ? (direction.lengthSq() > 0 ? 10 : 15) : 3;
      const newVelX = THREE.MathUtils.lerp(velocity.x, direction.x, delta * lerpFactor);
      const newVelZ = THREE.MathUtils.lerp(velocity.z, direction.z, delta * lerpFactor);
      body.current.setLinvel({ x: newVelX, y: velocity.y, z: newVelZ }, true);

      // Footsteps and Bobbing
      const horizontalVel = new THREE.Vector2(velocity.x, velocity.z);
      if (isGrounded.current && horizontalVel.length() > 0.5) {
        bobTimer.current += delta * horizontalVel.length() * 1.5;
        stepTimer.current -= delta * (isCrouching.current ? 0.6 : 1) * (activePowerUps.speed > now ? 1.5 : 1);
        if (stepTimer.current <= 0) {
          soundManager.playWalk();
          stepTimer.current = 0.35;
        }
      } else {
        bobTimer.current = THREE.MathUtils.lerp(bobTimer.current, 0, delta * 5);
      }

    // Camera follow position
    const pos = body.current.translation();
    const targetHeight = isCrouching.current ? 0.6 : 1.6;
    
    // Increased bobbing during sprint
    const isActuallySprinting = k.sprint && k.forward && !isCrouching.current && isGrounded.current;
    const bobIntensity = isActuallySprinting ? 1.8 : 1.0;
    const bobY = Math.sin(bobTimer.current) * 0.02 * bobIntensity;

    // Update camera position
    currentCamera.position.set(
      pos.x, 
      THREE.MathUtils.lerp(currentCamera.position.y, pos.y + targetHeight + bobY - landingDip.current, delta * 12), 
      pos.z
    );

    // Camera recoil handling
    recoilOffset.current.x = THREE.MathUtils.lerp(recoilOffset.current.x, 0, delta * 12);
    recoilOffset.current.y = THREE.MathUtils.lerp(recoilOffset.current.y, 0, delta * 12);
    
    // Apply recoil and clamp
    const newRotX = currentCamera.rotation.x + recoilOffset.current.y;
    currentCamera.rotation.x = clampPitch(newRotX);
    currentCamera.rotation.y += recoilOffset.current.x;
    
    // Reset rotation.y jitter
    recoilOffset.current.x *= 0.9;
    
    // Add Screen Shake
    if (screenShake > 0) {
      currentCamera.position.x += (Math.random() - 0.5) * screenShake;
      currentCamera.position.y += (Math.random() - 0.5) * screenShake;
      currentCamera.position.z += (Math.random() - 0.5) * screenShake;
    }

    // Camera Tilt (Strafe tilt + look tilt)
    currentCamera.rotation.z = tiltAngle.current;

    // FOV handling
    if ((currentCamera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const pCamera = currentCamera as THREE.PerspectiveCamera;
      const isDashing = now - (useGameStore.getState().dashCooldown + 1.5) < 0.3;
      const targetFov = (activePowerUps.speed > now || isDashing || isSprinting) ? 95 : 75;
      pCamera.fov = THREE.MathUtils.lerp(pCamera.fov, targetFov, delta * 8);
      pCamera.updateProjectionMatrix();
    }

    // Sync gun bob
    if (gunGroupRef.current && gunVisualRef.current) {
      const bobX = Math.cos(bobTimer.current * 0.5) * 0.02;
      gunGroupRef.current.position.copy(currentCamera.position);
      gunGroupRef.current.quaternion.copy(currentCamera.quaternion);
      gunVisualRef.current.position.x = 0.4 + bobX * 1.5;
      gunVisualRef.current.position.y = -0.3 + bobY * 1.5;
      gunGroupRef.current.visible = true;
    }

    // Server sync
    if (now - lastEmitTime.current > 50) {
      updatePlayerPosition([pos.x, pos.y, pos.z], currentCamera.rotation.y, isCrouching.current, !isGrounded.current);
      lastEmitTime.current = now;
    }
  }

  // Mobile Look handling
  if (isMobile && (Math.abs(mobileInput.look.x) > 0.01 || Math.abs(mobileInput.look.y) > 0.01)) {
    const lookSpeed = sensitivity * 0.5;
    currentCamera.rotation.y -= mobileInput.look.x * lookSpeed;
    const newMobileRotX = currentCamera.rotation.x - mobileInput.look.y * lookSpeed;
    currentCamera.rotation.x = clampPitch(newMobileRotX);
  }

    // Gun Visual recoil handling
    if (gunVisualRef.current) {
      gunVisualRef.current.position.z = THREE.MathUtils.lerp(gunVisualRef.current.position.z, -0.6, delta * 15);
      gunVisualRef.current.rotation.x = THREE.MathUtils.lerp(gunVisualRef.current.rotation.x, 0, delta * 15);
    }
  });


  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      useGameStore.setState({ isMouseDown: true });
      if (!isMobile && gameState === 'playing' && playerState === 'active') {
        useGameStore.getState().requestGameLock();
        shoot();
      }
    };
    const handleMouseUp = () => {
      useGameStore.setState({ isMouseDown: false });
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gameState, playerState, camera, world, rapier, hitEnemy, addParticles, addLaser, isMobile]);

  const setPointerLocked = useGameStore(state => state.setPointerLocked);

  return (
    <>
      {!isMobile && gameState === 'playing' && (
        <PointerLockControls 
          selector="#game-canvas"
          onLock={() => setPointerLocked(true)}
          onUnlock={() => setPointerLocked(false)}
        />
      )}
      <RigidBody
        ref={body}
        colliders={false}
        mass={1}
        type="dynamic"
        position={[0, 2, 10]}
        enabledRotations={[false, false, false]}
        userData={{ name: 'player' }}
        friction={0}
        canSleep={false}
        ccd={true}
      >
        <CapsuleCollider args={[0.5, 0.5]} position={[0, 0, 0]} friction={0} />
      </RigidBody>

      {/* First Person Gun */}
      <group ref={gunGroupRef}>
        <group ref={gunVisualRef} position={[0.4, -0.3, -0.6]}>
          {/* Main body */}
          <mesh position={[0, 0, 0.2]}>
            <boxGeometry args={[0.1, 0.15, 0.4]} />
            <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Barrel */}
          <mesh position={[0, 0.05, -0.15]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
            <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Neon accents */}
          <mesh position={[0, 0.08, 0.1]}>
            <boxGeometry args={[0.11, 0.02, 0.2]} />
            <meshBasicMaterial color={signalColor} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.05, -0.25]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.05, 8]} />
            <meshBasicMaterial color={signalColor} toneMapped={false} />
          </mesh>
          {/* Barrel Tip Reference */}
          <group ref={gunBarrelRef} position={[0, 0.05, -0.3]} />
        </group>
      </group>
    </>
  );
}
