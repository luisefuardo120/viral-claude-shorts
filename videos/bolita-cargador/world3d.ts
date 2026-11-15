// World of "Esa bolita del cable de tu cargador NO está de adorno" (3D, the channel's diorama look). Prefix bc.
// Diorama pieces, labels with arrows, lens, captions come from styles/3d/diorama.ts.
// Lessons applied (puntos-parabrisas review): varied shots, the lower half of the frame busy, real physical motion,
// bigger labels with arrows, the hero always in frame.

const BC = { sky: '#5bb8f5', wood: '#c98a4b', woodD: '#9a6332', noise: '#ff3b5c', current: '#3ad1ff', heat: '#ff8a1f', key: '#b6f23c', ferrite: '#3a3d46', shell: '#22252c', glove: '#ffffff' };
const BC_FIX: Record<number, string> = {};   // the transcription matches the script
const BC_DESK = { w: 2.6, d: 1.5, h: 0.5 };

// ---------- the desk: a floating wooden slab cut open at the edges (the channel's diorama, indoors) ----------
const bcWoodSide = () => { const t = p3Paint(512, 128, (c) => { const g = c.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, '#d79a5a'); g.addColorStop(1, '#8a5428'); c.fillStyle = g; c.fillRect(0, 0, 512, 128);
  c.strokeStyle = 'rgba(70,35,10,0.35)'; c.lineWidth = 3; for (let y = 10; y < 128; y += 14) { c.beginPath(); for (let x = 0; x <= 512; x += 16) c.lineTo(x, y + Math.sin(x * 0.03 + y) * 3); c.stroke(); } }); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t; };
const bcWoodTop = () => p3Shader(new THREE.MeshStandardMaterial({ roughness: 0.55 }), 'bc-woodtop', { bump: 0.01, color: `
  float rings = p3F(vec2(p3World.x * 1.5, p3World.z * 22.0)) * 9.0, line = 0.5 + 0.5 * sin(rings * 6.0), plank = step(0.97, fract(p3World.z * 3.2));
  diffuseColor.rgb = mix(vec3(0.42, 0.2, 0.07), vec3(0.72, 0.42, 0.18), line * 0.7 + 0.3) * (1.0 - plank * 0.45); p3Ht = line * 0.4;` });
const bcDesk = () => { const side = new THREE.MeshStandardMaterial({ map: bcWoodSide(), roughness: 0.7 }), top = new THREE.Mesh(new THREE.BoxGeometry(BC_DESK.w, BC_DESK.h, BC_DESK.d), [side, side, bcWoodTop(), side, side, side]);
  top.position.y = -BC_DESK.h / 2; top.receiveShadow = true; return top; };

// ---------- the props: laptop, charger brick, power strip, radio, router, microwave, lamp, mug, plant ----------
// a canvas screen that can show static (noise 0..1); draw(c) paints the clean picture
const bcScreen = (w: number, h: number, draw: (c: CanvasRenderingContext2D, t: number) => void) => {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = Math.round((256 * h) / w); const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; let last = -1;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  const pose = (t: number, noise: number) => { const k = Math.floor(t * 12); if (k === last) return; last = k; const c = cv.getContext('2d')!, R = p3Rnd(3 + k * 17); draw(c, t);
    if (noise > 0.03) { for (let i = 0; i < 1400 * noise; i++) { c.fillStyle = R() < 0.5 ? '#ffffff' : '#ff3b5c'; c.fillRect(R() * cv.width, R() * cv.height, 3, 3); } for (let i = 0; i < 6 * noise; i++) { c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(0, R() * cv.height, cv.width, 4); } }
    tex.needsUpdate = true; };
  return Object.assign(mesh, { pose }); };
