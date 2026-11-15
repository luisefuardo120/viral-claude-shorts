// shots/02_storm_fish.js — s10–s26: the storm, the jump, the fish, the prayer, the shore, the lesson and the end screen.
import { E, V, registerShot, mood, layer, blurLayer, veil, ease, prog, key, clamp, lerp, shake, seg, circle, poly, rr, glow, alpha, shade, text, linGrad, FONTS, S } from '/engine/core.js';
import { drawFigure, POSES, posesAt, breathe, walkPose, bigFace } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { jonas, bigJonas, fish, fishMouth, belly, under, coast, sea, seaFront, boat, GY0 } from '../sets/world.js';
import { SAILOR, CREW, JONAS } from '../cast.js';

const at = (info, gt) => gt - info.shot.start;
const blink = (t, p = 3.1) => (t % p) > p - 0.1;
const rock = (t, a = 0.09) => Math.sin(t * 1.7) * a + Math.sin(t * 2.9) * a * 0.3;
const STORM_RIM = '#cfd9ff';

// the deck in the storm, shared by s12/s14/s15 (people drawn by fn inside the boat)
function deck(g, t, info, cam, fn, o = {}) {
  const s0 = sea(g, t, cam, { storm: 1, flash: o.flash || 0, horizon: 0.42 });
  layer(g, cam, 1, (g) => boat(g, E.W / 2, s0.HY + V(420, 700), o.s || 1.25, rock(t), fn));
  seaFront(g, t, cam, s0, { dy: 140 });
  FX.rain(g, t, { count: 300, a: 0.35, angle: 0.22 });
  return s0;
}
const flashAt = (t, t0) => (t < t0 ? 0 : Math.exp(-(t - t0) * 8) + (t - t0 > 0.2 ? 0.6 * Math.exp(-(t - t0 - 0.2) * 10) : 0));

// s10 — "Entonces vino una tormenta"  lightning at "tormenta"
registerShot('s10', { draw(g, t, info) {
  const cam = { z: 1.0 + 0.05 * t, r: rock(t, 0.015) }, L = at(info, 16.88), fl = flashAt(t, L);
  const s0 = sea(g, t, cam, { storm: 1, flash: fl, horizon: 0.5 });
  if (t > L && t < L + 0.35) layer(g, cam, 0.15, (g) => FX.lightning(g, { x1: E.W * 0.7, y1: -20, x2: E.W * 0.55, y2: s0.HY, w: 6, seed: 11 }));
  layer(g, cam, 1, (g) => boat(g, E.W / 2, s0.HY + V(260, 470), 0.8, rock(t, 0.12), (g) => {
    for (const [x, o] of [[-120, CREW], [40, SAILOR], [190, CREW]]) drawFigure(g, { x, y: -60, s: 1.1, facing: 1, outfit: o, pose: POSES.handsOnHead, expr: 'scared', rim: { color: STORM_RIM, dir: [0, -1] }, shadow: false });
  }));
  seaFront(g, t, cam, s0);
  FX.rain(g, t, { count: 320, a: 0.38, angle: 0.25 });
} });

