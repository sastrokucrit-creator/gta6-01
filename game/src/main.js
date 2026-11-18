// Azura Bay — boot and the one loop. The game runs in fixed 1/60 s steps; the camera
// follows third-person (on foot or in a car); the HUD is dense on all sides. ?seed=N fixes
// the city; ?shot=chase|mission|foot|dusk stages that scene, paints it a few times and
// sets window.__shotReady for a screenshot. ?dusk=1 forces sunset lighting.
import * as THREE from '../vendor/three.module.min.js';
import { STEP, HALF, ROAD_CENTERS, CAR, repRank } from './config.js';
import { makeRng } from './rng.js';
import { buildCity, hitsBuilding } from './city.js';
import { spawnTraffic, spawnParked, spawnPolice, updateTraffic, updatePolice, updateTarget, makeCarMesh, Car, POLICE_COLOR } from './vehicles.js';
import { spawnPeds, updatePeds } from './peds.js';
import { createPlayer, updateFoot, updateDrive } from './player.js';
import { createWanted, addWanted, clearWanted, updateWanted, clearRoadblock } from './wanted.js';
import { createHeli, updateHeli } from './heli.js';
import { MISSIONS, createMissionState, startMission, updateMissions, missionTarget, nextMission } from './missions.js';
import { createCombat, punch, shoot, updateCombat } from './combat.js';
import { createWeapons, currentWeapon, selectWeapon, unlockWeapons, spendAmmo, refillAmmo } from './weapons.js';
import { createRadio, nextStation, updateRadio, radioLabel } from './radio.js';
import { createAudio } from './audio.js';
import { initHud, updateHud, toast } from './hud.js';
import { saveGame, loadGame, hasSave } from './save.js';
import { initInput, keys, consumeClick, consumeLook } from './input.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 1;
const duskParam = params.get('dusk') === '1' || shot === 'dusk';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const rng = makeRng(seed);

// --- Scene ---
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(1);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87b5d6);
scene.fog = new THREE.Fog(0x87b5d6, 180, 420);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 900);
const hemi = new THREE.HemisphereLight(0xbfd9ff, 0x8a7a5a, 0.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2cc, 2.2);
sun.position.set(80, 140, 40);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -160; sun.shadow.camera.right = 160;
sun.shadow.camera.top = 160; sun.shadow.camera.bottom = -160;
sun.shadow.camera.far = 400;
scene.add(sun);
// Low golden sun disc + halo over the sea (visible only at dusk, low on the horizon).
const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(16, 32), new THREE.MeshBasicMaterial({ color: 0xffc46b, fog: false }));
sunDisc.position.set(-60, 24, -280);
sunDisc.visible = false;
scene.add(sunDisc);
const sunHalo = new THREE.Mesh(new THREE.CircleGeometry(30, 32), new THREE.MeshBasicMaterial({ color: 0xff9a3d, transparent: true, opacity: 0.28, fog: false, depthWrite: false }));
sunHalo.position.set(-60, 24, -282);
sunHalo.visible = false;
scene.add(sunHalo);

const city = buildCity(scene, rng);
const player = createPlayer(scene, 18, 18);
const traffic = spawnTraffic(scene, rng, 14);
const parked = spawnParked(scene, rng, 10);
const peds = spawnPeds(scene, rng, 22);
const wanted = createWanted();
const heli = createHeli(scene);
const missions = createMissionState(scene);
const combat = createCombat(scene);
const weapons = createWeapons();
const radio = createRadio();
const audio = createAudio();

// Garage / safehouse at Mara's garage (Docklands).
const garagePos = { x: -100, z: -30 };
{
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(10, 4.5, 7), new THREE.MeshLambertMaterial({ color: 0x5a4a6a }));
  box.position.y = 2.25; box.castShadow = true;
  const c = document.createElement('canvas');
  c.width = 512; c.height = 96;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#222233'; ctx.fillRect(0, 0, 512, 96);
  ctx.font = 'bold 44px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd23e'; ctx.fillText("MARA'S GARAGE", 256, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.7), new THREE.MeshBasicMaterial({ map: tex }));
  sign.position.set(0, 4.2, 3.6);
  g.add(box); g.add(sign);
  g.position.set(garagePos.x, 0, garagePos.z - 8);
  scene.add(g);
}

