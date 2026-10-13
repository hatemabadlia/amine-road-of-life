import { STAT_KEYS, type GameState } from '../../types/game';

/**
 * Tiny condition language used by content files.
 *   "skipped_ch1"            flag is set
 *   "!lied_money"            flag is not set
 *   "trust>=60"              stat comparison (any stat, money, age, chapter, time)
 *   "a & b | c"              '&' binds tighter than '|'; no parentheses.
 */

type Op = '>=' | '<=' | '>' | '<' | '==' | '!=';
type Term =
  | { kind: 'flag'; name: string; neg: boolean }
  | { kind: 'cmp'; key: string; op: Op; value: number };
type Compiled = Term[][]; // OR of ANDs

const cache = new Map<string, Compiled>();
const NUMERIC_KEYS = new Set<string>([...STAT_KEYS, 'money', 'savings', 'age', 'chapter', 'time']);

export class ConditionError extends Error {}

export function compile(expr: string): Compiled {
  const hit = cache.get(expr);
  if (hit) return hit;
  const ors = expr.split('|').map((part) =>
    part.split('&').map((raw) => {
      const t = raw.trim();
      if (!t) throw new ConditionError(`Empty term in "${expr}"`);
      const m = t.match(/^([a-zA-Z_][\w]*)\s*(>=|<=|==|!=|>|<)\s*(-?\d+)$/);
      if (m) {
        if (!NUMERIC_KEYS.has(m[1])) throw new ConditionError(`Unknown numeric key "${m[1]}" in "${expr}"`);
        return { kind: 'cmp', key: m[1], op: m[2] as Op, value: Number(m[3]) } as Term;
      }
      const f = t.match(/^(!?)([a-zA-Z_][\w]*)$/);
      if (!f) throw new ConditionError(`Bad term "${t}" in "${expr}"`);
      return { kind: 'flag', name: f[2], neg: f[1] === '!' } as Term;
    }),
  );
  cache.set(expr, ors);
  return ors;
}

function numeric(state: GameState, key: string): number {
  if (key === 'money') return state.money;
  if (key === 'savings') return state.savings;
  if (key === 'age') return state.age;
  if (key === 'chapter') return state.chapter;
  if (key === 'time') return state.time;
  return state.stats[key as keyof GameState['stats']];
}

function evalTerm(state: GameState, t: Term): boolean {
  if (t.kind === 'flag') return !!state.flags[t.name] !== t.neg;
  const v = numeric(state, t.key);
  switch (t.op) {
    case '>=': return v >= t.value;
    case '<=': return v <= t.value;
    case '>': return v > t.value;
    case '<': return v < t.value;
    case '==': return v === t.value;
    case '!=': return v !== t.value;
  }
}

export function evalCond(state: GameState, expr: string | undefined): boolean {
  if (!expr) return true;
  return compile(expr).some((ands) => ands.every((t) => evalTerm(state, t)));
}

/** Flags referenced by an expression (for validation). */
export function flagsIn(expr: string): string[] {
  return compile(expr)
    .flat()
    .filter((t): t is Extract<Term, { kind: 'flag' }> => t.kind === 'flag')
    .map((t) => t.name);
}
