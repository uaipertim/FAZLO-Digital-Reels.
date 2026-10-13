#!/usr/bin/env python3
"""
Trilha + efeitos do FAZLO Digital "Site não é luxo" — 100% sintetizados.

Mesma paleta dos Reels anteriores: 100 BPM (1 tempo = 0,6 s), Lá bemol maior, assinatura sonora
da marca ("o corte" e o motivo Lá bemol 5 -> Mi bemol 6).

  gancho      pad e vidro esparsos, a pergunta no ar
  o mito      "glamour" exagerado: harpa de vidro subindo, cintilação, sininhos nos reflexos;
              no golpe (6,6) "o corte" + rachadura de vidro; no estouro (6,75) o vidro se espalha
              e o NÃO. bate grave; as peças tilintam no ar
  o básico    o groove entra (9,0); cada bloco se forma com um brilho, cai com um sopro e pousa
              com batida grave + bloco afinado, em notas que sobem
  noite       a música fecha num filtro e fica o pad; tique-taque do relógio; toque de
              notificação genérico (não é o som do WhatsApp)
  manhã       o filtro abre, o arpejo volta; o relógio rola; toque, digitação e "enviado"
  virada      o groove completo; o golpe em É SER ENCONTRADA. (27,9) com respiro antes
  CTA         a assinatura completa na logo; Lá bemol maior

    python3 reels/site-nao-e-luxo/scripts/audio.py   -> audio/trilha.wav (48 kHz, estéreo, -14 LUFS)
    python3 reels/site-nao-e-luxo/scripts/audio.py --voz   -> audio/trilha-voz.wav (com a narração de
                                                            scripts/voz.py; a trilha.wav não muda)
"""
import json
import os
import sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, '..', '..', 'tools', 'audio'))
from fzaudio import *  # noqa: E402,F403
from fzbrand import sig_cut, sig_motif  # noqa: E402

VOZ = '--voz' in sys.argv                                     # versão narrada (teste)
DR = 'drums_fx' if VOZ else 'drums'                           # batidas dos golpes: com voz, num barramento próprio

seed(1105)
DATA = load_cues(ROOT)
BPM = DATA['bpm']
BT = 60.0 / BPM
S16 = BT / 4
E8 = BT / 2
DUR = float(DATA['duration'])
SEC = DATA['sections']
CUES = DATA['cues']
GOLPE2 = next(c['t'] for c in CUES if c['type'] == 'hit')       # É SER ENCONTRADA.
mix = Mix(DUR)


def b(n):
    return n * BT


# ------------------------------------------------------------------ harmonia
CH = {
    'Abmaj9': [56, 60, 63, 67, 70], 'Fm9': [53, 56, 60, 63, 67], 'Dbmaj9': [53, 56, 60, 61, 65],
    'Ebsus': [51, 56, 58, 63, 65], 'Bbm9': [53, 58, 61, 65, 72],
}
ROOT_N = {'Abmaj9': 44, 'Fm9': 41, 'Dbmaj9': 49, 'Ebsus': 51, 'Bbm9': 46}
PENTA = [80, 82, 84, 87, 89, 92, 94, 96, 99]        # Lá bemol maior pentatônica
DROP_N = [80, 84, 87, 92]                            # um bloco por nota, subindo


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
    y = x[..., -int(d * SR):][..., :n].copy()
    y[..., -int(0.008 * SR):] *= np.linspace(1, 0, int(0.008 * SR))
    return y


def stereo_pad(notes, d, bright, att, rel):
    a, b2 = pad(notes, d, bright=bright, att=att, rel=rel), pad(notes, d, bright=bright, att=att, rel=rel)
    m, sd = (a + b2) / 2, (a - b2) / 2
    return filt(np.stack([m + 0.7 * sd, m - 0.7 * sd]), 150, 'high')


def kk():
    return filt(kick(0.38, 1.0, 56), 45, 'high') * env_on(tt(0.38), 0.002)


