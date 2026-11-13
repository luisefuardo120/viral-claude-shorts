// World of "Ese agujerito de la ventanilla del avión NO está de adorno" (3D, the channel's diorama look). Prefix av.
// Airliner, diorama, lens, captions and smooth materials come from styles/3d/diorama.ts.
// Units are meters, at real scale: a cabin window is about 25 x 35 cm.

const AV = { sky: '#5bb8f5', wall: '#f4f2ee', bezel: '#dfe3ea', seat: '#2a4f9c', seatD: '#203d7a', key: '#b6f23c', red: '#e5484d', air: '#6fd3ff', fog: '#ffffff' };
const AV_FIX: Record<number, string> = {};   // the transcription matches the script
const AV_W = 0.25, AV_H = 0.35;   // window pane size

// a rounded rectangle outline (w x h, corner radius r) as a THREE.Shape or Path
const avRound = <T extends THREE.Path>(p: T, w: number, h: number, r: number, cx = 0, cy = 0) => {
  const x0 = cx - w / 2, y0 = cy - h / 2; p.moveTo(x0 + r, y0); p.lineTo(x0 + w - r, y0); p.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r); p.lineTo(x0 + w, y0 + h - r); p.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
  p.lineTo(x0 + r, y0 + h); p.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r); p.lineTo(x0, y0 + r); p.quadraticCurveTo(x0, y0, x0 + r, y0); return p; };

// ---------- the window: three panes (outer, middle with the hole, inner plastic) ----------
// each pane: tinted glass with a solid rim so it reads; .pose sets how far apart they are (explode) and what glows
const avPane = (color: string, w: number, h: number, hole: boolean) => {
  const shape = avRound(new THREE.Shape(), w, h, 0.09);
  if (hole) shape.holes.push(new THREE.Path().absarc(0, -h / 2 + 0.05, 0.009, 0, Math.PI * 2, true));
  const glass = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false });
  const g = p3Group(new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: false, curveSegments: 16 }), glass));
  const rimShape = avRound(new THREE.Shape(), w + 0.012, h + 0.012, 0.095); rimShape.holes.push(avRound(new THREE.Path(), w - 0.006, h - 0.006, 0.087));
  const rimMat = dioSmooth(color, 0.3); const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(rimShape, { depth: 0.014, bevelEnabled: false, curveSegments: 16 }), rimMat); g.add(rim);
  let ring: THREE.Mesh | null = null;
  if (hole) { ring = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.0035, 8, 32), dioSmooth(AV.key, 0.3)); (ring.material as THREE.MeshStandardMaterial).emissive.set(AV.key); ring.position.set(0, -h / 2 + 0.05, 0.016); g.add(ring); }
  // glow 0..1: the rim lights up; ringShow 0..1: the lime ring around the hole
  const pose = (glow = 0, ringShow = 0) => { rimMat.emissive.set(color); rimMat.emissiveIntensity = glow * 0.8; glass.opacity = 0.32 + glow * 0.2; if (ring) { ring.visible = ringShow > 0.02; ring.scale.setScalar(Math.max(0.001, ringShow)); } };
  return Object.assign(g, { pose, glass });
};
const avWindow = () => {
  const outer = avPane('#7fc4ff', AV_W, AV_H, false), middle = avPane('#bde7ff', AV_W, AV_H, true), inner = avPane('#f5f7fa', AV_W + 0.02, AV_H + 0.02, false);
  const g = p3Group(outer, middle, inner);
  // explode 0..1 pulls them apart (outer goes out, inner comes in); z = 0 is the cabin wall's face
  const pose = (o: { explode?: number; outer?: number; middle?: number; inner?: number; hole?: number } = {}) => {
    const e = o.explode ?? 0; outer.position.z = -0.075 - 0.25 * e; middle.position.z = -0.05; inner.position.z = -0.012 + 0.25 * e;
    g.position.z = 0.55 * e;   // pulled apart, the panes float out into the cabin, clear of the wall
    outer.pose(o.outer ?? 0); middle.pose(o.middle ?? 0, o.hole ?? 0); inner.pose(o.inner ?? 0);
  };
  pose();
  return Object.assign(g, { pose, outer, middle, inner });
};

