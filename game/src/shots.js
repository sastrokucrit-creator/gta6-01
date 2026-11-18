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
  // Mid-game staging: the shots show a player who has already earned their
  // keep — several jobs done, a fat wallet, a REP rank to match — so the HUD
  // reads like a career in progress, not a fresh start.
  g.player.money = 12400;
  g.player.rep = 1200;
  if (name === 'chase') {
    // Cover: high-speed chase at golden hour, wanted 4, police + helicopter +
    // roadblock, full HUD. The low amber sun and warm haze do the cinematic work.
    g.setDusk(true);
    g.clockMinutes = 18 * 60 + 32; // 18:32 — the clock must match the sunset sky
    g.setWanted(4);
    g.setHeli(true);
    g.startMission(6);
    g.missions.stage = 3; // escape stage, so the panel reads STAGE 4/4
    g.missions.dialog = { who: 'MARA', text: 'Lose that helicopter before you come near my garage!' };
    g.missions.dialogT = 99;
    const car = driveCar(g, 18, -48, 0, 24);
    if (car) car.name = 'Comet GT';
    g.spawnPoliceNear(3, 12);
    // Busy street: pedestrians on both sidewalks and traffic in both lanes,
    // offset so the chase car threads between them instead of piling into them.
    const chasePeds = [[10.5, -30], [25.5, -20], [10.5, -5], [25.5, 10]];
    chasePeds.forEach((s, i) => {
      const p = g.peds[6 + i];
      if (p) { p.x = s[0]; p.z = s[1]; p.angle = Math.PI / 2; p.sync(); }
    });
    const ct0 = g.traffic[2];
    if (ct0) { ct0.x = 22; ct0.z = -30; ct0.angle = 0; ct0.speed = 10; ct0.sync(); }
    const ct1 = g.traffic[3];
    if (ct1) { ct1.x = 22; ct1.z = -10; ct1.angle = 0; ct1.speed = 10; ct1.sync(); }
    const ct2 = g.traffic[4];
    if (ct2) { ct2.x = 14; ct2.z = 30; ct2.angle = Math.PI; ct2.speed = 9; ct2.sync(); }
    g.radio.station = 0;
    simulate(g, SIM_SECONDS);
    // Re-accelerate for the frame so the speedo reads like a chase, and put one
    // police car ahead of the player so its light bar is visible on screen.
    if (car) { car.speed = 26; g.spawnPoliceAhead(30); }
    g.snapHeli(); // the heli's lerp lags a moving target — snap it into frame
    // Bigger, closer chopper for the cover: pull it in from 36m to ~24m ahead,
    // lower, and scale it up so the spotlight reads.
    {
      const p = g.player.inCar || g.player;
      const fx = Math.sin(p.angle), fz = Math.cos(p.angle);
      g.heli.x = p.x + fx * 24;
      g.heli.z = p.z + fz * 24;
      g.heli.y = 6.5;
      g.heli.mesh.position.set(g.heli.x, g.heli.y, g.heli.z);
      g.heli.mesh.scale.set(2.0, 2.0, 2.0);
      const ud = g.heli.mesh.userData;
      ud.spotTarget.position.set(p.x - g.heli.x, -g.heli.y, p.z - g.heli.z);
      ud.pool.position.set(p.x - g.heli.x, -g.heli.y + 0.3, p.z - g.heli.z);
    }
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
    // Busy street: pedestrians on the sidewalks and traffic in both lanes.
    const missionPeds = [[80, 58.5], [95, 73.5], [70, 73.5], [105, 58.5]];
    missionPeds.forEach((s, i) => {
      const p = g.peds[6 + i];
      if (p) { p.x = s[0]; p.z = s[1]; p.angle = Math.PI / 2; p.sync(); }
    });
    const mt0 = g.traffic[2];
    if (mt0) { mt0.x = 90; mt0.z = 70; mt0.angle = Math.PI / 2; mt0.speed = 10; mt0.sync(); }
    const mt1 = g.traffic[3];
    if (mt1) { mt1.x = 110; mt1.z = 62; mt1.angle = -Math.PI / 2; mt1.speed = 9; mt1.sync(); }
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
