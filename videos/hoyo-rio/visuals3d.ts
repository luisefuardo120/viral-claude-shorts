// Scenes of "De hoyo a río lento". The cutaway yard is the same set all video; each scene adds one layer of the build.
// A change every 1-2 s (a layer growing, a label, a cut); the loop scene ends on frame 0's shot. Times are absolute seconds.

const hrPop = (t: number, k: number) => (t < k ? 0.001 : Math.max(0.001, p3Spring(t, k, 260, 16)));
const hrU = (w: World, t: number) => p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0));
const hrLab = (w: World, text: string, color: string, p: Vec3, h = 0.045, arrow = false) => { const l = w.add(dioLabel(text, color, h, arrow)); l.position.set(...p); return l; };
const HR_FULL = { shell: 1, paint: 1, pump: 1, water: 0.92, speed: 1, jets: 1 };
const hrDigging = (S: HrSet, w: World, t: number, dig: number) => { hrBuild(S, t, { dig }); hpWorkerHole(S, w, t, dig); };
const hpWorkerHole = (S: HrSet, w: World, t: number, dig: number) => hrWorker(S, w, t, [HR_IN_HOLE[0], -HR_D * dig, HR_IN_HOLE[2]], { expr: 'stern', mode: 'stand' }, 'shovel');

