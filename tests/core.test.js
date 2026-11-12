import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import {
  isCorrect, scramble, sentenceOf, normalize, migrateState, emptyState, slideProgress, doneCount, nextSlide,
  recordCount, looksLikeBackup, practiceState, checkPractice, correctAnswer, startRun, recordPractice, runScore,
  finishRun, practiceSummary, normalizeTyped, gapAccepts, blankCount, latestAnswers, givenText, bankCoverage, SESSION_SIZE,
} from '../js/core.js';

const index = JSON.parse(readFileSync(new URL('../data/v4/lessons.json', import.meta.url)));
const lessons = index.lessons.map(m => ({ meta: m, data: JSON.parse(readFileSync(new URL(`../${m.file}`, import.meta.url))) }));
const words = s => s.trim().split(/\s+/).length;
const PT = /\b(não|você|para|uma|com|está|também|porque|então)\b|[ãõç]/i;

for (const { meta, data: L } of lessons) {
  test(`${meta.id}: índice e arquivo coerentes`, () => {
    assert.equal(L.id, meta.id); assert.equal(L.number, meta.number); assert.equal(L.date, meta.date);
    assert.ok(L.slides.length >= 1);
    assert.deepEqual(L.slides.map(s => s.n), L.slides.map((_, i) => i + 1));
  });

  test(`${meta.id}: cada lâmina tem resumo curto, expressões e 3 a 5 perguntas`, () => {
    for (const s of L.slides) {
      assert.ok(s.title && s.question);
      assert.ok(words(s.summary) <= 60, `${s.id}: resumo longo`);
      assert.ok(s.expressions.length >= 3 && s.expressions.length <= 6, `${s.id}: expressões`);
      for (const x of s.expressions) assert.ok(x.en && words(x.meaning) <= 15, `${x.en}: explicação longa`);
      assert.ok(s.items.length >= 3 && s.items.length <= 5, `${s.id}: ${s.items.length} perguntas`);
      // Material em lâminas: as perguntas da professora; material em texto corrido: frases de aquecimento.
      if (s.items.some(i => i.kind === 'class')) assert.ok(s.items.filter(i => i.kind === 'class').length >= 3, `${s.id}: faltam perguntas da aula`);
    }
  });

  test(`${meta.id}: respostas curtas em 3 a 5 blocos, frase completa`, () => {
    const all = L.slides.flatMap(s => s.items);
    const ids = all.map(x => x.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const x of all) {
      assert.ok(x.blocks.length >= 3 && x.blocks.length <= 5, `${x.id}: ${x.blocks.length} blocos`);
      assert.equal(new Set(x.blocks).size, x.blocks.length, `${x.id}: bloco repetido`);
      const sentence = sentenceOf(x.blocks);
      assert.match(sentence, /^[A-Z].*[.?!]$/, `${x.id}: maiúscula/ponto final`);
      const w = words(sentence);
      assert.ok(w >= 8 && w <= 26, `${x.id}: ${w} palavras`);
      assert.ok(x.explain && words(x.explain) <= 25, `${x.id}: explicação`);
    }
  });

  test(`${meta.id}: tudo em inglês`, () => {
    const text = JSON.stringify(L.slides);
    assert.ok(!PT.test(text), `trecho em português: ${text.match(PT)}`);
  });

  test(`${meta.id}: ordem certa aceita, outras recusadas, embaralhamento nunca entrega pronta`, () => {
    for (const x of L.slides.flatMap(s => s.items)) {
      const right = x.blocks.map((_, i) => i);
      assert.ok(isCorrect(x, right));
      assert.ok(!isCorrect(x, [...right].reverse()));
      assert.ok(!isCorrect(x, right.slice(0, -1)));
      for (let t = 0; t < 20; t++) assert.ok(!isCorrect(x, scramble(x.blocks)), `${x.id}`);
    }
  });
}