// ---------- the cabin around the window: curved wall with the bezel and shade, seats, bins, lights ----------
const avCabin = () => {
  const g = p3Group(), wallMat = dioSmooth(AV.wall, 0.6);
  // the wall: a panel with a window opening, slightly curved, and a row of windows along it
  const panel = avRound(new THREE.Shape(), 7, 2.4, 0.05, 0, 0); for (const x of [-1.6, -0.8, 0, 0.8, 1.6]) panel.holes.push(avRound(new THREE.Path(), AV_W + 0.07, AV_H + 0.07, 0.11, x, 0.15));
  const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(panel, { depth: 0.05, bevelEnabled: false, curveSegments: 16 }), wallMat); wall.position.z = -0.05; wall.receiveShadow = true; g.add(wall);
  for (const x of [-1.6, -0.8, 0, 0.8, 1.6]) {
    const bz = avRound(new THREE.Shape(), AV_W + 0.16, AV_H + 0.16, 0.15, x, 0.15); bz.holes.push(avRound(new THREE.Path(), AV_W + 0.06, AV_H + 0.06, 0.11, x, 0.15));
    g.add(new THREE.Mesh(new THREE.ExtrudeGeometry(bz, { depth: 0.04, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 16 }), dioSmooth(AV.bezel, 0.45)));
    g.add(p3Mesh(new THREE.RoundedBoxGeometry(AV_W + 0.05, 0.07, 0.02, 2, 0.008), dioSmooth('#d3d8e0', 0.5), { p: [x, 0.15 + AV_H / 2 + 0.03, 0.03] }));   // the shade, rolled up
    if (x !== 0) { const w = avWindow(); w.position.set(x, 0.15, 0); g.add(w); }
  }
  // overhead bins with their latches, reading lights
  g.add(p3Mesh(new THREE.RoundedBoxGeometry(7, 0.5, 0.75, 3, 0.08), dioSmooth('#f4f5f7', 0.5), { p: [0, 1.05, 0.38] }));
  for (const x of [-2.6, -1.3, 0, 1.3, 2.6]) g.add(p3Mesh(p3Box(0.25, 0.04, 0.02), dioSmooth('#9aa3b0', 0.4), { p: [x, 0.95, 0.76] }), p3Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 16), dioSmooth('#fff6c8', 0.3), { p: [x + 0.3, 0.79, 0.55], e: 0.6 }));
  // two rows of seats by the windows
  // seats to the sides of the hero window (x = 0), never between it and the cameras (which look from +x, +z)
  for (const sx of [-0.85, 1.35]) for (const dz of [0.7]) {
    const seat = p3Group(p3Mesh(new THREE.RoundedBoxGeometry(0.5, 0.12, 0.5, 2, 0.05), dioSmooth(AV.seat, 0.85), { p: [0, -0.62, 0] }), p3Mesh(new THREE.RoundedBoxGeometry(0.5, 0.75, 0.12, 2, 0.05), dioSmooth(AV.seat, 0.85), { p: [-0.02, -0.22, -0.2], r: [-0.12, 0, 0] }),
      p3Mesh(new THREE.RoundedBoxGeometry(0.42, 0.18, 0.13, 2, 0.04), dioSmooth('#f5f6f8', 0.7), { p: [-0.02, 0.1, -0.22], r: [-0.12, 0, 0] }));
    for (const ax of [-0.27, 0.27]) seat.add(p3Mesh(new THREE.RoundedBoxGeometry(0.06, 0.06, 0.42, 2, 0.02), dioSmooth('#3a3f4a', 0.6), { p: [ax, -0.42, 0.02] }));
    seat.position.set(sx, 0, dz); seat.rotation.y = Math.PI / 2; g.add(seat);
  }
  // richer cabin: two-tone wall (blue-grey dado below the windows), panel joints, mood light under the bins, vents, carpet with a pattern, floor lights
  g.add(p3Mesh(p3Box(7, 0.62, 0.03), dioSmooth('#7d8aa3', 0.55), { p: [0, -0.62, 0.02] }), p3Mesh(p3Box(7, 0.03, 0.035), dioSmooth('#c9ced8', 0.4), { p: [0, -0.3, 0.03] }));
  for (const x of [-2.0, -1.2, -0.4, 0.4, 1.2, 2.0]) g.add(p3Mesh(p3Box(0.006, 2.2, 0.01), dioSmooth('#c3c8d0', 0.6), { p: [x, 0, 0.005] }));
  const mood = p3Mesh(p3Box(7, 0.035, 0.035), new THREE.MeshBasicMaterial({ color: '#7fd6ff' }), { p: [0, 0.79, 0.74] }); g.add(mood);
  g.add(p3Mesh(p3Box(7, 0.2, 0.02), new THREE.MeshBasicMaterial({ color: '#cfeeff', transparent: true, opacity: 0.35 }), { p: [0, 0.68, 0.73] }));
  for (const x of [-2.4, -1.2, 0, 1.2, 2.4]) g.add(p3Mesh(new THREE.RoundedBoxGeometry(0.22, 0.05, 0.02, 2, 0.01), dioSmooth('#c9ced8', 0.5), { p: [x + 0.4, 0.62, 0.02] }));
  const carpet = p3Paint(256, 256, (c) => { c.fillStyle = '#3d4a66'; c.fillRect(0, 0, 256, 256); c.fillStyle = '#4a5878'; for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 ? 16 : 0; x < 256; x += 32) c.fillRect(x, y, 10, 10); });
  carpet.wrapS = carpet.wrapT = THREE.RepeatWrapping; carpet.repeat.set(10, 3); carpet.colorSpace = THREE.SRGBColorSpace;
  g.add(p3Mesh(p3Box(7, 0.04, 2), new THREE.MeshStandardMaterial({ map: carpet, roughness: 0.95 }), { p: [0, -0.95, 0.9] }));
  for (let x = -3; x <= 3; x += 0.5) g.add(p3Mesh(p3Box(0.08, 0.02, 0.03), new THREE.MeshBasicMaterial({ color: '#ffe08a' }), { p: [x, -0.92, 0.15] }));
  return g;
};
// outside: the sky going by, and the diorama far below
const avOutside = (w: World) => {
  const clouds = [[-3, -1.5, -9, 1], [2, 0.5, -12, 1.3], [6, -2.5, -10, 1.1], [-7, 1, -14, 1.5], [10, -1, -13, 1.2]].map(([x, y, z, s]) => ({ c: w.add(dioCloud([x, y, z], s)), x }));
  const land = w.add(dioDiorama()); land.scale.setScalar(0.7); land.position.set(0, -40, -60);
  return (t: number) => clouds.forEach(({ c, x }) => { c.position.x = ((((x + t * 3) % 30) + 30) % 30) - 15; });
};

