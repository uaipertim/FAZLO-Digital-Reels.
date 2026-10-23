#!/usr/bin/env python3
"""
Série Explica (FAZLO Digital) — o som de um episódio: a narração + uma trilha contínua própria + efeitos, tudo
sintetizado aqui (numpy/scipy, sem samples), menos a voz.

    python3 series/explica/scripts/audio.py explica-01   -> audio/explica-01/mix.wav (48 kHz, estéreo, −14 LUFS,
                                                            pico real ≤ −1,8 dBTP antes do AAC) + as pistas separadas
                                                            (voz-tratada.wav, trilha.wav, efeitos.wav) para a revisão

VOZ    audio/<id>/voz.wav (montada por linha.py, um bloco inteiro por capítulo): cada capítulo com um ganho só (o mesmo
       do começo ao fim, até ±3 dB, para todos ficarem no mesmo nível), passa-altas em 80 Hz e compressão leve.
TRILHA "Página em construção", 100 BPM, em Lá bemol maior (a tonalidade da assinatura da marca):
       Ré bemol 7M(9) → Lá bemol/Dó (9) → Fá m7(9) → Mi bemol sus, um acorde a cada 2 compassos. Teclado FM em
       síncope (tempos 1, 2-e e 4), cama de serras bem filtradas, baixo senoidal, bumbo macio nos tempos 1 e 3, aro
       nos tempos 2 e 4 e chocalho em semicolcheias. Contínua do quadro 0 até a logo, onde resolve em Lá bemol.
       Fica ~15 LU abaixo da voz e abaixa até 7 dB enquanto ela fala (ataque 60 ms, soltura 450 ms).
EFEITOS nos instantes exportados pela animação (audio/<id>/cues.json):
       corte       "o corte" da marca (fzbrand.sig_cut, a varredura da esquerda para a direita) quando a barra
                   diagonal cruza o centro da tela, a cada troca de capítulo;
       bloco       a parte encaixa no bloco do celular: estalo seco, grave curto e um sino FM que sobe um grau da
                   escala de Lá bemol a cada capítulo (01 → 07);
       logo        a assinatura completa (varredura + Lá bemol 5 → Mi bemol 6) no corte que deixa só a logo;
       e os toques curtos da construção: painel que monta, etiqueta que acende, campo preenchendo, check, balões,
       pino, rota, mensagem, rolagem, carregamento, zoom riscado, ações do fecho, digitação e cursor.
"""
import json
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.ndimage import uniform_filter1d

SERIE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(os.path.dirname(SERIE))
sys.path.insert(0, os.path.join(REPO, 'tools', 'audio'))
from fzaudio import (SR, Mix, adsr, click, db, filt, fm, kick, measure_lufs, midi, noise, pad, pop,  # noqa: E402
                     riser, seed, sweep, true_peak_limit, tt, whoosh)
from fzbrand import fm_bell, sig_cut, sig_motif  # noqa: E402

EP = sys.argv[1] if len(sys.argv) > 1 else 'explica-01'
AUD = os.path.join(SERIE, 'audio', EP)
LN = json.load(open(os.path.join(AUD, 'linha.json')))
CUES = json.load(open(os.path.join(AUD, 'cues.json')))['cues']
DUR = float(LN['duracao'])
N = int(round(DUR * SR))
seed(1907)
ESCALA = [80, 82, 84, 87, 89, 92, 94, 96]          # Lá bemol 5, Si bemol 5, Dó 6, Mi bemol 6, Fá 6, Lá bemol 6, Si bemol 6, Dó 7


# ------------------------------------------------------------------ timbres da série
def vidro(f, d=0.9, brilho=1.0):
    """Toque de vidro FM curto (a "peça" da página): razão 2,0, índice que cai rápido."""
    t = tt(d)
    idx = 1.4 * brilho * np.exp(-t / 0.05)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 2.0 * t)) + 0.18 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t / 0.05)
    return s * np.exp(-t / (d / 3.5)) * np.minimum(1, t / 0.0015)


def tecla(f, d=1.2, vel=1.0):
    """Teclado FM (piano elétrico): razão 1, índice decaindo, leve batimento."""
    t = tt(d)
    idx = 1.6 * vel * np.exp(-t / 0.18)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t)) + 0.3 * np.sin(2 * np.pi * f * 1.003 * t)
    s += 0.12 * np.sin(2 * np.pi * f * 4.0 * t) * np.exp(-t / 0.03)
    return s * np.exp(-t / 0.55) * np.minimum(1, t / 0.003) * np.clip((d - t) / 0.05, 0, 1) * vel


