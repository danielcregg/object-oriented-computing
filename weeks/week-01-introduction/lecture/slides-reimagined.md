---
marp: true
theme: ooc
paginate: true
transition: fade
title: "Module Introduction (reimagined)"
week: 1
topic: introduction
type: lecture
source: authored
---

<style>
/* Deck-local visual system: semester strip, assessment cards, build
   pipeline, IDE window — all drawn in CSS, no image files. */
section .kicker {
  font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 17px; color: #E76F00; letter-spacing: 0.05em;
}
section .callout {
  border-left: 4px solid #E76F00; background: #F4F0E6;
  padding: 12px 20px; margin: 16px 0; color: #46536B; font-size: 0.92em;
}
section .callout strong { color: #B94E00; }
section .legend { font-size: 17px; color: #8B8471; margin-top: 4px; }

/* semester strip — 13 calendar weeks in one row */
section .tl {
  display: flex; margin: 46px 0 12px 0;
  font-family: 'Cascadia Code', Consolas, monospace;
}
section .tl .twk {
  flex: 1; min-width: 0; padding: 15px 0 12px; text-align: center;
  background: #FFFFFF; border: 2px solid #33698C;
  border-left-width: 1px; border-right-width: 1px;
  font-size: 21px; color: #1E2833; position: relative;
}
section .tl .twk:first-child { border-left-width: 2px; border-radius: 9px 0 0 9px; }
section .tl .twk:last-child { border-right-width: 2px; border-radius: 0 9px 9px 0; }
section .tl .twk .ttag {
  position: absolute; top: -30px; left: -30px; right: -30px;
  font-size: 15px; color: #33698C; white-space: nowrap;
}
section .tl .twk.mcq { background: #FDEFD9; border-color: #E76F00; color: #B94E00; font-weight: 600; }
section .tl .twk.mcq .ttag { color: #E76F00; font-weight: 600; }
section .tl .twk.rest { background: #F4F0E6; border-style: dashed; color: #8B8471; }
section .tl .twk.rest .ttag { color: #8B8471; }

/* assessment cards */
section .cards { display: flex; gap: 30px; margin: 30px 0 16px 0; }
section .cards .card {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
  border: 2px solid #33698C; border-radius: 12px; background: #FFFFFF;
  padding: 18px 12px 14px;
}
section .cards .card .cwk {
  font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 17px; color: #8B8471; letter-spacing: 0.05em;
}
section .cards .card .cname { font-size: 27px; font-weight: 600; color: #1E2833; }
section .cards .card .cpct {
  font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 46px; font-weight: 600; color: #E76F00; line-height: 1.15;
}
section .cards .card .csub { font-size: 16px; color: #8B8471; }

/* build pipeline — source to running program */
section .pipe { display: flex; align-items: center; margin: 24px 0; }
section .pipe .plane {
  width: 108px; flex: none;
  font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 18px; color: #33698C; font-weight: 600;
}
section .pipe .pnode {
  flex: 1; min-width: 0; text-align: center; background: #FFFFFF;
  border: 2px solid #33698C; border-radius: 10px; padding: 11px 6px 9px;
}
section .pipe .pnode .pfile {
  display: block; font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 20px; color: #1E2833;
}
section .pipe .pnode .psub { display: block; font-size: 15px; color: #8B8471; margin-top: 1px; }
section .pipe .pnode.phot { background: #FDEFD9; border-color: #E76F00; }
section .pipe .pnode.phot .pfile { color: #B94E00; font-weight: 600; }
section .pipe .pnode.pbad { border: 2px dashed #C0392B; background: #F9E3E3; }
section .pipe .pnode.pbad .pfile { color: #C0392B; }
section .pipe .parrow {
  flex: none; width: 96px; text-align: center; padding: 0 4px;
  font-family: 'Cascadia Code', Consolas, monospace;
  display: flex; flex-direction: column; line-height: 1.15;
}
section .pipe .parrow .plab { font-size: 15px; color: #B94E00; }
section .pipe .parrow .aline { font-size: 26px; color: #E76F00; }

/* IDE window mock */
section .ide {
  border: 2px solid #33698C; border-radius: 12px; overflow: hidden;
  margin: 18px 0 6px 0; font-family: 'Cascadia Code', Consolas, monospace;
}
section .ide .ibar {
  display: flex; align-items: center; gap: 8px;
  background: #E9E4D8; padding: 8px 14px; font-size: 15px; color: #46536B;
}
section .ide .ibar .dot { width: 12px; height: 12px; border-radius: 50%; background: #C9C2B2; }
section .ide .ied { background: #16222E; padding: 12px 0 10px; position: relative; }
section .ide .irow { display: flex; font-size: 17px; line-height: 1.6; }
section .ide .iln { width: 46px; flex: none; text-align: right; padding-right: 16px; color: #55677A; }
section .ide .icode { color: #E8ECF1; white-space: pre; }
section .ide .icode .istr { color: #F0B26B; }
section .ide .iout {
  background: #0E1720; border-top: 1px solid #33465A; color: #A8D3EE;
  padding: 10px 18px 10px 46px; font-size: 17px; position: relative;
}
section .ide .itag {
  position: absolute; top: 8px; right: 12px; font-size: 13px; color: #E76F00;
  letter-spacing: 0.06em; border: 1px solid #E76F00; border-radius: 20px;
  padding: 1px 10px; background: rgba(231, 111, 0, 0.08);
}

/* lead-slide variants for the dark background */
section.lead .pipe .pnode { background: rgba(255,255,255,0.07); border-color: #7FB4D8; }
section.lead .pipe .pnode .pfile { color: #F4F1E8; }
section.lead .pipe .pnode .psub { color: #6E8497; }
section.lead .pipe .pnode.phot { background: rgba(231,111,0,0.16); border-color: #E76F00; }
section.lead .pipe .pnode.phot .pfile { color: #F0B26B; }
section.lead .pipe .parrow .plab { color: #F0B26B; }
</style>

<!-- _class: lead -->
<!-- _paginate: false -->

<span class="kicker">// week 01 · introduction · object-oriented computing</span>

# Object-Oriented Computing

<div class="pipe">
<div class="pnode"><span class="pfile">Hello.java</span><span class="psub">you write this</span></div>
<div class="parrow"><span class="plab">javac</span><span class="aline">→</span></div>
<div class="pnode phot"><span class="pfile">Hello.class</span><span class="psub">bytecode</span></div>
<div class="parrow"><span class="plab">JVM</span><span class="aline">→</span></div>
<div class="pnode"><span class="pfile">anywhere</span><span class="psub">it runs</span></div>
</div>

Week 1 · Module Introduction — one semester, one language, and by December you'll think in objects.

---

<!-- Speaker notes: ~0:00. Cold open — don't introduce yourself yet. Put the code up, let it look alien, then land the fragment. The point is distance travelled, not the code itself. -->

## Fast-forward to December

```java
class Playlist {
    private int tracks;
    void add(String song) { tracks++; }
    int size() { return tracks; }
}

public class December {
    public static void main(String[] args) {
        Playlist mix = new Playlist();
        mix.add("Golden Brown");
        System.out.println("Queued: " + mix.size());
    }
}
```

* A type **you designed**, objects built from it, methods doing your bidding. Today it may read as noise — by week 12 you'll write it without notes.

---

## The catch — and the plan

- You can't cram this subject, and you can't absorb it by watching me. Programming is best learned through **constant practice over an extended period of time**.
- **Practice makes perfect** — and practice means *breaking things*: expect **constructive failure**. Broken code isn't the opposite of progress; it's how progress feels from the inside.
- So the module is built for reps: delivered in an **incremental and iterative** fashion — ideas and concepts expanded and expounded week by week.
- The traits of a good programmer: **patience · consistency · diligence · dedication**.

* Talent is optional. Reps are not.

---

<!-- Speaker notes: ~0:05. Frame the hour as two acts, then move — the agenda earns nothing by being lingered on. -->

## Agenda — one hour, two acts

- **Act 1 — your module**
  - learning outcomes, and how the module is delivered
  - the 13-week map · assessment: three MCQs (weeks 5, 9, 12)
  - your coding environment · Moodle enrolment · this week's tasks
- **Act 2 — Java fast-start**
  - why Java, and where it came from
  - compiler vs interpreter · bytecode · the JVM · the JDK
  - your first program — and the errors everyone makes

---

## About Me

![Lecturer contact banner](img/slide03-1.png)

---

<!-- Speaker notes: ~0:08. One assumption in, four abilities out. Keep the official wording visible; students will meet it again on Moodle. -->

## Learning outcomes

- One assumption coming in: you have **some prior fundamental programming experience**.
- One shift going out: this module is about the **object-oriented paradigm** of programming.
- Officially — on completion you will be able to:
  - **Explain** the fundamentals of programming — variables, operators, conditional and iterative statements
  - **Understand** the fundamentals of OOP — defining classes, instantiating objects, invoking methods
  - **Set up** and configure a software development environment
  - **Develop** basic object-oriented applications

---

<!-- Speaker notes: ~0:11. Walk the strip left to right. Point at the dashed cell: reading week is the October bank-holiday week — say it twice, someone will still turn up. -->

## The shape of the semester

<div class="tl">
<div class="twk">1</div>
<div class="twk"><span class="ttag">labs begin</span>2</div>
<div class="twk">3</div>
<div class="twk">4</div>
<div class="twk mcq"><span class="ttag">MCQ 1</span>5</div>
<div class="twk">6</div>
<div class="twk rest"><span class="ttag">break</span>RW</div>
<div class="twk">7</div>
<div class="twk">8</div>
<div class="twk mcq"><span class="ttag">MCQ 2</span>9</div>
<div class="twk">10</div>
<div class="twk">11</div>
<div class="twk mcq"><span class="ttag">MCQ 3</span>12</div>
</div>

<p class="legend">numbers = teaching weeks · RW = reading week — the Irish October bank-holiday week</p>

- **12 teaching weeks over 13 calendar weeks** — the gap is a 1-week break for reading week.
- **Labs start week 2.** This week: lecture only, plus your setup tasks.
- The full timetable sits at the **top of the Moodle page**.

---

<!-- Speaker notes: ~0:14. Let the three cards breathe before the fragment. The message is steady pressure, not one terrifying day. -->

## Assessment — three checkpoints

<div class="cards">
<div class="card"><span class="cwk">week 5</span><span class="cname">MCQ 1</span><span class="cpct">33%</span><span class="csub">in person · in a lab</span></div>
<div class="card"><span class="cwk">week 9</span><span class="cname">MCQ 2</span><span class="cpct">33%</span><span class="csub">in person · in a lab</span></div>
<div class="card"><span class="cwk">week 12</span><span class="cname">MCQ 3</span><span class="cpct">33%</span><span class="csub">in person · in a lab</span></div>
</div>

- Three MCQs, worth **33% each** — all completed **in person, in a lab**.

* Your grade is spread across the semester: three chances, no single make-or-break day.
* First checkpoint is week 5 — **four teaching weeks from today**. The reps start now.

---

## What's on the MCQs — and how to prepare

- Questions can be sourced from **lecture AND lab materials** — the labs are examinable, not optional extras.
- Format: **standard MCQ questions plus some Coderunner coding questions** — so you'll be *writing* code under assessment, not just recognising definitions.
- Preparation that actually works: **use AI to generate sample MCQ questions** from the materials — Google's **NotebookLM** is a great tool for this.

<div class="callout"><strong>Feed it, then fight it.</strong> Give NotebookLM the week's lecture and lab material, ask for a practice quiz, and take it cold. Wrong answers tell you exactly what to revise.</div>

---

<!-- Speaker notes: ~0:18. First predict beat. Make them commit out loud before revealing — all three are false, which is the joke and the lesson. -->

## Predict: true or false?

- **1.** Labs start this week.
- **2.** You can sit the MCQs from home.
- **3.** If it wasn't in a lecture, it can't be on an MCQ.

* **1 — false.** Labs start **week 2**. This week you set up; next week you build.
* **2 — false.** All three MCQs are completed **in person, in a lab**.
* **3 — false.** Questions draw on **lecture and lab** materials alike.
* A clean sweep of falses — worth catching now. This slide pays 33%, three times.

---

<!-- Speaker notes: ~0:21. Tools movement. Sell the "no installs" point hard — it removes the classic week-1 failure mode of broken local setups. -->

## Your coding environment: GitHub Codespaces

- Labs run in **GitHub Codespaces** — **VS Code running on a virtual machine**, which you connect to **through your browser**.
- It's a **cloud-based IDE**: nothing to install, and your laptop's spec doesn't matter — the VM does the heavy lifting.
- Already familiar with VS Code? Then you will notice **no difference**.
- We'll also be using **AI to assist in answering questions** — more on that in the labs.

---

## Enrol on Moodle — today

- Go to <https://vlegalwaymayo.atu.ie/>
- Search for course: **8963**
- Enrolment key: `object`

* **Careful:** I teach **two** Object Oriented Computing modules — make sure you select the correct one.

---

<!-- Speaker notes: ~0:24. Two tasks plus the enrolment you just showed. Point out that week 2 assumes all three are done. -->

## Your tasks — before the week-2 lab

- **Enrol on Moodle** — course **8963**, key `object` — you've just seen how.
- **Sign up for the [GitHub Student Developer Pack](https://education.github.com/pack)** — free developer tools for as long as you're a student.
- **Research GitHub Codespaces** — arrive at the first lab already knowing roughly what it is. You'll be coding inside one within minutes.

<div class="callout"><strong>Week 2 assumes all three are done.</strong> Ten quiet minutes this week buys you a running start next week.</div>

---

<!-- Speaker notes: ~0:26. Bridge. Get actual hands up for the first two questions — it calibrates the room for you. Then promise the second list and deliver it. -->

## Six questions before the deep end

- **You tell me** — show of hands:
  - What programming experience do you have? What languages have you used?
  - Have you used an **object-oriented** language before?
- **I'll answer** — in the next thirty minutes:
  - What do we need to **run** a Java program?
  - When do we need to **compile** a Java program?
  - What is an **IDE**?

* By the top of the hour, the second list belongs to you too.

---

<!-- _class: lead -->

<span class="kicker">// act 2 · java fast-start</span>

# Java Fast-Start

From a text file to a running program — background · bytecode · the JVM · your first errors

---

<!-- Speaker notes: ~0:28. Second predict beat. Let them guess wildly — image? virus? Then reveal, and point at CA FE BA BE for the coffee joke. -->

## Predict: what is this file?

```text
CA FE BA BE 00 00 00 41 00 1D 0A 00 02 00 03 07
00 04 0C 00 05 00 06 01 00 10 6A 61 76 61 2F 6C
61 6E 67 2F 4F 62 6A 65 63 74 01 00 06 3C 69 6E
69 74 3E 01 00 03 28 29 56 08 00 12 01 00 0D 48
```

* It's **Hello World** — `HelloPrinter.class`, the version of the program your machine actually meets.
* Everything you write this semester becomes this: **bytecode**.
* The first four bytes of every Java class file ever compiled: `CA FE BA BE`. The compiler's little coffee joke.
* Act 2 is the story of that transformation — and why it conquered the world.

---

<!-- Speaker notes: ~0:31. Background movement — brisk. These two slides are context, not content to memorise (except for the names and numbers, which are MCQ-friendly). -->

<!-- _class: cols -->

## Why Java

- **Object-oriented to its core** — real-world concepts are modelled using classes and objects.
- **Strong static typing** — whole categories of error get caught early, and it promotes disciplined coding habits.
- **Clear, readable syntax** — encapsulation, inheritance and polymorphism are easy to see on the page.
- **Everywhere in industry** — the skills you build are directly applicable to real-world development.
- **A rich standard library** — especially for data structures and algorithms, so meaningful examples come easy.
- **Excellent IDEs and tools** — IntelliJ, VS Code: debugging and code completion that help you learn.
- **The ideas travel** — OO principles learned in Java translate easily to Python, C# and Kotlin.

---

<!-- _class: cols -->

## From Oak to 45 billion machines

- **1991** — **James Gosling** designs a new language at **Sun Microsystems**.
- He names it **Oak** — after the oak tree outside his office window.
- The name doesn't stick. It becomes **Java**, after Java coffee.
- **2010** — **Oracle Corporation** completes its acquisition of Sun and becomes the steward of Java.
- Today, over **45 billion** active Java Virtual Machines are deployed across devices and servers.
- Over **10 million developers** worldwide — and growing.
- It powers Android apps, enterprise systems, cloud platforms and IoT devices.

---

<!-- _class: dense -->

## The whole language fits on one slide

- Java reserves just **50 keywords** — here they all are:

| Range | Keywords |
|---|---|
| A–C | abstract, assert, boolean, break, byte, case, catch, char, class, *const* |
| C–F | continue, default, do, double, else, enum, extends, final, finally, float |
| F–N | for, *goto*, if, implements, import, instanceof, int, interface, long, native |
| N–S | new, package, private, protected, public, return, short, static, strictfp, super |
| S–W | switch, synchronized, this, throw, throws, transient, try, void, volatile, while |

- *`const` and `goto` are reserved but not currently used in Java.*
- Today's deck alone uses seven of them: `class`, `public`, `private`, `static`, `void`, `int`, `new`.

---

<!-- Speaker notes: ~0:38. The conceptual heart of the hour. Definitions first, then the reveal that Java refuses to pick a side. -->

## Compiler vs interpreter

- A **computer program** is a sequence of human-readable instructions, converted by software into machine-executable instructions.
- A **compiler** converts instructions into machine code (or a lower-level form) **ahead of time**, so a computer can read and execute them.
- An **interpreter** **directly executes** instructions written in a programming or scripting language — no prior compilation into a machine-language program.

* So which is Java? **Both.**
* Source code is compiled into **bytecode** by the Java compiler — then the bytecode is executed by the **JVM**, which is a software-based interpreter.

---

## Two roads from source code

<div class="pipe">
<div class="plane">C / C++</div>
<div class="pnode"><span class="pfile">hello.c</span><span class="psub">source code</span></div>
<div class="parrow"><span class="plab">compiler</span><span class="aline">→</span></div>
<div class="pnode"><span class="pfile">hello.exe</span><span class="psub">machine code</span></div>
<div class="parrow"><span class="plab">runs on</span><span class="aline">→</span></div>
<div class="pnode pbad"><span class="pfile">ONE platform</span><span class="psub">recompile for every other</span></div>
</div>

<div class="pipe">
<div class="plane">Java</div>
<div class="pnode"><span class="pfile">Hello.java</span><span class="psub">source code</span></div>
<div class="parrow"><span class="plab">javac</span><span class="aline">→</span></div>
<div class="pnode phot"><span class="pfile">Hello.class</span><span class="psub">bytecode</span></div>
<div class="parrow"><span class="plab">any JVM</span><span class="aline">→</span></div>
<div class="pnode"><span class="pfile">every platform</span><span class="psub">Windows · macOS · Linux</span></div>
</div>

<div class="callout"><strong>A typical compiled language stops at machine code for one platform.</strong> Java stops halfway — at bytecode — and lets each platform's JVM carry it the rest of the way.</div>

---

## Write once, run anywhere

- A computer **platform** = a hardware device plus an operating system that programs run upon — e.g. *a PC with an Intel processor running Windows 10*.
- Machine code is married to its platform. **Bytecode is married to none.**
- You write `myprogram.java` **once**, and compile it to bytecode: `myprogram.class`.
- The **JVM** — which can be installed on any platform — then runs that same bytecode, unchanged.

* This is why Java is **platform independent**: **W**rite **O**nce, **R**un **A**nywhere — *WORA*.

---

<!-- Speaker notes: ~0:44. Third predict beat — WORA applied. The wrong instinct is "send the .java and recompile"; surface it, then correct it. -->

## Predict: the Mac problem

- You write and compile `HelloPrinter.java` on your Windows laptop.
- Your friend runs macOS — and wants to run your program.
- **What do you send them, and what do they need?**

* Send **`HelloPrinter.class`** — bytecode isn't Windows code; it belongs to no platform.
* They need a **JVM built for macOS** — the JVM is platform-specific *so your program doesn't have to be*.
* No recompiling, no edits: **write once, run anywhere** — working exactly as designed.

---

## The JDK — your toolkit

- To develop Java programs you install the **JDK** — the *Java Development Kit*.
- On Windows it lands in `C:\Program Files\Java\jdk1.8.x`.
- Inside are the programs this act has been talking about, including:
  - `javac.exe` — the **Java compiler**: your source in, bytecode out
  - `javadoc.exe` — the **Javadoc generator**: documentation straight from your code
- In our labs there's nothing to install — the Codespace arrives with the JDK ready. But now you know what's under the floorboards.

---

<!-- Speaker notes: ~0:47. First-program movement. Don't dissect every token — that's the lab's job. Sell the shape: same skeleton every time, your code goes in main. -->

## Your first program

```java
public class HelloPrinter
{
    public static void main(String[] args)
    {
        System.out.println("Hello, World!");
    }
}
```

- The traditional **'Hello World'** — and every Java application has this same basic layout.
- Your 'code' goes inside the **main method**; we'll examine the program line by line in the lab.
- Be careful of spelling — `JaVa iS CaSe SeNsItiVe` — and Java leans on special characters: `{ }` do real work.

---

## The hard way — a text editor and a console

- No IDE required: type the code into a simple text editor such as **Notepad** and save it as `HelloPrinter.java`.
- Then, in a console window — **compile**, then **run**:

```text
D:\temp\hello>javac HelloPrinter.java

D:\temp\hello>java HelloPrinter
Hello, World!
```

- `javac` turns your source into `HelloPrinter.class`; `java` starts a JVM and hands it the bytecode.

* Do this by hand once in your life. Every IDE you ever meet is automating exactly these steps — and now you've seen behind the scenes.

---

<!-- Speaker notes: ~0:51. The mock window is the payoff: name the two panes, because "where the program speaks back" is the thing beginners lose first. -->

## The IDE — a toolkit around your code

- An **Integrated Development Environment** is a complete toolkit for developing software — a suite of productivity tools in one place.
- Common Java IDEs: **Eclipse**, **NetBeans** and **IntelliJ** — our Codespaces run **VS Code**.

<div class="ide">
<div class="ibar"><span class="dot"></span><span class="dot"></span><span class="dot"></span>HelloPrinter.java — VS Code</div>
<div class="ied"><span class="itag">editor</span><div class="irow"><span class="iln">1</span><span class="icode">public class HelloPrinter {</span></div><div class="irow"><span class="iln">2</span><span class="icode">    public static void main(String[] args) {</span></div><div class="irow"><span class="iln">3</span><span class="icode">        System.out.println(<span class="istr">"Hello, World!"</span>);</span></div><div class="irow"><span class="iln">4</span><span class="icode">    }</span></div><div class="irow"><span class="iln">5</span><span class="icode">}</span></div></div>
<div class="iout"><span class="itag">output</span>Hello, World!</div>
</div>

<p class="legend">editor — where the code is written · output — where the program speaks back</p>

---

<!-- Speaker notes: ~0:53. Final predict beat. Three innocent-looking lines; none survive. Reveal one at a time and name each failure. -->

## Predict: which of these compile?

<!-- no-compile -->
```java
system.out.println("A");     // 1
System.ou.println("B");      // 2
System.out.println("C")      // 3
```

* **None of them.**
* **1** — `system` is not `System`. Capitalisation carries meaning — always.
* **2** — `ou` is not `out`. Misspell one word and the compiler stops understanding you.
* **3** — a missing semicolon. And that one deserves its own slide…

---

## The semicolon, from the compiler's chair

- In Java, **every statement must end in a semicolon** — the compiler uses `;` to find where one statement ends and the next starts.
- Forget one, and the compiler sees this code…

<!-- no-compile -->
```java
System.out.println("Hello")
System.out.println("World!");
```

- …as this:

<!-- no-compile -->
```java
System.out.println("Hello") System.out.println("World!");
```

- Same family of trouble: **leave out a word** (drop `void` from `main`), or **fail to match a curly brace** — the code stops meaning anything, and the error message often points somewhere strange.

---

<!-- Speaker notes: ~0:58. Close the loop: point back at the December slide, then leave the three tasks on screen as they pack up. -->

## Summary

- This module: **object-oriented programming in Java** — you arrive with programming basics, you leave designing classes and objects of your own.
- **12 teaching weeks over 13 calendar weeks** — reading week is the October bank-holiday week — and **labs start week 2**.
- Assessment: **three MCQs — weeks 5, 9 and 12, worth 33% each — in person, in a lab**, drawing on lecture *and* lab material, with standard questions **plus Coderunner coding questions**. Practise with AI-generated MCQs — **NotebookLM**.
- Java compiles source to **bytecode**; the **JVM** runs it on any platform — *write once, run anywhere*. The **JDK** (`javac`, `javadoc`, …) is your toolkit, and precision — case, semicolons, braces — is the price of entry.
- **This week:** enrol on Moodle — course **8963**, key `object`, pick the right module of the two; sign up for the **GitHub Student Developer Pack**; research **GitHub Codespaces**.
