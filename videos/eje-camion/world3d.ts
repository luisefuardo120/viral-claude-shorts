// World of "¿Por qué algunos camiones van con ruedas que no tocan el suelo?" (3D, the channel's diorama look). Prefix ec.
// Diorama, lens, captions and smooth materials come from styles/3d/diorama.ts.

const EC = { sky: '#5bb8f5', cab: '#e5484d', cabD: '#b8353a', trailer: '#2a3b5c', key: '#b6f23c', red: '#e5484d', tyre: '#1c1d22', rim: '#c9ced8', crack: '#141418', dust: '#c8b48a' };
const EC_FIX: Record<number, string> = { 0: '¿Por qué' };   // what Whisper wrote differently from the script
const EC_R = 0.52, EC_LANE = 2;   // wheel radius; the truck drives in the lane at z = +2 (the camera side)

// ---------- a wheel: tyre with tread grooves, rim, hub; dual = two side by side ----------
const ecWheel = (dual = false) => {
  const g = p3Group(), spin = p3Group(); g.add(spin);
  for (const dz of dual ? [-0.19, 0.19] : [0]) {
    spin.add(p3Mesh(new THREE.CylinderGeometry(EC_R, EC_R, 0.32, 28), dioSmooth(EC.tyre, 0.85), { p: [0, 0, dz], r: [Math.PI / 2, 0, 0] }));
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; spin.add(p3Mesh(p3Box(0.06, 0.04, 0.33), dioSmooth('#0e0f12', 0.9), { p: [Math.cos(a) * (EC_R - 0.005), Math.sin(a) * (EC_R - 0.005), dz], r: [0, 0, a] })); }
  }
  const side = dual ? 0.36 : 0.17;
  spin.add(p3Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 24), dioSmooth(EC.rim, 0.3, 0.5), { p: [0, 0, side], r: [Math.PI / 2, 0, 0] }), p3Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.12, 12), dioSmooth('#8d95a3', 0.3, 0.5), { p: [0, 0, side + 0.05], r: [Math.PI / 2, 0, 0] }));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; spin.add(p3Mesh(new THREE.SphereGeometry(0.025, 6, 4), dioSmooth('#5a606c', 0.4), { p: [Math.cos(a) * 0.2, Math.sin(a) * 0.2, side + 0.03] })); }
  return Object.assign(g, { spin });
};
// an axle: two wheels (left and right) and the beam; z sides at ±1.05
const ecAxle = (dual: boolean) => { const g = p3Group(), wl = ecWheel(dual), wr = ecWheel(dual); wl.position.z = 1.05; wr.position.z = -1.05; wr.rotation.y = Math.PI;
  g.add(wl, wr, p3Mesh(p3Cyl(0.08, 0.08, 2.1, 10), dioSmooth('#3a3f4a', 0.5), { r: [Math.PI / 2, 0, 0] })); return Object.assign(g, { wheels: [wl, wr] }); };

