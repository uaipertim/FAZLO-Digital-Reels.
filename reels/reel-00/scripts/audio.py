#!/usr/bin/env python3
"""
Trilha + efeitos do FAZLO Digital Reel 00 "Da ideia ao digital." — 100% sintetizados
(tools/audio/fzaudio.py + timbres deste Reel), sem samples.

128 BPM, Fá menor -> Lá bemol maior. Eletrônica cinematográfica: pulso de
coração e poeira cintilante na faísca, drop com bumbo reto, baixo em
contratempo e acordes em supersaw; o código ganha arpejo "digital" com
glitches; o túnel e a convergência são subidas; a marca resolve no maior.

ASSINATURA SONORA DA FAZLO DIGITAL — "o corte":
  1. a varredura: ruído metálico filtrado que sobe de 1,8 kHz a 13 kHz e
     atravessa o estéreo da esquerda para a direita, como a barra da logo
     (que sobe para a direita);
  2. o intervalo: duas notas de sino FM, Lá bemol 5 e Mi bemol 6 (uma quinta
     justa para cima), a segunda uma colcheia depois.
  Toda barra que corta a tela usa a varredura; a abertura toca só a primeira
  nota; a marca toca a assinatura completa.

A sincronia vem da animação: `node tools/render.cjs cues 00` exporta
audio/cues.json e cada efeito cai exatamente no instante do evento visual.

    python3 reels/reel-00/scripts/audio.py   -> audio/trilha.wav (48 kHz, estéreo, -14 LUFS)
"""
import os
import sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, '..', '..', 'tools', 'audio'))
from fzaudio import *  # noqa: E402,F403

seed(2600)
DATA = load_cues(ROOT)
BPM = DATA['bpm']
BT = 60.0 / BPM
BAR = 4 * BT
S16 = BT / 4
DUR = float(DATA['duration'])
CUES = DATA['cues']
mix = Mix(DUR)


def bar(n, beats=0.0):
    return (n - 1) * BAR + beats * BT


# ------------------------------------------------------------------ harmonia
CH = {
    'Fm9': [53, 56, 60, 63, 67], 'Db9': [49, 53, 56, 60, 63], 'Ab9': [56, 60, 63, 67, 70],
    'Eb9': [51, 55, 58, 62, 65], 'Ebsus': [51, 56, 58, 63, 65],
}
ROOT_N = {'Fm9': 41, 'Db9': 37, 'Ab9': 44, 'Eb9': 39, 'Ebsus': 39}
PROG = {1: 'Fm9', 2: 'Fm9', 3: 'Fm9', 4: 'Db9', 5: 'Ab9', 6: 'Eb9', 7: 'Db9', 8: 'Ab9', 9: 'Eb9', 10: 'Fm9',
        11: 'Ebsus', 12: 'Ab9', 13: 'Ab9', 14: 'Ab9', 15: 'Ab9'}


# ------------------------------------------------------------------ timbres deste Reel
def fm_bell(f, d=2.4, bright=1.0):
    """Sino FM brilhante (razão 3,5)."""
    t = tt(d)
    idx = 3.2 * bright * np.exp(-t / 0.35)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 3.5 * t))
    s += 0.35 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.5)
    return s * np.exp(-t / (d / 3.2)) * np.minimum(1, t / 0.002)


def swipe(d=0.16, f0=1800, f1=13000):
    """A varredura da assinatura: ruído metálico (com parciais inarmônicos) subindo."""
    t = tt(d)
    n = sweep(noise(d), f0, f1, q=3.0)
    ring = sum(np.sin(2 * np.pi * fr * t) for fr in (3150, 4870, 7230)) * 0.12
    env = np.minimum(1, t / 0.004) * np.exp(-t / (d * 0.55))
    return (n + ring * np.exp(-t / 0.05)) * env


def sig_cut(t0, g=1.0, dir_=1, big=False):
    """Varredura da assinatura no instante t0, atravessando o estéreo."""
    s = swipe(0.26 if big else 0.16)
    mix.place_pan('sfx', s, t0, 0.55 * g, -0.9 * dir_, 0.9 * dir_)
    mix.place('sfx', click(5200, 0.02), t0, 0.5 * g)
    mix.place('send', s, t0, 0.25 * g)


