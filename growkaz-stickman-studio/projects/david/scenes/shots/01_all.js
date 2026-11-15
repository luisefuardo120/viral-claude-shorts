// shots/01_all.js — every shot of "David y Goliat" (d01–d24).
import { E, V, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, shake, talkAmount, seg, circle, ring, poly, rr, glow, alpha, shade, text, linGrad, backdrop, FONTS, S } from '/engine/core.js';
import { drawFigure, POSES, posesAt, breathe, walkPose, bigFace } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { valley, tentInside, david, goliat, soldier, bigDavid, bigGoliat, stone, sling, sheep, helmet, GY0 } from '../sets/world.js';
import { DAVID, GOLIAT, SOLDIER, YOU } from '../cast.js';

const at = (info, gt) => gt - info.shot.start;
const blink = (t, p = 3.1) => (t % p) > p - 0.1;
const pop = (g, str, x, y, k, size = 120, color = S().ui.gold) => { if (k <= 0) return; g.save(); g.translate(x, y); g.scale(k, k); text(g, str, 0, 0, { size, color, glow: 36, glowColor: 'rgba(255,160,60,.8)', spacing: 6 }); g.restore(); };
const RIM = () => mood('golden').rim;
const DS = 1.25, GS = 2.3;   // David's and Goliat's figure scales in shared shots

// big hand (insert shots): sleeve from the bottom-right, palm up
function hand(g, x, y, s, sleeve) { const ink = S().ink; seg(g, [[x + 60 * s, y + 40 * s], [E.W + 300, E.H + 200]], 110 * s, sleeve); seg(g, [[x + 40 * s, y + 20 * s], [x + 140 * s, y + 120 * s]], 80 * s, ink);
  g.fillStyle = ink; g.beginPath(); g.ellipse(x, y, 90 * s, 50 * s, -0.2, 0, Math.PI * 2); g.fill(); for (let i = 0; i < 4; i++) seg(g, [[x - 40 * s + i * 26 * s, y - 20 * s], [x - 70 * s + i * 30 * s, y - 70 * s]], 22 * s, ink); seg(g, [[x + 60 * s, y - 10 * s], [x + 110 * s, y - 60 * s]], 24 * s, ink); }

// d01 — "Un joven con una sola piedra"  the stone in a hand, glowing
registerShot('d01', { draw(g, t, info) {
  blurLayer(g, 14, (g) => valley(g, t, { z: 1.6, y: -200 }, { rays: 0.5 }));
  veil(g, '#1a0a06', 0.3);
  const k = ease.out(prog(t, 0.2, 1.0)), s = V(1.6, 1.9) * (1 + 0.05 * t), x = E.W * 0.48, y = E.H * 0.52;
  hand(g, x, y, s, DAVID.color);
  stone(g, x - 10 * s, y - 50 * s, 46 * s, { glow: 0.3 + 0.4 * k });
  for (let i = 0; i < 10; i++) FX.sparkle(g, x + Math.cos(i + t) * 160, y - 80 * s + Math.sin(i * 2 + t) * 120, 10, '#fff3c0', 0.5 * k);
} });

// d02 — "derribó a"  the stone flies towards a giant silhouette
registerShot('d02', { draw(g, t, info) {
  const cam = { z: 1.1 }; const { GY, M } = valley(g, t, cam, { armies: false });
  layer(g, cam, 1, (g) => { goliat(g, { x: E.W * 0.7, y: GY + 40, s: 3.2, facing: -1, pose: POSES.stand, expr: 'smirk', rim: { color: M.rim, dir: [0, -1] }, dim: true }); });
  const k = ease.in(prog(t, 0, info.dur)), sx = lerp(E.W * 0.05, E.W * 0.66, k), sy = lerp(E.H * 0.7, GY + 40 - 208 * 3.2, k);
  FX.speedLines(g, t, { cx: sx, cy: sy, count: 50, a: 0.3, inner: 120 });
  for (let i = 1; i < 8; i++) circle(g, sx - i * 26, sy + i * 14, 14 - i, alpha('#fff3c0', 0.35 - i * 0.04));
  stone(g, sx, sy, 22, { glow: 0.4 });
} });

