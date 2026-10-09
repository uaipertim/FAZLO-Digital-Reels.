#!/usr/bin/env python3
"""
Trilha + efeitos do FAZLO Digital Reel 003 "Ideias que ganham forma" — 100%
sintetizados, sem samples.

112 BPM, Si bemol menor -> Ré bemol maior (o acorde final contém Lá bemol e
Mi bemol, as duas notas da assinatura da marca).

O som segue os três estados da matéria:
  LÍQUIDO  gotas afinadas (a frequência sobe no ataque, como uma gota real),
           bolhas, vidro FM, deslizes "gosmentos";
  PROJETO  bipes senoidais e ticks digitais, precisos, no tempo;
  SÓLIDO   impactos com subgrave contido, blocos afinados e ressonâncias de
           cristal (parciais inarmônicos) quando o líquido congela.

  c.1  gênese        pulso grave como um coração; as gotas são notas (Fá, Lá bemol, Ré bemol)
  c.2  IDEIA         o pad abre e um arpejo de vidro nasce com a palavra
  c.3  potencial     o estouro: bateria em meio-tempo, baixo, arpejo girando
  c.4  projeto       bipes do desenho técnico, subida com rufar e filtro abrindo
  c.5  FORMA         o golpe: cristal + impacto; groove completo
  c.6  SITES         8 blocos afinados sobem com as camadas
  c.7  EXPERIÊNCIAS  o groove fica fluido: meio-tempo, vidro em semicolcheias
  c.8  SOLUÇÕES      percussão modular: cada peça encaixa com um bloco afinado
  c.9  propósito     três golpes: bipes (linhas), trava (sólido), respingo
  c.10 a barra       a bateria sai; "o corte" da assinatura quando a barra surge
  c.11 a marca       Ré bemol maior e a assinatura completa na revelação da logo
  c.12 endereço      cauda: pad, arpejo e pings de sonar com as ondas da aura

    python3 reels/reel-03/scripts/audio.py   -> audio/trilha.wav (48 kHz, estéreo, -14 LUFS)
"""
import os
import sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, '..', '..', 'tools', 'audio'))
from fzaudio import *  # noqa: E402,F403
from fzbrand import sig_cut, sig_motif  # noqa: E402

seed(3003)
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
R = np.random.default_rng(7)


def bar(n, beats=0.0):
    return (n - 1) * BAR + beats * BT


# ------------------------------------------------------------------ harmonia
CH = {
    'Bbm9': [58, 61, 65, 68, 72], 'Gbmaj7': [54, 58, 61, 65, 68], 'Absus': [56, 61, 63, 68, 70],
    'Dbmaj9': [56, 60, 61, 63, 65], 'Ebm9': [58, 61, 63, 65, 66], 'DbF': [53, 56, 61, 65, 68],
}
ROOT_N = {'Bbm9': 46, 'Gbmaj7': 42, 'Absus': 44, 'Dbmaj9': 49, 'Ebm9': 51, 'DbF': 41}
PROG = {1: 'Bbm9', 2: 'Bbm9', 3: 'Gbmaj7', 4: 'Absus', 5: 'Bbm9', 6: 'Gbmaj7', 7: 'DbF', 8: 'Ebm9', 9: 'Gbmaj7', 10: 'Bbm9', 11: 'Dbmaj9', 12: 'Dbmaj9'}


# ------------------------------------------------------------------ timbres
def env_on(t, a=0.003):
    return np.minimum(1, t / a)


def glass(f, d=0.6, vel=1.0):
    """Vidro FM: razão 2 com um parcial inarmônico curto (o "tim" do vidro)."""
    t = tt(d)
    idx = 1.3 * vel * np.exp(-t / 0.08)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 2.0 * t)) + 0.3 * np.sin(2 * np.pi * f * 4.07 * t) * np.exp(-t / 0.05)
    return s * np.exp(-t / 0.34) * env_on(t, 0.002) * vel


