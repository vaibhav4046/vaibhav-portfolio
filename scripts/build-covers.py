#!/usr/bin/env python3
"""Build the archive card covers in img/cards/.

Two sources, both local, both ours to ship:

  1. Projects that already have a screenshot in img/ get that screenshot
     cropped to 8:5 and encoded as WebP at card size.
  2. Projects with no screenshot get a generated cover: a dot-matrix field
     plus the project name set in a 5x7 pixel alphabet defined in this file.
     No external font, no stock art, no network. Same dot language as the
     Gargantua canvas in the hero, so the grid reads as one system.

Run:  python scripts/build-covers.py
"""

import hashlib
import math
import os

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "img")
OUT = os.path.join(IMG, "cards")

CARD_W, CARD_H = 900, 563
BG = (10, 10, 10)
ACCENT = (255, 106, 26)
INK = (247, 247, 245)

# Projects whose cover is an existing screenshot in img/.
FROM_SHOT = {
    "leverage": "leverage.png",
    "lacuna": "lacuna.png",
    "queueproof": "queueproof.png",
    "hydrasentry": "hydrasentry.png",
    "kodro": "kodro.png",
    "qyntra": "qyntra.png",
    "delos": "delos.png",
    "drip": "drip.png",
    "continuity": "continuity.png",
    "recallops-cortex": "recallops.png",
    "recoup": "recoup.png",
    "own-wiki": "own-wiki.png",
    "cogniloop": "cogniloop.png",
    "medreviewai": "medai.png",
    "scholarai": "scholarai.png",
    "mcp-marketplace": "mcp.png",
    "praxon": "praxon.png",
    "the-film-theory-vault": "film-theory-vault.png",
}

# Projects that get a generated cover: slug -> wordmark text.
GENERATED = {
    "cherry": "CHERRY",
    "atkin": "ATKIN",
    "xact": "XACT",
    "skillister": "SKILLISTER",
    "finaltab": "FINALTAB",
    "bhashafix": "BHASHAFIX",
    "firebreak": "FIREBREAK",
    "veritas": "VERITAS",
    "keystone": "KEYSTONE",
    "pitchcraft": "PITCHCRAFT",
    "civictas": "CIVICTAS",
    "satonic": "SATONIC",
    "recallos": "RECALLOS",
    "releaserail": "RELEASERAIL",
    "glassbox": "GLASSBOX",
}

# ---------------------------------------------------------------------------
# A 5x7 dot-matrix alphabet, drawn here rather than borrowed from a font file.
# Each glyph is 7 rows of 5 characters; "#" lights a dot.
# ---------------------------------------------------------------------------
FONT_5X7 = {
    "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    "B": ["11110", "10001", "11110", "10001", "10001", "10001", "11110"],
    "C": ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
    "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    "E": ["11111", "10000", "11110", "10000", "10000", "10000", "11111"],
    "F": ["11111", "10000", "11110", "10000", "10000", "10000", "10000"],
    "G": ["01111", "10000", "10000", "10011", "10001", "10001", "01111"],
    "H": ["10001", "10001", "11111", "10001", "10001", "10001", "10001"],
    "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    "J": ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
    "K": ["10001", "10010", "11100", "10100", "10010", "10010", "10001"],
    "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
    "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
    "Q": ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
    "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
    "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
    "W": ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
    "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
    "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
    "Z": ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
    "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
    "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
    "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
    "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
    "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
    "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
    "6": ["01110", "10000", "11110", "10001", "10001", "10001", "01110"],
    "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
    "8": ["01110", "10001", "01110", "10001", "10001", "10001", "01110"],
    "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
    " ": ["00000"] * 7,
    ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
}

GLYPH_W, GLYPH_H = 5, 7


def glyph_mask(text):
    """Return (width, height, set_of_lit_cells) for text in the 5x7 alphabet."""
    cells = set()
    x = 0
    for char in text.upper():
        rows = FONT_5X7.get(char)
        if rows is None:
            x += GLYPH_W + 1
            continue
        for ry, row in enumerate(rows):
            for rx, bit in enumerate(row):
                if bit != "0":
                    cells.add((x + rx, ry))
        x += GLYPH_W + 1
    return max(0, x - 1), GLYPH_H, cells


def seeded(slug):
    """A stable pseudo-random stream per project, so covers never shuffle."""
    digest = hashlib.sha256(slug.encode("utf-8")).digest()
    state = int.from_bytes(digest[:8], "big")

    def nxt():
        nonlocal state
        state = (state * 6364136223846793005 + 1442695040888963407) % (1 << 64)
        return (state >> 11) / float(1 << 53)

    return nxt


def field_value(kind, u, v, rnd_a, rnd_b):
    """Background field in normalised coords, 0..1. One shape family per project."""
    cx, cy = 0.5 + rnd_a * 0.22 - 0.11, 0.5 + rnd_b * 0.22 - 0.11
    dx, dy = u - cx, (v - cy) * 0.72
    r = math.hypot(dx, dy)
    ang = math.atan2(dy, dx)
    if kind == 0:                                     # concentric rings
        return 0.5 + 0.5 * math.sin(r * 34.0 - rnd_a * 6.0)
    if kind == 1:                                     # travelling swell
        return 0.5 + 0.5 * math.sin(u * 11.0 + math.sin(v * 6.0 + rnd_b * 5.0) * 1.9)
    if kind == 2:                                     # spiral arm
        return 0.5 + 0.5 * math.sin(ang * 3.0 + r * 26.0 - rnd_a * 6.0)
    if kind == 3:                                     # diagonal interference
        return 0.5 + 0.5 * math.sin((u + v) * 15.0 + rnd_b * 6.0) * math.cos((u - v) * 9.0)
    return max(0.0, 1.0 - r * 1.9)                    # soft core


