// Third-person character controller using Rapier's kinematic character controller.
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, useRapier, type RapierCollider, type RapierRigidBody } from '@react-three/rapier';
import { amineLook, type HumanoidHandle } from './Humanoid';
import { Character } from './SkinnedHuman';
import { input, moveVector } from './input';
import { livePose, useGame } from '../store';
import { camState, cine } from '../engine/refs';
import { sound } from '../audio/sound';
import { surfaceAt } from '../world/layout';
import { WORLD_HALF } from '../world/layout';

const WALK = 3.3;
const RUN = 6.2;
const GRAVITY = 22;
const JUMP = 6.4;

function lerpAngle(a: number, b: number, t: number) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export function Player() {
  const age = useGame((s) => s.game?.age ?? 10);
  const spawn = useGame((s) => s.spawn);
  const look = useMemo(() => amineLook(age), [age]);
  const scale = look.scale;
  const radius = 0.28 * scale;
  const half = 0.9 * scale - radius;

  const body = useRef<RapierRigidBody>(null);
  const collider = useRef<RapierCollider>(null);
  const model = useRef<HumanoidHandle>(null);
  const visual = useRef<THREE.Group>(null);
  const { world, rapier } = useRapier();

  // created in an effect (not useMemo) so StrictMode's mount/unmount/mount cycle
  // never leaves us holding a freed WASM controller
  const controllerRef = useRef<ReturnType<typeof world.createCharacterController> | null>(null);
  useEffect(() => {
    const c = world.createCharacterController(0.03);
    c.enableAutostep(0.4, 0.2, true);
    c.enableSnapToGround(0.4);
    c.setMaxSlopeClimbAngle((50 * Math.PI) / 180);
    c.setApplyImpulsesToDynamicBodies(true);
    c.setCharacterMass(45);
    controllerRef.current = c;
    return () => {
      controllerRef.current = null;
      world.removeCharacterController(c);
    };
  }, [world]);

  const vel = useRef(new THREE.Vector3());
  const vy = useRef(0);
  const grounded = useRef(true);
  const facing = useRef(spawn.yaw + Math.PI);
  const stepDist = useRef(0);
  const safe = useRef(new THREE.Vector3(spawn.x, 1, spawn.z));

  // teleport whenever a new spawn is requested (new chapter, continue, unstuck)
  useEffect(() => {
    const b = body.current;
    if (!b) return;
    b.setTranslation({ x: spawn.x, y: 0.9 * scale + 0.15, z: spawn.z }, true);
    b.setNextKinematicTranslation({ x: spawn.x, y: 0.9 * scale + 0.15, z: spawn.z });
    vel.current.set(0, 0, 0);
    vy.current = 0;
    camState.yaw = spawn.yaw;
    facing.current = spawn.yaw + Math.PI;
    Object.assign(livePose, { x: spawn.x, y: 0, z: spawn.z, yaw: facing.current, speed: 0 });
  }, [spawn.nonce, spawn.x, spawn.z, spawn.yaw, scale]);

  useFrame((_, rawDt) => {
    const b = body.current;
    const col = collider.current;
    const controller = controllerRef.current;
    if (!b || !col || !controller) return;
    const dt = Math.min(rawDt, 0.1);
    const st = useGame.getState();
    const frozen = !!(st.ride || st.dialogue || st.paused || st.card || st.screen !== 'game' || st.journal || st.bigMap);
    const mv = frozen ? { x: 0, y: 0, run: false } : moveVector();

    // camera-relative direction
    const fx = -Math.sin(camState.yaw);
    const fz = -Math.cos(camState.yaw);
    const rx = Math.cos(camState.yaw);
    const rz = -Math.sin(camState.yaw);
    const speed = mv.run ? RUN : WALK;
    const tx = (fx * mv.y + rx * mv.x) * speed;
    const tz = (fz * mv.y + rz * mv.x) * speed;
    const accel = mv.x || mv.y ? 10 : 14;
    const k = 1 - Math.exp(-accel * dt);
    vel.current.x += (tx - vel.current.x) * k;
    vel.current.z += (tz - vel.current.z) * k;

    if (grounded.current) {
      if (input.jumpQueued && !frozen) {
        vy.current = JUMP;
        grounded.current = false;
      } else vy.current = -2;
    } else {
      vy.current -= GRAVITY * dt;
    }
    input.jumpQueued = false;

    controller.computeColliderMovement(col, { x: vel.current.x * dt, y: vy.current * dt, z: vel.current.z * dt }, rapier.QueryFilterFlags.EXCLUDE_SENSORS);
    const m = controller.computedMovement();
    grounded.current = controller.computedGrounded();
    if (grounded.current && vy.current < 0) vy.current = -2;
    const t = b.translation();
    const lim = WORLD_HALF - 1.5;
    let nx = Math.max(-lim, Math.min(lim, t.x + m.x));
    let ny = t.y + m.y;
    let nz = Math.max(-lim, Math.min(lim, t.z + m.z));
    if (ny < -5) {
      // fell out of the world: back to the last safe ground position
      nx = safe.current.x;
      ny = safe.current.y + 0.5;
      nz = safe.current.z;
      vy.current = 0;
      b.setTranslation({ x: nx, y: ny, z: nz }, true);
    } else if (grounded.current) {
      safe.current.set(nx, ny, nz);
    }
    b.setNextKinematicTranslation({ x: nx, y: ny, z: nz });

    const hs = Math.hypot(m.x, m.z) / Math.max(dt, 1e-4);
    if (hs > 0.3 && (mv.x || mv.y)) facing.current = lerpAngle(facing.current, Math.atan2(vel.current.x, vel.current.z), 1 - Math.exp(-12 * dt));
    // in a conversation Amine turns to face the person he talks to
    else if (st.dialogue && cine.partner) facing.current = lerpAngle(facing.current, Math.atan2(cine.partner.x - nx, cine.partner.z - nz), 1 - Math.exp(-6 * dt));
    if (visual.current) visual.current.rotation.y = facing.current;
    if (model.current) {
      model.current.speed = hs;
      model.current.air = !grounded.current && vy.current > -8;
    }
    livePose.x = nx;
    livePose.y = ny - 0.9 * scale;
    livePose.z = nz;
    livePose.yaw = facing.current;
    livePose.speed = hs;

    if (grounded.current && hs > 0.5) {
      stepDist.current += hs * dt;
      const stride = hs > 4.5 ? 1.5 : 1.1;
      if (stepDist.current > stride) {
        stepDist.current = 0;
        sound.footstep(hs > 4.5, surfaceAt(livePose.x, livePose.z));
      }
    }
  });

  return (
    <RigidBody key={age} ref={body} type="kinematicPosition" colliders={false} position={[spawn.x, 0.9 * scale + 0.15, spawn.z]} enabledRotations={[false, false, false]}>
      <CapsuleCollider ref={collider} args={[half, radius]} />
      <group ref={visual} position={[0, -0.9 * scale, 0]}>
        <Character ref={model} look={look} />
      </group>
    </RigidBody>
  );
}
