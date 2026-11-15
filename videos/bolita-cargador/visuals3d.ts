// Scenes of "Esa bolita del cable de tu cargador NO está de adorno": each one only assembles the world (world3d.ts).
// Every scene moves its camera; the long ones change shot halfway (at a key). Times are absolute video seconds.

const bcU = (w: World, t: number) => p3Clamp((t - w.s.t0) / (w.s.t1 - w.s.t0));
const bcGrow = (t: number, k: number) => p3Ramp(t, k, k + 0.5);
const bcPop = (t: number, k: number) => Math.max(0.001, p3Spring(t, k, 230, 15));
const bcLerp3 = (a: Vec3, b: Vec3, u: number): Vec3 => [p3Lerp(a[0], b[0], u), p3Lerp(a[1], b[1], u), p3Lerp(a[2], b[2], u)];
// a camera that blends between two shots (u 0..1), each [position, target, fov]
const bcBlend = (w: World, A: [Vec3, Vec3, number], B: [Vec3, Vec3, number], u: number) => w.look(bcLerp3(A[0], B[0], u), bcLerp3(A[1], B[1], u), p3Lerp(A[2], B[2], u));
// the desk from above-front (wide), its points on the cable (u along it)
const bcWide = (u: number): [Vec3, Vec3, number] => [[0.3 + u * 0.3, 1.25 - u * 0.15, 2.2 - u * 0.25], [-0.05, 0.05, 0.12], 40];

