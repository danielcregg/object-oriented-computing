---
marp: true
theme: ooc
paginate: true
transition: fade
title: "Polymorphism"
topic: polymorphism
type: lecture
source: authored
---

<style>
/* Deck-local diagrams, all drawn in CSS (no images): the title picture of
   one call reaching three objects, the run-time choice between three
   methods, the four-pillars strip, the parts of a method header, two
   comparison columns, the reference type and object type of one variable,
   two variables referring to one object, and an array of type Animal. The
   shared components (.mem/.callout/.legend/.kicker) come from the theme.
   Colours: blue = decided at compile time, orange = decided at run time
   (or the part that matters), grey = not part of it. */
section .mem { display: flex; margin: 40px 0 10px 0; font-family: 'Cascadia Code', Consolas, monospace; }
section .mem .cell { min-width: 132px; }

/* title slide: one method call, three objects, three results, each labelled */
section .hero { width: 940px; margin: 14px 0 0 0; }
section .hero .h-call { text-align: center; font-size: 18px; color: #A9B6C4; line-height: 1.35; }
section .hero .h-call b {
  display: inline-block; padding: 6px 26px; border-radius: 10px; margin-bottom: 4px;
  background: #0E1823; border: 2px solid #E76F00;
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 26px; font-weight: 600; color: #FFFFFF;
}
section .hero .h-call span { display: block; }
section .hero .h-wires { display: flex; justify-content: space-around; color: #E76F00; font-size: 28px; line-height: 1.25; }
section .hero .h-fan { display: flex; gap: 22px; }
section .hero .h-obj {
  flex: 1; text-align: center; padding: 10px 10px 10px; border-radius: 12px;
  background: rgba(255, 255, 255, 0.07); border: 2px solid #7FB4D8;
}
section .hero .h-obj .h-tag { display: block; font-size: 17px; color: #A9B6C4; }
section .hero .h-obj b { display: block; margin: 2px 0; font-family: 'Cascadia Code', Consolas, monospace; font-size: 30px; color: #FFFFFF; }
section .hero .h-obj .h-sub { display: block; font-family: 'Cascadia Code', Consolas, monospace; font-size: 16px; color: #F0B26B; }
section.lead .hero ~ p { max-width: 940px; margin-top: 22px; text-wrap: balance; }
section .hero code { background: rgba(255, 255, 255, 0.12); color: #FFFFFF; font-size: 0.95em; }

/* one call, three methods that could run, and the one that runs this time */
section .dsp { text-align: center; margin: 22px 0 4px 0; }
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
section .dsp .card span { font-size: 17px; color: #46536B; }
section .dsp .opt.win .wire { color: #E76F00; font-weight: 700; }
section .dsp .opt.win .card { background: #FDEFD9; border-color: #E76F00; opacity: 1; }
section .dsp .opt.win .card b { color: #B94E00; }

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

/* the parts of a method header: orange = part of the signature, grey = not */
section .sig { display: flex; justify-content: center; align-items: flex-end; gap: 10px; margin: 26px 0 6px 0; }
section .sig .part { display: flex; flex-direction: column; align-items: center; gap: 8px; }
section .sig .part code {
  font-size: 30px; padding: 8px 14px; border-radius: 8px;
  background: #F1EFEA; border: 2px solid #C9C2AE; color: #6B6552;
}
section .sig .part.in code { background: #FDEFD9; border-color: #E76F00; color: #B94E00; font-weight: 600; }
section .sig .part span { font-size: 15px; color: #8B8471; text-transform: uppercase; letter-spacing: 0.05em; }
section .sig .part.in span { color: #B94E00; font-weight: 600; }

/* two columns side by side: blue = compile time, orange = run time */
section .vs { display: flex; gap: 28px; margin: 18px 0 10px 0; }
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

/* overriding: the superclass on top, its two subclasses side by side below */
section .tree { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 22px; }
section .tree > div:first-child { grid-column: 1 / 3; justify-self: center; width: 62%; }
section .tree pre { margin: 5px 0; }

/* one variable, two types: the reference type and the object type */
section .tt { display: flex; align-items: center; justify-content: center; margin: 22px 0 14px 0; }
section .tt .box {
  min-width: 330px; padding: 12px 24px 10px; text-align: center;
  background: #FFFFFF; border: 2px solid #33698C; border-radius: 12px;
}
section .tt .box .tag { display: block; font-size: 15px; letter-spacing: 0.05em; color: #33698C; font-weight: 600; }
section .tt .box .val {
  display: block; margin-top: 2px; font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 27px; color: #1E2833;
}
section .tt .box .sub { display: block; margin-top: 4px; font-size: 17px; color: #46536B; }
section .tt .box.obj { background: #FDEFD9; border-color: #E76F00; }
section .tt .box.obj .tag { color: #B94E00; }
section .tt .link { padding: 0 22px; font-size: 40px; color: #E76F00; font-weight: 600; }

/* code on the left, a diagram on the right */
section .pair { display: flex; align-items: center; gap: 34px; }
section .pair > div:first-child { flex: none; width: 600px; }
section .pair.arr > div:first-child { width: 540px; }
section .pair .mem { margin: 30px 0 0 0; }
section .pair .mem .cell { min-width: 112px; }

/* two variables referring to ONE object */
section .refs { display: flex; align-items: center; gap: 6px; }
section .refs .vars { display: flex; flex-direction: column; gap: 12px; text-align: right; }
section .refs .var { font-family: 'Cascadia Code', Consolas, monospace; font-size: 21px; font-weight: 600; color: #33698C; white-space: nowrap; }
section .refs .var small { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 400; color: #8B8471; }
section .refs .var::after { content: ' ⟶'; color: #E76F00; }
section .refs .obj {
  padding: 20px 24px; border: 2px solid #E76F00; border-radius: 12px; background: #FDEFD9;
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 21px; font-weight: 600; color: #B94E00;
}
</style>

<!-- Speaker notes: ~0:00. The picture is the whole lecture: one method call, a.speak(), on a variable of type Animal, and three different results, because the three objects belong to three different classes. Read it left to right, then read the sentence underneath. Every later slide explains one part of it: how the classes are written (overriding), how Java picks the method (dynamic method dispatch), and how one variable or one array can hold all three (upcasting). -->

<!-- _class: lead -->
<!-- _paginate: false -->

<span class="kicker">// polymorphism · object-oriented computing</span>

# Polymorphism

<div class="hero">
<div class="h-call"><b>a.speak();</b><span>one method call, on a variable <code>a</code> of type Animal</span></div>
<div class="h-wires"><span>↙</span><span>↓</span><span>↘</span></div>
<div class="h-fan">
<div class="h-obj"><span class="h-tag">when <code>a</code> refers to a Dog</span><b>Woof</b><span class="h-sub">Dog's speak() runs</span></div>
<div class="h-obj"><span class="h-tag">when <code>a</code> refers to a Cat</span><b>Meow</b><span class="h-sub">Cat's speak() runs</span></div>
<div class="h-obj"><span class="h-tag">when <code>a</code> refers to a Cow</span><b>Moo</b><span class="h-sub">Cow's speak() runs</span></div>
</div>
</div>

Polymorphism: the same method call does different things, depending on the object it is called on.

---

<!-- Speaker notes: ~0:01. Problem-first hook. The code works; the problem is how it grows. Ask the room what a fourth animal costs (one more variable and one more call), then what a method that should accept any animal would look like (one version per class). Reveal the last bullet as the promise of the hour: the slide "One array for every kind of animal" near the end delivers it as a single loop. -->

## Problem: one variable and one call per animal

<!-- _class: code-sm -->

- `Dog`, `Cat` and `Cow` are three classes, and each has its own `speak()` method that prints its sound:

<!-- no-compile -->
```java
Dog dog = new Dog();
Cat cat = new Cat();
Cow cow = new Cow();

dog.speak();     // prints Woof
cat.speak();     // prints Meow
cow.speak();     // prints Moo
```

* Every new kind of animal needs one more variable and one more call.
* A method that should work for any animal has to be written once for each class.
* **Polymorphism** fixes this: if `Dog`, `Cat` and `Cow` all extend `Animal`, one variable of type `Animal` can refer to any of them, and the one call `a.speak()` runs the right `speak()` for each object.

---

<!-- Speaker notes: ~0:04. The definition. Stress the word related in the second bullet: polymorphism needs a superclass and its subclasses, each with its own version of one method. The diagram shows the choice Java makes when the call runs: one call, three methods it could reach, and the object decides. The call was compiled once; the choice is made again every time the line runs. -->

## What polymorphism means

- The word comes from Greek: *poly* means "many" and *morphē* means "form" or "shape".
- **Polymorphism** is the ability of a method to do different things depending on the object it is called on. Related classes each have a method with the same name, and each class gives that method its own behaviour.

<div class="dsp">
<div class="call">a.speak();</div>
<div class="fan">
<div class="opt"><span class="wire">↙</span><div class="card"><b>Dog's speak()</b><span>prints Woof</span></div></div>
<div class="opt win"><span class="wire">↓</span><div class="card"><b>Cat's speak()</b><span>prints Meow</span></div></div>
<div class="opt"><span class="wire">↘</span><div class="card"><b>Cow's speak()</b><span>prints Moo</span></div></div>
</div>
</div>

<p class="legend">The variable <code>a</code> has the type Animal. This time it refers to a Cat object, so Cat's speak() runs.</p>

---

## Agenda

- The four pillars of OOP
- The two types of polymorphism
- Method signatures and method overloading
- Method overriding and dynamic method dispatch
- Overloading and overriding compared
- Upcasting and downcasting
- One array for many kinds of object, and `instanceof`
- Benefits of polymorphism

---

<!-- Speaker notes: ~0:06. Orientation: one minute. Say the dependency out loud: polymorphism needs inheritance, so every example in the hour is a superclass with subclasses that extend it. -->

## The four pillars of OOP

- Object-oriented programming (OOP) is built on **four main ideas**, called its four pillars:

<div class="pillars">
<div class="pillar"><span class="p-name">Encapsulation</span><span class="p-line">bundle the data and the methods that use it in one class, and hide the data</span><span class="p-wk">pillar 1</span></div>
<div class="pillar"><span class="p-name">Inheritance</span><span class="p-line">build a new class from an existing class</span><span class="p-wk">pillar 2</span></div>
<div class="pillar now"><span class="p-chip">this lecture</span><span class="p-name">Polymorphism</span><span class="p-line">one method call can behave differently for different objects</span><span class="p-wk">pillar 3</span></div>
<div class="pillar"><span class="p-name">Abstraction</span><span class="p-line">show what an object does, hide how it does it</span><span class="p-wk">pillar 4</span></div>
</div>

- Polymorphism builds on inheritance: every example in this lecture is a superclass and the subclasses that extend it.

---

<!-- Speaker notes: ~0:08. Reference slide: every name on it is MCQ material, so give the room time to photograph it. Binding is the one new word; define it before the columns. The rest of the hour fills in the two columns, overloading first and then overriding. -->

## Two types of polymorphism

- **Binding** means linking a method call to the method body that will run.
- Java can bind a call at one of two moments, so there are two types of polymorphism:

<div class="vs">
<div class="col">
<div class="head">compile-time polymorphism</div>
<div class="row">also called <b>static</b> polymorphism</div>
<div class="row">uses <b>static</b> binding, also called <b>early</b> binding</div>
<div class="row">decided by the <b>compiler</b>, before the program runs</div>
<div class="row">done with method <b>overloading</b></div>
</div>
<div class="col late">
<div class="head">run-time polymorphism</div>
<div class="row">also called <b>dynamic</b> polymorphism</div>
<div class="row">uses <b>dynamic</b> binding, also called <b>late</b> binding</div>
<div class="row">decided by the <b>JVM</b>, while the program runs</div>
<div class="row">done with method <b>overriding</b></div>
</div>
</div>

<p class="legend">JVM = the Java Virtual Machine, the program that runs your compiled code</p>

---

<!-- Speaker notes: ~0:11. Overloading only makes sense once "signature" is exact, so take this slowly. The common slip is to include the return type or the modifier in the signature; point at the grey boxes and say that they are not part of it. The parameter names are not part of it either: max(int a, int b) has the same signature as max(int x, int y). -->

## The method signature

- A method's **signature** is its name and its parameter list: the **number**, **types** and **order** of its parameters.

<div class="sig">
<div class="part"><code>public</code><span>modifier</span></div>
<div class="part"><code>int</code><span>return type</span></div>
<div class="part in"><code>max</code><span>method name</span></div>
<div class="part in"><code>(int x, int y)</code><span>parameter list</span></div>
<div class="part"><code>{ ... }</code><span>method body</span></div>
</div>

<p class="legend">orange = part of the signature · grey = not part of the signature</p>

- This method's signature is **`max(int, int)`**: no modifier, no return type, no parameter names.
- Two signatures are different when the parameters differ in:
  - **number:** `max(int, int)` and `max(int, int, int)`
  - **type:** `max(int, int)` and `max(double, double)`
  - **order:** `fun(int, char)` and `fun(char, int)`
- A class cannot have two methods with the same signature.

---

<!-- Speaker notes: ~0:14. Run the two calls in order: the compiler matches two arguments to add(int, double) and three to add(int, double, int), before the program runs. Mention constructors: a class with several constructors is using overloading too. Lab DIY 2 has students write three overloads of calculatePrice. -->

## Method overloading

<!-- _class: code-sm -->

- **Method overloading**: one class has several methods with the same name but different signatures.

```java
public class Calculator {
    public double add(int a, double b) {
        return a + b;
    }

    public double add(int a, double b, int c) {    // a different number of parameters
        return a + b + c;
    }
}
```

<!-- no-compile -->
```java
Calculator calc = new Calculator();
System.out.println(calc.add(10, 20.1));        // runs add(int, double): prints 30.1
System.out.println(calc.add(10, 20.5, 30));    // runs add(int, double, int): prints 60.5
```

- The compiler picks the method by matching the arguments, before the program runs.
- Overloading needs no keyword. Constructors can be overloaded in the same way.

---

<!-- Speaker notes: ~0:17. Predict beat. The common wrong answer is yes: students read the two return types as making two different methods, as if the return type were part of the signature. It is not, so both methods are max(int, int). Ask what the compiler would do with the call max(3, 4) if both existed: it could not choose. Overloading by return type alone is MCQ material. -->

## Predict: does this compile?

<!-- _class: code-sm -->

- `MathUtil` has two methods named `max`, with the same parameters but different return types:

<!-- no-compile -->
```java
public class MathUtil {
    public int max(int a, int b) {
        return Math.max(a, b);
    }

    public double max(int a, int b) {
        return Math.max(a, b);
    }
}
```

* **No.** The compiler stops: `method max(int,int) is already defined in class MathUtil`.
* The return type is not part of the signature, so both methods are `max(int, int)`.
* Two methods named `max` can only share a class if their parameter lists are different.

---

<!-- Speaker notes: ~0:20. Read the two terms off the code: the method in the superclass is the overridden method, the methods in the subclasses are the overriding methods. Students swap the two words, so say it twice. Without @Override, a typo such as speek() compiles as a new method and the Dog keeps the Animal sound. Lab DIY 1 overrides getPerimeter() in Square and Circle, and DIY 6 overrides toString() and equals(), two methods every class inherits from Object. -->

## Method overriding

<!-- _class: code-sm -->

- **Method overriding**: a subclass gives a method it inherits a new body, with the **same signature**.

<div class="tree">
<div>

```java
public class Animal {
    public void speak() {
        System.out.println("Animal makes a sound");
    }
}
```

</div>
<div>

<!-- no-compile -->
```java
public class Dog extends Animal {
    @Override
    public void speak() {
        System.out.println("Woof");
    }
}
```

</div>
<div>

<!-- no-compile -->
```java
public class Cat extends Animal {
    @Override
    public void speak() {
        System.out.println("Meow");
    }
}
```

</div>
</div>

- The `speak()` in `Animal` is the **overridden method**; the versions in `Dog` and `Cat` are **overriding methods**.
- `@Override` is optional, but always write it: if no superclass method has this signature, the compiler reports an error.

---

<!-- Speaker notes: ~0:24. The deepest idea of the hour: one variable has two types. Point at the left box (all the compiler knows) and then the right box (what the JVM finds when the line runs). Say it in these words: at compile time a is just an Animal; at run time it refers to a Dog. Everything about casting later in the hour follows from this split. -->

## Calling an overridden method

- `Dog` extends `Animal` and overrides its `speak()` method, so that a `Dog` prints `Woof`.

<!-- no-compile -->
```java
Animal a = new Dog();
a.speak();          // prints Woof
```

<div class="tt">
<div class="box"><span class="tag">REFERENCE TYPE</span><span class="val">Animal a</span><span class="sub">the type of the variable</span></div>
<div class="link">→</div>
<div class="box obj"><span class="tag">OBJECT TYPE</span><span class="val">new Dog()</span><span class="sub">the type of the object it refers to</span></div>
</div>

* At compile time, `a` is just an `Animal`. The compiler checks that `Animal` has a `speak()` method, so the call compiles.
* At run time, `a` refers to a `Dog`, so the JVM runs the `speak()` in `Dog`. Choosing the method from the object's type like this is called **dynamic method dispatch**.

---

<!-- Speaker notes: ~0:27. Predict beat. The common wrong answer is "Animal makes a sound" three times: students think the variable's type picks the method, because Animal is all they can see on each line. The object's type picks it. a1 checks the rule the other way round: a plain Animal object runs Animal's own speak(). This is MCQ material, and the most important idea of the hour to get right. -->

## Predict: what prints?

<!-- _class: code-sm -->

- `Dog` and `Cat` extend `Animal`. `speak()` prints `Animal makes a sound` in `Animal`, `Woof` in `Dog` and `Meow` in `Cat`.

<!-- no-compile -->
```java
Animal a1 = new Animal();
Animal a2 = new Dog();
Animal a3 = new Cat();

a1.speak();
a2.speak();
a3.speak();
```

* `Animal makes a sound`, then `Woof`, then `Meow`.
* All three variables have the reference type `Animal`, but each call runs the `speak()` of the object's own class.
* `a1` refers to a plain `Animal` object, so the `speak()` in `Animal` runs.

---

<!-- Speaker notes: ~0:30. This is why the choice on the last two slides cannot be made by the compiler. If you demo it live, run it a few times: the same program prints different things. Contrast with overloading on the way out: an overloaded call's arguments are written in the code, so the compiler can always choose. An overridden method call being resolved at run time is MCQ material. -->

## Why overriding is resolved at run time

<!-- _class: code-sm -->

- `Dog` and `Cat` extend `Animal` and override `speak()`. Which object a variable refers to can depend on something that only happens while the program runs, such as a random number or what the user types:

<!-- no-compile -->
```java
Animal a;
if (Math.random() < 0.5) {     // true about half the time
    a = new Dog();
} else {
    a = new Cat();
}
a.speak();                      // Woof or Meow: it depends on this run
```

* The compiler cannot know which object `a` will refer to, so it cannot pick the method.
* The JVM picks it each time the line runs, from the object: an overridden method call is resolved at **run time**.
* An overloaded call is different: its arguments are in the code, so the compiler can pick.

---

<!-- Speaker notes: ~0:33. Reference slide: give the room time to photograph it, because the difference between the two is MCQ material. A quick test for any pair of methods: the same name and the same parameters in a subclass means overriding; the same name and different parameters means overloading. -->

## Overloading vs overriding

<div class="vs">
<div class="col">
<div class="head">overloading</div>
<div class="row">in <b>one class</b></div>
<div class="row">same name, <b>different signatures</b></div>
<div class="row">picked by the <b>arguments</b> in the call</div>
<div class="row">resolved at <b>compile time</b>, by the compiler</div>
<div class="row">needs <b>no keyword</b></div>
</div>
<div class="col late">
<div class="head">overriding</div>
<div class="row">in a <b>superclass and its subclass</b></div>
<div class="row">same name, <b>same signature</b></div>
<div class="row">picked by the <b>type of the object</b></div>
<div class="row">resolved at <b>run time</b>, by the JVM</div>
<div class="row">marked with <b>@Override</b> (optional)</div>
</div>
</div>

- **Overloading** is the same method name with different signatures. **Overriding** is the same method, with the same signature, in different classes connected through inheritance.

---

<!-- Speaker notes: ~0:36. Two points, both MCQ material. First, upcasting is also called a widening conversion and needs no cast. Second, Animal a = c; copies the reference, not the object: there is still one Cat, and both variables refer to it. Students who picture the assignment copying the object expect two Cats; point at the two arrows ending on one object. Lab DIY 3 starts with an upcast. -->

## Upcasting: subclass to superclass

- `Cat` extends `Animal`. It overrides `speak()`, and it also has a method that `Animal` does not have: `scratch()`.
- **Upcasting** stores a subclass object in a variable of its superclass type. It is also called a **widening** conversion.

<div class="pair">
<div>

<!-- no-compile -->
```java
Cat c = new Cat();
Animal a = c;        // upcasting: automatic
```

</div>
<div class="refs">
<div class="vars"><div class="var">c <small>(type Cat)</small></div><div class="var">a <small>(type Animal)</small></div></div>
<div class="obj">a Cat object</div>
</div>
</div>

* It is automatic and always safe, because every `Cat` is an `Animal`.
* `Animal a = c;` copies the **reference**, not the object: `a` and `c` refer to the **same** `Cat` object.
* Through `a`, you can only call methods that `Animal` has: `a.speak()` runs the `speak()` in `Cat`, but `a.scratch()` does not compile.

---

<!-- Speaker notes: ~0:39. Downcasting is the way back, and it is never automatic: the compiler only knows the reference type, so it insists on a cast. The cast is a check that the JVM makes when the line runs, which is why the last example compiles and still fails. Downcasting is also called a narrowing conversion; both names are MCQ material. -->

## Downcasting: superclass to subclass

<!-- _class: code-sm -->

- `Cat` extends `Animal` and has a method of its own, `scratch()`.
- **Downcasting** goes back from a superclass variable to a subclass variable. It is also called a **narrowing** conversion, and it needs an explicit **cast**:

<!-- no-compile -->
```java
Animal a = new Cat();
Cat c = (Cat) a;        // downcasting: the (Cat) cast is required
c.scratch();            // works: c is a Cat variable
```

- Without the cast, `Cat c = a;` does not compile: the compiler only knows that `a` is an `Animal`.
- A downcast can fail: if the object is not really a `Cat`, it compiles but throws a `ClassCastException` when it runs:

<!-- no-compile -->
```java
Animal plain = new Animal();
Cat c = (Cat) plain;    // compiles, then throws a ClassCastException
```

---

<!-- Speaker notes: ~0:42. Predict beat with three different outcomes. Two wrong answers come up. For A, many say it compiles because the object really is a Dog: they think the compiler can see the object, when it only sees the reference type Animal. For C, many say compile error for the same reason, or think the cast turns the Dog into a Cat: a cast never changes an object, it only checks it, and that check happens at run time. Lab DIY 3 has students cause this ClassCastException once and then prevent it. -->

## Predict: what happens on each line?

- `Dog` and `Cat` both extend `Animal`. Take each of the lines A, B and C on its own:

<!-- no-compile -->
```java
Animal a = new Dog();

Dog d1 = a;            // line A
Dog d2 = (Dog) a;      // line B
Cat c = (Cat) a;       // line C
```

* **A: compile error.** `Animal` to `Dog` is a narrowing conversion, so it needs an explicit `(Dog)` cast.
* **B: works.** The cast is there, and the object really is a `Dog`.
* **C: compiles, then throws a `ClassCastException`** when it runs: the object is a `Dog`, and a `Dog` is not a `Cat`.

---

<!-- Speaker notes: ~0:45. The answer to the opening problem. The array's type is Animal, so every element is upcast on the way in, and each object still knows what it is, so each call runs its own speak(). Upcasting alone is not polymorphism; it is what makes it possible. Lab DIY 4 writes this kind of loop over a Dog and Cat array, and DIY 5 adds a Horse without changing the loop. -->

## One array for every kind of animal

<!-- _class: code-sm -->

- `Dog` and `Cat` extend `Animal` and override `speak()`, to print `Woof` and `Meow`. Upcasting lets one array of type `Animal[]` hold both:

<div class="pair arr">
<div>

<!-- no-compile -->
```java
Animal[] zoo = new Animal[3];
zoo[0] = new Cat();      // upcast
zoo[1] = new Dog();      // upcast
zoo[2] = new Cat();

for (Animal a : zoo) {
    a.speak();           // Meow, Woof, Meow
}
```

</div>
<div class="mem">
<div class="name">zoo</div>
<div class="cell"><span class="idx">0 · Animal</span>Cat</div>
<div class="cell"><span class="idx">1 · Animal</span>Dog</div>
<div class="cell"><span class="idx">2 · Animal</span>Cat</div>
</div>
</div>

- Every box has the type `Animal`, but each object keeps its real type, so each call runs that object's own `speak()`. Without upcasting you would need one variable per object.
* Upcasting on its own is not polymorphism. Polymorphism happens when a call through a superclass variable runs an overriding method.

---

<!-- Speaker notes: ~0:49. The safe way to downcast, on an array. instanceof asks about the object, not the variable, and it is checked when the line runs, so the Dog in the middle is simply skipped and no ClassCastException can happen. Lab DIY 3 guards a cast like this, and DIY 4 uses it in a loop to call fetch() on the dogs only. -->

## instanceof: check before you downcast

- `x instanceof Cat` is `true` when the object that `x` refers to really is a `Cat`. Check it before you downcast, and the cast cannot fail.
- `zoo` holds a `Cat`, a `Dog` and a `Cat`. Only `Cat` has the method `scratch()`, which prints `Cat scratches`:

<!-- no-compile -->
```java
Animal[] zoo = { new Cat(), new Dog(), new Cat() };

for (Animal a : zoo) {
    if (a instanceof Cat) {
        Cat c = (Cat) a;          // safe: a really refers to a Cat
        c.scratch();
    }
}
```

- This prints `Cat scratches` twice. The `Dog` fails the `instanceof` test, so it is never cast.

---

<!-- Speaker notes: ~0:52. Read each benefit's name with its one-line meaning: the names are MCQ material. The callout answers a common guess, that choosing methods at run time is about speed. Extensibility is the one students see in lab DIY 5, where a new Horse class needs no change to the loop. -->

## Benefits of polymorphism

- **Code reusability:** write a method once for the superclass, and it works for every subclass.
- **Flexibility:** a variable, a parameter or an array of the superclass type can hold an object of any subclass.
- **Separation of concerns:** the calling code says *what* to do (`speak()`); each class decides *how* to do it.
- **Dynamic method dispatch:** Java picks the right overriding method at run time, from the actual type of the object.
- **Extensibility:** a new subclass can be added with little or no change to the code that uses the superclass.

<div class="callout"><strong>Not a benefit:</strong> polymorphism does not make a program run faster. Its benefits are code that is easier to write, reuse, extend and maintain.</div>

---

## Summary

<!-- _class: dense -->

- **Polymorphism**: one method call does different things depending on the object it is called on. **Binding** links a method call to the method body that runs.
- **Compile-time** (static) polymorphism is **method overloading**: one class, one method name, different signatures. A signature is the name plus the number, types and order of the parameters, never the return type. The compiler picks the method from the arguments.
- **Run-time** (dynamic) polymorphism is **method overriding**: a subclass gives an inherited method a new body with the same signature. The superclass's method is the overridden method; the subclass's is the overriding method. The JVM picks the method from the object's type: dynamic method dispatch.
- **Upcasting** (widening) is automatic and safe. **Downcasting** (narrowing) needs an explicit cast and can throw a `ClassCastException`, so check with `instanceof` first.
- One array of the superclass type can hold objects of every subclass, and one loop runs each object's own method.
