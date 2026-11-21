// Dense HUD, all four sides: mission panel (top-left), money / wanted / weapon slots /
// day+time / IN SIGHT (top-right), police response (mid-left), round minimap + district
// (bottom-left), health/armour/REP (bottom-left), character dialogue with portrait
// (bottom-centre), speedometer + car name + condition + radio + gear (bottom-right).
import { HALF, ROAD_CENTERS, districtAt, streetAt, MISSION_REWARDS } from './config.js';
import { SPEAKERS, chapterOf } from './missions.js';
import { drawPortrait } from './portraits.js';
import { weaponHud } from './weapons.js';
import { crewHud } from './crew.js';
import { unitList } from './wanted.js';
import { radioNow } from './radio.js';

const $ = (id) => document.getElementById(id);
let mapCtx = null;

export function initHud() {
  mapCtx = $('minimap').getContext('2d');
  $('hud').classList.add('on');
}

export function hideHud() { $('hud').classList.remove('on'); }

function fmtClock(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Mission countdowns read as minutes:seconds (2:28, not 148s).
function fmtTimer(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Car condition in words as well as a bar: the number and the verdict side by side.
function condLabel(condition) {
  if (condition >= 75) return 'PRISTINE';
  if (condition >= 50) return 'GOOD';
  if (condition >= 25) return 'DAMAGED';
  if (condition > 0) return 'BATTERED';
  return 'WRECKED';
}

export function updateHud(game) {
  const p = game.player;
  const ms = game.missions;
  // Mission panel (top-left): chapter + mission + stage + timer + reward.
  const mt = $('mission');
  if (ms.active >= 0) {
    const m = game.missionDefs[ms.active];
    const st = m.stages[ms.stage];
    const next = game.missionDefs[ms.active + 1];
    const ch = chapterOf(ms.active);
    mt.querySelector('.mchap').textContent = `CH.${ch.num} · ${ch.name}`;
    mt.querySelector('.mtitle').textContent = `MISSION ${ms.active + 1}/12 · ${m.name.toUpperCase()}`;
    mt.querySelector('.mobj').textContent = `STAGE ${ms.stage + 1}/${m.stages.length} — ${st.text}`;
    mt.querySelector('.mnext').textContent = next ? `NEXT: ${next.name}` : 'NEXT: — final job —';
    mt.querySelector('.mtimer').textContent = ms.timer > 0 ? `⏱ ${fmtTimer(ms.timer)}` : '';
    mt.querySelector('.mreward').textContent = `REWARD $${MISSION_REWARDS[ms.active].toLocaleString('en-US')}`;
  } else {
    const nextId = game.nextMissionId();
    const ch = nextId >= 0 ? chapterOf(nextId) : null;
    mt.querySelector('.mchap').textContent = ch ? `CH.${ch.num} · ${ch.name}` : '';
    mt.querySelector('.mtitle').textContent = nextId >= 0 ? `MISSION ${nextId + 1}/12 READY` : 'ALL 12 MISSIONS DONE';
    mt.querySelector('.mobj').textContent = nextId >= 0 ? game.missionDefs[nextId].name : 'Free roam — Azura Bay is yours.';
    mt.querySelector('.mnext').textContent = nextId >= 0 ? 'Press M to start' : '';
    mt.querySelector('.mtimer').textContent = '';
    mt.querySelector('.mreward').textContent = nextId >= 0 ? `REWARD $${MISSION_REWARDS[nextId].toLocaleString('en-US')}` : '';
  }
  // Top-right: money, wanted stars, weapon slots with prices, day+time, sight.
  $('money').textContent = `$${p.money.toLocaleString('en-US')}`;
  const stars = $('wanted').children;
  for (let i = 0; i < stars.length; i++) stars[i].className = i < game.wanted.stars ? '' : 'off';
  $('weapons').innerHTML = weaponHud(game.weapons).map((s) => {
    const price = s.price > 0 ? `$${s.price.toLocaleString('en-US')}` : '';
    return `<span class="${s.sel ? 'sel' : ''} ${s.locked ? 'locked' : ''}">${s.key} ${s.name} ${price} ${s.locked ? '🔒' : s.ammo}</span>`;
  }).join('');
  $('clock').textContent = `DAY ${game.day} · ${fmtClock(game.clockMinutes)}`;
  const sight = $('sight');
  if (game.wanted.stars > 0) {
    sight.style.display = 'block';
    sight.textContent = game.wanted.seen ? '● IN SIGHT' : '○ HIDDEN';
    sight.className = game.wanted.seen ? 'seen' : 'hidden';
  } else sight.style.display = 'none';
  // Azura PD dispatch (mid-left): named units with role + live distance, and a
  // unit count in the title so the heat reads at a glance. AIR ONE joins the
  // panel with its spotlight role while the helicopter is up.
  const pol = $('police');
  if (game.wanted.stars > 0) {
    pol.style.display = 'block';
    const units = unitList(game.wanted, game.heli, p.x, p.z);
    $('police').querySelector('.ptitle').textContent = `AZURA PD DISPATCH · ${units.length} UNIT${units.length === 1 ? '' : 'S'}`;
    $('units').innerHTML = units.map((u) =>
      `<div class="unit"><b>${u.name}</b> · <span class="role">${u.status}</span> · ${u.dist}m</div>`).join('') ||
      '<div class="unit">No units in range</div>';
  } else pol.style.display = 'none';
  // Roadblock warning banner (top-centre): visible while a roadblock stands ahead.
  const rb = $('roadblock');
  if (game.wanted.stars >= 4 && game.wanted.roadblock.length > 0) {
    rb.style.display = 'block';
    rb.textContent = '⚠ ROADBLOCK AHEAD — smash through or go around!';
  } else rb.style.display = 'none';
  // Vitals + RANK (bottom-left): the rank is the career headline, so it reads
  // RANK + title + RP progress, never just a number.
  $('healthfill').style.width = `${Math.max(0, p.health)}%`;
  $('hptext').textContent = Math.max(0, Math.round(p.health));
  $('armourfill').style.width = `${Math.max(0, p.armour)}%`;
  $('armtext').textContent = Math.max(0, Math.round(p.armour));
  const rep = game.repInfo();
  $('rep').textContent = `RANK ${rep.level} · ${rep.title} ${rep.maxed ? 'MAX' : `${rep.cur}/${rep.need} RP`}`;
  $('repbar').firstElementChild.style.width = rep.maxed ? '100%' : `${Math.round((rep.cur / rep.need) * 100)}%`;
  // District + street under minimap: the player always knows the exact road.
  $('district').textContent = `${districtAt(p.x, p.z)} · ${p.street || streetAt(p.x, p.z)}`;
  // Dialogue (bottom-centre) with portrait: name · role, so every voice is
  // introduced, not just named.
  const dlg = $('dialog');
  if (ms.dialogT > 0 && ms.dialog) {
    dlg.style.display = 'block';
    const sp = SPEAKERS[ms.dialog.who] || SPEAKERS.MARA;
    drawPortrait($('portrait'), ms.dialog.who);
    dlg.querySelector('.dname').textContent = sp.role ? `${sp.name} · ${sp.role}` : sp.name;
    dlg.querySelector('.dtext').textContent = ms.dialog.text;
  } else dlg.style.display = 'none';
  // Driving cluster (bottom-right): speed, car, condition bar + label, radio, gear.
  const sp = $('speedo');
  if (p.inCar) {
    sp.style.display = 'block';
    sp.innerHTML = `${Math.round(Math.abs(p.inCar.speed) * 3.6)} <small>km/h</small>`;
    $('carname').textContent = p.inCar.name;
    $('condbar').style.display = 'block';
    const cf = $('condfill');
    cf.style.width = `${Math.max(0, p.inCar.condition)}%`;
    cf.style.background = p.inCar.condition > 50 ? '#37d67a' : p.inCar.condition > 25 ? '#ffd23e' : '#ff5a4e';
    const cl = $('condlabel');
    cl.style.display = 'block';
    cl.textContent = `CONDITION ${Math.round(Math.max(0, p.inCar.condition))}% · ${condLabel(p.inCar.condition)}`;
    $('radio').textContent = `♪ NOW PLAYING — ${radioNow(game.radio).station} · ${radioNow(game.radio).song}`;
    $('gear').textContent = `GEAR ${p.inCar.speed > 0.5 ? 'D' : p.inCar.speed < -0.5 ? 'R' : 'N'} · ${game.radio.station + 1}/4 · press R`;
  } else {
    sp.style.display = 'none';
    $('carname').textContent = '';
    $('condbar').style.display = 'none';
    $('condlabel').style.display = 'none';
    $('radio').textContent = '';
    $('gear').textContent = '';
  }
  // Crew abilities (mid-right): three cards, key + name + who · role + effect + cooldown.
  const crewEl = $('crew');
  crewEl.innerHTML = `<div class="ctitle">CREW ABILITIES</div>` + crewHud(game).map((c) =>
    `<div class="crewcard ${c.ready ? 'ready' : 'cooling'}"><b>[${c.key}] ${c.name}</b> · ${c.who}${c.role ? ` — ${c.role}` : ''}<br><span class="cdesc">${c.desc}</span><br><span class="ccd">${c.ready ? 'READY' : `READY IN ${c.cd}s`}</span></div>`).join('');
  $('crosshair').style.display = game.armed ? 'block' : 'none';
  drawMinimap(game);
}

export function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.style.display = 'none'; }, 2600);
}

