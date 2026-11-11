// World of "¿Por qué el tren no se sale en las curvas?" (3D, the channel's diorama look). See plan.md. Prefix tc.

const TC = { white: '#f5f6f8', teal: '#14b3a6', glass: '#1b2433', steel: '#c3c9d4', steelD: '#7d8594', wood: '#8a5a3b', key: '#b6f23c', red: '#e5484d', spark: '#ff9a2e', sky: '#5bb8f5' };

// ---------- the track's path: an oval of two 24 m straights and two 9 m-radius curves (turning left) ----------
const TC_S = 24, TC_RAD = 9, TC_P = 2 * TC_S + 2 * Math.PI * TC_RAD;
// position, heading and left side at distance s along the oval (the inside of the curves is on the left)
const tcPath = (s: number) => {
  let d = ((s % TC_P) + TC_P) % TC_P; const C = Math.PI * TC_RAD;
  let p: THREE.Vector3, t: THREE.Vector3;
  if (d < TC_S) { p = new THREE.Vector3(-TC_S / 2 + d, 0, TC_RAD); t = new THREE.Vector3(1, 0, 0); }
  else if ((d -= TC_S) < C) { const a = d / TC_RAD; p = new THREE.Vector3(TC_S / 2 + TC_RAD * Math.sin(a), 0, TC_RAD * Math.cos(a)); t = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)); }
  else if ((d -= C) < TC_S) { p = new THREE.Vector3(TC_S / 2 - d, 0, -TC_RAD); t = new THREE.Vector3(-1, 0, 0); }
  else { const a = (d - TC_S) / TC_RAD; p = new THREE.Vector3(-TC_S / 2 - TC_RAD * Math.sin(a), 0, -TC_RAD * Math.cos(a)); t = new THREE.Vector3(-Math.cos(a), 0, Math.sin(a)); }
  return { p, t, left: new THREE.Vector3(t.z, 0, -t.x) };
};
const tcYaw = (t: THREE.Vector3) => Math.atan2(-t.z, t.x);   // rotation.y that turns +x toward t
const TC_G = 1.5, TC_BALLAST = 0.22, TC_RAIL = 0.52;   // gauge on the oval, ballast height, rail top height

// gravel: stones of grey shades (cells), dark gaps between them
// k: stones per meter (finer for the close-ups)
const tcGravelMat = (k = 11) => p3Shader(new THREE.MeshStandardMaterial({ roughness: 0.95 }), 'tc-gravel-' + k, { bump: 0.03, uniforms: { uK: { value: k } }, color: `
  vec3 v = p3V(p3World.xz * uK + p3World.y * 3.0); float gap = smoothstep(0.02, 0.12, v.y - v.x);
  diffuseColor.rgb = mix(vec3(0.04), mix(vec3(0.16, 0.16, 0.17), vec3(0.62, 0.62, 0.64), v.z), gap); p3Ht = gap * (1.0 - v.x);` });

// ---------- the track along the oval: ballast, sleepers, two rails ----------
const tcTrack = () => {
  const g = p3Group(), N = 420, prof: [number, number][] = [[-2.1, 0.01], [-1.55, TC_BALLAST], [1.55, TC_BALLAST], [2.1, 0.01]];
  const pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= N; i++) { const { p, left } = tcPath((i / N) * TC_P); for (const [o, y] of prof) pos.push(p.x + left.x * o, y, p.z + left.z * o); }
  for (let i = 0; i < N; i++) for (let j = 0; j < 3; j++) { const a = i * 4 + j, b = a + 4; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setIndex(idx); bg.computeVertexNormals();
  const ballast = new THREE.Mesh(bg, tcGravelMat()); ballast.receiveShadow = true; g.add(ballast);
  const n = Math.floor(TC_P / 0.6), sl = p3Swarm(n, new THREE.BoxGeometry(0.26, 0.12, 2.5), dioSmooth(TC.wood, 0.85), true);
  for (let i = 0; i < n; i++) { const { p, t } = tcPath(i * 0.6); sl.put(i, p.x, TC_BALLAST + 0.05, p.z, 1, 1, 1, 0, tcYaw(t), 0); }
  sl.done(); g.add(sl);
  for (const side of [-1, 1]) {
    const pts = Array.from({ length: N }, (_, i) => { const { p, left } = tcPath((i / N) * TC_P); return p.add(left.multiplyScalar((side * TC_G) / 2)).setY(TC_RAIL - 0.05); });
    const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), N, 0.065, 8, true), dioSmooth(TC.steel, 0.3, 0.6)); rail.castShadow = true; g.add(rail);
  }
  return g;
};