def build_generated(slug, text):
    """A dot-matrix cover: generative field behind, project wordmark in front."""
    rnd = seeded(slug)
    kind = int(rnd() * 5)
    rnd_a, rnd_b = rnd(), rnd()
    tilt = (rnd() - 0.5) * 0.5

    img = Image.new("RGB", (CARD_W, CARD_H), BG)

    # One restrained accent bloom under the dots. Kept low so the ground stays
    # near-black like the rest of the site; the accent is a highlight, not a wash.
    glow = Image.new("RGB", (CARD_W, CARD_H), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gx, gy = int(CARD_W * (0.24 + rnd_a * 0.52)), int(CARD_H * (0.24 + rnd_b * 0.52))
    gr = int(CARD_W * 0.30)
    gd.ellipse([gx - gr, gy - gr, gx + gr, gy + gr], fill=(34, 13, 4))
    img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(110)), 0.9)

    draw = ImageDraw.Draw(img)

    # Dot pitch is deliberately coarse: a card renders around 400 CSS px wide,
    # so a fine lattice would moire away on a 1x display.
    step = 10
    cols, rows = CARD_W // step, CARD_H // step

    # Place the wordmark on the same lattice as the dots so nothing is off-grid.
    # Every name is fitted to about the same optical width, so the set reads as a series.
    gw, gh, lit = glyph_mask(text)
    scale = max(1, min(round((cols * 0.68) / max(1, gw)), int((rows * 0.42) // gh)))
    mark_w, mark_h = gw * scale, gh * scale
    ox, oy = (cols - mark_w) // 2, int(rows * 0.5) - mark_h // 2

    def in_mark(cx, cy):
        mx, my = cx - ox, cy - oy
        if mx < 0 or my < 0 or mx >= mark_w or my >= mark_h:
            return False
        return (mx // scale, my // scale) in lit

    # Distance in cells from the wordmark's box, used to clear a dark plate behind
    # the letters so they never fight the field for contrast.
    pad_x, pad_y = scale * 2 + 2, scale * 2 + 1

    def plate(cx, cy):
        dx = max(ox - pad_x - cx, cx - (ox + mark_w + pad_x), 0)
        dy = max(oy - pad_y - cy, cy - (oy + mark_h + pad_y), 0)
        d = math.hypot(dx, dy)
        return max(0.0, 1.0 - d / 7.0)

    for cy in range(rows):
        for cx in range(cols):
            u, v = cx / cols, cy / rows
            base = field_value(kind, u + tilt * v, v, rnd_a, rnd_b)
            # A gentle vignette only: strong enough to centre the image, weak
            # enough that each field family keeps its own shape.
            vign = 0.42 + 0.58 * max(0.0, 1.0 - math.hypot(u - 0.5, (v - 0.5) * 1.05) * 1.25)
            level = base * base * vign * 0.72
            level *= 1.0 - 0.82 * plate(cx, cy)
            mark = in_mark(cx, cy)
            if mark:
                level = 0.80 + 0.20 * base
            if level < 0.085:
                continue
            radius = (step * 0.40) if mark else (0.75 + level * 2.7)
            px, py = cx * step + step / 2, cy * step + step / 2
            if mark:
                col = (
                    int(190 + 62 * level),
                    int(178 + 58 * level),
                    int(168 + 50 * level),
                )
            else:
                # Field dots stay near-neutral until they are bright, then warm
                # toward the accent. Same restraint as the hero canvas.
                warm = max(0.0, (level - 0.22)) * 1.9
                col = (
                    int(58 + 150 * level + ACCENT[0] * 0.30 * warm),
                    int(56 + 132 * level + ACCENT[1] * 0.14 * warm),
                    int(55 + 126 * level + ACCENT[2] * 0.05 * warm),
                )
            col = tuple(min(255, max(0, c)) for c in col)
            draw.ellipse([px - radius, py - radius, px + radius, py + radius], fill=col)

    # Hairline frame, matching the card borders in the CSS.
    draw.rectangle([0, 0, CARD_W - 1, CARD_H - 1], outline=(34, 34, 34))
    return img


def build_from_shot(name):
    """Crop an existing screenshot to the card ratio, top-weighted."""
    src = Image.open(os.path.join(IMG, name)).convert("RGB")
    target = CARD_W / CARD_H
    w, h = src.size
    if w / h > target:                       # too wide: trim the sides
        new_w = int(h * target)
        left = (w - new_w) // 2
        src = src.crop((left, 0, left + new_w, h))
    else:                                    # too tall: keep the top of the UI
        new_h = int(w / target)
        src = src.crop((0, 0, w, new_h))
    return src.resize((CARD_W, CARD_H), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    written = 0
    total = 0
    for slug, name in sorted(FROM_SHOT.items()):
        path = os.path.join(IMG, name)
        if not os.path.exists(path):
            raise SystemExit("missing source screenshot: " + path)
        img = build_from_shot(name)
        dest = os.path.join(OUT, slug + ".webp")
        img.save(dest, "WEBP", quality=80, method=6)
        size = os.path.getsize(dest)
        total += size
        written += 1
        print("  shot   %-24s %6.1f KB" % (slug, size / 1024))
    for slug, text in sorted(GENERATED.items()):
        img = build_generated(slug, text)
        dest = os.path.join(OUT, slug + ".webp")
        img.save(dest, "WEBP", quality=74, method=6)
        size = os.path.getsize(dest)
        total += size
        written += 1
        print("  dots   %-24s %6.1f KB" % (slug, size / 1024))
    print("%d covers, %.1f KB total, %dx%d each" % (written, total / 1024, CARD_W, CARD_H))


if __name__ == "__main__":
    main()
