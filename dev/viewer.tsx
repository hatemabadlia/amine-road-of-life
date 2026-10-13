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
  useFrame(() => { if (r.current) { r.current.speed = speed; r.current.talking = q.has('talk'); } });
  return <group position={[x, 0, 0]}><Character ref={r} look={look} working={working} /></group>;
}
function Look() {
  const { camera } = useThree();
  camera.lookAt(Number(q.get('cx') ?? 0), Number(q.get('cy') ?? 1.3) - 0.15, 0);
  return null;
}
const ids = (q.get('ids') ?? 'mourad,mama,baba,grandpa,salah,walid').split(',');
createRoot(document.getElementById('root')!).render(
  <Canvas shadows camera={{ position: [Number(q.get('cx') ?? 0), Number(q.get('cy') ?? 1.3), Number(q.get('dist') ?? 5)], fov: 45 }}>
    <Look />
    <hemisphereLight args={['#fff', '#887', 1.6]} />
    <directionalLight position={[3, 6, 5]} intensity={2.5} castShadow />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[30, 30]} /><meshStandardMaterial color="#c8b48f" /></mesh>
    <Driven look={amineLook(Number(q.get('age') ?? 10))} x={-3} working={q.has('work')} />
    {ids.map((id, i) => { const c = CHARACTERS.find((c) => c.id === id); return c ? <Driven key={id} look={c.look} x={-2 + i * 1.1} working={q.has('work')} /> : null; })}
  </Canvas>,
);
