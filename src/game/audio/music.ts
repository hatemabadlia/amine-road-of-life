// Procedural music with the Web Audio API (no audio files). A small sequencer
// plays maqam-flavoured themes with synthesized oud (plucked string), ney (breathy
// flute), a soft drone and darbuka (doum / tek). Each chapter gets its own
// seeded melody within the theme of its life stage.

export type Theme = 'menu' | 'childhood' | 'youth' | 'adult' | 'night' | 'tense' | 'ending' | 'wedding';

interface ThemeDef {
  bpm: number;
  /** scale in semitones from the tonic (one octave) */
  scale: number[];
  tonic: number; // MIDI note
  drums: 'maqsum' | 'baladi' | 'soft' | 'none';
  lead: 'oud' | 'ney' | 'zorna';
  density: number; // 0..1 probability a step gets a note
  drone: boolean;
}

// Ajam ≈ major, Nahawand ≈ harmonic minor, Kurd ≈ phrygian, Hijaz (augmented second), Bayati approximated in 12-TET
const AJAM = [0, 2, 4, 5, 7, 9, 11];
const NAHAWAND = [0, 2, 3, 5, 7, 8, 11];
const KURD = [0, 1, 3, 5, 7, 8, 10];
const HIJAZ = [0, 1, 4, 5, 7, 8, 10];
const BAYATI = [0, 2, 3, 5, 7, 8, 10];

const THEMES: Record<Theme, ThemeDef> = {
  menu: { bpm: 84, scale: BAYATI, tonic: 57, drums: 'soft', lead: 'oud', density: 0.45, drone: true },
  childhood: { bpm: 100, scale: AJAM, tonic: 60, drums: 'maqsum', lead: 'oud', density: 0.55, drone: false },
  youth: { bpm: 104, scale: NAHAWAND, tonic: 57, drums: 'baladi', lead: 'oud', density: 0.6, drone: false },
  adult: { bpm: 80, scale: KURD, tonic: 55, drums: 'soft', lead: 'ney', density: 0.4, drone: true },
  night: { bpm: 70, scale: BAYATI, tonic: 55, drums: 'none', lead: 'ney', density: 0.3, drone: true },
  tense: { bpm: 92, scale: HIJAZ, tonic: 52, drums: 'soft', lead: 'oud', density: 0.35, drone: true },
  ending: { bpm: 72, scale: AJAM, tonic: 55, drums: 'none', lead: 'ney', density: 0.45, drone: true },
  // zorna (shrill reed) + bendir: the sound of a Tébessa wedding
  wedding: { bpm: 128, scale: HIJAZ, tonic: 62, drums: 'baladi', lead: 'zorna', density: 0.75, drone: true },
};

// 8-step darbuka patterns (D = doum, T = tek, k = soft ka, . = rest)
const RHYTHMS: Record<ThemeDef['drums'], string> = {
  maqsum: 'DT.TD.T.',
  baladi: 'DD.TD.T.',
  soft: 'D...T...',
  none: '........',
};

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A 4-bar phrase (32 eighth-note steps) as scale degrees or null for rests: motif, variation, answer, cadence. */
export function composePhrase(seed: number, density: number): (number | null)[] {
  const r = seeded(seed);
  const motif: (number | null)[] = [];
  let deg = Math.floor(r() * 3);
  for (let i = 0; i < 8; i++) {
    const strong = i % 2 === 0;
    if (r() < (strong ? density + 0.25 : density - 0.15)) {
      deg += [-2, -1, -1, 0, 1, 1, 2][Math.floor(r() * 7)];
      deg = Math.max(-2, Math.min(9, deg));
      motif.push(deg);
    } else motif.push(null);
  }
  if (motif[0] === null) motif[0] = 0;
  const vary = motif.map((d) => (d === null ? null : d + (r() < 0.3 ? (r() < 0.5 ? 1 : -1) : 0)));
  const answer = motif.map((d) => (d === null ? null : 4 - (d - (motif[0] ?? 0))));
  const cadence: (number | null)[] = [...motif.slice(0, 4), 2, 1, null, 0];
  return [...motif, ...vary, ...answer, ...cadence];
}

class Music {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private bus: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private noise: AudioBuffer | null = null;
  private theme: Theme | null = null;
  private seed = 1;
  private phrase: (number | null)[] = [];
  private step = 0;
  private nextTime = 0;
  private timer = 0;
  private volume = 0.5;
  private duck = 1;
  private droneNodes: { o: OscillatorNode; g: GainNode }[] = [];
  private meter: AnalyserNode | null = null;

