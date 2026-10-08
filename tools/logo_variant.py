#!/usr/bin/env python3
"""
Gera uma variante de cor da logo a partir do arquivo-mestre, sem alterar o desenho.

    python3 tools/logo_variant.py <mestre> <saida.png> --tinta '#181918'

Só a cor das letras (pixels claros e sem saturação) é trocada pela tinta indicada;
a barra lima e o canal alfa (contornos, anti-aliasing) ficam exatamente como no
mestre. Uso: produzir a versão escura oficial (letras pretas, barra lima, para
fundos claros) a partir do mestre em alta resolução.
"""
import argparse
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('src')
ap.add_argument('out')
ap.add_argument('--tinta', default='#181918')
a = ap.parse_args()

ink = np.array([int(a.tinta[i:i + 2], 16) for i in (1, 3, 5)], dtype=np.float32)
px = np.asarray(Image.open(a.src).convert('RGBA')).astype(np.float32)
rgb, alpha = px[..., :3], px[..., 3:]
sat = rgb.max(axis=2) - rgb.min(axis=2)
lime = (sat > 60) & (rgb[..., 1] > rgb[..., 2] + 60)      # barra verde-lima: intocada
out = rgb.copy()
out[~lime] = ink
res = np.concatenate([out, alpha], axis=2).round().clip(0, 255).astype(np.uint8)
Image.fromarray(res, 'RGBA').save(a.out, optimize=True)
print('ok ->', a.out, f'{lime.sum()} px lima preservados')
