# Aula de Inglês

PWA pessoal para se preparar para a aula de conversação com a professora nativa: **entender, aprender e praticar** o material de cada aula.

## Como funciona (v2)
- Cada material da professora vira uma **lição** em `data/v2/lNNN.json`, listada em `data/v2/lessons.json`.
- **Um bloco por lâmina**: tópico (EN + PT) → cenário original + resumo em PT → useful words & phrases (com exemplo e áudio) → discuss (perguntas da aula + PT + exemplo de resposta) → frases novas com o conteúdo → pratique (completar, montar a frase, escrever a sua frase).
- Fim do bloco: onde foi bem e onde focar. Fim da lição: relatório para colar no chat, onde as frases são corrigidas.
- `data/lessons.json` e `data/l001.json` são da v1 e ficam no repositório só para quem ainda não atualizou o app.

## Dados e segurança
- Sem servidor e sem conta. Progresso só no aparelho: localStorage + cópia anterior + espelho e cópias diárias em IndexedDB.
- Backup manual em Ajustes (exportar/importar JSON).
- Gravações de voz ficam só na memória da tela e nunca são salvas ou enviadas.
- CSP restrita: só recursos do próprio site.
- Lição nova não exige atualização do app (pasta `data/` é buscada na rede primeiro). Mudança de código exige subir `APP_VERSION` em `js/core.js` e `CACHE_VERSION` em `sw.js`.

## Publicar uma lição nova
1. Copiar `tools/build_l001_v2.py` para `tools/build_lNNN_v2.py`, trocar o conteúdo e rodar (ele já atualiza `data/v2/lessons.json`)
2. Conferir
3. `npm test` e `python3 tests/e2e.py`