// --- Game object (what HUD, missions and shots talk to) ---
const game = {
  player, traffic, parked, peds, wanted, heli, missions, weapons, radio,
  missionDefs: MISSIONS,
  clockMinutes: 9 * 60, day: 1, time: 0,
  armed: false, dusk: false,
  toast,
  missionTarget: () => missionTarget(missions),
  nextMissionId: () => nextMission(missions),
  repInfo: () => repRank(player.rep),
  addRep(xp) { player.rep += xp; },
  setWanted(n) { wanted.stars = Math.max(wanted.stars, n); wanted.quiet = 0; },
  clearWantedSoft() { wanted.stars = 0; wanted.quiet = 0; },
  setHeli(on) { heli.active = on; },
  // Snap the helicopter to its hover spot instantly (the normal update lerps toward
  // a moving target and lags far behind after a staged sim — for a screenshot the
  // chopper must actually be in frame).
  snapHeli() {
    if (!heli.active) return;
    const heading = player.inCar ? player.inCar.angle : player.angle;
    const fx = Math.sin(heading), fz = Math.cos(heading);
    heli.x = player.x + fx * 36;
    heli.z = player.z + fz * 36;
    heli.y = 8;
    heli.mesh.position.set(heli.x, heli.y, heli.z);
    heli.mesh.visible = true;
  },
  startMission(id) { startMission(missions, id, game); },
  save() { saveGame(game); },
  garageRepair() {
    if (player.inCar) { player.inCar.condition = 100; toast("Mara's Garage — car repaired, progress saved"); saveGame(game); }
  },
  spawnTargetCar(mode) {
    const mesh = makeCarMesh(0x2e6fd2);
    scene.add(mesh);
    const car = new Car(mesh, -78, -100, 0, 'target', 'Blue Sedan');
    car.speed = 11; car.targetSpeed = 11;
    missions.targetCar = car;
    missions.targetMode = mode;
  },
  spawnPoliceNear(n, dist) {
    for (let i = 0; i < n; i++) {
      const a = Math.PI + (i - 1) * 0.5;
      const c = spawnPolice(scene, player.x + Math.sin(a) * dist, player.z + Math.cos(a) * dist, `APD-${i + 1}`);
      wanted.police.push(c);
    }
  },
  // A police car ahead of the player, facing them — visible in a chase shot.
  spawnPoliceAhead(dist) {
    const fx = Math.sin(player.angle), fz = Math.cos(player.angle);
    const c = spawnPolice(scene, player.x + fx * dist, player.z + fz * dist, 'APD-7 "HAWK"');
    c.angle = player.angle + Math.PI;
    c._dist = dist; // panel distance (updatePolice never ran for this car yet)
    c.sync();
    wanted.police.push(c);
    return c;
  },
  nearestCar(x, z, maxD, skipTaxi) {
    let best = null, bd = maxD ?? 60;
    for (const c of [...traffic, ...parked]) {
      if (c.mode === 'target') continue;
      if (skipTaxi && c.taxi) continue;
      const d = Math.hypot(c.x - x, c.z - z);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  },
  teleportPlayer(x, z, angle) {
    player.x = x; player.z = z; player.angle = angle ?? 0;
    player.mesh.position.set(x, 0, z);
    player.mesh.rotation.y = player.angle;
    camYaw = player.angle + Math.PI;
  },
  enterCar(car, steal) {
    if (car.mode === 'target' || car.mode === 'police' || car.mode === 'roadblock') return false;
    if (car.mode === 'traffic' && steal !== false) {
      addWanted(wanted, 1);
      player.rep += 10;
      toast(`Car stolen — ${car.name}!`);
      audio.chime();
    }
    car.mode = 'player';
    car.parked = false;
    player.inCar = car;
    player.mesh.visible = false;
    return true;
  },
  exitCar() {
    const car = player.inCar;
    if (!car) return;
    car.mode = 'parked';
    car.speed = 0;
    player.inCar = null;
    player.x = car.x + Math.sin(car.angle + Math.PI / 2) * 2.5;
    player.z = car.z + Math.cos(car.angle + Math.PI / 2) * 2.5;
    player.mesh.visible = true;
    player.mesh.position.set(player.x, 0, player.z);
  },
  setDusk(on) {
    game.dusk = on;
    if (on) {
      // Golden hour: warm mauve sky, low amber sun, long shadows, haze.
      scene.background = new THREE.Color(0x6b3a44);
      scene.fog.color.setHex(0x6b3a44);
      scene.fog.near = 140; scene.fog.far = 380;
      hemi.color.setHex(0xffd9a0); hemi.groundColor.setHex(0x6a4a3a);
      hemi.intensity = 0.42;
      sun.color.setHex(0xffb347);
      sun.intensity = 1.6;
      sun.position.set(-120, 26, -140);
      sunDisc.visible = true; sunHalo.visible = true;
    } else {
      scene.background = new THREE.Color(0x87b5d6);
      scene.fog.color.setHex(0x87b5d6);
      scene.fog.near = 180; scene.fog.far = 420;
      hemi.color.setHex(0xbfd9ff); hemi.groundColor.setHex(0x8a7a5a);
      hemi.intensity = 0.9;
      sun.color.setHex(0xfff2cc);
      sun.intensity = 2.2;
      sun.position.set(80, 140, 40);
      sunDisc.visible = false; sunHalo.visible = false;
    }
  },
  reset() {
    player.x = 18; player.z = 18; player.y = 0; player.angle = 0;
    player.health = 100; player.armour = 50; player.money = 1500; player.rep = 0;
    player.inCar = null; player.mesh.visible = true;
    player.mesh.position.set(18, 0, 18);
    clearWanted(wanted, scene);
    heli.active = false;
    missions.active = -1; missions.stage = 0; missions.done.fill(false);
    missions.dialog = null; missions.dialogT = 0;
    if (missions.targetCar) { scene.remove(missions.targetCar.mesh); missions.targetCar = null; }
    game.clockMinutes = 9 * 60; game.day = 1;
    camYaw = Math.PI;
    camPitch = 0.32;
  },
  step(dt) {
    game.time += dt;
    // Clock: 1 game hour per ~40 s.
    game.clockMinutes += dt * 1.5;
    if (game.clockMinutes >= 1440) { game.clockMinutes -= 1440; game.day += 1; }
    // Player.
    if (player.inCar) updateDrive(player, dt, keys, city.aabbs, HALF, (sp) => onCrash(sp));
    else updateFoot(player, dt, keys, camYaw, city.aabbs, HALF);
    // Traffic + target car.
    const allCars = [...traffic, ...parked];
    for (const c of traffic) updateTraffic(c, dt, rng, allCars);
    if (missions.targetCar) updateTarget(missions.targetCar, dt, rng, player.x, player.z, missions.targetMode || 'loop');
    // Peds.
    updatePeds(peds, dt, rng, player.x, player.z, game._scared);
    game._scared = false;
    // Wanted + police + heli.
    updateWanted(wanted, dt, scene, rng, player.x, player.z, player.angle, () => onBusted());
    updateHeli(heli, dt, player.x, player.z, game.time, player.inCar ? player.inCar.angle : player.angle);
    // The ferris wheel turns slowly, day and night.
    if (city.ferris) city.ferris.rotation.z += dt * 0.07;
    // Missions.
    updateMissions(missions, dt, game, player);
    // Combat timers.
    updateCombat(combat, dt);
    // Radio.
    updateRadio(radio, dt);
    // Collisions.
    handleCollisions(dt);
    // Garage repair zone.
    if (player.inCar && Math.hypot(player.x - garagePos.x, player.z - garagePos.z) < 7) {
      if (!game._garageT || game.time - game._garageT > 5) { game._garageT = game.time; game.garageRepair(); }
    }
    // Audio.
    if (audio.ctx) {
      audio.engine(player.inCar ? Math.abs(player.inCar.speed) / 34 : 0, !!player.inCar);
      audio.siren(wanted.stars > 0);
    }
  },
};

// Debug/test handle: lets a playthrough script start missions and step the game.
window.__azura = game;

function onCrash(speed) {
  const car = player.inCar;
  if (!car) return;
  car.condition = Math.max(0, car.condition - Math.round(speed * 0.5));
  player.health = Math.max(0, player.health - 4);
  audio.noise(0.12, 0.2);
  if (player.health <= 0) onWasted();
}

function onBusted() {
  if (player.inCar) return; // police ram cars; they only bust on foot
  player.money = Math.max(0, player.money - 200);
  player.health = 100; player.armour = 50;
  clearWanted(wanted, scene);
  heli.active = false;
  game.teleportPlayer(garagePos.x, garagePos.z, 0);
  toast('BUSTED! The cops took $200. Mara bailed you out.');
  game.save();
}

function onWasted() {
  player.money = Math.max(0, player.money - 200);
  player.health = 100; player.armour = 50;
  clearWanted(wanted, scene);
  heli.active = false;
  game.teleportPlayer(garagePos.x, garagePos.z, 0);
  toast('WASTED! You woke up at the garage — $200 lighter.');
  game.save();
}

function handleCollisions(dt) {
  const p = player;
  // Player car vs other cars.
  if (p.inCar) {
    const car = p.inCar;
    for (const other of [...traffic, ...parked, ...wanted.police, ...wanted.roadblock]) {
      if (other === car) continue;
      const d = Math.hypot(other.x - car.x, other.z - car.z);
      if (d < 3.8 && d > 0.01) {
        const push = (3.8 - d) / 2;
        const nx = (car.x - other.x) / d, nz = (car.z - other.z) / d;
        car.x += nx * push; car.z += nz * push;
        if (other.mode === 'traffic' || other.mode === 'parked') { other.x -= nx * push; other.z -= nz * push; other.sync(); }
        const impact = Math.abs(car.speed - (other.speed || 0));
        if (impact > 6) {
          car.speed *= 0.55;
          car.condition = Math.max(0, car.condition - 4);
          if (other.mode !== 'police' && other.mode !== 'roadblock') other.condition = Math.max(0, (other.condition ?? 100) - 8);
          audio.noise(0.1, 0.16);
          if (other === missions.targetCar && MISSIONS[missions.active] && MISSIONS[missions.active].stages[missions.stage] && MISSIONS[missions.active].stages[missions.stage].kind === 'ram') {
            const now = performance.now();
            if (!game._ramT || now - game._ramT > 800) { game._ramT = now; missions.hits += 1; toast(`RAMMED! ${missions.hits}/3`); }
          }
        }
        car.sync();
      }
    }
  } else {
    // On foot: traffic cars knock the player down; police bust.
    for (const other of traffic) {
      const d = Math.hypot(other.x - p.x, other.z - p.z);
      if (d < 2.2 && Math.abs(other.speed) > 2) {
        p.health = Math.max(0, p.health - 12);
        p.x += (p.x - other.x) * 0.8; p.z += (p.z - other.z) * 0.8;
        other.targetSpeed = 0;
        setTimeout(() => { other.targetSpeed = 9; }, 1200);
        audio.noise(0.12, 0.2);
        if (p.health <= 0) onWasted();
      }
    }
  }
}

// --- Camera ---
let camYaw = Math.PI;
let camPitch = 0.32;
let camDist = 8;
function updateCamera(dt) {
  const look = consumeLook();
  camYaw -= look.dx * 0.004;
  camPitch = Math.max(0.08, Math.min(0.9, camPitch + look.dy * 0.003));
  const target = player.inCar ? player.inCar : player;
  const tx = target.x, tz = target.z;
  // In a car the camera trails the car unless the player recently dragged.
  if (player.inCar) {
    const wantYaw = player.inCar.angle + Math.PI;
    let diff = wantYaw - camYaw;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    camYaw += diff * Math.min(1, dt * 1.6);
    camDist = 11;
  } else camDist = 8;
  const cx = tx + Math.sin(camYaw) * Math.cos(camPitch) * camDist;
  const cz = tz + Math.cos(camYaw) * Math.cos(camPitch) * camDist;
  const cy = (player.inCar ? 1.2 : 1.6) + Math.sin(camPitch) * camDist;
  camera.position.set(cx, cy, cz);
  camera.lookAt(tx, player.inCar ? 1.4 : 1.5, tz);
}

// --- Input edges ---
const prev = {};
function edge(code) {
  const down = !!keys[code];
  const hit = down && !prev[code];
  prev[code] = down;
  return hit;
}

function handleInput() {
  if (edge('KeyE')) {
    if (player.inCar) game.exitCar();
    else {
      const car = game.nearestCar(player.x, player.z, 4.5);
      if (car) game.enterCar(car, true);
      else toast('No car nearby — get closer and press E');
    }
  }
  if (edge('KeyF') && !player.inCar) {
    if (punch(player, peds, () => { addWanted(wanted, 1); audio.punch(); })) { /* hit */ }
  }
  if (edge('KeyR') && player.inCar) {
    const label = nextStation(radio);
    toast(`♪ ${label}`);
    audio.startMusic(radio.station);
  }
  if (edge('KeyM')) {
    const id = nextMission(missions);
    if (missions.active < 0 && id >= 0) startMission(missions, id, game);
    else if (missions.active >= 0) toast('Mission already active — finish it first!');
    else toast('All 10 missions complete!');
  }
  for (let i = 0; i < 4; i++) {
    if (edge(`Digit${i + 1}`)) {
      if (selectWeapon(weapons, i)) toast(`${currentWeapon(weapons).name} ready`);
      else if (weapons.slots[i].locked) toast(`${weapons.slots[i].name} is LOCKED — finish more missions`);
    }
  }
  if (consumeClick() && !player.inCar) {
    const w = currentWeapon(weapons);
    if (w.name === 'FISTS') punch(player, peds, () => { addWanted(wanted, 1); audio.punch(); });
    else if (spendAmmo(weapons)) {
      shoot(player, combat, w, peds, [...traffic, ...parked], wanted.police, (hit) => {
        addWanted(wanted, 1);
        audio.gunshot();
        game._scared = true;
        if (hit.kind === 'ped') player.rep += 2;
      });
    } else toast('Out of ammo!');
  }
  game.armed = currentWeapon(weapons).name !== 'FISTS';
}

// --- Menus ---
const menuEl = document.getElementById('menu');
const pauseEl = document.getElementById('pause');
let screen = 'menu';
let paused = false;

function applySave(d) {
  player.money = d.money ?? 1500;
  player.health = d.health ?? 100;
  player.armour = d.armour ?? 50;
  player.rep = d.rep ?? 0;
  player.x = d.x ?? 18; player.z = d.z ?? 18;
  missions.done = d.done ?? [false, false, false, false, false, false, false, false, false, false];
  game.clockMinutes = d.clock ?? 540;
  game.day = d.day ?? 1;
  radio.station = d.station ?? 0;
  unlockWeapons(weapons, missions.done);
  player.mesh.position.set(player.x, 0, player.z);
}

function startGame(fromSave) {
  audio.init();
  if (fromSave) {
    const d = loadGame();
    if (d) applySave(d);
  }
  unlockWeapons(weapons, missions.done);
  menuEl.style.display = 'none';
  pauseEl.style.display = 'none';
  initHud();
  screen = 'play';
  status.textContent = 'Playing Azura Bay. Press M for a mission.';
  if (!fromSave) say(missions, 'MARA', 'Welcome to Azura Bay, Jax. Press M when you want work.', 7);
  saveGame(game);
}

function say(ms, who, text, seconds) {
  ms.dialog = { who, text };
  ms.dialogT = seconds || 6;
}

document.getElementById('btnStart').addEventListener('click', () => startGame(false));
document.getElementById('btnContinue').addEventListener('click', () => startGame(true));
document.getElementById('btnResume').addEventListener('click', () => { paused = false; pauseEl.style.display = 'none'; });
document.getElementById('btnQuit').addEventListener('click', () => {
  paused = false; pauseEl.style.display = 'none';
  screen = 'menu'; menuEl.style.display = 'flex';
  document.getElementById('btnContinue').style.display = hasSave() ? 'block' : 'none';
});
if (hasSave()) document.getElementById('btnContinue').style.display = 'block';
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && screen === 'play') { paused = true; pauseEl.style.display = 'flex'; }
});