// ---------- the truck: an original tractor with a flatbed trailer; one trailer axle can lift ----------
const ecTruck = () => {
  const g = p3Group(), red = dioSmooth(EC.cab, 0.4), dark = dioSmooth('#2a2f3a', 0.6);
  // tractor cab: rounded box, windshield, grille, headlights, mirrors, sun visor, exhaust stacks, fuel tank
  const cab = p3Group(p3Mesh(new THREE.RoundedBoxGeometry(2.4, 2.6, 2.5, 3, 0.25), red, { p: [-1.2, 2.45, 0] }), p3Mesh(new THREE.RoundedBoxGeometry(1.1, 0.9, 2.4, 2, 0.2), red, { p: [0.1, 1.45, 0] }));
  cab.add(p3Mesh(new THREE.RoundedBoxGeometry(0.08, 1.0, 2.1, 2, 0.04), dioSmooth('#1b2433', 0.15), { p: [0.02, 2.85, 0], r: [0, 0, -0.08] }), p3Mesh(p3Box(0.5, 0.12, 2.4), red, { p: [-0.2, 3.45, 0] }));
  for (let i = 0; i < 5; i++) cab.add(p3Mesh(p3Box(0.05, 0.08, 1.4), dioSmooth('#c9ced8', 0.3, 0.6), { p: [0.67, 1.2 + i * 0.16, 0] }));
  for (const s of [1, -1]) {
    cab.add(p3Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 16), dioSmooth('#fff6c8', 0.2), { p: [0.68, 1.15, s * 0.95], r: [0, 0, Math.PI / 2], e: 0.4 }));
    cab.add(p3Mesh(p3Box(0.08, 0.5, 0.25), dark, { p: [-0.1, 2.9, s * 1.42] }), p3Mesh(p3Cyl(0.02, 0.02, 0.5, 6), dark, { p: [-0.1, 2.9, s * 1.3], r: [Math.PI / 2, 0, 0] }));
    cab.add(p3Mesh(p3Cyl(0.1, 0.1, 2.6, 12), dioSmooth('#c9ced8', 0.25, 0.7), { p: [-2.55, 2.6, s * 1.05] }));
    cab.add(p3Mesh(p3Cyl(0.32, 0.32, 1.1, 18), dioSmooth('#c9ced8', 0.3, 0.6), { p: [-2.6, 0.85, s * 1.15], r: [0, 0, Math.PI / 2] }));
  }
  g.add(cab, p3Mesh(p3Box(6.2, 0.3, 1.0), dark, { p: [-3.3, 0.85, 0] }), p3Mesh(p3Box(0.25, 0.35, 2.4), dark, { p: [0.65, 0.65, 0] }));
  // trailer: flatbed deck, side rails, red-white tape, landing legs, mudflaps
  const tr = p3Group(p3Mesh(p3Box(13.6, 0.35, 2.5), dioSmooth(EC.trailer, 0.5), { p: [-11.4, 1.45, 0] }), p3Mesh(p3Box(13.6, 0.12, 2.52), dioSmooth('#d7dbe3', 0.5), { p: [-11.4, 1.25, 0] }));
  for (let x = -17.8; x < -4.8; x += 1.0) for (const s of [1, -1]) tr.add(p3Mesh(p3Box(0.5, 0.1, 0.02), dioSmooth(x % 2 < 1 ? EC.red : '#f5f6f8', 0.5), { p: [x, 1.25, s * 1.27] }));
  for (const s of [1, -1]) tr.add(p3Mesh(p3Box(0.12, 1.0, 0.12), dark, { p: [-7.2, 0.7, s * 0.9] }), p3Mesh(p3Box(0.03, 0.55, 0.45), dark, { p: [-18.1, 0.55, s * 1.0] }));
  g.add(tr);
  // cargo: crates and a big wooden case, strapped (load 0..1 shows them)
  const cargo = p3Group(), R = p3Rnd(6), cols = ['#c98a4b', '#b07a42', '#d9a066'];
  for (let x = -17.2; x < -5.4; x += 1.55) { const h = 0.9 + R() * 0.9; cargo.add(p3Mesh(new THREE.RoundedBoxGeometry(1.4, h, 2.2, 2, 0.05), dioSmooth(cols[Math.floor(R() * 3)], 0.8), { p: [x, 1.62 + h / 2, 0] }), p3Mesh(p3Box(0.06, h + 0.02, 2.24), dioSmooth('#e9b949', 0.6), { p: [x, 1.62 + h / 2, 0] })); }
  g.add(cargo);
  // axles: steer, two drive, three on the trailer; the first trailer axle lifts, with its air bags
  const axles: { a: ReturnType<typeof ecAxle>; x: number; lift: boolean }[] = [[-1.4, false, false], [-4.6, true, false], [-5.9, true, false], [-14.0, true, true], [-15.3, true, false], [-16.6, true, false]].map(([x, dual, lift]) => {
    const a = ecAxle(dual as boolean); a.position.set(x as number, EC_R, 0); g.add(a); return { a, x: x as number, lift: lift as boolean }; });
  const bags = [1, -1].map((s) => { const b = p3Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1, 18), dioSmooth('#202228', 0.7), { p: [-14.0, 0.95, s * 0.55] }); g.add(b); return b; });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.05, 8, 40), dioSmooth(EC.key, 0.4)); (ring.material as THREE.MeshStandardMaterial).emissive.set(EC.key); g.add(ring); ring.position.set(-14.0, EC_R, 1.45);
  // dist: meters driven (wheels turn); lift 0..1 (the lift axle goes up); load 0..1 (cargo); glow 0..1 (the lift axle ring); bounce on the road
  const pose = (t: number, o: { dist?: number; lift?: number; load?: number; glow?: number } = {}) => {
    const d = o.dist ?? 0, lift = o.lift ?? 0, load = o.load ?? 1;
    axles.forEach(({ a, lift: canLift }) => { const up = canLift ? lift * 0.6 : 0; a.position.y = EC_R + up; a.wheels.forEach((w) => { w.spin.rotation.z = canLift && lift > 0.6 ? 0 : -d / EC_R; }); });
    bags.forEach((b) => { b.scale.y = 0.55 + 0.45 * (1 - lift) * 0.6 + 0.4 * lift; b.position.y = 0.95 + lift * 0.2; });
    cargo.visible = load > 0.02; cargo.scale.y = Math.max(0.01, load); cargo.position.y = (1 - load) * 1.6;
    ring.visible = (o.glow ?? 0) > 0.02; ring.scale.setScalar(Math.max(0.001, o.glow ?? 0)); ring.position.y = EC_R + lift * 0.6;
    tr.position.y = 0.02 * Math.sin(t * 7 + 1) * (d ? 1 : 0); cab.position.y = 0.03 * Math.sin(t * 6) * (d ? 1 : 0);
  };
  pose(0);
  return Object.assign(g, { pose, axles });
};

