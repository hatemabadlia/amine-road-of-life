import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../../src/content/chapters';
import { evaluateEnding } from '../../src/content/endings';
import { createState } from '../../src/game/story/engine';
import { GOOD, byTone, playthrough } from '../../src/game/story/simulate';
import {
  CORRUPT_KEY,
  SAVE_KEY,
  SAVE_VERSION,
  loadEndings,
  loadSave,
  memoryStorage,
  parseSave,
  sanitizeState,
  unlockEnding,
  writeSave,
} from '../../src/game/save/save';

describe('save / load', () => {
  it('round-trips a mid-game state exactly', () => {
    const kv = memoryStorage();
    const s = playthrough(CHAPTERS, byTone(GOOD), evaluateEnding, { until: 12 });
    s.player = { x: 1, y: 0.5, z: -3, yaw: 1.2 };
    writeSave(kv, s, { 12: s });
    const r = loadSave(kv);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.save.state).toEqual(s);
      expect(r.save.snapshots[12]).toEqual(s);
      expect(r.save.version).toBe(SAVE_VERSION);
    }
  });

  it('reports empty storage', () => {
    expect(loadSave(memoryStorage())).toEqual({ ok: false, reason: 'empty' });
  });

  it('detects corrupted saves and keeps a backup copy', () => {
    const kv = memoryStorage();
    kv.setItem(SAVE_KEY, '{not json');
    const r = loadSave(kv);
    expect(r.ok).toBe(false);
    expect(kv.getItem(CORRUPT_KEY)).toBe('{not json');
    expect(parseSave(JSON.stringify({ version: 2, state: { chapter: 999 } })).ok).toBe(false);
    expect(parseSave(JSON.stringify({ version: 99, state: createState() })).ok).toBe(false);
  });

  it('migrates v1 saves (no savings/marks) to the current schema', () => {
    const old = createState() as unknown as Record<string, unknown>;
    delete old.savings;
    delete old.marks;
    const r = parseSave(JSON.stringify({ version: 1, savedAt: 'x', state: { ...old, chapter: 7 } }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.repaired).toBe(true);
      expect(r.save.state.savings).toBe(0);
      expect(r.save.state.marks).toEqual({});
      expect(r.save.state.chapter).toBe(7);
    }
  });

  it('repairs out-of-range values instead of crashing', () => {
    const bad = { ...createState(), money: -50, stats: { trust: 900, health: 'x' }, flags: { ok: true, bad: 3 }, player: { x: 1e9, y: 0, z: 0, yaw: 0 } };
    const s = sanitizeState(bad);
    expect(s.money).toBe(0);
    expect(s.stats.trust).toBe(100);
    expect(s.stats.health).toBe(90);
    expect(s.flags).toEqual({ ok: true });
    expect(s.player).toBeNull();
  });

  it('keeps an endings gallery separate from the save slot', () => {
    const kv = memoryStorage();
    unlockEnding(kv, 'a.b.c');
    unlockEnding(kv, 'a.b.c');
    unlockEnding(kv, 'x.y.z');
    expect(loadEndings(kv)).toEqual(['a.b.c', 'x.y.z']);
  });
});
