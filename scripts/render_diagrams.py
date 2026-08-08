#!/usr/bin/env python3
"""Render every mermaid diagram source to its committed SVG.

Finds weeks/*/lecture/img/diagram-*.mmd (or the paths given as args),
renders each with the pinned mermaid-cli and the shared theme config
(themes/ooc-mermaid.json), and stamps the output with a hash of the
source + config so scripts/check_diagrams.py can detect stale SVGs.

Usage:
    python scripts/render_diagrams.py [path/to/diagram-x.mmd ...]
    (no args = all diagrams; also available as `npm run render:diagrams`)

Requires Node (mermaid-cli is fetched via npx on first use). If Chrome
is not auto-detected, point PUPPETEER_EXECUTABLE_PATH at a Chrome/Chromium
binary before running.
"""
import hashlib
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

MERMAID_CLI = "@mermaid-js/mermaid-cli@11"
CONFIG = Path("themes/ooc-mermaid.json")
MARKER = "<!--mmd-sha256:{digest}-->"


def source_digest(mmd: Path) -> str:
    h = hashlib.sha256()
    h.update(mmd.read_bytes())
    h.update(CONFIG.read_bytes())
    return h.hexdigest()


def puppeteer_config_args(tmpdir: str) -> list[str]:
    exe = os.environ.get("PUPPETEER_EXECUTABLE_PATH")
    if not exe:
        return []
    cfg = Path(tmpdir) / "puppeteer.json"
    cfg.write_text(json.dumps(
        {"executablePath": exe, "args": ["--no-sandbox", "--disable-gpu"]}))
    return ["-p", str(cfg)]


def main() -> None:
    targets = [Path(a) for a in sys.argv[1:]] or sorted(
        Path("weeks").glob("*/lecture/img/diagram-*.mmd"))
    if not targets:
        print("no diagram sources found")
        sys.exit(1)
    failures = 0
    with tempfile.TemporaryDirectory() as tmpdir:
        extra = puppeteer_config_args(tmpdir)
        for mmd in targets:
            svg = mmd.with_suffix(".svg")
            result = subprocess.run(
                ["npx", "-y", MERMAID_CLI, "-c", str(CONFIG), *extra,
                 "-i", str(mmd), "-o", str(svg), "-b", "transparent"],
                capture_output=True, text=True)
            if result.returncode != 0:
                failures += 1
                print(f"{mmd}: render failed:\n{result.stderr.strip()}")
                continue
            text = svg.read_text(encoding="utf-8")
            marker = MARKER.format(digest=source_digest(mmd))
            if "</svg>" not in text:
                failures += 1
                print(f"{svg}: unexpected output (no closing </svg>)")
                continue
            head, _, _ = text.rpartition("</svg>")
            svg.write_text(head + marker + "</svg>", encoding="utf-8")
            print(f"rendered {svg}")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
