// World of "Esta rayita de tu pasta NO dice si es química" (3D, the channel's diorama look). Prefix rp.
// TEST of the retention rules (frame 0 in motion, prize announced on screen at 0 s and by voice at 3.3 s, a cut or pop every
// 1-2 s, a comment question inside the video, the last line looping into the first). Sources: fuentes.md.

const RP = { sky: '#5bb8f5', tile: '#e8f3f8', tileD: '#bcd7e3', key: '#b6f23c', red: '#e5484d', paste: '#f7fbff', pasteStripe: '#3aa6ff', glove: '#ffffff', beam: '#ff3b5c', ok: '#3ddc84' };
const RP_FIX: Record<number, string> = { 0: 'Esta', 20: 'tabla:', 131: 'qué' };   // what Whisper wrote differently from the script
const RP_R = 0.055, RP_L = 0.36;   // tube radius and length (m): a big, toy-like tube on the counter

// ---------- the tube: printed body, cap, and the top end that is round (open) or crimped flat; the mark at the sealed end ----------
const rpPrint = (body: string, ink: string, mark: string, brand: string) => { const W = 1024, H = 512, t = p3Paint(W, H, (c) => {
  c.fillStyle = body; c.fillRect(0, 0, W, H);
  c.fillStyle = ink; c.fillRect(0, H * 0.32, W, H * 0.3);   // the brand band
  c.fillStyle = '#ffffff'; c.font = '900 120px "RA Heavy", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(brand, W * 0.25, H * 0.47);
  c.fillStyle = ink; c.font = '700 44px sans-serif'; c.fillText('PASTA DENTAL', W * 0.25, H * 0.72); c.fillText('★ ★ ★', W * 0.25, H * 0.2);
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.font = '600 22px sans-serif'; for (let i = 0; i < 6; i++) c.fillText('ingredientes · ingredientes · ingredientes', W * 0.75, H * (0.3 + i * 0.07));
  c.fillStyle = mark; c.fillRect(W * 0.735, 6, W * 0.03, H * 0.075);   // the eye mark: back side (u 0.75), at the sealed end (top)
}); t.colorSpace = THREE.SRGBColorSpace; return t; };
const rpTube = (o: { body?: string; ink?: string; mark?: string; brand?: string } = {}) => {
  const N = 48, M = 40, geo = new THREE.BufferGeometry(), pos = new Float32Array((N + 1) * (M + 1) * 3), uv = new Float32Array((N + 1) * (M + 1) * 2), idx: number[] = [];
  for (let i = 0; i <= N; i++) for (let j = 0; j <= M; j++) { const k = i * (M + 1) + j; uv[k * 2] = j / M; uv[k * 2 + 1] = i / N; }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + M + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  const mat = new THREE.MeshStandardMaterial({ map: rpPrint(o.body ?? '#ffffff', o.ink ?? '#1f5fd6', o.mark ?? '#e5484d', o.brand ?? 'BRILLO'), roughness: 0.35, side: THREE.DoubleSide });
  const body = new THREE.Mesh(geo, mat); body.castShadow = true;
  const cap = p3Group(p3Mesh(new THREE.CylinderGeometry(RP_R * 0.62, RP_R * 0.68, 0.06, 24), dioSmooth('#f5f6f8', 0.4), { p: [0, -0.03, 0] }), p3Mesh(new THREE.CylinderGeometry(RP_R * 0.4, RP_R * 0.45, 0.02, 20), dioSmooth('#f5f6f8', 0.4), { p: [0, 0.006, 0] }));
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; cap.add(p3Mesh(p3Box(0.004, 0.05, 0.004), dioSmooth('#d7dbe3', 0.4), { p: [Math.cos(a) * RP_R * 0.66, -0.03, Math.sin(a) * RP_R * 0.66] })); }
  const seal = p3Group(); for (let i = 0; i < 6; i++) seal.add(p3Mesh(p3Box(RP_R * 2.7, 0.004, 0.012), dioSmooth(o.body ?? '#ffffff', 0.4), { p: [0, RP_L + 0.004 + i * 0.006, 0] }));
  const g = p3Group(body, cap, seal); let last = '';
  // crimp 0..1 flattens the top end (0 = round and open, as it arrives at the factory); squeeze 0..1 pinches the middle
  const pose = (q: { crimp?: number; squeeze?: number } = {}) => { const cr = q.crimp ?? 1, sq = q.squeeze ?? 0, key = cr.toFixed(3) + sq.toFixed(3); seal.visible = cr > 0.9; if (key === last) return; last = key;
    for (let i = 0; i <= N; i++) { const v = i / N, s = p3Smoothstep(0.5, 1, v) * cr, pinch = sq * Math.exp(-(((v - 0.42) / 0.14) ** 2)), a = RP_R * (1 + 0.38 * s) * (1 + 0.25 * pinch), b = RP_R * Math.max(0.05, 1 - 0.95 * s) * (1 - 0.55 * pinch);
      for (let j = 0; j <= M; j++) { const th = (j / M) * Math.PI * 2, k = (i * (M + 1) + j) * 3; pos[k] = a * Math.cos(th); pos[k + 1] = v * RP_L; pos[k + 2] = b * Math.sin(th); } }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); };
  pose();
  return Object.assign(g, { pose, mat });
};
// the mark's point on a tube (local: back side, top end), in world coordinates
const rpMarkAt = (tube: THREE.Object3D) => { tube.updateMatrixWorld(true); return tube.localToWorld(new THREE.Vector3(0, RP_L - 0.03, -RP_R * 0.32)); };
// a ribbon of paste squeezed out of the cap, along a curve, growing (u 0..1)
const rpRibbon = (pts: THREE.Vector3[]) => { const curve = new THREE.CatmullRomCurve3(pts), white = new THREE.Mesh(new THREE.BufferGeometry(), dioSmooth(RP.paste, 0.3)), blue = new THREE.Mesh(new THREE.BufferGeometry(), dioSmooth(RP.pasteStripe, 0.3));
  const g = p3Group(white, blue); white.frustumCulled = blue.frustumCulled = false;
  const pose = (u: number) => { g.visible = u > 0.01; if (!g.visible) return; const n = Math.max(2, Math.round(60 * p3Clamp(u))), P = curve.getSpacedPoints(59).slice(0, n);
    white.geometry.dispose(); white.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P), n * 2, 0.014, 10); blue.geometry.dispose(); blue.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P.map((p) => p.clone().add(new THREE.Vector3(0, 0.011, 0)))), n * 2, 0.005, 6); };
  return Object.assign(g, { pose }); };