def sig_motif(t0, g=1.0, full=True):
    """O intervalo da marca: Lá bemol 5 e, uma colcheia depois, Mi bemol 6."""
    for k, (n, dt) in enumerate([(80, 0.0), (87, BT / 2)][: 2 if full else 1]):
        d = 3.2 if k else 2.4
        b, b2 = fm_bell(midi(n), d), fm_bell(midi(n) * 1.004, d)
        mix.place('sfx', np.stack([b, b2]) * 0.5, t0 + dt, 0.42 * g)
        mix.place('send', b, t0 + dt, 0.35 * g)


def supersaw(notes, d, bright=4000, att=0.004, dec=0.22):
    t = tt(d)
    out = np.zeros(len(t))
    r = np.random.default_rng(len(notes) * 7 + int(notes[0]))
    for n in notes:
        for dc in (-0.12, -0.04, 0.05, 0.13):
            out += saw(midi(n + dc), t, bright, ph=r.uniform(0, 6.28))
    env = np.minimum(1, t / att) * np.exp(-t / dec)
    return filt(out * env / (len(notes) * 4), bright, 'low')


def pluck_saw(f, d=0.22, bright=2600, dec=0.09):
    t = tt(d)
    return filt(saw(f, t, bright) * np.exp(-t / dec) * np.minimum(1, t / 0.002), bright, 'low')


def sub(f, d, drive=1.6):
    t = tt(d)
    s = np.tanh(drive * np.sin(2 * np.pi * f * t)) / np.tanh(drive)
    return s * np.minimum(1, t / 0.004) * np.clip((d - t) / 0.03, 0, 1)


def tom(f=110, d=0.4):
    t = tt(d)
    return np.sin(2 * np.pi * np.cumsum(f * (1 + 0.8 * np.exp(-t / 0.03))) / SR) * np.exp(-t / 0.14)


def imp(d=2.0, big=1.0):
    """Impacto para celular: sub contido + corpo em médios + ar."""
    t = tt(d)
    body = filt(noise(d), [90, 1400], 'band') * np.exp(-t / 0.12) * 1.4
    air = filt(noise(d), 4000, 'high') * np.exp(-t / 0.05) * 0.4
    return filt(impact(d, big), 40, 'high') * 0.7 + body + air


def glass(d=0.6):
    """Estilhaço: rajada de parciais altos curtos sobre ruído brilhante."""
    out = np.zeros(int(d * SR))
    r = np.random.default_rng(31)
    for _ in range(40):
        i = int(r.uniform(0, d * 0.7) * SR)
        b = blip(r.uniform(2500, 9000), r.uniform(0.03, 0.12))
        out[i:i + len(b)] += b[: len(out) - i] * r.uniform(0.2, 0.6)
    t = tt(d)
    return out + filt(noise(d), 5000, 'high') * np.exp(-t / 0.08) * 0.6


# ------------------------------------------------------------------ música
def pad_bar(n, nb=1, g=0.32, bright=1300, att=0.25, rel=0.5):
    ch = PROG[n]
    d = nb * BAR + rel
    L = filt(pad(CH[ch], d, bright=bright, att=att, rel=rel), 140, 'high')
    R = filt(pad(CH[ch], d, bright=bright, att=att, rel=rel), 140, 'high')     # outra fase: largura real
    mix.place('music', np.stack([L, R]), bar(n), g * 2.0)
    mix.place('music', pad([x + 12 for x in CH[ch][:3]], d, bright=bright * 1.3, att=att, rel=rel), bar(n), g * 0.7, 0.35)


def arp_bar(n, g=0.11, bright=2400, oct_=12, steps=16, pan_amp=0.5):
    ch = CH[PROG[n]]
    seq = ch + [x + 12 for x in ch]
    for k in range(steps):
        note = seq[(k * 3) % len(seq)] + oct_
        mix.place('music', pluck_saw(midi(note), 0.2, bright), bar(n) + k * S16, 2.1 * g * (1.0 if k % 4 == 0 else 0.75), pan_amp * np.sin(k * 0.8))


def bass_note(n, d):
    return sub(midi(n), d) * 0.7 + filt(saw(midi(n + 12), tt(d), 1800), 1300, 'low') * 0.55


