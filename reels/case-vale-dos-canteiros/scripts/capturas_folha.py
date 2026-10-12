#!/usr/bin/env python3
"""Folha de revisão das capturas complementares, na ordem da navegação do hóspede, com cada
toque marcado (círculo lima) sobre a tela em que ele acontece.

    python3 reels/case-vale-dos-canteiros/scripts/capturas_folha.py  ->  output/revisao/capturas.jpg
"""
import json
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(os.path.dirname(ROOT))
D = os.path.join(ROOT, 'src', 'assets', 'site')
M = json.load(open(os.path.join(D, 'manifest.json')))
LIME = (198, 250, 65)
W, H = 390, 844                      # px CSS da área visível (as telas são 2x)
FONT = os.path.join(REPO, 'brand', 'fonts', 'sora-latin-600-normal.woff2')


def font(size):
    try:
        return ImageFont.truetype(FONT, size)
    except OSError:
        return ImageFont.load_default()


def screen(file, taps=(), label=''):
    im = Image.open(os.path.join(D, file)).convert('RGB').resize((W, H), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    for r in taps:
        if not r:
            continue
        cx, cy = r['x'] + r['w'] / 2, r['y'] + r['h'] / 2
        d.ellipse((cx - 22, cy - 22, cx + 22, cy + 22), outline=LIME, width=5)
        d.ellipse((cx - 6, cy - 6, cx + 6, cy + 6), fill=LIME)
    return im, label


def box(file, rects, label=''):
    im = Image.open(os.path.join(D, file)).convert('RGB').resize((W, H), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    for r in rects:
        if r:
            d.rounded_rectangle((r['x'] - 4, r['y'] - 4, r['x'] + r['w'] + 4, r['y'] + r['h'] + 4), 8, outline=LIME, width=4)
    return im, label


def modal_content():
    """conteúdo rolável do modal do Chalé de Pedra 6, emendado (topo + fim), com os blocos marcados"""
    c = M['chalet6']; r = c['rect']; k = 2
    s0 = Image.open(os.path.join(D, c['files']['s0'])); s1 = Image.open(os.path.join(D, c['files']['s1']))
    cut = 700
    full = Image.new('RGB', (r['w'] * k, c['scrollH'] * k), 'white')
    full.paste(s0.crop((0, 0, s0.width, cut * k)), (0, 0))
    off = c['s1Scroll']
    full.paste(s1.crop((0, (cut - off) * k, s1.width, s1.height)), (0, cut * k))
    im = full.resize((r['w'], c['scrollH']), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    for key in ('comodidades', 'alimentacao'):
        b = c['blocks'][key]
        d.rounded_rectangle((b['x'] - r['x'] - 4, b['y'] - 4, b['x'] - r['x'] + b['w'] + 4, b['y'] + b['h'] + 4), 8, outline=LIME, width=4)
    return im.crop((0, 0, r['w'], min(c['scrollH'], 1100))).resize((W, int(min(c['scrollH'], 1100) * W / r['w']))), 'modal (conteúdo)'


F, C6, DU = M['form'], M['chalet6'], M['dayuse']
tiles = [
    screen('hero-1.jpg', label='1 · topo (foto 1)'), screen('hero-2.jpg', label='topo (foto 2)'),
    screen(F['files']['form0'], [F['taps']['entrada']], '2 · Entrada'),
    screen(F['files']['calOct'], [F['taps']['proximo']], 'calendário: próximo mês'),
    screen(F['files']['calNov'], [F['taps']['dia5']], 'dia 5'),
    screen(F['files']['calD5'], [F['taps']['dia8']], 'dia 8'),
    screen(F['files']['form1'], [F['taps']['maisCriancas']], '+ criança'),
    screen(F['files']['form2'], [F['taps']['acomodacao']], 'acomodação'),
    screen(F['files']['list'], [F['taps']['chale6']], 'Chalé de Pedra 6'),
    screen(F['files']['form3'], [F['taps']['enviar']], 'enviar'),
    screen(C6['files']['page'], [C6['taps']['ver']], '3 · Ver detalhes'),
    screen(C6['files']['top'], [], 'modal'),
    modal_content(),
    screen(DU['files']['page'], [DU['taps']['menu']], '5 · MENU'),
    screen(DU['files']['menu'], [DU['taps']['reservar']], 'Reservar Day Use'),
    box(DU['files']['modal'], list(DU['bullets'].values()), 'Day Use'),
]
# rodapé em 4x: o "Site por" + logo
ft = M['footer']
fim = Image.open(os.path.join(D, ft['file'])).convert('RGB')
fim = fim.resize((W, int(fim.height * W / fim.width)), Image.LANCZOS)
lk = ft['link']
ImageDraw.Draw(fim).rounded_rectangle((lk['x'] - 6, lk['y'] - ft['y'] - 6, lk['x'] + lk['w'] + 6, lk['y'] - ft['y'] + lk['h'] + 6), 8, outline=LIME, width=4)
tiles.append((fim, '7 · rodapé (4x)'))

cols = 6
th = max(t[0].height for t in tiles)
rows = (len(tiles) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (W + 20) + 20, rows * (th + 60) + 20), (20, 22, 22))
dr = ImageDraw.Draw(sheet)
for i, (im, label) in enumerate(tiles):
    x, y = 20 + (i % cols) * (W + 20), 20 + (i // cols) * (th + 60)
    sheet.paste(im, (x, y + 40))
    dr.text((x, y + 6), label, fill=LIME, font=font(24))
out = os.path.join(ROOT, 'output', 'revisao', 'capturas.jpg')
os.makedirs(os.path.dirname(out), exist_ok=True)
sheet.save(out, quality=84)
print('ok ->', os.path.relpath(out))
