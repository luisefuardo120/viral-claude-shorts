// World of "Imagina que tienes que construir una ciudad en el desierto" (Dubái), polished low-poly (no ink), vertical.
// Sets: the desert city (grows from / sinks into the sand), the plan board, a desalination cutaway, a faucet, a tower with AC
// units, cold-water pipes under the streets, sand grains (macro), a sand ship, the palm island, a brick wall, a solar park.
// Prefix db. Sources: fuentes.md.

const DB = { sand: '#e9c58a', sandD: '#d9a865', sea: '#2f9fd6', key: '#b6f23c', red: '#ff4b4b', yellow: '#ffd23f', cold: '#5fd0ff', glass: ['#5f9bd6', '#8cc0ea', '#4e86c2', '#a9d2f2'] };
const DB_WORKER: Toon.Outfit = { jacket: '#ff8a1f', pants: '#2f5fb5', boots: '#3a2a1e', hat: 'cap', cap: '#1f5fd6', scarf: '#d93b3b' };
const DB_PIECES = ['AGUA', 'FRÍO', 'TIERRA', 'ENERGÍA'];

// ---------- the desert ----------
const dbDune = (p: Vec3, s: [number, number, number], c: string, seed: number) => { const R = p3Rnd(seed), g = new THREE.SphereGeometry(1, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) { const k = 0.92 + R() * 0.12; pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * (0.9 + R() * 0.15), pos.getZ(i) * k); } g.computeVertexNormals(); g.scale(...s);
  return p3Mesh(g, new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, flatShading: true }), { p }); };
const dbGround = (w: World, sea = true) => { inkLights(w, 'sunset', [90, 420]);
  w.add(p3Mesh(p3Box(500, 1, 500), dioSmooth(DB.sand, 0.95), { p: [0, -0.5, -120] }));
  if (sea) w.add(p3Mesh(new THREE.PlaneGeometry(500, 140), new THREE.MeshStandardMaterial({ color: DB.sea, roughness: 0.2 }), { p: [0, 0.03, -200], r: [-Math.PI / 2, 0, 0] }));
  [[-38, -20, [18, 7, 12], '#e2b977', 1], [-22, 4, [12, 4, 9], '#ebc68b', 2], [34, -12, [20, 8, 12], '#dcae6c', 3], [26, 10, [10, 3.5, 8], '#ebc68b', 4], [-70, -45, [26, 12, 14], '#d9a865', 5], [70, -50, [28, 13, 14], '#d9a865', 6], [-14, 18, [8, 2.6, 6], '#efcf98', 7]]
    .forEach(([x, z, s, c, sd]) => w.add(dbDune([x as number, 0, z as number], s as [number, number, number], c as string, sd as number)));
  w.add(inkSunGlow([-40, 22, -280], 130, '#ff9a55')); w.add(p3Mesh(new THREE.CircleGeometry(9, 40), new THREE.MeshBasicMaterial({ color: '#ff8c42', fog: false }), { p: [-40, 20, -290] })); };
// a glass tower with lit window bands; returns the tower and its window material (to switch the lights off)
const dbTower = (w0: number, h: number, c: string, steps: number, spire: number, win: THREE.MeshBasicMaterial) => { const g = p3Group(), glass = dioSmooth(c, 0.25, 0.4); let y = 0, ww = w0;
  for (let i = 0; i < steps; i++) { const hh = h / steps; g.add(p3Mesh(new THREE.BoxGeometry(ww, hh, ww), glass, { p: [0, y + hh / 2, 0] }));
    for (let k = 1; k < hh / 1.4; k++) g.add(p3Mesh(p3Box(ww + 0.04, 0.12, ww + 0.04), win, { p: [0, y + k * 1.4, 0] })); y += hh; ww *= 0.78; }
  if (spire) g.add(p3Mesh(new THREE.ConeGeometry(ww * 0.4, spire, 8), dioSmooth('#dfe7f0', 0.3, 0.6), { p: [0, y + spire / 2, 0] }));
  return g; };
