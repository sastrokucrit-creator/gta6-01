// Drawn character portraits for the dialogue box: each crew member gets a small
// stylized face (skin, hair, one signature accessory) on a 56x56 canvas, so the
// speaker reads as a person, not a letter. Drawn fresh each time dialogue shows.
const SKIN = { MARA: '#f2c19b', JAX: '#e8b98a', DEX: '#c98d5f', LENA: '#f6d3b3', BIGT: '#8a5a3b' };

function base(ctx, who) {
  // Background disc in the speaker's colour, then the face.
  ctx.clearRect(0, 0, 56, 56);
  ctx.fillStyle = '#222831';
  ctx.fillRect(0, 0, 56, 56);
  ctx.fillStyle = SKIN[who];
  ctx.beginPath();
  ctx.ellipse(28, 31, 15, 17, 0, 0, Math.PI * 2);
  ctx.fill();
}

function eyes(ctx, y, gap) {
  ctx.fillStyle = '#1c1c1c';
  ctx.beginPath(); ctx.arc(28 - gap, y, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(28 + gap, y, 2.2, 0, Math.PI * 2); ctx.fill();
}

function mouth(ctx, y, smile) {
  ctx.strokeStyle = '#5a2e22';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  if (smile) ctx.arc(28, y - 2, 5, 0.25 * Math.PI, 0.75 * Math.PI);
  else { ctx.moveTo(24, y); ctx.lineTo(32, y); }
  ctx.stroke();
}

function drawMara(ctx) {
  base(ctx, 'MARA');
  // Long red hair: back mass behind the face + fringe across the forehead.
  ctx.fillStyle = '#b02020';
  ctx.beginPath(); ctx.ellipse(28, 24, 18, 16, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillRect(8, 26, 5, 22);
  ctx.fillRect(43, 26, 5, 22);
  // Gold hoop earring.
  ctx.strokeStyle = '#ffd23e'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(44, 38, 3, 0, Math.PI * 2); ctx.stroke();
  eyes(ctx, 30, 6);
  mouth(ctx, 41, true);
}

function drawJax(ctx) {
  base(ctx, 'JAX');
  // Dark cap with a brim, stubble on the jaw.
  ctx.fillStyle = '#222831';
  ctx.beginPath(); ctx.ellipse(28, 20, 15.5, 9, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillRect(12, 18, 32, 4);
  ctx.fillStyle = 'rgba(40,25,15,0.35)';
  ctx.beginPath(); ctx.ellipse(28, 43, 10, 5, 0, 0, Math.PI); ctx.fill();
  eyes(ctx, 30, 6);
  mouth(ctx, 41, false);
}

function drawDex(ctx) {
  base(ctx, 'DEX');
  // Backwards blue cap + dark sunglasses.
  ctx.fillStyle = '#2980b9';
  ctx.beginPath(); ctx.ellipse(28, 19, 15, 8, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillRect(28, 13, 16, 4); // brim sticking out the back
  ctx.fillStyle = '#111';
  ctx.fillRect(17, 27, 10, 6);
  ctx.fillRect(29, 27, 10, 6);
  ctx.fillRect(26, 29, 4, 2);
  mouth(ctx, 42, true);
}

function drawLena(ctx) {
  base(ctx, 'LENA');
  // Purple bob framing the face + round glasses.
  ctx.fillStyle = '#8e44ad';
  ctx.beginPath(); ctx.ellipse(28, 26, 18, 17, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = SKIN.LENA;
  ctx.beginPath(); ctx.ellipse(28, 32, 13, 15, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#222'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(22, 30, 5, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(34, 30, 5, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(27, 30); ctx.lineTo(29, 30); ctx.stroke();
  eyes(ctx, 30, 6);
  mouth(ctx, 41, true);
}

function drawBigt(ctx) {
  base(ctx, 'BIGT');
  // Green headband + full dark beard.
  ctx.fillStyle = '#27ae60';
  ctx.fillRect(12, 17, 32, 5);
  ctx.fillStyle = '#2c1c12';
  ctx.beginPath(); ctx.ellipse(28, 42, 12, 8, 0, 0, Math.PI); ctx.fill();
  eyes(ctx, 29, 6);
  mouth(ctx, 41, false);
}

const DRAW = { MARA: drawMara, JAX: drawJax, DEX: drawDex, LENA: drawLena, BIGT: drawBigt };

export function drawPortrait(canvas, who) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  (DRAW[who] || DRAW.MARA)(ctx);
}