// d03 — "un gigante de casi tres metros."  low angle; the 3 m measure
registerShot('d03', { draw(g, t, info) {
  const cam = { z: 1.05 + 0.04 * t, y: -40 }; const { GY, M } = valley(g, t, cam, { mood: 'dusk' });
  const gx = E.W * 0.62, dx = E.W * 0.22, sh = shake(t, 6 * (1 - prog(t, 0.3, 0.8)), 6);
  layer(g, cam, 1, (g) => { goliat(g, { x: gx + sh[0], y: GY + 80, s: GS, facing: -1, pose: breathe(POSES.crossArms, t, 0.6), expr: 'smirk', rim: { color: M.rim, dir: [1, -0.4] } });
    david(g, { x: dx, y: GY + 80, s: DS, facing: 1, pose: breathe(POSES.stand, t), expr: 'determined', look: [0.3, -1], rim: { color: M.rim, dir: [1, -0.4] }, blink: blink(t) }); });
  const top = GY + 80 - 250 * GS, x = E.W * 0.9;
  UI.dimension(g, t, { x1: x, y1: GY + 80, x2: x, y2: top, str: '≈ 3 m', start: at(info, 3.84) - 0.3 });
} });

// d04 — "El gigante se llamaba Goliat."
registerShot('d04', { draw(g, t, info) {
  blurLayer(g, 14, (g) => valley(g, t, { z: 1.5, x: 100, y: -150 }, { mood: 'dusk' })); veil(g, '#140806', 0.4);
  const r = V(290, 320) * (1 + 0.05 * t), n = at(info, 6.32);
  bigGoliat(g, E.W / 2, E.H * 0.55, r, { expr: t > n - 0.1 ? 'angry' : 'smirk', look: [0, 0.1], rimColor: '#ffb070', rimSide: 1, blink: blink(t, 3.5) });
  pop(g, 'GOLIAT', E.W / 2, E.H * 0.17, ease.outBack(prog(t, n - 0.1, n + 0.3)), 140, '#ff7a4a');
} });

// d05 — "Durante cuarenta días desafió"  wide valley; 40 DÍAS counter
registerShot('d05', { draw(g, t, info) {
  const cam = { z: 1.0 + 0.05 * t }; const { GY, M } = valley(g, t, cam, { mood: 'golden' });
  const talk = talkAmount(info.globalT, 7.1, 9.2) * 0.6;
  layer(g, cam, 1, (g) => goliat(g, { x: E.W * 0.6, y: GY + 60, s: 1.5, facing: -1, pose: breathe(posesAt(t, [[0, POSES.stand], [0.5, POSES.point]], 0.3), t), expr: 'angry', talk, rim: { color: M.rim, dir: [0, -1] } }));
  FX.rings(g, E.W * 0.6 - 20, GY + 60 - 320, t, { count: 3, r0: 60, r1: 200, color: '#ffd8a0', a: 0.4 });
  const c = Math.round(lerp(1, 40, ease.inOut(prog(t, 0.3, at(info, 8.12) + 0.2))));
  pop(g, `${c} DÍAS`, E.W / 2, E.H * 0.16, ease.outBack(prog(t, 0.2, 0.5)), 120);
} });

// d06 — "al ejército de Israel, y"  soldiers on the hillside, worried
registerShot('d06', { draw(g, t, info) {
  const cam = { z: 1.25, x: -260 + 40 * t, y: -60 }; const { GY, M } = valley(g, t, cam, { mood: 'golden' });
  layer(g, cam, 1, (g) => { for (let i = 0; i < 5; i++) soldier(g, { x: E.W * 0.08 + i * 150, y: GY + 40 + (i % 2) * 40, s: 1.25, facing: 1, pose: breathe(POSES.stand, t, 1, i), expr: i % 2 ? 'worried' : 'nervous', rim: { color: M.rim, dir: [1, -0.4] }, blink: blink(t + i) }); });
  text(g, 'ISRAEL', E.W / 2, E.H * 0.16, { size: 90, color: S().ui.cream, glow: 24, glowColor: 'rgba(255,160,60,.6)', spacing: 10, alpha: ease.out(prog(t, 0.1, 0.4)) });
} });