def groove_bar(n, stab=False, last=16, g=1.0):
    """Um compasso do groove: bumbo reto, palmas no 2 e 4, chimbal, baixo em contratempo.
    `last` corta o compasso no passo indicado (para o mergulho)."""
    t0 = bar(n)
    ch = PROG[n]
    kicks = []
    for k in range(last):
        t = t0 + k * S16
        if k % 4 == 0:
            mix.place('drums', kick(0.42, 1.2, 52), t, 0.55 * g)
            kicks.append(t)
        if k in (4, 12):
            mix.place('drums', clap(), t, 0.62 * g, 0.05)
            mix.place('drums', snare(0.25), t, 0.2 * g)
            mix.place('send', clap(), t, 0.12 * g)
        if k % 4 == 2:
            mix.place('drums', hat(True), t, 0.3 * g, 0.25)
            mix.place('music', bass_note(ROOT_N[ch], S16 * 1.7), t, 0.42 * g)
        elif k % 2 == 1:
            mix.place('drums', hat(), t, (0.17 if k % 4 == 3 else 0.11) * g, -0.3)
    if stab:
        for k in (0, 3, 6, 10):
            if k < last:
                mix.place('music', supersaw(CH[ch], 0.3, 5200, dec=0.12), t0 + k * S16, 0.46 * g, 0.3 if k % 2 else -0.3)
    return kicks


groove_kicks = []

# --- c.1–2: faísca. Pad, pulso de coração, arpejo abrindo o filtro; rolo de caixa até o drop
pad_bar(1, 2, 0.30, 900, att=0.6)
for n in (1, 2):
    for b in (0, 2):
        mix.place('drums', kick(0.45, 0.6, 42), bar(n, b), 0.45)
        mix.place('drums', kick(0.35, 0.4, 40), bar(n, b) + BT * 0.38, 0.22)
arp_bar(1, 0.06, 900)
arp_bar(2, 0.08, 1800)
mix.automate_lowpass('music', 0.0, bar(3) - 0.02, 500, 6000)
roll, t = [], bar(2, 2)
while t < bar(3) - 0.04:
    roll.append(t)
    t += S16 if t < bar(2, 3) else S16 / 2
for i, rt in enumerate(roll):
    mix.place('drums', snare(0.18), rt, 0.08 + 0.22 * i / len(roll), 0.1 * np.sin(i))

# --- c.3–6: drop e código. Groove completo; c.5–6 com arpejo digital; o mergulho tira o chão
for n in (3, 4, 5):
    groove_kicks += groove_bar(n, stab=n in (3, 4))
    pad_bar(n, 1, 0.26, 1700)
    arp_bar(n, 0.1 if n < 5 else 0.13, 3000 if n < 5 else 4200)
groove_kicks += groove_bar(6, last=8)                # o mergulho (c.6, tempo 3): sem chão, só subida
pad_bar(6, 1, 0.26, 1700)
arp_bar(6, 0.13, 4200)
mix.automate_lowpass('music', bar(6, 2), bar(7) - 0.01, 6000, 900)

# --- c.7–10: sites e experiências. Mais brilho; acordes em supersaw
for n in (7, 8, 9, 10):
    groove_kicks += groove_bar(n, stab=True)
    pad_bar(n, 1, 0.3, 2100)
    arp_bar(n, 0.12, 3600)

# --- c.11: convergência. Sem bumbo; rolo de caixa acelerando; filtro abrindo
pad_bar(11, 1, 0.26, 1400, att=0.3)
mix.automate_lowpass('music', bar(11), bar(12) - 0.3, 800, 9000)
roll, t = [], bar(11)
while t < bar(12) - 0.32:
    roll.append(t)
    t += BT / 2 if t < bar(11, 2) else (S16 if t < bar(11, 3) else S16 / 2)
for i, rt in enumerate(roll):
    mix.place('drums', snare(0.2), rt, 0.12 + 0.5 * i / len(roll), 0.2 * np.sin(i * 0.7))
for k in range(8):
    mix.place('drums', hat(), bar(11) + k * BT / 2, 0.1)
