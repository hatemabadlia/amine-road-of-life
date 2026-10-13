// Pathfinding on the navigation grid.
import { describe, expect, it } from 'vitest';
import { cellOf, createGrid, fillGrid, findPath, lineOfSight, pathLength, walkable } from '../../src/game/world/nav';

// 20×20 m area, 0.5 m cells; a wall along x = 0 from z = -10 to z = 6 (door gap above z = 6)
function walledGrid() {
  const g = createGrid(-10, -10, 20, 0.5);
  fillGrid(g, (x, z) => Math.abs(x) < 0.4 && z < 6);
  return g;
}

describe('navigation', () => {
  it('walks straight when nothing is in the way', () => {
    const g = createGrid(-10, -10, 20, 0.5);
    const p = findPath(g, [-8, -8], [8, 8])!;
    expect(p).toHaveLength(1);
    expect(p[0]).toEqual([8, 8]);
  });

  it('goes around a wall through the gap, never through it', () => {
    const g = walledGrid();
    const p = findPath(g, [-5, -5], [5, -5])!;
    expect(p).not.toBeNull();
    // must pass above the wall's end
    expect(Math.max(...p.map((q) => q[1]))).toBeGreaterThan(6);
    // every straight segment stays on walkable cells
    let prev: [number, number] = [-5, -5];
    for (const q of p) {
      expect(lineOfSight(g, cellOf(g, prev[0], prev[1]), cellOf(g, q[0], q[1]))).toBe(true);
      prev = q;
    }
    expect(pathLength([-5, -5], p)).toBeGreaterThan(20);
  });

  it('returns null when the goal is sealed off', () => {
    const g = createGrid(-10, -10, 20, 0.5);
    // a closed box around (5, 5)
    fillGrid(g, (x, z) => (Math.abs(x - 5) < 2 && Math.abs(z - 5) < 2 && (Math.abs(x - 5) > 1.4 || Math.abs(z - 5) > 1.4)));
    const [cx, cz] = cellOf(g, 5, 5);
    expect(walkable(g, cx, cz)).toBe(true);
    expect(findPath(g, [-8, -8], [5, 5])).toBeNull();
  });

  it('crosses a road straight across instead of walking along it', () => {
    const g = createGrid(-10, -10, 20, 0.5);
    // a road band z ∈ [-2, 2] across the whole map, expensive to walk on
    fillGrid(g, () => false, (_x, z) => (Math.abs(z) < 2 ? 4 : 1));
    const p = findPath(g, [-8, 4], [8, -4])!;
    // not one long diagonal over the asphalt: it turns at the kerbs
    expect(p.length).toBeGreaterThan(1);
    let onRoad = 0;
    let prev: [number, number] = [-8, 4];
    for (const q of p) {
      const len = Math.hypot(q[0] - prev[0], q[1] - prev[1]);
      const steps = Math.ceil(len / 0.25);
      for (let k = 0; k < steps; k++) if (Math.abs(prev[1] + ((q[1] - prev[1]) * k) / steps) < 2) onRoad += len / steps;
      prev = q;
    }
    expect(onRoad).toBeLessThan(7);
  });
});
