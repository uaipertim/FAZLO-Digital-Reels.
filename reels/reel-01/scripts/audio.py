#!/usr/bin/env python3
"""
Trilha + efeitos do FAZLO Digital Reel 001 "Seu negócio já é bom. Seu digital
precisa parecer isso." — 100% sintetizados, sem samples.

120 BPM, Fá menor -> Lá bemol maior. A trilha conta a mesma história da imagem:

  c.1      o tema (piano elétrico) toca limpo, em alta fidelidade: o negócio é bom;
  c.2–4    no corte da barra, o MESMO tema passa a soar como num alto-falante
           ruim: mono, banda estreita, 6 bits, taxa reduzida, com chiado, estalos,
           oscilação de fita e a rotação caindo; trava junto com a imagem;
  c.5      a virada: a assinatura da marca abre a alta definição e o tema volta
           largo e cheio, com bateria em meio-tempo, 808, cordas e metais;
  c.6–9    cada atributo tem o seu golpe (peso, encaixe preciso, blocos, carimbo);
  c.10–11  respiro; c.12–13 a marca com a assinatura completa ("o corte").

A sincronia vem da animação: `node tools/render.cjs cues 01` exporta
audio/cues.json e cada efeito cai exatamente no instante do evento visual.

    python3 reels/reel-01/scripts/audio.py   -> audio/trilha.wav (48 kHz, estéreo, -14 LUFS)
"""
import os
import sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, '..', '..', 'tools', 'audio'))
from fzaudio import *  # noqa: E402,F403
from fzbrand import fm_bell, sig_cut, sig_motif  # noqa: E402

seed(1001)
DATA = load_cues(ROOT)
BPM = DATA['bpm']
BT = 60.0 / BPM
BAR = 4 * BT
S16 = BT / 4
E8 = BT / 2
DUR = float(DATA['duration'])
SEC = DATA['sections']
CUES = DATA['cues']
N = int(round(DUR * SR))
mix = Mix(DUR)
FREEZE = [(c['t'], c['t'] + c['d']) for c in CUES if c['type'] == 'freeze']


def bar(n, beats=0.0):
    return (n - 1) * BAR + beats * BT


# ------------------------------------------------------------------ harmonia
CH = {
    'Fm9': [53, 56, 60, 63, 67], 'Db9': [49, 53, 56, 60, 63], 'Eb': [51, 55, 58, 65], 'Ab9': [56, 60, 63, 67, 70],
    'Ab/C': [48, 56, 60, 63, 67], 'Ebsus': [51, 56, 58, 63, 65],
}
ROOTN = {'Fm9': 41, 'Db9': 37, 'Eb': 39, 'Ab9': 44, 'Ab/C': 36, 'Ebsus': 39}
PROG = {1: 'Fm9', 2: 'Fm9', 3: 'Db9', 4: 'Eb', 5: 'Ab9', 6: 'Fm9', 7: 'Db9', 8: 'Eb', 9: 'Ab/C', 10: 'Db9', 11: 'Ebsus',
        12: 'Ab9', 13: 'Ab9', 14: 'Ab9'}
# o tema: frase de 2 compassos em colcheias (índice da colcheia, nota)
MOTIF = [(0, 75), (1, 72), (2, 68), (3, 70), (4, 72), (6, 75), (7, 77), (8, 75), (10, 72), (12, 70), (13, 72), (14, 68)]


# ------------------------------------------------------------------ timbres
def ep(f, d=1.6, vel=1.0):
    """Piano elétrico FM: corpo quente (razão 1) + 'tine' metálico no ataque."""
    t = tt(d)
    idx = (1.0 + 1.6 * vel) * np.exp(-t / 0.28)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    tine = np.sin(2 * np.pi * f * 7.0 * t) * np.exp(-t / 0.025) * 0.18 * vel
    env = np.exp(-t / 0.95) * np.minimum(1, t / 0.003) * np.clip((d - t) / 0.06, 0, 1)
    return (s + tine) * env * vel


def ep_stereo(f, d=1.6, vel=1.0):
    """Piano elétrico em alta fidelidade: coro (duas cópias levemente desafinadas, L/R)."""
    a, b = ep(f * 0.9977, d, vel), ep(f * 1.0023, d, vel)
    c = ep(f, d, vel)
    return np.stack([c * 0.7 + a * 0.5, c * 0.7 + b * 0.5])


