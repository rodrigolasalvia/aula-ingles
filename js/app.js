import {
  APP_VERSION, SPEAK_LABELS, formatDate, migrateState, lessonState, checkItem, detectPhrases, wordCount,
  findItem, startSession, flowSteps, recordAnswer, evaluate, buildReport, shuffledOrder, sessionStatus,
  nextSessionId, looksLikeBackup, emptyState, dayKey,
} from './core.js';
import {
  loadState, saveState, hasLocal, recoverRicher, snapshot, listSnapshots, readSnapshot, requestPersistence, answerCount,
} from './storage.js';

/* ---------- Estado e dados ---------- */

let state = loadState();
let index = [];            // lista de lições (data/lessons.json)
const lessons = {};        // cache de lições carregadas
const main = document.getElementById('main');
// Larguras de barras via CSSOM: a CSP proíbe atributos style inline.
new MutationObserver(() => main.querySelectorAll('[data-w]').forEach(el => { el.style.width = `${el.dataset.w}%`; }))
  .observe(main, { childList: true, subtree: true });
const ui = { order: {}, revealed: {}, typed: {}, chosen: {} }; // estado efêmero da tela atual

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
  const data = await fetchJSON('data/lessons.json');
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
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
  mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
};
const say = (text, label = 'Ouvir') => `<button class="say" data-action="say" data-text="${esc(text)}" aria-label="${esc(label)}">${icon.play}</button>`;
const slideTag = (tag, slide) => `<p class="tag">${esc(tag)}${slide ? ` · Lâmina ${slide}` : ''}</p>`;

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
}

function setTab(page) {
  document.querySelectorAll('.tabbar a').forEach(a => a.classList.toggle('on', a.dataset.page === page));
  document.body.classList.toggle('in-session', page === 'session');
}

/* ---------- Voz (text-to-speech) ---------- */

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

/* ---------- Gravação (fica só na memória; nada é enviado nem salvo) ---------- */

const rec = { media: null, chunks: [], stream: null, url: null, timer: null, start: 0 };

function stopStream() {
  if (rec.stream) rec.stream.getTracks().forEach(t => t.stop());
  rec.stream = null;
}

function resetRecorder() {
  try { if (rec.media && rec.media.state !== 'inactive') rec.media.stop(); } catch { /* ignore */ }
  stopStream(); clearInterval(rec.timer);
  if (rec.url) URL.revokeObjectURL(rec.url);
  Object.assign(rec, { media: null, chunks: [], url: null, timer: null });
}

async function toggleRecord(btn) {
  const box = btn.closest('.recorder');
  const out = box.querySelector('.rec-out');
  const time = box.querySelector('.rec-time');
  if (rec.media && rec.media.state === 'recording') { rec.media.stop(); return; }
  if (!navigator.mediaDevices || !window.MediaRecorder) { toast('Gravação indisponível neste navegador. Responda em voz alta mesmo assim.'); return; }
  try {
    resetRecorder();
    rec.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    rec.media = new MediaRecorder(rec.stream);
    rec.media.ondataavailable = e => { if (e.data.size) rec.chunks.push(e.data); };
    rec.media.onstop = () => {
      clearInterval(rec.timer); stopStream();
      rec.url = URL.createObjectURL(new Blob(rec.chunks, { type: rec.media.mimeType || 'audio/webm' }));
      out.innerHTML = `<audio controls src="${rec.url}"></audio><p class="hint">Ouça e repare: travou? usou as expressões? A gravação some ao sair desta tela.</p>`;
      btn.classList.remove('recording'); btn.innerHTML = `${icon.mic} Gravar de novo`;
    };
    rec.media.start();
    rec.start = Date.now();
    btn.classList.add('recording'); btn.innerHTML = `${icon.mic} Parar`;
    out.innerHTML = '';
    rec.timer = setInterval(() => {
      const s = Math.floor((Date.now() - rec.start) / 1000);
      time.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      if (s >= 180) rec.media.stop();
    }, 250);
  } catch {
    stopStream();
    toast('Sem acesso ao microfone. Libere nas permissões do navegador ou responda em voz alta sem gravar.');
  }
}

/* ---------- Roteamento ---------- */

