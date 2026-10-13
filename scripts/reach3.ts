import { CHAPTERS } from '../src/content/chapters';
import { endingFitness, evaluateEnding, familyScore } from '../src/content/endings';
import { searchEnding } from '../src/game/story/search';
for (const t of ['university.distant.apart', 'vocational.distant.together', 'craft.distant.gone']) {
  for (const seed of [3, 17, 99]) {
    const r = searchEnding(CHAPTERS, evaluateEnding, t, endingFitness(t), { seed, budget: 8000, restarts: 8 });
    console.log(t, seed, r.found, r.ending, Math.round(familyScore(r.state)), r.state.stats.mourad, !!r.state.flags.mourad_recovering);
    if (r.found) break;
  }
}
