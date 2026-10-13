// Decorations for special chapters. The neighbourhood wedding on the square:
// a striped tent, strings of lights, rows of chairs and the DJ's speakers.
// Ramadan: strings of lights from the minaret, and a zlabia stall at the souk.
import { useMemo } from 'react';
import * as THREE from 'three';
import { chapterOf, useGame } from '../store';
import { glowAtNight, mat } from './materials';
import { Sign } from './primitives';

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

type P3 = [number, number, number];

/** Bulbs hanging on a sagging line between two points. */
function BulbString({ a, b, n, sag, mats, offset = 0 }: { a: P3; b: P3; n: number; sag: number; mats: THREE.Material[]; offset?: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1);
        const y = a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag;
        return (
          <mesh key={i} position={[a[0] + (b[0] - a[0]) * t, y, a[2] + (b[2] - a[2]) * t]} material={mats[(i + offset) % mats.length]}>
            <sphereGeometry args={[0.08, 6, 4]} />
          </mesh>
        );
      })}
    </>
  );
}

const RAMADAN_BULBS = ['#fff2c4', '#7dffa8', '#ffd27a'];

function Ramadan() {
  const bulbMats = useMemo(() => RAMADAN_BULBS.map((c) => glowAtNight(mat(c, { emissive: c, ei: 0.4 }), 3.4, 0.4)), []);
  const crescent = useMemo(() => glowAtNight(mat('#ffe9a8', { emissive: '#ffe9a8', ei: 0.3 }), 2.6, 0.3), []);
  // the minaret balcony (42.6, 15, -54.5) down to the corners of the façade, and along it
  const top: P3 = [42.6, 15.2, -54.5];
  const lines: [P3, P3, number][] = [
    [top, [29.2, 4.5, -40.1], 30],
    [top, [40.8, 4.5, -40.1], 24],
    [[29.2, 4.5, -40.1], [40.8, 4.5, -40.1], 22],
    [top, [44.5, 3.2, -38], 22],
  ];
  return (
    <group>
      {lines.map(([a, b, n], i) => (
        <BulbString key={i} a={a} b={b} n={n} sag={0.8} mats={bulbMats} offset={i} />
      ))}
      {/* ring of lights round the minaret balcony */}
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <mesh key={i} position={[42.6 + Math.cos(a) * 1.6, 15.3, -54.5 + Math.sin(a) * 1.6]} material={bulbMats[i % bulbMats.length]}>
            <sphereGeometry args={[0.09, 6, 4]} />
          </mesh>
        );
      })}
      <mesh position={[44.5, 1.6, -38]} material={mat('#555')}>
        <cylinderGeometry args={[0.05, 0.05, 3.2, 6]} />
      </mesh>
      {/* a lit crescent over the door */}
      <mesh position={[35, 5.4, -39.8]} rotation={[0, 0, -0.5]} material={crescent}>
        <torusGeometry args={[0.45, 0.08, 6, 16, Math.PI * 1.3]} />
      </mesh>
      {/* zlabia and qalb el louz stall at the west end of the souk */}
      <group position={[45.6, 0, -27.2]}>
        <mesh position={[0, 0.45, 0]} castShadow material={mat('#8d6e4a')}>
          <boxGeometry args={[2.6, 0.9, 1.1]} />
        </mesh>
        {[-0.75, 0.05].map((dx) => (
          <group key={dx} position={[dx, 0.93, 0]}>
            <mesh material={mat('#c9c9c9', { metal: 0.6, rough: 0.35 })}>
              <cylinderGeometry args={[0.38, 0.38, 0.03, 16]} />
            </mesh>
            {Array.from({ length: 7 }, (_, j) => (
              <mesh key={j} position={[Math.cos(j) * 0.2 * (j % 2), 0.05 + (j > 3 ? 0.05 : 0), Math.sin(j) * 0.2 * (j % 2)]} rotation={[Math.PI / 2, 0, j]} material={mat('#e67e22', { rough: 0.35 })}>
                <torusGeometry args={[0.09, 0.03, 5, 10]} />
              </mesh>
            ))}
          </group>
        ))}
        {/* qalb el louz: a tray of brown squares */}
        <mesh position={[0.85, 0.94, 0]} material={mat('#c9c9c9', { metal: 0.6, rough: 0.35 })}>
          <boxGeometry args={[0.7, 0.03, 0.6]} />
        </mesh>
        {Array.from({ length: 6 }, (_, j) => (
          <mesh key={j} position={[0.65 + (j % 3) * 0.2, 0.99, -0.12 + Math.floor(j / 3) * 0.24]} material={mat('#9a6a3a')}>
            <boxGeometry args={[0.17, 0.07, 0.2]} />
          </mesh>
        ))}
        <mesh position={[0, 2.3, -0.2]} rotation={[0.25, 0, 0]} castShadow material={mat('#1e8449', { side: THREE.DoubleSide })}>
          <planeGeometry args={[3, 1.6]} />
        </mesh>
        {[-1.3, 1.3].map((dx) => (
          <mesh key={dx} position={[dx, 1.15, -0.6]} material={mat('#555')}>
            <cylinderGeometry args={[0.05, 0.05, 2.3, 6]} />
          </mesh>
        ))}
        <BulbString a={[-1.3, 2.2, 0.35]} b={[1.3, 2.2, 0.35]} n={9} sag={0.25} mats={bulbMats} />
      </group>
      <Sign p={[45.6, 2.75, -26.5]} text="زلابية وقلب اللوز" w={2.4} h={0.45} bg="#7b241c" />
    </group>
  );
}

export function EventDecor() {
  const event = useGame((s) => (s.game ? chapterOf(s.game).event : undefined));
  if (event === 'wedding') return <Wedding />;
  if (event === 'ramadan') return <Ramadan />;
  return null;
}
