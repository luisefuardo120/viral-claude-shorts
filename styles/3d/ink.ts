// The "ink" look: a cartoon finish on top of any 3D scene.
//   inkLook(w, o)   cel-shaded materials (2-3 light steps), black ink outlines on silhouettes and creases, warm grade,
//                   vignette, a soft background blur, sky gradient and fog. 2D cards, labels, water and particles are drawn
//                   on top without ink (their own outlines stay clean).
//   inkLights(w, preset)  light + sky + fog for a time of day ('sunset' | 'day').
//   Set pieces for a rich background: inkMansion, inkPine, inkPalm, inkHedge, inkLamp, inkHills, inkMountains.
// Original code for this repo (same idea as the edge-detect pass in mromidev/claude-animated-shorts, written from scratch).

const INK_SKY: Record<string, { top: string; mid: string; low: string; fog: string; sun: string; hemi: [string, string]; el: number; az: number; i: number }> = {
  sunset: { top: '#5f7fc8', mid: '#ff9f6e', low: '#ffd49a', fog: '#f9c49a', sun: '#ffd3a3', hemi: ['#c9d6ff', '#a8805f'], el: 18, az: 245, i: 2.9 },
  day: { top: '#3f8fe0', mid: '#8fd0ff', low: '#dff3ff', fog: '#cfeaff', sun: '#fff4e0', hemi: ['#e8f4ff', '#4f7f35'], el: 48, az: 30, i: 1.6 },
};
// a vertical gradient for the background (screen space)
const inkSkyTex = (top: string, mid: string, low: string) => { const t = p3Paint(4, 512, (c) => { const g = c.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, top); g.addColorStop(0.62, mid); g.addColorStop(1, low); c.fillStyle = g; c.fillRect(0, 0, 4, 512); });
  t.colorSpace = THREE.SRGBColorSpace; return t; };
const inkLights = (w: World, preset: 'sunset' | 'day' = 'sunset', fog: [number, number] = [30, 115]) => { const P = INK_SKY[preset];   // fog: near/far in m (bigger sets need it farther)
  w.scene.background = inkSkyTex(P.top, P.mid, P.low); w.scene.fog = new THREE.Fog(P.fog, fog[0], fog[1]);   // strong haze: far layers turn pastel, like a painted backdrop
  w.add(new THREE.HemisphereLight(P.hemi[0], P.hemi[1], 1.0));
  const sun = new THREE.DirectionalLight(P.sun, P.i), el = THREE.MathUtils.degToRad(P.el), az = THREE.MathUtils.degToRad(P.az);
  sun.position.set(Math.sin(az) * Math.cos(el) * 30, Math.sin(el) * 30, -Math.cos(az) * Math.cos(el) * 30 + 6); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.radius = 3; sun.shadow.bias = -0.0004;
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, far: 90 }); w.add(sun);
  return { sun, preset: P }; };

// 3 light steps with soft edges between them (painted, not plastic)
const INK_RAMP = (() => { const t = new THREE.DataTexture(new Uint8Array([150, 150, 150, 255, 215, 215, 215, 255, 255, 255, 255, 255]), 3, 1); t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true; return t; })();
// every plain lit material -> toon (keeps colour, map, emissive); shader-patched materials stay as they are
const inkToonify = (root: THREE.Object3D) => { const cache = new Map<THREE.Material, THREE.Material>();
  root.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh || Array.isArray(m.material)) return; const src = m.material as THREE.MeshStandardMaterial;
    if (!src.isMeshStandardMaterial || src.transparent || src.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile) return;
    let dst = cache.get(src); if (!dst) { dst = new THREE.MeshToonMaterial({ color: src.color, map: src.map, emissive: src.emissive, emissiveIntensity: src.emissiveIntensity, emissiveMap: src.emissiveMap, gradientMap: INK_RAMP, side: src.side }); cache.set(src, dst); }
    m.material = dst; }); };

