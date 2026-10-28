#!/usr/bin/env python3
"""
Série Explica (FAZLO Digital) — a narração: UMA geração inteira por capítulo, conferida e com histórico.

    python3 series/explica/scripts/voz.py explica-01               gera os capítulos que ainda não têm narração (ou cujo texto mudou)
    python3 series/explica/scripts/voz.py explica-01 --refaz 3,5   gera de novo os capítulos 3 e 5, INTEIROS, com outra semente
    python3 series/explica/scripts/voz.py explica-01 --medir       só mostra a conferência (sem chamar a API)
    python3 series/explica/scripts/voz.py explica-01 --so 0,4,5    gera só esses capítulos (amostras para aprovar antes do resto)
    python3 series/explica/scripts/voz.py explica-01 --refaz 0 --semente 0:5026   gera o cap 0 com a semente 5026 (já tentada), conferida de novo
    python3 series/explica/scripts/voz.py explica-01 --candidatos 3   gera 3 tomadas APROVADAS por capítulo (audio/<id>/voz/candidatos/)
                                                                    e instala a de maior nota; as outras ficam para ouvir
    python3 series/explica/scripts/voz.py explica-01 --escolhe 0:2026,5:4111   troca pela candidata escolhida de ouvido (sem API)
    python3 series/explica/scripts/voz.py explica-01 --candidatos 3 --guardar-todas --refaz 0   guarda também as reprovadas
                                                                    (as N primeiras tomadas), para ouvir quando nenhuma passa
    python3 series/explica/scripts/voz.py explica-01 --reconfere   confere de novo as tomadas instaladas (regras atuais, sem API)

REGRA DA SÉRIE: todas as frases de um capítulo vão numa chamada só. Se algo sair ruim, o capítulo inteiro é gerado de
novo com outra semente. Nunca se emendam palavras nem trechos de gerações diferentes. O arquivo que a API devolve fica
como veio: series/explica/audio/<id>/voz/cap-NN.mp3, e o histórico de todas as gerações fica em falas.json.

Voz e ajustes (desde 24/10, a versão C aprovada no teste A/B de testes/voz-ab; os mesmos da série "Pelos olhos do
hóspede"): Raquel (GDzHdQOi6jjf8zaXhCYD) · eleven_v4 · estabilidade 0,50 · semelhança 0,75 · estilo, speaker boost e
velocidade no padrão do modelo (não enviados) · idioma pt · MP3 44,1 kHz 128 kb/s com alinhamento por caractere
(with-timestamps).
Episódios já narrados ficam com a voz deles: se audio/<id>/voz/falas.json existe, o modelo, os ajustes e o dicionário
gravados ali continuam valendo para esse episódio (um --refaz num episódio antigo não mistura vozes). Antes de 24/10:
eleven_multilingual_v2 · 0,40 / 0,80 / estilo 0,35 · speaker boost · velocidade 1,0, e só a troca FAZLO → Fázlo.
Dicionário de pronúncia (só no texto enviado; a tela não muda), sem diferenciar maiúsculas: FAZLO → Fázlo,
WhatsApp → Uátsap. O capítulo anterior vai como previous_text; o seguinte NÃO vai como next_text
  (regra de 23/10, da série "Pelos olhos do hóspede": com o next_text, o ElevenLabs devolvia a fala cortada no fim
  do arquivo, como se emendasse direto na próxima).

Conferência de cada geração (se uma falhar, o capítulo inteiro é gerado de novo com outra semente, até 6 vezes):
  ritmo        8–18 letras por segundo de fala (era 9–18 até 24/10: o eleven_v4 fala com mais pausas);
  pausas       toda troca de frase tem respiro de 0,12 s a 1,6 s; dentro de uma frase, nenhuma pausa passa de 1,2 s
               (eram 1,1 s e 0,85 s até 24/10: o eleven_v4 fala com mais pausas);
  fim          a última frase vai até o fim. O arquivo tem de terminar em silêncio (abaixo de −50 dB); se acaba com a
               voz soando, é corte. A queda de −15 dB (relativo ao pico da fala) até o silêncio (−50 dB) tem de durar
               ≥ 55 ms quando a última palavra termina em vogal ou plosiva (p, b, t, d, k, g; desde 28/10) e ≥ 35 ms nas outras (calibração de 23/10: 40 ms
               numa vogal soou cortado; 59 e 63 ms soaram naturais); quedas que começam em −20 dB ou abaixo são fim
               natural. (Calibração: um fecho ouvido como cortado caía de −8,7 dB ao silêncio em 32 ms; finais de
               37–57 ms a partir de nível mais baixo soaram normais.) A voz também não pode subir no fim de uma
               frase afirmativa, e tem de sobrar áudio depois da última letra;
  capítulo     (opcional, campo "conferencia" do roteiro) ritmo máximo e faixa de respiro em trocas de frase
               específicas, ex. {"ritmo_max": 12, "respiros": [null, [0.3, 0.6], [0.3, 0.6], null]}, e um trecho dito com
               ênfase: {"enfase": {"trecho": "Site por Fazlo Digital", "min": 0.06}} (a mediana da altura da voz no
               trecho fica ao menos 6% acima da mediana do resto do capítulo);
  perguntas    em toda pergunta de SIM OU NÃO, a altura da voz sobe pelo menos 10% na parte final (a tônica); a pergunta
               aberta (como, quando, onde, quem, qual, quanto, o que, por que…) pode descer no fim, como no português
               falado (decisão de 28/10, com o eleven_v4);
  respiro      inserido (campo "respiro_inserido" do capítulo: [{"depois_da_frase": 1, "alvo_s": 0.5}]): PERMITIDO SÓ
               ASSIM (decisão de 28/10): o linha.py insere silêncio digital no meio do maior trecho da própria tomada
               que já está abaixo de −60 dB entre as duas frases, até o respiro chegar ao alvo. Nenhum som falado é
               cortado nem mexido; o capítulo continua sendo uma geração só. A conferência exige que esse ponto exista;
  transcrição  (se a API de transcrição responder) o texto ouvido bate com o roteiro, palavra por palavra (≥ 92%).

A chave NÃO passa por aqui: no ambiente de nuvem ela fica nos Segredos de rede e o proxy injeta o cabeçalho xi-api-key;
fora dele, exporte ELEVENLABS_API_KEY no terminal. O script nunca imprime, salva nem registra a chave.
"""
import base64
import hashlib
import json
import os
import re
import subprocess
import sys
import time
import unicodedata

