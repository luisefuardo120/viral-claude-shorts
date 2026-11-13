// World of "Esos puntitos negros del borde de tu parabrisas NO están de adorno" (3D, the channel's diorama look). Prefix pp.
// Diorama, labels, lens, captions and smooth materials come from styles/3d/diorama.ts.
// Lessons from the last review: strong colors per piece, the hero big from the first second, labels, a moving camera.

const PP = { sky: '#5bb8f5', car: '#ff6b3d', carD: '#d9512a', glue: '#ffd23f', glueBad: '#7a4a1e', uv: '#c14bff', hot: '#ff5a1f', cold: '#3aa6ff', key: '#b6f23c', red: '#e5484d', glove: '#ffffff' };
const PP_FIX: Record<number, string> = { 8: 'NO', 96: 'deforma', 97: '' };   // what Whisper wrote differently from the script
const PP_W = 1.6, PP_H = 0.86;   // windshield size (m)

// ---------- the windshield: glass + the ceramic band (frit) + the dots, each its own layer ----------
// canvas layers: band = solid black border; dots = halftone dots shrinking toward the glass. Transparent elsewhere.
const ppFrit = (dots: boolean) => { const W = 1024, H = 560, B = 46, D = 92, t = p3Paint(W, H, (c) => {
  c.clearRect(0, 0, W, H); c.fillStyle = '#0c0d10';
  if (!dots) { c.fillRect(0, 0, W, B); c.fillRect(0, H - B, W, B); c.fillRect(0, 0, B, H); c.fillRect(W - B, 0, B, H); return; }
  for (let d = 0; d < D; d += 12) { const r = 6 * (1 - d / D) + 0.6; for (let x = B + d + 6; x < W - B - d; x += 12) for (const y of [B + d + 6, H - B - d - 6]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    for (let y = B + d + 6; y < H - B - d; y += 12) for (const x of [B + d + 6, W - B - d - 6]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } }
}); t.colorSpace = THREE.SRGBColorSpace; return t; };
// a gently curved panel (the windshield's shape), w x h, bulging toward +z
const ppPanel = (w = PP_W, h = PP_H, z = 0) => { const g = new THREE.PlaneGeometry(w, h, 40, 12), p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setZ(i, z - 0.08 * (p.getX(i) / (w / 2)) ** 2); g.computeVertexNormals(); return g; };
const ppWindshield = () => {
  const glassMat = new THREE.MeshStandardMaterial({ color: '#9fe3ff', transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.2, side: THREE.DoubleSide, depthWrite: false });
  const bandMat = new THREE.MeshStandardMaterial({ map: ppFrit(false), transparent: true, roughness: 0.4, side: THREE.DoubleSide, depthWrite: false, emissive: '#000000' });
  const dotMat = new THREE.MeshStandardMaterial({ map: ppFrit(true), transparent: true, roughness: 0.4, side: THREE.DoubleSide, depthWrite: false, emissive: '#000000' });
  const glass = new THREE.Mesh(ppPanel(), glassMat), band = new THREE.Mesh(ppPanel(PP_W, PP_H, 0.004), bandMat), dots = new THREE.Mesh(ppPanel(PP_W, PP_H, 0.005), dotMat);
  // the grid seen through the glass: straight lines that bend near the edge when the edge heats too fast (warp 0..1)
  const gcv = document.createElement('canvas'); gcv.width = 512; gcv.height = 280; const gc = gcv.getContext('2d')!; gc.strokeStyle = 'rgba(255,255,255,0.9)'; gc.lineWidth = 3;
  for (let x = 0; x <= 512; x += 32) { gc.beginPath(); gc.moveTo(x, 0); gc.lineTo(x, 280); gc.stroke(); } for (let y = 0; y <= 280; y += 32) { gc.beginPath(); gc.moveTo(0, y); gc.lineTo(512, y); gc.stroke(); }
  const gt = new THREE.CanvasTexture(gcv); gt.colorSpace = THREE.SRGBColorSpace;
  const gridGeo = ppPanel(PP_W - 0.14, PP_H - 0.14, -0.01), grid = new THREE.Mesh(gridGeo, new THREE.MeshBasicMaterial({ map: gt, transparent: true, opacity: 0.8, depthWrite: false })); const gp = gridGeo.attributes.position as THREE.BufferAttribute, gbase = Float32Array.from(gp.array as Float32Array);
  const g = p3Group(glass, grid, band, dots); g.children.forEach((m, i) => { m.renderOrder = 10 + i; });
  // band, dots 0..1 show them; heat 0..1 colors the band hot (and the glass cold); warp 0..1 bends the grid near the edge; gridOn 0..1
  const pose = (o: { band?: number; dots?: number; heat?: number; warp?: number; grid?: number; smooth?: number } = {}) => {
    const h = o.heat ?? 0; bandMat.opacity = o.band ?? 1; dotMat.opacity = o.dots ?? 1; bandMat.emissive.set(PP.hot); bandMat.emissiveIntensity = h * 1.4; dotMat.emissive.set(PP.hot); dotMat.emissiveIntensity = h * 1.1 * (o.smooth ?? 0);
    glassMat.color.set(h > 0.02 ? PP.cold : '#9fe3ff'); glassMat.opacity = 0.35 + h * 0.15; grid.visible = (o.grid ?? 0) > 0.02; (grid.material as THREE.MeshBasicMaterial).opacity = 0.8 * (o.grid ?? 0);
    const wv = o.warp ?? 0; for (let i = 0; i < gp.count; i++) { const x = gbase[i * 3], y = gbase[i * 3 + 1], ex = (PP_W - 0.14) / 2 - Math.abs(x), ey = (PP_H - 0.14) / 2 - Math.abs(y), e = Math.min(ex, ey), k = wv * Math.exp(-e * 14) * 0.06;
      gp.setX(i, x - Math.sign(x) * k * (ex < ey ? 1 : 0.3) + Math.sin(y * 30) * k * 0.4); gp.setY(i, y - Math.sign(y) * k * (ey <= ex ? 1 : 0.3) + Math.sin(x * 30) * k * 0.4); } gp.needsUpdate = true;
  };
  pose();
  return Object.assign(g, { pose });
};

// ---------- the car: original compact, coral; the windshield sits in a frame with its glue bead under it ----------
const ppCar = () => {
  const g = p3Group(), body = dioSmooth(PP.car, 0.35), dark = dioSmooth('#1b2433', 0.2);
  g.add(p3Mesh(new THREE.RoundedBoxGeometry(4.0, 0.75, 1.8, 4, 0.3), body, { p: [0, 0.72, 0] }));
  // under the leaning glass: a dark dashboard, with a steering wheel and the mirror (what you see through it)
  g.add(p3Mesh(new THREE.RoundedBoxGeometry(1.1, 0.12, 1.62, 2, 0.04), dioSmooth('#1e2533', 0.6), { p: [0.4, 1.12, 0] }), p3Mesh(new THREE.TorusGeometry(0.17, 0.03, 8, 24), dioSmooth('#0e1118', 0.5), { p: [0.15, 1.3, 0.38], r: [0, Math.PI / 2, 0.5] }));
  g.add(p3Mesh(new THREE.RoundedBoxGeometry(0.04, 0.07, 0.22, 2, 0.02), dioSmooth('#0e1118', 0.5), { p: [0.2, 1.55, 0] }));
  // the cabin: dark inside (what you see through the glass), coral roof on top
  g.add(p3Mesh(new THREE.RoundedBoxGeometry(1.9, 0.62, 1.62, 4, 0.22), dioSmooth('#1e2533', 0.5), { p: [-0.72, 1.35, 0] }), p3Mesh(new THREE.RoundedBoxGeometry(1.95, 0.1, 1.66, 3, 0.05), body, { p: [-0.72, 1.67, 0] }));   // the cabin ends where the windshield's top edge is
  for (const s of [1, -1]) g.add(p3Mesh(new THREE.RoundedBoxGeometry(1.5, 0.42, 0.02, 2, 0.1), dark, { p: [-0.6, 1.37, s * 0.815] }));
  g.add(p3Mesh(new THREE.RoundedBoxGeometry(0.03, 0.4, 1.4, 2, 0.1), dark, { p: [-1.5, 1.37, 0], r: [0, 0, 0.35] }));
  for (const s of [1, -1]) { g.add(p3Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 20), dioSmooth('#fff6c8', 0.2), { p: [2.0, 0.85, s * 0.6], r: [0, 0, Math.PI / 2], e: 0.4 }), p3Mesh(p3Box(0.05, 0.12, 0.35), dioSmooth(PP.red, 0.3), { p: [-2.0, 0.85, s * 0.6], e: 0.3 }));
    g.add(p3Mesh(p3Box(0.12, 0.08, 0.2), body, { p: [0.45, 1.25, s * 0.95] })); }
  for (const [x, z] of [[1.3, 0.82], [-1.3, 0.82], [1.3, -0.82], [-1.3, -0.82]]) g.add(p3Group(p3Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 24), dioSmooth('#1c1d22', 0.85), { r: [Math.PI / 2, 0, 0] }), p3Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.28, 16), dioSmooth('#c9ced8', 0.3, 0.5), { r: [Math.PI / 2, 0, 0] })).translateX(x).translateY(0.36).translateZ(z));
  // windshield mount: the glass leans back between the hood and the roof; the glue bead runs around the frame under it
  // the glass spans from the hood (y 1.12) up to the roof (y 1.62), leaning back: its face (+z) looks forward and up
  const mount = p3Group(); mount.position.set(0.62, 1.38, 0); mount.rotation.set(0, Math.PI / 2, 0); mount.rotateX(-0.95); g.add(mount);
  const frame = new THREE.Shape(); frame.moveTo(-PP_W / 2 - 0.04, -PP_H / 2 - 0.04); frame.lineTo(PP_W / 2 + 0.04, -PP_H / 2 - 0.04); frame.lineTo(PP_W / 2 + 0.04, PP_H / 2 + 0.04); frame.lineTo(-PP_W / 2 - 0.04, PP_H / 2 + 0.04);
  frame.holes.push(Object.assign(new THREE.Path(), {}).moveTo(-PP_W / 2 + 0.06, -PP_H / 2 + 0.06).lineTo(-PP_W / 2 + 0.06, PP_H / 2 - 0.06).lineTo(PP_W / 2 - 0.06, PP_H / 2 - 0.06).lineTo(PP_W / 2 - 0.06, -PP_H / 2 + 0.06) as THREE.Path);
  mount.add(p3Mesh(new THREE.ExtrudeGeometry(frame, { depth: 0.04, bevelEnabled: false }), dioSmooth('#2a2f3a', 0.6), { p: [0, 0, -0.09] }));
  const gluePts: THREE.Vector3[] = []; for (let i = 0; i <= 80; i++) { const u = i / 80, per = 2 * (PP_W + PP_H) - 0.4, d = u * per, hw = PP_W / 2 - 0.02, hh = PP_H / 2 - 0.02;
    const p = d < 2 * hw ? [-hw + d, -hh] : d < 2 * hw + 2 * hh ? [hw, -hh + (d - 2 * hw)] : d < 4 * hw + 2 * hh ? [hw - (d - 2 * hw - 2 * hh), hh] : [-hw, hh - (d - 4 * hw - 2 * hh)]; gluePts.push(new THREE.Vector3(p[0], p[1], -0.035)); }
  const glueMat = dioSmooth(PP.glue, 0.5); const glue = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(gluePts, true), 200, 0.028, 8, true), glueMat); mount.add(glue);
  const cracks = p3Group(); const R = p3Rnd(3); for (let i = 0; i < 40; i++) { const p = gluePts[Math.floor(R() * gluePts.length)]; cracks.add(p3Mesh(p3Box(0.05, 0.012, 0.012), dioSmooth('#2a1608', 0.8), { p: [p.x, p.y, p.z + 0.02], r: [0, 0, R() * 3] })); } mount.add(cracks);
  const bumps = p3Group(); for (let i = 0; i < 160; i++) { const p = gluePts[Math.floor(R() * gluePts.length)]; bumps.add(p3Mesh(new THREE.SphereGeometry(0.008, 6, 4), dioSmooth('#3a3f4a', 0.9), { p: [p.x + (R() - 0.5) * 0.06, p.y + (R() - 0.5) * 0.06, -0.006] })); } mount.add(bumps);
  const ws = ppWindshield(); mount.add(ws);
  // lift: the glass rises off the frame (m); rot: and tilts (danger); rot 0..1 glue rotting; bumps 0..1
  const pose = (o: { lift?: number; tilt?: number; rot?: number; bumps?: number } & Parameters<typeof ws.pose>[0] = {}) => {
    ws.position.z = o.lift ?? 0; ws.rotation.x = o.tilt ?? 0; glueMat.color.set(PP.glue).lerp(new THREE.Color(PP.glueBad), o.rot ?? 0); cracks.visible = (o.rot ?? 0) > 0.4; bumps.visible = (o.bumps ?? 0) > 0.02; bumps.scale.setScalar(Math.max(0.001, o.bumps ?? 0)); ws.pose(o);
  };
  pose();
  return Object.assign(g, { pose, mount, ws, gluePts });
};
// a point of the windshield (u, v from -1 to 1 across it, z off its face) in world coordinates
const ppOn = (car: ReturnType<typeof ppCar>, u: number, v: number, z = 0.02) => { car.updateMatrixWorld(true); return car.mount.localToWorld(new THREE.Vector3((u * PP_W) / 2, (v * PP_H) / 2, z)); };

