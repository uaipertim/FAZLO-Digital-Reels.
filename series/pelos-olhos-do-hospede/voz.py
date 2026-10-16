#!/usr/bin/env python3
"""
Série "Pelos olhos do hóspede" — a narração (ElevenLabs), uma fala por cena.

  voz       Raquel - For Conversational (GDzHdQOi6jjf8zaXhCYD), a voz oficial da FAZLO
  modelo    eleven_multilingual_v2 · estabilidade 0,40 · semelhança 0,80 · estilo 0,35 ·
            speaker boost · velocidade 1,0 (nunca acelerar) · semente fixa
  contexto  cada fala vai com a anterior e a seguinte (previous_text / next_text)
  saída     MP3 44,1 kHz 128 kbps + alinhamento por caractere

As falas saem do campo "voz" do roteiro (episodios/<id>.json): titulo, cards[], carimbo, virada,
fecho. O texto na tela continua o do roteiro. A chave NÃO passa por aqui: no ambiente de nuvem ela
fica nos Segredos de rede e o proxy injeta o cabeçalho xi-api-key; fora dele, exporte
ELEVENLABS_API_KEY (nunca em arquivo).

    python3 series/pelos-olhos-do-hospede/voz.py <id>
      -> reels/<id>/audio/voz/<cena>.mp3 + .json   (só gera de novo o que mudou)
      -> reels/<id>/audio/voz/voz.json             duração de cada fala, lida pelo motor.js

O mesmo módulo faz a mixagem da voz (audio.py chama trilha_da_voz e abaixa_sob_a_voz).
"""
import base64
import hashlib
import json
import os
import re
import subprocess
import sys

import numpy as np

SERIE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(SERIE))
SR = 48000

VOZ = {'id': 'GDzHdQOi6jjf8zaXhCYD', 'nome': 'Raquel - For Conversational'}
MODELO = 'eleven_multilingual_v2'
AJUSTES = {'stability': 0.40, 'similarity_boost': 0.80, 'style': 0.35, 'use_speaker_boost': True, 'speed': 1.0}
FORMATO = 'mp3_44100_128'                 # o máximo do plano Starter
SEMENTE = 2026
FAZLO_API = 'Fázlo'                       # FAZLO = "FÁZ-lo" (só no texto enviado; na tela continua FAZLO)


def cenas(ep):
    v = ep['voz']
    out = [('titulo', v['titulo'])]
    out += [(f'card{k + 1}', s) for k, s in enumerate(v['cards'])]
    out += [('carimbo', v['carimbo']), ('virada', v['virada']), ('fecho', v['fecho'])]
    if len(v['cards']) != len(ep['cards']):
        raise SystemExit('o roteiro precisa de uma fala por card (voz.cards)')
    return out


def api_texto(s):
    return re.sub(r'\bFAZLO\b', FAZLO_API, s)


def decodifica(mp3):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def envelope(x, win=0.01):
    n = int(win * SR)
    return np.sqrt(np.convolve(x ** 2, np.ones(n) / n, mode='same') + 1e-12)


def fronteiras(x, limiar_db=-38):
    e = envelope(x)
    on = np.where(e > e.max() * 10 ** (limiar_db / 20))[0]
    return on[0] / SR, on[-1] / SR


def gerar(texto, prev, nxt, destino):
    import requests
    body = {'text': api_texto(texto), 'model_id': MODELO, 'language_code': 'pt', 'voice_settings': AJUSTES, 'seed': SEMENTE}
    if prev:
        body['previous_text'] = api_texto(prev)
    if nxt:
        body['next_text'] = api_texto(nxt)
    chave = hashlib.sha1(json.dumps({**body, 'voz': VOZ['id'], 'fmt': FORMATO}, sort_keys=True).encode()).hexdigest()
    if os.path.exists(destino + '.json') and json.load(open(destino + '.json')).get('chave') == chave:
        return False
    head = {'Content-Type': 'application/json'}
    if os.environ.get('ELEVENLABS_API_KEY'):
        head['xi-api-key'] = os.environ['ELEVENLABS_API_KEY']
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOZ['id']}/with-timestamps?output_format={FORMATO}"
    r = requests.post(url, json=body, headers=head, timeout=180)
    if r.status_code != 200:
        raise SystemExit(f'{os.path.basename(destino)}: HTTP {r.status_code} {r.text[:300]}')
    d = r.json()
    open(destino + '.mp3', 'wb').write(base64.b64decode(d['audio_base64']))
    json.dump({'chave': chave, 'texto_api': body['text'], 'alinhamento': d['alignment']}, open(destino + '.json', 'w'), ensure_ascii=False)
    return True


def marca_do_titulo(ep, meta, ini):
    """Onde começa, na fala do título, a 1ª palavra da parte lima (para a batida cair nela)."""
    lin = next((ln for ln in ep['titulo'] if '*' in ln), ep['titulo'][-1])
    alvo = re.sub(r'[*.,!?…:;]', '', lin.split('*')[1] if '*' in lin else lin).split()[0].lower()
    al = meta['alinhamento']
    txt = ''.join(al['characters']).lower()
    m = re.search(r'(?<![\wÀ-ú])' + re.escape(alvo) + r'(?![\wÀ-ú])', txt)
    return None if not m else round(al['character_start_times_seconds'][m.start()] - ini, 3)


