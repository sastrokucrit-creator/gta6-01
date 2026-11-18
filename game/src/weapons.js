// Weapons: 4 slots (1 Fists, 2 Pistol, 3 SMG, 4 Shotgun). SMG unlocks after mission 3,
// shotgun after mission 5. Ammo is shown in the HUD; switching is instant (keys 1-4).
// Fists punch; the rest shoot hitscan with per-weapon damage, rate and range.
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

export function unlockWeapons(w, doneMissions) {
  for (const s of w.slots) {
    if (s.locked && s.unlockMission !== undefined && doneMissions[s.unlockMission]) s.locked = false;
  }
}

export function weaponHud(w) {
  return w.slots.map((s, i) => ({
    key: s.key, name: s.name,
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
