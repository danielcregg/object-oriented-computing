# Java Methods Lab

## What you'll learn

* How to define methods and call them from `main`
* How parameters carry values into a method and return values carry results back out
* When to choose `void` and when to return a value
* How `public`, `private`, and `static` change who can call a method and how
* How Java tracks running methods on the call stack - including recursive calls

## Table of Contents

- [Introduction](#introduction)
- [1. Defining Simple Methods](#1-defining-simple-methods)
- [2. Methods with Parameters](#2-methods-with-parameters)
- [3. Methods with Return Values](#3-methods-with-return-values)
- [4. void vs Return Types](#4-void-vs-return-types)
- [5. Method Visibility: public and private](#5-method-visibility-public-and-private)
- [6. Static Methods](#6-static-methods)
- [7. Method Call Stack and Execution Flow](#7-method-call-stack-and-execution-flow)
- [8. Recursion](#8-recursion)
- [9. Common Mistakes and Debugging](#9-common-mistakes-and-debugging)

## Getting started

This lab lives in the package `week03.methods_lab` - this folder. A runnable `Main.java` is already here: open this folder in VS Code or your Codespace, click ▶ on `Main.java` to check your setup works. Use this one `Main.java` throughout the lab to call the methods you write; replace its test code as each exercise moves on. When an exercise asks you to define a class, give that class its own file beside `Main.java`: `Calculator.java` for DIY 1, `TemperatureConverter.java` for DIY 4, and so on. Every new file starts with the package line you see in `Main.java`. DIY 9 is the one exercise that does not use `Main.java`: its class comes with a `main` of its own, so it lives in its own file and you run it from there.

---

## Introduction

A **method** is a named block of code that performs one task and can be reused anywhere in your program. Instead of copy-pasting the same lines, you write them once and *call* the method wherever you need it. Methods make code **reusable** (write once, call many times), **modular** (big problems become small pieces), **readable** (a good name like `calculateAverage` documents itself), and **maintainable** (fix a bug in one place, not everywhere it was pasted).

Four terms you'll meet constantly:

* **Declaration** - the access modifier, return type, name, and parameter list.
* **Body** - the code between `{ }` that runs when the method is called.
* **Call** - using the method's name (plus arguments) to run it.
* **Signature** - the method's name plus its parameter list.

---

## 1. Defining Simple Methods

Every method follows the same pattern:

```
accessModifier returnType methodName(parameters) {
    // method body
    return value;   // only if returnType is not void
}
```

* **Access modifier** - `public`, `private`, etc. (we'll use `public` for now)
* **Return type** - the type of value sent back, or `void` for none
* **Name** - descriptive, camelCase
* **Parameters** - optional inputs the method needs

Here's a simple `void` method and the call that runs it:

```java
public class GreetingApp {

    public void printWelcome() {
        System.out.println("Welcome to Java Methods Lab!");
        System.out.println("Let's learn about methods together.");
    }

    public static void main(String[] args) {
        GreetingApp app = new GreetingApp();
        app.printWelcome();
    }
}
```

When `main` reaches `app.printWelcome();`, execution jumps into the method, runs its body, and comes straight back:

```mermaid
flowchart TD
    A["main() starts"] --> B["main() calls printWelcome()"]
    B --> C["Execution jumps into the method body"]
    C --> D["Both println lines run"]
    D --> E["Method ends - control returns to main()"]
    E --> F["main() continues with its next line"]
```

### DIY 1: Calculator menu

1. Create a class named `Calculator`.
2. Add a method `printHeader()` that prints the one-line header shown below.
3. Add a method `printMenu()` that lists the two operations shown below.
4. In `Main.java`'s `main` method, create a `Calculator` object and call both methods.

**Expected output**

```text
=== SIMPLE CALCULATOR ===
Choose an operation:
1. Addition
2. Division
```

<details><summary>Hint</summary>

Both methods are `void`: they print and hand nothing back, so neither needs a `return`. Neither takes parameters either - everything they print is fixed text. Copy the wording and the punctuation exactly, or the output will not match.

</details>

---

## 2. Methods with Parameters

**Parameters** let a method accept input. You name them in the method definition; the **arguments** are the actual values you supply in the call. At the moment of the call, each argument's *value is copied* into the matching parameter - the method then works on its own copy, so reassigning a parameter never changes the caller's variable:

```mermaid
flowchart LR
    subgraph caller["main()"]
        x["int x = 5"]
    end
    subgraph callee["square(int n)"]
        n["n = 5 (a copy of x)"]
    end
    x -->|"value copied at the call"| n
```

A method can take as many parameters as it needs, separated by commas:

```java
public class Greeter {

    public void greetUser(String name) {
        System.out.println("Hello, " + name + "!");
        System.out.println("Welcome to our program.");
    }

    public void greetUserWithAge(String name, int age) {
        System.out.println("Hello, " + name + "!");
        System.out.println("You are " + age + " years old.");
    }

    public static void main(String[] args) {
        Greeter greeter = new Greeter();
        greeter.greetUser("Alice");
        greeter.greetUserWithAge("Bob", 25);
    }
}
```

```text
Hello, Alice!
Welcome to our program.
Hello, Bob!
You are 25 years old.
```

### DIY 2: Calculator print methods

1. In `Calculator`, add two methods:
   * `printAddition(int a, int b)` - prints `a + b = result`
   * `printDivision(double a, double b)` - prints `a ÷ b = result` (use `double` for division)
2. In `Main.java`'s `main`, test each method with different values.

These methods only print - they don't return anything. The next section fixes that.

**Expected output**

```text
5 + 3 = 8
15.0 ÷ 3.0 = 5.0
```

<details><summary>Hint</summary>

Two `void` methods again, but this time each one declares its two values as parameters. Two details decide whether your output matches: `printDivision` takes `double`, not `int`, because `15 / 3` on ints prints `5` rather than `5.0`; and the symbol in the expected output is `÷`, not `/` - copy it from the block above rather than typing it.

</details>

---

## 3. Methods with Return Values

A method with a non-`void` return type sends a value back to the caller with the `return` keyword. That's far more powerful than printing, because the caller can store the result and keep computing with it.

* The returned value's type must match the declared return type.
* `return` immediately ends the method.
* A method may contain several `return` statements, but only one runs per call.

```java
public class MathOperations {

    public int add(int a, int b) {
        int sum = a + b;
        return sum;
    }

    public double calculateAverage(int num1, int num2, int num3) {
        int total = num1 + num2 + num3;
        return total / 3.0;
    }

    public static void main(String[] args) {
        MathOperations math = new MathOperations();
        int result = math.add(10, 5);
        System.out.println("10 + 5 = " + result);
        System.out.println("Average: " + math.calculateAverage(80, 90, 85));
    }
}
```

```text
10 + 5 = 15
Average: 85.0
```

### DIY 3: Calculator with return values

1. In `Calculator`, replace the print methods with value-returning versions:
   * `int add(int a, int b)` - returns the sum
   * `double divide(double a, double b)` - returns the quotient
2. Add error handling to `divide()`: if `b` is 0, print an error message and return 0.
3. In `Main.java`'s `main`, replace your DIY 2 calls (those print methods no longer exist) with calls to each new method: store each result in a variable, and print the results in a formatted way.

**Expected output**

```text
Addition: 5 + 3 = 8
Division: 15.0 ÷ 3.0 = 5.0
Error: Cannot divide by zero!
Division: 10.0 ÷ 0.0 = 0.0
```

<details><summary>Hint</summary>

Test `b == 0` at the top of `divide()` and return early - check *before* you divide, never after.

</details>

---

## 4. void vs Return Types

The choice is simpler than it looks:

```mermaid
flowchart TD
    Q{"Does the caller need a value back?"}
    Q -->|"Yes - it computes or fetches something"| R["Return type<br>calculateTotal(), isValid()"]
    Q -->|"No - it just performs an action"| V["void<br>printMenu(), saveToFile()"]
```

* **`void`** - the method's purpose is a side effect: printing, saving, updating state.
* **Return type** - the method produces a value the caller will use: a calculation, a lookup, a true/false check.

```java
public class StudentGradeProcessor {

    public void printGrade(String studentName, double score) {   // action -> void
        System.out.println(studentName + " scored " + score + "%");
    }

    public char calculateLetterGrade(double score) {             // computes -> returns
        if (score >= 90) return 'A';
        else if (score >= 80) return 'B';
        else if (score >= 70) return 'C';
        else if (score >= 60) return 'D';
        else return 'F';
    }

    public boolean isPassing(double score) {                     // checks -> returns
        return score >= 60;
    }

    public static void main(String[] args) {
        StudentGradeProcessor processor = new StudentGradeProcessor();
        double score = 85.5;
        processor.printGrade("Alice", score);
        System.out.println("Letter Grade: " + processor.calculateLetterGrade(score));
        System.out.println("Passing: " + processor.isPassing(score));
    }
}
```

```text
Alice scored 85.5%
Letter Grade: B
Passing: true
```

### DIY 4: Temperature converter

1. Create a class named `TemperatureConverter` with these methods:
   * `double celsiusToFahrenheit(double celsius)`
   * `void printConversion(double celsius)` - prints one line such as `25.0°C = 77.0°F` (void: it only displays, and it calls `celsiusToFahrenheit` for the number)
   * `boolean isFreezingCelsius(double celsius)` - true at or below 0°C
2. Formula: Fahrenheit = (Celsius × 9/5) + 32.
3. Test all three methods from `Main.java`'s `main`.

**Expected output**

```text
25.0°C = 77.0°F
100.0°C = 212.0°F
Is 0°C freezing? true
Is 25°C freezing? false
```

<details><summary>Hint</summary>

Write the fraction as `9.0 / 5.0`. With `int` literals, `9 / 5` is integer division and equals `1`, which silently wrecks the formula. Inside `printConversion`, call `celsiusToFahrenheit` rather than repeating the formula, then print the original value, the two unit symbols and the result on one line.

</details>

---

## 5. Method Visibility: public and private

**Access modifiers** control who may call a method:

* **`public`** - callable from anywhere. Use it for the operations a class offers to the outside world.
* **`private`** - callable only inside the same class. Use it for helper methods that support the public ones.

Keeping helpers `private` is **encapsulation**: implementation details stay hidden, so you can rewrite them later without breaking any other class - and no outside code can call them in the wrong order.

```java
public class BankAccount {
    private double balance;

    // Public methods - the class's interface
    public void deposit(double amount) {
        if (isValidAmount(amount)) {          // calls a private helper
            balance += amount;
            System.out.println("Deposited: $" + amount);
        } else {
            System.out.println("Invalid deposit amount");
        }
    }

    public void withdraw(double amount) {
        if (isValidAmount(amount) && hasSufficientFunds(amount)) {
            balance -= amount;
            System.out.println("Withdrew: $" + amount);
        } else {
            System.out.println("Invalid withdrawal");
        }
    }

    public double getBalance() {
        return balance;
    }

    // Private helpers - invisible outside this class
    private boolean isValidAmount(double amount) {
        return amount > 0;
    }

    private boolean hasSufficientFunds(double amount) {
        return balance >= amount;
    }
}
```

### DIY 5: PIN validator

A bank card PIN is four digits, and not every four-digit number is acceptable: `7777` and `1234` are the first two anyone guesses.

1. Create a class named `PinValidator`.
2. Add one **public** method, `boolean isValidPin(int pin)`, that is true only if all three checks below pass.
3. Add three **private** helper methods, each returning `boolean`:
   * `hasFourDigits` - the PIN is between 1000 and 9999
   * `isNotRepeated` - the four digits are not all the same (`7777` fails)
   * `isNotCommon` - the PIN is not `1234`
4. `isValidPin()` must call all three helpers - it does no checking of its own.
5. Test three PINs from `Main.java`'s `main`: two rejected for different reasons, one accepted.

**Expected output**

```text
1234 valid? false
7777 valid? false
4830 valid? true
```

<details><summary>Hint</summary>

Each helper is a single `return` of a boolean expression: `hasFourDigits` is `pin >= 1000 && pin <= 9999`, and `isNotCommon` is `pin != 1234`. For `isNotRepeated`, a four-digit number made of one repeated digit (1111, 2222, ... 9999) is always a multiple of 1111, so `pin % 1111 != 0` says the digits are not all the same. `isValidPin` joins the three helper calls with `&&`. From `main` you can call only `isValidPin`: the `private` helpers are invisible outside the class, and that is the point.

</details>

---

## 6. Static Methods

A **static** method belongs to the class itself, not to any object. Call it as `ClassName.methodName()` - no `new` required.

* `main` is static; so are utilities like `Math.sqrt()` and `Math.pow()`.
* Static methods cannot directly access instance variables or use `this` - there is no object.
* Use them for operations that depend only on their parameters.

```java
public class MathHelper {

    public static int square(int number) {
        return number * number;
    }

    public static double calculateCircleArea(double radius) {
        return Math.PI * radius * radius;
    }

    public static int findMax(int a, int b, int c) {
        int max = a;
        if (b > max) max = b;
        if (c > max) max = c;
        return max;
    }

    public static void main(String[] args) {
        System.out.println("Square of 5: " + MathHelper.square(5));
        System.out.println("Area of circle: " + MathHelper.calculateCircleArea(3.0));
        System.out.println("Maximum: " + MathHelper.findMax(10, 25, 15));
    }
}
```

```text
Square of 5: 25
Area of circle: 28.274333882308138
Maximum: 25
```

The same distinction applies to fields - a `static` field is shared by every instance, while each object gets its own copy of an instance field:

```java
public class Counter {
    static int staticCount = 0;      // shared by all instances
    int instanceCount = 0;           // unique per object

    public static void incrementStatic() {
        staticCount++;
    }

    public void incrementInstance() {
        instanceCount++;
    }

    public void printCounts() {
        System.out.println("Static: " + staticCount + ", Instance: " + instanceCount);
    }

    public static void main(String[] args) {
        Counter c1 = new Counter();
        Counter c2 = new Counter();
        c1.incrementInstance();
        c1.incrementInstance();
        Counter.incrementStatic();
        Counter.incrementStatic();
        c2.incrementInstance();
        Counter.incrementStatic();
        c1.printCounts();  // Static: 3, Instance: 2
        c2.printCounts();  // Static: 3, Instance: 1
    }
}
```

### DIY 6: Number utilities

Build a small library of `static` maths helpers - the kind of thing `Math` itself is made of.

1. Create a class named `NumberUtils` with these **static** methods:
   * `boolean isEven(int n)` - true when `n` divides by 2 exactly
   * `int reverseDigits(int n)` - `reverseDigits(4821)` is 1284
   * `boolean isNumberPalindrome(int n)` - reads the same both ways; **call `reverseDigits` rather than repeating its loop**
2. Call every one of them from `Main.java`'s `main` and print the results - **without creating a single object**.

**Expected output**

```text
Is 14 even? true
Is 7 even? false
Reverse of 4821: 1284
Is 1221 a palindrome? true
Is 1234 a palindrome? false
```

<details><summary>Hint</summary>

`%` and `/` do all the work here. To walk the digits of `n`, loop while `n > 0`, taking `n % 10` as the last digit and then shrinking `n` with `n = n / 10`. For `reverseDigits`, build the answer with `reversed = reversed * 10 + digit`. Then `isNumberPalindrome` is a single line: compare `n` with `reverseDigits(n)`.

</details>

---

## 7. Method Call Stack and Execution Flow

When methods call other methods, Java tracks them on the **call stack** - Last-In-First-Out, like a stack of plates:

1. Calling a method **pushes** it onto the top of the stack.
2. When it finishes, it is **popped** off, and execution resumes in the method below it.
3. Too many nested calls (usually runaway recursion) overflow the stack - the infamous `StackOverflowError`.

```java
public class CallStackDemo {

    public static void main(String[] args) {
        System.out.println("Starting in main");
        methodA();
        System.out.println("Back in main");
    }

    public static void methodA() {
        System.out.println("  In methodA");
        methodB();
        System.out.println("  Back in methodA");
    }

    public static void methodB() {
        System.out.println("    In methodB");
        methodC();
        System.out.println("    Back in methodB");
    }

    public static void methodC() {
        System.out.println("      In methodC");
        System.out.println("      Finishing methodC");
    }
}
```

```text
Starting in main
  In methodA
    In methodB
      In methodC
      Finishing methodC
    Back in methodB
  Back in methodA
Back in main
```

Each call pushes a frame onto the stack; each return pops one off:

```mermaid
sequenceDiagram
    participant M as main
    participant A as methodA
    participant B as methodB
    participant C as methodC
    M->>+A: call - push A
    A->>+B: call - push B
    B->>+C: call - push C
    Note over C: stack is now main, A, B, C
    C-->>-B: return - pop C
    B-->>-A: return - pop B
    A-->>-M: return - pop A
    Note over M: stack is main only
```

### DIY 7: Trace the call stack

First copy this class into its own file, `ExecutionTracer.java`, beside `Main.java` (start it with the same `package` line). The exercise is the prediction, not the typing:

```java
public class ExecutionTracer {

    public static void methodA() {
        System.out.println("A start");
        methodB();
        System.out.println("A end");
    }

    public static void methodB() {
        System.out.println("B start");
        methodC();
        System.out.println("B end");
    }

    public static void methodC() {
        System.out.println("C start");
        System.out.println("C end");
    }
}
```

1. Before running anything, predict the output on paper by drawing the stack at each step: which method is on top, and what has it printed so far?
2. Call `ExecutionTracer.methodA()` from `Main.java`'s `main`, run it, and check your prediction against the output below.

**Expected output**

```text
A start
B start
C start
C end
B end
A end
```

<details><summary>Hint</summary>

All three methods are `static`, so `main` calls them through the class name, `ExecutionTracer.methodA()`, with no object involved. The order is not three tidy pairs: `methodA` cannot reach its `A end` line until `methodB` has completely finished, and `methodB` cannot finish until `methodC` has. Draw the stack growing downward as each call is pushed, then unwinding from the bottom as each returns - the printed order is the shape of that drawing.

</details>

---

## 8. Recursion

**Recursion** is a method calling itself. Every call pushes a fresh frame, so a **base case** must eventually stop the chain:

```java
public static int factorial(int n) {
    if (n <= 1) return 1;            // base case - stops the recursion
    return n * factorial(n - 1);     // recursive step - pushes another frame
}
// factorial(5) -> 5 * 4 * 3 * 2 * 1 = 120
```

### DIY 8: Simple recursion

1. In `Main.java`, beside `main`, write a `static` method `int sumToN(int n)` that uses recursion to return 1 + 2 + … + n, and prints `Calculating sum(n)` each time it is called.
2. In `main`, call `sumToN(5)` and print the value it returns in the form shown below.

**Expected output**

```text
Calculating sum(5)
Calculating sum(4)
Calculating sum(3)
Calculating sum(2)
Calculating sum(1)
Result: 15
```

<details><summary>Hint</summary>

A recursive method needs the same two pieces as `factorial`: a base case that returns without recursing (`n <= 1`), and a recursive step that calls itself with a *smaller* argument (`n + sumToN(n - 1)`). Print the `Calculating` line before the base-case check, so that every call, the last one included, announces itself.

</details>

---

## 9. Common Mistakes and Debugging

Seven errors account for most method bugs. Each snippet shows the mistake and its fix:

**1. Missing return statement** - every path through a non-void method must return:

```java
public int getValue(int x) {
    if (x > 0) {
        return x;
    }
    return 0;   // without this line: compiler error
}
```

**2. Wrong argument type:**

<!-- no-compile -->
```java
add(5, "3");   // error: can't pass a String where an int is expected
add(5, 3);     // correct
```

**3. Discarding the return value:**

<!-- no-compile -->
```java
calculateTotal(10, 5);               // legal, but the result is lost
int result = calculateTotal(10, 5);  // store it - then use it
```

**4. Calling an instance method from a static context:**

<!-- no-compile -->
```java
instanceMethod();               // error: main is static, there is no object
MyClass obj = new MyClass();
obj.instanceMethod();           // correct
```

**5. Returning a value from a `void` method:**

<!-- no-compile -->
```java
public void calculate(int x) {   // error
    return x * 2;
}

public int calculate(int x) {   // correct
    return x * 2;
}
```

**6. Confusing parameters with arguments:**

<!-- no-compile -->
```java
public void greet(String name) { ... }   // 'name' is the parameter
greet("Alice");                          // "Alice" is the argument
```

**7. Arguments in the wrong order** - arguments fill parameters left to right, by position:

<!-- no-compile -->
```java
subtract(3, 10);   // compiles, runs, and quietly answers -7
subtract(10, 3);   // correct - the order is on you, not the compiler
```

Notice which of these the compiler can catch. Mistakes **1, 2, 4 and 5 stop the build** - `javac` names the file and the line, and you cannot ship until you fix them. Mistakes **3 and 7 are legal Java**: the class builds, runs, and is simply wrong - nothing but reading will find them. (6 is vocabulary rather than a bug.) That split is exactly what the next exercise is about.

**Debugging tips:** print on entry (`"Entering divide with " + a + ", " + b`), print every return value before using it, and learn your IDE's debugger - stepping through line by line beats guessing.

### DIY 9: Fix the buggy calculator

The class below carries **7 labelled faults: 5 compile errors and 2 design faults.** The compiler finds the first five for you. The last two are legal Java - the class builds and runs with them still in place, so only reading will catch them.

<!-- no-compile -->
```java
public class BuggyCalculator {

    // Compile error 1: no return type
    public static calculateSum(int a, int b) {
        return a + b;
    }

    // Compile error 2: a void method handing back a value
    public static void getProduct(int a, int b) {
        return a * b;
    }

    // Compile error 3: no return when num is 0
    public static int checkValue(int num) {
        if (num > 0) {
            return 1;
        } else if (num < 0) {
            return -1;
        }
    }

    // Not a fault - this declaration is fine. Watch how main calls it.
    public void displayMessage() {
        System.out.println("Hello!");
    }

    // Not a fault either - this one is correct. Watch how main uses it.
    public static int subtract(int a, int b) {
        return a - b;
    }

    public static void main(String[] args) {
        // Compile error 4: wrong argument type
        int sum = calculateSum(5, "10");

        // Compile error 5: an instance method called with no object
        displayMessage();

        // Design fault 6: legal Java - the answer is computed, then thrown away
        subtract(10, 3);

        // Design fault 7: legal Java - but read the label against the arguments
        System.out.println("10 - 3 = " + subtract(3, 10));
    }
}
```

1. Copy the class into a new file, `BuggyCalculator.java`, in your package (start it with the same `package` line as `Main.java`). It has a `main` of its own, so this is the one exercise that does not use `Main.java`: run it with the ▶ above its own `main`.
2. Fix the five compile errors first. Faults 1-3 are in the declarations, 4-5 in how `main` calls them - repair the declarations and most of the calls fall into place.
3. Expect `javac` to report **far fewer than five at a time**. Fault 1 is a *parse* error, so on the first run it is the only message you get - and the missing-return check does not run at all until the type errors above it are gone. Fix, recompile, repeat until the class builds.
4. Now hunt faults 6 and 7 by **reading**, not compiling: the build is already green and stays green with both still in place. For each, say what the code does and what it was clearly meant to do.
5. Make `main` print every result, and add calls to `getProduct` and `checkValue` so each fix shows up in the output.
6. Compile and run.

**Expected output**

```text
Sum: 15
Hello!
Product: 20
Check 0: 0
10 - 3 = 7
```

(Representative run - your exact fixes and wording may differ, as long as the class compiles and every call works.)

<details><summary>Hint</summary>

Work top-down. Faults 1-3 live in the method declarations: one has no return type, one hands a value back from a `void` method, and one leaves a path with nothing to return. Faults 4-5 live in `main`: check the argument types in the first call, and whether the method named in the second needs an object first. For fault 6, ask where the answer goes - a call sitting alone on a line computes and then discards. For fault 7, compare the printed label with the parameter list of the method being called.

</details>

---

## Summary

You can now:

* **Define and call methods** - the building blocks of every Java program.
* **Pass parameters** (values are copied in) and **return results** (typed values come back out).
* **Choose `void` for actions** and a **return type for computations**.
* **Encapsulate** with `private` helpers behind `public` methods.
* **Write static utilities** that belong to the class, not to objects.
* **Read the call stack** - LIFO push and pop, the key to tracing recursion and debugging.

Habits worth keeping: give methods verb names that say what they do, keep each method focused on one task, prefer returning values over printing, and test edge cases (zero, negatives, empty strings).