// d07 — "nadie se atrevía a enfrentarlo."  a scared soldier, the others step back
registerShot('d07', { draw(g, t, info) {
  blurLayer(g, 12, (g) => valley(g, t, { z: 1.5, x: -200 }, { mood: 'dusk' })); veil(g, '#0a0a18', 0.35);
  const r = V(290, 320) * (1 + 0.04 * t), [sx, sy] = shake(t, 4, 4);
  bigFace(g, E.W / 2 + sx, E.H * 0.5 + sy, r, { outfit: SOLDIER, expr: 'scared', face: { brows: 'angry' }, look: [0.5, 0], rimColor: '#ffb070', rimSide: -1, blink: blink(t, 2.5) });
  g.save(); g.translate(E.W / 2 + sx, E.H * 0.5 + sy); g.fillStyle = '#6a6a72'; g.beginPath(); g.ellipse(0, -r * 0.3, r * 1.05, r * 0.85, 0, Math.PI, Math.PI * 2); g.fill(); g.fillRect(-r * 1.05, -r * 0.34, r * 2.1, r * 0.12); g.restore();
  g.fillStyle = '#9fd8ff'; g.beginPath(); g.ellipse(E.W / 2 + r * 0.75, E.H * 0.5 - r * 0.15 + (t * 80) % 60, r * 0.06, r * 0.1, 0, 0, Math.PI * 2); g.fill();
} });

// d08 — "Hasta que llegó David,"  he walks in at sunrise; DAVID
registerShot('d08', { draw(g, t, info) {
  const cam = { z: 1.2 + 0.05 * t }; const { GY, M } = valley(g, t, cam, { mood: 'golden', rays: 0.8, armies: false, sunX: 0.5 });
  const x = lerp(E.W * 0.25, E.W * 0.5, t / info.dur);
  layer(g, cam, 1, (g) => { FX.pool(g, x, GY + 70, 240, 34, M.key, 0.3);
    seg(g, [[x + 40, GY + 70], [x + 52, GY - 230]], 8, '#6a4428'); seg(g, [[x + 52, GY - 230], [x + 72, GY - 260], [x + 80, GY - 240]], 8, '#6a4428');
    david(g, { x, y: GY + 70, s: 1.6, facing: 1, pose: walkPose(t * 2 * Math.PI * 0.9), expr: 'smile', rim: { color: M.rim, dir: [0, -1] }, blink: blink(t) }); });
  pop(g, 'DAVID', E.W / 2, E.H * 0.17, ease.outBack(prog(t, at(info, 13.94) - 0.1, at(info, 13.94) + 0.3)), 140, '#7ee08a');
} });

// d09 — "un joven pastor que solo traía"  among his sheep
registerShot('d09', { draw(g, t, info) {
  const cam = { z: 1.15 + 0.04 * t, x: 30 * t }; const { GY, M } = valley(g, t, cam, { mood: 'golden', armies: false });
  layer(g, cam, 1, (g) => { sheep(g, E.W * 0.18, GY + 120, 1.3, t, 1); sheep(g, E.W * 0.72, GY + 90, 1.2, t + 1, -1); sheep(g, E.W * 0.88, GY + 150, 1.4, t + 2, -1);
    david(g, { x: E.W * 0.45, y: GY + 90, s: 1.6, facing: 1, pose: breathe({ ...POSES.relaxed, hF: [30, -150], eF: [20, -130] }, t), expr: 'happy', rim: { color: M.rim, dir: [0, -1] }, blink: blink(t) });
    seg(g, [[E.W * 0.45 + 48, GY + 90], [E.W * 0.45 + 52, GY + 90 - 320]], 8, '#6a4428'); });
  FX.dust(g, t, { count: 40, color: '#ffe8c0', a: 0.4 });
} });

// d10 — "comida para sus hermanos."  bread for the brothers
function basket(g, x, y, s) { g.fillStyle = '#8a5a2a'; g.beginPath(); g.moveTo(x - 60 * s, y - 30 * s); g.lineTo(x + 60 * s, y - 30 * s); g.lineTo(x + 46 * s, y + 20 * s); g.lineTo(x - 46 * s, y + 20 * s); g.closePath(); g.fill();
  for (const [dx, c] of [[-28, '#e0a050'], [0, '#f0c070'], [26, '#d08a40']]) { g.fillStyle = c; g.beginPath(); g.ellipse(x + dx * s, y - 36 * s, 22 * s, 14 * s, 0, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = shade('#8a5a2a', -0.3); g.lineWidth = 3 * s; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x + i * 20 * s, y - 30 * s); g.lineTo(x + i * 16 * s, y + 20 * s); g.stroke(); } }
