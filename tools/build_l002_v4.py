"""Lição 2 · 04/11/2026 · Second & Third Conditionals (material da professora: 2nd_3rd_mixed_1.pdf)
Gera data/v4/l002.json e atualiza data/v4/lessons.json. Rode: python3 tools/build_l002_v4.py

Material da professora (reproduzido fielmente):
- Second Conditional: regra + exemplos; Exercise 1 (complete with would), 2 (make sentences),
  3 (answer with your own ideas), 4 (correct the mistakes).
- Third Conditional: o mesmo formato.
Exercise 3 (perguntas abertas) → perguntas das lâminas, respostas-modelo em blocos (criadas aqui).
Exercises 1, 2 e 4 → Practice (source "teacher"). Mais 6 exercícios meus (source "extra").
A professora não enviou gabarito: as respostas foram criadas aqui.
"""
import json, pathlib

def X(en, meaning):
    return {"en": en, "meaning": meaning}

def Q(id, question, blocks, explain):
    return {"id": id, "kind": "class", "ex": 3, "question": question, "blocks": blocks, "explain": explain}

EX_TITLES = {
  1: {1: "Exercise 1: Use would / wouldn't and the verb in brackets", 2: "Exercise 2: Make second conditional sentences",
      3: "Exercise 3: Answer these questions using your own ideas", 4: "Exercise 4: Correct the mistakes"},
  2: {1: "Exercise 1: Complete the sentences", 2: "Exercise 2: Make third conditional sentences",
      3: "Exercise 3: Answer these questions with your own ideas", 4: "Exercise 4: Correct the mistakes"},
}

SLIDES = [
  {
    "id": "s1", "n": 1, "title": "Second Conditional",
    "question": "What would you do if things were different now?",
    "summary": "We use the second conditional for imaginary or unlikely situations in the present or future. The if-clause uses the past simple and the main clause uses would + verb. We often say \"were\" instead of \"was\": If I were rich, I would travel.",
    "expressions": [
      X("If + past simple, would + verb", "an imaginary situation now: If I had time, I would help."),
      X("If I were…", "\"were\" is common for all people: If she were here…"),
      X("would / wouldn't + verb", "the imaginary result: I would go. I wouldn't stay."),
      X("If I were you, I would…", "a very common way to give advice."),
      X("What would you do if…?", "the question form: would comes before the subject."),
    ],
    "items": [
      Q("c2a", "What would you do if you had a million dollars?",
        ["If I had a million dollars,", "I would buy a house", "and travel around", "the world."],
        "If + past simple (had), then would + verb (would buy)."),
      Q("c2b", "If you could live anywhere, where would you live?",
        ["If I could live anywhere,", "I would live", "near the sea", "in Portugal."],
        "\"Could\" is the past of can, so it works in the if-clause."),
      Q("c2c", "If you could meet any famous person, who would you meet?",
        ["If I could meet anyone,", "I would meet Roger Federer", "and ask him", "about his discipline."],
        "You can join two results with \"and\": I would meet him and ask him…"),
      Q("c2d", "If you had a superpower, what would it be?",
        ["If I had a superpower,", "it would be", "the ability to fly."],
        "\"It would be…\" is a simple way to name your choice."),
      Q("c2e", "If you didn't have to work or study, how would you spend your time?",
        ["If I didn't have to work,", "I would spend my time", "travelling with my family."],
        "Negative if-clause: didn't + verb. Spend time + -ING: spend my time travelling."),
    ],
  },
  {
    "id": "s2", "n": 2, "title": "Third Conditional",
    "question": "How would things have been different in the past?",
    "summary": "We use the third conditional for imaginary situations in the past: things that didn't happen. The if-clause uses had + past participle and the main clause uses would have + past participle. Use might have or could have when you are less sure.",
    "expressions": [
      X("If + had + past participle", "the imaginary past: If I had studied…"),
      X("would have + past participle", "the imaginary past result: I would have passed."),
      X("might have / could have", "a less certain result: I might have passed."),
      X("If I hadn't…, I wouldn't have…", "the negative form: If I hadn't missed the bus…"),
      X("What would you have done if…?", "the question form about the past."),
    ],
    "items": [
      Q("c3a", "What would you have done if you had won the lottery last year?",
        ["If I had won the lottery,", "I would have", "paid off my house", "and travelled more."],
        "If + had won, then would have + past participle (paid, travelled)."),
      Q("c3b", "If you had known English earlier, how would your life have been different?",
        ["If I had learned English earlier,", "I would have had", "more opportunities", "at work."],
        "\"Would have had\" is correct: have + the past participle of have (had)."),
      Q("c3c", "If you had met your best friend earlier, how would things have changed?",
        ["If I had met him earlier,", "we would have shared", "many more", "good moments."],
        "Met is the past participle of meet: had met."),
      Q("c3d", "Where would you have gone if you had had more time last summer?",
        ["If I had had more time,", "I would have gone", "to the beach", "for a week."],
        "\"Had had\" is normal English: past perfect of have. Gone is the participle of go."),
      Q("c3e", "If you hadn't chosen your current job, what would you have done instead?",
        ["If I hadn't chosen this job,", "I would have", "studied law", "instead."],
        "Negative past perfect: hadn't + past participle (chosen)."),
    ],
  },
]