// s11 — "tan fuerte que"  a huge wave slams the boat
registerShot('s11', { draw(g, t, info) {
  const [sx, sy] = shake(t, 22 * (1 - prog(t, 0.1, 1.0)), 8), cam = { z: 1.3, x: sx, y: sy, r: -0.06 * ease.out(prog(t, 0, 0.5)) };
  const s0 = sea(g, t, cam, { storm: 1, horizon: 0.38, flash: flashAt(t, 0.9) * 0.5 });
  layer(g, cam, 1, (g) => boat(g, E.W * 0.45, s0.HY + V(380, 660), 1.0, -0.25 * ease.out(prog(t, 0, 0.5)) + rock(t, 0.05), (g) => {
    drawFigure(g, { x: -40, y: -60, s: 1.1, facing: 1, outfit: SAILOR, pose: POSES.crouch, expr: 'shocked', rim: { color: STORM_RIM, dir: [0, -1] }, shadow: false });
  }));
  // the wall of water crashing from the right
  const k = ease.out(prog(t, 0, 0.6));
  layer(g, cam, 1.2, (g) => { g.fillStyle = linGrad(g, 0, E.H * 0.2, 0, E.H, ['#4a4a6a', '#24203a', '#100c1a']); g.beginPath(); g.moveTo(E.W * 2, E.H * 2); g.lineTo(E.W * lerp(1.6, 0.7, k), E.H * 2);
    g.quadraticCurveTo(E.W * lerp(1.5, 0.75, k), E.H * 0.45, E.W * lerp(1.3, 0.55, k), E.H * 0.3); g.quadraticCurveTo(E.W * lerp(1.4, 0.75, k), E.H * 0.18, E.W * 2, E.H * 0.3); g.closePath(); g.fill();
    g.strokeStyle = alpha('#eef4ff', 0.75); g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(E.W * lerp(1.5, 0.75, k), E.H * 0.42); g.quadraticCurveTo(E.W * lerp(1.45, 0.62, k), E.H * 0.33, E.W * lerp(1.3, 0.55, k), E.H * 0.3); g.quadraticCurveTo(E.W * lerp(1.4, 0.72, k), E.H * 0.2, E.W * 1.2, E.H * 0.28); g.stroke();
    FX.drops(g, t, { count: 40, area: [E.W * 0.3, E.H * 0.1, E.W * 0.7, E.H * 0.5], rMin: 4, rMax: 14, color: '#e8f4ff', drift: 30 }); });
  seaFront(g, t, cam, s0, { dy: 160 });
  FX.rain(g, t, { count: 340, a: 0.4, angle: 0.3 });
} });

// s12 — "los marineros pensaron que iban a morir."
registerShot('s12', { draw(g, t, info) {
  const cam = { z: 1.0 + 0.05 * t, y: 60 }, m = at(info, 18.84);
  deck(g, t, info, cam, (g) => {
    const crew = [[-210, CREW, 'scared', 7], [-30, SAILOR, 'scared', 0], [170, CREW, 'shocked', 3]];
    crew.forEach(([x, o, ex, sd], i) => drawFigure(g, { x, y: -60, s: 1.15, facing: i === 2 ? -1 : 1, outfit: o, pose: breathe(posesAt(t, [[0, POSES.stand], [m + i * 0.12, POSES.handsOnHead]], 0.25), t * 3, 1.5, sd), expr: t > m ? ex : 'worried', rim: { color: STORM_RIM, dir: [0, -1] }, shadow: false, blink: blink(t + i) }));
  }, { flash: flashAt(t, at(info, 20.4)) * 0.6, s: 1.3 });
} });

// s13 — "Jonás sabía"  sad face in the rain
registerShot('s13', { draw(g, t, info) {
  blurLayer(g, 12, (g) => sea(g, t, { z: 1.4, y: -100 }, { storm: 1, horizon: 0.55 }));
  veil(g, '#060a18', 0.35);
  const r = V(300, 330) * (1 + 0.04 * t);
  bigJonas(g, E.W / 2, E.H * 0.5, r, { expr: 'sad', look: [0, 0.3], rimColor: STORM_RIM, rimSide: -1, blink: blink(t, 2.4) });
  FX.rain(g, t, { count: 260, a: 0.32, angle: 0.18 });
} });

// s14 — "que era por su culpa,"  head down; the sailor points at him
registerShot('s14', { draw(g, t, info) {
  const cam = { z: 1.15 + 0.05 * t, x: -40, y: 60 }, c = at(info, 23.56);
  deck(g, t, info, cam, (g) => {
    jonas(g, { x: 150, y: -60, s: 1.2, facing: -1, pose: breathe(POSES.sad, t), expr: 'sad', rim: { color: STORM_RIM, dir: [0, -1] }, shadow: false, blink: blink(t) });
    drawFigure(g, { x: -150, y: -60, s: 1.2, facing: 1, outfit: SAILOR, pose: posesAt(t, [[0, POSES.stand], [c - 0.2, POSES.point]], 0.25), expr: t > c ? 'angry' : 'worried', rim: { color: STORM_RIM, dir: [0, -1] }, shadow: false });
    drawFigure(g, { x: -290, y: -60, s: 1.1, facing: 1, outfit: CREW, pose: POSES.crossArms, expr: 'angry', rim: { color: STORM_RIM, dir: [0, -1] }, shadow: false });
  });
} });

