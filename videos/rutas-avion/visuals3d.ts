// Scenes of "¿Por qué los aviones no vuelan en línea recta en el mapa?": each one only assembles the world (world3d.ts).
// Every scene adds the word captions; times are absolute video seconds.

// ---- shared assembly helpers (prefix ra, like the world)
const raU = (w: World, t: number) => p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0));
const raPop = (t: number, k: number) => Math.max(0.001, p3Spring(t, k, 230, 15));
const raGrow = (t: number, k: number) => p3Ramp(t, k, k + 0.5);
// the globe camera, and the map camera (farther, a bit higher); m blends them while the Earth morphs
const raEarthCam = (w: World, m: number, u = 0) => w.look([0, p3Lerp(1.2, 0.4, m), p3Lerp(15.5 - u * 0.8, 27, m)], [p3Lerp(0, -0.3, m), p3Lerp(0.5, 1.2, m), 0], 36);
// an Earth scene: sky, clouds, the Earth, both routes, both pins and the captions
const raEarthSet = (w: World) => {
  dioLights(w); dioSkyBack(w);
  const e = w.add(raEarth()), gc = w.add(raRoute(RA_GC, RA.key)), rh = w.add(raRoute(RA_RH, RA.red)), pins = [w.add(raPin()), w.add(raPin())], cap = dioCaptions(w, RA_FIX);
  const pose = (t: number, m: number, o: { gc?: number; rh?: number; pins?: number; spin?: number } = {}) => {
    const sp = o.spin ?? 0; e.pose(m, sp); gc.pose(m, o.gc ?? 0, sp); rh.pose(m, o.rh ?? 0, sp);
    pins.forEach((p, i) => { const k = o.pins ?? 0; p.visible = k > 0.002; p.pose(i ? RA_LA : RA_LONDON, m, k, sp); }); cap(t);
  };
  return { e, gc, rh, pins, pose };
};
const raAirfieldSet = (w: World) => {
  dioLights(w); w.add(dioDiorama()); [[-10, 14, -26, 1.8], [12, 16, -32, 2.2], [30, 20, -10, 2]].forEach(([x, y, z, s]) => w.add(dioCloud([x, y, z], s)));
  const sun = w.add(dioSun()); sun.position.set(-14, 22, -40);
  const plane = w.add(dioAirliner()); plane.position.set(1, plane.height + 0.03, 0);
  return { plane, cap: dioCaptions(w, RA_FIX) };
};