// ---------- the road and its extras ----------
// cracks in the asphalt under heavy wheels (amount 0..1 grows them)
const ecCracks = () => { const g = p3Group(), R = p3Rnd(31), lines: THREE.Mesh[] = [];
  for (let i = 0; i < 40; i++) { const m = p3Mesh(p3Box(0.6 + R() * 1.4, 0.02, 0.06), dioSmooth(EC.crack, 0.9), { p: [(R() - 0.5) * 18, 0.045, EC_LANE + (R() - 0.5) * 2.6], r: [0, R() * 3, 0] }); m.castShadow = false; g.add(m); lines.push(m); }
  return Object.assign(g, { pose: (u: number) => lines.forEach((m, i) => { m.visible = i / lines.length < u; }) }); };
// weight arrows pressing down on the axles; n arrows spread over the truck, size by how much each carries
const ecWeights = (xs: number[]) => { const g = p3Group(), arrows = xs.map((x) => { const a = p3Arrow([x, 4.6, EC_LANE + 1.6], [0, -1, 0], 1.6, EC.red, 0.12); g.add(a); return a; });
  return Object.assign(g, { pose: (grow: number, size = 1) => arrows.forEach((a) => { a.grow(grow); a.scale.setScalar(size); }) }); };
// dust and rubber bits flying back from a tyre (a loop); on 0..1
const ecDust = (n = 26) => { const R = p3Rnd(9), sw = p3Swarm(n, new THREE.SphereGeometry(0.07, 8, 6), dioSmooth(EC.dust, 0.9)), P = Array.from({ length: n }, () => ({ ph: R(), vy: 0.4 + R() * 0.8, vz: (R() - 0.5) * 0.8 }));
  return Object.assign(sw, { pose: (t: number, on: number) => { P.forEach((p, i) => { const u = (t * 1.8 + p.ph) % 1, s = on * (1 - u) * 1.5; if (s < 0.03) { sw.hide(i); return; } sw.put(i, -u * 2.2, p.vy * u, p.vz * u, s); }); sw.done(); } }); };
// cars in the other lane, looping (secondary motion)
const ecTraffic = () => { const g = p3Group(), cols = ['#1f5fd6', '#f2a03d', '#2fb36e', '#f5f6f8'];
  const cars = cols.map((c, i) => { const car = p3Group(p3Mesh(new THREE.RoundedBoxGeometry(3.6, 0.9, 1.7, 3, 0.3), dioSmooth(c, 0.35), { p: [0, 0.75, 0] }), p3Mesh(new THREE.RoundedBoxGeometry(1.9, 0.7, 1.55, 3, 0.25), dioSmooth('#1b2433', 0.2), { p: [-0.2, 1.45, 0] }));
    for (const [x, z] of [[1.15, 0.8], [-1.15, 0.8], [1.15, -0.8], [-1.15, -0.8]]) car.add(p3Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.25, 16), dioSmooth(EC.tyre, 0.8), { p: [x, 0.34, z], r: [Math.PI / 2, 0, 0] }));
    car.rotation.y = Math.PI; g.add(car); return { car, x0: i * 14 }; });
  return Object.assign(g, { pose: (t: number) => cars.forEach(({ car, x0 }) => { car.position.set(((((x0 - t * 9) % 56) + 56) % 56) - 28, 0.02, -EC_LANE); }) }); };
