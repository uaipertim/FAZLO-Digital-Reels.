"""
FAZLO Digital — biblioteca de síntese de áudio (numpy/scipy, sem samples).

Base compartilhada pelas trilhas dos Reels: osciladores, filtros, bateria,
efeitos de motion design, mixagem em barramentos estéreo e master para
Instagram (-14 LUFS integrado, pico real ≤ -1 dBTP depois do AAC).

Uso típico em reels/<id>/scripts/audio.py:

    import os, sys
    ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sys.path.insert(0, os.path.join(ROOT, '..', '..', 'tools', 'audio'))
    from fzaudio import *

    data = load_cues(ROOT)                    # audio/cues.json exportado da animação
    mix = Mix(data['duration'])
    for c in data['cues']:
        mix.place('sfx', blip(880), c['t'], 0.3)
    master(mix.render(), os.path.join(ROOT, 'audio', 'trilha.wav'))

A identidade sonora (timbres, harmonia, assinatura da marca) é de cada Reel e
da marca FAZLO Digital; aqui ficam só as ferramentas.
"""
import json
import os
import subprocess
import numpy as np
from scipy.io import wavfile
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt

SR = 48000
_rng = np.random.default_rng(1)


def seed(n):
    """Fixa a semente do ruído: a mesma trilha sai idêntica a cada execução."""
    global _rng
    _rng = np.random.default_rng(n)


# ------------------------------------------------------------------ básicos
def tt(d):
    return np.arange(int(max(0.0, d) * SR)) / SR


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def db(x):
    return 10 ** (x / 20)


def noise(d):
    return _rng.standard_normal(int(d * SR))


def filt(x, f, kind='low', order=2):
    """kind: low | high | band (f = [f0, f1])."""
    if kind == 'band':
        f = [max(20, f[0]), min(SR / 2 * 0.95, f[1])]
    else:
        f = min(f, SR / 2 * 0.95)
    return sosfilt(butter(order, f, kind, fs=SR, output='sos'), x, axis=-1)


def sweep(x, f0, f1, q=1.4, kind='band'):
    """Filtro com frequência de corte deslizando exponencialmente de f0 a f1."""
    out = np.zeros_like(x)
    n, B, zi = len(x), 256, None
    for i in range(0, n, B):
        fc = f0 * (f1 / f0) ** (i / max(1, n - 1))
        if kind == 'band':
            sos = butter(2, [fc / (1 + 1 / q), min(fc * (1 + 1 / q), SR / 2 * 0.95)], 'band', fs=SR, output='sos')
        else:
            sos = butter(2, min(fc, SR / 2 * 0.95), kind, fs=SR, output='sos')
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        out[i:i + B], zi = sosfilt(sos, x[i:i + B], zi=zi)
    return out


def adsr(n, a=0.005, d=0.1, s=0.7, r=0.2, length=None):
    """Envelope ADSR com n amostras; `length` (s) é o tempo da nota antes do release."""
    t = np.arange(n) / SR
    length = (n / SR - r) if length is None else length
    e = np.where(t < a, t / max(a, 1e-6), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-6)))
    rel = np.clip(1 - (t - length) / max(r, 1e-6), 0, 1)
    return e * np.where(t > length, rel, 1)


def fade(x, a=0.002, r=0.01):
    n = len(x)
    e = np.ones(n)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[n - nr:] *= np.linspace(1, 0, nr)
    return x * e


def ir(d=2.2, seed_=0, damp=0.55, lp=7000):
    """Resposta ao impulso sintética (cauda de ruído decaindo), normalizada em energia."""
    r = np.random.default_rng(seed_)
    t = tt(d)
    x = filt(r.standard_normal(len(t)) * np.exp(-t / damp), lp, 'low')
    return x / np.sqrt((x ** 2).sum())


# ------------------------------------------------------------------ osciladores
def sine(f, d, ph=0.0):
    return np.sin(2 * np.pi * f * tt(d) + ph)


def fm(f, d, ratio=2.0, index=2.0, idx_decay=0.3):
    """FM simples (sinos, metálicos, baixos): o índice decai com idx_decay (s)."""
    t = tt(d)
    return np.sin(2 * np.pi * f * t + index * np.exp(-t / idx_decay) * np.sin(2 * np.pi * f * ratio * t))


def saw(f, t, bright=6000, ph=0.0):
    """Dente-de-serra limitado em banda (aditivo), brilho controlado por `bright` (Hz)."""
    kmax = max(2, int(min(SR / 2 - 800, bright * 2.5) / f))
    k = np.arange(1, kmax + 1)[:, None]
    return (np.sin(2 * np.pi * f * k * t[None, :] + ph * k) * ((1 / k) * np.exp(-(k * f) / bright))).sum(0)


