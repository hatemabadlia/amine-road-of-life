// Decorations for special chapters. The neighbourhood wedding on the square:
// a striped tent, strings of lights, rows of chairs and the DJ's speakers.
// Ramadan: strings of lights from the minaret, and a zlabia stall at the souk (the lights stay for Eid).
// Match day: supporters on the stadium stands and two teams playing on the pitch.
import { createRef, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Look } from '../../content/characters';
import type { HumanoidHandle } from '../player/Humanoid';
import { Character } from '../player/SkinnedHuman';
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

function Ramadan({ stall = true }: { stall?: boolean }) {
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
      {stall && (
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
      )}
      {stall && <Sign p={[45.6, 2.75, -26.5]} text="زلابية وقلب اللوز" w={2.4} h={0.45} bg="#7b241c" />}
    </group>
  );
}

const KITS = [
  { shirt: '#1e8449', pants: '#f4f4f4' },
  { shirt: '#c0392b', pants: '#1c1c1c' },
];
const SKINS = ['#c99670', '#d9a77c', '#b98a63', '#c48b62', '#e0b48c', '#bf8a62'];

/** Supporters standing on two rows of the stands, cheering, in the town's green and white. */
function Supporters() {
  const people = useMemo(() => {
    const out: { x: number; y: number; z: number; look: Look }[] = [];
    [
      [1.2, 74.2],
      [2.4, 75.8],
    ].forEach(([y, z], row) => {
      for (let i = 0; i < 9; i++) {
        const skin = SKINS[(i * 3 + row) % SKINS.length];
        const fan = (i + row) % 3;
        out.push({
          x: 50.5 + i * 2.8 + row * 1.2,
          y,
          z,
          look: { skin, shirt: fan === 0 ? '#1e8449' : fan === 1 ? '#f4f4f4' : '#2c3e50', pants: '#2b2f3a', hair: '#1a1a1a', scale: i % 4 === 3 ? 0.78 : 1, cap: fan === 2 ? '#1e8449' : undefined, style: 'short' },
        });
      }
    });
    return out;
  }, []);
  const refs = useMemo(() => people.map(() => createRef<HumanoidHandle>()), [people]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.forEach((r, i) => {
      if (r.current) r.current.talking = Math.sin(t * 0.9 + i * 1.7) > -0.2;
    });
  });
  return (
    <>
      {people.map((p, i) => (
        <group key={i} position={[p.x, p.y, p.z]} rotation={[0, Math.PI, 0]}>
          <Character ref={refs[i]} look={p.look} />
        </group>
      ))}
    </>
  );
}

/** Ten players running set patterns around their positions (no physics, so they never block Amine). */
function Players() {
  const players = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const team = i % 2;
        const line = Math.floor(i / 2) % 5;
        // home team defends the west goal, visitors the east
        const bx = team === 0 ? 54 + line * 3 : 70 - line * 3;
        const bz = 58.5 + ((i * 7) % 11);
        return { team, bx, bz, phase: i * 1.3, look: { skin: SKINS[i % SKINS.length], ...KITS[team], hair: '#1a1a1a', scale: 1, style: 'short' as const, shoes: '#111' } };
      }),
    [],
  );
  const groups = useRef<(THREE.Group | null)[]>([]);
  const models = useMemo(() => players.map(() => createRef<HumanoidHandle>()) as RefObject<HumanoidHandle | null>[], [players]);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    players.forEach((p, i) => {
      const g = groups.current[i];
      if (!g) return;
      // a slow drift around the position, with bursts of running
      const k = 0.35 + 0.25 * Math.sin(t * 0.3 + p.phase);
      const x = p.bx + Math.sin(t * k + p.phase) * 3.2;
      const z = THREE.MathUtils.clamp(p.bz + Math.cos(t * k * 1.3 + p.phase) * 2.4, 57.4, 70.6);
      const dx = x - g.position.x;
      const dz = z - g.position.z;
      const speed = Math.hypot(dx, dz) / Math.max(dt, 1e-3);
      g.position.set(x, 0, z);
      if (speed > 0.05) g.rotation.y = Math.atan2(dx, dz);
      const m = models[i].current;
      if (m) m.speed = Math.min(speed, 6);
    });
  });
  return (
    <>
      {players.map((p, i) => (
        <group key={i} ref={(g) => void (groups.current[i] = g)} position={[p.bx, 0, p.bz]}>
          <Character ref={models[i]} look={p.look} />
        </group>
      ))}
    </>
  );
}

function Match() {
  return (
    <group>
      <Supporters />
      <Players />
    </group>
  );
}

export function EventDecor() {
  const event = useGame((s) => (s.game ? chapterOf(s.game).event : undefined));
  if (event === 'wedding') return <Wedding />;
  if (event === 'ramadan') return <Ramadan />;
  if (event === 'eid') return <Ramadan stall={false} />;
  if (event === 'match') return <Match />;
  return null;
}
