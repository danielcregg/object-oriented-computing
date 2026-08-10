#!/usr/bin/env python3
"""Verify that every ```java fence in the lecture decks AND the lab
READMEs compiles.

Snippets are compiled with javac in a temp dir. A fence that is not a
complete compilation unit is retried inside two wrappers: a class body
(for field/method declarations) and a method body (for statements).
A fence deliberately showing broken code is skipped by placing
`<!-- no-compile -->` on the line directly above it.

Usage:
    python scripts/verify_snippets.py [FILE ...]
    (no args = all decks + all lab READMEs)

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

# A lab README builds one program across many fences: a later snippet may use
# a class an earlier snippet defined, or a variable it declared. So a fence
# that fails on its own is retried with the file's earlier (compilable)
# fences prepended as context. Deck fences get no such help -- decks are
# required to be self-contained, since a deck may be reused elsewhere.
CONTEXT_GLOB = "README.md"


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


TYPE_DECL_RE = re.compile(r"\b(?:class|interface|enum|record)\s+(\w+)")

# `public ` immediately preceding a type declaration, with any run of
# modifiers or annotations in between. Matches only the word `public`
# itself, so substituting "" leaves the rest of the declaration intact.
# `@interface` is listed before `interface` because alternation is ordered:
# at `@interface X`, the modifier run would otherwise swallow the token as
# an annotation and then find no type keyword.
PUBLIC_TYPE_RE = re.compile(
    r"\bpublic\s+"
    r"(?=(?:(?:final|abstract|sealed|non-sealed|static|strictfp|@\w+)\s+)*"
    r"(?:@interface|class|interface|enum|record)\b)")


def type_names(code):
    return set(TYPE_DECL_RE.findall(code))


def candidates(code, context=""):
    """Every plausible compilation unit for this snippet, cheapest first."""
    for w in WRAPPERS:
        yield w.format(code=code)
    if context:
        for w in WRAPPERS:
            yield context + "\n" + w.format(code=code)
        # context declares types at top level; the snippet is statements that
        # use them. Without this the types become LOCAL classes inside the
        # wrapper method and cannot be instantiated.
        yield context + "\nclass __Snippet__ { void __m__() throws Exception {\n" + code + "\n} }"


def compiles(code, workdir, context=""):
    src = Path(workdir) / "__Snippet__.java"
    last_error = []
    for candidate in candidates(code, context):
        # A public type needs its own filename, so strip `public` for the
        # probe. Matching `public` followed by any run of modifiers before
        # the type keyword covers `public final class`, `public record` and
        # `public sealed interface` -- an earlier version listed the keywords
        # that may FOLLOW public, so those three declarations were left
        # public and failed with "class X is public, should be declared in a
        # file named X.java": a snippet reported as broken Java when the only
        # broken thing was this probe.
        probe = PUBLIC_TYPE_RE.sub("", candidate)
        src.write_text(probe, encoding="utf-8")
        result = subprocess.run(
            ["javac", "-d", workdir, str(src)],
            capture_output=True, text=True)
        if result.returncode == 0:
            return True, ""
        last_error = result.stderr.strip().splitlines()
    return False, (last_error[0] if last_error else "unknown javac error")


def main():
    targets = [Path(a) for a in sys.argv[1:]] or (
        sorted(Path("weeks").glob("*/slides*.md"))
        + sorted(Path("labs/src/ie/atu").glob("*/README.md")))
    failures = 0
    with tempfile.TemporaryDirectory() as workdir:
        for path in targets:
            allow_context = path.name == CONTEXT_GLOB
            earlier = []          # compilable fences seen so far in this file
            for line, code, skip in fences(path.read_text(encoding="utf-8")):
                if skip or not code.strip():
                    continue
                # A lab often shows an evolving version of the same class, so
                # drop any earlier snippet declaring a type THIS one declares.
                own = type_names(code)
                ctx = "\n".join(c for c in earlier if not (type_names(c) & own)) \
                    if allow_context else ""
                ok, err = compiles(code, workdir, ctx)
                if ok:
                    # Only TYPE declarations make useful context. Carrying loose
                    # statements forward would redeclare variables the next
                    # snippet declares itself.
                    if allow_context and own:
                        # keep only the LATEST version of each class the lab
                        # has shown, so the context is never self-contradictory
                        earlier = [c for c in earlier if not (type_names(c) & own)]
                        earlier.append(code)
                else:
                    failures += 1
                    print(f"{path}:{line}: snippet does not compile: {err}")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
