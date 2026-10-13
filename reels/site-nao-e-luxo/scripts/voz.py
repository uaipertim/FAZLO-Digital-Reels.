#!/usr/bin/env python3
"""
Narração (teste) do "Site não é luxo": voz sintética do ElevenLabs, uma fala por arquivo.

  voz      Raquel - Expressive and Energetic (biblioteca do ElevenLabs, PT-BR) · GDzHdQOi6jjf8zaXhCYD
  modelo   eleven_v4 · estabilidade 0,5 · similaridade 0,75 · language_code pt · semente fixa por fala
  contexto cada fala vai com a anterior e a seguinte (previous_text / next_text): a entonação
           continua de um arquivo para o outro
  saída    MP3 44,1 kHz 128 kbps (o máximo do plano Starter) + alinhamento por caractere

A chave NÃO passa por este arquivo: no ambiente de nuvem ela fica nos Segredos de rede e o proxy
injeta o cabeçalho xi-api-key. Fora dele, exporte ELEVENLABS_API_KEY (nunca em arquivo).

    python3 reels/site-nao-e-luxo/scripts/voz.py gerar           -> audio/voz/<fala>.mp3 (só as que faltam)
    python3 reels/site-nao-e-luxo/scripts/voz.py takes <fala> 1,2,3 <pasta>   (tomadas extras, para escolher)
    python3 reels/site-nao-e-luxo/scripts/voz.py posicionar      -> audio/voz/voz.json (onde cada fala entra)
    python3 reels/site-nao-e-luxo/scripts/audio.py --voz         -> audio/trilha-voz.wav
    python3 reels/site-nao-e-luxo/scripts/voz.py video           -> output/site-nao-e-luxo-voz.mp4

O vídeo com voz reaproveita a imagem do MP4 sem voz (cópia do fluxo, sem renderizar de novo):
os textos na tela são os mesmos. A versão sem voz (audio/trilha.wav e o MP4 dela) não muda.
"""
import base64
import json
import os
import subprocess
import sys

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, 'audio', 'voz')
MANIFESTO = os.path.join(DIR, 'voz.json')
VIDEO_SEM_VOZ = os.path.join(ROOT, 'output', 'fazlo-digital-site-nao-e-luxo.mp4')
VIDEO_COM_VOZ = os.path.join(ROOT, 'output', 'site-nao-e-luxo-voz.mp4')
TRILHA_VOZ = os.path.join(ROOT, 'audio', 'trilha-voz.wav')
SR = 48000

VOZ = {'id': 'GDzHdQOi6jjf8zaXhCYD', 'nome': 'Raquel - Expressive and Energetic'}
MODELO = 'eleven_v4'
AJUSTES = {'stability': 0.5, 'similarity_boost': 0.75}
FORMATO = 'mp3_44100_128'
SEMENTE = 2026                      # a da amostra aprovada
# FAZLO na tela; na API, a grafia que soa "FÁZ-lo" (com a força na 1ª sílaba). "FAZLO" já sai certo:
# lido como palavra (0,48 s, sem soletrar), com "FAZ" 12 dB mais forte e duas vezes mais longo que "lo"
FAZLO_API = 'FAZLO'

