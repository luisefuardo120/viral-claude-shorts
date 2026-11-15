// sets/world.js — the world of "David y Goliat": the giant's helmet and spear, soldiers' helmets, the sling and stones,
// sheep, and the places (the valley between two armies, the stream, the tent). 9:16 first.
import { E, V, mood, layer, backdrop, rr, seg, circle, ring, poly, linGrad, radGrad, glow, alpha, shade, mix, rng, noise, clamp, lerp } from '/engine/core.js';
import { drawFigure, bigFace, headPos, POSES } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import { DAVID, GOLIAT, SOLDIER } from '../cast.js';

export const GY0 = () => E.H * V(0.8, 0.68);
const BRONZE = '#c08a3a';

// ---------- headgear ----------
export function helmet(g, hx, hy, r, facing = 1, o = {}) {   // the giant's bronze crested helmet
  const c = o.color || BRONZE, d = shade(c, -0.35), hi = shade(c, 0.35), f = facing;
  g.save();
  g.fillStyle = c; g.beginPath(); g.ellipse(hx, hy - r * 0.25, r * 1.1, r * 1.0, 0, Math.PI, Math.PI * 2); g.fill();
  g.fillRect(hx - r * 1.1, hy - r * 0.3, r * 2.2, r * 0.18);
  if (f) { g.fillRect(hx - f * r * 1.1 - (f > 0 ? 0 : -r * 0.0), hy - r * 0.3, f * r * 0.35, r * 0.95); }      // neck guard
  else if (!o.front) { g.fillRect(hx - r * 0.09, hy - r * 0.3, r * 0.18, r * 0.62); }                       // nose guard (front, small heads only)
  g.strokeStyle = alpha(hi, 0.8); g.lineWidth = r * 0.07; g.beginPath(); g.ellipse(hx - r * 0.1, hy - r * 0.45, r * 0.7, r * 0.6, 0, Math.PI * 1.15, Math.PI * 1.55); g.stroke();
  // red horsehair crest
  g.fillStyle = '#b8322a'; g.beginPath(); g.moveTo(hx - r * (f ? f * 0.9 : 0.75), hy - r * 0.95); g.quadraticCurveTo(hx, hy - r * 1.75, hx + r * (f ? f * 0.9 : 0.75), hy - r * 0.95); g.quadraticCurveTo(hx, hy - r * 1.3, hx - r * (f ? f * 0.9 : 0.75), hy - r * 0.95); g.fill();
  g.restore();
}
export function soldierHelm(g, hx, hy, r) { g.fillStyle = '#6a6a72'; g.beginPath(); g.ellipse(hx, hy - r * 0.3, r * 1.05, r * 0.85, 0, Math.PI, Math.PI * 2); g.fill(); g.fillRect(hx - r * 1.05, hy - r * 0.34, r * 2.1, r * 0.12); }

// ---------- characters ----------
export function david(g, o) { drawFigure(g, { ...o, outfit: DAVID }); }
export function goliat(g, o) {
  const base = o.pose || POSES.stand, pose = o.spear === false ? base : { ...base, eF: [40, -140], hF: [62, -150] };
  const fo = { ...o, outfit: GOLIAT, pose }, f = o.facing ?? 1;
  if (o.spear !== false) { const [hx, hy] = headPos(fo), s = o.s ?? 1; g.save(); if (o.alpha != null) g.globalAlpha *= o.alpha; const bx = o.x + f * 62 * s;
    seg(g, [[bx, o.y + 10 * s], [bx + f * 10 * s, hy - 160 * s]], 7 * s, '#3a2614'); poly(g, [[bx + f * 10 * s - 9 * s, hy - 160 * s], [bx + f * 10 * s + 9 * s, hy - 160 * s], [bx + f * 12 * s, hy - 215 * s]], '#d8d0c0'); g.restore(); }
  drawFigure(g, fo);
  const [hx, hy, r] = headPos(fo); g.save(); if (o.alpha != null) g.globalAlpha *= o.alpha; helmet(g, hx, hy, r, f); g.restore();
  // round bronze shield on the far side
  g.save(); if (o.alpha != null) g.globalAlpha *= o.alpha; const s = o.s ?? 1; circle(g, o.x - f * 26 * s, o.y - 130 * s, 44 * s, shade(BRONZE, -0.15)); ring(g, o.x - f * 26 * s, o.y - 130 * s, 44 * s, 5 * s, shade(BRONZE, 0.25)); circle(g, o.x - f * 26 * s, o.y - 130 * s, 10 * s, shade(BRONZE, 0.3)); g.restore();
}
export function soldier(g, o) { drawFigure(g, { ...o, outfit: SOLDIER }); const [hx, hy, r] = headPos({ ...o, outfit: SOLDIER }); soldierHelm(g, hx, hy, r); }
// front faces draw the brow tilt mirrored, so swap worried <-> angry brows to keep the emotion right
const FRONT_BROWS = { scared: 'angry', worried: 'angry', nervous: 'angry', sad: 'angry', cry: 'angry', angry: 'worried', determined: 'worried' };
const fb = (o) => (FRONT_BROWS[o.expr] ? { ...(o.face || {}), brows: FRONT_BROWS[o.expr] } : o.face);
export function bigDavid(g, cx, cy, r, o = {}) { bigFace(g, cx, cy, r, { ...o, outfit: DAVID, face: fb(o) }); }
export function bigGoliat(g, cx, cy, r, o = {}) { bigFace(g, cx, cy, r, { ...o, outfit: GOLIAT, face: fb(o) }); g.save(); g.translate(cx, cy); if (o.tilt) g.rotate(o.tilt); helmet(g, 0, -r * 0.3, r * 0.95, 0, { front: true }); g.restore(); }

