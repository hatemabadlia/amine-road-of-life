// Central game store: wraps the pure story engine for the UI and 3D scene.
import { create } from 'zustand';
import type { Chapter, GameState, Objective, Step } from '../types/game';
import type { Look } from '../content/characters';
import { CHAPTERS } from '../content/chapters';
import { SIDES, type SideActivity } from '../content/sides';
import { characterById } from '../content/characters';
import { evaluateEnding } from '../content/endings';
import {
  DialogueRunner,
  applyFx,
  checkDeadline,
  completeObjective,
  createState,
  finishChapter,
  formatTime,
  getChapter,
  parseTime,
  peekObjective,
  resolveObjective,
  startChapter,
  type Change,
  type DialogueView,
} from './story/engine';
import { evalCond } from './story/conditions';
import {
  browserStorage,
  clearSave,
  loadEndings,
  loadSave,
  unlockEnding,
  writeSave,
  SETTINGS_KEY,
  type KV,
} from './save/save';
import { objectById, spotById } from './world/layout';
import { BED, hasAction } from './player/actions';
import { quizSteps, withQuiz } from './story/quiz';
import { GOOD, byTone, playChapter } from './story/simulate';
import { sound } from './audio/sound';
import { music } from './audio/music';

export type Screen = 'menu' | 'game' | 'ending';

export type DialogueSource =
  | { kind: 'opening' }
  | { kind: 'closing' }
  | { kind: 'objective'; id: string }
  | { kind: 'side'; id: string }
  | { kind: 'ambient' };

export interface Toast {
  id: number;
  text: string;
  tone: 'good' | 'bad' | 'info';
}

export interface Settings {
  master: number;
  music: number;
  ambience: number;
  sfx: number;
  quality: 'low' | 'medium' | 'high';
  shadows: boolean;
  sensitivity: number;
  invertY: boolean;
  reducedMotion: boolean;
  textSpeed: 'normal' | 'fast' | 'instant';
  minimap: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  master: 0.8,
  music: 0.5,
  ambience: 0.6,
  sfx: 0.8,
  quality: 'high',
  shadows: true,
  sensitivity: 1,
  invertY: false,
  reducedMotion: false,
  textSpeed: 'normal',
  minimap: true,
};

/** Where the player should (re)appear. `nonce` changes trigger a teleport. */
export interface Spawn {
  x: number;
  z: number;
  yaw: number;
  nonce: number;
  /** start the chapter asleep in bed (Amine gets up when the first objective is done) */
  bed?: boolean;
}

/** Timestamp of the last dialogue close: guards against click-through onto the prompt. */
export const uiTiming = { dialogueClosedAt: 0 };

/** Live player pose written by the 3D controller every frame (not reactive). */
export const livePose = { x: 0, y: 1, z: 0, yaw: 0, speed: 0, inBed: false, pose: 'stand' as string };

const STAT_LABELS: Record<string, string> = {
  trust: 'ثقة الوالدين',
  anger: 'غضب الوالدين',
  health: 'الصحة',
  confidence: 'الثقة في النفس',
  risk: 'الخطر',
  attendance: 'الحضور',
  grades: 'القراية',
  honesty: 'الصدق',
  mourad: 'العلاقة مع مراد',
  parents: 'العلاقة مع العائلة',
  money: 'دج',
  savings: 'الحصالة',
};
export const statLabel = (k: string) => STAT_LABELS[k] ?? k;

/** For "bad when up" indicators the toast colour is inverted. */
const INVERTED = new Set(['anger', 'risk']);

interface GameStore {
  screen: Screen;
  game: GameState | null;
  snapshots: Record<number, GameState>;
  endings: string[];
  settings: Settings;
  hasSave: boolean;
  loadMessage: string | null;
  // presentation
  card: boolean;
  dialogue: { view: DialogueView; source: DialogueSource } | null;
  paused: boolean;
  journal: boolean;
  bigMap: boolean;
  toasts: Toast[];
  spawn: Spawn;
  saveFlash: number;
  /** a bus ride in progress (visual sequence; Amine is already at the destination) */
  ride: { to: string; started: number } | null;
  /** the furniture Amine is using (sitting, lying, bending at it) while its dialogue runs */
  using: string | null;

