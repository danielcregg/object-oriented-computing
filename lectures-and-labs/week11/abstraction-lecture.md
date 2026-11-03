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
/* Deck-local diagrams, all drawn in CSS (no images): the title's method,
   split into its signature and its hidden body; the abstract class Animal
   above its two subclasses; the four-pillars strip; and code set in two
   columns. The shared components (.callout/.legend/.kicker) come from the
   theme. Colours: blue = a class, dashed orange = an abstract method (a
   signature with no body), green = code that compiles, red = code the
   compiler rejects. */

/* title slide: one method, its signature shown and its body hidden */
section .hero { width: 900px; margin: 24px 0 0 0; }
section .hero .h-pill { display: flex; border: 3px solid #FFFFFF; border-radius: 999px; overflow: hidden; }
section .hero .h-sig, section .hero .h-body {
  padding: 18px 12px; text-align: center;
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 22px;
}
section .hero .h-sig { flex: 1.3; background: #FDEFD9; color: #B94E00; font-weight: 600; }
section .hero .h-body { flex: 1; color: #7F95A8; border-left: 3px dashed #7F95A8; }
section .hero .h-notes { display: flex; }
section .hero .h-notes div { text-align: center; font-size: 17px; color: #A9B6C4; line-height: 1.35; }
section .hero .h-notes div:first-child { flex: 1.3; }
section .hero .h-notes div:last-child { flex: 1; }
section .hero .h-notes b { display: block; font-size: 20px; color: #FFFFFF; }
section .hero .h-arrow { display: block; text-align: center; color: #E76F00; font-size: 28px; line-height: 1.15; }
section.lead .hero ~ p { max-width: 900px; margin-top: 26px; text-wrap: balance; }

/* a class drawn as a card: its name, then its methods */
section .card {
  background: #FFFFFF; border: 2px solid #33698C; border-radius: 10px; overflow: hidden;
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 19px; color: #1E2833;
}
section .card .hdr { padding: 7px 18px; border-bottom: 2px solid #33698C; font-weight: 600; color: #33698C; background: #EFF4F8; }
section .card .m { padding: 8px 18px; }
section .card .m.abs {
  margin: 8px 12px; padding: 4px 12px; border: 2px dashed #E76F00; border-radius: 7px;
  background: #FDEFD9; color: #B94E00;
}
section .card .m small { margin-left: 10px; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #8B8471; }

/* the fix slide: an abstract class above its subclasses, each with the
   verdict on creating an object of it */
section .tree { display: flex; flex-direction: column; align-items: center; margin: 16px 0 6px 0; }
section .tree .top { display: flex; align-items: center; gap: 30px; }
section .tree .down { margin: 4px 0; font-size: 17px; color: #8B8471; }
section .tree .down b { color: #33698C; font-size: 24px; font-weight: 400; margin: 0 10px; }
section .tree .kids { display: flex; gap: 48px; }
section .tree .kid { display: flex; flex-direction: column; align-items: center; gap: 10px; }
section .verdict {
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 18px; color: #1E2833;
  background: #EAF6EC; border: 2px solid #1E7A34; border-radius: 10px; padding: 5px 14px;
}
section .verdict small { display: block; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #1E7A34; }
section .verdict.no { background: #FBEDEB; border-color: #C0392B; }
section .verdict.no small { color: #C0392B; }

/* four-pillars strip - the canonical OOP roadmap */
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

/* code in two columns: a class on the left, the class that extends it on the right */
section .two { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
section .two pre { margin: 0 0 8px 0; }

/* the comparison table, smaller so that all seven rows fit */
section.cmp table { font-size: 18px; margin: 4px 0 0 0; }
section.cmp table th { font-size: 17px; padding: 6px 16px 6px 6px; }
section.cmp table td { padding: 6px 16px 6px 6px; vertical-align: top; }
</style>

<!-- Speaker notes: ~0:00. The title picture is the lecture's definition in one line of code. Read it left to right: the signature is everything other code needs to call the method, and the body is the part abstraction hides. Every later slide is a way of writing a signature without its body: an abstract method, or a method in an interface. -->

<!-- _class: lead -->
<!-- _paginate: false -->

<span class="kicker">// abstraction · object-oriented computing</span>

# Abstraction

<div class="hero">
<div class="h-pill"><div class="h-sig">public int add(int a, int b)</div><div class="h-body">return a + b;</div></div>
<div class="h-notes">
<div><span class="h-arrow">↑</span><b>method signature</b>what other code needs to call the method</div>
<div><span class="h-arrow">↑</span><b>method body</b>how the method works: abstraction hides it</div>
</div>
</div>

Abstraction: show what a method does (its signature), and hide how it does it (its body).

---

<!-- Speaker notes: ~0:01. Problem-first hook. Before revealing the bullets, ask the room what a plain Animal's makeSound() should print: every answer names a particular kind of animal, which is the point. The lab's first code example is this Animal made abstract, with Dog and Cat. -->

## Problem: a plain Animal makes no sense

- `Animal` needs a `makeSound()` method, but no sound fits every animal:

```java
public class Animal {
    public void makeSound() {
        System.out.println("...");      // which sound? It depends on the animal
    }
}
```

- And nothing stops code creating a plain `Animal`, which is no kind of animal at all:

<!-- no-compile -->
```java
Animal a = new Animal();     // compiles and runs
a.makeSound();               // prints ...
```

* Every real animal is a particular kind, such as a dog or a cat: `Animal` is only the general idea.
* **Abstraction** fixes this: `makeSound()` gets no body, and the compiler refuses `new Animal()`.

---

<!-- Speaker notes: ~0:04. The idea of the hour in one picture. Point at the dashed method first: a signature with no body. Then follow it down: each subclass writes the body. Then the verdicts: the general class has no objects, its subclasses do. Lab DIY 1 builds this same shape with Shape, Circle and Square, and has students try new Shape(...) to see the compile error. -->

## The fix: an abstract class

- Declare `Animal` **abstract**, and its `makeSound()` with **no body**. Each subclass must then write its own `makeSound()`:

<div class="tree">
<div class="top">
<div class="card"><div class="hdr">abstract class Animal</div><div class="m abs">makeSound();<small>no body</small></div></div>
<div class="verdict no">new Animal()<small>✗ compile error: Animal is abstract</small></div>
</div>
<div class="down"><b>↓</b>extends<b>↓</b></div>
<div class="kids">
<div class="kid"><div class="card"><div class="hdr">class Dog extends Animal</div><div class="m">makeSound(): prints Woof</div></div><div class="verdict">new Dog()<small>✓ compiles</small></div></div>
<div class="kid"><div class="card"><div class="hdr">class Cat extends Animal</div><div class="m">makeSound(): prints Meow</div></div><div class="verdict">new Cat()<small>✓ compiles</small></div></div>
</div>
</div>

<p class="legend">dashed orange = an abstract method: a signature with no body, which each subclass must write</p>

* So there are dogs and cats, but never a plain animal.

---

## Agenda

- The four pillars of OOP
- What abstraction means, and how it differs from encapsulation
- Abstract classes and abstract methods
- The rules for abstract methods
- Interfaces: writing one and implementing one
- A class can implement many interfaces
- Abstract class or interface: which to use
- Benefits of abstraction

---

<!-- Speaker notes: ~0:06. The canonical four-pillars overview: name each pillar once and move on. Land the last bullet, because it explains why abstraction needs the other ideas already in place: without inheritance an abstract class is useless, and interfaces are one way to get polymorphism (overriding in subclasses is the other). -->

## The four pillars of OOP

- Object-oriented programming (OOP) is built on **four main ideas**, called its four pillars:

<div class="pillars">
<div class="pillar"><span class="p-name">Encapsulation</span><span class="p-line">bundle the data and the methods that use it in one class, and hide the data</span><span class="p-wk">pillar 1</span></div>
<div class="pillar"><span class="p-name">Inheritance</span><span class="p-line">build a new class from an existing class</span><span class="p-wk">pillar 2</span></div>
<div class="pillar"><span class="p-name">Polymorphism</span><span class="p-line">one method call can behave differently for different objects</span><span class="p-wk">pillar 3</span></div>
<div class="pillar now"><span class="p-chip">this lecture</span><span class="p-name">Abstraction</span><span class="p-line">show what an object does, hide how it does it</span><span class="p-wk">pillar 4</span></div>
</div>

- Abstraction uses two of the other pillars: an abstract class is only useful through **inheritance**, and an interface is a way to get **polymorphism**.

---

<!-- Speaker notes: ~0:09. The lecture's definition: abstraction hides the implementation details (the body) of methods and shows only their signatures. The everyday examples take ten seconds each; the point is that you use all three without knowing how they work. Which keyword Java uses for abstraction is MCQ material. -->

## What abstraction means

- **Abstraction** means showing what a method does and hiding how it does it:

```java
public int add(int a, int b) {    // the signature: what the method is called and what it takes
    return a + b;                 // the body: how it does its job
}
```

- Abstraction keeps only the signature. With no body, the method ends with a semicolon:

<!-- no-compile -->
```java
public int add(int a, int b);
```

- Code that calls `add` needs only the signature, just as you use a TV remote's volume button, email's Send button or a calculator's ÷ key without seeing how they work.
- Java's keyword for abstraction is **`abstract`**, used for abstract classes and abstract methods. Java also has **interfaces**.

---

<!-- Speaker notes: ~0:12. The common confusion is that the two pillars are one idea because both hide something. Separate them by what they hide: data on the left, method bodies on the right. The difference is MCQ material. -->

## Abstraction vs encapsulation

- Both pillars hide something, but they hide different things:

| | Encapsulation | Abstraction |
|---|---|---|
| What it hides | **data**: the instance variables | **how methods work**: their bodies |
| How | `private` instance variables, used through public getters and setters | abstract classes and interfaces: an abstract method has a signature but no body |
| Example | `private double balance;` | `public abstract void makeSound();` |

---

<!-- Speaker notes: ~0:14. The rule list, at pace. Spend the time on "cannot be instantiated": students read abstract as "has no code", when an abstract class can be full of working code and still have no objects of its own. Lab DIY 1 has students trigger exactly this compile error. -->

## Abstract classes

- An **abstract class** has the keyword `abstract` in its declaration, before the keyword `class`:

```java
public abstract class Animal {
    // instance variables, constructors and methods, like any class
}
```

- An abstract class **cannot be instantiated**: no object of it can be created. `new Animal()` gives the compile error `Animal is abstract; cannot be instantiated`.
- To use an abstract class, another class must **inherit** from it, with `extends`.
- It can have instance variables, constructors and methods with bodies, like any class, and it **may or may not** contain abstract methods.
- A class that can be instantiated is called a **concrete** class.

---

<!-- Speaker notes: ~0:17. Two things to drill. First the ending: a semicolon instead of braces is the whole difference, and empty braces { } are not the same thing, because that is a concrete method with an empty body. Second the word order: access modifier, then abstract, then the return type. Write a wrong order on the board and let the room fix it; the keyword order is MCQ material. -->

## Abstract methods

- An **abstract method** has a signature but **no body**: instead of braces, it ends with a semicolon. A **concrete method** has a body:

```java
public abstract class Animal {
    public abstract void makeSound();      // abstract method: no body, ends with ;

    public void sleep() {                  // concrete method: has a body
        System.out.println("Zzz");
    }
}
```

- The keyword `abstract` goes **after** the access modifier and **before** the return type.
- Make a method abstract when every subclass must have it, but each subclass needs its own body: a `Dog` makes a different sound from a `Cat`.

---

<!-- Speaker notes: ~0:19. Predict beat. The common wrong answer is a compile error on the first line: students see the abstract class's name in front of v and think it breaks the no-objects rule. The rule is only about new: the object here is a Car, and a Vehicle variable may hold any concrete subclass. A few expect fuelType() to fail because Vehicle gives it no body; the call runs the body of the object's own class. The example generalises: cars and trucks differ in colour, shape, engine and purpose, but share tyres, an engine, steering and gears, and Vehicle keeps only that shared part. Lab DIY 5's Employee and Manager have this shape, with a constructor added. -->

## Predict: what prints?

<!-- _class: code-sm -->

- `Vehicle` keeps only what every vehicle shares, and `Car` extends it:

<div class="two">
<div>

```java
public abstract class Vehicle {
    public void stop() {
        System.out.println("Braking");
    }

    public abstract String fuelType();
}
```

</div>
<div>

<!-- no-compile -->
```java
public class Car extends Vehicle {
    @Override
    public String fuelType() {
        return "petrol";
    }
}
```

<!-- no-compile -->
```java
Vehicle v = new Car();
v.stop();
System.out.println(v.fuelType());
```

</div>
</div>

* `Braking`, then `petrol`.
* `v` has the type `Vehicle` but holds a `Car`, which is allowed: a variable of an abstract class's type can hold any concrete subclass.
* `stop()` is inherited from `Vehicle`, and `fuelType()` runs the body that `Car` wrote.

---

<!-- Speaker notes: ~0:22. The two consequences of declaring a method abstract. Walk the code top to bottom: Pet is legal only because it is abstract too, and Dog is where the chain has to end. Ask what happens if Dog leaves makeSound() out: that is the next slide. What a subclass must be when it leaves an abstract method out is MCQ material. -->

## Rules for abstract methods

<!-- _class: code-sm -->

- If a class has **at least one** abstract method, the class **must** be declared abstract.
- A class that extends an abstract class must either **override every abstract method** it inherits, or **be declared abstract** itself:

```java
abstract class Animal {
    public abstract void makeSound();
}

abstract class Pet extends Animal {     // allowed: Pet is abstract, so it may leave makeSound() out
}

class Dog extends Pet {                 // Dog is concrete, so it must override makeSound()
    @Override
    public void makeSound() {
        System.out.println("Woof");
    }
}
```

- Eventually a subclass has to write every abstract method. Otherwise none of the classes could ever be instantiated.

---

<!-- Speaker notes: ~0:25. Predict beat. Expect yes from students who think Cat inherits makeSound() from Animal and so has one: what it inherits is a signature with no body, which a concrete class may not keep. Others argue that nothing ever calls makeSound() on a Cat, a run-time view; the compiler checks every concrete class whether or not the method is ever called. Lab DIY 2 produces the same message for a method that an interface asks for. -->

## Predict: does this compile?

- `Animal` is an abstract class whose one method, `makeSound()`, is abstract. `Cat` extends it:

<!-- no-compile -->
```java
class Cat extends Animal {
    public void sleep() {
        System.out.println("Zzz");
    }
}
```

* **No.** The compiler stops with `error: Cat is not abstract and does not override abstract method makeSound() in Animal`.
* `Cat` inherits `makeSound()` as a signature with no body, and a concrete class cannot have a method with no body.
* Two fixes: give `Cat` its own `makeSound()`, or declare `Cat` abstract too.

---

<!-- Speaker notes: ~0:28. The second tool. Use the word contract exactly as the slide defines it, all hour. Animated extends Drawable is the one example of an interface inheriting another: interfaces extend other interfaces and never implement them, which is MCQ material. -->

## Interfaces

- An **interface** is like an abstract class in which **every** method is abstract:

```java
public interface Drawable {
    void draw();                                 // a signature: no body
}

public interface Animated extends Drawable {     // extends another interface
    void animate();
}
```

- An interface **cannot be instantiated**: `new Drawable()` is a compile error.
- It is declared with the keyword `interface`. A class **implements** it, with `implements`, and another interface **extends** it, with `extends`.
- An interface is a **contract**: a class that implements it promises to write a body for every method the interface lists.

---

<!-- Speaker notes: ~0:31. The implicit modifiers are the most-tested facts about interfaces: say each one aloud while pointing at its comment. method1 and method2 are declared identically; writing public abstract is allowed but adds nothing. Default and static methods get one sentence: they exist, they have bodies, and the lab does not need them. -->

## Inside an interface

- Everything inside an interface gets modifiers that you do not have to write:

```java
public interface ExampleInterface {
    double PI = 3.1415;                  // a constant: implicitly public static final

    void method1();                      // implicitly public abstract
    public abstract void method2();      // the same, written out in full
}
```

- An interface can contain **constants**, **method signatures**, **default** and **static** methods (which have bodies, since Java 8), and **nested types** (a class declared inside it).
- An interface has **no constructors** and **no instance variables**: every variable in it is a constant.

---

<!-- Speaker notes: ~0:34. Three rules to land: every method, the exact signature, and public. @Override is not required, but it makes the compiler check that the signature matches, so use it every time. Lab DIY 2 has students write this shape for a GameCharacter interface. -->

## Implementing an interface

<!-- _class: code-sm -->

- `Circle` implements `Drawable`, so it must give `draw()` a body:

```java
interface Drawable {
    void draw();
}

public class Circle implements Drawable {
    @Override
    public void draw() {
        System.out.println("Drawing a circle");
    }
}
```

- A class that implements an interface must implement **all** of its abstract methods before it can be instantiated.
- Each method must have **exactly the same signature** (the same name and parameters) as in the interface, and it must be `public`.

---

<!-- Speaker notes: ~0:36. Predict beat, and the one most likely to slip past. Expect yes: speak() has the right name and parameters, and leaving out an access modifier is legal everywhere else. The faulty model is that only the name and parameters must match; the method must also be public, because the interface's version is implicitly public and an implementing method may not be less visible. Lab DIY 2 has students delete public and read this exact error. -->

## Predict: does this compile?

- `Speaker` is an interface with one method, `void speak();`. `Dog` implements it:

<!-- no-compile -->
```java
class Dog implements Speaker {
    void speak() {
        System.out.println("Woof");
    }
}
```

* **No.** The compiler stops with `error: speak() in Dog cannot implement speak() in Speaker`, because of `attempting to assign weaker access privileges; was public`.
* Methods in an interface are implicitly **public**. In `Dog`, `speak()` has no access modifier, so it gets default access, which is weaker than public.
* The fix is one word: `public void speak()`.

---

<!-- Speaker notes: ~0:39. This is the main reason interfaces exist: Java has no multiple inheritance of classes, and interfaces are how one class takes on several types. How many interfaces a class may implement is MCQ material. Lab DIY 3 has Circle extend Shape and implement Drawable, and DIY 4's Wizard implements two interfaces. -->

## A class can implement many interfaces

<!-- _class: code-sm -->

- A class can **extend only one** class, but it can **implement as many interfaces as it needs**, separated by commas:

<div class="two">
<div>

```java
interface Flyable {
    void fly();
}

interface Swimmable {
    void swim();
}
```

</div>
<div>

<!-- no-compile -->
```java
class Duck implements Flyable, Swimmable {
    @Override
    public void fly() {
        System.out.println("The duck flies");
    }

    @Override
    public void swim() {
        System.out.println("The duck swims");
    }
}
```

</div>
</div>

- `Duck` must write a body for every method of both interfaces.
- A class can extend one class and implement interfaces in the same declaration, `extends` first: `class Duck extends Animal implements Flyable, Swimmable`.

---

<!-- Speaker notes: ~0:41. Predict beat. Two wrong answers come up. Some say the first line does not compile because an interface cannot be instantiated: the new is on Circle, and only the variable's type is Drawable. Others expect Drawing a circle twice, thinking d stays a circle; each call runs the draw() of the object d holds at that moment. Lab DIY 4's takeTurn(GameCharacter character) is this idea as a method parameter, and how interfaces give polymorphism is MCQ material. -->

## Predict: what prints?

- `Circle` and `Square` both implement `Drawable`. Their `draw()` methods print `Drawing a circle` and `Drawing a square`:

<!-- no-compile -->
```java
Drawable d = new Circle();
d.draw();
d = new Square();
d.draw();
```

* `Drawing a circle`, then `Drawing a square`.
* `d` has the interface type `Drawable`, so it can hold an object of **any** class that implements `Drawable`.
* Each call runs the `draw()` of the object that `d` holds at that moment. This is how interfaces give **polymorphism**: objects of different classes, used through one interface type.

---

<!-- Speaker notes: ~0:44. Reference slide to photograph: one table for all three kinds of class. Read it column by column, then point at the rows that are MCQ material: creating objects with new, constructors, and how a class uses each one (it extends one class, but implements many interfaces). -->

## Class vs abstract class vs interface

<!-- _class: cmp -->

| | Concrete class | Abstract class | Interface |
|---|---|---|---|
| Keyword | `class` | `abstract class` | `interface` |
| Objects with `new`? | yes | no | no |
| Methods | all have a body | abstract (no body) and concrete (with a body) | implicitly `public abstract`; since Java 8 also `default` and `static` methods, with bodies |
| Variables | any kind | any kind, including instance variables | constants only: implicitly `public static final` |
| Constructors | yes | yes, run by subclasses through `super(...)` | no |
| How a class uses it | `extends`: one class only | `extends`: one class only | `implements`: as many as it needs |
| Relationship | "is-a" | "is-a": a `Dog` is an `Animal` | "can-do": a `Duck` can fly |

---

<!-- Speaker notes: ~0:47. One example per kind of class. The box holds the questions to ask when designing; lab DIY 5 has students make this decision twice and write their reason in a comment. -->

## Which one should I use?

- **Concrete class:** the class is finished and ready to be used as an object. *Examples: `Car`, `User`.*
- **Abstract class:** closely related classes share code and instance variables, but the general idea is too vague to exist on its own. *Example: `Animal`: there is no plain animal, only particular kinds such as `Dog`.*
- **Interface:** a capability that unrelated classes might share. *Example: `Flyable` fits a `Bird`, an `Airplane` and `Superman`.*

<div class="callout"><strong>Rules of thumb:</strong> a class needs behaviour from several sources → interfaces, because a class can extend only one class. Related classes should share working methods and instance variables → an abstract class. A type for many classes, including unrelated ones → an interface.</div>

---

<!-- Speaker notes: ~0:50. Pair each benefit with its example from this lecture. Slow down for the Open/Closed Principle: lab DIY 4 adds a Wizard without changing takeTurn, which is the principle in practice. -->

## Benefits of abstraction

- **Less complexity, easier maintenance:** code that uses `Drawable` needs to know only `draw()`, not how each class draws. Code that changes often (the bodies) is kept apart from code that stays the same (the signatures).
- **The Open/Closed Principle:** a program is *open* to new features and *closed* to changes in the code that already works.
  - *Open:* add a feature by writing a new class that implements the interface, such as a `Triangle` that implements `Drawable`.
  - *Closed:* code that uses only the interface, such as `d.draw()`, does not change when that class is added.
- **Protection and safety:** `private` protects a class's data, and `abstract` protects how a class is used: the compiler refuses to create an object of an abstract class, such as a plain `Animal`.

---

## Summary

- **Abstraction** shows what a method does (its signature) and hides how it does it (its body). Encapsulation hides data instead.
- An **abstract class** cannot be instantiated and is used through `extends`. It can have instance variables, constructors, and both abstract and concrete methods.
- An **abstract method** has no body and ends with `;`. A class with one must be abstract, and each subclass must override it or be abstract too.
- An **interface** lists method signatures (implicitly `public abstract`) and constants (implicitly `public static final`), with no constructors. A class `implements` it and writes every method as `public`; an interface `extends` other interfaces.
- A class extends **one** class but can implement **many** interfaces. A variable of an interface type can hold an object of any class that implements it.
- Abstract class: close relatives that share code ("is-a"). Interface: a capability that unrelated classes share ("can-do").
