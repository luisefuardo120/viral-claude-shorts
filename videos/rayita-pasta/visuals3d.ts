// Scenes of "Esta rayita de tu pasta NO dice si es química": each one only assembles the world (world3d.ts).
// Retention test: something changes every 1-2 s (a hard cut, a pop or a label), frame 0 is already in motion,
// and the last scene ends on frame 0's composition so the video loops. Times are absolute video seconds.

const rpU = (w: World, t: number) => p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0));
const rpGrow = (t: number, k: number) => p3Ramp(t, k, k + 0.4);
const rpPop = (t: number, k: number) => (t < k ? 0.001 : Math.max(0.001, p3Spring(t, k, 260, 16)));
// frame 0's shot: close on the squeezing tube and its mark; u pushes in a little
const rpHookCam = (w: World, S: ReturnType<typeof rpBathSet>, u: number) => { const m = rpMarkAt(S.tube); w.look([m.x - 0.2 + u * 0.04, m.y + 0.28, m.z + 1.45 - u * 0.15], [m.x - 0.24, m.y + 0.0, m.z], 36); };   // from the brush and the paste to the mark, all in frame   // the mark, the paste and the brush in one frame
// the four myth tubes standing on the counter, mark to the camera
const rpMythTubes = (w: World) => RP_MYTH.map(([c], i) => { const piv = w.add(p3Group()), tb = rpTube({ body: '#ffffff', ink: '#2f6fde', mark: c }); piv.add(tb); tb.rotation.y = Math.PI; piv.position.set(-0.36 + i * 0.24, 0.89, -0.32); return { piv, tb }; });
const rpMythLabels = (w: World) => RP_MYTH.map(([c, txt]) => w.add(dioLabel(txt, c === '#111318' ? '#c9ced8' : c, 0.034, true)));
// the factory set: light, sky, the diorama, the turntable, the sensor at its center, the filler, the crimper
const rpFactorySet = (w: World) => { dioLights(w); [[-1.8, 2.6, -3, 0.7], [2, 3, -3.5, 0.9]].forEach(([x, y, z, s]) => w.add(dioCloud([x, y, z], s)));
  w.add(rpFactory()); const table = w.add(rpTurntable()), sensor = w.add(rpSensor()), filler = w.add(rpFiller()), crimper = w.add(rpCrimper()); sensor.rotation.y = Math.PI;
  const a1 = RP_ST[1], a2 = RP_ST[2]; filler.position.set(Math.cos(a1) * 0.45, 0, Math.sin(a1) * 0.45); crimper.position.set(Math.cos(a2) * 0.45, 1.0, Math.sin(a2) * 0.45); crimper.rotation.y = -a2;
  return { table, sensor, filler, crimper, cap: dioCaptions(w, RP_FIX) }; };
// the tube at the sensor station, its mark in world coordinates
const rpStationMark = (F: ReturnType<typeof rpFactorySet>) => { const s = F.table.slots.find((q) => Math.abs(q.cup.position.x) < 0.05 && q.cup.position.z > 0.3); return s ? rpMarkAt(s.tube) : new THREE.Vector3(0, 0.97, 0.42); };