// ---------- a cartoon glove that points and taps ----------
const ppHand = () => { const m = dioSmooth(PP.glove, 0.55), g = p3Group(p3Mesh(new THREE.RoundedBoxGeometry(0.16, 0.2, 0.08, 3, 0.04), m, { p: [0, -0.02, 0] }));
  g.add(p3Mesh(new THREE.CapsuleGeometry(0.026, 0.13, 4, 10), m, { p: [0.03, 0.15, 0], r: [0, 0, -0.05] }));   // index finger
  for (const [x, y] of [[-0.04, 0.06], [-0.065, 0.05], [0.0, 0.07]]) g.add(p3Mesh(new THREE.SphereGeometry(0.035, 12, 8), m, { p: [x, y, 0.025], s: [1, 0.9, 0.8] }));   // folded fingers
  g.add(p3Mesh(new THREE.CapsuleGeometry(0.025, 0.06, 4, 8), m, { p: [0.085, 0.0, 0.02], r: [0, 0, -0.9] }), p3Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.06, 18), dioSmooth(PP.key, 0.5), { p: [0, -0.15, 0] }));   // thumb, cuff
  // aim at a point from a direction; tap 0..1 pushes toward it
  const pose = (at: THREE.Vector3, from: THREE.Vector3, tap = 0) => { const dir = at.clone().sub(from).normalize(); g.position.copy(at).addScaledVector(dir, -(0.22 - 0.05 * tap)); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); };
  return Object.assign(g, { pose }); };
