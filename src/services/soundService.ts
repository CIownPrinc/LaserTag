class SoundManager {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;
  private lastPlayTimes: Record<string, number> = {};
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;

  private canPlay(key: string, cooldown: number = 80): boolean {
    const now = Date.now();
    if (now - (this.lastPlayTimes[key] || 0) > cooldown) {
      this.lastPlayTimes[key] = now;
      return true;
    }
    return false;
  }

  private init() {
    if (this.isInitialized) return;
    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.connect(this.audioCtx.destination);
      this.masterGain.gain.value = 0.3; // Default volume
      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext not supported', e);
    }
  }

  private playOscillator(
    type: OscillatorType,
    freq: number,
    duration: number,
    volume = 0.5,
    freqSlide = 0,
    position?: [number, number, number],
    listenerPos?: [number, number, number]
  ) {
    if (!this.isInitialized) this.init();
    if (!this.audioCtx || !this.masterGain) return;

    let finalVolume = volume;
    if (position && listenerPos) {
      const dist = Math.sqrt(
        (position[0] - listenerPos[0]) ** 2 +
        (position[1] - listenerPos[1]) ** 2 +
        (position[2] - listenerPos[2]) ** 2
      );
      finalVolume *= Math.max(0, 1 - dist / 50);
    }

    if (finalVolume <= 0.001) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    if (freqSlide !== 0) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, freq + freqSlide),
        this.audioCtx.currentTime + duration
      );
    }

    gain.gain.setValueAtTime(finalVolume, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  private playNoise(duration: number, volume = 0.1, position?: [number, number, number], listenerPos?: [number, number, number]) {
    if (!this.isInitialized) this.init();
    if (!this.audioCtx || !this.masterGain) return;

    let finalVolume = volume;
    if (position && listenerPos) {
      const dist = Math.sqrt(
        (position[0] - listenerPos[0]) ** 2 +
        (position[1] - listenerPos[1]) ** 2 +
        (position[2] - listenerPos[2]) ** 2
      );
      finalVolume *= Math.max(0, 1 - dist / 50);
    }

    if (finalVolume <= 0.001) return;

    const bufferSize = this.audioCtx.sampleRate * duration;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.audioCtx.createBufferSource();
    const gain = this.audioCtx.createGain();

    source.buffer = buffer;
    gain.gain.setValueAtTime(finalVolume, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

    source.connect(gain);
    gain.connect(this.masterGain);

    source.start();
    source.stop(this.audioCtx.currentTime + duration);
  }

  playShoot(position?: [number, number, number], listenerPos?: [number, number, number]) {
    if (!this.canPlay('shoot', 50)) return;
    this.playOscillator('sawtooth', 880, 0.1, 0.4, -600, position, listenerPos);
  }

  playHit(position?: [number, number, number], listenerPos?: [number, number, number]) {
    if (!this.canPlay('hit', 100)) return;
    this.playOscillator('sine', 150, 0.15, 0.6, -100, position, listenerPos);
    this.playNoise(0.1, 0.2, position, listenerPos);
  }

  playPowerup(position?: [number, number, number], listenerPos?: [number, number, number]) {
    if (!this.canPlay('powerup', 1000)) return;
    this.playOscillator('square', 440, 0.4, 0.3, 880, position, listenerPos);
    setTimeout(() => this.playOscillator('square', 880, 0.4, 0.3, 440, position, listenerPos), 100);
  }

  playWalk() {
    if (!this.canPlay('walk', 300)) return;
    this.playOscillator('sine', 60, 0.05, 0.1, -20);
  }

  playJump() {
    if (!this.canPlay('jump', 500)) return;
    this.playOscillator('triangle', 300, 0.1, 0.2, 400);
  }

  playCrouch() {
    if (!this.canPlay('crouch', 200)) return;
    this.playOscillator('sine', 200, 0.1, 0.15, -100);
  }

  playSlide() {
    if (!this.canPlay('slide', 300)) return;
    this.playNoise(0.1, 0.05);
  }

  playUI() {
    if (!this.canPlay('ui', 50)) return;
    this.playOscillator('sine', 1200, 0.05, 0.2);
  }
  
  playUINegative() {
     if (!this.canPlay('ui-neg', 100)) return;
     this.playOscillator('sine', 300, 0.2, 0.2, -150);
  }

  playError() {
    if (!this.canPlay('error', 500)) return;
    this.playOscillator('square', 100, 0.2, 0.3, -50);
  }

  playObjective() {
    if (!this.canPlay('objective', 2000)) return;
    this.playOscillator('sine', 600, 0.1, 0.3, 200);
    setTimeout(() => this.playOscillator('sine', 800, 0.2, 0.3, 0), 100);
  }

  startAmbient() {
    if (!this.isInitialized) this.init();
    if (!this.audioCtx || !this.masterGain || this.ambientOsc) return;

    this.ambientOsc = this.audioCtx.createOscillator();
    this.ambientGain = this.audioCtx.createGain();

    this.ambientOsc.type = 'sine';
    this.ambientOsc.frequency.setValueAtTime(40, this.audioCtx.currentTime);
    
    this.ambientGain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
    
    this.ambientOsc.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);
    
    this.ambientOsc.start();
  }

  updateAmbient(sync: number, multiplier: number) {
    if (!this.audioCtx || !this.ambientOsc || !this.ambientGain) return;
    
    // Frequency shifts up with sync/multiplier
    const targetFreq = 40 + (sync * 0.2) + (multiplier * 5);
    this.ambientOsc.frequency.setTargetAtTime(targetFreq, this.audioCtx.currentTime, 0.1);
    
    // Volume increases slightly with higher intensity
    const targetVol = 0.05 + (sync / 100) * 0.05 + (multiplier / 10) * 0.05;
    this.ambientGain.gain.setTargetAtTime(targetVol, this.audioCtx.currentTime, 0.1);
  }

  stopAmbient() {
    if (this.ambientOsc) {
      this.ambientOsc.stop();
      this.ambientOsc.disconnect();
      this.ambientOsc = null;
    }
  }
}

export const soundManager = new SoundManager();