async function route() {
  document.getElementById('toast').hidden = true;
  resetRecorder();
  try { speechSynthesis.cancel(); } catch { /* ignore */ }
  Object.assign(ui, { order: {}, revealed: {}, typed: {}, chosen: {} });
  const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
  try {
    if (!index.length) await loadIndex();
    if (parts[0] === 'lesson' && parts[1]) {
      const lesson = await getLesson(parts[1]);
      if (!lesson) return notFound();
      if (parts[2] === 'material') return renderMaterial(lesson, parts[3] || 'phrases');
      if (parts[2] === 's' && parts[3]) {
        const def = lesson.sessions.find(s => s.id === parts[3]);
        if (!def) return notFound();
        if (parts[4] === 'result') return renderResult(lesson, def);
        return renderSession(lesson, def);
      }
      return renderLesson(lesson);
    }
    if (parts[0] === 'lessons') return renderLessons();
    if (parts[0] === 'settings') return renderSettings();
    return renderHome();
  } catch (e) {
    console.error(e);
    setTab('');
    main.innerHTML = `<div class="card"><h2 class="card-title">Não consegui carregar o conteúdo</h2>
      <p class="hint">Verifique a internet e tente de novo. Seu progresso continua salvo no aparelho.</p>
      <button class="btn" data-action="reload">Tentar de novo</button></div>`;
  }
  window.scrollTo(0, 0);
}

function notFound() {
  main.innerHTML = '<div class="card"><p>Página não encontrada.</p><a class="btn" href="#/">Voltar ao início</a></div>';
}

/* ---------- Início ---------- */

function sessionChip(lesson, ls, def) {
  const st = sessionStatus(ls, def.id);
  if (st === 'done') {
    const ev = evaluate(lesson, ls, def, ls.sessions[def.id]);
    return `<span class="chip ok">${icon.check}${ev.pct != null ? ` ${ev.pct}%` : ' Feita'}</span>`;
  }
  if (st === 'active') return '<span class="chip mid">Em andamento</span>';
  return `<span class="chip">${def.minutes} min</span>`;
}

function sessionList(lesson) {
  const ls = lessonState(state, lesson.id);
  const next = nextSessionId(lesson, ls);
  return `<ol class="steps">${lesson.sessions.map((s, i) => `
    <li><a class="step ${s.id === next ? 'next' : ''}" href="#/lesson/${lesson.id}/s/${s.id}">
      <span class="step-n">${i + 1}</span>
      <span class="step-body"><strong>${esc(s.title)}</strong><span>${esc(s.goal)}</span></span>
      ${sessionChip(lesson, ls, s)}
    </a></li>`).join('')}</ol>`;
}

async function renderHome() {
  setTab('home');
  if (!index.length) { main.innerHTML = '<p class="loading">Nenhuma lição publicada ainda.</p>'; return; }
  const lesson = await getLesson(index[0].id);
  const ls = lessonState(state, lesson.id);
  const next = nextSessionId(lesson, ls);
  const nextDef = lesson.sessions.find(s => s.id === next);
  const pend = (ls.pending || []).length;
  main.innerHTML = `
    <header class="page-head"><p class="eyebrow">Aula de Inglês</p><h1>Prepare-se para a aula</h1></header>
    <section class="hero card">
      <p class="eyebrow">Lição ${lesson.number} · ${formatDate(lesson.date)} · ${esc(lesson.level)}</p>
      <h2 class="hero-title">${esc(lesson.title)}</h2>
      <p class="hint">${esc(lesson.subtitle)}</p>
      ${nextDef
        ? `<a class="btn btn-wide" href="#/lesson/${lesson.id}/s/${nextDef.id}">${sessionStatus(ls, next) === 'active' ? 'Continuar' : 'Começar'}: ${esc(nextDef.title)} · ${nextDef.minutes} min</a>`
        : `<p class="done-note">${icon.check} Lição completa. Bom proveito na aula!</p>`}
      <a class="btn btn-ghost btn-wide" href="#/lesson/${lesson.id}/material">Material para consultar na aula</a>
    </section>
    <h2 class="section-title">Etapas desta lição</h2>
    ${sessionList(lesson)}
    ${pend ? `<p class="hint">${pend} ${pend === 1 ? 'item errado volta' : 'itens errados voltam'} como retomada no começo da próxima etapa.</p>` : ''}
    <div class="card how">
      <h2 class="card-title">Como usar</h2>
      <ul class="plain">
        <li><strong>15 min por dia</strong>, uma etapa por vez, na ordem. A etapa 4 é para a véspera ou o dia da aula.</li>
        <li>Ao terminar cada etapa, <strong>copie o relatório ou tire print</strong> e cole no chat do projeto para a avaliação completa.</li>
        <li>Na aula, abra o <strong>Material</strong>: expressões, gramática e suas respostas ficam à mão.</li>
      </ul>
    </div>`;
}

/* ---------- Lições ---------- */

