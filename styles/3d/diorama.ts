// =====================================================================
//  3D — diorama: the channel's look (like a floating model railway): smooth rounded heroes, a block of land cut open
//  at its edges with layers of soil, striped grass with tufts, faceted hills and trees, red-roofed houses, round clouds,
//  and word-by-word captions. Runs in the browser after detail.ts. Pair it with a video theme.css for the titles.
//  Pieces: dioSmooth · dioBevel · dioLathe · dioGrassMat · dioAsphaltMat · dioHill · dioCloud · dioLights · dioSoil
//          dioHouse · dioTree · dioDiorama · dioSun · dioSkyBack · dioCaptions (CSS class .dio-cap) · dioAirliner · dioLens · dioLabel
// =====================================================================
// smooth materials: the hero look (no flat shading)
const dioSmooth = (c: string, rough = 0.45, metal = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: metal });
// a flat 2D outline extruded with rounded edges (wings, fins)
const dioBevel = (pts: number[][], depth: number, bevel = 0.04) => {
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 12 });
  g.translate(0, 0, -depth / 2); g.computeVertexNormals(); return g;
};
// a body of revolution from [radius, y] points along its axis, turned so the axis is +x (nose at +x)
const dioLathe = (profile: number[][], seg = 40) => {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg); g.rotateZ(-Math.PI / 2); g.computeVertexNormals(); return g;
};
// ---------- ground, sky and light ----------
const dioGrassMat = () => p3Shader(new THREE.MeshStandardMaterial({ roughness: 0.95 }), 'ra-grass', { color: `
  float stripe = step(0.5, fract(p3World.x * 0.08)), n = p3F(p3World.xz * 0.6), fine = p3N(p3World.xz * 9.0);
  // linear color (the shader works before sRGB): #2f8a24 and #45a834
  diffuseColor.rgb = mix(vec3(0.028, 0.25, 0.018), vec3(0.06, 0.39, 0.034), stripe * 0.6 + n * 0.3) * (0.85 + fine * 0.25);` });
const dioAsphaltMat = () => p3Shader(new THREE.MeshStandardMaterial({ roughness: 0.9 }), 'ra-asphalt', { bump: 0.015, color: `
  vec3 v = p3V(p3World.xz * 7.0); float n = p3F(p3World.xz * 1.5);
  diffuseColor.rgb = vec3(0.11, 0.12, 0.14) * (0.85 + v.z * 0.25 + n * 0.15); p3Ht = 1.0 - v.x;
  float side = abs(p3World.z), edge = step(3.7, side) * step(side, 3.9);
  float dash = step(abs(p3World.z), 0.12) * step(0.5, fract(p3World.x * 0.06));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95), max(edge, dash));` });
const dioHill = (p: Vec3, s: number, c: string) => { const g = new THREE.IcosahedronGeometry(1, 1); g.scale(s * 1.6, s, s * 1.2); return p3Mesh(g, c, { p }); };   // faceted, like the reference
const dioCloud = (p: Vec3, s = 1) => { const m = dioSmooth('#ffffff', 0.9), g = p3Group(); for (const [x, y, z, r] of [[0, 0, 0, 1.4], [1.5, -0.25, 0.2, 1.05], [-1.4, -0.3, 0, 1.0], [0.4, 0.65, -0.3, 0.95]]) g.add(p3Mesh(new THREE.SphereGeometry(r, 24, 16), m, { p: [x, y, z] })); g.position.set(...p); g.scale.setScalar(s); return g; };
const dioLights = (w: World) => {
  w.scene.environment = p3Env(w.renderer); w.scene.environmentIntensity = 0.35;   // soft reflections on the smooth heroes
  w.add(new THREE.HemisphereLight('#e8f4ff', '#4f7f35', 0.45));
  const sun = new THREE.DirectionalLight('#fff4e0', 1.5); sun.position.set(10, 18, 9); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.radius = 4;
  Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28 }); w.add(sun);
};

