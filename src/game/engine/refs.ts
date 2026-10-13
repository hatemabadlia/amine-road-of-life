// Shared, non-reactive runtime references between 3D systems.
import type * as THREE from 'three';
import type { RapierRigidBody } from '@react-three/rapier';
import { create } from 'zustand';

/** Live NPC head positions, written by NPC components. */
export const npcPositions = new Map<string, THREE.Vector3>();

/** Camera orbit state (yaw 0 = camera on +z side looking toward -z). */
export const camState = { yaw: Math.PI, pitch: 0.32, dist: 5.2 };

export const ballRef: { body: RapierRigidBody | null } = { body: null };

export interface Focus {
  id: string;
  kind: 'npc' | 'object';
  label: string;
  objective: boolean;
}

/** What the player is currently able to interact with. */
export const useFocus = create<{ focus: Focus | null; set: (f: Focus | null) => void }>((set) => ({
  focus: null,
  set: (focus) => set({ focus }),
}));

/** Football score for the current session (goals scored by kicking the ball in). */
export const useBall = create<{ goals: number; add: () => void }>((set) => ({ goals: 0, add: () => set((s) => ({ goals: s.goals + 1 })) }));
