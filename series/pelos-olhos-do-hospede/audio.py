#!/usr/bin/env python3
"""
Série "Pelos olhos do hóspede" — efeitos sintetizados (sem música).

Sem voz, a música entra pelo Instagram: aqui ficam só os efeitos, em −16 LUFS.
Com voz (cues "voz" + audio/voz/voz.json, gerados por voz.py e pelo motor), a narração entra
no centro, os efeitos abaixam ~9 dB sob a fala (a partir de 0,12 s antes dela; o ataque de cada
efeito passa inteiro) e o master vai a −14 LUFS, sem espaço para música do Instagram.
Os efeitos ficam nos instantes exportados pela animação (audio/cues.json):

  hook      um sopro grave curto que abre o quadro 0
  knock     a batida seca na parte lima do título
  rise      o sopro do título subindo para o cabeçalho
  ping      cada card chega com um toque de vidro, subindo na pentatônica de
            Lá bemol (Lá bemol 5, Dó 6, Mi bemol 6, Fá 6, Lá bemol 6)
  cut       "o corte" da marca: a varredura atravessa o estéreo junto com a barra
  stamp     o carimbo: baque grave, tapa e a pilha chacoalhando
  exit      os cards caem: sopro descendo
  virada    sopro leve e um acorde de vidro (Lá bemol maior com nona)
  fecho     sopro curto
  logo      a assinatura completa (varredura + Lá bemol 5 -> Mi bemol 6)

    python3 series/pelos-olhos-do-hospede/audio.py reels/<id>   -> reels/<id>/audio/trilha.wav
"""
import json
import os
import sys
import numpy as np

ROOT = os.path.abspath(sys.argv[1])
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(REPO, 'tools', 'audio'))
from fzaudio import *  # noqa: E402,F403
from fzbrand import sig_cut, sig_motif, fm_bell  # noqa: E402

seed(707)
DATA = load_cues(ROOT)
DUR = float(DATA['duration'])
mix = Mix(DUR)
PENTA = [80, 84, 87, 89, 92]                      # Lá bemol 5, Dó 6, Mi bemol 6, Fá 6, Lá bemol 6
COM_VOZ = any(c['type'] == 'voz' for c in DATA['cues'])
# com voz, o baque do carimbo fica um pouco mais baixo: grave saturado, o AAC passava do pico permitido
G_STAMP = 0.7 if COM_VOZ else 0.95
# idem a batida do título: o estalo agudo passava 3 dB no AAC (ep. 4: -1,3 dBTP no MP4 com o WAV em -3,3)
G_KNOCK, G_KNOCK_CLICK = (0.45, 0.08) if COM_VOZ else (0.55, 0.25)


def glass(f, d=0.6, vel=1.0):
    t = tt(d)
    idx = 1.1 * vel * np.exp(-t / 0.06)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 2.0 * t)) + 0.22 * np.sin(2 * np.pi * f * 4.07 * t) * np.exp(-t / 0.04)
    return s * np.exp(-t / 0.28) * np.minimum(1, t / 0.0015) * vel


