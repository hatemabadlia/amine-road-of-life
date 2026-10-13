// Reusable procedural building blocks. Colliders use absolute positions and
// must live inside the single fixed <RigidBody> created by <StaticWorld>.
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, CylinderCollider } from '@react-three/rapier';
import { mat, PALETTE, signTexture } from './materials';
import { livePose } from '../store';

type V3 = [number, number, number];

export function Box({
  p,
  s,
  c = '#ccc',
  m,
  col = false,
  rotY = 0,
  cast = true,
  receive = true,
}: {
  p: V3;
  s: V3;
  c?: string;
  m?: THREE.Material;
  col?: boolean;
  rotY?: number;
  cast?: boolean;
  receive?: boolean;
}) {
  return (
    <>
      <mesh position={p} rotation={[0, rotY, 0]} castShadow={cast} receiveShadow={receive} material={m ?? mat(c)}>
        <boxGeometry args={s} />
      </mesh>
      {col && <CuboidCollider args={[s[0] / 2, s[1] / 2, s[2] / 2]} position={p} rotation={[0, rotY, 0]} />}
    </>
  );
}

export function Cyl({ p, r, h, c = '#ccc', col = false, seg = 12, cast = true }: { p: V3; r: number; h: number; c?: string; col?: boolean; seg?: number; cast?: boolean }) {
  return (
    <>
      <mesh position={p} castShadow={cast} receiveShadow material={mat(c)}>
        <cylinderGeometry args={[r, r, h, seg]} />
      </mesh>
      {col && <CylinderCollider args={[h / 2, r]} position={p} />}
    </>
  );
}

/** A straight wall from a to b (axis-aligned) with door gaps; adds lintels above gaps. */
export function WallLine({
  a,
  b,
  h = 3.2,
  t = 0.25,
  c = PALETTE.wallWhite,
  gaps = [],
  doorH = 2.2,
  y0 = 0,
}: {
  a: [number, number];
  b: [number, number];
  h?: number;
  t?: number;
  c?: string;
  gaps?: { at: number; w: number }[];
  doorH?: number;
  y0?: number;
}) {
  const horizontal = a[1] === b[1];
  const from = horizontal ? Math.min(a[0], b[0]) : Math.min(a[1], b[1]);
  const to = horizontal ? Math.max(a[0], b[0]) : Math.max(a[1], b[1]);
  const fixed = horizontal ? a[1] : a[0];
  const sorted = [...gaps].sort((x, y) => x.at - y.at);
  const segs: [number, number][] = [];
  let cur = from;
  for (const g of sorted) {
    const g0 = g.at - g.w / 2;
    const g1 = g.at + g.w / 2;
    if (g0 > cur) segs.push([cur, g0]);
    cur = Math.max(cur, g1);
  }
  if (cur < to) segs.push([cur, to]);
  const m = mat(c);
  const piece = (s0: number, s1: number, yA: number, yB: number, key: string, col: boolean) => {
    const len = s1 - s0;
    const mid = (s0 + s1) / 2;
    const hh = yB - yA;
    const pos: V3 = horizontal ? [mid, y0 + yA + hh / 2, fixed] : [fixed, y0 + yA + hh / 2, mid];
    const size: V3 = horizontal ? [len, hh, t] : [t, hh, len];
    return <Box key={key} p={pos} s={size} m={m} col={col} />;
  };
  return (
    <>
      {segs.map(([s0, s1], i) => piece(s0, s1, 0, h, `s${i}`, true))}
      {sorted.map((g, i) => (h > doorH ? piece(g.at - g.w / 2, g.at + g.w / 2, doorH, h, `l${i}`, false) : null))}
    </>
  );
}

export function Sign({ p, text, w = 3, h = 0.75, rotY = 0, bg, fg }: { p: V3; text: string; w?: number; h?: number; rotY?: number; bg?: string; fg?: string }) {
  const tex = useMemo(() => signTexture(text, bg, fg, 512, Math.round((512 * h) / w)), [text, bg, fg, w, h]);
  return (
    <mesh position={p} rotation={[0, rotY, 0]}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={tex} roughness={0.6} />
    </mesh>
  );
}

