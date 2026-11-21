// World of "De hoyo a torre antitsunami", in the channel's ink look (styles/3d/ink.ts): a beach cut open at the front (z = 0)
// down to the rock, the sea behind at sunset, and a tsunami tower built in five steps. 1 unit = 1 m. Prefix ht. Sources: fuentes.md.

const HT = { sand: '#f0d49a', sandD: '#d9b273', wet: '#b08a55', rock: '#7d7f8c', steel: '#8a95a8', conc: '#c9c4ba', key: '#b6f23c', red: '#ff4b4b', yellow: '#ffd23f', water: '#3aa6e0' };
const HT_H = 24, HT_ROCK = -18, HT_PIT = 3, HT_PLAT = 11.5;   // land block 24 m deep, rock from 18 m down, pit 3 m, platform 11.5 m up
const HT_LEGS: [number, number][] = [[-3, -1], [3, -1], [-3, -7], [3, -7]];
const HT_PILES: [number, number][] = [[-3, 0], [0, 0], [3, 0], [-3, -4], [3, -4], [-3, -7], [0, -7], [3, -7]];
const HT_WORKER: Toon.Outfit = { jacket: '#ff8a1f', pants: '#2f5fb5', boots: '#3a2a1e', hat: 'cap', cap: '#1f5fd6', scarf: '#d93b3b' };
const HT_CROWD: Toon.Outfit[] = [
  { jacket: '#e2453c', pants: '#3b5b9a', boots: '#f4f1ea', hat: 'hair', hair: '#5a3b2a' }, { jacket: '#7b5ac9', pants: '#3b3f52', boots: '#5a3b2a', hat: 'hair', hair: '#2a1d14' },
  { jacket: '#2fa39a', pants: '#40363a', boots: '#3a2a1e', hat: 'cap', cap: '#ffd23f' }, { jacket: '#f2c94c', pants: '#5a4a8a', boots: '#3a2a1e', hat: 'hair', hair: '#c9772f' },
  { jacket: '#5aa0e6', pants: '#2c3e50', boots: '#f4f1ea', hat: 'hair', hair: '#111111', build: 'kid' }, { jacket: '#ff8fb1', pants: '#4a4a6a', boots: '#5a3b2a', hat: 'hair', hair: '#7a4a2a' },
];

// ---------- the beach block: sand, wet sand and rock in the cut; the pit (dig 0..1) at the front ----------
const htCutTex = () => { const t = p3Paint(512, 512, (c) => { const R = p3Rnd(3);
  const band = (y0: number, y1: number, col: string) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, y1); for (let x = 0; x <= 512; x += 16) c.lineTo(x, y0 + Math.sin(x * 0.04 + y0) * 5); c.lineTo(512, y1); c.fill(); };
  band(0, 512, '#f0d49a'); band(60, 512, '#e6c283'); band(170, 512, '#d9b273'); band(280, 512, '#b08a55'); band(384, 512, '#7d7f8c'); band(450, 512, '#6a6c78');
  for (let i = 0; i < 160; i++) { const y = R() * 512; c.fillStyle = y > 384 ? 'rgba(40,40,55,0.35)' : 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(R() * 512, y, 2 + R() * 4, 1.5 + R() * 2, R() * 3, 0, 6.3); c.fill(); }
  c.strokeStyle = 'rgba(30,30,45,0.5)'; c.lineWidth = 3; for (let i = 0; i < 9; i++) { const x = R() * 512; c.beginPath(); c.moveTo(x, 390 + R() * 20); c.lineTo(x + 20 - R() * 40, 440 + R() * 40); c.lineTo(x + 30 - R() * 60, 512); c.stroke(); } });
  t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }); };
const htBeach = () => { const g = p3Group(), top = inkTex('grass', HT.sand, [8, 8]), cut = htCutTex(), side = dioSmooth(HT.sandD, 0.95);
  const block = (x0: number, x1: number, z0: number, z1: number, y1 = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 + HT_H, z1 - z0), [side, side, top, side, cut, side]); m.position.set((x0 + x1) / 2, (y1 - HT_H) / 2, (z0 + z1) / 2); g.add(m); return m; };
  block(-16, -4, -24, 0); block(4, 16, -24, 0); block(-4, 4, -24, -8); const fill = block(-4, 4, -8, 0);
  const seabed = new THREE.Mesh(new THREE.BoxGeometry(32, 3, 60), dioSmooth(HT.wet, 0.95)); seabed.position.set(0, -4.5, -54); g.add(seabed);
  const pose = (dig: number) => { const d = HT_PIT * p3Clamp(dig) + 0.001; fill.scale.y = (HT_H - d) / HT_H; fill.position.y = (-d - HT_H) / 2; };
  pose(0); return Object.assign(g, { pose, top }); };