async function renderLessons() {
  setTab('lessons');
  const rows = [];
  for (const meta of index) {
    const ls = state.lessons[meta.id];
    const done = ls ? Object.values(ls.sessions).filter(r => r.status === 'done').length : 0;
    rows.push(`<li><a class="lesson-row" href="#/lesson/${meta.id}">
      <span><strong>Lição ${meta.number} · ${esc(meta.title)}</strong><span class="hint">${formatDate(meta.date)} · ${esc(meta.subtitle || '')}</span></span>
      <span class="chip ${done >= 4 ? 'ok' : ''}">${done}/4</span></a></li>`);
  }
  main.innerHTML = `<header class="page-head"><p class="eyebrow">Histórico</p><h1>Lições</h1></header>
    <ul class="list">${rows.join('')}</ul>`;
}

async function renderLesson(lesson) {
  setTab('lessons');
  main.innerHTML = `
    <a class="back" href="#/lessons">← Lições</a>
    <header class="page-head"><p class="eyebrow">Lição ${lesson.number} · ${formatDate(lesson.date)}</p><h1>${esc(lesson.title)}</h1>
      <p class="lead">${esc(lesson.subtitle)}</p></header>
    <a class="btn btn-ghost btn-wide" href="#/lesson/${lesson.id}/material">Material para consultar na aula</a>
    <h2 class="section-title">Etapas</h2>
    ${sessionList(lesson)}`;
}

/* ---------- Material de consulta ---------- */

const MAT_TABS = [['phrases', 'Expressões'], ['questions', 'Perguntas'], ['grammar', 'Gramática'], ['kit', 'Kit'], ['scenarios', 'Cenários']];

function phraseCard(p) {
  return `<div class="phrase">
    <div class="phrase-head"><p class="en">${esc(p.en)}</p>${say(p.en)}</div>
    <p class="pt">${esc(p.pt)}</p>
    <p class="pattern">${esc(p.pattern)}</p>
    <p class="example"><span>${esc(p.example)}</span>${say(p.example, 'Ouvir exemplo')}</p>
    <p class="use">No dia a dia: ${esc(p.use)}</p>
  </div>`;
}

function grammarCard(g) {
  return `<div class="card grammar">
    <h3 class="card-title">${esc(g.title)}</h3>
    <p>${md(g.rule)}</p>
    <table class="ex"><tbody>${g.examples.map(([en, pt]) => `<tr><td class="en">${esc(en)}</td><td>${esc(pt)}</td></tr>`).join('')}</tbody></table>
    ${g.pairs.map(([w, r]) => `<p class="pair"><span class="bad">✗ ${esc(w)}</span><span class="good">✓ ${esc(r)}</span></p>`).join('')}
  </div>`;
}

function kitCard(lesson) {
  return lesson.kit.map(k => `<div class="card kit"><h3 class="card-title">${esc(k.group)}</h3>
    ${k.items.map(([en, pt]) => `<p class="kit-row"><span class="en">${esc(en)}</span>${say(en)}<span class="pt">${esc(pt)}</span></p>`).join('')}</div>`).join('');
}

function scenarioCard(sc, open = false) {
  return `<div class="card scenario">
    <p class="eyebrow">Lâmina ${sc.slide}</p>
    <h3 class="card-title">${esc(sc.title)}</h3>
    <p class="question">${esc(sc.question)}</p>
    <div class="en-block"><p>${esc(sc.en)}</p>${say(sc.en, 'Ouvir o texto')}</div>
    <details ${open ? 'open' : ''}><summary>Ver tradução</summary><p class="pt">${esc(sc.pt)}</p></details>
    <p class="key">${esc(sc.key)}</p>
    <ul class="notes">${sc.notes.map(n => `<li>${md(n)}</li>`).join('')}</ul>
  </div>`;
}

function renderMaterial(lesson, tab) {
  setTab('lessons');
  const ls = lessonState(state, lesson.id);
  let body = '';
  if (tab === 'phrases') {
    body = [1, 2, 3].map(n => `<h2 class="section-title">Lâmina ${n} · ${esc(lesson.scenarios.find(s => s.slide === n)?.title || '')}</h2>
      ${lesson.phrases.filter(p => p.slide === n).map(phraseCard).join('')}`).join('');
  } else if (tab === 'questions') {
    body = lesson.questions.map(q => `<div class="card">
      <p class="tag">Lâmina ${q.slide}</p>
      <p class="q-en">${esc(q.en)} ${say(q.en)}</p>
      <p class="hint">${esc(q.tip)}</p>
      ${ls.writes[q.id] ? `<div class="mine"><p class="eyebrow">Sua resposta</p><p>${esc(ls.writes[q.id])}</p></div>` : ''}
      <details><summary>Resposta-modelo</summary><p class="model">${esc(q.model)}</p>${say(q.model, 'Ouvir modelo')}</details>
    </div>`).join('');
  } else if (tab === 'grammar') {
    body = lesson.grammar.map(grammarCard).join('');
  } else if (tab === 'kit') {
    body = kitCard(lesson);
  } else {
    body = lesson.scenarios.map(s => scenarioCard(s)).join('');
  }
  main.innerHTML = `
    <a class="back" href="#/lesson/${lesson.id}">← Lição ${lesson.number}</a>
    <header class="page-head"><p class="eyebrow">Material · Lição ${lesson.number}</p><h1>${esc(lesson.title)}</h1></header>
    <nav class="seg" aria-label="Seções do material">${MAT_TABS.map(([k, l]) => `<a href="#/lesson/${lesson.id}/material/${k}" class="${k === tab ? 'on' : ''}">${l}</a>`).join('')}</nav>
    ${body}`;
}

