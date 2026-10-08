#!/usr/bin/env python3
"""
Trilha + efeitos do FAZLO Digital Reel 002 "Muito além de um site" — 100%
sintetizados, sem samples.

100 BPM, Dó menor -> Mi bemol maior. A trilha é ADITIVA, como a imagem: a cada
salto de zoom a câmera mostra um mundo maior e a música ganha uma camada.

  c.1  página        marimba em semicolcheias (acentos 3-3-2) e bumbo leve
  c.2  identidade    + baixo e palmas
  c.3  informações   + chimbal e percussão (o ritmo se organiza)
  c.4  apresentação  + coro e tons (o palco se ilumina)
  c.5  conexão       + groove completo e um tema de sintetizador
  c.6–7 frases       tudo junto; o c.7 sobe
  c.8  a barra       a bateria some enquanto a barra encolhe; no pouso, a
                     assinatura sonora da marca resolve em Mi bemol maior
                     (Lá bemol -> Mi bemol: IV -> I)
  c.9–10 endereço    groove leve e o acorde final

Cada salto tem impacto, ar se abrindo e um sino que sobe de nota a cada nível.
A sincronia vem da animação: `node tools/render.cjs cues 02` exporta
audio/cues.json e cada efeito cai no instante do evento visual.

    python3 reels/reel-02/scripts/audio.py   -> audio/trilha.wav (48 kHz, estéreo, -14 LUFS)
"""
import os
import sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, '..', '..', 'tools', 'audio'))
from fzaudio import *  # noqa: E402,F403
from fzbrand import fm_bell, sig_cut, sig_motif  # noqa: E402

seed(2002)
DATA = load_cues(ROOT)
BPM = DATA['bpm']
BT = 60.0 / BPM
BAR = 4 * BT
S16 = BT / 4
E8 = BT / 2
DUR = float(DATA['duration'])
SEC = DATA['sections']
CUES = DATA['cues']
mix = Mix(DUR)


def bar(n, beats=0.0):
    return (n - 1) * BAR + beats * BT


# ------------------------------------------------------------------ harmonia
CH = {
    'Cm9': [48, 51, 55, 58, 62], 'Abmaj9': [44, 48, 51, 55, 58], 'Eb/G': [43, 51, 55, 58, 63], 'Bbsus': [46, 51, 53, 58, 63],
    'Fm9': [41, 48, 51, 56, 60], 'Ebmaj9': [39, 46, 50, 55, 58],
}
ROOTN = {'Cm9': 36, 'Abmaj9': 32, 'Eb/G': 31, 'Bbsus': 34, 'Fm9': 29, 'Ebmaj9': 39}
PROG = {1: 'Cm9', 2: 'Abmaj9', 3: 'Eb/G', 4: 'Bbsus', 5: 'Cm9', 6: 'Abmaj9', 7: 'Fm9', 8: 'Bbsus', 9: 'Ebmaj9', 10: 'Ebmaj9', 11: 'Ebmaj9'}