def bloop(f, d=0.24):
    """Gota d'água: a frequência sobe no ataque (a bolha que se fecha)."""
    t = tt(d)
    fr = f * (1 + 0.85 * (1 - np.exp(-t / 0.016)))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.07) * env_on(t, 0.0015)


def bubbles(d, n, f0, f1, seed_=0):
    r = np.random.default_rng(seed_)
    out = np.zeros(int(d * SR) + int(0.3 * SR))
    for _ in range(n):
        i = int(r.uniform(0, d) * SR)
        b = bloop(r.uniform(f0, f1), r.uniform(0.06, 0.16)) * r.uniform(0.3, 1.0)
        out[i:i + len(b)] += b[: len(out) - i]
    return out


def bubbles2(d, n, f0, f1, seed_=0):
    return np.stack([bubbles(d, n, f0, f1, seed_), bubbles(d, n, f0, f1, seed_ + 1000)])


def crystal(f, d=2.4):
    """Cristal/placa: parciais inarmônicos com batimento; o som do líquido congelando."""
    t = tt(d)
    s = np.zeros(len(t))
    for ratio, amp, dec in [(1.0, 1.0, 1.0), (2.76, 0.55, 0.6), (5.40, 0.35, 0.4), (8.93, 0.22, 0.28), (13.34, 0.12, 0.18)]:
        s += amp * (np.sin(2 * np.pi * f * ratio * t) + 0.6 * np.sin(2 * np.pi * f * ratio * 1.0035 * t)) * np.exp(-t / (d * 0.35 * dec))
    return s / 2.2 * env_on(t, 0.002)


def block(f, d=0.28):
    """Bloco afinado (madeira/metal): FM de razão 1,41 com índice que cai rápido."""
    t = tt(d)
    return np.sin(2 * np.pi * f * t + 2.2 * np.exp(-t / 0.025) * np.sin(2 * np.pi * f * 1.41 * t)) * np.exp(-t / 0.09) * env_on(t, 0.0015)


def reese(n, d, bright=900):
    """Baixo: duas serras desafinadas + seno, saturado; vive nos harmônicos (celular)."""
    t = tt(d)
    f = midi(n)
    s = saw(f * 0.997, t, bright) + saw(f * 1.004, t, bright) + 0.9 * np.sin(2 * np.pi * f * t)
    s = np.tanh(1.6 * s) * 0.6
    s = filt(s, 40, 'high')
    return s * env_on(t, 0.004) * np.clip((d - t) / 0.03, 0, 1) * np.exp(-t / 1.2)


def imp(d=2.0, big=1.0):
    """Impacto para celular: sub contido + corpo + ar, tudo com ataque de 3 ms (sem pré-eco no AAC)."""
    t = tt(d)
    on = env_on(t, 0.003)
    body = filt(noise(d), [90, 1400], 'band') * np.exp(-t / 0.12) * 1.4
    air = filt(noise(d), 4000, 'high') * np.exp(-t / 0.05) * 0.3
    return (filt(impact(d, big), 45, 'high') * 0.7 + body + air) * on


def gloop(d, f0, f1):
    """Deslize líquido: seno com vibrato + ruído no formante, de f0 a f1."""
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d) * (1 + 0.03 * np.sin(2 * np.pi * 9 * t))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + sweep(noise(d), f0 * 1.5, f1 * 1.5, 3.0) * 0.5
    return s * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.7


def shimmer(d, f0=2000, f1=9000, n=40, seed_=1):
    """Brilho granular: grãos de seno agudos espalhados (o brilho que varre, a condensação)."""
    r = np.random.default_rng(seed_)
    out = np.zeros((2, int(d * SR) + int(0.2 * SR)))
    for k in range(n):
        i = int(r.uniform(0, d) * SR)
        f = f0 * (f1 / f0) ** (k / n) * r.uniform(0.95, 1.05)
        g = sine(f, 0.12) * np.exp(-tt(0.12) / 0.03) * env_on(tt(0.12), 0.002)
        p = r.uniform(-1, 1)
        out[0, i:i + len(g)] += g * np.sqrt((1 - p) / 2)
        out[1, i:i + len(g)] += g * np.sqrt((1 + p) / 2)
    return out