registerShot('d10', { draw(g, t, info) {
  const cam = { z: 1.35, y: 80 }; const { GY, M } = valley(g, t, cam, { mood: 'golden' });
  const k = ease.inOut(prog(t, 0.2, 0.9));
  layer(g, cam, 1, (g) => { const reach = { ...POSES.holdFront, hF: [lerp(36, 60, k), -152], eF: [lerp(22, 40, k), -140], hB: [lerp(30, 54, k), -154], eB: [lerp(16, 34, k), -142] };
    david(g, { x: E.W * 0.32, y: GY + 60, s: 1.6, facing: 1, pose: breathe(reach, t), expr: 'smile', rim: { color: M.rim, dir: [1, -0.4] }, blink: blink(t) });
    basket(g, E.W * 0.32 + lerp(56, 95, k) * 1.6, GY + 60 - 150 * 1.6, 1.2);
    for (let i = 0; i < 2; i++) soldier(g, { x: E.W * (0.66 + i * 0.18), y: GY + 60 + i * 20, s: 1.6, facing: -1, pose: breathe(i ? POSES.relaxed : POSES.reach, t, 1, i), expr: 'happy', rim: { color: M.rim, dir: [-1, -0.4] }, blink: blink(t + 1 + i) }); });
} });

// the oversized armour / helmet on David (d11, d12)
function armourOn(g, x, y, s, t, fall) {
  const c = '#8a8a92', d = shade(c, -0.3);
  rr(g, x - 46 * s, y - 190 * s, 92 * s, 120 * s, 18 * s); g.fillStyle = c; g.fill(); g.strokeStyle = d; g.lineWidth = 4 * s; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x - 44 * s, y - 190 * s + i * 30 * s); g.lineTo(x + 44 * s, y - 190 * s + i * 30 * s); g.stroke(); }
  const hy = y - 208 * s + fall * 40 * s; g.fillStyle = c; g.beginPath(); g.ellipse(x + 3 * s, hy - 10 * s, 48 * s, 46 * s, Math.sin(t * 4) * 0.1 * fall, Math.PI, Math.PI * 2); g.fill(); g.fillRect(x - 45 * s, hy - 12 * s, 96 * s, 44 * s * fall + 8 * s);
}
// d11 — "Le ofrecieron una armadura,"
registerShot('d11', { draw(g, t, info) {
  const cam = { z: 1.15 + 0.04 * t, y: 60 }; const { GY, M } = tentInside(g, t, cam);
  const k = ease.out(prog(t, 0.3, 1.0));
  layer(g, cam, 1, (g) => { david(g, { x: E.W * 0.36, y: GY + 60, s: 1.55, facing: 1, pose: breathe(POSES.stand, t), expr: 'surprised', rim: { color: M.rim, dir: [1, -0.4] }, blink: blink(t) });
    soldier(g, { x: E.W * 0.72, y: GY + 60, s: 1.55, facing: -1, pose: POSES.holdFront, expr: 'smile', rim: { color: M.rim, dir: [-1, -0.4] } });
    armourOn(g, lerp(E.W * 0.6, E.W * 0.52, k), GY + 60 - 40, 1.55, t, 0); });
} });
// d12 — "pero le quedaba enorme."  comedy
registerShot('d12', { draw(g, t, info) {
  const cam = { z: 1.6 + 0.05 * t, y: 160, r: Math.sin(t * 3) * 0.01 }; const { GY, M } = tentInside(g, t, cam);
  const f = ease.outBack(prog(t, 0.4, 0.8)), wob = Math.sin(t * 5) * 0.08;
  layer(g, cam, 1, (g) => { g.save(); g.translate(E.W * 0.5, GY + 60); g.rotate(wob); g.translate(-E.W * 0.5, -GY - 60);
    david(g, { x: E.W * 0.5, y: GY + 60, s: 1.55, facing: 1, pose: posesAt(t, [[0, POSES.stand], [0.6, POSES.shrug]], 0.3), expr: 'confused', rim: { color: M.rim, dir: [1, -0.4] } });
    armourOn(g, E.W * 0.5, GY + 60, 1.55, t, f); g.restore(); });
  if (t > 0.6) FX.rings(g, E.W * 0.5, E.H * 0.35, t - 0.6, { count: 2, r0: 40, r1: 160, color: '#fff3e0', a: 0.4 });
} });

