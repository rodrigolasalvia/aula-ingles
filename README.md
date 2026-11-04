# Aula de Inglês

PWA pessoal para se preparar para a aula de Speaking com a professora nativa. Sessões de 10 a 15 minutos.
Princípio: **READ → BUILD → LISTEN → REPEAT → SPEAK**. Interface toda em inglês.

## Como funciona (v4)
- A lição tem uma tela por lâmina. Cada lâmina: título e pergunta originais, "Understand the slide" (resumo curto em inglês com Listen/Slow 0.85x e expressões-chave com explicação breve em inglês) e 5 perguntas para construir com blocos (2 de aquecimento + as 3 perguntas da professora).
- Toque nos blocos para montar, toque de novo para remover, Check; se errar, tente de novo.
- Cada resposta certa **fica fixa na tela**, com áudio: a lâmina vira um cartão de consulta para a aula.
- "Try without looking" esconde as respostas e deixa só as perguntas, para treinar falando.
- **Banco de exercícios (v6):** cada rodada do Practice sorteia 10 do banco da lição, primeiro os nunca feitos, depois os errados. Lacunas podem ter mais de um campo ("___ (study) … ___ (pass)").
- **My answers for the teacher (v6):** página só com os exercícios da professora, na ordem dela, com a última resposta do aluno (✓/✗ e correção), respostas próprias opcionais para as perguntas abertas e botão "Save as PDF" (impressão do navegador).
- **Refazer (v6.1):** nas lâminas, "Redo" em cada resposta e "Redo all" no fim; na página da professora, "Redo this exercise" (os itens na ordem dela) e "Redo" por item; perguntas abertas abrem na lâmina. A nova resposta substitui a anterior; rodadas de refazer não contam no último/melhor do Practice.
- **Practice (v5):** cerca de 10 exercícios objetivos por lição (escolher, completar, corrigir a frase, montar com blocos), um por vez, com correção na hora, explicação e dica de uso; no fim, percentual, acerto por habilidade e erros. A tela da lição mostra o último e o melhor resultado. Exercícios da professora levam `source: "teacher"` (aparece "From your teacher"); os criados a partir do tema, `source: "extra"`. Gabarito da professora quando ela mandar; senão, criado.

Lição em `data/v4/lNNN.json`, listada em `data/v4/lessons.json`. Pastas `data/`, `data/v2/` e `data/v3/` ficam só para quem ainda não atualizou o app.

## Dados e segurança
- Sem servidor e sem conta. Progresso só no aparelho: localStorage + cópia anterior + espelho e cópias diárias em IndexedDB. Dados de versões anteriores são preservados.
- Backup manual em Settings.
- CSP restrita: só recursos do próprio site.
- Lição nova não exige atualização do app. Mudança de código exige subir `APP_VERSION` (js/core.js) e `CACHE_VERSION` (sw.js).

## Publicar uma lição nova
1. Copiar `tools/build_l001_v4.py` para `tools/build_lNNN_v4.py`, trocar o conteúdo e rodar (atualiza `data/v4/lessons.json`).
2. `npm test` e `python3 tests/e2e.py`.
