import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import {
  normalize, checkItem, detectPhrases, migrateState, emptyState, lessonState, startSession, flowSteps,
  recordAnswer, evaluate, buildReport, recordCount, nextSessionId, looksLikeBackup, wordCount, RETAKE_MAX,
} from '../js/core.js';

const index = JSON.parse(readFileSync(new URL('../data/lessons.json', import.meta.url)));
const lessons = index.lessons.map(m => ({ meta: m, data: JSON.parse(readFileSync(new URL(`../${m.file}`, import.meta.url))) }));

/* ---------- Conteúdo de cada lição ---------- */

for (const { meta, data: L } of lessons) {
  test(`${meta.id}: índice e arquivo coerentes`, () => {
    assert.equal(L.id, meta.id);
    assert.equal(L.number, meta.number);
    assert.equal(L.date, meta.date);
  });

  test(`${meta.id}: ids únicos e referências válidas`, () => {
    const ids = L.items.map(i => i.id);
    assert.equal(new Set(ids).size, ids.length, 'id de item repetido');
    const pids = L.phrases.map(p => p.id);
    assert.equal(new Set(pids).size, pids.length);
    for (const s of L.sessions) for (const st of s.steps) {
      if (st.kind === 'item') assert.ok(ids.includes(st.ref), `item ${st.ref} inexistente`);
      if (st.kind === 'flash') assert.ok(pids.includes(st.ref));
      if (st.kind === 'write' || st.kind === 'speak') assert.ok(L.questions.some(q => q.id === st.ref), `pergunta ${st.ref}`);
      if (st.kind === 'read' && st.block === 'scenario') assert.ok(L.scenarios.some(x => x.id === st.ref));
      if (st.kind === 'read' && st.block === 'grammar') assert.ok(L.grammar.some(x => x.id === st.ref));
      if (st.kind === 'read' && st.block === 'phrases') assert.ok(L.phrases.some(p => p.slide === st.ref));
    }
  });

  test(`${meta.id}: todo item é usado em alguma etapa e toda pergunta é praticada`, () => {
    const used = new Set(L.sessions.flatMap(s => s.steps.filter(x => x.kind === 'item').map(x => x.ref)));
    for (const i of L.items) assert.ok(used.has(i.id), `item ${i.id} sem etapa`);
    const qs = new Set(L.sessions.flatMap(s => s.steps.filter(x => x.kind === 'write' || x.kind === 'speak').map(x => x.ref)));
    for (const q of L.questions) assert.ok(qs.has(q.id), `pergunta ${q.id} sem prática`);
  });

  test(`${meta.id}: gabaritos aceitos e opções erradas recusadas`, () => {
    for (const i of L.items) {
      assert.ok(i.explain && i.tag, `${i.id} sem explicação/tag`);
      if (i.type === 'mc') {
        assert.ok(i.answer >= 0 && i.answer < i.options.length, i.id);
        assert.equal(new Set(i.options).size, i.options.length, `${i.id}: opções repetidas`);
        assert.ok(checkItem(i, i.answer));
        i.options.forEach((_, k) => { if (k !== i.answer) assert.ok(!checkItem(i, k), `${i.id}: ${k}`); });
      } else {
        for (const a of i.accept) assert.ok(checkItem(i, a), `${i.id} recusa ${a}`);
        assert.ok(checkItem(i, i.model) || i.type === 'gap', `${i.id} modelo`);
        if (i.type === 'fix') assert.ok(!checkItem(i, i.prompt.replace(/\s*\(.*\)\s*$/, '')), `${i.id}: frase errada aceita`);
        if (i.type === 'gap') {
          assert.ok(i.prompt.includes('___'), `${i.id} sem lacuna`);
          const filled = i.prompt.replace('___', i.accept[0]).replace(/\s*\(.*\)\s*$/, '');
          assert.equal(normalize(filled), normalize(i.model), `${i.id}: modelo ≠ lacuna preenchida`);
        }
      }
    }
  });

  test(`${meta.id}: cada expressão é detectada na própria frase e no exemplo`, () => {
    for (const p of L.phrases) {
      assert.deepEqual(detectPhrases(p.en, [p]), [p.id], `${p.id} não detecta a si mesma`);
      assert.deepEqual(detectPhrases(p.example, [p]), [p.id], `${p.id} não detecta o exemplo`);
    }
  });

  test(`${meta.id}: respostas-modelo usam ao menos 2 expressões e têm tamanho B2`, () => {
    for (const q of L.questions) {
      assert.ok(detectPhrases(q.model, L.phrases).length >= 2, `${q.id}: modelo com < 2 expressões`);
      const w = wordCount(q.model);
      assert.ok(w >= 45 && w <= 95, `${q.id}: ${w} palavras`);
    }
  });
}

