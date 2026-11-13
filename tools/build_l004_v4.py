"""Lição 4 · 13/11/2026 · The Last 24 Hours on Earth (PDF da professora, 6 lâminas de conversa)
Gera data/v4/l004.json e atualiza data/v4/lessons.json. Rode: python3 tools/build_l004_v4.py

Cada lâmina: título e pergunta dela, cenário resumido, Language Toolkit dela (com explicação breve) e
as perguntas dela (kind "class", ex 1) com resposta-modelo minha em blocos. Lâmina 1 tem uma pergunta só:
completada com 2 de aquecimento sobre o cenário.
Ela não mandou exercícios objetivos: o Practice é todo meu (source "extra"), sobre o toolkit e o 2nd conditional.
"""
import json, pathlib

def X(en, meaning):
    return {"en": en, "meaning": meaning}

def Q(id, question, blocks, explain):
    return {"id": id, "kind": "class", "ex": 1, "question": question, "blocks": blocks, "explain": explain}

def W(id, question, blocks, explain):
    return {"id": id, "kind": "warm-up", "question": question, "blocks": blocks, "explain": explain}

SLIDES = [
  {"id": "s1", "n": 1, "title": "The Last 24 Hours on Earth",
   "question": "If you knew you had only 24 hours left, what would you do first?",
   "summary": "Breaking news: scientists have confirmed that a massive asteroid will hit Earth in exactly 24 hours, and there is no known way to stop it. One day, one planet, no second chances. The question uses the second conditional: If you knew…, what would you do?",
   "expressions": [X("If I knew…, I would…", "an imaginary situation now (second conditional)."),
                   X("The first thing I'd do is…", "a clear way to start your answer."),
                   X("I'd rather… than…", "to say what you prefer."),
                   X("No second chances", "you can't try again.")],
   "items": [W("s1a", "What have scientists confirmed?", ["Scientists have confirmed that", "a massive asteroid", "will hit Earth", "in exactly 24 hours."],
               "Present perfect (have confirmed) for recent news."),
             W("s1b", "Can anyone stop the asteroid?", ["No, there is", "no known way", "to stop it."],
               "\"There is no known way to…\" = nobody knows how to…"),
             Q("s1c", "If you knew you had only 24 hours left, what would you do first?",
               ["If I knew", "I had only 24 hours left,", "I would call my family", "and tell them I love them."],
               "If + past (knew, had), then would + verb.")]},
  {"id": "s2", "n": 2, "title": "The First Decision", "question": "24 hours left. What really matters now?",
   "summary": "With only 24 hours left, you have to decide what really matters. The slide asks about three things: the people you would spend the day with, something you've been putting off, and what you would leave behind or hold on to.",
   "expressions": [X("reach out to someone", "contact someone, often to reconnect or offer support."),
                   X("put something off", "delay doing something."),
                   X("make the most of something", "use something as well as possible."),
                   X("hold on to something", "keep something; not let it go."),
                   X("come to terms with something", "slowly accept a difficult situation."),
                   X("leave something behind", "leave it when you go; what remains after you.")],
   "items": [Q("s2a", "If you could spend your final day with only three people, who would you choose and why?",
               ["I would choose", "my wife, my mother and my best friend,", "and make the most of", "every minute with them."],
               "make the most OF + noun."),
             Q("s2b", "Is there anything you've been putting off that you would finally do?",
               ["Yes, I've been putting off", "a difficult conversation", "with an old friend,", "so I would finally reach out to him."],
               "put off + noun (have been putting off); reach out TO someone."),
             Q("s2c", "What would you leave behind, and what would you want to hold on to?",
               ["I would leave behind", "my worries about work", "and hold on to", "my best memories with my family."],
               "leave behind / hold on to + noun.")]},
  {"id": "s3", "n": 3, "title": "Your Time Is Limited. Your Choices Matter.",
   "question": "You can only choose three experiences from the six options.",
   "summary": "You have 24 hours left, but you cannot do everything. Choose three of six experiences: A Family, B Adventure (a place you've always dreamed of seeing), C Reconciliation (someone you've lost touch with), D Helping others, E A dream, F Solitude.",
   "expressions": [X("weigh up", "compare the advantages and disadvantages before deciding."),
                   X("rule out", "decide that something is not an option."),
                   X("give up", "stop having or doing something."),
                   X("go ahead with", "decide to do something you planned."),
                   X("make a sacrifice", "give up something important for something else."),
                   X("a once-in-a-lifetime opportunity", "a chance you will probably never have again.")],
   "items": [Q("s3a", "Which three experiences would you choose, and why?",
               ["I would choose", "family, reconciliation and helping others,", "because people matter more to me", "than places."],
               "\"matter more to me than…\" compares what is important."),
             Q("s3b", "Which option would be the hardest to give up?",
               ["The hardest to give up", "would be adventure,", "because seeing Paris is", "a once-in-a-lifetime opportunity."],
               "give up + noun; gerund as subject: seeing Paris is…"),
             Q("s3c", "Would your choices reveal who you really are, or simply what you value most at this moment?",
               ["I think they would reveal", "what I value most right now,", "but after weighing everything up,", "they also show who I am."],
               "weigh up is separable: weigh everything up.")]},
  {"id": "s4", "n": 4, "title": "Wait… There's a Chance!", "question": "The world is holding its breath.",
   "summary": "Breaking news: scientists have discovered a 5% chance that the asteroid will miss Earth completely. However, nobody can confirm what will happen, and the impact is still expected in 24 hours. The world is holding its breath.",
   "expressions": [X("rule out", "say something is impossible: We can't rule out a miracle."),
                   X("hold on to hope", "keep hoping."),
                   X("brace yourself for", "prepare yourself for something bad."),
                   X("against all odds", "even though it seemed very unlikely."),
                   X("a slim chance", "a very small chance."),
                   X("uncertainty", "not knowing what will happen.")],
   "items": [Q("s4a", "Would you change your plans now, or stick to your original decisions?",
               ["I would stick to", "my original decisions,", "because a 5% chance", "is still a slim chance."],
               "stick TO your decisions = not change them."),
             Q("s4b", "Is it better to prepare for the worst or hold on to hope?",
               ["I think it's better to", "brace yourself for the worst", "but still hold on to hope."],
               "brace yourself FOR; hold on TO."),
             Q("s4c", "Would people become more selfish or more generous in this situation?",
               ["I believe most people", "would become more generous,", "although some would panic", "and think only of themselves."],
               "\"although\" introduces the contrast.")]},
  {"id": "s5", "n": 5, "title": "The Final Phone Call", "question": "Some things are too important to leave unsaid.",
   "summary": "Imagine you can make one final phone call. Who would you call, what would you finally say, and what if they didn't answer or reacted differently from what you expected? Some things are too important to leave unsaid.",
   "expressions": [X("get something off your chest", "finally say something that has been worrying you."),
                   X("make amends", "do something to correct a past mistake."),
                   X("take someone for granted", "not value someone because they are always there."),
                   X("mean the world to someone", "be extremely important to someone."),
                   X("words fail me", "I can't find the words to express this."),
                   X("say what needs to be said", "say the important thing, even if it's difficult.")],
   "items": [Q("s5a", "Who would you call, and why have you waited so long to have this conversation?",
               ["I would call my father,", "because I have taken him for granted", "and never found", "the right moment."],
               "take someone FOR GRANTED (past participle: taken)."),
             Q("s5b", "What would you finally tell this person that you've never had the courage to say?",
               ["I would tell him", "that he means the world to me", "and finally get it", "off my chest."],
               "mean the world TO someone; get something off your chest."),
             Q("s5c", "What if they didn't answer, or their reaction wasn't what you expected?",
               ["If he didn't answer,", "I would leave a message", "and still say", "what needs to be said."],
               "Second conditional: If he didn't…, I would…")]},
  {"id": "s6", "n": 6, "title": "The Last Broadcast", "question": "Your final message to the world. Speak for 2 minutes.",
   "summary": "You have two minutes on a live broadcast to send a final message to the world. Talk about a lesson for humanity, one thing you would change if you could start again, and a message that should never be forgotten.",
   "expressions": [X("in the end", "finally; after everything."),
                   X("what really matters", "the most important thing."),
                   X("leave a legacy", "leave something good for the people after you."),
                   X("make a difference", "have a positive effect on someone or something.")],
   "items": [Q("s6a", "A lesson for humanity: What should people learn from our existence?",
               ["In the end,", "what really matters", "is how we treat", "each other."],
               "\"What really matters is…\" introduces your main idea."),
             Q("s6b", "One thing I'd change: What would you do differently if you could start again?",
               ["If I could start again,", "I would worry less about work", "and spend more time", "with the people I love."],
               "If I could…, I would… + comparatives (less, more)."),
             Q("s6c", "A message that matters: What should never be forgotten?",
               ["We should never forget", "that small actions", "can make a difference", "and leave a legacy."],
               "make a difference / leave a legacy.")]},
]

