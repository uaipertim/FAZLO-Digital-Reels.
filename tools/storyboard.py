#!/usr/bin/env python3
"""
Storyboard a partir do vídeo final.

    python3 tools/storyboard.py <reel>   ->  reels/<id>/output/storyboard.jpg

Os quadros vêm de "storyboard" no reel.json ([[instante, "RÓTULO"], ...]);
sem essa lista, 16 quadros igualmente espaçados.
"""
import os
import subprocess
import sys
import tempfile
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import reelcfg  # noqa: E402

R = reelcfg.resolve()
VIDEO = R['video']
if not os.path.exists(VIDEO):
    raise SystemExit(f'{VIDEO} não existe: renderize o vídeo antes')
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', VIDEO],
                           capture_output=True, text=True).stdout)
SHOTS = R['cfg'].get('storyboard') or [[round(dur * (i + 0.5) / 16, 2), ''] for i in range(16)]
COLS, TW, TH, PAD, LAB = 8, 270, 480, 14, 40


def frame(t, path):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(t), '-i', VIDEO, '-frames:v', '1', path], check=True)
    return Image.open(path).convert('RGB')


with tempfile.TemporaryDirectory() as tmp:
    rows = (len(SHOTS) + COLS - 1) // COLS
    sheet = Image.new('RGB', (COLS * (TW + PAD) + PAD, rows * (TH + LAB + PAD) + PAD), (12, 12, 12))
    draw = ImageDraw.Draw(sheet)
    font = reelcfg.font(17)
    for i, (t, label) in enumerate(SHOTS):
        im = frame(t, os.path.join(tmp, f'{i}.png')).resize((TW, TH), Image.LANCZOS)
        x, y = PAD + (i % COLS) * (TW + PAD), PAD + (i // COLS) * (TH + LAB + PAD)
        sheet.paste(im, (x, y))
        draw.text((x, y + TH + 9), f'{t:05.2f}s  {label}'.rstrip(), font=font, fill=(235, 235, 235))
    out = os.path.join(R['root'], 'output', 'storyboard.jpg')
    sheet.save(out, quality=90)
print('ok ->', os.path.relpath(out))
