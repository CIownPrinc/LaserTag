// ... existing simplified imports ...
import { create } from 'zustand';
import * as THREE from 'three';
import { io, Socket } from 'socket.io-client';
import { soundManager } from './services/soundService';

export type GameState = 'menu' | 'playing' | 'gameover';
export type EntityState = 'active' | 'disabled';
export type PowerUpType = 'speed' | 'shield' | 'rapidfire' | 'health';

export interface MatchResults {
  rank: number;
  totalPlayers: number;
  overallSync: number;
  stabilizations: number;
  maxThroughput: number;
}

export interface PowerUpData {
  id: string;
  type: PowerUpType;
  position: [number, number, number];
}

export interface EnemyData {
  id: string;
  position: [number, number, number];
  state: EntityState;
  disabledUntil: number;
  health: number;
  type: 'grunt' | 'heavy' | 'scout';
}

export interface PlayerData {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: number;
  state: EntityState;
  disabledUntil: number;
  score: number;
  color: string;
  health: number;
  isCrouching?: boolean;
  isJumping?: boolean;
}

export interface LaserData {
  id: string;
  start: [number, number, number];
  end: [number, number, number];
  timestamp: number;
  color: string;
}

export interface ParticleData {
  id: string;
  position: [number, number, number];
  timestamp: number;
  color: string;
}

interface GameStore {
  gameState: GameState;
  score: number;
  multiplier: number;
  multiplierTimer: number;
  timeScale: number;
  weaponHeat: number;
  isOverheated: boolean;
  syncLevel: number; // 0 to 100
  dashCooldown: number;
  maxMultiplier: number;
  killCount: number;
  health: number;
  lastHitDirection: number | null;
  neuralRank: 'RECRUIT' | 'OPERATIVE' | 'ELITE' | 'MASTER';
  timeLeft: number;
  playerState: EntityState;
  assistantMessages: { id: string; text: string; timestamp: number }[];
  playerDisabledUntil: number;
  enemies: EnemyData[];
  powerUps: PowerUpData[];
  activePowerUps: Record<PowerUpType, number>;
  lasers: LaserData[];
  particles: ParticleData[];
  events: Array<{ id: string; message: string; timestamp: number }>;
  killFeed: Array<{ id: string; message: string; timestamp: number }>;
  screenShake: number;
  isShooting: boolean;
  isMouseDown: boolean;
  isSprinting: boolean;
  isHit: boolean;
  signalColor: string;
  sensitivity: number;
  playerRotation: number;
  matchResults: MatchResults | null;
  wave: number;
  objectives: Array<{ id: string; text: string; completed: boolean }>;
  alertMessage: { text: string; type: 'info' | 'warning' | 'danger'; timestamp: number } | null;
  pointerLocked: boolean;
  lastPointerLockExitTime: number;
  isMobile: boolean;
  username: string;
  trainingMode: boolean;
  setUsername: (name: string) => void;
  setSignalColor: (color: string) => void;
  setIsMobile: (isMobile: boolean) => void;
  setSprinting: (isSprinting: boolean) => void;
  
  socket: Socket | null;
  otherPlayers: Record<string, PlayerData>;

  startGame: (training?: boolean) => void;
  endGame: () => void;
  leaveGame: () => void;
  updateTime: (delta: number) => void;
  hitPlayer: (direction?: number) => void;
  hitEnemy: (id: string, byPlayer?: boolean) => void;
  collectPowerUp: (id: string) => void;
  addLaser: (start: [number, number, number], end: [number, number, number], color: string) => void;
  addAssistantMessage: (text: string) => void;
  addParticles: (position: [number, number, number], color: string) => void;
  addEvent: (message: string) => void;
  addKill: (victimName: string) => void;
  updateEnemies: (time: number) => void;
  cleanupEffects: (time: number) => void;
  setPlayerState: (state: EntityState) => void;
  updatePlayerPosition: (position: [number, number, number], rotation: number, isCrouching?: boolean, isJumping?: boolean) => void;

