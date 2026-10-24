# FAZLO Digital — Série Explica

Vídeos explicativos da @fazlodigital, de 60–90 s, em capítulos e narrados. Cada episódio explica um assunto em partes, e a tela constrói o assunto peça por peça, no tempo da voz.

É um **modelo com motor próprio**: cada episódio é só um JSON (`episodios/<id>.json`) e um comando.

| Episódio | Tema | Duração | Saída |
|---|---|---|---|
| **explica-01** | "O site que faz o hóspede reservar. Em 7 partes." Capa, 01 o topo, 02 tem vaga?, 03 os quartos, 04 as regras, 05 como chegar, 06 a mensagem, 07 no celular, fecho | 83,3 s · revisão aprovada · aguardando avaliação | [`output/explica-01/`](output/explica-01) |
| **case-guardiao-da-serra** | Collab "A pousada pediu. A gente fez." com a Pousada Guardião da Serra: os 4 pedidos da pousada e a tela REAL do site resolvendo cada um (modo collab, abaixo) | ver o README do Reel | [`../../reels/case-guardiao-da-serra/`](../../reels/case-guardiao-da-serra) |

Em `output/<id>/` ficam:
- **Vídeo:** `fazlo-digital-<id>.mp4`.
- **Capa:** `capa.png`. É o quadro 0 do vídeo.
- **Storyboard:** `storyboard.jpg`, com a montagem e a parte pronta de cada capítulo. Também `progresso.jpg` e `progresso/`, com o recurso de progresso funcionando.
- **Revisão:** pasta `revisao/`, com `relatorio-tecnico.txt`, `areas-seguras.jpg`, `capa-no-feed.jpg` (a capa no recorte 3:4 da grade), `motor.json` e `caixas.json`.

## Origem

A parte técnica veio do motor da Série Explica do FAZLO Hospeda (repositório `motiongraphics`, só leitura) e foi reescrita aqui:
- voz inteira por capítulo, com conferência e histórico;
- linha do tempo por palavra;
- mixagem contínua com ducking;
- render quadro a quadro, QA, capa e storyboard;
- JSON por episódio e comando único.

**Todo o visual e todo o som são da FAZLO Digital:**
- Unbounded + Sora, lima `#C6FA41`, branco, fundo `#050606`;
- a logo do kit oficial;
- a barra do Z como gesto (46°, dx/dy = −0,966);
- "o corte" de `tools/audio/fzbrand.py`.

Nenhuma cor, fonte, logo, ícone, animação ou som do Hospeda foi reutilizado. Também não há trilho, nós numerados, câmera descendo nem card de vídeo no fecho.

## Os princípios do formato

1. **Recurso de progresso: "a página em construção".**
   - **O celular do canto:** um celular em wireframe fica fixo no canto superior direito (x 808–940, y 270–521, dentro da área segura). Ele tem 7 blocos tracejados, um para cada parte.
   - **A parte do capítulo:** cada capítulo constrói a sua parte do site, em tamanho grande, no centro. Enquanto isso, o bloco dela pulsa em lima tracejado.
   - **O encaixe:** no fim do capítulo, a parte encolhe, voa e se encaixa no bloco. O bloco acende em lima com o número (01…07).
   - **O cursor:** um cursor de editor (barra vertical lima piscando) desce para o próximo bloco vazio. No fecho, ele reaparece no campo de comentário.
   - **A troca:** um **corte diagonal** na inclinação da barra do Z (0,8 s). Uma barra lima atravessa a tela da esquerda para a direita, com **"o corte"** no som quando cruza o centro.
2. **A cena se constrói, nunca é trocada.** Cada peça entra na palavra da voz que a dispara: cards entrando, campos preenchendo, checks, etiquetas acendendo, rota desenhando.
3. **Título e apoio.**
   - O título tem 2 linhas, fica fixo durante o capítulo e é escrito em Unbounded 800. A 2ª linha é lima, e as linhas entram fatiadas na inclinação da barra.
   - Embaixo vai uma linha de apoio em Sora cinza, que muda a cada frase.
   - Cada apoio fica **≥ 1,5 s inteiro** na tela e sai antes de o próximo entrar: nunca há dois ao mesmo tempo.