defineVisuals({
  // 1. (0 s) the worker digging; at "río" a flash of the finished river; back to the hole: ¿CUÁNTO CUESTA?
  hook: {
    bg: HRC.sky,
    build(w) { const S = hrSet(w, 0), fin = hrLab(w, '¿CUÁNTO CUESTA?', HRC.yellow, [-0.7, 1.0, -2.5], 0.045);
      return (t) => { const kf = w.K('flash'), kn = w.K('final'), flash = t >= kf && t < kn;
        if (flash) { hrBuild(S, t, HR_FULL); hrFloat(S, w, t, 0.12 + (t - kf) * 0.06); hrCut(w, 0.4, 0, 12.5, 0.4); }
        else { hrDigging(S, w, t, 0.5 + 0.15 * p3Clamp(t / kf) + (t >= kn ? 0.15 : 0)); hrCut(w, t < kn ? p3Clamp(t / kf) : 0.6 + 0.3 * p3Clamp((t - kn) / 1.5), -0.7, 11.5); }
        fin.pose(hrPop(t, kn + 0.15)); S.cap(t); }; },
  },
  // 2. (5.8 s) fill the bare ring: the water stays still, a ball floats without moving
  problema: {
    bg: HRC.sky,
    build(w) { const S = hrSet(w, 0), no = hrLab(w, '¡QUIETA!', HRC.red, [-2.0, 0.5, -1.5], 0.06), ball = w.add(p3Mesh(new THREE.SphereGeometry(0.22, 20, 14), dioSmooth('#ffd23f', 0.4)));
      return (t) => { const ka = w.K('agua'), kq = w.K('quieta'), fill = 0.7 * p3Ramp(t, ka, ka + 1.4); hrBuild(S, t, { water: fill });
        hrWorker(S, w, t, HR_ISLE, { expr: t < kq ? 'whistle' : 'dazed', mode: 'stand' }, t < kq ? 'hose' : null);
        ball.visible = fill > 0.3; const p = hrPath.getPointAt(0.1); ball.position.set(p.x, -HR_D + HR_T + S.water.lev(fill) + 0.1, p.z);
        no.pose(hrPop(t, kq)); if (t < ka) hrCut(w, 0.5); else w.look([-0.6, 1.4, 6.5], [-1.6, -0.7, -1.8], 36); S.cap(t); }; },
  },
  // 3. (9 s) step 1: seen from above, the ring with soft curves
  forma: {
    bg: HRC.sky,
    build(w) { const S = hrSet(w, 0.2), a = hrLab(w, 'ANILLO', HRC.key, [0, 0.4, -2.2], 0.055), c1 = hrLab(w, 'CURVAS SUAVES', HRC.yellow, [-1.6, 0.3, -5.4], 0.04, true), c2 = hrLab(w, 'SIN FRENAR', HRC.key, [1.3, 0.3, -1.2], 0.045);
      return (t) => { const ka = w.K('anillo'), kc = w.K('curvas'), kf = w.K('frena'); hrDigging(S, w, t, 0.4 + 0.6 * p3Ramp(t, w.s.t0, ka));
        a.pose(hrPop(t, ka)); c1.pose(hrPop(t, kc)); c2.pose(hrPop(t, kf)); const u = hrU(w, t);
        w.look([0.3 - u * 0.6, 17 - u * 2, 4.5], [0, -0.6, -2.4], 40); S.cap(t); }; },
  },
  // 4. (13.6 s) step 2: steel grid, then concrete sprayed with the hose; 1 METRO
  hormigon: {
    bg: HRC.sky,
    build(w) { const S = hrSet(w, 0.4), m = hrLab(w, '1 METRO', HRC.yellow, [-1.1, -0.45, 0.1], 0.045);
      return (t) => { const ka = w.K('acero'), ks = w.K('spray'), kh = w.K('hondo'); hrBuild(S, t, { rebar: p3Ramp(t, ka - 0.3, ks), shell: p3Ramp(t, ks, kh) });
        hrWorker(S, w, t, HR_ISLE, { expr: 'stern', mode: 'stand' }, t >= ks ? 'hose' : null);
        const tg = hrPath.getPointAt(0.25 + 0.2 * Math.sin(t * 1.3)); tg.y = -HR_D + 0.2; S.spray.pose(t, new THREE.Vector3(HR_ISLE[0] + 0.55, 1.0, HR_ISLE[2] + 0.2), tg, t > ks && t < kh ? 1 : 0);
        m.pose(hrPop(t, kh)); const u = hrU(w, t); hrCut(w, u, -0.3, 11.5); S.cap(t); }; },
  },
  // 5. (18.4 s) step 3: grates on the floor, pipes to the pump; REJILLA, BOMBA
  rejillas: {
    bg: HRC.sky,
    build(w) { const S = hrSet(w, 0.6), g0 = hrPath.getPointAt(HR_GRATES[2]), r = hrLab(w, 'REJILLA', HRC.key, [g0.x, -HR_D + 0.6, g0.z], 0.045, true), b = hrLab(w, 'BOMBA', HRC.yellow, [4.9, 1.3, -3.2], 0.05, true);
      return (t) => { const kr = w.K('rejillas'), kb = w.K('bomba'); hrBuild(S, t, { shell: 1, pump: p3Ramp(t, kr - 0.3, kb) });
        hrWorker(S, w, t, HR_ISLE, { expr: 'neutral', mode: 'stand' }); r.pose(hrPop(t, kr + 0.2)); b.pose(hrPop(t, kb));
        const u = hrU(w, t); w.look([5.6 - u, 3.4, 9], [3.0, -0.6, -3], 38); S.cap(t); }; },
  },
  // 6. (22.1 s) step 4, the trick: the pump spits the water out of jets, all pointing forward, 4x faster than the current
  chorros: {
    bg: HRC.sky,
    build(w) { const S = hrSet(w, 0.8), tr = hrLab(w, 'EL TRUCO', HRC.yellow, [4.3, 1.5, -3.2], 0.05), j0 = S.pump.jets[0], c = hrLab(w, 'CHORROS', HRC.key, [j0.at.x + 0.4, 0.15, j0.at.z - 0.4], 0.045, true), x4 = hrLab(w, '×4 MÁS RÁPIDO', HRC.yellow, [-2.7, -0.15, -2.0], 0.045);
      return (t) => { const kc = w.K('chorros'), k4 = w.K('x4'); hrBuild(S, t, { shell: 1, paint: 0, pump: 1, jets: p3Ramp(t, kc - 0.4, kc) });
        hrWorker(S, w, t, HR_ISLE, { expr: t < kc ? 'neutral' : 'shock', mode: 'stand' });
        tr.pose(t < kc - 0.4 ? hrPop(t, w.s.t0 + 0.9) : 0.001); c.pose(hrPop(t, kc)); x4.pose(hrPop(t, k4));
        if (t < kc - 0.4) w.look([5.6, 2.8, 8], [4.0, 0, -3.2], 38); else w.look([-0.8 - hrU(w, t) * 0.5, 1.2, 4.4], [-2.4, -0.6, -1.6], 38); S.cap(t); }; },
  },
  // 7. (29.2 s) step 5: water and float; the current starts and carries him round; 3 KM/H
  flota: {
    bg: HRC.sky,
    build(w) { const S = hrSet(w, 1), k = hrLab(w, '3 KM/H', HRC.yellow, [0, 1.1, -3.5], 0.06);
      return (t) => { const ka = w.K('agua'), kf = w.K('flota'), kk = w.K('kmh'), on = p3Ramp(t, kf, kf + 0.6);
        hrBuild(S, t, { shell: 1, paint: 1, pump: 1, water: 0.2 + 0.72 * p3Ramp(t, ka - 0.6, kf), speed: on, jets: 1 });
        if (t < kf) hrWorker(S, w, t, HR_ISLE, { expr: 'grin', mode: 'stand' }); else hrFloat(S, w, t, 0.05 + Math.max(0, t - kf) * 0.06);
        k.pose(hrPop(t, kk)); hrCut(w, hrU(w, t), 0, 12.5, 0.3); S.cap(t); }; },
  },
  // 8. (34.5 s) the prize: the price card
  premio: {
    bg: HRC.sky,
    build(w) { const S = hrSet(w, 1);
      return (t) => { hrBuild(S, t, HR_FULL); hrFloat(S, w, t, 0.4 + (t - w.s.t0) * 0.06, 'shock');
        const u = hrU(w, t); w.look([1.2 - u, 7.5, 7.5], [0, -1.6, -3], 40); S.cap(t); }; },
  },
  // 9. (38.5 s) would you pay for it, or the pool? tell me below
  pregunta: {
    bg: HRC.sky,
    build(w) { const S = hrSet(w, 1), a = hrLab(w, '¿LO PAGARÍAS?', HRC.key, [-0.6, 1.3, -3.5], 0.042), b = hrLab(w, '¿O LA PISCINA?', HRC.yellow, [0.6, 0.6, -3.5], 0.042), c = hrLab(w, 'DÍMELO ABAJO', '#ffffff', [0, -0.3, -1.5], 0.04);
      return (t) => { hrBuild(S, t, HR_FULL); hrFloat(S, w, t, 0.62 + (t - w.s.t0) * 0.06, 'laugh');
        a.pose(hrPop(t, w.K('pagas'))); b.pose(hrPop(t, w.K('piscina'))); c.pose(hrPop(t, w.K('abajo'))); hrCut(w, hrU(w, t), 0, 12.5, 0.3); S.cap(t); }; },
  },
  // 10. (41.4 s) "y todo empezó con…" — frame 0's shot again, so it loops
  loop: {
    bg: HRC.sky,
    build(w) { const S = hrSet(w, 0);
      return (t) => { hrDigging(S, w, t, 0.5); hrCut(w, 0, -0.7, 11.5); S.cap(t); }; },
  },
});