// the city: towers that rise out of the sand (grow 0..1) or sink back (grow 1..0); lights 0..1; plus the road, cars and palms
const dbCity = (w: World) => { const win = new THREE.MeshBasicMaterial({ color: '#ffe2a8' }), T: { g: THREE.Group; d: number }[] = [], R = p3Rnd(9), city = p3Group();
  const add = (x: number, z: number, wd: number, h: number, c: string, st: number, sp: number) => { const g = dbTower(wd, h, c, st, sp, win); g.position.set(x, 0, z); city.add(g); T.push({ g, d: R() }); };
  add(4, -150, 12, 150, '#7fb2e0', 7, 60);
  for (let i = 0; i < 34; i++) { const x = -120 + R() * 240, z = -110 - R() * 90; if (Math.abs(x - 4) < 16) continue; add(x, z, 5 + R() * 6, 18 + R() * 60, DB.glass[i % 4], 1 + Math.floor(R() * 3), R() < 0.3 ? 8 : 0); }
  const road = p3Group(p3Mesh(p3Box(8, 0.05, 200), dioSmooth('#3a3d47', 0.8), { p: [0, 0.03, -60] })); for (let z = 30; z > -150; z -= 6) road.add(p3Mesh(p3Box(0.25, 0.06, 2.5), dioSmooth('#ffffff', 0.6), { p: [0, 0.06, z] }));
  const cars: THREE.Group[] = []; for (let i = 0; i < 9; i++) { const car = p3Group(p3Mesh(new THREE.RoundedBoxGeometry(1.8, 0.7, 3.8, 2, 0.2), dioSmooth(['#ff4b4b', '#ffffff', '#ffd23f', '#3a3d47'][i % 4], 0.3), { p: [0, 0.55, 0] }), p3Mesh(new THREE.RoundedBoxGeometry(1.5, 0.55, 1.8, 2, 0.2), dioSmooth('#9fd6ff', 0.2), { p: [0, 1.1, -0.2] })); road.add(car); cars.push(car); }
  for (let z = 14; z > -60; z -= 9) for (const s of [-1, 1]) road.add(inkPalm([s * 6, 0, z], 1.6));
  w.add(city); w.add(road);
  return { city, road, pose: (t: number, grow: number, lights = 1) => { T.forEach(({ g, d }) => { const k = p3Clamp((grow - d * 0.5) / 0.5); g.visible = k > 0.01; g.scale.set(1, Math.max(0.001, k), 1); });
      road.visible = grow > 0.6; cars.forEach((c, i) => { c.position.set(i % 2 ? 1.9 : -1.9, 0, (i % 2 ? -1 : 1) * (((t * 9 + i * 14) % 130)) + (i % 2 ? -10 : -120)); c.rotation.y = i % 2 ? Math.PI : 0; });
      win.color.set(lights > 0.5 ? '#ffe2a8' : '#2a3140'); } }; };
// the camera on the desert: wide look at the city (u pushes in)
const dbCityCam = (w: World, u = 0, y = 6) => w.look([-6 + u * 3, y, 34 - u * 8], [2, 22 + (y - 6) * 0.3, -90], 50);

// ---------- the plan board: four tiles; shown = how many tiles are in, done = how many have a check, now = the lit one ----------
const DB_ICON = ['💧', '❄️', '🏗️', '⚡'];
const dbBoard = () => { const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 640; const c = cv.getContext('2d')!, tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(10, 6.25), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })); m.renderOrder = 900; let last = '';
  const draw = (shown: number, done: number, now: number, title: string) => { const k = `${shown}|${done}|${now}|${title}`; if (k === last) return; last = k;
    c.clearRect(0, 0, 1024, 640); c.fillStyle = 'rgba(12,24,48,0.9)'; c.beginPath(); c.roundRect(8, 8, 1008, 624, 36); c.fill(); c.strokeStyle = '#4fd8ff'; c.lineWidth = 10; c.stroke();
    c.textAlign = 'center'; c.font = '900 72px "RA Heavy", sans-serif'; c.fillStyle = '#ffd23f'; c.fillText(title, 512, 110);
    for (let i = 0; i < shown; i++) { const x = 140 + i * 248; c.strokeStyle = i === now ? '#ffd23f' : '#4fd8ff'; c.lineWidth = i === now ? 12 : 7; c.beginPath(); c.roundRect(x - 105, 170, 210, 250, 24); c.stroke();
      c.font = '110px sans-serif'; c.fillText(DB_ICON[i], x, 330); c.font = '900 44px "RA Heavy", sans-serif'; c.fillStyle = '#ffffff'; c.fillText(DB_PIECES[i], x, 520);
      if (i < done) { c.fillStyle = '#b6f23c'; c.beginPath(); c.arc(x + 80, 185, 34, 0, 6.3); c.fill(); c.strokeStyle = '#13203a'; c.lineWidth = 10; c.beginPath(); c.moveTo(x + 62, 186); c.lineTo(x + 76, 200); c.lineTo(x + 100, 170); c.stroke(); }
      c.fillStyle = '#ffd23f'; }
    tex.needsUpdate = true; };
  draw(0, 0, -1, 'EL PLAN'); return Object.assign(m, { draw }); };