/** Roof slab that hides itself when the player is inside the footprint. */
export function HidingRoof({ x0, z0, x1, z1, y, c = PALETTE.roof, parapet = true }: { x0: number; z0: number; x1: number; z1: number; y: number; c?: string; parapet?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const inside = livePose.x > x0 && livePose.x < x1 && livePose.z > z0 && livePose.z < z1 && livePose.y < y;
    ref.current.visible = !inside;
  });
  const w = x1 - x0;
  const d = z1 - z0;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  return (
    <group ref={ref}>
      <Box p={[cx, y + 0.12, cz]} s={[w + 0.3, 0.25, d + 0.3]} c={c} />
      {parapet && (
        <>
          <Box p={[cx, y + 0.55, z0 - 0.05]} s={[w + 0.3, 0.6, 0.2]} c={c} />
          <Box p={[cx, y + 0.55, z1 + 0.05]} s={[w + 0.3, 0.6, 0.2]} c={c} />
          <Box p={[x0 - 0.05, y + 0.55, cz]} s={[0.2, 0.6, d + 0.3]} c={c} />
          <Box p={[x1 + 0.05, y + 0.55, cz]} s={[0.2, 0.6, d + 0.3]} c={c} />
        </>
      )}
    </group>
  );
}

/** Decorative window with blue shutters, placed on a wall face. */
export function Window({ p, rotY = 0, w = 1.1, h = 1.3 }: { p: V3; rotY?: number; w?: number; h?: number }) {
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <mesh material={mat('#2b3a46', { rough: 0.3 })}>
        <planeGeometry args={[w, h]} />
      </mesh>
      <mesh position={[-w / 2 - 0.22, 0, 0.01]} material={mat(PALETTE.shutterBlue)}>
        <planeGeometry args={[0.42, h]} />
      </mesh>
      <mesh position={[w / 2 + 0.22, 0, 0.01]} material={mat(PALETTE.shutterBlue)}>
        <planeGeometry args={[0.42, h]} />
      </mesh>
      <mesh position={[0, -h / 2 - 0.06, 0.04]} material={mat('#f4efe6')}>
        <boxGeometry args={[w + 0.3, 0.1, 0.12]} />
      </mesh>
    </group>
  );
}

export function Door({ p, rotY = 0, w = 1.2, c = PALETTE.doorGreen, open = 0.9 }: { p: V3; rotY?: number; w?: number; c?: string; open?: number }) {
  // hinged door leaf swung open (decorative)
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <group position={[-w / 2, 0, 0]} rotation={[0, open, 0]}>
        <mesh position={[w / 2, 1.05, 0]} castShadow material={mat(c, { rough: 0.6 })}>
          <boxGeometry args={[w, 2.1, 0.06]} />
        </mesh>
      </group>
    </group>
  );
}

export function Palm({ p }: { p: [number, number] }) {
  const fronds = useMemo(() => Array.from({ length: 7 }, (_, i) => (i / 7) * Math.PI * 2), []);
  return (
    <>
    <group position={[p[0], 0, p[1]]}>
      <mesh position={[0, 2.6, 0]} castShadow material={mat('#8a6a45')}>
        <cylinderGeometry args={[0.16, 0.26, 5.2, 7]} />
      </mesh>
      {fronds.map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 1.1, 5.1, Math.sin(a) * 1.1]} rotation={[Math.sin(a) * 0.6, -a, Math.cos(a) * 0.6 - 0.2]} castShadow material={mat('#4f7d36')}>
          <boxGeometry args={[2.4, 0.06, 0.5]} />
        </mesh>
      ))}
    </group>
    <CylinderCollider args={[2.6, 0.3]} position={[p[0], 2.6, p[1]]} />
    </>
  );
}

export function Tree({ p, s = 1, olive = false }: { p: [number, number]; s?: number; olive?: boolean }) {
  return (
    <>
    <group position={[p[0], 0, p[1]]} scale={s}>
      <mesh position={[0, 1.1, 0]} castShadow material={mat('#6b4f35')}>
        <cylinderGeometry args={[0.14, 0.22, 2.2, 6]} />
      </mesh>
      <mesh position={[0, 2.7, 0]} castShadow material={mat(olive ? '#7b8f5a' : '#4d7a3a')}>
        <icosahedronGeometry args={[1.4, 0]} />
      </mesh>
      <mesh position={[0.6, 2.3, 0.3]} castShadow material={mat(olive ? '#8a9c66' : '#5a8a45')}>
        <icosahedronGeometry args={[0.9, 0]} />
      </mesh>
    </group>
    <CylinderCollider args={[1.1 * s, 0.25 * s]} position={[p[0], 1.1 * s, p[1]]} />
    </>
  );
}