// UV rays from the sun to points: purple beams with dashes running along them; blocked 0..1 stops them short with a spark
const ppRays = (n = 6) => { const g = p3Group(), mat = new THREE.MeshBasicMaterial({ color: PP.uv, transparent: true, opacity: 0.85, depthWrite: false });
  const rays = Array.from({ length: n }, () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 6), mat); g.add(m); const dots = Array.from({ length: 5 }, () => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), new THREE.MeshBasicMaterial({ color: '#f0c8ff' })); g.add(d); return d; }); return { m, dots }; });
  const pose = (t: number, from: THREE.Vector3, to: THREE.Vector3[], show: number, stop = 1) => rays.forEach(({ m, dots }, i) => { const b = to[i % to.length], a = from, end = a.clone().lerp(b, stop); m.visible = show > 0.02;
    m.position.copy(a).lerp(end, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(a).normalize()); m.scale.set(1, a.distanceTo(end) * show, 1);
    dots.forEach((d, k) => { const u = ((t * 0.9 + k / dots.length + i * 0.13) % 1) * stop; d.visible = show > 0.5; d.position.copy(a).lerp(b, u); }); });
  return Object.assign(g, { pose }); };
// a heat shimmer: little orange wisps rising off the band (amount 0..1)
const ppHeat = (n = 40) => { const R = p3Rnd(15), sw = p3Swarm(n, new THREE.SphereGeometry(0.018, 6, 4), new THREE.MeshBasicMaterial({ color: PP.hot })), P = Array.from({ length: n }, () => [R(), R(), R()]);
  return Object.assign(sw, { pose: (t: number, pts: THREE.Vector3[], amount: number) => { P.forEach(([ph, k, s], i) => { const u = (t * 0.8 + ph) % 1, p = pts[Math.floor(k * pts.length) % pts.length]; if (amount < 0.02) { sw.hide(i); return; } sw.put(i, p.x + Math.sin(u * 9 + s * 6) * 0.03, p.y + u * 0.35, p.z, amount * (1 - u) * (0.6 + s)); }); sw.done(); } }); };