def supersaw(notes, d, bright=4000, att=0.004, dec=0.22, seed_=0):
    t = tt(d)
    out = np.zeros(len(t))
    r = np.random.default_rng(seed_ + len(notes))
    for n in notes:
        for dc in (-0.12, -0.04, 0.05, 0.13):
            out += saw(midi(n + dc), t, bright, ph=r.uniform(0, 6.28))
    env = np.minimum(1, t / att) * np.exp(-t / dec)
    return filt(out * env / (len(notes) * 4), bright, 'low')


def brass(notes, d=0.6, bright=2200):
    """Metal sintético curto: supersaw com ataque macio e filtro que abre e fecha."""
    t = tt(d)
    s = supersaw(notes, d, 6000, att=0.03, dec=0.4)
    return sweep(s, bright * 0.5, bright * 1.6, kind='low') * np.clip((d - t) / 0.1, 0, 1)


def sub808(n, d, glide_from=None):
    t = tt(d)
    f = np.full(len(t), midi(n))
    if glide_from is not None:
        g = int(0.07 * SR)
        f[:g] = np.linspace(midi(glide_from), midi(n), g)
    s = np.tanh(1.8 * np.sin(2 * np.pi * np.cumsum(f) / SR)) / np.tanh(1.8)
    return s * np.minimum(1, t / 0.004) * np.exp(-t / 0.9) * np.clip((d - t) / 0.03, 0, 1)


def strings(notes, d, att=0.4, rel=0.6, bright=2200):
    L = filt(pad(notes, d, bright=bright, att=att, rel=rel), 160, 'high')
    R = filt(pad(notes, d, bright=bright, att=att, rel=rel), 160, 'high')
    return np.stack([L, R])


def imp(d=2.0, big=1.0):
    """Impacto para celular: sub contido + corpo em médios + ar."""
    t = tt(d)
    on = np.minimum(1, t / 0.003)                  # entrada de 3 ms: evita pré-eco do AAC antes do golpe
    body = filt(noise(d), [90, 1400], 'band') * np.exp(-t / 0.12) * 1.4 * on
    air = filt(noise(d), 4000, 'high') * np.exp(-t / 0.05) * 0.3 * on
    return filt(impact(d, big), 40, 'high') * 0.7 + body + air


def thud(f=90, d=0.35):
    t = tt(d)
    return np.sin(2 * np.pi * np.cumsum(f * (1 + 1.2 * np.exp(-t / 0.02))) / SR) * np.exp(-t / 0.09) + filt(noise(d), [400, 2500], 'band') * np.exp(-t / 0.01) * 0.6


def woodblock(f=700, d=0.15):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.7 * t)) * np.exp(-t / 0.03) + filt(noise(d), [f, f * 4], 'band') * np.exp(-t / 0.004) * 0.5


# ------------------------------------------------------------------ partes
def motif_bar(n, half, bus, g=0.5, stereo=True, oct_=0, timbre='ep'):
    for e, note in MOTIF:
        if (e >= 8) != bool(half):
            continue
        t0 = bar(n) + (e - 8 * half) * E8
        f = midi(note + oct_)
        if timbre == 'bell':
            s = fm_bell(f, 1.6, 0.5)
            mix.place(bus, s, t0, g * 0.7, 0.2 * np.sin(e))
        elif stereo:
            mix.place(bus, ep_stereo(f, 1.4, 0.9), t0, g)
        else:
            mix.place(bus, ep(f, 1.4, 0.9), t0, g)


def chords_bar(n, bus, g=0.22, stereo=True):
    ch = CH[PROG[n]]
    for b in (0, 2):
        for k, note in enumerate(ch[:4]):
            f = midi(note)
            s = ep_stereo(f, 1.6, 0.6) if stereo else ep(f, 1.6, 0.6)
            mix.place(bus, s, bar(n, b) + k * 0.012, g / 2)


