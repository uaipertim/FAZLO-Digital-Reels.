#!/usr/bin/env python3
"""
Série "Pelos olhos do hóspede" — a narração (ElevenLabs), uma fala por cena.

  voz       Raquel - For Conversational (GDzHdQOi6jjf8zaXhCYD), a voz oficial da FAZLO
  modelo    eleven_multilingual_v2 · estabilidade 0,40 · semelhança 0,80 · estilo 0,35 ·
            speaker boost · velocidade 1,0 (nunca acelerar) · semente fixa
  contexto  cada fala vai com a anterior e a seguinte (previous_text / next_text)
  saída     MP3 44,1 kHz 128 kbps + alinhamento por caractere

As falas saem do campo "voz" do roteiro (episodios/<id>.json): titulo, cards[], carimbo, virada,
fecho. O texto na tela continua o do roteiro. Uma fala pode ser uma lista de partes (ex.: o título
"Como chega aí?" + "Ele perguntou de novo!"): cada parte é uma chamada, e elas são emendadas com
0,25 s de pausa. Em toda frase com "?", a entonação é conferida no áudio (a altura da voz precisa
subir no fim); se sair como afirmação, outras sementes são tentadas. A chave NÃO passa por aqui: no ambiente de nuvem ela
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


SEMENTES_PERGUNTA = [SEMENTE, 7, 11, 23, 42, 77, 101, 202]   # tentadas em ordem até a pergunta subir (ou o final fechar bem)
ULTIMA = {}                                          # dados da última geração de cada fala (tentativas, final)
SOBE_MIN = 0.10                                      # +10% de altura na tônica final da pergunta


def gerar(texto, prev, nxt, destino, semente=SEMENTE):
    import requests
    body = {'text': api_texto(texto), 'model_id': MODELO, 'language_code': 'pt', 'voice_settings': AJUSTES, 'seed': semente}
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
    json.dump({'chave': chave, 'base': chave_base(texto, prev, nxt), 'semente': semente, 'texto_api': body['text'],
               'alinhamento': d['alignment']}, open(destino + '.json', 'w'), ensure_ascii=False)
    return True


def chave_base(texto, prev, nxt):
    """Identifica a fala sem a semente (para reaproveitar a tomada escolhida numa nova rodada)."""
    return hashlib.sha1(json.dumps([texto, prev, nxt, MODELO, AJUSTES, VOZ['id'], FORMATO], sort_keys=True).encode()).hexdigest()


def f0(x):
    """Altura da voz (Hz) em quadros de 40 ms a cada 10 ms (autocorrelação); NaN onde não há voz."""
    n, h = int(0.04 * SR), int(0.01 * SR)
    out = []
    for i in range(0, len(x) - n, h):
        w = x[i:i + n] * np.hanning(n)
        if np.sqrt(np.mean(w ** 2)) < 0.008:
            out.append(np.nan)
            continue
        ac = np.correlate(w, w, 'full')[n - 1:]
        lo, hi = int(SR / 420), int(SR / 120)
        k = lo + int(np.argmax(ac[lo:hi]))
        out.append(SR / k if ac[k] / (ac[0] + 1e-9) > 0.5 else np.nan)
    return np.array(out)


def perguntas(texto, meta, x):
    """Para cada "?" da fala: quanto a altura sobe na pergunta. Na pergunta brasileira a voz sobe até a tônica
    final e pode cair nas sílabas depois dela ("E a di-Á-ria?", "a es-tra-da é BO-a?"): mede, dentro da
    própria pergunta (do sinal de pontuação anterior até o "?"), o pico dos últimos 60% contra a mediana
    dos primeiros 40%."""
    al = meta['alinhamento']
    ch, t0, t1 = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    fz = f0(x)
    tq = lambda t: int(t / 0.01)
    out, ini = [], 0
    for i, c in enumerate(ch):
        if c in '.!,;:…':
            ini = i + 1
        if c != '?':
            continue
        letras = [k for k in range(ini, i) if re.match(r'[\wÀ-ú]', ch[k])]
        ini = i + 1
        if not letras:
            out.append(None)
            continue
        a, b = t0[letras[0]], t1[letras[-1]] + 0.04
        seg = fz[tq(a):tq(b)]
        corte = int(len(seg) * 0.4)
        corpo, cauda = seg[:corte], seg[corte:]
        corpo, cauda = corpo[~np.isnan(corpo)], cauda[~np.isnan(cauda)]
        if len(cauda) < 3 or len(corpo) < 2:
            out.append(None)
            continue
        out.append(round(float(np.percentile(cauda, 90) / np.median(corpo) - 1), 3))
    return out


def termina_bem(x, texto):
    """Confere o final de uma frase concluída (ponto ou exclamação): a última sílaba tem de ir até o fim e a
    voz não pode subir nem ficar suspensa.
      - sem corte: depois da última palavra a energia cai aos poucos (queda de -20 a -40 dB em >= 90 ms, ou já
        está a -26 dB ou menos 50 ms antes do fim); uma parada seca (<= 60 ms, ainda forte) é corte;
      - firme: a altura da voz nos últimos 300 ms da fala não passa da mediana dos 600 ms anteriores.
    Devolve (ok, dados)."""
    e = envelope(x, 0.01)
    pk = e.max()
    fim = int(np.where(e > pk * 10 ** (-40 / 20))[0][-1])
    a = int(np.where(e[:fim] > pk * 10 ** (-20 / 20))[0][-1])
    queda_ms = (fim - a) / SR * 1000
    r50 = 20 * np.log10(e[max(0, fim - int(0.05 * SR))] / pk)
    sem_corte = queda_ms >= 90 or r50 <= -26
    fz = f0(x)
    t = fim / SR
    seg = lambda t0, t1: (lambda v: v[~np.isnan(v)])(fz[int(max(0, t0) / 0.01):int(t1 / 0.01)])
    fin, antes = seg(t - 0.3, t), seg(t - 0.9, t - 0.3)
    razao = float(np.median(fin) / np.median(antes)) if len(fin) >= 3 and len(antes) >= 3 else None
    firme = razao is None or razao <= 1.0
    return sem_corte and firme, {'queda_ms': round(queda_ms), 'r50_db': round(float(r50), 1), 'altura_final': None if razao is None else round(razao, 2)}


def gerar_parte(texto, prev, nxt, destino, concluida=False):
    """Uma parte da fala. Com "?", confere a subida no fim e, se precisar, tenta outras sementes."""
    if os.path.exists(destino + '.json'):
        m = json.load(open(destino + '.json'))
        if m.get('base') == chave_base(texto, prev, nxt):
            sb = perguntas(texto, m, decodifica(destino + '.mp3'))
            if all(v is not None and v >= SOBE_MIN for v in sb) and (not concluida or termina_bem(decodifica(destino + '.mp3'), texto)[0]):
                return False, m.get('semente', SEMENTE), sb
    melhor = None
    for tent, sem in enumerate(SEMENTES_PERGUNTA if ('?' in texto or concluida) else [SEMENTE], 1):
        gerar(texto, prev, nxt, destino, sem)
        m = json.load(open(destino + '.json'))
        x = decodifica(destino + '.mp3')
        sb = perguntas(texto, m, x)
        nota = min([v if v is not None else -1 for v in sb] or [1])
        bem, dados = termina_bem(x, texto) if concluida else (True, None)
        if concluida:
            print(f'      fecho, tentativa {tent} (semente {sem}): {"final firme e completo" if bem else "final cortado ou suspenso"} {dados}')
            nota = nota if bem else -9
        if melhor is None or nota > melhor[0]:
            melhor = (nota, sem)
        if nota >= SOBE_MIN or (concluida and bem and '?' not in texto):
            ULTIMA[os.path.basename(destino)] = {'tentativas': tent, 'final': dados}
            return True, sem, sb
        if not concluida:
            print(f'      semente {sem}: a pergunta não subiu ({sb}), tentando outra')
    gerar(texto, prev, nxt, destino, melhor[1])          # fica a que mais subiu
    m = json.load(open(destino + '.json'))
    ULTIMA[os.path.basename(destino)] = {'tentativas': len(SEMENTES_PERGUNTA), 'final': termina_bem(decodifica(destino + '.mp3'), texto)[1] if concluida else None, 'sem_aprovada': True}
    return True, melhor[1], perguntas(texto, m, decodifica(destino + '.mp3'))


def marca_do_titulo(ep, pal):
    """Onde começa, na fala do título, a 1ª palavra da parte lima (para a batida cair nela)."""
    lin = next((ln for ln in ep['titulo'] if '*' in ln), ep['titulo'][-1])
    alvo = re.sub(r'[*.,!?…:;“”"\']', '', lin.split('*')[1] if '*' in lin else lin).split()[0].lower()
    return next((t for w, t in pal if w == alvo), None)


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
    junta = lambda v: v if isinstance(v, str) else ' '.join(v)
    out = {'voz': VOZ, 'modelo': MODELO, 'ajustes': AJUSTES, 'formato': FORMATO, 'semente': SEMENTE,
           'contexto': 'previous_text / next_text', 'cenas': []}
    for i, (cena, fala) in enumerate(cs):
        partes = [fala] if isinstance(fala, str) else fala
        antes, depois = (junta(cs[i - 1][1]) if i else None), (junta(cs[i + 1][1]) if i + 1 < len(cs) else None)
        sinais, pal, info, novo, t = [], [], [], False, 0.0
        for k, texto in enumerate(partes):
            base = os.path.join(dir_, cena if len(partes) == 1 else f'{cena}-{k + 1}')
            prev = partes[k - 1] if k else antes
            nxt = partes[k + 1] if k + 1 < len(partes) else depois
            nv, sem, sb = gerar_parte(texto, prev, nxt, base, concluida=(cena == 'fecho' and not texto.rstrip().endswith('?')))
            novo |= nv
            x = decodifica(base + '.mp3')
            ini, fim = fronteiras(x)
            meta = json.load(open(base + '.json'))
            info.append({'texto': texto, 'arquivo': os.path.basename(base) + '.mp3', 'semente': sem, 'sobe': sb})
            if len(partes) == 1:
                sinais, pal = [x], palavras(meta, ini)
                cena_ini, cena_fim = ini, fim
            else:                                      # emenda: cada parte aparada, 0,25 s entre elas
                a, b = max(0, int((ini - 0.03) * SR)), int((fim + 0.06) * SR)
                if k:
                    sinais.append(np.zeros(int(0.25 * SR)))
                    t += 0.25
                pal += [[w, round(tw + t + (0.03 if k else 0), 3)] for w, tw in palavras(meta, ini)]
                sinais.append(x[a:b])
                t += (b - a) / SR - 0.03 if k == 0 else (b - a) / SR
        if len(partes) > 1:
            y = np.concatenate(sinais)
            from scipy.io import wavfile
            wavfile.write(os.path.join(dir_, f'{cena}.wav'), SR, np.round(np.clip(y, -1, 1) * 32767).astype(np.int16))
            cena_ini, cena_fim = fronteiras(y)
            arq = f'{cena}.wav'
        else:
            arq = f'{cena}.mp3'
        item = {'cena': cena, 'texto': junta(fala), 'arquivo': arq, 'ini': round(cena_ini, 3), 'fim': round(cena_fim, 3),
                'dur': round(cena_fim - cena_ini, 3), 'partes': info, 'palavras': pal}
        if cena == 'titulo':
            item['marca'] = marca_do_titulo(ep, pal)
        out['cenas'].append(item)
        perg = ' · '.join(f"pergunta {'sobe' if v is not None and v >= SOBE_MIN else 'NÃO sobe'} {v:+.0%}" if v is not None else 'pergunta: sem medida'
                          for p_ in info for v in p_['sobe'])
        print(f"{'nova ' if novo else 'ok   '} {cena:8} {item['dur']:5.2f} s  \"{junta(fala)}\"" + (f'  [{perg}]' if perg else ''))
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