import numpy as np

SERIE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(os.path.dirname(SERIE))
SR = 48000

VOZ = {'id': 'GDzHdQOi6jjf8zaXhCYD', 'nome': 'Raquel'}
MODELO = 'eleven_v4'
AJUSTES = {'stability': 0.50, 'similarity_boost': 0.75}      # estilo, speaker boost e velocidade: padrão do modelo
FORMATO = 'mp3_44100_128'
SEMENTE = 2026
TENTATIVAS = 6
PRONUNCIA = {'FAZLO': 'Fázlo', 'WhatsApp': 'Uátsap'}     # só no texto enviado (na tela continua igual); sem diferenciar maiúsculas
PRONUNCIA_ANTIGA = {'FAZLO': 'Fázlo'}                     # episódios narrados antes de 24/10
LIM = {'silencio_insercao_db': -60.0, 'ritmo': (8.0, 18.0), 'respiro': 0.12, 'pausa_max': 1.2, 'pausa_frases': 1.6, 'corte_ms': 35, 'corte_vogal_ms': 55, 'corte_db': -15.0, 'silencio_db': -50.0,
       'sobe': 0.10, 'transcricao': 0.92}


def texto_cap(c):
    return ' '.join(f['texto'] for f in c['fala'])


def api_texto(s):
    for de, para in PRONUNCIA.items():
        s = re.sub(rf'\b{re.escape(de)}\b', para, s, flags=re.I)
    return s


def cabecalho(extra=None):
    h = dict(extra or {})
    if os.environ.get('ELEVENLABS_API_KEY'):
        h['xi-api-key'] = os.environ['ELEVENLABS_API_KEY']     # nunca impresso nem gravado
    return h


def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in s if unicodedata.category(c) != 'Mn'))


# ------------------------------------------------------------------ API
def tts(texto, prev, semente):
    import requests
    body = {'text': api_texto(texto), 'model_id': MODELO, 'language_code': 'pt', 'voice_settings': AJUSTES, 'seed': semente}
    if prev:
        body['previous_text'] = api_texto(prev)
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOZ['id']}/with-timestamps?output_format={FORMATO}"
    for k in range(4):
        try:
            r = requests.post(url, json=body, headers=cabecalho({'Content-Type': 'application/json'}), timeout=240)
        except requests.exceptions.ConnectionError:     # a conexão caiu (proxy): tenta de novo, até 4 vezes
            if k == 3:
                raise
            time.sleep(2 ** (k + 1))
            continue
        if r.status_code == 200:
            d = r.json()
            return base64.b64decode(d['audio_base64']), d['alignment']
        if r.status_code in (429, 500, 502, 503) and k < 3:
            time.sleep(2 ** (k + 1))
            continue
        raise SystemExit(f'ElevenLabs: HTTP {r.status_code} {r.text[:300]}')


