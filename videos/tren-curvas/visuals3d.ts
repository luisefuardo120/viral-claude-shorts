// Scenes of "¿Por qué el tren no se sale en las curvas?": each one only assembles the world (world3d.ts).
// Times are absolute video seconds; every scene adds the word captions.

const TC_FIX: Record<number, string> = { 0: '¿Por qué', 9: 'si no' };   // what Whisper misheard
const tcU = (w: World, t: number) => p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0));
const tcGrow = (t: number, k: number) => p3Ramp(t, k, k + 0.5);
const tcPop = (t: number, k: number) => Math.max(0.001, p3Spring(t, k, 230, 15));
// the diorama with the train; returns the train and the captions
const tcLandSet = (w: World) => {
  dioLights(w); w.add(tcLand()); [[-12, 16, -30, 2], [14, 18, -36, 2.4], [32, 22, -8, 2]].forEach(([x, y, z, s]) => w.add(dioCloud([x, y, z], s)));
  const sun = w.add(dioSun()); sun.position.set(-16, 24, -44);
  return { train: w.add(tcTrain()), cap: dioCaptions(w, TC_FIX) };
};
// a close-up: ground, a piece of track and the wheelset
const tcWheelSet = (w: World) => { const rails = tcCloseSet(w), ws = w.add(tcWheelset()); return { rails, ws, cap: dioCaptions(w, TC_FIX) }; };
const tcThreeQuarter = (w: World, u: number) => w.look([3.6 - u * 0.6, 1.9, 5.6 - u * 0.4], [0, 0.5, 0], 36);
const tcFront = (w: World, u: number, d = 7.5) => w.look([0.3 * u, 1.5, d - u * 0.5], [0, 0.7, 0], 36);

