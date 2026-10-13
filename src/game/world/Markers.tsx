// World-space objective marker: bobbing arrow + light beam + ground ring.
import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { activeObjective, objectiveTarget, useGame } from '../store';
import { npcPositions } from '../engine/refs';
import { mat } from './materials';

export function ObjectiveMarker() {
  const group = useRef<THREE.Group>(null);
  const arrow = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const st = useGame.getState();
    const obj = activeObjective(st.game);
    const pos = objectiveTarget(obj, (id) => {
      const p = npcPositions.get(id);
      return p ? [p.x, p.z] : null;
    });
    const g = group.current;
    if (!g) return;
    g.visible = !!pos && !st.dialogue && !st.card;
    if (!pos) return;
    g.position.set(pos[0], 0, pos[1]);
    const t = clock.elapsedTime;
    if (arrow.current) {
      arrow.current.position.y = (obj?.type === 'talk' ? 2.75 : 2.3) + Math.sin(t * 3) * 0.15;
      arrow.current.rotation.y = t * 1.5;
    }
  });
  return (
    <group ref={group}>
      <mesh ref={arrow} rotation={[Math.PI, 0, 0]} material={mat('#f5b301', { emissive: '#f5b301', ei: 0.8 })}>
        <coneGeometry args={[0.28, 0.55, 4]} />
      </mesh>
      <mesh position={[0, 10, 0]} material={mat('#ffd54f', { emissive: '#ffcc33', ei: 1, transparent: true, opacity: 0.18 })}>
        <cylinderGeometry args={[0.18, 0.35, 20, 10, 1, true]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} material={mat('#ffcc33', { emissive: '#ffcc33', ei: 0.7, transparent: true, opacity: 0.55 })}>
        <ringGeometry args={[0.9, 1.15, 32]} />
      </mesh>
    </group>
  );
}
