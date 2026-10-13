#!/usr/bin/env python3
"""
Revisão das peças estáticas de Stories (roda depois de tools/stories.cjs).

    python3 tools/stories_qa.py <pasta>   ->  stories/<pasta>/revisao/relatorio.txt

Confere em cada PNG: 1080x1920 opaco; as zonas do JSON (faixa do app no topo, centro e rodapé)
só com o fundo liso; a logo inteira abaixo da faixa do app; só as cores da marca (fundo, lima
e o branco da logo, mais as bordas suavizadas entre elas). Sai com código 1 se algo falhar.
"""
import json
import os
import sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ID = sys.argv[1] if len(sys.argv) > 1 else sys.exit('informe a pasta: ex. fundos')
DIR = os.path.join(ROOT, 'stories', ID)
CFG = json.load(open(os.path.join(DIR, f'{ID}.json')))
W, H = CFG['format']['width'], CFG['format']['height']
hexrgb = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float)
BG, LIMA, BRANCO = hexrgb(CFG['cores']['fundo']), hexrgb(CFG['cores']['detalhe']), np.array([255.0, 255, 255])
LOGO = json.load(open(os.path.join(DIR, 'revisao', 'logo.json')))['caixa']

linhas, falhas = [], []


def ok(cond, msg):
    linhas.append(('OK   ' if cond else 'FALHA') + '  ' + msg)
    if not cond:
        falhas.append(msg)


def fora_da_paleta(rgb):
    """Quanto cada pixel foge das misturas de fundo, lima e branco (o triângulo dessas 3 cores).
    Na emenda da barra com as letras da logo as três se misturam; qualquer outra cor fica longe."""
    M = np.stack([LIMA - BG, BRANCO - BG], 1)                 # rgb = BG + M @ (u, v), u, v >= 0, u + v <= 1
    uv = (rgb - BG) @ np.linalg.pinv(M).T
    uv = np.clip(uv, 0, None)
    uv = uv / np.maximum(uv.sum(-1, keepdims=True), 1)
    return np.abs(rgb - (BG + uv @ M.T)).max(-1)


for p in CFG['pecas']:
    f = os.path.join(DIR, p['id'] + '.png')
    linhas.append(f"\n{p['id']}.png  ({p['uso']})")
    im = Image.open(f)
    ok(im.size == (W, H), f'{im.size[0]}x{im.size[1]}')
    a = np.asarray(im.convert('RGBA')).astype(float)
    ok(a[..., 3].min() == 255, 'opaca')
    rgb = a[..., :3]
    marcado = np.abs(rgb - BG).max(-1) > 2
    for nome, (y0, y1) in CFG['zonas'].items():
        n = int(marcado[y0:y1].sum())
        ok(n == 0, f'{nome} y {y0}–{y1} livre (só fundo {CFG["cores"]["fundo"]})' + ('' if n == 0 else f': {n} px ocupados'))
    d = fora_da_paleta(rgb)
    ok(d.max() <= 4, f'só as cores da marca (desvio máximo {d.max():.1f}/255)')
    x0, y0, x1, y1 = LOGO
    ys, xs = np.where(marcado[:, :])
    na_logo = (xs >= x0 - 2) & (xs <= x1 + 2) & (ys >= y0 - 2) & (ys <= y1 + 2)
    ly = ys[na_logo]
    ok(ly.min() >= CFG['zonas']['app'][1], f'logo y {ly.min()}–{ly.max()}, abaixo da faixa do app (y {CFG["zonas"]["app"][1]})')
    fx, fy = xs[~na_logo], ys[~na_logo]
    if len(fx):
        linhas.append(f'       detalhe lima: x {fx.min()}–{fx.max()}, y {fy.min()}–{fy.max()}'
                      f' ({"corta a borda" if fx.min() == 0 or fx.max() == W - 1 else "dentro da tela"})')

linhas.append('\nRESULTADO: ' + ('aprovado' if not falhas else f'{len(falhas)} falha(s)'))
txt = f'STORIES/{ID.upper()} — revisão\n' + '\n'.join(linhas) + '\n'
open(os.path.join(DIR, 'revisao', 'relatorio.txt'), 'w').write(txt)
print(txt)
sys.exit(1 if falhas else 0)