// the progress tag (top left): the four pieces, done in green, the current one in yellow
const dbCaptionsTag = (w: World, done: number, now: number) => { const tag = document.createElement('div'); tag.className = 'db-tag';
  tag.innerHTML = DB_PIECES.map((p, i) => `<span class="${i < done ? 'done' : i === now ? 'now' : ''}">${i < done ? '✓ ' : ''}${p}</span>`).join(''); w.titles.appendChild(tag); };

// ---------- captions: one big word at a time ----------
const DB_FIX: Record<number, string> = { 85: 'uno', 142: 'salmuera', 143: '', 155: 'Jebel', 176: 'dos', 233: 'récord', 254: 'tres', 357: 'cuatro', 381: '3.800', 387: '7.000', 410: 'por tubos' };
const DB_COLOR: Record<string, string> = { desierto: 'y', imposible: 'r', plan: 'y', agua: 'g', frío: 'g', tierra: 'g', energía: 'g', mar: 'g', sal: 'r', desalinizadoras: 'g', membrana: 'g', presión: 'y', dulce: 'g', salmuera: 'r', '182': 'y', calor: 'r', muchísimo: 'r', tubos: 'g', récord: 'y', guinness: 'y', loco: 'y', redondos: 'r', resbalan: 'r', importan: 'y', palmera: 'g', '94': 'y', pared: 'r', electricidad: 'y', luz: 'r', sol: 'y', '3.800': 'y', '7.000': 'y', precio: 'r', apaga: 'r', máquina: 'y', siempre: 'y', uno: 'y', dos: 'y', tres: 'y', cuatro: 'y' };
const dbCaptions = (w: World) => {
  const el = document.createElement('div'); el.className = 'hp-cap'; w.titles.appendChild(el); let shown = -2;
  return (t: number) => { let i = -1; for (let k = 0; k < WORDS.length; k++) { if (WORDS[k].t0 <= t + 0.04 && (DB_FIX[k] ?? WORDS[k].w) !== '') i = k; if (WORDS[k].t0 > t + 0.04) break; }
    if (i >= 0 && t > WORDS[i].t1 + 0.4) i = -1;
    if (i !== shown) { shown = i; const txt = i < 0 ? '' : DB_FIX[i] ?? WORDS[i].w, key = txt.toLowerCase().replace(/[^a-záéíóúñ0-9.]/g, ''); el.textContent = txt; el.className = 'hp-cap ' + (DB_COLOR[key] ?? ''); }
    const a = i < 0 ? 0 : p3Clamp((t - WORDS[i].t0 + 0.04) / 0.08); el.style.opacity = String(a); el.style.transform = `translateX(-50%) scale(${0.8 + 0.2 * a})`; };
};
const dbLab = (w: World, top = '#2a3f6e', low = '#7f9fd0') => { w.scene.background = inkSkyTex(top, low, low); w.add(new THREE.HemisphereLight('#ffffff', '#6a7aa0', 1.3));
  const sun = new THREE.DirectionalLight('#fff4e0', 1.6); sun.position.set(6, 12, 10); w.add(sun); };
const dbPop = (t: number, k: number) => (t < k ? 0.001 : Math.max(0.001, p3Spring(t, k, 260, 16)));
const dbLab3 = (w: World, text: string, color: string, p: Vec3, h = 0.045, arrow = false) => { const l = w.add(dioLabel(text, color, h, arrow)); l.position.set(...p); return l; };

