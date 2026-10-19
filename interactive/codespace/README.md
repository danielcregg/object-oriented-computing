# interactive/codespace/: the lab guide inside a student's Codespace (pilot)

**Status: pilot, on the `pilot/codespaces-lab-guide` branch only.** `main`'s
dev container is untouched, so no student copy changes until this is merged
(see "Rolling it out").

When a Codespace starts, a small guide server starts with it, and VS Code
opens the guide beside the code. The guide shows this week's lab page from the
module site, with the interactive layer where a lab has one (animations,
puzzles, the progress journey), and adds to **every** lab:

- **Check my output** under each exercise's Expected output. It compiles and
  runs the student's own code in their lab folder and compares what it prints
  with the expected output in their copy of the README. The comparison works
  as in the solutions repo's checker, except that the expected lines may appear
  anywhere in the output, so code left over from earlier exercises does not
  fail a later check. A pass turns the exercise's dot green and the journey's
  **Do** step with it. Compile errors, crashes and endless loops come back in
  plain words, with a note for the common first-year mistakes.
- **Watch my code run**: the student's own `Main.java`, stepped line by line
  under the Java debugger and drawn by the same engine as the lab's
  animations: variables, arrays and objects as boxes and arrows.
- A progress journey (Read and Do steps) on the labs that have no interactive
  layer of their own.

## How it works

- `start.sh` runs from the dev container's `postStartCommand` and starts
  `server.py` on port 8081 (localhost only). The port's `openPreview`
  attribute makes VS Code open it in the editor's browser tab; the student can
  reopen it from the Ports tab.
- `server.py` (Python standard library only: the Codespace image has Python 3
  but no pip) fetches the published page for each path once per run and
  caches it in `~/.cache/lab-guide`, so the guide opens offline too. It adds
  `guide.js` and `guide.css` to a lab page. The site's address comes from the
  schedule's lab links. `/` redirects to the current week's lab.
- `checker.py` compiles with `javac --release 21` and runs the program with
  time and output limits, one check at a time. `tracer/` is the "Watch my code
  run" tracer: `Tracer.java` drives the JDK's own debugger (JDI), and
  `trace.py` turns what it records into animation data. Its first use compiles
  it into `~/.cache/lab-tracer/`.
- Safety: every request must name the server's own host (localhost or the
  Codespace's forwarded address), which shuts out DNS rebinding. A check or
  trace also needs the header `X-Lab-Check: 1` and a same-origin request, so
  another website cannot trigger one. The port stays private (GitHub sign-in).
- There is no AI tutor in this version: Copilot Chat is already in the
  Codespace and follows the student section of `AGENTS.md`.

## Trying it

Open a Codespace on the branch:
`gh codespace create -R danielcregg/object-oriented-computing -b pilot/codespaces-lab-guide`,
or **Code → Codespaces → ⋯ → New with options** on GitHub. The guide opens
by itself once VS Code is ready.

Locally, from the repo root (needs Python 3 and a JDK):

    python3 interactive/codespace/server.py --repo . --port 8081
    # then open http://localhost:8081/

## Rolling it out

Merging the branch changes `.devcontainer/devcontainer.json`, which the
nightly sync already delivers to every untouched copy. But `interactive/` is
not course content, so copies would get the setting without the files it
starts: the `|| true` keeps their Codespaces starting, but the guide stays
off. Before merging, add `interactive/codespace/` to the COURSE pattern in
`scripts/update-course-content.sh` (the pages, engines and animation data
come from the site, so nothing else is needed). The sync then brings the files
in the night after its own update, the same two-night path every layout
change takes. The alternative is for `start.sh` to fetch the runtime from the
site, which needs no sync change but runs downloaded code at every start; the
sync route keeps what runs in the student's own repo, where they can see it.