def tap(f, d=0.14):
    """Toque na tela: clique macio + corpo afinado curto (como um dedo no vidro)."""
    t = tt(d)
    body = (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / 0.015)) * np.exp(-t / 0.035)
    thump = np.sin(2 * np.pi * np.cumsum(180 + 220 * np.exp(-t / 0.006)) / SR) * np.exp(-t / 0.02) * 0.5
    clk = np.zeros(len(t))
    c_ = click(4200, 0.02)
    clk[:len(c_)] = c_
    return (body * 0.8 + thump + clk * 0.5) * env_on(t, 0.0012)


def bell(f, d=1.2):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t + 1.8 * np.exp(-t / 0.2) * np.sin(2 * np.pi * f * 3.5 * t))
    return s * np.exp(-t / 0.5) * env_on(t, 0.002)


def pan2(s, p):
    return np.stack([s * np.cos((p + 1) * np.pi / 4), s * np.sin((p + 1) * np.pi / 4)])


def sparkle(d=1.2, dens=26, lo=96, hi=110, g=1.0, seed_=0):
    """Cintilação: muitos sininhos agudos e curtos, espalhados no estéreo (o brilho "de luxo")."""
    out = np.zeros((2, int((d + 0.5) * SR)))
    r = np.random.default_rng(seed_)
    for _ in range(int(d * dens)):
        s = pan2(glass(midi(int(r.integers(lo, hi))), 0.35, r.uniform(0.3, 1.0)) * g, r.uniform(-0.9, 0.9))
        i = int(r.uniform(0, d) * SR)
        out[:, i:i + s.shape[1]] += s
    return out


def harp(notes, t0, step, g, pan0=-0.6, pan1=0.6, vel=0.9):
    """Glissando de harpa de vidro."""
    for k, n in enumerate(notes):
        p = pan0 + (pan1 - pan0) * k / max(1, len(notes) - 1)
        mix.place('music', glass(midi(n), 0.9, vel), t0 + k * step, g, p)
        mix.place('send', glass(midi(n), 0.9, vel), t0 + k * step, g * 0.4)


def crackle(d=0.5):
    """Rachadura de vidro: estalo brilhante com parciais inarmônicos que ressoam."""
    t = tt(d)
    burst = filt(noise(d), [2500, 11000], 'band') * np.exp(-t / 0.012)
    ring = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / dk) for f, dk in ((2330, 0.09), (3710, 0.07), (5890, 0.05), (8120, 0.035)))
    crunch = filt(noise(d), [300, 1800], 'band') * np.exp(-t / 0.03) * 0.6
    return (burst + ring * 0.35 + crunch) * env_on(t, 0.0008)


def shatter(d=0.9, n=28):
    """Vidro se espalhando: estilhaços agudos ao longo de d, cada vez mais raros."""
    out = np.zeros((2, int((d + 0.5) * SR)))
    r = np.random.default_rng(77)
    for k in range(n):
        s = glass(midi(int(r.integers(98, 112))), 0.3, r.uniform(0.4, 1.0)) * (1 - 0.6 * k / n)
        s = s + filt(noise(0.3), [3000, 10000], 'band') * np.exp(-tt(0.3) / 0.01) * 0.3
        s = pan2(s, r.uniform(-0.95, 0.95))
        i = int(d * (k / n) ** 1.8 * SR)
        out[:, i:i + s.shape[1]] += s
    tail = filt(noise(d + 0.5), [4000, 12000], 'band') * np.exp(-tt(d + 0.5) / 0.25) * 0.25
    return out + np.stack([tail, tail[::-1]])


def marimba(f, d=0.5):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) + 0.18 * np.sin(2 * np.pi * f * 3.98 * t) * np.exp(-t / 0.03)
    return s * np.exp(-t / 0.16) * env_on(t, 0.0015)


def notif_tone():
    """Toque de notificação genérico: dois tons de madeira macia que sobem (não é o do WhatsApp)."""
    a, b2 = marimba(midi(87), 0.6), marimba(midi(94), 0.7)
    out = np.zeros(int(0.9 * SR))
    out[:len(a)] += a
    i = int(0.11 * SR)
    out[i:i + len(b2)] += b2 * 0.9
    return out


