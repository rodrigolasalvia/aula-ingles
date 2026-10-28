"""Simulação de uso no celular (Chromium, tela 390x844). Rode: python3 tests/e2e.py
Sobe um servidor local, percorre as 4 etapas, testa retomada, recarga no meio, relatório, backup e uso offline."""
import functools, http.server, json, pathlib, sys, threading
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None
PORT = 8765
Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
Handler.log_message = lambda *a: None
srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{PORT}/"
L = json.loads((ROOT / "data/l001.json").read_text())
ITEMS = {i["id"]: i for i in L["items"]}
errors = []

def shot(page, name):
    if SHOTS:
        SHOTS.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(SHOTS / f"{name}.png"), full_page=True)

def check(cond, msg):
    if not cond:
        raise AssertionError(msg)
    print("  ✓", msg)

def answer_current(page, wrong_ids=()):
    """Responde a tela atual. Retorna False quando chegou ao resultado."""
    page.wait_for_selector(".s-body, .score-card, .report", timeout=5000)
    if "/result" in page.url:
        return False
    body = page.locator(".s-body")
    tag = body.locator(".tag").first.inner_text() if body.locator(".tag").count() else ""
    opts = body.locator("button.opt:not([disabled])")
    if opts.count():
        prompt = body.locator(".prompt").inner_text()
        item = next(i for i in ITEMS.values() if i["type"] == "mc" and i["prompt"] == prompt)
        target = item["options"][item["answer"]]
        if item["id"] in wrong_ids:
            target = next(o for k, o in enumerate(item["options"]) if k != item["answer"])
        body.locator("button.opt", has_text=target).first.click()
        body.locator("[data-action=next]").click()
        return True
    typed = body.locator("[data-typed]:not([disabled])")
    if typed.count():
        iid = typed.get_attribute("data-typed")
        item = ITEMS[iid]
        typed.fill("wrong answer" if iid in wrong_ids else item["accept"][0])
        body.locator("[data-action=check]").click()
        body.locator("[data-action=next]").click()
        return True
    if body.locator("textarea[data-autosave]").count():
        body.locator("textarea[data-autosave]").fill(
            "In my view, it depends. Most people show only the highlights, and that can create a false impression. "
            "That said, I think we should measure success on our own terms and not give in to social pressure.")
        body.locator("[data-action=savewrite]").click()
        body.locator("[data-action=next]").click()
        return True
    if body.locator("[data-action=rate]").count():
        body.locator("[data-action=rate][data-v=effort]").click()
        body.locator("[data-action=next]").click()
        return True
    if body.locator("[data-action=flash]").count():
        body.locator("[data-action=flash][data-v='1']").click()
        return True
    if body.locator("[data-action=reveal]").count():
        body.locator("[data-action=reveal]").click()
        return True
    body.locator("[data-action=next]").click()
    return True

