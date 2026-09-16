# Module overview

**Object-Oriented Computing** — Java, semester 1, Atlantic Technological
University. 12 teaching weeks: a module introduction (week 1, no lab), eight
topic weeks, and three Moodle MCQs (each held during the lab slot of its week,
one third of the grade each, no projects). Reading week is always the week of the Irish
October bank holiday, with 6 teaching weeks before it and 6 after.

Live slide decks: <https://danielcregg.is-a.dev/object-oriented-computing/>

**Topics at a glance:** Module Introduction → Classes and Objects → Methods
→ *MCQ 1* → Arrays → Strings → *(reading week)* → Encapsulation → *MCQ 2*
→ Inheritance → Polymorphism → Abstraction → *MCQ 3*. The last four
topic weeks teach the four OOP pillars in dependency order
(encapsulation → inheritance → polymorphism → abstraction).

---

## Introduction

[Slides](../lectures-and-labs/week01/lecture.md) · no lab in week 1

Two halves. First, module logistics: learning outcomes, delivery format and
timetable, the assessment matrix (three MCQs), the lab coding environment,
Moodle enrolment, and tasks for the week. Second, a Java fast-start: why
Java and where it came from, keywords, compiler vs interpreter and the
advantages of the JVM, the JDK, writing and running a first program in a
text editor vs an IDE (VS Code), the anatomy of a Java program, and the
common syntax errors beginners hit.

## Classes and Objects

[Slides](../lectures-and-labs/week02/lecture.md) ·
[Lab](../lectures-and-labs/week02/README.md)

The conceptual core of the module. What a class is (blueprint), attributes
/ members, class declaration syntax, and the benefits of classes; what an
object is and creating / instantiating objects with `new`; reference
variables and the difference between object identity and the names that
point at objects; class vs object side by side. Constructors — what makes
them unique, the types (default, no-arg, parameterised) — and the `this`
reference. Closes with the Single Responsibility Principle as a
class-design habit.

## Methods

[Slides](../lectures-and-labs/week03/lecture.md) ·
[Lab](../lectures-and-labs/week03/README.md)

What a method is, method syntax and anatomy (modifiers, return type, name,
parameter list, body). Parameters and arguments, return values, `void` vs
returning types, working with multiple parameters. Method scope and
visibility, private helper methods, static methods and static vs non-static
members. The method call stack and how to trace it, common mistakes
(e.g. missing return statements) and how to fix them, and method best
practices.

## MCQ 1 *(one third)*

[Details](../lectures-and-labs/week04/README.md) — runs in Moodle during the lab
slot. Examines everything taught before it: the introduction material,
classes and objects, and methods.

## Arrays

[Slides](../lectures-and-labs/week05/lecture.md) ·
[Lab](../lectures-and-labs/week05/README.md)

What an array is and its characteristics: fixed length, homogeneous
element type, zero-based indices. Declaring, constructing, and assigning
arrays (both syntaxes), reading and writing elements by index, the `length`
variable. Looping over arrays with `for` and for-each, then
multidimensional arrays. Includes an in-class quiz.

## Strings

[Slides](../lectures-and-labs/week06/lecture.md) ·
[Lab](../lectures-and-labs/week06/README.md)

Strings as objects: creating them (literals vs `new`) and how the String
pool and memory work (`intern()` as the proof). String immutability — what it means, why it's good
(safety, caching, thread-safety), and when it hurts (looped concatenation).
That motivates StringBuilder: its key methods in action, then String vs
StringBuffer vs StringBuilder (mutability, thread-safety, performance),
which to use when, best practices, and common mistakes. Immutability here
is the on-ramp to encapsulation next teaching week.

## Reading week — no lecture or lab

[Details](../lectures-and-labs/week06b-reading-week/README.md) — always the week of
the Irish October bank holiday (the last Monday of October).

## Encapsulation

[Slides](../lectures-and-labs/week07/lecture.md) ·
[Lab](../lectures-and-labs/week07/README.md)

Opens the four-pillars block; this deck is the canonical home of the
"four major principles of OOP" overview (later pillar decks open with a
recap of it). Why encapsulation matters, its definition (bundling state with
behaviour + data hiding), Java's access modifiers, and the implementation
recipe: private fields behind public getters and setters. A long worked
sequence on *why* getters/setters earn their keep — validation, read-only
properties, freedom to change internal representation — then encapsulation
visualised, a coding example, and the benefits.

## MCQ 2 *(one third)*

[Details](../lectures-and-labs/week08/README.md) — runs in Moodle during the lab
slot. Examines the weeks since MCQ 1: arrays, strings, and encapsulation.

## Inheritance

[Slides](../lectures-and-labs/week09/lecture.md) ·
[Lab](../lectures-and-labs/week09/README.md)

Definition and terminology (superclass/subclass, is-a), implementing
inheritance with `extends`, and a worked coding example. The `Object`
class at the root of every hierarchy. The types of inheritance (single,
multilevel, hierarchical — and why Java does multiple inheritance only via
interfaces), class-hierarchy case studies (vehicles, animals), and how to
identify a genuine inheritance situation. Constructors under inheritance
and the `super` keyword, invoking superclass constructors, benefits, and
key Java facts.

## Polymorphism

[Slides](../lectures-and-labs/week10/lecture.md) ·
[Lab](../lectures-and-labs/week10/README.md)

The two kinds of polymorphism. Compile-time: method signatures and
overloading, with worked examples. Runtime: method overriding, why it must
bind at runtime (dynamic dispatch), and overloading vs overriding compared.
Then the payoff: upcasting and downcasting, why upcasting is useful
(treating a mixed array/list of subtypes uniformly), downcasting safely,
and a full program that demonstrates everything together. Ends with
benefits and a recap.

## Abstraction

[Slides](../lectures-and-labs/week11/lecture.md) ·
[Lab](../lectures-and-labs/week11/README.md)

What abstraction is and how it differs from encapsulation, with real-life
examples. Java's two mechanisms: abstract classes (abstract vs concrete
classes and methods, the consequences of declaring a method abstract) and
interfaces (definition, implementation, what an interface can contain,
real-world examples). The comparison ladder — class vs interface, interface
vs abstract class, concrete vs abstract vs interface — plus why interfaces
exist and the benefits of abstraction.

## MCQ 3 *(one third)*

[Details](../lectures-and-labs/week12/README.md) — runs in Moodle during the lab
slot. Examines the weeks since MCQ 2: inheritance, polymorphism, and abstraction.
