// Smooth third-person orbit camera with physics-based collision and a
// cinematic framing mode during dialogue.
import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import { input } from '../player/input';
import { livePose, useGame } from '../store';
import { camState, npcPositions } from '../engine/refs';

const tmpTarget = new THREE.Vector3();
const tmpDesired = new THREE.Vector3();
const tmpLook = new THREE.Vector3();
const tmpDir = new THREE.Vector3();

export function CameraRig() {
  const { camera } = useThree();
  const { world, rapier } = useRapier();
  const look = useRef(new THREE.Vector3(livePose.x, 1.5, livePose.z));
  const init = useRef(false);
  const spawnNonce = useRef(-1);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const st = useGame.getState();
    if (st.spawn.nonce !== spawnNonce.current) {
      // teleports (new chapter, continue, unstuck) snap the camera instead of sweeping through walls
      spawnNonce.current = st.spawn.nonce;
      init.current = false;
    }
    const sens = st.settings.sensitivity;
    const age = st.game?.age ?? 10;
    const headH = 1.45 * (0.76 + 0.26 * Math.max(0, Math.min(1, (age - 10) / 8)));

    // consume look input
    if (!st.paused && !st.card) {
      camState.yaw -= input.look.dx * 0.0032 * sens;
      camState.pitch += input.look.dy * 0.0028 * sens * (st.settings.invertY ? -1 : 1);
      camState.pitch = Math.max(-0.25, Math.min(1.25, camState.pitch));
      camState.dist = Math.max(2.4, Math.min(9, camState.dist + input.zoom * 0.004));
    }
    input.look.dx = 0;
    input.look.dy = 0;
    input.zoom = 0;

    tmpTarget.set(livePose.x, livePose.y + headH, livePose.z);

    // dialogue framing: over-the-shoulder two-shot
    const speaker = st.dialogue?.view.kind === 'line' ? st.dialogue.view.speaker : null;
    const npc = speaker && speaker !== 'amine' && speaker !== 'narrator' ? npcPositions.get(speaker) : null;
    let dist = camState.dist;
    let pitch = camState.pitch;
    let yaw = camState.yaw;
    if (st.dialogue && npc && npc.distanceTo(tmpTarget) < 7) {
      tmpLook.copy(tmpTarget).lerp(npc, 0.5);
      const dx = npc.x - tmpTarget.x;
      const dz = npc.z - tmpTarget.z;
      const side = Math.atan2(dx, dz) + Math.PI / 2;
      // choose the perpendicular side closest to the current camera
      const a1 = side;
      const a2 = side + Math.PI;
      const d1 = Math.abs(Math.atan2(Math.sin(a1 - yaw), Math.cos(a1 - yaw)));
      const d2 = Math.abs(Math.atan2(Math.sin(a2 - yaw), Math.cos(a2 - yaw)));
      yaw = d1 < d2 ? a1 : a2;
      dist = 3.4;
      pitch = 0.18;
      tmpTarget.copy(tmpLook);
    }

    tmpDesired.set(
      tmpTarget.x + Math.sin(yaw) * Math.cos(pitch) * dist,
      tmpTarget.y + Math.sin(pitch) * dist,
      tmpTarget.z + Math.cos(yaw) * Math.cos(pitch) * dist,
    );

    // collision: cast from the target toward the camera, ignore the player/NPC kinematics and dynamic bodies
    tmpDir.copy(tmpDesired).sub(tmpTarget);
    const len = tmpDir.length();
    tmpDir.normalize();
    let clipped = false;
    try {
      const ray = new rapier.Ray({ x: tmpTarget.x, y: tmpTarget.y, z: tmpTarget.z }, { x: tmpDir.x, y: tmpDir.y, z: tmpDir.z });
      const hit = world.castRay(ray, len, true, rapier.QueryFilterFlags.EXCLUDE_KINEMATIC | rapier.QueryFilterFlags.EXCLUDE_DYNAMIC | rapier.QueryFilterFlags.EXCLUDE_SENSORS);
      if (hit) {
        const toi = (hit as unknown as { timeOfImpact?: number; toi?: number }).timeOfImpact ?? (hit as unknown as { toi: number }).toi;
        const d = Math.max(0.35, toi - 0.25);
        tmpDesired.copy(tmpTarget).addScaledVector(tmpDir, d);
        clipped = true;
      }
    } catch {
      /* physics not ready */
    }
    const reduce = st.settings.reducedMotion;
    if (!init.current) {
      camera.position.copy(tmpDesired);
      look.current.copy(tmpTarget);
      init.current = true;
    } else if (clipped && camera.position.distanceTo(tmpTarget) > tmpDesired.distanceTo(tmpTarget)) {
      // never let smoothing carry the camera behind an obstacle
      camera.position.copy(tmpDesired);
    } else {
      camera.position.lerp(tmpDesired, reduce ? 1 : 1 - Math.exp(-10 * dt));
    }
    look.current.lerp(tmpTarget, reduce ? 1 : 1 - Math.exp(-14 * dt));
    camera.lookAt(look.current);
  });
  return null;
}
