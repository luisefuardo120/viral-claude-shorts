// World of "De hoyo a piscina" (3D cutaway diorama + a 2D Toon worker, in the style of the channel's tornado-shelter short).
// The backyard is a block of land cut open at the front (z = 0): the pit, and every layer built in it, shows in section.
// Prefix hp. Sources: fuentes.md.

const HP = { sky: '#5bb8f5', soil: '#a0612e', soilD: '#7a4520', rebar: '#c0532a', pipe: '#f5f6f8', concrete: '#9aa0aa', plaster: '#dff4ff', water: '#2f9be8', key: '#b6f23c', red: '#ff4b4b', yellow: '#ffd23f', coping: '#f2ece0' };
const HP_L = 4, HP_W = 8, HP_D = 1.5;   // pool: 4 m wide (x, what the cut shows), 8 m long (z, from the cut at z = 0 back to z = -8), 1.5 m deep
const HP_SHELL = 0.18;                   // concrete thickness
const HP_WORKER: Toon.Outfit = { jacket: '#ff8a1f', pants: '#2f5fb5', boots: '#3a2a1e', hat: 'cap', cap: '#1f5fd6' };

// ---------- the backyard block, cut open at the front; dig 0..1 opens the pit ----------
const hpGrassMat = () => p3Shader(new THREE.MeshStandardMaterial({ roughness: 0.95 }), 'hp-grass', { color: `
  float stripe = step(0.5, fract(p3World.x * 0.35)), n = p3F(p3World.xz * 0.8);
  diffuseColor.rgb = mix(vec3(0.03, 0.25, 0.02), vec3(0.06, 0.38, 0.03), stripe * 0.55 + n * 0.35);` });
const hpSoilFace = () => { const t = dioSoil(); t.wrapS = t.wrapT = THREE.RepeatWrapping; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }); };
const hpYard = () => {
  const g = p3Group(), grass = hpGrassMat(), soilF = hpSoilFace(), dark = dioSmooth(HP.soilD, 0.95), H = 4;
  // a box of land with grass on top and soil on its sides (front face textured with the layers)
  const block = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), [dark, dark, top ? grass : dark, dark, soilF, dark]);
    (soilF.map as THREE.Texture).repeat.set(1.5, 1); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.receiveShadow = true; m.castShadow = false; g.add(m); return m; };
  block(-7, -HP_L / 2, -H, 0, -14, 0); block(HP_L / 2, 7, -H, 0, -14, 0); block(-HP_L / 2, HP_L / 2, -H, 0, -14, -HP_W);
  const under = block(-HP_L / 2, HP_L / 2, -H, 0, -HP_W, 0, true);   // the ground where the pit opens: scaled as it is dug
  const pitWalls = [-1, 1].map((s) => { const m = p3Mesh(p3Box(0.02, 1, HP_W), dark, { p: [s * HP_L / 2, 0, -HP_W / 2] }); g.add(m); return m; });
  const pitBack = p3Mesh(p3Box(HP_L, 1, 0.02), dark, { p: [0, 0, -HP_W] }); g.add(pitBack);
  // dug dirt pile beside the pit
  const pile = p3Mesh(new THREE.IcosahedronGeometry(1, 1), dioSmooth(HP.soil, 0.95), { p: [3.9, 0, -4] }); pile.scale.set(1.0, 0.6, 1.4); g.add(pile);
  const pose = (dig: number) => { const d = HP_D * p3Clamp(dig) + 0.001; under.scale.y = (H - d) / H; under.position.y = -H + (H - d) / 2;
    pitWalls.forEach((m) => { m.scale.y = d; m.position.y = -d / 2; }); pitBack.scale.y = d; pitBack.position.y = -d / 2; pile.visible = dig > 0.05; pile.scale.y = 0.6 * p3Clamp(dig); };
  pose(0);
  return Object.assign(g, { pose });
};
// the backdrop: house, fence, trees, clouds, sun
const hpBackdrop = (w: World) => {
  const h = dioHouse([-1.5, 0, -12.2], 0, 1.3); w.add(h);
  for (let x = -6.5; x <= 6.5; x += 0.6) { w.add(p3Mesh(p3Box(0.08, 0.9, 0.06), dioSmooth('#f5f6f8', 0.6), { p: [x, 0.45, -9.4] })); }
  for (const y of [0.35, 0.7]) w.add(p3Mesh(p3Box(13.2, 0.06, 0.05), dioSmooth('#f5f6f8', 0.6), { p: [0, y, -9.42] }));
  for (const [x, z, s, c] of [[3.6, -11, 1.5, '#4caf3e'], [5.2, -8, 1.1, '#5cc24a'], [-4.8, -8.5, 1.3, '#3f9a36']] as const) w.add(dioTree([x, 0, z], s, c));
  [[-6, 9, -16, 1.6], [7, 10, -18, 2]].forEach(([x, y, z, s]) => w.add(dioCloud([x, y, z], s))); const sun = w.add(dioSun()); sun.position.set(8, 10, -20); sun.scale.setScalar(0.6);
};

