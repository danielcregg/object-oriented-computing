# Java Polymorphism Lab

> **Setup note:** this lab's package (`ie.atu.polymorphism`) and a runnable `Main.java` already exist in this folder — skip any “create the package” setup steps and write your classes right here, beside this README.
## Table of Contents
1. [Runtime Polymorphism: Understanding "Many Forms"](#1-runtime-polymorphism-understanding-many-forms)
2. [Compile-time Polymorphism (Method Overloading)](#2-compile-time-polymorphism-method-overloading)
3. [Reference Type Conversions](#3-reference-type-conversions)
4. [Heterogeneous Collections](#4-heterogeneous-collections)

## Lab Setup
1. Create a package called `ie.atu.polymorphism`
2. Create a `Main` class inside this package
3. Place all the below classes from the DIY sections into this package

## 1. Runtime Polymorphism: Understanding "Many Forms"

### Learning Objective
Understand how polymorphism allows objects to take different forms at runtime through method overriding.

### Explanation
The word "polymorphism" comes from Greek, meaning "many forms." In Java, this concept allows us to write methods that can work differently depending on the type of object that uses them. Think of it like a universal remote control - while the "volume up" button does the same basic job (increase volume), it works slightly differently for each device it controls.

Before we dive deeper, let's understand what makes a method unique - it's `signature`. A method signature consists of the method name and its parameter types (in order). For example, these two methods have different signatures even though they share the same name:
```java
public void displayInfo(String name) {
    System.out.println("Name: " + name);
}

public void displayInfo(String name, int age) {
    System.out.println("Name: " + name + ", Age: " + age);
}
```
In runtime polymorphism, we often override methods that have the exact same signature in the child class. When you override a method, you're saying "I want to provide my own version of this behavior while keeping the same signature." Think of it like a universal remote control - while the "volume up" button does the same basic job (increase volume), it works slightly differently for each device it controls.

Let's see this in action with a simple example using shapes.

```java
public class Shape {
    private String color;
    
    public Shape(String color) {
        this.color = color;
    }
    
    public String getColor() {
        return color;
    }
    
    public void draw() {
        System.out.println("Drawing a shape in " + color);
    }
    
    public double getArea() {
        return 0.0;  // Base implementation
    }
}
```
```java
public class Circle extends Shape {
    private double radius;
    
    public Circle(String color, double radius) {
        super(color);
        this.radius = radius;
    }
    
    @Override
    public void draw() {
        System.out.println("Drawing a " + getColor() + " circle with radius " + radius);
    }
    
    @Override
    public double getArea() {
        return Math.PI * radius * radius;
    }
}
```
```java
public class Rectangle extends Shape {
    private double width;
    private double height;
    
    public Rectangle(String color, double width, double height) {
        super(color);
        this.width = width;
        this.height = height;
    }
    
    @Override
    public void draw() {
        System.out.println("Drawing a " + getColor() + " rectangle " + width + "x" + height);
    }
    
    @Override
    public double getArea() {
        return width * height;
    }
}
```
```java
public class Main {
    public static void main(String[] args) {
        // Create some shapes
        Shape circle = new Circle("red", 5.0);
        Shape rectangle = new Rectangle("blue", 4.0, 6.0);
        
        // Demonstrate method overriding
        circle.draw();      // Will call Circle's draw method
        rectangle.draw();   // Will call Rectangle's draw method
        
        // Demonstrate polymorphic method calls
        System.out.println("Circle area: " + circle.getArea());
        System.out.println("Rectangle area: " + rectangle.getArea());
    }
}
```

### Key Concepts Illustrated
1. Method Overriding: Both Circle and Rectangle provide their own versions of draw() and getArea()
2. Runtime Behavior: The correct method version is called based on the actual object type
3. Common Interface: Both shapes can be treated as Shape references but maintain their specific behaviors
4. Parent Class Reference: We can store a Circle or Rectangle in a Shape variable

### DIY Exercise: Basic Shapes
Create a simple shape hierarchy that demonstrates method overriding:

1. Create a base Shape class with:
   - A color property
   - Methods: getPerimeter() and describe()

2. Create two subclasses:
   - Square
   - Circle

3. In each subclass:
   - Override getPerimeter() to calculate the correct perimeter
   - Override describe() to print shape-specific information

4. Create a main program that:
   - Creates instances of your shapes
   - Calls methods on them to demonstrate overriding

## 2. Compile-time Polymorphism (Method Overloading)

### Learning Objective
Understand method overloading as a form of compile-time polymorphism, including how method signatures work and how the compiler resolves method calls.

### Explanation
Method overloading occurs when we create multiple methods in the same class with the same name but different parameter lists. The compiler determines which version of the method to call based on the method signature. Think of it like having multiple doors to the same room - while the destination (method name) is the same, how you get there (parameters) can be different.

A method signature includes:
- Method name
- Number of parameters
- Type of parameters
- Order of parameters

Note: Return type and parameter names are NOT part of the method signature.

### Example

```java
public class Calculator {
    // Basic integer addition
    public int add(int x, int y) {
        System.out.println("Adding two integers");
        return x + y;
    }
    
    // Three parameter addition
    public int add(int x, int y, int z) {
        System.out.println("Adding three integers");
        return x + y + z;
    }
    
    // Double addition
    public double add(double x, double y) {
        System.out.println("Adding two doubles");
        return x + y;
    }
    
    // String concatenation
    public String add(String x, String y) {
        System.out.println("Concatenating strings");
        return x + y;
    }
    
    // Mixed parameter types
    public double add(int x, double y) {
        System.out.println("Adding integer and double");
        return x + y;
    }
}
```

```java
public class Main {
    public static void main(String[] args) {
        Calculator calc = new Calculator();
        
        // The compiler chooses the correct method based on arguments
        int sum1 = calc.add(5, 3);                    // Calls first method
        int sum2 = calc.add(5, 3, 2);                 // Calls second method
        double sum3 = calc.add(5.5, 3.5);             // Calls third method
        String result = calc.add("Hello ", "World");   // Calls fourth method
        double sum4 = calc.add(5, 3.5);               // Calls fifth method
        
        // This won't compile - no matching signature
        // calc.add("Hello", 5);
    }
}
```

### Why This is Compile-time Polymorphism
The term "compile-time" comes from when the decision about which method to call is made. The compiler looks at:
1. The method name
2. The arguments provided in the call
3. The available method signatures

Based on this information, it determines at compile time (before the program runs) which method should be called. If no matching method is found, you'll get a compilation error.

### DIY Exercise: Shop Price Calculator

Create a price calculator for a small shop that needs to handle various types of discounts. Your calculator should help the shop owner quickly determine final prices after applying different combinations of discounts.

Create a PriceCalculator class with these overloaded methods:

1. Create methods to calculate prices in different scenarios:
   * calculatePrice(double basePrice) - returns the regular price with no discount
   * calculatePrice(double basePrice, double discountPercent) - returns price after applying a percentage discount
   * calculatePrice(double basePrice, boolean hasStudentId) - returns price with student discount ($5 off with valid ID)
   * calculatePrice(double basePrice, double discountPercent, boolean hasStudentId) - returns price with both percentage and student discounts applied

2. In your main method:
   * Create a test case with an item priced at $50.00
   * Show how the price changes with:
     - No discount
     - 10% discount
     - Student discount
     - Both 10% discount and student discount
   * Print all results clearly showing which discount was applied

This exercise will help you understand how method overloading can solve real business problems by handling different discount scenarios with clearly named methods.

## 3. Reference Type Conversions

### Learning Objective
Understand how objects can be referenced through different types in the inheritance hierarchy and how to safely convert between these types.

### Explanation
In Java, an object can be referenced through its own class type or any of its parent class types. This is like how a Square can always be referred to as a Shape - it's still a Square, but we're choosing to view it more generally. This ability to reference objects through different types is fundamental to polymorphism and comes in two forms: upcasting and downcasting.

### Example

```java
public class Vehicle {
    private String model;
    
    public Vehicle(String model) {
        this.model = model;
    }
    
    public String getModel() {
        return model;
    }
    
    public void startEngine() {
        System.out.println("Starting engine of " + model);
    }
}
```
```java
public class Car extends Vehicle {
    private int numberOfDoors;
    
    public Car(String model, int numberOfDoors) {
        super(model);
        this.numberOfDoors = numberOfDoors;
    }
    
    public void drive() {
        System.out.println(getModel() + " is driving smoothly on the road");
    }
    
    @Override
    public void startEngine() {
        System.out.println("Starting " + numberOfDoors + "-door " + getModel() + " with key fob");
    }
}
```
```java
public class Main {
    public static void main(String[] args) {
        // Upcasting - implicit (automatic) conversion
        Car car = new Car("Toyota Camry", 4);
        Vehicle vehicle = car;  // Upcasting happens automatically
        
        // Both call Car's version of startEngine
        car.startEngine();      // Calls Car's method
        vehicle.startEngine();   // Also calls Car's method
        
        // This works fine - calling through Car reference
        car.drive();
        
        // This won't compile - Vehicle reference doesn't know about drive()
        // vehicle.drive();  // Compilation error!
        
        // Safe downcasting using instanceof
        if (vehicle instanceof Car) {
            Car downcasted = (Car) vehicle;  // Explicit casting
            downcasted.drive();              // Now we can call Car-specific methods
        }
        
        // Example of unsafe downcasting
        Vehicle genericVehicle = new Vehicle("Generic Vehicle");
        
        // This would compile but throw a ClassCastException at runtime!
        // Car wrongCast = (Car) genericVehicle;
        
        // Proper way to prevent runtime errors
        if (genericVehicle instanceof Car) {
            Car safeCast = (Car) genericVehicle;  // This block won't execute
        } else {
            System.out.println("Not a Car - casting prevented!");
        }
    }
}
```

### Key Concepts
1. Upcasting (Widening):
   - Converting from a more specific type to a more general type
   - Always safe and happens automatically
   - Might lose access to specific methods
   - Example: Car to Vehicle

2. Downcasting (Narrowing):
   - Converting from a more general type to a more specific type
   - Requires explicit casting
   - Can cause runtime errors if not done carefully
   - Should always use instanceof to check first
   - Example: Vehicle to Car

### DIY Exercise: Shape Type Conversion
Create a program that demonstrates type conversions with shapes:

1. Create these classes:
   - Shape (base class with getArea())
   - Circle (with radius and getCircumference())
   - Square (with side and getDiagonal())

2. Demonstrate:
   - Upcasting from Circle and Square to Shape
   - Safe downcasting using instanceof
   - What happens when attempting unsafe downcasting
   - How method overriding works with different reference types

## 4. Heterogeneous Collections

### Learning Objective
Learn how polymorphism enables us to work with collections containing different types of objects that share a common parent class.

### Example: Animal Kingdom

```java
public class Animal {
    protected String name;
    protected int age;
    
    public Animal(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    public void makeSound() {
        System.out.println(name + " makes a sound");
    }
    
    public void move() {
        System.out.println(name + " moves around");
    }
    
    public String getInfo() {
        return name + " (" + age + " years old)";
    }
}
```

```java
public class Dog extends Animal {
    private String breed;
    
    public Dog(String name, int age, String breed) {
        super(name, age);
        this.breed = breed;
    }
    
    @Override
    public void makeSound() {
        System.out.println(name + " barks: Woof! Woof!");
    }
    
    @Override
    public void move() {
        System.out.println(name + " runs on four legs");
    }
    
    public void fetch() {
        System.out.println(name + " the " + breed + " fetches the ball");
    }
}
```

```java
public class Cat extends Animal {
    private boolean isIndoor;
    
    public Cat(String name, int age, boolean isIndoor) {
        super(name, age);
        this.isIndoor = isIndoor;
    }
    
    @Override
    public void makeSound() {
        System.out.println(name + " meows: Meow!");
    }
    
    @Override
    public void move() {
        System.out.println(name + " prowls gracefully");
    }
    
    public void scratch() {
        System.out.println(name + " scratches the " + 
            (isIndoor ? "furniture" : "tree"));
    }
}
```

```java
public class Bird extends Animal {
    private double wingspan;
    
    public Bird(String name, int age, double wingspan) {
        super(name, age);
        this.wingspan = wingspan;
    }
    
    @Override
    public void makeSound() {
        System.out.println(name + " chirps: Tweet! Tweet!");
    }
    
    @Override
    public void move() {
        System.out.println(name + " flies with its " + wingspan + "cm wingspan");
    }
    
    public void soar() {
        System.out.println(name + " soars high in the sky");
    }
}
```

```java
public class AnimalShelter {
    private List<Animal> animals;
    
    public AnimalShelter() {
        this.animals = new ArrayList<>();
    }
    
    public void addAnimal(Animal animal) {
        animals.add(animal);
    }
    
    public void makeAllSounds() {
        System.out.println("\nAll animals making sounds:");
        for (Animal animal : animals) {
            animal.makeSound();
        }
    }
    
    public void exerciseAnimals() {
        System.out.println("\nExercising all animals:");
        for (Animal animal : animals) {
            // Common behavior
            animal.move();
            
            // Type-specific behavior
            if (animal instanceof Dog) {
                ((Dog) animal).fetch();
            } else if (animal instanceof Cat) {
                ((Cat) animal).scratch();
            } else if (animal instanceof Bird) {
                ((Bird) animal).soar();
            }
            
            System.out.println("---------------");
        }
    }
}
```

```java
public class Main {
    public static void main(String[] args) {
        AnimalShelter shelter = new AnimalShelter();
        
        // Adding different types of animals
        shelter.addAnimal(new Dog("Buddy", 5, "Golden Retriever"));
        shelter.addAnimal(new Cat("Whiskers", 3, true));
        shelter.addAnimal(new Bird("Tweety", 1, 15.5));
        shelter.addAnimal(new Dog("Rex", 7, "German Shepherd"));
        
        // Demonstrate common behaviors
        shelter.makeAllSounds();
        
        // Demonstrate type-specific behaviors
        shelter.exerciseAnimals();
    }
}
```

### Key Benefits of Heterogeneous Collections
1. Single Collection Type: Store different but related objects in one collection
2. Unified Processing: Handle different types uniformly when needed
3. Type-Specific Operations: Still possible through instanceof and casting
4. Flexibility: Easy to add new animal types without changing existing code
5. Code Organization: Common behaviors in parent class, specific in subclasses

### DIY Exercise: Shape Type Conversion
1. Add a fourth animal class
2. Add the new animal to the shelter
3. Add a method to the AnimalShelter class to print all animal breeds and names

## Summary
Through these examples and exercises, we've seen how polymorphism:
- Enables more flexible and reusable code
- Simplifies program structure and maintenance
- Allows uniform treatment of different objects
- Facilitates easy extension through new subclasses
- Promotes better code organization

These benefits make polymorphism a fundamental concept in object-oriented programming, essential for creating maintainable and scalable applications.

End of Lab
---
