// Movement for walking characters: follows a nav path, steps around the player
// and keeps a little distance from other walkers.
import { cellOf, findPath, nav, walkable, type Pt } from './nav';
import { livePose } from '../store';

export interface Agent {
  x: number;
  z: number;
  yaw: number;
  /** current horizontal speed (drives the walk/run animation) */
  speed: number;
  path: Pt[] | null;
  /** preferred speed in m/s */
  pace: number;
  radius: number;
  /** waiting for the player to step aside */
  blockedFor: number;
}

/** Every active walker, for mutual separation. */
export const agents = new Set<Agent>();

export function makeAgent(x: number, z: number, pace = 1.35): Agent {
  return { x, z, yaw: 0, speed: 0, path: null, pace, radius: 0.32, blockedFor: 0 };
}

/** Plan a walk to (x, z); returns false when no route exists. */
export function walkTo(a: Agent, x: number, z: number): boolean {
  const g = nav.grid;
  if (!g || !nav.ready) {
    a.path = [[x, z]];
    return true;
  }
  const p = findPath(g, [a.x, a.z], [x, z]);
  a.path = p;
  return !!p;
}

export const arrived = (a: Agent) => !a.path || a.path.length === 0;

const free = (x: number, z: number) => {
  const g = nav.grid;
  if (!g || !nav.ready) return true;
  const [cx, cz] = cellOf(g, x, z);
  return walkable(g, cx, cz);
};

/** Advance one frame. Returns true while still walking. */
export function stepAgent(a: Agent, dt: number, opts: { avoidPlayer?: boolean } = {}): boolean {
  const path = a.path;
  if (!path || !path.length) {
    a.speed = 0;
    return false;
  }
  let [tx, tz] = path[0];
  let dx = tx - a.x;
  let dz = tz - a.z;
  let d = Math.hypot(dx, dz);
  while (d < 0.3 && path.length) {
    path.shift();
    if (!path.length) {
      a.speed = 0;
      return false;
    }
    [tx, tz] = path[0];
    dx = tx - a.x;
    dz = tz - a.z;
    d = Math.hypot(dx, dz);
  }
  let vx = dx / d;
  let vz = dz / d;
  let pace = a.pace;

  // step around the player instead of walking into them
  if (opts.avoidPlayer !== false) {
    const px = livePose.x - a.x;
    const pz = livePose.z - a.z;
    const pd = Math.hypot(px, pz);
    const ahead = pd > 0.01 ? (px * vx + pz * vz) / pd : 0;
    if (pd < 2.2 && ahead > 0.2) {
      // sidestep toward the side the player is not on
      const side = vx * pz - vz * px > 0 ? -1 : 1;
      const w = Math.min(1.4, (2.2 - pd) * 1.3);
      const [bx, bz] = [vx, vz];
      vx = bx - bz * side * w;
      vz = bz + bx * side * w;
      const n = Math.hypot(vx, vz);
      vx /= n;
      vz /= n;
      if (pd < 0.85) {
        pace = 0;
        a.blockedFor += dt;
      }
    } else a.blockedFor = 0;
  }
  // separation from other walkers
  for (const o of agents) {
    if (o === a) continue;
    const ox = a.x - o.x;
    const oz = a.z - o.z;
    const od = Math.hypot(ox, oz);
    if (od > 0.01 && od < 0.9) {
      vx += (ox / od) * (0.9 - od) * 1.5;
      vz += (oz / od) * (0.9 - od) * 1.5;
    }
  }
  const n = Math.hypot(vx, vz) || 1;
  vx /= n;
  vz /= n;
  const step = Math.min(d, pace * dt);
  let nx = a.x + vx * step;
  let nz = a.z + vz * step;
  // steering must never push a walker into a wall: fall back to the plain path direction
  if (!free(nx, nz)) {
    nx = a.x + (dx / d) * step;
    nz = a.z + (dz / d) * step;
  }
  a.x = nx;
  a.z = nz;
  a.speed = dt > 0 ? step / dt : 0;
  if (step > 0.0001) {
    const target = Math.atan2(vx, vz);
    let diff = target - a.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    a.yaw += diff * (1 - Math.exp(-10 * dt));
  }
  return true;
}

/** Smoothly turn toward a point (used when standing). */
export function face(a: Agent, x: number, z: number, dt: number, rate = 5) {
  const target = Math.atan2(x - a.x, z - a.z);
  let diff = target - a.yaw;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  a.yaw += diff * (1 - Math.exp(-rate * dt));
}
