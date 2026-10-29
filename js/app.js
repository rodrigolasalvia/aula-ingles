import {
  APP_VERSION, SLOW_RATE, formatDate, dayKey, migrateState, emptyState, progress, isCorrect, sentenceOf, scramble,
  nextIndex, looksLikeBackup,
} from './core.js';
import {
  loadState, saveState, hasLocal, recoverRicher, snapshot, listSnapshots, readSnapshot, requestPersistence, answerCount,
} from './storage.js';

const INDEX_URL = 'data/v3/lessons.json';

let state = loadState();
let index = [];
const lessons = {};
const main = document.getElementById('main');
let screen = null; // tela de exercício atual

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
// Botões de áudio: velocidade normal e lenta (0.85x). Podem ser tocados quantas vezes quiser.
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

// Escolhe a voz mais natural disponível: vozes de rede e "Natural/Neural/Google" primeiro, inglês americano ou britânico.
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
  screen = null;
  const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
  try {
    if (!index.length) await loadIndex();
    if (parts[0] === 'lesson' && parts[1]) {
      const lesson = await getLesson(parts[1]);
      if (!lesson) return notFound();
      if (parts[2] === 'understand') return renderUnderstand(lesson);
      if (parts[2] === 'build' || parts[2] === 'speak') return renderExercise(lesson, parts[2], parts[3]);
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

/* ---------- Lição ---------- */

function nextStep(lesson) {
  const p = progress(state, lesson.id);
  if (!p.understood) return { href: `#/lesson/${lesson.id}/understand`, label: 'Start: Understand' };
  const b = nextIndex(lesson.build, p.build);
  if (b) return { href: `#/lesson/${lesson.id}/build/${b}`, label: `Continue: Build the sentence (${b}/${lesson.build.length})` };
  const s = nextIndex(lesson.speak, p.speak);
  if (s) return { href: `#/lesson/${lesson.id}/speak/${s}`, label: `Continue: Get ready to speak (${s}/${lesson.speak.length})` };
  return null;
}

function renderLesson(lesson, isHome) {
  setTab(isHome ? 'home' : 'lessons');
  const p = progress(state, lesson.id);
  const nb = Object.keys(p.build).filter(id => lesson.build.some(x => x.id === id)).length;
  const ns = Object.keys(p.speak).filter(id => lesson.speak.some(x => x.id === id)).length;
  const next = nextStep(lesson);
  const step = (n, title, desc, href, status, done) => `<li><a class="step ${done ? '' : ''}" href="${href}">
    <span class="step-n">${n}</span><span class="step-body"><strong>${title}</strong><span>${desc}</span></span>
    <span class="chip ${done ? 'ok' : ''}">${done ? ICON.check : ''}${status}</span></a></li>`;
  main.innerHTML = `
    ${isHome ? '<header class="page-head"><p class="eyebrow">Speaking class</p><h1>Get ready for class</h1></header>' : '<a class="back" href="#/lessons">← Lessons</a>'}
    <section class="hero card">
      <p class="eyebrow">Lesson ${lesson.number} · ${formatDate(lesson.date)} · ${esc(lesson.level)}</p>
      <h2 class="hero-title">${esc(lesson.title)}</h2>
      <p class="hint">${esc(lesson.subtitle)}</p>
      ${next ? `<a class="btn btn-wide" href="${next.href}">${next.label}</a>`
        : `<p class="done-note">${ICON.check} You're ready for class.</p>`}
    </section>
    <ol class="steps">
      ${step(1, 'Understand', 'Read the scenario and the key expressions.', `#/lesson/${lesson.id}/understand`, p.understood ? 'Done' : 'Read', p.understood)}
      ${step(2, 'Build the sentence', 'Put the blocks in order. Listen and repeat.', `#/lesson/${lesson.id}/build/${nextIndex(lesson.build, p.build) || 1}`, `${nb}/${lesson.build.length}`, nb === lesson.build.length)}
      ${step(3, 'Get ready to speak', 'Build an answer to each class question, then say it.', `#/lesson/${lesson.id}/speak/${nextIndex(lesson.speak, p.speak) || 1}`, `${ns}/${lesson.speak.length}`, ns === lesson.speak.length)}
    </ol>`;
}

function renderLessons() {
  setTab('lessons');
  main.innerHTML = `<header class="page-head"><p class="eyebrow">All lessons</p><h1>Lessons</h1></header>
    <ul class="list">${index.map(m => `<li><a class="lesson-row" href="#/lesson/${m.id}">
      <span><strong>Lesson ${m.number} · ${esc(m.title)}</strong><span class="hint">${formatDate(m.date)} · ${esc(m.subtitle || '')}</span></span></a></li>`).join('')}</ul>`;
}

/* ---------- 1. Understand ---------- */

function renderUnderstand(lesson) {
  setTab('lessons');
  const u = lesson.understand;
  main.innerHTML = `
    <a class="back" href="#/lesson/${lesson.id}">← Lesson ${lesson.number}</a>
    <header class="page-head"><p class="eyebrow">Step 1 of 3</p><h1>Understand</h1></header>
    <h2 class="section-title">The scenario</h2>
    ${u.scenario.map(s => `<div class="card scen"><h3 class="card-title">${esc(s.title)}</h3><p class="en-text">${esc(s.text)}</p>${listen(s.text)}</div>`).join('')}
    <h2 class="section-title">Key expressions</h2>
    ${u.expressions.map(x => `<div class="phrase">
      <p class="en">${esc(x.en)}</p>
      <p class="meaning">${esc(x.meaning)}</p>
      <p class="example">${esc(x.example)}</p>${listen(x.example, true)}
    </div>`).join('')}
    <button class="btn btn-wide" data-action="understood">Next: Build the sentence</button>`;
}

/* ---------- 2 e 3. Build / Speak ---------- */

function renderExercise(lesson, kind, nParam) {
  setTab('lessons');
  const items = kind === 'build' ? lesson.build : lesson.speak;
  const title = kind === 'build' ? 'Build the sentence' : 'Get ready to speak';
  if (nParam === 'done' || !nParam) return renderDone(lesson, kind);
  const n = Math.min(Math.max(parseInt(nParam, 10) || 1, 1), items.length);
  const item = items[n - 1];
  screen = { lesson, kind, items, n, item, title, perm: scramble(item.blocks), picked: [], status: 'idle', hidden: false };
  drawExercise();
}

function drawExercise() {
  const { lesson, kind, items, n, item, title, perm, picked, status, hidden } = screen;
  const pct = Math.round(((n - 1) / items.length) * 100);
  const question = kind === 'build' ? item.prompt : item.question;
  const answer = sentenceOf(item.blocks);
  const built = picked.map((k, j) => `<button class="word on" data-action="unpick" data-j="${j}" ${status === 'right' ? 'disabled' : ''}>${esc(item.blocks[k])}</button>`).join('');
  const bank = perm.filter(k => !picked.includes(k)).map(k => `<button class="word" data-action="pick" data-k="${k}">${esc(item.blocks[k])}</button>`).join('');
  const full = picked.length === item.blocks.length;

  let below = '';
  if (status === 'right') {
    if (kind === 'speak' && hidden) {
      below = `<div class="fb ok"><p class="fb-title">Your turn</p>
        <p>Answer the question out loud, in your own words. Then listen to the example again.</p></div>
        <div class="two"><button class="btn btn-ghost" data-action="show">Show the answer</button><button class="btn" data-action="next">Next</button></div>`;
    } else {
      below = `<div class="fb ok"><p class="fb-title">${ICON.check} Correct!</p><p class="fb-right">${esc(answer)}</p>
        ${listen(answer)}<p class="explain">${esc(item.explain)}</p></div>
        ${kind === 'speak' ? '<button class="btn btn-ghost btn-wide" data-action="hide">Try without looking</button>' : ''}
        <button class="btn btn-wide" data-action="next">Next</button>`;
    }
  } else {
    below = `${status === 'wrong' ? '<p class="wrong-msg">Not quite. Tap a block to remove it and try again.</p>' : ''}
      <div class="two"><button class="btn btn-ghost" data-action="clear" ${picked.length ? '' : 'disabled'}>Start over</button>
      <button class="btn" data-action="check" ${full ? '' : 'disabled'}>Check</button></div>`;
  }

  main.innerHTML = `
    <div class="s-top"><a class="back" href="#/lesson/${lesson.id}">← Lesson ${lesson.number}</a><span class="count">${title} · ${n}/${items.length}</span></div>
    <div class="bar"><span data-w="${pct}"></span></div>
    <div class="card qcard"><p class="eyebrow">${kind === 'build' ? 'Question' : 'Class question'}</p>
      <p class="q-en">${esc(question)}</p>${listen(question, true)}</div>
    <p class="instr">${status === 'right' ? '' : 'Tap the blocks to build the answer. Tap a block again to remove it.'}</p>
    <div class="built ${status}">${(kind === 'speak' && hidden && status === 'right') ? '<span class="hint">Answer hidden.</span>' : built || '<span class="hint">Your answer appears here…</span>'}</div>
    ${status === 'right' ? '' : `<div class="bank">${bank}</div>`}
    ${below}`;
}

function renderDone(lesson, kind) {
  const isBuild = kind === 'build';
  main.innerHTML = `
    <a class="back" href="#/lesson/${lesson.id}">← Lesson ${lesson.number}</a>
    <div class="card done-card">
      <p class="big-check">${ICON.check}</p>
      <h1>${isBuild ? 'Well done!' : "You're ready for class."}</h1>
      <p class="hint">${isBuild ? `You built all ${lesson.build.length} sentences. Now prepare your answers to the class questions.`
        : 'In class, use the expressions in your own answers. The examples are ideas, not scripts.'}</p>
      ${isBuild ? `<a class="btn btn-wide" href="#/lesson/${lesson.id}/speak/1">Next: Get ready to speak</a>` : `<a class="btn btn-wide" href="#/lesson/${lesson.id}">Back to the lesson</a>`}
      <a class="btn btn-ghost btn-wide" href="#/lesson/${lesson.id}/${kind}/1">Practice again</a>
    </div>`;
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
  if (a === 'understood') {
    const id = location.hash.split('/')[2];
    progress(state, id).understood = true; save(); requestPersistence();
    location.hash = `#/lesson/${id}/build/1`;
    return;
  }
  if (!screen) return;
  const s = screen;
  if (a === 'pick') { s.picked.push(Number(el.dataset.k)); s.status = 'idle'; return drawExercise(); }
  if (a === 'unpick') { s.picked.splice(Number(el.dataset.j), 1); s.status = 'idle'; return drawExercise(); }
  if (a === 'clear') { s.picked = []; s.status = 'idle'; return drawExercise(); }
  if (a === 'check') {
    if (isCorrect(s.item, s.picked)) {
      s.status = 'right';
      progress(state, s.lesson.id)[s.kind][s.item.id] = true;
      save(); requestPersistence();
    } else s.status = 'wrong';
    return drawExercise();
  }
  if (a === 'hide') { s.hidden = true; try { speechSynthesis.cancel(); } catch { /* ignore */ } return drawExercise(); }
  if (a === 'show') { s.hidden = false; return drawExercise(); }
  if (a === 'next') {
    location.hash = `#/lesson/${s.lesson.id}/${s.kind}/${s.n < s.items.length ? s.n + 1 : 'done'}`;
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
