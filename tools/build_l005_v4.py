"""Lição 5 · 19/11/2026 · Behind Closed Doors (PDF da professora, 6 lâminas, B2–C1, relacionamentos)
Gera data/v4/l005.json e atualiza data/v4/lessons.json. Rode: python3 tools/build_l005_v4.py

Regras aplicadas (ver método do projeto):
- Uma tela por lâmina; perguntas dela (kind "class", ex) com resposta-modelo em blocos, "hl" (azul) e "gloss" (inglês = português).
- Um exercício por expressão de cada lâmina (campo "expr" = texto exato da expressão). Na lâmina 3, os 6 exercícios são os dela.
- Escrita opcional para o PDF: Advanced Challenge (lâmina 3) e B2–C1 Challenge (lâmina 4). Lâmina 6 pede fala sem roteiro: sem escrita.
Sem gabarito dela: respostas criadas aqui.
"""
import json, pathlib

def X(en, meaning):
    return {"en": en, "meaning": meaning}

def G(*pairs):
    return [{"en": e, "pt": t} for e, t in pairs]

def Q(id, ex, question, blocks, explain, hl=None, gloss=None):
    d = {"id": id, "kind": "class", "ex": ex, "question": question, "blocks": blocks, "explain": explain}
    if hl: d["hl"] = hl
    if gloss: d["gloss"] = gloss
    return d

PV6 = [X("drift apart", "slowly become less close to someone."),
       X("fall out", "stop being friends after an argument."),
       X("patch things up", "make peace after an argument."),
       X("bottle up", "keep your feelings inside instead of expressing them."),
       X("open up", "start talking honestly about your feelings."),
       X("put up with", "accept something annoying without complaining.")]