// ---------- desalination cutaway: sea water (blue) with salt (white) pushed through a membrane; fresh out left, brine out right ----------
// stage: 0 sea water flows in; 1 pressure (piston pushes); 2 the membrane filters (water passes, salt stays); 3 outputs
const dbDesal = () => { const g = p3Group(), glass = new THREE.MeshStandardMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.22, roughness: 0.1, depthWrite: false });
  const tube = p3Mesh(new THREE.CylinderGeometry(1.6, 1.6, 9, 32, 1, true), glass, { r: [0, 0, Math.PI / 2] }); g.add(tube);
  const mem = p3Mesh(p3Box(0.12, 3.1, 3.1), dioSmooth('#ffd23f', 0.5), { p: [1.2, 0, 0] }); g.add(mem);
  for (let y = -1.3; y <= 1.3; y += 0.26) for (let z = -1.3; z <= 1.3; z += 0.26) if (y * y + z * z < 2.4) g.add(p3Mesh(p3Box(0.14, 0.04, 0.04), dioSmooth('#7a5a10', 0.5), { p: [1.2, y, z] }));
  const piston = p3Group(p3Mesh(p3Cyl(1.5, 1.5, 0.3, 32), dioSmooth('#8a95a8', 0.4, 0.6), { r: [0, 0, Math.PI / 2] }), p3Mesh(p3Cyl(0.25, 0.25, 3, 12), dioSmooth('#8a95a8', 0.4, 0.6), { p: [-1.6, 0, 0], r: [0, 0, Math.PI / 2] })); g.add(piston);
  const fresh = p3Mesh(p3Cyl(0.5, 0.5, 4, 16), dioSmooth('#5fd0ff', 0.3), { p: [5.8, 0, 0], r: [0, 0, Math.PI / 2] }), brine = p3Tube([[0.6, -1.6, 0], [0.6, -3, 0], [-3, -3.6, 0], [-6, -3.6, 0]], 0.4, dioSmooth('#9aa3b0', 0.4), 20); g.add(fresh, brine);
  const N = 70, wsw = p3Swarm(N, new THREE.SphereGeometry(0.13, 8, 6), dioSmooth('#2f8fe0', 0.2)), ssw = p3Swarm(40, new THREE.BoxGeometry(0.17, 0.17, 0.17), dioSmooth('#ffffff', 0.4)); g.add(wsw, ssw);
  const R = p3Rnd(5), W = Array.from({ length: N }, () => [R(), (R() - 0.5) * 2.4, (R() - 0.5) * 2.4]), Sx = Array.from({ length: 40 }, () => [R(), (R() - 0.5) * 2.2, (R() - 0.5) * 2.2]);
  return Object.assign(g, { mem, fresh, brine, pose: (t: number, stage: number) => { const press = stage >= 1 ? 0.6 + 0.25 * Math.sin(t * 5) : 0; piston.position.x = -3.6 + press * 1.4;
    W.forEach(([ph, y, z], i) => { const u = (ph + t * (stage >= 2 ? 0.35 : 0.12)) % 1; let x = -3 + u * (stage >= 2 ? 8.5 : 4); if (stage < 2) x = Math.min(x, 1.0); wsw.put(i, x, y * (x > 1.3 ? 0.25 : 1), z * (x > 1.3 ? 0.25 : 1), 1); });
    Sx.forEach(([ph, y, z], i) => { const u = (ph + t * 0.12) % 1; const x = stage >= 2 ? Math.min(-3 + u * 4.5, 1.0) : -3 + u * 4; const drop = stage >= 3 && x > 0.6 ? Math.min(1, (t * 0.5 + ph) % 1) : 0; ssw.put(i, x - drop * 3, y - drop * 2.5, z, 1); });
    wsw.done(); ssw.done(); fresh.visible = brine.visible = stage >= 3; mem.visible = true; } }); };
// a faucet on a post in the sand with a stream (on 0..1)
const dbFaucet = () => { const g = p3Group(), metal = dioSmooth('#c9ced8', 0.25, 0.8);
  g.add(p3Mesh(p3Cyl(0.12, 0.12, 1.4, 12), metal, { p: [0, 0.7, 0] })); g.add(p3Mesh(p3Cyl(0.1, 0.1, 0.6, 12), metal, { p: [0.25, 1.35, 0], r: [0, 0, Math.PI / 2] }));
  g.add(p3Mesh(p3Cyl(0.08, 0.08, 0.25, 12), metal, { p: [0.52, 1.25, 0] })); const handle = p3Mesh(p3Box(0.5, 0.08, 0.08), dioSmooth('#ff4b4b', 0.4), { p: [0, 1.55, 0] }); g.add(handle);
  const stream = p3Mesh(p3Cyl(0.06, 0.08, 1, 10), new THREE.MeshStandardMaterial({ color: '#7fd6ff', transparent: true, opacity: 0.85, roughness: 0.1 }), { p: [0.52, 0.6, 0] }); g.add(stream);
  const pool = p3Mesh(new THREE.CircleGeometry(0.6, 24), new THREE.MeshStandardMaterial({ color: '#4fb6e6', transparent: true, opacity: 0.8, roughness: 0.1 }), { p: [0.52, 0.02, 0], r: [-Math.PI / 2, 0, 0] }); g.add(pool);
  return Object.assign(g, { pose: (t: number, on: number) => { handle.rotation.y = on * 1.2; stream.visible = on > 0.05; stream.scale.y = Math.max(0.001, on); stream.position.y = 1.12 - on * 0.5; pool.visible = on > 0.3; pool.scale.setScalar(0.3 + 0.7 * p3Clamp(on)); } }); };