tz = tt(BAR - 0.3)                                   # baixo que sobe junto com a espiral
mix.place('music', np.tanh(1.8 * np.sin(2 * np.pi * np.cumsum(np.linspace(midi(39), midi(51), len(tz))) / SR)) * (0.4 + 0.6 * tz / tz[-1]), bar(11), 0.3)

# --- c.12–14: a marca. Lá bemol maior aberto; groove leve; acorde final soa até o fim
pad_bar(12, 4, 0.30, 1700, att=0.08, rel=1.0)
mix.place('music', sub(midi(44), 3.4) * np.exp(-tt(3.4) / 2.2), bar(12), 0.3)
for n in (13, 14):
    for k in range(16):
        t = bar(n) + k * S16
        if k in (0, 8):
            mix.place('drums', kick(0.5, 0.8, 45), t, 0.6)
        if k % 4 == 2:
            mix.place('drums', hat(True), t, 0.08, 0.3)
        if k % 2 == 1:
            mix.place('drums', hat(), t, 0.04, -0.3)
    arp_bar(n, 0.06, 5000, oct_=24, pan_amp=0.8)
    mix.place('music', sub(midi(44), BAR) * np.exp(-tt(BAR) / 1.5), bar(n), 0.2)
arp_bar(15, 0.04, 5000, oct_=24, steps=max(0, int((DUR - bar(15)) / S16)), pan_amp=0.8)
mix.place('music', pad([68, 72, 75, 79, 82], DUR - bar(14) + 0.2, bright=2600, att=1.0, rel=1.2), bar(14), 0.1)

# sidechain: o groove respira com o bumbo
mix.duck('music', groove_kicks, depth=0.45, release=0.16)