// ---------- the train: two original cars with rounded noses, riding the oval ----------
const TC_CAR = 9;
const tcCar = (nose: 1 | -1 | 0) => {
  const g = p3Group(), body = dioSmooth(TC.white, 0.35);
  g.add(p3Mesh(new THREE.RoundedBoxGeometry(TC_CAR, 2.7, 2.6, 4, 0.42), body, { p: [0, 0, 0] }));
  g.add(p3Mesh(new THREE.RoundedBoxGeometry(TC_CAR - 0.8, 0.6, 2.64, 2, 0.12), dioSmooth(TC.glass, 0.2), { p: [0, 0.42, 0] }));
  g.add(p3Mesh(p3Box(TC_CAR - 0.4, 0.2, 2.63), dioSmooth(TC.teal, 0.4), { p: [0, -0.42, 0] }));
  g.add(p3Mesh(p3Box(TC_CAR - 1.2, 0.5, 2.3), dioSmooth('#2a2f3a', 0.7), { p: [0, -1.45, 0] }));
  if (nose) {
    const prof = Array.from({ length: 13 }, (_, i) => { const u = i / 12; return [1.28 * Math.sqrt(1 - u * u), u * 3.0]; }) as number[][];
    const ng = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(Math.max(0.001, r), y)), 40); ng.rotateZ(-Math.PI / 2); ng.scale(1, 1.06, 1);
    const n = new THREE.Mesh(ng, body); n.position.x = (nose * TC_CAR) / 2 - nose * 0.05; n.scale.x = nose; n.castShadow = true; g.add(n);
    const wind = new THREE.Mesh(new THREE.SphereGeometry(1.0, 24, 12, 0, Math.PI * 2, 0, Math.PI / 3.2), dioSmooth(TC.glass, 0.15)); wind.rotation.z = -nose * 1.05; wind.scale.set(1, 1, 1.15); wind.position.set(nose * (TC_CAR / 2 + 0.75), 0.15, 0); g.add(wind);
    g.add(p3Mesh(p3Box(2.6, 0.2, 2.0), dioSmooth(TC.teal, 0.4), { p: [nose * (TC_CAR / 2 + 0.9), -0.42, 0], s: [1, 1, 1] }));
  }
  for (const x of [-1, 1]) {   // bogies with four little wheels each
    const b = p3Group(p3Mesh(p3Box(2.4, 0.35, 1.9), dioSmooth('#30343e', 0.7)));
    for (const [dx, dz] of [[-0.75, 0.78], [0.75, 0.78], [-0.75, -0.78], [0.75, -0.78]]) b.add(p3Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.14, 18), dioSmooth(TC.steelD, 0.4, 0.5), { p: [dx, -0.25, dz], r: [Math.PI / 2, 0, 0] }));
    b.position.set(x * TC_CAR * 0.32, -1.75, 0); g.add(b);
  }
  return g;
};
const tcTrain = () => {
  const cars = [tcCar(1), tcCar(-1)], g = p3Group(...cars);
  // s: where the front of the train is along the oval
  const pose = (s: number) => cars.forEach((c, i) => {
    const sc = s - TC_CAR / 2 - 2.6 - i * (TC_CAR + 0.5), f = tcPath(sc + TC_CAR * 0.32).p, r = tcPath(sc - TC_CAR * 0.32).p, d = f.clone().sub(r);
    c.position.set((f.x + r.x) / 2, TC_RAIL + 2.15, (f.z + r.z) / 2); c.rotation.y = tcYaw(d.normalize());
  });
  pose(0);
  return Object.assign(g, { pose });
};