// ---------- the diorama: a floating block of land cut open at the edges, like the reference ----------
const dioSoil = () => { const t = p3Paint(512, 256, (c) => {
  const band = (y0: number, y1: number, col: string, amp = 6) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, 256);
    for (let x = 0; x <= 512; x += 16) c.lineTo(x, y0 + Math.sin(x * 0.045 + y0) * amp + Math.sin(x * 0.13) * amp * 0.4); c.lineTo(512, 256); c.fill(); };
  band(0, 0, '#3f9a2e', 0); band(22, 0, '#7a3f1d', 4); band(70, 0, '#b8642a', 7); band(120, 0, '#d98b3a', 6); band(165, 0, '#8a4a22', 8); band(215, 0, '#5e3218', 5);
  c.fillStyle = 'rgba(255,255,255,0.18)'; for (let i = 0; i < 90; i++) { const x = (i * 97) % 512, y = 40 + ((i * 53) % 210); c.beginPath(); c.ellipse(x, y, 5 + (i % 4), 3, 0, 0, 6.3); c.fill(); }
}); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; };
const dioHouse = (p: Vec3, ry = 0, s = 1) => {
  const g = p3Group();
  g.add(p3Mesh(new THREE.RoundedBoxGeometry(2.2, 1.6, 1.8, 2, 0.06), dioSmooth('#f6e7c8', 0.7), { p: [0, 0.8, 0] }));
  const roof = new THREE.ConeGeometry(1.75, 1.1, 4, 1); roof.rotateY(Math.PI / 4); roof.scale(1.05, 1, 0.85);
  g.add(p3Mesh(roof, '#e8483a', { p: [0, 2.15, 0] }));
  g.add(p3Mesh(p3Box(0.42, 0.75, 0.05), '#8a4a22', { p: [0.45, 0.4, 0.91] }));
  for (const x of [-0.55]) g.add(p3Mesh(p3Box(0.5, 0.45, 0.05), '#ffd75e', { p: [x, 0.95, 0.91], e: 0.6 }));
  g.add(p3Mesh(p3Box(0.05, 0.45, 0.5), '#ffd75e', { p: [1.11, 0.95, 0], e: 0.6 }));
  g.position.set(...p); g.rotation.y = ry; g.scale.setScalar(s); return g;
};
const dioTree = (p: Vec3, s = 1, c = '#4caf3e') => p3Group(
  p3Mesh(p3Cyl(0.12, 0.16, 1.2, 8), '#8a5a3b', { p: [p[0], p[1] + 0.6, p[2]], s }),
  p3Mesh(new THREE.IcosahedronGeometry(0.85 * s, 1), c, { p: [p[0], p[1] + 1.55 * s, p[2]] }));