# fala: texto, janela da cena (s) e onde ela entra: `ancora` (trecho da fala) começa em `em`.
# pausa_max: pausas internas mais longas que isso são encurtadas (corte no silêncio, sem esticar a voz)
FALAS = [
    {'id': '1-gancho',   'janela': (0.0, 4.2),   'ancora': 'Site', 'em': 0.30,
     'texto': 'Site é coisa de pousada grande?'},
    {'id': '2-mito',     'janela': (4.2, 6.6),   'ancora': 'Tem', 'em': 4.50,
     'texto': 'Tem gente que acha que é luxo…'},
    {'id': '3-nao-e',    'janela': (6.6, 9.0),   'ancora': 'Não', 'em': 6.60,
     'texto': 'Não é.'},
    {'id': '4-basico',   'janela': (9.0, 18.0),  'ancora': 'Uma', 'em': 9.02, 'pausa_max': 0.30,
     'texto': 'Uma pousada pequena precisa do básico bem feito: fotos de cada quarto, consulta de datas, '
              'como chegar… e o WhatsApp à vista.'},
    # entra com a noite (18,0): a notificação (19,2) cai na pausa natural depois de "trabalha"
    {'id': '5-trabalha', 'janela': (18.0, 25.8), 'ancora': 'E o site', 'em': 18.00,
     'texto': 'E o site trabalha até quando você não pode atender. A consulta chega à noite… '
              'e de manhã é só responder.'},
    # "É ser encontrada" logo depois do ataque do golpe (27,9); "Não é luxo." cai com NÃO É / LUXO. na tela
    {'id': '6-virada',   'janela': (25.8, 30.0), 'ancora': 'É ser', 'em': 27.95,
     'texto': 'Não é luxo. É ser encontrada.'},
    # termina antes do fade final (32,75)
    {'id': '7-cta',      'janela': (30.0, 33.0), 'ancora': 'Fale', 'em': 30.35,
     'texto': 'Fale com a FAZLO. Link na bio.'},
]
SEMENTES = {'2-mito': 7}            # tomada escolhida quando não é a SEMENTE (a 2026 passava do golpe)


def api_texto(s):
    return s.replace('FAZLO', FAZLO_API)


def gerar(f, semente, destino):
    import requests
    i = next(k for k, x in enumerate(FALAS) if x['id'] == f['id'])
    body = {'text': api_texto(f['texto']), 'model_id': MODELO, 'language_code': 'pt',
            'voice_settings': AJUSTES, 'seed': semente,
            'previous_text': api_texto(FALAS[i - 1]['texto']) if i > 0 else None,
            'next_text': api_texto(FALAS[i + 1]['texto']) if i + 1 < len(FALAS) else None}
    head = {'Content-Type': 'application/json'}
    if os.environ.get('ELEVENLABS_API_KEY'):
        head['xi-api-key'] = os.environ['ELEVENLABS_API_KEY']
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOZ['id']}/with-timestamps?output_format={FORMATO}"
    r = requests.post(url, json={k: v for k, v in body.items() if v is not None}, headers=head, timeout=180)
    if r.status_code != 200:
        raise SystemExit(f"{f['id']}: HTTP {r.status_code} {r.text[:300]}")
    d = r.json()
    os.makedirs(destino, exist_ok=True)
    base = os.path.join(destino, f"{f['id']}" + ('' if destino == DIR else f'-s{semente}'))
    open(base + '.mp3', 'wb').write(base64.b64decode(d['audio_base64']))
    json.dump({'texto_api': body['text'], 'semente': semente, 'alinhamento': d['alignment']},
              open(base + '.json', 'w'), ensure_ascii=False)
    return base


def decodifica(mp3):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def envelope(x, win=0.01):
    n = int(win * SR)
    return np.sqrt(np.convolve(x ** 2, np.ones(n) / n, mode='same') + 1e-12)


def fronteiras(x, limiar_db=-38):
    """Início e fim acústicos da fala (envelope acima de limiar_db em relação ao pico)."""
    e = envelope(x)
    on = np.where(e > e.max() * 10 ** (limiar_db / 20))[0]
    return on[0] / SR, on[-1] / SR


def encurta_pausas(x, pausa_max, limiar_db=-36, xf=0.015):
    """Pausas internas mais longas que pausa_max ficam com pausa_max: tira o meio do silêncio,
    com transição de xf. Devolve o sinal e os cortes [(instante no original, segundos tirados)]."""
    e = envelope(x, 0.02)
    mudo = e < e.max() * 10 ** (limiar_db / 20)
    ini, fim = fronteiras(x)
    cortes, i, n = [], int(ini * SR), int(fim * SR)
    while i < n:
        if not mudo[i]:
            i += 1
            continue
        j = i
        while j < n and mudo[j]:
            j += 1
        if (j - i) / SR > pausa_max:
            cortes.append((i + int(pausa_max / 2 * SR), (j - i) - int(pausa_max * SR)))
        i = j
    y, k, nx = [], 0, int(xf * SR)
    for a, tira in cortes:
        y.append(x[k:a])
        k = a + tira
    y.append(x[k:])
    out = y[0]
    rampa = np.sin(np.linspace(0, np.pi / 2, nx)) ** 2
    for seg in y[1:]:                                   # emenda com transição de potência constante
        out = np.concatenate([out[:-nx], out[-nx:] * (1 - rampa) + seg[:nx] * rampa, seg[nx:]])
    return out, [(a / SR, tira / SR) for a, tira in cortes]