def transcreve(mp3):
    """Transcrição (speech-to-text da ElevenLabs) para conferir as palavras. Devolve o texto ou None."""
    try:
        import requests
        r = requests.post('https://api.elevenlabs.io/v1/speech-to-text', headers=cabecalho(),
                          data={'model_id': 'scribe_v1', 'language_code': 'por'},
                          files={'file': ('cap.mp3', mp3, 'audio/mpeg')}, timeout=240)
        if r.status_code != 200:
            return None
        return r.json().get('text')
    except Exception:
        return None


# ------------------------------------------------------------------ medidas
def decodifica_bytes(mp3):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', '-', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         input=mp3, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def envelope(x, win=0.01):
    n = int(win * SR)
    return np.sqrt(np.convolve(x ** 2, np.ones(n) / n, mode='same') + 1e-12)


def palavras(al):
    """As palavras do alinhamento: texto, início, fim da última letra e o índice do 1º caractere."""
    ch, st, en = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    out, cur = [], None
    for i, (c, a, b) in enumerate(zip(ch, st, en)):
        if c.isspace():
            if cur:
                out.append(cur)
                cur = None
            continue
        if cur is None:
            cur = {'w': '', 't0': a, 't1': b, 'i0': i, 'fim_letra': None}
        cur['w'] += c
        cur['t1'] = b
        if c.isalnum():
            cur['fim_letra'] = b
    if cur:
        out.append(cur)
    return [w for w in out if w['fim_letra'] is not None]


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


def silencio(e, pk, a, b, lim_db=-32):
    """Maior trecho contínuo abaixo de lim_db (relativo ao pico) entre os instantes a e b."""
    i, j = int(max(0, a) * SR), int(min(len(e) / SR, b) * SR)
    if j <= i:
        return 0.0
    q = e[i:j] < pk * 10 ** (lim_db / 20)
    best = run = 0
    for v in q[::48]:                       # 1 ms
        run = run + 1 if v else 0
        best = max(best, run)
    return best / 1000


# pergunta aberta (com palavra interrogativa): em português do Brasil ela costuma DESCER no fim, e assim fica (decisão de
# 28/10); a subida mínima vale só para a pergunta de sim ou não
PERGUNTA_ABERTA = {'como', 'quando', 'onde', 'aonde', 'quem', 'qual', 'quais', 'quanto', 'quanta', 'quantos', 'quantas',
                   'que', 'oque', 'porque', 'cade', 'pra'}


def primeira_palavra(s):
    ws = [norm(w) for w in s.split() if norm(w)]
    if len(ws) > 1 and ws[0] in ('o', 'por', 'pra', 'para') and ws[1] in ('que', 'quê'):
        return ws[0] + ws[1] if ws[0] != 'pra' else 'pra'
    return ws[0] if ws else ''


def ponto_de_respiro(x, al, cap, k):
    """Onde um respiro pode ser INSERIDO depois da frase k (0 = a 1ª) de uma tomada: o meio do maior trecho contínuo
    abaixo de −60 dB (relativo ao pico da fala) entre o fim da última palavra da frase e o começo da 1ª da seguinte.
    Devolve {'t': instante no arquivo (s), 'abaixo_s': duração do trecho, 'respiro_da_tomada_s'} ou None.
    REGRA (28/10): o silêncio só pode entrar num ponto assim; nenhum som falado é cortado nem mexido."""
    ws = palavras(al)
    pos = sum(len(api_texto(f['texto'])) + 1 for f in cap['fala'][:k + 1]) - 1
    a = next(w for w in reversed(ws) if w['i0'] < pos)
    b = next(w for w in ws if w['i0'] >= pos)
    e = envelope(x)
    pk = e.max()
    i0, i1 = int((a['fim_letra'] - 0.02) * SR), int((b['t0'] + 0.15) * SR)
    q = e[i0:i1] < pk * 10 ** (LIM['silencio_insercao_db'] / 20)
    best, run, fim_best = 0, 0, 0
    for j, v in enumerate(q):
        run = run + 1 if v else 0
        if run > best:
            best, fim_best = run, j
    if best < int(0.01 * SR):                         # pelo menos 10 ms abaixo de −60 dB
        return None
    meio = i0 + fim_best - best // 2
    return {'t': round(meio / SR, 5), 'abaixo_s': round(best / SR, 3), 'respiro_da_tomada_s': round(silencio(e, pk, a['fim_letra'] - 0.02, b['t0'] + 0.15), 3)}


