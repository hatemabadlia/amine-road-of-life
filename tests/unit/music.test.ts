// Music composition and theme selection (pure parts of the audio system).
import { describe, expect, it } from 'vitest';
import { composePhrase, themeFor } from '../../src/game/audio/music';

describe('music', () => {
  it('composes a 4-bar phrase that starts on a note and resolves to the tonic', () => {
    const p = composePhrase(7, 0.5);
    expect(p).toHaveLength(32);
    expect(p[0]).not.toBeNull();
    expect(p[31]).toBe(0);
    expect(p.filter((d) => d !== null).length).toBeGreaterThan(8);
  });

  it('is deterministic per seed and differs between chapters', () => {
    expect(composePhrase(3, 0.5)).toEqual(composePhrase(3, 0.5));
    expect(composePhrase(3, 0.5)).not.toEqual(composePhrase(4, 0.5));
  });

  it('picks themes by screen, life stage, night and tension', () => {
    const base = { screen: 'game', age: 10, hour: 10, risk: 0, ending: false };
    expect(themeFor({ ...base, screen: 'menu' })).toBe('menu');
    expect(themeFor(base)).toBe('childhood');
    expect(themeFor({ ...base, age: 14 })).toBe('youth');
    expect(themeFor({ ...base, age: 17 })).toBe('adult');
    expect(themeFor({ ...base, hour: 23 })).toBe('night');
    expect(themeFor({ ...base, risk: 80 })).toBe('tense');
    expect(themeFor({ ...base, ending: true })).toBe('ending');
  });
});
