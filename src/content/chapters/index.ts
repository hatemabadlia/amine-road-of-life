// Chapter registry: all 68 chapters, in order.
import type { Chapter } from '../../types/game';
import { ACT1A } from './act1a';
import { ACT1B } from './act1b';
import { ACT2A } from './act2a';
import { ACT2B } from './act2b';
import { ACT3A } from './act3a';
import { ACT3B } from './act3b';

export const CHAPTERS: Chapter[] = [...ACT1A, ...ACT1B, ...ACT2A, ...ACT2B, ...ACT3A, ...ACT3B].sort((a, b) => a.id - b.id);

export const ACT_TITLES: Record<1 | 2 | 3, string> = {
  1: 'الفصل الأول — الطفولة',
  2: 'الفصل الثاني — المراهقة',
  3: 'الفصل الثالث — الشباب',
};
