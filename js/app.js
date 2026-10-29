import {
  APP_VERSION, SLOW_RATE, formatDate, dayKey, migrateState, emptyState, slideProgress, doneCount, nextSlide,
  isCorrect, sentenceOf, scramble, looksLikeBackup,
} from './core.js';
import {
  loadState, saveState, hasLocal, recoverRicher, snapshot, listSnapshots, readSnapshot, requestPersistence, answerCount,
} from './storage.js';

const INDEX_URL = 'data/v4/lessons.json';

let state = loadState();
let index = [];
const lessons = {};
const main = document.getElementById('main');
let view = null; // tela da lâmina: { lesson, slide, active, perm, picked, status, hidden }

function save(opts) {
  const ok = saveState(state, opts);
  if (!ok) toast('Could not save on this device. Export a backup in Settings.');
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

/* ---------- Utilidades ---------- */

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ICON = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
};
// Áudio: velocidade normal e lenta (0.85x), quantas vezes quiser.
const listen = (text, compact = false) => `<div class="listen ${compact ? 'compact' : ''}">
  <button class="lbtn" data-action="say" data-rate="1" data-text="${esc(text)}">${ICON.play}${compact ? '' : ' Listen'}</button>
  <button class="lbtn slow" data-action="say" data-rate="${SLOW_RATE}" data-text="${esc(text)}">Slow</button></div>`;

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

// Voz mais natural disponível: "Natural/Neural/Google" e vozes de rede primeiro; inglês americano ou britânico.
function bestVoice() {
  const chosen = voices.find(v => v.name === state.settings.voice);
  if (chosen) return chosen;
  const score = v => (/natural|neural|enhanced|premium/i.test(v.name) ? 4 : 0) + (/google/i.test(v.name) ? 3 : 0)
    + (v.localService === false ? 2 : 0) + (/en[-_]US/i.test(v.lang) ? 2 : /en[-_]GB/i.test(v.lang) ? 1 : 0);
  return voices.slice().sort((a, b) => score(b) - score(a))[0] || null;
}

function speak(text, rate = 1) {
  if (!('speechSynthesis' in window)) { toast('This browser cannot read text aloud.'); return; }
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = bestVoice();
    if (v) u.voice = v;
    u.lang = v ? v.lang : 'en-US';
    u.rate = rate;
    speechSynthesis.speak(u);
  } catch { toast('Could not play the audio.'); }
}

/* ---------- Rotas ---------- */

async function route() {
  document.getElementById('toast').hidden = true;
  try { speechSynthesis.cancel(); } catch { /* ignore */ }
  view = null;
  const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
  try {
    if (!index.length) await loadIndex();
    if (parts[0] === 'lesson' && parts[1]) {
      const lesson = await getLesson(parts[1]);
      if (!lesson) return notFound();
      if (parts[2] === 'slide' && parts[3]) {
        const slide = lesson.slides.find(s => String(s.n) === parts[3]);
        return slide ? renderSlide(lesson, slide) : notFound();
      }
      return renderLesson(lesson, false);
    }
    if (parts[0] === 'lessons') return renderLessons();
    if (parts[0] === 'settings') return renderSettings();
    if (!index.length) { setTab('home'); main.innerHTML = '<p class="loading">No lessons yet.</p>'; return; }
    return renderLesson(await getLesson(index[0].id), true);
  } catch (e) {
    console.error(e);
    main.innerHTML = `<div class="card"><h2 class="card-title">Could not load the lesson</h2>
      <p class="hint">Check your internet connection and try again. Your progress is saved on this device.</p>
      <button class="btn" data-action="reload">Try again</button></div>`;
  } finally {
    window.scrollTo(0, 0);
  }
}

function notFound() {
  main.innerHTML = '<div class="card"><p>Page not found.</p><a class="btn" href="#/">Go home</a></div>';
}

/* ---------- Lição: as 3 lâminas ---------- */

