// Look test for the "ink" style: the same backyard (cutaway, finished pool, worker) with a mansion and a rich background,
// once in the channel's current look and once with the cartoon ink finish at sunset. Prefix pt.

const PT_WORKER: Toon.Outfit = { jacket: '#ff8a1f', pants: '#2f5fb5', boots: '#3a2a1e', hat: 'cap', cap: '#1f5fd6' };
const ptSet = (w: World, ink: boolean) => {
  if (ink) inkLights(w, 'sunset'); else dioLights(w);
  // land: a block cut open at the front, the pool in the middle
  const soil = dioSoil(); soil.repeat.set(1.5, 1); const face = new THREE.MeshStandardMaterial({ map: soil, roughness: 0.95 }), grass = dioSmooth('#86b85c', 0.95), dark = dioSmooth('#6b3c1c', 0.95);
  const block = (x0: number, x1: number, y0: number, z0: number) => w.add(new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, -y0, -z0), [dark, dark, grass, dark, face, dark])).position.set((x0 + x1) / 2, y0 / 2, z0 / 2);
  block(-9, -2, -4, -30); block(2, 9, -4, -30); w.add(new THREE.Mesh(new THREE.BoxGeometry(4, 4, 22), [dark, dark, grass, dark, face, dark])).position.set(0, -2, -19); w.add(new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 8), [dark, dark, dark, dark, face, dark])).position.set(0, -2.75, -4);
  const wall = dioSmooth('#dff4ff', 0.4); w.add(p3Mesh(p3Box(4, 0.1, 8), wall, { p: [0, -1.45, -4] })); w.add(p3Mesh(p3Box(0.12, 1.5, 8), wall, { p: [-1.94, -0.75, -4] })); w.add(p3Mesh(p3Box(0.12, 1.5, 8), wall, { p: [1.94, -0.75, -4] })); w.add(p3Mesh(p3Box(4, 1.5, 0.12), wall, { p: [0, -0.75, -7.94] }));
  const water = w.add(new THREE.Mesh(new THREE.BoxGeometry(3.76, 1.25, 7.85), new THREE.MeshStandardMaterial({ color: '#2f9be8', transparent: true, opacity: 0.72, roughness: 0.15, depthWrite: false }))); water.position.set(0, -0.82, -3.95);
  for (const s of [-1, 1]) w.add(p3Mesh(p3Box(0.4, 0.08, 8.3), dioSmooth('#f2ece0', 0.6), { p: [s * 2.1, 0.04, -4] })); w.add(p3Mesh(p3Box(4.6, 0.08, 0.4), dioSmooth('#f2ece0', 0.6), { p: [0, 0.04, -8.1] }));
  // garden: mansion, path, hedges, palms, lamps, flowers, a lounger and an umbrella
  w.add(inkMansion([0, 0, -16], 0, 1.05));
  w.add(p3Mesh(p3Box(1.4, 0.03, 6), dioSmooth('#d9c7a6', 0.9), { p: [0, 0.015, -11.5] }));
  for (const s of [-1, 1]) { w.add(inkHedge([s * 2.2, 0, -11], 2.4)); w.add(inkHedge([s * 6.5, 0, -12], 3.2)); w.add(inkPalm([s * 3.6, 0, -9.6], 1.05)); w.add(inkLamp([s * 1.2, 0, -9.2])); w.add(inkPalm([s * 7.5, 0, -6], 1.2)); }
  for (let i = 0; i < 14; i++) { const x = -8 + (i * 1.23) % 16, z = -1 - ((i * 2.7) % 6); if (Math.abs(x) < 2.6) continue; w.add(p3Mesh(new THREE.SphereGeometry(0.12, 8, 6), ['#ff5d8f', '#ffd23f', '#ffffff', '#b06cff'][i % 4], { p: [x, 0.12, z] })); }
  w.add(p3Mesh(new THREE.RoundedBoxGeometry(0.7, 0.2, 1.8, 2, 0.06), dioSmooth('#ffffff', 0.6), { p: [3.4, 0.35, -3] })); w.add(p3Mesh(p3Cyl(0.04, 0.04, 2, 8), '#ddd', { p: [4.4, 1, -2.5] }));
  const umb = new THREE.ConeGeometry(1.2, 0.5, 8); w.add(p3Mesh(umb, dioSmooth('#ff4b4b', 0.6), { p: [4.4, 2.1, -2.5] }));
  // far: neighbours, pines, hills, mountains, clouds, sun
  for (const [x, z, s] of [[-14, -22, 1.2], [13, -24, 1.3], [-20, -30, 1.1]]) w.add(dioHouse([x, 0, z], 0.3, s));
  for (let i = 0; i < 60; i++) { const x = -30 + (i * 1.7) % 60, z = -24 - ((i * 7) % 5) * 2.2; w.add(inkPine([x, 0, z], 1.8 + ((i * 3) % 5) * 0.35, ['#1f5a3a', '#2a6b43', '#184d31'][i % 3])); }
  for (const [x, z, s] of [[-8, -6, 1.3], [8.5, -3, 1.1], [-9, 1, 1.0]]) w.add(inkPine([x, 0, z], s, '#2a6b43'));
  inkHills(w, -45, ['#2c6a47', '#356f4b', '#3d7a52']); if (ink) { w.add(inkSunGlow([-5, 7, -70], 46)); w.add(p3Mesh(new THREE.CircleGeometry(3, 32), new THREE.MeshBasicMaterial({ color: '#ff9a52', fog: false }), { p: [-5, 6, -72] })); } else { const sun = w.add(dioSun()); sun.position.set(-10, 7, -58); sun.scale.setScalar(1.6); }
  const worker = w.add(dioToon(PT_WORKER, 1.75, 4)); worker.position.set(-2.6, 0, -1.0);
  return { worker };
};
defineVisuals({
  antes: { bg: '#5bb8f5', build(w) { const S = ptSet(w, false); return () => { S.worker.pose(w.camera, { expr: 'grin', mode: 'stand', wave: 1 }); w.look([-0.3, 3.8, 8.0], [-0.7, 0.9, -8], 50); }; } },
  tinta: { bg: '#5bb8f5', build(w) { const S = ptSet(w, true); inkLook(w); return () => { S.worker.pose(w.camera, { expr: 'grin', mode: 'stand', wave: 1 }); w.look([-0.3, 3.8, 8.0], [-0.7, 0.9, -8], 50); }; } },
  'tinta-cerca': { bg: '#5bb8f5', build(w) { const S = ptSet(w, true); inkLook(w, { focus: 6 }); return () => { S.worker.pose(w.camera, { expr: 'grin', mode: 'stand', wave: 1 }); w.look([-1.0, 1.7, 4.0], [-2.6, 1.0, -1.0], 42); }; } },
});
