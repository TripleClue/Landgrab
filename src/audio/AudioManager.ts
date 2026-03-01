interface ToneConfig {
  waveform: OscillatorType;
  startFreq: number;
  endFreq: number;
  duration: number;
  attack: number;
  release: number;
  volume: number;
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch {
      // Audio not available
    }
  }

  resume(): void {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 1;
    }
    return this.muted;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  playTone(config: ToneConfig): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = config.waveform;
    osc.frequency.setValueAtTime(config.startFreq, now);
    if (config.endFreq !== config.startFreq) {
      osc.frequency.exponentialRampToValueAtTime(config.endFreq, now + config.duration);
    }

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(config.volume, now + config.attack);
    gain.gain.linearRampToValueAtTime(
      config.volume * 0.7,
      now + config.duration - config.release
    );
    gain.gain.linearRampToValueAtTime(0, now + config.duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + config.duration);
  }

  playNoiseBurst(duration: number, volume: number): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    source.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }

  // Game-specific sounds
  playClaimSound(): void {
    this.playTone({
      waveform: 'triangle',
      startFreq: 400, endFreq: 800,
      duration: 0.15, attack: 0.01, release: 0.05,
      volume: 0.2,
    });
  }

  playEncirclementStart(): void {
    this.playTone({
      waveform: 'sine',
      startFreq: 80, endFreq: 80,
      duration: 0.3, attack: 0.1, release: 0.1,
      volume: 0.3,
    });
    this.playNoiseBurst(0.1, 0.2);
  }

  playEncirclementFlip(index: number, total: number): void {
    const freq = 300 + (index / total) * 700;
    this.playTone({
      waveform: 'sine',
      startFreq: freq, endFreq: freq * 1.1,
      duration: 0.08, attack: 0.01, release: 0.03,
      volume: 0.12,
    });
  }

  playEncirclementComplete(): void {
    [1, 1.25, 1.5].forEach((ratio, i) => {
      setTimeout(() => {
        this.playTone({
          waveform: 'sine',
          startFreq: 440 * ratio, endFreq: 440 * ratio,
          duration: 0.5, attack: 0.05, release: 0.2,
          volume: 0.2,
        });
      }, i * 30);
    });
  }

  playPulseSound(): void {
    this.playTone({
      waveform: 'sine',
      startFreq: 60, endFreq: 40,
      duration: 0.6, attack: 0.05, release: 0.3,
      volume: 0.25,
    });
  }

  playRevolutionSound(): void {
    this.playNoiseBurst(0.3, 0.4);
    this.playTone({
      waveform: 'sawtooth',
      startFreq: 100, endFreq: 1200,
      duration: 1.0, attack: 0.1, release: 0.3,
      volume: 0.25,
    });
  }

  playVictorySound(): void {
    [1, 1.25, 1.5, 2].forEach((ratio, i) => {
      setTimeout(() => {
        this.playTone({
          waveform: 'sine',
          startFreq: 330 * ratio, endFreq: 330 * ratio,
          duration: 0.8, attack: 0.05, release: 0.3,
          volume: 0.25,
        });
      }, i * 150);
    });
  }
}
