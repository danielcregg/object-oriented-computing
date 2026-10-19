#!/usr/bin/env python3
"""Trace a student's own Java program line by line and turn it into step-through animation data.

Powers the guide's "Watch my code run" button. Standard library only.

    trace(lab_dir, "week05.arrays_lab.Main") -> dict

compiles the .java files directly in lab_dir with `javac -g --release 21` into a temp
dir, runs Tracer.java (the JDK's own Java Debug Interface) on the program, and returns
the animation JSON the guide's stepper renders (interactive/static/stepper.js):

    {"id": "trace", "title": "Your code, step by step",
     "segments": [{"example": None, "extra": False, "title": "Main.java",
                   "code": [...lines of Main.java...], "steps": [...]}]}

Each step is a line of Main.java that has just run, with the picture after it (the
current frame's variables, the arrays and objects they reach), what it printed, and a
caption that says what changed. Calls into Main's own methods are stepped into; code in
other files (Book.java) and the JDK runs inside one step. A compile error returns
{"error": "compile", "message": ...}; other failures {"error": "no_code" | "run" |
"tracer", "message": ...}.

CLI:
    python3 interactive/codespace/tracer/trace.py --lab-dir DIR --main week05.arrays_lab.Main
    python3 interactive/codespace/tracer/trace.py --build [OUTDIR]   # compiles Tracer.java

Tracer.java is compiled once: trace() uses $LAB_TRACER_CLASSES, else tracer/classes
(the default --build OUTDIR), else compiles it into ~/.cache/lab-tracer/ on first use.
"""
import argparse
import hashlib
import json
import os
import re
import signal
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "Tracer.java"
STAMP = "tracer.stamp"
JAVA_RELEASE = os.environ.get("LAB_JAVA_RELEASE", "21")
JVM_FLAGS = ["-XX:+UseSerialGC", "-XX:TieredStopAtLevel=1", "-XX:-UsePerfData", "-Xmx256m"]
JAVAC_FLAGS = ["-J-XX:+UseSerialGC", "-J-XX:TieredStopAtLevel=1", "-J-XX:-UsePerfData",
               "-encoding", "UTF-8", "--release", JAVA_RELEASE, "-proc:none"]
# javac's StringBuilder concatenation instead of invokedynamic: the program prints the same,
# and the first `"x" + y` does not run thousands of JDK bootstrap calls under the debugger.
STUDENT_FLAGS = ["-g", "-XDstringConcat=inline"]
OUTPUT_CAP = 65536
MESSAGE_LIMIT = 4000
COMPILE_TIMEOUT = 30.0
SCRUB_ENV = ("JAVA_TOOL_OPTIONS", "JDK_JAVA_OPTIONS", "_JAVA_OPTIONS", "CLASSPATH")


# ---- running processes ------------------------------------------------------------------------

def _env() -> dict:
    env = dict(os.environ)
    for name in SCRUB_ENV:
        env.pop(name, None)
    return env


def _run(cmd: list[str], timeout: float, cwd: Path | None = None) -> tuple[int | None, str, str]:
    """Run cmd in its own process group with no input; kill the whole group afterwards,
    so a JVM it started cannot outlive it. Returns (exit code or None on timeout, out, err)."""
    proc = subprocess.Popen(cmd, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE, start_new_session=True, cwd=cwd, env=_env())
    try:
        out, err = proc.communicate(timeout=timeout)
        code = proc.returncode
    except subprocess.TimeoutExpired:
        _kill_group(proc.pid)
        out, err = proc.communicate()
        code = None
    finally:
        _kill_group(proc.pid)
    decode = lambda b: b.decode("utf-8", errors="replace")  # noqa: E731
    return code, decode(out), decode(err)


def _kill_group(pgid: int) -> None:
    try:
        os.killpg(pgid, signal.SIGKILL)
    except (ProcessLookupError, PermissionError):
        pass


# ---- the Java side ---------------------------------------------------------------------------------

def _source_stamp() -> str:
    return hashlib.sha256(SOURCE.read_bytes()).hexdigest()[:16]


def _ready(folder: Path, stamp: str) -> bool:
    try:
        return (folder / "Tracer.class").is_file() and (folder / STAMP).read_text().strip() == stamp
    except OSError:
        return False


def build(outdir: Path | str | None = None) -> Path:
    """Compile Tracer.java into outdir (default tracer/classes beside this file)."""
    outdir = Path(outdir) if outdir else HERE / "classes"
    outdir.mkdir(parents=True, exist_ok=True)
    code, out, err = _run(["javac", *JAVAC_FLAGS, "-d", str(outdir), str(SOURCE)], COMPILE_TIMEOUT)
    if code != 0:
        raise RuntimeError(f"could not compile Tracer.java: {(err + out).strip()}")
    (outdir / STAMP).write_text(_source_stamp() + "\n")
    return outdir


def tracer_classes() -> Path:
    """Where the compiled tracer is; compiles it on first use when nothing up to date exists."""
    stamp = _source_stamp()
    for candidate in (os.environ.get("LAB_TRACER_CLASSES"), HERE / "classes"):
        if candidate and _ready(Path(candidate), stamp):
            return Path(candidate)
    cache_root = Path(os.environ.get("XDG_CACHE_HOME") or Path.home() / ".cache") / "lab-tracer"
    target = cache_root / stamp
    if _ready(target, stamp):
        return target
    cache_root.mkdir(parents=True, exist_ok=True)
    work = Path(tempfile.mkdtemp(prefix="build-", dir=cache_root))
    try:
        build(work)
        try:
            work.rename(target)  # atomic: a trace running alongside sees all or nothing
        except OSError:          # someone else got there first
            if not _ready(target, stamp):
                raise
    finally:
        if work.exists():
            for f in sorted(work.rglob("*"), reverse=True):
                f.unlink() if f.is_file() else f.rmdir()
            work.rmdir()
    return target


# ---- tracing ------------------------------------------------------------------------------------------

