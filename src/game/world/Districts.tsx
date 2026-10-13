// Places across town: the cybercafé, the hospital, the exam centre, the
// municipal stadium, and a building site that grows into a finished block as
// Amine grows up. Colliders live in the shared static body (see World.tsx).
import { useMemo } from 'react';
import * as THREE from 'three';
import { CuboidCollider } from '@react-three/rapier';
import { glowAtNight, groundTexture, mat, PALETTE } from './materials';
import { Box, Cyl, Door, Flag, HideInside, HidingRoof, Lamp, Palm, RoofKit, Sign, Tree, WallLine, Window } from './primitives';
import { Block } from './World';

const screenMat = () => mat('#7fc8ff', { emissive: '#5ab0ff', ei: 1.4, rough: 0.3 });

// ---------------------------------------------------------------------------
// Cybercafé (x 8..20, z -66..-57), door on the west wall facing the cross street
// ---------------------------------------------------------------------------
function Cyber() {
  const W = '#d7d2c8';
  const neon = useMemo(() => glowAtNight(mat('#1b1036', { emissive: '#ff3df2', ei: 0.4 }), 2.2, 0.4), []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, 0.03, -61.5]} receiveShadow material={mat('#3a3f4a')}>
        <planeGeometry args={[12, 9]} />
      </mesh>
      <WallLine a={[8, -66]} b={[20, -66]} c={W} />
      <WallLine a={[8, -57]} b={[20, -57]} c={W} />
      <WallLine a={[8, -66]} b={[8, -57]} c={W} gaps={[{ at: -61.5, w: 1.6 }]} />
      <WallLine a={[20, -66]} b={[20, -57]} c={W} />
      <HidingRoof x0={8} z0={-66} x1={20} z1={-57} y={3.2} />
      <RoofKit p={[17, -60]} y={3.45} />
      <Door p={[8, 0, -61.5]} rotY={-Math.PI / 2} w={1.6} c="#2c3e50" />
      <Window p={[7.86, 1.7, -64.2]} rotY={-Math.PI / 2} />
      <Window p={[7.86, 1.7, -58.8]} rotY={-Math.PI / 2} />
      {/* neon sign */}
      <mesh position={[7.84, 3.55, -61.5]} rotation={[0, -Math.PI / 2, 0]} material={neon}>
        <planeGeometry args={[4.2, 0.7]} />
      </mesh>
      <Sign p={[7.82, 3.55, -61.5]} text="CYBER النجمة" w={3.8} h={0.55} rotY={-Math.PI / 2} bg="#1b1036" fg="#ff9cf5" />
      {/* counter by the door */}
      <Box p={[10, 0.5, -65]} s={[1.6, 1, 0.7]} c="#4a3b2c" col />
      <Box p={[10, 1.06, -65]} s={[0.4, 0.3, 0.05]} m={screenMat()} />
      {/* two rows of PCs with glowing screens */}
      {[-64, -59].map((z) =>
        [12.2, 14.2, 16.2, 18.2].map((x) => (
          <group key={`${x}${z}`}>
            <Box p={[x, 0.38, z]} s={[1.6, 0.76, 0.7]} c="#2b2b2b" col />
            <Box p={[x, 0.98, z + (z < -61 ? -0.18 : 0.18)]} s={[0.55, 0.36, 0.04]} c="#111" />
            <mesh position={[x, 0.98, z + (z < -61 ? -0.155 : 0.155)]} rotation={[0, z < -61 ? 0 : Math.PI, 0]} material={screenMat()}>
              <planeGeometry args={[0.5, 0.31]} />
            </mesh>
            <Box p={[x, 0.79, z]} s={[0.45, 0.02, 0.15]} c="#333" />
            <Box p={[x, 0.25, z + (z < -61 ? 0.75 : -0.75)]} s={[0.45, 0.5, 0.45]} c="#8b1e1e" />
          </group>
        )),
      )}
      {/* game posters */}
      {[11, 14, 17].map((x, i) => (
        <mesh key={x} position={[x, 2.1, -56.88]} rotation={[0, Math.PI, 0]} material={mat(['#e74c3c', '#2ecc71', '#f39c12'][i])}>
          <planeGeometry args={[0.8, 1.1]} />
        </mesh>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Hospital (x -76..-52, z 52..74): lobby + ward, upper floors outside
// ---------------------------------------------------------------------------
function Hospital() {
  const W = '#eef1f3';
  const cross = useMemo(() => glowAtNight(mat('#d21034', { emissive: '#ff2040', ei: 0.3 }), 2, 0.3), []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-64, 0.03, 63]} receiveShadow material={mat('#e6e8ea')}>
        <planeGeometry args={[24, 22]} />
      </mesh>
      <WallLine a={[-76, 52]} b={[-52, 52]} c={W} gaps={[{ at: -64, w: 2.4 }]} h={3.4} />
      <WallLine a={[-76, 74]} b={[-52, 74]} c={W} h={3.4} />
      <WallLine a={[-76, 52]} b={[-76, 74]} c={W} h={3.4} />
      <WallLine a={[-52, 52]} b={[-52, 74]} c={W} h={3.4} />
      {/* lobby | ward partition */}
      <WallLine a={[-76, 62]} b={[-52, 62]} c="#dfe7ec" t={0.18} gaps={[{ at: -60, w: 1.6 }]} h={3.4} />
      <HidingRoof x0={-76} z0={52} x1={-52} z1={74} y={3.4} c="#d9dde0" />
      <HideInside x0={-76} z0={52} x1={-52} z1={74}>
        {/* two upper floors with windows */}
        <mesh position={[-64, 6.6, 63]} castShadow receiveShadow material={mat(W)}>
          <boxGeometry args={[24.2, 6, 22.2]} />
        </mesh>
        {[-72, -68, -60, -56].map((x) => [5, 8].map((y) => <Window key={`${x}${y}`} p={[x, y, 51.85]} rotY={Math.PI} w={1.3} h={1.2} />))}
      </HideInside>
      {/* entrance canopy, red crescent sign */}
      <Box p={[-64, 3.0, 50.6]} s={[5, 0.15, 2.8]} c="#c9d3da" />
      <Box p={[-66.3, 1.5, 49.5]} s={[0.15, 3, 0.15]} c="#9aa5ad" col />
      <Box p={[-61.7, 1.5, 49.5]} s={[0.15, 3, 0.15]} c="#9aa5ad" col />
      <Sign p={[-64, 3.6, 51.8]} text="المؤسسة العمومية الاستشفائية" w={8} h={0.9} rotY={Math.PI} bg="#1f6f8b" />
      <mesh position={[-70, 3.6, 51.8]} rotation={[0, Math.PI, 0]} material={cross}>
        <ringGeometry args={[0.32, 0.55, 24, 1, 0.9, Math.PI * 1.5]} />
      </mesh>
      {/* lobby: reception, waiting chairs, plants */}
      <Box p={[-64, 0.55, 56.2]} s={[3.2, 1.1, 0.8]} c="#c8d6df" col />
      <Box p={[-64, 1.12, 56.2]} s={[3.3, 0.05, 0.9]} c="#f4f6f7" />
      {[-72, -70.8, -69.6, -58.4, -57.2, -56].map((x) => (
        <Box key={x} p={[x, 0.25, 57.5]} s={[0.9, 0.5, 0.8]} c="#2e86c1" col />
      ))}
      <Cyl p={[-74.8, 0.35, 53.2]} r={0.3} h={0.7} c="#a04000" />
      <mesh position={[-74.8, 1.1, 53.2]} castShadow material={mat('#3f7a33')}>
        <icosahedronGeometry args={[0.55, 0]} />
      </mesh>
      {/* ward: beds with curtains, IV stands */}
      {[-70, -64.5, -58.5].map((x) => (
        <group key={x}>
          <Box p={[x, 0.32, 71.5]} s={[1.1, 0.64, 2.1]} c="#dfe4e8" col />
          <Box p={[x, 0.7, 71.6]} s={[1.0, 0.12, 1.9]} c="#ffffff" />
          <Box p={[x, 0.82, 72.3]} s={[0.7, 0.12, 0.4]} c="#d6eaf8" />
          <Box p={[x + 0.9, 1.1, 72]} s={[0.04, 2.2, 0.04]} c="#9aa5ad" />
          <Box p={[x + 0.9, 2.05, 72]} s={[0.18, 0.28, 0.08]} m={mat('#cfe8ff', { transparent: true, opacity: 0.7 })} />
          <mesh position={[x - 0.9, 1.3, 70.5]} material={mat('#9fd3c7', { side: THREE.DoubleSide })}>
            <planeGeometry args={[0.02, 2.4]} />
          </mesh>
          <mesh position={[x - 0.95, 1.3, 70.5]} rotation={[0, Math.PI / 2, 0]} material={mat('#9fd3c7', { side: THREE.DoubleSide, transparent: true, opacity: 0.85 })}>
            <planeGeometry args={[2.2, 2.4]} />
          </mesh>
        </group>
      ))}
      {[-73, -67, -61, -55].map((x) => (
        <Window key={x} p={[x, 1.8, 74.14]} />
      ))}
      {/* ambulance at the door */}
      <group position={[-56, 0, 49.4]}>
        <Box p={[0, 1.1, 0]} s={[4.4, 1.9, 2]} c="#f7f9f9" col />
        <Box p={[0, 1.1, 1.01]} s={[4.4, 0.25, 0.02]} c="#d21034" />
        <Box p={[0, 1.1, -1.01]} s={[4.4, 0.25, 0.02]} c="#d21034" />
        <Box p={[1.8, 1.55, 0]} s={[0.7, 0.7, 1.9]} m={mat('#2a3946', { rough: 0.1 })} />
        <Box p={[0.2, 2.12, 0]} s={[0.5, 0.14, 0.4]} m={glowAtNight(mat('#2b6cff', { emissive: '#3a7bff', ei: 0.6 }), 2.5, 0.6)} />
        {[-1.4, 1.4].map((x) => [-1, 1].map((z) => <Cyl key={`${x}${z}`} p={[x, 0.33, z * 0.95]} r={0.33} h={0.1} c="#1b1b1b" />))}
      </group>
      <Palm p={[-74, 49]} />
      <Palm p={[-54, 50]} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Exam centre (x 65..78, z 10..25), door facing the main street
// ---------------------------------------------------------------------------
function ExamCentre({ age }: { age: number }) {
  const W = '#e9dcc3';
  const clockFace = useMemo(() => mat('#ffffff'), []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[71.5, 0.03, 17.5]} receiveShadow material={mat('#cfc3ad')}>
        <planeGeometry args={[13, 15]} />
      </mesh>
      <WallLine a={[65, 10]} b={[78, 10]} c={W} gaps={[{ at: 71.5, w: 2 }]} h={3.6} />
      <WallLine a={[65, 25]} b={[78, 25]} c={W} h={3.6} />
      <WallLine a={[65, 10]} b={[65, 25]} c={W} h={3.6} />
      <WallLine a={[78, 10]} b={[78, 25]} c={W} h={3.6} />
      <HidingRoof x0={65} z0={10} x1={78} z1={25} y={3.6} c="#cdbb9b" />
      <Door p={[71.5, 0, 10]} rotY={Math.PI} w={2} c="#6b4a2f" />
      {[67.5, 75.5].map((x) => (
        <Window key={x} p={[x, 1.9, 9.86]} rotY={Math.PI} />
      ))}
      {[13, 17, 21].map((z) => (
        <Window key={z} p={[78.14, 1.9, z]} rotY={Math.PI / 2} />
      ))}
      <Sign p={[71.5, 4.2, 9.8]} text={age >= 17 ? 'مركز إجراء امتحان البكالوريا' : 'مركز الامتحانات الرسمية'} w={7} h={0.85} rotY={Math.PI} bg="#14532d" />
      <Flag p={[66.2, 8.6]} h={6} />
      {/* rows of single desks, each with a paper */}
      {[67.5, 69.5, 71.5, 73.5, 75.5].map((x) =>
        [14, 16.6, 19.2, 21.8].map((z) => (
          <group key={`${x}${z}`}>
            <Box p={[x, 0.37, z]} s={[0.9, 0.74, 0.6]} c="#8b5e34" col />
            <Box p={[x, 0.75, z]} s={[0.3, 0.01, 0.4]} c="#fafafa" cast={false} />
            <Box p={[x, 0.24, z + 0.55]} s={[0.42, 0.48, 0.42]} c="#555" />
          </group>
        )),
      )}
      {/* invigilator's desk, board and wall clock */}
      <Box p={[71.5, 0.4, 23.6]} s={[2, 0.8, 0.8]} c="#5d4037" col />
      <mesh position={[71.5, 2.0, 24.86]} rotation={[0, Math.PI, 0]} material={mat('#1e3d2f', { rough: 0.5 })}>
        <planeGeometry args={[4, 1.4]} />
      </mesh>
      <Sign p={[71.5, 2.2, 24.84]} text="ممنوع استعمال الهاتف" w={2.8} h={0.32} rotY={Math.PI} bg="#1e3d2f" />
      <mesh position={[75.5, 2.6, 24.86]} rotation={[0, Math.PI, 0]} material={clockFace}>
        <circleGeometry args={[0.3, 24]} />
      </mesh>
      <Box p={[75.5, 2.66, 24.82]} s={[0.03, 0.2, 0.01]} c="#111" />
      <Tree p={[64, 7.5]} s={0.8} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Municipal stadium (x 46..78, z 51..77)
// ---------------------------------------------------------------------------
function Stadium() {
  const pitch = useMemo(() => groundTexture('pitch', [4, 1]), []);
  const white = mat('#f4f4f4');
  const floodlight = useMemo(() => glowAtNight(mat('#fffbe8', { emissive: '#fff6d0', ei: 0.2 }), 3, 0.2), []);
  const line = (p: [number, number], s: [number, number], k: string) => (
    <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[p[0], 0.045, p[1]]} material={white}>
      <planeGeometry args={s} />
    </mesh>
  );
  const goal = (x: number, dir: number) => (
    <group key={x}>
      <Cyl p={[x, 1.2, 61.3]} r={0.08} h={2.4} c="#fff" col />
      <Cyl p={[x, 1.2, 66.7]} r={0.08} h={2.4} c="#fff" col />
      <Box p={[x, 2.4, 64]} s={[0.14, 0.14, 5.5]} c="#fff" />
      <mesh position={[x + dir * 0.9, 1.2, 64]} material={mat('#ffffff', { transparent: true, opacity: 0.25, side: THREE.DoubleSide })}>
        <boxGeometry args={[1.8, 2.4, 5.4]} />
      </mesh>
      <CuboidCollider args={[0.05, 1.2, 2.7]} position={[x + dir * 1.8, 1.2, 64]} />
    </group>
  );
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[62, 0.035, 64]} receiveShadow material={mat('#ffffff', { map: pitch })}>
        <planeGeometry args={[28, 15]} />
      </mesh>
      {line([62, 56.6], [26, 0.14], 'a')}
      {line([62, 71.4], [26, 0.14], 'b')}
      {line([49, 64], [0.14, 14.8], 'c')}
      {line([75, 64], [0.14, 14.8], 'd')}
      {line([62, 64], [0.14, 14.8], 'e')}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[62, 0.046, 64]} material={white}>
        <ringGeometry args={[2.4, 2.54, 40]} />
      </mesh>
      {goal(49, -1)}
      {goal(75, 1)}
      {/* perimeter wall with the gate on the street side */}
      <WallLine a={[46, 51]} b={[78, 51]} c="#c9b37f" h={2.6} gaps={[{ at: 62, w: 4 }]} doorH={9} />
      <WallLine a={[46, 77]} b={[78, 77]} c="#c9b37f" h={2.6} />
      <WallLine a={[46, 51]} b={[46, 77]} c="#c9b37f" h={2.6} />
      <WallLine a={[78, 51]} b={[78, 77]} c="#c9b37f" h={2.6} />
      <Box p={[59.6, 1.7, 51]} s={[0.6, 3.4, 0.6]} c="#2e7d32" col />
      <Box p={[64.4, 1.7, 51]} s={[0.6, 3.4, 0.6]} c="#2e7d32" col />
      <Sign p={[62, 3.8, 50.7]} text="الملعب البلدي" w={5.5} h={0.8} rotY={Math.PI} bg="#145a32" />
      {/* stepped stands along the far side */}
      {[0, 1, 2, 3].map((i) => (
        <Box key={i} p={[62, 0.3 + i * 0.6, 73.4 + i * 0.8]} s={[26, 0.6 + i * 0.0, 0.8]} c={i % 2 ? '#d35400' : '#2471a3'} col />
      ))}
      <Box p={[62, 1.2, 76.6]} s={[26, 2.4, 0.4]} c="#a0a0a0" col />
      {/* covered team benches */}
      {[52.5, 71.5].map((x) => (
        <group key={x}>
          <Box p={[x, 0.3, 64 + (x < 60 ? 0 : 0)]} s={[0.6, 0.45, 3]} c="#34495e" col />
          <mesh position={[x, 1.5, 64]} material={mat('#aed6f1', { transparent: true, opacity: 0.45, side: THREE.DoubleSide })}>
            <cylinderGeometry args={[0.9, 0.9, 3.2, 12, 1, true, 0, Math.PI]} />
          </mesh>
        </group>
      ))}
      {/* floodlight towers */}
      {[
        [47.5, 52.5],
        [76.5, 52.5],
        [47.5, 75.5],
        [76.5, 75.5],
      ].map(([x, z]) => (
        <group key={`${x}${z}`}>
          <Cyl p={[x, 6, z]} r={0.18} h={12} c="#7f8c8d" col />
          <Box p={[x, 12.2, z]} s={[2, 1.1, 0.3]} m={floodlight} rotY={Math.atan2(62 - x, 64 - z)} />
        </group>
      ))}
      {/* scoreboard */}
      <Box p={[62, 5.2, 76.9]} s={[5, 2, 0.3]} c="#111" />
      <Sign p={[62, 5.2, 76.7]} text="0 - 0" w={4.4} h={1.6} rotY={Math.PI} bg="#111" fg="#ffcc33" />
    </>
  );
}

