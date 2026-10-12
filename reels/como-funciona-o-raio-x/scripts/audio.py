#!/usr/bin/env python3
"""
Trilha + efeitos do FAZLO Digital "Como funciona o raio-x" — 100% sintetizados.

Mesma paleta do Reel "Instagram não é site": 100 BPM (1 tempo = 0,6 s), Lá bemol maior,
assinatura sonora da marca ("o corte" e o motivo Lá bemol 5 -> Mi bemol 6).

  gancho     pad e vidro esparsos; a VARREDURA do scanner (ruído com filtro ressonante e um
             glissando) desce com a linha e cai no golpe de "RAIO-X." (3,0 s)
  a coleta   o groove entra leve; cada item da ficha acende com um bipe de leitura afinado,
             em notas que sobem (pentatônica de Lá bemol)
  o único    um scan curto "filtra" a ficha; cada chip cheio nasce com um sino brilhante
  o hóspede  o scan sobe (varredura invertida); chips de contorno com blocos mais secos;
             uma subida prepara a virada (termina 60 ms antes do golpe)
  o site     "o corte" na barra lima; a varredura revela o site; groove completo; cada chip
             voa (sopro) e encaixa (bloco afinado, escala que sobe); modais abrem e fecham
  fecho      a assinatura completa na logo; Lá bemol maior

    python3 reels/como-funciona-o-raio-x/scripts/audio.py   -> audio/trilha.wav (48 kHz, estéreo, -14 LUFS)
"""
import os
import sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, '..', '..', 'tools', 'audio'))
from fzaudio import *  # noqa: E402,F403
from fzbrand import sig_cut, sig_motif  # noqa: E402

seed(707)
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
    'Abmaj9': [56, 60, 63, 67, 70], 'Fm9': [53, 56, 60, 63, 67], 'Dbmaj9': [53, 56, 60, 61, 65],
    'Ebsus': [51, 56, 58, 63, 65], 'Bbm9': [53, 58, 61, 65, 72],
}
ROOT_N = {'Abmaj9': 44, 'Fm9': 41, 'Dbmaj9': 49, 'Ebsus': 51, 'Bbm9': 46}
PENTA = [80, 82, 84, 87, 89, 92, 94, 96, 99]        # Lá bemol maior pentatônica


# ------------------------------------------------------------------ timbres
def env_on(t, a=0.003):
    return np.minimum(1, t / a)


def glass(f, d=0.5, vel=1.0):
    t = tt(d)
    idx = 1.2 * vel * np.exp(-t / 0.07)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 2.0 * t)) + 0.25 * np.sin(2 * np.pi * f * 4.07 * t) * np.exp(-t / 0.04)
    return s * np.exp(-t / 0.3) * env_on(t, 0.002) * vel


def epiano(notes, d, bright=1.0):
    t = tt(d)
    s = np.zeros(len(t))
    for n in notes:
        f = midi(n)
        s += np.sin(2 * np.pi * f * t + 1.4 * bright * np.exp(-t / 0.12) * np.sin(2 * np.pi * f * t)) * np.exp(-t / 0.55)
    return s / len(notes) * env_on(t, 0.003) * np.clip((d - t) / 0.05, 0, 1)


def block(f, d=0.3):
    t = tt(d)
    return np.sin(2 * np.pi * f * t + 2.0 * np.exp(-t / 0.025) * np.sin(2 * np.pi * f * 1.41 * t)) * np.exp(-t / 0.1) * env_on(t, 0.0015)


def tick(f=2600, d=0.03):
    t = tt(d)
    return filt(noise(d), [f * 0.6, f * 1.5], 'band') * np.exp(-t / 0.006) * env_on(t, 0.001) + np.sin(2 * np.pi * f * 0.5 * t) * np.exp(-t / 0.01) * 0.4


def reese(n, d, bright=800):
    t = tt(d)
    f = midi(n)
    s = saw(f * 0.997, t, bright) + saw(f * 1.004, t, bright) + 0.9 * np.sin(2 * np.pi * f * t)
    s = filt(np.tanh(1.5 * s) * 0.6, 45, 'high')
    return s * env_on(t, 0.004) * np.clip((d - t) / 0.03, 0, 1) * np.exp(-t / 0.9)


def imp(d=2.0, big=1.0):
    t = tt(d)
    body = filt(noise(d), [90, 1400], 'band') * np.exp(-t / 0.12) * 1.4
    air = filt(noise(d), 4000, 'high') * np.exp(-t / 0.05) * 0.3
    return (filt(impact(d, big), 45, 'high') * 0.7 + body + air) * env_on(t, 0.003)


def swell(x, d, gap=0.06):
    n = max(1, int((d - gap) * SR))
    y = x[-int(d * SR):][:n].copy()
    y[-int(0.008 * SR):] *= np.linspace(1, 0, int(0.008 * SR))
    return y


