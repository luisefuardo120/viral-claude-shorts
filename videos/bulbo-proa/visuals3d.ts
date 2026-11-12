// Scenes of "¿Por qué los barcos tienen una bola bajo la proa?": each one only assembles the world (world3d.ts).
// Times are absolute video seconds; every scene adds the word captions.

const bpU = (w: World, t: number) => p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0));
const bpGrow = (t: number, k: number) => p3Ramp(t, k, k + 0.5);
const bpPop = (t: number, k: number) => Math.max(0.001, p3Spring(t, k, 230, 15));
// the ship sails slowly along the harbour; x0 where it starts in this scene
const bpSail = (w: World, t: number, x0 = 0, v = 1.2) => x0 + (t - w.s.t0) * v;
// cameras: the whole harbour, the bow up close (the bulb shows through the water), the side cut
const bpWide = (w: World, x: number, u: number) => w.look([x + 44 - u * 4, 24, 62], [x - 2, 1, 2], 36);
const bpBowCam = (w: World, x: number, u: number) => w.look([x + BP_L / 2 + 11 - u, 2.2, 15 - u], [x + BP_L / 2 - 1.5, -0.3, 0], 36);
const bpSideCam = (w: World, x: number) => w.look([x + 12, 2, 62], [x + 12, 1.2, 0], 36);
// the lens stays on the right, between the title and the captions
const bpLens = (w: World) => dioLens(w, { x: 0.36, y: 0.2, r: 0.14 });
// a gauge far below the scene, where only the lens sees it
const bpGaugeSet = (w: World, band: [number, number]) => { const g = w.add(bpGauge(band)); g.position.set(0, -60, 0); return g; };
const BP_GAUGE_VIEW: [Vec3, Vec3] = [[0, -60, 4.4], [0, -60, 0]];
// the side cut: the harbour seen side-on and the curves in front of the hull, at the waterline
const bpCutSet = (w: World) => { const H = bpHarbour(w), c = w.add(bpCurves()); return { ...H, c }; };
const bpCut = (H: ReturnType<typeof bpCutSet>, t: number, x: number, o: { ship: number; bulb: number; sum: number; phase: number }) => {
  H.ship.position.x = x; H.ship.pose(t); H.waves(t, { bow: 0.25, bulb: 0.25, phase: o.phase }); H.c.position.set(x, 0.4, BP_B / 2 + 1.6); H.c.pose(o); H.gulls.pose(t); };