  attach(ctx: AudioContext, destination: AudioNode, noise: AudioBuffer) {
    if (this.ctx) return;
    this.ctx = ctx;
    this.noise = noise;
    this.out = ctx.createGain();
    this.bus = ctx.createGain();
    this.out.gain.value = this.volume;
    // simple room reverb from a decaying noise impulse
    this.reverb = ctx.createConvolver();
    const len = ctx.sampleRate * 2.2;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    this.reverb.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.28;
    this.bus.connect(this.out);
    this.bus.connect(this.reverb).connect(wet).connect(this.out);
    this.out.connect(destination);
    this.meter = ctx.createAnalyser();
    this.out.connect(this.meter);
    this.timer = window.setInterval(() => this.schedule(), 60);
    if (this.theme) this.restart();
  }

  setVolume(v: number) {
    this.volume = v;
    this.applyGain();
  }

  /** Lower the music under dialogue. */
  setDuck(on: boolean) {
    this.duck = on ? 0.45 : 1;
    this.applyGain();
  }

  private applyGain() {
    if (!this.ctx || !this.out) return;
    this.out.gain.setTargetAtTime(this.volume * this.duck * 0.55, this.ctx.currentTime, 0.4);
  }

  /** Switch theme (and the chapter seed that varies the melody). Cross-fades softly. */
  play(theme: Theme | null, seed = 1) {
    if (theme === this.theme && seed === this.seed) return;
    this.theme = theme;
    this.seed = seed;
    if (this.ctx) this.restart();
  }

  current() {
    return this.theme;
  }

  /** RMS level of the music output right now (for tests / debugging). */
  level(): number {
    if (!this.meter) return 0;
    const buf = new Float32Array(this.meter.fftSize);
    this.meter.getFloatTimeDomainData(buf);
    let sum = 0;
    for (const v of buf) sum += v * v;
    return Math.sqrt(sum / buf.length);
  }

  private restart() {
    const ctx = this.ctx!;
    this.stopDrone();
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.6;
    if (!this.theme) return;
    const def = THEMES[this.theme];
    this.phrase = composePhrase(this.seed * 131 + this.theme.length, def.density);
    if (def.drone) this.startDrone(def);
  }