for (const { meta, data: L } of lessons) {
  test(`${meta.id}: practice com cerca de 10 exercícios válidos`, () => {
    const P = L.practice;
    assert.ok(P.length >= 8 && P.length <= 60, `${P.length} exercícios`);
    assert.equal(new Set(P.map(x => x.id)).size, P.length);
    const slideItems = new Set(L.slides.flatMap(s => s.items.map(i => i.id)));
    for (const x of P) {
      assert.ok(!slideItems.has(x.id), `${x.id} repete id de lâmina`);
      assert.ok(['mc', 'gap', 'fix', 'order'].includes(x.type), x.id);
      assert.ok(['teacher', 'extra'].includes(x.source), x.id);
      assert.ok(L.slides.some(s => s.n === x.slide), `${x.id}: lâmina inexistente`);
      assert.ok(x.skill && x.explain && words(x.explain) <= 30, `${x.id}: explicação`);
      assert.ok(!PT.test(x.explain + ' ' + (x.tip || '')), `${x.id}: português`);
      if (x.type === 'mc') {
        assert.ok(x.prompt.includes('___') || x.options.every(o => /^[A-Z].*[.?!]$/.test(o)), `${x.id}: lacuna ou opções completas`);
        assert.equal(new Set(x.options).size, x.options.length);
        x.options.forEach((_, k) => assert.equal(checkPractice(x, k), k === x.answer, `${x.id}:${k}`));
      } else if (x.type === 'gap') {
        const acc = gapAccepts(x);
        assert.equal(acc.length, blankCount(x), `${x.id}: lacunas × respostas`);
        assert.ok(checkPractice(x, acc.map(a => a[0])), `${x.id}: gabarito`);
        for (let i = 0; i < acc.length; i++) for (const alt of acc[i]) {
          const g = acc.map(a => a[0]); g[i] = alt; assert.ok(checkPractice(x, g), `${x.id}: ${alt}`);
        }
        assert.ok(!checkPractice(x, acc.map(() => 'xyz')));
      } else if (x.type === 'fix') {
        for (const a of x.accept) assert.ok(checkPractice(x, a));
        assert.ok(!checkPractice(x, x.prompt), `${x.id}: frase errada aceita`);
      } else {
        assert.ok(x.blocks.length >= 3 && x.blocks.length <= 6);
        assert.ok(checkPractice(x, x.blocks.map((_, i) => i)));
        assert.ok(!checkPractice(x, x.blocks.map((_, i) => i).reverse()));
      }
      assert.match(correctAnswer(x), /^[A-Z].*[.?!]$/, `${x.id}: resposta completa`);
      assert.ok(!correctAnswer(x).includes('___') && !/\(\w+\)/.test(correctAnswer(x)), `${x.id}: lacuna ou dica sobrando`);
      if (x.source === 'teacher') assert.ok(Number.isInteger(x.ex) && L.exercises[x.slide][x.ex], `${x.id}: exercício da professora sem título`);
      if (x.strict) for (const a of x.accept) assert.match(a, /^[A-Z].*[.?!]$/, `${x.id}: gabarito estrito sem maiúscula/pontuação`);
    }
    const types = new Set(P.map(x => x.type));
    assert.ok(types.size >= 3, 'variedade de tipos');
  });
}

test('correção estrita: maiúscula e ponto de interrogação contam', () => {
  const it = { type: 'fix', strict: true, prompt: 'what if I try one more time here', accept: ['What if I try one more time here?'] };
  assert.ok(checkPractice(it, 'What if I try one more time here?'));
  assert.ok(checkPractice(it, '  What if I try one more time here ? '));
  assert.ok(!checkPractice(it, 'what if I try one more time here?'));
  assert.ok(!checkPractice(it, 'What if I try one more time here'));
  assert.ok(!checkPractice(it, 'What if I try one more time here.'));
});

test('múltipla escolha sem lacuna: a resposta certa é a própria frase', () => {
  const it = { type: 'mc', prompt: 'Choose the correct sentence.', options: ['My wife is angry.', 'My wife are angry.'], answer: 0 };
  assert.equal(correctAnswer(it), 'My wife is angry.');
});

test('digitação: ignora maiúsculas, pontuação e contrações', () => {
  assert.equal(normalizeTyped("She DIDN'T  give in."), 'she did not give in');
  const fix = { type: 'fix', accept: ['I take inspiration from people who changed careers.'] };
  assert.ok(checkPractice(fix, 'i take inspiration from people who changed careers'));
});

test('sessão de 10 do banco: novos primeiro, depois errados; cobertura e respostas legíveis', () => {
  const L = lessons.find(l => l.data.practice.length > SESSION_SIZE).data;
  const s = emptyState();
  const ps = practiceState(s, L.id);
  const seen = new Set();
  let rounds = 0;
  while (seen.size < L.practice.length) {
    const cur = startRun(L, ps);
    assert.equal(cur.order.length, SESSION_SIZE);
    if (rounds < Math.floor(L.practice.length / SESSION_SIZE)) assert.ok(cur.order.every(id => !seen.has(id)), 'repetiu antes de ver todos');
    for (const id of cur.order) {
      const item = L.practice.find(p => p.id === id);
      recordPractice(ps, item, item.type === 'order' ? item.blocks.map((_, i) => i) : item.type === 'gap' ? gapAccepts(item).map(a => a[0]) : item.type === 'mc' ? 0 : 'x', id.endsWith('a'));
      seen.add(id);
    }
    finishRun(L, ps); rounds++;
    assert.ok(rounds < 10);
  }
  assert.deepEqual(bankCoverage(L, ps), { seen: L.practice.length, total: L.practice.length });
  const cur = startRun(L, ps);
  const wrongNow = Object.entries(latestAnswers(ps)).filter(([, a]) => !a.ok).map(([id]) => id);
  assert.ok(cur.order.filter(id => wrongNow.includes(id)).length === Math.min(SESSION_SIZE, wrongNow.length), 'errados primeiro');
  const g = L.practice.find(p => p.type === 'gap' && blankCount(p) === 2);
  if (g) assert.equal(givenText(g, { given: 'had studied | would have passed' }).startsWith('If I had studied harder, I would have passed'), true);
  const o = L.practice.find(p => p.type === 'order');
  assert.equal(givenText(o, { given: o.blocks.map((_, i) => i).join(',') }), o.blocks.join(' '));
});

