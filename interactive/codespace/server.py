#!/usr/bin/env python3
"""The lab guide in a student's Codespace: the module's published lab pages, with a
"Check my output" button under every exercise and "Watch my code run", both working on
the student's own code in this Codespace.

Standard library only: the Codespace image has Python 3 but no pip. start.sh runs it
when the Codespace starts, and VS Code opens the port beside the code.

    GET  /                       302 to this week's lab (module/schedule.json), else /labs/
    GET  /api/health             {"ok": true}
    GET  /api/trace/status       {"enabled": bool}: can "Watch my code run" work here?
    POST /api/check/<lab>/<k>    compile and run the student's lab folder, compare with DIY k
    POST /api/trace/<lab>        run the student's Main under the Java debugger, as animation data
    GET  /codespace/<file>       guide.js and guide.css, from this folder
    GET  anything else           that file of the published site, fetched once per run and
                                 cached in ~/.cache/lab-guide so the guide still opens offline;
                                 a lab page gets the two files above added to it

The site's address is read from the schedule's lab links, so nothing here names it. The
pages come from the site, which shows the README the nightly sync keeps this copy at; a
check compares with the expected output in this copy's own README, read at that moment.

Every request must name this server's own host (localhost on any port, or this Codespace's
forwarded address), which shuts out DNS rebinding. A check or a trace must also carry
`X-Lab-Check: 1` and come from this page's own origin, so another website cannot make it
run anything. They run one at a time, with time and output limits.

Usage: python3 server.py --repo /workspaces/<repo> [--port 8081]
"""
import argparse
import datetime
import html
import json
import os
import re
import sys
import threading
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import checker  # noqa: E402


def _load_tracer():
    """The tracer (tracer/trace.py) is optional. Loaded by path under its own name,
    because a module called `trace` would shadow Python's own."""
    import importlib.util
    path = HERE / "tracer" / "trace.py"
    if not path.is_file():
        return None
    spec = importlib.util.spec_from_file_location("lab_tracer", path)
    module = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(module)
    except Exception as err:   # noqa: BLE001 - a broken tracer must not stop the guide
        print(f"tracer: not loaded: {type(err).__name__}: {err}", file=sys.stderr)
        return None
    return module if hasattr(module, "trace") else None


TRACER = _load_tracer()

