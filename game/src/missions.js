// Twelve story jobs for Jax and the crew (Mara the fixer, Dex the driver, Lena the hacker,
// Big T the muscle). Each mission is a chain of stages; the HUD shows MISSION X/12, the
// current stage (STAGE 1/4...), the objective and the NEXT job. Rewards pay cash + REP.
//
// Round 7: every mission is now a real conversation, not one briefing line. Each job
// opens with an exchange (Mara briefs, Jax answers — the wheelman finally talks), every
// stage starts with a spoken line from the crew member it belongs to, and every job ends
// with a personal line from the crew — all of it anchored to a NAMED VENUE (Mara's
// Garage, Pier 9, the Palm Court Hotel, Warehouse 7, the Coral Crown Casino, the yacht
// The Solstice, the Safehouse, the Hideout, Azura Airstrip, the Neon Arch), never just
// "the hotel" or "the docks". All names and lines are original. Dialogue plays through
// a queue: sayLines() shows the first line and holds the rest; updateMissions() pops
// the next line the moment the current one ends, so an exchange never overlaps the
// dispatch voice (which only cuts in when no dialogue is showing).
import * as THREE from '../vendor/three.module.min.js';
import { MISSION_REWARDS } from './config.js';
import { unlockWeapons } from './weapons.js';

export const SPEAKERS = {
  MARA: { name: 'MARA', role: 'Fixer · The Docks', initial: 'M', color: '#c0392b' },
  JAX: { name: 'JAX', role: 'Wheelman', initial: 'J', color: '#d94f3d' },
  DEX: { name: 'DEX', role: 'Driver', initial: 'D', color: '#2980b9' },
  LENA: { name: 'LENA', role: 'Hacker · Lookout', initial: 'L', color: '#8e44ad' },
  BIGT: { name: 'BIG T', role: 'Muscle', initial: 'T', color: '#27ae60' },
  DISPATCH: { name: 'SGT. REYES', role: 'AZURA PD DISPATCH', initial: 'R', color: '#3b82ff' },
};

// What Sgt. Reyes says on the radio when the heat rises — one line per wanted
// level, each naming a real Azura Bay street so the pursuit always has a place.
export const DISPATCH_LINES = {
  1: 'All units, stolen vehicle on Sunset Boulevard. Move in, keep it clean.',
  2: 'Suspect is running the Marina Walk strip. Set up on the cross streets.',
  3: 'Air One is up. Spotlight on the suspect — do not lose him in the Neon Mile.',
  4: 'Roadblock going up ahead on Coral Row. All units converge.',
  5: 'All units, full pursuit. The Crown is in that car — bring it home.',
};

// The twelve jobs run as four chapters of three, so the campaign reads like a
// story with acts instead of a flat list: small-time wheels, then the dock crew,
// then the high-stakes jobs, then the legend-making finale.
export const CHAPTERS = [
  { num: 1, name: 'FIRST WHEELS', from: 0, to: 2 },
  { num: 2, name: 'THE DOCK CREW', from: 3, to: 5 },
  { num: 3, name: 'HIGH STAKES', from: 6, to: 8 },
  { num: 4, name: 'AZURA LEGEND', from: 9, to: 11 },
];
export function chapterOf(missionId) {
  for (const c of CHAPTERS) if (missionId >= c.from && missionId <= c.to) return c;
  return CHAPTERS[0];
}

