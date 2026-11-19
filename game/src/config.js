// Every tuning number and all the names in one place. Azura Bay is a sunny coastal city:
// a grid of blocks separated by roads, sea and beach to the south, palms everywhere.
// District names, car names, radio stations and crew names are all original.
export const STEP = 1 / 60;
export const BLOCK = 36;
export const ROAD = 12;
export const PITCH = BLOCK + ROAD; // 48
export const GRID = 5;
export const HALF = (GRID * PITCH + ROAD) / 2; // 126
export const ROAD_CENTERS = [-126, -78, -30, 18, 66, 114];
export const SAVE_KEY = 'azura-bay-save-v1';
export const CITY_NAME = 'Azura Bay';

export const PLAYER = {
  walkSpeed: 6, runSpeed: 10, jumpSpeed: 8.5, radius: 0.55, height: 1.8,
};
export const CAR = {
  accel: 22, brake: 34, maxSpeed: 40, maxReverse: 10, steer: 1.9, grip: 8,
};
export const WANTED_MAX = 5;

// Districts: 3x3 zones across the city (south row is the beachfront, north row
// holds the airstrip). All nine names are distinct so the minimap label always
// tells the player somewhere new.
export const DISTRICTS = [
  ['OLD PORT', 'DOCKLANDS', 'MARINA WALK'],
  ['PALM HEIGHTS', 'NEON MILE', 'CORAL ROW'],
  ['SUNSET QUAY', 'THE AIRSTRIP', 'UPTOWN'],
];
export function districtAt(x, z) {
  const col = Math.max(0, Math.min(2, Math.floor((x + HALF) / (HALF * 2 / 3))));
  const row = Math.max(0, Math.min(2, Math.floor((z + HALF) / (HALF * 2 / 3))));
  return DISTRICTS[row][col];
}

// Original car model names (one per traffic colour slot, plus the taxi).
export const CAR_NAMES = ['Comet GT', 'Coast Cruiser', 'Dune Runner', 'Street Hawk', 'Vulture', 'Palm Runner', 'Bay Breeze', 'Night Fox', 'Turbo Ray'];
export const TAXI_NAME = 'Azura Cab';

// Radio stations (original names + song titles), switched with R in a car.
export const RADIO = [
  { freq: '88.1', name: 'WAVE 88.1', songs: ['Neon Drive — Palm Static', 'Midnight Palm — The Coasters', 'Salt Air — Marina Blue'] },
  { freq: '94.5', name: 'PALM FM 94.5', songs: ['Turbo Heart — Velo City', 'Sunset Quay — Coral Kings', 'Boardwalk Nights — The Tides'] },
  { freq: '101.2', name: 'BAY ROCK 101.2', songs: ['Engine Roar — Iron Palms', 'Highway Heat — Dust Devils', 'Chrome Hearts — The Rivieras'] },
  { freq: '107.7', name: 'TROPICANA 107.7', songs: ['Isla Breeze — Coco Loco', 'Mango Sky — Sol Band', 'Fiesta Bay — Los Palmeros'] },
];

// Weapons: 5 slots. SMG unlocks after mission 2, shotgun after mission 4, and the
// REAPER heavy rifle stays locked until the final job is done. Every gun has a
// price on the HUD so the arsenal reads like a shop, not a freebie rack.
export const WEAPONS = [
  { key: '1', name: 'FISTS', price: 0, ammo: Infinity, damage: 0, rate: 0.45, range: 2.2, locked: false },
  { key: '2', name: 'PISTOL', price: 1200, ammo: 60, damage: 34, rate: 0.32, range: 60, locked: false },
  { key: '3', name: 'SMG', price: 3800, ammo: 120, damage: 18, rate: 0.11, range: 45, locked: true, unlockMission: 2 },
  { key: '4', name: 'SHOTGUN', price: 5500, ammo: 24, damage: 80, rate: 0.9, range: 22, locked: true, unlockMission: 4 },
  { key: '5', name: 'REAPER', price: 9500, ammo: 12, damage: 120, rate: 1.1, range: 80, locked: true, unlockMission: 11 },
];

// REP ranks: XP from missions, escapes and steals. Six rungs on the ladder, spaced
// so the title climbs through the whole campaign — the top rung only lands after
// the final job, never halfway through. Mission REP is 250 + 60 * mission index,
// so the running totals are 250, 560, 930, 1360, 1850, 2400, 3010, 3680, 4410,
// 5200, 6050, 6960: rank 2 after job 3, rank 3 after job 5, rank 4 after job 7,
// rank 5 after job 10, and AZURA LEGEND only when the crown is home.
export const REP_RANKS = [
  { xp: 0, title: 'STREET RAT' },
  { xp: 600, title: 'CORNER KID' },
  { xp: 1500, title: 'BAY HUSTLER' },
  { xp: 2800, title: 'WHEELMAN' },
  { xp: 4500, title: 'FIXER' },
  { xp: 6500, title: 'AZURA LEGEND' },
];
export function repRank(xp) {
  let r = 0;
  for (let i = 0; i < REP_RANKS.length; i++) if (xp >= REP_RANKS[i].xp) r = i;
  const next = REP_RANKS[r + 1];
  return { level: r + 1, title: REP_RANKS[r].title, cur: xp - REP_RANKS[r].xp, need: next ? next.xp - REP_RANKS[r].xp : 0, maxed: !next };
}

// Mission payouts: the jobs pay like a career, not pocket money. The first eleven
// jobs total $85,000 on top of the $2,000 Jax starts with, so the crew walks into
// the finale holding $87,000 — and the crown itself is worth $60,000.
export const MISSION_REWARDS = [3000, 4500, 4000, 5500, 6500, 7500, 9000, 8000, 10000, 12000, 15000, 60000];