def insere_respiros(x, al, cap):
    """A tomada com os respiros do campo "respiro_inserido" ([{depois_da_frase: 1, alvo_s: 0.5}]): silêncio digital
    inserido no ponto de ponto_de_respiro, até o respiro chegar ao alvo. Devolve (sinal, alinhamento deslocado,
    insercoes [{t, silencio_s}] em tempo do arquivo ORIGINAL). Nada da tomada é tirado: só entram zeros."""
    ins = []
    for r in cap.get('respiro_inserido') or []:
        pt = ponto_de_respiro(x, al, cap, r['depois_da_frase'] - 1)
        if pt is None:
            raise SystemExit(f'respiro inserido depois da frase {r["depois_da_frase"]}: a tomada não tem ponto abaixo de −60 dB ali')
        d = round(max(0.0, r['alvo_s'] - pt['respiro_da_tomada_s']), 3)
        if d > 0:
            ins.append({'t': pt['t'], 'silencio_s': d, 'respiro_da_tomada_s': pt['respiro_da_tomada_s'], 'alvo_s': r['alvo_s']})
    y, ultimo = [], 0
    for it in sorted(ins, key=lambda z: z['t']):
        i = int(round(it['t'] * SR))
        y += [x[ultimo:i], np.zeros(int(round(it['silencio_s'] * SR)))]
        ultimo = i
    y.append(x[ultimo:])
    desloca = lambda t: t + sum(it['silencio_s'] for it in ins if t >= it['t'])
    al2 = {k: (v if k == 'characters' else [round(desloca(t), 4) for t in v]) for k, v in al.items()}
    return np.concatenate(y), al2, ins


