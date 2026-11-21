# GTA 6 — Round 8 notes (from round 7 commit 5842cc8, dev 990.081, 12-0-0, rank 511)

Goal: close the rest of the gap to the top 3 (all 993.977, 12-0-0). Round 7
closed the old study's gaps (dialogue, dispatch NEAREST, named venues) and
rose +672. This round starts from a FRESH direct read of the three top
artifacts (21 Nov ~17:05, /tmp/top3-r8/).

## Top-3 study (read directly, not from summaries)

- #1 Karimbu, Isle of Embers (madsrepo): volcanic-island setting identity;
  per-district standing — "KUMALA STRAND · Strand Boulevard · NEUTRAL · 58";
  4 weapon slots; same 3 crew abilities; dialogue with portraits; heli in sky.
- #2 TANGERINE MILE (hazel-harbor-63): sunset beach-road frame; mission with
  STAGE 7/7; DAY 9 multi-day clock; dispatch panel NAMES THE CRIME
  ("ARMED ROBBERY"); per-district "GRIP 50%"; 6 weapon slots; car reads
  "VIREO GT / SPORTS · TUNE 3" (class + tune); named dispatch captain.
- #3 BRISA BAY (tidy-orca-63): 8 jobs; dispatch with colour-coded role badges
  + "+1 more unit · roadblock ahead"; 7 weapon slots incl. BAT and RPG,
  "MAKO 45 · CLIP 30"; heli spotlight cone clearly visible + explosion +
  skyline; a CIVILIAN mission-giver (Tía Rosa, diner owner, "family").

## What round 8 adds (original concepts, not copies)

1. **STREET STANDING** (`game/src/standing.js`, new) — the biggest systematic
   gap: two of the top three show a per-district meter, we showed none. Every
   district carries 0–100 standing with the locals (start NEUTRAL 50; labels
   COLD / WARY / NEUTRAL / WARM / LOYAL). Real state, not a label: +3 when a
   mission stage lands in a district, +5 when a job pays out there, −4 every
   time the wanted level rises there. Saved with the career (save.js, additive
   field, old saves default NEUTRAL). HUD: word + bar under the district line.
2. **The pursuit and the street read richer** — three small, real additions:
   - Dispatch panel names the charge: `WANTED FOR: STOLEN VEHICLE` /
     `ARMED ASSAULT` / `ASSAULT` / `EVADING POLICE` (wanted.js `crime`,
     set at each offense site in main.js/missions.js; shown under the panel
     title in hud.js). Mirrors #2's "ARMED ROBBERY" line with our own charges.
   - Cars carry class + tune (`config.js` CAR_INFO, `vehicles.js`
     applyCarModel so name/class/tune can never disagree): the speedometer
     reads "Comet GT · SPORTS · TUNE 3" (hud.js). Mirrors #2's "TUNE 3".
   - A civilian job-giver: OTIS, the ferry master at Pier 9, hands Jax the
     ferry job (missions.js M8 intro re-voiced OTIS → JAX → LENA; new
     SPEAKERS entry + drawn portrait in portraits.js). Mirrors #3's civilian
     giver with an original character, not a copy.
   - Polish inside the same theme: the heli searchlight beam is wider and
     brighter (heli.js 0.17 → 0.30 opacity, radius 4.2 → 5.0) — in the round-7
     cover it barely read, and all three top covers sell the chase with a
     spotlight you can see. Shots stage the crime + standing + day (chase is
     DAY 3, GRAND THEFT AUTO; dusk DAY 3, STOLEN VEHICLE).

Deliberately NOT copied: weapon-slot count (5 stays — the HUD is full),
7-stage missions (playthrough risk), a volcano/bridge landmark (off-concept
for Azura Bay). The ferris wheel, pier and beach already carry the identity.

## Verification

- **Playthrough (harness `shot/test-missions-r8.mjs`, server :8095): ALL PASS:
  true.** 12/12 missions PASS, money $2,000 → $147,000 exact, RANK 6 AZURA
  LEGEND maxed, 0 console/page errors. All round-7 checks still pass
  (dialogue queue M0/M6, NEAREST line, dispatch voice + 20 s gate, heli row,
  ram 3/3, crew Q/C/V, timer ⏱ M:SS, PISTOL real-click shot 0→1, ped scare,
  save v1, lock toast).
- **Round-8 probes (same harness):** standing at start "STANDING · NEUTRAL
  50", 9 districts, all 50; car name "Night Fox · SPORTS · TUNE 3"; crime
  probe (real traffic-car steal): panel "WANTED FOR: STOLEN VEHICLE", stars
  3, crime field set, MARINA WALK 50 → 46 (−4 on the rise); M8 intro
  OTIS → JAX → LENA, portrait "OTIS · Ferry Master · The Harbor"; PALM
  HEIGHTS after M0 = 58 (+3 stage + +5 job, exact); standing at career end
  OLD PORT 72 / PALM HEIGHTS 75 / NEON MILE 86 (LOYAL) / THE AIRSTRIP 77 /
  UPTOWN 61 / MARINA WALK 55 / CORAL ROW 56 / SUNSET QUAY 52 / DOCKLANDS 50;
  save carries standing (9 districts, version 1).
- **Harness bugs found in the first r8 run (fixed, both in the harness, not
  the game):** the M8 probe started in a car so the steal stage auto-
  completed (showed LENA's stage line instead of OTIS), and the crime probe
  stole the nearest car which was parked (parked-car steals are free — no
  wanted, no crime). Both fixed; second run ALL PASS: true.
- **Screenshots re-rendered (`shot/shot-r8.mjs`) and read directly:**
  1-chase (DAY 3 · 18:35, MISSION 12/12, WANTED FOR: GRAND THEFT AUTO,
  NEAREST 15m, 9 units, spotlight beam now clearly visible, STANDING · WARM
  81, Comet GT · SPORTS · TUNE 3, 130 km/h, SGT. REYES line); 2-mission
  (DAY 2, Palm Court delivery, STANDING · NEUTRAL 55, Coast Cruiser ·
  CRUISER · TUNE 2); 3-foot (DAY 2, Neon Avenue sign, STANDING · WARM 81);
  4-dusk (DAY 3 · 18:33, sunset + ferris wheel, WANTED FOR: STOLEN VEHICLE,
  STANDING · WARY 41, Palm Runner · CONVERTIBLE · TUNE 2). One defect found
  and fixed: the standing bar made the minimap stack taller, so the hint
  line overlapped the minimap's top — moved #hint 210px → 245px, re-rendered,
  re-read clean (1-chase + 4-dusk confirmed).
- **Dossier deterministic 2×:** `MAKEFUN_OUTPUT_DIR=/tmp/dossier-a|b node
  main.ts` — `diff -r` identical. All 4 screenshots < 256 KiB.
- `node --check` clean on all 11 edited JS files. LICENSE sha still
  951bc504… (byte-identical rewrite), SPDX MIT.

## Honest assessment

Round 8 closes the two biggest systematic gaps the fresh top-3 read exposed:
a per-district standing system (two of the top three show one; we showed
none) and the dispatch/car/civilian richness (named charge, class + tune,
a non-crew job-giver). The build is verified clean with zero errors and the
cover now sells the chase with a visible spotlight. Whether the judge
rewards it with the ~3,900 points needed for the top 3 (993.977) is
unknowable locally — all three top entries sit at exactly 993.977 with the
same 12-0-0 record, and the gap is a judge-preference gap, not a missing-
feature gap. This is the strongest version we have; worth submitting before
the 24 Nov 22:00 WIB deadline.
