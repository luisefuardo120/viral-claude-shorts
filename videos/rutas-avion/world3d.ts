// World of "¿Por qué los aviones no vuelan en línea recta en el mapa?" (3D, refined look like the reference train video):
// heroes smooth and rounded (lathe and bevelled shapes, smooth shading, environment light), ground with texture
// (striped grass, asphalt with grain), background low-poly and faceted (hills, trees). Prefix ra.

const RA = { sky: '#5bb8f5', white: '#f5f6f8', blue: '#1f5fd6', red: '#e5484d', window: '#1b2433', metal: '#c9ced8', grass: '#5cc24a' };

// smooth materials: the hero look (no flat shading)
const raSmooth = (c: string, rough = 0.45, metal = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: metal });
// a flat 2D outline extruded with rounded edges (wings, fins)
const raBevel = (pts: number[][], depth: number, bevel = 0.04) => {
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 12 });
  g.translate(0, 0, -depth / 2); g.computeVertexNormals(); return g;
};
// a body of revolution from [radius, y] points along its axis, turned so the axis is +x (nose at +x)
const raLathe = (profile: number[][], seg = 40) => {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg); g.rotateZ(-Math.PI / 2); g.computeVertexNormals(); return g;
};

// ---------- the airliner: original, generic (no airline livery) ----------
const raPlane = () => {
  const g = p3Group(), white = raSmooth(RA.white, 0.35);
  // fuselage: rounded nose, long tube, tail cone rising (profile: [radius, position along the axis])
  const P: number[][] = [[0, -5.75], [0.32, -5.5], [0.62, -4.9], [0.8, -4.1], [0.85, -3.2], [0.85, 2.5], [0.78, 4], [0.55, 5.2], [0.25, 6], [0, 6.2]];
  const body = new THREE.Mesh(raLathe(P), white); body.castShadow = true; g.add(body);
  // cockpit windows and the row of cabin windows, painted as a strip of rounded dark slots
  // u runs around the fuselage and v along it, so the slots are stacked along v
  const tex = p3Paint(64, 1024, (c) => { c.fillStyle = RA.white; c.fillRect(0, 0, 64, 1024); c.fillStyle = RA.window;
    for (let y = 30; y < 1000; y += 34) { c.beginPath(); c.roundRect(14, y, 36, 18, 8); c.fill(); } });
  for (const s of [1, -1]) {
    const strip = new THREE.Mesh(new THREE.CylinderGeometry(0.853, 0.853, 5.4, 40, 1, true, s > 0 ? 0.25 : Math.PI - 0.75, 0.5), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35 }));
    strip.rotation.z = Math.PI / 2; strip.position.x = -0.3; g.add(strip);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.856, 0.856, 5.6, 40, 1, true, s > 0 ? -0.12 : Math.PI + 0.02, 0.1), raSmooth(RA.blue, 0.4));
    band.rotation.z = Math.PI / 2; band.position.x = -0.35; g.add(band);
    g.add(p3Mesh(new THREE.SphereGeometry(0.16, 16, 10, 0, Math.PI), raSmooth(RA.window, 0.2), { p: [4.85, 0.3, s * 0.45], r: [0, s > 0 ? 0 : Math.PI, 0], s: [1.4, 0.6, 0.5] }));
  }
  // wings: swept, thin, bevelled; engines under them
  for (const s of [1, -1]) {
    const wing = new THREE.Mesh(raBevel([[0, 0], [1.4, 0], [-1.6, 5.6], [-2.3, 5.6]], 0.08, 0.05), white); wing.castShadow = true;
    wing.rotation.set(s * Math.PI / 2 + 0.06 * s, 0, 0); wing.position.set(0.6, -0.35, 0); g.add(wing);
    const tip = new THREE.Mesh(raBevel([[0, 0], [0.5, 0], [0.1, 0.7], [-0.2, 0.7]], 0.05, 0.03), raSmooth(RA.blue, 0.4));
    tip.position.set(-1.65, -0.35, s * 5.6); g.add(tip);
    const eng = new THREE.Mesh(raLathe([[0, -1.0], [0.3, -1.0], [0.36, -0.8], [0.44, 0.2], [0.44, 0.8], [0.4, 1.05], [0, 1.05]], 32), raSmooth('#dfe3ea', 0.3, 0.1));
    eng.castShadow = true; eng.position.set(1.0, -0.85, s * 2.3); g.add(eng);
    g.add(p3Mesh(new THREE.CircleGeometry(0.3, 24), raSmooth('#2a2f3a', 0.6), { p: [2.06, -0.85, s * 2.3], r: [0, Math.PI / 2, 0] }));
    g.add(p3Mesh(p3Box(0.9, 0.35, 0.08), white, { p: [0.75, -0.55, s * 2.3] }));
  }
  // tail: vertical fin in color, horizontal stabilizers
  const fin = new THREE.Mesh(raBevel([[0, 0], [1.8, 0], [-0.5, 2.6], [-1.2, 2.6]], 0.1, 0.05), raSmooth(RA.blue, 0.4)); fin.castShadow = true;
  fin.position.set(-4.0, 0.55, 0); g.add(fin);
  for (const s of [1, -1]) { const st = new THREE.Mesh(raBevel([[0, 0], [1.1, 0], [-0.4, 2.1], [-0.9, 2.1]], 0.06, 0.04), white); st.rotation.x = s * Math.PI / 2; st.position.set(-4.4, 0.25, 0); st.castShadow = true; g.add(st); }
  // landing gear
  const gear: THREE.Object3D[] = [];
  for (const [x, z] of [[3.9, 0], [-0.3, 0.75], [-0.3, -0.75]]) {
    const leg = p3Group(p3Mesh(p3Cyl(0.05, 0.05, 0.7, 10), raSmooth(RA.metal, 0.4, 0.4), { p: [0, -0.35, 0] }), p3Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 20), raSmooth('#22252c', 0.8), { p: [0, -0.72, 0], r: [Math.PI / 2, 0, 0] }));
    leg.position.set(x, -0.62, z); g.add(leg); gear.push(leg);
  }
  return Object.assign(g, { gear, height: 1.54 });   // height: from the wheels to the fuselage axis
};