def woodtick(f=1800, d=0.05):
    """Tique do relógio."""
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.006) + filt(noise(d), [2500, 7000], 'band') * np.exp(-t / 0.003) * 0.6) * env_on(t, 0.0006)


# ------------------------------------------------------------------ partes
def arp(t0, t1, ch, g, step=E8, pat=(0, 2, 4, 1, 3, 2, 4, 3), oct_=12, pan=0.4):
    c, k, t = CH[ch], 0, t0
    while t < t1 - 1e-6:
        mix.place('music', glass(midi(c[pat[k % len(pat)] % len(c)] + oct_), 0.45, 0.7 + 0.3 * (k % 4 == 0)), t, g, pan * np.sin(k * 1.3))
        t += step
        k += 1


def drums(b0, b1, g=1.0, kicks='four', clap_on=(1, 3), hats=True, ghost=False):
    """Bateria do tempo b0 ao b1; grupos de 4 tempos a partir de b0."""
    for k in range(int(round(b1 - b0))):
        t, pos = b(b0 + k), k % 4
        if kicks == 'four' or (kicks == 'half' and pos in (0, 2)):
            mix.place('drums', kk(), t, 0.5 * g)
        if pos in clap_on:
            mix.place('drums', clap(), t, 0.34 * g, 0.05)
            mix.place('send', clap(), t, 0.07 * g)
        if hats:
            mix.place('drums', hat(False), t, 0.045 * g, -0.2)
            mix.place('drums', hat(False), t + E8, 0.09 * g, 0.25)
            if ghost:
                mix.place('drums', hat(False), t + S16 * 3, 0.03 * g, 0.3)


def bass(b0, nb, ch, g=1.0, pat=((0, 1.5), (1.5, 1.0), (2.5, 0.5), (3.0, 1.0))):
    for off, dur in pat:
        if off < nb:
            mix.place('music', reese(ROOT_N[ch], min(dur, nb - off) * BT * 0.95), b(b0 + off), 0.26 * g)


def keys(b0, nb, ch, g=1.0, offs=(0, 1.5, 2.5)):
    for off in offs:
        if off < nb:
            mix.place('music', epiano(CH[ch], 0.7), b(b0 + off), 0.15 * g, 0.15)


# --- gancho (0–4,2): pad e vidro esparsos
mix.place('music', stereo_pad(CH['Abmaj9'], b(4) + 0.3, 1600, 0.25, 0.5), 0.0, 0.15)
mix.place('music', stereo_pad(CH['Fm9'], b(3) + 0.2, 1500, 0.3, 0.4), b(4), 0.14)
for i, n in enumerate([80, 87, 84, 92, 87, 84]):
    mix.place('music', glass(midi(n), 0.7, 0.8), b(i), 0.07, -0.4 + 0.16 * i)
for k in range(7):
    mix.place('drums', filt(kk(), 400, 'low'), b(k), 0.07)
mix.place('sfx', swell(riser(1.2, 300, 3000), 1.2), SEC['mito'] - 1.2, 0.09)

# --- o mito (4,2–6,6): "glamour" exagerado
L0 = SEC['mito']
mix.place('music', stereo_pad([x + 12 for x in CH['Dbmaj9']], b(4) - 0.05, 4200, 0.12, 0.25), L0, 0.22)
mix.place('music', stereo_pad(CH['Dbmaj9'], b(4) - 0.05, 2600, 0.1, 0.25), L0, 0.2)
mix.place('music', reese(ROOT_N['Dbmaj9'], b(4) - 0.08, 600), L0, 0.2)
harp([68, 72, 75, 77, 80, 84, 87, 89, 92, 96, 99, 101, 104], L0, 0.035, 0.09)
mix.place('sfx', sparkle(2.3, 18, 98, 112, 0.6, 1), L0 + 0.1, 0.16)
for k in (0, 1, 2, 3):                                   # pulso de "desfile": bumbo macio e prato aberto leve
    mix.place('drums', filt(kk(), 900, 'low'), L0 + b(k), 0.22)
    mix.place('drums', hat(True), L0 + b(k) + E8, 0.03, 0.3)

