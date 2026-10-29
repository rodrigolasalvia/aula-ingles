import {
  APP_VERSION, formatDate, dayKey, migrateState, emptyState, blockState, checkItem, checkWrite,
  allPhrases, wordCount, tokens, blockResult, blockFeedback, lessonReport, shuffledOrder, scramble, looksLikeBackup,
} from './core.js';
import {
  loadState, saveState, hasLocal, recoverRicher, snapshot, listSnapshots, readSnapshot, requestPersistence, answerCount,
} from './storage.js';

const INDEX_URL = 'data/v2/lessons.json';

/* ---------- Estado e dados ---------- */

let state = loadState();
let index = [];
const lessons = {};
const main = document.getElementById('main');
let ui = {};          // estado efêmero da tela (ordem das opções, rascunhos)
let view = null;      // { lesson, block } na página de bloco

function save(opts) {
  const ok = saveState(state, opts);
  if (!ok) toast('Não consegui salvar no aparelho. Exporte um backup em Ajustes.');
  return ok;
}

async function fetchJSON(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}

async function loadIndex() {
  const data = await fetchJSON(INDEX_URL);
  index = (data.lessons || []).slice().sort((a, b) => b.date.localeCompare(a.date) || b.number - a.number);
}

async function getLesson(id) {
  if (lessons[id]) return lessons[id];
  const meta = index.find(l => l.id === id);
  if (!meta) return null;
  lessons[id] = await fetchJSON(meta.file);
  return lessons[id];
}

/* ---------- Utilidades de tela ---------- */

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const icon = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
};
const say = (text, label = 'Ouvir') => `<button class="say" data-action="say" data-text="${esc(text)}" aria-label="${esc(label)}">${icon.play}</button>`;

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
}

function setTab(page) {
  document.querySelectorAll('.tabbar a').forEach(a => a.classList.toggle('on', a.dataset.page === page));
}

/* ---------- Voz ---------- */

let voices = [];
function loadVoices() {
  try { voices = (speechSynthesis.getVoices() || []).filter(v => /^en[-_]/i.test(v.lang)); } catch { voices = []; }
}
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }

function speak(text) {
  if (!('speechSynthesis' in window)) { toast('Este navegador não tem leitura em voz alta.'); return; }
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = voices.find(x => x.name === state.settings.voice) || voices.find(x => /en-US/i.test(x.lang)) || voices[0];
    if (v) u.voice = v;
    u.lang = v ? v.lang : 'en-US';
    u.rate = state.settings.rate || 0.95;
    speechSynthesis.speak(u);
  } catch { toast('Não consegui reproduzir o áudio.'); }
}

/* ---------- Roteamento ---------- */

async function route() {
  document.getElementById('toast').hidden = true;
  try { speechSynthesis.cancel(); } catch { /* ignore */ }
  ui = {}; view = null;
  const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
  try {
    if (!index.length) await loadIndex();
    if (parts[0] === 'lesson' && parts[1]) {
      const lesson = await getLesson(parts[1]);
      if (!lesson) return notFound();
      if (parts[2] === 'b' && parts[3]) {
        const block = lesson.blocks.find(b => b.id === parts[3]);
        return block ? renderBlock(lesson, block) : notFound();
      }
      if (parts[2] === 'report') return renderReport(lesson);
      return renderLesson(lesson, false);
    }
    if (parts[0] === 'lessons') return renderLessons();
    if (parts[0] === 'settings') return renderSettings();
    return renderHome();
  } catch (e) {
    console.error(e);
    main.innerHTML = `<div class="card"><h2 class="card-title">Não consegui carregar o conteúdo</h2>
      <p class="hint">Verifique a internet e tente de novo. Seu progresso continua salvo no aparelho.</p>
      <button class="btn" data-action="reload">Tentar de novo</button></div>`;
  } finally {
    window.scrollTo(0, 0);
  }
}

function notFound() {
  main.innerHTML = '<div class="card"><p>Página não encontrada.</p><a class="btn" href="#/">Voltar ao início</a></div>';
}

/* ---------- Início e lição ---------- */

function blockChip(lesson, b) {
  const bs = blockState(state, lesson.id, b.id);
  const r = blockResult(lesson, b, bs);
  if (bs.done) return `<span class="chip ok">${icon.check} ${r.ok}/${r.n}</span>`;
  if (r.answered) return `<span class="chip mid">${r.answered}/${r.total}</span>`;
  return '<span class="chip">Começar</span>';
}

