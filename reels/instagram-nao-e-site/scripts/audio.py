#!/usr/bin/env python3
"""
Trilha + efeitos do FAZLO Digital "Instagram não é site" — 100% sintetizados.

100 BPM (1 tempo = 0,6 s), Lá bemol maior; a espera cai para Fá menor.

  gancho     arpejo de vidro leve; em "E AGORA?" a música para (só o "digitando…")
  perguntas  groove leve (bumbo, palmas, chimbal, baixo, piano FM); cada balão
             chega com um "ping" de mensagem
  espera     a música trava (fita parando), sobra o tique-taque do relógio e um
             pad grave; uma subida prepara a virada
  virada     "o corte" da assinatura da marca quando a barra lima varre; o groove
             volta mais claro; cada balão voa (sopro) e encaixa (bloco afinado que
             sobe: Lá bemol, Dó, Mi bemol, Lá bemol); seletor de período, dia 20,
             "Consultar disponibilidade" e o toque em Reservar têm som de interface
  síntese    impacto e o acorde abre
  fechamento a assinatura completa (varredura + Lá bemol 5 -> Mi bemol 6) na logo

    python3 reels/instagram-nao-e-site/scripts/audio.py   -> audio/trilha.wav (48 kHz, estéreo, -14 LUFS)
"""
import os
import sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, '..', '..', 'tools', 'audio'))
from fzaudio import *  # noqa: E402,F403
from fzbrand import sig_cut, sig_motif  # noqa: E402

seed(404)
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
R = np.random.default_rng(11)


def bar(n, beats=0.0):
    return (n - 1) * BAR + beats * BT


# ------------------------------------------------------------------ harmonia
CH = {
    'Abmaj9': [56, 60, 63, 67, 70], 'Fm9': [53, 56, 60, 63, 67], 'Dbmaj9': [53, 56, 60, 61, 65],
    'Ebsus': [51, 56, 58, 63, 65], 'Fmadd9': [53, 56, 60, 67],
}
ROOT_N = {'Abmaj9': 44, 'Fm9': 41, 'Dbmaj9': 49, 'Ebsus': 51, 'Fmadd9': 41}


# ------------------------------------------------------------------ timbres
def env_on(t, a=0.003):
    return np.minimum(1, t / a)


def glass(f, d=0.5, vel=1.0):
    t = tt(d)
    idx = 1.2 * vel * np.exp(-t / 0.07)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 2.0 * t)) + 0.25 * np.sin(2 * np.pi * f * 4.07 * t) * np.exp(-t / 0.04)
    return s * np.exp(-t / 0.3) * env_on(t, 0.002) * vel


def epiano(notes, d, bright=1.0):
    """Piano elétrico FM (razão 1, índice que cai): acordes curtos do groove."""
    t = tt(d)
    s = np.zeros(len(t))
    for n in notes:
        f = midi(n)
        s += np.sin(2 * np.pi * f * t + 1.4 * bright * np.exp(-t / 0.12) * np.sin(2 * np.pi * f * t)) * np.exp(-t / 0.55)
    return s / len(notes) * env_on(t, 0.003) * np.clip((d - t) / 0.05, 0, 1)


def block(f, d=0.3):
    t = tt(d)
    return np.sin(2 * np.pi * f * t + 2.0 * np.exp(-t / 0.025) * np.sin(2 * np.pi * f * 1.41 * t)) * np.exp(-t / 0.1) * env_on(t, 0.0015)


def ping(f1, f2, gap=0.045):
    """Notificação de mensagem: dois toques curtos e limpos."""
    a = np.sin(2 * np.pi * f1 * tt(0.25)) * np.exp(-tt(0.25) / 0.06) * env_on(tt(0.25), 0.002)
    b2 = np.sin(2 * np.pi * f2 * tt(0.4)) * np.exp(-tt(0.4) / 0.1) * env_on(tt(0.4), 0.002)
    out = np.zeros(int((gap + 0.4) * SR))
    out[:len(a)] += a
    i = int(gap * SR)
    out[i:i + len(b2)] += b2
    return out


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


