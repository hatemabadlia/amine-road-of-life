import { describe, expect, it } from 'vitest';
import type { Chapter } from '../../src/types/game';
import {
  DialogueRunner,
  allowanceFor,
  applyFx,
  checkDeadline,
  completeObjective,
  createState,
  finishChapter,
  parseTime,
  peekObjective,
  resolveObjective,
  startChapter,
} from '../../src/game/story/engine';
import { CHAPTERS } from '../../src/content/chapters';
import { evaluateEnding } from '../../src/content/endings';

const mini: Chapter[] = [
  {
    id: 1, act: 1, title: 't1', mission: 'm', age: 10, summary: 's', start: { spot: 'home_bedroom', time: '07:00' }, allowance: false,
    opening: [{ s: 'narrator', t: 'o' }],
    objectives: [
      { id: 'a', text: 'a', type: 'goto', target: 'home_door', deadline: '08:00', onLate: { set: ['was_late'], fx: { trust: -5 } } },
      { id: 'b', text: 'b', type: 'talk', target: 'mama', if: 'was_late', dialogue: [{ s: 'mama', t: 'late!' }] },
      { id: 'c', text: 'c', type: 'use', target: 'bed', skipTo: '09:00', dialogue: [{ s: 'amine', t: 'x' }] },
    ],
    closing: [{ s: 'narrator', t: 'c' }],
  },
  {
    id: 2, act: 1, title: 't2', mission: 'm', age: 11, summary: 's', start: { spot: 'home_bedroom', time: '10:00' },
    opening: [{ s: 'narrator', t: 'o' }], objectives: [{ id: 'z', text: 'z', type: 'goto', target: 'home_door' }], closing: [{ s: 'narrator', t: 'c' }],
  },
];

describe('state and effects', () => {
  it('clamps indicators to 0..100 and money to >= 0', () => {
    const s = createState();
    applyFx(s, { trust: 500, risk: -500, money: -10_000, savings: -5 });
    expect(s.stats.trust).toBe(100);
    expect(s.stats.risk).toBe(0);
    expect(s.money).toBe(0);
    expect(s.savings).toBe(0);
  });

  it('reports changes and sets/unsets flags', () => {
    const s = createState();
    const ch = applyFx(s, { money: 30, honesty: -5 }, ['x'], []);
    expect(ch).toEqual([{ key: 'money', delta: 30 }, { key: 'honesty', delta: -5 }]);
    expect(s.flags.x).toBe(true);
    applyFx(s, undefined, undefined, ['x']);
    expect(s.flags.x).toBeUndefined();
  });

  it('rejects unknown effect keys', () => {
    expect(() => applyFx(createState(), { strength: 3 } as never)).toThrow();
  });

  it('allowance depends on age and consequences', () => {
    const s = createState();
    expect(allowanceFor(s)).toBe(50);
    s.age = 14;
    expect(allowanceFor(s)).toBe(100);
    s.flags.allowance_cut = true;
    expect(allowanceFor(s)).toBe(50);
    s.age = 17;
    delete s.flags.allowance_cut;
    expect(allowanceFor(s)).toBe(200);
  });
});

describe('missions', () => {
  it('skips conditional objectives, applies deadlines without blocking, and time-skips', () => {
    const s = createState();
    startChapter(s, mini, 1);
    expect(s.time).toBe(parseTime('07:00'));
    const a = resolveObjective(s, mini[0])!;
    expect(a.id).toBe('a');
    s.time = parseTime('08:30');
    const late = checkDeadline(s, a)!;
    expect(late.length).toBeGreaterThan(0);
    expect(s.flags.was_late).toBe(true);
    expect(checkDeadline(s, a)).toBeNull(); // fires once
    completeObjective(s, mini[0], 'a');
    expect(resolveObjective(s, mini[0])!.id).toBe('b'); // condition now true
    completeObjective(s, mini[0], 'b');
    const c = resolveObjective(s, mini[0])!;
    expect(c.id).toBe('c');
    expect(s.time % 1440).toBe(parseTime('09:00'));
    completeObjective(s, mini[0], 'c');
    expect(resolveObjective(s, mini[0])).toBeNull();
  });

  it('marks conditional objectives as skipped when false', () => {
    const s = createState();
    startChapter(s, mini, 1);
    completeObjective(s, mini[0], 'a');
    expect(peekObjective(s, mini[0])!.id).toBe('c');
    expect(resolveObjective(s, mini[0])!.id).toBe('c');
    expect(s.done).toContain('b');
  });

  it('chapter completion unlocks the next chapter and gives allowance', () => {
    const s = createState();
    startChapter(s, mini, 1);
    const money = s.money;
    finishChapter(s, mini, () => 'x');
    expect(s.completed).toContain(1);
    expect(s.chapter).toBe(2);
    expect(s.age).toBe(11);
    expect(s.done).toEqual([]);
    expect(s.money).toBe(money + 50);
  });

  it('a cut allowance comes back once trust is rebuilt', () => {
    const s = createState();
    startChapter(s, mini, 1);
    s.flags.allowance_cut = true;
    s.stats.trust = 30;
    finishChapter(s, mini, () => 'x');
    expect(s.flags.allowance_cut).toBe(true);
    s.stats.trust = 90;
    const money = s.money;
    const changes = startChapter(s, mini, 2);
    expect(s.flags.allowance_cut).toBeUndefined();
    expect(changes.some((c) => c.note?.includes('رجعولك المصروف'))).toBe(true);
    expect(s.money).toBe(money + 50);
  });

  it('finishing chapter 68 evaluates an ending', () => {
    const s = createState();
    startChapter(s, CHAPTERS, 68);
    finishChapter(s, CHAPTERS, evaluateEnding);
    expect(s.phase).toBe('ending');
    expect(s.ending).toMatch(/^\w+\.\w+\.\w+$/);
  });
});

describe('dialogue runner', () => {
  it('walks lines, branches on conditions and records decisions', () => {
    const s = createState();
    const r = new DialogueRunner(
      [
        { s: 'mama', t: 'hi', fx: { parents: 1 } },
        { id: 'q', choose: [{ t: 'yes', tone: 'good', fx: { trust: 5 }, set: ['said_yes'], then: [{ s: 'mama', t: 'great' }] }, { t: 'no', tone: 'bad' }, { t: 'secret', if: 'never_set' }] },
        { if: 'said_yes', then: [{ s: 'baba', t: 'proud' }], else: [{ s: 'baba', t: 'hm' }] },
        { fx: { money: 10 }, note: 'gift' },
      ],
      1,
    );
    expect(r.next(s)).toEqual({ kind: 'line', speaker: 'mama', text: 'hi' });
    const v = r.next(s)!;
    expect(v.kind).toBe('choice');
    if (v.kind === 'choice') expect(v.options.map((o) => o.text)).toEqual(['yes', 'no']);
    expect(() => r.choose(s, 2)).toThrow();
    r.choose(s, 0);
    expect(r.next(s)).toMatchObject({ text: 'great' });
    expect(r.next(s)).toMatchObject({ speaker: 'baba', text: 'proud' });
    expect(r.next(s)).toBeNull();
    expect(s.money).toBe(30);
    expect(s.history).toEqual([{ chapter: 1, id: 'q', choice: 'yes', tone: 'good' }]);
    expect(r.drainChanges().some((c) => c.note === 'gift')).toBe(true);
  });
});