// ---------- close-ups at real scale: a straight piece of track and the wheelset ----------
const TC_GR = 1.435, TC_R0 = 0.45, TC_TOP = 0.44;   // real gauge, wheel radius, rail top height in the close-ups
const tcRails = (len = 14) => {
  const g = p3Group(), ball = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, len), tcGravelMat(30)); ball.position.y = 0.1; ball.receiveShadow = true; g.add(ball);
  const sl = p3Swarm(Math.ceil(len / 0.6) + 2, new THREE.BoxGeometry(2.6, 0.14, 0.24), dioSmooth(TC.wood, 0.85), true); g.add(sl);
  const railShape = [[-0.036, 0.17], [0.036, 0.17], [0.036, 0.125], [0.009, 0.11], [0.009, 0.03], [0.075, 0.012], [0.075, 0], [-0.075, 0], [-0.075, 0.012], [-0.009, 0.03], [-0.009, 0.11], [-0.036, 0.125]];
  const rails = [-1, 1].map((s) => { const m = new THREE.Mesh(p3Extruded(railShape, len), dioSmooth(TC.steel, 0.3, 0.6)); m.position.set((s * TC_GR) / 2, 0.27, 0); m.castShadow = m.receiveShadow = true; g.add(m); return m; });
  // advance: meters the track has moved toward the camera (the sleepers scroll, in a loop)
  const pose = (advance = 0) => { const n = Math.ceil(len / 0.6) + 2; for (let i = 0; i < n; i++) { const z = ((((i * 0.6 + advance) % (n * 0.6)) + n * 0.6) % (n * 0.6)) - (n * 0.6) / 2; if (Math.abs(z) > len / 2) sl.hide(i); else sl.put(i, 0, 0.27, z, 1); } sl.done(); };
  pose(0);
  return Object.assign(g, { pose, rails });
};
// one wheel's outline: [radius, axial position], +a toward the outside of the track; taper makes it a cone (wider inside), flange adds the inner rim
const tcWheelProfile = (taper: number, flange: number) => { const k = 1.6 * taper, w = 0.075, top = TC_R0 + k * w;
  return [[0.1, -0.13], [top + 0.105 * flange, -0.13], [top + 0.105 * flange, -0.108], [top + 0.02 * flange, -0.085], [top, -w], [TC_R0 - k * w, w], [TC_R0 - k * w - 0.04, w + 0.012], [0.1, w + 0.012]]; };
