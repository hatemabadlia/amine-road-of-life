// Navigation grid + A* pathfinding for walking characters. The grid is built
// once from the real static colliders (walls, furniture, cars, trees), so paths
// go through doorways and around obstacles. Pure logic; no rendering.

export interface NavGrid {
  /** cell size in metres */
  cell: number;
  /** world coordinate of cell (0, 0)'s corner */
  x0: number;
  z0: number;
  w: number;
  h: number;
  /** 0 = blocked, otherwise traversal cost (1 = normal, higher = avoid, e.g. roads) */
  cost: Uint8Array;
}

export type Pt = [number, number];

export function createGrid(x0: number, z0: number, size: number, cell: number): NavGrid {
  const w = Math.ceil(size / cell);
  const h = w;
  return { cell, x0, z0, w, h, cost: new Uint8Array(w * h).fill(1) };
}

export const cellOf = (g: NavGrid, x: number, z: number): [number, number] => [Math.floor((x - g.x0) / g.cell), Math.floor((z - g.z0) / g.cell)];
export const centreOf = (g: NavGrid, cx: number, cz: number): Pt => [g.x0 + (cx + 0.5) * g.cell, g.z0 + (cz + 0.5) * g.cell];
const inside = (g: NavGrid, cx: number, cz: number) => cx >= 0 && cz >= 0 && cx < g.w && cz < g.h;
export const walkable = (g: NavGrid, cx: number, cz: number) => inside(g, cx, cz) && g.cost[cz * g.w + cx] > 0;

/** Fill the grid by testing each cell centre; `blocked(x, z)` should test a body-sized volume. */
export function fillGrid(g: NavGrid, blocked: (x: number, z: number) => boolean, roadCost?: (x: number, z: number) => number, rows?: [number, number]): void {
  const [r0, r1] = rows ?? [0, g.h];
  for (let cz = r0; cz < Math.min(r1, g.h); cz++)
    for (let cx = 0; cx < g.w; cx++) {
      const [x, z] = centreOf(g, cx, cz);
      g.cost[cz * g.w + cx] = blocked(x, z) ? 0 : (roadCost?.(x, z) ?? 1);
    }
}

/** Nearest walkable cell to (x, z), searching outward in rings. */
export function nearestWalkable(g: NavGrid, x: number, z: number, maxRing = 12): [number, number] | null {
  const [cx, cz] = cellOf(g, x, z);
  if (walkable(g, cx, cz)) return [cx, cz];
  for (let r = 1; r <= maxRing; r++) {
    let best: [number, number] | null = null;
    let bestD = Infinity;
    for (let dz = -r; dz <= r; dz++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        if (!walkable(g, cx + dx, cz + dz)) continue;
        const d = dx * dx + dz * dz;
        if (d < bestD) {
          bestD = d;
          best = [cx + dx, cz + dz];
        }
      }
    if (best) return best;
  }
  return null;
}

/** Straight line between two cells crosses only walkable cells (supercover walk). */
export function lineOfSight(g: NavGrid, a: [number, number], b: [number, number]): boolean {
  let [x, z] = a;
  const [x1, z1] = b;
  const dx = Math.abs(x1 - x);
  const dz = Math.abs(z1 - z);
  const sx = x1 > x ? 1 : -1;
  const sz = z1 > z ? 1 : -1;
  let err = dx - dz;
  const minCost = Math.min(g.cost[a[1] * g.w + a[0]], g.cost[z1 * g.w + x1]);
  for (;;) {
    if (!walkable(g, x, z)) return false;
    if (x === x1 && z === z1) return true;
    // never shortcut over costlier ground (roads) than both ends stand on
    if (g.cost[z * g.w + x] > minCost) return false;
    const e2 = 2 * err;
    if (e2 > -dz && e2 < dx) {
      // diagonal step: both neighbours must be free (no corner cutting)
      if (!walkable(g, x + sx, z) || !walkable(g, x, z + sz)) return false;
    }
    if (e2 > -dz) {
      err -= dz;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      z += sz;
    }
  }
}

