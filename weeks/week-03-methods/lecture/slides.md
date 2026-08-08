---
marp: true
theme: ooc
paginate: true
transition: fade
title: "Java Methods"
week: 3
topic: methods
type: lecture
source: authored
---

<style>
/* Deck-local visual system: labelled anatomy, stack frames, paste cards,
   memory boxes — all drawn in CSS, no images. */
section .kicker {
  font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 17px; color: #E76F00; letter-spacing: 0.05em;
}
section .legend { font-size: 17px; color: #8B8471; margin-top: 2px; }
section .callout {
  border-left: 4px solid #E76F00; background: #F4F0E6;
  padding: 12px 20px; margin: 16px 0; color: #46536B; font-size: 0.92em;
}
section .callout strong { color: #B94E00; }

/* memory boxes (house style, borrowed from the arrays deck) */
section .mem {
  display: flex; margin: 32px 0 6px 0;
  font-family: 'Cascadia Code', Consolas, monospace;
}
section .mem .cell {
  min-width: 92px; padding: 11px 10px 9px; text-align: center;
  background: #FFFFFF; border: 2px solid #33698C;
  border-left-width: 1px; border-right-width: 1px;
  font-size: 24px; color: #1E2833; position: relative;
}
section .mem .cell:first-child { border-left-width: 2px; border-radius: 9px 0 0 9px; }
section .mem .cell:last-child { border-right-width: 2px; border-radius: 0 9px 9px 0; }
section .mem .cell .idx {
  position: absolute; top: -28px; left: 0; right: 0;
  font-size: 16px; color: #AFA893;
}
section .mem .cell.hot { background: #FDEFD9; border-color: #E76F00; color: #B94E00; font-weight: 600; }
section .mem .name {
  align-self: center; margin-right: 22px; font-size: 22px; color: #33698C; font-weight: 600;
}
section .mem .name::after { content: ' →'; color: #E76F00; }

/* anatomy: one declaration cut into labelled tokens */
section .anat {
  display: flex; gap: 10px; align-items: stretch;
  margin: 48px 0 6px 0; font-family: 'Cascadia Code', Consolas, monospace;
}
section .anat.arow2 { margin-top: 18px; margin-bottom: 44px; }
section .anat .tok {
  position: relative; padding: 9px 15px 8px; font-size: 25px;
  background: #FFFFFF; border: 2px solid #8B94A3; border-radius: 9px; color: #1E2833;
}
section .anat .tok .albl {
  position: absolute; top: -32px; left: 50%; transform: translateX(-50%);
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  font-size: 15px; white-space: nowrap; color: #8B8471; letter-spacing: 0.03em;
}
section .anat .tok.ret { border-color: #E76F00; background: #FDEFD9; color: #B94E00; }
section .anat .tok.ret .albl { color: #B94E00; font-weight: 600; }
section .anat .tok.nm { border-color: #33698C; background: #33698C; color: #FFFFFF; font-weight: 600; }
section .anat .tok.nm .albl { color: #33698C; font-weight: 600; }
section .anat .tok.par { border-style: dashed; border-color: #33698C; }
section .anat .tok.bod .albl { top: auto; bottom: -32px; }

/* call-stack snapshots: frames that push and pop */
section .stackwrap { display: flex; gap: 18px; align-items: flex-end; margin: 30px 0 6px 0; }
section .stackshot { display: flex; flex-direction: column; justify-content: flex-end; gap: 7px; min-width: 240px; }
section .frame {
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 21px;
  background: #FFFFFF; border: 2px solid #33698C; border-radius: 8px;
  padding: 7px 14px 6px; text-align: center; color: #1E2833;
}
section .frame .fl {
  display: block; font-size: 14px; color: #8B8471; font-weight: 400;
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}
section .frame.live { background: #FDEFD9; border-color: #E76F00; color: #B94E00; font-weight: 600; }
section .frame.gone { border-style: dashed; border-color: #AFA893; color: #AFA893; background: transparent; }
section .frame.gone .fl { color: #AFA893; }
section .scap { text-align: center; font-size: 16px; color: #8B8471; margin-top: 3px; }
section .snext { align-self: center; color: #E76F00; font-size: 30px; padding-bottom: 42px; }

/* paste cards: the same block living in three places */
section .pasterow { display: flex; gap: 20px; margin: 16px 0 6px 0; }
section .pcard {
  flex: 1; border: 2px solid #33698C; border-radius: 10px; background: #FFFFFF;
  padding: 10px 14px 8px; font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 14.5px; line-height: 1.55; color: #46536B;
}
section .pcard .pwhere {
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px; color: #8B8471; margin-bottom: 5px;
}
section .pcard .lhot { color: #B94E00; background: #FDEFD9; display: block; border-radius: 4px; }
section .pcard .pstat {
  margin-top: 7px; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  font-size: 15px; font-weight: 600; color: #2C7A3D;
}
section .pcard.missed { border-color: #C0392B; border-style: dashed; }
section .pcard.missed .pstat { color: #C0392B; }
section .pcard.missed .lhot { background: #F9E3E3; color: #C0392B; }

/* owner cards: where does the box live — class vs objects */
section .ownrow { display: flex; gap: 24px; align-items: stretch; margin: 18px 0 6px 0; }
section .ocard {
  border: 2px solid #33698C; border-radius: 10px; background: #FFFFFF;
  padding: 10px 16px 8px; min-width: 250px;
}
section .ocard.oclass { border-width: 3px; }
section .ocard .ocap {
  font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 18px; color: #33698C; font-weight: 600; margin-bottom: 7px;
}
section .ocard .obox {
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 19px;
  border: 2px solid #8B94A3; border-radius: 7px; padding: 5px 10px;
  margin: 5px 0; text-align: center; color: #1E2833; background: #FBFAF7;
}
section .ocard .obox.oshr { border-color: #E76F00; background: #FDEFD9; color: #B94E00; font-weight: 600; }
section .ocard .onote { font-size: 14px; color: #8B8471; }

/* tightcode: deck-local class for one tall closing example
   (style scoped is unreliable in image export — this is the safe route) */
section.tightcode pre { padding: 13px 18px; margin: 8px 0; }
section.tightcode pre code { font-size: 18px; line-height: 1.32; }

/* lead-slide variants */
section.lead .tstack { justify-content: center; margin: 26px 0 10px 0; }
section.lead .frame { background: rgba(255,255,255,0.07); border-color: #7FB4D8; color: #F4F1E8; font-weight: 400; }
section.lead .frame.live { background: rgba(231,111,0,0.18); border-color: #E76F00; color: #F0B26B; font-weight: 600; }
</style>

<!-- _class: lead -->
<!-- _paginate: false -->

<span class="kicker">// week 03 · methods · object-oriented computing</span>

# Java Methods

<div class="stackwrap tstack">
<div class="stackshot">
<div class="frame live">println("Total: 10.22")</div>
<div class="frame">printReceipt()</div>
<div class="frame">main()</div>
</div>
</div>

Write it once. Name it. Call it anywhere.

---

<!-- Speaker notes: ~0:00. Cold open on the pain — let them feel the paste before naming the cure. Ask who has already done this in the lab. -->

## A true story

- You're building the till program for the campus shop. Every sale prints its total, with VAT:

<!-- no-compile -->
```java
System.out.println("=== RECEIPT ===");
double total1 = price1 * qty1;
double vat1 = total1 * 0.23;
double grand1 = total1 + vat1;
System.out.println("Total: " + grand1);
System.out.println("Thank you!");
```

* You need this three times — so: **copy, paste, paste**. Rename `total1` → `total2` → `total3`. It runs. Ship it.
* Three copies of the same six lines, each with one subtle difference. Remember that.

---

## Three weeks later

- Budget day: VAT drops from 23% to 13.5%. "Two-minute fix," you think.

<div class="pasterow">
<div class="pcard">
<div class="pwhere">copy 1 · line 61</div>
<div>double total1 = price1 * qty1;</div>
<div class="lhot">double vat1 = total1 * 0.135;</div>
<div>double grand1 = total1 + vat1;</div>
<div class="pstat">✓ fixed</div>
</div>
<div class="pcard">
<div class="pwhere">copy 2 · line 144</div>
<div>double total2 = price2 * qty2;</div>
<div class="lhot">double vat2 = total2 * 0.135;</div>
<div>double grand2 = total2 + vat2;</div>
<div class="pstat">✓ fixed</div>
</div>
<div class="pcard missed">
<div class="pwhere">copy 3 · line 287</div>
<div>double total3 = price3 * qty3;</div>
<div class="lhot">double vat3 = total3 * 0.23;</div>
<div>double grand3 = total3 + vat3;</div>
<div class="pstat">✗ missed</div>
</div>
</div>

* You fix line 61. You fix line 144. The demo works. You ship it.
* Line 287 — the copy you forgot existed — still charges 23%. **Customers notice before you do.**
* Copy-paste didn't save you time. It **multiplied the places a bug can live**.

---

## The idea

- Write the block **once**, give it a **name**, and let what varies come in as **parameters**:

```java
public static void printReceipt(double price, int qty) {
    double total = price * qty;
    double vat = total * 0.135;
    System.out.println("Total: " + (total + vat));
    System.out.println("Thank you!");
}
```

<!-- no-compile -->
```java
printReceipt(4.50, 2);     // any number of calls — still ONE copy of the code
printReceipt(12.00, 1);
printReceipt(2.75, 6);
```

* This named block is a **method**. VAT changes again? **One edit** — every call is instantly right.

---

## Agenda

- Anatomy — the five parts of a method
- Calling — the round trip
- Parameters in, `return` out
- Scope and the photocopy rule
- `public`, `private`, `static`
- The call stack — push, pop, trace
- Mistakes, habits, and the till program done right

---

<!-- Speaker notes: ~0:06. Anatomy movement — point at each box in turn; have the room chant the five parts back at you before advancing. -->

## Anatomy of a method

<div class="anat">
<div class="tok"><span class="albl">modifier</span>public</div>
<div class="tok"><span class="albl">modifier</span>static</div>
<div class="tok ret"><span class="albl">return type</span>double</div>
<div class="tok nm"><span class="albl">name</span>vatOf</div>
<div class="tok par"><span class="albl">parameter list</span>(double amount)</div>
</div>

<div class="anat arow2">
<div class="tok bod"><span class="albl">body — the work happens here</span>{ return amount * 0.135; }</div>
</div>

<p class="legend">the first line is the method header — its name + parameter list are the method's signature</p>

* Read it aloud: *a `public`, `static` method named `vatOf`, taking one `double`, handing back a `double`.*
* The **name + parameter list** is what the compiler matches every call against.
* `static`? Park it — it gets its own moment later this hour.

---

## Calling: the round trip

```java
public static void main(String[] args) {
    System.out.println("before");   // 1 — runs
    greet();                        // 2 — pause main, jump into greet
    System.out.println("after");    // 4 — resume at the exact spot
}

public static void greet() {
    System.out.println("hello");    // 3 — the body runs, then jumps back
}
```

* A call is a **round trip**: pause here → run the body → come back to the exact spot.
* The caller leaves a **bookmark** at the call site. Java never loses its place.

---

<!-- Speaker notes: ~0:12. Doorway-and-chute movement — the parameter vs argument distinction pays off in every error message they'll ever read. -->

## Parameters — the doorway in

```java
public static void greetUser(String name) {   // name is the PARAMETER
    System.out.println("Hello, " + name + "!");
}

public static void main(String[] args) {
    greetUser("Ada");     // "Ada" is the ARGUMENT
    greetUser("Grace");   // same code, different data
}
```

* **Parameter** — the named slot declared in the signature. **Argument** — the value you post through it at the call.
* Each call fills the slots fresh. That is what lets one block serve a thousand jobs.

---

## Return — the chute out

```java
public static int add(int a, int b) {
    return a + b;          // hand back the answer AND exit, instantly
}

public static void main(String[] args) {
    int sum = add(5, 3);                 // the call BECOMES the value 8
    System.out.println(add(2, 2) + 1);   // prints 5 — a call fits anywhere a value fits
}
```

* `return` does **two jobs**: hands a value to the caller and **ends the method** on the spot — nothing below it runs.
* Mental model: **the call collapses into its answer.** `add(5, 3)` *is* an `8` the moment it returns.

---

## void or a return type?

| choose `void` when… | choose a return type when… |
|---|---|
| the method **does** something | the method **answers** something |
| printing, saving, drawing the menu | computing, checking, converting |
| `printReceipt(…)`, `showMenu()` | `vatOf(…)`, `area(…)`, `isValid(…)` |

- Even `void` methods own a bare `return;` — no value, just "I'm done early."

<div class="callout"><strong>Habit worth building:</strong> compute and <code>return</code>; let the caller decide whether to print. A returned value can be stored, compared, reused — a <code>println</code> is spent the moment it runs.</div>

---

## More than one parameter

```java
public static double finalPrice(double price, double discountPct) {
    return price * (1 - discountPct / 100);
}

public static void main(String[] args) {
    System.out.println(finalPrice(40.0, 25.0));   // 30.0
}
```

* Arguments map to parameters **left to right, by position** — names don't travel with them.
* `finalPrice(25.0, 40.0)` compiles happily… and quietly computes the wrong price. **Order is on you.**
* Every parameter declares its **own type**: `(double price, double discountPct)` — never `(double price, discountPct)`.

---

## Predict: what prints?

```java
public static int mystery(int x) {
    if (x > 3) {
        return x * 2;
    }
    return x;
}

public static void main(String[] args) {
    System.out.println(mystery(5) + mystery(2));
}
```

* `mystery(5)`: `5 > 3` → takes the early exit → **10**.
* `mystery(2)`: sails past the `if` → **2**.
* `10 + 2` → prints **12**. Two calls, two different roads through one body.

---

<!-- Speaker notes: ~0:22. Scope-and-copies movement — the photocopy rule is the deepest idea of the hour; slow right down and connect it back to the object-variables-are-arrows rule. -->

## What a method can see

```java
public static double vatOf(double amount) {
    double rate = 0.135;          // rate is born HERE, at the call
    return amount * rate;
}                                 // …and dies HERE, along with amount
```

<!-- no-compile -->
```java
System.out.println(rate);   // error: cannot find symbol — rate does not exist out here
```

* Parameters and locals are **per call**: born at the `(`, gone at the `}`. Next call, fresh ones.
* No method can see another method's variables. The **doorway** (parameters) and the **chute** (`return`) are the *only* connections.

---

## The photocopy rule

```java
public static void triple(int n) {
    n = n * 3;
    System.out.println(n);     // 30 — the copy, tripled
}

public static void main(String[] args) {
    int x = 10;
    triple(x);                 // triple receives a COPY of the 10
    System.out.println(x);     // 10 — x never left main
}
```

<div class="callout"><strong>The photocopy rule.</strong> Java is <em>pass-by-value</em>: every argument travels as a <strong>copy</strong> of what's in the variable. Scribble on the photocopy all you like — the original stays home.</div>

---

## Passing objects: the arrow travels

```java
public static void curve(int[] s) {
    s[0] = s[0] + 5;                 // follow the arrow, write in a box
}
public static void main(String[] args) {
    int[] scores = {60, 70, 85};
    curve(scores);                   // the ARROW is photocopied — not the boxes
    System.out.println(scores[0]);   // 65
}
```

<div class="mem">
<div class="name">scores</div>
<div class="name">s</div>
<div class="cell hot"><span class="idx">0</span>65</div>
<div class="cell"><span class="idx">1</span>70</div>
<div class="cell"><span class="idx">2</span>85</div>
</div>

<p class="legend">two names · two arrows · ONE set of boxes — scores lives in main, s lives in curve</p>

* Remember: an object variable holds an **arrow**, and an `int[]` array is an object. Copy the arrow — both point at the **same boxes**.

---

## Predict: what prints?

```java
public static void wipe(int n, int[] data) {
    n = 0;
    data[0] = 0;
}
public static void main(String[] args) {
    int x = 7;
    int[] nums = {7, 7, 7};
    wipe(x, nums);
    System.out.println(x + " " + nums[0]);
}
```

* `x` prints **7** — `wipe` scribbled on a photocopy of the *value*.
* `nums[0]` prints **0** — the photocopied **arrow** still points at the one real array.
* One rule, both outcomes: Java **always passes a copy of what's in the variable**.

---

<!-- Speaker notes: ~0:32. Visibility-and-static movement — keep it brisk; the payoff is decoding main() and it lands best with momentum. -->

## public and private

* `public` — anyone may call it. The method is part of what your class **offers** the world.
* `private` — only code in the **same class** may call it. Scaffolding, not shopfront.
* The modifier is a promise about **who depends on this code** — `private` methods stay free to change.
- This term's habit: `public` for what the task asks for, `private` for your internal steps.

---

## Private helpers

```java
public class BankAccount {
    private double balance;
    public void deposit(double amount) {
        if (isValidAmount(amount)) {
            balance = balance + amount;
        }
    }
    private boolean isValidAmount(double amount) {
        return amount > 0;   // the back room
    }
}
```

* `deposit` is the shopfront; `isValidAmount` is the back room.
* Helpers keep public methods **short and readable** — and nobody outside can call the half-step on its own.

---

## static — no object required

```java
public class MathHelper {
    public static int square(int n) {
        return n * n;
    }
    public static void main(String[] args) {
        System.out.println(MathHelper.square(5));   // 25 — no object anywhere
    }
}
```

* `static` = the method lives **on the class itself** — call it as `ClassName.method(…)`.
* You've used them all along: `Math.sqrt(2)`, `Math.max(a, b)`, `Integer.parseInt("42")`.
* Perfect for **utilities**: pure input → output, no object state involved.

---

## static vs instance — where the box lives

```java
public class Counter {
    static int created = 0;    // ONE box, painted on the class itself
    int id;                    // a box inside EVERY object
}
```

<div class="ownrow">
<div class="ocard oclass">
<div class="ocap">class Counter</div>
<div class="obox oshr">created = 2</div>
<div class="onote">one shared box — static</div>
</div>
<div class="ocard">
<div class="ocap">object c1</div>
<div class="obox">id = 1</div>
<div class="onote">its own box — instance</div>
</div>
<div class="ocard">
<div class="ocap">object c2</div>
<div class="obox">id = 2</div>
<div class="onote">its own box — instance</div>
</div>
</div>

* `static` = shared: every object — and code with **no object at all** — sees the same box.
* That's why a `static` method can't touch instance members directly: **which** object's box would it read?

---

## The magic words, decoded

- Until now you've typed this line on faith. You can now read **every word**:

```java
public static void main(String[] args) {
}
```

* `public` — the JVM calls it from outside your class, so it must be visible.
* `static` — when the program starts, **no objects exist yet**; the JVM calls it on the class.
* `void` — `main` answers to no caller; there's nothing to hand back.
* `main` — the exact name the JVM is hard-wired to look for.
* `(String[] args)` — an **array** of Strings… a topic worth an hour of its own.

---

<!-- Speaker notes: ~0:41. Call-stack movement — walk the three snapshots left to right, twice: once for the frames, once for the photocopies living inside them. -->

## The call stack

- Java tracks every call-in-progress on the **call stack** — a stack of plates.
- **Call = push** a frame on top. **Return = pop** it off. The top frame is the method running *now*.
- A **frame** holds that call's parameters, locals, and the caller's bookmark — your photocopies live (and die) here.

<div class="stackwrap">
<div class="stackshot">
<div class="frame live">main()<span class="fl">running</span></div>
<div class="scap">1 · before the call</div>
</div>
<div class="snext">→</div>
<div class="stackshot">
<div class="frame live">printReceipt()<span class="fl">price=4.50 · qty=2 · total=9.0</span></div>
<div class="frame">main()<span class="fl">paused at its bookmark</span></div>
<div class="scap">2 · call → push a frame</div>
</div>
<div class="snext">→</div>
<div class="stackshot">
<div class="frame gone">printReceipt()<span class="fl">popped — copies destroyed</span></div>
<div class="frame live">main()<span class="fl">resumes at the bookmark</span></div>
<div class="scap">3 · return → pop</div>
</div>
</div>

---

## Trace it

```java
public static void main(String[] args) {
    methodA();
    System.out.println("back in main");
}
public static void methodA() {
    System.out.println("A starts");
    methodB();
    System.out.println("A ends");
}
public static void methodB() {
    System.out.println("B runs");
}
```

* Output: `A starts` · `B runs` · `A ends` · `back in main` — each caller **resumes at its bookmark**.
* The deepest call always finishes **first**: last pushed, first popped (**LIFO**).

---

## Predict: what order?

```java
public static void a() {
    System.out.println("a in");
    b();
    System.out.println("a out");
}
public static void b() {
    System.out.println("b!");
}
public static void main(String[] args) {
    a();
    b();
}
```

* `a in` · `b!` · `a out` — `a` waits for `b`, then picks up at its bookmark.
* …then `b!` once more. Same method, **brand-new frame** — frames are per *call*, not per method.

---

## Predict: does this compile?

<!-- no-compile -->
```java
public static int grade(int score) {
    if (score >= 40) {
        return 1;
    }
}
```

* **No.** `javac` says: `error: missing return statement` — pointing at the final `}`.
* What would `grade(39)` hand back? Nothing is not an option for an `int` method — **every path must return**.
* The fix: add `return 0;` after the `if` (or return from an `else`). Every road ends at a `return`.

---

<!-- Speaker notes: ~0:51. Landing movement — the mistakes are recognition humour by now; end on the till program coming full circle. -->

## Common mistakes

* **Ignoring the answer:** `vatOf(total);` on its own line computes the VAT… which instantly evaporates. Store it or use it.
* **Re-declaring types at the call site:** `vatOf(double total)` — types belong in the signature, never in the call.
* **Wrong type or order:** `finalPrice("40", "25")` won't compile; `finalPrice(25.0, 40.0)` compiles and lies.
* **Calling an instance method from `main`:** `main` is `static` — no object, no instance call. Make the method `static`, or make an object first.
* **Missing a return path** — two slides ago; at least `javac` catches that one for free.

---

## The till program, done right

<!-- _class: tightcode -->

```java
public class Receipts {
    public static double vatOf(double amount) {
        return amount * 0.135;               // change VAT here — nowhere else
    }
    public static void printReceipt(double price, int qty) {
        double total = price * qty;
        System.out.println("Total: " + (total + vatOf(total)));
    }
    public static void main(String[] args) {
        printReceipt(4.50, 2);
        printReceipt(12.00, 1);
    }
}
```

- The opening program, done right: the VAT rule lives in exactly **one place** — and `printReceipt` calls `vatOf`, a stack you can now trace in your head.

---

## Habits of good methods

* **Name with verbs**, in camelCase: `calculateTotal`, `isValid`, `printReceipt` — the name should say it all.
* **One job per method.** If you need the word "and" to describe it, split it.
* **Short.** A method that fits on a screen fits in a head.
* **Prefer returning over printing** — answers are reusable; printouts aren't.
* **Parameters over hard-coding:** `vatOf(amount)` beats `vatOfTotal1()`.
* **`static` for pure utilities**; instance methods when object state is involved.
* **Every path returns** when a return type is promised.

---

## Summary

- A method is a **named block of code**: define it once, call it anywhere, fix it in one place.
- Signature = modifiers + return type + name + parameter list; the body between `{ }` does the work.
- Arguments fill parameters left to right; `return` hands back a value and exits — the call **becomes** its answer, and non-void methods must return on every path.
- Scope is per call: parameters and locals are born and die with their frame — the doorway in and the chute out are the only connections.
- Java passes **photocopies**: of the value for primitives, of the **arrow** for objects — so a method can't change your `int`, but can reach your array's boxes.
- `public` invites callers, `private` hides helpers, `static` lives on the class — one shared box, called as `ClassName.method(…)`.
- Calls run on the **stack**: push on call, pop on return, LIFO — the deepest call finishes first.
