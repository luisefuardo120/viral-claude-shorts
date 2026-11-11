// World of "5 cosas que sabemos de GTA 6" (3D): original cast, sets, camera shots and effects. See plan.md.
// Everything is posed from t (absolute seconds). Prefix g6: every video's world shares one global scope.

const G6 = {
  sky: '#f7a07a', night: C3.night, asphalt: '#3a3550', walk: '#b9a6b8', line: '#ffe9a8',
  pastel: ['#f6a9c0', '#9fe3c9', '#c3b1f0', '#ffc69a', '#9fd3f7'], neon: ['#3ff2ff', '#ff5fd2'],
  palm: '#3f9b5a', palmD: '#2f7a46', bark: '#9a6a46',
  ok: '#3ddc84', no: '#ff4b55', coin: '#ffcf4a',
};

// ---------- people: a jointed skeleton with blended states ----------
type G6Joints = Record<string, Vec3>;
type G6State = 'idle' | 'wave' | 'point' | 'cheer' | 'think' | 'walk' | 'sit';
interface G6Look { skin: string; top: string; pants: string; shoes: string; wide: number; tall: number; hero: 'nia' | 'rocco' }

const G6_NIA: G6Look = { skin: '#8d5a3c', top: '#a4d65e', pants: '#22305a', shoes: '#f4f6fa', wide: 1, tall: 1.02, hero: 'nia' };
const G6_ROCCO: G6Look = { skin: '#e0a882', top: '#ff6f61', pants: '#ff6f61', shoes: '#1d1d26', wide: 1.2, tall: 0.98, hero: 'rocco' };

// the angles of each state at time t ([x, y, z] radians per joint; y = hips height). Elbows bend forward with -x, knees back with +x.
const g6StatePose = (s: G6State, t: number): G6Joints => {
  const br = 0.03 * Math.sin(t * 2.2);
  const base: G6Joints = { chest: [br, 0, 0], shL: [0, 0, 0.14], shR: [0, 0, -0.14], elL: [-0.18, 0, 0], elR: [-0.18, 0, 0], y: [0.95, 0, 0] };
  switch (s) {
    case 'idle': return base;
    case 'wave': return { ...base, shR: [0, 0, -2.5 + 0.22 * Math.sin(t * 9)], elR: [-0.55, 0, 0], head: [0, -0.15, 0.08] };
    case 'point': return { ...base, shR: [-1.45, 0, -0.12], elR: [-0.05, 0, 0], head: [0, -0.1, 0], chest: [0, -0.15, 0] };
    case 'cheer': {
      const hop = Math.abs(Math.sin(t * 6));
      return { ...base, shL: [0, 0, 2.7 + 0.12 * hop], shR: [0, 0, -2.7 - 0.12 * hop], elL: [-0.3, 0, 0], elR: [-0.3, 0, 0],
        hiL: [-0.25 * hop, 0, 0], hiR: [-0.25 * hop, 0, 0], knL: [0.5 * hop, 0, 0], knR: [0.5 * hop, 0, 0], y: [0.95 + 0.12 * hop - 0.04 * hop, 0, 0] };
    }
    case 'think': return { ...base, shR: [-1.15, -0.5, 0.75], elR: [-2.3, 0, 0], shL: [-0.45, 0, 0.1], elL: [-1.35, 0, 0], head: [0.12, 0.1, -0.08] };
    case 'walk': {
      const p = Math.sin(t * 7), q = Math.cos(t * 7);
      return { ...base, hiL: [-0.45 * p, 0, 0], hiR: [0.45 * p, 0, 0], knL: [0.7 * Math.max(0, q), 0, 0], knR: [0.7 * Math.max(0, -q), 0, 0],
        shL: [0.4 * p, 0, 0.1], shR: [-0.4 * p, 0, -0.1], elL: [-0.35, 0, 0], elR: [-0.35, 0, 0], y: [0.95 - 0.02 * Math.abs(q), 0, 0] };
    }
    case 'sit': return { ...base, hiL: [-1.5, 0, 0.06], hiR: [-1.5, 0, -0.06], knL: [1.45, 0, 0], knR: [1.45, 0, 0], anL: [-0.05, 0, 0], anR: [-0.05, 0, 0],
      shL: [-0.85, 0, 0.12], shR: [-0.85, 0, -0.12], elL: [-0.65, 0, 0], elR: [-0.65, 0, 0], y: [0.52, 0, 0] };
  }
};

