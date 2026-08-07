---
title: "Lab: Encapsulation"
week: 7
topic: encapsulation
type: lab
source: "DanielCreggOrganization/ooc-lab-encapsulation-template README.md (synced 2026-08-07)"
---

# Week 7 Lab — Encapsulation

> **GitHub Classroom assignment:** REDACTED
> **Starter repo (canonical instructions):** https://github.com/DanielCreggOrganization/ooc-lab-encapsulation-template
> **Worked solutions:** https://github.com/danielcregg/REDACTED/tree/master/src/ie/atu/encapsulation
>
> The section below is a synced snapshot of the starter repo's README —
> the instructions students receive. If you edit it here, push the same
> change to the starter repo.

---

# Java Encapsulation Lab

## Introduction to Encapsulation

**Encapsulation** is one of the four fundamental principles of Object-Oriented Programming (OOP), alongside inheritance, polymorphism, and abstraction. It is the practice of bundling data (fields) and the methods that operate on that data within a single unit (a class), while restricting direct access to some of the object's components.

Think of encapsulation like a capsule or protective shell around your data. Just as you can't directly access the medicine inside a pill capsule without breaking it open, you shouldn't be able to directly access an object's internal data without going through its controlled interface.

**Why is Encapsulation Important?**

1. **Data Protection**: Prevents external code from accidentally or maliciously corrupting an object's state
2. **Flexibility**: Allows you to change internal implementation without affecting code that uses your class
3. **Maintainability**: Makes code easier to understand and modify by clearly defining what's internal vs. external
4. **Validation**: Enables you to ensure data remains valid throughout an object's lifetime

In this lab, you'll learn the building blocks of encapsulation through hands-on exercises that demonstrate how to properly protect and manage your object's data.

