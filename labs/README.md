# OOC Labs

All the module's lab exercises live here — one folder per lab, each with
its **README (the instructions)** and a runnable **`Main.java`** starter.
You write your code in the lab's folder, beside its README.

## Getting started (once)

1. **Use this template → Create a new repository** (green button, top-right
   on GitHub). That gives you your own copy to save work into. Call it
   anything you like — and you can set it to **Private**, since it's your
   work, not something anyone else needs to see.
2. On **your** repo: **Code → Codespaces → Create codespace** — a full Java
   IDE opens in your browser, nothing to install. *(Local instead? Clone
   your repo and open it in VS Code with JDK 21 (the same version as the Codespace) and the "Extension Pack
   for Java" installed — same experience.)*
3. **Save as you go** — see [Saving your work](#saving-your-work) below.
   A Codespace is not a save: GitHub deletes one that sits unused for 30
   days, and only what you have committed and pushed survives.

## Doing a lab

Open the lab's folder below, read its `README.md` (right-click →
*Open Preview* in VS Code), and follow it. Each folder already has the
Java package and a `Main.java` with a run button (▶) — add your classes
beside it. Two rules Java enforces when you create a file: a `public`
class must live in a file with exactly its name (`Book` in `Book.java`),
and every file in the folder starts with the same `package` line as
`Main.java`.

| Lab | Folder |
|---|---|
| Classes and Objects | [`src/ie/atu/classesandobjects/`](src/ie/atu/classesandobjects/) |
| Methods | [`src/ie/atu/methods/`](src/ie/atu/methods/) |
| Arrays | [`src/ie/atu/arrays/`](src/ie/atu/arrays/) |
| Strings | [`src/ie/atu/strings/`](src/ie/atu/strings/) |
| Encapsulation | [`src/ie/atu/encapsulation/`](src/ie/atu/encapsulation/) |
| Inheritance | [`src/ie/atu/inheritance/`](src/ie/atu/inheritance/) |
| Polymorphism | [`src/ie/atu/polymorphism/`](src/ie/atu/polymorphism/) |
| Abstraction | [`src/ie/atu/abstraction/`](src/ie/atu/abstraction/) |

Stuck? Every exercise has a **Hint** you can expand, and every expected
output is printed in the README — compare yours against it before asking.

## Saving your work

Git keeps your work, not the Codespace. After each exercise (or at least
before you close the browser):

1. Open the **Source Control** panel (the branch icon in the left bar, or
   `Ctrl+Shift+G`).
2. Type a one-line message such as `arrays DIY 3 done` in the box.
3. Click **Commit**, then **Sync Changes** (that is the push).

Your repo on GitHub now has the code, and stays there whatever happens to
the Codespace. Every push also runs a small check that compiles all your
lab code: a green tick means it all compiles, a red cross means one file
does not, and the message says which. (You may also see two workflows
listed as *skipped* on every push — those are the module's own site
builders, switched off in copies by design. Ignore them.)

## Getting the latest lectures and lab instructions

If a lab or a lecture is corrected mid-semester, the fix reaches your copy
on its own: every night a small workflow in your repo (`course-sync`) pulls
the latest course content in, and a Codespace does the same each time you
open it. So the first option is:

1. **Do nothing.** Your repo catches up overnight, and your Codespace on
   opening. (In the Codespace, click **Sync Changes** before you start, so
   it picks up what the nightly run committed.)
2. **Press the button.** *Terminal → Run Task → Update course content.*
3. **Run one line:**

   ```bash
   bash scripts/update-course-content.sh
   ```

It only ever refreshes the lectures, the lab instructions and the README.
**Your own code is never touched**, and if you have edited one of those
files yourself it keeps your version and tells you so.

And the
**[module site](https://danielcregg.is-a.dev/object-oriented-computing/)**
is always current, whatever state your copy is in — so when in doubt,
read it there.
