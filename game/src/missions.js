// Twelve story jobs for Jax and the crew (Mara the fixer, Dex the driver, Lena the hacker,
// Big T the muscle). Each mission is a chain of stages; the HUD shows MISSION X/12, the
// current stage (STAGE 1/4...), the objective and the NEXT job. Rewards pay cash + REP.
import * as THREE from '../vendor/three.module.min.js';
import { MISSION_REWARDS } from './config.js';
import { unlockWeapons } from './weapons.js';

export const SPEAKERS = {
  MARA: { name: 'MARA', initial: 'M', color: '#c0392b' },
  JAX: { name: 'JAX', initial: 'J', color: '#d94f3d' },
  DEX: { name: 'DEX', initial: 'D', color: '#2980b9' },
  LENA: { name: 'LENA', initial: 'L', color: '#8e44ad' },
  BIGT: { name: 'BIG T', initial: 'T', color: '#27ae60' },
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
export const MISSIONS = [
  {
    id: 0, name: 'First Wheels',
    intro: { who: 'MARA', text: 'Welcome to Azura Bay, Jax. First rule: wheels are free if you take them. Steal a car and bring it to my garage in Docklands.' },
    stages: [
      { text: 'Steal any car (press E near one)', kind: 'steal' },
      { text: 'Drive it to Mara\'s garage', kind: 'point', x: -100, z: -30 },
    ],
  },
  {
    id: 1, name: 'Package Run',
    intro: { who: 'MARA', text: 'A package is waiting on the south pier. The hotel wants it in 90 seconds — don\'t get it wet, don\'t get caught.' },
    stages: [
      { text: 'Pick up the package at the south pier', kind: 'point', x: -100, z: -118 },
      { text: 'Deliver to the hotel before the timer ends', kind: 'point', x: 100, z: 66, time: 90 },
    ],
  },
  {
    id: 2, name: 'Tail the Mark',
    intro: { who: 'LENA', text: 'I tracked the courier in the blue sedan. Follow him — close enough to see, far enough that he never notices you.' },
    stages: [
      { text: 'Tail the blue sedan — stay within 25m for 12s', kind: 'follow', need: 12, range: 25 },
    ],
  },
  {
    id: 3, name: 'Hot Pursuit',
    intro: { who: 'DEX', text: 'That sedan is running! Ram him three times or stick to his bumper for 5 seconds. My car can take it. Probably.' },
    stages: [
      { text: 'Ram the blue sedan 3 times, or tail it for 5s', kind: 'ram', need: 3 },
    ],
  },
  {
    id: 4, name: 'The Dock Job',
    intro: { who: 'BIGT', text: 'Warehouse on the docks. Cash inside, guards outside. Grab it, then run — the law will come, count on it.' },
    stages: [
      { text: 'Reach the warehouse on the docks', kind: 'point', x: -100, z: 114 },
      { text: 'Grab the cash — hold the zone for 3s', kind: 'grab', x: -100, z: 114, hold: 3 },
      { text: 'Escape to the hideout with the heat on', kind: 'escape', x: 66, z: 114, wanted: 2 },
    ],
  },
  {
    id: 5, name: 'Lose the Heat',
    intro: { who: 'MARA', text: 'Three stars and a chopper, Jax. Lose that helicopter before you come near my garage!' },
    stages: [
      { text: 'Survive the manhunt for 20 seconds', kind: 'wait', time: 20, wanted: 3, heli: true },
      { text: 'Reach the hideout once the heat cools', kind: 'point', x: 0, z: -30 },
    ],
  },
  {
    id: 6, name: 'The Big Score',
    intro: { who: 'MARA', text: 'One last job, crew. Pick up Dex and Lena, hit the yacht at Marina Walk, then run for the airstrip. Make us legends.' },
    stages: [
      { text: 'Pick up Dex at the garage', kind: 'point', x: -100, z: -30 },
      { text: 'Pick up Lena in Neon Mile', kind: 'point', x: 18, z: 18 },
      { text: 'Reach the yacht at Marina Walk', kind: 'point', x: 100, z: -122 },
      { text: 'Escape to the airstrip — four stars and counting', kind: 'escape', x: 0, z: 114, wanted: 4 },
    ],
  },
  {
    id: 7, name: 'Casino Chips',
    intro: { who: 'DEX', text: 'The Coral Row casino skims chips off every table. Walk in, grab the bag, and don\'t stop running till you\'re clear.' },
    stages: [
      { text: 'Reach the Coral Row casino', kind: 'point', x: 114, z: 18 },
      { text: 'Grab the chip bag — hold the floor for 3s', kind: 'grab', x: 114, z: 18, hold: 3 },
      { text: 'Escape to the hideout before the timer ends', kind: 'escape', x: 0, z: -30, wanted: 2, time: 120 },
    ],
  },
  {
    id: 8, name: 'The Ferry Job',
    intro: { who: 'LENA', text: 'A ferry leaves the south pier at dawn with a car the crew needs. Steal a ride and deliver it to the pier — quiet, no heat.' },
    stages: [
      { text: 'Steal any car (press E near one)', kind: 'steal' },
      { text: 'Deliver the car to the south pier', kind: 'point', x: -78, z: -118 },
    ],
  },
  {
    id: 9, name: 'Azura Legend',
    intro: { who: 'BIGT', text: 'Last one, Jax. Tail the mayor\'s courier, then run for the airstrip with everything on you. Make it count — make us legends.' },
    stages: [
      { text: 'Tail the mayor\'s courier — stay within 25m for 12s', kind: 'follow', need: 12, range: 25 },
      { text: 'Escape to the airstrip — four stars and counting', kind: 'escape', x: 0, z: 114, wanted: 4 },
    ],
  },
  {
    id: 10, name: 'Harbor Lights',
    intro: { who: 'LENA', text: 'A courier left a package at Marina Walk, down by the south pier. Pick it up and bring it to the hideout — the harbor patrol watches the marina, so don\'t linger.' },
    stages: [
      { text: 'Steal any car (press E near one)', kind: 'steal' },
      { text: 'Drive to the marina at Marina Walk', kind: 'point', x: 100, z: -122 },
      { text: 'Grab the package — hold the zone for 3s', kind: 'grab', x: 100, z: -122, hold: 3 },
      { text: 'Escape to the hideout with the heat on', kind: 'escape', x: 0, z: -30, wanted: 3 },
    ],
  },
  {
    id: 11, name: 'The Azura Crown',
    intro: { who: 'MARA', text: 'One last job, and it\'s the biggest. The Crown of Azura is on display at the hotel — Dex and Lena are in. Pick them up, take the crown, and run for the airstrip with everything on you. Make us legends.' },
    stages: [
      { text: 'Pick up Dex at the garage', kind: 'point', x: -100, z: -30 },
      { text: 'Pick up Lena in Neon Mile', kind: 'point', x: 18, z: 18 },
      { text: 'Grab the crown — hold the floor for 3s', kind: 'grab', x: 100, z: 66, hold: 3 },
      { text: 'Escape to the airstrip before the timer ends — five stars and counting', kind: 'escape', x: 0, z: 114, wanted: 5, time: 150 },
    ],
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
    dialog: null, dialogT: 0,
  };
}

export function say(ms, who, text, seconds) {
  ms.dialog = { who, text };
  ms.dialogT = seconds || 6;
}

export function startMission(ms, id, game) {
  ms.active = id;
  ms.stage = 0; ms.hits = 0; ms.closeT = 0; ms.holdT = 0; ms.waitT = 0;
  ms.timer = 0;
  const m = MISSIONS[id];
  say(ms, m.intro.who, m.intro.text, 7);
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
  say(ms, 'MARA', `Next: ${st.text}`, 4);
}

export function updateMissions(ms, dt, game, player) {
  if (ms.dialogT > 0) ms.dialogT -= dt;
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

  // Countdown timers run on point deliveries and on timed escapes: the clock
  // starts when the stage starts and the job fails when it hits zero.
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
  // Weapons unlock the moment the job that earns them is done — not on the next
  // load. A gun earned mid-session must be selectable mid-session.
  unlockWeapons(game.weapons, ms.done);
  const newly = game.weapons.slots.filter((s) => !s.locked && s.unlockMission === ms.active).map((s) => s.name);
  game.toast(`Mission complete! +$${reward}${newly.length ? ` — ${newly.join(', ')} unlocked!` : ''}`);
  say(ms, 'MARA', `Clean work, Jax. $${reward} is yours. The crew is talking about you.`, 6);
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
