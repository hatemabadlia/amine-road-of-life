// World-space objective marker: bobbing arrow, a beam that fades upward and a
// pulsing ground ring.
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { activeObjective, objectiveTarget, useGame } from '../store';
import { npcPositions } from '../engine/refs';
import { mat, radialTexture } from './materials';

function beamTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 128, 0, 0);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function ObjectiveMarker() {
  const group = useRef<THREE.Group>(null);
  const arrow = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const beam = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffcf4a', alphaMap: beamTexture(), transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }), []);
  const pulse = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffcc33', map: radialTexture('rgba(255,255,255,0)', 'rgba(255,255,255,1)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), []);
  useFrame(({ clock, camera }) => {
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
    // fade the beam out when the camera is right next to it
    const near = Math.hypot(camera.position.x - pos[0], camera.position.z - pos[1]);
    beam.opacity = 0.42 * THREE.MathUtils.smoothstep(near, 2.5, 7);
    if (arrow.current) {
      arrow.current.visible = near > 2.2;
      arrow.current.position.y = (obj?.type === 'talk' ? 2.75 : 2.3) + Math.sin(t * 3) * 0.15;
      arrow.current.rotation.y = t * 1.5;
    }
    if (ring.current) {
      const k = (t * 0.8) % 1;
      ring.current.scale.setScalar(0.6 + k * 1.4);
      pulse.opacity = (1 - k) * 0.8;
    }
  });
  return (
    <group ref={group}>
      <mesh ref={arrow} rotation={[Math.PI, 0, 0]} material={mat('#f5b301', { emissive: '#ffb400', ei: 2.2 })}>
        <coneGeometry args={[0.28, 0.55, 4]} />
      </mesh>
      <mesh position={[0, 8, 0]} material={beam}>
        <cylinderGeometry args={[0.22, 0.4, 16, 12, 1, true]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} material={mat('#ffcc33', { emissive: '#ffcc33', ei: 1.2, transparent: true, opacity: 0.6 })}>
        <ringGeometry args={[0.95, 1.12, 40]} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]} material={pulse}>
        <circleGeometry args={[1, 40]} />
      </mesh>
    </group>
  );
}