const DIO_W0 = 46, DIO_D0 = 28, DIO_H = 5;
// o.road: the asphalt strip along x (an airfield); o.clear: half-width of the strip along x kept free of grass tufts,
// or o.free(x, z): true where no tuft may grow; o.props: false leaves out the houses, trees and hills; o.w, o.d: its size
const dioDiorama = (o: { road?: boolean; clear?: number; free?: (x: number, z: number) => boolean; props?: boolean; w?: number; d?: number } = {}) => {
  const DIO_W = o.w ?? DIO_W0, DIO_D = o.d ?? DIO_D0, free = o.free ?? ((x: number, z: number) => Math.abs(z) < (o.clear ?? 4.4));
  const g = p3Group(), side = new THREE.MeshStandardMaterial({ map: dioSoil(), roughness: 0.95 }), sideX = side.clone();
  side.map!.repeat.set(DIO_W / 9, 1); sideX.map = side.map!.clone(); sideX.map.repeat.set(DIO_D / 9, 1); sideX.map.needsUpdate = true;
  const block = new THREE.Mesh(new THREE.BoxGeometry(DIO_W, DIO_H, DIO_D), [sideX, sideX, dioGrassMat(), side, side, side]);
  block.position.y = -DIO_H / 2; block.receiveShadow = true; g.add(block);
  if (o.road ?? true) { const road = new THREE.Mesh(new THREE.PlaneGeometry(DIO_W, 8), dioAsphaltMat()); road.rotation.x = -Math.PI / 2; road.position.y = 0.03; road.receiveShadow = true; g.add(road); }
  // grass tufts: three thin blades each, never on the clear strip
  const R = p3Rnd(5), N = 700, blade = new THREE.ConeGeometry(0.035, 0.42, 3); blade.translate(0, 0.21, 0);
  const tufts = p3Swarm(N * 3, blade, new THREE.MeshStandardMaterial({ color: '#2f8a24', roughness: 0.9 }));
  for (let i = 0; i < N; i++) { let x = 0, z = 0; do { x = (R() - 0.5) * (DIO_W - 0.6); z = (R() - 0.5) * (DIO_D - 0.6); } while (free(x, z));
    const k = 0.35 + R() * 0.35; for (let j = 0; j < 3; j++) tufts.put(i * 3 + j, x + (j - 1) * 0.06, 0, z + (R() - 0.5) * 0.08, k, k * (0.8 + R() * 0.5), k, (j - 1) * 0.35, R() * 3, (j - 1) * 0.3); }
  tufts.done(); g.add(tufts);
  if (o.props === false) return g;
  const greens = ['#4caf3e', '#5cc24a', '#3f9a36', '#6acb55'];
  for (const [x, z, sc, i] of [[-15, -10, 7, 0], [-4, -11.5, 8.5, 1], [9, -10.5, 7.5, 2], [19, -11, 6, 3]]) { const h = new THREE.IcosahedronGeometry(1, 1); h.scale(sc * 1.2, sc * 0.75, sc * 0.45); g.add(p3Mesh(h, greens[i], { p: [x, 0, z] })); }
  g.add(dioHouse([-9, 0, -6.5], 0.25), dioHouse([5, 0, -7], -0.2, 0.9), dioHouse([14, 0, 7.5], 0.4, 0.85), dioHouse([-14, 0, 8], -0.5, 0.95));
  for (const [x, z, sc, i] of [[-12, -6, 1.1, 0], [-6, -6, 0.9, 1], [8, -6.5, 1.2, 2], [11, 6.5, 1, 3], [-17, 6, 1.2, 1], [2, 8, 0.9, 0], [18, -6, 1, 2], [-2, 10, 1.1, 3]]) g.add(dioTree([x, 0, z], sc, greens[i]));
  return g;
};
const dioSun = () => p3Group(p3Mesh(new THREE.CircleGeometry(2.2, 40), new THREE.MeshBasicMaterial({ color: '#ffd23f' })), p3Mesh(new THREE.CircleGeometry(3.1, 40), new THREE.MeshBasicMaterial({ color: '#ffe680', transparent: true, opacity: 0.35 }), { p: [0, 0, -0.05] }));
// ---------- captions: 1-2 words at a time, centred, in the titles' look ----------
let DIO_CHUNKS: { t0: number; t1: number; text: string }[] | null = null;
// fix: the transcription's mistakes, by word index (the voice says the script; Whisper misheard these)
const dioChunks = (fix: Record<number, string>) => DIO_CHUNKS ??= (() => {
  const out: { t0: number; t1: number; text: string }[] = []; let cur: { t0: number; t1: number; ws: string[] } | null = null;
  WORDS.forEach((w, i) => { const txt = fix[i] ?? w.w;
    if (!cur) cur = { t0: w.t0, t1: w.t1, ws: [] }; cur.ws.push(txt); cur.t1 = w.t1;
    const next = WORDS[i + 1], gap = next ? next.t0 - w.t1 : 9;
    if (cur.ws.length >= 2 || /[.,;:?!]$/.test(txt) || gap > 0.25 || cur.ws.join(' ').length > 14) { out.push({ t0: cur.t0, t1: next ? Math.min(next.t0, w.t1 + 0.35) : w.t1 + 0.5, text: cur.ws.join(' ') }); cur = null; } });
  return out; })();
const dioCaptions = (w: World, fix: Record<number, string> = {}) => {
  const el = document.createElement('div'); el.className = 'dio-cap'; w.titles.appendChild(el); let shown = '';
  return (t: number) => { const c = dioChunks(fix).find((c) => t >= c.t0 - 0.05 && t < c.t1), txt = c ? c.text : '';
    if (txt !== shown) { el.textContent = txt; shown = txt; } const a = c ? p3Clamp((t - c.t0 + 0.05) / 0.12) : 0; el.style.opacity = String(a); el.style.transform = `translateX(-50%) scale(${0.85 + 0.15 * a})`; };
};

const dioSkyBack = (w: World) => { [[-7, 6, -14, 1.5], [8, -5, -18, 2], [6, 9, -20, 1.6]].forEach(([x, y, z, k]) => w.add(dioCloud([x, y, z], k))); };