// s15 — "así que les pidió"  determined, points at the sea
registerShot('s15', { draw(g, t, info) {
  const cam = { z: 1.35 + 0.06 * t, x: 60, y: 120 };
  deck(g, t, info, cam, (g) => {
    jonas(g, { x: 60, y: -60, s: 1.3, facing: 1, pose: breathe(posesAt(t, [[0, POSES.stand], [0.4, POSES.point]], 0.3), t), expr: 'determined', rim: { color: STORM_RIM, dir: [0, -1] }, shadow: false, blink: blink(t) });
    drawFigure(g, { x: -200, y: -60, s: 1.2, facing: 1, outfit: SAILOR, pose: POSES.stand, expr: 'shocked', rim: { color: STORM_RIM, dir: [0, -1] }, shadow: false });
  }, { s: 1.35 });
} });

// s16 — "que lo lanzaran al mar."  falls into the waves
registerShot('s16', { draw(g, t, info) {
  const [sx, sy] = t > 0.85 ? shake(t, 14 * (1 - prog(t, 0.85, 1.4)), 8) : [0, 0], cam = { z: 1.05, x: sx, y: sy };
  const s0 = sea(g, t, cam, { storm: 1, horizon: 0.4 });
  layer(g, cam, 1, (g) => boat(g, E.W * 0.32, s0.HY + V(330, 600), 0.9, rock(t), (g) => drawFigure(g, { x: 20, y: -60, s: 1.1, facing: 1, outfit: SAILOR, pose: POSES.reach, expr: 'shocked', rim: { color: STORM_RIM, dir: [0, -1] }, shadow: false })));
  const k = prog(t, 0.05, 0.85), jx = lerp(E.W * 0.5, E.W * 0.68, k), jy = lerp(s0.HY + V(200, 380), s0.HY + V(520, 900), k) - 260 * k * (1 - k) * 2;
  if (t < 0.9) layer(g, cam, 1, (g) => jonas(g, { x: jx, y: jy, s: 1.0, facing: 1, pose: POSES.fall, rot: k * 2.4, expr: 'scared', rim: { color: STORM_RIM, dir: [0, -1] }, shadow: false }));
  seaFront(g, t, cam, s0);
  if (t > 0.85) { const u = t - 0.85; for (let i = 0; i < 26; i++) { const a = -Math.PI * (0.1 + 0.8 * ((i * 37) % 26) / 26), sp = 300 + (i * 53) % 400; const x = E.W * 0.68 + Math.cos(a) * sp * u, y = s0.HY + V(520, 900) + Math.sin(a) * sp * u + 900 * u * u; if (u < 0.9) circle(g, x, y, 10 - u * 8, alpha('#e8f4ff', 0.8)); }
    FX.rings(g, E.W * 0.68, s0.HY + V(520, 900), u, { count: 3, r0: 30, r1: 260, color: '#e8f4ff', a: 0.5 }); }
  FX.rain(g, t, { count: 300, a: 0.35, angle: 0.22 });
} });

// s17 — "Y en ese momento,"  sinking slowly
registerShot('s17', { draw(g, t, info) {
  const cam = { z: 1.1 + 0.04 * t };
  under(g, t, cam, { deep: 0.2 + 0.2 * t / info.dur });
  layer(g, cam, 1, (g) => jonas(g, { x: E.W * 0.5 + Math.sin(t * 1.4) * 20, y: lerp(E.H * 0.42, E.H * 0.62, t / info.dur), s: 1.6, facing: 1, pose: breathe(POSES.fall, t * 0.6), rot: 0.4 + Math.sin(t) * 0.1, expr: 'scared', look: [0, -1], rim: { color: '#9fdcff', dir: [0, -1] }, shadow: false }));
  for (let i = 0; i < 8; i++) { const u = ((t * 0.8 + i * 0.13) % 1); circle(g, E.W * 0.52 + Math.sin(i * 3 + t * 3) * 30, lerp(E.H * 0.42, E.H * 0.05, u) - i * 10, 6 + (i % 3) * 4, alpha('#cdf3ff', 0.6 * (1 - u))); }
} });

