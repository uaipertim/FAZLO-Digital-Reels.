#!/usr/bin/env python3
"""
Prévia e revisão de um carrossel (roda depois do render dos slides).

    python3 tools/carousel_qa.py <carrossel>  ->  carrosseis/<pasta>/output/previa.jpg
                                                  carrosseis/<pasta>/output/revisao/relatorio.txt
                                                  carrosseis/<pasta>/output/revisao/tamanho-real.jpg
                                                  carrosseis/<pasta>/output/revisao/capa-no-perfil.jpg

Confere, para cada slide: tamanho (format no carrossel.json), imagem opaca,
nada encostado nas bordas laterais e no topo ("qa.margin"; o rodapé pode
sangrar se "qa.bleedBottom"), o canto do contador nativo do Instagram livre
("1/9", no alto à direita) e, na capa, o conteúdo dentro do recorte 3:4 da
grade do perfil. Sai com código 1 se algo falhar.
"""
import json
import os
import sys
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import reelcfg  # noqa: E402  (fonte das folhas de revisão)

REPO = reelcfg.REPO
arg = sys.argv[1] if len(sys.argv) > 1 else None
if not arg:
    raise SystemExit('informe o carrossel: ex. o-que-o-hospede-procura')
CID = os.path.basename(arg.rstrip('/'))
ROOT = os.path.join(REPO, 'carrosseis', CID)
CFG = json.load(open(os.path.join(ROOT, 'carrossel.json')))
QA = CFG.get('qa', {})
W, H = CFG.get('format', {}).get('width', 1080), CFG.get('format', {}).get('height', 1350)
N = CFG.get('slides', 0)
OUT = os.path.join(ROOT, 'output')
REV = os.path.join(OUT, 'revisao')
os.makedirs(REV, exist_ok=True)

MARGIN = QA.get('margin', 40)              # faixa das bordas que não pode ter conteúdo
BLEED_BOTTOM = QA.get('bleedBottom', False)
IG_COUNTER = QA.get('igCounter', [940, 30, 1050, 100])   # pílula "1/9" do app
LUM = 90                                   # luminância considerada conteúdo (fundo é ~6)
TOL = 0.002                                # fração de pixels tolerada numa faixa

report, fails = [], []


def ok(cond, msg):
    report.append(('OK   ' if cond else 'FALHA') + '  ' + msg)
    if not cond:
        fails.append(msg)


def bright(a, x0, y0, x1, y1):
    reg = a[max(0, y0):min(H, y1), max(0, x0):min(W, x1)]
    return float((reg > LUM).mean()) if reg.size else 0.0


files = [os.path.join(OUT, f'{i:02d}.png') for i in range(1, N + 1)]
missing = [os.path.basename(f) for f in files if not os.path.exists(f)]
ok(not missing, f'{N} slides em output/' + (f' (faltam: {", ".join(missing)})' if missing else ''))
if missing:
    print('\n'.join(report)); sys.exit(1)

imgs = []
for i, f in enumerate(files, 1):
    im = Image.open(f)
    imgs.append(im.convert('RGB'))
    tag = f'{i:02d}'
    ok(im.size == (W, H), f'{tag}: {im.size[0]}x{im.size[1]} (alvo {W}x{H})')
    alpha = np.asarray(im.convert('RGBA'))[..., 3]
    ok(alpha.min() == 255, f'{tag}: imagem opaca')
    lum = np.asarray(im.convert('L'), dtype=np.float32)
    sides = [('esquerda', bright(lum, 0, 0, MARGIN, H)), ('direita', bright(lum, W - MARGIN, 0, W, H)), ('topo', bright(lum, 0, 0, W, MARGIN))]
    if not BLEED_BOTTOM:
        sides.append(('rodapé', bright(lum, 0, H - MARGIN, W, H)))
    bad = [f'{n} {v * 100:.2f}%' for n, v in sides if v > TOL]
    ok(not bad, f'{tag}: bordas livres ({MARGIN} px)' + (f' — conteúdo em: {", ".join(bad)}' if bad else ''))
    cnt = bright(lum, *IG_COUNTER)
    ok(cnt <= TOL, f'{tag}: canto do contador nativo do Instagram livre ({cnt * 100:.2f}%)')
    if i == 1:
        cw = round(H * 0.75)
        x0, x1 = (W - cw) // 2, (W + cw) // 2
        out = max(bright(lum, 0, 0, x0, H), bright(lum, x1, 0, W, H))
        ok(out <= TOL, f'capa: conteúdo dentro do recorte 3:4 da grade do perfil (x {x0}–{x1})')

font, small = reelcfg.font(22), reelcfg.font(16)

# prévia: 3 colunas
COLS, TW, PAD, LAB = 3, 480, 24, 40
TH = round(TW * H / W)
rows = (N + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * (TW + PAD) + PAD, rows * (TH + LAB + PAD) + PAD), (20, 20, 20))
d = ImageDraw.Draw(sheet)
for i, im in enumerate(imgs):
    x, y = PAD + (i % COLS) * (TW + PAD), PAD + (i // COLS) * (TH + LAB + PAD)
    sheet.paste(im.resize((TW, TH), Image.LANCZOS), (x, y))
    d.text((x, y + TH + 10), f'{i + 1:02d}/{N:02d}', font=font, fill=(235, 235, 235))
sheet.save(os.path.join(OUT, 'previa.jpg'), quality=90)

# tamanho real: largura de um celular (412 pt) — o slide como aparece no feed
RW = 412
RH = round(RW * H / W)
real = Image.new('RGB', (COLS * (RW + 16) + 16, rows * (RH + 16) + 16), (255, 255, 255))
for i, im in enumerate(imgs):
    real.paste(im.resize((RW, RH), Image.LANCZOS), (16 + (i % COLS) * (RW + 16), 16 + (i // COLS) * (RH + 16)))
real.save(os.path.join(REV, 'tamanho-real.jpg'), quality=90)

# capa na grade do perfil (recorte 3:4), ao lado de duas posições vazias
GW = 300
GH = round(GW * 4 / 3)
cw = round(H * 0.75)
crop = imgs[0].crop(((W - cw) // 2, 0, (W + cw) // 2, H)).resize((GW, GH), Image.LANCZOS)
grid = Image.new('RGB', (3 * GW + 4, GH + 60), (255, 255, 255))
gd = ImageDraw.Draw(grid)
grid.paste(crop, (0, 0))
for k in (1, 2):
    gd.rectangle([k * (GW + 2), 0, k * (GW + 2) + GW - 1, GH - 1], fill=(225, 225, 225))
gd.text((8, GH + 18), 'capa na grade do perfil (recorte 3:4)', font=small, fill=(40, 40, 40))
grid.save(os.path.join(REV, 'capa-no-perfil.jpg'), quality=90)

report.append('')
report.append('RESULTADO: ' + ('aprovado' if not fails else f'{len(fails)} falha(s)'))
title = f'{CFG.get("title", CID).upper()} — revisão do carrossel'
open(os.path.join(REV, 'relatorio.txt'), 'w').write(title + '\n\n' + '\n'.join(report) + '\n')
print('\n'.join(report))
print('prévia ->', os.path.relpath(os.path.join(OUT, 'previa.jpg')))
sys.exit(1 if fails else 0)
