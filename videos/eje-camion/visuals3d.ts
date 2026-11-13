// Scenes of "¿Por qué algunos camiones van con ruedas que no tocan el suelo?": each one only assembles the world (world3d.ts).
// Times are absolute video seconds; every scene adds the word captions.

const ecU = (w: World, t: number) => p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0));
const ecGrow = (t: number, k: number) => p3Ramp(t, k, k + 0.5);
const ecPop = (t: number, k: number) => Math.max(0.001, p3Spring(t, k, 230, 15));
// the truck drives along +x at v m/s from x0 (its front)
const ecDrive = (w: World, t: number, x0: number, v = 3) => { const d = (t - w.s.t0) * v; return { x: x0 + d, d }; };
// cameras: three-quarter from ahead (the whole truck), side-on low at the trailer, the lifted axle up close
const ecThreeQ = (w: World, x: number, u: number) => w.look([x + 13 - u * 2, 7.5, EC_LANE + 27], [x - 8, 1.6, EC_LANE], 36);
const ecSide = (w: World, x: number, cx = -11, d = 21) => w.look([x + cx + 1, 3.2, EC_LANE + d], [x + cx, 1.6, EC_LANE], 36);
const ecLiftCam = (w: World, x: number, u: number) => w.look([x - 14 + 4.5 - u, 1.6, EC_LANE + 8.5], [x - 14.4, 0.9, EC_LANE], 34);
// the lens stays on the right, between the title and the captions; liftView looks under the lifted axle
const ecLens = (w: World) => dioLens(w, { x: 0.36, y: 0.2, r: 0.14 });
const ecLiftView = (x: number): [Vec3, Vec3] => [[x - 14 + 1.6, 0.45, EC_LANE + 3.4], [x - 14, 0.55, EC_LANE + 1.05]];

