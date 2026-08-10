---
marp: true
theme: ooc
paginate: true
transition: fade
title: "Polymorphism"
week: 10
topic: polymorphism
type: lecture
source: authored
---

<style>
/* Deck-local visual system: pillar strip, type-tag cards, dispatch fan,
   comparison columns, zoo array strips - all drawn in CSS, no images. */
section .mem {
  display: flex; margin: 40px 0 10px 0;
  font-family: 'Cascadia Code', Consolas, monospace;
}
section .mem .cell {
  min-width: 118px; padding: 15px 12px 13px; text-align: center;
  background: #FFFFFF; border: 2px solid #33698C;
  border-left-width: 1px; border-right-width: 1px;
  font-size: 25px; color: #1E2833; position: relative;
}
/* deck-wide colour code: blue = settled at compile time, orange = settled at run time */
section .ct { color: #33698C; font-weight: 600; }
section .rt { color: #B94E00; font-weight: 600; }
/* four-pillars strip */
section .pillars { display: flex; gap: 18px; margin: 34px 0 10px 0; }
section .pillars .pill {
  flex: 1; text-align: center; padding: 20px 8px 16px;
  background: #FFFFFF; border: 2px solid #DED8C9; border-radius: 12px;
}
section .pillars .pill b {
  display: block; font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 22px; font-weight: 600; color: #8B8471;
}
section .pillars .pill span { display: block; margin-top: 6px; font-size: 16px; color: #AFA893; }
section .pillars .pill.done { border-color: #33698C; }
section .pillars .pill.done b { color: #33698C; }
section .pillars .pill.now { background: #FDEFD9; border-color: #E76F00; }
section .pillars .pill.now b { color: #B94E00; }
section .pillars .pill.now span { color: #B94E00; }
/* two-types card: reference type -> object type */
section .tt { display: flex; align-items: center; justify-content: center; margin: 26px 0 8px 0; }
section .tt .box {
  min-width: 330px; padding: 14px 24px 12px; text-align: center;
  background: #FFFFFF; border: 2px solid #33698C; border-radius: 12px;
}
section .tt .box .tag { display: block; font-size: 15px; letter-spacing: 0.05em; color: #33698C; }
section .tt .box .val {
  display: block; margin-top: 2px; font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 27px; color: #1E2833;
}
section .tt .box .sub { display: block; margin-top: 4px; font-size: 16px; color: #8B8471; }
section .tt .box.obj { background: #FDEFD9; border-color: #E76F00; }
section .tt .box.obj .tag { color: #B94E00; }
section .tt .link { padding: 0 22px; font-size: 40px; color: #E76F00; font-weight: 600; }
/* dispatch fan: one call site, three candidate bodies, run time picks one */
section .dsp { text-align: center; margin: 18px 0 4px 0; }
section .dsp .call {
  display: inline-block; background: #16222E; color: #E8ECF1;
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 24px;
  padding: 12px 32px; border-radius: 10px;
}
section .dsp .fan { display: flex; justify-content: center; gap: 26px; margin-top: 2px; }
section .dsp .opt { width: 272px; }
section .dsp .wire { display: block; font-size: 27px; color: #AFA893; line-height: 1.35; }
section .dsp .card {
  background: #FFFFFF; border: 2px solid #33698C; border-radius: 10px;
  padding: 10px 8px; opacity: 0.5;
}
section .dsp .card b {
  display: block; font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 21px; font-weight: 600; color: #33698C;
}
section .dsp .card span { font-size: 17px; color: #8B8471; }
section .dsp .opt.win .wire { color: #E76F00; font-weight: 700; }
section .dsp .opt.win .card { background: #FDEFD9; border-color: #E76F00; opacity: 1; }
section .dsp .opt.win .card b { color: #B94E00; }
/* overloading vs overriding comparison columns */
section .vs { display: flex; gap: 28px; margin: 14px 0 8px 0; }
section .vs .col { flex: 1; background: #FFFFFF; border: 2px solid #33698C; border-radius: 12px; overflow: hidden; }
section .vs .col .head {
  background: #33698C; color: #FFFFFF; text-align: center; padding: 9px 0;
  font-family: 'Cascadia Code', Consolas, monospace; font-weight: 600; font-size: 23px;
}
section .vs .col .row { padding: 9px 16px; border-top: 1px solid #EDE9DE; font-size: 20px; color: #46536B; text-align: center; }
section .vs .col .row b { color: #33698C; }
section .vs .col.late { border-color: #E76F00; }
section .vs .col.late .head { background: #E76F00; }
section .vs .col.late .row b { color: #B94E00; }
/* lead-slide (dark background) variants */
section.lead .mem .cell {
  background: rgba(255,255,255,0.07); border-color: #7FB4D8; color: #F4F1E8;
}
section.lead .mem .name { color: #7FB4D8; }
</style>

<!-- _class: lead -->
<!-- _paginate: false -->

<span class="kicker">// week 10 · polymorphism · object-oriented computing</span>

# Polymorphism

<div class="mem">
<div class="name">a.speak()</div>
<div class="cell"><span class="idx">Dog</span>Woof</div>
<div class="cell"><span class="idx">Cat</span>Meow</div>
<div class="cell"><span class="idx">Tiger</span>Roar</div>
</div>

One call. Many forms.

---

<!-- Speaker notes: ~0:00. Cold open - run the mystery before naming it. Pause after the third sound; let "compiled once" sink in before advancing. -->

## One line of code

- This whole lecture hides inside one innocent line:

<!-- no-compile -->
```java
a.speak();
```

* Run the program: it prints **Woof**.
* Run it again: **Meow**. Once more: **Roar**.
* Same line. Compiled **once**. Three different behaviours.
* The compiler can't tell you which sound comes out - when it did its job, the answer *didn't exist yet*.
* Something is choosing **while the program runs**. Finding that something is this hour's job.

---

## The trick has a name

- **Polymorphism** - Greek *poly* (many) + *morphē* (form): **one call, many forms**.
- A method call that does different things depending on **the object it lands on**.
- **Binding** = linking a call site to the method body that runs. Java draws that link at two different moments:

| | <span class="ct">compile-time polymorphism</span> | <span class="rt">run-time polymorphism</span> |
|---|---|---|
| also called | early / <span class="ct">static</span> binding | late / <span class="rt">dynamic</span> binding |
| who chooses | the <span class="ct">compiler</span> | the <span class="rt">JVM</span> |
| mechanism | method <span class="ct">overloading</span> | method <span class="rt">overriding</span> |

- This table is the map of the hour: Act I is the left column, Act II the right.

---

## Agenda

- The four pillars - where polymorphism sits
- Method **signatures** - what makes two methods "different"
- Act I - **overloading**: the compile-time trick
- Act II - **overriding**: the run-time trick, and dynamic dispatch
- Reference type vs object type - the two-types rule
- **Upcasting**, **downcasting**, and the `instanceof` gate
- The payoff: one loop over a mixed `Animal[]`
- Predict rounds all the way through

---

<!-- Speaker notes: ~0:05. Orientation, fast. Point at the pillars strip; two are behind them already. -->

## The four pillars - you are here

- The map of OOP has four pillars. Today the third one lights up.

<div class="pillars">
<div class="pill done"><b>Encapsulation</b><span>pillar 1 - done</span></div>
<div class="pill done"><b>Inheritance</b><span>pillar 2 - done</span></div>
<div class="pill now"><b>Polymorphism</b><span>pillar 3 - today</span></div>
<div class="pill"><b>Abstraction</b><span>pillar 4 - next</span></div>
</div>

- Polymorphism stands **on top of inheritance**: everything today starts from a superclass and the subclasses that `extends` it.
- It's the pillar the other pillars were scaffolding for - the one that changes how programs are *designed*, not just how they're organised.

---

## First, a precision tool: the method signature

<!-- _class: code-sm -->

```java
public int max(int x, int y) {
    return (x > y) ? x : y;
}
```

- Anatomy: `public` modifier · `int` return type · `max` name · `(int x, int y)` parameter list · `{ }` body.
- The **signature** is the **name + parameter list**: the number, types, and *order* of the parameters - `max(int, int)`.
- **Not** part of the signature: the return type, the parameter *names*, the modifiers.
- A class can't hold two methods with the same signature - the compiler couldn't tell them apart:

<!-- no-compile -->
```java
int max(int a, int b) {
    return Math.max(a, b);
}
long max(int x, int y) {              // error: same signature!
    return Math.max(x, y);
}
```

---

<!-- Speaker notes: ~0:09. Act I - brisk tempo; the deep water is Act II. Overloading should feel familiar, almost obvious. -->

## Act I - overloading

- **Method overloading** (compile-time polymorphism): one class, one method name, several **different signatures**.

<!-- _class: code-sm -->

```java
public class Greeter {
    void greet() {
        System.out.println("Hello!");
    }
    void greet(String name) {
        System.out.println("Hello, " + name);
    }
    void greet(int year) {
        System.out.println("Hello, class of " + year);
    }
}
```

- Three different signatures - `greet()`, `greet(String)`, `greet(int)` - so all three may share the name.
- One *idea*, several input shapes. Callers remember one word: `greet`.
- Constructors overload the same way - several recipes for building the same kind of object.

---

## The compiler picks - by the arguments

<!-- no-compile -->
```java
g.greet();          // matches greet()         -> "Hello!"
g.greet("Ada");     // matches greet(String)   -> "Hello, Ada"
g.greet(2027);      // matches greet(int)      -> "Hello, class of 2027"
```

- At each call site the compiler reads the **argument list** and binds the call to the matching signature - **before the program ever runs**. That's <span class="ct">early binding</span>.
- And you've used overloading since day one:

```java
System.out.println("text");    // println(String)
System.out.println(42);        // println(int)
System.out.println(true);      // println(boolean)
```

- One name, ten signatures - `println` is overloading hiding in plain sight.

---

<!-- Speaker notes: ~0:14. Predict beat that closes Act I - the very next slide pivots to why overloading cannot be the cold open's trick, so land a clean answer here first. The trap is `fun('A')`: expect the room to guess double, reaching for arithmetic's mixing rule (an int combined with a double always promotes to double) rather than overload resolution's actual rule - `char` widens to both `int` and `double`, and Java keeps whichever applicable overload is narrowest, so `int` wins. Exam-style muscle memory, not the deepest idea of the day. -->

## Predict: which one runs?

<!-- _class: code-sm -->

```java
static void fun(int a) {
    System.out.println("int");
}
static void fun(double a) {
    System.out.println("double");
}

public static void main(String[] args) {
    fun(5);
    fun(5.0);
    fun('A');
}
```

* `fun(5)` prints **int** - exact match wins.
* `fun(5.0)` prints **double** - `5.0` is a `double` literal.
* `fun('A')` prints **int** - no `fun(char)` exists, so the `char` **widens** to the nearest fit, and `int` beats `double`.
* All three choices were inked at **compile time**. Run it a million times - they never change.

---

<!-- Speaker notes: ~0:17. The pivot. Re-arm the hook and let overloading visibly fail to explain it. -->

## The hook, revisited

- Overloading is real polymorphism - but it *cannot* be the hook's trick:

<!-- no-compile -->
```java
a.speak();     // empty argument list -- nothing to choose between
```

* One call site, one argument list, one matching signature. The compiler's pick is **forced** - overloading is out of moves.
* Yet the behaviour still varied: Woof, Meow, Roar.
* So the variation must live inside **`a`** - in the *object* behind the name.
* Act II: let each subclass bring its **own body** to the *same* signature.

---

## Act II - overriding

- **Method overriding** (run-time polymorphism): a subclass re-declares an inherited method - **same signature**, new body.

<!-- _class: code-xs -->

```java
class Animal {
    void speak() {
        System.out.println("Some animal sound");
    }
}
class Dog extends Animal {
    @Override void speak() {
        System.out.println("Woof");
    }
}
class Cat extends Animal {
    @Override void speak() {
        System.out.println("Meow");
    }
}
class Tiger extends Animal {
    @Override void speak() {
        System.out.println("Roar");
    }
}
```

- Vocabulary: `Animal.speak` is the **overridden** method; each subclass version is an **overriding** method.

---

## `@Override` - the seatbelt

- The annotation is optional. **Write it anyway** - it asks the compiler to *verify you really are overriding*.

<!-- no-compile -->
```java
class Dog extends Animal {
    @Override
    void speek() {                                 // compile error!
        System.out.println("Woof");
    }
}
```

* Without `@Override`, the typo compiles **silently** as a brand-new method `speek` - your Dog keeps making the generic Animal sound, and you lose an evening finding out why.
* With it, the mistake dies at <span class="ct">compile time</span>: *"method does not override or implement a method from a supertype"*.

<div class="callout"><strong>House rule:</strong> every overriding method wears <code>@Override</code>. A free bug detector with zero run-time cost.</div>

---

<!-- Speaker notes: ~0:27. The deepest idea of the hour. The leash picture must land before dispatch - draw it on the board too. -->

## One line, two types

<!-- no-compile -->
```java
Animal a = new Cat();     // legal: every Cat IS an Animal
```

<div class="tt">
<div class="box"><span class="tag">REFERENCE TYPE - fixed at compile time</span><span class="val">Animal a</span><span class="sub">the leash: decides what you MAY call</span></div>
<div class="link">→</div>
<div class="box obj"><span class="tag">OBJECT TYPE - known at run time</span><span class="val">new Cat()</span><span class="sub">the animal: decides what actually HAPPENS</span></div>
</div>

- Mental model: **the leash and the animal**. `a` is a leash labelled *Animal*; the creature on the end of it is a *Cat*.
- The <span class="ct">compiler</span> only ever sees the leash. The <span class="rt">JVM</span> sees the animal.

---

## Dynamic dispatch - the run-time pick

- At the call, the JVM asks exactly one question: **what's on the end of the leash right now?**

<div class="dsp">
<div class="call">a.speak();</div>
<div class="fan">
<div class="opt"><span class="wire">↙</span><div class="card"><b>Dog.speak()</b><span>"Woof"</span></div></div>
<div class="opt win"><span class="wire">↓</span><div class="card"><b>Cat.speak()</b><span>"Meow"</span></div></div>
<div class="opt"><span class="wire">↘</span><div class="card"><b>Tiger.speak()</b><span>"Roar"</span></div></div>
</div>
</div>

<p class="legend">one call site, compiled once - this run the object is a Cat, so Cat.speak() wins</p>

- This is **dynamic dispatch** (<span class="rt">late binding</span>): the body is chosen at run time, call by call, by the **object's actual type** - never by the reference type.

---

## Why the choice can't happen earlier

- The compiler meets `a.speak()` **once**. Which object arrives there? The *running program* decides:

<!-- no-compile -->
```java
Animal a;
if (Math.random() < 0.5) {
    a = new Dog();
} else {
    a = new Cat();
}
a.speak();     // Woof or Meow -- unknowable until THIS instant, THIS run
```

* The compiler's entire knowledge: "`a` is some kind of `Animal`, and `Animal` has `speak()` - legal call." That is *all it can ever know*.
* The JVM at run time: "the object that just arrived is a `Dog`" → dispatch `Dog.speak()`.
* Overloading's choice sits **in the source code** → bind early. Overriding's choice sits **in the live object** → it *must* bind late.

---

<!-- Speaker notes: ~0:34. First real test of the leash-and-animal model from ~0:27, not just a description of it. Expect line 2 to trip the room: having just accepted that the object decides line 1, most students assume `a.purr()` works too, since the object really is a Cat underneath - but callability is fixed by the reference type alone at compile time, while dispatch only ever chooses among members that type already exposes, which is exactly why line 2 is a genuine compile error and the fragment is marked `no-compile`. Direct setup for the upcasting and downcasting slides right after, where losing and regaining `purr()` becomes the explicit topic. -->

## Predict: leash vs animal

<!-- _class: code-xs -->

```java
class Animal {
    void speak() {
        System.out.println("Some animal sound");
    }
}
class Cat extends Animal {
    @Override void speak() {
        System.out.println("Meow");
    }
    void purr() {                        // Cat-only
        System.out.println("prrrr");
    }
}
```

<!-- no-compile -->
```java
Animal a = new Cat();
a.speak();     // line 1 -- what happens?
a.purr();      // line 2 -- what happens?
```

* Line 1: prints **Meow** - dispatch reads the **object type**, and the Cat answers.
* Line 2: **compile error** - the leash is `Animal`, and `Animal` owns no `purr()`.
* The reference type gates the **menu**; the object type picks the **behaviour**.

---

## Overloading vs overriding - side by side

<div class="vs">
<div class="col">
<div class="head">overloading</div>
<div class="row">lives in <b>one class</b></div>
<div class="row">same name, <b>different signatures</b></div>
<div class="row">picked by the <b>arguments</b></div>
<div class="row">bound at <b>compile time</b> - early, static</div>
<div class="row">decided by the <b>compiler</b></div>
</div>
<div class="col late">
<div class="head">overriding</div>
<div class="row">spans <b>superclass and subclass</b></div>
<div class="row"><b>identical signature</b>, new body</div>
<div class="row">picked by the <b>object's actual type</b></div>
<div class="row">bound at <b>run time</b> - late, dynamic</div>
<div class="row">decided by the <b>JVM</b></div>
</div>
</div>

<p class="legend">deck-wide colour code: blue = settled at compile time · orange = settled at run time</p>

- Exam tell: "same signature in a subclass" → overriding. "Same name, different parameters" → overloading.

---

<!-- Speaker notes: ~0:38. Casting movement. Keep momentum - the payoff is two slides away and it needs these tools. -->

## Upcasting - up the family tree, for free

<!-- no-compile -->
```java
Cat c = new Cat();
Animal a = c;          // upcast: automatic, no cast syntax needed
```

- **Always safe**, so Java does it silently: every `Cat` *is an* `Animal` - the guarantee `extends` signed.
- The **object never changes** - you only swapped a specific leash for a more general one.
* Lost: the `Animal` leash can't reach `purr()` any more - the menu shrank.
* Gained: your `Cat` now fits **anywhere an `Animal` fits**. Hold that thought - payoff in two slides.

---

## Downcasting - back down, on your honour

<!-- no-compile -->
```java
Animal a = new Cat();
Cat c = (Cat) a;       // downcast: explicit (Cat) cast required
c.purr();              // full Cat menu restored
```

- General → specific. The compiler **can't prove** the object really is a `Cat`, so *you* sign a promise: the `(Cat)` cast.
- Break the promise and the JVM calls it in - at <span class="rt">run time</span>:

<!-- no-compile -->
```java
Animal plain = new Animal();
Cat impostor = (Cat) plain;    // compiles fine... then ClassCastException
```

---

## `instanceof` - look before you cast

- Ask the object first: `a instanceof Cat` is `true` exactly when the **object** really is a `Cat` (or a subclass of one).

<!-- no-compile -->
```java
if (a instanceof Cat) {      // the safe gate -- checks the OBJECT, at run time
    Cat c = (Cat) a;         // promise now guaranteed to hold
    c.purr();
}
```

- Newer Java fuses gate and cast: `if (a instanceof Cat c) { c.purr(); }` - test, cast, and name in one move.

<div class="callout"><strong>Rule of thumb:</strong> a downcast without an <code>instanceof</code> gate is a <code>ClassCastException</code> waiting for demo day.</div>

---

<!-- Speaker notes: ~0:44. THE payoff. Say it out loud: this is the classic array drawing with upgraded contents. -->

## The payoff - one loop, many animals

- The array contract: every box holds **one type**. Upcasting bends it - an `Animal` box accepts **any** `Animal`:

<!-- no-compile -->
```java
Animal[] zoo = { new Cat(), new Tiger(), new Cat() };   // three upcasts

for (Animal x : zoo) {
    x.speak();     // Meow   Roar   Meow
}
```

<div class="mem">
<div class="name">zoo</div>
<div class="cell"><span class="idx">0 · Animal</span>Cat</div>
<div class="cell"><span class="idx">1 · Animal</span>Tiger</div>
<div class="cell"><span class="idx">2 · Animal</span>Cat</div>
</div>

<p class="legend">every box typed Animal - every object still knows exactly what it is</p>

* One loop, mixed contents: dispatch runs **per element, per lap** - each animal answers in its own voice.

---

## Why this changes how you design

* The loop is written against **`Animal`** - it has never heard of `Cat` or `Tiger`, and never needs to.
* Tomorrow you add `class Wolf extends Animal` with its own `speak()`. Drop one into the array…
* …and **the loop does not change**. No old code changes anywhere. That property has a name: **extensibility**.
* Without upcasting you'd need one variable and one call *per animal*. With it: any zoo, three lines.
* Every framework you'll ever meet works this way - a loop over a supertype, written years before your class existed. Polymorphism is the socket your code plugs into.

---

<!-- Speaker notes: ~0:48. Direct test of the instanceof-gate warning from two slides back - the room either internalised it or is about to relearn it the hard way. Expect line 2 to split the room: many guess compile error, assuming the compiler can see `zoo[1]` holds a `Tiger` and refuse the cast - but the compiler only knows the array's declared type, `Animal`, so any `(Cat)` downcast from it is syntactically legal and compiles regardless, failing only when the JVM checks the real object at run time. The fragment is marked `no-compile` only because `Animal`, `Cat` and `Tiger` are not declared inside this fence, not because the cast is invalid - the bad-index callback in the last bullet is the lesson to lean on: some mistakes cannot be caught until the program actually runs. -->

## Predict: the cast that lies

<!-- no-compile -->
```java
Animal[] zoo = { new Cat(), new Tiger(), new Cat() };
Cat first  = (Cat) zoo[0];     // line 1 -- what happens?
Cat second = (Cat) zoo[1];     // line 2 -- what happens?
```

<div class="mem">
<div class="name">zoo</div>
<div class="cell"><span class="idx">0</span>Cat</div>
<div class="cell boom"><span class="idx">1</span>Tiger</div>
<div class="cell"><span class="idx">2</span>Cat</div>
</div>

* Line 1: works - box 0 really holds a `Cat`. The promise was true.
* Line 2: **compiles** - the cast silenced the compiler - then dies at run time: `ClassCastException`, a `Tiger` is not a `Cat`.
* An old echo: bad *index* → run-time crash. Today: bad *cast* → run-time crash. `instanceof` is how you check before you leap.

---

<!-- Speaker notes: ~0:50. The whole hour on one screen - walk it top to bottom, slowly. This is the lab's starting point. -->

## The whole story - the family

<!-- _class: code-sm -->

- One superclass, two subclasses, one overridden method - everything Act II built:

```java
class Animal {
    void speak() {
        System.out.println("Some animal sound");
    }
}
class Cat extends Animal {
    @Override void speak() {
        System.out.println("Meow");
    }
    void purr() {
        System.out.println("prrrr");
    }
}
class Tiger extends Animal {
    @Override void speak() {
        System.out.println("Roar");
    }
}
```

---

## The whole story - the program

<!-- _class: code-sm -->

<!-- no-compile -->
```java
public class Zoo {                           // Animal, Cat and Tiger as opposite
    public static void main(String[] args) {
        Animal[] zoo = { new Cat(), new Tiger(), new Cat() };  // upcasting: automatic
        for (Animal x : zoo) {
            x.speak();                       // dynamic dispatch: Meow Roar Meow
        }
        if (zoo[0] instanceof Cat) {         // the safe gate
            Cat c = (Cat) zoo[0];            // downcast, guarded
            c.purr();                        // Cat menu unlocked: prrrr
        }
        // Cat bad = (Cat) zoo[1];           // compiles -- ClassCastException at run time
    }
}
```

<p class="legend">overriding + upcasting + dispatch + instanceof + downcasting - one loop</p>

---

<!-- Speaker notes: ~0:53. Stretch slide - if the room is flagging or time is short, this is the one to cut; it tests a boundary case, not the hour's core mechanism. Expect a confident wrong answer of Sub: the whole hour has trained the room to expect the object on the end of the leash to decide, but a static method has no receiver to dispatch on, so the reference type resolves it at compile time, exactly like a plain name lookup. Ties back to the `@Override` seatbelt: annotating `Sub.whoAmI` would refuse to compile, because the compiler already knows there is no instance method underneath for it to override. -->

## Predict (stretch): the fake override

<!-- _class: code-xs -->

```java
class Base {
    static void whoAmI() {
        System.out.println("Base");
    }
}
class Sub extends Base {
    static void whoAmI() {
        System.out.println("Sub");
    }
}

public class Trap {
    public static void main(String[] args) {
        Base b = new Sub();
        b.whoAmI();          // what prints?
    }
}
```

* Prints **Base** - not `Sub`.
* No object, no dispatch: `static` methods belong to the **class**, so the **reference type** decides, at <span class="ct">compile time</span>. This is called **hiding**, not overriding.
* `@Override` on `Sub.whoAmI` would refuse to compile - the seatbelt knows. Dynamic dispatch is an **instance-method** superpower.

---

## What polymorphism buys you

- **Write once, welcome all** - code against the superclass and every subclass fits, including ones not written yet.
- **Extensibility** - a new subclass is a new file. Old loops, old methods, old arrays: untouched.
- **Uniform collections** - one mixed `Animal[]` instead of one variable per creature (arrays + polymorphism, combined).
- **Separation of concerns** - callers say *what* ("speak"); each object decides *how*.
- **Dynamic dispatch is the engine of OOP** - encapsulation protects, inheritance shares, polymorphism *adapts*.

---

<!-- Speaker notes: ~0:56. Land the plane on the two moments - point back at the slide-3 table; they can now read every cell of it. -->

## Summary

- **Polymorphism** = one call, many forms; **binding** links a call to the body that runs - Java binds at two moments.
- **Overloading** (compile time): same class, same name, different **signatures** - signature = name + parameter list, *never* the return type. The **compiler** picks by the arguments.
- **Overriding** (run time): a subclass redefines an inherited method with the **same signature**; the **JVM** picks by the object's actual type - **dynamic dispatch**. Always wear `@Override`; `static` methods never dispatch (hiding).
- Every reference has **two types**: the reference type gates what you *may call*; the object type decides what *runs*.
- **Upcasting** is free and always safe; **downcasting** needs a cast plus the `instanceof` gate - or `ClassCastException` bites at run time.
- The payoff: one loop over a mixed `Animal[]`, every element answering in its own voice - the array dream, delivered.