// Stage kinds: point (reach a marker), steal (get in any car), follow (stay near target car),
// ram (ram the target car N times), grab (stand in a zone), wait (survive with wanted).
// Every stage text names its venue; a stage's `line` is the spoken line that plays
// when that stage begins, from the crew member it belongs to. A mission's `done`
// is the line that plays when the job pays out ({reward} becomes the payout).
export const MISSIONS = [
  {
    id: 0, name: 'First Wheels',
    intro: [
      { who: 'MARA', text: "Welcome to Azura Bay, Jax. First rule: wheels are free if you take them. Steal a car and bring it to Mara's Garage on Dock Street." },
      { who: 'JAX', text: 'Dock Street. Got it. If the owner complains, tell him the garage owes me a paint job.' },
    ],
    stages: [
      { text: 'Steal any car (press E near one)', kind: 'steal' },
      { text: "Drive it to MARA'S GARAGE · Dock Street", kind: 'point', x: -100, z: -30, line: { who: 'DEX', text: "Nice steal. Now bring her home to Mara's Garage — Dock Street, and mind the paint." } },
    ],
    done: { who: 'MARA', text: "Clean work, Jax. {reward} is yours — Mara's Garage is already calling you family." },
  },
  {
    id: 1, name: 'Package Run',
    intro: [
      { who: 'MARA', text: 'A package is waiting at Pier 9, South Pier Road. The Palm Court Hotel wants it in 90 seconds — don\'t get it wet, don\'t get caught.' },
      { who: 'JAX', text: 'Ninety seconds from the pier to Hotel Row? Better hope the lights like me.' },
    ],
    stages: [
      { text: 'Pick up the package at PIER 9 · South Pier Road', kind: 'point', x: -100, z: -118 },
      { text: 'Deliver to THE PALM COURT HOTEL · Hotel Row (90s)', kind: 'point', x: 100, z: 66, time: 90, line: { who: 'MARA', text: 'Package in hand. The Palm Court Hotel, Hotel Row — ninety seconds, Jax. Go!' } },
    ],
    done: { who: 'DEX', text: "You made the Palm Court run with time to spare. The desk clerk thinks you're room service now." },
  },
  {
    id: 2, name: 'Tail the Mark',
    intro: [
      { who: 'LENA', text: 'I tracked the courier in the blue sedan. Follow him — close enough to see, far enough that he never notices you.' },
      { who: 'JAX', text: "A shadow with wheels. He won't even know my name." },
    ],
    stages: [
      { text: 'Tail the blue sedan — stay within 25m for 12s', kind: 'follow', need: 12, range: 25 },
    ],
    done: { who: 'LENA', text: "He never looked back once. That's a tail, Jax. Textbook." },
  },
  {
    id: 3, name: 'Hot Pursuit',
    intro: [
      { who: 'DEX', text: 'That sedan is running! Ram him three times or stick to his bumper for 5 seconds. My car can take it. Probably.' },
      { who: 'JAX', text: 'Your car, your funeral. Hold on, Dex.' },
    ],
    stages: [
      { text: 'Ram the blue sedan 3 times, or tail it for 5s', kind: 'ram', need: 3 },
    ],
    done: { who: 'DEX', text: 'Three hits and he folded! I told you my car could take it. Mostly.' },
  },
  {
    id: 4, name: 'The Dock Job',
    intro: [
      { who: 'BIGT', text: 'Warehouse 7 on Airstrip Road. Cash inside, guards outside. Grab it, then run — the law will come, count on it.' },
      { who: 'JAX', text: 'Guards outside, cash inside. My favourite kind of math.' },
    ],
    stages: [
      { text: 'Reach WAREHOUSE 7 · Airstrip Road', kind: 'point', x: -100, z: 114 },
      { text: 'Grab the cash in WAREHOUSE 7 — hold 3s', kind: 'grab', x: -100, z: 114, hold: 3, line: { who: 'LENA', text: "You're in Warehouse 7. Hold the floor — three seconds and the cash is ours." } },
      { text: 'Escape to THE HIDEOUT · Coral Avenue (2★)', kind: 'escape', x: 66, z: 114, wanted: 2, line: { who: 'BIGT', text: "Cash is ours! Run for the Hideout on Coral Avenue — and don't stop for anything in a uniform." } },
    ],
    done: { who: 'BIGT', text: "Warehouse 7 cleaned out and nobody caught a name. That's how the crew eats." },
  },
  {
    id: 5, name: 'Lose the Heat',
    intro: [
      { who: 'MARA', text: 'Three stars and a chopper, Jax. Lose that helicopter before you come near the Safehouse on Dock Street!' },
      { who: 'JAX', text: 'A chopper, Mara? You said this town was quiet.' },
    ],
    stages: [
      { text: 'Survive the manhunt for 20 seconds', kind: 'wait', time: 20, wanted: 3, heli: true },
      { text: 'Reach THE SAFEHOUSE · Dock Street', kind: 'point', x: 0, z: -30, line: { who: 'MARA', text: 'The sky is clear. Get to the Safehouse, Dock Street — and park like you own the place.' } },
    ],
    done: { who: 'MARA', text: "Heat's off. You drive like the bay is yours, Jax." },
  },
  {
    id: 6, name: 'The Big Score',
    intro: [
      { who: 'MARA', text: 'One last job, crew. Pick up Dex and Lena, hit the yacht The Solstice at Marina Walk, then run for the airstrip. Make us legends.' },
      { who: 'DEX', text: 'The Solstice? Mara, that yacht has its own zip code.' },
      { who: 'LENA', text: "And a crew that counts its silverware. Move fast, Jax." },
    ],
    stages: [
      { text: "Pick up Dex at MARA'S GARAGE · Dock Street", kind: 'point', x: -100, z: -30 },
      { text: 'Pick up Lena at THE NEON ARCH · Neon Avenue', kind: 'point', x: 18, z: 18, line: { who: 'DEX', text: "Dex is in! The Neon Arch, Neon Avenue — Lena's waiting under the lights." } },
      { text: 'Reach the yacht THE SOLSTICE · Marina Walk', kind: 'point', x: 100, z: -122, line: { who: 'LENA', text: "All aboard. The Solstice is moored at Marina Walk — grab what shines and don't wave at the cameras." } },
      { text: 'Escape to AZURA AIRSTRIP · Airstrip Road (4★)', kind: 'escape', x: 0, z: 114, wanted: 4, line: { who: 'BIGT', text: "Score's in the bag! Airstrip Road, full speed — four stars and the whole bay behind us!" } },
    ],
    done: { who: 'MARA', text: 'The Solstice job, clean. {reward}. The bay is starting to say our names.' },
  },
  {
    id: 7, name: 'Casino Chips',
    intro: [
      { who: 'DEX', text: 'The Coral Crown Casino skims chips off every table on Casino Row. Walk in, grab the bag, and don\'t stop running till you\'re clear.' },
      { who: 'JAX', text: 'Walk into the Crown, take the chips, walk out rich. What could go wrong?' },
    ],
    stages: [
      { text: 'Reach THE CORAL CROWN CASINO · Casino Row', kind: 'point', x: 114, z: 18 },
      { text: 'Grab the chip bag in THE CORAL CROWN — hold 3s', kind: 'grab', x: 114, z: 18, hold: 3, line: { who: 'LENA', text: "You're on the floor of the Coral Crown. Hold three seconds — the bag is under the cashier's desk." } },
      { text: 'Escape to THE SAFEHOUSE · Dock Street (2★, 120s)', kind: 'escape', x: 0, z: -30, wanted: 2, time: 120, line: { who: 'BIGT', text: "Chips in hand! Safehouse, Dock Street — two stars, two minutes, don't get cute." } },
    ],
    done: { who: 'DEX', text: 'The Coral Crown just funded our retirement. Well — our next car.' },
  },
  {
    id: 8, name: 'The Ferry Job',
    intro: [
      { who: 'LENA', text: 'A ferry leaves Pier 9 at dawn with a car the crew needs. Steal a ride and deliver it to the pier — quiet, no heat.' },
      { who: 'JAX', text: 'A car for a ferry. Quiet, no heat. I can do quiet.' },
    ],
    stages: [
      { text: 'Steal any car (press E near one)', kind: 'steal' },
      { text: 'Deliver the car to PIER 9 · South Pier Road', kind: 'point', x: -78, z: -118, line: { who: 'LENA', text: "Ride's yours. Pier 9, South Pier Road — deliver it before dawn breaks." } },
    ],
    done: { who: 'LENA', text: 'Delivered, no heat, no names. The ferry crew owes us one.' },
  },
  {
    id: 9, name: 'Azura Legend',
    intro: [
      { who: 'BIGT', text: "Last one, Jax. Tail the mayor's courier, then run for the airstrip with everything on you. Make it count — make us legends." },
      { who: 'JAX', text: "The mayor's own courier. If we pull this off, the whole bay will know the name Jax." },
    ],
    stages: [
      { text: "Tail the mayor's courier — stay within 25m for 12s", kind: 'follow', need: 12, range: 25 },
      { text: 'Escape to AZURA AIRSTRIP · Airstrip Road (4★)', kind: 'escape', x: 0, z: 114, wanted: 4, line: { who: 'BIGT', text: "He's made you? No — he's just scared. Airstrip Road, Jax — everything on you, everything on the line!" } },
    ],
    done: { who: 'MARA', text: "The mayor's courier, tailed and beaten. {reward}. Legends don't ask permission, Jax." },
  },
  {
    id: 10, name: 'Harbor Lights',
    intro: [
      { who: 'LENA', text: 'A courier left a package at Marina Walk, down by the south pier. Pick it up and bring it to the Safehouse — the harbor patrol watches the marina, so don\'t linger.' },
      { who: 'JAX', text: 'Harbor patrol, a package, a pier at dawn. Sounds like a postcard.' },
    ],
    stages: [
      { text: 'Steal any car (press E near one)', kind: 'steal' },
      { text: 'Drive to the marina — THE SOLSTICE berth · Marina Walk', kind: 'point', x: 100, z: -122 },
      { text: 'Grab the package at the marina — hold 3s', kind: 'grab', x: 100, z: -122, hold: 3, line: { who: 'DEX', text: "You're at the marina. Grab the package and go — harbor patrol does rounds every ten minutes." } },
      { text: 'Escape to THE SAFEHOUSE · Dock Street (3★)', kind: 'escape', x: 0, z: -30, wanted: 3, line: { who: 'LENA', text: 'Package secure! Safehouse, Dock Street — three stars, and the patrol is already turning around.' } },
    ],
    done: { who: 'LENA', text: 'Harbor Lights, done. The patrol never even saw your plates.' },
  },
  {
    id: 11, name: 'The Azura Crown',
    intro: [
      { who: 'MARA', text: "One last job, and it's the biggest. The Crown of Azura is on display at the Palm Court Hotel — Dex and Lena are in. Pick them up, take the crown, and run for the airstrip with everything on you. Make us legends." },
      { who: 'JAX', text: "The Crown of Azura. From the Palm Court to the airstrip, five stars. Let's make history." },
      { who: 'DEX', text: 'Five stars, Jax. My car better be ready.' },
    ],
    stages: [
      { text: "Pick up Dex at MARA'S GARAGE · Dock Street", kind: 'point', x: -100, z: -30 },
      { text: 'Pick up Lena at THE NEON ARCH · Neon Avenue', kind: 'point', x: 18, z: 18, line: { who: 'DEX', text: "Dex is riding shotgun. The Neon Arch — Lena's next, then the Palm Court." } },
      { text: 'Grab THE CROWN at THE PALM COURT HOTEL · Hotel Row — hold 3s', kind: 'grab', x: 100, z: 66, hold: 3, line: { who: 'LENA', text: 'The Crown is on the second floor of the Palm Court Hotel. Hold the floor — three seconds and Azura is ours.' } },
      { text: 'Escape to AZURA AIRSTRIP · Airstrip Road (5★, 150s)', kind: 'escape', x: 0, z: 114, wanted: 5, time: 150, line: { who: 'BIGT', text: 'THE CROWN IS OURS! Airstrip Road — five stars, one hundred and fifty seconds, and the whole of Azura Bay behind us!' } },
    ],
    done: { who: 'MARA', text: 'The Crown of Azura. {reward}. RANK 6 — AZURA LEGEND. The bay is yours, Jax.' },
  },
];

