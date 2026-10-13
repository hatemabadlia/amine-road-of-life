# Architecture

Stack: React 19, TypeScript, Vite 6, three.js, @react-three/fiber 9, drei 10,
@react-three/rapier 2 (Rapier WASM), Zustand 5, Vitest 3, Playwright.

```
src/
  types/game.ts            data model (GameState, Chapter, Objective, Step…)
  content/                 story data — no rendering code
    chapters/act*.ts       68 chapters written with a small DSL (dsl.ts)
    characters/            cast + procedural looks + ambient lines
    endings/               ending model (path × family × Mourad), epilogues
    sides.ts               optional side activities
  game/
    story/                 PURE engine (no DOM, no three): conditions, engine,
                           dialogue runner, validator, headless simulator,
                           reachability search, coverage
    save/save.ts           versioned saves, migrations, sanitising
    store.ts               Zustand runtime store wrapping the engine
    world/                 layout (single source of truth for the map), 3D
                           world, materials, NPCs, markers, day/night, cast
    player/                character controller, procedural humanoid, input
    camera/CameraRig.tsx   orbit camera, physics collision, dialogue framing
    interaction/           focus detection, arrival detection, interact key
    audio/sound.ts         Web Audio procedural ambience and SFX
    ui/                    HUD, dialogue, overlays, touch controls, map drawing
    engine/                canvas wrapper, shared runtime refs
  app/                     App shell, menu, game screen (lazy), ending, test hooks
tests/unit                 Vitest
tests/e2e                  Playwright
scripts/                   coverage report, browser autoplay helpers
```

## Key decisions

- **Content is data.** Chapters are plain objects: objectives (`goto` / `talk` /
  `act`), dialogue trees with conditional lines, choices with effects and flags,
  conditional blocks, deadlines with late rules, time skips and NPC moves. The
  engine knows nothing about specific chapters.
- **One engine, three consumers.** The same pure engine drives the 3D game
  (through `store.ts`), the headless simulator (tests and the coverage report),
  and the validator. Anything proven in tests is what the game runs.
- **No softlocks by construction.** Conditional objectives are skipped when
  false, deadlines only record consequences (`onLate`), every decision must have
  an unconditional option (validated), and objectives are completed only by the
  player physically arriving or interacting.
- **Endings** are a documented composition of 3 independently earned outcomes;
  reachability of every combination is proven by playing the game headlessly
  (random population + guided evolutionary search).
- **Relationship drift**: stats drift slowly toward a baseline each chapter, so
  recent behaviour matters and recovery is possible but takes sustained effort.
- **Navigation** uses a simple screen state in the store (menu / game / ending)
  instead of a URL router; there are no deep links to support.
- **Performance**: the 3D engine chunk is lazy-loaded (menu is ~150 KB gzip);
  shared cached materials and canvas textures; one fixed rigid body holds all
  static colliders; shadow camera follows the player; DPR caps and a quality
  setting; AdaptiveDpr.
- **Test hooks** (`window.__AMINE__`) exist only with `?e2e=1` or in dev, for
  Playwright to teleport between objectives.