def pad(notes, d, bright=1400, att=0.5, rel=0.6, detune=0.08):
    """Acorde sustentado: cada nota = 3 serras levemente desafinadas."""
    t = tt(d)
    s = np.zeros(len(t))
    for n in notes:
        for dc in (-detune, 0, detune):
            s += saw(midi(n + dc), t, bright, ph=_rng.uniform(0, 6.28)) / 3
    env = np.minimum(1, t / att) * np.clip((d - t) / rel, 0, 1)
    return s * env / max(1, len(notes))


def pluck(f, d=0.6, damping=0.996):
    """Corda dedilhada (Karplus-Strong): ruído num atraso de 1 período, filtrado a cada volta."""
    n, p = int(d * SR), max(2, int(round(SR / f)))
    out = np.zeros(n + p)
    out[:p] = _rng.uniform(-1, 1, p)
    out[p] = out[0]
    for i in range(p + 1, n + p):
        out[i] = damping * 0.5 * (out[i - p] + out[i - p - 1])
    return fade(out[p:], 0.001, 0.02)


def bass_glide(notes, d, drive=2.0):
    """Baixo senoidal com glide: notes = [(t_rel, midi)], a afinação desliza entre elas."""
    t = tt(d)
    f = np.full(len(t), midi(notes[0][1]))
    for (_, n0), (t1, n1) in zip(notes, notes[1:]):
        i1, g = int(t1 * SR), int(0.06 * SR)
        f[i1:] = midi(n1)
        a = max(0, i1 - g)
        f[a:i1] = np.linspace(midi(n0), midi(n1), i1 - a)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    s = np.tanh(drive * s) / np.tanh(drive)
    return s * np.minimum(1, t / 0.003) * np.exp(-t / 1.1) * np.clip((d - t) / 0.04, 0, 1)


# ------------------------------------------------------------------ bateria
def kick(d=0.5, punch=1.0, tone=46, pitch=180):
    t = tt(d)
    f = tone + pitch * np.exp(-t / 0.025)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22)
    click = filt(noise(d), 3500, 'high') * np.exp(-t / 0.0025) * 0.6
    return np.tanh(2.6 * punch * (body + click)) * np.clip((d - t) / 0.02, 0, 1)


def snare(d=0.3, tone=190):
    t = tt(d)
    return (filt(noise(d), [1600, 9000], 'band') * np.exp(-t / 0.09)
            + np.sin(2 * np.pi * np.cumsum(tone + 60 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.06) * 0.7)


def clap(d=0.35):
    t = tt(d)
    env = np.zeros_like(t)
    for k, o in enumerate([0, 0.007, 0.015, 0.024]):
        env += (t >= o) * np.exp(-np.clip(t - o, 0, None) / (0.004 if k < 3 else 0.12))
    return filt(noise(d), [1000, 8000], 'band') * env


def hat(open_=False):
    t = tt(0.32 if open_ else 0.05)
    return filt(noise(len(t) / SR), 8500, 'high') * np.exp(-t / (0.11 if open_ else 0.014))


def crash(d=2.4):
    t = tt(d)
    s = filt(noise(d), 4500, 'high') * np.exp(-t / 0.9) + filt(noise(d), [2500, 9000], 'band') * np.exp(-t / 0.35) * 0.6
    return s * np.minimum(1, t / 0.002)


def reverse(x, curve=2.0):
    """Versão invertida com entrada em rampa (pratos e impactos ao contrário)."""
    return x[::-1] * np.linspace(0, 1, len(x)) ** curve


# ------------------------------------------------------------------ efeitos de motion
def blip(f, d=0.1):
    t = tt(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-t / (d / 4)) * np.minimum(1, t / 0.001)


def click(f=3000, d=0.025):
    t = tt(d)
    return filt(noise(d), [f * 0.6, f * 1.6], 'band') * np.exp(-t / 0.003)


def pop(f=600, d=0.12):
    t = tt(d)
    return np.sin(2 * np.pi * np.cumsum(f * (1 + 1.5 * np.exp(-t / 0.01))) / SR) * np.exp(-t / 0.03)


def whoosh(d=0.4, f0=300, f1=3000, peak=0.6, q=1.2):
    """Passagem de ar: ruído filtrado deslizando de f0 a f1, envelope com pico em `peak` (0–1)."""
    n = int(d * SR)
    x = sweep(noise(d), f0, f1, q)
    u = np.linspace(0, 1, n)
    env = np.where(u < peak, (u / peak) ** 2, ((1 - u) / (1 - peak)) ** 1.5)
    return x * env


def riser(d, f0=180, f1=1400):
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    return (s * 0.5 + sweep(noise(d), f0 * 2, f1 * 4, 2.0) * 0.6) * (t / d) ** 2


def impact(d=2.0, big=1.0):
    t = tt(d)
    sub = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t / 0.05)) / SR) * np.exp(-t / (0.5 * big))
    hit = filt(noise(d), 2000, 'low') * np.exp(-t / 0.08)
    return np.tanh(1.8 * (sub + hit * 0.8)) * np.clip((d - t) / 0.05, 0, 1)


