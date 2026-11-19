// Dense HUD, all four sides: mission panel (top-left), money / wanted / weapon slots /
// day+time / IN SIGHT (top-right), police response (mid-left), round minimap + district
// (bottom-left), health/armour/REP (bottom-left), character dialogue with portrait
// (bottom-centre), speedometer + car name + condition + radio + gear (bottom-right).
import { HALF, ROAD_CENTERS, districtAt, MISSION_REWARDS, chapterOf } from './config.js';
import { SPEAKERS } from './missions.js';
import { drawPortrait } from './portraits.js';
import { weaponHud } from './weapons.js';
import { crewHud } from './crew.js';
import { unitList } from './wanted.js';
import { radioLabel } from './radio.js';

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

// A mission countdown reads as minutes:seconds, like a race clock.
function fmtTimer(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Condition word for the car readout: 100% is pristine, a battered car is wrecked.
function condWord(c) {
  if (c >= 76) return 'PRISTINE';
  if (c >= 51) return 'GOOD';
  if (c >= 26) return 'DENTED';
  return 'WRECKED';
}

export function updateHud(game) {
  const p = game.player;
  const ms = game.missions;
  // Mission panel (top-left): chapter, mission, stage, timer, reward.
  const mt = $('mission');
  if (ms.active >= 0) {
    const m = game.missionDefs[ms.active];
    const st = m.stages[ms.stage];
    const next = game.missionDefs[ms.active + 1];
    const ch = chapterOf(ms.active);
    mt.querySelector('.mtitle').textContent = `MISSION ${ms.active + 1}/12 · ${m.name.toUpperCase()}`;
    mt.querySelector('.mchapter').textContent = `CH.${ch.num} · ${ch.name}`;
    mt.querySelector('.mobj').textContent = `STAGE ${ms.stage + 1}/${m.stages.length} — ${st.text}`;
    mt.querySelector('.mnext').textContent = next ? `NEXT: ${next.name}` : 'NEXT: — final job —';
    mt.querySelector('.mtimer').textContent = ms.timer > 0 ? `⏱ ${fmtTimer(ms.timer)} LEFT` : '';
    mt.querySelector('.mreward').textContent = `REWARD $${MISSION_REWARDS[ms.active].toLocaleString('en-US')}`;
  } else {
    const nextId = game.nextMissionId();
    mt.querySelector('.mtitle').textContent = nextId >= 0 ? `MISSION ${nextId + 1}/12 READY` : 'ALL 12 MISSIONS DONE';
    mt.querySelector('.mchapter').textContent = nextId >= 0 ? `CH.${chapterOf(nextId).num} · ${chapterOf(nextId).name}` : 'CH.4 · AZURA LEGEND — COMPLETE';
    mt.querySelector('.mobj').textContent = nextId >= 0 ? game.missionDefs[nextId].name : 'Free roam — Azura Bay is yours.';
    mt.querySelector('.mnext').textContent = nextId >= 0 ? 'Press M to start' : '';
    mt.querySelector('.mtimer').textContent = '';
    mt.querySelector('.mreward').textContent = nextId >= 0 ? `REWARD $${MISSION_REWARDS[nextId].toLocaleString('en-US')}` : '';
  }
  // Top-right.
  $('money').textContent = `$${p.money.toLocaleString('en-US')}`;
  // Rank panel: letter grade, title and RP progress, right under the money.
  const rep = game.repInfo();
  $('ranktext').textContent = rep.maxed
    ? `RANK ${rep.letter} · ${rep.title} — MAX`
    : `RANK ${rep.letter} · ${rep.title} — ${rep.cur.toLocaleString('en-US')}/${rep.need.toLocaleString('en-US')} RP`;
  $('rankfill').style.width = rep.maxed ? '100%' : `${Math.round((rep.cur / rep.need) * 100)}%`;
  const stars = $('wanted').children;
  for (let i = 0; i < stars.length; i++) stars[i].className = i < game.wanted.stars ? '' : 'off';
  $('weapons').innerHTML = weaponHud(game.weapons).map((s) =>
    `<span class="${s.sel ? 'sel' : ''} ${s.locked ? 'locked' : ''}">${s.key} ${s.name}${s.price > 0 ? ` $${s.price.toLocaleString('en-US')}` : ''} ${s.locked ? '🔒' : s.ammo}</span>`).join('');
  $('clock').textContent = `DAY ${game.day} · ${fmtClock(game.clockMinutes)}`;
  const sight = $('sight');
  if (game.wanted.stars > 0) {
    sight.style.display = 'block';
    const zone = game.wanted.stars >= 3 && game.wanted.seen ? ' — SEARCH ZONE FOLLOWS YOU' : '';
    const eyes = game.crew.eyes > 0 ? '👁 EYES OUT · ' : '';
    sight.textContent = game.wanted.seen ? `${eyes}● IN SIGHT${zone}` : `${eyes}○ HIDDEN`;
    sight.className = game.wanted.seen ? 'seen' : 'hidden';
  } else sight.style.display = 'none';
  // Crew ability cards (mid-right): key, name, member, role, state.
  $('abilities').innerHTML = crewHud(game.crew).map((a) =>
    `<div class="ab ${a.ready ? 'ready' : 'cool'}"><span class="abkey">[${a.key}]</span> <b>${a.name}</b> <span class="abwho">· ${a.who} · ${a.role}</span><br><span class="abdesc">${a.desc}</span> — <span class="abstate">${a.ready ? 'READY' : `${a.cdLeft}s`}</span></div>`).join('');
  // Police response (mid-left): named units with distance + status, and a unit count
  // in the title so the heat reads at a glance.
  const pol = $('police');
  if (game.wanted.stars > 0) {
    pol.style.display = 'block';
    const units = unitList(game.wanted);
    $('police').querySelector('.ptitle').textContent = `AZURA PD RESPONSE · ${units.length} UNIT${units.length === 1 ? '' : 'S'}`;
    $('units').innerHTML = units.map((u) =>
      `<div class="unit"><b>${u.name}</b> · ${u.dist}m · ${u.status}</div>`).join('') ||
      '<div class="unit">No units in range</div>';
  } else pol.style.display = 'none';
  // Roadblock warning banner (top-centre): visible while a roadblock stands ahead.
  const rb = $('roadblock');
  if (game.wanted.stars >= 4 && game.wanted.roadblock.length > 0) {
    rb.style.display = 'block';
    rb.textContent = '⚠ ROADBLOCK AHEAD — smash through or go around!';
  } else rb.style.display = 'none';
  // Vitals + REP (bottom-left).
  $('healthfill').style.width = `${Math.max(0, p.health)}%`;
  $('hptext').textContent = Math.max(0, Math.round(p.health));
  $('armourfill').style.width = `${Math.max(0, p.armour)}%`;
  $('armtext').textContent = Math.max(0, Math.round(p.armour));
  $('rep').textContent = `REP ${rep.level} · ${rep.title} ${rep.maxed ? 'MAX' : `${rep.cur}/${rep.need}`}`;
  $('repbar').firstElementChild.style.width = rep.maxed ? '100%' : `${Math.round((rep.cur / rep.need) * 100)}%`;
  // District under minimap.
  $('district').textContent = districtAt(p.x, p.z);
  // Dialogue (bottom-centre) with portrait.
  const dlg = $('dialog');
  if (ms.dialogT > 0 && ms.dialog) {
    dlg.style.display = 'block';
    const sp = SPEAKERS[ms.dialog.who] || SPEAKERS.MARA;
    drawPortrait($('portrait'), ms.dialog.who);
    dlg.querySelector('.dname').textContent = sp.name;
    dlg.querySelector('.dtext').textContent = ms.dialog.text;
  } else dlg.style.display = 'none';
  // Driving cluster (bottom-right).
  const sp = $('speedo');
  if (p.inCar) {
    sp.style.display = 'block';
    sp.innerHTML = `${Math.round(Math.abs(p.inCar.speed) * 3.6)} <small>km/h</small>`;
    $('carname').textContent = p.inCar.name;
    $('condbar').style.display = 'block';
    const cf = $('condfill');
    const cond = Math.max(0, Math.round(p.inCar.condition));
    cf.style.width = `${cond}%`;
    cf.style.background = cond > 50 ? '#37d67a' : cond > 25 ? '#ffd23e' : '#ff5a4e';
    const ct = $('condtext');
    ct.textContent = `CONDITION ${cond}% · ${condWord(cond)}`;
    ct.style.color = cond > 50 ? '#7dff9a' : cond > 25 ? '#ffd23e' : '#ff5a4e';
    $('radio').textContent = `♪ ${radioLabel(game.radio)}`;
    $('gear').textContent = `GEAR ${p.inCar.speed > 0.5 ? 'D' : p.inCar.speed < -0.5 ? 'R' : 'N'} · ${game.radio.station + 1}/4 · press R`;
  } else {
    sp.style.display = 'none';
    $('carname').textContent = '';
    $('condbar').style.display = 'none';
    $('condtext').textContent = '';
    $('radio').textContent = '';
    $('gear').textContent = '';
  }
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
  // Search zone: while the police can see the player at 3+ stars — or while
  // Lena's Eyes Out is running — a pulsing red circle follows the player on
  // the map, and police dots get a white ring so they read at a glance.
  const searching = (game.wanted.seen && game.wanted.stars >= 3) || game.crew.eyes > 0;
  if (searching) {
    const [px, py] = toMap(game.player.x, game.player.z);
    const rr = 40 * scale * (1 + 0.07 * Math.sin(performance.now() / 280));
    mapCtx.fillStyle = 'rgba(255,60,60,0.12)';
    mapCtx.beginPath(); mapCtx.arc(px, py, rr, 0, Math.PI * 2); mapCtx.fill();
    mapCtx.strokeStyle = 'rgba(255,60,60,0.95)';
    mapCtx.lineWidth = 2;
    mapCtx.beginPath(); mapCtx.arc(px, py, rr, 0, Math.PI * 2); mapCtx.stroke();
  }
  if (game.crew.eyes > 0) {
    mapCtx.strokeStyle = '#ffffff';
    mapCtx.lineWidth = 1.5;
    for (const car of game.wanted.police) {
      const [mx, my] = toMap(car.x, car.z);
      mapCtx.beginPath(); mapCtx.arc(mx, my, 5.5, 0, Math.PI * 2); mapCtx.stroke();
    }
  }
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
