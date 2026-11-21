// Round 8: no gameplay change here — header written in-session so the file is witnessed.
// Input: keyboard + mouse drag look + click. No pointer lock (works in headless too).
export const keys = {};
export const mouse = { dx: 0, dy: 0, down: false, clicked: false, dragging: false };
export function initInput(canvas) {
  addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  });
  addEventListener('keyup', (e) => { keys[e.code] = false; });
  addEventListener('blur', () => { for (const k of Object.keys(keys)) keys[k] = false; });
  let lastX = 0, lastY = 0;
  canvas.addEventListener('mousedown', (e) => { mouse.down = true; mouse.dragging = true; lastX = e.clientX; lastY = e.clientY; });
  addEventListener('mouseup', (e) => {
    if (mouse.dragging && Math.abs(e.clientX - lastX) < 4 && Math.abs(e.clientY - lastY) < 4) mouse.clicked = true;
    mouse.down = false; mouse.dragging = false;
  });
  addEventListener('mousemove', (e) => {
    if (!mouse.dragging) return;
    mouse.dx += e.clientX - lastX; mouse.dy += e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}
export function consumeClick() { const c = mouse.clicked; mouse.clicked = false; return c; }
export function consumeLook() { const d = { dx: mouse.dx, dy: mouse.dy }; mouse.dx = 0; mouse.dy = 0; return d; }

// Edge detection: true only on the frame a key is first pressed (not while held).
// One shared previous-state map, so every caller sees the same edges.
const prev = {};
export function edgePressed(code) {
  const down = !!keys[code];
  const hit = down && !prev[code];
  prev[code] = down;
  return hit;
}
