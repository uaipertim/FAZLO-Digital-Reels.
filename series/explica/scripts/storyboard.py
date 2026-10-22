#!/usr/bin/env python3
"""
Série Explica (FAZLO Digital) — storyboard e folha do recurso de progresso.

    python3 series/explica/scripts/storyboard.py explica-01
      -> output/explica-01/storyboard.jpg   por capítulo: um quadro do meio da montagem e o quadro da parte pronta
      -> output/explica-01/progresso.jpg    "a página em construção" funcionando: a parte encolhendo e voando, o bloco
                                            aceso com o número, o cursor indo ao próximo bloco, o corte diagonal e o
                                            celular completo no fecho
      -> output/explica-01/progresso/*.png  os mesmos quadros em tamanho real
"""
import json
import os
import subprocess
import sys
import tempfile
import textwrap

from PIL import Image, ImageDraw, ImageFont

SERIE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(os.path.dirname(SERIE))
EP = sys.argv[1] if len(sys.argv) > 1 else 'explica-01'
OUTD = os.path.join(SERIE, 'output', EP)
VIDEO = os.path.join(OUTD, f'fazlo-digital-{EP}.mp4')
LN = json.load(open(os.path.join(SERIE, 'audio', EP, 'linha.json')))
MOT = json.load(open(os.path.join(OUTD, 'revisao', 'motor.json')))
F = lambda w, n: ImageFont.truetype(os.path.join(REPO, 'brand', 'fonts', f'sora-latin-{w}-normal.woff2'), n)
LIMA, CINZA, CLARO = (198, 250, 65), (150, 156, 160), (225, 228, 230)


def quadro(t, tmp, i):
    pth = os.path.join(tmp, f'{i}.png')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{t:.3f}', '-i', VIDEO, '-frames:v', '1', pth], check=True)
    return Image.open(pth).convert('RGB')


caps = LN['capitulos']
# ---------------------------------------------------------------- storyboard: montagem + pronto, por capítulo
TW, TH, PAD, LAB, COLS = 270, 480, 10, 118, 4
quadros = []
for c, m in zip(caps, MOT['montagens']):
    fala = ' '.join(f['texto'] for f in c['frases'])
    if c['n'] == 0:
        quadros.append((c, 0.0, 'quadro 0 = capa', fala))
        quadros.append((c, c['voo'][0] - 0.05, 'pronto (vai para o canto)', fala))
        continue
    meio = min(max((m['primeira'] + m['ultima']) / 2, c['t0'] + 0.8), c['voz_t1'] - 0.5)
    pronto = (c['voo'][0] - 0.35) if c.get('voo') else (c['corte_logo'][0] - 0.1)
    quadros.append((c, meio, 'montagem', fala))
    quadros.append((c, pronto, 'pronto', fala))
quadros.append((caps[-1], LN['duracao'] - 0.1, 'últimos 3 s: só a logo', ''))
rows = (len(quadros) + COLS - 1) // COLS
with tempfile.TemporaryDirectory() as tmp:
    sheet = Image.new('RGB', (COLS * (TW + PAD) + 2 * PAD, rows * (TH + LAB + PAD) + PAD), (8, 9, 9))
    dr = ImageDraw.Draw(sheet)
    for i, (c, t, tipo, fala) in enumerate(quadros):
        im = quadro(t, tmp, i).resize((TW, TH), Image.LANCZOS)
        col = i % COLS
        x = PAD + col * (TW + PAD) + (PAD if col >= 2 else 0)
        y = PAD + (i // COLS) * (TH + LAB + PAD)
        sheet.paste(im, (x, y))
        rot = 'CAPA' if c['n'] == 0 else (f'{c["n"]:02d} · {c["rotulo"]}' if c['n'] <= 7 else c['rotulo'])
        dr.text((x, y + TH + 6), rot, font=F(700, 17), fill=LIMA)
        dr.text((x, y + TH + 28), f'{tipo} · {t:.1f} s', font=F(500, 14), fill=CLARO)
        if i % 2 == 0 and fala:
            for k, ln in enumerate(textwrap.wrap(fala, 40)[:4]):
                dr.text((x, y + TH + 50 + 16 * k), ln, font=F(400, 12), fill=CINZA)
    sheet.save(os.path.join(OUTD, 'storyboard.jpg'), quality=90)

    # ------------------------------------------------------------ o recurso de progresso funcionando
    c1, c2, c3 = caps[1], caps[2], caps[3]
    c7, f = caps[7], caps[-1]
    prog = [
        (0.0, '1 · quadro 0: o celular vazio, 7 blocos tracejados'),
        ((c1['voo'][0] + c1['voo'][1]) / 2, '2 · fim do 01: o topo encolhe e voa até o bloco dele'),
        (c1['voo'][1] + 0.12, '3 · encaixou: o bloco 01 acende em lima, o cursor desce para o 02'),
        ((c2['corte'][0] + c2['corte'][1]) / 2, '4 · a troca: o corte diagonal na inclinação da barra do Z'),
        (c7['voo'][1] + 0.1, '5 · o bloco 07 acende: a página está completa'),
        (MOT['montagens'][-1]['primeira'] + 1.0, '6 · fecho: o celular completo cresce no centro'),
    ]
    os.makedirs(os.path.join(OUTD, 'progresso'), exist_ok=True)
    PW, PH = 360, 640
    sh = Image.new('RGB', (3 * (PW + 14) + 14, 2 * (PH + 70) + 14), (8, 9, 9))
    d2 = ImageDraw.Draw(sh)
    for i, (t, legenda) in enumerate(prog):
        im = quadro(t, tmp, 100 + i)
        im.save(os.path.join(OUTD, 'progresso', f'{i + 1}-{t:06.2f}s.png'))
        x, y = 14 + (i % 3) * (PW + 14), 14 + (i // 3) * (PH + 70)
        sh.paste(im.resize((PW, PH), Image.LANCZOS), (x, y))
        for k, ln in enumerate(textwrap.wrap(f'{legenda} ({t:.2f} s)', 46)[:2]):
            d2.text((x, y + PH + 8 + 20 * k), ln, font=F(600 if k == 0 else 400, 15), fill=LIMA if k == 0 else CLARO)
    sh.save(os.path.join(OUTD, 'progresso.jpg'), quality=90)
print(f'ok -> {os.path.relpath(OUTD, REPO)}/storyboard.jpg + progresso.jpg + progresso/')