def stereo_pad(notes, d, bright, att, rel):
    a, b2 = pad(notes, d, bright=bright, att=att, rel=rel), pad(notes, d, bright=bright, att=att, rel=rel)
    m, sd = (a + b2) / 2, (a - b2) / 2
    return filt(np.stack([m + 0.7 * sd, m - 0.7 * sd]), 150, 'high')


def kk():
    return filt(kick(0.38, 1.0, 56), 45, 'high') * env_on(tt(0.38), 0.002)


def scanner(d, f0=500, f1=5200, up=False):
    """Varredura do scanner: ruído com filtro ressonante deslizando + um glissando senoidal suave
    e um zumbido de 'leitura' em 120 Hz (como uma linha de luz passando)."""
    t = tt(d)
    lo, hi = (f1, f0) if up else (f0, f1)
    band = sweep(noise(d), lo, hi, 6.0)
    glide = np.sin(2 * np.pi * np.cumsum(lo * 0.5 * (hi / lo) ** (t / d)) / SR) * 0.25
    hum = np.sin(2 * np.pi * 120 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 30 * t)) * 0.12
    env = np.minimum(1, t / 0.06) * np.clip((d - t) / 0.08, 0, 1)
    return (band * 1.2 + glide + hum) * env


def readbeep(f, d=0.16):
    """Bipe de leitura de um item: tom puro + harmônico e um clique."""
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / 0.03)
    return s * np.exp(-t / 0.06) * env_on(t, 0.002)


def bell(f, d=1.2):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t + 1.8 * np.exp(-t / 0.2) * np.sin(2 * np.pi * f * 3.5 * t))
    return s * np.exp(-t / 0.5) * env_on(t, 0.002)


# ------------------------------------------------------------------ partes
def arp(t0, t1, ch, g, step=E8, pat=(0, 2, 4, 1, 3, 2, 4, 3), oct_=12, pan=0.4):
    c, k, t = CH[ch], 0, t0
    while t < t1 - 1e-6:
        mix.place('music', glass(midi(c[pat[k % len(pat)] % len(c)] + oct_), 0.45, 0.7 + 0.3 * (k % 4 == 0)), t, g, pan * np.sin(k * 1.3))
        t += step
        k += 1


def groove(n, ch, g=1.0, kicks=(0, 2.5), claps=(1, 3), hats=True, bass=((0, 1.5), (1.5, 1.0), (2.5, 0.5), (3.0, 1.0)), keys=(0, 1.5, 2.5)):
    for b in kicks:
        mix.place('drums', kk(), bar(n, b), 0.5 * g)
    for b in claps:
        mix.place('drums', clap(), bar(n, b), 0.36 * g, 0.05)
        mix.place('send', clap(), bar(n, b), 0.08 * g)
    if hats:
        for k in range(8):
            mix.place('drums', hat(False), bar(n) + k * E8, (0.09 if k % 2 else 0.05) * g, 0.25 if k % 2 else -0.2)
    for b, dur in bass:
        mix.place('music', reese(ROOT_N[ch], dur * BT * 0.95), bar(n, b), 0.27 * g)
    for b in keys:
        mix.place('music', epiano(CH[ch], 0.7), bar(n, b), 0.15 * g, 0.15)


# --- gancho (c.1–c.2): pad e vidro esparsos; o golpe de "RAIO-X." em 3,0 (c.2, tempo 1)
mix.place('music', stereo_pad(CH['Abmaj9'], 2.9, 1700, 0.4, 0.5), 0.0, 0.14)
for i, n in enumerate([80, 87, 84, 92]):
    mix.place('music', glass(midi(n), 0.7, 0.8), i * BT, 0.07, -0.4 + 0.25 * i)
for b in (0, 1, 2, 3):
    mix.place('drums', filt(kk(), 500, 'low'), bar(1, b), 0.16)
mix.place('music', stereo_pad(CH['Fm9'], 1.3, 2200, 0.05, 0.4), bar(2, 1), 0.13)
mix.place('music', reese(41, 1.1), bar(2, 1), 0.24)
# --- a coleta (c.3–c.5): o groove entra leve (anacruse no fim do c.2)
for k in range(4):
    mix.place('drums', hat(False), bar(2, 3) + k * S16, 0.04 + 0.02 * k, 0.2)
for n, ch in ((3, 'Abmaj9'), (4, 'Fm9'), (5, 'Dbmaj9')):
    groove(n, ch, g=0.85)
    mix.place('music', stereo_pad(CH[ch], BAR + 0.3, 1800, 0.2, 0.4), bar(n), 0.08)