const bcLaptop = () => { const g = p3Group(), alu = dioSmooth('#c9ced8', 0.35, 0.4);
  g.add(p3Mesh(new THREE.RoundedBoxGeometry(0.34, 0.018, 0.24, 2, 0.008), alu, { p: [0, 0.009, 0] }), p3Mesh(p3Box(0.3, 0.002, 0.11), dioSmooth('#2a2f3a', 0.6), { p: [0, 0.019, -0.03] }), p3Mesh(p3Box(0.1, 0.002, 0.06), dioSmooth('#9aa3b0', 0.4), { p: [0, 0.019, 0.07] }));
  const lid = p3Group(p3Mesh(new THREE.RoundedBoxGeometry(0.34, 0.23, 0.012, 2, 0.006), alu, { p: [0, 0.115, 0] })); lid.position.set(0, 0.018, -0.12); lid.rotation.x = -0.25; g.add(lid);
  const scr = bcScreen(0.31, 0.2, (c) => { const W = c.canvas.width, H = c.canvas.height, gr = c.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#2f6fde'); gr.addColorStop(1, '#8a5bd6'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(20, 24, 90, 60); c.fillRect(124, 24, 110, 28); c.fillStyle = '#b6f23c'; c.fillRect(124, 60, 70, 24); c.fillStyle = '#1b2433'; c.fillRect(0, H - 16, W, 16); });
  scr.position.set(0, 0.115, 0.007); lid.add(scr);
  return Object.assign(g, { screen: scr }); };
const bcBrick = () => { const g = p3Group(), body = p3Mesh(new THREE.RoundedBoxGeometry(0.14, 0.045, 0.08, 3, 0.012), dioSmooth('#2a2d35', 0.55), { p: [0, 0.023, 0] }); g.add(body);
  const lid = p3Mesh(new THREE.RoundedBoxGeometry(0.14, 0.012, 0.08, 3, 0.005), dioSmooth('#33373f', 0.5), { p: [0, 0.046, 0] }); g.add(lid);
  g.add(p3Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.002, 12), dioSmooth(BC.key, 0.3), { p: [0.05, 0.053, 0.02], e: 1 }));
  // inside: a little circuit board with a switching chip that blinks (shown when the lid lifts)
  const board = p3Group(p3Mesh(p3Box(0.12, 0.004, 0.065), dioSmooth('#1f7a4a', 0.6), { p: [0, 0.02, 0] }), p3Mesh(p3Box(0.03, 0.012, 0.02), dioSmooth('#111318', 0.4), { p: [-0.02, 0.028, 0] }),
    p3Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.03, 14), dioSmooth('#2f6fde', 0.4), { p: [0.03, 0.037, 0.012] }), p3Mesh(new THREE.TorusGeometry(0.012, 0.004, 8, 16), dioSmooth('#d98a3a', 0.5), { p: [0.03, 0.03, -0.015], r: [Math.PI / 2, 0, 0] }));
  const led = p3Mesh(new THREE.SphereGeometry(0.006, 10, 8), new THREE.MeshBasicMaterial({ color: BC.noise }), { p: [-0.02, 0.037, 0] }); board.add(led); g.add(board);
  // open 0..1 lifts and turns the lid; blink: the chip switching on and off
  const pose = (t: number, open = 0) => { lid.position.y = 0.046 + open * 0.07; lid.rotation.x = -open * 0.6; body.visible = open < 0.3; board.visible = open > 0.05; led.visible = Math.sin(t * 40) > 0; };
  pose(0); return Object.assign(g, { pose }); };
const bcStrip = () => { const g = p3Group(p3Mesh(new THREE.RoundedBoxGeometry(0.28, 0.035, 0.06, 2, 0.01), dioSmooth('#f4f5f7', 0.5), { p: [0, 0.018, 0] }));
  for (let i = 0; i < 4; i++) g.add(p3Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.002, 16), dioSmooth('#c9ced8', 0.5), { p: [-0.09 + i * 0.06, 0.036, 0] })); g.add(p3Mesh(p3Box(0.02, 0.01, 0.015), dioSmooth(BC.noise, 0.4), { p: [0.125, 0.04, 0], e: 0.6 })); return g; };
const bcRadio = () => { const g = p3Group(p3Mesh(new THREE.RoundedBoxGeometry(0.28, 0.16, 0.1, 3, 0.02), dioSmooth('#f2a03d', 0.5), { p: [0, 0.08, 0] }));
  const grille = p3Mesh(new THREE.CircleGeometry(0.05, 24), dioSmooth('#3a2a1a', 0.8), { p: [-0.07, 0.08, 0.051] }); g.add(grille);
  for (const [x, y] of [[0.1, 0.12], [0.1, 0.05]]) g.add(p3Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.02, 16), dioSmooth('#3a3f4a', 0.5), { p: [x, y, 0.055], r: [Math.PI / 2, 0, 0] }));
  g.add(p3Mesh(p3Cyl(0.003, 0.003, 0.28, 6), dioSmooth('#c9ced8', 0.3, 0.6), { p: [0.11, 0.28, -0.03], r: [0, 0, -0.35] }));
  const scr = bcScreen(0.1, 0.05, (c, t) => { const W = c.canvas.width, H = c.canvas.height; c.fillStyle = '#0d1a14'; c.fillRect(0, 0, W, H); c.strokeStyle = '#7dff9a'; c.lineWidth = 6; c.beginPath(); for (let x = 0; x <= W; x += 6) { const y = H / 2 + Math.sin(x * 0.08 + t * 8) * H * 0.3; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); });
  scr.position.set(0.035, 0.11, 0.052); g.add(scr);
  return Object.assign(g, { screen: scr, grille }); };
