// The city of Solara Bay: a sunny coastal grid. Roads run along both axes; each block holds
// 1-4 procedural buildings with canvas window textures, plus trees, lamps and sidewalks.
// Buildings are solid AABBs (cars and the player collide with them). The sea glitters to the
// south (negative Z) beyond a palm-lined beach.
import * as THREE from '../vendor/three.module.js';
import { BLOCK, GRID, HALF, PITCH, ROAD, ROAD_CENTERS } from './config.js';
import { pick, range, rangeInt } from './rng.js';

const WALL_COLORS = [0xe8dcc8, 0xd9c4a5, 0xc9b8a3, 0xb8c4c9, 0xe0b48f, 0xf2e3c6, 0xc7d3c0, 0xdba58a];
const ROOF_COLORS = [0x8a5a3b, 0x5a6b7a, 0x7a4a3a, 0x4a5a6b, 0x9a7a4a];
const TREE_COLORS = [0x2f8f4e, 0x3aa655, 0x2a7a44];

function windowTexture(rng, base, lit) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 128, 256);
  // Subtle vertical shading so facades are not flat.
  const grad = g.createLinearGradient(0, 0, 128, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0.18)'); grad.addColorStop(0.5, 'rgba(255,255,255,0.08)'); grad.addColorStop(1, 'rgba(0,0,0,0.18)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 256);
  const cols = 4, rows = 10;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const x = 8 + col * 30, y = 10 + r * 24;
      const on = rng() < lit;
      g.fillStyle = on ? '#ffd97a' : '#2c3e55';
      g.fillRect(x, y, 20, 15);
      g.fillStyle = 'rgba(255,255,255,0.25)';
      g.fillRect(x, y, 20, 3);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeBuilding(rng, w, d, h, x, z, textures) {
  const tex = pick(rng, textures);
  const mat = new THREE.MeshLambertMaterial({ map: tex });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.6, 0.6, d + 0.6),
    new THREE.MeshLambertMaterial({ color: pick(rng, ROOF_COLORS) }),
  );
  roof.position.set(x, h + 0.3, z);
  roof.castShadow = true;
  const group = new THREE.Group();
  group.add(mesh); group.add(roof);
  // Rooftop AC box on tall buildings.
  if (h > 22 && rng() < 0.6) {
    const ac = new THREE.Mesh(new THREE.BoxGeometry(3, 1.4, 2), new THREE.MeshLambertMaterial({ color: 0x9aa5ad }));
    ac.position.set(x + w * 0.2, h + 1.3, z);
    group.add(ac);
  }
  return { group, aabb: { minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 } };
}

function makeTree(rng) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.28, 2.4, 6),
    new THREE.MeshLambertMaterial({ color: 0x7a5230 }),
  );
  trunk.position.y = 1.2; trunk.castShadow = true;
  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(range(rng, 1.2, 1.9), 8, 6),
    new THREE.MeshLambertMaterial({ color: pick(rng, TREE_COLORS) }),
  );
  crown.position.y = 3.1; crown.castShadow = true;
  g.add(trunk); g.add(crown);
  return g;
}

function makeLamp() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.12, 5, 6),
    new THREE.MeshLambertMaterial({ color: 0x333a42 }),
  );
  pole.position.y = 2.5; pole.castShadow = true;
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0xfff2b0, emissive: 0x554400 }),
  );
  bulb.position.y = 5.05;
  g.add(pole); g.add(bulb);
  return g;
}