# --- o único (c.6–c.8, meio): mais cheio
for n, ch in ((6, 'Dbmaj9'), (7, 'Abmaj9')):
    groove(n, ch, kicks=(0, 1, 2, 2.5, 3))
    arp(bar(n), bar(n + 1), ch, 0.05, step=S16 * 2, pat=(0, 2, 4, 3))
    mix.place('music', stereo_pad(CH[ch], BAR + 0.3, 2200, 0.15, 0.4), bar(n), 0.09)
groove(8, 'Ebsus', kicks=(0, 1), claps=(1,), keys=(0,), bass=((0, 1.5),))
mix.place('music', stereo_pad(CH['Ebsus'], 1.3, 2200, 0.15, 0.4), bar(8), 0.09)
# --- o hóspede (c.8 meio–c.10): meio-tempo, mais seco; subida para a virada
mix.place('music', stereo_pad(CH['Fm9'], 1.3, 1600, 0.2, 0.4), bar(8, 2), 0.1)
for n, ch in ((9, 'Bbm9'), (10, 'Ebsus')):
    for b in (0, 2.5):
        mix.place('drums', kk(), bar(n, b), 0.45)
    mix.place('drums', snare(0.3), bar(n, 2), 0.25)
    for k in range(8):
        mix.place('drums', hat(False), bar(n) + k * E8, 0.06 if k % 2 else 0.035, 0.2 if k % 2 else -0.2)
    mix.place('music', reese(ROOT_N[ch], BAR * 0.95, 650), bar(n), 0.22)
    mix.place('music', stereo_pad(CH[ch], BAR + 0.3, 1600, 0.3, 0.4), bar(n), 0.1)
    for b in (0, 1.5, 3):
        mix.place('music', epiano(CH[ch], 0.6, 0.8), bar(n, b), 0.12, -0.15)
mix.place('sfx', swell(riser(0.95, 200, 3200), 0.9), SEC['site'] - 0.9, 0.2)
mix.place('sfx', swell(reverse(crash(1.0)), 0.85), SEC['site'] - 0.85, 0.12)
# --- o site (golpe no c.10, tempo 4; c.11–c.14): groove completo e claro
for n, ch in ((11, 'Abmaj9'), (12, 'Dbmaj9'), (13, 'Fm9'), (14, 'Ebsus')):
    groove(n, ch, kicks=(0, 1, 2, 3))
    arp(bar(n), bar(n + 1), ch, 0.05, step=S16 * 2, pat=(0, 2, 4, 1, 3, 2, 4, 3))
    mix.place('music', stereo_pad(CH[ch], BAR + 0.3, 2600, 0.12, 0.4), bar(n), 0.09)
mix.place('music', stereo_pad(CH['Abmaj9'], 1.0, 2600, 0.05, 0.4), SEC['site'], 0.1)
# --- fechamento: Lá bemol maior
L = DUR - SEC['fecho']
mix.place('music', stereo_pad(CH['Abmaj9'], L, 2600, 0.06, 1.4), SEC['fecho'], 0.24)
mix.place('music', stereo_pad([x + 12 for x in CH['Abmaj9'][1:]], L, 3600, 0.4, 1.4) * 0.5, SEC['fecho'], 0.14)
mix.place('music', reese(44, 2.6), SEC['fecho'], 0.3)
arp(SEC['fecho'] + 0.6, DUR - 0.3, 'Abmaj9', 0.05, step=E8)


