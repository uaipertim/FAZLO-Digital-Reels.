# FAZLO Digital — "Instagram não é site" · corte curto

**Status: concluído · aprovado (16/10). Postar em 17/10, às 9h30.**

Versão de 15 s do Reel [`instagram-nao-e-site`](../instagram-nao-e-site), para a estratégia de volume. Tem um **gancho novo no quadro 0** (vale como capa) e três trechos do Reel original, sem redesenhar nada: o motion e a trilha vêm do próprio Reel.

| Tempo | Trecho | Do original |
|---|---|---|
| 0,0–1,8 s | **Gancho novo:** TEM VAGA? / QUANTO É? / FICOU NO **DIRECT.** (DIRECT. ganha o bloco lima em 0,6 s) | — |
| 1,8–4,8 s | Os balões chegam no direct ("AS FOTOS ENCANTAM.") | 6,6–9,6 s |
| 4,8–9,0 s | A barra lima varre, o celular vira site e os balões encaixam nas seções | 16,8–21,0 s |
| 9,0–15,0 s | "O INSTAGRAM ATRAI. O SITE RESPONDE.", a logo e "Fale com a FAZLO · link na bio" | 27,0–33,0 s |

Nos cortes de 1,8 s e 9,0 s, a barra lima da marca atravessa a tela inteira, com a varredura da assinatura sonora.

**Som:** a trilha do original, emendada nos mesmos cortes, no tempo da música (100 BPM), com 12 ms de transição em cada emenda. O gancho usa os dois tempos antes dos balões, e o "ping" do balão cai na batida do título. Master em −14 LUFS.

**Capa:** a logo no topo, como na capa do original, e o gancho centralizado no recorte 3:4.

| Entrega | Arquivo |
|---|---|
| Vídeo | [`output/fazlo-digital-instagram-nao-e-site-corte.mp4`](output/fazlo-digital-instagram-nao-e-site-corte.mp4) |
| Capa | [`output/capa.png`](output/capa.png) |
| Storyboard | [`output/storyboard.jpg`](output/storyboard.jpg) |
| Revisão | [`output/revisao/`](output/revisao) |

```bash
npm run build -- instagram-nao-e-site-corte
```

O Reel original não foi alterado: `reel.json` carrega `../instagram-nao-e-site/src/anim.js` antes do `src/anim.js` deste corte, que só escolhe os trechos e desenha o gancho e as barras.