4. **Fundo por capítulo.** O fundo muda levemente de tom: `palco`, `ardosia`, `musgo`, `carvao`, `abismo`, `oliva`, `noite` e `grafite`, todos tons escuros da família da marca.
   - Uma luz lima bem fraca muda de lugar a cada capítulo.
   - Uma hachura fina na inclinação do Z desliza devagar, para o quadro nunca ficar congelado.
   - A marca fica fixa no topo de todos os quadros: a logo FAZLO DIGITAL do kit + o @ do roteiro.
5. **Voz.**
   - É a voz oficial da FAZLO no ElevenLabs (Raquel, `eleven_v4`, desde 24/10), a mesma da série "Pelos olhos do hóspede".
   - **Cada capítulo é UMA geração inteira.** Se algo sair ruim, o capítulo inteiro é gerado de novo com outra semente. Nunca se emendam palavras nem trechos.
   - Por baixo vai uma trilha contínua própria, com ducking. O master fica em **−14 LUFS**, com pico real **≤ −1 dBTP** medido no MP4.
6. **Fecho.**
   - Primeiro, o título e o chamado: salvar, mandar e a pergunta para comentar. O celular completo cresce no centro, e salvar, enviar e comentar acendem nas palavras.
   - Nos **últimos 3 s**, só a logo oficial FAZLO DIGITAL, centralizada e parada. Ela entra com um corte diagonal e a assinatura sonora completa.
7. **Formato.**
   - 1080×1920, 60 fps, H.264 + AAC 48 kHz, 60–90 s.
   - As áreas seguras são as da série "Pelos olhos do hóspede": conteúdo entre **y 265 e 1456** e nada na coluna de botões (**x ≥ 950, y 1060–1560**).
   - A capa é o quadro 0 e cabe no recorte 3:4 da grade.
8. **Ilustração e interface estilizadas e genéricas.** Valores aparecem como barras.
   - **Nada de:** logos de apps ou plataformas, telefone, nome de pessoa, número inventado ou depoimento.
   - **Nome de pousada:** sempre "Sua Pousada", só com as iniciais maiúsculas.

## O comando único

```bash
series/explica/scripts/episodio.sh explica-01               # gera só a narração que falta e faz o resto
series/explica/scripts/episodio.sh explica-01 --refaz 3,5   # gera de novo, INTEIROS, os capítulos 3 e 5 (outra semente)
series/explica/scripts/episodio.sh explica-01 --forcar      # renderiza mesmo fora de 60–90 s (ou do "duracao_alvo")
python3 series/explica/scripts/voz.py explica-01 --so 0,4,5  # gera só esses capítulos (amostras para aprovar antes do resto)
python3 series/explica/scripts/voz.py explica-01 --refaz 0 --semente 0:5026   # o cap 0 com uma semente escolhida, conferido de novo
python3 series/explica/scripts/linha.py explica-02 --estimativa   # estima as durações de um roteiro novo, sem voz e sem API
```

O comando roda, em ordem:

| Passo | Script | O que faz |
|---|---|---|
| 1 | `voz.py` | uma geração inteira por capítulo, conferida, com histórico em `audio/<id>/voz/falas.json` |
| 2 | `linha.py` | a linha do tempo por palavra (capítulos, frases, apoios, voo, cursor, cortes) + a narração montada (`voz.wav`) |
| — | | **para aqui se a duração sair de 60–90 s** e mostra as durações por capítulo (a voz nunca é acelerada) |
| 3 | `render.cjs cues` | os eventos de som tirados da animação |
| 4 | `audio.py` | voz + trilha contínua + efeitos → `mix.wav` em −14 LUFS |
| 5 | `render.cjs video` | o vídeo quadro a quadro (Chromium headless → x264 CRF 15) + o áudio em AAC 256 kb/s |
| 6 | `render.cjs capa` | a capa (quadro 0) |
| 7 | `render.cjs info` | os dados da revisão (apoios, trocas, montagens e as caixas do conteúdo a cada 0,25 s) |
| 8 | `storyboard.py` | storyboard + folha do recurso de progresso |
| 9 | `qa.py` | a revisão técnica; sai com erro se algo falhar |