// d13 — "Así que tomó su honda y"  insert: the sling in his hand
registerShot('d13', { draw(g, t, info) {
  blurLayer(g, 14, (g) => valley(g, t, { z: 1.7, y: -100 }, { stream: true })); veil(g, '#1a0a06', 0.3);
  const s = V(1.5, 1.8), x = E.W * 0.45, y = E.H * 0.45, k = ease.out(prog(t, 0.2, 0.7));
  hand(g, x, y, s, DAVID.color);
  sling(g, x - 20 * s, y - 40 * s, lerp(60, 320, k), Math.PI / 2 + Math.sin(t * 2) * 0.15, {});
} });

// d14 — "cinco piedras lisas del arroyo."  five stones counted
registerShot('d14', { draw(g, t, info) {
  const cam = { z: 1.3, y: 120 }; const { GY, M } = valley(g, t, cam, { mood: 'golden', stream: true, armies: false });
  layer(g, cam, 1, (g) => { david(g, { x: E.W * 0.3, y: GY + 130, s: 1.55, facing: 1, pose: breathe({ ...POSES.kneel, hF: [50, -30], eF: [34, -70] }, t), expr: 'smile', rim: { color: M.rim, dir: [0, -1] }, blink: blink(t) }); });
  for (let i = 0; i < 5; i++) { const k = ease.outBack(prog(t, 0.15 + i * 0.3, 0.4 + i * 0.3)); if (k <= 0) continue; const x = E.W * (0.2 + i * 0.15), y = E.H * 0.24;
    g.save(); g.translate(x, y); g.scale(k, k); stone(g, 0, 0, 34, { glow: 0.25 }); text(g, String(i + 1), 0, 80, { size: 54, color: S().ui.gold, glow: 16, glowColor: 'rgba(255,160,60,.7)', font: FONTS.ui, weight: 900 }); g.restore(); }
} });

// d15 — "Goliat se burló de él."  laughing giant
registerShot('d15', { draw(g, t, info) {
  blurLayer(g, 14, (g) => valley(g, t, { z: 1.5, x: 200, y: -150 }, { mood: 'dusk' })); veil(g, '#140806', 0.35);
  const r = V(300, 330), b = at(info, 26.76), [sx, sy] = t > b ? shake(t, 6, 8) : [0, 0];
  bigGoliat(g, E.W / 2 + sx, E.H * 0.52 + sy + (t > b ? Math.abs(Math.sin(t * 14)) * 10 : 0), r, { expr: t > b ? 'joy' : 'smirk', tilt: t > b ? -0.08 : 0, rimColor: '#ffb070', rimSide: 1, blink: blink(t, 3.6) });
  if (t > b) { for (let i = 0; i < 3; i++) text(g, 'JA', E.W * (0.2 + i * 0.3), E.H * (0.18 + (i % 2) * 0.06) - (t - b) * 40, { size: 80, color: '#ff7a4a', glow: 18, glowColor: 'rgba(255,90,40,.7)', alpha: 1 - prog(t, b + 0.8, b + 1.6) }); }
} });

// d16 — "Pero David le dijo:"  determined
registerShot('d16', { draw(g, t, info) {
  blurLayer(g, 14, (g) => valley(g, t, { z: 1.5, x: -200, y: -150 }, { mood: 'golden', rays: 0.6 })); veil(g, '#140806', 0.25);
  const r = V(300, 330) * (1 + 0.06 * ease.inOut(t / info.dur));
  bigDavid(g, E.W / 2, E.H * 0.52, r, { expr: 'determined', look: [0.4, -0.2], rimColor: '#ffd8a0', rimSide: -1, blink: blink(t) });
} });

