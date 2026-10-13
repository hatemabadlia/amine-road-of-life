// Decorations for special chapters. The neighbourhood wedding on the square:
// a striped tent, strings of lights, rows of chairs and the DJ's speakers.
import { useMemo } from 'react';
import * as THREE from 'three';
import { chapterOf, useGame } from '../store';
import { glowAtNight, mat } from './materials';

const BULBS = ['#ffd27a', '#ff6b6b', '#6bd5ff', '#9dff8a'];

function Wedding() {
  const bulbMats = useMemo(() => BULBS.map((c) => glowAtNight(mat(c, { emissive: c, ei: 0.5 }), 3.2, 0.5)), []);
  const stripes = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 8;
    const g = c.getContext('2d')!;
    ['#c0392b', '#f5f5f5', '#1e8449', '#f5f5f5'].forEach((col, i) => {
      g.fillStyle = col;
      g.fillRect(i * 16, 0, 16, 8);
    });
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.set(4, 1);
    return t;
  }, []);
  // light strings: bulbs along catenaries between palm trees and the tent
  const strings: [number, number, number, number][] = [
    [48, -10, 70, -10],
    [48, -28, 70, -28],
    [48, -10, 48, -28],
    [70, -10, 70, -28],
  ];
  return (
    <group>
      {/* tent over the west half of the square */}
      <mesh position={[51.5, 3.6, -19]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <cylinderGeometry args={[0.01, 4.6, 1.2, 4, 1, true]} />
        <meshStandardMaterial map={stripes} side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
      {[
        [48.3, -22.2],
        [54.7, -22.2],
        [48.3, -15.8],
        [54.7, -15.8],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 1.35, z]} material={mat('#d4ac0d', { metal: 0.5, rough: 0.4 })}>
          <cylinderGeometry args={[0.06, 0.06, 2.7, 8]} />
        </mesh>
      ))}
      {/* rows of chairs and the low tables */}
      {[-21.5, -19.5, -17.5].map((z) =>
        [49.4, 50.6, 51.8, 53].map((x) => (
          <mesh key={`${x}${z}`} position={[x, 0.25, z]} material={mat('#f5f5f5')}>
            <boxGeometry args={[0.45, 0.5, 0.45]} />
          </mesh>
        )),
      )}
      {/* DJ table and speakers */}
      <mesh position={[51.5, 0.45, -24.6]} material={mat('#1c1c1c')}>
        <boxGeometry args={[2.2, 0.9, 0.8]} />
      </mesh>
      {[49.8, 53.2].map((x) => (
        <mesh key={x} position={[x, 0.9, -24.8]} material={mat('#111')}>
          <boxGeometry args={[0.7, 1.8, 0.6]} />
        </mesh>
      ))}
      {strings.map(([x0, z0, x1, z1], si) =>
        Array.from({ length: 14 }, (_, i) => {
          const t = i / 13;
          const sag = Math.sin(t * Math.PI) * 0.9;
          return (
            <mesh key={`${si}-${i}`} position={[x0 + (x1 - x0) * t, 4.6 - sag, z0 + (z1 - z0) * t]} material={bulbMats[(i + si) % bulbMats.length]}>
              <sphereGeometry args={[0.09, 6, 4]} />
            </mesh>
          );
        }),
      )}
    </group>
  );
}

export function EventDecor() {
  const event = useGame((s) => (s.game ? chapterOf(s.game).event : undefined));
  return event === 'wedding' ? <Wedding /> : null;
}