SLIDES = [
  {"id": "s1", "n": 1, "title": "Behind Closed Doors", "question": "Relationships · Warm-up",
   "summary": "A warm-up about relationships: someone who stops replying without explaining why, two people who care about each other but are bad for each other, people who stay in unhappy relationships, and staying out of loyalty.",
   "expressions": [X("confront someone", "talk to someone directly about a problem."),
                   X("move on", "accept what happened and continue with your life."),
                   X("genuinely care about someone", "really care about someone, honestly."),
                   X("out of loyalty", "because you feel you must be loyal.")],
   "items": [
     Q("s1a", 1, "Someone stops replying to your messages without explaining why. Would you confront them or simply move on?",
       ["I would probably", "confront them politely,", "because I'd rather know the truth", "than simply move on."],
       "I'd rather… than… compares two options.", ["confront them", "move on"],
       G(("confront someone", "confrontar alguém, tirar satisfação"), ("move on", "seguir em frente"))),
     Q("s1b", 1, "Can two people genuinely care about each other but still be bad for each other?",
       ["Yes, two people can", "genuinely care about each other", "and still bring out", "the worst in each other."],
       "bring out the worst in someone = make someone behave badly.", ["genuinely care about", "bring out the worst in"],
       G(("genuinely care about someone", "se importar de verdade com alguém"), ("bring out the worst in someone", "despertar o pior de alguém"))),
     Q("s1c", 1, "Why do people sometimes stay in relationships they are clearly unhappy with?",
       ["Many people stay", "out of fear of being alone", "or because they don't want", "to start again."],
       "out of fear of + -ING: out of fear of being alone.", ["out of fear of"],
       G(("out of fear of", "por medo de"))),
     Q("s1d", 1, "Should we maintain relationships out of loyalty, even when they no longer make us happy?",
       ["Loyalty matters,", "but staying only out of loyalty", "can make both people", "unhappy in the long run."],
       "in the long run = after a long time.", ["out of loyalty", "in the long run"],
       G(("out of loyalty", "por lealdade"), ("in the long run", "a longo prazo")))]},
  {"id": "s2", "n": 2, "title": "When Relationships Change", "question": "Phrasal verbs in context · B2–C1",
   "summary": "Six phrasal verbs about how relationships change: friends who drift apart after moving, people who fall out over something stupid, who patch things up, someone who bottles everything up, someone who finally opens up, and someone who puts up with constant criticism.",
   "expressions": PV6,
   "items": [
     Q("s2a", 1, "Can you guess the meaning of each bold expression from its context?",
       ["From the context,", "drift apart means", "slowly becoming less close", "to someone."],
       "Guessing from context is a key B2–C1 skill.", ["drift apart"],
       G(("drift apart", "distanciar-se aos poucos"))),
     Q("s2b", 1, "Which expressions describe a temporary situation, and which might describe a long-term change?",
       ["Falling out is often temporary,", "but drifting apart is usually", "a long-term change."],
       "Gerunds as subjects: Falling out is…, drifting apart is…", ["Falling out", "drifting apart"],
       G(("fall out", "brigar e cortar relações"), ("drift apart", "distanciar-se aos poucos"))),
     Q("s2c", 1, "Which of these situations have you witnessed in real life?",
       ["I've seen two old friends", "drift apart", "after one of them", "moved abroad."],
       "see someone + verb: I've seen two friends drift apart.", ["drift apart"],
       G(("drift apart", "distanciar-se aos poucos")))]},
  {"id": "s3", "n": 3, "title": "What Would You Say?", "question": "Active vocabulary · Choose & justify",
   "summary": "Choose the right phrasal verb for six situations. Then think beyond the answer: which situations could seriously damage a relationship, which problems can be solved, and have you experienced one? Advanced challenge: explain why your phrasal verb fits better than another.",
   "expressions": PV6,
   "items": [
     Q("s3a", 2, "Which of these situations could seriously damage a relationship?",
       ["Constantly putting up with criticism", "could seriously damage", "a relationship over time."],
       "put up with + noun; -ING form as subject.", ["putting up with"],
       G(("put up with", "aguentar, tolerar"))),
     Q("s3b", 2, "Which of these problems can be solved, and which might be irreversible?",
       ["A fight can be solved", "if people patch things up,", "but drifting apart", "is harder to reverse."],
       "can be solved = passive voice.", ["patch things up", "drifting apart"],
       G(("patch things up", "fazer as pazes"), ("drift apart", "distanciar-se aos poucos"))),
     Q("s3c", 2, "Have you ever experienced a situation similar to one of these?",
       ["Yes, I used to", "bottle everything up", "until I learned", "to open up to my friends."],
       "used to = a past habit. open up TO someone.", ["bottle everything up", "open up"],
       G(("bottle up", "guardar os sentimentos"), ("open up", "abrir-se, desabafar")))]},
  {"id": "s4", "n": 4, "title": "The Relationship Crossroads", "question": "Real-life dilemmas · Critical thinking",
   "summary": "Three real-life dilemmas: a one-sided friendship (your best friend only contacts you when they need something), love vs. self-respect (someone puts up with criticism and controlling behavior), and family expectations (your family disapproves of your partner). Use at least two expressions when defending your opinion.",
   "expressions": [X("draw the line", "set a limit you will not accept beyond."),
                   X("stand up for yourself", "defend yourself and your rights."),
                   X("turn a blind eye to", "pretend not to see something wrong."),
                   X("come to terms with", "slowly accept a difficult situation."),
                   X("make up for", "do something good to compensate for something bad."),
                   X("walk away from", "leave a situation or a relationship.")],
   "items": [
     Q("s4a", 1, "The one-sided friendship: Would you confront them, distance yourself, or end the friendship?",
       ["I would talk to them first,", "but if nothing changed,", "I would walk away from", "the friendship."],
       "Second conditional: if nothing changed, I would…", ["walk away from"],
       G(("walk away from", "afastar-se de, abandonar"))),
     Q("s4b", 1, "How many chances should someone get?",
       ["Two or three chances are fair,", "but at some point", "you have to draw the line."],
       "at some point = eventually.", ["draw the line"],
       G(("draw the line", "impor um limite"))),
     Q("s4c", 1, "Love vs. self-respect: Can love justify tolerating certain behaviors?",
       ["Love can't justify", "turning a blind eye to", "constant criticism", "and control."],
       "justify + -ING: justify turning…", ["turning a blind eye to"],
       G(("turn a blind eye to", "fazer vista grossa para"))),
     Q("s4d", 1, "When does compromise become a lack of self-respect?",
       ["It becomes a problem", "when you stop", "standing up for yourself", "to avoid a fight."],
       "stop + -ING = no longer do it.", ["standing up for yourself"],
       G(("stand up for yourself", "defender-se, se impor"))),
     Q("s4e", 1, "Family expectations: Should family opinions influence your romantic decisions?",
       ["I'd listen to them,", "and hope they would", "come to terms with my choice."],
       "come to terms WITH something.", ["come to terms with"],
       G(("come to terms with", "aceitar aos poucos"))),
     Q("s4f", 1, "Would you go against your family's wishes to be with someone you love?",
       ["Yes, and later", "I would try to", "make up for the tension", "with time and patience."],
       "make up FOR something = compensate.", ["make up for"],
       G(("make up for", "compensar")))]},
  {"id": "s5", "n": 5, "title": "The Conversation You've Been Avoiding", "question": "Advanced roleplay · 10 minutes",
   "summary": "You've been close friends for years, but something has changed: your friend only contacts you when they need help, rarely asks how you're doing and gets defensive when you bring it up. You're the frustrated friend; your teacher plays the defensive friend.",
   "expressions": [X("I don't want to sound harsh, but…", "softens a criticism before you say it."),
                   X("That's not the point.", "brings the conversation back to the real issue."),
                   X("I get where you're coming from.", "I understand your point of view."),
                   X("It's been weighing on me.", "it has been worrying me for a while."),
                   X("I can't keep pretending everything is fine.", "I can't act as if nothing is wrong."),
                   X("Where do we go from here?", "what do we do now?")],
   "items": [
     Q("s5a", 1, "Explain what's been bothering you.",
       ["I don't want to sound harsh, but", "you only call me", "when you need help."],
       "Start softly, then say the problem directly.", ["I don't want to sound harsh, but"],
       G(("I don't want to sound harsh, but…", "não quero parecer duro, mas…"))),
     Q("s5b", 1, "Give a specific example.",
       ["Last month,", "you didn't even ask", "how my new job was going."],
       "\"didn't even\" stresses that it was the minimum."),
     Q("s5c", 1, "Your friend says: \"I've just been really busy lately.\"",
       ["I get where you're coming from,", "but it's been weighing on me", "for months."],
       "Accept their point, then explain your feeling.", ["I get where you're coming from", "it's been weighing on me"],
       G(("I get where you're coming from", "entendo o seu lado"), ("it's been weighing on me", "isso tem me pesado"))),
     Q("s5d", 1, "Your friend says: \"You're making this bigger than it actually is.\"",
       ["That's not the point.", "I can't keep pretending", "everything is fine."],
       "keep + -ING: keep pretending.", ["That's not the point.", "I can't keep pretending everything is fine."],
       G(("That's not the point.", "a questão não é essa"), ("I can't keep pretending everything is fine.", "não dá mais para fingir que está tudo bem"))),
     Q("s5e", 1, "Make your expectations clear.",
       ["I need you to", "ask how I'm doing", "and really listen to the answer."],
       "need someone TO do something."),
     Q("s5f", 1, "Decide whether this friendship is worth saving.",
       ["I still care about you,", "so tell me:", "where do we go from here?"],
       "A good way to move from the problem to a solution.", ["where do we go from here?"],
       G(("Where do we go from here?", "e agora, o que fazemos?")))]},
  {"id": "s6", "n": 6, "title": "The Uncomfortable Truth", "question": "Final speaking challenge · 2–3 minutes",
   "summary": "Are we becoming less tolerant in relationships, or simply learning not to accept things we once put up with? Give a clear opinion, two arguments, a real-life example and an opposing view, and finish strongly. Use at least four expressions. No script, no reading.",
   "expressions": [X("drift apart", "slowly become less close to someone."),
                   X("fall out", "stop being friends after an argument."),
                   X("bottle up", "keep your feelings inside."),
                   X("open up", "start talking honestly about your feelings."),
                   X("draw the line", "set a limit you will not accept beyond."),
                   X("stand up for yourself", "defend yourself and your rights."),
                   X("walk away from", "leave a situation or a relationship."),
                   X("come to terms with", "slowly accept a difficult situation.")],
   "items": [
     Q("s6a", 1, "The big question: Are we becoming less tolerant in relationships, or are we simply learning not to accept things we once put up with?",
       ["I think we're learning", "to draw the line", "at things our parents", "used to put up with."],
       "draw the line AT something.", ["draw the line", "put up with"],
       G(("draw the line", "impor um limite"), ("put up with", "aguentar, tolerar"))),
     Q("s6b", 1, "Have people become too quick to walk away from relationships?",
       ["Sometimes, yes:", "many people walk away from", "a relationship", "after the first problem."],
       "too quick TO do something.", ["walk away from"],
       G(("walk away from", "afastar-se de, abandonar"))),
     Q("s6c", 1, "Is protecting your peace sometimes just an excuse to avoid difficult conversations?",
       ["It can be,", "because bottling things up", "is easier than", "opening up honestly."],
       "Gerunds as subjects and after \"than\".", ["bottling things up", "opening up"],
       G(("bottle up", "guardar os sentimentos"), ("open up", "abrir-se, desabafar"))),
     Q("s6d", 1, "Are modern relationships becoming more conditional?",
       ["In a way, yes:", "people stand up for themselves more,", "but they also", "fall out more easily."],
       "stand up for THEMSELVES (plural).", ["stand up for themselves", "fall out"],
       G(("stand up for yourself", "defender-se, se impor"), ("fall out", "brigar e cortar relações"))),
     Q("s6e", 1, "Final teacher challenge: What if you're the person someone else decides to walk away from? Would you still feel the same way?",
       ["It would hurt,", "but eventually I would", "come to terms with it", "and move on."],
       "eventually = in the end, after some time (not \"eventualmente\").", ["come to terms with", "move on"],
       G(("come to terms with", "aceitar aos poucos"), ("move on", "seguir em frente")))]},
]

