// Builds the navigation grid from the static colliders, a few rows per frame
// (no hitch), once the physics world is populated.
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import { createGrid, fillGrid, nav } from './nav';
import { ROADS, WORLD_HALF } from './layout';
import { staticWorld } from './World';

const CELL = 0.6;
const ROWS_PER_FRAME = 24;
// zebra crossings are the cheap way across a road
const CROSSINGS: [number, number, number, number][] = [[-25.6, -4.2, -22.4, 4.2]];

const roadCost = (x: number, z: number) => {
  if (CROSSINGS.some(([x0, z0, x1, z1]) => x > x0 && x < x1 && z > z0 && z < z1)) return 1;
  return ROADS.some(([x0, z0, x1, z1]) => x > x0 && x < x1 && z > z0 && z < z1) ? 4 : 1;
};

export function NavBuilder() {
  const { world, rapier } = useRapier();
  const row = useRef(-3); // wait a few frames for every collider to be registered
  useEffect(() => {
    nav.ready = false;
    nav.grid = createGrid(-WORLD_HALF, -WORLD_HALF, WORLD_HALF * 2, CELL);
    row.current = -3;
  }, []);
  useFrame(() => {
    const g = nav.grid;
    if (!g || nav.ready) return;
    if (row.current < 0) {
      row.current++;
      return;
    }
    const body = staticWorld.body;
    if (!body) return;
    const shape = new rapier.Cuboid(CELL * 0.42, 0.5, CELL * 0.42);
    const rot = { x: 0, y: 0, z: 0, w: 1 };
    const handle = body.handle;
    const blocked = (x: number, z: number) =>
      !!world.intersectionWithShape({ x, y: 0.78, z }, rot, shape, undefined, undefined, undefined, undefined, (c) => c.parent()?.handle === handle);
    fillGrid(g, blocked, roadCost, [row.current, row.current + ROWS_PER_FRAME]);
    row.current += ROWS_PER_FRAME;
    if (row.current >= g.h) nav.ready = true;
  });
  return null;
}