/* ---------- Sessão ---------- */

let flow = null; // { lesson, def, ls, rec, steps }

function renderSession(lesson, def) {
  setTab('session');
  const ls = lessonState(state, lesson.id);
  let r = ls.sessions[def.id];
  if (!r || r.status === 'done') {
    if (r && r.status === 'done') { location.replace(`#/lesson/${lesson.id}/s/${def.id}/result`); return; }
    r = startSession(lesson, ls, def);
    save();
    requestPersistence();
  }
  flow = { lesson, def, ls, rec: r, steps: flowSteps(def, r) };
  if (r.pos >= flow.steps.length) return finishSession();
  drawStep();
}

function drawStep() {
  const { lesson, def, rec: r, steps } = flow;
  const step = steps[r.pos];
  const pct = Math.round((r.pos / steps.length) * 100);
  let html = '';
  if (step.kind === 'read') html = readStep(lesson, step);
  else if (step.kind === 'item') html = itemStep(lesson, step);
  else if (step.kind === 'flash') html = flashStep(lesson, step);
  else if (step.kind === 'write') html = writeStep(lesson, step);
  else if (step.kind === 'speak') html = speakStep(lesson, step);
  else if (step.kind === 'shadow') html = shadowStep(lesson);
  main.innerHTML = `
    <div class="s-top">
      <a class="s-close" href="#/lesson/${lesson.id}" aria-label="Sair (o progresso fica salvo)">${icon.close}</a>
      <div class="s-meta"><span>Etapa ${def.id.slice(1)} · ${esc(def.title)}</span><span>${r.pos + 1}/${steps.length}</span></div>
    </div>
    <div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span data-w="${pct}"></span></div>
    ${step.retake ? '<p class="retake">Retomada · você errou este item antes</p>' : ''}
    <section class="s-body">${html}</section>`;
  window.scrollTo(0, 0);
  const ta = main.querySelector('textarea[data-autosave]');
  if (ta) updateWriteMeter(ta);
}

function advance() {
  resetRecorder();
  try { speechSynthesis.cancel(); } catch { /* ignore */ }
  Object.assign(ui, { order: {}, revealed: {}, typed: {}, chosen: {} });
  flow.rec.pos++;
  save();
  if (flow.rec.pos >= flow.steps.length) finishSession(); else drawStep();
}

const nextBtn = (label = 'Continuar') => `<button class="btn btn-wide" data-action="next">${label}</button>`;

function readStep(lesson, step) {
  if (step.block === 'overview') {
    return `<p class="eyebrow">Sobre a aula</p><h2 class="s-title">${esc(lesson.title)}</h2>
      <p>${md(lesson.overview)}</p>
      <div class="card"><h3 class="card-title">O que a aula vai cobrar</h3><ul class="plain">${lesson.classGoals.map(g => `<li>${esc(g)}</li>`).join('')}</ul></div>
      <p class="hint">Toque em ${icon.play} para ouvir qualquer frase em inglês.</p>${nextBtn()}`;
  }
  if (step.block === 'scenario') {
    const sc = lesson.scenarios.find(s => s.id === step.ref);
    return `<p class="eyebrow">Leia em inglês primeiro; abra a tradução só se precisar</p>${scenarioCard(sc)}${nextBtn()}`;
  }
  if (step.block === 'phrases') {
    const sc = lesson.scenarios.find(s => s.slide === step.ref);
    return `<p class="eyebrow">Expressões · Lâmina ${step.ref}</p><h2 class="s-title">${esc(sc ? sc.title : '')}</h2>
      <p class="hint">Ouça cada uma e repita o exemplo em voz alta, com a preposição.</p>
      ${lesson.phrases.filter(p => p.slide === step.ref).map(phraseCard).join('')}${nextBtn()}`;
  }
  if (step.block === 'grammar') {
    const g = lesson.grammar.find(x => x.id === step.ref);
    return `<p class="eyebrow">Gramática escondida no material</p>${grammarCard(g)}${nextBtn()}`;
  }
  if (step.block === 'kit') {
    return `<p class="eyebrow">Kit de argumentação</p><h2 class="s-title">Frases para estruturar sua opinião</h2>
      <p class="hint">A professora vai pedir \"defend your position\". Estas frases dão estrutura e tempo para pensar.</p>
      ${kitCard(lesson)}${nextBtn()}`;
  }
  if (step.block === 'mywriting') {
    const ls = lessonState(state, lesson.id);
    const qs = lesson.questions.filter(q => ls.writes[q.id]);
    return `<p class="eyebrow">Revisão final</p><h2 class="s-title">Suas respostas para a aula</h2>
      <p class="hint">Releia em voz alta. Se recebeu correções no chat, use a versão corrigida na aula.</p>
      ${qs.length ? qs.map(q => `<div class="card"><p class="q-en">${esc(q.en)}</p><div class="mine"><p>${esc(ls.writes[q.id])}</p></div></div>`).join('')
        : '<div class="card"><p class="hint">Você ainda não escreveu respostas (etapa 3).</p></div>'}
      ${nextBtn('Concluir etapa')}`;
  }
  return nextBtn();
}

