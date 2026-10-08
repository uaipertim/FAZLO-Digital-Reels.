#!/usr/bin/env python3
"""
Trilha da calibração: um bipe por tempo (golpe no 1º tempo do compasso) e um
acorde de fundo, a partir de audio/cues.json. Serve para validar a sincronia
som x imagem e o master (-14 LUFS, pico real ≤ -1 dBTP) de ponta a ponta.
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, '..', '..', 'tools', 'audio'))
from fzaudio import *  # noqa: E402,F403

seed(7)
DATA = load_cues(ROOT)
mix = Mix(DATA['duration'])
mix.place('music', pad([57, 64, 69, 72], DATA['duration'], bright=900, att=0.3, rel=0.8), 0, 0.35)
for c in DATA['cues']:
    if c['type'] == 'hit':
        mix.place('drums', kick(0.5), c['t'], 0.9)
        mix.place('sfx', blip(midi(96), 0.12), c['t'], 0.5)
    else:
        mix.place('sfx', blip(midi(84), 0.1), c['t'], 0.45, pan=(-0.5 if c['i'] % 2 else 0.5))
master(mix.render(levels={'music': 0.7, 'drums': 0.85, 'sfx': 0.9}, reverb={'send': 0.4, 'sfx': 0.08}),
       os.path.join(ROOT, 'audio', 'trilha.wav'))