EX_TITLES = {
  1: {1: "Warm-up questions"},
  2: {1: "Your Challenge"},
  3: {1: "Use these expressions: complete the sentences", 2: "Think Beyond the Answer", 3: "Advanced Challenge"},
  4: {1: "Real-life dilemmas", 2: "B2–C1 Challenge"},
  5: {1: "Roleplay: your lines"},
  6: {1: "Take a position"},
}

PV, EXP, SP = "Phrasal verbs", "Expressions", "Speaking phrases"

def it(id, t, skill, slide, expr, hl, explain, source="extra", ex=None, **kw):
    d = {"id": id, "type": t, "skill": skill, "slide": slide, "source": source, "ex": ex, "expr": expr, "hl": hl,
         "explain": explain, "tip": kw.pop("tip", "")}
    d.update(kw)
    return d

def mc(id, skill, slide, expr, hl, prompt, options, answer, explain, **kw):
    return it(id, "mc", skill, slide, expr, hl, explain, prompt=prompt, options=options, answer=answer, **kw)

def gap(id, skill, slide, expr, hl, prompt, accept, explain, **kw):
    return it(id, "gap", skill, slide, expr, hl, explain, prompt=prompt, accept=accept, **kw)

def fix(id, skill, slide, expr, hl, wrong, accept, explain, **kw):
    return it(id, "fix", skill, slide, expr, hl, explain, prompt=wrong, accept=accept, **kw)