function blockList(lesson) {
  const next = lesson.blocks.find(b => !blockState(state, lesson.id, b.id).done);
  return `<ol class="steps">${lesson.blocks.map(b => `
    <li><a class="step ${next && b.id === next.id ? 'next' : ''}" href="#/lesson/${lesson.id}/b/${b.id}">
      <span class="step-n">${b.slide}</span>
      <span class="step-body"><strong>${esc(b.title)}</strong><span>${esc(b.topicPt)}</span></span>
      ${blockChip(lesson, b)}
    </a></li>`).join('')}</ol>`;
}

function renderLesson(lesson, isHome) {
  setTab(isHome ? 'home' : 'lessons');
  const next = lesson.blocks.find(b => !blockState(state, lesson.id, b.id).done);
  const anyDone = lesson.blocks.some(b => blockState(state, lesson.id, b.id).done);
  main.innerHTML = `
    ${isHome ? '<header class="page-head"><p class="eyebrow">Aula de Inglês</p><h1>Prepare-se para a aula</h1></header>' : `<a class="back" href="#/lessons">← Lições</a>`}
    <section class="hero card">
      <p class="eyebrow">Lição ${lesson.number} · ${formatDate(lesson.date)} · ${esc(lesson.level)}</p>
      <h2 class="hero-title">${esc(lesson.title)}</h2>
      <p class="hint">${esc(lesson.subtitle)}</p>
      ${next ? `<a class="btn btn-wide" href="#/lesson/${lesson.id}/b/${next.id}">Abrir bloco ${next.slide}: ${esc(next.title)}</a>`
        : `<p class="done-note">${icon.check} Os 3 blocos estão feitos. Bom proveito na aula!</p>`}
    </section>
    <h2 class="section-title">Blocos (um por lâmina)</h2>
    ${blockList(lesson)}
    ${anyDone ? `<a class="btn btn-ghost btn-wide" href="#/lesson/${lesson.id}/report">Relatório para a avaliação no chat</a>` : ''}
    ${isHome ? `<div class="card how"><h2 class="card-title">Como usar</h2><ul class="plain">
      <li><strong>Um bloco por dia</strong>, cerca de 15 minutos: leia, ouça, repita em voz alta e pratique.</li>
      <li>No fim, toque em <strong>Relatório</strong> e cole no chat do projeto. Eu corrijo suas frases.</li>
      <li>Na aula, deixe o bloco aberto para consultar as expressões.</li></ul></div>` : ''}`;
}

async function renderHome() {
  if (!index.length) { setTab('home'); main.innerHTML = '<p class="loading">Nenhuma lição publicada ainda.</p>'; return; }
  renderLesson(await getLesson(index[0].id), true);
}

function renderLessons() {
  setTab('lessons');
  main.innerHTML = `<header class="page-head"><p class="eyebrow">Histórico</p><h1>Lições</h1></header>
    <ul class="list">${index.map(meta => {
      const ls = state.lessons[meta.id];
      const done = ls && ls.blocks ? Object.values(ls.blocks).filter(b => b.done).length : 0;
      return `<li><a class="lesson-row" href="#/lesson/${meta.id}">
        <span><strong>Lição ${meta.number} · ${esc(meta.title)}</strong><span class="hint">${formatDate(meta.date)} · ${esc(meta.subtitle || '')}</span></span>
        <span class="chip ${done >= 3 ? 'ok' : ''}">${done}/3</span></a></li>`;
    }).join('')}</ul>`;
}

/* ---------- Bloco ---------- */

const SECTIONS = [['s-cen', 'Cenário'], ['s-phr', 'Phrases'], ['s-dis', 'Discuss'], ['s-new', 'Frases novas'], ['s-pra', 'Pratique']];