const g6Person = (L: G6Look) => {
  const W = L.wide, J: Record<string, THREE.Group> = {};
  const joint = (name: string, parent: THREE.Object3D, p: Vec3, r = 0) => {
    const g = new THREE.Group(); g.position.set(...p); parent.add(g); J[name] = g;
    if (r) g.add(p3Mesh(p3Ball(r, 8, 6), L.skin === L.top ? L.top : '#30303c', { s: 1 }));
    return g;
  };
  const limb = (parent: THREE.Object3D, len: number, r0: number, r1: number, color: string) => {
    const geo = p3Cyl(r0, r1, len, 8); geo.translate(0, -len / 2, 0); parent.add(p3Mesh(geo, color));
  };
  const root = new THREE.Group();
  const hips = joint('hips', root, [0, 0.95, 0]);
  hips.add(p3Mesh(p3Box(0.3 * W, 0.14, 0.18 * W), L.pants, { p: [0, 0, 0] }));
  // spine: waist -> chest -> neck -> head
  const waist = joint('waist', hips, [0, 0.07, 0]);
  waist.add(p3Mesh(p3Cyl(0.13 * W, 0.14 * W, 0.2, 8), L.top, { p: [0, 0.1, 0], s: [1, 1, 0.7] }));
  const chest = joint('chest', waist, [0, 0.2, 0]);
  chest.add(p3Mesh(p3Cyl(0.21 * W, 0.14 * W, 0.34 * L.tall, 8), L.top, { p: [0, 0.17, 0], s: [1, 1, 0.65] }));
  if (L.hero === 'nia') chest.add(p3Mesh(p3Box(0.02, 0.32, 0.02), '#ffffff', { p: [0, 0.17, 0.135] }));   // zipper
  const neck = joint('neck', chest, [0, 0.36 * L.tall, 0], 0.055);
  neck.add(p3Mesh(p3Cyl(0.045, 0.05, 0.08, 6), L.skin, { p: [0, 0.04, 0] }));
  const head = joint('head', neck, [0, 0.09, 0]);
  head.add(p3Mesh(p3Ball(0.125, 10, 8), L.skin, { p: [0, 0.12, 0], s: [0.95, 1.08, 1] }));
  if (L.hero === 'nia') {
    for (const [x, y, z, r] of [[0, 0.3, -0.04, 0.1], [0.07, 0.27, -0.08, 0.075], [-0.07, 0.27, -0.08, 0.075], [0, 0.24, -0.12, 0.08], [0.09, 0.17, -0.09, 0.06], [-0.09, 0.17, -0.09, 0.06], [0, 0.36, -0.07, 0.07]])
      head.add(p3Mesh(p3Ball(r, 7, 5), '#b5532b', { p: [x, y, z] }));
    for (const x of [-0.045, 0.045]) head.add(p3Mesh(p3Ball(0.017, 6, 4), '#1a1420', { p: [x, 0.14, 0.115] }));
  } else {
    for (const x of [-0.05, 0.05]) head.add(p3Mesh(p3Cyl(0.042, 0.042, 0.02, 12), '#111118', { p: [x, 0.14, 0.12], r: [Math.PI / 2, 0, 0] }));
    head.add(p3Mesh(p3Box(0.25, 0.015, 0.015), '#111118', { p: [0, 0.145, 0.12] }));
  }
  // arms: shoulder -> elbow -> wrist
  for (const [s, x] of [['L', 1], ['R', -1]] as const) {
    const sh = joint('sh' + s, chest, [x * 0.22 * W, 0.31 * L.tall, 0], 0.06 * W);
    limb(sh, 0.29, 0.055 * W, 0.045 * W, L.top);
    if (L.hero === 'rocco') { const st = p3Mesh(p3Box(0.012, 0.28, 0.012), '#ffffff', { p: [x * 0.05, -0.14, 0] }); sh.add(st); }
    const el = joint('el' + s, sh, [0, -0.29, 0], 0.045 * W);
    limb(el, 0.26, 0.042 * W, 0.034, L.hero === 'nia' ? L.top : L.skin);
    const wr = joint('wr' + s, el, [0, -0.26, 0]);
    wr.add(p3Mesh(p3Box(0.07, 0.1, 0.035), L.skin, { p: [0, -0.05, 0] }));
  }
  // legs: hip -> knee -> ankle
  for (const [s, x] of [['L', 1], ['R', -1]] as const) {
    const hi = joint('hi' + s, hips, [x * 0.09 * W, -0.04, 0], 0.07 * W);
    limb(hi, 0.44, 0.075 * W, 0.055 * W, L.pants);
    if (L.hero === 'rocco') hi.add(p3Mesh(p3Box(0.012, 0.42, 0.012), '#ffffff', { p: [x * 0.075 * W, -0.22, 0] }));
    const kn = joint('kn' + s, hi, [0, -0.44, 0], 0.055 * W);
    limb(kn, 0.43, 0.055 * W, 0.04, L.pants);
    const an = joint('an' + s, kn, [0, -0.43, 0], 0.035);
    an.add(p3Mesh(p3Box(0.1, 0.07, 0.24), L.shoes, { p: [0, -0.04, 0.05] }));
  }
  const NAMES = ['waist', 'chest', 'neck', 'head', 'shL', 'shR', 'elL', 'elR', 'wrL', 'wrR', 'hiL', 'hiR', 'knL', 'knR', 'anL', 'anR'];
  // pose: state at t, blended from the previous state over 0.4 s starting at `since`
  const pose = (t: number, state: G6State, prev: G6State = state, since = -99) => {
    const u = p3Ramp(t, since, since + 0.4), A = g6StatePose(prev, t), B = g6StatePose(state, t);
    for (const n of NAMES) { const a = A[n] || [0, 0, 0], b = B[n] || [0, 0, 0]; J[n].rotation.set(p3Lerp(a[0], b[0], u), p3Lerp(a[1], b[1], u), p3Lerp(a[2], b[2], u)); }
    J.hips.position.y = p3Lerp(A.y[0], B.y[0], u);
  };
  pose(0, 'idle');
  return Object.assign(root, { pose, J });
};
// a timeline of states: [[time, state], ...] -> the pose at t
const g6Act = (p: ReturnType<typeof g6Person>, t: number, steps: [number, G6State][]) => {
  let i = 0; while (i + 1 < steps.length && t >= steps[i + 1][0]) i++;
  p.pose(t, steps[i][1], steps[Math.max(0, i - 1)][1], i ? steps[i][0] : -99);
};