defineVisuals({
  // 1. that little ball on your charger cable is NOT for decoration: close on the bead, a glove taps it
  hook: {
    bg: BC.sky,
    build(w) { const R = bcRoom(w), hand = w.add(bcHand()), lab = w.add(dioLabel('¿Y ESTO?', BC.key, 0.05, true));
      return (t) => { const u = bcU(w, t), k = w.K('toca'); R.brick.pose(t); R.bead.pose(); R.bead.sync(); R.flow.pose(t, { current: 1 }); R.radio.screen.pose(t, 0); R.router.pose(t, 0); R.laptop.screen.pose(t, 0);
        const b = bcBeadAt(R.bead); hand.pose(b.clone().add(new THREE.Vector3(0, 0.022, 0)), b.clone().add(new THREE.Vector3(-0.05, 0.25, 0.12)), t > k ? Math.abs(Math.sin((t - k) * 6)) : 0); hand.scale.setScalar(bcPop(t, k - 0.2));
        lab.position.copy(b).add(new THREE.Vector3(0, 0.03, 0)); lab.pose(bcPop(t, k + 0.6) * (t > k + 0.6 ? 1 : 0)); bcBeadCam(w, R.bead, 0.9 - u * 0.5, 0.5 - u * 0.12, 0.22, 34); R.cap(t); }; },
  },
  // 2. inside the charger a circuit switches the current on and off thousands of times a second -> noise into the cable
  ruido: {
    bg: BC.sky,
    build(w) { const R = bcRoom(w);
      return (t) => { const ka = w.K('abre'), kr = w.K('ruido'), open = bcGrow(t, ka); R.brick.pose(t, open); R.bead.pose({ slide: 0.001 }); R.bead.visible = false; R.bead.sync();
        R.flow.pose(t, { noise: p3Ramp(t, kr - 0.6, kr + 0.4), current: 1 }); R.radio.screen.pose(t, 0); R.router.pose(t, 0); R.laptop.screen.pose(t, 0);
        const b = new THREE.Vector3(-0.64, 0.03, 0.3), u = p3Ramp(t, kr - 1.2, kr + 0.6), c = R.cable.curve.getPointAt(0.3);
        bcBlend(w, [[b.x + 0.32, b.y + 0.32, b.z + 0.42], [b.x, b.y + 0.02, b.z], 34], [[c.x + 0.25, 0.42, c.z + 0.85], [c.x + 0.05, 0.02, c.z], 36], u); R.cap(t); }; },
  },
  // 3. a long cable with that noise becomes an antenna: radio, TV, wifi get interference
  antena: {
    bg: BC.sky,
    build(w) { const R = bcRoom(w), rings = w.add(bcRings([0.15, 0.4, 0.65].map((u) => R.cable.curve.getPointAt(u)))), lab = w.add(dioLabel('ANTENA', BC.noise, 0.05, true));
      return (t) => { const u = bcU(w, t), ka = w.K('antena'), kr = w.K('radio'), bad = p3Ramp(t, kr - 0.4, kr); R.brick.pose(t); R.bead.visible = false; R.flow.pose(t, { noise: 1, current: 1 });
        rings.pose(t, bcGrow(t, ka - 0.3)); R.radio.screen.pose(t, bad); R.router.pose(t, bad); R.laptop.screen.pose(t, 0); lab.position.copy(R.cable.curve.getPointAt(0.4)).add(new THREE.Vector3(0, 0.05, 0)); lab.pose(bcPop(t, ka) * (t >= ka ? 1 : 0));
        bcBlend(w, bcWide(0), [[0.15, 0.75, 1.55], [-0.15, 0.06, -0.05], 40], u); R.cap(t); }; },
  },
  // 4. and the other way round: the cable picks up noise from other appliances and puts it in your laptop
  reves: {
    bg: BC.sky,
    build(w) { const R = bcRoom(w), rings = w.add(bcRings([0.25, 0.55, 0.8].map((u) => R.cable.curve.getPointAt(u)), false, BC.noise, 0.7));
      return (t) => { const u = bcU(w, t), ke = w.K('entra'), kp = w.K('portatil'); R.brick.pose(t); R.bead.visible = false; R.micro.pose(t, bcGrow(t, ke - 0.8)); rings.pose(t, bcGrow(t, ke));
        R.flow.pose(t, { noise: bcGrow(t, ke + 0.3), current: 1 }); R.laptop.screen.pose(t, p3Ramp(t, kp, kp + 0.4)); R.radio.screen.pose(t, 0); R.router.pose(t, 0);
        bcBlend(w, [[-0.2, 0.7, 1.7], [-0.55, 0.12, 0.3], 38], [[1.15, 0.55, 1.15], [0.45, 0.1, 0.05], 38], p3Ramp(t, kp - 1, kp + 0.4)); R.cap(t); }; },
  },
  // 5. so they put this little ball on it: low side view, it slides on
  bolita: {
    bg: BC.sky,
    build(w) { const R = bcRoom(w);
      return (t) => { const u = bcU(w, t); R.brick.pose(t); R.bead.pose({ slide: bcGrow(t, w.K('pone') - 0.2) }); R.bead.sync(); R.flow.pose(t, { noise: 1, current: 1 }); R.radio.screen.pose(t, 1); R.router.pose(t, 1); R.laptop.screen.pose(t, 0.4);
        const c = R.cable.curve.getPointAt(BC_BEAD_U - 0.1); w.look([c.x + 0.62 - u * 0.1, 0.09, c.z + 0.42], [c.x + 0.05, 0.02, c.z], 34); R.cap(t); }; },
  },
  // 6. inside it's a ferrite cylinder, a magnetic material, and the cable goes right through the middle
  ferrita: {
    bg: BC.sky,
    build(w) { const R = bcRoom(w), lab = w.add(dioLabel('FERRITA', BC.key, 0.055, true)), lab2 = w.add(dioLabel('CABLE', '#ffffff', 0.04, true));
      return (t) => { const u = bcU(w, t), ka = w.K('abre'), km = w.K('medio'); R.brick.pose(t); R.bead.pose({ open: bcGrow(t, ka) }); R.bead.sync(); R.flow.pose(t, { noise: 1, current: 1 });
        const b = bcBeadAt(R.bead); lab.position.copy(b).add(new THREE.Vector3(0, 0.02, 0)); lab.pose(bcPop(t, ka + 0.5) * (t > ka + 0.5 ? 1 : 0));
        const c = R.cable.curve.getPointAt(BC_BEAD_U + 0.06); lab2.position.copy(c).add(new THREE.Vector3(0, 0.01, 0)); lab2.pose(bcPop(t, km) * (t >= km ? 1 : 0)); bcBeadCam(w, R.bead, 0.2 + u * 0.6, 0.36, 0.17, 34); R.cap(t); }; },
  },
  // 7. normal current passes, but fast noise gets a brake and is eaten, turned into a little heat
  filtro: {
    bg: BC.sky,
    build(w) { const R = bcRoom(w), heat = w.add(bcHeat(30)), ln = w.add(dioLabel('RUIDO', BC.noise, 0.042, true)), lc = w.add(dioLabel('CORRIENTE', BC.current, 0.042, true));
      return (t) => { const kp = w.K('pasa'), kf = w.K('freno'), kc = w.K('calor'); R.brick.pose(t); R.bead.pose({ open: 0.6, heat: bcGrow(t, kc - 0.3) }); R.bead.sync();
        R.flow.pose(t, { noise: 1, current: 1, filter: bcGrow(t, kf - 0.2) }); const b = bcBeadAt(R.bead); heat.pose(t, b, bcGrow(t, kc));
        lc.position.copy(R.cable.curve.getPointAt(BC_BEAD_U + 0.045)).add(new THREE.Vector3(0, 0.02, 0));   // current: after the bead, it got through lc.pose(bcPop(t, kp) * (t >= kp ? 1 : 0));
        ln.position.copy(R.cable.curve.getPointAt(BC_BEAD_U - 0.04)).add(new THREE.Vector3(0, 0.03, 0)); ln.pose(bcPop(t, kf) * (t >= kf ? 1 : 0) * (1 - bcGrow(t, kc)));
        const c = R.cable.curve.getPointAt(BC_BEAD_U - 0.03); bcBlend(w, [[c.x + 0.1, 0.32, c.z + 0.55], [c.x + 0.02, 0.02, c.z], 36], [[b.x + 0.18, 0.24, b.z + 0.36], [b.x, b.y + 0.01, b.z], 34], p3Ramp(t, kf - 0.6, kf + 0.8)); R.cap(t); }; },
  },
  // 8. that's ferrite, a filter with no wires or chips: the closed bead, orbiting
  nombre: {
    bg: BC.sky,
    build(w) { const R = bcRoom(w), lab = w.add(dioLabel('FERRITA', BC.key, 0.06, true));
      return (t) => { const u = bcU(w, t); R.brick.pose(t); R.bead.pose(); R.bead.sync(); R.flow.pose(t, { noise: 1, current: 1, filter: 1 }); R.radio.screen.pose(t, 0); R.router.pose(t, 0); R.laptop.screen.pose(t, 0);
        const b = bcBeadAt(R.bead); lab.position.copy(b).add(new THREE.Vector3(0, 0.03, 0)); lab.pose(bcPop(t, w.K('nombre'))); bcBeadCam(w, R.bead, -0.6 + u * 1.4, 0.4, 0.14, 34); R.cap(t); }; },
  },
  // 9. so it quiets your cable so it doesn't act as an antenna: the calm desk, pulling up
  cierre: {
    bg: BC.sky,
    build(w) { const R = bcRoom(w);
      return (t) => { const u = bcU(w, t); R.brick.pose(t); R.bead.pose(); R.bead.sync(); R.flow.pose(t, { noise: 1, current: 1, filter: 1 }); R.radio.screen.pose(t, 0); R.router.pose(t, 0); R.laptop.screen.pose(t, 0); R.micro.pose(t, 1);
        bcBlend(w, [[0.9, 0.5, 1.2], [0.3, 0.05, 0.25], 38], bcWide(1), u); R.cap(t); }; },
  },
});
