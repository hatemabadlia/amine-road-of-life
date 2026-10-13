// Static validation of the story content. Detects missing dialogue, invalid
// scene references, unknown flags, softlock-prone choices and broken chapters.
import type { Chapter, Choice, Objective, Step } from '../../types/game';
import { STAT_KEYS } from '../../types/game';
import { CHARACTERS, NARRATOR, PLAYER, characterById } from '../../content/characters';
import { OBJECTS, SPOTS, spotById, objectById } from '../world/layout';
import { compile, flagsIn } from './conditions';
import { isChoice, isCond, isFx, isLine, parseTime } from './engine';

export interface Issue {
  chapter: number;
  where: string;
  message: string;
}

/** Walk every step in a dialogue tree. */
export function walkSteps(steps: Step[] | undefined, visit: (s: Step) => void): void {
  for (const s of steps ?? []) {
    visit(s);
    if (isChoice(s)) s.choose.forEach((c) => walkSteps(c.then, visit));
    else if (isCond(s)) {
      walkSteps(s.then, visit);
      walkSteps(s.else, visit);
    }
  }
}

export function chapterSteps(ch: Chapter): { where: string; steps: Step[] }[] {
  return [
    { where: 'opening', steps: ch.opening },
    ...ch.objectives.map((o) => ({ where: `objective:${o.id}`, steps: o.dialogue ?? [] })),
    { where: 'closing', steps: ch.closing },
  ];
}

/** Characters present in a chapter (default homes unless absent / out of age range). */
export function presentCharacters(ch: Chapter): Map<string, string | [number, number]> {
  const out = new Map<string, string | [number, number]>();
  for (const c of CHARACTERS) {
    if (ch.absent?.includes(c.id)) continue;
    const castSpot = ch.cast?.[c.id];
    if (castSpot) {
      out.set(c.id, castSpot);
      continue;
    }
    if (c.ages && (ch.age < c.ages[0] || ch.age > c.ages[1])) continue;
    out.set(c.id, c.home);
  }
  return out;
}

/** Every flag any content (or the ending system) can set. */
export function collectSetFlags(chapters: Chapter[], extra: Step[][] = []): Set<string> {
  const set = new Set<string>();
  const add = (fs?: string[]) => fs?.forEach((f) => set.add(f));
  const visit = (s: Step) => {
    if (isLine(s)) add(s.set);
    else if (isChoice(s)) s.choose.forEach((c: Choice) => add(c.set));
    else if (isFx(s)) add(s.set);
  };
  for (const ch of chapters) {
    for (const { steps } of chapterSteps(ch)) walkSteps(steps, visit);
    for (const o of ch.objectives) add(o.onLate?.set);
  }
  extra.forEach((steps) => walkSteps(steps, visit));
  return set;
}

