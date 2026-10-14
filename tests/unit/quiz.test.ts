import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../../src/content/chapters';
import { makeQuestions, quizSteps, withQuiz } from '../../src/game/story/quiz';
import type { ChoiceStep } from '../../src/types/game';

function seeded(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

describe('study quiz', () => {
  it('asks age-appropriate questions with four distinct options including the answer', () => {
    for (let age = 10; age <= 18; age++)
      for (let seed = 1; seed < 40; seed++)
        for (const kind of ['math', 'culture'] as const) {
          const qs = makeQuestions(age, 3, seeded(seed * 7 + age), kind);
          expect(qs).toHaveLength(3);
          for (const q of qs) {
            expect(q.options).toHaveLength(4);
            expect(new Set(q.options).size).toBe(4);
            expect(q.options).toContain(q.answer);
          }
        }
  });

  it('computes the right answer for simple sums like 2 + 6', () => {
    for (let seed = 1; seed < 200; seed++)
      for (const q of makeQuestions(10, 2, seeded(seed))) {
        const m = /^(\d+) ([+−]) (\d+) = \?$/.exec(q.expr);
        expect(m).not.toBeNull();
        const [a, op, b] = [Number(m![1]), m![2], Number(m![3])];
        expect(Number(q.answer)).toBe(op === '+' ? a + b : a - b);
      }
  });

  it('rewards only the right answer and stays out of the decision history', () => {
    const steps = quizSteps(12, 3, 'math', seeded(5)) as ChoiceStep[];
    for (const s of steps) {
      expect(s.quiz).toBeDefined();
      expect(s.choose.filter((c) => c.fx?.grades === 1)).toHaveLength(1);
    }
  });

  it('is inserted after the first scene line of every study objective', () => {
    const studied = CHAPTERS.flatMap((c) => c.objectives.filter((o) => o.quiz));
    expect(studied.length).toBeGreaterThanOrEqual(10);
    for (const o of studied) {
      const merged = withQuiz(o.dialogue ?? [], quizSteps(15, o.quiz!.n));
      expect(merged.length).toBe((o.dialogue?.length ?? 0) + o.quiz!.n);
    }
  });
});
