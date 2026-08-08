---
marp: true
theme: ooc
paginate: true
transition: fade
title: "Java Arrays"
week: 4
topic: arrays
type: lecture
source: "Java Arrays.pptx"
---

<!-- _class: lead -->
<!-- _paginate: false -->

<span class="kicker">// week 04 · arrays · object-oriented computing</span>

# Java Arrays

---

## Agenda

- What is an array?
- Characteristics: length & homogeneity
- Elements, indices & bounds
- Declaring and creating arrays
- The `length` property
- Looping through arrays (`for` and for-each)
- Multidimensional arrays
- Summary

---

## What is an Array?

* An array is a container object that holds a fixed number of values of a single type. - Oracle
* An array is a structure which can store multiple values of the same data type. This prevents the need to declare separate variables for each value.

| Without an array | With an array |
|---|---|
| `String name1;` | `String[] names;` |
| `String name2;` | |
| `String name3;` | |

---

## Characteristics of an Array

* An array has two distinguishing characteristics:
  - Length (i.e., the number of variables (AKA components) it stores) The length of an array cannot be changed (i.e., it is fixed upon creation).
  - Homogeneity (i.e., every variable in an array has the same data type).

```java
// Declare an array of ints to store student ages
int[] studentAgesArray;

// Allocate memory for 5 ints
studentAgesArray = new int[5];
```
* Below is the studentAgesArray populated with 5 ages, all of type int. Its length is 5 and cannot be changed — to store more ages I would need to create a new array.

| 17 | 21 | 18 | 18 | 19 |
|---|---|---|---|---|

---

## Elements and Indices

* The individual values in an array are called elements (or components).
* The type of those elements (which must be the same because arrays are homogeneous) is called the element type.
* The number of elements is called the length of the array.
* Each element is identified by its position number in the array, which is called its index.
* Index numbers always begin with 0 and therefore extend up to one less than the length of the array — positions 0 through n-1:

| 5.0 | 2.44 | 9.01 | 1.0 | -9.9 |
|---|---|---|---|---|
| 0 | 1 | 2 | 3 | n-1 |

---

## Declaring and Assigning an Array

* As with any other variable, array variables must be declared before you use them. e.g., `String[] cars;`
* The most common syntax for declaring and assigning an array variable looks like this: int[] ages = new int[100];
* The part of the line to the left of the equal sign declares the variable. The part to the right creates an array value with the specified number of elements and then assigns it to the array variable.

```java
int [ ] num = new int [ 10 ];
```
* `int` is the type of each element, `num` is the name of the array, and `10` is the subscript: an integer or constant expression for the number of elements.

---

## Default Values on Construction

```java
double[] battingAverages = new double[7];
```
- `battingAverages` refers to the new array; every element starts at the default value for `double` (`0.0`):

| 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |

---

## Another way to declare and assign an Array

- We can declare an array variable that holds an array of strings.
- To insert values to it, we can use an array literal - place the values in a comma-separated list, inside curly braces:

```java
String[] cars = {"Volvo", "BMW", "Ford", "Mazda"};
```

---

## Index Bounds

- The index starts at zero and ends at length-1.
- Example:

```java
int[] values = new int[5];
values[0] = 12; // CORRECT — first element
values[4] = 12; // CORRECT — last element
```
<!-- no-compile -->
```java
values[5] = 12; // WRONG!! compiles, but throws an
                // Exception at run-time
```
- Will test in Lab

---

## Predict: Does This Compile?

- Is there an error in this code?

<!-- no-compile -->
```java
int[] values = {1, 2.5, 3, 3.5, 4};
```

* **Compile error** — `2.5` and `3.5` are `double` literals, and an `int[]` can only hold ints; Java never narrows automatically.
* The fix: `double[] values = {1, 2.5, 3, 3.5, 4};` — the int literals widen to doubles for free.

---

## The length Property

- Each array has a length variable built-in that contains the length of the array:

```java
int[] values = new int[12];
int size = values.length; // 12
int[] values2 = {1,2,3,4,5};
int size2 = values2.length; // 5
```
- What does this output?

```java
String[] cars = {"Volvo", "BMW", "Ford", "Mazda"};
System.out.println(cars.length);
```

---

## Loop through an Array

- You can loop through the array elements with the for loop, and use the length property to specify how many times the loop should run.
- The following example outputs all elements in the cars array:

```java
String[] cars = {"Volvo", "BMW", "Ford", "Mazda"};
for (int i = 0; i < cars.length; i++) {
  System.out.println(cars[i]);
}
```

---

## Loop Through an Array with For-Each

- General syntax:

<!-- no-compile -->
```java
for (type variable : arrayname) {
  ...
}
```

- Example:

```java
String[] cars = {"Volvo", "BMW", "Ford", "Mazda"};
for (String i : cars) {
  System.out.println(i);
}
```

---

## Multidimensional Arrays

* A multidimensional array is an array containing one or more arrays.
* To create a two-dimensional array, add each array within its own set of curly braces:
```java
char[][] board = { {'a', 'b', 'c'}, {'a', 'b', 'c'}, {'a', 'b', 'c'} };
```
* Board is an array with 3 elements
* To access the elements of the board array, specify two indexes:
  - For the array
  - For the element inside that array.

---

## Multidimensional Arrays (continued)

```java
char[][] board = { {'a', 'b', 'c'},
                   {'a', 'b', 'c'},
                   {'a', 'b', 'c'} };
char x = board[1][1];
System.out.println(x);
board[1][2] = 'd';
System.out.println(board[1][2]);
```
- Lab exercise: use a `char[8][8]` to model a chess board

---

## Summary

- An array holds a fixed number of values of a single type — its length is set at creation and cannot change.
- Indices run from `0` to `length - 1`; going past the end throws an exception at run-time.
- Create arrays with `new type[n]` (elements get default values) or with a literal `{...}`.
- Use `arrayName.length` to size loops; for-each is the cleanest way to visit every element.
- Multidimensional arrays are arrays of arrays — index with `[row][column]`.
