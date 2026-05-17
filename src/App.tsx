import { useEffect, useState, Component, ReactNode, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager } from './services/soundService';
import { KeyboardControls } from '@react-three/drei';
import { useGameStore } from './store';
import { Game } from './components/Game';
import { 
  HealthBar, Crosshair, ScoreHUD, TimerHUD, 
  MultiplierHUD, AlertHUD, Vignette, Radar, 
  DamageIndicators, AssistantHUD, ObjectivesHUD 
} from './components/HUD';
import { MobileControls } from './components/MobileControls';
import { 
  Trophy, AlertTriangle, Settings, Play, LogOut, 
  Network, Sliders, Target, Shield, Zap, Activity,
  Cpu, User
} from 'lucide-react';

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
          <h2 className="text-4xl font-black text-white italic mb-4 font-display uppercase">NEURAL LINK FAILURE</h2>
          <p className="text-white/60 font-mono text-sm max-w-md mb-8">
            A critical error occurred while initializing the combat simulation. 
            <br/><span className="text-red-400/80 text-[10px] mt-2 block">{this.state.error?.message}</span>
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-white text-black font-black uppercase italic tracking-widest rounded-xl hover:bg-cyan-400 transition-colors"
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
  const signalColor = useGameStore(state => state.signalColor);
  const setSignalColor = useGameStore(state => state.setSignalColor);
  const leaveGame = useGameStore(state => state.leaveGame);
  
  const SIGNAL_COLORS = [
    { name: 'CYAN', color: '#00dbe9' },
    { name: 'PINK', color: '#fe00fe' },
    { name: 'LIME', color: '#c3f400' },
    { name: 'AMBER', color: '#ffabf3' },
    { name: 'RED', color: '#ef4444' }
  ];

  return (
    <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-w-md w-full bg-black/60 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative shadow-2xl overflow-hidden"
      >
        <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        
        <h2 className="text-4xl font-black text-white italic tracking-tighter mb-8 flex items-center justify-between font-display">
          PAUSED 
          <span className="text-[9px] uppercase font-black tracking-[0.5em] text-cyan-400 opacity-50">Link Suspended</span>
        </h2>
        
        <div className="space-y-8 mb-10 text-left">
          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase text-white/30 tracking-[0.3em]">Neural ID</label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toUpperCase())}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-cyan-400/50 uppercase tracking-widest text-sm transition-all"
              placeholder="ENTER CODENAME..."
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-[9px] font-black uppercase text-white/30 tracking-[0.3em]">
              <div className="flex items-center gap-2">
                <Settings size={10} className="text-cyan-400" />
                Response Sensitivity
              </div>
              <span className="text-cyan-400 font-mono tracking-tighter">{(sensitivity * 100).toFixed(0)}%</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="5" 
              step="0.1"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="space-y-4">
            <div className="text-[9px] font-black uppercase text-white/30 tracking-[0.3em]">Signal Frequency</div>
            <div className="flex gap-3">
              {SIGNAL_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSignalColor(c.color)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${signalColor === c.color ? 'border-white scale-110' : 'border-transparent opacity-40 hover:opacity-100'}`}
                  style={{ backgroundColor: c.color }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: "rgba(0,219,233,1)" }}
            whileTap={{ scale: 0.98 }}
            onClick={onResume}
            className="h-14 bg-cyan-400 text-black font-black uppercase tracking-[0.2em] italic rounded-2xl flex items-center justify-center gap-3 text-xs shadow-[0_0_20px_rgba(0,219,233,0.2)] font-display"
          >
            <Play size={16} fill="currentColor" />
            Resume Link
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }}
            whileTap={{ scale: 0.98 }}
            onClick={leaveGame}
            className="h-14 bg-white/5 border border-white/10 text-white/60 font-black uppercase tracking-[0.2em] italic rounded-2xl flex items-center justify-center gap-3 text-xs font-display"
          >
            <LogOut size={16} />
            Disconnect
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
  const signalColor = useGameStore(state => state.signalColor);
  const setSignalColor = useGameStore(state => state.setSignalColor);
  const rank = useGameStore(state => state.neuralRank);
  const setAlert = useGameStore(state => state.setAlert);
  const tunerRef = useRef<HTMLDivElement>(null);
  
  const scrollToTuner = () => {
    tunerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const SIGNAL_COLORS = [
    { name: 'CYAN', color: '#00dbe9' },
    { name: 'PINK', color: '#fe00fe' },
    { name: 'LIME', color: '#c3f400' },
    { name: 'AMBER', color: '#ffabf3' },
    { name: 'RED', color: '#ef4444' }
  ];

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#131313] pointer-events-auto overflow-hidden font-sans scanlines grid-bg">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-cyan-400/20 backdrop-blur-md flex justify-between items-center px-8 py-4">
        <div className="flex items-center gap-3">
          <Activity className="text-cyan-400" size={24} />
          <h1 className="font-display text-2xl font-black tracking-tighter text-cyan-400 uppercase">NEURAL LINK // SIM-SPACE</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-8">
            {['HOME', 'ARCHIVES', 'COMMS'].map(item => (
              <button 
                key={item} 
                onClick={() => {
                  if (item === 'HOME') window.scrollTo({ top: 0, behavior: 'smooth' });
                  else setAlert(`NEURAL ${item} CONNECTION PENDING: ACCESS CLASSIFIED`, 'info');
                }}
                className="text-[10px] font-black tracking-[0.3em] text-white/40 hover:text-white transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
          <Zap className="text-cyan-400" size={24} />
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-80 bg-black/40 backdrop-blur-xl border-r border-[#fe00fe]/30 flex flex-col pt-24 z-40 hidden md:flex">
        <div className="px-8 py-8 border-b border-white/5 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full border-2 border-[#ffabf3] p-1 overflow-hidden bg-white/5">
              <User className="w-full h-full text-white/20" />
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-sm font-black text-[#ffabf3] tracking-widest uppercase">{username || "OPERATOR_01"}</h2>
              <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest">STABILITY: 98.4%</p>
            </div>
          </div>
          <div className="mt-6 bg-[#fe00fe]/10 px-4 py-1.5 border-l-2 border-[#fe00fe] inline-block">
            <span className="font-display text-[10px] font-bold text-[#ffabf3] tracking-widest uppercase">RANK: {rank}</span>
          </div>
        </div>

        <nav className="flex-grow py-4">
          <SidebarLink icon={<Network size={20}/>} label="ESTABLISH LINK" active onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          <SidebarLink icon={<Sliders size={20}/>} label="SIGNAL TUNER" onClick={scrollToTuner} />
          <SidebarLink icon={<Target size={20}/>} label="TRAINING GROUNDS" onClick={() => startGame(true)} />
        </nav>

        <div className="p-8 border-t border-white/5 space-y-4">
           <div className="space-y-2">
             <div className="flex justify-between text-[8px] font-black tracking-widest text-white/20 uppercase">
               <span>SYSTEM INTEGRITY</span>
               <span>92%</span>
             </div>
             <div className="h-1 bg-white/5 w-full relative">
               <div className="absolute inset-y-0 left-0 bg-cyan-400 w-11/12 shadow-[0_0_10px_rgba(0,219,233,0.5)]" />
             </div>
           </div>
           <button 
             onClick={() => {
               soundManager.playWalk(); // UI click
               setTimeout(() => window.location.reload(), 300);
             }}
             className="w-full border border-red-500/50 text-red-500 py-3 font-display text-[10px] font-black tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-red-500/10 transition-all uppercase"
           >
             <LogOut size={14} /> ABORT LINK
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:pl-80 pt-24 pb-12 px-8 flex-grow flex items-center justify-center relative">
        <div className="w-full max-w-5xl flex flex-col items-center gap-12 text-center">
          
          {/* Header Section */}
          <div className="relative group text-center">
            <h1 className="font-display text-7xl md:text-9xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              NEURAL <span className="text-cyan-400">LINK</span>
            </h1>
            <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent mt-4 opacity-70" />
            <p className="text-[10px] md:text-sm font-black tracking-[0.6em] text-white/30 uppercase mt-6">Advanced Tactical Simulation Environment</p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
            {/* Play Button Card */}
            <motion.button
              whileHover={{ scale: 1.02, borderColor: '#00dbe9' }}
              onClick={() => {
                startGame();
                setTimeout(() => useGameStore.getState().requestGameLock(), 200);
              }}
              className="md:col-span-2 group relative bg-black/40 border border-cyan-400/30 p-10 rounded-2xl flex flex-col justify-between items-start text-left min-h-[320px] transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Network size={48} className="text-cyan-400 mb-8" />
              <div className="space-y-4">
                <h3 className="font-display text-4xl font-black text-cyan-400 uppercase tracking-tight">START GAME</h3>
                <p className="text-sm font-medium text-white/50 leading-relaxed max-w-[280px]">Deploy to the active simulation zone.</p>
              </div>
              <div className="mt-8 px-8 py-3 bg-cyan-400 text-black font-display font-black text-xs tracking-widest uppercase transform group-hover:scale-105 transition-transform">DEPLOY</div>
            </motion.button>

            {/* Customization Card */}
            <div ref={tunerRef} className="bg-black/40 border border-[#fe00fe]/20 p-8 rounded-2xl flex flex-col justify-between items-start text-left hover:border-[#fe00fe] transition-all group">
              <Sliders size={32} className="text-[#fe00fe] mb-8" />
              <div className="space-y-4">
                <h4 className="font-display text-2xl font-black text-[#ffabf3] uppercase tracking-tight">SIGNAL</h4>
                <div className="flex gap-2">
                  {SIGNAL_COLORS.map(c => (
                    <button 
                      key={c.name}
                      onClick={() => setSignalColor(c.color)}
                      className={`w-6 h-6 rounded-md transition-all ${signalColor === c.color ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : 'opacity-40 hover:opacity-100'}`}
                      style={{ backgroundColor: c.color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Training Card */}
            <motion.button 
              whileHover={{ scale: 1.02, borderColor: '#c3f400' }}
              onClick={() => startGame(true)}
              className="bg-black/40 border border-[#c3f400]/20 p-8 rounded-2xl flex flex-col justify-between items-start text-left hover:border-[#c3f400] transition-all"
            >
              <Target size={32} className="text-[#c3f400] mb-8" />
              <div className="space-y-4">
                <h4 className="font-display text-2xl font-black text-[#e9ffa8] uppercase tracking-tight">GROUNDS</h4>
                <p className="text-xs font-medium text-white/40 italic">Recalibrate skills in zero-stakes scenarios.</p>
              </div>
            </motion.button>

            {/* Status Footer Card */}
            <div className="md:col-span-4 bg-white/5 border border-white/5 rounded-3xl p-8 flex flex-wrap items-center justify-around gap-12 backdrop-blur-md">
              <Status readout="98.4%" label="Sync Integrity" color="text-cyan-400" />
              <Status readout={rank} label="Combat Rank" color="text-[#ffabf3]" />
              <Status readout="NOMINAL" label="System Status" color="text-[#c3f400]" />
              
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Operator Neural ID</span>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toUpperCase())}
                    className="bg-transparent text-white font-mono text-xl outline-none text-right placeholder-white/10"
                    placeholder="ENTER ID..."
                  />
                </div>
                <div className="w-px h-12 bg-white/5 hidden md:block" />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-black text-cyan-400 italic">ACTIVE_SESSION</span>
                  <span className="text-[9px] font-mono text-white/40">ZONE: US-EAST-1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Decorative Corners */}
      <div className="fixed top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-cyan-400/20 z-50 pointer-events-none" />
      <div className="fixed top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-cyan-400/20 z-50 pointer-events-none" />
      <div className="fixed bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-cyan-400/20 z-50 pointer-events-none" />
      <div className="fixed bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-cyan-400/20 z-50 pointer-events-none" />
    </div>
  );
};

const SidebarLink = ({ icon, label, active = false, onClick }: { icon: ReactNode, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full px-8 py-5 flex items-center gap-6 transition-all duration-300 group ${active ? 'bg-[#fe00fe]/10 border-l-4 border-[#fe00fe] text-[#ffabf3]' : 'text-white/30 hover:text-white/60 hover:translate-x-2'}`}
  >
    <span className={`${active ? 'text-[#fe00fe]' : 'group-hover:text-white/50'}`}>{icon}</span>
    <span className="font-display font-black text-xs tracking-[0.2em]">{label}</span>
  </button>
);