def run_session(page, sid, wrong_ids=(), shots_at=()):
    page.goto(f"{BASE}#/lesson/l001/s/{sid}")
    n = 0
    while True:
        if n in shots_at: shot(page, f"{sid}-step{n}")
        if not answer_current(page, wrong_ids): break
        n += 1
        assert n < 200, "loop infinito"
    return n

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True,
                              permissions=["clipboard-read", "clipboard-write"], accept_downloads=True)
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.on("console", lambda m: m.type == "error" and errors.append(f"console: {m.text}"))

    print("Início")
    page.goto(BASE)
    page.wait_for_selector(".hero")
    check("Comparison, Choices & Envy" in page.inner_text(".hero"), "lição 1 aparece na tela inicial")
    shot(page, "01-home")

    print("Etapa 1 (erra c1 e v2)")
    page.goto(f"{BASE}#/lesson/l001/s/s1")
    page.wait_for_selector(".s-body")
    shot(page, "02-overview")
    for _ in range(3): answer_current(page)
    shot(page, "03-scenario")
    answer_current(page)
    page.reload(); page.wait_for_selector(".s-body")
    check("1/5" not in page.inner_text(".s-meta") and "5/" in page.inner_text(".s-meta"), "recarregar no meio mantém a posição")
    shot(page, "04-mc")
    run_session(page, "s1", wrong_ids={"c1", "v2"}, shots_at={6})
    page.wait_for_selector(".score-card")
    txt = page.inner_text("main")
    check("Onde foi bem" in txt and "Onde foi mal" in txt and "Onde focar" in txt, "resultado tem as três avaliações")
    check("Compreensão" in txt and "✗" in txt, "resultado lista os erros")
    shot(page, "05-result-s1")
    page.click("[data-action=copy]")
    clip = page.evaluate("navigator.clipboard.readText()")
    check("ERROS:" in clip and "Pendências para retomada: 2" in clip, "relatório copiado com erros e pendências")

    print("Etapa 2 (retomada + erra m1, f1, x3)")
    page.goto(f"{BASE}#/lesson/l001/s/s2")
    page.wait_for_selector(".s-body")
    check(page.locator(".retake").count() == 1, "começa pela retomada dos erros da etapa 1")
    shot(page, "06-retake")
    run_session(page, "s2", wrong_ids={"m1", "f1", "x3"}, shots_at={2, 14, 28})
    page.wait_for_selector(".score-card")
    txt = page.inner_text("main")
    check("Preposições" in txt, "avaliação por habilidade aparece")
    shot(page, "07-result-s2")
    pend = page.evaluate("JSON.parse(localStorage.getItem('aula-ingles:state')).lessons.l001.pending")
    check(sorted(pend) == ["f1", "m1", "x3"], f"retomada corrigida sai das pendências; ficam {pend}")

    print("Etapa 3 (escrita e fala)")
    run_session(page, "s3", shots_at={0, 2, 3, 4})
    page.wait_for_selector(".report")
    page.click("[data-action=copy]")
    clip = page.evaluate("navigator.clipboard.readText()")
    check("RESPOSTAS ESCRITAS" in clip and "FALA (autoavaliação)" in clip, "relatório da etapa 3 leva escrita e fala")
    shot(page, "08-result-s3")

    print("Etapa 4 (véspera)")
    run_session(page, "s4", shots_at={0, 1, 22, 25})
    page.wait_for_selector(".report")
    shot(page, "09-result-s4")
    page.goto(BASE); page.wait_for_selector(".hero")
    check("Lição completa" in page.inner_text(".hero"), "tela inicial mostra lição completa")

    print("Material e refazer")
    page.goto(f"{BASE}#/lesson/l001/material/questions")
    page.wait_for_selector(".mine")
    check(page.locator(".mine").count() == 3, "material mostra as 3 respostas escritas")
    shot(page, "10-material-questions")
    page.goto(f"{BASE}#/lesson/l001/material"); page.wait_for_selector(".phrase")
    check(page.locator(".phrase").count() == 18, "material mostra as 18 expressões")
    shot(page, "11-material-phrases")
    page.goto(f"{BASE}#/lesson/l001/s/s1/result"); page.wait_for_selector(".score-card")
    page.once("dialog", lambda d: d.accept())
    page.click("[data-action=redo]")
    page.wait_for_selector(".s-body")
    check("/s/s1" in page.url and "/result" not in page.url, "refazer etapa reinicia a sessão")
    log = page.evaluate("JSON.parse(localStorage.getItem('aula-ingles:state')).log.length")
    check(log == 4, "histórico mantém as 4 conclusões")

    print("Backup")
    page.goto(f"{BASE}#/settings"); page.wait_for_selector("[data-action=export]")
    with page.expect_download() as dl:
        page.click("[data-action=export]")
    path = dl.value.path()
    data = json.loads(pathlib.Path(path).read_text())
    check(data["app"] == "aula-ingles" and data["state"]["log"], "backup exportado com histórico")
    shot(page, "12-settings")
    page.evaluate("localStorage.setItem('aula-ingles:state', '{corrompido'); localStorage.removeItem('aula-ingles:state:prev')")
    page.reload(); page.wait_for_selector(".page-head")
    page.wait_for_timeout(500)
    log = page.evaluate("JSON.parse(localStorage.getItem('aula-ingles:state')).log.length")
    check(log == 4, "dados corrompidos: recupera do espelho interno (IndexedDB)")
    page.set_input_files("input[data-action=import]", path)
    page.wait_for_timeout(300)

    print("Offline")
    page.goto(BASE); page.wait_for_selector(".hero")
    page.evaluate("navigator.serviceWorker.ready")
    page.reload(); page.wait_for_selector(".hero")
    ctx.set_offline(True)
    page.reload(); page.wait_for_selector(".hero", timeout=5000)
    page.goto(f"{BASE}#/lesson/l001/material/grammar"); page.wait_for_selector(".grammar")
    check(True, "sem internet: app e lição abrem pelo cache")
    ctx.set_offline(False)

    browser.close()

srv.shutdown()
real = [e for e in errors if "Failed to load resource" not in e]
if real:
    print("\nERROS NO NAVEGADOR:\n" + "\n".join(real)); sys.exit(1)
print("\nTudo certo. Sem erros no console.")
