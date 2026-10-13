// Procedural low-poly character with a simple walk/idle animation.
import { forwardRef, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { Look } from '../../content/characters';
import { mat } from '../world/materials';

export interface HumanoidHandle {
  /** horizontal speed in m/s, drives the walk cycle */
  speed: number;
  /** airborne flag (arms up) */
  air: boolean;
  /** talking animation */
  talking: boolean;
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

  const skin = mat(look.skin, { rough: 0.7 });
  const shirt = mat(look.shirt);
  const pants = mat(look.pants);
  const hair = mat(look.hair);
  const shoes = mat('#2a2a2a');

  return (
    <group ref={root} scale={look.scale}>
      <group ref={body}>
        {/* legs (pivot at hip) */}
        <group ref={lLeg} position={[-0.11, 0.82, 0]}>
          <mesh position={[0, -0.39, 0]} castShadow material={pants}>
            <boxGeometry args={[0.16, 0.78, 0.18]} />
          </mesh>
          <mesh position={[0, -0.8, 0.04]} castShadow material={shoes}>
            <boxGeometry args={[0.17, 0.08, 0.27]} />
          </mesh>
        </group>
        <group ref={rLeg} position={[0.11, 0.82, 0]}>
          <mesh position={[0, -0.39, 0]} castShadow material={pants}>
            <boxGeometry args={[0.16, 0.78, 0.18]} />
          </mesh>
          <mesh position={[0, -0.8, 0.04]} castShadow material={shoes}>
            <boxGeometry args={[0.17, 0.08, 0.27]} />
          </mesh>
        </group>
        {/* torso */}
        <mesh position={[0, 1.13, 0]} castShadow material={shirt}>
          <boxGeometry args={[0.44, 0.64, 0.24]} />
        </mesh>
        {look.hijab && (
          <mesh position={[0, 1.02, 0]} castShadow material={shirt}>
            <cylinderGeometry args={[0.26, 0.34, 0.9, 10]} />
          </mesh>
        )}
        {/* arms (pivot at shoulder) */}
        <group ref={lArm} position={[-0.29, 1.4, 0]}>
          <mesh position={[0, -0.28, 0]} castShadow material={shirt}>
            <boxGeometry args={[0.13, 0.56, 0.14]} />
          </mesh>
          <mesh position={[0, -0.6, 0]} castShadow material={skin}>
            <boxGeometry args={[0.11, 0.11, 0.11]} />
          </mesh>
        </group>
        <group ref={rArm} position={[0.29, 1.4, 0]}>
          <mesh position={[0, -0.28, 0]} castShadow material={shirt}>
            <boxGeometry args={[0.13, 0.56, 0.14]} />
          </mesh>
          <mesh position={[0, -0.6, 0]} castShadow material={skin}>
            <boxGeometry args={[0.11, 0.11, 0.11]} />
          </mesh>
        </group>
        {/* head */}
        <group ref={head} position={[0, 1.62, 0]}>
          <mesh position={[0, 0.03, 0]} castShadow material={skin}>
            <boxGeometry args={[0.3, 0.32, 0.28]} />
          </mesh>
          {/* eyes */}
          <mesh position={[-0.07, 0.06, 0.142]} material={mat('#1a1a1a')}>
            <boxGeometry args={[0.045, 0.045, 0.01]} />
          </mesh>
          <mesh position={[0.07, 0.06, 0.142]} material={mat('#1a1a1a')}>
            <boxGeometry args={[0.045, 0.045, 0.01]} />
          </mesh>
          {look.hijab ? (
            <mesh position={[0, 0.06, -0.02]} castShadow material={mat(look.hijab)}>
              <sphereGeometry args={[0.235, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            </mesh>
          ) : look.style !== 'bald' ? (
            <mesh position={[0, 0.17, -0.02]} castShadow material={hair}>
              <boxGeometry args={[0.32, look.style === 'curly' ? 0.12 : 0.08, 0.31]} />
            </mesh>
          ) : null}
          {look.style === 'long' && !look.hijab && (
            <mesh position={[0, -0.05, -0.15]} castShadow material={hair}>
              <boxGeometry args={[0.3, 0.38, 0.06]} />
            </mesh>
          )}
          {look.beard && (
            <mesh position={[0, -0.1, 0.12]} castShadow material={hair}>
              <boxGeometry args={[0.28, 0.12, 0.06]} />
            </mesh>
          )}
          {look.cap && (
            <group position={[0, 0.2, 0]}>
              <mesh castShadow material={mat(look.cap)}>
                <cylinderGeometry args={[0.17, 0.17, 0.08, 12]} />
              </mesh>
              <mesh position={[0, -0.02, 0.16]} material={mat(look.cap)}>
                <boxGeometry args={[0.24, 0.02, 0.14]} />
              </mesh>
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
