#!/usr/bin/env python3
"""Verify that every ```java fence in the lecture decks compiles.

Snippets are compiled with javac in a temp dir. A fence that is not a
complete compilation unit is retried inside two wrappers: a class body
(for field/method declarations) and a method body (for statements).
A fence deliberately showing broken code is skipped by placing
`<!-- no-compile -->` on the line directly above it.

Usage:
    python scripts/verify_snippets.py [weeks/week-NN-*/slides.md ...]
    (no args = all decks)

Prints one line per failing snippet; silent + exit 0 when all pass.
"""
import re
import subprocess
import sys
import tempfile
from pathlib import Path

WRAPPERS = [
    "{code}",
    "class __Snippet__ {{\n{code}\n}}",
    "class __Snippet__ {{ void __m__() throws Exception {{\n{code}\n}}\n}}",
]


def fences(text):
    """Yield (line_number, code, skip) for each java fence."""
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        if lines[i].strip().startswith("```java"):
            skip = i > 0 and "no-compile" in lines[i - 1]
            start = i + 1
            j = start
            while j < len(lines) and not lines[j].strip().startswith("```"):
                j += 1
            yield start + 1, "\n".join(lines[start:j]), skip
            i = j + 1
        else:
            i += 1


def compiles(code, workdir):
    src = Path(workdir) / "__Snippet__.java"
    for wrapper in WRAPPERS:
        candidate = wrapper.format(code=code)
        # a public class needs its own filename; strip public for the probe
        probe = re.sub(r"\bpublic\s+(class|interface|enum|abstract)\b",
                       r"\1", candidate)
        src.write_text(probe, encoding="utf-8")
        result = subprocess.run(
            ["javac", "-d", workdir, str(src)],
            capture_output=True, text=True)
        if result.returncode == 0:
            return True, ""
        last_error = result.stderr.strip().splitlines()
    return False, (last_error[0] if last_error else "unknown javac error")


def main():
    targets = [Path(a) for a in sys.argv[1:]] or sorted(
        Path("weeks").glob("*/slides*.md"))
    failures = 0
    with tempfile.TemporaryDirectory() as workdir:
        for path in targets:
            for line, code, skip in fences(path.read_text(encoding="utf-8")):
                if skip or not code.strip():
                    continue
                ok, err = compiles(code, workdir)
                if not ok:
                    failures += 1
                    print(f"{path}:{line}: snippet does not compile: {err}")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
