// World of "Este puntito verde: una app está usando tu cámara" (3D, the channel's diorama look). Prefix pv.
// Retention rules (test #2): frame 0 in motion, prize at ~3 s, a change every 1-2 s, comment question, loop.
// One idea: "the green dot tells you an app is using your camera". Sources: fuentes.md.

const PV = { sky: '#5bb8f5', green: '#34d058', orange: '#ff9f0a', key: '#b6f23c', red: '#e5484d', glove: '#ffffff', wall: '#f3e6d6', floor: '#c98a4b' };
const PV_FIX: Record<number, string> = { 2: 'verde:', 46: 'cuál:', 85: 'veas' };   // what Whisper wrote differently from the script
const PV_W = 0.17, PV_H = 0.35;   // phone size (m): a big, toy-like phone

// ---------- the phone: rounded body, screen drawn on a canvas (status bar, the dot, apps, the panel, an eye), front camera ----------
interface PvScreen { dot?: 'green' | 'orange' | null; pulse?: number; panel?: number; app?: number; eye?: number; android?: boolean; tapRing?: number }
const pvPhone = (android = false) => {
  const g = p3Group(), body = p3Mesh(new THREE.RoundedBoxGeometry(PV_W, PV_H, 0.016, 4, 0.02), dioSmooth('#1d1f25', 0.35, 0.3)); g.add(body);
  for (const [y, h] of [[0.08, 0.04], [0.02, 0.04]]) g.add(p3Mesh(new THREE.RoundedBoxGeometry(0.004, h, 0.01, 2, 0.002), dioSmooth('#3a3f4a', 0.4), { p: [-PV_W / 2 - 0.001, y, 0] }));
  const cv = document.createElement('canvas'); cv.width = 480; cv.height = 1000; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(PV_W - 0.012, PV_H - 0.012), new THREE.MeshBasicMaterial({ map: tex })); screen.position.z = 0.0085; g.add(screen);
  // the front camera: a lens in the screen's top center (punch hole on Android, a pill on the other)
  const lensRing = p3Mesh(new THREE.TorusGeometry(0.009, 0.0025, 8, 24), new THREE.MeshBasicMaterial({ color: PV.green, transparent: true }), { p: [0, PV_H / 2 - 0.022, 0.0095] }); g.add(lensRing);
  let last = '';
  const draw = (s: PvScreen) => { const c = cv.getContext('2d')!, W = 480, H = 1000, k = JSON.stringify(s); if (k === last) return; last = k;
    const bg = c.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#2f6fde'); bg.addColorStop(1, '#8e5bd6'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
    // app grid (invented apps), with "FotoFiltro" among them
    const cols = ['#ff5f57', '#ffbd2e', '#28c840', '#3aa6ff', '#ff7aa8', '#b6f23c', '#f2a03d', '#ffffff'];
    for (let i = 0; i < 16; i++) { const x = 40 + (i % 4) * 105, y = 150 + Math.floor(i / 4) * 130; c.fillStyle = cols[i % cols.length]; c.beginPath(); c.roundRect(x, y, 80, 80, 20); c.fill(); }
    c.fillStyle = '#ffffff'; c.beginPath(); c.roundRect(40 + 105, 150 + 130, 80, 80, 20); c.fill(); c.fillStyle = '#e5484d'; c.beginPath(); c.arc(40 + 105 + 40, 150 + 130 + 40, 22, 0, 7); c.fill();   // FotoFiltro's icon
    // the camera cutout and the status bar
    c.fillStyle = '#05060a'; if (android) { c.beginPath(); c.arc(W / 2, 38, 16, 0, 7); c.fill(); } else { c.beginPath(); c.roundRect(W / 2 - 70, 18, 140, 40, 20); c.fill(); }
    c.fillStyle = '#ffffff'; c.font = '700 30px sans-serif'; c.textAlign = 'left'; c.fillText('9:41', 40, 50); c.fillRect(W - 90, 30, 46, 22); c.fillRect(W - 135, 34, 8, 18); c.fillRect(W - 123, 30, 8, 22);
    // the indicator dot: right of the cutout (top right on Android), pulsing
    if (s.dot) { const r = 13 * (1 + 0.25 * (s.pulse ?? 0)); c.fillStyle = s.dot === 'green' ? PV.green : PV.orange; c.beginPath(); c.arc(android ? W - 160 : W / 2 + 95, 40, r, 0, 7); c.fill(); }
    // the eye: an app is watching
    if ((s.eye ?? 0) > 0.02) { c.globalAlpha = s.eye!; c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(W / 2, 620, 170, 100, 0, 0, 7); c.fill(); c.fillStyle = '#1b2433'; c.beginPath(); c.arc(W / 2 + 20, 620, 60, 0, 7); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(W / 2 + 40, 600, 16, 0, 7); c.fill(); c.globalAlpha = 1; }
    // the panel that slides down from the top (Control Center / quick settings), with the app's name
    const p = s.panel ?? 0; if (p > 0.02) { const ph = 420 * p; c.fillStyle = 'rgba(20,24,36,0.92)'; c.beginPath(); c.roundRect(14, 0, W - 28, ph, 34); c.fill();
      if (p > 0.6) { c.globalAlpha = Math.min(1, (p - 0.6) / 0.3); c.fillStyle = PV.green; c.beginPath(); c.roundRect(40, 90, W - 80, 90, 45); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(95, 135, 26, 0, 7); c.fill(); c.fillStyle = PV.green; c.beginPath(); c.arc(95, 135, 12, 0, 7); c.fill();
        if ((s.app ?? 0) > 0.02) { c.fillStyle = '#ffffff'; c.font = '900 46px "RA Heavy", sans-serif'; c.textAlign = 'left'; c.fillText('FotoFiltro', 140, 152); }
        for (let i = 0; i < 4; i++) { c.fillStyle = '#3a4258'; c.beginPath(); c.roundRect(40 + i * 105, 220, 85, 85, 22); c.fill(); }
        if (android && (s.tapRing ?? 0) > 0.02) { c.strokeStyle = PV.key; c.lineWidth = 8; c.beginPath(); c.arc(95, 135, 40 + 20 * s.tapRing!, 0, 7); c.stroke(); } c.globalAlpha = 1; } }
    tex.needsUpdate = true; };
  // lens 0..1 lights the ring around the front camera (green or orange)
  const pose = (s: PvScreen & { lens?: number }) => { draw({ ...s, pulse: s.pulse !== undefined ? Math.round(s.pulse * 8) / 8 : 0 }); const L = s.lens ?? 0; lensRing.visible = L > 0.02; lensRing.scale.setScalar(1 + 0.6 * L);
    (lensRing.material as THREE.MeshBasicMaterial).color.set(s.dot === 'orange' ? PV.orange : PV.green); (lensRing.material as THREE.MeshBasicMaterial).opacity = L; };
  pose({});
  return Object.assign(g, { pose });
};
// the dot's and the lens's positions on a phone, in world coordinates
const pvDotAt = (ph: THREE.Object3D, android = false) => { ph.updateMatrixWorld(true); return ph.localToWorld(new THREE.Vector3(((android ? 480 - 160 : 240 + 95) / 480 - 0.5) * (PV_W - 0.012), PV_H / 2 - 0.006 - (40 / 1000) * (PV_H - 0.012), 0.01)); };
const pvLensAt = (ph: THREE.Object3D) => { ph.updateMatrixWorld(true); return ph.localToWorld(new THREE.Vector3(0, PV_H / 2 - 0.022, 0.01)); };