// s18 — "un gran pez se lo tragó."  the fish rises and closes its mouth at "tragó"
registerShot('s18', { draw(g, t, info) {
  const gulp = at(info, 29.76), [sx, sy] = t > gulp ? shake(t, 20 * (1 - prog(t, gulp, gulp + 0.7)), 9) : [0, 0], cam = { z: 1.0, x: sx, y: sy };
  under(g, t, cam, { deep: 0.45 });
  const a = ease.inOut(prog(t, 0, gulp)), s = V(1.25, 1.35), J = [E.W * 0.6, E.H * 0.42];
  const fx = lerp(-E.W * 0.6, J[0] - 400 * s, a), fy = lerp(E.H * 1.1, J[1] - 60 * s, a);
  const open = Math.min(ease.out(prog(t, 0, 0.6)), 1 - ease.in(prog(t, gulp - 0.05, gulp + 0.12)));
  layer(g, cam, 1, (g) => {
    if (t < gulp + 0.05) jonas(g, { x: J[0], y: J[1] + 120, s: 0.9, facing: -1, pose: POSES.fall, rot: 0.5, expr: 'shocked', rim: { color: '#9fdcff', dir: [0, -1] }, shadow: false });
    g.save(); g.translate(fx, fy); g.rotate(-0.35 * (1 - a)); fish(g, 0, 0, s, { t, open, rim: '#9fdcff' }); g.restore();
  });
  if (t > gulp) veil(g, '#000', 0.5 * prog(t, gulp + 0.3, info.dur));
} });

// s19 — "Allí, en la oscuridad,"  tiny Jonás lying in the dark belly
registerShot('s19', { draw(g, t, info) {
  const cam = { z: 1.0 + 0.1 * ease.inOut(t / info.dur), y: 100 };
  const { GY } = belly(g, t, cam);
  veil(g, '#000', 0.35);
  layer(g, cam, 1, (g) => jonas(g, { x: E.W * 0.5, y: GY + 20, s: 1.0, facing: 1, pose: POSES.lie, rot: -Math.PI / 2, expr: 'sad', rim: { color: '#ff9a6a', dir: [0, -1] }, shadow: false }));
  glow(g, E.W * 0.5, GY - 40, 260, '#ff7a4a', 0.15);
  FX.dust(g, t, { count: 30, color: '#ff9a7a', a: 0.3 });
} });

// s20 — "Jonás oró…"  kneels and prays
const PRAY = { ...POSES.kneel, head: [14, -160], eF: [26, -118], hF: [32, -150], eB: [20, -120], hB: [30, -148] };
registerShot('s20', { draw(g, t, info) {
  const cam = { z: 1.35 + 0.08 * ease.inOut(t / info.dur), y: 120 };
  const { GY } = belly(g, t, cam, { lit: 0.15 });
  layer(g, cam, 1, (g) => { FX.pool(g, E.W * 0.48, GY + 10, 200, 30, '#ffb070', 0.3); jonas(g, { x: E.W * 0.48, y: GY, s: 1.6, facing: 1, pose: breathe(PRAY, t, 0.6), expr: 'sleepy', rim: { color: '#ffb070', dir: [0, -1] }, shadow: false }); });
  FX.dust(g, t, { count: 40, color: '#ffc08a', a: 0.35 });
} });

// s21 — "y Dios lo escuchó."  the golden beam; awe
registerShot('s21', { draw(g, t, info) {
  const d = at(info, 34.0), k = ease.out(prog(t, d - 0.1, d + 0.5));
  blurLayer(g, 12, (g) => belly(g, t, { z: 1.4, y: -100 }, { lit: k }));
  veil(g, '#12040a', 0.3);
  FX.godRays(g, E.W * 0.5, -200, { angle: Math.PI / 2, spread: 0.5, len: E.H * 1.3, color: '#ffe2a0', a: 0.22 * k, t, count: 9 });
  glow(g, E.W / 2, E.H * 0.45, 800, '#ffd36e', 0.25 * k);
  const r = V(300, 330) * (1 + 0.04 * t);
  bigJonas(g, E.W / 2, E.H * 0.52, r, { expr: k > 0.3 ? 'awe' : 'sad', look: [0, -0.8], rimColor: '#ffe2a0', rimSide: -1, tilt: -0.05 * k });
  for (let i = 0; i < 16; i++) FX.sparkle(g, E.W * (0.15 + ((i * 37) % 70) / 100), E.H * 0.1 + ((t * 120 + i * 97) % (E.H * 0.6)), 10 + (i % 3) * 6, '#fff3c0', 0.7 * k);
} });

