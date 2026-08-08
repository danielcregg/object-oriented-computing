---
marp: true
theme: ooc
paginate: true
transition: fade
title: "Java Strings (reimagined)"
week: 6
topic: strings
type: lecture
source: authored
---

<style>
/* Deck-local visual system: variables-and-arrows heap pictures, drawn in CSS — no images. */
section .heap {
  display: flex; align-items: center; gap: 18px; flex-wrap: wrap;
  margin: 24px 0 10px 0;
  font-family: 'Cascadia Code', Consolas, monospace;
}
section .heap.tagged { margin-top: 48px; }
section .vname { font-size: 23px; color: #33698C; font-weight: 600; }
section .vname::after { content: ' →'; color: #E76F00; }
section .obj {
  position: relative; min-width: 60px; text-align: center;
  padding: 14px 24px 12px; background: #FFFFFF;
  border: 2px solid #33698C; border-radius: 12px;
  font-size: 25px; color: #1E2833;
}
section .obj .tag {
  position: absolute; top: -28px; left: 4px;
  font-size: 15px; color: #AFA893; white-space: nowrap; letter-spacing: 0.03em;
}
section .obj.fresh { background: #FDEFD9; border-color: #E76F00; color: #B94E00; font-weight: 600; }
section .obj.dead { background: #F4F0E6; border: 2px dashed #AFA893; color: #8B8471; }
section .obj .grew { background: #FDEFD9; color: #B94E00; border-radius: 6px; padding: 1px 5px; }
section .pool {
  display: flex; align-items: center; gap: 24px;
  position: relative; padding: 36px 30px 22px;
  background: #EDF3F8; border: 2px dashed #7FA8C4; border-radius: 16px;
}
section .pool::before {
  content: 'String pool'; position: absolute; top: 9px; left: 18px;
  font-size: 15px; color: #33698C; letter-spacing: 0.07em;
}
section .op { font-size: 19px; color: #B94E00; white-space: nowrap; }
section .legend { font-size: 17px; color: #8B8471; margin-top: 2px; }
section .callout {
  border-left: 4px solid #E76F00; background: #F4F0E6;
  padding: 12px 20px; margin: 16px 0; color: #46536B; font-size: 0.92em;
}
section .callout strong { color: #B94E00; }
section .kicker {
  font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 17px; color: #E76F00; letter-spacing: 0.05em;
}
section.lead .obj { background: rgba(255,255,255,0.07); border-color: #7FB4D8; color: #F4F1E8; }
section.lead .obj.dead { background: transparent; border-color: #55707F; color: #8FA0AF; }
section.lead .vname { color: #7FB4D8; }
section.lead .op { color: #F0B26B; }
</style>

<!-- _class: lead -->
<!-- _paginate: false -->

<span class="kicker">// week 06 · strings · object-oriented computing</span>

# Java Strings

<div class="heap">
<div class="vname">s</div>
<div class="obj">"hello"</div>
<div class="op">— toUpperCase() →</div>
<div class="obj dead">"HELLO"</div>
</div>

The object you can never change.

---

<!-- Speaker notes: ~0:00. Cold open on the mystery. Take a show of hands before revealing; most of the room will say HELLO. Let the wrong answer land. -->

## A tiny mystery

- You've used Strings since your very first `"Hello, World!"` — day 1, line 1.
- Time to find out what they've been hiding. Three lines, no tricks — **what prints?**

```java
String s = "hello";
s.toUpperCase();
System.out.println(s);
```

* `hello` — still lower-case. The call changed… nothing?
* Not quite: `toUpperCase()` **worked**. Somewhere, a `"HELLO"` now exists. So where did it go?
* **Nothing you ever do to a String changes it.** This hour: why that's true, why it's genius, and when it bites.

---

## A String is an object

- The old rule, still undefeated: a variable of object type holds an **arrow**, not the thing.
- `String` is a **class** (capital S, lives in `java.lang`, imported for free) — not a primitive.

```java
String s = "hello";
```

<div class="heap tagged">
<div class="vname">s</div>
<div class="obj"><span class="tag">a String object, on the heap</span>"hello"</div>
</div>

<p class="legend">one variable · one arrow · one object holding the characters</p>

- `int n = 5` puts the **value** in the box; `String s` puts an **arrow** in the box.
- Inside the object, the characters sit in an **array** (arrays really are everywhere).

---

## Agenda

- Creating Strings — literals, `new`, and the pool between them
- `==` vs `.equals()` — arrows vs text
- Immutability — the copy factory, and catching arrows
- Why immutability is brilliant, and what it costs
- StringBuilder — the workshop: append, insert, delete, reverse
- Choosing: String vs StringBuilder vs StringBuffer

---

<!-- Speaker notes: ~0:05. Creation & pool movement. The two creation forms LOOK interchangeable — build the itch here, scratch it with the diagram on the next slide. -->

## Two ways to make a String

```java
String a = "hello";                // the literal — day-1 syntax
String b = "hello";                // the same literal again
String c = new String("hello");    // 'new', like any other object
```

- All three hold the text `hello`. Same characters, same methods, same behaviour…
- (Concatenation, `char[]`s and StringBuilders make Strings too — these two forms are the ones with a story.)

* …so surely that's three variables, three arrows, three objects?
* **Count again: two objects.** Where the third went is the next slide.

---

## The String pool

- Programs repeat text *constantly* — so the JVM keeps literals in a **pool** and recycles them.

<div class="heap">
<div class="vname">a</div>
<div class="vname">b</div>
<div class="pool">
<div class="obj">"hello"</div>
</div>
</div>

<div class="heap tagged">
<div class="vname">c</div>
<div class="obj fresh"><span class="tag">a second "hello" — built by new, outside the pool</span>"hello"</div>
</div>

<p class="legend">three variables · two objects — the pool recycles literals; new refuses, every time</p>

- `a` and `b` are aliasing on purpose: **two arrows, one shared object**.
- `new String(...)` always builds a fresh object — even with an identical String sitting in the pool.

---

## Predict: what prints?

```java
String a = "hello";
String b = "hello";
String c = new String("hello");

System.out.println(a == b);
System.out.println(a == c);
System.out.println(a.equals(c));
```

* `true` — `==` compares **arrows**, and `a`, `b` share the pooled object.
* `false` — `c` is a different object: identical text, different arrow.
* `true` — `.equals()` reads the actual **characters**.

---

## `==` lies convincingly

- `==` asks *same object?* — it compares arrows. `.equals()` asks *same text?* — it walks the characters. With Strings, you nearly always mean the text.
- The pool is what makes `==` **dangerous** — on literals it accidentally works:

```java
String cmd = "quit";
if (cmd == "quit") { System.out.println("bye"); }   // works… here
```

- Real input — typed by a user, read from a file, `split` from a line — is **never pooled**. Same text, different object: `==` goes quietly `false` forever.

<div class="callout"><strong>The rule:</strong> <code>==</code> for primitives, <code>.equals()</code> the moment either side is an object. A bug that passes your tests is the worst kind — this one always does.</div>

---

<!-- Speaker notes: ~0:17. Immutability movement — the heart of the hour. Let the dead HELLO box sit on screen; that picture IS the lecture. -->

## Immutability — the copy factory

- A String can **never be edited** — that's *immutability*. Not by you, not by any method.
- So what do "modifying" methods do? They're **factories**: each manufactures a *new* String and returns the arrow to it.

```java
String s = "hello";
s.toUpperCase();     // a new String is built — and returned to nobody
```

<div class="heap tagged">
<div class="vname">s</div>
<div class="obj">"hello"</div>
<div class="op">— toUpperCase() →</div>
<div class="obj dead"><span class="tag">brand-new String — nobody caught it</span>"HELLO"</div>
</div>

<p class="legend">s never moved · "hello" never changed · "HELLO" is already garbage</p>

* **Mystery solved:** the opening print showed `hello` because `s` still points exactly where it always did.

---

## Catch the arrow

- You never "change a String" — you **keep the new one**. Reassignment aims your arrow at the factory's output:

```java
String s = "hello";
s = s.toUpperCase();      // catch the returned String
System.out.println(s);    // HELLO
```

<div class="heap tagged">
<div class="vname">s</div>
<div class="obj fresh">"HELLO"</div>
<div class="obj dead"><span class="tag">no arrows left — the garbage collector reclaims it</span>"hello"</div>
</div>

<p class="legend">the arrow moved; no String changed — the old one is collected, the new one is caught</p>

- Before every String call, ask one question: **"it returns a new String — am I catching it?"**

---

## Every method obeys the factory rule

```java
String s = "  Java Strings  ";
int      n       = s.length();          // 16 — just a number
char     first   = s.charAt(2);         // 'J' — just a char
String   trimmed = s.trim();            // NEW String: "Java Strings"
String   loud    = trimmed.toUpperCase();   // NEW String: "JAVA STRINGS"
char[]   letters = trimmed.toCharArray();   // the chars, as an array
String[] words   = trimmed.split(" ");      // {"Java", "Strings"}
```

- Read the return types: nothing is `void`, nothing edits `s` — reads hand back values, "edits" hand back **new Strings**.

<div class="callout"><strong>Spot the echo:</strong> arrays carry <code>.length</code> — a field, no brackets. Strings answer <code>.length()</code> — a method call. Mixing them up is a rite of passage; today you've met both sides.</div>

---

## Predict: what prints?

```java
String a = "ha";
String b = a;              // aliasing again: two arrows, one object
a = a + "!";
System.out.println(a);
System.out.println(b);
```

* `ha!` — `+` ran the factory: a new String, and `a`'s arrow moved to it.
* `ha` — `b` still points at the original… which **cannot have changed**.
* The array aliasing trap (`yours[0] = 99` wrecking `mine`) **cannot happen** with Strings — sharing an object nobody can edit is perfectly safe.

---

## Why Java chose immutability

- You just proved the big one: **sharing is always safe** — any number of arrows, zero surprises.
- **It's what makes the pool possible** — recycling `"hello"` between strangers only works if neither can deface it.
- **Thread safety** — the hardest bugs are two threads editing one object at once; for Strings, the possibility simply doesn't exist.
- **Security** — file paths, usernames and class names are Strings; *check-then-use* is only sound if nothing can change between the check and the use.
- **Speed, where it counts** — a String computes its `hashCode()` once and caches it forever (hash maps love this).

---

## The bill: `+` in a loop

```java
String result = "";
for (int i = 0; i < 4; i++) {
    result += "ha";       // factory! copy everything so far, add "ha"
}
```

<div class="heap">
<div class="obj dead">""</div>
<div class="obj dead">"ha"</div>
<div class="obj dead">"haha"</div>
<div class="obj dead">"hahaha"</div>
<div class="vname">result</div>
<div class="obj fresh">"hahahaha"</div>
</div>

<p class="legend">four Strings built and binned to make one — the loop is laughing at you</p>

- Every `+=` copies everything so far, then appends — the work grows with the **square** of the length.
- At 10,000 rounds: ~10,000 corpses for the garbage collector, ~**100 million** characters copied.

---

<!-- Speaker notes: ~0:32. StringBuilder movement — history first (it explains the odd names), then the fix. Tempo up; the ideas are small after the pool. -->

## 1996: Java ships two string classes

- Java 1.0 valued *safe by default*, so text came as a matched pair:
- **`String`** — immutable, poolable, share-without-fear. The default.
- **`StringBuffer`** — the mutable escape hatch, **synchronized**: every method takes a lock, so threads can't collide mid-edit.

* The catch: locks cost time — and **most code is single-threaded**, paying for protection it never uses.
* **Java 5 (2004): `StringBuilder`** — StringBuffer's exact API with the locks deleted. Same code, noticeably faster.
* The modern rule writes itself: **builder by default**; buffer only when threads truly share one.

---

## StringBuilder — the workshop

- A `StringBuilder` is a **mutable** sequence of characters: its methods **edit this object**. No factory, no copies.

```java
StringBuilder sb = new StringBuilder("hello");
sb.append(" world");              // edits sb itself — nothing new to catch
System.out.println(sb);           // hello world
System.out.println(sb.length());  // 11 — it genuinely grew
```

<div class="heap tagged">
<div class="vname">sb</div>
<div class="obj"><span class="tag">StringBuilder — one object, edited in place</span>hello<span class="grew"> world</span></div>
</div>

<p class="legend">the same box before and after — append wrote into spare capacity</p>

- Under the hood: a resizable `char` array — the "bigger array and copy" chore, automated.

---

## The loop, rebuilt

```java
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 10000; i++) {
    sb.append("ha");              // same object, every single round
}
String result = sb.toString();    // ONE String, minted at the finish line
```

- One object, edited 10,000 times; **one** String produced at the end.
- The pattern to memorise: **build in a `StringBuilder`, finish with `toString()`** — then hand the String to the rest of your program.
- `toString()` matters: a builder *is not* a String, and code that wants a String wants the real thing.

---

## The workshop toolbox

- State after every line in the comments — one object throughout:

```java
StringBuilder sb = new StringBuilder("Java Strings");
sb.append("!");            // Java Strings!
sb.insert(0, "OOC: ");     // OOC: Java Strings!
sb.delete(0, 5);           // Java Strings!
sb.setCharAt(0, 'L');      // Lava Strings!
System.out.println(sb);    // Lava Strings!
```

- Ranges are half-open — `delete(0, 5)` removes indexes `0..4`, exactly like your `i < 5` loops.

---

## The workshop toolbox (continued)

```java
StringBuilder sb = new StringBuilder("stressed");
sb.reverse();                              // desserts
String done = sb.toString();               // back to String-land

StringBuilder chain = new StringBuilder();
chain.append("Total: ").append(4 + 3).append(" laps");
System.out.println(chain);                 // Total: 7 laps
```

- `append` takes anything — Strings, chars, ints, booleans — and converts for free.
- It also **returns the builder**, so calls chain. For years `javac` compiled every `"a" + b + "c"` into exactly this — one expression was always fine; a *loop* of them never was.

---

## Predict: what prints?

```java
String s = "hello";
s.toUpperCase();
System.out.println(s);

StringBuilder sb = new StringBuilder("hello");
sb.append(" world");
sb.reverse();
System.out.println(sb);
```

* `hello` — the opening mystery, now no mystery: the upper-case String was manufactured and dropped.
* `dlrow olleh` — both calls **edited the one object in place**; nothing needed catching.
* If you can explain *why the two halves differ*, this hour is yours.

---

<!-- Speaker notes: ~0:45. Choosing movement — receipts, then the family table, then the decision. This is the part they quote back at you in the lab. -->

## The receipts

| Building 10,000 pieces of text | `String` `+` loop | `StringBuilder` |
|---|---|---|
| Objects created | ~10,000 dead Strings | 1 builder + 1 final String |
| Character copies | ~100,000,000 — square law | ~10,000 — each char once |
| Typical time | ~1000 ms | **~1 ms** |

- Not micro-optimisation — assembled text is everywhere: CSV exports, HTML pages, JSON, logs.
- A lone `+` expression is compiled into efficient building **for you**. `+` is innocent; **`+` inside a loop is the crime**.

---

<!-- _class: centered-table -->

## Three classes, one job

| | `String` | `StringBuilder` | `StringBuffer` |
|---|---|---|---|
| Born | Java 1.0 (1996) | Java 5 (2004) | Java 1.0 (1996) |
| Mutable | never | yes | yes |
| Thread-safe | yes — immutable | no | yes — synchronized |
| Editing speed | slow — copy factory | fastest | slower — locking tax |
| Reach for it | almost all text | building text | shared building (rare) |

- One idea, three trade-offs: the immutable default, the fast workshop, the thread-safe veteran.

---

## Which one, when

- **`String`** — the default: text you read, pass, compare, store. This is 95% of your code.
- **`StringBuilder`** — the moment you're *assembling*: loops, accumulation, reports. Build, then `toString()`, then back to String-land.
- **`StringBuffer`** — several threads hammering one shared builder. If you're not sure that's you — it isn't. You'll meet it in legacy code, not in anything new.

* The whole decision in one line: **building in steps? Builder. Otherwise: String.**

---

## The classic mistakes — now spot them

```java
String s = "hello";
s.toUpperCase();               // ① uncaught arrow — s is still "hello"
if (s == "hello") { }          // ② true today (pool!), false when real input arrives
String csv = "";
for (int i = 0; i < 9999; i++) {
    csv += i + ",";            // ③ the square-law loop strikes again
}
```

- ① **Catch the arrow** — String methods return; they never edit.
- ② **`.equals()` for text, always** — `==` passing on literals is luck, not correctness.
- ③ **Builder in loops** — `csv` here is exactly what `StringBuilder` was born for.
- Honourable mentions: forgetting `toString()` after building, and grabbing `StringBuffer` "to be safe" — a locking tax with no threads to protect you from.

---

<!-- Speaker notes: ~0:54. Land the design lesson — this is the bridge to encapsulation. Slow right down for the last two slides. -->

## The bigger idea

- Immutability is not a quirk — it's a **design decision**. Java's designers *removed* the ability to change a String, and every guarantee this hour — safe sharing, the pool, thread safety — fell out of that one choice.
- **Deciding what may change is designing.** So far, you've only consumed that decision.
- The natural next step: **encapsulation** — making that choice for your *own* classes: `private` fields, controlled access, no changes you didn't authorise.
- You've been driving the JDK's best-designed class all along. Now you learn to build one.

---

## Summary

- A `String` is an object: the variable holds an **arrow**; literals share one pooled object, `new String(...)` always builds a fresh one.
- `==` compares arrows, and the pool makes it *sometimes accidentally true* — compare text with `.equals()`, every time.
- Strings are **immutable**: every "modifying" method is a factory returning a new String — catch the arrow (`s = s.toUpperCase()`) or lose the result.
- Immutability buys safe sharing, the pool, thread safety and cached hashes; the bill arrives as square-law copying when you `+` in a loop.
- `StringBuilder` (Java 5) is the mutable workshop: `append` / `insert` / `delete` / `reverse` edit one object; finish with `toString()`. `StringBuffer` is the older synchronized sibling — rare.
- A lone `+` is fine; **`+` in a loop is the crime**. Building in steps? Builder. Otherwise: String.