// a tower front with an AC unit in every window (fans spin); count 0..1 shows them
const dbACTower = () => { const g = p3Group(p3Mesh(p3Box(8, 16, 4), dioSmooth('#a9d2f2', 0.3, 0.3), { p: [0, 8, 0] })), units: THREE.Object3D[] = [], fans: THREE.Mesh[] = [];
  for (let y = 1.6; y < 15.5; y += 2.2) for (let x = -2.9; x <= 3; x += 1.9) { g.add(p3Mesh(p3Box(1.3, 1.3, 0.05), new THREE.MeshBasicMaterial({ color: '#ffe2a8' }), { p: [x, y + 0.5, 2.03] }));
    const u = p3Group(p3Mesh(new THREE.RoundedBoxGeometry(1.1, 0.6, 0.6, 2, 0.06), dioSmooth('#f2f4f7', 0.4), {})); const f = p3Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 6), dioSmooth('#8a95a8', 0.4), { p: [0.25, 0, 0.32], r: [Math.PI / 2, 0, 0] }); u.add(f); fans.push(f);
    u.position.set(x, y - 0.35, 2.35); g.add(u); units.push(u); }
  return Object.assign(g, { pose: (t: number, count: number) => { units.forEach((u, i) => { u.visible = i / units.length < count; }); fans.forEach((f, i) => { f.rotation.y = t * 14 + i; }); } }); };
// cold-water network: a plant (left), pipes under the street (cutaway), buildings on top; flow 0..1
const dbCooling = () => { const g = p3Group(), soil = dioSmooth('#c79a5e', 0.95), pipeM = dioSmooth('#3aa6e0', 0.35);
  g.add(p3Mesh(p3Box(40, 4, 10), soil, { p: [6, -2, -5] })); g.add(p3Mesh(p3Box(40, 0.1, 10), dioSmooth('#3a3d47', 0.8), { p: [6, 0.05, -5] }));
  const plant = p3Group(p3Mesh(p3Box(6, 5, 6), dioSmooth('#f2f4f7', 0.5), { p: [0, 2.5, 0] }), p3Mesh(p3Box(6.1, 0.6, 6.1), dioSmooth(DB.cold, 0.4), { p: [0, 5.1, 0] }));
  for (const x of [-1.6, 0, 1.6]) plant.add(p3Mesh(p3Cyl(0.7, 0.7, 0.3, 16), dioSmooth('#8a95a8', 0.4), { p: [x, 5.55, 0] })); plant.position.set(-9, 0, -6); g.add(plant);
  const pipe = p3Tube([[-9, -1.5, -0.4], [0, -1.5, -0.4], [10, -1.5, -0.4], [22, -1.5, -0.4]], 0.35, pipeM, 30); g.add(pipe);
  const blds: THREE.Object3D[] = []; [[2, 10], [8, 14], [14, 9], [20, 12]].forEach(([x, h]) => { const b = dbTower(4, h, DB.glass[x % 4], 1, 0, new THREE.MeshBasicMaterial({ color: '#ffe2a8' })); b.position.set(x, 0, -6); g.add(b); blds.push(b);
    g.add(p3Mesh(p3Cyl(0.18, 0.18, 1.5, 10), pipeM, { p: [x, -0.75, -0.4] })); });
  const sw = p3Swarm(40, new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: '#e8fbff' })); g.add(sw);
  return Object.assign(g, { plant, pose: (t: number, flow: number) => { for (let i = 0; i < 40; i++) { const u = (i / 40 + t * 0.15) % 1, x = -9 + u * 31; if (flow < 0.05 || x > -9 + flow * 31) { sw.hide(i); continue; } sw.put(i, x, -1.5, -0.05, 1); } sw.done(); } }); };
