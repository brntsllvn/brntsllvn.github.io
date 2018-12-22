---
layout: post
title:  "The class path, class search path, classpath thing...and you"
date:   2018-12-20 21:00:00 -0700
categories: java
---

## Motivation

This post is about the class path (short for the "class search path" <sup>[docs](https://docs.oracle.com/javase/8/docs/technotes/tools/windows/classpath.html)</sup> and also un-officially one-worded as "classpath" <sup>[Boone](http://kevinboone.net/classpath.html)</sup> and maybe more precisely referred-to as the `-classpath` option), "the path that the Java Runtime Environment (JRE) searches for classes and other resource files."

IDEs make it easy to forget about the classpath. Oftentimes I create a new project, my IDE does some stuff, then I click a little green triangle and my program compiles or runs or whatever. Today I'm breaking down the `-classpath` option from the beginning.



## javac

Taking the simplest-possible example, suppose I have the following:

```console
.
└── Pizza.java

// Pizza.java
public class Pizza {}
```

Compiling is straightforward and produces Pizza.class:

```console
$ javac Pizza.java
.
├── Pizza.class
└── Pizza.java
```

But this does not tell me much, so I'll start from scratch by removing the `.class` file, and add the extremely elucidating `-verbose` flag:

```console
$ rm *.class
.
└── Pizza.java

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

Adding the `-verbose` option outputs "messages about what the compiler is doing." But the output is dense and I would like to clean it up, so I'll zero-out everything. Note: from here on out, I'm splitting the command over several lines, one option per line, to make it easier to read. 

```console
$ javac \
  -verbose \
  -classpath "" \
  -extdirs "" \
  -bootclasspath "" \
  Pizza.java
```
```
[parsing started RegularFileObject[Pizza.java]]
[parsing completed 30ms]
[search path for source files: .]
[search path for class files: .]
Fatal Error: Unable to find package java.lang in classpath or bootclasspath
```

Setting each of these options, `-classpath`, `-extdirs` and `-bootclasspath` to `""` sets them to their defaults, the current directory `.`. And for anyone who is curious, `[search path for source files: .]` maps to the `-classpath` option and `[search path for class files: .]` maps to the `-extdirs` and `-bootclasspath` options.

This is a lot cleaner, but I went too far. The error message above, `Unable to find package java.lang`, tells me I have to include the `jar` that contains `java.lang` somewhere in my command:

```console
$ javac \
  -verbose \
  -classpath "" \
  -extdirs "" \
  -bootclasspath "/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar" \
  Pizza.java
```
```
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

Compilation successfully completes (i.e. Pizza.class is created), but how did I know to add `/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar` to the `-bootclasspath`? Well, the error reads "Unable to find package java.lang in classpath or bootclasspath" so that tells me _where_ I need to put the jar containing the package `java.lang` but not _which_ jar actually contains `java.lang`. 

Looking at, say, this line from the original `javac -verbose Pizza.java` command, gives me the answer:

```console
[loading ZipFileIndexFileObject[/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/lib/ct.sym(META-INF/sym/rt.jar/java/lang/Object.class)]]
``` 

The compiler loads `Object.class`, which lives in `java/lang`, which lives in `rt.jar`.

Side note: this might seem like a trivial observation...but...uh...it was _not_. I learned about classloaders from [this excellent blog post](https://blog.cdap.io/2015/08/java-class-loading-and-distributed-data-processing-frameworks/), and stumbled on some discussion about the `rt.jar` on Stack Overflow or something, then read [JDK and JRE File Structure](https://docs.oracle.com/javase/7/docs/technotes/tools/solaris/jdkfiles.html), then noodled for a bit, re-read the error message and finally _got it_.

The bottom line is I will use the following command as my baseline from here. It reveals the information I need without bloating the console output.

```console
javac \
-verbose \
-classpath "" \
-extdirs "" \
-bootclasspath "/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar" \
Pizza.java
```

## javac continued...

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
$ javac \
  -verbose \
  -classpath "" \
  -extdirs "" \
  -bootclasspath "/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar" \
  Pizza.java
```
```console
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

Suppose I put my classes in a package. That's what everyone does, right? And it's supposed to make the `-classpath`, hard, right? See [this blog post](https://www.antwerkz.com/blog/the-classpath) if you want to be called a beginner four times (this flavor of condescension is one of my pet-peaves...) and look [here](http://kevinboone.net/classpath.html) for the reality check that "there is a widespread lack of comprehension, even among experienced developers" about the `-classpath` option. I'm just saying that humility is a real thing.

Anyway, look at the following same classes, now in a package:

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

Compiling, using the same command...

```console
$ javac \
  -verbose \
  -classpath "" \
  -extdirs "" \
  -bootclasspath "/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar" \
  Pizza.java
```
I get an error:
```console
javac: file not found: Pizza.java
```

This makes sense. `Pizza.java` is now in a package (and corresponding nested directory) called `food.machine` so I have to refer to it relatively:

```console
$ javac \
  -verbose \
  -classpath "" \
  -extdirs "" \
  -bootclasspath "/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar" \
  food/machine/Pizza.java
```
```console
[parsing started RegularFileObject[food/machine/Pizza.java]]
[parsing completed 30ms]
[search path for source files: .]
...
```

This works just fine. `-classpath` defaults to the current directory, `.`, so I make my source file relative to `.`, no problem.

## out

I still haven't really done anything with the `-classpath` option yet (except zero it out), but hopefully with the motivation above, the following stuff seems easier than just dropping you in at this point.

Usually folks (and IDEs) tell the compiler to deposit their `.class` files in a different directory. I can do this by adding the `-d` option to the compiler command along with a new directory called `out`:

```console
$ mkdir out
.
├── food
│   └── machine
│       ├── Pizza.java
│       └── Sauce.java
└── out

$ javac \
  -verbose \
  -d out \
  -classpath "" \
  -extdirs "" \
  -bootclasspath "/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar" \
  food/machine/Pizza.java
```
```console
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

So, above, I add `-d out` to my compiler command and the compiler helpfully places my `.class` files in my new `out` directory with a directory structure that mirrors my sources. I could continue compiling in this way, but it's inefficient. 

## Avoid compiling when possible

`Pizza` depends on `Sauce` but if I make a change to `Pizza` only, I don't need to re-compile `Sauce`. To take advantage of this, I will (finally) use the `-classpath` option. Here is a little change to `Pizza`:

```java
package food.machine;
public class Pizza {
    Sauce sauce = new Sauce();
    // some change
}
```

Compiling again, but this time taking advantage of the `-classpath` option by adding `out` (where my `.class` bytecode files live)...

```console
$ javac \
  -verbose \
  -d out \
  -classpath out \
  -extdirs "" \
  -bootclasspath "/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar" \
  food/machine/Pizza.java
```
 I get:
```console
[parsing started RegularFileObject[food/machine/Pizza.java]]
...
[search path for source files: out]
...
[loading RegularFileObject[out/food/machine/Sauce.class]]
...
```

Notice that `out` is in the class search path: `[search path for source files: out]`. So the compiler will try to get `.class` files from that location before compiling from sources. I load `Sauce.class`, the _bytecode_, rather than loading/parsing/writing `Sauce.java`, the _source code_.


This is a much trimmer operation and you can image the compile-time savings if a project contains hundreds or thousands of classes that do not need to compile because they have not changed.

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

Now I'll make a tiny change to `Pizza.java` that depends on a class in `guava-27.0.1-jre.jar`:

```java
package food.machine;
public class Pizza {
    Sauce sauce = new Sauce();
    Boolean isPrime = com.google.common.math.IntMath.isPrime(3);
}
```

Compiling:
```java
$ javac \
  -verbose \
  -d out \
  -classpath out \
  -extdirs "" \
  -bootclasspath "/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar" \
  food/machine/Pizza.java
```
I get an error:
```console
[parsing started RegularFileObject[food/machine/Pizza.java]]
...
[search path for source files: out]
...
food/machine/Pizza.java:4: error: package com.google.common.math does not exist
    Boolean isPrime = com.google.common.math.IntMath.isPrime(3);
                                            ^
```

The compiler does not know `guava-27.0.1-jre.jar` exists. It retrieves the classes in each directory or jar specified in the class search path and cannot find `com.google.common.math` and throws. This is easy to fix, I just add `guava-27.0.1-jre.jar` to the class search path after a colon `:` and compile again:

```java
javac \
-verbose \
-d out \
-classpath out:lib/guava-27.0.1-jre.jar \
-extdirs "" \
-bootclasspath "/Library/Java/JavaVirtualMachines/jdk1.8.0_101.jdk/Contents/Home/jre/lib/rt.jar" \
food/machine/Pizza.java
```
```console
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

Hooray! The code compiles!

Note that `lib/guava-27.0.1-jre.jar`, which I added to the `-classpath` option, is **relative**. Forgetting the relative path of your new jar is "a very common error" Boone says. I _might_ have made this mistake a time or two when writing this post.

## Conclusion

I spent a ton of time understanding the class search path. Stumbling on the `-verbose` flag was fortuitous. I read blogs and the docs (see my sources below) but the _point_ of the classpath and bending it to my will wasn't clicking until I stripped everything away and started experimenting. This was a _very slow_ process but I'm glad I went through it and hopefully I saved you some time with the presentation above.

## Sources

Blogs

+ [Kevin Boone: Mastering the Java CLASSPATH](http://kevinboone.net/classpath.html)
+ [Terence Yim: Java Class Loading and Distributed Data Processing Frameworks](https://blog.cdap.io/2015/08/java-class-loading-and-distributed-data-processing-frameworks/)
+ [Justin Lee: The Classpath](https://www.antwerkz.com/blog/the-classpath)

Official
+ [Setting the Class Path](https://docs.oracle.com/javase/8/docs/technotes/tools/windows/classpath.html)
+ [How Classes are Found](https://docs.oracle.com/javase/7/docs/technotes/tools/findingclasses.html)
+ [JDK and JRE File Structure](https://docs.oracle.com/javase/7/docs/technotes/tools/solaris/jdkfiles.html)
+ [javac - Java programming language compiler](https://docs.oracle.com/javase/7/docs/technotes/tools/windows/javac.html)
