// =====================================================================
//  3D — engine. Runs in the browser: the adapter strips the types (esbuild) and the page loads it after library and visuals.
//  buildTimeline(): ONE (paused) GSAP timeline with the titles of every scene, like the Flat 2D style.
//  build3D(): one Three.js world per scene and a single canvas. HyperFrames announces each frame's time with the `hf-seek`
//  event; the engine poses that time's world and draws it. Nothing runs a render loop, and there are no clocks.
//  index.html registers the timeline inline: window.__timelines.main = buildTimeline() (so the linter sees it too).
// =====================================================================
const norm3 = (w: string) => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ%]/g, '');
const said3 = (w: string, s: Scene) => { const n = norm3(w); const p = WORDS.find((p) => p.t0 >= s.t0 - 0.2 && p.t0 < s.t1 && norm3(p.w) === n); return p ? p.t0 : null; };
const keyOf = (s: Scene) => (id: string, fallback?: number) => { const c = (s.keys || []).find((c) => c.id === id); return c ? c.t : (fallback ?? s.t0 + 0.5); };

function buildTimeline(): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true });
  for (const s of SCENES.scenes) {
    const sec = document.getElementById('sc-' + s.id)!, $ = (q: string) => '#sc-' + s.id + ' ' + q;
    const T = sec.querySelector('.titles')!;
    if (s.label) { const e = document.createElement('div'); e.className = 'label'; e.textContent = s.label.toUpperCase(); T.appendChild(e);
      tl.fromTo($('.label'), { scale: 0.4, opacity: 0, xPercent: -50 }, { scale: 1, opacity: 1, xPercent: -50, duration: 0.3, ease: 'back.out(2)' }, s.t0 + 0.02); }
    if (s.title) {
      const t = document.createElement('div'); t.className = 'title' + (s.title.length > 30 ? ' long' : ''); T.appendChild(t);
      const hl = s.highlight ? norm3(s.highlight) : null, ws = s.title.split(/\s+/);
      ws.forEach((w) => { const sp = document.createElement('span'); sp.className = 'word' + (hl && norm3(w) === hl ? ' hl' : ''); if (hl && norm3(w) === hl) sp.innerHTML = '<span class="box"></span>'; sp.appendChild(document.createTextNode(w)); t.appendChild(sp); });
      tl.fromTo($('.word'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.2, ease: 'power3.out', stagger: 0.45 / ws.length }, s.t0 + 0.08);
      if (hl) {
        const tHl = Math.min(said3(s.highlight!, s) ?? s.t0 + 0.5, s.t1 - 0.6);   // never half done at the cut
        tl.fromTo($('.box'), { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.28, ease: 'back.out(2)' }, tHl);
      }
    }
    if (s.stat) {
      const c = document.createElement('div'); c.className = 'card'; c.innerHTML = `<div class="value"></div><div class="text"></div>`; T.appendChild(c);
      c.querySelector('.value')!.textContent = s.stat.value; c.querySelector('.text')!.textContent = s.stat.text || '';
      const tS = (s.keys || []).find((x) => x.id === 'stat')?.t ?? said3(String(s.stat.value).split(/\s+/)[0], s) ?? s.t0 + 0.7;
      tl.fromTo($('.card'), { y: 60, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)' }, tS);
    }
  }
  build3D(tl);
  tl.set({}, {}, SCENES.duration);   // the timeline spans the whole video
  return tl;
}

function build3D(tl: gsap.core.Timeline) {
  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl') as HTMLCanvasElement, antialias: true, preserveDrawingBuffer: true });
  const FW = SCENES.format === '16:9' ? 1920 : 1080, FH = SCENES.format === '16:9' ? 1080 : 1920;   // vertical Short or horizontal long video
  renderer.setPixelRatio(1); renderer.setSize(FW, FH, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const worlds = SCENES.scenes.map((s) => {
    const V = VISUALS[s.id] || LIBRARY[s.type] || LIBRARY.object;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(V.bg || P3_SKY);
    const camera = new THREE.PerspectiveCamera(40, FW / FH, 0.1, 1000);
    const w: World = {
      s, scene, camera, renderer, tl, K: keyOf(s),
      titles: document.querySelector<HTMLElement>('#sc-' + s.id + ' .titles')!,
      add: (object) => { scene.add(object); return object; },
      look: (pos, target, fov = 40) => { camera.position.set(...pos); camera.fov = fov; camera.updateProjectionMatrix(); camera.lookAt(...target); },
    };
    return { s, w, pose: V.build(w) };
  });
  const draw = (t: number) => {
    const cur = worlds.find((x) => t < x.s.t1) || worlds[worlds.length - 1];
    cur.pose(t);
    if (cur.w.present) cur.w.present(); else renderer.render(cur.w.scene, cur.w.camera);
  };
  window.addEventListener('hf-seek', (e) => draw((e as CustomEvent<{ time: number }>).detail.time));
  draw(0);
}
