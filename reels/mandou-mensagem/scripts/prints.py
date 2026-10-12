#!/usr/bin/env python3
"""
Prints reais do FAZLO Hospeda -> assets do Reel "Mandou mensagem e ninguém respondeu".

Os prints chegam como RECORTES (1290 px de largura, iPhone 3x), já sem nada abaixo do que
o Reel mostra. Eles NÃO são versionados: este script lê a pasta onde estão e grava em
src/assets/hospeda/ só as versões tratadas:

  - 04 (revisão) e 05 (detalhes): o telefone do hóspede já chega coberto por uma barra neutra
    (o mesmo padrão de "valores em barras"); se um recorte vier com o número, TELEFONE indica a
    caixa a cobrir. O número não existe em nenhum arquivo do repositório.
  - 06 (calendário depois): alinhado ao 02 pelo conteúdo (bloco escuro de indicadores), na
    mesma tela de 1290 x altura do 02, para a troca antes -> depois ser direta.
  - 01 (painel): só os cards do topo (o recorte já termina em "A receber hoje").

    python3 reels/mandou-mensagem/scripts/prints.py <pasta-dos-recortes>

A pasta deve ter: 01-painel.jpg 02-calendario-antes.jpg 03-etapa4.jpg 04-revisao.jpg
05-detalhes.jpg (e 06-calendario-depois.jpg quando chegar).
"""
import json
import os
import sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'assets', 'hospeda')
SRC = sys.argv[1] if len(sys.argv) > 1 else None
if not SRC or not os.path.isdir(SRC):
    raise SystemExit(__doc__)

# caixa da linha do telefone (x0, y0, x1, y1) nos recortes que chegarem com o número à vista
TELEFONE = {}
BARRA = (212, 216, 216)          # cinza neutro das barras de valor

os.makedirs(OUT, exist_ok=True)
manifest = {}
for name in ['01-painel', '02-calendario-antes', '03-etapa4', '04-revisao', '05-detalhes', '06-calendario-depois']:
    src = next((os.path.join(SRC, name + ext) for ext in ('.png', '.jpg', '.jpeg') if os.path.exists(os.path.join(SRC, name + ext))), None)
    if not src:
        print(f'—  {name}: ainda não recebido')
        continue
    im = Image.open(src).convert('RGB')
    if name in TELEFONE:
        x0, y0, x1, y1 = TELEFONE[name]
        bg = im.getpixel((x1 + 30, (y0 + y1) // 2))                 # o fundo do cartão ao lado
        d = ImageDraw.Draw(im)
        d.rectangle((x0, y0, x1, y1), fill=bg)
        cy, h = (y0 + y1) // 2, 22
        d.rounded_rectangle((x0 + 6, cy - h // 2, x0 + 6 + 250, cy + h // 2), radius=h // 2, fill=BARRA)
    out = os.path.join(OUT, name + '.jpg')
    im.save(out, quality=93, subsampling=0)
    manifest[name] = {'w': im.width, 'h': im.height}
    print(f'ok {name}: {im.width}x{im.height}' + ('  (telefone coberto)' if name in TELEFONE else ''))
# a marca do Hospeda como aparece no app (pílula do topo do painel): provisória no CTA até chegar a logo oficial
pill_src = os.path.join(OUT, '01-painel.jpg')
if os.path.exists(pill_src):
    pill = Image.open(pill_src).convert('RGBA').crop((36, 36, 469, 108))
    mask = Image.new('L', pill.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, pill.width - 1, pill.height - 1), radius=pill.height // 2, fill=255)
    pill.putalpha(mask)
    pill.save(os.path.join(OUT, 'hospeda-pilula.png'))
    manifest['hospeda-pilula'] = {'w': pill.width, 'h': pill.height}
    print(f'ok hospeda-pilula: {pill.width}x{pill.height} (marca do app, provisória no CTA)')
# 06 alinhado ao 02 pelo bloco escuro de indicadores (mesma escala e posição)
def bloco_escuro(im):
    import numpy as np
    from scipy import ndimage
    a = np.asarray(im.convert('L')).astype(int) < 45
    lab, n = ndimage.label(a)
    k = int(np.argmax(ndimage.sum(a, lab, range(1, n + 1)))) + 1
    ys, xs = np.where(lab == k)
    return xs.min(), ys.min(), xs.max(), ys.max()
p02, p06 = os.path.join(OUT, '02-calendario-antes.jpg'), os.path.join(OUT, '06-calendario-depois.jpg')
if os.path.exists(p02) and os.path.exists(p06):
    a, d = Image.open(p02).convert('RGB'), Image.open(p06).convert('RGB')
    ba, bd = bloco_escuro(a), bloco_escuro(d)
    k = (ba[2] - ba[0]) / (bd[2] - bd[0])
    big = d.resize((round(d.width * k), round(d.height * k)), Image.LANCZOS)
    canvas = Image.new('RGB', a.size, a.getpixel((a.width // 2, a.height - 2)))
    canvas.paste(big, (round(ba[0] - bd[0] * k), round(ba[1] - bd[1] * k)))
    canvas.save(p06, quality=93, subsampling=0)
    manifest['06-calendario-depois'] = {'w': canvas.width, 'h': canvas.height, 'alinhado_ao_02': round(k, 4)}
    print(f'ok 06 alinhado ao 02: escala {k:.4f}, deslocamento ({ba[0] - bd[0] * k:.1f}, {ba[1] - bd[1] * k:.1f})')
json.dump(manifest, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=2)