def trace(lab_dir: Path, main_class: str, *, max_steps: int = 400, timeout: float = 12.0,
          cwd: Path | None = None) -> dict:
    """Compile and run the program in lab_dir under the tracer; return the animation JSON."""
    lab_dir = Path(lab_dir)
    sources = sorted(lab_dir.glob("*.java")) if lab_dir.is_dir() else []
    if not sources:
        return {"error": "no_code", "message": f"There's no Java file in {lab_dir.name} yet."}
    max_steps = max(2, int(max_steps))
    try:
        tracer = tracer_classes()
    except (OSError, RuntimeError) as err:  # no JDK on PATH, or Tracer.java does not compile
        return {"error": "tracer", "message": f"The tracer could not be prepared: {err}"}
    with tempfile.TemporaryDirectory(prefix="lab-trace-") as tmp:
        classes = Path(tmp) / "classes"
        classes.mkdir()
        try:
            code, out, err = _run(["javac", *JAVAC_FLAGS, *STUDENT_FLAGS, "-d", str(classes),
                                   *map(str, sources)], COMPILE_TIMEOUT)
            if code != 0:
                message = (err + out).strip() or "javac stopped without a message."
                if code is None:
                    message = "Compiling took too long and was stopped. Try again."
                return {"error": "compile", "message": _shorten(message, lab_dir)}
            cmd = ["java", *JVM_FLAGS, "-cp", str(tracer), "Tracer", "--classes", str(classes),
                   "--main", main_class, "--max-steps", str(max_steps),
                   "--timeout-ms", str(int(timeout * 1000)), "--output-cap", str(OUTPUT_CAP)]
            if cwd and Path(cwd).is_dir():
                cmd += ["--cwd", str(Path(cwd).resolve())]
            code, out, err = _run(cmd, timeout + 10, cwd=Path(tmp))
        except OSError as error:  # javac or java missing
            return {"error": "tracer", "message": f"Java could not be run: {error}"}
    if code is None:
        return {"error": "tracer", "message": "The tracer did not finish in time."}
    try:
        raw = json.loads(out)
    except ValueError:
        return {"error": "tracer", "message": _shorten((err or out).strip()[-MESSAGE_LIMIT:], lab_dir)}
    code_file = lab_dir / (raw.get("file") or main_class.rpartition(".")[2] + ".java")
    try:
        text = code_file.read_text(encoding="utf-8", errors="replace")
    except OSError:
        text = ""
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    if lines and lines[-1] == "":
        lines.pop()
    return animate(raw, lines, title=code_file.name, max_steps=max_steps, timeout=timeout)


def _shorten(text: str, lab_dir: Path) -> str:
    for prefix in {str(lab_dir) + os.sep, str(lab_dir.resolve()) + os.sep}:
        text = text.replace(prefix, "")
    return text if len(text) <= MESSAGE_LIMIT else text[:MESSAGE_LIMIT] + "\n…"


# ---- reading the student's source -------------------------------------------------------------

def _blank_literals(lines: list[str]) -> list[str]:
    """Each line with comments and the insides of string and char literals blanked out,
    so brackets and names in them are not mistaken for code. Same length as the original."""
    out, in_comment = [], False
    for text in lines:
        res, i, n = [], 0, len(text)
        while i < n:
            if in_comment:
                if text.startswith("*/", i):
                    in_comment = False
                    res.append("  ")
                    i += 2
                else:
                    res.append(" ")
                    i += 1
            elif text.startswith("//", i):
                res.append(" " * (n - i))
                i = n
            elif text.startswith("/*", i):
                in_comment = True
                res.append("  ")
                i += 2
            elif text[i] in "\"'":
                quote, j = text[i], i + 1
                while j < n and text[j] != quote:
                    j += 2 if text[j] == "\\" else 1
                j = min(j, n - 1)
                res.append(quote + " " * (j - i - 1) + (text[j] if j > i else ""))
                i = j + 1
            else:
                res.append(text[i])
                i += 1
        out.append("".join(res)[:n].ljust(n))
    return out


def _match_paren(text: str, start: int, open_ch: str = "(", close_ch: str = ")") -> int:
    """Index of the bracket closing the one at text[start], or -1."""
    depth = 0
    for i in range(start, len(text)):
        if text[i] == open_ch:
            depth += 1
        elif text[i] == close_ch:
            depth -= 1
            if depth == 0:
                return i
    return -1


HEADER_RE = re.compile(r"^\s*(?:\}\s*)?(?:else\s+)?(for|while|if)\s*\(")
IDENT_RE = re.compile(r"[A-Za-z_$][\w$]*")
KEYWORDS = set("""abstract boolean break byte case catch char class continue default do double else
enum extends final finally float for if implements import instanceof int interface long new package
private protected public return short static super switch this throw throws try var void while
true false null""".split())


