#!/usr/bin/env python3
"""Ask a model to review the teaching content for things no tool can check.

Deliberately NOT asked: "does this code compile?" or "does this print what
it says?" -- verify_snippets and the labs-solutions repo answer those
exactly, and a model would only guess less reliably. This looks for the
pedagogical drift a compiler cannot see: a lecture and its lab disagreeing,
terminology shifting between decks, a hint that hands over the answer, a
practice question that needs something never taught.

Writes content-review-findings.md. Never edits the teaching material --
the workflow opens an issue for a human to judge.

Two providers, selected with --provider (or REVIEW_PROVIDER):

  bedrock  Amazon Bedrock. Auth is a single API key in
           AWS_BEARER_TOKEN_BEDROCK; boto3 reads that environment variable
           itself -- the key cannot be passed as a client argument -- so
           this script never handles the value. Also AWS_REGION.
  copilot  GitHub Copilot CLI. Auth is COPILOT_GITHUB_TOKEN, which in
           Actions can be the workflow's own GITHUB_TOKEN -- no stored
           secret and nothing to expire. Requires `npm i -g @github/copilot`.

Also: BEDROCK_MODEL_ID / COPILOT_MODEL_ID (or --model), and REVIEW_SCOPE
(everything|lectures|labs|practice).
"""
import argparse
import os
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

# Bedrock: this account's org SCP allows only some models. Confirmed
# invokable: eu.anthropic.claude-opus-4-6-v1 (best), eu.anthropic.claude-opus-4-5-*,
# and the Nova text models. Sonnet 4.5, Haiku 4.5 and Claude 3.x are DENIED
# by the SCP, so picking one of those fails with AccessDeniedException even
# though the key is valid. The regional inference-profile prefix (eu./us.)
# is required -- bare model ids are rejected.
BEDROCK_MODEL = os.environ.get("BEDROCK_MODEL_ID", "eu.anthropic.claude-opus-4-6-v1")

# Copilot: a Pro seat entitles claude-sonnet-5 (the CLI's own default),
# claude-sonnet-4.6 and gpt-5.4. The Opus family and claude-fable-5 are NOT
# entitled on Pro and fail with "Model ... is not available" -- they appear
# in the CLI's debug log as catalogue entries, which is not the same thing.
# Note the dotted spelling: Copilot says claude-sonnet-4.6, the Anthropic
# API says claude-sonnet-4-6. Verify with --model before trusting a name.
COPILOT_MODEL = os.environ.get("COPILOT_MODEL_ID", "claude-sonnet-5")

SCOPE = os.environ.get("REVIEW_SCOPE", "everything")
OUT = Path("content-review-findings.md")

# Windows caps a command line at 32,767 characters and the prompt travels as
# an argv entry. POSIX runners allow ~2MB, so this only bites local testing.
WINDOWS_ARG_LIMIT = 30_000

BRIEF = """You are reviewing a university module's teaching material: a Java
course for first-year students. You are given one topic at a time: the lecture
deck and, where it exists, that topic's lab instructions.

Report things that would mislead or block a student. Specifically:

1. CONTRADICTIONS between the lecture and the lab (different definitions,
   different naming, a lab assuming something the lecture never taught).
2. TERMINOLOGY that drifts (the same idea called different things without
   saying they are the same).
3. HINTS that give away the whole answer instead of unblocking a step. This
   includes a worked example that sits ABOVE an exercise and already
   contains that exercise's answer for the same class and the same fields --
   the student copies upward instead of writing it.
4. EXPLANATIONS that are wrong or out of date for modern Java (21+).
5. GAPS: an exercise needing a concept the material never introduces.

OUT OF SCOPE, never report: style preferences, slide design, or code that is
deliberately broken (marked no-compile, or labelled as an error for students
to predict). Those are scope limits, not judgement calls.

Within that scope, report everything you find, including items you are
unsure about. Do NOT filter for importance or confidence -- a human reads
every finding and decides what to act on, and a separate pass does the
ranking. Surfacing something that gets dismissed costs far less than
staying silent about a real problem.

For each finding give: the file, a short quote locating it, what is wrong,
the smallest fix, and your confidence (high / medium / low). Be specific and
brief. If you genuinely find nothing, say "No findings." and stop."""


def read(p: Path, limit=90_000) -> str:
    t = p.read_text(encoding="utf-8")
    # strip the deck's CSS block: it is styling, not teaching content
    t = re.sub(r"<style>.*?</style>", "[styles omitted]", t, flags=re.DOTALL)
    return t[:limit]


