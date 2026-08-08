# Java Inheritance Lab

## What you'll learn

By the end of this lab you will be able to:

- Explain inheritance and the "Is-A" relationship, and use `extends` to let one class acquire the fields and methods of another
- Describe a class hierarchy using the core terminology: superclass (parent class) and subclass (child class)
- Recognise single, multilevel and hierarchical inheritance, and explain why Java does not support multiple inheritance of classes
- Explain the role of `Object` as the root superclass that every Java class implicitly inherits from
- Initialise inherited state correctly by chaining constructors with the `super` keyword

## Table of Contents

1. [Definition and Basics of Inheritance](#1-definition-and-basics-of-inheritance)
2. [Terminology](#2-terminology)
3. [Types of Inheritance](#3-types-of-inheritance)
4. [The Object Class](#4-the-object-class)
5. [Constructors in Inheritance](#5-constructors-in-inheritance)

## Getting started

This lab lives in the package `ie.atu.inheritance` — this folder. A runnable `Main.java` is already here: open this folder in VS Code or your Codespace, click ▶ on `Main.java` to check your setup works, then write each exercise's classes beside it in the same package.

## 1. Definition and Basics of Inheritance

### Explanation

Inheritance is a fundamental principle in object-oriented programming (OOP) that allows a new class (subclass) to inherit properties and methods from an existing class (superclass). This promotes code reusability and logical organisation of classes. The subclass inherits characteristics (fields and methods) from the superclass, allowing you to create specialised classes based on more general ones.

An **"Is-A"** relationship is established between the subclass and superclass. For example, an Employee is a Person; hence, Employee can inherit from Person.

### Example

```java
public class Person {
    private String name;

    public String getName() { 
        return name; 
    }

    public void setName(String name) { 
        this.name = name; 
    }
}

public class Employee extends Person {
    private int employeeId;

    public int getEmployeeId() { 
        return employeeId; 
    }

    public void setEmployeeId(int id) { 
        this.employeeId = id; 
    }
}

// Example usage (e.g. in `Main.java`)
public static void main(String[] args) {
    Employee e = new Employee();
    e.setName("Alice");
    e.setEmployeeId(123);
    System.out.println("Employee: " + e.getName() + ", ID: " + e.getEmployeeId());
}
```

### Visual Representation

```mermaid
classDiagram
    Person <|-- Employee
    class Person {
        - String name
        + getName() String
        + setName(name: String) void
    }
    class Employee {
        - int employeeId
        + getEmployeeId() int
        + setEmployeeId(id: int) void
    }
```

### DIY 1: Animals

1. Create an `Animal` class in this package with:
   - A `private` field `species` (String).
   - Getter and setter methods for the `species` field.
2. Create a `Dog` class that `extends` (i.e. inherits from) `Animal`, with:
   - A `private` field `name` (String).
   - Getter and setter methods for the `name` field.
3. In `Main`, create an instance of `Dog`, call `setSpecies()` and `setName()`, then print both values to the terminal using `getSpecies()` and `getName()`.

**Expected output**

```text
Species: Canine
Name: Rex
```

(Sample values shown — use any species and name you like.)

<details><summary>Hint</summary>

Only `Dog` needs the `extends` keyword — it picks up `species` and its getter and setter from `Animal` automatically. Suggested design:

```mermaid
classDiagram
    Animal <|-- Dog
    class Animal {
        - String species
        + getSpecies() String
        + setSpecies(species: String) void
    }
    class Dog {
        - String name
        + getName() String
        + setName(name: String) void
    }
```

</details>

## 2. Terminology

### Explanation

- **Superclass (Parent Class):** The class from which properties and methods are inherited. It represents a general concept.
- **Subclass (Child Class):** The class that inherits from the superclass. It represents a specialised version of the superclass.

Inheritance establishes a hierarchy between classes, where the subclass extends the functionality of the superclass.

### DIY 2: Vehicles

1. **Superclass:** create a class `Vehicle` with a method `move()` that prints "The vehicle is moving."
2. **Subclass:** create a class `Car` that extends `Vehicle` and adds a method `playRadio()` that prints "Playing radio."
3. In `Main`, create an instance of `Car` and call both `move()` and `playRadio()` on it.

**Expected output**

```text
The vehicle is moving.
Playing radio.
```

<details><summary>Hint</summary>

`Car` never declares `move()`, yet a `Car` object can call it — that is inheritance at work. Suggested design:

```mermaid
classDiagram
    Vehicle <|-- Car
    class Vehicle {
        + move()
    }
    class Car {
        + playRadio()
    }
```

</details>

## 3. Types of Inheritance

### Explanation and Examples

#### 1. Single Inheritance
One class inherits from one superclass.

```java
public class Vehicle {
    public void move() {
        System.out.println("Vehicle moves");
    }
}

public class Car extends Vehicle {
    public void honk() {
        System.out.println("Car honks");
    }
}
```

```mermaid
classDiagram
    Vehicle <|-- Car
    class Vehicle{
        +move()
    }
    class Car{
        +honk()
    }
```

#### 2. Multilevel Inheritance
Chain of inheritance where subclass becomes superclass for another class.

```java
public class Animal {
    public void eat() {
        System.out.println("Animal eats");
    }
}

public class Mammal extends Animal {
    public void breathe() {
        System.out.println("Mammal breathes");
    }
}

public class Dog extends Mammal {
    public void bark() {
        System.out.println("Dog barks");
    }
}
```

```mermaid
classDiagram
    Animal <|-- Mammal
    Mammal <|-- Dog
    class Animal{
        +eat()
    }
    class Mammal{
        +breathe()
    }
    class Dog{
        +bark()
    }
```

#### 3. Hierarchical Inheritance
Multiple classes inherit from one superclass.

```java
public class Shape {
    public void draw() {
        System.out.println("Drawing shape");
    }
}

public class Circle extends Shape {
    public void radius() {
        System.out.println("Has radius");
    }
}

public class Square extends Shape {
    public void sides() {
        System.out.println("Has four sides");
    }
}
```

```mermaid
classDiagram
    Shape <|-- Circle
    Shape <|-- Square
    class Shape{
        +draw()
    }
    class Circle{
        +radius()
    }
    class Square{
        +sides()
    }
```

#### 4. Multiple Inheritance (Not Supported in Java)
One class inheriting from multiple superclasses.

```mermaid
classDiagram
    ClassA <|-- ClassC
    ClassB <|-- ClassC
    class ClassA{
        +methodA()
    }
    class ClassB{
        +methodB()
    }
    class ClassC{
        +methodC()
    }
```

Java doesn't support multiple inheritance with classes to avoid:
1. Ambiguity when same method exists in multiple parent classes
2. Complexity in method resolution
3. Potential naming conflicts

Instead, Java provides interfaces for implementing multiple inheritance of behaviour.

### DIY 3: Electric Car

Create (or evolve from DIY 2) the classes listed below in this package, building a multilevel inheritance chain:

1. `Vehicle` (superclass):
   - Private field: `String type`.
   - Constructor: `Vehicle(String type)` to initialise `type`.
   - Getter and setter for `type`.
   - Method: `void move()` that prints a short message, e.g. "The <type> is moving".
2. `Car` (subclass of `Vehicle`):
   - Private field: `int doors`.
   - Constructor: `Car(String type, int doors)` which calls `super(type)`.
   - Getter and setter for `doors`.
   - Method: `void honk()` that prints a short message, e.g. "Beep!".
3. `ElectricCar` (subclass of `Car`):
   - Private field: `int batteryCapacity` (e.g. in kWh).
   - Constructor: `ElectricCar(String type, int doors, int batteryCapacity)` which calls `super(type, doors)`.
   - Getter and setter for `batteryCapacity`.
   - Method: `void charge()` that prints a short message, e.g. "Charging...".
4. In `Main`:
   - Create an instance of `ElectricCar` using the constructor.
   - Call `move()`, `honk()`, and `charge()` on the instance.
   - Use the getters to retrieve and print the `type`, `doors`, and `batteryCapacity` values.

Keep the method implementations simple — print statements are fine. The key skill here is using `extends` and `super(...)` correctly to pass values up the inheritance chain.

**Expected output**

```text
The electric car is moving
Beep!
Charging...
Type: electric car
Doors: 4
Battery capacity: 75 kWh
```

(Sample values — yours will match whatever you pass to the constructor.)

<details><summary>Hint</summary>

The first statement of each subclass constructor must be its `super(...)` call: `ElectricCar` hands `type` and `doors` up to `Car`, and `Car` hands `type` up to `Vehicle`. Each class initialises only its own field.

</details>

### DIY 4: Motorbike

Add a `Motorbike` class to the DIY 3 hierarchy to demonstrate hierarchical inheritance, where multiple subclasses share the same superclass:

1. Create `Motorbike` extending `Vehicle` (do **not** extend `Car`), with:
   - Private field: `boolean hasSidecar`.
   - Constructor: `Motorbike(String type, boolean hasSidecar)` which calls `super(type)`.
   - Getter and setter for `hasSidecar`.
   - Method: `void ride()` that prints a short message, e.g. "Riding the <type>", and indicates whether it has a sidecar.
2. In `Main`, create a `Motorbike` instance and call its methods (`move()`, `ride()`).
3. Use a `Vehicle` reference where appropriate (e.g. `Vehicle v = new Motorbike(...);`) and call `v.move()` — this demonstrates polymorphism: `Motorbike` and `Car` are both `Vehicle` instances.

This shows hierarchical inheritance: multiple subclasses (`Car`, `Motorbike`, etc.) can extend the same superclass (`Vehicle`). Together, DIY 3 and DIY 4 combine multilevel and hierarchical inheritance in one hierarchy — sometimes called hybrid inheritance.

**Expected output**

```text
The motorbike is moving
Riding the motorbike (no sidecar)
The motorbike is moving
```

(Exact wording will vary with your messages; the third line comes from calling `move()` through the `Vehicle` reference.)

<details><summary>Hint</summary>

Suggested design for the full hierarchy from DIY 3 and DIY 4:

```mermaid
classDiagram
    Vehicle <|-- Car
    Car <|-- ElectricCar
    Vehicle <|-- Motorbike
    class Vehicle {
        - String type
        + getType() String
        + setType(type: String) void
        + move()
    }
    class Car {
        - int doors
        + getDoors() int
        + setDoors(doors: int) void
        + honk()
    }
    class ElectricCar {
        - int batteryCapacity
        + getBatteryCapacity() int
        + setBatteryCapacity(capacity: int) void
        + charge()
    }
    class Motorbike {
        - boolean hasSidecar
        + hasSidecar() boolean
        + setHasSidecar(hasSidecar: boolean) void
        + ride()
    }
```

</details>

## 4. The Object Class

### Explanation

Every class in Java ultimately inherits from `Object` — it is the root superclass of the entire class hierarchy. Even when you write a class with no `extends` clause, it implicitly extends `Object`, which is why methods such as `toString()`, `equals()` and `hashCode()` are available on every object you create.

### Visual Representation

```mermaid
classDiagram
    Object <|-- Cat
    class Object{
        +toString()
        +equals(Object obj)
        +hashCode()
    }
    class Cat{
        // Cat's members
    }
```

### DIY 5: Implicit Inheritance

1. Create a class `Gadget` — do not specify a superclass.
2. In `Main`, create an instance of `Gadget` and print the result of calling `toString()` on it.
3. Type the variable name followed by a dot (`.`) and look at the list of methods your editor suggests — call one more method inherited from `Object` (e.g. `hashCode()`) and print its result.

**Expected output**

```text
ie.atu.inheritance.Gadget@7a81197d
2055281021
```

(The hex code and hash number will differ on your machine — they identify your particular object.)

<details><summary>Hint</summary>

You never wrote `toString()` or `hashCode()`, so where do they come from? Suggested design:

```mermaid
classDiagram
    Object <|-- Gadget
    class Gadget {
        + toString() String
    }
```

</details>

## 5. Constructors in Inheritance

### Explanation

In Java inheritance, constructors play a crucial role in object initialization. When you create an instance of a subclass:

1. The superclass constructor must be called first before the subclass constructor executes
2. If not explicitly called, Java automatically calls the no-argument constructor of the superclass
3. Use the `super()` keyword to call a specific superclass constructor
4. The `super()` call must be the first statement in the subclass constructor

Key points to remember:

- Every constructor must invoke a constructor from its superclass, either explicitly or implicitly
- If the superclass doesn't have a no-argument constructor, the subclass must explicitly call a superclass constructor using `super()`
- The `super` keyword can also be used to access superclass methods and fields

### Example

```java
public class Person {
    protected String name;

    public Person(String name) {
        this.name = name;
    }
}

public class Employee extends Person {
    private int employeeId;

    public Employee(String name, int employeeId) {
        super(name); // Call superclass constructor
        this.employeeId = employeeId;
    }
}
```

### Visual Representation

```mermaid
sequenceDiagram
    Main->>+Employee: new Employee("Alice", 123)
    Employee->>+Person: super("Alice")
    Person->>Person: Initialize name
    Person-->>-Employee: Control returns
    Employee->>Employee: Initialize employeeId
    Employee-->>-Main: Employee object created
```

### DIY 6: School Management

1. Create a `Person` class with:
   - Private fields: `name` (String) and `age` (int).
   - A constructor that initializes both fields.
   - Getters and setters for the fields.
2. Create a `Student` class that extends `Person` with:
   - A private field: `studentId` (String).
   - A constructor that initializes `name`, `age`, and `studentId`.
   - Getters and setters for its field.
3. In `Main`, create instances of both `Person` and `Student`, and print the details of both using the getter methods.

**Expected output**

```text
Person: Alice, Age: 30
Student: Bob, Age: 20, ID: S12345
```

(Sample values — print whichever details you passed to the constructors.)

<details><summary>Hint</summary>

`Student`'s constructor must start with `super(name, age)` so `Person` initialises its fields first. Suggested design:

```mermaid
classDiagram
    Person <|-- Student
    class Person {
        - String name
        - int age
        + getName() String
        + setName(name: String) void
        + getAge() int
        + setAge(age: int) void
    }
    class Student {
        - String studentId
        + getStudentId() String
        + setStudentId(id: String) void
    }
```

</details>

## Summary

In this lab you covered:

- Definition and Basics of Inheritance
- Terminology
- Types of Inheritance
- The Object Class
- Constructors in Inheritance

Happy coding! Remember to test your classes and understand how inheritance affects the behaviour and structure of your objects.
