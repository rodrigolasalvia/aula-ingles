// Lógica pura do app (sem DOM): estado, correção, avaliação e relatório. Testada em tests/core.test.js.

export const APP_VERSION = '1.0.0';
export const STATE_VERSION = 1;
export const RETAKE_MAX = 6;

export const TAGS = {
  'Compreensão': 'Releia os três cenários com a tradução fechada e explique cada um em uma frase, em voz alta.',
  'Vocabulário': 'Releia as expressões com o áudio e repita a frase-exemplo inteira, não só a expressão.',
  'Preposições': 'Repita em voz alta a expressão completa com a preposição (based ON, inspiration FROM, threatened BY). Nunca a palavra solta.',
  '-ING ou TO': 'Revise o card "-ING ou TO": depois de preposição vem -ING; depois de encourage, learn e driven vem TO + verbo.',
  'Classe de palavra': 'Antes de falar, pergunte-se: aqui vai substantivo, adjetivo ou verbo? Revise o card "Família de palavras".',
  'Tempos e estruturas': 'Monte 3 frases com might have + particípio e 3 com would para hipóteses, em voz alta.',
  'Falsos amigos': 'assume = supor · admit = assumir um erro · jealous = ciúme · envious = inveja.',
  'Lembrança das expressões': 'Leve para a aula as expressões que não vieram à memória e tente usá-las já na primeira resposta.',
};

export const SPEAK_LABELS = { stuck: 'Travei', effort: 'Saiu com esforço', fluent: 'Fluiu' };

/* ---------- Datas ---------- */

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
  return { v: STATE_VERSION, lessons: {}, log: [], settings: { rate: 0.95, voice: '' }, createdAt: Date.now() };
}

const isObj = x => x && typeof x === 'object' && !Array.isArray(x);

// Aceita qualquer coisa e devolve um estado válido, preservando tudo o que for aproveitável.
export function migrateState(raw) {
  const s = emptyState();
  if (!isObj(raw)) return s;
  if (typeof raw.createdAt === 'number') s.createdAt = raw.createdAt;
  if (isObj(raw.settings)) {
    const r = Number(raw.settings.rate);
    if (r >= 0.6 && r <= 1.3) s.settings.rate = r;
    if (typeof raw.settings.voice === 'string') s.settings.voice = raw.settings.voice;
  }
  if (Array.isArray(raw.log)) s.log = raw.log.filter(isObj).slice(-500);
  if (isObj(raw.lessons)) {
    for (const [id, ls] of Object.entries(raw.lessons)) {
      if (!isObj(ls)) continue;
      const out = { sessions: {}, pending: [], writes: {} };
      if (Array.isArray(ls.pending)) out.pending = [...new Set(ls.pending.filter(x => typeof x === 'string'))];
      if (isObj(ls.writes)) for (const [k, v] of Object.entries(ls.writes)) if (typeof v === 'string') out.writes[k] = v;
      if (isObj(ls.sessions)) {
        for (const [sid, rec] of Object.entries(ls.sessions)) {
          if (!isObj(rec)) continue;
          out.sessions[sid] = {
            status: rec.status === 'done' ? 'done' : 'active',
            startedAt: Number(rec.startedAt) || Date.now(),
            finishedAt: Number(rec.finishedAt) || null,
            pos: Math.max(0, Number(rec.pos) || 0),
            retake: Array.isArray(rec.retake) ? rec.retake.filter(x => typeof x === 'string') : [],
            answers: isObj(rec.answers) ? rec.answers : {},
            flash: isObj(rec.flash) ? rec.flash : {},
            speak: isObj(rec.speak) ? rec.speak : {},
            done: isObj(rec.done) ? rec.done : {},
            runs: Number(rec.runs) || 1,
          };
        }
      }
      s.lessons[id] = out;
    }
  }
  return s;
}

