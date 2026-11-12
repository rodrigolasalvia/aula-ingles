import {
  APP_VERSION, SLOW_RATE, formatDate, dayKey, migrateState, emptyState, slideProgress, doneCount, nextSlide,
  isCorrect, sentenceOf, scramble, looksLikeBackup, practiceState, checkPractice, correctAnswer, startRun,
  recordPractice, runScore, finishRun, practiceSummary, shuffledOrder, SESSION_SIZE, blankCount, blankHints,
  latestAnswers, givenText, bankCoverage, lessonNotes,
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
  view = null; pview = null; tview = null;
  document.body.classList.remove('print-page');
  const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
  try {
    if (!index.length) await loadIndex();
    if (parts[0] === 'lesson' && parts[1]) {
      const lesson = await getLesson(parts[1]);
      if (!lesson) return notFound();
      if (parts[2] === 'teacher') return renderTeacher(lesson);
      if (parts[2] === 'practice') return parts[3] === 'result' ? renderPracticeResult(lesson) : renderPractice(lesson);
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
    }).join('')}</ol>
    ${practiceCard(lesson)}`;
}

function practiceCard(lesson) {
  if (!Array.isArray(lesson.practice) || !lesson.practice.length) return '';
  const ps = practiceState(state, lesson.id);
  const sum = practiceSummary(ps);
  const cur = ps.current;
  const size = Math.min(SESSION_SIZE, lesson.practice.length);
  const cov = bankCoverage(lesson, ps);
  const teacherN = lesson.practice.filter(x => x.source === 'teacher').length;
  return `<div class="card practice-card">
    <h2 class="card-title">Practice · ${size} exercises</h2>
    <p class="hint">${lesson.practice.length > size
      ? `Each round picks ${size} of ${lesson.practice.length} exercises${teacherN ? ` (${teacherN} from your teacher)` : ''}, new ones first. Done so far: ${cov.seen}/${cov.total}.`
      : 'Quick check on the lesson: choose, complete, correct and build sentences.'}</p>
    ${sum ? `<p class="scores"><span>Last: <strong>${sum.last}%</strong></span><span>Best: <strong>${sum.best}%</strong></span><span>${sum.count}×</span></p>` : ''}
    <a class="btn btn-wide" href="#/lesson/${lesson.id}/practice">${cur ? `Continue${cur.mode === 'redo' ? ' redo' : ''} (${cur.pos + 1}/${cur.order.length})` : sum ? 'Practice again' : 'Start practice'}</a>
  </div>
  ${teacherN ? `<a class="btn btn-ghost btn-wide" href="#/lesson/${lesson.id}/teacher">My answers for the teacher (PDF)</a>` : ''}`;
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

let focusQ = null; // pergunta para abrir direto ao chegar na lâmina (vinda do "Redo" da página da professora)

function renderSlide(lesson, slide) {
  setTab('lessons');
  view = { lesson, slide, hidden: false };
  const want = focusQ && slide.items.findIndex(x => x.id === focusQ);
  focusQ = null;
  activate(want != null && want >= 0 ? want : firstPending(slide, slideProgress(state, lesson.id)));
  drawSlide(want != null && want >= 0);
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
        : `<p class="answer">${esc(answer)}</p>${listen(answer, true)}${justDone === item.id ? `<p class="explain">${esc(item.explain)}</p>` : ''}
           <button class="btn btn-small btn-ghost redo" data-action="redo-q" data-i="${i}">Redo</button>`;
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
      ${nextS ? `<a class="btn btn-wide" href="#/lesson/${lesson.id}/slide/${nextS.n}">Next: Slide ${nextS.n}</a>` : `<a class="btn btn-wide" href="#/lesson/${lesson.id}">Back to the lesson</a>`}
      <button class="btn btn-ghost btn-wide" data-action="redo-slide">Redo all answers on this slide</button></div>`
      : ''}`;

  if (scrollToActive && active != null) {
    document.getElementById(`q-${slide.items[active].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ---------- Practice: um exercício por vez, percentual no fim ---------- */

let pview = null; // { lesson, ps, item, typed, perm, picked }

function renderPractice(lesson) {
  setTab('lessons');
  const ps = practiceState(state, lesson.id);
  if (!ps.current || ps.current.order.some(id => !lesson.practice.some(p => p.id === id))) { startRun(lesson, ps); save(); }
  if (ps.current.pos >= ps.current.order.length) { finishRun(lesson, ps); save(); location.replace(`#/lesson/${lesson.id}/practice/result`); return; }
  const item = lesson.practice.find(p => p.id === ps.current.order[ps.current.pos]);
  pview = { lesson, ps, item, typed: item.type === 'fix' ? item.prompt : item.type === 'gap' ? Array(blankCount(item)).fill('') : '', picked: [],
    perm: item.type === 'order' ? scramble(item.blocks) : item.type === 'mc' ? shuffledOrder(item.options.length) : [] };
  drawPractice();
}

const INSTR = { mc: 'Choose the right answer', gap: 'Complete the sentence', fix: 'Correct the sentence', order: 'Tap the blocks to build the sentence' };

function drawPractice() {
  const { lesson, ps, item, perm, picked, typed } = pview;
  const cur = ps.current;
  const ans = cur.answers[item.id];
  const n = cur.order.length;
  const done = cur.pos + (ans ? 1 : 0);
  let body = '';
  if (item.type === 'mc') {
    body = `<p class="prompt">${esc(item.prompt)}</p><div class="opts">${perm.map(i => {
      let cls = 'opt';
      if (ans) cls += i === item.answer ? ' right' : String(i) === ans.given ? ' wrong' : ' dim';
      return `<button class="${cls}" data-action="p-mc" data-i="${i}" ${ans ? 'disabled' : ''}>${esc(item.options[i])}</button>`;
    }).join('')}</div>`;
  } else if (item.type === 'gap') {
    const hints = blankHints(item);
    const vals = ans ? String(ans.given).split(' | ') : typed;
    body = `<p class="prompt">${esc(item.prompt)}</p>
      ${hints.map((h, i) => `<label class="gap-field">${hints.length > 1 ? `<span>${i + 1}${h ? ` · ${esc(h)}` : ''}</span>` : ''}
        <input class="input" data-p="typed" data-i="${i}" value="${esc(vals[i] || '')}" ${ans ? 'disabled' : ''} autocapitalize="none" autocomplete="off" spellcheck="false" enterkeyhint="${i < hints.length - 1 ? 'next' : 'done'}" placeholder="${hints.length > 1 ? `Blank ${i + 1}` : 'Type the missing word(s)'}"></label>`).join('')}`;
  } else if (item.type === 'fix') {
    body = `<p class="prompt wrong-sentence">${esc(item.prompt)}</p>
      <textarea class="input" rows="3" data-p="typed" ${ans ? 'disabled' : ''} autocapitalize="sentences" spellcheck="false">${esc(ans ? ans.given : typed)}</textarea>`;
  } else {
    const chosen = ans ? ans.given.split(',').map(Number) : picked;
    body = `<p class="prompt">${esc(item.prompt)}</p>
      <div class="built ${ans ? (ans.ok ? 'right' : 'wrong') : ''}">${chosen.map((k, j) => `<button class="word on" data-action="p-unpick" data-j="${j}" ${ans ? 'disabled' : ''}>${esc(item.blocks[k])}</button>`).join('') || '<span class="hint">Your sentence appears here…</span>'}</div>
      ${ans ? '' : `<div class="bank">${perm.filter(k => !picked.includes(k)).map(k => `<button class="word" data-action="p-pick" data-k="${k}">${esc(item.blocks[k])}</button>`).join('')}</div>`}`;
  }
  const right = correctAnswer(item);
  const canCheck = item.type === 'order' ? picked.length === item.blocks.length : item.type !== 'mc';
  main.innerHTML = `
    <div class="s-top"><a class="back" href="#/lesson/${lesson.id}${cur.mode === 'redo' ? '/teacher' : ''}">← ${cur.mode === 'redo' ? 'My answers' : `Lesson ${lesson.number}`}</a><span class="count">${cur.mode === 'redo' ? 'Redo' : 'Practice'} · ${cur.pos + 1}/${n}</span></div>
    <div class="bar"><span data-w="${Math.round((done / n) * 100)}"></span></div>
    <p class="tag">${esc(item.skill)} · Slide ${item.slide}${item.source === 'teacher' ? ' · <span class="teacher">From your teacher</span>' : ''}</p>
    <p class="instr">${esc(item.task || INSTR[item.type])}${item.strict ? ' · <span class="strict">Capital letters and punctuation count</span>' : ''}</p>
    ${body}
    ${ans ? `<div class="fb ${ans.ok ? 'ok' : 'bad'}">
        <p class="fb-title">${ans.ok ? `${ICON.check} Correct!` : 'Not quite'}</p>
        ${ans.ok && item.type === 'mc' ? '' : `<p class="fb-right">${esc(right)}</p>`}
        ${listen(right, true)}
        <p class="explain">${esc(item.explain)}</p>
        ${item.tip ? `<p class="tip"><strong>In real life:</strong> ${esc(item.tip)}</p>` : ''}
      </div>
      <button class="btn btn-wide" data-action="p-next">${cur.pos + 1 < n ? 'Next' : 'See my result'}</button>`
      : item.type === 'mc' ? '' : `<div class="two">${item.type === 'order' ? `<button class="btn btn-ghost" data-action="p-clear" ${picked.length ? '' : 'disabled'}>Start over</button>` : '<span></span>'}
        <button class="btn" data-action="p-check" ${canCheck ? '' : 'disabled'}>Check</button></div>`}`;
}

function renderPracticeResult(lesson) {
  setTab('lessons');
  const ps = practiceState(state, lesson.id);
  const run = ps.runs[ps.runs.length - 1];
  if (!run) { location.replace(`#/lesson/${lesson.id}/practice`); return; }
  const sc = runScore(lesson, run.answers);
  const sum = practiceSummary(ps);
  const redo = run.mode === 'redo';
  const wrong = lesson.practice.filter(p => run.answers[p.id] && !run.answers[p.id].ok);
  const skills = Object.entries(sc.bySkill).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n);
  const weak = skills.filter(([, v]) => v.ok < v.n).map(([k]) => k);
  main.innerHTML = `
    <a class="back" href="#/lesson/${lesson.id}">← Lesson ${lesson.number}</a>
    <div class="card score-card">
      <p class="eyebrow">${redo ? 'Redo result' : 'Practice result'}</p>
      <p class="score">${sc.pct}%</p>
      <p class="hint">${sc.ok} of ${sc.n} correct${!redo && sum ? ` · Best: ${sum.best}%` : ''}${redo ? ' · Your new answers replaced the old ones.' : ''}</p>
      ${skills.map(([k, v]) => { const pc = Math.round((v.ok / v.n) * 100); return `<div class="tagbar"><span>${esc(k)}</span><span class="tb"><span class="${pc >= 80 ? 'ok' : pc < 60 ? 'bad' : 'mid'}" data-w="${pc}"></span></span><span>${v.ok}/${v.n}</span></div>`; }).join('')}
    </div>
    <div class="card"><h2 class="card-title">Focus on</h2>
      <p>${weak.length ? `Review: <strong>${weak.map(esc).join(', ')}</strong>.` : 'Everything right. Now say the answers out loud on each slide.'}</p></div>
    ${wrong.length ? `<div class="card"><h2 class="card-title">Your mistakes</h2>${wrong.map(p => `<div class="err">
      <p class="tag">${esc(p.skill)}</p><p class="good-txt">${esc(correctAnswer(p))}</p><p class="hint">${esc(p.explain)}</p></div>`).join('')}</div>` : ''}
    ${redo
      ? `<a class="btn btn-wide" href="#/lesson/${lesson.id}/teacher">Back to my answers</a>
         <button class="btn btn-ghost btn-wide" data-action="redo-again">Redo these again</button>`
      : `<a class="btn btn-wide" href="#/lesson/${lesson.id}/practice">Practice again</a>
         <a class="btn btn-ghost btn-wide" href="#/lesson/${lesson.id}">Back to the lesson</a>`}`;
  pview = { lesson, ps, lastRun: run };
}

