// Finds the nearest interactable, completes "go to" objectives on arrival,
// and handles the interact key / button.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OBJECTS, spotById } from '../world/layout';
import { characterById } from '../../content/characters';
import { activeObjective, availableSide, livePose, useGame } from '../store';
import { ballRef, npcPositions, useFocus, type Focus } from '../engine/refs';
import { input } from '../player/input';
import { sound } from '../audio/sound';

const NPC_RANGE = 2.7;
const OBJ_RANGE = 2.2;

export function Interaction() {
  const last = useRef<string>('');
  const arriveCooldown = useRef(0);

  useFrame((_, dt) => {
    const st = useGame.getState();
    const g = st.game;
    const setFocus = useFocus.getState().set;
    if (!g || st.screen !== 'game' || st.card || st.paused || st.dialogue) {
      if (last.current) {
        last.current = '';
        setFocus(null);
      }
      input.interactQueued = false;
      return;
    }
    const obj = activeObjective(g);
    const px = livePose.x;
    const pz = livePose.z;
    const fwdX = Math.sin(livePose.yaw);
    const fwdZ = Math.cos(livePose.yaw);

    let best: Focus | null = null;
    let bestScore = Infinity;
    const consider = (id: string, kind: 'npc' | 'object', x: number, z: number, range: number, label: string) => {
      const dx = x - px;
      const dz = z - pz;
      const d = Math.hypot(dx, dz);
      if (d > range) return;
      const facing = d > 0.01 ? (dx * fwdX + dz * fwdZ) / d : 1;
      const isObjective = !!obj && obj.type !== 'goto' && obj.target === id;
      const score = d - facing * 0.6 - (isObjective ? 1.5 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = { id, kind, label, objective: isObjective };
      }
    };

    for (const [id, p] of npcPositions) {
      const c = characterById.get(id);
      if (!c) continue;
      const objective = obj && obj.type === 'talk' && obj.target === id;
      const side = availableSide(g, id);
      const label = objective ? obj!.text : side ? side.label : `كلّم ${c.name}`;
      consider(id, 'npc', p.x, p.z, NPC_RANGE, label);
    }
    for (const o of OBJECTS) {
      let x = o.x;
      let z = o.z;
      if (o.id === 'ball' && ballRef.body) {
        const t = ballRef.body.translation();
        x = t.x;
        z = t.z;
      }
      const objective = obj && obj.type === 'use' && obj.target === o.id;
      const side = availableSide(g, o.id);
      if (!objective && !side && o.id !== 'ball') {
        // plain world objects are only interactable when they matter
        continue;
      }
      consider(o.id, 'object', x, z, OBJ_RANGE, objective ? obj!.text : side ? side.label : o.id === 'ball' ? 'شوط الكورة' : o.verb);
    }

    const f = best as Focus | null;
    const key = f ? `${f.id}|${f.label}` : '';
    if (key !== last.current) {
      last.current = key;
      setFocus(f);
    }

    if (input.interactQueued) {
      input.interactQueued = false;
      if (f) {
        if (f.id === 'ball' && !f.objective) kickBall();
        else st.interact(f.id, f.kind);
      }
    }

    // arrival at "go to" destinations
    arriveCooldown.current -= dt;
    if (obj && obj.type === 'goto' && arriveCooldown.current <= 0) {
      const s = spotById.get(obj.target);
      if (s && Math.hypot(s.x - px, s.z - pz) <= s.r) {
        arriveCooldown.current = 0.5;
        st.arriveAt(s.id);
      }
    }
  });
  return null;
}

export function kickBall() {
  const b = ballRef.body;
  if (!b) return;
  const t = b.translation();
  const dx = t.x - livePose.x;
  const dz = t.z - livePose.z;
  const d = Math.hypot(dx, dz) || 1;
  const power = 4.2;
  b.applyImpulse({ x: (dx / d) * power, y: 1.3, z: (dz / d) * power }, true);
  sound.kick();
}