function itemStep(lesson, step) {
  const item = findItem(lesson, step.ref);
  if (!item) return `<p class="hint">Item indisponível.</p>${nextBtn()}`;
  const key = step.retake ? `retake:${item.id}` : item.id;
  const ans = flow.rec.answers[key];
  const head = `${slideTag(item.tag, item.slide)}`;
  if (item.type === 'mc') {
    const order = ui.order[item.id] || (ui.order[item.id] = shuffledOrder(item.options.length));
    const opts = order.map(i => {
      let cls = 'opt';
      if (ans) { if (i === item.answer) cls += ' right'; else if (String(i) === ans.given) cls += ' wrong'; else cls += ' dim'; }
      return `<button class="${cls}" data-action="mc" data-i="${i}" ${ans ? 'disabled' : ''}>${esc(item.options[i])}</button>`;
    }).join('');
    return `${head}<p class="instr">Escolha a resposta certa</p><p class="prompt">${esc(item.prompt)}</p>
      <div class="opts">${opts}</div>${ans ? feedback(item, ans) : ''}`;
  }
  const isFix = item.type === 'fix';
  const value = ans ? ans.given : (ui.typed[item.id] ?? (isFix ? item.prompt.replace(/\s*\(.*\)\s*$/, '') : ''));
  return `${head}<p class="instr">${isFix ? 'Corrija a frase (edite o texto)' : 'Complete a lacuna'}</p>
    <p class="prompt">${esc(item.prompt)}</p>
    ${isFix
      ? `<textarea class="input" rows="3" data-typed="${item.id}" ${ans ? 'disabled' : ''} autocapitalize="sentences" spellcheck="false">${esc(value)}</textarea>`
      : `<input class="input" data-typed="${item.id}" value="${esc(value)}" ${ans ? 'disabled' : ''} autocapitalize="none" autocomplete="off" spellcheck="false" enterkeyhint="done" placeholder="Digite a palavra">`}
    ${ans ? feedback(item, ans) : '<button class="btn btn-wide" data-action="check">Conferir</button>'}`;
}

function feedback(item, ans) {
  const right = item.type === 'mc' ? item.options[item.answer] : item.model;
  const canSelf = !ans.ok && item.type !== 'mc' && !ans.self;
  return `<div class="fb ${ans.ok ? 'ok' : 'bad'}">
    <p class="fb-title">${ans.ok ? (ans.self ? 'Marcado como certo' : 'Certo!') : 'Não foi dessa vez'}</p>
    ${!ans.ok || item.type !== 'mc' ? `<p class="fb-right"><span>${esc(right)}</span>${say(right)}</p>` : ''}
    <p>${md(item.explain)}</p>
    ${canSelf ? '<button class="btn btn-small btn-ghost" data-action="selfok">Minha resposta também está certa</button>' : ''}
  </div>${nextBtn()}`;
}

function flashStep(lesson, step) {
  const p = lesson.phrases.find(x => x.id === step.ref);
  const shown = ui.revealed[p.id];
  const done = flow.rec.flash[p.id];
  const idx = lesson.phrases.indexOf(p) + 1;
  return `<p class="tag">Lembrança das expressões · ${idx}/${lesson.phrases.length}</p>
    <p class="instr">Diga em inglês, em voz alta, antes de revelar</p>
    <div class="flash"><p class="pt big">${esc(p.pt)}</p>
      ${shown ? `<p class="en big">${esc(p.en)} ${say(p.en)}</p><p class="example">${esc(p.example)}</p>` : ''}</div>
    ${!shown ? '<button class="btn btn-wide" data-action="reveal">Revelar</button>'
      : done === undefined ? `<div class="two"><button class="btn btn-ghost" data-action="flash" data-v="0">Não lembrei</button><button class="btn" data-action="flash" data-v="1">Lembrei</button></div>` : nextBtn()}`;
}