defineVisuals({
  // 1. why do some trucks drive with wheels that don't touch the ground?
  hook: {
    bg: EC.sky,
    build(w) { const H = ecHighway(w), lens = ecLens(w);
      return (t) => { const { x, d } = ecDrive(w, t, -2, 4); H.truck.position.x = x; H.truck.pose(t, { dist: d, load: 0, lift: 1 }); H.traffic.pose(t); ecThreeQ(w, x, ecU(w, t));
        lens.pose(...ecLiftView(x), ecPop(t, w.K('lupa')), 32); H.cap(t); }; },
  },
  // 2. on few wheels, a loaded truck would wreck the road
  peso: {
    bg: EC.sky,
    build(w) { const H = ecHighway(w), cr = w.add(ecCracks()), wt = w.add(ecWeights([-1.4, -5.2, -15.3]));
      return (t) => { const k = w.K('rompe'); H.truck.position.x = 2; H.truck.pose(t, { load: 1 }); H.traffic.pose(t); cr.position.x = 2 - 8; cr.pose(p3Ramp(t, k - 0.2, k + 0.6));
        wt.position.x = 2; wt.pose(p3Ramp(t, w.s.t0 + 0.4, w.s.t0 + 1), 1.5 + 0.15 * Math.sin(t * 8) * (t > k ? 1 : 0)); ecSide(w, 2, -7, 26); H.cap(t); }; },
  },
  // 3. so the law limits the weight on each axle
  ley: {
    bg: EC.sky,
    build(w) { const H = ecHighway(w), wt = w.add(ecWeights([-1.4, -4.6, -5.9, -14.0, -15.3, -16.6]));
      return (t) => { H.truck.position.x = 2; H.truck.pose(t, { load: 1 }); H.traffic.pose(t); wt.position.x = 2; wt.pose(ecGrow(t, w.K('limita')), 1); w.look([-6, 5, EC_LANE + 30], [-6.5, 1.8, EC_LANE], 36); H.cap(t); }; },
  },
  // 4. so you add axles to spread the load: smaller arrows, no cracks
  ejes: {
    bg: EC.sky,
    build(w) { const H = ecHighway(w), wt = w.add(ecWeights([-1.4, -4.6, -5.9, -14.0, -15.3, -16.6]));
      return (t) => { const { x, d } = ecDrive(w, t, 0, 1.5); H.truck.position.x = x; H.truck.pose(t, { dist: d, load: 1 }); H.traffic.pose(t); wt.position.x = x; wt.pose(1, p3Lerp(1.1, 0.6, ecGrow(t, w.K('ejes'))));
        ecThreeQ(w, x, ecU(w, t)); H.cap(t); }; },
  },
  // 5. but when the truck is empty...
  vacio: {
    bg: EC.sky,
    build(w) { const H = ecHighway(w);
      return (t) => { const { x, d } = ecDrive(w, t, -4, 4); H.truck.position.x = x; H.truck.pose(t, { dist: d, load: 1 - ecGrow(t, w.K('vacio')), lift: 0 }); H.traffic.pose(t); ecSide(w, x, -9, 24); H.cap(t); }; },
  },
  // 6. those extra wheels wear, rub the asphalt and burn more fuel
  gastan: {
    bg: EC.sky,
    build(w) { const H = ecHighway(w), dust = w.add(ecDust()), lens = ecLens(w);
      return (t) => { const { x, d } = ecDrive(w, t, 0, 4), on = ecGrow(t, w.K('gastan')); H.truck.position.x = x; H.truck.pose(t, { dist: d, load: 0, lift: 0 }); H.traffic.pose(t);
        dust.position.set(x - 14.0, 0.15, EC_LANE + 1.2); dust.pose(t, on); ecLiftCam(w, x, ecU(w, t)); lens.pose([x - 14 + 1.2, 0.3, EC_LANE + 2.6], [x - 14, 0.25, EC_LANE + 1.05], ecPop(t, w.K('gastan')), 30); H.cap(t); }; },
  },
  // 7. air bags lift the axle when it's not needed, and lower it when the truck is loaded
  cojines: {
    bg: EC.sky,
    build(w) { const H = ecHighway(w);
      return (t) => { const { x, d } = ecDrive(w, t, 2, 2), ks = w.K('suben'), kb = w.K('bajan'), lift = ecGrow(t, ks) * (1 - ecGrow(t, kb + 0.6));
        H.truck.position.x = x; H.truck.pose(t, { dist: d, load: ecGrow(t, kb), lift }); H.traffic.pose(t); ecLiftCam(w, x, ecU(w, t)); H.cap(t); }; },
  },
  // 8. that's the lift axle: a glowing ring on it
  nombre: {
    bg: EC.sky,
    build(w) { const H = ecHighway(w);
      return (t) => { const { x, d } = ecDrive(w, t, 0, 3); H.truck.position.x = x; H.truck.pose(t, { dist: d, load: 0, lift: 1, glow: ecPop(t, w.K('nombre')) * (t >= w.K('nombre') ? 1 : 0) }); H.traffic.pose(t);
        w.look([x - 6, 3.5, EC_LANE + 15], [x - 13, 1.3, EC_LANE], 36); H.cap(t); }; },
  },
  // 9. on many motorways the toll is charged per axle on the ground: the loaded truck counts 6
  peaje: {
    bg: EC.sky,
    build(w) { const H = ecHighway(w), toll = w.add(ecToll()); toll.position.x = 4;
      return (t) => { const { x, d } = ecDrive(w, t, -2, 6.5); H.truck.position.x = x; H.truck.pose(t, { dist: d, load: 1 }); H.traffic.pose(t);
        toll.pose(t, H.truck.axles.filter((a) => x + a.x > 4).length); w.look([14, 5, EC_LANE + 24], [2, 3, EC_LANE], 36); H.cap(t); }; },
  },
  // 10. wheel up, cheaper toll: the empty truck counts 5
  barato: {
    bg: EC.sky,
    build(w) { const H = ecHighway(w), toll = w.add(ecToll()); toll.position.x = 4;
      return (t) => { const { x, d } = ecDrive(w, t, 2, 7); H.truck.position.x = x; H.truck.pose(t, { dist: d, load: 0, lift: 1 }); H.traffic.pose(t);
        const n = H.truck.axles.filter((a) => !a.lift && x + a.x > 4).length; toll.pose(t, n, n === 5); w.look([17, 3.5, EC_LANE + 17], [3, 3.6, EC_LANE + 1], 36); H.cap(t); }; },   // from ahead: the screen faces +x
  },
  // 11. they go up and down depending on the load: the truck drives away
  cierre: {
    bg: EC.sky,
    build(w) { const H = ecHighway(w);
      return (t) => { const { x, d } = ecDrive(w, t, -6, 4), lift = ecGrow(t, w.K('suben')) * (1 - ecGrow(t, w.K('bajan'))); H.truck.position.x = x; H.truck.pose(t, { dist: d, load: 0, lift: Math.max(lift, t < w.K('suben') ? 1 : 0) });
        H.traffic.pose(t); const u = ecU(w, t); w.look([x - 20 - u * 6, 12, EC_LANE + 32], [x - 8, 1, EC_LANE], 36); H.cap(t); }; },
  },
});
