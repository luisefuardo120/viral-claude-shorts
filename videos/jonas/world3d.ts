// World of "Jonás y el gran pez" (3D). Every piece is built once and posed from the time t. Prefix: jn.
// The shot builders (jnShot*) are the real scenes: visuals3d.ts maps each scene to one, and the world test uses them too.
const JN = {
  skin: '#b97b51', hair: '#3a281c', robe: '#c98b4f', sash: '#7d3a26', cloth: '#efe3c6', sandal: '#5a3a22',
  sailor: '#56708c', cap: '#b8432f',
  fin: '#264a63', mouth: '#7a1f2c',
  sail: '#efe4cc', stripe: '#b8432f',
  sky: '#9fd3f2', stormSky: '#2c3742', sea: '#1f8ec0', seaDeep: '#0d4f78', foam: '#d6f1fb', stormSea: '#2b4a5a', stormDeep: '#0d2230',
  under: '#0c4669', bellyBg: '#1a0709', bone: '#e2d2bb',
  sand: '#e4c690', city: '#d8b276', cityD: '#a87f4b', dawn: '#f2bf95', gold: '#ffd36e', red: '#e5484d',
};
let jnUid = 0;
const jnBg = (w: World) => w.scene.background as THREE.Color;
// deterministic camera shake
const jnShake = (t: number, a: number): Vec3 => [Math.sin(t * 13.1) * a + Math.sin(t * 7.3) * a * 0.6, Math.sin(t * 11.7 + 1) * a * 0.7, Math.sin(t * 9.4 + 2) * a * 0.5];

// ================= people =================
interface JnLook { robe: string; sash: string; cloth?: string; cap?: string }
interface JnPose { lift: number; lean: number; head: number; thL: number; thR: number; knL: number; knR: number; shLx: number; shLz: number; shRx: number; shRz: number; elL: number; elR: number }
const JN_JONAS: JnLook = { robe: JN.robe, sash: JN.sash, cloth: JN.cloth };
const JN_SAILOR: JnLook = { robe: JN.sailor, sash: '#2f3d4f', cap: JN.cap };
const JN_STAND: JnPose = { lift: 0, lean: 0, head: 0, thL: 0, thR: 0, knL: 0, knR: 0, shLx: 0.05, shLz: 0.12, shRx: 0.05, shRz: 0.12, elL: -0.15, elR: -0.15 };
const JN_POSES: Record<string, JnPose> = {
  stand: JN_STAND,
  scared: { ...JN_STAND, lean: -0.14, head: -0.2, thL: -0.15, knL: 0.2, shLx: -0.35, shLz: 2.3, shRx: -0.35, shRz: 2.3, elL: -1.1, elR: -1.1 },
  heart: { ...JN_STAND, lean: 0.12, head: 0.4, shRx: -0.55, shRz: -0.35, elR: -2.1 },
  pray: { ...JN_STAND, lift: -0.45, lean: 0.06, head: 0.3, knL: 1.57, knR: 1.57, shLx: -0.85, shLz: -0.32, shRx: -0.85, shRz: -0.32, elL: -1.45, elR: -1.45 },
  kneelPraise: { ...JN_STAND, lift: -0.45, lean: -0.08, head: -0.45, knL: 1.57, knR: 1.57, shLx: -0.3, shLz: 2.55, shRx: -0.3, shRz: 2.55, elL: -0.15, elR: -0.15 },
  praise: { ...JN_STAND, lean: -0.06, head: -0.4, shLx: -0.3, shLz: 2.55, shRx: -0.3, shRz: 2.55, elL: -0.15, elR: -0.15 },
  fall: { ...JN_STAND, head: -0.2, thL: -0.5, thR: 0.35, knL: 0.6, knR: 0.3, shLx: -0.5, shLz: 1.6, shRx: -0.2, shRz: 1.4, elL: -0.4, elR: -0.3 },
  float: { ...JN_STAND, head: -0.25, thL: -0.3, thR: 0.2, knL: 0.5, knR: 0.25, shLx: -0.25, shLz: 1.25, shRx: -0.15, shRz: 1.1, elL: -0.35, elR: -0.25 },
  point: { ...JN_STAND, shRx: -1.45, shRz: 0.05, elR: 0 },
};
const jnMix = (a: JnPose, b: JnPose, u: number): JnPose => { const o: any = {}; for (const k in a) o[k] = p3Lerp((a as any)[k], (b as any)[k], u); return o; };
// walking cycle from t
const jnWalk = (t: number): JnPose => {
  const a = Math.sin(t * 5.6), b = Math.cos(t * 5.6);
  return { ...JN_STAND, lift: -0.035 * Math.abs(b), lean: 0.05, thL: -0.42 * a, thR: 0.42 * a, knL: 0.15 + 0.5 * Math.max(0, b), knR: 0.15 + 0.5 * Math.max(0, -b), shLx: 0.35 * a, shRx: -0.35 * a, elL: -0.3, elR: -0.3 };
};
// a pose that follows a list of [time, state] steps, blending `blend` seconds into each one
const jnSteps = (t: number, steps: [number, JnPose | ((t: number) => JnPose)][], blend = 0.3): JnPose => {
  const get = (p: JnPose | ((t: number) => JnPose)) => typeof p === 'function' ? p(t) : p;
  let cur = get(steps[0][1]);
  for (let i = 1; i < steps.length; i++) { const [at, p] = steps[i]; if (t >= at) cur = jnMix(cur, get(p), p3Ramp(t, at, at + blend)); }
  return cur;
};