export function buildCity(scene, rng) {
  const aabbs = [];
  const textures = [];
  for (let i = 0; i < 5; i++) {
    const hex = '#' + new THREE.Color(pick(rng, WALL_COLORS)).getHexString();
    textures.push(windowTexture(rng, hex, 0.25));
  }

  // Ground: grass-green base, sand beach to the south, sea beyond.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(HALF * 2 + 260, HALF * 2 + 260),
    new THREE.MeshLambertMaterial({ color: 0x7fb069 }),
  );
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.05, 40); ground.receiveShadow = true;
  scene.add(ground);
  const beach = new THREE.Mesh(
    new THREE.PlaneGeometry(HALF * 2 + 260, 26),
    new THREE.MeshLambertMaterial({ color: 0xf2e2b8 }),
  );
  beach.rotation.x = -Math.PI / 2; beach.position.set(0, 0.0, -HALF - 13); beach.receiveShadow = true;
  scene.add(beach);
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(HALF * 2 + 260, 160),
    new THREE.MeshLambertMaterial({ color: 0x2f7fc9 }),
  );
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.2, -HALF - 26 - 80); sea.receiveShadow = true;
  scene.add(sea);

  // Roads: asphalt strips with pale sidewalks on each side, dashed centre lines.
  const asphalt = new THREE.MeshLambertMaterial({ color: 0x3a3f46 });
  const walkMat = new THREE.MeshLambertMaterial({ color: 0xb9b3a4 });
  const dashMat = new THREE.MeshLambertMaterial({ color: 0xf5e9c8 });
  for (const c of ROAD_CENTERS) {
    for (const horiz of [true, false]) {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2 + 4, ROAD), asphalt);
      road.rotation.x = -Math.PI / 2;
      road.position.set(horiz ? 0 : c, 0.02, horiz ? c : 0);
      if (!horiz) road.rotation.z = Math.PI / 2;
      road.receiveShadow = true;
      scene.add(road);
      for (const side of [-1, 1]) {
        const walk = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2 + 4, 3), walkMat);
        walk.rotation.x = -Math.PI / 2;
        walk.position.set(horiz ? 0 : c + side * (ROAD / 2 + 1.5), 0.03, horiz ? c + side * (ROAD / 2 + 1.5) : 0);
        if (!horiz) walk.rotation.z = Math.PI / 2;
        walk.receiveShadow = true;
        scene.add(walk);
      }
      // Centre dashes.
      for (let t = -HALF; t < HALF; t += 8) {
        const dash = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 0.35), dashMat);
        dash.position.set(horiz ? t : c, 0.05, horiz ? c : t);
        if (!horiz) dash.rotation.y = Math.PI / 2;
        scene.add(dash);
      }
    }
  }

  // Blocks: buildings + trees + lamps.
  const blockCenters = [];
  for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
    blockCenters.push({ x: -HALF + ROAD + BLOCK / 2 + i * PITCH, z: -HALF + ROAD + BLOCK / 2 + j * PITCH });
  }
  for (const bc of blockCenters) {
    const n = rangeInt(rng, 1, 3);
    for (let k = 0; k < n; k++) {
      const w = range(rng, 10, 20), d = range(rng, 10, 20), h = range(rng, 9, 38);
      const x = bc.x + range(rng, -8, 8), z = bc.z + range(rng, -8, 8);
      const b = makeBuilding(rng, w, d, h, x, z, textures);
      scene.add(b.group);
      aabbs.push(b.aabb);
    }
    // Trees at block corners.
    for (let k = 0; k < 2; k++) {
      const t = makeTree(rng);
      t.position.set(bc.x + (rng() < 0.5 ? -14 : 14), 0, bc.z + (rng() < 0.5 ? -14 : 14));
      scene.add(t);
    }
  }
  // Lamps along roads.
  for (const c of ROAD_CENTERS) {
    for (let t = -HALF + 10; t < HALF; t += 48) {
      const lamp = makeLamp();
      lamp.position.set(c + ROAD / 2 + 2.4, 0, t);
      scene.add(lamp);
      const lamp2 = makeLamp();
      lamp2.position.set(t, 0, c - ROAD / 2 - 2.4);
      scene.add(lamp2);
    }
  }
  // Neon signs on a few buildings (emissive canvas text; they glow at dusk).
  const NEON = [
    { text: 'HOTEL', color: '#ff4fd8' }, { text: 'BAR', color: '#37e0ff' },
    { text: 'CASINO', color: '#ffd23e' }, { text: 'PIER', color: '#7dff9a' },
    { text: 'TACOS', color: '#ff8a3d' }, { text: 'CLUB', color: '#b06bff' },
  ];
  const neonMeshes = [];
  for (let i = 0; i < 8; i++) {
    const bc = blockCenters[Math.floor(rng() * blockCenters.length)];
    const n = NEON[i % NEON.length];
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const g2 = c.getContext('2d');
    g2.fillStyle = '#111111'; g2.fillRect(0, 0, 256, 64);
    g2.font = 'bold 40px Arial'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
    g2.shadowColor = n.color; g2.shadowBlur = 18;
    g2.fillStyle = n.color; g2.fillText(n.text, 128, 34);
    g2.fillStyle = '#ffffff'; g2.fillText(n.text, 128, 34);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 2.25),
      new THREE.MeshBasicMaterial({ map: tex, transparent: false }),
    );
    sign.position.set(bc.x + range(rng, -10, 10), range(rng, 8, 16), bc.z + (rng() < 0.5 ? -19 : 19));
    sign.rotation.y = sign.position.z > bc.z ? 0 : Math.PI;
    scene.add(sign);
    neonMeshes.push(sign);
  }
  return { aabbs, blockCenters, neonMeshes };
}

// Is (x,z) inside any building AABB (with a margin)?
export function hitsBuilding(aabbs, x, z, margin) {
  for (const b of aabbs) {
    if (x > b.minX - margin && x < b.maxX + margin && z > b.minZ - margin && z < b.maxZ + margin) return b;
  }
  return null;
}
// Nearest road centre on an axis, and whether (x,z) is on a road.
export function onRoad(x, z) {
  const near = (v) => ROAD_CENTERS.some((c) => Math.abs(v - c) <= ROAD / 2 + 0.6);
  return near(x) || near(z);
}
export function nearestRoadCenter(v) {
  let best = ROAD_CENTERS[0], bd = Infinity;
  for (const c of ROAD_CENTERS) { const d = Math.abs(v - c); if (d < bd) { bd = d; best = c; } }
  return best;
}
