// Look test: a desert city at sunset in the channel's polished low-poly look, horizontal 16:9 (long video). Prefix pd.
const PD_WORKER: Toon.Outfit = { jacket: '#ff8a1f', pants: '#2f5fb5', boots: '#3a2a1e', hat: 'cap', cap: '#1f5fd6', scarf: '#d93b3b' };
// faceted dunes
const pdDune = (p: Vec3, s: [number, number, number], c: string, seed: number) => { const R = p3Rnd(seed), g = new THREE.SphereGeometry(1, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) { const k = 0.92 + R() * 0.12; pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * (0.9 + R() * 0.15), pos.getZ(i) * k); } g.computeVertexNormals(); g.scale(...s);
  const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, flatShading: true }); return p3Mesh(g, m, { p }); };
// a glass tower: stacked blocks that step in, with window bands and a spire
const pdTower = (p: Vec3, w: number, h: number, c: string, steps = 3, spire = 0) => { const g = p3Group(), glass = dioSmooth(c, 0.25, 0.4), band = new THREE.MeshBasicMaterial({ color: '#ffe2a8' }); let y = 0, ww = w;
  for (let i = 0; i < steps; i++) { const hh = h / steps; g.add(p3Mesh(new THREE.BoxGeometry(ww, hh, ww), glass, { p: [0, y + hh / 2, 0] }));
    for (let k = 1; k < hh / 1.2; k++) g.add(p3Mesh(p3Box(ww + 0.04, 0.08, ww + 0.04), band, { p: [0, y + k * 1.2, 0] })); y += hh; ww *= 0.78; }
  if (spire) g.add(p3Mesh(new THREE.ConeGeometry(ww * 0.4, spire, 8), dioSmooth('#dfe7f0', 0.3, 0.6), { p: [0, y + spire / 2, 0] }));
  g.position.set(...p); return g; };
const pdPalm = (p: Vec3, s = 1) => inkPalm(p, s);
// a floating "plan" board with four icons
const pdBoard = () => { const t = p3Paint(1024, 512, (c) => { c.fillStyle = 'rgba(12,24,48,0.88)'; c.fillRect(0, 0, 1024, 512); c.strokeStyle = '#4fd8ff'; c.lineWidth = 10; c.strokeRect(8, 8, 1008, 496);
    c.font = '900 64px "RA Heavy", sans-serif'; c.fillStyle = '#ffd23f'; c.textAlign = 'center'; c.fillText('EL PLAN', 512, 96);
    [['💧', 'AGUA'], ['❄️', 'FRÍO'], ['🏗️', 'ARENA'], ['⚡', 'ENERGÍA']].forEach(([ic, tx], i) => { const x = 140 + i * 248; c.strokeStyle = '#4fd8ff'; c.lineWidth = 6; c.strokeRect(x - 100, 150, 200, 200); c.font = '96px sans-serif'; c.fillText(ic, x, 290); c.font = '900 40px "RA Heavy", sans-serif'; c.fillStyle = '#ffffff'; c.fillText(tx, x, 420); c.fillStyle = '#ffd23f'; }); });
  t.colorSpace = THREE.SRGBColorSpace; return new THREE.Mesh(new THREE.PlaneGeometry(10, 5), new THREE.MeshBasicMaterial({ map: t, transparent: true })); };

