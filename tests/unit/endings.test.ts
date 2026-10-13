import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../../src/content/chapters';
import { ALL_ENDINGS, endingById, endingFitness, evaluateEnding } from '../../src/content/endings';
import { computeReachability } from '../../src/game/story/coverage';
import { searchEnding } from '../../src/game/story/search';

describe('endings', () => {
  it('defines 72 distinct endings with distinct titles and epilogues', () => {
    expect(ALL_ENDINGS).toHaveLength(72);
    expect(new Set(ALL_ENDINGS.map((e) => e.id)).size).toBe(72);
    expect(new Set(ALL_ENDINGS.map((e) => e.title)).size).toBe(72);
    expect(new Set(ALL_ENDINGS.map((e) => e.paragraphs.join('|'))).size).toBe(72);
    expect(endingById('university.close.together')?.paragraphs).toHaveLength(4);
    expect(endingById('nope.x.y')).toBeNull();
  });

  it('every ending is reachable by a real playthrough (random play + guided search)', () => {
    const r = computeReachability(CHAPTERS, 1200, 3000);
    // retry the stubborn ones with more budget and different seeds
    for (const id of [...r.unreached]) {
      for (const seed of [3, 17, 99, 123]) {
        const s = searchEnding(CHAPTERS, evaluateEnding, id, endingFitness(id), { seed, budget: 8000, restarts: 8 });
        if (s.found) {
          r.reached.set(id, { via: 'search', sample: s.state });
          break;
        }
      }
    }
    const unreached = ALL_ENDINGS.map((e) => e.id).filter((id) => !r.reached.has(id));
    expect(r.reached.size).toBeGreaterThanOrEqual(60);
    expect(unreached).toEqual([]);
    for (const [id, v] of r.reached) expect(v.sample.ending).toBe(id);
  }, 240_000);
});