def chord_at(t):
    if t >= SEC['logo']:
        return 'Ebmaj9'
    return PROG[min(11, int(t // BAR) + 1)]


# ------------------------------------------------------------------ timbres
def marimba(f, d=0.5, vel=1.0):
    """Marimba FM: modulador na razão 4 (o sobretom característico), decaimento rápido."""
    t = tt(d)
    idx = 1.6 * vel * np.exp(-t / 0.03)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 4 * t))
    s += 0.25 * np.sin(2 * np.pi * f * 10 * t) * np.exp(-t / 0.008)
    return s * np.exp(-t / 0.22) * np.minimum(1, t / 0.0015) * vel


def bass(n, d, drive=2.2):
    t = tt(d)
    f = midi(n)
    s = np.tanh(drive * np.sin(2 * np.pi * f * t)) / np.tanh(drive) * 0.6 + filt(saw(f * 2, t, 2400), 1800, 'low') * 0.55
    s = filt(s, 45, 'high')                            # o celular não reproduz o subgrave: a nota vive nos harmônicos
    return s * np.minimum(1, t / 0.004) * np.exp(-t / 0.5) * np.clip((d - t) / 0.03, 0, 1)


def strings(notes, d, att=0.4, rel=0.6, bright=2200):
    L = filt(pad(notes, d, bright=bright, att=att, rel=rel), 160, 'high')
    R = filt(pad(notes, d, bright=bright, att=att, rel=rel), 160, 'high')
    return np.stack([L, R])


def choir(notes, d, att=0.5):
    """Coro sintético: pad filtrado nos formantes de 'a' (700 Hz e 1200 Hz)."""
    p = pad(notes, d, bright=3000, att=att, rel=0.6)
    s = filt(p, [550, 900], 'band', 2) * 1.2 + filt(p, [1000, 1500], 'band', 2) * 0.8
    return np.stack([s, np.roll(s, 240)])


def lead(f, d=0.4, glide_from=None):
    t = tt(d)
    fr = np.full(len(t), f)
    if glide_from:
        g = int(0.05 * SR)
        fr[:g] = np.linspace(glide_from, f, g)
    ph = np.cumsum(fr) / SR
    s = (2 * (ph % 1) - 1) * 0.5 + np.sign(np.sin(2 * np.pi * ph)) * 0.25
    return filt(s, 3200, 'low') * np.minimum(1, t / 0.006) * np.exp(-t / 0.35) * np.clip((d - t) / 0.03, 0, 1)


def tom(f=110, d=0.4):
    t = tt(d)
    return np.sin(2 * np.pi * np.cumsum(f * (1 + 0.6 * np.exp(-t / 0.04))) / SR) * np.exp(-t / 0.16)


def shaker(d=0.06):
    t = tt(d)
    return filt(noise(d), [5000, 11000], 'band') * np.exp(-t / 0.018) * np.minimum(1, t / 0.006)


def imp(d=2.0, big=1.0):
    """Impacto para celular: sub contido + corpo em médios + ar, com entrada de 3 ms (sem pré-eco no AAC)."""
    t = tt(d)
    on = np.minimum(1, t / 0.003)
    body = filt(noise(d), [90, 1400], 'band') * np.exp(-t / 0.12) * 1.4 * on
    air = filt(noise(d), 4000, 'high') * np.exp(-t / 0.05) * 0.3 * on
    return (filt(impact(d, big), 40, 'high') * 0.7 + body + air) * on


def swell(x, d, gap=0.06):
    """Som invertido que cresce até o golpe mas termina `gap` s antes dele (corte seco de 8 ms): o golpe
    entra no vazio e o ataque fica nítido, mesmo depois do AAC."""
    n = max(1, int((d - gap) * SR))
    y = x[-int(d * SR):][:n].copy()
    y[-int(0.008 * SR):] *= np.linspace(1, 0, int(0.008 * SR))
    return y


def ping(f, d=0.9):
    """Sonar: senoide limpa com eco curto."""
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.25) * np.minimum(1, t / 0.002)
    return s + np.roll(s, int(0.12 * SR)) * 0.35


# ------------------------------------------------------------------ partes
ACC = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0]          # 3-3-2 duas vezes


def marimba_bar(n, g=0.2, oct_=12, half=False):
    ch = CH[PROG[n]]
    seq = [ch[1], ch[2], ch[3], ch[4], ch[3], ch[2]]
    for k in range(8 if half else 16):
        note = seq[k % len(seq)] + oct_ + (12 if ACC[k] and k % 8 == 0 else 0)
        mix.place('music', marimba(midi(note), 0.45, 1.0 if ACC[k] else 0.6), bar(n) + k * S16, g, 0.35 * np.sin(k * 1.3))


def bass_bar(n, g=0.4, pattern=(0, 3, 6, 10, 14)):
    r = ROOTN[PROG[n]]
    for k in pattern:
        mix.place('music', bass(r + (12 if k == 10 else 0), S16 * 2.2), bar(n) + k * S16, g)


def drums_bar(n, kick4=False, kick13=True, clap24=False, hats=False, perc=False, toms=False, g=1.0, last=16):
    t0 = bar(n)
    for k in range(last):
        t = t0 + k * S16
        if (kick4 and k % 4 == 0) or (kick13 and not kick4 and k in (0, 8)):
            mix.place('drums', filt(kick(0.42, 1.1, 54), 38, 'high') * np.minimum(1, tt(0.42) / 0.002), t, 0.55 * g)
        if clap24 and k in (4, 12):
            mix.place('drums', clap(), t, 0.5 * g, 0.05)
            mix.place('send', clap(), t, 0.1 * g)
        if hats:
            mix.place('drums', hat(k % 4 == 2), t, (0.14 if k % 4 == 2 else 0.06) * g, 0.3)
        if perc:
            mix.place('drums', shaker(), t, (0.08 if k % 2 else 0.05) * g, -0.4)
            if k in (3, 6, 11):
                mix.place('drums', tom(330 if k == 3 else 260, 0.15), t, 0.12 * g, 0.5)
        if toms and k in (10, 12, 13, 14, 15):
            mix.place('drums', tom([180, 160, 140, 120, 100][[10, 12, 13, 14, 15].index(k)], 0.4), t, 0.3 * g, -0.4 + 0.2 * (k - 10))