// sand grains, macro: round desert grains (they roll apart) and angular grains (they lock); mode 0 round only, 1 sliding, 2 both
const dbGrains = () => { const g = p3Group(), R = p3Rnd(8), round: THREE.Mesh[] = [], sharp: THREE.Mesh[] = [];
  for (let i = 0; i < 26; i++) { const m = p3Mesh(new THREE.SphereGeometry(0.42, 20, 14), dioSmooth(['#f0d49a', '#e6c283', '#f5deaa'][i % 3], 0.5), { p: [-2.4 + (i % 6) * 0.82 + (R() - 0.5) * 0.1, 0.42 + Math.floor(i / 6) * 0.72, (R() - 0.5) * 0.6] }); g.add(m); round.push(m); }
  for (let i = 0; i < 26; i++) { const m = p3Mesh(new THREE.IcosahedronGeometry(0.48, 0), dioSmooth(['#b9a58a', '#a8916f', '#c9b493'][i % 3], 0.8), { p: [3.6 + (i % 6) * 0.72, 0.42 + Math.floor(i / 6) * 0.62, (R() - 0.5) * 0.4], r: [R() * 3, R() * 3, R() * 3] }); g.add(m); sharp.push(m); }
  const base = round.map((m) => m.position.clone());
  return Object.assign(g, { pose: (t: number, mode: number, slide: number) => { sharp.forEach((m) => { m.visible = mode >= 2; });
    round.forEach((m, i) => { const b = base[i], k = p3Clamp(slide) * (b.y / 3); m.position.set(b.x + (i % 2 ? 1 : -1) * k * 2.2, Math.max(0.42, b.y - k * 2.4), b.z); m.rotation.z = -k * 6 * (i % 2 ? 1 : -1); }); } }); };
// a cargo ship carrying a pile of sand (bow towards -x)
const dbShip = () => p3Group(p3Mesh(new THREE.BoxGeometry(14, 2.4, 4), dioSmooth('#2f3d5a', 0.6), { p: [0, 1.2, 0] }), p3Mesh(p3Box(14.05, 0.4, 4.05), dioSmooth('#d93b3b', 0.6), { p: [0, 0.5, 0] }),
  p3Mesh(new THREE.ConeGeometry(3, 2.6, 7), dioSmooth('#d8b673', 0.95), { p: [1, 3.6, 0] }), p3Mesh(p3Box(3, 3, 3.6), dioSmooth('#f2f4f7', 0.5), { p: [5.2, 3.9, 0] }));
// the palm-shaped island: trunk and 8 fronds that grow from the sea (grow 0..1); a dredger sprays a rainbow of sand
const dbIsland = () => { const g = p3Group(), sand = dioSmooth('#f0d49a', 0.9), parts: THREE.Mesh[] = [];
  const add = (geo: THREE.BufferGeometry, x: number, z: number, ry: number) => { const m = p3Mesh(geo, sand, { p: [x, 0.15, z] }); m.rotation.y = ry; g.add(m); parts.push(m); };
  add(new THREE.BoxGeometry(2.2, 0.5, 18), 0, 9, 0);
  for (let i = 0; i < 8; i++) { const s = i % 2 ? 1 : -1, z = -1 - Math.floor(i / 2) * 3.2, len = 8 - Math.floor(i / 2) * 0.8; add(new THREE.CapsuleGeometry(0.9, len, 4, 8).rotateZ(Math.PI / 2).scale(1, 0.4, 1), s * (len / 2 + 1), z, -s * 0.35); }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(15, 0.9, 6, 48, Math.PI * 1.6), sand); ring.rotation.set(Math.PI / 2, 0, Math.PI * 0.2); ring.scale.z = 0.4; ring.position.set(0, 0.15, -5); g.add(ring); parts.push(ring);
  const sw = p3Swarm(50, new THREE.SphereGeometry(0.22, 6, 4), dioSmooth('#f0d49a', 0.9)), dredger = p3Group(p3Mesh(new THREE.BoxGeometry(6, 1.6, 2.6), dioSmooth('#ff8a1f', 0.5), { p: [0, 0.8, 0] }), p3Mesh(p3Box(1.6, 2.2, 1.6), dioSmooth('#f2f4f7', 0.5), { p: [-1.6, 2.6, 0] }));
  dredger.position.set(14, 0, 8); g.add(sw, dredger);
  return Object.assign(g, { pose: (t: number, grow: number, spray: number) => { parts.forEach((m, i) => { const k = p3Clamp((grow - i / parts.length * 0.8) / 0.25); m.visible = k > 0.01; m.scale.y = Math.max(0.001, k); });
    for (let i = 0; i < 50; i++) { if (spray < 0.05) { sw.hide(i); continue; } const u = (i / 50 + t * 0.5) % 1, tgt = new THREE.Vector3(Math.sin(t * 0.7) * 4, 0, 4 - u * 0), a = new THREE.Vector3(13, 3, 8), p = a.lerp(tgt, u); sw.put(i, p.x, p.y + Math.sin(u * Math.PI) * 7, p.z, 1); } sw.done(); } }); };