const INK_FAR = 120;
const INK_NORMAL = new THREE.ShaderMaterial({ side: THREE.DoubleSide,
  vertexShader: `varying vec3 vN; varying float vD; void main() { vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `varying vec3 vN; varying float vD; void main() { gl_FragColor = vec4(normalize(vN) * 0.5 + 0.5, clamp(vD / ${INK_FAR.toFixed(1)}, 0.0, 1.0)); }` });
const INK_DEPTH_ONLY = new THREE.MeshBasicMaterial({ colorWrite: false });
const INK_FINAL = (o: { ink: string; width: number; sat: number; vig: number; warm: number; blur: number; focus: number }) => new THREE.ShaderMaterial({ toneMapped: true, depthTest: false, depthWrite: false,
  uniforms: { tC: { value: null }, tN: { value: null }, uSunV: { value: new THREE.Vector3(0, 1, 0) }, uRim: { value: new THREE.Color('#ffb36b') }, uRes: { value: new THREE.Vector2(1080, 1920) }, uInk: { value: new THREE.Color(o.ink) }, uW: { value: o.width }, uSat: { value: o.sat }, uVig: { value: o.vig }, uWarm: { value: o.warm }, uBlur: { value: o.blur }, uFocus: { value: o.focus } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `uniform sampler2D tC, tN; uniform vec2 uRes; uniform vec3 uInk; uniform float uW, uSat, uVig, uWarm, uBlur, uFocus; uniform vec3 uSunV, uRim; varying vec2 vUv;
    void main() {
      vec4 n0 = texture2D(tN, vUv); float d0 = n0.a * ${INK_FAR.toFixed(1)}; vec3 N0 = n0.rgb * 2.0 - 1.0;
      // background blur: the farther from the focus distance, the wider the ring of samples
      float coc = clamp((d0 - uFocus) / (uFocus * 1.5), 0.0, 1.0) * uBlur; vec3 col = texture2D(tC, vUv).rgb; float wsum = 1.0;
      if (coc > 0.3) { for (int i = 0; i < 12; i++) { float a = float(i) * 2.39996; float r = coc * sqrt((float(i) + 0.5) / 12.0); vec2 o = vec2(cos(a), sin(a)) * r / uRes; col += texture2D(tC, vUv + o).rgb; wsum += 1.0; } }
      col /= wsum;
      // painted rim light: surfaces turned sideways towards the sun get a warm edge
      if (n0.a < 0.999) { float side = pow(1.0 - max(N0.z, 0.0), 2.2); float toward = max(dot(normalize(N0.xy + 1e-4), normalize(uSunV.xy + 1e-4)), 0.0); col += uRim * side * toward * 0.55; }
      // ink: on the near side of a depth jump (silhouettes) and where the surface turns sharply (creases)
      float e = 0.0; float k = clamp(1.5 - d0 / 80.0, 0.0, 1.0);
      for (int i = 0; i < 8; i++) { float a = float(i) * 0.785398; vec2 o = vec2(cos(a), sin(a)) * uW / uRes; vec4 n1 = texture2D(tN, vUv + o); float d1 = n1.a * ${INK_FAR.toFixed(1)};
        if (d1 - d0 > 0.04 + d0 * 0.02) e = 1.0;
        if (abs(d1 - d0) < 0.25 + d0 * 0.02 && dot(N0, n1.rgb * 2.0 - 1.0) < 0.7) e = max(e, 0.9); }
      col = mix(col, uInk * mix(vec3(1.0), col, 0.35), e * k * 0.9);   // ink takes a little of the colour under it, like a brush line
      // grade: saturation, warmth, vignette
      float l = dot(col, vec3(0.299, 0.587, 0.114)); col = mix(vec3(l), col, uSat); col *= vec3(1.0 + uWarm, 1.0 + uWarm * 0.35, 1.0 - uWarm * 0.6);
      vec2 q = vUv - 0.5; col *= 1.0 - uVig * dot(q, q) * 1.6;
      col = col * 0.93 + vec3(0.05, 0.035, 0.03);   // lifted shadows, warm
      vec2 pp = floor(vUv * uRes / 3.0); float pn = fract(sin(dot(pp, vec2(12.9898, 78.233))) * 43758.5453); col *= 0.975 + 0.05 * pn;   // paper grain
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }` });

// overlay = drawn after the ink, without it: cards, labels, transparent things, particles
const inkIsOverlay = (o: THREE.Object3D) => { const m = o as THREE.Mesh; if ((o as THREE.Sprite).isSprite || (o as THREE.Points).isPoints || (o as THREE.InstancedMesh).isInstancedMesh || o.userData.noInk) return true;
  if (!m.isMesh) return false; const mat = m.material as THREE.Material | THREE.Material[]; return Array.isArray(mat) ? mat.some((x) => x.transparent) : mat.transparent; };

let INK_RT: { rtC: THREE.WebGLRenderTarget; rtN: THREE.WebGLRenderTarget } | null = null;
const inkLook = (w: World, o: { ink?: string; width?: number; sat?: number; vig?: number; warm?: number; blur?: number; focus?: number } = {}) => {
  const r = w.renderer, sz = r.getSize(new THREE.Vector2()), S = sz.x, H = sz.y;
  const { rtC, rtN } = INK_RT ??= { rtC: new THREE.WebGLRenderTarget(S, H, { type: THREE.HalfFloatType, samples: 4 }), rtN: new THREE.WebGLRenderTarget(S, H, { type: THREE.HalfFloatType }) };   // shared by every scene (memory)
  const fin = INK_FINAL({ ink: o.ink ?? '#3b2730', width: o.width ?? 2.4, sat: o.sat ?? 1.08, vig: o.vig ?? 0.45, warm: o.warm ?? 0.04, blur: o.blur ?? 5, focus: o.focus ?? 14 });
  fin.uniforms.uRes.value.set(S, H);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fin); quad.frustumCulled = false; const qs = new THREE.Scene(); qs.add(quad); const qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  let toon = false;
  w.present = () => { const sc = w.scene, cam = w.camera; if (!toon) { inkToonify(sc); toon = true; }
    const world: THREE.Object3D[] = [], over: THREE.Object3D[] = [];
    sc.traverseVisible((x) => { if ((x as THREE.Mesh).isMesh || (x as THREE.Sprite).isSprite || (x as THREE.Points).isPoints) (inkIsOverlay(x) ? over : world).push(x); });
    const bg = sc.background, fog = sc.fog, ac = r.autoClear;
    // 1. colour of the world (no overlays)
    over.forEach((x) => { x.visible = false; }); r.shadowMap.needsUpdate = true; r.setRenderTarget(rtC); r.clear(); r.render(sc, cam);
    // 2. normals + depth
    r.shadowMap.autoUpdate = false; sc.background = null; sc.fog = null; sc.overrideMaterial = INK_NORMAL; r.setRenderTarget(rtN); r.setClearColor(0x8080ff, 1); r.clear(); r.render(sc, cam); r.setClearColor(0x000000, 1);
    // 3. ink + grade to the screen
    let sunL: THREE.DirectionalLight | null = null; sc.traverse((x) => { if (!sunL && (x as THREE.DirectionalLight).isDirectionalLight) sunL = x as THREE.DirectionalLight; });
    if (sunL) fin.uniforms.uSunV.value.copy((sunL as THREE.DirectionalLight).position).normalize().transformDirection(cam.matrixWorldInverse);
    fin.uniforms.tC.value = rtC.texture; fin.uniforms.tN.value = rtN.texture; r.setRenderTarget(null); r.clear(); r.render(qs, qc);
    // 4. the overlays on top, occluded by the world: depth of the world first, then the overlays
    r.autoClear = false; sc.overrideMaterial = INK_DEPTH_ONLY; r.render(sc, cam); sc.overrideMaterial = null;
    world.forEach((x) => { x.visible = false; }); over.forEach((x) => { x.visible = true; }); sc.fog = fog; r.render(sc, cam);
    world.forEach((x) => { x.visible = true; }); r.autoClear = ac; sc.background = bg; r.shadowMap.autoUpdate = true; };
  return fin;
};

// ---------- a rich background ----------
const inkPine = (p: Vec3, s = 1, c = '#2f6b3a', seed = 1) => { const R = p3Rnd(seed), g = p3Group(p3Mesh(p3Cyl(0.09, 0.14, 0.9, 6), '#6b4426', { p: [0, 0.45, 0] })), mat = dioSmooth(c, 0.9);
  // 5 jagged tiers, each a cone with uneven, drooping tips
  for (let i = 0; i < 5; i++) { const r = 1.05 - i * 0.18, h = 0.9 - i * 0.07, geo = new THREE.ConeGeometry(r, h, 11, 1, true), pos = geo.attributes.position;
    for (let v = 0; v < pos.count; v++) if (pos.getY(v) < 0) { const k = 0.82 + R() * 0.35; pos.setX(v, pos.getX(v) * k); pos.setZ(v, pos.getZ(v) * k); pos.setY(v, pos.getY(v) - R() * 0.12); }
    geo.computeVertexNormals(); const m = p3Mesh(geo, mat, { p: [(R() - 0.5) * 0.06, 0.75 + i * 0.42, (R() - 0.5) * 0.06] }); m.rotation.y = R() * 3; g.add(m); }
  g.position.set(...p); g.scale.setScalar(s); g.rotation.z = (R() - 0.5) * 0.06; return g; };
// a bush: a cluster of soft lumps
const inkBush = (p: Vec3, s = 1, c = '#3f8c3a', seed = 2) => { const R = p3Rnd(seed), g = p3Group(), m = dioSmooth(c, 0.9);
  for (let i = 0; i < 6; i++) g.add(p3Mesh(new THREE.IcosahedronGeometry(0.35 + R() * 0.2, 2), m, { p: [(R() - 0.5) * 0.9, 0.3 + R() * 0.3, (R() - 0.5) * 0.6] }));
  g.position.set(...p); g.scale.setScalar(s); return g; };
// painted textures: flat colour with darker seams and brush marks (multiply with the material colour = white)
const inkTex = (kind: 'plaster' | 'tiles' | 'wood' | 'grass' | 'stone', base: string, rep: [number, number] = [1, 1]) => { const t = p3Paint(256, 256, (c) => {
    c.fillStyle = base; c.fillRect(0, 0, 256, 256); const R = p3Rnd(kind.length * 7);
    const dark = (a: number) => `rgba(60,30,20,${a})`, lite = (a: number) => `rgba(255,245,225,${a})`;
    if (kind === 'plaster') { const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, lite(0.25)); g.addColorStop(1, dark(0.12)); c.fillStyle = g; c.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 40; i++) { c.fillStyle = R() < 0.5 ? dark(0.05) : lite(0.08); c.beginPath(); c.ellipse(R() * 256, R() * 256, 10 + R() * 30, 3 + R() * 6, R() * 3, 0, 6.3); c.fill(); } }
    if (kind === 'tiles') for (let y = 0; y < 256; y += 32) { c.fillStyle = dark(0.35); c.fillRect(0, y + 28, 256, 4); for (let x = (y / 32) % 2 ? 0 : 16; x < 256; x += 32) { c.fillStyle = dark(0.25); c.fillRect(x, y, 3, 30); c.fillStyle = lite(0.18); c.fillRect(x + 4, y + 2, 24, 6); } }
    if (kind === 'wood') for (let y = 0; y < 256; y += 32) { c.fillStyle = dark(0.4); c.fillRect(0, y, 256, 3); for (let i = 0; i < 5; i++) { c.strokeStyle = dark(0.12); c.lineWidth = 1.5; c.beginPath(); const yy = y + 6 + R() * 22; c.moveTo(0, yy); c.bezierCurveTo(80, yy + (R() - 0.5) * 8, 170, yy + (R() - 0.5) * 8, 256, yy); c.stroke(); } }
    if (kind === 'grass') for (let i = 0; i < 260; i++) { const x = R() * 256, y = R() * 256; c.strokeStyle = R() < 0.5 ? dark(0.12) : lite(0.14); c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (R() - 0.5) * 6, y - 6 - R() * 8); c.stroke(); }
    if (kind === 'stone') for (let y = 0; y < 256; y += 42) for (let x = (y / 42) % 2 ? -30 : 0; x < 256; x += 60) { c.fillStyle = R() < 0.5 ? lite(0.12) : dark(0.08); c.fillRect(x + 3, y + 3, 54, 36); c.strokeStyle = dark(0.35); c.lineWidth = 3; c.strokeRect(x + 2, y + 2, 56, 38); }
  }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }); };
// twinkling star sparkles over an area (drawn on top, no ink); pose(t)
const inkSparkles = (n: number, x0: number, x1: number, z0: number, z1: number, y: number, seed = 5) => { const R = p3Rnd(seed), t = p3Paint(64, 64, (c) => { c.fillStyle = '#ffffff'; c.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, r = i % 2 ? 6 : 31; c.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } c.fill(); });
  const g = p3Group(), S = Array.from({ length: n }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.position.set(x0 + R() * (x1 - x0), y, z0 + R() * (z1 - z0)); g.add(s); return { s, ph: R() * 6.3, sp: 1.5 + R() * 2 }; });
  return Object.assign(g, { pose: (time: number) => S.forEach(({ s, ph, sp }) => { const k = Math.max(0, Math.sin(time * sp + ph)); s.scale.setScalar(0.001 + 0.22 * k * k); }) }); };
const inkPalm = (p: Vec3, s = 1) => { const g = p3Group(), trunk = dioSmooth('#9a7148', 0.8), leaf = dioSmooth('#3f9a3a', 0.7);
  g.add(p3Tube([[0, 0, 0], [0.15, 1.2, 0], [0.35, 2.4, 0.05], [0.55, 3.2, 0.1]], 0.12, trunk, 16));
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2, f = p3Mesh(new THREE.ConeGeometry(0.22, 1.7, 4), leaf, { p: [0.55 + Math.cos(a) * 0.7, 3.05, 0.1 + Math.sin(a) * 0.7] }); f.scale.set(1, 1, 0.25); f.lookAt(0.55 + Math.cos(a) * 2, 2.6, 0.1 + Math.sin(a) * 2); f.rotateX(Math.PI / 2); g.add(f); }
  g.position.set(...p); g.scale.setScalar(s); return g; };
const inkHedge = (p: Vec3, w: number, d = 0.6, h = 0.7) => p3Mesh(new THREE.RoundedBoxGeometry(w, h, d, 3, 0.22), dioSmooth('#3c8a3a', 0.9), { p: [p[0], p[1] + h / 2, p[2]] });
const inkLamp = (p: Vec3) => p3Group(p3Mesh(p3Cyl(0.04, 0.06, 1.8, 8), '#2a2a33', { p: [p[0], p[1] + 0.9, p[2]] }), p3Mesh(new THREE.SphereGeometry(0.16, 14, 10), new THREE.MeshBasicMaterial({ color: '#ffe3a1' }), { p: [p[0], p[1] + 1.88, p[2]] }));
const inkHills = (w: World, z = -40, c = ['#6f9a52', '#5e8a48', '#7fa95e']) => { [[-22, 9, 1], [-6, 12, 0], [14, 10, 2], [30, 8, 1]].forEach(([x, s, i]) => { const m = p3Mesh(new THREE.SphereGeometry(s, 24, 12), c[i], { p: [x, -s * 0.55, z - (i as number) * 3] }); m.scale.y = 0.55; w.add(m); }); };
const inkMountains = (w: World, z = -62) => { [[-28, 14], [-10, 18], [8, 15], [26, 19]].forEach(([x, h]) => { w.add(p3Mesh(new THREE.ConeGeometry(h * 0.9, h, 6), '#8d8fb8', { p: [x, h / 2 - 3, z] })); w.add(p3Mesh(new THREE.ConeGeometry(h * 0.28, h * 0.31, 6), '#f4f2ff', { p: [x, h - 3 - h * 0.155 + 0.02, z] })); }); };
// a two-storey mansion: main body, two wings, columns and a porch, a balcony, big windows (lit), hipped roofs, a chimney, steps
const inkMansion = (p: Vec3, ry = 0, s = 1) => { const g = p3Group(), wall = inkTex('plaster', '#f6e9d4'), trim = dioSmooth('#fffaf0', 0.6), roof = inkTex('tiles', '#b4584b', [3, 2]), glass = new THREE.MeshBasicMaterial({ color: '#ffd889' }), dark = dioSmooth('#4a3a2c', 0.8);
  const hip = (w: number, d: number, h: number, y: number, x = 0, z = 0) => { const geo = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1); geo.rotateY(Math.PI / 4); const m = p3Mesh(geo, roof, { p: [x, y + h / 2, z] }); m.scale.set(w * 1.08, h, d * 1.08); g.add(m); };
  const body = (w: number, h: number, d: number, x: number, z: number, floors: number) => { g.add(p3Mesh(p3Box(w, h, d), wall, { p: [x, h / 2, z] }));
    g.add(p3Mesh(p3Box(w + 0.12, 0.12, d + 0.12), trim, { p: [x, h, z] })); if (floors > 1) g.add(p3Mesh(p3Box(w + 0.06, 0.08, d + 0.06), trim, { p: [x, h / 2, z] }));
    for (let f = 0; f < floors; f++) for (let wx = -w / 2 + 0.7; wx <= w / 2 - 0.6; wx += 1.0) { const y = 0.95 + f * (h / floors);
      g.add(p3Mesh(p3Box(0.55, 0.85, 0.04), glass, { p: [x + wx, y, z + d / 2 + 0.02] })); g.add(p3Mesh(p3Box(0.7, 0.08, 0.1), trim, { p: [x + wx, y - 0.48, z + d / 2 + 0.04] })); } };
  body(6, 4.2, 3.6, 0, 0, 2); hip(6, 3.6, 1.6, 4.2); body(3, 3, 3, -4.4, 0.3, 1); hip(3, 3, 1.2, 3, -4.4, 0.3); body(3, 3, 3, 4.4, 0.3, 1); hip(3, 3, 1.2, 3, 4.4, 0.3);
  // porch: columns, a pediment, steps, door
  for (const x of [-1.4, -0.5, 0.5, 1.4]) g.add(p3Mesh(p3Cyl(0.13, 0.15, 2.1, 12), trim, { p: [x, 1.05, 2.35] }));
  g.add(p3Mesh(p3Box(3.6, 0.2, 1.2), trim, { p: [0, 2.2, 2.25] })); const ped = new THREE.ConeGeometry(1, 1, 3); ped.rotateZ(0); const pm = p3Mesh(ped, trim, { p: [0, 2.75, 2.3] }); pm.scale.set(2.0, 0.9, 0.25); g.add(pm);
  for (let i = 0; i < 3; i++) g.add(p3Mesh(p3Box(3.2 - i * 0.3, 0.14, 0.5), trim, { p: [0, 0.07 + i * 0.14, 3.15 - i * 0.3] }));
  g.add(p3Mesh(p3Box(0.9, 1.6, 0.06), dark, { p: [0, 0.8, 1.83] }));
  // balcony rail on the first floor
  for (let x = -1.6; x <= 1.6; x += 0.2) g.add(p3Mesh(p3Box(0.05, 0.4, 0.05), trim, { p: [x, 2.52, 2.8] })); g.add(p3Mesh(p3Box(3.4, 0.06, 0.08), trim, { p: [0, 2.74, 2.8] }));
  g.add(p3Mesh(p3Box(0.6, 1.4, 0.6), dioSmooth('#b9a48a', 0.9), { p: [1.8, 5.2, -0.6] }));
  // details: shutters, flower boxes under the ground-floor windows, a cornice band, a round window in the pediment
  const shut = dioSmooth('#3f6e58', 0.7), box = dioSmooth('#8a5a34', 0.8), fl = ['#ff5d8f', '#ffd23f', '#ff8a3d'];
  for (const [bx, bw, bz, bd, fls] of [[0, 6, 0, 3.6, 2], [-4.4, 3, 0.3, 3, 1], [4.4, 3, 0.3, 3, 1]] as const) for (let f = 0; f < fls; f++) for (let wx = -bw / 2 + 0.7; wx <= bw / 2 - 0.6; wx += 1.0) {
    const y = 0.95 + f * (fls > 1 ? 2.1 : 3), zf = bz + bd / 2 + 0.03; for (const s2 of [-1, 1]) g.add(p3Mesh(p3Box(0.16, 0.85, 0.04), shut, { p: [bx + wx + s2 * 0.38, y, zf] }));
    if (f === 0) { g.add(p3Mesh(p3Box(0.62, 0.14, 0.18), box, { p: [bx + wx, y - 0.55, zf + 0.08] })); for (let k = 0; k < 4; k++) g.add(p3Mesh(new THREE.SphereGeometry(0.06, 8, 6), fl[(k + Math.round(wx)) % 3], { p: [bx + wx - 0.21 + k * 0.14, y - 0.45, zf + 0.1] })); } }
  g.add(p3Mesh(p3Box(6.3, 0.18, 3.9), trim, { p: [0, 4.05, 0] }));
  g.add(p3Mesh(new THREE.CircleGeometry(0.22, 20), glass, { p: [0, 2.72, 2.47] }));
  g.position.set(...p); g.rotation.y = ry; g.scale.setScalar(s); return g; };

// a soft glow round the low sun (drawn on top, no ink)
const inkSunGlow = (p: Vec3, size = 30, color = '#ffd29a') => { const t = p3Paint(256, 256, (c) => { const g = c.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, '#ffffff'); g.addColorStop(0.08, color); g.addColorStop(0.35, color + '66'); g.addColorStop(1, color + '00'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); });
  t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })); s.position.set(...p); s.scale.setScalar(size); return s; };

// painted water: light at the far edge, deeper towards the viewer, with soft light streaks (transparent, drawn on top)
const inkWaterMat = (opacity = 0.86) => { const t = p3Paint(256, 256, (c) => { const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#c9f1ff'); g.addColorStop(0.5, '#7fd0f0'); g.addColorStop(1, '#3f9fd6'); c.fillStyle = g; c.fillRect(0, 0, 256, 256);
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 5; for (let i = 0; i < 7; i++) { c.beginPath(); const x = 20 + i * 36; c.moveTo(x, 256); c.lineTo(x + 70, 0); c.stroke(); } });
  t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity, depthWrite: false }); };

// foreground clutter for a building site: a wheelbarrow, cement sacks, a toolbox (r: turn)
const inkSiteProps = (p: Vec3, r = 0) => { const g = p3Group(), metal = dioSmooth('#d8553f', 0.6), dark = dioSmooth('#33363d', 0.6), sack = inkTex('plaster', '#e8dcc2');
  const tray = new THREE.CylinderGeometry(0.55, 0.32, 0.4, 4, 1, true); tray.rotateY(Math.PI / 4); tray.scale(1.4, 1, 1); const t = p3Mesh(tray, metal, { p: [0, 0.6, 0] }); (t.material as THREE.Material).side = THREE.DoubleSide; g.add(t);
  g.add(p3Mesh(new THREE.TorusGeometry(0.2, 0.06, 8, 16), dark, { p: [0.75, 0.22, 0], r: [0, Math.PI / 2, 0] }));
  for (const s of [-1, 1]) { g.add(p3Rod([0.5, 0.42, s * 0.3], [-0.9, 0.62, s * 0.36], 0.03, dioSmooth('#8a5a34', 0.7), 6)); g.add(p3Rod([-0.2, 0.42, s * 0.25], [-0.25, 0, s * 0.28], 0.03, dark, 6)); }
  for (const [x, z, ry] of [[-1.6, -0.9, 0.3], [-1.7, -1.6, -0.2], [-1.65, -1.25, 0.1]]) { const m = p3Mesh(new THREE.RoundedBoxGeometry(0.75, 0.24, 0.45, 2, 0.08), sack, { p: [x, x === -1.65 ? 0.36 : 0.12, z] }); m.rotation.y = ry; g.add(m); }
  g.add(p3Mesh(new THREE.RoundedBoxGeometry(0.6, 0.3, 0.3, 2, 0.04), dioSmooth('#2f5fb5', 0.5), { p: [-1.3, 0.15, 0.5] }));
  g.position.set(...p); g.rotation.y = r; return g; };