// ---------- hands: one that holds the phone, one that points and swipes ----------
const pvHolder = () => { const m = dioSmooth(PV.glove, 0.55), g = p3Group(p3Mesh(new THREE.RoundedBoxGeometry(0.13, 0.12, 0.05, 3, 0.025), m, { p: [0, -0.1, -0.03] }));
  g.add(p3Mesh(new THREE.CapsuleGeometry(0.016, 0.06, 4, 8), m, { p: [-0.085, -0.06, 0.0], r: [0, 0, 0.4] }));   // thumb on the side
  for (let i = 0; i < 3; i++) g.add(p3Mesh(new THREE.CapsuleGeometry(0.014, 0.04, 4, 8), m, { p: [0.088, -0.11 + i * 0.03, -0.005], r: [0, 0, Math.PI / 2] }));
  g.add(p3Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.05, 18), dioSmooth(PV.key, 0.5), { p: [0, -0.19, -0.03] })); return g; };
const pvPointer = () => { const m = dioSmooth(PV.glove, 0.55), g = p3Group(p3Mesh(new THREE.RoundedBoxGeometry(0.06, 0.075, 0.03, 3, 0.014), m, { p: [0, -0.01, 0] }));
  g.add(p3Mesh(new THREE.CapsuleGeometry(0.011, 0.05, 4, 10), m, { p: [0.012, 0.06, 0] }));
  for (const [x, y] of [[-0.016, 0.025], [-0.026, 0.02], [0.0, 0.028]]) g.add(p3Mesh(new THREE.SphereGeometry(0.013, 12, 8), m, { p: [x, y, 0.01] }));
  g.add(p3Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.025, 18), dioSmooth(PV.key, 0.5), { p: [0, -0.06, 0] }));
  // the fingertip at a point, coming from a direction
  const pose = (at: THREE.Vector3, from: THREE.Vector3) => { const dir = at.clone().sub(from).normalize(); g.position.copy(at).addScaledVector(dir, -0.09); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); };
  return Object.assign(g, { pose }); };
