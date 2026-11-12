// World of "¿Para qué son los pinchos de las alas del avión?" (3D, the channel's diorama look). Prefix pa.
// The airliner (with its static wicks), the lens, the diorama and the captions come from styles/3d/diorama.ts.

const PA = { sky: '#5bb8f5', storm: '#4f6584', charge: '#5fe6ff', key: '#b6f23c', red: '#e5484d', bolt: '#fff59a' };
const PA_FIX: Record<number, string> = { 114: 'Eso', 124: 'pararrayos.', 125: '' };   // what Whisper wrote differently from the script

// ---------- the plane in flight: wicks that can glow, charge that builds up on its skin ----------
const paPlane = () => {
  const p = dioAirliner({ wicks: true }); p.gear.forEach((l) => (l.visible = false));
  const glowMat = dioSmooth(PA.key, 0.4); glowMat.emissive.set(PA.key);
  const base = p.wicks.map((w) => (w.children[0] as THREE.Mesh).material as THREE.Material);
  // glow 0..1: the wicks light up in lime; pop 0..1: they grow out of the edges
  const wicks = (glow: number, pop = 1) => p.wicks.forEach((w, i) => { const m = w.children[0] as THREE.Mesh; m.material = glow > 0.02 ? glowMat : base[i]; glowMat.emissiveIntensity = 0.3 + 0.9 * glow; w.scale.x = Math.max(0.001, pop); });
  return Object.assign(p, { wickGlow: wicks });
};
// points on the plane's skin (fuselage and wings), for the charge sparkles
const paSkin = (n: number, seed = 3) => { const R = p3Rnd(seed); return Array.from({ length: n }, () => {
  if (R() < 0.55) { const a = R() * Math.PI * 2, x = -4 + R() * 8.5; return new THREE.Vector3(x, Math.sin(a) * 0.88, Math.cos(a) * 0.88); }
  const f = R(), s = R() < 0.5 ? 1 : -1, x = p3Lerp(0.6 + 1.4 * R() * (1 - f), 0.6 - 2.3 * f, R()); return new THREE.Vector3(x, -0.28, s * 5.6 * f); }); };
