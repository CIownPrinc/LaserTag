import { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../store';
import { Loader2, Heart, Crosshair as AimIcon, Timer, Trophy, Shield, Activity, Zap } from 'lucide-react';

export const LoadingScreen = () => {
  const signalColor = useGameStore(state => state.signalColor);
  return (
    <div className="fixed inset-0 bg-[#050510] flex flex-col items-center justify-center z-[200] scanlines grid-bg">
      <div className="relative">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }} 
          className="mb-8"
        >
          <Loader2 style={{ color: signalColor }} size={64} />
        </motion.div>
        <div className="absolute inset-0 blur-2xl scale-150 rounded-full" style={{ backgroundColor: `${signalColor}33` }} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="font-display font-black uppercase text-sm tracking-[0.5em] animate-pulse italic" style={{ color: signalColor }}>
          INITIALIZING <span className="text-[#fe00fe]">SYNC</span>
        </div>
        <div className="text-white/20 text-[8px] font-display font-bold uppercase tracking-widest">
          Establishing Neural Link...
        </div>
      </div>
    </div>
  );
};

export const HealthBar = memo(() => {
  const health = useGameStore(state => state.health);
  const heat = useGameStore(state => state.weaponHeat);
  const sync = useGameStore(state => state.syncLevel);
  const signalColor = useGameStore(state => state.signalColor);
  const isOverheated = useGameStore(state => state.isOverheated);
  const isSprinting = useGameStore(state => state.isSprinting);
  const isCritical = health < 30;
  
  // HUD fades as sync increases, relying more on world feedback
  const hudOpacity = isCritical ? 1 : Math.max(0.3, 1 - (sync - 50) / 100);
  
  return (
    <div className="fixed bottom-10 right-10 z-30 flex flex-col items-end gap-6 pointer-events-none transition-opacity duration-1000" style={{ opacity: hudOpacity }}>
      {/* Curved Health/Armor Container */}
      <div 
        className="relative w-64 flex flex-col gap-4 bg-black/40 backdrop-blur-xl p-6 border-r-4 shadow-[-10px_0_20px_rgba(0,0,0,0.2)]"
        style={{ borderRightColor: isCritical ? '#ef4444' : signalColor }}
      >
        <div className="absolute inset-0 bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
        
        {/* Health */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline font-display">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Vitality</span>
            <span className="text-2xl font-black tracking-tighter" style={{ color: isCritical ? '#ef4444' : signalColor }}>{Math.ceil(health)}%</span>
          </div>
          <div className="flex gap-1 h-3">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className="flex-1 transition-all duration-300"
                style={{ 
                  backgroundColor: (health / 20) > i ? (isCritical ? '#ef4444' : signalColor) : 'rgba(255,255,255,0.05)',
                  boxShadow: (health / 20) > i ? `0 0 10px ${isCritical ? '#ef4444' : signalColor}80` : 'none'
                }}
              />
            ))}
          </div>
        </div>

        {/* Heat (Core Shield context in design, but heat fits better here) */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline font-display">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Weapon Heat</span>
            <span className="text-lg font-black tracking-tighter" style={{ color: isOverheated ? '#ef4444' : '#ffffff' }}>{Math.ceil(heat)}%</span>
          </div>
          <div className="flex gap-1 h-2">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i}
                className="flex-1 transition-all"
                style={{ 
                  backgroundColor: (heat / (100/12)) > i ? (isOverheated ? '#ef4444' : 'rgba(255,255,255,0.4)') : 'rgba(255,255,255,0.05)'
                }}
              />
            ))}
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-white/5">
          <p className="font-mono text-[9px] text-white/20 text-right uppercase tracking-widest">
            SYST_DIAGNOSTICS: {isCritical ? 'FAILURE_IMMINENT' : 'STABLE'}
          </p>
        </div>
      </div>

        <div className="bg-white/[0.02] px-4 py-2 border border-white/10 backdrop-blur-sm flex items-center gap-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
            Neural Connection: <span className="text-cyan-400">ACTIVE</span>
          </p>
          {isSprinting && (
            <div className="flex items-center gap-1 animate-pulse">
              <Zap size={10} className="text-cyan-400" />
              <span className="font-mono text-[9px] text-cyan-400 font-bold uppercase tracking-widest">Sprinting</span>
            </div>
          )}
        </div>
    </div>
  );
});