def carregar(f, base=None):
    """Sinal pronto da fala (48 kHz mono), com as pausas encurtadas se a fala pedir, e os cortes."""
    x = decodifica((base or os.path.join(DIR, f['id'])) + '.mp3')
    if f.get('pausa_max'):
        return encurta_pausas(x, f['pausa_max'])
    return x, []


def no_editado(t, cortes):
    return t - sum(tira for a, tira in cortes if a < t)


def ancora_em(f, meta, x, cortes=()):
    """Instante (no arquivo) em que a âncora começa a soar: alinhamento + ataque acústico logo depois."""
    al = meta['alinhamento']
    txt = ''.join(al['characters'])
    k = txt.find(api_texto(f['ancora']))
    t_al = no_editado(al['character_start_times_seconds'][k], cortes)
    ini, _ = fronteiras(x)
    if k == 0 or t_al <= ini + 0.05:
        return ini
    # dentro da fala: o ataque é o ponto de energia mais baixa antes da subida, perto do alinhamento
    e = envelope(x, 0.02)
    a, b = int((t_al - 0.15) * SR), int((t_al + 0.12) * SR)
    vale = a + int(np.argmin(e[a:b]))
    sobe = vale + int(np.argmax(e[vale:b] > e[vale] * 3)) if np.any(e[vale:b] > e[vale] * 3) else vale
    return sobe / SR


def medir(f, base):
    meta = json.load(open(base + '.json'))
    x, cortes = carregar(f, base)
    ini, fim = fronteiras(x)
    t_anc = ancora_em(f, meta, x, cortes)
    t0 = f['em'] - t_anc                       # onde o arquivo começa na timeline do Reel
    return {'arquivo_ini': round(t0, 3), 'fala_ini': round(t0 + ini, 3), 'fala_fim': round(t0 + fim, 3),
            'duracao_fala': round(fim - ini, 3), 'ancora': f['ancora'], 'ancora_em': f['em'],
            'pausas_encurtadas': [{'em': round(a, 3), 'tirado': round(t, 3)} for a, t in cortes]}


def posicionar():
    out = {'voz': VOZ, 'modelo': MODELO, 'ajustes': AJUSTES, 'formato': FORMATO,
           'contexto': 'previous_text / next_text', 'fazlo_api': FAZLO_API, 'falas': []}
    problemas = []
    for f in FALAS:
        base = os.path.join(DIR, f['id'])
        meta = json.load(open(base + '.json'))
        m = medir(f, base)
        j0, j1 = f['janela']
        cabe = m['fala_ini'] >= j0 - 0.02 and m['fala_fim'] <= j1 - 0.05
        out['falas'].append({'id': f['id'], 'texto': f['texto'], 'texto_api': meta['texto_api'],
                             'semente': meta['semente'], 'arquivo': f"{f['id']}.mp3", 'janela': [j0, j1], **m,
                             'cabe': bool(cabe)})
        print(f"{'ok   ' if cabe else 'NÃO CABE'} {f['id']:11} {m['fala_ini']:6.2f}–{m['fala_fim']:5.2f} s "
              f"({m['duracao_fala']:.2f} s) · janela {j0:.1f}–{j1:.1f} · semente {meta['semente']}")
        if not cabe:
            problemas.append(f['id'])
    # falas não podem se sobrepor
    fs = out['falas']
    for a, b in zip(fs, fs[1:]):
        if b['fala_ini'] - a['fala_fim'] < 0.15:
            problemas.append(f"{a['id']}→{b['id']} sem respiro ({b['fala_ini'] - a['fala_fim']:.2f} s)")
    json.dump(out, open(MANIFESTO, 'w'), ensure_ascii=False, indent=2)
    if problemas:
        print('ATENÇÃO:', '; '.join(problemas))
    return not problemas