// the charge: cyan sparkles on the skin; amount 0..1 shows more of them, twinkling
const paCharge = (n = 160) => {
  const P = paSkin(n), sw = p3Swarm(n, new THREE.OctahedronGeometry(0.06, 0), new THREE.MeshBasicMaterial({ color: PA.charge }));
  const pose = (t: number, amount: number) => { P.forEach((p, i) => { const on = i / n < amount, k = on ? 0.6 + 0.6 * Math.abs(Math.sin(t * 6 + i * 1.7)) : 0; if (k < 0.05) sw.hide(i); else sw.put(i, p.x, p.y, p.z, k, k, k, t * 2 + i, i, 0); }); sw.done(); };
  return Object.assign(sw, { pose });
};
// a jagged electric arc between two points (a spark or a lightning bolt); .pose(t, on) redraws it, flickering
const paArc = (color: string, r = 0.03, seed = 1) => {
  const m = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color })); m.frustumCulled = false; let last = -1;
  const pose = (t: number, a: Vec3, b: Vec3, on: number, jag = 0.25) => {
    m.visible = on > 0.02 && Math.sin(t * 47 + seed) > -0.4; if (!m.visible) return;
    const k = Math.floor(t * 18); if (k === last) return; last = k; const R = p3Rnd(1 + k * 31 + seed * 7), A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const pts = Array.from({ length: 9 }, (_, i) => { const u = i / 8, p = A.clone().lerp(B, u); if (i && i < 8) p.add(new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(jag * 2)); return p; });
    m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0), 32, r, 5);
  };
  return Object.assign(m, { pose });
};
// rain and ice streaks rushing past (a loop); amount 0..1
const paRain = (n = 120) => {
  const R = p3Rnd(8), P = Array.from({ length: n }, () => ({ x: R() * 40, y: -6 + R() * 14, z: -10 + R() * 18, v: 30 + R() * 20 }));
  const sw = p3Swarm(n, new THREE.CylinderGeometry(0.015, 0.015, 1.2, 4).rotateZ(1.2), new THREE.MeshBasicMaterial({ color: '#dff2ff', transparent: true, opacity: 0.8 }));
  const pose = (t: number, amount: number) => { P.forEach((p, i) => { if (i / n >= amount) { sw.hide(i); return; } sw.put(i, ((((p.x - t * p.v) % 40) + 40) % 40) - 20, p.y - ((t * 9) % 14), p.z, 1); }); sw.done(); };
  return Object.assign(sw, { pose });
};
// the gentle discharge: little sparks running along a wick and leaving its tip one by one (a loop); amount 0..1
const paCorona = (n = 40) => {
  const sw = p3Swarm(n, new THREE.SphereGeometry(0.02, 8, 6), new THREE.MeshBasicMaterial({ color: PA.charge }));
  // from the wick's root (a) to its tip (b), then off into the air behind
  const pose = (t: number, a: THREE.Vector3, b: THREE.Vector3, amount: number) => { for (let i = 0; i < n; i++) { const u = (t * 0.8 + i / n) % 1, on = i / n < amount; if (!on) { sw.hide(i); continue; }
    const p = u < 0.6 ? a.clone().lerp(b, u / 0.6) : b.clone().add(b.clone().sub(a).normalize().multiplyScalar((u - 0.6) * 1.2)).add(new THREE.Vector3(0, Math.sin(i * 3.1) * (u - 0.6) * 0.5, Math.cos(i * 2.3) * (u - 0.6) * 0.5));
    const s = u < 0.6 ? 1 : 1 - (u - 0.6) / 0.4; sw.put(i, p.x, p.y, p.z, Math.max(0.05, s)); } sw.done(); };
  return Object.assign(sw, { pose });
};
// a cockpit radio with a little screen: clear waves, or static noise (noise 0..1), redrawn from t
const paRadio = () => {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 160; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; let last = -1;
  const g = p3Group(p3Mesh(new THREE.RoundedBoxGeometry(2.4, 1.7, 0.6, 3, 0.12), dioSmooth('#2a2f3a', 0.6)), p3Mesh(new THREE.PlaneGeometry(1.7, 1.06), new THREE.MeshBasicMaterial({ map: tex }), { p: [-0.2, 0.15, 0.31] }));
  for (const [x, y] of [[0.9, 0.35], [0.9, -0.25]]) g.add(p3Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 20), dioSmooth('#c9ced8', 0.4, 0.4), { p: [x, y, 0.33], r: [Math.PI / 2, 0, 0] }));
  const pose = (t: number, noise: number) => { const k = Math.floor(t * 15); if (k === last) return; last = k; const c = cv.getContext('2d')!, R = p3Rnd(5 + k * 13);
    c.fillStyle = '#0d1a14'; c.fillRect(0, 0, 256, 160); c.strokeStyle = '#7dff9a'; c.lineWidth = 4; c.beginPath();
    for (let x = 0; x <= 256; x += 4) { const y = 80 + Math.sin(x * 0.08 + t * 6) * 26 * (1 - noise) + (R() - 0.5) * 120 * noise; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    if (noise > 0.05) for (let i = 0; i < 900 * noise; i++) { c.fillStyle = R() < 0.5 ? '#ffffff' : '#7dff9a'; c.fillRect(R() * 256, R() * 160, 3, 3); }
    tex.needsUpdate = true; };
  return Object.assign(g, { pose });
};
// a balloon rubbed with hair: red, round, with its knot and string
const paBalloon = () => { const g = p3Group(p3Mesh(new THREE.SphereGeometry(1, 40, 28), dioSmooth('#e5484d', 0.25), { s: [0.9, 1.05, 0.9] }), p3Mesh(p3Cone(0.1, 0.18, 12), dioSmooth('#c23a3f', 0.4), { p: [0, -1.12, 0], r: [Math.PI, 0, 0] }));
  g.add(p3Tube([[0, -1.2, 0], [0.1, -1.7, 0.05], [-0.05, -2.3, 0], [0.08, -2.9, 0]], 0.012, dioSmooth('#f4f6fa', 0.6), 20)); return g; };
// the current from a lightning strike, running along the skin as a bright ring (u 0..1 from nose to tail)
const paCurrent = () => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.93, 0.07, 10, 48), new THREE.MeshBasicMaterial({ color: PA.bolt })); m.rotation.y = Math.PI / 2;
  const pose = (u: number, on: number) => { m.visible = on > 0.02 && u > 0 && u < 1; const x = p3Lerp(5.8, -5.4, u); m.position.x = x; const r = x > 2.5 ? p3Clamp((6.2 - x) / 3.7, 0.15, 1) : x < -3.2 ? p3Clamp((x + 5.75) / 2.6, 0.15, 1) : 1; m.scale.set(r, r, r); };
  return Object.assign(m, { pose }); };