// ---------- the car ----------
const g6Car = () => {
  const body = '#1fb5a8', g = p3Group();
  g.add(p3Mesh(p3Box(4.2, 0.55, 1.8), body, { p: [0, 0.6, 0] }));
  g.add(p3Mesh(p3Box(1.3, 0.25, 1.75), body, { p: [1.35, 0.95, 0] }));                 // hood
  g.add(p3Mesh(p3Box(0.9, 0.25, 1.75), body, { p: [-1.6, 0.95, 0] }));                  // trunk
  g.add(p3Mesh(p3Box(0.08, 0.45, 1.6), '#bfe8ff', { p: [0.65, 1.25, 0], r: [0, 0, -0.35], e: 0.2 }));   // windshield
  for (const z of [-0.42, 0.42]) {
    g.add(p3Mesh(p3Box(0.6, 0.2, 0.62), '#f2e3c6', { p: [-0.4, 0.95, z] }));             // seat
    g.add(p3Mesh(p3Box(0.14, 0.6, 0.62), '#f2e3c6', { p: [-0.75, 1.2, z] }));            // backrest
  }
  const wheel = p3Mesh(p3Cyl(0.04, 0.04, 0.35, 6), '#2a2a2a', { p: [0.35, 1.2, 0.42], r: [0, 0, 1.2] }); g.add(wheel);   // steering wheel
  const lights: THREE.Mesh[] = [];
  for (const z of [-0.62, 0.62]) {
    const h = p3Mesh(p3Ball(0.13, 10, 8), '#fff6c8', { p: [2.1, 0.75, z], e: 0.2 }); g.add(h); lights.push(h);
    g.add(p3Mesh(p3Box(0.05, 0.12, 0.3), '#ff3b48', { p: [-2.1, 0.75, z], e: 0.4 }));
  }
  const wheels = [[1.35, 0.9], [1.35, -0.9], [-1.35, 0.9], [-1.35, -0.9]].map(([x, z]) => {
    const w = p3Group(p3Mesh(p3Cyl(0.4, 0.4, 0.3, 14), '#1d1d24', { r: [Math.PI / 2, 0, 0] }), p3Mesh(p3Cyl(0.2, 0.2, 0.32, 8), '#c9ced8', { r: [Math.PI / 2, 0, 0] }));
    w.position.set(x, 0.4, z); g.add(w); return w;
  });
  // seats where a seated person's feet go (driver on the left, z>0)
  const seats: Vec3[] = [[-0.35, 0.45, 0.42], [-0.35, 0.45, -0.42]];
  // dist: meters driven (the car moves along +x); lit 0..1
  const pose = (t: number, dist = 0, lit = 0) => {
    wheels.forEach((w) => { w.rotation.z = -dist / 0.4; });
    g.children[0].position.y = 0.6 + (dist ? 0.025 * Math.sin(t * 13) : 0);
    lights.forEach((l) => { (l.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2 + 1.6 * lit; });
  };
  return Object.assign(g, { pose, seats });
};

// ---------- the street set ----------
const g6Palm = (p: Vec3, h = 5, lean = 0.12) => {
  const g = p3Group(), top = new THREE.Group(); g.position.set(...p);
  for (let i = 0; i < 6; i++) { const y = (i + 0.5) * h / 6; g.add(p3Mesh(p3Cyl(0.13 - i * 0.012, 0.16 - i * 0.012, h / 6 + 0.02, 7), i % 2 ? G6.bark : '#86593a', { p: [Math.sin(lean) * y * y / h, y, 0] })); }
  top.position.set(Math.sin(lean) * h, h, 0); g.add(top);
  for (let i = 0; i < 7; i++) {
    const leaf = p3Mesh(p3Box(2.1, 0.05, 0.45), i % 2 ? G6.palm : G6.palmD); leaf.geometry.translate(1.05, 0, 0);
    const a = new THREE.Group(); a.rotation.set(0, (i / 7) * Math.PI * 2, -0.45); a.add(leaf); top.add(a);
  }
  top.add(p3Mesh(p3Ball(0.22, 7, 5), '#6b4a2a'));
  return Object.assign(g, { sway: (t: number, k = 0) => { top.rotation.z = 0.06 * Math.sin(t * 1.3 + k); top.rotation.x = 0.04 * Math.sin(t * 1.1 + k * 2); } });
};
const g6Street = () => {
  const g = p3Group(), R = p3Rnd(66);
  const road = p3Mesh(new THREE.PlaneGeometry(200, 8), G6.asphalt, { r: [-Math.PI / 2, 0, 0], shadow: false }); road.receiveShadow = true; g.add(road);
  for (let x = -60; x < 60; x += 4) g.add(p3Mesh(p3Box(2, 0.02, 0.18), G6.line, { p: [x, 0.01, 0], shadow: false }));
  for (const z of [-5.5, 5.5]) { const s = p3Mesh(p3Box(200, 0.2, 3), G6.walk, { p: [0, 0.1, z] }); s.receiveShadow = true; g.add(s); }
  const back = p3Mesh(new THREE.PlaneGeometry(200, 60), '#5c3b66', { p: [0, 0, -20], r: [-Math.PI / 2, 0, 0], shadow: false }); g.add(back);
  const neons: THREE.Mesh[] = [];
  for (let x = -40, i = 0; x < 40; i++) {
    const w = 5 + R() * 4, h = 4 + R() * 7, d = 6;
    g.add(p3Mesh(p3Box(w - 0.4, h, d), G6.pastel[i % G6.pastel.length], { p: [x + w / 2, h / 2, -10] }));
    for (let fy = 1.6; fy < h - 1; fy += 2.2) for (let fx = -w / 2 + 1.2; fx < w / 2 - 0.8; fx += 1.6)
      g.add(p3Mesh(p3Box(0.8, 0.9, 0.05), '#ffe8b8', { p: [x + w / 2 + fx, fy, -6.97], e: 0.5, shadow: false }));
    const n = p3Mesh(p3Box(w - 1.2, 0.18, 0.1), G6.neon[i % 2], { p: [x + w / 2, h - 0.6, -6.9], e: 1.2, shadow: false }); g.add(n); neons.push(n);
    x += w;
  }
  const palms = [-27, -18, -9, 0, 9, 18, 27].map((x, i) => { const p = g6Palm([x + 1.5, 0.2, -5.8], 4.5 + (i % 3) * 0.7, 0.1 + (i % 2) * 0.08); g.add(p); return p; });
  const pose = (t: number) => {
    neons.forEach((n, i) => { (n.material as THREE.MeshStandardMaterial).emissiveIntensity = 1 + 0.35 * Math.sin(t * (2 + i * 0.37) + i); });
    palms.forEach((p, i) => p.sway(t, i));
  };
  return Object.assign(g, { pose });
};
const g6StreetLights = (w: Pick<World, 'add'>) => {
  w.add(new THREE.HemisphereLight('#ffd9b8', '#4a2f5c', 1.0));
  const sun = new THREE.DirectionalLight('#ffc48a', 1.5); sun.position.set(-10, 9, 8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20 }); w.add(sun);
};
const g6StudioLights = (w: Pick<World, 'add'>) => {
  w.add(new THREE.HemisphereLight('#c9d8ff', '#4a3a66', 1.4));
  const key = new THREE.DirectionalLight('#ffe2c2', 1.7); key.position.set(5, 8, 7); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 }); w.add(key);
};
const g6Floor = (color = '#2c2142') => { const m = p3Mesh(new THREE.PlaneGeometry(200, 200), color, { r: [-Math.PI / 2, 0, 0], shadow: false }); m.receiveShadow = true; return m; };