// ---------- the pool, layer by layer, all inside the pit ----------
// rebar: rods along the floor and the walls (grow 0..1 lays them in order)
const hpRebar = () => { const g = p3Group(), mat = dioSmooth(HP.rebar, 0.6, 0.3), rods: THREE.Mesh[] = [];
  const rod = (a: Vec3, b: Vec3) => { const m = p3Rod(a, b, 0.025, mat, 6); g.add(m); rods.push(m); };
  const y0 = -HP_D + 0.09, i0 = 0.09;
  for (let x = -HP_L / 2 + i0; x <= HP_L / 2 - i0 + 0.01; x += 0.4) rod([x, y0, -i0], [x, y0, -HP_W + i0]);
  for (let z = -i0; z >= -HP_W + i0 - 0.01; z -= 0.4) rod([-HP_L / 2 + i0, y0, z], [HP_L / 2 - i0, y0, z]);
  for (let x = -HP_L / 2 + i0; x <= HP_L / 2 - i0 + 0.01; x += 0.4) rod([x, y0, -HP_W + i0], [x, -0.1, -HP_W + i0]);
  for (const s of [-1, 1]) for (let z = -i0; z >= -HP_W + i0 - 0.01; z -= 0.4) rod([s * (HP_L / 2 - i0), y0, z], [s * (HP_L / 2 - i0), -0.1, z]);
  for (let y = y0 + 0.35; y < -0.1; y += 0.35) { rod([-HP_L / 2 + i0, y, -HP_W + i0], [HP_L / 2 - i0, y, -HP_W + i0]); for (const s of [-1, 1]) rod([s * (HP_L / 2 - i0), y, -i0], [s * (HP_L / 2 - i0), y, -HP_W + i0]); }
  return Object.assign(g, { pose: (u: number) => rods.forEach((m, i) => { m.visible = i / rods.length < u; }) }); };
// pipes: the main drain on the floor, returns in the walls, out to a pump and filter box on the side
const hpPipes = () => { const m = dioSmooth(HP.pipe, 0.4), g = p3Group(), parts: THREE.Object3D[] = [];
  const add = (o: THREE.Object3D) => { g.add(o); parts.push(o); };
  add(p3Tube([[0, -HP_D + 0.05, -2.5], [0.8, -HP_D + 0.05, -2.5], [HP_L / 2 + 0.3, -HP_D + 0.05, -2.5], [HP_L / 2 + 0.3, -0.3, -2.5], [3.6, -0.3, -2.5]], 0.11, m, 30));
  add(p3Tube([[HP_L / 2 - 0.1, -0.5, -1.2], [HP_L / 2 + 0.6, -0.5, -1.2], [3.6, -0.5, -2.2]], 0.1, m, 16));
  add(p3Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 20), dioSmooth('#2a2f3a', 0.5), { p: [0, -HP_D + 0.03, -2.5] }));
  add(p3Group(p3Mesh(new THREE.RoundedBoxGeometry(0.7, 0.6, 0.5, 2, 0.05), dioSmooth('#2f5fb5', 0.5), { p: [3.9, 0.3, -2.4] }), p3Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.8, 20), dioSmooth('#c9ced8', 0.4, 0.4), { p: [4.6, 0.4, -2.4] })));
  return Object.assign(g, { pose: (u: number) => parts.forEach((o, i) => { o.visible = i / parts.length < u + 0.01; }) }); };
