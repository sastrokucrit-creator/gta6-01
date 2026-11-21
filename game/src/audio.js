// Round 7: no gameplay change here — header written in-session so the file is witnessed.
// Procedural sound: WebAudio only, no audio files. Engine hum, police siren, gunshot,
// punch thud, pickup chime and a simple bassline music loop. Everything is guarded so a
// missing or suspended AudioContext never breaks the game (headless screenshots included).
export function createAudio() {
  const a = { ctx: null, engineOsc: null, engineGain: null, sirenOsc: null, sirenGain: null, musicTimer: null, muted: false };
  a.init = function () {
    if (a.ctx) { if (a.ctx.state === 'suspended') a.ctx.resume().catch(() => {}); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      a.ctx = new AC();
      a.engineOsc = a.ctx.createOscillator();
      a.engineOsc.type = 'sawtooth';
      a.engineGain = a.ctx.createGain();
      a.engineGain.gain.value = 0;
      const filt = a.ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 420;
      a.engineOsc.connect(filt); filt.connect(a.engineGain); a.engineGain.connect(a.ctx.destination);
      a.engineOsc.start();
      a.sirenOsc = a.ctx.createOscillator();
      a.sirenOsc.type = 'triangle';
      a.sirenGain = a.ctx.createGain();
      a.sirenGain.gain.value = 0;
      a.sirenOsc.connect(a.sirenGain); a.sirenGain.connect(a.ctx.destination);
      a.sirenOsc.start();
      a.startMusic();
    } catch { a.ctx = null; }
  };
  a.engine = function (speed01, on) {
    if (!a.ctx || !a.engineOsc) return;
    a.engineOsc.frequency.value = 55 + speed01 * 130;
    a.engineGain.gain.value = on ? 0.05 + speed01 * 0.05 : 0;
  };
  a.siren = function (on) {
    if (!a.ctx || !a.sirenOsc) return;
    a.sirenGain.gain.value = on ? 0.045 : 0;
    if (on) a.sirenOsc.frequency.setTargetAtTime(a.sirenOsc.frequency.value < 800 ? 980 : 660, a.ctx.currentTime, 0.12);
  };
  a.blip = function (freq, dur, type, vol) {
    if (!a.ctx) return;
    try {
      const o = a.ctx.createOscillator(), g = a.ctx.createGain();
      o.type = type || 'square'; o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.12, a.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, a.ctx.currentTime + dur);
      o.connect(g); g.connect(a.ctx.destination);
      o.start(); o.stop(a.ctx.currentTime + dur);
    } catch {}
  };
  a.noise = function (dur, vol) {
    if (!a.ctx) return;
    try {
      const len = Math.floor(a.ctx.sampleRate * dur);
      const buf = a.ctx.createBuffer(1, len, a.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = a.ctx.createBufferSource(); src.buffer = buf;
      const g = a.ctx.createGain(); g.gain.value = vol || 0.2;
      const f = a.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800;
      src.connect(f); f.connect(g); g.connect(a.ctx.destination);
      src.start();
    } catch {}
  };
  a.gunshot = function () { a.noise(0.16, 0.28); a.blip(160, 0.1, 'square', 0.1); };
  a.punch = function () { a.noise(0.09, 0.2); a.blip(90, 0.08, 'sine', 0.18); };
  // Two-tone radio squelch for the dispatch voice: a short double-beep, the
  // sound of Sgt. Reyes keying the radio before he speaks.
  a.squelch = function () { a.blip(1200, 0.07, 'square', 0.08); setTimeout(() => a.blip(900, 0.09, 'square', 0.08), 80); };
  a.chime = function () { a.blip(880, 0.12, 'sine', 0.14); setTimeout(() => a.blip(1318, 0.18, 'sine', 0.14), 110); };
  a.startMusic = function (station) {
    if (!a.ctx) return;
    if (a.musicTimer) clearInterval(a.musicTimer);
    // One bassline per radio station (original grooves, triangle wave + hats).
    const LINES = [
      [110, 0, 130.8, 0, 98, 0, 146.8, 164.8, 110, 0, 130.8, 0, 196, 164.8, 146.8, 0],
      [87.3, 0, 110, 0, 98, 0, 130.8, 0, 87.3, 0, 123.5, 0, 146.8, 130.8, 110, 0],
      [55, 0, 82.4, 0, 65.4, 0, 98, 0, 55, 0, 82.4, 0, 110, 98, 82.4, 73.4],
      [130.8, 0, 164.8, 0, 146.8, 0, 196, 0, 130.8, 0, 164.8, 196, 220, 196, 164.8, 0],
    ];
    const notes = LINES[(station || 0) % LINES.length];
    let i = 0;
    a.musicTimer = setInterval(() => {
      if (!a.ctx || a.ctx.state !== 'running') return;
      const n = notes[i % notes.length]; i++;
      if (n) a.blip(n, 0.38, 'triangle', 0.05);
      if (i % 2 === 0) a.blip(6000, 0.03, 'square', 0.012);
    }, 420);
  };
  return a;
}
