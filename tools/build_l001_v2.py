"""Lição 1 (formato v2: um bloco por lâmina) · 28/10/2026 · Comparison, Choices & Envy
Gera data/v2/l001.json. Rode: python3 tools/build_l001_v2.py

Formato de cada bloco: tópico → cenário → useful words & phrases → discuss → frases novas → pratique.
Tipos de exercício: mc (completar escolhendo), order (montar a frase tocando nas palavras), write (escrever a sua frase).
"""
import json, pathlib

def P(id, en, pt, example, tip="", keys=None):
    return {"id": id, "en": en, "pt": pt, "example": example, "tip": tip, "keys": keys or []}

def Q(id, en, pt, model):
    return {"id": id, "en": en, "pt": pt, "model": model}

def S(en, pt):
    return {"en": en, "pt": pt}

def mc(id, prompt, options, answer, explain):
    return {"id": id, "type": "mc", "prompt": prompt, "options": options, "answer": answer, "explain": explain}

def order(id, pt, sentence, explain):
    return {"id": id, "type": "order", "prompt": pt, "answer": sentence, "explain": explain}

def write(id, prompt, phrases, model):
    return {"id": id, "type": "write", "prompt": prompt, "phrases": phrases, "model": model}

BLOCKS = [
  {
    "id": "b1", "slide": 1,
    "tag": "B2 Speaking · The Psychology of Comparison",
    "title": "The Comparison Illusion",
    "subtitle": "What we see online isn't always the full picture. Are we comparing our real lives to a fake reality?",
    "topicPt": "O que vemos nas redes é uma versão editada da vida dos outros. A pergunta da aula: estamos comparando a nossa vida real com uma realidade montada?",
    "scenario": [
      {"label": "", "en": "A lifestyle influencer posts beautiful photos of her home, expensive dinners, and relaxing weekends. Her followers assume she has a nearly perfect life."},
      {"label": "", "en": "What they don't see are the staged photographs, financial pressures, exhausting work, and ordinary problems behind the scenes."},
    ],
    "scenarioPt": "Uma influenciadora posta só momentos bonitos, e os seguidores acham que a vida dela é perfeita. Eles não veem as fotos encenadas, a pressão financeira, o cansaço e os problemas comuns por trás.",
    "words": [["assume", "supor (não é \"assumir\")"], ["staged", "encenado, montado"], ["behind the scenes", "nos bastidores"]],
    "highlight": S("What we see online is often a carefully curated image, not the full reality.", "O que vemos online costuma ser uma imagem selecionada, não a realidade inteira."),
    "motto": S("Look beyond the highlight reel.", "Olhe além dos melhores momentos."),
    "phrases": [
      P("p01", "present a carefully curated image", "passar uma imagem cuidadosamente selecionada", "Most people present a carefully curated image on social media.", "", [r"curated"]),
      P("p02", "show only the highlights", "mostrar só os melhores momentos", "On Instagram, people show only the highlights of their week.", "", [r"highlight"]),
      P("p03", "create a false impression", "criar uma impressão falsa", "Those photos create a false impression of an easy life.", "CREATE (não make) a false impression", [r"false impression"]),
      P("p04", "take something at face value", "acreditar em algo sem questionar", "I never take online reviews at face value.", "AT face value", [r"face value"]),
      P("p05", "distort your perception of reality", "distorcer sua percepção da realidade", "Constant scrolling can distort your perception of reality.", "perception OF", [r"distort"]),
      P("p06", "reveal only part of the story", "revelar só parte da história", "A single photo reveals only part of the story.", "", [r"part of the story"]),
    ],
    "discussTitle": "Discuss & Analyze",
    "questions": [
      Q("d1", "If you know that social media posts are carefully selected, why might they still influence your perception of other people's lives?",
        "Se você sabe que os posts são selecionados, por que eles ainda influenciam sua percepção da vida dos outros?",
        "I think it's because we see these images so often that they start to feel normal. Even if I know that people show only the highlights, my brain doesn't process that every time I scroll. So, little by little, those posts can distort my perception of reality."),
      Q("d2", "Is presenting an idealized version of yourself online a form of dishonesty, or is it simply a matter of privacy?",
        "Mostrar uma versão idealizada de si mesmo online é desonestidade ou só uma questão de privacidade?",
        "In my view, it depends on the intention. Choosing to show only the highlights is simply a matter of privacy. However, if someone deliberately creates a false impression to sell products, I'd say it becomes a form of dishonesty."),
      Q("d3", "How can you distinguish between a genuinely successful life and a convincing public image?",
        "Como diferenciar uma vida realmente bem-sucedida de uma imagem pública convincente?",
        "That's a tricky one, because from the outside they look the same. I'd look at consistency over time and at what people don't show. A single post reveals only part of the story, so it's better not to take anyone's life at face value."),
    ],
    "newSentences": [
      S("On LinkedIn, many professionals present a carefully curated image of their careers.", "No LinkedIn, muitos profissionais passam uma imagem cuidadosamente selecionada da carreira."),
      S("Travel photos usually show only the highlights, never the long queues at the airport.", "Fotos de viagem costumam mostrar só os melhores momentos, nunca as filas do aeroporto."),
      S("A nice-looking report can create a false impression that the project is on track.", "Um relatório bonito pode criar a falsa impressão de que o projeto está em dia."),
      S("I never take a sales pitch at face value; I always ask for evidence.", "Nunca acredito num discurso de vendas sem questionar; sempre peço evidências."),
      S("Comparing yourself with influencers can distort your perception of reality.", "Comparar-se com influenciadores pode distorcer sua percepção da realidade."),
      S("The interview revealed only part of the story, so I asked more questions.", "A entrevista revelou só parte da história, então fiz mais perguntas."),
    ],
    "practice": [
      mc("b1m1", "Don't believe everything you see online. Never take it ___.", ["at face value", "in face value", "on face value", "by face value"], 0,
         "A expressão é fixa: take something AT face value."),
      mc("b1m2", "Her feed ___: beaches, parties and perfect dinners. Nothing else.", ["shows only the highlights", "reveals the full reality", "takes it at face value", "has a false perception"], 0,
         "show only the highlights = mostrar só os melhores momentos."),
      order("b1o1", "Redes sociais podem distorcer sua percepção da realidade.", "Social media can distort your perception of reality.", "distort your perception OF reality."),
      order("b1o2", "As fotos criam uma falsa impressão de uma vida fácil.", "The photos create a false impression of an easy life.", "create a false impression OF something."),
      write("b1w1", "Escreva uma frase com **take something at face value**, sobre notícias, propagandas ou redes sociais.", ["p04"],
            "I don't take online reviews at face value; some of them are fake."),
      write("b1w2", "Escreva uma frase com **show only the highlights** ou **present a carefully curated image**, sobre redes sociais ou trabalho.", ["p01", "p02"],
            "On LinkedIn, people usually show only the highlights of their careers."),
    ],
  },
  {
    "id": "b2", "slide": 2,
    "tag": "B2 Speaking · The Comparison Trap",
    "title": "Are You Choosing for Yourself?",
    "subtitle": "How much are your decisions really yours — and how much are they influenced by others?",
    "topicPt": "Até que ponto suas escolhas são suas? O tema é a pressão social: decidir para parecer bem-sucedido, e não pelos próprios valores.",
    "scenario": [
      {"label": "", "en": "Sarah has always preferred a simple lifestyle. She enjoys her job, saves money, and rarely feels the need to buy expensive things."},
      {"label": "", "en": "Recently, several people in her social circle have started buying luxury brands, upgrading their homes, and spending more on their appearance. Sarah begins making similar purchases — not because she genuinely wants them, but because she worries that her choices make her seem less successful."},
      {"label": "", "en": "A few months later, she has less savings, more financial pressure, and a lifestyle that doesn't really suit her."},
    ],
    "scenarioPt": "Sarah sempre viveu de forma simples. Quando os amigos começam a comprar marcas de luxo, ela passa a gastar também, não porque quer, mas por medo de parecer menos bem-sucedida. Resultado: menos dinheiro, mais pressão e uma vida que não combina com ela.",
    "words": [["genuinely", "de verdade, sinceramente"], ["upgrade", "melhorar, trocar por algo melhor"], ["suit someone", "combinar com alguém"]],
    "highlight": None,
    "motto": S("Your choices. Your values. Your life.", "Suas escolhas. Seus valores. Sua vida."),
    "phrases": [
      P("p07", "lose sight of your own priorities", "perder de vista suas prioridades", "When you compare yourself all the time, you lose sight of your own priorities.", "lose sight OF", [r"(lose|lost|losing|loses) sight of"]),
      P("p08", "be driven to prove yourself", "ser movido pela necessidade de se provar", "After her promotion, she was driven to prove herself.", "driven TO + verbo", [r"driven to prove"]),
      P("p09", "seek external validation", "buscar aprovação dos outros", "Posting every achievement can be a way to seek external validation.", "", [r"validation"]),
      P("p10", "give in to social pressure", "ceder à pressão social", "Sarah gave in to social pressure and bought a luxury bag.", "give in TO", [r"(give|gave|giving|gives|given) in to"]),
      P("p11", "make decisions based on appearances", "decidir com base nas aparências", "If you make decisions based on appearances, you live someone else's life.", "based ON (não in)", [r"based on appearance"]),
      P("p12", "measure success on your own terms", "medir o sucesso pelos seus próprios critérios", "For me, success means time with my family; I measure it on my own terms.", "ON your own terms", [r"on (my|your|his|her|our|their|one's) own terms"]),
    ],
    "discussTitle": "Discuss & Justify",
    "questions": [
      Q("d4", "At what point did Sarah stop making decisions based on her own values? What might have triggered the change?",
        "Em que momento Sarah deixou de decidir pelos próprios valores? O que pode ter provocado a mudança?",
        "I'd say it happened when she started buying things to look successful. What might have triggered the change was seeing her friends upgrade their lifestyles. She gave in to social pressure and lost sight of her own priorities."),
      Q("d5", "Is it possible to enjoy luxury and still be influenced by social pressure? How can you tell the difference?",
        "Dá para gostar de luxo e mesmo assim ser influenciado pela pressão social? Como perceber a diferença?",
        "Yes, both can happen at the same time. One way to tell the difference is to ask yourself: would I still buy it if nobody could see it? If the answer is no, you're probably seeking external validation and making decisions based on appearances."),
      Q("d6", "Should people care about how others perceive their lifestyle, or should personal satisfaction come first? Defend your position.",
        "As pessoas devem se importar com como os outros veem seu estilo de vida, ou a satisfação pessoal vem primeiro? Defenda sua posição.",
        "I'd argue that personal satisfaction should come first. In some contexts, like work, image matters to some extent. That said, if you make decisions based on appearances all the time, you end up living someone else's life. So I measure success on my own terms."),
    ],
    "newSentences": [
      S("When I focus too much on other people's careers, I lose sight of my own priorities.", "Quando foco demais na carreira dos outros, perco de vista minhas prioridades."),
      S("In her first year as a manager, she was driven to prove herself.", "No primeiro ano como gestora, ela era movida pela necessidade de se provar."),
      S("Some people post every achievement because they seek external validation.", "Algumas pessoas postam cada conquista porque buscam aprovação dos outros."),
      S("I almost gave in to social pressure and bought a car I didn't need.", "Quase cedi à pressão social e comprei um carro de que não precisava."),
      S("Making decisions based on appearances is a common mistake in hiring.", "Decidir com base nas aparências é um erro comum em contratações."),
      S("For me, success means free time with my family; I measure it on my own terms.", "Para mim, sucesso é ter tempo com a família; meço pelos meus próprios critérios."),
    ],
    "practice": [
      mc("b2m1", "Sarah made her decisions based ___ appearances.", ["on", "in", "at", "of"], 0,
         "based ON. \"Based in\" só para lugar: a company based in São Paulo."),
      mc("b2m2", "She finally ___ social pressure and bought the bag.", ["gave in to", "gave up to", "gave in for", "gave on to"], 0,
         "give in TO = ceder a. Passado: gave in to."),
      order("b2o1", "Não perca de vista suas próprias prioridades.", "Don't lose sight of your own priorities.", "lose sight OF something."),
      order("b2o2", "Prefiro medir o sucesso pelos meus próprios critérios.", "I prefer to measure success on my own terms.", "ON my own terms."),
      write("b2w1", "Escreva uma frase com **give in to social pressure**, contando uma situação real ou imaginada.", ["p10"],
            "At my last job, I gave in to social pressure and worked every weekend."),
      write("b2w2", "Escreva uma frase com **seek external validation** ou **measure success on your own terms**, dando sua opinião.", ["p09", "p12"],
            "I try to measure success on my own terms, not by what other people think."),
    ],
  },
  {
    "id": "b3", "slide": 3,
    "tag": "B2 Speaking · Challenge Your Assumptions",
    "title": "Is Envy Always a Bad Thing?",
    "subtitle": "Can envy be a destructive emotion — or can it sometimes push us forward?",
    "topicPt": "A inveja pode destruir ou motivar. A aula pede que você tome uma posição e defenda: ela ajuda ou atrapalha?",
    "scenario": [
      {"label": "Destructive envy", "en": "You become resentful of someone else's success, question your own abilities, or secretly hope they fail."},
      {"label": "Motivating envy", "en": "Someone's achievements reveal what you want for yourself and encourage you to take action."},
    ],
    "scenarioPt": "Inveja destrutiva: ressentir o sucesso do outro, duvidar de si mesmo, torcer em segredo pelo fracasso alheio. Inveja motivadora: o sucesso do outro mostra o que você quer e te leva a agir.",
    "words": [["resentful of", "ressentido com"], ["envy / envious", "inveja / invejoso (jealous = ciúme)"], ["encourage someone to", "encorajar alguém a"]],
    "highlight": None,
    "motto": S("Same feeling. Different outcomes.", "Mesmo sentimento. Resultados diferentes."),
    "phrases": [
      P("p13", "be driven by envy", "ser movido pela inveja", "Some decisions are driven by envy, not by real goals.", "driven BY + substantivo", [r"driven by envy"]),
      P("p14", "turn envy into motivation", "transformar inveja em motivação", "Instead of complaining, he turned his envy into motivation.", "turn X INTO Y", [r"into motivation"]),
      P("p15", "acknowledge your insecurities", "reconhecer suas inseguranças", "The first step is to acknowledge your insecurities.", "", [r"acknowledg"]),
      P("p16", "feel threatened by someone's success", "sentir-se ameaçado pelo sucesso de alguém", "Good leaders don't feel threatened by their team's success.", "threatened BY", [r"threatened by"]),
      P("p17", "channel your energy into something productive", "canalizar sua energia para algo produtivo", "She channelled her frustration into a new project.", "channel INTO (não to)", [r"channel"]),
      P("p18", "take inspiration from someone", "inspirar-se em alguém", "I take inspiration from people who started from scratch.", "inspiration FROM (não in)", [r"inspiration from"]),
    ],
    "discussTitle": "Take a Position",
    "questions": [
      Q("d7", "Can envy be useful if it reveals something you genuinely want? Or does it always damage your peace of mind?",
        "A inveja pode ser útil se revela algo que você realmente quer? Ou ela sempre tira sua paz?",
        "I believe envy can be useful, as long as you're honest about it. It shows you what you really want. The problem starts when you're driven by envy instead of your own goals. What matters is whether you turn envy into motivation or into resentment."),
      Q("d8", "Imagine your friend gets an opportunity you've wanted for years. What would your first reaction be, and how would you handle it?",
        "Imagine que um amigo consegue uma oportunidade que você quer há anos. Qual seria sua primeira reação e como lidaria com isso?",
        "To be honest, my first reaction would be a mix of happiness and frustration. I might feel a little threatened by his success at first. Then I'd try to acknowledge my insecurities and ask how he got the opportunity. That way, I could take inspiration from him."),
      Q("d9", "Is it better to avoid people who trigger your insecurities, or learn to deal with those feelings? Defend your answer.",
        "É melhor evitar pessoas que despertam suas inseguranças ou aprender a lidar com esses sentimentos? Defenda sua resposta.",
        "I'd say it's better to learn to deal with those feelings. If you avoid everyone who makes you feel insecure, you also avoid people you could take inspiration from. The first step is to acknowledge your insecurities. That said, you don't have to tolerate disrespect."),
    ],
    "newSentences": [
      S("Some of my worst decisions were driven by envy, not by real goals.", "Algumas das minhas piores decisões foram movidas pela inveja, não por objetivos reais."),
      S("When my colleague got promoted, I turned my envy into motivation and signed up for a course.", "Quando meu colega foi promovido, transformei a inveja em motivação e me inscrevi num curso."),
      S("It isn't easy to acknowledge your insecurities in front of your team.", "Não é fácil reconhecer suas inseguranças na frente do time."),
      S("A good leader doesn't feel threatened by the team's success.", "Um bom líder não se sente ameaçado pelo sucesso do time."),
      S("After the bad news, she channelled her energy into something productive.", "Depois da má notícia, ela canalizou a energia para algo produtivo."),
      S("I take inspiration from people who changed careers after forty.", "Eu me inspiro em pessoas que mudaram de carreira depois dos quarenta."),
    ],
    "practice": [
      mc("b3m1", "I take inspiration ___ people who started from scratch.", ["from", "in", "of", "on"], 0,
         "take inspiration FROM. O português \"inspirar-se em\" leva ao erro \"in\"."),
      mc("b3m2", "Instead of complaining, he turned his envy ___ motivation.", ["into", "to", "for", "in"], 0,
         "turn X INTO Y = transformar X em Y."),
      order("b3o1", "Ela se sentiu ameaçada pelo sucesso da colega.", "She felt threatened by her colleague's success.", "threatened BY someone's success."),
      order("b3o2", "Tente canalizar sua energia para algo produtivo.", "Try to channel your energy into something productive.", "channel your energy INTO something."),
      write("b3w1", "Escreva uma frase com **turn envy into motivation**, sobre alguém que você admira.", ["p14"],
            "When my friend got a job abroad, I turned my envy into motivation and started studying English every day."),
      write("b3w2", "Escreva uma frase com **take inspiration from someone**, dizendo em quem você se inspira e por quê.", ["p18"],
            "I take inspiration from my father, who started his own business at fifty."),
    ],
  },
]

LESSON = {
  "id": "l001", "number": 1, "date": "2026-10-28", "format": 2,
  "title": "Comparison, Choices & Envy",
  "subtitle": "Comparação nas redes, pressão social e inveja",
  "level": "B2 Speaking",
  "blocks": BLOCKS,
}

root = pathlib.Path(__file__).resolve().parent.parent / "data" / "v2"
root.mkdir(parents=True, exist_ok=True)
(root / "l001.json").write_text(json.dumps(LESSON, ensure_ascii=False, indent=1), encoding="utf-8")
idx_path = root / "lessons.json"
idx = json.loads(idx_path.read_text()) if idx_path.exists() else {"lessons": []}
meta = {k: LESSON[k] for k in ("id", "number", "date", "title", "subtitle")} | {"file": "data/v2/l001.json"}
idx["lessons"] = [l for l in idx["lessons"] if l["id"] != LESSON["id"]] + [meta]
idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=1), encoding="utf-8")
print("ok", sum(len(b["practice"]) for b in BLOCKS), "exercícios")
