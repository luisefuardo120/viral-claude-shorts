// World of "De hoyo a río lento" (3D cutaway diorama + a 2D Toon worker, same look as hoyo-piscina).
// The backyard is a block of land cut open at the front (z = 0). The river is a ring with soft curves, centred on the cut,
// so the cut shows it twice in section (left and right channel) with the island in between. Prefix hp/hr. Sources: fuentes.md.

const HRC = { sky: '#5bb8f5', soil: '#a0612e', soilD: '#7a4520', rebar: '#c0532a', pipe: '#f5f6f8', concrete: '#9aa0aa', plaster: '#dff4ff', water: '#2f9be8', key: '#b6f23c', red: '#ff4b4b', yellow: '#ffd23f', coping: '#f2ece0' };
const HR_D = 1.0, HR_T = 0.15, HR_H = 4;          // river 1 m deep, concrete 15 cm, land block 4 m
const HR_OUT = [3.0, 6.0, 2.4], HR_IN = [1.0, 4.0, 0.9], HR_MID = [2.0, 5.0, 1.65];   // [half width at the cut, length back, corner radius]
const HR_WORKER: Toon.Outfit = { jacket: '#ff8a1f', pants: '#2f5fb5', boots: '#3a2a1e', hat: 'cap', cap: '#1f5fd6' };

// half of a rounded rectangle, from (-W, 0) round the back to (W, 0); in shape coords (x, y = -z)
const hrCurve = ([W, L, R]: number[], n = 10) => { const p: THREE.Vector2[] = [new THREE.Vector2(-W, 0), new THREE.Vector2(-W, L - R)];
  for (let i = 1; i <= n; i++) { const a = Math.PI - (i / n) * Math.PI / 2; p.push(new THREE.Vector2(-W + R + R * Math.cos(a), L - R + R * Math.sin(a))); }
  for (let i = 0; i <= n; i++) { const a = Math.PI / 2 - (i / n) * Math.PI / 2; p.push(new THREE.Vector2(W - R + R * Math.cos(a), L - R + R * Math.sin(a))); }
  p.push(new THREE.Vector2(W, 0)); return p; };
const hrOff = ([W, L, R]: number[], d: number) => [W + d, L + d, Math.max(0.05, R + d)];
// the band between two half curves (a outside, b inside)
const hrBand = (a: number[], b: number[]) => new THREE.Shape([...hrCurve(a), ...hrCurve(b).reverse()]);
// a flat shape extruded up from y0 by h, laid in the ground plane (shape y -> -z)
const hrExtrude = (s: THREE.Shape, h: number, mat: THREE.Material | THREE.Material[]) => { const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 4 }); g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m; };
// the centreline of the channel, for the current and the float (u 0..1 from the left cut, round the back, to the right cut)
const hrPath = new THREE.CatmullRomCurve3(hrCurve(HR_MID, 8).map((v) => new THREE.Vector3(v.x, 0, -v.y)));

const hrGrassMat = () => p3Shader(new THREE.MeshStandardMaterial({ roughness: 0.95 }), 'hp-grass', { color: `
  float stripe = step(0.5, fract(p3World.x * 0.35)), n = p3F(p3World.xz * 0.8);
  diffuseColor.rgb = mix(vec3(0.03, 0.25, 0.02), vec3(0.06, 0.38, 0.03), stripe * 0.55 + n * 0.35);` });


const hrSoilFace = () => { const t = dioSoil(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 9, -1 / HR_H); t.offset.set(0, 1 / HR_H); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }); };
// the land: the yard round the ring, the island in the middle, and the soil still in the channel (dig 0..1 takes it out)
const hrYard = () => { const g = p3Group(), grass = hrGrassMat(), soilF = hrSoilFace(), mats = [grass, soilF];
  const yardS = new THREE.Shape([new THREE.Vector2(-7, 0), ...hrCurve(HR_OUT), new THREE.Vector2(7, 0), new THREE.Vector2(7, 14), new THREE.Vector2(-7, 14)]);
  const yard = hrExtrude(yardS, HR_H, mats), island = hrExtrude(new THREE.Shape(hrCurve(HR_IN)), HR_H, mats), fill = hrExtrude(hrBand(HR_OUT, HR_IN), HR_H, [dioSmooth('#8a5228', 0.95), soilF]);   // dirt on top: the ring to dig shows from above
  [yard, island, fill].forEach((m) => { m.position.y = -HR_H; g.add(m); });
  const pile = p3Mesh(new THREE.IcosahedronGeometry(1, 1), dioSmooth(HRC.soil, 0.95), { p: [4.6, 0, -5] }); pile.scale.set(1.0, 0.6, 1.4); g.add(pile);
  const pose = (dig: number) => { const d = HR_D * p3Clamp(dig) + 0.001; fill.scale.y = (HR_H - d) / HR_H; pile.visible = dig > 0.05; pile.scale.y = 0.6 * p3Clamp(dig); };
  pose(0); return Object.assign(g, { pose }); };