class Heap {
  private items: number[] = [];
  private prio: number[] = [];
  get size() {
    return this.items.length;
  }
  push(item: number, p: number) {
    const it = this.items;
    const pr = this.prio;
    it.push(item);
    pr.push(p);
    let i = it.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (pr[parent] <= pr[i]) break;
      [it[parent], it[i]] = [it[i], it[parent]];
      [pr[parent], pr[i]] = [pr[i], pr[parent]];
      i = parent;
    }
  }
  pop(): number {
    const it = this.items;
    const pr = this.prio;
    const top = it[0];
    const lastI = it.pop()!;
    const lastP = pr.pop()!;
    if (it.length) {
      it[0] = lastI;
      pr[0] = lastP;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < it.length && pr[l] < pr[m]) m = l;
        if (r < it.length && pr[r] < pr[m]) m = r;
        if (m === i) break;
        [it[m], it[i]] = [it[i], it[m]];
        [pr[m], pr[i]] = [pr[i], pr[m]];
        i = m;
      }
    }
    return top;
  }
}

const DIRS: [number, number, number][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];

/** A* from world point to world point; returns smoothed waypoints (excluding the start), or null. */
export function findPath(g: NavGrid, from: Pt, to: Pt, maxNodes = 60000): Pt[] | null {
  const s = nearestWalkable(g, from[0], from[1]);
  const t = nearestWalkable(g, to[0], to[1]);
  if (!s || !t) return null;
  const W = g.w;
  const start = s[1] * W + s[0];
  const goal = t[1] * W + t[0];
  const gScore = new Float32Array(g.w * g.h).fill(Infinity);
  const came = new Int32Array(g.w * g.h).fill(-1);
  const closed = new Uint8Array(g.w * g.h);
  const heap = new Heap();
  const hfn = (i: number) => {
    const dx = Math.abs((i % W) - t[0]);
    const dz = Math.abs(Math.floor(i / W) - t[1]);
    return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz);
  };
  gScore[start] = 0;
  heap.push(start, hfn(start));
  let expanded = 0;
  while (heap.size) {
    const cur = heap.pop();
    if (cur === goal) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    if (++expanded > maxNodes) return null;
    const cx = cur % W;
    const cz = Math.floor(cur / W);
    for (const [dx, dz, step] of DIRS) {
      const nx = cx + dx;
      const nz = cz + dz;
      if (!walkable(g, nx, nz)) continue;
      if (dx && dz && (!walkable(g, cx + dx, cz) || !walkable(g, cx, cz + dz))) continue;
      const ni = nz * W + nx;
      const ng = gScore[cur] + step * g.cost[ni];
      if (ng < gScore[ni]) {
        gScore[ni] = ng;
        came[ni] = cur;
        heap.push(ni, ng + hfn(ni));
      }
    }
  }
  if (start !== goal && came[goal] < 0) return null;
  // walk back
  const cells: [number, number][] = [];
  for (let i = goal; i !== -1; i = came[i]) {
    cells.push([i % W, Math.floor(i / W)]);
    if (i === start) break;
  }
  cells.reverse();
  // string-pulling: keep only the cells where line of sight breaks
  const out: Pt[] = [];
  let anchor = 0;
  for (let i = 2; i < cells.length; i++) {
    if (!lineOfSight(g, cells[anchor], cells[i])) {
      anchor = i - 1;
      out.push(centreOf(g, cells[anchor][0], cells[anchor][1]));
    }
  }
  // end exactly on the target when it is walkable, otherwise on the nearest free cell
  const [tx, tz] = cellOf(g, to[0], to[1]);
  out.push(walkable(g, tx, tz) ? to : centreOf(g, t[0], t[1]));
  return out;
}

/** Total length of a path starting at `from`. */
export function pathLength(from: Pt, path: Pt[]): number {
  let d = 0;
  let p = from;
  for (const q of path) {
    d += Math.hypot(q[0] - p[0], q[1] - p[1]);
    p = q;
  }
  return d;
}

/** The single navigation grid for the neighbourhood (filled at runtime). */
export const nav: { grid: NavGrid | null; ready: boolean } = { grid: null, ready: false };