export function Lamp({ p }: { p: [number, number] }) {
  return (
    <group>
      <Cyl p={[p[0], 2.2, p[1]]} r={0.07} h={4.4} c="#4a4f55" col />
      <mesh position={[p[0], 4.45, p[1]]} material={mat('#fff6d8', { emissive: '#ffd27a', ei: 0.6 })}>
        <sphereGeometry args={[0.22, 8, 6]} />
      </mesh>
    </group>
  );
}

export function Car({ p, rotY = 0, c = '#b03a2e' }: { p: [number, number]; rotY?: number; c?: string }) {
  return (
    <group>
      <Box p={[p[0], 0.55, p[1]]} s={[4, 0.7, 1.8]} c={c} rotY={rotY} col />
      <Box p={[p[0] - Math.cos(rotY) * 0.2, 1.15, p[1] + Math.sin(rotY) * 0.2]} s={[2.2, 0.55, 1.6]} m={mat('#3b4b5a', { rough: 0.3 })} rotY={rotY} />
      {[-1.3, 1.3].map((dx) =>
        [-0.85, 0.85].map((dz) => (
          <mesh
            key={`${dx}${dz}`}
            position={[p[0] + Math.cos(rotY) * dx + Math.sin(rotY) * dz, 0.32, p[1] - Math.sin(rotY) * dx + Math.cos(rotY) * dz]}
            rotation={[Math.PI / 2, 0, rotY]}
            material={mat('#1b1b1b')}
          >
            <cylinderGeometry args={[0.32, 0.32, 0.25, 10]} />
          </mesh>
        )),
      )}
    </group>
  );
}

export function Bench({ p, rotY = 0 }: { p: [number, number]; rotY?: number }) {
  return (
    <group>
      <Box p={[p[0], 0.45, p[1]]} s={[1.8, 0.12, 0.5]} c={PALETTE.wood} rotY={rotY} col />
      <Box p={[p[0], 0.22, p[1]]} s={[1.6, 0.44, 0.1]} c="#555" rotY={rotY} />
    </group>
  );
}

/** Rooftop clutter typical of Algerian houses: water tank + satellite dish. */
export function RoofKit({ p, y }: { p: [number, number]; y: number }) {
  return (
    <group position={[p[0], y, p[1]]}>
      <mesh position={[0, 0.6, 0]} castShadow material={mat('#e9eef2')}>
        <cylinderGeometry args={[0.45, 0.45, 1.1, 12]} />
      </mesh>
      <mesh position={[1.4, 0.7, 0.4]} rotation={[-0.6, 0.4, 0]} castShadow material={mat('#dcdcdc', { metal: 0.3 })}>
        <sphereGeometry args={[0.45, 12, 6, 0, Math.PI * 2, 0, Math.PI / 3]} />
      </mesh>
    </group>
  );
}

export function Flag({ p, h = 6 }: { p: [number, number]; h?: number }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 120;
    c.height = 80;
    const g = c.getContext('2d')!;
    g.fillStyle = '#006233';
    g.fillRect(0, 0, 60, 80);
    g.fillStyle = '#ffffff';
    g.fillRect(60, 0, 60, 80);
    g.fillStyle = '#d21034';
    g.beginPath();
    g.arc(60, 40, 20, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(66, 40, 16, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#d21034';
    g.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
      g.lineTo(72 + Math.cos(a) * 8, 40 + Math.sin(a) * 8);
    }
    g.fill();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const cloth = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (cloth.current) cloth.current.rotation.y = Math.sin(clock.elapsedTime * 2) * 0.12;
  });
  return (
    <group>
      <Cyl p={[p[0], h / 2, p[1]]} r={0.05} h={h} c="#cfd3d6" col />
      <mesh ref={cloth} position={[p[0] + 0.75, h - 0.55, p[1]]}>
        <planeGeometry args={[1.5, 1]} />
        <meshStandardMaterial map={tex} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
