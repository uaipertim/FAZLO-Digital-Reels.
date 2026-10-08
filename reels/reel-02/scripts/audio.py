#!/usr/bin/env python3
"""
Trilha + efeitos do FAZLO Digital reel-02 — sintetizados (tools/audio/fzaudio.py).

ESQUELETO: a trilha será composta junto com o Reel, a partir do briefing e da
assinatura sonora da FAZLO Digital.

A sincronia vem da animação: `node tools/render.cjs cues reel-02` exporta
audio/cues.json e este script coloca cada som exatamente nesses instantes.

    python3 reels/reel-02/scripts/audio.py   -> audio/trilha.wav (48 kHz, estéreo, -14 LUFS)
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, '..', '..', 'tools', 'audio'))
from fzaudio import *  # noqa: E402,F401,F403

seed(0)
DATA = load_cues(ROOT)
mix = Mix(DATA['duration'])

for c in DATA['cues']:
    pass  # ex.: mix.place('sfx', blip(midi(84)), c['t'], 0.3)

if not mix.buses:
    raise SystemExit('reel-02: trilha ainda não composta (nenhum som na mixagem)')
master(mix.render(levels={'music': 0.75, 'drums': 0.8, 'sfx': 0.9}, reverb={'send': 0.5, 'sfx': 0.1}),
       os.path.join(ROOT, 'audio', 'trilha.wav'))
