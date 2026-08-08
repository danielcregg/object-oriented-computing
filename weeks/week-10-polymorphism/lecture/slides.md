---
marp: true
theme: ooc
paginate: true
title: "Polymorphism"
week: 10
topic: polymorphism
type: lecture
source: "Polymorphism.pptx"
---

<!-- _class: lead -->
<!-- _paginate: false -->

<span class="kicker">// week 10 · polymorphism · object-oriented computing</span>

# Polymorphism

Same call, `speak()` — different sound, depending on the object.

---

## Agenda

- The four pillars of OOP — where polymorphism fits
- What is Polymorphism?
- Types of Polymorphism
- Method Overloading & Method Overriding
- Object Upcasting and Downcasting
- Benefits of Polymorphism
- Summary & resources

---

## Four major principles of OOP

- Recall from week 7: OOP rests on 4 pillars — Encapsulation, Inheritance, Polymorphism, Abstraction.
- We've covered Encapsulation (week 7) and Inheritance (week 8) — this week we go deep on **Polymorphism**.

<!-- diagram source: img/diagram-four-pillars.mmd -->
![h:330 Four pillars of OOP](img/diagram-four-pillars.svg)

---

<!-- _class: split -->

<style scoped>
section.split { display: grid; grid-template-columns: 1fr 1fr; column-gap: 40px; align-content: start; }
section.split h2 { grid-column: 1 / -1; }
section.split ul { grid-column: 1; }
section.split p:has(img) { grid-column: 2; grid-row: 2; align-self: center; margin: 0; }
section.split img { max-height: 360px; object-fit: contain; }
</style>

## What is Polymorphism

- Polymorphism comes from the Greek word poly meaning “many” or “much” and morphē meaning “form” or  “shape”.
- Polymorphism is the capability of a method to do different things based on the object that it is acting upon.

![A statue of a person with a beard Description automatically generated](img/slide08-1.png)

---

## Types of Polymorphism

- Polymorphism is the ability of the same method call to be bound to different method bodies
- Binding refers to linking a method call to the method body that will run.
- Compile time Polymorphism known as static or early binding → **Overloading**
- Runtime Polymorphism known as dynamic or late binding → **Overriding**

<!-- diagram source: img/diagram-binding.mmd -->
![h:300 Types of polymorphism and binding](img/diagram-binding.svg)

---

## Method Structure (recap from week 3)

```java
public int max (int x, int y)
{
    if (x > y)
        return x;
    else
        return y;
}
```

- **modifier** — `public`
- **return-type** — `int`
- **method-name** — `max`
- **parameter-list** — `(int x, int y)`
- **body of the method** — the `{ }` block

---

## Method Signature

- A method signature is the method name and the number, type and order of its parameters.
- Java can uniquely identify methods based on their method signatures:
      - Number of parameters passed
      - Data type of parameters
      - Sequence of data type of parameters
- Example: `max(int, int)`
- A class cannot have two methods with the same signature.

---

## Compile time Polymorphism

- Compile time Polymorphism is polymorphism that is resolved during compile time i.e., binding of the method call to its definition happens at compile time.
- The compiler can decide which method to call just by looking at the method signature (number and type of parameters).
- Method Overloading is an example of compile time polymorphism.
- Same name, different signatures:
  - `void fun(int a)`
  - `void fun(int a, int b)`
  - `void fun(char a)`

---

## Method Overloading Example

- Method Overloading allows a class to have more than one method with the same name, as long as their signatures are different.

```java
public class Calculator {
    // Simple add method. Note it has two input parameters, int and double
    public double add(int a, double b) {
        return a + b; // Implicit type casting. Returns double
    }
    // Differs in number of parameters passed
    public double add(int a, double b, int c) {
        return a + b + c;
    }
}
```

---

## Method Overloading Example (continued)

<!-- no-compile -->
```java
public class Main {
    public static void main(String[] args) {
        // Creating Calculator Object
        Calculator calcObj1 = new Calculator();
        System.out.println(    calcObj1.add(10, 20.1)      );
        System.out.println(    calcObj1.add(10, 20.5, 30)  );
    }
}
```

---

## Runtime Polymorphism

- Runtime Polymorphism is polymorphism which is resolved at runtime i.e., it is implemented dynamically when a program being executed
- Java supports run-time polymorphism by dynamically dispatching methods at run time through Method Overriding i.e., method invocations are resolved at run time by the JVM and not at the compile time.
- Method Overriding is an example of runtime polymorphism
- Same signature, subclass supplies its own body:
  - `Base.fun(int a)`
  - `Derived.fun(int a)` — overrides it

---

## What is Method Overriding?

