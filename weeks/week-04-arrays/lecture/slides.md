---
marp: true
theme: ooc
paginate: true
transition: fade
title: "Java Arrays"
week: 4
topic: arrays
type: lecture
source: authored
---

<style>
/* Deck-local visual system: memory boxes, drawn in CSS - no images. */
section .mem {
  display: flex; margin: 40px 0 10px 0;
  font-family: 'Cascadia Code', Consolas, monospace;
}
section.lead .mem .cell {
  background: rgba(255,255,255,0.07); border-color: #7FB4D8; color: #F4F1E8;
}
</style>

<!-- _class: lead -->
<!-- _paginate: false -->

<span class="kicker">// week 04 · arrays · object-oriented computing</span>

# Java Arrays

<div class="mem">
<div class="cell"><span class="idx">0</span>'J'</div>
<div class="cell"><span class="idx">1</span>'a'</div>
<div class="cell"><span class="idx">2</span>'v'</div>
<div class="cell"><span class="idx">3</span>'a'</div>
</div>

One name. Many values.

---

<!-- Speaker notes: ~0:00. Cold open on the pain. Let the ellipsis land before advancing. -->

## A true story

- You're building the class gradebook.
- One `int` variable holds one score. You have **300 students**.

<!-- no-compile -->
```java
int score1 = 83;
int score2 = 91;
int score3 = 78;
// ... 296 lines later ...
int score300 = 95;
```

* Now compute the class average. Then find the top score. Then *add a student*.
* **There has to be a better way.**

---

## The idea

- An **array**: a numbered row of variables that share **one name** and **one type**.

<div class="mem">
<div class="name">scores</div>
<div class="cell"><span class="idx">0</span>83</div>
<div class="cell"><span class="idx">1</span>91</div>
<div class="cell"><span class="idx">2</span>78</div>
<div class="cell"><span class="idx">3</span>65</div>
<div class="cell"><span class="idx">4</span>95</div>
</div>

<p class="legend">one name (scores) · five boxes · every box an int · every box numbered</p>

- 300 students? Same one line of code - the array doesn't care.
- The number of a box is its **index**. The count of boxes is the array's **length**.

---

## Agenda

- Creating arrays - declare, construct, fill
- The contract: one type, fixed length, and what happens when you break it
- Looping: the counting loop and for-each
- Arrays are objects - the aliasing trap
- Three loop patterns you'll use forever
- Grids: 2D arrays
- The `java.util.Arrays` toolbox

---

<!-- Speaker notes: ~0:06. Mechanics movement - keep tempo brisk, the ideas are small. -->

## Step 1 - declare

```java
int[] scores;
```

- Read the type aloud: "**int-array**". The `[]` is part of the type.
- This creates the **name only** - no boxes exist yet.
- Java also allows `int scores[];` - it's legal and you should never write it. The type belongs together: `int[]`.

---

## Step 2 - construct

```java
int[] scores = new int[5];
```

<div class="mem">
<div class="name">scores</div>
<div class="cell"><span class="idx">0</span>0</div>
<div class="cell"><span class="idx">1</span>0</div>
<div class="cell"><span class="idx">2</span>0</div>
<div class="cell"><span class="idx">3</span>0</div>
<div class="cell"><span class="idx">4</span>0</div>
</div>

- `new int[5]` builds the boxes - the size goes in the brackets, decided **once**.
- Java never hands you garbage memory. Every box starts at its type's **default**:

| Element type | Default value |
|---|---|
| `int`, `long`, `short`, `byte` | `0` |
| `double`, `float` | `0.0` |
| `boolean` | `false` |
| object types (`String`, …) | `null` |

---

## Step 3 - read and write

```java
int[] scores = new int[5];
scores[2] = 78;                    // write into box 2
int mine = scores[2];              // read box 2
System.out.println(mine);          // 78
```

<div class="mem">
<div class="name">scores</div>
<div class="cell"><span class="idx">0</span>0</div>
<div class="cell"><span class="idx">1</span>0</div>
<div class="cell hot"><span class="idx">2</span>78</div>
<div class="cell"><span class="idx">3</span>0</div>
<div class="cell"><span class="idx">4</span>0</div>
</div>

- `name[index]` is just a variable - anything a variable can do, a box can do.

---

## Or: skip the ceremony

- Know the values already? Use an **array literal** - Java counts them for you:

```java
int[] scores = {83, 91, 78, 65, 95};
String[] names = {"Ada", "Linus", "Grace"};
```

- Literal form only works **in the declaration line** - it's a birth certificate, not a general expression.

---

## Why do indices start at zero?

- The index is not a position - it's a **distance from the start**.

<div class="mem">
<div class="name">a</div>
<div class="cell hot"><span class="idx">start + 0</span>a[0]</div>
<div class="cell"><span class="idx">start + 1</span>a[1]</div>
<div class="cell"><span class="idx">start + 2</span>a[2]</div>
<div class="cell"><span class="idx">start + 3</span>a[3]</div>
</div>