DIY_RE = re.compile(r"^\s*### DIY (\d+):\s*(.+?)\s*$")
# A README marks an expected output as only an example on its **Expected output** line,
# or in a note in brackets or italics straight after it ("A representative run - your
# three strings can hold any values you like").
# A plain "hash codes differ from run to run" is not such a mark: that README goes on to
# say every printed line is the same on every run.
LOOSE_RE = re.compile(r"representative|\b(?:may|will|can) (?:differ|vary)\b|any values", re.IGNORECASE)
SITE_PATH = re.compile(r"^/(?:[A-Za-z0-9._~-]+/)*[A-Za-z0-9._~-]*$")
LAB_PAGE = re.compile(r"^/labs/([a-z0-9-]+)/(?:index\.html)?$")
TYPES = {".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
         ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
         ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
         ".pdf": "application/pdf", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8"}
OWN_FILES = {"guide.js", "guide.css"}
FETCH_TIMEOUT = 8
FETCH_LIMIT = 64 * 1024 * 1024


def _host(value: str) -> str:
    """A Host or Origin authority, lower-cased and without a default port."""
    return re.sub(r":(?:443|80)$", "", value.strip().lower())


def expected_output(readme: str, k: int) -> tuple[str, bool] | None:
    """DIY k's expected output: the first ```text fence after its `**Expected output**`
    line, as the solutions repo's checker reads it, and whether the README says that
    output is only an example (see LOOSE_RE). None when there is no such DIY."""
    lines = readme.split("\n")
    marks = [(i, int(m.group(1))) for i, line in enumerate(lines) if (m := DIY_RE.match(line))]
    for idx, (i, number) in enumerate(marks):
        if number != k:
            continue
        end = marks[idx + 1][0] if idx + 1 < len(marks) else len(lines)
        for j in range(i, end):
            if "**Expected output**" not in lines[j]:
                continue
            n = j + 1
            while n < end and not lines[n].strip().startswith("```text"):
                n += 1
            body = []
            for n in range(n + 1, end):
                if lines[n].strip().startswith("```"):
                    after = next((line.strip() for line in lines[n + 1:end] if line.strip()), "")
                    note = after if after[:1] in "(*_" else ""
                    loose = bool(LOOSE_RE.search(lines[j]) or LOOSE_RE.search(note))
                    return "\n".join(body), loose
                body.append(lines[n].rstrip())
        return None
    return None


def loosen(result: dict, expected: str) -> dict:
    """For an exercise whose expected output is only an example: a run that printed at
    least as many lines passes, and says the comparison is the student's to make."""
    want = len([line for line in expected.split("\n") if line.strip()])
    got = len([line for line in (result.get("actual") or "").split("\n") if line.strip()])
    result["loose"] = True
    if got >= want:
        result.update(status="pass", firstDiff=None, message=(
            "Your program runs. This exercise's expected output is an example (your values "
            "can differ), so compare yours with it line by line."))
    else:
        result["message"] = (f"Your program printed {got} line{'s' * (got != 1)}; the example "
                             f"has {want}. Its values are only an example, but every line "
                             "should be there.")
    return result


class Lab:
    def __init__(self, slug: str, folder: Path, package: str, monday: datetime.date):
        self.slug, self.folder, self.package, self.monday = slug, folder, package, monday
        self.main_class = f"{package}.Main"


class Module:
    """The labs this copy holds, and the site, from module/schedule.json."""

    def __init__(self, repo: Path):
        self.repo = repo
        self.root = repo / "lectures-and-labs"
        schedule = json.loads((repo / "module" / "schedule.json").read_text(encoding="utf-8"))
        start = datetime.date.fromisoformat(schedule["startDate"])
        self.site = None
        self.labs: dict[str, Lab] = {}
        for i, row in enumerate(schedule.get("weeks", [])):
            lab_url, deck_url = row.get("labUrl") or "", row.get("lectureUrl") or ""
            m = re.match(r"^(https://[^\s?#]+/)labs/([a-z0-9-]+)/$", lab_url)
            deck = re.match(r"^https://[^\s?#]+/([a-z0-9-]+)/$", deck_url)
            if not m or not deck:
                continue
            self.site = self.site or m.group(1)
            name = deck.group(1).replace("-", "_") + "_lab"
            found = sorted(self.root.glob(f"*/{name}"))
            if found:
                self.labs[m.group(2)] = Lab(m.group(2), found[0], f"{found[0].parent.name}.{name}",
                                            start + datetime.timedelta(weeks=i))

    def current(self, today: datetime.date | None = None) -> str | None:
        """This week's lab, else the latest one already started, else the first."""
        today = today or datetime.date.today()
        started = [lab for lab in self.labs.values() if lab.monday <= today]
        if started:
            return max(started, key=lambda lab: lab.monday).slug
        return min(self.labs.values(), key=lambda lab: lab.monday).slug if self.labs else None

    def display(self, lab: Lab) -> str:
        return lab.folder.relative_to(self.repo).as_posix()


class Site:
    """The published site, fetched once per run and cached on disk."""

    def __init__(self, base: str, cache: Path):
        self.base = base
        self.cache = cache
        self.fresh: set[str] = set()
        self.locks: dict[str, threading.Lock] = {}
        self.guard = threading.Lock()

    def file_for(self, path: str) -> Path:
        rel = path.lstrip("/")
        return self.cache / (rel + "index.html" if rel == "" or rel.endswith("/") else rel)

    def get(self, path: str) -> tuple[str, bytes | None]:
        """("ok", body) | ("missing", None) | ("offline", None)."""
        target = self.file_for(path)
        with self.guard:                  # one lock per cached file: /x/ and /x/index.html share one
            lock = self.locks.setdefault(str(target), threading.Lock())
        with lock:
            if path not in self.fresh:
                try:
                    request = urllib.request.Request(self.base + path.lstrip("/"),
                                                     headers={"User-Agent": "lab-guide"})
                    with urllib.request.urlopen(request, timeout=FETCH_TIMEOUT) as response:
                        body = response.read(FETCH_LIMIT + 1)
                    if len(body) > FETCH_LIMIT:
                        return "missing", None
                    target.parent.mkdir(parents=True, exist_ok=True)
                    part = target.with_name(f".{target.name}.{threading.get_ident()}.part")
                    part.write_bytes(body)
                    part.replace(target)
                    self.fresh.add(path)
                    return "ok", body
                except urllib.error.HTTPError as err:
                    if err.code == 404:
                        return "missing", None
                except (urllib.error.URLError, OSError, ValueError):
                    pass           # offline or the site is down: the cache answers below
            try:
                return "ok", target.read_bytes()
            except OSError:
                return "offline", None


def add_guide(page: str, lab: Lab, display: str) -> str:
    """The lab page with guide.css and guide.js added, and the progress journey too when
    the page has no interactive layer of its own (guide.js gives every lab a Do step)."""
    attrs = f'data-lab="{html.escape(lab.slug)}" data-folder="{html.escape(display)}"'
    head = ('<link rel="stylesheet" href="/codespace/guide.css">\n'
            f'<script src="/codespace/guide.js" {attrs} defer></script>\n')
    if not re.search(r"<body[^>]*\bdata-lab=", page):
        head = ('<link rel="stylesheet" href="/labs/static/tokens.css">\n'
                '<link rel="stylesheet" href="/labs/static/journey.css">\n' + head +
                '<script src="/labs/static/journey.js" defer></script>\n')
        page = re.sub(r"<body\b", f'<body data-lab="{html.escape(lab.slug)}"', page, count=1)
    return page.replace("</head>", head + "</head>", 1)


class GuideServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, address, repo: Path, cache: Path):
        super().__init__(address, Handler)
        self.module = Module(repo)
        if not self.module.site:
            raise SystemExit("server: module/schedule.json has no lab links to find the site from")
        self.site = Site(self.module.site, cache)
        self.check_lock = threading.Lock()
        port = address[1]
        self.hosts = set()
        name = os.environ.get("CODESPACE_NAME")
        domain = os.environ.get("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN", "app.github.dev")
        if name:
            self.hosts.add(f"{name}-{port}.{domain}")
        # This machine by name on any port (VS Code may forward the guide to another local
        # port), and without CODESPACE_NAME any Codespace address for this port: those
        # names are GitHub's, so no other site can point one at this machine.
        self.host_pattern = re.compile(rf"^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$"
                                       rf"|^[a-z0-9-]+-{port}\.{re.escape(domain)}$")