def estalo(f=2600):
    t = tt(0.04)
    return filt(noise(0.04), [f * 0.6, f * 1.8], 'band') * np.exp(-t / 0.004) + np.sin(2 * np.pi * f * 0.5 * t) * np.exp(-t / 0.008) * 0.4


def baque(f=58, d=0.35):
    t = tt(d)
    return np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f + 70 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.09))


def digitacao(d):
    out = np.zeros(int((d + 0.1) * SR))
    tcur, r = 0.0, np.random.default_rng(int(d * 1000))
    while tcur < d:
        s = estalo(2200 + 1800 * r.random()) * (0.6 + 0.4 * r.random())
        i = int(tcur * SR)
        out[i:i + len(s)] += s[: max(0, len(out) - i)]
        tcur += 1 / 20 * (0.7 + 0.6 * r.random())
    return out


def brilho():
    out = np.zeros(int(0.7 * SR))
    for k, n in enumerate([87, 92, 96, 99]):
        s = vidro(midi(n), 0.5, 0.6) * 0.5
        i = int(k * 0.045 * SR)
        out[i:i + len(s)] += s[: len(out) - i]
    return out


def soma(*xs):
    out = np.zeros(max(len(x) for x in xs))
    for x in xs:
        out[:len(x)] += x
    return out


def bolha(f=620):
    return soma(pop(f, 0.12), estalo(4200) * 0.25)


# ------------------------------------------------------------------ voz
mix = Mix(DUR)
vpath = os.path.join(AUD, 'voz.wav')
if os.path.exists(vpath) and not LN.get('provisorio'):
    voz = wavfile.read(vpath)[1].astype(np.float64)
    voz = np.concatenate([voz, np.zeros(max(0, N - len(voz)))])[:N]
    for c in LN['colocacao']:                               # um ganho só por capítulo
        a = int(round(c['no_video_s'] * SR)); b = a + c['amostras']
        seg = voz[a:b]
        rms = np.sqrt(np.mean(seg[np.abs(seg) > 0.01] ** 2)) + 1e-9
        voz[a:b] = seg * np.clip(0.1 / rms, db(-3), db(3))
    voz = filt(voz, 80, 'high')
    env = np.sqrt(uniform_filter1d(voz ** 2, int(0.03 * SR)) + 1e-12)
    voz = voz * uniform_filter1d(np.minimum(1.0, (db(-20) / np.maximum(env, 1e-9)) ** 0.4), int(0.01 * SR))
else:
    print('  (sem voz: linha do tempo provisória — só a trilha e os efeitos, para teste)')
    voz = np.zeros(N)

