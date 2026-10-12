#!/usr/bin/env python3
"""Folha de revisão das capturas: página inteira no celular e no desktop (com o mapa sobreposto
na posição do iframe), modal "Ver detalhes" e Day Use.

    python3 reels/como-funciona-o-raio-x/scripts/capturas_folha.py  ->  output/revisao/capturas.jpg
"""
import json
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, 'src', 'assets', 'site')
M = json.load(open(os.path.join(D, 'manifest.json')))


def page(dev):
    info = M[dev]; k = info['dpr']
    h = max(c['y'] + c['h'] for c in info['chunks'])
    im = Image.new('RGB', (info['W'] * k, h * k))
    for c in info['chunks']:
        im.paste(Image.open(os.path.join(D, c['file'])), (0, c['y'] * k))
    mp = info.get('map')
    if mp:
        im.paste(Image.open(os.path.join(D, mp['file'])).resize((mp['w'] * k, mp['h'] * k)), (mp['x'] * k, mp['y'] * k))
    return im


def columns(im, scale, cols):
    im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
    ch = (im.height + cols - 1) // cols
    out = Image.new('RGB', (cols * (im.width + 12), ch), (25, 25, 25))
    for i in range(cols):
        out.paste(im.crop((0, i * ch, im.width, min(im.height, (i + 1) * ch))), (i * (im.width + 12), 0))
    return out


mob = columns(page('mobile'), 0.18, 4)
desk = columns(page('desktop'), 0.2, 2)
extra = [Image.open(os.path.join(D, f)).resize((390, 844)) for f in ('m-modal-1.jpg', 'm-modal-2.jpg', 'm-dayuse.jpg')]
extra.append(Image.open(os.path.join(D, 'd-dayuse.jpg')).resize((720, 450)))
ex = Image.new('RGB', (sum(e.width + 20 for e in extra), 844), (25, 25, 25))
x = 0
for e in extra:
    ex.paste(e, (x, 0)); x += e.width + 20
W = max(mob.width, desk.width, ex.width)
sheet = Image.new('RGB', (W, mob.height + ex.height + desk.height + 80), (25, 25, 25))
sheet.paste(mob, (0, 0)); sheet.paste(ex, (0, mob.height + 40)); sheet.paste(desk, (0, mob.height + ex.height + 80))
out = os.path.join(ROOT, 'output', 'revisao', 'capturas.jpg')
os.makedirs(os.path.dirname(out), exist_ok=True)
sheet.save(out, quality=85)
print('ok ->', os.path.relpath(out))