# --- depois do golpe (6,75–9,0): o vidro no ar, um pad escuro; as peças se juntam e o celular sobe
mix.place('music', stereo_pad(CH['Fm9'], 9.0 - 6.75 + 0.2, 1100, 0.4, 0.5), 6.75, 0.2)
mix.place('music', reese(ROOT_N['Fm9'], 2.1, 500), 6.8, 0.17)
for k in range(8):                                       # semicolcheias crescendo até o celular subir (9,0)
    mix.place('drums', hat(False), b(13) + k * S16 * 2, 0.025 + 0.012 * k, 0.25 if k % 2 else -0.25)
for k in range(9):                                       # as peças tilintam no ar
    t = 7.0 + k * 0.17 + 0.05 * np.sin(k * 2.1)
    mix.place('sfx', glass(midi(PENTA[(k * 3) % len(PENTA)] + 12), 0.35, 0.5), t, 0.035, 0.7 * np.sin(k * 1.7))
mix.place('sfx', swell(reverse(crash(1.2)), 0.9), 9.0 - 0.9, 0.08)

# --- o básico (9,0–18,0): o groove entra
for b0, nb, ch in ((15, 4, 'Abmaj9'), (19, 4, 'Fm9'), (23, 4, 'Dbmaj9'), (27, 3, 'Ebsus')):
    bass(b0, nb, ch)
    keys(b0, nb, ch, 0.9)
    mix.place('music', stereo_pad(CH[ch], b(nb) + 0.25, 2000, 0.15, 0.35), b(b0), 0.08)
drums(15, 30, 0.85, ghost=True)
arp(b(25), b(30), 'Dbmaj9', 0.03, step=S16 * 2)

# --- noite (18,0–21,6): só o pad, filtrado; tique-taque
NT = SEC['trabalha']
mix.place('music', stereo_pad(CH['Dbmaj9'], b(3) + 0.4, 900, 0.5, 0.6), NT, 0.26)
mix.place('music', stereo_pad(CH['Fm9'], b(3) + 0.4, 900, 0.4, 0.6), b(33), 0.25)
mix.place('music', reese(ROOT_N['Dbmaj9'], b(3), 300), NT, 0.12)
mix.place('music', reese(ROOT_N['Fm9'], b(3), 300), b(33), 0.12)
for k in range(31, 36):                                  # tique-taque, um por tempo
    mix.place('sfx', woodtick(2200 if k % 2 else 1700), b(k), 0.09, 0.25 if k % 2 else -0.25)
mix.place('sfx', filt(noise(3.6), [200, 1200], 'band') * np.exp(-0.3 * tt(3.6)) * 0.08, NT + 0.1, 0.25)   # ar noturno
mix.automate_lowpass('music', 17.85, 18.2, 12000, 900)
mix.automate_lowpass('music', 18.2, 21.6, 900, 900)

# --- manhã (21,6–25,8): o filtro abre, o arpejo volta, groove leve
mix.place('music', stereo_pad(CH['Abmaj9'], b(3) + 0.3, 2400, 0.4, 0.4), b(36), 0.15)
mix.place('music', stereo_pad(CH['Bbm9'], b(2) + 0.3, 2400, 0.2, 0.4), b(39), 0.12)
mix.place('music', stereo_pad(CH['Ebsus'], b(2) + 0.25, 2600, 0.2, 0.35), b(41), 0.12)
arp(b(36), b(43), 'Abmaj9', 0.04, step=E8)
for b0, nb, ch in ((36, 3, 'Abmaj9'), (39, 2, 'Bbm9'), (41, 2, 'Ebsus')):
    bass(b0, nb, ch, 0.7, pat=((0, 1.5), (1.5, 1.0), (2.5, 0.5)))
mix.automate_lowpass('music', 21.6, 22.8, 900, 12000)
drums(38, 43, 0.55, kicks='half', clap_on=(), hats=True)
mix.place('sfx', swell(riser(1.2, 200, 2400), 1.2), SEC['virada'] - 1.2, 0.1)