// the street set: diorama with the road, the car parked on it, the sun up high
const ppStreet = (w: World) => {
  dioLights(w); w.add(dioDiorama({ w: 40, d: 26 })); [[-10, 14, -26, 2], [12, 16, -30, 2.4]].forEach(([x, y, z, s]) => w.add(dioCloud([x, y, z], s)));
  const sun = w.add(dioSun()); sun.position.set(6, 9, -12); sun.scale.setScalar(0.55);
  const car = w.add(ppCar()); car.position.set(0, 0.02, 1.8); car.rotation.y = -0.3;
  return { car, sun, cap: dioCaptions(w, PP_FIX) };
};
// a camera close on the windshield: from in front of the car, at an offset along its surface (u, v) and a distance
const ppGlassCam = (w: World, car: ReturnType<typeof ppCar>, u: number, v: number, d: number, fov = 36) => { const at = ppOn(car, u, v, 0), n = ppOn(car, u, v, 1).sub(at), from = at.clone().addScaledVector(n, d).add(new THREE.Vector3(0, 0.15 * d, 0));
  w.look([from.x, from.y, from.z], [at.x, at.y, at.z], fov); return { at, from }; };

// ---------- world test shots ----------
defineVisuals({
  'test-car': {   // the street, the car; the glass lifts to show the glue; labels
    bg: PP.sky,
    build(w) { const { car } = ppStreet(w), lab = w.add(dioLabel('PEGAMENTO', PP.glue, 0.22)), hand = w.add(ppHand());
      return (t) => { const lt = t - w.s.t0; car.pose({ lift: 0.35 * p3Ramp(lt, 0.8, 1.3), band: 1, dots: 1 }); const p = ppOn(car, 0.9, -0.95, 0.12); lab.position.copy(ppOn(car, 0.3, -0.75, 0.5)); void p; lab.pose(lt > 1.3 ? 1 : 0);
        hand.pose(ppOn(car, -0.85, -0.85, 0.37 * p3Ramp(lt, 0.8, 1.3)), ppOn(car, -0.7, -1.5, 0.9), Math.abs(Math.sin(lt * 5))); ppGlassCam(w, car, -0.1, -0.1, 3.6 - lt * 0.3, 40); }; },
  },
  'test-heat': {   // UV rays, heat colors, the grid warping, then the dots
    bg: PP.sky,
    build(w) { const { car, sun } = ppStreet(w), rays = w.add(ppRays()), heat = w.add(ppHeat());
      return (t) => { const lt = t - w.s.t0, pts = [-0.95, -0.5, 0, 0.5, 0.95].map((u) => ppOn(car, u, 0.97, 0.01)); rays.pose(t, sun.position, pts, 1, lt < 1 ? 1 : 0.92);
        car.pose({ band: 1, dots: lt > 1.8 ? 1 : 0, heat: 1, warp: lt > 1.8 ? 0 : 1, grid: 1, smooth: lt > 1.8 ? 1 : 0 }); heat.pose(t, pts, 1); ppGlassCam(w, car, 0.45, 0.45, 2.2, 38); }; },
  },
});