// dark storm clouds
const paStorm = (w: World) => [[-12, 8, -22, 2.4], [6, 10, -26, 3], [18, 6, -18, 2.2], [-4, 14, -30, 3.2]].forEach(([x, y, z, s]) => { const c = dioCloud([x, y, z], s); c.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = dioSmooth('#6b7891', 0.9); }); w.add(c); });
// a sky set: light, clouds drifting by (a loop) and the plane; flight = how fast the clouds pass
const paSkySet = (w: World, storm = false) => {
  dioLights(w); if (storm) paStorm(w);
  const clouds = [[0, -7, -16, 1.6], [14, -9, -22, 2.2], [28, -5, -28, 1.8], [40, -10, -14, 1.4], [7, 9, -30, 2.4]].map(([x, y, z, s]) => ({ c: w.add(dioCloud([x, y, z], s)), x }));
  const plane = w.add(paPlane());
  return { plane, cap: dioCaptions(w, PA_FIX), clouds: (t: number, v = 6) => clouds.forEach(({ c, x }) => { c.position.x = ((((x - t * v) % 60) + 60) % 60) - 30; }) };
};
// a wick in world coordinates (index i): its root and its tip, for the corona and the lens
const paWickEnds = (plane: THREE.Object3D & { wicks: THREE.Object3D[] }, i: number) => { plane.updateMatrixWorld(true); const w = plane.wicks[i];
  return { a: w.localToWorld(new THREE.Vector3(0, 0, 0)), b: w.localToWorld(new THREE.Vector3(-0.45, 0, 0)) }; };

// ---------- world test shots ----------
defineVisuals({
  'test-plane': {   // wicks pop out and glow; charge builds up; the lens shows a wick up close
    bg: PA.sky,
    build(w) { const { plane, clouds } = paSkySet(w), ch = w.add(paCharge()), lens = dioLens(w, { x: 0.42, y: -0.35, r: 0.2 });
      return (t) => { const lt = t - w.s.t0; clouds(lt); plane.wickGlow(p3Ramp(lt, 2, 2.5), p3Spring(t, w.s.t0 + 0.5)); ch.pose(t, p3Ramp(lt, 1, 2.5));
        w.look([6, 4, 22], [0, 0.4, 0], 36); const e = paWickEnds(plane, 2); lens.pose([e.b.x - 1.4, e.b.y + 0.7, e.b.z + 1.6], [e.b.x + 0.2, e.b.y, e.b.z], p3Spring(t, w.s.t0 + 1.2), 30); }; },
  },
  'test-effects': {   // sparks, corona, radio in the lens, rain
    bg: PA.storm,
    build(w) { const { plane, clouds } = paSkySet(w, true), arc = w.add(paArc(PA.charge, 0.025)), co = w.add(paCorona()), rain = w.add(paRain()), radio = w.add(paRadio()), lens = dioLens(w, { x: -0.4, y: 0.3, r: 0.22 });
      radio.position.set(0, -80, 0);
      return (t) => { const lt = t - w.s.t0; clouds(lt, 10); rain.pose(t, 1); plane.wickGlow(lt > 1.5 ? 1 : 0); const e = paWickEnds(plane, 1);
        arc.pose(t, [e.b.x, e.b.y, e.b.z], [e.b.x - 1.6, e.b.y + 0.6, e.b.z + 0.3], lt < 1.5 ? 1 : 0); co.pose(t, e.a, e.b, lt > 1.5 ? 1 : 0); radio.pose(t, lt < 1.5 ? 1 : 0);
        w.look([2, 2.5, 16], [-0.5, 0, 2.5], 36); lens.pose([0, -80, 4.2], [0, -80, 0], 1, 30); }; },
  },
  'test-strike': {   // balloon; lightning; current along the skin
    bg: PA.storm,
    build(w) { const { plane } = paSkySet(w, true), bolt = w.add(paArc(PA.bolt, 0.09, 3)), cur = paCurrent(), b = w.add(paBalloon()); plane.add(cur); b.position.set(-6, 3, 4);
      return (t) => { const lt = t - w.s.t0; bolt.pose(t, [7, 9, 1], [6.1, 0.3, 0], lt > 0.8 && lt < 1.3 ? 1 : 0, 0.7); cur.pose((lt - 1.1) / 1.4, 1); w.look([4, 3, 20], [0, 1.5, 0], 36); }; },
  },
});