// the concrete shell (floor + three walls + its cut face at the front); thick 0..1 sprays it on
const hpShell = () => { const conc = p3Shader(new THREE.MeshStandardMaterial({ roughness: 0.95 }), 'hp-conc', { bump: 0.02, color: `
    float n = p3F(p3World.xz * 6.0 + p3World.y * 4.0); diffuseColor.rgb = vec3(0.32, 0.34, 0.37) * (0.85 + n * 0.3); p3Ht = n;` });
  const g = p3Group(), T = HP_SHELL, floor = p3Mesh(p3Box(HP_L, T, HP_W), conc), back = p3Mesh(p3Box(HP_L, HP_D, T), conc), sides = [-1, 1].map(() => p3Mesh(p3Box(T, HP_D, HP_W), conc));
  g.add(floor, back, ...sides); [floor, back, ...sides].forEach((m) => { m.receiveShadow = true; });
  const pose = (u: number) => { const k = Math.max(0.001, p3Clamp(u)); g.visible = u > 0.01; floor.scale.y = k; floor.position.set(0, -HP_D + (T * k) / 2, -HP_W / 2);
    back.scale.z = k; back.position.set(0, -HP_D / 2, -HP_W + (T * k) / 2); sides.forEach((m, i) => { const s = i ? 1 : -1; m.scale.x = k; m.position.set(s * (HP_L / 2 - (T * k) / 2), -HP_D / 2, -HP_W / 2); }); };
  pose(0); return Object.assign(g, { pose }); };
// the waterproof finish: a thin light-blue skin inside the shell, plus the white coping round the top
const hpFinish = () => { const m = dioSmooth(HP.plaster, 0.35), g = p3Group(), T = HP_SHELL + 0.02, i = 0.004;
  const f = p3Mesh(p3Box(HP_L - 2 * T, 0.02, HP_W - T), m, { p: [0, -HP_D + T, -HP_W / 2 + T / 2 - i] }), b = p3Mesh(p3Box(HP_L - 2 * T, HP_D - T, 0.02), m, { p: [0, -HP_D / 2 + T / 2, -HP_W + T] });
  const sd = [-1, 1].map((s) => p3Mesh(p3Box(0.02, HP_D - T, HP_W - T), m, { p: [s * (HP_L / 2 - T), -HP_D / 2 + T / 2, -HP_W / 2 + T / 2] }));
  const tiles = p3Group(); for (let x = -HP_L / 2; x < HP_L / 2; x += 0.25) tiles.add(p3Mesh(p3Box(0.24, 0.08, 0.04), dioSmooth(x % 0.5 < 0.25 ? '#1f5fd6' : '#3aa6ff', 0.3), { p: [x + 0.125, -0.12, -HP_W + T + 0.02] }));
  const coping = p3Group(p3Mesh(p3Box(HP_L + 0.5, 0.08, 0.35), dioSmooth(HP.coping, 0.6), { p: [0, 0.04, -HP_W - 0.05] }), ...[-1, 1].map((s) => p3Mesh(p3Box(0.35, 0.08, HP_W + 0.2), dioSmooth(HP.coping, 0.6), { p: [s * (HP_L / 2 + 0.05), 0.04, -HP_W / 2] })));
  g.add(f, b, ...sd, tiles, coping);
  return Object.assign(g, { pose: (u: number) => { g.visible = u > 0.01; [f, b, ...sd].forEach((x) => { (x.material as THREE.MeshStandardMaterial).opacity = 1; x.scale.setScalar(1); }); g.scale.y = Math.max(0.001, p3Clamp(u)); g.position.y = (1 - p3Clamp(u)) * -HP_D * 0.0; tiles.visible = coping.visible = u > 0.6; } }); };
// water: a blue block whose level rises (fill 0..1), with a lighter surface and gentle ripples; leak 0..1 makes it seep away into the soil
const hpWater = () => { const mat = new THREE.MeshStandardMaterial({ color: HP.water, transparent: true, opacity: 0.72, roughness: 0.15, depthWrite: false }), body = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 30, 15), new THREE.MeshStandardMaterial({ color: '#7fd6ff', transparent: true, opacity: 0.8, roughness: 0.1, depthWrite: false })); top.rotation.x = -Math.PI / 2;
  const g = p3Group(body, top); body.renderOrder = top.renderOrder = 5;
  // inner box (x0..x1, z0..z1) and floor y; fill 0..1 of the depth
  const pose = (t: number, fill: number, inner = HP_SHELL + 0.02) => { const h = (HP_D - inner) * p3Clamp(fill), w = HP_L - 2 * inner, d = HP_W - inner; g.visible = fill > 0.01;
    body.scale.set(w, Math.max(0.001, h), d); body.position.set(0, -HP_D + inner + h / 2, -HP_W / 2 + inner / 2); top.scale.set(w, d, 1); top.position.set(0, -HP_D + inner + h + 0.005 + 0.01 * Math.sin(t * 2), -HP_W / 2 + inner / 2); };
  return Object.assign(g, { pose }); };
