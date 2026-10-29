import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import {
  isCorrect, scramble, sentenceOf, normalize, nextIndex, migrateState, emptyState, progress, recordCount, looksLikeBackup,
} from '../js/core.js';

const index = JSON.parse(readFileSync(new URL('../data/v3/lessons.json', import.meta.url)));
const lessons = index.lessons.map(m => ({ meta: m, data: JSON.parse(readFileSync(new URL(`../${m.file}`, import.meta.url))) }));
const words = s => s.trim().split(/\s+/).length;
const PT = /\b(não|você|para|uma|com|está|também|porque|então)\b|[ãõç]/i;

for (const { meta, data: L } of lessons) {
  test(`${meta.id}: índice e arquivo coerentes`, () => {
    assert.equal(L.id, meta.id); assert.equal(L.number, meta.number); assert.equal(L.date, meta.date);
  });

  test(`${meta.id}: Understand curto e em inglês`, () => {
    const u = L.understand;
    assert.ok(u.scenario.length >= 1);
    for (const s of u.scenario) assert.ok(words(s.text) <= 60, `${s.title}: resumo longo (${words(s.text)})`);
    assert.ok(u.expressions.length >= 5 && u.expressions.length <= 10, 'só as expressões mais importantes');
    for (const x of u.expressions) {
      assert.ok(words(x.meaning) <= 18, `${x.en}: explicação longa`);
      assert.ok(x.example);
    }
  });

  test(`${meta.id}: 8 a 10 frases para montar e as perguntas da aula`, () => {
    assert.ok(L.build.length >= 8 && L.build.length <= 10);
    assert.ok(L.speak.length >= 1);
  });

  test(`${meta.id}: blocos válidos (3 a 6, sem repetição, frase completa)`, () => {
    const ids = [...L.build, ...L.speak].map(x => x.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const x of [...L.build, ...L.speak]) {
      assert.ok(x.blocks.length >= 3 && x.blocks.length <= 6, `${x.id}: ${x.blocks.length} blocos`);
      assert.equal(new Set(x.blocks).size, x.blocks.length, `${x.id}: bloco repetido`);
      const s = sentenceOf(x.blocks);
      assert.match(s, /^[A-Z].*[.?!]$/, `${x.id}: frase sem maiúscula ou ponto final`);
      assert.ok(x.explain && words(x.explain) <= 25, `${x.id}: explicação ausente ou longa`);
      const w = words(s);
      assert.ok(w >= 8 && w <= 32, `${x.id}: ${w} palavras`);
      assert.ok(x.prompt || x.question);
    }
  });

  test(`${meta.id}: tudo em inglês (sem tradução para o português)`, () => {
    const text = JSON.stringify({ u: L.understand, b: L.build, s: L.speak });
    assert.ok(!PT.test(text), `trecho em português: ${text.match(PT)}`);
  });

  test(`${meta.id}: ordem certa aceita, embaralhada recusada`, () => {
    for (const x of [...L.build, ...L.speak]) {
      const right = x.blocks.map((_, i) => i);
      assert.ok(isCorrect(x, right));
      assert.ok(!isCorrect(x, [...right].reverse()));
      assert.ok(!isCorrect(x, right.slice(0, -1)), 'incompleta');
      for (let t = 0; t < 20; t++) assert.ok(!isCorrect(x, scramble(x.blocks)), `${x.id}: embaralhou na ordem certa`);
    }
  });
}

test('isCorrect compara texto: blocos iguais podem trocar de lugar', () => {
  const item = { blocks: ['very', 'very', 'good.'] };
  assert.ok(isCorrect(item, [1, 0, 2]));
  assert.ok(normalize('  A  B ') === 'a b');
});

test('nextIndex devolve o primeiro não feito', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  assert.equal(nextIndex(items, {}), 1);
  assert.equal(nextIndex(items, { a: true }), 2);
  assert.equal(nextIndex(items, { a: true, b: true, c: true }), null);
});

test('migração: preserva dados das versões 1 e 2 e valida a 3', () => {
  const old = {
    lessons: { l001: { sessions: { s1: { answers: { c1: { ok: true } } } }, writes: { d2: 'x' }, blocks: { b1: { answers: { m: { ok: true } }, writes: { w: 'y' }, done: true } } } },
    log: [{ ts: 1 }], settings: { rate: 1, voice: 'X' },
  };
  const m = migrateState(old);
  assert.deepEqual(m.lessons.l001.sessions, old.lessons.l001.sessions);
  assert.deepEqual(m.lessons.l001.blocks, old.lessons.l001.blocks);
  assert.equal(m.settings.voice, 'X');
  assert.equal(recordCount(m), recordCount(old));
  const p = progress(m, 'l001');
  assert.deepEqual(p, { understood: false, build: {}, speak: {} });
  p.build.e01 = true; p.understood = true;
  assert.equal(recordCount(m), recordCount(old) + 2);
  const bad = migrateState({ lessons: { l001: { v3: { understood: 'yes', build: { e01: true, e02: 'x' }, speak: 3 } } } });
  assert.deepEqual(bad.lessons.l001.v3, { understood: false, build: { e01: true }, speak: {} });
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
  assert.ok(sw.includes('data/v3/lessons.json'));
  for (const dir of ['js', 'css', 'fonts', 'icons']) {
    for (const f of readdirSync(new URL(`../${dir}`, import.meta.url))) assert.ok(sw.includes(`'${dir}/${f}'`), `${dir}/${f} fora do cache`);
  }
});