export function lessonState(state, lessonId) {
  if (!state.lessons[lessonId]) state.lessons[lessonId] = { sessions: {}, pending: [], writes: {} };
  return state.lessons[lessonId];
}

// Quantidade de registros: usada para nunca trocar um estado rico por um mais pobre.
export function recordCount(s) {
  if (!isObj(s)) return 0;
  let n = Array.isArray(s.log) ? s.log.length : 0;
  for (const ls of Object.values(isObj(s.lessons) ? s.lessons : {})) {
    if (!isObj(ls)) continue;
    n += Object.keys(isObj(ls.writes) ? ls.writes : {}).length;
    for (const rec of Object.values(isObj(ls.sessions) ? ls.sessions : {})) {
      if (!isObj(rec)) continue;
      n += Object.keys(isObj(rec.answers) ? rec.answers : {}).length;
      n += Object.keys(isObj(rec.flash) ? rec.flash : {}).length;
      n += Object.keys(isObj(rec.speak) ? rec.speak : {}).length;
    }
  }
  return n;
}

/* ---------- Correção ---------- */

const CONTRACTIONS = [
  [/\bi'm\b/g, 'i am'], [/\bdon't\b/g, 'do not'], [/\bdoesn't\b/g, 'does not'], [/\bdidn't\b/g, 'did not'],
  [/\bisn't\b/g, 'is not'], [/\baren't\b/g, 'are not'], [/\bcan't\b/g, 'cannot'], [/\bwon't\b/g, 'will not'],
  [/\bi'd\b/g, 'i would'], [/\bit's\b/g, 'it is'], [/\bthat's\b/g, 'that is'], [/\bshe's\b/g, 'she is'], [/\bhe's\b/g, 'he is'],
];

export function normalize(text) {
  let t = String(text ?? '').toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'").replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ').trim();
  for (const [re, rep] of CONTRACTIONS) t = t.replace(re, rep);
  return t.replace(/[.,!?;:"()]/g, '').replace(/\s+/g, ' ').trim();
}

export function checkTyped(item, given) {
  const g = normalize(given);
  if (!g) return false;
  return (item.accept || []).some(a => normalize(a) === g);
}

export function checkItem(item, given) {
  if (item.type === 'mc') return Number(given) === item.answer;
  if (item.type === 'fix' || item.type === 'gap') return checkTyped(item, given);
  return false;
}

// Quais expressões da lição aparecem num texto livre.
export function detectPhrases(text, phrases) {
  const t = String(text ?? '').toLowerCase().replace(/[‘’]/g, "'");
  return phrases.filter(p => (p.keys || []).some(k => new RegExp(k, 'i').test(t))).map(p => p.id);
}

export const wordCount = text => (String(text ?? '').trim().match(/[A-Za-zÀ-ÿ'’-]+/g) || []).length;

/* ---------- Sessão ---------- */

export const findItem = (lesson, id) => lesson.items.find(i => i.id === id);

// Itens que já pertencem à própria sessão não entram na retomada.
export function retakeFor(lesson, ls, sessionDef) {
  const own = new Set(sessionDef.steps.filter(s => s.kind === 'item').map(s => s.ref));
  return (ls.pending || []).filter(id => !own.has(id) && findItem(lesson, id)).slice(0, RETAKE_MAX);
}

export function startSession(lesson, ls, sessionDef, now = Date.now()) {
  const prev = ls.sessions[sessionDef.id];
  const rec = {
    status: 'active', startedAt: now, finishedAt: null, pos: 0,
    retake: retakeFor(lesson, ls, sessionDef), answers: {}, flash: {}, speak: {}, done: {},
    runs: prev ? (prev.runs || 1) + 1 : 1,
  };
  ls.sessions[sessionDef.id] = rec;
  return rec;
}

export function flowSteps(sessionDef, rec) {
  return [...(rec.retake || []).map(ref => ({ kind: 'item', ref, retake: true })), ...sessionDef.steps];
}

// Registra uma resposta e atualiza a lista de pendências da lição.
export function recordAnswer(ls, rec, item, { given, ok, self = false, retake = false }, now = Date.now()) {
  const key = retake ? `retake:${item.id}` : item.id;
  rec.answers[key] = { ok: !!ok, given: String(given ?? ''), self: !!self, ts: now };
  const pending = new Set(ls.pending || []);
  if (ok) pending.delete(item.id); else pending.add(item.id);
  ls.pending = [...pending];
}

/* ---------- Avaliação ---------- */

export function tally(lesson, rec) {
  const byTag = {};
  const errors = [];
  let ok = 0, n = 0;
  const add = (tag, good) => {
    byTag[tag] = byTag[tag] || { ok: 0, n: 0 };
    byTag[tag].n++; if (good) byTag[tag].ok++;
  };
  for (const [key, a] of Object.entries(rec.answers || {})) {
    const id = key.replace(/^retake:/, '');
    const item = findItem(lesson, id);
    if (!item) continue;
    n++; if (a.ok) ok++;
    add(item.tag, a.ok);
    if (!a.ok) errors.push({ item, given: a.given, retake: key.startsWith('retake:') });
  }
  const forgot = [];
  for (const [pid, good] of Object.entries(rec.flash || {})) {
    add('Lembrança das expressões', !!good);
    n++; if (good) ok++;
    if (!good) { const p = lesson.phrases.find(x => x.id === pid); if (p) forgot.push(p); }
  }
  return { ok, n, pct: n ? Math.round((ok / n) * 100) : null, byTag, errors, forgot };
}

export function writingSummary(lesson, ls, sessionDef) {
  return sessionDef.steps.filter(s => s.kind === 'write').map(s => {
    const q = lesson.questions.find(x => x.id === s.ref);
    const text = ls.writes[s.ref] || '';
    const found = detectPhrases(text, lesson.phrases);
    return { q, text, words: wordCount(text), found };
  });
}

export function evaluate(lesson, ls, sessionDef, rec) {
  const t = tally(lesson, rec);
  const good = [], bad = [], mid = [], focus = [];
  const tags = Object.entries(t.byTag).map(([tag, v]) => ({ tag, ...v, pct: Math.round((v.ok / v.n) * 100) }))
    .sort((a, b) => a.pct - b.pct);
  for (const x of tags) {
    const line = `${x.tag}: ${x.ok}/${x.n}`;
    if (x.pct >= 80) good.push(line); else if (x.pct < 60) bad.push(line); else mid.push(line);
  }
  for (const x of tags.filter(x => x.pct < 80).slice(0, 3)) if (TAGS[x.tag]) focus.push(TAGS[x.tag]);

  const writes = writingSummary(lesson, ls, sessionDef);
  for (const w of writes) {
    if (!w.text) continue;
    if (w.found.length >= 2 && w.words >= 30) good.push(`Escrita (${w.q.id}): ${w.words} palavras, ${w.found.length} expressões da lição`);
    else bad.push(`Escrita (${w.q.id}): ${w.words} palavras, ${w.found.length} expressão(ões) da lição`);
  }
  if (writes.some(w => w.text && w.found.length < 2)) focus.push('Nas respostas escritas, use pelo menos 2 expressões da lição. Reescreva a mais curta usando o kit de argumentação.');
  if (writes.some(w => w.text && w.words < 30)) focus.push('Respostas com menos de 30 palavras ficam rasas para B2. Estruture: posição → motivo → exemplo → conclusão.');

  const ratings = Object.values(rec.speak || {});
  const stuck = ratings.filter(r => r === 'stuck').length, fluent = ratings.filter(r => r === 'fluent').length;
  if (ratings.length) {
    const line = `Fala (sua autoavaliação): ${fluent} fluiu, ${ratings.filter(r => r === 'effort').length} com esforço, ${stuck} travou`;
    if (stuck > 0) { bad.push(line); focus.push('Nas perguntas em que travou: leia o modelo em voz alta 2 vezes, feche e responda de novo com suas palavras. Use "That\'s a tricky one. Let me think…" para ganhar tempo.'); }
    else if (fluent >= Math.ceil(ratings.length / 2)) good.push(line);
    else { mid.push(line); focus.push('A fala ainda sai com esforço: responda de novo, em voz alta, as perguntas sem olhar o modelo, até sair inteiro em 60 segundos.'); }
  }
  if (!focus.length && t.n) focus.push('Desempenho sólido. Na próxima etapa, priorize falar em voz alta e usar as expressões sem olhar.');
  const pending = (ls.pending || []).length;
  return { ...t, good, bad, mid, focus: focus.slice(0, 4), writes, pending };
}

/* ---------- Relatório para colar no chat ---------- */

export function buildReport(lesson, ls, sessionDef, rec, ev = evaluate(lesson, ls, sessionDef, rec)) {
  const L = [];
  L.push(`AULA DE INGLÊS · Lição ${lesson.number}: ${lesson.title}`);
  L.push(`Sessão ${sessionDef.id.slice(1)} · ${sessionDef.title} · ${formatDate(dayKey(rec.finishedAt || Date.now()))}${rec.runs > 1 ? ` · ${rec.runs}ª vez` : ''}`);
  if (ev.n) L.push(`Acertos: ${ev.ok}/${ev.n} (${ev.pct}%)`);
  const tags = Object.entries(ev.byTag);
  if (tags.length) L.push('Por habilidade: ' + tags.map(([k, v]) => `${k} ${v.ok}/${v.n}`).join(' · '));
  if (ev.errors.length) {
    L.push('', 'ERROS:');
    for (const e of ev.errors) {
      const right = e.item.type === 'mc' ? e.item.options[e.item.answer] : e.item.model;
      const mine = e.item.type === 'mc' ? (e.item.options[Number(e.given)] ?? '—') : (e.given || '—');
      L.push(`- [${e.item.tag}]${e.retake ? ' (retomada)' : ''} ${e.item.prompt} | respondi: ${mine} | certo: ${right}`);
    }
  }
  if (ev.forgot.length) L.push('', 'NÃO LEMBREI: ' + ev.forgot.map(p => p.en).join('; '));
  const writes = ev.writes.filter(w => w.text);
  if (writes.length) {
    L.push('', 'RESPOSTAS ESCRITAS (corrigir gramática e naturalidade):');
    for (const w of writes) L.push(`Q: ${w.q.en}`, `R: ${w.text.trim()}`, '');
  }
  const speak = Object.entries(rec.speak || {});
  if (speak.length) L.push('FALA (autoavaliação): ' + speak.map(([q, r]) => `${q} ${SPEAK_LABELS[r] || r}`).join(' · '));
  L.push('', `Pendências para retomada: ${ev.pending}`);
  L.push('Peço a avaliação: onde fui bem, onde fui mal e onde focar.');
  return L.join('\n');
}

/* ---------- Utilidades ---------- */

export function shuffledOrder(n, rnd = Math.random) {
  const a = [...Array(n).keys()];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function sessionStatus(ls, sid) {
  const r = ls && ls.sessions[sid];
  if (!r) return 'new';
  return r.status === 'done' ? 'done' : 'active';
}

export function nextSessionId(lesson, ls) {
  const active = lesson.sessions.find(s => sessionStatus(ls, s.id) === 'active');
  if (active) return active.id;
  const fresh = lesson.sessions.find(s => sessionStatus(ls, s.id) === 'new');
  return fresh ? fresh.id : null;
}

// Validação de backup importado: precisa parecer um estado deste app.
export function looksLikeBackup(raw) {
  const s = raw && raw.state ? raw.state : raw;
  return isObj(s) && (isObj(s.lessons) || Array.isArray(s.log)) ? s : null;
}
