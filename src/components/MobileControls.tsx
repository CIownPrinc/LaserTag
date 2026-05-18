/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useRef, useState } from 'react';
import { useGameStore } from '../store';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
  className?: string;
  label?: string;
}

function Joystick({ onMove, className, label }: JoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const origin = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    origin.current = { x: centerX, y: centerY };
    isDragging.current = true;
    containerRef.current.setPointerCapture(e.pointerId);
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const maxDist = 35;
    const dx = e.clientX - origin.current.x;
    const dy = e.clientY - origin.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let x = dx;
    let y = dy;
    if (dist > maxDist) {
      const angle = Math.atan2(dy, dx);
      x = Math.cos(angle) * maxDist;
      y = Math.sin(angle) * maxDist;
    }
    setPosition({ x, y });
    onMove(x / maxDist, y / maxDist);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    setPosition({ x: 0, y: 0 });
    onMove(0, 0);
    if (containerRef.current) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-28 h-28 bg-cyan-400/5 rounded-full flex items-center justify-center touch-none select-none backdrop-blur-md border border-cyan-400/20 shadow-[inset_0_0_20px_rgba(34,211,238,0.05)] ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: 'none' }}
    >
      {/* Target marker */}
      <div className="absolute w-1 h-8 bg-cyan-400/10" />
      <div className="absolute w-8 h-1 bg-cyan-400/10" />
      
      {/* Stick */}
      <div 
        className="absolute w-12 h-12 bg-cyan-400/20 rounded-full border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)] flex items-center justify-center"
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
      >
         <div className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />
      </div>
      
      {label && (
        <div className="absolute -top-6 text-cyan-400/40 text-[9px] font-black uppercase tracking-[0.3em] pointer-events-none">
          {label}
        </div>
      )}
    </div>
  );
}

export function MobileControls() {
  const setMobileInput = useGameStore(state => state.setMobileInput);
  const mobileInput = useGameStore(state => state.mobileInput);

  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none z-50 flex flex-col justify-end pb-[max(1rem,env(safe-area-inset-bottom))] px-3 sm:px-6 select-none animate-in slide-in-from-bottom-8 duration-700">
      <div className="flex justify-between items-end w-full pointer-events-auto gap-4 max-w-5xl mx-auto">
        {/* Left Side: Movement */}
        <div className="flex flex-col gap-6">
           <Joystick 
            label="Kinematic Link"
            onMove={(x, y) => setMobileInput({ move: { x, y } })} 
          />
        </div>

        {/* Center: Action Buttons */}
        <div className="flex flex-col gap-6 items-center mb-4">
           {/* Crouch Toggle */}
           <button
            className={`w-16 h-12 rounded-lg border flex items-center justify-center transition-all bg-black/60 shadow-lg ${mobileInput.crouch ? 'border-yellow-400 text-yellow-400 scale-95 shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'border-white/10 text-white/30'}`}
            onPointerDown={() => setMobileInput({ crouch: !mobileInput.crouch })}
          >
            <div className="text-[9px] font-black tracking-widest uppercase">STEALTH</div>
          </button>

          {/* Jump Button */}
          <button
            className="w-20 h-20 rounded-2xl border-2 border-fuchsia-400 bg-fuchsia-400/10 flex items-center justify-center active:scale-90 transition-all shadow-[0_0_20px_rgba(232,121,249,0.2)]"
            onPointerDown={() => {
              setMobileInput({ jump: true });
              setTimeout(() => setMobileInput({ jump: false }), 50);
            }}
          >
            <div className="text-xs font-black text-fuchsia-400 tracking-[0.2em] uppercase">THRUST</div>
          </button>
        </div>

        {/* Right Side: Aim and Fire */}
        <div className="flex flex-col items-end gap-10">
           {/* Shoot Button */}
           <button
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 flex items-center justify-center active:scale-95 transition-all touch-none relative ${mobileInput.shooting ? 'bg-red-500/30 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)]' : 'bg-red-500/5 border-red-500/30'}`}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setMobileInput({ shooting: true });
            }}
            onPointerUp={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              setMobileInput({ shooting: false });
            }}
            onPointerCancel={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              setMobileInput({ shooting: false });
            }}
            onPointerLeave={() => setMobileInput({ shooting: false })}
            style={{ touchAction: 'none' }}
          >
            <div className="absolute inset-1 rounded-full border border-red-500/20 animate-pulse" />
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-600/80 rounded-full shadow-[0_0_25px_rgba(239,68,68,0.8)] flex items-center justify-center border-t border-white/20">
               <div className="text-white font-black text-[10px] tracking-[0.3em] uppercase">ENGAGE</div>
            </div>
          </button>

          <Joystick 
            label="Visual Feed"
            className="opacity-90"
            onMove={(x, y) => setMobileInput({ look: { x, y } })} 
          />
        </div>
      </div>
    </div>
  );
}
