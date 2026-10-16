#!/usr/bin/env python3
"""
Série "Pelos olhos do hóspede" — efeitos sintetizados (sem música).

A música entra pelo Instagram, então aqui ficam só os efeitos, em −16 LUFS,
todos colocados nos instantes exportados pela animação (audio/cues.json):

  hook      um sopro grave curto que abre o quadro 0
  knock     a batida seca na parte lima do título
  rise      o sopro do título subindo para o cabeçalho
  ping      cada card chega com um toque de vidro, subindo na pentatônica de
            Lá bemol (Lá bemol 5, Dó 6, Mi bemol 6, Fá 6, Lá bemol 6)
  cut       "o corte" da marca: a varredura atravessa o estéreo junto com a barra
  stamp     o carimbo: baque grave, tapa e a pilha chacoalhando
  exit      os cards caem: sopro descendo
  virada    sopro leve e um acorde de vidro (Lá bemol maior com nona)
  fecho     sopro curto
  logo      a assinatura completa (varredura + Lá bemol 5 -> Mi bemol 6)

    python3 series/pelos-olhos-do-hospede/audio.py reels/<id>   -> reels/<id>/audio/trilha.wav
"""
import os
import sys
import numpy as np

ROOT = os.path.abspath(sys.argv[1])
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(REPO, 'tools', 'audio'))
from fzaudio import *  # noqa: E402,F403
from fzbrand import sig_cut, sig_motif, fm_bell  # noqa: E402

seed(707)
DATA = load_cues(ROOT)
DUR = float(DATA['duration'])
mix = Mix(DUR)
PENTA = [80, 84, 87, 89, 92]                      # Lá bemol 5, Dó 6, Mi bemol 6, Fá 6, Lá bemol 6


def glass(f, d=0.6, vel=1.0):
    t = tt(d)
    idx = 1.1 * vel * np.exp(-t / 0.06)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 2.0 * t)) + 0.22 * np.sin(2 * np.pi * f * 4.07 * t) * np.exp(-t / 0.04)
    return s * np.exp(-t / 0.28) * np.minimum(1, t / 0.0015) * vel


def thud(d=0.5, f=62):
    t = tt(d)
    body = np.sin(2 * np.pi * np.cumsum(f + 90 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.13)
    slap = filt(noise(d), [900, 5200], 'band') * np.exp(-t / 0.018)
    return np.tanh(1.6 * (body + 0.9 * slap)) * np.minimum(1, t / 0.0008)


def rattle(d=0.3):
    t = tt(d)
    out = np.zeros(len(t))
    for k in range(5):
        i = int((0.018 + k * 0.034 + 0.01 * np.sin(k * 7)) * SR)
        c = click(2400 + 500 * k, 0.03) * (0.7 ** k)
        out[i:i + len(c)] += c[: max(0, len(out) - i)]
    return out


for c in DATA['cues']:
    t, ty = c['t'], c['type']
    if ty == 'hook':
        mix.place('sfx', filt(whoosh(0.5, 120, 900, 0.15), 1800, 'low'), t, 0.35)
    elif ty == 'knock':
        mix.place('sfx', thud(0.35, 80), t, 0.55)
        mix.place('sfx', click(4200, 0.02), t, 0.25)
    elif ty == 'rise':
        mix.place_pan('sfx', whoosh(c.get('d', 0.5), 400, 3200, 0.55), t, 0.32, -0.2, 0.2)
    elif ty == 'ping':
        k = c['k']
        g = glass(midi(PENTA[min(k, len(PENTA) - 1)]), 0.7)
        pan = [-0.25, 0.2, -0.1, 0.25, 0.0][k % 5]
        mix.place('sfx', g, t, 0.42, pan)
        mix.place('send', g, t, 0.22)
        mix.place('sfx', filt(whoosh(0.22, 600, 2400, 0.7), 4000, 'low'), t - 0.16, 0.12)
    elif ty == 'cut':
        sig_cut(mix, t + 0.02, g=1.0, big=True)
    elif ty == 'stamp':
        mix.place('sfx', thud(0.6, 58), t, 0.95)
        mix.place('sfx', impact(1.0, 0.5), t, 0.28)
        mix.place('sfx', rattle(0.3), t + 0.01, 0.3)
        mix.place('send', thud(0.6, 58), t, 0.18)
    elif ty == 'exit':
        mix.place_pan('sfx', whoosh(0.55, 2400, 260, 0.35), t, 0.3, 0.15, -0.15)
    elif ty == 'virada':
        mix.place('sfx', whoosh(0.4, 300, 2600, 0.6), t - 0.1, 0.18)
        chord = sum(glass(midi(n), 1.6, 0.6) for n in (68, 72, 75, 82)) / 4
        mix.place('sfx', chord, t + 0.05, 0.35)
        mix.place('send', chord, t + 0.05, 0.35)
    elif ty == 'fecho':
        mix.place('sfx', whoosh(0.3, 500, 3000, 0.6), t - 0.05, 0.14)
    elif ty == 'logo':
        sig_motif(mix, t + 0.2, 0.3, g=0.9)
    elif ty == 'slash':
        sig_cut(mix, t, g=0.8)

# tom de sala quase inaudível, para nunca haver silêncio digital
mix.place('room', filt(noise(DUR), 900, 'low') * db(-56) * 8, 0, 1.0)

master(mix.render(levels={'sfx': 1.0, 'room': 1.0}, reverb={'send': 0.55, 'sfx': 0.06}),
       os.path.join(ROOT, 'audio', 'trilha.wav'), lufs=-16.0, fade_out=0.3)
