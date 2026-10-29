# Aula de Inglês

PWA pessoal para se preparar para a aula de Speaking com a professora nativa. Sessões de 10 a 15 minutos.
Princípio: **READ → BUILD → LISTEN → REPEAT → SPEAK**. Interface toda em inglês.

## Como funciona (v3)
1. **Understand:** resumo curto do cenário em inglês (Listen / Slow 0.85x) e só as expressões mais importantes, com explicação breve em inglês.
2. **Build the sentence:** 8 a 10 frases. Toque nos blocos na ordem certa; toque de novo para remover; Check; se errar, tente de novo; se acertar, explicação curta e áudio.
3. **Get ready to speak:** as perguntas da aula, com resposta-exemplo curta em blocos; depois de montar, áudio e "Try without looking".

Lição em `data/v3/lNNN.json`, listada em `data/v3/lessons.json`. Pastas `data/` (v1) e `data/v2/` ficam só para quem ainda não atualizou o app.

## Dados e segurança
- Sem servidor e sem conta. Progresso só no aparelho: localStorage + cópia anterior + espelho e cópias diárias em IndexedDB. Dados de versões anteriores são preservados.
- Backup manual em Settings.
- CSP restrita: só recursos do próprio site.
- Lição nova não exige atualização do app. Mudança de código exige subir `APP_VERSION` (js/core.js) e `CACHE_VERSION` (sw.js).

## Publicar uma lição nova
1. Copiar `tools/build_l001_v3.py` para `tools/build_lNNN_v3.py`, trocar o conteúdo e rodar (atualiza `data/v3/lessons.json`).
2. `npm test` e `python3 tests/e2e.py`.
