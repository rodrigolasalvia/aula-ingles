"""Lição 1 · 28/10/2026 · The Comparison Illusion / Are You Choosing for Yourself? / Is Envy Always a Bad Thing?
Gera data/l001.json. Rode: python3 tools/build_l001.py
"""
import json, pathlib

L = {
  "id": "l001",
  "number": 1,
  "date": "2026-10-28",
  "title": "Comparison, Choices & Envy",
  "subtitle": "Comparação nas redes, pressão social e inveja",
  "level": "B2 Speaking",
  "overview": (
    "A aula é de **conversação argumentativa**. A professora vai pedir que você dê opinião e defenda posições "
    "sobre três ideias ligadas entre si: (1) o que vemos nas redes é uma imagem selecionada, não a realidade; "
    "(2) a pressão social pode nos levar a decidir contra os nossos valores; (3) a inveja pode destruir ou motivar."
  ),
  "classGoals": [
    "Usar as 18 expressões com a preposição certa, sem traduzir do português.",
    "Justificar opiniões com estrutura: posição → motivo → exemplo → conclusão.",
    "Reagir a contra-argumentos sem travar (\"That said…\", \"I agree up to a point…\").",
    "Especular sobre o passado (might have + particípio) e sobre hipóteses (would).",
  ],

  "scenarios": [
    {
      "id": "sc1", "slide": 1, "title": "The Comparison Illusion",
      "question": "Are we comparing our real lives to a fake reality?",
      "en": ("A lifestyle influencer posts beautiful photos of her home, expensive dinners, and relaxing weekends. "
             "Her followers assume she has a nearly perfect life. What they don't see are the staged photographs, "
             "financial pressures, exhausting work, and ordinary problems behind the scenes."),
      "pt": ("Uma influenciadora posta fotos lindas da casa, de jantares caros e de fins de semana tranquilos. "
             "Os seguidores supõem que a vida dela é quase perfeita. O que eles não veem: fotos encenadas, "
             "pressão financeira, trabalho exaustivo e problemas comuns nos bastidores."),
      "key": "What we see online is often a carefully curated image, not the full reality.",
      "notes": [
        "**assume** = supor, presumir (não é \"assumir\").",
        "**staged** = encenado, montado.",
        "**behind the scenes** = nos bastidores.",
        "**exhausting** (algo que cansa) ≠ **exhausted** (a pessoa cansada).",
      ],
    },
    {
      "id": "sc2", "slide": 2, "title": "Are You Choosing for Yourself?",
      "question": "How much are your decisions really yours — and how much are they influenced by others?",
      "en": ("Sarah has always preferred a simple lifestyle. She enjoys her job, saves money, and rarely feels the need "
             "to buy expensive things. Recently, several people in her social circle have started buying luxury brands, "
             "upgrading their homes, and spending more on their appearance. Sarah begins making similar purchases — not "
             "because she genuinely wants them, but because she worries that her choices make her seem less successful. "
             "A few months later, she has less savings, more financial pressure, and a lifestyle that doesn't really suit her."),
      "pt": ("Sarah sempre preferiu uma vida simples. Gosta do trabalho, poupa e raramente sente necessidade de comprar "
             "coisas caras. Recentemente, várias pessoas do círculo dela começaram a comprar marcas de luxo, reformar a casa "
             "e gastar mais com a aparência. Sarah passa a fazer compras parecidas — não porque queira de verdade, mas porque "
             "teme que as escolhas dela a façam parecer menos bem-sucedida. Meses depois, tem menos economias, mais pressão "
             "financeira e um estilo de vida que não combina com ela."),
      "key": "Your choices. Your values. Your life.",
      "notes": [
        "**has always preferred** = present perfect: algo verdadeiro desde sempre até agora.",
        "**have started buying** = present perfect + recently: mudança recente com efeito agora.",
        "**genuinely** = de verdade, sinceramente (não \"geniosamente\").",
        "**suit someone** = combinar com alguém, servir para alguém.",
      ],
    },
    {
      "id": "sc3", "slide": 3, "title": "Is Envy Always a Bad Thing?",
      "question": "Can envy be a destructive emotion — or can it sometimes push us forward?",
      "en": ("Destructive envy: you become resentful of someone else's success, question your own abilities, "
             "or secretly hope they fail. Motivating envy: someone's achievements reveal what you want for yourself "
             "and encourage you to take action."),
      "pt": ("Inveja destrutiva: você fica ressentido com o sucesso alheio, duvida da própria capacidade ou torce em "
             "segredo para o outro fracassar. Inveja motivadora: as conquistas de alguém mostram o que você quer para si "
             "e te encorajam a agir."),
      "key": "Same feeling. Different outcomes.",
      "notes": [
        "**resentful of** = ressentido com (preposição OF).",
        "**encourage someone TO do** something.",
        "**envy** = inveja · **jealousy** = ciúme (medo de perder alguém). Em inglês informal os dois se misturam; na aula, prefira envy/envious.",
      ],
    },
  ],

  "phrases": [
    # Slide 1
    {"id": "p01", "slide": 1, "en": "present a carefully curated image", "pt": "passar uma imagem cuidadosamente selecionada",
     "pattern": "present + a/an + adjetivo + image", "example": "Most people present a carefully curated image on social media.",
     "use": "Redes sociais, marketing, marca pessoal, currículo.", "keys": [r"curated"]},
    {"id": "p02", "slide": 1, "en": "show only the highlights", "pt": "mostrar só os melhores momentos",
     "pattern": "highlights = melhores momentos (highlight reel = compilação)", "example": "On Instagram, people show only the highlights of their week.",
     "use": "Quando alguém mostra só o lado bom de algo.", "keys": [r"highlight"]},
    {"id": "p03", "slide": 1, "en": "create a false impression", "pt": "criar uma impressão falsa",
     "pattern": "create/give a false impression OF something (não \"make\")", "example": "Those photos create a false impression of an easy life.",
     "use": "Propaganda, apresentações, relatórios maquiados.", "keys": [r"false impression"]},
    {"id": "p04", "slide": 1, "en": "take something at face value", "pt": "aceitar algo pelo que parece, sem questionar",
     "pattern": "take + algo + AT face value", "example": "I never take online reviews at face value.",
     "use": "Avaliar informações, notícias, promessas de vendedores.", "keys": [r"face value"]},
    {"id": "p05", "slide": 1, "en": "distort your perception of reality", "pt": "distorcer sua percepção da realidade",
     "pattern": "perception OF something", "example": "Constant scrolling can distort your perception of reality.",
     "use": "Efeitos das redes, do noticiário, de comparações.", "keys": [r"distort"]},
    {"id": "p06", "slide": 1, "en": "reveal only part of the story", "pt": "revelar só parte da história",
     "pattern": "part OF the story", "example": "A single photo reveals only part of the story.",
     "use": "Quando falta contexto para julgar algo.", "keys": [r"part of the story"]},
    # Slide 2
    {"id": "p07", "slide": 2, "en": "lose sight of your own priorities", "pt": "perder de vista suas prioridades",
     "pattern": "lose sight OF something (lose / lost / lost)", "example": "When you compare yourself all the time, you lose sight of your own priorities.",
     "use": "Trabalho, carreira, vida pessoal: esquecer o que importa.", "keys": [r"(lose|lost|losing|loses) sight of"]},
    {"id": "p08", "slide": 2, "en": "be driven to prove yourself", "pt": "ser movido pela necessidade de se provar",
     "pattern": "driven TO + verbo base (driven to prove) · compare: driven BY + substantivo", "example": "After her promotion, she was driven to prove herself.",
     "use": "Motivação para mostrar valor (novo cargo, novo time).", "keys": [r"driven to prove"]},
    {"id": "p09", "slide": 2, "en": "seek external validation", "pt": "buscar validação externa (aprovação dos outros)",
     "pattern": "seek / sought / sought + validation", "example": "Posting every achievement can be a way to seek external validation.",
     "use": "Quando alguém precisa de aprovação para se sentir bem.", "keys": [r"validation"]},
    {"id": "p10", "slide": 2, "en": "give in to social pressure", "pt": "ceder à pressão social",
     "pattern": "give in TO + substantivo/-ING (o TO é preposição)", "example": "Sarah gave in to social pressure and bought a luxury bag.",
     "use": "Ceder a pressões de grupo, de chefes, de vendedores.", "keys": [r"(give|gave|giving|gives|given) in to"]},
    {"id": "p11", "slide": 2, "en": "make decisions based on appearances", "pt": "tomar decisões com base nas aparências",
     "pattern": "based ON (nunca \"based in\" nesse sentido)", "example": "If you make decisions based on appearances, you end up living someone else's life.",
     "use": "Compras, contratações, escolhas de carreira.", "keys": [r"based on appearance"]},
    {"id": "p12", "slide": 2, "en": "measure success on your own terms", "pt": "medir o sucesso pelos seus próprios critérios",
     "pattern": "ON your own terms", "example": "For me, success means having time for my family; I measure it on my own terms.",
     "use": "Valores pessoais, carreira, estilo de vida.", "keys": [r"on (my|your|his|her|our|their|one's) own terms"]},
    # Slide 3
    {"id": "p13", "slide": 3, "en": "be driven by envy", "pt": "ser movido pela inveja",
     "pattern": "driven BY + substantivo", "example": "Some decisions are driven by envy, not by real goals.",
     "use": "Explicar a motivação (ruim) por trás de uma atitude.", "keys": [r"driven by envy"]},
    {"id": "p14", "slide": 3, "en": "turn envy into motivation", "pt": "transformar inveja em motivação",
     "pattern": "turn X INTO Y", "example": "Instead of complaining, he turned his envy into motivation.",
     "use": "Transformar algo negativo em algo útil.", "keys": [r"into motivation"]},
    {"id": "p15", "slide": 3, "en": "acknowledge your insecurities", "pt": "reconhecer suas inseguranças",
     "pattern": "acknowledge + objeto direto (sem preposição)", "example": "The first step is to acknowledge your insecurities.",
     "use": "Autoconhecimento, feedback, conversas difíceis.", "keys": [r"acknowledg"]},
    {"id": "p16", "slide": 3, "en": "feel threatened by someone's success", "pt": "sentir-se ameaçado pelo sucesso de alguém",
     "pattern": "threatened BY (adjetivo -ED = como a pessoa se sente)", "example": "Good leaders don't feel threatened by their team's success.",
     "use": "Competição no trabalho, entre amigos, entre irmãos.", "keys": [r"threatened by"]},
    {"id": "p17", "slide": 3, "en": "channel your energy into something productive", "pt": "canalizar sua energia para algo produtivo",
     "pattern": "channel X INTO Y (não \"to\")", "example": "She channelled her frustration into a new project.",
     "use": "Lidar com frustração, raiva, ansiedade.", "keys": [r"channel"]},
    {"id": "p18", "slide": 3, "en": "take inspiration from someone", "pt": "inspirar-se em alguém",
     "pattern": "take inspiration FROM (não \"in\")", "example": "I take inspiration from people who started from scratch.",
     "use": "Falar de referências, mentores, modelos.", "keys": [r"inspiration from"]},
  ],

  "grammar": [
    {"id": "g1", "title": "Preposições presas às expressões",
     "rule": "Nestas expressões a preposição faz parte do bloco. Decore a expressão inteira, não a palavra solta. Os erros de brasileiro vêm da tradução: \"baseado em\" → based in ✗.",
     "examples": [["based ON appearances", "com base em"], ["take inspiration FROM", "inspirar-se em"], ["threatened BY", "ameaçado por"],
                  ["turn / channel X INTO Y", "transformar / canalizar em"], ["AT face value", "pelo valor de face"], ["ON your own terms", "pelos seus critérios"],
                  ["resentful OF", "ressentido com"], ["lose sight OF", "perder de vista"]],
     "pairs": [["It was based in appearances.", "It was based on appearances."], ["I take inspiration in her.", "I take inspiration from her."]]},
    {"id": "g2", "title": "-ING ou TO dentro do material",
     "rule": "Regra prática: depois de PREPOSIÇÃO (inclusive o TO de \"give in to\") vem substantivo ou -ING. Depois de certos verbos vem TO + verbo base. \"Driven\" aceita os dois caminhos com sentidos diferentes.",
     "examples": [["be driven TO prove yourself", "TO + verbo"], ["be driven BY envy", "BY + substantivo"], ["give in TO pressure / TO buying things", "TO preposição"],
                  ["stop making decisions", "parar de"], ["stop to think", "parar PARA pensar"], ["avoid meeting people", "avoid + -ING"],
                  ["learn to deal with", "learn + TO"], ["encourage you to take action", "encourage someone TO"]],
     "pairs": [["She was driven to proving herself.", "She was driven to prove herself."], ["Sarah stopped to buy things she didn't need.", "Sarah stopped buying things she didn't need."]]},
    {"id": "g3", "title": "Adjetivos -ED × -ING",
     "rule": "-ING descreve o que causa a sensação (a coisa). -ED descreve quem sente (a pessoa). Erro clássico: \"I'm boring\" quando se quer dizer \"I'm bored\".",
     "examples": [["exhausting work", "trabalho exaustivo"], ["I'm exhausted", "estou exausto"], ["a convincing image", "imagem convincente"],
                  ["I'm not convinced", "não estou convencido"], ["threatening behaviour", "comportamento ameaçador"], ["I feel threatened", "me sinto ameaçado"]],
     "pairs": [["Social media can be very exhausted.", "Social media can be very exhausting."], ["I was very inspiring by her story.", "I was very inspired by her story."]]},
    {"id": "g4", "title": "Especular sobre o passado: might have + particípio",
     "rule": "Para supor o que aconteceu: might/may/could have + particípio (talvez); must have (com certeza, dedução forte); can't have (impossível). A pergunta da aula usa essa estrutura: \"What might have triggered the change?\"",
     "examples": [["What might have triggered the change?", "o que pode ter desencadeado?"], ["Seeing her friends might have triggered it.", "talvez tenha sido"],
                  ["She must have felt left behind.", "ela deve ter se sentido"], ["She can't have wanted those things.", "não é possível que quisesse"]],
     "pairs": [["What might triggered the change?", "What might have triggered the change?"], ["She must has felt pressure.", "She must have felt pressure."]]},
    {"id": "g5", "title": "Família de palavras (classe gramatical)",
     "rule": "O material troca muito de classe. Na fala, escolha a forma certa pela função: depois de artigo/possessivo → substantivo; depois de be/feel → adjetivo; para modificar verbo → advérbio.",
     "examples": [["envy (s./v.) · envious (adj.)", "inveja · invejoso"], ["perceive (v.) · perception (s.)", "perceber · percepção"],
                  ["validate (v.) · validation (s.)", "validar · validação"], ["insecure (adj.) · insecurity (s.)", "inseguro · insegurança"],
                  ["succeed · success · successful · successfully", "v. · s. · adj. · adv."], ["resent · resentment · resentful", "v. · s. · adj."]],
     "pairs": [["He is very envy of his brother.", "He is very envious of his brother."], ["It distorts your perceive of reality.", "It distorts your perception of reality."]]},
    {"id": "g6", "title": "Falsos amigos e hipóteses",
     "rule": "assume = supor (\"assumir um erro\" = admit; \"assumir um cargo\" = take on). pretend = fingir. Para hipóteses (\"Imagine your friend gets…\"), responda com WOULD: \"My first reaction would be…\" / \"If my friend got the job, I would…\".",
     "examples": [["Her followers assume she's happy.", "supõem"], ["I admit I was wrong.", "assumo que errei"], ["She pretends to be relaxed.", "finge"],
                  ["My first reaction would be surprise.", "seria"], ["If my friend got that job, I'd feel a bit frustrated.", "se conseguisse… eu me sentiria"]],
     "pairs": [["I assume that I made a mistake. (= admito)", "I admit that I made a mistake."], ["If my friend gets the job, I would be happy.", "If my friend got the job, I would be happy."]]},
  ],

  "kit": [
    {"group": "Dar opinião", "items": [["In my view, …", "Na minha visão…"], ["I'd argue that …", "Eu diria/defenderia que…"], ["I tend to think that …", "Tendo a achar que…"]]},
    {"group": "Concordar em parte / conceder", "items": [["I agree up to a point, but …", "Concordo até certo ponto, mas…"], ["That's true to some extent; however, …", "É verdade em parte; porém…"], ["That said, …", "Dito isso, …"]]},
    {"group": "Justificar e exemplificar", "items": [["The main reason is that …", "O principal motivo é que…"], ["Take Sarah, for example: …", "Veja a Sarah, por exemplo:"], ["It depends on whether …", "Depende de se…"]]},
    {"group": "Distinguir e concluir", "items": [["The key difference is whether …", "A diferença principal é se…"], ["All things considered, I'd say …", "Pesando tudo, eu diria…"], ["So my position is that …", "Então minha posição é que…"]]},
    {"group": "Ganhar tempo sem travar", "items": [["That's a tricky one. Let me think…", "Essa é difícil. Deixa eu pensar…"], ["It depends on what you mean by …", "Depende do que você quer dizer com…"], ["How can I put it…", "Como posso dizer…"]]},
  ],

  "questions": [
    {"id": "d1", "slide": 1, "en": "If you know that social media posts are carefully selected, why might they still influence your perception of other people's lives?",
     "tip": "Reconheça o paradoxo (eu sei, mas me afeta) → explique o porquê (repetição, emoção) → diga o que ajuda.",
     "model": ("I think it's because we see these images so often that they start to feel normal. Even if I know that people show only the highlights, "
               "my brain doesn't process that every time I scroll. So, little by little, those posts can distort my perception of reality. "
               "That said, being aware of it helps: when I remember that a photo reveals only part of the story, I'm less likely to take it at face value.")},
    {"id": "d2", "slide": 1, "en": "Is presenting an idealized version of yourself online a form of dishonesty, or is it simply a matter of privacy?",
     "tip": "Use \"It depends on…\" → defina os dois lados → trace a linha entre privacidade e enganar.",
     "model": ("In my view, it depends on the intention. Choosing to show only the highlights and keep your problems to yourself is simply a matter of privacy; nobody owes the internet the full story. "
               "However, if someone deliberately creates a false impression to sell products or gain followers, I'd argue that it becomes a form of dishonesty. "
               "So the line, for me, is between keeping things private and actively misleading people.")},
    {"id": "d3", "slide": 1, "en": "How can you distinguish between a genuinely successful life and a convincing public image?",
     "tip": "Admita a dificuldade → dê critérios concretos (consistência, o que não aparece) → conclua com cautela.",
     "model": ("That's a tricky one, because from the outside they can look exactly the same. I'd look at consistency over time and at what people don't show: "
               "their relationships, their stress, whether they talk openly about failures. Someone who is genuinely successful usually doesn't need to present "
               "a carefully curated image all the time. In the end, though, we can never be completely sure, so it's better not to take anyone's life at face value.")},
    {"id": "d4", "slide": 2, "en": "At what point did Sarah stop making decisions based on her own values? What might have triggered the change?",
     "tip": "\"I'd say it happened when…\" + especulação com might have + particípio.",
     "model": ("I'd say it happened when she started buying things not because she wanted them, but because she was worried about how she looked to others. "
               "What might have triggered the change was seeing her friends upgrade their homes and lifestyles. She probably felt she was falling behind, "
               "so she gave in to social pressure and lost sight of her own priorities.")},
    {"id": "d5", "slide": 2, "en": "Is it possible to enjoy luxury and still be influenced by social pressure? How can you tell the difference?",
     "tip": "Responda sim/não → dê um teste prático para diferenciar → conclua.",
     "model": ("Yes, I think both can happen at the same time. You can genuinely enjoy a nice watch and still buy it partly to impress people. "
               "One way to tell the difference is to ask yourself whether you would still buy it if nobody could see it. "
               "If the answer is no, you're probably seeking external validation and making decisions based on appearances, not on your own values.")},
    {"id": "d6", "slide": 2, "en": "Should people care about how others perceive their lifestyle, or should personal satisfaction come first? Defend your position.",
     "tip": "Tome posição → conceda um ponto ao outro lado (\"That said…\") → reafirme a posição.",
     "model": ("I'd argue that personal satisfaction should come first, but I don't think we can completely ignore other people's opinions. "
               "In some contexts, like work, image does matter to some extent. That said, if you make decisions based on appearances all the time, "
               "you end up living someone else's life. So my position is: listen to feedback, but measure success on your own terms.")},
    {"id": "d7", "slide": 3, "en": "Can envy be useful if it reveals something you genuinely want? Or does it always damage your peace of mind?",
     "tip": "Posição → exemplo pessoal curto → condição (\"as long as…\") → conclusão.",
     "model": ("I believe envy can be useful, as long as you're honest about it. If I feel envious of a colleague who speaks English fluently, that tells me something I genuinely want. "
               "The problem starts when I'm driven by envy instead of by my own goals. So the feeling itself isn't the issue; what matters is whether you turn envy into motivation "
               "or let it turn into resentment.")},
    {"id": "d8", "slide": 3, "en": "Imagine your friend gets an opportunity you've wanted for years. What would your first reaction be, and how would you handle it?",
     "tip": "Hipótese → use WOULD em todas as frases. Seja honesto sobre a primeira reação → diga como lidaria.",
     "model": ("To be honest, my first reaction would probably be a mix of happiness and frustration. I'd congratulate my friend, of course, but I might feel a little "
               "threatened by their success at first. Then I'd try to acknowledge my insecurities instead of hiding them, and maybe ask how they got the opportunity. "
               "That way, I could take inspiration from them rather than compete with them.")},
    {"id": "d9", "slide": 3, "en": "Is it better to avoid people who trigger your insecurities, or learn to deal with those feelings? Defend your answer.",
     "tip": "Posição → custo da alternativa → exceção razoável → resumo em uma frase.",
     "model": ("In most cases, I'd say it's better to learn to deal with those feelings. If you avoid everyone who makes you feel insecure, you also avoid people you could take inspiration from. "
               "The first step is to acknowledge your insecurities instead of running away from them. "
               "That said, if someone constantly makes you feel small on purpose, keeping your distance is a reasonable choice. "
               "So my answer is: deal with the feeling, but don't tolerate disrespect.")},
  ],

  "shadow": [
    "Even if I know that people show only the highlights, it can still distort my perception of reality.",
    "Choosing not to share your problems online is simply a matter of privacy.",
    "What might have triggered the change was seeing her friends upgrade their lifestyles.",
    "I'd argue that personal satisfaction should come first, but image does matter to some extent.",
    "The feeling itself isn't the issue; what matters is whether you turn envy into motivation.",
    "I'd try to acknowledge my insecurities instead of hiding them.",
  ],
}

