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
3. Commit and push as you work, like any repo.

## Doing a lab

Open the lab's folder below, read its `README.md` (right-click →
*Open Preview* in VS Code), and follow it. Each folder already has the
Java package and a `Main.java` with a run button (▶) — add your classes
beside it.

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

## Getting the latest lectures and lab instructions

Your copy doesn't update itself, so it can drift behind if a lab or a
lecture is corrected mid-semester. Three ways to catch up, easiest first:

1. **Do nothing.** In a Codespace it refreshes automatically every time you
   open the workspace.
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