  newGame: () => void;
  /** play any chapter: from the player's own snapshot if reached, otherwise the missing chapters are played automatically on the good path */
  startAt: (id: number) => void;
  continueGame: () => void;
  replayChapter: (id: number) => void;
  loadSnapshotsForMenu: () => void;
  toMenu: () => void;
  dismissCard: () => void;
  endRide: () => void;
  interact: (target: string, kind: 'npc' | 'object') => void;
  advance: () => void;
  choose: (index: number) => void;
  arriveAt: (spotId: string) => void;
  tick: (seconds: number) => void;
  saveNow: (manual?: boolean) => void;
  setPaused: (v: boolean) => void;
  setJournal: (v: boolean) => void;
  setBigMap: (v: boolean) => void;
  updateSettings: (p: Partial<Settings>) => void;
  unstuck: () => void;
  footballGoal: () => void;
  pushToast: (text: string, tone?: Toast['tone']) => void;
}

let kv: KV = typeof window !== 'undefined' ? browserStorage() : (null as unknown as KV);
let runner: DialogueRunner | null = null;
let toastId = 0;
let spawnNonce = 1;

export function setStorage(k: KV) {
  kv = k;
}

function loadSettings(): Settings {
  try {
    const raw = kv?.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export const chapterOf = (g: GameState): Chapter => getChapter(CHAPTERS, g.chapter);

export function activeObjective(g: GameState | null): Objective | null {
  if (!g || g.phase !== 'play') return null;
  return peekObjective(g, chapterOf(g));
}

/** World position of an objective target, if any. */
export function objectiveTarget(o: Objective | null, npcPos: (id: string) => [number, number] | null): [number, number] | null {
  if (!o) return null;
  if (o.type === 'goto') {
    const s = spotById.get(o.target);
    return s ? [s.x, s.z] : null;
  }
  if (o.type === 'use') {
    const ob = objectById.get(o.target);
    return ob ? [ob.x, ob.z] : null;
  }
  return npcPos(o.target);
}

export function availableSide(g: GameState, target: string): SideActivity | null {
  return (
    SIDES.find(
      (s) =>
        s.target === target &&
        (s.minAge === undefined || g.age >= s.minAge) &&
        (s.maxAge === undefined || g.age <= s.maxAge) &&
        (s.repeatable || !g.sides.includes(s.id)),
    ) ?? null
  );
}

/** Clothes a character wears right now in this chapter (the same object while nothing changes). */
export function dressFor(g: GameState, id: string): Partial<Look> | undefined {
  const ch = chapterOf(g);
  const alt = ch.dressIf?.find((d) => id in d.dress && evalCond(g, d.if));
  return alt ? alt.dress[id] : ch.dress?.[id];
}

function spawnForChapter(g: GameState): Spawn {
  const ch = chapterOf(g);
  const s = spotById.get(ch.start.spot)!;
  // a morning that starts with getting out of bed: Amine wakes up in it
  const first = ch.objectives[0];
  if (first?.type === 'use' && first.target === 'bed' && parseTime(ch.start.time) < 12 * 60) return { x: BED.lie.x, z: BED.lie.z, yaw: 0, nonce: ++spawnNonce, bed: true };
  return { x: s.x, z: s.z, yaw: Math.PI, nonce: ++spawnNonce };
}

export const useGame = create<GameStore>((set, get) => {
  const toastsFrom = (changes: Change[]) => {
    for (const c of changes) {
      if (c.key === 'note' && c.note) {
        get().pushToast(c.note, 'info');
        continue;
      }
      if (c.key === 'money' || c.key === 'savings') {
        get().pushToast(`${c.note ? c.note + ': ' : ''}${c.delta > 0 ? '+' : ''}${c.delta} ${c.key === 'money' ? 'دج' : 'دج في الحصالة'}`, c.delta > 0 ? 'good' : 'info');
        if (c.key === 'money') sound.coin();
        continue;
      }
      if (Math.abs(c.delta) < 2) continue;
      const good = INVERTED.has(c.key) ? c.delta < 0 : c.delta > 0;
      get().pushToast(`${statLabel(c.key)} ${c.delta > 0 ? '▲' : '▼'} ${Math.abs(c.delta)}`, good ? 'good' : 'bad');
    }
  };

  /** Commit the mutated game object so subscribers re-render. */
  const commit = (extra: Partial<GameStore> = {}) => {
    const g = get().game;
    set({ game: g ? { ...g } : null, ...extra });
  };

  const persist = () => {
    const { game, snapshots } = get();
    if (!game) return;
    game.player = { x: livePose.x, y: livePose.y, z: livePose.z, yaw: livePose.yaw };
    try {
      writeSave(kv, game, snapshots);
      set({ hasSave: true, saveFlash: Date.now() });
    } catch {
      get().pushToast('ما قدرناش نحفظو اللعبة (المساحة ممتلئة؟)', 'bad');
    }
  };

  const startDialogue = (steps: Step[], source: DialogueSource) => {
    const g = get().game!;
    runner = new DialogueRunner(steps, g.chapter);
    const view = runner.next(g);
    toastsFrom(runner.drainChanges());
    if (!view) {
      runner = null;
      onDialogueEnd(source);
      return;
    }
    commit({ dialogue: { view, source } });
  };

  const beginPlay = () => {
    const g = get().game!;
    g.phase = 'play';
    const ch = chapterOf(g);
    const before = g.time;
    const o = resolveObjective(g, ch);
    if (g.time > before + 60) get().pushToast(`الوقت فات… ${formatTime(g.time)}`, 'info');
    if (!o) return beginClosing();
    commit();
    persist();
  };

  const beginClosing = () => {
    const g = get().game!;
    g.phase = 'closing';
    startDialogue(chapterOf(g).closing, { kind: 'closing' });
  };

  const onObjectiveDone = (id: string) => {
    const g = get().game!;
    const ch = chapterOf(g);
    completeObjective(g, ch, id);
    const rideTo = ch.objectives.find((o) => o.id === id)?.ride;
    if (rideTo) {
      // the bus takes ~20 game minutes; Amine arrives at the destination
      const s = spotById.get(rideTo)!;
      g.time += 20;
      livePose.x = s.x;
      livePose.z = s.z;
      set({ ride: { to: rideTo, started: performance.now() }, spawn: { x: s.x, z: s.z, yaw: Math.PI, nonce: ++spawnNonce } });
    }
    sound.objective();
    const before = g.time;
    const next = resolveObjective(g, ch);
    if (g.time > before + 60) get().pushToast(`الوقت فات… ${formatTime(g.time)}`, 'info');
    if (!next) return beginClosing();
    commit();
    persist();
  };

  const onDialogueEnd = (source: DialogueSource) => {
    const g = get().game!;
    uiTiming.dialogueClosedAt = performance.now();
    set({ dialogue: null });
    switch (source.kind) {
      case 'opening':
        return beginPlay();
      case 'objective':
        return onObjectiveDone(source.id);
      case 'side':
        if (!g.sides.includes(source.id)) g.sides.push(source.id);
        commit();
        persist();
        return;
      case 'closing': {
        const changes = finishChapter(g, CHAPTERS, evaluateEnding);
        if (g.phase === 'ending') {
          const endings = unlockEnding(kv, g.ending!);
          persist();
          sound.chapter();
          commit({ screen: 'ending', endings });
          return;
        }
        const snapshots = { ...get().snapshots, [g.chapter]: structuredClone(g) };
        set({ snapshots });
        commit({ card: true, spawn: spawnForChapter(g) });
        toastsFrom(changes);
        sound.chapter();
        persist();
        return;
      }
      default:
        commit();
    }
  };

  const initial = (() => {
    if (!kv) return { hasSave: false, endings: [] as string[], settings: { ...DEFAULT_SETTINGS } };
    const r = loadSave(kv);
    return {
      hasSave: r.ok,
      loadMessage: !r.ok && r.reason === 'corrupt' ? 'الحفظ القديم تخسّر، حفظنا نسخة منو. تقدر تبدا لعبة جديدة.' : null,
      endings: loadEndings(kv),
      settings: loadSettings(),
    };
  })();

  return {
    screen: 'menu',
    game: null,
    snapshots: {},
    loadMessage: null,
    ...initial,
    card: false,
    dialogue: null,
    paused: false,
    journal: false,
    bigMap: false,
    toasts: [],
    spawn: { x: -25, z: -23, yaw: Math.PI, nonce: 0 },
    ride: null,
    using: null,
    endRide: () => set({ ride: null }),
    saveFlash: 0,

    newGame: () => {
      const g = createState();
      startChapter(g, CHAPTERS, 1);
      runner = null;
      set({ snapshots: { 1: structuredClone(g) } });
      set({ game: g, screen: 'game', card: true, dialogue: null, paused: false, journal: false, spawn: spawnForChapter(g), loadMessage: null });
      persist();
    },

    startAt: (id) => {
      // continue from the player's own latest snapshot at or before this chapter, if there is one
      const own = get().snapshots;
      const base = Object.keys(own)
        .map(Number)
        .filter((k) => k <= id)
        .sort((a, b) => b - a)[0];
      let g: GameState;
      let snapshots: Record<number, GameState>;
      if (base) {
        g = structuredClone(own[base]);
        snapshots = Object.fromEntries(Object.entries(own).filter(([k]) => Number(k) <= base));
      } else {
        g = createState();
        startChapter(g, CHAPTERS, 1);
        snapshots = { 1: structuredClone(g) };
      }
      const good = byTone(GOOD);
      while (g.chapter < id) {
        playChapter(g, CHAPTERS, good);
        finishChapter(g, CHAPTERS, evaluateEnding);
        snapshots[g.chapter] = structuredClone(g);
      }
      runner = null;
      set({ snapshots, game: g, screen: 'game', card: true, dialogue: null, paused: false, journal: false, spawn: spawnForChapter(g), loadMessage: null });
      persist();
    },

    continueGame: () => {
      const r = loadSave(kv);
      if (!r.ok) {
        set({ hasSave: false, loadMessage: r.reason === 'corrupt' ? 'الحفظ تخسّر. ابدا لعبة جديدة.' : null });
        return;
      }
      const g = r.save.state;
      runner = null;
      if (g.phase === 'ending') {
        set({ game: g, snapshots: r.save.snapshots, screen: 'ending' });
        return;
      }
      // interrupted dialogue can't be resumed mid-tree: restart that beat safely
      let card = false;
      if (g.phase === 'opening') card = true;
      const sp = g.player ? { x: g.player.x, z: g.player.z, yaw: g.player.yaw, nonce: ++spawnNonce } : spawnForChapter(g);
      set({ game: g, snapshots: r.save.snapshots, screen: 'game', card, dialogue: null, paused: false, spawn: sp });
      if (g.phase === 'closing') beginClosing();
      if (r.repaired) get().pushToast('الحفظ تحدّث للنسخة الجديدة.', 'info');
    },

    replayChapter: (id) => {
      const snap = get().snapshots[id];
      if (!snap) return;
      const g = structuredClone(snap);
      runner = null;
      const snapshots = Object.fromEntries(Object.entries(get().snapshots).filter(([k]) => Number(k) <= id));
      set({ game: g, snapshots, screen: 'game', card: true, dialogue: null, paused: false, spawn: spawnForChapter(g) });
      persist();
    },

    loadSnapshotsForMenu: () => {
      const r = loadSave(kv);
      if (r.ok) set({ snapshots: r.save.snapshots });
    },

    toMenu: () => {
      if (get().screen === 'game') persist();
      runner = null;
      set({ screen: 'menu', dialogue: null, paused: false, journal: false, bigMap: false });
    },

    dismissCard: () => {
      const g = get().game;
      if (!g || !get().card) return;
      set({ card: false });
      sound.unlock();
      if (g.phase === 'opening') startDialogue(chapterOf(g).opening, { kind: 'opening' });
    },

    interact: (target, kind) => {
      const st = get();
      const g = st.game;
      if (!g || st.dialogue || st.paused || st.card || g.phase !== 'play') return;
      sound.ui();
      const ch = chapterOf(g);
      const o = peekObjective(g, ch);
      if (kind === 'object' && hasAction(target) && ((o && o.type !== 'goto' && o.target === target) || availableSide(g, target))) set({ using: target });
      if (o && o.type !== 'goto' && o.target === target) {
        resolveObjective(g, ch);
        const steps = o.quiz ? withQuiz(o.dialogue ?? [], quizSteps(o.quiz.age ?? g.age, o.quiz.n, o.quiz.kind)) : o.dialogue;
        if (steps?.length) startDialogue(steps, { kind: 'objective', id: o.id });
        else onObjectiveDone(o.id);
        return;
      }
      const side = availableSide(g, target);
      if (side) {
        startDialogue(side.id === 'study' ? withQuiz(side.dialogue, quizSteps(g.age, 2)) : side.dialogue, { kind: 'side', id: side.id });
        return;
      }
      if (kind === 'npc') {
        const c = characterById.get(target);
        const rule = c?.ambient.find((r) => evalCond(g, r.if));
        const line = rule ? rule.lines[Math.floor(Math.random() * rule.lines.length)] : '...';
        startDialogue([{ s: target, t: line }], { kind: 'ambient' });
        return;
      }
      const ob = objectById.get(target);
      startDialogue([{ s: 'narrator', t: `${ob?.name ?? ''}. ماشي وقتها دروك.` }], { kind: 'ambient' });
    },

    advance: () => {
      const st = get();
      const g = st.game;
      if (!g || !st.dialogue || !runner || st.dialogue.view.kind === 'choice') return;
      const view = runner.next(g);
      toastsFrom(runner.drainChanges());
      if (!view) {
        runner = null;
        onDialogueEnd(st.dialogue.source);
        return;
      }
      sound.blip();
      commit({ dialogue: { view, source: st.dialogue.source } });
    },

    choose: (index) => {
      const st = get();
      const g = st.game;
      if (!g || !st.dialogue || !runner || st.dialogue.view.kind !== 'choice') return;
      const decisionId = st.dialogue.view.id;
      runner.choose(g, index);
      // piggy-bank deposit moves half of the pocket money (dynamic amount)
      if (decisionId === 'piggy_action' && index === 0) {
        const amount = Math.floor(g.money / 2);
        toastsFrom(applyFx(g, { money: -amount, savings: amount }));
      }
      sound.choice();
      const view = runner.next(g);
      toastsFrom(runner.drainChanges());
      if (!view) {
        runner = null;
        onDialogueEnd(st.dialogue.source);
        return;
      }
      commit({ dialogue: { view, source: st.dialogue.source } });
    },

    arriveAt: (spotId) => {
      const st = get();
      const g = st.game;
      if (!g || st.dialogue || st.card || g.phase !== 'play') return;
      const o = peekObjective(g, chapterOf(g));
      if (o && o.type === 'goto' && o.target === spotId) {
        resolveObjective(g, chapterOf(g));
        onObjectiveDone(o.id);
      }
    },

    tick: (seconds) => {
      const st = get();
      const g = st.game;
      if (!g || st.screen !== 'game' || st.paused || st.dialogue || st.card || g.phase !== 'play') return;
      // 1 real second = 1 game minute
      g.time += seconds;
      const o = peekObjective(g, chapterOf(g));
      if (o) {
        resolveObjective(g, chapterOf(g)); // make sure activation time is recorded
        const late = checkDeadline(g, o);
        if (late) {
          sound.alert();
          toastsFrom(late);
          if (g.done.includes(o.id)) return onObjectiveDone(o.id);
        }
      }
      commit();
    },

    saveNow: (manual) => {
      persist();
      if (manual) get().pushToast('تحفظت اللعبة ✓', 'good');
    },

    setPaused: (v) => {
      if (get().screen !== 'game') return;
      if (v) persist();
      set({ paused: v, journal: false, bigMap: false });
    },
    setJournal: (v) => set({ journal: v, bigMap: false }),
    setBigMap: (v) => set({ bigMap: v, journal: false }),

    updateSettings: (p) => {
      const settings = { ...get().settings, ...p };
      try {
        kv.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch {
        /* ignore */
      }
      sound.setVolumes(settings.master, settings.ambience, settings.sfx);
      music.setVolume(settings.music);
      set({ settings });
    },

    unstuck: () => {
      const g = get().game;
      if (!g) return;
      // move to the nearest spot centre (always on walkable ground)
      let best = spawnForChapter(g);
      let bestD = Infinity;
      for (const s of spotById.values()) {
        const d = (s.x - livePose.x) ** 2 + (s.z - livePose.z) ** 2;
        if (d < bestD) {
          bestD = d;
          best = { x: s.x, z: s.z, yaw: livePose.yaw, nonce: ++spawnNonce };
        }
      }
      set({ spawn: best, paused: false });
    },

    footballGoal: () => {
      const g = get().game;
      get().pushToast('قووول! ⚽', 'good');
      if (!g || g.sides.includes('goal')) return;
      // a goal lifts Amine's confidence a little, once per chapter
      g.sides.push('goal');
      toastsFrom(applyFx(g, { confidence: 2 }));
      commit();
    },

    pushToast: (text, tone = 'info') => {
      const id = ++toastId;
      set({ toasts: [...get().toasts.slice(-4), { id, text, tone }] });
      setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 3800);
    },
  };
});

export function resetSaveForNewGame() {
  clearSave(kv);
}