const jnPerson = (look: JnLook) => {
  const root = p3Group(), pelvis = p3Group(), torso = p3Group(), head = p3Group();
  root.add(pelvis); pelvis.add(torso);
  pelvis.add(p3Mesh(p3Cyl(0.22, 0.34, 0.62, 14), look.robe, { p: [0, -0.27, 0] }));                      // skirt of the robe
  torso.add(p3Mesh(p3Cyl(0.26, 0.2, 0.56, 14), look.robe, { p: [0, 0.28, 0] }));                         // chest wider than the waist
  torso.add(p3Mesh(p3Cyl(0.228, 0.228, 0.09, 14), look.sash, { p: [0, 0.04, 0] }));                      // sash
  torso.add(p3Mesh(p3Cyl(0.06, 0.075, 0.14, 8), JN.skin, { p: [0, 0.6, 0] }));                           // neck
  head.position.y = 0.76; torso.add(head);
  head.add(p3Mesh(p3Ball(0.15, 16, 12), JN.skin, { s: [1, 1.12, 1] }));
  head.add(p3Mesh(p3Ball(0.135, 12, 8), JN.hair, { p: [0, -0.07, 0.035], s: [1, 0.85, 0.85] }));        // beard
  head.add(p3Mesh(p3Cone(0.07, 0.14, 6), JN.hair, { p: [0, -0.2, 0.07], r: [Math.PI + 0.3, 0, 0] }));    // beard tip
  head.add(p3Mesh(p3Cone(0.028, 0.07, 5), JN.skin, { p: [0, 0.0, 0.16], r: [Math.PI / 2, 0, 0] }));      // nose
  for (const s of [1, -1]) {
    head.add(p3Mesh(p3Ball(0.024, 8, 6), '#1b1410', { p: [s * 0.055, 0.04, 0.135] }));                     // eyes
    head.add(p3Mesh(p3Box(0.06, 0.016, 0.02), JN.hair, { p: [s * 0.056, 0.085, 0.138], r: [0, 0, s * 0.12] }));   // brows
  }
  if (look.cloth) {
    head.add(p3Mesh(new THREE.SphereGeometry(0.168, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), look.cloth, { p: [0, 0.035, 0], s: [1, 1.25, 1] }));
    head.add(p3Mesh(p3Cyl(0.172, 0.172, 0.05, 16), look.sash, { p: [0, 0.07, 0] }));
    head.add(p3Mesh(p3Box(0.3, 0.34, 0.05), look.cloth, { p: [0, -0.1, -0.13], r: [0.15, 0, 0] }));     // cloth over the nape
  } else {
    head.add(p3Mesh(new THREE.SphereGeometry(0.158, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.42), JN.hair, { p: [0, 0.02, 0], s: [1, 1.15, 1] }));
    if (look.cap) head.add(p3Mesh(p3Cyl(0.13, 0.155, 0.1, 12), look.cap, { p: [0, 0.15, 0] }));
  }
  const arm = (s: number) => {
    const sh = p3Group(), el = p3Group(); sh.position.set(s * 0.29, 0.52, 0); torso.add(sh);
    sh.add(p3Mesh(p3Ball(0.085, 10, 8), look.robe));
    sh.add(p3Mesh(p3Cyl(0.078, 0.066, 0.34, 10), look.robe, { p: [0, -0.17, 0] }));
    el.position.y = -0.34; sh.add(el);
    el.add(p3Mesh(p3Ball(0.06, 8, 6), JN.skin));
    el.add(p3Mesh(p3Cyl(0.052, 0.044, 0.28, 8), JN.skin, { p: [0, -0.14, 0] }));
    el.add(p3Mesh(p3Ball(0.062, 8, 6), JN.skin, { p: [0, -0.31, 0.01], s: [0.85, 1.15, 0.7] }));
    return { sh, el };
  };
  const leg = (s: number) => {
    const hip = p3Group(), kn = p3Group(); hip.position.set(s * 0.11, 0, 0); pelvis.add(hip);
    hip.add(p3Mesh(p3Cyl(0.085, 0.068, 0.45, 10), look.robe, { p: [0, -0.225, 0] }));
    kn.position.y = -0.45; hip.add(kn);
    kn.add(p3Mesh(p3Ball(0.062, 8, 6), JN.skin));
    kn.add(p3Mesh(p3Cyl(0.058, 0.046, 0.42, 8), JN.skin, { p: [0, -0.21, 0] }));
    kn.add(p3Mesh(p3Box(0.11, 0.06, 0.25), JN.sandal, { p: [0, -0.44, 0.05] }));
    return { hip, kn };
  };
  const L = arm(1), R = arm(-1), LL = leg(1), RL = leg(-1);
  const pose = (p: JnPose) => {
    pelvis.position.y = 0.95 + p.lift; torso.rotation.x = p.lean; head.rotation.x = p.head;
    LL.hip.rotation.x = p.thL; RL.hip.rotation.x = p.thR; LL.kn.rotation.x = p.knL; RL.kn.rotation.x = p.knR;
    L.sh.rotation.set(p.shLx, 0, p.shLz); R.sh.rotation.set(p.shRx, 0, -p.shRz); L.el.rotation.x = p.elL; R.el.rotation.x = p.elR;
  };
  pose(JN_STAND);
  return Object.assign(root, { pose });
};

