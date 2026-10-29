import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import {
  isCorrect, scramble, sentenceOf, normalize, migrateState, emptyState, slideProgress, doneCount, nextSlide,
  recordCount, looksLikeBackup,
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
      assert.ok(s.items.filter(i => i.kind === 'class').length >= 3, `${s.id}: faltam perguntas da aula`);
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
