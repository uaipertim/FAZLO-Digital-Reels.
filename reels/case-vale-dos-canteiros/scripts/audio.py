#!/usr/bin/env python3
"""
Trilha + efeitos do FAZLO Digital "Conheça o site da Pousada Vale dos Canteiros" — 100% sintetizados.

Mesma paleta dos Reels anteriores: 100 BPM (1 tempo = 0,6 s), Lá bemol maior, assinatura sonora
da marca ("o corte" e o motivo Lá bemol 5 -> Mi bemol 6).

  gancho      pad e vidro esparsos enquanto o celular sobe; "o corte" em SITE NOVO NO AR. (2,4 s)
              e o groove entra leve
  a consulta  groove leve, com espaço para os toques: cada toque é um clique macio afinado, em
              notas que sobem pelo formulário (Entrada -> ... -> Enviar); folhas do site com sopro;
              etiquetas preenchidas com sino; troca de app e "mensagem enviada" (dois tons)
  chalés ...  groove completo e arpejo; rolagens com sopro; cada destaque acende com um bloco
  como chegar o pino do mapa com um "ping" suave
  assinatura  meio-tempo e subida no zoom do rodapé; respiro antes da logo
  CTA         a assinatura completa na logo; Lá bemol maior

    python3 reels/case-vale-dos-canteiros/scripts/audio.py   -> audio/trilha.wav (48 kHz, estéreo, -14 LUFS)
"""
import os
import sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, '..', '..', 'tools', 'audio'))
from fzaudio import *  # noqa: E402,F403
from fzbrand import sig_cut, sig_motif  # noqa: E402

seed(808)
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
# nota de cada toque: sobe pelo formulário até "Enviar"
TAP_N = {'entrada': 80, 'proximo': 82, 'dia5': 84, 'dia8': 87, 'crianca': 89, 'acomod': 92, 'chale': 94, 'enviar': 96,
         'send': 99, 'ver': 87, 'fora': 80, 'menu': 84, 'reservar': 89, 'fechar': 80}


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


def ping(f, d=0.9):
    """'Ping' de localização: seno com leve vibrato e cauda longa."""
    t = tt(d)
    return np.sin(2 * np.pi * f * t + 0.6 * np.sin(2 * np.pi * 6 * t) * (t / d)) * np.exp(-t / 0.28) * env_on(t, 0.004)


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


# --- gancho (c.1): pad e vidro esparsos enquanto o celular sobe; "o corte" no c.2 (2,4 s)
mix.place('music', stereo_pad(CH['Abmaj9'], 2.35, 1700, 0.3, 0.5), 0.0, 0.15)
for i, n in enumerate([80, 87, 84, 92]):
    mix.place('music', glass(midi(n), 0.7, 0.8), i * BT, 0.07, -0.4 + 0.25 * i)
for b in (0, 1, 2, 3):
    mix.place('drums', filt(kk(), 500, 'low'), bar(1, b), 0.16)
for k in range(4):
    mix.place('drums', hat(False), bar(1, 3) + k * S16, 0.03 + 0.015 * k, 0.2)
# --- SITE NO AR + a consulta (c.2–c.6): groove leve, deixa espaço para os toques
for n, ch in ((2, 'Abmaj9'), (3, 'Fm9'), (4, 'Dbmaj9'), (5, 'Ebsus'), (6, 'Abmaj9')):
    groove(n, ch, g=0.7, keys=(0, 2.5))
    mix.place('music', stereo_pad(CH[ch], BAR + 0.3, 1800, 0.2, 0.4), bar(n), 0.08)
# --- chalés, passeios, day use, como chegar (c.7–c.12): groove completo e arpejo
for n, ch in ((7, 'Fm9'), (8, 'Dbmaj9'), (9, 'Abmaj9'), (10, 'Fm9'), (11, 'Dbmaj9'), (12, 'Ebsus')):
    groove(n, ch, kicks=(0, 1, 2, 2.5, 3) if n in (9, 11) else (0, 1, 2, 3))
    arp(bar(n), bar(n + 1), ch, 0.045, step=S16 * 2, pat=(0, 2, 4, 1, 3, 2, 4, 3))
    mix.place('music', stereo_pad(CH[ch], BAR + 0.3, 2400, 0.12, 0.4), bar(n), 0.09)
mix.place('sfx', swell(reverse(crash(1.0)), 0.6), bar(7) - 0.6, 0.08)
# --- assinatura (c.13–c.14, meio): meio-tempo e subida no zoom do rodapé
for b in (0, 2.5):
    mix.place('drums', kk(), bar(13, b), 0.45)
mix.place('drums', snare(0.3), bar(13, 2), 0.24)
for k in range(8):
    mix.place('drums', hat(False), bar(13) + k * E8, 0.06 if k % 2 else 0.035, 0.2 if k % 2 else -0.2)
mix.place('music', reese(ROOT_N['Bbm9'], BAR * 0.95, 650), bar(13), 0.22)
mix.place('music', stereo_pad(CH['Bbm9'], BAR + 0.3, 1600, 0.3, 0.4), bar(13), 0.1)
for b in (0, 1.5, 3):
    mix.place('music', epiano(CH['Bbm9'], 0.6, 0.8), bar(13, b), 0.12, -0.15)
mix.place('music', stereo_pad(CH['Ebsus'], 1.25, 2200, 0.3, 0.3), bar(14), 0.11)
for k in range(8):
    mix.place('drums', hat(False), bar(14) + k * S16 * 1.0, 0.03 + 0.012 * k, 0.2 if k % 2 else -0.2)