const bcRouter = () => { const g = p3Group(p3Mesh(new THREE.RoundedBoxGeometry(0.22, 0.04, 0.14, 2, 0.012), dioSmooth('#f4f5f7', 0.45), { p: [0, 0.02, 0] }));
  for (const x of [-0.08, 0.08]) g.add(p3Mesh(new THREE.CapsuleGeometry(0.007, 0.13, 4, 8), dioSmooth('#2a2f3a', 0.5), { p: [x, 0.11, -0.06] }));
  for (let i = 0; i < 4; i++) g.add(p3Mesh(new THREE.SphereGeometry(0.005, 8, 6), dioSmooth(BC.key, 0.3), { p: [-0.06 + i * 0.03, 0.042, 0.071], e: 1 }));
  const mat = new THREE.MeshBasicMaterial({ color: BC.key, transparent: true }), arcs = [0.04, 0.07, 0.1].map((r) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 6, 24, Math.PI / 2), mat); m.rotation.z = Math.PI / 4; m.position.y = 0.2; g.add(m); return m; });
  // bad 0..1: the wifi arcs flicker red and drop out
  const pose = (t: number, bad: number) => { mat.color.set(bad > 0.5 ? BC.noise : BC.key); arcs.forEach((a, i) => { a.visible = bad < 0.5 || Math.sin(t * 30 + i * 2) > 0.2; a.scale.setScalar(1 + 0.04 * Math.sin(t * 4 + i)); }); };
  return Object.assign(g, { pose }); };
const bcMicrowave = () => { const g = p3Group(p3Mesh(new THREE.RoundedBoxGeometry(0.46, 0.28, 0.34, 3, 0.02), dioSmooth('#e9ecf0', 0.5), { p: [0, 0.14, 0] }), p3Mesh(new THREE.RoundedBoxGeometry(0.3, 0.2, 0.01, 2, 0.01), dioSmooth('#1b2433', 0.2), { p: [-0.05, 0.14, 0.171] }));
  const glow = p3Mesh(new THREE.PlaneGeometry(0.28, 0.18), new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0 }), { p: [-0.05, 0.14, 0.177] }); g.add(glow);
  for (let i = 0; i < 4; i++) g.add(p3Mesh(p3Box(0.05, 0.02, 0.005), dioSmooth('#9aa3b0', 0.4), { p: [0.17, 0.22 - i * 0.04, 0.172] }));
  return Object.assign(g, { pose: (t: number, on: number) => { (glow.material as THREE.MeshBasicMaterial).opacity = on * (0.6 + 0.2 * Math.sin(t * 7)); } }); };
const bcDecor = () => { const g = p3Group();
  g.add(p3Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 20), dioSmooth('#e5484d', 0.4), { p: [0.95, 0.05, 0.42] }), p3Mesh(new THREE.TorusGeometry(0.03, 0.009, 8, 16, Math.PI), dioSmooth('#e5484d', 0.4), { p: [0.995, 0.055, 0.42], r: [0, 0, -Math.PI / 2] }));
  g.add(p3Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.012, 20), dioSmooth('#2a2f3a', 0.5), { p: [1.0, 0.006, -0.45] }), p3Mesh(p3Cyl(0.008, 0.008, 0.45, 8), dioSmooth('#2a2f3a', 0.5), { p: [1.0, 0.23, -0.45] }), p3Mesh(new THREE.ConeGeometry(0.1, 0.12, 20, 1, true), dioSmooth('#ffd23f', 0.5), { p: [0.94, 0.46, -0.4], r: [0, 0, 0.6] }));
  g.add(p3Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.12, 16), dioSmooth('#c2683a', 0.7), { p: [-1.05, 0.06, -0.5] }));
  for (const [x, y, z, r] of [[-1.05, 0.2, -0.5, 0.09], [-1.0, 0.27, -0.47, 0.07], [-1.1, 0.25, -0.53, 0.07]]) g.add(p3Mesh(new THREE.IcosahedronGeometry(r, 1), dioSmooth('#4caf3e', 0.7), { p: [x, y, z] }));
  for (let i = 0; i < 3; i++) g.add(p3Mesh(new THREE.RoundedBoxGeometry(0.22, 0.03, 0.3, 2, 0.008), dioSmooth(['#2f6fde', '#2fb36e', '#f2a03d'][i], 0.6), { p: [1.0, 0.015 + i * 0.03, 0.05], r: [0, 0.2 * i - 0.2, 0] }));
  return g; };

