// Scenes of "Ese agujerito de la ventanilla del avión NO está de adorno": each one only assembles the world (world3d.ts).
// Times are absolute video seconds; every scene adds the word captions. Interiors use a wider lens (fov 50+) so the
// cabin fills the frame around the window.

const avU = (w: World, t: number) => p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0));
const avGrow = (t: number, k: number) => p3Ramp(t, k, k + 0.5);
const avPop = (t: number, k: number) => Math.max(0.001, p3Spring(t, k, 230, 15));
// cameras: the cabin around the window, the panes pulled apart (three-quarter), close on one pane
const avCabinCam = (w: World, u: number) => w.look([0.95 - u * 0.2, 0.22, 1.9 - u * 0.25], [0.05, 0.02, 0.2], 56);
const avExplodeCam = (w: World, u: number, z = 0.42) => w.look([0.82 - u * 0.12, 0.34, z + 0.95], [0, 0.13, z], 42);
// the lens stays on the right, between the title and the captions; holeView looks at the hole from the cabin side
const avLens = (w: World) => dioLens(w, { x: 0.36, y: 0.2, r: 0.14 });
const avHoleView = (win: THREE.Object3D): [Vec3, Vec3] => { const h = avHole(win); return [[h.x + 0.05, h.y + 0.03, h.z + 0.16], [h.x, h.y, h.z]]; };
// the air of the pressure scenes, with the panes pulled apart by 0.6 (outer at z ≈ 0.1, middle ≈ 0.28, inner ≈ 0.47)
const avAirSet = (w: World) => ({ cabin: w.add(avAir(320, [-0.22, 0.22, -0.08, 0.42, 0.52, 0.95])), out: w.add(avAir(28, [-0.22, 0.22, -0.08, 0.42, -0.45, 0.05], '#d9efff', 0.006, 9)),
  gap: w.add(avAir(70, [-0.11, 0.11, 0.0, 0.3, 0.13, 0.26], AV.air, 0.006, 21)) });

