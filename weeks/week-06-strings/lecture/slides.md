---
marp: true
theme: ooc
paginate: true
title: "Java Strings"
week: 6
topic: strings
type: lecture
source: "java_strings.pptx"
---

<!-- _class: lead -->
<!-- _paginate: false -->

<span class="kicker">// week 06 · strings · object-oriented computing</span>

# Java Strings

<!-- no-compile -->
```java
"Hello, World!"
```

---

## Agenda

- What is a String?
- String Immutability
- Why Strings are Immutable
- String Pool & Memory
- String vs StringBuffer vs String Builder
- Performance Comparison
- Best Practices

---

## What is a String?

- A String is a sequence of characters representing text
- Strings are objects, not primitive types
- Part of java.lang package (imported automatically)
- Most commonly used class in Java programming
- Since Java 9, every character in a string is stored in an 8-bit byte array with an additional coder field to indicate the encoding.

```java
String str1 = "Hello";
String str2 = new String("Hello");
char[] charArray = {'J', 'a', 'v', 'a'};
String str3 = new String(charArray);
```

---

## Creating Strings

- String literal:
  - String s1 = "Hello";
- Using new keyword:
  - String s2 = new String("World");
- From char array:
  - String s3 = new String(chars);
- Concatenation:
  - String s4 = "Hello" + " " + "World";
- From StringBuilder:
  - String s5 = sb.toString();

---

## Creating Strings (continued)

```java
// String literal (uses String pool)
String s1 = "Hello";

// Using new keyword
String s2 = new String("World");

// From char array
char[] chars = {'J','a','v','a'};
String s3 = new String(chars);
```

---

## String Immutability

- Once created, a String's value can not be changed
- Any modification creates a NEW String object
- Original String remains unchanged in memory

![](img/slide05-1.png)

---

## String Immutability – Coding Example

- Output, in order: `Hello`, `HELLO`, `Hello`, `HELLO`

```java
String str = "Hello";
System.out.println(str);      // Prints "Hello"

System.out.println(str.toUpperCase()); // Returns new String and prints it

System.out.println(str);      // Still prints "Hello"

str = str.toUpperCase();     // Must reassign!
System.out.println(str);      // Now prints "HELLO"
// Original String will be garbage collected because it has no references.
```

---

## Why is String Immutability Good?

- Security: Prevents malicious code from modifying String values
- Thread Safety: Multiple threads can share Strings safely
- String Pool Optimization: Enables efficient memory usage
- HashCode Caching: Hash value computed once and reused
- Class Loading: Class names are Strings and must not change

![String | bartleby](img/slide07-1.png)

---

## String Pool & Memory

- String Pool: Special memory area in heap for String literals
- String s1 = "Java"; // Stored in pool
- String s2 = "Java"; // Reuses same object from pool
- s1 == s2 returns true (same reference)
- String s3 = new String("Java"); // Creates new object in heap

---

## String Pool & Memory (continued)

![](img/slide08-1.png)

---

## Why is String Immutability bad?

- String concatenation in loops creates many temporary objects
- Each + operation creates a new String object
- Memory intensive and slow for repeated modifications
- Example: Building a String in a loop of 1000 iterations
- Creates 1000 temporary String objects!

---

## Why is String Immutability bad? (continued)

<style scoped>
section pre { padding: 12px 16px; margin: 8px 0; }
</style>

**The Problem: String Immutability**

```java
String result = "";
for (int i = 0; i < 1000; i++) {
    result += "a";  // Creates 1000 NEW String objects!
}
// Time: ~1000ms
// Memory: 1000 temporary objects created and discarded
```

**The Solution: StringBuilder's Mutability**

```java
StringBuilder result = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    result.append("a");  // Modifies SAME object 1000 times
}
// Time: ~1ms
// Memory: 1 object reused
```

---

<!-- _class: centered-table -->

## String vs StringBuffer vs StringBuilder

| Class | Introduced | Mutability |
|---|---|---|
| `String` | Java 1.0 (1996) | Immutable |
| `StringBuffer` | Java 1.0 (1996) | Mutable, thread-safe |
| `StringBuilder` | Java 5 (2004) | Mutable, NOT thread-safe |

---

## String vs StringBuffer vs StringBuilder (continued)

- Both String and StringBuffer were in the original Java release. They were designed together from the start:
- String for immutable text
- StringBuffer for mutable text operations (like concatenation in loops)
- The reason StringBuffer was synchronized from the beginning was that early Java emphasized thread-safety as a core feature - this was the 90s when multi-threading was becoming important, and Java wanted to be "safe by default."

---

<!-- _class: dense -->

## String vs StringBuffer vs StringBuilder

<style scoped>
section pre { padding: 12px 16px; margin: 8px 0; }
</style>

- StringBuilder came 8 years later when the Java team realized that most StringBuffer usage was in single-threaded contexts, and the synchronization overhead was unnecessary performance cost.
- So Java added StringBuilder as a drop-in replacement for StringBuffer with identical API but without the synchronization overhead.
- In practice: You'll almost always use StringBuilder. StringBuffer is now quite rare since most code doesn't need that level of thread-safety, and if it does, there are often better concurrent solutions available.