// ---------- the cable with its ferrite bead, and the electricity running in it ----------
const BC_CABLE = [[-0.62, 0.025, 0.32], [-0.45, 0.012, 0.52], [-0.1, 0.012, 0.6], [0.25, 0.012, 0.5], [0.42, 0.012, 0.28], [0.5, 0.016, 0.1]].map(([x, y, z]) => new THREE.Vector3(x, y, z));
const BC_BEAD_U = 0.82, BC_R = 0.008;   // where the bead sits along the cable, cable radius
const bcCable = () => { const curve = new THREE.CatmullRomCurve3(BC_CABLE), g = p3Group(new THREE.Mesh(new THREE.TubeGeometry(curve, 120, BC_R, 10), dioSmooth('#1d1f25', 0.6)));
  const plug = p3Mesh(new THREE.RoundedBoxGeometry(0.03, 0.016, 0.02, 2, 0.005), dioSmooth('#1d1f25', 0.5)); plug.position.copy(BC_CABLE[BC_CABLE.length - 1]); g.add(plug); return Object.assign(g, { curve }); };
// the bead: a plastic shell in two halves (they open), the ferrite cylinder inside, the cable through the middle
const bcBead = (curve: THREE.CatmullRomCurve3) => {
  const L = 0.07, R = 0.022, g = p3Group(), halves = [1, -1].map((s) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(R, L - 2 * R + 0.02, 6, 20), dioSmooth(BC.shell, 0.45)); m.rotation.z = Math.PI / 2;
    const clip = new THREE.Plane(new THREE.Vector3(0, 0, s), 0); (m.material as THREE.Material).clippingPlanes = [clip]; const h = p3Group(m); g.add(h); return { h, clip }; });
  const ferMat = dioSmooth(BC.ferrite, 0.8); const ferrite = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.82, R * 0.82, L * 0.9, 28, 1, false), ferMat); ferrite.rotation.z = Math.PI / 2; g.add(ferrite);
  const hole = p3Mesh(new THREE.CylinderGeometry(BC_R * 1.6, BC_R * 1.6, L * 0.92, 16), dioSmooth('#111318', 0.9), { r: [0, 0, Math.PI / 2] }); g.add(hole);
  const at = curve.getPointAt(BC_BEAD_U), tan = curve.getTangentAt(BC_BEAD_U); g.position.copy(at); g.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tan);
  // open 0..1: the halves swing apart; heat 0..1: the ferrite glows orange; slide 0..1: the bead slides in along the cable (0 = far before)
  const pose = (o: { open?: number; heat?: number; slide?: number } = {}) => { const op = o.open ?? 0; halves.forEach(({ h }, i) => { const s = i ? -1 : 1; h.position.set(0, 0, s * op * 0.05); h.rotation.x = s * op * 0.6; });
    ferrite.visible = hole.visible = op > 0.05; ferMat.emissive.set(BC.heat); ferMat.emissiveIntensity = (o.heat ?? 0) * 1.2;
    const u = BC_BEAD_U - (1 - (o.slide ?? 1)) * 0.35; g.position.copy(curve.getPointAt(u)); g.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), curve.getTangentAt(u)); g.scale.setScalar(Math.max(0.001, 0.3 + 0.7 * (o.slide ?? 1))); };
  // the clipping planes follow the bead (in its own frame)
  const sync = () => { g.updateMatrixWorld(true); halves.forEach(({ h, clip }, i) => { const n = new THREE.Vector3(0, 0, i ? -1 : 1).applyQuaternion(h.getWorldQuaternion(new THREE.Quaternion())); clip.setFromNormalAndCoplanarPoint(n, h.getWorldPosition(new THREE.Vector3())); }); };
  pose(); return Object.assign(g, { pose, sync }); };
