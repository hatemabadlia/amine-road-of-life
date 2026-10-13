// Narrative coverage: chapter statistics + ending reachability.
import type { Chapter, GameState } from '../../types/game';
import { ALL_ENDINGS, endingFitness, evaluateEnding } from '../../content/endings';
import { isChoice, isLine } from './engine';
import { searchEnding } from './search';
import { BAD, GOOD, byTone, mulberry32, phased, playthrough, randomStrategy, weighted, type Strategy } from './simulate';
import { chapterSteps, presentCharacters, walkSteps } from './validate';

export interface ChapterStats {
  id: number;
  title: string;
  age: number;
  objectives: number;
  conditionalObjectives: number;
  lines: number;
  decisions: number;
  options: number;
  locations: string[];
  npcs: string[];
}

export function chapterStats(chapters: Chapter[]): ChapterStats[] {
  return chapters.map((ch) => {
    let lines = 0;
    let decisions = 0;
    let options = 0;
    const speakers = new Set<string>();
    for (const { steps } of chapterSteps(ch)) {
      walkSteps(steps, (s) => {
        if (isLine(s)) {
          lines++;
          if (s.s !== 'narrator' && s.s !== 'amine') speakers.add(s.s);
        } else if (isChoice(s)) {
          decisions++;
          options += s.choose.length;
        }
      });
    }
    const present = presentCharacters(ch);
    const locations = new Set<string>([ch.start.spot]);
    ch.objectives.forEach((o) => {
      if (o.type === 'goto') locations.add(o.target);
      if (o.type === 'talk') {
        const at = present.get(o.target);
        if (typeof at === 'string') locations.add(at);
      }
    });
    return {
      id: ch.id,
      title: ch.title,
      age: ch.age,
      objectives: ch.objectives.length,
      conditionalObjectives: ch.objectives.filter((o) => o.if).length,
      lines,
      decisions,
      options,
      locations: [...locations],
      npcs: [...speakers],
    };
  });
}

export interface Reachability {
  reached: Map<string, { via: 'random' | 'search'; sample: GameState }>;
  unreached: string[];
  runs: number;
}

export function randomPopulation(n: number, seedBase = 0): Strategy[] {
  const out: Strategy[] = [byTone(GOOD), byTone(BAD)];
  for (let i = 0; i < n; i++) {
    const seed = seedBase + i;
    const rnd = mulberry32(seed * 7919 + 13);
    const w = {
      good: 0.2 + rnd() * 3,
      bad: 0.2 + rnd() * 3,
      honest: 0.2 + rnd() * 3,
      lie: 0.2 + rnd() * 3,
      refuse: 0.2 + rnd() * 3,
      help: 0.2 + rnd() * 3,
      neutral: 0.2 + rnd() * 2,
    };
    const mode = i % 3;
    out.push(
      mode === 0
        ? randomStrategy(seed)
        : mode === 1
          ? weighted(seed, w)
          : phased(weighted(seed, w), 20 + (i % 40), weighted(seed + 1, { ...w, good: w.bad, bad: w.good, honest: w.lie, lie: w.honest })),
    );
  }
  return out;
}

export function computeReachability(chapters: Chapter[], randomRuns = 3000, searchBudget = 4000): Reachability {
  const reached = new Map<string, { via: 'random' | 'search'; sample: GameState }>();
  let runs = 0;
  for (const strat of randomPopulation(randomRuns)) {
    const s = playthrough(chapters, strat, evaluateEnding);
    runs++;
    if (!reached.has(s.ending!)) reached.set(s.ending!, { via: 'random', sample: s });
  }
  for (const e of ALL_ENDINGS) {
    if (reached.has(e.id)) continue;
    const r = searchEnding(chapters, evaluateEnding, e.id, endingFitness(e.id), { seed: e.id.length * 31 + runs, budget: searchBudget });
    runs += r.evaluations;
    if (r.found) reached.set(e.id, { via: 'search', sample: r.state });
  }
  return { reached, unreached: ALL_ENDINGS.filter((e) => !reached.has(e.id)).map((e) => e.id), runs };
}
