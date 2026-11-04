// Lógica pura do app (sem DOM). Testada em tests/core.test.js.

export const APP_VERSION = '5.0.0';
export const STATE_VERSION = 5;
export const SLOW_RATE = 0.85;

export function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDate(iso) {
  const [y, m, d] = String(iso).split('-');
  return d && m && y ? `${d}/${m}/${y}` : String(iso);
}

/* ---------- Estado ---------- */

export function emptyState() {
  return { v: STATE_VERSION, lessons: {}, log: [], settings: { voice: '' }, createdAt: Date.now() };
}

const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
const flags = x => (isObj(x) ? Object.fromEntries(Object.entries(x).filter(([, v]) => v === true)) : {});

// Aceita qualquer coisa e devolve um estado válido. Dados de versões anteriores ficam guardados intactos.
export function migrateState(raw) {
  const s = emptyState();
  if (!isObj(raw)) return s;
  if (typeof raw.createdAt === 'number') s.createdAt = raw.createdAt;
  if (isObj(raw.settings)) s.settings = { ...raw.settings, voice: typeof raw.settings.voice === 'string' ? raw.settings.voice : '' };
  if (Array.isArray(raw.log)) s.log = raw.log.filter(isObj).slice(-500);
  if (isObj(raw.lessons)) {
    for (const [id, ls] of Object.entries(raw.lessons)) {
      if (!isObj(ls)) continue;
      const p = isObj(ls.v3) ? ls.v3 : {};
      const q = isObj(ls.v4) ? ls.v4 : {};
      const r = isObj(ls.practice) ? ls.practice : {};
      s.lessons[id] = {
        ...ls,
        v3: { understood: p.understood === true, build: flags(p.build), speak: flags(p.speak) },
        v4: { done: flags(q.done) },
        practice: { runs: Array.isArray(r.runs) ? r.runs.filter(validRun).slice(-50) : [], current: validCurrent(r.current) ? r.current : null },
      };
    }
  }
  return s;
}

export function progress(state, lessonId) {
  const ls = state.lessons[lessonId] || (state.lessons[lessonId] = {});
  if (!isObj(ls.v3)) ls.v3 = { understood: false, build: {}, speak: {} };
  return ls.v3;
}

// Progresso do formato atual (uma tela por lâmina): perguntas já montadas corretamente.
export function slideProgress(state, lessonId) {
  const ls = state.lessons[lessonId] || (state.lessons[lessonId] = {});
  if (!isObj(ls.v4) || !isObj(ls.v4.done)) ls.v4 = { done: {} };
  return ls.v4.done;
}

export const doneCount = (slide, done) => slide.items.filter(i => done[i.id]).length;

// Primeira lâmina com pergunta pendente (ou null).
export function nextSlide(lesson, done) {
  return lesson.slides.find(s => doneCount(s, done) < s.items.length) || null;
}

// Quantidade de registros (todas as versões): usada para nunca trocar um estado rico por um mais pobre.
export function recordCount(s) {
  if (!isObj(s)) return 0;
  let n = Array.isArray(s.log) ? s.log.length : 0;
  const keys = o => Object.keys(isObj(o) ? o : {}).length;
  for (const ls of Object.values(isObj(s.lessons) ? s.lessons : {})) {
    if (!isObj(ls)) continue;
    if (isObj(ls.v3)) n += keys(ls.v3.build) + keys(ls.v3.speak) + (ls.v3.understood ? 1 : 0);
    if (isObj(ls.v4)) n += keys(ls.v4.done);
    if (isObj(ls.practice)) {
      for (const run of Array.isArray(ls.practice.runs) ? ls.practice.runs : []) if (isObj(run)) n += keys(run.answers);
      if (isObj(ls.practice.current)) n += keys(ls.practice.current.answers);
    }
    for (const b of Object.values(isObj(ls.blocks) ? ls.blocks : {})) if (isObj(b)) n += keys(b.answers) + keys(b.writes);
    n += keys(ls.writes);
    for (const r of Object.values(isObj(ls.sessions) ? ls.sessions : {})) if (isObj(r)) n += keys(r.answers);
  }
  return n;
}

/* ---------- Montagem de frases ---------- */

export const sentenceOf = blocks => blocks.join(' ');

export function normalize(text) {
  return String(text ?? '').toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();
}

// Compara o texto montado (não os índices): blocos iguais podem trocar de lugar sem erro.
export function isCorrect(item, pickedIdx) {
  if (pickedIdx.length !== item.blocks.length) return false;
  return normalize(sentenceOf(pickedIdx.map(i => item.blocks[i]))) === normalize(sentenceOf(item.blocks));
}