// electricity: noise (red, zigzagging, fast) and current (blue, steady). filter 0..1: past the bead the noise is gone and eaten
const bcFlow = (curve: THREE.CatmullRomCurve3, n = 70) => {
  const noise = p3Swarm(n, new THREE.OctahedronGeometry(0.008, 0), new THREE.MeshBasicMaterial({ color: BC.noise })), cur = p3Swarm(n / 2, new THREE.SphereGeometry(0.006, 8, 6), new THREE.MeshBasicMaterial({ color: BC.current }));
  const g = p3Group(noise, cur), up = new THREE.Vector3(0, 1, 0);
  const pose = (t: number, o: { noise?: number; current?: number; filter?: number } = {}) => { const fl = o.filter ?? 0;
    for (let i = 0; i < n; i++) { const u = (t * 0.35 + i / n) % 1, after = u > BC_BEAD_U + 0.02, show = (o.noise ?? 0) * (after ? 1 - fl : 1) * (u > BC_BEAD_U - 0.02 && u < BC_BEAD_U + 0.03 ? 1 - fl * 0.8 : 1);
      if (show < 0.03) { noise.hide(i); continue; } const p = curve.getPointAt(u), tn = curve.getTangentAt(u), side = new THREE.Vector3().crossVectors(tn, up).normalize(), z = Math.sin(u * 240 + t * 30) * 0.018 * show;
      noise.put(i, p.x + side.x * z, p.y + 0.012 + Math.abs(z) * 0.6, p.z + side.z * z, show, show, show, t * 5 + i, i, 0); }
    for (let i = 0; i < n / 2; i++) { const u = (t * 0.2 + (2 * i) / n) % 1; if ((o.current ?? 0) < 0.03) { cur.hide(i); continue; } const p = curve.getPointAt(u); cur.put(i, p.x, p.y + 0.011, p.z, o.current ?? 0); }
    noise.done(); cur.done(); };
  return Object.assign(g, { pose }); };
// rings radiating from points (out = true) or converging onto them (out = false): the cable as an antenna. amount 0..1
const bcRings = (centers: THREE.Vector3[], out = true, color = BC.noise, maxR = 0.6) => { const g = p3Group(), rings = centers.flatMap((c, i) => [0, 1, 2].map((k) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.006, 6, 48), new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false })); m.position.copy(c); m.rotation.x = Math.PI / 2; g.add(m); return { m, ph: k / 3 + i * 0.17 }; }));
  const pose = (t: number, amount: number) => rings.forEach(({ m, ph }) => { const u0 = (t * 0.6 + ph) % 1, u = out ? u0 : 1 - u0; m.visible = amount > 0.02; m.scale.setScalar(0.02 + u * maxR); (m.material as THREE.MeshBasicMaterial).opacity = amount * (out ? 1 - u0 : u0) * 0.9; m.position.y = 0.02 + u * 0.05; });
  return Object.assign(g, { pose }); };
// heat wisps rising from the bead (amount 0..1)
const bcHeat = (n = 24) => { const R = p3Rnd(15), sw = p3Swarm(n, new THREE.SphereGeometry(0.006, 6, 4), new THREE.MeshBasicMaterial({ color: BC.heat })), P = Array.from({ length: n }, () => [R(), (R() - 0.5) * 0.06, (R() - 0.5) * 0.03]);
  return Object.assign(sw, { pose: (t: number, at: THREE.Vector3, amount: number) => { P.forEach(([ph, dx, dz], i) => { const u = (t * 0.7 + ph) % 1; if (amount < 0.02) { sw.hide(i); return; } sw.put(i, at.x + dx + Math.sin(u * 8 + i) * 0.01, at.y + 0.03 + u * 0.12, at.z + dz, amount * (1 - u) * 1.4); }); sw.done(); } }); };
