// Scenes of "¿Para qué son los pinchos de las alas del avión?": each one only assembles the world (world3d.ts).
// Times are absolute video seconds; every scene adds the word captions.

const paU = (w: World, t: number) => p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0));
const paGrow = (t: number, k: number) => p3Ramp(t, k, k + 0.5);
const paPop = (t: number, k: number) => Math.max(0.001, p3Spring(t, k, 230, 15));
// the whole plane, three-quarter from the front (it fits the vertical frame)
const paWide = (w: World, u: number, d = 34) => w.look([16 - u * 3, 7, d], [0, 0.4, 0], 36);
// the lens sits on the right, inside the safe zone, between the title and the captions
const paLens = (w: World) => dioLens(w, { x: 0.36, y: 0.2, r: 0.14 });   // between the title (ends ~y 420) and the captions (~y 1110)
// where the lens looks at a wick: a little behind and above its tip
const paWickView = (plane: Parameters<typeof paWickEnds>[0], i: number): [Vec3, Vec3] => { const { b } = paWickEnds(plane, i); return [[b.x - 0.55, b.y + 0.3, b.z + 0.65], [b.x + 0.12, b.y - 0.02, b.z]]; };
// the radio sits far below the scene, where only the lens sees it
const paRadioSet = (w: World) => { const r = w.add(paRadio()); r.position.set(0, -80, 0); return r; };
const PA_RADIO_VIEW: [Vec3, Vec3] = [[0, -80, 4.4], [0, -80, 0]];

