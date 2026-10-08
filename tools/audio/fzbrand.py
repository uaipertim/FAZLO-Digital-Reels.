"""
FAZLO Digital — assinatura sonora da marca ("o corte").

  1. a varredura: ruído metálico filtrado que sobe de 1,8 kHz a 13 kHz e
     atravessa o estéreo da esquerda para a direita, como a barra da logo
     (que sobe para a direita);
  2. o intervalo: duas notas de sino FM, Lá bemol 5 e Mi bemol 6 (uma quinta
     justa para cima), a segunda uma colcheia depois.

Toda barra que corta a tela usa a varredura (sig_cut); a marca toca a
assinatura completa (sig_cut + sig_motif). Criada no Reel 00, onde a
implementação de referência continua em reels/reel-00/scripts/audio.py.
"""
import numpy as np
from fzaudio import tt, midi, noise, sweep, click

SIG_NOTES = (80, 87)          # Lá bemol 5 -> Mi bemol 6


def fm_bell(f, d=2.4, bright=1.0):
    """Sino FM brilhante (razão 3,5)."""
    t = tt(d)
    idx = 3.2 * bright * np.exp(-t / 0.35)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 3.5 * t))
    s += 0.35 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.5)
    return s * np.exp(-t / (d / 3.2)) * np.minimum(1, t / 0.002)


def swipe(d=0.16, f0=1800, f1=13000):
    """A varredura: ruído metálico (com parciais inarmônicos) subindo."""
    t = tt(d)
    n = sweep(noise(d), f0, f1, q=3.0)
    ring = sum(np.sin(2 * np.pi * fr * t) for fr in (3150, 4870, 7230)) * 0.12
    env = np.minimum(1, t / 0.004) * np.exp(-t / (d * 0.55))
    return (n + ring * np.exp(-t / 0.05)) * env


def sig_cut(mix, t0, g=1.0, dir_=1, big=False, bus='sfx', send='send'):
    """Varredura da assinatura no instante t0, atravessando o estéreo (dir_=1: esquerda -> direita)."""
    s = swipe(0.26 if big else 0.16)
    mix.place_pan(bus, s, t0, 0.55 * g, -0.9 * dir_, 0.9 * dir_)
    mix.place(bus, click(5200, 0.02), t0, 0.5 * g)
    if send:
        mix.place(send, s, t0, 0.25 * g)


def sig_motif(mix, t0, gap, g=1.0, full=True, bus='sfx', send='send'):
    """O intervalo da marca; `gap` = uma colcheia no andamento do Reel."""
    for k, (n, dt) in enumerate([(SIG_NOTES[0], 0.0), (SIG_NOTES[1], gap)][: 2 if full else 1]):
        d = 3.2 if k else 2.4
        b, b2 = fm_bell(midi(n), d), fm_bell(midi(n) * 1.004, d)
        mix.place(bus, np.stack([b, b2]) * 0.5, t0 + dt, 0.42 * g)
        if send:
            mix.place(send, b, t0 + dt, 0.35 * g)
