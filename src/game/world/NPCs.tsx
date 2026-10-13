// Story characters placed per chapter + ambient pedestrians + kickable ball.
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { BallCollider, CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import { CHARACTERS, characterById, type Look } from '../../content/characters';
import { Humanoid, type HumanoidHandle } from '../player/Humanoid';
import { chapterOf, livePose, useGame } from '../store';
import { castPositions } from './cast';
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

function NPC({ id, x, z }: { id: string; x: number; z: number }) {
  const ch = characterById.get(id)!;
  const group = useRef<THREE.Group>(null);
  const model = useRef<HumanoidHandle>(null);
  const tag = useRef<THREE.Sprite>(null);
  const tex = useMemo(() => nameTexture(ch.name, ch.color), [ch]);
  const h = 1.8 * ch.look.scale;
  const yaw = useRef(Math.atan2(-x, -z)); // initially face the map centre

  useEffect(() => {
    npcPositions.set(id, new THREE.Vector3(x, h * 0.85, z));
    return () => {
      npcPositions.delete(id);
    };
  }, [id, x, z, h]);

  useFrame((_, dt) => {
    const dx = livePose.x - x;
    const dz = livePose.z - z;
    const d = Math.hypot(dx, dz);
    if (d < 5) {
      const target = Math.atan2(dx, dz);
      let diff = target - yaw.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      yaw.current += diff * (1 - Math.exp(-5 * dt));
    }
    if (group.current) group.current.rotation.y = yaw.current;
    const st = useGame.getState();
    if (model.current) model.current.talking = st.dialogue?.view.kind === 'line' && st.dialogue.view.speaker === id;
    if (tag.current) tag.current.visible = d > 2.2 && d < 9 && !st.dialogue;
  });

  return (
    <>
      <RigidBody type="fixed" colliders={false} position={[x, 0.9 * ch.look.scale, z]}>
        <CapsuleCollider args={[0.9 * ch.look.scale - 0.28, 0.28]} />
      </RigidBody>
      <group ref={group} position={[x, 0, z]}>
        <Humanoid ref={model} look={ch.look} />
      </group>
      <sprite ref={tag} position={[x, h + 0.35, z]} scale={[1.3, 0.33, 1]}>
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
    return g ? castPositions(chapterOf(g), g) : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, doneCount]);
  return (
    <>
      {placements.map((p) => (
        <NPC key={`${chapterId}:${p.id}:${p.x.toFixed(1)}:${p.z.toFixed(1)}`} id={p.id} x={p.x} z={p.z} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Pedestrians walking loops on the sidewalks (ambient life)
// ---------------------------------------------------------------------------
const WALKER_LOOKS: Look[] = [
  { skin: '#c99670', shirt: '#7f8c8d', pants: '#2c3e50', hair: '#222', scale: 1, style: 'short' },
  { skin: '#d9a77c', shirt: '#a04000', pants: '#4a235a', hair: '#111', scale: 0.95, hijab: '#f5cba7' },
  { skin: '#b98a63', shirt: '#f5f5f5', pants: '#7b7d7d', hair: '#ddd', scale: 0.98, beard: true, cap: '#fff' },
  { skin: '#dcae85', shirt: '#2471a3', pants: '#1c2833', hair: '#3b2a20', scale: 0.7, style: 'short' },
  { skin: '#c48b62', shirt: '#117a65', pants: '#212f3d', hair: '#111', scale: 1.02, style: 'short' },
  { skin: '#e0b48c', shirt: '#884ea0', pants: '#1b2631', hair: '#2b1b14', scale: 0.92, hijab: '#2c3e50' },
  { skin: '#c99670', shirt: '#e74c3c', pants: '#ecf0f1', hair: '#111', scale: 0.68, style: 'short' },
  { skin: '#dcae85', shirt: '#27ae60', pants: '#ecf0f1', hair: '#3b2416', scale: 0.72, style: 'curly' },
];

const ROUTES: [number, number][][] = [
  [[-60, -5], [60, -5]],
  [[55, 5], [-55, 5]],
  [[-5, -60], [-5, 40]],
  [[5, 35], [5, -60]],
  [[48, -12], [70, -12], [70, -27], [48, -27]],
  [[-36, 9], [-12, 9]],
  // kids kicking about on the pitch
  [[15, 31], [34, 34], [30, 38], [16, 37]],
  [[33, 18], [17, 24], [21, 17]],
];

function Walker({ look, route, offset, speedBoost = 0 }: { look: Look; route: [number, number][]; offset: number; speedBoost?: number }) {
  const body = useRef<RapierRigidBody>(null);
  const group = useRef<THREE.Group>(null);
  const model = useRef<HumanoidHandle>(null);
  const seg = useRef(0);
  const pos = useRef(new THREE.Vector2(route[0][0], route[0][1]));
  const speed = 1.1 + offset * 0.1 + speedBoost;
  useEffect(() => {
    // spread walkers along their route
    pos.current.set(route[0][0] + (route[1][0] - route[0][0]) * offset * 0.15, route[0][1] + (route[1][1] - route[0][1]) * offset * 0.15);
  }, [route, offset]);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const st = useGame.getState();
    const target = route[(seg.current + 1) % route.length];
    const dx = target[0] - pos.current.x;
    const dz = target[1] - pos.current.y;
    const d = Math.hypot(dx, dz);
    // stop politely when the player stands in the way
    const pd = Math.hypot(livePose.x - pos.current.x, livePose.z - pos.current.y);
    const moving = !st.paused && pd > 1.4;
    if (d < 0.3) seg.current = (seg.current + 1) % route.length;
    else if (moving) {
      pos.current.x += (dx / d) * speed * dt;
      pos.current.y += (dz / d) * speed * dt;
    }
    body.current?.setNextKinematicTranslation({ x: pos.current.x, y: 0.9 * look.scale, z: pos.current.y });
    if (group.current) {
      group.current.position.set(pos.current.x, 0, pos.current.y);
      group.current.rotation.y = Math.atan2(dx, dz);
    }
    if (model.current) model.current.speed = moving ? speed : 0;
  });
  return (
    <>
      <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[route[0][0], 0.9 * look.scale, route[0][1]]}>
        <CapsuleCollider args={[0.9 * look.scale - 0.28, 0.28]} />
      </RigidBody>
      <group ref={group}>
        <Humanoid ref={model} look={look} />
      </group>
    </>
  );
}

export function Pedestrians() {
  return (
    <>
      {ROUTES.map((r, i) => (
        <Walker key={i} look={WALKER_LOOKS[i % WALKER_LOOKS.length]} route={r} offset={i} speedBoost={i >= 6 ? 1.8 : 0} />
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
