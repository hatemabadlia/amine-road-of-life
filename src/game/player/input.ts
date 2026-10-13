// Unified input state: keyboard, mouse look, and touch (joystick + look drag).
// Read every frame by the player controller and camera rig.

export const input = {
  keys: new Set<string>(),
  /** analog move from the virtual joystick, -1..1 (x right, y forward) */
  stick: { x: 0, y: 0, active: false },
  /** accumulated look deltas in pixels, consumed by the camera each frame */
  look: { dx: 0, dy: 0 },
  zoom: 0,
  runToggle: false,
  jumpQueued: false,
  interactQueued: false,
};

const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'Space'];

export function moveVector(): { x: number; y: number; run: boolean } {
  const k = input.keys;
  let x = 0;
  let y = 0;
  if (k.has('KeyW') || k.has('ArrowUp')) y += 1;
  if (k.has('KeyS') || k.has('ArrowDown')) y -= 1;
  if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
  if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
  if (input.stick.active) {
    x += input.stick.x;
    y += input.stick.y;
  }
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  const run = k.has('ShiftLeft') || k.has('ShiftRight') || input.runToggle || (input.stick.active && Math.hypot(input.stick.x, input.stick.y) > 0.92);
  return { x, y, run };
}

export function clearInput() {
  input.keys.clear();
  input.stick = { x: 0, y: 0, active: false };
  input.look.dx = 0;
  input.look.dy = 0;
  input.jumpQueued = false;
  input.interactQueued = false;
}

/** Install global keyboard listeners. Returns a cleanup function. */
export function installKeyboard(handlers: { onKey: (e: KeyboardEvent) => boolean }): () => void {
  const down = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (handlers.onKey(e)) {
      e.preventDefault();
      return;
    }
    if (MOVE_KEYS.includes(e.code)) e.preventDefault();
    if (e.code === 'Space' && !e.repeat) input.jumpQueued = true;
    input.keys.add(e.code);
  };
  const up = (e: KeyboardEvent) => input.keys.delete(e.code);
  const blur = () => clearInput();
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', blur);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('blur', blur);
  };
}