def gap(id, slide, ex, prompt, accept, explain, tip="", skill=None, source="teacher"):
    return {"id": id, "type": "gap", "skill": skill or ("Second conditional" if slide == 1 else "Third conditional"),
            "slide": slide, "source": source, "ex": ex if source == "teacher" else None, "prompt": prompt,
            "accept": accept, "explain": explain, "tip": tip}

def order(id, slide, ex, prompt, blocks, explain, tip="", skill=None, source="teacher"):
    return {"id": id, "type": "order", "skill": skill or ("Second conditional" if slide == 1 else "Third conditional"),
            "slide": slide, "source": source, "ex": ex if source == "teacher" else None, "prompt": prompt,
            "blocks": blocks, "explain": explain, "tip": tip}

def fix(id, slide, ex, wrong, accept, explain, tip="", skill=None, source="teacher"):
    return {"id": id, "type": "fix", "skill": skill or ("Second conditional" if slide == 1 else "Third conditional"),
            "slide": slide, "source": source, "ex": ex if source == "teacher" else None, "prompt": wrong,
            "accept": accept, "explain": explain, "tip": tip}

def mc(id, slide, prompt, options, answer, explain, tip="", skill=None):
    return {"id": id, "type": "mc", "skill": skill or ("Second conditional" if slide == 1 else "Third conditional"),
            "slide": slide, "source": "extra", "ex": None, "prompt": prompt, "options": options, "answer": answer,
            "explain": explain, "tip": tip}

W = lambda v: [f"would {v}", f"'d {v}"]
WH = lambda v: [f"would have {v}", f"'d have {v}"]