// ================= the great fish =================
const jnFish = () => {
  const L = 6, R = 2.1, prof = (x: number) => p3Clamp(1 - ((x - 0.3) / 1.3) ** 2);
  const skin = (x: number, y: number, z: number, jaw = 0): Vec3 => {
    const n = p3Fbm3(x * 0.7, y * 0.7, z * 0.7) - 0.5, belly = Math.max(jaw, p3Smoothstep(0.2, -1.0, y));
    const pleat = belly * (0.5 + 0.5 * Math.sin(z * 10)) * 0.16, spot = p3Smoothstep(0.64, 0.72, p3Noise3(x * 1.4 + 9, y * 1.4, z * 1.4)) * (1 - belly) * 0.22;
    const top: Vec3 = [0.19, 0.35, 0.48], low: Vec3 = [0.82, 0.88, 0.9];
    return [0, 1, 2].map((i) => p3Clamp(p3Lerp(top[i], low[i], belly) + n * 0.12 + spot - pleat)) as Vec3;
  };
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 });
  const body = p3Mesh(p3Blob((x, y, z) => {
    const k = 0.22 + 0.78 * Math.sqrt(prof(x)), cut = y < 0 ? 1 - 0.62 * p3Smoothstep(0.42, 0.85, x) : 1;
    return [x * L, y * R * k * cut, z * R * 1.05 * k];
  }, (x, y, z) => skin(x, y, z), 72, 44), mat);
  const jaw = p3Group(); jaw.position.set(2.5, -1.05, 0);
  jaw.add(p3Mesh(p3Blob((x, y, z) => [x * 1.75 + 1.6, y * (y > 0 ? 0.3 : 0.5), z * 1.4 * (1 - 0.25 * Math.max(0, x))], (x, y, z) => skin(x, y, z, 0.85), 40, 24), mat));
  const inside = p3Mesh(p3Ball(1, 16, 10), JN.mouth, { p: [4.2, -0.95, 0], s: [1.6, 0.45, 1.15], e: 0.15 });
  const tongue = p3Mesh(p3Ball(1, 12, 8), '#b04050', { p: [4.0, -1.25, 0], s: [1.1, 0.2, 0.8] });
  const light = new THREE.PointLight('#ffb35a', 0, 9, 1.5); light.position.set(4.6, -0.9, 0);
  const tail = p3Group(); tail.position.set(-5.6, 0.1, 0);
  tail.add(p3Mesh(p3Extruded([[0.3, 0], [-1.7, 2.1], [-1.2, 0.2], [-1.25, -0.2], [-1.7, -1.8]], 0.16), JN.fin));
  const dorsal = p3Mesh(p3Extruded([[0.6, 0], [-1.4, 0], [-1.0, 1.1]], 0.14), JN.fin, { p: [-0.2, 1.62, 0] });
  const fins = [1, -1].map((s) => { const f = p3Group(); f.position.set(2.2, -0.75, s * 1.55);
    f.add(p3Mesh(p3Extruded([[0.2, 0], [-1.5, -0.25], [-1.0, -0.95]], 0.1), JN.fin, { r: [s * 0.9, 0, 0] })); return f; });
  const eyes = [1, -1].map((s) => p3Group(p3Mesh(p3Ball(0.3, 14, 10), '#f2f2ea', { p: [0, 0, 0] }), p3Mesh(p3Ball(0.17, 12, 8), '#101418', { p: [0.06, 0.02, s * 0.2] })));
  eyes.forEach((e, i) => e.position.set(4.1, 0.5, (i ? -1 : 1) * 1.45));
  const g = p3Group(body, jaw, inside, tongue, light, tail, dorsal, ...fins, ...eyes);
  return Object.assign(g, {
    light,
    pose(t: number, open = 0, swim = 1) {
      tail.rotation.y = Math.sin(t * 2.6) * 0.38 * swim; body.rotation.y = -Math.sin(t * 2.6 - 0.8) * 0.03 * swim;
      fins.forEach((f, i) => { f.rotation.x = (i ? -1 : 1) * Math.sin(t * 2.2) * 0.2 * swim; });
      jaw.rotation.z = -0.58 * open; inside.visible = tongue.visible = open > 0.02;
    },
  });
};

// ================= boat =================
const jnWood = () => p3Shader(new THREE.MeshStandardMaterial({ roughness: 0.75 }), 'jn-wood', { bump: 0.02, color: `
  float plank = fract(p3Pos.y * 3.2 + floor(p3Pos.x * 0.6) * 0.37), seam = smoothstep(0.0, 0.06, plank) * smoothstep(1.0, 0.94, plank);
  float grain = p3F(vec2(p3Pos.x * 1.6, p3Pos.y * 26.0 + p3Pos.z * 3.0));
  diffuseColor.rgb = mix(vec3(0.22, 0.12, 0.05), mix(vec3(0.45, 0.27, 0.12), vec3(0.62, 0.4, 0.2), grain), seam); p3Ht = seam * 0.6 + grain * 0.3;` });
const jnBoat = () => {
  const wood = jnWood();
  const hull = p3Mesh(p3Extruded([[-3.3, 1.35], [-2.7, 0.95], [2.7, 0.95], [3.5, 1.55], [2.6, -0.15], [-2.5, -0.15]], 2.1), wood);
  const deck = p3Mesh(p3Box(5.3, 0.1, 1.95), wood, { p: [0, 0.92, 0] });
  const rails = [1, -1].map((s) => p3Mesh(p3Box(5.6, 0.12, 0.1), wood, { p: [0, 1.25, s * 1.0] }));
  const mast = p3Mesh(p3Cyl(0.08, 0.11, 4.6, 8), '#6b4526', { p: [0.3, 3.2, 0] });
  const yard = p3Mesh(p3Cyl(0.06, 0.06, 3.0, 8), '#6b4526', { p: [0.38, 5.05, 0], r: [Math.PI / 2, 0, 0] });
  const sail = p3Group(p3Mesh(p3Box(0.05, 2.7, 2.7), JN.sail), ...[0.55, -0.45].map((y) => p3Mesh(p3Box(0.06, 0.28, 2.72), JN.stripe, { p: [0, y, 0] })));
  sail.position.set(0.42, 3.6, 0);
  const g = p3Group(hull, deck, ...rails, mast, yard, sail);
  return Object.assign(g, {
    deckY: 0.97,
    pose(t: number, storm = 0, fill = 1) {
      const a = p3Lerp(0.03, 0.2, storm);
      g.rotation.z = Math.sin(t * 1.3) * a; g.rotation.x = Math.sin(t * 1.05 + 1) * a * 0.8;
      g.position.y = -0.55 + Math.sin(t * 1.5) * p3Lerp(0.08, 0.5, storm);
      sail.scale.x = 1 + 5 * fill; sail.position.x = 0.42 + 0.12 * fill;
    },
  });
};

// ================= Nineveh =================
const jnCity = () => {
  const mat = p3Mat(JN.city), dark = p3Mat(JN.cityD), g = p3Group();
  g.add(p3Mesh(p3Box(16, 2.2, 1.2), mat, { p: [0, 1.1, 0] }));
  for (let i = 0; i < 17; i++) g.add(p3Mesh(p3Box(0.5, 0.45, 1.25), mat, { p: [-8 + i, 2.42, 0] }));
  for (const x of [-8, -2.6, 2.6, 8]) { g.add(p3Mesh(p3Cyl(0.9, 1.0, 3.4, 10), dark, { p: [x, 1.7, 0.2] })); g.add(p3Mesh(p3Cyl(1.05, 1.05, 0.3, 10), mat, { p: [x, 3.5, 0.2] })); }
  g.add(p3Mesh(p3Box(1.8, 1.6, 0.2), '#3a2a1a', { p: [0, 0.8, 0.62] }));
  let zy = 0;   // the ziggurat: stacked tiers behind the wall
  for (const [i, [w, h]] of [[9, 2.2], [6.5, 1.8], [4, 1.6], [2, 1.2]].entries()) { g.add(p3Mesh(p3Box(w, h, w * 0.8), i % 2 ? dark : mat, { p: [1, zy + h / 2, -6] })); zy += h; }
  [[-5, 1.6, -3], [5.5, 2.4, -3.5], [-3, 3.0, -8]].forEach(([x, h, z]) => g.add(p3Mesh(p3Box(2.4, h, 2.4), dark, { p: [x, h / 2, z] })));
  return Object.assign(g, { glow(u: number) { for (const m of [mat, dark]) { m.emissive.set(JN.gold); m.emissiveIntensity = u * 0.45; } } });
};