Nenhum código muda de um episódio para outro. A narração gerada fica no repositório, então o episódio é refeito sem chamar a API.

### A chave do ElevenLabs

A chave fica **só em Segredos de rede**: na nuvem, a rede põe o cabeçalho `xi-api-key` nas chamadas a `api.elevenlabs.io`. A chave verdadeira começa com `sk_`; o *ID* da chave não funciona.

Fora da nuvem, exporte `ELEVENLABS_API_KEY` no terminal. Os scripts só leem a variável se ela existir e nunca a imprimem, salvam ou registram.

### A voz e a conferência

**Voz** (desde 24/10, a versão C aprovada no teste A/B de `testes/voz-ab`):
- Raquel (`GDzHdQOi6jjf8zaXhCYD`), **`eleven_v4`**.
- Estabilidade 0,50 · semelhança 0,75. Estilo, speaker boost e velocidade ficam no padrão do modelo (não são enviados). Idioma pt.
- MP3 44,1 kHz 128 kb/s, com alinhamento por caractere.
- O capítulo anterior vai como `previous_text`. O seguinte **não** vai como `next_text` (regra de 23/10, da série "Pelos olhos do hóspede": com ele, o ElevenLabs devolvia a fala cortada no fim do arquivo, como se emendasse direto na próxima).
- **Dicionário de pronúncia** (só no texto enviado; a tela não muda), sem diferenciar maiúsculas: FAZLO → "Fázlo" · WhatsApp → "Uátsap".
- **Episódios já narrados ficam com a voz deles.** Se `audio/<id>/voz/falas.json` existe, valem o modelo, os ajustes e o dicionário gravados ali, inclusive num `--refaz`; assim um episódio nunca mistura vozes. explica-01 e case-guardiao-da-serra foram narrados com `eleven_multilingual_v2` (0,40 / 0,80 / estilo 0,35 / speaker boost / velocidade 1,0) e só a troca FAZLO → Fázlo.

**Conferência de cada geração.** Se falhar, o capítulo inteiro é gerado de novo com outra semente, até 6 vezes:

| Item | Regra |
|---|---|
| ritmo | 8–18 letras por segundo de fala (era 9–18 até 24/10) |
| pausas | entre frases, respiro de 0,12 s a 1,6 s (silêncio medido no áudio); dentro de uma frase, nenhuma pausa passa de 1,2 s (eram 1,1 s e 0,85 s até 24/10: o eleven_v4 fala com mais pausas). Conta como "entre frases" a troca de item da `fala` e todo fim de frase dentro de um item (palavra que termina em . ? ! …) |
| fim de frase | o arquivo tem de **terminar em silêncio** (abaixo de −50 dB); se acaba com a voz soando, é corte. A queda de −15 dB (relativo ao pico da fala) até o silêncio (−50 dB) tem de durar **≥ 55 ms quando a última palavra termina em vogal** e **≥ 35 ms** nas outras (calibração de 23/10: 40 ms numa vogal soou cortado; 59 e 63 ms soaram naturais). Quedas que começam em −20 dB ou abaixo são fim natural. A voz também não pode subir no fim de uma frase afirmativa |
| perguntas | em toda frase com "?", a altura da voz sobe ≥ 10% na parte final (a tônica) |
| transcrição | se a chave tiver a permissão de speech-to-text, o texto ouvido bate com o roteiro, palavra por palavra (≥ 92%); sem a permissão, a geração segue e o histórico registra `transcricao: null` |

**Calibração do corte:** um fecho ouvido como cortado em outro episódio caía de −8,7 dB ao silêncio em 32 ms. Finais de 37–57 ms a partir de nível mais baixo soaram normais.

O `falas.json` guarda, por capítulo:
- o texto, a semente usada e o sha1 do áudio;
- o alinhamento;
- o **histórico de todas as gerações inteiras**: semente, medidas e o motivo de cada recusa.

## Tempo de um capítulo

