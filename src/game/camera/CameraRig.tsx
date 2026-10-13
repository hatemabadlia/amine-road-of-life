// Smooth third-person orbit camera with physics-based collision and a
// cinematic mode during dialogue: over-the-shoulder shots that cut between
// speakers (keeping both on consistent sides, the "180° rule"), two-shots for
// choices, wide shots for the narrator, tagged low/high/close shots for key
// moments, and a slow push-in on every line.
import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import { input } from '../player/input';
import { livePose, useGame } from '../store';
import { camState, cine, npcPositions } from '../engine/refs';
import type { Shot } from '../../types/game';

const tmpTarget = new THREE.Vector3();
const tmpDesired = new THREE.Vector3();
const tmpLook = new THREE.Vector3();
const tmpDir = new THREE.Vector3();
const amineHead = new THREE.Vector3();
const axis = new THREE.Vector3();
const perp = new THREE.Vector3();
const mid = new THREE.Vector3();

type Framing = 'ots_npc' | 'ots_amine' | 'two' | Shot;

/** Camera position + look target for a dialogue shot between Amine (A) and the partner (N). */
function frame(shot: Framing, A: THREE.Vector3, N: THREE.Vector3, side: number, t: number, outPos: THREE.Vector3, outLook: THREE.Vector3) {
  axis.set(N.x - A.x, 0, N.z - A.z);
  if (axis.lengthSq() < 1e-4) axis.set(0, 0, 1);
  axis.normalize();
  perp.set(axis.z, 0, -axis.x).multiplyScalar(side);
  mid.copy(A).lerp(N, 0.5);
  // slow push-in during the line
  const push = Math.min(0.35, t * 0.05);
  switch (shot) {
    case 'ots_npc': // over Amine's shoulder, on the partner's face
      outPos.copy(A).addScaledVector(axis, -1.4 + push).addScaledVector(perp, 0.8);
      outPos.y += 0.22;
      outLook.copy(N).lerp(A, 0.12);
      outLook.y += -0.08;
      break;
    case 'ots_amine': // over the partner's shoulder, on Amine
      outPos.copy(N).addScaledVector(axis, 1.4 - push).addScaledVector(perp, 0.8);
      outPos.y += 0.15;
      outLook.copy(A).lerp(N, 0.12);
      outLook.y += -0.08;
      break;
    case 'close': // tight on the partner
      outPos.copy(N).addScaledVector(axis, -(0.95 - push * 0.6)).addScaledVector(perp, 0.18);
      outLook.copy(N);
      break;
    case 'low': // looking up at the partner: authority, threat
      outPos.copy(A).addScaledVector(axis, 0.4).addScaledVector(perp, 1.6 - push);
      outPos.y += -0.75;
      outLook.copy(N);
      outLook.y += 0.1;
      break;
    case 'high': // looking down on the two: vulnerability, crisis
      outPos.copy(mid).addScaledVector(perp, 1.6);
      outPos.y += 4.2 - push;
      outLook.copy(mid);
      outLook.y += -0.6;
      break;
    case 'wide': // establishing shot that slowly drifts
      outPos.copy(mid).addScaledVector(perp, 7 - push * 2).addScaledVector(axis, Math.sin(t * 0.12) * 1.5);
      outPos.y += 2.6;
      outLook.copy(mid);
      break;
    default: // two-shot
      outPos.copy(mid).addScaledVector(perp, 3.1 - push);
      outPos.y += 0.45;
      outLook.copy(mid);
      outLook.y += -0.1;
  }
}

export function CameraRig() {
  const { camera } = useThree();
  const { world, rapier } = useRapier();
  const look = useRef(new THREE.Vector3(livePose.x, 1.5, livePose.z));
  const init = useRef(false);
  const spawnNonce = useRef(-1);
  // dialogue state: who Amine talks to, which side of the axis we film from, current shot
  const partnerId = useRef<string | null>(null);
  const side = useRef(1);
  const shotKey = useRef('');
  const shotTime = useRef(0);
  const wasTalking = useRef(false);

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

    // ---- cinematic dialogue ----------------------------------------------------
    const d = st.dialogue;
    let cut = false;
    let cinematic = false;
    if (d) {
      if (!wasTalking.current) {
        // dialogue begins: the partner is the nearest character, filmed from the side the camera is already on
        partnerId.current = null;
        let best = 4.5;
        for (const [id, p] of npcPositions) {
          const dd = Math.hypot(p.x - livePose.x, p.z - livePose.z);
          if (dd < best) {
            best = dd;
            partnerId.current = id;
          }
        }
        const p = partnerId.current ? npcPositions.get(partnerId.current) : null;
        if (p) {
          const ax = p.x - livePose.x;
          const az = p.z - livePose.z;
          // which side of the A→N line is the camera on?
          side.current = ax * (camera.position.z - livePose.z) - az * (camera.position.x - livePose.x) > 0 ? -1 : 1;
        }
      }
      const speaker = d.view.kind === 'line' ? d.view.speaker : null;
      if (speaker && speaker !== 'amine' && speaker !== 'narrator' && npcPositions.has(speaker)) partnerId.current = speaker;
      const N = partnerId.current ? npcPositions.get(partnerId.current) : null;
      amineHead.copy(tmpTarget);
      if (N && N.distanceTo(amineHead) < 7) {
        cinematic = true;
        const tag = d.view.kind === 'line' ? d.view.cam : undefined;
        const shot: Framing = tag ?? (d.view.kind === 'choice' ? 'two' : speaker === 'narrator' ? 'wide' : speaker === 'amine' ? 'ots_amine' : 'ots_npc');
        const key = `${shot}:${speaker ?? 'choice'}`;
        if (key !== shotKey.current) {
          // a new shot is a hard cut, like film editing
          cut = shotKey.current !== '';
          shotKey.current = key;
          shotTime.current = 0;
        }
        shotTime.current += dt;
        frame(shot, amineHead, N, side.current, shotTime.current, tmpDesired, tmpLook);
        cine.partner = N;
        cine.focus = shot === 'ots_amine' ? amineHead : N;
      }
    }
    if (!cinematic) {
      shotKey.current = '';
      cine.partner = null;
      cine.focus = null;
    }
    wasTalking.current = !!d;
    cine.amount += ((cinematic ? 1 : 0) - cine.amount) * (1 - Math.exp(-4 * dt));

    if (!cinematic) {
      tmpDesired.set(
        tmpTarget.x + Math.sin(camState.yaw) * Math.cos(camState.pitch) * camState.dist,
        tmpTarget.y + Math.sin(camState.pitch) * camState.dist,
        tmpTarget.z + Math.cos(camState.yaw) * Math.cos(camState.pitch) * camState.dist,
      );
    } else {
      // collision is cast from the look target in cinematic shots
      tmpTarget.copy(tmpLook);
    }


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
    if (!init.current || cut) {
      camera.position.copy(tmpDesired);
      look.current.copy(tmpTarget);
      init.current = true;
    } else if (clipped && camera.position.distanceTo(tmpTarget) > tmpDesired.distanceTo(tmpTarget)) {
      // never let smoothing carry the camera behind an obstacle
      camera.position.copy(tmpDesired);
    } else {
      camera.position.lerp(tmpDesired, reduce ? 1 : 1 - Math.exp(-10 * dt));
    }
    if (cut) look.current.copy(tmpTarget);
    else look.current.lerp(tmpTarget, reduce ? 1 : 1 - Math.exp(-14 * dt));
    camera.lookAt(look.current);
  });
  return null;
}
