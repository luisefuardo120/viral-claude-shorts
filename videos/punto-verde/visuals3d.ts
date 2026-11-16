// Scenes of "Este puntito verde: una app está usando tu cámara". A change every 1-2 s (hard cut, pop or label); the last
// scene ends on frame 0's shot so the video loops. Times are absolute video seconds.

const pvU = (w: World, t: number) => p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0));
const pvGrow = (t: number, k: number) => p3Ramp(t, k, k + 0.4);
const pvPop = (t: number, k: number) => (t < k ? 0.001 : Math.max(0.001, p3Spring(t, k, 260, 16)));
const pvBeat = (t: number) => 0.5 + 0.5 * Math.sin(t * 7);
// frame 0's shot: the phone in hand, the room behind; u pushes in a little
const pvHookCam = (w: World, S: ReturnType<typeof pvRoomSet>, u: number) => { const p = S.phone.position; w.look([p.x + 0.1 - u * 0.03, p.y + 0.16, p.z + 0.72 - u * 0.1], [p.x, p.y + 0.09, p.z], 38); };   // the phone big, its top (the dot) mid-frame
// close on the dot
const pvDotCam = (w: World, S: ReturnType<typeof pvRoomSet>, d = 0.32) => { const a = pvDotAt(S.phone); w.look([a.x + 0.02, a.y - 0.0, a.z + d], [a.x - 0.02, a.y - 0.08 * d, a.z], 36); };   // the dot a bit above the center: clear of the title and the captions   // aim above the dot: it sits mid-frame, under the title