class Handler(BaseHTTPRequestHandler):
    server: GuideServer
    server_version = "lab-guide"
    sys_version = ""

    def log_message(self, fmt, *args):   # quiet: only refusals and failures are logged
        pass

    def send(self, status: int, body: bytes = b"", content_type: str = "text/plain; charset=utf-8",
             headers: dict | None = None) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        for name, value in (headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def send_json(self, status: int, data) -> None:
        self.send(status, json.dumps(data).encode(), "application/json; charset=utf-8")

    def own_host(self) -> bool:
        host = _host(self.headers.get("Host") or "")
        if host in self.server.hosts or self.server.host_pattern.match(host):
            return True
        print(f"refused a request for host {host[:100]!r}", file=sys.stderr)
        return False

    def same_origin(self) -> bool:
        """Belt and braces beside X-Lab-Check: a browser that says where a request comes
        from must say it comes from this page."""
        site = self.headers.get("Sec-Fetch-Site")
        if site is not None and site not in ("same-origin", "none"):
            return False
        origin = self.headers.get("Origin")
        if origin is None:
            return True
        return _host(urllib.parse.urlsplit(origin).netloc) == _host(self.headers.get("Host") or "")

    # -- routes ---------------------------------------------------------------
    def do_GET(self):
        if not self.own_host():
            return self.send(403, b"Forbidden")
        path = urllib.parse.urlsplit(self.path).path
        if path == "/api/health":
            return self.send_json(200, {"ok": True})
        if path == "/api/trace/status":
            return self.send_json(200, {"enabled": TRACER is not None})
        if path == "/":
            slug = self.server.module.current()
            return self.send(302, headers={"Location": f"/labs/{slug}/" if slug else "/labs/"})
        if path.startswith("/codespace/"):
            name = path[len("/codespace/"):]
            if name not in OWN_FILES:
                return self.send(404, b"Not found")
            return self.send(200, (HERE / name).read_bytes(), TYPES[Path(name).suffix])
        if (path.startswith("/api/") or not SITE_PATH.match(path)
                or any(part in (".", "..") for part in path.split("/"))):
            return self.send(404, b"Not found")
        last = path.rsplit("/", 1)[1]
        if last and "." not in last:              # a folder: its pages link relative to "/"
            return self.send(301, headers={"Location": path + "/"})
        status, body = self.server.site.get(path)
        if status == "missing":
            return self.send(404, b"Not found")
        if status == "offline":
            return self.send(503, "The lab pages couldn't be loaded. Check this Codespace is "
                                  "online, then reload.".encode())
        target = self.server.site.file_for(path)
        content_type = TYPES.get(target.suffix, "application/octet-stream")
        m = LAB_PAGE.match(path)
        lab = self.server.module.labs.get(m.group(1)) if m else None
        if lab is not None:
            page = add_guide(body.decode("utf-8", errors="replace"), lab,
                             self.server.module.display(lab))
            body = page.encode("utf-8")
        self.send(200, body, content_type)

    do_HEAD = do_GET

    def do_POST(self):
        if not self.own_host():
            return self.send(403, b"Forbidden")
        length = int(self.headers.get("Content-Length") or 0)
        if length:
            self.rfile.read(min(length, 65536))
        parts = urllib.parse.urlsplit(self.path).path.strip("/").split("/")
        if self.headers.get("X-Lab-Check") != "1" or not self.same_origin():
            return self.send(403, b"Forbidden")
        if len(parts) == 3 and parts[:2] == ["api", "trace"]:
            return self.trace_run(parts[2])
        if len(parts) != 4 or parts[:2] != ["api", "check"] or not parts[3].isdigit():
            return self.send(404, b"Not found")
        lab = self.server.module.labs.get(parts[2])
        if lab is None:
            return self.send(404, b"Not found")
        try:
            readme = (lab.folder / "README.md").read_text(encoding="utf-8")
        except OSError:
            return self.send(404, b"Not found")
        found = expected_output(readme, int(parts[3]))
        if found is None:
            return self.send(404, b"Not found")
        expected, loose = found
        with self.server.check_lock:
            result = checker.run_check(lab.folder, lab.main_class, expected,
                                       display_folder=self.server.module.display(lab),
                                       cwd=self.server.module.repo)
        if loose and result["status"] == "fail":
            result = loosen(result, expected)
        result["diy"] = int(parts[3])
        self.send_json(200, result)

    def trace_run(self, slug: str) -> None:
        if TRACER is None:
            return self.send(503, b"Watch my code run is not available here.")
        lab = self.server.module.labs.get(slug)
        if lab is None:
            return self.send(404, b"Not found")
        with self.server.check_lock:          # one Java program at a time, as for checks
            try:
                data = TRACER.trace(lab.folder, lab.main_class, max_steps=400, timeout=12.0,
                                    cwd=self.server.module.repo)
            except Exception as err:   # noqa: BLE001
                print(f"tracer: failed: {type(err).__name__}: {err}", file=sys.stderr)
                data = {"error": "tracer", "message": "The tracer couldn't run your program."}
        self.send_json(200, data)


def warm_up(server: GuideServer) -> None:
    """Compile the tracer and fetch this week's page now, so the first click is quick."""
    if TRACER is not None:
        try:
            TRACER.tracer_classes()
        except Exception as err:   # noqa: BLE001
            print(f"tracer: not compiled: {type(err).__name__}: {err}", file=sys.stderr)
    slug = server.module.current()
    if slug:
        server.site.get(f"/labs/{slug}/")


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve the lab guide in this Codespace.")
    parser.add_argument("--repo", required=True, type=Path, help="the student's copy of the module")
    parser.add_argument("--port", default=8081, type=int)
    parser.add_argument("--cache", type=Path,
                        default=Path(os.environ.get("XDG_CACHE_HOME") or Path.home() / ".cache")
                        / "lab-guide" / "site")
    args = parser.parse_args()
    server = GuideServer(("127.0.0.1", args.port), args.repo.resolve(), args.cache)
    threading.Thread(target=warm_up, args=(server,), daemon=True).start()
    print(f"lab guide: http://localhost:{args.port}/ ({len(server.module.labs)} labs, "
          f"pages from {server.module.site})", file=sys.stderr, flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
