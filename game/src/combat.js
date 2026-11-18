// Combat: punch (F) knocks a nearby pedestrian down; shoot (click) fires a hitscan ray
// with the current weapon's damage, rate and range, plus a tracer line and muzzle flash.
// Shooting and punching raise the wanted level. Cars take damage and lose condition.
import * as THREE from '../vendor/three.module.min.js';

export function createCombat(scene) {
  const tracerGeo = new THREE.BufferGeometry();
  tracerGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const tracer = new THREE.Line(tracerGeo, new THREE.LineBasicMaterial({ color: 0xffe27a }));
  tracer.visible = false;
  scene.add(tracer);
  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xfff2a0 }),
  );
  flash.visible = false;
  scene.add(flash);
  return { tracer, flash, flashT: 0 };
}

export function punch(player, peds, onHit) {
  if (player.punchCooldown > 0) return false;
  player.punchCooldown = 0.45;
  const fx = Math.sin(player.angle), fz = Math.cos(player.angle);
  for (const p of peds) {
    if (!p.alive) continue;
    const dx = p.x - player.x, dz = p.z - player.z;
    const d = Math.hypot(dx, dz);
    if (d < 2.2 && dx * fx + dz * fz > 0) {
      p.fall = 2.5;
      onHit(p);
      return true;
    }
  }
  return false;
}

export function shoot(player, combat, weapon, peds, cars, police, onHit) {
  if (player.shootCooldown > 0) return false;
  player.shootCooldown = weapon.rate;
  const fx = Math.sin(player.angle), fz = Math.cos(player.angle);
  const ox = player.x, oz = player.z;
  let best = null, bestD = weapon.range;
  const consider = (x, z, obj) => {
    const dx = x - ox, dz = z - oz;
    const along = dx * fx + dz * fz;
    const side = Math.abs(dx * fz - dz * fx);
    if (along > 0 && along < bestD && side < 1.6) { bestD = along; best = obj; }
  };
  for (const p of peds) if (p.alive) consider(p.x, p.z, { kind: 'ped', ref: p });
  for (const c of cars) consider(c.x, c.z, { kind: 'car', ref: c });
  for (const c of police) consider(c.x, c.z, { kind: 'police', ref: c });
  const endX = ox + fx * bestD, endZ = oz + fz * bestD;
  const pos = combat.tracer.geometry.attributes.position;
  pos.setXYZ(0, ox + fx * 0.6, 1.35, oz + fz * 0.6);
  pos.setXYZ(1, endX, 1.35, endZ);
  pos.needsUpdate = true;
  combat.tracer.visible = true;
  combat.flash.position.set(ox + fx * 0.9, 1.35, oz + fz * 0.9);
  combat.flash.visible = true;
  combat.flashT = 0.07;
  if (best) {
    if (best.kind === 'ped') best.ref.fall = 2.5;
    if (best.kind === 'car' || best.kind === 'police') {
      best.ref.condition = Math.max(0, (best.ref.condition ?? 100) - weapon.damage);
      if (best.ref.condition <= 0 && best.kind === 'car') { best.ref.speed = 0; best.ref.targetSpeed = 0; }
    }
    onHit(best, weapon.damage);
    return true;
  }
  return true;
}

export function updateCombat(combat, dt) {
  if (combat.flashT > 0) {
    combat.flashT -= dt;
    if (combat.flashT <= 0) { combat.flash.visible = false; combat.tracer.visible = false; }
  }
}
