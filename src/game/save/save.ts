// Versioned local persistence with migration and corruption recovery.
// Storage is injected so the module is testable without a browser.
import { STAT_KEYS, type GameState } from '../../types/game';
import { clamp, createState, LAST_CHAPTER } from '../story/engine';

export const SAVE_VERSION = 2;
export const SAVE_KEY = 'amine.save';
export const ENDINGS_KEY = 'amine.endings';
export const SETTINGS_KEY = 'amine.settings';
export const CORRUPT_KEY = 'amine.save.corrupt';

export interface SaveFile {
  version: number;
  savedAt: string;
  state: GameState;
  /** state captured at the start of each chapter, for chapter replay */
  snapshots: Record<number, GameState>;
}

export interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

/** In-memory fallback when localStorage is unavailable (private mode, etc.). */
export function memoryStorage(): KV {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
}

export function browserStorage(): KV {
  try {
    const ls = window.localStorage;
    const probe = '__amine_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return memoryStorage();
  }
}

// ---------------------------------------------------------------------------
// Migrations: each entry upgrades a raw object from version N to N+1.
// v1 (prototype) lacked `savings`, `marks` and chapter snapshots.
// ---------------------------------------------------------------------------
type Raw = Record<string, unknown>;
const MIGRATIONS: Record<number, (raw: Raw) => Raw> = {
  1: (raw) => {
    const state = { ...(raw.state as Raw) };
    if (typeof state.savings !== 'number') state.savings = 0;
    if (!state.marks || typeof state.marks !== 'object') state.marks = {};
    return { ...raw, version: 2, state, snapshots: raw.snapshots ?? {} };
  },
};

export function migrate(raw: Raw): Raw {
  let cur = raw;
  let v = typeof cur.version === 'number' ? cur.version : 1;
  while (v < SAVE_VERSION) {
    const step = MIGRATIONS[v];
    if (!step) throw new Error(`No migration from v${v}`);
    cur = step(cur);
    v = cur.version as number;
  }
  if (v > SAVE_VERSION) throw new Error(`Save from a newer version (v${v})`);
  return cur;
}

/** Validate and repair a game state. Throws if it is unusable. */
export function sanitizeState(input: unknown): GameState {
  if (!input || typeof input !== 'object') throw new Error('State is not an object');
  const s = input as Partial<GameState>;
  const base = createState();
  if (typeof s.chapter !== 'number' || s.chapter < 1 || s.chapter > LAST_CHAPTER || !Number.isInteger(s.chapter)) {
    throw new Error('Invalid chapter');
  }
  const stats = { ...base.stats };
  for (const k of STAT_KEYS) {
    const v = s.stats?.[k];
    stats[k] = typeof v === 'number' && Number.isFinite(v) ? clamp(v) : base.stats[k];
  }
  const strArr = (a: unknown) => (Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string') : []);
  const flags: Record<string, boolean> = {};
  if (s.flags && typeof s.flags === 'object') {
    for (const [k, v] of Object.entries(s.flags)) if (v === true) flags[k] = true;
  }
  const marks: Record<string, number> = {};
  if (s.marks && typeof s.marks === 'object') {
    for (const [k, v] of Object.entries(s.marks)) if (typeof v === 'number' && Number.isFinite(v)) marks[k] = v;
  }
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  const phase = s.phase === 'opening' || s.phase === 'play' || s.phase === 'closing' || s.phase === 'ending' ? s.phase : 'opening';
  const p = s.player;
  const player =
    p && [p.x, p.y, p.z, p.yaw].every((n) => typeof n === 'number' && Number.isFinite(n)) && Math.abs(p.x) < 100 && Math.abs(p.z) < 100
      ? { x: p.x, y: Math.max(0, Math.min(p.y, 5)), z: p.z, yaw: p.yaw }
      : null;
  return {
    chapter: s.chapter,
    phase,
    age: num(s.age, 10),
    time: Math.max(0, num(s.time, 420)),
    money: Math.max(0, Math.round(num(s.money, 0))),
    savings: Math.max(0, Math.round(num(s.savings, 0))),
    stats,
    flags,
    done: strArr(s.done),
    late: strArr(s.late),
    marks,
    sides: strArr(s.sides),
    completed: Array.isArray(s.completed) ? s.completed.filter((x): x is number => Number.isInteger(x) && x >= 1 && x <= LAST_CHAPTER) : [],
    history: Array.isArray(s.history)
      ? s.history.filter((h) => h && typeof h === 'object' && typeof h.id === 'string' && typeof h.chapter === 'number')
      : [],
    player,
    ending: typeof s.ending === 'string' ? s.ending : null,
  };
}

export type LoadResult =
  | { ok: true; save: SaveFile; repaired: boolean }
  | { ok: false; reason: 'empty' | 'corrupt'; message?: string };

export function serialize(save: SaveFile): string {
  return JSON.stringify(save);
}

export function parseSave(text: string): LoadResult {
  let raw: Raw;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { ok: false, reason: 'corrupt', message: (e as Error).message };
  }
  try {
    const m = migrate(raw);
    const repairedFromVersion = raw.version !== SAVE_VERSION;
    const state = sanitizeState(m.state);
    const snapshots: Record<number, GameState> = {};
    if (m.snapshots && typeof m.snapshots === 'object') {
      for (const [k, v] of Object.entries(m.snapshots as Raw)) {
        try {
          const n = Number(k);
          if (Number.isInteger(n)) snapshots[n] = sanitizeState(v);
        } catch {
          /* drop broken snapshot */
        }
      }
    }
    return {
      ok: true,
      repaired: repairedFromVersion,
      save: { version: SAVE_VERSION, savedAt: typeof m.savedAt === 'string' ? m.savedAt : new Date().toISOString(), state, snapshots },
    };
  } catch (e) {
    return { ok: false, reason: 'corrupt', message: (e as Error).message };
  }
}

export function loadSave(kv: KV): LoadResult {
  const text = kv.getItem(SAVE_KEY);
  if (!text) return { ok: false, reason: 'empty' };
  const r = parseSave(text);
  if (!r.ok) kv.setItem(CORRUPT_KEY, text); // keep a copy for recovery/debugging
  return r;
}

export function writeSave(kv: KV, state: GameState, snapshots: Record<number, GameState>): SaveFile {
  const save: SaveFile = { version: SAVE_VERSION, savedAt: new Date().toISOString(), state, snapshots };
  kv.setItem(SAVE_KEY, serialize(save));
  return save;
}

export function clearSave(kv: KV): void {
  kv.removeItem(SAVE_KEY);
}

export function loadEndings(kv: KV): string[] {
  try {
    const v = JSON.parse(kv.getItem(ENDINGS_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function unlockEnding(kv: KV, id: string): string[] {
  const list = loadEndings(kv);
  if (!list.includes(id)) list.push(id);
  kv.setItem(ENDINGS_KEY, JSON.stringify(list));
  return list;
}