- Method Overriding allows us to declare a method in a subclass which has already been declared in a superclass.
- Method Overriding is done so that a subclass can provide its own implementation of a method which is already provided by the super class.
- The method in the superclass is called the Overridden Method and the method in subclass is called the Overriding Method.

---

## Method Overriding Example

```java
// Animal.java
package ie.atu.oop.polymorphism.overriding.animal;

public class Animal {
    public void sound() {
        System.out.println("Animal is making a sound");
    }
}

// Dog.java (same package)
public class Dog extends Animal {

    @Override
    public void sound() {
        System.out.println("Woof");
    }
}

// Cat.java (same package)
public class Cat extends Animal {

    @Override
    public void sound() {
        System.out.println("Meow");
    }
}
```

---

## Try It Yourself

- Exercise — write this code yourself:
- Create Human Class
- Create IrishPerson Class that inherits from Human
- Create FrenchPerson Class that inherits from Human
- Create speak() method for all
- Human speak method says “Nǐ hǎo”
- IrishPerson speak method says “Dia Dhuit”
- FrenchPerson speak method says “Bonjour”

---

## Overriding in Action

- Same call, `speak()` — each subclass overrides it to do something different:

| Object | `speak()` prints |
|---|---|
| `Cat` | "Meow!" |
| `Dog` | "Woof!" |
| `Tiger` | "Roar!" |

---

## Why Method Overriding has to be done at Runtime and not Compile time

- The exact method to call depends on the actual object created at runtime — not just the variable type.
- The compiler cannot know which object you will actually create.

<!-- no-compile -->
```java
Animal a = new Dog();
a.sound();
```

- At compile time → `a` is just an `Animal`
- At runtime → it becomes a `Dog`
- Only **during execution** can the program determine which `sound()` method to call.
- This is essential for: Inheritance, Interfaces, Real OOP behavior, and writing code that works for multiple object types.

---

<!-- _class: centered-table -->

## Difference between Overloading and Overriding

| Feature | Overloading | Overriding |
|---|---|---|
| Where | Same class | Superclass and subclass (inheritance) |
| Signature | Different — parameters differ | Identical — same name and parameters |
| Example | `void fun(int a)`<br>`void fun(int a, int b)`<br>`void fun(char a)` | `Base.fun(int a)`<br>`Derived.fun(int a)` — overrides it |

---

## Objects: Upcasting & Downcasting

- Upcasting (Widening)
  - Subclass → Superclass
  - Safe, automatic.
- Downcasting (Narrowing)
  - Superclass → Subclass
  - Explicit cast required, can fail at runtime.

<!-- diagram source: img/diagram-casting.mmd -->
![h:260 Upcasting and downcasting between Cat and Animal](img/diagram-casting.svg)

---

## Objects: Upcasting & Downcasting (continued)

<!-- no-compile -->
```java
Cat c = new Cat();
Animal a = c;  // upcasting, automatic
```

Why safe? Because every `Cat` IS an `Animal`.

<!-- no-compile -->
```java
Animal a = new Cat();
Cat c = (Cat) a;  // downcasting, safe
```

Dangerous example — will throw `ClassCastException`:

<!-- no-compile -->
```java
Animal a = new Animal();
Cat c = (Cat) a; // will crash at runtime
```

---

## Why Upcasting Is Useful (Arrays / Lists / Polymorphism)

<style scoped>
section pre { padding: 12px 16px; margin: 8px 0; }
section pre code { font-size: 17px; line-height: 1.3; }
</style>

- Upcasting allows you to store different subclasses inside a single array or list of the superclass type.
- This is one of the most important uses of upcasting → polymorphism.
- Here is an array of Animals holding different types of Cats

```java
class Animal {
    void speak() { System.out.println("Animal makes a sound"); }
}
class Cat extends Animal {
    @Override
    void speak() { System.out.println("Cat meows"); }
}
class Tiger extends Animal {
    @Override
    void speak() { System.out.println("Tiger roars"); }
}
```

---

## Why Upcasting Is Useful (continued)

<style scoped>
section pre { padding: 12px 16px; margin: 8px 0; }
section pre code { font-size: 16px; line-height: 1.3; }
</style>

<!-- no-compile -->
```java
public class Main {
    public static void main(String[] args) {
        // Upcasting happens automatically:
        Animal[] zoo = new Animal[3];
        zoo[0] = new Cat();      // upcast Cat → Animal
        zoo[1] = new Tiger();    // upcast Tiger → Animal
        zoo[2] = new Cat();      // another Cat
        // Polymorphism: each speak() calls the correct method
        for (Animal a : zoo) {
            a.speak();
        }
    }
}

// Output:
// Cat meows
// Tiger roars
// Cat meows
```

---

