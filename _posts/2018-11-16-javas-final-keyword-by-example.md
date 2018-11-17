---
layout: post
title:  "Java's final Keyword by Example"
date:   2018-11-16 21:00:00 -0700

categories: java
---

## Motivation
I have not written much Java so the `final` keyword is new to me. Apparently, `final` "can help avoid programming errors,"<sup>[§4.12.4](https://docs.oracle.com/javase/specs/jls/se7/html/jls-4.html#jls-4.12.4)</sup> which seems worthwhile.

## Variables

According to the Java language specification<sup>[§4.12.4](https://docs.oracle.com/javase/specs/jls/se7/html/jls-4.html#jls-4.12.4)</sup>, "A final variable may only be assigned to once."

So, this is fine:
```java
int i = 1;
i = 1;
```

But, this is a compile time error (even though the value assigned to `i` does not change):
```java
final int i = 1;
i = 1;
```
```console
error: cannot assign a value to final variable i
    i =1;
    ^
1 error
```

Strings declared `final` are the same. This is fine:
```java
String str = "hi";
str = "bye";
```

But this excepts:
```java
final String str = "hi";
str = "bye";
```
```console
error: cannot assign a value to final variable str
    str = "bye";
    ^
1 error
```

Initialized primitives and objects of type String declared `final` are called "constant variables,"<sup>[§15.28](https://docs.oracle.com/javase/specs/jls/se7/html/jls-15.html#jls-15.28)</sup> (which seems, to me, an oxymoronic name). 

How about arrays? 

This is where `final` gets interesting (i.e. _confusing_). This is fine:
```java
int[] arr = {1,1,1};
arr[0] = 1;
```

And, interestingly, so is this:
```java
final int[] arr = {1,1,1};
arr[0] = 1;
```

But as soon as we try to re-purpose the variable, we get a compile error:
```java
final int[] arr = {1,1,1};
arr = new int[] {2,2,2};
```
```console
error: cannot assign a value to final variable arr
    arr = new int[] {2,2,2};
    ^
1 error
```
When your variable references an object (i.e. anything inheriting from Object, _except String_) and your variable is marked `final`, your variable cannot be re-assigned, even though the underlying value can mutate.

This turns out to be the most confusing part of `final`.

What about this?

```java
for (final Object obj : objs) {
    obj = new Object();
}
```

It looks a little funny to have an iterator declared `final` but works because `obj` is declared on each iteration of the loop. If you try to re-assign `obj` in the loop, the compiler will complain:

```java
List<Object> objs = new ArrayList<Object>();
objs.add(new Object());
for (final Object obj : objs) {
    obj = new Object();
}
```
```console
error: variable obj might already have been assigned
    obj = new Object();
    ^
1 error
```

## Methods

Declare your class methods `final` if you do not want subclasses overriding or hiding them<sup>[§8.4.3.3](https://docs.oracle.com/javase/specs/jls/se7/html/jls-8.html#jls-8.4.3.3)</sup>. With a little simplifying, Wikipedia's [example](https://en.wikipedia.org/wiki/Final_(Java)#Final_methods) is good enough for this post:

```java
class Base {
    public void m1() { }
    public final void m2() { }
    public static void m3() { }
    public static final void m4() { }
}

class Derived extends Base {
    public void m1() { }  // OK, overriding Base#m1()
    public void m2() { }  // forbidden
    public static void m3() { }  // OK, hiding Base#m3()
    public static void m4() { }  // forbidden
}
```
Compiling produces the following errors
:
```console
error: m2() in Derived cannot override m2() in Base
    public void m2() { }  // forbidden
                ^
  overridden method is final

error: m4() in Derived cannot override m4() in Base
    public static void m4() { }  // forbidden
                       ^
  overridden method is static,final
2 errors
```

## Classes

Declaring a class `final` just extends (probably a bad word choice given the forthcoming definition) the concept of a `final` method: "It is a compile-time error if the name of a final class appears in the extends clause."<sup>[§8.1.1.2](https://docs.oracle.com/javase/specs/jls/se7/html/jls-8.html#jls-8.1.1.2)</sup>. In other words, if you don't want your class subclassed, declare it `final`.

Naturally, a `final` class cannot also be `abstract`. But let's see what happens just in case.

```java
final abstract class Base { }
```
```console
error: illegal combination of modifiers: abstract and final
final abstract class Base { }
               ^
1 error
```

## Immutability

Here's an interesting situation first pointed out to me by [Paul Roberts](https://twitter.com/mooooooose).

Suppose you've decided that immutability is important to you. You've written a new class with no setters and literally codified your intent by declaring your field `final` like so:

```java
class GoodyBag {
    private final String[] goodies = new String[] {
        "Skittles", 
        "Tootsie Rolls", 
        "Twix" 
    };
  
    public String[] getGoodies() {
        return goodies;
    }
  
    public void printGoodyBag() { // does the obvious thing }
}
```
An enterprising collaborator can modify the data referenced in your field by calling the getter and simply setting it:

```java
public class Main {
    public static void main(String[] args) {
        GoodyBag goodyBag = new GoodyBag();
        goodyBag.printGoodyBag();
        String[] goodies = goodyBag.getGoodies();
        goodies[0] = "Broccoli";
        goodyBag.printGoodyBag();
    }
}
```
```console
Skittles
Tootsie Rolls
Twix
---
Broccoli <--------------- whoa, who put this here?
Tootsie Rolls
Twix
```

(Side note: `final` doesn't matter here. Remove it and you get the same result.)

Achieving actual immutability is straightforward. Have your getter return a copy of underlying data:

```java
public String[] getGoodies() {
    return goodies.clone(); // <--------- yeah, that's all you have to do
}
```
```console
Skittles
Tootsie Rolls
Twix
---
Skittles <--------------- obviously unchanged
Tootsie Rolls
Twix
```

## Conclusion

Java's `final` keyword is kinda overloaded. It keeps other people from re-assigning your variables, overriding or hiding your methods and sub-classing your classes, all at compile time.