export function createMissionState(scene) {
  const geo = new THREE.CylinderGeometry(2.2, 2.2, 30, 20, 1, true);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff4fd8, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false });
  const beacon = new THREE.Mesh(geo, mat);
  beacon.visible = false;
  scene.add(beacon);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.4, 0.18, 8, 28),
    new THREE.MeshBasicMaterial({ color: 0xff4fd8 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.visible = false;
  scene.add(ring);
  return {
    active: -1, stage: 0, timer: 0, done: [false, false, false, false, false, false, false, false, false, false, false, false],
    beacon, ring, targetCar: null, hits: 0, closeT: 0, holdT: 0, waitT: 0,
    dialog: null, dialogT: 0, dialogQueue: [],
  };
}

// Show one line now, replacing anything queued (a direct line always wins:
// a dispatch call, a mission-complete line or a failure must never be followed
// by a stale queued briefing).
export function say(ms, who, text, seconds) {
  ms.dialog = { who, text };
  ms.dialogT = seconds || 6;
  ms.dialogQueue = [];
}

// Show an exchange: the first line now, the rest queued. updateMissions()
// pops the next line the moment the current one ends.
export function sayLines(ms, lines) {
  if (!lines || lines.length === 0) return;
  const [first, ...rest] = lines;
  say(ms, first.who, first.text, first.seconds || 7);
  ms.dialogQueue = rest.map((l) => ({ who: l.who, text: l.text, seconds: l.seconds || 6 }));
}

export function startMission(ms, id, game) {
  ms.active = id;
  ms.stage = 0; ms.hits = 0; ms.closeT = 0; ms.holdT = 0; ms.waitT = 0;
  ms.timer = 0;
  const m = MISSIONS[id];
  sayLines(ms, m.intro);
  game.toast(`${m.name} — mission started!`);
  // Any mission with a follow/ram stage needs a target car on the road.
  if (m.stages.some((s) => s.kind === 'follow' || s.kind === 'ram')) {
    game.spawnTargetCar(m.stages.some((s) => s.kind === 'ram') ? 'flee' : 'loop');
  }
  const st = m.stages[0];
  if (st && st.wanted) game.setWanted(st.wanted);
  if (st && st.heli) game.setHeli(true);
}

export function stageTarget(ms) {
  if (ms.active < 0) return null;
  const st = MISSIONS[ms.active].stages[ms.stage];
  if (!st) return null;
  if (st.kind === 'follow' || st.kind === 'ram') return ms.targetCar ? { x: ms.targetCar.x, z: ms.targetCar.z } : null;
  if (st.x !== undefined) return { x: st.x, z: st.z };
  return null;
}

export function missionTarget(ms) { return stageTarget(ms); }

function advanceStage(ms, game) {
  ms.stage++;
  ms.closeT = 0; ms.holdT = 0; ms.waitT = 0; ms.timer = 0;
  const m = MISSIONS[ms.active];
  if (ms.stage >= m.stages.length) return completeMission(ms, game);
  const st = m.stages[ms.stage];
  if (st.wanted) game.setWanted(st.wanted);
  if (st.heli) game.setHeli(true);
  // A stage with its own line speaks it (the crew member the stage belongs
  // to, naming the venue); otherwise the stage-advance voice rotates by what
  // the stage asks for: Dex calls the driving, Lena the tails and grabs,
  // Big T the escapes, Mara the rest.
  if (st.line) say(ms, st.line.who, st.line.text, 5);
  else {
    const voice = { ram: 'DEX', follow: 'LENA', grab: 'LENA', escape: 'BIGT' }[st.kind] || 'MARA';
    say(ms, voice, `Next: ${st.text}`, 4);
  }
}

export function updateMissions(ms, dt, game, player) {
  if (ms.dialogT > 0) ms.dialogT -= dt;
  // Dialogue queue: the moment a line ends, the next queued line starts, so
  // an exchange plays through with no gap for the dispatch voice to cut into.
  if (ms.dialogT <= 0 && ms.dialogQueue.length > 0) {
    const n = ms.dialogQueue.shift();
    ms.dialog = { who: n.who, text: n.text };
    ms.dialogT = n.seconds || 6;
  }
  if (ms.active < 0) { ms.beacon.visible = false; ms.ring.visible = false; return; }
  const m = MISSIONS[ms.active];
  const st = m.stages[ms.stage];
  const t = stageTarget(ms);
  if (t) {
    ms.beacon.visible = true; ms.ring.visible = true;
    ms.beacon.position.set(t.x, 15, t.z);
    ms.ring.position.set(t.x, 0.25 + Math.sin(performance.now() / 300) * 0.15, t.z);
    ms.beacon.material.opacity = 0.2 + 0.1 * Math.sin(performance.now() / 240);
  } else { ms.beacon.visible = false; ms.ring.visible = false; }
  const d = t ? Math.hypot(player.x - t.x, player.z - t.z) : 999;

  // Countdowns run on timed deliveries and timed escapes alike: the clock starts
  // when the stage starts and the job fails when it hits zero.
  if (st.time && (st.kind === 'point' || st.kind === 'escape')) {
    if (ms.timer <= 0) ms.timer = st.time;
    ms.timer -= dt;
    if (ms.timer <= 0) return failMission(ms, game, 'Out of time — the job failed.');
  }
  switch (st.kind) {
    case 'point':
    case 'escape':
      if (d < 6) {
        if (st.kind === 'escape' && ms.active === 4 && game.wanted.stars > 0 && ms.stage === 2) {
          // Dock Job escape: arrival counts even with heat; the chase is the point.
        }
        if (st.kind === 'point' && ms.active === 0 && ms.stage === 1) game.garageRepair();
        advanceStage(ms, game);
      }
      break;
    case 'steal':
      if (player.inCar) advanceStage(ms, game);
      break;
    case 'follow': {
      const tc = ms.targetCar;
      if (!tc) return failMission(ms, game, 'The mark got away.');
      if (d < st.range) ms.closeT += dt;
      if (ms.closeT >= st.need) advanceStage(ms, game);
      break;
    }
    case 'ram': {
      const tc = ms.targetCar;
      if (!tc) return failMission(ms, game, 'The target escaped.');
      if (d < 14) ms.closeT += dt; else ms.closeT = 0;
      if (ms.hits >= st.need || ms.closeT >= 5) advanceStage(ms, game);
      break;
    }
    case 'grab':
      if (d < 6) {
        ms.holdT += dt;
        if (ms.holdT >= st.hold) advanceStage(ms, game);
      } else ms.holdT = 0;
      break;
    case 'wait':
      ms.waitT += dt;
      if (ms.waitT >= st.time) advanceStage(ms, game);
      break;
    default:
      break;
  }
}

export function completeMission(ms, game) {
  const reward = MISSION_REWARDS[ms.active];
  game.player.money += reward;
  game.addRep(250 + ms.active * 60);
  ms.done[ms.active] = true;
  // A gun unlocks the moment the job that earns it is done — not on the next
  // load. A weapon earned mid-session must be selectable mid-session.
  unlockWeapons(game.weapons, ms.done);
  const newly = game.weapons.slots.filter((s) => !s.locked && s.unlockMission === ms.active).map((s) => s.name);
  game.toast(`Mission complete! +$${reward}${newly.length ? ` — ${newly.join(', ')} unlocked!` : ''}`);
  const m = MISSIONS[ms.active];
  const d = m.done || { who: 'MARA', text: 'Clean work, Jax. {reward} is yours. The crew is talking about you.' };
  say(ms, d.who, d.text.replace('{reward}', `$${reward}`), 6);
  if (ms.targetCar) { ms.targetCar.mode = 'traffic'; ms.targetCar = null; }
  game.setHeli(false);
  ms.active = -1;
  game.save();
}

export function failMission(ms, game, why) {
  say(ms, 'MARA', why, 6);
  if (ms.targetCar) { ms.targetCar.mode = 'traffic'; ms.targetCar = null; }
  game.setHeli(false);
  ms.active = -1;
  game.clearWantedSoft();
}

export function nextMission(ms) {
  for (let i = 0; i < MISSIONS.length; i++) if (!ms.done[i]) return i;
  return -1;
}
