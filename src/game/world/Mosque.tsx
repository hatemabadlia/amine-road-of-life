// Masjid ar-Rahma: an enterable mosque. An ablution area (mida'a) outside,
// a vestibule with shoe racks, and a carpeted prayer hall with prayer-row
// lines, a tiled mihrab, a minbar, columns, a chandelier and arched windows.
// The dome and roof hide while Amine is inside. On Friday around the noon
// prayer, worshippers stand in rows facing the mihrab.
import { useMemo } from 'react';
import * as THREE from 'three';
import { CapsuleCollider, RigidBody } from '@react-three/rapier';
import { chapterOf, useGame } from '../store';
import { Character } from '../player/SkinnedHuman';
import type { Look } from '../../content/characters';
import { glowAtNight, mat } from './materials';
import { Box, Cyl, HideInside, HidingRoof, Sign, WallLine } from './primitives';

const X0 = 29;
const X1 = 41;
const Z0 = -56;
const Z1 = -40;

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat: [number, number]) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 4;
  return t;
}

/** Prayer carpet: deep red with a green row band every 1.2 m and a small repeating motif. */
function carpetTexture() {
  return canvasTexture(
    128,
    128,
    (g) => {
      g.fillStyle = '#8e1b2b';
      g.fillRect(0, 0, 128, 128);
      g.fillStyle = '#1e6b45';
      g.fillRect(0, 0, 128, 16);
      g.fillStyle = '#d9b44a';
      g.fillRect(0, 16, 128, 3);
      for (let x = 0; x < 128; x += 32) {
        // arch motif of each prayer place
        g.strokeStyle = 'rgba(217,180,74,0.7)';
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(x + 6, 120);
        g.lineTo(x + 6, 50);
        g.quadraticCurveTo(x + 16, 26, x + 26, 50);
        g.lineTo(x + 26, 120);
        g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.08)';
        g.fillRect(x + 12, 70, 8, 8);
      }
    },
    [3, 11],
  );
}

/** Zellige tiles: an eight-point star pattern in green, blue and white. */
function zelligeTexture(repeat: [number, number]) {
  return canvasTexture(
    64,
    64,
    (g) => {
      g.fillStyle = '#f4efe2';
      g.fillRect(0, 0, 64, 64);
      g.fillStyle = '#1e6b45';
      g.save();
      g.translate(32, 32);
      for (let i = 0; i < 2; i++) {
        g.rotate(Math.PI / 4);
        g.fillRect(-14, -14, 28, 28);
      }
      g.restore();
      g.fillStyle = '#1f4e8c';
      g.beginPath();
      g.arc(32, 32, 7, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#d9b44a';
      [0, 64].forEach((x) => [0, 64].forEach((y) => g.fillRect(x - 5, y - 5, 10, 10)));
    },
    repeat,
  );
}

/** Arched window: stained glass that glows softly at night. */
function ArchWindow({ p, rotY }: { p: [number, number, number]; rotY: number }) {
  const glass = useMemo(() => glowAtNight(mat('#3a7d6b', { emissive: '#ffd27a', ei: 0, rough: 0.2, side: THREE.DoubleSide }), 0.9), []);
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <mesh material={glass}>
        <planeGeometry args={[0.9, 1.5]} />
      </mesh>
      <mesh position={[0, 0.75, 0]} material={glass}>
        <circleGeometry args={[0.45, 16, 0, Math.PI]} />
      </mesh>
      <mesh position={[0, -0.82, 0.05]} material={mat('#f4efe6')}>
        <boxGeometry args={[1.1, 0.1, 0.12]} />
      </mesh>
    </group>
  );
}

function Chandelier() {
  const bulb = useMemo(() => glowAtNight(mat('#fff3d0', { emissive: '#ffd890', ei: 1.0 }), 2.6, 1.0), []);
  return (
    <group position={[35, 3.3, -48.5]}>
      <mesh material={mat('#c9a227', { metal: 0.7, rough: 0.3 })}>
        <torusGeometry args={[1.1, 0.04, 6, 32]} />
      </mesh>
      <mesh position={[0, 0.5, 0]} material={mat('#c9a227', { metal: 0.7, rough: 0.3 })}>
        <cylinderGeometry args={[0.02, 0.02, 1, 6]} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.1, -0.08, Math.sin(a) * 1.1]} material={bulb}>
            <sphereGeometry args={[0.07, 8, 6]} />
          </mesh>
        );
      })}
    </group>
  );
}

