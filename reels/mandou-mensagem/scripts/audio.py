#!/usr/bin/env python3
"""
Trilha + efeitos do FAZLO Digital + FAZLO Hospeda (collab) "Mandou mensagem e ninguém respondeu"
— 100% sintetizados.

Mesma paleta dos Reels da FAZLO Digital: 100 BPM (1 tempo = 0,6 s), Lá bemol maior, assinatura
sonora da marca ("o corte" e o motivo Lá bemol 5 -> Mi bemol 6).

  gancho      pad e vidro esparsos; o "pop" do envio; o "…" da pousada (cliques macios) que para
              e deixa uma nota suspensa, sem resposta
  a rotina    groove leve; um som por ícone: xícara, campainha de recepção, borrifador, chaves
  o site      o groove firma; um tique afinado por campo, em notas que sobem; o toque em "Enviar";
              o fio nasce com um zíper que sobe; notificação genérica (não é o som do WhatsApp)
  o Hospeda   groove completo e arpejo; o fio desliza entre os alvos (sopro + glissando) e cada
              contorno soa um bloco afinado, em escala que sobe; sopro nas trocas e rolagens;
              toque e acorde em "Confirmar reserva" (com respiro antes)
  ciclo       varredura e sinos na troca antes -> depois do calendário
  CTA         a assinatura completa nas logos; o fio ligando as duas marcas

    python3 reels/mandou-mensagem/scripts/audio.py   -> audio/trilha.wav (48 kHz, estéreo, -14 LUFS)
"""
import os
import sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, '..', '..', 'tools', 'audio'))
from fzaudio import *  # noqa: E402,F403
from fzbrand import sig_cut, sig_motif  # noqa: E402

seed(2611)
DATA = load_cues(ROOT)
BPM = DATA['bpm']
BT = 60.0 / BPM
S16 = BT / 4
E8 = BT / 2
DUR = float(DATA['duration'])
SEC = DATA['sections']
CUES = DATA['cues']
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



# ------------------------------------------------------------------ timbres da rotina e do fio
def clink(d=0.6):
    """Xícara no pires: dois toques de porcelana."""
    t = tt(d)
    s = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / dk) for f, dk in ((2650, 0.12), (4120, 0.08), (5530, 0.05)))
    s2 = np.zeros(len(t))
    i = int(0.07 * SR)
    s2[i:] = s[: len(t) - i] * 0.55
    return (s + s2) * env_on(t, 0.0008) * 0.5


def desk_bell(f=2093.0, d=1.4):
    """Campainha de recepção: sino metálico com batimento."""
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * f * 1.004 * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.15)
    return s * np.exp(-t / 0.45) * env_on(t, 0.001) * 0.5


def spray(d=0.22):
    """Borrifador: sopro de ruído agudo."""
    t = tt(d)
    return filt(noise(d), [3500, 11000], 'band') * np.minimum(1, t / 0.01) * np.exp(-t / 0.08)


def jingle(d=0.7):
    """Chaves: tilintar metálico curto, vários toques."""
    out = np.zeros(int(d * SR))
    r = np.random.default_rng(9)
    for k in range(7):
        t0 = 0.035 * k + r.uniform(0, 0.02)
        f = r.uniform(3000, 6200)
        tk = tt(0.18)
        s = (np.sin(2 * np.pi * f * tk) + 0.5 * np.sin(2 * np.pi * f * 1.51 * tk)) * np.exp(-tk / 0.05) * r.uniform(0.4, 1.0)
        i = int(t0 * SR)
        out[i:i + len(s)] += s[: len(out) - i]
    return out * 0.45


def glide(d, n0, n1, g=1.0):
    """O fio viajando: glissando suave (seno + ar filtrado)."""
    t = tt(d)
    f = midi(n0) * (midi(n1) / midi(n0)) ** (t / d)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + sweep(noise(d), midi(n0) * 4, midi(n1) * 6, 2.0) * 0.25
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    return s * env * g


