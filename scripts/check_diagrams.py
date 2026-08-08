#!/usr/bin/env python3
"""Fail if any committed diagram SVG is stale relative to its .mmd source.

scripts/render_diagrams.py stamps each rendered SVG with a sha256 of the
.mmd source + themes/ooc-mermaid.json. This check recomputes that hash and
compares it to the stamp, so an edited source (or theme config) without a
re-render fails CI. Pure Python -- no browser or Node needed.

Also fails on a diagram-*.svg with no .mmd source beside it, and on a
diagram-*.mmd with no rendered .svg.

Usage:
    python scripts/check_diagrams.py
    (silent + exit 0 when everything is in sync)
"""
import hashlib
import re
import sys
from pathlib import Path

CONFIG = Path("themes/ooc-mermaid.json")
MARKER_RE = re.compile(r"<!--mmd-sha256:([0-9a-f]{64})-->")
FIX = "run: python scripts/render_diagrams.py"


def source_digest(mmd: Path) -> str:
    h = hashlib.sha256()
    h.update(mmd.read_bytes())
    h.update(CONFIG.read_bytes())
    return h.hexdigest()


def main() -> None:
    failures = []
    sources = sorted(Path("weeks").glob("*/lecture/img/diagram-*.mmd"))
    rendered = sorted(Path("weeks").glob("*/lecture/img/diagram-*.svg"))
    for mmd in sources:
        svg = mmd.with_suffix(".svg")
        if not svg.exists():
            failures.append(f"{mmd}: no rendered SVG beside it ({FIX})")
            continue
        match = MARKER_RE.search(svg.read_text(encoding="utf-8"))
        if not match:
            failures.append(f"{svg}: missing mmd-sha256 stamp ({FIX})")
        elif match.group(1) != source_digest(mmd):
            failures.append(f"{svg}: stale — source or theme config "
                            f"changed since last render ({FIX})")
    known = {m.with_suffix(".svg") for m in sources}
    for svg in rendered:
        if svg not in known:
            failures.append(f"{svg}: no .mmd source beside it — commit the "
                            "mermaid source alongside every diagram SVG")
    for line in failures:
        print(line)
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
