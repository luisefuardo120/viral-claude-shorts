// World of "¿Por qué los barcos tienen una bola bajo la proa?" (3D, the channel's diorama look). Prefix bp.
// Diorama, lens, captions and the smooth materials come from styles/3d/diorama.ts.

const BP = { sky: '#5bb8f5', sea: '#1f8fd6', seaD: '#0b4f8a', hullUp: '#22324f', hullDown: '#c2392f', white: '#f5f6f8', key: '#b6f23c', red: '#e5484d', wave: '#ffffff', smoke: '#9aa3b0' };
const BP_FIX: Record<number, string> = {};   // the transcription matches the script
const BP_L = 34, BP_B = 6, BP_DRAFT = 1.6;   // ship length and beam (shorter than a real one, to fit the vertical frame) and how deep it sits

// ---------- the waves: the ship's bow wave, the bulb's wave and their sum ----------
// along the hull, d = meters behind the bow; the bow wave is a crest at the bow that ripples back and fades.
// phase: 0 when the ship sails at its design speed (the bulb's trough sits right under the bow's crest)
const bpBowWave = (d: number) => Math.exp(-Math.max(0, d) / 9) * Math.cos(d * 0.55) * (d < 0 ? Math.exp(-d * d * 0.5) : 1);
const bpBulbWave = (d: number, phase: number) => -bpBowWave(d + phase);
// the sea surface around the ship (in the ship's frame: bow at x = L/2, sailing toward +x). bow 0..1, bulb 0..1, phase
const bpSeaHeight = (x: number, z: number, t: number, o: { bow: number; bulb: number; phase: number }) => {
  const swell = 0.08 * Math.sin(x * 0.35 + t * 1.6) + 0.06 * Math.sin(z * 0.5 - t * 1.2 + x * 0.1);
  const d = BP_L / 2 - x, side = Math.max(0, Math.abs(z) - BP_B / 2), kelvin = Math.abs(Math.abs(z) - BP_B / 2 - Math.max(0, d) * 0.36);
  const near = Math.exp(-side * side * 0.08) + 0.6 * Math.exp(-kelvin * kelvin * 0.6) * (d > 0 ? 1 : 0);
  return swell + 1.1 * near * (o.bow * bpBowWave(d) + o.bulb * bpBulbWave(d, o.phase));
};