function writeStep(lesson, step) {
  const q = lesson.questions.find(x => x.id === step.ref);
  const ls = flow.ls;
  const doneKey = `write:${q.id}`;
  const saved = flow.rec.done[doneKey];
  const text = ls.writes[q.id] || '';
  const slidePhrases = lesson.phrases.filter(p => p.slide === q.slide);
  if (saved) {
    const found = detectPhrases(text, lesson.phrases);
    const names = lesson.phrases.filter(p => found.includes(p.id)).map(p => p.en);
    return `${slideTag('Escrita', q.slide)}<p class="q-en">${esc(q.en)}</p>
      <div class="mine"><p class="eyebrow">Sua resposta · ${wordCount(text)} palavras</p><p>${esc(text)}</p></div>
      <p class="${found.length >= 2 ? 'good-txt' : 'bad-txt'}">${found.length} expressão(ões) da lição: ${names.length ? esc(names.join('; ')) : 'nenhuma'}</p>
      <div class="card"><p class="eyebrow">Resposta-modelo</p><p class="model">${esc(q.model)}</p>${say(q.model, 'Ouvir modelo')}</div>
      <p class="hint">Compare estrutura e expressões. A gramática da sua resposta eu corrijo no chat, a partir do relatório.</p>
      ${nextBtn()}`;
  }
  return `${slideTag('Escrita', q.slide)}<p class="instr">Responda por escrito, 3 a 5 frases</p>
    <p class="q-en">${esc(q.en)} ${say(q.en)}</p>
    <p class="hint">${esc(q.tip)}</p>
    <p class="hint">Use pelo menos 2 expressões, por exemplo: ${slidePhrases.map(p => `<em>${esc(p.en)}</em>`).join(' · ')}</p>
    <textarea class="input" rows="7" data-autosave="${q.id}" autocapitalize="sentences" spellcheck="true" placeholder="In my view, …">${esc(text)}</textarea>
    <p class="meter" aria-live="polite"></p>
    <button class="btn btn-wide" data-action="savewrite" data-q="${q.id}">Salvar e ver o modelo</button>`;
}

function updateWriteMeter(ta) {
  const m = main.querySelector('.meter');
  if (!m || !flow) return;
  const words = wordCount(ta.value);
  const found = detectPhrases(ta.value, flow.lesson.phrases).length;
  m.textContent = `${words} palavras · ${found} expressão(ões) da lição`;
  m.className = `meter ${words >= 30 && found >= 2 ? 'good-txt' : ''}`;
}

function speakStep(lesson, step) {
  const q = lesson.questions.find(x => x.id === step.ref);
  const shown = ui.revealed[q.id];
  const rated = flow.rec.speak[q.id];
  return `${slideTag('Fala', q.slide)}<p class="instr">Responda em voz alta</p>
    <p class="q-en">${esc(q.en)} ${say(q.en)}</p>
    <ol class="how-to"><li>Pense 20 segundos. ${esc(q.tip)}</li><li>Fale de 60 a 90 segundos, sem ler. Grave se quiser.</li><li>Só depois compare com o modelo.</li></ol>
    <div class="recorder"><button class="btn btn-ghost" data-action="record">${icon.mic} Gravar</button><span class="rec-time"></span><div class="rec-out"></div></div>
    ${!shown ? '<button class="btn btn-wide" data-action="reveal">Já respondi · ver o modelo</button>'
      : `<div class="card"><p class="eyebrow">Resposta-modelo</p><p class="model">${esc(q.model)}</p>${say(q.model, 'Ouvir modelo')}</div>
         <p class="instr">Como foi a sua resposta?</p>
         <div class="three">${Object.entries(SPEAK_LABELS).map(([k, l]) => `<button class="btn ${rated === k ? '' : 'btn-ghost'}" data-action="rate" data-v="${k}">${l}</button>`).join('')}</div>
         ${rated ? nextBtn() : ''}`}`;
}

function shadowStep(lesson) {
  return `<p class="tag">Shadowing</p><p class="instr">Ouça cada frase e repita junto, imitando ritmo e entonação</p>
    <p class="hint">Faça cada uma 2 vezes. O objetivo é a frase sair inteira, sem pausa no meio.</p>
    ${lesson.shadow.map(s => `<div class="shadow"><span>${esc(s)}</span>${say(s)}</div>`).join('')}
    ${nextBtn('Fiz as repetições')}`;
}

