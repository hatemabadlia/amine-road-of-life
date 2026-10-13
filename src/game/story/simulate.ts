// Headless playthrough runner. Plays the real chapter data through the real
// engine, choosing dialogue options with a strategy. Used by tests, the
// narrative coverage report and ending-reachability search.
import type { Chapter, GameState, Objective, Tone } from '../../types/game';
import {
  DialogueRunner,
  checkDeadline,
  completeObjective,
  createState,
  deadlineOf,
  finishChapter,
  getChapter,
  resolveObjective,
  startChapter,
} from './engine';

export interface ChoiceContext {
  state: GameState;
  chapter: number;
  choiceId: string;
  options: { index: number; text: string; tone?: Tone }[];
}

export type Strategy = (ctx: ChoiceContext) => number;

export interface SimOptions {
  /** return true to arrive after the deadline of this objective */
  late?: (o: Objective, state: GameState) => boolean;
  /** max chapters to play (default: all) */
  until?: number;
  /** record visited choice ids */
  onChoice?: (ctx: ChoiceContext, picked: number) => void;
}

export function runDialogue(state: GameState, steps: Chapter['opening'] | undefined, chapterId: number, strategy: Strategy, onChoice?: SimOptions['onChoice']) {
  if (!steps?.length) return;
  const r = new DialogueRunner(steps, chapterId);
  let guard = 0;
  for (let v = r.next(state); v; v = r.next(state)) {
    if (++guard > 5000) throw new Error(`Dialogue loop in chapter ${chapterId}`);
    if (v.kind === 'choice') {
      const ctx: ChoiceContext = { state, chapter: chapterId, choiceId: v.id, options: v.options };
      const picked = strategy(ctx);
      if (!v.options.some((o) => o.index === picked)) throw new Error(`Strategy picked invalid option ${picked} for ${v.id}`);
      onChoice?.(ctx, picked);
      r.choose(state, picked);
    }
  }
}

/** Play the current chapter from its opening to its closing (does not advance). */
export function playChapter(state: GameState, chapters: Chapter[], strategy: Strategy, opts: SimOptions = {}): void {
  const ch = getChapter(chapters, state.chapter);
  runDialogue(state, ch.opening, ch.id, strategy, opts.onChoice);
  state.phase = 'play';
  let guard = 0;
  for (let o = resolveObjective(state, ch); o; o = resolveObjective(state, ch)) {
    if (++guard > 200) throw new Error(`Objective loop in chapter ${ch.id}`);
    if (o.deadline && opts.late?.(o, state)) {
      state.time = Math.max(state.time, deadlineOf(state, o) + 1);
    }
    checkDeadline(state, o);
    if (state.done.includes(o.id)) continue; // auto-completed by a late rule
    runDialogue(state, o.dialogue, ch.id, strategy, opts.onChoice);
    completeObjective(state, ch, o.id);
  }
  state.phase = 'closing';
  runDialogue(state, ch.closing, ch.id, strategy, opts.onChoice);
}

export function playthrough(chapters: Chapter[], strategy: Strategy, evaluate: (s: GameState) => string, opts: SimOptions = {}): GameState {
  const state = createState();
  startChapter(state, chapters, chapters[0].id);
  const until = opts.until ?? chapters[chapters.length - 1].id;
  for (;;) {
    playChapter(state, chapters, strategy, opts);
    if (state.chapter >= until) {
      if (state.chapter === chapters[chapters.length - 1].id) finishChapter(state, chapters, evaluate);
      return state;
    }
    finishChapter(state, chapters, evaluate);
  }
}

// ---------------------------------------------------------------------------
// Strategies
// ---------------------------------------------------------------------------

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Prefer the first option whose tone appears earliest in `prefs`. */
export function byTone(prefs: Tone[]): Strategy {
  return ({ options }) => {
    for (const t of prefs) {
      const o = options.find((x) => x.tone === t);
      if (o) return o.index;
    }
    return options[0].index;
  };
}

export function randomStrategy(seed: number): Strategy {
  const rnd = mulberry32(seed);
  return ({ options }) => options[Math.floor(rnd() * options.length)].index;
}

/** Weighted random: each tone has a weight. */
export function weighted(seed: number, weights: Partial<Record<Tone, number>>): Strategy {
  const rnd = mulberry32(seed);
  return ({ options }) => {
    const ws = options.map((o) => weights[o.tone ?? 'neutral'] ?? 1);
    const total = ws.reduce((a, b) => a + b, 0);
    let r = rnd() * total;
    for (let i = 0; i < options.length; i++) {
      r -= ws[i];
      if (r <= 0) return options[i].index;
    }
    return options[options.length - 1].index;
  };
}

/** Use strategy `a` until chapter `pivot`, then `b`. */
export function phased(a: Strategy, pivot: number, b: Strategy): Strategy {
  return (ctx) => (ctx.chapter < pivot ? a(ctx) : b(ctx));
}

export const GOOD: Tone[] = ['good', 'honest', 'refuse', 'help', 'neutral'];
export const BAD: Tone[] = ['bad', 'lie', 'neutral', 'good'];
