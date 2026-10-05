# Java Arrays Lab

## What you'll learn

- Declare, initialize, and iterate over arrays using indexed and enhanced `for` loops
- Predict the default values Java assigns to uninitialized array elements
- Modify array elements and build arrays of objects
- Copy, clone, sort, and compare arrays with `System.arraycopy`, `clone()`, and the `java.util.Arrays` utility class
- Find the highest value in an array, and the position of a value, with the champion and search patterns
- Work with 2D arrays and pass arrays to and from methods

## Table of Contents

* [Introduction](#introduction)
1. [Default Values and Declaring Arrays](#1-default-values-and-declaring-arrays)
2. [Accessing and Iterating Over Array Elements](#2-accessing-and-iterating-over-array-elements)
3. [Array Length and Modifying Arrays](#3-array-length-and-modifying-arrays)
4. [Arrays of Objects](#4-arrays-of-objects)
5. [Copying and Sorting Arrays](#5-copying-and-sorting-arrays)
6. [The Arrays Utility Class and Cloning](#6-the-arrays-utility-class-and-cloning)
7. [2D Arrays](#7-2d-arrays)
8. [Passing Arrays to Methods](#8-passing-arrays-to-methods)
9. [The Champion Pattern](#9-the-champion-pattern)
10. [The Search Pattern](#10-the-search-pattern)

## Getting started

This lab lives in the package `week05.arrays_lab` - this folder. A runnable `Main.java` is already here: open this folder in VS Code or your Codespace, click ▶ on `Main.java` to check your setup works. Write each exercise in the `main` method of this one `Main.java`. Before you replace an exercise's code with the next one's, keep it safe: commit it (Source Control panel), or comment it out (select the lines, then Ctrl+/). When an exercise gives you a class to use, put that class in its own file beside `Main.java`: `Book.java` for DIY 4. Every new file starts with the package line you see in `Main.java`.

## Introduction

In Java, an array is a collection of variables of the same type, stored in a contiguous block of memory. Arrays allow you to store multiple values in a single variable, which can be accessed using an index. Understanding arrays is fundamental in programming as they provide a way to manage and manipulate data efficiently.

### Key Concepts

- **Fixed Size**: Once an array is created, its size cannot be changed.
- **Zero-Based Indexing**: Array indexing starts at 0.
- **Homogeneous Elements**: All elements in an array are of the same data type.

#### Array Structure

```mermaid
graph LR
B[Element at index 0]
B --> C[Element at index 1]
C --> D[Element at index 2]
D --> E[...]
E --> F[Element at index N-1]
```

## 1. Default Values and Declaring Arrays

Before we delve deeper into arrays, it's important to understand the default values assigned to array elements when they are not explicitly initialized.

- **Numeric Types**: Default to `0`.
- **`char`**: Defaults to `'\u0000'` (the null character).
- **`boolean`**: Defaults to `false`.
- **Reference Types**: Defaults to `null`.

### Code Example: Default Values

```java
public class DefaultValues {
    public static void main(String[] args) {
        int[] intArray = new int[3];
        boolean[] boolArray = new boolean[3];
        String[] stringArray = new String[3];

        System.out.println("Default int values:");
        for (int num : intArray) {
            System.out.print(num + " ");
        }

        System.out.println("\nDefault boolean values:");
        for (boolean bool : boolArray) {
            System.out.print(bool + " ");
        }

        System.out.println("\nDefault String values:");
        for (String str : stringArray) {
            System.out.print(str + " ");
        }
    }
}
```

<details>
<summary>Output</summary>

```
Default int values:
0 0 0 
Default boolean values:
false false false 
Default String values:
null null null 
```

</details>

### Ways to Declare an Array

There are several ways to declare and initialize arrays in Java.

### Declaration Without Initialization

```java
int[] numbers; // Declares an array of integers
```

### Declaration With Initialization

```java
int[] numbers = new int[5]; // Declares an array and allocates memory for 5 integers
```

### Inline Initialization

```java
int[] numbers = {1, 2, 3, 4, 5}; // Declares and initializes the array with values
```

### Using the `new` Keyword with Initialization

```java
int[] numbers = new int[]{1, 2, 3, 4, 5};
```

### Code Example: Declaring Arrays

```java
public class ArrayDeclaration {
    public static void main(String[] args) {
        // Method 1: Declaration without initialization
        int[] array1;
        array1 = new int[3]; // Now initialized with default values (0, 0, 0)

        // Method 2: Declaration with size
        int[] array2 = new int[3]; // Initialized with default values

        // Method 3: Inline initialization
        int[] array3 = {1, 2, 3};

        // Method 4: Using new keyword with initialization
        int[] array4 = new int[]{4, 5, 6};

        // Displaying array elements
        for (int num : array3) {
            System.out.print(num + " ");
        }
    }
}
```

<details>
<summary>Output</summary>

```
1 2 3 
```

</details>

### DIY 1: Defaults and inline initialization

1. Declare an array `char[] letters` with a size of 4 and give it no values. Using a loop, print each element as a number (cast it with `(int)`) on a single line, separated by spaces, then end the line with `System.out.println();`.
2. Declare an array `double[] values` containing the values `1.5`, `2.5`, `3.5` and `4.5`. Print each element on one line, separated by spaces, and end that line too.

**Expected output**

```text
0 0 0 0 
1.5 2.5 3.5 4.5 
```

*(Each `char` element defaults to `'\u0000'`, the invisible NUL character, whose numeric value is 0. That is why step 1 prints the number: printing the character itself would show nothing at all.)*

<details>
<summary>Hint</summary>

For step 1, leave the elements alone and loop over the array with `System.out.print((int) letters[i] + " ");` inside it. For step 2, use inline initialization similar to the examples above.

</details>

## 2. Accessing and Iterating Over Array Elements

After declaring and initializing an array, you can access its elements using indices and iterate over them using loops.

### Accessing Elements by Index

```java
int[] numbers = {10, 20, 30, 40, 50};
int firstNumber = numbers[0]; // Accessing the first element
System.out.println("First number: " + firstNumber);
```

### Iterating Using Loops

#### Using a Traditional `for` Loop

<!-- no-compile -->
```java
for (int i = 0; i < numbers.length; i++) {
    System.out.println("Element at index " + i + ": " + numbers[i]);
}
```

#### Using an Enhanced `for` Loop (For-Each Loop)

The enhanced `for` loop (also called a for-each loop) provides a simpler way to iterate over arrays. It automatically handles the indexing for you.

<!-- no-compile -->
```java
for (int num : numbers) {
    System.out.println(num);
}
```

### Code Example

```java
public class ArrayIteration {
    public static void main(String[] args) {
        int[] numbers = {5, 10, 15, 20};

        // Accessing elements by index
        System.out.println("First element: " + numbers[0]);
        System.out.println("Last element: " + numbers[numbers.length - 1]);

        // Iterating using traditional for loop
        System.out.println("Using traditional for loop:");
        for (int i = 0; i < numbers.length; i++) {
            System.out.println("Element at index " + i + ": " + numbers[i]);
        }

        // Iterating using enhanced for loop
        System.out.println("Using enhanced for loop:");
        for (int num : numbers) {
            System.out.println(num);
        }
    }
}
```

<details>
<summary>Output</summary>

```
First element: 5
Last element: 20
Using traditional for loop:
Element at index 0: 5
Element at index 1: 10
Element at index 2: 15
Element at index 3: 20
Using enhanced for loop:
5
10
15
20
```

</details>

### DIY 2: Reverse order

1. Create the array `int[] numbers = {5, 10, 15, 20};`.
2. Print all elements in reverse order, one per line.

**Expected output**

```text
20
15
10
5
```

<details>
<summary>Hint</summary>

Use a `for` loop starting from the last index.

</details>

## 3. Array Length and Modifying Arrays

### Array Length

The length of an array refers to the number of elements it can hold. In Java, you can access the length using the `.length` property.

```java
public class ArrayLength {
    public static void main(String[] args) {
        int[] numbers = {10, 20, 30, 40, 50};
        System.out.println("The length of the array is: " + numbers.length);
    }
}
```

<details>
<summary>Output</summary>

```
The length of the array is: 5
```

</details>

### Modifying Arrays

You can modify array elements by accessing them via their index and assigning new values.

```java
public class ModifyArray {
    public static void main(String[] args) {
        String[] fruits = {"Apple", "Banana", "Cherry"};
        fruits[1] = "Blueberry"; // Modifies the second element

        // Displaying modified array
        for (String fruit : fruits) {
            System.out.print(fruit + " ");
        }
    }
}
```

<details>
<summary>Output</summary>

```
Apple Blueberry Cherry 
```

</details>

### DIY 3: Length and update

1. Create the array `int[] nums = {10, 20, 30, 40};` and print its length in the form `Length: <length>`.
2. Change the third element to `35`.
3. Print all elements on one line, separated by spaces.

**Expected output**

```text
Length: 4
10 20 35 40 
```

<details>
<summary>Hint</summary>

Use the `.length` property for the first line. For the update, access the element at index 2 and assign a new value.

</details>

## 4. Arrays of Objects

Arrays in Java can store objects, not just primitive data types. Below we have a Student class. In the ArrayOfObjects class we will create a students array which will hold Student objects.

### Code Example

```java
class Student {
    private String name;
    private int age;

    // Constructor
    Student(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // Getter methods
    String getName() {
        return name;
    }

    int getAge() {
        return age;
    }
}
```

```java
public class ArrayOfObjects {
    public static void main(String[] args) {
        // Array of Strings (which are objects in Java)
        String[] names = {"Alice", "Bob", "Charlie"};

        // Array of custom objects
        Student[] students = new Student[2];

        students[0] = new Student("Dave", 20);
        students[1] = new Student("Eva", 22);

        for (Student student : students) {
            System.out.println(student.getName() + " is " + student.getAge() + " years old.");
        }
    }
}
```

<details>
<summary>Output</summary>

```
Dave is 20 years old.
Eva is 22 years old.
```

</details>

### DIY 4: Array of Book objects

First copy this `Book` class into its own file, `Book.java`, beside `Main.java`. It has the same shape as the `Student` class above, so there is nothing to design here:

```java
package week05.arrays_lab;

public class Book {
    private String title;
    private String author;

    public Book(String title, String author) {
        this.title = title;
        this.author = author;
    }

    public String getTitle() {
        return title;
    }

    public String getAuthor() {
        return author;
    }
}
```

1. In `Main.java`'s `main`, create a `Book[]` array named `library` holding `new Book("Dracula", "Bram Stoker")` and `new Book("Emma", "Jane Austen")`.
2. Loop over the array and print each book's details in the form `<title> by <author>`.

**Expected output**

```text
Dracula by Bram Stoker
Emma by Jane Austen
```

<details>
<summary>Hint</summary>

Every element of the array is a `Book`, so call its getters on it: `book.getTitle()` and `book.getAuthor()`. An enhanced `for (Book book : library)` loop reads well here.

</details>

## 5. Copying and Sorting Arrays

Java gives you several ready-made ways to copy, sort, compare, and clone arrays. This section covers copying and sorting; the next covers the `Arrays` utility class and cloning.

### Copying Arrays

You can copy arrays using methods like `System.arraycopy()`.

```java
public class CopyArray {
    public static void main(String[] args) {
        int[] original = {1, 2, 3};
        int[] copy = new int[original.length];

        System.arraycopy(original, 0, copy, 0, original.length);

        // Modify the copy
        copy[0] = 10;

        // Display both arrays
        System.out.println("Original array: " + java.util.Arrays.toString(original));
        System.out.println("Copied array: " + java.util.Arrays.toString(copy));
    }
}
```

<details>
<summary>Output</summary>

```
Original array: [1, 2, 3]
Copied array: [10, 2, 3]
```

</details>

### Sorting Arrays

You can sort arrays using `Arrays.sort()`.

```java
import java.util.Arrays;

public class SortArray {
    public static void main(String[] args) {
        int[] numbers = {5, 3, 2, 4, 1};
        Arrays.sort(numbers);
        System.out.println("Sorted array: " + Arrays.toString(numbers));
    }
}
```

<details>
<summary>Output</summary>

```
Sorted array: [1, 2, 3, 4, 5]
```

</details>

### DIY 5: Copy, then sort

1. Start with `int[] original = {5, 3, 2, 4, 1};`.
2. Copy it into a new array, then sort the copy - the original must stay unchanged.
3. Print both arrays using `Arrays.toString()`, labelled as shown below.

**Expected output**

```text
Original array: [5, 3, 2, 4, 1]
Sorted copy: [1, 2, 3, 4, 5]
```

<details>
<summary>Hint</summary>

Use `System.arraycopy` and `Arrays.sort`.

</details>

## 6. The Arrays Utility Class and Cloning

The `java.util.Arrays` class provides utility methods for array manipulation.

### Converting Arrays to Strings

```java
import java.util.Arrays;

public class ArraysToString {
    public static void main(String[] args) {
        String[] fruits = {"Apple", "Banana", "Cherry"};
        System.out.println(Arrays.toString(fruits));
    }
}
```

<details>
<summary>Output</summary>

```
[Apple, Banana, Cherry]
```

</details>

### Comparing Arrays

`==` on two arrays asks whether both variables refer to the *same* array. `Arrays.equals` compares the *contents* instead. Put brackets round `a == b` when you print it, because `+` is worked out before `==`:

```java
import java.util.Arrays;

public class CompareArrays {
    public static void main(String[] args) {
        int[] a = {1, 2, 3};
        int[] b = {1, 2, 3};

        System.out.println("a == b: " + (a == b));
        System.out.println("Arrays.equals(a, b): " + Arrays.equals(a, b));
    }
}
```

<details>
<summary>Output</summary>

```
a == b: false
Arrays.equals(a, b): true
```

</details>

### Cloning Arrays

You can also create a copy of an array using the `clone()` method.

```java
public class CloneArray {
    public static void main(String[] args) {
        int[] original = {1, 2, 3};
        int[] clone = original.clone();

        // Modify the clone
        clone[0] = 10;

        // Display both arrays
        System.out.println("Original array: " + java.util.Arrays.toString(original));
        System.out.println("Cloned array: " + java.util.Arrays.toString(clone));
    }
}
```

<details>
<summary>Output</summary>

```
Original array: [1, 2, 3]
Cloned array: [10, 2, 3]
```

</details>

### DIY 6: Compare and clone

1. Create `String[] original = {"Apple", "Banana", "Cherry"};` and clone it into `String[] cloned`.
2. Print whether `original == cloned`, then whether `Arrays.equals(original, cloned)`, each in the form shown below.
3. Change the first element of the clone to `"Avocado"`.
4. Print both arrays using `Arrays.toString()`, labelled as shown below, then print `Arrays.equals(original, cloned)` again.

**Expected output**

```text
original == cloned: false
Arrays.equals(original, cloned): true
Original array: [Apple, Banana, Cherry]
Cloned array: [Avocado, Banana, Cherry]
Arrays.equals(original, cloned): false
```

<details>
<summary>Hint</summary>

Put brackets round the `==` comparison when you print it, as in the example above, because `+` is worked out before `==`. `==` between two arrays asks "the same array object?", and a clone is always a different object, so it is `false` even while the contents match. `Arrays.equals(a, b)` compares the contents instead, so it is `true` until one of the arrays changes. Changing the clone leaves the original untouched.

</details>

## 7. 2D Arrays

A 2D array is an array of arrays, useful for representing grids or tables.

### Declaration and Initialization

```java
int[][] matrix = new int[3][3]; // 3x3 matrix with default values

int[][] predefinedMatrix = {
    {1, 2, 3},
    {4, 5, 6},
    {7, 8, 9}
};
```

### Code Example

```java
public class TwoDArray {
    public static void main(String[] args) {
        int[][] matrix = {
            {1, 2, 3}, // Row 0
            {4, 5, 6}, // Row 1
            {7, 8, 9}  // Row 2
        };

        // Accessing element at row 1, column 2
        System.out.println("Element at (1,2): " + matrix[1][2]);

        // Modifying element at row 0, column 0
        matrix[0][0] = 10;

        // Displaying the 2D array
        for (int i = 0; i < matrix.length; i++) { // Rows
            for (int j = 0; j < matrix[i].length; j++) { // Columns
                System.out.print(matrix[i][j] + " ");
            }
            System.out.println();
        }
    }
}
```

<details>
<summary>Output</summary>

```
Element at (1,2): 6
10 2 3 
4 5 6 
7 8 9 
```

</details>

### DIY 7: Sum a 2D array

1. Create a 2D array representing the following table:

   ```text
   1 2 3
   4 5 6
   7 8 9
   ```

2. Add up every element in the array.
3. Print the total in the form `Sum of all elements: <total>`.

**Expected output**

```text
Sum of all elements: 45
```

<details>
<summary>Hint</summary>

Use nested loops to traverse the 2D array and accumulate the sum.

</details>

## 8. Passing Arrays to Methods

Arrays can be passed to methods as parameters, and methods can return arrays.

### Code Example

```java
public class ArrayMethods {
    public static void main(String[] args) {
        int[] numbers = {1, 2, 3};
        printArray(numbers);

        int[] squaredNumbers = squareArray(numbers);
        System.out.println("Squared array: " + java.util.Arrays.toString(squaredNumbers));
    }

    // Method to print array elements
    public static void printArray(int[] array) {
        for (int num : array) {
            System.out.print(num + " ");
        }
        System.out.println();
    }

    // Method to return a new array with squared elements
    public static int[] squareArray(int[] array) {
        int[] result = new int[array.length];
        for (int i = 0; i < array.length; i++) {
            result[i] = array[i] * array[i];
        }
        return result;
    }
}
```

<details>
<summary>Output</summary>

```
1 2 3 
Squared array: [1, 4, 9]
```

</details>

### DIY 8: Double the values

1. In `Main.java`, beside `main`, write a `static` method that takes an array of integers and returns a new array with each element doubled.
2. In `main`, call your method with the array `{1, 2, 3}` and print the returned array using `Arrays.toString()`, labelled as shown below.

**Expected output**

```text
Doubled array: [2, 4, 6]
```

<details>
<summary>Hint</summary>

Iterate over the input array, double each element, and store it in a new array.

</details>

## 9. The Champion Pattern

Two more loop shapes come up everywhere: finding the best value in an array, and checking whether a value is in there at all.

Track the best value seen "so far" as you sweep the array: start by naming the first element champion, then challenge it with every element that follows.

```java
public class HighestTemperature {
    public static void main(String[] args) {
        int[] temperatures = {68, 74, 59, 81, 77};

        int highest = temperatures[0];
        for (int i = 1; i < temperatures.length; i++) {
            if (temperatures[i] > highest) {
                highest = temperatures[i];
            }
        }

        System.out.println("Highest temperature: " + highest);
    }
}
```

<details>
<summary>Output</summary>

```
Highest temperature: 81
```

</details>

### DIY 9: Highest and lowest score

1. Create the array `int[] scores = {83, 91, 78, 65, 95};`.
2. Using the champion pattern - start `highest` at `scores[0]`, then compare every later element against it - find the highest score.
3. Using the same pattern with the comparison flipped, find the lowest score.
4. Print both results in the form shown below.

**Expected output**

```text
Highest score: 95
Lowest score: 65
```

<details>
<summary>Hint</summary>

Do not start `highest` (or `lowest`) at `0` - start it at `scores[0]`, then loop from index `1`, comparing each remaining element and updating your champion when you find something bigger (or smaller).

</details>

## 10. The Search Pattern

Walk the array and return the moment you find what you are looking for - an early exit, not a scan that keeps going after the answer is known. If the loop finishes with no match, return `-1`: an index that can never be real.

```java
public class FindName {
    public static void main(String[] args) {
        String[] names = {"Ada", "Linus", "Grace"};

        System.out.println("Index of Grace: " + find(names, "Grace"));
        System.out.println("Index of Alan: " + find(names, "Alan"));
    }

    public static int find(String[] names, String target) {
        for (int i = 0; i < names.length; i++) {
            if (names[i].equals(target)) {
                return i;
            }
        }
        return -1;
    }
}
```

<details>
<summary>Output</summary>

```
Index of Grace: 2
Index of Alan: -1
```

</details>

### DIY 10: Search for a number

1. In `Main.java`, beside `main`, write a `static` method `indexOf(int[] numbers, int target)` that searches `numbers` for `target`, `return`-ing its index the moment it finds a match.
2. If the loop finishes without a match, `return -1` after it.
3. In `main`, create the array `int[] numbers = {12, 27, 33, 48, 9};`.
4. Call your method twice - once for `48` (a value that is present) and once for `100` (a value that is absent) - and print both results in the form shown below.

**Expected output**

```text
Index of 48: 3
Index of 100: -1
```

<details>
<summary>Hint</summary>

Compare with `==`, not `.equals()` - these are `int` values, not objects. Loop with the counting pattern; the instant `numbers[i] == target`, `return i`. Only reach `return -1` if the loop finishes with no match.

</details>

## Summary

In this lab, we've covered:

- Various methods to declare and initialize arrays.
- Default values assigned to array elements.
- Accessing and iterating over array elements using traditional and enhanced for loops.
- Utilizing the array's length.
- Modifying elements within an array.
- Arrays of objects and how to work with them.
- Common array operations like copying, sorting, and comparing.
- Utilizing the `Arrays` utility class for array manipulation.
- Cloning arrays to create independent copies.
- Understanding and working with 2D arrays.
- Passing arrays to methods.
- Finding the highest and lowest values with the champion pattern, and searching an array for a value.

Arrays are a foundational aspect of Java programming, enabling efficient data storage and manipulation. Mastery of arrays will significantly aid in understanding more complex data structures and algorithms.
