import { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../store';
import { Loader2, Heart, Crosshair as AimIcon, Timer, Trophy } from 'lucide-react';

export const LoadingScreen = () => (
  <div className="fixed inset-0 bg-[#050510] flex flex-col items-center justify-center z-[200]">
    <div className="relative">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }} 
        className="mb-8"
      >
        <Loader2 className="text-cyan-400" size={64} />
      </motion.div>
      <div className="absolute inset-0 blur-2xl bg-cyan-400/20 scale-150 rounded-full" />
    </div>
    <div className="flex flex-col items-center gap-2">
      <div className="text-cyan-400 font-black uppercase text-sm tracking-[0.5em] animate-pulse italic">
        INITIALIZING <span className="text-fuchsia-500">SYNC</span>
      </div>
      <div className="text-white/20 text-[8px] font-bold uppercase tracking-widest">
        Establishing Neural Link...
      </div>
    </div>
  </div>
);

export const HealthBar = memo(() => {
  const health = useGameStore(state => state.health);
  const heat = useGameStore(state => state.weaponHeat);
  const sync = useGameStore(state => state.syncLevel);
  const dashCooldown = useGameStore(state => state.dashCooldown);
  const isOverheated = useGameStore(state => state.isOverheated);
  const isCritical = health < 30;
  
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 pointer-events-none">
      <div className="flex gap-2 mb-2">
        <div className={`h-1.5 w-8 rounded-full ${dashCooldown === 0 ? 'bg-cyan-400 shadow-[0_0_8px_cyan]' : 'bg-white/10'}`} />
        <div className="text-[7px] font-black uppercase text-white/40 tracking-widest self-center">Recoil Compensator</div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <Heart className={isCritical ? 'text-red-500 animate-pulse' : 'text-cyan-400'} size={14} />
          <div className="w-64 h-2 bg-black/60 border border-white/10 rounded-full overflow-hidden backdrop-blur-md">
            <motion.div 
              initial={false}
              animate={{ 
                width: `${health}%`,
                backgroundColor: isCritical ? '#ef4444' : '#22d3ee'
              }}
              className="h-full shadow-[0_0_15px_rgba(34,211,238,0.5)]"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`text-[8px] font-black italic tracking-tighter w-4 text-center ${isOverheated ? 'text-red-500' : 'text-white/40'}`}>
            {isOverheated ? 'HOT' : 'HE'}
          </div>
          <div className="w-64 h-1 bg-black/40 border border-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={false}
              animate={{ 
                width: `${heat}%`,
                backgroundColor: isOverheated ? '#ef4444' : '#ffffff'
              }}
              className={`h-full ${isOverheated ? 'shadow-[0_0_10px_red]' : 'opacity-40'}`}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-[8px] font-black italic tracking-tighter w-4 text-center text-fuchsia-500">
            SY
          </div>
          <div className="w-64 h-1 bg-black/40 border border-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={false}
              animate={{ width: `${sync}%` }}
              className="h-full bg-fuchsia-500 shadow-[0_0_10px_fuchsia]"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export const Crosshair = memo(() => {
  const isShooting = useGameStore(state => state.isShooting);
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
      <div className="relative">
        <motion.div 
          animate={{ scale: isShooting ? 1.5 : 1, opacity: isShooting ? 1 : 0.4 }}
          className={`w-6 h-6 border-2 rounded-full transition-colors ${isShooting ? 'border-fuchsia-500' : 'border-cyan-400'}`} 
        />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full ${isShooting ? 'bg-fuchsia-500' : 'bg-cyan-400'}`} />
      </div>
    </div>
  );
});

export const ScoreHUD = memo(() => {
  const score = useGameStore(state => state.score);
  const rank = useGameStore(state => state.neuralRank);
  return (
    <div className="absolute top-6 left-6 flex flex-col gap-2 pointer-events-none">
      <div className="flex items-center gap-3 text-cyan-400 bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg border border-white/5">
        <Trophy size={18} />
        <span className="text-2xl font-black font-mono tracking-tighter">
          {score.toLocaleString()}
        </span>
      </div>
      <motion.div 
        key={rank}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="px-3 py-1 bg-fuchsia-500 text-black text-[10px] font-black uppercase tracking-widest rounded self-start italic"
      >
        Rank: {rank}
      </motion.div>
    </div>
  );
});

export const Vignette = memo(() => {
  const health = useGameStore(state => state.health);
  const sync = useGameStore(state => state.syncLevel);
  const isCritical = health < 30;
  const isLowSync = sync < 30;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <motion.div 
        animate={{ 
          opacity: isCritical ? [0.3, 0.6, 0.3] : 0.5,
          backgroundColor: isCritical ? 'rgba(255, 0, 0, 0.12)' : 'rgba(255, 0, 0, 0)'
        }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="absolute inset-0 bg-[radial-gradient(circle,transparent_45%,#000_100%)]" 
      />
      <motion.div 
        animate={{ opacity: isLowSync ? 0.1 : 0.03 }}
        className="absolute inset-0 pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" 
      />
    </div>
  );
});

export const TimerHUD = memo(() => {
  const timeLeft = useGameStore(state => state.timeLeft);
  const isUrgent = timeLeft < 20;
  
  return (
    <div className={`absolute top-6 right-6 flex items-center gap-3 pointer-events-none bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg border border-white/5 ${isUrgent ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
      <Timer size={18} />
      <span className="text-xl font-bold font-mono">
        {Math.floor(timeLeft / 60)}:{(Math.floor(timeLeft) % 60).toString().padStart(2, '0')}
      </span>
    </div>
  );
});

export const MultiplierHUD = memo(() => {
  const multiplier = useGameStore(state => state.multiplier);
  const multiplierTimer = useGameStore(state => state.multiplierTimer);
  
  if (multiplier <= 1) return null;

  return (
    <div className="absolute top-24 left-6 flex flex-col items-start gap-1 pointer-events-none">
      <div className="flex items-center gap-2 text-fuchsia-500 font-black italic text-3xl drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">
        x{multiplier.toFixed(1)}
      </div>
      <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          initial={false}
          animate={{ width: `${(multiplierTimer / 3.0) * 100}%` }}
          className="h-full bg-fuchsia-500"
        />
      </div>
    </div>
  );
});

export const Radar = memo(() => {
  const enemies = useGameStore(state => state.enemies);
  const playerRotation = useGameStore(state => state.playerRotation);
  
  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full border-2 border-white/10 bg-black/40 backdrop-blur-md pointer-events-none overflow-hidden scale-75 md:scale-100 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
      {/* Static Compass Ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_cyan] z-10" />
        <div className="absolute w-full h-[1px] bg-white/5" />
        <div className="absolute h-full w-[1px] bg-white/5" />
        <div className="absolute top-1 text-[8px] font-black text-cyan-400 opacity-40 italic">N</div>
      </div>

      {/* Rotating Dots Container */}
      <div className="absolute inset-0 transition-transform duration-75" style={{ transform: `rotate(${-playerRotation}rad)` }}>
        {enemies.filter(e => e.state === 'active').map(enemy => {
          // Map from arena coordinates (-100 to 100) to radar coordinates (0 to 192)
          // Since the container rotates, absolute coordinate mapping works!
          const x = ((enemy.position[0] + 100) / 200) * 192;
          const z = ((enemy.position[2] + 100) / 200) * 192;
          return (
            <motion.div 
              key={enemy.id} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"
              style={{ left: x - 4, top: z - 4 }}
            >
              <div className="absolute inset-0 animate-ping bg-red-500 rounded-full opacity-75" />
            </motion.div>
          );
        })}
      </div>
      <div className="absolute inset-0 border-[12px] border-black/40 rounded-full" />
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
          className="absolute inset-0 pointer-events-none z-50 overflow-hidden"
        >
          <motion.div 
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,rgba(239,68,68,0.4)_70%)]"
          />
          {/* Directional Indicator */}
          <div 
            className="absolute inset-0 flex items-center justify-center transition-transform duration-300"
            style={{ transform: `rotate(${(-lastHitDirection * 180) / Math.PI}deg)` }}
          >
            <div className="absolute top-10 w-32 h-32 bg-red-500/40 blur-3xl rounded-full" />
            <div className="absolute top-0 w-1 h-32 bg-gradient-to-b from-red-500 to-transparent" />
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
          className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-center z-50"
        >
          <div className={`px-8 py-3 rounded-lg border-2 font-black italic tracking-widest text-xl bg-black/80 backdrop-blur-xl shadow-2xl ${
            alert.type === 'danger' ? 'border-red-500 text-red-500' :
            alert.type === 'warning' ? 'border-yellow-400 text-yellow-400' :
            'border-cyan-400 text-cyan-400'
          }`}>
            {alert.text}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export const AssistantHUD = memo(() => {
  const messages = useGameStore(state => state.assistantMessages);
  
  return (
    <div className="absolute top-32 right-6 flex flex-col items-end gap-2 pointer-events-none max-w-xs text-right">
      <AnimatePresence>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ x: 50, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 50, opacity: 0, scale: 0.9 }}
            className="bg-black/60 border-r-4 border-cyan-400 p-3 backdrop-blur-xl"
          >
            <div className="text-[8px] font-black uppercase text-cyan-400/60 tracking-widest mb-1 italic">Neural Assistant</div>
            <div className="text-xs font-bold text-white uppercase tracking-tight">{message.text}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

export const ObjectivesHUD = memo(() => {
  const objectives = useGameStore(state => state.objectives);
  
  return (
    <div className="absolute top-48 left-6 flex flex-col gap-2 pointer-events-none max-w-xs">
      <div className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] mb-1">Active Objectives</div>
      <div className="space-y-2">
        {objectives.map((obj) => (
          <div key={obj.id} className="flex items-center gap-3">
            <div className={`w-3 h-3 border-2 ${obj.completed ? 'bg-cyan-400 border-cyan-400' : 'border-white/20'} transition-colors`} />
            <span className={`text-[11px] font-black uppercase italic tracking-wider ${obj.completed ? 'text-cyan-400' : 'text-white/60'}`}>
              {obj.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