// ---------- props ----------
export function stone(g, x, y, r, o = {}) { g.fillStyle = radGrad(g, x - r * 0.3, y - r * 0.3, 0, r * 1.2, ['#d8d2c8', '#8a847a', '#4a4640']); g.beginPath(); g.ellipse(x, y, r * 1.1, r * 0.9, o.rot || 0, 0, Math.PI * 2); g.fill(); circle(g, x - r * 0.35, y - r * 0.35, r * 0.18, alpha('#ffffff', 0.7)); if (o.glow) glow(g, x, y, r * 4, '#ffd36e', o.glow); }
// sling: cords from the hand to a leather pouch at angle a (spinning), optional stone in it
export function sling(g, hx, hy, len, a, o = {}) { const px = hx + Math.cos(a) * len, py = hy + Math.sin(a) * len, nx = -Math.sin(a) * 10, ny = Math.cos(a) * 10;
  seg(g, [[hx, hy], [px + nx, py + ny]], 3, '#c8a878'); seg(g, [[hx, hy], [px - nx, py - ny]], 3, '#c8a878');
  g.fillStyle = '#6a4428'; g.beginPath(); g.ellipse(px, py, 16, 10, a + Math.PI / 2, 0, Math.PI * 2); g.fill(); if (o.stone) stone(g, px, py, 8); return [px, py]; }
export function sheep(g, x, y, s, t = 0, f = 1) { g.save(); g.translate(x, y); g.scale(f * s, s); seg(g, [[-24, -10], [-26, 0]], 6, '#1a1418'); seg(g, [[20, -10], [22, 0]], 6, '#1a1418');
  for (const [dx, dy, r] of [[-22, -38, 20], [0, -46, 24], [22, -38, 20], [-10, -26, 20], [12, -26, 20]]) circle(g, dx, dy + Math.sin(t * 2) * 1, r, '#f2ece0');
  g.fillStyle = '#1a1418'; g.beginPath(); g.ellipse(44, -44, 13, 10, 0.3, 0, Math.PI * 2); g.fill(); circle(g, 48, -47, 2.5, '#fff'); g.restore(); }