// ---------- props ----------
const g6Label = (text: string[], bg: string, fg: string, w = 512, h = 512) => new THREE.MeshBasicMaterial({ map: p3Paint(w, h, (c) => {
  c.fillStyle = bg; c.fillRect(0, 0, w, h); c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
  text.forEach((line, i) => { const big = i === 0; c.font = `900 ${big ? 150 : 80}px system-ui, sans-serif`; c.fillText(line, w / 2, h * (text.length === 1 ? 0.5 : big ? 0.42 : 0.72)); });
}) });
const g6X = (size = 1, color = G6.no) => p3Group(...[0.785, -0.785].map((r) => p3Mesh(p3Box(size, size * 0.18, 0.08), color, { r: [0, 0, r], e: 0.5 })));
const g6Check = (size = 1, color = G6.ok) => p3Group(
  p3Mesh(p3Box(size * 0.45, size * 0.18, 0.08), color, { p: [-size * 0.2, -size * 0.05, 0], r: [0, 0, -0.785], e: 0.5 }),
  p3Mesh(p3Box(size * 0.9, size * 0.18, 0.08), color, { p: [size * 0.15, size * 0.1, 0], r: [0, 0, 0.9], e: 0.5 }));

const g6Calendar = () => {
  const g = p3Group(p3Mesh(p3Box(3.2, 0.4, 1.4), '#3d3354', { p: [0, 0.2, 0] }), p3Mesh(p3Box(3.2, 0.15, 0.3), '#c9ced8', { p: [0, 3.65, 0] }));
  const texts = [['2025', 'OTOÑO'], ['26', 'MAYO 2026'], ['19', 'NOV 2026']];
  const pages = texts.map((tx, i) => {
    const hinge = new THREE.Group(); hinge.position.set(0, 3.6, 0.05 + (2 - i) * 0.03);
    const page = new THREE.Mesh(new THREE.PlaneGeometry(3, 3.1), g6Label(tx, i === 2 ? '#ffffff' : '#f1ece4', i === 2 ? '#e5484d' : '#3d3354'));
    page.position.y = -1.6; hinge.add(page);
    if (i < 2) { const x = g6X(2.2); x.position.set(0, -1.6, 0.05); hinge.add(x); }
    g.add(hinge); return hinge;
  });
  // k1, k2: when each delay is said: the old page's X pops, then the page flies over the top (0.45 s)
  const pose = (t: number, k1: number, k2: number, glow = 0) => {
    [k1, k2].forEach((k, i) => {
      const x = pages[i].children[1]; x.scale.setScalar(Math.max(0.001, p3Spring(t, k - 0.5, 260, 16)));
      pages[i].rotation.x = -2.6 * p3Ramp(t, k, k + 0.45); pages[i].visible = t < k + 0.45;
    });
    pages[2].scale.setScalar(1 + 0.04 * glow * Math.sin(t * 7));
  };
  return Object.assign(g, { pose });
};