# --- virada (25,8–30,0): o groove completo; golpe em É SER ENCONTRADA. (27,9, antecipando o tempo 47)
for b0, nb, ch in ((43, 2, 'Abmaj9'), (45, 1.5, 'Fm9'), (46.5, 2, 'Dbmaj9'), (48.5, 1.5, 'Ebsus')):
    bass(b0, nb, ch, 1.0, pat=((0, 1.0), (1.0, 0.5), (1.5, 0.5)))
    mix.place('music', stereo_pad(CH[ch], b(nb) + 0.25, 2600, 0.12, 0.3), b(b0), 0.09)
    keys(b0, nb, ch, 1.0, offs=(0, 1.0))
drums(43, 46, 1.0, ghost=True)
drums(47, 50, 1.0, ghost=True, clap_on=(0, 2))
for k in range(4):                                       # virada de caixa até o golpe (27,3–27,75)
    mix.place('drums', snare(0.2), GOLPE2 - E8 * (4 - k), 0.06 + 0.04 * k, 0.1)
arp(b(47), b(50), 'Dbmaj9', 0.04, step=S16 * 2)
mix.place('sfx', swell(riser(1.5, 250, 4200), 1.5), GOLPE2 - 1.5, 0.12)
mix.place('sfx', swell(reverse(crash(1.4)), 1.0), SEC['cta'] - 1.0, 0.12)

# --- CTA (30,0–33,0): Lá bemol maior
L = DUR - SEC['cta']
mix.place('music', stereo_pad(CH['Abmaj9'], L, 2600, 0.06, 1.4), SEC['cta'], 0.24)
mix.place('music', stereo_pad([x + 12 for x in CH['Abmaj9'][1:]], L, 3600, 0.4, 1.4) * 0.5, SEC['cta'], 0.14)
mix.place('music', reese(44, 2.6), SEC['cta'], 0.3)
arp(SEC['cta'] + 0.6, DUR - 0.3, 'Abmaj9', 0.05, step=E8)