defineVisuals({
  // 1. (0.0 s) the glove squeezes, paste flows: ESTA RAYITA; a hard cut close on the mark at "NO"
  hook: {
    bg: RP.sky,
    build(w) { const S = rpBathSet(w), lab = w.add(dioLabel('ESTA RAYITA', RP.key, 0.042, true));
      return (t) => { const lt = t - w.s.t0, kc = w.K('corte'); rpHold(S, 0.6 + 0.3 * Math.sin(lt * 3)); S.ribbon.pose(0.25 + 0.75 * p3Clamp(lt / 2.6)); lab.position.copy(rpMarkAt(S.tube)); lab.pose(rpPop(t, w.K('rayita')));
        if (t < kc) rpHookCam(w, S, p3Clamp(lt / 1.4)); else { const m = rpMarkAt(S.tube); w.look([m.x + 0.03, m.y + 0.14, m.z + 0.62], [m.x - 0.05, m.y + 0.03, m.z], 34); } S.cap(t); }; },
  },
  // 2. (3.0 s) the promise: at the end you check it with your own tube; it spins upright, a ? at its sealed end
  promesa: {
    bg: RP.sky,
    build(w) { const S = rpBathSet(w), q = w.add(dioLabel('¿?', RP.red, 0.06, true));
      return (t) => { const lt = t - w.s.t0, kt = w.K('tubo'); rpHold(S, 0, lt * 3, 1, 0.1); S.ribbon.pose(1); q.position.copy(S.tube.localToWorld(new THREE.Vector3(0, RP_L, 0))); q.pose(rpPop(t, w.K('final')));
        if (t < kt) w.look([0.6, 1.35, 1.05], [0.1, 1.17, -0.32], 38); else w.look([0.28, 1.38, 0.75], [0.1, 1.2, -0.32], 36); S.cap(t); }; },
  },
  // 3. (5.3 s) the table going around: green natural, blue with medicine, red mixed, black chemicals — one pop each
  tabla: {
    bg: RP.sky,
    build(w) { dioLights(w); w.add(rpBathroom()); const T = rpMythTubes(w), L = rpMythLabels(w), keys = ['verde', 'azul', 'rojo', 'negro'], cap = dioCaptions(w, RP_FIX);
      return (t) => { let cur = 0; T.forEach(({ piv, tb }, i) => { const k = w.K(keys[i]); if (t >= k) cur = i; piv.scale.setScalar(rpPop(t, k - 0.1)); tb.pose(); L[i].position.copy(piv.position).add(new THREE.Vector3(0, RP_L + 0.02, 0)); L[i].pose(rpPop(t, k) * (i === T.length - 1 || t < w.K(keys[i + 1]) ? 1 : 0)); });   // only the color being said keeps its label
        const x = T[cur].piv.position.x; w.look([x * 0.5 + 0.05, 1.5, 1.55 - cur * 0.05], [x * 0.55, 1.14, -0.32], 40); cap(t); }; },
  },
  // 4. (12.1 s) it's false: a big X slams over them; FALSO; cut to the box with its ingredients
  falso: {
    bg: RP.sky,
    build(w) { dioLights(w); w.add(rpBathroom()); const T = rpMythTubes(w), X = w.add(rpX(0.55)), lab = w.add(dioLabel('FALSO', RP.red, 0.07)), box = w.add(rpBox()), lb = w.add(dioLabel('INGREDIENTES: AQUÍ', RP.key, 0.04, true)), cap = dioCaptions(w, RP_FIX);
      box.position.set(0.45, 1.08, -0.3); box.rotation.y = -0.15; X.position.set(-0.0, 1.06, -0.15);
      return (t) => { const kx = w.K('x'), kc = w.K('caja'); T.forEach(({ tb }) => tb.pose()); X.scale.setScalar(rpPop(t, kx)); lab.position.set(-0.0, 1.32, -0.1); lab.pose(rpPop(t, w.K('snopes'))); lb.position.set(0.45, 1.34, -0.2); lb.pose(rpPop(t, kc + 0.3));
        if (t < kc) w.look([0.05, 1.35, 1.55], [0, 1.0, -0.3], 40); else w.look([0.85, 1.3, 1.15], [0.45, 1.12, -0.3], 36); cap(t); }; },
  },
  // 5. (16.8 s) it's for a machine: the factory; cut to the turntable, tubes turned any which way
  maquina: {
    bg: RP.sky,
    build(w) { const F = rpFactorySet(w), lab = w.add(dioLabel('GIRADOS AL AZAR', RP.red, 0.04, true));
      return (t) => { const km = w.K('maquina'), kg = w.K('girados'); F.table.pose(-(t - w.s.t0) * 0.12, 0); F.sensor.pose(t, 0.33); F.filler.pose(0, 1.0); F.crimper.pose(0); const m = rpStationMark(F); lab.position.copy(m).add(new THREE.Vector3(0, 0.08, 0.05)); lab.pose(rpPop(t, kg));
        if (t < km) w.look([1.9, 2.0, 2.6], [0, 0.6, 0], 40); else w.look([0.8, 1.45, 1.9], [0, 0.85, 0.3], 38); F.cap(t); }; },
  },
  // 6. (21.4 s) a light sensor finds the mark and turns the tube until the print faces front; then it fills and seals
  sensor: {
    bg: RP.sky,
    build(w) { const F = rpFactorySet(w), ls = w.add(dioLabel('SENSOR', RP.key, 0.042, true)), ok = w.add(dioLabel('¡DE FRENTE!', RP.ok, 0.045));
      return (t) => { const kr = w.K('rayita'), kg = w.K('gira'), kf = w.K('frente'), kl = w.K('rellena'), align = p3Ramp(t, kg, kf), adv = rpGrow(t, kl - 0.5) + rpGrow(t, kl + 0.3);
        F.table.pose(adv, align, 1); F.sensor.pose(t, 0.33, align > 0.98 ? 1 : 0); F.filler.pose(p3Ramp(t, kl, kl + 0.5), 1.0); F.crimper.pose(rpGrow(t, kl + 0.55));
        ls.position.set(0, 0.92, 0.1); ls.pose(rpPop(t, kr) * (t < kf + 0.3 ? 1 : 0)); ok.position.set(0, 1.08, 0.45); ok.pose(rpPop(t, kf + 0.3) * (adv < 0.1 ? 1 : 0));
        if (t < kg) w.look([1.0, 1.3, 1.6], [0, 0.9, 0.25], 36); else if (t < kl - 0.4) w.look([-0.45, 1.25, 1.7], [0, 0.9, 0.4], 34); else w.look([1.7, 1.7, 1.7], [0.3, 0.85, 0.05], 38); F.cap(t); }; },
  },
  // 7. (27.3 s) why do the colors change? contrast: a pale mark on white is missed, a red one is seen
  color: {
    bg: RP.sky,
    build(w) { dioLights(w); w.add(rpFactory()); const cap = dioCaptions(w, RP_FIX), A = [['#f2f2f2', -0.35], ['#e5484d', 0.35]] as const;
      const P = A.map(([mark, x0]) => { const x = x0 - 0.55;   // left of the turntable, clear of the out conveyor
        return ((x) => { const tb = w.add(rpTube({ body: '#ffffff', ink: '#2f6fde', mark })), sn = w.add(rpSensor()), lb = w.add(dioLabel(mark === '#f2f2f2' ? 'NO LA VE' : 'LA VE', mark === '#f2f2f2' ? RP.red : RP.ok, 0.045));
        tb.position.set(x, 0.06, 0.7); tb.rotation.y = Math.PI; sn.position.set(x, 0, 0.92); sn.scale.setScalar(0.42); return { tb, sn, lb, x }; })(x); });   // small sensors in front of the turntable, at the tubes' height
      return (t) => { const kq = w.K('pregunta'), kc = w.K('contraste'), kn = w.K('nove');
        P.forEach(({ tb, sn, lb, x }, i) => { tb.pose(); sn.pose(t, 0.36, i ? (t > kc ? 1 : 0) : 0); lb.position.set(x, 0.5, 0.7); lb.pose(rpPop(t, i ? kc + 0.2 : kn)); });
        if (t < kq + 0.6) w.look([-0.55, 0.95, 3.0], [-0.55, 0.42, 0.7], 40); else if (t < kn) w.look([0.3, 0.6, 1.7], [-0.2, 0.42, 0.75], 34); else w.look([-1.4, 0.6, 1.7], [-0.9, 0.42, 0.75], 34); cap(t); }; },
  },
  // 8. (31.7 s) the prize: look at your tube — the mark is always at the sealed end
  premio: {
    bg: RP.sky,
    build(w) { const S = rpBathSet(w), lab = w.add(dioLabel('SIEMPRE AQUÍ', RP.key, 0.05, true));
      return (t) => { const kg = w.K('gira'), kr = w.K('rayita'), ke = w.K('extremo'); rpHold(S, 0, p3Lerp(0, Math.PI, rpGrow(t, kg)), 1, 0.1); S.ribbon.pose(1); lab.position.copy(rpMarkAt(S.tube)); lab.pose(rpPop(t, kr));
        const m = rpMarkAt(S.tube); if (t < ke) w.look([0.5, 1.32, 0.9], [0.1, 1.14, -0.32], 36); else w.look([m.x + 0.08, m.y + 0.12, m.z + 0.55], [m.x, m.y + 0.03, m.z], 32); S.cap(t); }; },
  },
  // 9. (34.9 s) it's for the machine, not for you: the sensor's beam on a mark, green
  parati: {
    bg: RP.sky,
    build(w) { const F = rpFactorySet(w);
      return (t) => { F.table.pose(0, 1); F.sensor.pose(t, 0.33, 1); F.filler.pose(0, 1.0); F.crimper.pose(0); w.look([0.55 - rpU(w, t) * 0.3, 1.2, 1.45], [0, 0.92, 0.35], 34); F.cap(t); }; },
  },
  // 10. (36.5 s) did that table reach you? tell me below
  pregunta: {
    bg: RP.sky,
    build(w) { dioLights(w); w.add(rpBathroom()); const T = rpMythTubes(w), X = w.add(rpX(0.55)), c = w.add(dioLabel('CUÉNTAMELO ABAJO', RP.key, 0.045)), cap = dioCaptions(w, RP_FIX); X.position.set(0, 1.06, -0.15);
      return (t) => { T.forEach(({ tb }) => tb.pose()); X.scale.setScalar(rpPop(t, w.K('tabla'))); c.position.set(0, 0.86, 0.05); c.pose(rpPop(t, w.K('abajo')));
        const u = rpU(w, t); w.look([0.35 - u * 0.7, 1.35, 1.5 - u * 0.15], [0, 1.0, -0.3], 40); cap(t); }; },
  },
  // 11. (38.9 s) now you know why — ending on frame 0's composition, the ribbon up to where the video starts
  loop: {
    bg: RP.sky,
    build(w) { const S = rpBathSet(w);
      return (t) => { const u = rpU(w, t); rpHold(S, 0.6 + 0.3 * Math.sin(u * 4.2)); S.ribbon.pose(0.25 * u); rpHookCam(w, S, 0); S.cap(t); }; },
  },
});