def palavras(meta, ini):
    """Cada palavra da fala com o instante em que começa (relativo ao início da fala), para o motor
    fazer as linhas da tela entrarem junto com a voz."""
    al = meta['alinhamento']
    out, w, t0 = [], '', None
    for ch, t in zip(al['characters'] + [' '], al['character_start_times_seconds'] + [0]):
        if re.match(r'[\wÀ-ú]', ch):
            if not w:
                t0 = t
            w += ch.lower()
        elif w:
            out.append([w, round(max(0.0, t0 - ini), 3)])
            w = ''
    return out


def main(eid):
    ep = json.load(open(os.path.join(SERIE, 'episodios', f'{eid}.json')))
    dir_ = os.path.join(REPO, 'reels', eid, 'audio', 'voz')
    os.makedirs(dir_, exist_ok=True)
    cs = cenas(ep)
    out = {'voz': VOZ, 'modelo': MODELO, 'ajustes': AJUSTES, 'formato': FORMATO, 'semente': SEMENTE,
           'contexto': 'previous_text / next_text', 'cenas': []}
    for i, (cena, texto) in enumerate(cs):
        base = os.path.join(dir_, cena)
        novo = gerar(texto, cs[i - 1][1] if i else None, cs[i + 1][1] if i + 1 < len(cs) else None, base)
        x = decodifica(base + '.mp3')
        ini, fim = fronteiras(x)
        item = {'cena': cena, 'texto': texto, 'arquivo': f'{cena}.mp3', 'ini': round(ini, 3), 'fim': round(fim, 3), 'dur': round(fim - ini, 3)}
        meta = json.load(open(base + '.json'))
        item['palavras'] = palavras(meta, ini)
        if cena == 'titulo':
            item['marca'] = marca_do_titulo(ep, meta, ini)
        out['cenas'].append(item)
        print(f"{'nova ' if novo else 'ok   '} {cena:8} {item['dur']:5.2f} s  \"{texto}\"")
    total = sum(c['dur'] for c in out['cenas'])
    out['fala_total'] = round(total, 2)
    json.dump(out, open(os.path.join(dir_, 'voz.json'), 'w'), ensure_ascii=False, indent=1)
    print(f'falas: {total:.2f} s no total')


# ------------------------------------------------------------------ mixagem (chamada por audio.py)
def trilha_da_voz(reel_root, cues, n):
    """A voz posicionada nos instantes dos cues 'voz' (o início da fala cai no cue), mono, n amostras."""
    from scipy.signal import butter, sosfilt
    man = json.load(open(os.path.join(reel_root, 'audio', 'voz', 'voz.json')))
    por = {c['cena']: c for c in man['cenas']}
    hp = butter(2, 80, 'high', fs=SR, output='sos')
    v = np.zeros(n)
    for c in cues:
        if c['type'] != 'voz':
            continue
        m = por[c['cena']]
        x = sosfilt(hp, decodifica(os.path.join(reel_root, 'audio', 'voz', m['arquivo'])))
        e = envelope(x, 0.05)
        x = x / np.sqrt(np.mean(x[e > e.max() * 10 ** (-30 / 20)] ** 2))   # o mesmo nível em todas as falas
        i = int(round((c['t'] - m['ini']) * SR))
        a, b = max(0, i), min(n, i + len(x))
        v[a:b] += x[a - i:b - i]
    return v


def ganho_sob_a_voz(v, prof_db=-9.0, ataque=0.03, soltura=0.25, buraco=0.25, antecipa=0.12, cr=1000):
    """Ganho dos efeitos: -9 dB enquanto a voz soa (pausas < `buraco` contam como fala). Começa a abaixar
    `antecipa` s antes da fala, para a cauda de um toque não cobrir a 1ª sílaba; o ataque de cada efeito
    (que vem 0,25 s ou mais antes da fala) passa inteiro."""
    e = envelope(v, 0.02)[:: SR // cr]
    on = e > e.max() * 10 ** (-34 / 20)
    i, N = 0, len(on)
    while i < N:
        if on[i]:
            i += 1
            continue
        j = i
        while j < N and not on[j]:
            j += 1
        if 0 < i and j < N and (j - i) / cr < buraco:
            on[i:j] = True
        i = j
    k = int(antecipa * cr)
    if k:
        on[:-k] |= on[k:]
    alvo = np.where(on, 10 ** (prof_db / 20), 1.0)
    a_at, a_so = np.exp(-1 / (ataque * cr)), np.exp(-1 / (soltura * cr))
    g, y = 1.0, np.empty(N)
    for k, s in enumerate(alvo):
        q = a_at if s < g else a_so
        g = q * g + (1 - q) * s
        y[k] = g
    return np.interp(np.arange(len(v)) / SR, np.arange(N) / cr, y)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    main(sys.argv[1])
