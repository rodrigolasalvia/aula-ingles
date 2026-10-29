// Lógica pura do app (sem DOM): estado, correção, avaliação e relatório. Testada em tests/core.test.js.

export const APP_VERSION = '2.0.0';
export const STATE_VERSION = 2;

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

// Aceita qualquer coisa e devolve um estado válido. Dados da versão 1 (sessions, pending, writes) são mantidos intactos.
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
      const out = { ...ls, blocks: {} };
      if (isObj(ls.blocks)) {
        for (const [bid, b] of Object.entries(ls.blocks)) {
          if (!isObj(b)) continue;
          out.blocks[bid] = {
            answers: isObj(b.answers) ? b.answers : {},
            writes: isObj(b.writes) ? Object.fromEntries(Object.entries(b.writes).filter(([, v]) => typeof v === 'string')) : {},
            done: !!b.done,
            doneAt: Number(b.doneAt) || null,
          };
        }
      }
      s.lessons[id] = out;
    }
  }
  return s;
}

export function blockState(state, lessonId, blockId) {
  const ls = state.lessons[lessonId] || (state.lessons[lessonId] = { blocks: {} });
  if (!ls.blocks) ls.blocks = {};
  return ls.blocks[blockId] || (ls.blocks[blockId] = { answers: {}, writes: {}, done: false, doneAt: null });
}

// Quantidade de registros: usada para nunca trocar um estado rico por um mais pobre.
export function recordCount(s) {
  if (!isObj(s)) return 0;
  let n = Array.isArray(s.log) ? s.log.length : 0;
  for (const ls of Object.values(isObj(s.lessons) ? s.lessons : {})) {
    if (!isObj(ls)) continue;
    for (const b of Object.values(isObj(ls.blocks) ? ls.blocks : {})) {
      if (!isObj(b)) continue;
      n += Object.keys(isObj(b.answers) ? b.answers : {}).length + Object.keys(isObj(b.writes) ? b.writes : {}).length;
    }
    // registros da versão 1
    n += Object.keys(isObj(ls.writes) ? ls.writes : {}).length;
    for (const rec of Object.values(isObj(ls.sessions) ? ls.sessions : {})) {
      if (isObj(rec)) n += Object.keys(isObj(rec.answers) ? rec.answers : {}).length;
    }
  }
  return n;
}

/* ---------- Correção ---------- */

export function normalize(text) {
  return String(text ?? '').toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[.,!?;:"()]/g, '').replace(/\s+/g, ' ').trim();
}

export const tokens = sentence => String(sentence).trim().split(/\s+/);

export function checkItem(item, given) {
  if (item.type === 'mc') return Number(given) === item.answer;
  if (item.type === 'order') return normalize(given) === normalize(item.answer);
  return false;
}

// Quais expressões da lição aparecem num texto livre.
export function detectPhrases(text, phrases) {
  const t = String(text ?? '').toLowerCase().replace(/[‘’]/g, "'");
  return phrases.filter(p => (p.keys || []).some(k => new RegExp(k, 'i').test(t))).map(p => p.id);
}

export const wordCount = text => (String(text ?? '').trim().match(/[A-Za-zÀ-ÿ'’-]+/g) || []).length;

// Frase escrita conta como certa quando usa uma das expressões pedidas e tem pelo menos 6 palavras.
export function checkWrite(item, text, phrases) {
  const found = detectPhrases(text, phrases.filter(p => item.phrases.includes(p.id)));
  return { used: found.length > 0, words: wordCount(text), ok: found.length > 0 && wordCount(text) >= 6 };
}

/* ---------- Avaliação ---------- */

export const allPhrases = lesson => lesson.blocks.flatMap(b => b.phrases);

export function blockResult(lesson, block, bs) {
  const objective = block.practice.filter(i => i.type !== 'write');
  const writes = block.practice.filter(i => i.type === 'write');
  let ok = 0;
  const errors = [];
  for (const i of objective) {
    const a = bs.answers[i.id];
    if (a && a.ok) ok++;
    else if (a) errors.push({ item: i, given: a.given });
  }
  const written = writes.map(i => ({ item: i, text: bs.writes[i.id] || '', ...checkWrite(i, bs.writes[i.id] || '', allPhrases(lesson)) }));
  const answered = objective.filter(i => bs.answers[i.id]).length + written.filter(w => w.text).length;
  return {
    ok, n: objective.length, errors, written, answered, total: block.practice.length,
    complete: answered === block.practice.length,
  };
}

export function blockFeedback(r) {
  const good = [], focus = [];
  if (r.n && r.ok === r.n) good.push('Acertou todos os exercícios de completar e montar frases.');
  for (const e of r.errors) focus.push(`Reveja: ${e.item.explain}`);
  const usedAll = r.written.filter(w => w.text).every(w => w.used);
  if (r.written.some(w => w.text) && usedAll) good.push('Usou as expressões pedidas nas suas frases.');
  for (const w of r.written) if (w.text && !w.used) focus.push('Na sua frase faltou a expressão pedida. Reescreva usando a expressão inteira.');
  if (!focus.length) focus.push('Antes da aula, leia em voz alta as frases novas e as suas frases. Na aula, tente usar ao menos 2 expressões de cada bloco.');
  return { good, focus };
}

export function lessonReport(lesson, state) {
  const L = [`AULA DE INGLÊS · Lição ${lesson.number}: ${lesson.title}`, `Relatório de ${formatDate(dayKey(Date.now()))}`];
  let ok = 0, n = 0;
  for (const b of lesson.blocks) {
    const bs = blockState(state, lesson.id, b.id);
    const r = blockResult(lesson, b, bs);
    ok += r.ok; n += r.n;
    L.push('', `BLOCO ${b.slide} · ${b.title} — ${r.ok}/${r.n} certos${bs.done ? '' : ' (não concluído)'}`);
    for (const e of r.errors) {
      const mine = e.item.type === 'mc' ? (e.item.options[Number(e.given)] ?? '—') : (e.given || '—');
      const right = e.item.type === 'mc' ? e.item.options[e.item.answer] : e.item.answer;
      L.push(`- Erro: ${e.item.prompt} | respondi: ${mine} | certo: ${right}`);
    }
    for (const w of r.written) if (w.text) L.push(`- Minha frase: ${w.text.trim()}${w.used ? '' : ' (sem a expressão pedida)'}`);
  }
  L.splice(2, 0, `Total: ${ok}/${n} nos exercícios objetivos`);
  L.push('', 'Peço a avaliação: corrija minhas frases e diga onde fui bem, onde fui mal e onde focar.');
  return L.join('\n');
}

/* ---------- Utilidades ---------- */

export function shuffledOrder(n, rnd = Math.random) {
  const a = [...Array(n).keys()];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Embaralha sem devolver a ordem original (quando há mais de uma palavra diferente).
export function scramble(words, rnd = Math.random) {
  for (let t = 0; t < 20; t++) {
    const o = shuffledOrder(words.length, rnd);
    if (o.some((x, i) => words[x] !== words[i])) return o;
  }
  return shuffledOrder(words.length, rnd);
}

export function looksLikeBackup(raw) {
  const s = raw && raw.state ? raw.state : raw;
  return isObj(s) && (isObj(s.lessons) || Array.isArray(s.log)) ? s : null;
}
