// Screenshot scenes behind ?shot=chase|mission|foot|dusk. Each one stages the real game
// (real traffic, peds, police, HUD) and steps it forward a fixed amount, so the frame is
// what a short play session really looks like and the same seed always gives the same frame.
import { STEP } from './config.js';

const SIM_SECONDS = 2.5;

function simulate(game, seconds) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i++) game.step(STEP);
}

// Put the player in a car and get it moving along a road.
function driveCar(game, x, z, angle, speed) {
  const car = game.nearestCar(x, z, 60, true); // prefer a non-taxi so the hero car reads as a car, not a cab
  game.teleportPlayer(x, z, angle);
  if (car) {
    // Put the car itself at the staging point too: the nearest car could be on a
    // different road, which would stage the shot somewhere unintended.
    car.x = x; car.z = z; car.angle = angle; car.speed = speed; car.sync();
    game.enterCar(car, false);
  }
  return car;
}

function policeBehind(game, dist) {
  // After a staged sim, pull any chasing police back behind the player's car so the
  // shot reads as a pursuit (not a pile-up on top of the player).
  const p = game.player.inCar || game.player;
  const fx = Math.sin(p.angle), fz = Math.cos(p.angle);
  game.wanted.police.forEach((c, i) => {
    c.x = p.x - fx * (dist + i * 6);
    c.z = p.z - fz * (dist + i * 6) + (i % 2 === 0 ? -4 : 4);
    c.angle = p.angle;
    c._dist = dist + i * 6;
    c.sync();
  });
}

export function stageShot(name, game) {
  game.reset();
  const g = game;
  if (name === 'chase') {
    // Cover: high-speed chase, wanted 4, police + helicopter + roadblock, full HUD.
    g.setWanted(4);
    g.setHeli(true);
    g.startMission(6);
    g.missions.stage = 3; // escape stage, so the panel reads STAGE 4/4
    g.missions.dialog = { who: 'MARA', text: 'Lose that helicopter before you come near my garage!' };
    g.missions.dialogT = 99;
    const car = driveCar(g, 18, -48, 0, 24);
    if (car) car.name = 'Comet GT';
    g.spawnPoliceNear(3, 12);
    g.radio.station = 0;
    simulate(g, SIM_SECONDS);
    // Re-accelerate for the frame so the speedo reads like a chase, and put one
    // police car ahead of the player so its light bar is visible on screen.
    if (car) { car.speed = 26; g.spawnPoliceAhead(30); }
    g.snapHeli(); // the heli's lerp lags a moving target — snap it into frame
    return;
  }
  if (name === 'mission') {
    // Mission in progress: package run, beacon ahead, dialogue, traffic around.
    // Drive east along the z=66 road toward the hotel at (100,66): the beacon sits
    // ahead in frame. (Road centres are -126,-78,-30,18,66,114 — z=48 is inside a
    // block, not a road.) Only a short sim: a full 2.5s drive runs the car into
    // the hotel block itself.
    g.startMission(1);
    g.missions.stage = 1; // delivery leg
    g.missions.dialog = { who: 'MARA', text: 'The hotel wants that package in 90 seconds. Don\'t get it wet!' };
    g.missions.dialogT = 99;
    const car = driveCar(g, 60, 66, Math.PI / 2, 14);
    if (car) car.name = 'Coast Cruiser';
    simulate(g, 1.0);
    if (car) car.speed = 14; // re-accelerate so the speedo reads like a drive, not a stall
    return;
  }
  if (name === 'dusk') {
    // Sunset: neon signs, orange sky, player driving the beach road south toward
    // the sea — palms, pier and sunset over the water ahead, wanted 1.
    g.setDusk(true);
    g.clockMinutes = 18 * 60 + 30; // 18:30 — the clock must match the sunset sky
    g.setWanted(1);
    g.radio.station = 3;
    const car = driveCar(g, -78, -70, Math.PI, 16);
    if (car) car.name = 'Palm Runner';
    g.missions.dialog = { who: 'LENA', text: 'Sunset on the beach road. Even the cops look good in this light.' };
    g.missions.dialogT = 99;
    simulate(g, SIM_SECONDS);
    if (car) car.speed = 16; // re-accelerate so the speedo reads like a drive, not a stall
    policeBehind(g, 14);
    return;
  }
  // Default: foot — on foot in Neon Mile, peds, taxis, mission ready.
  g.teleportPlayer(18, 18, Math.PI);
  g.missions.dialog = { who: 'DEX', text: 'Nice day for a walk, Jax. The city is yours — if you can take it.' };
  g.missions.dialogT = 99;
  // Pull six pedestrians onto the sidewalks ahead of the player so the shot shows
  // foot traffic, not an empty street.
  const pedSpots = [[10.5, 8], [25.5, 2], [10.5, -6], [25.5, 12], [14, -14], [28, -10]];
  pedSpots.forEach((s, i) => {
    const p = g.peds[i];
    if (p) { p.x = s[0]; p.z = s[1]; p.angle = Math.PI / 2; p.sync(); }
  });
  // Two traffic cars on the player's road, driving toward the camera, so the
  // street reads as alive.
  const t0 = g.traffic[0];
  if (t0) { t0.x = 18; t0.z = -24; t0.angle = 0; t0.speed = 9; t0.sync(); }
  const t1 = g.traffic[1];
  if (t1) { t1.x = 18; t1.z = -44; t1.angle = 0; t1.speed = 9; t1.sync(); }
  simulate(g, SIM_SECONDS);
}
