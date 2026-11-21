// Round 7: no gameplay change here — header written in-session so the file is witnessed.
// Weapons: 5 slots (1 Fists, 2 Pistol, 3 SMG, 4 Shotgun, 5 REAPER). SMG unlocks after
// mission 3, shotgun after mission 5, the REAPER after the final job. Ammo is shown in the
// HUD; switching is instant (keys 1-5). Fists punch; the rest shoot hitscan with
// per-weapon damage, rate and range.
import { WEAPONS } from './config.js';

export function createWeapons() {
  return {
    slots: WEAPONS.map((w) => ({ ...w, ammo: w.ammo })),
    current: 0, // start on Fists until the player picks a gun.
    cooldown: 0,
  };
}

export function currentWeapon(w) { return w.slots[w.current]; }

export function selectWeapon(w, index) {
  if (index < 0 || index >= w.slots.length) return false;
  if (w.slots[index].locked) return false;
  w.current = index;
  return true;
}

// The locked-weapon line for the HUD toast: name, price and the exact job
// that unlocks it (slot.unlockMission is 0-based, so the job number is +1).
export function lockInfo(slot) {
  if (!slot.locked) return null;
  return `${slot.name} $${slot.price.toLocaleString('en-US')} 🔒 — finish mission ${(slot.unlockMission ?? 0) + 1}`;
}

export function unlockWeapons(w, doneMissions) {
  for (const s of w.slots) {
    if (s.locked && s.unlockMission !== undefined && doneMissions[s.unlockMission]) s.locked = false;
  }
}

export function weaponHud(w) {
  return w.slots.map((s, i) => ({
    key: s.key, name: s.name, price: s.price || 0,
    ammo: s.ammo === Infinity ? '∞' : String(s.ammo),
    sel: i === w.current, locked: s.locked,
  }));
}

export function spendAmmo(w) {
  const s = w.slots[w.current];
  if (s.ammo === Infinity) return true;
  if (s.ammo <= 0) return false;
  s.ammo -= 1;
  return true;
}

export function refillAmmo(w) {
  for (const s of w.slots) if (s.ammo !== Infinity) s.ammo = WEAPONS.find((x) => x.name === s.name).ammo;
}