function renderBlock(lesson, block) {
  setTab('lessons');
  view = { lesson, block };
  const idx = lesson.blocks.indexOf(block);
  main.innerHTML = `
    <a class="back" href="#/lesson/${lesson.id}">← Lição ${lesson.number}</a>
    <header class="page-head">
      <p class="eyebrow">Lâmina ${block.slide} de ${lesson.blocks.length} · ${esc(block.tag)}</p>
      <h1>${esc(block.title)}</h1>
      <p class="sub-en">${esc(block.subtitle)} ${say(block.subtitle)}</p>
      <p class="pt-box"><span class="pt-label">Em português</span>${esc(block.topicPt)}</p>
    </header>
    <nav class="seg" aria-label="Partes do bloco">${SECTIONS.map(([id, l], i) => `<button data-action="goto" data-id="${id}">${i + 1}. ${l}</button>`).join('')}</nav>

    <section id="s-cen" class="sec">
      <h2 class="sec-title"><span>1</span> The scenario</h2>
      ${block.scenario.map(p => `<div class="en-block">${p.label ? `<p class="lbl">${esc(p.label)}</p>` : ''}<p>${esc(p.en)}</p>${say(p.en, 'Ouvir o texto')}</div>`).join('')}
      <p class="pt-box"><span class="pt-label">Em resumo</span>${esc(block.scenarioPt)}</p>
      <ul class="words">${block.words.map(([en, pt]) => `<li><strong>${esc(en)}</strong> = ${esc(pt)}</li>`).join('')}</ul>
      ${block.highlight ? `<div class="key"><p class="en">${esc(block.highlight.en)} ${say(block.highlight.en)}</p><p class="pt">${esc(block.highlight.pt)}</p></div>` : ''}
      <p class="motto">${esc(block.motto.en)} <span>${esc(block.motto.pt)}</span></p>
    </section>

    <section id="s-phr" class="sec">
      <h2 class="sec-title"><span>2</span> Useful words &amp; phrases</h2>
      <p class="hint">Ouça e repita o exemplo inteiro em voz alta.</p>
      ${block.phrases.map(p => `<div class="phrase">
        <div class="phrase-head"><p class="en">${esc(p.en)}</p>${say(p.en)}</div>
        <p class="pt">${esc(p.pt)}${p.tip ? ` <span class="pattern">${esc(p.tip)}</span>` : ''}</p>
        <p class="example"><span>${esc(p.example)}</span>${say(p.example, 'Ouvir exemplo')}</p>
      </div>`).join('')}
    </section>

    <section id="s-dis" class="sec">
      <h2 class="sec-title"><span>3</span> ${esc(block.discussTitle)}</h2>
      <p class="hint">São as perguntas da aula. Pense na sua resposta em voz alta antes de abrir o exemplo.</p>
      ${block.questions.map((q, i) => `<div class="card q">
        <p class="q-en"><span class="qn">${i + 1}</span> ${esc(q.en)} ${say(q.en)}</p>
        <p class="pt">${esc(q.pt)}</p>
        <details><summary>Ver exemplo de resposta</summary><p class="model">${esc(q.model)}</p>${say(q.model, 'Ouvir exemplo de resposta')}</details>
      </div>`).join('')}
    </section>

    <section id="s-new" class="sec">
      <h2 class="sec-title"><span>4</span> Frases novas com o conteúdo</h2>
      <p class="hint">As mesmas expressões em outras situações. Ouça, repita e veja como elas se encaixam.</p>
      ${block.newSentences.map(s => `<div class="shadow"><span><span class="en">${esc(s.en)}</span><span class="pt">${esc(s.pt)}</span></span>${say(s.en)}</div>`).join('')}
    </section>

    <section id="s-pra" class="sec">
      <h2 class="sec-title"><span>5</span> Pratique: construa frases</h2>
      <div id="practice"></div>
      <div id="result"></div>
    </section>
    ${idx < lesson.blocks.length - 1 ? `<a class="btn btn-ghost btn-wide" href="#/lesson/${lesson.id}/b/${lesson.blocks[idx + 1].id}">Ir para o bloco ${idx + 2}</a>` : ''}`;
  drawPractice();
}

function drawPractice() {
  const { lesson, block } = view;
  const bs = blockState(state, lesson.id, block.id);
  const box = document.getElementById('practice');
  box.innerHTML = block.practice.map((item, i) => `<div class="card ex" id="ex-${item.id}">${exercise(lesson, item, bs, i + 1)}</div>`).join('');
  drawResult();
}

function redrawItem(item) {
  const { lesson, block } = view;
  const bs = blockState(state, lesson.id, block.id);
  const el = document.getElementById(`ex-${item.id}`);
  el.innerHTML = exercise(lesson, item, bs, block.practice.indexOf(item) + 1);
  drawResult();
}