const tcWheelset = () => {
  const g = p3Group(), roll = p3Group(), metal = dioSmooth('#d4d9e2', 0.28, 0.65); g.add(roll);
  roll.add(p3Mesh(new THREE.CylinderGeometry(0.085, 0.085, TC_GR + 0.5, 20), dioSmooth('#8d95a3', 0.35, 0.6), { r: [0, 0, Math.PI / 2] }));
  const wheels = [-1, 1].map((s) => { const m = new THREE.Mesh(new THREE.BufferGeometry(), metal); m.castShadow = true; m.position.x = (s * TC_GR) / 2; roll.add(m);
    const dot = p3Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 16), dioSmooth('#e5484d', 0.4), { p: [s * (TC_GR / 2 + 0.09), 0.26, 0], r: [0, 0, Math.PI / 2] }); roll.add(dot);   // shows the turning
    return m; });
  const ring = (c: string) => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.016, 8, 64), dioSmooth(c, 0.35)); (m.material as THREE.MeshStandardMaterial).emissive.set(c); (m.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5; m.rotation.y = Math.PI / 2; g.add(m); return m; };
  const rings = [ring(TC.red), ring(TC.key)];   // inner (left, -x) and outer (right, +x) contact circles
  let last = '';
  // roll: radians turned; shift: meters toward +x (the outside of the curve); taper 0..1; flange 0..1; show: the contact rings 0..1
  const pose = (o: { roll?: number; shift?: number; taper?: number; flange?: number; show?: number; showIn?: number; yaw?: number } = {}) => {
    const ta = o.taper ?? 1, fl = o.flange ?? 1, sh = o.shift ?? 0, k = 1.6 * ta, key = ta.toFixed(3) + fl.toFixed(3);
    if (key !== last) { last = key; wheels.forEach((m, i) => { const s = i ? 1 : -1, geo = new THREE.LatheGeometry(tcWheelProfile(ta, fl).map(([r, a]) => new THREE.Vector2(r, a)), 56); geo.rotateZ(-s * Math.PI / 2); geo.computeVertexNormals(); m.geometry.dispose(); m.geometry = geo; }); }
    roll.rotation.x = o.roll ?? 0; g.position.x = sh; g.rotation.y = o.yaw ?? 0;
    // where each wheel touches its rail: the outer one on its wide part, the inner one on its narrow part
    const rOut = TC_R0 + k * Math.min(0.075, sh), rIn = TC_R0 - k * Math.min(0.075, sh);
    g.position.y = TC_TOP + (rOut + rIn) / 2; g.rotation.z = Math.atan2(rIn - rOut, TC_GR);
    rings.forEach((m, i) => { const r = i ? rOut : rIn, s = i ? 1 : -1, show = i ? (o.show ?? 0) : (o.showIn ?? o.show ?? 0); m.visible = show > 0.01; m.scale.setScalar(r * Math.max(0.001, show)); m.position.x = (s * TC_GR) / 2 - sh; });   // on the rail, which stays put while the wheelset shifts
  };
  pose();
  return Object.assign(g, { pose });
};
// sparks where a wheel skids: orange bits flying out in a loop (on = 0..1)
const tcSparks = (n = 40) => {
  const R = p3Rnd(17), sw = p3Swarm(n, new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: TC.spark })), P = Array.from({ length: n }, () => ({ ph: R(), vx: (R() - 0.5) * 1.6, vy: 0.8 + R() * 1.6, vz: 0.6 + R() * 1.8 }));
  const pose = (t: number, on: number) => { P.forEach((p, i) => { const u = (t * 2.2 + p.ph) % 1, s = on * (1 - u) * 1.4; if (s < 0.02) { sw.hide(i); return; } sw.put(i, p.vx * u, p.vy * u - 2.2 * u * u, p.vz * u, s); }); sw.done(); };
  return Object.assign(sw, { pose });
};
// two dampers (spring + cylinder) standing on the axle boxes
const tcDampers = () => {
  const g = p3Group();
  for (const s of [-1, 1]) {
    const x = s * (TC_GR / 2 + 0.3), pts = Array.from({ length: 80 }, (_, i) => { const a = i * 0.5; return [x + 0.11 * Math.cos(a), 0.12 + i * 0.008, 0.11 * Math.sin(a)]; });
    g.add(p3Tube(pts, 0.018, dioSmooth(TC.key, 0.4), 160), p3Mesh(p3Cyl(0.05, 0.05, 0.75, 14), dioSmooth('#30343e', 0.5), { p: [x, 0.5, 0] }), p3Mesh(p3Box(0.3, 0.12, 0.3), dioSmooth('#30343e', 0.6), { p: [x, 0.06, 0] }));
  }
  return g;
};
// the outward push in a curve: an arrow
const tcPush = () => p3Arrow([0, 0, 0], [1, 0, 0], 1.6, TC.red, 0.09);

// the paths of both wheels around the right-hand curve: outer (lime, longer) and inner (red); grow 0..1
const tcTrails = () => {
  const mk = (side: number, c: string) => { const m = dioSmooth(c, 0.4); m.emissive.set(c); m.emissiveIntensity = 0.35;
    const pts = Array.from({ length: 90 }, (_, i) => { const { p, left } = tcPath(TC_S + (i / 89) * Math.PI * TC_RAD); return p.add(left.multiplyScalar((side * TC_G) / 2)).setY(TC_RAIL + 0.06); });
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), m); mesh.frustumCulled = false;
    return { mesh, pose: (u: number) => { mesh.visible = u > 0.01; if (!mesh.visible) return; const n = Math.max(2, Math.round(90 * p3Clamp(u))); mesh.geometry.dispose(); mesh.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.slice(0, n)), n * 2, 0.16, 8); } }; };
  const outer = mk(-1, TC.key), inner = mk(1, TC.red), g = p3Group(outer.mesh, inner.mesh);
  return Object.assign(g, { pose: (u: number) => { outer.pose(u); inner.pose(u); } });
};
// a slice of the car body over the wheelset, for the front views
const tcBodySlice = () => p3Group(p3Mesh(new THREE.RoundedBoxGeometry(3.0, 2.3, 1.2, 4, 0.35), dioSmooth(TC.white, 0.35), { p: [0, 2.35, 0] }), p3Mesh(p3Box(3.02, 0.16, 1.22), dioSmooth(TC.teal, 0.4), { p: [0, 1.95, 0] }), p3Mesh(new THREE.RoundedBoxGeometry(2.6, 0.5, 1.24, 2, 0.1), dioSmooth(TC.glass, 0.2), { p: [0, 2.75, 0] }));