# ------------------------------------------------------------------ mixagem (chamada por audio.py --voz)
DUCK_TRILHA = -9.0          # música e groove sob a voz (dB, banda toda)
DUCK_EFEITOS = -12.0        # efeitos sob a voz, só na faixa da fala (200 Hz–6 kHz): o ataque e o grave ficam
DUCK_EFEITOS_RESTO = -3.0   # o resto do espectro dos efeitos
FAIXA_FALA = (200, 6000)
VOZ_ACIMA = 2.0             # loudness da voz em relação à trilha cheia (dB)


def _suaviza(alvo, ataque, soltura, cr=1000):
    """Ganho de controle (cr Hz) com ataque/soltura de um polo."""
    a_at, a_so = np.exp(-1 / (ataque * cr)), np.exp(-1 / (soltura * cr))
    g, y = 1.0, np.empty(len(alvo))
    for i, v in enumerate(alvo):
        k = a_at if v < g else a_so
        g = k * g + (1 - k) * v
        y[i] = g
    return y


def atividade(v, cr=1000, buraco=0.25):
    """Onde a voz soa (controle a cr Hz); buracos menores que `buraco` (entre palavras) contam como fala."""
    e = envelope(v, 0.02)[:: SR // cr]
    on = e > e.max() * 10 ** (-34 / 20)
    i, n = 0, len(on)
    while i < n:
        if on[i]:
            i += 1
            continue
        j = i
        while j < n and not on[j]:
            j += 1
        if 0 < i and j < n and (j - i) / cr < buraco:
            on[i:j] = True
        i = j
    return on


def ganho(on, prof_db, ataque, soltura, antecipa=0.0, n=None, cr=1000):
    on = on.copy()
    k = int(antecipa * cr)
    if k:
        on[:-k] |= on[k:]
    g = _suaviza(np.where(on, 10 ** (prof_db / 20), 1.0), ataque, soltura, cr)
    return np.interp(np.arange(n) / SR, np.arange(len(g)) / cr, g)


def _banda(x):
    from scipy.signal import butter, sosfiltfilt
    return sosfiltfilt(butter(2, FAIXA_FALA, 'band', fs=SR, output='sos'), x, axis=-1)


def trilha_da_voz(n):
    """A voz posicionada na timeline (mono, n amostras), com o filtro de graves e o mesmo nível em todas as falas."""
    from scipy.signal import butter, sosfilt
    man = json.load(open(MANIFESTO))
    v = np.zeros(n)
    hp = butter(2, 80, 'high', fs=SR, output='sos')
    for fm in man['falas']:
        f = next(x for x in FALAS if x['id'] == fm['id'])
        x, _ = carregar(f)
        x = sosfilt(hp, x)
        e = envelope(x, 0.05)
        ativo = e > e.max() * 10 ** (-30 / 20)
        x = x / np.sqrt(np.mean(x[ativo] ** 2))            # mesmo nível de fala (RMS da parte falada)
        i = int(round(fm['arquivo_ini'] * SR))
        a, b = max(0, i), min(n, i + len(x))
        v[a:b] += x[a - i:b - i]
    return v


def abaixa_sob_a_voz(mix, v):
    """Ducking nos barramentos (antes do reverb): trilha na banda toda; efeitos e golpes só na faixa da fala."""
    on = atividade(v)
    n = len(v)
    g_trilha = ganho(on, DUCK_TRILHA, 0.06, 0.30, antecipa=0.08, n=n)
    g_meio = ganho(on, DUCK_EFEITOS, 0.02, 0.20, n=n)
    g_resto = ganho(on, DUCK_EFEITOS_RESTO, 0.02, 0.20, n=n)
    # o envio do reverb abaixa um pouco ANTES da fala: a cauda de um efeito que soou logo antes não lava a palavra
    g_meio_rev = ganho(on, DUCK_EFEITOS, 0.02, 0.20, antecipa=0.15, n=n)
    for nome in ('music', 'drums'):
        if nome in mix.buses:
            mix.buses[nome] *= g_trilha
    for nome, gm in (('sfx', g_meio), ('drums_fx', g_meio), ('send', g_meio_rev)):
        if nome in mix.buses:
            x = mix.buses[nome]
            meio = _banda(x)
            mix.buses[nome] = (x - meio) * g_resto + meio * gm
    return g_trilha


def soma_voz(cama, v, alvo, lufs_de):
    """cama (2, n) já mixada + voz no centro, com a loudness `alvo` (LUFS) na parte falada."""
    vv = np.stack([v, v])
    ativo = atividade(v)
    idx = np.repeat(ativo, SR // 1000)[: len(v)]
    k = 10 ** ((alvo - lufs_de(vv[:, idx].T)) / 20)
    return cama + vv * k, vv * k


def cobertura(cama, voz_mix):
    """Por palavra: quanto a voz fica acima da cama na faixa da fala (300 Hz–4 kHz). Devolve (fala, palavra, dB)."""
    from scipy.signal import butter, sosfiltfilt
    sos = butter(2, (300, 4000), 'band', fs=SR, output='sos')
    cb, vb = sosfiltfilt(sos, cama.mean(0)), sosfiltfilt(sos, voz_mix.mean(0))
    man = json.load(open(MANIFESTO))
    out = []
    for fm in man['falas']:
        f = next(x for x in FALAS if x['id'] == fm['id'])
        meta = json.load(open(os.path.join(DIR, f['id'] + '.json')))
        x, cortes = carregar(f)
        al = meta['alinhamento']
        ch, t0s, t1s = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
        palavra, a = '', None
        for c, s, e in zip(ch + [' '], t0s + [t1s[-1]], t1s + [t1s[-1]]):
            if c.strip() and c not in '.,:?…':
                palavra += c
                a = s if a is None else a
                fim = e
                continue
            if palavra:
                # o alinhamento erra ~50 ms: mede só os quadros de 10 ms em que a voz soa, no trecho ±40 ms
                i0 = int((fm['arquivo_ini'] + no_editado(a, cortes) - 0.04) * SR)
                i1 = int((fm['arquivo_ini'] + no_editado(fim, cortes) + 0.04) * SR)
                q = SR // 100
                pv = (vb[i0:i1][: (i1 - i0) // q * q] ** 2).reshape(-1, q).mean(1)
                pc = (cb[i0:i1][: (i1 - i0) // q * q] ** 2).reshape(-1, q).mean(1)
                soa = pv > pv.max() * 10 ** (-20 / 10)
                rv, rc = np.sqrt(pv[soa].mean()), np.sqrt(pc[soa].mean() + 1e-12)
                out.append((fm['id'], palavra, round(20 * np.log10(rv / rc), 1), round(i0 / SR + 0.04, 2)))
            palavra, a = '', None
    return out


def video():
    dur = json.load(open(os.path.join(ROOT, 'audio', 'cues.json')))['duration']
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', VIDEO_SEM_VOZ, '-t', str(dur), '-i', TRILHA_VOZ,
                    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000',
                    '-movflags', '+faststart', VIDEO_COM_VOZ], check=True)
    print('ok ->', os.path.relpath(VIDEO_COM_VOZ, ROOT))


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'gerar'
    if cmd == 'gerar':
        ids = sys.argv[2].split(',') if len(sys.argv) > 2 else [f['id'] for f in FALAS]
        for f in FALAS:
            if f['id'] in ids and not os.path.exists(os.path.join(DIR, f['id'] + '.mp3')):
                gerar(f, SEMENTES.get(f['id'], SEMENTE), DIR)
                print('ok', f['id'])
        posicionar()
    elif cmd == 'takes':
        f = next(x for x in FALAS if x['id'] == sys.argv[2])
        for s in map(int, sys.argv[3].split(',')):
            base = gerar(f, s, sys.argv[4])
            m = medir(f, base)
            print(f"semente {s:5}: fala {m['fala_ini']:.2f}–{m['fala_fim']:.2f} s ({m['duracao_fala']:.2f} s)")
    elif cmd == 'posicionar':
        sys.exit(0 if posicionar() else 1)
    elif cmd == 'video':
        video()
    else:
        raise SystemExit(__doc__)