defineVisuals({
  // 1. (0 s) the green dot pulsing in the hand; cut close on it; AL FINAL: ¿CUÁL?
  hook: {
    bg: PV.sky,
    build(w) { const S = pvRoomSet(w), lab = w.add(dioLabel('PUNTO VERDE', PV.green, 0.045, true)), fin = w.add(dioLabel('AL FINAL: ¿CUÁL?', PV.key, 0.04));
      return (t) => { const kc = w.K('corte'), kf = w.K('final'); pvHeld(S, t); S.phone.pose({ dot: 'green', pulse: pvBeat(t) }); const d = pvDotAt(S.phone); S.pulse.position.copy(d).add(new THREE.Vector3(0, 0, 0.003)); S.pulse.pose(t, 1);
        lab.position.copy(d).add(new THREE.Vector3(0, 0.006, 0)); lab.pose(pvPop(t, 0.25)); fin.position.copy(pvDotAt(S.phone)).add(new THREE.Vector3(-0.03, -0.075, 0.02)); fin.pose(pvPop(t, kf));
        if (t < kc) pvHookCam(w, S, p3Clamp((t - w.s.t0) / 1.4)); else pvDotCam(w, S, t < kf ? 0.38 : 0.6); S.cap(t); }; },
  },
  // 2. (5 s) the phone itself lights it, not the app: the front camera glows
  sistema: {
    bg: PV.sky,
    build(w) { const S = pvRoomSet(w), lab = w.add(dioLabel('CÁMARA ENCENDIDA', PV.green, 0.042, true));
      return (t) => { const kl = w.K('lente'), ka = w.K('app'); pvHeld(S, t); S.phone.pose({ dot: 'green', pulse: pvBeat(t), lens: pvGrow(t, kl) }); S.pulse.pose(t, 0); const L = pvLensAt(S.phone);
        lab.position.copy(L).add(new THREE.Vector3(0, 0.006, 0)); lab.pose(pvPop(t, kl + 0.2) * (t < ka ? 1 : 0));
        if (t < ka) w.look([L.x - 0.03, L.y - 0.0, L.z + 0.45], [L.x, L.y - 0.04, L.z], 36); else w.look([0.9, 1.15, 1.45], [0.1, 0.85, 0.35], 40); S.cap(t); }; },
  },
  // 3. (8.4 s) on iPhone, orange means the microphone
  naranja: {
    bg: PV.sky,
    build(w) { const S = pvRoomSet(w), mic = w.add(pvMic()), lab = w.add(dioLabel('MICRÓFONO', PV.orange, 0.045, true)), op = w.add(pvPulse(PV.orange));
      return (t) => { const k = w.K('naranja'), on = t >= k; pvHeld(S, t); S.phone.pose({ dot: on ? 'orange' : 'green', pulse: pvBeat(t), lens: on ? 0 : 1 }); S.pulse.pose(t, 0); const d = pvDotAt(S.phone); op.position.copy(d).add(new THREE.Vector3(0, 0, 0.003)); op.pose(t, on ? 1 : 0);
        mic.position.copy(S.phone.position).add(new THREE.Vector3(0.15, -0.02, 0.04)); mic.scale.setScalar(pvPop(t, k + 0.15)); lab.position.copy(mic.position).add(new THREE.Vector3(0, 0.08, 0)); lab.pose(pvPop(t, k + 0.35));
        const p = S.phone.position, u = pvU(w, t); w.look([p.x + 0.35 - u * 0.1, p.y + 0.16, p.z + 0.8], [p.x + 0.07, p.y + 0.08, p.z], 38); S.cap(t); }; },
  },
  // 4. (11.2 s) if you're not taking a photo or on a video call, something's wrong: the phone alone on the table, an eye on its screen
  raro: {
    bg: PV.sky,
    build(w) { const S = pvRoomSet(w), q = w.add(dioLabel('¿?', PV.red, 0.06));
      return (t) => { const km = w.K('mesa'), ko = w.K('ojo'); pvOnTable(S); S.phone.pose({ dot: 'green', pulse: pvBeat(t), eye: pvGrow(t, ko) }); const d = pvDotAt(S.phone); S.pulse.position.copy(d).add(new THREE.Vector3(0, 0.003, 0)); S.pulse.rotation.x = -Math.PI / 2; S.pulse.pose(t, 1);
        q.position.copy(S.phone.position).add(new THREE.Vector3(0, 0.15, 0)); q.pose(pvPop(t, ko + 0.5));
        if (t < km) w.look([0.9, 1.25, 1.6], [0.05, 0.42, 0.02], 40); else w.look([0.25, 0.95, 0.45], [0.05, 0.42, 0.02], 38); S.cap(t); }; },
  },
  // 5. (15.1 s) the prize: swipe down, the panel shows the app's name; then the Android phone: tap the green icon
  premio: {
    bg: PV.sky,
    build(w) { const S = pvRoomSet(w), droid = w.add(pvPhone(true)), finger = w.add(pvPointer()), here = w.add(dioLabel('¡AQUÍ!', PV.key, 0.05, true)), l1 = w.add(dioLabel('iPHONE: CENTRO DE CONTROL', '#ffffff', 0.024)), l2 = w.add(dioLabel('ANDROID: TOCA EL ICONO', '#ffffff', 0.026));
      return (t) => { const ki = w.K('iphone'), ka = w.K('android'), kt = w.K('toca'), kn = w.K('nombre'), andr = t >= ka; pvHeld(S, t); S.pulse.pose(t, 0);
        const P = andr ? droid : S.phone; S.phone.visible = !andr; droid.visible = andr; droid.position.copy(S.phone.position); droid.rotation.copy(S.phone.rotation);
        const swipe = andr ? pvGrow(t, ka + 0.3) : pvGrow(t, ki); P.pose({ dot: 'green', pulse: pvBeat(t), panel: swipe, app: andr ? (t > kt ? 1 : 0) : 1, android: andr, tapRing: andr ? pvGrow(t, kt) : 0 });
        P.updateMatrixWorld(true); const top = P.localToWorld(new THREE.Vector3(0.03, PV_H / 2 - 0.02 - 0.12 * swipe, 0.012)), row = P.localToWorld(new THREE.Vector3(-0.05, PV_H / 2 - 0.06, 0.012));
        finger.visible = swipe < 0.98 || (andr && t < kt + 0.6); finger.pose(andr && t > kt - 0.3 ? row : top, (andr && t > kt - 0.3 ? row : top).clone().add(new THREE.Vector3(0.06, -0.12, 0.15)));
        here.position.copy(row).add(new THREE.Vector3(0, 0.005, 0)); here.pose(pvPop(t, andr ? kn : ki + 0.8) * (t > (andr ? kn : ki + 0.8) ? 1 : 0));
        l1.position.copy(S.phone.position).add(new THREE.Vector3(0, -0.04, 0.05)); l1.pose(andr ? 0 : pvPop(t, ki)); l2.position.copy(S.phone.position).add(new THREE.Vector3(0, -0.04, 0.05)); l2.pose(andr ? pvPop(t, ka) : 0);
        const p = S.phone.position; if (t < ki) w.look([p.x + 0.3, p.y + 0.16, p.z + 0.9], [p.x, p.y + 0.08, p.z], 38); else w.look([p.x + 0.05, p.y + 0.17, p.z + 0.68], [p.x, p.y + 0.11, p.z], 36); S.cap(t); }; },   // aim high: the panel with the app's name sits mid-frame
  },
  // 6. (23 s) has it ever shown up for no reason? tell me below
  pregunta: {
    bg: PV.sky,
    build(w) { const S = pvRoomSet(w), c = w.add(dioLabel('CUÉNTAMELO ABAJO', PV.key, 0.045));
      return (t) => { pvHeld(S, t); S.phone.pose({ dot: 'green', pulse: pvBeat(t) }); const d = pvDotAt(S.phone); S.pulse.position.copy(d).add(new THREE.Vector3(0, 0, 0.003)); S.pulse.pose(t, 1);
        c.position.copy(S.phone.position).add(new THREE.Vector3(0, -0.06, 0.06)); c.pose(pvPop(t, w.K('abajo'))); const u = pvU(w, t); w.look([1.0 - u * 0.5, 1.2, 1.7 - u * 0.2], [0.1, 0.9, 0.35], 40); S.cap(t); }; },
  },
  // 7. (26 s) and the next time you see — frame 0's shot again, so it loops
  loop: {
    bg: PV.sky,
    build(w) { const S = pvRoomSet(w);
      return (t) => { pvHeld(S, t); S.phone.pose({ dot: 'green', pulse: pvBeat(t) }); const d = pvDotAt(S.phone); S.pulse.position.copy(d).add(new THREE.Vector3(0, 0, 0.003)); S.pulse.pose(t, 1); pvHookCam(w, S, 0); S.cap(t); }; },
  },
});
