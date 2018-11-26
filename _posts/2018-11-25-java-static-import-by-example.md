---
layout: post
title:  "Java Static Import by Example"
date:   2018-11-25 21:00:00 -0700
categories: java
---

## Motivation

I noticed `import static` in production code the other day and thought I'd look into it. 

The [Java docs](https://docs.oracle.com/javase/8/docs/technotes/guides/language/static-import.html) explain that accessing static members requires qualification. For example:

```java
class Circle {
    public double getArea(double radius) {
        return Math.PI * radius * radius;
    }
}
```

We type `Math` before `PI` to tell the compiler which class `PI` belongs to or else we get a compiler-time error:

```console
Main.java:5: error: cannot find symbol
    return PI * radius * radius;
           ^
  symbol:   variable PI
  location: class Circle
1 error
```

Typing `Math` over and over again is annoying. So we have some solutions that mean less typing.

## A Bad Solution

One way to avoid typing `Math` over and over again is to create an interface and force the class using `PI` to implement that interface:

```java
interface ConstantInterface {
    public static final double PI = 3.14159;
}

class Circle implements ConstantInterface {
    public double getArea(double radius) {
        return PI * radius * radius;
    }
}
```

But now we've exposed `PI`, an implementation detail, in our public API. Yuck. 

It's possibly unrelated, but in Arthur C. Clark's "[Time's Eye](https://en.wikipedia.org/wiki/Time%27s_Eye_(novel))" `PI` (the ratio of a circle's circumference to diameter) is, inexplicably, 3.

So, supposing I don't want to type `WeirdMath.WeirdPI` over and over, I will add `WeirdPI` to my interface. This is awkward because now everything implementing `ConstantInterface` has both `PI` and `WeirdPI`, and an implementing class will never need both.

Another drawback is that I can simply overwrite `PI` (perhaps accidentally):

```java
interface ConstantInterface {
    public static final double PI = 3.14159;
}

class Circle implements ConstantInterface {
    public static final double PI = 12;
    public double getArea(double radius) {
        return PI * radius * radius;
    }
}
```

It's also especially confusing because `PI` is `final` and my expectation is that `PI` will never change so now I have to go through each implementing class and double-check no one overwrote `PI`. 

"This is a bad idea" says [@joshbloch](https://twitter.com/joshbloch) on the [Static Import](https://docs.oracle.com/javase/8/docs/technotes/guides/language/static-import.html) documentation page. Creating an interface just to save some class qualification keystrokes ends up being such a bad idea that it has its own name, the [Constant Interface Antipattern](https://en.wikipedia.org/wiki/Constant_interface).


## Import Static Means Less Typing

To avoid the annoyance of typing `Math` over and over again, there is a simple solution: `import static`. The following does the trick:

```java
import static java.lang.Math.PI;

class Circle {
    public double getArea(double radius) {
        return PI * radius * radius;
    }
}
```

Hooray! Less typing! (the example above is too brief to really capture the savings but supposing I had a `Math`-heavy, computational class, with lots of square roots, sin, cos, tan, whatever, then the actual savings would be more apparent).

But we still have a major problem: `import static` does not eliminate "silently" overwriting constants. The following slight variation on an earlier example works:

```java
import static java.lang.Math.PI;

class Circle implements ConstantInterface {
    public double getArea(double radius) {
        final double PI = 18;
        return PI * radius * radius;
    }
}
```

Boo.

## Conclusion

Typing a qualifying namespace over and over again can be annoying, but introducing an interface to force adoption of constants simply for brevity is silly. 

Static imports help...a little. We save some keystrokes and the docs argue your code might be _more_ readable (emphasis theirs) since you're not typing the qualifying class name over and over, but we still introduce the possibility of overwriting what we expect to be constants. 

Perhaps the safest choice just sucking it up and writing the qualifying class name. The following behaves as expected and we don't have to worry about overwriting the constant.

```java
class Circle {
    public double getArea(double radius) {
        final double PI = 18;
        return Math.PI * radius * radius;
    }
}
```

Same with this minor variation:

```java
class Circle {
    public static final double PI = 18;
    public double getArea(double radius) {
        return Math.PI * radius * radius;
    }
}
```

We're back at where we started but we have not introduced any weird side effects from trying to save some qualifying class keystrokes.



