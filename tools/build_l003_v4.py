"""Lição 3 · 12/11/2026 · Five Recurring Errors (material da professora em texto corrido, sem lâminas)
Gera data/v4/l003.json e atualiza data/v4/lessons.json. Rode: python3 tools/build_l003_v4.py

Cada erro vira uma tela: a explicação dela (resumida), o par erro → correção dela e 3 frases minhas para montar.
Os exercícios dela vão para o Practice e para a página do PDF, na ordem dela (source "teacher").
Tela 6 = Mixed Practice, Sentence Transformation e Personal Writing (parágrafo livre → só na página do PDF).
Sem gabarito dela: respostas criadas aqui, usando as correções dos exemplos dela.
O arquivo dela termina cortado no último item do Personal Writing ("A sentence using ...").
"""
import json, pathlib

def X(en, meaning):
    return {"en": en, "meaning": meaning}

def W(id, question, blocks, explain):
    return {"id": id, "kind": "warm-up", "question": question, "blocks": blocks, "explain": explain}

SK = {1: "This is + singular", 2: "A million", 3: "No repeated subject", 4: "What if I…?", 5: "Enroll in"}

EX_TITLES = {
  1: {1: "Practice: Correct each sentence", 2: "Fill in the blank with is or are"},
  2: {1: "Practice: Fill in each blank with a, or leave it blank if no article is needed", 2: "Correct each sentence"},
  3: {1: "Practice: Correct each sentence", 2: "Rewrite each sentence without repeating the subject"},
  4: {1: "Practice: Rewrite each sentence as a clear question, removing just", 2: "Add appropriate capitalization and punctuation"},
  5: {1: "Practice: Fill in each blank with in or for", 2: "Correct each sentence"},
  6: {1: "Mixed Practice: Choose the correct option", 2: "Sentence Transformation", 3: "Personal Writing"},
}