defineVisuals({
  // 1. the hook: the train runs into the curve
  hook: {
    bg: TC.sky,
    build(w) { const { train, cap } = tcLandSet(w); return (t) => { train.pose(12 + (t - w.s.t0) * 7); tcCorner(w, tcU(w, t)); cap(t); }; },
  },
  // 2. two wheels on one axle: both turn together
  eje: {
    bg: TC.sky,
    build(w) { const { rails, ws, cap } = tcWheelSet(w);
      return (t) => { const go = Math.max(0, t - w.K('gira')); ws.pose({ roll: go * 5, taper: 0, flange: 0 }); rails.pose(go * 2.25); tcThreeQuarter(w, tcU(w, t)); cap(t); }; },
  },
  // 3. the outer wheel travels farther: both paths grow round the curve, the outer one longer
  fuera: {
    bg: TC.sky,
    build(w) { dioLights(w); w.add(tcLand()); const tr = w.add(tcTrails()), cap = dioCaptions(w, TC_FIX);
      return (t) => { tr.pose(p3Ramp(t, w.K('huellas'), w.K('huellas') + 1.6)); w.look([15, 46, 13], [15, 0, 0.5], 36); cap(t); }; },
  },
  // 4. if they were cylinders: the inner wheel skids and sparks
  cilindros: {
    bg: TC.sky,
    build(w) { const { rails, ws, cap } = tcWheelSet(w), sp = w.add(tcSparks()); sp.position.set(-TC_GR / 2, TC_TOP, 0.35);
      return (t) => { const lt = t - w.s.t0, skid = p3Ramp(t, w.K('chirria') - 0.2, w.K('chirria') + 0.2);
        ws.pose({ roll: lt * 5, taper: 0, flange: 0, yaw: 0.025 * skid * Math.sin(t * 40) }); rails.pose(lt * 2.25); sp.pose(t, skid); tcFront(w, tcU(w, t)); cap(t); }; },
  },
  // 5. make them cones, wider inside
  cono: {
    bg: TC.sky,
    build(w) { const { rails, ws, cap } = tcWheelSet(w);
      return (t) => { const lt = t - w.s.t0; ws.pose({ roll: lt * 4, taper: tcGrow(t, w.K('cono')), flange: 0 }); rails.pose(lt * 1.8); w.look([2.6, 1.35, 4.6 - tcU(w, t) * 0.6], [0.4, 0.55, 0], 36); cap(t); }; },
  },
  // 6. in the curve the wheelset slides out: big circle outside (lime), small inside (red)
  apoya: {
    bg: TC.sky,
    build(w) { const { rails, ws, cap } = tcWheelSet(w);
      return (t) => { const lt = t - w.s.t0; ws.pose({ roll: lt * 4, taper: 1, flange: 0, shift: 0.075 * tcGrow(t, w.K('fuera')), show: tcPop(t, w.K('grande')), showIn: tcPop(t, w.K('dentro')) }); rails.pose(lt * 1.8); tcFront(w, tcU(w, t), 6.2); cap(t); }; },
  },
  // 7. same turn, more road: the train goes round, both paths grow behind it
  vuelta: {
    bg: TC.sky,
    build(w) { const { train, cap } = tcLandSet(w), tr = w.add(tcTrails());
      return (t) => { const s = 22 + (t - w.s.t0) * 10; train.pose(s); tr.pose((s - TC_S) / (Math.PI * TC_RAD)); w.look([15, 46, 13], [15, 0, 0.5], 36); cap(t); }; },
  },
  // 8. conicity: the train turns on its own
  conicidad: {
    bg: TC.sky,
    build(w) { const { train, cap } = tcLandSet(w);
      return (t) => { train.pose(26 + (t - w.s.t0) * 8); const u = tcU(w, t); w.look([40 - u * 4, 12, 26], [14, 1.5, 0], 36); cap(t); }; },
  },
  // 9. but on the straights the cones make it sway, more and more with speed
  baile: {
    bg: TC.sky,
    build(w) { const { rails, ws, cap } = tcWheelSet(w);
      return (t) => { const lt = t - w.s.t0, A = 0.045 * p3Ramp(t, w.K('baila') - 0.2, w.K('baila') + 0.6) * (1 + 0.9 * p3Ramp(t, w.K('rapido'), w.K('rapido') + 1.2)), ph = t * 5.5;
        ws.pose({ roll: lt * 6, taper: 1, flange: 0, shift: A * Math.sin(ph), yaw: 3 * A * Math.cos(ph) }); rails.pose(lt * 3); w.look([0.6, 3.4, 5.2], [0, 0.4, -0.6], 36); cap(t); }; },
  },
  // 10. a gentle cone and dampers: the sway dies out
  amort: {
    bg: TC.sky,
    build(w) { const { rails, ws, cap } = tcWheelSet(w), dm = w.add(tcDampers());
      return (t) => { const lt = t - w.s.t0, kA = w.K('amort'), damp = t > kA ? Math.exp(-(t - kA) * 1.6) : 1, ph = t * 5.5, A = 0.08 * damp, sh = A * Math.sin(ph);
        ws.pose({ roll: lt * 6, taper: p3Lerp(1, 0.35, tcGrow(t, w.K('poca'))), flange: 0, shift: sh, yaw: 3 * A * Math.cos(ph) }); rails.pose(lt * 3);
        dm.position.x = sh; dm.scale.setScalar(tcPop(t, kA)); dm.visible = t >= kA; w.look([2.2, 2.6, 5.6], [0, 0.5, 0], 36); cap(t); }; },
  },
  // 11. but in a tight curve that's not enough: low view, the train comes fast
  cerrada: {
    bg: TC.sky,
    build(w) { const { train, cap } = tcLandSet(w);
      return (t) => { train.pose(4 + (t - w.s.t0) * 11); w.look([22.5, 2.2, 6], [10, 2.2, 9], 40); cap(t); }; },
  },
  // 12. the flange: a rim on the inside of each wheel, which hits the rail before the wheel leaves it
  pestana: {
    bg: TC.sky,
    build(w) { const { rails, ws, cap } = tcWheelSet(w);
      return (t) => { const lt = t - w.s.t0, k = w.K('choca'), out = p3Clamp((t - (k - 0.9)) / 0.9), hit = t > k ? 0.012 * Math.exp(-(t - k) * 6) * Math.sin((t - k) * 50) : 0;
        ws.pose({ roll: lt * 4, taper: 1, flange: tcGrow(t, w.K('borde')), shift: Math.min(out * out, 1) * 0.085 - hit }); rails.pose(lt * 1.8); tcFront(w, tcU(w, t), 5.6); cap(t); }; },
  },
  // 13. the cant: everything pushes out, so the outer rail goes higher
  peralte: {
    bg: TC.sky,
    build(w) {
      dioLights(w); w.add(dioDiorama({ road: false, props: false, clear: 2.4, w: 30, d: 30 })); dioSkyBack(w);
      // the whole piece turns about the inner rail (x = -gauge/2), so the outer one rises
      const piv = w.add(p3Group()), inner = p3Group(); piv.position.x = -TC_GR / 2; inner.position.x = TC_GR / 2; piv.add(inner);
      const rails = tcRails(), ws = tcWheelset(), body = tcBodySlice(); inner.add(rails, ws, body);
      const ar = w.add(tcPush()), cap = dioCaptions(w, TC_FIX);
      return (t) => { const lt = t - w.s.t0; piv.rotation.z = 0.12 * tcGrow(t, w.K('alto')); ws.pose({ roll: lt * 4, taper: 1, flange: 1 }); rails.pose(lt * 1.8);
        ar.position.set(0.1, 2.35, 0.8); ar.grow(tcGrow(t, w.K('empuja'))); ar.scale.setScalar(1 - 0.35 * tcGrow(t, w.K('alto')));
        w.look([0.4, 2.6, 13 - tcU(w, t) * 0.8], [0.3, 1.7, 0], 36); cap(t); };
    },
  },
  // 14. they're not cylinders, they're cones: the train runs round the oval
  cierre: {
    bg: TC.sky,
    build(w) { const { train, cap } = tcLandSet(w); return (t) => { train.pose(40 + (t - w.s.t0) * 8); tcCorner(w, 1 - tcU(w, t)); cap(t); }; },
  },
});