export function shuffledOrder(n, rnd = Math.random) {
  const a = [...Array(n).keys()];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Embaralha sem devolver a frase já pronta.
export function scramble(blocks, rnd = Math.random) {
  for (let t = 0; t < 30; t++) {
    const o = shuffledOrder(blocks.length, rnd);
    if (normalize(sentenceOf(o.map(i => blocks[i]))) !== normalize(sentenceOf(blocks))) return o;
  }
  return [...Array(blocks.length).keys()].reverse();
}

// Primeiro exercício ainda não feito (1-based); null quando todos estão feitos.
export function nextIndex(items, done) {
  const i = items.findIndex(x => !done[x.id]);
  return i === -1 ? null : i + 1;
}

export function looksLikeBackup(raw) {
  const s = raw && raw.state ? raw.state : raw;
  return isObj(s) && (isObj(s.lessons) || Array.isArray(s.log)) ? s : null;
}

/* ---------- Practice: exercícios objetivos com percentual ---------- */

const validRun = r => isObj(r) && Number.isFinite(r.ok) && Number.isFinite(r.n) && r.n > 0 && isObj(r.answers);
const validCurrent = c => isObj(c) && Array.isArray(c.order) && c.order.every(x => typeof x === 'string')
  && Number.isInteger(c.pos) && c.pos >= 0 && isObj(c.answers);

export function practiceState(state, lessonId) {
  const ls = state.lessons[lessonId] || (state.lessons[lessonId] = {});
  if (!isObj(ls.practice)) ls.practice = { runs: [], current: null };
  if (!Array.isArray(ls.practice.runs)) ls.practice.runs = [];
  return ls.practice;
}

const CONTRACTIONS = [
  [/\bdon't\b/g, 'do not'], [/\bdoesn't\b/g, 'does not'], [/\bdidn't\b/g, 'did not'], [/\bisn't\b/g, 'is not'],
  [/\baren't\b/g, 'are not'], [/\bcan't\b/g, 'cannot'], [/\bwon't\b/g, 'will not'], [/\bi'm\b/g, 'i am'],
  [/\bi'd\b/g, 'i would'], [/\bit's\b/g, 'it is'], [/\bthat's\b/g, 'that is'], [/\bshe's\b/g, 'she is'], [/\bhe's\b/g, 'he is'],
];

// Texto digitado: ignora maiúsculas, pontuação, espaços extras e contrações.
export function normalizeTyped(text) {
  let t = normalize(text).replace(/[“”]/g, '"');
  for (const [re, rep] of CONTRACTIONS) t = t.replace(re, rep);
  return t.replace(/[.,!?;:"()]/g, '').replace(/\s+/g, ' ').trim();
}

export function correctAnswer(item) {
  if (item.type === 'mc') return item.prompt.replace('___', item.options[item.answer]);
  if (item.type === 'gap') return item.prompt.replace('___', item.accept[0]);
  if (item.type === 'fix') return item.accept[0];
  return sentenceOf(item.blocks);
}

// given: índice (mc), texto (gap/fix) ou lista de índices dos blocos (order).
export function checkPractice(item, given) {
  if (item.type === 'mc') return Number(given) === item.answer;
  if (item.type === 'gap' || item.type === 'fix') {
    const g = normalizeTyped(given);
    return !!g && item.accept.some(a => normalizeTyped(a) === g);
  }
  if (item.type === 'order') return Array.isArray(given) && isCorrect(item, given);
  return false;
}

export function startRun(lesson, ps, rnd = Math.random) {
  ps.current = { order: shuffledOrder(lesson.practice.length, rnd).map(i => lesson.practice[i].id), pos: 0, answers: {}, startedAt: Date.now() };
  return ps.current;
}

export function recordPractice(ps, item, given, ok) {
  ps.current.answers[item.id] = { ok: !!ok, given: Array.isArray(given) ? given.join(',') : String(given) };
}

export function runScore(lesson, answers) {
  const ids = Object.keys(answers).filter(id => lesson.practice.some(p => p.id === id));
  const ok = ids.filter(id => answers[id].ok).length;
  const bySkill = {};
  for (const id of ids) {
    const item = lesson.practice.find(p => p.id === id);
    const b = bySkill[item.skill] || (bySkill[item.skill] = { ok: 0, n: 0 });
    b.n++; if (answers[id].ok) b.ok++;
  }
  return { ok, n: ids.length, pct: ids.length ? Math.round((ok / ids.length) * 100) : 0, bySkill };
}

export function finishRun(lesson, ps, now = Date.now()) {
  const sc = runScore(lesson, ps.current.answers);
  const run = { ts: now, ok: sc.ok, n: sc.n, pct: sc.pct, answers: ps.current.answers };
  ps.runs.push(run);
  ps.current = null;
  return run;
}

export function practiceSummary(ps) {
  const runs = (ps && ps.runs) || [];
  if (!runs.length) return null;
  const last = runs[runs.length - 1];
  return { last: last.pct, best: Math.max(...runs.map(r => r.pct)), count: runs.length };
}