| Momento | Tempo |
|---|---|
| **corte** | 0,8 s. O capítulo novo "começa" no meio do corte, quando a barra cruza o centro |
| **voz** | entra 0,30 s depois (no capítulo 0, em 0,10 s: a capa é o quadro 0 e já está montada) |
| **peças** | cada peça entra na palavra marcada em `em` |
| **voo** | 0,12 s depois da última palavra, a parte encolhe e voa até o bloco (0,62 s); o bloco acende e o cursor desce |
| **próximo corte** | 0,14 s depois do encaixe. Nunca antes de o último apoio ter ficado 1,5 s inteiro, nem antes de `min` |
| **fecho** | 0,45 s depois da fala, um corte de 0,5 s deixa só a logo, parada por 3 s. O fecho tem no mínimo `min` s |

## Formato do JSON

```json
{
  "id": "explica-01",
  "titulo": "O site que faz o hóspede reservar. Em 7 partes.",
  "marca": "@fazlodigital",
  "capitulos": [
    {
      "rotulo": "O TOPO",
      "tom": "ardosia",
      "titulo": ["Primeira tela:", "onde ele está."],
      "fala": [
        { "texto": "Primeira parte: o topo.", "apoio": "A primeira parte é o topo do site." },
        { "texto": "Uma foto forte, o nome e a cidade.", "apoio": "Uma foto forte, o nome e a cidade." }
      ],
      "diagrama": { "tipo": "topo", "quadro": { "em": "topo" }, "foto": { "em": "foto" } },
      "inicio": 0.30, "min": 0, "semente": 2043
    }
  ]
}
```

**Os capítulos:**
- O **capítulo 0 é a capa** (diagrama `capa`), e o `rotulo` dele vira a pílula da capa.
- Os capítulos 1 a 7 são as 7 partes e ganham os números 01…07 no rótulo e no celular do canto.
- O último é o `fecho`.

**Os campos:**
- **`fala`:** as frases do capítulo, na ordem. O texto falado é a junção delas, **inteiro numa geração só**.
- **`apoio`:** a linha de apoio que entra com a frase. `null` = nenhuma; igual à anterior = continua.
- **`titulo`:** sempre 2 linhas, a 2ª em lima. O tamanho se ajusta: a 1ª linha cabe em 700 px, ao lado do celular do canto, e a 2ª em 860 px.
- **`tom`:** `palco`, `ardosia`, `musgo`, `carvao`, `abismo`, `oliva`, `noite` ou `grafite`.
- **Opcionais:**
  - `inicio`: a pausa antes da voz;
  - `min`: a duração mínima do capítulo;
  - `semente`: a semente da 1ª geração.

**`em`: a palavra da fala que dispara a peça.**
- `"cidade"` dispara na 1ª vez que a palavra aparece; `"cidade#2"`, na 2ª.
- Acentos e maiúsculas não importam.
- `"+1.2"` dispara 1,2 s depois do começo do capítulo; `"fim"`, no fim da fala.
- Se a palavra não existir, a peça entra num tempo padrão e o `render.cjs cues` avisa.

### Campos de episódio opcionais

- **`saida`:** a pasta das entregas (ex. `reels/case-guardiao-da-serra/output`); sem ela, `output/<id>/`.
- **`duracao_alvo`:** a faixa de duração, ex. `[45, 60]` (padrão `[60, 90]`); o comando para antes do render fora dela.
- **`conferencia`** (por capítulo): `ritmo_max`, `respiros` por troca de frase e `enfase` (`{"trecho": "...", "min": 0.06}`: a altura da voz no trecho fica ao menos 6% acima do resto do capítulo).
- **`progresso`** e **`telas`:** o modo collab (abaixo).

### Modo collab: "A pousada pediu. A gente fez." (`"progresso": "pedidos"`)

Um episódio com a pousada parceira, mostrando o site REAL que a FAZLO fez. O motor troca o celular de 7 blocos por um recurso de progresso próprio:

