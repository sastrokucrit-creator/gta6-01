// Police helicopter: appears at wanted 3+, hovers above the player with a spinning rotor
// and a spotlight cone that tracks the player. It keeps the player "IN SIGHT" while close.
import * as THREE from '../vendor/three.module.min.js';

export function makeHeliMesh() {
  const g = new THREE.Group();
  // Bright white body so the chopper reads against the blue sky (a dark-navy body
  // vanished at distance); red stripe + light-blue glass cockpit + POLICE decals.
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0xf2f2f2 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 4.6), bodyMat);
  body.castShadow = true;
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 4.7), new THREE.MeshLambertMaterial({ color: 0xd23c2e }));
  stripe.position.set(0, -0.1, 0);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.0, 10, 8), new THREE.MeshLambertMaterial({ color: 0x9fd8ff, emissive: 0x1a3a55 }));
  nose.position.set(0, -0.2, 2.4); nose.scale.set(1, 0.8, 1);
  // POLICE decals on both flanks so the chopper reads as a police helicopter.
  const pc = document.createElement('canvas');
  pc.width = 256; pc.height = 64;
  const pg = pc.getContext('2d');
  pg.clearRect(0, 0, 256, 64);
  pg.font = 'bold 44px Arial'; pg.textAlign = 'center'; pg.textBaseline = 'middle';
  pg.fillStyle = '#b02020'; pg.fillText('POLICE', 128, 34);
  const ptex = new THREE.CanvasTexture(pc);
  ptex.colorSpace = THREE.SRGBColorSpace;
  for (const side of [-1, 1]) {
    const decal = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 0.65),
      new THREE.MeshBasicMaterial({ map: ptex, transparent: true }),
    );
    decal.position.set(side * 1.26, 0.35, 0);
    decal.rotation.y = side * Math.PI / 2;
    g.add(decal);
  }
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 4.2), bodyMat);
  tail.position.set(0, 0.3, -4.2);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.4, 1.0), new THREE.MeshLambertMaterial({ color: 0xd23c2e }));
  fin.position.set(0, 0.9, -6.0);
  const skidMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  for (const x of [-1.0, 1.0]) {
    const skid = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 3.4), skidMat);
    skid.position.set(x, -1.1, 0.3);
    g.add(skid);
  }
  const rotor = new THREE.Group();
  const bladeMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  for (const a of [0, Math.PI / 2]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.08, 0.5), bladeMat);
    blade.rotation.y = a;
    rotor.add(blade);
  }
  rotor.position.y = 1.1;
  // Translucent blur disc so the spinning rotor reads as a disc, not a cross.
  const blur = new THREE.Mesh(
    new THREE.CircleGeometry(4.8, 24),
    new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }),
  );
  blur.rotation.x = -Math.PI / 2;
  blur.position.y = 1.12;
  g.add(blur);
  const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.2, 0.3), bladeMat);
  tailRotor.position.set(0.35, 0.7, -6.0);
  // Searchlight: a cone of light + a bright disc at the ground.
  const spot = new THREE.SpotLight(0xfff6c0, 900, 90, 0.32, 0.45, 1.2);
  spot.position.set(0, -0.8, 1.5);
  const spotTarget = new THREE.Object3D();
  g.add(spotTarget);
  spot.target = spotTarget;
  const poolGeo = new THREE.CircleGeometry(4.5, 20);
  const pool = new THREE.Mesh(poolGeo, new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.34, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2;
  g.add(body); g.add(stripe); g.add(nose); g.add(tail); g.add(fin); g.add(rotor); g.add(tailRotor); g.add(spot); g.add(pool);
  // Visible light beam: a translucent cone from the belly to the ground.
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(4.2, 8, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.17, side: THREE.DoubleSide, depthWrite: false }),
  );
  beam.position.set(0, -4.8, 1.5);
  g.add(beam);
  g.userData = { rotor, tailRotor, spot, spotTarget, pool };
  return g;
}

export function createHeli(scene) {
  const mesh = makeHeliMesh();
  mesh.visible = false;
  mesh.scale.set(1.6, 1.6, 1.6); // bigger silhouette so it reads at chase distance
  scene.add(mesh);
  return { mesh, active: false, x: 0, y: 34, z: 0, angle: 0 };
}

// Live distance from the helicopter to the player, in metres — the DISPATCH
// panel reads it straight off this, so AIR ONE always shows a true number.
export function heliDist(heli, px, pz) {
  return Math.hypot(heli.x - px, heli.z - pz);
}

export function updateHeli(heli, dt, px, pz, time, heading) {
  if (!heli.active) { heli.mesh.visible = false; return; }
  heli.mesh.visible = true;
  // Hover ahead of the player, over the road (no sideways offset: the road corridor
  // is clear of buildings, while a side offset can hide the chopper behind a block).
  const fx = Math.sin(heading || 0), fz = Math.cos(heading || 0);
  const tx = px + fx * 36 + Math.sin(time * 0.4) * 3;
  const tz = pz + fz * 36 + Math.cos(time * 0.4) * 3;
  heli.x += (tx - heli.x) * Math.min(1, dt * 1.2);
  heli.z += (tz - heli.z) * Math.min(1, dt * 1.2);
  heli.y = 8 + Math.sin(time * 0.8) * 1.2;
  heli.angle = Math.atan2(px - heli.x, pz - heli.z);
  heli.mesh.position.set(heli.x, heli.y, heli.z);
  heli.mesh.rotation.y = heli.angle;
  heli.mesh.rotation.z = Math.sin(time * 0.5) * 0.06;
  heli.mesh.userData.rotor.rotation.y += dt * 22;
  heli.mesh.userData.tailRotor.rotation.x += dt * 30;
  // Spotlight tracks the player.
  heli.mesh.userData.spotTarget.position.set(px - heli.x, -heli.y, pz - heli.z);
  heli.mesh.userData.pool.position.set(px - heli.x, -heli.y + 0.3, pz - heli.z);
  heli.mesh.userData.pool.material.opacity = 0.28 + 0.1 * Math.sin(time * 6);
}
