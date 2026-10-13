// Resolves where each character stands in a chapter.
import type { Chapter, GameState } from '../../types/game';
import { evalCond } from '../story/conditions';
import { CHARACTERS } from '../../content/characters';
import { spotById } from './layout';

export interface Placement {
  id: string;
  x: number;
  z: number;
}

function hashAngle(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (h % 360) * (Math.PI / 180);
}

/** Spot overrides from completed objectives' `moves` (later objectives win). */
export function movedSpots(ch: Chapter, state: GameState | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!state) return out;
  for (const o of ch.objectives) {
    if (!o.moves || !state.done.includes(o.id)) continue;
    for (const m of o.moves) if (evalCond(state, m.if)) out[m.npc] = m.spot;
  }
  return out;
}

export function castPositions(ch: Chapter, state: GameState | null = null): Placement[] {
  const out: Placement[] = [];
  const moved = movedSpots(ch, state);
  for (const c of CHARACTERS) {
    if (ch.absent?.includes(c.id)) continue;
    const spotId = moved[c.id] ?? ch.cast?.[c.id];
    if (spotId) {
      const s = spotById.get(spotId)!;
      const a = hashAngle(c.id);
      const r = Math.min(1.4, s.r * 0.6);
      out.push({ id: c.id, x: s.x + Math.cos(a) * r, z: s.z + Math.sin(a) * r });
      continue;
    }
    if (c.ages && (ch.age < c.ages[0] || ch.age > c.ages[1])) continue;
    out.push({ id: c.id, x: c.home[0], z: c.home[1] });
  }
  return out;
}
