# interactive/ — animations, puzzles and a progress journey for lab pages

A lab's page on the site (`/labs/<labUrl folder>/`) can carry an
interactive layer on top of its README: **Watch** (step-through
animations), **Play** (short puzzles) and a **journey** (a progress ring
per section that goes from red to green, plus badges). GitHub and a
student's copy still show the plain README; only the site build adds the
layer, and only for a lab that has `interactive/<labUrl folder>/lab.json`.
Every other lab page is built exactly as before.

## Layout

- `static/` — the engines, shared by every lab: `stepper.js`/`.css`
  (animations), `play.js`/`.css` (puzzles), `journey.js`/`.css` (progress
  and badges), `tokens.css` (colours and easings). Plain JavaScript and
  CSS: no libraries, no build step, nothing fetched from another site. The
  build copies them to `/labs/static/`.
- `<lab>/lab.json` — where the layer goes on that lab's page:
  - `taskAnimations`: `{"id": "task-diy-K", "diy": K}`, placed just before
    DIY K's **Expected output**;
  - `animations`: `{"id", "before"}`, a section animation placed just
    before the README line that starts with `before` (e.g. `"### DIY 2:"`);
  - `puzzles`: `{"id", "before"}`, placed the same way;
  - `journey`: `labels` (a short name per DIY number, shown on the ring)
    and `masterBadge` (the badge for finishing every section).
- `<lab>/animations/<id>.json` and `<lab>/puzzles/<id>.json` — the content.
  The format is documented at the top of `static/stepper.js` and
  `static/play.js`.
- `codespace/` — the lab guide inside a student's Codespace: these pages
  plus **Check my output** and **Watch my code run** on the student's own
  code. A pilot; its README says how it works and how to roll it out.

## Rules

- **A task animation shows the result of DIY K, never its code.** It has no
  code panel, its captions are words rather than statements, and its
  console ends on exactly DIY K's **Expected output**. It shows the student
  what to aim for; writing the code stays their job, as `AGENTS.md`
  requires.
- **A section animation replays an example the README already shows** (a
  segment's `example` names the class), and prints that example's Output
  block exactly.
- **A puzzle drills the section's idea**, not the DIY's code: no puzzle
  round may be a DIY answer in disguise.
- Progress lives only in the student's browser (`localStorage`); nothing
  is sent anywhere, and the page works without storage.
- The content ships publicly like everything else here: nothing from the
  solutions repo, nothing that spoils an MCQ.

`scripts/check_interactive.py` enforces the first two rules and that every
placement, file and journey label matches the README; CI runs it with the
other gates. After renaming a heading or changing an expected output in a
lab README, run it: an animation still printing the old output fails the
build. A section animation is checked against its example's Output block,
so where a README shows none (the Strings lab), the gate cannot catch a
changed example: after editing one, step through its animation.

## Preview

    pip install markdown==3.10.3
    python scripts/check_interactive.py
    python scripts/build_lab_pages.py build
    python -m http.server -d build 8000   # then open /labs/<lab>/

## Adding a lab

Make `interactive/<labUrl folder>/` with a `lab.json` and the files it
names, then run the gate and preview. A lab with no folder simply has no
layer.