# ------------------------------------------------------------------ efeitos (a partir dos cues)
def fx(c):
    ty, t = c['type'], c['t']
    d = c.get('d', 0.3)
    pan = c.get('pan', 0.0)
    if ty == 'blade':                     # abertura: a varredura da marca + a primeira nota
        sig_cut(t, 1.2, 1, big=True)
        mix.place('sfx', imp(2.2, 1.0), t, 0.55)
        mix.place('sfx', crash(2.2), t, 0.12)
        sig_motif(t, 0.7, full=False)
    elif ty == 'spark':
        b = fm_bell(midi(96), 1.6, 0.6)
        mix.place('sfx', b, t, 0.07, 0.2)
        mix.place('send', b, t, 0.12)
    elif ty == 'dust':
        r = np.random.default_rng(5)
        for _ in range(36):
            n = [77, 80, 84, 87, 89, 92, 96][r.integers(7)]
            mix.place('sfx', blip(midi(n), 0.06), t + r.uniform(0, d), 0.025, r.uniform(-0.9, 0.9))
    elif ty == 'kicker':
        n = c.get('n', 10)
        for k in range(n):
            mix.place('sfx', click(6000, 0.012), t + k * d / n, 0.05, -0.5 + k / n)
    elif ty == 'gather':
        mix.place('sfx', whoosh(d, 300, 6000, 0.85, 1.4), t, 0.2)
        r = np.random.default_rng(9)
        for k in range(28):
            mix.place('sfx', blip(midi(72 + (k * 5) % 24), 0.05), t + d * (k / 28) ** 0.8, 0.03, r.uniform(-0.8, 0.8))
    elif ty == 'lock':
        mix.place('sfx', kick(0.3, 0.5, 60), t, 0.25)
        mix.place('sfx', supersaw(CH['Fm9'], 0.6, 2400, dec=0.3), t, 0.12)
    elif ty == 'tension':
        mix.place('sfx', riser(d, 150, 2400), t, 0.32)
        mix.place('sfx', reverse(crash(d)), t, 0.25)
    elif ty == 'suck':
        mix.place('sfx', reverse(imp(d + 0.05, 0.8)[: int(d * SR)], 1.5), t, 0.3)
    elif ty == 'drop':
        mix.place('sfx', imp(2.4, 1.3), t, 0.85)
        mix.place('sfx', crash(2.8), t, 0.3)
        mix.place('send', imp(2.4, 1.3), t, 0.2)
    elif ty == 'slash':
        sig_cut(t, c.get('v', 1.0), c.get('dir', 1), c.get('big', False))
        if c.get('big'):
            mix.place('sfx', imp(1.2, 0.7), t, 0.4)
            mix.place('sfx', fm_bell(midi(80), 1.4, 0.8), t, 0.1)
    elif ty == 'shatter':
        g = glass(0.7)
        mix.place('sfx', g, t, 0.3)
        mix.place('send', g, t, 0.15)
    elif ty == 'slice':
        mix.place('sfx', click(4200 + 300 * c['k'], 0.03), t, 0.18, pan)
        mix.place('sfx', blip(midi(84 + [0, 3, 5, 7, 10, 12, 15][c['k'] % 7]), 0.05), t, 0.04, pan)
    elif ty == 'settle':
        r = np.random.default_rng(12)
        for _ in range(60):
            mix.place('sfx', click(r.uniform(3000, 9000), 0.01), t + d * r.uniform(0, 1) ** 0.6, 0.05 * r.uniform(0.3, 1), r.uniform(-1, 1))
    elif ty == 'guide':
        f0 = [2400, 3000, 3600][c['k']]
        tz = tt(0.18)
        z = np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f0 * 2.2, len(tz))) / SR) * np.exp(-tz / 0.06)
        mix.place_pan('sfx', z, t, 0.06, -0.6, 0.6)
        mix.place('sfx', click(7000, 0.015), t, 0.12)
    elif ty == 'extrude':
        tz = tt(d)
        v = np.sin(2 * np.pi * np.cumsum(np.linspace(55, 110, len(tz))) / SR) * np.minimum(1, tz / 0.01) * np.exp(-tz / 0.35)
        mix.place('sfx', v, t, 0.35)
        mix.place('sfx', whoosh(d, 200, 2500, 0.3, 1.2), t, 0.18)
    elif ty == 'wipe':
        mix.place_pan('sfx', whoosh(d + 0.15, 250, 7000, 0.55, 1.1), t, 0.5, -1, 1)
        mix.place('sfx', reverse(crash(0.5)), t - 0.25, 0.1)
    elif ty == 'chev':
        mix.place('sfx', tom(150 if c['k'] == 0 else 190, 0.35), t, 0.45, pan)
        mix.place('sfx', click(3500, 0.02), t, 0.35, pan)
        mix.place('sfx', whoosh(0.4, 400, 3500, 0.85, 1.4), t - 0.36, 0.14, pan)
    elif ty == 'word':
        mix.place('sfx', whoosh(0.25, 800, 6000, 0.7, 1.6), t - 0.08, 0.12)
        mix.place('sfx', kick(0.2, 0.4, 70), t + 0.05, 0.2)
    elif ty == 'glitch':
        mix.place('sfx', glitch(0.09, c['k']), t, 0.16, (c['k'] % 3 - 1) * 0.6)
    elif ty == 'dive':
        mix.place('sfx', riser(d + 0.1, 200, 3000), t, 0.35)
        mix.place('sfx', whoosh(d + 0.1, 150, 8000, 0.95, 0.9), t, 0.35)
    elif ty == 'warp':
        tz = tt(d)
        am = 0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(np.linspace(8, 26, len(tz))) / SR)
        mix.place('sfx', sweep(noise(d), 600, 9000, 1.5) * am * np.minimum(1, tz / 0.01), t, 0.32)
        mix.place('sfx', click(2500, 0.03), t, 0.4)
        mix.place('sfx', reverse(crash(d)), t, 0.2)
    elif ty == 'exit':
        mix.place('sfx', imp(2.0, 1.1), t, 0.7)
        mix.place('sfx', crash(2.4), t, 0.25)
        sig_cut(t, 0.7, 1)
    elif ty == 'panel':
        n = [68, 72, 75, 79, 80, 84, 87, 91, 92][c['k'] % 9]
        b = fm_bell(midi(n), 0.6, 0.35)
        mix.place('sfx', b, t, 0.08, pan)
        mix.place('sfx', click(5000, 0.015), t, 0.12, pan)
        mix.place('send', b, t, 0.05)
    elif ty == 'sheen':
        for k in range(16):
            mix.place('sfx', blip(midi(84 + (k * 7) % 24), 0.08), t + d * k / 16, 0.025, -1 + 2 * k / 16)
    elif ty == 'tick':
        mix.place('sfx', click(8000, 0.01), t, 0.05, 0.4)
    elif ty == 'cut':
        mix.place('sfx', reverse(whoosh(0.25, 300, 5000, 0.2, 1.4)), t - 0.1, 0.2)
    elif ty == 'morph':
        k = c['k']
        mix.place('sfx', whoosh(0.45, 300, 6000, 0.6, 1.3), t - 0.1, 0.22, -0.5 + k * 0.33)
        mix.place('sfx', kick(0.25, 0.6, 58), t, 0.3)
        mix.place('sfx', click(4500, 0.02), t, 0.35)
        ch = PROG[10 if t >= bar(10) else 9]
        mix.place('sfx', supersaw([x + 12 for x in CH[ch][:3]], 0.35, 6000, dec=0.1), t, 0.12)
        mix.place('sfx', fm_bell(midi([80, 84, 87, 92][k % 4]), 0.9, 0.5), t + 0.46, 0.06)
    elif ty == 'vortex':
        tz = tt(d)
        w = sweep(noise(d), 300, 10000, 1.3) * (tz / d) ** 1.5
        lfo = np.sin(2 * np.pi * np.cumsum(np.linspace(0.8, 7, len(tz))) / SR)
        mix.place('sfx', np.stack([w * (0.6 + 0.4 * lfo), w * (0.6 - 0.4 * lfo)]), t, 0.6)
        mix.place('sfx', riser(d, 120, 2600), t, 0.55)
        mix.place('sfx', reverse(crash(d)), t, 0.35)
    elif ty == 'pass':
        mix.place_pan('sfx', whoosh(0.3, 500, 4000, 0.5, 1.5), t, 0.08, pan, -pan)
    elif ty == 'logo':                     # a marca: assinatura completa sobre o impacto
        mix.place('sfx', imp(3.0, 1.5), t, 0.9)
        mix.place('sfx', crash(3.4), t, 0.32)
        mix.place('send', imp(3.0, 1.5), t, 0.22)
        sig_cut(t, 1.3, 1, big=True)
        sig_motif(t + 0.02, 1.2, full=True)
    elif ty == 'reveal':
        s = whoosh(d + 0.2, 400, 7000, 0.4, 1.2)
        mix.place_pan('sfx', s, t, 0.18, 0, -1)
        mix.place_pan('sfx', s, t, 0.18, 0, 1)
    elif ty == 'glint':
        for k in range(10):
            mix.place('sfx', blip(midi([87, 91, 92, 96, 99, 103, 104, 108, 111, 115][k]), 0.12), t + d * k / 10, 0.03, -0.8 + 0.16 * k)
            mix.place('send', blip(midi(96 + k), 0.12), t + d * k / 10, 0.03)
    elif ty == 'url':
        n, st = c.get('n', 19), c.get('st', 0.03)
        for k in range(n):
            mix.place('sfx', click(5500 + 120 * (k % 5), 0.012), t + k * st, 0.09, -0.6 + 1.2 * k / n)
            mix.place('sfx', kick(0.06, 0.3, 140), t + k * st, 0.04)
    elif ty == 'frame':
        tz = tt(d)
        z = np.sin(2 * np.pi * np.cumsum(np.linspace(1200, 2400, len(tz))) / SR) * np.exp(-tz / 0.2) * np.minimum(1, tz / 0.02)
        mix.place_pan('sfx', z, t, 0.04, -0.7, 0.7)
        mix.place('sfx', fm_bell(midi(87), 1.6, 0.5), t + d, 0.06)
    else:
        raise ValueError('cue desconhecido: ' + ty)


for c in CUES:
    fx(c)

out = mix.render(levels={'music': 0.95, 'drums': 0.62, 'sfx': 1.0}, reverb={'send': 0.55, 'sfx': 0.1, 'music': 0.1})
# equalização final pensando no celular: menos subgrave, mais presença (1,5–6 kHz)
out = out - 0.3 * filt(out, 70, 'low') + 0.35 * filt(out, [1500, 6000], 'band')
master(out, os.path.join(ROOT, 'audio', 'trilha.wav'))