/* ---------- Página para a professora: só os exercícios dela, com as respostas do aluno ---------- */

let tview = null;

function renderTeacher(lesson) {
  setTab('lessons');
  tview = { id: lesson.id };
  document.body.classList.add('print-page');
  const ps = practiceState(state, lesson.id);
  const last = latestAnswers(ps);
  const notes = lessonNotes(state, lesson.id);
  const done = slideProgress(state, lesson.id);
  const titles = lesson.exercises || {};
  let total = 0, answered = 0;
  const sections = lesson.slides.map(slide => {
    const exNums = new Set([
      ...lesson.practice.filter(p => p.source === 'teacher' && p.slide === slide.n).map(p => p.ex),
      ...slide.items.filter(i => i.ex).map(i => i.ex),
      ...(lesson.writing || []).filter(w => w.slide === slide.n).map(w => w.ex),
    ]);
    const blocks = [...exNums].sort((a, b) => a - b).map(ex => {
      const title = (titles[slide.n] && titles[slide.n][ex]) || `Exercise ${ex}`;
      const openQs = slide.items.filter(i => i.ex === ex);
      const objs = lesson.practice.filter(p => p.source === 'teacher' && p.slide === slide.n && p.ex === ex);
      const rows = [
        ...objs.map((p, k) => {
          total++;
          const a = last[p.id];
          if (a) answered++;
          return `<li><p class="t-q"><span class="t-qt">${p.task ? `<span class="t-task">${esc(p.task)}:</span> ` : ''}${esc(p.prompt)}</span><button class="btn btn-small btn-ghost no-print t-redo" data-action="redo-items" data-ids="${p.id}">${a ? 'Redo' : 'Do it'}</button></p>
            ${a ? `<p class="t-a">${esc(givenText(p, a))} <span class="${a.ok ? 'good-txt' : 'bad-txt'}">${a.ok ? '✓' : '✗'}</span></p>
                   ${a.ok ? '' : `<p class="t-c">Correct: ${esc(correctAnswer(p))}</p>`}`
              : '<p class="t-a missing">Not done yet</p>'}</li>`;
        }),
        ...openQs.map(q => {
          total++;
          const own = (notes[q.id] || '').trim();
          if (own) answered++;
          return `<li><p class="t-q"><span class="t-qt">${esc(q.question)}</span><button class="btn btn-small btn-ghost no-print t-redo" data-action="redo-open" data-id="${q.id}" data-slide="${slide.n}">Build</button></p>
            <textarea class="input no-print" rows="2" data-note="${q.id}" placeholder="Write your own answer (optional)">${esc(notes[q.id] || '')}</textarea>
            <p class="t-a print-only" data-empty="Answered orally in class.">${own ? esc(own) : '<span class="missing">Answered orally in class.</span>'}</p>
            ${done[q.id] ? `<p class="t-c no-print">Model you built: ${esc(sentenceOf(q.blocks))}</p>` : ''}</li>`;
        }),
        ...(lesson.writing || []).filter(w => w.slide === slide.n && w.ex === ex).map(w => {
          total++;
          const own = (notes[w.id] || '').trim();
          if (own) answered++;
          return `<li class="t-writing"><p class="t-q">${esc(w.prompt)}</p>
            ${w.checklist && w.checklist.length ? `<ul class="t-check">${w.checklist.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
            <textarea class="input no-print" rows="7" data-note="${w.id}" placeholder="Write your paragraph here">${esc(notes[w.id] || '')}</textarea>
            <p class="t-a print-only t-para" data-empty="Not written yet.">${own ? esc(own) : '<span class="missing">Not written yet.</span>'}</p>
            ${w.model ? `<details class="no-print"><summary>See an example paragraph</summary><p class="t-c">${esc(w.model)}</p></details>` : ''}</li>`;
        }),
      ];
      const head = objs.length ? `<button class="btn btn-small btn-ghost no-print" data-action="redo-items" data-ids="${objs.map(o => o.id).join(',')}">Redo this exercise</button>` : '';
      return `<section class="t-ex"><h3>${esc(title)}</h3>${head}<ol>${rows.join('')}</ol></section>`;
    }).join('');
    return `<section class="t-sec"><h2>${esc(slide.title)}</h2>${blocks}</section>`;
  }).join('');
  main.innerHTML = `
    <a class="back no-print" href="#/lesson/${lesson.id}">← Lesson ${lesson.number}</a>
    <div class="card no-print"><h2 class="card-title">My answers for the teacher</h2>
      <p class="hint">Only your teacher's exercises, with your latest answers. ${answered}/${total} done. Tap "Redo" on any item, or "Redo this exercise", to do it again: the new answer replaces the old one.</p>
      <label class="field">Your name<input class="input" data-setting="name" value="${esc(state.settings.name || '')}" placeholder="Your name"></label>
      <button class="btn btn-wide" data-action="print">Save as PDF</button>
      <p class="hint">On the next screen, choose "Save as PDF" as the printer.</p></div>
    <article class="t-doc">
      <header><h1>${esc(lesson.title)}</h1>
        <p>${state.settings.name ? `${esc(state.settings.name)} · ` : ''}${formatDate(dayKey(Date.now()))}${lesson.source ? ` · Material: ${esc(lesson.source)}` : ''}</p>
        <p class="t-legend">✓ correct · ✗ wrong (the correct answer is shown below)</p></header>
      ${sections}
    </article>`;
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
  if (a === 'print') { save(); return window.print(); }
  if (a === 'restore') {
    const snap = await readSnapshot(el.dataset.key);
    if (!snap || !confirm('Restore this copy? Your current progress is kept as a copy.')) return;
    await snapshot(state, 'before restore');
    state = snap; save({ reason: 'before restore' }); toast('Copy restored.'); return route();
  }
  if (a === 'redo-items' || a === 'redo-again') {
    const id = (location.hash.split('/')[2] || '');
    const lesson = await getLesson(id);
    const ps = practiceState(state, lesson.id);
    const ids = a === 'redo-again' ? (pview && pview.lastRun && pview.lastRun.order) || Object.keys(pview.lastRun.answers) : el.dataset.ids.split(',');
    if (ps.current && Object.keys(ps.current.answers).length && ps.current.mode !== 'redo'
      && !confirm('You have a practice round in progress. Leave it and redo these exercises?')) return;
    startRun(lesson, ps, Math.random, ids); save();
    const target = `#/lesson/${lesson.id}/practice`;
    if (location.hash === target) route(); else location.hash = target;
    return;
  }
  if (a === 'redo-open') {
    const id = location.hash.split('/')[2];
    delete slideProgress(state, id)[el.dataset.id];
    save(); focusQ = el.dataset.id;
    location.hash = `#/lesson/${id}/slide/${el.dataset.slide}`;
    return;
  }
  if (a.startsWith('p-') && pview) return practiceAction(a, el);
  if (!view) return;
  const item = view.active != null ? view.slide.items[view.active] : null;
  if (a === 'pick') { view.picked.push(Number(el.dataset.k)); view.status = 'idle'; return drawSlide(); }
  if (a === 'unpick') { view.picked.splice(Number(el.dataset.j), 1); view.status = 'idle'; return drawSlide(); }
  if (a === 'clear') { view.picked = []; view.status = 'idle'; return drawSlide(); }
  if (a === 'activate') { activate(Number(el.dataset.i)); return drawSlide(true); }
  if (a === 'redo-q') {
    const i = Number(el.dataset.i);
    delete slideProgress(state, view.lesson.id)[view.slide.items[i].id];
    save(); view.justDone = null; activate(i); return drawSlide(true);
  }
  if (a === 'redo-slide') {
    const done = slideProgress(state, view.lesson.id);
    for (const q of view.slide.items) delete done[q.id];
    save(); view.justDone = null; view.hidden = false; activate(0); drawSlide(); window.scrollTo(0, 0); return;
  }
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

function practiceAction(a, el) {
  const { lesson, ps, item } = pview;
  const answer = given => {
    recordPractice(ps, item, given, checkPractice(item, given));
    save(); requestPersistence(); drawPractice();
  };
  if (a === 'p-mc' && !ps.current.answers[item.id]) return answer(Number(el.dataset.i));
  if (a === 'p-pick') { pview.picked.push(Number(el.dataset.k)); return drawPractice(); }
  if (a === 'p-unpick') { pview.picked.splice(Number(el.dataset.j), 1); return drawPractice(); }
  if (a === 'p-clear') { pview.picked = []; return drawPractice(); }
  if (a === 'p-check' && !ps.current.answers[item.id]) {
    if (item.type === 'order') return answer(pview.picked.slice());
    if (item.type === 'gap') {
      const parts = pview.typed.map(t => t.trim());
      if (parts.some(t => !t)) { toast(parts.length > 1 ? 'Fill in all the blanks first.' : 'Type your answer first.'); return; }
      return answer(parts);
    }
    const text = (pview.typed || '').trim();
    if (!text) { toast('Type your answer first.'); return; }
    if (item.type === 'fix' && text === item.prompt.trim()) { toast("You haven't changed the sentence yet."); return; }
    return answer(text);
  }
  if (a === 'p-next') {
    ps.current.pos++;
    save();
    if (ps.current.pos >= ps.current.order.length) {
      finishRun(lesson, ps); save();
      location.hash = `#/lesson/${lesson.id}/practice/result`;
    } else renderPractice(lesson);
    window.scrollTo(0, 0);
  }
}

main.addEventListener('input', e => {
  if (e.target.dataset.p === 'typed' && pview) {
    if (Array.isArray(pview.typed)) pview.typed[Number(e.target.dataset.i)] = e.target.value;
    else pview.typed = e.target.value;
  }
  if (e.target.dataset.note && tview) {
    lessonNotes(state, tview.id)[e.target.dataset.note] = e.target.value;
    const out = e.target.parentElement.querySelector('.print-only');
    if (out) out.innerHTML = e.target.value.trim() ? esc(e.target.value.trim()) : `<span class="missing">${esc(out.dataset.empty || '')}</span>`;
    clearTimeout(e.target._t); e.target._t = setTimeout(() => save(), 500);
  }
});

main.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.matches('input[data-p="typed"]')) {
    e.preventDefault();
    const next = main.querySelector(`input[data-p="typed"][data-i="${Number(e.target.dataset.i) + 1}"]`);
    if (next) next.focus(); else main.querySelector('[data-action="p-check"]')?.click();
  }
});

main.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.setting === 'voice') { state.settings.voice = t.value; save(); }
  if (t.dataset.setting === 'name') { state.settings.name = t.value.trim().slice(0, 80); save(); route(); }
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
