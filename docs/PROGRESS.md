# Progress & status

## Done (phases 1–10)
1. Project setup, architecture, clean build.
2. 3D world, Rapier character controller, camera with collision, interactions.
3. Home (5 rooms), neighbourhood, two schools, shop, pitch, square/souk, workshop,
   apartment stairwell, alley, mosque, centre, training centre, grandpa's house; NPCs and pedestrians.
4. Mission engine; chapter 1 playable end to end (verified in a real browser).
5. Dialogue, branching, 10 indicators, economy, relationships.
6. Save/load (versioned, migration, corruption recovery), chapter progression, replay, recovery routes.
7. All 68 chapters with real content; automated validation (0 issues).
8. Side activities, ambient life, procedural audio, day/night, visual polish, mobile controls.
9. Ending system (72 endings, all proven reachable), coverage report.
10. Tests: 39 unit/integration, 12 Playwright runs (desktop + mobile); lint, type-check and build pass.

## Graphics pass
- Gradient sky shader with sun disc, halo and moon; drifting low-poly clouds; keyframed time-of-day palette (dawn, day, dusk, night) driving sun/moon light, hemisphere fill, fog and cloud tint.
- Post-processing (bloom, neutral tone mapping, light grading, vignette, MSAA) in two tiers. Phones are capped at tier 1. Software renderers get no effects, and the tier drops automatically if the frame rate keeps falling. `?fx=1` forces effects on, for screenshots.
- Procedural textures: facades with shutters, curtains, AC units, plants and laundry, plus windows that light up at night; plaster walls with grime at the base; patterned floor tiles, cracked asphalt, paved sidewalks with kerbs; worn pitch grass.
- Rounded characters with faces (eyes, brows, nose, mouth, ears), hair shapes, hands, shoes and a soft contact shadow.
- Flat-shaded trees and palms with drooping fronds and dates; detailed cars with lights that glow at night; street lamps with arms, halos and light pools on the ground.
- Mesas built from noise-displaced geometry with rock strata; about 900 grass tufts and 160 stones (instanced).
- Objective marker: a beam that fades upward and a pulsing ring; it hides when the camera is right on top of it.
- `scripts/tour.mjs` captures screenshots at several places and times of day.

## Known limitations
- All art is procedural low-poly (no external models); characters are rigid-part rigs, not skinned meshes. No screen-space AO (tried; it darkened the frame and was costly).
- No voice acting and no music track (only procedural ambience/SFX).
- NPCs stand at chapter-defined spots (they relocate between objectives but do not path-find); pedestrians follow fixed loops and stop for the player instead of avoiding him.
- Many chapters reuse the same set of locations; scenes are distinguished by cast, time of day, dialogue and objectives rather than new environments.
- Story choices are shown in Arabic only (no French/English localisation).
- Performance was measured only in headless software rendering (SwiftShader); no frame-rate figure is claimed for real hardware.
- The Rapier WASM bundle is ~1.1 MB gzip; it loads after the menu.

## Possible next steps
- Character models and animations (glTF), music, voiced key lines.
- NPC path-following schedules (e.g. Mourad walking to the pitch).
- Localisation (FR/EN subtitles), photo mode, more side activities.
