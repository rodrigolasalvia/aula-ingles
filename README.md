# Aula de Inglês

PWA pessoal para se preparar para a aula de conversação com a professora nativa: **entender, aprender e praticar** o material de cada aula.

## Como funciona
- Cada material da professora vira uma **lição** em `data/lNNN.json`, listada em `data/lessons.json`.
- Cada lição tem 4 etapas de ~15 min: **Entender → Praticar → Preparar a fala → Véspera da aula**.
- Erros voltam como **retomada** no começo da etapa seguinte.
- Ao fim de cada etapa: avaliação (onde foi bem, onde foi mal, onde focar) e **relatório para colar no chat**, onde a escrita é corrigida.
- **Material** de consulta para usar durante a aula: expressões com áudio, gramática, kit de argumentação, perguntas com modelo e suas respostas.

## Dados e segurança
- Sem servidor e sem conta. Progresso só no aparelho: localStorage + cópia anterior + espelho e cópias diárias em IndexedDB.
- Backup manual em Ajustes (exportar/importar JSON).
- Gravações de voz ficam só na memória da tela e nunca são salvas ou enviadas.
- CSP restrita: só recursos do próprio site.
- Lição nova não exige atualização do app (pasta `data/` é buscada na rede primeiro). Mudança de código exige subir `APP_VERSION` em `js/core.js` e `CACHE_VERSION` em `sw.js`.

## Publicar uma lição nova
1. Criar `tools/build_lNNN.py` → `python3 tools/build_lNNN.py`
2. Adicionar a lição em `data/lessons.json`
3. `npm test` e `python3 tests/e2e.py`
