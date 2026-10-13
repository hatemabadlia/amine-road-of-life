// Complete player journeys through all 68 chapters using the real engine + content.
import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../../src/content/chapters';
import { evaluateEnding, familyOf, pathOf } from '../../src/content/endings';
import { BAD, GOOD, byTone, phased, playthrough, randomStrategy, type Strategy } from '../../src/game/story/simulate';
import type { Tone } from '../../src/types/game';

const prefer = (...t: Tone[]) => byTone([...t, 'neutral', 'good', 'bad']);
/** pick a specific option text if present, otherwise defer */
const pick = (rules: Record<string, number | ((n: number) => number)>, fallback: Strategy): Strategy => (ctx) => {
  const r = rules[`${ctx.chapter}:${ctx.choiceId}`];
  if (r === undefined) return fallback(ctx);
  const idx = typeof r === 'function' ? r(ctx.options.length) : r;
  return ctx.options.some((o) => o.index === idx) ? idx : fallback(ctx);
};

describe('player journeys', () => {
  it('1. Responsible Amine — studies, tells the truth, helps Mourad', () => {
    const s = playthrough(CHAPTERS, byTone(GOOD), evaluateEnding);
    expect(s.phase).toBe('ending');
    expect(s.completed).toHaveLength(68);
    expect(s.flags.skipped_ch1).toBeUndefined();
    expect(s.flags.amine_used).toBeUndefined();
    expect(s.flags.path_study && s.flags.bac_passed).toBe(true);
    expect(s.flags.mourad_recovering).toBe(true);
    expect(s.ending).toBe('university.close.together');
  });

  it('2. Amine who repeatedly skips school and lies', () => {
    const s = playthrough(CHAPTERS, prefer('lie', 'bad'), evaluateEnding, { late: () => true });
    expect(s.flags.skipped_ch1).toBe(true);
    expect(s.flags.skipped_ch16).toBe(true);
    expect(s.flags.truant_habit).toBe(true);
    expect(s.stats.honesty).toBeLessThan(30);
    expect(s.stats.attendance).toBeLessThan(70);
    expect(pathOf(s)).toBe('drifting');
    expect(familyOf(s)).toBe('distant');
    expect(s.money).toBeGreaterThanOrEqual(0);
  });

  it('3. Amine faces peer pressure and refuses every time', () => {
    const s = playthrough(CHAPTERS, prefer('refuse', 'honest', 'help', 'good'), evaluateEnding);
    for (const f of ['refused_mourad_ch1', 'refused_kamel', 'refused_smoke_12', 'refused_cig_13', 'refused_drugs', 'refused_shortcut']) {
      expect(s.flags[f], f).toBe(true);
    }
    expect(s.flags.smoked).toBeUndefined();
    expect(s.flags.amine_used).toBeUndefined();
    expect(s.stats.risk).toBeLessThan(20);
    expect(s.stats.confidence).toBeGreaterThan(70);
  });

  it('4. Amine makes serious mistakes and later seeks help (recovery route)', () => {
    // bad choices through chapter 30 (including trying drugs), then honest help-seeking
    const strat = phased(prefer('bad', 'lie'), 31, prefer('honest', 'help', 'good', 'refuse'));
    const s = playthrough(CHAPTERS, strat, evaluateEnding);
    expect(s.flags.amine_used).toBe(true);
    expect(s.flags.amine_sought_help).toBe(true);
    expect(s.flags.family_knows_help).toBe(true);
    expect(pathOf(s)).toBe('recovery');
    // recovery takes effort: honesty rebuilt above the lying baseline but trust is not magically maxed
    expect(s.stats.honesty).toBeGreaterThan(50);
    const mid = playthrough(CHAPTERS, strat, evaluateEnding, { until: 32 });
    expect(mid.stats.trust).toBeLessThan(s.stats.trust);
  });

  it('5. Damaged relationships rebuilt through repeated effort', () => {
    const strat = phased(prefer('lie', 'bad'), 42, prefer('honest', 'good', 'help', 'refuse'));
    const atLow = playthrough(CHAPTERS, strat, evaluateEnding, { until: 41 });
    const s = playthrough(CHAPTERS, strat, evaluateEnding);
    expect(atLow.stats.trust).toBeLessThan(45);
    expect(s.flags.full_truth).toBe(true);
    expect(s.flags.repair_started).toBe(true);
    expect(s.stats.trust).toBeGreaterThan(atLow.stats.trust + 15);
    expect(familyOf(s)).not.toBe('distant');
  });

  it('school-skipping in chapter 1 has delayed consequences in chapter 5', () => {
    const skip = pick({ '1:skip_school': 0, '1:stay_or_return': 1, '1:evening_confess': 1 }, byTone(GOOD));
    const s = playthrough(CHAPTERS, skip, evaluateEnding, { until: 5 });
    expect(s.flags.school_called).toBe(true);
    expect(s.flags.letter_amine).toBe(true); // convocation is about Amine
    const clean = playthrough(CHAPTERS, byTone(GOOD), evaluateEnding, { until: 5 });
    expect(clean.flags.letter_mourad).toBe(true); // convocation is about Mourad instead
  });

  it('no softlocks: 300 random journeys (with random lateness) all reach an ending', () => {
    let rng = 1;
    for (let i = 0; i < 300; i++) {
      const s = playthrough(CHAPTERS, randomStrategy(i), evaluateEnding, { late: () => (rng = (rng * 48271) % 2147483647) % 3 === 0 });
      expect(s.phase).toBe('ending');
      expect(s.completed).toHaveLength(68);
      for (const v of Object.values(s.stats)) expect(v >= 0 && v <= 100).toBe(true);
      expect(s.money).toBeGreaterThanOrEqual(0);
    }
  });
});

void BAD;