- **A lista dos pedidos:** 4 cartõezinhos "01–04" no canto superior direito (x 808–940, y 270–506). Na capa ela aparece vazia no centro e vai para o canto; o pedido do capítulo pulsa em lima tracejado.
- **O cartão "O PEDIDO:":** o texto do pedido entre aspas, sem nome, sem horário e sem cara de print de conversa. Entra grande e, quando a tela entra, encolhe para o topo.
- **A tela real:** PNGs capturados do site no ar (campo `telas`: a pasta com `telas.json` + PNGs de 1170 px de largura), dentro de um celular genérico sem marca. Contornos lima realçam o que resolve o pedido; a tela rola, troca com o corte na inclinação do Z, recebe um toque (indicador de toque) que abre a foto na tela inteira, e a consulta pode chegar num balão de conversa genérico (sem logo de app, sem número) com a mensagem que o próprio site monta.
- **Resolvido:** o selo ✓ no canto do celular; no fim do capítulo o cartão voa até o cartãozinho dele, que acende em lima com o ✓.

| `tipo` | Visual | Campos |
|---|---|---|
| `capa_collab` | a capa ilustrada (quadro 0): selo do rótulo, cachoeira em traço lima com o balão "O pedido ✓", selo lima e o título do gancho (2ª frase em lima, até 4 linhas); na palavra de `lista`, a lista vazia aparece no centro e vai para o canto | `selo`, `lista: {em}` |
| `pedido` | o cartão "O PEDIDO:" + o celular com a tela real | `pedido`, `cartao: {em}`, `tela: {src, em}` ou `telas: [{src, em, realce}]`, `realce: [{caixa, em}]`, `toque: {caixa, em, abre, abre_em}`, `mensagem: {em}`, `resolve: {em}` |
| `fecho_collab` | a lista com os 4 ✓ cresce no centro, o destaque em lima, a linha branca e o site; depois, só a logo | `destaque`, `para`, `site`, `lista: {em}`, `credito: {em}`, `para_em: {em}` |

Os capítulos de pedido não têm título (`"titulo": null`): o cartão faz esse papel. `caixa` é o nome de uma caixa gravada em `telas.json` pela captura.

### Biblioteca de diagramas da FAZLO

| `tipo` | Visual | Campos |
|---|---|---|
| `capa` | pílula do rótulo, título grande, o celular vazio com 7 blocos tracejados (piscam em sequência na palavra de `conta`; o cursor aparece em `monta`) e a faixa no formato da barra do Z; no fim, o celular encolhe e vai para o canto | `faixa`, `conta: {em}`, `monta: {em}` |
| `topo` | o topo do site: foto ilustrada (paisagem genérica) entrando na diagonal, nome digitado, cidade com pino; etiquetas que acendem nas palavras e realçam o que respondem | `quadro`, `etiquetas: [{t, em}]`, `mostra_etiquetas`, `foto`, `nome: {t, em}`, `cidade: {t, em}` |
| `consulta` | card de consulta montado campo a campo: campos vazios tracejados, datas preenchendo como barra, pessoas com − e +, botão que acende; balão com a 2ª linha do título; o topo já montado aparece logo acima | `cartao: {t, em}`, `topo: {em}`, `campos: [{t, tipo: data\|pessoas, em, mais: [palavras]}]`, `botao: {t, em, depois}`, `esqueleto` |
| `quartos` | dois cards de quarto: foto ilustrada (cama, janela), chip de capacidade, "a partir de R$" com o valor como barra, destaque e check | `quartos: [{t, cabe, em, atraso}]`, `fotos`, `cabe`, `valor: {t, em}`, `destaque`, `bolso` |
| `incluso` | lista com ícone e check; um balão "?" aparece antes de cada item e estoura quando o item entra; uma nuvem de "?" estoura na palavra de `escrito` | `lista: {t, em}`, `itens: [{t, icone: cafe\|relogio\|pet, em}]`, `perguntas`, `escrito` |
| `mapa` | mapa abstrato (quadras, rio, ruas), pino caindo, rota pontilhada desenhando entre duas palavras, trecho de terra, ponte, etiquetas com fio até o lugar e o hóspede andando até o pino | `mapa`, `pino: {em, depois}`, `rota: {em, ate}`, `chips: [{t, em}]` (terra, ponte), `chegou` |
| `mensagem` | card de consulta compacto + conversa genérica (avatar de casa, "Sua Pousada", sem logo de app): os dados voam do card até o balão e se encaixam nos campos; check duplo e a resposta começando | `consulta`, `balao: {t, em}`, `campos: [{t, em}]` (datas, pessoas, quarto), `visto` |
| `celular` | o celular grande com a página inteira (as partes já montadas, em miniatura) rolando; recarrega com barra curta; a página larga demais encaixa na tela; indicadores "Abre rápido", "Cabe na tela" e "Sem zoom" (lupa riscada) | `celular`, `rola: {em, ate}`, `carrega`, `cabe`, `zoom` |
| `fecho` | o celular completo cresce no centro; salvar, enviar e comentar acendem nas palavras; campo de comentário com o texto e o cursor de editor piscando; nos últimos `logo` s, só a logo | `cresce`, `acoes: [{icone: salvar\|enviar\|comentar, t, em}]`, `comentario: {t, em}`, `logo` |

