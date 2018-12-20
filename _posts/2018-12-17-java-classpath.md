---
layout: post
title:  "The classpath"
date:   2018-12-17 21:00:00 -0700
categories: java
---

## Motivation

IDEs make it easy to fudge knowledge about the classpath. Oftentimes I create a new project, IntelliJ does some stuff and then I click a little green triangle and my program runs. That feels...unsatisfactory, so today (tonight really), I'm digging into the classpath.

## javac

Taking the simplest-possible example, suppose I have the following:

```console
.
└── Pizza.java
```
```java
// Pizza.java
public class Pizza {}
```

Compiling works as expected and produces Pizza.class:

```console
$ javac Pizza.java
.
├── Pizza.class
└── Pizza.java
```

But this doesn't tell me much, so I'll remove the `.class` file add the extremely elucidating `-verbose` flag:

```console
$ rm *.class
$ javac -verbose Pizza.java
```
```console
[parsing started RegularFileObject[Pizza.java]]
[parsing completed 29ms]
[search path for source files: .]
[search path for class files: /Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/resources.jar,/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar,/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/sunrsasign.jar,/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/jsse.jar,/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/jce.jar,/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/charsets.jar,/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/jfr.jar,/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/classes,/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/ext/sunec.jar,/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/ext/nashorn.jar,/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/ext/cldrdata.jar,/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/ext/jfxrt.jar,/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/ext/dnsns.jar,/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/ext/localedata.jar,/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/ext/sunjce_provider.jar,/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/ext/sunpkcs11.jar,/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/ext/jaccess.jar,/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/ext/zipfs.jar,/System/Library/Java/Extensions/MRJToolkit.jar,.]
[loading ZipFileIndexFileObject[/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/lib/ct.sym(META-INF/sym/rt.jar/java/lang/Object.class)]]
[checking Pizza]
[loading ZipFileIndexFileObject[/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/lib/ct.sym(META-INF/sym/rt.jar/java/io/Serializable.class)]]
[loading ZipFileIndexFileObject[/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/lib/ct.sym(META-INF/sym/rt.jar/java/lang/AutoCloseable.class)]]
[wrote RegularFileObject[Pizza.class]]
[total 324ms]
```

This output is still too complicated, so I'll zero everything out to clean up the output:

```console
$ rm *.class
$ javac -verbose -extdirs "" -bootclasspath "" Pizza.java
[parsing started RegularFileObject[Pizza.java]]
[parsing completed 30ms]
[search path for source files: .]
[search path for class files: .]
Fatal Error: Unable to find package java.lang in classpath or bootclasspath
```

This is a lot cleaner, but I went too far. `Unable to find package java.lang` tells me I have to include the `jar` that contains `java.lang`:

```console
$ javac -verbose -extdirs "" -bootclasspath "/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar" Pizza.java
[parsing started RegularFileObject[Pizza.java]]
[parsing completed 30ms]
[search path for source files: .]
[search path for class files: /Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar,.]
[loading ZipFileIndexFileObject[/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar(java/lang/Object.class)]]
[checking Pizza]
[loading ZipFileIndexFileObject[/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar(java/io/Serializable.class)]]
[loading ZipFileIndexFileObject[/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar(java/lang/AutoCloseable.class)]]
[wrote RegularFileObject[Pizza.class]]
[total 403ms]
```

How did I know to add `/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar` to the `-bootclasspath`? This is worth a tiny digression.

## A Tiny Digression

When I first ran `javac` with the `-verbose` option, I got a lot of output. In particular, I noticed the following message:
```console
[loading ZipFileIndexFileObject[/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/lib/----> rt.jar <----/java/lang/Object.class)]]
```
(I added the little arrows to make it obvious `rt.jar` is loaded by some classloader) 

