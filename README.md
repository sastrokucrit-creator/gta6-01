[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/sastrokucrit-creator/gta6-01/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/sastrokucrit-creator/gta6-01/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

# AZURA BAY — an open-world crime game

A complete sun-soaked 3D open-world crime game, built for make.fun's **"Make GTA 6"** bounty (gta6-01). Everything is original: the city, the crew, the cars, the radio stations, the missions — no Rockstar names, assets, or maps.

**The story:** Jax washed up in Azura Bay with empty pockets and a reputation to rebuild. Mara, the fixer who runs the docks, has work for anyone fast enough — if the police don't catch you first. Twelve jobs. One crew. No way back.

## The city

Azura Bay is a sunny coastal city: a 5×5 block grid of procedural buildings with lit windows and brightly coloured facades (pink, orange, teal, yellow), palm trees, neon signs (HOTEL, BAR, CASINO, PIER, TACOS, CLUB, SUNSET, PIER 9, WAVES), a palm-lined beach with umbrellas, benches and a ferris wheel, a wooden pier and the sea to the south, golden-hour sunsets, and nine named districts — Old Port, Docklands, Marina Walk, Palm Heights, Neon Mile, Coral Row, Sunset Quay, The Airstrip, Uptown. Every road has a name too: Sunset Boulevard, Palm Avenue, Marina Boulevard, Neon Avenue, Coral Avenue, Harbor Road, South Pier Road, Beachfront, Dock Street, Casino Row, Hotel Row, Airstrip Road — street-name plates stand at the Neon Mile crossroads, and the HUD always shows your district and street. Jax starts with $2,000 and every mission pays a cash reward.

Every job happens at a named venue, never just "the hotel" or "the docks": Mara's Garage on Dock Street, Pier 9 on South Pier Road, the Palm Court Hotel on Hotel Row, Warehouse 7 on Airstrip Road, the Coral Crown Casino on Casino Row, the yacht The Solstice at Marina Walk, the Safehouse on Dock Street, the Hideout on Coral Avenue, Azura Airstrip on Airstrip Road, and the Neon Arch on Neon Avenue.

## What is in the game

- **Walk and drive** — third-person on foot (run, jump) and arcade driving. Get in any car; steal parked cars and NPC cars (E). Cars have names (Comet GT, Coast Cruiser, Palm Runner…), condition, and a taxi fleet.
- **Living streets** — NPC traffic drives the grid, taxis cruise, pedestrians stroll the sidewalks — and flee when a police car gets close or a shot is fired.
- **Wanted system** — stealing, crashing, and attacking raise your wanted level (0–5 stars). The **AZURA PD DISPATCH** panel names every responding unit with its callsign, its role (RAMMING, PURSUIT, FLANKING, CLOSING IN, RESPONDING) and its live distance in metres, and calls out the nearest unit on its own line (`NEAREST: APD-2 "HAMMER" · 12m`); flankers cut across to your side instead of queueing behind you, and at 3+ stars AIR ONE joins the panel with a spotlight role while the police helicopter keeps you in sight. At 4+ stars a roadblock forms ahead. Hide or outrun them to cool off.
- **Dispatch voice** — when the heat rises, Sgt. Reyes cuts in on the radio (a two-tone squelch first) with a call for your wanted level, naming the street you are on. Every speaker is introduced by name and role in the dialogue box, with a portrait ring in their colour.
- **12 story missions in 4 chapters** — a connected chain with stages, timers, and dialogue: First Wheels, Package Run, Tail the Mark, Hot Pursuit, The Dock Job, Lose the Heat, The Big Score, Casino Chips, The Ferry Job, Azura Legend, Harbor Lights, The Azura Crown. Every job opens with a real exchange — Mara briefs, Jax answers in his own words, the crew reacts — every stage starts with a spoken line from the crew member it belongs to, naming the venue, and every job ends with a personal line from the crew. Objectives, stage progress, and the next job are always on screen. The twelve jobs pay $147,000 in total.
- **Combat** — fists and four firearms (Pistol, SMG, Shotgun, REAPER) with ammo, prices, and unlocks — the REAPER stays locked until the final job. A locked slot tells you exactly which mission opens it.
- **Radio** — four in-car stations with original songs, four songs each: WAVE 88.1, PALM FM 94.5, BAY ROCK 101.2, TROPICANA 107.7. Press R to switch; the HUD shows NOW PLAYING with the station and the song.
- **Crew abilities** — Mara (Fixer) swaps plates, Dex (Driver) quick-fixes the car, Lena (Hacker · Lookout) loops the cameras. Each has its own key (Q/C/V), cooldown, and card on the HUD.
- **Dense HUD** — mission panel with chapter, money, wanted stars, numbered weapon slots with prices, day/time, "IN SIGHT" indicator, the AZURA PD DISPATCH panel, a round minimap with a search zone and the district + street name, character dialogue with drawn portraits and role labels, a speedometer with the car name and condition, the radio station, health/armour bars, and your REP rank (STREET RAT → AZURA LEGEND).
- **Save and safehouse** — progress saves automatically (localStorage, versioned): money, health, armour, REP, position, missions, day, and radio station. Mara's Garage repairs your car.
- **Sound** — procedural WebAudio: engine hum, sirens, gunshots, punches, chimes, a radio squelch, and a bassline per radio station. No audio files.
- **Menus** — title screen, pause menu, mission-complete and busted/wasted screens.

## How to play

```sh
node serve.ts
```

Then open http://localhost:8080.

| Key | Action |
| --- | --- |
| WASD | Move / drive (W accelerate, S brake/reverse, A/D steer) |
| Mouse (drag) | Look around |
| SHIFT | Run |
| SPACE | Jump / handbrake (while driving) |
| E | Enter / steal car, exit car |
| F | Punch |
| Click | Shoot |
| 1–5 | Weapons (Fists, Pistol, SMG, Shotgun, REAPER) |
| R | Change radio station |
| Q / C / V | Crew abilities (Swap Plates / Quick Fix / Eyes Out) |
| M | Mission list |
| P | Pause |

## Tech

- three.js r160, vendored under `game/vendor/` — the game runs fully offline, no network request while playing.
- No build step: plain ES modules, Node 22 standard library only for the entry program (`main.ts` copies `game/` and `screenshots/` to `/output` and writes `dossier.json`).
- Screenshots in `screenshots/` are real renders of this code, taken in headless Chrome: `1-chase.jpg` (cover — police chase with helicopter and the dispatch voice), `2-mission.jpg` (package run to the Palm Court Hotel, mission beacon), `3-foot.jpg` (on foot in Neon Mile, street plates in frame), `4-dusk.jpg` (sunset drive on the beach road).

## Credits

Built by an AI agent for make.fun's "Make GTA 6" bounty. Entry: https://make.fun/bounty/gta6-01
