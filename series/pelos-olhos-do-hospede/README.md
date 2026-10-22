# FAZLO Digital — série "Pelos olhos do hóspede" · o modelo

Série de Reels curtos da @fazlodigital, criada para a estratégia de volume (2 posts por dia). Cada episódio mostra uma dúvida que o hóspede tem antes de reservar e que o site da pousada poderia responder. Os temas saem dos 7 pontos do carrossel "O que o hóspede procura antes de reservar".

A estrutura (título-dor → cards → carimbo → virada → "Manda pra quem…") vem da estratégia de volume decidida em 16/10/2026; o desenho, as fontes, as cores, a logo e o som são os da FAZLO Digital, e o código é próprio deste repositório.

É **um motion só**: cada episódio troca apenas o roteiro, um JSON em [`episodios/`](episodios). Depois do modelo aprovado, um episódio novo sai com um comando.

**Formato (decisão de 16/10: os episódios passam a ter voz):**
- 9:16 (1080×1920), 60 fps, **25–42 s com voz** (leitura longa, a partir do ep. 7; os eps. 1–6 ficaram em 25–30 s). A duração vem das falas. Sem o campo `voz` no roteiro, o motor ainda gera a versão curta de 10,4–14,4 s.
- H.264 + AAC 48 kHz.
- **Narração com a voz oficial da FAZLO** (ElevenLabs) e efeitos sintetizados. Os efeitos abaixam ~9 dB sob a fala, e o master fica em **−14 LUFS** com pico ≤ −1 dBTP, sem espaço para música do Instagram.
- Identidade da FAZLO Digital: Unbounded + Sora, lima `#C6FA41`, fundo `#050606` com a grade de pontos, logo FAZLO DIGITAL do kit oficial.

| Episódio | Título | Duração | Pasta do Reel | Status |
|---|---|---|---|---|
| Não achou o preço | "Ele achou sua pousada. / Mas não achou o preço." | 25,8 s com voz (curta: 14,4 s) | [`reels/nao-achou-o-preco/`](../../reels/nao-achou-o-preco) | com voz · aguardando aprovação · 17/10, 17h |
| Como chega aí | "Como chega aí? / Ele perguntou de novo!" | 25,0 s com voz (curta: 14,2 s) | [`reels/como-chega-ai/`](../../reels/como-chega-ai) | com voz · em avaliação · 18/10, 9h30 |
| Tem vaga no feriado | "Tem vaga no feriado? / Ele perguntou em três lugares." | 26,6 s | [`reels/tem-vaga-no-feriado/`](../../reels/tem-vaga-no-feriado) | com voz · aguardando aprovação · 19/10, 9h30 |
| Ele viu a piscina | "Ele viu a piscina. / Mas não viu o quarto." | 25,0 s | [`reels/viu-a-piscina/`](../../reels/viu-a-piscina) | com voz · aguardando aprovação · 20/10, 9h30 |
| O café está incluso? | "O café está incluso? / Ele perguntou no direct." | 28,6 s | [`reels/cafe-incluso/`](../../reels/cafe-incluso) | com voz · aguardando aprovação · qua 21/10, 9h30 |
| Aceita pet? | "Aceita pet? / Ele não quis arriscar." | 25,0 s | [`reels/aceita-pet/`](../../reels/aceita-pet) | com voz · aguardando aprovação · qui 22/10, 9h30 |
| Como eu reservo? | "Como eu reservo? / Ninguém explicou." | 41,3 s | [`reels/como-eu-reservo/`](../../reels/como-eu-reservo) | com voz · aguardando aprovação · sex 23/10, 9h30 |
| Que horas é o check-in? | "Que horas é o check-in? / Ele chegou e esperou!" | 38,6 s | [`reels/horario-check-in/`](../../reels/horario-check-in) | com voz · aguardando aprovação · sáb 24/10, 9h30 |
| Cabe a família toda? | "Cabe a família toda? / Ele não teve certeza." | 39,0 s | [`reels/cabe-a-familia/`](../../reels/cabe-a-familia) | com voz · aguardando aprovação · dom 25/10, 9h30 |

As versões curtas sem voz ficam em `reels/<id>/output/fazlo-digital-<id>-curto.mp4`.

