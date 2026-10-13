// Automation hooks for end-to-end tests. Only installed when the page is
// opened with ?e2e=1 (or in dev); never needed for normal play.
import { activeObjective, livePose, useGame } from '../game/store';
import { input } from '../game/player/input';
import { npcPositions } from '../game/engine/refs';
import { OBJECTS, SPOTS, objectById, spotById } from '../game/world/layout';
import { findPath, nav, pathLength } from '../game/world/nav';
import { music } from '../game/audio/music';

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
    /** navigation grid status and a route query between two named places */
    nav: () => ({ ready: nav.ready, w: nav.grid?.w ?? 0, blocked: nav.grid ? nav.grid.cost.filter((c) => c === 0).length : 0 }),
    route: (a: string, b: string) => {
      const pa = spotById.get(a) ?? objectById.get(a);
      const pb = spotById.get(b) ?? objectById.get(b);
      if (!pa || !pb || !nav.grid) return null;
      const p = findPath(nav.grid, [pa.x, pa.z], [pb.x, pb.z]);
      return p ? { points: p.length, length: pathLength([pa.x, pa.z], p) } : null;
    },
    music: () => ({ theme: music.current(), level: music.level() }),
    places: () => [...SPOTS.map((s) => s.id), ...OBJECTS.map((o) => o.id)],
    interact: () => {
      input.interactQueued = true;
    },
  };
}
