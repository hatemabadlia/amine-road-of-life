import {
  STAT_KEYS,
  type Chapter,
  type ChoiceStep,
  type CondStep,
  type Effects,
  type FxStep,
  type GameState,
  type Line,
  type Objective,
  type Shot,
  type Step,
  type Tone,
} from '../../types/game';
import { evalCond } from './conditions';

export const FIRST_CHAPTER = 1;
export const LAST_CHAPTER = 68;

/** One observable change, used for HUD notifications. */
export interface Change {
  key: string;
  delta: number;
  note?: string;
}

export function createState(): GameState {
  return {
    chapter: FIRST_CHAPTER,
    phase: 'opening',
    age: 10,
    time: 7 * 60,
    money: 20,
    savings: 0,
    stats: {
      trust: 60,
      anger: 0,
      health: 90,
      confidence: 50,
      risk: 10,
      attendance: 90,
      grades: 55,
      honesty: 60,
      mourad: 60,
      parents: 65,
    },
    flags: {},
    done: [],
    late: [],
    marks: {},
    sides: [],
    completed: [],
    history: [],
    player: null,
    ending: null,
  };
}

export const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

export function parseTime(hhmm: string): number {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) throw new Error(`Bad time "${hhmm}"`);
  return Number(m[1]) * 60 + Number(m[2]);
}