function exercise(lesson, item, bs, n) {
  const head = (instr) => `<p class="tag">Exercício ${n} de ${view.block.practice.length}</p><p class="instr">${instr}</p>`;
  if (item.type === 'mc') {
    const a = bs.answers[item.id];
    const order = ui[`o:${item.id}`] || (ui[`o:${item.id}`] = shuffledOrder(item.options.length));
    return `${head('Complete a frase')}<p class="prompt">${esc(item.prompt)}</p>
      <div class="opts">${order.map(i => {
        let cls = 'opt';
        if (a) cls += i === item.answer ? ' right' : String(i) === a.given ? ' wrong' : ' dim';
        return `<button class="${cls}" data-action="mc" data-item="${item.id}" data-i="${i}" ${a ? 'disabled' : ''}>${esc(item.options[i])}</button>`;
      }).join('')}</div>${a ? fb(a.ok, item.prompt.replace('___', item.options[item.answer]), item.explain) : ''}`;
  }
  if (item.type === 'order') {
    const a = bs.answers[item.id];
    const words = tokens(item.answer);
    if (a) return `${head('Monte a frase em inglês')}<p class="pt-q">${esc(item.prompt)}</p>
      <p class="built done">${esc(a.given)}</p>${fb(a.ok, item.answer, item.explain)}`;
    const st = ui[`w:${item.id}`] || (ui[`w:${item.id}`] = { perm: scramble(words), picked: [] });
    const built = st.picked.map((k, j) => `<button class="word on" data-action="unpick" data-item="${item.id}" data-j="${j}">${esc(words[k])}</button>`).join('');
    const bank = st.perm.map(k => st.picked.includes(k) ? '' : `<button class="word" data-action="pick" data-item="${item.id}" data-k="${k}">${esc(words[k])}</button>`).join('');
    const full = st.picked.length === words.length;
    return `${head('Monte a frase em inglês: toque nas palavras na ordem certa')}<p class="pt-q">${esc(item.prompt)}</p>
      <div class="built">${built || '<span class="hint">Toque nas palavras abaixo…</span>'}</div>
      <div class="bank">${bank}</div>
      <div class="two"><button class="btn btn-ghost" data-action="clear" data-item="${item.id}">Limpar</button>
        <button class="btn" data-action="checkorder" data-item="${item.id}" ${full ? '' : 'disabled'}>Conferir</button></div>`;
  }
  // write
  const saved = bs.writes[item.id];
  const editing = ui[`e:${item.id}`] || !saved;
  if (!editing) {
    const r = checkWrite(item, saved, allPhrases(lesson));
    return `${head('Escreva a sua frase')}<p class="pt-q">${md(item.prompt)}</p>
      <div class="mine"><p>${esc(saved)}</p></div>
      <div class="fb ${r.ok ? 'ok' : 'bad'}"><p class="fb-title">${r.ok ? 'Usou a expressão' : r.used ? 'Frase curta demais' : 'Faltou a expressão pedida'}</p>
        <p>Exemplo: <span class="en">${esc(item.model)}</span> ${say(item.model)}</p>
        <p class="hint">A gramática da sua frase eu corrijo no chat, pelo relatório.</p></div>
      <button class="btn btn-small btn-ghost" data-action="edit" data-item="${item.id}">Reescrever</button>`;
  }
  const draft = ui[`d:${item.id}`] ?? saved ?? '';
  return `${head('Escreva a sua frase')}<p class="pt-q">${md(item.prompt)}</p>
    <textarea class="input" rows="3" data-draft="${item.id}" autocapitalize="sentences" spellcheck="true" placeholder="Write your sentence in English…">${esc(draft)}</textarea>
    <button class="btn btn-wide" data-action="savewrite" data-item="${item.id}">Conferir</button>`;
}

function fb(ok, right, explain) {
  return `<div class="fb ${ok ? 'ok' : 'bad'}"><p class="fb-title">${ok ? 'Certo!' : 'Não foi dessa vez'}</p>
    <p class="fb-right"><span>${esc(right)}</span>${say(right)}</p><p>${md(explain)}</p></div>`;
}

