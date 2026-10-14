// Chapter registry: all 68 chapters, in order.
import type { Chapter, Objective } from '../../types/game';
import { ACT1A } from './act1a';
import { ACT1B } from './act1b';
import { ACT2A } from './act2a';
import { ACT2B } from './act2b';
import { ACT3A } from './act3a';
import { ACT3B } from './act3b';

export const CHAPTERS: Chapter[] = [...ACT1A, ...ACT1B, ...ACT2A, ...ACT2B, ...ACT3A, ...ACT3B].sort((a, b) => a.id - b.id);

/** Study moments that open with the quiz mini-game: chapter → objective → questions. */
const STUDY: Record<number, Record<string, Objective['quiz']>> = {
  1: { class: { n: 2 } }, // the teacher corrects the homework: 2 + 6...
  5: { exam: { n: 3 } },
  6: { study: { n: 2 } },
  9: { rewrite: { n: 2 } },
  14: { desk: { n: 2 } },
  20: { prepare_quiz: { n: 3, kind: 'culture' } },
  24: { exam_day: { n: 3 } },
  40: { study: { n: 3 } },
  44: { exam_desk: { n: 3 } },
  59: { bac: { n: 3 } },
};
for (const c of CHAPTERS)
  for (const o of c.objectives) {
    const q = STUDY[c.id]?.[o.id];
    if (q) o.quiz = q;
  }

export const ACT_TITLES: Record<1 | 2 | 3, string> = {
  1: 'الفصل الأول — الطفولة',
  2: 'الفصل الثاني — المراهقة',
  3: 'الفصل الثالث — الشباب',
};