# ------------------------------------------------------------------ efeitos
caps = LN['capitulos']
for c in CUES:
    t, ty, k = c['t'], c['type'], c.get('k', 0)
    d = c.get('d', 0.4)
    if ty == 'corte':
        sig_cut(mix, t + LN['tr'] / 2 - 0.13, g=0.85, big=True)
        mix.place('sfx', baque(52, 0.4) * 0.5, t + LN['tr'] / 2 - 0.02, 0.35)
    elif ty == 'titulo':
        mix.place_pan('sfx', whoosh(0.32, 2400, 700, 0.35, 1.3), t, 0.12, -0.3, 0.3)
    elif ty == 'apoio':
        pass
    elif ty == 'monta':
        mix.place('sfx', whoosh(0.35, 500, 2600, 0.7, 1.1), t - 0.12, 0.10)
        mix.place('sfx', vidro(midi(68 + 3 * (k % 2)), 0.6, 0.5), t + 0.02, 0.22); mix.place('send', vidro(midi(68), 0.6, 0.5), t, 0.08)
    elif ty == 'etiquetas' or ty == 'esqueleto':
        for j in range(3):
            mix.place('sfx', estalo(3200 + 300 * j), t + 0.08 * j, 0.16)
    elif ty == 'acende':
        s = vidro(midi(ESCALA[2 + k % 5]), 0.8)
        mix.place('sfx', s, t, 0.26, -0.2 + 0.2 * k); mix.place('send', s, t, 0.12)
    elif ty == 'foto':
        mix.place('sfx', riser(0.55, 400, 2400) * 0.6, t - 0.1, 0.10); mix.place('sfx', brilho(), t + 0.4, 0.14)
    elif ty == 'digita':
        mix.place('sfx', digitacao(d), t, 0.14)
    elif ty == 'pino':
        f = midi(80) * np.exp(-tt(0.18) / 0.06)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt(0.18) / 0.05)
        mix.place('sfx', s, t + 0.15, 0.22); mix.place('sfx', estalo(1800), t + 0.32, 0.25)
    elif ty == 'balao':
        mix.place('sfx', bolha(560 + 90 * (k % 4)), t, 0.24, 0.3)
    elif ty == 'estoura':
        mix.place('sfx', bolha(900), t, 0.2); mix.place('sfx', filt(noise(0.08), [3000, 9000], 'band') * np.exp(-tt(0.08) / 0.02), t, 0.12)
    elif ty == 'surge':
        mix.place('sfx', whoosh(0.4, 300, 1800, 0.6, 1.2), t - 0.1, 0.10)
    elif ty == 'campo':
        mix.place('sfx', riser(0.3, 600, 2600) * 0.5, t, 0.10); mix.place('sfx', vidro(midi(ESCALA[k % 4]), 0.5, 0.7), t + 0.15, 0.20)
    elif ty == 'mais':
        mix.place('sfx', estalo(2400), t, 0.3); mix.place('sfx', vidro(midi(87), 0.4), t + 0.04, 0.14)
    elif ty == 'botao':
        for n in (84, 87, 91):
            mix.place('sfx', tecla(midi(n), 1.2, 0.8), t, 0.12); mix.place('send', tecla(midi(n), 1.2), t, 0.05)
        mix.place('sfx', estalo(2000), t, 0.25)
    elif ty == 'brilho':
        mix.place('sfx', brilho(), t, 0.18); mix.place('send', brilho(), t, 0.1)
    elif ty == 'check':
        mix.place('sfx', vidro(midi(87), 0.45), t, 0.22); mix.place('sfx', vidro(midi(91), 0.6), t + 0.07, 0.2)
    elif ty == 'rota':
        j = 0
        while j * 0.14 < d:
            mix.place('sfx', vidro(midi(ESCALA[j % 6]), 0.25, 0.4), t + j * 0.14, 0.07, -0.4 + 0.8 * j * 0.14 / max(d, 0.1)); j += 1
    elif ty == 'anda':
        mix.place_pan('sfx', whoosh(max(0.4, d), 300, 1500, 0.7, 1.4), t, 0.07, -0.4, 0.4)
    elif ty == 'mensagem':
        mix.place_pan('sfx', whoosh(0.35, 600, 3600, 0.5, 1.3), t - 0.08, 0.14, -0.5, 0.5); mix.place('sfx', bolha(760), t + 0.22, 0.26)
    elif ty == 'voa':
        mix.place_pan('sfx', whoosh(0.4, 900, 3000, 0.6, 1.4), t, 0.10, -0.3, 0.3)
    elif ty == 'encaixa':
        mix.place('sfx', estalo(2600), t, 0.3); mix.place('sfx', vidro(midi(ESCALA[2 + k % 4]), 0.5), t, 0.18)
    elif ty == 'visto':
        mix.place('sfx', estalo(3600), t, 0.25); mix.place('sfx', estalo(3900), t + 0.1, 0.25)
    elif ty == 'digitando':
        pass
    elif ty == 'rola':
        j = 0
        while j * 0.09 < d:
            mix.place('sfx', estalo(3400 + 200 * np.sin(j)), t + j * 0.09, 0.05 + 0.04 * np.sin(np.pi * j * 0.09 / d)); j += 1
    elif ty == 'carrega':
        mix.place('sfx', riser(d, 300, 2400) * 0.7, t, 0.14); mix.place('sfx', vidro(midi(92), 0.6), t + d, 0.2)
    elif ty == 'risca':
        mix.place('sfx', sweep(noise(0.22), 4000, 900, 1.6) * np.exp(-tt(0.22) / 0.08), t + 0.1, 0.3)
    elif ty == 'cresce':
        mix.place('sfx', riser(0.7, 200, 1600) * 0.8, t, 0.12); mix.place('sfx', baque(60, 0.4), t + 0.68, 0.25)
    elif ty == 'acao':
        mix.place('sfx', bolha(600 + 120 * k), t, 0.28); mix.place('sfx', vidro(midi(ESCALA[2 + 2 * k]), 0.7), t + 0.02, 0.2); mix.place('send', vidro(midi(ESCALA[2 + 2 * k]), 0.7), t, 0.1)
    elif ty in ('cursor_on', 'cursor'):
        mix.place('sfx', estalo(4200), t, 0.14)
    elif ty == 'conta':
        mix.place('sfx', vidro(midi(ESCALA[k]), 0.35, 0.6), t, 0.15, -0.6 + 0.2 * k)
    elif ty == 'faixa_sai':
        mix.place_pan('sfx', whoosh(0.35, 800, 3000, 0.4, 1.2), t, 0.12, 0, 0.7)
    elif ty == 'encolhe':
        mix.place_pan('sfx', whoosh(0.6, 2600, 500, 0.5, 1.1), t, 0.14, -0.2, 0.6)
    elif ty == 'pousa':
        mix.place('sfx', estalo(3000), t, 0.25); mix.place('sfx', vidro(midi(80), 0.6), t, 0.12, 0.6)
    elif ty == 'voa_parte':
        mix.place_pan('sfx', whoosh(0.62, 400, 3400, 0.75, 1.2), t, 0.16, -0.2, 0.7)
    elif ty == 'bloco':
        n = ESCALA[min(7, k - 1)]
        mix.place('sfx', estalo(2800), t, 0.35, 0.6); mix.place('sfx', baque(66, 0.25), t, 0.22)
        b = fm_bell(midi(n), 1.6, 0.7)
        mix.place('sfx', b, t, 0.16, 0.6); mix.place('send', b, t, 0.12)
    elif ty == 'toque':
        mix.place('sfx', estalo(3800), t, 0.3); mix.place('sfx', bolha(700), t + 0.02, 0.18)
    elif ty == 'logo':
        sig_cut(mix, t + 0.12, g=1.0, big=True)
        sig_motif(mix, t + 0.36, 0.3, g=0.9)
    else:
        raise SystemExit(f'cue desconhecido: {ty}')