// ================= effects =================
// a soft cone of light from the sky (God speaks or listens)
const jnBeam = (h = 16, r0 = 0.6, r1 = 2.4, color = JN.gold) => {
  const geo = new THREE.CylinderGeometry(r0, r1, h, 24, 1, true); geo.translate(0, h / 2, 0);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const m = new THREE.Mesh(geo, mat); m.rotation.x = Math.PI;
  return Object.assign(p3Group(m), { set(u: number) { mat.opacity = 0.32 * u; m.visible = u > 0.01; } });
};
// water drops thrown up in a parabola: .pose(t, t0, x, y, z)
const jnSplash = (n = 46) => {
  const r = p3Rnd(41), D = Array.from({ length: n }, () => [r() * 6.283, 1.2 + r() * 2.6, 4 + r() * 5, 0.08 + r() * 0.12]);
  const sw = p3Swarm(n, p3Ball(1, 6, 4), new THREE.MeshBasicMaterial({ color: '#eaf8ff' }));
  return Object.assign(sw, { pose(t: number, t0: number, x: number, y: number, z: number) {
    D.forEach(([a, sp, up, s], i) => { const k = t - t0; if (k < 0 || k > 1.3) { sw.hide(i); return; }
      const yy = y + up * k - 9 * k * k; if (yy < y - 0.4) { sw.hide(i); return; }
      sw.put(i, x + Math.cos(a) * sp * k, yy, z + Math.sin(a) * sp * k, s * (1 - k / 1.4)); });
    sw.done();
  } });
};
// rising bubbles in a box around the origin
const jnBubbles = (n = 90, w = 16, h = 22, y0 = -8) => {
  const r = p3Rnd(77), D = Array.from({ length: n }, () => [(r() - 0.5) * w, r() * h, (r() - 0.5) * w * 0.6, 0.05 + r() * 0.12, 0.8 + r()]);
  const sw = p3Swarm(n, p3Ball(1, 8, 6), new THREE.MeshBasicMaterial({ color: '#cdf3ff', transparent: true, opacity: 0.55 }));
  return Object.assign(sw, { pose(t: number) { D.forEach(([x, y, z, s, v], i) => sw.put(i, x + Math.sin(t * 2 + i) * 0.15, y0 + ((y + t * v * 1.6) % h), z, s)); sw.done(); } });
};

// ================= the sea surface (waves in a shader) =================
const jnWaveY = (x: number, z: number, t: number, amp: number) => (Math.sin(x * 0.32 + t * 1.2) * 0.55 + Math.sin(-z * 0.45 - t * 1.6 + x * 0.21) * 0.35) * amp;
const jnSea = (size = 240, seg = 150) => {
  const U = { uTime: { value: 0 }, uAmp: { value: 0.3 }, uDeep: { value: new THREE.Color(JN.seaDeep) }, uTop: { value: new THREE.Color(JN.sea) }, uFoam: { value: new THREE.Color(JN.foam) } };
  const mat = p3Shader(new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.28, metalness: 0.05 }), 'jn-sea-' + jnUid++, {
    uniforms: U,
    glsl: 'float jnW(vec2 p) { return (sin(p.x * 0.32 + uTime * 1.2) * 0.55 + sin(p.y * 0.45 - uTime * 1.6 + p.x * 0.21) * 0.35 + (p3N(p * 0.35 + uTime * 0.25) - 0.5) * 0.9) * uAmp; }',
    vertex: 'transformed.z += jnW(position.xy);',
    color: 'float h = jnW(p3Pos.xy) / max(uAmp, 0.001); diffuseColor.rgb = mix(uDeep, uTop, smoothstep(-0.9, 0.7, h)); diffuseColor.rgb = mix(diffuseColor.rgb, uFoam, smoothstep(0.8, 1.15, h) * 0.85);',
  });
  const m = p3Mesh(new THREE.PlaneGeometry(size, size, seg, seg), mat, { r: [-Math.PI / 2, 0, 0], shadow: false }); m.receiveShadow = true;
  return Object.assign(m, { pose(t: number, amp: number, storm = 0) {
    U.uTime.value = t; U.uAmp.value = amp;
    U.uTop.value.set(JN.sea).lerp(new THREE.Color(JN.stormSea), storm); U.uDeep.value.set(JN.seaDeep).lerp(new THREE.Color(JN.stormDeep), storm);
  } });
};

