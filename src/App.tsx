import { useEffect, useState, Component, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KeyboardControls } from '@react-three/drei';
import { useGameStore } from './store';
import { Game } from './components/Game';
import { LoadingScreen, HealthBar, Crosshair, ScoreHUD, TimerHUD, MultiplierHUD, AlertHUD, Vignette, Radar, DamageIndicators, AssistantHUD, ObjectivesHUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import { Trophy, AlertTriangle, Settings, Play, LogOut } from 'lucide-react';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="text-red-500 mb-6" size={64} />
          <h2 className="text-4xl font-black text-white italic mb-4">NEURAL LINK FAILURE</h2>
          <p className="text-white/60 font-mono text-sm max-w-md mb-8">
            A critical error occurred while initializing the combat simulation. 
            <br/><span className="text-red-400/80 text-[10px] mt-2 block">{this.state.error?.message}</span>
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-white text-black font-black uppercase italic tracking-widest rounded-xl"
          >
            Re-establish Connection
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const PauseMenu = ({ onResume }: { onResume: () => void }) => {
  const sensitivity = useGameStore(state => state.sensitivity);
  const setSensitivity = useGameStore(state => state.setSensitivity);
  const username = useGameStore(state => state.username);
  const setUsername = useGameStore(state => state.setUsername);
  const leaveGame = useGameStore(state => state.leaveGame);
  
  return (
    <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl"
      >
        <h2 className="text-4xl font-black text-white italic tracking-tighter mb-8 flex items-center gap-3">
          PAUSED <span className="text-[10px] uppercase font-black tracking-[0.5em] text-cyan-400 ml-4">Simulation Suspended</span>
        </h2>
        
        <div className="space-y-8 mb-12 text-left">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Operator Designation</label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toUpperCase())}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-cyan-400 uppercase tracking-widest text-sm"
              placeholder="ENTER CODENAME..."
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] font-black uppercase text-white/40 tracking-widest">
              <div className="flex items-center gap-2">
                <Settings size={12} />
                Neural Sensitivity
              </div>
              <span className="text-cyan-400 font-mono">{(sensitivity * 100).toFixed(0)}%</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="5" 
              step="0.1"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-y-2 text-[8px] font-black uppercase text-white/20 tracking-wider">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-cyan-400/30 rounded-full" />
              WASD: Movement
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-cyan-400/30 rounded-full" />
              SPACE: Jump
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-cyan-400/30 rounded-full" />
              SHIFT: Dash
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-cyan-400/30 rounded-full" />
              LMB: Primary Fire
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onResume}
            className="h-14 bg-cyan-400 text-black font-black uppercase tracking-widest italic rounded-2xl flex items-center justify-center gap-3 text-sm"
          >
            <Play size={18} fill="currentColor" />
            Resume
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={leaveGame}
            className="h-14 bg-white/5 border border-white/10 text-white/60 font-black uppercase tracking-widest italic rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 text-sm"
          >
            <LogOut size={18} />
            Abort
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

