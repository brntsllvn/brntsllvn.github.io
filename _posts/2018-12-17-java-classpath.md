---
layout: post
title:  "The classpath"
date:   2018-12-17 21:00:00 -0700
categories: java
---

## Motivation

IDEs make it easy to fudge knowledge about the classpath. Oftentimes I create a new project, IntelliJ does some stuff and then I click a little green triangle and my program runs. That feels...unsatisfactory, so today (tonight really), I'm digging into the classpath.

Really quick: this post is not about the `CLASSPATH` environment variable. The official docs suggest not using it (interestingly, Kevin Boone suggests using it when including entries in addition to the default system classpath <sup>[Boone](http://kevinboone.net/classpath.html)</sup>), but it's not my focus here.

Finally: I'm leaning heavily on material presented by others. I recommend reading their stuff and will link to it throughout this post. I'll try some novel stuff, but I'm mostly summarizing their work for my benefit.

## Class Search Path

The "classpath" is short for the "class search path," which gives some indication of what it does: it tells the JDK tool you're using (e.g. `java` or `javac`) where to find classes and resource files. I'll follow along with [Kevin Boone's example](http://kevinboone.net/classpath.html) and experiment a bit.

Suppose I have some classes in a structure like this:

```console
.
└── com
    └── brent
        ├── Pizza.java
        └── TomatoSauce.java
```

```java
package com.brent;
public class TomatoSauce {
    public static void main(String[] args) {
        // noop
    }
}

package com.brent;
public class Pizza {
    public static void main(String[] args) {
        TomatoSauce tomatoSauce = new TomatoSauce();
    }
}
```
I'll do as Boone suggests and clear the classpath to see what happens before I add anything to it. Trying to compile from the current directory (see little tree diagram above) does not work:

```console
$ javac -classpath ""
javac: no source files
```

Descending a directory might help...:

```console
.
└── brent
    ├── Pizza.java
    └── TomatoSauce.java

$ javac -classpath ""
javac: no source files
```

Nope. Descending again...:

```console
.
├── Pizza.java
└── TomatoSauce.java

$ javac -classpath ""
javac: no source files
```

No luck. But that's as far down the tree as we can go. So I have to try something else. What about specifying a file directly (still without touching the classpath)?

```console
.
├── Pizza.java
└── TomatoSauce.java

$ javac -classpath "" TomatoSauce.java 
```

This works. Clearing the `.class` file first, what happens when I try to compile `Pizza`?

```console
$ rm *.class
$ javac -classpath "" Pizza.java 
Pizza.java:5: error: cannot find symbol
        TomatoSauce tomatoSauce = new TomatoSauce();
        ^
  symbol:   class TomatoSauce
  location: class Pizza
```

Compilation fails because `Pizza` cannot find `TomatoSauce` even though they are in the same package. 

Boone suggests we try adding the current directory `.` to the classpath:

```console
$ javac -classpath "." Pizza.java 
Pizza.java:5: error: cannot find symbol
        TomatoSauce tomatoSauce = new TomatoSauce();
        ^
  symbol:   class TomatoSauce
  location: class Pizza
```

But we get the same error, because, as he describes it, we are telling the compiler to "_begin a class search_ from the current directory" (emphasis his) rather than telling the compiler to include everything from the current directory. To fix the issue, we need to _start_ the search from the proper altitude:

```console
$ javac -classpath "../.." Pizza.java
```

This works. And, of course, so does the following (analogous) code:

```console
$ cd ..
.
└── brent
    ├── Pizza.java
    └── TomatoSauce.java
$ javac -classpath ".." brent/Pizza.java
```

The crucial thing is where the search _begins_. 

According to the (very confusingly-worded) [How Classes are Found](https://docs.oracle.com/javase/7/docs/technotes/tools/findingclasses.html) official docs, there's a close relationship between a directory and a package (Boone calls it a "fundamental rule"). 

Taking the above example to its logical limit, we get the familiar "default value" classpath: 

```console
$ cd ..
.
└── com
    └── brent
        ├── Pizza.java
        └── TomatoSauce.java
$ javac -classpath "." com/brent/Pizza.java
```

This compiles just fine and hopefully motivates that the class search path must begin at the root.

## Conclusion