// ---------- air: dense in the cabin, thin outside; a stream through the hole ----------
// particles jittering in a box (x0..x1, y0..y1, z0..z1); n shown = amount
const avAir = (n: number, box: [number, number, number, number, number, number], color = AV.air, r = 0.006, seed = 5) => {
  const R = p3Rnd(seed), P = Array.from({ length: n }, () => [p3Lerp(box[0], box[1], R()), p3Lerp(box[2], box[3], R()), p3Lerp(box[4], box[5], R()), R() * 6]);
  const sw = p3Swarm(n, new THREE.SphereGeometry(r, 8, 6), new THREE.MeshBasicMaterial({ color }));
  return Object.assign(sw, { pose: (t: number, amount: number) => { P.forEach(([x, y, z, ph], i) => { if (i / n >= amount) { sw.hide(i); return; } sw.put(i, x + 0.004 * Math.sin(t * 9 + ph), y + 0.004 * Math.cos(t * 8 + ph * 2), z + 0.004 * Math.sin(t * 7 + ph * 3), 1); }); sw.done(); } });
};
// a stream of particles from a point through the hole into the gap (a loop): from a, through h, spreading in the gap around g
const avStream = (n = 30, color = AV.air) => { const sw = p3Swarm(n, new THREE.SphereGeometry(0.0045, 8, 6), new THREE.MeshBasicMaterial({ color })), R = p3Rnd(13), S = Array.from({ length: n }, () => [R(), (R() - 0.5) * 0.18, R() * 0.2]);
  return Object.assign(sw, { pose: (t: number, a: THREE.Vector3, h: THREE.Vector3, gz: number, on: number) => { S.forEach(([ph, sx, sy], i) => { const u = (t * 0.7 + ph) % 1; if (on < 0.02) { sw.hide(i); return; }
    const p = u < 0.5 ? a.clone().lerp(h, u / 0.5) : h.clone().add(new THREE.Vector3(sx * (u - 0.5) * 2, sy * (u - 0.5) * 2, (gz - h.z) * Math.min(1, (u - 0.5) * 4))); sw.put(i, p.x, p.y, p.z, on); }); sw.done(); } }); };
// arrows pushing on a pane (rows x cols), pointing toward -z (outward)
const avPush = (rows = 3, cols = 2, len = 0.12, color = AV.red) => { const g = p3Group(), A: ReturnType<typeof p3Arrow>[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const a = p3Arrow([(c - (cols - 1) / 2) * 0.1, (r - (rows - 1) / 2) * 0.11, 0], [0, 0, -1], len, color, 0.008); g.add(a); A.push(a); }
  return Object.assign(g, { pose: (grow: number, t = 0) => A.forEach((a, i) => { a.grow(grow); a.position.z = 0.01 * Math.sin(t * 6 + i); }) }); };