// --- Loop ---
let last = performance.now();
let accumulator = 0;
let saveT = 0;

function frame(now) {
  requestAnimationFrame(frame);
  accumulator += Math.min((now - last) / 1000, MAX_FRAME);
  last = now;
  if (edge('KeyP') || edge('Escape')) {
    if (screen === 'play') { paused = !paused; pauseEl.style.display = paused ? 'flex' : 'none'; }
  }
  if (screen === 'play' && !paused) {
    handleInput();
    while (accumulator >= STEP) { game.step(STEP); accumulator -= STEP; }
    updateCamera(0.016);
    updateHud(game);
    saveT += 1 / 60;
    if (saveT > 10) { saveT = 0; saveGame(game); }
  } else accumulator = 0;
  renderer.render(scene, camera);
}

function runShot(name) {
  menuEl.style.display = 'none';
  initHud();
  screen = 'shot';
  if (duskParam) game.setDusk(true);
  stageShot(name, game);
  updateCamera(0.016);
  updateHud(game);
  // Keep rendering continuously (like the title loop): headless screenshots only capture
  // a presented frame while frames keep coming, so stopping after 3 frames can leave a
  // blank compositor frame. The simulation itself is frozen — only the camera/render run.
  let painted = 0;
  function paint() {
    updateCamera(0.016);
    renderer.render(scene, camera);
    painted += 1;
    if (painted === 3) window.__shotReady = true;
    requestAnimationFrame(paint);
  }
  requestAnimationFrame(paint);
}

if (shot) runShot(shot);
else {
  if (duskParam) game.setDusk(true);
  requestAnimationFrame(frame);
}