// d17 — "Tú vienes a mí con espada…"  David speaks; the giant's sword gleams
registerShot('d17', { draw(g, t, info) {
  const cam = { z: 1.2 + 0.05 * t, y: 40 }; const { GY, M } = valley(g, t, cam, { mood: 'dusk' });
  const talk = talkAmount(info.globalT, 29.4, 31.2), sw = at(info, 30.58);
  layer(g, cam, 1, (g) => { goliat(g, { x: E.W * 0.74, y: GY + 120, s: 2.0, facing: -1, spear: false, pose: { ...POSES.stand, eF: [30, -186], hF: [44, -232] }, expr: 'angry', rim: { color: M.rim, dir: [-1, -0.3] } });
    const hx = E.W * 0.74 - 44 * 2, hy = GY + 120 - 232 * 2; seg(g, [[hx, hy], [hx - 60, hy - 260]], 16, '#d8d8e0'); seg(g, [[hx - 30, hy + 10], [hx + 30, hy - 10]], 14, '#6a4a2a');
    if (t > sw - 0.2) FX.sparkle(g, hx - 40, hy - 200, 60, '#ffffff', 0.9 * (1 - prog(t, sw + 0.2, sw + 0.8)));
    david(g, { x: E.W * 0.24, y: GY + 120, s: 1.35, facing: 1, pose: breathe(POSES.talk, t), expr: 'determined', talk, rim: { color: M.rim, dir: [1, -0.4] }, blink: blink(t) }); });
  if (talk > 0) FX.rings(g, E.W * 0.24 + 10, GY + 120 - 210 * 1.35, t, { count: 2, r0: 40, r1: 110, color: '#fff3e0', a: 0.3 });
} });

// d18 — "mas yo vengo a ti en el nombre de Jehová."  golden rays behind David
registerShot('d18', { draw(g, t, info) {
  const n = at(info, 33.0), k = ease.out(prog(t, n - 0.6, n + 0.4));
  blurLayer(g, 14, (g) => valley(g, t, { z: 1.5, x: -200, y: -150 }, { mood: 'golden', rays: 1 })); veil(g, '#140806', 0.25 - 0.15 * k);
  FX.godRays(g, E.W / 2, E.H * 0.42, { angle: -Math.PI / 2, spread: Math.PI * 2, len: E.H, color: '#ffe2a0', a: 0.06 + 0.12 * k, t, count: 16 });
  glow(g, E.W / 2, E.H * 0.5, 700, '#ffd36e', 0.15 + 0.25 * k);
  const r = V(300, 330) * (1 + 0.05 * t), talk = talkAmount(info.globalT, 31.3, 34.2);
  bigDavid(g, E.W / 2, E.H * 0.52, r, { expr: 'determined', talk, look: [0.3, -0.1], rimColor: '#ffe2a0', rimSide: -1 });
  if (talk > 0) FX.rings(g, E.W / 2, E.H * 0.52, t, { count: 3, r0: r * 1.1, r1: r * 1.6, color: '#fff3c0', a: 0.3 });
} });

// d19 — "Lanzó una sola"  the sling whirls and releases
registerShot('d19', { draw(g, t, info) {
  const cam = { z: 1.3, y: 60 }; const { GY, M } = valley(g, t, cam, { mood: 'golden', rays: 0.4 });
  const rel = at(info, 34.46) + 0.45, x = E.W * 0.42, s = 1.6;
  layer(g, cam, 1, (g) => { const up = { ...POSES.stand, eF: [24, -206], hF: [30, -248] };
    david(g, { x, y: GY + 80, s, facing: 1, pose: t < rel ? up : POSES.point, expr: 'determined', rim: { color: M.rim, dir: [0, -1] } });
    const hx = x + (t < rel ? 30 : 68) * s, hy = GY + 80 - (t < rel ? 248 : 172) * s;
    if (t < rel) { const a = t * 22; for (let i = 1; i < 5; i++) sling(g, hx, hy, 120, a - i * 0.25, {}); g.globalAlpha = 1; sling(g, hx, hy, 120, a, { stone: true }); FX.rings(g, hx, hy, t, { count: 2, r0: 100, r1: 140, color: '#fff3e0', a: 0.3 }); }
    else { sling(g, hx, hy, 110, 0.3, {}); const u = t - rel; stone(g, hx + 900 * u, hy - 120 * u, 14, { glow: 0.5 }); FX.speedLines(g, t, { cx: hx + 900 * u, cy: hy - 120 * u, count: 30, a: 0.3, inner: 40 }); } });
} });

