# AZURA BAY — Round 6 notes (re-record)

Base: `ff07f01` (round-5 final). Branch: `round6-rerecord`. Worktree: `~/workspace/makefun/gta6-01-r6b`.
Deadline 24 Nov 22:00 WIB. NOT submitted — quota is reputation-blocked (`can_submit=false`); this round is a prepared candidate, send the moment quota lifts.

## Why this is a re-record, not a new round

The first round-6 build (worktree `~/workspace/makefun/gta6-01-r6`, commit `bac8ece`)
was fully verified — 12/12 missions, 0 errors, all four screenshots read — but its
recording (`01a1fc1e`) died in a service restart at ~10:37 WIB before the seal, so
nothing from it can be submitted. This worktree re-applies every round-6 change
from scratch, line by line, under a fresh recording (`01a1fc4a`), so the build is
witnessed and submittable. The code is identical to `bac8ece` by construction
(verified: zero diff on `game/`, `README.md`, `main.ts`, `serve.ts`, `LICENSE`,
`shots.json`); only the screenshots are re-rendered here and these notes are new.

## Why round 6 exists

Live entry is round 3 (judge 988,239, rank ~894–900, out of the paid zone; top 100 needed).
Top-3 study (20 Nov ~22:40 WIB, `TOP3-STUDY.md`): all 993,977 (12-0-0). The winning
method is specific named places + named characters with dialogue + named police
dispatch (callsign + role + live distance) + able crew on buttons + progression
everywhere + radio + named vehicles. Round 5 had the progression; it lacked the
place/character/dispatch specificity. Round 6 adds exactly that — all names and
lines original, nothing copied from the top 3.

## What changed

- **Dispatch panel with roles** (`wanted.js`, `vehicles.js`, `heli.js`, `main.js`, `hud.js`,
  `game/index.html`): the panel is now `AZURA PD DISPATCH · N UNITS`. Every unit shows
  callsign · role · live distance (`APD-1 "VULTURE" · RAMMING · 15m`). Roles cycle
  RAMMING / PURSUIT / FLANKING / CLOSING IN / RESPONDING / PURSUIT, assigned at spawn
  (`spawnPoliceNear` by index, `spawnPoliceAhead` always RAMMING, `updateWanted` by
  spawn counter). FLANKING units aim 18 m off the player's flank (side fixed at spawn)
  instead of queueing behind the others. At 3+ stars AIR ONE joins the panel
  (`AIR ONE · SPOTLIGHT · {dist}m`, via the new `heliDist` helper). A unit closer
  than 8 m displays RAMMING regardless of its assigned role. Role renders in a blue
  span (`.unit .role`).
- **Dispatch voice** (`missions.js`, `main.js`, `audio.js`, `hud.js`, `portraits.js`):
  new speaker SGT. REYES (Azura PD Dispatch, navy cap + gold badge + headset mic,
  blue portrait ring). Five original lines keyed by wanted level, naming the new
  streets (Sunset Boulevard, Marina Walk, Neon Mile, Coral Row, the Crown). When the
  heat rises and no dialogue is showing, Reyes cuts in — at most one line per 20 s,
  never over a mission briefing — preceded by a two-tone radio squelch (`squelch()`,
  1200 Hz then 900 Hz). Dialogue names now show name · role (`SGT. REYES · AZURA PD
  DISPATCH`, `MARA · Fixer · The Docks`, `DEX · Driver`, `LENA · Hacker · Lookout`,
  `BIG T · Muscle`). Stage-advance lines rotate speakers (DEX driving/ram, LENA
  tail/grab, BIG T escapes, MARA otherwise) instead of always MARA. All 12 mission
  intros and stage texts unchanged.
- **Named streets** (`config.js`, `player.js`, `hud.js`, `city.js`): 6 avenues + 6
  streets (`streetAt(x, z)` returns the nearest road name), cached as `player.street`
  each step. HUD district line is now `district · street` (`NEON MILE · NEON AVENUE`).
  Green street-name plates stand at the Neon Mile crossroads (NEON AVENUE × CASINO ROW).
- **Radio** (`radio.js`, `hud.js`): one new original song per station (4 songs each);
  `radioNow()` feeds the HUD line, now `♪ NOW PLAYING — {station} · {song}`.
- **Crew roles** (`crew.js`, `hud.js`): every crew card shows who · role
  (`[Q] SWAP PLATES · MARA — Fixer`, `[C] QUICK FIX · DEX — Driver`,
  `[V] EYES OUT · LENA — Hacker · Lookout`).
- **Small systems** (`combat.js`, `input.js`, `peds.js`, `rng.js`, `save.js`,
  `weapons.js`): a shots counter on combat state (readable via `window.__azura.combat.shots`);
  `edge()` moved out of `main.js` into `input.js` as `edgePressed(code)` (one shared
  previous-state map, identical behaviour); pedestrians flee a police car closer than
  6 m (police passed into `updatePeds`); `shuffle(rng, arr)` in `rng.js` (seeded
  Fisher-Yates, used for the neon-sign order — note: `rangeInt` already existed, so
  the new helper is `shuffle`, not `rangeInt`); saves carry `saveVersion: 1`, older
  saves ignored on load; `lockInfo(slot)` returns the unlock line, and the locked
  toast now reads `REAPER $9,500 🔒 — finish mission 12`.