def confere(mp3, al, cap):
    """(ok, motivo, números) de uma geração inteira."""
    x = decodifica_bytes(mp3)
    texto = texto_cap(cap)
    ws = palavras(al)
    ini, fim = ws[0]['t0'], ws[-1]['fim_letra']
    letras = sum(c.isalnum() for c in texto)
    ritmo = letras / max(0.1, fim - ini)
    e = envelope(x)
    pk = e.max()
    # pausas: entre palavras (alinhamento) e o respiro medido no áudio em cada troca de frase
    respiros, inicios, pos = [], set(), 0
    for f in cap['fala'][:-1]:
        pos += len(api_texto(f['texto']))                 # o alinhamento é do texto enviado (Uátsap ≠ WhatsApp)
        a = next(w for w in reversed(ws) if w['i0'] < pos)
        b = next(w for w in ws if w['i0'] >= pos)
        inicios.add(b['i0'])
        respiros.append(round(silencio(e, pk, a['fim_letra'] - 0.02, b['t0'] + 0.15), 3))   # a janela passa um pouco do início
        # marcado da palavra seguinte (o alinhamento às vezes marca o começo antes do som); o silêncio é medido no áudio
        pos += 1
    # entre frases: a troca de item da fala E todo fim de frase dentro de um item (palavra que termina em . ? ! …)
    gaps = [(b['t0'] - a['fim_letra'], b['i0'] in inicios or a['w'].rstrip('"”\'')[-1:] in '.?!…') for a, b in zip(ws, ws[1:])]
    maior = max([g for g, fr in gaps if not fr] or [0.0])              # dentro de uma frase
    maior_fr = max([g for g, fr in gaps if fr] or [0.0])               # entre frases
    # dentro de uma frase também há trocas com ":" — elas contam como respiro só se houver pausa (não são exigidas)
    # o fim: a energia cai aos poucos, a voz não sobe no fim (frase afirmativa) e sobra áudio depois da última letra
    sobra = len(x) / SR - fim
    fim_i = int(np.where(e > pk * 10 ** (LIM['silencio_db'] / 20))[0][-1])          # onde o final chega ao silêncio (−50 dB)
    acima = np.where(e[:fim_i] > pk * 10 ** (LIM['corte_db'] / 20))[0]
    queda_ms = (fim_i - int(acima[-1])) / SR * 1000 if len(acima) else 9999.0    # da última vez acima de −15 dB até o silêncio
    nivel_antes = 20 * np.log10(e[max(0, fim_i - int(LIM['corte_ms'] / 1000 * SR))] / pk)
    n10 = int(0.01 * SR)
    fim_arq = 20 * np.log10(np.sqrt(np.mean(x[-n10:] ** 2)) / pk + 1e-12)       # o último 10 ms do arquivo
    if fim_arq > LIM['silencio_db']:
        queda_ms = 0.0                                                           # acaba com a voz soando: é corte
    ult = unicodedata.normalize('NFD', re.sub(r'[^A-Za-zÀ-ÿ]', '', texto.split()[-1])[-1:].lower())[:1]
    corte_min = LIM['corte_vogal_ms'] if ult and ult in 'aeioupbtdkg' else LIM['corte_ms']     # vogal ou plosiva: >= 55 ms
    sem_corte = queda_ms >= corte_min
    fz = f0(x)
    tfim = fim_i / SR
    seg = lambda t0, t1: (lambda v: v[~np.isnan(v)])(fz[int(max(0, t0) / 0.01):int(t1 / 0.01)])
    fin, antes = seg(tfim - 0.3, tfim), seg(tfim - 0.9, tfim - 0.3)
    altura_final = float(np.median(fin) / np.median(antes)) if len(fin) >= 3 and len(antes) >= 3 else None
    pergunta_final = texto.rstrip().endswith('?')
    firme = pergunta_final or altura_final is None or altura_final <= 1.02
    # perguntas: a altura sobe na parte final de cada "?" (pico dos últimos 60% contra a mediana dos 40% iniciais)
    ch, t0s, t1s = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    sobe, abertas, comeco = [], [], 0
    for i, c in enumerate(ch):
        if c in '.!,;:…':
            comeco = i + 1
        if c != '?':
            continue
        letras_q = [k for k in range(comeco, i) if ch[k].isalnum()]
        comeco = i + 1
        if not letras_q:
            continue
        abertas.append(primeira_palavra(''.join(ch[k] for k in range(letras_q[0], i))) in PERGUNTA_ABERTA)
        s_ = fz[int(t0s[letras_q[0]] / 0.01):int((t1s[letras_q[-1]] + 0.04) / 0.01)]
        corte = int(len(s_) * 0.4)
        corpo, cauda = s_[:corte], s_[corte:]
        corpo, cauda = corpo[~np.isnan(corpo)], cauda[~np.isnan(cauda)]
        sobe.append(round(float(np.percentile(cauda, 90) / np.median(corpo) - 1), 3) if len(cauda) >= 3 and len(corpo) >= 2 else None)
    n = {'fala_s': round(fim - ini, 2), 'ritmo_letras_s': round(ritmo, 1), 'maior_pausa_s': round(maior, 2), 'respiros_s': respiros,
         'maior_pausa_entre_frases_s': round(maior_fr, 2), 'sobra_no_fim_s': round(sobra, 2), 'queda_final_ms': round(queda_ms),
         'nivel_35ms_antes_db': round(float(nivel_antes), 1), 'fim_do_arquivo_db': round(float(fim_arq), 1), 'queda_minima_ms': corte_min, 'altura_final': None if altura_final is None else round(altura_final, 2),
         'perguntas_sobem': sobe, 'perguntas_abertas': abertas}
    if not LIM['ritmo'][0] <= ritmo <= LIM['ritmo'][1]:
        return False, f'ritmo {ritmo:.1f} letras/s', n, x
    if maior > LIM['pausa_max']:
        return False, f'pausa de {maior:.2f} s dentro de uma frase', n, x
    if maior_fr > LIM['pausa_frases']:
        return False, f'pausa entre frases de {maior_fr:.2f} s', n, x
    # respiro inserido depois da geração (campo "respiro_inserido"): nessa troca de frase o respiro da tomada não conta,
    # mas ela precisa ter um ponto abaixo de −60 dB onde o silêncio possa entrar sem tocar em som falado
    inseridos = {r['depois_da_frase'] - 1 for r in cap.get('respiro_inserido') or []}
    for k in sorted(inseridos):
        pt = ponto_de_respiro(x, al, cap, k)
        n.setdefault('respiro_inserido', []).append(pt)
        if pt is None:
            return False, f'sem ponto abaixo de {LIM["silencio_insercao_db"]} dB depois da frase {k + 1} para o respiro inserido', n, x
    resp_tomada = [r for k, r in enumerate(respiros) if k not in inseridos]
    if resp_tomada and min(resp_tomada) < LIM['respiro']:
        return False, f'frases coladas (respiro de {min(resp_tomada):.2f} s)', n, x
    # conferência própria do capítulo (campo "conferencia" do roteiro): ritmo máximo e respiro em trocas de frase específicas
    cf = cap.get('conferencia') or {}
    if cf.get('ritmo_max') and ritmo > cf['ritmo_max']:
        return False, f'corrido: {ritmo:.1f} letras/s (máximo {cf["ritmo_max"]})', n, x
    for k, faixa in enumerate(cf.get('respiros') or []):
        if faixa and k < len(respiros) and k not in inseridos and not faixa[0] <= respiros[k] <= faixa[1]:
            return False, f'respiro {respiros[k]:.2f} s depois da frase {k + 1} (alvo {faixa[0]}–{faixa[1]} s)', n, x
    if cf.get('enfase'):                                                  # um trecho dito com ênfase: a altura dele fica acima do resto
        trecho, minimo = cf['enfase']['trecho'], cf['enfase'].get('min', 0.06)
        ta, tt_ = api_texto(texto), api_texto(trecho)
        k0 = ta.lower().find(tt_.lower())
        lt = [k for k in range(k0, k0 + len(tt_)) if ch[k].isalnum()]
        dentro = seg(t0s[lt[0]], t1s[lt[-1]])
        fora_ = np.concatenate([seg(t0s[0], t0s[lt[0]] - 0.02), seg(t1s[lt[-1]] + 0.02, tfim)])
        enf = round(float(np.median(dentro) / np.median(fora_) - 1), 3) if len(dentro) >= 5 and len(fora_) >= 5 else None
        n['enfase'] = {'trecho': trecho, 'altura_acima_do_resto': enf}
        if enf is None or enf < minimo:
            return False, f'sem ênfase em "{trecho}" ({enf})', n, x
    if sobra < 0.05 or not sem_corte:
        return False, 'fim cortado', n, x
    if not firme:
        return False, f'fim suspenso (a voz sobe {altura_final:.2f}x no fim)', n, x
    sobe_min = cf.get('sobe_min', LIM['sobe'])
    if any(v is None or v < sobe_min for v, ab in zip(sobe, abertas) if not ab):
        return False, f'pergunta sem subida ({sobe}, mínimo {sobe_min})', n, x
    return True, 'ok', n, x