// ---------- an airliner: original and generic (no airline livery); smooth lathe fuselage, bevelled wings ----------
const DIO_PLANE = { white: '#f5f6f8', blue: '#1f5fd6', window: '#1b2433', metal: '#c9ced8' };
// o.wicks: the static dischargers (thin rods on the trailing edges of the wings and the tail), which .wicks lists
const dioAirliner = (o: { wicks?: boolean } = {}) => {
  const RA = DIO_PLANE;
  const g = p3Group(), white = dioSmooth(RA.white, 0.35);
  // fuselage: rounded nose, long tube, tail cone rising (profile: [radius, position along the axis])
  const P: number[][] = [[0, -5.75], [0.32, -5.5], [0.62, -4.9], [0.8, -4.1], [0.85, -3.2], [0.85, 2.5], [0.78, 4], [0.55, 5.2], [0.25, 6], [0, 6.2]];
  const body = new THREE.Mesh(dioLathe(P), white); body.castShadow = true; g.add(body);
  // cockpit windows and the row of cabin windows, painted as a strip of rounded dark slots
  // u runs around the fuselage and v along it, so the slots are stacked along v
  const tex = p3Paint(64, 1024, (c) => { c.fillStyle = RA.white; c.fillRect(0, 0, 64, 1024); c.fillStyle = RA.window;
    for (let y = 30; y < 1000; y += 34) { c.beginPath(); c.roundRect(14, y, 36, 18, 8); c.fill(); } });
  for (const s of [1, -1]) {
    const strip = new THREE.Mesh(new THREE.CylinderGeometry(0.853, 0.853, 5.4, 40, 1, true, s > 0 ? 0.25 : Math.PI - 0.75, 0.5), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35 }));
    strip.rotation.z = Math.PI / 2; strip.position.x = -0.3; g.add(strip);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.856, 0.856, 5.6, 40, 1, true, s > 0 ? -0.12 : Math.PI + 0.02, 0.1), dioSmooth(RA.blue, 0.4));
    band.rotation.z = Math.PI / 2; band.position.x = -0.35; g.add(band);
    g.add(p3Mesh(new THREE.SphereGeometry(0.16, 16, 10, 0, Math.PI), dioSmooth(RA.window, 0.2), { p: [4.85, 0.3, s * 0.45], r: [0, s > 0 ? 0 : Math.PI, 0], s: [1.4, 0.6, 0.5] }));
  }
  // wings: swept, thin, bevelled; engines under them
  for (const s of [1, -1]) {
    const wing = new THREE.Mesh(dioBevel([[0, 0], [1.4, 0], [-1.6, 5.6], [-2.3, 5.6]], 0.08, 0.05), white); wing.castShadow = true;
    wing.rotation.set(s * Math.PI / 2 + 0.06 * s, 0, 0); wing.position.set(0.6, -0.35, 0); g.add(wing);
    const tip = new THREE.Mesh(dioBevel([[0, 0], [0.5, 0], [0.1, 0.7], [-0.2, 0.7]], 0.05, 0.03), dioSmooth(RA.blue, 0.4));
    tip.position.set(-1.65, -0.35, s * 5.6); g.add(tip);
    const eng = new THREE.Mesh(dioLathe([[0, -1.0], [0.3, -1.0], [0.36, -0.8], [0.44, 0.2], [0.44, 0.8], [0.4, 1.05], [0, 1.05]], 32), dioSmooth('#dfe3ea', 0.3, 0.1));
    eng.castShadow = true; eng.position.set(1.0, -0.85, s * 2.3); g.add(eng);
    g.add(p3Mesh(new THREE.CircleGeometry(0.3, 24), dioSmooth('#2a2f3a', 0.6), { p: [2.06, -0.85, s * 2.3], r: [0, Math.PI / 2, 0] }));
    g.add(p3Mesh(p3Box(0.9, 0.35, 0.08), white, { p: [0.75, -0.55, s * 2.3] }));
  }
  // tail: vertical fin in color, horizontal stabilizers
  const fin = new THREE.Mesh(dioBevel([[0, 0], [1.8, 0], [-0.5, 2.6], [-1.2, 2.6]], 0.1, 0.05), dioSmooth(RA.blue, 0.4)); fin.castShadow = true;
  fin.position.set(-4.0, 0.55, 0); g.add(fin);
  for (const s of [1, -1]) { const st = new THREE.Mesh(dioBevel([[0, 0], [1.1, 0], [-0.4, 2.1], [-0.9, 2.1]], 0.06, 0.04), white); st.rotation.x = s * Math.PI / 2; st.position.set(-4.4, 0.25, 0); st.castShadow = true; g.add(st); }
  // landing gear
  const gear: THREE.Object3D[] = [];
  for (const [x, z] of [[3.9, 0], [-0.3, 0.75], [-0.3, -0.75]]) {
    const leg = p3Group(p3Mesh(p3Cyl(0.05, 0.05, 0.7, 10), dioSmooth(RA.metal, 0.4, 0.4), { p: [0, -0.35, 0] }), p3Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 20), dioSmooth('#22252c', 0.8), { p: [0, -0.72, 0], r: [Math.PI / 2, 0, 0] }));
    leg.position.set(x, -0.62, z); g.add(leg); gear.push(leg);
  }
  const wicks: THREE.Object3D[] = [];
  if (o.wicks) {
    const rod = (p: Vec3, ry: number, s = 1) => { const w = p3Group(p3Mesh(p3Cyl(0.012, 0.02, 0.45, 8), dioSmooth('#2a2f3a', 0.5), { p: [-0.22, 0, 0], r: [0, 0, Math.PI / 2] }), p3Mesh(new THREE.SphereGeometry(0.018, 8, 6), dioSmooth('#c9ced8', 0.4), { p: [-0.45, 0, 0] }));
      w.position.set(...p); w.rotation.y = ry; w.scale.setScalar(s); g.add(w); wicks.push(w); return w; };
    for (const s of [1, -1]) for (const f of [0.55, 0.75, 0.92]) rod([0.6 - 2.3 * f, -0.33, s * 5.6 * f], 0.25 * s);   // on the swept trailing edge (root x 0.6, tip x -1.7)
    for (const s of [1, -1]) rod([-4.4 - 0.9, 0.25, s * 2.0], 0.3 * s, 0.8);
    rod([-5.15, 3.0, 0], 0, 0.8);
  }
  return Object.assign(g, { gear, wicks, height: 1.54 });   // height: from the wheels to the fuselage axis
};

