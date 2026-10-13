import { CHAPTERS } from '../src/content/chapters';
import { evaluateEnding, familyScore, pathOf } from '../src/content/endings';
import { playthrough, randomStrategy, weighted, mulberry32, phased } from '../src/game/story/simulate';
const scores: number[] = []; const mour: number[] = [];
for (let i = 0; i < 1500; i++) {
  const rnd = mulberry32(i * 7919);
  const w = { good: 0.2 + rnd() * 3, bad: 0.2 + rnd() * 3, honest: 0.2 + rnd() * 3, lie: 0.2 + rnd() * 3, refuse: 0.2 + rnd() * 3, help: 0.2 + rnd() * 3, neutral: 0.2 + rnd() * 2 };
  const strat = i % 3 === 0 ? randomStrategy(i) : i % 3 === 1 ? weighted(i, w) : phased(weighted(i, w), 20 + (i % 40), weighted(i + 1, { ...w, good: w.bad, bad: w.good }));
  const s = playthrough(CHAPTERS, strat, evaluateEnding, { late: () => rnd() < 0.2 });
  scores.push(familyScore(s)); mour.push(s.stats.mourad);
}
const q = (a: number[]) => { const b = [...a].sort((x, y) => x - y); return [0, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 1].map((p) => Math.round(b[Math.min(b.length - 1, Math.floor(p * b.length))])); };
console.log('family', q(scores)); console.log('mourad', q(mour));
