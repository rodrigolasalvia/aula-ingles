// Lógica pura do app (sem DOM). Testada em tests/core.test.js.

export const APP_VERSION = '4.0.0';
export const STATE_VERSION = 4;
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
      s.lessons[id] = { ...ls, v3: { understood: p.understood === true, build: flags(p.build), speak: flags(p.speak) }, v4: { done: flags(q.done) } };
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
