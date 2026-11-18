// The player, Jax: a low-poly character on foot, and the arcade driving model when in a car.
// On foot: WASD relative to the camera, Shift to run, Space to jump. In a car: W/S throttle and
// brake/reverse, A/D steer, Space handbrake. Collisions are circle-vs-building-AABB.
import * as THREE from '../vendor/three.module.js';
import { CAR, PLAYER } from './config.js';
import { hitsBuilding } from './city.js';

export function makePlayerMesh() {
  const g = new THREE.Group();
  const jacket = new THREE.MeshLambertMaterial({ color: 0xd94f3d });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.72, 0.34), jacket);
  torso.position.y = 1.12; torso.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), new THREE.MeshLambertMaterial({ color: 0xe8b98a }));
  head.position.y = 1.68; head.castShadow = true;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 10), new THREE.MeshLambertMaterial({ color: 0x222831 }));
  cap.position.y = 1.86;
  const legMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 0.26), legMat);
  legL.position.set(-0.16, 0.36, 0);
  const legR = legL.clone(); legR.position.x = 0.16;
  const armMat = new THREE.MeshLambertMaterial({ color: 0xd94f3d });
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.62, 0.2), armMat);
  armL.position.set(-0.42, 1.12, 0);
  const armR = armL.clone(); armR.position.x = 0.42;
  g.add(torso); g.add(head); g.add(cap); g.add(legL); g.add(legR); g.add(armL); g.add(armR);
  g.userData = { legL, legR, armL, armR };
  return g;
}

export function createPlayer(scene, x, z) {
  const mesh = makePlayerMesh();
  scene.add(mesh);
  const p = {
    mesh, x, z, y: 0, vy: 0, angle: 0, health: 100, armour: 50, money: 0, rep: 0,
    inCar: null, speed: 0, walkPhase: 0, onGround: true, punchCooldown: 0, shootCooldown: 0,
  };
  p.mesh.position.set(x, 0, z);
  return p;
}

function collide(aabbs, x, z, r) {
  const b = hitsBuilding(aabbs, x, z, r);
  if (!b) return { x, z };
  // Push out along the smallest penetration axis.
  const dxMin = x - (b.minX - r), dxMax = (b.maxX + r) - x;
  const dzMin = z - (b.minZ - r), dzMax = (b.maxZ + r) - z;
  const m = Math.min(dxMin, dxMax, dzMin, dzMax);
  if (m === dxMin) return { x: b.minX - r, z };
  if (m === dxMax) return { x: b.maxX + r, z };
  if (m === dzMin) return { x, z: b.minZ - r };
  return { x, z: b.maxZ + r };
}

export function updateFoot(p, dt, input, camYaw, aabbs, bounds) {
  let mx = 0, mz = 0;
  if (input.KeyW || input.ArrowUp) mz -= 1;
  if (input.KeyS || input.ArrowDown) mz += 1;
  if (input.KeyA || input.ArrowLeft) mx -= 1;
  if (input.KeyD || input.ArrowRight) mx += 1;
  const len = Math.hypot(mx, mz);
  const run = input.ShiftLeft || input.ShiftRight;
  const speed = run ? PLAYER.runSpeed : PLAYER.walkSpeed;
  if (len > 0) {
    mx /= len; mz /= len;
    const sin = Math.sin(camYaw), cos = Math.cos(camYaw);
    const wx = mx * cos - mz * sin;
    const wz = mx * sin + mz * cos;
    p.x += wx * speed * dt;
    p.z += wz * speed * dt;
    p.angle = Math.atan2(wx, wz);
    p.walkPhase += dt * speed * 1.6;
  }
  // Gravity + jump.
  if (input.Space && p.onGround) { p.vy = PLAYER.jumpSpeed; p.onGround = false; }
  p.vy -= 22 * dt;
  p.y += p.vy * dt;
  if (p.y <= 0) { p.y = 0; p.vy = 0; p.onGround = true; }
  // Building collision + city bounds.
  const c = collide(aabbs, p.x, p.z, PLAYER.radius);
  p.x = Math.max(-bounds, Math.min(bounds, c.x));
  p.z = Math.max(-bounds, Math.min(bounds, c.z));
  p.mesh.position.set(p.x, p.y, p.z);
  p.mesh.rotation.y = p.angle;
  const swing = len > 0 ? Math.sin(p.walkPhase) * 0.55 : 0;
  p.mesh.userData.legL.rotation.x = swing;
  p.mesh.userData.legR.rotation.x = -swing;
  p.mesh.userData.armL.rotation.x = -swing * 0.7;
  p.mesh.userData.armR.rotation.x = swing * 0.7;
  p.punchCooldown = Math.max(0, p.punchCooldown - dt);
  p.shootCooldown = Math.max(0, p.shootCooldown - dt);
}

export function updateDrive(p, dt, input, aabbs, bounds, onCrash) {
  const car = p.inCar;
  if (!car) return;
  const fwd = (input.KeyW || input.ArrowUp) ? 1 : 0;
  const back = (input.KeyS || input.ArrowDown) ? 1 : 0;
  const steerIn = (input.KeyA || input.ArrowLeft ? -1 : 0) + (input.KeyD || input.ArrowRight ? 1 : 0);
  if (fwd) car.speed += CAR.accel * dt;
  if (back) car.speed -= (car.speed > 0.5 ? CAR.brake : CAR.accel * 0.6) * dt;
  if (!fwd && !back) car.speed -= Math.sign(car.speed) * Math.min(Math.abs(car.speed), 8 * dt);
  if (input.Space) car.speed -= Math.sign(car.speed) * Math.min(Math.abs(car.speed), 26 * dt);
  car.speed = Math.max(-CAR.maxReverse, Math.min(CAR.maxSpeed, car.speed));
  const steerTarget = steerIn * (car.speed >= 0 ? 1 : -1);
  car.steer += (steerTarget - car.steer) * Math.min(1, dt * CAR.grip);
  car.angle += car.steer * CAR.steer * dt * Math.min(1, Math.abs(car.speed) / 8) * Math.sign(car.speed || 1);
  const f = car.forward();
  const nx = car.x + f.x * car.speed * dt;
  const nz = car.z + f.z * car.speed * dt;
  const hit = hitsBuilding(aabbs, nx, nz, 1.6);
  if (hit) {
    if (Math.abs(car.speed) > 12 && onCrash) onCrash(Math.abs(car.speed));
    car.speed *= -0.25;
  } else {
    car.x = Math.max(-bounds, Math.min(bounds, nx));
    car.z = Math.max(-bounds, Math.min(bounds, nz));
  }
  p.x = car.x; p.z = car.z; p.angle = car.angle;
  car.sync();
}