def zip_up(d=0.5):
    """O fio nasce: zíper que sobe."""
    t = tt(d)
    clicks = np.zeros(len(t))
    rate = 40 + 120 * (t / d)
    ph = np.cumsum(rate) / SR
    clicks[np.where(np.diff(np.floor(ph)) > 0)[0]] = 1.0
    clicks = filt(clicks, [2000, 9000], 'band') * 3
    return (clicks + glide(d, 72, 96) * 0.8) * np.minimum(1, t / 0.01)


# --- gancho (0–4,2): pad e vidro esparsos; a mensagem fica no ar
mix.place('music', stereo_pad(CH['Abmaj9'], b(4) + 0.3, 1700, 0.08, 0.5), 0.0, 0.26)
mix.place('music', stereo_pad(CH['Fm9'], b(3) + 0.3, 1500, 0.3, 0.5), b(4), 0.24)
mix.place('music', reese(ROOT_N['Abmaj9'], b(4) - 0.05, 500), 0.0, 0.14)
mix.place('music', reese(ROOT_N['Fm9'], b(3) - 0.05, 500), b(4), 0.14)
for k in range(7):                                       # pulsação grave leve, um por tempo
    mix.place('drums', filt(kk(), 450, 'low'), b(k), 0.12)
for i, n in enumerate([84, 80, 87]):
    mix.place('music', glass(midi(n), 0.8, 0.8), b(1 + 2 * i), 0.1, -0.3 + 0.3 * i)
mix.place('music', bell(midi(91), 2.0), 2.75, 0.09, 0.3)                      # a nota suspensa: ninguém respondeu
mix.place('sfx', swell(reverse(crash(1.0)), 0.8), SEC['rotina'] - 0.8, 0.05)

# --- a rotina (4,2–9,0): groove leve
for b0, nb, ch in ((7, 4, 'Dbmaj9'), (11, 4, 'Fm9')):
    bass(b0, nb, ch, 0.6, pat=((0, 1.5), (1.5, 1.0), (2.5, 1.5)))
    keys(b0, nb, ch, 0.7, offs=(0, 2.5))
    mix.place('music', stereo_pad(CH[ch], b(nb) + 0.3, 1800, 0.2, 0.4), b(b0), 0.08)
drums(7, 15, 0.55, kicks='half', clap_on=(), hats=True)
for k in range(8):                                       # semicolcheias crescendo até o celular subir
    mix.place('drums', hat(False), b(13) + k * E8, 0.025 + 0.01 * k, 0.25 if k % 2 else -0.25)

# --- o site (9,0–15,0): o groove firma
for b0, nb, ch in ((15, 4, 'Abmaj9'), (19, 3, 'Fm9'), (22, 3, 'Dbmaj9')):
    bass(b0, nb, ch, 0.85)
    keys(b0, nb, ch, 0.85)
    mix.place('music', stereo_pad(CH[ch], b(nb) + 0.25, 2000, 0.15, 0.35), b(b0), 0.08)
drums(15, 25, 0.8, ghost=True)
arp(b(20), b(25), 'Dbmaj9', 0.03, step=S16 * 2)

# --- o Hospeda (15,0–27,0): groove completo e arpejo
SEQ = [(25, 4, 'Fm9'), (29, 4, 'Dbmaj9'), (33, 4, 'Abmaj9'), (37, 4, 'Bbm9'), (41, 2, 'Ebsus'), (43, 2, 'Ebsus')]
for b0, nb, ch in SEQ:
    bass(b0, nb, ch)
    keys(b0, nb, ch, 0.9)
    mix.place('music', stereo_pad(CH[ch], b(nb) + 0.25, 2400, 0.12, 0.35), b(b0), 0.08)
    arp(b(b0), b(b0 + nb), ch, 0.035, step=S16 * 2)
drums(25, 43, 1.0, ghost=True)
for k in range(4):                                       # virada até o "Confirmar reserva"
    mix.place('drums', snare(0.2), b(42) + k * E8, 0.05 + 0.03 * k, 0.1)
mix.place('sfx', swell(riser(1.2, 300, 3600), 1.2), b(43) - 1.2, 0.08)