const rpBrush = () => { const g = p3Group(p3Mesh(new THREE.CapsuleGeometry(0.012, 0.26, 4, 12), dioSmooth('#2fb36e', 0.4), { r: [0, 0, Math.PI / 2] }), p3Mesh(new THREE.RoundedBoxGeometry(0.06, 0.012, 0.024, 2, 0.005), dioSmooth('#2fb36e', 0.4), { p: [0.16, 0, 0] }));
  for (let i = 0; i < 5; i++) for (let k = 0; k < 2; k++) g.add(p3Mesh(p3Cyl(0.004, 0.004, 0.03, 6), dioSmooth(i % 2 ? '#ffffff' : '#7fd6ff', 0.6), { p: [0.14 + i * 0.011, 0.02, -0.006 + k * 0.012] }));
  return g; };
// a cartoon glove that holds and squeezes (closed fist around the tube)
const rpGlove = () => { const m = dioSmooth(RP.glove, 0.55), g = p3Group(p3Mesh(new THREE.RoundedBoxGeometry(0.1, 0.12, 0.09, 3, 0.035), m), p3Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.05, 18), dioSmooth(RP.key, 0.5), { p: [0, -0.08, 0] }));
  for (let i = 0; i < 4; i++) g.add(p3Mesh(new THREE.CapsuleGeometry(0.016, 0.05, 4, 8), m, { p: [-0.035 + i * 0.023, 0.03, 0.05], r: [Math.PI / 2, 0, 0] }));
  g.add(p3Mesh(new THREE.CapsuleGeometry(0.017, 0.045, 4, 8), m, { p: [0.06, 0.0, -0.03], r: [0, 0, -0.6] })); return g; };