const g6Map = () => {
  const g = p3Group();
  const sea = p3Mesh(new THREE.PlaneGeometry(80, 80), '#2c8fd6', { r: [-Math.PI / 2, 0, 0], shadow: false }); sea.receiveShadow = true; g.add(sea);
  const shape = [[-3, 4], [3.5, 4.2], [3.8, 2.5], [2.2, 1.6], [2.6, -1], [3.4, -3.4], [3, -5.6], [2, -6.6], [1, -5.4], [0.2, -3], [-0.6, -0.8], [-1.6, 1.4], [-3.2, 2.6]];
  const land = (pts: number[][], h: number, c: string, y: number) => { const m = p3Mesh(p3Extruded(pts, h), c); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; return m; };
  g.add(land(shape.map(([x, y]) => [x * 1.06, y * 1.04 - 0.1]), 0.2, '#f2d79b', 0.1), land(shape, 0.5, '#5fb86a', 0.25));
  for (const [x, z, s] of [[-1.5, -2.5, 1], [0.5, -1, 0.8], [-2, -1, 0.7], [1.4, -3.4, 0.6]]) g.add(p3Mesh(p3Cone(0.5 * s, 0.8 * s, 6), '#3f9b5a', { p: [x, 0.85, z] }));
  const city: THREE.Mesh[] = [];
  for (let i = 0; i < 9; i++) { const h = 0.3 + ((i * 37) % 7) * 0.12; const m = p3Mesh(p3Box(0.22, h, 0.22), G6.neon[i % 2], { p: [2.3 + (i % 3) * 0.3, 0.5 + h / 2, 4.2 + Math.floor(i / 3) * 0.3], e: 0.8 }); city.push(m); g.add(m); }
  const pin = p3Group(p3Mesh(p3Cone(0.28, 1.1, 10), '#e5484d', { r: [Math.PI, 0, 0], p: [0, 0.55, 0] }), p3Mesh(p3Ball(0.4, 12, 9), '#e5484d', { p: [0, 1.35, 0] }), p3Mesh(p3Ball(0.16, 8, 6), '#ffffff', { p: [0, 1.38, 0.3] }));
  pin.position.set(2.6, 0.5, 4.5); g.add(pin);
  const pose = (t: number, kPin: number) => {
    city.forEach((m, i) => { (m.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.7 + 0.5 * Math.sin(t * 3 + i); });
    const u = p3Spring(t, kPin, 200, 14); pin.visible = t >= kPin; pin.position.y = 0.5 + 5 * (1 - u); pin.rotation.y = t * 1.2;
  };
  return Object.assign(g, { pose });
};

const g6Screen = () => {
  const g = p3Group(p3Mesh(p3Box(5.2, 3.1, 0.25), '#1f1b2e', { p: [0, 3.2, 0] }), p3Mesh(p3Box(0.3, 1.7, 0.3), '#3d3354', { p: [0, 0.85, 0] }));
  const glass = p3Mesh(new THREE.PlaneGeometry(4.8, 2.7), '#2a6fdb', { p: [0, 3.2, 0.13], e: 0, shadow: false }); g.add(glass);
  const play = p3Group(p3Mesh(new THREE.CircleGeometry(0.62, 28), '#ffffff', { e: 0.6, shadow: false }), p3Mesh(new THREE.CircleGeometry(0.3, 3), '#2a6fdb', { p: [0.05, 0, 0.01], e: 0.4, shadow: false }));
  play.position.set(0, 3.2, 0.16); g.add(play);
  const bars = [0.5, 0.8, 1.1, 1.5, 2.1].map((h, i) => { const geo = p3Box(0.5, 1, 0.4); geo.translate(0, 0.5, 0); const m = p3Mesh(geo, G6.coin, { p: [-1.6 + i * 0.8, 0, 1.4], e: 0.3 }); m.userData.h = h; g.add(m); return m; });
  const pose = (t: number, kPlay: number, kViral: number) => {
    const on = p3Ramp(t, kPlay, kPlay + 0.4), M = glass.material as THREE.MeshStandardMaterial;
    M.color.set(on ? '#2a6fdb' : '#141222'); M.emissiveIntensity = on * (0.5 + (t > kViral ? 0.25 * Math.sin(t * 8) : 0));
    play.scale.setScalar(Math.max(0.001, p3Spring(t, kPlay, 220, 15)));
    bars.forEach((b, i) => { b.scale.y = Math.max(0.001, b.userData.h * p3Spring(t, kViral + i * 0.07, 180, 16)); });
  };
  return Object.assign(g, { pose });
};

const g6Consoles = () => {
  const g = p3Group();
  const a = p3Group(p3Mesh(p3Box(1.6, 0.35, 1.1), '#6a86b8', { p: [0, 0.18, 0] }), p3Mesh(p3Box(1.3, 0.05, 0.02), '#3ff2ff', { p: [0, 0.2, 0.56], e: 1.2 }));
  a.position.set(-1.9, 0, 0);
  const b = p3Group(p3Mesh(p3Box(0.9, 0.9, 0.9), '#4a4c5c', { p: [0, 0.45, 0] }), p3Mesh(p3Ball(0.08, 8, 6), '#ffb340', { p: [0.3, 0.75, 0.46], e: 1.2 }));
  b.position.set(-0.3, 0, 0);
  const fan = p3Mesh(new THREE.CircleGeometry(0.3, 16), '#ff5fd2', { p: [0, 1.3, 0.41], e: 1.2, shadow: false });
  const pc = p3Group(p3Mesh(p3Box(0.75, 1.9, 0.8), '#3a3a4a', { p: [0, 0.95, 0] }), fan); pc.position.set(1.8, 0, 0);
  g.add(a, b, pc);
  const ticks = [-1.9, -0.3].map((x) => { const c = g6Check(0.9); c.position.set(x, 2.1, 0.3); g.add(c); return c; });
  const x = g6X(1); x.position.set(1.8, 2.7, 0.5); g.add(x);
  const pose = (t: number, kCheck: number, kNo: number) => {
    ticks.forEach((c, i) => { c.scale.setScalar(Math.max(0.001, p3Spring(t, kCheck + i * 0.15, 240, 15))); c.position.y = 2.1 + 0.08 * Math.sin(t * 3 + i); });
    x.scale.setScalar(Math.max(0.001, p3Spring(t, kNo, 260, 14)));
    const F = fan.material as THREE.MeshStandardMaterial, off = p3Ramp(t, kNo, kNo + 0.4); F.emissiveIntensity = 1.2 * (1 - off); F.color.set(off > 0.5 ? '#4a4a5c' : '#ff5fd2');
    fan.rotation.z = t * 6;
  };
  return Object.assign(g, { pose });
};

// the numbered coin that opens each fact
const g6Badge = (n: number) => {
  const side = new THREE.MeshStandardMaterial({ color: '#e0a92a', flatShading: true });
  const face = g6Label([String(n)], G6.coin, '#3d2a00', 256, 256);
  const coin = new THREE.Mesh(p3Cyl(0.7, 0.7, 0.18, 28), [side, face, face]); coin.rotation.x = Math.PI / 2; coin.castShadow = true;
  const g = p3Group(coin);
  const pose = (t: number, k: number) => { g.scale.setScalar(Math.max(0.001, (g.userData.s ?? 1) * p3Spring(t, k, 230, 14))); g.rotation.y = 0.35 * Math.sin((t - k) * 1.5); g.visible = t >= k; };
  return Object.assign(g, { pose });
};

// ---------- camera shots (u: 0..1 through the shot) ----------
const G6Cam = {
  wide: (w: World, u: number, x = 0) => w.look([x + p3Lerp(10, 6, u), 4.2, 15], [x, 1.8, -1.5], 40),
  duo: (w: World, u: number, c: Vec3 = [0, 0, 1]) => w.look([c[0] + 1.5, 1.8, c[2] + p3Lerp(5.6, 5.0, u)], [c[0], 1.45, c[2]], 38),
  orbit: (w: World, u: number, c: Vec3, r = 10, h = 4, a0 = -0.35, a1 = 0.35, lens = 40) => { const a = p3Lerp(a0, a1, u); w.look([c[0] + Math.sin(a) * r, c[1] + h, c[2] + Math.cos(a) * r], c, lens); },
  push: (w: World, u: number, c: Vec3, d0 = 12, d1 = 9) => w.look([c[0] + 1, c[1] + 0.6, c[2] + p3Lerp(d0, d1, u)], c, 40),
};
const g6U = (w: World, t: number) => p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0));