// the sea behind, the sun on the horizon, a hotel, palms, umbrellas
const htBackdrop = (w: World) => {
  const sea = w.add(p3Mesh(new THREE.PlaneGeometry(400, 260), new THREE.MeshBasicMaterial({ color: '#3d8fc9', transparent: true, opacity: 0.95, depthWrite: false }), { p: [0, -0.4, -154], r: [-Math.PI / 2, 0, 0] }));
  w.add(inkSunGlow([10, 7, -170], 70, '#ff9a55')); w.add(p3Mesh(new THREE.CircleGeometry(5, 32), new THREE.MeshBasicMaterial({ color: '#ff8c42', fog: false }), { p: [10, 5, -175] }));
  w.add(inkMansion([-12, 0, -18], 0.5, 1.2));
  for (const [x, z, s] of [[-7, -4, 1.3], [8, -5, 1.4], [11, -12, 1.2], [-9, -14, 1.1], [13, -3, 1.0]]) w.add(inkPalm([x, 0, z], s));
  for (const [x, z, c] of [[7, -16, '#ff4b4b'], [10, -19, '#ffd23f'], [-6, -20, '#3aa6e0']] as const) { w.add(p3Mesh(p3Cyl(0.05, 0.05, 2.2, 6), '#ddd', { p: [x, 1.1, z] })); w.add(p3Mesh(new THREE.ConeGeometry(1.3, 0.6, 8), dioSmooth(c, 0.6), { p: [x, 2.3, z] })); }
  for (let i = 0; i < 14; i++) w.add(inkPine([-40 + i * 6, -0.5, -110 - (i % 3) * 6], 4 + (i % 3), '#2a6b43', i + 3));
  return sea; };
// ---------- the tower, in parts ----------
const htPiles = () => { const g = p3Group(), m = dioSmooth(HT.steel, 0.4, 0.6), P = HT_PILES.map(([x, z]) => { const p = p3Mesh(p3Cyl(0.4, 0.4, 1, 14), m); p.position.set(x, 0, z); g.add(p); return p; });
  return Object.assign(g, { pose: (u: number) => { const L = (HT_ROCK - 2 + HT_PIT) * -1 * p3Clamp(u), y0 = -HT_PIT; P.forEach((p) => { p.visible = u > 0.01; p.scale.y = Math.max(0.001, L); p.position.y = y0 - L / 2; }); } }); };
const htLegs = () => { const g = p3Group(), m = inkTex('plaster', HT.conc), cap = p3Mesh(p3Box(8.6, 1, 8.6), m, { p: [0, -HT_PIT + 0.5, -4] }); g.add(cap);
  const L = HT_LEGS.map(([x, z]) => { const l = p3Mesh(p3Box(1.2, 1, 1.2), m); l.position.set(x, 0, z); g.add(l); return l; });
  return Object.assign(g, { pose: (u: number) => { g.visible = u > 0.001; const h = (HT_PLAT + HT_PIT - 1) * p3Clamp(u) + 0.001; L.forEach((l) => { l.scale.y = h; l.position.y = -HT_PIT + 1 + h / 2; }); } }); };
const htPlatform = () => { const g = p3Group(), m = inkTex('plaster', HT.conc), slab = p3Mesh(p3Box(8.6, 0.6, 8.6), m, { p: [0, HT_PLAT + 0.3, -4] }); g.add(slab);
  return Object.assign(g, { pose: (u: number) => { g.visible = u > 0.01; const k = p3Clamp(u); g.scale.set(k, 1, k); g.position.set(0, (1 - k) * 2, -4 * (1 - k)); } }); };
