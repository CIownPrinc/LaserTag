/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { Canvas, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Arena } from './Arena';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { OtherPlayer } from './OtherPlayer';
import { PowerUp } from './PowerUp';
import { Effects } from './Effects';
import { useGameStore } from '../store';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useShallow } from 'zustand/react/shallow';
import { useState, useEffect, Suspense } from 'react';
import { LoadingScreen } from './HUD';

function GameLoop() {
  const updateTime = useGameStore(state => state.updateTime);
  const updateEnemies = useGameStore(state => state.updateEnemies);
  const cleanupEffects = useGameStore(state => state.cleanupEffects);

  useFrame((_, delta) => {
    const { timeScale } = useGameStore.getState();
    const effectiveDelta = delta * timeScale;
    const now = Date.now();

    // Recovery of timeScale
    if (timeScale < 1) {
      useGameStore.setState({ timeScale: Math.min(1, timeScale + delta * 3) });
    }

    updateTime(effectiveDelta);
    updateEnemies(now);
    cleanupEffects(now);
  });
  return null;
}

export function Game() {
  const enemies = useGameStore(state => state.enemies);
  const powerUps = useGameStore(state => state.powerUps);
  const isMobile = useGameStore(state => state.isMobile);
  const otherPlayerIds = useGameStore(
    useShallow(state => Object.keys(state.otherPlayers))
  );

  return (
    <Canvas 
      shadows={!isMobile} 
      camera={{ fov: 75 }}
      dpr={[1, 2]}
      gl={{ 
        antialias: true, 
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true
      }}
    >
      <Suspense fallback={null}>
        <color attach="background" args={['#0a0a1a']} />
        <fogExp2 attach="fog" args={['#0a0a1a', isMobile ? 0.04 : 0.025]} />
        
        <ambientLight intensity={isMobile ? 0.8 : 0.5} />
        <pointLight position={[0, 15, 0]} intensity={1.5} distance={100} />
        
        {!isMobile && (
          <>
            <pointLight position={[50, 15, 50]} intensity={0.8} distance={100} />
            <pointLight position={[-50, 15, -50]} intensity={0.8} distance={100} />
            <pointLight position={[50, 15, -50]} intensity={0.8} distance={100} />
            <pointLight position={[-50, 15, 50]} intensity={0.8} distance={100} />
          </>
        )}
        
        <Physics gravity={[0, -20, 0]}>
          <GameLoop />
          <Arena />
          <Player />
          {enemies.map(enemy => (
            <Enemy key={enemy.id} data={enemy} />
          ))}
          {otherPlayerIds.map(id => (
            <OtherPlayer key={id} id={id} />
          ))}
          {powerUps.map(pu => (
            <PowerUp key={pu.id} data={pu} />
          ))}
          <Effects />
        </Physics>

        {/* Bloom can be heavy on mobile, disable or simplify */}
        {!isMobile && (
          <EffectComposer multisampling={4}>
            <Bloom luminanceThreshold={1} intensity={1.5} />
          </EffectComposer>
        )}
      </Suspense>
    </Canvas>
  );
}