// the toll gantry over the road, with a sensor beam and a screen that counts axles
const ecToll = () => { const g = p3Group(), steel = dioSmooth('#c9ced8', 0.4, 0.4);
  for (const z of [-4.6, 4.6]) g.add(p3Mesh(p3Box(0.4, 6.4, 0.4), steel, { p: [0, 3.2, z] }));
  g.add(p3Mesh(p3Box(0.6, 0.6, 9.6), steel, { p: [0, 6.4, 0] }), p3Mesh(p3Box(0.4, 0.4, 0.5), dioSmooth('#2a2f3a', 0.5), { p: [0, 6, EC_LANE] }));
  const beam = p3Mesh(p3Box(0.05, 6, 0.05), new THREE.MeshBasicMaterial({ color: '#ff5b5b', transparent: true, opacity: 0.7 }), { p: [0, 3, EC_LANE + 1.4] }); g.add(beam);
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; let shown = -1;
  const screen = p3Mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshBasicMaterial({ map: tex }), { p: [0.32, 5.2, EC_LANE + 3.2], r: [0, Math.PI / 2, 0] });
  g.add(p3Mesh(p3Box(0.3, 1.5, 2.8), dioSmooth('#2a2f3a', 0.5), { p: [0.15, 5.2, EC_LANE + 3.2] }), screen);
  // n: axles counted so far; cheap: green when lower than full
  const pose = (t: number, n: number, cheap = false) => { beam.visible = Math.sin(t * 20) > -0.5; if (n === shown) return; shown = n; const c = cv.getContext('2d')!;
    c.fillStyle = '#0d1a14'; c.fillRect(0, 0, 256, 128); c.fillStyle = cheap ? '#b6f23c' : '#ff9a2e'; c.font = '900 44px "RA Heavy", sans-serif'; c.textAlign = 'center'; c.fillText('EJES', 128, 46); c.font = '900 64px "RA Heavy", sans-serif'; c.fillText(String(n), 128, 112); tex.needsUpdate = true; };
  return Object.assign(g, { pose }); };

// the highway diorama with the truck, traffic and light; returns the pieces and the captions
const ecHighway = (w: World) => {
  dioLights(w); w.add(dioDiorama({ w: 60, d: 32, props: false }));
  // props only behind the road (and at the far corners), so nothing stands between the camera and the truck
  const greens = ['#4caf3e', '#5cc24a', '#3f9a36', '#6acb55'];
  for (const [x, z, sc, i] of [[-24, -14, 7, 0], [-8, -14.5, 8.5, 1], [8, -14, 7.5, 2], [24, -14.2, 6.5, 3]]) { const h = new THREE.IcosahedronGeometry(1, 1); h.scale(sc * 1.2, sc * 0.75, sc * 0.3); w.add(p3Mesh(h, greens[i], { p: [x, 0, z] })); }
  [dioHouse([-16, 0, -8], 0.2), dioHouse([-2, 0, -8.5], -0.15, 0.9), dioHouse([12, 0, -8], 0.3, 0.95)].forEach((h) => w.add(h));
  for (const [x, z, sc, i] of [[-21, -7, 1.1, 0], [-9, -7.5, 0.9, 1], [5, -7, 1.2, 2], [18, -7.5, 1, 3], [27, -9, 1.1, 1], [-28, 13, 1.1, 2], [28, 13.5, 1, 0]]) w.add(dioTree([x, 0, z], sc, greens[i])); [[-14, 18, -34, 2.4], [16, 22, -40, 2.8], [34, 20, -20, 2]].forEach(([x, y, z, s]) => w.add(dioCloud([x, y, z], s)));
  const sun = w.add(dioSun()); sun.position.set(-24, 26, -60);
  const truck = w.add(ecTruck()), traffic = w.add(ecTraffic()); truck.position.z = EC_LANE;
  return { truck, traffic, cap: dioCaptions(w, EC_FIX) };
};

// ---------- world test shots ----------
defineVisuals({
  'test-truck': {   // loaded, all axles down; then empty with the lift axle up; glowing ring
    bg: EC.sky,
    build(w) { const { truck, traffic } = ecHighway(w), lens = dioLens(w, { x: 0.36, y: 0.2, r: 0.14 });
      return (t) => { const lt = t - w.s.t0, x = -4 + lt * 3; truck.position.x = x; truck.pose(t, { dist: lt * 3, load: lt < 1.5 ? 1 : 0, lift: p3Ramp(lt, 1.8, 2.3), glow: lt > 2.3 ? 1 : 0 }); traffic.pose(t);
        w.look([x - 2, 9, 34], [x - 8, 1.5, EC_LANE], 36); lens.pose([x - 14 + 1, 1.2, EC_LANE + 4.2], [x - 14, 0.7, EC_LANE + 1], 1, 30); }; },
  },
  'test-road': {   // cracks, weight arrows, dust, the toll counter
    bg: EC.sky,
    build(w) { const { truck } = ecHighway(w), cr = w.add(ecCracks()), wt = w.add(ecWeights([-1.4, -5.2, -15.3])), du = w.add(ecDust()), toll = w.add(ecToll()); toll.position.x = 6; du.position.set(-15.3, 0.1, EC_LANE + 1.3);
      return (t) => { const lt = t - w.s.t0; truck.position.x = 0; truck.pose(t, { dist: lt * 3 }); cr.pose(p3Ramp(lt, 0.3, 1.2)); wt.pose(p3Ramp(lt, 0.2, 0.7)); du.pose(t, 1); toll.pose(t, lt < 1.5 ? 6 : 5, lt >= 1.5); w.look([-4, 7, 30], [-6, 2, EC_LANE], 36); }; },
  },
});
