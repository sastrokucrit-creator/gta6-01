// Cars: boxy low-poly bodies with cabin, wheels and headlights. NPC traffic drives along
// road lanes and turns at intersections; police cars chase the player. Parked cars line the
// roads and can be stolen. Every car has an original model name and a condition bar (100 = new).
import * as THREE from '../vendor/three.module.min.js';
import { CAR_NAMES, HALF, ROAD_CENTERS, TAXI_NAME } from './config.js';
import { pick, range } from './rng.js';
import { nearestRoadCenter } from './city.js';

export const CAR_COLORS = [0xd23b2e, 0x2e6fd2, 0xf2c230, 0x37b24d, 0x8e44ad, 0xe67e22, 0xdddddd, 0x222831, 0x16a3a3];
export const POLICE_COLOR = 0x1a1a22;
export const TAXI_COLOR = 0xf2c230;

export function makeCarMesh(color, police = false, taxi = false) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.62, 4.3), bodyMat);
  body.position.y = 0.55; body.castShadow = true;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 2.1), new THREE.MeshLambertMaterial({ color: 0x1d2733 }));
  cabin.position.set(0, 1.1, -0.2); cabin.castShadow = true;
  g.add(body); g.add(cabin);
  if (taxi) {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.5), new THREE.MeshLambertMaterial({ color: 0x111111 }));
    sign.position.set(0, 1.5, -0.2);
    const signTop = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.06, 0.52), new THREE.MeshLambertMaterial({ color: 0xffe27a, emissive: 0x554400 }));
    signTop.position.set(0, 1.62, -0.2);
    g.add(sign); g.add(signTop);
  }
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 10);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const wheels = [];
  for (const [x, z] of [[-0.95, 1.35], [0.95, 1.35], [-0.95, -1.35], [0.95, -1.35]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2; w.position.set(x, 0.36, z);
    g.add(w); wheels.push(w);
  }
  const lightMat = new THREE.MeshLambertMaterial({ color: 0xfff6c0, emissive: 0x555533 });
  for (const x of [-0.6, 0.6]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.08), lightMat);
    l.position.set(x, 0.6, 2.16);
    g.add(l);
  }
  if (police) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.18, 0.4), new THREE.MeshLambertMaterial({ color: 0x223344 }));
    bar.position.set(0, 1.48, -0.2);
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.42), new THREE.MeshLambertMaterial({ color: 0xff2222, emissive: 0x881111 }));
    red.position.set(-0.28, 1.5, -0.2);
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.42), new THREE.MeshLambertMaterial({ color: 0x2244ff, emissive: 0x111188 }));
    blue.position.set(0.28, 1.5, -0.2);
    g.add(bar); g.add(red); g.add(blue);
    g.userData.lights = [red, blue];
  }
  g.userData.wheels = wheels;
  return g;
}

// A car in the world. mode: 'parked' | 'traffic' | 'player' | 'police' | 'target'
export class Car {
  constructor(mesh, x, z, angle, mode, name) {
    this.mesh = mesh;
    this.x = x; this.z = z; this.angle = angle;
    this.speed = 0;
    this.mode = mode;
    this.steer = 0;
    this.parked = mode === 'parked';
    this.targetSpeed = 0;
    this.turnAt = 0;
    this.flash = 0;
    this.name = name || 'Comet GT';
    this.condition = 100;
    this.taxi = false;
    this.sync();
  }
  sync() {
    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.rotation.y = this.angle;
    const spin = this.speed * 0.06;
    for (const w of this.mesh.userData.wheels) w.rotation.x += spin;
  }
  // Forward vector (three.js: -Z is forward when angle=0? we use +sin/+cos convention).
  forward() { return { x: Math.sin(this.angle), z: Math.cos(this.angle) }; }
}

function randomRoadSpot(rng) {
  const c = pick(rng, ROAD_CENTERS);
  const along = range(rng, -HALF + 8, HALF - 8);
  const horiz = rng() < 0.5;
  const lane = (rng() < 0.5 ? -1 : 1) * 2.4;
  return horiz ? { x: along, z: c + lane, angle: lane > 0 ? Math.PI / 2 : -Math.PI / 2 } : { x: c + lane, z: along, angle: lane > 0 ? Math.PI : 0 };
}

export function spawnTraffic(scene, rng, count) {
  const cars = [];
  for (let i = 0; i < count; i++) {
    const spot = randomRoadSpot(rng);
    const isTaxi = rng() < 0.18;
    const color = isTaxi ? TAXI_COLOR : pick(rng, CAR_COLORS);
    const mesh = makeCarMesh(color, false, isTaxi);
    scene.add(mesh);
    const car = new Car(mesh, spot.x, spot.z, spot.angle, 'traffic', isTaxi ? TAXI_NAME : pick(rng, CAR_NAMES));
    car.taxi = isTaxi;
    car.speed = range(rng, 7, 13);
    car.targetSpeed = car.speed;
    cars.push(car);
  }
  return cars;
}

