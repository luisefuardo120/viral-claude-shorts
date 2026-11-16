#!/usr/bin/env python3
"""Image video: turns one still image per shot into the silent video of a project (for real images instead of drawings).

  python tools/slideshow.py --project projects/<slug> [--images projects/<slug>/input/images] [--fps 30]

Reads  story/shots.json: every shot has "image" (and, if input/clips/<same name>.mp4 exists, that video clip is used instead) (a file in the images folder), "start", "end" and optional "move"
       (in | out | up | down | left | right; default: alternates), timeline/words.json for the captions,
       config.json (captions, watermark).
Writes build/video_silent.mp4 (1080x1920): slow Ken Burns motion on every image, crossfades between images,
       word-by-word captions (current word in gold) and the channel watermark. Then run audio/mix.py to add
       voice + music + SFX and get out/<title>.mp4.
"""
import argparse, json, os, subprocess, sys

W, H = 1080, 1920
MOVES = ["in", "right", "out", "up", "in", "left", "down", "out"]
FONT = "Inter ExtraBold"


def ass_time(t):
    t = max(0.0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def captions_ass(words, path, y_frac=0.79, size=76, per=4):
    """word-by-word captions: groups of `per` words, the word being said in gold (same look as the studio)."""
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{FONT},{size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,1,0,1,6,3,2,60,60,{int(H * (1 - y_frac)) - size // 2},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    gold = "&H003CC8FF&"   # #FFC83C in ASS BGR
    lines = []
    for g0 in range(0, len(words), per):
        grp = words[g0:g0 + per]
        for k, w in enumerate(grp):
            st = w["start"] - 0.05
            nxt = grp[k + 1]["start"] - 0.05 if k + 1 < len(grp) else min(w["end"] + 0.35, words[g0 + per]["start"] - 0.05 if g0 + per < len(words) else w["end"] + 0.35)
            txt = " ".join((f"{{\\c{gold}\\fscx108\\fscy108}}{x['word'].upper()}{{\\c&H00FFFFFF&\\fscx100\\fscy100}}" if j == k else x["word"].upper()) for j, x in enumerate(grp))
            lines.append(f"Dialogue: 0,{ass_time(st)},{ass_time(max(st + 0.05, nxt))},Cap,,0,0,0,,{txt}")
    open(path, "w", encoding="utf-8").write(head + "\n".join(lines) + "\n")


def kenburns(move, n):
    """zoompan expressions (on = output frame, n = frames in the shot) over an image scaled to 2x the frame."""
    p = f"(on/{max(1, n - 1)})"
    z = {"in": f"1.0+0.14*{p}", "out": f"1.14-0.14*{p}"}.get(move, "1.12")
    cx, cy = "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"
    x = {"left": f"(iw-iw/zoom)*(0.85-0.7*{p})", "right": f"(iw-iw/zoom)*(0.15+0.7*{p})"}.get(move, cx)
    y = {"up": f"(ih-ih/zoom)*(0.85-0.7*{p})", "down": f"(ih-ih/zoom)*(0.15+0.7*{p})"}.get(move, cy)
    return z, x, y


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--project", required=True); ap.add_argument("--images"); ap.add_argument("--clips"); ap.add_argument("--fps", type=int, default=30); ap.add_argument("--fade", type=float, default=0.45)
    a = ap.parse_args(); P = a.project
    cfg = json.load(open(os.path.join(P, "config.json"), encoding="utf-8"))
    story = json.load(open(os.path.join(P, "story", "shots.json"), encoding="utf-8"))
    imgdir = a.images or os.path.join(P, "input", "images")
    shots = story["shots"]; total = story.get("duration") or shots[-1]["end"]; F = a.fade
    missing = [s["image"] for s in shots if not os.path.exists(os.path.join(imgdir, s["image"]))]
    if missing: sys.exit(f"missing images in {imgdir}: {', '.join(missing)}")
    build = os.path.join(P, "build"); os.makedirs(build, exist_ok=True)
    words = json.load(open(os.path.join(P, "timeline", "words.json"), encoding="utf-8")); words = words.get("words", words)

    clipdir = a.clips or os.path.join(P, "input", "clips"); used = []
    inputs, chains = [], []
    for i, s in enumerate(shots):
        seg = (s["end"] if i < len(shots) - 1 else total) - s["start"]
        d = seg + (F if i < len(shots) - 1 else 0); n = max(2, round(d * a.fps))
        clip = os.path.join(clipdir, os.path.splitext(s["image"])[0] + ".mp4")
        if os.path.exists(clip):   # a generated video clip for this shot: crop to 9:16, skip its first frames, slow it down if it is too short
            cd = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", clip], capture_output=True, text=True).stdout or 0)
            skip = min(s.get("clipStart", 0.3), max(0.0, cd - d)); slow = max(1.0, d / max(0.1, cd - skip)); used.append(s["image"])
            inputs += ["-i", clip]
            chains.append(f"[{i}:v]trim=start={skip:.3f},setpts=(PTS-STARTPTS)*{slow:.4f},fps={a.fps},scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,"
                          f"trim=end_frame={n},setpts=PTS-STARTPTS,format=yuv420p[v{i}]")
            continue
        z, x, y = kenburns(s.get("move") or MOVES[i % len(MOVES)], n)
        inputs += ["-loop", "1", "-framerate", str(a.fps), "-t", f"{d:.3f}", "-i", os.path.join(imgdir, s["image"])]
        chains.append(f"[{i}:v]scale={W * 2}:{H * 2}:force_original_aspect_ratio=increase,crop={W * 2}:{H * 2},setsar=1,"
                      f"zoompan=z='{z}':x='{x}':y='{y}':d=1:s={W}x{H}:fps={a.fps},trim=end_frame={n},setpts=PTS-STARTPTS,format=yuv420p[v{i}]")
    cur = "v0"
    for i in range(1, len(shots)):
        chains.append(f"[{cur}][v{i}]xfade=transition=fade:duration={F}:offset={shots[i]['start']:.3f}[x{i}]"); cur = f"x{i}"
    post = []
    if cfg.get("watermark", {}).get("text"):
        wm = cfg["watermark"]
        post.append(f"drawtext=fontfile=/usr/share/fonts/opentype/inter/Inter-Bold.otf:text='{wm['text']}':fontsize={wm.get('size', 60)}:fontcolor=white@{wm.get('alpha', 0.14)}:x=(w-text_w)/2:y=h*{wm.get('y', 0.5)}-text_h/2")
    if cfg.get("captions", True):
        ass = os.path.join(build, "captions.ass"); captions_ass(words, ass); post.append(f"ass='{ass}'")
    fi, fo = cfg.get("fadeIn", 0.5), cfg.get("fadeOut", 0.8)
    post += [f"fade=t=in:st=0:d={fi}", f"fade=t=out:st={total - fo:.3f}:d={fo}", f"trim=duration={total:.3f}"]
    chains.append(f"[{cur}]" + ",".join(post) + "[out]")
    out = os.path.join(build, "video_silent.mp4")
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *inputs, "-filter_complex", ";".join(chains), "-map", "[out]",
           "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(a.fps), out]
    print(f"video clips for {len(used)} shot(s): {', '.join(used) or 'none'}", flush=True)
    print(f"rendering {len(shots)} images -> {out} ({total:.1f}s)…", flush=True)
    r = subprocess.run(cmd)
    if r.returncode: sys.exit("ffmpeg failed")
    print("done:", out)


if __name__ == "__main__":
    main()
