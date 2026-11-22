"""Lição 6 · 20/11/2026 · Error Correction + Homework (prints do app da professora, sem lâminas)
Gera data/v4/l006.json e atualiza data/v4/lessons.json. Rode: python3 tools/build_l006_v4.py

Formato novo dela: lista dos erros dele na aula + correções explicadas (1–8) + Homework (Exercise 1: 10 de múltipla
escolha; Exercise 2: corrigir frases). Organizado em 4 telas por tema; um exercício por regra/expressão de cada tela.
Os 15 exercícios dela levam source "teacher". Gabarito: correções dela; onde ela não corrigiu, criado aqui.
O print do Exercise 2 termina no item 5 (pode haver mais itens).
"""
import json, pathlib

def X(en, meaning):
    return {"en": en, "meaning": meaning}

def G(*pairs):
    return [{"en": e, "pt": t} for e, t in pairs]

def W(id, question, blocks, explain, hl, gloss):
    return {"id": id, "kind": "warm-up", "question": question, "blocks": blocks, "explain": explain, "hl": hl, "gloss": gloss}

EX1 = "Exercise 1 – Choose the correct answer"
EX_TITLES = {1: {1: EX1}, 2: {1: EX1}, 3: {1: EX1}, 4: {1: "Exercise 2 – Correct the mistakes"}}

SLIDES = [
  {"id": "c1", "n": 1, "title": "1. The right preposition", "question": "Which preposition goes with this word?",
   "summary": "Many of your mistakes were prepositions: important to me (not with me), unhappy with something, related to (not related with), open up to someone (not with), a need for money (not about) and besides (no to after it).",
   "expressions": [X("important to someone", "it matters to that person: important to me."),
                   X("unhappy with someone/something", "not satisfied with a person or a situation."),
                   X("related to something", "connected to something. Not \"related with\"."),
                   X("open up to someone", "talk honestly about your feelings to someone."),
                   X("a need for something", "a situation where something is necessary."),
                   X("besides / apart from", "in addition to. No \"to\" after besides.")],
   "items": [
     W("c1a", "Say what matters to you.", ["Texting everyone here", "isn't very important to me,", "but calling my family is."],
       "important TO someone expresses an opinion or feeling.", ["important to me"],
       G(("important to someone", "importante para alguém"))),
     W("c1b", "Describe someone who is not satisfied.", ["He is unhappy with", "the situation at work", "and wants to change jobs."],
       "be + unhappy + WITH. Unhappy is an adjective, so it needs the verb be.", ["unhappy with"],
       G(("unhappy with", "insatisfeito com"))),
     W("c1c", "Explain what an argument was about.", ["Our argument was related to", "a simple misunderstanding", "about the weekend."],
       "related TO something.", ["related to"],
       G(("related to", "relacionado a"))),
     W("c1d", "Talk about an honest conversation at work.", ["Last week,", "I finally opened up to my boss", "about my workload."],
       "open up TO someone ABOUT something.", ["opened up to"],
       G(("open up to someone", "abrir-se com alguém"))),
     W("c1e", "Add one more thing.", ["Besides English,", "I would like to learn", "Spanish one day."],
       "Besides = in addition to. No \"to\" after it.", ["Besides"],
       G(("besides", "além de")))]},
  {"id": "c2", "n": 2, "title": "2. Verb patterns", "question": "What form comes after this verb?",
   "summary": "Some verbs decide the form of the next verb: avoid + -ing (avoid bothering), need to + base verb (need to patch things up, not patching), agree to + base verb, and it depends on (not I depends on).",
   "expressions": [X("avoid + -ing", "after avoid, use the -ing form: avoid bothering."),
                   X("need to + base verb", "need to patch, need to improve. No -ing."),
                   X("it depends on", "third person: it depends, always followed by on."),
                   X("agree to + base verb", "agree to help. Not \"agree for helping\".")],
   "items": [
     W("c2a", "Talk about being considerate at work.", ["I try to avoid bothering people", "when they are busy", "at work."],
       "avoid + -ing.", ["avoid bothering"],
       G(("avoid + -ing", "evitar fazer algo"))),
     W("c2b", "Talk about making peace.", ["After the misunderstanding,", "we need to patch things up", "this weekend."],
       "need to + base verb (patch).", ["need to patch things up"],
       G(("patch things up", "fazer as pazes"))),
     W("c2c", "Say you can't answer yet.", ["I can't give you an answer now", "because it depends on", "the situation."],
       "it depends ON (with -s).", ["depends on"],
       G(("depend on", "depender de"))),
     W("c2d", "Talk about help from a colleague.", ["She reluctantly agreed to help me", "with the presentation", "on Friday."],
       "agree to + base verb.", ["agreed to help"],
       G(("agree to do something", "concordar em fazer algo"), ("reluctantly", "a contragosto")))]},
  {"id": "c3", "n": 3, "title": "3. Word forms and sentence structure", "question": "Is the sentence built correctly?",
   "summary": "Small structure mistakes: there are with plural nouns (not there is a children), no extra it after the subject (Loyalty is, not Loyalty it's), the adverb frequently (not frequency), the noun disagreement, and the time at the end of the sentence.",
   "expressions": [X("There are + plural noun", "there is for one thing, there are for many."),
                   X("Loyalty is… (no extra it)", "don't add it after the subject."),
                   X("frequently (adverb)", "describes a verb: communicate more frequently."),
                   X("a disagreement (noun)", "after a / small we need a noun."),
                   X("time at the end", "We had a small disagreement this week.")],
   "items": [
     W("c3a", "Describe a busy house.", ["There are three children", "in the house,", "so it's never quiet."],
       "There are + plural noun (children).", ["There are"],
       G(("there are", "há, existem (plural)"))),
     W("c3b", "Say what matters most in a friendship.", ["Loyalty is", "the most important thing", "in a friendship."],
       "The subject is loyalty: no \"it\" after it. Uncountable → is.", ["Loyalty is"],
       G(("Loyalty is… (not Loyalty it's)", "a lealdade é… sem repetir o sujeito"))),
     W("c3c", "Suggest better communication.", ["We should communicate", "more frequently", "with our family."],
       "frequently = adverb (how often).", ["more frequently"],
       G(("frequently", "com frequência"))),
     W("c3d", "Talk about a small problem this week.", ["We had a small disagreement", "this week,", "but we talked about it."],
       "Subject + verb + object, then the time.", ["small disagreement"],
       G(("disagreement", "desentendimento")))]},
  {"id": "c4", "n": 4, "title": "4. Correct the mistakes", "question": "Can you fix each sentence without looking?",
   "summary": "Your teacher's Exercise 2: rewrite each sentence correctly. Each one has at least one mistake from the points above: need to + base verb, agree to, there are, open up to and patch things up.",
   "expressions": [X("need to improve", "need to + base verb, not need to improving."),
                   X("agree to help", "agree to + base verb, not agree for helping."),
                   X("There are three children", "plural noun → there are."),
                   X("open up to someone about something", "open up TO a person."),
                   X("need to patch things up", "need TO + base verb.")],
   "items": [
     W("c4a", "Talk about your team.", ["I need to improve", "my relationship", "with my colleagues."],
       "need to + base verb.", ["need to improve"],
       G(("improve", "melhorar"))),
     W("c4b", "Talk about a manager's support.", ["My manager agreed to help me", "with the new project", "next month."],
       "agree to + base verb.", ["agreed to help"],
       G(("agree to do something", "concordar em fazer algo"))),
     W("c4c", "Describe the garden.", ["There are several children", "playing in the garden", "right now."],
       "There are + plural noun.", ["There are"],
       G(("there are", "há, existem (plural)")))]},
]

