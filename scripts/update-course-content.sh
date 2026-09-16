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
# you created, and it leaves alone any course file you have edited.
#
# How it can tell: it knows every version of every course file the module
# repo has ever published. A file matching one of them, however old, is
# course material you have not touched, so it is refreshed; anything else is
# your edit and stays. Nothing about "what you last received" is stored
# anywhere, so the nightly workflow, a Codespace and a laptop always agree.
#
# It also keeps ONE history: it first catches up with your repo on GitHub,
# and it only refreshes content while this copy and GitHub agree, pushing the
# refresh straight back. The nightly run and a Codespace therefore never
# commit the same update separately -- which is what would turn your next
# "Sync Changes" into a merge conflict in a file you never opened.
#
#   bash scripts/update-course-content.sh            refresh now
#   bash scripts/update-course-content.sh --attach   what a Codespace runs each
#                                                    time it opens (quiet)
#
# The course-sync workflow runs the first form in your repo every night.

# One { ... } block, so bash has read the whole script before it runs any of
# it, whatever happens to this file in the meantime.
{
set -uo pipefail

UPSTREAM_URL="https://github.com/danielcregg/object-oriented-computing.git"
UPSTREAM_SLUG="danielcregg/object-oriented-computing"
BRANCH="main"
MODE="${1:-}"
# The course content, file by file rather than whole folders, so editing one
# deck never stops the rest from updating.
COURSE='^(README\.md|labs/README\.md|mcq/README\.md|module/schedule\.json|weeks/.*|labs/src/ie/atu/[^/]+/README\.md)$'

say() { [ "$MODE" = "--attach" ] || printf '%s\n' "$@"; }   # one line per argument
stop() { say "$@"; exit 0; }   # always exit 0: never block a Codespace from starting

command -v git >/dev/null || stop "git not found."
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || stop "Not a git repository."
cd "$(git rev-parse --show-toplevel)" || stop "Cannot find the top of the repository."

# In the module's own repo there is nothing to pull from -- do nothing at all.
if git remote get-url origin 2>/dev/null | grep -qi "$UPSTREAM_SLUG"; then
  stop "This IS the module repo - nothing to update."
fi
[ "$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" = "$BRANCH" ] ||
  stop "You are not on the $BRANCH branch - nothing changed."

# "Sync Changes" is git pull, then git push. When GitHub has a commit this
# copy lacks (a nightly update) and this copy has one GitHub lacks (your
# work), git must be told to merge the two or it stops with "divergent
# branches". They never touch the same files, so that merge is clean.
git config pull.rebase >/dev/null 2>&1 || git config pull.rebase false

# 1. Catch up with your repo on GitHub. Fast-forward only: if this copy has
#    work GitHub has not seen yet, nothing moves.
online=0; ahead=0; behind=0
if git fetch --quiet origin "$BRANCH" 2>/dev/null; then
  online=1
  read -r ahead behind < <(git rev-list --left-right --count "HEAD...origin/$BRANCH" 2>/dev/null || echo "0 0")
  if [ "$behind" -gt 0 ] && [ "$ahead" -eq 0 ] &&
     git merge --ff-only --quiet "origin/$BRANCH" >/dev/null 2>&1; then
    behind=0
    printf '%s\n' "Caught up with your repo on GitHub."
  fi
fi
if [ "$behind" -gt 0 ]; then
  stop "Your repo on GitHub has newer commits that could not be brought in here automatically." \
       "Click Sync Changes (or run: git pull), then try again."
fi
# A Codespace opening with work GitHub has not seen leaves the content alone:
# the nightly run delivers it on GitHub, and Sync Changes merges it in.
if [ "$MODE" = "--attach" ] && { [ "$online" -eq 0 ] || [ "$ahead" -gt 0 ]; }; then
  exit 0
fi

# 2. The module repo, fetched in full: the list of published versions below
#    is read from its history, and the repo is small.
say "Checking the module repo for updates..."
git remote get-url upstream >/dev/null 2>&1 || git remote add upstream "$UPSTREAM_URL"
git fetch --quiet upstream "$BRANCH" 2>/dev/null ||
  stop "Could not reach the module repo (offline?). Nothing changed."
UP="upstream/$BRANCH"

PUBLISHED="$(mktemp)" || stop "Could not create a temporary file. Nothing changed."
trap 'rm -f "$PUBLISHED"' EXIT
# One "path blob" line for every version of every file the module repo has
# published under those folders.
git log --root --format= --raw --no-abbrev --no-renames "$UP" -- \
    README.md labs mcq module weeks 2>/dev/null |
  awk '$4 !~ /^0+$/ { print $6 " " $4 }' > "$PUBLISHED"
published() { grep -qxF "$1 $2" "$PUBLISHED"; }

# 3. Refresh every course file you have not edited.
touched=()
kept=0
while IFS= read -r p; do
  [ -n "$p" ] || continue
  if [ -e "$p" ]; then
    have="$(git hash-object -- "$p")"
    [ "$have" = "$(git rev-parse "$UP:$p")" ] && continue    # already current
    if ! published "$p" "$have"; then
      say "  kept your version: $p"
      kept=$((kept + 1))
      continue
    fi
  elif [ -n "$(git log -1 --format=%h HEAD -- "$p" 2>/dev/null)" ]; then
    say "  kept your deletion: $p"          # it was here once and you removed it
    kept=$((kept + 1))
    continue
  fi
  git checkout --quiet "$UP" -- "$p" && touched+=("$p")
done < <(git ls-tree -r --name-only "$UP" | grep -E "$COURSE")

# Course files the module repo has since removed or renamed (a week folder
# under its new name, a retired page): drop the old copy too, unless you
# edited it. Your lab work is never considered.
while IFS= read -r p; do
  [ -n "$p" ] || continue
  git cat-file -e "$UP:$p" 2>/dev/null && continue
  [ -e "$p" ] || continue
  if published "$p" "$(git hash-object -- "$p")"; then
    git rm --quiet -- "$p" && touched+=("$p") && say "  removed (retired upstream): $p"
  else
    say "  kept your version (retired upstream): $p"
  fi
done < <(git ls-files -- 'weeks/*' 'mcq/README.md' 'module/schedule.json')

# 4. Commit ONLY the paths refreshed above. A bare `git commit` would sweep in
#    anything you had staged, under the author "course-update". Never signed:
#    a Codespace with GitHub's commit signing switched on refuses to sign for
#    an author that isn't you, and the commit would fail.
changed=()
if [ ${#touched[@]} -gt 0 ]; then
  # --no-renames: a moved folder is a delete plus an add here; rename
  # detection would list only the new name and leave the deletion behind.
  while IFS= read -r p; do
    [ -n "$p" ] && changed+=("$p")
  done < <(git diff --cached --name-only --no-renames -- "${touched[@]}")
fi

if [ ${#changed[@]} -eq 0 ]; then
  say "Already up to date."
elif ! git -c user.name="course-update" -c user.email="course-update@local" \
       -c commit.gpgsign=false commit --quiet -m "chore: update course content from the module repo" \
       -- "${changed[@]}"; then
  printf '%s\n' "Could not commit the update; nothing was saved. Try again later."
else
  printf 'Updated:\n'
  printf '  %s\n' "${changed[@]}"
  if [ "$online" -eq 1 ] && [ "$ahead" -eq 0 ] &&
     git push --quiet origin "HEAD:$BRANCH" 2>/dev/null; then
    printf '%s\n' "Saved to your repo on GitHub. Your own work was not touched."
  else
    printf '%s\n' "Your own work was not touched. Click Sync Changes to save this update to GitHub."
  fi
fi
[ "$kept" -eq 0 ] || say "($kept course file(s) left alone because you have edited them.)"
exit 0
}