def swell(x, d, gap=0.06):
    """Som invertido que cresce até o golpe e termina `gap` s antes dele (o golpe entra no vazio)."""
    n = max(1, int((d - gap) * SR))
    y = x[-int(d * SR):][:n].copy()
    y[-int(0.008 * SR):] *= np.linspace(1, 0, int(0.008 * SR))
    return y


def kk():
    return filt(kick(0.42, 1.1, 54), 45, 'high') * env_on(tt(0.42), 0.002)


# ------------------------------------------------------------------ partes
def stereo_pad(notes, d, bright, att, rel):
    a, b = pad(notes, d, bright=bright, att=att, rel=rel), pad(notes, d, bright=bright, att=att, rel=rel)
    m, sd = (a + b) / 2, (a - b) / 2                  # largura contida: soma em mono sem perder corpo
    return filt(np.stack([m + 0.7 * sd, m - 0.7 * sd]), 150, 'high')


def pad_bar(n, g, bright=1600, att=0.3, beats=4.0, ch=None, start=0.0):
    mix.place('music', stereo_pad(CH[ch or PROG[n]], beats * BT + 0.4, bright, att, 0.5), bar(n, start), g)


def arp_bar(n, g, step=E8, pat=(0, 2, 4, 1, 3, 2, 4, 3), oct_=12, ch=None, start=0.0, end=4.0):
    c = CH[ch or PROG[n]]
    k, tb = 0, start * BT
    while tb < end * BT - 1e-6:
        note = c[pat[k % len(pat)] % len(c)] + oct_
        mix.place('music', glass(midi(note), 0.5, 0.75 + 0.25 * (k % 4 == 0)), bar(n) + tb, g, 0.45 * np.sin(k * 1.1))
        tb += step
        k += 1


def bass_bar(n, g, hits=((0, 1.5), (1.5, 1.0), (2.5, 0.5), (3.0, 1.0)), ch=None):
    r = ROOT_N[ch or PROG[n]]
    for b, dur in hits:
        mix.place('music', reese(r, dur * BT * 0.95), bar(n, b), g)


def drums_bar(n, kick_=(0, 2.5), clap_=(2,), hats=True, hat_g=1.0, g=1.0, open_=(), roll=None):
    for b in kick_:
        mix.place('drums', kk(), bar(n, b), 0.55 * g)
    for b in clap_:
        mix.place('drums', clap(), bar(n, b), 0.45 * g, 0.05)
        mix.place('send', clap(), bar(n, b), 0.1 * g)
    if hats:
        for k in range(16):
            acc = k % 4 == 2
            mix.place('drums', hat(False), bar(n) + k * S16, (0.11 if acc else 0.05) * hat_g * g, 0.3 if k % 2 else -0.2)
    for b in open_:
        mix.place('drums', hat(True), bar(n, b), 0.1 * g, 0.25)
    if roll:
        b0, b1 = roll
        t0, t1 = bar(n, b0), bar(n, b1)
        rt, i = t0, 0
        while rt < t1 - 0.06:
            mix.place('drums', snare(0.16), rt, 0.05 + 0.25 * (rt - t0) / (t1 - t0), 0.2 * np.sin(i))
            rt += S16 if rt < (t0 + t1) / 2 else S16 / 2
            i += 1


# --- c.1 gênese: pulso grave (coração) e pad escuro
for b in range(4):
    t = bar(1, b)
    mix.place('music', filt(sine(midi(34), 0.5) * np.exp(-tt(0.5) / 0.18) * env_on(tt(0.5), 0.004), 35, 'high'), t, 0.35 if b % 2 == 0 else 0.22)
    mix.place('music', filt(sine(midi(46), 0.4) * np.exp(-tt(0.4) / 0.12) * env_on(tt(0.4), 0.004), 60, 'high'), t, 0.18)