// ================= sets =================
// 1. open sea, from calm (storm 0) to a storm (storm 1) with rain and lightning
const jnSurface = (w: World) => {
  const hemi = new THREE.HemisphereLight('#e4f3ff', '#2a5a7a', 1.0), sun = new THREE.DirectionalLight('#fff4e0', 1.5);
  sun.position.set(-10, 16, 8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15 });
  w.add(hemi); w.add(sun);
  w.scene.fog = new THREE.Fog(JN.sky, 45, 150);
  const sea = w.add(jnSea());
  const cloudSpots: number[][] = [[-14, 13, -30, 2.2], [10, 15, -40, 2.8], [-30, 16, -55, 3.2], [26, 12, -35, 2.0], [0, 17, -60, 3.5]];
  const clouds = cloudSpots.map(([x, y, z, s]) => w.add(p3Cloud([x, y, z], s)));
  const cloudMats = clouds.flatMap((c) => c.children.map((m) => (m as THREE.Mesh).material as THREE.MeshStandardMaterial));
  const r = p3Rnd(5), drops = Array.from({ length: 320 }, () => [(r() - 0.5) * 34, r() * 16, (r() - 0.5) * 30]);
  const rain = w.add(p3Swarm(drops.length, p3Box(0.025, 0.7, 0.025), new THREE.MeshBasicMaterial({ color: '#c9d8e6', transparent: true, opacity: 0.55 })));
  const bp: number[][] = [[0, 0, 0]]; const rb = p3Rnd(9); for (let i = 1; i < 9; i++) bp.push([bp[i - 1][0] + (rb() - 0.5) * 2.4, -i * 2.2, (rb() - 0.5) * 0.8]);
  const bolt = w.add(p3Tube(bp, 0.12, new THREE.MeshBasicMaterial({ color: '#eef6ff' }), 40)); bolt.position.set(-9, 20, -26); bolt.castShadow = false;
  const sky = new THREE.Color(JN.sky), dark = new THREE.Color(JN.stormSky), flashC = new THREE.Color('#dfe9f5');
  return {
    sea, sun,
    // storm 0..1; flashAt: when the lightning strikes (or -1)
    pose(t: number, storm: number, flashAt = -1) {
      const k = t - flashAt, flash = flashAt < 0 || k < 0 ? 0 : Math.exp(-k * 9) + (k > 0.22 ? 0.7 * Math.exp(-(k - 0.22) * 11) : 0);
      sea.pose(t, p3Lerp(0.35, 1.5, storm), storm);
      jnBg(w).copy(sky).lerp(dark, storm).lerp(flashC, p3Clamp(flash * 0.8));
      (w.scene.fog as THREE.Fog).color.copy(jnBg(w)); (w.scene.fog as THREE.Fog).far = p3Lerp(150, 70, storm);
      hemi.intensity = p3Lerp(1.0, 0.55, storm) + flash * 2.2; sun.intensity = p3Lerp(1.5, 0.25, storm);
      cloudMats.forEach((m) => { m.color.set('#ffffff').lerp(new THREE.Color('#47525e'), storm); m.emissive.copy(m.color); });
      clouds.forEach((c, i) => { c.position.x = cloudSpots[i][0] + Math.sin(t * 0.2 + i) * 1.5 + t * (0.3 + storm); c.position.y = cloudSpots[i][1] - storm * 4; });
      rain.visible = storm > 0.2;
      drops.forEach(([x, y, z], i) => rain.put(i, x - ((t * 6) % 3), 16 - ((y + t * 22) % 16), z, 1, 1, 1, 0, 0, 0.2)); rain.done();
      bolt.visible = k >= 0 && k < 0.4 && flashAt >= 0;
    },
  };
};
// 2. under the sea
const jnUnder = (w: World) => {
  w.add(new THREE.HemisphereLight('#9fdcff', '#0a2a40', 1.25));
  const sun = new THREE.DirectionalLight('#d9f4ff', 1.2); sun.position.set(3, 20, 6); w.add(sun);
  w.scene.fog = new THREE.Fog(JN.under, 10, 55);
  w.add(p3Mesh(new THREE.PlaneGeometry(300, 300), p3Mat('#5fb9df', 0.6), { p: [0, 16, 0], r: [Math.PI / 2, 0, 0], shadow: false }));
  w.add(p3Ground('#3e6f73', -14));
  const rr = p3Rnd(3);
  for (let i = 0; i < 14; i++) w.add(p3Mesh(new THREE.IcosahedronGeometry(1 + rr() * 2.5, 0), '#2f5257', { p: [(rr() - 0.5) * 60, -13.5, -10 - rr() * 30] }));
  const rays = Array.from({ length: 7 }, (_, i) => { const b = jnBeam(34, 0.5, 2.6, '#bff0ff'); b.position.set(-18 + i * 6 + (rr() - 0.5) * 3, 16, -6 - rr() * 14); b.rotation.z = 0.18; return w.add(b); });
  const bubbles = w.add(jnBubbles());
  return { pose(t: number) { rays.forEach((b, i) => b.set(0.28 + 0.12 * Math.sin(t * 0.8 + i * 1.7))); bubbles.pose(t); } };
};
// 3. inside the fish
const jnBelly = (w: World) => {
  w.add(new THREE.HemisphereLight('#ff9a7a', '#2a0505', 0.55));
  const warm = new THREE.PointLight('#ffb07a', 14, 14, 1.6); warm.position.set(0, 1.4, 3.2); w.add(warm);
  w.scene.fog = new THREE.Fog(JN.bellyBg, 6, 22);
  const flesh = p3Shader(new THREE.MeshStandardMaterial({ side: THREE.BackSide, roughness: 0.45 }), 'jn-flesh', { bump: 0.05, color: `
    float n = p3F(vec2(p3Pos.x * 0.7, atan(p3Pos.z, p3Pos.y) * 3.0)), v = smoothstep(0.035, 0.0, abs(p3F(vec2(p3Pos.x * 0.35, atan(p3Pos.z, p3Pos.y) * 1.6)) - 0.5));
    diffuseColor.rgb = mix(vec3(0.32, 0.07, 0.08), vec3(0.62, 0.2, 0.2), n) * (1.0 - v * 0.45); p3Ht = n + v * 0.5;` });
  const tube = new THREE.CylinderGeometry(3.4, 3.4, 40, 32, 24, true); tube.rotateZ(Math.PI / 2);
  w.add(new THREE.Mesh(tube, flesh));
  for (let i = -6; i <= 6; i++) { const rib = p3Mesh(new THREE.TorusGeometry(3.2, 0.2, 8, 32, Math.PI * 1.45), JN.bone, { p: [i * 1.9, 0, 0], r: [0, Math.PI / 2, -Math.PI * 0.225] }); w.add(rib); }
  const floor = p3Mesh(new THREE.PlaneGeometry(40, 6), p3Std('#3a0f12', 0.12, 0.2), { p: [0, -1.8, 0], r: [-Math.PI / 2, 0, 0], shadow: false }); floor.receiveShadow = true; w.add(floor);
  const beam = w.add(jnBeam(6, 0.7, 1.5)); beam.position.set(0, 3.4, 0);
  const gold = new THREE.PointLight(JN.gold, 0, 10, 1.4); gold.position.set(0, 1.2, 0.8); w.add(gold);
  const r = p3Rnd(13), sp = Array.from({ length: 40 }, () => [(r() - 0.5) * 2.4, r() * 4, (r() - 0.5) * 2, 0.02 + r() * 0.04]);
  const sparks = w.add(p3Swarm(sp.length, p3Ball(1, 6, 4), new THREE.MeshBasicMaterial({ color: '#fff0b0' })));
  return { pose(t: number, heard: number) {
    beam.set(heard); gold.intensity = heard * 22; warm.intensity = 14 - heard * 4;
    sp.forEach(([x, y, z, s], i) => { if (heard < 0.05) sparks.hide(i); else sparks.put(i, x, -1.8 + ((y + t * 0.8) % 4), z, s * heard * (0.6 + 0.4 * Math.sin(t * 6 + i))); }); sparks.done();
  } };
};
// 4. the coast at dawn, with Nineveh far away (towards +x)
const jnPalm = (p: Vec3, s = 1, lean = 0.3) => {
  const trunkPts = [[0, 0, 0], [lean * 0.4, 1.6, 0], [lean * 1.2, 3.2, 0], [lean * 2.2, 4.6, 0]];
  const g = p3Group(p3Tube(trunkPts, 0.16, p3Mat('#8a6a45'), 16));
  const top = p3Group(); top.position.set(lean * 2.2, 4.6, 0); g.add(top);
  for (let i = 0; i < 7; i++) { const leaf = p3Mesh(p3Extruded([[0, 0], [1.2, 0.35], [2.4, -0.2], [1.3, -0.15]], 0.04), i % 2 ? '#3f8a3a' : '#4e9c43', { r: [Math.PI / 2, 0, 0] });
    const piv = p3Group(leaf); piv.rotation.set(0, (i / 7) * Math.PI * 2, -0.35); top.add(piv); }
  g.position.set(...p); g.scale.setScalar(s); return g;
};
const jnCoast = (w: World) => {
  w.add(new THREE.HemisphereLight('#ffe9d4', '#c99a6a', 1.05));
  const sun = new THREE.DirectionalLight('#ffd7a8', 1.7); sun.position.set(20, 9, 6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16 }); w.add(sun);
  w.scene.fog = new THREE.Fog(JN.dawn, 50, 170);
  const sand = p3Shader(new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true }), 'jn-sand', { bump: 0.02, color: `
    float n = p3F(p3World.xz * 0.35), rip = 0.5 + 0.5 * sin(p3World.x * 3.0 + n * 6.0);
    diffuseColor.rgb = mix(vec3(0.83, 0.68, 0.45), vec3(0.93, 0.8, 0.58), n) * (0.94 + rip * 0.06); p3Ht = rip * 0.4 + n;` });
  const ground = p3Mesh(new THREE.PlaneGeometry(500, 250), sand, { p: [0, 0.04, 121], r: [-Math.PI / 2, 0, 0], shadow: false }); ground.receiveShadow = true; w.add(ground);
  const sea = w.add(jnSea(300, 120)); sea.position.y = -0.1;
  w.add(p3Mesh(p3Ball(5, 24, 16), p3Mat('#ffe2a0', 1.2), { p: [170, 20, -15], shadow: false }));
  [[-3, 0, 9, 1.1, 0.35], [-8, 0, 12, 1.3, -0.25], [6, 0, 11, 1.0, 0.3], [-15, 0, 7, 0.9, 0.4], [14, 0, 16, 1.2, -0.3], [24, 0, 6, 1.1, 0.3]].forEach(([x, y, z, s, l]) => w.add(jnPalm([x, y, z], s, l)));
  const rr = p3Rnd(21); for (let i = 0; i < 10; i++) w.add(p3Mesh(new THREE.IcosahedronGeometry(0.3 + rr() * 0.6, 0), '#9a8a74', { p: [(rr() - 0.5) * 40, 0.1, -1 + rr() * 14] }));
  const city = w.add(jnCity()); city.position.set(85, 0, -8); city.rotation.y = -Math.PI / 2; city.scale.setScalar(1.3);
  for (let i = 0; i < 6; i++) w.add(p3Mesh(p3Cone(14 + i * 3, 7 + (i % 3) * 3, 6), '#d9a77a', { p: [120 + i * 12, 0, -40 + i * 26], shadow: false }));   // far hills
  return { city, sea, pose(t: number) { sea.pose(t, 0.18); } };
};

