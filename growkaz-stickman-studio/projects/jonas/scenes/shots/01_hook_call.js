// shots/01_hook_call.js — s01–s09: the hook in the fish, the title, God's call, the fear and the escape.
import { E, V, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, shake, seg, circle, poly, glow, alpha, shade, text, FONTS, S } from '/engine/core.js';
import { POSES, posesAt, breathe, walkPose } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { jonas, bigJonas, fish, belly, under, coast, sea, seaFront, boat, nineveh, GY0 } from '../sets/world.js';

const at = (info, gt) => gt - info.shot.start;           // a word's global time -> seconds into this shot
const blink = (t, p = 3.1) => (t % p) > p - 0.1;

// s01 — "Este hombre"  giant scared face in the dark belly
registerShot('s01', { draw(g, t, info) {
  blurLayer(g, 14, (g) => belly(g, t, { z: 1.5, y: -150 }));
  veil(g, '#12040a', 0.4);
  const r = V(300, 330) * (1 + 0.05 * ease.inOut(t / info.dur)), [sx, sy] = shake(t, 3, 2);
  glow(g, E.W / 2, E.H * 0.5, 700, '#ff7a4a', 0.12 + 0.05 * Math.sin(t * 3));
  bigJonas(g, E.W / 2 + sx, E.H * 0.5 + sy, r, { expr: 'scared', look: [0.25, -0.15], rimColor: '#ff9a6a', rimSide: -1, blink: blink(t) });
  FX.dust(g, t, { count: 40, color: '#ffb08a', a: 0.4 });
} });

// s02 — "pasó tres días"  three marks scratched on a rib, 3 DÍAS
const SIT_HUG = { ...POSES.sit, eF: [30, -120], hF: [44, -96], eB: [24, -118], hB: [38, -92], head: [10, -172] };
registerShot('s02', { draw(g, t, info) {
  const cam = { z: 1.15 + 0.06 * ease.inOut(t / info.dur), x: -60 };
  const { GY } = belly(g, t, cam);
  layer(g, cam, 1, (g) => {
    jonas(g, { x: E.W * 0.36, y: GY, s: 1.6, facing: 1, pose: breathe(SIT_HUG, t), expr: 'sad', rim: { color: '#ff9a6a', dir: [1, -0.4] }, blink: blink(t, 2.7) });
    const t3 = at(info, 1.20);
    for (let i = 0; i < 3; i++) { const k = ease.out(prog(t, t3 - 0.1 + i * 0.22, t3 + 0.1 + i * 0.22)); if (k > 0) seg(g, [[E.W * 0.68 + i * 34, GY - 520], [E.W * 0.68 + i * 34 + 6, GY - 520 + 150 * k]], 12, '#f2e2c8'); }
  });
  const k = ease.outBack(prog(t, at(info, 1.20), at(info, 1.20) + 0.4));
  if (k > 0) { g.save(); g.translate(E.W / 2, E.H * 0.22); g.scale(k, k); text(g, '3 DÍAS', 0, 0, { size: 150, color: S().ui.gold, glow: 40, glowColor: 'rgba(255,150,60,.8)', spacing: 6 }); g.restore(); }
  FX.dust(g, t, { count: 30, color: '#ffb08a', a: 0.3 });
} });

// s03 — "dentro de un pez… y sobrevivió."  the fish crosses; x-ray glow with tiny Jonás inside
registerShot('s03', { draw(g, t, info) {
  const cam = { z: 1.0 + 0.05 * t };
  under(g, t, cam, { deep: 0.3 });
  const fx = lerp(E.W * 0.42, E.W * 0.58, t / info.dur), fy = E.H * 0.47, s = V(0.9, 0.98), pulse = ease.out(prog(t, at(info, 3.62), at(info, 3.62) + 0.4));
  layer(g, cam, 1, (g) => {
    fish(g, fx, fy, s, { t, rim: '#9fdcff' });
    const bx = fx - 40 * s, by = fy - 20 * s;
    glow(g, bx, by, 220 + pulse * 120, '#ffc070', 0.55 + pulse * 0.3);
    jonas(g, { x: bx, y: by + 70, s: 0.42, facing: 1, pose: posesAt(t, [[0, POSES.sit], [at(info, 3.62), POSES.cheer]], 0.3), expr: 'happy', rim: { color: '#ffd8a0', dir: [0, -1] }, shadow: false });
  });
  FX.rings(g, fx - 40 * s, fy - 20 * s, t, { count: 2, r0: 120, r1: 300, color: '#ffd8a0', a: 0.25 * pulse });
} });

// s04 — "Se llamaba Jonás."  title card
registerShot('s04', { draw(g, t, info) {
  const cam = { z: 1.0 + 0.04 * t };
  const { GY } = coast(g, t, cam, { rays: 0.4 });
  layer(g, cam, 1, (g) => jonas(g, { x: E.W * 0.5, y: GY + 60, s: 0.9, facing: 1, pose: breathe(POSES.stand, t), expr: 'neutral', rim: { color: mood('golden').rim, dir: [0.6, -0.8] } }));
  veil(g, '#1a0c08', 0.25);
  UI.titleCard(g, t, { lines: ['SE LLAMABA', 'JONÁS'], sub: 'Y EL GRAN PEZ', dur: info.dur + 0.4, y: E.H * 0.2 });
} });

