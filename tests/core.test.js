import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import {
  normalize, tokens, checkItem, checkWrite, detectPhrases, allPhrases, migrateState, emptyState, blockState,
  blockResult, blockFeedback, lessonReport, recordCount, looksLikeBackup, wordCount, scramble,
} from '../js/core.js';

const index = JSON.parse(readFileSync(new URL('../data/v2/lessons.json', import.meta.url)));
const lessons = index.lessons.map(m => ({ meta: m, data: JSON.parse(readFileSync(new URL(`../${m.file}`, import.meta.url))) }));

/* ---------- Conteúdo de cada lição ---------- */

for (const { meta, data: L } of lessons) {
  test(`${meta.id}: índice e arquivo coerentes`, () => {
    assert.equal(L.id, meta.id);
    assert.equal(L.number, meta.number);
    assert.equal(L.date, meta.date);
    assert.ok(L.blocks.length >= 1);
  });

  test(`${meta.id}: cada bloco tem todas as partes`, () => {
    for (const b of L.blocks) {
      for (const k of ['title', 'subtitle', 'topicPt', 'scenarioPt', 'discussTitle']) assert.ok(b[k], `${b.id} sem ${k}`);
      assert.ok(b.scenario.length && b.scenario.every(p => p.en), `${b.id} cenário`);
      assert.ok(b.phrases.length >= 3, `${b.id} phrases`);
      assert.ok(b.questions.length >= 1 && b.questions.every(q => q.en && q.pt && q.model), `${b.id} discuss`);
      assert.ok(b.newSentences.length >= 3 && b.newSentences.every(s => s.en && s.pt), `${b.id} frases novas`);
      assert.ok(b.practice.length >= 3, `${b.id} pratique`);
    }
  });

  test(`${meta.id}: ids únicos`, () => {
    const ids = L.blocks.flatMap(b => b.practice.map(i => i.id));
    assert.equal(new Set(ids).size, ids.length);
    const pids = allPhrases(L).map(p => p.id);
    assert.equal(new Set(pids).size, pids.length);
    assert.equal(new Set(L.blocks.map(b => b.id)).size, L.blocks.length);
  });

  test(`${meta.id}: cada expressão é detectada na própria frase e no exemplo`, () => {
    for (const p of allPhrases(L)) {
      assert.deepEqual(detectPhrases(p.en, [p]), [p.id], `${p.id} frase`);
      assert.deepEqual(detectPhrases(p.example, [p]), [p.id], `${p.id} exemplo`);
    }
  });

  test(`${meta.id}: cada frase nova usa ao menos uma expressão do bloco`, () => {
    for (const b of L.blocks) for (const s of b.newSentences) assert.ok(detectPhrases(s.en, b.phrases).length >= 1, s.en);
  });

  test(`${meta.id}: cada expressão aparece em alguma frase nova`, () => {
    for (const b of L.blocks) for (const p of b.phrases) assert.ok(b.newSentences.some(s => detectPhrases(s.en, [p]).length), `${p.id} sem frase nova`);
  });

  test(`${meta.id}: respostas-exemplo usam ao menos 2 expressões e são curtas`, () => {
    for (const b of L.blocks) for (const q of b.questions) {
      assert.ok(detectPhrases(q.model, allPhrases(L)).length >= 2, `${q.id}`);
      const w = wordCount(q.model);
      assert.ok(w >= 25 && w <= 60, `${q.id}: ${w} palavras`);
    }
  });

  test(`${meta.id}: gabaritos aceitos, erradas recusadas, frases-modelo passam na checagem`, () => {
    for (const b of L.blocks) for (const i of b.practice) {
      if (i.type === 'mc') {
        assert.ok(i.prompt.includes('___'), `${i.id} sem lacuna`);
        assert.equal(new Set(i.options).size, i.options.length);
        i.options.forEach((_, k) => assert.equal(checkItem(i, k), k === i.answer, `${i.id}:${k}`));
      } else if (i.type === 'order') {
        assert.ok(checkItem(i, i.answer));
        assert.ok(!checkItem(i, [...tokens(i.answer)].reverse().join(' ')));
        assert.ok(tokens(i.answer).length >= 5 && tokens(i.answer).length <= 12, `${i.id} tamanho`);
      } else {
        assert.equal(i.type, 'write');
        assert.ok(i.phrases.every(pid => b.phrases.some(p => p.id === pid)), `${i.id} expressão de outro bloco`);
        assert.ok(checkWrite(i, i.model, allPhrases(L)).ok, `${i.id}: modelo não passa`);
      }
    }
  });
}

/* ---------- Correção ---------- */