// ---------- the bathroom diorama: a floating tiled block, counter with sink, mirror, cup, soap, towel, plant ----------
const rpTiles = (base: string, line: string, n = 8) => { const t = p3Paint(256, 256, (c) => { c.fillStyle = base; c.fillRect(0, 0, 256, 256); c.strokeStyle = line; c.lineWidth = 6; for (let i = 0; i <= n; i++) { const p = (i / n) * 256; c.beginPath(); c.moveTo(p, 0); c.lineTo(p, 256); c.stroke(); c.beginPath(); c.moveTo(0, p); c.lineTo(256, p); c.stroke(); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; };
const rpBathroom = () => { const g = p3Group();
  const floorTex = rpTiles('#f0d7b0', '#d4b48a', 6); floorTex.repeat.set(3, 2); const sideTex = rpTiles('#9aa3b0', '#7d8594', 4); sideTex.repeat.set(4, 1);
  const side = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.8 }), blk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 1.6), [side, side, new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.6 }), side, side, side]); blk.position.y = -0.2; blk.receiveShadow = true; g.add(blk);
  const wallTex = rpTiles(RP.tile, RP.tileD, 8); wallTex.repeat.set(4, 3); g.add(p3Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.08), new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.4 }), { p: [0, 0.9, -0.76] }));
  // vanity: cabinet, counter, sink basin, faucet
  g.add(p3Mesh(new THREE.RoundedBoxGeometry(1.4, 0.78, 0.55, 3, 0.03), dioSmooth('#2f6fde', 0.5), { p: [0, 0.39, -0.45] }));
  for (const x of [-0.35, 0.35]) g.add(p3Mesh(p3Box(0.6, 0.62, 0.01), dioSmooth('#3a7eea', 0.5), { p: [x, 0.38, -0.17] }), p3Mesh(p3Box(0.12, 0.02, 0.02), dioSmooth('#c9ced8', 0.3, 0.6), { p: [x * 0.3, 0.6, -0.16] }));
  g.add(p3Mesh(new THREE.RoundedBoxGeometry(1.5, 0.05, 0.62, 3, 0.02), dioSmooth('#f5f6f8', 0.3), { p: [0, 0.805, -0.44] }));
  g.add(p3Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.03, 32), dioSmooth('#dfe6ec', 0.2), { p: [-0.25, 0.83, -0.45] }));
  g.add(p3Mesh(p3Cyl(0.02, 0.02, 0.16, 12), dioSmooth('#c9ced8', 0.2, 0.8), { p: [-0.25, 0.9, -0.66] }), p3Mesh(p3Cyl(0.015, 0.015, 0.14, 12), dioSmooth('#c9ced8', 0.2, 0.8), { p: [-0.25, 0.97, -0.6], r: [Math.PI / 2, 0, 0] }));
  // mirror with a frame, cup with brushes, soap, towel ring, plant
  g.add(p3Mesh(new THREE.RoundedBoxGeometry(0.9, 0.62, 0.03, 3, 0.04), dioSmooth('#f2a03d', 0.5), { p: [0, 1.35, -0.7] }), p3Mesh(new THREE.PlaneGeometry(0.82, 0.54), dioSmooth('#bfe8ff', 0.05, 0.3), { p: [0, 1.35, -0.68] }));
  g.add(p3Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.12, 20), dioSmooth('#e5484d', 0.4), { p: [0.45, 0.89, -0.6] }));
  for (const [x, c] of [[0.43, '#2fb36e'], [0.47, '#8e5bd6']] as const) g.add(p3Mesh(new THREE.CapsuleGeometry(0.009, 0.2, 4, 8), dioSmooth(c, 0.4), { p: [x, 1.0, -0.6], r: [0, 0, (x - 0.45) * 8] }));
  g.add(p3Mesh(new THREE.RoundedBoxGeometry(0.11, 0.035, 0.07, 3, 0.015), dioSmooth('#ffcf4a', 0.4), { p: [0.55, 0.85, -0.42] }));
  g.add(p3Mesh(new THREE.TorusGeometry(0.12, 0.012, 8, 32), dioSmooth('#c9ced8', 0.2, 0.8), { p: [0.95, 1.05, -0.7] }), p3Mesh(new THREE.RoundedBoxGeometry(0.22, 0.32, 0.03, 3, 0.02), dioSmooth('#ff7aa8', 0.8), { p: [0.95, 0.88, -0.69] }));
  g.add(p3Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.12, 16), dioSmooth('#c2683a', 0.7), { p: [-0.62, 0.89, -0.6] }));
  for (const [x, y, z, r] of [[-0.62, 1.0, -0.6, 0.08], [-0.58, 1.06, -0.57, 0.06], [-0.66, 1.05, -0.63, 0.06]]) g.add(p3Mesh(new THREE.IcosahedronGeometry(r, 1), dioSmooth('#4caf3e', 0.7), { p: [x, y, z] }));
  return g; };
