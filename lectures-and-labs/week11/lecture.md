---
marp: true
theme: ooc
paginate: true
transition: fade
title: "Abstraction"
topic: abstraction
type: lecture
source: authored
---

<style>
/* Deck-local visual system: contract & class cards, drawn in CSS - no images.
   Visual grammar: SOLID = machinery included · DASHED = signature only. */
section .card-row {
  display: flex; gap: 30px; justify-content: center; align-items: flex-start;
  margin: 24px 0 10px 0;
}
section .ccard {
  min-width: 240px; background: #FFFFFF;
  border: 2px solid #33698C; border-radius: 10px;
  font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 19px; color: #1E2833; overflow: hidden;
}
section .ccard .hdr {
  padding: 8px 18px; border-bottom: 2px solid #33698C;
  font-weight: 600; color: #33698C; background: #EFF4F8;
}
section .ccard .m { padding: 7px 18px 6px 18px; }
section .ccard .m.hollow {
  margin: 6px 12px; padding: 4px 10px;
  border: 2px dashed #E76F00; border-radius: 7px;
  background: #FDEFD9; color: #B94E00;
}
section .ccard.iface { border-style: dashed; border-color: #E76F00; background: #FFFBF2; }
section .ccard.iface .hdr {
  border-bottom-style: dashed; border-bottom-color: #E76F00;
  color: #B94E00; background: #FDEFD9;
}
section .ccard.ghost { border-color: #C9C2B2; background: #F6F4EE; color: #8B8471; }
section .ccard.ghost .hdr { border-bottom-color: #C9C2B2; color: #8B8471; background: #EFECE3; }
section .contract-fig { margin: 22px 0 8px 0; }
section .contract-fig .card-row { margin: 0; }
section .impl-row { display: flex; gap: 44px; justify-content: center; }
section .impl { display: flex; flex-direction: column; align-items: center; }
section .impl .stem { width: 0; height: 28px; border-left: 3px dashed #E76F00; }
section .pillars { display: flex; gap: 18px; margin: 24px 0 12px 0; }
section .pillars .pill {
  flex: 1; text-align: center; padding: 13px 6px 11px 6px;
  background: #FFFFFF; border: 2px solid #33698C; border-radius: 10px;
  font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 21px; color: #33698C;
}
section .pillars .pill small {
  display: block; font-size: 15px; color: #8B8471; margin-top: 3px;
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-weight: 400;
}
section .pillars .pill.today { background: #FDEFD9; border-color: #E76F00; color: #B94E00; font-weight: 600; }
section .pillars .pill.today small { color: #B94E00; }
section .choose { display: flex; flex-direction: column; gap: 13px; margin: 22px 0 10px 0; }
section .choose .opt {
  display: grid; grid-template-columns: minmax(0, 1.5fr) auto minmax(0, 0.5fr);
  gap: 20px; align-items: center;
  background: #FFFFFF; border: 1px solid #DED8C9; border-radius: 10px;
  padding: 11px 20px; font-size: 21px; color: #46536B;
}
section .choose .opt .verdict {
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 20px; font-weight: 600;
  padding: 6px 14px; border-radius: 8px; text-align: center; white-space: nowrap;
}
section .choose .opt .v-conc { border: 2px solid #33698C; color: #33698C; background: #EFF4F8; }
section .choose .opt .v-abs { border: 2px solid #33698C; border-bottom: 3px dashed #E76F00; color: #33698C; background: #FFFFFF; }
section .choose .opt .v-int { border: 2px dashed #E76F00; color: #B94E00; background: #FDEFD9; }
section .choose .opt .ex {
  font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 18px; color: #8B8471; text-align: right;
}
section.lead .ccard { background: rgba(255,255,255,0.07); border-color: #E7975A; color: #F4F1E8; }
section.lead .ccard .hdr { background: rgba(231,111,0,0.18); border-bottom-color: #E7975A; color: #F0B26B; }
</style>

<!-- _class: lead -->
<!-- _paginate: false -->

<span class="kicker">// abstraction · object-oriented computing</span>

# Abstraction

<div class="card-row">
<div class="ccard iface">
<div class="hdr">what the driver sees</div>
<div class="m">accelerate();</div>
<div class="m">brake();</div>
<div class="m">steer(angle);</div>
</div>
</div>

Hide the machinery. Expose the contract.

---

<!-- Speaker notes: ~0:00. Cold open, no agenda yet. Ask the room: hands up if you checked your spark timing on the way in. Let the final fragment land in silence before advancing. -->

## How did you get here this morning?

- You (or your bus driver) operated a machine of roughly **30,000 parts** - at speed, in traffic, legally.
- Combustion timing? Fuel-air ratios? The clutch's friction curve?

* You used **pedals and a wheel**.
* You have never once watched your engine run. You drove anyway. Everyone does.
* The car exposes a **contract**; the engine is the **implementation** you never see.
* You depended on the contract, not the machinery. **That idea has a name.**

---

## The big idea

- **Abstraction** - hide the implementation details; expose only what callers need.

<div class="card-row">
<div class="ccard iface">
<div class="hdr">the contract - you see this</div>
<div class="m">accelerate();</div>
<div class="m">brake();</div>
<div class="m">steer(angle);</div>
</div>
<div class="ccard ghost">
<div class="hdr">the machinery - you never do</div>
<div class="m">spark timing · fuel maps</div>
<div class="m">torque curves · 30,000 parts</div>
</div>
</div>

<p class="legend">you drive against the left card - engineers may replace the right card at will</p>

* Petrol became electric: the machinery was **replaced wholesale** - the pedals didn't move.
* This hour: how Java lets **your classes** make the same offer.

---

## Agenda

- Where abstraction fits - the four pillars
- Abstraction in code - and versus encapsulation
- Tool 1: `abstract` classes and methods - half-built on purpose
- Tool 2: interfaces - the pure contract
- Choosing: concrete vs abstract vs interface
- Benefits - and completing the set

---

<!-- Speaker notes: ~0:06. Arc moment - four pillars were promised; this is the last one. Milk the "set complete" beat, it pays off again on the summary slide. -->

## The four pillars - completing the set

- OOP makes a promise: it stands on **four pillars**. Three are already yours:

<div class="pillars">
<div class="pill">Encapsulation<small>✓ collected</small></div>
<div class="pill">Inheritance<small>✓ collected</small></div>
<div class="pill">Polymorphism<small>✓ collected</small></div>
<div class="pill today">Abstraction<small>today - the last one</small></div>
</div>

* Today we take the final pillar. **After this hour, the set is complete.**
* And you have used it all along - **every time you called a method without reading its source.**

---

## Abstraction, in code

- A full **method** carries its machinery - signature *and* body:

```java
public int add(int a, int b) {
    return a + b;
}
```

- Abstraction keeps only the **method signature** - what callers see, no body:

<!-- no-compile -->
```java
public int add(int a, int b);
```

<div class="callout"><strong>One line, two halves.</strong> The signature is the <strong>contract</strong>; the body is the <strong>machinery</strong>. Abstraction is the art of showing the first and hiding the second.</div>

---

## Abstraction vs encapsulation

* Both pillars **hide** - they differ in *what* they hide.
* **Encapsulation** hides **data**: `private` fields, reachable only through getters and setters.
* **Abstraction** hides **implementation**: method bodies, reachable only through signatures - built with abstract classes and interfaces.

<div class="callout"><strong>Same instinct, different target.</strong> Encapsulation guards the <strong>state</strong>. Abstraction guards the <strong>how</strong>.</div>

---

## You already trust abstraction

* **Remote control** - you press volume-up; the infrared protocol is not your problem.
* **Email** - you write and click send; the relays, queues and spam filters underneath stay invisible.
* **Calculator** - you press `÷` and read the answer; the division algorithm never shows itself.
* Each is a simple **interface** wrapped around **implementation you never see** - and you trust all three without a second thought.

---

## Java's two tools

- Java builds abstraction with two constructs - here is the rest of the hour in one picture:

<div class="card-row">
<div class="ccard">
<div class="hdr">abstract class</div>
<div class="m">stop() { ... }</div>
<div class="m hollow">fuelType();</div>
</div>
<div class="ccard iface">
<div class="hdr">interface</div>
<div class="m">draw();</div>
<div class="m">area();</div>
</div>
</div>

<p class="legend">solid = machinery included · dashed = signature only, machinery owed</p>

* **Tool 1 - the `abstract` keyword**: classes deliberately left half-built; subclasses finish them.
* **Tool 2 - interfaces**: contracts with no machinery at all; classes sign them and deliver.

---

<!-- Speaker notes: ~0:14. Tool 1 movement. The rules land across four slides - declaration, the mix, the punctuation, the chain. Keep naming the model: "half-built on purpose". -->

## Tool 1 - the abstract class

- The `abstract` keyword sits **before `class`** in the declaration:

```java
public abstract class Vehicle {
    // fields, constructors, methods -- just like any class
}
```

* Declaring a class `abstract` imposes **one rule**: it cannot be instantiated - to use it, another class must **inherit** it.

<!-- no-compile -->
```java
Vehicle v = new Vehicle();   // compile error: Vehicle is abstract
```

* An ordinary, instantiable class is a **concrete** class. `abstract` says: *don't build this one - build from it.*

---

## Half-built on purpose

- Inside, an abstract class **mixes finished and unfinished**:

<div class="card-row">
<div class="ccard">
<div class="hdr">abstract class Vehicle</div>
<div class="m">int wheels</div>
<div class="m">stop() { ... }</div>
<div class="m hollow">fuelType();</div>
<div class="m hollow">describe();</div>
</div>
</div>

<p class="legend">solid = built once, shared by every subclass · dashed = a blank the subclass must fill</p>

* It **may or may not** contain abstract methods - even with zero, it still cannot be instantiated.
* The dashed lines are **homework for subclasses** - and the compiler collects the homework.

---

## Abstract methods - read the punctuation

<!-- _class: code-sm -->

- An **abstract method** is a signature ending in a **semicolon** - no braces, no body:

```java
public abstract class Shape {
    public abstract double area();   // semicolon -- no body
}
```

- A **concrete method** ships with its machinery attached:

```java
public class Square {
    private double side;
    public double area() {
        return side * side;
    }
}
```

<div class="callout"><strong>Keyword order:</strong> <code>abstract</code> sits after the access modifier, before the return type. Then read the ending: <code>{ }</code> = built, <code>;</code> = a promise someone else must keep.</div>

---

## The homework rule

* Even **one** abstract method forces the whole class to be declared `abstract` - the compiler won't let a half-built class pose as finished.
* A subclass inheriting abstract methods has exactly two options: **implement them all**, or stay `abstract` and pass the homework down.
* The chain must end: **some descendant** eventually implements everything - or the family never produces a single object.

<!-- _class: code-sm -->

```java
abstract class A {
    abstract void m();
}
abstract class B extends A { }         // legal: B passes the homework on
class C extends B {                    // the chain ends -- C is concrete
    void m() { }
}
```

---

## Finding the abstraction

* A `Car` and a `Truck` differ in colour, shape, engine and purpose - that is what makes them distinct.
* Yet both have tyres, an engine, steering and gears; both travel; both are operated the same way.
* **What single concept keeps the shared part and drops the particulars?**
* **`Vehicle`** - the general idea of a car or a truck: it retains the common attributes and behaviour, and eliminates everything specific to one kind.

---

## Vehicle, in code

- Shared machinery lives **once** in the parent; every child fills in the blank:

<!-- _class: code-sm -->

```java
abstract class Vehicle {
    private int wheels = 4;                // every subclass object has one
    public void stop() {                   // shared code
        System.out.println("Braking...");
    }
    public abstract String fuelType();     // the blank every child fills
}

class Car extends Vehicle {
    public String fuelType() {
        return "petrol";
    }
}
class Truck extends Vehicle {
    public String fuelType() {
        return "diesel";
    }
}
```

- `Car` and `Truck` are concrete: homework done, `new` allowed.

---

<!-- Speaker notes: ~0:27. Predict beat, the first compile-error test of the hour. Expect a good share of the room to guess it compiles, reasoning that since nothing ever calls `area()` an empty body cannot hurt - that is a runtime mental model, and Java checks every concrete class finishes its inherited homework at compile time whether or not the method is ever invoked, which is exactly why the fence above it carries the `no-compile` marker. This is the direct payoff of the homework rule two slides back, and the same all-or-nothing rule resurfaces when interfaces demand every method be implemented too. -->

## Predict: does this compile?

<!-- no-compile -->
```java
abstract class Shape {
    public abstract double area();
}

class Triangle extends Shape {
    // nothing here yet
}
```

* **No.** `Triangle` inherited a blank and left it blank - *Triangle is not abstract and does not override abstract method area()*.
* Fix 1: give `Triangle` an `area()` body - homework done, concrete class.
* Fix 2: declare `Triangle` abstract too - and pass the homework to *its* subclasses.

---

<!-- Speaker notes: ~0:29. Tool 2 movement - the deeper half. The contract diagram is the signature visual of the deck; spend a full minute on it. -->

## Tool 2 - the interface

- Push abstraction to its limit: a type that is **all contract, no machinery**.

```java
public interface RemoteControl {
    void volumeUp();     // a semicolon and a promise
    void volumeDown();   // no braces anywhere in sight
}
```

* An interface is a **completely abstract class**: it contains **method signatures** (and, since Java 8, optional `default` methods with bodies - later).
* You can never instantiate one. Classes **implement** it; other interfaces **extend** it.
* It is a **contract**: any class that signs must deliver **every** method - which is also how interfaces power polymorphism.

---

## One contract, many machines

<div class="contract-fig">
<div class="card-row">
<div class="ccard iface">
<div class="hdr">interface Drawable</div>
<div class="m">draw();</div>
</div>
</div>
<div class="impl-row">
<div class="impl"><div class="stem"></div><div class="ccard"><div class="hdr">class Circle</div><div class="m">draw() { arcs }</div></div></div>
<div class="impl"><div class="stem"></div><div class="ccard"><div class="hdr">class ProgressBar</div><div class="m">draw() { bars }</div></div></div>
<div class="impl"><div class="stem"></div><div class="ccard"><div class="hdr">class ChessPiece</div><div class="m">draw() { glyphs }</div></div></div>
</div>
</div>

<p class="legend">dashed = the contract · solid = machinery · a stem means "implements"</p>

* The implementers are **unrelated** - no shared parent, nothing in common but the promise.
* Hold a `Drawable`, call `draw()` - **which machinery answers is not your problem.**

---

## Writing an interface down

```java
public interface ExampleInterface {
    double PI = 3.1415;              // implicitly public static final

    void method1();                  // implicitly public abstract
    public abstract void method2();  // identical meaning, spelled out
}
```

* Declared with the `interface` keyword - and like a class, it may be `public`.
* Constants are **implicitly `public static final`** - write one line, get all three for free.
* Methods are **implicitly `public abstract`** - both spellings above mean exactly the same thing.

---

## Signing the contract

<!-- _class: code-sm -->

- `implements` puts a class under contract:

```java
interface ExampleInterface {
    void method1();
    void method2();
}

public class ExampleClass implements ExampleInterface {
    @Override public void method1() {
        System.out.println("method 1");
    }
    @Override public void method2() {
        System.out.println("method 2");
    }
}
```

* The class must implement **all** the interface's abstract methods - with the **exact same signatures** - before it can be instantiated.

---

## The payoff - contracts are types

<!-- _class: code-sm -->

```java
interface Drawable {
    void draw();
}
class Circle implements Drawable {
    @Override public void draw() {
        System.out.println("Drawing a circle");
    }
}
class Demo {
    public static void main(String[] args) {
        Drawable d = new Circle();   // typed by the contract
        d.draw();                    // prints: Drawing a circle
    }
}
```

* The variable's type is the **contract**; the object behind it is the **machinery**.
* Swap in any other implementer tomorrow - this code does not change. *(Petrol to electric, again.)*

---

## Why interfaces exist

* A class `extends` **one** parent - but `implements` **as many interfaces as it likes**:

<!-- _class: code-sm -->

```java
interface Wearable {
    void wear();
}
interface Chargeable {
    void charge();
}

class Smartwatch implements Wearable, Chargeable {
    public void wear() {
        System.out.println("On the wrist");
    }
    public void charge() {
        System.out.println("Charging...");
    }
}
```

* Each `implements` is a **promise** - a contract the compiler enforces in full.
* And because contracts are types, interfaces are Java's cleanest route to **polymorphism**.

---

## What fits inside an interface

- Constants - implicitly `public static final`
- Method signatures - implicitly `public abstract`
- `default` methods - **with** a body *(Java 8+)*
- `static` methods - **with** a body *(Java 8+)*
- Nested types

<!-- _class: code-sm -->

```java
interface MediaPlayer {
    int MAX_VOLUME = 11;               // constant
    void play();                       // signature
    default void pause() {             // Java 8+
        System.out.println("Paused");
    }
    static String version() {          // Java 8+
        return "2.0";
    }
}
```

---

<!-- Speaker notes: ~0:41. Predict beat, and the one most likely to slip past as correct. Expect the room to say it compiles, since `Dog` defines a `speak()` with the right name, parameters and return type and reads as a normal override - the trap is that nothing about missing an access modifier looks wrong, because default access is legal Java everywhere else; only against a `public` interface contract does it become a silent narrowing the compiler will not allow. The fence carries the `no-compile` marker for exactly that reason, and a dropped `public` on an implementing method is a recurring, easy-to-miss mistake well beyond this one slide. -->

## Predict: spot the broken promise

- `Speaker` demands a `speak()` - and `Dog` delivers one. Or does it?

<!-- no-compile -->
```java
interface Speaker {
    void speak();
}

class Dog implements Speaker {
    void speak() {
        System.out.println("Woof");
    }
}
```

* **It does not compile.** Interface methods are implicitly **`public`** - `Dog`'s version has default access, and an override may never **weaken** access.
* The fix is one word: `public void speak()`.
* Rule of thumb: implementing methods are always **`public`**.

---

<!-- Speaker notes: ~0:43. Choosing movement - this is what assessments ask. The ledger fast, the decision card slow, the full map as a take-home reference. -->

<!-- _class: dense -->

<style scoped>table { font-size: 17px; } td, th { padding: 6px 12px 6px 4px; }</style>

## class vs interface - the ledger

| Aspect | Class | Interface |
|---|---|---|
| Keyword | `class` | `interface` |
| Instantiation | Yes - `new` creates objects | Never - implemented, not instantiated |
| Multiple inheritance | No - `extends` one class only | Yes - a class can `implements` many |
| Inheriting | `extends` a class, `implements` interfaces | `extends` other interfaces; never a class |
| Constructors | Yes | No |
| Member access | Any modifier | Implicitly `public` |
| Variables | Any kind | Implicitly `public static final` |
| Methods | Concrete (abstract only in `abstract` classes) | Implicitly abstract *(Java 8+: `default` / `static` bodies)* |

---

## Choosing - the decision card

<div class="choose">
<div class="opt"><span>A <strong>finished thing</strong>, ready to build and use?</span><span class="verdict v-conc">concrete class</span><span class="ex">Car · User</span></div>
<div class="opt"><span><strong>Close relatives</strong> sharing state and code - but the base idea is too vague to exist alone?</span><span class="verdict v-abs">abstract class</span><span class="ex">Animal</span></div>
<div class="opt"><span>A <strong>capability</strong> that unrelated classes can adopt?</span><span class="verdict v-int">interface</span><span class="ex">Flyable</span></div>
</div>

<p class="legend">a generic "animal" can't exist, but every Dog reuses its machinery · Flyable fits Bird, Airplane, Superman</p>

* Need behaviour from **multiple sources**? Only interfaces stack - `extends` one, `implements` many.
* Want to ship **default behaviour and instance fields** with the type? Abstract class - its home turf.
* Defining a **type for anyone**, anywhere in any hierarchy? That is the interface's whole job.

---

<!-- _class: dense -->

<style scoped>table { font-size: 15px; } td, th { padding: 5px 10px 5px 4px; }</style>

## The full map

| Feature | Concrete class | Abstract class | Interface |
|---|---|---|---|
| Definition | Standard class, fully built | Declared `abstract` - deliberately unfinished | A pure contract of behaviour |
| Instantiation | Yes - `new Student()` | No - never directly | No - never directly |
| Methods | All have bodies | Mix of abstract and concrete | Implicitly abstract *(Java 8+: `default` / `static` bodies)* |
| Inheritance limit | `extends` one class | `extends` one class | A class can `implements` many - multiple inheritance of type |
| Variables (state) | Any kind | Instance fields allowed - can hold state | Implicitly `public static final` - constants only |
| Constructors | Yes | Yes - run by subclasses via `super()` | No |
| Access modifiers | Any | Any | Implicitly `public` *(Java 9+: `private` helpers)* |
| Keyword | `class Name` | `abstract class Name` | `interface Name` |
| Relationship | *is-a* | *is-a* (partially built) | *can-do* - a capability: `Runnable`, `Serializable` |

---

<!-- Speaker notes: ~0:51. Predict beat that ties the hour together: one snippet combines the Tool 1 instantiation rule with Tool 2 contract polymorphism. Expect line 1 to slip through anyway: it has almost the same surface shape as line 2 right below it (`Vehicle` on the left, `new` on the right), and the one fact that makes it illegal - that `Vehicle` was declared `abstract` - is stated only in the prose above the fence, nowhere in the code itself. Lines 3 and 4 directly replay the earlier contracts-are-types slide, and the whole fence carries the `no-compile` marker because line 1 alone is enough to fail compilation, even though lines 2 to 4 are individually fine. -->

## Predict: which lines compile?

- `Vehicle` is abstract, `Car` extends it; `Circle` implements `Drawable`:

<!-- no-compile -->
```java
Vehicle v = new Vehicle();   // line 1
Vehicle c = new Car();       // line 2
Drawable d = new Circle();   // line 3
d.draw();                    // line 4
```

* Line 1 - **compile error**: `Vehicle` is abstract; a half-built thing cannot be built.
* Line 2 - **fine**: `Car` is concrete, and a parent type can hold any of its children.
* Lines 3 and 4 - **fine**: a contract type holding an implementer. Prints `Drawing a circle`.

---

<!-- Speaker notes: ~0:54. Benefits at pace - the electric-car callback does the heavy lifting. Then land the summary: the four-pillar strip returns, fully lit. -->

## Why abstraction wins

* **Less complexity, easier maintenance** - callers read three signatures, not three hundred lines; frequently changing machinery is separated from the stable contract.
* **The Open/Closed principle** - *open* to extension: add new implementers any time; *closed* to modification: code depending only on the contract never needs editing. That is the petrol-to-electric swap.
* **Class-level protection** - what `private` does for a field, `abstract` does for a whole class: it protects the class from wrong use.
* **Safety** - the compiler enforces the story end to end: no instantiating half-built classes, no signing a contract without delivering every method.

---

## Summary

<div class="pillars">
<div class="pill today">Encapsulation<small>hide the data</small></div>
<div class="pill today">Inheritance<small>share what's common</small></div>
<div class="pill today">Polymorphism<small>one call, many forms</small></div>
<div class="pill today">Abstraction<small>hide the machinery</small></div>
</div>

- **The set is complete** - encapsulation hides your data, inheritance shares what's common, polymorphism lets one call take many forms, and abstraction hides the machinery behind a contract.
- An `abstract` class is **half-built on purpose**: concrete methods are shared, abstract ones (`;`, no braces) are homework - and nobody gets `new` until a descendant finishes all of it.
- An **interface is all contract**: methods implicitly `public abstract`, constants implicitly `public static final` - and one class can sign many.
- **Choosing**: finished thing → concrete class · close relatives sharing state and defaults → abstract class · one capability for unrelated classes → interface.
- Above all: **depend on the contract, not the machinery** - it is why petrol and electric drive exactly the same.