/* ---------- Correção ---------- */

test('normalize: caixa, pontuação, apóstrofos e contrações', () => {
  assert.equal(normalize('  She made her decision BASED on appearances. '), 'she made her decision based on appearances');
  assert.equal(normalize('I’m sure'), normalize("I am sure"));
  assert.equal(normalize("What might've"), "what might've");
});

test('detectPhrases encontra flexões', () => {
  const L = lessons[0].data;
  const found = detectPhrases('She gave in to social pressure and lost sight of her goals, measuring success on her own terms.', L.phrases);
  assert.ok(found.includes('p10') && found.includes('p07') && found.includes('p12'));
  assert.deepEqual(detectPhrases('Nothing here.', L.phrases), []);
});

/* ---------- Fluxo de sessão, retomada e avaliação ---------- */

test('erro vira pendência, entra na retomada da etapa seguinte e sai ao acertar', () => {
  const L = lessons[0].data;
  const s = emptyState();
  const ls = lessonState(s, L.id);
  const [s1, s2] = L.sessions;
  const r1 = startSession(L, ls, s1);
  assert.equal(r1.retake.length, 0);
  const c1 = L.items.find(i => i.id === 'c1');
  recordAnswer(ls, r1, c1, { given: 2, ok: false });
  assert.deepEqual(ls.pending, ['c1']);
  r1.status = 'done';
  const r2 = startSession(L, ls, s2);
  assert.deepEqual(r2.retake, ['c1']);
  const steps = flowSteps(s2, r2);
  assert.equal(steps[0].retake, true);
  recordAnswer(ls, r2, c1, { given: c1.answer, ok: true, retake: true });
  assert.deepEqual(ls.pending, []);
  assert.ok(r2.answers['retake:c1'].ok);
});

test(`retomada limitada a ${RETAKE_MAX} itens e sem itens da própria etapa`, () => {
  const L = lessons[0].data;
  const s = emptyState();
  const ls = lessonState(s, L.id);
  ls.pending = L.items.map(i => i.id);
  const def = L.sessions[1];
  const r = startSession(L, ls, def);
  const own = new Set(def.steps.filter(x => x.kind === 'item').map(x => x.ref));
  assert.equal(r.retake.length, RETAKE_MAX);
  assert.ok(r.retake.every(id => !own.has(id)));
});

test('avaliação separa pontos fortes, fracos e foco; relatório traz erros e escrita', () => {
  const L = lessons[0].data;
  const s = emptyState();
  const ls = lessonState(s, L.id);
  const def = L.sessions[1];
  const r = startSession(L, ls, def);
  for (const id of ['m1', 'm2', 'm3', 'm4', 'm5']) { const it = L.items.find(i => i.id === id); recordAnswer(ls, r, it, { given: 1, ok: false }); }
  for (const id of ['m6', 'm7', 'm8', 'm9']) { const it = L.items.find(i => i.id === id); recordAnswer(ls, r, it, { given: 0, ok: true }); }
  r.status = 'done'; r.finishedAt = Date.now();
  const ev = evaluate(L, ls, def, r);
  assert.equal(ev.n, 9); assert.equal(ev.ok, 4);
  assert.ok(ev.bad.some(x => x.startsWith('Preposições')));
  assert.ok(ev.good.some(x => x.startsWith('-ING ou TO')));
  assert.ok(ev.focus.some(x => x.includes('preposição')));
  const rep = buildReport(L, ls, def, r, ev);
  assert.match(rep, /ERROS:/);
  assert.match(rep, /based ___ appearances/);
  assert.match(rep, /respondi: in · certo: on|respondi: in \| certo: on/);
});

