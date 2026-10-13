// The bus ride across town: the city bus drives down the main street while the
// camera tracks it, then the screen fades and Amine stands at his destination.
import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../store';
import { mat } from './materials';

export const RIDE_SECONDS = 6;

/** Camera override during the bus ride (read by the camera rig). */
export const rideCam = { active: false, pos: new THREE.Vector3(), look: new THREE.Vector3() };

export function BusRide() {
  const bus = useRef<THREE.Group>(null);
  useFrame(() => {
    const st = useGame.getState();
    const g = bus.current;
    if (!g) return;
    if (!st.ride) {
      g.visible = false;
      rideCam.active = false;
      return;
    }
    const t = (performance.now() - st.ride.started) / 1000;
    if (t >= RIDE_SECONDS) {
      rideCam.active = false;
      g.visible = false;
      st.endRide();
      return;
    }
    // ease in from the stop, cruise, ease out
    const k = t / RIDE_SECONDS;
    const x = -40 + 100 * (k * k * (3 - 2 * k));
    g.visible = true;
    g.position.set(x, 0, -1.9);
    rideCam.active = true;
    rideCam.pos.set(x - 7 + k * 4, 2.4, 8.5);
    rideCam.look.set(x + 1, 1.6, -1.9);
  });
  const body = mat('#f2f2ee', { rough: 0.5 });
  const stripe = mat('#1f6fb2');
  const glass = mat('#22313d', { rough: 0.15, metal: 0.4 });
  return (
    <group ref={bus} visible={false}>
      <mesh position={[0, 1.65, 0]} castShadow material={body}>
        <boxGeometry args={[10, 2.7, 2.5]} />
      </mesh>
      <mesh position={[0, 0.9, 0]} material={stripe}>
        <boxGeometry args={[10.02, 0.35, 2.52]} />
      </mesh>
      <mesh position={[0.3, 2.15, 0]} material={glass}>
        <boxGeometry args={[8.6, 0.9, 2.54]} />
      </mesh>
      <mesh position={[5.01, 1.9, 0]} material={glass}>
        <boxGeometry args={[0.04, 1.3, 2.2]} />
      </mesh>
      {[-3.4, 3.4].map((dx) =>
        [-1.15, 1.15].map((dz) => (
          <mesh key={`${dx}${dz}`} position={[dx, 0.48, dz]} rotation={[Math.PI / 2, 0, 0]} material={mat('#1b1b1b')}>
            <cylinderGeometry args={[0.48, 0.48, 0.3, 14]} />
          </mesh>
        )),
      )}
    </group>
  );
}