def drums_half(n, g=1.0, kick_steps=(0, 7, 10), hats=True, roll=False):
    """Meio-tempo: bumbo + 808, caixa/palmas no 3º tempo, chimbal em semicolcheias."""
    t0 = bar(n)
    ch = PROG[n]
    kicks = []
    prev = None
    for k in range(16):
        t = t0 + k * S16
        if k in kick_steps:
            mix.place('drums', kick(0.45, 1.2, 50), t, 0.62 * g)
            mix.place('music', sub808(ROOTN[ch], 0.55 if k else 0.9, glide_from=prev), t, 0.32 * g)
            prev = ROOTN[ch]
            kicks.append(t)
        if k == 8:
            mix.place('drums', clap(), t, 0.6 * g, 0.05)
            mix.place('drums', snare(0.3), t, 0.4 * g)
            mix.place('send', snare(0.3), t, 0.25 * g)
        if hats:
            v = 0.13 if k % 4 == 2 else 0.07 if k % 2 == 0 else 0.05
            mix.place('drums', hat(k % 8 == 6), t, v * g, 0.3 if k % 2 else -0.2)
            if roll and k >= 12:
                mix.place('drums', hat(), t + S16 / 2, 0.06 * g, 0.4)
    return kicks


# --- c.1: alta fidelidade — o negócio é bom
mix.place('music', strings(CH['Fm9'], BAR + 0.4, att=0.15, rel=0.3), 0, 0.22)
motif_bar(1, 0, 'music', 0.5)
chords_bar(1, 'music', 0.22)
mix.place('music', sub808(41, 1.6), 0, 0.3)

# --- c.2–4: o mesmo tema num alto-falante ruim (barramento 'lo', processado abaixo)
for n in (2, 3, 4):
    motif_bar(n, (n - 1) % 2, 'lo', 0.55, stereo=False)
    chords_bar(n, 'lo', 0.25, stereo=False)
    mix.place('lo', filt(pad(CH[PROG[n]], BAR + 0.3, bright=900, att=0.1, rel=0.3), 200, 'high'), bar(n), 0.25)
    for k in range(16):
        t = bar(n) + k * S16
        if k in (0, 6, 10):
            mix.place('lo', kick(0.35, 0.8, 55), t, 0.45)
        if k in (4, 12):
            mix.place('lo', snare(0.2), t, 0.3)
        if k % 2 == 0:
            mix.place('lo', hat(), t, 0.05)

# --- c.5–9: alta definição. Meio-tempo cheio, tema largo, cordas, metais nos golpes
groove_kicks = []
for n in (5, 6, 7, 8, 9):
    groove_kicks += drums_half(n, roll=n in (7, 9))
    mix.place('music', strings(CH[PROG[n]], BAR + 0.5, att=0.12, rel=0.5, bright=2600), bar(n), 0.2)
    motif_bar(n, (n - 5) % 2, 'music', 0.42)
    chords_bar(n, 'music', 0.16)

# --- c.10–11: respiro. Sem bumbo reto; o tema em sino; subida até a marca
for n in (10, 11):
    mix.place('music', strings(CH[PROG[n]], BAR + 0.5, att=0.5, rel=0.6, bright=2000), bar(n), 0.26)
    motif_bar(n, (n - 10) % 2, 'music', 0.3, timbre='bell', oct_=12)
    mix.place('drums', kick(0.5, 0.9, 48), bar(n), 0.5)
    mix.place('music', sub808(ROOTN[PROG[n]], 1.6), bar(n), 0.25)
    for k in range(8):
        mix.place('drums', hat(), bar(n) + k * E8 + E8 / 2, 0.06, 0.3)
roll = []
t = bar(11, 2)
while t < bar(12) - 0.06:
    roll.append(t)
    t += S16 if t < bar(11, 3) else S16 / 2
for i, rt in enumerate(roll):
    mix.place('drums', snare(0.18), rt, 0.08 + 0.3 * i / len(roll))

