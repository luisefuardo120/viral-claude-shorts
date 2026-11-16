#!/usr/bin/env python3
# usage: img.py <prompts.md> <out_dir> [numbers...]   generates 9:16 images with ai33 (seedream 4.5), polls, downloads NN.jpg
import re, sys, json, time, subprocess, os
md = open(sys.argv[1], encoding='utf8').read(); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
want = set(sys.argv[3:])
rows = re.findall(r'^\| (\d\d) \|.*\| (.+?) \|$', md, re.M)
sh = lambda *a: subprocess.run(a, capture_output=True, text=True).stdout
tasks = {}
for n, p in rows:
    if want and n not in want: continue
    if not want and os.path.exists(f'{out}/{n}.jpg'): continue
    r = json.loads(sh('curl', '-sS', '-X', 'POST', 'https://api.ai33.pro/v1i/task/generate-image', '-H', 'xi-api-key: dummy', '--form-string', 'prompt=' + p,
                      '-F', 'model_id=bytedance-seedream-4.5', '-F', 'generations_count=1', '-F', 'model_parameters={"aspect_ratio":"9:16","resolution":"2K"}'))
    print(n, r.get('task_id'), r.get('estimated_credits'), flush=True); tasks[n] = r['task_id']
t0 = time.time()
while tasks and time.time() - t0 < 900:
    time.sleep(6)
    for n, tid in list(tasks.items()):
        d = json.loads(sh('curl', '-sS', f'https://api.ai33.pro/v1/task/{tid}', '-H', 'xi-api-key: dummy'))
        if d.get('status') == 'done':
            url = d['metadata']['result_images'][0]['imageUrl']; sh('curl', '-sS', '-L', '-o', f'{out}/{n}.jpg', url); print(n, 'done', flush=True); del tasks[n]
        elif d.get('status') not in ('doing', 'pending', 'queued', 'processing', None): print(n, 'ERROR', json.dumps(d)[:300], flush=True); del tasks[n]
print('left:', list(tasks))