SLIDES = [
  {"id": "e1", "n": 1, "title": "1. Singular subject: \"this\"", "question": "How do I introduce one item?",
   "summary": "Use is with the singular subject this, and a singular noun for one item. Don't repeat the subject with it. Her example: not \"This, it's a Philips headphones\" but \"This is a Philips headphone.\"",
   "expressions": [X("This is + a/an + singular noun", "one item: This is my passport."),
                   X("✗ This, it's…", "don't add \"it\" after \"this\"."),
                   X("✗ This are…", "this is singular, so the verb is is."),
                   X("These are + plural noun", "for more than one item: These are my keys.")],
   "items": [W("e1a", "Show a colleague your new laptop.", ["This is", "my new laptop", "from the company."],
               "This + is + one item. No \"it\" after \"this\"."),
             W("e1b", "Present a document in a meeting.", ["This is", "the final version", "of the supplier contract."],
               "One document → this is."),
             W("e1c", "Point to two or more items.", ["These are", "the new headphones", "for the team."],
               "More than one item → these are + plural noun.")]},
  {"id": "e2", "n": 2, "title": "2. Articles: \"a million dollars\"", "question": "What do I say before million?",
   "summary": "Use a before million when you talk about an amount of money. Her example: not \"If I won million dollars\" but \"If I won a million dollars, I would travel.\"",
   "expressions": [X("a million dollars", "one million: always with \"a\" (or \"one\")."),
                   X("a hundred / a thousand", "the same pattern: a hundred people, a thousand reais."),
                   X("✗ an million", "million starts with a consonant sound, so \"a\"."),
                   X("two million dollars", "no \"s\" on million after a number.")],
   "items": [W("e2a", "What would you do with a million dollars?", ["If I had", "a million dollars,", "I would buy", "a house by the sea."],
               "a million dollars. Second conditional: If I had…, I would…"),
             W("e2b", "Talk about a big amount at work.", ["Our company spends", "about a million dollars", "on suppliers every month."],
               "\"a million\" even after \"about\"."),
             W("e2c", "Use the same pattern with hundred.", ["She earned", "a hundred dollars", "in one afternoon."],
               "a hundred, a thousand, a million: all with \"a\".")]},
  {"id": "e3", "n": 3, "title": "3. Don't repeat the subject", "question": "How do I describe someone without repeating the subject?",
   "summary": "When a noun is the subject, don't repeat it with a pronoun before the verb. Use the noun followed by the correct form of be. Her example: not \"My wife, she's angry\" but \"My wife is angry.\"",
   "expressions": [X("Noun + is + …", "My wife is angry. My manager is busy."),
                   X("Plural noun + are + …", "Our neighbors are friendly."),
                   X("✗ My wife, she's…", "Portuguese allows this; English doesn't."),
                   X("✗ The students, they're…", "say: The students are…")],
   "items": [W("e3a", "Describe your manager.", ["My manager", "is very organized", "and always on time."],
               "The noun is the subject: no \"he\" after it."),
             W("e3b", "Describe a supplier.", ["The new supplier", "is reliable", "and very fast."],
               "Noun + is. No \"it\" or \"they\" in between."),
             W("e3c", "Describe your clients (plural).", ["Our clients", "are happy", "with the new service."],
               "Plural noun + are.")]},
  {"id": "e4", "n": 4, "title": "4. \"What if I try…?\" (no just)", "question": "How do I make a suggestion with what if?",
   "summary": "In her example, just is unnecessary. Start the question with What if I…, use the normal word order and finish with a question mark. Her example: not \"What if just I try one more time here.\" but \"What if I try one more time here?\"",
   "expressions": [X("What if + I/we + verb…?", "a suggestion: What if we call the office?"),
                   X("✗ What if just I…", "just in that position sounds wrong; drop it."),
                   X("Capital W + question mark", "What if I try again? — start and end correctly.")],
   "items": [W("e4a", "Suggest calling the supplier.", ["What if", "I call the supplier", "first thing tomorrow morning?"],
               "What if + I + verb. No \"just\". End with ?"),
             W("e4b", "Suggest moving a meeting.", ["What if", "we move the meeting", "to Friday afternoon?"],
               "What if + we + verb."),
             W("e4c", "Suggest trying again.", ["What if", "I try", "one more time", "with a different approach?"],
               "Her structure: What if I try…?")]},
  {"id": "e5", "n": 5, "title": "5. Prepositions: \"enroll in\"", "question": "How do I say I joined a course?",
   "summary": "Use enroll in when you mean to join a course or program. Her example: not \"I enrolled for a new MBA in AI\" but \"I enrolled in a new MBA in AI.\"",
   "expressions": [X("enroll in + course / program", "join it: I enrolled in an MBA."),
                   X("✗ enroll for / enroll to", "use in for courses and programs."),
                   X("enrolled (past)", "American spelling: enroll, enrolled, enrolling.")],
   "items": [W("e5a", "Talk about a course you joined.", ["I enrolled in", "an online course", "in data analysis."],
               "enroll IN a course."),
             W("e5b", "Talk about a friend's plan.", ["My friend wants", "to enroll in", "a music program", "next year."],
               "want to enroll in + program."),
             W("e5c", "Give a deadline.", ["You can enroll in", "the program", "until the end of the month."],
               "enroll IN the program.")]},
  {"id": "e6", "n": 6, "title": "Mixed practice and writing", "question": "Can I use all five correctly together?",
   "summary": "This part mixes the five points: This is + singular, a million dollars, a noun subject without a repeated pronoun, What if I try…? and enroll in. Then you write your own short paragraph using all of them.",
   "expressions": [X("This is a…", "one item, no \"it\"."), X("a million dollars", "always with \"a\"."),
                   X("My manager is…", "no repeated pronoun."), X("What if I try…?", "no \"just\", end with ?"),
                   X("enroll in", "for courses and programs.")],
   "items": [W("e6a", "Show the course you want.", ["This is", "the course", "I want to enroll in."],
               "This is + singular, and enroll in at the end."),
             W("e6b", "Dream a little.", ["If I won", "a million dollars,", "my family", "would travel more."],
               "a million dollars; noun subject (my family) + would."),
             W("e6c", "Make a suggestion about studying.", ["What if", "I enroll in", "an MBA program", "next year?"],
               "What if I + verb…? + enroll in.")]},
]

def fix(id, slide, ex, wrong, accept, explain, strict=False, task=None, source="teacher", skill=None):
    d = {"id": id, "type": "fix", "skill": skill or SK.get(slide, "Mixed"), "slide": slide, "source": source,
         "ex": ex if source == "teacher" else None, "prompt": wrong, "accept": accept, "explain": explain, "tip": ""}
    if strict: d["strict"] = True
    if task: d["task"] = task
    return d

def gap(id, slide, ex, prompt, accept, explain, source="teacher", skill=None):
    return {"id": id, "type": "gap", "skill": skill or SK.get(slide, "Mixed"), "slide": slide, "source": source,
            "ex": ex if source == "teacher" else None, "prompt": prompt, "accept": accept, "explain": explain, "tip": ""}

