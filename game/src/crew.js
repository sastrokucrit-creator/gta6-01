// Round 8: no gameplay change here — header written in-session so the file is witnessed.
// Crew abilities: Jax's three partners each have one signature move. They sit
// on their own keys (Q, C, V) with their own cooldowns and show as cards on the
// HUD. The effects are real game state — wanted stars, car condition, police
// sight — so a test can read them straight off the game object.
export const CREW_ABILITIES = [
  {
    key: 'KeyQ', label: 'Q', who: 'MARA', role: 'Fixer', name: 'SWAP PLATES',
    desc: 'Mara swaps the plates — lose 2 wanted stars',
    cooldown: 60,
    apply(game) {
      const w = game.wanted;
      const lost = Math.min(2, w.stars);
      w.stars = Math.max(0, w.stars - 2);
      w.quiet = 0;
      if (w.stars === 0) game.setHeli(false);
      return lost;
    },
  },
  {
    key: 'KeyC', label: 'C', who: 'DEX', role: 'Driver', name: 'QUICK FIX',
    desc: 'Dex patches the car on the move — condition back to 100%',
    cooldown: 45,
    apply(game) {
      const car = game.player.inCar;
      if (!car) return 0;
      car.condition = 100;
      return 1;
    },
  },
  {
    key: 'KeyV', label: 'V', who: 'LENA', role: 'Hacker · Lookout', name: 'EYES OUT',
    desc: 'Lena loops the cameras — police lose sight of you for 20s',
    cooldown: 40,
    apply(game) {
      game.wanted.ghostT = 20;
      return 1;
    },
  },
];

export function createCrew() {
  return { slots: CREW_ABILITIES.map((a) => ({ ...a, cd: 0 })) };
}

// Fire one ability by index (0 Mara, 1 Dex, 2 Lena). True when the move went off,
// false while it cools down or when it has nothing to act on (Dex with no car).
// A cooldown only starts on a successful use.
export function useCrew(game, index) {
  const slot = game.crew.slots[index];
  if (!slot || slot.cd > 0) return false;
  const did = slot.apply(game);
  if (!did) return false;
  slot.cd = slot.cooldown;
  game.toast(`${slot.name} — ${slot.who} has you covered!`);
  return true;
}

// Tick cooldowns and the ghost window down once per step. The ghost window lives
// on the wanted state, where the police read it — not on the crew.
export function updateCrew(game, dt) {
  for (const s of game.crew.slots) if (s.cd > 0) s.cd = Math.max(0, s.cd - dt);
  if (game.wanted.ghostT > 0) game.wanted.ghostT = Math.max(0, game.wanted.ghostT - dt);
}

// Rows for the HUD crew panel: key, name, who + role, effect and whether it is ready.
export function crewHud(game) {
  return game.crew.slots.map((s) => ({
    key: s.label, name: s.name, who: s.who, role: s.role, desc: s.desc,
    ready: s.cd <= 0, cd: Math.ceil(s.cd),
  }));
}