// ---------------------------------------------------------------------------
// A building site south of the neighbourhood: concrete frame at 13–15, finished at 16+
// ---------------------------------------------------------------------------
function NewBuilding({ age }: { age: number }) {
  if (age <= 12)
    return (
      <>
        {/* an empty plot with a sign announcing the project */}
        <WallLine a={[-42, 69]} b={[-16, 69]} c="#8d8d8d" h={1.8} t={0.08} gaps={[{ at: -29, w: 4 }]} />
        <Sign p={[-36, 1.4, 68.9]} text="مشروع 40 سكن — قريبا" w={4} h={0.7} rotY={Math.PI} bg="#7b241c" />
        <mesh position={[-24, 0.6, 74]} castShadow material={mat('#cdb48d')}>
          <coneGeometry args={[2, 1.2, 8]} />
        </mesh>
      </>
    );
  if (age <= 15) {
    const floors = age - 12; // the frame grows a floor a year
    return (
      <>
        <WallLine a={[-42, 69]} b={[-16, 69]} c="#8d8d8d" h={1.8} t={0.08} gaps={[{ at: -29, w: 4 }]} />
        {Array.from({ length: floors }, (_, f) => (
          <group key={f}>
            <Box p={[-29, 3.2 * (f + 1), 74]} s={[22, 0.3, 8]} c="#b5b2a8" />
            {[-39, -34, -29, -24, -19].map((x) => [70.5, 77.5].map((z) => <Box key={`${x}${z}`} p={[x, 3.2 * f + 1.6, z]} s={[0.4, 3.2, 0.4]} c="#a9a59a" col={f === 0} />))}
          </group>
        ))}
        {/* scaffolding and a tower crane */}
        {Array.from({ length: floors * 2 }, (_, i) => (
          <Box key={`sc${i}`} p={[-29, 1.6 * i + 0.8, 69.8]} s={[22, 0.06, 0.8]} c="#c47f17" cast={false} />
        ))}
        <Box p={[-44.5, 10, 76]} s={[0.8, 20, 0.8]} c="#e0a800" col />
        <Box p={[-36, 20.2, 76]} s={[20, 0.6, 0.6]} c="#e0a800" />
        <Box p={[-28, 18.8, 76]} s={[0.05, 2.6, 0.05]} c="#333" />
        <Box p={[-28, 17.4, 76]} s={[1.4, 0.4, 1.4]} c="#7f8c8d" />
        <mesh position={[-20, 0.7, 72]} castShadow material={mat('#d8c39a')}>
          <coneGeometry args={[1.8, 1.4, 8]} />
        </mesh>
        <Cyl p={[-17.5, 0.8, 76]} r={0.6} h={1.1} c="#e67e22" />
      </>
    );
  }
  return (
    <>
      <Block x0={-40} z0={70} x1={-18} z1={78} h={12} wall={PALETTE.wallBlue} />
      <Lamp p={[-29, 68.6]} arm={[0, -1]} />
      <Tree p={[-42, 68.5]} s={0.7} />
      <Tree p={[-16, 68.5]} s={0.7} />
    </>
  );
}

export function Districts({ age }: { age: number }) {
  return (
    <>
      <Cyber />
      <Hospital />
      <ExamCentre age={age} />
      <Stadium />
      <NewBuilding age={age} />
    </>
  );
}