// d20 — "piedra… y el"  FREEZE: the stone hangs in front of the helmet
registerShot('d20', { draw(g, t, info) {
  const cam = { z: 1.4 + 0.03 * t, r: -0.02 + 0.01 * t };
  blurLayer(g, 10, (g) => valley(g, 0, { z: 1.6, x: 200, y: -200 }, { mood: 'dusk' })); veil(g, '#08101a', 0.3);
  layer(g, cam, 1, (g) => { const r = 330; bigGoliat(g, E.W * 0.7, E.H * 0.42, r, { expr: 'shocked', look: [-0.6, 0], rimColor: '#ffb070', rimSide: 1 });
    FX.drops(g, t, { count: 40, color: '#ffe8c0', rMax: 6, drift: 2 });
    const x = E.W * 0.3 + t * 30, y = E.H * 0.43; for (let i = 1; i < 10; i++) circle(g, x - i * 24, y + i * 3, 30 - i * 2.5, alpha('#fff3c0', 0.25 - i * 0.02)); stone(g, x, y, 34, { glow: 0.6 });
    FX.rings(g, x, y, t, { count: 3, r0: 60, r1: 220, speed: 0.4, color: '#fff3c0', a: 0.35 }); });
  g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(80,120,255,.3)'; g.fillRect(0, 0, E.W, E.H); g.restore();
} });

// d21 — "gigante cayó."  the giant falls backwards; dust; the army cheers
registerShot('d21', { draw(g, t, info) {
  const c = at(info, 36.96), k = ease.in(prog(t, 0.05, c + 0.05)), [sx, sy] = t > c ? shake(t, 24 * (1 - prog(t, c, c + 0.8)), 8) : [0, 0];
  const cam = { z: 1.05, x: sx, y: sy }; const { GY, M } = valley(g, t, cam, { mood: 'golden', cheerL: t > c ? 1 : 0 });
  layer(g, cam, 1, (g) => { goliat(g, { x: E.W * 0.58, y: GY + 100, s: 1.9, facing: -1, spear: false, pose: posesAt(t, [[0, POSES.stand], [0.1, POSES.fall]], 0.3), rot: k * 1.45, expr: 'shocked', rim: { color: M.rim, dir: [0, -1] }, shadow: false });
    if (t > c) { const u = t - c; for (let i = 0; i < 18; i++) { const a = Math.PI + (i / 17) * Math.PI, d = 80 + u * 300; g.fillStyle = alpha('#e8c890', 0.5 * (1 - prog(u, 0.2, 1.2))); g.beginPath(); g.arc(E.W * 0.7 + Math.cos(a) * d, GY + 100 + Math.sin(a) * d * 0.25, 30 + u * 30, 0, Math.PI * 2); g.fill(); } }
    david(g, { x: E.W * 0.15, y: GY + 100, s: 1.25, facing: 1, pose: t > c + 0.3 ? breathe(POSES.cheer, t) : POSES.point, expr: t > c + 0.3 ? 'joy' : 'determined', rim: { color: M.rim, dir: [0, -1] } }); });
} });

// d22 — "Tu gigante puede ser enorme,"  you before a huge dark giant shadow
registerShot('d22', { draw(g, t, info) {
  const cam = { z: 1.0 + 0.06 * t }, GY = GY0();
  layer(g, cam, 0.2, (g) => { backdrop(g, ['#0a0a14', '#1a1020', '#2a1414']); FX.fog(g, GY - 300, 400, '#4a2a3a', 0.4); });
  layer(g, cam, 0.6, (g) => { g.save(); g.globalAlpha = 0.92; drawFigure(g, { x: E.W * 0.55, y: GY + 200, s: 4.2, facing: -1, outfit: { top: 'none' }, pose: breathe(POSES.crossArms, t * 0.5, 2), expr: 'angry', ink: '#050208', rim: { color: '#ff3d2e', dir: [0, -1], w: 6 } }); g.restore(); circle(g, E.W * 0.55 - 28, GY + 200 - 208 * 4.2 - 4, 14, '#ff3d2e'); glow(g, E.W * 0.55 - 28, GY + 200 - 208 * 4.2 - 4, 80, '#ff3d2e', 0.6); });
  layer(g, cam, 1, (g) => { g.fillStyle = '#100a10'; g.fillRect(-E.W, GY + 40, E.W * 3, E.H); drawFigure(g, { x: E.W * 0.3, y: GY + 40, s: 1.3, facing: 1, outfit: YOU, pose: breathe(POSES.sad, t), expr: 'scared', look: [0.5, -1], rim: { color: '#ff7a4a', dir: [1, -0.5] }, blink: blink(t) }); });
} });