# Expressões a destacar em azul nas respostas (regra: toolkit / phrasal verbs / estrutura-chave da lâmina).
HL = {
  "s1c": ["If I knew", "I would"],
  "s2a": ["make the most of"], "s2b": ["putting off", "reach out to"], "s2c": ["leave behind", "hold on to"],
  "s3b": ["give up", "a once-in-a-lifetime opportunity"], "s3c": ["weighing everything up"],
  "s4a": ["a slim chance"], "s4b": ["brace yourself for", "hold on to"],
  "s5a": ["taken him for granted"], "s5b": ["means the world to me", "get it off my chest"], "s5c": ["what needs to be said"],
  "s6a": ["In the end", "what really matters"], "s6c": ["make a difference", "leave a legacy"],
}
# Explicação abaixo da frase: forma base em inglês = significado em português (regra de 13/11/2026).
G = lambda *pairs: [{"en": e, "pt": t} for e, t in pairs]
GLOSS = {
  "s1c": G(("If I knew…, I would…", "se eu soubesse…, eu… (situação imaginária)")),
  "s2a": G(("make the most of", "aproveitar ao máximo")),
  "s2b": G(("put off", "adiar"), ("reach out to", "procurar, entrar em contato com")),
  "s2c": G(("leave behind", "deixar para trás"), ("hold on to", "manter, não largar")),
  "s3b": G(("give up", "abrir mão de, desistir de"), ("a once-in-a-lifetime opportunity", "uma oportunidade única na vida")),
  "s3c": G(("weigh up", "pesar os prós e contras")),
  "s4a": G(("a slim chance", "uma chance mínima")),
  "s4b": G(("brace yourself for", "preparar-se para (algo ruim)"), ("hold on to hope", "manter a esperança")),
  "s5a": G(("take someone for granted", "não dar o devido valor a alguém")),
  "s5b": G(("mean the world to someone", "significar tudo para alguém"), ("get something off your chest", "desabafar")),
  "s5c": G(("say what needs to be said", "dizer o que precisa ser dito")),
  "s6a": G(("in the end", "no fim das contas"), ("what really matters", "o que realmente importa")),
  "s6c": G(("make a difference", "fazer a diferença"), ("leave a legacy", "deixar um legado")),
}
for _s in SLIDES:
    for _i in _s["items"]:
        if _i["id"] in HL: _i["hl"] = HL[_i["id"]]
        if _i["id"] in GLOSS: _i["gloss"] = GLOSS[_i["id"]]

