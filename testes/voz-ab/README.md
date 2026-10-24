# Teste A/B de narração (fora da produção)

`python3 testes/voz-ab/voz_ab.py` gera as três versões. Os detalhes de cada uma (modelo, ajustes, contexto e seed) ficam em `teste.json`.

**Texto** (capítulo 0 de `series/explica/episodios/case-guardiao-da-serra.json`, igual ao JSON):
"Três cachoeiras dentro da pousada. Como mostrar isso num site?"

- previous_text: nenhum (é o 1º capítulo).
- next_text: "O primeiro pedido: quem chega precisa saber das cachoeiras… Então elas abrem o site, logo no topo."
- Voz: Raquel (`GDzHdQOi6jjf8zaXhCYD`), com seed 17026 e a troca FAZLO/Fazlo → Fázlo (este texto não tem a palavra).

| Arquivo | Modelo | Ajustes |
|---|---|---|
| `voz-A.mp3` | eleven_multilingual_v2 | stability 0,40 · similarity 0,80 · style 0,35 · speaker boost · speed 1,0 (o atual) |
| `voz-B.mp3` | eleven_multilingual_v2 | igual ao A, com style 0 |
| `voz-C.mp3` | eleven_v4 | stability 0,50 · similarity 0,75 · style padrão (como em "Site não é luxo") |

O v4 aceitou o previous_text/next_text, então as três versões foram geradas com o mesmo contexto. Nenhum vídeo nem script de produção foi alterado.