HOOK = [(0, 75), (3, 72), (6, 70), (8, 67), (10, 70), (11, 72), (14, 75)]   # tema do sintetizador (semicolcheias)


def lead_bar(n, g=0.14, shift=0):
    prev = None
    for k, note in HOOK:
        f = midi(note + shift)
        mix.place('music', lead(f, 0.35, prev), bar(n) + k * S16, g, 0.15)
        mix.place('send', lead(f, 0.35, prev), bar(n) + k * S16, g * 0.4)
        prev = f


# --- c.1 página: marimba + bumbo leve
marimba_bar(1, 0.21)
drums_bar(1, kick13=True, g=0.7)
mix.place('music', strings(CH['Cm9'], BAR + 0.4, att=0.3, rel=0.4, bright=1400), bar(1), 0.1)
# --- c.2 identidade: + baixo e palmas
marimba_bar(2, 0.21)
bass_bar(2, 0.38)
drums_bar(2, kick13=True, clap24=True, g=0.85)
mix.place('music', strings(CH['Abmaj9'], BAR + 0.4, att=0.2, rel=0.4, bright=1600), bar(2), 0.12)
# --- c.3 informações: + chimbal e percussão
marimba_bar(3, 0.2)
bass_bar(3, 0.4)
drums_bar(3, kick13=True, clap24=True, hats=True, perc=True, g=0.9)
mix.place('music', strings(CH['Eb/G'], BAR + 0.4, att=0.2, rel=0.4, bright=1800), bar(3), 0.13)
# --- c.4 apresentação: + coro e tons
marimba_bar(4, 0.19)
bass_bar(4, 0.4)
drums_bar(4, kick13=True, clap24=True, hats=True, perc=True, toms=True, g=0.95)
mix.place('music', choir([x + 12 for x in CH['Bbsus']], BAR + 0.6, att=0.25), bar(4), 0.3)
mix.place('music', strings(CH['Bbsus'], BAR + 0.4, att=0.2, rel=0.4, bright=2200), bar(4), 0.15)
# --- c.5–7 conexão + frases: groove completo e tema
groove_kicks = []
for n in (5, 6, 7):
    marimba_bar(n, 0.18)
    bass_bar(n, 0.42, pattern=(0, 3, 6, 8, 10, 14))
    drums_bar(n, kick4=True, clap24=True, hats=True, perc=True, toms=(n == 7), g=1.0)
    groove_kicks += [bar(n, b) for b in range(4)]
    mix.place('music', strings(CH[PROG[n]], BAR + 0.5, att=0.15, rel=0.5, bright=2600), bar(n), 0.17)
    mix.place('music', choir([x + 12 for x in CH[PROG[n]][1:]], BAR + 0.5, att=0.3), bar(n), 0.16)
    lead_bar(n, 0.13, shift=(0 if n != 6 else -4))
# c.7 sobe: rolo de caixa e filtro abrindo
roll, t = [], bar(7, 2)
while t < bar(8) - 0.05:
    roll.append(t)
    t += S16 if t < bar(7, 3) else S16 / 2
for i, rt in enumerate(roll):
    mix.place('drums', snare(0.18), rt, 0.07 + 0.25 * i / len(roll), 0.15 * np.sin(i))
# --- c.8 a barra: a bateria some; só o acorde suspenso e a subida, até o pouso
mix.place('music', strings(CH['Bbsus'], SEC['logo'] - bar(8) + 0.3, att=0.1, rel=0.3, bright=3000), bar(8), 0.2)
mix.place('music', choir([x + 12 for x in CH['Bbsus'][1:]], SEC['logo'] - bar(8) + 0.3, att=0.1), bar(8), 0.2)
mix.place('music', bass(34, SEC['logo'] - bar(8)), bar(8), 0.3)
# --- pouso (c.8, tempo 3) e c.9–10: Mi bemol maior, groove leve até o fim
L = DUR - SEC['logo']
mix.place('music', strings(CH['Ebmaj9'], L, att=0.05, rel=1.4, bright=2800), SEC['logo'], 0.24)
mix.place('music', choir([x + 12 for x in CH['Ebmaj9'][1:]], L, att=0.2), SEC['logo'], 0.18)
mix.place('music', bass(39, 2.4), SEC['logo'], 0.4)
for n in (9, 10):
    marimba_bar(n, 0.14)
    bass_bar(n, 0.32)
    drums_bar(n, kick13=True, clap24=(n == 9), hats=True, g=0.7)