// concrete (or, painted, the light-blue finish): the floor and the two walls of the channel; u 0..1 sprays it up from the floor
const hrShell = () => { const conc = p3Shader(new THREE.MeshStandardMaterial({ roughness: 0.95 }), 'hr-conc', { bump: 0.02, color: `
    float n = p3F(p3World.xz * 6.0 + p3World.y * 4.0); diffuseColor.rgb = vec3(0.32, 0.34, 0.37) * (0.85 + n * 0.3); p3Ht = n;` }), paint = dioSmooth(HRC.plaster, 0.35);
  const floor = hrExtrude(hrBand(HR_OUT, HR_IN), HR_T, conc), outer = hrExtrude(hrBand(HR_OUT, hrOff(HR_OUT, -HR_T)), HR_D, conc), inner = hrExtrude(hrBand(hrOff(HR_IN, HR_T), HR_IN), HR_D, conc);
  const coping = [hrExtrude(hrBand(hrOff(HR_OUT, 0.25), HR_OUT), 0.06, dioSmooth(HRC.coping, 0.6)), hrExtrude(hrBand(HR_IN, hrOff(HR_IN, -0.25)), 0.06, dioSmooth(HRC.coping, 0.6))];
  const g = p3Group(floor, outer, inner, ...coping); floor.position.y = outer.position.y = inner.position.y = -HR_D; coping.forEach((c) => { c.position.y = 0; });
  const pose = (u: number, painted = 0) => { g.visible = u > 0.01; const k = Math.max(0.001, p3Clamp(u)); outer.scale.y = inner.scale.y = k; [floor, outer, inner].forEach((m) => { m.material = painted > 0.5 ? paint : conc; }); coping.forEach((c) => { c.visible = painted > 0.5; }); };
  pose(0); return Object.assign(g, { pose }); };
// the steel cage: a red grid on the floor and the walls; u 0..1 raises it
const hrRebar = () => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d')!; c.strokeStyle = HRC.rebar; c.lineWidth = 7; c.strokeRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2.5, 2.5); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.3 });
  const floor = hrExtrude(hrBand(hrOff(HR_OUT, -0.1), hrOff(HR_IN, 0.1)), 0.01, mat), outer = hrExtrude(hrBand(hrOff(HR_OUT, -0.08), hrOff(HR_OUT, -0.1)), HR_D - 0.1, mat), inner = hrExtrude(hrBand(hrOff(HR_IN, 0.1), hrOff(HR_IN, 0.08)), HR_D - 0.1, mat);
  const g = p3Group(floor, outer, inner); floor.position.y = -HR_D + 0.07; outer.position.y = inner.position.y = -HR_D + 0.07;
  return Object.assign(g, { pose: (u: number) => { g.visible = u > 0.01; outer.scale.y = inner.scale.y = Math.max(0.001, p3Clamp(u)); } }); };
