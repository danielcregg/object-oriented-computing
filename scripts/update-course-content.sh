#!/usr/bin/env bash
# Refresh the course content in YOUR copy of this repo from the module repo.
#
# Your copy was made from a template, so it shares no history with the
# module repo and `git merge` cannot be used: with unrelated histories git
# reports every differing file as an add/add CONFLICT, even files you never
# opened. This script copies files instead, which cannot conflict.
#
# It touches ONLY course content -- the lectures, the lab instructions and
# the README. It never touches Main.java, any class you wrote, or any file
# you created, and it skips anything you have edited yourself.
#
# Run it whenever you like:   bash scripts/update-course-content.sh
# (In a Codespace it also runs by itself each time you open the workspace,
# and the course-sync workflow runs it in your repo on GitHub every night.)
set -uo pipefail

UPSTREAM_URL="https://github.com/danielcregg/object-oriented-computing.git"
UPSTREAM_SLUG="danielcregg/object-oriented-computing"
BRANCH="main"
QUIET="${1:-}"                       # --quiet: say nothing unless something changed

say() { [ "$QUIET" = "--quiet" ] || printf '%s\n' "$*"; }
die() { printf '%s\n' "$*" >&2; exit 0; }   # exit 0: never block a Codespace from starting

command -v git >/dev/null || die "git not found."
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "Not a git repository."
cd "$(git rev-parse --show-toplevel)"

# In the module's own repo there is nothing to pull from -- do nothing at all.
if git remote get-url origin 2>/dev/null | grep -qi "$UPSTREAM_SLUG"; then
  say "This IS the module repo - nothing to update."
  exit 0
fi

git remote get-url upstream >/dev/null 2>&1 || {
  say "Adding the module repo as 'upstream'."
  git remote add upstream "$UPSTREAM_URL"
}

say "Checking the module repo for updates..."
# A full fetch, not --depth=1: a shallow tip cannot be pushed as the
# course-sync baseline ref (git refuses "shallow update"), and the module repo
# is small enough that the first fetch is a few seconds and later ones are
# incremental.
if ! git fetch --quiet upstream "$BRANCH" 2>/dev/null; then
  die "Could not reach the module repo (offline?). Nothing changed."
fi

# The content files, listed one by one (not as directories) so that editing
# one deck never blocks the rest from updating.
mapfile -t PATHS < <(
  git ls-tree -r --name-only "upstream/$BRANCH" | grep -E \
    '^(README\.md|labs/README\.md|mcq/README\.md|module/schedule\.json|weeks/.*|labs/src/ie/atu/[^/]+/README\.md)$' || true
)

# Baseline = the content as you last received it: the commit recorded by the
# previous run, or the initial template commit on the first run. Comparing
# against HEAD would be wrong -- you are told to COMMIT your work, so an
# edit you committed looks "clean" against HEAD and would be overwritten.
MARKER=".course-sync"
# The baseline is remembered twice: in this gitignored file (a Codespace or
# your laptop) and in the ref refs/course-sync/baseline, which the nightly
# course-sync workflow pushes to your repo so a fresh checkout on GitHub
# remembers it too. Whichever exists wins; the file is preferred.
LAST="$(cat "$MARKER" 2>/dev/null || git rev-parse -q --verify refs/course-sync/baseline 2>/dev/null || true)"
ROOT="$(git rev-list --max-parents=0 HEAD | tail -1)"

skipped=0
touched=()
for p in "${PATHS[@]}"; do
  [ -n "$p" ] || continue
  base="$ROOT"
  if [ -n "$LAST" ] && git cat-file -e "$LAST:$p" 2>/dev/null; then base="$LAST"; fi
  # Untouched since you received it? Safe to refresh. Otherwise it is yours.
  if git cat-file -e "$base:$p" 2>/dev/null && ! git diff --quiet "$base" -- "$p" 2>/dev/null; then
    say "  kept your version: $p"
    skipped=$((skipped + 1))
    continue
  fi
  git checkout --quiet "upstream/$BRANCH" -- "$p" 2>/dev/null && touched+=("$p")
done

# Course-owned paths that upstream has since removed or renamed (a week folder
# under its new name, a retired page): drop our copy too, or the old and the
# new sit side by side. Same rule as above -- a file you edited is yours and
# stays. Only the course-owned areas are considered; your lab work is never
# touched.
while IFS= read -r p; do
  [ -n "$p" ] || continue
  case " ${PATHS[*]} " in *" $p "*) continue;; esac
  base="$ROOT"
  if [ -n "$LAST" ] && git cat-file -e "$LAST:$p" 2>/dev/null; then base="$LAST"; fi
  if git cat-file -e "$base:$p" 2>/dev/null && ! git diff --quiet "$base" -- "$p" 2>/dev/null; then
    say "  kept your version (retired upstream): $p"
    continue
  fi
  git rm -q -- "$p" 2>/dev/null && touched+=("$p") && say "  removed (retired upstream): $p"
done < <(git ls-files -- 'weeks/*' 'mcq/README.md' 'module/schedule.json')

# Local bookkeeping only -- gitignored, never committed, never pushed.
git rev-parse "upstream/$BRANCH" > "$MARKER"
# ...and pin that commit with a ref. The nightly course-sync workflow pushes
# this ref to your repo and reads it back on the next run, which is how a
# fresh checkout on GitHub knows what you last received; without it every
# file a previous run refreshed would look edited-by-you and stop updating.
git update-ref refs/course-sync/baseline "$(git rev-parse "upstream/$BRANCH")"

# Commit ONLY the content paths this script rewrote. A bare `git commit`
# would sweep in anything you happened to have staged -- and this runs
# automatically when a Codespace attaches, so work you had run `git add` on
# would land in a commit authored "course-update" and captioned as a
# content sync.
changed=()
if [ ${#touched[@]} -gt 0 ]; then
  # --no-renames: a folder that moved upstream is a delete plus an add here,
  # and rename detection would print only the new name, leaving the old
  # file staged but never committed.
  mapfile -t changed < <(git diff --cached --name-only --no-renames -- "${touched[@]}")
fi

if [ ${#changed[@]} -eq 0 ]; then
  say "Already up to date."
else
  printf 'Updated:\n'
  printf '  %s\n' "${changed[@]}"
  git -c user.name="course-update" -c user.email="course-update@local" \
      commit --quiet -m "chore: update course content from the module repo" \
      -- "${changed[@]}"
  printf 'Done - your own work was not touched.\n'
fi
[ "$skipped" -gt 0 ] && printf '(%s file(s) left alone because you had edited them.)\n' "$skipped"
exit 0