def base(id, t, slide, expr, hl, explain, source, ex):
    return {"id": id, "type": t, "skill": SLIDES[slide - 1]["title"].split(". ", 1)[1], "slide": slide, "source": source,
            "ex": ex if source == "teacher" else None, "expr": expr, "hl": hl, "explain": explain, "tip": ""}

def mc(id, slide, expr, hl, prompt, options, answer, explain, source="teacher", ex=1):
    return base(id, "mc", slide, expr, hl, explain, source, ex) | {"prompt": prompt, "options": options, "answer": answer}

def gap(id, slide, expr, hl, prompt, accept, explain, source="extra", ex=None):
    return base(id, "gap", slide, expr, hl, explain, source, ex) | {"prompt": prompt, "accept": accept}

def fix(id, slide, expr, hl, wrong, accept, explain, source="extra", ex=None):
    return base(id, "fix", slide, expr, hl, explain, source, ex) | {"prompt": wrong, "accept": accept}

def order(id, slide, expr, hl, prompt, blocks, explain):
    return base(id, "order", slide, expr, hl, explain, "extra", None) | {"prompt": prompt, "blocks": blocks}

PRACTICE = [
  # Tela 1 · preposições (4 dela + 2 minhas)
  mc("h1-2", 1, "important to someone", ["important to"], "Loyalty is very important ___ me.", ["with", "for", "to"], 2,
     "important TO someone, when you give an opinion or a feeling."),
  mc("h1-8", 1, "unhappy with someone/something", ["unhappy with"], "He is unhappy ___ his situation.", ["to", "with", "about of"], 1,
     "unhappy WITH someone or something."),
  mc("h1-7", 1, "related to something", ["related to"], "Their argument was related ___ money.", ["with", "to", "about"], 1,
     "related TO something. \"Related with\" is a common mistake."),
  mc("h1-4", 1, "open up to someone", ["opened up to"], "She opened up ___ her manager.", ["to", "with", "at"], 0,
     "open up TO someone."),
  gap("x1a", 1, "a need for something", ["need for"], "There is a need ___ more money in the project.", ["for"],
      "a need FOR something. Not \"a need about\"."),
  fix("x1b", 1, "besides / apart from", ["Besides"], "Beside to my job, I also study English at night.",
      ["Besides my job, I also study English at night.", "Apart from my job, I also study English at night."],
      "Besides (with -s), and no \"to\" after it."),
  # Tela 2 · padrões de verbo (3 dela + 1 minha)
  mc("h1-1", 2, "avoid + -ing", ["avoid bothering"], "I avoid ___ people when they are busy.", ["to bother", "bothering", "bother"], 1,
     "After avoid, use the -ing form."),
  mc("h1-3", 2, "need to + base verb", ["need to patch"], "We need to ___ things up.", ["patching", "patched", "patch"], 2,
     "need to + base verb: need to patch things up."),
  mc("h1-9", 2, "it depends on", ["depends on"], "It ___ on the situation.", ["depend", "depends", "depending"], 1,
     "it → depends (with -s). Your sentence \"I depends on\" mixed I with the -s form."),
  order("x2a", 2, "agree to + base verb", ["agreed to talk"], "Build the sentence: after the argument.",
        ["He finally agreed", "to talk", "about the problem."], "agree to + base verb."),
  # Tela 3 · forma e estrutura (3 dela + 2 minhas)
  mc("h1-5", 3, "There are + plural noun", ["There are"], "There ___ several children in the garden.", ["is", "are", "was"], 1,
     "Children is plural → there are."),
  mc("h1-6", 3, "frequently (adverb)", ["frequently"], "We communicate more ___ now.", ["frequency", "frequent", "frequently"], 2,
     "We need an adverb to describe the verb communicate: frequently."),
  mc("h1-10", 3, "a disagreement (noun)", ["disagreement"], "We had a small ___ last week.", ["disagreement", "disagree", "disagreeing"], 0,
     "After \"a small\" we need a noun: disagreement."),
  fix("x3a", 3, "Loyalty is… (no extra it)", ["Loyalty is"], "Loyalty it's the most important thing to me.",
      ["Loyalty is the most important thing to me.", "Loyalty is the most important thing for me."],
      "Don't add \"it\" after the subject loyalty."),
  fix("x3b", 3, "time at the end", ["this week"], "We had this week a small disagreement.",
      ["We had a small disagreement this week.", "This week we had a small disagreement.", "This week, we had a small disagreement."],
      "Subject + verb + object, then the time: …a small disagreement this week."),
  # Tela 4 · Exercise 2 dela (5)
  fix("h2-1", 4, "need to improve", ["need to improve"], "I need to improving my relationship with my colleagues.",
      ["I need to improve my relationship with my colleagues."], "need to + base verb: improve.", source="teacher", ex=1),
  fix("h2-2", 4, "agree to help", ["agreed to help"], "She reluctantly agreed for helping me.",
      ["She reluctantly agreed to help me."], "agree to + base verb: agreed to help.", source="teacher", ex=1),
  fix("h2-3", 4, "There are three children", ["There are"], "There is three children in the house.",
      ["There are three children in the house."], "Three children = plural → there are.", source="teacher", ex=1),
  fix("h2-4", 4, "open up to someone about something", ["opened up to"], "I opened up with my husband about my problems.",
      ["I opened up to my husband about my problems."], "open up TO someone.", source="teacher", ex=1),
  fix("h2-5", 4, "need to patch things up", ["need to patch things up"], "We need patching things up after the disagreement.",
      ["We need to patch things up after the disagreement."], "need TO + base verb: need to patch things up.", source="teacher", ex=1),
]

LESSON = {
  "id": "l006", "number": 6, "date": "2026-11-20", "format": 4,
  "title": "Error Correction",
  "subtitle": "Your mistakes from the 20 November class, plus the homework",
  "level": "B1–B2 Grammar",
  "source": "Class notes and homework, 20 Nov (screenshots)",
  "exercises": EX_TITLES,
  "slides": SLIDES,
  "practice": PRACTICE,
}

root = pathlib.Path(__file__).resolve().parent.parent / "data" / "v4"
(root / f"{LESSON['id']}.json").write_text(json.dumps(LESSON, ensure_ascii=False, indent=1), encoding="utf-8")
idx_path = root / "lessons.json"
idx = json.loads(idx_path.read_text())
meta = {k: LESSON[k] for k in ("id", "number", "date", "title", "subtitle")} | {"file": f"data/v4/{LESSON['id']}.json"}
idx["lessons"] = [l for l in idx["lessons"] if l["id"] != LESSON["id"]] + [meta]
idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=1), encoding="utf-8")
print("ok", len(SLIDES), "telas ·", sum(len(s["items"]) for s in SLIDES), "frases ·", len(PRACTICE), "exercícios (",
      sum(p["source"] == "teacher" for p in PRACTICE), "dela )")