# --- c.12–13: a marca. Lá bemol maior aberto; groove leve; final que soa até o fim
mix.place('music', strings(CH['Ab9'], DUR - bar(12) + 0.2, att=0.06, rel=1.2, bright=2600), bar(12), 0.3)
mix.place('music', sub808(44, 2.4), bar(12), 0.35)
for n in (12, 13):
    motif_bar(n, (n - 12) % 2, 'music', 0.32)
    for k in range(16):
        t = bar(n) + k * S16
        if k in (0, 10):
            mix.place('drums', kick(0.45, 0.9, 48), t, 0.45)
        if k == 8 and n == 13:
            mix.place('drums', clap(), t, 0.35)
        if k % 2 == 1:
            mix.place('drums', hat(), t, 0.05, -0.3)
mix.place('music', ep_stereo(midi(68), 3.0, 0.8), bar(14), 0.35)
mix.place('music', ep_stereo(midi(75), 3.0, 0.6), bar(14) + 0.02, 0.25)
mix.duck('music', groove_kicks, depth=0.4, release=0.15)

# --- o corte: a alta fidelidade some no instante da barra e só volta na virada
g = np.ones(N)
i0, i1 = int(SEC['split'] * SR), int((SEC['virada'] - 0.01) * SR)
fd = int(0.004 * SR)
g[i0:i1] = 0
g[i0 - fd:i0] = np.linspace(1, 0, fd)
g[i1:i1 + fd] = np.linspace(0, 1, fd)
for b in ('music', 'drums'):
    mix.bus(b)[:] *= g


