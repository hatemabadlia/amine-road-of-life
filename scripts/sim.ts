import { CHAPTERS } from '../src/content/chapters';
import { ALL_ENDINGS, evaluateEnding } from '../src/content/endings';
import { playthrough, randomStrategy, weighted, mulberry32, byTone, GOOD, BAD, phased } from '../src/game/story/simulate';
const counts = new Map<string, number>();
const N = Number(process.argv[2] ?? 3000);
const t0 = Date.now();
for (let i = 0; i < N; i++) {
  const rnd = mulberry32(i * 7919);
  const mode = i % 4;
  const w = { good: 0.2 + rnd() * 3, bad: 0.2 + rnd() * 3, honest: 0.2 + rnd() * 3, lie: 0.2 + rnd() * 3, refuse: 0.2 + rnd() * 3, help: 0.2 + rnd() * 3, neutral: 0.2 + rnd() * 2 };
  const strat = mode === 0 ? randomStrategy(i) : mode === 1 ? weighted(i, w) : phased(weighted(i, w), 20 + (i % 40), weighted(i + 1, { ...w, good: w.bad, bad: w.good }));
  const s = playthrough(CHAPTERS, strat, evaluateEnding, { late: () => rnd() < 0.2 });
  counts.set(s.ending!, (counts.get(s.ending!) ?? 0) + 1);
}
const fixed = [byTone(GOOD), byTone(BAD)];
for (const f of fixed) { const s = playthrough(CHAPTERS, f, evaluateEnding); console.log('fixed', s.ending, JSON.stringify(s.stats), s.money, s.savings); }
console.log('ms', Date.now() - t0, 'distinct', counts.size, '/', ALL_ENDINGS.length);
const by = (k: number) => { const m = new Map<string, number>(); for (const [id, c] of counts) { const p = id.split('.')[k]; m.set(p, (m.get(p) ?? 0) + c); } return m; };
console.log([...by(0)], [...by(1)], [...by(2)]);
console.log('missing:', ALL_ENDINGS.filter((e) => !counts.has(e.id)).map((e) => e.id).join(' '));