def confere_transcricao(mp3, texto, n):
    tr = transcreve(mp3)
    if tr is None:
        n['transcricao'] = None
        return True, 'ok'
    a, b = [norm(w) for w in texto.split() if norm(w)], [norm(w) for w in tr.split() if norm(w)]
    # palavras do roteiro encontradas na ordem (LCS)
    m = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a)):
        for j in range(len(b)):
            m[i + 1][j + 1] = m[i][j] + 1 if a[i] == b[j] else max(m[i][j + 1], m[i + 1][j])
    taxa = m[-1][-1] / max(1, len(a))
    n['transcricao'] = {'texto': tr, 'palavras_batem': round(taxa, 3)}
    if taxa < LIM['transcricao']:
        return False, f'transcrição bate só {taxa:.0%} com o roteiro'
    return True, 'ok'


# ------------------------------------------------------------------ gerar
def nota_candidato(num, cap):
    """Nota de uma tomada APROVADA, para ordenar candidatas (maior = melhor). Só desempata o que passou na conferência:
    ritmo perto de 12,5 letras/s, respiro no meio da faixa pedida, pergunta que sobe mais, ênfase mais alta e final
    que cai mais devagar. Quem escolhe de verdade é quem ouve (--escolhe)."""
    cf = cap.get('conferencia') or {}
    nt = -abs(num['ritmo_letras_s'] - 12.5) * 0.5
    for k, faixa in enumerate(cf.get('respiros') or []):
        if faixa and k < len(num['respiros_s']):
            nt -= 3 * abs(num['respiros_s'][k] - (faixa[0] + faixa[1]) / 2)
    if num['perguntas_sobem']:
        nt += 4 * min(v for v in num['perguntas_sobem'] if v is not None)
    if num.get('enfase') and num['enfase'].get('altura_acima_do_resto') is not None:
        nt += 5 * num['enfase']['altura_acima_do_resto']
    nt += min(num['queda_final_ms'], 300) / 300
    return round(nt, 3)


def guarda_candidato(out, key, mp3, al, semente, num, cap):
    d = os.path.join(out, 'candidatos')
    os.makedirs(d, exist_ok=True)
    nome = f'cap-{key}-s{semente}'
    open(os.path.join(d, nome + '.mp3'), 'wb').write(mp3)
    json.dump(al, open(os.path.join(d, nome + '.json'), 'w'), ensure_ascii=False)
    return {'semente': semente, 'arquivo': f'candidatos/{nome}.mp3', 'alinhamento': f'candidatos/{nome}.json',
            'nota': nota_candidato(num, cap), 'medidas': {k: num.get(k) for k in ('fala_s', 'ritmo_letras_s', 'respiros_s', 'maior_pausa_s',
            'maior_pausa_entre_frases_s', 'queda_final_ms', 'queda_minima_ms', 'fim_do_arquivo_db', 'altura_final', 'perguntas_sobem', 'enfase')}}


def escolhe(ep_id, pares):
    """Troca a tomada de um capítulo por outra candidata já gerada (sem chamar a API): --escolhe 0:17026,5:9111."""
    out = os.path.join(SERIE, 'audio', ep_id, 'voz')
    path = os.path.join(out, 'falas.json')
    D = json.load(open(path))
    for n, sem in pares.items():
        F = D['capitulos'][f'{n:02d}']
        c = next((a for a in F.get('candidatos', []) if a['semente'] == sem), None)
        if not c:
            raise SystemExit(f'cap {n:02d}: a semente {sem} não está entre as candidatas ({[a["semente"] for a in F.get("candidatos", [])]})')
        mp3, al = open(os.path.join(out, c['arquivo']), 'rb').read(), json.load(open(os.path.join(out, c['alinhamento'])))
        open(os.path.join(out, f'cap-{n:02d}.mp3'), 'wb').write(mp3)
        ws = palavras(al)
        F.update({'semente': sem, 'aprovada': True, 'inicio_da_fala': round(ws[0]['t0'], 3), 'fim_da_fala': round(ws[-1]['fim_letra'], 3),
                  'sha1_audio': hashlib.sha1(mp3).hexdigest(), 'alinhamento': al, 'escolhida_por': 'escuta'})
        print(f'  cap {n:02d}: agora com a semente {sem}')
    json.dump(D, open(path, 'w'), ensure_ascii=False, indent=1)