# --- o ciclo fecha (27,0–31,2)
for b0, nb, ch in ((45, 4, 'Abmaj9'), (49, 3, 'Dbmaj9')):
    bass(b0, nb, ch, 0.9)
    keys(b0, nb, ch, 0.9)
    mix.place('music', stereo_pad(CH[ch], b(nb) + 0.25, 2600, 0.12, 0.35), b(b0), 0.09)
    arp(b(b0), b(b0 + nb), ch, 0.035, step=S16 * 2)
drums(45, 52, 0.9, ghost=True)
mix.place('sfx', swell(riser(1.5, 250, 4200), 1.5), SEC['cta'] - 1.5, 0.11)
mix.place('sfx', swell(reverse(crash(1.4)), 1.0), SEC['cta'] - 1.0, 0.12)

# --- CTA (31,2–35,4): Lá bemol maior
L = DUR - SEC['cta']
mix.place('music', stereo_pad(CH['Abmaj9'], L, 2600, 0.06, 1.4), SEC['cta'], 0.24)
mix.place('music', stereo_pad([x + 12 for x in CH['Abmaj9'][1:]], L, 3600, 0.4, 1.4) * 0.5, SEC['cta'], 0.14)
mix.place('music', reese(44, 2.6), SEC['cta'], 0.3)
arp(SEC['cta'] + 0.6, DUR - 0.3, 'Abmaj9', 0.05, step=E8)

FILL_N = [84, 87, 92]
WRAP_N = [80, 82, 84, 87, 89, 92, 94, 96, 99, 101, 103, 104, 106, 108]


