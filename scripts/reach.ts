import { CHAPTERS } from '../src/content/chapters';
import { computeReachability } from '../src/game/story/coverage';
const t = Date.now();
const r = computeReachability(CHAPTERS, Number(process.argv[2] ?? 1500), Number(process.argv[3] ?? 3000));
console.log('reached', r.reached.size, 'runs', r.runs, 'ms', Date.now() - t);
console.log('via search:', [...r.reached].filter(([, v]) => v.via === 'search').map(([k]) => k).join(' '));
console.log('unreached:', r.unreached.join(' '));
