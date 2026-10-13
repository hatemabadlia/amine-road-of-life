// Automation hooks for end-to-end tests. Only installed when the page is
// opened with ?e2e=1 (or in dev); never needed for normal play.
import { activeObjective, livePose, useGame } from '../game/store';
import { input } from '../game/player/input';
import { npcPositions } from '../game/engine/refs';
import { objectById, spotById } from '../game/world/layout';

export function exposeTestHooks() {
  if (typeof window === 'undefined') return;
  const enabled = import.meta.env.DEV || new URLSearchParams(location.search).has('e2e');
  if (!enabled) return;
  (window as unknown as { __AMINE__: unknown }).__AMINE__ = {
    state: () => useGame.getState(),
    pose: () => ({ ...livePose }),
    /** teleport next to a spot, object or character */
    goTo: (id: string) => {
      const sp = spotById.get(id);
      const ob = objectById.get(id);
      const np = npcPositions.get(id);
      const p = sp ? [sp.x, sp.z] : ob ? [ob.x, ob.z] : np ? [np.x, np.z] : null;
      if (!p) return false;
      const off = sp ? 0 : 1.1;
      useGame.setState({ spawn: { x: p[0] + off * 0.6, z: p[1] + off * 0.8, yaw: Math.atan2(-0.6, -0.8), nonce: Date.now() } });
      return true;
    },
    objective: () => {
      const g = useGame.getState().game;
      const o = activeObjective(g);
      return o ? { id: o.id, type: o.type, target: o.target, text: o.text } : null;
    },
    interact: () => {
      input.interactQueued = true;
    },
  };
}
