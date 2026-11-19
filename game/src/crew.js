// Crew abilities: three named crew members, each with one power the player can
// call on with a key. Mara swaps the plates (heat down), Dex patches the car
// back to 100%, Lena lights up every police unit and the search zone on the
// minimap. Each power has its own cooldown, shown on the crew cards in the HUD.
export const CREW_ABILITIES = [
  { key: 'Z', name: 'SWAP PLATES', who: 'MARA', role: 'FIXER', color: '#c0392b', initial: 'M', desc: 'Lose 1 wanted star', cd: 60 },
  { key: 'X', name: 'QUICK FIX', who: 'DEX', role: 'DRIVER', color: '#2980b9', initial: 'D', desc: 'Repair car to 100%', cd: 45 },
  { key: 'C', name: 'EYES OUT', who: 'LENA', role: 'HACKER', color: '#8e44ad', initial: 'L', desc: 'Reveal police for 15s', cd: 60 },
];

// Per-run state: one cooldown clock per ability, plus the Eyes Out timer.
export function createCrew() {
  return { cd: [0, 0, 0], eyes: 0 };
}

// Cooldowns tick down in the main loop; Eyes Out fades on its own clock.
export function tickCrew(crew, dt) {
  for (let i = 0; i < crew.cd.length; i++) crew.cd[i] = Math.max(0, crew.cd[i] - dt);
  crew.eyes = Math.max(0, crew.eyes - dt);
}

// Fire one crew ability. Returns true when the power actually went off (and the
// cooldown starts); a power that has nothing to do — no heat to lose, no car to
// fix — tells the player why and stays ready.
export function useCrewAbility(game, index) {
  const crew = game.crew;
  const ab = CREW_ABILITIES[index];
  if (!ab || crew.cd[index] > 0) return false;
  if (index === 0) {
    if (game.wanted.stars <= 0) { game.toast('SWAP PLATES — no heat to lose right now'); return false; }
    game.wanted.stars = Math.max(0, game.wanted.stars - 1);
    game.wanted.quiet = 0;
    game.toast('Mara swapped the plates — heat down 1 star');
  } else if (index === 1) {
    const car = game.player.inCar;
    if (!car) { game.toast('QUICK FIX — you need a car for Dex to patch'); return false; }
    car.condition = 100;
    game.toast("Dex patched the car — back to 100%");
  } else {
    crew.eyes = 15;
    game.toast("Lena's eyes are out — police revealed on the map");
  }
  crew.cd[index] = ab.cd;
  return true;
}

// What the HUD crew cards show: name, crew member, role, key, cooldown left.
export function crewHud(crew) {
  return CREW_ABILITIES.map((ab, i) => ({
    key: ab.key, name: ab.name, who: ab.who, role: ab.role, color: ab.color,
    initial: ab.initial, desc: ab.desc, ready: crew.cd[i] <= 0,
    cdLeft: Math.ceil(crew.cd[i]),
  }));
}