function renderLesson(lesson, isHome) {
  setTab(isHome ? 'home' : 'lessons');
  const done = slideProgress(state, lesson.id);
  const next = nextSlide(lesson, done);
  main.innerHTML = `
    ${isHome ? '<header class="page-head"><p class="eyebrow">Speaking class</p><h1>Get ready for class</h1></header>' : '<a class="back" href="#/lessons">← Lessons</a>'}
    <section class="hero card">
      <p class="eyebrow">Lesson ${lesson.number} · ${formatDate(lesson.date)} · ${esc(lesson.level)}</p>
      <h2 class="hero-title">${esc(lesson.title)}</h2>
      <p class="hint">${lesson.slides.length} slides · ${lesson.slides.reduce((n, s) => n + s.items.length, 0)} questions to build</p>
      ${next ? `<a class="btn btn-wide" href="#/lesson/${lesson.id}/slide/${next.n}">${doneCount(next, done) ? 'Continue' : 'Start'}: Slide ${next.n}</a>`
        : `<p class="done-note">${ICON.check} You're ready for class.</p>`}
    </section>
    <ol class="steps">${lesson.slides.map(s => {
      const c = doneCount(s, done), all = c === s.items.length;
      return `<li><a class="step ${next && next.id === s.id ? 'next' : ''}" href="#/lesson/${lesson.id}/slide/${s.n}">
        <span class="step-n">${s.n}</span>
        <span class="step-body"><strong>${esc(s.title)}</strong><span>${esc(s.question)}</span></span>
        <span class="chip ${all ? 'ok' : ''}">${all ? ICON.check : ''}${c}/${s.items.length}</span></a></li>`;
    }).join('')}</ol>`;
}

function renderLessons() {
  setTab('lessons');
  main.innerHTML = `<header class="page-head"><p class="eyebrow">All lessons</p><h1>Lessons</h1></header>
    <ul class="list">${index.map(m => `<li><a class="lesson-row" href="#/lesson/${m.id}">
      <span><strong>Lesson ${m.number} · ${esc(m.title)}</strong><span class="hint">${formatDate(m.date)} · ${esc(m.subtitle || '')}</span></span></a></li>`).join('')}</ul>`;
}

/* ---------- Lâmina: entender + construir; as frases certas ficam na tela ---------- */

function firstPending(slide, done) {
  const i = slide.items.findIndex(x => !done[x.id]);
  return i === -1 ? null : i;
}

function activate(i) {
  view.active = i;
  view.picked = [];
  view.status = 'idle';
  view.perm = i == null ? [] : scramble(view.slide.items[i].blocks);
}

function renderSlide(lesson, slide) {
  setTab('lessons');
  view = { lesson, slide, hidden: false };
  activate(firstPending(slide, slideProgress(state, lesson.id)));
  drawSlide();
}

function builder(item) {
  const { perm, picked, status } = view;
  const built = picked.map((k, j) => `<button class="word on" data-action="unpick" data-j="${j}">${esc(item.blocks[k])}</button>`).join('');
  const bank = perm.filter(k => !picked.includes(k)).map(k => `<button class="word" data-action="pick" data-k="${k}">${esc(item.blocks[k])}</button>`).join('');
  return `<p class="instr">Tap the blocks to build your answer. Tap a block again to remove it.</p>
    <div class="built ${status}">${built || '<span class="hint">Your answer appears here…</span>'}</div>
    <div class="bank">${bank}</div>
    ${status === 'wrong' ? '<p class="wrong-msg">Not quite. Tap a block to remove it and try again.</p>' : ''}
    <div class="two"><button class="btn btn-ghost" data-action="clear" ${picked.length ? '' : 'disabled'}>Start over</button>
      <button class="btn" data-action="check" ${picked.length === item.blocks.length ? '' : 'disabled'}>Check</button></div>`;
}

function drawSlide(scrollToActive = false) {
  const { lesson, slide, active, hidden, justDone } = view;
  const done = slideProgress(state, lesson.id);
  const c = doneCount(slide, done);
  const idx = lesson.slides.indexOf(slide);
  const nextS = lesson.slides[idx + 1];

  const cards = slide.items.map((item, i) => {
    const isDone = !!done[item.id];
    const isActive = i === active;
    const answer = sentenceOf(item.blocks);
    let body = '';
    if (isDone) {
      body = hidden
        ? '<p class="hidden-answer">Say your answer out loud.</p>'
        : `<p class="answer">${esc(answer)}</p>${listen(answer, true)}${justDone === item.id ? `<p class="explain">${esc(item.explain)}</p>` : ''}`;
    } else if (isActive) {
      body = builder(item);
    } else {
      body = `<button class="btn btn-small btn-ghost" data-action="activate" data-i="${i}">Build this answer</button>`;
    }
    return `<li class="qitem ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}" id="q-${item.id}">
      <p class="qmeta"><span class="qn">${isDone ? ICON.check : i + 1}</span>${item.kind === 'class' ? 'Class question' : 'Warm-up'}</p>
      <p class="q-en">${esc(item.question)}</p>
      ${isActive && !isDone ? listen(item.question, true) : ''}
      ${body}</li>`;
  }).join('');

  main.innerHTML = `
    <div class="s-top"><a class="back" href="#/lesson/${lesson.id}">← Lesson ${lesson.number}</a><span class="count">Slide ${slide.n} of ${lesson.slides.length}</span></div>
    <header class="page-head slide-head"><h1>${esc(slide.title)}</h1><p class="sub-en">${esc(slide.question)}</p></header>

    <details class="card understand" ${c === 0 ? 'open' : ''}>
      <summary>Understand the slide</summary>
      <p class="en-text">${esc(slide.summary)}</p>${listen(slide.summary)}
      <ul class="xlist">${slide.expressions.map(x => `<li><span class="x-en">${esc(x.en)}</span><span class="x-m">${esc(x.meaning)}</span></li>`).join('')}</ul>
    </details>

    <div class="list-head">
      <h2 class="section-title">Your answers · ${c}/${slide.items.length}</h2>
      ${c ? `<button class="btn btn-small btn-ghost" data-action="${hidden ? 'show' : 'hide'}">${hidden ? 'Show answers' : 'Try without looking'}</button>` : ''}
    </div>
    <div class="bar"><span data-w="${Math.round((c / slide.items.length) * 100)}"></span></div>
    <ol class="qlist">${cards}</ol>
    ${c === slide.items.length ? `<div class="card done-card small"><p class="big-check">${ICON.check}</p>
      <p><strong>Slide ${slide.n} done.</strong> Your answers stay here for class. Tap "Try without looking" to practise speaking.</p>
      ${nextS ? `<a class="btn btn-wide" href="#/lesson/${lesson.id}/slide/${nextS.n}">Next: Slide ${nextS.n}</a>` : `<a class="btn btn-wide" href="#/lesson/${lesson.id}">Back to the lesson</a>`}</div>`
      : ''}`;

  if (scrollToActive && active != null) {
    document.getElementById(`q-${slide.items[active].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ---------- Settings ---------- */

async function renderSettings() {
  setTab('settings');
  const snaps = await listSnapshots();
  loadVoices();
  main.innerHTML = `
    <header class="page-head"><p class="eyebrow">Speaking class · v${APP_VERSION}</p><h1>Settings</h1></header>
    <div class="card"><h2 class="card-title">Voice</h2>
      <p class="hint">"Automatic" picks the most natural English voice on this phone.</p>
      <label class="field">English voice
        <select class="input" data-setting="voice"><option value="">Automatic</option>
          ${voices.map(v => `<option value="${esc(v.name)}" ${v.name === state.settings.voice ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('')}
        </select></label>
      ${listen('Take inspiration from people you admire, but measure success on your own terms.')}
    </div>
    <div class="card"><h2 class="card-title">Backup</h2>
      <p class="hint">Your progress is saved only on this phone. Export a backup before changing phones.</p>
      <div class="two"><button class="btn" data-action="export">Export backup</button><label class="btn btn-ghost">Import backup<input type="file" accept="application/json,.json" data-action="import" hidden></label></div>
      <p class="hint">Saved records: ${answerCount(state)}</p>
    </div>
    <div class="card"><h2 class="card-title">Automatic copies</h2>
      ${snaps.length ? `<ul class="list">${snaps.slice(0, 10).map(s => `<li class="snap"><span>${new Date(s.ts).toLocaleString('en-GB')} · ${s.answers} records</span>
        <button class="btn btn-small btn-ghost" data-action="restore" data-key="${esc(s.key)}">Restore</button></li>`).join('')}</ul>`
        : '<p class="hint">No copies yet.</p>'}
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
    if (!s) throw new Error('format');
    if (!confirm('Replace your current progress with this backup? The current progress is kept as an automatic copy.')) return;
    await snapshot(state, 'before import');
    state = migrateState(s);
    save({ reason: 'before import' });
    toast('Backup imported.');
    route();
  } catch { toast('Invalid file. Use a backup exported by this app.'); }
}

/* ---------- Eventos ---------- */

main.addEventListener('click', async e => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const a = el.dataset.action;
  if (a === 'say') return speak(el.dataset.text, Number(el.dataset.rate) || 1);
  if (a === 'reload') return location.reload();
  if (a === 'export') return exportBackup();
  if (a === 'restore') {
    const snap = await readSnapshot(el.dataset.key);
    if (!snap || !confirm('Restore this copy? Your current progress is kept as a copy.')) return;
    await snapshot(state, 'before restore');
    state = snap; save({ reason: 'before restore' }); toast('Copy restored.'); return route();
  }
  if (!view) return;
  const item = view.active != null ? view.slide.items[view.active] : null;
  if (a === 'pick') { view.picked.push(Number(el.dataset.k)); view.status = 'idle'; return drawSlide(); }
  if (a === 'unpick') { view.picked.splice(Number(el.dataset.j), 1); view.status = 'idle'; return drawSlide(); }
  if (a === 'clear') { view.picked = []; view.status = 'idle'; return drawSlide(); }
  if (a === 'activate') { activate(Number(el.dataset.i)); return drawSlide(true); }
  if (a === 'hide') { view.hidden = true; try { speechSynthesis.cancel(); } catch { /* ignore */ } return drawSlide(); }
  if (a === 'show') { view.hidden = false; return drawSlide(); }
  if (a === 'check' && item) {
    if (!isCorrect(item, view.picked)) { view.status = 'wrong'; return drawSlide(); }
    const done = slideProgress(state, view.lesson.id);
    done[item.id] = true;
    save(); requestPersistence();
    view.justDone = item.id;
    activate(firstPending(view.slide, done));
    drawSlide();
    document.getElementById(`q-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

main.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.setting === 'voice') { state.settings.voice = t.value; save(); }
  if (t.dataset.action === 'import' && t.files && t.files[0]) importBackup(t.files[0]);
});

// Larguras de barras via CSSOM: a CSP proíbe atributos style inline.
new MutationObserver(() => main.querySelectorAll('[data-w]').forEach(el => { el.style.width = `${el.dataset.w}%`; }))
  .observe(main, { childList: true, subtree: true });

window.addEventListener('hashchange', route);

/* ---------- Atualizações ---------- */

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
  }).catch(err => console.warn('Service worker unavailable', err));
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