export const Crosshair = memo(() => {
  const isShooting = useGameStore(state => state.isShooting);
  const isHit = useGameStore(state => state.isHit);
  const signalColor = useGameStore(state => state.signalColor);
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none">
      <motion.div 
        animate={{ 
          scale: isHit ? 1.2 : (isShooting ? 1.1 : 1),
          rotate: isShooting ? 45 : 0
        }}
        className="relative w-48 h-48"
      >
        {/* Horizontal Lines */}
        <div className="absolute top-1/2 left-0 w-8 h-[2px] -translate-y-1/2 transition-colors duration-200" 
             style={{ backgroundColor: isHit ? '#f59e0b' : signalColor, boxShadow: `0 0 10px ${isHit ? '#f59e0b' : signalColor}` }} />
        <div className="absolute top-1/2 right-0 w-8 h-[2px] -translate-y-1/2 transition-colors duration-200" 
             style={{ backgroundColor: isHit ? '#f59e0b' : signalColor, boxShadow: `0 0 10px ${isHit ? '#f59e0b' : signalColor}` }} />
        
        {/* Vertical Lines */}
        <div className="absolute top-0 left-1/2 h-8 w-[2px] -translate-x-1/2 transition-colors duration-200" 
             style={{ backgroundColor: isHit ? '#f59e0b' : signalColor, boxShadow: `0 0 10px ${isHit ? '#f59e0b' : signalColor}` }} />
        <div className="absolute bottom-0 left-1/2 h-8 w-[2px] -translate-x-1/2 transition-colors duration-200" 
             style={{ backgroundColor: isHit ? '#f59e0b' : signalColor, boxShadow: `0 0 10px ${isHit ? '#f59e0b' : signalColor}` }} />
        
        {/* Center Dot */}
        <div className="absolute top-1/2 left-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-200"
             style={{ backgroundColor: isHit ? '#f59e0b' : '#fff', boxShadow: isHit ? '0 0 8px #f59e0b' : '0 0 8px #fff' }} />
        
        {/* Outer Brackets */}
        <div className="absolute inset-0 border border-white/5 rounded-full scale-110" />
        <div className="absolute inset-8 border border-white/10 rounded-sm skew-x-12 opacity-40" />

        <AnimatePresence>
          {isHit && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.5 }}
              exit={{ opacity: 0, scale: 2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-4 h-4 border-2 border-amber-500 rounded-full" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
});

export const ScoreHUD = memo(() => {
  const score = useGameStore(state => state.score);
  const sync = useGameStore(state => state.syncLevel);
  const multiplier = useGameStore(state => state.multiplier);
  const rank = useGameStore(state => state.neuralRank);
  const signalColor = useGameStore(state => state.signalColor);
  
  const clarity = Math.min(100, Math.floor(sync * 0.7 + multiplier * 3));
  const hudOpacity = Math.max(0.4, 1 - (sync - 60) / 100);

  return (
    <header className="fixed top-0 w-full z-50 border-b border-white/5 backdrop-blur-md flex justify-between items-center px-8 py-4 pointer-events-none transition-opacity duration-1000" style={{ opacity: hudOpacity }}>
      <div className="flex items-center gap-3 opacity-60">
        <Activity style={{ color: signalColor }} size={18} />
        <span className="font-display text-sm font-black tracking-widest text-white/40 uppercase">SYNC_LEVEL</span>
        <span className="font-mono text-xs font-bold" style={{ color: signalColor }}>{clarity}%</span>
      </div>

      {/* Center Sync Meter */}
      <div className="absolute left-1/2 -translate-x-1/2 top-4 flex flex-col items-center w-80">
        <div className="px-6 py-2 bg-black/40 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] w-full text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          <span className="font-display text-2xl font-black tracking-widest text-white relative z-10" style={{ textShadow: `0 0 10px ${signalColor}` }}>
            {score.toLocaleString()} <span className="text-[10px] opacity-40 text-white ml-2 uppercase tracking-normal italic">SCORE</span>
          </span>
        </div>
        <div className="h-1.5 w-full bg-white/5 mt-1 overflow-hidden relative">
          <motion.div 
            animate={{ width: `${Math.min(100, sync)}%` }}
            className="h-full relative z-10"
            style={{ backgroundColor: signalColor, boxShadow: `0 0 15px ${signalColor}` }}
          />
          {/* Faint ghost line for max reach */}
          <div className="absolute inset-0 bg-white/10 opacity-20" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-display text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Rank</p>
          <p className="font-display text-sm font-black uppercase text-white tracking-widest" style={{ color: signalColor }}>{rank}</p>
        </div>
        <Zap style={{ color: signalColor }} size={24} className="opacity-50" />
      </div>
    </header>
  );
});

export const Vignette = memo(() => {
  const health = useGameStore(state => state.health);
  const isCritical = health < 30;

  return (
    <div className="fixed inset-0 pointer-events-none z-[60]">
      <div className="absolute inset-0 border-[40px] border-transparent shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
      <AnimatePresence>
        {isCritical && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-900/10 mix-blend-overlay animate-pulse"
          />
        )}
      </AnimatePresence>
    </div>
  );
});