const Status = ({ label, readout, color }: { label: string, readout: string, color: string }) => (
  <div className="flex flex-col items-center gap-1">
    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] font-display">{label}</span>
    <span className={`text-2xl font-black font-display tracking-tighter ${color}`}>{readout}</span>
  </div>
);

const GameOver = () => {
  const results = useGameStore(state => state.matchResults);
  const score = useGameStore(state => state.score);
  const rank = useGameStore(state => state.neuralRank);
  const leaveGame = useGameStore(state => state.leaveGame);
  
  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#131313] text-center px-4 overflow-hidden pointer-events-auto scanlines grid-bg">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full"
      >
        <div className="mb-16 relative">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 font-mono text-[9px] text-[#00dbe9] uppercase tracking-[0.4em] opacity-40">
            Session ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}
          </div>
          <div className="text-[10px] font-display font-black uppercase tracking-[1.5em] text-[#00dbe9]/50 mb-4 animate-pulse">Diagnostic Report Verified</div>
          <h2 className="text-8xl md:text-[100px] text-white font-black italic tracking-tighter uppercase drop-shadow-[0_0_50px_rgba(254,0,254,0.3)] font-display">
            SESSION <span className="text-[#fe00fe]">SUMMARY</span>
          </h2>
          <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-[#fe00fe] to-transparent mt-4 opacity-50" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatBox label="Neural Sync" value={score.toLocaleString()} color="text-white" />
          <StatBox label="Units Resolved" value={results?.stabilizations || 0} color="text-[#fe00fe]" />
          <StatBox label="Peak Intensity" value={`x${results?.maxThroughput.toFixed(1) || '1.0'}`} color="text-[#00dbe9]" />
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center backdrop-blur-xl border-t-[#c3f400] border-t-4">
            <div className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em] mb-1 font-display">Final Rank</div>
            <div className="text-2xl font-black text-[#e9ffa8] italic font-display uppercase tracking-tighter">{rank}</div>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 mb-12">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-xl text-left relative overflow-hidden group">
            <h3 className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em] mb-8 font-display">Neural Metrics</h3>
            <div className="space-y-8">
              <SyncBar label="Accuracy" val={Math.min(100, (results?.stabilizations || 0) * 8)} color="bg-[#fe00fe]" />
              <SyncBar label="Movement" val={Math.min(100, (score / 4000) * 100)} color="bg-[#00dbe9]" />
              <SyncBar label="Steadiness" val={78} color="bg-[#c3f400]" />
            </div>
          </div>

          <div className="flex-1 bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-xl text-left flex flex-col justify-between">
            <div>
              <h3 className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em] mb-6 font-display">Diagnostic Findings</h3>
              <div className="space-y-4">
                {(results?.stabilizations || 0) < 5 ? (
                  <p className="text-sm text-white/70 italic leading-relaxed">
                    <span className="text-[#fe00fe] font-black">WARNING:</span> Low combat throughput detected. Recommend immediate redeployment to active simulation for combat calibration.
                  </p>
                ) : (results?.maxThroughput || 0) < 3 ? (
                  <p className="text-sm text-white/70 italic leading-relaxed">
                    <span className="text-[#00dbe9] font-black">ADVICE:</span> Combat efficiency optimal, but peak flow remains untapped. Focus on maintaining momentum to maximize neural throughput.
                  </p>
                ) : (
                  <p className="text-sm text-white/70 italic leading-relaxed">
                    <span className="text-[#c3f400] font-black">STATUS:</span> High-fidelity synchronization achieved. Performance exceeds standard operational parameters for this sector.
                  </p>
                )}
                <div className="pt-4 border-t border-white/5">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
                    Final link stability recorded at 98.4%. No permanent neural degradation detected during this session.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full">
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: '#00dbe9' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => useGameStore.getState().startGame()}
            className="flex-1 h-20 bg-white text-black font-display font-black uppercase tracking-[0.5em] italic text-sm rounded-xl shadow-lg transition-colors"
          >
            Deploy Again
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={leaveGame}
            className="flex-1 h-20 bg-transparent border border-white/20 text-white/60 font-display font-black uppercase tracking-[0.5em] italic text-sm rounded-xl transition-colors"
          >
            Return to Menu
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};