# ------------------------------------------------------------------ efeitos (a partir dos cues)
def fx(c):
    ty, t = c['type'], c['t']
    d = c.get('d', 0.3)
    pan = c.get('pan', 0.0)
    if ty == 'hit':
        mix.place('sfx', imp(2.2, 1.1), t, 0.7)
        mix.place('sfx', brass(CH['Fm9'][:3], 0.8, 1800), t, 0.3)
        mix.place('sfx', crash(2.2), t, 0.07)
    elif ty == 'letters':
        for k in range(c['n']):
            mix.place('sfx', thud(120 + 8 * k, 0.12), t + 0.12 + k * c['st'] * 1.6, 0.06, -0.5 + k / c['n'])
    elif ty == 'slam':
        mix.place('sfx', imp(1.6, 0.9), t, 0.6)
        mix.place('sfx', kick(0.4, 1.0, 46) * np.minimum(1, tt(0.4) / 0.002), t, 0.5)
        mix.place('send', imp(1.6, 0.9), t, 0.15)
    elif ty == 'shine':
        for k in range(12):
            mix.place('sfx', blip(midi(84 + [0, 3, 7, 10, 12, 15][k % 6]), 0.1), t + d * k / 12, 0.03, -0.8 + 1.6 * k / 12)
    elif ty == 'blade':
        sig_cut(mix, t, 1.0 if not c.get('light') else 0.8, 1)
    elif ty == 'cut':                    # a energia cai: o som vira alto-falante ruim
        mix.place('sfx', thud(60, 0.5), t, 0.5)
        tz = tt(0.35)
        mix.place('sfx', np.sin(2 * np.pi * np.cumsum(np.linspace(220, 55, len(tz))) / SR) * np.exp(-tz / 0.15), t, 0.25)
    elif ty == 'q':                      # a dúvida: um "bip" que cai
        tz = tt(0.22)
        mix.place('lo', np.sign(np.sin(2 * np.pi * np.cumsum(np.linspace(900, 520, len(tz))) / SR)) * np.exp(-tz / 0.08), t, 0.25)
    elif ty == 'label':
        bus = 'lo' if c.get('lofi') else 'sfx'
        for k in range(c['n']):
            mix.place(bus, click(6000, 0.012), t + k * d / c['n'], 0.05, -0.4 + 0.8 * k / c['n'])
    elif ty == 'spread':
        mix.place('lo', whoosh(d, 2500, 200, 0.4, 1.2), t, 0.4)
    elif ty == 'shrink':
        tz = tt(d)
        mix.place('lo', np.sin(2 * np.pi * np.cumsum(np.linspace(480, 110, len(tz))) / SR) * np.minimum(1, tz / 0.05) * np.exp(-tz / 0.8), t, 0.3)
    elif ty == 'narr':
        for k in range(c['n']):
            mix.place('sfx', click(4500, 0.01), t + k * d / c['n'], 0.025)
    elif ty == 'line':                   # palavras nítidas no meio do digital apagado
        mix.place('sfx', thud(80, 0.3), t, 0.3)
        mix.place('sfx', whoosh(0.25, 800, 7000, 0.7, 1.6), t - 0.12, 0.14)
        mix.place('sfx', fm_bell(midi(80 if c['n'] < 6 else 82), 1.0, 0.4), t, 0.05)
    elif ty == 'freeze':
        mix.place('lo', glitch(d, int(t * 10)), t, 0.25)
    elif ty == 'hope':                   # a esperança, já em alta fidelidade
        mix.place('sfx', riser(d, 300, 4000), t, 0.3)
        mix.place('sfx', reverse(crash(d)), t, 0.25)
        for k in range(8):
            mix.place('sfx', fm_bell(midi([68, 72, 75, 80, 84, 87, 92, 96][k]), 0.8, 0.4), t + d * (k / 8) ** 0.7, 0.03 + 0.01 * k, -0.6 + 0.17 * k)
    elif ty == 'suck':
        mix.place('sfx', reverse(imp(d + 0.05, 0.9)[: int(d * SR)], 1.5), t, 0.4)
    elif ty == 'virada':                 # a alta definição se abre: assinatura + impacto
        sig_cut(mix, t, 1.4, 1, big=True)
        mix.place('sfx', imp(3.0, 1.5), t, 0.9)
        mix.place('sfx', crash(3.0), t, 0.35)
        mix.place('sfx', brass(CH['Ab9'], 1.0, 2600), t, 0.32)
        mix.place('send', imp(3.0, 1.5), t, 0.22)
    elif ty == 'debris':
        r = np.random.default_rng(4)
        for _ in range(40):
            mix.place('sfx', blip(r.uniform(2500, 9000), 0.04), t + d * r.uniform(0, 1) ** 1.5, 0.05 * r.uniform(0.3, 1), r.uniform(-1, 1))
    elif ty == 'whip':
        mix.place_pan('sfx', whoosh(d + 0.08, 400, 6500, 0.75, 1.3), t, 0.3, -0.7, 0.8)
    elif ty == 'fall':
        tz = tt(d)
        mix.place('sfx', np.sin(2 * np.pi * np.cumsum(np.linspace(1800, 300, len(tz))) / SR) * (tz / d) * 0.5, t, 0.12)
        mix.place('sfx', whoosh(d, 3000, 300, 0.9, 1.2), t, 0.25)
    elif ty == 'forte':                  # peso
        mix.place('sfx', imp(2.6, 1.6), t, 0.95)
        mix.place('sfx', brass([x - 12 for x in CH['Fm9'][:3]], 0.9, 1500), t, 0.4)
        mix.place('sfx', crash(2.4), t, 0.25)
        mix.place('send', imp(2.6, 1.6), t, 0.2)
    elif ty == 'kicker':
        for k in range(c['n']):
            mix.place('sfx', click(7000, 0.01), t + k * d / max(1, c['n']), 0.04)
    elif ty == 'scatter':
        r = np.random.default_rng(8)
        for _ in range(14):
            mix.place('sfx', click(r.uniform(2000, 6000), 0.02), t + d * r.uniform(0, 1), 0.1, r.uniform(-1, 1))
    elif ty == 'snap':                   # precisão: tudo encaixa
        mix.place('sfx', click(4000, 0.03), t, 0.8)
        mix.place('sfx', woodblock(1400, 0.12), t, 0.35)
        mix.place('sfx', supersaw([x + 12 for x in CH['Db9'][:4]], 0.25, 7000, dec=0.07), t, 0.3)
        mix.place('sfx', kick(0.3, 1.0, 60), t, 0.4)
    elif ty == 'guide':
        tz = tt(0.3)
        mix.place_pan('sfx', np.sin(2 * np.pi * np.cumsum(np.linspace(2400, 5200, len(tz))) / SR) * np.exp(-tz / 0.1), t, 0.05, -0.8, 0.8)
    elif ty == 'ticks':
        for k in range(c['n']):
            mix.place('sfx', click(8000, 0.008), t + k * c['st'], 0.06, -0.8 + 1.6 * k / c['n'])
    elif ty == 'nodes':
        for k in range(c['n']):
            mix.place('sfx', blip(midi(84 + [0, 2, 4, 7, 9][k % 5]), 0.05), t + k * c['st'], 0.035, -0.8 + 1.6 * k / c['n'])
    elif ty == 'ruler':
        for k in range(20):
            mix.place('sfx', click(9000, 0.006), t + d * k / 20, 0.035)
    elif ty == 'align':
        mix.place_pan('sfx', whoosh(d, 1500, 6000, 0.5, 2.0), t, 0.1, -0.8, 0.8)
    elif ty == 'plinth':
        mix.place('sfx', whoosh(d + 0.1, 150, 1500, 0.9, 1.0), t, 0.3)
        mix.place('sfx', thud(55, 0.5), t + d, 0.5)
    elif ty == 'block':                  # fundação: cada letra pousa
        n = [56, 60, 63, 65, 67, 68, 72, 75, 77, 80][c['k']]
        mix.place('sfx', thud(70 + 6 * c['k'], 0.25), t, 0.32, pan)
        mix.place('sfx', woodblock(midi(n + 12) / 2, 0.12), t, 0.1, pan)
    elif ty == 'lock':
        mix.place('sfx', thud(48, 0.6), t, 0.55)
        mix.place('sfx', click(3000, 0.04), t, 0.6)
        mix.place('sfx', fm_bell(midi(80), 1.4, 0.6), t, 0.1)
    elif ty == 'pre':
        mix.place('sfx', reverse(whoosh(d + 0.15, 300, 6000, 0.3, 1.2)), t - 0.15, 0.25)
    elif ty == 'stamp':                  # a marca: carimbo
        mix.place('sfx', imp(2.2, 1.2), t, 0.8)
        mix.place('sfx', snare(0.35), t, 0.5)
        mix.place('sfx', supersaw(CH['Ab9'][:4], 0.5, 5000, dec=0.2), t, 0.3)
        mix.place('send', snare(0.35), t, 0.4)
    elif ty == 'echo':
        k = c['k']
        mix.place('sfx', fm_bell(midi(80 + [0, 7, 12][k - 1]), 0.9, 0.5), t, 0.08 / k, 0.5 * (-1) ** k)
        mix.place('sfx', thud(70, 0.25), t, 0.18 / k)
    elif ty == 'cut2':
        mix.place('sfx', thud(70, 0.4), t, 0.4)
    elif ty == 'match':                  # "igual": as duas notas juntas
        for n in (68, 75):
            b = fm_bell(midi(n), 1.8, 0.5)
            mix.place('sfx', b, t, 0.08)
            mix.place('send', b, t, 0.08)
    elif ty == 'word':
        mix.place('sfx', whoosh(0.25, 800, 6000, 0.7, 1.6), t - 0.08, 0.1)
        mix.place('sfx', thud(85, 0.25), t + 0.04, 0.2)
    elif ty == 'level':                  # a linha de nível se estende
        tz = tt(d)
        mix.place_pan('sfx', np.sin(2 * np.pi * np.cumsum(np.linspace(1800, 3600, len(tz))) / SR) * np.exp(-tz / 0.15), t, 0.05, 0, -0.8)
        mix.place_pan('sfx', np.sin(2 * np.pi * np.cumsum(np.linspace(1800, 3600, len(tz))) / SR) * np.exp(-tz / 0.15), t, 0.05, 0, 0.8)
    elif ty == 'rise':                   # À ALTURA sobe até a linha
        mix.place('sfx', whoosh(d + 0.1, 200, 4000, 0.9, 1.0), t - 0.05, 0.3)
        mix.place('sfx', imp(1.6, 0.9), t + d, 0.6)
        mix.place('sfx', brass(CH['Db9'][:4], 0.8, 2400), t + d, 0.28)
        for n in (68, 75):
            mix.place('send', fm_bell(midi(n), 1.6, 0.5), t + d, 0.08)
    elif ty == 'logo':                   # a marca: assinatura completa sobre o impacto
        mix.place('sfx', imp(3.0, 1.5), t, 0.9)
        mix.place('sfx', crash(3.4), t, 0.3)
        mix.place('send', imp(3.0, 1.5), t, 0.2)
        sig_cut(mix, t, 1.3, 1, big=True)
        sig_motif(mix, t + 0.02, E8, 1.2, full=True)
    elif ty == 'res':                    # cada degrau de resolução: mais limpo
        k = c['k']
        bl = blip(midi(84 + 4 * k), 0.07)
        q = 2 ** (3 + k)
        mix.place('sfx', np.round(bl * q) / q, t, 0.08)
    elif ty == 'crisp':
        mix.place('sfx', fm_bell(midi(99), 1.2, 0.3), t, 0.05)
    elif ty == 'glint':
        for k in range(10):
            mix.place('sfx', blip(midi([87, 91, 92, 96, 99, 103, 104, 108, 111, 115][k]), 0.12), t + d * k / 10, 0.025, -0.8 + 0.16 * k)
    elif ty == 'pill':
        mix.place_pan('sfx', whoosh(d, 500, 4000, 0.4, 1.4), t, 0.12, -0.6, 0.6)
    elif ty == 'url':
        n, st = c.get('n', 19), c.get('st', 0.03)
        for k in range(n):
            mix.place('sfx', click(5500 + 120 * (k % 5), 0.012), t + k * st, 0.08, -0.6 + 1.2 * k / n)
    else:
        raise ValueError('cue desconhecido: ' + ty)