pad_bar(1, 0.1, bright=700, att=1.2)
# --- c.2 IDEIA: o pad abre e nasce o arpejo de vidro
pad_bar(2, 0.2, bright=1700, att=0.3)
arp_bar(2, 0.1, start=0.5)
mix.place('music', reese(46, BAR), bar(2), 0.24)
for b in range(4):                                     # o coração continua, mais firme
    mix.place('drums', kk(), bar(2, b), 0.32 if b % 2 == 0 else 0.2)
for k in range(8):
    mix.place('drums', hat(False), bar(2, 0.5) + k * E8 * 0.875, 0.035, 0.3)
# --- c.3 potencial: meio-tempo, baixo, arpejo girando
pad_bar(3, 0.13, bright=1800)
arp_bar(3, 0.08, step=S16, pat=(0, 1, 2, 3, 4, 3, 2, 1))
bass_bar(3, 0.3)
drums_bar(3, kick_=(0, 1.75, 2.5), clap_=(2,), hat_g=0.8)
# --- c.4 projeto: tensão, rufar e filtro abrindo até o golpe
pad_bar(4, 0.13, bright=1200)
arp_bar(4, 0.07, step=S16, pat=(0, 2, 4, 2))
bass_bar(4, 0.3, hits=((0, 1.0), (1.0, 1.0), (2.0, 0.5), (2.5, 0.5), (3.0, 0.5), (3.5, 0.4)))
drums_bar(4, kick_=(0, 1, 2, 3), clap_=(), hat_g=0.9, roll=(2.0, 4.0))
mix.automate_lowpass('music', bar(4), SEC['forma'] - 0.07, 700, 9000)
# --- c.5, c.6, c.8: groove completo
groove_kicks = []
for n in (5, 6, 8):
    ch = 'Ebm9' if n == 8 else None
    pad_bar(n, 0.15, bright=2400 if n != 8 else 2000, ch=ch)
    hits = ((0, 0.75), (0.75, 0.75), (1.5, 1.0), (2.5, 0.5), (3.0, 0.5), (3.5, 0.5)) if n != 8 else ((0, 1.5), (1.5, 1.0), (2.5, 1.5))
    bass_bar(n, 0.32, hits=hits, ch=ch)
    kicks = (0, 0.75, 1.5, 2.5, 3.0) if n == 5 else (0, 1.5, 2.5)
    drums_bar(n, kick_=kicks, clap_=(1, 3), open_=(3.5,), hat_g=1.0)
    groove_kicks += [bar(n, b) for b in kicks]
    arp_bar(n, 0.06, step=S16, pat=(0, 2, 4, 3, 1, 3, 4, 2), oct_=12, ch=ch)
mix.place('music', glass(midi(82), 1.2) + glass(midi(77), 1.2) * 0.6, SEC['forma'], 0.22)   # estalo agudo no golpe
# --- c.7 EXPERIÊNCIAS: fluido, meio-tempo
pad_bar(7, 0.2, bright=2200, att=0.25)
mix.place('music', stereo_pad([x + 12 for x in CH['DbF']], BAR + 0.5, 3200, 0.3, 0.6) * 0.6, bar(7), 0.12)
arp_bar(7, 0.075, step=S16, pat=(0, 1, 2, 3, 4, 3, 2, 1), oct_=12)
bass_bar(7, 0.28, hits=((0, 2.0), (2.0, 1.5), (3.5, 0.5)))
drums_bar(7, kick_=(0, 2.5), clap_=(2,), hat_g=0.6)
# --- c.9 propósito: sem groove; os três golpes vêm dos cues
pad_bar(9, 0.16, bright=1800, beats=2)
pad_bar(9, 0.16, bright=2000, beats=2, ch='Absus', start=2)
mix.place('music', reese(42, 2 * BT), bar(9), 0.22)
mix.place('music', reese(44, 2 * BT), bar(9, 2), 0.22)
# --- c.10 a barra: a bateria sai, o acorde sobe
pad_bar(10, 0.16, bright=1600, beats=2)
pad_bar(10, 0.18, bright=2600, beats=2, ch='Absus', start=2)
mix.place('music', reese(46, 2 * BT), bar(10), 0.2)
mix.place('music', reese(44, 2 * BT - 0.08), bar(10, 2), 0.2)
# --- c.11–c.12 Ré bemol maior: a resolução
L = DUR - SEC['marca']
mix.place('music', stereo_pad(CH['Dbmaj9'], L, 2400, 0.08, 1.6), SEC['marca'], 0.3)
mix.place('music', stereo_pad([x + 12 for x in CH['Dbmaj9'][1:]], L, 3600, 0.4, 1.6) * 0.5, SEC['marca'], 0.18)
mix.place('music', reese(49, 2 * BAR - 0.3), bar(12), 0.2)
mix.place('music', reese(49, 2.6), SEC['marca'], 0.3)
for n in (11, 12):
    arp_bar(n, 0.06 if n == 11 else 0.045, step=E8, pat=(0, 2, 4, 3, 1, 4, 2, 3), oct_=12, start=1.0 if n == 11 else 0.0)