T_COMP, T_VOC, T_PREP, T_ING, T_WORD, T_STRUCT, T_FALSE = (
  "Compreensão", "Vocabulário", "Preposições", "-ING ou TO", "Classe de palavra", "Tempos e estruturas", "Falsos amigos")

def mc(id, tag, prompt, options, answer, explain, slide=None):
  return {"id": id, "type": "mc", "tag": tag, "slide": slide, "prompt": prompt, "options": options, "answer": answer, "explain": explain}

def fix(id, tag, wrong, accept, explain, slide=None):
  return {"id": id, "type": "fix", "tag": tag, "slide": slide, "prompt": wrong, "accept": accept, "model": accept[0], "explain": explain}

def gap(id, tag, prompt, accept, full, explain, slide=None):
  return {"id": id, "type": "gap", "tag": tag, "slide": slide, "prompt": prompt, "accept": accept, "model": full, "explain": explain}

ITEMS = [
  # ---------- Sessão 1: compreensão ----------
  mc("c1", T_COMP, "What don't the influencer's followers see?",
     ["The staged photographs and financial pressures", "Her expensive dinners", "Her relaxing weekends", "Her beautiful home"], 0,
     "O cenário lista o que fica nos bastidores: fotos encenadas, pressão financeira, trabalho exaustivo e problemas comuns.", 1),
  mc("c2", T_COMP, "Why did Sarah start buying luxury brands?",
     ["She worried her choices made her seem less successful", "She genuinely wanted them", "Her salary increased", "Her job required it"], 0,
     "\"Not because she genuinely wants them, but because she worries that her choices make her seem less successful.\"", 2),
  mc("c3", T_COMP, "What happened to Sarah a few months later?",
     ["Less savings, more financial pressure and a lifestyle that doesn't suit her", "She felt more successful", "She got a promotion", "She made new friends"], 0,
     "O texto termina mostrando o custo: menos economias, mais pressão e um estilo de vida que não combina com ela.", 2),
  mc("c4", T_COMP, "According to the material, motivating envy happens when…",
     ["someone's achievements show you what you want and encourage you to act", "you secretly hope someone fails", "you question your own abilities", "you avoid successful people"], 0,
     "As outras três opções descrevem a inveja destrutiva (destructive envy).", 3),
  mc("c5", T_COMP, "Which sentence best summarises the whole lesson?",
     ["We often compare ourselves with incomplete information, and what we do with that comparison matters",
      "Social media should be avoided completely", "Luxury is always a sign of social pressure", "Envy is always destructive"], 0,
     "As três lâminas falam de comparação: com imagens editadas (1), com o círculo social (2) e o que fazemos com a inveja (3)."),
  # ---------- Sessão 1: vocabulário ----------
  mc("v1", T_FALSE, "\"Her followers assume she has a nearly perfect life.\" Here, assume means…",
     ["suppose or believe without proof", "take responsibility for", "admit", "pretend"], 0,
     "assume = supor, presumir. \"Assumir um erro\" em inglês é admit; \"assumir um cargo\" é take on.", 1),
  mc("v2", T_VOC, "If you take a post at face value, you…",
     ["believe it exactly as it appears", "check where it came from", "share it with friends", "criticise it publicly"], 0,
     "take something at face value = aceitar pelo que parece, sem questionar.", 1),
  mc("v3", T_VOC, "\"Sarah lost sight of her own priorities\" means that she…",
     ["forgot what really mattered to her", "couldn't see clearly", "changed her priorities on purpose", "lost her job"], 0,
     "lose sight of = perder de vista, esquecer o que importa.", 2),
  mc("v4", T_VOC, "Which phrase describes someone who posts every achievement to get likes and approval?",
     ["seek external validation", "channel your energy into something productive", "acknowledge your insecurities", "measure success on your own terms"], 0,
     "seek external validation = buscar aprovação dos outros.", 2),
  mc("v5", T_VOC, "\"Instead of feeling resentful, he decided to ______ and started studying for the certification.\"",
     ["turn his envy into motivation", "give in to social pressure", "show only the highlights", "create a false impression"], 0,
     "turn envy into motivation = usar a inveja como combustível para agir.", 3),
  mc("v6", T_VOC, "Which of these is NOT a sign of destructive envy?",
     ["taking inspiration from someone", "becoming resentful of someone's success", "secretly hoping someone fails", "questioning your own abilities"], 0,
     "take inspiration from someone é o lado motivador; as outras três estão na caixa \"Destructive envy\".", 3),
  mc("v7", T_VOC, "\"A single photo ______.\" Choose the phrase that fits best.",
     ["reveals only part of the story", "is driven by envy", "gives in to social pressure", "loses sight of its priorities"], 0,
     "reveal only part of the story = mostrar só parte da história.", 1),
  # ---------- Sessão 2: gramática (múltipla escolha) ----------
  mc("m1", T_PREP, "Sarah started making decisions based ___ appearances.", ["on", "in", "at", "of"], 0,
     "based ON. \"Based in\" só se usa para lugar: \"a company based in São Paulo\".", 2),
  mc("m2", T_PREP, "I don't take online reviews ___ face value.", ["at", "in", "on", "by"], 0, "take something AT face value.", 1),
  mc("m3", T_PREP, "She took inspiration ___ her former boss.", ["from", "in", "of", "on"], 0,
     "take inspiration FROM. O português \"inspirar-se em\" leva ao erro \"in\".", 3),
  mc("m4", T_PREP, "He felt threatened ___ his colleague's promotion.", ["by", "with", "for", "of"], 0,
     "threatened BY. Com particípio usado como adjetivo, o agente vem com BY.", 3),
  mc("m5", T_PREP, "She channelled her frustration ___ a new project.", ["into", "to", "for", "at"], 0,
     "channel X INTO Y, como turn X INTO Y.", 3),
  mc("m6", T_ING, "After the promotion, he was driven ___ himself.", ["to prove", "proving", "by prove", "to proving"], 0,
     "driven TO + verbo base. Compare: driven BY envy (substantivo).", 2),
  mc("m7", T_ING, "Sarah finally stopped ___ things she didn't need.", ["buying", "to buy", "buy", "bought"], 0,
     "stop + -ING = parar de fazer. stop + TO = parar PARA fazer outra coisa.", 2),
  mc("m8", T_ING, "Her success encouraged me ___ action.", ["to take", "taking", "take", "for taking"], 0,
     "encourage someone TO do something.", 3),
  mc("m9", T_ING, "Some people avoid ___ their insecurities.", ["acknowledging", "to acknowledge", "acknowledge", "acknowledged"], 0,
     "avoid + -ING. Outros do mesmo grupo: enjoy, keep, consider, mind.", 3),
  mc("m10", T_WORD, "Constant comparison can distort your ___ of reality.", ["perception", "perceive", "perceptive", "perceived"], 0,
     "Depois de possessivo (your) vem substantivo: perception.", 1),
  mc("m11", T_WORD, "The influencer's daily routine is actually ___.", ["exhausting", "exhausted", "exhaust", "exhaustion"], 0,
     "-ING para o que causa a sensação (a rotina). -ED para a pessoa: she is exhausted.", 1),
  mc("m12", T_STRUCT, "What ___ the change in Sarah's behaviour?", ["might have triggered", "might triggered", "might has triggered", "might have trigger"], 0,
     "Especular sobre o passado: might have + particípio (triggered).", 2),
  # ---------- Sessão 2: corrija a frase ----------
  fix("f1", T_PREP, "She made her decision based in appearances.",
      ["She made her decision based on appearances."], "based ON appearances. \"Based in\" é para lugar.", 2),
  fix("f2", T_PREP, "I always take inspiration in successful people.",
      ["I always take inspiration from successful people."], "take inspiration FROM.", 3),
  fix("f3", T_WORD, "He is very envy of his sister.",
      ["He is very envious of his sister."], "Depois de be + very → adjetivo: envious. Envy é substantivo ou verbo.", 3),
  fix("f4", T_FALSE, "I assume that I made a mistake. (quero dizer: admito)",
      ["I admit that I made a mistake.", "I admit I made a mistake."], "assume = supor. Para \"assumir um erro\", use admit.", 1),
  fix("f5", T_ING, "She was driven to proving herself.",
      ["She was driven to prove herself."], "driven TO + verbo base.", 2),
  fix("f6", T_STRUCT, "What might triggered the change?",
      ["What might have triggered the change?"], "might HAVE + particípio para especular sobre o passado.", 2),
  # ---------- Sessão 2: lacunas ----------
  gap("x1", T_VOC, "Don't take everything you see online at face ___.", ["value"], "Don't take everything you see online at face value.",
      "take something at face VALUE.", 1),
  gap("x2", T_VOC, "She slowly lost ___ of her own priorities.", ["sight"], "She slowly lost sight of her own priorities.",
      "lose SIGHT of something.", 2),
  gap("x3", T_PREP, "He finally gave in ___ social pressure and bought the car.", ["to"], "He finally gave in to social pressure and bought the car.",
      "give in TO.", 2),
  gap("x4", T_PREP, "Try to turn your envy ___ motivation.", ["into"], "Try to turn your envy into motivation.", "turn X INTO Y.", 3),
  gap("x5", T_PREP, "I prefer to measure success ___ my own terms.", ["on"], "I prefer to measure success on my own terms.", "ON your own terms.", 2),
  gap("x6", T_WORD, "Many people post their achievements to seek external ___. (validate)", ["validation"],
      "Many people post their achievements to seek external validation.", "Depois de adjetivo (external) vem substantivo: validation.", 2),
  # ---------- Sessão 4: mistura final ----------
  mc("r1", T_FALSE, "My partner gets ___ when other people flirt with me.", ["jealous", "envious", "envy", "jealousy"], 0,
     "Medo de perder alguém = jealous (ciúme). Querer o que o outro tem = envious (inveja).", 3),
  mc("r2", T_STRUCT, "If my friend got the job I wanted, I ___ happy for her, but a bit frustrated.", ["would feel", "will feel", "would felt", "feel"], 0,
     "Hipótese no presente: If + passado → would + verbo base.", 3),
  mc("r3", T_WORD, "He felt ___ of his brother's success.", ["envious", "envy", "enviable", "envying"], 0,
     "feel + adjetivo: envious. Enviable = invejável (a coisa que causa inveja).", 3),
  mc("r4", T_WORD, "Her public image was so ___ that nobody questioned it.", ["convincing", "convinced", "convince", "conviction"], 0,
     "A imagem causa o efeito → -ING. A pessoa fica convinced.", 1),
]
L["items"] = ITEMS

