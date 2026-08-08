---
marp: true
theme: ooc
paginate: true
transition: fade
title: "Encapsulation (reimagined)"
week: 7
topic: encapsulation
type: lecture
source: authored
---

<style>
/* Deck-local visual system: capsule, gates, pillars, visibility matrix —
   all drawn in CSS, no images. Base components:
   .mem/.callout/.legend/.kicker. */
section .mem {
  display: flex; margin: 34px 0 10px 0;
  font-family: 'Cascadia Code', Consolas, monospace;
}
section .mem .cell {
  min-width: 92px; padding: 15px 10px 13px; text-align: center;
  background: #FFFFFF; border: 2px solid #33698C;
  border-left-width: 1px; border-right-width: 1px;
  font-size: 25px; color: #1E2833; position: relative;
}
section .mem .cell:first-child { border-left-width: 2px; border-radius: 9px 0 0 9px; }
section .mem .cell:last-child { border-right-width: 2px; border-radius: 0 9px 9px 0; }
section .mem .cell .idx {
  position: absolute; top: -30px; left: 0; right: 0;
  font-size: 16px; color: #AFA893;
}
section .mem .cell.hot { background: #FDEFD9; border-color: #E76F00; color: #B94E00; font-weight: 600; }
section .mem .name {
  align-self: center; margin-right: 22px; font-size: 23px; color: #33698C; font-weight: 600;
}
section .mem .name::after { content: ' →'; color: #E76F00; }
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

/* title-slide capsule pill */
section .pill {
  display: inline-flex; align-self: flex-start; margin: 26px 0 8px 0;
  border-radius: 999px; overflow: hidden; border: 2px solid #7FB4D8;
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 21px;
}
section .pill .ph-l { background: #101B26; color: #9DB4C8; padding: 13px 24px 13px 30px; }
section .pill .ph-r { background: #E76F00; color: #FFFFFF; padding: 13px 30px 13px 24px; font-weight: 600; }

/* four-pillars strip — the canonical OOP roadmap */
section .pillars { display: flex; gap: 18px; margin: 34px 0 16px 0; }
section .pillar {
  flex: 1; display: flex; flex-direction: column;
  border: 2px solid #33698C; border-radius: 12px;
  background: #FFFFFF; padding: 18px 16px 14px; position: relative;
}
section .pillar .p-name {
  display: block; margin-bottom: 8px;
  font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 22px; font-weight: 600; color: #33698C;
}
section .pillar .p-line { display: block; flex: 1; font-size: 18px; color: #46536B; line-height: 1.35; }
section .pillar .p-wk {
  display: block; margin-top: 12px;
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 15px; color: #AFA893;
}
section .pillar.now {
  border-color: #E76F00; background: #FDEFD9;
  box-shadow: 0 4px 14px rgba(231, 111, 0, 0.18);
}
section .pillar.now .p-name { color: #B94E00; }
section .pillar.now .p-wk { color: #B94E00; }
section .pillar .p-chip {
  position: absolute; top: -14px; left: 14px;
  background: #E76F00; color: #FFFFFF; border-radius: 999px;
  font-size: 15px; font-weight: 600; padding: 2px 12px; letter-spacing: 0.03em;
}

/* the capsule: sealed private core, public gates on the boundary,
   outside code knocking at the gates */
section .cap-scene { display: flex; align-items: center; gap: 124px; margin: 34px 0 8px 0; }
section .cap-scene.solo { justify-content: center; gap: 0; }
section .cap-callers { display: flex; flex-direction: column; gap: 30px; flex: 0 0 318px; }
section .knock {
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 18px;
  background: #FFFFFF; border: 2px solid #33698C; border-radius: 10px;
  padding: 10px 14px; color: #1E2833; position: relative;
}
section .knock .k-note {
  display: block; margin-top: 4px;
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #1E7A34;
}
section .knock::after {
  content: '⟶'; position: absolute; right: -50px; top: 50%; transform: translateY(-50%);
  font-size: 30px; color: #33698C;
}
section .knock.bad { border-color: #C0392B; background: #FBEDEB; }
section .knock.bad .k-note { color: #C0392B; }
section .knock.bad::after { color: #C0392B; }
section .capsule {
  flex: 1; display: flex; align-items: center; gap: 30px;
  border: 3px solid #33698C; border-radius: 76px; background: #FFFFFF;
  padding: 26px 34px 26px 0; min-height: 230px;
}
section .cap-scene.solo .capsule { flex: 0 0 780px; padding-left: 0; margin-left: 58px; }
section .gates { display: flex; flex-direction: column; gap: 13px; margin-left: -58px; }
section .gate {
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 18px;
  background: #FDEFD9; border: 2px solid #E76F00; color: #B94E00; font-weight: 600;
  border-radius: 999px; padding: 8px 20px; white-space: nowrap; text-align: center;
}
section .gate.no {
  background: #F1EFEA; border: 2px dashed #8B8471; color: #8B8471; font-weight: 400;
}
section .core {
  flex: 1; background: #16222E; border-radius: 18px; padding: 18px 24px;
  color: #E8ECF1; font-family: 'Cascadia Code', Consolas, monospace; font-size: 19px;
}
section .core .core-cap {
  margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.08em;
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #7FB4D8;
}
section .core .fld { padding: 4px 0; }
section .core .fld::before { content: '• '; color: #E76F00; }

/* access-modifier visibility matrix */
section table.vmatrix {
  border-collapse: separate; border-spacing: 0;
  margin: 20px auto 10px auto; font-size: 23px;
}
section table.vmatrix th {
  background: #16222E; color: #E8ECF1; text-align: center;
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 19px; font-weight: 600;
  padding: 10px 24px; border: none;
}
section table.vmatrix th:first-child { border-radius: 12px 0 0 0; text-align: left; padding-left: 20px; }
section table.vmatrix th:last-child { border-radius: 0 12px 0 0; }
section table.vmatrix td {
  text-align: center; padding: 9px 24px;
  border: none; border-bottom: 1px solid #E5E1D6; background: #FFFFFF;
}
section table.vmatrix td.kw {
  font-family: 'Cascadia Code', Consolas, monospace; font-weight: 600;
  text-align: left; color: #1E2833; background: #F4F0E6; padding-left: 20px;
}
section table.vmatrix td.y { color: #1E7A34; background: #EAF6EC; font-weight: 700; }
section table.vmatrix td.n { color: #C0392B; background: #FBEDEB; font-weight: 700; }
section table.vmatrix tr:last-child td { border-bottom: none; }
section table.vmatrix tr:last-child td:first-child { border-radius: 0 0 0 12px; }
section table.vmatrix tr:last-child td:last-child { border-radius: 0 0 12px 0; }
section table.vmatrix .mchip {
  display: inline-block; margin-left: 12px; padding: 1px 10px; border-radius: 999px;
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 600;
}
section table.vmatrix .mchip.hero { background: #E76F00; color: #FFFFFF; }
section table.vmatrix .mchip.soon { background: #E7F0F7; color: #33698C; }
</style>

<!-- _class: lead -->
<!-- _paginate: false -->

<span class="kicker">// week 07 · encapsulation · object-oriented computing</span>

# Encapsulation

<div class="pill">
<span class="ph-l">private double balance</span><span class="ph-r">public deposit()</span>
</div>

One door. One guard.

---

<!-- Speaker notes: ~0:00. Cold open on the disaster. Read the assignment line slowly; let "no alarm" hang before advancing. -->

## A quiet line of code

- Your team ships a banking app. One class holds the money:

```java
public class BankAccount {
    public String owner;
    public double balance;     // public: anyone, anywhere, can touch it
}
```

* It works. For months. Then, one Tuesday, deep inside a million-line codebase:

<!-- no-compile -->
```java
account.balance = -1_000_000;   // some file. some line. some Tuesday.
```

* No compile error. No exception. No log entry. **The money is just… gone.**

---

## Who do you call?

- Somewhere, one line wrote a poisoned value. Your job: find it.
* You search the codebase for `.balance` — **40,000 matches**.
* Any one of them had the power. **Every line is a suspect.**
* And nothing recorded the change, because *assignment is not an event* — no code runs when a public field is written.

<div class="callout"><strong>The wish:</strong> what if the field were unreachable — and every change had to walk through <strong>one method</strong>? One door. One guard. One place to put a breakpoint.</div>

---

## The idea — the capsule

- Seal the data inside the class. Punch **gates** through the wall — public methods — and guard them.

<div class="cap-scene">
<div class="cap-callers">
<div class="knock">app.deposit(50.0);<span class="k-note">knocks at a gate — allowed in</span></div>
<div class="knock bad">app.balance = -1;<span class="k-note">no gate there — refused: compile error</span></div>
</div>
<div class="capsule">
<div class="gates">
<div class="gate">deposit(double)</div>
<div class="gate">withdraw(double)</div>
<div class="gate">getBalance()</div>
</div>
<div class="core">
<div class="core-cap">private — sealed core</div>
<div class="fld">double balance</div>
<div class="fld">String owner</div>
</div>
</div>
</div>

<p class="legend">private fields = the sealed core · public methods = guarded gates · outside code knocks — it never reaches in</p>

---

## Agenda

- The four pillars of OOP — your map for everything ahead
- What encapsulation means: **bundle** + **hide**
- Access modifiers — Java's four visibility settings
- The recipe: private fields, public getters and setters
- Three powers you gain: the guard, one-way glass, the disguise
- `BankAccount`, done properly — and a leak to avoid
- Why it pays: protection, flexibility, maintainability

---

<!-- Speaker notes: ~0:07. This strip is the canonical four-pillars overview. Spend a full minute here. -->

## The four pillars of OOP

- Everything in OOP hangs off **four big ideas**:

<div class="pillars">
<div class="pillar now"><span class="p-chip">this lecture</span><span class="p-name">Encapsulation</span><span class="p-line">objects guard their own data behind a small public face</span><span class="p-wk">pillar 1</span></div>
<div class="pillar"><span class="p-name">Inheritance</span><span class="p-line">build new classes on top of existing ones</span><span class="p-wk">pillar 2</span></div>
<div class="pillar"><span class="p-name">Polymorphism</span><span class="p-line">one method call, many different behaviours</span><span class="p-wk">pillar 3</span></div>
<div class="pillar"><span class="p-name">Abstraction</span><span class="p-line">expose the what, hide the how</span><span class="p-wk">pillar 4</span></div>
</div>

- Encapsulation goes **first** because the other three build on classes that protect their own state.
- The strip returns as each pillar arrives — watch the highlight move right.

---

## What "encapsulation" means

- In English: to *encapsulate* is to seal something inside a capsule.
- In OOP it is **two moves**, made together:

* **Bundle** — keep the data (fields) and the code that operates on it (methods) in one unit: the class.
* **Hide** — make the fields `private`, so the *only* way in is through the methods you chose to expose.

<div class="callout"><strong>Definition for your notes:</strong> encapsulation is bundling state and behaviour into a single class while restricting direct access to the object's internals. The hiding half has its own name — <strong>data hiding</strong>.</div>

---

<!-- Speaker notes: ~0:12. The matrix is a reference students will screenshot — walk it row by row, top (strictest) to bottom (loosest). -->

## Access modifiers — the visibility dial

- Java enforces the capsule with **keywords**. Every member gets one of four visibility levels:

<table class="vmatrix">
<thead>
<tr><th>modifier</th><th>same class</th><th>same package</th><th>subclass<br>(other pkg)</th><th>everywhere</th></tr>
</thead>
<tbody>
<tr><td class="kw">private<span class="mchip hero">your default</span></td><td class="y">✓</td><td class="n">✗</td><td class="n">✗</td><td class="n">✗</td></tr>
<tr><td class="kw">(default)</td><td class="y">✓</td><td class="y">✓</td><td class="n">✗</td><td class="n">✗</td></tr>
<tr><td class="kw">protected<span class="mchip soon">inheritance</span></td><td class="y">✓</td><td class="y">✓</td><td class="y">✓</td><td class="n">✗</td></tr>
<tr><td class="kw">public</td><td class="y">✓</td><td class="y">✓</td><td class="y">✓</td><td class="y">✓</td></tr>
</tbody>
</table>

<p class="legend">✓ = code there may touch the member directly · ✗ = compile error · (default) = you wrote no keyword at all</p>

---

## Which one do I write?

- **`private`** — from today, your default for **every field**. This is the capsule wall.
- **`public`** — for the methods you *mean* the world to call: the gates.
- **`protected`** — also visible to subclasses. Meaningless until **inheritance** arrives.
- **(default)** — package-only; what you get by forgetting a keyword. Treat it as an accident, not a choice.

<div class="callout"><strong>House rule:</strong> start everything <code>private</code>; promote to <code>public</code> only with a reason you can say out loud.</div>

---

## Predict: does this compile?

<!-- no-compile -->
```java
class Account {
    private double balance;
}

class Main {
    public static void main(String[] args) {
        Account a = new Account();
        a.balance = 50.0;                  // ?
    }
}
```

* **No** — `balance has private access in Account`. The compiler refuses the assignment.
* That is the hook resolved: the 3 a.m. mystery write is now a **red underline before the program even runs**.
* Remember: errors live at compile time or run time. `private` *drags this bug from run time to compile time* — from "found by a victim, weeks later" to "found by you, instantly".

---

<!-- Speaker notes: ~0:20. Mechanics movement. The recipe is mechanical on purpose — tempo up, this is muscle memory. -->

## The recipe

- Two steps, the same every time:

```java
public class Student {
    private String email;                  // 1. make every field private

    public String getEmail() {             // 2. a public getter to read it…
        return email;
    }

    public void setEmail(String email) {   //    …and a public setter to change it
        this.email = email;
    }
}
```

- `this.email` is the field; plain `email` is the parameter. `this.` breaks the tie when the names clash.

---

## From the outside

- Callers never see the field — they knock:

<!-- no-compile -->
```java
Student s = new Student();          // Student as defined on the last slide
s.setEmail("ada@example.com");      // write — through the gate
System.out.println(s.getEmail());   // read  — through the gate
```

- The ritual names: `get` / `set` + the field name, capitalised — `getEmail`, `setEmail`.
- Formal words you'll meet in docs and exams: getters are **accessors**, setters are **mutators**.
- Your IDE writes these for you: right-click → *Source Action…* → *Generate Getters and Setters*.

---

<!-- Speaker notes: ~0:26. The heart of the lecture. Voice the objection with full sincerity — half the room is already thinking it. -->

## The fair objection

- Look at that setter again. It checks nothing. It just… assigns.

* "So it's a public field with **extra steps**?"
* Fair — *today*. But a plain setter is an **empty checkpoint**: the day you need rules, you staff it — and not one caller has to change.
* A public field can never be upgraded. A gate can.
* Three powers you get from routing everything through methods: **the guard**, **one-way glass**, **the disguise**.

---

## Power 1 — the guard (validation)

- House rule: player usernames hold at most **10 characters**. Enforce it *where the data lives*:

```java
public class Player {
    private String username;

    public String getUsername() { return username; }

    public void setUsername(String username) {
        if (username.length() > 10) {
            this.username = username.substring(0, 10);   // too long? keep the first 10
        } else {
            this.username = username;
        }
    }
}
```

- Garbage is stopped **at the door**. No code anywhere can put an 11-character name in that field.

---

## Predict: what prints?

<!-- no-compile -->
```java
Player p = new Player();                // Player from the last slide
p.setUsername("theRedRhino");           // 11 characters
System.out.println(p.getUsername());
```

* `theRedRhin` — the guard trimmed the 11th character on the way in.
* The caller wrote one thing; the object stored the **legal version**. No `if` at the call site.
* That `if` exists **once**, inside the setter — not 40,000 times across the codebase.

---

## Power 2 — one-way glass (read-only)

- A public field is all-or-nothing: whoever can read it can **write** it.
- Methods split the two. Provide the getter. **Withhold the setter.**

```java
public class Odometer {
    private int km;

    public int getKm() { return km; }          // the world may look…

    public void drive(int distance) {          // …but change arrives only
        if (distance > 0) { km += distance; }  //    through the rules
    }
}
```

- `km` is readable everywhere, writable nowhere — it can only ever count up, legally.

---

## Power 3 — the disguise (swap the internals)

- Version 1 stores middle names as one `String`:

```java
public class Person {
    private String middleNames;                    // "Mary Alice"

    public String getMiddleNames() { return middleNames; }

    public void setMiddleNames(String middleNames) {
        this.middleNames = middleNames;
    }
}
```

- The **public face** is just two signatures: `String getMiddleNames()` and `void setMiddleNames(String)`.
- Requirements change: we now need the names individually. Time to gut the insides…

---

## The disguise (continued)

- Same face, new insides:

```java
public class Person {
    private String[] middleNames = {};             // now an array!

    public String getMiddleNames() {
        return String.join(" ", middleNames);      // array → one String, on the way out
    }

    public void setMiddleNames(String names) {
        this.middleNames = names.trim().split("\\s+");   // String → array, on the way in
    }
}
```

- Same two signatures — so **every caller compiles and runs, unchanged and unaware**.
- A public field could never do this: its *type* is its contract. A method's contract is only its signature.

---

<!-- Speaker notes: ~0:38. Capstone movement. Slow down: this class is the lab exercise and the exam staple. -->

## `BankAccount`, done properly

<style scoped>
section pre { font-size: 17px !important; line-height: 1.25 !important; padding: 10px 18px !important; margin: 6px 0 !important; }
section pre code { font-size: 17px !important; line-height: 1.25 !important; }
</style>

- Constructor sets the opening state; getters expose reads; **guards** rule every write:

```java
public class BankAccount {
    private String owner;
    private double balance;

    public BankAccount(String owner, double openingBalance) {
        this.owner = owner;
        this.balance = openingBalance;
    }

    public String getOwner()   { return owner;   }
    public double getBalance() { return balance; }

    public void deposit(double amount) {
        if (amount > 0) { balance += amount; }                    // guard: no fake deposits
    }
    public void withdraw(double amount) {
        if (amount > 0 && amount <= balance) { balance -= amount; }   // guard: no overdrafts
    }
}
```

---

## Look closer — there is no `setBalance`

<div class="cap-scene solo">
<div class="capsule">
<div class="gates">
<div class="gate">deposit(double)</div>
<div class="gate">withdraw(double)</div>
<div class="gate">getBalance()</div>
<div class="gate no">setBalance — never built</div>
</div>
<div class="core">
<div class="core-cap">private — sealed core</div>
<div class="fld">double balance</div>
<div class="fld">String owner</div>
</div>
</div>
</div>

- The most important gate is the one you **didn't build**: balance moves *only* through legal transactions.
- Getters and setters are the common case, not the rule. The rule: **public methods = the operations you intend to allow** — nothing more.

---

## Predict: what prints?

- Using `BankAccount` from two slides back:

<!-- no-compile -->
```java
BankAccount acct = new BankAccount("Anna", 100.00);
acct.deposit(-50);
acct.withdraw(500);
acct.deposit(25);
System.out.println(acct.getBalance());
```

* `125.0` — walk it: `deposit(-50)` fails the `amount > 0` guard → still `100.0`.
* `withdraw(500)` fails `amount <= balance` → still `100.0`.
* `deposit(25)` passes → `125.0`. The guards never announced themselves — the object simply **stayed valid**.

---

<!-- Speaker notes: ~0:46. The twist. Give them real time to commit to 70 — the wrong answer is the whole lesson. -->

## Predict: it's private, so it's safe… right?

```java
class Gradebook {
    private int[] scores = {70, 80, 90};
    public int[] getScores() { return scores; }
}

class Main {
    public static void main(String[] args) {
        Gradebook g = new Gradebook();
        int[] view = g.getScores();
        view[0] = 0;                           // scribble on what the getter gave us
        System.out.println(g.getScores()[0]);  // ?
    }
}
```

* Prints **0**. The field was private — and the caller changed it anyway.
* You know why: an array variable is an **arrow**. The getter handed out *the arrow to the sealed core*.

---

## Patch the leak — hand out copies, not arrows

<div class="mem">
<div class="name">scores</div>
<div class="name">view</div>
<div class="cell hot"><span class="idx">0</span>0</div>
<div class="cell"><span class="idx">1</span>80</div>
<div class="cell"><span class="idx">2</span>90</div>
</div>

<p class="legend">the leak: two arrows, ONE array — "view" reaches straight into the private boxes</p>

```java
import java.util.Arrays;

public class Gradebook {
    private int[] scores = {70, 80, 90};

    public int[] getScores() {
        return Arrays.copyOf(scores, scores.length);   // new boxes — the core stays sealed
    }
}
```

- A capsule is only sealed if its gates never hand out **arrows to the inside**. Return copies of mutable state — this is called a *defensive copy*.

---

<!-- Speaker notes: ~0:52. Landing movement — backward link to Strings, forward link to inheritance, then benefits and out. -->

## You've been trusting a capsule for weeks

- `String` is encapsulation taken to the limit: its characters live in a private array — and there is **no setter at all**.

```java
String name = "ada";
String loud = name.toUpperCase();

System.out.println(name);   // ada — the original is untouched
System.out.println(loud);   // ADA — every "change" is a new String
```

- That's *why* Strings never change: **immutable = a capsule with no write gates**.
- No guards to get wrong, nothing to leak — which is what makes Strings safe to share anywhere. Sealing data isn't paranoia; it's what makes objects trustworthy.

---

## What the wall buys you

- **Protection** — the guard: invalid state is stopped at the door, once, where the data lives.
- **Flexibility** — the disguise: internals can be rebuilt while every caller compiles on, unaware.
- **Maintainability** — one address: when `balance` is wrong, the suspect list is *one class*, not 40,000 lines.
* Next pillar: the wall grows a family entrance — **inheritance** lets one class build on another, and `protected`, the modifier we parked today, finally earns its row in the matrix.

---

## Summary

- Encapsulation = **bundle** state and behaviour into a class + **hide** the state: `private` fields behind a small public face — *data hiding*.
- Four visibility levels: `private` → (default) → `protected` → `public`. Fields start `private`, always; `protected` waits for inheritance.
- The recipe: private fields, public `getX()` / `setX(...)`, with `this.field` to out-rank a clashing parameter name.
- Plain getters and setters are empty checkpoints you staff later: the **guard** validates, **one-way glass** gives a getter and withholds the setter, the **disguise** swaps internals behind unchanged signatures.
- Sometimes the best gate is none at all — `deposit`/`withdraw` with no `setBalance` — and gates must never hand out arrows to private arrays: return **defensive copies**.
- Immutable `String` is the extreme case: a sealed capsule with no write gates — encapsulation at maximum.