def glitch(d=0.2, seed_=0):
    r = np.random.default_rng(seed_)
    n, out, i = int(d * SR), np.zeros(int(d * SR)), 0
    while i < n:
        L = int(r.uniform(0.004, 0.025) * SR)
        f = r.uniform(200, 4000)
        seg = np.sign(np.sin(2 * np.pi * f * np.arange(L) / SR)) * r.uniform(0.2, 1)
        out[i:i + L] = seg[: max(0, min(L, n - i))]
        i += L + int(r.uniform(0, 0.01) * SR)
    return filt(out, 9000, 'low') * 0.6


def ticks(t0, t1, rate=16, f=3200):
    """Lista de (instante, som) para rolagens/contadores entre t0 e t1."""
    return [(t, click(f, 0.02)) for t in np.arange(t0, t1, 1 / rate)]


# ------------------------------------------------------------------ mixagem
class Mix:
    """Barramentos estéreo (2, N) criados sob demanda: mix.place('sfx', sinal, t, ganho, pan)."""

    def __init__(self, duration):
        self.duration = float(duration)
        self.N = int(round(SR * self.duration))
        self.buses = {}

    def bus(self, name):
        if name not in self.buses:
            self.buses[name] = np.zeros((2, self.N))
        return self.buses[name]

    def place(self, name, sig, t, g=1.0, pan=0.0):
        buf = self.bus(name)
        i = int(round(t * SR))
        if sig.ndim == 2:
            if i >= self.N:
                return
            if i < 0:
                sig, i = sig[:, -i:], 0
            j = min(self.N, i + sig.shape[1])
            buf[:, i:j] += sig[:, : j - i] * g
            return
        if i >= self.N or i + len(sig) <= 0:
            return
        if i < 0:
            sig, i = sig[-i:], 0
        j = min(self.N, i + len(sig))
        pan = float(np.clip(pan, -1, 1))
        buf[0, i:j] += sig[: j - i] * g * np.cos((pan + 1) * np.pi / 4) * 1.414
        buf[1, i:j] += sig[: j - i] * g * np.sin((pan + 1) * np.pi / 4) * 1.414

    def place_pan(self, name, sig, t, g, p0, p1):
        """Como place, com o panorama deslizando de p0 a p1 ao longo do som."""
        buf = self.bus(name)
        i = int(round(t * SR))
        if i >= self.N:
            return
        j = min(self.N, i + len(sig))
        s = sig[: j - i] * g
        pc = np.clip(np.linspace(p0, p1, len(sig))[: j - i], -1, 1)
        buf[0, i:j] += s * np.cos((pc + 1) * np.pi / 4) * 1.414
        buf[1, i:j] += s * np.sin((pc + 1) * np.pi / 4) * 1.414

    def automate_lowpass(self, name, t0, t1, f0, f1):
        buf = self.bus(name)
        i, j = int(t0 * SR), min(self.N, int(t1 * SR))
        for ch in range(2):
            buf[ch, i:j] = sweep(buf[ch, i:j], f0, f1, kind='low')

    def duck(self, name, times, depth=0.5, release=0.18):
        """Sidechain: abaixa o barramento em `depth` a cada instante de `times`."""
        g = np.ones(self.N)
        r = np.exp(-np.arange(int(release * 4 * SR)) / (release * SR))
        for t in times:
            i = int(t * SR)
            if 0 <= i < self.N:
                k = min(len(r), self.N - i)
                g[i:i + k] = np.minimum(g[i:i + k], 1 - depth * r[:k])
        self.bus(name)[:] *= g

    def render(self, levels=None, reverb=None):
        """Soma os barramentos. levels = {'music': 0.7, ...}; reverb = {'send': 0.6, 'sfx': 0.1, ...}
        (o barramento 'send' e as frações indicadas de cada barramento vão para o reverb)."""
        levels = levels or {}
        out = np.zeros((2, self.N))
        rv = reverb or {}
        send = self.bus('send').copy()
        for name, buf in self.buses.items():
            if name == 'send':
                continue
            out += buf * levels.get(name, 1.0)
            send += buf * rv.get(name, 0.0)
        if np.any(send):
            wet = np.stack([fftconvolve(send[0], ir(2.2, 5))[: self.N], fftconvolve(send[1], ir(2.2, 6))[: self.N]])
            out += wet * rv.get('send', 0.5)
        return out