## Episódio novo: só o JSON

```bash
# 1. escreva series/pelos-olhos-do-hospede/episodios/<id>.json
npm run episodio -- <id>
```

O comando:
0. se o roteiro tem `voz`, gera as falas (`voz.py`; só refaz as que mudaram) e guarda o vídeo curto que já existir como `-curto.mp4`. **Se o total passar de 42 s (30 s nos eps. 1–6), ele para e avisa antes do render**: nada é acelerado nem cortado sem aprovação (`--forcar` renderiza assim mesmo);
1. cria (ou atualiza) `reels/<id>/` (`reel.json`, `src/anim.js` de uma linha, `scripts/audio.py`);
2. exporta os cues e completa o `reel.json` com os instantes da revisão e do storyboard;
3. roda o pipeline normal: áudio → vídeo → capa → storyboard → QA;
4. confere as áreas seguras elemento a elemento (`output/revisao/areas-seguras.txt`).

Sai com erro se a revisão técnica ou as áreas seguras falharem.

### O formato do roteiro

```json
{
  "id": "nao-achou-o-preco",
  "titulo": ["Ele achou sua pousada.", "Não achou o preço."],
  "cards": [
    { "rotulo": "No perfil", "texto": "Fotos da piscina, do café e da vista." },
    { "texto": "E a diária? Nenhum valor à vista." },
    { "texto": "Perguntar no direct… e esperar." }
  ],
  "carimbo": "Foi ver outra",
  "virada": ["Um valor de referência", "*responde antes da pergunta.*"],
  "fecho": "Manda pra quem só passa o preço no direct."
}
```

- **`titulo`**: duas linhas, em maiúsculas no desenho. A 1ª sai branca e a 2ª lima. Se alguma linha tiver `*asteriscos*`, só esse trecho fica lima.
- **`cards`**: de 2 a 4, em três desenhos:
  - **`rotulo` + `texto`**: rótulo pequeno em Sora maiúscula cinza, texto em Sora 600;
  - **só `texto`**: card mais baixo, com o ponto lima ao lado;
  - **`chip`**: pílula com texto em maiúsculas, para listas curtas.
  - O texto fica numa linha só se couber até 42 px; senão quebra em duas.
- **`carimbo`**: a pílula lima carimbada sobre a pilha (Unbounded 800, diminui sozinha se passar de 840 px).
- **`virada`**: uma ou mais linhas; o trecho entre `*asteriscos*` sai em lima.
- **`fecho`**: o "Manda pra quem…", em até duas linhas.
- **`voz`**: a fala de cada cena, que pode ser um pouco mais longa que o texto da tela:

  ```json
  "voz": {
    "titulo": "Ele achou sua pousada… mas não achou o preço.",
    "cards": ["Viu as fotos da piscina, do café, da vista.", "E a diária? Nenhum valor à vista.", "Aí ele pergunta no direct… e espera."],
    "carimbo": "Enquanto isso, foi ver outra.",
    "virada": "Um valor de referência, um simples 'a partir de', responde antes da pergunta.",
    "fecho": "Manda pra quem só passa o preço no direct."
  }
  ```

  É uma fala por card, na mesma ordem. Uma fala pode ser uma **lista de partes**, por exemplo `["Como chega aí?", "A estrada é boa?"]`. Cada parte é uma chamada, e elas são emendadas com 0,25 s de pausa.
  - Use partes para acertar a entonação, porque duas perguntas na mesma chamada tendem a sair como afirmação.
  - "FAZLO" é enviado à API como "Fázlo" ("FÁZ-lo"); na tela continua FAZLO.
  - "direct" fica "direct": foi a grafia escolhida nas amostras de 16/10.
