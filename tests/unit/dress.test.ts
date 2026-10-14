import { describe, expect, it } from 'vitest';
import { createState, startChapter } from '../../src/game/story/engine';
import { CHAPTERS } from '../../src/content/chapters';
import { dressFor } from '../../src/game/store';

describe('chapter clothes', () => {
  it('chapter 20: school smock, then the team kit on cup day', () => {
    const g = createState();
    startChapter(g, CHAPTERS, 20);
    expect(dressFor(g, 'amine')?.outfit).toBe('smock');
    g.flags.chose_tournament = true;
    expect(dressFor(g, 'amine')?.outfit).toBe('smock'); // still the school day
    g.time = 1440 + 600; // the next morning
    expect(dressFor(g, 'amine')?.outfit).toBeUndefined();
    expect(dressFor(g, 'amine')?.shirt).toBe('#1e8449');
    expect(dressFor(g, 'walid')?.shirt).toBe('#1e8449');
    // the same object while nothing changes (no needless re-renders)
    expect(dressFor(g, 'amine')).toBe(dressFor(g, 'amine'));
  });
});