// ---------- world test shots (world.json) ----------
defineVisuals({
  'test-nia': {
    bg: G6.sky,
    build(w) {
      g6StreetLights(w); const st = w.add(g6Street()), nia = w.add(g6Person(G6_NIA)); nia.position.set(0, 0.2, 1);
      return (t) => { const lt = t - w.s.t0; st.pose(t); G6Cam.duo(w, 0.5, [0, 0, 1]); nia.rotation.y = 0.3;
        g6Act(nia, lt, [[0, 'idle'], [1, 'wave'], [2, 'point'], [3, 'cheer'], [4, 'think'], [5, 'walk'], [6, 'sit']]); };
    },
  },
  'test-rocco': {
    bg: G6.sky,
    build(w) {
      g6StreetLights(w); const st = w.add(g6Street()), r = w.add(g6Person(G6_ROCCO)); r.position.set(0, 0.2, 1);
      return (t) => { const lt = t - w.s.t0; st.pose(t); G6Cam.duo(w, 0.5, [0, 0, 1]); r.rotation.y = 0.3;
        g6Act(r, lt, [[0, 'idle'], [1, 'wave'], [2, 'point'], [3, 'cheer'], [4, 'think'], [5, 'walk'], [6, 'sit']]); };
    },
  },
  'test-side': {   // proportions from the side: knees and elbows bend the right way
    bg: G6.sky,
    build(w) {
      g6StreetLights(w); w.add(g6Street());
      const n = w.add(g6Person(G6_NIA)), r = w.add(g6Person(G6_ROCCO)); n.position.set(-0.6, 0.2, 1); r.position.set(0.6, 0.2, 1);
      return (t) => { const lt = t - w.s.t0; w.look([7, 1.6, 1.5], [0, 1.0, 1], 38); n.rotation.y = r.rotation.y = Math.PI / 2;
        const s: G6State = lt < 1.3 ? 'walk' : 'sit'; n.pose(lt, s); r.pose(lt + 0.5, s); };
    },
  },
  'test-car': {
    bg: G6.sky,
    build(w) {
      g6StreetLights(w); const st = w.add(g6Street()), car = w.add(g6Car()), n = g6Person(G6_NIA), r = g6Person(G6_ROCCO);
      car.add(n, r); n.position.set(...car.seats[0]); r.position.set(...car.seats[1]); n.rotation.y = r.rotation.y = Math.PI / 2; car.position.set(0, 0, 1.6);
      return (t) => { const lt = t - w.s.t0; st.pose(t); n.pose(t, 'sit'); r.pose(t, 'sit');
        const drive = lt > 1.5, dist = drive ? (lt - 1.5) * 6 : 0; car.pose(t, dist, p3Ramp(lt, 1.2, 1.6));
        G6Cam.orbit(w, lt / 3, [0, 1, 1.6], 12, 2.6, 0.9, 0.6, 38); };
    },
  },
  'test-street': {
    bg: G6.sky,
    build(w) { g6StreetLights(w); const st = w.add(g6Street()); return (t) => { st.pose(t); G6Cam.wide(w, g6U(w, t)); }; },
  },
  'test-calendar': {
    bg: G6.night,
    build(w) {
      g6StudioLights(w); w.add(g6Floor()); const c = w.add(g6Calendar());
      return (t) => { c.pose(t, w.K('d1'), w.K('d2'), t > w.K('d2') + 0.5 ? 1 : 0); G6Cam.orbit(w, g6U(w, t), [0, 2.2, 0], 10.5, 0.8, -0.3, 0.3); };
    },
  },
  'test-map': {
    bg: '#8ec9f0',
    build(w) {
      p3Lights(w); const m = w.add(g6Map());
      return (t) => { m.pose(t, w.K('pin')); G6Cam.orbit(w, g6U(w, t), [0.6, 0.5, -0.8], 21, 15, -0.25, 0.25, 40); };
    },
  },
  'test-screen': {
    bg: G6.night,
    build(w) {
      g6StudioLights(w); w.add(g6Floor()); const s = w.add(g6Screen());
      return (t) => { s.pose(t, w.K('play'), w.K('viral')); G6Cam.push(w, g6U(w, t), [0, 2.4, 0], 17, 14.5); };
    },
  },
  'test-consoles': {
    bg: G6.night,
    build(w) {
      g6StudioLights(w); w.add(g6Floor()); const c = w.add(g6Consoles());
      return (t) => { c.pose(t, w.K('check'), w.K('no')); G6Cam.orbit(w, g6U(w, t), [0, 1.3, 0], 14, 2.4, -0.2, 0.2); };
    },
  },
  'test-badge': {
    bg: G6.night,
    build(w) {
      g6StudioLights(w); const b = [1, 2, 3, 4, 5].map((n, i) => { const x = w.add(g6Badge(n)); x.position.set(-2.2 + i * 1.1, 1.5, 0); x.userData.s = 0.7; return x; });
      return (t) => { b.forEach((x, i) => x.pose(t, w.K('pop') + i * 0.12)); w.look([0, 1.9, 17], [0, 1.5, 0], 40); };
    },
  },
});
