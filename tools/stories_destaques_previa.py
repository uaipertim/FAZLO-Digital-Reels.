#!/usr/bin/env python3
"""Folha com todos os stories dos destaques lado a lado (uma linha por destaque):
    python3 tools/stories_destaques_previa.py  ->  stories/destaques/previa.jpg"""
import glob
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, 'stories', 'destaques')
ORDEM = ['raio-x', 'cases', 'hospeda', 'contato']
TW, TH, PAD, LAB = 360, 640, 24, 60
F = ImageFont.truetype(os.path.join(ROOT, 'brand', 'fonts', 'sora-latin-600-normal.woff2'), 26)
linhas = [(d, sorted(glob.glob(os.path.join(D, d, '[0-9][0-9].png')))) for d in ORDEM]
cols = max(len(f) for _, f in linhas)
sheet = Image.new('RGB', (PAD + cols * (TW + PAD), PAD + len(linhas) * (TH + LAB + PAD)), (24, 25, 26))
dr = ImageDraw.Draw(sheet)
for r, (d, fs) in enumerate(linhas):
    y = PAD + r * (TH + LAB + PAD)
    for c, f in enumerate(fs):
        x = PAD + c * (TW + PAD)
        im = Image.open(f).convert('RGB').resize((TW, TH), Image.LANCZOS)
        g = ImageDraw.Draw(im)
        for yy in (250 * TH / 1920, 1650 * TH / 1920):          # as faixas da barra do Story e da resposta
            g.line([(0, yy), (TW, yy)], fill=(70, 74, 78), width=1)
        sheet.paste(im, (x, y + LAB))
        dr.text((x, y + 16), f'{d} · {os.path.basename(f)}', font=F, fill=(198, 250, 65))
sheet.save(os.path.join(D, 'previa.jpg'), quality=88)
print('ok -> stories/destaques/previa.jpg')