// dirt chunks falling from the walls (u 0..1), and a dark wet stain spreading in the soil around the pit
const hpCollapse = () => { const R = p3Rnd(7), g = p3Group(), P = Array.from({ length: 30 }, () => ({ m: p3Mesh(new THREE.IcosahedronGeometry(0.12 + R() * 0.18, 0), dioSmooth(R() < 0.5 ? HP.soil : HP.soilD, 0.95)), x: (R() < 0.5 ? -1 : 1) * (HP_L / 2 - 0.1), z: -R() * HP_W, y: -R() * 0.6, d: R() }));
  P.forEach((p) => g.add(p.m)); const stain = p3Mesh(new THREE.PlaneGeometry(HP_L + 1.4, 1.6), new THREE.MeshBasicMaterial({ color: '#3a1d0c', transparent: true, opacity: 0, depthWrite: false }), { p: [0, -HP_D / 2 - 0.3, 0.012] }); g.add(stain);
  return Object.assign(g, { pose: (u: number, wet: number) => { P.forEach((p) => { const k = p3Clamp((u - p.d * 0.6) / 0.4); p.m.visible = u > 0.01; p.m.position.set(p.x * (1 - 0.15 * k), p.y - k * (HP_D + p.y - 0.1) + 0.1, p.z); p.m.rotation.set(k * 3, k * 2, 0); });
    (stain.material as THREE.MeshBasicMaterial).opacity = 0.45 * wet; } }); };
// the concrete gun's spray: grey particles from the nozzle to a point on the shell (a loop)
const hpSpray = () => { const sw = p3Swarm(60, new THREE.SphereGeometry(0.035, 6, 4), dioSmooth('#8a9099', 0.9)), R = p3Rnd(3), P = Array.from({ length: 60 }, () => [R(), (R() - 0.5) * 0.4, (R() - 0.5) * 0.4]);
  return Object.assign(sw, { pose: (t: number, a: THREE.Vector3, b: THREE.Vector3, on: number) => { P.forEach(([ph, dx, dz], i) => { if (on < 0.02) { sw.hide(i); return; } const u = (t * 2.5 + ph) % 1, p = a.clone().lerp(b, u); sw.put(i, p.x + dx * u, p.y + Math.sin(u * 3) * 0.1, p.z + dz * u, on); }); sw.done(); } }); };
// a 3D tool held by the worker (shovel or hose nozzle), drawn at his hand
const hpShovel = () => p3Group(p3Mesh(p3Cyl(0.025, 0.025, 1.1, 8), dioSmooth('#8a5a3b', 0.7), { p: [0, 0.55, 0] }), p3Mesh(new THREE.RoundedBoxGeometry(0.26, 0.32, 0.03, 2, 0.02), dioSmooth('#9aa3b0', 0.4, 0.5), { p: [0, -0.1, 0] }));
const hpHose = () => p3Group(p3Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.5, 12), dioSmooth('#2a2f3a', 0.5), { r: [0, 0, Math.PI / 2] }), p3Tube([[-0.25, 0, 0], [-0.8, -0.5, 0.4], [-1.6, -0.2, 1.2], [-3, 0, 2]], 0.05, dioSmooth('#ffcf4a', 0.5), 24));

// ---------- captions: one big word at a time; danger in red, fixes in green, results in yellow ----------
const HP_FIX: Record<number, string> = { 36: 'uno', 47: 'dos', 58: 'tres', 67: 'cuatro', 85: 'cinco', 94: '¿Cuánta?', 105: '', 106: '', 109: '300', 116: '¿Tobogán', 117: 'o jacuzzi?', 123: 'con…' };
const HP_COLOR: Record<string, string> = { hoyo: 'y', piscina: 'y', agua: 'g', chupa: 'r', derrumban: 'r', jaula: 'g', acero: 'g', esqueleto: 'g', tubos: 'g', hormigón: 'g', manguera: 'g', pasar: 'r', impermeable: 'g', días: 'y', '48.000': 'y', litros: 'y', metros: 'y', hondo: 'y', truco: 'y', capa: 'g', '300': 'y', bañeras: 'y', uno: 'y', dos: 'y', tres: 'y', cuatro: 'y', cinco: 'y' };
const hpCaptions = (w: World, step: number) => {
  const el = document.createElement('div'); el.className = 'hp-cap'; w.titles.appendChild(el);
  const tag = document.createElement('div'); tag.className = 'hp-tag'; tag.innerHTML = `<span>DE HOYO</span><div class="bar"><div class="fill" style="width:${Math.round(step * 100)}%"></div></div><span>PISCINA</span>`; w.titles.appendChild(tag);
  let shown = -2;
  return (t: number) => { let i = -1; for (let k = 0; k < WORDS.length; k++) { if (WORDS[k].t0 <= t + 0.04 && (HP_FIX[k] ?? WORDS[k].w) !== '') i = k; if (WORDS[k].t0 > t + 0.04) break; }
    if (i >= 0 && t > WORDS[i].t1 + 0.4) i = -1;
    if (i !== shown) { shown = i; const txt = i < 0 ? '' : HP_FIX[i] ?? WORDS[i].w, key = txt.toLowerCase().replace(/[^a-záéíóúñ0-9.]/g, ''); el.textContent = txt; el.className = 'hp-cap ' + (HP_COLOR[key] ?? ''); }
    const a = i < 0 ? 0 : p3Clamp((t - WORDS[i].t0 + 0.04) / 0.08); el.style.opacity = String(a); el.style.transform = `translateX(-50%) scale(${0.8 + 0.2 * a})`; };
};

