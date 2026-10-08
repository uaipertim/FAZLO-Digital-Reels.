#!/usr/bin/env python3
"""
Torna transparente o fundo de uma logo, sem alterar a arte.

    python3 tools/logo_alpha.py <entrada.png|jpg> <saida.png> [--fundo claro|escuro] [--margem 2]

Só o fundo CONECTADO ÀS BORDAS da imagem vira transparente (o que está dentro
da logo, mesmo da mesma cor, fica intacto). Na borda (anti-aliasing), o alfa é
proporcional ao contraste com o fundo. O resultado é recortado ao menor
retângulo que contém a logo, com margem. O arquivo original não é tocado.
"""
import argparse
import numpy as np
from PIL import Image
from scipy import ndimage

ap = argparse.ArgumentParser()
ap.add_argument('src')
ap.add_argument('out')
ap.add_argument('--fundo', choices=['claro', 'escuro'], default='claro')
ap.add_argument('--margem', type=int, default=2)
a = ap.parse_args()

rgba_in = np.asarray(Image.open(a.src).convert('RGBA')).astype(np.float32)
rgb, alpha_in = rgba_in[..., :3], rgba_in[..., 3] / 255
lum = rgb.mean(axis=2)
bg = lum > 128 if a.fundo == 'claro' else lum < 128

# 1) fundo = região da cor de fundo conectada à borda da imagem
lab, _ = ndimage.label(bg)
border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
outside = np.isin(lab, border[border > 0])

# 2) alfa: 0 no fundo, 1 na logo; na faixa de borda, proporcional ao contraste
alpha = np.ones_like(lum)
alpha[outside] = 0.0
edge = ndimage.binary_dilation(outside, iterations=3) & ~ndimage.binary_erosion(outside, iterations=3)
k = (255.0 - lum[edge]) / 235.0 if a.fundo == 'claro' else lum[edge] / 235.0
alpha[edge] = np.clip(k, 0, 1)
alpha *= alpha_in

# 3) "despill": nos pixels de borda, remove a contribuição da cor de fundo
out = rgb.copy()
bgc = 255.0 if a.fundo == 'claro' else 0.0
m = edge & (alpha > 0.02)
out[m] = np.clip((rgb[m] - bgc * (1 - alpha[m, None])) / alpha[m, None], 0, 255)
rgba = np.dstack([out, alpha * 255.0]).round().clip(0, 255).astype(np.uint8)

ys, xs = np.nonzero(alpha > 0.02)
box = (max(0, xs.min() - a.margem), max(0, ys.min() - a.margem), min(lum.shape[1], xs.max() + 1 + a.margem), min(lum.shape[0], ys.max() + 1 + a.margem))
img = Image.fromarray(rgba, 'RGBA').crop(box)
img.save(a.out, optimize=True)
print('ok ->', a.out, img.size)