// ---------- the diorama with the oval, and its props away from the track ----------
const tcNearTrack = (x: number, z: number) => { const ax = Math.max(0, Math.abs(x) - TC_S / 2), d = ax > 0 ? Math.hypot(ax, z) : Math.abs(z); return Math.abs(d - TC_RAD) < 2.6; };
const tcLand = () => {
  const g = p3Group(dioDiorama({ road: false, props: false, w: 52, d: 32, free: tcNearTrack }), tcTrack());
  const greens = ['#4caf3e', '#5cc24a', '#3f9a36', '#6acb55'];
  for (const [x, z, sc, i] of [[-17, -14.5, 6, 0], [-4, -15, 7.5, 1], [10, -14.6, 6.5, 2], [21, -14, 5, 3]]) { const h = new THREE.IcosahedronGeometry(1, 1); h.scale(sc * 1.2, sc * 0.75, sc * 0.3); g.add(p3Mesh(h, greens[i], { p: [x, 0, z] })); }
  g.add(dioHouse([-6, 0, 0.5], 0.3), dioHouse([5, 0, -1.5], -0.25, 0.9), dioHouse([-14, 0, 13.6], 0.1, 0.8), dioHouse([16, 0, 13.4], -0.3, 0.8));
  for (const [x, z, sc, i] of [[-2, 2.5, 1.1, 0], [1, -3, 0.9, 1], [9, 2, 1.2, 2], [-10, -2.5, 1, 3], [-24, 12, 1.1, 1], [24, -12, 1, 0], [0, 13.5, 0.9, 2], [-23, -13, 1, 3]]) g.add(dioTree([x, 0, z], sc, greens[i]));
  return g;
};
// the camera over the diorama's corner
const tcCorner = (w: World, u: number) => { const a = p3Lerp(0.62, 0.48, u); w.look([4 + Math.cos(a) * 52, 20, 4 + Math.sin(a) * 52], [4, 1.5, 2], 36); };
// a close-up set: ground and a piece of straight track
const tcCloseSet = (w: World) => { dioLights(w); w.add(dioDiorama({ road: false, props: false, clear: 2.4, w: 30, d: 30 })); const r = w.add(tcRails()); dioSkyBack(w); return r; };

// ---------- world test shots ----------
defineVisuals({
  'test-land': {
    bg: TC.sky,
    build(w) { dioLights(w); w.add(tcLand()); const tr = w.add(tcTrain()); [[-12, 16, -30, 2], [14, 18, -36, 2.4]].forEach(([x, y, z, s]) => w.add(dioCloud([x, y, z], s)));
      return (t) => { tr.pose(18 + (t - w.s.t0) * 8); tcCorner(w, (t - w.s.t0) / 3); }; },
  },
  'test-wheels': {   // cylinder -> cone -> flange, rolling
    bg: TC.sky,
    build(w) { const r = tcCloseSet(w), ws = w.add(tcWheelset());
      return (t) => { const lt = t - w.s.t0; ws.pose({ roll: lt * 4, taper: p3Ramp(lt, 1, 1.5), flange: p3Ramp(lt, 2.5, 3), shift: 0.05 * p3Ramp(lt, 3.5, 4), show: p3Ramp(lt, 3.5, 4) }); r.pose(lt * 2);
        w.look([3.6, 1.9, 5.6], [0, 0.5, 0], 36); }; },
  },
  'test-front': {   // from the front: contact radii, sparks, dampers, the push arrow
    bg: TC.sky,
    build(w) { tcCloseSet(w); const ws = w.add(tcWheelset()), sp = w.add(tcSparks()), dm = w.add(tcDampers()), ar = w.add(tcPush()); sp.position.set(-TC_GR / 2, TC_TOP, 0.3); ar.position.set(1.2, 1.4, 0.4);
      return (t) => { const lt = t - w.s.t0; ws.pose({ roll: lt * 4, shift: 0.06, show: 1 }); sp.pose(t, lt < 1.5 ? 1 : 0); dm.visible = lt > 1.5; ar.grow(p3Ramp(lt, 1.5, 2)); w.look([0, 0.85, 7.5], [0, 0.6, 0], 36); }; },
  },
});
