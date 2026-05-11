class SoundManager {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;
  private lastPlayTimes: Record<string, number> = {};

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
    this.playOscillator('sine', 150, 0.15, 0.6, -100, position, listenerPos);
    this.playNoise(0.1, 0.2, position, listenerPos);
  }

  playPowerup(position?: [number, number, number], listenerPos?: [number, number, number]) {
    this.playOscillator('square', 440, 0.4, 0.3, 880, position, listenerPos);
    setTimeout(() => this.playOscillator('square', 880, 0.4, 0.3, 440, position, listenerPos), 100);
  }

  playWalk() {
    if (!this.canPlay('walk', 250)) return;
    this.playOscillator('sine', 60, 0.05, 0.1, -20);
  }

  playJump() {
    if (!this.canPlay('jump', 300)) return;
    this.playOscillator('triangle', 300, 0.1, 0.2, 400);
  }

  playCrouch() {
    this.playOscillator('sine', 200, 0.1, 0.15, -100);
  }

  playSlide() {
    this.playNoise(0.1, 0.05);
  }

  playUI() {
    this.playOscillator('sine', 1200, 0.05, 0.2);
  }
  
  playUINegative() {
     this.playOscillator('sine', 300, 0.2, 0.2, -150);
  }

  playError() {
    this.playOscillator('square', 100, 0.2, 0.3, -50);
  }

  playObjective() {
    this.playOscillator('sine', 600, 0.1, 0.3, 200);
    setTimeout(() => this.playOscillator('sine', 800, 0.2, 0.3, 0), 100);
  }
}

export const soundManager = new SoundManager();
