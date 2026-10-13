// Reusable procedural building blocks. Colliders use absolute positions and
// must live inside the single fixed <RigidBody> created by <StaticWorld>.
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, CylinderCollider } from '@react-three/rapier';
import { fadeAtNight, flatMat, glowAtNight, mat, PALETTE, radialTexture, signTexture, wallMat } from './materials';
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
  const m = wallMat(c);
  const lintel = wallMat(c, false);
  const piece = (s0: number, s1: number, yA: number, yB: number, key: string, col: boolean) => {
    const len = s1 - s0;
    const mid = (s0 + s1) / 2;
    const hh = yB - yA;
    const pos: V3 = horizontal ? [mid, y0 + yA + hh / 2, fixed] : [fixed, y0 + yA + hh / 2, mid];
    const size: V3 = horizontal ? [len, hh, t] : [t, hh, len];
    return <Box key={key} p={pos} s={size} m={col ? m : lintel} col={col} />;
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

// glass that stays dark by day and is warmly lit at night (some windows only)
const glassDark = () => mat('#2b3a46', { rough: 0.25, metal: 0.2 });
const glassLit = () => glowAtNight(mat('#2b3a46', { rough: 0.25, metal: 0.2, emissive: '#ffc37a', ei: 0 }), 1.1);

/** Decorative window with blue shutters, placed on a wall face. */
export function Window({ p, rotY = 0, w = 1.1, h = 1.3 }: { p: V3; rotY?: number; w?: number; h?: number }) {
  const lit = Math.abs(Math.round(p[0] * 3 + p[2] * 5)) % 3 === 0;
  const shutter = mat(PALETTE.shutterBlue, { rough: 0.7 });
  const frame = mat('#f4efe6');
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <mesh material={lit ? glassLit() : glassDark()}>
        <planeGeometry args={[w, h]} />
      </mesh>
      {/* frame + mullion */}
      <mesh position={[0, 0, 0.02]} material={frame}>
        <boxGeometry args={[0.05, h, 0.03]} />
      </mesh>
      <mesh position={[0, h / 2 + 0.04, 0.03]} material={frame}>
        <boxGeometry args={[w + 0.12, 0.08, 0.06]} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (w / 2 + 0.22), 0, 0.03]} rotation={[0, side * -0.18, 0]}>
          <mesh material={shutter}>
            <boxGeometry args={[0.42, h, 0.04]} />
          </mesh>
          {Array.from({ length: Math.floor(h / 0.14) }, (_, i) => (
            <mesh key={i} position={[0, -h / 2 + 0.1 + i * 0.14, 0.025]} material={mat('#255b84')}>
              <boxGeometry args={[0.38, 0.03, 0.01]} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, -h / 2 - 0.06, 0.06]} castShadow material={frame}>
        <boxGeometry args={[w + 0.3, 0.1, 0.16]} />
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

const PALM_FRONDS = Array.from({ length: 9 }, (_, i) => ({ a: (i / 9) * Math.PI * 2 + (i % 2) * 0.2, droop: 0.35 + (i % 3) * 0.18, len: 1.9 + (i % 4) * 0.25 }));

export function Palm({ p }: { p: [number, number] }) {
  const lean = useMemo(() => ((p[0] * 7 + p[1] * 3) % 5) * 0.025, [p]);
  const trunk = mat('#8a6a45', { rough: 1 });
  const ring = mat('#6f5435', { rough: 1 });
  const leaf = flatMat('#4f8a3a');
  const leafDark = flatMat('#3d7030');
  return (
    <>
      <group position={[p[0], 0, p[1]]} rotation={[lean, 0, lean * 0.6]}>
        {Array.from({ length: 6 }, (_, i) => (
          <group key={i}>
            <mesh position={[0, 0.45 + i * 0.86, 0]} castShadow material={trunk}>
              <cylinderGeometry args={[0.17 - i * 0.008, 0.21 - i * 0.008, 0.9, 8]} />
            </mesh>
            <mesh position={[0, 0.88 + i * 0.86, 0]} material={ring}>
              <cylinderGeometry args={[0.2 - i * 0.008, 0.2 - i * 0.008, 0.07, 8]} />
            </mesh>
          </group>
        ))}
        <group position={[0, 5.25, 0]}>
          {/* dates */}
          {[0, 2.1, 4.2].map((a) => (
            <mesh key={a} position={[Math.cos(a) * 0.25, -0.25, Math.sin(a) * 0.25]} material={flatMat('#b9772f')}>
              <dodecahedronGeometry args={[0.16, 0]} />
            </mesh>
          ))}
          {PALM_FRONDS.map((f, i) => (
            <group key={i} rotation={[0, -f.a, 0]}>
              {/* frond: inner rising half, then drooping outer half */}
              <mesh position={[f.len * 0.25, 0.12, 0]} rotation={[0, 0, 0.25]} castShadow material={i % 2 ? leaf : leafDark}>
                <boxGeometry args={[f.len * 0.55, 0.04, 0.55]} />
              </mesh>
              <mesh position={[f.len * 0.72, -0.08 - f.droop * 0.4, 0]} rotation={[0, 0, -f.droop]} castShadow material={i % 2 ? leaf : leafDark}>
                <boxGeometry args={[f.len * 0.5, 0.04, 0.42]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
      <CylinderCollider args={[2.6, 0.3]} position={[p[0], 2.6, p[1]]} />
    </>
  );
}

export function Tree({ p, s = 1, olive = false }: { p: [number, number]; s?: number; olive?: boolean }) {
  const seed = Math.abs(Math.round(p[0] * 13 + p[1] * 7));
  const blobs = useMemo(() => {
    const tones = olive ? ['#7f9460', '#8fa26e', '#6f8452'] : ['#4f7f3a', '#5f9246', '#44723a'];
    const r = (k: number) => ((Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;
    return Array.from({ length: olive ? 6 : 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2 + r(i) * 0.8;
      const d = i === 0 ? 0 : 0.7 + r(i + 9) * 0.35;
      return { x: Math.cos(a) * d, y: (olive ? 2.1 : 2.7) + (i === 0 ? 0.35 : r(i + 3) * 0.6 - 0.1), z: Math.sin(a) * d, s: (i === 0 ? 1.15 : 0.75 + r(i + 5) * 0.3) * (olive ? 0.9 : 1), c: tones[i % 3] };
    });
  }, [seed, olive]);
  return (
    <>
      <group position={[p[0], 0, p[1]]} scale={s}>
        <mesh position={[0, 1.0, 0]} castShadow material={flatMat(olive ? '#6d5a48' : '#6b4f35')} rotation={[0, 0, olive ? 0.12 : 0]}>
          <cylinderGeometry args={[0.12, olive ? 0.3 : 0.22, 2.1, 7]} />
        </mesh>
        <mesh position={[0.35, 1.8, 0]} rotation={[0, 0, -0.8]} castShadow material={flatMat('#6b4f35')}>
          <cylinderGeometry args={[0.05, 0.08, 0.9, 5]} />
        </mesh>
        {blobs.map((b, i) => (
          <mesh key={i} position={[b.x, b.y, b.z]} scale={[b.s, b.s * 0.85, b.s]} castShadow receiveShadow material={flatMat(b.c)}>
            <icosahedronGeometry args={[1, 1]} />
          </mesh>
        ))}
      </group>
      <CylinderCollider args={[1.1 * s, 0.25 * s]} position={[p[0], 1.1 * s, p[1]]} />
    </>
  );
}

/** Street lamp with a curved arm; casts a warm pool of light at night. */
export function Lamp({ p, arm = [0, 1] }: { p: [number, number]; arm?: [number, number] }) {
  const pool = useMemo(() => fadeAtNight(new THREE.MeshBasicMaterial({ map: radialTexture('rgba(255,200,120,1)', 'rgba(255,170,80,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }), 0.55), []);
  const halo = useMemo(() => fadeAtNight(new THREE.SpriteMaterial({ map: radialTexture('rgba(255,225,160,1)', 'rgba(255,200,120,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }), 0.7), []);
  const hx = p[0] + arm[0] * 1.1;
  const hz = p[1] + arm[1] * 1.1;
  const pole = mat('#4a4f55', { rough: 0.6, metal: 0.4 });
  return (
    <group>
      <Cyl p={[p[0], 2.2, p[1]]} r={0.07} h={4.4} c="#4a4f55" col />
      <mesh position={[p[0], 0.25, p[1]]} material={pole}>
        <cylinderGeometry args={[0.12, 0.15, 0.5, 8]} />
      </mesh>
      <mesh position={[(p[0] + hx) / 2, 4.45, (p[1] + hz) / 2]} rotation={[arm[1] * Math.PI / 2, 0, -arm[0] * Math.PI / 2]} material={pole}>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 6]} />
      </mesh>
      <mesh position={[hx, 4.38, hz]} material={pole}>
        <boxGeometry args={[0.5, 0.12, 0.3]} />
      </mesh>
      <mesh position={[hx, 4.3, hz]} material={mat('#fff6d8', { emissive: '#ffd27a', ei: 0.6 })}>
        <boxGeometry args={[0.4, 0.05, 0.22]} />
      </mesh>
      <sprite position={[hx, 4.25, hz]} scale={[1.6, 1.6, 1]} material={halo} />
      <mesh position={[hx, 0.05, hz]} rotation={[-Math.PI / 2, 0, 0]} material={pool} renderOrder={2}>
        <planeGeometry args={[9, 9]} />
      </mesh>
    </group>
  );
}

export function Car({ p, rotY = 0, c = '#b03a2e' }: { p: [number, number]; rotY?: number; c?: string }) {
  const paint = mat(c, { rough: 0.35, metal: 0.3 });
  const glass = mat('#2a3946', { rough: 0.1, metal: 0.5 });
  const dark = mat('#1b1b1b', { rough: 0.8 });
  const chrome = mat('#c9cdd2', { rough: 0.3, metal: 0.8 });
  const head = glowAtNight(mat('#fff8e0', { emissive: '#fff1c4', ei: 0.1 }), 0.1);
  const tail = glowAtNight(mat('#a3141c', { emissive: '#ff2a2a', ei: 0.1 }), 0.8);
  return (
    <>
      <group position={[p[0], 0, p[1]]} rotation={[0, rotY, 0]}>
        {/* lower body, bonnet, boot */}
        <mesh position={[0, 0.58, 0]} castShadow receiveShadow material={paint}>
          <boxGeometry args={[4, 0.62, 1.78]} />
        </mesh>
        {/* cabin with glass and pillars */}
        <mesh position={[-0.2, 1.15, 0]} castShadow material={glass}>
          <boxGeometry args={[2.1, 0.55, 1.6]} />
        </mesh>
        <mesh position={[-0.2, 1.44, 0]} castShadow material={paint}>
          <boxGeometry args={[2.0, 0.06, 1.62]} />
        </mesh>
        {[-1.2, 0.8].map((x) => (
          <mesh key={x} position={[x, 1.15, 0]} material={paint}>
            <boxGeometry args={[0.08, 0.56, 1.64]} />
          </mesh>
        ))}
        {/* bumpers, lights, plate */}
        <mesh position={[2.02, 0.42, 0]} material={chrome}>
          <boxGeometry args={[0.08, 0.16, 1.7]} />
        </mesh>
        <mesh position={[-2.02, 0.42, 0]} material={chrome}>
          <boxGeometry args={[0.08, 0.16, 1.7]} />
        </mesh>
        {[-0.62, 0.62].map((z) => (
          <group key={z}>
            <mesh position={[2.01, 0.66, z]} material={head}>
              <boxGeometry args={[0.04, 0.16, 0.36]} />
            </mesh>
            <mesh position={[-2.01, 0.66, z]} material={tail}>
              <boxGeometry args={[0.04, 0.14, 0.34]} />
            </mesh>
          </group>
        ))}
        <mesh position={[-2.03, 0.5, 0]} material={mat('#f2f2f2')}>
          <boxGeometry args={[0.02, 0.12, 0.5]} />
        </mesh>
        {/* wheels with hubs */}
        {[-1.3, 1.3].map((dx) =>
          [-0.86, 0.86].map((dz) => (
            <group key={`${dx}${dz}`} position={[dx, 0.32, dz]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh castShadow material={dark}>
                <cylinderGeometry args={[0.32, 0.32, 0.24, 14]} />
              </mesh>
              <mesh position={[0, Math.sign(dz) * 0.125, 0]} material={chrome}>
                <cylinderGeometry args={[0.16, 0.16, 0.02, 10]} />
              </mesh>
            </group>
          )),
        )}
      </group>
      <CuboidCollider args={[2, 0.7, 0.9]} position={[p[0], 0.7, p[1]]} rotation={[0, rotY, 0]} />
    </>
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