  mobileInput: {
    move: { x: number, y: number };
    look: { x: number, y: number };
    shooting: boolean;
    crouch: boolean;
    jump: boolean;
  };
  setMobileInput: (input: Partial<GameStore['mobileInput']>) => void;
  setSensitivity: (sensitivity: number) => void;
  setShooting: (isShooting: boolean) => void;
  spawnWave: (wave: number) => void;
  setAlert: (text: string, type: 'info' | 'warning' | 'danger') => void;
  completeObjective: (id: string) => void;
  setPointerLocked: (locked: boolean) => void;
  performDash: () => void;
  requestGameLock: () => void;
  missShot: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'menu',
  score: 0,
  multiplier: 1,
  multiplierTimer: 0,
  timeScale: 1,
  weaponHeat: 0,
  isOverheated: false,
  syncLevel: 50,
  dashCooldown: 0,
  maxMultiplier: 1,
  killCount: 0,
  health: 100,
  lastHitDirection: null,
  neuralRank: 'RECRUIT',
  timeLeft: 120,
  playerState: 'active',
  assistantMessages: [],
  playerDisabledUntil: 0,
  enemies: [],
  powerUps: [],
  activePowerUps: { speed: 0, shield: 0, rapidfire: 0, health: 0 },
  lasers: [],
  particles: [],
  events: [],
  killFeed: [],
  screenShake: 0,
  isShooting: false,
  isMouseDown: false,
  isSprinting: false,
  isHit: false,
  signalColor: '#22d3ee', // Default Cyan
  sensitivity: 1.5,
  playerRotation: 0,
  matchResults: null,
  wave: 1,
  objectives: [
    { id: 'kills', text: 'Defeat 5 Enemies', completed: false },
    { id: 'multiplier', text: 'Reach x3 Multiplier', completed: false },
    { id: 'survival', text: 'Health above 50%', completed: false }
  ],
  alertMessage: null,
  pointerLocked: false,
  lastPointerLockExitTime: 0,
  isMobile: false,
  username: 'OPERATOR',
  trainingMode: false,
  socket: null,
  otherPlayers: {},
  mobileInput: { move: { x: 0, y: 0 }, look: { x: 0, y: 0 }, shooting: false, crouch: false, jump: false },

  setUsername: (username) => set({ username }),
  setSignalColor: (signalColor) => set({ signalColor }),
  setIsMobile: (isMobile) => set({ isMobile }),
  setMobileInput: (input) => set((state) => ({ mobileInput: { ...state.mobileInput, ...input } })),
  setSensitivity: (sensitivity) => set({ sensitivity }),
  setShooting: (isShooting) => set({ isShooting }),
  setSprinting: (isSprinting) => set({ isSprinting }),
  
  setAlert: (text, type) => {
    const timestamp = Date.now();
    set({ alertMessage: { text, type, timestamp } });
    setTimeout(() => {
      const current = get().alertMessage;
      if (current && current.timestamp === timestamp) set({ alertMessage: null });
    }, 2000);
  },

  addEvent: (message) => {
    const id = Math.random().toString();
    set(state => ({ 
      events: [...state.events, { id, message, timestamp: Date.now() }].slice(-5) 
    }));
  },

  spawnWave: (wave) => set((state) => {
    const syncScale = state.syncLevel / 100; // 0.0 to 1.0
    const baseEnemies = Math.min(20, 5 + wave * 2);
    const enemiesPerWave = Math.floor(baseEnemies * (0.8 + syncScale * 0.4)); // Scale total count slightly
    
    const newEnemies = Array.from({ length: enemiesPerWave }).map((_, i) => {
      const angle = (i / enemiesPerWave) * Math.PI * 2;
      const dist = 40 + Math.random() * 20;
      const typeRand = Math.random();
      
      // Higher sync increases chance of harder enemies
      const heavyThreshold = 0.8 - (syncScale * 0.2); // At 100 sync, heavy starts at 0.6 instead of 0.8
      const scoutThreshold = 0.6 - (syncScale * 0.2); 
      
      const type: 'grunt' | 'heavy' | 'scout' = typeRand > heavyThreshold ? 'heavy' : typeRand > scoutThreshold ? 'scout' : 'grunt';
      
      return {
        id: `bot-w${wave}-${i}`,
        position: [Math.cos(angle) * dist, 1, Math.sin(angle) * dist] as [number, number, number],
        state: 'active' as EntityState,
        disabledUntil: 0,
        health: type === 'heavy' ? 300 : type === 'scout' ? 50 : 100,
        type
      };
    });
    return { enemies: [...state.enemies, ...newEnemies], wave };
  }),