// the bathroom set: light, sky, the diorama, the hero tube, the brush, the glove, the ribbon; returns them and the captions
const rpBathSet = (w: World) => { dioLights(w); [[-1.8, 2.4, -3, 0.7], [1.9, 2.8, -3.5, 0.9]].forEach(([x, y, z, s]) => w.add(dioCloud([x, y, z], s)));
  w.add(rpBathroom()); const pivot = w.add(p3Group()), tube = rpTube(), brush = w.add(rpBrush()), glove = w.add(rpGlove()); pivot.add(tube);
  brush.position.set(0.08, 0.84, -0.3); brush.rotation.y = 0.3;
  const ribbon = w.add(rpRibbon([new THREE.Vector3(0.24, 0.93, -0.29), new THREE.Vector3(0.22, 0.89, -0.29), new THREE.Vector3(0.2, 0.865, -0.29), new THREE.Vector3(0.13, 0.862, -0.27)]));
  return { pivot, tube, brush, glove, ribbon, cap: dioCaptions(w, RP_FIX) }; };
// the tube held by the glove over the brush, lying down, cap toward the brush (left); spin turns it on its own axis
// (spin = PI shows the mark to the camera). upright = 1 stands it on the counter instead (at x, cap down)
const rpHold = (S: ReturnType<typeof rpBathSet>, squeeze: number, spin = Math.PI, upright = 0, x = 0.2) => {
  S.tube.rotation.y = spin; S.tube.pose({ squeeze });
  if (upright) { S.pivot.position.set(x, 0.89, -0.32); S.pivot.rotation.set(0, 0, 0); S.glove.visible = false; return; }
  S.glove.visible = true; S.pivot.position.set(0.26, 0.95, -0.29); S.pivot.rotation.set(0, 0, -Math.PI / 2 - 0.22);
  S.glove.position.set(0.43, 1.0, -0.29); S.glove.rotation.set(0, 0, -Math.PI / 2 - 0.22); S.glove.scale.set(1, 1 - 0.12 * squeeze, 1); };