// s22 — "Al tercer día,"  sunrise, DÍA 3, the fish in the shallows
registerShot('s22', { draw(g, t, info) {
  const cam = { z: 1.0 + 0.05 * t };
  const { HY, M } = coast(g, t, cam, { rays: 0.6, sunX: 0.6 });
  layer(g, cam, 0.45, (g) => fish(g, E.W * 0.35, HY + 70, 0.3, { t, rim: M.rim, body: '#2a3b52', belly: '#7a8fa0' }));
  const k = ease.outBack(prog(t, 0.3, 0.7));
  if (k > 0) { g.save(); g.translate(E.W / 2, E.H * 0.24); g.scale(k, k); text(g, 'DÍA 3', 0, 0, { size: 140, color: S().ui.gold, glow: 40, glowColor: 'rgba(255,160,60,.8)', spacing: 8 }); g.restore(); }
  FX.dust(g, t, { count: 40, color: '#ffe8c0', a: 0.4 });
} });

// s23 — "el pez lo dejó en tierra firme."  Jonás tumbles out onto the sand
registerShot('s23', { draw(g, t, info) {
  const cam = { z: 1.15, x: -30 + 20 * t, y: 40 };
  const { GY, M } = coast(g, t, cam, { palms: false, sunX: 0.75 });
  const o = at(info, 37.38), fs = 0.62, fx = E.W * 0.12, fy = GY - 40, open = Math.min(ease.out(prog(t, o - 0.5, o - 0.05)), 1 - ease.inOut(prog(t, o + 0.6, o + 1.0)));
  const [mx, my] = [fx + 400 * fs, fy + 60 * fs], k = clamp((t - o) / 0.6), land = [E.W * 0.68, GY + 60];
  layer(g, cam, 1, (g) => {
    fish(g, fx, fy, fs, { t, open, rim: M.rim, body: '#2a3b52', belly: '#7a8fa0' });
    if (t > o) jonas(g, { x: lerp(mx, land[0], k), y: lerp(my, land[1], k) - 260 * k * (1 - k) * 2, s: 1.3, facing: 1, pose: posesAt(t, [[0, POSES.fall], [o + 0.55, POSES.kneel], [o + 1.0, POSES.cheer]], 0.3), rot: (1 - k) * -2.2, expr: k < 1 ? 'shocked' : 'joy', rim: { color: M.rim, dir: [0.6, -0.8] }, shadow: k >= 1 });
  });
  if (t > o + 0.55) FX.rings(g, land[0], land[1], t - o - 0.55, { count: 2, r0: 20, r1: 200, color: '#fff3dc', a: 0.4 });
  // waves at the shore, over the fish's belly
  layer(g, cam, 1.05, (g) => { const wy = (x) => GY + 10 + Math.sin(x / 50 + t * 2) * 10 + (x / E.W) * 170; g.fillStyle = alpha(shade(M.sky[0], -0.35), 0.9); g.beginPath(); g.moveTo(-E.W, E.H * 2); for (let x = -E.W; x <= E.W * 2; x += 20) g.lineTo(x, wy(x)); g.lineTo(E.W * 2, E.H * 2); g.closePath(); g.fill();
    g.strokeStyle = alpha('#fff4e0', 0.55); g.lineWidth = 5; g.beginPath(); for (let x = -E.W; x <= E.W * 2; x += 20) g.lineTo(x, wy(x)); g.stroke(); });
} });

// s24 — "Porque puedes huir de Dios…"  running away; a warm light follows him
registerShot('s24', { draw(g, t, info) {
  const cam = { z: 1.2, x: -300 * t };
  const { GY, M } = coast(g, t, cam, { mood: 'dusk' });
  const x = E.W * 0.55 - 330 * t;
  layer(g, cam, 1, (g) => {
    glow(g, x + 240, GY - 220, 360, '#ffd36e', 0.35 + 0.1 * Math.sin(t * 3));
    for (let i = 0; i < 10; i++) FX.sparkle(g, x + 200 + Math.sin(t * 2 + i) * 80, GY - 360 + i * 30, 8, '#fff3c0', 0.6);
    jonas(g, { x, y: GY + 40, s: 1.45, facing: -1, pose: walkPose(t * 2 * Math.PI * 1.6, { run: true }), expr: 'worried', rim: { color: '#ffd36e', dir: [1, -0.3] } });
  });
} });

