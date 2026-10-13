import { CHAPTERS } from '../src/content/chapters';
import { SIDES } from '../src/content/sides';
import { validateChapters } from '../src/game/story/validate';
const issues = validateChapters(CHAPTERS, SIDES.map((s) => s.dialogue));
for (const i of issues) console.log(`ch${i.chapter} [${i.where}] ${i.message}`);
console.log('issues:', issues.length, 'chapters:', CHAPTERS.length);
