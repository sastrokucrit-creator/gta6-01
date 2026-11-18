[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/sastrokucrit-creator/gta6-01/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/sastrokucrit-creator/gta6-01/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

# AZURA BAY — an open-world crime game

A complete sun-soaked 3D open-world crime game, built for make.fun's **"Make GTA 6"** bounty (gta6-01). Everything is original: the city, the crew, the cars, the radio stations, the missions — no Rockstar names, assets, or maps.

**The story:** Jax washed up in Azura Bay with empty pockets and a reputation to rebuild. Mara, the fixer who runs the docks, has work for anyone fast enough — if the police don't catch you first. Ten jobs. One crew. No way back.

## The city

Azura Bay is a sunny coastal city: a 5×5 block grid of procedural buildings with lit windows and brightly coloured facades (pink, orange, teal, yellow), palm trees, neon signs (HOTEL, BAR, CASINO, PIER, TACOS, CLUB, SUNSET, PIER 9, WAVES), a palm-lined beach with umbrellas, benches and a ferris wheel, a wooden pier and the sea to the south, golden-hour sunsets, and seven named districts — Old Port, Docklands, Marina Walk, Palm Heights, Neon Mile, Coral Row, Sunset Quay. Jax starts with $1,500 and every mission pays a cash reward.

## What is in the game

- **Walk and drive** — third-person on foot (run, jump) and arcade driving. Get in any car; steal parked cars and NPC cars (E). Cars have names (Comet GT, Coast Cruiser, Palm Runner…), condition, and a taxi fleet.
- **Living streets** — NPC traffic drives the grid, taxis cruise, pedestrians stroll the sidewalks (and flee when scared).
- **Wanted system** — stealing, crashing, and attacking raise your wanted level (0–5 stars). Named police units (APD-1 "VULTURE", APD-2 "HAMMER"…) chase, ram, and set roadblocks; at 3+ stars a police helicopter with a searchlight keeps you in sight. Hide or outrun them to cool off.
- **10 story missions** — a connected chain with stages, timers, and dialogue: First Wheels, Package Run, Tail the Mark, Hot Pursuit, The Dock Job, Lose the Heat, The Big Score, Casino Chips, The Ferry Job, Azura Legend. Objectives, stage progress, and the next job are always on screen.
- **Combat** — fists and three firearms (Pistol, SMG, Shotgun) with ammo, unlocks, and a crosshair.
- **Radio** — four in-car stations with original songs: WAVE 88.1, PALM FM 94.5, BAY ROCK 101.2, TROPICANA 107.7. Press R to switch.
- **Dense HUD** — mission panel, money, wanted stars, numbered weapon slots, day/time, "IN SIGHT" indicator, a named police-response panel, a round minimap with the district name, character dialogue with drawn portraits, a speedometer with the car name and condition, the radio station, health/armour bars, and your REP rank (STREET RAT → AZURA LEGEND).
- **Save and safehouse** — progress saves automatically (localStorage): money, health, armour, REP, position, missions, day, and radio station. Mara's Garage repairs your car.
- **Sound** — procedural WebAudio: engine hum, sirens, gunshots, punches, chimes, and a bassline per radio station. No audio files.
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
| 1–4 | Weapons (Fists, Pistol, SMG, Shotgun) |
| R | Change radio station |
| M | Mission list |
| P | Pause |

## Tech

- three.js r160, vendored under `game/vendor/` — the game runs fully offline, no network request while playing.
- No build step: plain ES modules, Node 22 standard library only for the entry program (`main.ts` copies `game/` and `screenshots/` to `/output` and writes `dossier.json`).
- Screenshots in `screenshots/` are real renders of this code, taken in headless Chrome: `1-chase.jpg` (cover — police chase with helicopter), `2-mission.jpg` (package run, mission beacon), `3-foot.jpg` (on foot in Neon Mile), `4-dusk.jpg` (sunset drive in Docklands).

## Credits

Built by an AI agent for make.fun's "Make GTA 6" bounty. Entry: https://make.fun/bounty/gta6-01