marimba_bar(11, 0.09, half=True)
for k, note in enumerate([75, 79, 82, 87]):                                  # arpejo final
    mix.place('music', marimba(midi(note), 1.2, 0.8), bar(11) + k * E8, 0.14, -0.3 + 0.2 * k)
mix.duck('music', groove_kicks, depth=0.35, release=0.15)

LEVEL_BELL = [80, 84, 87, 91]                                                # o sino sobe a cada nível


# ------------------------------------------------------------------ efeitos (a partir dos cues)
def fx(c):
    ty, t = c['type'], c['t']
    d = c.get('d', 0.3)
    if ty == 'hit':
        mix.place('sfx', imp(2.0, 1.1), t, 0.5)                                # 1º quadro: o AAC precisa de folga
        for k, note in enumerate([60, 63, 67, 70, 74]):
            mix.place('sfx', marimba(midi(note + 12), 0.8, 1.0), t + k * 0.012, 0.12)
    elif ty == 'block':
        note = [72, 75, 77, 79, 82, 84, 87, 89, 91, 94][c['k'] % 10]
        mix.place('sfx', marimba(midi(note), 0.3, 0.9), t, 0.1, -0.5 + 0.1 * c['k'])
        mix.place('sfx', click(5000, 0.012), t, 0.08)
    elif ty == 'ask':
        for k in range(c['n']):
            mix.place('sfx', click(6000, 0.01), t + k * 0.02, 0.04)
        mix.place('sfx', marimba(midi(79), 0.5), t + 0.3, 0.12)
        mix.place('sfx', marimba(midi(84), 0.6), t + 0.45, 0.14)
    elif ty == 'pre':
        mix.place('sfx', swell(reverse(crash(d + 0.2)), d), t, 0.25)
        mix.place('sfx', swell(reverse(whoosh(d + 0.1, 300, 5000, 0.3, 1.2)), d), t, 0.2)
    elif ty == 'zoom':                                # cada salto: impacto, o ar se abre, o sino sobe
        k = c['k']
        mix.place('sfx', imp(1.8, 1.0), t, 0.75)
        mix.place('sfx', filt(kick(0.4, 1.2, 52), 38, 'high') * np.minimum(1, tt(0.4) / 0.002), t, 0.32)
        mix.place('sfx', click(3500, 0.03) * np.minimum(1, tt(0.03) / 0.0015), t, 0.4)
        mix.place_pan('sfx', whoosh(0.9, 5000, 300, 0.12, 1.2), t, 0.35, 0.0, 0.0)
        b = fm_bell(midi(LEVEL_BELL[k - 1]), 1.6, 0.6)
        mix.place('sfx', b, t + 0.02, 0.12)
        mix.place('send', b, t + 0.02, 0.15)
    elif ty == 'flip':
        for i in range(8):
            mix.place('sfx', click(3000 + 400 * i, 0.012), t + i * 0.03, 0.05, -0.8 + 0.2 * i)
    elif ty == 'stamp':
        for i in range(c['n']):
            mix.place('sfx', kick(0.12, 0.5, 90 + 6 * i), t + i * 0.035, 0.12)
    elif ty == 'link':
        for i in range(24):
            mix.place('sfx', click(7000, 0.008), t + d * i / 24, 0.035, -0.5 + i / 24)
    elif ty == 'sort':
        r = np.random.default_rng(3)
        for i in range(c['n']):
            mix.place('sfx', click(r.uniform(2500, 6000), 0.015), t + i * 0.012 + r.uniform(0, 0.25), 0.06, r.uniform(-0.8, 0.8))
    elif ty == 'light':                              # refletor acendendo
        k = c['k']
        mix.place('sfx', imp(1.0, 0.6), t, 0.35, [-0.6, 0.6, 0.0][k])
        mix.place('sfx', filt(noise(0.4), [2000, 8000], 'band') * np.exp(-tt(0.4) / 0.06), t, 0.12, [-0.6, 0.6, 0.0][k])
        hum = np.sin(2 * np.pi * 120 * tt(1.2)) * np.exp(-tt(1.2) / 0.5) * 0.2
        mix.place('sfx', hum, t, 0.15)
    elif ty == 'reveal':
        for i in range(12):
            mix.place('sfx', blip(midi(84 + [0, 3, 7, 10][i % 4] + 12 * (i // 8)), 0.1), t + d * i / 12, 0.03, -0.8 + 1.6 * i / 12)
    elif ty == 'network':
        for i in range(18):
            mix.place('sfx', ping(midi(84 + [0, 3, 5, 7, 10][i % 5]), 0.4), t + d * (i / 18) ** 0.8, 0.03, np.sin(i * 1.7))
    elif ty == 'ripple':
        mix.place('sfx', ping(midi(72), 1.0), t, 0.08)
    elif ty == 'plate':
        mix.place('sfx', whoosh(0.35, 400, 5000, 0.6, 1.4), t - 0.1, 0.2)
        mix.place('sfx', kick(0.25, 0.6, 70), t, 0.25)
    elif ty == 'line':
        mix.place('sfx', click(4500, 0.02), t, 0.12)
        mix.place('sfx', marimba(midi([79, 82, 87][c['i']] + (2 if c['j'] else 0)), 0.4, 0.8), t, 0.08)
    elif ty == 'rise':
        mix.place('sfx', riser(d, 200, 3200), t, 0.3)
        mix.place('sfx', reverse(crash(d)), t, 0.2)
    elif ty == 'band':                                # a barra aparece e encolhe até a logo
        sig_cut(mix, t, 1.2, 1, big=True)
        mix.place('sfx', whoosh(d + 0.2, 6000, 250, 0.2, 1.1), t, 0.35)
        mix.place('sfx', swell(reverse(imp(d, 1.0)), d), t, 0.3)
    elif ty == 'logo':                                # pouso: assinatura completa em Mi bemol maior
        mix.place('sfx', imp(3.0, 1.5), t, 0.9)
        mix.place('sfx', crash(3.2), t, 0.3)
        mix.place('send', imp(3.0, 1.5), t, 0.2)
        sig_cut(mix, t, 1.3, 1, big=True)
        sig_motif(mix, t + 0.02, E8, 1.2, full=True)
    elif ty == 'url':
        n, st = c.get('n', 19), c.get('st', 0.025)
        for k in range(n):
            mix.place('sfx', click(5500 + 120 * (k % 5), 0.012), t + 0.15 + k * st, 0.08, -0.6 + 1.2 * k / n)
        mix.place_pan('sfx', whoosh(0.45, 500, 4000, 0.4, 1.4), t, 0.12, -0.6, 0.6)
    elif ty == 'glint':
        for k in range(10):
            mix.place('sfx', blip(midi([87, 91, 94, 99, 103, 106, 111, 115, 118, 123][k] - 12), 0.12), t + d * k / 10, 0.025, -0.8 + 0.16 * k)
    else:
        raise ValueError('cue desconhecido: ' + ty)


for c in CUES:
    fx(c)

out = mix.render(levels={'music': 0.95, 'drums': 0.7, 'sfx': 1.0}, reverb={'send': 0.55, 'sfx': 0.1, 'music': 0.1})
# respiro antes de cada salto e do pouso: 60 ms em -14 dB, e o golpe entra no instante exato do evento
g = np.ones(out.shape[1])
for c in CUES:
    if c['type'] in ('zoom', 'logo'):
        i1 = int(c['t'] * SR)
        i0, i_ = i1 - int(0.075 * SR), i1 - int(0.06 * SR)
        g[i0:i_] = np.minimum(g[i0:i_], np.linspace(1, 0.2, i_ - i0))
        g[i_:i1 - 192] = np.minimum(g[i_:i1 - 192], 0.2)
        g[i1 - 192:i1] = np.minimum(g[i1 - 192:i1], np.linspace(0.2, 1, 192))     # volta em 4 ms (sem degrau)
out = out * g
# equalização final pensando no celular: menos subgrave, mais presença (1,5–6 kHz)
out = filt(out, 28, 'high')
out = out - 0.4 * filt(out, 70, 'low') + 0.25 * filt(out, [500, 1500], 'band') + 0.3 * filt(out, [1500, 6000], 'band')
master(out, os.path.join(ROOT, 'audio', 'trilha.wav'))