mix.place('sfx', swell(riser(2.4, 200, 3400), 2.4), SEC['cta'] - 2.4, 0.16)
mix.place('sfx', swell(reverse(crash(1.0)), 0.85), SEC['cta'] - 0.85, 0.12)
# --- CTA: Lá bemol maior
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
    elif ty == 'rise':                                  # o celular sobe
        mix.place('sfx', whoosh(d, 200, 2400, 0.55, 1.2), t, 0.12)
    elif ty == 'slide':                                 # o carrossel do site troca de foto
        mix.place('sfx', glass(midi(92), 0.6, 0.6), t, 0.05, 0.3)
    elif ty == 'slash':                                 # SITE NOVO NO AR.: "o corte" da assinatura
        mix.place('sfx', imp(1.8, 1.0), t, 0.5)
        sig_cut(mix, t, 1.0, 1, big=True)
    elif ty == 'pop':                                   # a barra de endereço
        mix.place('sfx', pop(640, 0.1), t, 0.1)
        mix.place('sfx', blip(midi(91), 0.07), t + 0.02, 0.05)
    elif ty == 'title':
        mix.place('sfx', whoosh(0.35, 500, 3500, 0.5, 1.4), max(0.0, t - 0.1), 0.07)
    elif ty == 'swish':                                 # rolagem: sopro do tamanho do gesto
        mix.place_pan('sfx', whoosh(max(0.3, d), 300, 2600, 0.35, 1.1), t, 0.07 + 0.03 * min(1.0, d), 0.25, -0.25)
    elif ty == 'tap':                                   # toque na tela, afinado
        f = midi(TAP_N.get(c.get('name'), 84))
        g = 0.3 if c.get('name') == 'enviar' else 0.2
        mix.place('sfx', tap(f), t, g, 0.1)
        mix.place('send', tap(f), t, 0.04)
        if c.get('name') == 'enviar':
            mix.place('sfx', block(midi(84), 0.3), t, 0.12)
    elif ty == 'sendtap':
        mix.place('sfx', tap(midi(TAP_N['send'])), t, 0.22, 0.2)
    elif ty == 'sent':                                  # mensagem enviada: dois tons que sobem
        mix.place('sfx', tick(5200, 0.02), t, 0.14, 0.15)
        mix.place('sfx', blip(midi(92), 0.12), t, 0.26, 0.15)
        mix.place('sfx', blip(midi(99), 0.16), t + 0.12, 0.17, 0.15)
        mix.place('send', glass(midi(99), 0.7), t + 0.12, 0.05)
        mix.place('sfx', whoosh(0.28, 900, 5200, 0.6, 1.4), t + 0.04, 0.035)
    elif ty == 'sheet':                                 # folha do site (calendário, lista) sobe ou desce
        f0, f1 = (300, 2200) if c.get('dir', 1) > 0 else (2200, 300)
        mix.place('sfx', whoosh(0.3, f0, f1, 0.5, 1.2), t, 0.08)
    elif ty == 'chip':                                  # etiqueta preenchida
        f = midi([87, 91, 94][k % 3])
        mix.place('sfx', bell(f, 0.9), t, 0.09, [-0.35, 0.35, 0][k % 3])
        mix.place('send', bell(f, 0.9), t, 0.05)
    elif ty == 'switch':                                # troca de app (site <-> conversa)
        mix.place_pan('sfx', whoosh(0.36, 400, 3800, 0.45, 1.2), t, 0.1, 0.5, -0.5)
    elif ty == 'modal':
        mix.place('sfx', filt(noise(0.14), [1500, 6000], 'band') * np.exp(-tt(0.14) / 0.035) * env_on(tt(0.14), 0.003), t, 0.08)
        mix.place('sfx', blip(midi(91), 0.06), t + 0.02, 0.05)
    elif ty == 'modalclose':
        mix.place('sfx', blip(midi(84), 0.05), t, 0.05)
    elif ty == 'ring':                                  # destaque acende: bloco afinado, a escala sobe
        f = midi(PENTA[k % len(PENTA)])
        mix.place('sfx', block(f, 0.35), t, 0.2, 0.25 * np.sin(k))
        mix.place('sfx', glass(midi(PENTA[k % len(PENTA)] + 12), 0.6), t + 0.01, 0.05)
    elif ty == 'pin':
        mix.place('sfx', ping(midi(87), 0.9), t, 0.1)
        mix.place('send', ping(midi(87), 0.9), t, 0.05)
    elif ty == 'section':                               # cada seção nova: uma nota acima
        mix.place('sfx', glass(midi(PENTA[2 + k]), 0.7, 0.7), t, 0.05, -0.2)
    elif ty == 'zoom':
        mix.place('sfx', whoosh(d, 300, 4200, 0.7, 1.3), t, 0.12)
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

out = mix.render(levels={'music': 0.82, 'drums': 0.72, 'sfx': 1.0}, reverb={'send': 0.55, 'sfx': 0.1, 'music': 0.12})
# respiro antes dos golpes principais: 60 ms em -14 dB
g = np.ones(out.shape[1])
for c in CUES:
    if c['type'] in ('slash', 'logo'):
        i1 = int(c['t'] * SR)
        i0, i_ = i1 - int(0.075 * SR), i1 - int(0.06 * SR)
        g[i0:i_] = np.minimum(g[i0:i_], np.linspace(1, 0.2, i_ - i0))
        g[i_:i1 - 192] = np.minimum(g[i_:i1 - 192], 0.2)
        g[i1 - 192:i1] = np.minimum(g[i1 - 192:i1], np.linspace(0.2, 1, 192))
out = out * g
out = filt(out, 28, 'high')
out = out - 0.4 * filt(out, 70, 'low') + 0.25 * filt(out, [500, 1500], 'band') + 0.3 * filt(out, [1500, 6000], 'band')
master(out, os.path.join(ROOT, 'audio', 'trilha.wav'), ceiling_db=-3.3)   # folga para o AAC nos golpes
