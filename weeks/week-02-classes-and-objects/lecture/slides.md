---
marp: true
theme: ooc
paginate: true
transition: fade
title: "Classes and Objects"
week: 2
topic: classes-and-objects
type: lecture
source: authored
---

<style>
/* Deck-local visual system: class cards, object cards and reference
   arrows, drawn in pure CSS — no images. Colour code: blue = blueprint
   (compile-time structure), orange = living object (run-time). */
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

/* type chips — the built-in types row (title + idea slides) */
section .tyrow {
  display: flex; gap: 14px; align-items: center; margin: 26px 0 10px;
  font-family: 'Cascadia Code', Consolas, monospace;
}
section .tyrow .tychip {
  padding: 9px 20px; font-size: 23px; border-radius: 9px;
  background: #FFFFFF; border: 2px solid #33698C; color: #33698C;
}
section .tyrow .tychip.mint {
  background: #FDEFD9; border-color: #E76F00; color: #B94E00; font-weight: 600;
}
section .tyrow .dots { color: #AFA893; font-size: 26px; }
section.lead .tyrow .tychip {
  background: rgba(255,255,255,0.07); border-color: #7FB4D8; color: #F4F1E8;
}
section.lead .tyrow .tychip.mint {
  background: rgba(231,111,0,0.18); border-color: #E76F00; color: #F0B26B;
}
section.lead .tyrow .dots { color: #6E8497; }

/* class card — the blueprint (blue) */
section .ccard {
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 19px;
  background: #FFFFFF; border: 2px solid #33698C; border-radius: 10px;
  overflow: hidden; color: #1E2833; flex: none;
}
section .ccard .chead {
  background: #33698C; color: #FFFFFF; font-weight: 600; font-size: 20px;
  padding: 6px 18px;
}
section .ccard .clabel {
  font-size: 13px; color: #AFA893; letter-spacing: 0.09em;
  padding: 8px 18px 1px;
}
section .ccard .crow { padding: 1px 18px; }
section .ccard .crow:last-child { padding-bottom: 11px; }

/* object card — the built thing (orange) */
section .ocard {
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 19px;
  background: #FFFFFF; border: 2px solid #E76F00; border-radius: 10px;
  overflow: hidden; color: #1E2833; flex: none;
}
section .ocard .ohead {
  display: flex; justify-content: space-between; gap: 26px;
  background: #FDEFD9; color: #B94E00; font-weight: 600; font-size: 17px;
  padding: 3px 16px;
}
section .ocard .ohead .oid { color: #C99B66; font-weight: 400; }
section .ocard .obody { padding: 7px 16px 8px; }
section .ocard .obody b { color: #B94E00; font-weight: 600; }

/* reference arrow — an orange line with a head; .tail adds the anchor
   dot that sits INSIDE a variable box ("the box holds the arrow") */
section .arr { position: relative; width: 86px; height: 3px; background: #E76F00; flex: none; }
section .arr::after {
  content: ''; position: absolute; right: -2px; top: -6px;
  border-left: 11px solid #E76F00;
  border-top: 7px solid transparent; border-bottom: 7px solid transparent;
}
section .arr .alab {
  position: absolute; top: -26px; left: 50%; transform: translateX(-50%);
  font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 15px; color: #B94E00;
}
section .arr.tail { width: 120px; margin-left: -46px; }
section .arr.tail::before {
  content: ''; position: absolute; left: 0; top: -5.5px;
  width: 14px; height: 14px; border-radius: 50%; background: #E76F00;
}

/* variable box + name label */
section .vname {
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 21px;
  font-weight: 600; color: #33698C; flex: none;
}
section .rvar {
  min-width: 60px; min-height: 44px; padding: 7px 14px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 21px;
  font-weight: 600; color: #1E2833;
  background: #FFFFFF; border: 2px solid #33698C; border-radius: 9px; flex: none;
}
section .rvar.hold { min-width: 56px; }
section .vcell { display: flex; align-items: center; gap: 12px; }

/* layouts */
section .center { display: flex; flex-direction: column; align-items: center; gap: 6px; margin: 14px 0 0; }
section .factory { display: flex; align-items: center; margin: 22px 0 6px; }
section .factory .builds { display: flex; flex-direction: column; gap: 18px; }
section .factory .built { display: flex; align-items: center; }
section .factory .built .arr { margin: 0 4px 0 18px; }
section .refrow { display: flex; align-items: center; margin: 20px 0 8px; }
section .refrow .legend { margin-left: 24px; }
section .alias {
  display: grid; grid-template-columns: auto auto auto;
  gap: 18px 0; align-items: center; justify-content: start;
  margin: 18px 0 4px;
}
section .alias .ocard { grid-row: 1 / span 2; grid-column: 3; align-self: center; }
section .duo { display: flex; align-items: center; gap: 56px; margin: 18px 0 4px; }
section .duo .alias, section .duo .refrow { margin: 0; }

/* constructor chain */
section .chain { display: flex; align-items: center; margin: 20px 0 6px; }
section .chain .step {
  background: #FFFFFF; border: 2px solid #33698C; border-radius: 10px;
  padding: 9px 14px; font-size: 17px; line-height: 1.35; flex: 1; min-width: 0;
  text-align: center; color: #1E2833;
}
section .chain .step .stepnum {
  display: block; font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 14px; color: #E76F00; font-weight: 700; letter-spacing: 0.06em;
}
section .chain .step.go {
  border-color: #E76F00; background: #FDEFD9; color: #B94E00;
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 19px; flex: none;
}
section .chain .arr { width: 38px; margin: 0 6px 0 2px; }

/* this-disambiguation tokens */
section .tokrow {
  display: flex; align-items: flex-start; justify-content: center; gap: 14px;
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 28px;
  margin: 18px 0 2px;
}
section .tok { display: flex; flex-direction: column; align-items: center; gap: 7px; }
section .tok .tchip { padding: 4px 16px; border-radius: 8px; border: 2px solid; }
section .tok.tfield .tchip { border-color: #33698C; background: #EAF1F7; color: #33698C; }
section .tok.tparam .tchip { border-color: #E76F00; background: #FDEFD9; color: #B94E00; }
section .tok .tlab {
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px; color: #46536B; max-width: 280px; text-align: center; line-height: 1.3;
}
section .tokrow .teq { padding-top: 6px; color: #1E2833; }
</style>

<!-- _class: lead -->
<!-- _paginate: false -->

<span class="kicker">// week 02 · classes and objects · object-oriented computing</span>

# Classes and Objects

<div class="tyrow">
<div class="tychip">int</div>
<div class="tychip">double</div>
<div class="tychip">boolean</div>
<div class="tychip">String</div>
<div class="dots">…</div>
<div class="tychip mint">Student</div>
</div>

Java's built-in types — and the one you're about to mint.

---

<!-- Speaker notes: ~0:00. Cold open. Let them feel the absurdity of six loose variables before the reveal lands. -->

## The type Java doesn't give you

- You're hired to build ATU's student-records system. Java hands you its types: `int`, `double`, `boolean`, `char`… and `String`.
- One student, stored the only way you know how:

```java
String name1 = "Ada Lovelace";
int age1 = 20;
double gpa1 = 3.90;

String name2 = "Linus Torvalds";
int age2 = 22;
double gpa2 = 3.40;
```

* Six variables. Zero students. Nothing in the program says these belong together.
* Try declaring the thing you actually mean — `int student`? Nonsense. **Java has no Student type.**
* So today we do something new. When Java's types run out, **you mint your own.**

---

## The fix — five lines that invent a type

```java
class Student {
    String name;
    int age;
    double gpa;
}
```

- After these five lines, `Student` is a real type — the compiler treats it with the same respect as `int` or `String`.
- You can declare a `Student` variable, pass a `Student` to a method, and even build a whole array of them.
- One variable now carries a complete student: name, age and GPA travel as a unit.

<div class="tyrow">
<div class="tychip">int</div>
<div class="tychip">double</div>
<div class="tychip">boolean</div>
<div class="tychip">String</div>
<div class="dots">…</div>
<div class="tychip mint">Student</div>
</div>

<p class="legend">the built-in types — and the one you just added</p>

---

## Agenda

- Classes — minting your own types: fields, methods, members
- Objects — instances, `new`, and the dot
- References — the arrow inside every object variable
- Constructors — giving objects their values at birth
- `this` — the object's own name for itself
- Designing a class — the benefits, and one job per class (SRP)

---

<!-- Speaker notes: ~0:05. Context beat. The Hello World reveal usually earns a small "ohh" — pause on it. -->

## You've been inside a class all along

- Java is an **object-oriented** language: programs are built from *objects* — bundles of data plus behaviour — and every object is stamped out from a *class*.
- Which is why even Hello World refused to run without this line:

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, world");
    }
}
```

- Until today, `class Main` was ceremony you typed on faith. It was Java insisting: *all code lives inside a class.*
- And the types you've been borrowing? `String`, `System`, `Scanner` — every one is a class somebody else wrote. Today you find out how they did it.

---

## What is a class?

- A class is a **blueprint for objects**. It fixes two lists:
  - what every object of it **knows** — its **fields** (data)
  - what every object of it **does** — its **methods** (operations)
- A real-world `Car`: every car has *some* top speed, fuel level and maker, and every car can drive and refuel. The class pins down the **kinds of facts**; each object will hold its **own actual facts**.

<div class="center">
<div class="ccard">
<div class="chead">class Car</div>
<div class="clabel">FIELDS — WHAT A CAR KNOWS</div>
<div class="crow">int topSpeed</div>
<div class="crow">double fuelLevel</div>
<div class="crow">String manufacturer</div>
<div class="clabel">METHODS — WHAT A CAR DOES</div>
<div class="crow">drive()&nbsp;&nbsp;refuel()</div>
</div>
<p class="legend">the blueprint names the parts — it contains no actual car</p>
</div>

---

## The same blueprint, in Java

<!-- _class: code-sm -->

```java
class Car {
    // fields — what every Car knows
    int topSpeed;
    double fuelLevel;
    String manufacturer;

    // methods — what every Car can do
    void drive() {
        System.out.println("Driving...");
    }
    void refuel() {
        fuelLevel = 100.0;
    }
}
```

- Fields and methods together are the class's **members**. Fields also answer to *instance variables* and *attributes* — three names, one idea.
- Notice `refuel()` writes `fuelLevel` with no dot and no setup: inside the class, **your own fields are simply in scope**.

---

## Declaring a class — the rules of the road

```java
class ClassName {
    // fields  — the data
    // methods — the operations on that data
}
```

- The `class` keyword tells the compiler: *here is a new type, with this name; everything inside the braces is its members.*
- Naming is **PascalCase**: `Student`, `BankAccount`, `HttpRequest`. Types start with a capital, variables don't — that capital is how you read code at a glance.
- One public class per file, and the file name must match: `Student` lives in `Student.java`.
- A class declaration costs nothing at run time — it's pure **compile-time** structure. Objects are the run-time half of the story…

---

<!-- Speaker notes: ~0:13. THE diagram of the week. Point at each arrow and say "new" out loud three times. -->

## What is an object?

- An object is an **instance** of a class: one actual thing, built from the blueprint at run time.
- Write the class **once** — build as **many** objects as you like. Each object gets its **own copy of every field**; the method code lives in the class, shared by all.

<div class="factory">
<div class="ccard">
<div class="chead">class Student</div>
<div class="clabel">FIELDS</div>
<div class="crow">String name</div>
<div class="crow">int age</div>
<div class="crow">double gpa</div>
<div class="clabel">METHODS</div>
<div class="crow">introduce()</div>
</div>
<div class="builds">
<div class="built"><div class="arr"><span class="alab">new</span></div><div class="ocard"><div class="ohead">Student <span class="oid">@2fa4</span></div><div class="obody">name = <b>"Ada"</b> · age = <b>20</b> · gpa = <b>3.9</b></div></div></div>
<div class="built"><div class="arr"><span class="alab">new</span></div><div class="ocard"><div class="ohead">Student <span class="oid">@91cd</span></div><div class="obody">name = <b>"Linus"</b> · age = <b>22</b> · gpa = <b>3.4</b></div></div></div>
<div class="built"><div class="arr"><span class="alab">new</span></div><div class="ocard"><div class="ohead">Student <span class="oid">@7e03</span></div><div class="obody">name = <b>"Grace"</b> · age = <b>21</b> · gpa = <b>3.7</b></div></div></div>
</div>
</div>

<p class="legend">one blueprint · three builds · the road from class to object is always new</p>

---

<!-- Speaker notes: ~0:17. Verbs beat — say create/instantiate/construct out loud; MCQs use all three. -->

## Building one — the new keyword

<!-- _class: code-sm -->

```java
class Car {
    double fuelLevel;
    String manufacturer;
}

Car myCar = new Car();            // build one Car object
myCar.manufacturer = "Toyota";    // the dot reaches inside
myCar.fuelLevel = 55.5;
System.out.println(myCar.manufacturer);   // Toyota
```

- Read the birth line in two halves: `new Car()` **builds the object**; `Car myCar` declares a variable of your new type to keep hold of it.
- `myCar.fuelLevel` — *the dot* — reaches into **that particular object's** copy of the field.
- You'll hear *create*, *instantiate* and *construct* — three verbs, all meaning this one line.
* And the parentheses in `new Car()`? That's a **call** to something. Hold the thought — it pays off at half past.

---

## Predict: what prints?

<!-- _class: code-sm -->

```java
class Car {
    int topSpeed;
}

Car a = new Car();
Car b = new Car();
a.topSpeed = 200;

System.out.println(b.topSpeed);
System.out.println(a.topSpeed);
```

* `0` — `b` is its **own object**. Setting `a`'s field touches nothing in `b`.
* `200` — each object carries its own copy of every field.
* Why `0` and not garbage? Unset fields get their type's **default**: numbers `0`, `boolean` `false`, object types `null`. (Remember that `null` — it returns in twenty minutes.)

---

## Blueprint vs building

|  | Class | Object |
|---|---|---|
| What it is | the blueprint | one actual instance |
| How many | written **once** | `new`-ed as often as you like |
| Exists at | **compile time**, in `Student.java` | **run time**, in memory |
| Contains | field *names* + method *code* | field *values* — its own copies |
| Comes from | `class Student { ... }` | `new Student()` |

<div class="callout"><strong>Blueprint vs building.</strong> Nobody lives in an architect's drawing. <code>class Student</code> houses no one — every <code>new</code> raises a building. Keep those two ideas separate and half of OOP falls into place.</div>

---

<!-- Speaker notes: ~0:22. The deepest idea of the hour — slow right down. This arrow model must stick for good. -->

## What's inside the variable?

- When `new` runs, the object is built somewhere in **memory**. What lands in your variable is *not the object* — it's a **reference**: an arrow pointing to it.

<div class="refrow">
<div class="vcell"><span class="vname">myCar</span><div class="rvar hold"></div></div>
<div class="arr tail"></div>
<div class="ocard"><div class="ohead">Car <span class="oid">@2fa4</span></div><div class="obody">fuelLevel = <b>55.5</b></div></div>
<span class="legend">object variable — the box holds an arrow</span>
</div>

<div class="refrow">
<div class="vcell"><span class="vname">n</span><div class="rvar">42</div></div>
<span class="legend">primitive variable — the box holds the value itself</span>
</div>

<div class="callout"><strong>The variable holds the arrow, not the object.</strong> Say it until it's boring. It explains assignment, <code>==</code>, <code>null</code>, and every surprise arrays will ever throw at you.</div>

- `null` now has an exact meaning: a box whose arrow **points at nothing**. Following a null arrow is the `NullPointerException` from Predict 1.

---

## Copying a variable copies the arrow

<!-- _class: code-sm -->

```java
class Student {
    String name;
}

Student s1 = new Student();
Student s2 = s1;               // copies the ARROW — builds nothing
s2.name = "Grace";
System.out.println(s1.name);   // Grace
```

<div class="alias">
<div class="vcell"><span class="vname">s1</span><div class="rvar hold"></div></div>
<div class="arr tail"></div>
<div class="ocard"><div class="ohead">Student <span class="oid">@2fa4</span></div><div class="obody">name = <b>"Grace"</b></div></div>
<div class="vcell"><span class="vname">s2</span><div class="rvar hold"></div></div>
<div class="arr tail"></div>
</div>

<p class="legend">two variables · two arrows · ONE object</p>

- `=` between object variables copies the arrow, never the object. `new` appears once, so exactly one object exists.
- Change the object through either arrow — there is only one object to change.

---

## Object identity vs reference variables

<!-- _class: code-sm -->

```java
class Student {
    String name;
}

Student s1 = new Student();   // a new house
Student s2 = new Student();   // another new house
Student s3 = s1;              // no house — a copied Eircode
```

<div class="duo">
<div class="alias">
<div class="vcell"><span class="vname">s1</span><div class="rvar hold"></div></div>
<div class="arr tail"></div>
<div class="ocard"><div class="ohead">Student <span class="oid">@2fa4</span></div><div class="obody">name = <b>null</b></div></div>
<div class="vcell"><span class="vname">s3</span><div class="rvar hold"></div></div>
<div class="arr tail"></div>
</div>
<div class="refrow">
<div class="vcell"><span class="vname">s2</span><div class="rvar hold"></div></div>
<div class="arr tail"></div>
<div class="ocard"><div class="ohead">Student <span class="oid">@91cd</span></div><div class="obody">name = <b>null</b></div></div>
</div>
</div>

<p class="legend">three variables · two objects — count the new calls, not the variable names</p>

- Every `new` builds an object with its own **identity** — its own place in memory (the `@` tags). Identical contents never merge two objects into one.
- A reference variable is a **slip of paper with the Eircode on it**. Copying the slip (`s3 = s1`) builds nothing; the house doesn't notice.

---

## Predict: what prints?

<!-- _class: code-sm -->

```java
class Box {
    int size;
}

Box a = new Box();
Box b = a;
Box c = new Box();
b.size = 99;
c.size = 99;

System.out.println(a.size);
System.out.println(a == b);
System.out.println(a == c);
```

* `99` — `a` and `b` are two arrows to **one** Box: write through `b`, see it through `a`.
* `true` — `==` on object types compares **arrows, not contents**. Same object, so `true`.
* `false` — `c` came from its **own** `new`. Equal contents, different identity — and `==` only ever asks about identity.

---

<!-- Speaker notes: ~0:31. Constructors movement. Lead with the pain: half-built objects escaping into the program. -->

## The newborn-object problem

<!-- _class: code-sm -->

- Right now every object is born blank — all defaults — and we furnish it line by line:

```java
class Student {
    String name;
    int age;
    double gpa;
}

Student s = new Student();   // born: name null, age 0, gpa 0.0
s.name = "Ada Lovelace";     // three separate steps...
s.age = 20;                  // ...and nothing forces us
s.gpa = 3.90;                // to finish the job
```

* Forget one line and a half-built student escapes — that `null` name detonates **later, somewhere else**, as a `NullPointerException`.
* What we want: hand the values over **at the moment of birth**, inside the `new` line itself.
* Java's tool for exactly that: the **constructor**.

---

## Constructors — code that runs at birth

```java
class Puppy {
    String name;

    Puppy(String puppyName) {   // the constructor: runs during
        name = puppyName;       // new, before anyone else can
    }                           // touch the object
}
```

<div class="chain">
<div class="step go">new Puppy("Rex")</div>
<div class="arr"></div>
<div class="step"><span class="stepnum">1 — ALLOCATE</span>memory reserved; every field at its default</div>
<div class="arr"></div>
<div class="step"><span class="stepnum">2 — CONSTRUCT</span>your constructor body runs</div>
<div class="arr"></div>
<div class="step"><span class="stepnum">3 — HAND BACK</span>the arrow to the finished object is returned</div>
</div>

- So `Puppy p = new Puppy("Rex");` allocates, initialises and connects in one move — no blank-object window, ever.

---

## A constructor is not a method

| A method… | A constructor… |
|---|---|
| declares a return type (`void` counts) | has **no return type — not even void** |
| takes any name you like | is named **exactly** after its class |
| runs whenever you call it | is called **by `new`**, automatically, at birth |
| is a member of the class | formally isn't — Java's spec keeps them apart |

- Spotting one in code: *class name + parameter list + no return type* = constructor.
* The classic trap: write `void Puppy() { ... }` and you've made a legal, useless **method** that happens to share the class's name — `new` will never call it.

---

## Two constructors — and the gift rule

<!-- _class: code-sm -->

```java
class Puppy {
    String name;

    Puppy() {                         // no-arg constructor
        name = "unnamed";
    }

    Puppy(String puppyName) {         // parameterised constructor
        name = puppyName;
    }
}
```

- Both can live in one class — same name, different parameter lists. (That trick is called *overloading*.)
- **The gift:** declare no constructor at all, and the compiler quietly writes you a **default constructor** — no-arg, empty, invisible.
- **The catch:** declare *any* constructor yourself, and *the gift is withdrawn*.

---

## Predict: does this compile?

<!-- no-compile -->
```java
class Puppy {
    String name;

    Puppy(String puppyName) {
        name = puppyName;
    }
}

Puppy p = new Puppy();     // <-- this line
```

* **No.** `constructor Puppy in class Puppy cannot be applied to given types` — there is no no-arg constructor to call.
* We declared a constructor, so the compiler's default was withdrawn. `new Puppy()` now points at nothing.
* Silver lining: it fails at **compile time** — the safest possible place to fail. Fix: `new Puppy("Rex")`, or write a no-arg constructor yourself.

---

<!-- Speaker notes: ~0:40. The shadowing trap. This slide is the setup; `this` on the next is the payoff. -->

## Two things named age

- A parameter's most honest name is usually the field's name. Try it:

```java
class Cat {
    int age;              // the field

    Cat(int age) {        // the parameter — same name.
        age = age;        // ...which age is which?
    }
}
```

* Inside that constructor, **the nearest declaration wins**: every bare `age` means the *parameter*. The field is *shadowed*.
* So `age = age;` assigns the parameter **to itself**. The field silently stays `0`.
* And it compiles without a murmur. Predict 3 failed loudly at compile time; this bug says nothing and ships. **We need a way to name the field.**

---

## this — the object's arrow to itself

- Inside every constructor and instance method, Java hands you a ready-made reference: `this` — **an arrow to the object currently being worked on**.
- A parameter can shadow the bare name; it can never shadow `this.age` — that **always** means the field:

```java
class Cat {
    int age;
    Cat(int age) {
        this.age = age;   // field = parameter. Says what it means.
    }
}
```

<div class="tokrow">
<div class="tok tfield"><div class="tchip">this.age</div><div class="tlab">the field — this object's own box</div></div>
<div class="teq">=</div>
<div class="tok tparam"><div class="tchip">age</div><div class="tlab">the parameter — nearest name wins</div></div>
<div class="teq">;</div>
</div>

- `this.x = x;` is *the* constructor idiom — you'll type it for years. And it works in any method, not just constructors.

---

<!-- Speaker notes: ~0:45. The payoff build. Point back at the hook slide explicitly. -->

## Putting it together — Student, for real

<!-- _class: code-sm -->

```java
public class Student {
    private String name;    // private: only this class touches
    private int age;        // these directly — a discipline
    private double gpa;     // called encapsulation

    public Student(String name, int age, double gpa) {
        this.name = name;
        this.age = age;
        this.gpa = gpa;
    }

    public String getName() {
        return name;
    }
    public double getGpa() {
        return gpa;
    }
}
```

- Everything from this hour in one file: fields, a parameterised constructor, the `this.x = x` idiom, and two small methods. This is the shape of every class you'll write from now on.

---

## The payoff

<!-- no-compile -->
```java
public class Main {
    public static void main(String[] args) {
        // Student.java from the previous slide sits beside this file
        Student ada = new Student("Ada Lovelace", 20, 3.90);
        Student linus = new Student("Linus Torvalds", 22, 3.40);

        System.out.println(ada.getName() + " — GPA " + ada.getGpa());
        System.out.println(linus.getName() + " — GPA " + linus.getGpa());
    }
}
```

- Compare the hook: six loose variables are now **two complete students, one line each** — impossible to half-build, because the constructor demands all three values.
- The compiler now works *for* you: `new Student("Ada")` alone is a **compile-time error** — wrong parameter list. Your type is as protected as `int`.

---

<!-- Speaker notes: ~0:49. Design close — lighter tempo. Land SRP as a habit, not a definition to memorise. -->

## Why classes? The four wins

- **Build upward** — complex types from simple ones: a `Student` is Strings and numbers; a `Module` can hold Students; a `University` holds Modules. Towers of types, all yours.
- **Compartmentalise** — everything about students lives in one file. A bug in student logic has one address.
- **Reuse** — write the class once, `new` forever; carry it into your next application as a ready-made component.
- **Maintain** — change how the GPA is stored, and code using `getGpa()` never notices. Classes absorb change.

---

## One class, one job

- The **Single Responsibility Principle (SRP)**: a class should have **one, and only one, responsibility** — and every field and method should serve it.

```java
class Student {
    String name;
    double gpa;

    void printDetails()      { }   // fine — that's student business
    void connectToDatabase() { }   // storage's job, not the Student's
    void emailLecturer()     { }   // a mail system's job
}
```

- The test: state the class's job in one sentence **without the word "and"**. If you can't, it's two classes wearing one name — split them.
- Why it pays: a one-job class changes for one reason, tests one way, and can be reused whole. Let SRP quietly guide every class you write in the labs.

---

<!-- Speaker notes: ~0:53. Final predict — a recall of the shadowing trap. Let them argue before revealing. -->

## Predict: what prints?

```java
class Counter {
    int count;

    Counter(int count) {
        count = count;      // look closely...
    }
}

Counter c = new Counter(5);
System.out.println(c.count);
```

* `0` — not `5`.
* `count = count` assigns the parameter **to itself** — the nearest declaration wins on *both* sides of the `=`. The field is never touched, so it keeps its default.
* It compiles in silence — the bug from "two things named age", back already. One word repairs it: `this.count = count;`

---

## Where this goes

- **Methods, the deep dive:** parameters, return values, and overloading for real (you met it today in those twin `Puppy` constructors).
- **Arrays,** with a twist you're now equipped for: *arrays are objects*. `int[] b = a;` copies… an arrow. You'll draw today's diagram again.
- **Strings:** objects too — including why `==` on Strings betrays you. You already know the answer.
- **The OOP pillars:** encapsulation, inheritance, polymorphism, abstraction. Every one is a story about classes and objects; today was the foundation stone.
- **Lab exercise:** build and break all of it — classes, `new`, constructors, `this`, and the `==` traps.

---

## Summary

- A class **mints a new type**: fields (what its objects know) + methods (what they do) are its **members**. The class is compile-time blueprint; objects are its run-time instances — one per `new`, each with its own field values.
- **The variable holds the arrow, not the object.** Assignment copies arrows, `==` compares arrows, identity belongs to the object — count objects by counting `new`s.
- A constructor runs at birth: allocate (defaults) → construct (your code) → hand back the arrow. No return type, named after the class — and declaring any constructor withdraws the compiler's default one.
- `this` is the object's arrow to itself: `this.x = x;` defeats shadowing and is the constructor idiom.
- Design rule: **one class, one responsibility** (SRP).