def tape_stop(d=0.5, f0=600):
    """A música "trava": um tom que despenca de altura, como fita parando."""
    t = tt(d)
    f = f0 * (1 - 0.85 * (t / d) ** 0.7)
    return np.tanh(2 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * (1 - t / d) * env_on(t, 0.003)


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
        mix.place('drums', clap(), bar(n, b), 0.38 * g, 0.05)
        mix.place('send', clap(), bar(n, b), 0.08 * g)
    if hats:
        for k in range(8):
            mix.place('drums', hat(False), bar(n) + k * E8, (0.09 if k % 2 else 0.05) * g, 0.25 if k % 2 else -0.2)
    for b, dur in bass:
        mix.place('music', reese(ROOT_N[ch], dur * BT * 0.95), bar(n, b), 0.28 * g)
    for b in keys:
        mix.place('music', epiano(CH[ch], 0.7), bar(n, b), 0.16 * g, 0.15)


# --- gancho (c.1–c.2): vidro leve; em "E AGORA?" a música para
arp(0.0, 3.0, 'Abmaj9', 0.11)
mix.place('music', stereo_pad(CH['Abmaj9'], 2.6, 1900, 0.3, 0.4), 0.0, 0.15)
mix.place('music', stereo_pad(CH['Fm9'], 0.8, 1900, 0.1, 0.3), 2.4, 0.14)
for b in (0, 1, 2, 3):
    mix.place('drums', kk(), bar(1, b), 0.22 if b % 2 == 0 else 0.14)
# --- perguntas (c.3–c.5) com anacruse no fim do c.2
for k in range(4):
    mix.place('drums', hat(False), bar(2, 3) + k * S16, 0.04 + 0.02 * k, 0.2)
for n, ch in ((3, 'Dbmaj9'), (4, 'Ebsus'), (5, 'Abmaj9')):
    groove(n, ch)
    arp(bar(n), bar(n + 1), ch, 0.05, step=S16 * 2, pat=(0, 2, 4, 3))
    mix.place('music', stereo_pad(CH[ch], BAR + 0.3, 1800, 0.2, 0.4), bar(n), 0.08)
# --- espera (c.6–c.7): Fá menor, sem groove; o relógio marca o tempo
mix.place('music', stereo_pad(CH['Fmadd9'], 2 * BAR - 0.4, 1500, 0.6, 0.8), SEC['espera'] + 0.15, 0.2)
mix.place('music', stereo_pad([x + 12 for x in CH['Fmadd9'][1:]], 2 * BAR - 0.4, 2400, 1.2, 0.8) * 0.6, SEC['espera'] + 0.15, 0.12)
mix.place('music', reese(41, 2 * BAR - 0.6, 700) * 0.8, SEC['espera'] + 0.15, 0.12)
for k in range(8):                                            # pulso abafado
    mix.place('drums', filt(kk(), 400, 'low'), SEC['espera'] + 0.3 + k * BT, 0.14)
# --- virada (c.8–c.11): o groove volta mais claro
for n, ch in ((8, 'Abmaj9'), (9, 'Dbmaj9'), (10, 'Fm9'), (11, 'Ebsus')):
    groove(n, ch, kicks=(0, 1, 2, 3) if n > 8 else (0, 2.5), claps=(1, 3))
    arp(bar(n), bar(n + 1), ch, 0.055, step=S16 * 2, pat=(0, 2, 4, 1, 3, 2, 4, 3))
    mix.place('music', stereo_pad(CH[ch], BAR + 0.3, 2400, 0.15, 0.4), bar(n), 0.09)
# --- c.12–c.13: síntese, preparação da logo
for n, ch in ((12, 'Abmaj9'),):
    groove(n, ch, kicks=(0, 2.5), claps=(1, 3))
    arp(bar(n), bar(n + 1), ch, 0.05)
mix.place('music', stereo_pad(CH['Dbmaj9'], 1.3, 2200, 0.1, 0.3), bar(13), 0.12)
mix.place('music', stereo_pad(CH['Ebsus'], 0.7, 2600, 0.08, 0.2), bar(13, 2), 0.14)
mix.place('music', reese(49, 1.15), bar(13), 0.25)
mix.place('music', reese(51, 0.55), bar(13, 2), 0.25)
for b in (0, 1, 1.5):
    mix.place('drums', kk(), bar(13, b), 0.42)
# --- fechamento: Lá bemol maior
L = DUR - SEC['fecho']
mix.place('music', stereo_pad(CH['Abmaj9'], L, 2600, 0.06, 1.4), SEC['fecho'], 0.24)
mix.place('music', stereo_pad([x + 12 for x in CH['Abmaj9'][1:]], L, 3600, 0.4, 1.4) * 0.5, SEC['fecho'], 0.14)
mix.place('music', reese(44, 2.6), SEC['fecho'], 0.3)
arp(SEC['fecho'] + 0.6, DUR - 0.3, 'Abmaj9', 0.05, step=E8)


# ------------------------------------------------------------------ efeitos (a partir dos cues)
DOCK_NOTES = [80, 84, 87, 92]          # Lá bemol, Dó, Mi bemol, Lá bemol


def fx(c):
    ty, t = c['type'], c['t']
    d = c.get('d', 0.3)
    k = c.get('k', 0)
    if ty == 'open':
        mix.place('sfx', glass(midi(80), 0.8), t, 0.12)
        mix.place('sfx', filt(noise(0.4), [2000, 8000], 'band') * np.exp(-tt(0.4) / 0.05) * env_on(tt(0.4), 0.004), t, 0.08)
    elif ty == 'mark':                                 # o marca-texto lima
        mix.place_pan('sfx', whoosh(0.35, 800, 5000, 0.5, 1.4), t - 0.05, 0.1, -0.5, 0.5)
        mix.place('sfx', tick(4200), t + 0.38, 0.12)
    elif ty == 'lift':
        mix.place('sfx', swell(riser(0.46, 300, 2400), 0.4), t - 0.02, 0.14)
    elif ty == 'agora':                                # E AGORA? — impacto e a música para
        mix.place('sfx', imp(1.4, 0.8), t, 0.55)
        mix.place('sfx', glass(midi(87), 0.9) + glass(midi(80), 0.9) * 0.6, t, 0.12)
        for i in range(6):                             # "digitando…"
            mix.place('sfx', tick(3000 + 300 * (i % 3), 0.02), t + 0.3 + i * 0.1, 0.05, 0.3 * np.sin(i))
    elif ty == 'phone':
        mix.place('sfx', whoosh(0.6, 300, 3000, 0.4, 1.2), t, 0.16)
    elif ty == 'shimmer':
        for i in range(10):
            mix.place('sfx', glass(midi(92 + [0, 3, 7, 10][i % 4]), 0.3, 0.5), t + i * 0.06, 0.03, -0.6 + 0.12 * i)
    elif ty == 'bubble':                               # cada pergunta chega como mensagem
        f1, f2 = midi([84, 87, 84, 89][k]), midi([89, 92, 91, 96][k])
        mix.place('sfx', ping(f1, f2), t, 0.26, [-0.45, 0.45, -0.45, 0.45][k])
        mix.place('send', ping(f1, f2), t, 0.12)
        mix.place('sfx', tick(5200, 0.02), t, 0.08)
    elif ty == 'title':
        mix.place('sfx', whoosh(0.35, 500, 3500, 0.5, 1.4), t - 0.1, 0.08)
    elif ty == 'freeze':                               # ninguém responde: a música trava
        mix.place('sfx', tape_stop(0.55, 520), t - 0.02, 0.14)
    elif ty == 'clock':                                # tique-taque (cai no tempo da música)
        n = int(d / (BT / 2))
        for i in range(n):
            f = 3200 if i % 2 == 0 else 2400
            mix.place('sfx', tick(f, 0.03), t + 0.15 + i * BT / 2, 0.24 if i % 2 == 0 else 0.17, 0.25 if i % 2 else -0.25)
    elif ty == 'lift2':                                # sobe até a barra (termina antes do golpe)
        mix.place('sfx', swell(riser(0.66, 200, 3000), 0.6), t, 0.2)
        mix.place('sfx', swell(reverse(crash(0.9)), 0.6), t, 0.12)
    elif ty == 'slash':                                # a barra lima: "o corte" da assinatura
        mix.place('sfx', imp(1.8, 1.0), t, 0.55)
        sig_cut(mix, t, 1.0, 1, big=True)
    elif ty == 'fly':
        mix.place_pan('sfx', whoosh(d, 600, 3200, 0.45, 1.3), t, 0.1, 0.5, -0.5)
    elif ty == 'dock':                                 # encaixe: bloco afinado que sobe a cada pergunta
        mix.place('sfx', block(midi(DOCK_NOTES[k]), 0.35), t, 0.3, -0.3)
        mix.place('sfx', glass(midi(DOCK_NOTES[k] + 12), 0.6), t + 0.01, 0.08, -0.3)
        mix.place('sfx', tick(4800, 0.02), t, 0.1)
    elif ty == 'pickopen':
        mix.place('sfx', filt(noise(0.12), [1500, 6000], 'band') * np.exp(-tt(0.12) / 0.03) * env_on(tt(0.12), 0.003), t, 0.1)
        mix.place('sfx', blip(midi(91), 0.06), t + 0.02, 0.06)
    elif ty == 'day':                                  # o dia 20 acende
        mix.place('sfx', blip(midi(96), 0.08), t, 0.1)
        mix.place('sfx', glass(midi(99), 0.5), t + 0.01, 0.07)
    elif ty == 'pickclose':
        mix.place('sfx', blip(midi(84), 0.05), t, 0.05)
    elif ty == 'press':                                # Consultar disponibilidade
        mix.place('sfx', tick(2200, 0.04) * 1.2, t, 0.2)
        mix.place('sfx', glass(midi(87), 0.6) + glass(midi(91), 0.6) * 0.7, t + 0.08, 0.08)
    elif ty == 'tap':                                  # Reservar: clique e acorde de confirmação
        mix.place('sfx', tick(2000, 0.04) * 1.2, t, 0.22)
        for i, n in enumerate([80, 84, 87, 92]):
            mix.place('sfx', glass(midi(n), 0.9), t + 0.06 + i * 0.05, 0.07, -0.3 + 0.2 * i)
    elif ty == 'split':                                # síntese: Instagram | site
        mix.place('sfx', imp(1.6, 0.8), t, 0.45)
        mix.place_pan('sfx', whoosh(0.5, 2500, 400, 0.4, 1.2), t, 0.12, -0.6, 0.6)
    elif ty == 'logo':                                 # assinatura completa
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
    if c['type'] in ('agora', 'slash', 'logo'):
        i1 = int(c['t'] * SR)
        i0, i_ = i1 - int(0.075 * SR), i1 - int(0.06 * SR)
        g[i0:i_] = np.minimum(g[i0:i_], np.linspace(1, 0.2, i_ - i0))
        g[i_:i1 - 192] = np.minimum(g[i_:i1 - 192], 0.2)
        g[i1 - 192:i1] = np.minimum(g[i1 - 192:i1], np.linspace(0.2, 1, 192))
out = out * g
out = filt(out, 28, 'high')
out = out - 0.4 * filt(out, 70, 'low') + 0.25 * filt(out, [500, 1500], 'band') + 0.3 * filt(out, [1500, 6000], 'band')
master(out, os.path.join(ROOT, 'audio', 'trilha.wav'), ceiling_db=-3.3)   # folga para o AAC nos golpes
