// Dar Chabab (youth centre): a hall for tutoring, sign-ups and events, a store
// room with food baskets and clean-up kits, and a yard with a tree-planting
// garden, a ping-pong table and a small court. On the volunteering day
// (chapter event 'volunteer') banners go up and volunteers in vests fill the yard.
import { useMemo } from 'react';
import * as THREE from 'three';
import { CapsuleCollider, CuboidCollider, RigidBody } from '@react-three/rapier';
import { chapterOf, useGame } from '../store';
import { Character } from '../player/SkinnedHuman';
import type { Look } from '../../content/characters';
import { flatMat, mat } from './materials';
import { Box, Cyl, Door, HidingRoof, Lamp, RoofKit, Sign, Tree, WallLine, Window } from './primitives';

export function DarChababBuilding({ age }: { age: number }) {
  const W = '#f3e6c4';
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[18, 0.03, -73.5]} receiveShadow material={mat('#d9cdb4')}>
        <planeGeometry args={[20, 11]} />
      </mesh>
      {/* walls: front door on the cross street, back door to the yard */}
      <WallLine a={[8, -79]} b={[28, -79]} c={W} h={3.6} />
      <WallLine a={[8, -68]} b={[28, -68]} c={W} h={3.6} />
      <WallLine a={[8, -79]} b={[8, -68]} c={W} h={3.6} gaps={[{ at: -73.5, w: 1.8 }]} />
      <WallLine a={[28, -79]} b={[28, -68]} c={W} h={3.6} gaps={[{ at: -73.5, w: 1.8 }]} />
      {/* hall | store room partition */}
      <WallLine a={[20.5, -79]} b={[20.5, -68]} c="#ede2c8" t={0.18} h={3.6} gaps={[{ at: -73.5, w: 1.6 }]} />
      <HidingRoof x0={8} z0={-79} x1={28} z1={-68} y={3.6} c="#d7c9a8" />
      <RoofKit p={[24, -75]} y={3.85} />
      <Door p={[8, 0, -73.5]} rotY={-Math.PI / 2} w={1.8} c="#1e8449" />
      {[-76.5, -70.5].map((z) => (
        <Window key={z} p={[7.86, 1.8, z]} rotY={-Math.PI / 2} />
      ))}
      {[11, 15, 19, 24].map((x) => (
        <Window key={x} p={[x, 1.8, -67.86]} />
      ))}
      <Sign p={[7.82, 4.1, -73.5]} text="دار الشباب جدي عبد الجليل" w={6.4} h={0.8} rotY={-Math.PI / 2} bg="#1e6b45" />
      {/* sign-up desk, notice board, stage with a banner */}
      <Box p={[10.4, 0.45, -69.2]} s={[2, 0.9, 0.7]} c="#6b4a2f" col />
      <Box p={[10.4, 0.92, -69.2]} s={[0.5, 0.04, 0.35]} c="#f5f5f5" />
      <Box p={[15, 1.7, -68.2]} s={[2.6, 1.3, 0.06]} c="#8b5e34" />
      {[13.9, 14.6, 15.4, 16.1].map((x, i) => (
        <mesh key={x} position={[x, 1.7 + (i % 2) * 0.2, -68.24]} rotation={[0, Math.PI, 0]} material={mat(['#f5ecd7', '#aed6f1', '#f9e79f', '#abebc6'][i])}>
          <planeGeometry args={[0.5, 0.65]} />
        </mesh>
      ))}
      <Box p={[9.6, 0.25, -76.5]} s={[2.6, 0.5, 4.4]} c="#7b5537" col />
      <Sign p={[8.2, 2.4, -76.5]} text="معاً نبني الحومة" w={3.6} h={0.6} rotY={Math.PI / 2} bg="#c0392b" />
      {/* tutoring tables with notebooks and small chairs */}
      {[12.4, 14.5, 16.6, 18.7].map((x) => (
        <group key={x}>
          <Box p={[x, 0.36, -76.2]} s={[1.5, 0.72, 0.8]} c="#a47148" col />
          <Box p={[x - 0.3, 0.73, -76.2]} s={[0.35, 0.02, 0.25]} c="#3b7dd8" cast={false} />
          <Box p={[x + 0.3, 0.73, -76.1]} s={[0.35, 0.02, 0.25]} c="#e74c3c" cast={false} />
          <Box p={[x, 0.2, -75.4]} s={[0.4, 0.4, 0.4]} c="#f1c40f" />
        </group>
      ))}
      <mesh position={[15.5, 1.9, -78.86]} material={mat('#1e3d2f', { rough: 0.5 })}>
        <planeGeometry args={[3.2, 1.2]} />
      </mesh>
      {/* store room: food baskets, clean-up kits */}
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3].map((i) => (
          <group key={`${row}${i}`}>
            <Box p={[22.6 + i * 0.75, 0.25 + row * 0.5, -77.8]} s={[0.6, 0.48, 0.5]} c="#c8a165" />
            <Box p={[22.6 + i * 0.75, 0.52 + row * 0.5, -77.8]} s={[0.5, 0.06, 0.4]} c={['#f5f5f5', '#f4d03f', '#e67e22'][(i + row) % 3]} cast={false} />
          </group>
        )),
      )}
      <CuboidCollider args={[1.6, 0.8, 0.3]} position={[24.6, 0.8, -77.8]} />
      <Box p={[24.4, 0.45, -69]} s={[2.4, 0.9, 0.6]} c="#566573" col />
      {[23.6, 24.1, 24.6, 25.1].map((x) => (
        <Box key={x} p={[x, 1.1, -68.85]} s={[0.4, 0.5, 0.08]} c="#7ed957" cast={false} />
      ))}
      {[26.6, 26.9, 27.2].map((x) => (
        <Box key={x} p={[x, 0.75, -68.5]} s={[0.05, 1.5, 0.05]} c="#8d6e4a" />
      ))}
      {/* the yard: low fence, garden plot, ping-pong, small court */}
      <WallLine a={[29, -79]} b={[44, -79]} c="#cbbfa5" h={1.2} t={0.15} />
      <WallLine a={[44, -79]} b={[44, -68]} c="#cbbfa5" h={1.2} t={0.15} />
      <WallLine a={[29, -68]} b={[44, -68]} c="#cbbfa5" h={1.2} t={0.15} gaps={[{ at: 31, w: 3 }]} doorH={3} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[36.5, 0.035, -73.5]} receiveShadow material={mat('#c9b48e')}>
        <planeGeometry args={[15, 11]} />
      </mesh>
      {/* garden: soil beds with saplings that grow over the years */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[40.5, 0.05, -76.6]} material={mat('#6e4b2a')}>
        <planeGeometry args={[6, 3.6]} />
      </mesh>
      {[38.3, 39.8, 41.3, 42.8].map((x, i) => (
        <group key={x}>
          <Cyl p={[x, 0.3, -77.6]} r={0.03} h={0.6} c="#6b4f35" />
          <mesh position={[x, 0.45 + Math.min(1, (age - 10) / 8) * 0.6, -77.6]} scale={0.25 + Math.min(1, (age - 10) / 8) * 0.55} castShadow material={flatMat(i % 2 ? '#7f9460' : '#5f9246')}>
            <icosahedronGeometry args={[1, 0]} />
          </mesh>
          <Box p={[x + 0.3, 0.15, -76.9]} s={[0.25, 0.18, 0.02]} c="#f5ecd7" cast={false} />
        </group>
      ))}
      <Cyl p={[43.3, 0.25, -75]} r={0.22} h={0.5} c="#2e86c1" />
      {/* ping-pong table */}
      <Box p={[34, 0.74, -72.2]} s={[1.5, 0.05, 2.7]} c="#1e6b45" />
      <Box p={[34, 0.85, -72.2]} s={[1.5, 0.15, 0.02]} c="#f5f5f5" />
      <CuboidCollider args={[0.6, 0.36, 1.1]} position={[34, 0.36, -72.2]} />
      {[-72.9, -71.5].map((z) => [33.4, 34.6].map((x) => <Box key={`${x}${z}`} p={[x, 0.36, z]} s={[0.06, 0.72, 0.06]} c="#444" />))}
      {/* mini court with two small goals */}
      {[30.2, 37.6].map((x, i) => (
        <group key={x}>
          <Box p={[x, 0.6, -76.6]} s={[0.06, 1.2, 0.06]} c="#ecf0f1" col />
          <Box p={[x, 0.6, -78.4]} s={[0.06, 1.2, 0.06]} c="#ecf0f1" col />
          <Box p={[x, 1.2, -77.5]} s={[0.06, 0.06, 1.9]} c="#ecf0f1" />
          <mesh position={[x + (i ? 0.4 : -0.4), 0.6, -77.5]} material={mat('#ffffff', { transparent: true, opacity: 0.25, side: THREE.DoubleSide })}>
            <boxGeometry args={[0.8, 1.2, 1.8]} />
          </mesh>
        </group>
      ))}
      <Tree p={[29.8, -69]} s={0.8} olive />
      <Lamp p={[34.5, -67.4]} arm={[0, -1]} />
    </>
  );
}