// grates on the floor, pipes under it to a pump on the right; jets on the outer wall pointing downstream
const HR_GRATES = [0.12, 0.5, 0.88], HR_JETS = [0.06, 0.3, 0.55, 0.78];
const hrPump = () => { const g = p3Group(), pm = dioSmooth(HRC.pipe, 0.4), parts: THREE.Object3D[] = [], add = (o: THREE.Object3D) => { g.add(o); parts.push(o); };
  const pump: Vec3 = [5.2, 0.3, -3.2];
  HR_GRATES.forEach((u) => { const p = hrPath.getPointAt(u); add(p3Mesh(p3Box(0.6, 0.04, 0.6), dioSmooth('#1d222b', 0.6), { p: [p.x, -HR_D + HR_T + 0.02, p.z] }));
    add(p3Tube([[p.x, -HR_D - 0.2, p.z], [p.x, -HR_D - 0.45, p.z], [pump[0] - 0.4, -HR_D - 0.45, pump[2]], [pump[0] - 0.4, 0.1, pump[2]]], 0.08, pm, 24)); });
  add(p3Group(p3Mesh(new THREE.RoundedBoxGeometry(0.9, 0.7, 0.7, 2, 0.06), dioSmooth('#2f5fb5', 0.5), { p: pump }), p3Mesh(p3Cyl(0.18, 0.18, 0.5, 16), dioSmooth('#c9ced8', 0.4, 0.4), { p: [pump[0], pump[1] + 0.55, pump[2]] })));
  const jets = HR_JETS.map((u) => { const p = hrPath.getPointAt(u), n = new THREE.Vector3(p.x, 0, p.z + 3).normalize(), at = p.clone().addScaledVector(n, 0.85); at.y = -HR_D * 0.45;
    const tan = hrPath.getTangentAt(u), m = p3Mesh(p3Cyl(0.07, 0.1, 0.25, 12), dioSmooth('#2a2f3a', 0.5), { p: [at.x, at.y, at.z] }); m.lookAt(at.clone().add(tan)); m.rotateX(Math.PI / 2); add(m); return { at, tan }; });
  return Object.assign(g, { jets, pose: (u: number) => parts.forEach((o, i) => { o.visible = i / parts.length < u + 0.01; }) }); };
// water in the channel (fill 0..1)
const hrWater = () => { const mat = new THREE.MeshStandardMaterial({ color: HRC.water, transparent: true, opacity: 0.72, roughness: 0.15, depthWrite: false }), m = hrExtrude(hrBand(hrOff(HR_OUT, -HR_T), hrOff(HR_IN, HR_T)), 1, mat); m.renderOrder = 5;
  const lev = (fill: number) => (HR_D - HR_T - 0.15) * p3Clamp(fill);
  return Object.assign(m, { lev, pose: (t: number, fill: number) => { m.visible = fill > 0.01; m.scale.y = Math.max(0.001, lev(fill)); m.position.y = -HR_D + HR_T + 0.003 * Math.sin(t * 2); } }); };
// the current: white streaks along the channel (speed 0 = still), and fast streaks out of each jet
const hrFlow = () => { const N = 70, sw = p3Swarm(N + 32, new THREE.SphereGeometry(0.07, 6, 4), new THREE.MeshBasicMaterial({ color: '#e9f8ff', transparent: true, opacity: 0.85 })), R = p3Rnd(11), P = Array.from({ length: N }, () => [R(), (R() - 0.5) * 1.3, R()]);
  return Object.assign(sw, { pose: (t: number, y: number, speed: number, jets: { at: THREE.Vector3; tan: THREE.Vector3 }[], jetOn: number) => {
    P.forEach(([u0, side, ph], i) => { if (y < -HR_D + 0.2 || speed < 0.05) { sw.hide(i); return; } const u = (u0 + t * speed * 0.06) % 1, p = hrPath.getPointAt(u), tn = hrPath.getTangentAt(u), nx = new THREE.Vector3(-tn.z, 0, tn.x);
      p.addScaledVector(nx, side * 0.6); sw.put(i, p.x, y + 0.02, p.z, speed > 0.05 ? 0.7 + 0.3 * Math.sin(ph * 9 + t * 4) : 0.5); });
    for (let k = 0; k < 32; k++) { const j = jets[k % jets.length]; if (!j || jetOn < 0.05) { sw.hide(N + k); continue; } const u = (t * 2.2 + k * 0.137) % 1, p = j.at.clone().addScaledVector(j.tan, 0.15 + u * 1.8); sw.put(N + k, p.x, p.y, p.z, jetOn * (1.3 - u)); }
    sw.done(); } }); };
// the backdrop: house, fence, trees, clouds, sun
const hrBackdrop = (w: World) => {
  const h = dioHouse([-1.5, 0, -12.2], 0, 1.3); w.add(h);
  for (let x = -6.5; x <= 6.5; x += 0.6) { w.add(p3Mesh(p3Box(0.08, 0.9, 0.06), dioSmooth('#f5f6f8', 0.6), { p: [x, 0.45, -9.4] })); }
  for (const y of [0.35, 0.7]) w.add(p3Mesh(p3Box(13.2, 0.06, 0.05), dioSmooth('#f5f6f8', 0.6), { p: [0, y, -9.42] }));
  for (const [x, z, s, c] of [[3.6, -11, 1.5, '#4caf3e'], [5.2, -8, 1.1, '#5cc24a'], [-4.8, -8.5, 1.3, '#3f9a36']] as const) w.add(dioTree([x, 0, z], s, c));
  [[-6, 9, -16, 1.6], [7, 10, -18, 2]].forEach(([x, y, z, s]) => w.add(dioCloud([x, y, z], s))); const sun = w.add(dioSun()); sun.position.set(8, 10, -20); sun.scale.setScalar(0.6);
};


