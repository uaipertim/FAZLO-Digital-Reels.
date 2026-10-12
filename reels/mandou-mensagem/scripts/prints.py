#!/usr/bin/env python3
"""
Prints reais do FAZLO Hospeda -> assets do Reel "Mandou mensagem e ninguém respondeu".

Os prints chegam como RECORTES (1290 px de largura, iPhone 3x), já sem nada abaixo do que
o Reel mostra. Eles NÃO são versionados: este script lê a pasta onde estão e grava em
src/assets/hospeda/ só as versões tratadas:

  - 04 (revisão) e 05 (detalhes): o telefone do hóspede vira uma barra neutra (o mesmo padrão
    de "valores em barras"). O número não existe em nenhum arquivo do repositório.
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

# caixa da linha do telefone em cada recorte (x0, y0, x1, y1), medida nos próprios recortes
TELEFONE = {
    '04-revisao': (168, 232, 460, 282),
    '05-detalhes': (105, 309, 396, 359),
}
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
json.dump(manifest, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=2)