// s05 — "Dios le pidió que fuera a la ciudad"  looking up into god rays
registerShot('s05', { draw(g, t, info) {
  const cam = { z: 1.25 + 0.06 * ease.inOut(t / info.dur), y: 80 };
  const { GY, M } = coast(g, t, cam, { rays: 0.6, palms: true });
  FX.godRays(g, E.W * 0.62, -120, { angle: Math.PI / 2 + 0.25, spread: 0.7, len: E.H * 1.2, color: '#ffe2a0', a: 0.16 + 0.04 * Math.sin(t * 2), t, count: 9 });
  layer(g, cam, 1, (g) => {
    FX.pool(g, E.W * 0.45, GY + 10, 260, 40, '#ffe2a0', 0.4);
    jonas(g, { x: E.W * 0.45, y: GY, s: 1.75, facing: 1, pose: breathe(posesAt(t, [[0, POSES.stand], [0.8, POSES.reach]], 0.4), t), expr: 'awe', look: [0.4, -1], rim: { color: '#ffe2a0', dir: [0.5, -1] }, blink: blink(t) });
  });
  FX.dust(g, t, { count: 50, color: '#ffe8c0', a: 0.45 });
} });

// s06 — "de Nínive a dar un mensaje,"  the city glows; Jonás from behind with a scroll
registerShot('s06', { draw(g, t, info) {
  const cam = { z: 1.0 + 0.08 * ease.inOut(t / info.dur), x: 20 * t };
  const M = mood('golden'), GY = GY0(), nv = at(info, 8.56), gk = ease.out(prog(t, nv, nv + 0.5));
  coast(g, t, cam, { palms: false, cityX: 2 });
  layer(g, cam, 0.35, (g) => nineveh(g, E.W * 0.55, GY - V(180, 300), 1.0, M, gk));
  layer(g, cam, 1, (g) => jonas(g, { x: E.W * 0.22, y: GY + 120, s: 1.5, facing: 1, pose: breathe({ ...POSES.holdFront }, t), expr: 'thinking', prop: 'paper', rim: { color: M.rim, dir: [1, -0.4] }, blink: blink(t) }));
  if (gk > 0) { const k = ease.outBack(prog(t, nv, nv + 0.4)); g.save(); g.translate(E.W * 0.55, E.H * 0.15); g.scale(k, k); text(g, 'NÍNIVE', 0, 0, { size: 110, color: S().ui.gold, glow: 36, glowColor: 'rgba(255,170,70,.8)', spacing: 8 }); g.restore(); }
} });

// s07 — "pero él tuvo miedo"  worried -> scared at "miedo"
registerShot('s07', { draw(g, t, info) {
  blurLayer(g, 14, (g) => coast(g, t, { z: 1.6, x: 120, y: -100 }));
  veil(g, '#0a0e1e', 0.35 + 0.25 * prog(t, 0.6, 1.2));
  const m = at(info, 11.32), [sx, sy] = t > m ? shake(t, 14 * (1 - prog(t, m, m + 0.6)), 6) : [0, 0];
  const r = V(300, 340) * (1 + 0.08 * ease.out(prog(t, m, m + 0.3)));
  bigJonas(g, E.W / 2 + sx, E.H * 0.5 + sy, r, { expr: t > m ? 'scared' : 'worried', look: [-0.4, 0], rimColor: '#ffc68a', rimSide: 1, blink: blink(t) });
  if (t > m) FX.rings(g, E.W / 2, E.H * 0.5, t - m, { count: 3, r0: r * 1.1, r1: r * 1.7, color: '#c9d4ff', a: 0.4 });
} });

// s08 — "y huyó en un barco,"  running left across the sand towards the boat
registerShot('s08', { draw(g, t, info) {
  const cam = { z: 1.15, x: -260 * t };
  const { GY, M } = coast(g, t, cam, { palms: true });
  layer(g, cam, 0.9, (g) => boat(g, E.W * 0.05 - 300, GY + 10, 0.85, Math.sin(t * 1.4) * 0.02, null));
  layer(g, cam, 1, (g) => jonas(g, { x: E.W * 0.62 - 420 * t, y: GY + 40, s: 1.5, facing: -1, pose: walkPose(t * 2 * Math.PI * 1.6, { run: true }), expr: 'scared', rim: { color: M.rim, dir: [1, -0.4] }, trail: { count: 3, dx: 50 } }));
  FX.speedLines(g, t, { count: 40, a: 0.18, inner: 420 });
} });

// s09 — "justo hacia el lado contrario."  the boat sails left; Nineveh right; a red arrow grows left
registerShot('s09', { draw(g, t, info) {
  const cam = { z: 1.0 + 0.04 * t };
  const s0 = sea(g, t, cam, { storm: 0, city: 0.86, cityGlow: 0.6 });
  const bx = E.W * 0.55 - 70 * t, by = s0.HY + V(260, 380), c = at(info, 14.54);
  layer(g, cam, 1, (g) => boat(g, bx, by + Math.sin(t * 1.6) * 8, 0.75, Math.sin(t * 1.3) * 0.03, (g) => {
    jonas(g, { x: 160, y: -60, s: 1.1, facing: 1, pose: breathe(POSES.stand, t), expr: 'worried', look: [1, -0.1], rim: { color: s0.M.rim, dir: [1, -0.5] }, shadow: false });
  }));
  seaFront(g, t, cam, s0);
  // red arrow: away from Nineveh
  const k = ease.outBack(prog(t, c - 0.35, c + 0.15)), ax = E.W * 0.78, ay = s0.HY - V(160, 340);
  if (k > 0) { const L = 560 * k; seg(g, [[ax, ay], [ax - L, ay]], 26, '#e5484d'); poly(g, [[ax - L - 60, ay], [ax - L + 10, ay - 46], [ax - L + 10, ay + 46]], '#e5484d'); glow(g, ax - L / 2, ay, 300, '#e5484d', 0.2); }
  text(g, 'NÍNIVE', E.W * 0.82, s0.HY - V(70, 230), { size: 46, color: S().ui.gold, glow: 20, glowColor: 'rgba(255,170,70,.7)', alpha: 0.9 });
} });