# ------------------------------------------------------------------ efeitos (a partir dos cues)
def fx(c):
    ty, t = c['type'], c['t']
    d = c.get('d', 0.3)
    k = c.get('k', 0)
    if ty == 'open':
        mix.place('sfx', glass(midi(80), 0.8), t, 0.1)
    elif ty == 'title':
        mix.place('sfx', whoosh(0.35, 500, 3500, 0.5, 1.4), max(0.0, t - 0.1), 0.07)
    elif ty == 'luxo':                                  # LUXO entra: "tcham" de glamour
        mix.place('sfx', imp(1.6, 0.7), t, 0.18)
        mix.place('sfx', sparkle(0.6, 40, 100, 114, 1.0, 2), t, 0.16)
        mix.place('send', sparkle(0.6, 40, 100, 114, 1.0, 2), t, 0.08)
    elif ty == 'shine':                                 # o reflexo varre as letras: cascata de sininhos
        for j, n in enumerate([96, 99, 101, 104, 106, 108]):
            mix.place('sfx', glass(midi(n), 0.5, 0.7), t + j * 0.05, 0.05, -0.6 + 0.24 * j)
        mix.place('sfx', whoosh(0.5, 2000, 9000, 0.5, 1.6), t, 0.03)
    elif ty == 'slash':                                 # o golpe: "o corte" da assinatura + rachadura
        mix.place('sfx', imp(1.8, 1.0), t, 0.42)
        sig_cut(mix, t, 1.0, 1, big=True)
        mix.place('sfx', crackle(0.5), t, 0.3, -0.1)
        mix.place('send', crackle(0.5), t, 0.1)
    elif ty == 'burst':                                 # o vidro se espalha + NÃO. grave
        mix.place('sfx', shatter(0.9, 30), t, 0.13)
        mix.place('send', shatter(0.9, 30), t, 0.05)
        mix.place('sfx', filt(impact(1.6, 1.3), 40, 'high'), t, 0.32)
        mix.place(DR, kk(), t, 0.45)
    elif ty == 'gather':                                # as peças se organizam
        mix.place_pan('sfx', whoosh(d, 600, 3000, 0.6, 1.3), t, 0.05, 0.5, -0.5)
    elif ty == 'rise':                                  # o celular sobe
        mix.place('sfx', whoosh(d, 200, 2400, 0.55, 1.2), t, 0.12)
    elif ty == 'header':
        mix.place('sfx', pop(640, 0.1), t, 0.08)
        mix.place('sfx', blip(midi(91), 0.07), t + 0.02, 0.04)
    elif ty == 'form':                                  # 3 peças viram o bloco
        mix.place('sfx', glass(midi(DROP_N[k] + 12), 0.5, 0.8), t, 0.06, 0.2)
        mix.place('sfx', swell(reverse(glass(midi(DROP_N[k] + 24), 0.4)), 0.25), t - 0.2, 0.03)
    elif ty == 'fall':                                  # a queda: sopro que desce
        mix.place('sfx', whoosh(d, 3000, 600, 0.75, 1.2), t, 0.06)
    elif ty == 'drop':                                  # pouso: batida grave + bloco afinado (notas sobem)
        mix.place(DR, kk(), t, 0.42)
        mix.place('sfx', block(midi(DROP_N[k]), 0.35), t, 0.24, 0.15)
        mix.place('sfx', glass(midi(DROP_N[k] + 12), 0.6), t + 0.01, 0.06)
        mix.place('send', block(midi(DROP_N[k]), 0.35), t, 0.06)
        mix.place('sfx', tick(3600, 0.03), t, 0.08)
    elif ty == 'night':                                 # a tela apaga
        mix.place('sfx', tick(1400, 0.04), t, 0.12)
        mix.place('sfx', whoosh(0.8, 2400, 300, 0.3, 1.0), t, 0.06)
    elif ty == 'clock':                                 # 22:59 -> 23:00
        for j in range(3):
            mix.place('sfx', woodtick(2600, 0.04), t - 0.3 + j * 0.1, 0.06)
    elif ty == 'notif':                                 # "Consulta pelo site"
        mix.place('sfx', notif_tone(), t, 0.24)
        mix.place('send', notif_tone(), t, 0.08)
        mix.place('sfx', tick(4800, 0.02), t, 0.06)
    elif ty == 'morning':                               # amanhece
        mix.place('sfx', swell(riser(d, 300, 3600), d, 0.0), t, 0.06)
        mix.place('sfx', sparkle(1.4, 8, 92, 104, 0.6, 3), t + 0.3, 0.05)
    elif ty == 'clockroll':                             # 23:00 -> 07:00: o relógio rola
        n = 14
        for j in range(n):
            tj = t + d * (0.5 - 0.5 * np.cos(np.pi * j / (n - 1)))
            mix.place('sfx', woodtick(2000 + 600 * (j % 2), 0.04), tj, 0.05, 0.3 * np.sin(j))
    elif ty == 'tap':
        mix.place('sfx', tap(midi(92)), t, 0.22, 0.1)
        mix.place('send', tap(midi(92)), t, 0.04)
    elif ty == 'switch':                                # troca de tela
        mix.place_pan('sfx', whoosh(0.36, 400, 3800, 0.45, 1.2), t, 0.08, 0.5, -0.5)
    elif ty == 'typing':                                # digitando…
        r = np.random.default_rng(5)
        tj = t + 0.12
        while tj < t + d - 0.05:
            mix.place('sfx', click(r.uniform(2800, 4200), 0.02), tj, 0.07, r.uniform(-0.2, 0.2))
            tj += S16 * r.choice([1, 1, 2])
    elif ty == 'sent':                                  # enviado: dois tons que sobem
        mix.place('sfx', tick(5200, 0.02), t, 0.14, 0.15)
        mix.place('sfx', blip(midi(92), 0.12), t, 0.26, 0.15)
        mix.place('sfx', blip(midi(99), 0.16), t + 0.12, 0.17, 0.15)
        mix.place('send', glass(midi(99), 0.7), t + 0.12, 0.05)
        mix.place('sfx', whoosh(0.28, 900, 5200, 0.6, 1.4), t + 0.04, 0.035)
    elif ty == 'crack':                                 # NÃO É LUXO.: a rachadura de novo, pequena
        mix.place('sfx', crackle(0.4), t, 0.12, 0.2)
    elif ty == 'hit':                                   # É SER ENCONTRADA.
        mix.place('sfx', imp(2.0, 1.0), t, 0.42)
        mix.place('send', imp(2.0, 1.0), t, 0.12)
        mix.place(DR, kk(), t, 0.5)
        mix.place(DR, clap(), t, 0.4)
        mix.place('sfx', crash(1.8), t, 0.1)
        for j, n in enumerate([80, 87, 92]):            # "ping" de ser encontrada
            mix.place('sfx', bell(midi(n), 1.0), t + j * 0.08, 0.06, -0.3 + 0.3 * j)
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

