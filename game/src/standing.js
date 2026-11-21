// Round 8: STREET STANDING — every district remembers you. Each of Azura
// Bay's nine districts carries a standing (0-100) with the locals who live
// there: pull a job off in a district and the streets warm to you; bring
// police heat down on a district and they go cold. Standing is real state,
// not a label: it moves on mission stages (+3 where the stage lands) and on
// completed jobs (+5 where the job pays out), and it drops (-4) every time
// the wanted level rises in a district. It saves with the career and shows
// under the district line on the HUD as a word + a bar, so the player always
// knows where they are welcome and where they are not.
import { DISTRICTS, districtAt } from './config.js';

// Labels are the city's own words for how a district feels about Jax.
export const STANDING_LABELS = [
  { min: 85, label: 'LOYAL' },
  { min: 65, label: 'WARM' },
  { min: 50, label: 'NEUTRAL' },
  { min: 25, label: 'WARY' },
  { min: 0, label: 'COLD' },
];

export function standingLabel(v) {
  for (const l of STANDING_LABELS) if (v >= l.min) return l.label;
  return 'COLD';
}

// A fresh career: every district starts NEUTRAL at 50 — nobody knows Jax yet.
export function createStanding() {
  const s = {};
  for (const row of DISTRICTS) for (const d of row) s[d] = 50;
  return s;
}

export function bumpStanding(standing, district, delta) {
  if (!standing || !(district in standing)) return;
  standing[district] = Math.max(0, Math.min(100, standing[district] + delta));
}

// Standing where the player is standing right now, for the HUD.
export function districtStanding(standing, x, z) {
  const d = districtAt(x, z);
  const value = standing && d in standing ? standing[d] : 50;
  return { district: d, value, label: standingLabel(value) };
}