class Source:
    """What the tracer needs to know about Main.java's text: loops, ifs, blocks, calls."""

    def __init__(self, lines: list[str]):
        self.lines = lines
        self.clean = _blank_literals(lines)
        self.close: dict[tuple[int, int], int] = {}
        stack = []
        for ln, text in enumerate(self.clean, 1):
            for col, ch in enumerate(text):
                if ch == "{":
                    stack.append((ln, col))
                elif ch == "}" and stack:
                    self.close[stack.pop()] = ln
        self._headers: dict[int, dict | None] = {}

    def text(self, line: int | None) -> str:
        return self.lines[line - 1] if line and 0 < line <= len(self.lines) else ""

    def clean_text(self, line: int | None) -> str:
        return self.clean[line - 1] if line and 0 < line <= len(self.clean) else ""

    def header(self, line: int | None) -> dict | None:
        """The for / while / if starting on this line: kind, condition, loop variable, body lines."""
        if line in self._headers:
            return self._headers[line]
        info = None
        clean = self.clean_text(line)
        m = HEADER_RE.match(clean)
        if m:
            open_at = clean.index("(", m.start(1))
            close_at = _match_paren(clean, open_at)
            if close_at > 0:
                inner = self.text(line)[open_at + 1:close_at].strip()
                inner_clean = clean[open_at + 1:close_at]
                info = {"kind": m.group(1), "cond": inner, "var": None, "each": None}
                if info["kind"] == "for":
                    colon = re.search(r"(?<!:):(?!:)", inner_clean)
                    if colon and ";" not in inner_clean:
                        names = IDENT_RE.findall(inner_clean[:colon.start()])
                        info.update(kind="each", var=names[-1] if names else None,
                                    each=self.text(line)[open_at + 1 + colon.end():close_at].strip())
                        info["cond"] = None
                    else:
                        parts = inner.split(";")
                        info["cond"] = parts[1].strip() if len(parts) == 3 and parts[1].strip() else None
                        init = re.match(r"\s*(?:int|long|short|byte|var)\s+([A-Za-z_$][\w$]*)\s*=",
                                        inner_clean)
                        info["var"] = init.group(1) if init else None
                info["body"] = self._body(line, close_at)
        self._headers[line] = info
        return info

    def _body(self, line: int, after: int) -> tuple[int, int]:
        """First and last line of the block or statement after a header's closing paren."""
        rest = self.clean_text(line)[after + 1:]
        if rest.strip().startswith(";"):  # the end of a do { ... } while (...);
            return (0, -1)
        brace = rest.find("{")
        if brace >= 0 and not rest[:brace].strip():
            end = self.close.get((line, after + 1 + brace), line)
            return (line + 1, end) if end > line else (line, line)
        if rest.strip():  # a single statement on the same line
            return (line, line)
        nxt = line + 1
        while nxt <= len(self.clean) and not self.clean[nxt - 1].strip():
            nxt += 1
        text = self.clean_text(nxt)
        if text.strip().startswith("{"):
            end = self.close.get((nxt, text.index("{")), nxt)
            return (nxt, end)
        return (nxt, nxt)

    def enclosing(self, line: int) -> list[tuple[int, dict]]:
        """Loops whose header or body holds this line, outermost first."""
        found = []
        for ln in range(1, line + 1):
            info = self.header(ln)
            if info and info["kind"] in ("for", "each", "while") and (
                    ln == line or info["body"][0] <= line <= info["body"][1]):
                found.append((ln, info))
        return found

    def decl_line(self, method: str, cls: str, first: int) -> int | None:
        """The line declaring a method (or constructor), searching up from its first line."""
        name = cls.rpartition(".")[2].rpartition("$")[2] if method == "<init>" else method
        pattern = re.compile(rf"(?:^|[\s>\]])({re.escape(name)})\s*\(")
        for ln in range(first, max(0, first - 20), -1):
            clean = self.clean_text(ln)
            m = pattern.search(clean)
            if not m:
                continue
            before = clean[:m.start(1)].strip()
            if method == "<init>" or before and not before.endswith(("=", "(", ",", "return", ".")):
                return ln
        return None

    def call_text(self, line: int, method: str, nth: int = 0) -> str | None:
        """The call as written on the line, `find(names, "Grace")`; the nth one when repeated."""
        clean = self.clean_text(line)
        starts = [m.start(1) for m in re.finditer(rf"(?<![\w$.])({re.escape(method)})\s*\(", clean)]
        starts += [m.start(1) for m in re.finditer(rf"\.({re.escape(method)})\s*\(", clean)]
        starts.sort()
        if not starts:
            return None
        start = starts[min(nth, len(starts) - 1)]
        open_at = clean.index("(", start)
        receiver = re.search(r"(?:\bthis\.)?[A-Za-z_$][\w$]*\.\s*$", clean[:start])
        if receiver:  # book.getTitle(): say whose method it is
            start = receiver.start()
        close_at = _match_paren(clean, open_at)
        if close_at < 0:
            return None
        return re.sub(r"\s+", " ", self.text(line)[start:close_at + 1])

    def accesses(self, line: int) -> list[tuple[str, list[str], str]]:
        """Array accesses on a line: (array variable, [index expressions], the text)."""
        found = []
        clean = self.clean_text(line)
        original = self.text(line)
        for m in re.finditer(r"(?<![\w$.])([A-Za-z_$][\w$]*)\s*\[", clean):
            name = m.group(1)
            if name in KEYWORDS:
                continue
            pos, idxs = m.end() - 1, []
            while pos < len(clean) and clean[pos] == "[":
                close_at = _match_paren(clean, pos, "[", "]")
                if close_at < 0:
                    break
                expr = original[pos + 1:close_at].strip()
                if not expr:
                    break
                idxs.append(expr)
                pos = close_at + 1
                while pos < len(clean) and clean[pos] == " ":
                    pos += 1
            if idxs:
                found.append((name, idxs, original[m.start(1):pos].strip()))
        return found