// ---------- the factory diorama: grey floor block with yellow lines, turntable of upright tubes, sensor, filler, crimper ----------
const rpFactory = () => { const g = p3Group(), floor = p3Paint(256, 256, (c) => { c.fillStyle = '#8a93a6'; c.fillRect(0, 0, 256, 256); c.fillStyle = '#ffcf4a'; c.fillRect(0, 120, 256, 14); c.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 60; i++) c.fillRect((i * 97) % 256, (i * 53) % 256, 6, 6); });
  floor.colorSpace = THREE.SRGBColorSpace; floor.wrapS = floor.wrapT = THREE.RepeatWrapping; floor.repeat.set(2, 2); const sideM = dioSmooth('#5a606c', 0.7);
  const blk = new THREE.Mesh(new THREE.BoxGeometry(3, 0.4, 2), [sideM, sideM, new THREE.MeshStandardMaterial({ map: floor, roughness: 0.8 }), sideM, sideM, sideM]); blk.position.y = -0.2; blk.receiveShadow = true; g.add(blk);
  g.add(p3Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.5, 40), dioSmooth('#c9ced8', 0.4, 0.4), { p: [0, 0.25, 0] }), p3Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 40), dioSmooth('#1f5fd6', 0.4), { p: [0, 0.52, 0] }));
  // the out conveyor with its rollers and rails
  g.add(p3Mesh(p3Box(1.3, 0.06, 0.24), dioSmooth('#2a2f3a', 0.6), { p: [0.95, 0.45, 0.62] })); for (let x = 0.35; x < 1.6; x += 0.1) g.add(p3Mesh(p3Cyl(0.02, 0.02, 0.24, 8), dioSmooth('#c9ced8', 0.3, 0.6), { p: [x, 0.49, 0.62], r: [Math.PI / 2, 0, 0] }));
  for (const x of [0.4, 1.5]) g.add(p3Mesh(p3Box(0.05, 0.45, 0.05), dioSmooth('#2a2f3a', 0.6), { p: [x, 0.22, 0.62] }));
  // a control cabinet with lights and a big pipe of paste feeding the filler
  g.add(p3Mesh(new THREE.RoundedBoxGeometry(0.4, 0.9, 0.3, 2, 0.03), dioSmooth('#ffcf4a', 0.5), { p: [-1.1, 0.45, -0.6] }));
  for (let i = 0; i < 3; i++) g.add(p3Mesh(new THREE.SphereGeometry(0.025, 10, 8), dioSmooth(['#3ddc84', '#ffcf4a', '#e5484d'][i], 0.3), { p: [-1.18 + i * 0.08, 0.75, -0.44], e: 0.8 }));
  g.add(p3Tube([[-1.0, 0.95, -0.6], [-0.6, 1.4, -0.6], [-0.05, 1.45, -0.5], [0.0, 1.2, -0.48]], 0.04, dioSmooth('#c9ced8', 0.3, 0.6), 24));
  return g; };
// the turntable: 6 cups holding upright tubes (cap down); station angles: 0 sensor (front, +z), 1 filler, 2 crimper
const RP_ST = [Math.PI / 2, Math.PI / 2 - Math.PI / 3, Math.PI / 2 - (2 * Math.PI) / 3];
const rpTurntable = () => { const g = p3Group(), R = 0.45, slots = Array.from({ length: 6 }, (_, i) => { const cup = p3Group(p3Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.08, 20), dioSmooth('#2a2f3a', 0.5)));
    const tube = rpTube({ body: ['#ffffff', '#2fb36e', '#ffffff', '#1f5fd6', '#ffffff', '#f2a03d'][i], ink: ['#1f5fd6', '#0f6b3a', '#e5484d', '#0d3a8a', '#2fb36e', '#9a5a12'][i], mark: ['#e5484d', '#111318', '#1f5fd6', '#ffcf4a', '#111318', '#1f5fd6'][i], brand: 'BRILLO' });
    tube.position.y = 0.05; cup.add(tube); g.add(cup); return { cup, tube, a0: Math.PI / 2 + (i / 6) * Math.PI * 2, spin0: i * 1.7 + 0.8 }; });
  g.position.y = 0.55;
  // index 0..: how many stations the table has advanced (fractional = moving); align 0..1: the tube at the sensor turns until its print faces front
  const pose = (index: number, align = 1, crimpAt = -1) => { slots.forEach((s, i) => { const a = s.a0 - (index * Math.PI) / 3; s.cup.position.set(Math.cos(a) * R, 0.04, Math.sin(a) * R);
      const atSensor = Math.abs(((a - RP_ST[0] + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.2; const spin = atSensor ? p3Lerp(s.spin0, 0, align) : s.spin0 * (Math.cos(a) > 0.3 ? 1 : 0);
      s.tube.rotation.y = spin; s.tube.pose({ crimp: i === crimpAt ? 1 : Math.sin(a) < -0.2 ? 1 : 0 }); }); };
  return Object.assign(g, { pose, slots }); };
// the sensor: a post with a box that shoots a beam at the tube's top end; ok 0..1 turns the beam green and pops a check
const rpSensor = () => { const g = p3Group(p3Mesh(p3Box(0.05, 0.9, 0.05), dioSmooth('#2a2f3a', 0.5), { p: [0, 0.45, 0] }), p3Mesh(new THREE.RoundedBoxGeometry(0.14, 0.1, 0.12, 2, 0.02), dioSmooth('#ffcf4a', 0.5), { p: [0, 0.98, 0] }), p3Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16), dioSmooth('#111318', 0.3), { p: [0, 0.98, -0.065], r: [Math.PI / 2, 0, 0] }));
  const beamMat = new THREE.MeshBasicMaterial({ color: RP.beam, transparent: true, opacity: 0.85 }), beam = p3Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 8), beamMat); g.add(beam);
  const dot = p3Mesh(new THREE.SphereGeometry(0.014, 10, 8), new THREE.MeshBasicMaterial({ color: RP.beam })); g.add(dot);
  // len: distance to the tube; ok 0..1
  const pose = (t: number, len: number, ok = 0) => { const c = ok > 0.5 ? RP.ok : RP.beam; beamMat.color.set(c); (dot.material as THREE.MeshBasicMaterial).color.set(c); beam.position.set(0, 0.98, -0.07 - len / 2); beam.rotation.x = Math.PI / 2; beam.scale.y = len; dot.position.set(0, 0.98, -0.07 - len); beamMat.opacity = 0.6 + 0.3 * Math.sin(t * 20); };
  return Object.assign(g, { pose }); };
