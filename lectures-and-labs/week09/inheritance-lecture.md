---
marp: true
theme: ooc
paginate: true
transition: fade
title: "Inheritance"
topic: inheritance
type: lecture
source: authored
---

<style>
/* Deck-local diagrams, all drawn in CSS (no image files): class trees
   (UML style: the arrowhead sits at the superclass), the four-pillars strip,
   the four types of inheritance, the multiple-inheritance merge and the
   is-a / has-a panels. */
section .legend { font-size: 17px; color: #8B8471; margin-top: 4px; text-align: center; }

/* class trees: superclass at the top, arrowhead at the superclass */
section .tree {
  display: flex; flex-direction: column; align-items: center;
  margin: 20px 0 6px 0; font-family: 'Cascadia Code', Consolas, monospace;
}
section .tnode {
  border: 2px solid #33698C; background: #FFFFFF; color: #1E2833;
  border-radius: 9px; padding: 6px 18px; font-size: 21px;
  min-width: 96px; text-align: center;
}
section .tnode.hot { background: #FDEFD9; border-color: #E76F00; color: #B94E00; font-weight: 600; }
section .tnode.bad { background: #F9E3E3; border: 2px dashed #C0392B; color: #C0392B; }
section .tdown { width: 0; height: 30px; position: relative; }
section .tdown::before {
  content: ''; position: absolute; top: 0; left: -6px;
  border-left: 6px solid transparent; border-right: 6px solid transparent;
  border-bottom: 9px solid #33698C;
}
section .tdown::after {
  content: ''; position: absolute; top: 8px; bottom: 0; left: -1px;
  width: 2px; background: #33698C;
}
section .tkids { display: flex; justify-content: center; align-items: flex-start; }
section .tkid {
  display: flex; flex-direction: column; align-items: center;
  padding: 26px 14px 0 14px; position: relative;
}
section .tkid::before {
  content: ''; position: absolute; top: 0; left: 50%; margin-left: -1px;
  width: 2px; height: 26px; background: #33698C;
}
section .tkid::after {
  content: ''; position: absolute; top: 0; left: 0; right: 0;
  height: 2px; background: #33698C;
}
section .tkid:first-child::after { left: 50%; }
section .tkid:last-child::after { right: 50%; }
section .tkid:only-child::after { display: none; }
section .tree.tight { margin: 10px 0 4px 0; }
section .tree.tight .tnode { padding: 3px 12px; font-size: 18px; min-width: 70px; }
section .tree.tight .tdown { height: 20px; }
section .tree.tight .tkid { padding: 20px 6px 0 6px; }
section .tree.tight .tkid::before { height: 20px; }
section .tcap { text-align: center; font-size: 18px; color: #46536B; margin: 10px 0 0 0; }

/* two columns: code or a table on the left, a diagram on the right */
section .side2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 28px; align-items: center; }
section .side2 pre { margin: 6px 0; }
section .side2 table { margin: 6px 0; font-size: 21px; }
section .side2.narrow { grid-template-columns: 190px minmax(0, 1fr); }

/* the four types of inheritance, one small tree each */
section .types { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); column-gap: 12px; margin: 18px 0 6px 0; }
section .type { border: 2px solid #DED8C9; border-radius: 12px; background: #FFFFFF; padding: 10px 8px 12px; display: flex; flex-direction: column; align-items: center; }
section .type .tname { margin: 0; font-family: 'Cascadia Code', Consolas, monospace; font-size: 21px; font-weight: 600; color: #33698C; }
section .type .tdesc { margin: 8px 0 0 0; font-size: 17px; line-height: 1.3; color: #46536B; text-align: center; }

/* multiple inheritance: two superclasses merging into one subclass */
section .trow2 { display: flex; gap: 60px; justify-content: center; }
section .trow2 .tnode { min-width: 170px; }
section .tmerge { width: 230px; height: 54px; position: relative; }
section .tmerge::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 26px;
  border-left: 2px dashed #C0392B; border-right: 2px dashed #C0392B;
  border-bottom: 2px dashed #C0392B;
}
section .tmerge::after {
  content: ''; position: absolute; top: 26px; left: 50%; margin-left: -1px;
  width: 2px; height: 28px; background: #C0392B;
}
section .tmerge .ah {
  position: absolute; top: -8px; width: 0; height: 0;
  border-left: 6px solid transparent; border-right: 6px solid transparent;
  border-bottom: 9px solid #C0392B;
}
section .tmerge .ah.l { left: -7px; }
section .tmerge .ah.r { right: -7px; }

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

/* is-a / has-a panels */
section .duo { display: flex; gap: 30px; margin: 18px 0 6px 0; }
section .panel {
  flex: 1; border: 2px solid #DED8C9; border-radius: 12px;
  padding: 14px 16px; background: #FFFFFF;
  display: flex; flex-direction: column; align-items: center;
}
section .panel .ptitle {
  font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 20px; font-weight: 600; color: #33698C; margin: 0 0 4px 0;
}
section .holder {
  border: 2px solid #33698C; border-radius: 9px; background: #FFFFFF;
  padding: 10px 26px 14px; font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 21px; text-align: center; margin: 14px 0 8px 0;
}
section .holder .inner {
  margin-top: 8px; border: 2px solid #E76F00; background: #FDEFD9;
  color: #B94E00; border-radius: 7px; padding: 4px 16px; font-size: 19px;
}

/* lead-slide (dark) variants */
section.lead .tnode { background: rgba(255,255,255,0.07); border-color: #7FB4D8; color: #F4F1E8; }
section.lead .tdown::before { border-bottom-color: #7FB4D8; }
section.lead .tdown::after { background: #7FB4D8; }
section.lead .tkid::before, section.lead .tkid::after { background: #7FB4D8; }
section.lead .legend { color: #A9B6C4; text-align: left; }
</style>

<!-- Speaker notes: ~0:00. The tree is the whole lecture in one picture: Person holds the shared code once, and Student and Lecturer extend it. Point out that the arrowheads sit at Person, the class being extended; every later diagram draws arrows the same way. -->

<!-- _class: lead -->
<!-- _paginate: false -->

<span class="kicker">// inheritance · object-oriented computing</span>

# Java Inheritance

<div class="tree">
<div class="tnode">Person</div>
<div class="tdown"></div>
<div class="tkids">
<div class="tkid"><div class="tnode">Student</div></div>
<div class="tkid"><div class="tnode">Lecturer</div></div>
</div>
</div>

<p class="legend">Student and Lecturer extend Person: each arrow points at the class being extended</p>

Inheritance: a new class reuses the code of an existing class, and adds only what is new.

---

<!-- Speaker notes: ~0:01. Problem-first hook. Ask the room how many places a rename of name would touch before revealing the bullets. -->

## Problem: the same code in two classes

<!-- _class: code-sm -->

- Without inheritance, `Student` and `Lecturer` repeat the same code:

```java
class Student {
    private String name;
    private int age;
    public String getName() {
        return name;
    }
}

class Lecturer {
    private String name;          // the same instance variables again
    private int age;
    public String getName() {     // and the same method again
        return name;
    }
}
```

* Every change must be made in both copies: rename `name` to `fullName` and you must edit both classes.
* **Inheritance** fixes this: the shared code is written once, in one class.

---

<!-- Speaker notes: ~0:04. The whole idea in one slide. Stress that Student and Lecturer are now one line each, yet a Student still has a name and a getName() method. -->

## The idea: write the shared code once

<!-- _class: code-sm -->

- Put the shared code in one class, `Person`. `Student` and `Lecturer` then **extend** `Person`:

<div class="side2">
<div>

```java
class Person {
    private String name;
    private int age;
    public String getName() {
        return name;
    }
}

class Student extends Person { }
class Lecturer extends Person { }
```

</div>
<div>
<div class="tree">
<div class="tnode hot">Person</div>
<div class="tdown"></div>
<div class="tkids">
<div class="tkid"><div class="tnode">Student</div></div>
<div class="tkid"><div class="tnode">Lecturer</div></div>
</div>
</div>
<p class="legend">the shared code lives in Person only</p>
</div>
</div>

* `extends Person` means: every `Student` and every `Lecturer` has a name, an age and the `getName()` method, without writing them again.
* A change to the shared code is now made once, in `Person`.

---

## Agenda

- The four pillars of OOP
- What inheritance is: the is-a relationship and its names
- `extends`: an `Employee` that inherits from `Person`
- Private members and `protected`
- The `Object` class
- Types of inheritance, and why Java has no multiple inheritance
- is-a or has-a: when to use inheritance
- Constructors and the `super` keyword
- Benefits of inheritance

---

<!-- Speaker notes: ~0:07. The four-pillars overview again, with inheritance highlighted. Keep it to a minute: polymorphism and abstraction are topics of their own. -->

## The four pillars of OOP

- Object-oriented programming (OOP) is built on **four main ideas**. Inheritance is the second:

<div class="pillars">
<div class="pillar"><span class="p-name">Encapsulation</span><span class="p-line">bundle the data and the methods that use it in one class, and hide the data</span><span class="p-wk">pillar 1</span></div>
<div class="pillar now"><span class="p-chip">this lecture</span><span class="p-name">Inheritance</span><span class="p-line">build a new class from an existing class</span><span class="p-wk">pillar 2</span></div>
<div class="pillar"><span class="p-name">Polymorphism</span><span class="p-line">one method call can behave differently for different objects</span><span class="p-wk">pillar 3</span></div>
<div class="pillar"><span class="p-name">Abstraction</span><span class="p-line">show what an object does, hide how it does it</span><span class="p-wk">pillar 4</span></div>
</div>

- Polymorphism, the third pillar, is only possible because of inheritance.

---

<!-- Speaker notes: ~0:09. Reference slide: the names on the left are all used interchangeably in books and exams, so students should recognise every one. The diagram style is a UML class diagram; the arrow direction (from subclass to superclass) is the detail students most often draw backwards. -->

## What inheritance is

- **Inheritance**: one class (the **subclass**) gets the instance variables and methods of another class (the **superclass**), and adds its own.
- It models an **is-a** relationship: an `Employee` *is a* `Person`. Test it by saying "X is a Y" out loud: if it is true, inheritance fits.

<div class="side2">
<div>

| The class that is extended | The class that extends it |
|---|---|
| **superclass** | **subclass** |
| base class | derived class |
| parent class | child class |
| | extended class |

</div>
<div>
<div class="tree">
<div class="tnode">Person</div>
<div class="tdown"></div>
<div class="tnode hot">Employee</div>
</div>
<p class="legend">a UML class diagram: the arrow points from the subclass (Employee) to its superclass (Person)</p>
</div>
</div>

---

<!-- Speaker notes: ~0:12. The worked example of extends. Count the methods aloud: Employee's file has two, an Employee object has four. Lab DIY 1 builds exactly this shape with Animal and Dog. -->

## extends: Employee inherits from Person

<!-- _class: code-sm -->

<div class="side2">
<div>

```java
public class Person {
    private int age;

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }
}
```

</div>
<div>

<!-- no-compile -->
```java
public class Employee extends Person {
    private String role;

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
```

</div>
</div>

- Code in another class can call all four methods on an `Employee`:

<!-- no-compile -->
```java
Employee emp = new Employee();
emp.setAge(25);                                              // inherited from Person
emp.setRole("Developer");                                    // Employee's own method
System.out.println(emp.getAge() + " : " + emp.getRole());    // prints 25 : Developer
```

* `Employee` writes only the `role` code. It inherits `getAge()` and `setAge()` from `Person`.

---

<!-- Speaker notes: ~0:15. Predict beat. The common wrong answer is "yes": students reason that the age field exists inside every Employee object, so Employee code must be able to use it. Private means private to the class that declares it, and subclasses are other classes. Lab DIY 4 hits this exact error and fixes it with protected. -->

## Predict: does this compile?

<!-- _class: code-sm -->

<!-- no-compile -->
```java
class Person {
    private int age;
    public int getAge() {
        return age;
    }
}

class Employee extends Person {
    public boolean canRetire() {
        return age > 65;                 // does this line compile?
    }
}
```

* **No**: `error: age has private access in Person`.
* **Private members are not inherited.** Every `Employee` object still has an age, but only code inside `Person` can use `age` by name.
* The fix: call the public getter, `return getAge() > 65;`. Declaring `age` as **protected** in `Person` would also work: subclasses can use a protected member directly.

---

<!-- Speaker notes: ~0:18. Students have printed an object or an array and seen text like this before; this is where it comes from. The exact hexadecimal number changes from run to run. Lab DIY 5 calls toString() and hashCode() on a class that declares neither. -->

## The Object class

<!-- _class: code-sm -->

- A class with no `extends` automatically extends **`Object`** (from the package `java.lang`). So every class has exactly **one** direct superclass, and every chain of classes ends at `Object`.

<div class="side2 narrow">
<div>
<div class="tree tight">
<div class="tnode hot">Object</div>
<div class="tdown"></div>
<div class="tnode">Person</div>
<div class="tdown"></div>
<div class="tnode">Employee</div>
</div>
</div>
<div>

```java
class Person { }               // no extends, so Person extends Object

Person p = new Person();
System.out.println(p);         // prints something like Person@1b6d3586
```

</div>
</div>

- So every object has the methods of `Object`, such as `toString()`, `equals()`, `hashCode()` and `getClass()`.
- `Person@1b6d3586` is what the `toString()` method of `Object` returns: the class name, then a code for the object.

---

<!-- Speaker notes: ~0:21. Four names for four shapes; they are recognition marks for MCQ questions. Read each arrow as "is a" to check a tree. Lab DIY 3 builds a multilevel chain and DIY 4 adds a hierarchical branch. -->

## Types of inheritance

- Classes that use `extends` form a tree. Its shape has a name, and Java allows all four of these:

<div class="types">
<div class="type"><p class="tname">Single</p>
<div class="tree tight">
<div class="tnode">Person</div>
<div class="tdown"></div>
<div class="tnode hot">Student</div>
</div>
<p class="tdesc">one class extends one class</p></div>
<div class="type"><p class="tname">Multilevel</p>
<div class="tree tight">
<div class="tnode">Person</div>
<div class="tdown"></div>
<div class="tnode">Employee</div>
<div class="tdown"></div>
<div class="tnode hot">Lecturer</div>
</div>
<p class="tdesc">a chain: Lecturer extends Employee, which extends Person</p></div>
<div class="type"><p class="tname">Hierarchical</p>
<div class="tree tight">
<div class="tnode">Person</div>
<div class="tdown"></div>
<div class="tkids">
<div class="tkid"><div class="tnode hot">Student</div></div>
<div class="tkid"><div class="tnode hot">Employee</div></div>
</div>
</div>
<p class="tdesc">several classes extend the same class</p></div>
<div class="type"><p class="tname">Hybrid</p>
<div class="tree tight">
<div class="tnode">Person</div>
<div class="tdown"></div>
<div class="tkids">
<div class="tkid"><div class="tnode">Student</div></div>
<div class="tkid"><div class="tnode">Employee</div><div class="tdown"></div><div class="tnode hot">Lecturer</div></div>
</div>
</div>
<p class="tdesc">a mix of the types above in one program</p></div>
</div>

- In a multilevel chain, the class at the bottom inherits from every class above it: a `Lecturer` gets the members of `Employee` and of `Person`.

---

<!-- Speaker notes: ~0:24. The one shape Java refuses. The diamond problem is the reason to remember, and the MCQ wording for it is exactly "the same method inherited from more than one superclass". Interfaces get a lecture of their own; here they are only named. -->

## Multiple inheritance is not allowed

- **Multiple inheritance**: one class inheriting from more than one superclass. For example:

<div class="tree">
<div class="trow2">
<div class="tnode">Student</div>
<div class="tnode">Employee</div>
</div>
<div class="tmerge"><i class="ah l"></i><i class="ah r"></i></div>
<div class="tnode bad">TeachingAssistant</div>
</div>

<!-- no-compile -->
```java
class TeachingAssistant extends Student, Employee { }    // compile error
```

* A Java class can extend only **one** class.
* Why: if `Student` and `Employee` both had a `getRole()` method, `TeachingAssistant` would inherit two different versions, and Java could not choose. This is called the **diamond problem**.
* Java does let one class implement several **interfaces**: that is the only kind of multiple inheritance Java has.

---

<!-- Speaker notes: ~0:27. A worked hierarchy that mixes two types, so students practise naming them. Ask the room for the type before each reveal. The lab's vehicle classes grow the same way. -->

## Example: a vehicle hierarchy

- General classes go at the top, more specific classes below them:

<div class="side2">
<div>
<div class="tree">
<div class="tnode">Vehicle</div>
<div class="tdown"></div>
<div class="tkids">
<div class="tkid">
<div class="tnode">Car</div>
<div class="tdown"></div>
<div class="tnode hot">SportsCar</div>
</div>
<div class="tkid"><div class="tnode">Truck</div></div>
</div>
</div>
</div>
<div>

```java
class Vehicle { }
class Car extends Vehicle { }
class Truck extends Vehicle { }
class SportsCar extends Car { }
```

</div>
</div>

* **Hierarchical**: `Car` and `Truck` both extend `Vehicle`.
* **Multilevel**: `SportsCar` extends `Car`, which extends `Vehicle`, so a `SportsCar` inherits from both.
* Together, the whole tree is **hybrid**: a mix of the two types.

---

<!-- Speaker notes: ~0:30. The design question behind every extends. The classic mistake is to extend a class just to reuse its code when the true relationship is "has a". Lab DIY 7 has students make this call for themselves. -->

## is-a or has-a: when to use inheritance

- Say the sentence out loud. If "X **is a** Y" is true, use inheritance. If "X **has a** Y" is true instead, give X a field of type Y:

<div class="duo">
<div class="panel">
<p class="ptitle">is-a: use extends</p>
<div class="tree">
<div class="tnode">Vehicle</div>
<div class="tdown"></div>
<div class="tnode hot">Car</div>
</div>
<p class="tcap">a Car is a Vehicle<br><code>class Car extends Vehicle</code></p>
</div>
<div class="panel">
<p class="ptitle">has-a: use a field</p>
<div class="holder">Car<div class="inner">Engine</div></div>
<p class="tcap">a Car has an Engine<br><code>class Car { private Engine engine; }</code></p>
</div>
</div>

---

<!-- Speaker notes: ~0:32. Quick-fire predict beat; watch SportsCar and Car in the middle. Straight after the warning on the previous slide, some students overcorrect and call it has-a too. The sentence test confirms extends exactly as often as it rules it out. MCQ scenario questions take this shape. -->

## Predict: extends or a field?

- Say each sentence out loud, then decide:

- `Car` and `Engine`?

* **Field** (has-a): "a Car is an Engine" is false, but "a Car has an Engine" is true.

- `SportsCar` and `Car`?

* **extends** (is-a): a SportsCar is a Car, so `class SportsCar extends Car`.

- `Library` and `Book`?

* **Field** (has-a): a library is not a book; it holds many books, for example in an array field.
* If you are unsure, use a field. A field is easy to change later; `extends` is much harder to undo once other code relies on it.

---

<!-- Speaker notes: ~0:35. Slow down from here: the constructor rules are where most marks are lost. Members versus constructors is the distinction to land; the next two slides apply it. -->

## Constructors are not inherited

- A class's **members** are its instance variables and its methods. A subclass inherits members.
- A **constructor is not a member**, so a subclass never inherits its superclass's constructors. Each class writes its own.
- A subclass constructor always **calls a superclass constructor first**, with `super(...)`.
- If a constructor does not start with `super(...)`, Java adds `super();` as its first line. That calls the superclass constructor that takes no arguments.

<div class="callout"><strong>So:</strong> creating a subclass object always runs a superclass constructor too, and the superclass part of the object is set up first.</div>

---

<!-- Speaker notes: ~0:37. Predict beat. Two wrong answers: "Student ready" alone, from treating the constructor like an ordinary method that runs only the code you named; and the two lines in the wrong order, from assuming the class named in new must finish first. Point back to the hidden super(); on the previous slide. -->

## Predict: what prints?

<!-- _class: code-sm -->

- `main` runs `new Student();` with these two classes:

```java
class Person {
    Person() {
        System.out.println("Person ready");
    }
}

class Student extends Person {
    Student() {
        System.out.println("Student ready");
    }
}
```

* `Person ready`, then `Student ready`.
* `Student()` never calls `Person()` in its code, but Java added `super();` as its first line, so `Person()` runs first.
* Constructors run from the top of the tree down: `Object()`, then `Person()`, then `Student()`.

---

<!-- Speaker notes: ~0:40. Predict beat. Get the room to name the failing line. The usual wrong guesses are the Person constructor, or that an empty Student() { } cannot fail. The hidden super(); is the culprit. Students hit this in their own lab code as soon as they give a superclass its first constructor with parameters; lab DIY 6 practises the fix. -->

## Predict: which line breaks?

<!-- _class: code-sm -->

- Now the only constructor in `Person` needs a name:

<!-- no-compile -->
```java
class Person {
    private String name;

    Person(String name) {                   // the only constructor
        this.name = name;
    }
}

class Student extends Person {
    Student() { }                           // does this line compile?
}
```

* `Student() { }` fails. Java adds `super();` to it, which looks for `Person()` with no arguments, and there is none.
* Java gives a class a no-argument constructor only when the class declares no constructors at all. `Person` declares `Person(String)`, so it has no `Person()`.
* The fix is to call `super(...)` with an argument yourself.

---

<!-- Speaker notes: ~0:43. The fix from the previous slide, then the second use of super. super.method() previews overriding, which polymorphism develops; here it only needs recognising. The first-statement rule holds in Java 21, the version the Codespaces use: javac 21 rejects a statement before super(...) with "flexible constructors is not supported". Java 25 relaxed it, so a student on a newer JDK can put statements that do not use the object before super(...) and see it compile. -->

## The super keyword

<!-- _class: code-sm -->

```java
class Person {
    private String name;

    Person(String name) {
        this.name = name;
    }
}

class Student extends Person {
    Student(String name) {
        super(name);          // calls Person(String): must be the first statement
    }
}
```

- `super(...)` calls a constructor of the superclass. It must be the **first statement** in the subclass constructor.
- `super.methodName()` calls the superclass's version of a method, when the subclass has its own method with the same name.
- `super` reaches only the direct superclass: `super.super` is not allowed.

---

<!-- Speaker notes: ~0:46. The three benefits by name: reusability, organisation, flexibility. Pair each with its example. Data protection is a benefit of encapsulation, not of inheritance. -->

## Benefits of inheritance

- **Code reusability:** shared code is written once, in the superclass, instead of being copied into every class.
  - *Example: `name`, `age` and `getName()` are written only in `Person`.*
- **Better organisation:** related classes form a tree, with the general code at the top and the specific code below.
- **Flexibility:** code written for a superclass works with every subclass.
  - *Example: a method with a `Person` parameter also accepts a `Student` or a `Lecturer`.*

---

## Summary

<!-- _class: dense -->

- **Inheritance**: a subclass gets the instance variables and methods of its superclass and adds its own, written `class Sub extends Super`. It models an **is-a** relationship. Superclass = base class = parent class; subclass = derived class = child class.
- **Private members are not inherited**: a subclass uses them through the superclass's public methods. A `protected` member can be used by subclasses directly.
- Every class has exactly **one** direct superclass (`Object` if you write no `extends`), so every object has `toString()`, `equals()`, `hashCode()` and `getClass()`. A superclass can have any number of subclasses.
- Types: single, multilevel, hierarchical and hybrid. **Multiple inheritance** of classes is not allowed (the diamond problem); a class can implement several interfaces instead.
- Use `extends` when "X is a Y" is true; use a field when "X has a Y" is true.
- **Constructors are not inherited.** Every subclass constructor first calls a superclass constructor with `super(...)` (Java adds `super();` if you leave it out), which must be its first statement.