EX_TITLES = {s["n"]: {1: "Discussion questions"} for s in SLIDES}

def mc(id, skill, slide, prompt, options, answer, explain, tip=""):
    return {"id": id, "type": "mc", "skill": skill, "slide": slide, "source": "extra", "ex": None,
            "prompt": prompt, "options": options, "answer": answer, "explain": explain, "tip": tip}

def gap(id, skill, slide, prompt, accept, explain, tip=""):
    return {"id": id, "type": "gap", "skill": skill, "slide": slide, "source": "extra", "ex": None,
            "prompt": prompt, "accept": accept, "explain": explain, "tip": tip}

def fix(id, skill, slide, wrong, accept, explain, tip=""):
    return {"id": id, "type": "fix", "skill": skill, "slide": slide, "source": "extra", "ex": None,
            "prompt": wrong, "accept": accept, "explain": explain, "tip": tip}

def order(id, skill, slide, prompt, blocks, explain, tip=""):
    return {"id": id, "type": "order", "skill": skill, "slide": slide, "source": "extra", "ex": None,
            "prompt": prompt, "blocks": blocks, "explain": explain, "tip": tip}

PV, EXP, COND, PREP = "Phrasal verbs", "Expressions", "Second conditional", "Prepositions"

PRACTICE = [
  mc("p01", PV, 2, "I've been ___ calling my old friend for months.", ["putting off", "putting on", "putting up", "putting out"], 0,
     "put off = delay. After \"been\" we use -ING: putting off.", "\"I keep putting off my tax return.\""),
  gap("p02", PREP, 2, "Let's make the most ___ the time we have.", ["of"], "make the most OF something."),
  gap("p03", PREP, 2, "She finally came to terms ___ the news.", ["with"], "come to terms WITH something."),
  fix("p04", PV, 2, "I would reach to my brother and say sorry.", ["I would reach out to my brother and say sorry."],
      "The phrasal verb is reach OUT TO someone.", "\"Feel free to reach out to me if you have questions.\" (common in emails)"),
  mc("p05", PV, 3, "After weighing ___ all the options, I chose family.", ["up", "on", "out", "in"], 0, "weigh up the options."),
  order("p06", PV, 3, "Build the sentence: a hard choice.", ["After weighing up", "all the options,", "I would go ahead with", "my original plan."],
        "weigh up = compare; go ahead with = do what you planned.", "Useful in meetings: \"Let's go ahead with option B.\""),
  mc("p07", EXP, 4, "There's only a ___ chance that the asteroid will miss Earth.", ["slim", "heavy", "tall", "wide"], 0,
     "a slim chance = a very small chance."),
  gap("p08", PREP, 4, "Brace yourself ___ bad news.", ["for"], "brace yourself FOR something."),
  mc("p09", EXP, 4, "Against all ___, the asteroid missed Earth.", ["odds", "chances", "risks", "hopes"], 0,
     "against all odds = although it was very unlikely."),
  mc("p10", PV, 4, "We can't ___ the possibility that it will miss.", ["rule out", "give up", "hold on", "leave behind"], 0,
     "rule out = say something is impossible."),
  fix("p11", EXP, 5, "I took my parents for grant for years.", ["I took my parents for granted for years."],
      "The expression is take someone for granted.", "\"Don't take your health for granted.\""),
  fix("p12", PREP, 5, "She means the world for me.", ["She means the world to me."], "mean the world TO someone."),
  mc("p13", EXP, 5, "I need to get this off my ___.", ["chest", "heart", "mind", "back"], 0,
     "get something off your chest = finally say it."),
  gap("p14", EXP, 5, "I want to make ___ for the mistakes I made.", ["amends"], "make amends = correct a past mistake."),
  gap("p15", COND, 1, "If I ___ (have) only 24 hours, I ___ (call) my family first.", [["had"], ["would call", "'d call"]],
      "Second conditional: If + past simple, would + verb."),
  mc("p16", COND, 6, "If you could start again, what ___ you do differently?", ["would", "will", "did", "do"], 0,
     "Imaginary situation → would."),
  order("p17", COND, 5, "Build the sentence: if they didn't answer.", ["If she didn't answer,", "I would leave her", "a voice message."],
        "If + past simple, would + verb."),
  mc("p18", EXP, 6, "Small actions can ___ a difference.", ["make", "do", "take", "give"], 0,
     "make a difference (not do).", "\"Your feedback really made a difference.\""),
]

PHL = {
  "p01": ["putting off"], "p02": ["make the most of"], "p03": ["came to terms with"], "p04": ["reach out to"],
  "p05": ["weighing up"], "p06": ["weighing up", "go ahead with"], "p07": ["slim chance"], "p08": ["Brace yourself for"],
  "p09": ["Against all odds"], "p10": ["rule out"], "p11": ["took my parents for granted"], "p12": ["means the world to me"],
  "p13": ["get this off my chest"], "p14": ["make amends"], "p15": ["If I had", "I would call"], "p18": ["make a difference"],
}
for _p in PRACTICE:
    if _p["id"] in PHL: _p["hl"] = PHL[_p["id"]]

LESSON = {
  "id": "l004", "number": 4, "date": "2026-11-13", "format": 4,
  "title": "The Last 24 Hours on Earth",
  "subtitle": "Choices, priorities and what really matters",
  "level": "B2 Speaking",
  "source": "the_last_24_hours_on_the_earth.pdf",
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
print("ok", len(SLIDES), "lâminas ·", sum(len(s["items"]) for s in SLIDES), "perguntas ·", len(PRACTICE), "exercícios")