defineVisuals({
  // 1. that little hole in the plane's window is NOT there for decoration
  hook: {
    bg: AV.sky,
    build(w) { const { win, out, cap } = avCabinSet(w), lens = avLens(w);
      return (t) => { out(t); win.pose({ hole: 1 }); avCabinCam(w, avU(w, t)); lens.pose(...avHoleView(win), avPop(t, w.K('lupa')), 32); cap(t); }; },
  },
  // 2. your window isn't one pane: it's three
  tres: {
    bg: AV.sky,
    build(w) { const { win, out, cap } = avCabinSet(w);
      return (t) => { const e = p3Ramp(t, w.K('separa'), w.K('separa') + 0.5); out(t); win.pose({ explode: e, outer: e, middle: e, inner: e }); avExplodeCam(w, avU(w, t), 0.55 * e); cap(t); }; },
  },
  // 3. the inner one is plastic, only there so you don't scratch the others
  plastico: {
    bg: AV.sky,
    build(w) { const { win, out, cap } = avCabinSet(w), sc = avCracks(); win.inner.add(sc); sc.position.z = 0.014; sc.scale.set(1.2, 1.2, 1);
      return (t) => { out(t); win.pose({ explode: 1, inner: 1 }); sc.pose(p3Ramp(t, w.K('rayas'), w.K('rayas') + 0.5)); w.look([0.35, 0.22, 1.45], [0, 0.15, 0.78], 40); cap(t); }; },
  },
  // 4. up there the air inside is at much higher pressure than outside
  presion: {
    bg: AV.sky,
    build(w) { const { win, out, cap } = avCabinSet(w), A = avAirSet(w);
      return (t) => { const k = w.K('aire'); out(t); win.pose({ explode: 0.6 }); A.cabin.pose(t, p3Ramp(t, k - 0.3, k + 0.5)); A.out.pose(t, 1); A.gap.pose(t, 0); avExplodeCam(w, avU(w, t), 0.3); cap(t); }; },
  },
  // 5. and that pressure pushes the windows outward all the time
  empuja: {
    bg: AV.sky,
    build(w) { const { win, out, cap } = avCabinSet(w), A = avAirSet(w), push = w.add(avPush(3, 2, 0.14)); push.position.set(0, 0.15, 0.64);
      return (t) => { out(t); win.pose({ explode: 0.6 }); A.cabin.pose(t, 1); A.out.pose(t, 1); A.gap.pose(t, 0); push.pose(avGrow(t, w.K('empuja')), t); w.look([-0.75, 0.3, 1.3], [0, 0.13, 0.35], 42); cap(t); }; },
  },
  // 6. so the outer pane is the strong one: it takes all that push
  fuerte: {
    bg: AV.sky,
    build(w) { const { win, out, cap } = avCabinSet(w), A = avAirSet(w), push = w.add(avPush(3, 2, 0.1)); push.position.set(0, 0.15, 0.24);
      return (t) => { out(t); const k = w.K('aguanta'); win.pose({ explode: 0.6, outer: 0.6 + 0.4 * Math.sin((t - k) * 6) * (t > k ? 1 : 0) }); A.cabin.pose(t, 1); A.out.pose(t, 1); A.gap.pose(t, 1);
        push.pose(1, t); avExplodeCam(w, avU(w, t), 0.18); cap(t); }; },
  },
  // 7. but the middle one mustn't carry anything, so it has this little hole
  agujero: {
    bg: AV.sky,
    build(w) { const { win, out, cap } = avCabinSet(w), lens = avLens(w);
      return (t) => { const k = w.K('agujero'); out(t); win.pose({ explode: 0.6, middle: 1, hole: avPop(t, k) * (t >= k ? 1 : 0) }); w.look([0.25, 0.1, 0.95], [0, 0.07, 0.28], 40); lens.pose(...avHoleView(win), avPop(t, k + 0.2) * (t >= k ? 1 : 0), 30); cap(t); }; },
  },
  // 8. it lets cabin air into the gap, so the pressure is the same on both sides of the middle pane
  misma: {
    bg: AV.sky,
    build(w) { const { win, out, cap } = avCabinSet(w), A = avAirSet(w), st = w.add(avStream(36)), pin = w.add(avPush(2, 1, 0.08, AV.key)), pout = w.add(avPush(2, 1, 0.08, AV.key));
      pin.position.set(0.06, 0.15, 0.4); pout.position.set(0.06, 0.15, 0.17); pout.rotation.y = Math.PI;   // equal arrows on both faces of the middle pane
      return (t) => { const kp = w.K('pasa'), ki = w.K('igual'); out(t); win.pose({ explode: 0.6, middle: 1, hole: 1 }); A.cabin.pose(t, 1); A.out.pose(t, 1); A.gap.pose(t, p3Ramp(t, kp, ki));
        const h = avHole(win); st.pose(t, h.clone().add(new THREE.Vector3(0.06, 0.12, 0.22)), h, h.z - 0.12, avGrow(t, kp)); pin.pose(avGrow(t, ki)); pout.pose(avGrow(t, ki)); w.look([0.62, 0.05, 0.95], [0, 0.07, 0.28], 40); cap(t); }; },
  },
  // 9. so it stays in reserve: if the outer one broke, the middle one holds up to 1.5 times the normal pressure
  reserva: {
    bg: AV.sky,
    build(w) { const { win, out, cap } = avCabinSet(w), cr = avCracks(); win.outer.add(cr); cr.position.z = -0.002; cr.scale.set(1.3, 1.3, 1);
      return (t) => { const k = w.K('rompe'); out(t); win.pose({ explode: 0.6, outer: 0, middle: avGrow(t, k + 0.3), hole: 1 }); cr.pose(p3Ramp(t, k, k + 0.45)); avExplodeCam(w, 1 - avU(w, t), 0.24); cap(t); }; },
  },
  // 10. and through that hole the moisture leaves, so your window hardly ever fogs up
  humedad: {
    bg: AV.sky,
    build(w) { const { win, out, cap } = avCabinSet(w), fog = avFog(), st = w.add(avStream(30, '#ffffff')); win.middle.add(fog); fog.position.z = 0.013;
      return (t) => { const k = w.K('sale'); out(t); win.pose({ explode: 0.6, hole: 1 }); fog.pose(1 - p3Ramp(t, k, k + 1.2)); const h = avHole(win);
        st.pose(t, h.clone().add(new THREE.Vector3(0.0, 0.14, -0.05)), h, h.z + 0.18, avGrow(t, k)); w.look([0.18, 0.2, 0.92], [0, 0.14, 0.28], 40); cap(t); }; },
  },
  // 11. so that little hole is not for decoration: it decides which pane holds the plane — outside, over the diorama
  cierre: {
    bg: AV.sky,
    build(w) { dioLights(w); const p = w.add(dioAirliner()); p.gear.forEach((l) => (l.visible = false)); const land = w.add(dioDiorama()); land.scale.setScalar(0.5); land.position.set(2, -20, -8); dioSkyBack(w); const cap = dioCaptions(w, AV_FIX);
      return (t) => { const u = avU(w, t); p.position.y = 0.2 * Math.sin(t * 0.8); w.look([9 + u * 10, 1.5 + u * 5, 10 + u * 18], [1 - u, -0.5 - u * 4, 0], 36); cap(t); }; },
  },
});