export function formatTime(minutes: number): string {
  const m = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Apply effects with boundary enforcement. Money never goes below zero. */
export function applyFx(state: GameState, fx?: Effects, set?: string[], unset?: string[]): Change[] {
  const changes: Change[] = [];
  if (fx) {
    for (const [k, raw] of Object.entries(fx)) {
      const d = raw ?? 0;
      if (!d) continue;
      if (k === 'money' || k === 'savings') {
        const before = state[k];
        state[k] = Math.max(0, Math.round(before + d));
        if (state[k] !== before) changes.push({ key: k, delta: state[k] - before });
      } else if ((STAT_KEYS as readonly string[]).includes(k)) {
        const key = k as keyof GameState['stats'];
        const before = state.stats[key];
        state.stats[key] = clamp(before + d);
        if (state.stats[key] !== before) changes.push({ key, delta: state.stats[key] - before });
      } else {
        throw new Error(`Unknown effect key "${k}"`);
      }
    }
  }
  for (const f of set ?? []) state.flags[f] = true;
  for (const f of unset ?? []) delete state.flags[f];
  return changes;
}

/** [stat, baseline, rate per chapter] */
export const DRIFT: [keyof GameState['stats'], number, number][] = [
  ['trust', 50, 0.08],
  ['parents', 50, 0.08],
  ['honesty', 50, 0.05],
  ['confidence', 50, 0.06],
  ['mourad', 35, 0.06],
  ['grades', 45, 0.05],
  ['attendance', 70, 0.05],
];

/** Base allowance by age; reduced by consequences. */
export function allowanceFor(state: GameState): number {
  const base = state.age <= 12 ? 50 : state.age <= 15 ? 100 : 200;
  if (state.flags.allowance_cut && !state.flags.allowance_restored) return Math.round(base / 2);
  if (state.stats.trust < 25) return Math.round(base / 2);
  return base;
}

export function getChapter(chapters: Chapter[], id: number): Chapter {
  const c = chapters.find((ch) => ch.id === id);
  if (!c) throw new Error(`Chapter ${id} missing`);
  return c;
}

/** Enter a chapter: resets per-chapter progress, keeps all persistent state. */
export function startChapter(state: GameState, chapters: Chapter[], id: number): Change[] {
  const ch = getChapter(chapters, id);
  state.chapter = id;
  state.age = ch.age;
  state.phase = 'opening';
  state.time = parseTime(ch.start.time);
  state.done = [];
  state.late = [];
  state.marks = {};
  state.sides = [];
  state.player = null;
  state.ending = null;
  // short-term anger cools down between chapters.
  state.stats.anger = clamp(state.stats.anger * 0.5);
  // Relationships and habits fade toward a baseline without maintenance, so
  // recent behaviour weighs more than old behaviour (and nothing stays maxed forever).
  for (const [k, base, rate] of DRIFT) {
    const v = state.stats[k];
    state.stats[k] = clamp(v + (base - v) * rate);
  }
  // health slowly recovers when Amine is not exposed to risk
  if (state.stats.risk < 50) state.stats.health = clamp(state.stats.health + 2);
  if (ch.allowance !== false) {
    const a = allowanceFor(state);
    return applyFx(state, { money: a }).map((c) => ({ ...c, note: 'مصروف اليوم' }));
  }
  return [];
}

/**
 * Resolve the current objective, marking conditional objectives whose condition
 * is false as skipped. Returns null when every objective is done.
 */
export function resolveObjective(state: GameState, ch: Chapter): Objective | null {
  for (const o of ch.objectives) {
    if (state.done.includes(o.id)) continue;
    if (!evalCond(state, o.if)) {
      state.done.push(o.id);
      continue;
    }
    applySkip(state, o);
    if (state.marks[`act:${o.id}`] === undefined) state.marks[`act:${o.id}`] = state.time;
    return o;
  }
  return null;
}

/** Time skip ("the next morning") when an objective with `skipTo` activates. Returns true if applied. */
export function applySkip(state: GameState, o: Objective): boolean {
  const key = `skip:${o.id}`;
  if (!o.skipTo || state.marks[key] !== undefined) return false;
  state.marks[key] = state.time;
  const target = parseTime(o.skipTo);
  const dayStart = Math.floor(state.time / 1440) * 1440;
  let t = dayStart + target;
  if (t <= state.time) t += 1440;
  state.time = t;
  return true;
}

/** Peek the active objective without mutating. */
export function peekObjective(state: GameState, ch: Chapter): Objective | null {
  for (const o of ch.objectives) {
    if (state.done.includes(o.id)) continue;
    if (!evalCond(state, o.if)) continue;
    return o;
  }
  return null;
}

export function completeObjective(state: GameState, ch: Chapter, id: string): void {
  const o = ch.objectives.find((x) => x.id === id);
  if (!o) throw new Error(`Objective ${id} not in chapter ${ch.id}`);
  if (!state.done.includes(id)) state.done.push(id);
  if (o.time) state.time += o.time;
}

/** Absolute deadline: the HH:MM on the day the objective became active. */
export function deadlineOf(state: GameState, o: Objective): number {
  const since = state.marks[`act:${o.id}`] ?? state.time;
  return Math.floor(since / 1440) * 1440 + parseTime(o.deadline!);
}

/** Deadline handling: never blocks progress, only records consequences. */
export function checkDeadline(state: GameState, o: Objective): Change[] | null {
  if (!o.deadline || state.late.includes(o.id)) return null;
  if (state.time <= deadlineOf(state, o)) return null;
  state.late.push(o.id);
  const rule = o.onLate ?? {};
  const changes = applyFx(state, rule.fx, rule.set);
  if (rule.note) changes.unshift({ key: 'note', delta: 0, note: rule.note });
  if (rule.complete && !state.done.includes(o.id)) state.done.push(o.id);
  return changes;
}

/** Move to next chapter or to the ending. */
export function finishChapter(state: GameState, chapters: Chapter[], evaluateEnding: (s: GameState) => string): Change[] {
  if (!state.completed.includes(state.chapter)) state.completed.push(state.chapter);
  if (state.chapter >= LAST_CHAPTER) {
    state.phase = 'ending';
    state.ending = evaluateEnding(state);
    return [];
  }
  return startChapter(state, chapters, state.chapter + 1);
}

// ---------------------------------------------------------------------------
// Dialogue runner
// ---------------------------------------------------------------------------

export type DialogueView =
  | { kind: 'line'; speaker: string; text: string; cam?: Shot }
  | { kind: 'choice'; id: string; options: { index: number; text: string; tone?: Tone }[] };

interface Frame {
  steps: Step[];
  i: number;
}

export const isLine = (s: Step): s is Line => 's' in s;
export const isChoice = (s: Step): s is ChoiceStep => 'choose' in s;
export const isCond = (s: Step): s is CondStep => 'then' in s && 'if' in s && !('s' in s);
export const isFx = (s: Step): s is FxStep => !isLine(s) && !isChoice(s) && !isCond(s);

/**
 * Walks a dialogue tree. Effects are applied to the passed state as the
 * dialogue advances, so the caller must pass the same (mutable) state object.
 */
export class DialogueRunner {
  private stack: Frame[];
  private pending: ChoiceStep | null = null;
  changes: Change[] = [];

  constructor(steps: Step[], private chapterId: number) {
    this.stack = [{ steps, i: 0 }];
  }

  /** Advance to the next visible line or choice. Returns null when finished. */
  next(state: GameState): DialogueView | null {
    if (this.pending) return this.viewChoice(state, this.pending);
    while (this.stack.length) {
      const top = this.stack[this.stack.length - 1];
      if (top.i >= top.steps.length) {
        this.stack.pop();
        continue;
      }
      const step = top.steps[top.i++];
      if (isLine(step)) {
        if (!evalCond(state, step.if)) continue;
        this.changes.push(...applyFx(state, step.fx, step.set));
        return { kind: 'line', speaker: step.s, text: step.t, cam: step.cam };
      }
      if (isChoice(step)) {
        const visible = step.choose.filter((c) => evalCond(state, c.if));
        if (!visible.length) continue;
        this.pending = step;
        return this.viewChoice(state, step);
      }
      if (isCond(step)) {
        const branch = evalCond(state, step.if) ? step.then : step.else;
        if (branch?.length) this.stack.push({ steps: branch, i: 0 });
        continue;
      }
      // fx step
      const ch = applyFx(state, step.fx, step.set, step.unset);
      if (step.time) state.time += step.time;
      if (step.note) ch.unshift({ key: 'note', delta: 0, note: step.note });
      this.changes.push(...ch);
    }
    return null;
  }

  private viewChoice(state: GameState, step: ChoiceStep): DialogueView {
    return {
      kind: 'choice',
      id: step.id,
      options: step.choose
        .map((c, index) => ({ c, index }))
        .filter(({ c }) => evalCond(state, c.if))
        .map(({ c, index }) => ({ index, text: c.t, tone: c.tone })),
    };
  }

  /** Select an option by its original index (as returned in the view). */
  choose(state: GameState, index: number): void {
    const step = this.pending;
    if (!step) throw new Error('No choice pending');
    const c = step.choose[index];
    if (!c || !evalCond(state, c.if)) throw new Error(`Invalid choice ${index} for ${step.id}`);
    this.pending = null;
    this.changes.push(...applyFx(state, c.fx, c.set, c.unset));
    state.history.push({ chapter: this.chapterId, id: step.id, choice: c.t, tone: c.tone });
    if (c.then?.length) this.stack.push({ steps: c.then, i: 0 });
  }

  get awaitingChoice(): boolean {
    return this.pending !== null;
  }

  drainChanges(): Change[] {
    const c = this.changes;
    this.changes = [];
    return c;
  }
}