// ================= shots (the real scenes) =================
type JnShot = (w: World) => (t: number) => void;

// 1. hook: the great fish swims at us out of the deep; at "Jonás" its mouth opens with a warm light inside
const jnShotHook: JnShot = (w) => {
  const set = jnUnder(w), fish = w.add(jnFish());
  return (t) => {
    const u = p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0)), open = 0.75 * p3Ramp(t, w.K('name') - 0.1, w.K('name') + 0.35);
    set.pose(t); fish.pose(t, open);
    fish.position.set(p3Lerp(-7, -1, u), Math.sin(t * 1.1) * 0.3, 0); fish.rotation.set(0, 0.55, Math.sin(t * 0.9) * 0.04);
    fish.light.intensity = open * 30;
    w.look([p3Lerp(17, 14, u), p3Lerp(-1.0, -0.6, u), p3Lerp(15, 12.5, u)], [p3Lerp(-1.5, 0.5, u), -0.4, 0]);
  };
};
// 2. the call: a beam of light falls on Jonah; at "Nínive" a golden arrow points to the far city, which lights up
const jnShotCall: JnShot = (w) => {
  const set = jnCoast(w), jonah = w.add(jnPerson(JN_JONAS)), beam = w.add(jnBeam(18, 0.5, 1.6));
  const arrow = w.add(p3Arrow([0.8, 0.15, -0.1], [1, 0, -0.1], 5, JN.gold, 0.16));
  return (t) => {
    const c = w.K('city'), u = p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0));
    set.pose(t); set.city.glow(p3Ramp(t, c, c + 0.4));
    beam.set(p3Ramp(t, w.s.t0, w.s.t0 + 0.6) * (1 - 0.4 * p3Ramp(t, c, c + 0.5)));
    jonah.pose(jnSteps(t, [[0, { ...JN_STAND, head: -0.45 }], [c, JN_POSES.point]], 0.35));
    jonah.rotation.y = p3Lerp(-1.0, Math.PI / 2, p3Ramp(t, c - 0.2, c + 0.35));
    arrow.grow(p3Spring(t, c + 0.1, 160, 14));
    w.look([p3Lerp(-7.5, -6.8, u), 2.6, 1.2], [7, 0.3, -1.2]);
  };
};
// 3. the escape: the ship leaves with Jonah on board; at "contrario" a red arrow points away from Nineveh
const jnShotFlee: JnShot = (w) => {
  const set = jnSurface(w), boat = w.add(jnBoat()), jonah = jnPerson(JN_JONAS), city = w.add(jnCity());
  boat.add(jonah); jonah.position.set(-2.0, boat.deckY, 0.2); jonah.rotation.y = Math.PI / 2;
  boat.rotation.order = 'YXZ'; city.position.set(60, -0.5, -45); city.rotation.y = -0.9; city.scale.setScalar(1.6);
  const arrow = w.add(p3Arrow([0, 0.7, 2.4], [-1, 0, 0], 3.6, JN.red, 0.2));
  return (t) => {
    const u = p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0)), o = w.K('opposite');
    set.pose(t, 0); boat.pose(t, 0, p3Ramp(t, w.K('boat') - 0.2, w.K('boat') + 0.4)); boat.rotation.y = Math.PI;
    boat.position.x = -p3Ramp(t, w.K('boat'), w.s.t1 + 2) * 6;
    jonah.pose({ ...JN_POSES.scared, shLz: 0.4, shRz: 0.4, shLx: 0, shRx: 0, elL: -0.2, elR: -0.2, lean: 0, head: 0 });
    arrow.position.x = boat.position.x + 1.6; arrow.grow(p3Spring(t, o - 0.3, 160, 14));
    w.look([p3Lerp(-11, -13, u) + boat.position.x * 0.5, 4.2, 13], [boat.position.x + 0.5, 2.6, 0]);
  };
};
// 4. the storm: the sky turns dark, lightning at "tormenta", the sailors panic
const jnShotStorm: JnShot = (w) => {
  const set = jnSurface(w), boat = w.add(jnBoat());
  const crew = [[-1.6, 0.4, 0.4], [1.6, -0.4, -0.3], [-0.4, -0.5, 2.6]].map(([x, z, ry]) => { const p = jnPerson(JN_SAILOR); p.position.set(x, boat.deckY, z); p.rotation.y = ry; boat.add(p); return p; });
  return (t) => {
    const s = w.K('storm'), m = w.K('sailors'), storm = p3Ramp(t, w.s.t0, s + 0.3);
    set.pose(t, storm, s); boat.pose(t, storm, 1);
    crew.forEach((p, i) => p.pose(jnSteps(t, [[0, JN_STAND], [s + 0.15 + i * 0.1, JN_POSES.scared]], 0.25)));
    const sh = jnShake(t, 0.12 * storm);
    w.look([-10.5 + sh[0], 3.6 + sh[1], 12 + sh[2]], [0, 2.4, 0]);
  };
};
// 5. the guilt: Jonah puts a hand on his chest at "culpa" and jumps into the sea at "lanzaran"
const jnShotGuilt: JnShot = (w) => {
  const set = jnSurface(w), boat = w.add(jnBoat()), jonah = w.add(jnPerson(JN_JONAS)), splash = w.add(jnSplash());
  const crew = [[-1.7, -0.2], [-0.7, -0.5]].map(([x, z]) => { const p = jnPerson(JN_SAILOR); p.position.set(x, boat.deckY, z); p.rotation.y = 0.9; boat.add(p); return p; });
  return (t) => {
    const g = w.K('guilt'), th = w.K('throw'), land = th + 0.7;
    set.pose(t, 1); boat.pose(t, 1, 1);
    crew.forEach((p, i) => p.pose(jnSteps(t, [[0, JN_POSES.scared], [th - 0.2, { ...JN_POSES.scared, shLx: -1.4, shRx: -1.4, shLz: 0.2, shRz: 0.2, elL: 0, elR: 0 }]], 0.3)));
    const onDeck = new THREE.Vector3(1.8, boat.deckY, 0.4); boat.localToWorld(onDeck);
    const k = p3Clamp((t - th) / 0.7), jump = t >= th;
    if (!jump) { jonah.position.copy(onDeck); jonah.rotation.set(boat.rotation.x, 0.25, boat.rotation.z); }
    else { jonah.position.set(p3Lerp(onDeck.x, 3.0, k), p3Lerp(onDeck.y, -2.2, k) + 2.6 * k * (1 - k), p3Lerp(onDeck.z, 2.8, k)); jonah.rotation.set(k * 1.3, 0.25, -k * 0.4); }
    jonah.visible = k < 1;
    jonah.pose(jnSteps(t, [[0, JN_STAND], [g, JN_POSES.heart], [th - 0.1, JN_POSES.fall]], 0.3));
    splash.pose(t, land - 0.12, 3.0, 0.2, 2.8);
    const sh = jnShake(t, 0.07);
    w.look([1.2 + sh[0], 2.9 + sh[1], 10.5 + sh[2]], [1.5, 1.5, 0.5]);
  };
};
// 6. swallowed: Jonah sinks; the great fish rises from the deep and closes its mouth at "pez"
const jnShotSwallow: JnShot = (w) => {
  const set = jnUnder(w), fish = w.add(jnFish()), jonah = w.add(jnPerson(JN_JONAS));
  return (t) => {
    const gulp = w.K('gulp'), a = p3Ramp(t, w.s.t0, gulp), u = p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0));
    set.pose(t);
    const J = new THREE.Vector3(0, 1.8 - u * 1.2, 0);
    jonah.position.copy(J); jonah.rotation.set(0.25 + Math.sin(t * 1.3) * 0.1, 0.7, Math.sin(t * 0.9) * 0.15); jonah.pose(JN_POSES.float);
    jonah.visible = t < gulp + 0.12;
    const open = Math.min(p3Ramp(t, w.s.t0, w.s.t0 + 0.8), 1 - p3Ramp(t, gulp, gulp + 0.3));
    fish.pose(t, open); fish.rotation.set(0, 0.5, 0.18 * (1 - a));
    const mouth = new THREE.Vector3(4.6, -0.9, 0).applyEuler(fish.rotation);
    fish.position.set(J.x - mouth.x - p3Lerp(9, 0, a), J.y - mouth.y - p3Lerp(5, 0, a), J.z - mouth.z + p3Lerp(-3, 0, a));
    w.look([p3Lerp(8, 7, u), p3Lerp(1.0, 0.4, u), 11], [-0.8, 0.6 - u * 0.8, 0]);
  };
};
// 7. in the dark: Jonah kneels and prays; at "Dios" a golden beam answers
const jnShotBelly: JnShot = (w) => {
  const set = jnBelly(w), jonah = w.add(jnPerson(JN_JONAS));
  jonah.position.set(0, -1.85, 0);
  return (t) => {
    const p = w.K('pray'), h = w.K('heard'), u = p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0));
    set.pose(t, p3Ramp(t, h - 0.1, h + 0.4));
    jonah.pose(jnSteps(t, [[0, { ...JN_POSES.pray, head: 0.55, lean: 0.25 }], [p, JN_POSES.pray], [h + 0.1, JN_POSES.kneelPraise]], 0.35));
    w.look([p3Lerp(1.6, 0.8, u), -0.5, p3Lerp(6.2, 4.9, u)], [0, -0.85, 0]);
  };
};
// 8. the third day: the fish reaches the beach and lets Jonah out at "dejó"
const jnShotShore: JnShot = (w) => {
  const set = jnCoast(w), fish = w.add(jnFish()), jonah = w.add(jnPerson(JN_JONAS));
  fish.rotation.y = -Math.PI / 2 + 0.2; fish.position.set(-2.2, -0.35, -10.2);
  return (t) => {
    const o = w.K('out'), u = p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0)), k = p3Clamp((t - o) / 0.65);
    set.pose(t); fish.pose(t, Math.min(p3Ramp(t, o - 0.5, o - 0.05), 1 - p3Ramp(t, o + 0.5, o + 0.9)), 0.4);
    const mouth = new THREE.Vector3(4.8, -0.9, 0).applyEuler(fish.rotation).add(fish.position);
    jonah.visible = t >= o;
    jonah.position.set(p3Lerp(mouth.x, -0.6, k), p3Lerp(mouth.y, 0.04, k) + 2.4 * k * (1 - k), p3Lerp(mouth.z, -1.2, k));
    jonah.rotation.set((1 - k) * -1.2, 0.5, 0);
    jonah.pose(jnSteps(t, [[0, JN_POSES.fall], [o + 0.55, JN_POSES.pray], [o + 1.0, JN_POSES.kneelPraise]], 0.3));
    w.look([p3Lerp(2.6, 2.0, u), 3.4, p3Lerp(8.5, 7.5, u)], [-1.0, 1.0, -4.0]);
  };
};
// 9. the lesson: Jonah walks to Nineveh; at "nunca" the light falls on him and the city glows
const jnShotLesson: JnShot = (w) => {
  const set = jnCoast(w), jonah = w.add(jnPerson(JN_JONAS)), beam = w.add(jnBeam(18, 0.5, 1.6));
  return (t) => {
    const n = w.K('never'), lt = t - w.s.t0, x = lt * 1.15;
    set.pose(t); set.city.glow(0.3 + 0.7 * p3Ramp(t, n, n + 0.4));
    jonah.position.set(x, 0, 0.5); jonah.rotation.y = Math.PI / 2; jonah.pose(jnWalk(t));
    beam.position.set(x, 0, 0.5); beam.set(p3Ramp(t, n - 0.1, n + 0.35));
    w.look([x - 7, 2.6, 1.8], [x + 6, 0.3, -0.4]);
  };
};
// 10. follow: wide crane up over the beach; Jonah praises facing the sunrise, the fish swims away
const jnShotFollow: JnShot = (w) => {
  const set = jnCoast(w), jonah = w.add(jnPerson(JN_JONAS)), fish = w.add(jnFish());
  return (t) => {
    const lt = t - w.s.t0, u = p3Clamp(lt / (w.s.t1 - w.s.t0));
    set.pose(t); set.city.glow(1);
    jonah.position.set(0, 0, 0.5); jonah.rotation.y = 1.2; jonah.pose(jnSteps(t, [[0, JN_STAND], [w.s.t0 + 0.2, JN_POSES.praise]], 0.4));
    fish.pose(t, 0, 1); fish.rotation.y = 0.1; fish.position.set(24 + lt * 2.5, -0.9, -9);
    w.look([p3Lerp(-6, -8.5, u), p3Lerp(2.4, 3.4, u), p3Lerp(2.6, 3.6, u)], [p3Lerp(6, 8, u), 0.3, p3Lerp(-1, -1.2, u)]);
  };
};

