#!/usr/bin/env python3
"""
"Instagram não é site" · corte curto — o som vem da trilha do Reel original.

Os trechos da trilha original (reels/instagram-nao-e-site/audio/trilha.wav)
são emendados nos mesmos cortes da imagem, todos no tempo da música (100 BPM):
  0,0–4,8   original 4,8–9,6   (o gancho novo usa os dois tempos antes dos balões;
                                o "ping" do balão de 5,4 s cai na batida do título, 0,6 s)
  4,8–9,0   original 16,8–21,0 (a barra lima e o site)
  9,0–15,0  original 27,0–33,0 (a síntese, a logo e o CTA)
Cada emenda tem 12 ms de transição; nos cortes de 1,8 s e 9,0 s entra a
varredura da marca ("o corte"), junto com a barra lima. Master em −14 LUFS.
"""
import os
import sys
import numpy as np
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, '..', '..', 'tools', 'audio'))
from fzaudio import *  # noqa: E402,F403
from fzbrand import sig_cut  # noqa: E402

seed(1515)
DATA = load_cues(ROOT)
DUR = float(DATA['duration'])
sr, x = wavfile.read(os.path.join(ROOT, '..', 'instagram-nao-e-site', 'audio', 'trilha.wav'))
assert sr == SR
x = x.astype(np.float64).T / 32768
SEG = [(0.0, 4.8, 4.8), (4.8, 16.8, 4.2), (9.0, 27.0, 6.0)]   # (início no corte, início no original, duração)
XF = int(0.012 * SR)
mix = Mix(DUR)
for k, (a, o, d) in enumerate(SEG):
    i0, n = int(round(o * SR)), int(round(d * SR))
    seg = x[:, i0: i0 + n + XF].copy()
    env = np.ones(seg.shape[1])
    if k > 0:
        env[:XF] = np.linspace(0, 1, XF)
    env[-XF:] = np.linspace(1, 0, XF) if k < len(SEG) - 1 else env[-XF:]
    mix.place('trilha', seg * env, a - (XF / SR if k > 0 else 0) / 2, 1.0)
for c in DATA['cues']:
    if c['type'] == 'wipe':
        sig_cut(mix, c['t'], g=0.9, big=True)
        mix.place('sfx', impact(0.8, 0.4), c['t'], 0.18)
master(mix.render(levels={'trilha': 1.0, 'sfx': 0.9}, reverb={'send': 0.4}), os.path.join(ROOT, 'audio', 'trilha.wav'), lufs=-14.0, fade_out=0.25, drive=0.7)
