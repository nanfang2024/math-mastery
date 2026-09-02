#!/usr/bin/env python3
"""生成方寸数学启动图标的位图回退（API 24-25）：靛蓝渐变 + 白色 ∑ + 朱砂点"""
from PIL import Image, ImageDraw, ImageFont
import os

BASE = 512  # 母版尺寸
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"

def make_base():
    img = Image.new("RGBA", (BASE, BASE))
    d = ImageDraw.Draw(img)
    # 垂直渐变：#1C2C55 → #3A589C
    c1, c2 = (0x1C, 0x2C, 0x55), (0x3A, 0x58, 0x9C)
    for y in range(BASE):
        t = y / (BASE - 1)
        col = tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))
        d.line([(0, y), (BASE, y)], fill=col)
    # 坐标纸细网格（呼应主题）
    grid = Image.new("RGBA", (BASE, BASE), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    for i in range(0, BASE, 32):
        gd.line([(i, 0), (i, BASE)], fill=(255, 255, 255, 14), width=2)
        gd.line([(0, i), (BASE, i)], fill=(255, 255, 255, 14), width=2)
    img = Image.alpha_composite(img, grid)
    d = ImageDraw.Draw(img)
    # 白色 ∑（U+2211，DejaVu Serif Bold 含此字形）
    font = ImageFont.truetype(FONT, 300)
    bb = d.textbbox((0, 0), "\u2211", font=font)
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    d.text(((BASE - w) / 2 - bb[0], (BASE - h) / 2 - bb[1] - 10), "\u2211",
           font=font, fill=(255, 255, 255, 255))
    # 朱砂点（左下，呼应矢量版）
    r = 17
    cx, cy = int(BASE * 0.30), int(BASE * 0.52)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(0xD1, 0x4A, 0x26, 255))
    return img

def rounded(img, radius_ratio=0.22):
    """圆角矩形 mask"""
    from PIL import ImageDraw
    r = int(img.width * radius_ratio)
    mask = Image.new("L", img.size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, img.width - 1, img.height - 1], radius=r, fill=255)
    out = img.copy()
    out.putalpha(mask)
    return out

def circular(img):
    mask = Image.new("L", img.size, 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([0, 0, img.width - 1, img.height - 1], fill=255)
    out = img.copy()
    out.putalpha(mask)
    return out

RES = os.path.join(os.path.dirname(__file__), "app/src/main/res")
SIZES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}

base = make_base()
for dpi, size in SIZES.items():
    folder = os.path.join(RES, f"mipmap-{dpi}")
    os.makedirs(folder, exist_ok=True)
    s = base.resize((size, size), Image.LANCZOS)
    rounded(s).save(os.path.join(folder, "ic_launcher.png"))
    circular(s).save(os.path.join(folder, "ic_launcher_round.png"))
    print(f"mipmap-{dpi}: {size}px OK")
print("done")
