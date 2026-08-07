---
marp: true
theme: ooc
paginate: true
title: "Java Methods"
week: 3
topic: methods
type: lecture
source: "Java_Methods.pptx"
---

<!-- _class: lead -->
<!-- _paginate: false -->

<span class="kicker">// week 03 · methods · object-oriented computing</span>

# Java Methods

- Java Methods
- Building Blocks of Java Programs

---

## Agenda

- What is a Method?
- Method Syntax and Components
- Parameters and Return Values
- void vs Return Types
- Multiple Parameters
- Method Scope and Visibility
- Static Methods
- Method Call Stack
- Common Mistakes
- Best Practices

---

## What is a Method?

- A method is a block of code that performs a specific task
- Methods help us:
  - Organize code into reusable pieces
  - Break complex problems into smaller, manageable parts
  - Avoid repeating the same code
  - Make programs easier to understand and maintain

---

## Method Syntax

- Method Syntax
<!-- no-compile -->
```java
accessModifier void methodName(parameters) {
    // method body
    // code to execute
}
```
<!-- no-compile -->
```java
public void run(double distanceMeters) {
    // method body
    distanceTraveled = distanceTraveled + distanceMeters;
}
```

---

## Anatomy of a Method

- Example: Simple Method
```java
public void greet() {
    System.out.println("Hello, welcome to Java!");
}
```
- Breakdown:
- • public - can be accessed from anywhere
- • void - returns no value
- • greet - method name
- • () - no parameters

---

## Methods with Parameters

- Method with Parameters
```java
public void greetUser(String name) {
    System.out.println("Hello, " + name + "!");
}
```
- Calling the method:
<!-- no-compile -->
```java
greetUser("Alice");  // Output: Hello, Alice!
greetUser("Bob");    // Output: Hello, Bob!
```
- Parameters allow methods to accept input values

---

## Methods with Return Values

- Method with Return Value
```java
public int add(int a, int b) {
    int sum = a + b;
    return sum;
}
```
- Using the returned value:
<!-- no-compile -->
```java
int result = add(5, 3);
System.out.println(result);  // Output: 8
```
- The return keyword sends a value back to the caller

---

## void vs Return Types

- Choosing between void and a return type:
- Use void when:
  - The method performs an action (printing, updating a variable)
  - You don't need to send any value back
  - Example: displayMenu(), saveToFile()
- Use a return type when:
  - The method calculates or produces a value
  - You need to use the result elsewhere in your program
  - Example: calculateTotal(), getName(), isValid()

---

## Working with Multiple Parameters

- Multiple Parameters
```java
public double calculateArea(double length, double width) {
    double area = length * width;
    return area;
}
```
- Calling with multiple arguments:
<!-- no-compile -->
```java
double roomArea = calculateArea(5.5, 4.2);
System.out.println("Area: " + roomArea);
// Output: Area: 23.1
```

---

## Method Scope and Visibility

- Access modifiers control who can call your methods:
- public - accessible from anywhere
  - Most common for methods you want others to use
  - Example: public void displayMenu()
- private - only accessible within the same class
  - Used for helper methods that other classes shouldn't call
  - Example: private void validateInput()
- Default: Use public for now, we'll cover private later in detail

---

## Private Helper Methods

- Method Visibility Example
```java
public class BankAccount {
    private double balance;
    public void deposit(double amount) {
        if (isValidAmount(amount)) {
            balance = balance + amount;
        }
    }
    private boolean isValidAmount(double amount) {
        return amount > 0;  // Helper method
    }
}
```
- deposit() is public, isValidAmount() is private (internal helper)

---

## Static Methods

- A static method belongs to the class itself, not to individual objects
- Key characteristics:
  - Called using the class name, not an object
  - Can be used without creating an instance
  - Cannot access non-static variables directly
  - Commonly used for utility functions
- Example: Math.sqrt(), Math.pow() are static methods

---

## Calling a Static Method

- Static Method Example
```java
public class MathHelper {
    public static int square(int number) {
        return number * number;
    }
}
```
- Calling a static method:
<!-- no-compile -->
```java
int result = MathHelper.square(5);
System.out.println(result);  // Output: 25
```
- We use ClassName.methodName() instead of creating an object

---

## Static vs Non-Static Members

- Static vs Non-Static
```java
public class Counter {
    static int staticCount = 0;      // Shared by all
    int instanceCount = 0;           // Unique per object
    public static void incrementStatic() {
        staticCount++;
    }
    public void incrementInstance() {
        instanceCount++;
    }
}
```
- • Static: belongs to class, shared across all instances
- • Non-static: belongs to object, unique for each instance

---

## Method Call Stack

- When methods call other methods, Java tracks them in a call stack:
- Stack behavior:
  - Methods are added to the top when called
  - Methods are removed from the top when they finish
  - Last In, First Out (LIFO) - like a stack of plates
- Why it matters:
  - Shows the order of execution
  - Helps understand method flow and debugging
  - Each method waits for methods it calls to finish

---

## Tracing the Call Stack

- Call Stack Example
```java
public static void main(String[] args) {
    methodA();  // Step 1: Call methodA
}
public static void methodA() {
    System.out.println("In A");
    methodB();  // Step 2: Call methodB
    System.out.println("Back in A");
}
public static void methodB() {
    System.out.println("In B");  // Step 3
}
```
- Execution order: main → methodA → methodB → methodA → main

---

## Common Mistakes with Methods

- Missing return statement:
  - If method has return type, must return a value on all paths
- Wrong parameter types:
  - add(5, "3") will fail if add expects two ints
- Forgetting to use return value:
  - int x = calculateTotal();  // Good
  - calculateTotal();  // Bad - result is lost
- Calling non-static method from static context:
  - Can't call instance methods from main without object

---

## Fixing a Missing Return Statement

<style scoped>
section pre { padding: 12px 16px; margin: 8px 0; }
section pre code { font-size: 17px; line-height: 1.3; }
</style>

- Common Mistakes - Examples
- Missing return on all paths (WRONG):
<!-- no-compile -->
```java
public int getValue(int x) {
    if (x > 0) {
        return x;
    }
    // Missing return here!
}
```
- Correct version:
```java
public int getValue(int x) {
    if (x > 0) {
        return x;
    }
    return 0;  // Return for all paths
}
```

---

## Putting It All Together

- Complete Example
```java
public class Calculator {
    public static double divide(double num, double den) {
        if (den == 0) {
            System.out.println("Error: divide by zero!");
            return 0;
        }
        return num / den;
    }
    public static void main(String[] args) {
        double result = Calculator.divide(10, 2);
        System.out.println("Result: " + result);
    }
}
```

---

## Best Practices

- Use descriptive method names that explain what the method does
- Keep methods short and focused on a single task
- Use parameters to make methods flexible and reusable
- Add comments to explain complex logic
- Choose static for utility methods that don't need object state
- Follow Java naming conventions: camelCase for method names
- Always return a value on all paths if method has return type

---

## Summary

- Methods are reusable blocks of code that perform specific tasks
- Methods can accept parameters and return values
- Use void when performing actions, return types when producing values
- Access modifiers (public/private) control method visibility
- Static methods belong to the class and are called without objects
- Method call stack tracks execution order
- Well-designed methods make code cleaner and easier to maintain

