// Core data model shared by the story engine, the 3D game and the content files.

export const STAT_KEYS = [
  'trust', // ثقة الوالدين — long-term parental trust
  'anger', // غضب الوالدين — short-term anger (decays)
  'health',
  'confidence',
  'risk',
  'attendance',
  'grades',
  'honesty',
  'mourad', // relationship with Mourad
  'parents', // emotional bond with parents
] as const;

export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

/** Numeric effects. `money`/`savings` are in DZD, clamped at 0 but not at 100. */
export type Effects = Partial<Record<StatKey | 'money' | 'savings', number>>;

/** How a choice reads morally — used by AI playthrough strategies and analytics, never shown to the player. */
export type Tone = 'good' | 'bad' | 'neutral' | 'refuse' | 'honest' | 'lie' | 'help';

/** Optional camera shot for a dialogue line (cinematic moments). */
export type Shot = 'close' | 'low' | 'high' | 'wide';

export interface Line {
  /** speaker id: character id, 'amine' or 'narrator' */
  s: string;
  t: string;
  /** camera shot for this line (default: over-the-shoulder on the speaker) */
  cam?: Shot;
  if?: string;
  fx?: Effects;
  set?: string[];
}

export interface Choice {
  t: string;
  tone?: Tone;
  if?: string;
  fx?: Effects;
  set?: string[];
  unset?: string[];
  then?: Step[];
}

export interface ChoiceStep {
  /** Unique decision id within the chapter; recorded in decision history. */
  id: string;
  choose: Choice[];
}

export interface CondStep {
  if: string;
  then: Step[];
  else?: Step[];
}

export interface FxStep {
  fx?: Effects;
  set?: string[];
  unset?: string[];
  /** advance game clock in minutes */
  time?: number;
  /** consequence notification shown to the player */
  note?: string;
}

export type Step = Line | ChoiceStep | CondStep | FxStep;

export type ObjectiveType = 'goto' | 'talk' | 'use';

export interface LateRule {
  set?: string[];
  fx?: Effects;
  note?: string;
  /** when true the objective is auto-completed on timeout (the story moves on). */
  complete?: boolean;
}

export interface Objective {
  id: string;
  text: string;
  type: ObjectiveType;
  /** spot id (goto), character id (talk) or object id (use) */
  target: string;
  /** objective only becomes active when the condition holds; otherwise skipped */
  if?: string;
  dialogue?: Step[];
  /** game-clock deadline HH:MM */
  deadline?: string;
  onLate?: LateRule;
  /** minutes consumed on completion */
  time?: number;
  /** when this objective becomes active, jump the clock forward to this time (next day if needed) */
  skipTo?: string;
  /** characters that relocate once this objective is completed */
  moves?: { npc: string; spot: string; if?: string }[];
  /** after completion Amine takes the bus across town to this spot (a short ride sequence) */
  ride?: string;
}

export interface Chapter {
  id: number;
  act: 1 | 2 | 3;
  title: string;
  /** short mission name displayed in HUD */
  mission: string;
  age: number;
  summary: string;
  start: { spot: string; time: string };
  /** give the daily allowance automatically at chapter start (default true) */
  allowance?: boolean;
  /** NPC placements for this chapter: character id -> spot id */
  cast?: Record<string, string>;
  /** characters hidden this chapter */
  absent?: string[];
  /** characters lying down this chapter (e.g. in a hospital bed) */
  lying?: string[];
  /** a special event that dresses the neighbourhood (decorations, music) */
  event?: 'wedding' | 'friday' | 'volunteer' | 'ramadan';
  opening: Step[];
  objectives: Objective[];
  closing: Step[];
}

export interface Decision {
  chapter: number;
  id: string;
  choice: string;
  tone?: Tone;
}

export type Phase = 'opening' | 'play' | 'closing' | 'ending';

export interface PlayerPose {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface GameState {
  chapter: number;
  phase: Phase;
  age: number;
  /** minutes since midnight */
  time: number;
  money: number;
  /** money saved in the piggy bank (الحصالة) */
  savings: number;
  stats: Stats;
  flags: Record<string, boolean>;
  /** objective ids completed or skipped in the current chapter */
  done: string[];
  /** objectives that already triggered their late rule */
  late: string[];
  /** per-chapter bookkeeping: objective activation time, applied time skips */
  marks: Record<string, number>;
  /** side activities done this chapter */
  sides: string[];
  completed: number[];
  history: Decision[];
  player: PlayerPose | null;
  ending: string | null;
}
