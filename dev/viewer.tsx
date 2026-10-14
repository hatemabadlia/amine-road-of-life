// Dev-only character viewer: /dev/viewer.html?speed=0&talk=1
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { Character } from '../src/game/player/SkinnedHuman';
import type { HumanoidHandle } from '../src/game/player/Humanoid';
import { CHARACTERS } from '../src/content/characters';
import { amineLook } from '../src/game/player/Humanoid';

const q = new URLSearchParams(location.search);
const speed = Number(q.get('speed') ?? 0);
function Driven({ look, x, working }: { look: any; x: number; working?: boolean }) {
  const r = useRef<HumanoidHandle>(null);
  useFrame(() => { if (r.current) { r.current.speed = speed; r.current.talking = q.has('talk'); r.current.lying = q.has('lie'); r.current.pose = (q.get('pose') ?? undefined) as never; r.current.seat = q.has('seat') ? Number(q.get('seat')) : undefined; } });
  return <group position={[x, q.has('lie') ? 0.5 : 0, 0]} rotation={q.has('lie') ? [-Math.PI / 2, Math.PI, 0, 'YXZ'] : [0, Number(q.get('yaw') ?? 0), 0]}><Character ref={r} look={look} working={working} /></group>;
}
function Look() {
  const { camera } = useThree();
  camera.lookAt(Number(q.get('cx') ?? 0), Number(q.get('cy') ?? 1.3) - 0.15, 0);
  return null;
}
const ids = (q.get('ids') ?? 'mourad,mama,baba,grandpa,salah,walid').split(',');
// ?outfits=qamis,djellaba,haik:#111,smock:#2f6db5 — sample adults and kids in each outfit
const outfits = (q.get('outfits') ?? '').split(',').filter(Boolean).map((o) => o.split(':'));
createRoot(document.getElementById('root')!).render(
  <Canvas shadows camera={{ position: [Number(q.get('cx') ?? 0), Number(q.get('cy') ?? 1.3), Number(q.get('dist') ?? 5)], fov: 45 }}>
    <Look />
    <hemisphereLight args={['#fff', '#887', 1.6]} />
    <directionalLight position={[3, 6, 5]} intensity={2.5} castShadow />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[30, 30]} /><meshStandardMaterial color="#c8b48f" /></mesh>
    <Driven look={amineLook(Number(q.get('age') ?? 10))} x={-3} working={q.has('work')} />
    {outfits.map(([outfit, robe], i) => (
      <Driven key={outfit + i} x={-2 + i * 1.1} working={q.has('work')} look={{ skin: '#c99670', shirt: '#f4f1ea', pants: '#333', hair: '#222', scale: q.has('kids') ? 0.76 : 1, outfit, robe, hijab: outfit === 'jebba' ? '#e8d7c3' : undefined, beard: !q.has('kids') && outfit !== 'haik' && outfit !== 'jebba' }} />
    ))}
    {!outfits.length && ids.map((id, i) => { const c = CHARACTERS.find((c) => c.id === id); return c ? <Driven key={id} look={c.look} x={-2 + i * 1.1} working={q.has('work')} /> : null; })}
  </Canvas>,
);
