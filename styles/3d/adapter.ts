// 3D: HyperFrames + Three.js. Same interface as every other style:
//   build(video): writes project/index.html (one canvas, one <section class="clip"> per scene for the titles) + Three.js, GSAP,
//     engine, library, detail and the video's world3d.ts + visuals3d.ts (the browser can't read TypeScript: esbuild strips the types into project/)
//   frames(video, times, dir): `hyperframes snapshot`    video(video): `hyperframes render` -> MP4 (mix.ts adds the audio)
//   texts(video): `hyperframes check` (text out of frame, overlaps, contrast)
//   preview(video): builds and reuses the `hyperframes preview` server if it's running (it reloads by itself), or starts it in the background
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { buildSync, transformSync } from 'esbuild';
import type { Adapter, Plan, Words } from '../../core/types.ts';

const HERE = import.meta.dirname, PROJ = path.join(HERE, 'project'), PORT = '3003';   // Flat 2D's preview is on 3002: both can stay open
const HF = path.join(HERE, 'node_modules', '.bin', process.platform === 'win32' ? 'hyperframes.cmd' : 'hyperframes');
const hf = (args: string[], o: object = {}) => spawnSync(HF, args, { cwd: HERE, encoding: 'utf8', maxBuffer: 1 << 26, shell: process.platform === 'win32', ...o });
const esc = (s: unknown) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// state of the background preview server for project/ (null if it isn't running)
const previewStatus = (): { port: number } | null => {
  const r = hf(['preview', 'project', '--status', '--json']);
  try { const s = JSON.parse(r.stdout.slice(r.stdout.indexOf('{'))).result; return s?.state === 'running' ? s : null; } catch { return null; }
};
const toJs = (file: string) => transformSync(fs.readFileSync(file, 'utf8'), { loader: 'ts', target: 'es2022', sourcefile: path.basename(file) }).code;
// Three.js as one local script with the global THREE, so the render downloads nothing from the internet
const THREE_EXTRAS = ['postprocessing/EffectComposer', 'postprocessing/RenderPass', 'postprocessing/ShaderPass', 'postprocessing/OutputPass', 'geometries/RoundedBoxGeometry', 'environments/RoomEnvironment'];
const bundleThree = (out: string) => { buildSync({ stdin: { contents: ["export * from 'three';", ...THREE_EXTRAS.map((f) => `export * from 'three/examples/jsm/${f}.js';`)].join('\n'), resolveDir: HERE }, bundle: true, format: 'iife', globalName: 'THREE', minify: true, target: 'es2022', outfile: out }); };