function drawResult() {
  const { lesson, block } = view;
  const bs = blockState(state, lesson.id, block.id);
  const r = blockResult(lesson, block, bs);
  const box = document.getElementById('result');
  if (!bs.done) {
    box.innerHTML = `<p class="hint progress">${r.answered} de ${r.total} exercícios feitos</p>
      <button class="btn btn-wide" data-action="finish" ${r.complete ? '' : 'disabled'}>Concluir bloco ${block.slide}</button>`;
    return;
  }
  const f = blockFeedback(r);
  const idx = lesson.blocks.indexOf(block);
  const next = lesson.blocks[idx + 1];
  box.innerHTML = `<div class="card result">
    <p class="eyebrow">Resultado do bloco ${block.slide}</p>
    <p class="score">${r.ok}/${r.n}</p><p class="hint">certos em completar e montar frases · ${r.written.filter(w => w.ok).length}/${r.written.length} frases com a expressão</p>
    <h3 class="card-title good-txt">Onde foi bem</h3>${f.good.length ? `<ul class="plain">${f.good.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="hint">—</p>'}
    <h3 class="card-title">Onde focar</h3><ul class="plain">${f.focus.map(x => `<li>${md(x)}</li>`).join('')}</ul>
    ${next ? `<a class="btn btn-wide" href="#/lesson/${lesson.id}/b/${next.id}">Próximo: bloco ${next.slide}</a>`
      : `<a class="btn btn-wide" href="#/lesson/${lesson.id}/report">Relatório para a avaliação no chat</a>`}
  </div>`;
}

/* ---------- Relatório ---------- */

function renderReport(lesson) {
  setTab('lessons');
  const text = lessonReport(lesson, state);
  main.innerHTML = `
    <a class="back" href="#/lesson/${lesson.id}">← Lição ${lesson.number}</a>
    <header class="page-head"><p class="eyebrow">Lição ${lesson.number}</p><h1>Relatório</h1></header>
    <div class="card report">
      <p class="hint">Copie e cole no chat do projeto (ou mande print). Eu corrijo suas frases e digo onde focar.</p>
      <button class="btn btn-wide" data-action="copy">Copiar relatório</button>
      <pre class="report-text">${esc(text)}</pre>
    </div>`;
  view = { lesson, reportText: text };
}

/* ---------- Ajustes ---------- */

async function renderSettings() {
  setTab('settings');
  const snaps = await listSnapshots();
  loadVoices();
  main.innerHTML = `
    <header class="page-head"><p class="eyebrow">Aula de Inglês · v${APP_VERSION}</p><h1>Ajustes</h1></header>
    <div class="card"><h2 class="card-title">Voz</h2>
      <label class="field">Voz em inglês
        <select class="input" data-setting="voice"><option value="">Automática</option>
          ${voices.map(v => `<option value="${esc(v.name)}" ${v.name === state.settings.voice ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('')}
        </select></label>
      <label class="field">Velocidade: <span id="rate-v">${state.settings.rate}</span>
        <input type="range" min="0.7" max="1.2" step="0.05" value="${state.settings.rate}" data-setting="rate"></label>
      <button class="btn btn-ghost" data-action="say" data-text="Take inspiration from people you admire, but measure success on your own terms.">${icon.play} Testar voz</button>
    </div>
    <div class="card"><h2 class="card-title">Backup do progresso</h2>
      <p class="hint">O progresso fica só neste aparelho, com cópias automáticas internas. Exporte um backup de vez em quando, principalmente antes de trocar de celular.</p>
      <div class="two"><button class="btn" data-action="export">Exportar backup</button><label class="btn btn-ghost">Importar backup<input type="file" accept="application/json,.json" data-action="import" hidden></label></div>
      <p class="hint">Registros salvos: ${answerCount(state)}</p>
    </div>
    <div class="card"><h2 class="card-title">Cópias automáticas</h2>
      ${snaps.length ? `<ul class="list">${snaps.slice(0, 12).map(s => `<li class="snap"><span>${new Date(s.ts).toLocaleString('pt-BR')} · ${esc(s.label)} · ${s.answers} registros</span>
        <button class="btn btn-small btn-ghost" data-action="restore" data-key="${esc(s.key)}">Restaurar</button></li>`).join('')}</ul>`
        : '<p class="hint">Ainda não há cópias.</p>'}
    </div>`;
}

function exportBackup() {
  const blob = new Blob([JSON.stringify({ app: 'aula-ingles', version: APP_VERSION, exportedAt: new Date().toISOString(), state }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `aula-ingles-backup-${dayKey(Date.now())}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

async function importBackup(file) {
  try {
    const s = looksLikeBackup(JSON.parse(await file.text()));
    if (!s) throw new Error('formato');
    if (!confirm('Substituir o progresso atual pelo do backup? O atual fica guardado em Cópias automáticas.')) return;
    await snapshot(state, 'antes de importar');
    state = migrateState(s);
    save({ reason: 'antes de importar' });
    toast('Backup importado.');
    route();
  } catch { toast('Arquivo inválido. Use um backup exportado por este app.'); }
}

/* ---------- Eventos ---------- */

function itemById(id) { return view && view.block ? view.block.practice.find(i => i.id === id) : null; }

main.addEventListener('click', async e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  if (a === 'say') return speak(el.dataset.text);
  if (a === 'reload') return location.reload();
  if (a === 'export') return exportBackup();
  if (a === 'goto') return document.getElementById(el.dataset.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (a === 'restore') {
    const snap = await readSnapshot(el.dataset.key);
    if (!snap || !confirm('Restaurar esta cópia? O estado atual fica guardado como cópia.')) return;
    await snapshot(state, 'antes de restaurar');
    state = snap; save({ reason: 'antes de restaurar' }); toast('Cópia restaurada.'); return route();
  }
  if (a === 'copy') {
    const text = view.reportText;
    try { await navigator.clipboard.writeText(text); toast('Relatório copiado. Cole no chat do projeto.'); }
    catch { toast('Não consegui copiar sozinho: selecione o texto do relatório e copie.'); }
    return;
  }
  if (!view || !view.block) return;
  const { lesson, block } = view;
  const bs = blockState(state, lesson.id, block.id);
  const item = itemById(el.dataset.item);
  if (a === 'mc' && item && !bs.answers[item.id]) {
    const i = Number(el.dataset.i);
    bs.answers[item.id] = { ok: checkItem(item, i), given: String(i), ts: Date.now() };
    save(); requestPersistence(); return redrawItem(item);
  }
  if (a === 'pick' && item) { ui[`w:${item.id}`].picked.push(Number(el.dataset.k)); return redrawItem(item); }
  if (a === 'unpick' && item) { ui[`w:${item.id}`].picked.splice(Number(el.dataset.j), 1); return redrawItem(item); }
  if (a === 'clear' && item) { ui[`w:${item.id}`].picked = []; return redrawItem(item); }
  if (a === 'checkorder' && item && !bs.answers[item.id]) {
    const words = tokens(item.answer);
    const given = ui[`w:${item.id}`].picked.map(k => words[k]).join(' ');
    bs.answers[item.id] = { ok: checkItem(item, given), given, ts: Date.now() };
    save(); requestPersistence(); return redrawItem(item);
  }
  if (a === 'edit' && item) { ui[`e:${item.id}`] = true; ui[`d:${item.id}`] = bs.writes[item.id]; return redrawItem(item); }
  if (a === 'savewrite' && item) {
    const text = (ui[`d:${item.id}`] ?? '').trim();
    if (wordCount(text) < 4) { toast('Escreva uma frase completa antes de conferir.'); return; }
    bs.writes[item.id] = text;
    ui[`e:${item.id}`] = false;
    save(); requestPersistence(); return redrawItem(item);
  }
  if (a === 'finish' && !bs.done) {
    bs.done = true; bs.doneAt = Date.now();
    const r = blockResult(lesson, block, bs);
    state.log.push({ ts: bs.doneAt, lesson: lesson.id, block: block.id, ok: r.ok, n: r.n });
    save(); return drawResult();
  }
});

main.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.draft) ui[`d:${t.dataset.draft}`] = t.value;
  if (t.dataset.setting === 'rate') { state.settings.rate = Number(t.value); document.getElementById('rate-v').textContent = t.value; save(); }
});

main.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.setting === 'voice') { state.settings.voice = t.value; save(); }
  if (t.dataset.action === 'import' && t.files && t.files[0]) importBackup(t.files[0]);
});

window.addEventListener('hashchange', route);

/* ---------- Atualizações (service worker) ---------- */

function setupSW() {
  if (!('serviceWorker' in navigator)) return;
  const banner = document.getElementById('update-banner');
  navigator.serviceWorker.register('sw.js').then(reg => {
    const offer = w => {
      banner.hidden = false;
      banner.querySelector('button').onclick = () => {
        save();
        navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
        w.postMessage('skipWaiting');
      };
    };
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      if (!w) return;
      w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w); });
    });
    setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
  }).catch(err => console.warn('Service worker indisponível', err));
}

(async function boot() {
  if (!hasLocal()) {
    const rec = await recoverRicher(state);
    if (rec) { state = rec; saveState(state); }
  }
  if (!state || typeof state !== 'object') state = emptyState();
  setupSW();
  route();
})();