def mc(id, slide, ex, prompt, options, answer, explain, source="teacher", skill=None):
    return {"id": id, "type": "mc", "skill": skill or SK.get(slide, "Mixed"), "slide": slide, "source": source,
            "ex": ex if source == "teacher" else None, "prompt": prompt, "options": options, "answer": answer,
            "explain": explain, "tip": ""}

HEADPHONE = ["This is a Philips headphone.", "These are Philips headphones.", "This is a pair of Philips headphones."]
HP_NOTE = " Her answer: \"This is a Philips headphone.\" \"These are Philips headphones\" is also accepted."

PRACTICE = [
  # 1. This
  fix("t1a", 1, 1, "This, it's a new laptop.", ["This is a new laptop."], "No \"it\" after \"this\": This is…"),
  fix("t1b", 1, 1, "This are my passport.", ["This is my passport."], "This is singular → is."),
  fix("t1c", 1, 1, "This, it's a Philips headphones.", HEADPHONE, "No \"it\", and one item → singular noun." + HP_NOTE),
  fix("t1d", 1, 1, "This is an useful dictionary.", ["This is a useful dictionary."],
      "\"Useful\" starts with a /j/ sound (\"you\"), so we say a useful."),
  gap("t1e", 1, 2, "This ___ my student ID.", ["is"], "This + is."),
  # 2. a million
  gap("t2a", 2, 1, "If I saved ___ million dollars, I would buy a house.", ["a"], "a million dollars."),
  gap("t2b", 2, 1, "She hopes to earn ___ million dollars someday.", ["a"], "a million dollars."),
  gap("t2c", 2, 1, "They donated ___ million dollars to the university.", ["a"], "a million dollars."),
  fix("t2d", 2, 2, "If he won million dollars, he would start a business.",
      ["If he won a million dollars, he would start a business."], "Add a: a million dollars."),
  fix("t2e", 2, 2, "I would travel the world if I had million dollars.",
      ["I would travel the world if I had a million dollars."], "Add a: a million dollars."),
  # 3. repeated subject
  fix("t3a", 3, 1, "My brother, he is a doctor.", ["My brother is a doctor."], "Don't repeat the subject: My brother is…"),
  fix("t3b", 3, 1, "The professor, she's available after class.", ["The professor is available after class."],
      "Remove \"she's\" and use is."),
  fix("t3c", 3, 1, "Our neighbors, they are very friendly.", ["Our neighbors are very friendly.", "Our neighbours are very friendly."],
      "Plural noun + are, without \"they\"."),
  fix("t3d", 3, 2, "My manager, he is in a meeting.", ["My manager is in a meeting."], "My manager is…", task="Rewrite without repeating the subject"),
  fix("t3e", 3, 2, "The students, they're ready for the exam.", ["The students are ready for the exam."],
      "Plural noun + are.", task="Rewrite without repeating the subject"),
  # 4. what if
  fix("t4a", 4, 1, "What if just I ask the instructor?", ["What if I ask the instructor?"],
      "Remove just. Capital W and a question mark count here.", strict=True, task="Rewrite as a clear question, removing just"),
  fix("t4b", 4, 1, "What if just we call the office?", ["What if we call the office?"],
      "Remove just. Capital W and a question mark count here.", strict=True, task="Rewrite as a clear question, removing just"),
  fix("t4c", 4, 1, "What if just I try again tomorrow?", ["What if I try again tomorrow?"],
      "Remove just. Capital W and a question mark count here.", strict=True, task="Rewrite as a clear question, removing just"),
  fix("t4d", 4, 2, "what if I try one more time here", ["What if I try one more time here?"],
      "Capital W at the start and a question mark at the end.", strict=True, task="Add capitalization and punctuation"),
  fix("t4e", 4, 2, "what if just we check the instructions", ["What if we check the instructions?"],
      "Capital W, remove just, question mark at the end.", strict=True, task="Add capitalization and punctuation"),
  # 5. enroll in
  gap("t5a", 5, 1, "I enrolled ___ a writing course.", ["in"], "enroll IN a course."),
  gap("t5b", 5, 1, "She enrolled ___ the university's MBA program.", ["in"], "enroll IN a program."),
  gap("t5c", 5, 1, "They enrolled ___ an online certificate program.", ["in"], "enroll IN a program."),
  fix("t5d", 5, 2, "He enrolled for a course in data science.", ["He enrolled in a course in data science."], "enrolled IN, not for."),
  fix("t5e", 5, 2, "We enrolled for the evening program last month.", ["We enrolled in the evening program last month."], "enrolled IN, not for."),
  # 6. Mixed practice (MC)
  mc("t6a", 6, 1, "Choose the sentence with correct subject-verb agreement and noun number.",
     ["This is a Philips headphone.", "This are a Philips headphone.", "This is a Philips headphones.", "This, it is a Philips headphone."], 0,
     "This + is + one item, no \"it\".", skill=SK[1]),
  mc("t6b", 6, 1, "Choose the sentence with the correct article.",
     ["If I won million dollars, I would travel.", "If I won an million dollars, I would travel.",
      "If I won a dollars million, I would travel.", "If I won a million dollars, I would travel."], 3,
     "a million dollars, in that order.", skill=SK[2]),
  mc("t6c", 6, 1, "Choose the sentence that avoids a repeated subject pronoun.",
     ["My wife, she is angry.", "My wife are angry.", "My wife angry.", "My wife is angry."], 3,
     "Noun subject + is, no pronoun.", skill=SK[3]),
  mc("t6d", 6, 1, "Choose the clear, correctly punctuated question.",
     ["What if just I try one more time here?", "What if try I one more time here?", "What if I try one more time here?",
      "What if I try one more time here."], 2,
     "No just, normal word order, question mark.", skill=SK[4]),
  mc("t6e", 6, 1, "Choose the correct preposition for joining a program.",
     ["I enrolled a new MBA program.", "I enrolled in a new MBA program.", "I enrolled to a new MBA program.",
      "I enrolled for a new MBA program."], 1,
     "enroll IN a program.", skill=SK[5]),
  # 6. Sentence transformation
  fix("t6f", 6, 2, "My cousin, she is studying engineering.", ["My cousin is studying engineering."],
      "Remove \"she\": My cousin is…", task="Rewrite without the repeated pronoun", skill=SK[3]),
  fix("t6g", 6, 2, "If I earned million dollars, I would support my family.", ["If I earned a million dollars, I would support my family."],
      "a million dollars.", task="Correct the article", skill=SK[2]),
  fix("t6h", 6, 2, "Rina enrolled for a language course.", ["Rina enrolled in a language course."],
      "enrolled IN.", task="Correct the preposition", skill=SK[5]),
  fix("t6i", 6, 2, "what if just I try again here.", ["What if I try again here?"],
      "Capital W, no just, question mark.", strict=True, task="Correct the word order and punctuation", skill=SK[4]),
  fix("t6j", 6, 2, "This, it's a Philips headphones.", HEADPHONE,
      "No \"it\" and a singular noun." + HP_NOTE, task="Correct the demonstrative, verb, and noun", skill=SK[1]),
  # Meus (mesmo tema)
  mc("x3a", 1, None, "These ___ my new headphones.", ["are", "is", "am", "be"], 0,
     "These is plural → are.", source="extra"),
  mc("x3b", 5, None, "I want to enroll ___ an English course next year.", ["in", "for", "to", "on"], 0,
     "enroll IN a course.", source="extra"),
  fix("x3c", 3, None, "My boss, he wants the report today.", ["My boss wants the report today."],
      "Noun subject + verb, no \"he\".", source="extra"),
  gap("x3d", 2, None, "If we had ___ million reais, we would open a company.", ["a"],
      "a million, also with reais.", source="extra"),
  fix("x3e", 4, None, "what if just we postpone the meeting", ["What if we postpone the meeting?"],
      "Capital W, no just, question mark.", strict=True, task="Rewrite as a clear question", source="extra"),
]

WRITING = [{
  "id": "pw1", "slide": 6, "ex": 3,
  "prompt": "Write a short paragraph about a goal, course, or opportunity you would pursue.",
  "checklist": [
    "A sentence beginning with This is…",
    "A sentence with a million dollars",
    "A sentence with a noun subject and is, without repeating the subject with a pronoun",
    "A question beginning with What if I try…?",
    "A sentence using … (the file ends here — probably enroll in)",
  ],
  "model": ("This is my plan for next year. I want to enroll in an MBA program with a focus on supply chain. "
            "My manager is very supportive, and the company may pay part of the cost. "
            "Of course, if I had a million dollars, I would study abroad for a year! "
            "What if I try to get a scholarship first?"),
}]

LESSON = {
  "id": "l003", "number": 3, "date": "2026-11-12", "format": 4,
  "title": "Five Recurring Errors",
  "subtitle": "This is · a million · no repeated subject · What if I…? · enroll in",
  "level": "Grammar practice",
  "source": "Grammar Practice: Five Recurring Errors",
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
print("ok", len(SLIDES), "telas ·", len(PRACTICE), "exercícios (", sum(p["source"] == "teacher" for p in PRACTICE), "dela )")