// ---------- the sea: a block of water cut open at the edges, its surface moving ----------
const bpSeaSide = () => { const t = p3Paint(256, 256, (c) => { const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#3aa6ea'); g.addColorStop(0.75, '#0f5e9e'); g.addColorStop(0.76, '#e9c98a'); g.addColorStop(1, '#c9a265'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); }); t.colorSpace = THREE.SRGBColorSpace; return t; };
const bpSea = (w = 60, d = 40, depth = 6, seg = 150) => {
  const g = p3Group(), side = new THREE.MeshStandardMaterial({ map: bpSeaSide(), roughness: 0.4, transparent: true, opacity: 0.94 });
  const block = new THREE.Mesh(new THREE.BoxGeometry(w, depth, d), [side, side, new THREE.MeshBasicMaterial({ visible: false }), dioSmooth('#c9a265', 0.9), side, side]); block.position.y = -depth / 2 - 0.05; g.add(block);
  const geo = new THREE.PlaneGeometry(w, d, seg, Math.round((seg * d) / w)); geo.rotateX(-Math.PI / 2);
  // foam: the crests turn white, so the waves read at a glance
  const water = p3Shader(new THREE.MeshStandardMaterial({ color: BP.sea, roughness: 0.18, metalness: 0.05, transparent: true, opacity: 0.86 }), 'bp-water', { color: `
    float foam = smoothstep(0.22, 0.6, p3World.y) + 0.35 * smoothstep(0.55, 0.9, p3N(p3World.xz * 3.0)) * smoothstep(0.12, 0.3, p3World.y);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95), clamp(foam, 0.0, 1.0));` });
  const surf = new THREE.Mesh(geo, water); surf.receiveShadow = true; g.add(surf);
  const pos = geo.attributes.position as THREE.BufferAttribute, base = Float32Array.from(pos.array as Float32Array); let last = '';
  // ship: where the ship is (x along the sea), so its waves follow it
  const pose = (t: number, ship = 0, o = { bow: 0, bulb: 0, phase: 0 }) => {
    const k = [t.toFixed(3), ship.toFixed(2), o.bow.toFixed(3), o.bulb.toFixed(3), o.phase.toFixed(3)].join(); if (k === last) return; last = k;
    for (let i = 0; i < pos.count; i++) { const x = base[i * 3], z = base[i * 3 + 2]; pos.setY(i, bpSeaHeight(x - ship, z, t, o)); }
    pos.needsUpdate = true; geo.computeVertexNormals();
  };
  return Object.assign(g, { pose, surf });
};

// ---------- the ship: an original container ship with lots of small parts ----------
const bpHullMat = () => p3Shader(new THREE.MeshStandardMaterial({ roughness: 0.5 }), 'bp-hull', { color: `
  float wl = ${BP_DRAFT.toFixed(2)};
  vec3 up = vec3(0.016, 0.031, 0.08), down = vec3(0.54, 0.045, 0.03), boot = vec3(0.9);
  diffuseColor.rgb = p3Pos.y < wl - 0.12 ? down : p3Pos.y < wl + 0.12 ? boot : up;` });
const bpShip = () => {
  const g = p3Group(), L = BP_L, B = BP_B, H = 4.2;
  // hull: a plan outline (pointed bow, round stern) extruded upward, edges rounded
  const plan: number[][] = [[-L / 2, -B / 2 + 0.6], [-L / 2 + 0.6, -B / 2], [L / 2 - 9, -B / 2], [L / 2 - 3, -B / 3.2], [L / 2, 0], [L / 2 - 3, B / 3.2], [L / 2 - 9, B / 2], [-L / 2 + 0.6, B / 2], [-L / 2, B / 2 - 0.6]];
  const hg = new THREE.ExtrudeGeometry(new THREE.Shape(plan.map(([x, z]) => new THREE.Vector2(x, z))), { depth: H, bevelEnabled: true, bevelSize: 0.18, bevelThickness: 0.18, bevelSegments: 3 });
  hg.rotateX(-Math.PI / 2); hg.computeVertexNormals();
  const hull = new THREE.Mesh(hg, bpHullMat()); hull.castShadow = true; g.add(hull);
  g.add(p3Mesh(p3Box(L - 2, 0.12, B - 0.4), dioSmooth('#7d4b3a', 0.8), { p: [-0.5, H + 0.2, 0] }));   // deck
  // the bulb: a smooth teardrop under the bow, below the waterline
  const bulb = p3Mesh(new THREE.SphereGeometry(1, 32, 20), bpHullMat(), { p: [L / 2 - 0.2, 0.85, 0], s: [2.4, 0.85, 0.85] }); g.add(bulb);
  // containers: rows of colored boxes (one draw per color)
  const cols = ['#e5484d', '#1f5fd6', '#f2a03d', '#2fb36e', '#f5f6f8', '#8e5bd6'], R = p3Rnd(12), slots: [number, number, number, number][] = [];
  for (let bx = -L / 2 + 8; bx < L / 2 - 7; bx += 2.7) for (let row = -2; row <= 2; row++) { const tiers = 1 + Math.floor(R() * 3.2); for (let tier = 0; tier < tiers; tier++) slots.push([bx, H + 0.9 + tier * 1.25, row * 1.12, Math.floor(R() * cols.length)]); }
  cols.forEach((c, ci) => { const mine = slots.filter((s) => s[3] === ci), sw = p3Swarm(mine.length, new THREE.BoxGeometry(2.55, 1.2, 1.06), dioSmooth(c, 0.55), true); mine.forEach(([x, y, z], i) => sw.put(i, x, y, z, 1)); sw.done(); g.add(sw); });
  // the bridge house at the stern, with windows, wings, mast and funnel
  const hx = -L / 2 + 4;
  g.add(p3Mesh(new THREE.RoundedBoxGeometry(4.2, 6.5, B - 0.6, 2, 0.15), dioSmooth(BP.white, 0.45), { p: [hx, H + 3.4, 0] }));
  for (let f = 0; f < 4; f++) g.add(p3Mesh(p3Box(0.05, 0.4, B - 1.2), dioSmooth('#1b2433', 0.2), { p: [hx + 2.13, H + 1.2 + f * 1.4, 0] }));
  g.add(p3Mesh(p3Box(1.6, 0.5, B + 1.8), dioSmooth(BP.white, 0.45), { p: [hx + 1, H + 6.4, 0] }), p3Mesh(p3Box(0.06, 0.35, B + 1.6), dioSmooth('#1b2433', 0.2), { p: [hx + 1.82, H + 6.4, 0] }));
  g.add(p3Mesh(p3Cyl(0.06, 0.08, 3.2, 8), dioSmooth('#c9ced8', 0.4), { p: [hx + 0.5, H + 8.3, 0] }), p3Mesh(p3Box(0.08, 0.08, 1.6), dioSmooth('#c9ced8', 0.4), { p: [hx + 0.5, H + 9.3, 0] }));
  const funnel = p3Group(p3Mesh(new THREE.RoundedBoxGeometry(1.5, 2.6, 1.3, 2, 0.2), dioSmooth('#f2a03d', 0.5)), p3Mesh(p3Box(1.52, 0.4, 1.32), dioSmooth('#22324f', 0.5), { p: [0, 1.15, 0] }));
  funnel.position.set(hx - 1.3, H + 7.6, 0); g.add(funnel);
  for (const s of [1, -1]) g.add(p3Mesh(new THREE.CapsuleGeometry(0.4, 1.4, 4, 10), dioSmooth('#ff7a1a', 0.5), { p: [hx - 0.6, H + 3.2, s * (B / 2 + 0.05)], r: [0, 0, Math.PI / 2] }));   // lifeboats
  // bow details: anchors, railings, the forecastle
  for (const s of [1, -1]) g.add(p3Mesh(p3Box(0.5, 0.7, 0.08), dioSmooth('#3a3f4a', 0.5), { p: [L / 2 - 4.2, H - 0.6, s * (B / 2 - 0.55)], r: [0, s * 0.35, 0] }));
  for (let x = -L / 2 + 6; x < L / 2 - 2; x += 1.2) for (const s of [1, -1]) g.add(p3Mesh(p3Cyl(0.025, 0.025, 0.6, 5), dioSmooth('#f5f6f8', 0.4), { p: [x, H + 0.55, s * (B / 2 - 0.15)] }));
  for (const s of [1, -1]) g.add(p3Mesh(p3Box(L - 8, 0.04, 0.04), dioSmooth('#f5f6f8', 0.4), { p: [-1, H + 0.85, s * (B / 2 - 0.15)] }));
  g.position.y = -BP_DRAFT;   // sits in the water up to its waterline
  // the funnel's smoke: puffs rising and drifting back (a loop); thick 0..1
  const R2 = p3Rnd(3), puffs = Array.from({ length: 10 }, (_, i) => { const m = p3Mesh(new THREE.SphereGeometry(0.5, 14, 10), dioSmooth(BP.smoke, 0.9)); m.castShadow = false; g.add(m); return { m, ph: i / 10, dz: (R2() - 0.5) * 0.6 }; });
  const pose = (t: number, o: { bulb?: number; bulbScale?: number; smoke?: number; pitch?: number } = {}) => {
    bulb.visible = (o.bulb ?? 1) > 0.01; bulb.scale.set(2.4 * (o.bulbScale ?? 1) * (o.bulb ?? 1), 0.85 * (o.bulb ?? 1), 0.85 * (o.bulb ?? 1));
    const sm = o.smoke ?? 0.5; puffs.forEach(({ m, ph, dz }) => { const u = (t * 0.35 + ph) % 1; m.position.set(funnel.position.x - u * 7, funnel.position.y + 1.4 + u * 4, dz + u * 0.8); m.scale.setScalar(Math.max(0.01, (0.4 + u * 1.6) * sm * (1 - u * 0.6))); });
    g.rotation.z = (o.pitch ?? 0.012) * Math.sin(t * 0.9); g.rotation.x = 0.01 * Math.sin(t * 0.7);
  };
  pose(0);
  return Object.assign(g, { pose, bulb, H });
};

// ---------- the port: land with houses, a quay with gantry cranes and a lighthouse ----------
const bpCrane = (p: Vec3, ry = 0) => { const steel = dioSmooth('#e5484d', 0.5), g = p3Group();
  for (const [x, z] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) g.add(p3Mesh(p3Box(0.3, 7, 0.3), steel, { p: [x, 3.5, z] }));
  g.add(p3Mesh(p3Box(0.4, 0.5, 13), steel, { p: [-1.2, 7.2, 3.5] }), p3Mesh(p3Box(0.4, 0.5, 13), steel, { p: [1.2, 7.2, 3.5] }), p3Mesh(p3Box(2.8, 1, 1.4), dioSmooth('#f5f6f8', 0.5), { p: [0, 6.6, 6] }));
  g.add(p3Mesh(p3Box(2.4, 0.2, 0.2), steel, { p: [0, 3.5, -1.2] }), p3Mesh(p3Box(2.4, 0.2, 0.2), steel, { p: [0, 3.5, 1.2] }));
  g.position.set(...p); g.rotation.y = ry; return g; };
const bpLighthouse = (p: Vec3) => { const g = p3Group(); for (let i = 0; i < 5; i++) g.add(p3Mesh(p3Cyl(0.75 - i * 0.07, 0.8 - i * 0.07, 1.2, 20), dioSmooth(i % 2 ? BP.red : BP.white, 0.45), { p: [0, 0.6 + i * 1.2, 0] }));
  g.add(p3Mesh(p3Cyl(0.6, 0.6, 0.8, 16), dioSmooth('#ffe9a8', 0.3), { p: [0, 6.4, 0], e: 0.6 }), p3Mesh(p3Cone(0.7, 0.8, 16), dioSmooth(BP.red, 0.45), { p: [0, 7.2, 0] })); g.position.set(...p); return g; };
const bpPort = () => {
  const g = p3Group(), land = dioDiorama({ road: false, w: 30, d: 40 }); land.position.set(-30, 0.3, 0); g.add(land);
  g.add(p3Mesh(p3Box(30, 0.6, 5), dioSmooth('#9aa0aa', 0.8), { p: [-30, 0.3, 17.2] }));   // quay
  g.add(bpCrane([-36, 0.6, 16], 0), bpCrane([-26, 0.6, 16], 0), bpLighthouse([-17, 0.6, -16]));
  return g;
};
// seagulls circling (a loop): little white V shapes flapping
const bpGulls = (n = 6) => { const g = p3Group(), R = p3Rnd(21), birds = Array.from({ length: n }, () => { const b = p3Group(...[1, -1].map((s) => p3Mesh(p3Box(0.9, 0.05, 0.25), dioSmooth('#ffffff', 0.6), { p: [0, 0, s * 0.4] })));
    g.add(b); return { b, r: 6 + R() * 8, y: 10 + R() * 6, ph: R() * 6, v: 0.25 + R() * 0.2, cx: (R() - 0.5) * 20 }; });
  const pose = (t: number) => birds.forEach(({ b, r, y, ph, v, cx }) => { const a = ph + t * v; b.position.set(cx + Math.cos(a) * r, y + Math.sin(t * 1.3 + ph) * 0.6, Math.sin(a) * r); b.rotation.y = -a; const f = 0.35 * Math.sin(t * 9 + ph); b.children[0].rotation.x = f; b.children[1].rotation.x = -f; });
  return Object.assign(g, { pose }); };

// ---------- the side cut: the waves drawn as curves (red: the ship's, lime: the bulb's, white: the sum) ----------
const bpCurves = (x0 = -2, x1 = 26, n = 120) => {
  // drawn over everything (the lime one runs under the water, which would hide it)
  const mk = (c: string, r: number) => { const m = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: c, depthTest: false, transparent: true })); m.frustumCulled = false; m.renderOrder = 900; return m; };   // transparent: drawn in the same pass as the water, after it
  const red = mk(BP.red, 0.09), lime = mk(BP.key, 0.09), sum = mk(BP.wave, 0.12), g = p3Group(red, lime, sum);
  const line = (m: THREE.Mesh, f: (x: number) => number, show: number, y: number) => { m.visible = show > 0.02; if (!m.visible) return;
    const pts = Array.from({ length: n }, (_, i) => { const x = p3Lerp(x0, x1, i / (n - 1)); return new THREE.Vector3(x, y + f(x) * show, 0); });
    m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, 0.16, 6); };
  // bow at x = L/2 (d = L/2 - x); amplitudes scaled by s; phase as in bpSeaHeight
  const pose = (o: { ship: number; bulb: number; sum: number; phase: number; s?: number }) => { const s = o.s ?? 2.6, d = (x: number) => BP_L / 2 - x;
    line(red, (x) => s * bpBowWave(d(x)), o.ship, 2.6); line(lime, (x) => s * bpBulbWave(d(x), o.phase), o.bulb, -2.6); line(sum, (x) => s * (bpBowWave(d(x)) + bpBulbWave(d(x), o.phase)), o.sum, 0.0); };
  return Object.assign(g, { pose });
};
// a round gauge (fuel or speed): dial, green band, needle; value 0..1
const bpGauge = (band: [number, number] = [0.45, 0.6]) => { const g = p3Group(p3Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.2, 40), dioSmooth('#22324f', 0.5), { r: [Math.PI / 2, 0, 0] }), p3Mesh(new THREE.CircleGeometry(1.05, 40), dioSmooth('#f5f6f8', 0.6), { p: [0, 0, 0.11] }));
  const arc = (a0: number, a1: number, c: string) => g.add(p3Mesh(new THREE.RingGeometry(0.78, 0.98, 32, 1, Math.PI * 1.25 - a1 * Math.PI * 1.5, (a1 - a0) * Math.PI * 1.5), dioSmooth(c, 0.5), { p: [0, 0, 0.12] }));
  arc(0, 1, '#c9ced8'); arc(band[0], band[1], BP.key);
  const needle = p3Group(p3Mesh(p3Box(0.08, 0.9, 0.05), dioSmooth(BP.red, 0.4), { p: [0, 0.4, 0] })); needle.position.z = 0.15; g.add(needle, p3Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 16), dioSmooth('#22324f', 0.4), { p: [0, 0, 0.17], r: [Math.PI / 2, 0, 0] }));
  const pose = (v: number) => { needle.rotation.z = Math.PI * 0.75 - v * Math.PI * 1.5; };
  return Object.assign(g, { pose }); };

