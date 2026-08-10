---
marp: true
theme: ooc
paginate: true
transition: fade
title: "Inheritance"
week: 8
topic: inheritance
type: lecture
source: authored
---

<style>
/* Deck-local visual system: family trees, the constructor ladder, the pillar
   strip and the is-a/has-a card - all drawn in CSS, no image files. */
section .kicker {
  font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 17px; color: #E76F00; letter-spacing: 0.05em;
}
section .legend { font-size: 17px; color: #8B8471; margin-top: 4px; text-align: center; }

/* - family trees: root at the top, arrowhead at the parent - */
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
section .tree.tight { margin: 12px 0 4px 0; }
section .tree.tight .tnode { padding: 3px 16px; font-size: 20px; }
section .tree.tight .tdown { height: 20px; }
section .tcap { text-align: center; font-size: 18px; color: #46536B; margin: 10px 0 0 0; }

/* - the forbidden shape: two parents merging into one child - */
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

/* - the four-pillar strip - */
section .pillars { display: flex; gap: 16px; margin: 26px 0 14px 0; }
section .pillar {
  flex: 1; border: 2px solid #33698C; border-radius: 10px;
  padding: 16px 8px 13px; text-align: center; background: #FFFFFF;
}
section .pillar .pname { font-family: 'Cascadia Code', Consolas, monospace; font-weight: 600; font-size: 21px; }
section .pillar .pwk { display: block; font-size: 16px; color: #8B8471; margin-top: 6px; }
section .pillar.done { background: #F4F0E6; }
section .pillar.now { background: #FDEFD9; border-color: #E76F00; }
section .pillar.now .pname { color: #B94E00; }
section .pillar.soon { border-style: dashed; opacity: 0.8; }

/* - the constructor ladder - */
section .ladder { display: grid; grid-template-columns: 200px 1fr 200px; column-gap: 20px; margin: 20px 0 6px 0; }
section .floors { display: flex; flex-direction: column; gap: 16px; }
section .floor {
  display: flex; align-items: center; border: 2px solid #33698C;
  border-radius: 9px; background: #FFFFFF; padding: 9px 14px;
  font-family: 'Cascadia Code', Consolas, monospace;
}
section .floor.hot { background: #FDEFD9; border-color: #E76F00; }
section .floor .fname { flex: 1; text-align: center; font-size: 21px; }
section .chip {
  display: inline-flex; width: 30px; height: 30px; border-radius: 50%;
  align-items: center; justify-content: center; font-size: 17px; font-weight: 600;
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}
section .chip.up { background: #33698C; color: #FFFFFF; }
section .chip.dn { background: #E76F00; color: #FFFFFF; }
section .rail { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
section .rail .arrowline { position: relative; width: 2px; height: 110px; background: #33698C; }
section .rail.dn .arrowline { background: #E76F00; }
section .rail.up .arrowline::before {
  content: ''; position: absolute; top: -2px; left: -5px;
  border-left: 6px solid transparent; border-right: 6px solid transparent;
  border-bottom: 10px solid #33698C;
}
section .rail.dn .arrowline::after {
  content: ''; position: absolute; bottom: -2px; left: -5px;
  border-left: 6px solid transparent; border-right: 6px solid transparent;
  border-top: 10px solid #E76F00;
}
section .rail .rlabel { font-size: 16px; color: #46536B; text-align: center; }

/* - side-by-side halves & the is-a/has-a card - */
section .duo { display: flex; gap: 30px; margin: 18px 0 6px 0; }
section .duo .half { flex: 1; display: flex; flex-direction: column; align-items: center; }
section .duo .tree { margin: 8px 0 4px 0; }
section .duo .tnode { font-size: 19px; padding: 5px 14px; }
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
</style>

<!-- _class: lead -->
<!-- _paginate: false -->

<span class="kicker">// week 08 · inheritance · object-oriented computing</span>

# Java Inheritance

<div class="tree">
<div class="tnode">Person</div>
<div class="tdown"></div>
<div class="tkids">
<div class="tkid"><div class="tnode">Student</div></div>
<div class="tkid"><div class="tnode">Lecturer</div></div>
</div>
</div>

Write it once. Every child gets it.

---

<!-- Speaker notes: ~0:00. Cold open on the duplication pain - they'll recognise the classic Person class on sight. Let the pasted comments land before the fragment. -->

## A true story

<style scoped>
section pre { padding: 14px 20px; margin: 10px 0; font-size: 18px; line-height: 1.35; }
section pre code { font-size: 18px; }
</style>

- Your timetable app needs **students** and **lecturers** - and every one of them has a name and an age.

```java
class Person {
    private String name;
    private int age;
    public String getName() {
        return name;
    }
}

class Student {
    private String name;            // pasted
    private int age;                // pasted
    public String getName() {       // pasted
        return name;
    }
}

// class Lecturer { ...the same three members, a third time... }
```

* Three classes. The same three members. **Hand-pasted, twice.**

---

## Then the requirement changes

- Small ask from the registrar: rename `name` to `fullName`. Easy - it's *one field*.

* Edit #1 - `Person`. Done.
* Edit #2 - `Student`. Done.
* Edit #3 - `Lecturer`… you were sure you did it. You didn't.
* And nothing fails loudly - the three classes don't even *know* they're copies of each other. The bug waits.
* Every duplicated line is **copy-paste debt** - and today it fell due. **There has to be a better way.**

---

## The idea

- Move the common part **up** into one class. Write it **once**. Let the others **inherit** it.

```java
class Person { /* name, age, getters -- written ONCE */ }

class Student  extends Person { }
class Lecturer extends Person { }
```

<div class="tree">
<div class="tnode hot">Person</div>
<div class="tdown"></div>
<div class="tkids">
<div class="tkid"><div class="tnode">Student</div></div>
<div class="tkid"><div class="tnode">Lecturer</div></div>
</div>
</div>

<p class="legend">one copy of the common code · two one-line classes · rename a field? one edit</p>

* `extends` is the whole trick - everything `Person` has, `Student` and `Lecturer` now have too.

---

## Agenda

- The four pillars - where inheritance sits
- is-a: the relationship, the arrow, the names
- `extends` - Person and Employee, the classic pair
- `Object`: the ancestor of everything
- The five shapes of inheritance - and the forbidden one
- Vehicles, animals, and is-a vs has-a
- Constructors: the ancestor ladder and `super`

---

<!-- Speaker notes: ~0:07. Orientation movement - place today on the four-pillar map, then define the relationship precisely. -->

## The four pillars - you are here

- Recall: OOP stands on four pillars, and **encapsulation** - private fields behind public gates - is pillar one.

<div class="pillars">
<div class="pillar done"><span class="pname">Encapsulation</span><span class="pwk">pillar 1 · done ✓</span></div>
<div class="pillar now"><span class="pname">Inheritance</span><span class="pwk">pillar 2 · today</span></div>
<div class="pillar soon"><span class="pname">Polymorphism</span><span class="pwk">pillar 3</span></div>
<div class="pillar soon"><span class="pname">Abstraction</span><span class="pwk">pillar 4</span></div>
</div>

- Today is pillar two - the load-bearing one: polymorphism only exists **because of** inheritance.

---

## The definition

- **Inheritance**: the mechanism by which one class **acquires the fields and methods** of another.
- It expresses an **is-a** relationship: an `Employee` *is a* `Person`.

<div class="tree">
<div class="tnode">Person</div>
<div class="tdown"></div>
<div class="tnode hot">Employee</div>
</div>

<p class="legend">the arrowhead always sits at the parent - the child points up and says "I am one of those"</p>

- The **sentence test**: say "*X is a Y*" out loud. Sounds true? Inheritance fits. Sounds silly? It doesn't. We'll weaponise this shortly.

---

## The names everyone uses

```java
class Superclass {
    // fields and methods every child should share
}

class Subclass extends Superclass {
    // only what makes THIS child different
}
```

| The class that gives | The class that receives |
|---|---|
| **superclass** | **subclass** |
| base class | derived / extended class |
| parent class | child class |

- Docs, exams and Stack Overflow rotate freely through all six - perfect synonyms.

---

<!-- Speaker notes: ~0:12. The extends movement - Person/Employee: the familiar Person class, the familiar getters. -->

## Meet the parent - a plain Person

```java
public class Person {
    private int age;

    public int getAge() {
        return age;
    }
    public void setAge(int a) {
        this.age = a;
    }
}
```

- Private field, public gates - **encapsulation**, unchanged. It's about to matter.
- Notice what's *missing*: nothing here mentions inheritance. Being extended costs the parent **nothing**, and it never knows.

---

## One word - extends

<style scoped>
section pre { padding: 12px 18px; margin: 8px 0; font-size: 17px; line-height: 1.3; }
section pre code { font-size: 17px; }
</style>

```java
class Person {                      // previous slide, unchanged
    private int age;
    public int getAge() {
        return age;
    }
    public void setAge(int a) {
        this.age = a;
    }
}

public class Employee extends Person {
    private String role;
    public String getRole() {
        return role;
    }
    public void setRole(String r) {
        this.role = r;
    }
    // no age, no getAge, no setAge -- Employee has all three anyway
}
```

* `Employee` declares one field and two methods - but delivers two fields and four methods. `extends` wrote the other half.

---

## Run it

<style scoped>
section pre { padding: 8px 16px; margin: 4px 0; font-size: 13px; line-height: 1.25; }
section pre code { font-size: 13px; }
</style>

```java
class Person {
    private int age;
    public int getAge() {
        return age;
    }
    public void setAge(int a) {
        this.age = a;
    }
}

class Employee extends Person {
    private String role;
    public String getRole() {
        return role;
    }
    public void setRole(String r) {
        this.role = r;
    }
}

public class Main {
    public static void main(String[] args) {
        Employee emp = new Employee();
        emp.setAge(25);                          // inherited
        emp.setRole("Developer");                // Employee's own
        System.out.println(emp.getAge() + " : " + emp.getRole());
    }
}
```

* Prints `25 : Developer` - two of those calls ran code `Employee` never wrote.

---

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
        return age > 65;      // <-- does THIS line compile?
    }
}
```

* **No.** `age` has private access in `Person` - the child cannot touch it.
* `Employee` **inherits the room but not the key** - the `age` box exists in every `Employee` object, but `private` keeps access inside `Person`.
* The fix that always works: `return getAge() > 65;`.
* **`protected`** exists for exactly this - open to subclasses, closed to strangers.

---

<!-- Speaker notes: ~0:20. Object movement - the array-printing gibberish finally gets explained. Enjoy the reveal. -->

## The ancestor of everything - Object

```java
class Person { }              // you wrote no extends...

Person p = new Person();
System.out.println(p);        // Person@1b6d3586 -- whose toString() is that?
```

- Write no `extends` and Java adds one: **every class descends from `java.lang.Object`**.
- That gibberish is `Object`'s `toString()` - the very one you see when printing an array. `equals` and `hashCode` ride along too.

<div class="tree tight">
<div class="tnode hot">Object</div>
<div class="tdown"></div>
<div class="tnode">Person</div>
<div class="tdown"></div>
<div class="tnode">Employee</div>
</div>

<p class="legend">every chain of extends ends at Object - no exceptions, no orphans</p>

---

<!-- Speaker notes: ~0:24. Shapes movement - five names, four small trees, one forbidden. The names are pure recognition marks for MCQs. -->

## The five shapes of inheritance

- One keyword - `extends` - but the **trees** it grows have names:

| Shape | The tree | Java classes? |
|---|---|---|
| Single | one parent, one child | yes |
| Multilevel | a child of a child - a chain | yes |
| Hierarchical | many children, one parent | yes |
| Hybrid | any mix of the above | yes |
| **Multiple** | **one child, two parents** | **no - interfaces only** |

- Next three slides: one small tree each, all grown from our university.

---

## Single & multilevel

- Read every arrow aloud as "**is a**" - if the whole tree reads true, the design is sound.

<div class="duo">
<div class="half">
<p class="tcap"><strong>single</strong> - one extends</p>
<div class="tree">
<div class="tnode">Person</div>
<div class="tdown"></div>
<div class="tnode hot">Student</div>
</div>
<p class="tcap"><code>class Student extends Person</code></p>
</div>
<div class="half">
<p class="tcap"><strong>multilevel</strong> - the chain</p>
<div class="tree">
<div class="tnode">Person</div>
<div class="tdown"></div>
<div class="tnode">Employee</div>
<div class="tdown"></div>
<div class="tnode hot">Lecturer</div>
</div>
<p class="tcap"><code>class Lecturer extends Employee</code></p>
</div>
</div>

* `Lecturer` inherits **both** floors above it: everything from `Employee` *and* everything from `Person`. The chain delivers.

---

## Hierarchical & hybrid

<div class="duo">
<div class="half">
<p class="tcap"><strong>hierarchical</strong> - siblings share a parent</p>
<div class="tree">
<div class="tnode">Person</div>
<div class="tdown"></div>
<div class="tkids">
<div class="tkid"><div class="tnode">Student</div></div>
<div class="tkid"><div class="tnode">Employee</div></div>
<div class="tkid"><div class="tnode">Alumni</div></div>
</div>
</div>
<p class="tcap">three classes <code>extends Person</code></p>
</div>
<div class="half">
<p class="tcap"><strong>hybrid</strong> - a mix in one program</p>
<div class="tree">
<div class="tnode">Person</div>
<div class="tdown"></div>
<div class="tkids">
<div class="tkid"><div class="tnode">Student</div></div>
<div class="tkid">
<div class="tnode">Employee</div>
<div class="tdown"></div>
<div class="tnode">Lecturer</div>
</div>
</div>
</div>
<p class="tcap">hierarchical + multilevel at once</p>
</div>
</div>

- Real systems are nearly always hybrid - the names matter less than reading each arrow correctly.

---

## Multiple - the forbidden shape

- Tempting: a paid PhD demonstrator *is a* `Student` **and** *is an* `Employee`…

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
class TeachingAssistant extends Student, Employee { }   // one child, two parents?
```

* Java **refuses**: a class extends **exactly one** class. Multiple inheritance of classes does not exist in Java.
* Why: if both parents defined `getRole()`, which one would the child inherit? Java won't guess (the classic *diamond problem*).
* The legal route is **interfaces** - multiple inheritance of *type*, without the ambiguity.

---

<!-- Speaker notes: ~0:33. Case-study movement - two familiar worlds, then the discriminator card that catches the classic design mistake. -->

## Case study - vehicles

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

```java
class Vehicle { }
class Car extends Vehicle { }
class Truck extends Vehicle { }
class SportsCar extends Car { }
```

- **General at the top, specific at the bottom** - each step down *adds* detail, never removes it. The whole diagram is four lines of Java.

---

## Case study - animals

<div class="tree">
<div class="tnode">Animal</div>
<div class="tdown"></div>
<div class="tkids">
<div class="tkid">
<div class="tnode">Mammal</div>
<div class="tdown"></div>
<div class="tkids">
<div class="tkid"><div class="tnode">Dog</div></div>
<div class="tkid"><div class="tnode">Cat</div></div>
</div>
</div>
<div class="tkid"><div class="tnode">Bird</div></div>
</div>
</div>

- One tree - three shapes hiding in it. Find them:

* Single? `Bird extends Animal`.
* Multilevel? `Dog` → `Mammal` → `Animal` - so a `Dog` inherits from **both**.
* Hierarchical? `Dog` and `Cat` are siblings under `Mammal`. And every arrow passes the sentence test - the tree is sound.

---

## is-a or has-a - the arrow you draw

- The classic design bug: reaching for `extends` when the truth is *containment*. Run the **sentence test** first.

<div class="duo">
<div class="panel">
<p class="ptitle">is-a → inheritance</p>
<div class="tree">
<div class="tnode">Vehicle</div>
<div class="tdown"></div>
<div class="tnode hot">Car</div>
</div>
<p class="tcap"><code>class Car extends Vehicle</code></p>
</div>
<div class="panel">
<p class="ptitle">has-a → a field inside</p>
<div class="holder">Car<div class="inner">Engine</div></div>
<p class="tcap"><code>class Car { private Engine engine; }</code></p>
</div>
</div>

<p class="legend">a Car IS a Vehicle → extends · a Car HAS an Engine → field - different truth, different drawing</p>

---

## Predict: extends - or field?

- Sentence test, out loud, quick fire:

- `Car` and `Engine`?

* **has-a** - "a Car is an Engine" is nonsense. `Engine` becomes a field.

- `SportsCar` and `Car`?

* **is-a** - `class SportsCar extends Car`.

- `Library` and `Book`?

* **has-a** - a library isn't a book; it *holds* thousands of them (an array of them, most likely).
* When genuinely torn: prefer **has-a**. A field is easy to change later - `extends` is a public promise that X is a Y, forever.

---

<!-- Speaker notes: ~0:43. Constructor movement - slow right down. Ladder plus two predicts; this is MCQ-favourite territory. -->

## Constructors are not inherited

<!-- _class: code-sm -->

- Fields and methods are **members** of a class - and members are what inheritance copies down.
- **Constructors are not members.** `Person`'s constructor never becomes `Student`'s constructor.

```java
class Person {
    Person() {
        System.out.println("Person built");
    }
}

class Student extends Person {
    // no constructor arrives down here -- and yet...
    // new Student() WILL print "Person built". Watch.
}
```

- Not inherited - but not unreachable either: a subclass constructor **calls** its parent's constructor. Every single time.

---

## The ancestor ladder

- One `new Student()` - **three** constructors run. The call climbs the ladder; the bodies run back down.

<div class="ladder">
<div class="rail up"><div class="arrowline"></div><div class="rlabel">the climb - <br>every constructor's<br>first act: call the parent</div></div>
<div class="floors">
<div class="floor"><span class="chip up">3</span><span class="fname">Object()</span><span class="chip dn">4</span></div>
<div class="floor"><span class="chip up">2</span><span class="fname">Person()</span><span class="chip dn">5</span></div>
<div class="floor hot"><span class="chip up">1</span><span class="fname">new Student()</span><span class="chip dn">6</span></div>
</div>
<div class="rail dn"><div class="arrowline"></div><div class="rlabel">the run - <br>bodies execute top-down:<br>oldest finishes first</div></div>
</div>

<p class="legend">1 new Student() starts · 2 its hidden super() enters Person() · 3 Person's super() enters Object() · 4 Object's body runs · 5 Person's body runs · 6 Student's body runs last</p>

<div class="callout"><strong>Oldest finishes first.</strong> A child constructor never runs its body until every ancestor above it is fully built.</div>

---

## Predict: what prints?

<!-- _class: code-xs -->

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
public class Main {
    public static void main(String[] args) {
        new Student();
    }
}
```

* `Person ready` - then `Student ready`. The parent **always** goes first.
* But nobody called `Person()`… Java inserted an invisible **`super();`** as line one of `Student()`.
* Strictly, **three** constructors ran - `Object`'s went first of all, silently.

---

## Predict: which line breaks?

<!-- _class: code-sm -->

- One change: `Person` now **demands a name** - its only constructor.

<!-- no-compile -->
```java
class Person {
    private String name;
    Person(String name) {                       // the ONLY constructor
        this.name = name;
    }
}

class Student extends Person {
    Student() { }                               // <-- boom. But why?
}
```

* The `Student() { }` line - its invisible `super();` asks `Person` for a no-arg constructor, and there isn't one.
* An old rule strikes again: declaring `Person(String)` **cost `Person` its free default constructor**.
* The fix: call the parent **yourself**, with arguments - next slide.

---

## super - speaking to your parent

<!-- _class: code-sm -->

```java
class Mammal {
    int age;
    Mammal(int age) {
        this.age = age;
    }
}
class Cat extends Mammal {
    Cat(int age) {
        super(age);   // pass it up -- MUST be the first statement
    }
}
```

- `super(...)` invokes the superclass constructor - write it, or accept the invisible no-arg version. **First statement, always.**
- `super.member` picks the parent's version when names collide - a preview of *overriding*.
- There is no `super.super` - you may speak to your parent, never *past* them to an ancestor.

---

<!-- Speaker notes: ~0:53. Landing movement - pay off the hook explicitly; the facts table is revision fuel. -->

## Why inheritance earns its keep

- **Reuse** - the hook, paid off: name, age and the getters written **once**; `fullName` renamed **once**. Copy-paste debt: cancelled.
- **Organisation** - common code has one home at the top of the tree; every class states only its *difference*.
- **Flexibility** - code written for `Person` accepts `Student`, `Lecturer` and `Employee` without edits - any subclass, forever.

* That last superpower has a name - **polymorphism** - and it deserves an hour of its own.

---

<!-- _class: dense -->

## Facts to keep - the fine print

| Fact | Detail |
|---|---|
| Exactly one parent | Every class except `Object` has exactly **one** direct superclass; write no `extends` and that superclass is `Object`. |
| Children unlimited | A superclass can have any number of subclasses - but it never knows about them, and never names them. |
| Constructors | Not members → never inherited. Reachable via `super(...)`, which must be the **first statement** of a subclass constructor. |
| `private` members | Inherited storage, no direct access - the subclass goes through the parent's `public`/`protected` gates. |
| Every chain ends at `Object` | `toString`, `equals`, `hashCode` arrive from the top of every tree - that's why every object answers them. |

---

## Summary

- Inheritance moves shared code **up**: `class Child extends Parent` acquires the parent's fields and methods - written once, fixed once, copy-paste debt cancelled.
- The relationship is **is-a**, checked with the sentence test; the drawn arrowhead always sits at the parent. is-a → `extends`; has-a → a **field**.
- Superclass = base = parent; subclass = child = derived. Every class has exactly **one** direct superclass, and every chain ends at **`Object`** - source of `toString` and `equals`.
- Legal tree shapes: single, multilevel, hierarchical, hybrid. **Multiple inheritance of classes is forbidden** - interfaces fill that gap.
- Constructors are **not inherited**: every subclass constructor starts with `super(...)` - written or invisible - so construction climbs to `Object` and bodies run back down, **oldest first**.
- If the parent has no no-arg constructor, the invisible `super()` breaks the build - call `super(args)` yourself, as the first statement.