export function validateChapters(chapters: Chapter[], extraSteps: Step[][] = []): Issue[] {
  const issues: Issue[] = [];
  const err = (chapter: number, where: string, message: string) => issues.push({ chapter, where, message });
  const setFlags = collectSetFlags(chapters, extraSteps);
  const knownSpeakers = new Set([PLAYER, NARRATOR, ...CHARACTERS.map((c) => c.id)]);

  // registry-level
  const ids = chapters.map((c) => c.id);
  for (let i = 1; i <= 68; i++) if (!ids.includes(i)) err(i, 'registry', `Chapter ${i} missing`);
  if (new Set(ids).size !== ids.length) err(0, 'registry', 'Duplicate chapter ids');
  const titles = chapters.map((c) => c.title);
  if (new Set(titles).size !== titles.length) err(0, 'registry', 'Duplicate chapter titles');
  for (let i = 1; i < chapters.length; i++) {
    if (chapters[i].age < chapters[i - 1].age) err(chapters[i].id, 'age', 'Age decreases between chapters');
  }

  const checkCond = (ch: number, where: string, expr?: string) => {
    if (!expr) return;
    try {
      compile(expr);
      for (const f of flagsIn(expr)) if (!setFlags.has(f)) err(ch, where, `Condition references flag "${f}" that is never set`);
    } catch (e) {
      err(ch, where, (e as Error).message);
    }
  };
  const checkFx = (ch: number, where: string, fx?: Record<string, number | undefined>) => {
    for (const k of Object.keys(fx ?? {})) {
      if (k !== 'money' && k !== 'savings' && !(STAT_KEYS as readonly string[]).includes(k)) err(ch, where, `Unknown effect "${k}"`);
    }
  };

  for (const ch of chapters) {
    if (!ch.title.trim() || !ch.summary.trim() || !ch.mission.trim()) err(ch.id, 'meta', 'Empty title/summary/mission');
    if (!spotById.has(ch.start.spot)) err(ch.id, 'start', `Unknown start spot "${ch.start.spot}"`);
    try {
      parseTime(ch.start.time);
    } catch {
      err(ch.id, 'start', `Bad start time ${ch.start.time}`);
    }
    if (!ch.opening.length) err(ch.id, 'opening', 'Empty opening scene');
    if (!ch.closing.length) err(ch.id, 'closing', 'Empty closing scene');
    if (ch.objectives.length < 3) err(ch.id, 'objectives', 'Fewer than 3 objectives');
    for (const [npc, spot] of Object.entries(ch.cast ?? {})) {
      if (!characterById.has(npc)) err(ch.id, 'cast', `Unknown character "${npc}"`);
      if (!spotById.has(spot)) err(ch.id, 'cast', `Unknown spot "${spot}" for ${npc}`);
    }
    const present = presentCharacters(ch);
    const objIds = new Set<string>();
    let decisions = 0;
    const decisionIds = new Set<string>();

    ch.objectives.forEach((o: Objective) => {
      const where = `objective:${o.id}`;
      if (objIds.has(o.id)) err(ch.id, where, 'Duplicate objective id');
      objIds.add(o.id);
      if (!o.text.trim()) err(ch.id, where, 'Empty objective text');
      checkCond(ch.id, where, o.if);
      if (o.type === 'goto' && !spotById.has(o.target)) err(ch.id, where, `Unknown spot "${o.target}"`);
      if (o.type === 'use' && !objectById.has(o.target)) err(ch.id, where, `Unknown object "${o.target}"`);
      if (o.type === 'talk') {
        if (!characterById.has(o.target)) err(ch.id, where, `Unknown character "${o.target}"`);
        else if (!present.has(o.target) && !ch.objectives.some((x) => x.moves?.some((m) => m.npc === o.target))) {
          err(ch.id, where, `Character "${o.target}" is not present in this chapter`);
        }
      }
      if ((o.type === 'talk' || o.type === 'use') && !o.dialogue?.length) err(ch.id, where, 'Interaction without dialogue');
      if (o.deadline) {
        try {
          parseTime(o.deadline);
        } catch {
          err(ch.id, where, `Bad deadline ${o.deadline}`);
        }
      }
      if (o.skipTo) {
        try {
          parseTime(o.skipTo);
        } catch {
          err(ch.id, where, `Bad skipTo ${o.skipTo}`);
        }
      }
      checkFx(ch.id, where, o.onLate?.fx);
      for (const m of o.moves ?? []) {
        if (!characterById.has(m.npc)) err(ch.id, where, `Move of unknown character "${m.npc}"`);
        if (!spotById.has(m.spot)) err(ch.id, where, `Move to unknown spot "${m.spot}"`);
        checkCond(ch.id, where, m.if);
      }
    });
    // a chapter must have at least one unconditional objective so it can never be empty
    if (!ch.objectives.some((o) => !o.if)) err(ch.id, 'objectives', 'All objectives are conditional');

    for (const { where, steps } of chapterSteps(ch)) {
      walkSteps(steps, (s) => {
        if (isLine(s)) {
          if (!knownSpeakers.has(s.s)) err(ch.id, where, `Unknown speaker "${s.s}"`);
          if (!s.t.trim()) err(ch.id, where, 'Empty line');
          checkCond(ch.id, where, s.if);
          checkFx(ch.id, where, s.fx);
        } else if (isChoice(s)) {
          decisions++;
          if (decisionIds.has(s.id)) err(ch.id, where, `Duplicate decision id "${s.id}"`);
          decisionIds.add(s.id);
          if (s.choose.length < 2) err(ch.id, where, `Decision "${s.id}" has fewer than 2 options`);
          if (!s.choose.some((c) => !c.if)) err(ch.id, where, `Decision "${s.id}" has no unconditional fallback option`);
          s.choose.forEach((c) => {
            if (!c.t.trim()) err(ch.id, where, `Empty option in "${s.id}"`);
            checkCond(ch.id, where, c.if);
            checkFx(ch.id, where, c.fx);
            if ((c.fx?.savings ?? 0) > 0 && (c.fx?.money ?? 0) < 0 && !c.if?.includes('money>=')) {
              err(ch.id, where, `Option in "${s.id}" moves money to savings without a money>= guard`);
            }
          });
        } else if (isCond(s)) {
          checkCond(ch.id, where, s.if);
        } else {
          checkFx(ch.id, where, s.fx);
        }
      });
    }
    if (decisions < 1) err(ch.id, 'decisions', 'Chapter has no player decisions');
  }
  return issues;
}

export const KNOWN_SPOTS = SPOTS.map((s) => s.id);
export const KNOWN_OBJECTS = OBJECTS.map((o) => o.id);