# ------------------------------------------------------------------ a trilha contínua
BPM = 100.0
BT = 60.0 / BPM
ACORDES = [  # (baixo, notas)
    (49, [61, 65, 68, 72, 75]),     # Ré bemol 7M(9)
    (48, [60, 63, 68, 70, 75]),     # Lá bemol/Dó (9)
    (53, [60, 63, 65, 68, 72]),     # Fá m7(9)
    (51, [58, 63, 65, 70, 75]),     # Mi bemol sus
]
fim_f = caps[-1].get('corte_logo', [DUR - 3.5])[0]         # a música resolve quando entra a logo
compasso = 4 * BT
mus = Mix(DUR)
k_ac, t_ac = 0, 0.0
while t_ac < fim_f:
    baixo, notas = ACORDES[k_ac % 4]
    d_ac = min(2 * compasso, fim_f - t_ac)
    mus.place('cama', pad(notas, d_ac + 0.8, bright=900, att=0.6, rel=0.8, detune=0.06), t_ac, 0.5)
    for cmp in range(2):
        t_cmp = t_ac + cmp * compasso
        for bt, vel in ((0, 1.0), (1.5, 0.75), (3, 0.85)):           # o teclado em síncope
            tn = t_cmp + bt * BT
            if tn >= fim_f:
                continue
            for j, n in enumerate(notas[1:4]):
                mus.place('teclas', tecla(midi(n), 1.0, vel * 0.8), tn + 0.006 * j, 0.10, -0.25 + 0.25 * j)
        for bt in (0, 2.5):                                           # o baixo
            tn = t_cmp + bt * BT
            if tn < fim_f:
                tb = tt(BT * 1.4)
                s = np.sin(2 * np.pi * midi(baixo - 12) * tb) * adsr(len(tb), 0.006, 0.25, 0.6, 0.12)
                mus.place('baixo', np.tanh(1.5 * s), tn, 0.5)
        for bt in range(4):                                           # bumbo 1 e 3, aro 2 e 4
            tn = t_cmp + bt * BT
            if tn >= fim_f:
                continue
            if bt % 2 == 0:
                mus.place('bateria', kick(0.4, 0.6, 50, 120), tn, 0.30)
            else:
                rim = filt(noise(0.05), [1500, 6000], 'band') * np.exp(-tt(0.05) / 0.008) + np.sin(2 * np.pi * 1700 * tt(0.05)) * np.exp(-tt(0.05) / 0.006) * 0.5
                mus.place('bateria', rim, tn, 0.16, 0.15)
        for q in range(16):                                           # chocalho em semicolcheias, com balanço
            tn = t_cmp + q * BT / 4 + (0.018 if q % 2 else 0)
            if tn >= fim_f:
                break
            s = filt(noise(0.05), [6500, 13000], 'band') * np.exp(-tt(0.05) / 0.012)
            mus.place('bateria', s, tn, 0.035 if q % 4 else 0.06, 0.35)
    t_ac += 2 * compasso
    k_ac += 1