// the whole harbour scene: sea, port, ship, gulls, light; returns the pieces and the captions
const bpHarbour = (w: World) => {
  dioLights(w); [[-20, 22, -50, 2.6], [20, 26, -60, 3]].forEach(([x, y, z, s]) => w.add(dioCloud([x, y, z], s)));
  const sea = w.add(bpSea(70, 40)), ship = w.add(bpShip()), gulls = w.add(bpGulls()); sea.position.x = 15; w.add(bpPort()).position.x = -5;   // sea x -20..50, land x -50..-20
  // waves(t, o): the sea around wherever the ship is now
  const waves = (t: number, o: { bow: number; bulb: number; phase: number }) => sea.pose(t, ship.position.x - sea.position.x, o);
  return { sea, ship, gulls, waves, cap: dioCaptions(w, BP_FIX) };
};

// ---------- world test shots ----------
defineVisuals({
  'test-ship': {   // the harbour, the ship sailing with its bow wave, smoke and gulls
    bg: BP.sky,
    build(w) { const { ship, gulls, waves } = bpHarbour(w);
      return (t) => { const lt = t - w.s.t0, x = 8 + lt * 1.5; ship.position.x = x; ship.pose(t, { smoke: 0.8 }); waves(t, { bow: 1, bulb: 0, phase: 0 }); gulls.pose(t);
        w.look([x + 34, 16, 40], [x + 2, 1, 0], 36); }; },
  },
  'test-bow': {   // the bow up close: the bulb under the water, the bow wave with and without it
    bg: BP.sky,
    build(w) { const { ship, waves } = bpHarbour(w);
      return (t) => { const lt = t - w.s.t0, b = p3Ramp(lt, 1, 1.5); ship.position.x = 0; ship.pose(t, { bulb: b }); waves(t, { bow: 1, bulb: b, phase: 0 }); w.look([BP_L / 2 + 10, 3, 14], [BP_L / 2 - 2, -0.2, 0], 36); }; },
  },
  'test-curves': {   // the side cut: red + lime = flat white; then out of phase
    bg: BP.sky,
    build(w) { dioLights(w); const c = w.add(bpCurves()), gauge = w.add(bpGauge()); gauge.position.set(BP_L / 2 + 4, 4.5, 0);
      return (t) => { const lt = t - w.s.t0; c.pose({ ship: 1, bulb: 1, sum: 1, phase: lt > 1.5 ? 3 : 0 }); gauge.pose(lt > 1.5 ? 0.25 : 0.53); w.look([10, 1, 30], [10, 1, 0], 36); }; },
  },
});
