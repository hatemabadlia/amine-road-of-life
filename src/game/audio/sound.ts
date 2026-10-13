// Procedural audio with the Web Audio API: no asset files are required.
// Neighbourhood ambience (wind + distant traffic + birds/crickets), sounds of
// specific places (souk crowd, café, pitch, workshop, mosque courtyard, TV at
// home), surface-aware footsteps, UI and story cues, and the music (music.ts).
// Fails silently where audio is unavailable.
import { music } from './music';

export type Surface = 'tile' | 'dirt' | 'asphalt' | 'grass';

interface Place {
  x: number;
  z: number;
  /** audible radius in metres */
  r: number;
  /** hours when the place is lively */
  open: (h: number) => boolean;
  /** continuous bed: crowd murmur or a TV */
  bed?: 'crowd' | 'tv';
  /** random one-shot sounds per second at full proximity */
  events?: [rate: number, play: (s: Sound, near: number) => void][];
}

type Ctx = AudioContext;

class Sound {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private amb: GainNode | null = null;
  private sfx: GainNode | null = null;
  private vols = { master: 0.8, ambience: 0.6, sfx: 0.8 };
  private noise: AudioBuffer | null = null;
  private night = false;
  private beds = new Map<Place, GainNode>();
  private lastUpdate = 0;

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
        music.attach(this.ctx, this.master, this.noise);
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

  footstep(running: boolean, surface: Surface = 'dirt') {
    const g = running ? 1.35 : 1;
    if (surface === 'tile') {
      this.burst(0.05, 2200, 0.22 * g, this.sfx, 3);
      this.tone(380, 0.04, 'sine', 0.05 * g, this.sfx, 300);
    } else if (surface === 'asphalt') this.burst(0.07, 1100, 0.24 * g, this.sfx, 2);
    else if (surface === 'grass') this.burst(0.12, 2600, 0.12 * g, this.sfx, 0.6);
    else this.burst(0.1, 700, 0.26 * g, this.sfx, 1.2); // dirt / gravel
  }

  /** Called every frame with Amine's position and the hour; sets place beds and fires place sounds. */
  updatePlaces(x: number, z: number, hour: number, now: number) {
    if (!this.ctx || now - this.lastUpdate < 0.25) return;
    const dt = this.lastUpdate ? now - this.lastUpdate : 0.25;
    this.lastUpdate = now;
    for (const p of PLACES) {
      const d = Math.hypot(x - p.x, z - p.z);
      const near = p.open(hour) ? Math.max(0, 1 - d / p.r) : 0;
      if (p.bed) {
        let g = this.beds.get(p);
        if (!g) {
          g = this.makeBed(p.bed);
          this.beds.set(p, g);
        }
        g.gain.setTargetAtTime(near * near * (p.bed === 'tv' ? 0.18 : 0.5), this.ctx.currentTime, 0.6);
      }
      if (near > 0) for (const [rate, play] of p.events ?? []) if (Math.random() < rate * dt * near) play(this, near);
    }
  }

  /** A looping murmur: noise through moving vowel-like formants. */
  private makeBed(kind: 'crowd' | 'tv'): GainNode {
    const ctx = this.ctx!;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.connect(this.amb!);
    const voices = kind === 'crowd' ? 4 : 1;
    for (let i = 0; i < voices; i++) {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const f1 = ctx.createBiquadFilter();
      f1.type = 'bandpass';
      f1.Q.value = kind === 'tv' ? 6 : 4;
      f1.frequency.value = 500 + i * 230;
      // the formant drifts like syllables
      const lfo = ctx.createOscillator();
      const lfoG = ctx.createGain();
      lfo.frequency.value = 3 + i * 1.3;
      lfoG.gain.value = 250;
      lfo.connect(lfoG).connect(f1.frequency);
      const amp = ctx.createGain();
      amp.gain.value = 0.6;
      const trem = ctx.createOscillator();
      const tremG = ctx.createGain();
      trem.frequency.value = 2.2 + i * 0.7;
      tremG.gain.value = 0.45;
      trem.connect(tremG).connect(amp.gain);
      src.connect(f1).connect(amp).connect(out);
      src.start(0, Math.random() * 1.5);
      lfo.start();
      trem.start();
    }
    if (kind === 'tv') {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1400;
      out.disconnect();
      out.connect(lp).connect(this.amb!);
    }
    return out;
  }

  // --- place one-shots -------------------------------------------------------
  vendorCall(near: number) {
    // a market seller's sung call: a few gliding syllables
    const base = 280 + Math.random() * 120;
    for (let i = 0; i < 3; i++) this.tone(base * (1 + (i % 2) * 0.12), 0.32, 'sawtooth', 0.025 * near, this.amb, base * (1.05 + i * 0.04), i * 0.3);
  }
  clink(near: number) {
    this.tone(2600 + Math.random() * 600, 0.12, 'sine', 0.05 * near, this.amb);
  }
  kidShout(near: number) {
    const b = 600 + Math.random() * 300;
    this.tone(b, 0.25, 'triangle', 0.04 * near, this.amb, b * 1.4);
  }
  ballThump(near: number) {
    this.tone(140, 0.12, 'sine', 0.25 * near, this.amb, 60);
  }
  hammer(near: number) {
    for (let i = 0; i < 3; i++) {
      this.tone(900, 0.05, 'square', 0.05 * near, this.amb, 500, i * 0.38);
      this.burst(0.05, 2000, 0.15 * near, this.amb, 2);
    }
  }
  saw(near: number) {
    if (!this.ctx || !this.noise) return;
    for (let i = 0; i < 4; i++) {
      const t = this.ctx.currentTime + i * 0.32;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 1800 + (i % 2) * 500;
      f.Q.value = 4;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.25 * near, t + 0.12);
      g.gain.linearRampToValueAtTime(0.0001, t + 0.28);
      src.connect(f).connect(g).connect(this.amb!);
      src.start(t, Math.random());
      src.stop(t + 0.3);
    }
  }
  pigeon(near: number) {
    // soft "croo-oo" coo
    this.tone(380, 0.22, 'sine', 0.05 * near, this.amb, 330);
    this.tone(360, 0.35, 'sine', 0.05 * near, this.amb, 300, 0.25);
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

const day = (h: number) => h >= 7 && h < 21;
const PLACES: Place[] = [
  // souk stalls + square
  { x: 56, z: -25, r: 26, open: (h) => h >= 7.5 && h < 19.5, bed: 'crowd', events: [[0.12, (s, n) => s.vendorCall(n)]] },
  // café terrace
  { x: 64, z: -24, r: 14, open: (h) => h >= 6.5 && h < 23, events: [[0.35, (s, n) => s.clink(n)]] },
  // football pitch
  { x: 25, z: 27, r: 30, open: (h) => h >= 14.5 && h < 20, events: [[0.5, (s, n) => s.kidShout(n)], [0.6, (s, n) => s.ballThump(n)]] },
  // carpentry workshop
  { x: 55, z: 16, r: 22, open: (h) => h >= 8 && h < 18, events: [[0.18, (s, n) => s.hammer(n)], [0.1, (s, n) => s.saw(n)]] },
  // mosque courtyard
  { x: 35, z: -44, r: 18, open: day, events: [[0.2, (s, n) => s.pigeon(n)]] },
  // the TV in the living room
  { x: -27, z: -13, r: 9, open: (h) => h >= 17 || h < 0.5, bed: 'tv' },
];

export const sound = new Sound();
