// Wanted: 0-5 stars. Crimes add stars; named police units spawn and chase; at 4+ stars a
// roadblock forms ahead of the player; stars decay when the player stays out of sight.
// The HUD's POLICE RESPONSE panel reads unitList(): each unit's name, distance in metres
// and status (PURSUIT / RAMMING / ROADBLOCK).
import { WANTED_MAX, HALF } from './config.js';
import { spawnPolice, updatePolice, makeCarMesh, Car, POLICE_COLOR } from './vehicles.js';

const UNIT_NAMES = ['APD-1 "VULTURE"', 'APD-2 "HAMMER"', 'APD-3 "VIPER"', 'APD-4 "FALCON"', 'APD-5 "BULLDOG"', 'APD-6 "COBRA"', 'APD-7 "HAWK"', 'APD-8 "TALON"'];

export function createWanted() {
  return { stars: 0, heat: 0, quiet: 0, police: [], roadblock: [], roadblockT: 0, nearest: Infinity, seen: false, ghostT: 0 };
}

export function addWanted(w, n) {
  w.stars = Math.min(WANTED_MAX, w.stars + n);
  w.quiet = 0;
}

export function clearWanted(w, scene) {
  w.stars = 0; w.quiet = 0;
  for (const c of w.police) scene.remove(c.mesh);
  w.police = [];
  clearRoadblock(w, scene);
}

export function clearRoadblock(w, scene) {
  for (const c of w.roadblock) scene.remove(c.mesh);
  w.roadblock = [];
}

function spawnSpot(rng, px, pz) {
  const a = rng() * Math.PI * 2;
  const d = 55 + rng() * 25;
  return { x: Math.max(-HALF, Math.min(HALF, px + Math.cos(a) * d)), z: Math.max(-HALF, Math.min(HALF, pz + Math.sin(a) * d)) };
}

function makeRoadblock(w, scene, px, pz, angle, rng) {
  clearRoadblock(w, scene);
  // Two police cars parked across the road ahead of the player.
  const fx = Math.sin(angle), fz = Math.cos(angle);
  const cx = px + fx * 34, cz = pz + fz * 34;
  const px2 = -fz, pz2 = fx; // perpendicular
  for (const off of [-4.5, 4.5]) {
    const mesh = makeCarMesh(POLICE_COLOR, true);
    scene.add(mesh);
    const car = new Car(mesh, cx + px2 * off, cz + pz2 * off, angle + Math.PI / 2, 'roadblock', 'APD Roadblock');
    car.speed = 0;
    w.roadblock.push(car);
  }
  w.roadblockT = 0;
}

// Units for the POLICE RESPONSE panel: name, distance (m), status.
export function unitList(w) {
  const out = [];
  w.police.forEach((c, i) => {
    out.push({ name: UNIT_NAMES[i % UNIT_NAMES.length], dist: Math.round(c._dist ?? 0), status: (c._dist ?? 99) < 8 ? 'RAMMING' : 'PURSUIT' });
  });
  if (w.roadblock.length > 0) out.push({ name: 'APD ROADBLOCK', dist: 34, status: 'ROADBLOCK' });
  return out;
}

export function updateWanted(w, dt, scene, rng, px, pz, angle, onBusted) {
  const wantCount = w.stars === 0 ? 0 : Math.min(2 + w.stars, 6);
  while (w.police.length < wantCount) {
    const s = spawnSpot(rng, px, pz);
    w.police.push(spawnPolice(scene, s.x, s.z, UNIT_NAMES[w.police.length % UNIT_NAMES.length]));
  }
  while (w.police.length > wantCount) {
    const c = w.police.pop();
    scene.remove(c.mesh);
  }
  let nearest = Infinity;
  // Ghost window (Lena's EYES OUT): police cruise at half speed and cannot see
  // the player, so the heat cannot find its target while it lasts.
  const ghost = w.ghostT > 0;
  for (const c of w.police) {
    const d = updatePolice(c, dt, px, pz, (16 + w.stars * 2.2) * (ghost ? 0.5 : 1));
    c._dist = d;
    nearest = Math.min(nearest, d);
    if (d < 2.6) onBusted();
  }
  // Roadblock at 4+ stars, refreshed ahead of the player every 12 s.
  if (w.stars >= 4) {
    w.roadblockT += dt;
    if (w.roadblock.length === 0 || w.roadblockT > 12) makeRoadblock(w, scene, px, pz, angle, rng);
  } else if (w.roadblock.length > 0) clearRoadblock(w, scene);
  w.nearest = nearest;
  w.seen = nearest < 40;
  if (ghost) w.seen = false; // cameras looped: unseen even at close range
  if (w.stars > 0) {
    if (nearest > 55) w.quiet += dt;
    else w.quiet = 0;
    if (w.quiet > 14) { w.stars -= 1; w.quiet = 0; }
  }
  return nearest;
}
