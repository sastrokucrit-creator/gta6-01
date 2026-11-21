// Round 7: no gameplay change here — header written in-session so the file is witnessed.
// Pedestrians: simple capsule people strolling on sidewalks, in varied shirt colours.
// They flee when scared (gunfire, nearby crash) and can be punched (wanted +1).
import * as THREE from '../vendor/three.module.min.js';
import { HALF, ROAD_CENTERS } from './config.js';
import { pick, range } from './rng.js';
import { nearestRoadCenter } from './city.js';

const SHIRTS = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xecf0f1, 0x34495e, 0xe67e22];
const PANTS = [0x2c3e50, 0x5d4037, 0x37474f, 0x4e342e];

export function makePedMesh(rng) {
  const g = new THREE.Group();
  const shirt = pick(rng, SHIRTS);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.85, 8), new THREE.MeshLambertMaterial({ color: shirt }));
  body.position.y = 1.05; body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), new THREE.MeshLambertMaterial({ color: 0xe8b98a }));
  head.position.y = 1.72; head.castShadow = true;
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.62, 8), new THREE.MeshLambertMaterial({ color: pick(rng, PANTS) }));
  legs.position.y = 0.31;
  g.add(body); g.add(head); g.add(legs);
  return g;
}

export class Ped {
  constructor(mesh, x, z, angle) {
    this.mesh = mesh; this.x = x; this.z = z; this.angle = angle;
    this.speed = range(Math.random, 0.8, 1.6);
    this.alive = true; this.flee = 0; this.fall = 0;
    this.sync();
  }
  sync() {
    this.mesh.position.set(this.x, this.fall > 0 ? -0.4 : 0, this.z);
    this.mesh.rotation.y = this.angle;
    this.mesh.rotation.z = this.fall > 0 ? Math.PI / 2 : 0;
  }
}

function sidewalkSpot(rng) {
  const c = pick(rng, ROAD_CENTERS);
  const along = range(rng, -HALF + 8, HALF - 8);
  const off = (rng() < 0.5 ? -1 : 1) * (6 + 1.5);
  return rng() < 0.5 ? { x: along, z: c + off, angle: off > 0 ? Math.PI / 2 : -Math.PI / 2 } : { x: c + off, z: along, angle: off > 0 ? Math.PI : 0 };
}

export function spawnPeds(scene, rng, count) {
  const peds = [];
  for (let i = 0; i < count; i++) {
    const s = sidewalkSpot(rng);
    const ped = new Ped(makePedMesh(rng), s.x, s.z, s.angle);
    scene.add(ped.mesh);
    peds.push(ped);
  }
  return peds;
}

export function updatePeds(peds, dt, rng, scareX, scareZ, scared, police) {
  for (const p of peds) {
    if (!p.alive) continue;
    if (p.fall > 0) { p.fall -= dt; if (p.fall <= 0) { p.fall = 0; p.alive = false; p.mesh.visible = false; } p.sync(); continue; }
    // Flee direction: away from the scare point by default; a police car closer
    // than 6 m scares on its own, and the ped flees from that car instead.
    let fx = scareX, fz = scareZ;
    if (scared) {
      const d = Math.hypot(p.x - scareX, p.z - scareZ);
      if (d < 25) p.flee = 3;
    }
    if (police) {
      let nearest = null, nd = 6;
      for (const c of police) {
        const d = Math.hypot(p.x - c.x, p.z - c.z);
        if (d < nd) { nd = d; nearest = c; }
      }
      if (nearest) { p.flee = 3; fx = nearest.x; fz = nearest.z; }
    }
    if (p.flee > 0) {
      p.flee -= dt;
      const dx = p.x - fx, dz = p.z - fz;
      const d = Math.hypot(dx, dz) || 1;
      p.angle = Math.atan2(dx / d, dz / d);
      p.x += (dx / d) * 4.5 * dt;
      p.z += (dz / d) * 4.5 * dt;
    } else {
      const f = { x: Math.sin(p.angle), z: Math.cos(p.angle) };
      p.x += f.x * p.speed * dt;
      p.z += f.z * p.speed * dt;
      // Turn at intersections sometimes; stay in the city.
      const nearX = Math.abs(p.x - nearestRoadCenter(p.x)) < 1.5;
      const nearZ = Math.abs(p.z - nearestRoadCenter(p.z)) < 1.5;
      if (nearX && nearZ && rng() < dt * 0.2) p.angle += (rng() < 0.5 ? 1 : -1) * Math.PI / 2;
      if (Math.abs(p.x) > HALF || Math.abs(p.z) > HALF) p.angle += Math.PI;
    }
    p.sync();
  }
}