// ================= world test shots =================
// Jonah through every state, front three-quarter, on plain sand
const jnTestStage = (w: World) => { p3Lights(w, '#fff4e4', '#c99a6a'); w.add(p3Ground(JN.sand)); };
const JN_TEST_ORDER: (JnPose | ((t: number) => JnPose))[] = [JN_STAND, jnWalk, JN_POSES.scared, JN_POSES.heart, JN_POSES.pray, JN_POSES.kneelPraise, JN_POSES.praise, JN_POSES.fall, JN_POSES.float, JN_POSES.point];
defineVisuals({
  'test-jonah': { bg: JN.dawn, build(w) {
    jnTestStage(w); const p = w.add(jnPerson(JN_JONAS));
    return (t) => { const lt = t - w.s.t0; p.pose(jnSteps(lt, JN_TEST_ORDER.map((s, i) => [i, s] as [number, any]), 0.25)); p.rotation.y = 0.5; w.look([3.2, 1.6, 4.2], [0, 1.05, 0]); };
  } },
  'test-jonah-side': { bg: JN.dawn, build(w) {
    jnTestStage(w); const a = w.add(jnPerson(JN_JONAS)), b = w.add(jnPerson(JN_SAILOR));
    a.position.x = -0.7; b.position.x = 0.7; a.rotation.y = b.rotation.y = Math.PI / 2;
    return (t) => { const lt = t - w.s.t0; a.pose(lt < 1 ? jnWalk(t) : JN_POSES.pray); b.pose(lt < 1 ? JN_POSES.scared : jnWalk(t)); w.look([0, 1.3, 5.2], [0, 0.95, 0]); };
  } },
  'test-fish': { bg: JN.under, build(w) {
    const set = jnUnder(w), f = w.add(jnFish());
    return (t) => { const lt = t - w.s.t0; set.pose(t); f.pose(t, lt < 1 ? 0 : lt < 2 ? 1 : 0.5); f.light.intensity = lt > 2 ? 20 : 0;
      const a = lt < 1 ? 1.4 : lt < 2 ? 0.9 : 0.35; w.look([Math.sin(a) * 17, 0.5, Math.cos(a) * 17], [0.5, -0.3, 0]); };
  } },
  'test-hook': { bg: JN.under, build: jnShotHook },
  'test-call': { bg: JN.dawn, build: jnShotCall },
  'test-flee': { bg: JN.sky, build: jnShotFlee },
  'test-storm': { bg: JN.sky, build: jnShotStorm },
  'test-guilt': { bg: JN.stormSky, build: jnShotGuilt },
  'test-swallow': { bg: JN.under, build: jnShotSwallow },
  'test-belly': { bg: JN.bellyBg, build: jnShotBelly },
  'test-shore': { bg: JN.dawn, build: jnShotShore },
  'test-lesson': { bg: JN.dawn, build: jnShotLesson },
  'test-follow': { bg: JN.dawn, build: jnShotFollow },
});
