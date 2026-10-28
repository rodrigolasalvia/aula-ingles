"""Gera os ícones do app (balão de fala com "EN"). Rode: python3 tools/make_icons.py"""
from PIL import Image, ImageDraw, ImageFont
import pathlib
OUT = pathlib.Path(__file__).resolve().parent.parent / "icons"
BG, FG, INK = (47, 93, 80), (243, 241, 234), (47, 93, 80)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def draw(size, pad_ratio, rounded=True):
    s = 4 * size
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if rounded: d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=BG)
    else: d.rectangle([0, 0, s, s], fill=BG)
    p = int(s * pad_ratio)
    box = [p, p + int(s * 0.02), s - p, s - p - int(s * 0.14)]
    d.rounded_rectangle(box, radius=int((box[3] - box[1]) * 0.28), fill=FG)
    tx = box[0] + int((box[2] - box[0]) * 0.22)
    d.polygon([(tx, box[3] - 2), (tx + int(s * 0.13), box[3] - 2), (tx - int(s * 0.02), box[3] + int(s * 0.12))], fill=FG)
    font = ImageFont.truetype(FONT, int((box[3] - box[1]) * 0.52))
    cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
    d.text((cx, cy), "EN", font=font, fill=INK, anchor="mm")
    return im.resize((size, size), Image.LANCZOS)

draw(192, 0.17).save(OUT / "icon-192.png")
draw(512, 0.17).save(OUT / "icon-512.png")
draw(512, 0.25, rounded=False).save(OUT / "icon-maskable-512.png")
draw(180, 0.17, rounded=False).convert("RGB").save(OUT / "apple-touch-icon.png")
print("ícones gerados")