// the concrete gun's spray: grey particles from the nozzle to a point on the shell (a loop)
const hrSpray = () => { const sw = p3Swarm(60, new THREE.SphereGeometry(0.035, 6, 4), dioSmooth('#8a9099', 0.9)), R = p3Rnd(3), P = Array.from({ length: 60 }, () => [R(), (R() - 0.5) * 0.4, (R() - 0.5) * 0.4]);
  return Object.assign(sw, { pose: (t: number, a: THREE.Vector3, b: THREE.Vector3, on: number) => { P.forEach(([ph, dx, dz], i) => { if (on < 0.02) { sw.hide(i); return; } const u = (t * 2.5 + ph) % 1, p = a.clone().lerp(b, u); sw.put(i, p.x + dx * u, p.y + Math.sin(u * 3) * 0.1, p.z + dz * u, on); }); sw.done(); } }); };
// a 3D tool held by the worker (shovel or hose nozzle), drawn at his hand
const hrShovel = () => p3Group(p3Mesh(p3Cyl(0.025, 0.025, 1.1, 8), dioSmooth('#8a5a3b', 0.7), { p: [0, 0.55, 0] }), p3Mesh(new THREE.RoundedBoxGeometry(0.26, 0.32, 0.03, 2, 0.02), dioSmooth('#9aa3b0', 0.4, 0.5), { p: [0, -0.1, 0] }));
const hrHose = () => p3Group(p3Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.5, 12), dioSmooth('#2a2f3a', 0.5), { r: [0, 0, Math.PI / 2] }), p3Tube([[-0.25, 0, 0], [-0.8, -0.5, 0.4], [-1.6, -0.2, 1.2], [-3, 0, 2]], 0.05, dioSmooth('#ffcf4a', 0.5), 24));


// a red-and-white swim ring for the worker
const hrRing = () => p3Mesh(new THREE.TorusGeometry(0.42, 0.16, 12, 24), dioSmooth('#ff4b4b', 0.5), { r: [Math.PI / 2, 0, 0] });

// ---------- captions: one big word at a time; danger in red, fixes in green, results in yellow ----------
const HR_FIX: Record<number, string> = { 6: 'cinco', 35: 'uno', 36: 'cavas', 51: 'dos', 60: 'un', 65: 'tres', 78: 'cuatro', 92: 'cuatro', 100: 'cinco', 108: 'tres', 121: '120.000', 122: '', 140: 'con…' };
const HR_COLOR: Record<string, string> = { río: 'y', flotando: 'y', cuesta: 'y', quieta: 'r', charco: 'r', anillo: 'g', suaves: 'g', frene: 'r', acero: 'g', hormigón: 'g', hondo: 'y', rejillas: 'g', bomba: 'g', truco: 'y', chorros: 'g', adelante: 'g', rápido: 'y', flotador: 'g', kilómetros: 'y', despacio: 'y', '120.000': 'y', millón: 'y', dólares: 'y', piscina: 'y', uno: 'y', dos: 'y', tres: 'y', cuatro: 'y', cinco: 'y' };
const hrCaptions = (w: World, step: number) => {
  const el = document.createElement('div'); el.className = 'hp-cap'; w.titles.appendChild(el);
  const tag = document.createElement('div'); tag.className = 'hp-tag'; tag.innerHTML = `<span>DE HOYO</span><div class="bar"><div class="fill" style="width:${Math.round(step * 100)}%"></div></div><span>RÍO</span>`; w.titles.appendChild(tag);
  let shown = -2;
  return (t: number) => { let i = -1; for (let k = 0; k < WORDS.length; k++) { if (WORDS[k].t0 <= t + 0.04 && (HR_FIX[k] ?? WORDS[k].w) !== '') i = k; if (WORDS[k].t0 > t + 0.04) break; }
    if (i >= 0 && t > WORDS[i].t1 + 0.4) i = -1;
    if (i !== shown) { shown = i; const txt = i < 0 ? '' : HR_FIX[i] ?? WORDS[i].w, key = txt.toLowerCase().replace(/[^a-záéíóúñ0-9.]/g, ''); el.textContent = txt; el.className = 'hp-cap ' + (HR_COLOR[key] ?? ''); }
    const a = i < 0 ? 0 : p3Clamp((t - WORDS[i].t0 + 0.04) / 0.08); el.style.opacity = String(a); el.style.transform = `translateX(-50%) scale(${0.8 + 0.2 * a})`; };
};

