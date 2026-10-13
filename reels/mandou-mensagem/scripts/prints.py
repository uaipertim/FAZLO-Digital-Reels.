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
  - hospeda-logo.png (logo oficial do FAZLO Hospeda, recortada no círculo): o desenho (casa e
    cama) é mantido como veio; só o círculo preto é redesenhado liso (o arquivo tem a borda
    serrilhada).

    python3 reels/mandou-mensagem/scripts/prints.py <pasta-dos-recortes>

A pasta deve ter: 01-painel, 02-calendario-antes, 03-etapa4, 04-revisao, 05-detalhes,
06-calendario-depois (.png ou .jpg) e hospeda-logo.png.
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
# logo oficial do FAZLO Hospeda: círculo preto redesenhado liso + o desenho original por dentro
logo_src = os.path.join(SRC, 'hospeda-logo.png')
if os.path.exists(logo_src):
    import numpy as np
    lg = Image.open(logo_src).convert('RGBA')
    a = np.asarray(lg).astype(int)
    preto = (a[..., :3].mean(2) < 40) & (a[..., 3] > 200)
    ys, xs = np.where(preto)
    cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
    r = ((xs.max() - xs.min()) + (ys.max() - ys.min())) / 4
    SS = 4                                                       # círculo com antisserrilhado (supersample)
    big = Image.new('L', (lg.width * SS, lg.height * SS), 0)
    ImageDraw.Draw(big).ellipse(((cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS), fill=255)
    disco = big.resize(lg.size, Image.LANCZOS)
    out = Image.new('RGBA', lg.size, (0, 0, 0, 0))
    out.paste((0, 0, 0, 255), (0, 0), disco)
    dentro = Image.new('L', lg.size, 0)
    ImageDraw.Draw(dentro).ellipse((cx - r + 10, cy - r + 10, cx + r - 10, cy + r - 10), fill=255)
    out.paste(lg.convert('RGB'), (0, 0), dentro)
    caixa = (int(cx - r) - 2, int(cy - r) - 2, int(cx + r) + 3, int(cy + r) + 3)
    out = out.crop(caixa)
    out.save(os.path.join(OUT, 'hospeda-logo.png'))
    manifest['hospeda-logo'] = {'w': out.width, 'h': out.height}
    print(f'ok hospeda-logo: {out.width}x{out.height} (círculo redesenhado, desenho original)')
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
