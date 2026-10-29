"""Simulação de uso no celular (Chromium, 390x844). Rode: python3 tests/e2e.py [pasta_para_prints]
Percorre as lâminas da lição mais recente: erro e nova tentativa, frases fixas na tela, áudio normal e lento,
Try without looking, progresso após recarregar, dados antigos preservados, recuperação e uso offline."""
import functools, http.server, json, pathlib, sys, threading
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None
PORT = 8768

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), functools.partial(Quiet, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{PORT}/"
IDX = json.loads((ROOT / "data/v4/lessons.json").read_text())
LATEST = sorted(IDX["lessons"], key=lambda l: l["date"])[-1]
L = json.loads((ROOT / LATEST["file"]).read_text())
LID = L["id"]
errors = []
OLD = {"v": 3, "lessons": {LID: {"v3": {"understood": True, "build": {"e01": True}, "speak": {}}}}, "log": [{"ts": 1}], "settings": {"voice": ""}}

def shot(page, name):
    if SHOTS:
        SHOTS.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(SHOTS / f"{name}.png"), full_page=True)

def check(cond, msg):
    if not cond: raise AssertionError(msg)
    print("  ✓", msg)

def tap_blocks(page, blocks):
    page.wait_for_selector(".qitem.active .bank button.word")
    for b in blocks:
        btns = page.locator(".qitem.active .bank button.word")
        for k in range(btns.count()):
            if btns.nth(k).inner_text().strip() == b:
                btns.nth(k).click(); break
        else:
            raise AssertionError(f"bloco não encontrado: {b}")

def build(page, item):
    tap_blocks(page, item["blocks"])
    page.click(".qitem.active [data-action=check]")
    page.wait_for_selector(f"#q-{item['id']}.done")

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    ctx.add_init_script("window.__spoken = []; window.speechSynthesis.speak = u => window.__spoken.push([u.text, u.rate]);")
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.on("console", lambda m: m.type == "error" and errors.append(f"console: {m.text}"))

    print("Início")
    page.goto(BASE)
    page.evaluate("s => localStorage.setItem('aula-ingles:state', JSON.stringify(s))", OLD)
    page.reload(); page.wait_for_selector(".hero")
    check(page.locator(".steps .step").count() == len(L["slides"]), "tela inicial mostra as lâminas")
    check("Start: Slide 1" in page.inner_text(".hero"), "botão para começar na lâmina 1")
    shot(page, "01-home")

    s1 = L["slides"][0]
    print("Lâmina 1")
    page.click(".hero .btn"); page.wait_for_selector(".qlist")
    check(page.locator("details.understand[open]").count() == 1, "resumo e expressões abertos na primeira visita")
    check(page.locator(".qitem").count() == len(s1["items"]), "todas as perguntas da lâmina na tela")
    page.locator("details.understand .lbtn.slow").click()
    sp = page.evaluate("window.__spoken")[-1]
    check(sp[0] == s1["summary"] and abs(sp[1] - 0.85) < 0.001, "Slow lê o resumo a 0.85x")
    shot(page, "02-slide-start")
    first = s1["items"][0]
    tap_blocks(page, list(reversed(first["blocks"])))
    page.click(".qitem.active [data-action=check]")
    check(page.locator(".wrong-msg").count() == 1, "ordem errada: pede nova tentativa")
    page.locator(".qitem.active .built button.word").first.click()
    check(page.locator(".qitem.active .built button.word").count() == len(first["blocks"]) - 1, "tocar no bloco o remove")
    page.click(".qitem.active [data-action=clear]")
    build(page, first)
    check(" ".join(first["blocks"]) in page.inner_text(f"#q-{first['id']}"), "frase certa fica fixa na tela")
    check(first["explain"] in page.inner_text(f"#q-{first['id']}"), "mostra a explicação")
    page.locator(f"#q-{first['id']} .lbtn").first.click()
    check(page.evaluate("window.__spoken")[-1] == [" ".join(first["blocks"]), 1], "Listen toca a frase em velocidade normal")
    check(page.locator(f"#q-{s1['items'][1]['id']}.active").count() == 1, "próxima pergunta abre sozinha")
    shot(page, "03-slide-one-done")
    # Pular para outra pergunta e voltar
    page.click(f"#q-{s1['items'][3]['id']} [data-action=activate]")
    check(page.locator(f"#q-{s1['items'][3]['id']}.active").count() == 1, "dá para escolher qualquer pergunta")
    build(page, s1["items"][3])
    page.reload(); page.wait_for_selector(".qlist")
    check(page.locator(".qitem.done").count() == 2, "recarregar mantém as frases fixas")
    for item in s1["items"]:
        if page.locator(f"#q-{item['id']}.done").count() == 0:
            if page.locator(f"#q-{item['id']}.active").count() == 0:
                page.click(f"#q-{item['id']} [data-action=activate]")
            build(page, item)
    check(page.locator(".qitem.done").count() == len(s1["items"]), "lâmina 1 completa")
    check(all(" ".join(i["blocks"]) in page.inner_text(".qlist") for i in s1["items"]), "as 5 respostas ficam na tela")
    shot(page, "04-slide-complete")
    page.click("[data-action=hide]")
    check(all(" ".join(i["blocks"]) not in page.inner_text(".qlist") for i in s1["items"]), "Try without looking esconde as respostas")
    check(all(i["question"] in page.inner_text(".qlist") for i in s1["items"]), "perguntas continuam visíveis")
    shot(page, "05-slide-hidden")
    page.click("[data-action=show]")
    check(" ".join(s1["items"][0]["blocks"]) in page.inner_text(".qlist"), "Show answers mostra de novo")

    print("Outras lâminas")
    for s in L["slides"][1:]:
        page.goto(f"{BASE}#/lesson/{LID}/slide/{s['n']}"); page.wait_for_selector(".qlist")
        for item in s["items"]:
            build(page, item)
        if s["n"] == 3: shot(page, "06-slide3-complete")
    page.goto(BASE); page.wait_for_selector(".hero")
    check("ready for class" in page.inner_text(".hero"), "lição completa")
    st = page.evaluate("JSON.parse(localStorage.getItem('aula-ingles:state'))")
    check(st["lessons"][LID]["v3"]["build"]["e01"] is True, "dados da versão anterior preservados")

    print("Proteção dos dados e offline")
    page.wait_for_timeout(600)
    page.evaluate("localStorage.setItem('aula-ingles:state', '{x'); localStorage.removeItem('aula-ingles:state:prev')")
    page.reload(); page.wait_for_selector(".hero"); page.wait_for_timeout(500)
    st = page.evaluate("JSON.parse(localStorage.getItem('aula-ingles:state'))")
    total = sum(len(s["items"]) for s in L["slides"])
    check(len(st["lessons"][LID]["v4"]["done"]) == total, "dados corrompidos: progresso recuperado")
    page.evaluate("navigator.serviceWorker.ready.then(() => true)")
    page.reload(); page.wait_for_selector(".hero")
    ctx.set_offline(True)
    page.goto(f"{BASE}#/lesson/{LID}/slide/2"); page.reload(); page.wait_for_selector(".qlist", timeout=5000)
    check(True, "sem internet: app e lâminas abrem")
    ctx.set_offline(False)
    browser.close()

srv.shutdown()
real = [e for e in errors if "Failed to load resource" not in e]
if real:
    print("\nERROS NO NAVEGADOR:\n" + "\n".join(real)); sys.exit(1)
print("\nTudo certo. Sem erros no console.")
