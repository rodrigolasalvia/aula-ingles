"""Lição 1 (formato v4: uma tela por lâmina) · 28/10/2026 · Comparison, Choices & Envy
Gera data/v4/l001.json e atualiza data/v4/lessons.json. Rode: python3 tools/build_l001_v4.py

Cada lâmina: título e pergunta originais, resumo curto em inglês, expressões-chave (explicação breve em inglês)
e 5 perguntas para construir: 2 de aquecimento (cenário) + as 3 perguntas originais da professora.
"blocks" ficam na ordem CORRETA (o app embaralha). Respostas curtas: 3 a 5 blocos.
Tudo em inglês.
"""
import json, pathlib

def X(en, meaning):
    return {"en": en, "meaning": meaning}

def Q(id, kind, question, blocks, explain):
    return {"id": id, "kind": kind, "question": question, "blocks": blocks, "explain": explain}

SLIDES = [
  {
    "id": "s1", "n": 1, "title": "The Comparison Illusion",
    "question": "Are we comparing our real lives to a fake reality?",
    "summary": "An influencer posts beautiful photos of her home, dinners and weekends. Her followers assume her life is nearly perfect, but they don't see the staged photos, the money worries or the hard work behind the scenes.",
    "expressions": [
      X("present a carefully curated image", "show a version of your life that is selected and edited to look good."),
      X("show only the highlights", "show only the best moments."),
      X("create a false impression", "make people believe something that isn't true."),
      X("take something at face value", "believe something exactly as it looks, without questioning it."),
      X("distort your perception of reality", "make you see things in a way that isn't accurate."),
    ],
    "items": [
      Q("s1a", "warm-up", "Why do the influencer's followers think her life is perfect?",
        ["Her followers", "only see the highlights,", "not the staged photos", "or the money worries."],
        "\"The highlights\" are the best moments. A \"staged\" photo is planned to look natural."),
      Q("s1b", "warm-up", "What is the main message of this slide?",
        ["What we see online", "is often", "a carefully curated image,", "not the full reality."],
        "\"Curated\" means carefully selected and organised."),
      Q("s1c", "class", "If you know that social media posts are carefully selected, why might they still influence your perception of other people's lives?",
        ["We see these images", "so often that", "they start to feel normal", "and distort our perception of reality."],
        "\"So often that…\" shows a result. \"Distort\" means to change something so it's no longer accurate."),
      Q("s1d", "class", "Is presenting an idealized version of yourself online a form of dishonesty, or is it simply a matter of privacy?",
        ["In my view,", "showing only the highlights is privacy,", "but creating a false impression", "to sell something is dishonest."],
        "\"In my view\" introduces your opinion. \"But\" sets the limit between the two ideas."),
      Q("s1e", "class", "How can you distinguish between a genuinely successful life and a convincing public image?",
        ["I'd look at", "what people don't show,", "because a single post", "reveals only part of the story."],
        "\"I'd look at…\" is a simple way to suggest a method. Remember: don't take a post at face value."),
    ],
  },
  {
    "id": "s2", "n": 2, "title": "Are You Choosing for Yourself?",
    "question": "How much are your decisions really yours — and how much are they influenced by others?",
    "summary": "Sarah has always liked a simple life. When her friends start buying luxury brands, she starts spending too — not because she wants to, but because she's afraid of looking less successful. Months later, she has less money and a lifestyle that doesn't suit her.",
    "expressions": [
      X("give in to social pressure", "do something because others expect it, not because you want to."),
      X("lose sight of your own priorities", "forget what really matters to you."),
      X("seek external validation", "need approval from other people to feel good about yourself."),
      X("make decisions based on appearances", "choose things to look good, not because they are right for you."),
      X("measure success on your own terms", "judge success by your own values, not other people's."),
    ],
    "items": [
      Q("s2a", "warm-up", "Why did Sarah change her lifestyle?",
        ["Sarah started buying", "expensive things", "because", "she wanted to fit in."],
        "\"Fit in\" means to feel accepted by a group."),
      Q("s2b", "warm-up", "What was the result for Sarah?",
        ["A few months later,", "she had less money", "and a lifestyle", "that didn't suit her."],
        "\"Suit someone\" means to be right for that person."),
      Q("s2c", "class", "At what point did Sarah stop making decisions based on her own values? What might have triggered the change?",
        ["It happened when", "her friends upgraded their lifestyles.", "She gave in to social pressure", "and lost sight of her priorities."],
        "\"Give in to\" means to stop resisting. \"Lose sight of\" means to forget what is important."),
      Q("s2d", "class", "Is it possible to enjoy luxury and still be influenced by social pressure? How can you tell the difference?",
        ["Yes, it is.", "Ask yourself:", "would I still buy it", "if nobody could see it?"],
        "A simple test. If the answer is no, you're probably seeking external validation."),
      Q("s2e", "class", "Should people care about how others perceive their lifestyle, or should personal satisfaction come first? Defend your position.",
        ["I'd argue that", "personal satisfaction should come first,", "so I try to measure success", "on my own terms."],
        "\"I'd argue that…\" makes your position clear. \"On your own terms\" = by your own rules."),
    ],
  },
  {
    "id": "s3", "n": 3, "title": "Is Envy Always a Bad Thing?",
    "question": "Can envy be a destructive emotion — or can it sometimes push us forward?",
    "summary": "Envy can be destructive: you feel resentful of someone's success, question your own abilities or secretly hope they fail. But it can also be motivating: someone's achievements show you what you want and encourage you to take action.",
    "expressions": [
      X("turn envy into motivation", "use the feeling of wanting what others have as a push to act."),
      X("feel threatened by someone's success", "feel that someone's success is a danger to you."),
      X("acknowledge your insecurities", "accept and admit what makes you feel insecure."),
      X("channel your energy into something productive", "use your energy for something useful."),
      X("take inspiration from someone", "use someone's example to motivate you."),
    ],
    "items": [
      Q("s3a", "warm-up", "What is destructive envy?",
        ["Destructive envy is when", "you feel resentful", "of someone's success", "and secretly hope they fail."],
        "\"Resentful of\" means feeling angry because something seems unfair."),
      Q("s3b", "warm-up", "What is motivating envy?",
        ["Motivating envy shows you", "what you really want", "and encourages you", "to take action."],
        "Notice the structure: encourage someone TO do something."),
      Q("s3c", "class", "Can envy be useful if it reveals something you genuinely want? Or does it always damage your peace of mind?",
        ["I think envy can be useful", "if you turn it into motivation", "instead of", "letting it become resentment."],
        "\"Instead of\" is followed by the -ING form: instead of letting."),
      Q("s3d", "class", "Imagine your friend gets an opportunity you've wanted for years. What would your first reaction be, and how would you handle it?",
        ["At first,", "I might feel a bit threatened,", "but I'd congratulate my friend", "and take inspiration from him."],
        "Use \"would\" ('d) and \"might\" for imaginary situations. Notice: inspiration FROM."),
      Q("s3e", "class", "Is it better to avoid people who trigger your insecurities, or learn to deal with those feelings? Defend your answer.",
        ["It's better to", "acknowledge your insecurities", "and learn to deal with them,", "not to avoid people."],
        "\"Learn to deal with\" = learn how to handle something. Avoiding people doesn't solve the feeling."),
    ],
  },
]