test('etapa de escrita: relatório leva o texto para correção no chat', () => {
  const L = lessons[0].data;
  const s = emptyState();
  const ls = lessonState(s, L.id);
  const def = L.sessions[2];
  const r = startSession(L, ls, def);
  ls.writes.d2 = 'I think it depends. Keeping things private is fine, but if you create a false impression to sell products, that is dishonest.';
  r.speak.d1 = 'stuck';
  r.status = 'done'; r.finishedAt = Date.now();
  const ev = evaluate(L, ls, def, r);
  assert.ok(ev.bad.some(x => x.startsWith('Escrita (d2)')), 'só 1 expressão → ponto fraco');
  assert.ok(ev.bad.some(x => x.startsWith('Fala')));
  const rep = buildReport(L, ls, def, r, ev);
  assert.match(rep, /RESPOSTAS ESCRITAS/);
  assert.match(rep, /false impression to sell/);
  assert.match(rep, /d1 Travei/);
});

test('flashcards contam como lembrança e listam o que não veio', () => {
  const L = lessons[0].data;
  const s = emptyState();
  const ls = lessonState(s, L.id);
  const def = L.sessions[3];
  const r = startSession(L, ls, def);
  r.flash.p01 = true; r.flash.p02 = false;
  const ev = evaluate(L, ls, def, r);
  assert.equal(ev.byTag['Lembrança das expressões'].n, 2);
  assert.deepEqual(ev.forgot.map(p => p.id), ['p02']);
});

test('próxima etapa: em andamento primeiro, depois a primeira nova', () => {
  const L = lessons[0].data;
  const s = emptyState();
  const ls = lessonState(s, L.id);
  assert.equal(nextSessionId(L, ls), 's1');
  startSession(L, ls, L.sessions[0]).status = 'done';
  assert.equal(nextSessionId(L, ls), 's2');
  startSession(L, ls, L.sessions[2]);
  assert.equal(nextSessionId(L, ls), 's3');
});

/* ---------- Estado e backup ---------- */

test('migrateState tolera lixo e preserva dados válidos', () => {
  assert.deepEqual(Object.keys(migrateState(null).lessons), []);
  assert.deepEqual(migrateState('x').log, []);
  const m = migrateState({ lessons: { l001: { pending: ['a', 'a', 3], writes: { d1: 'hi', d2: 5 }, sessions: { s1: { status: 'done', answers: { c1: { ok: true } } }, bad: 4 } } }, settings: { rate: 9 } });
  assert.deepEqual(m.lessons.l001.pending, ['a']);
  assert.deepEqual(m.lessons.l001.writes, { d1: 'hi' });
  assert.equal(m.lessons.l001.sessions.s1.status, 'done');
  assert.ok(!m.lessons.l001.sessions.bad);
  assert.equal(m.settings.rate, 0.95);
});

test('recordCount cresce com respostas, textos e histórico', () => {
  const L = lessons[0].data;
  const s = emptyState();
  const ls = lessonState(s, L.id);
  const r = startSession(L, ls, L.sessions[0]);
  assert.equal(recordCount(s), 0);
  recordAnswer(ls, r, L.items[0], { given: 0, ok: true });
  ls.writes.d1 = 'x';
  s.log.push({});
  assert.equal(recordCount(s), 3);
});

test('backup: aceita exportado e estado puro, recusa outros JSON', () => {
  const s = emptyState();
  assert.ok(looksLikeBackup({ app: 'aula-ingles', state: s }));
  assert.ok(looksLikeBackup(s));
  assert.equal(looksLikeBackup({ foo: 1 }), null);
  assert.equal(looksLikeBackup([1, 2]), null);
});

test('service worker e core com a mesma versão; todo arquivo do app está no cache', () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const core = readFileSync(new URL('../js/core.js', import.meta.url), 'utf8');
  const v1 = sw.match(/CACHE_VERSION = '([^']+)'/)[1];
  const v2 = core.match(/APP_VERSION = '([^']+)'/)[1];
  assert.equal(v1, v2);
  for (const dir of ['js', 'css', 'fonts', 'icons']) {
    for (const f of readdirSync(new URL(`../${dir}`, import.meta.url))) assert.ok(sw.includes(`'${dir}/${f}'`), `${dir}/${f} fora do cache`);
  }
});
