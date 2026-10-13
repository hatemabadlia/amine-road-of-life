// Guided search for a playthrough that reaches a specific ending. Used to
// prove reachability of endings that random play rarely finds. Every result
// is a genuine playthrough through the real engine and content.
import type { Chapter, GameState } from '../../types/game';
import { mulberry32, playthrough, type Strategy } from './simulate';

export interface SearchResult {
  found: boolean;
  ending: string;
  state: GameState;
  evaluations: number;
  /** decisions taken, as chapter:decision -> option text */
  route: string[];
}

type Genome = Map<string, number>;

function strategyFrom(genome: Genome, rnd: () => number, route: string[]): Strategy {
  return ({ chapter, choiceId, options }) => {
    const key = `${chapter}:${choiceId}`;
    let g = genome.get(key);
    if (g === undefined) {
      g = Math.floor(rnd() * 1000);
      genome.set(key, g);
    }
    const o = options[g % options.length];
    route.push(`${key} -> ${o.text}`);
    return o.index;
  };
}

/**
 * Evolutionary search: mutate a choice genome and keep improvements according
 * to `fitness` (higher is better, Infinity when the target is reached).
 */
export function searchEnding(
  chapters: Chapter[],
  evaluate: (s: GameState) => string,
  target: string,
  fitness: (s: GameState) => number,
  opts: { seed?: number; budget?: number; restarts?: number } = {},
): SearchResult {
  const budget = opts.budget ?? 3000;
  const restarts = opts.restarts ?? 6;
  const rnd = mulberry32(opts.seed ?? 1);
  let evaluations = 0;
  let bestOverall: { score: number; genome: Genome } | null = null;

  const run = (genome: Genome) => {
    const route: string[] = [];
    const g = new Map(genome);
    const state = playthrough(chapters, strategyFrom(g, rnd, route), evaluate);
    evaluations++;
    return { state, genome: g, route, score: state.ending === target ? Infinity : fitness(state) };
  };

  for (let r = 0; r < restarts && evaluations < budget; r++) {
    let current = run(bestOverall && r % 2 ? bestOverall.genome : new Map());
    const perRestart = Math.floor(budget / restarts);
    for (let i = 0; i < perRestart && evaluations < budget; i++) {
      if (current.score === Infinity) return { found: true, ending: current.state.ending!, state: current.state, evaluations, route: current.route };
      const child = new Map(current.genome);
      const keys = [...child.keys()];
      const mutations = 1 + Math.floor(rnd() * 4);
      for (let m = 0; m < mutations && keys.length; m++) child.set(keys[Math.floor(rnd() * keys.length)], Math.floor(rnd() * 1000));
      const next = run(child);
      if (next.score >= current.score) current = next;
    }
    if (!bestOverall || current.score > bestOverall.score) bestOverall = { score: current.score, genome: current.genome };
  }
  const final = run(bestOverall!.genome);
  return { found: final.state.ending === target, ending: final.state.ending!, state: final.state, evaluations, route: final.route };
}