defineVisuals({
  // 1. why do big ships have a giant ball under the bow? the lens looks under the water
  hook: {
    bg: BP.sky,
    build(w) { const H = bpHarbour(w), lens = bpLens(w);
      return (t) => { const x = bpSail(w, t, -2); H.ship.position.x = x; H.ship.pose(t); H.waves(t, { bow: 0.4, bulb: 0.4, phase: 0 }); H.gulls.pose(t); bpWide(w, x, bpU(w, t));
        lens.pose([x + BP_L / 2 + 5, -0.6, 5], [x + BP_L / 2 - 0.5, -0.8, 0], bpPop(t, w.K('lupa')), 32); H.cap(t); }; },
  },
  // 2. a ship pushes the water and raises a huge wave in front of it
  ola: {
    bg: BP.sky,
    build(w) { const H = bpHarbour(w);
      return (t) => { const x = bpSail(w, t, 4); H.ship.position.x = x; H.ship.pose(t, { bulb: 0 }); H.waves(t, { bow: 0.15 + 0.85 * bpGrow(t, w.K('ola')), bulb: 0, phase: 0 }); H.gulls.pose(t); bpBowCam(w, x, bpU(w, t)); H.cap(t); }; },
  },
  // 3. raising that wave burns a lot of fuel: thick smoke, the gauge drops
  combustible: {
    bg: BP.sky,
    build(w) { const H = bpHarbour(w), gauge = bpGaugeSet(w, [0.7, 1]), lens = bpLens(w);
      return (t) => { const x = bpSail(w, t, 8), k = w.K('gasta'); H.ship.position.x = x; H.ship.pose(t, { bulb: 0, smoke: 0.6 + 0.9 * bpGrow(t, k - 0.5) }); H.waves(t, { bow: 1, bulb: 0, phase: 0 }); H.gulls.pose(t);
        gauge.pose(p3Lerp(0.85, 0.2, p3Ramp(t, k, k + 1.4))); w.look([x - 12, 14, 30], [x - 12, 7, 0], 36); lens.pose(...BP_GAUGE_VIEW, bpPop(t, k - 0.4)); H.cap(t); }; },
  },
  // 4. but you can't remove the wave: while the ship moves, it makes it
  pero: {
    bg: BP.sky,
    build(w) { const H = bpHarbour(w);
      return (t) => { const x = bpSail(w, t, 6, 2); H.ship.position.x = x; H.ship.pose(t, { bulb: 0 }); H.waves(t, { bow: 1, bulb: 0, phase: 0 }); H.gulls.pose(t);
        w.look([x + 30, 9, 30], [x + 10, 0, 0], 36); H.cap(t); }; },
  },
  // 5. so you put this ball in front, under the water
  bola: {
    bg: BP.sky,
    build(w) { const H = bpHarbour(w);
      return (t) => { const x = bpSail(w, t, 10), b = bpPop(t, w.K('bulbo')); H.ship.position.x = x; H.ship.pose(t, { bulb: t >= w.K('bulbo') ? b : 0 }); H.waves(t, { bow: 1, bulb: 0, phase: 0 }); H.gulls.pose(t);
        bpBowCam(w, x, bpU(w, t)); H.cap(t); }; },
  },
  // 6. it raises its own wave, out of phase: red (the ship's), then lime (the bulb's, upside down)
  desfase: {
    bg: BP.sky,
    build(w) { const H = bpCutSet(w);
      return (t) => { const x = bpSail(w, t, 2, 0.6); bpCut(H, t, x, { ship: 1, bulb: bpGrow(t, w.K('bulbola')), sum: 0, phase: 0 }); bpSideCam(w, x); H.cap(t); }; },
  },
  // 7. where the ship's wave rises, the bulb's sinks, and they cancel: the sum is flat
  anulan: {
    bg: BP.sky,
    build(w) { const H = bpCutSet(w);
      return (t) => { const x = bpSail(w, t, 4, 0.6), s = bpGrow(t, w.K('suma')), pr = 1 + 0.25 * Math.max(0, Math.sin((t - w.K('sube')) * 6)) * (t > w.K('sube') && t < w.K('baja') ? 1 : 0);
        bpCut(H, t, x, { ship: (1 - 0.6 * s) * pr, bulb: 1 - 0.6 * s, sum: s, phase: 0 }); bpSideCam(w, x); H.cap(t); }; },
  },
  // 8. that's the bulbous bow: 5–15 % less fuel; the bow and its glowing bulb on a calm sea
  nombre: {
    bg: BP.sky,
    build(w) { const H = bpHarbour(w), glow = dioSmooth(BP.key, 0.35); glow.emissive.set(BP.key); glow.emissiveIntensity = 0.4; const bulbMat = H.ship.bulb.material;
      return (t) => { const x = bpSail(w, t, 6); H.ship.position.x = x; H.ship.bulb.material = Math.sin(t * 5) > -0.3 ? glow : bulbMat; H.ship.pose(t); H.waves(t, { bow: 1, bulb: 1, phase: 0 }); H.gulls.pose(t);
        bpBowCam(w, x, bpU(w, t)); H.cap(t); }; },
  },
  // 9. but there's a catch: the two waves only fit at one speed; the gauge sits in its green band
  truco: {
    bg: BP.sky,
    build(w) { const H = bpCutSet(w), gauge = bpGaugeSet(w, [0.45, 0.6]), lens = bpLens(w);
      return (t) => { const x = bpSail(w, t, 6, 0.6); bpCut(H, t, x, { ship: 0.4, bulb: 0.4, sum: 1, phase: 0 }); gauge.pose(0.53 + 0.01 * Math.sin(t * 3)); bpSideCam(w, x);
        lens.pose(...BP_GAUGE_VIEW, bpPop(t, w.K('encajan'))); H.cap(t); }; },
  },
  // 10. if the ship goes slower the waves slide apart: the bulb no longer helps, it even brakes
  despacio: {
    bg: BP.sky,
    build(w) { const H = bpCutSet(w), gauge = bpGaugeSet(w, [0.45, 0.6]), lens = bpLens(w), red = dioSmooth(BP.red, 0.4); let white: THREE.Material | null = null;
      return (t) => { const x = bpSail(w, t, 8, 0.4), slow = p3Ramp(t, w.K('lento'), w.K('lento') + 1.2), sum = H.c.children[2] as THREE.Mesh; white ??= sum.material as THREE.Material;
        bpCut(H, t, x, { ship: 0.4, bulb: 0.4, sum: 1, phase: 3.2 * slow }); sum.material = t > w.K('frena') ? red : white; gauge.pose(p3Lerp(0.53, 0.22, slow)); bpSideCam(w, x);
        lens.pose(...BP_GAUGE_VIEW, 1); H.cap(t); }; },
  },
  // 11. so some shipping lines, sailing slower to save fuel, changed their ships' noses
  nariz: {
    bg: BP.sky,
    build(w) { const H = bpHarbour(w);
      return (t) => { const x = bpSail(w, t, 10, 0.8), k = w.K('cambio'), u = bpGrow(t, k); H.ship.position.x = x; H.ship.pose(t, { bulb: t < k ? 1 : 0.15 + 0.85 * bpPop(t, k + 0.1), bulbScale: p3Lerp(1, 0.65, u) });
        H.waves(t, { bow: 1, bulb: 1, phase: 1 - u }); H.gulls.pose(t); bpBowCam(w, x, bpU(w, t)); H.cap(t); }; },
  },
  // 12. a wave made on purpose to erase another: the ship sails away on a calm sea
  cierre: {
    bg: BP.sky,
    build(w) { const H = bpHarbour(w), sun = w.add(dioSun()); sun.position.set(-30, 26, -70);
      return (t) => { const x = bpSail(w, t, 4, 2); H.ship.position.x = x; H.ship.pose(t); H.waves(t, { bow: 1, bulb: 1, phase: 0 }); H.gulls.pose(t); bpWide(w, x - 6, bpU(w, t)); H.cap(t); }; },
  },
});