// the whole set: light, backdrop, yard, every layer, the worker; returns them
const hpSet = (w: World, step: number) => { dioLights(w); hpBackdrop(w);
  const yard = w.add(hpYard()), rebar = w.add(hpRebar()), pipes = w.add(hpPipes()), shell = w.add(hpShell()), finish = w.add(hpFinish()), water = w.add(hpWater()), collapse = w.add(hpCollapse());
  const worker = w.add(dioToon(HP_WORKER, 1.75, 4)), shovel = w.add(hpShovel()), hose = w.add(hpHose()), spray = w.add(hpSpray());
  return { yard, rebar, pipes, shell, finish, water, collapse, worker, shovel, hose, spray, cap: hpCaptions(w, step) }; };
type HpSet = ReturnType<typeof hpSet>;
// the stage of the build (0 hole … 1 full pool): what is visible at each point
const hpBuild = (S: HpSet, t: number, o: { dig?: number; rebar?: number; pipes?: number; shell?: number; finish?: number; water?: number; collapse?: number; wet?: number }) => {
  S.yard.pose(o.dig ?? 1); S.rebar.pose(o.rebar ?? 0); S.pipes.pose(o.pipes ?? 0); S.shell.pose(o.shell ?? 0); S.finish.pose(o.finish ?? 0); S.water.pose(t, o.water ?? 0, (o.shell ?? 0) > 0.5 ? HP_SHELL + 0.02 : 0.02); S.collapse.pose(o.collapse ?? 0, o.wet ?? 0); };
// the worker standing somewhere, with a pose; tool 'shovel' | 'hose' | null
const hpWorker = (S: HpSet, w: World, t: number, at: Vec3, opts: Toon.FrontOpts, tool: 'shovel' | 'hose' | null = null) => {
  S.worker.position.set(...at); S.worker.pose(w.camera, opts); S.shovel.visible = tool === 'shovel'; S.hose.visible = tool === 'hose';
  if (tool === 'shovel') { const dig = Math.sin(t * 6); S.shovel.position.set(at[0] + 0.35, at[1] + 0.35 + 0.15 * dig, at[2] + 0.15); S.shovel.rotation.z = -0.5 + 0.35 * dig; }
  if (tool === 'hose') { S.hose.position.set(at[0] + 0.3, at[1] + 1.0, at[2] + 0.2); S.hose.rotation.z = -0.5; } };
// cameras: the cutaway head-on (wide), and closer at a point
const hpCut = (w: World, u: number, x = 0, d = 10.5, y = 0) => w.look([x + 0.9 - u * 0.6, y + 1.9, d - u * 0.8], [x, y - 0.55, -1.5], 36);

defineVisuals({
  'test-build': {
    bg: HP.sky,
    build(w) { const S = hpSet(w, 0.5);
      return (t) => { const lt = t - w.s.t0, st = Math.floor(lt);   // 0 hole, 1 collapse, 2 rebar+pipes, 3 shell, 4 full
        hpBuild(S, t, [{ dig: 0.6 }, { dig: 1, collapse: 1, wet: 1, water: 0.2 }, { rebar: 1, pipes: 1 }, { rebar: 1, pipes: 1, shell: 1 }, { rebar: 1, pipes: 1, shell: 1, finish: 1, water: 0.92 }][Math.min(4, st)]);
        hpWorker(S, w, t, st === 0 ? [-0.6, -HP_D * 0.6, -1.0] : [-2.55, 0, -0.6], { expr: (['neutral', 'shock', 'smile', 'stern', 'grin'] as Toon.Expr[])[Math.min(4, st)], mode: 'stand' }, st === 0 ? 'shovel' : st === 3 ? 'hose' : null); hpCut(w, 0); }; },
  },
});