function drawMinimap(game) {
  if (!mapCtx) return;
  const c = mapCtx.canvas, W = c.width, H = c.height;
  const scale = W / (HALF * 2 + 40);
  const toMap = (x, z) => [W / 2 + x * scale, H / 2 + z * scale];
  mapCtx.clearRect(0, 0, W, H);
  mapCtx.fillStyle = '#1c2733';
  mapCtx.fillRect(0, 0, W, H);
  mapCtx.strokeStyle = '#5a6470';
  mapCtx.lineWidth = 5;
  for (const r of ROAD_CENTERS) {
    const [x1, y1] = toMap(r, -HALF);
    const [x2, y2] = toMap(r, HALF);
    mapCtx.beginPath(); mapCtx.moveTo(x1, y1); mapCtx.lineTo(x2, y2); mapCtx.stroke();
    const [x3, y3] = toMap(-HALF, r);
    const [x4, y4] = toMap(HALF, r);
    mapCtx.beginPath(); mapCtx.moveTo(x3, y3); mapCtx.lineTo(x4, y4); mapCtx.stroke();
  }
  // Coastline: the beach and sea sit south of the grid (negative Z), which maps
  // to the top of the minimap — sand band, then blue sea at the very top edge.
  mapCtx.fillStyle = '#f2e2b8';
  mapCtx.fillRect(0, 7, W, 4);
  mapCtx.fillStyle = '#1f9fd6';
  mapCtx.fillRect(0, 0, W, 7);
  const dot = (x, z, color, r) => {
    const [mx, my] = toMap(x, z);
    mapCtx.fillStyle = color;
    mapCtx.beginPath(); mapCtx.arc(mx, my, r, 0, Math.PI * 2); mapCtx.fill();
  };
  for (const car of game.traffic) dot(car.x, car.z, '#f2c230', 2);
  for (const car of game.parked) dot(car.x, car.z, '#9aa5ad', 2);
  for (const car of game.wanted.police) dot(car.x, car.z, '#3b82ff', 3);
  if (game.heli.active) dot(game.heli.x, game.heli.z, '#ff5a4e', 3);
  const t = game.missionTarget();
  if (t) {
    const [mx, my] = toMap(t.x, t.z);
    const pulse = 5 + Math.sin(performance.now() / 200) * 2;
    mapCtx.fillStyle = '#ff4fd8';
    mapCtx.beginPath(); mapCtx.arc(mx, my, pulse, 0, Math.PI * 2); mapCtx.fill();
    mapCtx.fillStyle = '#fff';
    mapCtx.beginPath(); mapCtx.arc(mx, my, 2, 0, Math.PI * 2); mapCtx.fill();
  }
  const [px, py] = toMap(game.player.x, game.player.z);
  // Search zone: when the heat is on and the police can see the player, a red
  // ring pulses around the player's arrow — the search follows the player.
  if (game.wanted.stars >= 3 && game.wanted.seen) {
    const pulse = 22 + Math.sin(performance.now() / 220) * 5;
    mapCtx.strokeStyle = 'rgba(255, 60, 50, 0.95)';
    mapCtx.lineWidth = 2.5;
    mapCtx.beginPath(); mapCtx.arc(px, py, pulse, 0, Math.PI * 2); mapCtx.stroke();
    mapCtx.fillStyle = 'rgba(255, 60, 50, 0.14)';
    mapCtx.beginPath(); mapCtx.arc(px, py, pulse, 0, Math.PI * 2); mapCtx.fill();
  }
  mapCtx.save();
  mapCtx.translate(px, py);
  mapCtx.rotate(-game.player.angle + Math.PI);
  mapCtx.fillStyle = '#37d67a';
  mapCtx.beginPath(); mapCtx.moveTo(0, -7); mapCtx.lineTo(5, 6); mapCtx.lineTo(-5, 6); mapCtx.closePath(); mapCtx.fill();
  mapCtx.restore();
  mapCtx.fillStyle = '#fff';
  mapCtx.font = 'bold 11px Arial';
  mapCtx.fillText('N', W / 2 - 4, 12);
}