- **Final de frase:** do ep. 7 em diante, o `voz.py` confere o final de **toda fala e de toda parte** (nos eps. 1–6, só o do fecho). Se falhar, tenta outras sementes:
  - **corte** (vale para todas as falas e partes) é o final cair até o silêncio (−50 dB) em menos de 35 ms começando acima de −15 dB (relativo ao pico da fala); quedas que começam em −20 dB ou abaixo são fim natural (calibração ouvida pelo Willian: um fecho cortado caía de −8,7 dB ao silêncio em 32 ms; finais de 37–57 ms a partir de nível mais baixo soaram normais; regra em uso a partir do ep. 7);
  - **calibração pelo ouvido do Willian (ep. 7 em diante)**, conforme a última letra da fala ou parte:
    - termina em **vogal**: o final precisa cair de −15 dB até o silêncio em **≥ 55 ms** (40 ms soou cortado; 59 e 63 ms soaram naturais);
    - termina em **consoante plosiva (p, t, k)**: pode cair direto, desde que seja pergunta e suba ≥ 10% (a parada da própria palavra, como em "WhatsApp?");
    - outras consoantes: ≥ 35 ms;
  - **tomadas mantidas** (`voz_manter`) também passam por essa conferência: se uma falhar, é gerada de novo.
  - **o arquivo tem de terminar em silêncio** (23/10): se a voz ainda soa no último milissegundo do arquivo (acima de −50 dB), é corte, mesmo que a queda pareça longa. Antes disso, o fim do arquivo contava como silêncio e tomadas cortadas passavam (era o "corte seco" do título do check-in, com a voz em −19 dB no fim do arquivo).
- **Partes sem o texto seguinte (ep. 7 em diante):** cada parte de uma fala em partes vai à API só com o texto anterior (`previous_text`), sem o `next_text`. Com o texto seguinte, o ElevenLabs devolvia a parte cortada no fim do arquivo, como se emendasse direto na próxima: 3 de 3 sementes cortadas com ele, 0 de 3 sem ele.
- **A emenda das partes** não apara a voz: cada parte é cortada 60 ms depois de cair a −38 dB, ponto em que a tomada já está abaixo de −50 dB (conferido no MP4 final do check-in: −77 dB na emenda).
  - a altura da voz não pode subir no fim;
  - depois da última palavra o vídeo tem pelo menos 0,4 s de respiro.
- **Nenhum efeito por cima da voz:** o `audio.py` mede, em janelas de 50 ms com fala (300 Hz–4 kHz), quanto a voz fica acima dos efeitos. Onde ficar menos de 3 dB acima (ex.: a cauda de um toque no começo de uma fala), os efeitos abaixam só nesse trecho até a voz ficar 3 dB acima.
- **Entonação de pergunta:** em toda frase com "?", o `voz.py` mede a altura da voz no próprio áudio. Na pergunta, ela tem de subir pelo menos 10% na parte final, onde fica a tônica. Na pergunta brasileira, a voz sobe até a tônica e pode cair nas sílabas depois dela ("di-Á-ria?"). Se a pergunta sair como afirmação, ele tenta outras sementes e avisa se nenhuma subir.
- Opcional: **`serie`** troca o texto do chip (ex.: "Pelos olhos do cliente", para os episódios de negócios em geral).
- Aspas retas viram tipográficas no desenho.
- Nada de números, telas inventadas, "automático", logos de WhatsApp, Instagram ou Pix.

## Estrutura (fixa) e tempos

| Tempo | Cena | O que acontece |
|---|---|---|
| 0–1,8 s | **Título-dor** | **Já no quadro 0** (vale como capa): o chip "PELOS OLHOS DO HÓSPEDE" e o título em Unbounded 900, no maior tamanho que cabe em 840 px. Em 0,7 s a parte lima leva uma batida seca. |
| 1,8–2,3 s | **Vira cabeçalho** | O título sobe e encolhe para o alto (topo em y 285); o chip sai. |
| 2,25 s → | **A situação** | Os cards entram um a um com um toque de vidro, de baixo para cima, com mola; o novo empurra os anteriores. Cada card fica o tempo de leitura do seu texto (0,85–1,7 s). A pilha sobe devagar (50 px), para a cena nunca ficar parada. |
| depois do último card | **O corte** | A barra lima da marca (46°) atravessa a pilha com a varredura da assinatura sonora e deixa o **carimbo** lima, com tranco, tremor e brilho. Ele fica 2,1 s. |
| +2,1 s | **Saída** | Os cards e o carimbo caem em cascata; o cabeçalho sai pelo topo. |
| +0,35 s | **A virada** | A frase sobe linha a linha e fica parada 2,3–2,7 s (pelo tamanho do texto). |
| últimos 2,0 s | **Fecho** | A virada sobe; entra "Manda pra quem…" e a logo FAZLO DIGITAL se monta pelas formas, com a assinatura completa. Fade curto no fim. |