function finishSession() {
  const { lesson, def, rec: r } = flow;
  if (r.status !== 'done') {
    r.status = 'done'; r.finishedAt = Date.now();
    const ev = evaluate(lesson, flow.ls, def, r);
    state.log.push({ ts: r.finishedAt, lesson: lesson.id, session: def.id, ok: ev.ok, n: ev.n, run: r.runs });
    save();
  }
  location.replace(`#/lesson/${lesson.id}/s/${def.id}/result`);
}

/* ---------- Resultado ---------- */

function renderResult(lesson, def) {
  setTab('lessons');
  const ls = lessonState(state, lesson.id);
  const r = ls.sessions[def.id];
  if (!r || r.status !== 'done') { location.replace(`#/lesson/${lesson.id}/s/${def.id}`); return; }
  const ev = evaluate(lesson, ls, def, r);
  const next = nextSessionId(lesson, ls);
  const nextDef = lesson.sessions.find(s => s.id === next);
  const list = (arr, cls) => arr.length ? `<ul class="plain ${cls}">${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="hint">—</p>';
  const tags = Object.entries(ev.byTag).map(([k, v]) => {
    const p = Math.round((v.ok / v.n) * 100);
    return `<div class="tagbar"><span>${esc(k)}</span><span class="tb"><span class="${p >= 80 ? 'ok' : p < 60 ? 'bad' : 'mid'}" data-w="${p}"></span></span><span>${v.ok}/${v.n}</span></div>`;
  }).join('');
  main.innerHTML = `
    <header class="page-head"><p class="eyebrow">Lição ${lesson.number} · Etapa ${def.id.slice(1)} · ${formatDate(dayKey(r.finishedAt))}</p><h1>${esc(def.title)}: resultado</h1></header>
    ${ev.n ? `<div class="card score-card"><p class="score">${ev.pct}%</p><p class="hint">${ev.ok} de ${ev.n} certos</p>${tags}</div>` : ''}
    <div class="card"><h2 class="card-title good-txt">Onde foi bem</h2>${list(ev.good, '')}</div>
    <div class="card"><h2 class="card-title bad-txt">Onde foi mal</h2>${list(ev.bad, '')}${ev.mid.length ? `<p class="eyebrow">No meio do caminho</p>${list(ev.mid, '')}` : ''}</div>
    <div class="card"><h2 class="card-title">Onde focar</h2>${list(ev.focus, '')}
      ${ev.pending ? `<p class="hint">${ev.pending} item(ns) errado(s) volta(m) como retomada na próxima etapa.</p>` : ''}</div>
    ${ev.errors.length ? `<div class="card"><h2 class="card-title">Seus erros</h2>${ev.errors.map(e => {
      const right = e.item.type === 'mc' ? e.item.options[e.item.answer] : e.item.model;
      const mine = e.item.type === 'mc' ? e.item.options[Number(e.given)] : e.given;
      return `<div class="err"><p class="tag">${esc(e.item.tag)}</p><p>${esc(e.item.prompt)}</p><p class="bad-txt">✗ ${esc(mine || '—')}</p><p class="good-txt">✓ ${esc(right)}</p></div>`;
    }).join('')}</div>` : ''}
    ${ev.forgot.length ? `<div class="card"><h2 class="card-title">Expressões que não vieram</h2><ul class="plain">${ev.forgot.map(p => `<li><strong>${esc(p.en)}</strong> · ${esc(p.pt)}</li>`).join('')}</ul></div>` : ''}
    <div class="card report">
      <h2 class="card-title">Avaliação completa no chat</h2>
      <p class="hint">O app corrige o objetivo. Gramática e naturalidade das respostas escritas e o plano do próximo dia vêm da avaliação no chat: copie o relatório (ou tire print desta tela) e cole no projeto.</p>
      <button class="btn btn-wide" data-action="copy">Copiar relatório</button>
    </div>
    ${nextDef ? `<a class="btn btn-wide" href="#/lesson/${lesson.id}/s/${nextDef.id}">Próxima: ${esc(nextDef.title)}</a>` : ''}
    <div class="two"><a class="btn btn-ghost" href="#/lesson/${lesson.id}">Voltar à lição</a><button class="btn btn-ghost" data-action="redo">Refazer etapa</button></div>`;
  flow = { lesson, def, ls, rec: r, steps: flowSteps(def, r) };
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
    const raw = JSON.parse(await file.text());
    const s = looksLikeBackup(raw);
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

main.addEventListener('click', async e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  if (a === 'say') return speak(el.dataset.text);
  if (a === 'reload') return location.reload();
  if (a === 'next') return advance();
  if (a === 'export') return exportBackup();
  if (a === 'record') return toggleRecord(el);
  if (a === 'restore') {
    const snap = await readSnapshot(el.dataset.key);
    if (!snap || !confirm('Restaurar esta cópia? O estado atual fica guardado como cópia.')) return;
    await snapshot(state, 'antes de restaurar');
    state = snap; save({ reason: 'antes de restaurar' }); toast('Cópia restaurada.'); return route();
  }
  if (a === 'copy') {
    const text = buildReport(flow.lesson, flow.ls, flow.def, flow.rec);
    try { await navigator.clipboard.writeText(text); toast('Relatório copiado. Cole no chat do projeto.'); }
    catch {
      main.querySelector('.report').insertAdjacentHTML('beforeend', `<textarea class="input" rows="10" readonly>${esc(text)}</textarea><p class="hint">Não consegui copiar sozinho: selecione o texto acima e copie.</p>`);
    }
    return;
  }
  if (a === 'redo') {
    if (!confirm('Refazer esta etapa? O resultado anterior continua no histórico.')) return;
    const { lesson, def } = flow;
    startSession(lesson, flow.ls, def); save();
    location.hash = `#/lesson/${lesson.id}/s/${def.id}`;
    return;
  }
  if (!flow) return;
  const step = flow.steps[flow.rec.pos];
  if (a === 'mc') {
    const item = findItem(flow.lesson, step.ref);
    const i = Number(el.dataset.i);
    recordAnswer(flow.ls, flow.rec, item, { given: i, ok: checkItem(item, i), retake: !!step.retake });
    save(); return drawStep();
  }
  if (a === 'check') {
    const item = findItem(flow.lesson, step.ref);
    const input = main.querySelector(`[data-typed="${item.id}"]`);
    const given = input ? input.value : '';
    if (!given.trim()) { toast('Digite sua resposta antes de conferir.'); return; }
    if (item.type === 'fix' && given.trim() === item.prompt.replace(/\s*\(.*\)\s*$/, '').trim()) { toast('Você ainda não alterou a frase.'); return; }
    recordAnswer(flow.ls, flow.rec, item, { given, ok: checkItem(item, given), retake: !!step.retake });
    save(); return drawStep();
  }
  if (a === 'selfok') {
    const item = findItem(flow.lesson, step.ref);
    const key = step.retake ? `retake:${item.id}` : item.id;
    recordAnswer(flow.ls, flow.rec, item, { given: flow.rec.answers[key].given, ok: true, self: true, retake: !!step.retake });
    save(); return drawStep();
  }
  if (a === 'reveal') { ui.revealed[step.ref] = true; return drawStep(); }
  if (a === 'flash') { flow.rec.flash[step.ref] = el.dataset.v === '1'; save(); return advance(); }
  if (a === 'rate') { flow.rec.speak[step.ref] = el.dataset.v; save(); return drawStep(); }
  if (a === 'savewrite') {
    const ta = main.querySelector('textarea[data-autosave]');
    const text = ta ? ta.value.trim() : '';
    if (wordCount(text) < 10) { toast('Escreva pelo menos 10 palavras antes de ver o modelo.'); return; }
    flow.ls.writes[el.dataset.q] = text;
    flow.rec.done[`write:${el.dataset.q}`] = true;
    save(); return drawStep();
  }
});

