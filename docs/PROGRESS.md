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
10. Tests: 47 unit/integration, 20 Playwright runs (desktop + mobile, 1 mobile-only skipped on desktop); lint, type-check and build pass.

## Graphics pass
- Gradient sky shader with sun disc, halo and moon; drifting low-poly clouds; keyframed time-of-day palette (dawn, day, dusk, night) driving sun/moon light, hemisphere fill, fog and cloud tint.
- Post-processing (bloom, neutral tone mapping, light grading, vignette, MSAA) in two tiers. Phones are capped at tier 1. Software renderers get no effects, and the tier drops automatically if the frame rate keeps falling. `?fx=1` forces effects on, for screenshots.
- Procedural textures: facades with shutters, curtains, AC units, plants and laundry, plus windows that light up at night; plaster walls with grime at the base; patterned floor tiles, cracked asphalt, paved sidewalks with kerbs; worn pitch grass.
- Rounded characters with faces (eyes, brows, nose, mouth, ears), hair shapes, hands, shoes and a soft contact shadow.
- Flat-shaded trees and palms with drooping fronds and dates; detailed cars with lights that glow at night; street lamps with arms, halos and light pools on the ground.
- Mesas built from noise-displaced geometry with rock strata; about 900 grass tufts and 160 stones (instanced).
- Objective marker: a beam that fades upward and a pulsing ring; it hides when the camera is right on top of it.
- `scripts/tour.mjs` captures screenshots at several places and times of day.

## Living world pass
- **Characters:** one rigged, animated CC0 model ("Animated Human" by Quaternius; see `public/models/CREDITS.txt`), recoloured per character by repainting its palette texture. Feet are remapped to shoes. The hijab, cap, beard and long hair are fitted to the head bone. Animations: stand (taken from a walk frame), walk, run, jump, work, cross-faded and matched to speed. Children have bigger heads. The old procedural figure shows while the model loads.
- **Navigation:** a 0.6 m grid built at runtime from the real static colliders, with A* pathfinding. Roads cost more, so people use zebra crossings and kerbs, and paths are smoothed.
  - Story characters walk to their new places, jogging for long trips. They snap only when Amine can't see either end, or on a bus ride.
  - Someone Amine needs to talk to waits for him.
- **Townspeople (14):** daily schedules driven by the game clock: shop, square, souk, bus stop, the mosque at prayer times, kids on the pitch in the afternoon, and home at night (they vanish through doors and come back out in the morning). They step around Amine and chat with each other.
- **Music:** generated in the browser. Maqam-flavoured themes per life stage (Ajam, Nahawand, Kurd), plus Bayati for night and the menu, Hijaz for tense moments, a wedding theme (zorna and bendir) and an ending theme. Each chapter has its own seeded melody, and the music ducks under dialogue. The call to prayer is deliberately not synthesised.
- **Place sounds:** souk crowd and vendor calls, café cups, kids and ball on the pitch, hammer and saw at the workshop, pigeons at the mosque, the TV at home. Footsteps depend on the surface.
- **Cinematic dialogue:** over-the-shoulder shots that cut between speakers (180° rule), two-shots, wide narration shots and tagged low/high/close shots for key scenes. Also a slow push-in, letterbox bars, background blur on high quality, Amine turning to face the speaker, and a fade from black at chapter start.
- **New places:**
  - Cybercafé (chapter 16, reached by a real bus-ride sequence).
  - Municipal stadium (the inter-school cup in chapter 20).
  - Wedding on the square (chapter 29: tent, light strings, DJ, wedding music).
  - Exam centre (the baccalaureate in chapter 59).
  - Hospital with a ward and ambulance (visiting Salah, lying in his bed, in chapter 64).
- **The neighbourhood changes with age:** a building site goes from empty plot to concrete frame (a floor a year) to finished block at 16. The shop is repainted at 14 and sells phone credit at 16, and graffiti builds up in the alley.
- **Bugs fixed along the way:**
  - The living-room sofa blocked the bedroom doorway, so Amine couldn't walk out by keyboard.
  - Two filler blocks overlapped the new hospital and stadium sites.
- **New tests:** pathfinding (unit), the bus ride (store and e2e), every place reachable on foot (e2e, against the real colliders), music composition and themes (unit), music audibly playing (e2e level meter).

## Friday prayer and the mosque
- The mosque (مسجد الرحمة) can now be entered. It has:
  - an ablution area (الميضة) with taps and stools outside;
  - a vestibule with shoe racks and a Quran shelf;
  - a carpeted prayer hall with row lines, zellige tiles, a tiled mihrab, a minbar, columns, a chandelier and stained-glass arched windows;
  - the minaret, now on the street corner.
- The roof and dome hide when Amine is inside, and there's no music in the mosque.
- **Chapter 8 (a Friday):** after the souk Baba says it's time for the Friday prayer. Amine:
  1. walks to the mosque;
  2. makes ablution;
  3. leaves his shoes on the rack (and chooses to sit by Baba or Walid);
  4. listens to the imam's khutba about honest earning and kindness to parents;
  5. prays in the first row among rows of barefoot worshippers (shown 12:00–13:30);
  6. afterwards chooses whether to give charity to the old man at the door.
- New character: the imam, سي عبد الحميد. The prayer itself is narrated, not animated, and no recitation is synthesised.
- e2e test: the Friday chapter played through the real UI, checking that Amine prays inside the hall.

## Known limitations
- Environment art is procedural low-poly. Every character shares one base body (only colours and accessories differ). There's no sitting animation, and the "lying in bed" pose is the standing pose rotated. No screen-space AO (tried; it darkened the frame and was costly).
- No voice acting. Music is synthesised (not recorded instruments), and I couldn't listen to it, only measure that it plays.
- Townspeople don't open doors or go inside buildings (they vanish at entrances). Characters can't climb stairs.
- Most of the 68 chapters still use the original neighbourhood locations; five chapters now use the new places.
- Story choices are shown in Arabic only (no French/English localisation).
- Performance was measured only in headless software rendering (SwiftShader); no frame-rate figure is claimed for real hardware.
- The Rapier WASM bundle is ~1.1 MB gzip; it loads after the menu.

## Possible next steps
- More body types and outfits (traditional dress, school smocks), sitting animations.
- Voiced key lines; recorded instruments.
- Localisation (FR/EN subtitles), photo mode, more side activities.