// ---------- places ----------
function tent(g, x, y, s, c) { g.save(); g.translate(x, y); g.scale(s, s); poly(g, [[-90, 0], [0, -110], [90, 0]], c); poly(g, [[-14, 0], [0, -60], [14, 0]], shade(c, -0.5)); seg(g, [[0, -110], [0, -150]], 4, shade(c, -0.4)); poly(g, [[0, -150], [34, -140], [0, -130]], '#b8322a'); g.restore(); }
// the valley of Elah: two hills with camps, the valley floor, a stream. o.mood, o.side ('both'|'israel'|'philistia')
export function valley(g, t, cam, o = {}) {
  const M = mood(o.mood || 'golden'), GY = GY0(), HY = GY - V(300, 520);
  layer(g, cam, 0.1, (g) => { backdrop(g, M.sky); FX.sun(g, E.W * (o.sunX ?? 0.5), HY - V(120, 260), 56, '#fff3dc', M.key, 6); FX.godRays(g, E.W * (o.sunX ?? 0.5), HY - V(120, 260), { angle: Math.PI / 2, spread: 2.4, len: 1800, color: M.key, a: 0.05 + (o.rays || 0) * 0.12, t }); FX.clouds(g, { y: HY - V(500, 900), h: 300, color: '#ffe0c0', a: 0.16, seed: 9 }); });
  layer(g, cam, 0.2, (g) => FX.hills(g, { y: HY + 30, amp: 120, color: mix(M.sky[0], M.dark, 0.55), seed: 4, freq: 0.003 }));
  layer(g, cam, 0.4, (g) => {
    const hill = (x0, x1, top, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(x0, GY + 40); g.quadraticCurveTo((x0 + x1) / 2, top, x1, GY + 40); g.closePath(); g.fill(); };
    const cl = shade(M.wall, -0.25), cr = shade(M.wall, -0.4);
    hill(-E.W * 0.9, E.W * 0.55, HY - 80, cl); hill(E.W * 0.45, E.W * 1.9, HY - 60, cr);
    for (let i = 0; i < 4; i++) tent(g, -E.W * 0.35 + i * 150, HY + 40 + i * 12, 0.6, shade(M.practical, -0.35));
    for (let i = 0; i < 4; i++) tent(g, E.W * 0.95 + i * 150, HY + 60 + i * 10, 0.6, shade('#8a3a2a', -0.2));
    if (o.armies !== false) { FX.crowd(g, t, { x: -E.W * 0.45, y: HY + 120, w: E.W * 0.8, rows: 4, rowH: 22, size: 1.3, color: shade(M.dark, 0.1), cheer: o.cheerL || 0, flags: 0.02 }); FX.crowd(g, t, { x: E.W * 0.75, y: HY + 140, w: E.W * 0.9, rows: 4, rowH: 22, size: 1.3, color: shade('#3a1a14', 0.05), cheer: o.cheerR || 0, seed: 21, flags: 0.03 }); }
  });
  layer(g, cam, 0.85, (g) => { g.fillStyle = linGrad(g, 0, HY + 160, 0, E.H, [shade(M.floor, 0.15), M.floor, shade(M.dark, -0.1)]); g.beginPath(); g.moveTo(-E.W, HY + 240); g.quadraticCurveTo(E.W * 0.5, HY + 160, E.W * 2, HY + 240); g.lineTo(E.W * 2, E.H * 2); g.lineTo(-E.W, E.H * 2); g.closePath(); g.fill();
    const r = rng(6); for (let i = 0; i < 30; i++) { const x = -E.W * 0.5 + r() * E.W * 2, y = GY - 60 + r() * 400; g.fillStyle = alpha(shade(M.dark, -0.2), 0.5); g.beginPath(); g.ellipse(x, y, 10 + r() * 20, 5 + r() * 6, 0, 0, Math.PI * 2); g.fill(); }
    if (o.stream) { g.fillStyle = alpha('#6aa8d0', 0.75); g.beginPath(); g.moveTo(-E.W, GY + 160); for (let x = -E.W; x <= E.W * 2; x += 20) g.lineTo(x, GY + 140 + Math.sin(x / 120 + t) * 12); for (let x = E.W * 2; x >= -E.W; x -= 20) g.lineTo(x, GY + 260 + Math.sin(x / 140 + t * 1.2) * 14); g.closePath(); g.fill();
      g.strokeStyle = alpha('#fff4e0', 0.5); g.lineWidth = 3; for (let k = 0; k < 4; k++) { g.beginPath(); for (let x = -E.W; x < E.W * 2; x += 20) g.lineTo(x + ((t * 60) % 200), GY + 170 + k * 22 + Math.sin(x / 70 + k) * 4); g.stroke(); } }
  });
  return { GY, HY, M };
}
// inside the army tent (warm lamp, fabric walls)
export function tentInside(g, t, cam) {
  const M = mood('interiorWarm'), GY = GY0();
  layer(g, cam, 0.3, (g) => { backdrop(g, [shade(M.wall, -0.2), M.wall, shade(M.wall, -0.4)]);
    for (let i = -4; i <= 4; i++) seg(g, [[E.W / 2 + i * 220, -200], [E.W / 2 + i * 300, GY]], 6, alpha(shade(M.wall, -0.5), 0.6));
    seg(g, [[E.W * 0.82, -100], [E.W * 0.82, GY - 600]], 3, '#2a1a12'); rr(g, E.W * 0.82 - 22, GY - 600, 44, 54, 10); g.fillStyle = '#ffd59a'; g.fill(); glow(g, E.W * 0.82, GY - 570, 380, M.practical, 0.55);
    for (let i = 0; i < 3; i++) { const x = E.W * 0.12 + i * 70; seg(g, [[x, GY], [x + 10, GY - 420]], 6, '#3a2614'); poly(g, [[x + 2, GY - 420], [x + 18, GY - 420], [x + 12, GY - 470]], '#c8c0b0'); } });
  layer(g, cam, 0.8, (g) => { g.fillStyle = linGrad(g, 0, GY, 0, E.H, [M.floor, shade(M.dark, -0.2)]); g.fillRect(-E.W, GY, E.W * 3, E.H); FX.pool(g, E.W * 0.6, GY + 30, 400, 60, M.practical, 0.25); });
  return { GY, M };
}
