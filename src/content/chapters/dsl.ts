// Small authoring helpers so chapter files read like a script.
import type { Choice, ChoiceStep, CondStep, Effects, FxStep, Line, LateRule, Objective, Step, Tone } from '../../types/game';

type LineExtra = { if?: string; fx?: Effects; set?: string[] };

export const say = (s: string, t: string, extra: LineExtra = {}): Line => ({ s, t, ...extra });
export const N = (t: string, extra?: LineExtra) => say('narrator', t, extra);
export const A = (t: string, extra?: LineExtra) => say('amine', t, extra);
export const M = (t: string, extra?: LineExtra) => say('mama', t, extra);
export const B = (t: string, extra?: LineExtra) => say('baba', t, extra);
export const MO = (t: string, extra?: LineExtra) => say('mourad', t, extra);

export const choose = (id: string, ...choose: Choice[]): ChoiceStep => ({ id, choose });

export const opt = (
  t: string,
  tone: Tone,
  extra: { fx?: Effects; set?: string[]; unset?: string[]; if?: string; then?: Step[] } = {},
): Choice => ({ t, tone, ...extra });

export const when = (cond: string, then: Step[], otherwise?: Step[]): CondStep =>
  otherwise ? { if: cond, then, else: otherwise } : { if: cond, then };

export const fx = (effects: Effects, extra: Omit<FxStep, 'fx'> = {}): FxStep => ({ fx: effects, ...extra });
export const flag = (...set: string[]): FxStep => ({ set });
export const note = (text: string, effects?: Effects, set?: string[]): FxStep => ({ note: text, fx: effects, set });
export const pass = (minutes: number): FxStep => ({ time: minutes });

type ObjExtra = {
  if?: string;
  dialogue?: Step[];
  deadline?: string;
  onLate?: LateRule;
  time?: number;
  skipTo?: string;
  moves?: { npc: string; spot: string; if?: string }[];
};

export const goto = (id: string, text: string, target: string, extra: ObjExtra = {}): Objective => ({
  id,
  text,
  type: 'goto',
  target,
  ...extra,
});
export const talk = (id: string, text: string, target: string, dialogue: Step[], extra: Omit<ObjExtra, 'dialogue'> = {}): Objective => ({
  id,
  text,
  type: 'talk',
  target,
  dialogue,
  ...extra,
});
export const act = (id: string, text: string, target: string, dialogue: Step[], extra: Omit<ObjExtra, 'dialogue'> = {}): Objective => ({
  id,
  text,
  type: 'use',
  target,
  dialogue,
  ...extra,
});
