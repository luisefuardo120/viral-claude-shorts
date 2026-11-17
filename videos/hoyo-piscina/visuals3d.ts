// Scenes of "De hoyo a piscina". The cutaway yard is the same set all video; each scene adds one layer of the build.
// A change every 1-2 s (a layer growing, a label, a cut); the loop scene ends on frame 0's shot. Times are absolute seconds.

const hpPop = (t: number, k: number) => (t < k ? 0.001 : Math.max(0.001, p3Spring(t, k, 260, 16)));
const hpU = (w: World, t: number) => p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0));
const HP_IN: Vec3 = [-0.6, -HP_D * 0.6, -1.0], HP_EDGE: Vec3 = [-1.85, 0, -0.4], HP_PIT: Vec3 = [-1.2, -HP_D, -0.8], HP_PIT2: Vec3 = [-1.2, -HP_D + HP_SHELL, -0.8];   // worker: inside the hole / on the grass at the left
const hpLab = (w: World, text: string, color: string, p: Vec3, h = 0.045, arrow = false) => { const l = w.add(dioLabel(text, color, h, arrow)); l.position.set(...p); return l; };

defineVisuals({
  // 1. (0 s) the worker digging; at "piscina" a flash of the finished pool; back to the hole: AL FINAL ¿CUÁNTOS LITROS?
  hook: {
    bg: HP.sky,
    build(w) { const S = hpSet(w, 0), fin = hpLab(w, '¿CUÁNTOS LITROS?', HP.yellow, [-0.1, 0.9, -2], 0.04);
      return (t) => { const kf = w.K('flash'), kn = w.K('final'), flash = t >= kf && t < kn;
        if (flash) { hpBuild(S, t, { rebar: 1, pipes: 1, shell: 1, finish: 1, water: 0.92 }); hpWorker(S, w, t, HP_EDGE, { expr: 'grin', mode: 'stand', wave: 1 }); hpCut(w, 0.5, 0, 12, 0.6); }
        else { hpBuild(S, t, { dig: 0.55 + 0.1 * p3Clamp(t / kf) + (t >= kn ? 0.15 : 0) }); hpWorker(S, w, t, HP_IN, { expr: 'stern', mode: 'stand' }, 'shovel'); hpCut(w, t < kn ? p3Clamp(t / kf) : 0.5 + 0.3 * p3Clamp((t - kn) / 2)); }
        fin.pose(hpPop(t, kn + 0.2)); S.cap(t); }; },
  },
  // 2. (5.8 s) pour the water in the bare hole: the soil drinks it, the walls crumble
  problema: {
    bg: HP.sky,
    build(w) { const S = hpSet(w, 0), no = hpLab(w, '¡NO!', HP.red, [0, 0.6, -2], 0.06);
      return (t) => { const ka = w.K('agua'), kc = w.K('chupa'), kx = w.K('cae'), fill = 0.35 * p3Ramp(t, ka, ka + 1) - 0.2 * p3Ramp(t, kc, kc + 0.8);
        hpBuild(S, t, { water: fill, collapse: p3Ramp(t, kx, kx + 0.6), wet: p3Ramp(t, kc, kc + 0.6) });
        hpWorker(S, w, t, HP_PIT, { expr: t < kc ? 'whistle' : t < kx ? 'nervous' : 'shock', mode: 'stand' }, t < kx ? 'hose' : null);
        no.pose(hpPop(t, kx + 0.15)); if (t < kc) hpCut(w, 0.6, -0.4, 9.5, 0); else w.look([0.6, 1.6, 6.5], [0, -0.9, -2], 36); S.cap(t); }; },
  },
  // 3. (9.7 s) step 1: the steel cage grows rod by rod; ESQUELETO
  acero: {
    bg: HP.sky,
    build(w) { const S = hpSet(w, 0.2), lab = hpLab(w, 'ESQUELETO', HP.key, [0, 0.4, -3], 0.05, true);
      return (t) => { const kj = w.K('jaula'), ke = w.K('esqueleto'); hpBuild(S, t, { rebar: p3Ramp(t, w.s.t0 + 0.2, ke) });
        hpWorker(S, w, t, HP_PIT, { expr: 'smile', mode: 'stand' }); lab.pose(hpPop(t, ke));
        const u = hpU(w, t); if (t < kj) hpCut(w, 0.3); else w.look([-3.2 + u * 1.2, 3.4, 6.5], [0, -0.9, -3], 36); S.cap(t); }; },
  },
  // 4. (13.5 s) step 2: the pipes under the floor to the pump; ENTRA / SALE
  tubos: {
    bg: HP.sky,
    build(w) { const S = hpSet(w, 0.4), a = hpLab(w, 'SALE', HP.yellow, [0.1, -1.1, -2.5], 0.04, true), b = hpLab(w, 'ENTRA', HP.key, [1.6, -0.15, -1.2], 0.04, true);
      return (t) => { const kt = w.K('tubos'), kf = w.K('flujo'); hpBuild(S, t, { rebar: 1, pipes: p3Ramp(t, kt - 0.4, kt + 0.6) });
        hpWorker(S, w, t, HP_PIT, { expr: 'neutral', mode: 'stand' }); b.pose(hpPop(t, kf)); a.pose(hpPop(t, kf + 0.4));
        const u = hpU(w, t); if (t < kt) w.look([-1.5, 2.6, 7], [0.3, -0.9, -2.5], 36); else w.look([3.2 - u, 1.0, 5.6], [1, -0.9, -2.2], 36); S.cap(t); }; },
  },
  // 5. (17.9 s) step 3: concrete sprayed with a hose over the steel; the shell grows
  hormigon: {
    bg: HP.sky,
    build(w) { const S = hpSet(w, 0.6);
      return (t) => { const ks = w.K('spray'), kc = w.K('cubre'); hpBuild(S, t, { rebar: 1, pipes: 1, shell: p3Ramp(t, ks, kc + 0.5) });
        hpWorker(S, w, t, HP_PIT, { expr: 'stern', mode: 'stand' }, 'hose');
        const tgt = new THREE.Vector3(Math.sin(t * 1.7) * 1.3, -1.2, -2.5 + Math.cos(t * 1.3) * 1.5); S.spray.pose(t, new THREE.Vector3(HP_EDGE[0] + 0.55, 1.0, HP_EDGE[2] + 0.2), tgt, t > ks && t < kc + 0.5 ? 1 : 0);
        const u = hpU(w, t); if (t < kc) hpCut(w, u, -0.5, 9.5); else w.look([2.8, 2.6, 6.5], [-0.3, -0.9, -2.5], 36); S.cap(t); }; },
  },
  // 6. (21.9 s) step 4: bare concrete lets water through (red); the waterproof finish covers it; IMPERMEABLE
  acabado: {
    bg: HP.sky,
    build(w) { const S = hpSet(w, 0.8), leak = hpLab(w, 'SE FILTRA', HP.red, [-1.5, -0.45, -1.5], 0.042, true), ok = hpLab(w, 'IMPERMEABLE', HP.key, [0, 0.3, -3], 0.05, true);
      return (t) => { const kf = w.K('fuga'), kc = w.K('capa'), fin = p3Ramp(t, kc - 0.6, kc + 0.3);
        hpBuild(S, t, { rebar: 1, pipes: 1, shell: 1, finish: fin, water: t < kc - 0.6 ? 0.35 * p3Ramp(t, w.s.t0, kf) : 0, collapse: 0 });
        hpWorker(S, w, t, [0.9, -HP_D + HP_SHELL, -3.2], { expr: t < kf ? 'neutral' : t < kc ? 'nervous' : 'relief', mode: 'stand' });
        leak.pose(t < kc - 0.6 ? hpPop(t, kf + 0.1) : 0.001); ok.pose(hpPop(t, kc + 0.3));
        if (t < kc - 0.6) w.look([-0.6, 0.4, 4.8], [-1.6, -0.9, -1], 36); else hpCut(w, 0.5); S.cap(t); }; },
  },
  // 7. (26 s) step 5: the pool fills up; 1-2 DÍAS
  agua: {
    bg: HP.sky,
    build(w) { const S = hpSet(w, 1), lab = hpLab(w, '1–2 DÍAS', HP.yellow, [0, 0.8, -3], 0.055);
      return (t) => { const kl = w.K('llena'), kd = w.K('dias'); hpBuild(S, t, { rebar: 1, pipes: 1, shell: 1, finish: 1, water: 0.05 + 0.87 * p3Ramp(t, kl, kl + 2.4) });
        hpWorker(S, w, t, HP_EDGE, { expr: 'grin', mode: 'stand' }, t < kl + 2 ? 'hose' : null); lab.pose(hpPop(t, kd));
        const u = hpU(w, t); hpCut(w, u, 0, 11, 0.4); S.cap(t); }; },
  },
  // 8. (29.2 s) the prize: 8 m, 4 m, 1,5 m pop one by one; the stat card 48.000 L
  premio: {
    bg: HP.sky,
    build(w) { const S = hpSet(w, 1), L = hpLab(w, '8 m', HP.yellow, [1.6, 0.25, -4.5], 0.05), A = hpLab(w, '4 m', HP.yellow, [0.4, 0.25, -0.4], 0.05), H = hpLab(w, '1,5 m', HP.yellow, [-1.2, -0.75, -0.2], 0.05), B = hpLab(w, '≈ 300 BAÑERAS', '#ffffff', [0, 0.05, -4], 0.05);
      return (t) => { hpBuild(S, t, { rebar: 1, pipes: 1, shell: 1, finish: 1, water: 0.92 }); hpWorker(S, w, t, HP_EDGE, { expr: 'smile', mode: 'stand' });
        const kb = w.K('banera'), m = t < kb ? 1 : 0.001; L.pose(hpPop(t, w.K('largo')) * m); A.pose(hpPop(t, w.K('ancho')) * m); H.pose(hpPop(t, w.K('hondo')) * m); B.pose(hpPop(t, kb));
        const u = hpU(w, t); w.look([1.4 - u * 0.6, 4.6, 8.5], [-0.2, -1.3, -3.5], 40); S.cap(t); }; },
  },
  // 9. (34.2 s) slide or jacuzzi? tell me below
  pregunta: {
    bg: HP.sky,
    build(w) { const S = hpSet(w, 1), a = hpLab(w, '¿TOBOGÁN?', HP.key, [-0.5, 1.2, -3.5], 0.042), b = hpLab(w, '¿JACUZZI?', HP.yellow, [0.6, 0.55, -3.5], 0.042), c = hpLab(w, 'DÍMELO ABAJO', '#ffffff', [0, -0.4, -1.5], 0.04);
      return (t) => { hpBuild(S, t, { rebar: 1, pipes: 1, shell: 1, finish: 1, water: 0.92 }); hpWorker(S, w, t, HP_EDGE, { expr: 'laugh', mode: 'stand', wave: 1 });
        a.pose(hpPop(t, w.K('tobogan'))); b.pose(hpPop(t, w.K('jacuzzi'))); c.pose(hpPop(t, w.K('abajo')));
        hpCut(w, hpU(w, t), -0.4, 11.5, 0.3); S.cap(t); }; },
  },
  // 10. (37.4 s) "y todo empezó con…" — frame 0's shot again, so it loops
  loop: {
    bg: HP.sky,
    build(w) { const S = hpSet(w, 0);
      return (t) => { hpBuild(S, t, { dig: 0.55 }); hpWorker(S, w, t, HP_IN, { expr: 'stern', mode: 'stand' }, 'shovel'); hpCut(w, 0); S.cap(t); }; },
  },
});