## Table of Contents
1. [Lab Setup](#1-lab-setup)
2. [Access Modifiers](#2-access-modifiers)
3. [Data Hiding](#3-data-hiding)
4. [Getters and Setters](#4-getters-and-setters)
5. [Data Validation](#5-data-validation)

## 1. Lab Setup
1. Create a package called `ie.atu.encapsulation`
2. Create a `Main` class inside this package
3. Create a `main` method inside this `Main` class
4. Place all the classes from the below DIY sections into this package. Use the `main` method in the `Main` class to run them. 

## 2. Access Modifiers

### Learning Objective
Understand how access modifiers control visibility of class members and see firsthand how the `public` and `private` keywords affect what you can access from outside a class.

### Explanation
Access modifiers are keywords that set the accessibility level of classes, methods, and fields. The two most common access modifiers are:
- **public**: The member is accessible from anywhere in your program
- **private**: The member is only accessible within the same class

When you use the dot operator (`.`) on an object we create in the `main` method in VS Code, IntelliSense shows you a list of all the members you can access. This is a powerful visual demonstration of encapsulation in action - when you make a field private, it disappears from the list of accessible members.

### Example: The Problem with Public Fields
```java
public class BankAccount {
    public double balance;  // Public - accessible from anywhere!
    
    public BankAccount(double initialBalance) {
        balance = initialBalance;
    }
}
```

### What Can Go Wrong?
When fields are public, anyone can modify them directly, potentially breaking business rules:

```java
public class Main {
    public static void main(String[] args) {
        BankAccount account = new BankAccount(1000.00);
        
        // This should NOT be allowed, but it is!
        account.balance = -500.00;  // Negative balance! - Not Allowed in this case
        
        System.out.println("Balance: " + account.balance);
    }
}
```

### The Solution: Private Fields
```java
public class BankAccount {
    private double balance;  // Private - only accessible within this class
    
    public BankAccount(double initialBalance) {
        balance = initialBalance;
    }
    
    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
        }
    }
    
    public double getBalance() {
        return balance;
    }
}
```

### Visual Representation
```mermaid
graph LR
    A[Main Class] -->|public balance| B[Can Access Directly]
    A -->|private balance| C[Cannot Access Directly]
    A -->|public methods| D[Must Use Methods]
    D -->|Controlled Access| E[private balance]
```

### DIY Exercise: Access Modifier Demonstration

**Part 1: Public Field Problems**
1. Create a `Student` class with the following **public** fields:
   - `name` (String)
   - `studentId` (int)
   - `gpa` (double)

2. Add a constructor that accepts all three parameters

3. In your `Main` class:
   - Create a `Student` object
   - Type `student.` and observe the autocomplete list in VS Code
   - Notice that all fields appear in the list
   - Set invalid values directly:
     ```java
     student.studentId = -1;  // Invalid ID
     student.gpa = 5.5;        // GPA above 4.0
     ```

**Part 2: Fixing with Private Fields**
1. Change all fields in the `Student` class to **private**

4. In your `Main` class:
   - Type `student.` again and observe the autocomplete list
   - Notice the fields are now gone from the list!
   - Try to access `student.name` directly - you'll get a compilation error

**Expected Observation:**
When you type `student.` in VS Code:
- **With public fields**: You see `name`, `studentId`, `gpa`, constructor, etc.
- **With private fields**:  `name`, `studentId` and `gpa` will have dissapeared from the list and are inaccessible. 

The private fields have "disappeared" from outside access! Later we will show how to create public **getter** and **setter** methods that will provide access to these private instance varibales.  

### Key Takeaway
The disappearance of private members from the autocomplete list is not just a convenience feature - it's the IDE enforcing Java's encapsulation rules. If you can't see it in the list, you can't access it directly. This is encapsulation protecting your data.

## 3. Data Hiding

### Learning Objective
Learn how to hide data using private access modifiers and understand why it's important for building robust applications.

### Explanation
Data hiding is the fundamental concept of encapsulation where we restrict direct access to certain components of an object, typically by making fields private. This protection prevents unauthorized access to internal data and helps maintain the object's state consistency. By controlling access to our object's data, we can ensure that the object's state is always valid and can't be corrupted by external code.

Now that you've seen how access modifiers work in Section 1, this section reinforces why we consistently make fields private and only expose what's necessary through public methods.

### Example
```java
public class Counter {
    private int count; // Private field - cannot be accessed directly from outside
    
    public void increment() {
        count++;
    }
    
    public void displayCount() {
        System.out.println("Current count: " + count);
    }
}
```

### Visual Representation
```mermaid
graph TD
    A[External Code] -->|Cannot Access| B[private count]
    A -->|Can Access| C[public methods]
    C -->|Can Access| B
```

### DIY Exercise: Secret Message
Create a `SecretMessage` class that:  
- Has a private String field to store a message. 
- Has a public method to display the message
- Create a `SecretMessage` object in the `Main` class
- Try and call the message field directly using the dot operator (you should get a compilation error)
- Print the message to the console using the public method

**Expected Output:**
```
The secret message is: Hello, Encapsulation!
```

**Expected Compilation Error (when trying to access the private field):**
```
error: message has private access in SecretMessage
```

## 4. Getters and Setters

### Learning Objective
Learn how to provide controlled access to private fields using getter and setter methods.

### Explanation
While private fields prevent direct access, we often need controlled ways to read and modify their values through getter and setter methods. Getter methods allow read access to private fields while maintaining encapsulation, and setter methods provide a way to modify private fields with proper validation. This approach gives us the flexibility to change how we store and validate data without affecting code that uses our class.

This is the standard way to expose private data: create a protective layer of public methods that control how the data can be accessed and modified.

### Example
```java
public class Person {
    private String name;
    
    // Getter method
    public String getName() {
        return name;
    }
    
    // Setter method
    public void setName(String name) {
        this.name = name;
    }
}
```

### Visual Representation
```mermaid
sequenceDiagram
    External Code->>+Person: setName("John")
    Person->>-Person: name = "John"
    External Code->>+Person: getName()
    Person-->>-External Code: "John"
```

### DIY Exercise: Temperature Converter
Create a `Temperature` class that:
- Stores a temperature in a private double instance variable named `celsius`
- Provides a getter method for `celsius`
- Provides a setter method that accepts celsius values

Test your class in the `Main` method by:
- Creating a `Temperature` object
- Setting a temperature value using the setter
- Reading the temperature value using the getter
- Printing the result to the console

**Expected Output:**
```
Temperature: 25.0°C
```

**Example Test Code:**
```java
Temperature temp = new Temperature();
temp.setCelsius(25.0);
System.out.println("Temperature: " + temp.getCelsius() + "°C");
```

## 5. Data Validation

### Learning Objective
Understand how to validate data both in setter methods and constructors, and how to reuse validation logic effectively with helper methods.

### Explanation
Validation ensures that the data inside an object remains correct and meaningful. When encapsulating data, validation can occur in different stages of an object's lifecycle:
 - **Constructor validation** ensures that objects are created in a valid state from the beginning.
 - **Setter validation** ensures only valid data is stored when fields are modified after object creation.

This is where encapsulation truly shines - by controlling access through methods, we can ensure data is always valid before it's stored.

### Example 1: Validation logic in a constructor and setter (Code Duplication)
```java
public class Student {
    private int age;

    // Constructor with validation logic
    public Student(int age) {
        if (age < 16 || age > 100) {
            System.out.println("Invalid age input: must be between 16 and 100 inclusive. Age set to 16.");
            return 16; // If invalid input is recieved we must return a valid age keep the object state valid.
        }
        return age;
    }

    // Setter with validation logic
    public void setAge(int age) {
        if (age < 16 || age > 100) {
            System.out.println("Invalid age input: must be between 16 and 100 inclusive. Age set to 16.");
            return 16; // If invalid input is recieved we must return a valid age keep the object state valid.
        }
        return age;
    }
    
    public int getAge() {
        return age;
    }
} 
```

**Problem**: Notice how the validation logic is duplicated in both the constructor and setter. This violates the DRY (Don't Repeat Yourself) principle.

### Example 2: Using Validation Helpers (Best Practice)

Using helper methods avoids duplication of validation logic between constructors and setters, improving maintainability and reducing bugs.  

```java
public class Student {
    private int age;

    /* Constructor is a kind of setter too. It initially sets the value of object fields. It too
       can use the same validation as the setter method */  
    public Student(int age) {
        this.age = validateAge(age);
    }
    
    public void setAge(int age) {
        this.age = validateAge(age);
    }

    // Private internal validation method just usable in this class by the constructor and the setter  
    private int validateAge(int age) {
        if (age < 16 || age > 100) {
            System.out.println("Invalid age input: must be between 16 and 100 inclusive. Age set to 16.");
            return 16; // If invalid input is recieved we must return a valid age keep the object state valid.
        }
        return age;
    }
    
    public int getAge() {
        return age;
    }
}
```

### Visual Representation
```mermaid
graph TD
    A[Input Data] -->|Validate| B{Valid?}
    B -->|Yes| C[Update Field]
    B -->|No| D[Print Error]
    
    E[Constructor/Setter] -->|Uses| F[Validation Helper]
    F -->|Valid| G[Update Field]
    F -->|Invalid| H[Print Error]
```

### DIY Exercise: Grade Book
Create a `Grade` class that:
1. Has these private fields:
   - studentName (String)
   - numericGrade (int)
   - courseCode (String)

2. Implements these validation helper methods:
   - `validateStudentName(String name)` - Returns the name if not empty, otherwise returns "Unknown" and prints an error
   - `validateGrade(int grade)` - Returns the grade if within range (0-100), otherwise returns 0 and prints an error
   - `validateCourseCode(String code)` - Returns the code if it matches a pattern like "CS101" (2-3 letters followed by 3 digits), otherwise returns "UNKNOWN" and prints an error

3. Uses the helpers in both:
   - Constructor (which should accept all three parameters)
   - Setter methods

4. Provides getter methods for all fields

Example structure:
```java
public class Grade {
    private String studentName;
    private int numericGrade;
    private String courseCode;

    // TODO: Add constructor that uses validation helpers

    // TODO: Add getters for all fields

    // TODO: Add setters that use validation helpers

    // TODO: Add validation helper methods (private)
}
```

Test your `Grade` class in `Main` by:
- Creating a valid `Grade` object
- Creating an invalid `Grade` object (with a grade of 150)
- Using setters to try setting invalid values
- Using getters to display the current state

**Expected Output:**
```
=== Valid Grade ===
Student: John Doe
Grade: 85
Course: CS101

=== Invalid Grade (150) ===
Invalid grade: must be between 0 and 100. Grade set to 0.
Student: Jane Smith
Grade: 0
Course: MATH201

=== Testing Invalid Setters ===
Invalid student name: cannot be empty. Name set to "Unknown".
Invalid grade: must be between 0 and 100. Grade set to 0.
Invalid course code format. Code set to "UNKNOWN".
Student: Unknown
Grade: 0
Course: UNKNOWN
```

**Example Test Code:**
```java
// Valid grade
Grade grade1 = new Grade("John Doe", 85, "CS101");
System.out.println("=== Valid Grade ===");
System.out.println("Student: " + grade1.getStudentName());
System.out.println("Grade: " + grade1.getNumericGrade());
System.out.println("Course: " + grade1.getCourseCode());

// Invalid grade (150)
System.out.println("\n=== Invalid Grade (150) ===");
Grade grade2 = new Grade("Jane Smith", 150, "MATH201");
System.out.println("Student: " + grade2.getStudentName());
System.out.println("Grade: " + grade2.getNumericGrade());
System.out.println("Course: " + grade2.getCourseCode());

// Testing invalid setters
System.out.println("\n=== Testing Invalid Setters ===");
Grade grade3 = new Grade("Bob Jones", 75, "ENG202");
grade3.setStudentName("");
grade3.setNumericGrade(-50);
grade3.setCourseCode("INVALID");
System.out.println("Student: " + grade3.getStudentName());
System.out.println("Grade: " + grade3.getNumericGrade());
System.out.println("Course: " + grade3.getCourseCode());
```

## Summary
This lab covered the essential concepts of encapsulation in Java:
1. **Access modifiers** and their effect on visibility - seeing how `public` and `private` control what can be accessed
2. **Data hiding** using private fields - understanding why we protect our data
3. **Controlled access** through getters and setters - learning how to safely expose data
4. **Data validation** for maintaining integrity - ensuring data remains valid throughout an object's lifecycle

By mastering these concepts, you can write more robust, maintainable, and secure Java applications. Encapsulation is not just a good practice - it's essential for professional software development.

## Further Reading
- [Ask ChatGPT about Java Encapsulation](https://chatgpt.com/?q=Give+me+a+general+overview+of+Java+encapsulation+including+what+it+is%2C+why+it%27s+important%2C+and+key+concepts+like+access+modifiers%2C+getters%2Fsetters%2C+and+data+validation)
- Java Documentation: [Access Control](https://docs.oracle.com/javase/tutorial/java/javaOO/accesscontrol.html)
- Book: Effective Java by Joshua Bloch (Chapter 4: Classes and Interfaces)
- Book: Clean Code by Robert C. Martin (Chapter 6: Objects and Data Structures)