- The first box is zero steps from the front door: `a[0]`.
- Which is why the **last** box of a length-`n` array is `a[n - 1]` - not `a[n]`.
- Burn this in now and every off-by-one error you ever meet gets easier.

---

## The contract, part 1 - one type

- Every box holds the **same type**. The compiler enforces it **before the program ever runs**:

<!-- no-compile -->
```java
int[] values = {1, 2.5, 3, 3.5, 4};   // compile error:
                                      // 2.5 is a double - won't narrow to int
```

- The fix is to change the contract, not fight it:

```java
double[] values = {1, 2.5, 3, 3.5, 4};   // ints widen to double for free
```

---

## The contract, part 2 - fixed length

- Length is decided at construction and **never changes**. There is no `add`.
- And the compiler **cannot** protect you from a bad index:

```java
int[] a = new int[5];
a[5] = 12;   // compiles fine…
```

<div class="mem">
<div class="name">a</div>
<div class="cell"><span class="idx">0</span>0</div>
<div class="cell"><span class="idx">1</span>0</div>
<div class="cell"><span class="idx">2</span>0</div>
<div class="cell"><span class="idx">3</span>0</div>
<div class="cell"><span class="idx">4</span>0</div>
<div class="cell boom"><span class="idx">5</span>✗</div>
</div>

- …then **explodes at run-time**: `ArrayIndexOutOfBoundsException`.

<div class="callout"><strong>Two failure modes, two moments.</strong> Wrong type → caught at <strong>compile time</strong>. Wrong index → caught at <strong>run time</strong>. Knowing which error lives where is half of debugging.</div>

---

## Predict: what prints?

```java
int[] a = new int[3];
System.out.println(a[0]);

String[] s = new String[3];
System.out.println(s[0]);
System.out.println(a.length);
```

* `0` - ints default to zero.
* `null` - object boxes hold *references*, and an empty reference is `null`.
* `3` - `length` is the box count, and it's built into every array.

---

<!-- Speaker notes: ~0:20. Loops movement. The idiom slide is the single most useful slide in the deck - go slow. -->

## `.length` - the array knows its own size

```java
int[] scores = {83, 91, 78, 65, 95};
System.out.println(scores.length);   // 5
```

- Every array carries its length with it. You never track it separately.

<div class="callout"><strong>Spot the difference:</strong> arrays have <code>.length</code> - no parentheses. Strings have <code>.length()</code> - a method call. Mixing them up is a rite of passage; now it's one you can skip.</div>

---

## The counting loop - learn this shape

```java
int[] scores = {83, 91, 78, 65, 95};

for (int i = 0; i < scores.length; i++) {
    System.out.println(scores[i]);
}
```

- `int i = 0` - start at the front door.
- `i < scores.length` - strictly less than: `length` itself is out of bounds.
- Written with `.length`, the loop **survives the array changing size** - edit the data, never the loop.
- This exact shape visits every box of any array ever. It's pure muscle memory - practise it until your fingers type it alone.

---

## For-each - when you don't need the index

```java
int[] scores = {83, 91, 78, 65, 95};

for (int score : scores) {
    System.out.println(score);
}
```

- Read `:` as "**in**" - *for each score in scores*.
- No counter, no bounds, nothing to get off by one.

| Use **for-each** when… | Use the **counting loop** when… |
|---|---|
| you only read the values | you need to know *where* you are |
| every element, front to back | you write into boxes |
| | you skip, reverse, or compare neighbours |

---

## Predict: does this zero the array?

```java
int[] a = {5, 10, 15};

for (int x : a) {
    x = 0;
}

System.out.println(a[0]);
```

* Prints **5**. The array is untouched.
* `x` is a **copy** of each element - assigning to the copy changes nothing in the box.
* This is exactly the "read-only" caveat from the table: to write, you need the index.

---

<!-- Speaker notes: ~0:30. References movement - the deepest idea of the hour, and the payoff of the object-identity lesson. -->

## Arrays are objects

- Remember: a variable of object type holds a **reference** - an arrow, not the thing.
- **Arrays are objects.** Same rule, same consequences:

```java
int[] a = {5, 10, 15};
int[] b = a;             // copies the ARROW - not the boxes
b[0] = 99;
```

<div class="mem">
<div class="name">a</div>
<div class="name">b</div>
<div class="cell hot"><span class="idx">0</span>99</div>
<div class="cell"><span class="idx">1</span>10</div>
<div class="cell"><span class="idx">2</span>15</div>
</div>

<p class="legend">two names · two arrows · ONE array</p>

- Change it through either name - there is only one array to change.

---

## Predict: what prints?

```java
int[] mine = {1, 2, 3};
int[] yours = mine;
yours[0] = 99;

System.out.println(mine[0]);
System.out.println(mine == yours);
```

* `99` - `mine` and `yours` are two arrows to one array.
* `true` - `==` on arrays compares **arrows**, not contents. Two names for one object are equal.

---

## Real copies, real comparisons

- Want a second, independent array? Ask for one:

```java
int[] a = {5, 10, 15};

int[] b = java.util.Arrays.copyOf(a, a.length);   // new boxes, values copied
b[0] = 99;                                        // a[0] is still 5

boolean sameObject = (a == b);                    // false - different arrays
boolean sameValues = java.util.Arrays.equals(a, b); // compares box by box
```

- The pattern repeats all over Java: `==` asks "same object?", a method asks "same contents?"

---

<!-- Speaker notes: ~0:38. Patterns movement - name the patterns; names make them stick and they map straight onto MCQ questions. -->

## Pattern 1 - the accumulator

- One variable gathers a result as the loop sweeps the array:

```java
public static double average(int[] scores) {
    int total = 0;
    for (int score : scores) {
        total += score;
    }
    return (double) total / scores.length;
}
```

- Start at zero → add every element → divide at the end.
- Same skeleton computes sums, counts, products - anything that *gathers*.

---

## Pattern 2 - the champion

- Track the best-so-far; every element gets its challenge:

```java
public static int highest(int[] scores) {
    int best = scores[0];
    for (int i = 1; i < scores.length; i++) {
        if (scores[i] > best) {
            best = scores[i];
        }
    }
    return best;
}
```

- Start with the **first element** as champion - never with `0` (what if all scores are negative?).
- Flip the `>` to `<` and you've written *minimum*. One idea, two functions.

---

## Pattern 3 - the search

- Walk the array; return the moment you find it:

```java
public static int find(String[] names, String target) {
    for (int i = 0; i < names.length; i++) {
        if (names[i].equals(target)) {
            return i;                 // found - stop immediately
        }
    }
    return -1;                        // swept everything - not there
}
```

- `-1` is the classic "not found" answer - it can never be a real index.
- These three patterns - accumulate, champion, search - are the engine room of half the programs you'll ever write.

---

## Arrays of objects

- The boxes hold **references** - the objects live elsewhere:

```java
String[] crew = new String[3];   // three boxes, all null
crew[0] = "Ada";
crew[1] = "Grace";

System.out.println(crew[1].length());   // 5
System.out.println(crew[2].length());   // NullPointerException!
```

- An unfilled box is `null` - call a method through it and the program dies.
- Strings live right here too: a `String[]` is arrows to String objects.

---

<!-- Speaker notes: ~0:46. Grids - connect to the lab immediately; the chessboard is their lab exercise. -->

## Two dimensions - the grid

- A 2D array is an **array of arrays** - rows first, then columns:

```java
char[][] board = new char[8][8];
board[0][0] = 'R';     // row 0, column 0 - top-left corner
board[7][4] = 'K';     // row 7, column 4
```

- Read `board[row][col]` - **row first, always**.
- Spreadsheets, pixel grids, game boards, seating plans - every grid in computing is this.
- **Lab exercise:** model a chessboard with `char[8][8]`.

---

## Sweeping the grid

- One loop per dimension - rows outside, columns inside:

```java
char[][] board = new char[8][8];

for (int row = 0; row < board.length; row++) {
    for (int col = 0; col < board[row].length; col++) {
        board[row][col] = '.';
    }
}
```

- `board.length` - how many **rows**. `board[row].length` - boxes in *that* row.
- Asking each row for its own length even survives ragged grids (rows of different lengths - legal, rare, good to recognise).

---

## The toolbox - `java.util.Arrays`

- You've met two already. The class is full of loops you now never write by hand:

```java
import java.util.Arrays;

public class Toolbox {
    public static void main(String[] args) {
        int[] a = {40, 10, 30, 20};

        System.out.println(Arrays.toString(a));  // [40, 10, 30, 20]
        Arrays.sort(a);                          // a is now {10, 20, 30, 40}
        Arrays.fill(a, 7);                       // a is now {7, 7, 7, 7}
    }
}
```

- `Arrays.toString` is the debugging one - printing an array directly gives gibberish (`[I@1b6d3586`), because you're printing the *arrow*.

---

## What arrays can't do

- The fixed length eventually hurts: no insert, no remove, no grow.
- "Add a student mid-semester" means building a **bigger array and copying** - clumsy.
- Java's answer is `ArrayList` - an array that resizes itself. It's built **on top of arrays**, and you'll meet it later in your Java journey.
- Every clever collection you'll ever use - lists, stacks, hash tables - has an array like this one beating underneath. **This hour is the foundation.**

---

## Summary

- An array is a numbered row of same-typed boxes under one name; its `length` is fixed at construction and indices run `0` to `length - 1`.
- Wrong type fails at **compile time**; wrong index fails at **run time**.
- The counting loop `for (int i = 0; i < a.length; i++)` and for-each split the work: index when you need *where*, for-each when you only need *what*.
- Arrays are **objects**: `b = a` copies an arrow, `Arrays.copyOf` copies boxes, `==` compares arrows, `Arrays.equals` compares contents.
- Accumulator, champion, search - three loop patterns that solve half of everything.
- Grids are arrays of arrays: `board[row][col]`, one loop per dimension.