# ---------- Practice: cerca de 10 exercícios objetivos, um por vez, com percentual no fim ----------
# source: "teacher" (exercício da professora, reproduzido) ou "extra" (criado a partir do tema).
# Tipos: mc (escolha), gap (digitar a palavra), fix (corrigir a frase), order (montar com blocos, na ordem correta).
# Gabarito: o da professora quando ela mandar; senão, criado aqui.
def mc(id, skill, slide, prompt, options, answer, explain, tip, source="extra"):
    return {"id": id, "type": "mc", "skill": skill, "slide": slide, "source": source, "prompt": prompt,
            "options": options, "answer": answer, "explain": explain, "tip": tip}

def gap(id, skill, slide, prompt, accept, explain, tip, source="extra"):
    return {"id": id, "type": "gap", "skill": skill, "slide": slide, "source": source, "prompt": prompt,
            "accept": accept, "explain": explain, "tip": tip}

def fix(id, skill, slide, wrong, accept, explain, tip, source="extra"):
    return {"id": id, "type": "fix", "skill": skill, "slide": slide, "source": source, "prompt": wrong,
            "accept": accept, "explain": explain, "tip": tip}

def order(id, skill, slide, prompt, blocks, explain, tip, source="extra"):
    return {"id": id, "type": "order", "skill": skill, "slide": slide, "source": source, "prompt": prompt,
            "blocks": blocks, "explain": explain, "tip": tip}