// a cartoon glove that points and taps (same as the channel's other videos)
const bcHand = () => { const m = dioSmooth(BC.glove, 0.55), g = p3Group(p3Mesh(new THREE.RoundedBoxGeometry(0.05, 0.065, 0.026, 3, 0.012), m, { p: [0, -0.006, 0] }));
  g.add(p3Mesh(new THREE.CapsuleGeometry(0.009, 0.045, 4, 10), m, { p: [0.01, 0.05, 0] }));
  for (const [x, y] of [[-0.013, 0.02], [-0.021, 0.016], [0.0, 0.023]]) g.add(p3Mesh(new THREE.SphereGeometry(0.011, 12, 8), m, { p: [x, y, 0.008] }));
  g.add(p3Mesh(new THREE.CylinderGeometry(0.024, 0.027, 0.02, 18), dioSmooth(BC.key, 0.5), { p: [0, -0.05, 0] }));
  const pose = (at: THREE.Vector3, from: THREE.Vector3, tap = 0) => { const dir = at.clone().sub(from).normalize(); g.position.copy(at).addScaledVector(dir, -(0.075 - 0.015 * tap)); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); };
  return Object.assign(g, { pose }); };

// the room set: light, sky, the desk and every prop; returns the pieces and the captions
const bcRoom = (w: World) => {
  dioLights(w); [[-3, 2.6, -6, 0.9], [3, 3.2, -7, 1.1]].forEach(([x, y, z, s]) => w.add(dioCloud([x, y, z], s)));
  w.add(bcDesk()); const laptop = w.add(bcLaptop()); laptop.position.set(0.58, 0, 0.0); laptop.rotation.y = -0.35;
  const brick = w.add(bcBrick()); brick.position.set(-0.64, 0, 0.3); brick.rotation.y = 0.3;
  const strip = w.add(bcStrip()); strip.position.set(-0.75, 0, -0.1);
  const radio = w.add(bcRadio()); radio.position.set(-0.28, 0, -0.4); radio.rotation.y = 0.15;
  const router = w.add(bcRouter()); router.position.set(0.12, 0, -0.5);
  const micro = w.add(bcMicrowave()); micro.position.set(-0.98, 0, 0.42); micro.rotation.y = 0.5;
  w.add(bcDecor()); w.renderer.localClippingEnabled = true;
  const cable = w.add(bcCable()), bead = w.add(bcBead(cable.curve)), flow = w.add(bcFlow(cable.curve));
  return { laptop, brick, radio, router, micro, cable, bead, flow, cap: dioCaptions(w, BC_FIX) };
};
// the bead's position in the world, and the camera aimed at it from an angle a (radians around it), distance d, height h
const bcBeadAt = (bead: THREE.Object3D) => { bead.updateMatrixWorld(true); return bead.getWorldPosition(new THREE.Vector3()); };
const bcBeadCam = (w: World, bead: THREE.Object3D, a: number, d: number, h: number, fov = 34) => { const b = bcBeadAt(bead); w.look([b.x + Math.sin(a) * d, b.y + h, b.z + Math.cos(a) * d], [b.x, b.y + 0.005, b.z], fov); return b; };

// ---------- world test shots ----------
defineVisuals({
  'test-desk': {   // the desk, noise flowing, the cable radiating rings, radio and wifi disturbed
    bg: BC.sky,
    build(w) { const R = bcRoom(w), rings = w.add(bcRings([0.15, 0.4, 0.6].map((u) => R.cable.curve.getPointAt(u))));
      return (t) => { R.brick.pose(t); R.bead.pose(); R.bead.sync(); R.flow.pose(t, { noise: 1, current: 1 }); rings.pose(t, 1); R.radio.screen.pose(t, 1); R.router.pose(t, 1); R.laptop.screen.pose(t, 0.3); R.micro.pose(t, 1);
        w.look([0.4, 1.35, 2.4], [-0.05, 0.05, 0.1], 40); }; },
  },
  'test-bead': {   // the bead opening, the filter at work, heat
    bg: BC.sky,
    build(w) { const R = bcRoom(w), heat = w.add(bcHeat()), lab = w.add(dioLabel('FERRITA', BC.key, 0.05, true));
      return (t) => { const lt = t - w.s.t0; R.brick.pose(t); R.bead.pose({ open: p3Ramp(lt, 0.6, 1.2), heat: lt > 1.5 ? 1 : 0 }); R.bead.sync(); R.flow.pose(t, { noise: 1, current: 1, filter: lt > 1.5 ? 1 : 0 });
        const b = bcBeadAt(R.bead); heat.pose(t, b, lt > 1.5 ? 1 : 0); lab.position.copy(b).add(new THREE.Vector3(0, 0.03, 0)); lab.pose(lt > 1.2 ? 1 : 0); bcBeadCam(w, R.bead, 0.5, 0.42, 0.2, 34); }; },
  },
});