test('normalize e montagem', () => {
  assert.equal(normalize(' Social media CAN distort your perception of reality. '), 'social media can distort your perception of reality');
  const t = tokens('She felt threatened by her colleague\'s success.');
  const o = scramble(t, () => 0.1);
  assert.notDeepEqual(o, t.map((_, i) => i));
});

test('frase escrita: precisa da expressão pedida e de uma frase completa', () => {
  const L = lessons[0].data;
  const item = L.blocks[0].practice.find(i => i.id === 'b1w1');
  assert.ok(checkWrite(item, 'I never take the news at face value nowadays.', allPhrases(L)).ok);
  assert.ok(!checkWrite(item, 'At face value.', allPhrases(L)).ok, 'curta');
  assert.ok(!checkWrite(item, 'I always believe everything I read online.', allPhrases(L)).used, 'sem expressão');
});

/* ---------- Avaliação e relatório ---------- */

test('resultado do bloco, feedback e relatório', () => {
  const L = lessons[0].data;
  const s = emptyState();
  const b = L.blocks[1];
  const bs = blockState(s, L.id, b.id);
  bs.answers.b2m1 = { ok: false, given: '1' };
  bs.answers.b2m2 = { ok: true, given: '0' };
  bs.answers.b2o1 = { ok: true, given: "Don't lose sight of your own priorities." };
  let r = blockResult(L, b, bs);
  assert.equal(r.complete, false);
  bs.answers.b2o2 = { ok: true, given: 'I prefer to measure success on my own terms.' };
  bs.writes.b2w1 = 'Last year I gave in to social pressure and bought an expensive phone.';
  bs.writes.b2w2 = 'I think people should be happy with themselves.';
  r = blockResult(L, b, bs);
  assert.ok(r.complete);
  assert.equal(r.ok, 3); assert.equal(r.n, 4);
  const f = blockFeedback(r);
  assert.ok(f.focus.some(x => x.includes('based ON')));
  assert.ok(f.focus.some(x => x.includes('faltou a expressão')));
  bs.done = true;
  const rep = lessonReport(L, s);
  assert.match(rep, /BLOCO 2 · Are You Choosing for Yourself\? — 3\/4 certos/);
  assert.match(rep, /respondi: in \| certo: on/);
  assert.match(rep, /Minha frase: Last year I gave in/);
  assert.match(rep, /\(sem a expressão pedida\)/);
  assert.match(rep, /BLOCO 1 .*não concluído/);
});

/* ---------- Estado e backup ---------- */

test('migração preserva dados da versão 1 e valida a versão 2', () => {
  const v1 = { lessons: { l001: { sessions: { s1: { status: 'done', answers: { c1: { ok: true }, c2: { ok: false } } } }, pending: ['c2'], writes: { d2: 'texto' } } }, log: [{ ts: 1 }] };
  const m = migrateState(v1);
  assert.deepEqual(m.lessons.l001.sessions, v1.lessons.l001.sessions);
  assert.deepEqual(m.lessons.l001.writes, { d2: 'texto' });
  assert.equal(recordCount(m), recordCount(v1));
  assert.ok(recordCount(m) >= 4);
  const m2 = migrateState({ lessons: { l001: { blocks: { b1: { answers: { x: { ok: true } }, writes: { w: 'ok', z: 3 }, done: 1 }, bad: 5 } } } });
  assert.deepEqual(m2.lessons.l001.blocks.b1.writes, { w: 'ok' });
  assert.equal(m2.lessons.l001.blocks.b1.done, true);
  assert.ok(!m2.lessons.l001.blocks.bad);
  assert.deepEqual(migrateState(null).lessons, {});
  assert.equal(migrateState({ settings: { rate: 9 } }).settings.rate, 0.95);
});

test('backup: aceita exportado e estado puro, recusa outros JSON', () => {
  const s = emptyState();
  assert.ok(looksLikeBackup({ app: 'aula-ingles', state: s }));
  assert.ok(looksLikeBackup(s));
  assert.equal(looksLikeBackup({ foo: 1 }), null);
});

test('service worker e core com a mesma versão; todo arquivo do app está no cache', () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const core = readFileSync(new URL('../js/core.js', import.meta.url), 'utf8');
  assert.equal(sw.match(/CACHE_VERSION = '([^']+)'/)[1], core.match(/APP_VERSION = '([^']+)'/)[1]);
  for (const dir of ['js', 'css', 'fonts', 'icons']) {
    for (const f of readdirSync(new URL(`../${dir}`, import.meta.url))) assert.ok(sw.includes(`'${dir}/${f}'`), `${dir}/${f} fora do cache`);
  }
});
