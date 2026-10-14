// Procedural low-poly character with a simple walk/idle animation.
import { forwardRef, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { Look } from '../../content/characters';
import { mat, radialTexture } from '../world/materials';

// geometry shared by every character (built once)
const capsule = (r: number, len: number, cap = 6, seg = 10) => new THREE.CapsuleGeometry(r, len, cap, seg);
const G = {
  blob: new THREE.CircleGeometry(0.42, 20),
  leg: capsule(0.072, 0.62),
  shoe: capsule(0.07, 0.13, 4, 8),
  sole: new THREE.BoxGeometry(0.13, 0.02, 0.27),
  hips: new THREE.CylinderGeometry(0.2, 0.19, 0.16, 14),
  torso: capsule(0.2, 0.26, 6, 14),
  shoulders: capsule(0.1, 0.32, 4, 10),
  robe: new THREE.CylinderGeometry(0.24, 0.34, 0.9, 14),
  arm: capsule(0.062, 0.32),
  forearm: capsule(0.05, 0.12),
  hand: new THREE.SphereGeometry(0.06, 10, 8),
  neck: new THREE.CylinderGeometry(0.06, 0.07, 0.14, 10),
  head: new THREE.SphereGeometry(0.165, 20, 16),
  ear: new THREE.SphereGeometry(0.035, 8, 6),
  eye: new THREE.SphereGeometry(0.03, 10, 8),
  pupil: new THREE.SphereGeometry(0.017, 8, 6),
  brow: new THREE.BoxGeometry(0.06, 0.014, 0.012),
  nose: new THREE.SphereGeometry(0.024, 8, 6),
  mouth: new THREE.BoxGeometry(0.06, 0.014, 0.01),
  hair: new THREE.SphereGeometry(0.178, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.46),
  hairCurly: new THREE.SphereGeometry(0.195, 9, 6, 0, Math.PI * 2, 0, Math.PI * 0.5),
  fringe: new THREE.BoxGeometry(0.22, 0.05, 0.06),
  baldRing: new THREE.TorusGeometry(0.15, 0.02, 6, 16, Math.PI),
  longHair: capsule(0.12, 0.2, 4, 10),
  beard: new THREE.SphereGeometry(0.15, 14, 10, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55),
  hijabTop: new THREE.SphereGeometry(0.2, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.34),
  // wraps the sides and back, leaving the face open
  hijabWrap: new THREE.SphereGeometry(0.2, 18, 12, Math.PI / 2 + 0.85, Math.PI * 2 - 1.7, Math.PI * 0.2, Math.PI * 0.55),
  cap: new THREE.CylinderGeometry(0.17, 0.18, 0.09, 16),
  visor: new THREE.BoxGeometry(0.24, 0.02, 0.15),
};
const EYE_WHITE = mat('#f5f2ea', { rough: 0.3 });
const EYE = mat('#1a120c', { rough: 0.2 });
const MOUTH = mat('#7a3a32');
const BLOB = new THREE.MeshBasicMaterial({ map: radialTexture('rgba(0,0,0,0.45)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false });

export interface HumanoidHandle {
  /** horizontal speed in m/s, drives the walk cycle */
  speed: number;
  /** airborne flag (arms up) */
  air: boolean;
  /** talking animation */
  talking: boolean;
  /** lying on the back (hospital bed): arms rest flat along the body */
  lying?: boolean;
  group: THREE.Group | null;
}

export const Humanoid = forwardRef<HumanoidHandle, { look: Look }>(function Humanoid({ look }, ref) {
  const root = useRef<THREE.Group>(null);
  const lLeg = useRef<THREE.Group>(null);
  const rLeg = useRef<THREE.Group>(null);
  const lArm = useRef<THREE.Group>(null);
  const rArm = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const blob = useRef<THREE.Mesh>(null);
  const state = useRef<HumanoidHandle>({ speed: 0, air: false, talking: false, group: null });
  const phase = useRef(Math.random() * 10);

  useImperativeHandle(ref, () => {
    state.current.group = root.current;
    return state.current;
  });

  useFrame((_, dt) => {
    const st = state.current;
    const sp = Math.min(st.speed, 7);
    phase.current += dt * (sp > 0.1 ? 2.2 + sp * 1.25 : 1.6);
    const swing = sp > 0.1 ? Math.min(0.9, 0.25 + sp * 0.11) : 0;
    const s = Math.sin(phase.current);
    if (lLeg.current && rLeg.current) {
      lLeg.current.rotation.x = st.air ? -0.5 : s * swing;
      rLeg.current.rotation.x = st.air ? 0.3 : -s * swing;
    }
    if (lArm.current && rArm.current) {
      lArm.current.rotation.x = st.air ? -2.4 : -s * swing * 0.9;
      rArm.current.rotation.x = st.air ? -2.4 : s * swing * 0.9 + (st.talking ? Math.sin(phase.current * 1.7) * 0.25 - 0.3 : 0);
    }
    if (body.current) body.current.position.y = sp > 0.1 ? Math.abs(Math.cos(phase.current)) * 0.04 * swing : Math.sin(phase.current) * 0.008;
    if (head.current) head.current.rotation.x = st.talking ? Math.sin(phase.current * 2.3) * 0.06 : 0;
  });

  useFrame(() => {
    if (blob.current) blob.current.visible = !state.current.air;
  });

  const skin = mat(look.skin, { rough: 0.6 });
  const shirt = mat(look.shirt, { rough: 0.85 });
  const pants = mat(look.pants, { rough: 0.9 });
  const hair = mat(look.hair, { rough: 0.8 });
  const shoes = mat('#2a2a2a', { rough: 0.6 });
  const sole = mat('#e9e4da');

  return (
    <group ref={root} scale={look.scale}>
      {/* soft contact shadow */}
      <mesh ref={blob} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={BLOB} geometry={G.blob} renderOrder={1} />
      <group ref={body}>
        {/* legs (pivot at hip) */}
        {[lLeg, rLeg].map((ref, i) => (
          <group key={i} ref={ref} position={[i ? 0.105 : -0.105, 0.82, 0]}>
            <mesh position={[0, -0.38, 0]} castShadow material={pants} geometry={G.leg} />
            <mesh position={[0, -0.78, 0.045]} rotation={[Math.PI / 2, 0, 0]} castShadow material={shoes} geometry={G.shoe} />
            <mesh position={[0, -0.815, 0.045]} material={sole} geometry={G.sole} />
          </group>
        ))}
        {/* hips + torso */}
        <mesh position={[0, 0.86, 0]} castShadow material={pants} geometry={G.hips} scale={[1, 1, 0.66]} />
        <mesh position={[0, 1.15, 0]} castShadow material={shirt} geometry={G.torso} scale={[1, 1, 0.62]} />
        <mesh position={[0, 1.4, 0]} castShadow material={shirt} geometry={G.shoulders} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.72]} />
        {look.hijab && <mesh position={[0, 1.0, 0]} castShadow material={shirt} geometry={G.robe} />}
        {/* arms (pivot at shoulder) */}
        {[lArm, rArm].map((ref, i) => (
          <group key={i} ref={ref} position={[i ? 0.285 : -0.285, 1.4, 0]}>
            <mesh position={[0, -0.25, 0]} castShadow material={shirt} geometry={G.arm} />
            <mesh position={[0, -0.47, 0]} castShadow material={skin} geometry={G.forearm} />
            <mesh position={[0, -0.6, 0.01]} castShadow material={skin} geometry={G.hand} />
          </group>
        ))}
        <mesh position={[0, 1.5, 0]} material={skin} geometry={G.neck} />
        {/* head */}
        <group ref={head} position={[0, 1.62, 0]}>
          <mesh position={[0, 0.04, 0]} castShadow material={skin} geometry={G.head} scale={[0.95, 1.06, 1]} />
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[sd * 0.155, 0.03, -0.01]} material={skin} geometry={G.ear} />
          ))}
          {/* face */}
          {[-1, 1].map((sd) => (
            <group key={sd} position={[sd * 0.058, 0.06, 0.142]}>
              <mesh material={EYE_WHITE} geometry={G.eye} scale={[1, 1, 0.5]} />
              <mesh position={[0, 0, 0.012]} material={EYE} geometry={G.pupil} />
              <mesh position={[0, 0.045, 0.004]} rotation={[0, 0, sd * -0.12]} material={hair} geometry={G.brow} />
            </group>
          ))}
          <mesh position={[0, 0.0, 0.168]} material={skin} geometry={G.nose} />
          <mesh position={[0, -0.065, 0.152]} material={MOUTH} geometry={G.mouth} />
          {look.hijab ? (
            <>
              <mesh position={[0, 0.05, -0.005]} castShadow material={mat(look.hijab)} geometry={G.hijabTop} />
              <mesh position={[0, 0.05, -0.005]} castShadow material={mat(look.hijab)} geometry={G.hijabWrap} />
            </>
          ) : look.style !== 'bald' ? (
            <>
              <mesh position={[0, 0.07, -0.012]} rotation={[-0.35, 0, 0]} castShadow material={hair} geometry={look.style === 'curly' ? G.hairCurly : G.hair} />
              <mesh position={[0, 0.17, 0.11]} rotation={[0.5, 0, 0]} material={hair} geometry={G.fringe} />
            </>
          ) : (
            <mesh position={[0, 0.02, -0.03]} material={hair} geometry={G.baldRing} />
          )}
          {look.style === 'long' && !look.hijab && <mesh position={[0, -0.06, -0.12]} castShadow material={hair} geometry={G.longHair} />}
          {look.beard && <mesh position={[0, -0.075, 0.07]} castShadow material={hair} geometry={G.beard} scale={[1, 0.75, 0.75]} />}
          {look.cap && (
            <group position={[0, 0.17, 0]}>
              <mesh castShadow material={mat(look.cap)} geometry={G.cap} />
              <mesh position={[0, -0.02, 0.17]} material={mat(look.cap)} geometry={G.visor} />
            </group>
          )}
        </group>
      </group>
    </group>
  );
});

/** Amine grows from 10 to 18: scale and clothes change with age. */
export function amineLook(age: number): Look {
  const t = Math.max(0, Math.min(1, (age - 10) / 8));
  const shirts = ['#e2b04a', '#3b8ea5', '#2d3e50'];
  return {
    skin: '#d1a07a',
    shirt: age <= 12 ? shirts[0] : age <= 15 ? shirts[1] : shirts[2],
    pants: age <= 12 ? '#3c5a99' : '#2b2f3a',
    hair: '#1e140e',
    scale: 0.76 + t * 0.26,
    style: 'short',
  };
}
