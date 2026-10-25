# Legenda palavra por palavra

Legenda para os vídeos narrados da @fazlodigital, palavra por palavra. Segue o padrão aprovado da série FALA do FAZLO Hospeda (repositório `motiongraphics`, só leitura), na identidade FAZLO:
- **Fonte:** Unbounded 800, 50 px.
- **Cor:** branco, com o destaque em limão `#C6FA41`.

O módulo é **independente de motor**:
- `legenda.py` entrega as palavras com a grafia do roteiro e o tempo do vídeo;
- `legenda.js` monta as páginas e desenha;
- cada motor só chama `desenha(ctx, t)`.

**Status:** módulo pronto · estilo aguardando aprovação ([amostra](amostra/amostra-explica-cap03.png)).

| Arquivo | O que faz |
|---|---|
| `legenda.py` | Casa o roteiro com o alinhamento já salvo da voz. Leva os tempos ao áudio final, confere a sincronia e escreve `legenda.json` + `legenda.txt` (o relatório). **Nunca chama a API.** |
| `legenda.js` | Monta as páginas, desenha a legenda e devolve as caixas para a revisão das áreas seguras. Roda no navegador, com a fonte de verdade. |
| `confere.cjs` | Monta as páginas no Chromium headless para o `legenda.py` conferir. |

```bash
python3 tools/legenda-palavras/legenda.py explica <id>   # -> series/explica/audio/<id>/legenda.json (+ .txt)
python3 tools/legenda-palavras/legenda.py pelos <id>     # -> reels/<id>/audio/voz/legenda.json (+ .txt)
```

## Ligar num episódio

- **Campo no roteiro:** `"legenda": true` no JSON do episódio. O padrão é `false`, e os episódios publicados continuam com `false`.
- **Os comandos de cada série já rodam o `legenda.py`:**
  - `series/explica/scripts/episodio.sh`, depois do `linha.py`;
  - `tools/episodio.cjs`, depois dos cues.
- **Se a legenda estiver ligada e algo falhar, o comando para.**
- **Prévia sem mudar o roteiro:** `--legenda` no render, ou `&legenda=1` na URL.
  - Explica: `series/explica/scripts/render.cjs stills|video --legenda`;
  - Pelos olhos: `tools/render.cjs stills|preview <id> --legenda`.

## Destaque

Não há destaque automático. Sem o campo `"destaque"`, a frase fica toda em branco.

- **Série Explica:** o campo vai na própria frase. Ex.: `{"texto": "Fotos de verdade, …", "destaque": "de verdade"}`.
- **"Pelos olhos do hóspede":** o campo é `"destaques": {"card2": "taxa"}`. Numa fala em partes, use uma lista com um item por parte (`null` onde não há).
- **Regras:** um trecho só por frase, de 1 ou 2 palavras, e ele precisa estar na frase. Se não estiver, para com erro.

## Regras

- **Grafia:**
  - O texto na tela é o do roteiro (FAZLO, WhatsApp). Nunca aparece o texto enviado à API (Fázlo, Uátsap).
  - O roteiro e o alinhamento são casados palavra por palavra.
  - Se o número de palavras divergir, ou se um par não bater nem pelo dicionário de pronúncia, o comando **para com erro e diz onde**. Ele nunca adivinha.
- **Páginas:**
  - até 2 linhas, com o máximo de palavras que cabe em 820 px;
  - nunca passam de uma cena para outra; cada frase começa uma página nova;
  - com 2 linhas, o corte equilibra as larguras. Ele prefere a troca de frase e evita deixar um "o", "de"… no fim da linha ou da página;
  - a última página de uma cena nunca fica com 1 palavra só; se ela ficaria curta, puxa palavras da anterior.
- **Mínimo de 1,5 s por página:**
  - a frase que ficaria menos que isso na tela é juntada com a seguinte na mesma página de 2 linhas;
  - se for a última da cena, é juntada com a anterior;
  - a fala nunca é atrasada e as páginas nunca se sobrepõem;
  - o relatório diz quantas páginas foram juntadas.