// the whole set: light, backdrop, land, every layer, the worker; returns them
const hrSet = (w: World, step: number) => { dioLights(w); hrBackdrop(w);
  const yard = w.add(hrYard()), rebar = w.add(hrRebar()), shell = w.add(hrShell()), pump = w.add(hrPump()), water = w.add(hrWater()), flow = w.add(hrFlow());
  const worker = w.add(dioToon(HR_WORKER, 1.75, 4)), shovel = w.add(hrShovel()), hose = w.add(hrHose()), spray = w.add(hrSpray()), ring = w.add(hrRing());
  return { yard, rebar, shell, pump, water, flow, worker, shovel, hose, spray, ring, cap: hrCaptions(w, step) }; };
type HrSet = ReturnType<typeof hrSet>;
// the stage of the build: what is visible
const hrBuild = (S: HrSet, t: number, o: { dig?: number; rebar?: number; shell?: number; paint?: number; pump?: number; water?: number; speed?: number; jets?: number }) => {
  S.yard.pose(o.dig ?? 1); S.rebar.pose(o.rebar ?? 0); S.shell.pose(o.shell ?? 0, o.paint ?? 0); S.pump.pose(o.pump ?? 0); S.water.pose(t, o.water ?? 0);
  S.flow.pose(t, (o.water ?? 0) > 0.05 ? -HR_D + HR_T + S.water.lev(o.water ?? 0) : -9, o.speed ?? 0, S.pump.jets, o.jets ?? 0); S.ring.visible = false; };
// the worker standing somewhere, with a pose; tool 'shovel' | 'hose' | null
const hrWorker = (S: HrSet, w: World, t: number, at: Vec3, opts: Toon.FrontOpts, tool: 'shovel' | 'hose' | null = null) => {
  S.worker.position.set(...at); S.worker.pose(w.camera, opts); S.shovel.visible = tool === 'shovel'; S.hose.visible = tool === 'hose';
  if (tool === 'shovel') { const dig = Math.sin(t * 6); S.shovel.position.set(at[0] + 0.35, at[1] + 0.35 + 0.15 * dig, at[2] + 0.15); S.shovel.rotation.z = -0.5 + 0.35 * dig; }
  if (tool === 'hose') { S.hose.position.set(at[0] + 0.3, at[1] + 1.0, at[2] + 0.2); S.hose.rotation.z = -0.5; } };
// the worker floating on the ring at u along the river
const hrFloat = (S: HrSet, w: World, t: number, u: number, expr: Toon.Expr = 'grin') => { const p = hrPath.getPointAt(((u % 1) + 1) % 1), y = -HR_D + HR_T + S.water.lev(0.92);
  S.ring.visible = true; S.ring.position.set(p.x, y + 0.02 * Math.sin(t * 3), p.z); hrWorker(S, w, t, [p.x, y - 0.3, p.z], { expr, mode: 'sit', wave: 1 }); };
// cameras: the cutaway head-on (wide), moving in a little with u
const hrCut = (w: World, u: number, x = 0, d = 13, y = 0) => w.look([x + 1.0 - u * 0.7, y + 3.0, d - u], [x, y - 0.7, -2.6], 36);
const HR_IN_HOLE: Vec3 = [-2.0, -HR_D, -0.7], HR_ISLE: Vec3 = [0, 0, -0.7];

defineVisuals({
  'test-build': {
    bg: HRC.sky,
    build(w) { const S = hrSet(w, 0.5);
      return (t) => { const st = Math.min(4, Math.floor(t - w.s.t0));
        hrBuild(S, t, [{ dig: 0.6 }, { water: 0.6 }, { rebar: 1, shell: 0.5 }, { shell: 1, pump: 1 }, { shell: 1, paint: 1, pump: 1, water: 0.92, speed: 1, jets: 1 }][st]);
        if (st === 4) hrFloat(S, w, t, 0.3); else hrWorker(S, w, t, st === 0 ? [-2.0, -HR_D * 0.6, -0.7] : HR_ISLE, { expr: 'smile', mode: 'stand' }, st === 0 ? 'shovel' : st === 2 ? 'hose' : null);
        hrCut(w, 0); S.cap(t); }; },
  },
});
