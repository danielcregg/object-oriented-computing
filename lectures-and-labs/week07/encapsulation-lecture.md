---
marp: true
theme: ooc
paginate: true
transition: fade
title: "Encapsulation"
topic: encapsulation
type: lecture
source: authored
---

<style>
/* Deck-local diagrams, all drawn in CSS (no images): the title capsule,
   code in another class calling into a class, the four-pillars strip, the
   access-modifier table, and variables pointing at arrays. The shared
   components (.mem/.callout/.legend/.kicker) come from the theme.
   Colours: blue = private data, orange = public methods, green = code that
   compiles, red = code the compiler rejects. */
section .mem { display: flex; margin: 34px 0 10px 0; font-family: 'Cascadia Code', Consolas, monospace; }

/* title slide: the class drawn as a capsule, one half holding the private
   instance variable and the other the public method, each half labelled */
section .hero { width: 860px; margin: 20px 0 0 0; }
section .hero .h-top { text-align: center; font-size: 18px; color: #A9B6C4; line-height: 1.35; }
section .hero .h-top b {
  display: block; font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 24px; font-weight: 600; color: #FFFFFF;
}
section .hero .h-arrow { display: block; text-align: center; color: #E76F00; font-size: 28px; line-height: 1.15; }
section .hero .h-pill { display: flex; border: 3px solid #FFFFFF; border-radius: 999px; overflow: hidden; }
section .hero .h-var, section .hero .h-meth {
  flex: 1; padding: 18px 10px; text-align: center;
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 22px;
}
section .hero .h-var { background: #33698C; color: #FFFFFF; }
section .hero .h-meth { background: #FDEFD9; color: #B94E00; font-weight: 600; }
section .hero .h-notes { display: flex; }
section .hero .h-notes div { flex: 1; text-align: center; font-size: 17px; color: #A9B6C4; line-height: 1.35; }
section .hero .h-notes b { display: block; font-size: 20px; color: #FFFFFF; }
section.lead .hero ~ p { max-width: 900px; margin-top: 26px; text-wrap: balance; }

/* public methods (orange pills) and private data (blue box), shared by the
   two class diagrams below */
section .meth {
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 18px; font-weight: 600;
  background: #FDEFD9; border: 2px solid #E76F00; color: #B94E00;
  border-radius: 999px; padding: 6px 18px; white-space: nowrap; justify-self: start;
}
section .meth.missing { background: #F1EFEA; border: 2px dashed #8B8471; color: #8B8471; font-weight: 400; }
section .data {
  background: #E7F0F7; border: 2px solid #33698C; border-radius: 14px; padding: 12px 20px;
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 20px; color: #1E3A5F;
}
section .data small {
  display: block; margin-bottom: 4px;
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 15px;
  text-transform: uppercase; letter-spacing: 0.06em; color: #33698C;
}

/* "the fix" slide: three lines of code in another class, each pointing at
   what it reaches inside BankAccount */
section .scene {
  display: grid; grid-template-columns: 340px 54px 250px 1fr;
  grid-template-rows: auto 70px 70px 70px; row-gap: 14px; align-items: center;
  margin: 24px 0 6px 0;
}
section .scene .sc-h { grid-row: 1; font-size: 15px; letter-spacing: 0.08em; text-transform: uppercase; color: #8B8471; }
section .scene .sc-h.k {
  grid-column: 3 / 5; padding-left: 24px; text-transform: none; letter-spacing: 0;
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 20px; font-weight: 600; color: #33698C;
}
section .scene .wall {
  grid-column: 3 / 5; grid-row: 2 / 5; align-self: stretch;
  margin: -10px 0 -10px -14px; border: 3px solid #33698C; border-radius: 60px; background: #FFFFFF;
}
section .scene .call {
  grid-column: 1; font-family: 'Cascadia Code', Consolas, monospace; font-size: 18px; color: #1E2833;
  background: #EAF6EC; border: 2px solid #1E7A34; border-radius: 10px; padding: 6px 12px;
}
section .scene .call small {
  display: block; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #1E7A34;
}
section .scene .call.no { background: #FBEDEB; border-color: #C0392B; }
section .scene .call.no small { color: #C0392B; }
section .scene .arr { grid-column: 2; text-align: center; font-size: 30px; color: #1E7A34; }
section .scene .arr.no { color: #C0392B; }
section .scene .meth { grid-column: 3; z-index: 1; margin-left: 14px; }
section .scene .stop { grid-column: 3; z-index: 1; margin-left: 14px; font-size: 17px; font-weight: 600; color: #C0392B; }
section .scene .data { grid-column: 4; grid-row: 2 / 5; z-index: 1; margin-right: 30px; }
section .scene .r2 { grid-row: 2; }
section .scene .r3 { grid-row: 3; }
section .scene .r4 { grid-row: 4; }

/* a class on its own, with every public method it offers */
section .capsule {
  position: relative; display: flex; align-items: center; gap: 36px;
  width: 860px; margin: 26px auto 14px auto; padding: 26px 44px;
  border: 3px solid #33698C; border-radius: 70px; background: #FFFFFF;
}
section .capsule .k {
  position: absolute; top: -16px; left: 64px; padding: 0 10px; background: #FBFAF7;
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 20px; font-weight: 600; color: #33698C;
}
section .capsule .ms { display: flex; flex-direction: column; gap: 12px; }
section .capsule .data { flex: 1; }

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

/* access-modifier table */
section table.vmatrix {
  border-collapse: separate; border-spacing: 0;
  margin: 16px auto 8px auto; font-size: 23px;
}
section table.vmatrix th {
  background: #16222E; color: #E8ECF1; text-align: center;
  font-family: 'Cascadia Code', Consolas, monospace; font-size: 18px; font-weight: 600;
  padding: 10px 20px; border: none;
}
section table.vmatrix th:first-child { border-radius: 12px 0 0 0; text-align: left; padding-left: 20px; }
section table.vmatrix th:last-child { border-radius: 0 12px 0 0; }
section table.vmatrix td {
  text-align: center; padding: 8px 20px;
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
  background: #E7F0F7; color: #33698C;
}

/* variables pointing at arrays: two variables sharing ONE array, or each
   with an array of its own */
section .refs { display: flex; align-items: center; gap: 4px; margin: 40px 0 6px 0; }
section .refs .mem, section .rows .mem { margin: 0; }
/* right-aligned, and close together, so both arrows end on the array */
section .refs .vars { display: flex; flex-direction: column; gap: 8px; text-align: right; }
section .var { font-family: 'Cascadia Code', Consolas, monospace; font-size: 21px; font-weight: 600; color: #33698C; white-space: nowrap; }
section .var small { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 400; color: #8B8471; }
section .var::after { content: ' ⟶'; color: #E76F00; }
section .rows { display: flex; flex-direction: column; gap: 14px; margin: 22px 0 6px 0; }
section .rows .row { display: flex; align-items: center; gap: 4px; }
section .rows .var { min-width: 120px; }
</style>

<!-- Speaker notes: ~0:00. The capsule is the whole lecture in one picture. Point at the three labels in order: the class is the capsule, the private instance variable is the data hidden inside it, and the public method is how other classes get at that data. Every later slide is one of those three ideas in code. -->

<!-- _class: lead -->
<!-- _paginate: false -->

<span class="kicker">// encapsulation · object-oriented computing</span>

# Encapsulation

<div class="hero">
<div class="h-top"><b>class BankAccount</b>the class is the capsule: one unit that holds the data and the method together</div>
<span class="h-arrow">↓</span>
<div class="h-pill"><div class="h-var">private double balance;</div><div class="h-meth">public double getBalance()</div></div>
<div class="h-notes">
<div><span class="h-arrow">↑</span><b>private instance variable</b>the data, hidden inside the class</div>
<div><span class="h-arrow">↑</span><b>public method</b>other classes call it to get the balance</div>
</div>
</div>

Encapsulation: keep the data and the methods that use it together in one class, and hide the data.

---

<!-- Speaker notes: ~0:01. Problem-first hook. Before revealing the last two bullets, ask the room what should stop the -500 line; the answer the lecture builds is "the class itself". The lab's first section opens with this same BankAccount, and DIY 1 repeats the experiment on a Student class. -->

## Problem: a public variable takes any value

- In this class, the instance variable `balance` is `public`:

```java
public class BankAccount {
    public double balance;
}
```

- So code in any other class can set it to any value, even one that makes no sense:

<!-- no-compile -->
```java
BankAccount account = new BankAccount();
account.balance = -500;                 // compiles and runs: nothing checks the value
System.out.println(account.balance);    // prints -500.0
```

* Our bank never allows a negative balance, but `BankAccount` has no way to stop that line.
* **Encapsulation** fixes this: hide the variable, and let other classes change it only through methods that check the value.

---

<!-- Speaker notes: ~0:04. The whole lecture on one slide: private data, public methods, and the compiler enforcing the line between them. Read the three rows top to bottom. Leave the other access modifiers for later; private and public are all this slide needs. -->

## The fix: private data, public methods

- Make `balance` **private** and give the class **public methods**. Other classes can then use the balance only by calling those methods:

<div class="scene">
<div class="sc-h">code in another class</div>
<div class="sc-h k">class BankAccount</div>
<div class="wall"></div>
<div class="call r2">account.deposit(100);<small>✓ compiles: deposit() is public</small></div>
<div class="arr r2">⟶</div>
<div class="meth r2">deposit(double)</div>
<div class="call r3">account.getBalance();<small>✓ compiles: getBalance() is public</small></div>
<div class="arr r3">⟶</div>
<div class="meth r3">getBalance()</div>
<div class="call no r4">account.balance = -500;<small>✗ compile error: balance is private</small></div>
<div class="arr no r4">⟶</div>
<div class="stop r4">✗ cannot reach balance</div>
<div class="data"><small>private instance variable</small>double balance</div>
</div>

<p class="legend">orange = public methods: any class can call them · blue = a private instance variable: only code inside BankAccount can use it</p>

* `deposit()` can check the amount before it changes `balance`, so a negative deposit is simply ignored.

---

## Agenda

- The four pillars of OOP
- What encapsulation means
- Access modifiers: `private`, default, `protected`, `public`
- How to encapsulate a class: private instance variables, public getters and setters
- Three reasons to use getters and setters
- Coding example: `BankAccount`
- Getters that return an array: defensive copies
- Benefits of encapsulation

---

<!-- Speaker notes: ~0:07. The canonical four-pillars overview: spend a full minute here. Name inheritance, polymorphism and abstraction once each and move on; each is a topic of its own. -->

## The four pillars of OOP

- Object-oriented programming (OOP) is built on **four main ideas**, called its four pillars:

<div class="pillars">
<div class="pillar now"><span class="p-chip">this lecture</span><span class="p-name">Encapsulation</span><span class="p-line">bundle the data and the methods that use it in one class, and hide the data</span><span class="p-wk">pillar 1</span></div>
<div class="pillar"><span class="p-name">Inheritance</span><span class="p-line">build a new class from an existing class</span><span class="p-wk">pillar 2</span></div>
<div class="pillar"><span class="p-name">Polymorphism</span><span class="p-line">one method call can behave differently for different objects</span><span class="p-wk">pillar 3</span></div>
<div class="pillar"><span class="p-name">Abstraction</span><span class="p-line">show what an object does, hide how it does it</span><span class="p-wk">pillar 4</span></div>
</div>

- Encapsulation comes **first** because the other three pillars build on classes that protect their own data.

---

## What encapsulation means

<!-- _class: code-sm -->

- In English, to **encapsulate** something is to enclose it, as if in a capsule. In Java, encapsulation means two things:

* **Bundle:** put the data (the instance variables, also called fields) and the methods that use that data together in one unit, the class.
* **Hide:** make the instance variables `private`, so other classes can use them only through the class's public methods.

```java
public class BankAccount {
    private double balance;           // the data: a private instance variable

    public double getBalance() {      // a public method that uses the data
        return balance;
    }
}
```

* Hiding the instance variables is called **data hiding**. It is the key step of encapsulation, so the two terms are often used to mean the same thing.

---

<!-- Speaker notes: ~0:12. Reference slide students will photograph: walk it row by row, from the strictest (private) to the loosest (public). The point to land is 3 keywords but 4 levels, because default has no keyword. Packages and subclasses need only the one-line explanation in the legend. -->

## Access modifiers

- An **access modifier** is a keyword written before an instance variable or a method. It decides which code may use that member directly.
- Java has **3 access modifier keywords** but **4 levels of access**: writing no keyword gives the fourth level, called **default**.

<table class="vmatrix">
<thead>
<tr><th>modifier</th><th>same class</th><th>same package</th><th>subclass in<br>another package</th><th>everywhere</th></tr>
</thead>
<tbody>
<tr><td class="kw">private<span class="mchip">use for instance variables</span></td><td class="y">✓</td><td class="n">✗</td><td class="n">✗</td><td class="n">✗</td></tr>
<tr><td class="kw">default (no keyword)</td><td class="y">✓</td><td class="y">✓</td><td class="n">✗</td><td class="n">✗</td></tr>
<tr><td class="kw">protected<span class="mchip">used with inheritance</span></td><td class="y">✓</td><td class="y">✓</td><td class="y">✓</td><td class="n">✗</td></tr>
<tr><td class="kw">public</td><td class="y">✓</td><td class="y">✓</td><td class="y">✓</td><td class="y">✓</td></tr>
</tbody>
</table>

<p class="legend">✓ = code there can use it directly · ✗ = compile error · package = a folder of classes · subclass = a class that inherits from this one</p>

---

## Which access modifier should I use?

- **Instance variables: always `private`.** This is the "hide" part of encapsulation.
- **Methods that other classes need to call: `public`.**
- **A helper method that only its own class uses: `private`.**
- **`protected`** lets subclasses use a member. It is only needed with inheritance.
- **Default (no keyword)** opens a member to every class in the same package. It usually happens because someone forgot to write a keyword, so always write one.

<div class="callout"><strong>Rule of thumb:</strong> make every instance variable <code>private</code>, and make a method <code>public</code> only if other classes need to call it.</div>

---

<!-- Speaker notes: ~0:17. Predict beat. Two wrong answers come up. Some say it compiles because 50.0 is a sensible balance: they think private only blocks bad values, when it blocks every direct access whatever the value. Others say it compiles because both classes are in one file: they think private means private to the file, when it means private to the class. Lab DIY 1 produces the same compile error on a Student's fields, and where a private member is visible is MCQ material. -->

## Predict: does this compile?

<!-- no-compile -->
```java
class BankAccount {
    private double balance;
}

class Main {
    public static void main(String[] args) {
        BankAccount account = new BankAccount();
        account.balance = 50.0;          // 50.0 is a sensible balance
    }
}
```

* **No.** The compiler stops with `error: balance has private access in BankAccount`.
* `private` blocks every direct use from another class, whatever the value, even when both classes are in one file.
* So the compiler now catches a wrong value before the program ever runs.

---

<!-- Speaker notes: ~0:20. The recipe is mechanical, so take it at pace: it is muscle memory, and lab DIY 3 (Temperature) drills exactly this shape. Spend the time on this.email = email: leaving out "this." is the classic bug, because the parameter is assigned to itself and the instance variable stays null. -->

## How to encapsulate a class

- Two steps, the same for every class:

```java
public class Student {
    private String email;                  // step 1: make the instance variable private

    public String getEmail() {             // step 2: a public getter, to read it
        return email;
    }

    public void setEmail(String email) {   // step 2: a public setter, to change it
        this.email = email;
    }
}
```

- In the setter, `this.email` is the instance variable and `email` on its own is the parameter. `this.` tells them apart because they have the same name.

---

<!-- Speaker notes: ~0:22. Accessor and mutator are the formal names used in documentation and in MCQs. Demo the VS Code generator if time allows: it writes exactly the methods on the previous slide. -->

## Getter and setter methods

- A **getter** returns the current value of a private instance variable. Its other name is an **accessor** method.
- A **setter** changes the value of a private instance variable. Its other name is a **mutator** method.
- Their names are `get` or `set` + the variable's name with a capital first letter: `getEmail()`, `setEmail(...)`.
- Code in another class uses them like this:

<!-- no-compile -->
```java
Student s = new Student();
s.setEmail("ada@example.com");      // the setter stores the email
System.out.println(s.getEmail());   // the getter returns it: prints ada@example.com
```

- VS Code can write them for you: right-click inside the class → *Source Action...* → *Generate Getters and Setters*.

---

<!-- Speaker notes: ~0:25. Voice the objection sincerely: half the room is already thinking it. The next five slides answer it, one small class per reason. -->

## Why not just make the variable public?

- A setter such as `setEmail` only stores the value it is given, so it can look no better than a public variable.

* The difference: every change now goes through **one method**. You can add rules to that method later, and the code that calls it does not change.
* Getters and setters give you three things a public variable cannot:
* **1. Validation**: a setter can check a value before it stores it.
* **2. Read-only values**: give a variable a getter but no setter.
* **3. Freedom to change the inside**: change how a class stores its data without changing the code that uses the class.

---

<!-- Speaker notes: ~0:27. The rule lives inside the class, next to the data it protects, so it is written once. Lab section 4 does the same with a validateAge helper, and lab DIY 4 has students write a validateGrade check of their own. -->

## Reason 1: a setter can check the value

<!-- _class: code-sm -->

- Rule: a username can have at most **10 characters**. The setter makes sure of it:

```java
public class Person {
    private String username;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        if (username.length() > 10) {
            this.username = username.substring(0, 10);   // too long: keep only the first 10 characters
        } else {
            this.username = username;
        }
    }
}
```

- The only way to set `username` is through this setter, so no `Person` can ever hold a username longer than 10 characters.

---

<!-- Speaker notes: ~0:29. Predict beat. The common wrong answer is theRedRhino, unchanged: students read setUsername as a plain assignment and never run the if inside it. A few predict an exception, thinking substring fails on a long String. Count the 11 characters aloud, then trace the if. Validation inside setters is MCQ material. -->

## Predict: what prints?

- In `Person`, `setUsername()` keeps only the first 10 characters of a longer username:

<!-- no-compile -->
```java
Person p = new Person();
p.setUsername("theRedRhino");           // 11 characters
System.out.println(p.getUsername());
```

* `theRedRhin`: `"theRedRhino"` has 11 characters, so the setter stored only the first 10.
* The check is written **once**, inside the setter. The code that calls `setUsername()` needs no `if` of its own.

---

<!-- Speaker notes: ~0:31. Read-only is the simplest of the three reasons: leave the setter out. The compiler's message for the last line is "cannot find symbol", naming setStudentId; show it if you run this live. -->

## Reason 2: no setter means read-only

<!-- _class: code-sm -->

- A student's ID number should never change after the student is created, so `Student` gets a getter for it but **no setter**:

```java
public class Student {
    private int studentId;

    public Student(int studentId) {
        this.studentId = studentId;        // the ID is set once, when the object is created
    }

    public int getStudentId() {
        return studentId;
    }
}
```

<!-- no-compile -->
```java
Student s = new Student(1234);
System.out.println(s.getStudentId());     // other classes can read the ID: prints 1234
s.setStudentId(99);                       // compile error: there is no setStudentId method
```

- A getter with no setter makes a value **read-only** for every other class.

---

<!-- Speaker notes: ~0:33. Version 1 is the plain recipe. Ask the room to remember the three lines that use Person: they come back, unchanged, on the next slide. -->

## Reason 3: change how data is stored

<!-- _class: code-sm -->

- Version 1 of `Person` stores all of a person's middle names in one `String`:

```java
public class Person {
    private String middleNames;                    // "Mary Alice"

    public String getMiddleNames() {
        return middleNames;
    }

    public void setMiddleNames(String middleNames) {
        this.middleNames = middleNames;
    }
}
```

- Code in another class uses it like this:

<!-- no-compile -->
```java
Person p = new Person();
p.setMiddleNames("Mary Alice");
System.out.println(p.getMiddleNames());           // prints Mary Alice
```

---

<!-- Speaker notes: ~0:35. The misconception: students expect every caller to change when a private variable's type changes. Callers only ever see the method signatures, so nothing outside the class notices. split(" ") and String.join(" ", ...) do the conversion; keep the focus on the unchanged calls, not on those two methods. Changing the inside without breaking other code is the flexibility benefit, and MCQ material. -->

## Reason 3: version 2 stores an array

<!-- _class: code-sm -->

- Version 2 stores the middle names in an array. Only the inside of `Person` changes:

```java
public class Person {
    private String[] middleNames;                      // {"Mary", "Alice"}

    public String getMiddleNames() {
        return String.join(" ", middleNames);          // array to one String: "Mary Alice"
    }

    public void setMiddleNames(String middleNames) {
        this.middleNames = middleNames.split(" ");     // one String to an array
    }
}
```

* The getter and setter are called exactly as before, so the code that used version 1 still compiles and still prints `Mary Alice`.
* Other classes depend only on the public methods. With a public `middleNames` variable, every class that used it would break when its type changed.

---

<!-- Speaker notes: ~0:38. The worked example for the hour: every idea so far in one class. Read it top to bottom: private data, the constructor, the getter, then the two methods that check before they change anything. -->

## Coding example: BankAccount

<!-- _class: code-sm -->

- A complete encapsulated class: a private instance variable, a constructor, a getter, and two methods that check every change:

```java
public class BankAccount {
    private double balance;

    public BankAccount(double openingBalance) {
        this.balance = openingBalance;
    }

    public double getBalance() {
        return balance;
    }

    public void deposit(double amount) {
        if (amount > 0) { balance += amount; }                      // only a positive amount
    }

    public void withdraw(double amount) {
        if (amount > 0 && amount <= balance) { balance -= amount; } // never more than the balance
    }
}
```

---

<!-- Speaker notes: ~0:40. The most important method in BankAccount is the one that is not written. Students who have just learned "a getter and a setter for every variable" over-apply it; this slide corrects that before the lab. -->

## BankAccount has no setBalance()

<div class="capsule">
<span class="k">class BankAccount</span>
<div class="ms">
<div class="meth">deposit(double)</div>
<div class="meth">withdraw(double)</div>
<div class="meth">getBalance()</div>
<div class="meth missing">setBalance(double): not written</div>
</div>
<div class="data"><small>private instance variable</small>double balance</div>
</div>

- The balance can only change through `deposit()` and `withdraw()`, and both check the amount first.
- You do not have to write a getter and a setter for every variable. Write only the public methods the class should offer: a `setBalance()` would let any class set any balance again.

---

<!-- Speaker notes: ~0:42. Predict beat that runs both checks. Expect 75.0 from students who treat deposit(-50) as taking 50 out, and -425.0 from students who assume withdraw always runs. Walk each line against the check in its method; the object stays valid without the caller doing anything. -->

## Predict: what prints?

- In `BankAccount`, `deposit()` adds only a positive amount, and `withdraw()` takes money out only if the amount is positive and no more than the balance:

<!-- no-compile -->
```java
BankAccount account = new BankAccount(100.0);
account.deposit(-50);
account.withdraw(500);
account.deposit(25);
System.out.println(account.getBalance());
```

* `125.0`.
* `deposit(-50)` is ignored (not positive) and `withdraw(500)` is ignored (more than the balance), so the balance stays `100.0`.
* `deposit(25)` is added: `100.0 + 25 = 125.0`.

---

<!-- Speaker notes: ~0:45. Give the room time to commit to 70: the wrong answer is the lesson. The faulty model is that private protects everything the variable leads to. It protects only the variable itself; the array it refers to can be changed by any code holding a reference to that array. -->

## Predict: a getter that returns an array

<!-- _class: code-sm -->

```java
class Gradebook {
    private int[] scores = {70, 80, 90};

    public int[] getScores() {
        return scores;
    }
}

class Main {
    public static void main(String[] args) {
        Gradebook g = new Gradebook();
        int[] view = g.getScores();
        view[0] = 0;                              // change the array the getter returned
        System.out.println(g.getScores()[0]);     // what prints?
    }
}
```

* `0`. The private array changed, even though `scores` is `private`.

---

<!-- Speaker notes: ~0:46. Recall from arrays that an array variable stores a reference, not the values. Point at both arrows reaching the same three boxes; that shared array is the whole bug. -->

## Why it printed 0: one array, two variables

- An array variable does not hold the values. It holds a **reference**: an arrow to where the array is in memory.
- `return scores;` hands out a copy of that arrow, not a copy of the array. So `view` and `scores` point at the **same** array:

<div class="refs">
<div class="vars">
<div class="var">scores <small>(private, in Gradebook)</small></div>
<div class="var">view <small>(in main)</small></div>
</div>
<div class="mem">
<div class="cell hot"><span class="idx">0</span>0</div>
<div class="cell"><span class="idx">1</span>80</div>
<div class="cell"><span class="idx">2</span>90</div>
</div>
</div>

<p class="legend">two variables, ONE array: view[0] = 0 changed the array that the private variable scores points at</p>

* `private` stops other classes from using the variable `scores`. It does not stop them changing the array, once a getter has handed them an arrow to it.

---

<!-- Speaker notes: ~0:48. Lab DIY 4 has students see this leak (its test prints 0) and then fix it with Arrays.copyOf (it prints 88). Arrays.copyOf was met with arrays; here it gets its encapsulation job. -->

## Fix: return a copy of the array

<!-- _class: code-sm -->

```java
import java.util.Arrays;

public class Gradebook {
    private int[] scores = {70, 80, 90};

    public int[] getScores() {
        return Arrays.copyOf(scores, scores.length);   // a new array with the same values
    }
}
```

<div class="rows">
<div class="row"><div class="var">scores</div><div class="mem"><div class="cell">70</div><div class="cell">80</div><div class="cell">90</div></div></div>
<div class="row"><div class="var">view</div><div class="mem"><div class="cell hot">0</div><div class="cell">80</div><div class="cell">90</div></div></div>
</div>

<p class="legend">two variables, two arrays: view[0] = 0 changes only the copy, and the private array stays {70, 80, 90}</p>

- A copy returned like this is called a **defensive copy**. Return one whenever a getter would otherwise hand out a private array.

---

<!-- Speaker notes: ~0:50. A class the students already use turns out to be encapsulated: private data and no methods that change it, so a String can never change. -->

## String: an encapsulated class

- `String` keeps its characters in a **private** array, and it has **no method that changes them**:

```java
String name = "ada";
String loud = name.toUpperCase();

System.out.println(name);   // ada - the original String has not changed
System.out.println(loud);   // ADA - toUpperCase() returned a new String
```

- An object that can never change after it is created is called **immutable**. `String` is immutable because of encapsulation: private data, and no setters.

---

<!-- Speaker notes: ~0:52. These three benefits, by these names, are what MCQ questions on encapsulation's benefits ask about. Pair each benefit with its example from this lecture. -->

## Benefits of encapsulation

- **Data protection:** methods can check a value before storing it, so an object never holds invalid data.
  - *Example: the username in `Person` is never longer than 10 characters.*
- **Flexibility:** you can change how a class stores its data without breaking the code that uses the class, as long as its public methods stay the same.
  - *Example: `Person` moved its middle names from a `String` to an array.*
- **Maintainability:** each class looks after its own data, so the code is organised and easier to understand, and a change to a class stays inside that class.

---

## Summary

- **Encapsulation** bundles the instance variables and the methods that use them into one class, and hides the instance variables. Hiding them is called **data hiding**.
- Java has 3 access modifier keywords and 4 levels of access: `private` (same class only), default (no keyword: same package), `protected` (same package and subclasses) and `public` (everywhere).
- To encapsulate a class, make its instance variables `private` and add public **getters** (accessors) and **setters** (mutators).
- Getters and setters let a class **validate** values, make a value **read-only** (a getter but no setter), and **change how it stores its data** without breaking other code.
- Write only the methods a class needs: `BankAccount` has no `setBalance()`.
- A getter should never return a private array itself: return a **defensive copy** made with `Arrays.copyOf`.