// a microphone that pops up next to the phone
const pvMic = () => p3Group(p3Mesh(new THREE.CapsuleGeometry(0.022, 0.035, 6, 16), dioSmooth(PV.orange, 0.35), { p: [0, 0.04, 0] }), p3Mesh(new THREE.TorusGeometry(0.03, 0.005, 8, 20, Math.PI), dioSmooth('#c9ced8', 0.3, 0.6), { p: [0, 0.03, 0], r: [0, 0, Math.PI] }), p3Mesh(p3Cyl(0.004, 0.004, 0.03, 8), dioSmooth('#c9ced8', 0.3, 0.6), { p: [0, -0.01, 0] }), p3Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.006, 16), dioSmooth('#c9ced8', 0.3, 0.6), { p: [0, -0.027, 0] }));
// rings pulsing out of a point (the dot "calling" you)
const pvPulse = (color: string) => { const rings = [0, 1, 2].map(() => new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32), new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, side: THREE.DoubleSide }))), g = p3Group(...rings);
  return Object.assign(g, { pose: (t: number, on: number) => rings.forEach((r, i) => { const u = (t * 0.9 + i / 3) % 1; r.visible = on > 0.02; r.scale.setScalar(0.006 + u * 0.035); (r.material as THREE.MeshBasicMaterial).opacity = on * (1 - u); }) }); };