// a brick wall that slams up (u 0..1)
const dbWall = () => { const g = p3Group(), m1 = dioSmooth('#c0532a', 0.9), m2 = dioSmooth('#a8441f', 0.9); for (let r = 0; r < 14; r++) for (let c = 0; c < 9; c++) g.add(p3Mesh(p3Box(1.9, 0.9, 1), (r + c) % 3 ? m1 : m2, { p: [-8 + c * 2 + (r % 2) * 1, 0.45 + r * 1, 0] }));
  return Object.assign(g, { pose: (u: number) => { g.visible = u > 0.01; g.position.y = (1 - p3Clamp(u)) * -14; } }); };
// a solar park: rows of tilted panels that fill in (u 0..1)
const dbSolar = () => { const g = p3Group(), pan = dioSmooth('#1d3a6e', 0.2, 0.5), frame = dioSmooth('#c9ced8', 0.4, 0.6), P: THREE.Object3D[] = [];
  for (let r = 0; r < 12; r++) for (let c = 0; c < 10; c++) { const p = p3Group(p3Mesh(p3Box(3.2, 0.08, 1.8), pan, { p: [0, 1.1, 0], r: [-0.45, 0, 0] }), p3Mesh(p3Cyl(0.05, 0.05, 1.1, 6), frame, { p: [0, 0.55, 0] }));
    for (let k = -1; k <= 1; k++) p.add(p3Mesh(p3Box(0.03, 0.09, 1.82), frame, { p: [k * 1.05, 1.1, 0], r: [-0.45, 0, 0] })); p.position.set(-17 + c * 3.8, 0, -r * 3.4); g.add(p); P.push(p); }
  return Object.assign(g, { pose: (u: number) => P.forEach((p, i) => { const k = p3Clamp((u - (i / P.length) * 0.7) / 0.3); p.visible = k > 0.01; p.scale.setScalar(Math.max(0.001, k)); }) }); };

// a worker card standing somewhere (and its shovel)
const dbShovel = () => p3Group(p3Mesh(p3Cyl(0.025, 0.025, 1.1, 8), dioSmooth('#8a5a3b', 0.7), { p: [0, 0.55, 0] }), p3Mesh(new THREE.RoundedBoxGeometry(0.26, 0.32, 0.03, 2, 0.02), dioSmooth('#9aa3b0', 0.4, 0.5), { p: [0, -0.1, 0] }));
const dbWorker = (w: World, at: Vec3, s = 1.75) => { const k = w.add(dioToon(DB_WORKER, s, 4)); k.position.set(...at); return k; };

defineVisuals({
  'test-sets': {
    bg: '#5f7fc8',
    build(w) { dbGround(w); const C = dbCity(w), wk = dbWorker(w, [-9, 4.5, 10]), b = w.add(dbBoard()); b.position.set(4, 20, -30);
      return (t) => { const u = t - w.s.t0; C.pose(t, Math.min(1, u / 2), 1); b.draw(4, Math.floor(u), Math.floor(u), 'EL PLAN'); wk.pose(w.camera, { expr: 'grin', mode: 'stand', wave: 1 }); dbCityCam(w, 0); }; },
  },
  'test-lab': {
    bg: '#2a3f6e',
    build(w) { dbLab(w); const D = w.add(dbDesal()); D.position.set(0, 4, 0);
      return (t) => { D.pose(t, Math.min(3, Math.floor(t - w.s.t0))); w.look([2, 6, 16], [1, 3, 0], 40); }; },
  },
});
