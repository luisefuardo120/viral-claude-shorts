// Scenes of "Esos puntitos negros del borde de tu parabrisas NO están de adorno": each one only assembles the world (world3d.ts).
// Times are absolute video seconds; every scene adds the word captions and moves its camera.

const ppU = (w: World, t: number) => p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0));
const ppGrow = (t: number, k: number) => p3Ramp(t, k, k + 0.5);
const ppPop = (t: number, k: number) => Math.max(0.001, p3Spring(t, k, 230, 15));
// UV targets: points along the glue bead, under the top edge of the glass
const ppGlueSpots = (car: ReturnType<typeof ppCar>) => [-0.9, -0.45, 0, 0.45, 0.9].map((u) => ppOn(car, u, 0.97, -0.03));
// a wide street shot, three-quarter from the front, drifting
const ppWide = (w: World, u: number, d = 7) => w.look([4.2 + u * 0.8, 3.0 + u * 0.4, 1.8 + d - u * 0.8], [0.2, 1.1, 1.8], 38);

defineVisuals({
  // 1. those little black dots on your windshield's edge are NOT for decoration
  hook: {
    bg: PP.sky,
    build(w) { const { car, cap } = ppStreet(w), hand = w.add(ppHand());
      return (t) => { const u = ppU(w, t), k = w.K('toca'); car.pose({}); hand.pose(ppOn(car, -0.62, -0.78, 0.01), ppOn(car, -0.4, -1.4, 0.8), t > k ? Math.abs(Math.sin((t - k) * 6)) : 0);
        hand.scale.setScalar(ppPop(t, k - 0.25)); ppGlassCam(w, car, -0.35, -0.35, 2.7 - u * 0.9, 38); cap(t); }; },
  },
  // 2. the windshield isn't bolted on: it's glued all around
  pegado: {
    bg: PP.sky,
    build(w) { const { car, cap } = ppStreet(w), lab = w.add(dioLabel('PEGAMENTO', PP.glue));
      return (t) => { const u = ppU(w, t), k = w.K('levanta'); car.pose({ lift: 0.4 * ppGrow(t, k), dots: 1 }); lab.position.copy(ppOn(car, 0.05, -0.75, 0.3)); lab.pose(ppPop(t, w.K('pega')) * (t >= w.K('pega') ? 1 : 0));
        const a = p3Lerp(0.2, -0.25, u); w.look([0.62 + Math.cos(a) * 4.4, 3.4, 1.8 + Math.sin(a) * 4.4], [0.4, 1.35, 1.8], 38); cap(t); }; },
  },
  // 3. but the glue has an enemy: the sun
  sol: {
    bg: PP.sky,
    build(w) { const { car, sun, cap } = ppStreet(w), rays = w.add(ppRays());
      return (t) => { const u = ppU(w, t), k = w.K('sol'); car.pose({ lift: 0.4, band: 0, dots: 0 }); sun.scale.setScalar(0.55 * (1 + 0.6 * ppGrow(t, k - 0.4))); rays.pose(t, sun.position, ppGlueSpots(car), ppGrow(t, k));
        w.look([5.2 - u, 3.4, 9.5], [1.6, 2.0, 0.4], 38); cap(t); }; },
  },
  // 4. the UV rots it, and a loose windshield is dangerous
  pudre: {
    bg: PP.sky,
    build(w) { const { car, sun, cap } = ppStreet(w), rays = w.add(ppRays());
      return (t) => { const u = ppU(w, t), kd = w.K('despega'); car.pose({ lift: 0.4 + 0.25 * ppGrow(t, kd), tilt: -0.35 * ppGrow(t, kd), rot: p3Ramp(t, w.K('pudre') - 0.6, w.K('pudre') + 0.4), band: 0, dots: 0 });
        rays.pose(t, sun.position, ppGlueSpots(car), 1); ppGlassCam(w, car, 0.1, -0.1, 3.8 - u * 0.6, 40); cap(t); }; },
  },
  // 5. so they paint a black ceramic band, baked into the glass
  banda: {
    bg: PP.sky,
    build(w) { const { car, cap } = ppStreet(w), lab = w.add(dioLabel('BANDA DE CERÁMICA', '#ffffff'));
      return (t) => { const u = ppU(w, t), k = w.K('banda'); car.pose({ band: ppGrow(t, k), dots: 0 }); lab.position.copy(ppOn(car, 0, 0.55, 0.25)); lab.pose(ppPop(t, k + 0.2) * (t >= k ? 1 : 0));
        ppGlassCam(w, car, 0, 0, 4.0 - u * 0.6, 40); cap(t); }; },
  },
  // 6. it covers the glue from the sun, gives it a rough grip and hides it
  protege: {
    bg: PP.sky,
    build(w) { const { car, sun, cap } = ppStreet(w), rays = w.add(ppRays());
      return (t) => { const u = ppU(w, t), kt = w.K('tapa'), kr = w.K('rugosa'), ke = w.K('esconde'); car.pose({ lift: 0.25 * (1 - ppGrow(t, ke)), band: 1, dots: 0, bumps: ppPop(t, kr) * (t >= kr ? 1 : 0) });
        rays.pose(t, sun.position, ppGlueSpots(car), 1, t > kt ? 0.93 : 1); ppGlassCam(w, car, 0.45, 0.45, 2.5 + u * 0.4, 38); cap(t); }; },
  },
  // 7. but black heats up much faster than clear glass: heat view
  calor: {
    bg: PP.sky,
    build(w) { const { car, cap } = ppStreet(w), heat = w.add(ppHeat(60));
      return (t) => { const u = ppU(w, t), h = ppGrow(t, w.K('calor')); car.pose({ band: 1, dots: 0, heat: h }); heat.pose(t, [-0.9, -0.3, 0.3, 0.9].flatMap((x) => [ppOn(car, x, 0.97, 0.01), ppOn(car, x, -0.97, 0.01)]), h);
        const a = p3Lerp(-0.3, 0.3, u); ppGlassCam(w, car, a, 0.1, 3.8, 40); cap(t); }; },
  },
  // 8. and that sudden change of temperature would warp the glass, like a magnifying glass
  lupa: {
    bg: PP.sky,
    build(w) { const { car, cap } = ppStreet(w), lab = w.add(dioLabel('¡DEFORMA!', PP.red, 0.06));
      return (t) => { const u = ppU(w, t), k = w.K('deforma'); car.pose({ band: 1, dots: 0, heat: 1, grid: 1, warp: ppGrow(t, k - 0.4) * (0.8 + 0.2 * Math.sin(t * 5)) }); lab.position.copy(ppOn(car, 0.55, 0.55, 0.3)); lab.pose(ppPop(t, k) * (t >= k ? 1 : 0));
        ppGlassCam(w, car, 0.4, 0.35, 2.7 - u * 0.4, 38); cap(t); }; },
  },
  // 9. so the band doesn't end abruptly: it breaks up into smaller and smaller dots, and the heat steps down
  puntos: {
    bg: PP.sky,
    build(w) { const { car, cap } = ppStreet(w), heat = w.add(ppHeat(40));
      return (t) => { const u = ppU(w, t), kp = w.K('puntos'), kr = w.K('recto'), d = p3Ramp(t, kp, kp + 0.5); car.pose({ band: 1, dots: d, heat: 1, smooth: d, grid: 1, warp: 1 - p3Ramp(t, kp + 0.3, kr) });
        heat.pose(t, [-0.6, 0, 0.6].map((x) => ppOn(car, x, 0.9, 0.01)), 1 - 0.6 * d); ppGlassCam(w, car, 0.4, 0.35, 2.4 + u * 0.4, 38); cap(t); }; },
  },
  // 10. it's called ceramic frit
  nombre: {
    bg: PP.sky,
    build(w) { const { car, cap } = ppStreet(w), lab = w.add(dioLabel('FRITA CERÁMICA', PP.key, 0.055));
      return (t) => { const u = ppU(w, t), k = w.K('nombre'); car.pose({}); lab.position.copy(ppOn(car, -0.35, -0.55, 0.3)); lab.pose(ppPop(t, k)); ppGlassCam(w, car, -0.45, -0.45, 1.7 - u * 0.3, 36); cap(t); }; },
  },
  // 11. so those dots are not for decoration: the street diorama, pulling back
  cierre: {
    bg: PP.sky,
    build(w) { const { car, cap } = ppStreet(w); return (t) => { car.pose({}); ppWide(w, ppU(w, t), 6 + ppU(w, t) * 5); cap(t); }; },
  },
});