PRACTICE = [
  # ---------- Second Conditional · Exercise 1 ----------
  gap("t2e1a", 1, 1, "If I had more free time, I ___ (learn) another language.", W("learn"),
      "Main clause: would + verb. If + past simple (had).", "Great for talking about plans you can't do yet."),
  gap("t2e1b", 1, 1, "If she were here, she ___ (help) us.", W("help"),
      "\"Were\" in the if-clause, would + verb in the result."),
  gap("t2e1c", 1, 1, "If they lived near the sea, they ___ (go) swimming every day.", W("go"),
      "Would + verb: would go. \"Go swimming\" is a fixed expression."),
  gap("t2e1d", 1, 1, "If I were rich, I ___ (travel) around the world.", W("travel"),
      "Would + base verb, without \"to\": would travel."),
  gap("t2e1e", 1, 1, "If he didn't have to work tomorrow, he ___ (come) with us.", W("come"),
      "Negative if-clause (didn't have to), positive result (would come)."),
  # ---------- Second Conditional · Exercise 2 ----------
  order("t2e2a", 1, 2, "have more money / go on holiday", ["If I had", "more money,", "I would go", "on holiday."],
        "If + past simple (had), would + verb (would go)."),
  order("t2e2b", 1, 2, "be the president / change the law", ["If I were", "the president,", "I would change", "the law."],
        "With \"be\" we usually say \"If I were\"."),
  order("t2e2c", 1, 2, "know French / live in Paris", ["If I knew French,", "I would live", "in Paris."],
        "Knew is the past simple of know."),
  order("t2e2d", 1, 2, "be taller / play basketball", ["If I were taller,", "I would play", "basketball."],
        "If I were + adjective, then would + verb."),
  order("t2e2e", 1, 2, "see a ghost / run away", ["If I saw", "a ghost,", "I would", "run away."],
        "Saw is the past simple of see."),
  # ---------- Second Conditional · Exercise 4 ----------
  fix("t2e4a", 1, 4, "If I will see him, I would tell him the news.",
      ["If I saw him, I would tell him the news.", "If I see him, I will tell him the news."],
      "Never use will in the if-clause. Second conditional: If I saw him, I would tell him.",
      "If you mean a real possibility, the first conditional also works: If I see him, I will tell him."),
  fix("t2e4b", 1, 4, "If she have more time, she would learn Spanish.",
      ["If she had more time, she would learn Spanish."],
      "The if-clause needs the past simple: had."),
  fix("t2e4c", 1, 4, "I would help you if I am free.",
      ["I would help you if I were free.", "I would help you if I was free."],
      "The if-clause needs the past: were (or was). The if-clause can come second."),
  fix("t2e4d", 1, 4, "If they lives in Canada, they would speak English every day.",
      ["If they lived in Canada, they would speak English every day."],
      "Past simple in the if-clause: lived."),
  fix("t2e4e", 1, 4, "What you would do if you won the lottery?",
      ["What would you do if you won the lottery?"],
      "In questions, would comes before the subject: What would you do…?"),
  # ---------- Third Conditional · Exercise 1 ----------
  gap("t3e1a", 2, 1, "If I ___ (study) harder, I ___ (pass) the exam.", [["had studied", "'d studied"], WH("passed")],
      "If + had + past participle; main clause: would have + past participle."),
  gap("t3e1b", 2, 1, "If they ___ (leave) earlier, they ___ (catch) the train.", [["had left", "'d left"], WH("caught")],
      "Irregular participles: leave → left, catch → caught."),
  gap("t3e1c", 2, 1, "If she ___ (know) about the meeting, she ___ (come).", [["had known", "'d known"], WH("come")],
      "Irregular participles: know → known, come → come."),
  gap("t3e1d", 2, 1, "If we ___ (book) the tickets in advance, we ___ (get) better seats.", [["had booked", "'d booked"], WH("got") + WH("gotten")],
      "Get → got (British) or gotten (American). Both are correct."),
  gap("t3e1e", 2, 1, "If he ___ (drive) more carefully, he ___ (avoid) the accident.", [["had driven", "'d driven"], WH("avoided")],
      "Irregular participle: drive → driven."),
  # ---------- Third Conditional · Exercise 2 ----------
  order("t3e2a", 2, 2, "not forget my umbrella / not get wet", ["If I hadn't forgotten", "my umbrella,", "I wouldn't have", "gotten wet."],
        "Negative: hadn't + participle, wouldn't have + participle."),
  order("t3e2b", 2, 2, "know about the party / go", ["If I had known", "about the party,", "I would have gone."],
        "Know → known, go → gone."),
  order("t3e2c", 2, 2, "study medicine / become a doctor", ["If I had studied", "medicine,", "I would have become", "a doctor."],
        "Become → become (same form)."),
  order("t3e2d", 2, 2, "set an alarm / wake up on time", ["If I had set", "an alarm,", "I would have woken up", "on time."],
        "Set → set, wake → woken."),
  order("t3e2e", 2, 2, "save more money / buy a new phone", ["If I had saved", "more money,", "I would have bought", "a new phone."],
        "Buy → bought."),
  # ---------- Third Conditional · Exercise 4 ----------
  fix("t3e4a", 2, 4, "If I would have seen her, I would have said hello.",
      ["If I had seen her, I would have said hello."],
      "No \"would\" in the if-clause. Use had + past participle: If I had seen her."),
  fix("t3e4b", 2, 4, "If they had knew, they would have helped us.",
      ["If they had known, they would have helped us."],
      "After had we need the past participle: known, not knew."),
  fix("t3e4c", 2, 4, "I had come if you had invited me.",
      ["I would have come if you had invited me."],
      "The main clause needs would have + past participle."),
  fix("t3e4d", 2, 4, "If she wouldn't have lost her passport, she wouldn't have missed the flight.",
      ["If she hadn't lost her passport, she wouldn't have missed the flight."],
      "No \"would\" in the if-clause: If she hadn't lost…"),
  fix("t3e4e", 2, 4, "What you would have done if it had rained?",
      ["What would you have done if it had rained?"],
      "In questions, would comes before the subject: What would you have done…?"),
  # ---------- Meus: mesmo tema ----------
  mc("x2a", 1, "If I ___ you, I would talk to her.", ["were", "am", "will be", "would be"], 0,
     "\"If I were you\" is the fixed form for advice.", "At work: \"If I were you, I would check the contract again.\""),
  mc("x2b", 1, "If she ___ the job, she would move to London.", ["got", "gets", "will get", "would get"], 0,
     "Second conditional: past simple in the if-clause."),
  fix("x2c", 1, None, "If I would know the answer, I would tell you.",
      ["If I knew the answer, I would tell you."],
      "Never would in the if-clause. Know → knew.", source="extra"),
  mc("x3a", 2, "If I had known about the traffic, I ___ earlier.", ["would have left", "would leave", "will leave", "left"], 0,
     "Past situation → third conditional: would have + past participle.", "\"If I had known, I would have…\" is very common in apologies."),
  mc("x3b", 2, "I wouldn't have missed the meeting if I ___ the email.", ["had read", "read", "would read", "have read"], 0,
     "If-clause about the past: had + past participle (read)."),
  order("x3c", 2, None, "Build the sentence: a past regret at work.",
        ["If I had spoken", "better English,", "I would have got", "the promotion."],
        "Speak → spoken. Get → got.", "Useful to talk about past chances.", source="extra"),
]

LESSON = {
  "id": "l002", "number": 2, "date": "2026-11-04", "format": 4,
  "title": "Second & Third Conditionals",
  "subtitle": "Imaginary situations now and in the past",
  "level": "B2 Grammar",
  "source": "2nd_3rd_mixed_1.pdf",
  "exercises": EX_TITLES,
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
print("ok", len(SLIDES), "lâminas ·", len(PRACTICE), "exercícios no Practice (",
      sum(p["source"] == "teacher" for p in PRACTICE), "da professora )")