defineVisuals({
  // 1. the hook: the diorama from its corner, the plane on the runway
  hook: {
    bg: RA.sky,
    build(w) {
      const { cap } = raAirfieldSet(w);
      return (t) => { const a = p3Lerp(0.62, 0.5, raU(w, t)); w.look([6 + Math.cos(a) * 44, 16, 4 + Math.sin(a) * 44], [6, 2.2, 4], 36); cap(t); };
    },
  },
  // 2. the flat map: pins, then the red straight line
  raya: {
    bg: RA.sky,
    build(w) {
      const E = raEarthSet(w);
      return (t) => { E.pose(t, 1, { pins: raPop(t, w.K('pins')), rh: raGrow(t, w.K('raya')) }); raEarthCam(w, 1); };
    },
  },
  // 3. but the plane goes up over Greenland: the small plane flies the green route, which trails behind it
  arriba: {
    bg: RA.sky,
    build(w) {
      const E = raEarthSet(w), ic = w.add(raPlaneIcon(0.06));
      return (t) => { const u = p3Ramp(t, w.K('vuela'), w.K('vuela') + 2.4);   // RA_GC starts in London, so the green route trails the plane
        E.pose(t, 1, { pins: 1, rh: 1, gc: u }); ic.visible = t >= w.K('vuela') - 0.1; ic.pose(RA_GC, u, 1, 0.3);
        const v = raU(w, t); w.look([-1 + v, 2.8, 22.5 - v], [-0.3, 2.4, 0], 36); };   // closer and higher than the previous scene: toward Greenland
    },
  },
  // 4. the Earth is a ball: the map folds into a globe
  bola: {
    bg: RA.sky,
    build(w) {
      const E = raEarthSet(w);
      return (t) => { const m = 1 - raGrow(t, w.K('bola')); E.pose(t, m, { spin: m < 0.01 ? (t - w.K('bola') - 0.5) * 6 : 0 });
        const a = 0.55 * m; w.look([Math.sin(a) * p3Lerp(15.5, 25, m), p3Lerp(1.2, -2.5, m), Math.cos(a) * p3Lerp(15.5, 25, m)], [0, p3Lerp(0.5, 1.4, m), 0], 36); };   // the map seen at an angle, then the globe head-on
    },
  },
  // 5. the map stretches it: the globe unrolls, the camera rises to the stretched north
  estira: {
    bg: RA.sky,
    build(w) {
      const E = raEarthSet(w);
      return (t) => { const m = raGrow(t, w.K('estira')), up = raGrow(t, w.K('polos'));
        E.pose(t, m, { spin: (1 - m) * 25 }); const a = -0.6 * (1 - m), d = p3Lerp(13.5, 27, m);   // starts from the side, close: a different shot from the previous scene
        w.look([Math.sin(a) * d, p3Lerp(3.5, 0.4, m) + up * 3, Math.cos(a) * d], [p3Lerp(0, -0.3, m), p3Lerp(0.9, 1.2, m) + up * 3.5, 0], 36); };
    },
  },
  // 6. Greenland vs Africa: Greenland shrinks to its real size
  groenlandia: {
    bg: RA.sky,
    build(w) {
      dioLights(w); dioSkyBack(w); const c = w.add(raCompare()), cap = dioCaptions(w, RA_FIX);
      return (t) => { c.pose(t, w.K('shrink')); w.look([0, 0, 16 - raU(w, t) * 1.2], [0, 0.2, 0], 36); cap(t); };
    },
  },
  // 7. a thread between the two cities: pins, then the thread stretches
  hilo: {
    bg: RA.sky,
    build(w) {
      const E = raEarthSet(w);
      return (t) => { E.pose(t, 0, { pins: raPop(t, w.K('pins')), gc: raGrow(t, w.K('tensas')) }); raEarthCam(w, 0, raU(w, t)); };
    },
  },
  // 8. it bends toward the pole: the red map line on the globe, next to the green thread
  polo: {
    bg: RA.sky,
    build(w) {
      const E = raEarthSet(w);
      return (t) => { E.pose(t, 0, { pins: 1, gc: 1, rh: raGrow(t, w.K('raya')) }); raEarthCam(w, 0, 0.5 + raU(w, t) * 0.5); };
    },
  },
  // 9. great circle: the plane flies the thread, then the disc through the center
  circulo: {
    bg: RA.sky,
    build(w) {
      const E = raEarthSet(w), ring = w.add(raRing(RA_LONDON, RA_LA)), ic = w.add(raPlaneIcon(0.06));
      return (t) => { E.pose(t, 0, { pins: 1, gc: 1 }); ic.pose(RA_GC, p3Ramp(t, w.K('corto'), w.K('corto') + 2.2), 0, 0.2);
        ring.pose(p3Spring(t, w.K('circulo'), 160, 16)); w.look([2.5 * raU(w, t), 1.6, 16.5], [0, 0.5, 0], 36); };
    },
  },
  // 10. back on the flat map, the green one is curved... and it is the true straight line
  plano: {
    bg: RA.sky,
    build(w) {
      const E = raEarthSet(w);
      return (t) => { const m = raGrow(t, w.K('plano')); E.pose(t, m, { pins: 1, gc: 1, rh: 1 });
        const glow = t > w.K('recta') ? 0.25 + 0.5 * (0.5 + 0.5 * Math.sin((t - w.K('recta')) * 8)) : 0.25; (E.gc.material as THREE.MeshStandardMaterial).emissiveIntensity = glow;
        E.gc.scale.setScalar(1); raEarthCam(w, m); };
    },
  },
  // 11. at 10 km: the plane takes off from the diorama and climbs, folding its gear
  altura: {
    bg: RA.sky,
    build(w) {
      const { plane, cap } = raAirfieldSet(w);
      return (t) => { const k = w.K('despega'), tau = Math.max(0, t - k), x = 1 + 3 * tau + 2.2 * tau * tau, lift = Math.max(0, tau - 1.2);
        plane.position.set(x, plane.height + 0.03 + lift * lift * 2.2, 0); plane.rotation.z = 0.22 * p3Ramp(t, k + 1.0, k + 1.5);
        const g = 1 - raGrow(t, w.K('tren')); plane.gear.forEach((l) => { l.scale.y = Math.max(0.001, g); });
        w.look([x + 24, plane.position.y + 8, 36], [x - 1, plane.position.y + 1.6, 0], 36); cap(t); };
    },
  },
  // 12. the jet streams over the spinning globe
  viento: {
    bg: RA.sky,
    build(w) {
      const E = raEarthSet(w), jets = w.add(raJets());
      return (t) => { const sp = (t - w.s.t0) * 5; E.pose(t, 0, { spin: sp }); jets.pose(t - w.s.t0, sp, raGrow(t, w.K('jets'))); raEarthCam(w, 0, raU(w, t)); };
    },
  },
  // 13. riding the jet stream to the east; another plane flies west, out of the wind
  chorro: {
    bg: RA.sky,
    build(w) {
      dioLights(w); const cap = dioCaptions(w, RA_FIX), R = p3Rnd(31);
      const east = w.add(dioAirliner()), west = w.add(dioAirliner()); west.rotation.y = Math.PI; west.scale.setScalar(0.7); east.gear.forEach((l) => (l.visible = false)); west.gear.forEach((l) => (l.visible = false));
      const clouds = Array.from({ length: 9 }, (_, i) => ({ c: w.add(dioCloud([0, -9 + (i % 3) * 2.5, -14 - (i % 4) * 4], 1.2 + (i % 3) * 0.5)), x0: i * 9 }));
      const mat = dioSmooth('#ffffff', 0.5); mat.transparent = true; mat.opacity = 0.85; const geo = new THREE.CapsuleGeometry(0.05, 2.4, 4, 8); geo.rotateZ(Math.PI / 2);
      const streaks = Array.from({ length: 26 }, () => ({ m: w.add(new THREE.Mesh(geo, mat)), x0: R() * 40, y: 1 + R() * 4.5, z: -3 + R() * 6, v: 14 + R() * 8 }));
      return (t) => { const lt = t - w.s.t0, boost = raGrow(t, w.K('sube'));
        east.position.set(0, 2.4 + 0.15 * Math.sin(lt * 1.6), 0); east.rotation.x = 0.05 * Math.sin(lt * 1.2);
        streaks.forEach((s) => { s.m.position.set((((s.x0 + lt * s.v * (1 + boost)) % 40) + 40) % 40 - 20, s.y, s.z); });
        clouds.forEach((c) => { c.c.position.x = (((c.x0 - lt * (6 + 6 * boost)) % 80) + 80) % 80 - 40; });
        const wp = raPop(t, w.K('oeste')); west.visible = t >= w.K('oeste'); west.scale.setScalar(0.7 * wp); west.position.set(4 - (t - w.K('oeste')) * 2.5, -3.2, -2);
        w.look([9, 3.5, 40], [0, 0.2, 0], 36); cap(t); };
    },
  },
  // 14. outbound and return: the return bar is longer
  vuelta: {
    bg: RA.sky,
    build(w) {
      dioLights(w); dioSkyBack(w); const b = w.add(raBars()), cap = dioCaptions(w, RA_FIX); b.position.y = 0.6;
      return (t) => { const k = w.K('barras'); b.pose(raGrow(t, k), raGrow(t, k + 0.3)); w.look([0, 0.2, 16], [0.2, 0.2, 0], 36); cap(t); };
    },
  },
  // 15. the straight line is on a ball: the plane flies the whole great circle around the turning globe
  cierre: {
    bg: RA.sky,
    build(w) {
      const E = raEarthSet(w), ring = raGreatCircle(RA_LONDON, RA_LA, 240, 2.2), ic = w.add(raPlaneIcon(0.06)), full = w.add(raRoute(ring, RA.key, 0.035));
      return (t) => { const sp = (t - w.s.t0) * 6, u = raU(w, t); E.pose(t, 0, { pins: 1, gc: 1, spin: sp }); full.pose(0, raGrow(t, w.K('recta')), sp);
        ic.pose(ring, 0.3 + u * 0.6, 0, 0.22, sp); w.look([Math.sin(u * 0.6 - 0.3) * 16.5, 2, Math.cos(u * 0.6 - 0.3) * 16.5], [0, 0.4, 0], 36); };
    },
  },
});