// zigzag stairs on the right side, 4 flights from the sand up to the platform; u builds them flight by flight
const HT_FLIGHT = (HT_PLAT + 0.6) / 4;
const htStairs = () => { const g = p3Group(), wood = inkTex('wood', '#b98a5a', [1, 3]), post = dioSmooth('#8a6a4a', 0.8), parts: THREE.Object3D[] = [];
  for (let i = 0; i < 4; i++) { const z0 = i % 2 ? -7.5 : -0.5, z1 = i % 2 ? -0.5 : -7.5, y0 = i * HT_FLIGHT, y1 = y0 + HT_FLIGHT, x = 5.3;
    const len = Math.hypot(z1 - z0, y1 - y0), f = p3Mesh(p3Box(1.4, 0.25, len), wood, { p: [x, (y0 + y1) / 2, (z0 + z1) / 2] }); f.lookAt(x, y1, z1); g.add(f); parts.push(f);
    const land = p3Mesh(p3Box(1.6, 0.3, 1.4), wood, { p: [x, y1, z1] }); g.add(land); parts.push(land);
    const pp = p3Mesh(p3Box(0.2, y1, 0.2), post, { p: [x, y1 / 2, z1] }); g.add(pp); parts.push(pp); }
  return Object.assign(g, { pose: (u: number) => parts.forEach((o, i) => { o.visible = i / parts.length < u - 0.001; }) }); };
// stair point for walkers: u 0..1 from the sand to the platform
const htStairAt = (u: number): Vec3 => { const k = p3Clamp(u) * 4, i = Math.min(3, Math.floor(k)), f = k - i, z0 = i % 2 ? -7.5 : -0.5, z1 = i % 2 ? -0.5 : -7.5; return [5.3, (i + f) * HT_FLIGHT + 0.15, z0 + (z1 - z0) * f]; };
const htRoof = () => { const g = p3Group(), trim = dioSmooth('#ffffff', 0.6), roof = inkTex('tiles', '#b4584b', [3, 3]), parts: THREE.Object3D[] = [];
  const add = (o: THREE.Object3D) => { g.add(o); parts.push(o); }; const y = HT_PLAT + 0.6;
  for (const [x0, z0, x1, z1] of [[-4.2, 0.2, 4.2, 0.2], [-4.2, -8.2, 4.2, -8.2], [-4.2, 0.2, -4.2, -8.2]] as const) { add(p3Rod([x0, y + 1.1, z0], [x1, y + 1.1, z1], 0.06, trim, 6)); for (let k = 0; k <= 8; k++) { const t = k / 8; add(p3Rod([x0 + (x1 - x0) * t, y, z0 + (z1 - z0) * t], [x0 + (x1 - x0) * t, y + 1.1, z0 + (z1 - z0) * t], 0.04, trim, 5)); } }
  for (const [x, z] of [[-4, 0], [4, 0], [-4, -8], [4, -8]]) add(p3Mesh(p3Cyl(0.15, 0.15, 3.2, 8), trim, { p: [x, y + 1.6, z] }));
  const geo = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1); geo.rotateY(Math.PI / 4); const r = p3Mesh(geo, roof, { p: [0, y + 4, -4] }); r.scale.set(9.6, 1.8, 9.6); add(r);
  return Object.assign(g, { pose: (u: number) => parts.forEach((o, i) => { o.visible = i / parts.length < u - 0.001; }) }); };
// flood water (level in m above the sand), drawn on top; streaks that flow from the sea to the front
const htFlood = () => { const m = p3Mesh(new THREE.BoxGeometry(32, 1, 84), inkWaterMat(0.82), { p: [0, 0, -42] }); m.renderOrder = 5;
  const N = 90, sw = p3Swarm(N, new THREE.SphereGeometry(0.16, 6, 4), new THREE.MeshBasicMaterial({ color: '#f4fbff' })), R = p3Rnd(17), P = Array.from({ length: N }, () => [R() * 30 - 15, R(), R() * 3 + 1]);
  return Object.assign(p3Group(m, sw), { pose: (t: number, level: number, speed = 1) => { m.visible = level > 0.05; m.scale.y = Math.max(0.001, level + 0.4); m.position.y = (level - 0.4) / 2;
    P.forEach(([x, ph, sp], i) => { if (level < 0.3 || speed < 0.05) { sw.hide(i); return; } const z = -40 + ((ph * 40 + t * sp * 6 * speed) % 40); sw.put(i, x, level + 0.05, z, 1); }); sw.done(); } }); };
