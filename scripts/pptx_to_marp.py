#!/usr/bin/env python3
"""Convert a PowerPoint deck to a Marp markdown twin.

Usage:
    python scripts/pptx_to_marp.py "<deck.pptx>" "<output lecture dir>" \
        --title "Structure" --week 2 --topic structure

Writes <outdir>/slides.md; embedded pictures go to <outdir>/img/.
Extraction is text-faithful, not layout-faithful (see design spec).
"""
import argparse
import re
import sys
from pathlib import Path

from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE
from pptx.oxml.ns import qn

# Image formats Chromium (and therefore Marp's HTML/PDF/PPTX renderers) can
# display natively. Anything else (e.g. legacy Windows Metafile) is still
# extracted to disk, but flagged so the deck doesn't silently render a
# broken image.
WEB_SAFE_EXTS = {"png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"}

# Fonts these decks use to mean "this line is source code", regardless of
# whether PowerPoint's own bullet/no-bullet paragraph property is set.
CODE_FONTS = {"courier new", "consolas", "courier", "menlo", "monaco",
              "lucida console"}

# Prefixes that mark a line as Java even when it carries none of the
# punctuation signals below (e.g. a lone "import java.util.List" with no
# trailing semicolon captured in its own paragraph).
CODE_KEYWORD_PREFIXES = (
    "public ", "private ", "protected ", "class ", "interface ", "enum ",
    "int ", "int[", "double ", "double[", "float ", "long ", "short ",
    "byte ", "boolean ", "char ", "char[", "String ", "String[", "void ",
    "return ", "return;", "static ", "final ", "import ", "package ",
    "new ", "if ", "if(", "else", "for ", "for(", "while ", "while(",
    "try ", "try{", "catch ", "catch(", "System.", "@Override",
)

# Non-breaking space / em space: several decks paste code with these in
# place of ASCII spaces (copy-pasted from rich text). Normalized only for
# the code-likeness *test*; the emitted fence line keeps the original text.
NBSP = "\xa0"
EMSP = " "


def _run_markdown(run):
    """A run's text, as a Markdown link if the run carries a hyperlink.

    Skipped when the visible text already IS the address (a bare URL is
    already a fine link target for Marp/GFM renderers).
    """
    text = run.text
    try:
        address = run.hyperlink.address
    except (AttributeError, KeyError):
        address = None
    if address and text and text != address:
        return f"[{text}]({address})"
    return text


def _para_text(para):
    """Join a paragraph's runs into one string, preserving hyperlinks."""
    return "".join(_run_markdown(run) for run in para.runs)


def _paragraph_default_font(para):
    """The paragraph's own default run typeface, if it sets one.

    Reads <a:pPr><a:defRPr><a:latin typeface="..."/>, which acts as a
    fallback for any run in the paragraph that doesn't override its font.
    """
    pPr = para._p.find(qn("a:pPr"))
    if pPr is None:
        return None
    defRPr = pPr.find(qn("a:defRPr"))
    if defRPr is None:
        return None
    latin = defRPr.find(qn("a:latin"))
    return latin.get("typeface") if latin is not None else None


def _is_code_font_paragraph(para):
    """True only if EVERY run carrying visible text resolves to a
    monospace/code typeface (own <a:rPr><a:latin>, falling back to the
    paragraph's <a:pPr><a:defRPr><a:latin> default).

    Deliberately whole-paragraph, not "any run": several decks style a
    single word as inline code inside an ordinary prose sentence (e.g.
    "...the deposit() and withdraw() methods encapsulate..."), and that
    must stay a bullet, not become a fence. A real code line has every
    run in the code font; an inline-styled word in a prose sentence does
    not.
    """
    default_font = _paragraph_default_font(para)
    runs_with_text = [r for r in para.runs if r.text.strip()]
    if not runs_with_text:
        return False
    for run in runs_with_text:
        rPr = run._r.find(qn("a:rPr"))
        latin = rPr.find(qn("a:latin")) if rPr is not None else None
        font = (latin.get("typeface") if latin is not None else None) or default_font
        if not font or font.strip().lower() not in CODE_FONTS:
            return False
    return True


def _looks_like_code(text):
    """Secondary confirmation: does the (already font-flagged) text also
    read like a line of Java, rather than prose/labels that merely
    borrowed the code font (e.g. a bare array-index diagram label)?
    """
    t = text.strip().replace(NBSP, " ").replace(EMSP, " ")
    if not t:
        return False
    if ";" in t or t.endswith("{") or t.startswith("}"):
        return True
    if t.startswith(("//", "/*", "*")):
        return True
    if " = " in t or " == " in t:
        return True
    if t.startswith(CODE_KEYWORD_PREFIXES):
        return True
    if re.search(r"\w\([^()]*\)", t):  # e.g. println(...), deposit() -- no
        return True                    # space before "(": excludes prose
    return False                       # like "...applies to (Cat, Tiger)"


def _is_code_paragraph(para):
    return _is_code_font_paragraph(para) and _looks_like_code(_para_text(para))