drums_bar(11, kick_=(0,), clap_=(), hat_g=0.35, g=0.8)
drums_bar(12, kick_=(0, 2), clap_=(), hat_g=0.4, g=0.7)
mix.duck('music', groove_kicks, depth=0.3, release=0.15)


# ------------------------------------------------------------------ efeitos (a partir dos cues)
DROP_NOTES = [77, 80, 85]          # Fá, Lá bemol, Ré bemol
LAYER_NOTES = [58, 61, 65, 68, 70, 73, 77, 80]
PIECE_NOTES = [73, 77, 80, 82, 85, 80, 77, 85, 89]


def fx(c):
    ty, t = c['type'], c['t']
    d = c.get('d', 0.3)
    k = c.get('k', 0)
    if ty == 'hit':                                   # a primeira gota: impacto + respingo
        mix.place('sfx', imp(2.0, 1.0), t, 0.45)
        mix.place('sfx', bloop(midi(73), 0.3), t, 0.5)
        mix.place('sfx', bubbles2(0.7, 14, 900, 2600, 1), t + 0.01, 0.12)
        mix.place('sfx', filt(noise(0.5), [1500, 7000], 'band') * np.exp(-tt(0.5) / 0.08) * env_on(tt(0.5)), t, 0.25)
        mix.place('send', bloop(midi(73), 0.3), t, 0.3)
    elif ty == 'drop':                                # cada gota é uma nota
        f = midi(DROP_NOTES[k])
        mix.place('sfx', bloop(f, 0.3), t, 0.42, [-0.4, 0.45, -0.1][k])
        mix.place('send', bloop(f, 0.3), t, 0.25)
        mix.place('sfx', bubbles2(0.35, 5, 1200, 3000, 10 + k), t + 0.02, 0.08)
    elif ty == 'morph':                               # a gota escorre para dentro das letras
        mix.place('sfx', gloop(0.6, 180, 900), t - 0.05, 0.22)
        mix.place('sfx', shimmer(0.6, 1500, 6000, 24, 3), t, 0.06)
        mix.place('sfx', whoosh(0.6, 300, 3000, 0.5, 1.2), t - 0.1, 0.12)
    elif ty == 'gleam':
        mix.place('sfx', shimmer(0.5, 3000, 11000, 30, 4 + int(t)), t, 0.07)
    elif ty == 'burst':                               # a palavra estoura em gotas
        mix.place('sfx', imp(1.6, 0.9), t, 0.6)
        mix.place('sfx', bubbles2(0.5, 30, 500, 2400, 21), t + 0.005, 0.22)
        mix.place('sfx', whoosh(0.7, 4000, 300, 0.3, 1.2), t, 0.18)
    elif ty == 'blueprint':                           # o desenho técnico: bipes e ticks no tempo
        for i in range(16):
            mix.place('sfx', blip(midi([84, 91, 88, 96][i % 4]), 0.05), t + i * S16 / 2, 0.035, -0.7 + 1.4 * (i / 15))
        for i in range(8):
            mix.place('sfx', click(6500, 0.012), t + 0.9 + i * S16, 0.05, 0.6 * np.sin(i))
    elif ty == 'charge':                              # a matéria converge: subida que termina antes do golpe
        mix.place('sfx', swell(riser(d + 0.1, 120, 2400), d), t, 0.28)
        mix.place('sfx', swell(reverse(crash(d + 0.4)), d), t, 0.16)
    elif ty == 'slam':                                # o golpe: o líquido vira sólido
        mix.place('sfx', imp(2.8, 1.4), t, 0.78)
        mix.place('send', imp(2.8, 1.4), t, 0.2)
        mix.place('sfx', crystal(midi(70), 2.6), t, 0.3)
        mix.place('send', crystal(midi(70), 2.6), t, 0.25)
        mix.place('sfx', crash(2.6), t, 0.22)
        mix.place('sfx', filt(noise(0.25), 6000, 'high') * np.exp(-tt(0.25) / 0.03) * env_on(tt(0.25), 0.006), t, 0.16)
    elif ty == 'unbuild':
        mix.place('sfx', glitch(0.18, 5), t, 0.18)
    elif ty == 'redraw':                              # as linhas se rearranjam
        n = 18
        for i in range(n):
            mix.place('sfx', blip(midi(79 + (i * 5) % 17), 0.04), t + d * i / n, 0.03, -0.8 + 1.6 * i / n)
    elif ty == 'layer':                               # cada camada: um bloco afinado que sobe
        mix.place('sfx', block(midi(LAYER_NOTES[k]), 0.3), t, 0.3, -0.5 + k / 7)
        mix.place('sfx', click(4200, 0.015), t, 0.12)
        if k == 7:
            mix.place('sfx', crystal(midi(82), 1.4), t + 0.02, 0.1)
    elif ty == 'melt':                                # o sólido derrete
        mix.place('sfx', gloop(0.7, 900, 160), t - 0.02, 0.22)
        mix.place('sfx', bubbles2(0.6, 12, 400, 1400, 30), t + 0.05, 0.12)
    elif ty == 'flow':
        mix.place_pan('sfx', whoosh(0.6, 400, 2500, 0.4, 1.3), t, 0.12, -0.7, 0.7)
        mix.place('sfx', shimmer(0.6, 1800, 7000, 20, 40 + int(t)), t + 0.05, 0.05)
    elif ty == 'shatter':                             # congela e se parte em módulos
        mix.place('sfx', crystal(midi(86), 0.6), t - 0.15, 0.12)
        mix.place('sfx', imp(0.8, 0.5), t + 0.13, 0.3)
        mix.place('sfx', np.stack([filt(noise(0.35), 3500, 'high'), filt(noise(0.35), 3500, 'high')]) * np.exp(-tt(0.35) / 0.06) * env_on(tt(0.35)), t + 0.13, 0.22)
    elif ty == 'piece':                               # cada peça encaixa
        mix.place('sfx', block(midi(PIECE_NOTES[k]), 0.2), t, 0.16, R.uniform(-0.7, 0.7))
        mix.place('sfx', click(5200, 0.012), t, 0.1)
    elif ty == 'lock':
        mix.place('sfx', imp(1.0, 0.6), t, 0.35)
        mix.place('sfx', block(midi(58), 0.4), t, 0.3)
        mix.place('sfx', crystal(midi(77), 1.2), t + 0.01, 0.08)
    elif ty == 'pool':
        mix.place('sfx', gloop(0.6, 700, 140), t - 0.02, 0.2)
        mix.place('sfx', bloop(midi(61), 0.4), t, 0.3)
    elif ty == 'quality':                             # bem desenvolvidos / funcionais / visualmente marcantes
        if k == 0:
            for i in range(6):
                mix.place('sfx', blip(midi([84, 91, 96, 91, 88, 96][i]), 0.06), t + i * 0.035, 0.06, -0.5 + 0.2 * i)
            mix.place('sfx', imp(0.9, 0.5), t, 0.3)
        elif k == 1:
            mix.place('sfx', imp(1.2, 0.8), t, 0.5)
            mix.place('sfx', block(midi(54), 0.4), t, 0.35)
            mix.place('sfx', click(3000, 0.03) * env_on(tt(0.03), 0.0015), t, 0.3)
        else:
            mix.place('sfx', imp(1.6, 1.0), t, 0.6)
            mix.place('sfx', bloop(midi(68), 0.4), t, 0.45)
            mix.place('sfx', bubbles2(0.6, 18, 700, 2600, 51), t + 0.01, 0.16)
            mix.place('sfx', crash(1.6), t, 0.16)
    elif ty == 'align':
        d2 = SEC['barra'] - t
        mix.place('sfx', swell(riser(d2 + 0.1, 200, 3000), d2), t, 0.22)
    elif ty == 'barra':                               # a barra surge: "o corte" da assinatura
        mix.place('sfx', imp(1.8, 1.0), t, 0.7)
        sig_cut(mix, t, 1.1, 1, big=True)
        mix.place('sfx', gloop(0.5, 300, 1200), t, 0.12)
    elif ty == 'solidify':
        mix.place('sfx', crystal(midi(75), 1.8), t, 0.2)
        mix.place('send', crystal(midi(75), 1.8), t, 0.2)
    elif ty == 'condense':                            # as letras condensam: brilho granular que sobe
        mix.place('sfx', shimmer(d, 1200, 9000, 60, 70), t, 0.09)
        mix.place('sfx', swell(riser(d + 0.1, 300, 2600), d, 0.1), t, 0.12)
    elif ty == 'logo':                                # revelação: assinatura completa em Ré bemol maior
        mix.place('sfx', imp(3.0, 1.4), t, 0.7)
        mix.place('send', imp(3.0, 1.4), t, 0.2)
        mix.place('sfx', crash(3.2) * env_on(tt(3.2), 0.006), t, 0.18)
        sig_cut(mix, t, 1.0, 1, big=True)
        sig_motif(mix, t + 0.02, E8, 1.2, full=True)
    elif ty == 'title':
        mix.place('sfx', whoosh(0.3, 600, 4000, 0.5, 1.4), t - 0.12, 0.08)
    elif ty == 'url':
        for i in range(19):
            mix.place('sfx', click(5600 + 140 * (i % 5), 0.012), t + 0.12 + i * 0.022, 0.07, -0.6 + 1.2 * i / 19)
    elif ty == 'pulse':                               # as ondas da aura: ping de sonar
        p = np.sin(2 * np.pi * midi(85) * tt(0.9)) * np.exp(-tt(0.9) / 0.22) * env_on(tt(0.9), 0.002)
        mix.place('sfx', p, t, 0.05 * (1 - k / 9), 0.3 * np.sin(k))
        mix.place('send', p, t, 0.06)
    else:
        raise ValueError('cue desconhecido: ' + ty)


