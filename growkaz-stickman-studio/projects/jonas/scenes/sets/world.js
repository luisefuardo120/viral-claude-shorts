// sets/world.js — the whole world of "Jonás y el gran pez": characters' extras (turban), the great fish, the boat,
// and the four places (open sea / storm, under the sea, inside the fish, the coast with Nineveh). 9:16 first.
import { E, V, mood, layer, backdrop, rr, seg, circle, ring, poly, linGrad, radGrad, glow, alpha, shade, mix, rng, noise, clamp, lerp, ease } from '/engine/core.js';
import { drawFigure, bigFace, headPos } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import { JONAS } from '../cast.js';

export const GY0 = () => E.H * V(0.8, 0.68);
export const CX0 = () => E.W / 2;

// ---------- Jonás: the figure + his cream turban (front when facing 0) ----------
export function turban(g, hx, hy, r, facing = 1) {
  const c = '#efe3c6', d = '#c2a77a', band = '#8a3a24', f = facing;
  g.save();
  if (f) poly(g, [[hx - f * r * 0.55, hy - r * 0.75], [hx - f * r * 1.35, hy + r * 0.55], [hx - f * r * 0.85, hy + r * 0.75], [hx - f * r * 0.35, hy - r * 0.35]], shade(c, -0.12));   // cloth down the nape
  g.fillStyle = c; g.beginPath(); g.ellipse(hx - f * r * 0.04, hy - r * 0.62, r * 1.02, r * 0.85, 0, Math.PI, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(hx - f * r * 0.04, hy - r * 0.62, r * 1.1, r * 0.16, 0, 0, Math.PI); g.fill();
  g.strokeStyle = d; g.lineWidth = r * 0.07; g.lineCap = 'round';
  for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(hx - f * r * 0.04, hy - r * (0.82 + i * 0.2), r * (0.98 - i * 0.2), r * 0.15, (f || 0) * -0.18, 0.15, Math.PI - 0.15); g.stroke(); }
  rr(g, hx - r * 1.08, hy - r * 0.7, r * 2.16, r * 0.17, r * 0.08); g.fillStyle = band; g.fill();
  g.restore();
}
export function jonas(g, o) {
  const fo = { ...o, outfit: JONAS }; drawFigure(g, fo);
  const [hx, hy, r] = headPos(fo); g.save(); if (o.alpha != null) g.globalAlpha *= o.alpha; turban(g, hx, hy, r, o.facing ?? 1); g.restore();
}
// front faces draw the brow tilt mirrored, so swap worried <-> angry brows to keep the emotion right
const FRONT_BROWS = { scared: 'angry', worried: 'angry', nervous: 'angry', sad: 'angry', cry: 'angry', angry: 'worried', determined: 'worried' };
export function bigJonas(g, cx, cy, r, o = {}) {
  const fb = FRONT_BROWS[o.expr]; bigFace(g, cx, cy, r, { ...o, outfit: JONAS, face: fb ? { ...(o.face || {}), brows: fb } : o.face });
  g.save(); g.translate(cx, cy); if (o.tilt) g.rotate(o.tilt); turban(g, 0, 0, r, 0); g.restore();
}

