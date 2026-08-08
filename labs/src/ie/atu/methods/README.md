# Java Methods Lab

> **Setup note:** this lab's package (`ie.atu.methods`) and a runnable `Main.java` already exist in this folder — skip any “create the package” setup steps and write your classes right here, beside this README.
## Agenda

1. [Introduction](#1-introduction)
2. [Defining Simple Methods](#2-defining-simple-methods)
3. [Methods with Parameters](#3-methods-with-parameters)
4. [Methods with Return Values](#4-methods-with-return-values)
5. [void vs Return Types](#5-void-vs-return-types)
6. [Method Scope and Visibility](#6-method-scope-and-visibility)
7. [Static Methods](#7-static-methods)
8. [Method Call Stack and Execution Flow](#8-method-call-stack-and-execution-flow)
9. [Common Mistakes and Debugging](#9-common-mistakes-and-debugging)
10. [Summary and Further Reading](#10-summary-and-further-reading)

---

## 1. Introduction

### Explanation

Methods are fundamental building blocks in Java programming. A **method** is a block of code that performs a specific task and can be reused throughout your program. Methods help us organize code, avoid repetition, and make programs easier to understand and maintain.

**Why Use Methods?**

* **Code Reusability:** Write once, use many times. Instead of repeating the same code, call a method.
* **Modularity:** Break complex problems into smaller, manageable pieces.
* **Readability:** Well-named methods make code self-documenting and easier to understand.
* **Maintainability:** Fix bugs or make changes in one place rather than throughout your code.
* **Testing:** Smaller methods are easier to test and debug.

**Key Concepts:**

* **Method Signature:** The method name and its parameter list define its signature.
* **Method Declaration:** Includes access modifier, return type, method name, and parameters.
* **Method Body:** The code inside the curly braces that executes when the method is called.
* **Method Call:** Using the method name and providing required arguments to execute the method.

### DIY Coding Task

**Objective**: Set up your project structure and think about methods you use daily.

**Task**:

1. Create a new Java project in your IDE.
2. Create a package named `ie.atu.methods`. All classes you create for this lab will go in here.
3. Create a class named `Main` with a `main` method. This is where you'll test your code.

---

## 2. Defining Simple Methods

### Explanation

A method is defined with the following syntax:

```
accessModifier returnType methodName(parameters) {
    // method body
    // code to execute
    return value; // if returnType is not void
}
```

**Components:**

* **Access Modifier:** `public`, `private`, etc. (we'll use `public` for now)
* **Return Type:** The type of value the method returns (or `void` if it returns nothing)
* **Method Name:** Should be descriptive and follow camelCase convention
* **Parameters:** Input values the method needs (optional)
* **Method Body:** The code that executes when the method is called

### Example

Let's start with a simple method that prints a greeting:

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

### DIY Coding Task

**Objective**: Create your first methods to display information.

**Task**:

1. Create a class named `Calculator` in the `ie.atu.methods` package.
2. Add a method `printHeader()` that prints a decorative header for a calculator program:
   ```
   ================================
        SIMPLE CALCULATOR
   ================================
   ```
3. Add a method `printMenu()` that displays a menu of operations:
   ```
   Choose an operation:
   1. Addition
   2. Subtraction
   3. Multiplication
   4. Division
   ```
4. In the `main` method, create an instance of `Calculator` and call both methods.

**Sample Output**:
```
================================
     SIMPLE CALCULATOR
================================
Choose an operation:
1. Addition
2. Subtraction
3. Multiplication
4. Division
```

---

## 3. Methods with Parameters

### Explanation

Parameters allow methods to accept input values, making them flexible and reusable. When you define a method, you specify the **parameters** (the variables in the method definition). When you call the method, you provide **arguments** (the actual values).

**Syntax:**

```java
public void methodName(type parameter1, type parameter2) {
    // use parameter1 and parameter2
}
```

**Calling with arguments:**

```java
methodName(value1, value2);
```

### Example

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

**Output:**
```
Hello, Alice!
Welcome to our program.
Hello, Bob!
You are 25 years old.
```

### DIY Coding Task

**Objective**: Practice creating methods with different numbers of parameters.

**Task**:

1. In your `Calculator` class, add the following methods:
   * `printAddition(int a, int b)` - prints "a + b = result"
   * `printSubtraction(int a, int b)` - prints "a - b = result"
   * `printMultiplication(int a, int b)` - prints "a × b = result"
   * `printDivision(double a, double b)` - prints "a ÷ b = result" (use double for division)

2. In the `main` method, test each method with different values.

**Sample Output**:
```
5 + 3 = 8
10 - 4 = 6
6 × 7 = 42
15.0 ÷ 3.0 = 5.0
```

**Note:** These methods don't return values; they just print results. We'll add return values in the next section.

---

## 4. Methods with Return Values

### Explanation

Methods can **return** a value to the caller using the `return` keyword. The return type must match the type specified in the method declaration. This is much more powerful than just printing values because it allows you to use the result in other calculations or operations.

**Key Points:**

* The method must specify a return type (not `void`)
* The method must use the `return` keyword to send a value back
* The returned value can be stored in a variable or used directly
* A method can have multiple `return` statements, but only one executes

### Example

```java
public class MathOperations {
    
    public int add(int a, int b) {
        int sum = a + b;
        return sum;
    }
    
    public double calculateAverage(int num1, int num2, int num3) {
        int total = num1 + num2 + num3;
        double average = total / 3.0;
        return average;
    }
    
    public static void main(String[] args) {
        MathOperations math = new MathOperations();
        
        int result = math.add(10, 5);
        System.out.println("10 + 5 = " + result);
        
        double avg = math.calculateAverage(80, 90, 85);
        System.out.println("Average: " + avg);
    }
}
```

**Output:**
```
10 + 5 = 15
Average: 85.0
```

### DIY Coding Task

**Objective**: Refactor your `Calculator` class to use return values instead of printing.

**Task**:

1. In your `Calculator` class, replace the print methods with return methods:
   * `int add(int a, int b)` - returns the sum
   * `int subtract(int a, int b)` - returns the difference
   * `int multiply(int a, int b)` - returns the product
   * `double divide(double a, double b)` - returns the quotient

2. Add error handling to `divide()`: if `b` is 0, print an error message and return 0.

3. In the `main` method:
   * Call each method and store the result in a variable
   * Print the results in a formatted way

**Sample Output**:
```
Addition: 5 + 3 = 8
Subtraction: 10 - 4 = 6
Multiplication: 6 × 7 = 42
Division: 15.0 ÷ 3.0 = 5.0
Error: Cannot divide by zero!
Division: 10.0 ÷ 0.0 = 0.0
```

---

## 5. void vs Return Types

### Explanation

Choosing between `void` and a return type depends on what the method needs to accomplish.

**Use `void` when:**

* The method performs an action (like printing, saving to a file, updating a variable)
* You don't need to send any value back to the caller
* The method's purpose is its side effects (changes to state, output, etc.)
* Examples: `displayMenu()`, `saveToFile()`, `printReport()`

**Use a return type when:**

* The method calculates or produces a value
* You need to use the result in other parts of your program
* The method performs a computation or retrieval operation
* Examples: `calculateTotal()`, `getUsername()`, `isValid()`, `findMaximum()`

### Example

```java
public class StudentGradeProcessor {
    
    // void method - performs an action
    public void printGrade(String studentName, double score) {
        System.out.println(studentName + " scored " + score + "%");
    }
    
    // return method - calculates and returns a value
    public char calculateLetterGrade(double score) {
        if (score >= 90) return 'A';
        else if (score >= 80) return 'B';
        else if (score >= 70) return 'C';
        else if (score >= 60) return 'D';
        else return 'F';
    }
    
    // return method - checks a condition
    public boolean isPassing(double score) {
        return score >= 60;
    }
    
    public static void main(String[] args) {
        StudentGradeProcessor processor = new StudentGradeProcessor();
        
        double score = 85.5;
        processor.printGrade("Alice", score);  // void method - just prints
        
        char grade = processor.calculateLetterGrade(score);  // returns value
        System.out.println("Letter Grade: " + grade);
        
        boolean passing = processor.isPassing(score);  // returns boolean
        System.out.println("Passing: " + passing);
    }
}
```

**Output:**
```
Alice scored 85.5%
Letter Grade: B
Passing: true
```

### DIY Coding Task

**Objective**: Practice choosing the appropriate return type for different scenarios.

**Task**:

1. Create a class named `TemperatureConverter`.

2. Add the following methods:
   * `double celsiusToFahrenheit(double celsius)` - returns fahrenheit
   * `double fahrenheitToCelsius(double fahrenheit)` - returns celsius
   * `void printConversionTable(int startCelsius, int endCelsius)` - prints a table (void because it just displays)
   * `boolean isFreezingCelsius(double celsius)` - returns true if temp is at or below 0°C
   * `boolean isBoilingCelsius(double celsius)` - returns true if temp is at or above 100°C

3. Formulas:
   * Fahrenheit = (Celsius × 9/5) + 32
   * Celsius = (Fahrenheit - 32) × 5/9

4. Test all methods in `main`.

**Sample Output**:
```
25.0°C = 77.0°F
77.0°F = 25.0°C

Celsius to Fahrenheit Conversion Table:
0°C = 32.0°F
10°C = 50.0°F
20°C = 68.0°F
30°C = 86.0°F

Is 0°C freezing? true
Is 100°C boiling? true
Is 25°C freezing? false
```

---

## 6. Method Scope and Visibility

### Explanation

**Access modifiers** control who can call your methods. The two most important ones for now are:

**`public`**: The method can be accessed from anywhere
* Use for methods that other classes should be able to call
* Most common for methods you want to expose as part of a class's interface
* Example: `public int calculateTotal()`

**`private`**: The method can only be accessed within the same class
* Use for helper methods that support your public methods
* Keeps implementation details hidden
* Makes code more maintainable - you can change private methods without affecting other code
* Example: `private boolean validateInput()`

**Why use private methods?**

* **Encapsulation:** Hide implementation details
* **Security:** Prevent external code from calling internal helper methods
* **Flexibility:** Change private methods without affecting other classes
* **Organization:** Break complex public methods into simpler private helper methods

### Example

```java
public class BankAccount {
    private double balance;
    
    // Public method - part of the class's interface
    public void deposit(double amount) {
        if (isValidAmount(amount)) {  // calls private helper
            balance += amount;
            System.out.println("Deposited: $" + amount);
        } else {
            System.out.println("Invalid deposit amount");
        }
    }
    
    // Public method
    public void withdraw(double amount) {
        if (isValidAmount(amount) && hasSufficientFunds(amount)) {
            balance -= amount;
            System.out.println("Withdrew: $" + amount);
        } else {
            System.out.println("Invalid withdrawal");
        }
    }
    
    // Private helper method - not accessible outside this class
    private boolean isValidAmount(double amount) {
        return amount > 0;
    }
    
    // Private helper method
    private boolean hasSufficientFunds(double amount) {
        return balance >= amount;
    }
    
    // Public method to view balance
    public double getBalance() {
        return balance;
    }
}
```

### DIY Coding Task

**Objective**: Practice using public and private methods appropriately.

**Task**:

1. Create a class named `PasswordValidator`.

2. Add the following **public** methods:
   * `boolean isValidPassword(String password)` - returns true if password meets all criteria
   * `void printValidationReport(String password)` - prints whether password is valid and why

3. Add the following **private helper** methods:
   * `private boolean hasMinimumLength(String password)` - checks if length >= 8
   * `private boolean hasDigit(String password)` - checks if password contains at least one digit
   * `private boolean hasUppercase(String password)` - checks if password contains at least one uppercase letter
   * `private boolean hasLowercase(String password)` - checks if password contains at least one lowercase letter

4. In `isValidPassword()`, call all the private helper methods to determine if password is valid.

5. In `printValidationReport()`, show which criteria pass/fail.

6. Test with various passwords in `main`.

**Hints:**
* Use `password.length()` to get length
* Use `Character.isDigit(c)`, `Character.isUpperCase(c)`, `Character.isLowerCase(c)`
* Loop through password characters

**Sample Output**:
```
Testing password: "abc123"
Valid: false
- Minimum length (8): false
- Contains digit: true
- Contains uppercase: false
- Contains lowercase: true

Testing password: "Secure123"
Valid: true
- Minimum length (8): true
- Contains digit: true
- Contains uppercase: true
- Contains lowercase: true
```

---

## 7. Static Methods

### Explanation

**Static methods** belong to the class itself, not to any specific object instance. They can be called using the class name without creating an object.

**Key Characteristics:**

* Called using `ClassName.methodName()` instead of `objectName.methodName()`
* Cannot access non-static (instance) variables or methods directly
* Cannot use the `this` keyword (because there's no instance)
* Commonly used for utility functions that don't need object state
* The `main` method is always static

**When to use static methods:**

* Utility or helper functions (like `Math.sqrt()`, `Math.pow()`)
* Methods that don't depend on instance variables
* Factory methods that create objects
* Methods that perform operations on parameters only

### Example

```java
public class MathHelper {
    
    // Static method - belongs to the class
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
        // Call static methods using class name
        int result = MathHelper.square(5);
        System.out.println("Square of 5: " + result);
        
        double area = MathHelper.calculateCircleArea(3.0);
        System.out.println("Area of circle: " + area);
        
        int maximum = MathHelper.findMax(10, 25, 15);
        System.out.println("Maximum: " + maximum);
    }
}
```

**Output:**
```
Square of 5: 25
Area of circle: 28.274333882308138
Maximum: 25
```

### Static vs Non-Static Example

```java
public class Counter {
    static int staticCount = 0;      // Shared by all instances
    int instanceCount = 0;           // Unique per object
    
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

### DIY Coding Task

**Objective**: Create utility methods using static methods.

**Task**:

1. Create a class named `StringUtils` with the following **static** methods:
   * `int countVowels(String text)` - returns number of vowels (a,e,i,o,u - case insensitive)
   * `String reverse(String text)` - returns reversed string
   * `boolean isPalindrome(String text)` - returns true if text reads the same forwards and backwards (ignore case and spaces)
   * `int countWords(String text)` - returns number of words (split by spaces)

2. Create a class named `ArrayUtils` with these **static** methods:
   * `int findMax(int[] numbers)` - returns the largest number
   * `int findMin(int[] numbers)` - returns the smallest number
   * `double calculateAverage(int[] numbers)` - returns the average
   * `void printArray(int[] numbers)` - prints array in format: [1, 2, 3, 4]

3. Test all methods in `main` **without** creating instances of the classes.

**Sample Output**:
```
Testing StringUtils:
Vowels in "Hello World": 3
Reversed "Java": avaJ
Is "racecar" a palindrome? true
Is "hello" a palindrome? false
Words in "Learning Java is fun": 4

Testing ArrayUtils:
Array: [5, 2, 8, 1, 9]
Maximum: 9
Minimum: 1
Average: 5.0
```

---

## 8. Method Call Stack and Execution Flow

### Explanation

When methods call other methods, Java tracks them in a **call stack**. The call stack is a data structure that keeps track of method calls using a Last-In-First-Out (LIFO) approach - like a stack of plates.

**How it works:**

1. When a method is called, it's added (pushed) to the top of the stack
2. When a method finishes, it's removed (popped) from the stack
3. Execution returns to the method below it on the stack
4. The stack grows when methods call other methods
5. The stack shrinks when methods complete

**Why this matters:**

* Understanding execution order helps with debugging
* Each method must wait for methods it calls to finish
* Stack overflow errors occur when the stack gets too deep (often from infinite recursion)
* The call stack shows you the path of execution

### Example

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

**Output:**
```
Starting in main
  In methodA
    In methodB
      In methodC
      Finishing methodC
    Back in methodB
  Back in methodA
Back in main
```

**Call Stack Visualization:**

```
Step 1: main() [bottom of stack]
Step 2: main() -> methodA()
Step 3: main() -> methodA() -> methodB()
Step 4: main() -> methodA() -> methodB() -> methodC() [top of stack]
Step 5: main() -> methodA() -> methodB() [methodC finished]
Step 6: main() -> methodA() [methodB finished]
Step 7: main() [methodA finished]
Step 8: [main finished - program ends]
```

### Recursive Methods

Recursion is when a method calls itself. Each call adds a new frame to the stack:

```java
public class RecursionDemo {
    
    public static int factorial(int n) {
        System.out.println("  Calculating factorial(" + n + ")");
        if (n <= 1) {
            System.out.println("  Base case reached");
            return 1;
        }
        int result = n * factorial(n - 1);
        System.out.println("  factorial(" + n + ") = " + result);
        return result;
    }
    
    public static void main(String[] args) {
        int result = factorial(5);
        System.out.println("Final result: " + result);
    }
}
```

### DIY Coding Task

**Objective**: Understand method call flow and practice with recursive methods.

**Task 1: Tracing Execution**

1. Create a class named `ExecutionTracer`.

2. Add these methods:
   * `public static void methodA()` - prints "A start", calls methodB(), prints "A end"
   * `public static void methodB()` - prints "B start", calls methodC(), prints "B end"
   * `public static void methodC()` - prints "C start", prints "C end"

3. Call methodA() from main and observe the output.

4. Draw the call stack at each step.

**Task 2: Simple Recursion**

1. Create a class named `RecursiveMethods`.

2. Implement these **static** recursive methods:
   * `int countdown(int n)` - counts down from n to 1, printing each number, returns 0
   * `int sumToN(int n)` - returns sum of 1+2+3+...+n
   * `int power(int base, int exponent)` - calculates base^exponent recursively

3. For each method, add a print statement showing when it's called.

4. Test with small values (n ≤ 5) to see the call stack in action.

**Sample Output for Task 2:**
```
Countdown from 5:
5
4
3
2
1

Sum from 1 to 5:
Calculating sum(5)
Calculating sum(4)
Calculating sum(3)
Calculating sum(2)
Calculating sum(1)
Result: 15

Power 2^4:
Calculating 2^4
Calculating 2^3
Calculating 2^2
Calculating 2^1
Calculating 2^0
Result: 16
```

---

## 9. Common Mistakes and Debugging

### Explanation

Learning from common mistakes helps you write better code faster. Here are the most frequent errors students make with methods:

**1. Missing Return Statement**

```java
// WRONG - compiler error
public int getValue(int x) {
    if (x > 0) {
        return x;
    }
    // Missing return for x <= 0 case
}

// CORRECT
public int getValue(int x) {
    if (x > 0) {
        return x;
    }
    return 0;  // All paths must return a value
}
```

**2. Wrong Parameter Types**

```java
public int add(int a, int b) {
    return a + b;
}

// WRONG - compiler error
add(5, "3");  // Can't pass String where int expected

// CORRECT
add(5, 3);    // Both arguments are int
```

**3. Forgetting to Use Return Value**

```java
public int calculateTotal(int a, int b) {
    return a + b;
}

// WRONG - result is lost
calculateTotal(10, 5);

// CORRECT - store or use the result
int result = calculateTotal(10, 5);
System.out.println(result);
```

**4. Calling Non-Static Method from Static Context**

```java
public class MyClass {
    public void instanceMethod() {  // non-static
        System.out.println("Instance method");
    }
    
    public static void main(String[] args) {
        // WRONG - can't call instance method without object
        instanceMethod();
        
        // CORRECT - create object first
        MyClass obj = new MyClass();
        obj.instanceMethod();
    }
}
```

**5. Wrong Return Type**

```java
// WRONG - void methods can't return values
public void calculate(int x) {
    return x * 2;  // compiler error
}

// CORRECT
public int calculate(int x) {
    return x * 2;
}
```

**6. Parameter vs Argument Confusion**

```java
// Parameters are in the method definition
public void greet(String name) {  // 'name' is a parameter
    System.out.println("Hello, " + name);
}

// Arguments are the actual values passed
greet("Alice");  // "Alice" is an argument
```

### Debugging Tips

1. **Use print statements** to trace execution:
   ```java
   System.out.println("Entering methodName with value: " + value);
   ```

2. **Check return values** at each step:
   ```java
   int result = someMethod();
   System.out.println("Result: " + result);
   ```

3. **Verify parameter values**:
   ```java
   public int divide(int a, int b) {
       System.out.println("Dividing " + a + " by " + b);
       return a / b;
   }
   ```

4. **Use your IDE's debugger** to step through code line by line

### DIY Coding Task

**Objective**: Find and fix common method errors.

**Task**:

Below is a class with **10 intentional errors**. Your job is to:
1. Identify each error
2. Explain why it's wrong
3. Fix it

```java
public class BuggyCalculator {
    
    // Error 1: Missing return type
    public calculateSum(int a, int b) {
        return a + b;
    }
    
    // Error 2: Wrong return type for void method
    public void getProduct(int a, int b) {
        return a * b;
    }
    
    // Error 3: Missing return statement on all paths
    public int checkValue(int num) {
        if (num > 0) {
            return 1;
        } else if (num < 0) {
            return -1;
        }
        // Missing return for num == 0
    }
    
    // Error 4: Static method trying to access non-static variable
    private int multiplier = 10;
    
    public static int scaleValue(int value) {
        return value * multiplier;  // Can't access non-static from static
    }
    
    // Error 5: Non-static method called from main without object
    public void displayMessage() {
        System.out.println("Hello!");
    }
    
    public static void main(String[] args) {
        // Error 6: Wrong argument type
        int sum = calculateSum(5, "10");
        
        // Error 7: Not storing/using return value
        calculateSum(3, 4);
        
        // Error 8: Calling non-static method incorrectly
        displayMessage();
        
        // Error 9: Wrong number of arguments
        int product = getProduct(5);
        
        // Error 10: Trying to return from void method
        printResult();
    }
    
    public static void printResult() {
        return 42;  // void can't return a value
    }
}
```

**Your Task:**
1. Copy this code
2. Identify all 10 errors (they are labeled)
3. Fix each error
4. Test that the corrected code compiles and runs

**Expected Output After Fixes:**
```
(Your corrected program should run without errors)
```

---

## 10. Summary and Further Reading

This lab introduced fundamental concepts about methods in Java. You learned how to:

* Define methods with proper syntax and naming conventions
* Create methods with parameters to accept input
* Use return values to send data back to the caller
* Choose between `void` and return types appropriately
* Apply access modifiers (`public` and `private`) for encapsulation
* Create and use static methods for utility functions
* Understand the method call stack and execution flow
* Recognize and fix common method-related errors

### Key Takeaways

* **Methods** are reusable blocks of code that make programs modular and maintainable
* **Parameters** make methods flexible; **return values** make them composable
* Use **`void`** for actions; use **return types** for computations
* **`private`** methods hide implementation details; **`public`** methods define the interface
* **`static`** methods belong to the class; instance methods belong to objects
* The **call stack** tracks method execution in LIFO order
* Always ensure all code paths return a value (for non-void methods)

### Best Practices Checklist

✅ Use descriptive method names (verbs for actions)
✅ Keep methods short and focused on one task
✅ Use parameters instead of hard-coding values
✅ Add comments to explain complex logic
✅ Return values instead of printing when possible
✅ Use private methods for helper functions
✅ Use static methods for utilities that don't need object state
✅ Test methods with various inputs, including edge cases

### Further Reading

**Official Java Documentation:**

* [Defining Methods](https://docs.oracle.com/javase/tutorial/java/javaOO/methods.html)
* [Passing Information to Methods](https://docs.oracle.com/javase/tutorial/java/javaOO/arguments.html)
* [Returning Values from Methods](https://docs.oracle.com/javase/tutorial/java/javaOO/returnvalue.html)
* [Understanding Class Members](https://docs.oracle.com/javase/tutorial/java/javaOO/classvars.html)

**Recommended Books:**

* *Head First Java* by Kathy Sierra & Bert Bates (Chapter on Methods)
* *Effective Java* by Joshua Bloch (Advanced method design patterns)

**Online Resources:**

* **Java Methods Tutorial:** [https://www.w3schools.com/java/java_methods.asp](https://www.w3schools.com/java/java_methods.asp)
* **Method Parameters:** [https://www.geeksforgeeks.org/methods-in-java/](https://www.geeksforgeeks.org/methods-in-java/)
* **Static vs Non-Static:** [https://www.geeksforgeeks.org/static-methods-vs-instance-methods-java/](https://www.geeksforgeeks.org/static-methods-vs-instance-methods-java/)
* **Call Stack Visualization:** [https://www.pythontutor.com/java.html](https://www.pythontutor.com/java.html)

### Practice Challenges

**Challenge 1: Student Grade System**
Create methods to calculate final grades, letter grades, and GPA for multiple students.

**Challenge 2: Text Analyzer**
Create a utility class with static methods to analyze text: count characters, words, sentences, and calculate reading time.

**Challenge 3: Simple Game**
Create a number guessing game with methods for: generating random numbers, checking guesses, providing hints, and tracking score.

---

**Congratulations!** You've completed the Java Methods Lab.

Practice these concepts, and you'll be writing clean, modular Java code in no time!
