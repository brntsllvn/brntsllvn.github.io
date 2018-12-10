---
layout: post
title:  "A Dumb Dependency Injection Container"
date:   2018-12-09 21:00:00 -0700
categories: java
---

## Motivation
Lately, I've been reading Spring's dependency injection source code (I actually debug-stepped through the code but whatever). I spent a lot of time with the "Bean Factory," the "root interface for accessing a Spring bean container" <sup>[docs](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/BeanFactory.html)</sup>.

Most DI tutorials (in addition to including, in my mind, unnecessarily realistic images of _actual_ needles) skip a couple steps, so I decided to write my own dumb dependency injection container (using Spring's for inspiration) to get my hands dirty. I call my container "dumb" because I've surely forgotten a feature, neglected some detail or otherwise botched things...but it kinda works and that's good enough for now.

## Reflection

Spring spends a lot of time figuring out where beans come from (see the [ClassPathBeanDefinitionScanner](https://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/context/annotation/ClassPathBeanDefinitionScanner.html) and the [AnnotatedBeanDefinitionReader](https://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/context/annotation/AnnotatedBeanDefinitionReader.html)). 

Then it spends more time figuring out which controller, for a given bean, it should use. 

Finally, it delegates actual bean creation to its [BeanUtility](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/BeanUtils.html), which under the hood just uses [java.lang.reflect](https://docs.oracle.com/javase/8/docs/api/java/lang/reflect/package-summary.html), which itself uses the [sun.reflect](https://download.java.net/openjdk/jdk6/) package (which feels odd and old and interesting for irrational reasons).

Reflection lets us do things like [get the methods of a class](https://stackoverflow.com/a/5266548/4097181) and other meta-programming. Germane to this post, we use reflection to get the constructor of the bean we need to instantiate.

## Beach Vacation

Here is a hierarchy of classes that my container will inject.

<img src="/img/java/class-diagram.png" alt="diagram showing class hirerarchy that I will inject: beach vacation-themed" >

The hierarchy looks like this in code. It's boring and you can mostly ignore it:

```java
class BeachVacation {
    private Sandals sandals;
    private PlaneTicket planeTicket;
    private SurfBoard surfBoard;
    public BeachVacation(Sandals sandals,
                         PlaneTicket planeTicket,
                         SurfBoard surfBoard) {
        this.sandals = sandals;
        this.planeTicket = planeTicket;
        this.surfBoard = surfBoard;
    }
    public String toString() {
        return "this is the best vacation!";
    }
}

class Sandals { public Sandals() {} }

class PlaneTicket {
    private AirplaneService airplaneService;
    public PlaneTicket(AirplaneService airplaneService) {
        this.airplaneService = airplaneService;
    }
}

class AirplaneService { public AirplaneService() {} }

class SurfBoard {
    private Wax wax;
    private WetSuit wetsuit;
    public SurfBoard(Wax wax, WetSuit wetsuit) {
        this.wax = wax;
        this.wetsuit = wetsuit;
    }
}

class Wax { public Wax() {}}

class WetSuit { public WetSuit() {} }
```

Each constructor injects its dependencies and sets the corresponding field(s). Each class must have one constructor.

## The Goal

Here's a brief `main` method that shows where we're headed:

```java
public class Main {
    public static void main(String[] args) throws NoSuchMethodException {
        SingletonFactory factory = new SingletonFactory();
        BeachVacation beachVacation = (BeachVacation) factory.getSingleton(BeachVacation.class);
        System.out.print(beachVacation.toString());
    }
}
```

It creates a `SingletonFactory` (which is essentially what Spring does), passes the root class, `BeachVacation` (I use the word "root" very deliberately...), and, if all goes well, prints a fun message indicating success.
 
## Dependency Injection

When you ask for an object, your dependency injection framework must instantiate all its dependencies too. This is kinda the point of dependency injection (it also promotes good design, blah blah). I solved this problem using a [depth-first-search](https://en.wikipedia.org/wiki/Depth-first_search) implementation (hence my cheeky use of the word "root" above). It does not have the pleasing brevity of a recursive depth-first-search but is essentially recursive (and fwiw, is consistent with Spring's implementation.) Here's the code:

```java
class SingletonFactory {
    private Map<Class, Object> singletons = new ConcurrentHashMap<>();

    public Object getSingleton(Class clazz) throws NoSuchMethodException {
        Object singleton = null;
        synchronized (this.singletons) {
            if (!singletons.containsKey(clazz)) {
                singleton = makeSingleton(clazz);
                this.singletons.put(clazz, singleton);
            } else {
                singleton = this.singletons.get(clazz);
            }
        }
        return singleton;
    }

    private Object makeSingleton(Class<?> clazz) throws NoSuchMethodException {
        Constructor ctor = clazz.getConstructors()[0]; // everything must have a constructor
        resolveDependencies(ctor);
        Object obj = null;
        try {
            Object[] parameters = getDependencies(ctor);
            obj = ctor.newInstance(parameters);
        } catch (InstantiationException ex) {
            ex.printStackTrace();
        } catch (IllegalAccessException ex) {
            ex.printStackTrace();
        } catch (InvocationTargetException ex) {
            ex.printStackTrace();
        }
        return obj;
    }

    private void resolveDependencies(Constructor<?> ctor) throws NoSuchMethodException {
        for (Class dependency : ctor.getParameterTypes()) {
            getSingleton(dependency);
        }
    }

    private Object[] getDependencies(Constructor<?> ctor) {
        List<Object> dependencies = new ArrayList<>();
        for (Class parameter : ctor.getParameterTypes()) {
            Object param = singletons.get(parameter);
            dependencies.add(param);
        }
        return dependencies.toArray();
    }
}
```

The story is as follows: I receive a class, check if the class is in my map, if so, I return the class (because it's already instantiated), if not, I check its dependencies to see if they're in my map, if not, I instantiate them and put them in my map.

This factory produces [singletons](https://en.wikipedia.org/wiki/Singleton_pattern) which is, more or less, what Spring does <sup>[there's actually some debate here](https://stackoverflow.com/questions/2637864/singleton-design-pattern-vs-singleton-beans-in-spring-container)</sup>. On this point, I use `synchronize` and `ConcurrentHashMap` to make sure my singletons are threadsafe (which is a topic for a whole other post...).

## Conclusion

It's not the most elegant implementation and leaves out plenty of features (Can't I just use the default constructor rather than requiring every class to have a constructor? How do I inject interface implementations and determine priority <sup>[see @Primary](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Primary.html)</sup>?) but this simplified DI container really helped me understand what's going on under the hood.

<img src="/img/java/injected.png" alt="diagram showing class hirerarchy that I will inject: beach vacation-themed" >