// ---------- the great fish (side view, facing +x, ~1000 units long at s = 1) ----------
function fishBody(g) {
  g.beginPath(); g.moveTo(490, -10);
  g.quadraticCurveTo(470, -190, 250, -215); g.quadraticCurveTo(-60, -250, -330, -120); g.quadraticCurveTo(-420, -70, -470, -28);
  g.lineTo(-640, -210); g.quadraticCurveTo(-600, -40, -560, 0); g.quadraticCurveTo(-600, 40, -640, 200); g.lineTo(-470, 28);
  g.quadraticCurveTo(-380, 110, -120, 175); g.quadraticCurveTo(120, 215, 250, 150); g.lineTo(260, 40); g.quadraticCurveTo(380, 30, 490, -10); g.closePath();
}
function fishJaw(g) { g.beginPath(); g.moveTo(255, 40); g.quadraticCurveTo(390, 40, 480, 20); g.quadraticCurveTo(470, 110, 380, 140); g.quadraticCurveTo(300, 165, 250, 150); g.closePath(); }
// o: { open 0..1, t, facing, rim, body, belly, glowIn (light inside the mouth 0..1) }
export function fish(g, x, y, s, o = {}) {
  const t = o.t || 0, f = o.facing ?? 1, open = o.open || 0, rim = o.rim || '#bfe6ff';
  const body = o.body || '#1d3550', belly = o.belly || '#4f7590', ink = shade(body, -0.45);
  g.save(); g.translate(x, y); g.scale(f * s, s); g.rotate(Math.sin(t * 1.3) * 0.02);
  const tailK = Math.sin(t * 3) * 0.06;
  // rim: the silhouette shifted towards the light
  g.save(); g.translate(-6, -10); g.fillStyle = rim; fishBody(g); g.fill(); g.restore();
  // inside of the mouth
  if (open > 0.02) { g.fillStyle = '#3a0a12'; g.beginPath(); g.ellipse(370, 70, 120, 40 + open * 90, 0, 0, Math.PI * 2); g.fill(); if (o.glowIn) glow(g, 380, 80, 260, '#ffc070', 0.7 * o.glowIn); g.fillStyle = '#7a1f2c'; g.beginPath(); g.ellipse(340, 110 + open * 40, 90, 22, 0, 0, Math.PI * 2); g.fill(); }
  // body with a belly gradient and grooves
  g.save(); g.transform(1, tailK, 0, 1, 0, 0);
  g.fillStyle = linGrad(g, 0, -240, 0, 210, [shade(body, 0.08), body, mix(body, belly, 0.7), belly]); fishBody(g); g.fill();
  g.save(); fishBody(g); g.clip(); g.strokeStyle = alpha(ink, 0.35); g.lineWidth = 7;
  for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(240 - i * 52, 120 + i * 2); g.quadraticCurveTo(80 - i * 45, 190, -150 - i * 30, 170 - i * 6); g.stroke(); }
  const r = rng(4); for (let i = 0; i < 26; i++) circle(g, -380 + r() * 700, -200 + r() * 170, 6 + r() * 14, alpha('#ffffff', 0.07));
  g.restore();
  poly(g, [[-40, -232], [-260, -175], [-150, -300]], ink);                                          // dorsal fin
  g.fillStyle = ink; g.beginPath(); g.moveTo(120, 120); g.quadraticCurveTo(40, 230, -60, 250); g.quadraticCurveTo(20, 170, 60, 110); g.closePath(); g.fill();   // side fin
  g.restore();
  // eye
  circle(g, 330, -70, 30, '#f2efe6'); circle(g, 338 + (o.look || 0) * 8, -68, 15, '#0a0d14'); circle(g, 333, -76, 5, '#ffffff');
  // lower jaw hinged at its back
  g.save(); g.translate(255, 40); g.rotate(open * 0.55); g.translate(-255, -40); g.fillStyle = mix(body, belly, 0.6); fishJaw(g); g.fill();
  g.strokeStyle = alpha(ink, 0.3); g.lineWidth = 5; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(270, 90 + i * 18); g.quadraticCurveTo(360, 100 + i * 14, 450, 50 + i * 18); g.stroke(); } g.restore();
  g.restore();
}
// mouth position of the fish in world units (to put Jonás in or out of it)
export const fishMouth = (x, y, s, f = 1) => [x + f * 400 * s, y + 60 * s];

// ---------- the boat (hull, mast, square sail with two stripes); fn(g) draws people standing on the deck at y = 0 ----------
export function boat(g, x, y, s, rot, fn, o = {}) {
  const wood = o.wood || '#5a3a24', dark = shade(wood, -0.45), sail = o.sail || '#e9dcc0';
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  seg(g, [[-10, 0], [-10, -520]], 16, dark); seg(g, [[-150, -470], [130, -470]], 10, dark);
  const bulge = (o.fill ?? 1) * 40, sailPath = () => { g.beginPath(); g.moveTo(-145, -462); g.quadraticCurveTo(-145 - bulge, -316, -145, -170); g.lineTo(125, -170); g.quadraticCurveTo(125 + bulge, -316, 125, -462); g.closePath(); };
  g.save(); sailPath(); g.fillStyle = sail; g.fill(); g.clip(); g.fillStyle = '#b8432f'; g.fillRect(-200, -400, 380, 26); g.fillRect(-200, -290, 380, 26); g.fillStyle = alpha('#000', 0.12); g.fillRect(-10, -470, 140, 310); g.restore();
  fn?.(g);
  g.fillStyle = linGrad(g, 0, -10, 0, 150, [shade(wood, 0.1), wood, dark]);
  g.beginPath(); g.moveTo(-360, -40); g.lineTo(380, -60); g.quadraticCurveTo(330, 120, 230, 140); g.lineTo(-250, 140); g.quadraticCurveTo(-330, 90, -360, -40); g.closePath(); g.fill();
  g.strokeStyle = alpha('#000', 0.25); g.lineWidth = 4; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(-340 + i * 12, -40 + i * 42); g.lineTo(360 - i * 30, -55 + i * 45); g.stroke(); }
  g.fillStyle = alpha('#ffd9a0', 0.35); g.fillRect(-350, -46, 720, 6);
  g.restore();
}

