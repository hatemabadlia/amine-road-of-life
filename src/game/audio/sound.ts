// Procedural audio with the Web Audio API: no asset files are required.
// Neighbourhood ambience (wind + distant traffic + birds/crickets), footsteps,
// UI and story cues. Fails silently where audio is unavailable.

type Ctx = AudioContext;

class Sound {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private amb: GainNode | null = null;
  private sfx: GainNode | null = null;
  private vols = { master: 0.8, ambience: 0.6, sfx: 0.8 };
  private noise: AudioBuffer | null = null;
  private night = false;

  /** Must be called from a user gesture. */
  unlock() {
    if (typeof window === 'undefined') return;
    try {
      if (!this.ctx) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.amb = this.ctx.createGain();
        this.sfx = this.ctx.createGain();
        this.amb.connect(this.master);
        this.sfx.connect(this.master);
        this.master.connect(this.ctx.destination);
        this.applyVolumes();
        this.noise = this.makeNoise();
        this.startAmbience();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  setVolumes(master: number, ambience: number, sfx: number) {
    this.vols = { master, ambience, sfx };
    this.applyVolumes();
  }

  setNight(night: boolean) {
    this.night = night;
  }

  suspend(v: boolean) {
    if (!this.ctx) return;
    if (v) void this.ctx.suspend();
    else void this.ctx.resume();
  }

  private applyVolumes() {
    if (!this.master || !this.amb || !this.sfx) return;
    this.master.gain.value = this.vols.master;
    this.amb.gain.value = this.vols.ambience * 0.5;
    this.sfx.gain.value = this.vols.sfx;
  }

  private makeNoise(): AudioBuffer {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02; // brown-ish
      d[i] = last * 3.5;
    }
    return buf;
  }

  private startAmbience() {
    const ctx = this.ctx!;
    // wind / distant city bed
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    const g = ctx.createGain();
    g.gain.value = 0.35;
    src.connect(lp).connect(g).connect(this.amb!);
    src.start();
    const loop = () => {
      if (!this.ctx) return;
      if (this.night) this.cricket();
      else if (Math.random() < 0.6) this.bird();
      else this.carPass();
      window.setTimeout(loop, 1800 + Math.random() * 4000);
    };
    loop();
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, out: AudioNode | null, slideTo?: number, delay = 0) {
    if (!this.ctx || !out) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private burst(dur: number, freq: number, gain: number, out: AudioNode | null, q = 1) {
    if (!this.ctx || !out || !this.noise) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(out);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  private bird() {
    const base = 2200 + Math.random() * 1800;
    const n = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) this.tone(base, 0.09, 'sine', 0.05, this.amb, base * 1.4, i * 0.12);
  }
  private cricket() {
    for (let i = 0; i < 6; i++) this.tone(4400, 0.03, 'square', 0.012, this.amb, undefined, i * 0.06);
  }
  private carPass() {
    this.burst(2.5, 180, 0.25, this.amb, 0.7);
  }

  footstep(running: boolean) {
    this.burst(running ? 0.07 : 0.09, running ? 900 : 700, running ? 0.35 : 0.25, this.sfx, 2);
  }
  kick() {
    this.tone(120, 0.15, 'sine', 0.6, this.sfx, 50);
    this.burst(0.06, 1500, 0.3, this.sfx, 1);
  }
  ui() {
    this.tone(660, 0.06, 'triangle', 0.08, this.sfx);
  }
  blip() {
    this.tone(880, 0.03, 'sine', 0.03, this.sfx);
  }
  choice() {
    this.tone(523, 0.08, 'triangle', 0.1, this.sfx);
    this.tone(784, 0.12, 'triangle', 0.08, this.sfx, undefined, 0.07);
  }
  coin() {
    this.tone(1318, 0.08, 'square', 0.04, this.sfx);
    this.tone(1760, 0.14, 'square', 0.04, this.sfx, undefined, 0.07);
  }
  objective() {
    [523, 659, 784].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.09, this.sfx, undefined, i * 0.09));
  }
  chapter() {
    [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.5, 'sine', 0.08, this.sfx, undefined, i * 0.14));
  }
  alert() {
    this.tone(440, 0.2, 'sawtooth', 0.05, this.sfx, 330);
  }
  goal() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.25, 'square', 0.05, this.sfx, undefined, i * 0.08));
    this.burst(1.2, 1200, 0.2, this.sfx, 0.5);
  }
}

export const sound = new Sound();