## WHY this works

- Even though the array is typed as Animal[], the objects inside retain their true type (Cat, Tiger).
- That lets Java call the correct overridden method at runtime.
- Without Upcasting, you would need one reference variable per object! This is exactly what polymorphism is for.

---

## Downcasting Example With Arrays

- Sometimes you need to downcast when retrieving an object.

<!-- no-compile -->
```java
Animal[] zoo = {
    new Cat(),
    new Tiger(),
    new Cat()
};

// Downcasting safely:
Cat firstCat = (Cat) zoo[0];   // OK, it's really a Cat
firstCat.speak();

// Unsafe downcasting:
Cat secondCat = (Cat) zoo[1]; // Tiger is NOT a Cat → will crash
```

---

## Downcasting Example With Arrays (continued)

- Use `instanceof` to avoid crashing:

<!-- no-compile -->
```java
for (Animal a : zoo) {
    if (a instanceof Cat) {
        Cat catObj = (Cat) a;
        System.out.println("Found a Cat!");
        catObj.speak();
    }
}
```

---

## Full Program Demonstrating Everything

- Upcasting and downcasting are not polymorphism by themselves.
- BUT
- ➡️ Upcasting is what enables polymorphism. Polymorphism happens when an upcast reference calls overridden methods.
- Downcasting is not polymorphism — it's just a way to get back a more specific type.

```java
class Animal {
    void speak() { System.out.println("Animal sound"); }
}
class Cat extends Animal {
    void speak() { System.out.println("Meow"); }
    void scratch() { System.out.println("Cat scratches!"); }
}
class Tiger extends Animal {
    void speak() { System.out.println("ROAR!"); }
}
```

---

## Full Program Demonstrating Everything (continued)

<style scoped>
section pre { padding: 8px 14px; margin: 4px 0; }
section pre code { font-size: 13.5px; line-height: 1.2; }
</style>

<!-- no-compile -->
```java
public class Main {
    public static void main(String[] args) {
        // Upcasting
        Animal a1 = new Cat();   // Cat → Animal
        Animal a2 = new Tiger(); // Tiger → Animal
        // Array of Animals
        Animal[] animals = { a1, a2, new Cat() };
        // Polymorphism in action
        for (Animal a : animals) {
            a.speak();
        }
        // Downcasting safely
        if (animals[0] instanceof Cat) {
            Cat cat1 = (Cat) animals[0];
            cat1.scratch();  // works!
        }
        // Unsafe example (will throw error)
        // Cat badCast = (Cat) animals[1]; // animals[1] is a Tiger → crash
    }
}
```

---

## Benefits of Polymorphism

- Code Reusability: Polymorphism allows us to define one interface and have multiple implementations. We can write methods that work on the superclass, and they will work with any subclass type. This means we can write less code, which is always a good thing.
- Flexibility: With polymorphism, objects of a subclass can be treated as objects of a superclass. This provides flexibility for methods to handle arguments of the superclass type, which can actually be any subclass type.
- Separation of Concerns: By using polymorphism, we can separate operations and objects. The objects do what they are supposed to do, and the operations act on the interfaces of the objects. This leads to clean, modular, and understandable code.
- Dynamic Method Dispatch: Polymorphism enables Java's ability to select the appropriate method at runtime based on the actual object, which is a key aspect of what makes Java an object-oriented language.
- Extensibility: In a system designed using polymorphism, new subclasses can be easily added with little or no modification to the general portions of the program, as long as the new classes are part of the inheritance hierarchy.

---

## Summary

- Method overloading allows methods that perform similar or closely related functions to be accessed through a common name. For example, a program performs operations on an array of numbers which can be int, float, or double type. Method overloading allows you to define three methods with the same name and different types of parameters to handle the array operations.
- Method overloading can be implemented on constructors allowing different ways to initialise objects of a class. This enables you to define multiple constructors for handling different types of initialisations.
- Method overriding allows a sub class to use all the general definitions that a super class provides and add specialized definitions through overridden methods.
- Method overriding works together with inheritance to enable code reuse of existing classes without the need for re-compilation.

---

## Resources

- [Explain Polymorphism in Java. Use coding examples. Demonstrate method overridding and method overloading. - Your Personalized AI Assistant.](https://you.com/search?q=Explain%20Polymorphism%20in%20Java.%20Use%20coding%20examples.%20Demonstrate%20method%20overridding%20and%20method%20overloading.&fromSearchBar=true&tbm=youchat&chatMode=default)
- https://beginnersbook.com/2013/03/polymorphism-in-java/
- http://www.geeksforgeeks.org/overloading-in-java/
- https://www.simplilearn.com/tutorials/java-tutorial/java-polymorphism