// ---------- waves: rows of moving crests from far (small) to near (big) ----------
function waveRow(g, t, y, amp, len, speed, col, seed) {
  g.fillStyle = col; g.beginPath(); g.moveTo(-E.W, E.H * 2);
  for (let x = -E.W; x <= E.W * 2; x += 18) g.lineTo(x, y + Math.sin(x / len + t * speed + seed) * amp + noise(x / (len * 2) + t * 0.3, seed) * amp * 0.6);
  g.lineTo(E.W * 2, E.H * 2); g.closePath(); g.fill();
}
// open sea. o.storm 0..1 turns the sky and water into a storm; o.flash 0..1 lightning light. returns {HY (horizon), M}
export function sea(g, t, cam, o = {}) {
  const st = o.storm || 0, M = st > 0.5 ? mood('storm') : mood('dusk'), HY = E.H * (o.horizon ?? 0.5);
  layer(g, cam, 0.12, (g) => {
    backdrop(g, M.sky);
    if (st < 0.5) { FX.sun(g, E.W * 0.72, HY - V(120, 260), 46, '#fff3dc', M.key, 5); FX.clouds(g, { y: HY - V(500, 800), h: 300, color: '#ffe0c0', a: 0.14, seed: 3 }); }
    else { for (let i = 0; i < 7; i++) { g.fillStyle = alpha(shade(M.sky[0], -0.2), 0.85); g.beginPath(); g.ellipse(((i * 260 + t * 40) % (E.W + 600)) - 300, HY - V(380, 700) + (i % 3) * 90, 300, 90, 0, 0, Math.PI * 2); g.fill(); } }
    if (o.flash) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = alpha('#cfdcff', 0.55 * o.flash); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); g.restore(); }
  });
  if (o.city) layer(g, cam, 0.2, (g) => nineveh(g, E.W * o.city, HY + 4, 0.55, M, o.cityGlow || 0));
  const seaC = st > 0.5 ? '#1c2a44' : shade(M.sky[1], -0.35), amp = lerp(10, 60, st);
  layer(g, cam, 0.3, (g) => { waveRow(g, t, HY, amp * 0.3, 40, 1.2, shade(seaC, 0.12), 1); if (st < 0.5) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = linGrad(g, E.W * 0.72 - 40, 0, E.W * 0.72 + 40, 0, [alpha(M.key, 0), alpha(M.key, 0.35), alpha(M.key, 0)]); g.fillRect(E.W * 0.72 - 60, HY, 120, E.H * 0.25); g.restore(); } });
  layer(g, cam, 0.55, (g) => waveRow(g, t, HY + V(60, 120), amp * 0.6, 70, 1.5, shade(seaC, 0.02), 2));
  return { HY, M, seaC, amp };
}
export function seaFront(g, t, cam, s0, o = {}) {   // the near waves, drawn over the boat
  layer(g, cam, 1.05, (g) => waveRow(g, t, s0.HY + V(340, 640) + (o.dy || 0), s0.amp * 1.3, 110, 1.9, shade(s0.seaC, -0.15), 3));
  layer(g, cam, 1.3, (g) => { waveRow(g, t, s0.HY + V(460, 860) + (o.dy || 0), s0.amp * 1.8, 150, 2.3, shade(s0.seaC, -0.35), 4);
    g.fillStyle = alpha('#e8f4ff', 0.25); for (let x = -200; x < E.W + 200; x += 90) circle(g, x + Math.sin(t * 2 + x) * 20, s0.HY + V(450, 850) + Math.sin(x / 150 + t * 2.3 + 4) * s0.amp * 1.8, 8, alpha('#e8f4ff', 0.3)); });
}