const VEST = '#7ed957';
const VOLUNTEERS: Look[] = [
  { skin: '#c99670', shirt: VEST, pants: '#2c3e50', hair: '#222', scale: 0.86, style: 'short' },
  { skin: '#d9a77c', shirt: VEST, pants: '#4a235a', hair: '#111', scale: 0.84, hijab: '#f5cba7' },
  { skin: '#c48b62', shirt: VEST, pants: '#212f3d', hair: '#111', scale: 0.9, style: 'curly' },
  { skin: '#e0b48c', shirt: VEST, pants: '#1b2631', hair: '#2b1b14', scale: 0.85, hijab: '#2e86c1' },
  { skin: '#bf8a62', shirt: VEST, pants: '#1c1c1c', hair: '#151515', scale: 0.95, beard: true },
  { skin: '#dcae85', shirt: VEST, pants: '#2e4053', hair: '#3b2a20', scale: 0.7, style: 'short' },
];
const SPOTS: [number, number, number][] = [
  [32.5, -75.5, 0.4],
  [35.8, -77.2, -2.6],
  [39.2, -74.8, 3.1],
  [41.6, -75.1, 2.2],
  [36.6, -70.1, 1.4],
  [30.6, -71.8, -1.2],
];

/** Banners and volunteers in green vests on the volunteering day. */
export function VolunteerDay() {
  const active = useGame((s) => !!s.game && chapterOf(s.game).event === 'volunteer');
  const bags = useMemo(() => mat('#1c1c1c', { rough: 0.6 }), []);
  if (!active) return null;
  return (
    <group>
      <Sign p={[36.5, 2.3, -67.9]} text="يوم التطوّع — كلنا للحومة" w={6} h={0.8} rotY={Math.PI} bg="#27ae60" />
      <Sign p={[3.9, 2.2, -73.5]} text="مرحبا بالمتطوعين ←" w={2.4} h={0.5} rotY={Math.PI / 2} bg="#27ae60" />
      {SPOTS.map(([x, z, yaw], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, yaw, 0]}>
          <Character look={VOLUNTEERS[i % VOLUNTEERS.length]} working={i % 2 === 0} />
        </group>
      ))}
      {[33.2, 33.9, 42.4].map((x, i) => (
        <mesh key={x} position={[x, 0.35, -78.2 + i * 0.3]} castShadow material={bags}>
          <sphereGeometry args={[0.35, 8, 6]} />
        </mesh>
      ))}
      <RigidBody type="fixed" colliders={false}>
        {SPOTS.map(([x, z], i) => (
          <CapsuleCollider key={i} args={[0.5, 0.25]} position={[x, 0.8, z]} />
        ))}
      </RigidBody>
    </group>
  );
}