export const TimerHUD = memo(() => {
  const timeLeft = useGameStore(state => state.timeLeft);
  const sync = useGameStore(state => state.syncLevel);
  const isUrgent = timeLeft < 20;
  const hudOpacity = isUrgent ? 1 : Math.max(0.4, 1 - (sync - 60) / 100);
  
  return (
    <div className="fixed top-20 right-8 flex flex-col items-end gap-1 pointer-events-none transition-opacity duration-1000" style={{ opacity: hudOpacity }}>
      <div className="flex items-center gap-2 font-display text-white/40">
        <Timer size={14} />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Time Remaining</span>
      </div>
      <span className={`text-3xl font-black font-mono tracking-tighter transition-colors ${isUrgent ? 'text-red-500 animate-pulse' : 'text-white'}`}>
        {Math.floor(timeLeft / 60)}:{(Math.floor(timeLeft) % 60).toString().padStart(2, '0')}
      </span>
    </div>
  );
});

export const MultiplierHUD = memo(() => {
  const multiplier = useGameStore(state => state.multiplier);
  const multiplierTimer = useGameStore(state => state.multiplierTimer);
  const signalColor = useGameStore(state => state.signalColor);
  
  if (multiplier <= 1) return null;

  return (
    <div className="fixed top-24 left-8 flex flex-col items-start gap-1 pointer-events-none">
      <div className="text-[10px] font-display font-black text-white/30 uppercase tracking-[0.2em] mb-1">Multiplier</div>
      <div className="flex items-center gap-2 font-display font-black italic text-4xl" style={{ color: signalColor, textShadow: `0 0 15px ${signalColor}80` }}>
        x{multiplier.toFixed(1)}
      </div>
      <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden mt-1">
        <motion.div 
          initial={false}
          animate={{ width: `${(multiplierTimer / 3.0) * 100}%` }}
          className="h-full"
          style={{ backgroundColor: signalColor }}
        />
      </div>
    </div>
  );
});