You can confirm `java/lang/Object.class` lives in `rt.jar` by inspecting the contents:
 ```console
 $ jar tz /Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar
 ...
 java/lang/Object.class
 ...
 ```
 
 Straight outta the docs: "rt.jar -- the bootstrap classes (the RunTime classes that comprise the Java platform's core API)." <sup>[JDK and JRE File Structure](https://docs.oracle.com/javase/7/docs/technotes/tools/solaris/jdkfiles.html)</sup>
 
Side note: it turns out I can also add `.../rt.jar` to the `-classpath` and get the same result.

What really matters here is that I don't need all the other jars on the `-bootclasspath`.

Can I put `rt.jar` on `-extdirs`? `-extdirs` corresponds the extensions classloader, which looks for classes in the `.ext` package. `rt.jar` does not have any classes in the `.ext` package, so the extensions classloader will not load anything from `rt.jar` (i.e. this doesn't work).

Nested digression: the compiler uses three classloaders (in this order): 1) Bootstrap, 2) Extension and 3) System. You can read more about the class loading hierarchy in [this excellent blog post](https://blog.cdap.io/2015/08/java-class-loading-and-distributed-data-processing-frameworks/), but they're not the focus here.

The takeaway from this whole digression is that the following command is my home base because it reamoves all unnecessary information and I'll use it for the rest of this post to _finally_ talk about `-classpath`.

```console
javac -verbose -extdirs "" -bootclasspath "/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar" Pizza.java
```

## Back to javac

I want to make this a little more realistic, so I'll add a dependency to `Pizza.java`:

```java
// Pizza.java
public class Pizza {
    Sauce sauce = new Sauce();
}

// Sauce.java
public class Sauce {}
```

Compiling, using my lengthy command:

```console
$ javac -verbose -extdirs "" -bootclasspath "/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar" Pizza.java
[parsing started RegularFileObject[Pizza.java]]
[parsing completed 28ms]
[search path for source files: .]
[search path for class files: /Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar,.]
[loading ZipFileIndexFileObject[/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar(java/lang/Object.class)]]
[loading RegularFileObject[./Sauce.java]]
[parsing started RegularFileObject[./Sauce.java]]
[parsing completed 1ms]
[checking Pizza]
[loading ZipFileIndexFileObject[/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar(java/io/Serializable.class)]]
[loading ZipFileIndexFileObject[/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar(java/lang/AutoCloseable.class)]]
[wrote RegularFileObject[Pizza.class]]
[checking Sauce]
[wrote RegularFileObject[./Sauce.class]]
[total 399ms]
```

`-verbose` is really amazing. It confirms `Pizza.java` is my focus because that's where the parsing starts, then it briefly mentions the classpath (albeit cryptically) `[search path for source files: .]` and then writes `Pizza.class` and `Sauce.class`. That's excellent but I still have not touched the `-classpath` yet. So I will continue making my example more interesting.

## Packages

Suppose I put my classes in packages now. That's what everyone does, right? And it's supposed to make the `-classpath`, hard, right? See [this blog post](https://www.antwerkz.com/?author=4ea18300d09aa9e3f3298e5e) if you want to be called a "beginner" 4 times (this flavor of condescension is one of my pet-peaves...).

Anyway, take a gander at the following same classes, now in a package:

```console
.
└── food
    └── machine
        ├── Pizza.java
        └── Sauce.java
```
```java
package food.machine;
public class Sauce {}

package food.machine;
public class Pizza {
    Sauce sauce = new Sauce();
}
```

Compiling, we get an error:

```console
$ javac -verbose -extdirs "" -bootclasspath "/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar" Pizza.java
javac: file not found: Pizza.java
```

This makes sense. `Pizza.java` is now in a package (and corresponding nested directory) called `food.machine` so I have to refer to it relatively:

```console
$ javac -verbose -extdirs "" -bootclasspath "/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar" food/machine/Pizza.java
[parsing started RegularFileObject[food/machine/Pizza.java]]
[parsing completed 30ms]
[search path for source files: .]
...
```

This works just fine. `-classpath` defaults to the current directory, `.`, so I make my source file relative to `.`, no problem.

## out

I still haven't touched `-classpath`, but hopefully with the motivation above, the following stuff seems easier than just dropping you in at this point.

Usually folks (and IDEs) tell the compiler to deposit their `.class` files in a different directory. I can do this by adding the `-d` option to the compiler command:

```console
$ mkdir out
.
├── food
│   └── machine
│       ├── Pizza.java
│       └── Sauce.java
└── out

$ javac -verbose -d out -extdirs "" -bootclasspath "/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar" food/machine/Pizza.java
[parsing started RegularFileObject[food/machine/Pizza.java]]
...
[search path for source files: .]
...
[loading RegularFileObject[./food/machine/Sauce.java]]
[parsing started RegularFileObject[./food/machine/Sauce.java]]
...
[wrote RegularFileObject[out/food/machine/Sauce.class]]
...
  
.
├── food
│   └── machine
│       ├── Pizza.java
│       └── Sauce.java
└── out
    └── food
        └── machine
            ├── Pizza.class
            └── Sauce.class
```

So, above, I add `-d out` to my compiler command and the compiler helpfully places my `.class` files in my new `out` directory with a directory structure that matches my sources. I could continue compiling in this way, but it's inefficient. 

`Pizza` depends on `Sauce` but if I make a change to `Pizza` only, I don't need to re-compile `Sauce`. To take advantage of this, I will use the `-classpath` option:

```java
package food.machine;
public class Pizza {
    Sauce sauce = new Sauce();
    // some change
}
```

Compiling again, but this time taking advantage of the `-classpath` option, I get:

```console
$ javac -verbose -d out -classpath out -extdirs "" -bootclasspath "/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar" food/machine/Pizza.java
[parsing started RegularFileObject[food/machine/Pizza.java]]
...
[search path for source files: out]
...
[loading RegularFileObject[out/food/machine/Sauce.class]]
...
```

The first thing to notice is that `out` is in the class search path (`[search path for source files: out]`). So the compiler will try to get `.class` files from that location before compiling from sources. 

The next interesting thing is that when I use the `-classpath` option, I only load `Sauce.class`, rather than previously loading `Sauce.java`, then parsing it, then writing `Sauce.class`. This is a much trimmer operation and although the example here is small, you can image the compile-time savings adding up if a project contains hundreds or thousands of classes that need to be compiled but have not changed. 

## lib

Upping the stakes a bit, suppose I introduce a dependency whose `.class` files live in a jar (I've already done this with `rt.jar` but it's worth doing an explicit example).

To do so, I add a `lib` directory to my project, download (arbitrarily) `guava-27.0.1-jre.jar` and place the jar there. When that's done, my file structure looks like this:

```console
.
├── food
│   └── machine
│       ├── Pizza.java
│       └── Sauce.java
├── lib
│   └── guava-27.0.1-jre.jar
└── out
    └── food
        └── machine
            ├── Pizza.class
            └── Sauce.class
```  

Now I'll make a tiny change to `Pizza.java`:

```java
package food.machine;
public class Pizza {
    Sauce sauce = new Sauce();
    Boolean isPrime = com.google.common.math.IntMath.isPrime(3);
}
```

Compiling:
```java
$ javac -verbose -d out -classpath out -extdirs "" -bootclasspath "/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar" food/machine/Pizza.java
[parsing started RegularFileObject[food/machine/Pizza.java]]
...
[search path for source files: out]
...
food/machine/Pizza.java:4: error: package com.google.common.math does not exist
    Boolean isPrime = com.google.common.math.IntMath.isPrime(3);
                                            ^
```

The compiler cannot find `guava-27.0.1-jre.jar` because it is not on the class search path, which, from the output above `[search path for source files: out]`, only contains `out`. This is an easy fix, I just add the jar to the class search path after a colon `:` and compile again:

```java
$ javac -verbose -d out -classpath out:lib/guava-27.0.1-jre.jar -extdirs "" -bootclasspath "/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar" food/machine/Pizza.java
[parsing started RegularFileObject[food/machine/Pizza.java]]
...
[search path for source files: out,lib/guava-27.0.1-jre.jar]
...
[loading ZipFileIndexFileObject[lib/guava-27.0.1-jre.jar(com/google/common/math/IntMath.class)]]
[loading ZipFileIndexFileObject[lib/guava-27.0.1-jre.jar(com/google/common/annotations/GwtCompatible.class)]]
...
[wrote RegularFileObject[out/food/machine/Pizza.class]]
...
```

NOTE: I can't just drop in the jar, I need to provide its path too. 



## Conclusion

I spent a ton of time understanding the class search path. Stumbling on the `-verbose` flag yielded enormous benefits. I read blogs and the docs (see my sources below) but the _point_ of the classpath and bending it to my will wasn't clicking until I stripped everything away and started experimenting. This is a slow process but I'm glad I went through it and hopefully I've saved you some time with the presentation above.

## Sources

Blogs

+ [Kevin Boone: Mastering the Java CLASSPATH](http://kevinboone.net/classpath.html)
+ [Terence Yim: Java Class Loading and Distributed Data Processing Frameworks](https://blog.cdap.io/2015/08/java-class-loading-and-distributed-data-processing-frameworks/)
+ [Justin Lee: The Classpath](https://www.antwerkz.com/?author=4ea18300d09aa9e3f3298e5e)

Official
+ [Setting the Class Path](https://docs.oracle.com/javase/8/docs/technotes/tools/windows/classpath.html)
+ [How Classes are Found](https://docs.oracle.com/javase/7/docs/technotes/tools/findingclasses.html)
+ [JDK and JRE File Structure](https://docs.oracle.com/javase/7/docs/technotes/tools/solaris/jdkfiles.html)
+ [javac - Java programming language compiler](https://docs.oracle.com/javase/7/docs/technotes/tools/windows/javac.html)
