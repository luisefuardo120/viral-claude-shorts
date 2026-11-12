// World of "¿Por qué los aviones no vuelan en línea recta en el mapa?" (3D, refined look like the reference train video):
// heroes smooth and rounded (lathe and bevelled shapes, smooth shading, environment light), ground with texture
// (striped grass, asphalt with grain), background low-poly and faceted (hills, trees). Prefix ra.

const RA = { sky: '#5bb8f5', white: '#f5f6f8', blue: '#1f5fd6', red: '#e5484d', window: '#1b2433', metal: '#c9ced8', grass: '#5cc24a', key: '#b6f23c' };


// ---------- the Earth: one piece that turns from a globe into a flat Mercator map (morph 0 → 1) ----------
type RaLL = [number, number];   // [longitude, latitude] in degrees
const RA_R = 3, RA_LON0 = -55, RA_TILT = 38, RA_LATC = 42;   // radius, the longitude facing the camera, how much the north tilts toward it, the map's center latitude
const RA_LAND: Record<string, RaLL[]> = {
  northAmerica: [[-168, 66], [-162, 70], [-140, 70], [-125, 70], [-95, 72], [-80, 73], [-65, 62], [-60, 55], [-52, 47], [-66, 44], [-70, 41], [-76, 35], [-81, 31], [-80, 25], [-82, 28], [-84, 30], [-90, 29], [-97, 27], [-97, 22], [-92, 18], [-87, 21], [-88, 15], [-83, 9], [-78, 8], [-80, 7], [-85, 10], [-92, 14], [-105, 20], [-110, 23], [-112, 29], [-114, 31], [-117, 32], [-121, 35], [-124, 40], [-124, 48], [-130, 55], [-140, 60], [-150, 61], [-158, 57], [-166, 60]],
  southAmerica: [[-78, 8], [-72, 12], [-62, 11], [-52, 5], [-35, -6], [-39, -15], [-41, -22], [-48, -26], [-53, -34], [-58, -38], [-65, -42], [-68, -50], [-72, -53], [-75, -47], [-73, -38], [-71, -30], [-70, -18], [-76, -14], [-81, -5], [-80, 0], [-77, 4]],
  greenland: [[-73, 78], [-60, 82], [-40, 83], [-22, 82], [-18, 76], [-22, 70], [-32, 68], [-42, 60], [-50, 64], [-54, 68], [-58, 75], [-68, 77]],
  eurasia: [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [2, 51], [8, 54], [8, 57], [5, 62], [12, 66], [20, 70], [30, 71], [40, 68], [60, 70], [80, 73], [100, 77], [120, 73], [140, 72], [160, 70], [180, 68], [180, 65], [170, 60], [160, 58], [155, 50], [142, 46], [135, 43], [130, 35], [122, 31], [120, 23], [110, 20], [108, 12], [104, 9], [100, 13], [98, 8], [100, 3], [104, 1], [98, 16], [94, 16], [90, 22], [80, 15], [77, 8], [72, 20], [67, 25], [57, 25], [56, 27], [50, 30], [48, 30], [56, 24], [59, 22], [52, 16], [44, 12], [42, 15], [35, 28], [34, 31], [36, 36], [28, 37], [26, 40], [23, 36], [20, 40], [16, 38], [12, 44], [8, 44], [3, 43], [-1, 37], [-6, 36]],
  africa: [[-17, 21], [-10, 30], [-6, 36], [10, 37], [11, 33], [20, 31], [32, 31], [34, 28], [39, 16], [43, 12], [51, 12], [48, 5], [40, -3], [39, -10], [40, -16], [35, -24], [32, -29], [27, -34], [20, -35], [18, -30], [12, -17], [13, -8], [9, -1], [9, 4], [4, 6], [-8, 4], [-13, 8], [-17, 14]],
  britain: [[-6, 50], [1, 51], [2, 53], [-2, 56], [-3, 58.6], [-6, 58], [-5, 54], [-4, 52]],
  ireland: [[-10, 52], [-6, 52], [-6, 55], [-8, 55]],
  iceland: [[-24, 64], [-14, 64], [-14, 66], [-22, 66.5]],
  madagascar: [[44, -25], [50, -15], [49, -12], [44, -17]],
  australia: [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [145, -39], [138, -35], [131, -31], [115, -34], [113, -26]],
};
const RA_LONDON: RaLL = [-0.1, 51.5], RA_LA: RaLL = [-118.2, 34];
const raMerc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (p3Clamp(lat, -85, 85) * Math.PI) / 360));
const raWrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
// a point of the Earth at morph m (0 globe, 1 map), h meters above the surface; lon0 = the longitude facing the camera
const raPt = (lon: number, lat: number, m: number, h = 0, lon0 = RA_LON0) => {
  const l = (raWrap(lon - lon0) * Math.PI) / 180, f = (lat * Math.PI) / 180, T = (RA_TILT * Math.PI) / 180, r = RA_R + h;
  const x = Math.cos(f) * Math.sin(l), y0 = Math.sin(f), z0 = Math.cos(f) * Math.cos(l);
  const S = new THREE.Vector3(x * r, (y0 * Math.cos(T) - z0 * Math.sin(T)) * r, (y0 * Math.sin(T) + z0 * Math.cos(T)) * r);
  const P = new THREE.Vector3(l * RA_R, (raMerc(Math.min(lat, 82)) - raMerc(RA_LATC)) * RA_R, RA_R + h);   // the map stops at 82° N
  return S.lerp(P, m);
};
const raNormal = (lon: number, lat: number, m: number, lon0 = RA_LON0) => raPt(lon, lat, 0, 0, lon0).normalize().lerp(new THREE.Vector3(0, 0, 1), m).normalize();
let RA_TEX: THREE.Texture | null = null;
const raEarthTex = () => RA_TEX ??= (() => { const W = 2048, H = 1024, t = p3Paint(W, H, (c) => {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3aa4e8'); g.addColorStop(0.5, '#2a8fd8'); g.addColorStop(1, '#3aa4e8'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const X = (lon: number) => ((lon + 180) / 360) * W, Y = (lat: number) => ((90 - lat) / 180) * H;
  c.fillStyle = '#f2f7fb'; c.fillRect(0, Y(-70), W, H);
  for (const [name, pts] of Object.entries(RA_LAND)) {
    c.beginPath(); pts.forEach(([lo, la], i) => (i ? c.lineTo(X(lo), Y(la)) : c.moveTo(X(lo), Y(la)))); c.closePath();
    c.fillStyle = name === 'greenland' ? '#eef6fb' : '#58c24c'; c.fill(); c.lineWidth = 5; c.strokeStyle = name === 'greenland' ? '#bcd6e6' : '#3f9a36'; c.stroke();
  }
}); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; return t; })();
const raEarth = () => {
  const NX = 160, NY = 90, geo = new THREE.PlaneGeometry(1, 1, NX, NY), pos = geo.attributes.position as THREE.BufferAttribute, uv = geo.attributes.uv as THREE.BufferAttribute;
  const ll: RaLL[] = [];
  for (let i = 0; i < pos.count; i++) { const lon = RA_LON0 + (uv.getX(i) - 0.5) * 359.98,   // not 360: the last column would wrap to the far side
    lat = p3Lerp(-89.9, 89.9, uv.getY(i)); ll.push([lon, lat]); uv.setX(i, (lon + 180) / 360); uv.setY(i, (lat + 90) / 180); }
  uv.needsUpdate = true;
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: raEarthTex(), roughness: 0.55, side: THREE.DoubleSide })); mesh.castShadow = false; mesh.receiveShadow = false; mesh.frustumCulled = false;
  const g = p3Group(mesh);
  let last = '';
  // m: morph (0 globe, 1 map); spin: degrees the globe has turned (only while it's a globe)
  const pose = (m: number, spin = 0) => {
    const k = m.toFixed(4) + '/' + spin.toFixed(3); if (k === last) return; last = k;
    ll.forEach(([lon, lat], i) => { const p = raPt(lon - spin, lat, m); pos.setXYZ(i, p.x, p.y, p.z); });
    pos.needsUpdate = true; geo.computeVertexNormals();
  };
  pose(0);
  return Object.assign(g, { pose });
};
// a route over the Earth (lon/lat points), drawn as a tube that grows from its start; follows the morph
const raRoute = (pts: RaLL[], color: string, r = 0.045) => {
  const mat = dioSmooth(color, 0.4); mat.emissive.set(color); mat.emissiveIntensity = 0.25;
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat); mesh.frustumCulled = false;
  const pose = (m: number, grow: number, spin = 0) => {
    mesh.visible = grow > 0.01; if (!mesh.visible) return;
    const n = Math.max(2, Math.round(pts.length * p3Clamp(grow))), V = pts.slice(0, n).map(([lo, la]) => raPt(lo - spin, la, m, 0.04));
    mesh.geometry.dispose(); mesh.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(V), n * 2, r, 8);
  };
  return Object.assign(mesh, { pose, pts });
};
const raGreatCircle = (a: RaLL, b: RaLL, n = 80, extend = 0): RaLL[] => {
  const v = ([lo, la]: RaLL) => new THREE.Vector3(Math.cos((la * Math.PI) / 180) * Math.cos((lo * Math.PI) / 180), Math.sin((la * Math.PI) / 180), Math.cos((la * Math.PI) / 180) * Math.sin((lo * Math.PI) / 180));
  const A = v(a), B = v(b), w = A.angleTo(B), out: RaLL[] = [];
  for (let i = 0; i <= n; i++) { const s = p3Lerp(-extend, 1 + extend, i / n) * w, P = A.clone().multiplyScalar(Math.sin(w - s) / Math.sin(w)).add(B.clone().multiplyScalar(Math.sin(s) / Math.sin(w)));
    out.push([(Math.atan2(P.z, P.x) * 180) / Math.PI, (Math.asin(p3Clamp(P.y, -1, 1)) * 180) / Math.PI]); }
  return out;
};
const raRhumb = (a: RaLL, b: RaLL, n = 80): RaLL[] => Array.from({ length: n + 1 }, (_, i) => { const u = i / n, y = p3Lerp(raMerc(a[1]), raMerc(b[1]), u);
  return [p3Lerp(a[0], b[0], u), ((2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180) / Math.PI] as RaLL; });
// a map pin (red drop) standing on the Earth
const raPin = (color = RA.red) => { const g = p3Group(p3Mesh(p3Cone(0.07, 0.3, 14), dioSmooth(color, 0.35), { p: [0, 0.15, 0], r: [Math.PI, 0, 0] }), p3Mesh(new THREE.SphereGeometry(0.12, 18, 12), dioSmooth(color, 0.35), { p: [0, 0.34, 0] }), p3Mesh(new THREE.SphereGeometry(0.05, 12, 8), dioSmooth('#ffffff', 0.4), { p: [0, 0.36, 0.09] }));
  const pose = (ll: RaLL, m: number, pop = 1, spin = 0) => { const n = raNormal(ll[0] - spin, ll[1], m); g.position.copy(raPt(ll[0] - spin, ll[1], m)); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n); g.scale.setScalar(Math.max(0.001, pop) * (1 + 1.3 * m)); };   // bigger on the map: its camera is farther
  return Object.assign(g, { pose });
};
// the small plane that rides a route (u: 0..1 along it)
const raPlaneIcon = (s = 0.045) => { const p = dioAirliner(); p.scale.setScalar(s); p.rotation.y = -Math.PI / 2; const g = p3Group(p);   // its nose (+x) now looks along +z
  const pose = (route: RaLL[], u: number, m: number, h = 0.25, spin = 0) => {
    const f = p3Clamp(u) * (route.length - 1), i = Math.min(route.length - 2, Math.floor(f)), k = f - i, at = (j: number) => raPt(route[j][0] - spin, route[j][1], m, h);
    const P = at(i).lerp(at(i + 1), k), D = at(i + 1).sub(at(i)).normalize(), N = raNormal(route[i][0] - spin, route[i][1], m);
    g.position.copy(P); g.up.copy(N); g.lookAt(P.clone().add(D));
  };
  return Object.assign(g, { pose });
};
// the jet streams: white arcs circling the globe from west to east between 40° and 60° N (a loop).
// Three groups turn about the Earth's axis at different speeds; the globe hides the ones behind it.
const raJets = () => {
  const R = p3Rnd(9), mat = dioSmooth('#ffffff', 0.5), axis = raPt(0, 90, 0).normalize(), g = p3Group();
  const groups = [0, 1, 2].map((k) => { const sub = p3Group(); g.add(sub);
    for (let i = 0; i < 12; i++) { const lon = R() * 360, lat = 40 + R() * 20, len = 10 + R() * 12;
      const pts = Array.from({ length: 9 }, (_, j) => raPt(lon + (len * j) / 8, lat, 0, 0.06 + k * 0.025));
      sub.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.026, 6), mat)); }
    return { sub, v: 22 + k * 9 }; });
  const pose = (t: number, spin = 0, show = 1) => { g.visible = show > 0.01; g.scale.setScalar(p3Lerp(0.9, 1, show));
    groups.forEach(({ sub, v }) => sub.quaternion.setFromAxisAngle(axis, ((v * t - spin) * Math.PI) / 180)); };
  return Object.assign(g, { pose });
};
// the disc of a great circle: the plane through the Earth's center and both cities
const raRing = (a: RaLL, b: RaLL) => {
  const mat = new THREE.MeshStandardMaterial({ color: RA.key, transparent: true, opacity: 0.4, side: THREE.DoubleSide, roughness: 0.5, depthWrite: false });
  const disc = new THREE.Mesh(new THREE.RingGeometry(RA_R * 0.0, RA_R * 1.32, 64), mat), rim = new THREE.Mesh(new THREE.TorusGeometry(RA_R * 1.32, 0.05, 8, 120), dioSmooth(RA.key, 0.4));
  const g = p3Group(disc, rim), A = raPt(a[0], a[1], 0).normalize(), B = raPt(b[0], b[1], 0).normalize(), N = A.clone().cross(B).normalize();
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), N);
  const pose = (u: number) => { g.visible = u > 0.01; g.scale.setScalar(Math.max(0.001, u)); mat.opacity = 0.4 * p3Clamp(u); };
  return Object.assign(g, { pose });
};
// Greenland next to Africa, both as Mercator shows them; .pose(shrink): Greenland goes to its real size (Africa ≈ 14 times larger)
const raCompare = () => {
  const flat = (pts: RaLL[], lonC: number) => pts.map(([lo, la]) => [((lo - lonC) * Math.PI) / 180, raMerc(la)]);
  const area = (p: number[][]) => Math.abs(p.reduce((s, [x, y], i) => { const [X, Y] = p[(i + 1) % p.length]; return s + x * Y - X * y; }, 0)) / 2;
  const G = flat(RA_LAND.greenland, -45), A = flat(RA_LAND.africa, 18), gy = G.reduce((s, p) => s + p[1], 0) / G.length, ay = A.reduce((s, p) => s + p[1], 0) / A.length;
  const mk = (pts: number[][], cy: number, c: string, edge: string) => { const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y - cy)));
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 }), dioSmooth(c, 0.5)); m.castShadow = true;
    const o = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x * 1.04, (y - cy) * 1.04)))), dioSmooth(edge, 0.6)); o.position.z = -0.02; return p3Group(m, o); };
  const green = mk(G, gy, '#eef6fb', '#13203a'), africa = mk(A, ay, '#ffcf4a', '#13203a');
  green.position.set(-0.75, 0.45, 0); africa.position.set(0.75, -0.1, 0);
  const real = Math.sqrt(area(A) / 14 / area(G));   // the scale that makes Greenland's area 1/14 of Africa's
  const g = p3Group(green, africa); g.scale.setScalar(1.7);
  const pose = (t: number, kShrink: number) => { const u = p3Spring(t, kShrink, 160, 16); green.scale.setScalar(p3Lerp(1, real, u)); green.position.y = p3Lerp(0.45, 0.1, u); };
  return Object.assign(g, { pose, real });
};
// two time bars, outbound and return, each with its small plane; .pose(u1, u2) fills them
const raBars = () => {
  const g = p3Group(), lab = (txt: string) => new THREE.MeshBasicMaterial({ map: p3Paint(512, 128, (c) => { c.font = '900 92px "RA Heavy", sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.lineWidth = 16; c.strokeStyle = '#13203a'; c.strokeText(txt, 10, 66); c.fillStyle = '#ffffff'; c.fillText(txt, 10, 66); }), transparent: true });
  const rows = [['IDA', '#58c24c', 2.6], ['VUELTA', RA.red, 3.6]].map(([txt, c, L], i) => {
    const y = 0.9 - i * 1.6, track = p3Mesh(new THREE.BoxGeometry(4.4, 0.42, 0.2), dioSmooth('#ffffff', 0.6), { p: [0.2, y, 0] });
    const geo = new THREE.BoxGeometry(1, 0.42, 0.24); geo.translate(0.5, 0, 0); const bar = p3Mesh(geo, dioSmooth(c as string, 0.45), { p: [-2.0, y, 0.02] });
    const label = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), lab(txt as string)); label.position.set(-1.0, y + 0.55, 0.1);
    const ic = dioAirliner(); ic.scale.setScalar(0.07); ic.position.set(-2.0, y + 0.02, 0.4); if (i) ic.rotation.y = Math.PI;
    g.add(track, bar, label, ic); return { bar, ic, L: L as number, i };
  });
  const pose = (u1: number, u2: number) => rows.forEach((r, i) => { const u = i ? u2 : u1, l = Math.max(0.001, r.L * p3Clamp(u)); r.bar.scale.x = l; r.ic.position.x = -2.0 + l; });
  return Object.assign(g, { pose });
};

const RA_FIX: Record<number, string> = { 0: '¿Por qué', 10: 'mapa?', 42: 'Tierra', 198: 'veces', 199: 'tarda' };
// ---------- world test shots ----------
const RA_GC = raGreatCircle(RA_LONDON, RA_LA), RA_RH = raRhumb(RA_LONDON, RA_LA);
defineVisuals({
  'test-earth': {   // globe → map and back, with both routes
    bg: RA.sky,
    build(w) {
      dioLights(w); dioSkyBack(w); const e = w.add(raEarth()), gc = w.add(raRoute(RA_GC, RA.key)), rh = w.add(raRoute(RA_RH, RA.red));
      const pins = [w.add(raPin()), w.add(raPin())];
      return (t) => { const lt = t - w.s.t0, m = p3Ramp(lt, 0.8, 1.3) - p3Ramp(lt, 2.6, 3.1);
        e.pose(m); gc.pose(m, 1); rh.pose(m, 1); pins[0].pose(RA_LONDON, m); pins[1].pose(RA_LA, m); w.look([0, 0.4, p3Lerp(17, 27, m)], [p3Lerp(0, -0.3, m), p3Lerp(0.6, 1.2, m), 0], 36); };
    },
  },
  'test-globe': {   // pins pop, the thread grows, the ring and the jet streams
    bg: RA.sky,
    build(w) {
      dioLights(w); dioSkyBack(w); const e = w.add(raEarth()), gc = w.add(raRoute(RA_GC, RA.key)), ring = w.add(raRing(RA_LONDON, RA_LA)), jets = w.add(raJets());
      const pins = [w.add(raPin()), w.add(raPin())], ic = w.add(raPlaneIcon());
      return (t) => { const lt = t - w.s.t0; e.pose(0); pins.forEach((p, i) => p.pose(i ? RA_LA : RA_LONDON, 0, p3Spring(t, w.K('pins') + i * 0.12)));
        gc.pose(0, p3Ramp(t, w.K('grow'), w.K('grow') + 0.5)); ring.pose(p3Spring(t, w.K('ring'), 160, 16)); jets.pose(lt, 0, p3Ramp(t, w.K('jets'), w.K('jets') + 0.4));
        ic.pose(RA_GC, p3Clamp((t - w.K('grow')) / 3), 0); w.look([0, 1.2, 15.5], [0, 0.5, 0], 36); };
    },
  },
  'test-compare': {
    bg: RA.sky,
    build(w) { dioLights(w); dioSkyBack(w); const c = w.add(raCompare()); return (t) => { c.pose(t, w.K('shrink')); w.look([0, 0, 16], [0, 0.5, 0], 36); }; },
  },
  'test-bars': {
    bg: RA.sky,
    build(w) { dioLights(w); dioSkyBack(w); const b = w.add(raBars()); return (t) => { b.pose(p3Ramp(t, w.K('fill'), w.K('fill') + 0.5), p3Ramp(t, w.K('fill') + 0.3, w.K('fill') + 0.8)); w.look([0, 0, 16], [0.2, 0.2, 0], 36); }; },
  },
  'test-quality': {
    bg: RA.sky,
    build(w) {
      dioLights(w); w.add(dioDiorama()); [[-10, 14, -26, 1.8], [12, 16, -32, 2.2]].forEach(([x, y, z, s]) => w.add(dioCloud([x, y, z], s)));
      const plane = w.add(dioAirliner()); plane.position.set(1, plane.height + 0.03, 0); plane.rotation.y = 0.1;
      return (t) => { const u = p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0)), a = p3Lerp(0.62, 0.5, u); w.look([6 + Math.cos(a) * 44, 16, 4 + Math.sin(a) * 44], [6, 2.2, 4], 36); };
    },
  },
  'test-low': {
    bg: RA.sky,
    build(w) {
      dioLights(w); w.add(dioDiorama()); w.add(dioCloud([-4, 12, -26], 2)); const sun = w.add(dioSun()); sun.position.set(-9, 15, -30);
      const plane = w.add(dioAirliner()); plane.position.set(1, plane.height + 0.03, 0);
      return () => { w.look([14, 2.2, 15], [2.5, 2.4, 0], 36); };
    },
  },
});