// s25 — "pero Dios nunca huye de ti."  he stops; the light embraces him
registerShot('s25', { draw(g, t, info) {
  const n = at(info, 41.44), k = ease.out(prog(t, n - 0.2, n + 0.5));
  const cam = { z: 1.3 + 0.12 * ease.inOut(t / info.dur), y: 60 };
  const { GY, M } = coast(g, t, cam, { rays: 0.4 + k, sunX: 0.5, cityGlow: k });
  FX.godRays(g, E.W * 0.5, -200, { angle: Math.PI / 2, spread: 0.6, len: E.H * 1.3, color: '#ffe2a0', a: 0.2 * k, t, count: 9 });
  layer(g, cam, 1, (g) => { glow(g, E.W * 0.5, GY - 200, 500, '#ffd36e', 0.2 + 0.35 * k);
    jonas(g, { x: E.W * 0.5, y: GY + 20, s: 1.7, facing: 1, pose: breathe(posesAt(t, [[0, POSES.sad], [n - 0.1, POSES.cheer]], 0.4), t), expr: t > n ? 'joy' : 'sad', rim: { color: '#ffe2a0', dir: [0, -1] }, blink: blink(t) }); });
  for (let i = 0; i < 14; i++) FX.sparkle(g, E.W * (0.2 + ((i * 41) % 60) / 100), E.H * 0.15 + ((t * 90 + i * 113) % (E.H * 0.5)), 12, '#fff3c0', 0.7 * k);
} });

// s26 — "Sígueme para la próxima historia."  end screen
registerShot('s26', { draw(g, t, info) {
  const ui = S().ui;
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#1b1426', '#3a2030', '#6a3a2a']); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
  glow(g, E.W / 2, E.H * 0.88, E.W * 0.7, '#ff9a5a', 0.3); FX.dust(g, t, { count: 40, color: '#ffe0b0', a: 0.4 });
  const a1 = ease.out(prog(t, 0.1, 0.6));
  text(g, 'Cerca de ti', E.W / 2, E.H * 0.2, { size: 92, font: FONTS.serif, weight: 900, italic: true, color: ui.cream, alpha: a1, glow: 20, glowColor: 'rgba(255,170,90,.6)' });
  text(g, 'PRÓXIMA HISTORIA: DAVID Y GOLIAT', E.W / 2, E.H * 0.28, { size: 38, color: ui.gold, alpha: ease.out(prog(t, 0.4, 0.9)), spacing: 2, font: FONTS.ui, weight: 900 });
  const sp = ease.outBack(prog(t, 0.6, 1.0)); g.save(); g.translate(E.W / 2, E.H * 0.38); g.scale(sp * 1.4, sp * 1.4);
  rr(g, -160, -40, 320, 80, 40); g.fillStyle = '#e0302a'; g.fill(); text(g, 'SÍGUEME', 0, 2, { size: 40, color: '#fff', font: FONTS.ui, weight: 900, spacing: 2 }); g.restore();
  const y0 = E.H * 0.7;
  const kk = (i) => ease.out(prog(t, 0.3 + i * 0.12, 0.8 + i * 0.12));
  jonas(g, { x: E.W * 0.38, y: y0 + (1 - kk(0)) * 40, s: 1.4, facing: 1, pose: breathe(POSES.wave, t), expr: 'happy', alpha: kk(0), rim: { color: '#ffb070', dir: [0, 1] }, blink: blink(t) });
  drawFigure(g, { x: E.W * 0.62, y: y0 + (1 - kk(1)) * 40, s: 1.4, facing: -1, outfit: SAILOR, pose: breathe(POSES.relaxed, t, 1, 3), expr: 'smile', alpha: kk(1), rim: { color: '#ffb070', dir: [0, 1] } });
} });