test('rodada de practice: ordem embaralhada, percentual, último e melhor', () => {
  const L = lessons[0].data;
  const s = emptyState();
  const ps = practiceState(s, L.id);
  assert.equal(practiceSummary(ps), null);
  const cur = startRun(L, ps, () => 0.3);
  assert.deepEqual([...cur.order].sort(), L.practice.map(p => p.id).sort());
  L.practice.forEach((item, i) => recordPractice(ps, item, 0, i % 2 === 0));
  const sc = runScore(L, ps.current.answers);
  assert.equal(sc.n, L.practice.length);
  assert.equal(sc.pct, Math.round((sc.ok / sc.n) * 100));
  finishRun(L, ps);
  assert.equal(ps.current, null);
  startRun(L, ps);
  L.practice.forEach(item => recordPractice(ps, item, 0, true));
  finishRun(L, ps);
  assert.deepEqual(practiceSummary(ps), { last: 100, best: 100, count: 2 });
  const m = migrateState(JSON.parse(JSON.stringify(s)));
  assert.equal(m.lessons[L.id].practice.runs.length, 2);
  assert.equal(recordCount(m), recordCount(s));
  const bad = migrateState({ lessons: { l001: { practice: { runs: [{ ok: 1 }, 5], current: { order: [1] } } } } });
  assert.deepEqual(bad.lessons.l001.practice, { runs: [], current: null });
});

test('isCorrect compara texto; normalize', () => {
  assert.ok(isCorrect({ blocks: ['very', 'very', 'good.'] }, [1, 0, 2]));
  assert.equal(normalize('  A  B '), 'a b');
});

test('progresso por lâmina e próxima lâmina', () => {
  const L = lessons[0].data;
  const s = emptyState();
  const done = slideProgress(s, L.id);
  assert.equal(nextSlide(L, done).n, 1);
  for (const i of L.slides[0].items) done[i.id] = true;
  assert.equal(doneCount(L.slides[0], done), L.slides[0].items.length);
  assert.equal(nextSlide(L, done).n, 2);
  for (const sl of L.slides) for (const i of sl.items) done[i.id] = true;
  assert.equal(nextSlide(L, done), null);
});

test('migração preserva todas as versões anteriores', () => {
  const old = {
    lessons: { l001: { sessions: { s1: { answers: { c1: { ok: true } } } }, blocks: { b1: { answers: { m: { ok: true } }, writes: {}, done: true } },
      v3: { understood: true, build: { e01: true }, speak: {} } } },
    log: [{ ts: 1 }], settings: { voice: 'X' },
  };
  const m = migrateState(old);
  assert.deepEqual(m.lessons.l001.sessions, old.lessons.l001.sessions);
  assert.deepEqual(m.lessons.l001.blocks, old.lessons.l001.blocks);
  assert.deepEqual(m.lessons.l001.v3.build, { e01: true });
  assert.equal(recordCount(m), recordCount(old));
  slideProgress(m, 'l001').s1a = true;
  assert.equal(recordCount(m), recordCount(old) + 1);
  const bad = migrateState({ lessons: { l001: { v4: { done: { s1a: true, s1b: 'x' } } } } });
  assert.deepEqual(bad.lessons.l001.v4.done, { s1a: true });
  assert.deepEqual(migrateState(null).lessons, {});
});

test('backup: aceita exportado e estado puro, recusa outros JSON', () => {
  assert.ok(looksLikeBackup({ app: 'aula-ingles', state: emptyState() }));
  assert.equal(looksLikeBackup({ foo: 1 }), null);
});

test('service worker e core com a mesma versão; todo arquivo do app está no cache', () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const core = readFileSync(new URL('../js/core.js', import.meta.url), 'utf8');
  assert.equal(sw.match(/CACHE_VERSION = '([^']+)'/)[1], core.match(/APP_VERSION = '([^']+)'/)[1]);
  assert.ok(sw.includes('data/v4/lessons.json'));
  for (const dir of ['js', 'css', 'fonts', 'icons']) {
    for (const f of readdirSync(new URL(`../${dir}`, import.meta.url))) assert.ok(sw.includes(`'${dir}/${f}'`), `${dir}/${f} fora do cache`);
  }
});
