# أمين: طريق الحياة — Amine: The Road of Life

A 3D open-world narrative life-sim for the web, set in a fictional working-class
neighbourhood of Tébessa, Algeria. You play Amine from age 10 to 18 across
**68 chapters**, in Algerian Darija, with **72 distinct endings**.

## Run

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build into dist/
npm run preview      # serve the production build
```

Requires Node 20+ and a WebGL-capable browser (desktop or mobile).

## Test

```bash
npm test                     # unit + integration + full-journey tests (Vitest, ~25 s)
npm run lint                 # ESLint
npm run typecheck            # TypeScript
npm run validate             # story content validation only
npm run coverage:story       # regenerate docs/NARRATIVE_COVERAGE.md (~30 s)
npx playwright install chromium   # once
npm run e2e                  # browser tests on desktop + Pixel 7 emulation (~3 min)
```

## Controls

| Desktop | Mobile | Action |
|---|---|---|
| WASD / arrows | left joystick | walk |
| Shift | جري button / push stick to edge | run |
| Space | قفز button | jump |
| mouse (click to lock) / drag, wheel | drag right half of screen | camera |
| E | تفاعل button / tap prompt | interact |
| Space / Enter / click, 1–4 | tap | dialogue & choices |
| Tab / M / Esc | on-screen buttons | journal / map / pause & save |

## What's in it

- **Neighbourhood** (procedural, no external assets): Amine's home with bedroom, bathroom, kitchen, living room and parents' room; streets and sidewalks; primary school with classroom and courtyard; middle/high school; hanout; football pitch with a physics ball and goals; square with fountain, souk stalls and café; carpentry workshop; apartment block with the stairwell; back alley; mosque; listening and prevention centre; vocational training centre; grandfather's house with olive trees; pedestrians, kids, NPCs, day/night cycle and procedural ambient audio.
- **Gameplay**: Rapier kinematic character controller (collisions, autostep, jump, fall recovery, world bounds), smooth third-person camera with physics collision and cinematic dialogue framing, interaction prompts, world-space objective marker, minimap and full map.
- **Story**: 68 chapters, 334 objectives, 1,197 Darija dialogue lines, 172 decisions, 322 persistent story flags, deadlines that change the story instead of blocking it, time skips, NPCs who relocate as the story moves.
- **Systems**: 10 indicators (0–100, clamped), DZD economy (allowance, cuts, odd jobs, workshop pay, piggy bank, debts, scams), separate trust vs. short-term anger, relationship drift, recovery routes (confession, help-seeking, rebuilding trust), versioned saves with migration and corruption recovery, chapter replay, endings gallery.

See `docs/ARCHITECTURE.md`, `docs/PROGRESS.md` and `docs/NARRATIVE_COVERAGE.md`.