export const Radar = memo(() => {
  const enemies = useGameStore(state => state.enemies);
  const sync = useGameStore(state => state.syncLevel);
  const playerRotation = useGameStore(state => state.playerRotation);
  const signalColor = useGameStore(state => state.signalColor);
  const hudOpacity = Math.max(0.2, 1 - (sync - 40) / 80);
  
  return (
    <div className="fixed bottom-10 left-10 z-30 pointer-events-none transition-opacity duration-1000" style={{ opacity: hudOpacity }}>
      <div className="relative w-56 h-56 rounded-full bg-black/40 backdrop-blur-md border border-white/5 p-2 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent rounded-full" />
        
        {/* Static Compass / Grid */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="absolute w-full h-[0.5px] bg-white" />
          <div className="absolute h-full w-[0.5px] bg-white" />
          <div className="border border-white w-2/3 h-2/3 rounded-full" />
          <div className="border border-white w-1/3 h-1/3 rounded-full" />
        </div>

        {/* Rotating Dots Container */}
        <div className="absolute inset-0 transition-transform duration-75" style={{ transform: `rotate(${-playerRotation}rad)` }}>
          {enemies.filter(e => e.state === 'active').map(enemy => {
            const x = ((enemy.position[0] + 100) / 200) * 224;
            const z = ((enemy.position[2] + 100) / 200) * 224;
            return (
              <motion.div 
                key={enemy.id} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                style={{ left: x - 4, top: z - 4 }}
              >
                <div className="absolute inset-0 animate-ping bg-red-500 rounded-full opacity-50" />
              </motion.div>
            );
          })}
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <p className="font-mono text-[9px] text-white/20 uppercase tracking-widest bg-black/80 px-2 border border-white/5" style={{ color: signalColor }}>Radar_Scan</p>
        </div>
      </div>
    </div>
  );
});

export const DamageIndicators = memo(() => {
  const lastHitDirection = useGameStore(state => state.lastHitDirection);
  
  return (
    <AnimatePresence>
      {lastHitDirection !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
        >
          <div 
            className="absolute inset-0 flex items-center justify-center transition-transform duration-300"
            style={{ transform: `rotate(${(-lastHitDirection * 180) / Math.PI}deg)` }}
          >
            <div className="absolute top-0 w-1 h-1/2 bg-gradient-to-b from-red-500 to-transparent opacity-40" />
            <div className="absolute top-20 w-48 h-48 bg-red-500/10 blur-3xl rounded-full" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export const AlertHUD = memo(() => {
  const alert = useGameStore(state => state.alertMessage);
  
  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 1.1 }}
          className="fixed top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-center z-50"
        >
          <div className={`px-10 py-4 rounded-xl border-2 font-display font-black italic tracking-widest text-2xl bg-black/80 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] ${
            alert.type === 'danger' ? 'border-red-500 text-red-500 shadow-red-500/20' :
            alert.type === 'warning' ? 'border-amber-500 text-amber-500 shadow-amber-500/20' :
            'border-cyan-400 text-cyan-400 shadow-cyan-400/20'
          }`}>
            {alert.text.toUpperCase()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export const AssistantHUD = memo(() => {
  const messages = useGameStore(state => state.assistantMessages);
  const signalColor = useGameStore(state => state.signalColor);
  const pointerLocked = useGameStore(state => state.pointerLocked);
  const isMobile = useGameStore(state => state.isMobile);

  return (
    <div className="fixed bottom-48 right-10 flex flex-col items-end gap-3 pointer-events-none max-w-xs text-right z-20">
      <AnimatePresence>
        {!pointerLocked && !isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-500/20 border-r-4 border-red-500 p-5 backdrop-blur-md mb-4"
          >
            <div className="text-[10px] font-display font-black uppercase tracking-[0.3em] mb-2 text-red-500 italic">
              Neural Link Interrupted
            </div>
            <div className="text-sm font-medium text-white uppercase tracking-tight leading-tight">
              Click to re-establish combat sync
            </div>
          </motion.div>
        )}
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ x: 50, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 50, opacity: 0, scale: 0.9 }}
            className="bg-black/60 border-r-4 p-5 backdrop-blur-md shadow-2xl"
            style={{ borderRightColor: signalColor }}
          >
            <div className="text-[10px] font-display font-black uppercase tracking-[0.3em] mb-2 italic flex items-center justify-end gap-2" style={{ color: signalColor }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: signalColor }} />
              Signal Received
            </div>
            <div className="text-sm font-medium text-white uppercase tracking-tight leading-tight">{message.text}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

export const ObjectivesHUD = memo(() => {
  const objectives = useGameStore(state => state.objectives);
  const signalColor = useGameStore(state => state.signalColor);
  
  return (
    <div className="fixed top-48 left-8 flex flex-col gap-4 pointer-events-none max-w-xs z-20 font-display">
      <div className="flex items-center gap-3">
        <div className="w-1 h-3 bg-white/20" />
        <div className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em]">Objectives</div>
      </div>
      <div className="space-y-2 bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/5">
        {objectives.map((obj) => (
          <div key={obj.id} className="flex items-start gap-4">
            <div 
              className="w-4 h-4 border transition-all mt-0.5"
              style={{ 
                backgroundColor: obj.completed ? signalColor : 'transparent',
                borderColor: obj.completed ? signalColor : 'rgba(255,255,255,0.2)',
                boxShadow: obj.completed ? `0 0 10px ${signalColor}` : 'none'
              }}
            />
            <span className="text-xs font-black uppercase italic tracking-wider transition-colors" style={{ color: obj.completed ? signalColor : 'rgba(255,255,255,0.6)', opacity: obj.completed ? 0.6 : 1 }}>
              {obj.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