// ---------- the living room diorama: wood floor block, two walls with a window, sofa, rug, coffee table, lamp, plant, shelf ----------
const pvRoom = () => { const g = p3Group(), plank = p3Paint(256, 256, (c) => { c.fillStyle = '#c98a4b'; c.fillRect(0, 0, 256, 256); c.fillStyle = 'rgba(90,45,15,0.25)'; for (let y = 0; y < 256; y += 32) c.fillRect(0, y, 256, 3); for (let i = 0; i < 24; i++) c.fillRect((i * 71) % 256, Math.floor(i / 3) * 32, 3, 32); });
  plank.wrapS = plank.wrapT = THREE.RepeatWrapping; plank.repeat.set(3, 3); plank.colorSpace = THREE.SRGBColorSpace; const side = dioSmooth('#8a5a3b', 0.8);
  const blk = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 2.4), [side, side, new THREE.MeshStandardMaterial({ map: plank, roughness: 0.7 }), side, side, side]); blk.position.y = -0.15; blk.receiveShadow = true; g.add(blk);
  g.add(p3Mesh(p3Box(3, 1.8, 0.08), dioSmooth(PV.wall, 0.8), { p: [0, 0.9, -1.16] }), p3Mesh(p3Box(0.08, 1.8, 2.4), dioSmooth('#e9d9c5', 0.8), { p: [-1.46, 0.9, 0] }));
  g.add(p3Mesh(new THREE.RoundedBoxGeometry(0.8, 0.6, 0.03, 2, 0.02), dioSmooth('#ffffff', 0.5), { p: [0.6, 1.1, -1.11] }), p3Mesh(new THREE.PlaneGeometry(0.72, 0.52), new THREE.MeshBasicMaterial({ color: '#9fd6ff' }), { p: [0.6, 1.1, -1.09] }));
  // sofa
  const sofa = dioSmooth('#2fb36e', 0.8); g.add(p3Mesh(new THREE.RoundedBoxGeometry(1.5, 0.22, 0.6, 3, 0.06), sofa, { p: [-0.35, 0.24, -0.75] }), p3Mesh(new THREE.RoundedBoxGeometry(1.5, 0.45, 0.16, 3, 0.06), sofa, { p: [-0.35, 0.5, -1.0] }));
  for (const x of [-1.05, 0.35]) g.add(p3Mesh(new THREE.RoundedBoxGeometry(0.16, 0.36, 0.6, 3, 0.06), sofa, { p: [x, 0.3, -0.75] }));
  for (const [x, c] of [[-0.7, '#ffcf4a'], [0.0, '#ff7aa8']] as const) g.add(p3Mesh(new THREE.RoundedBoxGeometry(0.32, 0.28, 0.1, 3, 0.05), dioSmooth(c, 0.85), { p: [x, 0.52, -0.88], r: [-0.2, 0, 0] }));
  // rug, coffee table with a mug and a book, floor lamp, plant, shelf with books
  g.add(p3Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.01, 40), dioSmooth('#e5484d', 0.95), { p: [0.05, 0.006, 0.05] }));
  g.add(p3Mesh(new THREE.RoundedBoxGeometry(0.8, 0.05, 0.45, 2, 0.02), dioSmooth('#8a5a3b', 0.5), { p: [0.05, 0.38, 0.05] }));
  for (const [x, z] of [[-0.3, -0.14], [0.4, -0.14], [-0.3, 0.24], [0.4, 0.24]]) g.add(p3Mesh(p3Cyl(0.02, 0.02, 0.36, 8), dioSmooth('#6b4425', 0.6), { p: [x, 0.18, z] }));
  g.add(p3Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 18), dioSmooth('#3aa6ff', 0.4), { p: [0.32, 0.45, 0.12] }), p3Mesh(new THREE.RoundedBoxGeometry(0.2, 0.03, 0.14, 2, 0.008), dioSmooth('#f2a03d', 0.6), { p: [-0.18, 0.42, 0.12], r: [0, 0.3, 0] }));
  g.add(p3Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.02, 20), dioSmooth('#2a2f3a', 0.5), { p: [1.15, 0.01, -0.85] }), p3Mesh(p3Cyl(0.012, 0.012, 1.3, 8), dioSmooth('#2a2f3a', 0.5), { p: [1.15, 0.66, -0.85] }), p3Mesh(new THREE.ConeGeometry(0.18, 0.22, 20, 1, true), dioSmooth('#fff1c2', 0.5), { p: [1.15, 1.35, -0.85], e: 0.4 }));
  g.add(p3Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.22, 16), dioSmooth('#c2683a', 0.7), { p: [-1.2, 0.11, 0.7] }));
  for (const [x, y, z, r] of [[-1.2, 0.36, 0.7, 0.16], [-1.15, 0.5, 0.74, 0.12], [-1.26, 0.48, 0.66, 0.12]]) g.add(p3Mesh(new THREE.IcosahedronGeometry(r, 1), dioSmooth('#4caf3e', 0.7), { p: [x, y, z] }));
  g.add(p3Mesh(p3Box(0.6, 0.03, 0.2), dioSmooth('#8a5a3b', 0.5), { p: [1.0, 0.95, -1.06] }));
  for (let i = 0; i < 6; i++) g.add(p3Mesh(p3Box(0.05, 0.16 + (i % 3) * 0.03, 0.14), dioSmooth(['#1f5fd6', '#e5484d', '#ffcf4a', '#2fb36e', '#8e5bd6', '#f2a03d'][i], 0.6), { p: [0.78 + i * 0.07, 1.05 + (i % 3) * 0.015, -1.06] }));
  return g; };
// the room set: light, sky outside, the room, the hero phone held up in front of the sofa
const pvRoomSet = (w: World) => { dioLights(w); [[-2.5, 2.6, -4, 0.9], [2.6, 3.0, -4.5, 1.1]].forEach(([x, y, z, s]) => w.add(dioCloud([x, y, z], s)));
  w.add(pvRoom()); const phone = w.add(pvPhone()), holder = w.add(pvHolder()), pulse = w.add(pvPulse(PV.green));
  return { phone, holder, pulse, cap: dioCaptions(w, PV_FIX) }; };
// held: the phone up in the hand, slightly turned; on the table: lying flat
const pvHeld = (S: ReturnType<typeof pvRoomSet>, t: number) => { S.phone.position.set(0.1, 0.95 + 0.006 * Math.sin(t * 1.3), 0.35); S.phone.rotation.set(-0.12, -0.2, 0.03 * Math.sin(t * 0.9)); S.holder.visible = true;
  S.holder.position.copy(S.phone.position); S.holder.rotation.copy(S.phone.rotation); };
const pvOnTable = (S: ReturnType<typeof pvRoomSet>) => { S.phone.position.set(0.05, 0.415, 0.02); S.phone.rotation.set(-Math.PI / 2, 0, 0.35); S.holder.visible = false; };
