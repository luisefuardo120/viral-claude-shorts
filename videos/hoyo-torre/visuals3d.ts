// Scenes of "De hoyo a torre antitsunami", in the ink look. The beach in section is the same set all video; each scene adds one
// part of the tower. A change every 1-2 s (a part growing, a label, a cut); the loop scene ends on frame 0's shot.

const htPop = (t: number, k: number) => (t < k ? 0.001 : Math.max(0.001, p3Spring(t, k, 260, 16)));
const htU = (w: World, t: number) => p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0));
const htLab = (w: World, text: string, color: string, p: Vec3, h = 0.045, arrow = false) => { const l = w.add(dioLabel(text, color, h, arrow)); l.position.set(...p); return l; };
const HT_ALL = { piles: 1, legs: 1, plat: 1, stairs: 1, roof: 1 };
const htPitCam = (w: World, u = 0) => w.look([1 - u * 0.4, 2.5, 9 - u], [-1, -0.8, -3], 40);
const htTopCam = (w: World, u: number) => w.look([10 - u * 2, 16, 21], [0, 12, -4], 40);

defineVisuals({
  // 1. (0 s) digging the pit in the beach; at "torre" a flash of the finished tower in the flood; back to the pit: ¿QUÉ GOLPE AGUANTA?
  hook: {
    bg: '#5f7fc8',
    build(w) { const S = htSet(w, 0, 10), q = htLab(w, '¿QUÉ GOLPE AGUANTA?', HT.yellow, [-1, 1.2, -4], 0.042);
      return (t) => { const kf = w.K('flash'), kn = w.K('final'), flash = t >= kf && t < kn;
        if (flash) { htBuild(S, t, { ...HT_ALL, flood: 8 }); htWorker(S, w, t, HT_SAND, {}); S.worker.visible = false; htCrowd(S, w, t, 10, 1, true); htWide(w, 0.6); }
        else { S.worker.visible = true; htBuild(S, t, { dig: 0.45 + 0.2 * p3Clamp(t / kn) }); htWorker(S, w, t, [HT_IN_PIT[0], -HT_PIT * (0.45 + 0.2 * p3Clamp(t / kn)), HT_IN_PIT[2]], { expr: 'stern' }, true); htCrowd(S, w, t, 0); htPitCam(w, p3Clamp(t / kf)); }
        q.pose(htPop(t, kn + 0.15)); S.cap(t); }; },
  },
  // 2. (6.2 s) built on the sand: the quake turns it to soup, the tower sinks and tilts
  problema: {
    bg: '#5f7fc8',
    build(w) { const S = htSet(w, 0), soup = w.add(p3Mesh(new THREE.PlaneGeometry(30, 22, 30, 22), new THREE.MeshBasicMaterial({ color: '#8a6238', transparent: true, opacity: 0, depthWrite: false }), { p: [0, 0.04, -11], r: [-Math.PI / 2, 0, 0] })), no = htLab(w, '¡SE HUNDE!', HT.red, [0, 15, -4], 0.06);
      const pos = (soup.geometry as THREE.PlaneGeometry).attributes.position, base = Float32Array.from(pos.array as Float32Array);
      return (t) => { const kq = w.K('quake'), ks = w.K('sopa'), kh = w.K('hunde'), sink = p3Ramp(t, kh - 0.3, kh + 0.6);
        htBuild(S, t, { dig: 0, legs: 1, plat: 1 }); for (const o of [S.legs, S.plat]) { o.position.y = HT_PIT - 1 - sink * 3.5; o.rotation.z = -0.22 * sink; }
        S.legs.position.x = S.plat.position.x = sink * 1.5;
        (soup.material as THREE.MeshBasicMaterial).opacity = 0.65 * p3Ramp(t, ks - 0.2, ks + 0.4); for (let i = 0; i < pos.count; i++) pos.setZ(i, base[i * 3 + 2] + 0.12 * Math.sin(base[i * 3] * 1.3 + t * 7) * p3Ramp(t, ks, ks + 0.5)); pos.needsUpdate = true;
        htWorker(S, w, t, HT_SAND, { expr: t < kq ? 'neutral' : t < kh ? 'nervous' : 'shock' }); no.pose(htPop(t, kh + 0.2));
        const shake = t > kq && t < kh + 0.6 ? 1 : 0; w.look([7 + Math.sin(t * 37) * 0.4 * shake, 8 + Math.cos(t * 29) * 0.4 * shake, 32], [0, 4, -4], 40); S.cap(t); }; },
  },
  // 3. (10.7 s) step 1: steel piles driven 20 m down to the rock
  pilotes: {
    bg: '#5f7fc8',
    build(w) { const S = htSet(w, 0.2), d = htLab(w, '20 M', HT.yellow, [5.4, -11, 0.4], 0.05), r = htLab(w, 'ROCA', '#ffffff', [-8.5, -19.5, 0.4], 0.05);
      return (t) => { const kp = w.K('pilotes'), kr = w.K('roca'); htBuild(S, t, { piles: p3Ramp(t, kp - 0.2, kr) }); htWorker(S, w, t, HT_SAND, { expr: 'smile' });
        d.pose(htPop(t, kp + 0.8)); r.pose(htPop(t, kr)); htWide(w, htU(w, t)); S.cap(t); }; },
  },
  // 4. (14.4 s) step 2: the cap and four separate legs; the water passes between them
  patas: {
    bg: '#5f7fc8',
    build(w) { const S = htSet(w, 0.4), l = htLab(w, 'EL AGUA PASA', HT.key, [0, 6.5, -4], 0.05);
      return (t) => { const kp = w.K('patas'), ka = w.K('agua'); htBuild(S, t, { piles: 1, legs: p3Ramp(t, kp - 0.3, ka), flood: 3.5 * p3Ramp(t, ka - 0.2, ka + 0.6) }); htWorker(S, w, t, HT_SAND, { expr: 'neutral' });
        l.pose(htPop(t, ka + 0.3)); const u = htU(w, t); w.look([9 - u * 3, 4, 26], [0, 2, -4], 40); S.cap(t); }; },
  },
  // 5. (18.3 s) step 3: the platform at 11.5 m; the wave rises and stays below it
  plataforma: {
    bg: '#5f7fc8',
    build(w) { const S = htSet(w, 0.6), h = htLab(w, '11,5 M', HT.yellow, [-5.2, 6, -1], 0.055);
      return (t) => { const kp = w.K('plat'), ko = w.K('ola'); htBuild(S, t, { piles: 1, legs: 1, plat: p3Ramp(t, kp - 0.3, kp + 0.3), flood: 8 * p3Ramp(t, ko - 0.4, ko + 0.6) }); S.worker.visible = false;
        h.pose(htPop(t, kp + 0.4)); htWide(w, htU(w, t)); S.cap(t); }; },
  },
  // 6. (22.2 s) step 4, the trick: wide stairs on the outside; people climb them; 700 PERSONAS
  escaleras: {
    bg: '#5f7fc8',
    build(w) { const S = htSet(w, 0.8, 10), n = htLab(w, '700 PERSONAS', HT.yellow, [0, 14.5, -4], 0.055);
      return (t) => { const ke = w.K('escaleras'), kg = w.K('gente'); htBuild(S, t, { piles: 1, legs: 1, plat: 1, stairs: p3Ramp(t, ke - 0.4, ke + 0.8) });
        htWorker(S, w, t, HT_SAND, { expr: 'smile' }); htCrowd(S, w, t, 10, Math.max(0, (t - ke - 0.6) * 0.75)); n.pose(htPop(t, kg));
        const u = htU(w, t); w.look([15 - u * 2, 9, 24], [2, 6.5, -4], 42); S.cap(t); }; },
  },
  // 7. (26.8 s) step 5: railings and the roof
  techo: {
    bg: '#5f7fc8',
    build(w) { const S = htSet(w, 1, 10);
      return (t) => { const kt = w.K('techo'); htBuild(S, t, { piles: 1, legs: 1, plat: 1, stairs: 1, roof: p3Ramp(t, kt - 0.5, kt + 0.5) }); S.worker.visible = false; htCrowd(S, w, t, 10, 1, true); htTopCam(w, htU(w, t)); S.cap(t); }; },
  },
  // 8. (28.7 s) the prize: the flood; a 10-ton boat rides in and hits a leg; the tower holds
  premio: {
    bg: '#5f7fc8',
    build(w) { const S = htSet(w, 1, 10), b = htLab(w, '10 TONELADAS', '#ffffff', [0, 0, 0], 0.036);
      return (t) => { const kb = w.K('barco'), ks = w.K('stat'), hit = t >= ks, a = p3Clamp((t - kb + 0.6) / (ks - kb + 0.6)), z = hit ? -11.2 - 1.6 * p3Ramp(t, ks, ks + 0.5) : -45 + 33.8 * a * a;
        htBuild(S, t, { ...HT_ALL, flood: 8, speed: 1.6 }); S.worker.visible = false; htCrowd(S, w, t, 10, 1, false);
        S.boat.visible = t > kb - 0.6; S.boat.position.set(3, 7.7 + 0.15 * Math.sin(t * 3), z); S.boat.rotation.x = hit ? -0.12 * Math.exp(-(t - ks) * 3) * Math.sin((t - ks) * 18) : 0.04 * Math.sin(t * 2);
        b.position.set(3, 10.6, z + 1); b.pose(S.boat.visible ? htPop(t, kb) : 0.001);
        const sh = hit ? Math.exp(-(t - ks) * 4) : 0, u = htU(w, t); w.look([24 - u * 3 + Math.sin(t * 41) * sh, 10 + Math.cos(t * 33) * sh, 14], [0, 5, -8], 42); S.cap(t); }; },
  },
  // 9. (34.2 s) would you climb or run? tell me below
  pregunta: {
    bg: '#5f7fc8',
    build(w) { const S = htSet(w, 1, 10), a = htLab(w, '¿SUBIRÍAS?', HT.key, [-1.5, 15.8, -4], 0.05), b = htLab(w, '¿O CORRERÍAS?', HT.yellow, [1.5, 14.6, -4], 0.05), c = htLab(w, 'DÍMELO ABAJO', '#ffffff', [0, 8.5, -1], 0.042);
      return (t) => { htBuild(S, t, { ...HT_ALL, flood: 6 * (1 - htU(w, t) * 0.5) }); S.worker.visible = false; htCrowd(S, w, t, 10, 1, true);
        a.pose(htPop(t, w.K('subir'))); b.pose(htPop(t, w.K('correr'))); c.pose(htPop(t, w.K('abajo'))); htTopCam(w, 1 - htU(w, t)); S.cap(t); }; },
  },
  // 10. (36.5 s) "y todo empezó con…" — frame 0's shot again, so it loops
  loop: {
    bg: '#5f7fc8',
    build(w) { const S = htSet(w, 0);
      return (t) => { htBuild(S, t, { dig: 0.45 }); htWorker(S, w, t, [HT_IN_PIT[0], -HT_PIT * 0.45, HT_IN_PIT[2]], { expr: 'stern' }, true); htPitCam(w, 0); S.cap(t); }; },
  },
});