**Ícones** (desenho próprio, traço em grade de 24): cafe, relogio, pino, pessoa, calendario, mais, menos, salvar, enviar, comentar, lupa, raio, largura, check, casa, menu, imagem e a pata (pet).

**Diagrama novo:** é um bloco `CENAS.<nome>` em `src/motor.js`, com quatro partes:
- `setup(cap)`: resolve os tempos com `at(cap, "palavra")`, registra os sons com `cue(t, 'tipo')` e define `S.parte`, a caixa que voa até o bloco.
- `parte(c, cap, S, t)`: desenha o que vai para o bloco.
- `extra(c, cap, S, t)`: desenha o que fica fora dele e sai antes do voo.
- Peças prontas para usar: `painel`, `chip`, `selo`, `checkMark`, `tracejado`, `barra`, `balao`, `anel`, `icon`, `entra`, `clipRevela`, `paisagem` e `quarto`.

O resto vem sozinho: rótulo, título, apoio, fundo, marca, o celular do canto, o voo, o cursor, o corte e as caixas para a revisão.

## Som

`audio.py`, sintetizado com `tools/audio/fzaudio.py` e `fzbrand.py`, sem samples.

**Trilha "Página em construção":**
- 100 BPM, em Lá bemol maior, a tonalidade da assinatura.
- Ré bemol 7M(9) → Lá bemol/Dó (9) → Fá m7(9) → Mi bemol sus.
- Teclado FM em síncope, cama de serras filtradas, baixo senoidal, bumbo macio nos tempos 1 e 3, aro nos tempos 2 e 4 e chocalho.
- Contínua do quadro 0 até a logo, onde resolve em Lá bemol.
- Fica ~15 LU abaixo da voz e abaixa até 7 dB enquanto ela fala.

**Efeitos:**
- **"o corte"** (`sig_cut`) em cada troca de capítulo.
- **O encaixe no bloco:** um estalo, um grave curto e um sino FM que sobe um grau da escala a cada capítulo.
- **A assinatura completa** (varredura + Lá bemol 5 → Mi bemol 6) na logo.
- Toques curtos de vidro FM nas peças, nos campos e nos checks.

**Voz:**
- Um ganho só por capítulo, passa-altas em 80 Hz e compressão leve.

## Estrutura

```
series/explica/
  episodios/<id>.json     roteiro (o único arquivo que muda entre episódios)
  scripts/episodio.sh     o comando único
  scripts/voz.py          narração: uma geração inteira por capítulo, conferida, com histórico
  scripts/linha.py        linha do tempo por palavra + narração montada sem cortes (--estimativa: sem voz)
  scripts/audio.py        voz + trilha contínua com ducking + efeitos -> audio/<id>/mix.wav (−14 LUFS)
  scripts/render.cjs      cues | info | capa | video | stills (Chromium headless, quadro a quadro)
  scripts/qa.py           revisão técnica
  scripts/storyboard.py   storyboard (montagem + pronto) e folha do recurso de progresso
  src/motor.js            o motor (window.EXPLICA): progresso, corte, título, apoio, diagramas, ícones, marca
  src/index.html          página de render e de prévia (/series/explica/src/index.html?ep=<id>&t=12.5, com som)
  audio/<id>/             narração (voz/cap-NN.mp3 + falas.json), linha.json, cues.json, mix.wav e as pistas
  output/<id>/            vídeo, capa, storyboard, progresso e revisão
```

Para a prévia interativa, rode `npm run dev` e abra `http://127.0.0.1:5173/series/explica/src/index.html?ep=explica-01`.
