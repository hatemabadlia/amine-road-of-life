// Integration tests for the runtime game store (the layer the 3D game calls).
import { beforeEach, describe, expect, it } from 'vitest';
import { memoryStorage, loadSave } from '../../src/game/save/save';
import { activeObjective, setStorage, useGame, livePose } from '../../src/game/store';
import type { KV } from '../../src/game/save/save';

let kv: KV;

function finishDialogue(pickFirst = true) {
  for (let i = 0; i < 200; i++) {
    const d = useGame.getState().dialogue;
    if (!d) return;
    if (d.view.kind === 'choice') useGame.getState().choose(pickFirst ? d.view.options[0].index : d.view.options[d.view.options.length - 1].index);
    else useGame.getState().advance();
  }
  throw new Error('dialogue did not end');
}

function startGame() {
  useGame.getState().newGame();
  useGame.getState().dismissCard();
  finishDialogue();
}

beforeEach(() => {
  kv = memoryStorage();
  setStorage(kv);
  useGame.setState({ screen: 'menu', game: null, dialogue: null, card: false, paused: false, snapshots: {}, toasts: [] });
});

describe('runtime store', () => {
  it('new game shows the chapter card, then the opening, then the first objective', () => {
    useGame.getState().newGame();
    expect(useGame.getState().card).toBe(true);
    expect(useGame.getState().game!.phase).toBe('opening');
    useGame.getState().dismissCard();
    expect(useGame.getState().dialogue?.source.kind).toBe('opening');
    finishDialogue();
    expect(useGame.getState().game!.phase).toBe('play');
    expect(activeObjective(useGame.getState().game)!.id).toBe('wake');
  });

  it('objectives only complete by interacting with the right target', () => {
    startGame();
    useGame.getState().interact('baba', 'npc'); // not the current objective, no side activity → ambient line
    expect(useGame.getState().dialogue?.source.kind).toBe('ambient');
    finishDialogue();
    expect(activeObjective(useGame.getState().game)!.id).toBe('wake');
    useGame.getState().interact('bed', 'object');
    expect(useGame.getState().dialogue?.source).toEqual({ kind: 'objective', id: 'wake' });
    finishDialogue();
    expect(activeObjective(useGame.getState().game)!.id).toBe('mama');
  });

  it('goto objectives complete on arrival, and the clock pauses during dialogue', () => {
    startGame();
    for (const t of ['bed', 'mama', 'sink', 'kitchen_table', 'baba']) {
      useGame.getState().interact(t, t === 'mama' || t === 'baba' ? 'npc' : 'object');
      const before = useGame.getState().game!.time;
      useGame.getState().tick(30); // paused while talking
      expect(useGame.getState().game!.time).toBe(before);
      finishDialogue();
    }
    expect(useGame.getState().game!.money).toBe(70); // 20 + 50 allowance from father
    expect(activeObjective(useGame.getState().game)!.id).toBe('leave');
    useGame.getState().arriveAt('school_gate'); // wrong place
    expect(activeObjective(useGame.getState().game)!.id).toBe('leave');
    useGame.getState().arriveAt('home_door');
    expect(activeObjective(useGame.getState().game)!.id).toBe('meet_mourad');
  });

  it('missing a deadline records lateness instead of blocking progress', () => {
    startGame();
    for (const t of ['bed', 'mama', 'sink', 'kitchen_table', 'baba']) {
      useGame.getState().interact(t, t === 'mama' || t === 'baba' ? 'npc' : 'object');
      finishDialogue();
    }
    useGame.getState().arriveAt('home_door');
    useGame.getState().interact('mourad', 'npc');
    // choose "refuse" (second option) so Amine heads to school
    for (let i = 0; i < 50 && useGame.getState().dialogue; i++) {
      const d = useGame.getState().dialogue!;
      if (d.view.kind === 'choice') useGame.getState().choose(d.view.options[1].index);
      else useGame.getState().advance();
    }
    expect(activeObjective(useGame.getState().game)!.id).toBe('to_school');
    useGame.getState().tick(120); // two game hours wandering
    const g = useGame.getState().game!;
    expect(g.flags.late_ch1).toBe(true);
    expect(activeObjective(g)!.id).toBe('to_school');
    useGame.getState().arriveAt('school_gate');
    expect(activeObjective(useGame.getState().game)!.id).toBe('class');
  });

  it('side activities move money correctly and are limited per chapter', () => {
    startGame();
    const g = useGame.getState().game!;
    g.money = 100;
    useGame.getState().interact('piggy', 'object');
    const d = useGame.getState().dialogue!;
    expect(d.source).toEqual({ kind: 'side', id: 'piggy' });
    finishDialogue(true); // deposit half
    expect(useGame.getState().game!.money).toBe(50);
    expect(useGame.getState().game!.savings).toBe(50);
    useGame.getState().interact('desk', 'object'); // study side activity
    finishDialogue();
    const grades = useGame.getState().game!.stats.grades;
    useGame.getState().interact('desk', 'object'); // second time: no longer available → ambient
    expect(useGame.getState().dialogue?.source.kind).toBe('ambient');
    finishDialogue();
    expect(useGame.getState().game!.stats.grades).toBe(grades);
  });

  it('autosaves, survives a reload, and can replay a chapter from its snapshot', () => {
    startGame();
    livePose.x = -25;
    livePose.z = -22;
    useGame.getState().interact('bed', 'object');
    finishDialogue();
    const r = loadSave(kv);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.save.state.done).toContain('wake');
    expect(r.save.state.player).toMatchObject({ x: -25, z: -22 });
    // "reload": reset the store, then continue
    useGame.setState({ screen: 'menu', game: null });
    useGame.getState().continueGame();
    expect(useGame.getState().screen).toBe('game');
    expect(activeObjective(useGame.getState().game)!.id).toBe('mama');
    expect(useGame.getState().spawn).toMatchObject({ x: -25, z: -22 });
    // replay chapter 1 from its start snapshot
    useGame.getState().replayChapter(1);
    expect(useGame.getState().game!.done).toEqual([]);
    expect(useGame.getState().card).toBe(true);
  });

  it('a full chapter played through the store unlocks chapter 2 with a snapshot', () => {
    startGame();
    for (let guard = 0; guard < 100 && useGame.getState().game!.chapter === 1; guard++) {
      const st = useGame.getState();
      if (st.dialogue) {
        finishDialogue();
        continue;
      }
      const o = activeObjective(st.game);
      if (!o) continue;
      if (o.type === 'goto') st.arriveAt(o.target);
      else st.interact(o.target, o.type === 'talk' ? 'npc' : 'object');
    }
    const st = useGame.getState();
    expect(st.game!.chapter).toBe(2);
    expect(st.card).toBe(true);
    expect(st.snapshots[2]).toBeDefined();
    expect(st.game!.completed).toEqual([1]);
  });
});