for c in CUES:
    fx(c)


# ------------------------------------------------------------------ o alto-falante ruim (c.2–4)
def lofi(x, t0, t1):
    """Mono, oscilação de fita com a rotação caindo, travadas, taxa reduzida (6 kHz),
    6 bits, banda de alto-falante pequeno, saturação, chiado e estalos."""
    i0, i1 = int(t0 * SR), min(N, int((t1 + 0.4) * SR))
    m = x[:, i0:i1].mean(axis=0)
    n = len(m)
    tl = np.arange(n) / SR
    sag = 0.035 * np.clip((tl + t0 - SEC['shrink']) / (SEC['virada'] - SEC['shrink']), 0, 1) ** 1.5
    pos = np.cumsum(1 - sag) + 0.0018 * SR * np.sin(2 * np.pi * 0.55 * tl) + 0.00025 * SR * np.sin(2 * np.pi * 6.3 * tl)
    y = np.interp(np.clip(pos, 0, n - 1), np.arange(n), m)
    for a, b in FREEZE:                            # trava junto com a imagem
        ia, ib = int((a - t0) * SR), int((b - t0) * SR)
        L = int(0.045 * SR)
        chunk = y[ia:ia + L].copy()
        for j in range(ia, ib, L):
            y[j:min(ib, j + L)] = chunk[: min(ib, j + L) - j]
    k = 8
    y = np.repeat(y[::k], k)[:n]
    q = 2 ** 5
    y = np.round(y * q) / q
    y = filt(filt(y, 330, 'high', 2), 3000, 'low', 4)
    y = np.tanh(2.0 * y) / 1.5
    y += filt(noise(n / SR), [1500, 6000], 'band') * 0.01
    r = np.random.default_rng(77)
    for i in r.integers(0, n - 200, int(n / SR * 9)):
        y[i:i + 60] += r.uniform(-0.25, 0.25) * np.exp(-np.arange(60) / 8)
    fade = np.ones(n)
    fe = int(0.004 * SR)
    fade[:fe] = np.linspace(0, 1, fe)
    cut = int((SEC['virada'] - 0.01 - t0) * SR)
    fade[cut:] = 0                                  # na virada o alto-falante ruim desliga de vez
    return y * fade


lo = lofi(mix.bus('lo'), SEC['split'], SEC['virada'])
del mix.buses['lo']
mix.place('music', np.stack([lo, lo]), SEC['split'], 0.8)

out = mix.render(levels={'music': 0.95, 'drums': 0.7, 'sfx': 1.0}, reverb={'send': 0.55, 'sfx': 0.1, 'music': 0.1})
# equalização final pensando no celular: menos subgrave, mais presença (1,5–6 kHz)
out = out - 0.3 * filt(out, 70, 'low') + 0.3 * filt(out, [1500, 6000], 'band')
master(out, os.path.join(ROOT, 'audio', 'trilha.wav'))