def reconfere(ep_id):
    """Confere de novo as tomadas instaladas com as regras atuais (sem API) e grava o resultado em falas.json. Uma
    tomada escolhida de ouvido que falhe num critério só passa se estiver em "voz_excecoes" do roteiro
    ({"05": "motivo"}), e a exceção fica registrada."""
    global MODELO, AJUSTES, PRONUNCIA
    ep = json.load(open(os.path.join(SERIE, 'episodios', f'{ep_id}.json')))
    out = os.path.join(SERIE, 'audio', ep_id, 'voz')
    path = os.path.join(out, 'falas.json')
    D = json.load(open(path))
    MODELO, AJUSTES, PRONUNCIA = D['modelo'], D['ajustes'], D.get('pronuncia', PRONUNCIA_ANTIGA)
    exc = ep.get('voz_excecoes') or {}
    for n, c in enumerate(ep['capitulos']):
        key = f'{n:02d}'
        F = D['capitulos'][key]
        ok, motivo, num, _ = confere(open(os.path.join(out, f'cap-{key}.mp3'), 'rb').read(), F['alinhamento'], c)
        F['conferencia_atual'] = {'resultado': motivo, 'quando': time.strftime('%Y-%m-%d %H:%M'), **num}
        if not ok and key in exc:
            F['excecao'] = {'falha': motivo, 'motivo': exc[key]}
            ok = True
        F['aprovada'] = ok
        print(f'  cap {key}: semente {F["semente"]} · {motivo}' + (f' — EXCEÇÃO: {exc[key]}' if F.get('excecao') and key in exc else ''))
    json.dump(D, open(path, 'w'), ensure_ascii=False, indent=1)