// ---------- the lens: a circular inset framed in lime that shows what a second camera sees (a detail, up close) ----------
// It sits fixed on screen at (x, y), from -1 to 1 (0, 0 is the frame's center), with radius r as a fraction of the frame
// height. Call .pose(t-free) every frame: pose(from, at, show 0..1, fov). The inset is drawn last, over everything.
const dioLens = (w: World, o: { x?: number; y?: number; r?: number; size?: number } = {}) => {
  const size = o.size ?? 768, rt = new THREE.WebGLRenderTarget(size, size, { colorSpace: THREE.SRGBColorSpace, samples: 4 });
  const cam = new THREE.PerspectiveCamera(30, 1, 0.02, 600), over = (m: THREE.Mesh) => { const mt = m.material as THREE.Material; m.renderOrder = 999; mt.depthTest = false; mt.depthWrite = false; mt.transparent = true; return m; };   // transparent: drawn in the last pass, over the water too
  const g = p3Group(
    over(new THREE.Mesh(new THREE.CircleGeometry(1.16, 64), new THREE.MeshBasicMaterial({ color: '#13203a' }))),
    over(new THREE.Mesh(new THREE.CircleGeometry(1.1, 64), new THREE.MeshBasicMaterial({ color: '#b6f23c' }))),
    over(new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ map: rt.texture }))));
  g.children.forEach((m, i) => { m.position.z = i * 0.001; m.renderOrder = 999 + i; });
  w.camera.add(g); if (!w.camera.parent) w.scene.add(w.camera);
  const pose = (from: Vec3, at: Vec3, show = 1, fov = 30) => {
    g.visible = false;
    if (show > 0.01) {
      cam.fov = fov; cam.updateProjectionMatrix(); cam.position.set(...from); cam.lookAt(...at);
      const prev = w.renderer.getRenderTarget(); w.renderer.setRenderTarget(rt); w.renderer.render(w.scene, cam); w.renderer.setRenderTarget(prev);
      const d = 1, halfH = Math.tan((w.camera.fov * Math.PI) / 360) * d, halfW = halfH * w.camera.aspect;
      g.position.set((o.x ?? 0.45) * halfW, (o.y ?? 0.2) * halfH, -d); g.scale.setScalar(Math.max(0.001, (o.r ?? 0.17) * 2 * halfH * show)); g.visible = true;
    }
  };
  return { pose, cam };
};

// ---------- labels: a name floating over a piece, in the titles' look (heavy caps, dark outline), always on top ----------
// dioLabel('PEGAMENTO', '#ffd23f') -> a sprite; .pose(show 0..1) pops it in. Its size is fixed on screen (height: a fraction
// of the frame's height), so it reads the same from any distance
const dioLabel = (text: string, color = '#ffffff', height = 0.045) => {
  const cv = document.createElement('canvas'), c = cv.getContext('2d')!, font = '900 96px "RA Heavy", "Arial Black", sans-serif'; c.font = font;
  const w = Math.ceil(c.measureText(text).width) + 60; cv.width = w; cv.height = 140;
  c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 22; c.strokeStyle = '#13203a'; c.strokeText(text, w / 2, 74); c.fillStyle = color; c.fillText(text, w / 2, 74);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false, transparent: true, sizeAttenuation: false })); s.renderOrder = 950;
  const base = [height * (w / 140), height] as const; s.scale.set(base[0], base[1], 1);
  const pose = (show: number) => { s.visible = show > 0.02; s.scale.set(base[0] * Math.max(0.001, show), base[1] * Math.max(0.001, show), 1); };
  return Object.assign(s, { pose });
};