const StatBox = ({ label, value, color }: { label: string, value: string | number, color: string }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl group hover:border-white/20 transition-colors">
    <div className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em] mb-2 font-display">{label}</div>
    <div className={`text-4xl font-black font-display tracking-tighter ${color} group-hover:scale-110 transition-transform`}>{value}</div>
  </div>
);

const SyncBar = ({ label, val, color }: { label: string, val: number, color: string }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center text-[10px]">
      <span className="text-white/60 font-black uppercase italic tracking-[0.2em] font-display">{label}</span>
      <span className={`font-black font-display text-lg ${color.replace('bg-', 'text-')}`}>{val.toFixed(1)}%</span>
    </div>
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${val}%` }}
        transition={{ duration: 1.5, ease: "circOut" }}
        className={`h-full ${color} shadow-[0_0_20px_currentColor]`}
      />
    </div>
  </div>
);

export default function App() {
  const gameState = useGameStore(state => state.gameState);
  const pointerLocked = useGameStore(state => state.pointerLocked);
  const isMobile = useGameStore(state => state.isMobile);
  const setIsMobile = useGameStore(state => state.setIsMobile);

  const multiplier = useGameStore(state => state.multiplier);
  const syncLevel = useGameStore(state => state.syncLevel);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768 || ('ontouchstart' in window);
      setIsMobile(mobile);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      soundManager.startAmbient();
    } else {
      soundManager.stopAmbient();
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing') {
      soundManager.updateAmbient(syncLevel, multiplier);
    }
  }, [syncLevel, multiplier, gameState]);

  return (
    <KeyboardControls
      map={[
        { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
        { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
        { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
        { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
        { name: 'jump', keys: ['Space', ' '] },
        { name: 'sprint', keys: ['Shift'] },
        { name: 'dash', keys: ['q', 'Q', 'e', 'E', 'f', 'F'] },
        { name: 'crouch', keys: ['Control', 'c', 'C'] },
      ]}
    >
      <div className="w-full h-full bg-black relative overflow-hidden select-none font-sans">
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
            <PauseMenu onResume={() => useGameStore.getState().requestGameLock()} />
          )}
        </div>
      )}
    </div>
  </KeyboardControls>
  );
}
