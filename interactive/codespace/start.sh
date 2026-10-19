#!/usr/bin/env bash
# Starts the lab guide in this Codespace; the dev container runs it each time the
# Codespace starts (postStartCommand). VS Code then sees port 8081 and opens the guide
# beside the code. It never fails, so it can't stop the Codespace starting.
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$here/../.." && pwd)"
port=8081
log="${XDG_CACHE_HOME:-$HOME/.cache}/lab-guide/server.log"
mkdir -p "$(dirname "$log")" || exit 0

# One start at a time: a second one waits here, then finds the guide already running.
exec 9>"$(dirname "$log")/start.lock"
flock -w 60 9 || exit 0
if curl -fsS -m 2 "http://127.0.0.1:$port/api/health" 2>/dev/null | grep -q '"lab-guide"'; then
  exit 0                                   # already running
fi
: >"$log"

# The image's Python is Debian's python3-minimal, which has no json, http.server or
# urllib.request; the rest of the standard library is one small package, installed on
# the first start. `apt-get update` also reports an error for a third-party list the
# image carries (an unsigned yarn repository); Debian's own lists still update, so that
# status is ignored.
if ! python3 -c 'import html, http.server, json, shutil, urllib.request' 2>/dev/null; then
  {
    sudo -n apt-get update -qq || true
    sudo -n env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq --no-install-recommends python3
  } >>"$log" 2>&1
fi

# setsid + nohup: the server outlives the lifecycle command that started it.
# (9>&- : the server must not hold the start lock.)
setsid nohup python3 "$here/server.py" --repo "$repo" --port "$port" >>"$log" 2>&1 </dev/null 9>&- &
# Hold the lock until it answers (or 20 s pass), so a second start can't launch another.
for _ in $(seq 1 40); do
  curl -fsS -m 1 "http://127.0.0.1:$port/api/health" >/dev/null 2>&1 && break
  sleep 0.5
done
exit 0
