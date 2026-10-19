"""Compile and run a student's lab code and compare what it prints with a DIY's expected output.

Standard library only: it runs in the student's Codespace, beside the guide server.

The comparison normalises text exactly as the solutions repo's check_solutions.py
does (the whole text trimmed, trailing spaces stripped from every line), so a
student is held to the same expected output the model solutions are verified
against. One difference on purpose: a check passes when the expected lines appear
together and in order ANYWHERE in the output, so code from earlier DIYs that is
still running does not fail a later check.
"""
import os
import re
import signal
import subprocess
import tempfile
import threading
import time
from pathlib import Path

# Small, fast JVMs: these programs print a few lines.
JAVA_FLAGS = ["-Xmx256m", "-XX:+UseSerialGC", "-XX:TieredStopAtLevel=1",
              "-Dstdout.encoding=UTF-8", "-Dstderr.encoding=UTF-8"]
# Students' code is compiled as Java 21 (the module's Codespace and CI version),
# whatever JDK runs the checker: --release fixes both the language and the library.
JAVA_RELEASE = os.environ.get("LAB_JAVA_RELEASE", "21")
JAVAC_FLAGS = ["-J-XX:+UseSerialGC", "-J-XX:TieredStopAtLevel=1", "-encoding", "UTF-8",
               "--release", JAVA_RELEASE]
MESSAGE_LIMIT = 4000


def normalise(text: str) -> str:
    """Compare on content, not incidental whitespace (as check_solutions.py)."""
    return "\n".join(line.rstrip() for line in text.strip().split("\n")).strip()


def compare(expected: str, actual: str) -> dict:
    exp = normalise(expected).split("\n") if normalise(expected) else []
    act = normalise(actual).split("\n") if normalise(actual) else []
    n = len(exp)
    passed = n == 0 or any(act[i:i + n] == exp for i in range(len(act) - n + 1))
    first_diff = None
    if not passed:
        start = act.index(exp[0]) if exp[0] in act else 0
        for j, line in enumerate(exp):
            if start + j >= len(act) or act[start + j] != line:
                first_diff = j + 1
                break
    return {"passed": passed, "firstDiff": first_diff, "expected": exp, "actual": act}


def friendly_note(text: str) -> str | None:
    """A plain-words note for the errors first-year students meet most in this lab."""
    if m := re.search(r"ArrayIndexOutOfBoundsException: Index (-?\d+) out of bounds for length (\d+)",
                      text):
        index, length = int(m.group(1)), int(m.group(2))
        if index < 0:
            return f"Index {index} doesn't exist: indexes start at 0, so the first element is [0]."
        if length == 0:
            return "This array has length 0, so it has no elements to read or change."
        return (f"Index {index} doesn't exist: an array of length {length} has indexes 0 to "
                f"{length - 1}. Check that the loop condition uses < length, not <= length.")
    if m := re.search(r"Could not find or load main class ([\w.]+)", text):
        package = m.group(1).rpartition(".")[0]
        return (f"Java couldn't find Main in the package {package}. Check that the first line of "
                f"Main.java is exactly: package {package};")
    if "NullPointerException" in text:
        return ("Something was null. An array of objects starts with null in every slot "
                "until you put an object there.")
    if re.search(r"cannot find symbol[\s\S]*?symbol:\s+(?:variable|class) Arrays\b", text):
        return "Add import java.util.Arrays; at the top of the file, under the package line."
    if "cannot find symbol" in text:
        return ("Java doesn't recognise that name: check the spelling and capitals, and that "
                "it's declared before you use it.")
    if "';' expected" in text:
        return "A statement is missing its semicolon on the line shown."
    if m := re.search(r"class (\w+) is public, should be declared in a file named \w+\.java", text):
        name = m.group(1)
        return f"Put class {name} in its own file, {name}.java, beside Main.java."
    if m := re.search(r"possible lossy conversion from (\w+) to (\w+)", text):
        return (f"A {m.group(1)} value is going into a {m.group(2)} and could lose part of it "
                "(a double loses its decimals in an int): change the variable's type or cast it.")
    if "missing return statement" in text:
        return "Every way through the method has to end in a return with a value."
    return None


def _drain(stream, buf: bytearray, cap: int, overflow: threading.Event | None) -> None:
    """Keep reading so the program never blocks on a full pipe; keep only `cap` bytes.
    Only stdout can flag runaway printing (a long crash trace on stderr is not that)."""
    while chunk := stream.read1(65536):
        room = cap - len(buf)
        if room > 0:
            buf += chunk[:room]
        if overflow is not None and len(chunk) > room:
            overflow.set()


