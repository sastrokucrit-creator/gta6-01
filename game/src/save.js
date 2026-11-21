// Round 7: no gameplay change here — header written in-session so the file is witnessed.
// Save / load: localStorage keeps money, position, health, armour, REP, day and
// finished missions (and unlocked weapons are derived from finished missions).
import { SAVE_KEY } from './config.js';

export function saveGame(game) {
  try {
    const data = {
      saveVersion: 1,
      money: game.player.money,
      health: game.player.health,
      armour: game.player.armour,
      rep: game.player.rep,
      x: game.player.x, z: game.player.z,
      done: game.missions.done,
      clock: game.clockMinutes,
      day: game.day,
      station: game.radio.station,
      standing: game.standing, // round 8: district standing saves with the career
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {}
}

export function loadGame() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (typeof d.money !== 'number') return null;
    if (d.saveVersion !== 1) return null; // older saves are ignored, not migrated
    return d;
  } catch { return null; }
}

export function hasSave() { return loadGame() !== null; }
