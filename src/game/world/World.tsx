// The neighbourhood: ground, streets, buildings with interiors, props and
// all static colliders (inside one fixed rigid body for efficiency).
import { memo, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, CylinderCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import { FOOTPRINTS, ROADS, WORLD_HALF } from './layout';
import { livePose } from '../store';
import { facadeMaterial, flatMat, groundTexture, mat, PALETTE, rng } from './materials';
import { Districts } from './Districts';
import { MosqueBuilding } from './Mosque';
import { DarChababBuilding } from './DarChabab';
import { Bench, Box, Car, Cyl, Door, Flag, HidingRoof, Lamp, Palm, RoofKit, Sign, Tree, WallLine, Window } from './primitives';

// ---------------------------------------------------------------------------
// Ground & streets
// ---------------------------------------------------------------------------
function Ground() {
  const dirt = useMemo(() => groundTexture('dirt', [40, 40]), []);
  const roads = useMemo(() => ROADS.map(([x0, z0, x1, z1]) => mat('#ffffff', { map: groundTexture('asphalt', [(x1 - x0) / 8, (z1 - z0) / 8]), rough: 0.95 })), []);
  const walks = useMemo(() => [groundTexture('sidewalk', [40, 0.5]), groundTexture('sidewalk', [0.5, 40])], []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[260, 260]} />
        <meshStandardMaterial map={dirt} roughness={1} />
      </mesh>
      <CuboidCollider args={[130, 0.5, 130]} position={[0, -0.5, 0]} />
      {ROADS.map(([x0, z0, x1, z1], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[(x0 + x1) / 2, 0.015, (z0 + z1) / 2]} receiveShadow material={roads[i]}>
          <planeGeometry args={[x1 - x0, z1 - z0]} />
        </mesh>
      ))}
      {/* sidewalks along the two main streets */}
      {[
        [-80, -6, 80, -4],
        [-80, 4, 80, 6],
        [-6, -80, -4, 80],
        [4, -80, 6, 80],
      ].map(([x0, z0, x1, z1], i) => (
        <group key={`sw${i}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(x0 + x1) / 2, 0.025, (z0 + z1) / 2]} receiveShadow material={mat('#ffffff', { map: walks[i < 2 ? 0 : 1] })}>
            <planeGeometry args={[x1 - x0, z1 - z0]} />
          </mesh>
          {/* kerb on the road side */}
          <mesh position={i < 2 ? [(x0 + x1) / 2, 0.06, i === 0 ? z1 : z0] : [i === 2 ? x1 : x0, 0.06, (z0 + z1) / 2]} receiveShadow material={mat('#d9d2c4')}>
            <boxGeometry args={i < 2 ? [x1 - x0, 0.12, 0.18] : [0.18, 0.12, z1 - z0]} />
          </mesh>
        </group>
      ))}
      {/* dashed centre line */}
      {Array.from({ length: 32 }, (_, i) => -78 + i * 5)
        .filter((x) => Math.abs(x) > 6)
        .map((x) => (
          <mesh key={`dl${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, 0]} material={mat('#e8e2c8')}>
            <planeGeometry args={[2.2, 0.15]} />
          </mesh>
        ))}
      {/* zebra crossing near the school */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={`zb${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-24, 0.03, -3 + i * 1.2]} material={mat('#f0ece0')}>
          <planeGeometry args={[3, 0.6]} />
        </mesh>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Generic solid apartment block with textured facade
// ---------------------------------------------------------------------------
export function Block({ x0, z0, x1, z1, h, wall, kit = true }: { x0: number; z0: number; x1: number; z1: number; h: number; wall: string; kit?: boolean }) {
  const w = x1 - x0;
  const d = z1 - z0;
  const floors = Math.max(1, Math.round(h / 3));
  const seed = Math.abs(Math.round(x0 * 7 + z0 * 13)) % 5;
  const mx = useMemo(() => facadeMaterial(wall, floors, Math.max(1, Math.round(w / 3.2)), seed), [wall, floors, w, seed]);
  const mz = useMemo(() => facadeMaterial(wall, floors, Math.max(1, Math.round(d / 3.2)), seed + 1), [wall, floors, d, seed]);
  const plain = mat(wall);
  // box material order: +x, -x, +y, -y, +z, -z
  const mats = useMemo(() => [mz, mz, mat(PALETTE.roof), plain, mx, mx], [mx, mz, plain]);
  return (
    <>
      <mesh position={[(x0 + x1) / 2, h / 2, (z0 + z1) / 2]} castShadow receiveShadow material={mats}>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      <CuboidCollider args={[w / 2, h / 2, d / 2]} position={[(x0 + x1) / 2, h / 2, (z0 + z1) / 2]} />
      {kit && <RoofKit p={[x0 + w * 0.3, z0 + d * 0.4]} y={h} />}
      {kit && w > 10 && <RoofKit p={[x0 + w * 0.75, z0 + d * 0.6]} y={h} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Amine's family home (full interior)
// ---------------------------------------------------------------------------
/** Amine's red blanket: folded at the foot of the bed, pulled over him while he sleeps. */
function Blanket() {
  const ref = useRef<THREE.Mesh>(null);
  const over = useRef(0);
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    over.current = THREE.MathUtils.damp(over.current, livePose.inBed ? 1 : 0, 5, dt);
    const k = over.current;
    m.position.set(-27.6 - 0.15 * k, 0.65 + 0.2 * k, -25.5);
    m.scale.set(1 + 0.3 * k, 1 + 0.4 * k, 1 + 0.06 * k);
  });
  return (
    <mesh ref={ref} position={[-27.6, 0.65, -25.5]} castShadow receiveShadow material={mat('#c0392b')}>
      <boxGeometry args={[1.0, 0.06, 0.98]} />
    </mesh>
  );
}

function Home() {
  const tiles = useMemo(() => groundTexture('tiles', [10, 10]), []);
  const W = PALETTE.wallCream;
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-20, 0.03, -18]} receiveShadow material={mat('#fbf6ee', { map: tiles })}>
        <planeGeometry args={[20, 20]} />
      </mesh>
      {/* outer walls */}
      <WallLine a={[-30, -28]} b={[-10, -28]} c={W} />
      <WallLine a={[-30, -8]} b={[-10, -8]} c={W} gaps={[{ at: -24, w: 1.6 }]} />
      <WallLine a={[-30, -28]} b={[-30, -8]} c={W} />
      <WallLine a={[-10, -28]} b={[-10, -8]} c={W} />
      {/* inner walls */}
      <WallLine a={[-30, -18]} b={[-10, -18]} c="#f2ead9" t={0.18} gaps={[{ at: -25, w: 1.4 }, { at: -17.5, w: 1.2 }, { at: -12.5, w: 1.2 }]} />
      <WallLine a={[-20, -18]} b={[-20, -8]} c="#f2ead9" t={0.18} gaps={[{ at: -13, w: 1.6 }]} />
      <WallLine a={[-20, -28]} b={[-20, -18]} c="#f2ead9" t={0.18} />
      <WallLine a={[-15, -28]} b={[-15, -18]} c="#f2ead9" t={0.18} />
      <HidingRoof x0={-30} z0={-28} x1={-10} z1={-8} y={3.2} />
      <RoofKit p={[-14, -24]} y={3.45} />
      {/* exterior windows + door */}
      <Window p={[-28, 1.7, -7.86]} />
      <Window p={[-14.5, 1.7, -7.86]} />
      <Window p={[-25, 1.7, -28.14]} rotY={Math.PI} />
      <Window p={[-17.5, 1.9, -28.14]} rotY={Math.PI} w={0.6} h={0.6} />
      <Window p={[-30.14, 1.7, -23]} rotY={-Math.PI / 2} />
      <Window p={[-30.14, 1.7, -13]} rotY={-Math.PI / 2} />
      <Window p={[-9.86, 1.7, -13]} rotY={Math.PI / 2} />
      <Door p={[-24, 0, -8]} w={1.6} c={PALETTE.shutterBlue} />
      <Box p={[-24, 0.06, -6.9]} s={[2.2, 0.12, 1.4]} c="#cbbfa8" />
      {/* bedroom */}
      <Box p={[-28, 0.25, -25.5]} s={[2, 0.5, 1.05]} c={PALETTE.wood} col />
      <Box p={[-28.05, 0.56, -25.5]} s={[1.9, 0.14, 0.95]} c="#e8eef5" />
      <Box p={[-28.8, 0.68, -25.5]} s={[0.35, 0.12, 0.7]} c="#ffffff" />
      <Blanket />
      <Box p={[-21.6, 0.38, -26.9]} s={[1.3, 0.76, 0.6]} c="#9a6b43" col />
      <Box p={[-21.6, 0.8, -27.0]} s={[0.4, 0.06, 0.3]} c="#2c7be5" />
      <Box p={[-21.2, 0.84, -26.9]} s={[0.25, 0.14, 0.2]} c="#f1c40f" />
      <Box p={[-21.6, 0.25, -26.2]} s={[0.45, 0.5, 0.45]} c="#555" />
      <Box p={[-20.55, 0.45, -20]} s={[0.45, 0.9, 1.2]} c="#a47148" col />
      <mesh position={[-20.55, 1.05, -20]} castShadow material={mat('#ff8fb1')}>
        <sphereGeometry args={[0.15, 12, 10]} />
      </mesh>
      <Box p={[-29.6, 1, -20.2]} s={[0.6, 2, 1.4]} c="#7b5537" col />
      <mesh position={[-29.88, 1.8, -23.5]} rotation={[0, Math.PI / 2, 0]} material={mat('#2e9e5b')}>
        <planeGeometry args={[1, 1.3]} />
      </mesh>
      <Box p={[-25, 0.035, -23]} s={[2.4, 0.02, 1.6]} c="#3f6fb5" />
      {/* bathroom */}
      <Box p={[-17.5, 0.42, -27.45]} s={[0.7, 0.85, 0.5]} c="#f4f6f7" col />
      <mesh position={[-17.5, 1.45, -27.88]} material={mat('#bcd7e6', { rough: 0.1, metal: 0.4 })}>
        <planeGeometry args={[0.6, 0.7]} />
      </mesh>
      <Box p={[-15.6, 1.6, -27.6]} s={[0.5, 0.8, 0.5]} c="#ecf0f1" />
      <Box p={[-18.9, 0.25, -19.2]} s={[1.6, 0.5, 1.6]} c="#d0e4ee" col />
      {/* parents' room */}
      <Box p={[-12.5, 0.3, -25.5]} s={[2.2, 0.6, 2]} c="#8e5f3a" col />
      <Box p={[-12.5, 0.62, -25.4]} s={[2.1, 0.1, 1.9]} c="#d9c4e6" />
      {/* kitchen */}
      <Box p={[-14.5, 0.38, -11.5]} s={[1.7, 0.76, 1.0]} c="#b08155" col />
      <Box p={[-14.5, 0.78, -11.5]} s={[1.75, 0.03, 1.05]} c="#f5f5f5" />
      <Box p={[-14.5, 0.84, -11.6]} s={[0.4, 0.06, 0.3]} c="#c8a165" />
      {[[-15.5, -11.5], [-13.5, -11.5], [-14.5, -10.7], [-14.5, -12.3]].map(([x, z], i) => (
        <Cyl key={i} p={[x, 0.22, z]} r={0.18} h={0.44} c="#6e4b2a" />
      ))}
      <Box p={[-10.45, 0.45, -15]} s={[0.7, 0.9, 4.5]} c="#dcd2c4" col />
      <Box p={[-10.45, 0.92, -16]} s={[0.6, 0.05, 0.6]} c="#2c2c2c" />
      <Box p={[-10.5, 0.95, -9.3]} s={[0.7, 1.9, 0.7]} c="#ecf0f1" col />
      <Cyl p={[-11.2, 0.35, -17.4]} r={0.15} h={0.7} c="#e67e22" />
      {/* living room */}
      <Box p={[-29.6, 0.35, -13]} s={[0.6, 0.7, 1.8]} c="#5d4037" col />
      <Box p={[-29.55, 1.05, -13]} s={[0.08, 0.7, 1.3]} c="#111" />
      {/* banquettes along the north wall, leaving the bedroom doorway (x ≈ -25) clear */}
      <Box p={[-27.95, 0.22, -17.45]} s={[3.3, 0.44, 0.7]} c="#8e2c3a" col />
      <Box p={[-27.95, 0.6, -17.7]} s={[3.3, 0.4, 0.2]} c="#a83246" />
      <Box p={[-22.05, 0.22, -17.45]} s={[3.3, 0.44, 0.7]} c="#8e2c3a" col />
      <Box p={[-22.05, 0.6, -17.7]} s={[3.3, 0.4, 0.2]} c="#a83246" />
      <Box p={[-25, 0.03, -13]} s={[4.5, 0.02, 3.2]} c="#b5442f" />
      <Cyl p={[-25, 0.2, -13]} r={0.55} h={0.35} c="#6e4b2a" />
      <mesh position={[-20.12, 1.8, -11]} rotation={[0, -Math.PI / 2, 0]} material={mat('#c9a227')}>
        <planeGeometry args={[0.8, 0.6]} />
      </mesh>
    </>
  );
}

function Neighbor() {
  return (
    <>
      <Block x0={-40} z0={-28} x1={-33} z1={-8} h={6} wall={PALETTE.wallPink} />
      <Box p={[-36.5, 1.1, -7.9]} s={[1.1, 2.2, 0.1]} c={PALETTE.doorBrown} />
      <Block x0={-40} z0={-46} x1={-20} z1={-38} h={9} wall={PALETTE.wallWhite} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Shops
// ---------------------------------------------------------------------------
function Hanout({ age }: { age: number }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[13, 0.03, -13]} receiveShadow material={mat('#cfc3ad')}>
        <planeGeometry args={[10, 10]} />
      </mesh>
      <WallLine a={[8, -18]} b={[18, -18]} c={PALETTE.wallWhite} />
      <WallLine a={[8, -8]} b={[18, -8]} c={PALETTE.wallWhite} gaps={[{ at: 13, w: 2.2 }]} />
      <WallLine a={[8, -18]} b={[8, -8]} c={PALETTE.wallWhite} />
      <WallLine a={[18, -18]} b={[18, -8]} c={PALETTE.wallWhite} />
      <HidingRoof x0={8} z0={-18} x1={18} z1={-8} y={3.2} />
      {/* the shop gets repainted as the years pass, and starts selling phone credit */}
      <Sign p={[13, 3.6, -7.84]} text="حانوت عمي صالح — مواد غذائية" w={6} h={0.9} bg={age >= 14 ? '#1f4e79' : '#1d6b3a'} />
      {age >= 16 && <Sign p={[16.6, 2.2, -7.86]} text="Flexy فليكسي" w={1.4} h={0.5} bg="#f1c40f" fg="#111" />}
      <mesh position={[13, 2.75, -7.3]} rotation={[0.5, 0, 0]} material={mat(age >= 14 ? '#2471a3' : '#c0392b', { side: THREE.DoubleSide })}>
        <planeGeometry args={[6, 1.3]} />
      </mesh>
      {/* the awning is above head height: a thin collider keeps the camera from slipping under it */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[3, 0.3, 0.6]} position={[13, 2.75, -7.3]} rotation={[0.5, 0, 0]} />
      </RigidBody>
      <Box p={[13, 0.5, -15.5]} s={[5, 1, 0.7]} c="#9c6b3f" col />
      <Box p={[11.6, 1.12, -15.5]} s={[0.5, 0.25, 0.4]} c="#f1c40f" />
      <Box p={[14.3, 1.1, -15.5]} s={[0.6, 0.2, 0.4]} c="#888" />
      {[0.5, 1.2, 1.9, 2.5].map((y, i) => (
        <group key={i}>
          <Box p={[13, y, -17.65]} s={[8, 0.06, 0.5]} c="#7a5230" />
          {Array.from({ length: 10 }, (_, j) => (
            <Box key={j} p={[9.6 + j * 0.75, y + 0.18, -17.6]} s={[0.4, 0.3, 0.3]} c={['#e74c3c', '#f39c12', '#27ae60', '#2980b9', '#ecf0f1', '#8e44ad'][(i + j) % 6]} cast={false} />
          ))}
        </group>
      ))}
      <Box p={[17.4, 0.95, -15]} s={[0.8, 1.9, 0.7]} c="#d6eaf8" col />
      <Box p={[16.8, 0.3, -10.2]} s={[0.7, 0.6, 0.6]} c="#b9875b" col />
      <Box p={[16.8, 0.8, -10.2]} s={[0.6, 0.4, 0.5]} c="#c99a6b" />
      <Box p={[16.9, 0.25, -11.1]} s={[0.6, 0.5, 0.5]} c="#a77a4e" />
      {/* the alley behind */}
      <WallLine a={[18, -26]} b={[24, -26]} c="#cdbfa6" h={2.6} />
      <Sign p={[21, 1.5, -25.86]} text="الحومة ما تنساش" w={3.2} h={0.9} bg="#3b3b3b" fg="#ff6b6b" />
      {/* graffiti accumulates on the alley wall over the years */}
      {age >= 13 && <Sign p={[19.4, 1.2, -25.85]} text="USMT" w={1.4} h={0.6} bg="#3b3b3b" fg="#2ecc71" />}
      {age >= 16 && <Sign p={[22.7, 1.9, -25.85]} text="1 2 3 Viva l'Algérie" w={1.6} h={0.4} bg="#3b3b3b" fg="#f5f5f5" />}
    </>
  );
}

function Apartments() {
  const facade = useMemo(() => facadeMaterial(PALETTE.wallOchre, 3, 4, 3), []);
  return (
    <>
      <Block x0={24} z0={-28} x1={38} z1={-14} h={12} wall={PALETTE.wallOchre} />
      {/* upper floors over the entrance hall */}
      <mesh position={[31, 7.5, -11]} castShadow receiveShadow material={facade}>
        <boxGeometry args={[14, 9, 6]} />
      </mesh>
      <CuboidCollider args={[7, 4.5, 3]} position={[31, 7.5, -11]} />
      <Box p={[25.75, 1.5, -11]} s={[3.5, 3, 6]} c="#b89c74" col />
      <Box p={[36.25, 1.5, -11]} s={[3.5, 3, 6]} c="#b89c74" col />
      <Box p={[25.75, 1.3, -7.95]} s={[3.2, 2.6, 0.06]} c="#6d7b86" />
      <Box p={[36.25, 1.3, -7.95]} s={[3.2, 2.6, 0.06]} c="#6d7b86" />
      {/* stairs (blocked volume + visual steps) */}
      {Array.from({ length: 10 }, (_, i) => (
        <Box key={i} p={[33.6, 0.15 + i * 0.3, -9.6 - i * 0.42]} s={[1.6, 0.3, 0.42]} c="#9a9a96" />
      ))}
      <CuboidCollider args={[0.9, 1.5, 2.2]} position={[33.6, 1.5, -11.6]} />
      <Box p={[32.75, 1.6, -11.6]} s={[0.06, 1, 4.4]} c="#444" />
      <Box p={[31, 0.02, -11]} s={[7, 0.04, 6]} c="#a8a39a" cast={false} />
      <Cyl p={[29, 0.45, -13.2]} r={0.3} h={0.9} c="#3d5a40" />
      <Sign p={[31, 2.6, -7.9]} text="عمارة 12" w={1.6} h={0.45} bg="#555" />
    </>
  );
}

function Square() {
  const tiles = useMemo(() => groundTexture('tiles', [13, 11]), []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[59, 0.03, -19]} receiveShadow material={mat('#f6efe4', { map: tiles })}>
        <planeGeometry args={[26, 22]} />
      </mesh>
      {/* fountain */}
      <Cyl p={[59, 0.3, -17]} r={2} h={0.6} c="#d9cfc0" col seg={20} />
      <mesh position={[59, 0.55, -17]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#5dade2', { rough: 0.1, metal: 0.2, transparent: true, opacity: 0.85 })}>
        <circleGeometry args={[1.8, 20]} />
      </mesh>
      <Cyl p={[59, 1.2, -17]} r={0.25} h={1.6} c="#d9cfc0" />
      <mesh position={[59, 2.05, -17]} material={mat('#d9cfc0')}>
        <cylinderGeometry args={[0.7, 0.3, 0.25, 14]} />
      </mesh>
      {[[-3, 4], [3, 4], [-3, -4], [3, -4]].map(([dx, dz], i) => (
        <Bench key={i} p={[59 + dx * 1.5, -17 + dz]} rotY={dx > 0 ? Math.PI / 2 : -Math.PI / 2} />
      ))}
      <Palm p={[48, -10]} />
      <Palm p={[70, -10]} />
      <Palm p={[48, -28]} />
      <Palm p={[70, -28]} />
      {/* souk stalls */}
      {[[50, '#c0392b'], [54, '#2874a6'], [58, '#27ae60'], [62, '#d68910']].map(([x, c]) => (
        <group key={x as number}>
          <Box p={[x as number, 0.45, -27.2]} s={[3, 0.9, 1.2]} c="#8d6e4a" col />
          {Array.from({ length: 6 }, (_, j) => (
            <mesh key={j} position={[(x as number) - 1.1 + j * 0.45, 1.0, -27.2]} castShadow material={mat(['#e74c3c', '#f4d03f', '#27ae60', '#e67e22'][j % 4])}>
              <sphereGeometry args={[0.16, 8, 6]} />
            </mesh>
          ))}
          <mesh position={[x as number, 2.4, -27.4]} rotation={[0.25, 0, 0]} castShadow material={mat(c as string, { side: THREE.DoubleSide })}>
            <planeGeometry args={[3.4, 1.8]} />
          </mesh>
          {/* the cloth stops the camera like a wall */}
          <RigidBody type="fixed" colliders={false}>
            <CuboidCollider args={[1.7, 0.9, 0.04]} position={[x as number, 2.4, -27.4]} rotation={[0.25, 0, 0]} />
          </RigidBody>
          <Cyl p={[(x as number) - 1.5, 1.2, -27.8]} r={0.05} h={2.4} c="#555" />
          <Cyl p={[(x as number) + 1.5, 1.2, -27.8]} r={0.05} h={2.4} c="#555" />
        </group>
      ))}
      {/* café */}
      <Block x0={66} z0={-30} x1={72} z1={-21} h={4} wall={PALETTE.wallWhite} kit={false} />
      <Sign p={[65.94, 3.2, -25.5]} text="مقهى الساحة" w={3.6} h={0.8} rotY={-Math.PI / 2} bg="#6e2c00" />
      {[[63, -22.5], [63, -25.5]].map(([x, z], i) => (
        <group key={i}>
          <Cyl p={[x, 0.38, z]} r={0.45} h={0.05} c="#ecf0f1" />
          <Cyl p={[x, 0.19, z]} r={0.05} h={0.38} c="#7f8c8d" />
        </group>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Schools (primary school + middle/high school share a campus layout)
// ---------------------------------------------------------------------------
function Campus({ x0, x1, gateX, name, wall }: { x0: number; x1: number; gateX: number; name: string; wall: string }) {
  const cx0 = x0 + 4;
  const cx1 = x1 - 4;
  const courtyard = useMemo(() => groundTexture('tiles', [7, 5]), []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(x0 + x1) / 2, 0.03, 25]} receiveShadow material={mat('#f3ece0', { map: courtyard })}>
        <planeGeometry args={[x1 - x0, 30]} />
      </mesh>
      <WallLine a={[x0, 10]} b={[x1, 10]} h={2.4} c={wall} gaps={[{ at: gateX, w: 4 }]} doorH={9} />
      <WallLine a={[x0, 40]} b={[x1, 40]} h={3.4} c={wall} />
      <WallLine a={[x0, 10]} b={[x0, 40]} h={2.4} c={wall} />
      <WallLine a={[x1, 10]} b={[x1, 40]} h={2.4} c={wall} />
      <Box p={[gateX - 2.2, 1.6, 10]} s={[0.5, 3.2, 0.5]} c="#b5651d" col />
      <Box p={[gateX + 2.2, 1.6, 10]} s={[0.5, 3.2, 0.5]} c="#b5651d" col />
      <Sign p={[gateX, 3.7, 9.7]} text={name} w={6.5} h={0.9} rotY={Math.PI} bg="#14532d" />
      <Flag p={[x0 + 2.5, 13]} h={7} />
      {/* classroom block */}
      <WallLine a={[cx0, 28]} b={[cx1, 28]} h={3.4} c={PALETTE.wallWhite} gaps={[{ at: gateX, w: 1.8 }]} />
      <WallLine a={[cx0, 28]} b={[cx0, 40]} h={3.4} c={PALETTE.wallWhite} />
      <WallLine a={[cx1, 28]} b={[cx1, 40]} h={3.4} c={PALETTE.wallWhite} />
      <HidingRoof x0={cx0} z0={28} x1={cx1} z1={40} y={3.4} c="#c9b99c" />
      {[-7, -4, 4, 7].map((dx) => (
        <Window key={dx} p={[gateX + dx, 1.8, 27.86]} rotY={Math.PI} />
      ))}
      <Sign p={[gateX, 2.85, 27.84]} text="القسم" w={1.6} h={0.45} rotY={Math.PI} bg="#7b241c" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(cx0 + cx1) / 2, 0.04, 34]} receiveShadow material={mat('#cbbba0')}>
        <planeGeometry args={[cx1 - cx0, 12]} />
      </mesh>
      {/* blackboard */}
      <mesh position={[gateX, 1.75, 39.7]} rotation={[0, Math.PI, 0]} material={mat('#1e3d2f', { rough: 0.5 })}>
        <planeGeometry args={[4.4, 1.5]} />
      </mesh>
      <Sign p={[gateX, 2.7, 39.68]} text="بسم الله الرحمن الرحيم" w={2.6} h={0.3} rotY={Math.PI} bg="#1e3d2f" />
      <Box p={[gateX - 3, 0.4, 37.2]} s={[1.6, 0.8, 0.7]} c="#6e4b2a" col />
      {/* student desks */}
      {[-7, -3.5, 3.5, 7].map((dx) =>
        [31, 34.5].map((z) => (
          <group key={`${dx}${z}`}>
            <Box p={[gateX + dx, 0.38, z]} s={[1.3, 0.76, 0.55]} c={dx === 3.5 && z === 31 ? '#a0703f' : '#8b5e34'} col />
            <Box p={[gateX + dx, 0.23, z - 0.55]} s={[1.2, 0.46, 0.3]} c="#555" />
          </group>
        )),
      )}
      {/* courtyard */}
      <Tree p={[x0 + 3, 22]} />
      <Tree p={[x1 - 3, 22]} />
      <Bench p={[x1 - 3, 15]} rotY={Math.PI / 2} />
      {/* notice board */}
      <Box p={[x0 + 6, 1.6, 15.9]} s={[2.2, 1.2, 0.08]} c="#8b5e34" />
      <mesh position={[x0 + 6, 1.6, 15.85]} rotation={[0, Math.PI, 0]} material={mat('#f5ecd7')}>
        <planeGeometry args={[2, 1]} />
      </mesh>
      <Box p={[x0 + 5.2, 0.6, 15.9]} s={[0.08, 1.2, 0.08]} c="#555" col />
      <Box p={[x0 + 6.8, 0.6, 15.9]} s={[0.08, 1.2, 0.08]} c="#555" col />
    </>
  );
}

// ---------------------------------------------------------------------------
// Football field
// ---------------------------------------------------------------------------
function Field() {
  const pitch = useMemo(() => groundTexture('pitch', [1, 4]), []);
  const white = mat('#f4f4f4');
  const line = (p: [number, number], s: [number, number], k: string) => (
    <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[p[0], 0.045, p[1]]} material={white}>
      <planeGeometry args={s} />
    </mesh>
  );
  const goal = (z: number, dir: number) => (
    <group key={z}>
      <Cyl p={[22.5, 1.1, z]} r={0.07} h={2.2} c="#fff" col />
      <Cyl p={[27.5, 1.1, z]} r={0.07} h={2.2} c="#fff" col />
      <Box p={[25, 2.2, z]} s={[5.1, 0.12, 0.12]} c="#fff" />
      <mesh position={[25, 1.1, z + dir * 0.9]} material={mat('#ffffff', { transparent: true, opacity: 0.25, side: THREE.DoubleSide })}>
        <boxGeometry args={[5, 2.2, 1.8]} />
      </mesh>
      <CuboidCollider args={[2.5, 1.1, 0.05]} position={[25, 1.1, z + dir * 1.8]} />
    </group>
  );
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[25, 0.035, 27]} receiveShadow material={mat('#ffffff', { map: pitch })}>
        <planeGeometry args={[30, 30]} />
      </mesh>
      {line([25, 13.5], [26, 0.12], 'a')}
      {line([25, 40.5], [26, 0.12], 'b')}
      {line([12, 27], [0.12, 27], 'c')}
      {line([38, 27], [0.12, 27], 'd')}
      {line([25, 27], [26, 0.12], 'e')}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[25, 0.046, 27]} material={white}>
        <ringGeometry args={[3, 3.12, 32]} />
      </mesh>
      {goal(13.5, -1)}
      {goal(40.5, 1)}
      <WallLine a={[10, 12]} b={[40, 12]} h={1.1} t={0.08} c="#7f8c8d" gaps={[{ at: 14, w: 3 }, { at: 36, w: 3 }]} doorH={2} />
      <WallLine a={[10, 42]} b={[40, 42]} h={1.1} t={0.08} c="#7f8c8d" />
      <WallLine a={[10, 12]} b={[10, 42]} h={1.1} t={0.08} c="#7f8c8d" />
      <WallLine a={[40, 12]} b={[40, 42]} h={1.1} t={0.08} c="#7f8c8d" gaps={[{ at: 20, w: 3 }]} doorH={2} />
      <Bench p={[11, 22]} rotY={Math.PI / 2} />
      <Bench p={[11, 32]} rotY={Math.PI / 2} />
      <Sign p={[25, 2.4, 11.9]} text="ملعب الحومة" w={3} h={0.6} rotY={Math.PI} bg="#145a32" />
    </>
  );
}

// ---------------------------------------------------------------------------
// Workshop, public buildings, mosque, grandpa's house
// ---------------------------------------------------------------------------
function Room({ x0, z0, x1, z1, h, wall, door, sign, signBg, floor = '#cfc3ad' }: { x0: number; z0: number; x1: number; z1: number; h: number; wall: string; door: { side: 'n' | 's'; at: number; w: number }; sign: string; signBg: string; floor?: string }) {
  const doorZ = door.side === 'n' ? z0 : z1;
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(x0 + x1) / 2, 0.03, (z0 + z1) / 2]} receiveShadow material={mat(floor)}>
        <planeGeometry args={[x1 - x0, z1 - z0]} />
      </mesh>
      <WallLine a={[x0, z0]} b={[x1, z0]} h={h} c={wall} gaps={door.side === 'n' ? [{ at: door.at, w: door.w }] : []} doorH={door.w > 2.5 ? 3 : 2.3} />
      <WallLine a={[x0, z1]} b={[x1, z1]} h={h} c={wall} gaps={door.side === 's' ? [{ at: door.at, w: door.w }] : []} doorH={door.w > 2.5 ? 3 : 2.3} />
      <WallLine a={[x0, z0]} b={[x0, z1]} h={h} c={wall} />
      <WallLine a={[x1, z0]} b={[x1, z1]} h={h} c={wall} />
      <HidingRoof x0={x0} z0={z0} x1={x1} z1={z1} y={h} />
      <Sign p={[door.at, h - 0.45, doorZ + (door.side === 'n' ? -0.16 : 0.16)]} text={sign} w={Math.min(7, x1 - x0 - 1)} h={0.75} rotY={door.side === 'n' ? Math.PI : 0} bg={signBg} />
      {[x0 + 2.5, x1 - 2.5].map((x) => (
        <Window key={x} p={[x, 1.8, doorZ + (door.side === 'n' ? -0.14 : 0.14)]} rotY={door.side === 'n' ? Math.PI : 0} />
      ))}
    </>
  );
}

function Workshop() {
  return (
    <>
      <Room x0={48} z0={10} x1={62} z1={22} h={4} wall="#c8b89a" door={{ side: 'n', at: 55, w: 3.4 }} sign="ورشة عمي بشير — نجارة وحدادة" signBg="#5d4037" floor="#9e9488" />
      <Box p={[58, 0.45, 19.3]} s={[2.6, 0.9, 1.1]} c="#8a5a33" col />
      <Box p={[58, 0.95, 19.3]} s={[1.6, 0.1, 0.4]} c="#d7b48a" />
      <Box p={[51, 0.6, 20.5]} s={[3, 1.2, 1]} c="#c49a6c" col />
      <Box p={[51, 1.35, 20.5]} s={[2.8, 0.3, 0.9]} c="#d9b383" />
      <Cyl p={[60.8, 0.7, 12]} r={0.25} h={1.4} c="#2e86c1" col />
      <Box p={[49.2, 1.5, 15]} s={[0.2, 2, 3]} c="#6d6d6d" />
      <Box p={[53, 0.5, 13]} s={[1, 1, 1]} c="#7d6b55" col />
    </>
  );
}

function PublicBuildings() {
  return (
    <>
      {/* listening & prevention centre */}
      <Room x0={8} z0={-52} x1={22} z1={-38} h={3.4} wall={PALETTE.wallBlue} door={{ side: 's', at: 15, w: 1.8 }} sign="مركز الإصغاء والوقاية — الباب مفتوح" signBg="#117a65" floor="#e5e8e8" />
      <Box p={[15, 0.55, -47.6]} s={[3, 1.1, 0.8]} c="#ecf0f1" col />
      <Box p={[10, 0.25, -42]} s={[0.6, 0.5, 2.4]} c="#48c9b0" col />
      <Cyl p={[20.5, 0.6, -40]} r={0.35} h={1.2} c="#27ae60" />
      <mesh position={[15, 1.9, -51.85]} material={mat('#f9e79f')}>
        <planeGeometry args={[2.2, 1.2]} />
      </mesh>
      <Sign p={[15, 1.9, -51.84]} text="طلب المساعدة شجاعة" w={2.1} h={0.5} bg="#f9e79f" fg="#1b4f72" />
      <Tree p={[10, -35.5]} s={0.8} />
      <Bench p={[19, -36]} />
      {/* vocational training centre */}
      <Room x0={-72} z0={-32} x1={-48} z1={-12} h={4} wall={PALETTE.wallOchre} door={{ side: 's', at: -60, w: 2.2 }} sign="مركز التكوين المهني والتمهين" signBg="#1a5276" floor="#d5d8dc" />
      <Box p={[-60, 0.5, -26.6]} s={[3, 1, 0.8]} c="#5d6d7e" col />
      {[-68, -64, -56, -52].map((x) => (
        <group key={x}>
          <Box p={[x, 0.45, -29]} s={[2.4, 0.9, 1]} c="#7f8c8d" col />
          <Box p={[x, 1.6, -31.7]} s={[1.6, 1.2, 0.2]} c="#d5d8dc" />
        </group>
      ))}
      <Flag p={[-50, -10]} h={6} />
    </>
  );
}

function Grandpa() {
  return (
    <>
      <Block x0={-30} z0={-66} x1={-14} z1={-60} h={3.2} wall="#d8c09a" />
      <Box p={[-22, 1.1, -59.95]} s={[1.2, 2.2, 0.08]} c={PALETTE.shutterBlue} />
      <Window p={[-26.5, 1.7, -59.9]} />
      <Window p={[-17.5, 1.7, -59.9]} />
      <WallLine a={[-30, -60]} b={[-30, -50]} h={1.3} c="#cdb48d" />
      <WallLine a={[-14, -60]} b={[-14, -50]} h={1.3} c="#cdb48d" />
      <WallLine a={[-30, -50]} b={[-14, -50]} h={1.3} c="#cdb48d" gaps={[{ at: -22, w: 2.6 }]} doorH={3} />
      <Tree p={[-17, -55.6]} s={1.25} olive />
      <Tree p={[-27, -57]} s={0.9} olive />
      <Cyl p={[-26, 0.4, -52.5]} r={0.6} h={0.8} c="#9e9e9e" col />
      {Array.from({ length: 5 }, (_, i) => (
        <Box key={i} p={[-18.5 + (i % 3) * 0.6, 0.15, -53.5 + Math.floor(i / 3) * 0.6]} s={[0.5, 0.3, 0.4]} c="#4a6b2a" />
      ))}
      <Sign p={[-22, 1.75, -49.9]} text="دار الطاهر" w={1.6} h={0.4} bg="#7e5109" />
    </>
  );
}

function DecoBlocks() {
  const colours = [PALETTE.wallWhite, PALETTE.wallPink, PALETTE.wallBlue, PALETTE.wallCream, PALETTE.wallOchre];
  const deco = FOOTPRINTS.filter((f) => f.kind === 'deco' && !['neighbor1', 'neighbor2', 'apartments'].includes(f.id));
  return (
    <>
      {deco.flatMap((f, i) => {
        // split long blocks into 2 buildings of different heights
        const w = f.x1 - f.x0;
        const mid = f.x0 + w / 2;
        return [
          <Block key={`${f.id}a`} x0={f.x0} z0={f.z0} x1={mid - 0.5} z1={f.z1} h={6 + ((i * 3) % 7)} wall={colours[i % colours.length]} />,
          <Block key={`${f.id}b`} x0={mid + 0.5} z0={f.z0} x1={f.x1} z1={f.z1} h={9 + ((i * 5) % 6)} wall={colours[(i + 2) % colours.length]} />,
        ];
      })}
      {/* (the hospital and the municipal stadium now stand where filler blocks used to be) */}
      <Block x0={48} z0={24} x1={62} z1={26} h={1.6} wall="#bcae98" kit={false} />
    </>
  );
}

function StreetProps() {
  const palms: [number, number][] = [];
  for (let x = -70; x <= 70; x += 14) if (Math.abs(x) > 8 && Math.abs(x + 24) > 4) palms.push([x, 5.4]);
  const lamps: { p: [number, number]; arm: [number, number] }[] = [];
  for (let x = -75; x <= 75; x += 18) lamps.push({ p: [x, -5.4], arm: [0, 1] });
  for (let z = -70; z <= 70; z += 18) if (Math.abs(z) > 8) lamps.push({ p: [5.4, z], arm: [-1, 0] });
  return (
    <>
      {palms.map((p) => (
        <Palm key={`p${p[0]}`} p={p} />
      ))}
      {lamps.map(({ p, arm }) => (
        <Lamp key={`l${p[0]}_${p[1]}`} p={p} arm={arm} />
      ))}
      <Car p={[-40, 2.6]} c="#b03a2e" />
      <Car p={[40, -2.6]} rotY={Math.PI} c="#ecf0f1" />
      <Car p={[-2.4, 30]} rotY={Math.PI / 2} c="#1f618d" />
      <Car p={[64, -2.6]} rotY={Math.PI} c="#7d3c98" />
      <Car p={[-60, 44.5]} c="#d4ac0d" />
      {/* bus stop */}
      <Box p={[30, 2.4, 6.6]} s={[3.6, 0.1, 1.4]} c="#2e86c1" />
      <Box p={[28.3, 1.2, 7.1]} s={[0.08, 2.4, 0.08]} c="#555" col />
      <Box p={[31.7, 1.2, 7.1]} s={[0.08, 2.4, 0.08]} c="#555" col />
      <Box p={[30, 1.2, 7.25]} s={[3.4, 2.2, 0.05]} m={mat('#aed6f1', { transparent: true, opacity: 0.4 })} />
      <Sign p={[31.2, 2.0, 5.3]} text="موقف الحافلة" w={1.2} h={0.35} bg="#2e86c1" />
      <Cyl p={[31.2, 1, 5.2]} r={0.04} h={2} c="#555" />
      {/* street sign at the crossroads */}
      <Cyl p={[-7.5, 1.2, 5.6]} r={0.05} h={2.4} c="#555" col />
      <Sign p={[-7.5, 2.3, 5.62]} text="← المدرسة   الملعب →" w={1.8} h={0.35} bg="#1a5276" />
      <Sign p={[-7.5, 1.9, 5.62]} text="↑ الحومة الفوقانية" w={1.8} h={0.3} bg="#1a5276" />
      {/* bins and scattered trees */}
      {[[-8, -6.5], [20, -6.5], [44, 6.5], [-44, -6.5]].map(([x, z], i) => (
        <Cyl key={i} p={[x, 0.45, z]} r={0.3} h={0.9} c="#2e7d32" col />
      ))}
      <Tree p={[-8, -30]} />
      <Tree p={[7, -30]} s={0.9} />
      <Tree p={[-46, 7]} s={1.1} />
      <Tree p={[44, 30]} />
      <Tree p={[-8, 48]} olive />
    </>
  );
}

function Bounds() {
  const H = WORLD_HALF;
  return (
    <>
      <CuboidCollider args={[H, 5, 0.5]} position={[0, 5, -H]} />
      <CuboidCollider args={[H, 5, 0.5]} position={[0, 5, H]} />
      <CuboidCollider args={[0.5, 5, H]} position={[-H, 5, 0]} />
      <CuboidCollider args={[0.5, 5, H]} position={[H, 5, 0]} />
      <CylinderCollider args={[0.1, 0.1]} position={[0, -50, 0]} />
    </>
  );
}

/** Flat-topped mesa (like Djebel Dyr above Tébessa) with eroded sides and rock strata. */
function mesaGeometry(seed: number, w: number, h: number): THREE.BufferGeometry {
  const r = rng(seed);
  const geo = new THREE.CylinderGeometry(w * 0.42, w, h, 18, 5).toNonIndexed();
  const pos = geo.attributes.position;
  const colors: number[] = [];
  const strata = [new THREE.Color('#b8936b'), new THREE.Color('#a87f5a'), new THREE.Color('#c4a27a'), new THREE.Color('#9c7552'), new THREE.Color('#8f8a5e')];
  const jitter = new Map<string, number>();
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    // the same vertex must move the same way in every triangle
    const key = `${x.toFixed(2)}|${y.toFixed(2)}|${z.toFixed(2)}`;
    if (!jitter.has(key)) jitter.set(key, 0.82 + r() * 0.3);
    const top = y > h / 2 - 0.01;
    const k = top ? 1 : jitter.get(key)!;
    pos.setXYZ(i, x * k, y + (top ? (r() - 0.5) * 0.6 : 0), z * k);
    const t = (y + h / 2) / h;
    tmp.copy(strata[Math.min(strata.length - 1, Math.floor(t * 4.99))]);
    if (top) tmp.set('#8d8a5c');
    tmp.offsetHSL(0, 0, (r() - 0.5) * 0.04);
    colors.push(tmp.r, tmp.g, tmp.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

function Backdrop() {
  const hills = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2 + (i % 2) * 0.1;
        const r = 150 + (i % 3) * 22;
        const h = 22 + ((i * 17) % 22);
        const w = 38 + ((i * 13) % 30);
        return { x: Math.cos(a) * r, z: Math.sin(a) * r, h, geo: mesaGeometry(i + 1, w, h), rot: i * 1.3 };
      }),
    [],
  );
  const rock = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }), []);
  return (
    <>
      {hills.map((h, i) => (
        <mesh key={i} position={[h.x, h.h / 2 - 2, h.z]} rotation={[0, h.rot, 0]} geometry={h.geo} material={rock} />
      ))}
      {/* low-detail rooftops ring beyond the playable area */}
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const r = 95 + (i % 2) * 8;
        return (
          <mesh key={`r${i}`} position={[Math.cos(a) * r, 4, Math.sin(a) * r]} rotation={[0, -a, 0]} material={mat(['#e8dcc8', '#d9c6a5', '#e3c1b0'][i % 3])}>
            <boxGeometry args={[14, 8 + (i % 3) * 3, 10]} />
          </mesh>
        );
      })}
    </>
  );
}

/** Dry-grass tufts and stones on bare ground (instanced, no colliders). */
function Scatter() {
  const { tufts, stones } = useMemo(() => {
    const r = rng(42);
    const free = (x: number, z: number) =>
      !ROADS.some(([x0, z0, x1, z1]) => x > x0 - 2.5 && x < x1 + 2.5 && z > z0 - 2.5 && z < z1 + 2.5) &&
      !FOOTPRINTS.some((f) => x > f.x0 - 1 && x < f.x1 + 1 && z > f.z0 - 1 && z < f.z1 + 1);
    const tufts: [number, number, number, number][] = [];
    const stones: [number, number, number, number][] = [];
    for (let i = 0; i < 4000 && tufts.length < 900; i++) {
      const x = (r() - 0.5) * 170;
      const z = (r() - 0.5) * 170;
      if (free(x, z)) tufts.push([x, z, 0.5 + r() * 0.9, r() * Math.PI]);
    }
    for (let i = 0; i < 2000 && stones.length < 160; i++) {
      const x = (r() - 0.5) * 170;
      const z = (r() - 0.5) * 170;
      if (free(x, z)) stones.push([x, z, 0.12 + r() * 0.3, r() * Math.PI]);
    }
    return { tufts, stones };
  }, []);
  const tuftRef = useRef<THREE.InstancedMesh>(null);
  const stoneRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    const c = new THREE.Color();
    const shades = ['#9aa05a', '#b3a964', '#7f8f4a', '#c2b077'];
    tufts.forEach(([x, z, s, a], i) => {
      d.position.set(x, 0.12 * s, z);
      d.rotation.set(0, a, 0);
      d.scale.set(s, s, s);
      d.updateMatrix();
      tuftRef.current!.setMatrixAt(i, d.matrix);
      tuftRef.current!.setColorAt(i, c.set(shades[i % shades.length]));
    });
    stones.forEach(([x, z, s, a], i) => {
      d.position.set(x, s * 0.3, z);
      d.rotation.set(a, a * 2, 0);
      d.scale.set(s * 1.3, s * 0.7, s);
      d.updateMatrix();
      stoneRef.current!.setMatrixAt(i, d.matrix);
    });
    tuftRef.current!.instanceMatrix.needsUpdate = true;
    if (tuftRef.current!.instanceColor) tuftRef.current!.instanceColor.needsUpdate = true;
    stoneRef.current!.instanceMatrix.needsUpdate = true;
  }, [tufts, stones]);
  return (
    <>
      <instancedMesh ref={tuftRef} args={[undefined, undefined, tufts.length]} material={flatMat('#ffffff')} receiveShadow>
        <coneGeometry args={[0.22, 0.32, 5]} />
      </instancedMesh>
      <instancedMesh ref={stoneRef} args={[undefined, undefined, stones.length]} material={flatMat('#a99a85')} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
      </instancedMesh>
    </>
  );
}

/** The fixed body holding every static collider (walls, props); used to build the nav grid. */
export const staticWorld: { body: RapierRigidBody | null } = { body: null };

export const World = memo(function World({ age }: { age: number }) {
  return (
    <>
      <RigidBody
        type="fixed"
        colliders={false}
        ref={(b) => {
          staticWorld.body = b;
        }}
      >
        <Ground />
        <Home />
        <Neighbor />
        <Hanout age={age} />
        <Apartments />
        <Square />
        <Campus x0={-38} x1={-10} gateX={-24} name="مدرسة ابن باديس الابتدائية" wall={PALETTE.wallOchre} />
        <Campus x0={-74} x1={-48} gateX={-61} name={age <= 15 ? 'إكمالية الأمير عبد القادر' : 'ثانوية الأمير عبد القادر'} wall="#d7c4a3" />
        <Field />
        <Workshop />
        <PublicBuildings />
        <MosqueBuilding />
        <DarChababBuilding age={age} />
        <Grandpa />
        <DecoBlocks />
        <StreetProps />
        <Districts age={age} />
        <Bounds />
      </RigidBody>
      <Backdrop />
      <Scatter />
    </>
  );
});