// ---------- Nineveh: walls, round towers and a ziggurat, as a far silhouette ----------
export function nineveh(g, x, y, s, M, glowK = 0) {
  const c = mix(M.dark, M.sky[1] || M.wall, 0.35), win = M.practical;
  g.save(); g.translate(x, y); g.scale(s, s);
  if (glowK) glow(g, 0, -140, 700, '#ffd36e', 0.45 * glowK);
  g.fillStyle = c; [[460, 110], [330, 90], [210, 80], [110, 70]].reduce((yy, [w, h]) => { g.fillRect(-w / 2 + 60, yy - h, w, h + 2); return yy - h; }, -40);
  g.fillRect(-520, -110, 1040, 110); for (let i = 0; i < 26; i++) g.fillRect(-520 + i * 40, -132, 22, 24);
  for (const tx of [-520, -200, 200, 520]) { g.fillRect(tx - 45, -170, 90, 170); for (let i = 0; i < 3; i++) g.fillRect(tx - 45 + i * 34, -190, 22, 22); }
  g.fillStyle = win; for (const [wx, wy] of [[-300, -60], [-120, -70], [90, -64], [330, -58], [60, -300], [0, -210]]) { g.fillRect(wx, wy, 12, 18); glow(g, wx + 6, wy + 9, 40, win, 0.4 + glowK * 0.4); }
  g.fillStyle = shade(c, -0.4); g.beginPath(); g.moveTo(-40, 0); g.lineTo(-40, -60); g.arc(0, -60, 40, Math.PI, 0); g.lineTo(40, 0); g.closePath(); g.fill();
  g.restore();
}
export function palm(g, x, y, s, c, t = 0) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.strokeStyle = c; g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(30, -180, 70, -360); g.stroke();
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.5 + Math.sin(t * 1.3 + i) * 0.04; g.fillStyle = c; g.beginPath(); g.moveTo(70, -360); g.quadraticCurveTo(70 + Math.cos(a - 0.3) * 150, -360 + Math.sin(a - 0.3) * 120 - 30, 70 + Math.cos(a) * 230, -360 + Math.sin(a) * 160 + 60); g.quadraticCurveTo(70 + Math.cos(a + 0.2) * 120, -360 + Math.sin(a + 0.2) * 80, 70, -350); g.fill(); }
  g.restore();
}
// ---------- the coast at dawn: sky, low sun, sea band, sand, palms, Nineveh far away ----------
export function coast(g, t, cam, o = {}) {
  const M = mood(o.mood || 'golden'), GY = GY0(), HY = GY - V(260, 420);
  layer(g, cam, 0.1, (g) => { backdrop(g, M.sky); FX.sun(g, E.W * (o.sunX ?? 0.7), HY - V(80, 120), 60, '#fff3dc', M.key, 6); FX.godRays(g, E.W * (o.sunX ?? 0.7), HY - V(80, 120), { angle: Math.PI / 2 + 0.3, spread: 2.2, len: 1800, color: M.key, a: 0.06 + (o.rays || 0) * 0.12, t }); FX.clouds(g, { y: HY - V(400, 900), h: 300, color: '#ffe0c0', a: 0.18, seed: 5 }); });
  layer(g, cam, 0.2, (g) => { FX.hills(g, { y: HY + 6, amp: 60, color: mix(M.sky[0], M.dark, 0.5), seed: 2 }); nineveh(g, E.W * (o.cityX ?? 0.66), HY + 4, V(0.4, 0.42), M, o.cityGlow || 0); });
  layer(g, cam, 0.4, (g) => { g.fillStyle = linGrad(g, 0, HY, 0, HY + 160, [shade(M.sky[1], -0.25), shade(M.sky[0], -0.45)]); g.fillRect(-E.W, HY, E.W * 3, 200);
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = alpha(M.key, 0.25); for (let i = 0; i < 9; i++) g.fillRect(E.W * (o.sunX ?? 0.7) - 70 + Math.sin(t * 2 + i) * 20, HY + 10 + i * 16, 140 - i * 10, 4); g.restore(); });
  layer(g, cam, 0.8, (g) => { g.fillStyle = linGrad(g, 0, HY + 120, 0, E.H, [shade(M.floor, 0.25), M.floor, shade(M.dark, -0.1)]); g.beginPath(); g.moveTo(-E.W, HY + 170); g.quadraticCurveTo(E.W * 0.4, HY + 110, E.W * 2, HY + 190); g.lineTo(E.W * 2, E.H * 2); g.lineTo(-E.W, E.H * 2); g.closePath(); g.fill();
    g.strokeStyle = alpha('#fff4e0', 0.5); g.lineWidth = 4; g.beginPath(); for (let x = -E.W; x < E.W * 2; x += 20) g.lineTo(x, HY + 150 + Math.sin(x / 60 + t * 1.5) * 6 + (x / E.W) * 30); g.stroke(); });
  if (o.palms !== false) layer(g, cam, 0.9, (g) => { palm(g, E.W * 0.08, GY + 30, V(1, 1.05), shade(M.dark, -0.2), t); palm(g, E.W * 0.95, GY + 50, V(1.2, 1.25), shade(M.dark, -0.3), t + 2); });
  return { GY, HY, M, CX: E.W / 2 };
}
// ---------- under the sea ----------
export function under(g, t, cam, o = {}) {
  const M = mood('night'), deep = o.deep || 0;
  layer(g, cam, 0.15, (g) => { backdrop(g, [mix('#2a6a8a', '#0a1a2e', deep), mix('#123a5a', '#050c18', deep), '#030810']);
    FX.godRays(g, E.W * 0.5, -200, { angle: Math.PI / 2, spread: 0.9, len: E.H * 1.3, color: '#bfe8ff', a: 0.09 * (1 - deep * 0.7), t, count: 9 }); });
  layer(g, cam, 0.4, (g) => { g.fillStyle = '#02060c'; g.beginPath(); g.moveTo(-E.W, E.H * 2); for (let x = -E.W; x <= E.W * 2; x += 30) g.lineTo(x, E.H * 0.92 - (noise(x * 0.004, 7) * 0.5 + 0.5) * 220); g.lineTo(E.W * 2, E.H * 2); g.fill();
    for (let i = 0; i < 9; i++) { const x = i * 150 - 100; seg(g, Array.from({ length: 8 }, (_, k) => [x + Math.sin(t * 1.2 + k * 0.6 + i) * (6 + k * 3), E.H * 0.9 - k * 50]), 10, '#061420'); } });
  layer(g, cam, 0.7, (g) => FX.drops(g, 0, { count: 26, area: [0, -200 + ((t * 120) % 400) * -1, E.W, E.H + 400], rMin: 4, rMax: 16, color: '#bfe8ff', drift: 6 }));
  return { M };
}
// ---------- inside the fish ----------
export function belly(g, t, cam, o = {}) {
  const lit = o.lit || 0, GY = GY0();
  layer(g, cam, 0.3, (g) => { backdrop(g, ['#12040a', '#2a0a12', '#3a1016']); glow(g, E.W / 2, GY - 300, 900, '#c0402a', 0.18 + lit * 0.2);
    for (let i = -3; i <= 3; i++) { const x = E.W / 2 + i * V(300, 240), k = 1 - Math.abs(i) * 0.1; g.strokeStyle = shade('#e2d2bb', -0.35 - Math.abs(i) * 0.12); g.lineWidth = 34 * k; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 60, GY + 20); g.quadraticCurveTo(x - 30, GY - E.H * 0.9, x + 90 * Math.sign(i || 1), -200); g.stroke(); } });
  layer(g, cam, 0.7, (g) => { g.fillStyle = linGrad(g, 0, GY, 0, E.H, ['#3a0e14', '#1a0408']); g.fillRect(-E.W, GY, E.W * 3, E.H); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = alpha('#ff9a6a', 0.18); for (let i = 0; i < 6; i++) g.fillRect(-E.W, GY + 20 + i * 40 + Math.sin(t * 1.5 + i) * 6, E.W * 3, 3); g.restore(); });
  return { GY, M: { rim: lit > 0.3 ? '#ffd36e' : '#ff9a6a', key: '#ffb070' } };
}