const pdSet = (w: World) => {
  inkLights(w, 'sunset', [80, 400]);
  // ground: sand, a road with cars, the sea with a palm-shaped island
  w.add(p3Mesh(p3Box(400, 1, 400), dioSmooth('#e9c58a', 0.95), { p: [0, -0.5, -100] }));
  const sea = w.add(p3Mesh(new THREE.PlaneGeometry(400, 120), new THREE.MeshStandardMaterial({ color: '#2f9fd6', roughness: 0.2 }), { p: [0, 0.02, -170], r: [-Math.PI / 2, 0, 0] }));
  w.add(p3Mesh(p3Box(8, 0.05, 200), dioSmooth('#3a3d47', 0.8), { p: [0, 0.03, -60] })); for (let z = 30; z > -150; z -= 6) w.add(p3Mesh(p3Box(0.25, 0.06, 2.5), dioSmooth('#ffffff', 0.6), { p: [0, 0.06, z] }));
  for (let i = 0; i < 9; i++) { const car = p3Group(p3Mesh(new THREE.RoundedBoxGeometry(1.8, 0.7, 3.8, 2, 0.2), dioSmooth(['#ff4b4b', '#ffffff', '#ffd23f', '#3a3d47'][i % 4], 0.3), { p: [0, 0.55, 0] }), p3Mesh(new THREE.RoundedBoxGeometry(1.5, 0.55, 1.8, 2, 0.2), dioSmooth('#9fd6ff', 0.2), { p: [0, 1.1, -0.2] })); car.position.set(i % 2 ? 1.9 : -1.9, 0, 10 - i * 14); w.add(car); }
  // skyline: one supertall stepped tower with a spire, and a crowd of towers round it
  w.add(pdTower([4, 0, -150], 12, 150, '#7fb2e0', 7, 60));
  const R = p3Rnd(9); for (let i = 0; i < 30; i++) { const x = -120 + R() * 240, z = -120 - R() * 80; if (Math.abs(x - 4) < 16) continue;
    w.add(pdTower([x, 0, z], 5 + R() * 6, 18 + R() * 60, ['#5f9bd6', '#8cc0ea', '#4e86c2', '#a9d2f2'][i % 4], 1 + Math.floor(R() * 3), R() < 0.3 ? 8 : 0)); }
  // desalination plant: tanks and pipes by the sea
  for (let i = 0; i < 5; i++) { w.add(p3Mesh(p3Cyl(3, 3, 6, 24), dioSmooth('#f2f4f7', 0.4), { p: [-60 + i * 7.5, 3, -128] })); w.add(p3Mesh(p3Cyl(3.1, 3.1, 0.4, 24), dioSmooth('#3aa6e0', 0.4), { p: [-60 + i * 7.5, 6.2, -128] })); }
  // dunes in front, palms by the road
  [[-38, 0, -20, [18, 7, 12], '#e2b977', 1], [-22, 0, 4, [12, 4, 9], '#ebc68b', 2], [34, 0, -12, [20, 8, 12], '#dcae6c', 3], [26, 0, 10, [10, 3.5, 8], '#ebc68b', 4], [-70, 0, -45, [26, 12, 14], '#d9a865', 5], [70, 0, -50, [28, 13, 14], '#d9a865', 6]]
    .forEach(([x, y, z, s, c, sd]) => w.add(pdDune([x as number, y as number, z as number], s as [number, number, number], c as string, sd as number)));
  for (let z = 14; z > -60; z -= 9) for (const s of [-1, 1]) w.add(pdPalm([s * 6, 0, z], 1.6));
  // sun, glow
  w.add(inkSunGlow([-40, 22, -250], 120, '#ff9a55')); w.add(p3Mesh(new THREE.CircleGeometry(9, 40), new THREE.MeshBasicMaterial({ color: '#ff8c42', fog: false }), { p: [-40, 20, -260] }));
  const board = w.add(pdBoard()); board.position.set(22, 18, -30); board.rotation.y = -0.3;
  const worker = w.add(dioToon(PD_WORKER, 1.75, 4)); worker.position.set(-9, 4.5, 10);
  return { worker, sea };
};
defineVisuals({
  'dubai-low': { bg: '#5f7fc8', build(w) { const S = pdSet(w); return () => { S.worker.pose(w.camera, { expr: 'grin', mode: 'stand', wave: 1 }); w.look([-6, 6, 34], [2, 22, -90], 44); }; } },
  'dubai-tinta': { bg: '#5f7fc8', build(w) { const S = pdSet(w); inkLook(w, { focus: 40, blur: 2 }); return () => { S.worker.pose(w.camera, { expr: 'grin', mode: 'stand', wave: 1 }); w.look([-6, 6, 34], [2, 22, -90], 44); }; } },
});