def topics():
    """Yield (week folder name, prompt text) per topic.

    The lecture is ALWAYS included: every question in the brief is
    comparative ("does the lab contradict the lecture?", "is this practice
    question answerable from the material as taught?"), so a lab or a bank
    sent on its own gives the model nothing to judge against. SCOPE selects
    what is under review beside it, not whether the reference material is
    present.
    """
    for deck in sorted(Path("weeks").glob("*/slides.md")):
        topic = re.sub(r"^week-\d+-", "", deck.parent.name)
        pkg = topic.replace("-", "")   # Java package form: no hyphens
        lab = Path("labs/src/ie/atu") / pkg / "README.md"
        bank = Path("practice/bank") / f"{pkg}.json"

        parts = [f"=== LECTURE ({deck}) ===\n{read(deck)}"]
        if SCOPE in ("everything", "labs") and lab.is_file():
            parts.append(f"=== LAB ({lab}) ===\n{read(lab)}")
        if SCOPE in ("everything", "practice") and bank.is_file():
            parts.append(f"=== PRACTICE QUESTIONS ({bank}) ===\n{read(bank)}")

        # Under a narrow scope, a topic with only its lecture and nothing to
        # compare it against is not worth an API call.
        if SCOPE in ("labs", "practice") and len(parts) == 1:
            continue
        yield deck.parent.name, "\n\n".join(parts)


def call_bedrock(client, model: str, content: str):
    """Return (text, truncated). Raises on failure -- the caller records it."""
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 2000,
        "system": BRIEF,
        "messages": [{"role": "user", "content": [{"type": "text", "text": content}]}],
    }
    resp = client.invoke_model(modelId=model, body=json.dumps(body))
    payload = json.loads(resp["body"].read())
    return (payload["content"][0]["text"].strip(),
            payload.get("stop_reason") == "max_tokens")


