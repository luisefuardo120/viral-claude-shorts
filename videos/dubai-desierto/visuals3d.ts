// Scenes of "Imagina que tienes que construir una ciudad en el desierto". 26 scenes over 2.5 min: a change every 1-2 s (a key,
// a label, a camera move). The plan's progress tag (top left) shows the pieces done (green) and the current one (yellow).

const dbU = (w: World, t: number) => p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0));
// common set-ups: the desert with the city (grow), the worker, captions and the progress tag
const dbDesert = (w: World, done: number, now: number, sea = true) => { dbGround(w, sea); const C = dbCity(w); dbCaptionsTag(w, done, now); return { C, cap: dbCaptions(w) }; };
const dbLabSet = (w: World, done: number, now: number) => { dbLab(w); dbCaptionsTag(w, done, now); return dbCaptions(w); };
const DB_LABCAM = (w: World, u: number, d = 20) => w.look([2 - u, 5, d - u * 2], [1, 1, 0], 40);

defineVisuals({
  // 1. (0 s) a piece of desert, nothing else; at "ciudad" the towers rise out of the sand
  hook: { bg: '#5f7fc8', build(w) { const { C, cap } = dbDesert(w, 0, -1), wk = dbWorker(w, [0, 0, 17]), wind = w.add(p3Swarm(160, new THREE.SphereGeometry(0.022, 4, 3), new THREE.MeshBasicMaterial({ color: '#e6c48c' }))), R = p3Rnd(21), P = Array.from({ length: 160 }, () => [R(), R() * 1.6, 10 + R() * 12, 0.6 + R()]);
    return (t) => { P.forEach(([ph, y, z, sp], i) => { const u = (ph + t * 0.35 * sp) % 1; wind.put(i, -9 + u * 18, y + Math.sin(u * 9 + ph * 6) * 0.25, z, 1); }); wind.done();   // blowing sand: something moves from frame 0
      const kc = w.K('ciudad'); C.pose(t, p3Ramp(t, kc, kc + 2.2)); wk.pose(w.camera, { expr: t < kc ? 'neutral' : 'shock', mode: 'stand' }); const u = dbU(w, t); w.look([1 + u, 2.2 + u * 3, 24 - u * 2], [0, 2.6 + u * 9, -60], 50); cap(t); }; } },
  // 2. (9 s) no rivers, no lakes, almost no rain: the city fades back, three red crosses
  sin: { bg: '#5f7fc8', build(w) { const { C, cap } = dbDesert(w, 0, -1), a = dbLab3(w, '✗ RÍOS', DB.red, [0, 11, -10], 0.05), b = dbLab3(w, '✗ LAGOS', DB.red, [0, 8.5, -10], 0.05), c = dbLab3(w, '✗ LLUVIA', DB.red, [0, 6, -10], 0.05), wk = dbWorker(w, [0, 0, 12]);
    return (t) => { C.pose(t, 1 - p3Ramp(t, w.s.t0, w.s.t0 + 1)); a.pose(dbPop(t, w.K('rios'))); b.pose(dbPop(t, w.K('lagos'))); c.pose(dbPop(t, w.K('lluvia'))); wk.pose(w.camera, { expr: t < w.K('imposible') ? 'nervous' : 'pained', mode: 'stand' });
      w.look([2, 4, 22], [0, 5, -20], 46); cap(t); }; } },
  // 3. (13.5 s) "but you have a plan": the board appears; "what happens if it switches off?"
  promesa: { bg: '#5f7fc8', build(w) { const { C, cap } = dbDesert(w, 0, -1), b = w.add(dbBoard()), q = dbLab3(w, '¿Y SI SE APAGA?', DB.yellow, [0, 6.5, -6], 0.045), wk = dbWorker(w, [-3, 0, 6]);
    return (t) => { const kp = w.K('plan'), ka = w.K('apaga'); C.pose(t, 0); b.position.set(0, 12, -8); b.scale.setScalar(dbPop(t, kp)); b.draw(4, 0, -1, 'EL PLAN'); q.pose(dbPop(t, ka)); wk.pose(w.camera, { expr: 'grin', mode: 'stand' });
      const u = dbU(w, t); w.look([0, 8, 20 - u * 3], [0, 9, -8], 42); cap(t); }; } },
  // 4. (18 s) the plan: four tiles pop as they are named
  plan: { bg: '#2a3f6e', build(w) { const cap = dbLabSet(w, 0, -1), b = w.add(dbBoard()); b.position.set(0, 2, 0);
    return (t) => { const n = ['agua', 'frio', 'tierra', 'energia'].filter((k) => t >= w.K(k)).length; b.draw(n, 0, n - 1, 'EL PLAN'); b.rotation.y = Math.sin(t * 0.6) * 0.08; w.look([0, 2, 31 - dbU(w, t) * 2], [0, 1.6, 0], 40); cap(t); }; } },
  // 5. (25.7 s) piece 1, water: the sea; it has salt
  agua: { bg: '#5f7fc8', build(w) { const { C, cap } = dbDesert(w, 0, 0), wk = dbWorker(w, [0, 0, -124]), s = dbLab3(w, 'SAL', '#ffffff', [2, 4, -134], 0.05, true);
    return (t) => { C.pose(t, 0); wk.pose(w.camera, { expr: 'smile', mode: 'stand' }); s.pose(dbPop(t, w.K('sal'))); const u = dbU(w, t); w.look([3 - u * 2, 4, -112 - u * 4], [0, 1, -150], 44); cap(t); }; } },
  // 6. (33 s) the plant: a piston pushes sea water against a membrane; the salt doesn't fit
  desal: { bg: '#2a3f6e', build(w) { const cap = dbLabSet(w, 0, 0), D = w.add(dbDesal()), m = dbLab3(w, 'MEMBRANA', DB.yellow, [1.2, 2.6, 0], 0.04, true), p = dbLab3(w, 'PRESIÓN', '#ffffff', [-2.0, 2.4, 0], 0.04, true), n = dbLab3(w, '¡LA SAL NO CABE!', DB.red, [1, -2.6, 0], 0.045);
    return (t) => { const st = t < w.K('presion') ? 0 : t < w.K('membrana') ? 1 : 2; D.pose(t, st); D.scale.setScalar(dbPop(t, w.K('planta') - 0.3)); m.pose(dbPop(t, w.K('membrana'))); p.pose(dbPop(t, w.K('presion'))); n.pose(dbPop(t, w.K('nocabe')));
      DB_LABCAM(w, dbU(w, t), 30); cap(t); }; } },
  // 7. (41.6 s) fresh water out one side, brine back to the sea
  salida: { bg: '#2a3f6e', build(w) { const cap = dbLabSet(w, 0, 0), D = w.add(dbDesal()), f = dbLab3(w, 'AGUA DULCE', DB.cold, [3.6, 1.6, 0], 0.045, true), b = dbLab3(w, 'SALMUERA → MAR', '#ffffff', [-4, -2.4, 0], 0.04, true);
    return (t) => { D.pose(t, 3); f.pose(dbPop(t, w.K('dulce'))); b.pose(dbPop(t, w.K('salmuera'))); w.look([1, 3, 30], [0.5, -0.5, 0], 42); cap(t); }; } },
  // 8. (45.3 s) one plant: 182 million litres a day (stat card)
  jebel: { bg: '#5f7fc8', build(w) { const { C, cap } = dbDesert(w, 0, 0);
    const tanks = p3Group(); for (let i = 0; i < 6; i++) { tanks.add(p3Mesh(p3Cyl(3, 3, 6, 24), dioSmooth('#f2f4f7', 0.4), { p: [-12 + i * 7.5, 3, 0] })); tanks.add(p3Mesh(p3Cyl(3.1, 3.1, 0.4, 24), dioSmooth('#3aa6e0', 0.4), { p: [-12 + i * 7.5, 6.2, 0] })); }
    tanks.add(p3Mesh(p3Box(46, 7, 8), dioSmooth('#e9edf2', 0.5), { p: [6, 3.5, -10] })); tanks.position.set(0, 0, -128); w.add(tanks);
    return (t) => { C.pose(t, 0.3); const u = dbU(w, t); w.look([-14 + u * 10, 12, -92], [4, 3, -132], 46); cap(t); }; } },
  // 9. (50.7 s) open the tap in the desert: sea water comes out
  grifo: { bg: '#5f7fc8', build(w) { const { C, cap } = dbDesert(w, 0, 0, true), F = w.add(dbFaucet()), wk = dbWorker(w, [-1.2, 0, 0.3]);
    return (t) => { C.pose(t, 0); F.pose(t, p3Ramp(t, w.K('abre'), w.K('abre') + 0.6)); wk.pose(w.camera, { expr: t < w.K('sale') ? 'neutral' : 'laugh', mode: 'stand' }); w.look([1.8, 1.8, 7.5 - dbU(w, t)], [-0.2, 1.1, 0], 40); cap(t); }; } },
  // 10. (53.6 s) piece 2, cold: the heat (shimmer), the worker melts
  frio: { bg: '#5f7fc8', build(w) { const { C, cap } = dbDesert(w, 1, 1), wk = dbWorker(w, [0, 0, 12]), h = dbLab3(w, '🌡️ CALOR', DB.red, [0, 3.2, 12], 0.05);
    return (t) => { C.pose(t, 1); wk.pose(w.camera, { expr: t < w.K('calor') ? 'neutral' : 'pained', mode: 'stand', tilt: Math.sin(t * 3) * 3 }); h.pose(dbPop(t, w.K('calor'))); const u = dbU(w, t); w.look([1, 2.4, 19 - u * 3], [0, 2 + u * 8, -20], 46); cap(t); }; } },
  // 11. (59.1 s) one AC unit in every window: it costs a fortune; "do it the other way round"
  ventanas: { bg: '#5f7fc8', build(w) { dbGround(w, false); dbCaptionsTag(w, 1, 1); const cap = dbCaptions(w), A = w.add(dbACTower()), g = dbLab3(w, '⚡⚡⚡ MUCHÍSIMO', DB.red, [0, 13, 4], 0.045), r = dbLab3(w, 'AL REVÉS', DB.yellow, [0, 6, 4], 0.06);
    return (t) => { A.pose(t, p3Ramp(t, w.K('aparatos') - 0.2, w.K('aparatos') + 1.4)); g.pose(dbPop(t, w.K('gasta'))); r.pose(dbPop(t, w.K('reves'))); w.look([4, 9, 26 - dbU(w, t) * 4], [0, 9, 0], 44); cap(t); }; } },
  // 12. (63 s) chill water in a plant, send it in pipes under the streets to whole neighbourhoods
  tubos: { bg: '#5f7fc8', build(w) { dbGround(w, false); dbCaptionsTag(w, 1, 1); const cap = dbCaptions(w), K = w.add(dbCooling()), p = dbLab3(w, 'AGUA HELADA', DB.cold, [4, -0.4, 1], 0.04, true), b = dbLab3(w, 'BARRIOS ENTEROS', DB.yellow, [14, 16, -6], 0.042);
    return (t) => { K.pose(t, p3Ramp(t, w.K('tubos') - 0.6, w.K('barrios') + 0.6)); p.pose(dbPop(t, w.K('tubos'))); b.pose(dbPop(t, w.K('barrios'))); const u = dbU(w, t); w.look([-6 + u * 20, 5, 22], [-6 + u * 20, 2, -4], 44); cap(t); }; } },
  // 13. (68.3 s) one of those plants holds a Guinness record (stat card)
  guinness: { bg: '#5f7fc8', build(w) { dbGround(w, false); dbCaptionsTag(w, 1, 1); const cap = dbCaptions(w), K = w.add(dbCooling());
    return (t) => { K.pose(t, 1); K.plant.scale.setScalar(1 + 0.6 * p3Ramp(t, w.K('record') - 0.4, w.K('record'))); w.look([-2, 9, 22], [-6, 6, -4], 44); cap(t); }; } },
  // 14. (73 s) your city doesn't have AC: your city IS an AC (the whole city with cold pipes glowing)
  ciudadac: { bg: '#5f7fc8', build(w) { const { C, cap } = dbDesert(w, 1, 1), s = dbLab3(w, '❄️ ES UN AIRE ACONDICIONADO', DB.cold, [2, 30, -60], 0.036);
    return (t) => { C.pose(t, 1); s.pose(dbPop(t, w.K('es'))); dbCityCam(w, dbU(w, t), 10); cap(t); }; } },
  // 15. (77.2 s) piece 3, land: surrounded by sand, and it is useless
  tierra: { bg: '#5f7fc8', build(w) { const { C, cap } = dbDesert(w, 2, 2), wk = dbWorker(w, [-1, 0, 8]), sh = w.add(dbShovel()), x = dbLab3(w, '✗ NO SIRVE', DB.red, [-1, 3.4, 8], 0.055);
    return (t) => { C.pose(t, 0); wk.pose(w.camera, { expr: t < w.K('nosirve') ? 'stern' : 'dazed', mode: 'stand' }); const d = Math.sin(t * 6); sh.position.set(-0.6, 0.35 + 0.15 * d, 8.2); sh.rotation.z = -0.5 + 0.35 * d; x.pose(dbPop(t, w.K('nosirve')));
      const u = dbU(w, t); w.look([2 - u * 3, 2.5, 15 - u * 3], [-1, 1.4, 7], 42); cap(t); }; } },
  // 16. (82.6 s) macro: the wind polished the grains round; in concrete they slide instead of gripping
  granos: { bg: '#2a3f6e', build(w) { const cap = dbLabSet(w, 2, 2), G = w.add(dbGrains()), r = dbLab3(w, 'REDONDOS', DB.red, [1.5, 4.6, 0], 0.045), s = dbLab3(w, 'SE RESBALAN', DB.red, [0, -0.8, 1.5], 0.045);
    return (t) => { G.pose(t, 0, p3Ramp(t, w.K('resbalan'), w.K('resbalan') + 1.2)); r.pose(dbPop(t, w.K('redondos'))); s.pose(dbPop(t, w.K('resbalan'))); w.look([1.5, 3.5, 15 - dbU(w, t) * 2], [1.5, 1.8, 0], 40); cap(t); }; } },
  // 17. (90.2 s) so the Gulf imports sand, to the desert (a ship full of sand)
  importa: { bg: '#5f7fc8', build(w) { const { C, cap } = dbDesert(w, 2, 2), S = w.add(dbShip()), l = dbLab3(w, 'ARENA IMPORTADA', DB.yellow, [0, 9, 0], 0.045), d = dbLab3(w, '…¡AL DESIERTO!', DB.red, [0, 6, 0], 0.05);
    return (t) => { C.pose(t, 0.4); const kb = w.K('barco'), x = 30 - 30 * p3Ramp(t, kb - 0.5, kb + 2.5); S.position.set(x, 0, -130); l.position.set(x, 9, -130); d.position.set(x, 6.4, -130); l.pose(dbPop(t, kb)); d.pose(dbPop(t, w.K('desierto')));
      w.look([-6, 8, -100], [4, 3, -132], 44); cap(t); }; } },
  // 18. (93.7 s) when you run out of land you make it: the palm island grows, 94 million m3 of sand (stat card)
  isla: { bg: '#5f7fc8', build(w) { const { C, cap } = dbDesert(w, 2, 2), I = w.add(dbIsland()); I.position.set(0, 0, -150);
    return (t) => { C.pose(t, 0); I.pose(t, p3Ramp(t, w.K('fabricas'), w.K('stat')), t < w.K('stat') + 1 ? 1 : 0); const u = dbU(w, t); w.look([12 - u * 6, 42, -112], [0, 0, -152], 46); cap(t); }; } },
  // 19. (101.8 s) and then you hit a wall: it all needs electricity; lights out, the tap stops, the cold stops
  muro: { bg: '#5f7fc8', build(w) { const { C, cap } = dbDesert(w, 3, -1), W = w.add(dbWall()), F = w.add(dbFaucet()), wk = dbWorker(w, [-2.5, 0, 12]); W.position.set(0, 0, 2); F.position.set(1.2, 0, 10);
    const off = dbLab3(w, '⚡ SIN LUZ', DB.red, [0, 16, 2], 0.05);
    return (t) => { const kw = w.K('pared'), kl = w.K('luz'), down = t >= kl; W.pose(p3Ramp(t, kw - 0.3, kw + 0.1) * (1 - p3Ramp(t, kl - 0.6, kl))); C.pose(t, 1, down ? 0 : 1); F.pose(t, t < w.K('agua') ? 1 : 0); off.pose(dbPop(t, kl));
      wk.pose(w.camera, { expr: t < kw ? 'neutral' : 'shock', mode: 'stand' }); const sh = t > kw && t < kw + 0.5 ? 0.3 : 0; w.look([1 + Math.sin(t * 40) * sh, 6, 30], [0, 8, -20], 48); cap(t); }; } },
  // 20. (108.8 s) piece 4, energy: the one thing the desert has plenty of, the sun
  energia: { bg: '#5f7fc8', build(w) { const { C, cap } = dbDesert(w, 3, 3), wk = dbWorker(w, [-1, 0, 10]);
    return (t) => { C.pose(t, 1); wk.pose(w.camera, { expr: 'grin', mode: 'stand', wave: 1 }); const u = dbU(w, t); w.look([-2, 3, 18], [-10 + u * 4, 8 + u * 6, -100], 46); cap(t); }; } },
  // 21. (112.9 s) the solar park fills in: 3,800 MW, more than 7,000 by 2030 (stat card)
  solar: { bg: '#5f7fc8', build(w) { const { C, cap } = dbDesert(w, 3, 3), P = w.add(dbSolar()); P.position.set(0, 0, -10);
    return (t) => { C.pose(t, 0.5); P.pose(p3Ramp(t, w.K('paneles') - 0.3, w.K('mw'))); const u = dbU(w, t); w.look([18 - u * 10, 14, 16], [0, 0, -26], 46); cap(t); }; } },
  // 22. (120.9 s) the whole board: four checks
  tablero: { bg: '#2a3f6e', build(w) { const cap = dbLabSet(w, 4, -1), b = w.add(dbBoard()); b.position.set(0, 2, 0);
    return (t) => { const n = ['agua', 'frio', 'tierra', 'energia'].filter((k) => t >= w.K(k)).length; b.draw(4, n, n < 4 ? n : -1, 'EL PLAN'); b.rotation.y = Math.sin(t * 0.6) * 0.08; w.look([0, 2, 31 - dbU(w, t) * 2], [0, 1.6, 0], 40); cap(t); }; } },
  // 23. (130.7 s) it has a price: brine back to the sea, the coast changes
  precio: { bg: '#2a3f6e', build(w) { const cap = dbLabSet(w, 4, -1), D = w.add(dbDesal()), s = dbLab3(w, 'MÁS SAL AL MAR', DB.red, [-2.2, -2.6, 0], 0.045, true), c = dbLab3(w, 'LA COSTA CAMBIA', DB.red, [2, 3.6, 0], 0.045);
    return (t) => { D.pose(t, 3); s.pose(dbPop(t, w.K('salmuera'))); c.pose(dbPop(t, w.K('costa'))); w.look([-3, 2, 30], [-1, -1, 0], 42); cap(t); }; } },
  // 24. (136.4 s) if the plan switches off: water stops, the cold ends, the city sinks back into the desert
  apaga: { bg: '#5f7fc8', build(w) { const { C, cap } = dbDesert(w, 4, -1);
    return (t) => { const kd = w.K('desierto'); C.pose(t, 1 - p3Ramp(t, kd - 1.5, kd + 0.6), 0); dbCityCam(w, dbU(w, t) * 0.5, 8); cap(t); }; } },
  // 25. (142.9 s) "you built a giant machine that must stay on forever": the city comes back lit
  maquina: { bg: '#5f7fc8', build(w) { const { C, cap } = dbDesert(w, 4, -1), m = dbLab3(w, '⚙️ MÁQUINA GIGANTE', DB.yellow, [2, 32, -60], 0.042);
    return (t) => { C.pose(t, p3Ramp(t, w.s.t0, w.K('maquina')), 1); m.pose(dbPop(t, w.K('maquina'))); dbCityCam(w, 1 - dbU(w, t), 6); cap(t); }; } },
  // 26. (148.7 s) would you live there? tell me below
  pregunta: { bg: '#5f7fc8', build(w) { const { C, cap } = dbDesert(w, 4, -1), wk = dbWorker(w, [-3, 0, 14]), a = dbLab3(w, 'DÍMELO ABAJO 👇', '#ffffff', [0, 3, 6], 0.045);
    return (t) => { C.pose(t, 1); wk.pose(w.camera, { expr: 'smile', mode: 'stand', wave: 1 }); a.pose(dbPop(t, w.K('abajo'))); w.look([-2, 3, 26], [0, 4, -60], 50); cap(t); }; } },
});