- **Movimento:**
  - cada palavra entra quando começa a ser falada, em 90 ms, subindo 10 px;
  - as palavras já ditas ficam na tela;
  - a página sai em corte seco quando a próxima começa;
  - a última página fica até o fim do vídeo. Na Explica, ela sai com o corte da logo final, ou seja, some nos últimos 3 s. Na leitura longa da Pelos olhos (eps. 7+), ela sai quando o texto sai, antes da logo sozinha;
  - a palavra-chave dá um pulo de 7% de escala por 0,18 s.
- **Visual:**
  - sem painel atrás, só uma sombra suave (preto 70%, desfoque 14 px);
  - centralizada em x = 540, entre x 130 e 950, na faixa y 1300–1450;
  - nunca em y > 1536 nem em x ≥ 950. O pulo da palavra-chave já entra na conta da largura.
- **Sincronia:**
  - os tempos vêm do alinhamento da API, levados ao áudio final:
    - na Explica, o deslocamento de cada capítulo; os aparos de 40 ms antes da 1ª letra e 300 ms depois da última só tiram silêncio;
    - na Pelos olhos, cada parte de uma fala emendada é achada, amostra por amostra, no `<cena>.wav` do voz.py. Assim vale qualquer pausa entre as partes (0,25 s, 0,52 s ou `voz_pausas`). A posição de cada fala vem dos cues;
  - o início de cada palavra que vem depois de uma pausa (≥ 0,12 s) é medido na voz montada do vídeo, como na FALA. A marcação da API chegava a errar 89 ms nessas palavras;
  - a conferência usa outro critério, a subida da voz;
  - **meta: média < 40 ms, máximo < 80 ms.**

## Em cada série

- **Série Explica:**
  - com a legenda ligada, a linha de apoio cinza não aparece, nem o som dela. O `linha.py` não gera apoios;
  - os diagramas encolhem em escala (y 740–1450 → 650–1250, centrados em x = 540). A escala vale também para o voo da parte e para o celular da capa e do fecho;
  - a legenda é desenhada depois do capítulo e das peças fixas.
- **"Pelos olhos do hóspede":**
  - a legenda é só uma opção, desligada por padrão;
  - o layout dos cards não muda (a série fecha no ep. 9). Nas cenas em que os cards descem até y ≈ 1300, a legenda fica encostada neles.

## Teste de 25/10/2026 (só com os alinhamentos já salvos, sem API)

| Episódio | Páginas | Juntadas | Página mais curta | Sincronia (média / máx.) |
|---|---|---|---|---|
| explica-01 | 32 | 5 | 1,80 s | 22 / 62 ms |
| nao-achou-o-preco | 9 | 1 | 1,71 s | 19 / 76 ms |
| como-chega-ai | 8 | 3 | 2,73 s | 3 / 4 ms |
| tem-vaga-no-feriado | 10 | 1 | 1,84 s | 6 / 7 ms |
| viu-a-piscina | 8 | 3 | 2,63 s | 8 / 13 ms |
| cafe-incluso | 11 | 1 | 1,51 s | 12 / 31 ms |
| aceita-pet | 9 | 3 | 1,56 s | 4 / 5 ms |
| cabe-a-familia | 10 | 1 | 1,96 s | 30 / 50 ms |
| como-eu-reservo | 11 | 0 | 1,57 s | 15 / 37 ms |
| horario-check-in | 11 | 0 | 1,54 s | 13 / 24 ms |

Em todos os episódios:
- nenhuma grafia fonética na tela;
- nada fora de x 130–950 (usado: x 131–950) nem abaixo de y 1440.

**Explica com a legenda ligada:**
- 3675 caixas a cada 0,25 s, todas dentro de y 265–1456 e fora da coluna de botões;
- nenhuma sobreposição da legenda com o diagrama;
- diagramas até y 1250.

**Com a legenda desligada:**
- os quadros saem idênticos, pixel a pixel, aos do código anterior, nos dois motores;
- a QA existente passa;
- o hash dos MP4 publicados não mudou.
