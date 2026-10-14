// Story characters placed per chapter + ambient pedestrians + kickable ball.
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { BallCollider, CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import { CHARACTERS, characterById, type Look } from '../../content/characters';
import type { HumanoidHandle } from '../player/Humanoid';
import { Character } from '../player/SkinnedHuman';
import { activeObjective, chapterOf, dressFor, livePose, useGame } from '../store';
import { agents, arrived, face, makeAgent, stepAgent, walkTo } from './agents';
import { nav, pathLength } from './nav';
import { castPositions } from './cast';
import { spotById } from './layout';
import { ballRef, npcPositions, useBall } from '../engine/refs';
import { sound } from '../audio/sound';

function nameTexture(name: string, color: string) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = 'rgba(15,20,30,0.72)';
  g.beginPath();
  g.roundRect(4, 8, 248, 48, 22);
  g.fill();
  g.fillStyle = color;
  g.fillRect(20, 28, 10, 10);
  g.fillStyle = '#fff';
  g.font = '700 30px "Cairo", "Geeza Pro", sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.direction = 'rtl';
  g.fillText(name, 136, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Characters who are busy with their hands when standing at their usual place. */
const WORKERS = new Set(['bachir', 'jeddi']);
const BED = spotById.get('hospital_bed')!;

function NPC({ id, x, z, lying = false, dress }: { id: string; x: number; z: number; lying?: boolean; dress?: Partial<Look> }) {
  const base = characterById.get(id)!;
  const ch = useMemo(() => (dress ? { ...base, look: { ...base.look, ...dress } } : base), [base, dress]);
  const group = useRef<THREE.Group>(null);
  const model = useRef<HumanoidHandle>(null);
  const tag = useRef<THREE.Sprite>(null);
  const body = useRef<RapierRigidBody>(null);
  const tex = useMemo(() => nameTexture(ch.name, ch.color), [ch]);
  const h = 1.8 * ch.look.scale;
  const agent = useMemo(() => {
    const a = makeAgent(x, z, 1.4);
    a.yaw = Math.atan2(-x, -z); // initially face the map centre
    return a;
    // created once per mount: later target changes make the character walk
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const head = useMemo(() => new THREE.Vector3(agent.x, h * 0.85, agent.z), [agent, h]);
  const atWork = WORKERS.has(id) && Math.hypot(x - ch.home[0], z - ch.home[1]) < 0.5;

  useEffect(() => {
    agents.add(agent);
    npcPositions.set(id, head);
    return () => {
      agents.delete(agent);
      npcPositions.delete(id);
    };
  }, [id, agent, head]);

  // a new placement within the chapter: walk there (or slip away unseen when far from Amine)
  useEffect(() => {
    if (Math.hypot(agent.x - x, agent.z - z) < 0.4) return;
    const unseen = (px: number, pz: number) => Math.hypot(livePose.x - px, livePose.z - pz) > 38;
    const snap = () => {
      agent.x = x;
      agent.z = z;
      agent.path = null;
    };
    // companions on the bus arrive with Amine
    if (!nav.ready || useGame.getState().ride || (unseen(agent.x, agent.z) && unseen(x, z))) return snap();
    if (!walkTo(agent, x, z) || !agent.path) return snap();
    const len = pathLength([agent.x, agent.z], agent.path);
    if (len > 140) return snap();
    agent.pace = len > 22 ? 3.1 : 1.45;
  }, [agent, x, z]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const st = useGame.getState();
    const frozen = st.paused || st.card || !!st.dialogue;
    const d = Math.hypot(livePose.x - agent.x, livePose.z - agent.z);
    // someone Amine needs to talk to waits when he comes close
    const obj = activeObjective(st.game);
    const waiting = obj?.type === 'talk' && obj.target === id && d < 2.6;
    const walking = !arrived(agent);
    if (walking && !frozen && !waiting) stepAgent(agent, dt);
    else agent.speed = 0;
    if ((!walking || waiting) && d < 5 && !lying) face(agent, livePose.x, livePose.z, dt);
    if (lying && !walking) {
      // in bed: feet toward the room, head on the pillow (+z); elsewhere collapsed on the ground
      const y = Math.hypot(agent.x - BED.x, agent.z - BED.z) < 1.5 ? 0.78 : 0.12;
      body.current?.setNextKinematicTranslation({ x: agent.x, y: -20, z: agent.z });
      head.set(agent.x, y + 0.22, agent.z + 0.7);
      group.current?.position.set(agent.x, y, agent.z - 0.95);
      // on the back: tip over backwards, then turn so the head points to +z
      group.current?.rotation.set(-Math.PI / 2, Math.PI, 0, 'YXZ');
    } else {
      body.current?.setNextKinematicTranslation({ x: agent.x, y: 0.9 * ch.look.scale, z: agent.z });
      head.set(agent.x, h * 0.85, agent.z);
      if (group.current) {
        group.current.position.set(agent.x, 0, agent.z);
        group.current.rotation.set(0, agent.yaw, 0);
      }
    }
    if (model.current) {
      model.current.speed = agent.speed;
      model.current.lying = lying;
      model.current.talking = !lying && st.dialogue?.view.kind === 'line' && st.dialogue.view.speaker === id;
    }
    if (tag.current) {
      tag.current.position.set(agent.x, h + 0.35, agent.z);
      tag.current.visible = d > 2.2 && d < 9 && !st.dialogue;
    }
  });

  return (
    <>
      <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[agent.x, 0.9 * ch.look.scale, agent.z]}>
        <CapsuleCollider args={[0.9 * ch.look.scale - 0.28, 0.28]} />
      </RigidBody>
      <group ref={group} position={[agent.x, 0, agent.z]}>
        <Character ref={model} look={ch.look} working={atWork && arrived(agent)} />
      </group>
      <sprite ref={tag} position={[agent.x, h + 0.35, agent.z]} scale={[1.3, 0.33, 1]}>
        <spriteMaterial map={tex} depthTest={false} transparent />
      </sprite>
    </>
  );
}

export function StoryNPCs() {
  const chapterId = useGame((s) => s.game?.chapter ?? 1);
  const doneCount = useGame((s) => s.game?.done.length ?? 0);
  const placements = useMemo(() => {
    const g = useGame.getState().game;
    if (!g) return [];
    const ch = chapterOf(g);
    return castPositions(ch, g).map((p) => ({ ...p, lying: !!ch.lying?.includes(p.id), dress: dressFor(g, p.id) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, doneCount]);
  return (
    <>
      {placements.map((p) => (
        <NPC key={`${chapterId}:${p.id}`} id={p.id} x={p.x} z={p.z} lying={p.lying} dress={p.dress} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Football
// ---------------------------------------------------------------------------
export function Ball() {
  const body = useRef<RapierRigidBody>(null);
  const lastGoal = useRef(0);
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 32;
    const g = c.getContext('2d')!;
    g.fillStyle = '#fff';
    g.fillRect(0, 0, 64, 32);
    g.fillStyle = '#222';
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.arc((i * 11 + 5) % 64, (i * 7 + 8) % 32, 4, 0, Math.PI * 2);
      g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => {
    ballRef.body = body.current;
    return () => {
      ballRef.body = null;
    };
  }, []);
  useFrame(({ clock }) => {
    const b = body.current;
    if (!b) return;
    const p = b.translation();
    // goal detection: inside either goal mouth
    const inGoal = p.x > 22.6 && p.x < 27.4 && p.y < 2.2 && (p.z < 13.4 || p.z > 40.6);
    if (inGoal && clock.elapsedTime - lastGoal.current > 3) {
      lastGoal.current = clock.elapsedTime;
      useBall.getState().add();
      sound.goal();
      useGame.getState().footballGoal();
      setTimeout(() => {
        b.setTranslation({ x: 25, y: 0.6, z: 27 }, true);
        b.setLinvel({ x: 0, y: 0, z: 0 }, true);
        b.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }, 1500);
    }
    // respawn if it leaves the field area
    if (p.y < -2 || Math.abs(p.x - 25) > 40 || Math.abs(p.z - 27) > 40) {
      b.setTranslation({ x: 25, y: 0.6, z: 22 }, true);
      b.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  });
  return (
    <RigidBody ref={body} colliders={false} position={[25, 0.6, 22]} restitution={0.6} friction={0.6} linearDamping={0.6} angularDamping={0.6} ccd>
      <BallCollider args={[0.22]} mass={0.45} />
      <mesh castShadow>
        <sphereGeometry args={[0.22, 16, 12]} />
        <meshStandardMaterial map={tex} roughness={0.5} />
      </mesh>
    </RigidBody>
  );
}

export const ALL_NPC_IDS = CHARACTERS.map((c) => c.id);