# ------------------------------------------------------------------ efeitos (a partir dos cues)
def fx(c):
    ty, t = c['type'], c['t']
    d = c.get('d', 0.3)
    k = c.get('k', 0)
    if ty == 'open':
        mix.place('sfx', glass(midi(80), 0.8), t, 0.1)
    elif ty == 'scan':                                  # a linha desce; a varredura acaba antes do golpe
        mix.place_pan('sfx', swell(scanner(d + 0.2, 400, 5600), 0.62), t, 0.2, -0.2, 0.2)
    elif ty == 'raiox':                                 # A GENTE FAZ UM RAIO-X.
        mix.place('sfx', imp(1.6, 0.9), t, 0.5)
        mix.place('sfx', bell(midi(87), 1.4) + bell(midi(80), 1.4) * 0.6, t, 0.1)
        mix.place('send', bell(midi(92), 1.4), t, 0.08)
    elif ty == 'ficha':
        mix.place('sfx', whoosh(0.6, 300, 3000, 0.4, 1.2), t, 0.14)
        mix.place('sfx', tick(4200, 0.03), t + 0.45, 0.1)
    elif ty == 'row':                                   # cada item lido: bipe afinado que sobe
        mix.place('sfx', readbeep(midi(PENTA[k]), 0.18), t, 0.17, -0.3 + 0.1 * k)
        mix.place('send', readbeep(midi(PENTA[k]), 0.18), t, 0.06)
        mix.place('sfx', tick(5200, 0.02), t, 0.07)
    elif ty == 'title':
        mix.place('sfx', whoosh(0.35, 500, 3500, 0.5, 1.4), t - 0.1, 0.08)
    elif ty == 'shrink':
        mix.place('sfx', whoosh(0.6, 3200, 400, 0.4, 1.2), t, 0.13)
    elif ty == 'filter':                                # o scan passa pela ficha
        mix.place('sfx', scanner(d, 900, 4800), t, 0.12, 0.1)
    elif ty == 'chipU':                                 # o que só ela tem: sino cheio
        f = midi([84, 87, 89, 92, 96][k])
        mix.place('sfx', bell(f, 1.0), t, 0.13, [-0.4, 0.4, -0.2, 0.2, 0][k])
        mix.place('send', bell(f, 1.0), t, 0.06)
        mix.place('sfx', pop(520, 0.1), t, 0.16)
    elif ty == 'flip':                                  # o scan sobe
        mix.place('sfx', scanner(0.55, 400, 5200, up=True), t, 0.16)
        mix.place('sfx', imp(1.0, 0.5), t, 0.22)
    elif ty == 'chipH':                                 # o que o hóspede precisa: bloco seco
        f = midi([80, 84, 87, 91][k])
        mix.place('sfx', block(f, 0.3), t, 0.24, [-0.35, 0.35, -0.2, 0.2][k])
        mix.place('sfx', tick(3600, 0.025), t, 0.08)
    elif ty == 'slash':                                 # a barra lima: "o corte" da assinatura
        mix.place('sfx', imp(1.8, 1.0), t, 0.55)
        sig_cut(mix, t, 1.0, 1, big=True)
    elif ty == 'reveal':                                # o scan revela o site real
        mix.place('sfx', scanner(d + 0.1, 700, 6000), t, 0.14)
    elif ty == 'fly':
        mix.place_pan('sfx', whoosh(d, 600, 3200, 0.45, 1.3), t, 0.08, -0.5, 0.5)
    elif ty == 'dock':                                  # encaixe: bloco afinado, a escala sobe
        f = midi(PENTA[k])
        mix.place('sfx', block(f, 0.35), t, 0.28, 0.3)
        mix.place('sfx', glass(midi(PENTA[k] + 12), 0.6), t + 0.01, 0.07, 0.3)
        mix.place('sfx', tick(4800, 0.02), t, 0.09)
    elif ty == 'modal':
        mix.place('sfx', filt(noise(0.14), [1500, 6000], 'band') * np.exp(-tt(0.14) / 0.035) * env_on(tt(0.14), 0.003), t, 0.09)
        mix.place('sfx', blip(midi(91), 0.06), t + 0.02, 0.06)
    elif ty == 'modalclose':
        mix.place('sfx', blip(midi(84), 0.05), t, 0.05)
    elif ty == 'logo':                                  # assinatura completa
        mix.place('sfx', imp(2.6, 1.2), t, 0.4)
        mix.place('send', imp(2.6, 1.2), t, 0.15)
        sig_cut(mix, t, 0.7, 1, big=True)
        sig_motif(mix, t + 0.3, E8, 1.15, full=True)
    elif ty == 'cta':
        mix.place('sfx', blip(midi(92), 0.08), t, 0.08)
        mix.place('sfx', glass(midi(87), 0.6), t + 0.03, 0.06)
    else:
        raise ValueError('cue desconhecido: ' + ty)


for c in CUES:
    fx(c)

out = mix.render(levels={'music': 0.85, 'drums': 0.75, 'sfx': 1.0}, reverb={'send': 0.55, 'sfx': 0.1, 'music': 0.12})
# respiro antes dos golpes principais: 60 ms em -14 dB
g = np.ones(out.shape[1])
for c in CUES:
    if c['type'] in ('raiox', 'slash', 'logo'):
        i1 = int(c['t'] * SR)
        i0, i_ = i1 - int(0.075 * SR), i1 - int(0.06 * SR)
        g[i0:i_] = np.minimum(g[i0:i_], np.linspace(1, 0.2, i_ - i0))
        g[i_:i1 - 192] = np.minimum(g[i_:i1 - 192], 0.2)
        g[i1 - 192:i1] = np.minimum(g[i1 - 192:i1], np.linspace(0.2, 1, 192))
out = out * g
out = filt(out, 28, 'high')
out = out - 0.4 * filt(out, 70, 'low') + 0.25 * filt(out, [500, 1500], 'band') + 0.3 * filt(out, [1500, 6000], 'band')
master(out, os.path.join(ROOT, 'audio', 'trilha.wav'), ceiling_db=-3.3)   # folga para o AAC nos golpes