L["sessions"] = [
  {"id": "s1", "title": "Entender", "minutes": 15,
   "goal": "Entender o tema, os três cenários e o significado das 18 expressões.",
   "steps": [{"kind": "read", "block": "overview"},
             {"kind": "read", "block": "scenario", "ref": "sc1"},
             {"kind": "read", "block": "scenario", "ref": "sc2"},
             {"kind": "read", "block": "scenario", "ref": "sc3"},
             *[{"kind": "item", "ref": i} for i in ["c1", "c2", "c3", "c4", "c5"]],
             {"kind": "read", "block": "phrases", "ref": 1},
             {"kind": "read", "block": "phrases", "ref": 2},
             {"kind": "read", "block": "phrases", "ref": 3},
             *[{"kind": "item", "ref": i} for i in ["v1", "v2", "v3", "v4", "v5", "v6", "v7"]]]},
  {"id": "s2", "title": "Praticar", "minutes": 15,
   "goal": "Fixar a gramática escondida no material: preposições, -ING/TO, classe de palavra e might have.",
   "steps": [{"kind": "read", "block": "grammar", "ref": "g1"},
             *[{"kind": "item", "ref": i} for i in ["m1", "m2", "m3", "m4", "m5"]],
             {"kind": "read", "block": "grammar", "ref": "g2"},
             *[{"kind": "item", "ref": i} for i in ["m6", "m7", "m8", "m9"]],
             {"kind": "read", "block": "grammar", "ref": "g3"},
             {"kind": "read", "block": "grammar", "ref": "g4"},
             {"kind": "read", "block": "grammar", "ref": "g5"},
             *[{"kind": "item", "ref": i} for i in ["m10", "m11", "m12"]],
             *[{"kind": "item", "ref": i} for i in ["f1", "f2", "f3", "f4", "f5", "f6"]],
             *[{"kind": "item", "ref": i} for i in ["x1", "x2", "x3", "x4", "x5", "x6"]]]},
  {"id": "s3", "title": "Preparar a fala", "minutes": 15,
   "goal": "Montar respostas para as perguntas da aula: escrever 3 e falar 3 em voz alta.",
   "steps": [{"kind": "read", "block": "kit"},
             {"kind": "read", "block": "grammar", "ref": "g6"},
             {"kind": "write", "ref": "d2"}, {"kind": "speak", "ref": "d1"},
             {"kind": "write", "ref": "d6"}, {"kind": "speak", "ref": "d4"},
             {"kind": "write", "ref": "d8"}, {"kind": "speak", "ref": "d7"}]},
  {"id": "s4", "title": "Véspera da aula", "minutes": 12,
   "goal": "Lembrar as expressões sem olhar, falar as 3 perguntas restantes e repetir frases-modelo.",
   "steps": [*[{"kind": "flash", "ref": p["id"]} for p in L["phrases"]],
             *[{"kind": "item", "ref": i} for i in ["r1", "r2", "r3", "r4"]],
             {"kind": "speak", "ref": "d3"}, {"kind": "speak", "ref": "d5"}, {"kind": "speak", "ref": "d9"},
             {"kind": "shadow"}, {"kind": "read", "block": "mywriting"}]},
]

out = pathlib.Path(__file__).resolve().parent.parent / "data" / "l001.json"
out.write_text(json.dumps(L, ensure_ascii=False, indent=1), encoding="utf-8")
print("ok", out, len(ITEMS), "itens")