export function spawnParked(scene, rng, count) {
  const cars = [];
  for (let i = 0; i < count; i++) {
    const spot = randomRoadSpot(rng);
    const mesh = makeCarMesh(pick(rng, CAR_COLORS));
    scene.add(mesh);
    const car = new Car(mesh, spot.x, spot.z, spot.angle, 'parked', pick(rng, CAR_NAMES));
    cars.push(car);
  }
  return cars;
}

export function spawnPolice(scene, x, z, name) {
  const mesh = makeCarMesh(POLICE_COLOR, true);
  scene.add(mesh);
  const car = new Car(mesh, x, z, 0, 'police', name || 'APD Interceptor');
  car.speed = 0;
  return car;
}

// The mission target car: 'loop' cruises a rectangular route around the city;
// 'flee' runs from the player along the road grid.
export function updateTarget(car, dt, rng, px, pz, mode) {
  const f = car.forward();
  if (mode === 'flee') {
    const dx = car.x - px, dz = car.z - pz;
    const wantAngle = Math.atan2(dx, dz);
    let diff = wantAngle - car.angle;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    // Fleeing cars still turn at intersections instead of cutting through blocks.
    const nearX = Math.abs(car.x - nearestRoadCenter(car.x)) < 1.5;
    const nearZ = Math.abs(car.z - nearestRoadCenter(car.z)) < 1.5;
    if (nearX && nearZ && Math.abs(diff) > 0.6) car.angle += (diff > 0 ? 1 : -1) * Math.PI / 2;
    car.speed += Math.max(-12 * dt, Math.min(8 * dt, 20 - car.speed));
  } else {
    car.speed += Math.max(-10 * dt, Math.min(6 * dt, 11 - car.speed));
    const nearX = Math.abs(car.x - nearestRoadCenter(car.x)) < 1.2;
    const nearZ = Math.abs(car.z - nearestRoadCenter(car.z)) < 1.2;
    if (nearX && nearZ && rng() < dt * 0.35) car.angle += (rng() < 0.5 ? 1 : -1) * Math.PI / 2;
  }
  car.x += f.x * car.speed * dt;
  car.z += f.z * car.speed * dt;
  if (Math.abs(car.x) > HALF + 2 || Math.abs(car.z) > HALF + 2) {
    car.angle += Math.PI;
    car.x = Math.max(-HALF, Math.min(HALF, car.x));
    car.z = Math.max(-HALF, Math.min(HALF, car.z));
  }
  car.sync();
}

// Traffic: drive forward; slow when a car is ahead; turn at intersections sometimes.
export function updateTraffic(car, dt, rng, cars) {
  const f = car.forward();
  // Car ahead?
  let blocked = false;
  for (const other of cars) {
    if (other === car) continue;
    const dx = other.x - car.x, dz = other.z - car.z;
    const along = dx * f.x + dz * f.z;
    const side = Math.abs(dx * f.z - dz * f.x);
    if (along > 0 && along < 9 && side < 2.4) { blocked = true; break; }
  }
  const want = blocked ? 0 : car.targetSpeed;
  car.speed += Math.max(-14 * dt, Math.min(6 * dt, want - car.speed));
  // Intersection: chance to turn.
  const nearX = Math.abs(car.x - nearestRoadCenter(car.x)) < 1.2;
  const nearZ = Math.abs(car.z - nearestRoadCenter(car.z)) < 1.2;
  if (nearX && nearZ && rng() < dt * 0.25) {
    car.angle += (rng() < 0.5 ? 1 : -1) * Math.PI / 2;
  }
  car.x += f.x * car.speed * dt;
  car.z += f.z * car.speed * dt;
  if (Math.abs(car.x) > HALF + 4 || Math.abs(car.z) > HALF + 4) {
    const spot = randomRoadSpot(rng);
    car.x = spot.x; car.z = spot.z; car.angle = spot.angle; car.speed = car.targetSpeed;
  }
  car.sync();
}

// Police: steer toward the player and ram. Returns distance to player.
export function updatePolice(car, dt, px, pz, speed) {
  const dx = px - car.x, dz = pz - car.z;
  const dist = Math.hypot(dx, dz);
  const wantAngle = Math.atan2(dx, dz);
  let diff = wantAngle - car.angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  car.angle += Math.max(-2.4 * dt, Math.min(2.4 * dt, diff));
  car.speed += Math.max(-16 * dt, Math.min(10 * dt, speed - car.speed));
  const f = car.forward();
  car.x += f.x * car.speed * dt;
  car.z += f.z * car.speed * dt;
  car.flash += dt;
  if (car.mesh.userData.lights) {
    const on = Math.floor(car.flash * 6) % 2 === 0;
    car.mesh.userData.lights[0].material.emissive.setHex(on ? 0xff0000 : 0x220000);
    car.mesh.userData.lights[1].material.emissive.setHex(on ? 0x000022 : 0x0000ff);
  }
  car.sync();
  return dist;
}