def text_frame_body_lines(text_frame):
    """Render one shape's paragraphs as Markdown body lines.

    Ordinary paragraphs become bullets (existing behaviour). Runs of
    consecutive whole-line-code paragraphs (see _is_code_paragraph) are
    grouped into a single fenced ```java block instead -- a shape with a
    5-line method body produces one fence, not 5 stray bullets.
    """
    lines = []
    code_buf = []

    def flush():
        if code_buf:
            lines.append("```java")
            lines.extend(code_buf)
            lines.append("```")
            code_buf.clear()

    for para in text_frame.paragraphs:
        text = _para_text(para)
        if not text.strip():
            continue
        if _is_code_paragraph(para):
            # Keep leading indentation (nested braces read as nested code);
            # only trailing whitespace is noise.
            code_buf.append(text.rstrip())
        else:
            flush()
            level = para.level or 0
            lines.append("  " * level + "- " + text.strip())
    flush()
    return lines


def sanitize_cell(text):
    """Collapse embedded line breaks into a single <br> and escape pipes.

    python-pptx joins a cell's paragraphs with "\\n" and represents a
    manual (soft) line break within a paragraph as "\\x0b" (vertical tab).
    Left raw, either character splits a `| ... |` table row across physical
    lines and corrupts the generated Markdown/Marp table.
    """
    text = re.sub(r"[ \t]*[\n\x0b]+[ \t\n\x0b]*", "<br>", text.strip())
    return text.replace("|", "\\|")


def table_markdown(table):
    rows = [[sanitize_cell(cell.text) for cell in row.cells]
            for row in table.rows]
    if not rows:
        return []
    out = ["| " + " | ".join(rows[0]) + " |",
           "|" + "---|" * len(rows[0])]
    out += ["| " + " | ".join(r) + " |" for r in rows[1:]]
    return out


def extract_slide(slide, idx, img_dir):
    """Return (title, body_lines, image_names, notes, non_web_images,
    image_alt, media_count).

    non_web_images is the subset of image_names saved in a format that
    browsers -- and therefore Marp's Chromium-based renderers -- cannot
    display natively (e.g. .wmf, .emf, .tiff). image_alt maps image name
    to its source alt/description text (may be ""). media_count is the
    number of embedded-video (MSO_SHAPE_TYPE.MEDIA) shapes on the slide.
    """
    title = None
    title_shape_id = None
    try:
        if slide.shapes.title is not None and slide.shapes.title.text.strip():
            title = slide.shapes.title.text.strip()
            # python-pptx returns a fresh proxy object on every access, so
            # `shape is slide.shapes.title` is always False. Compare the
            # stable shape_id instead so the title shape is actually
            # skipped below, not re-emitted as the slide's first bullet.
            title_shape_id = slide.shapes.title.shape_id
    except (AttributeError, KeyError):
        pass

    body, images, non_web_images, n_img = [], [], [], 0
    image_alt = {}
    media_count = 0
    for shape in slide.shapes:
        if title_shape_id is not None and shape.shape_id == title_shape_id:
            continue
        if shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
            n_img += 1
            ext = shape.image.ext
            name = f"slide{idx:02d}-{n_img}.{ext}"
            img_dir.mkdir(parents=True, exist_ok=True)
            (img_dir / name).write_bytes(shape.image.blob)
            images.append(name)
            try:
                descr = shape._element.nvPicPr.cNvPr.get("descr", "") or ""
            except (AttributeError, KeyError):
                descr = ""
            image_alt[name] = " ".join(descr.split())  # collapse embedded newlines
            if ext.lower() not in WEB_SAFE_EXTS:
                non_web_images.append(name)
        elif shape.shape_type == MSO_SHAPE_TYPE.MEDIA:
            media_count += 1
            body.append("> \U0001F3AC This slide has an embedded video in "
                         "the original deck (see `original/`).")
        elif getattr(shape, "has_table", False) and shape.has_table:
            body.extend(table_markdown(shape.table))
            body.append("")
        elif shape.has_text_frame:
            body.extend(text_frame_body_lines(shape.text_frame))

    notes = None
    if slide.has_notes_slide:
        text = slide.notes_slide.notes_text_frame.text.strip()
        notes = text or None
    return title, body, images, notes, non_web_images, image_alt, media_count


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
        title, body, images, notes, non_web_images, image_alt, media_count = \
            extract_slide(slide, idx, outdir / "img")
        total_images += len(images)
        if idx > 1:
            lines += ["---", ""]
        heading = "# " if idx == 1 else "## "
        lines.append(heading + (title or f"Slide {idx}"))
        lines.append("")
        if body:
            lines += body + [""]
        for name in images:
            lines.append(f"![{image_alt.get(name, '')}](img/{name})")
            if name in non_web_images:
                lines.append(f"<!-- image img/{name} not web-renderable -->")
                lines.append(f"> ⚠️ `img/{name}` is not "
                              "web-renderable — convert to PNG manually.")
            lines.append("")
        if notes:
            lines += ["<!-- Speaker notes:", notes, "-->", ""]
        if not title and not body and not images:
            warnings.append(f"slide {idx}: no extractable content")
        for name in non_web_images:
            ext = name.rsplit(".", 1)[-1]
            warnings.append(f"slide {idx}: image saved as .{ext} "
                             "- not web-renderable, needs manual conversion")
        for _ in range(media_count):
            warnings.append(f"slide {idx}: embedded video (MEDIA shape) "
                             "not extracted - see original/ for the source pptx")

    (outdir / "slides.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    for w in warnings:
        print("WARN:", w, file=sys.stderr)
    print(f"OK: {len(prs.slides)} slides, {total_images} images, "
          f"{len(warnings)} warnings")


if __name__ == "__main__":
    main()