def call_copilot(workdir: str, model: str, content: str):
    """Return (text, truncated). Raises on failure -- the caller records it.

    The CLI is an agent that can read and modify a repository, which this
    job must never do. Three things keep it to text in, text out:
      * every tool is excluded and the built-in MCP servers are off, so it
        has no read, write or shell tool to reach the repo with;
      * --no-custom-instructions stops it loading AGENTS.md / CLAUDE.md,
        which would otherwise prepend maintainer instructions to a review;
      * -C points its working directory at an empty temp dir, so even a
        tool that slipped through would not be standing in the repo.
    Do NOT add --allow-all-tools: it is what the CLI's own help suggests for
    non-interactive use, and it is exactly wrong here.

    truncated is always False: the CLI reports no stop reason, so unlike
    Bedrock there is no signal to detect a cut-off answer.
    """
    # The prompt rides in argv, so the system prompt is prepended to the
    # user turn -- the CLI has no separate system-prompt channel.
    prompt = f"{BRIEF}\n\n{content}"
    if os.name == "nt" and len(prompt) > WINDOWS_ARG_LIMIT:
        raise RuntimeError(
            f"prompt is {len(prompt):,} chars; Windows caps a command line at "
            f"32,767. Run the copilot provider on a POSIX runner (CI is "
            f"ubuntu-latest) or under WSL.")
    proc = subprocess.run(
        ["copilot", "-p", prompt, "--model", model,
         "-s",                        # response only, no stats footer
         "--no-ask-user",             # never block waiting for a human
         "--no-custom-instructions",
         "--disable-builtin-mcps",
         "--excluded-tools",          # no tools at all
         "--no-color",
         "-C", workdir],
        capture_output=True, text=True, timeout=900, encoding="utf-8")
    if proc.returncode != 0:
        raise RuntimeError(
            (proc.stderr or proc.stdout or "no output").strip()[:400])
    return proc.stdout.strip(), False


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--provider", choices=("bedrock", "copilot"),
                    default=os.environ.get("REVIEW_PROVIDER", "bedrock"),
                    help="which backend to review with (default: bedrock)")
    ap.add_argument("--model", default=None,
                    help="override the provider's default model")
    ap.add_argument("--topic", default=None,
                    help="review only this week folder, e.g. week-04-arrays. "
                         "For comparing providers on one deck without paying "
                         "for all nine.")
    args = ap.parse_args()

    provider = args.provider
    model = args.model or (BEDROCK_MODEL if provider == "bedrock" else COPILOT_MODEL)

    client = workdir = tmp = None
    if provider == "bedrock":
        try:
            import boto3
        except ImportError:
            sys.exit("boto3 not installed")
        if not os.environ.get("AWS_BEARER_TOKEN_BEDROCK"):
            sys.exit("AWS_BEARER_TOKEN_BEDROCK is not set - nothing to authenticate with")
        client = boto3.client("bedrock-runtime",
                              region_name=os.environ.get("AWS_REGION", "eu-west-1"))
    else:
        if not shutil.which("copilot"):
            sys.exit("copilot CLI not found - install it with "
                     "`npm install -g @github/copilot`")
        # Not fatal: COPILOT_GITHUB_TOKEN is only one of the CLI's auth
        # paths -- on a developer machine it uses the credential stored by
        # `copilot` itself. In CI the workflow gates on the token before it
        # ever gets here, so a warning is enough.
        if not os.environ.get("COPILOT_GITHUB_TOKEN"):
            print("note: COPILOT_GITHUB_TOKEN unset - relying on the CLI's "
                  "own stored credential", file=sys.stderr)
        tmp = tempfile.TemporaryDirectory(prefix="content-review-")
        workdir = tmp.name

    sections, errors, reviewed, truncated = [], [], 0, []
    selected = [t for t in topics() if args.topic in (None, t[0])]
    if args.topic and not selected:
        sys.exit(f"no such topic: {args.topic!r} (scope={SCOPE!r})")
    try:
        for name, content in selected:
            try:
                if provider == "bedrock":
                    text, cut = call_bedrock(client, model, content)
                else:
                    text, cut = call_copilot(workdir, model, content)
                if cut:
                    truncated.append(name)
            except Exception as exc:                      # noqa: BLE001
                # A failed CALL is not a finding. Reporting it as one is how an
                # auth failure across every topic once read as a complete, clean
                # review -- the report looked full and the run stayed green.
                errors.append(f"**{name}** — `{type(exc).__name__}: {exc}`")
                print(f"FAILED  {name}: {type(exc).__name__}: {exc}")
                continue

            reviewed += 1
            clean = not text or "no findings" in text.lower()
            if not clean:
                sections.append(f"## {name}\n\n{text}\n")
            print(f"reviewed {name}: {'clean' if clean else 'findings'}")
    finally:
        if tmp:
            tmp.cleanup()

    header = (
        "# Content review findings\n\n"
        "_Generated by `.github/workflows/content-review.yml`. **Suggestions, "
        "not corrections** — every item needs a human decision before it is "
        "acted on. Compilation and output are already verified by CI; this "
        "looks only for pedagogical drift. Findings are deliberately "
        "unfiltered by confidence, so expect some to be dismissed._\n\n"
        f"_Scope `{SCOPE}` · provider `{provider}` · model `{model}` · "
        f"{reviewed} topic(s) reviewed, {len(errors)} failed._\n\n"
    )
    parts = [header]
    if errors:
        parts.append("## ⚠️ Could not review\n\n"
                     "These topics were NOT reviewed — the call failed. Their "
                     "absence below is not a clean bill of health.\n\n"
                     + "\n".join(f"- {e}" for e in errors) + "\n\n")
    if truncated:
        parts.append("## ⚠️ Truncated\n\n"
                     "The model hit its output limit here, so its report is "
                     "cut short and may be incomplete: "
                     + ", ".join(f"`{t}`" for t in truncated) + "\n\n")
    if provider == "copilot":
        parts.append("> Truncation is not detected under the `copilot` "
                     "provider: the CLI reports no stop reason, so a report "
                     "cut short by an output limit looks complete here.\n\n")
    parts.append("\n".join(sections) if sections
                 else "No findings across the reviewed material.\n")
    OUT.write_text("".join(parts), encoding="utf-8", newline="\n")
    print(f"wrote {OUT} ({len(sections)} topic(s) with findings, "
          f"{len(errors)} failure(s))")

    # Nothing reviewed at all = the run did not do its job. Fail loudly rather
    # than file an issue saying "No findings", which reads as an all-clear.
    if reviewed == 0:
        sys.exit(f"reviewed 0 topics (scope={SCOPE!r}, provider={provider!r}, "
                 f"{len(errors)} failure(s)) - treating as a failed run, "
                 f"not a clean one")


if __name__ == "__main__":
    main()