for c in CUES:
    fx(c)

out = mix.render(levels={'music': 0.9, 'drums': 0.75, 'sfx': 1.0}, reverb={'send': 0.6, 'sfx': 0.12, 'music': 0.12})
# respiro antes dos golpes principais: 60 ms em -14 dB; o golpe entra no instante exato do evento
g = np.ones(out.shape[1])
for c in CUES:
    if c['type'] in ('burst', 'slam', 'barra', 'logo'):
        i1 = int(c['t'] * SR)
        i0, i_ = i1 - int(0.075 * SR), i1 - int(0.06 * SR)
        g[i0:i_] = np.minimum(g[i0:i_], np.linspace(1, 0.2, i_ - i0))
        g[i_:i1 - 192] = np.minimum(g[i_:i1 - 192], 0.2)
        g[i1 - 192:i1] = np.minimum(g[i1 - 192:i1], np.linspace(0.2, 1, 192))
out = out * g
# equalização final pensando no celular: menos subgrave, mais presença
out = filt(out, 28, 'high')
out = out - 0.4 * filt(out, 70, 'low') + 0.25 * filt(out, [500, 1500], 'band') + 0.3 * filt(out, [1500, 6000], 'band')
master(out, os.path.join(ROOT, 'audio', 'trilha.wav'), ceiling_db=-3.2)   # folga para o AAC nos golpes
