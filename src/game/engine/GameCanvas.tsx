// The 3D scene: physics world, neighbourhood, characters, camera and lighting.
import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { AdaptiveDpr } from '@react-three/drei';
import { World } from '../world/World';
import { Player } from '../player/Player';
import { CameraRig } from '../camera/CameraRig';
import { Interaction } from '../interaction/Interaction';
import { ObjectiveMarker } from '../world/Markers';
import { DayNight } from '../world/DayNight';
import { Ball, Pedestrians, StoryNPCs } from '../world/NPCs';
import { useGame } from '../store';
import { input } from '../player/input';

function ReadySignal({ cb }: { cb: () => void }) {
  useEffect(() => {
    // wait two frames so the first render with physics is on screen
    let r2 = 0;
    const r1 = requestAnimationFrame(() => (r2 = requestAnimationFrame(cb)));
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [cb]);
  return null;
}

function Scene({ onReady }: { onReady: () => void }) {
  const age = useGame((s) => s.game?.age ?? 10);
  return (
    <>
      <DayNight />
      <Physics gravity={[0, -20, 0]}>
        <World age={age} />
        <Player />
        <StoryNPCs />
        <Pedestrians />
        <Ball />
        <CameraRig />
        <Interaction />
        <ReadySignal cb={onReady} />
      </Physics>
      <ObjectiveMarker />
    </>
  );
}

export function GameCanvas({ onReady }: { onReady: () => void }) {
  const quality = useGame((s) => s.settings.quality);
  const shadows = useGame((s) => s.settings.shadows);
  const wrap = useRef<HTMLDivElement>(null);
  const dpr: [number, number] = quality === 'high' ? [1, 1.75] : quality === 'medium' ? [0.8, 1.25] : [0.6, 1];

  // desktop mouse look: pointer lock on click, or drag when not locked
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let dragging = false;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const st = useGame.getState();
      if (st.dialogue || st.paused || st.card) return;
      dragging = true;
      if (!coarse && document.pointerLockElement !== el) el.requestPointerLock?.()?.catch?.(() => undefined);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (document.pointerLockElement === el || dragging) {
        input.look.dx += e.movementX;
        input.look.dy += e.movementY;
      }
    };
    const up = () => (dragging = false);
    const wheel = (e: WheelEvent) => {
      input.zoom += e.deltaY;
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    el.addEventListener('wheel', wheel, { passive: true });
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      el.removeEventListener('wheel', wheel);
    };
  }, []);

  // release pointer lock whenever UI needs the cursor
  useEffect(
    () =>
      useGame.subscribe((s, prev) => {
        const needCursor = !!(s.dialogue || s.paused || s.card || s.journal || s.bigMap || s.screen !== 'game');
        const prevNeed = !!(prev.dialogue || prev.paused || prev.card || prev.journal || prev.bigMap || prev.screen !== 'game');
        if (needCursor && !prevNeed && document.pointerLockElement) document.exitPointerLock();
      }),
    [],
  );

  return (
    <div ref={wrap} className="canvas-wrap" data-testid="game-canvas">
      <Canvas
        shadows={shadows && quality !== 'low'}
        dpr={dpr}
        camera={{ fov: 60, near: 0.1, far: 420, position: [-25, 4, -18] }}
        gl={{ antialias: quality !== 'low', powerPreference: 'high-performance' }}
      >
        <AdaptiveDpr pixelated={false} />
        <Suspense fallback={null}>
          <Scene onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
