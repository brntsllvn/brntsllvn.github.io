---
layout: post
title:  "Java Throws by Example"
date:   2018-11-20 21:00:00 -0700
categories: java
---

## Motivation
C# does not have an equivalent to Java's `throws` declaration, so here's a closer look. 

Java has three types of exceptions: _checked_, _runtime_, and _error_ (runtime and error together are called _unchecked exceptions_). Unchecked exceptions apparently occur due to "bad programming" <sup>[an opinion](https://crunchify.com/better-understanding-on-checked-vs-unchecked-exceptions-how-to-handle-exception-better-way-in-java/)</sup> (fwiw, I think it's a little more nuanced than that).

## Errors

Errors indicate "serious problems that a reasonable application should not try to catch" <sup>[the docs](https://docs.oracle.com/javase/8/docs/api/java/lang/Error.html)</sup> and "abnormal conditions that should never occur." <sup>[other docs](http://www.docjar.com/docs/api/java/lang/Error.html)</sup>

Here's an example:

```java
public class Main {
  public static void main(String[] a) {
    foo();
  }

  public static void foo() {
    foo();
  }
}
```

This method will crank away for a while before giving up:

```console
Exception in thread "main" java.lang.StackOverflowError
    at Main.foo(Main.java:7)
    at Main.foo(Main.java:7)
    ...
```

Errors are subclasses of `java.lang.Error` that are "regarded as unchecked exceptions for the purposes of compile-time checking of exceptions."<sup>[the docs (again)](https://docs.oracle.com/javase/8/docs/api/java/lang/Error.html)</sup>, but they're not technically exceptions. 

My favorites are: `java.lang.StackOverflowError` and `java.lang.OutOfMemoryError`

Anyway, catching an error is a "bad practice" <sup>[nonono](https://stackoverflow.com/a/11018879/4097181)</sup> probably because "by their nature, such errors are difficult to predict and difficult to handle" <sup>[§15.6](https://docs.oracle.com/javase/specs/jls/se7/html/jls-15.html#jls-15.6)</sup> and it's best to write better code. Nonetheless, here's me catching an error:

```java
class Main {
  public static void main(String[] args) {
    try {
      long[] arr = new long[Integer.MAX_VALUE];
    } catch (Error err) {
      System.out.println("I caught an error");
    }
  }
}
```
Without the try/catch, this would normally be a `java.lang.OutOfMemoryError` (yep, an error...not exception). Interestingly, I haven't found mention of `catch` accepting an `Error` (usually it just catches an `Exception` or more likely a `Throwable` now that I think of it).

## Runtime Exceptions

Runtime exceptions share a parent with errors, `java.lang.Throwable`, but are different because, unlike errors, runtime exceptions are not a complete meltdown. They can "propagate outside the method or constructor boundary" <sup>[Runtime stuff...](https://docs.oracle.com/javase/8/docs/api/java/lang/RuntimeException.html)</sup> but a "reasonable" <sup>[official stuff](http://www.docjar.com/docs/api/java/lang/Exception.html)</sup> application might want to catch them...but they're _unchecked_ so we do not have to catch them.

Here's an example:

```java
public class Main {
  public static void main(String[] a) {
    int i = 1 / 0;
  }
}
```
```console
Exception in thread "main" java.lang.ArithmeticException: / by zero
```

## Checked Exceptions: Throw and Throws

Ok, but the reason I'm writing this whole thing is because I want to know how `throws` works.

Suppose we have this:

```java
public static void main(String args[]) 
{ 
    biergarten(20); 
} 

static void biergarten(int userAge) 
{ 
    System.out.println("beertime"); 
} 
```

Compiling just produces "beertime." But I want to "abruptly" <sup>["abruptly"](https://docs.oracle.com/javase/specs/jls/se7/html/jls-11.html)</sup> complete execution (i.e. by throwing an exception) when my program encounters underage drinking, so I add a conditional:

```java
public static void main(String args[]) 
{ 
    biergarten(20); 
} 

static void biergarten(int userAge) 
{ 
    if (userAge < 21) {
        throw new IllegalAccessException("drinking age is 21");
    }
    System.out.println("beertime"); 
} 
```

This is an exceptional situation:

```console
error: unreported exception IllegalAccessException; must be caught or declared to be thrown
	        throw new IllegalAccessException("drinking age is 21");
	        ^
1 error
```

Since `IllegalAccessException` is a checked exception (i.e. it is not an error or runtime exception), I have two options for solving this problem:
  + catch the exception (i.e. handle it right away)
  + declare the exception (i.e. bubble it up to the caller)

Let's see what happens when I catch the exception right away:

```java
public static void main(String args[]) 
{ 
    biergarten(20); 
} 

static void biergarten(int userAge)
{ 
    try {
        if (userAge < 21) {
            throw new IllegalAccessException("drinking age is 21");
        }	        
        System.out.println("beertime"); 
    } catch (Exception e) {
        System.out.println("no underage drinking");
    }
} 
```

```console
no underage drinking
```

We catch the error right away. Hooray.

What about the second option, declaring the exception?

```java
public static void main(String args[]) 
{ 
    biergarten(20); 
} 

static void biergarten(int userAge) throws IllegalAccessException 
{ 
    if (userAge < 21) {
        throw new IllegalAccessException("drinking age is 21");
    }	        
    System.out.println("beertime"); 
} 
```
But this does not compile:

```java
error: unreported exception IllegalAccessException; must be caught or declared to be thrown
		biergarten(20); 
		          ^
1 error
```

The crucial point here is that the _caller_ must now handle the exception, and as a consequence, I have to wrap the _caller_ with a try/catch:

```java
public static void main(String args[]) 
{ 
    try {
        biergarten(20); 	        
    } catch (Exception e) {
        System.out.println("you meddling kids!");
    }
}
```

What's interesting about this language design choice is that the `throws` declaration in the method signature is now part of the contract that the caller must satisfy. I like this a lot now that I've dug into it. 

Anyway, these two options are called the "[The Catch or Specify Requirement](https://docs.oracle.com/javase/tutorial/essential/exceptions/catchOrDeclare.html)" and, again, only apply to checked exceptions.

## Conclusion

I feel I've only scratched the surface on exceptions, but needed to investigate `throws` more thoroughly because it has no cognate in C#. Remember the Catch or Specify requirement for checked exceptions and keep in mind the extra challenges of dealing with runtime exceptions and errors. 
