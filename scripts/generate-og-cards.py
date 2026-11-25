#!/usr/bin/env python3
"""Generate deterministic 1200x630 OpenGraph preview cards for Hodos lessons and tools.

Uses only real atlas renders/plates already in viewer/media/ — never AI-generated anatomy.
Run from repo root: python3 scripts/generate-og-cards.py
"""
import json
import os
import subprocess
import textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
VIEWER = ROOT / "viewer"
OUT = VIEWER / "brand" / "og"
W, H = 1200, 630

BG = (19, 22, 25)        # #131619 B2 dark surface
PANEL = (30, 34, 39)     # #1E2227
BORDER = (56, 65, 74)    # subtle steel border
TEXT = (228, 230, 227)   # #E4E6E3
MUTED = (160, 170, 178)  # #A0AAB2
CYAN = (155, 225, 240)   # #9BE1F0
SAND = (214, 180, 132)   # #D6B484

FONT_CANDIDATES_BOLD = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/HelveticaNeue.ttc",
    "/Library/Fonts/Arial Bold.ttf",
]
FONT_CANDIDATES_REG = [
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/System/Library/Fonts/HelveticaNeue.ttc",
    "/Library/Fonts/Arial.ttf",
]


def load_font(candidates, size):
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def cover_crop(img, tw, th):
    iw, ih = img.size
    scale = max(tw / iw, th / ih)
    nw, nh = int(round(iw * scale)), int(round(ih * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return resized.crop((left, top, left + tw, top + th))


def plate_for_lesson(lesson):
    lid = lesson["id"]
    cat = lesson["category"]
    direct = VIEWER / "media" / "lesson-previews" / f"plate-{lid}-20260928.jpg"
    if direct.exists():
        return direct
    if cat == "Network lectures":
        return VIEWER / "media" / "landing" / "family-networks-loop-20260926.jpg"
    if "language" in lid or "reading" in lid or "fat" in lid:
        return VIEWER / "media" / "landing" / "family-language-loop-20260926.jpg"
    if "motor" in lid or "capsule" in lid or "brainstem" in lid:
        return VIEWER / "media" / "landing" / "family-projection-loop-20260926.jpg"
    if "callosum" in lid or "ventral" in lid or "limen" in lid or "medial" in lid or "optic" in lid:
        return VIEWER / "media" / "landing" / "family-association-loop-20260926.jpg"
    return VIEWER / "media" / "landing" / "hero-blender-s1-1080-20261107.jpg"


def draw_mark(draw, x, y, s=30):
    # Minimal Hodos three-node fascicle mark matching viewer/brand/hodos-mark.svg
    draw.line([(x + 3, y + s - 6), (x + s * 0.55, y + s * 0.44), (x + s - 4, y + 6)], fill=CYAN, width=3)
    draw.line([(x + 2, y + s - 12), (x + s * 0.52, y + s * 0.34), (x + s - 6, y + 2)], fill=(110, 175, 192), width=2)
    for cx, cy, col in [(x + 3, y + s - 6, CYAN), (x + s * 0.55, y + s * 0.44, CYAN), (x + s - 4, y + 6, SAND)]:
        draw.ellipse([cx - 3.5, cy - 3.5, cx + 3.5, cy + 3.5], fill=col)


def render_card(out_path, eyebrow, title, subtitle, footer_url, plate_path):
    canvas = Image.new("RGB", (W, H), BG)
    # Right-side real atlas visual panel (520x630) with smooth dark gradient blend
    pw = 560
    if plate_path and plate_path.exists():
        plate = cover_crop(Image.open(plate_path).convert("RGB"), pw, H)
        grad = Image.new("RGBA", (pw, H), (0, 0, 0, 0))
        gd = ImageDraw.Draw(grad)
        for x in range(230):
            alpha = int(255 * (1.0 - x / 230.0) ** 1.5)
            gd.line([(x, 0), (x, H)], fill=(BG[0], BG[1], BG[2], alpha))
        blended = Image.alpha_composite(plate.convert("RGBA"), grad).convert("RGB")
        canvas.paste(blended, (W - pw, 0))

    draw = ImageDraw.Draw(canvas)
    f_brand = load_font(FONT_CANDIDATES_BOLD, 24)
    f_eyebrow = load_font(FONT_CANDIDATES_BOLD, 19)
    f_title = load_font(FONT_CANDIDATES_BOLD, 48)
    f_title_sm = load_font(FONT_CANDIDATES_BOLD, 41)
    f_sub = load_font(FONT_CANDIDATES_REG, 23)
    f_meta = load_font(FONT_CANDIDATES_REG, 18)

    # Top brand row
    draw_mark(draw, 56, 46, 30)
    draw.text((98, 48), "HODOS", font=f_brand, fill=TEXT)
    draw.text((204, 53), "NEUROANATOMY ATLAS", font=f_meta, fill=MUTED)

    # Eyebrow pill/label
    draw.text((56, 128), eyebrow.upper(), font=f_eyebrow, fill=CYAN)

    # Title (auto-wrap, shrink slightly if long)
    font_t = f_title if len(title) <= 34 else f_title_sm
    max_chars = 24 if font_t is f_title else 28
    title_lines = textwrap.wrap(title, width=max_chars)[:3]
    ty = 168
    line_step = 58 if font_t is f_title else 50
    for line in title_lines:
        draw.text((56, ty), line, font=font_t, fill=TEXT)
        ty += line_step

    # Subtitle
    sub_lines = textwrap.wrap(subtitle, width=52)[:3]
    sy = max(ty + 24, 345)
    for line in sub_lines:
        draw.text((56, sy), line, font=f_sub, fill=MUTED)
        sy += 34

    # Bottom divider & URL/disclaimer (confined to text column)
    draw.line([(56, H - 94), (630, H - 94)], fill=BORDER, width=1)
    draw.text((56, H - 72), footer_url, font=f_meta, fill=SAND)
    draw.text((56, H - 44), "Reference atlas, not surgical navigation · Dr. Erion de Andrade", font=f_meta, fill=MUTED)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out_path, format="JPEG", quality=88, optimize=True, progressive=True)


def main():
    raw = subprocess.check_output(
        [
            "node",
            "-e",
            "import('./viewer/lesson_content.js').then(({LESSONS})=>console.log(JSON.stringify(LESSONS.map(l=>({id:l.id,title:l.title,category:l.category,minutes:l.minutes,steps:l.steps.length,summary:l.summary})))))",
        ],
        cwd=str(ROOT),
    )
    lessons = json.loads(raw.decode("utf-8"))

    generated = []
    for l in lessons:
        out = OUT / f"lesson-{l['id']}.jpg"
        sub = f"{l['steps']} relationships · ~{l['minutes']} min · Free 3D lesson"
        render_card(
            out,
            eyebrow=l["category"],
            title=l["title"],
            subtitle=sub,
            footer_url=f"hodosatlas.com/lessons/{l['id']}",
            plate_path=plate_for_lesson(l),
        )
        generated.append(out)

    tools = [
        (
            "atlas",
            "3D Reference Atlas",
            "The reference atlas and 20 guided lessons.",
            "HCP S1200 cortex, HCP-MMP1 parcels, Yeo-7 networks and HCP1065 pathways.",
            "hodosatlas.com/atlas",
            VIEWER / "media" / "landing" / "hero-blender-s1-1080-20261107.jpg",
        ),
        (
            "lesion-lab",
            "Lesion & Corridor Lab",
            "Where a lesion sits decides what it disconnects.",
            "Drag a sphere, compare corridors A and B, and read verbatim deficit quotes with PubMed IDs.",
            "hodosatlas.com/labs/lesion-lab",
            VIEWER / "media" / "landing" / "lesion-lab-20260928.jpg",
        ),
        (
            "mips",
            "MIPS Corridor Exercise",
            "One target, two corridors.",
            "Compare two illustrative parafascicular trajectories in 3D white matter.",
            "hodosatlas.com/mips",
            VIEWER / "media" / "landing" / "family-projection-loop-20260926.jpg",
        ),
        (
            "case-conference",
            "Case Conference",
            "Bring your reasoning to the conference.",
            "Four staged glioma teaching cases for senior neurosurgical residents.",
            "hodosatlas.com/case-conference",
            VIEWER / "media" / "landing" / "case-right-medial-frontal-20260914.jpg",
        ),
        (
            "connections",
            "Connections Graph",
            "What connects to what, in the notes' own words.",
            "264 structures, 273 links and 287 verbatim quotes from white matter teaching notes.",
            "hodosatlas.com/connections",
            VIEWER / "media" / "landing" / "family-networks-loop-20260926.jpg",
        ),
    ]
    for slug, eyebrow, title, subtitle, url, plate in tools:
        out = OUT / f"{slug}.jpg"
        render_card(out, eyebrow, title, subtitle, url, plate)
        generated.append(out)

    total_kb = sum(p.stat().st_size for p in generated) / 1024
    print(f"Generated {len(generated)} OG cards in {OUT} ({total_kb:.1f} KB total)")


if __name__ == "__main__":
    main()