  private startDrone(def: ThemeDef) {
    const ctx = this.ctx!;
    for (const [interval, gain] of [
      [-12, 0.05],
      [-5, 0.025],
    ] as const) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.value = mtof(def.tonic + interval);
      f.type = 'lowpass';
      f.frequency.value = 420;
      g.gain.value = 0;
      g.gain.setTargetAtTime(gain, ctx.currentTime, 1.5);
      o.connect(f).connect(g).connect(this.bus!);
      o.start();
      this.droneNodes.push({ o, g });
    }
  }

  private stopDrone() {
    const ctx = this.ctx;
    if (!ctx) return;
    for (const { o, g } of this.droneNodes) {
      g.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
      o.stop(ctx.currentTime + 2.5);
    }
    this.droneNodes = [];
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || !this.theme) return;
    const def = THEMES[this.theme];
    const stepDur = 60 / def.bpm / 2; // eighth notes
    while (this.nextTime < ctx.currentTime + 0.25) {
      const t = this.nextTime;
      const i = this.step % 32;
      // lead melody
      const deg = this.phrase[i];
      if (deg !== null && deg !== undefined) {
        const note = this.degreeToMidi(def, deg);
        const len = this.phrase[(i + 1) % 32] === null ? stepDur * 2 : stepDur;
        if (def.lead === 'oud') this.oud(t, mtof(note), len);
        else if (def.lead === 'zorna') this.zorna(t, mtof(note + 12), len);
        else this.ney(t, mtof(note + 12), len * 1.6);
      }
      // bass on bar starts
      if (i % 8 === 0) this.oud(t, mtof(def.tonic - 12 + (i === 16 ? def.scale[3] : 0)), stepDur * 4, 0.12);
      // darbuka
      const hit = RHYTHMS[def.drums][i % 8];
      if (hit === 'D') this.doum(t);
      else if (hit === 'T') this.tek(t, 0.12);
      else if (def.drums !== 'none' && def.drums !== 'soft' && Math.random() < 0.25) this.tek(t, 0.04);
      this.step++;
      this.nextTime += stepDur;
      // new variation every 4 phrases so long sessions don't loop identically
      if (this.step % 128 === 0) this.phrase = composePhrase(this.seed * 131 + this.step, def.density);
    }
  }

  private degreeToMidi(def: ThemeDef, deg: number): number {
    const n = def.scale.length;
    const oct = Math.floor(deg / n);
    const idx = ((deg % n) + n) % n;
    return def.tonic + oct * 12 + def.scale[idx];
  }

  /** Plucked string: bright attack that darkens quickly. */
  private oud(t: number, freq: number, dur: number, gain = 0.16) {
    const ctx = this.ctx!;
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o1.type = 'sawtooth';
    o2.type = 'triangle';
    o1.frequency.value = freq;
    o2.frequency.value = freq * 1.003;
    f.type = 'lowpass';
    f.Q.value = 2;
    f.frequency.setValueAtTime(freq * 8, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(200, freq * 1.5), t + 0.25);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.35, dur * 1.8));
    o1.connect(f);
    o2.connect(f);
    f.connect(g).connect(this.bus!);
    o1.start(t);
    o2.start(t);
    o1.stop(t + dur * 2 + 0.4);
    o2.stop(t + dur * 2 + 0.4);
  }

  /** Breathy flute: sine with vibrato and a little filtered air. */
  private ney(t: number, freq: number, dur: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const vib = ctx.createOscillator();
    const vibG = ctx.createGain();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    vib.frequency.value = 5.2;
    vibG.gain.value = freq * 0.006;
    vib.connect(vibG).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.12);
    g.gain.setTargetAtTime(0.0001, t + dur, 0.2);
    o.connect(g).connect(this.bus!);
    o.start(t);
    vib.start(t);
    o.stop(t + dur + 1.2);
    vib.stop(t + dur + 1.2);
    if (this.noise) {
      const n = ctx.createBufferSource();
      n.buffer = this.noise;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = freq * 2;
      bp.Q.value = 3;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.linearRampToValueAtTime(0.03, t + 0.05);
      ng.gain.setTargetAtTime(0.0001, t + 0.15, 0.1);
      n.connect(bp).connect(ng).connect(this.bus!);
      n.start(t, Math.random());
      n.stop(t + 0.8);
    }
  }

  /** Zorna: a nasal double-reed — bright sawtooth through a narrow formant, fast vibrato. */
  private zorna(t: number, freq: number, dur: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const vib = ctx.createOscillator();
    const vibG = ctx.createGain();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(freq * 0.97, t);
    o.frequency.linearRampToValueAtTime(freq, t + 0.04);
    vib.frequency.value = 6.5;
    vibG.gain.value = freq * 0.012;
    vib.connect(vibG).connect(o.frequency);
    f.type = 'bandpass';
    f.frequency.value = 1600;
    f.Q.value = 1.4;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.07, t + 0.02);
    g.gain.setTargetAtTime(0.0001, t + dur * 0.95, 0.04);
    o.connect(f).connect(g).connect(this.bus!);
    o.start(t);
    vib.start(t);
    o.stop(t + dur + 0.3);
    vib.stop(t + dur + 0.3);
  }

  private doum(t: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(55, t + 0.25);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g).connect(this.bus!);
    o.start(t);
    o.stop(t + 0.4);
  }

  private tek(t: number, gain: number) {
    const ctx = this.ctx!;
    if (!this.noise) return;
    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.value = 3200;
    hp.Q.value = 1.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    n.connect(hp).connect(g).connect(this.bus!);
    n.start(t, Math.random());
    n.stop(t + 0.1);
  }

  dispose() {
    window.clearInterval(this.timer);
  }
}

export const music = new Music();

/** Which theme fits the moment: life stage, night, and how the story is going. */
export function themeFor(opts: { screen: string; age: number; hour: number; risk: number; ending: boolean; event?: string; inMosque?: boolean }): Theme | null {
  if (opts.ending) return 'ending';
  if (opts.screen !== 'game') return 'menu';
  // no music inside the mosque
  if (opts.inMosque) return null;
  if (opts.event === 'wedding') return 'wedding';
  if (opts.risk >= 70) return 'tense';
  if (opts.hour >= 21.5 || opts.hour < 5.5) return 'night';
  if (opts.age <= 12) return 'childhood';
  if (opts.age <= 15) return 'youth';
  return 'adult';
}