export function MosqueBuilding() {
  const carpet = useMemo(() => carpetTexture(), []);
  const dado = useMemo(() => zelligeTexture([16, 1]), []);
  const dadoSide = useMemo(() => zelligeTexture([12, 1]), []);
  const mihrabTiles = useMemo(() => zelligeTexture([2, 3]), []);
  const W = '#f4f1ea';
  const H = 4.2;
  return (
    <>
      {/* floors: tiled vestibule, carpeted hall */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[35, 0.03, -41]} receiveShadow material={mat('#d8d2c4')}>
        <planeGeometry args={[11.6, 2]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[35, 0.04, -49]} receiveShadow material={mat('#ffffff', { map: carpet, rough: 1 })}>
        <planeGeometry args={[11.6, 13.6]} />
      </mesh>
      {/* walls; the entrance faces the street */}
      <WallLine a={[X0, Z1]} b={[X1, Z1]} c={W} h={H} gaps={[{ at: 35, w: 2.2 }]} doorH={3} />
      <WallLine a={[X0, Z0]} b={[X1, Z0]} c={W} h={H} />
      <WallLine a={[X0, Z0]} b={[X0, Z1]} c={W} h={H} />
      <WallLine a={[X1, Z0]} b={[X1, Z1]} c={W} h={H} />
      {/* vestibule screen with a wide archway into the hall */}
      <WallLine a={[X0, -42.2]} b={[X1, -42.2]} c="#ece6d8" t={0.15} h={H} gaps={[{ at: 35, w: 3 }]} doorH={3.1} />
      {/* zellige dado around the hall */}
      {[
        { p: [35, 0.6, Z0 + 0.14] as [number, number, number], r: 0, w: 11.7, m: dado },
        { p: [X0 + 0.14, 0.6, -49] as [number, number, number], r: Math.PI / 2, w: 13.6, m: dadoSide },
        { p: [X1 - 0.14, 0.6, -49] as [number, number, number], r: -Math.PI / 2, w: 13.6, m: dadoSide },
      ].map((d, i) => (
        <mesh key={i} position={d.p} rotation={[0, d.r, 0]} material={mat('#ffffff', { map: d.m })}>
          <planeGeometry args={[d.w, 1.2]} />
        </mesh>
      ))}
      {/* mihrab: a tiled niche framed by an arch */}
      <group position={[35, 0, Z0 + 0.15]}>
        <mesh position={[0, 1.3, 0.01]} material={mat('#ffffff', { map: mihrabTiles })}>
          <planeGeometry args={[1.5, 2.6]} />
        </mesh>
        <mesh position={[0, 2.6, 0.01]} material={mat('#ffffff', { map: mihrabTiles })}>
          <circleGeometry args={[0.75, 20, 0, Math.PI]} />
        </mesh>
        <mesh position={[0, 1.65, 0.03]} material={mat('#c9a227', { metal: 0.6, rough: 0.35 })}>
          <torusGeometry args={[0.9, 0.06, 6, 24, Math.PI]} />
        </mesh>
        {[-0.9, 0.9].map((x) => (
          <mesh key={x} position={[x, 0.85, 0.03]} material={mat('#c9a227', { metal: 0.6, rough: 0.35 })}>
            <boxGeometry args={[0.12, 1.7, 0.06]} />
          </mesh>
        ))}
      </group>
      {/* minbar: steps up to a small canopy, right of the mihrab */}
      <group>
        {[0, 1, 2, 3, 4].map((i) => (
          <Box key={i} p={[37.6, 0.15 + i * 0.3, -53.2 - i * 0.45]} s={[0.9, 0.3, 0.45]} c="#6b4a2f" col={i === 0} />
        ))}
        <Box p={[37.6, 0.9, -54.6]} s={[0.9, 1.8, 0.9]} c="#5d4037" col />
        <Box p={[37.15, 1.4, -53.9]} s={[0.05, 1.2, 2]} c="#8d6e4a" />
        <Box p={[38.05, 1.4, -53.9]} s={[0.05, 1.2, 2]} c="#8d6e4a" />
        <mesh position={[37.6, 3.0, -54.6]} material={mat('#1e6b45')}>
          <coneGeometry args={[0.65, 0.8, 4]} />
        </mesh>
      </group>
      {/* columns */}
      {[
        [32.2, -46],
        [37.8, -46],
        [32.2, -51.2],
        [37.8, -51.2],
      ].map(([x, z]) => (
        <group key={`${x}${z}`}>
          <Cyl p={[x, H / 2, z]} r={0.24} h={H} c="#efe9dc" col seg={16} />
          <Box p={[x, H - 0.25, z]} s={[0.7, 0.3, 0.7]} c="#e3d9c4" />
        </group>
      ))}
      <Chandelier />
      {[-44.5, -48.5, -52.5].map((z) => (
        <group key={z}>
          <ArchWindow p={[X0 + 0.14, 2.2, z]} rotY={Math.PI / 2} />
          <ArchWindow p={[X1 - 0.14, 2.2, z]} rotY={-Math.PI / 2} />
        </group>
      ))}
      {/* vestibule: shoe racks and a Quran shelf */}
      {[31.6, 38.4].map((x) => (
        <group key={x}>
          <Box p={[x, 0.55, -41.1]} s={[2.6, 1.1, 0.45]} c="#8b5e34" col />
          {[0.25, 0.65].map((y) =>
            Array.from({ length: 5 }, (_, i) => <Box key={`${y}${i}`} p={[x - 1.0 + i * 0.5, y + 0.08, -41.05]} s={[0.26, 0.1, 0.32]} c={['#2b2622', '#5d4037', '#e8e8e8', '#1f3a5f'][(i + (y > 0.5 ? 1 : 0)) % 4]} cast={false} />),
          )}
        </group>
      ))}
      <Box p={[40.4, 1.0, -47]} s={[0.5, 2, 1.6]} c="#6b4a2f" col />
      {[1.3, 1.75].map((y) =>
        Array.from({ length: 6 }, (_, i) => <Box key={`q${y}${i}`} p={[40.25, y, -47.6 + i * 0.24]} s={[0.22, 0.3, 0.18]} c={i % 2 ? '#1e6b45' : '#7b241c'} cast={false} />),
      )}
      {/* roof and dome hide while Amine is inside */}
      <HidingRoof x0={X0} z0={Z0} x1={X1} z1={Z1} y={H} c="#ebe5d8" />
      <HideInside x0={X0} z0={Z0} x1={X1} z1={Z1}>
        <mesh position={[35, H + 0.3, -49]} castShadow material={mat('#e8e3d7')}>
          <cylinderGeometry args={[3.6, 3.6, 0.6, 24]} />
        </mesh>
        <mesh position={[35, H + 0.6, -49]} castShadow material={mat('#e8e3d7')}>
          <sphereGeometry args={[3.4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[35, H + 4.3, -49]} material={mat('#c9a227', { metal: 0.7, rough: 0.3 })}>
          <torusGeometry args={[0.28, 0.05, 6, 16, Math.PI * 1.5]} />
        </mesh>
      </HideInside>
      {/* façade: green trim, arch over the door, name plate */}
      <Box p={[35, H + 0.2, Z1]} s={[12.2, 0.3, 0.3]} c="#1e8449" />
      <mesh position={[35, 3.25, Z1 + 0.14]} material={mat('#1e8449')}>
        <torusGeometry args={[1.2, 0.12, 6, 20, Math.PI]} />
      </mesh>
      <Sign p={[35, 3.85, Z1 + 0.16]} text="مسجد الرحمة" w={3.4} h={0.55} bg="#145a32" />
      {/* minaret on the street corner */}
      <Box p={[42.6, 9, -54.5]} s={[2.4, 18, 2.4]} c={W} col />
      <Box p={[42.6, 15, -54.5]} s={[3, 0.4, 3]} c="#1e8449" />
      {[13, 16.5].map((y) => [-1.21, 1.21].map((dx) => <mesh key={`${y}${dx}`} position={[42.6 + dx, y, -54.5]} rotation={[0, Math.PI / 2, 0]} material={mat('#2b3a46')}><planeGeometry args={[0.6, 1.2]} /></mesh>))}
      <mesh position={[42.6, 18.8, -54.5]} castShadow material={mat('#1e8449')}>
        <coneGeometry args={[1.4, 2.2, 4]} />
      </mesh>
      {/* ablution area (mida'a) on the west side: a roof on posts over a row of taps */}
      <Box p={[24.6, 1.2, -44]} s={[0.25, 2.4, 6]} c="#e9e3d6" col />
      <Box p={[26.6, 2.5, -44]} s={[4.4, 0.15, 6.4]} c="#d9d2c2" />
      {[-41.1, -46.9].map((z) => (
        <Box key={z} p={[28.6, 1.25, z]} s={[0.18, 2.5, 0.18]} c="#bfb6a3" col />
      ))}
      <Box p={[25.1, 0.35, -44]} s={[0.7, 0.12, 5.6]} c="#8fa3ad" />
      {Array.from({ length: 6 }, (_, i) => (
        <group key={i}>
          <Box p={[24.85, 0.95, -46.3 + i * 0.92]} s={[0.25, 0.06, 0.06]} c="#c0c6cc" />
          <Box p={[25.9, 0.18, -46.3 + i * 0.92]} s={[0.35, 0.36, 0.35]} c="#b5ab98" col={false} />
        </group>
      ))}
      <Sign p={[24.75, 1.9, -44]} text="الميضة" w={1.2} h={0.35} rotY={Math.PI / 2} bg="#145a32" />
    </>
  );
}

// worshippers' outfits: white and earth-toned qamis, a few caps
const WORSHIPPERS: Look[] = [
  { skin: '#c99670', shirt: '#f4f1ea', pants: '#e8e3d7', hair: '#222', scale: 1, cap: '#ffffff', shoes: '#c99670' },
  { skin: '#b98a63', shirt: '#d8cfbd', pants: '#c9bfa8', hair: '#ddd', scale: 0.98, beard: true, cap: '#ffffff', shoes: '#b98a63' },
  { skin: '#c48b62', shirt: '#7f8c8d', pants: '#2c3e50', hair: '#111', scale: 1.02, shoes: '#c48b62' },
  { skin: '#d1a07a', shirt: '#f4f1ea', pants: '#f4f1ea', hair: '#222', scale: 0.96, beard: true, shoes: '#d1a07a' },
  { skin: '#bf8a62', shirt: '#5d6d7e', pants: '#212f3d', hair: '#151515', scale: 1.0, cap: '#7b241c', shoes: '#bf8a62' },
  { skin: '#dcae85', shirt: '#2471a3', pants: '#1c2833', hair: '#3b2a20', scale: 0.72, shoes: '#dcae85' },
];

/** On Friday from 12:00 to 13:30, rows of worshippers face the mihrab (a gap stays open for Amine). */
function Worshippers() {
  // only on a Friday chapter, from 12:00 to 13:30 (colliders included)
  const active = useGame((s) => {
    if (!s.game || chapterOf(s.game).event !== 'friday') return false;
    const h = (s.game.time % 1440) / 60;
    return h >= 12 && h < 13.5;
  });
  const people = useMemo(() => {
    const out: { x: number; z: number; look: Look }[] = [];
    [-50.2, -48.8, -47.4].forEach((z, row) => {
      for (let i = 0; i < 9; i++) {
        const x = 30.8 + i * 1.05;
        if (row === 0 && (i === 4 || i === 5)) continue; // Amine's and Baba's places in the first row
        out.push({ x, z, look: WORSHIPPERS[(i + row * 2) % WORSHIPPERS.length] });
      }
    });
    return out;
  }, []);
  if (!active) return null;
  return (
    <group>
      {people.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]} rotation={[0, Math.PI, 0]}>
          <Character look={p.look} />
        </group>
      ))}
      <RigidBody type="fixed" colliders={false}>
        {people.map((p, i) => (
          <CapsuleCollider key={i} args={[0.6, 0.25]} position={[p.x, 0.9, p.z]} />
        ))}
      </RigidBody>
    </group>
  );
}

export function MosqueLife() {
  return <Worshippers />;
}