defineVisuals({
  // 1. what are these spikes for? the lens opens on the wing's trailing edge
  hook: {
    bg: PA.sky,
    build(w) { const { plane, clouds, cap } = paSkySet(w), lens = paLens(w);
      return (t) => { const lt = t - w.s.t0, k = w.K('lupa'); clouds(lt); plane.wickGlow(paGrow(t, k)); paWide(w, paU(w, t));
        const [a, b] = paWickView(plane, 1); lens.pose(a, b, paPop(t, k)); cap(t); }; },
  },
  // 2. rubbing against air, rain and ice, it charges up
  carga: {
    bg: PA.sky,
    build(w) { const { plane, clouds, cap } = paSkySet(w), rain = w.add(paRain()), ch = w.add(paCharge());
      return (t) => { const lt = t - w.s.t0; clouds(lt, 9); plane.wickGlow(0); rain.pose(t, paGrow(t, w.K('lluvia')));
        ch.pose(t, p3Ramp(t, w.K('lluvia'), w.K('carga') + 0.5)); w.look([9 - paU(w, t) * 2, 2.5, 25], [-0.5, 0.2, 0], 36); cap(t); }; },
  },
  // 3. like a balloon rubbed on your hair
  globo: {
    bg: PA.sky,
    build(w) { dioLights(w); dioSkyBack(w); const b = w.add(paBalloon()), cap = dioCaptions(w, PA_FIX), R = p3Rnd(4), n = 70;
      const sw = w.add(p3Swarm(n, new THREE.OctahedronGeometry(0.07, 0), new THREE.MeshBasicMaterial({ color: PA.charge }))), P = Array.from({ length: n }, () => new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize().multiplyScalar(1.04));
      return (t) => { const lt = t - w.s.t0, amt = p3Ramp(t, w.K('frota') - 0.3, w.K('frota') + 0.4); b.position.y = 0.6 + 0.12 * Math.sin(lt * 2); b.rotation.z = 0.08 * Math.sin(lt * 1.3);
        P.forEach((p, i) => { const k = i / n < amt ? 0.6 + 0.6 * Math.abs(Math.sin(t * 6 + i)) : 0; if (k < 0.05) sw.hide(i); else sw.put(i, p.x * 0.9, p.y * 1.05 + b.position.y, p.z * 0.9 + 0.05, k, k, k, t + i, i, 0); }); sw.done();
        w.look([0.6, 0.6, 9], [0, 0.2, 0], 36); cap(t); }; },
  },
  // 4. but it's up in the air, it doesn't touch the ground: a dashed line down to the diorama, crossed out
  suelo: {
    bg: PA.sky,
    build(w) { const { plane, clouds, cap } = paSkySet(w), ch = w.add(paCharge()), land = w.add(dioDiorama()); land.scale.setScalar(0.45); land.position.set(0, -24, -6);
      const dots = Array.from({ length: 14 }, (_, i) => w.add(p3Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: PA.charge }), { p: [0, -1.4 - i * 1.6, 0] })));
      const x = w.add(p3Group(...[0.785, -0.785].map((r) => p3Mesh(p3Box(4, 0.7, 0.3), dioSmooth(PA.red, 0.4), { r: [0, 0, r] })))); x.position.set(0, -13, 2);
      return (t) => { const lt = t - w.s.t0, k = w.K('suelo'); clouds(lt, 3); ch.pose(t, 1); dots.forEach((d, i) => { d.visible = i / dots.length < p3Ramp(t, w.s.t0 + 0.3, k - 0.2); });
        x.scale.setScalar(paPop(t, k)); x.visible = t >= k; w.look([34, -2, 66], [0, -5, 0], 36); cap(t); }; },
  },
  // 5. when it finally jumps, it's in sparks, and they put noise in the radio
  chispa: {
    bg: PA.storm,
    build(w) { const { plane, clouds, cap } = paSkySet(w), ch = w.add(paCharge()), arcs = [1, 2, 4].map((i) => ({ i, a: w.add(paArc(PA.charge, 0.03, i)) })), radio = paRadioSet(w), lens = paLens(w);
      return (t) => { const lt = t - w.s.t0, kc = w.K('chispa'), kr = w.K('radio'); clouds(lt, 9); ch.pose(t, 1);
        arcs.forEach(({ i, a }) => { const { b } = paWickEnds(plane, i); a.pose(t, [b.x + 0.3, b.y, b.z], [b.x - 1.4, b.y + 0.5 + 0.2 * Math.sin(i), b.z + 0.4], t > kc ? 1 : 0, 0.3); });
        radio.pose(t, 1); w.look([-5, 5, 22], [-1, -0.6, 2], 36); lens.pose(...PA_RADIO_VIEW, paPop(t, kr)); cap(t); }; },
  },
  // 6. so you put these rods on the edges of the wings and the tail
  varillas: {
    bg: PA.sky,
    build(w) { const { plane, clouds, cap } = paSkySet(w);
      return (t) => { const lt = t - w.s.t0, k = w.K('pon'); clouds(lt); plane.wickGlow(1, paPop(t, k));
        const a = p3Lerp(0.9, 2.3, paU(w, t)); w.look([Math.cos(a) * 30, 10, Math.sin(a) * 30], [0, 0.3, 0], 36); cap(t); }; },
  },
  // 7. they end in a point: through the tip it leaves easily, bit by bit, with no sparks; the radio is clean again
  punta: {
    bg: PA.sky,
    build(w) { const { plane, clouds, cap } = paSkySet(w), co = w.add(paCorona(46)), radio = paRadioSet(w), lens = paLens(w);
      return (t) => { const lt = t - w.s.t0; clouds(lt); plane.wickGlow(1); const { a, b } = paWickEnds(plane, 1);
        co.pose(t, a, b, paGrow(t, w.K('punta'))); radio.pose(t, 0); w.look([b.x - 2.3 - paU(w, t) * 0.3, b.y + 0.25, b.z + 1.2], [b.x - 0.4, b.y + 0.05, b.z], 34);   // from behind the wing, close on the tip
        lens.pose(...PA_RADIO_VIEW, paPop(t, w.K('suave'))); cap(t); }; },
  },
  // 8. those are static dischargers: the whole plane, every wick glowing
  nombre: {
    bg: PA.sky,
    build(w) { const { plane, clouds, cap } = paSkySet(w);
      return (t) => { clouds(t - w.s.t0); plane.wickGlow(0.6 + 0.4 * Math.sin((t - w.K('nombre')) * 6)); w.look([12, -5, 30 - paU(w, t) * 3], [0, 0.6, 0], 36); cap(t); }; },
  },
  // 9. but they're not lightning rods: a storm gathers
  pararrayos: {
    bg: PA.storm,
    build(w) { const { plane, clouds, cap } = paSkySet(w, true), far = w.add(paArc(PA.bolt, 0.12, 9));
      return (t) => { clouds(t - w.s.t0, 4); plane.wickGlow(0.3); far.pose(t, [-16, 18, -24], [-12, 2, -24], Math.sin(t * 9) > 0.6 ? 1 : 0, 1.2); w.look([-8, 6, 32], [0, 2, 0], 36); cap(t); }; },
  },
  // 10. a plane gets about one strike a year: the bolt hits the nose
  rayo: {
    bg: PA.storm,
    build(w) { const { plane, clouds, cap } = paSkySet(w, true), bolt = w.add(paArc(PA.bolt, 0.1, 3));
      return (t) => { const k = w.K('stat'); clouds(t - w.s.t0, 4); bolt.pose(t, [8, 12, 1], [6.15, 0.35, 0], t > k - 0.05 && t < k + 0.5 ? 1 : 0, 0.8); w.look([14, 6, 30], [2, 2.5, 0], 36); cap(t); }; },
  },
  // 11. it runs along the metal skin, outside, and leaves from another point
  piel: {
    bg: PA.storm,
    build(w) { const { plane, clouds, cap } = paSkySet(w, true), cur = paCurrent(), out = w.add(paArc(PA.bolt, 0.08, 5)); plane.add(cur);
      return (t) => { const kc = w.K('corre'), ks = w.K('sale'); clouds(t - w.s.t0, 4); cur.pose((t - kc) / (ks - kc), 1);
        out.pose(t, [-5.2, 3.1, 0], [-11, -3, 1], t > ks && t < ks + 0.5 ? 1 : 0, 0.8); w.look([2, 4, 27], [0, 0.5, 0], 36); cap(t); }; },
  },
  // 12. so that's what the spikes are for: the plane flies off over the diorama, its wicks glowing softly
  cierre: {
    bg: PA.sky,
    build(w) { const { plane, clouds, cap } = paSkySet(w), land = w.add(dioDiorama()); land.scale.setScalar(0.6); land.position.set(-6, -22, -10); const sun = w.add(dioSun()); sun.position.set(-20, 16, -50);
      return (t) => { const u = paU(w, t); clouds(t - w.s.t0, 4); plane.wickGlow(0.5 + 0.3 * Math.sin(t * 3)); plane.position.set(u * 6, u * 1.5, -u * 4); w.look([22 + u * 6, 4, 34 + u * 6], [u * 4, -3, -2], 36); cap(t); }; },
  },
});
