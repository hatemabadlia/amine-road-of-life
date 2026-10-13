import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../../src/content/chapters';
import { SIDES } from '../../src/content/sides';
import { CHARACTERS } from '../../src/content/characters';
import { validateChapters } from '../../src/game/story/validate';
import { chapterStats } from '../../src/game/story/coverage';
import { OBJECTS, SPOTS, WORLD_HALF } from '../../src/game/world/layout';

describe('chapter registry', () => {
  it('contains all 68 chapters in order with canonical acts and ages', () => {
    expect(CHAPTERS.map((c) => c.id)).toEqual(Array.from({ length: 68 }, (_, i) => i + 1));
    for (const c of CHAPTERS) {
      const act = c.id <= 22 ? 1 : c.id <= 45 ? 2 : 3;
      expect(c.act, `chapter ${c.id}`).toBe(act);
      expect(c.age).toBeGreaterThanOrEqual(act === 1 ? 10 : act === 2 ? 13 : 16);
      expect(c.age).toBeLessThanOrEqual(act === 1 ? 12 : act === 2 ? 15 : 18);
    }
  });

  it('passes static validation (references, flags, fallbacks, dialogue)', () => {
    const issues = validateChapters(CHAPTERS, SIDES.map((s) => s.dialogue));
    expect(issues.map((i) => `ch${i.chapter} ${i.where}: ${i.message}`)).toEqual([]);
  });

  it('every chapter has real content, and chapters 1–5 are the detailed slice', () => {
    const stats = chapterStats(CHAPTERS);
    for (const s of stats) {
      expect(s.lines, `chapter ${s.id} lines`).toBeGreaterThanOrEqual(8);
      expect(s.decisions, `chapter ${s.id} decisions`).toBeGreaterThanOrEqual(1);
      expect(s.objectives).toBeGreaterThanOrEqual(3);
    }
    for (const s of stats.slice(0, 5)) {
      expect(s.objectives, `chapter ${s.id}`).toBeGreaterThanOrEqual(7);
      expect(s.decisions, `chapter ${s.id}`).toBeGreaterThanOrEqual(4);
    }
    const ch1 = CHAPTERS[0];
    expect(ch1.objectives.map((o) => o.id).slice(0, 7)).toEqual(['wake', 'mama', 'wash', 'breakfast', 'father', 'leave', 'meet_mourad']);
  });

  it('world data is consistent', () => {
    for (const p of [...SPOTS, ...OBJECTS]) {
      expect(Math.abs(p.x)).toBeLessThan(WORLD_HALF);
      expect(Math.abs(p.z)).toBeLessThan(WORLD_HALF);
    }
    expect(new Set(SPOTS.map((s) => s.id)).size).toBe(SPOTS.length);
    expect(new Set(OBJECTS.map((s) => s.id)).size).toBe(OBJECTS.length);
    expect(new Set(CHARACTERS.map((s) => s.id)).size).toBe(CHARACTERS.length);
  });
});
