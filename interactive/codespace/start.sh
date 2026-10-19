#!/usr/bin/env bash
# Starts the lab guide in this Codespace; the dev container runs it each time the
# Codespace starts (postStartCommand). VS Code then sees port 8081 and opens the guide
# beside the code. It never fails, so it can't stop the Codespace starting.
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$here/../.." && pwd)"
port=8081
log="${XDG_CACHE_HOME:-$HOME/.cache}/lab-guide/server.log"
mkdir -p "$(dirname "$log")" || exit 0

if curl -fsS -m 2 "http://127.0.0.1:$port/api/health" >/dev/null 2>&1; then
  exit 0                                   # already running
fi
# setsid + nohup: the server outlives the lifecycle command that started it.
setsid nohup python3 "$here/server.py" --repo "$repo" --port "$port" >"$log" 2>&1 </dev/null &
exit 0