PRACTICE = [
  mc("x01", "Prepositions", 1, "Don't take every perfect post ___ face value.", ["at", "in", "on", "by"], 0,
     "The expression is fixed: take something AT face value.",
     "Use it with news, reviews or sales promises: \"I never take reviews at face value.\""),
  mc("x02", "Vocabulary", 1, "An influencer who shows only beautiful, edited moments presents a carefully ___ image.",
     ["curated", "cured", "curious", "careful"], 0,
     "\"Curated\" means carefully selected and organised.",
     "Common at work too: \"a curated list of suppliers\"."),
  gap("x03", "Prepositions", 1, "Constant comparison can distort your perception ___ reality.", ["of"],
      "We say perception OF something.",
      "Also: \"the perception of risk\", \"the perception of quality\"."),
  mc("x04", "Prepositions", 2, "Sarah made her choices based ___ appearances.", ["on", "in", "at", "of"], 0,
     "Based ON. \"Based in\" is only for places: a company based in London.",
     "In meetings: \"This decision is based on data.\""),
  fix("x05", "Phrasal verbs", 2, "She gave on to social pressure and bought a luxury bag.",
      ["She gave in to social pressure and bought a luxury bag."],
      "The phrasal verb is GIVE IN TO (= stop resisting).",
      "\"Don't give in to pressure from the supplier.\""),
  order("x06", "Expressions", 2, "Build the sentence: what happened to Sarah?",
        ["She lost sight of", "her own priorities", "and started", "seeking external validation."],
        "Lose sight OF something = forget what matters. After \"started\" you can use -ING: started seeking.",
        "\"In a busy week, it's easy to lose sight of your priorities.\""),
  gap("x07", "Expressions", 2, "I prefer to measure success on my own ___.", ["terms"],
      "The expression is \"on your own terms\" = by your own rules.",
      "\"I want to retire on my own terms.\""),
  mc("x08", "Word forms", 3, "He felt ___ of his colleague's promotion.", ["envious", "envy", "enviable", "envying"], 0,
     "After \"feel\" we need an adjective: envious. \"Enviable\" means something others want (an enviable job).",
     "\"Envious\" = wanting what someone else has; \"jealous\" = afraid of losing someone."),
  fix("x09", "Prepositions", 3, "I take inspiration in people who changed careers.",
      ["I take inspiration from people who changed careers."],
      "Take inspiration FROM someone — not \"in\".",
      "\"I take inspiration from leaders who listen to their teams.\""),
  order("x10", "Expressions", 3, "Build the sentence: when can envy be useful?",
        ["Envy can be useful", "if you turn it", "into motivation", "instead of resentment."],
        "Turn X INTO Y = transform X into Y.",
        "\"She turned the feedback into an action plan.\""),
]

LESSON = {
  "id": "l001", "number": 1, "date": "2026-10-28", "format": 4,
  "title": "Comparison, Choices & Envy",
  "subtitle": "Social media, social pressure and envy",
  "level": "B2 Speaking",
  "slides": SLIDES,
  "practice": PRACTICE,
}

root = pathlib.Path(__file__).resolve().parent.parent / "data" / "v4"
root.mkdir(parents=True, exist_ok=True)
(root / f"{LESSON['id']}.json").write_text(json.dumps(LESSON, ensure_ascii=False, indent=1), encoding="utf-8")
idx_path = root / "lessons.json"
idx = json.loads(idx_path.read_text()) if idx_path.exists() else {"lessons": []}
meta = {k: LESSON[k] for k in ("id", "number", "date", "title", "subtitle")} | {"file": f"data/v4/{LESSON['id']}.json"}
idx["lessons"] = [l for l in idx["lessons"] if l["id"] != LESSON["id"]] + [meta]
idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=1), encoding="utf-8")
print("ok", len(SLIDES), "lâminas ·", sum(len(s["items"]) for s in SLIDES), "perguntas")