const adapter: Adapter = {
  engine: 'HyperFrames + Three.js',
  build(v) {
    const E: Plan = JSON.parse(fs.readFileSync(path.join(v, 'scenes.json'), 'utf8')), wf = path.join(v, 'words.json');
    const P: Words = fs.existsSync(wf) ? JSON.parse(fs.readFileSync(wf, 'utf8')) : { duration: E.duration, words: [] };   // no voice: a silent animation
    fs.mkdirSync(PROJ, { recursive: true });
    fs.copyFileSync(path.join(HERE, 'node_modules', 'gsap', 'dist', 'gsap.min.js'), path.join(PROJ, 'gsap.min.js'));
    bundleThree(path.join(PROJ, 'three.js'));
    // the style's theme, plus the video's own theme.css on top if it has one (its fonts and colors go in videos/<topic>/assets/)
    fs.writeFileSync(path.join(PROJ, 'theme.css'), [path.join(HERE, 'theme.css'), path.join(v, 'theme.css')].filter((f) => fs.existsSync(f)).map((f) => fs.readFileSync(f, 'utf8')).join('\n'));
    for (const f of ['engine', 'library', 'detail']) fs.writeFileSync(path.join(PROJ, `${f}.js`), toJs(path.join(HERE, `${f}.ts`)));
    // the video's world (reusable pieces, their states, sets, camera moves) and its scenes
    for (const [src, out] of [['world3d.ts', 'world.js'], ['visuals3d.ts', 'visuals.js']]) { const f = path.join(v, src); fs.writeFileSync(path.join(PROJ, out), fs.existsSync(f) ? toJs(f) : ''); }
    fs.rmSync(path.join(PROJ, 'assets'), { recursive: true, force: true });
    if (fs.existsSync(path.join(v, 'assets'))) fs.cpSync(path.join(v, 'assets'), path.join(PROJ, 'assets'), { recursive: true });
    const voice = ['mix.wav', 'audio.wav'].find((f) => fs.existsSync(path.join(v, f)));
    fs.rmSync(path.join(PROJ, 'voice.wav'), { force: true });
    if (voice) fs.copyFileSync(path.join(v, voice), path.join(PROJ, 'voice.wav'));   // to hear it in the preview; the final render remixes it
    const D = E.duration.toFixed(3);
    const sections = E.scenes.map((s, i) => `      <section id="sc-${esc(s.id)}" class="clip scene" data-start="${s.t0}" data-duration="${(s.t1 - s.t0).toFixed(3)}" data-track-index="0" style="z-index:${i + 1}">
        <div class="titles"></div>
      </section>`).join('\n');
    const html = `<!doctype html>
<html lang="${esc(P.language || 'es')}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>${esc(path.basename(v))} (3D)</title>
    <script src="gsap.min.js"></script>
    <script src="three.js"></script>
    <link rel="stylesheet" href="theme.css" />
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${D}" data-width="1080" data-height="1920">
      <canvas id="gl" width="1080" height="1920"></canvas>
${sections}
${voice ? `      <audio id="voice" src="voice.wav" data-start="0" data-duration="${D}" data-track-index="9"></audio>` : ''}
    </div>
    <script>
      const SCENES = ${JSON.stringify(E)};
      const WORDS = ${JSON.stringify(P.words)};
    </script>
    <script src="library.js"></script>
    <script src="detail.js"></script>
    <script src="world.js"></script>
    <script src="visuals.js"></script>
    <script src="engine.js"></script>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines.main = buildTimeline();
    </script>
  </body>
</html>
`;
    fs.writeFileSync(path.join(PROJ, 'index.html'), html);
    return path.join(PROJ, 'index.html');
  },
  async frames(v, times, dir) {
    const tmp = path.join(dir, '_hf'); fs.rmSync(tmp, { recursive: true, force: true });
    const r = hf(['snapshot', 'project', '--at', times.join(','), '--no-end', '--output', tmp]);
    if (r.status !== 0) throw new Error('snapshot failed:\n' + r.stdout + r.stderr);
    const pngs = fs.readdirSync(tmp).filter((f) => f.endsWith('.png')).sort();
    return pngs.map((f, i) => { const o = path.join(dir, `p${String(i + 1).padStart(2, '0')}.png`); fs.renameSync(path.join(tmp, f), o); return o; });
  },
  video(v) {
    const out = path.join(v, 'render', 'silent.mp4'); fs.mkdirSync(path.dirname(out), { recursive: true });
    const r = hf(['render', 'project', '--output', out, '--fps', String(JSON.parse(fs.readFileSync(path.join(v, 'scenes.json'), 'utf8')).fps || 30), '--quality', 'high'], { stdio: 'inherit' });
    if (r.status !== 0) throw new Error('the render failed');
    return out;
  },
  texts(v) {
    adapter.build(v);   // the review can run on its own, after another video was built
    const r = hf(['check', 'project', '--json']);
    let j: any = null; try { j = JSON.parse(r.stdout.slice(r.stdout.indexOf('{'))); } catch { console.log('check: could not read the JSON output'); return null; }
    const L = j.layout || {}, lint: any[] = (j.lint?.findings || []).filter((f: any) => f.severity === 'error');
    console.log(`\nTEXT (hyperframes check): layout ${L.samples ?? 0} samples, ${L.errorCount ?? 0} error(s); contrast ${j.contrast?.checked ?? 0} checked, ${j.contrast?.errorCount ?? 0} error(s); lint ${lint.length} error(s)`);
    for (const f of lint) console.log('  FAIL lint', f.code, f.message);
    for (const f of ([] as any[]).concat(L.issues || L.items || []).slice(0, 8)) console.log('  FAIL ', f.code || '', f.message || JSON.stringify(f).slice(0, 160));
    if (!L.samples) { console.log('  (the layout check took no samples: text NOT verified)'); return null; }
    return (L.errorCount ?? 0) === 0 && (j.contrast?.errorCount ?? 0) === 0 && lint.length === 0;
  },
  preview(v) {
    adapter.build(v);
    // hyperframes asks the server itself, which can miss it while it reloads after the build: ask twice
    const running = previewStatus() ?? previewStatus();
    if (running) return { url: `http://localhost:${running.port}`, started: false };
    // the usual port first; if another program has it (another copy of the project, say), the next free one, and say so
    const start = (port: number) => hf(['preview', 'project', '--background', '--port', String(port)]);
    let r = start(+PORT);
    for (let p = +PORT + 1; r.status !== 0 && /already in use/i.test(r.stdout + r.stderr) && p <= +PORT + 20; p++) r = start(p);
    // still missed: hyperframes refuses to start a second one and names the port of the one that's open, so reuse it
    const open = (r.stdout + r.stderr).match(/Matching server port: (\d+)/);
    if (r.status !== 0 && open) return { url: `http://localhost:${open[1]}`, started: false };
    if (r.status !== 0) throw new Error('the preview did not start:\n' + r.stdout + r.stderr);
    const port = previewStatus()?.port ?? +PORT;
    return { url: `http://localhost:${port}`, started: true,
      note: port === +PORT ? undefined : `port ${PORT} was busy (another program is using it), so the preview opened on ${port} instead` };
  },
  stopPreview() { hf(['preview', 'project', '--stop']); },
};
export default adapter;