// the filler: a nozzle that comes down and a column of paste (fill 0..1); the crimper: two jaws that close (u 0..1)
const rpFiller = () => { const g = p3Group(p3Mesh(new THREE.CylinderGeometry(0.03, 0.015, 0.16, 16), dioSmooth('#c9ced8', 0.3, 0.6)), p3Mesh(new THREE.RoundedBoxGeometry(0.16, 0.08, 0.16, 2, 0.02), dioSmooth('#c9ced8', 0.3, 0.6), { p: [0, 0.1, 0] }));
  const col = p3Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1, 12), dioSmooth(RP.paste, 0.3)); g.add(col);
  return Object.assign(g, { pose: (fill: number, top: number) => { g.position.y = top + 0.12 - 0.06 * Math.sin(Math.PI * fill); col.visible = fill > 0.05 && fill < 0.95; col.scale.y = 0.1; col.position.y = -0.12; } }); };
const rpCrimper = () => { const jaws = [1, -1].map((s) => p3Mesh(new THREE.RoundedBoxGeometry(0.2, 0.05, 0.05, 2, 0.01), dioSmooth('#e5484d', 0.4), { p: [0, 0, s * 0.1] })), g = p3Group(...jaws);
  return Object.assign(g, { pose: (u: number) => jaws.forEach((j, i) => { j.position.z = (i ? -1 : 1) * p3Lerp(0.1, 0.035, u); }) }); };

// ---------- the myth: four tubes with the four colors, a table, the big X, the box with the ingredients ----------
const RP_MYTH = [['#2fb36e', 'NATURAL'], ['#1f5fd6', 'CON MEDICINA'], ['#e5484d', 'MEZCLA'], ['#111318', 'QUÍMICA']] as const;
const rpX = (size = 0.8) => p3Group(...[0.785, -0.785].map((r) => p3Mesh(p3Box(size, size * 0.18, 0.04), dioSmooth(RP.red, 0.4), { r: [0, 0, r], e: 0.3 })));
const rpBox = () => { const t = p3Paint(512, 512, (c) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, 512, 512); c.fillStyle = '#1f5fd6'; c.fillRect(0, 0, 512, 110); c.fillStyle = '#ffffff'; c.font = '900 64px "RA Heavy", sans-serif'; c.textAlign = 'center'; c.fillText('INGREDIENTES', 256, 78);
    c.fillStyle = '#2a2f3a'; c.font = '600 30px sans-serif'; ['Sorbitol, Agua, Sílice', 'Glicerina, Lauril sulfato', 'Fluoruro de sodio 0,32 %', 'Aroma, Goma xantana', 'Sacarina sódica', 'Dióxido de titanio'].forEach((l, i) => c.fillText(l, 256, 180 + i * 50)); }); t.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }), side = dioSmooth('#1f5fd6', 0.5); return new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.16), [side, side, side, side, face, side]); };