// a fishing boat, ~6 m long, bow towards +z
const htBoat = () => { const g = p3Group(), hull = dioSmooth('#e8eef5', 0.6), stripe = dioSmooth('#d93b3b', 0.6);
  g.add(p3Mesh(new THREE.BoxGeometry(2.2, 1.2, 4.6), hull, { p: [0, 0.6, -0.6] })); const bow = new THREE.ConeGeometry(1.1, 2.2, 4, 1); bow.rotateY(Math.PI / 4); bow.rotateX(Math.PI / 2); bow.scale(1.4, 0.75, 1); g.add(p3Mesh(bow, hull, { p: [0, 0.6, 2.5] }));
  g.add(p3Mesh(p3Box(2.25, 0.3, 4.62), stripe, { p: [0, 0.4, -0.6] })); g.add(p3Mesh(p3Box(1.4, 1.2, 1.6), dioSmooth('#3f6e8a', 0.6), { p: [0, 1.8, -1.4] }));
  return g; };
const htShovel = () => p3Group(p3Mesh(p3Cyl(0.025, 0.025, 1.1, 8), dioSmooth('#8a5a3b', 0.7), { p: [0, 0.55, 0] }), p3Mesh(new THREE.RoundedBoxGeometry(0.26, 0.32, 0.03, 2, 0.02), dioSmooth('#9aa3b0', 0.4, 0.5), { p: [0, -0.1, 0] }));

// ---------- captions: one big word at a time; danger in red, fixes in green, results in yellow ----------
const HT_FIX: Record<number, string> = { 6: 'cinco', 41: 'uno', 52: 'dos', 65: 'tres', 69: '11,5', 71: '', 72: '', 78: 'cuatro', 91: 'cinco', 124: 'con…' };
const HT_COLOR: Record<string, string> = { torre: 'y', tsunami: 'r', golpe: 'y', aguanta: 'y', terremoto: 'r', sopa: 'r', hunde: 'r', pilotes: 'g', acero: 'g', '20': 'y', roca: 'g', patas: 'g', separadas: 'g', agua: 'g', plataforma: 'g', '115': 'y', ola: 'r', truco: 'y', escaleras: 'g', '700': 'y', personas: 'y', baranda: 'g', techo: 'g', japón: 'y', barco: 'r', '10': 'y', toneladas: 'y', '36': 'y', kilómetros: 'y', uno: 'y', dos: 'y', tres: 'y', cuatro: 'y', cinco: 'y' };
const htCaptions = (w: World, step: number) => {
  const el = document.createElement('div'); el.className = 'hp-cap'; w.titles.appendChild(el);
  const tag = document.createElement('div'); tag.className = 'hp-tag'; tag.innerHTML = `<span>DE HOYO</span><div class="bar"><div class="fill" style="width:${Math.round(step * 100)}%"></div></div><span>TORRE</span>`; w.titles.appendChild(tag);
  let shown = -2;
  return (t: number) => { let i = -1; for (let k = 0; k < WORDS.length; k++) { if (WORDS[k].t0 <= t + 0.04 && (HT_FIX[k] ?? WORDS[k].w) !== '') i = k; if (WORDS[k].t0 > t + 0.04) break; }
    if (i >= 0 && t > WORDS[i].t1 + 0.4) i = -1;
    if (i !== shown) { shown = i; const txt = i < 0 ? '' : HT_FIX[i] ?? WORDS[i].w, key = txt.toLowerCase().replace(/[^a-záéíóúñ0-9.]/g, ''); el.textContent = txt; el.className = 'hp-cap ' + (HT_COLOR[key] ?? ''); }
    const a = i < 0 ? 0 : p3Clamp((t - WORDS[i].t0 + 0.04) / 0.08); el.style.opacity = String(a); el.style.transform = `translateX(-50%) scale(${0.8 + 0.2 * a})`; };
};