// ---------- the airfield set ----------
const raGrassMat = () => p3Shader(new THREE.MeshStandardMaterial({ roughness: 0.95 }), 'ra-grass', { color: `
  float stripe = step(0.5, fract(p3World.x * 0.08)), n = p3F(p3World.xz * 0.6), fine = p3N(p3World.xz * 9.0);
  // linear color (the shader works before sRGB): #2f8a24 and #45a834
  diffuseColor.rgb = mix(vec3(0.028, 0.25, 0.018), vec3(0.06, 0.39, 0.034), stripe * 0.6 + n * 0.3) * (0.85 + fine * 0.25);` });
const raAsphaltMat = () => p3Shader(new THREE.MeshStandardMaterial({ roughness: 0.9 }), 'ra-asphalt', { bump: 0.015, color: `
  vec3 v = p3V(p3World.xz * 7.0); float n = p3F(p3World.xz * 1.5);
  diffuseColor.rgb = vec3(0.11, 0.12, 0.14) * (0.85 + v.z * 0.25 + n * 0.15); p3Ht = 1.0 - v.x;
  float side = abs(p3World.z), edge = step(3.7, side) * step(side, 3.9);
  float dash = step(abs(p3World.z), 0.12) * step(0.5, fract(p3World.x * 0.06));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95), max(edge, dash));` });
const raHill = (p: Vec3, s: number, c: string) => { const g = new THREE.IcosahedronGeometry(1, 1); g.scale(s * 1.6, s, s * 1.2); return p3Mesh(g, c, { p }); };   // faceted, like the reference
const raAirfield = () => {
  const g = p3Group();
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), raGrassMat()); grass.rotation.x = -Math.PI / 2; grass.receiveShadow = true; g.add(grass);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(400, 8), raAsphaltMat()); road.rotation.x = -Math.PI / 2; road.position.y = 0.02; road.receiveShadow = true; g.add(road);
  const R = p3Rnd(21), greens = ['#4caf3e', '#5cc24a', '#3f9a36', '#6acb55'];
  for (let i = 0; i < 9; i++) g.add(raHill([-70 + i * 18 + R() * 6, -2, -38 - R() * 14], 9 + R() * 7, greens[i % 4]));
  for (let i = 0; i < 16; i++) { const t = p3Group(p3Mesh(p3Cyl(0.15, 0.2, 0.9, 6), C3.trunk, { p: [0, 0.45, 0] }), p3Mesh(new THREE.IcosahedronGeometry(0.9, 0), greens[i % 4], { p: [0, 1.5, 0] }));
    t.position.set(-40 + i * 5.3 + R() * 2, 0, -14 - R() * 8); t.scale.setScalar(0.9 + R() * 0.8); g.add(t); }
  return g;
};
const raCloud = (p: Vec3, s = 1) => { const m = raSmooth('#ffffff', 0.9), g = p3Group(); for (const [x, y, z, r] of [[0, 0, 0, 1.4], [1.5, -0.25, 0.2, 1.05], [-1.4, -0.3, 0, 1.0], [0.4, 0.65, -0.3, 0.95]]) g.add(p3Mesh(new THREE.SphereGeometry(r, 24, 16), m, { p: [x, y, z] })); g.position.set(...p); g.scale.setScalar(s); return g; };
const raLights = (w: World) => {
  w.scene.environment = p3Env(w.renderer); w.scene.environmentIntensity = 0.35;   // soft reflections on the smooth heroes
  w.add(new THREE.HemisphereLight('#e8f4ff', '#4f7f35', 0.45));
  const sun = new THREE.DirectionalLight('#fff4e0', 1.5); sun.position.set(10, 18, 9); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.radius = 4;
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16 }); w.add(sun);
};

// ---------- world test shots ----------
defineVisuals({
  'test-quality': {
    bg: RA.sky,
    build(w) {
      raLights(w); w.add(raAirfield()); [[-8, 13, -30, 2], [9, 15, -36, 2.4]].forEach(([x, y, z, s]) => w.add(raCloud([x, y, z], s)));
      const plane = w.add(raPlane()); plane.position.set(0, plane.height + 0.08, 0);
      return (t) => { const u = p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0)), a = p3Lerp(0.9, 0.55, u); w.look([Math.cos(a) * 36, 5, Math.sin(a) * 36], [0, 2.4, 0], 34); };
    },
  },
  'test-low': {
    bg: RA.sky,
    build(w) {
      raLights(w); w.add(raAirfield()); w.add(raCloud([-4, 11, -26], 2));
      const plane = w.add(raPlane()); plane.position.set(0, plane.height + 0.08, 0);
      return () => { w.look([13, 1.4, 12], [2.5, 2.2, 0], 34); };
    },
  },
});
