"""Simulação de uso no celular (Chromium, 390x844). Rode: python3 tests/e2e.py [pasta_para_prints]
Percorre Understand → Build → Speak da lição mais recente, com erro e nova tentativa, áudio, Try without looking,
progresso após recarregar, dados antigos preservados, recuperação de dados corrompidos e uso offline."""
import functools, http.server, json, pathlib, sys, threading
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None
PORT = 8767

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), functools.partial(Quiet, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{PORT}/"
IDX = json.loads((ROOT / "data/v3/lessons.json").read_text())
LATEST = sorted(IDX["lessons"], key=lambda l: l["date"])[-1]
L = json.loads((ROOT / LATEST["file"]).read_text())
LID = L["id"]
errors = []
OLD = {"v": 2, "lessons": {LID: {"blocks": {"b1": {"answers": {"b1m1": {"ok": True, "given": "0"}}, "writes": {"b1w1": "I never take it at face value."}, "done": True}}}},
       "log": [{"ts": 1}], "settings": {"rate": 0.95, "voice": ""}}

def shot(page, name):
    if SHOTS:
        SHOTS.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(SHOTS / f"{name}.png"), full_page=True)

def check(cond, msg):
    if not cond: raise AssertionError(msg)
    print("  ✓", msg)

def tap_blocks(page, blocks):
    for b in blocks:
        btns = page.locator(".bank button.word")
        for k in range(btns.count()):
            if btns.nth(k).inner_text().strip() == b:
                btns.nth(k).click(); break
        else:
            raise AssertionError(f"bloco não encontrado: {b}")

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    ctx.add_init_script("""window.__spoken = [];
      window.speechSynthesis.speak = u => window.__spoken.push([u.text, u.rate]);""")
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.on("console", lambda m: m.type == "error" and errors.append(f"console: {m.text}"))

    print("Início")
    page.goto(BASE)
    page.evaluate("s => localStorage.setItem('aula-ingles:state', JSON.stringify(s))", OLD)
    page.reload(); page.wait_for_selector(".hero")
    check("Start: Understand" in page.inner_text(".hero"), "tela inicial mostra por onde começar")
    shot(page, "01-home")

    print("1. Understand")
    page.click(".hero .btn"); page.wait_for_selector(".phrase")
    check(page.locator(".scen").count() == len(L["understand"]["scenario"]), "resumo do cenário")
    check(page.locator(".phrase").count() == len(L["understand"]["expressions"]), "expressões-chave")
    page.locator(".scen .lbtn.slow").first.click()
    sp = page.evaluate("window.__spoken")
    check(abs(sp[-1][1] - 0.85) < 0.001 and sp[-1][0] == L["understand"]["scenario"][0]["text"], "Slow toca a 0.85x")
    shot(page, "02-understand")
    page.click("[data-action=understood]")

    print("2. Build the sentence")
    page.wait_for_selector(".bank")
    check("1/10" in page.inner_text(".count") or f"1/{len(L['build'])}" in page.inner_text(".count"), "indicador de progresso 1/N")
    first = L["build"][0]
    tap_blocks(page, list(reversed(first["blocks"])))
    shot(page, "03-build-filled")
    page.click("[data-action=check]")
    check(page.locator(".wrong-msg").count() == 1, "ordem errada: mensagem para tentar de novo")
    shot(page, "04-build-wrong")
    page.locator(".built button.word").first.click()
    check(page.locator(".built button.word").count() == len(first["blocks"]) - 1, "tocar no bloco o remove")
    page.click("[data-action=clear]")
    tap_blocks(page, first["blocks"]); page.click("[data-action=check]")
    page.wait_for_selector(".fb.ok")
    check(first["explain"] in page.inner_text(".fb.ok"), "certo: mostra a explicação")
    page.locator(".fb .lbtn").first.click()
    check(page.evaluate("window.__spoken")[-1] == [" ".join(first["blocks"]), 1], "Listen toca a frase completa em velocidade normal")
    shot(page, "05-build-right")
    page.click("[data-action=next]"); page.wait_for_selector(".bank")
    page.reload(); page.wait_for_selector(".bank")
    page.goto(BASE); page.wait_for_selector(".hero")
    check("(2/" in page.inner_text(".hero"), "progresso guardado: continua da frase 2")
    page.click(".hero .btn"); page.wait_for_selector(".bank")
    for item in L["build"][1:]:
        page.wait_for_selector(".bank button.word")
        tap_blocks(page, item["blocks"]); page.click("[data-action=check]"); page.wait_for_selector(".fb.ok")
        page.click("[data-action=next]")
    page.wait_for_selector(".done-card")
    shot(page, "06-build-done")
    page.click(".done-card .btn:not(.btn-ghost)")

    print("3. Get ready to speak")
    page.wait_for_selector(".bank")
    shot(page, "07-speak")
    for n, item in enumerate(L["speak"]):
        page.wait_for_selector(".bank button.word")
        tap_blocks(page, item["blocks"]); page.click("[data-action=check]"); page.wait_for_selector(".fb.ok")
        if n == 0:
            shot(page, "08-speak-right")
            page.click("[data-action=hide]")
            check(" ".join(item["blocks"]) not in page.inner_text("main"), "Try without looking esconde a resposta")
            shot(page, "09-speak-hidden")
            page.click("[data-action=show]")
            check(" ".join(item["blocks"]) in page.inner_text("main"), "Show the answer mostra de novo")
        page.click("[data-action=next]")
    page.wait_for_selector(".done-card")
    page.goto(BASE); page.wait_for_selector(".hero")
    check("ready for class" in page.inner_text(".hero"), "lição completa")
    shot(page, "10-home-done")
    st = page.evaluate("JSON.parse(localStorage.getItem('aula-ingles:state'))")
    check(st["lessons"][LID]["blocks"]["b1"]["done"] is True, "dados da versão anterior preservados")

    print("Proteção dos dados e offline")
    page.wait_for_timeout(600)
    page.evaluate("localStorage.setItem('aula-ingles:state', '{x'); localStorage.removeItem('aula-ingles:state:prev')")
    page.reload(); page.wait_for_selector(".hero"); page.wait_for_timeout(500)
    st = page.evaluate("JSON.parse(localStorage.getItem('aula-ingles:state'))")
    check(len(st["lessons"][LID]["v3"]["build"]) == len(L["build"]), "dados corrompidos: progresso recuperado")
    page.goto(f"{BASE}#/settings"); page.wait_for_selector(".card")
    shot(page, "11-settings")
    page.goto(BASE); page.wait_for_selector(".hero")
    page.evaluate("navigator.serviceWorker.ready.then(() => true)")
    page.reload(); page.wait_for_selector(".hero")
    ctx.set_offline(True)
    page.goto(f"{BASE}#/lesson/{LID}/build/3"); page.reload(); page.wait_for_selector(".bank", timeout=5000)
    check(True, "sem internet: app e exercícios abrem")
    ctx.set_offline(False)
    browser.close()

srv.shutdown()
real = [e for e in errors if "Failed to load resource" not in e]
if real:
    print("\nERROS NO NAVEGADOR:\n" + "\n".join(real)); sys.exit(1)
print("\nTudo certo. Sem erros no console.")