# a resolução na logo: Lá bemol (9) sustentado, sumindo até o fim
res = pad([56, 63, 68, 70, 72, 75], DUR - fim_f + 0.5, bright=1100, att=0.25, rel=max(0.5, DUR - fim_f - 0.5))
mus.place('cama', res, fim_f, 0.55)
mus.place('baixo', np.sin(2 * np.pi * midi(44) * tt(DUR - fim_f)) * np.exp(-tt(DUR - fim_f) / 1.2), fim_f + 0.36, 0.4)

# ------------------------------------------------------------------ níveis, ducking e master
musica = mus.render(levels={'cama': 0.9, 'teclas': 1.0, 'baixo': 0.8, 'bateria': 0.9}, reverb={'teclas': 0.25, 'cama': 0.1, 'send': 0.5})
efeitos = mix.render(levels={'sfx': 1.0}, reverb={'send': 0.55, 'sfx': 0.12})
t = np.arange(N) / SR
musica *= np.clip(t / 0.4, 0, 1)
# ducking: a trilha abaixa até 7 dB enquanto a voz fala
venv = np.sqrt(uniform_filter1d(voz ** 2, int(0.02 * SR)) + 1e-12)
ativo = np.clip((venv - db(-46)) / (db(-32) - db(-46)), 0, 1)
g = np.empty(N)
a_at, a_so = np.exp(-1 / (0.06 * SR)), np.exp(-1 / (0.45 * SR))
acc = 0.0
for i in range(0, N, 48):                              # em blocos de 1 ms (rápido e suave)
    v = ativo[i]
    q = a_at ** 48 if v > acc else a_so ** 48
    acc = q * acc + (1 - q) * v
    g[i:i + 48] = acc
musica *= 1 - (1 - db(-7)) * g
efeitos *= 1 - (1 - db(-4)) * g
# a trilha ~15 LU abaixo da voz (medidas sem ducking, na voz só onde há fala)
voz2 = np.stack([voz, voz])
if np.any(voz):
    Lv = measure_lufs(voz2.T)
    Lm = measure_lufs(musica.T)
    musica *= db((Lv - 15.0) - Lm)
    Le = measure_lufs(efeitos.T)
    efeitos *= db((Lv - 12.0) - Le)
else:
    musica *= db(-30 - measure_lufs(musica.T))
    efeitos *= db(-27 - measure_lufs(efeitos.T))
total = voz2 + musica + efeitos
total = filt(total, 30, 'high')
total *= np.clip((DUR - t) / 0.08, 0, 1)
x = total.T / max(1e-9, np.abs(total).max()) * 0.5
gain = 0.0
for _ in range(6):
    y = true_peak_limit(x * db(gain), -1.8)
    I = measure_lufs(y)
    if abs(I + 14.0) <= 0.1:
        break
    gain += -14.0 - I
if len(y) < N:
    y = np.vstack([y, np.zeros((N - len(y), 2))])
y = y[:N]
wavfile.write(os.path.join(AUD, 'mix.wav'), SR, np.round(np.clip(y, -1, 1) * 32767).astype(np.int16))
esc = db(gain) * 0.5 / max(1e-9, np.abs(total).max())
for nome, sig in (('voz-tratada', voz2), ('trilha', musica), ('efeitos', efeitos)):
    wavfile.write(os.path.join(AUD, nome + '.wav'), SR, (np.clip(sig.T * esc, -1, 1)).astype(np.float32))
print(f'ok -> {os.path.relpath(os.path.join(AUD, "mix.wav"), REPO)} | {I:.2f} LUFS | {len(CUES)} cues')