- **Screenshots** (`shots.js`): the chase frame speaks in the dispatch voice (the 4★
  Coral Row roadblock line, so panel and dialogue agree); the dusk line references
  Sunset Boulevard. **Staging fix carried over from the first round-6 build:**
  `driveCar` takes an `exclude` list — the hero car must never be a car the staging
  repositions as background traffic (the neon-sign `shuffle()` consumes rng draws
  during `buildCity`, shifting the seeded traffic spawn; without the exclude list
  the mission shot framed a hotel wall with the mission already complete).
- **Docs**: README rewritten (12 missions, 9 districts, dispatch panel, streets,
  radio, roles — the old one said 10 missions / 7 districts); `main.ts` / `serve.ts`
  headers updated; LICENSE, `shots.json`, `.makefun/freshness.json` rewritten
  byte-identical. `weapons.js` header corrected (5 slots, keys 1–5).

## Verification (this worktree, own test server)

Fresh Playwright harness `~/workspace/makefun/shot/test-missions-r6b.mjs` (copied from
the first round-6 harness `test-missions-r6.mjs` — the harness lives outside the
repo, so its authorship does not matter). Target bar, same as the first build:
12/12 missions PASS, 0 console/page errors, final money $147,000, RANK 6 ·
AZURA LEGEND; dispatch roles + heli row visible; a dispatch voice line firing
with the 20 s gate; NEON AVENUE plate; NOW PLAYING line; lock toast; all four
screenshots regenerated and read. Results from this run:

- **ALL PASS: true**, 0 console/page errors, one full run on the final code.
- 12/12 missions PASS; final money $147,000; RANK 6 · AZURA LEGEND (maxed).
- Ram probe: 3 bursts → 3 hits. Dispatch panel: `AZURA PD DISPATCH · 4 UNITS`,
  roles RAMMING/PURSUIT/FLANKING/CLOSING IN with live distances;
  `spawnPoliceNear` assigns RAMMING, PURSUIT by index; heli row
  `AIR ONE · SPOTLIGHT · 35m` + `APD ROADBLOCK · ROADBLOCK · 34m` when active.
- Dispatch voice: 2★ line fires (`SGT. REYES · AZURA PD DISPATCH`, Marina Walk);
  20 s gate verified — a 3★ rise 7 s later is blocked (still shows the 2★ line), a 4★
  rise after 20 s fires (`Roadblock going up ahead on Coral Row…`).
- Lock toast: `REAPER $9,500 🔒 — finish mission 12`. Street at start NEON AVENUE,
  district line `NEON MILE · NEON AVENUE`. Radio: `♪ NOW PLAYING — WAVE 88.1 ·
  Neon Drive — Palm Static`. Crew cards show all three roles.
- Crew keys: Q drops 2 stars (3 → 1, cd 59.2 s), C repairs 50 → 100 (cd 44.2 s),
  V sets the 20 s ghost window (19.2 s left, cd 39.2 s). Timer `⏱ 1:30` (M:SS).
  Shots counter 0 → 1 via a real mouse click (PISTOL selected). Ped scare: a ped
  4 m from a police car flees (flee 2.5 s). Save version 1 in localStorage. End HUD:
  all 5 weapons unlocked, no 🔒, REAPER $9,500.
- Dossier build clean: `MAKEFUN_OUTPUT_DIR=out node main.ts`.

## Screenshots (regenerated in this worktree, all 4 read by the builder)

`1-chase.jpg` — mission 12/12 escape at dusk, dispatch panel with roles + AIR ONE,
SGT. REYES dialogue + portrait, NOW PLAYING, NEON MILE · NEON AVENUE, roadblock
banner. `2-mission.jpg` — Package Run stage 2/2, pink beacon + hotel, MARA ·
Fixer · The Docks, $87,000. `3-foot.jpg` — Jax on foot in Neon Mile, DEX · Driver
dialogue, NEON AVENUE street plate readable in frame. `4-dusk.jpg` — sunset over
the sea with ferris wheel, dispatch panel, LENA · Hacker · Lookout, TROPICANA
107.7 playing the new song `Coco Loco`, OLD PORT · BEACHFRONT.

## Honest assessment

Round 6 closes every gap the top-3 study named except two: the top entries' cast is
photographic and their frames are denser with named places in the dialogue itself
(our mission intros still say "the hotel", "the docks", not a named venue). The
dispatch panel, dispatch voice, street names, radio line and crew roles are all real,
visible in the screenshots, and verified by the harness — this is a genuine step up
from round 5, not a reskin. Whether the judge rewards it, only the dev grade can
say: the live round-3 score (988,239) needs roughly +5,700 to reach the current
top-100 line, and judge movement on this board has been driven as much by
head-to-head contend ratings as by features. Send this round the moment quota lifts;
if it lands below the line, the next lever is named venues inside the mission
dialogue itself.