def thud(d=0.5, f=62):
    t = tt(d)
    body = np.sin(2 * np.pi * np.cumsum(f + 90 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.13)
    slap = filt(noise(d), [900, 5200], 'band') * np.exp(-t / 0.018)
    return np.tanh(1.6 * (body + 0.9 * slap)) * np.minimum(1, t / 0.0008)


def rattle(d=0.3):
    t = tt(d)
    out = np.zeros(len(t))
    for k in range(5):
        i = int((0.018 + k * 0.034 + 0.01 * np.sin(k * 7)) * SR)
        c = click(2400 + 500 * k, 0.03) * (0.7 ** k)
        out[i:i + len(c)] += c[: max(0, len(out) - i)]
    return out


for c in DATA['cues']:
    t, ty = c['t'], c['type']
    if ty == 'hook':
        mix.place('sfx', filt(whoosh(0.5, 120, 900, 0.15), 1800, 'low'), t, 0.35)
    elif ty == 'knock':
        mix.place('sfx', thud(0.35, 80), t, G_KNOCK)
        mix.place('sfx', click(4200, 0.02), t, G_KNOCK_CLICK)
    elif ty == 'rise':
        mix.place_pan('sfx', whoosh(c.get('d', 0.5), 400, 3200, 0.55), t, 0.32, -0.2, 0.2)
    elif ty == 'ping':
        k = c['k']
        g = glass(midi(PENTA[min(k, len(PENTA) - 1)]), 0.7)
        pan = [-0.25, 0.2, -0.1, 0.25, 0.0][k % 5]
        mix.place('sfx', g, t, 0.42, pan)
        mix.place('send', g, t, 0.22)
        mix.place('sfx', filt(whoosh(0.22, 600, 2400, 0.7), 4000, 'low'), t - 0.16, 0.12)
    elif ty == 'cut':
        sig_cut(mix, t + 0.02, g=1.0, big=True)
    elif ty == 'stamp':
        mix.place('sfx', thud(0.6, 58), t, G_STAMP)
        mix.place('sfx', impact(1.0, 0.5), t, 0.28)
        mix.place('sfx', rattle(0.3), t + 0.01, 0.3)
        mix.place('send', thud(0.6, 58), t, 0.18)
    elif ty == 'exit':
        mix.place_pan('sfx', whoosh(0.55, 2400, 260, 0.35), t, 0.3, 0.15, -0.15)
    elif ty == 'virada':
        mix.place('sfx', whoosh(0.4, 300, 2600, 0.6), t - 0.1, 0.18)
        chord = sum(glass(midi(n), 1.6, 0.6) for n in (68, 72, 75, 82)) / 4
        mix.place('sfx', chord, t + 0.05, 0.35)
        mix.place('send', chord, t + 0.05, 0.35)
    elif ty == 'fecho':
        mix.place('sfx', whoosh(0.3, 500, 3000, 0.6), t - 0.05, 0.14)
    elif ty == 'logo':
        sig_motif(mix, t + 0.2, 0.3, g=0.9)
    elif ty == 'slash':
        sig_cut(mix, t, g=0.8)

# tom de sala quase inaudível, para nunca haver silêncio digital
mix.place('room', filt(noise(DUR), 900, 'low') * db(-56) * 8, 0, 1.0)

LEVELS, REVERB = {'sfx': 1.0, 'room': 1.0}, {'send': 0.55, 'sfx': 0.06}
if not COM_VOZ:
    master(mix.render(levels=LEVELS, reverb=REVERB), os.path.join(ROOT, 'audio', 'trilha.wav'), lufs=-16.0, fade_out=0.3)
else:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import voz  # noqa: E402
    VOZ_ACIMA = 3.0                                # a fala fica 3 dB acima dos efeitos cheios
    v = voz.trilha_da_voz(ROOT, DATA['cues'], mix.N)
    cheia = mix.render(levels=LEVELS, reverb=REVERB)
    g = voz.ganho_sob_a_voz(v, -9.0)
    fx = cheia * g                                 # depois do reverb: as caudas também abaixam sob a fala
    vv = np.stack([v, v])
    ativo = np.abs(v) > 1e-6
    k = db(measure_lufs(cheia.T) + VOZ_ACIMA - measure_lufs(vv[:, ativo].T))
    # conferência: em cada janela de 50 ms com fala, quanto a voz fica acima dos efeitos (300 Hz–4 kHz)
    from scipy.signal import butter, sosfiltfilt
    sos = butter(2, (300, 4000), 'band', fs=SR, output='sos')
    vb, fb = sosfiltfilt(sos, v * k), sosfiltfilt(sos, fx.mean(0))
    q = int(0.05 * SR)
    pv = (vb[: len(vb) // q * q] ** 2).reshape(-1, q).mean(1)
    pf = (fb[: len(fb) // q * q] ** 2).reshape(-1, q).mean(1)
    fala = pv > pv.max() * 10 ** (-25 / 10)
    r = 10 * np.log10(pv[fala] / (pf[fala] + 1e-12))
    print(f'voz: efeitos {20 * np.log10(g.min()):.1f} dB sob a fala · voz acima dos efeitos: mínimo {r.min():+.1f} dB, '
          f'10% {np.percentile(r, 10):+.1f} dB, mediana {np.median(r):+.1f} dB')
    # teto de pico do master: -3,3 dBTP (folga para o AAC); o roteiro pode baixar com "master": {"teto_db": -4.6}
    ep_json = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'episodios', os.path.basename(ROOT) + '.json')
    teto = (json.load(open(ep_json)).get('master') or {}).get('teto_db', -3.3) if os.path.exists(ep_json) else -3.3
    master(fx + vv * k, os.path.join(ROOT, 'audio', 'trilha.wav'), lufs=-14.0, fade_out=0.3, ceiling_db=teto)