def _eval_index(expr: str, ints: dict[str, int], lengths: dict[str, int]) -> int | None:
    """An index expression of ints, int variables, x.length, + - * / % and brackets; else None."""
    tokens = re.findall(r"\d+|[A-Za-z_$][\w$]*(?:\.length)?|[-+*/%()]|\S", expr)
    pos = 0

    def peek():
        return tokens[pos] if pos < len(tokens) else None

    def take():
        nonlocal pos
        pos += 1
        return tokens[pos - 1]

    def factor():
        tok = take() if peek() is not None else None
        if tok is None:
            raise ValueError
        if tok == "-":
            return -factor()
        if tok == "(":
            value = add()
            if take() != ")":
                raise ValueError
            return value
        if tok.isdigit():
            return int(tok)
        if tok.endswith(".length") and tok[:-7] in lengths:
            return lengths[tok[:-7]]
        if tok in ints:
            return ints[tok]
        raise ValueError

    def mul():
        value = factor()
        while peek() in ("*", "/", "%"):
            op, right = take(), factor()
            if op == "*":
                value *= right
            elif right == 0:
                raise ValueError
            elif op == "/":
                value = abs(value) // abs(right) * (1 if (value >= 0) == (right >= 0) else -1)
            else:
                value = value - right * (abs(value) // abs(right) * (1 if (value >= 0) == (right >= 0) else -1))
        return value

    def add():
        value = mul()
        while peek() in ("+", "-"):
            op, right = take(), mul()
            value = value + right if op == "+" else value - right
        return value

    try:
        value = add()
        return value if pos == len(tokens) else None
    except (ValueError, IndexError):
        return None


# ---- turning the recording into steps ---------------------------------------------------------------

INT_TYPES = {"int", "long", "short", "byte"}
CONTROL_NAMES = {0: "NUL", 9: "\\t", 10: "\\n", 13: "\\r"}


def _code(text: str) -> str:
    """Text for a caption's `code` span (a backtick inside would end it)."""
    return "`" + text.replace("`", "'") + "`"


def _a(word: str) -> str:
    """"a Book", "an Oops"."""
    return ("an " if word[:1].lower() in "aeiou" else "a ") + word


def _clip(text: str, limit: int = 40) -> str:
    return text if len(text) <= limit else text[:limit - 1] + "…"


def _java_string(text: str) -> str:
    out = text.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n").replace("\t", "\\t")
    return '"' + out + '"'


class State:
    """One recorded event: a frame's variables and the arrays and objects they reach."""

    def __init__(self, event: dict):
        self.event = event
        self.line = event.get("line")
        self.method = event.get("method")
        self.cls = event.get("class") or ""
        self.depth = event.get("depth")
        self.vars = event.get("vars") or []
        self.heap = event.get("heap") or {}
        self.var = {v["name"]: v for v in self.vars}
        # who owns each array or object: "numbers", "table[1]", "library[0]", "b.tags"
        self.names: dict[str, str] = {}
        for v in self.vars:
            ref = self.ref_of(v["v"])
            if ref and ref not in self.names:
                self.names[ref] = v["name"]
        for ref, entry in list(self.heap.items()):
            owner = self.names.get(ref)
            if not owner:
                continue
            if entry.get("kind") == "array":
                for i, value in enumerate(entry.get("values") or []):
                    inner = self.ref_of(value)
                    if inner and inner not in self.names:
                        self.names[inner] = f"{owner}[{i}]"
            elif entry.get("kind") == "object":
                for fname, value in entry.get("fields") or []:
                    inner = self.ref_of(value)
                    if inner and inner not in self.names:
                        self.names[inner] = f"{owner}.{fname}"

    @staticmethod
    def ref_of(value) -> str | None:
        return value.get("ref") if isinstance(value, dict) else None

    def array(self, name: str) -> dict | None:
        v = self.var.get(name)
        entry = self.heap.get(self.ref_of(v["v"])) if v else None
        return entry if entry and entry.get("kind") == "array" else None

    def ints(self) -> dict[str, int]:
        found = {}
        for v in self.vars:
            if v.get("type") in INT_TYPES and isinstance(v["v"], str):
                try:
                    found[v["name"]] = int(v["v"])
                except ValueError:
                    pass
            elif v.get("type") == "char" and isinstance(v["v"], str) and len(v["v"]) == 1:
                found[v["name"]] = ord(v["v"])
        return found

    def lengths(self) -> dict[str, int]:
        return {v["name"]: self.array(v["name"])["length"] for v in self.vars if self.array(v["name"])}

    def is_2d(self, ref: str) -> bool:
        entry = self.heap.get(ref) or {}
        return entry.get("kind") == "array" and str(entry.get("elem", "")).endswith("]")

    def say(self, value) -> str:
        """A value in a caption."""
        if value is None:
            return "null"
        if isinstance(value, str):
            return value
        if "s" in value:
            return _java_string(_clip(value["s"]))
        if "ref" in value:
            entry = self.heap.get(value["ref"]) or {}
            if entry.get("kind") == "array" or str(value.get("type", "")).endswith("]"):
                return "an array"
            return _a(entry.get("class") or value.get("type") or "object")
        if "obj" in value:
            return _a(value["obj"])
        return str(value)


class Animator:
    def __init__(self, raw: dict, lines: list[str], *, title: str, max_steps: int, timeout: float):
        self.raw = raw
        self.src = Source(lines)
        self.title = title
        self.max_steps = max_steps
        self.timeout = timeout
        self.steps: list[dict] = []
        self.carry = ""            # output not yet shown on a step
        self.prefix = ""           # "Back in main: ..." for the caller's next step
        self.calls: list[tuple[str, str]] = []  # (call text, caller) per frame entered, innermost last
        self.entered: State | None = None  # a frame just entered on its declaration line
        self.call_count: dict[tuple[int, int, str], int] = {}
        self.each: dict[int, int] = {}  # for-each header line -> index of the current element
        self.returned: tuple[str | None, str] | None = None  # (array or object id, method) last returned
        self.order: dict[str, int] = {}  # id -> first appearance, so boxes keep their places

    # -- the walk --

    def run(self) -> dict:
        events = [State(e) for e in self.raw.get("events") or []]
        lines = [s for s in events if s.event["kind"] == "line"]
        if not lines and not any(s.event["kind"] == "exception" for s in events):
            message = "".join((s.event.get("out") or "") + (s.event.get("err") or "") for s in events)
            message = message.strip() or self.raw.get("fatal") or "The program did not start."
            return {"error": "run", "message": message[:MESSAGE_LIMIT]}
        first = events[0]
        self.carry += self._printed(first)
        if first.event["kind"] != "line":  # it failed before main's first line (a static initializer)
            if first.event["kind"] == "exception":
                self.on_exception(first, first)
            else:
                self.on_end(first, first)
            pending, rest = None, []
        else:
            decl = self.src.decl_line(first.method or "main", first.cls, first.line)
            self.add(first, decl or first.line, "The program starts: Java runs `main`, line by line.",
                     empty=True, before=None)
            pending, rest = first, events[1:]
        for state in rest:
            kind = state.event["kind"]
            self.carry += self._printed(state)
            if pending is None:
                break
            if kind == "line":
                if state.depth > pending.depth:
                    self.on_call(pending, state)
                elif state.depth < pending.depth and pending.event["kind"] != "exit":
                    self.on_return(pending, state)  # back without an exit event
                elif state.depth == pending.depth:
                    self.on_line(pending, state)
                # (after an exit, the caller's line is part way through: its step comes next)
                pending = state
            elif kind == "exit":
                self.on_exit(pending, state)
                pending = state
            elif kind == "exception":
                self.on_exception(pending, state)
                pending = None
            elif kind == "end":
                self.on_end(pending, state)
                pending = None
        if pending is not None:  # stopped at the step limit
            self.on_end(pending, None)
        if len(self.steps) > self.max_steps:  # calls add steps of their own: cut, keeping the picture
            self.steps = self.steps[:self.max_steps - 1]
            last = dict(self.steps[-1], caption=self.stop_caption("steps"))
            for key in ("print", "error"):
                last.pop(key, None)
            self.steps.append(last)
        return {"id": "trace", "title": "Your code, step by step",
                "segments": [{"example": None, "extra": False, "title": self.title,
                              "code": self.src.lines, "steps": self.steps}]}

    @staticmethod
    def _printed(state: State) -> str:
        return (state.event.get("out") or "") + (state.event.get("err") or "")

    # -- transitions --

    def on_line(self, before: State, after: State) -> None:
        """before's line ran, in the same frame."""
        entered, self.entered = self.entered, None
        caption = self.describe(before, after, self.carry)
        if entered is before and caption == "Nothing changed in memory." and not self.prefix:
            return  # a constructor's hidden super() call, on the line its start was already shown
        caption = self.take_prefix() + caption
        self.add(self.keep_loop_var(before, after), before.line, caption, before=before)

    def keep_loop_var(self, before: State, after: State) -> State:
        """After the last line of a for-each body Java is back at the loop's header, where the loop
        variable is already out of scope; the step for that line still shows it."""
        info = self.src.header(after.line)
        if not info or info["kind"] != "each" or after.depth != before.depth:
            return after
        var, (first, last) = info.get("var"), info["body"]
        if not var or var in after.var or var not in before.var or not first <= before.line <= last:
            return after
        event = dict(after.event)
        names = [v["name"] for v in before.vars]
        kept = [v for v in after.vars]
        kept.insert(min(names.index(var), len(kept)), before.var[var])
        heap = dict(after.heap)
        ref = State.ref_of(before.var[var]["v"])
        if ref and ref not in heap and ref in before.heap:
            heap[ref] = before.heap[ref]
        event["vars"], event["heap"] = kept, heap
        return State(event)

    def on_call(self, caller: State, callee: State) -> None:
        key = (caller.depth, caller.line, callee.method)
        nth = self.call_count.get(key, 0)
        self.call_count[key] = nth + 1
        name = self.method_name(callee)
        text = self.src.call_text(caller.line, callee.method, nth) if callee.method != "<init>" else None
        if callee.method == "<init>":
            text = "new " + name + "(...)"
        self.calls.append((text or name + "(...)", caller.method or "main"))
        lead = self.take_prefix()
        what = (f"`{caller.method}` calls {_code(text)}" if text and callee.method != "<init>"
                else f"`{caller.method}` makes a new {name}" if callee.method == "<init>"
                else f"`{caller.method}` calls `{name}`")
        self.add(caller, caller.line, lead + what + " and waits for it to finish.", before=None)
        decl = self.src.decl_line(callee.method, callee.cls, callee.line)
        params = []
        for v in callee.vars:
            if v["name"] == "this":
                continue
            value = v["v"]
            if State.ref_of(value):
                kind = "array" if str(value.get("type", "")).endswith("]") else value.get("type") or "object"
                params.append(f"{_code(v['name'])} points to the {kind} passed in")
            else:
                params.append(f"{_code(v['name'])} is {callee.say(value)}")
        starts = f"{_code(name)} starts" if callee.method != "<init>" else f"The {name} constructor starts"
        caption = starts + (": " + ", ".join(params[:4]) + "." if params else ".")
        self.add(callee, decl or callee.line, caption, before=None)
        self.entered = callee if decl == callee.line else None

    def on_exit(self, before: State, exit_state: State) -> None:
        """before's line (a return, or the closing brace) ran and the method is leaving."""
        name = self.method_name(exit_state)
        ev = exit_state.event
        if exit_state.method == "<init>":
            done = f"The new {name} is ready."
        elif ev.get("void"):
            done = f"{_code(name)} is finished."
        else:
            done = f"{_code(name)} returns {exit_state.say(ev.get('ret'))}" + self._ret_detail(exit_state) + "."
        changes = ""
        if before.event["kind"] == "line":
            changes = self.describe(before, exit_state, self.carry, flow=False)
            if changes.startswith("Nothing changed"):
                changes = ""
        caption = self.take_prefix() + ((changes + " " + done).strip() if changes else done)
        self.add(exit_state, before.line, caption, before=before)
        call, caller = self.calls.pop() if self.calls else (name + "(...)", "main")
        self.returned = (State.ref_of(ev.get("ret")), name)
        if exit_state.method == "<init>":
            self.prefix = f"Back in {_code(caller)} with the new {name}. "
        elif ev.get("void"):
            self.prefix = f"Back in {_code(caller)} after {_code(call)}. "
        else:
            self.prefix = f"Back in {_code(caller)}: {_code(call)} returned {exit_state.say(ev.get('ret'))}. "

    def _ret_detail(self, state: State) -> str:
        ref = State.ref_of(state.event.get("ret"))
        entry = state.heap.get(ref) if ref else None
        if entry and entry.get("kind") == "array" and not str(entry.get("elem", "")).endswith("]"):
            shown = [state.say(v) for v in (entry.get("values") or [])[:8]]
            more = ", …" if entry.get("length", 0) > 8 else ""
            return " {" + ", ".join(shown) + more + "}"
        return ""

    def on_return(self, before: State, after: State) -> None:
        call, caller = self.calls.pop() if self.calls else ("the method", after.method or "main")
        self.add(after, after.line, self.take_prefix() + f"Back in {_code(caller)} from {_code(call)}.",
                 before=None)

    def on_exception(self, before: State, exc: State) -> None:
        ev = exc.event
        simple = (ev.get("exception") or "Exception").rpartition(".")[2].rpartition("$")[2]
        message = ev.get("message")
        error = f"{simple}: {message}" if message else simple
        state = exc if exc.line else before
        line = exc.line or before.line
        caption = self.take_prefix() + self.explain(simple, message, state, line)
        step = self.add(state, line, caption, before=before, error=error)
        self._mark_out_of_bounds(step, state, line, message)

    def on_end(self, before: State, end: State | None) -> None:
        stopped = self.raw.get("stopped") or ("fatal" if self.raw.get("fatal") else None)
        if stopped in ("steps", "time", "output", "fatal"):
            state = end if end is not None and end.line else before
            self.add(state, state.line or before.line, self.stop_caption(stopped), before=before)
            return
        text = self.src.clean_text(before.line)
        if before.event["kind"] == "exit":
            caption = "The program has finished."
        elif re.search(r"\bexit\s*\(", text):
            caption = "`System.exit` ends the program here."
        elif text.strip().startswith("}"):
            caption = f"The end of {_code(before.method or 'main')}: the program has finished."
        elif re.search(r"\breturn\b", text):
            caption = f"`return` leaves {_code(before.method or 'main')}: the program has finished."
        else:
            caption = "The program has finished."
        if self.carry:
            caption = self.printed(self.carry) + " " + caption
        self.add(before, before.line, self.take_prefix() + caption, before=None)

    def stop_caption(self, why: str) -> str:
        if why == "fatal":
            return "The tracer could not follow the program any further, so it stopped here."
        if why == "time":
            return f"Stopped after {self.timeout:g} seconds: a loop that never ends?"
        if why == "output":
            return "Stopped: the program printed more than 64 KB. A loop that never ends?"
        return f"Stopped after {self.max_steps} steps: a loop that never ends?"

    def take_prefix(self) -> str:
        prefix, self.prefix = self.prefix, ""
        return prefix

    def method_name(self, state: State) -> str:
        if state.method == "<init>":
            return state.cls.rpartition(".")[2].rpartition("$")[2]
        if (state.method or "").startswith("lambda$"):
            return "a lambda"
        return state.method or "?"

    # -- one step's picture --

    def add(self, state: State, line: int | None, caption: str, *, before: State | None,
            empty: bool = False, error: str | None = None) -> dict:
        step: dict = {}
        if line:
            step["line"] = line
        step["caption"] = caption
        if self.carry and not empty:
            step["print"] = self.carry
            self.carry = ""
        if error:
            step["error"] = error
        vars_, arrays, objects = self.picture(state) if not empty else ([], [], [])
        for item in arrays + objects:
            self.order.setdefault(item["id"], len(self.order))
        arrays.sort(key=lambda item: self.order[item["id"]])
        objects.sort(key=lambda item: self.order[item["id"]])
        step["vars"] = vars_
        step["arrays"] = arrays
        if objects:
            step["objects"] = objects
        if before is not None and line and not empty:
            self.highlight(step, before, state, line)
        self.steps.append(step)
        return step

    def picture(self, state: State) -> tuple[list, list, list]:
        heap = state.heap
        rows_of = {}  # inner array id -> (outer id, row) for arrays shown as a 2D grid's rows
        for ref, entry in heap.items():
            if entry.get("kind") == "array" and state.is_2d(ref):
                for r, value in enumerate(entry.get("values") or []):
                    inner = State.ref_of(value)
                    if inner:
                        rows_of.setdefault(inner, (ref, r))
        direct = {State.ref_of(v["v"]) for v in state.vars} - {None}
        for entry in heap.values():  # arrays held by objects' fields are shown on their own
            if entry.get("kind") == "object":
                direct |= {State.ref_of(value) for _, value in entry.get("fields") or []} - {None}
        shown = {ref for ref, e in heap.items() if e.get("kind") in ("array", "object")
                 and (ref not in rows_of or ref in direct)}

        def cell(value, elem=None):
            if value is None:
                return "null"
            if isinstance(value, str):
                if elem == "char" and len(value) == 1 and (ord(value) < 32 or ord(value) == 127):
                    return {"text": CONTROL_NAMES.get(ord(value), f"\\u{ord(value):04x}"),
                            "faint": True, "num": str(ord(value))}
                return value
            if "s" in value:
                return _java_string(_clip(value["s"], 30))
            ref = value.get("ref")
            if ref:
                if ref in shown:
                    return {"ref": ref}
                if ref in rows_of:  # a row of a 2D array, not drawn on its own
                    return "{…}"
                return value.get("type") or "object"
            if "obj" in value:
                return value["obj"]
            return str(value)

        vars_ = []
        for v in state.vars:
            ref = State.ref_of(v["v"])
            if ref and ref in shown:
                vars_.append({"name": v["name"], "ref": ref})
            else:
                vars_.append({"name": v["name"], "value": cell(v["v"], v.get("type"))})
        arrays, objects = [], []
        for ref, entry in heap.items():
            if ref not in shown:
                continue
            if entry["kind"] == "array":
                item = {"id": ref, "elementType": entry.get("elem"), "length": entry.get("length", 0)}
                if state.is_2d(ref):
                    rows = []
                    for value in entry.get("values") or []:
                        inner = heap.get(State.ref_of(value) or "") or {}
                        if value is None:
                            rows.append([])
                        else:
                            elem = str(entry.get("elem", ""))[:-2]
                            rows.append([cell(x, elem) for x in inner.get("values") or []])
                    item["rows"] = rows
                else:
                    item["values"] = [cell(x, entry.get("elem")) for x in entry.get("values") or []]
                if entry.get("length", 0) > len(entry.get("values") or []):
                    item["note"] = f"showing {len(entry.get('values') or [])} of {entry['length']}"
                if ref in rows_of:
                    outer, r = rows_of[ref]
                    owner = state.names.get(outer)
                    item["note"] = f"row {r} of {owner}" if owner else f"row {r}"
                arrays.append(item)
            elif entry["kind"] == "object":
                fields = [[name, cell(value)] for name, value in entry.get("fields") or []]
                objects.append({"id": ref, "class": entry.get("class", "Object"), "fields": fields})
        return vars_, arrays, objects

    def highlight(self, step: dict, before: State, after: State, line: int) -> None:
        """Rings on the boxes the line read or wrote, and index variables under their boxes."""
        by_id = {a["id"]: a for a in step["arrays"]}
        ints, lengths = before.ints(), before.lengths()

        def entry_for(name: str):
            v = after.var.get(name) or before.var.get(name)
            ref = State.ref_of(v["v"]) if v else None
            return by_id.get(ref) if ref else None

        for name, idxs, _ in self.src.accesses(line):
            item = entry_for(name)
            if not item:
                continue
            values = [_eval_index(e, ints, lengths) for e in idxs]
            if "rows" in item:
                rows = item["rows"]
                if len(values) >= 2 and None not in values[:2]:
                    r, c = values[:2]
                    if 0 <= r < len(rows) and 0 <= c < len(rows[r]):
                        item.setdefault("highlight", []).append([r, c])
                elif values and values[0] is not None and 0 <= values[0] < len(rows):
                    r = values[0]
                    item.setdefault("highlight", []).extend([r, c] for c in range(len(rows[r])))
                continue
            if values[0] is None or len(values) > 1:
                continue
            index = values[0]
            if 0 <= index < len(item.get("values", [])):
                if index not in item.get("highlight", []):
                    item.setdefault("highlight", []).append(index)
                if IDENT_RE.fullmatch(idxs[0]) and idxs[0] in ints:
                    item.setdefault("marks", {})[str(index)] = idxs[0]
        # index variables of the loops round this line, under the arrays they index
        after_ints = after.ints()
        for header, info in self.src.enclosing(line):
            if info["kind"] == "each":
                self._mark_each(step, header, info, after, by_id)
                continue
            var = info.get("var")
            if not var or var not in after_ints:
                continue
            first, last = info["body"]
            for ln in range(header, max(header, last) + 1):
                for name, idxs, _ in self.src.accesses(ln):
                    item = entry_for(name)
                    if item and "values" in item and len(idxs) == 1 and idxs[0] == var:
                        index = after_ints[var]
                        if 0 <= index < len(item["values"]):
                            item.setdefault("marks", {}).setdefault(str(index), var)

    def _mark_each(self, step: dict, header: int, info: dict, after: State, by_id: dict) -> None:
        """for (int x : arr): which element x is, counted as the loop goes round."""
        index = self.each.get(header)
        source = (info.get("each") or "").strip()
        if index is None or not IDENT_RE.fullmatch(source):
            return
        v = after.var.get(source)
        item = by_id.get(State.ref_of(v["v"])) if v else None
        if item and "values" in item and 0 <= index < len(item["values"]):
            item.setdefault("marks", {}).setdefault(str(index), info["var"])
            if step.get("line") == header:
                item.setdefault("highlight", []).append(index)
                for ref, entry in after.heap.items():  # the same box in a 2D grid that holds this row
                    grid = by_id.get(ref)
                    if grid and "rows" in grid:
                        rows = [State.ref_of(x) for x in entry.get("values") or []]
                        if item["id"] in rows and index < len(grid["rows"][rows.index(item["id"])]):
                            grid.setdefault("highlight", []).append([rows.index(item["id"]), index])
        elif item and "rows" in item and 0 <= index < len(item["rows"]) and step.get("line") == header:
            item.setdefault("highlight", []).extend([index, c] for c in range(len(item["rows"][index])))

    def _mark_out_of_bounds(self, step: dict, state: State, line: int, message: str | None) -> None:
        m = re.search(r"Index (-?\d+) out of bounds for length (\d+)", message or "")
        if not m:
            return
        index, length = int(m.group(1)), int(m.group(2))
        ints, lengths = state.ints(), state.lengths()
        by_id = {a["id"]: a for a in step["arrays"]}
        for name, idxs, _ in self.src.accesses(line):
            v = state.var.get(name)
            item = by_id.get(State.ref_of(v["v"])) if v else None
            if not item or "values" not in item or item.get("length") != length:
                continue
            if _eval_index(idxs[0], ints, lengths) != index:
                continue
            item.pop("highlight", None)
            item.pop("marks", None)
            if index == length:  # the box one past the end, which does not exist
                item["ghost"] = index
                item["highlight"] = [index]
                if IDENT_RE.fullmatch(idxs[0]):
                    item["marks"] = {str(index): idxs[0]}
            else:
                item["note"] = f"there is no box {index}"
            return

    # -- captions --

    def describe(self, before: State, after: State, printed: str = "", flow: bool = True) -> str:
        line = before.line
        parts: list[str] = []
        covered: set[str] = set()
        info = self.src.header(line) if flow else None
        if info:
            sentence = self.flow(info, line, before, after)
            if sentence:
                parts.append(sentence)
                if info.get("var"):
                    covered.add(info["var"])
        parts += self.element_changes(before, after, line)
        for v in after.vars:
            name = v["name"]
            if name in covered or name == "this":
                continue
            old = before.var.get(name)
            if old is None:
                parts.append(self.new_var(name, v, before, after))
            elif old["v"] != v["v"]:
                parts.append(self.changed_var(name, old, v, before, after))
        if printed:
            parts.append(self.printed(printed))
        if not parts:
            return "Nothing changed in memory."
        return " ".join(parts[:3])

    def flow(self, info: dict, line: int, before: State, after: State) -> str | None:
        first, last = info["body"]
        inside = after.line is not None and first <= after.line <= last and after.depth == before.depth
        if after.depth != before.depth or after.event["kind"] != "line":
            return None
        cond = info.get("cond")
        if info["kind"] == "each":
            var, source = info.get("var"), info.get("each") or "the array"
            if inside and var in after.var:
                came_back = self.came_from_body(line, info)
                index = self.each[line] = self.each.get(line, -1) + 1 if came_back else 0
                ref = State.ref_of(after.var[var]["v"])
                if ref:  # rows of a 2D array, or objects in an array
                    entry = after.heap.get(ref) or {}
                    held = (f"row {index} of {_code(source)}" if entry.get("kind") == "array"
                            else f"the {entry.get('class', 'object')} in {_code(f'{source}[{index}]')}")
                    if came_back:
                        return f"{_code(var)} now points to {held}."
                    return f"The loop starts: {_code(var)} points to {held}."
                value = after.say(after.var[var]["v"])
                if came_back:
                    return f"{_code(var)} is now {value}, the next element of {_code(source)}."
                return f"The loop starts: {_code(var)} is {value}, the first element of {_code(source)}."
            if not inside:
                self.each.pop(line, None)
                return f"No elements left in {_code(source)}, so the loop ends."
            return None
        if info["kind"] == "for":
            var = info.get("var")
            if inside:
                if var and var in after.var and var not in before.var:
                    return f"The loop starts with {_code(var)} = {after.say(after.var[var]['v'])}."
                if var and var in after.var:
                    return f"{_code(var)} is now {after.say(after.var[var]['v'])}."
                return f"{_code(cond)} is true, so the loop goes round." if cond else None
            if cond:
                return f"{_code(cond)} is now false, so the loop ends."
            return "The loop ends."
        if info["kind"] == "while":
            if info["body"] == (0, -1):  # do { ... } while (cond);
                if after.line is not None and after.line < line:
                    return f"{_code(cond)} is true, so the loop goes round again."
                return f"{_code(cond)} is false now, so the loop ends."
            if inside:
                return f"{_code(cond)} is true, so the loop body runs."
            return f"{_code(cond)} is false now, so the loop ends."
        if info["kind"] == "if":
            if inside:
                return f"{_code(cond)} is true."
            return f"{_code(cond)} is false, so that part is skipped."
        return None

    def came_from_body(self, header: int, info: dict) -> bool:
        """Was the step before this one inside the loop's body (going round again)?"""
        for step in reversed(self.steps):
            if "line" not in step:
                continue
            first, last = info["body"]
            return first <= step["line"] <= last and step["line"] != header
        return False

    def element_changes(self, before: State, after: State, line: int | None = None) -> list[str]:
        parts = []
        on_line = {name for name, _, _ in self.src.accesses(line)} if line else set()
        for ref, entry in after.heap.items():
            old = before.heap.get(ref)
            if not old or old.get("kind") != entry.get("kind"):
                continue
            name = after.names.get(ref) or before.names.get(ref)
            holders = [v["name"] for v in after.vars if State.ref_of(v["v"]) == ref]
            used = [h for h in holders if h in on_line]
            if used:  # the name the line wrote through: b[1] = 9, not a[1]
                name = used[0]
            others = [h for h in holders if h != name]
            if entry["kind"] == "array" and not after.is_2d(ref):
                new_values, old_values = entry.get("values") or [], old.get("values") or []
                changed = [i for i in range(min(len(new_values), len(old_values)))
                           if new_values[i] != old_values[i]]
                if not changed:
                    continue
                label = name or "an array"
                if len(changed) == 1:
                    i = changed[0]
                    also = (f" (and {_code(f'{others[0]}[{i}]')} too: both point to the same array)"
                            if others else "")
                    parts.append(f"{_code(f'{label}[{i}]')} changed from {before.say(old_values[i])} "
                                 f"to {after.say(new_values[i])}{also}.")
                else:
                    shown = ", ".join(after.say(v) for v in new_values[:8])
                    more = ", …" if len(new_values) > 8 else ""
                    parts.append(f"{len(changed)} elements of {_code(label)} changed: now {{{shown}{more}}}.")
            elif entry["kind"] == "object":
                old_fields = dict((n, v) for n, v in old.get("fields") or [])
                for fname, value in entry.get("fields") or []:
                    if fname in old_fields and old_fields[fname] != value:
                        label = f"{name}.{fname}" if name else fname
                        parts.append(f"{_code(label)} changed from {before.say(old_fields[fname])} "
                                     f"to {after.say(value)}.")
        return parts

    def new_var(self, name: str, v: dict, before: State, after: State) -> str:
        value = v["v"]
        ref = State.ref_of(value)
        if not ref:
            if value is None:
                return f"{_code(name)} is null."
            return f"{_code(name)} is {after.say(value)}."
        return f"{_code(name)} points to {self.target(name, ref, before, after)}."

    def changed_var(self, name: str, old: dict, v: dict, before: State, after: State) -> str:
        value = v["v"]
        ref = State.ref_of(value)
        if not ref:
            if value is None:
                return f"{_code(name)} is now null."
            return f"{_code(name)} is now {after.say(value)}."
        return f"{_code(name)} now points to {self.target(name, ref, before, after)}."

    def target(self, name: str, ref: str, before: State, after: State) -> str:
        """What a reference variable points at, in words: new, shared, or an element."""
        entry = after.heap.get(ref) or {}
        others = [v["name"] for v in after.vars if v["name"] != name and State.ref_of(v["v"]) == ref]
        is_array = entry.get("kind") == "array"
        what = "array" if is_array else entry.get("class", "object")
        if others:
            return f"the same {what} as {_code(others[0])}"
        if self.returned and self.returned[0] == ref:
            return f"the {what} that {_code(self.returned[1])} returned"
        owner = after.names.get(ref)
        if owner and owner != name:
            if is_array and re.fullmatch(r".+\[\d+\]", owner):
                outer, row = owner.rsplit("[", 1)
                return f"row {row[:-1]} of {_code(outer)}"
            return f"the {what} in {_code(owner)}"
        known = ref in before.heap or ref in before.names
        if is_array:
            length = entry.get("length", 0)
            if after.is_2d(ref):
                return f"{'a new' if not known else 'a'} 2D array with {length} row{'s' if length != 1 else ''}"
            return (f"{'a new' if not known else 'an'} array with {length} "
                    f"element{'s' if length != 1 else ''}")
        return f"a new {what}" if not known else _a(what)

    @staticmethod
    def printed(text: str) -> str:
        if text == "\n":
            return "Printed a line break."
        lines = [ln for ln in text.split("\n") if ln.strip()]
        if len(lines) > 1:
            return f"Printed {len(lines)} lines."
        shown = text.strip("\n").rstrip()
        if not shown.strip():
            return "Printed spaces."
        return f"Printed: {_clip(shown, 60)}"

    def explain(self, simple: str, message: str | None, state: State, line: int) -> str:
        message = message or ""
        if simple == "ArrayIndexOutOfBoundsException":
            m = re.search(r"Index (-?\d+) out of bounds for length (\d+)", message)
            if m:
                index, length = int(m.group(1)), int(m.group(2))
                if index < 0:
                    return (f"Index {index} does not exist: indexes start at 0. "
                            "Java stops the program here.")
                if length == 0:
                    return "This array has length 0, so it has no boxes at all. Java stops the program here."
                return (f"Index {index} does not exist: an array of length {length} has indexes 0 to "
                        f"{length - 1}. Java stops the program here.")
        if simple == "NullPointerException":
            m = re.search(r'because "([^"<>]+)" is null', message)
            if m:
                return (f"{_code(m.group(1))} is null: it does not point to an array or object yet. "
                        "Java stops the program here.")
            return "Something here is null: it does not point to an array or object yet. Java stops the program here."
        if simple == "ArithmeticException" and "zero" in message:
            return "Dividing a whole number by zero is not allowed. Java stops the program here."
        if simple == "NegativeArraySizeException":
            return f"An array cannot have a negative length ({message}). Java stops the program here."
        if simple in ("NoSuchElementException", "InputMismatchException"):
            return ("The program tried to read input, but nothing can be typed in while it is traced. "
                    "Java stops the program here.")
        if simple == "NumberFormatException":
            return f"That text is not a number ({message}). Java stops the program here."
        if simple == "StringIndexOutOfBoundsException":
            return f"That position is outside the String ({message}). Java stops the program here."
        return f"Java stops the program here with {_a(simple)}" + (f": {message}." if message else ".")


def animate(raw: dict, lines: list[str], *, title: str = "Main.java", max_steps: int = 400,
            timeout: float = 12.0) -> dict:
    """The stepper's animation JSON from Tracer.java's raw recording."""
    if raw.get("fatal") and not raw.get("events"):
        return {"error": "tracer", "message": raw["fatal"]}
    return Animator(raw, lines, title=title, max_steps=max_steps, timeout=timeout).run()


# ---- command line --------------------------------------------------------------------------------------

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Trace a lab's Java program for the guide's stepper.")
    parser.add_argument("--lab-dir", type=Path, help="folder holding Main.java and the lab's other files")
    parser.add_argument("--main", default="week05.arrays_lab.Main", help="the main class")
    parser.add_argument("--max-steps", type=int, default=400)
    parser.add_argument("--timeout", type=float, default=12.0)
    parser.add_argument("--cwd", type=Path, help="the folder the program runs in")
    parser.add_argument("--build", nargs="?", const="", metavar="OUTDIR",
                        help="compile Tracer.java into OUTDIR (default tracer/classes) and stop")
    args = parser.parse_args(argv)
    if args.build is not None:
        print(build(args.build or None))
        return 0
    if not args.lab_dir:
        parser.error("--lab-dir is needed")
    result = trace(args.lab_dir, args.main, max_steps=args.max_steps, timeout=args.timeout, cwd=args.cwd)
    json.dump(result, sys.stdout, ensure_ascii=False, indent=1)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
