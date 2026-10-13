import { describe, expect, it } from 'vitest';
import { ConditionError, evalCond, flagsIn } from '../../src/game/story/conditions';
import { createState } from '../../src/game/story/engine';

describe('condition language', () => {
  const s = createState();
  s.flags.a = true;
  s.stats.trust = 60;
  s.money = 120;

  it('evaluates flags, negation and comparisons', () => {
    expect(evalCond(s, 'a')).toBe(true);
    expect(evalCond(s, '!a')).toBe(false);
    expect(evalCond(s, 'b')).toBe(false);
    expect(evalCond(s, 'trust>=60')).toBe(true);
    expect(evalCond(s, 'trust>60')).toBe(false);
    expect(evalCond(s, 'money>=100 & a')).toBe(true);
    expect(evalCond(s, 'b | trust<10 | a')).toBe(true);
    expect(evalCond(s, undefined)).toBe(true);
  });

  it('& binds tighter than |', () => {
    expect(evalCond(s, 'b & a | a')).toBe(true);
    expect(evalCond(s, 'b & a | b')).toBe(false);
  });

  it('rejects malformed expressions and unknown stats', () => {
    expect(() => evalCond(s, 'a &')).toThrow(ConditionError);
    expect(() => evalCond(s, 'strength>=5')).toThrow(ConditionError);
    expect(() => evalCond(s, 'a b')).toThrow(ConditionError);
  });

  it('lists referenced flags', () => {
    expect(flagsIn('a & !b | trust>=3 & c').sort()).toEqual(['a', 'b', 'c']);
  });
});