```java
// Use StringBuilder (most common case)
StringBuilder sb = new StringBuilder();
sb.append("Hello").append(" World");

// Only use StringBuffer if multiple threads access it
StringBuffer safeSb = new StringBuffer();  // Rarely needed
```

---

## StringBuilder: Mutable Strings

- StringBuilder provides MUTABLE character sequences
- Modifies the same object instead of creating new ones
- Much more efficient for string manipulation
- Not thread-safe (use StringBuffer for thread safety)
- Introduced in Java 5 as faster alternative to StringBuffer

---

## StringBuilder: Mutable Strings (continued)

<style scoped>
section img { max-height: 500px; }
</style>

![](img/slide12-1.png)

---

## Why StringBuilder Was Created

- StringBuilder was specifically designed to solve the performance problem caused by String immutability when you need to:
- Build strings in loops ✅
- Make multiple modifications ✅
- Concatenate many pieces ✅
- Construct large strings ✅

---

## Key StringBuilder Methods

- append(): Add text to end
- insert(): Add text at specific position
- delete(): Remove characters from range
- reverse(): Reverse the character sequence
- toString(): Convert to String object

---

## Key StringBuilder Methods — in Action

<style scoped>
section pre { padding: 12px 16px; margin: 8px 0; }
section pre code { font-size: 17px; line-height: 1.3; }
</style>

```java
StringBuilder methods = new StringBuilder("Hello World");

// append()
methods.append(" - Welcome");
System.out.println("append: " + methods);

// insert()
methods.insert(5, " Java");
System.out.println("insert: " + methods);

// delete()
methods.delete(5, 10);
System.out.println("delete: " + methods);

// deleteCharAt()
methods.deleteCharAt(5);
System.out.println("deleteCharAt: " + methods);

// replace()
methods.replace(0, 5, "Greetings");
System.out.println("replace: " + methods);
```

---

## Key StringBuilder Methods — in Action (continued)

<style scoped>
section pre { padding: 12px 16px; margin: 8px 0; }
section pre code { font-size: 17px; line-height: 1.3; }
</style>

```java
// reverse()
StringBuilder toReverse = new StringBuilder("Java");
toReverse.reverse();
System.out.println("reverse: " + toReverse);

// setCharAt()
StringBuilder modify = new StringBuilder("Hello");
modify.setCharAt(0, 'h');
System.out.println("setCharAt: " + modify);

// substring() - returns String, doesn't modify
StringBuilder sub = new StringBuilder("Hello World");
String extracted = sub.substring(0, 5);
System.out.println("substring (returns String): " + extracted);
System.out.println("Original StringBuilder unchanged: " + sub);
```

---

<!-- _class: dense -->

## StringBuffer: Thread-Safe Alternative

- StringBuffer is similar to StringBuilder but thread-safe
- All methods are synchronized (thread-safe)
- Slower than StringBuilder due to synchronization overhead
- Use ONLY when multiple threads access same object
- For single-threaded code, always use StringBuilder
- API identical to StringBuilder (append, insert, delete, etc.)

```java
// StringBuffer - thread-safe (synchronized)
StringBuffer buffer = new StringBuffer();
// Safe for multiple threads to append simultaneously

// StringBuilder - NOT thread-safe
StringBuilder builder = new StringBuilder();
// Only use in single-threaded code
```

---

<!-- _class: centered-table -->

## String vs StringBuilder

| Class | Mutable? | Thread-safe? | Notes |
|---|---|---|---|
| `String` | No | Yes | Stored in the String pool |
| `StringBuilder` | Yes | No | Faster for modifications |
| `StringBuffer` | Yes | Yes (synchronized) | Slower |

- Use String for read-only text
- Use StringBuilder for frequent modifications

---

## Which to Use?

<style scoped>
section img { max-height: 500px; }
</style>

![](img/slide17-1.png)

---

<!-- _class: centered-table -->

## Performance Comparison

| Metric | String | StringBuilder |
|---|---|---|
| Concatenating 10,000 strings in a loop | ~1000ms (very slow) | ~1ms (1000x faster!) |
| Memory usage | Creates thousands of temporary objects | Reuses same object with dynamic array |

---

## Best Practices

- Use String for simple, unchanging text
- Use StringBuilder for loops and repeated modifications
- Use StringBuffer only when thread safety is required
- Avoid string concatenation in loops (use StringBuilder)
- For simple concatenations, + operator is fine (compiler optimizes)

---

## Common Mistakes to Avoid

- Forgetting that Strings are immutable
- Using == to compare String values (use .equals() instead)
- String concatenation in loops without StringBuilder
- Not converting StringBuilder to String when needed
- Using StringBuffer when StringBuilder would suffice

```java
String s1 = new String("Hi");
String s2 = new String("Hi");
if (s1 == s2) { }        // false!

if (s1.equals(s2)) { }   // true
```