LEVELS = {'music': 0.82, 'drums': 0.72, 'drums_fx': 0.72, 'sfx': 1.0}


def cama(m):
    out = m.render(levels=LEVELS, reverb={'send': 0.55, 'sfx': 0.1, 'music': 0.12})
    # respiro antes dos golpes principais: 60 ms em -14 dB
    g = np.ones(out.shape[1])
    for c in CUES:
        if c['type'] in ('slash', 'hit', 'logo'):
            i1 = int(c['t'] * SR)
            i0, i_ = i1 - int(0.075 * SR), i1 - int(0.06 * SR)
            g[i0:i_] = np.minimum(g[i0:i_], np.linspace(1, 0.2, i_ - i0))
            g[i_:i1 - 192] = np.minimum(g[i_:i1 - 192], 0.2)
            g[i1 - 192:i1] = np.minimum(g[i1 - 192:i1], np.linspace(0.2, 1, 192))
    out = out * g
    out = filt(out, 28, 'high')
    return out - 0.4 * filt(out, 70, 'low') + 0.25 * filt(out, [500, 1500], 'band') + 0.3 * filt(out, [1500, 6000], 'band')


if not VOZ:
    master(cama(mix), os.path.join(ROOT, 'audio', 'trilha.wav'), ceiling_db=-3.3)   # folga para o AAC nos golpes
else:
    # narração: a trilha abaixa sob a voz e volta nos respiros; os golpes ficam, sem cobrir palavras
    import copy
    import voz
    v = voz.trilha_da_voz(mix.N)
    cheia = cama(copy.deepcopy(mix))
    g_trilha = voz.abaixa_sob_a_voz(mix, v)
    base = cama(mix)
    alvo = measure_lufs(cheia.T) + voz.VOZ_ACIMA
    total, vm = voz.soma_voz(base, v, alvo, measure_lufs)
    cob = voz.cobertura(base, vm)
    pior = min(cob, key=lambda w: w[2])
    print(f'voz: {alvo:.1f} LUFS (trilha cheia {alvo - voz.VOZ_ACIMA:.1f}) · trilha sob a voz {20 * np.log10(g_trilha.min()):.1f} dB')
    print(f'cobertura: {len(cob)} palavras, voz acima da cama (300 Hz–4 kHz) no mínimo {pior[2]:+.1f} dB ("{pior[1]}", {pior[3]:.2f} s)')
    for w in sorted(cob, key=lambda w: w[2])[:6]:
        print(f'   {w[2]:+5.1f} dB  {w[3]:6.2f} s  {w[0]:11} {w[1]}')
    json.dump({'voz_lufs_pre_master': round(alvo, 2), 'trilha_sob_a_voz_db': round(20 * np.log10(g_trilha.min()), 2),
               'cobertura_db': [{'fala': w[0], 'palavra': w[1], 't': w[3], 'db': w[2]} for w in cob]},
              open(os.path.join(ROOT, 'audio', 'voz', 'mix.json'), 'w'), ensure_ascii=False, indent=1)
    master(total, os.path.join(ROOT, 'audio', 'trilha-voz.wav'), ceiling_db=-3.3, fade_out=0.25)
