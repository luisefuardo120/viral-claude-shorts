#!/usr/bin/env node
// Shared final step: the style's video (no audio) + the voice + the music -> final.mp4 ready to upload.
//   usage: node core/mix.ts videos/<topic> <silent-video.mp4> [--music -16]
//   The music sits "--music" dB under the voice and ducks a bit more while you talk (sidechain);
//   everything is normalized to -14 LUFS (what YouTube / TikTok / Reels expect).
//   writes videos/<topic>/final.mp4 (H.264 + AAC, 1080x1920) and mix.wav
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const opt = (k: string, d: number) => { const i = argv.indexOf(k); return i >= 0 ? argv.splice(i, 2)[1] : d; };
const MUS = Number(opt('--music', -16));
// the channel's handle, burned into every final.mp4: centered, just above the zone the apps cover at the bottom (y 1600)
const WATERMARK = '@curiosferagfx';
const [dir, video] = argv;
if (!dir || !video) { console.error('usage: node core/mix.ts videos/<topic> <video.mp4> [--music -16]'); process.exit(2); }
const ROOT = path.resolve(dir);
const voice = ['audio.wav', 'audio.mp3', 'audio.m4a'].map((f) => path.join(ROOT, f)).find((f) => fs.existsSync(f));
if (!voice) { console.error(`there is no audio.wav, audio.mp3 or audio.m4a in ${dir}: a video without voice is watched in the preview, not rendered`); process.exit(1); }
const mus = ['own-music.wav', 'own-music.mp3', 'own-music.m4a', 'music.wav'].map((f) => path.join(ROOT, f)).find((f) => fs.existsSync(f)) || path.join(ROOT, 'music.wav'), mix = path.join(ROOT, 'mix.wav'), out = path.join(ROOT, 'final.mp4');
const run = (args: string[]) => { const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' }); if (r.status !== 0) { console.error('ffmpeg failed'); process.exit(1); } };
const vdur = Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video]).stdout.toString());

// 1) the un-normalized mix (voice + music ducked under the voice), 2) loudnorm in TWO passes: measure, then apply with
// the measured values (a single pass falls short with continuous voices: it gave -15 LUFS instead of -14)
const raw = mix.replace(/\.wav$/, '.raw.wav');
const graph = fs.existsSync(mus)
  ? `[0:a]aresample=48000,aformat=channel_layouts=stereo,asplit=2[v][k];[1:a]aresample=48000,aformat=channel_layouts=stereo,volume=${MUS}dB[m];` +
    `[m][k]sidechaincompress=threshold=0.03:ratio=3:attack=40:release=450[d];[d][v]amix=inputs=2:normalize=0:duration=longest,apad[o]`
  : `[0:a]aresample=48000,aformat=channel_layouts=stereo,apad[o]`;   // apad: so the ending isn't cut off
run(['-i', voice, ...(fs.existsSync(mus) ? ['-i', mus] : []), '-filter_complex', graph, '-map', '[o]', '-ar', '48000', '-t', String(vdur), raw]);
const LN = 'loudnorm=I=-14:TP=-1.5:LRA=11';
const meas = spawnSync('ffmpeg', ['-hide_banner', '-i', raw, '-af', `${LN}:print_format=json`, '-f', 'null', '-']).stderr.toString();
const m = JSON.parse(meas.slice(meas.lastIndexOf('{'), meas.lastIndexOf('}') + 1));
run(['-i', raw, '-af', `${LN}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`, '-ar', '48000', mix]);
fs.rmSync(raw, { force: true });
const mark = `drawtext=text='${WATERMARK}':font=Sans:fontsize=34:fontcolor=white@0.75:shadowcolor=black@0.6:shadowx=2:shadowy=2:x=(w-text_w)/2:y=1600-text_h-8`;
run(['-i', video, '-i', mix, '-map', '0:v:0', '-map', '1:a:0', '-vf', mark, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
console.log(`final.mp4: ${vdur.toFixed(2)} s, voice ${path.basename(voice)}${fs.existsSync(mus) ? ` + music at ${MUS} dB` : ''}, -14 LUFS -> ${out}`);
