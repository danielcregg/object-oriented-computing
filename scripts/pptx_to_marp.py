#!/usr/bin/env python3
"""Convert a PowerPoint deck to a Marp markdown twin.

Usage:
    python scripts/pptx_to_marp.py "<deck.pptx>" "<output lecture dir>" \
        --title "Structure" --week 2 --topic structure

Writes <outdir>/slides.md; embedded pictures go to <outdir>/img/.
Extraction is text-faithful, not layout-faithful (see design spec).
"""
import argparse
import sys
from pathlib import Path

from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE


def para_bullets(text_frame):
    """Yield (indent_level, text) for each non-empty paragraph."""
    for para in text_frame.paragraphs:
        text = "".join(run.text for run in para.runs).strip()
        if text:
            yield para.level or 0, text


def table_markdown(table):
    rows = [[cell.text.strip().replace("|", "\\|") for cell in row.cells]
            for row in table.rows]
    if not rows:
        return []
    out = ["| " + " | ".join(rows[0]) + " |",
           "|" + "---|" * len(rows[0])]
    out += ["| " + " | ".join(r) + " |" for r in rows[1:]]
    return out


def extract_slide(slide, idx, img_dir):
    """Return (title, body_lines, image_names, notes)."""
    title = None
    try:
        if slide.shapes.title is not None and slide.shapes.title.text.strip():
            title = slide.shapes.title.text.strip()
    except (AttributeError, KeyError):
        pass

    body, images, n_img = [], [], 0
    for shape in slide.shapes:
        if title is not None and shape is slide.shapes.title:
            continue
        if shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
            n_img += 1
            name = f"slide{idx:02d}-{n_img}.{shape.image.ext}"
            img_dir.mkdir(parents=True, exist_ok=True)
            (img_dir / name).write_bytes(shape.image.blob)
            images.append(name)
        elif getattr(shape, "has_table", False) and shape.has_table:
            body.extend(table_markdown(shape.table))
            body.append("")
        elif shape.has_text_frame:
            for level, text in para_bullets(shape.text_frame):
                body.append("  " * level + "- " + text)

    notes = None
    if slide.has_notes_slide:
        text = slide.notes_slide.notes_text_frame.text.strip()
        notes = text or None
    return title, body, images, notes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pptx")
    ap.add_argument("outdir")
    ap.add_argument("--title", required=True)
    ap.add_argument("--week", required=True, type=int)
    ap.add_argument("--topic", required=True)
    args = ap.parse_args()

    src = Path(args.pptx)
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    prs = Presentation(src)

    lines = ["---", "marp: true", "theme: default", "paginate: true",
             f'title: "{args.title}"', f"week: {args.week}",
             f"topic: {args.topic}", "type: lecture",
             f'source: "{src.name}"', "---", ""]
    warnings, total_images = [], 0

    for idx, slide in enumerate(prs.slides, start=1):
        title, body, images, notes = extract_slide(slide, idx, outdir / "img")
        total_images += len(images)
        if idx > 1:
            lines += ["---", ""]
        heading = "# " if idx == 1 else "## "
        lines.append(heading + (title or f"Slide {idx}"))
        lines.append("")
        if body:
            lines += body + [""]
        for name in images:
            lines += [f"![](img/{name})", ""]
        if notes:
            lines += ["<!-- Speaker notes:", notes, "-->", ""]
        if not title and not body and not images:
            warnings.append(f"slide {idx}: no extractable content")

    (outdir / "slides.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    for w in warnings:
        print("WARN:", w, file=sys.stderr)
    print(f"OK: {len(prs.slides)} slides, {total_images} images, "
          f"{len(warnings)} warnings")


if __name__ == "__main__":
    main()
