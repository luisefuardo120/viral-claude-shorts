// Flat 2D: HyperFrames (HTML + SVG + GSAP). Same interface as every other style:
//   build(video): writes project/index.html (one <section class="clip"> per scene) + engine, library and the video's world.ts + visuals.ts
//     (the browser can't read TypeScript: esbuild strips the types and writes plain .js into project/)
//   frames(video, times, dir): `hyperframes snapshot`    video(video): `hyperframes render` -> MP4 (mix.ts adds the audio)
//   texts(video): `hyperframes check` (text out of frame, overlaps, contrast)
//   preview(video): builds and reuses the `hyperframes preview` server if it's running (it reloads by itself), or starts it in the background
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { transformSync } from 'esbuild';
import type { Adapter, Plan, Words } from '../../core/types.ts';

const HERE = import.meta.dirname, PROJ = path.join(HERE, 'project');
const HF = path.join(HERE, 'node_modules', '.bin', process.platform === 'win32' ? 'hyperframes.cmd' : 'hyperframes');
const hf = (args: string[], o: object = {}) => spawnSync(HF, args, { cwd: HERE, encoding: 'utf8', maxBuffer: 1 << 26, ...o });
const esc = (s: unknown) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// state of the background preview server for project/ (null if it isn't running)
const previewStatus = (): { port: number } | null => {
  const r = hf(['preview', 'project', '--status', '--json']);
  try { const s = JSON.parse(r.stdout.slice(r.stdout.indexOf('{'))).result; return s?.state === 'running' ? s : null; } catch { return null; }
};
const toJs = (file: string) => transformSync(fs.readFileSync(file, 'utf8'), { loader: 'ts', target: 'es2022', sourcefile: path.basename(file) }).code;

const adapter: Adapter = {
  engine: 'HyperFrames (HTML + GSAP)',
  build(v) {
    const E: Plan = JSON.parse(fs.readFileSync(path.join(v, 'scenes.json'), 'utf8')), wf = path.join(v, 'words.json');
    const P: Words = fs.existsSync(wf) ? JSON.parse(fs.readFileSync(wf, 'utf8')) : { duration: E.duration, words: [] };   // no voice: a silent animation
    fs.mkdirSync(PROJ, { recursive: true });
    fs.copyFileSync(path.join(HERE, 'node_modules', 'gsap', 'dist', 'gsap.min.js'), path.join(PROJ, 'gsap.min.js'));
    // the style's theme, plus the video's own theme.css on top if it has one (its fonts and colors go in videos/<topic>/assets/)
    fs.writeFileSync(path.join(PROJ, 'theme.css'), [path.join(HERE, 'theme.css'), path.join(v, 'theme.css')].filter((f) => fs.existsSync(f)).map((f) => fs.readFileSync(f, 'utf8')).join('\n'));
    for (const f of ['engine', 'library']) fs.writeFileSync(path.join(PROJ, `${f}.js`), toJs(path.join(HERE, `${f}.ts`)));
    // the video's world (reusable pieces, their states, sets) and its scenes
    for (const [src, out] of [['world.ts', 'world.js'], ['visuals.ts', 'visuals.js']]) { const f = path.join(v, src); fs.writeFileSync(path.join(PROJ, out), fs.existsSync(f) ? toJs(f) : ''); }
    if (fs.existsSync(path.join(v, 'assets'))) fs.cpSync(path.join(v, 'assets'), path.join(PROJ, 'assets'), { recursive: true });
    const voice = ['mix.wav', 'audio.wav'].find((f) => fs.existsSync(path.join(v, f)));
    if (voice) fs.copyFileSync(path.join(v, voice), path.join(PROJ, 'voice.wav'));   // to hear it in the preview; the final render remixes it
    const D = E.duration.toFixed(3);
    const sections = E.scenes.map((s, i) => `      <section id="sc-${esc(s.id)}" class="clip scene" data-start="${s.t0}" data-duration="${(s.t1 - s.t0).toFixed(3)}" data-track-index="0" style="z-index:${i + 1}">
        <div class="art"></div><div class="titles"></div>
      </section>`).join('\n');
    const html = `<!doctype html>
<html lang="${esc(P.language || 'es')}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>${esc(path.basename(v))} (flat 2D)</title>
    <script src="gsap.min.js"></script>
    <link rel="stylesheet" href="theme.css" />
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${D}" data-width="1080" data-height="1920">
${sections}
${voice ? `      <audio id="voice" src="voice.wav" data-start="0" data-duration="${D}" data-track-index="9"></audio>` : ''}
    </div>
    <script>
      const SCENES = ${JSON.stringify(E)};
      const WORDS = ${JSON.stringify(P.words)};
    </script>
    <script src="library.js"></script>
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
    const running = previewStatus();
    if (running) return { url: `http://localhost:${running.port}`, started: false };
    const r = hf(['preview', 'project', '--background']);
    if (r.status !== 0) throw new Error('the preview did not start:\n' + r.stdout + r.stderr);
    const port = previewStatus()?.port ?? 3002;   // hyperframes takes the next free port when 3002 is busy
    return { url: `http://localhost:${port}`, started: true, note: port === 3002 ? undefined : `port 3002 was busy (another program is using it), so the preview opened on ${port} instead` };
  },
  stopPreview() { hf(['preview', 'project', '--stop']); },
};
export default adapter;
