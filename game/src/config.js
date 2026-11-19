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

// The twelve jobs form four story chapters, so the mission panel can show where
// the player is in the crew's rise — CH.1 is small jobs, CH.4 is the crown heist.
export const CHAPTERS = [
  { name: 'FIRST WHEELS', from: 0, to: 2 },
  { name: 'HEAT RISING', from: 3, to: 5 },
  { name: 'BIG SCORES', from: 6, to: 8 },
  { name: 'AZURA LEGEND', from: 9, to: 11 },
];
export function chapterOf(id) {
  for (let i = 0; i < CHAPTERS.length; i++) {
    if (id >= CHAPTERS[i].from && id <= CHAPTERS[i].to) return { num: i + 1, name: CHAPTERS[i].name };
  }
  return { num: 1, name: CHAPTERS[0].name };
}

// Weapons: 5 slots, each with a street price shown in the HUD. SMG unlocks after
// mission 2, shotgun after mission 4, and the KESTREL long rifle only after the
// final job is done — it stays locked (and priced) for almost the whole game.
export const WEAPONS = [
  { key: '1', name: 'FISTS', ammo: Infinity, damage: 0, rate: 0.45, range: 2.2, price: 0, locked: false },
  { key: '2', name: 'PISTOL', ammo: 60, damage: 34, rate: 0.32, range: 60, price: 1200, locked: false },
  { key: '3', name: 'SMG', ammo: 120, damage: 18, rate: 0.11, range: 45, price: 3800, locked: true, unlockMission: 2 },
  { key: '4', name: 'SHOTGUN', ammo: 24, damage: 80, rate: 0.9, range: 22, price: 2500, locked: true, unlockMission: 4 },
  { key: '5', name: 'KESTREL', ammo: 12, damage: 220, rate: 1.4, range: 120, price: 9500, locked: true, unlockMission: 11 },
];

// REP ranks: XP from missions, escapes and steals. The thresholds stretch across
// the whole campaign, so the rank climbs job by job instead of maxing out early.
// Each rank also carries a letter grade (D → S) for the HUD's rank panel.
export const REP_RANKS = [
  { xp: 0, title: 'STREET RAT', letter: 'D' },
  { xp: 600, title: 'CORNER KID', letter: 'C' },
  { xp: 1500, title: 'BAY HUSTLER', letter: 'B' },
  { xp: 3000, title: 'WHEELMAN', letter: 'A' },
  { xp: 5500, title: 'AZURA LEGEND', letter: 'S' },
];
export function repRank(xp) {
  let r = 0;
  for (let i = 0; i < REP_RANKS.length; i++) if (xp >= REP_RANKS[i].xp) r = i;
  const next = REP_RANKS[r + 1];
  return { level: r + 1, title: REP_RANKS[r].title, letter: REP_RANKS[r].letter, cur: xp - REP_RANKS[r].xp, need: next ? next.xp - REP_RANKS[r].xp : 0, maxed: !next };
}

// Mission payouts grow with the job: small runs pay hundreds, the yacht and the
// harbour pay five figures, and the crown heist pays $60,000. Twelve jobs plus
// the $1,500 starting cash end at $141,300 — and the player walks into the final
// job already holding $81,300.
export const MISSION_REWARDS = [1500, 2000, 1800, 2500, 4000, 5000, 12000, 6000, 8000, 15000, 22000, 60000];