def order(id, skill, slide, expr, hl, prompt, blocks, explain, **kw):
    return it(id, "order", skill, slide, expr, hl, explain, prompt=prompt, blocks=blocks, **kw)

PRACTICE = [
  # Lâmina 1 (4)
  mc("a1", EXP, 1, "confront someone", ["confront him"], "If he doesn't reply, I'll ___ him and ask what happened.",
     ["confront", "confess", "conform", "convince"], 0, "confront someone = talk directly about a problem."),
  gap("a2", PV, 1, "move on", ["move on"], "It's time to forget the past and move ___.", ["on"], "move on = continue with your life."),
  order("a3", EXP, 1, "genuinely care about someone", ["genuinely cares about"], "Build the sentence: a good friend.",
        ["She genuinely cares", "about her friends,", "even when they're difficult."], "care ABOUT someone."),
  fix("a4", EXP, 1, "out of loyalty", ["out of loyalty"], "He stayed in the job out of loyal to his boss.",
      ["He stayed in the job out of loyalty to his boss."], "After \"out of\" we need a noun: loyalty."),
  # Lâmina 2 (6)
  mc("b1", PV, 2, "drift apart", ["drifted apart"], "After college, my roommate and I slowly ___.",
     ["drifted apart", "fell apart", "drove apart", "broke apart"], 0, "drift apart = slowly become less close."),
  gap("b2", PV, 2, "fall out", ["fell out"], "They fell ___ over money and haven't spoken since.", ["out"], "fall out (over something) = stop being friends."),
  order("b3", PV, 2, "patch things up", ["patch things up"], "Build the sentence: after a fight.",
        ["After the argument,", "they decided to", "patch things up."], "patch things up = make peace."),
  fix("b4", PV, 2, "bottle up", ["bottle your feelings up"], "Don't bottle your feelings down; talk to someone.",
      ["Don't bottle your feelings up; talk to someone.", "Don't bottle up your feelings; talk to someone."],
      "The phrasal verb is bottle UP (separable)."),
  mc("b5", PV, 2, "open up", ["open up"], "It took him years to open ___ about his childhood.", ["up", "out", "in", "off"], 0,
     "open up (about something) = talk honestly."),
  gap("b6", PV, 2, "put up with", ["put up with"], "I can't put up ___ this noise anymore.", ["with"], "put up WITH = tolerate."),
  # Lâmina 3 (6, da professora)
  gap("t3a", PV, 3, "bottle up", ["bottle up"], "Sarah never tells anyone when she's upset. She tends to ___ her emotions.", ["bottle up"],
      "She keeps her emotions inside: bottle up.", source="teacher", ex=1),
  gap("t3b", PV, 3, "fall out", ["fell out"], "After a huge argument about money, the two brothers ___ and stopped speaking.", ["fell out"],
      "An argument that ends a relationship: fall out. Past: fell out.", source="teacher", ex=1),
  gap("t3c", PV, 3, "drift apart", ["drift apart"], "We haven't had much in common lately. I think we're starting to ___.", ["drift apart"],
      "No fight, just less in common: drift apart.", source="teacher", ex=1),
  gap("t3d", PV, 3, "open up", ["open up"], "He finally decided to ___ to his best friend about his relationship problems.", ["open up"],
      "open up TO someone ABOUT something.", source="teacher", ex=1),
  gap("t3e", PV, 3, "patch things up", ["patch things up"], "Despite their disagreements, they managed to ___.", ["patch things up"],
      "\"Despite their disagreements\" → they made peace: patch things up.", source="teacher", ex=1),
  gap("t3f", PV, 3, "put up with", ["put up with"], "I honestly don't know how you ___ his constant complaining!", ["put up with"],
      "Tolerating something annoying: put up with.", source="teacher", ex=1),
  # Lâmina 4 (6)
  mc("f1", EXP, 4, "draw the line", ["draw the line"], "I'm happy to help, but I ___ at lending money.",
     ["draw the line", "make the line", "cross the line", "hold the line"], 0, "draw the line AT something = refuse to go further."),
  gap("f2", PV, 4, "stand up for yourself", ["stand up for yourself"], "You need to stand up ___ yourself when your boss is unfair.", ["for"],
      "stand up FOR yourself.", tip="Useful at work: \"She always stands up for her team.\""),
  mc("f3", EXP, 4, "turn a blind eye to", ["turned a blind eye to"], "The manager turned a ___ eye to the problem.",
     ["blind", "closed", "dark", "shut"], 0, "turn a blind eye to = pretend not to see."),
  gap("f4", PV, 4, "come to terms with", ["come to terms with"], "It took her a year to come to terms ___ the loss.", ["with"], "come to terms WITH."),
  fix("f5", PV, 4, "make up for", ["make up for"], "I bought her flowers to make up to the argument.",
      ["I bought her flowers to make up for the argument."], "make up FOR = compensate."),
  order("f6", PV, 4, "walk away from", ["walk away from"], "Build the sentence: a healthy choice.",
        ["Sometimes the healthiest choice", "is to walk away from", "a toxic relationship."], "walk away FROM something."),
  # Lâmina 5 (6)
  mc("h1", SP, 5, "I don't want to sound harsh, but…", ["I don't want to sound harsh"], "___, but you're always late.",
     ["I don't want to sound harsh", "I don't want to sound hard", "I don't want to seem harshly", "I don't want sound harsh"], 0,
     "want TO sound + adjective (harsh)."),
  order("h2", SP, 5, "That's not the point.", ["That's not the point."], "Build the reply.",
        ["That's not the point.", "You promised", "to call me back."], "Brings the conversation back to the real issue."),
  gap("h3", SP, 5, "I get where you're coming from.", ["I get where you're coming from"], "I get where you're coming ___, but I still disagree.", ["from"],
      "coming FROM = your point of view."),
  fix("h4", SP, 5, "It's been weighing on me.", ["weighing on me"], "This problem has been weighting on me for weeks.",
      ["This problem has been weighing on me for weeks."], "The verb is weigh (weighing), not weight."),
  mc("h5", SP, 5, "I can't keep pretending everything is fine.", ["I can't keep pretending everything is fine."], "I can't keep ___ everything is fine.",
     ["pretending", "to pretend", "pretend", "pretended"], 0, "keep + -ING: keep pretending."),
  mc("h6", SP, 5, "Where do we go from here?", ["where do we go from here?"], "We both made mistakes. So, where do we go ___ here?",
     ["from", "to", "for", "at"], 0, "Where do we go FROM here? = what now?"),
  # Lâmina 6 (8)
  mc("m1", PV, 6, "drift apart", ["drifted apart"], "Over the years, the two cousins slowly ___.",
     ["drifted apart", "patched up", "opened up", "put up"], 0, "drift apart = slowly become less close."),
  fix("m2", PV, 6, "fall out", ["fell out"], "We fell off last year and never spoke again.", ["We fell out last year and never spoke again."],
      "fall OUT = stop being friends after an argument."),
  gap("m3", PV, 6, "bottle up", ["bottle your feelings up"], "If you bottle your feelings ___, they come out later.", ["up"], "bottle something UP."),
  mc("m4", PV, 6, "open up", ["opened up"], "He finally opened ___ to his therapist.", ["up", "out", "on", "in"], 0, "open UP to someone."),
  gap("m5", EXP, 6, "draw the line", ["draw the line"], "I don't mind helping, but I draw the ___ at lying.", ["line"], "draw the LINE at something."),
  order("m6", PV, 6, "stand up for yourself", ["stand up for yourself"], "Build the sentence: at work.",
        ["You have to", "stand up for yourself", "in difficult meetings."], "stand up FOR yourself."),
  mc("m7", PV, 6, "walk away from", ["walk away from"], "When respect is gone, it's time to walk ___ from the relationship.",
     ["away", "off", "out", "back"], 0, "walk AWAY from."),
  fix("m8", PV, 6, "come to terms with", ["came to terms with"], "He finally came to terms about his divorce.",
      ["He finally came to terms with his divorce."], "come to terms WITH (not about)."),
]