# ------------------------------------------------------------------ efeitos (a partir dos cues)
def fx(c):
    ty, t = c['type'], c['t']
    d = c.get('d', 0.3)
    k = c.get('k', 0)
    if ty == 'open':                                    # a mensagem sai
        mix.place('sfx', pop(720, 0.1), t, 0.16)
        mix.place('sfx', blip(midi(92), 0.08), t + 0.02, 0.12)
        mix.place('sfx', whoosh(0.25, 900, 4200, 0.5, 1.4), t, 0.03)
    elif ty == 'title':
        mix.place('sfx', whoosh(0.35, 500, 3500, 0.5, 1.4), max(0.0, t - 0.1), 0.06)
    elif ty == 'typing':                                # "…" da pousada: cliques macios que param
        r = np.random.default_rng(3)
        tj = t + 0.05
        while tj < t + d:
            mix.place('sfx', click(r.uniform(2200, 3400), 0.02), tj, 0.09, r.uniform(-0.3, 0.0))
            tj += S16 * r.choice([1, 1, 2])
    elif ty == 'icon':                                  # a rotina
        if k == 0:
            mix.place('sfx', clink(), t, 0.22, -0.4)
        elif k == 1:
            mix.place('sfx', desk_bell(), t, 0.2, 0.4)
            mix.place('send', desk_bell(), t, 0.06)
        elif k == 2:
            mix.place('sfx', spray(), t, 0.12, 0.3)
            mix.place('sfx', spray(), t + 0.15, 0.1, 0.35)
        else:
            mix.place('sfx', jingle(), t, 0.22, -0.3)
        mix.place('sfx', pop(520 + 60 * k, 0.1), t, 0.05)
    elif ty == 'rise':                                  # o celular sobe
        mix.place('sfx', whoosh(d, 200, 2400, 0.55, 1.2), t, 0.1)
    elif ty == 'fly':                                   # o balão vira o formulário
        mix.place('sfx', whoosh(d, 2600, 500, 0.6, 1.3), t, 0.06)
        mix.place('sfx', glass(midi(96), 0.6, 0.7), t + d - 0.05, 0.05)
    elif ty == 'fill':                                  # um campo por tempo, notas que sobem
        mix.place('sfx', tick(3600, 0.03), t, 0.08)
        mix.place('sfx', block(midi(FILL_N[k]), 0.3), t, 0.16, 0.15)
    elif ty == 'tap':
        mix.place('sfx', tap(midi(92)), t, 0.22, 0.1)
        mix.place('send', tap(midi(92)), t, 0.04)
    elif ty == 'fio':                                   # o fio nasce
        mix.place('sfx', zip_up(0.5), t, 0.1, 0.2)
        mix.place('send', glass(midi(99), 0.8), t + 0.3, 0.04)
    elif ty == 'switch':                                # troca de app
        mix.place_pan('sfx', whoosh(0.36, 400, 3800, 0.45, 1.2), t, 0.08, 0.5, -0.5)
    elif ty == 'notif':                                 # a mensagem chega no WhatsApp (toque genérico)
        mix.place('sfx', notif_tone(), t, 0.24)
        mix.place('send', notif_tone(), t, 0.08)
        mix.place('sfx', tick(4800, 0.02), t, 0.07)
    elif ty == 'travel':                                # o fio viajando
        mix.place_pan('sfx', glide(d, 84, 91), t, 0.05, -0.3, 0.3)
    elif ty == 'slide':                                 # um recorte do Hospeda entra
        mix.place('sfx', whoosh(0.4, 300, 2600, 0.5, 1.2), t + 0.05, 0.06)
    elif ty == 'scroll':
        mix.place('sfx', whoosh(max(0.3, d), 2200, 400, 0.5, 1.1), t, 0.05)
    elif ty == 'wrap':                                  # o fio fecha um contorno: bloco afinado, a escala sobe
        n = WRAP_N[min(k, len(WRAP_N) - 1)]
        mix.place('sfx', block(midi(n), 0.35), t, 0.16, 0.25 * np.sin(k))
        mix.place('sfx', glass(midi(n + 12), 0.6), t + 0.01, 0.05)
        mix.place('send', block(midi(n), 0.35), t, 0.04)
    elif ty == 'confirm':                               # "Confirmar reserva": toque e acorde
        mix.place('sfx', tap(midi(96)), t, 0.24, 0.1)
        mix.place('drums', kk(), t, 0.5)
        mix.place('sfx', imp(1.4, 0.7), t, 0.22)
        mix.place('music', epiano([68, 72, 75, 79, 82], 1.4, 1.2), t, 0.22)
        for j, n in enumerate([92, 96, 99]):
            mix.place('sfx', bell(midi(n), 1.0), t + 0.05 + j * 0.07, 0.05, -0.3 + 0.3 * j)
    elif ty == 'vira':                                  # calendário antes -> depois
        mix.place_pan('sfx', whoosh(d + 0.1, 600, 5200, 0.5, 1.4), t, 0.08, -0.6, 0.6)
        for j, n in enumerate([84, 87, 92, 96]):
            mix.place('sfx', glass(midi(n), 0.6, 0.8), t + j * (d / 4), 0.07, -0.5 + 0.33 * j)
    elif ty == 'logo':                                  # assinatura completa
        mix.place('sfx', imp(2.6, 1.2), t, 0.4)
        mix.place('send', imp(2.6, 1.2), t, 0.15)
        sig_cut(mix, t, 0.7, 1, big=True)
        sig_motif(mix, t + 0.3, E8, 1.15, full=True)
    elif ty == 'link':                                  # o fio liga as duas marcas
        mix.place_pan('sfx', glide(d, 80, 87, 1.0), t, 0.06, -0.7, 0.7)
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
    if c['type'] in ('confirm', 'logo'):
        i1 = int(c['t'] * SR)
        i0, i_ = i1 - int(0.075 * SR), i1 - int(0.06 * SR)
        g[i0:i_] = np.minimum(g[i0:i_], np.linspace(1, 0.2, i_ - i0))
        g[i_:i1 - 192] = np.minimum(g[i_:i1 - 192], 0.2)
        g[i1 - 192:i1] = np.minimum(g[i1 - 192:i1], np.linspace(0.2, 1, 192))
out = out * g
out = filt(out, 28, 'high')
out = out - 0.4 * filt(out, 70, 'low') + 0.25 * filt(out, [500, 1500], 'band') + 0.3 * filt(out, [1500, 6000], 'band')
master(out, os.path.join(ROOT, 'audio', 'trilha.wav'), ceiling_db=-3.3)   # folga para o AAC nos golpes
