// The city of Solara Bay: a sunny coastal grid. Roads run along both axes; each block holds
// 1-4 procedural buildings with canvas window textures, plus trees, lamps and sidewalks.
// Buildings are solid AABBs (cars and the player collide with them). The sea glitters to the
// south (negative Z) beyond a palm-lined beach.
import * as THREE from '../vendor/three.module.min.js';
import { BLOCK, GRID, HALF, PITCH, ROAD, ROAD_CENTERS } from './config.js';
import { pick, range, rangeInt } from './rng.js';

const WALL_COLORS = [0xe8dcc8, 0xd9c4a5, 0xc9b8a3, 0xb8c4c9, 0xe0b48f, 0xf2e3c6, 0xc7d3c0, 0xdba58a];
// Bright sun-soaked facades: pink, orange, teal, yellow, coral, sky, purple.
const BRIGHT_COLORS = [0xff7bac, 0xff8a3d, 0x2fb8a6, 0xffd23e, 0xff6b5e, 0x7dd3fc, 0xc084fc];
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

// A real palm: tall leaning trunk, a ring of long drooping fronds, coconuts.
function makePalm(rng) {
  const g = new THREE.Group();
  const lean = range(rng, -0.12, 0.12);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8a6a45 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.3, 5.2, 7), trunkMat);
  trunk.position.set(0, 2.6, 0); trunk.rotation.z = lean; trunk.castShadow = true;
  g.add(trunk);
  const topX = -Math.sin(lean) * 5.2, topY = 5.2 * Math.cos(lean);
  const frondMat = new THREE.MeshLambertMaterial({ color: pick(rng, [0x2fae5f, 0x37b24d, 0x27a35c]) });
  const nFronds = 7;
  for (let i = 0; i < nFronds; i++) {
    const a = (i / nFronds) * Math.PI * 2 + range(rng, -0.2, 0.2);
    // Pivot rotated around Y so the frond points radially outward; the frond
    // itself is tilted down (droop) around the pivot's local X.
    const pivot = new THREE.Group();
    pivot.position.set(topX, topY - 0.1, 0);
    pivot.rotation.y = a;
    const frond = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 2.6), frondMat);
    frond.position.set(0, -0.15, 1.15);
    frond.rotation.x = 0.55; // far end droops toward the ground
    frond.castShadow = true;
    pivot.add(frond);
    g.add(pivot);
  }
  const nutMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2a });
  for (let i = 0; i < 3; i++) {
    const nut = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 5), nutMat);
    nut.position.set(topX + range(rng, -0.3, 0.3), topY - 0.45, range(rng, -0.3, 0.3));
    g.add(nut);
  }
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
    new THREE.MeshLambertMaterial({ color: 0xfff2b0, emissive: 0x887700 }),
  );
  bulb.position.y = 5.05;
  g.add(pole); g.add(bulb);
  return g;
}

// A striped beach umbrella: pole + wide cone canopy in a bright colour.
function makeUmbrella(rng) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 2.6, 6),
    new THREE.MeshLambertMaterial({ color: 0xf2f2f2 }),
  );
  pole.position.y = 1.3;
  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(2.2, 1.0, 8),
    new THREE.MeshLambertMaterial({ color: pick(rng, [0xff7bac, 0xffd23e, 0x2fb8a6, 0xff8a3d, 0x7dd3fc]) }),
  );
  canopy.position.y = 2.9; canopy.castShadow = true;
  g.add(pole); g.add(canopy);
  return g;
}

// A wooden bench facing the sea.
function makeBench() {
  const g = new THREE.Group();
  const wood = new THREE.MeshLambertMaterial({ color: 0x8a6a45 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 0.7), wood);
  seat.position.y = 0.55; seat.castShadow = true;
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 0.14), wood);
  back.position.set(0, 1.0, 0.32); back.castShadow = true;
  g.add(seat); g.add(back);
  for (const x of [-1.0, 1.0]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.6), wood);
    leg.position.set(x, 0.28, 0);
    g.add(leg);
  }
  return g;
}

// A big ferris wheel on the water's edge — the beach's landmark, a silhouette
// against the sunset. Returns the rotating wheel group.
function makeFerrisWheel() {
  const g = new THREE.Group();
  const frameMat = new THREE.MeshLambertMaterial({ color: 0xf2f2f2 });
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x333a42 });
  // Platform deck on posts, out over the water.
  const deck = new THREE.Mesh(new THREE.BoxGeometry(14, 0.6, 10), new THREE.MeshLambertMaterial({ color: 0x8a6a45 }));
  deck.position.y = 0.4; deck.castShadow = true; deck.receiveShadow = true;
  g.add(deck);
  for (const px of [-5, 5]) for (const pz of [-3.5, 3.5]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.4, 6), darkMat);
    post.position.set(px, -0.6, pz);
    g.add(post);
  }
  // A-frame legs up to the axle.
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.7, 26, 0.7), frameMat);
    leg.position.set(s * 4.5, 12, 0);
    leg.rotation.z = -s * 0.18;
    leg.castShadow = true;
    g.add(leg);
  }
  // The wheel itself: rim, spokes, bright gondolas. Rotates around Z.
  const wheel = new THREE.Group();
  wheel.position.set(0, 22, 0);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(18, 0.55, 8, 40), frameMat);
  rim.castShadow = true;
  wheel.add(rim);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.4, 18, 0.4), darkMat);
    spoke.position.set(Math.sin(a) * 9, Math.cos(a) * 9, 0);
    spoke.rotation.z = -a;
    wheel.add(spoke);
    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.8, 1.8),
      new THREE.MeshLambertMaterial({ color: [0xff7bac, 0xffd23e, 0x2fb8a6, 0xff8a3d][i % 4] }),
    );
    cab.position.set(Math.sin(a) * 18, Math.cos(a) * 18, 0);
    cab.castShadow = true;
    wheel.add(cab);
  }
  const hub = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 8), new THREE.MeshLambertMaterial({ color: 0xffd23e }));
  wheel.add(hub);
  g.add(wheel);
  return { group: g, wheel };
}