main.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.typed) ui.typed[t.dataset.typed] = t.value;
  if (t.dataset.autosave && flow) {
    flow.ls.writes[t.dataset.autosave] = t.value;
    updateWriteMeter(t);
    clearTimeout(t._saveTimer); t._saveTimer = setTimeout(() => save(), 600);
  }
  if (t.dataset.setting === 'rate') { state.settings.rate = Number(t.value); document.getElementById('rate-v').textContent = t.value; save(); }
});

main.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.setting === 'voice') { state.settings.voice = t.value; save(); }
  if (t.dataset.action === 'import' && t.files && t.files[0]) importBackup(t.files[0]);
});

main.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.matches('input[data-typed]')) { e.preventDefault(); main.querySelector('[data-action="check"]')?.click(); }
});

window.addEventListener('hashchange', route);

/* ---------- Atualizações (service worker) ---------- */

function setupSW() {
  if (!('serviceWorker' in navigator)) return;
  const banner = document.getElementById('update-banner');
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return; // só recarrega quando o usuário pediu a atualização
  });
  navigator.serviceWorker.register('sw.js').then(reg => {
    const offer = w => {
      banner.hidden = false;
      banner.querySelector('button').onclick = () => {
        refreshing = true;
        save();
        navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
        w.postMessage('skipWaiting');
      };
    };
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      if (!w) return;
      w.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w);
      });
    });
    setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
  }).catch(err => console.warn('Service worker indisponível', err));
}

/* ---------- Início ---------- */

(async function boot() {
  if (!hasLocal()) {
    const rec = await recoverRicher(state);
    if (rec) { state = rec; saveState(state); }
  }
  if (!state || typeof state !== 'object') state = emptyState();
  setupSW();
  route();
})();