const Menu = () => {
  const startGame = useGameStore(state => state.startGame);
  const sensitivity = useGameStore(state => state.sensitivity);
  const setSensitivity = useGameStore(state => state.setSensitivity);
  const username = useGameStore(state => state.username);
  const setUsername = useGameStore(state => state.setUsername);
  
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl pointer-events-auto overflow-y-auto pt-20 pb-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center max-w-2xl w-full px-6 text-center"
      >
        <div className="relative mb-16">
          <motion.h1 
            animate={{ 
              textShadow: [
                "0 0 20px rgba(34,211,238,0.5)",
                "0 0 40px rgba(217,70,239,0.5)",
                "0 0 20px rgba(34,211,238,0.5)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-8xl md:text-9xl font-black text-white italic tracking-tighter"
          >
            NEON<span className="text-cyan-400">ARENA</span>
          </motion.h1>
          <div className="absolute -bottom-4 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent scale-x-150 opacity-50" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mb-12 text-left">
          <div className="flex flex-col gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Operator Designation</label>
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-cyan-400 uppercase tracking-widest text-sm"
                  placeholder="ENTER CODENAME..."
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-white/40 tracking-widest">
                  <div className="flex items-center gap-2">
                    <Settings size={12} />
                    Neural Sensitivity
                  </div>
                  <span className="text-cyan-400 font-mono">{(sensitivity * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="5" 
                  step="0.1"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startGame}
              className="group relative h-24 bg-cyan-400 text-black overflow-hidden rounded-2xl transition-all shadow-[0_0_40px_rgba(34,211,238,0.3)]"
            >
              <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative font-black uppercase tracking-[0.3em] italic text-2xl">Enter Simulation</span>
            </motion.button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col gap-4">
            <div className="text-white/40 text-[10px] font-black uppercase tracking-widest">Combat Briefing</div>
            <div className="space-y-4">
              <BriefingItem 
                title="Neural Sync" 
                desc="Eliminate hostiles to increase sync. High sync improves energy recovery." 
                color="border-fuchsia-500" 
              />
              <BriefingItem 
                title="Recoil Damping" 
                desc="Shift to dash. Dashing instantly clears 20% of weapon heat." 
                color="border-cyan-400" 
              />
              <BriefingItem 
                title="Heat Management" 
                desc="Rapid fire builds heat. Overheating locks weapon systems." 
                color="border-white/20" 
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-[10px] text-white/20 font-black uppercase tracking-[0.4em]">
          <span>WASD <span className="text-white/40 italic">to Move</span></span>
          <span>Shift <span className="text-white/40 italic">to Dash</span></span>
          <span>Click <span className="text-white/40 italic">to Sync</span></span>
        </div>
      </motion.div>
    </div>
  );
};

const BriefingItem = ({ title, desc, color }: { title: string, desc: string, color: string }) => (
  <div className={`p-4 border-l-2 ${color} bg-white/[0.02]`}>
    <div className="text-white font-black text-xs uppercase tracking-tighter mb-1 italic">{title}</div>
    <div className="text-[10px] text-white/40 leading-relaxed font-bold">{desc}</div>
  </div>
);

const GameOver = () => {
  const results = useGameStore(state => state.matchResults);
  const score = useGameStore(state => state.score);
  const rank = useGameStore(state => state.neuralRank);
  const leaveGame = useGameStore(state => state.leaveGame);
  
  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 text-center px-4 overflow-y-auto pointer-events-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl w-full"
      >
        <div className="mb-12">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-[10px] font-black uppercase tracking-[1em] text-white/30 mb-2"
          >
            Neural Protocol Terminated
          </motion.div>
          <h2 className="text-6xl md:text-8xl text-white font-black italic tracking-tighter drop-shadow-[0_0_30px_rgba(217,70,239,0.5)]">
            FINAL <span className="text-fuchsia-500">SYNC</span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <StatBox label="Neural Score" value={score.toLocaleString()} color="text-white" />
          <StatBox label="Eliminations" value={results?.kills || 0} color="text-fuchsia-500" />
          <StatBox label="Max Multiplier" value={`x${results?.maxMultiplier.toFixed(1) || '1.0'}`} color="text-cyan-400" />
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col justify-center border-white/20">
            <div className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Neural Rank</div>
            <div className="text-xl font-black text-white italic">{rank}</div>
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 mb-12 backdrop-blur-xl text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Trophy size={120} className="text-white" />
          </div>
          
          <h3 className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-8">Performance Diagnosis</h3>
          
          <div className="space-y-8">
            <SyncBar label="Combat Flow" val={Math.min(100, (results?.kills || 0) * 8)} color="bg-fuchsia-500" />
            <SyncBar label="Neural Stability" val={Math.min(100, (score / 4000) * 100)} color="bg-cyan-400" />
            <SyncBar label="Accuracy Sync" val={78} color="bg-white" />
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={leaveGame}
          className="group relative w-full h-20 bg-white text-black overflow-hidden rounded-2xl focus:ring-4 focus:ring-white/50 outline-none transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]"
        >
          <span className="relative font-black uppercase tracking-[0.4em] italic text-sm">Return to Neural Core</span>
        </motion.button>
      </motion.div>
    </div>
  );
};

const StatBox = ({ label, value, color }: { label: string, value: string | number, color: string }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
    <div className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">{label}</div>
    <div className={`text-3xl font-black font-mono ${color}`}>{value}</div>
  </div>
);

const SyncBar = ({ label, val, color }: { label: string, val: number, color: string }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center text-[10px]">
      <span className="text-white/60 font-black uppercase italic tracking-widest">{label}</span>
      <span className={`${color.replace('bg-', 'text-')} font-black`}>{val.toFixed(1)}%</span>
    </div>
    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${val}%` }}
        transition={{ duration: 1.5, ease: "circOut" }}
        className={`h-full ${color} shadow-[0_0_15px_currentColor]`}
      />
    </div>
  </div>
);

export default function App() {
  const gameState = useGameStore(state => state.gameState);
  const pointerLocked = useGameStore(state => state.pointerLocked);
  const isMobile = useGameStore(state => state.isMobile);
  const setPointerLocked = useGameStore(state => state.setPointerLocked);
  const setIsMobile = useGameStore(state => state.setIsMobile);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768 || ('ontouchstart' in window);
      setIsMobile(mobile);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Pointer lock state is managed by PointerLockControls callbacks in Player.tsx
  // No redundant manual listener needed here.

  return (
    <KeyboardControls
      map={[
        { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
        { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
        { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
        { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
        { name: 'jump', keys: ['Space', ' '] },
        { name: 'dash', keys: ['Shift'] },
        { name: 'crouch', keys: ['Control', 'c', 'C'] },
      ]}
    >
      <div className="w-full h-full bg-black relative overflow-hidden select-none">
      <div className="absolute inset-0">
        <ErrorBoundary>
          <Game />
        </ErrorBoundary>
      </div>

      <AnimatePresence>
        {gameState === 'menu' && <Menu key="menu" />}
        {gameState === 'gameover' && <GameOver key="gameover" />}
      </AnimatePresence>

      {gameState === 'playing' && (
        <div className="absolute inset-0 pointer-events-none">
          <Vignette />
          <ScoreHUD />
          <TimerHUD />
          <MultiplierHUD />
          <Radar />
          <AlertHUD />
          <DamageIndicators />
          <AssistantHUD />
          <ObjectivesHUD />
          <HealthBar />
          <Crosshair />
          {isMobile && <MobileControls />}
          
          {!pointerLocked && !isMobile && (
            <PauseMenu onResume={() => document.querySelector('canvas')?.requestPointerLock()} />
          )}
        </div>
      )}
    </div>
  </KeyboardControls>
  );
}