O fecho tem 2,0 s em todos os episódios (ajuste de 16/10). Se o roteiro passar de 14,4 s (ou ficar abaixo de 10,4 s), os intervalos entre os cards se ajustam para caber.

## Com voz: a voz manda no tempo

| Cena | Tempo |
|---|---|
| **Título** | A fala começa no **quadro 0**, junto com o título. A batida lima cai na palavra da parte lima (ex.: o "não" de "mas não achou o preço"). O título vira cabeçalho 0,35 s depois do fim da fala. |
| **Cards** | Cada card entra com o toque de vidro, e a fala dele começa 0,25 s depois, quando o toque já baixou. O card fica a fala inteira mais um respiro de 0,55 s, com um **contorno lima enquanto é falado**. A pilha não fica parada: sobe 90 px até a saída, e cada card flutua de leve (±6 px, ±0,45°). |
| **Carimbo** | A fala começa 0,15 s depois do baque. O carimbo fica pelo menos 1,6 s, ou a fala mais o respiro. |
| **Virada** | As linhas antes da 1ª palavra lima entram juntas. Daí em diante, **cada palavra entra quando a voz a diz** (alinhamento por caractere), como "“a partir de”". A frase se aproxima 6%, em ritmo constante, enquanto é falada. |
| **Fecho** | "Manda pra quem…" entra, e a fala começa 0,2 s depois. A logo começa a se montar 0,4 s depois do início da fala e, pronta, fica **pelo menos 1,4 s na tela** antes do fade (ajuste de 16/10: mínimo de 1,2 s). A assinatura sonora soa logo depois da fala, sem cobri-la, e tem 1,2 s para soar inteira. O fecho tem pelo menos 2,0 s. |

Se o total ficar abaixo de 25 s, a diferença vai para os respiros: os cards ficam mais tempo. Acima do limite (42 s; 30 s nos eps. 1–6), o comando avisa antes de renderizar.

### Leitura longa (regras de 22/10, pedido do Willian; padrão a partir do ep. 7)

Os eps. 1–6 têm `"leitura": "curta"` no roteiro e continuam com os tempos acima. Todo episódio novo usa a leitura longa:

| Cena | Regra |
|---|---|
| **Cards** | cada card fica **≥ 2,0 s inteiro e parado** depois que a fala dele termina, antes da próxima entrada. A pilha não sobe e os cards não flutuam |
| **Texto dos cards** | até **10% maior** (até 55 px), quando isso não quebra mais linhas; a entrelinha acompanha |
| **Carimbo** | **≥ 1,5 s parado** depois do tremor do baque e depois da fala dele |
| **Virada** | **≥ 2,5 s inteira** depois da fala. A aproximação de 6% para quando a fala termina |
| **Fecho** | "Manda pra…" fica **≥ 3,0 s inteiro e parado** depois da fala; a virada e o fecho saem juntos |
| **Logo** | enquanto o texto sai, a logo FAZLO DIGITAL se monta **sozinha, centralizada** (560 px, centro em y 960), com a assinatura completa, e fica **parada ≥ 3,0 s até o fim**, sem fade |
| **Fundo** | como o texto fica parado, o fundo segue vivo: a grade de pontos anda 3× mais rápido e duas luzes lima largas passeiam devagar (a revisão não acusa imagem congelada) |
| **Duração** | até **42 s** (decisão de 22/10: os textos ficam inteiros). A voz nunca é acelerada |

### Ajustes de voz no roteiro