export function buildCity(scene, rng) {
  const aabbs = [];
  const textures = [];
  // Mix of muted and bright sun-soaked facades (about half the buildings pop).
  for (let i = 0; i < 7; i++) {
    const pal = i < 4 ? WALL_COLORS : BRIGHT_COLORS;
    const hex = '#' + new THREE.Color(pick(rng, pal)).getHexString();
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
    new THREE.MeshLambertMaterial({ color: 0x1f9fd6 }),
  );
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.2, -HALF - 26 - 80); sea.receiveShadow = true;
  scene.add(sea);
  // White foam where the waves meet the sand, plus a second foam line further out.
  const foamMat = new THREE.MeshLambertMaterial({ color: 0xeaf7ff });
  for (const fz of [-152, -168]) {
    const foam = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2 + 260, 1.6), foamMat);
    foam.rotation.x = -Math.PI / 2; foam.position.set(0, -0.1, fz);
    scene.add(foam);
  }
  // Palm-lined beach: a row of palms along the sand, and a wooden pier at x=-78
  // reaching into the sea (the beach road's landmark, right ahead in the dusk shot).
  for (let x = -120; x <= 120; x += 11) {
    const palm = makePalm(rng);
    palm.position.set(x + range(rng, -3, 3), 0, -133 + range(rng, -4, 4));
    palm.rotation.y = rng() * Math.PI * 2;
    scene.add(palm);
  }
  {
    const pierMat = new THREE.MeshLambertMaterial({ color: 0x8a6a45 });
    const pier = new THREE.Group();
    const deck = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 34), pierMat);
    deck.position.set(0, 0.6, 0); deck.castShadow = true; deck.receiveShadow = true;
    pier.add(deck);
    for (let pz = -15; pz <= 15; pz += 6) {
      for (const px of [-2.6, 2.6]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.2, 6), pierMat);
        post.position.set(px, -0.2, pz);
        pier.add(post);
      }
    }
    const pierEnd = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 6), pierMat);
    pierEnd.position.set(0, 0.6, -19); pierEnd.castShadow = true;
    pier.add(pierEnd);
    pier.position.set(-78, 0, -156);
    scene.add(pier);
  }
  // Beach resort props: striped umbrellas and benches facing the sea along the sand.
  for (let x = -118; x <= 118; x += 22) {
    const umb = makeUmbrella(rng);
    umb.position.set(x + range(rng, -3, 3), 0, -138 + range(rng, -3, 3));
    umb.rotation.y = rng() * Math.PI * 2;
    scene.add(umb);
  }
  for (let x = -108; x <= 108; x += 36) {
    const bench = makeBench();
    bench.position.set(x, 0, -133);
    bench.rotation.y = Math.PI; // face the sea
    scene.add(bench);
  }
  // Ferris wheel on the water's edge, east of the pier — the beach's landmark.
  const ferris = makeFerrisWheel();
  ferris.group.position.set(-30, 0, -185);
  scene.add(ferris.group);

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
    // Trees at block corners; palms in the beachfront (southern) row.
    for (let k = 0; k < 2; k++) {
      const t = makeTree(rng);
      t.position.set(bc.x + (rng() < 0.5 ? -14 : 14), 0, bc.z + (rng() < 0.5 ? -14 : 14));
      scene.add(t);
    }
    if (bc.z < -80) {
      const palm = makePalm(rng);
      palm.position.set(bc.x + (rng() < 0.5 ? -13 : 13), 0, bc.z + (rng() < 0.5 ? -13 : 13));
      palm.rotation.y = rng() * Math.PI * 2;
      scene.add(palm);
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
    { text: 'SUNSET', color: '#ff6b5e' }, { text: 'PIER 9', color: '#7dd3fc' },
    { text: 'WAVES', color: '#2fb8a6' },
  ];
  const neonMeshes = [];
  for (let i = 0; i < 11; i++) {
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
      new THREE.PlaneGeometry(12, 3),
      new THREE.MeshBasicMaterial({ map: tex, transparent: false }),
    );
    sign.position.set(bc.x + range(rng, -10, 10), range(rng, 10, 20), bc.z + (rng() < 0.5 ? -19 : 19));
    sign.rotation.y = sign.position.z > bc.z ? 0 : Math.PI;
    scene.add(sign);
    neonMeshes.push(sign);
  }
  return { aabbs, blockCenters, neonMeshes, ferris: ferris.wheel };
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