# ------------------------------------------------------------------ master
def true_peak_limit(x, ceiling_db=-2.2, os_=4):
    """Limitador de pico real: ganho calculado no sinal sobreamostrado (os_ x), com
    antecipação de 2 ms e suavização de 1 ms, aplicado ao sinal original. x: (n, 2)."""
    c = db(ceiling_db)
    up = resample_poly(x, os_, 1, axis=0)
    need = np.minimum(1.0, c / np.maximum(np.abs(up).max(axis=1), 1e-9))
    w = int(0.002 * SR * os_)
    g = uniform_filter1d(minimum_filter1d(need, w), w // 2)
    g = g[: len(g) // os_ * os_].reshape(-1, os_).min(axis=1)
    return x[: len(g)] * g[:, None]


def master(mix, out, lufs=-14.0, tp=-1.5, ceiling_db=-2.6, fade_in=0.002, fade_out=0.6, drive=0.85):
    """mix (2, N) -> WAV 48 kHz 16 bits em `out`, normalizado para `lufs` (loudnorm em duas
    passagens, linear) e com pico real ≤ ceiling_db, para o MP4 ficar ≤ -1 dBTP depois do AAC."""
    mix = np.array(mix, dtype=np.float64)
    N = mix.shape[1]
    t = np.arange(N) / SR
    mix *= np.clip(t / max(fade_in, 1e-6), 0, 1) * np.clip((N / SR - t) / max(fade_out, 1e-6), 0, 1)
    mix = filt(mix, 28, 'high')
    body = np.percentile(np.abs(mix), 99.7)
    if body <= 1e-9:
        raise ValueError('mixagem em silêncio: nada para masterizar')
    mix = np.tanh(mix / body * drive) * 0.8                      # saturação suave: segura os transientes

    os.makedirs(os.path.dirname(out), exist_ok=True)
    raw = out + '.raw.wav'
    wavfile.write(raw, SR, (mix.T * 32767).astype(np.int16))
    lim = f'I={lufs}:TP={tp}:LRA=11'
    meas = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', raw, '-af', f'loudnorm={lim}:print_format=json', '-f', 'null', '-'],
                          capture_output=True, text=True).stderr
    js = json.loads(meas[meas.rindex('{'):meas.rindex('}') + 1])
    af = (f"loudnorm={lim}:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
          f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af', af, '-ar', str(SR), '-c:a', 'pcm_s16le', out], check=True)
    os.remove(raw)
    x = wavfile.read(out)[1].astype(np.float64) / 32768
    # o limitador tira um pouco de loudness: corrige o ganho e limita de novo até ficar a ±0,2 LU do alvo
    gain = 0.0
    for _ in range(4):
        y = true_peak_limit(x * db(gain), ceiling_db)
        I = measure_lufs(y)
        if abs(I - lufs) <= 0.2:
            break
        gain += lufs - I
    if len(y) < N:                                               # mantém a duração exata do vídeo
        y = np.vstack([y, np.zeros((N - len(y), 2))])
    wavfile.write(out, SR, np.round(y[:N] * 32767).astype(np.int16))
    print(f"ok -> {out} | entrada {js['input_i']} LUFS -> {I:.1f} LUFS (alvo {lufs})")
    return out


def measure_lufs(x):
    """Loudness integrado (EBU R128, via ffmpeg) de um sinal (n, 2) em float."""
    import tempfile
    with tempfile.NamedTemporaryFile(suffix='.wav') as f:
        wavfile.write(f.name, SR, x.astype(np.float32))
        e = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', f.name, '-af', 'ebur128', '-f', 'null', '-'],
                           capture_output=True, text=True).stderr
    summ = e[e.rindex('Summary:'):]
    return float(summ.split('I:')[1].split('LUFS')[0])


def load_cues(reel_root):
    """Lê audio/cues.json exportado por `node tools/render.cjs cues <reel>`."""
    p = os.path.join(reel_root, 'audio', 'cues.json')
    if not os.path.exists(p):
        raise SystemExit(f'{p} não existe: rode antes `node tools/render.cjs cues <reel>`')
    return json.load(open(p))