// d23 — "pero tu Dios es más grande."  golden light rises, the shadow shrinks
registerShot('d23', { draw(g, t, info) {
  const m = at(info, 41.3), k = ease.inOut(prog(t, 0.2, m + 0.2)), cam = { z: 1.0 + 0.05 * t }, GY = GY0();
  layer(g, cam, 0.2, (g) => { backdrop(g, ['#0a0a14', '#1a1020', '#2a1414']); glow(g, E.W / 2, E.H * 0.25, E.W * (0.4 + k), '#ffd36e', 0.2 + 0.5 * k); FX.godRays(g, E.W / 2, E.H * 0.2, { angle: Math.PI / 2, spread: 2.4, len: E.H * 1.3, color: '#ffe2a0', a: 0.18 * k, t, count: 14 }); });
  layer(g, cam, 0.6, (g) => { const s = lerp(4.2, 1.2, k); g.save(); g.globalAlpha = 0.92 * (1 - k * 0.6); drawFigure(g, { x: E.W * 0.7, y: GY + 40 + (1 - k) * 160, s, facing: -1, outfit: { top: 'none' }, pose: POSES.crossArms, expr: 'scared', ink: '#050208', rim: { color: '#ff3d2e', dir: [0, -1], w: 6 } }); g.restore(); });
  layer(g, cam, 1, (g) => { g.fillStyle = '#100a10'; g.fillRect(-E.W, GY + 40, E.W * 3, E.H); FX.pool(g, E.W * 0.4, GY + 40, 300, 40, '#ffd36e', 0.4 * k);
    drawFigure(g, { x: E.W * 0.4, y: GY + 40, s: 1.4, facing: 1, outfit: YOU, pose: breathe(posesAt(t, [[0, POSES.sad], [m, POSES.cheer]], 0.4), t), expr: t > m ? 'joy' : 'awe', look: [0, -1], rim: { color: '#ffe2a0', dir: [0, -1] }, blink: blink(t) }); });
  for (let i = 0; i < 14; i++) FX.sparkle(g, E.W * (0.15 + ((i * 41) % 70) / 100), E.H * 0.1 + ((t * 90 + i * 113) % (E.H * 0.5)), 12, '#fff3c0', 0.7 * k);
} });

// d24 — "Sígueme para la próxima historia."  end screen
registerShot('d24', { draw(g, t, info) {
  const ui = S().ui;
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#1b1426', '#3a2030', '#6a3a2a']); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
  glow(g, E.W / 2, E.H * 0.88, E.W * 0.7, '#ff9a5a', 0.3); FX.dust(g, t, { count: 40, color: '#ffe0b0', a: 0.4 });
  text(g, 'Cerca de ti', E.W / 2, E.H * 0.2, { size: 92, font: FONTS.serif, weight: 900, italic: true, color: ui.cream, alpha: ease.out(prog(t, 0.1, 0.6)), glow: 20, glowColor: 'rgba(255,170,90,.6)' });
  text(g, 'PRÓXIMA HISTORIA: EL HIJO PRÓDIGO', E.W / 2, E.H * 0.28, { size: 36, color: ui.gold, alpha: ease.out(prog(t, 0.4, 0.9)), spacing: 2, font: FONTS.ui, weight: 900 });
  const sp = ease.outBack(prog(t, 0.6, 1.0)); g.save(); g.translate(E.W / 2, E.H * 0.38); g.scale(sp * 1.4, sp * 1.4); rr(g, -160, -40, 320, 80, 40); g.fillStyle = '#e0302a'; g.fill(); text(g, 'SÍGUEME', 0, 2, { size: 40, color: '#fff', font: FONTS.ui, weight: 900, spacing: 2 }); g.restore();
  const y0 = E.H * 0.72, kk = (i) => ease.out(prog(t, 0.3 + i * 0.12, 0.8 + i * 0.12));
  david(g, { x: E.W * 0.32, y: y0 + (1 - kk(0)) * 40, s: 1.3, facing: 1, pose: breathe(POSES.wave, t), expr: 'happy', alpha: kk(0), rim: { color: '#ffb070', dir: [0, 1] }, blink: blink(t) });
  goliat(g, { x: E.W * 0.7, y: y0 + (1 - kk(1)) * 40, s: 1.6, facing: -1, spear: false, pose: breathe(POSES.crossArms, t, 1, 2), expr: 'smirk', alpha: kk(1), rim: { color: '#ffb070', dir: [0, 1] } });
} });