- **Pergunta dividida em partes** leva **0,45–0,6 s** de silêncio entre as partes (padrão 0,52 s na leitura longa; ~0,25 s nos eps. 1–6).
- **`voz_pausas`**: o silêncio inserido entre as partes de uma fala, por cena (≈ o silêncio medido). Ex.: `{"titulo": 0.8}`, ou uma lista com um valor por emenda: `{"card2": [0.43, 0.52]}`. O `voz.json` registra a pausa medida em `pausas_entre_partes` e a queda do final de cada parte em `partes[].final`.
- **`voz_manter`**: tomadas aprovadas que ficam como estão mesmo que o texto vizinho (o contexto) mude. Ex.: `["card2-1", "card2-2"]`. Serve para trocar só uma parte de uma fala sem gerar de novo as outras. Elas também passam pela conferência: se falharem, são geradas de novo.
- **`voz_excecoes`**: tomadas que ficam como estão mesmo sem passar numa conferência, por decisão de quem ouviu (o `voz.py` avisa a cada rodada). Ex.: `["titulo-2"]`.
- **`voz_criterios`**: critério mais exigente para uma parte. Ex.: `{"titulo-1": {"sobe_min": 0.15, "queda_min": 80}}` (a pergunta sobe ≥ 15% e cai até o silêncio em ≥ 80 ms) ou `{"titulo-2": {"modo": "firme"}}` (exclamação: a voz não pode subir no fim).

**Voz** (`voz.py`, mesmo padrão de "Site não é luxo"):
- Raquel - For Conversational (`GDzHdQOi6jjf8zaXhCYD`), `eleven_multilingual_v2`;
- estabilidade 0,40 · semelhança 0,80 · estilo 0,35 · speaker boost · velocidade 1,0 (nunca acelerar) · semente 2026;
- uma chamada por cena, com as falas vizinhas como `previous_text` / `next_text`;
- MP3 44,1 kHz 128 kbps (plano Starter), com alinhamento por caractere;
- a chave não fica no repositório: no ambiente de nuvem está nos Segredos de rede (o proxy injeta `xi-api-key`); fora dele, use `ELEVENLABS_API_KEY`.

**Mixagem** (`audio.py`):
- voz no centro, com filtro de graves em 80 Hz e o mesmo nível em todas as falas, 3 dB acima dos efeitos cheios;
- os efeitos (com as caudas de reverb) abaixam 9 dB enquanto há fala, a partir de 0,12 s antes dela. O ataque de cada toque ou golpe passa inteiro;
- master em −14 LUFS, com teto de −3,3 dBTP de folga para o AAC. Com voz, o baque do carimbo (0,7) e a batida do título ficam mais suaves, porque o grave saturado e o estalo agudo passavam do pico depois do AAC.

## Áreas seguras

O motor calcula a caixa de cada elemento no seu instante de leitura, e o `npm run episodio` confere:
- todo o conteúdo entre **y 265 e 1456**;
- nada na coluna de botões (**x ≥ 950, y 1060–1560**): textos centrados em x = 525 com até 840 px, cards em x 80–940;
- o título do quadro 0 dentro do **recorte 3:4**.

## Capa

Gerada pelo próprio motor: fundo preto com a grade de pontos, a logo pequena no topo ao centro (y ≈ 322–390), o chip da série e o título **centralizados na vertical do recorte 3:4** (centro em y = 960), com o canto do ícone de play e a faixa do contador livres.

## Som

`audio.py` (efeitos sintetizados, sem samples), nos instantes exportados pela animação:
- uma batida seca na parte lima do título;
- um sopro quando o título vira cabeçalho;
- um **toque de vidro** a cada card, subindo na pentatônica de Lá bemol;
- **"o corte"** da marca (a varredura) junto com a barra, e o **carimbo** (baque grave, tapa, a pilha chacoalhando);
- sopros na saída, na virada e no fecho; um acorde de vidro na virada;
- a **assinatura completa** (varredura + Lá bemol 5 → Mi bemol 6) na logo;
- tom de sala quase inaudível.

## Arquivos

```
series/pelos-olhos-do-hospede/
  motor.js                 o motion (layout e linha do tempo calculados a partir do roteiro)
  audio.py                 os efeitos da série (e, com voz, a mixagem da narração)
  voz.py                   a narração (ElevenLabs): uma fala por cena + durações para o motor
  episodios/<id>.json      o roteiro de cada episódio (a única coisa que muda)
tools/episodio.cjs         um episódio inteiro, do roteiro à revisão (npm run episodio -- <id>)
reels/<id>/                a pasta gerada do episódio (vídeo, capa, storyboard, revisão)
```