WRITING = [
  {"id": "w3", "slide": 3, "ex": 3,
   "prompt": "Advanced Challenge: don't just give the answer. Explain why your chosen phrasal verb fits the situation better than another expression.",
   "checklist": ["Choose one sentence from the exercise", "Explain what the phrasal verb means in that context",
                 "Compare it with another expression from the list"],
   "model": ("In sentence 3, \"drift apart\" fits better than \"fall out\" because there was no argument. "
             "The two people simply had less and less in common, so the change was slow and natural, not sudden.")},
  {"id": "w4", "slide": 4, "ex": 2,
   "prompt": "B2–C1 Challenge: choose ONE situation.",
   "checklist": ["Explain what you would do", "Give at least two reasons", "Consider the opposite point of view",
                 "Use at least TWO phrasal verbs"],
   "model": ("I'd choose the one-sided friendship. First, I would confront my friend and explain how I feel. "
             "If nothing changed, I would draw the line and walk away from the friendship, because a friendship should go both ways "
             "and I need to stand up for myself. On the other hand, my friend might be going through a hard time, so I would give them one more chance.")},
]

LESSON = {
  "id": "l005", "number": 5, "date": "2026-11-19", "format": 4,
  "title": "Behind Closed Doors",
  "subtitle": "Relationships: phrasal verbs, dilemmas and difficult conversations",
  "level": "B2–C1 Speaking",
  "source": "Behind_closed_doors_b2_c1.pdf",
  "exercises": EX_TITLES,
  "slides": SLIDES,
  "practice": PRACTICE,
  "writing": WRITING,
}

root = pathlib.Path(__file__).resolve().parent.parent / "data" / "v4"
(root / f"{LESSON['id']}.json").write_text(json.dumps(LESSON, ensure_ascii=False, indent=1), encoding="utf-8")
idx_path = root / "lessons.json"
idx = json.loads(idx_path.read_text())
meta = {k: LESSON[k] for k in ("id", "number", "date", "title", "subtitle")} | {"file": f"data/v4/{LESSON['id']}.json"}
idx["lessons"] = [l for l in idx["lessons"] if l["id"] != LESSON["id"]] + [meta]
idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=1), encoding="utf-8")
print("ok", len(SLIDES), "lâminas ·", sum(len(s["items"]) for s in SLIDES), "perguntas ·", len(PRACTICE), "exercícios (",
      sum(p["source"] == "teacher" for p in PRACTICE), "dela )")
