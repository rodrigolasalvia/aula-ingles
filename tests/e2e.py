"""Simulação de uso no celular (Chromium, 390x844). Rode: python3 tests/e2e.py [pasta_para_prints]
Percorre os 3 blocos da lição mais recente, testa progresso após recarregar, relatório, backup, dados da v1 e uso offline."""
import functools, http.server, json, pathlib, sys, threading
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None
PORT = 8766

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), functools.partial(Quiet, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{PORT}/"
IDX = json.loads((ROOT / "data/v2/lessons.json").read_text())
LATEST = sorted(IDX["lessons"], key=lambda l: l["date"])[-1]
L = json.loads((ROOT / LATEST["file"]).read_text())
PH = {p["id"]: p for b in L["blocks"] for p in b["phrases"]}
errors = []

V1_STATE = {"v": 1, "lessons": {L["id"]: {"sessions": {"s1": {"status": "active", "pos": 5, "answers": {"c1": {"ok": True, "given": "0"}, "c2": {"ok": False, "given": "1"}}}},
            "pending": ["c2"], "writes": {}}}, "log": [], "settings": {"rate": 1.0, "voice": ""}}

def shot(page, name):
    if SHOTS:
        SHOTS.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(SHOTS / f"{name}.png"), full_page=True)

def check(cond, msg):
    if not cond: raise AssertionError(msg)
    print("  ✓", msg)

def do_block(page, block, wrong=(), stop_after=None):
    for n, item in enumerate(block["practice"]):
        if stop_after is not None and n >= stop_after: return
        box = page.locator(f"#ex-{item['id']}")
        if item["type"] == "mc":
            target = item["options"][item["answer"] if item["id"] not in wrong else (item["answer"] + 1) % len(item["options"])]
            box.locator("button.opt", has_text=target).first.click()
        elif item["type"] == "order":
            words = item["answer"].split()
            seq = words if item["id"] not in wrong else list(reversed(words))
            used = set()
            for w in seq:
                btns = box.locator("button.word:not(.on)", has_text=w)
                for k in range(btns.count()):
                    if btns.nth(k).inner_text().strip() == w:
                        btns.nth(k).click(); break
            box.locator("[data-action=checkorder]").click()
        else:
            text = item["model"] if item["id"] not in wrong else "I think people should be happier with their lives."
            box.locator("textarea").fill(text)
            box.locator("[data-action=savewrite]").click()
        page.locator(f"#ex-{item['id']} .fb, #ex-{item['id']} .mine").first.wait_for()

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True,
                              permissions=["clipboard-read", "clipboard-write"], accept_downloads=True)
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.on("console", lambda m: m.type == "error" and errors.append(f"console: {m.text}"))

    print("Dados da versão 1 continuam salvos")
    page.goto(BASE)
    page.evaluate("s => localStorage.setItem('aula-ingles:state', JSON.stringify(s))", V1_STATE)
    page.reload(); page.wait_for_selector(".hero")
    check(L["title"] in page.inner_text(".hero"), "tela inicial abre com a lição")
    shot(page, "01-home")

    b1, b2, b3 = L["blocks"]
    print("Bloco 1")
    page.click(f"a[href='#/lesson/{L['id']}/b/{b1['id']}'] >> nth=0")
    page.wait_for_selector("#practice .ex")
    txt = page.inner_text("main")
    for part in ["The scenario", "Useful words", b1["discussTitle"], "Frases novas", "Pratique"]:
        check(part in txt, f"bloco tem a parte '{part}'")
    check(page.locator(".phrase").count() == len(b1["phrases"]), "todas as expressões aparecem")
    shot(page, "02-block1")
    do_block(page, b1, wrong={"b1m1"}, stop_after=3)
    page.reload(); page.wait_for_selector("#practice .ex")
    check(page.locator("#practice .fb").count() == 3, "recarregar mantém os exercícios feitos")
    check(page.locator("[data-action=finish][disabled]").count() == 1, "concluir só libera com tudo feito")
    do_block(page, {"practice": b1["practice"][3:]})
    page.click("[data-action=finish]")
    page.wait_for_selector(".result")
    res = page.inner_text(".result")
    check("Onde foi bem" in res and "Onde focar" in res and "AT face value" in res, "resultado com avaliação e foco no erro")
    page.locator("#s-pra").screenshot(path=str(SHOTS / "03-practice-result.png")) if SHOTS else None

    print("Blocos 2 e 3")
    page.goto(f"{BASE}#/lesson/{L['id']}/b/{b2['id']}"); page.wait_for_selector("#practice .ex")
    do_block(page, b2, wrong={"b2o1", "b2w2"}); page.click("[data-action=finish]"); page.wait_for_selector(".result")
    page.goto(f"{BASE}#/lesson/{L['id']}/b/{b3['id']}"); page.wait_for_selector("#practice .ex")
    shot(page, "04-block3")
    do_block(page, b3); page.click("[data-action=finish]"); page.wait_for_selector(".result")
    page.click("a:has-text('Relatório')"); page.wait_for_selector(".report-text")
    page.click("[data-action=copy]")
    clip = page.evaluate("navigator.clipboard.readText()")
    check("BLOCO 1" in clip and "BLOCO 3" in clip and "Minha frase:" in clip and "sem a expressão pedida" in clip, "relatório completo copiado")
    shot(page, "05-report")
    page.wait_for_timeout(600)  # uso real: a cópia interna é gravada ~0,4 s depois de cada resposta
    page.goto(BASE); page.wait_for_selector(".hero")
    check("3 blocos estão feitos" in page.inner_text(".hero"), "lição marcada como completa")
    st = page.evaluate("JSON.parse(localStorage.getItem('aula-ingles:state'))")
    check(st["lessons"][L["id"]]["sessions"]["s1"]["answers"]["c1"]["ok"] is True, "dados antigos da v1 preservados")

    print("Backup, recuperação e offline")
    page.goto(f"{BASE}#/settings"); page.wait_for_selector("[data-action=export]")
    with page.expect_download() as dl: page.click("[data-action=export]")
    data = json.loads(pathlib.Path(dl.value.path()).read_text())
    check(data["app"] == "aula-ingles" and len(data["state"]["log"]) == 3, "backup exportado")
    page.wait_for_timeout(600)
    page.evaluate("localStorage.setItem('aula-ingles:state', '{x'); localStorage.removeItem('aula-ingles:state:prev')")
    page.reload(); page.wait_for_selector(".page-head"); page.wait_for_timeout(500)
    check(len(page.evaluate("JSON.parse(localStorage.getItem('aula-ingles:state')).log")) == 3, "dados corrompidos: recuperados das cópias internas")
    page.goto(BASE); page.wait_for_selector(".hero")
    page.evaluate("navigator.serviceWorker.ready.then(() => true)")
    page.reload(); page.wait_for_selector(".hero")
    ctx.set_offline(True)
    page.goto(f"{BASE}#/lesson/{L['id']}/b/{b2['id']}"); page.reload(); page.wait_for_selector("#practice .ex", timeout=5000)
    check(True, "sem internet: app e bloco abrem")
    ctx.set_offline(False)
    browser.close()

srv.shutdown()
real = [e for e in errors if "Failed to load resource" not in e]
if real:
    print("\nERROS NO NAVEGADOR:\n" + "\n".join(real)); sys.exit(1)
print("\nTudo certo. Sem erros no console.")