// ---------- the whole set ----------
const htSet = (w: World, step: number, crowd = 0) => { inkLights(w, 'sunset', [90, 320]); htBackdrop(w);
  const beach = w.add(htBeach()), piles = w.add(htPiles()), legs = w.add(htLegs()), plat = w.add(htPlatform()), stairs = w.add(htStairs()), roof = w.add(htRoof()), flood = w.add(htFlood()), boat = w.add(htBoat());
  const worker = w.add(dioToon(HT_WORKER, 1.75, 4)), shovel = w.add(htShovel());
  const people = Array.from({ length: crowd }, (_, i) => w.add(dioToon(HT_CROWD[i % HT_CROWD.length], HT_CROWD[i % HT_CROWD.length].build === 'kid' ? 1.2 : 1.7, 10 + i)));
  boat.visible = false; inkLook(w, { focus: 30, blur: 3 });
  return { beach, piles, legs, plat, stairs, roof, flood, boat, worker, shovel, people, cap: htCaptions(w, step) }; };
type HtSet = ReturnType<typeof htSet>;
const htBuild = (S: HtSet, t: number, o: { dig?: number; piles?: number; legs?: number; plat?: number; stairs?: number; roof?: number; flood?: number; speed?: number }) => {
  S.beach.pose(o.dig ?? 1); S.piles.pose(o.piles ?? 0); S.legs.pose(o.legs ?? 0); S.plat.pose(o.plat ?? 0); S.stairs.pose(o.stairs ?? 0); S.roof.pose(o.roof ?? 0); S.flood.pose(t, o.flood ?? 0, o.speed ?? 1); };
const htWorker = (S: HtSet, w: World, t: number, at: Vec3, opts: Toon.FrontOpts, shovel = false) => {
  S.worker.position.set(...at); S.worker.pose(w.camera, { mode: 'stand', ...opts }); S.shovel.visible = shovel;
  if (shovel) { const d = Math.sin(t * 6); S.shovel.position.set(at[0] + 0.35, at[1] + 0.35 + 0.15 * d, at[2] + 0.15); S.shovel.rotation.z = -0.5 + 0.35 * d; } };
// the crowd: n people on the platform (or, with climb 0..1, walking up the stairs one after another)
const htCrowd = (S: HtSet, w: World, t: number, n: number, climb = 1, wave = false) => S.people.forEach((p, i) => { p.visible = i < n; if (i >= n) return;
  const on = climb - i * 0.05; let at: Vec3;
  if (on >= 1) at = [-3 + (i % 5) * 1.5, HT_PLAT + 0.6, -1.4 - Math.floor(i / 5) * 1.6]; else at = htStairAt(Math.max(0, on));
  p.position.set(...at); p.pose(w.camera, { mode: on >= 1 ? 'stand' : 'march', phase: t * 2 + i, expr: on >= 1 ? 'smile' : 'nervous', wave: wave && on >= 1 && i % 2 ? 1 : 0 }); });
// cameras: wide (the whole tower and the cut down to the rock) and the shake of a quake or an impact
const htWide = (w: World, u: number, shake = 0, t = 0) => { const s = shake * 0.35; w.look([7 - u * 2 + Math.sin(t * 37) * s, 4 + Math.cos(t * 29) * s, 56 - u * 3], [0, -1.5, -4], 42); };
const HT_IN_PIT: Vec3 = [-1.2, -HT_PIT, -2], HT_SAND: Vec3 = [-6.5, 0, -1.5];

defineVisuals({
  'test-build': {
    bg: '#5f7fc8',
    build(w) { const S = htSet(w, 0.5, 8);
      return (t) => { const st = Math.min(4, Math.floor(t - w.s.t0));
        htBuild(S, t, [{ dig: 0.6 }, { piles: 1 }, { piles: 1, legs: 1, flood: 3 }, { piles: 1, legs: 1, plat: 1, stairs: 1, roof: 1 }, { piles: 1, legs: 1, plat: 1, stairs: 1, roof: 1, flood: 8 }][st]);
        htWorker(S, w, t, st === 0 ? [-1.2, -HT_PIT * 0.6, -2] : HT_SAND, { expr: 'smile' }, st === 0); htCrowd(S, w, t, st >= 3 ? 8 : 0);
        if (st === 0) w.look([1, 2.5, 9], [-1, -0.8, -3], 40); else htWide(w, 0); S.cap(t); }; },
  },
});