  completeObjective: (id) => set(state => ({
    objectives: state.objectives.map(obj => obj.id === id ? { ...obj, completed: true } : obj)
  })),
  
  setPointerLocked: (locked) => {
    set({ 
      pointerLocked: locked,
      lastPointerLockExitTime: !locked ? Date.now() : get().lastPointerLockExitTime 
    });
  },
  requestGameLock: () => {
    if (get().isMobile) return;
    const now = Date.now();
    const canLock = now - get().lastPointerLockExitTime > 1300;
    if (canLock && !document.pointerLockElement) {
      try {
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
          const promise = canvas.requestPointerLock() as any;
          // Modern browsers return a promise, we should handle rejection to avoid console noise
          if (promise && promise.catch) {
            promise.catch((e: any) => console.warn('Pointer lock rejected:', e));
          }
        }
      } catch (err) {
        console.warn('Pointer lock exception:', err);
      }
    }
  },

  startGame: (training = false) => {
    const { socket } = get();
    if (socket) socket.disconnect();
    
    const newSocket = io();
    newSocket.on('connect', () => newSocket.emit('joinGame'));
    newSocket.on('gameJoined', (data) => {
      const otherPlayers = { ...data.players };
      delete otherPlayers[newSocket.id!];
      set({ 
        otherPlayers,
        powerUps: data.powerUps,
        gameState: 'playing',
        timeLeft: training ? 3600 : 120, // 1 hour for training
        trainingMode: training,
        score: 0,
        multiplier: 1,
        health: 100,
        wave: 1,
        weaponHeat: 0,
        isOverheated: false,
        alertMessage: null,
        activePowerUps: { speed: 0, shield: 0, rapidfire: 0, health: 0 },
        syncLevel: 50,
        killCount: 0,
        maxMultiplier: 1,
        neuralRank: 'RECRUIT'
      });
      // spawnWave is now called locally to ensure enemies exist even without server response
    });

    newSocket.on('playerMoved', (data) => set(state => {
      if (!state.otherPlayers[data.id]) return state;
      return { otherPlayers: { ...state.otherPlayers, [data.id]: { ...state.otherPlayers[data.id], ...data } } };
    }));

    newSocket.on('playerShot', (data) => set(state => ({
      lasers: [...state.lasers, { id: Math.random().toString(), ...data, timestamp: Date.now() }],
      particles: [...state.particles, { id: Math.random().toString(), position: data.end, color: data.color, timestamp: Date.now() }]
    })));

    newSocket.on('playerHit', (data) => set(state => {
      const isLocalTarget = data.targetId === newSocket.id;
      const isLocalShooter = data.shooterId === newSocket.id;
      const newState: Partial<GameStore> = {};
      if (isLocalTarget) {
        newState.health = data.targetHealth;
        if (data.targetHealth <= 0) {
          newState.playerState = 'disabled';
          newState.playerDisabledUntil = data.targetDisabledUntil;
        }
      }
      if (isLocalShooter) newState.score = data.shooterScore;
      return newState;
    }));

    newSocket.on('playerLeft', (id) => set(state => {
      const players = { ...state.otherPlayers };
      delete players[id];
      return { otherPlayers: players };
    }));

    set({ 
      gameState: 'playing', 
      socket: newSocket,
      enemies: [],
      score: 0,
      health: 100,
      wave: 1,
      timeLeft: training ? 3600 : 120,
      trainingMode: training,
      killCount: 0,
      maxMultiplier: 1,
      syncLevel: 50,
      activePowerUps: { speed: 0, shield: 0, rapidfire: 0, health: 0 }
    });
    get().spawnWave(1);
    get().addAssistantMessage(training ? "PRACTICE SESSION INITIALIZED." : "NEURAL LINK ESTABLISHED. INITIALIZING COMBAT PROTOCOLS.");
  },

  endGame: () => {
    get().socket?.disconnect();
    const state = get();
    set({ 
      gameState: 'gameover', 
      socket: null,
      matchResults: {
        rank: 1,
        totalPlayers: Object.keys(state.otherPlayers).length + 1,
        overallSync: state.score,
        stabilizations: state.killCount,
        maxThroughput: state.maxMultiplier
      }
    });
  },

  leaveGame: () => {
    get().socket?.disconnect();
    set({ 
      gameState: 'menu', 
      socket: null, 
      otherPlayers: {}, 
      enemies: [], 
      lasers: [], 
      particles: [], 
      events: [], 
      score: 0,
      multiplier: 1,
      syncLevel: 50,
      timeLeft: 120,
      trainingMode: false,
      killCount: 0,
      maxMultiplier: 1,
      weaponHeat: 0,
      isOverheated: false,
      activePowerUps: { speed: 0, shield: 0, rapidfire: 0, health: 0 },
      matchResults: null
    });
  },

  updateTime: (delta) => set((state) => {
    if (state.gameState !== 'playing') return state;
    const newTime = Math.max(0, state.timeLeft - delta);
    
    // Multiplier decay
    let newMultiplier = state.multiplier;
    let newMultiplierTimer = Math.max(0, state.multiplierTimer - delta);
    if (newMultiplierTimer === 0 && state.multiplier > 1) {
      newMultiplier = 1;
      newMultiplierTimer = 0;
    }

    // Heat decay - high sync speeds up cooling
    const heatDecayRate = state.syncLevel > 80 ? 65 : 45;
    let newHeat = Math.max(0, state.weaponHeat - delta * heatDecayRate);
    let newOverheated = state.isOverheated;
    if (newHeat === 0) newOverheated = false;

    // Dash cooldown
    const newDashCooldown = Math.max(0, state.dashCooldown - delta);

    // Sync Drift: Returns to 50 slowly
    let newSync = state.syncLevel;
    if (newSync > 50) newSync -= delta * 1.5;
    else if (newSync < 50) newSync += delta * 0.8;

    // Survival Objective: Reached 60s with Health > 50
    if (newTime < 60 && state.health > 50 && !state.objectives.find(o => o.id === 'survival')?.completed) {
      get().completeObjective('survival');
    }

    if (newTime <= 0) {
      state.socket?.disconnect();
      return { 
        timeLeft: 0, 
        gameState: 'gameover', 
        socket: null,
        matchResults: {
          rank: 1,
          totalPlayers: Object.keys(state.otherPlayers).length + 1,
          overallSync: state.score,
          stabilizations: state.killCount,
          maxThroughput: state.maxMultiplier
        }
      };
    }
    return { 
      timeLeft: newTime, 
      multiplier: newMultiplier, 
      multiplierTimer: newMultiplierTimer,
      weaponHeat: newHeat,
      isOverheated: newOverheated,
      syncLevel: newSync,
      dashCooldown: newDashCooldown
    };
  }),

  hitPlayer: (direction) => set((state) => {
    if (state.playerState === 'disabled' || state.gameState !== 'playing') return state;
    const newHealth = Math.max(0, state.health - 25);
    const newSync = Math.max(0, state.syncLevel - 15); // Neural Static on hit
    
    if (newHealth <= 0) {
      return { 
        health: 0, 
        syncLevel: 0,
        playerState: 'disabled', 
        playerDisabledUntil: Date.now() + 3000, 
        screenShake: 1.0, 
        lastHitDirection: null 
      };
    }
    return { health: newHealth, syncLevel: newSync, screenShake: 0.5, lastHitDirection: direction || null };
  }),

  hitEnemy: (id, byPlayer = false) => set((state) => {
    if (state.gameState !== 'playing') return state;
    const enemies = state.enemies.map(e => e.id === id ? { ...e, state: 'disabled' as EntityState, disabledUntil: Date.now() + 5000 } : e);
    
    let newScore = state.score;
    let newMultiplier = state.multiplier;
    let newMultiplierTimer = 3.0; // Seconds until multiplier resets
    let newSync = state.syncLevel;

    if (byPlayer) {
      newMultiplier = Math.min(10, state.multiplier + 0.5);
      newScore += 100 * Math.floor(newMultiplier);
      newSync = Math.min(100, state.syncLevel + 10);
      set({ isHit: true });
      setTimeout(() => set({ isHit: false }), 150);
    }

    const nextRank = newScore > 10000 ? 'MASTER' : newScore > 5000 ? 'ELITE' : newScore > 2000 ? 'OPERATIVE' : 'RECRUIT';

    if (nextRank !== state.neuralRank) {
      setTimeout(() => get().addAssistantMessage(`PROMOTED TO ${nextRank} RANK`), 100);
    }

    // Check Objectives
    if (state.killCount + 1 >= 5) {
      get().completeObjective('kills');
    }
    if (newMultiplier >= 3) {
      get().completeObjective('multiplier');
    }

    return { 
      enemies, 
      score: newScore,
      syncLevel: newSync,
      multiplier: newMultiplier,
      neuralRank: nextRank,
      maxMultiplier: Math.max(state.maxMultiplier, newMultiplier),
      multiplierTimer: newMultiplierTimer,
      killCount: state.killCount + (byPlayer ? 1 : 0),
      screenShake: byPlayer ? 0.2 : state.screenShake,
      timeScale: byPlayer ? 0.1 : state.timeScale // Hit-stop effect
    };
  }),

  performDash: () => set(state => ({ 
    dashCooldown: 1.5, 
    syncLevel: Math.max(0, state.syncLevel - 5),
    weaponHeat: Math.max(0, state.weaponHeat - 20) 
  })),

  missShot: () => set(state => {
    // Only penalize if we were reasonably synced
    if (state.syncLevel < 10) return state;
    return { syncLevel: Math.max(5, state.syncLevel - 2) };
  }),

  collectPowerUp: (id) => {
    const { socket } = get();
    if (socket) socket.emit('collectPowerUp', id);
    
    // Local fallback/instant feedback
    const powerUp = get().powerUps.find(p => p.id === id);
    if (powerUp) {
      const now = Date.now();
      const duration = 10000; // 10s powerup
      set(state => ({
        powerUps: state.powerUps.filter(p => p.id !== id),
        activePowerUps: {
          ...state.activePowerUps,
          [powerUp.type]: now + duration
        }
      }));
      get().addAssistantMessage(`${powerUp.type.toUpperCase()} ENHANCEMENT ACQUIRED`);
    }
  },
  addLaser: (start, end, color) => {
    get().socket?.emit('shoot', { start, end, color });
    set(state => {
      const newHeat = state.isOverheated ? state.weaponHeat : Math.min(100, state.weaponHeat + 10);
      const wasOverheated = state.isOverheated;
      const isOverheatedNow = newHeat >= 100;
      
      if (!wasOverheated && isOverheatedNow) {
        setTimeout(() => get().addAssistantMessage("NEURAL OVERHEAT: RECOIL DAMPENING ACTIVE"), 0);
      }

      return { 
        lasers: [...state.lasers, { id: Math.random().toString(), start, end, color, timestamp: Date.now() }],
        weaponHeat: newHeat,
        isOverheated: isOverheatedNow
      };
    });
  },
  addAssistantMessage: (text: string) => {
    const id = Math.random().toString();
    set(state => ({
      assistantMessages: [{ id, text, timestamp: Date.now() }, ...state.assistantMessages].slice(0, 3)
    }));
    setTimeout(() => {
      set(state => ({
        assistantMessages: state.assistantMessages.filter(m => m.id !== id)
      }));
    }, 4000);
  },

  addParticles: (position, color) => set(state => ({ particles: [...state.particles, { id: Math.random().toString(), position, color, timestamp: Date.now() }] })),
  addKill: (victimName) => set(state => ({ killFeed: [{ id: Math.random().toString(), message: `Killed ${victimName}`, timestamp: Date.now() }, ...state.killFeed].slice(0, 5) })),
  updateEnemies: (time) => set(state => {
    const enemies = state.enemies.map(e => (e.state === 'disabled' && time > e.disabledUntil) ? { ...e, state: 'active' as EntityState } : e);
    const playerReady = state.playerState === 'disabled' && time > state.playerDisabledUntil;
    return { enemies, playerState: playerReady ? 'active' : state.playerState };
  }),
  cleanupEffects: (time) => set(state => ({
    lasers: state.lasers.filter(l => time - l.timestamp < 300),
    particles: state.particles.filter(p => time - p.timestamp < 800),
    events: state.events.filter(e => time - e.timestamp < 5000),
    screenShake: Math.max(0, state.screenShake - 0.05),
    lastHitDirection: (state.lastHitDirection !== null && Math.random() < 0.1) ? null : state.lastHitDirection
  })),
  setPlayerState: (playerState) => set({ playerState }),
  updatePlayerPosition: (position, rotation, isCrouching, isJumping) => {
    set({ playerRotation: rotation });
    get().socket?.emit('updatePosition', { position, rotation, isCrouching, isJumping });
  }
}));

