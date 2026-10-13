#!/usr/bin/env python3
"""
Revisão das capas de destaques (roda depois de tools/destaques.cjs).

    python3 tools/destaques_qa.py   ->  destaques/revisao/relatorio.txt

Confere em cada PNG: 1080x1920 opaco; fundo liso na cor da marca; só duas cores (fundo e lima,
mais as bordas suavizadas entre elas); o ícone inteiro dentro do círculo seguro; o tamanho do
ícone (~45% do diâmetro); o ícone centrado no círculo. Sai com código 1 se algo falhar.
"""
import json
import os
import sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, 'destaques')
CFG = json.load(open(os.path.join(DIR, 'destaques.json')))
W, H = CFG['format']['width'], CFG['format']['height']
hexrgb = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float)
BG, LIMA = hexrgb(CFG['cores']['fundo']), hexrgb(CFG['cores']['icone'])
CX, CY, D = CFG['circuloSeguro']['cx'], CFG['circuloSeguro']['cy'], CFG['circuloSeguro']['d']
ALVO = CFG['icone']['fracao']

linhas, falhas = [], []


def ok(cond, msg):
    linhas.append(('OK   ' if cond else 'FALHA') + '  ' + msg)
    if not cond:
        falhas.append(msg)


for c in CFG['capas']:
    p = os.path.join(DIR, c['id'] + '.png')
    linhas.append(f"\n{c['id']}.png  (destaque \"{c['nome']}\")")
    im = Image.open(p)
    ok(im.size == (W, H), f'{im.size[0]}x{im.size[1]}')
    a = np.asarray(im.convert('RGBA')).astype(float)
    ok(a[..., 3].min() == 255, 'opaca')
    rgb = a[..., :3]
    cantos = [rgb[0, 0], rgb[0, -1], rgb[-1, 0], rgb[-1, -1], rgb[40, W // 2], rgb[-40, W // 2]]
    ok(all(np.abs(q - BG).max() <= 1 for q in cantos), f"fundo liso {CFG['cores']['fundo']}")
    # cada pixel = fundo + t·(lima − fundo): mede t e o quanto o pixel foge dessa reta
    v = LIMA - BG
    t = np.clip(((rgb - BG) @ v) / (v @ v), 0, 1)
    fora = np.abs(rgb - (BG + t[..., None] * v)).max(-1)
    ok(fora.max() <= 3, f'só fundo e lima (desvio máximo {fora.max():.1f}/255)')
    ys, xs = np.where(t > 0.04)
    r = np.hypot(xs - CX, ys - CY).max()
    ok(r <= D / 2 - 20, f'ícone dentro do círculo seguro (até {r:.0f} px do centro; raio {D / 2:.0f})')
    w, h = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
    frac = max(w, h) / D
    ok(abs(frac - ALVO) <= 0.04, f'ícone {w}x{h} px = {frac * 100:.1f}% do diâmetro (alvo ~{ALVO * 100:.0f}%)')
    dx, dy = (xs.min() + xs.max()) / 2 - CX, (ys.min() + ys.max()) / 2 - CY
    ok(abs(dx) <= 3 and abs(dy) <= 3, f'centrado ({dx:+.1f}, {dy:+.1f} px)')

traco = CFG['icone']['traco'] * CFG['icone']['escala']
linhas.append(f"\ntraço: {traco:.0f} px em todas (mesma escala e mesma espessura no SVG); sem texto nas capas")
linhas.append('\nRESULTADO: ' + ('aprovado' if not falhas else f'{len(falhas)} falha(s)'))
os.makedirs(os.path.join(DIR, 'revisao'), exist_ok=True)
txt = 'DESTAQUES — revisão das capas\n' + '\n'.join(linhas) + '\n'
open(os.path.join(DIR, 'revisao', 'relatorio.txt'), 'w').write(txt)
print(txt)
sys.exit(1 if falhas else 0)