def _run(cmd: list[str], timeout: float, cap: int,
         cwd: Path | None = None) -> tuple[int | None, str, str, str]:
    """Run cmd with no input. Returns (exit code or None, stdout, stderr, why it was stopped)."""
    proc = subprocess.Popen(cmd, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE, start_new_session=True, cwd=cwd)
    out, err, overflow = bytearray(), bytearray(), threading.Event()
    readers = [threading.Thread(target=_drain, args=(proc.stdout, out, cap, overflow), daemon=True),
               threading.Thread(target=_drain, args=(proc.stderr, err, cap, None), daemon=True)]
    for reader in readers:
        reader.start()
    deadline, stopped = time.monotonic() + timeout, ""
    while proc.poll() is None:
        if overflow.is_set():
            stopped = "output"
        elif time.monotonic() > deadline:
            stopped = "time"
        if stopped:
            try:
                os.killpg(proc.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            break
        time.sleep(0.02)
    proc.wait()
    try:                    # anything the program started dies with it, however it ended
        os.killpg(proc.pid, signal.SIGKILL)
    except (ProcessLookupError, PermissionError):
        pass
    for reader in readers:
        reader.join(timeout=2)
    if not stopped and overflow.is_set():   # it printed too much and finished before the loop saw
        stopped = "output"
    decode = lambda b: bytes(b).decode("utf-8", errors="replace")  # noqa: E731
    return (None if stopped else proc.returncode), decode(out), decode(err), stopped


def _shorten(text: str, lab_dir: Path) -> str:
    text = text.replace(str(lab_dir) + os.sep, "")
    return text if len(text) <= MESSAGE_LIMIT else text[:MESSAGE_LIMIT] + "\n…"


def _crash_message(stderr: str, sources: list[Path]) -> str:
    lines = stderr.strip().splitlines()
    head = next((l for l in lines if l.startswith("Exception in thread")), lines[0] if lines else "")
    head = re.sub(r'^Exception in thread "[^"]*"\s*', "", head)
    names = {p.name for p in sources}
    frames = [l.strip() for l in lines
              if (m := re.search(r"\((\w+\.java):\d+\)", l)) and m.group(1) in names][:3]
    return "\n".join([head] + [f"    {frame}" for frame in frames])


def _result(status, expected, actual="", first_diff=None, message="", note=None) -> dict:
    return {"status": status, "expected": normalise(expected), "actual": actual,
            "firstDiff": first_diff, "message": message, "note": note}


def run_check(lab_dir: Path, main_class: str, expected: str, compile_timeout: float = 30,
              run_timeout: float = 10, cap: int = 65536, display_folder: str | None = None,
              cwd: Path | None = None) -> dict:
    """cwd: where the program runs; the server passes the repo folder, the same working
    folder as ▶ in VS Code, so relative file paths behave the same."""
    lab_dir = Path(lab_dir)
    where = display_folder or lab_dir.name
    sources = sorted(lab_dir.glob("*.java")) if lab_dir.is_dir() else []
    if not sources:
        return _result("no_code", expected,
                       message=f"There's no Java file in {where} yet: Main.java should be there.")

    with tempfile.TemporaryDirectory(prefix="lab-check-") as classes:
        code, out, err, stopped = _run(["javac", *JAVAC_FLAGS, "-d", classes, *map(str, sources)],
                                       compile_timeout, cap)
        if stopped or code != 0:
            message = _shorten((err + out).strip() or "javac stopped without a message.", lab_dir)
            if stopped:
                message = "Compiling took too long and was stopped. Try again."
            return _result("compile_error", expected, message=message, note=friendly_note(message))

        code, out, err, stopped = _run(["java", *JAVA_FLAGS, "-cp", classes, main_class],
                                       run_timeout, cap, cwd=cwd if cwd and cwd.is_dir() else None)

    actual = normalise(out)
    if stopped == "time":
        return _result("timeout", expected, actual, message=(
            f"Your program was still running after {run_timeout:g} seconds, so it was stopped. "
            "That usually means a loop whose condition never becomes false."))
    if stopped == "output":
        return _result("timeout", expected, actual, message=(
            "Your program kept printing far more than this exercise needs, so it was stopped. "
            "That usually means a loop whose condition never becomes false."))
    if code != 0:
        message = _shorten(_crash_message(err, sources) or f"Your program ended with exit code {code}.",
                           lab_dir)
        return _result("runtime_error", expected, actual, message=message,
                       note=friendly_note(err))

    result = compare(expected, out)
    if result["passed"]:
        return _result("pass", expected, actual, message="Your output matches the expected output.")
    return _result("fail", expected, actual, result["firstDiff"], message=(
        f"Not yet: line {result['firstDiff']} of the expected output is the first difference."))