// cracks spreading across a pane (u 0..1)
const avCracks = () => { const g = p3Group(), R = p3Rnd(41), lines: THREE.Mesh[] = [], mat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  for (let i = 0; i < 18; i++) { const a = R() * Math.PI * 2, l = 0.04 + R() * 0.1; const m = new THREE.Mesh(new THREE.BoxGeometry(l, 0.0025, 0.002), mat); m.position.set(Math.cos(a) * l * 0.5 + 0.03, Math.sin(a) * l * 0.5 + 0.06, 0); m.rotation.z = a; g.add(m); lines.push(m); }
  return Object.assign(g, { pose: (u: number) => lines.forEach((m, i) => { m.visible = i / lines.length < u; }) }); };
// fog: droplets on a pane that fade away (amount 0..1)
const avFog = () => { const R = p3Rnd(77), n = 160, sw = p3Swarm(n, new THREE.CircleGeometry(0.006, 10), new THREE.MeshBasicMaterial({ color: AV.fog, transparent: true, opacity: 0.85 })), P = Array.from({ length: n }, () => [(R() - 0.5) * (AV_W - 0.04), (R() - 0.5) * (AV_H - 0.05), 0.4 + R() * 0.9]);
  return Object.assign(sw, { pose: (amount: number) => { P.forEach(([x, y, s], i) => { if (i / n >= amount) { sw.hide(i); return; } sw.put(i, x, y, 0, s); }); sw.done(); } }); };

// the cabin set: lights, outside, cabin, the hero window at x = 0; returns the pieces and the captions
const avCabinSet = (w: World) => {
  dioLights(w); const out = avOutside(w); w.add(avCabin()); const win = w.add(avWindow()); win.position.y = 0.15;
  return { win, out, cap: dioCaptions(w, AV_FIX) };
};
// the hole in world coordinates (on the middle pane)
const avHole = (win: THREE.Object3D) => { win.updateMatrixWorld(true); return (win as ReturnType<typeof avWindow>).middle.localToWorld(new THREE.Vector3(0, -AV_H / 2 + 0.05, 0.006)); };

// ---------- world test shots ----------
defineVisuals({
  'test-cabin': {   // the cabin, the window; then the panes pull apart
    bg: AV.sky,
    build(w) { const { win, out } = avCabinSet(w);
      return (t) => { const lt = t - w.s.t0; out(t); win.pose({ explode: p3Ramp(lt, 1.2, 1.8), middle: lt > 1.8 ? 1 : 0, hole: lt > 2.2 ? 1 : 0 }); const a = p3Lerp(0, 0.9, p3Ramp(lt, 1.2, 1.8));
        w.look([Math.sin(a) * 1.25, 0.25, Math.cos(a) * 1.25], [0, 0.12, -0.05], 36); }; },
  },
  'test-air': {   // pressure: dense air inside, thin outside, arrows on the outer pane, the stream through the hole, cracks, fog
    bg: AV.sky,
    build(w) { const { win, out } = avCabinSet(w), inA = w.add(avAir(260, [-0.2, 0.2, -0.05, 0.4, 0.02, 0.4])), outA = w.add(avAir(30, [-0.2, 0.2, -0.05, 0.4, -0.6, -0.15], '#cfe9ff')),
        st = w.add(avStream()), push = w.add(avPush()), cr = avCracks(), fog = avFog(); win.outer.add(cr); win.middle.add(fog); push.position.set(0, 0.15, -0.08); cr.position.z = -0.002; fog.position.z = 0.013;
      return (t) => { const lt = t - w.s.t0; out(t); win.pose({ explode: 0.6, outer: lt < 1.5 ? 1 : 0, middle: lt > 1.5 ? 1 : 0, hole: 1 }); inA.pose(t, 1); outA.pose(t, 1); push.pose(1, t);
        const h = avHole(win); st.pose(t, h.clone().add(new THREE.Vector3(0.05, 0.1, 0.25)), h, h.z - 0.07, lt > 1.5 ? 1 : 0); cr.pose(lt > 1.5 ? 1 : 0); fog.pose(lt < 1.5 ? 1 : 0.3);
        w.look([0.95, 0.35, 0.65], [0, 0.12, -0.12], 36); }; },
  },
  'test-outside': {   // the plane in flight over the diorama, close on its windows
    bg: AV.sky,
    build(w) { dioLights(w); const p = w.add(dioAirliner()); p.gear.forEach((l) => (l.visible = false)); const land = w.add(dioDiorama()); land.scale.setScalar(0.5); land.position.set(0, -22, -6); dioSkyBack(w);
      return () => { w.look([7, 0.6, 9], [1.5, 0.1, 0], 36); }; },
  },
});