def gerar(ep_id, refaz, so=None, forca=None, candidatos=1, todas=False):
    ep = json.load(open(os.path.join(SERIE, 'episodios', f'{ep_id}.json')))
    out = os.path.join(SERIE, 'audio', ep_id, 'voz')
    os.makedirs(out, exist_ok=True)
    caps = ep['capitulos']
    path = os.path.join(out, 'falas.json')
    D = json.load(open(path)) if os.path.exists(path) else {'capitulos': {}}
    global MODELO, AJUSTES, PRONUNCIA
    if D.get('modelo'):                                   # episódio já narrado: fica com a voz e o dicionário dele
        MODELO, AJUSTES = D['modelo'], D['ajustes']
        PRONUNCIA = D.get('pronuncia', PRONUNCIA_ANTIGA)
        print(f'  {ep_id}: já narrado com {MODELO} {json.dumps(AJUSTES)} — mantido')
    for n, c in enumerate(caps):
        key = f'{n:02d}'
        texto = texto_cap(c)
        atual = D['capitulos'].get(key)
        arq = os.path.join(out, f'cap-{key}.mp3')
        if so is not None and n not in so:
            continue
        if atual and atual['texto'] == texto and n not in refaz and os.path.exists(arq):
            continue
        prev = texto_cap(caps[n - 1]) if n else None
        hist = atual['historico'] if atual and atual['texto'] == texto else []
        usadas = {h['semente'] for h in hist}
        semente = c.get('semente', SEMENTE + 17 * n)
        while semente in usadas:
            semente += 1000
        if forca and n in forca:
            semente = forca[n]                      # semente pedida (pode já estar no histórico); a conferência é refeita
        melhor, aprovadas = None, []
        for k in range(TENTATIVAS * candidatos):
            mp3, al = tts(texto, prev, semente)
            ok, motivo, num, _ = confere(mp3, al, c)
            if ok:
                ok, motivo = confere_transcricao(mp3, texto, num)
            hist.append({'semente': semente, 'resultado': motivo, **num, 'quando': time.strftime('%Y-%m-%d %H:%M')})
            print(f'  cap {key}: semente {semente} · {motivo} · {num["fala_s"]} s · {num["ritmo_letras_s"]} letras/s · '
                  f'respiros {num["respiros_s"]} · maior pausa {num["maior_pausa_s"]} s'
                  + (f' · perguntas {num["perguntas_sobem"]}' if num['perguntas_sobem'] else '')
                  + (f' · transcrição {num["transcricao"]["palavras_batem"]:.0%}' if num.get('transcricao') else ''))
            if todas and not ok:                        # --guardar-todas: a tomada reprovada também fica, para ouvir
                r = guarda_candidato(out, key, mp3, al, semente, num, c)
                r['reprovada'] = motivo
                aprovadas.append(r)
                if len(aprovadas) >= candidatos:
                    break
            if ok:
                melhor = (mp3, al, semente, True)
                if candidatos > 1:                      # modo candidatos: guarda cada tomada aprovada e segue até ter N
                    aprovadas.append(guarda_candidato(out, key, mp3, al, semente, num, c))
                    if len(aprovadas) < candidatos:
                        semente += 1000
                        while semente in usadas:
                            semente += 1000
                        continue
                break
            if melhor is None:
                melhor = (mp3, al, semente, False)
            semente += 1000
            while semente in usadas:
                semente += 1000
        mp3, al, semente, aprovada = melhor
        if aprovadas:                                   # a escolhida: a de maior nota (nota_candidato); --escolhe troca depois
            aprovadas.sort(key=lambda a: ('reprovada' in a, -a['nota']))    # aprovadas primeiro
            esc = aprovadas[0]
            mp3, al, semente = open(os.path.join(out, esc['arquivo']), 'rb').read(), json.load(open(os.path.join(out, esc['alinhamento'])) ), esc['semente']
            aprovada = 'reprovada' not in esc
            print(f'  cap {key}: {len(aprovadas)} candidatas; escolhida a semente {semente} (nota {esc["nota"]})' + ('' if aprovada else f' — REPROVADA: {esc["reprovada"]}'))
        open(arq, 'wb').write(mp3)
        ws = palavras(al)
        D['capitulos'][key] = {'n': n, 'texto': texto, 'semente': semente, 'aprovada': aprovada,
                               'inicio_da_fala': round(ws[0]['t0'], 3), 'fim_da_fala': round(ws[-1]['fim_letra'], 3),
                               'sha1_audio': hashlib.sha1(mp3).hexdigest(), 'geracoes': len(hist), 'historico': hist,
                               'alinhamento': al}
        if aprovadas:
            D['capitulos'][key]['candidatos'] = aprovadas
        D.update({'voz': VOZ['nome'], 'voice_id': VOZ['id'], 'modelo': MODELO, 'ajustes': AJUSTES, 'pronuncia': PRONUNCIA, 'formato': FORMATO,
                  'regra': 'uma geração inteira por capítulo; nada emendado', 'limites': LIM})
        json.dump(D, open(path, 'w'), ensure_ascii=False, indent=1)


def medir(ep_id):
    D = json.load(open(os.path.join(SERIE, 'audio', ep_id, 'voz', 'falas.json')))
    tot = 0
    print(f'voz: {D["voz"]} · {D["modelo"]} · {json.dumps(D["ajustes"])}')
    for key in sorted(D['capitulos']):
        f = D['capitulos'][key]
        d = f['fim_da_fala'] - f['inicio_da_fala']
        tot += d
        print(f'  cap {key}: {d:5.2f} s · {f["geracoes"]} geração(ões), usada a semente {f["semente"]}'
              f'{"" if f.get("aprovada", True) else " (NENHUMA passou na conferência)"} · "{f["texto"][:58]}…"')
    print(f'  soma das falas: {tot:.1f} s')
    if any(not f.get('aprovada', True) for f in D['capitulos'].values()):
        raise SystemExit('há capítulo sem geração aprovada: veja o histórico em falas.json e refaça com --refaz')


if __name__ == '__main__':
    args = sys.argv[1:]
    if not args or args[0].startswith('--'):
        raise SystemExit(__doc__)
    refaz = set()
    if '--refaz' in args:
        refaz = {int(v) for v in args[args.index('--refaz') + 1].split(',')}
    so = {int(v) for v in args[args.index('--so') + 1].split(',')} if '--so' in args else None
    if '--medir' not in args:
        forca = dict((int(a), int(b)) for a, b in (v.split(':') for v in args[args.index('--semente') + 1].split(','))) if '--semente' in args else None
        cand = int(args[args.index('--candidatos') + 1]) if '--candidatos' in args else 1
        if '--reconfere' in args:
            reconfere(args[0])
        elif '--escolhe' in args:
            escolhe(args[0], dict((int(a), int(b)) for a, b in (v.split(':') for v in args[args.index('--escolhe') + 1].split(','))))
        else:
            gerar(args[0], refaz, so, forca, cand, '--guardar-todas' in args)
    medir(args[0])
