// The 3D scene: physics world, neighbourhood, characters, camera and lighting.
import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { Effects, type FxTier } from './Effects';
import { World } from '../world/World';
import { Player } from '../player/Player';
import { CameraRig } from '../camera/CameraRig';
import { Interaction } from '../interaction/Interaction';
import { ObjectiveMarker } from '../world/Markers';
import { DayNight } from '../world/DayNight';
import { Ball, StoryNPCs } from '../world/NPCs';
import { Townsfolk } from '../world/Townsfolk';
import { NavBuilder } from '../world/NavBuilder';
import { EventDecor } from '../world/EventDecor';
import { BusRide } from '../world/BusRide';
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
        <Townsfolk />
        <NavBuilder />
        <Ball />
        <CameraRig />
        <Interaction />
        <ReadySignal cb={onReady} />
      </Physics>
      <ObjectiveMarker />
      <EventDecor />
      <BusRide />
    </>
  );
}

/** Software renderers (SwiftShader, llvmpipe) can't afford post-processing. */
function isSoftwareGL(gl: THREE.WebGLRenderer): boolean {
  const ctx = gl.getContext();
  const ext = ctx.getExtension('WEBGL_debug_renderer_info');
  const name = String(ext ? ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ctx.getParameter(ctx.RENDERER));
  return /swiftshader|llvmpipe|software/i.test(name);
}

export function GameCanvas({ onReady }: { onReady: () => void }) {
  const quality = useGame((s) => s.settings.quality);
  const shadows = useGame((s) => s.settings.shadows);
  const wrap = useRef<HTMLDivElement>(null);
  // post-processing tier: from the quality setting, lowered on phones, slow GPUs
  // and when the frame rate keeps dropping (session only, never saved)
  const [software, setSoftware] = useState(false);
  const [penalty, setPenalty] = useState(0);
  const forceFx = typeof location !== 'undefined' && new URLSearchParams(location.search).has('fx');
  const baseTier = quality === 'high' ? 2 : quality === 'medium' ? 1 : 0;
  const capped = Math.min(baseTier, window.matchMedia('(pointer: coarse)').matches ? 1 : 2);
  const tier = (forceFx ? baseTier : software ? 0 : Math.max(0, capped - penalty)) as FxTier;
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
        shadows={shadows && quality !== 'low' ? 'soft' : false}
        dpr={dpr}
        camera={{ fov: 60, near: 0.1, far: 420, position: [-25, 4, -18] }}
        gl={{ antialias: quality !== 'low' && tier === 0, powerPreference: 'high-performance', stencil: false }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NeutralToneMapping;
          setSoftware(isSoftwareGL(gl));
        }}
      >
        <AdaptiveDpr pixelated={false} />
        <PerformanceMonitor flipflops={2} onDecline={() => setPenalty((p) => Math.min(2, p + 1))} />
        <Suspense fallback={null}>
          <Scene onReady={onReady} />
          <Effects tier={tier} />
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
