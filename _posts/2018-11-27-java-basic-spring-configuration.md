---
layout: post
title:  "Basic Java Spring Configuration"
date:   2018-11-27 21:00:00 -0700
categories: java
---

## Motivation

Spring gently nudges you to use dependency injection right from application inception. Below I cover two _very basic_ (mostly for my benefit, I admit) ways to configure a new app.

## Configuration with @Beans and such

Create a new application using [Spring Initializr](https://start.spring.io/). For this post, just hit "Generate Project" (the defaults are fine).

When you load the app in your favorite IDE, you see something like the following (I renamed my application `PetApp` because I think pets are great):

```java
@SpringBootApplication
public class PetApp {
    public static void main(String[] args) {
        SpringApplication.run(PetApp.class, args);
    }
}
```

Running the application, we see the Spring banner and logs.

It's hard for me to tell what's going on, so I'll strip everything away and start (kinda) from scratch.

```java
public class PetApp {
    public static void main(String[] args) {
        // just this comment
    }
}
```

This doesn't do anything, and I know I need to inject some dependencies or something, so I'll use Spring's recommended mechanism<sup>["Via AnnotationConfigApplicationContext"](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Configuration.html)</sup> for configuring (but I'll use the interface `ConfigurableApplicationContext` instead). 

```java
// PetApp.java
public class PetApp {
    public static void main(String[] args) {
        ConfigurableApplicationContext context =
                new AnnotationConfigApplicationContext(AppConfig.class);
        Dog dog = context.getBean(Dog.class);
        dog.speak();
    }
}

// AppConfig.java
@Configuration
public class AppConfig {
    @Bean
    Dog getDog() {
        return new Dog();
    }
}

// Dog.java
public class Dog {
    public void speak() {
        System.out.println("woof!");
    }
}
```
Some observations:
+ I pass `AppConfig.class` into the `annotatedClasses` parameter of the `AnnotationConfigApplicationContext` constructor
+ In `AppConfig.java`, I annotate the method `getDog()` with `@Bean`, which indicates that it, the method, "produces a bean to be managed by the Spring container." <sup>[Annotation Type Bean](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Bean.html)</sup>
+ `AppConfig.java` has the `@Configuration` annotation, which tells the Spring container this class, `AppConfig.java`, contains one or more @Bean methods. <sup>[Annotation Type Configuration](https://docs.spring.io/spring-framework/docs/5.1.2.RELEASE/javadoc-api/org/springframework/context/annotation/Configuration.html?is-external=true)</sup> 
+ I use the factory method `getBean` to make an instance of class `Dog`
+ Finally, if you run the application, it very satisfyingly says "woof!"

I'm new to Spring, but I get the impression the above configuration strategy is good (and a _very_ welcome improvement over XML configuration), but is no longer bleeding edge. So that's what the next section is about.

## Configuration with a whole lotta annotations

I opened my first Spring application two weeks ago and noticed the Spring community seems to prefer annotations. 

Moving the code above in that direction, I'm replacing `AnnotationConfigApplicationContext` with Spring's next recommended mechanism <sup>["Via component scanning"](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Configuration.html)</sup> that will tighten up the code.

```java
public class PetApp {
    public static void main(String[] args) {
        ConfigurableApplicationContext context
                = SpringApplication.run(PetApp.class, args);
        Dog dog = context.getBean(Dog.class);
        dog.speak();
    }
}
```

Above, I replaced `AnnotationConfigApplicationContext` with what [Spring Initializr](https://start.spring.io/) provided out of the box: `SpringApplication.run(...)`. Running the code, Spring tells me:

```console
No qualifying bean of type 'com.brent.core.Dog' available
```
This makes sense because I previously injected `AppConfig` into the application context constructor. Now the context does not know about my `Dog` bean.

Adding the `@ComponentScan` annotation solves the problem.

```java
// PetApp.java
@ComponentScan // <---- notice this annotation
public class PetApp {
    public static void main(String[] args) {
        ConfigurableApplicationContext context
                = SpringApplication.run(PetApp.class, args);
        Dog dog = context.getBean(Dog.class);
        dog.speak();
    }
}
```
Running the code above with `@ComponentScan` produces the happy "woof!"

`@ComponentScan` "Configures component scanning directives for use with @Configuration classes." <sup>[Annotation Type ComponentScan](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/ComponentScan.html)</sup> I can verify `@ComponentScan` is working with `@Configuration` classes by simply removing `@Configuration` from `AppConfig`, which produces the following error:

```console
No qualifying bean of type 'com.brent.core.Dog' available
```

I can eliminate `AppConfig.java` altogether by using the `@Component` annotation on my `Dog` class directly. Here's what my application looks like after the changes:

```java
// PetApp.java
@ComponentScan
public class PetApp {
    public static void main(String[] args) {
        ConfigurableApplicationContext context
                = SpringApplication.run(PetApp.class, args);
        Dog dog = context.getBean(Dog.class);
        dog.speak();
    }
}

// Dog.java
@Component // <----- new annotation
public class Dog {
    public void speak() {
        System.out.println("woof!");
    }
}
```

`@Component`s are "considered as candidates for auto-detection when using annotation-based configuration. <sup>[Annotation Type Component](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/stereotype/Component.html)</sup> `@ComponentScan` simply tells the Spring container to go out and look for all `@Component`s (this is itself configurable but isn't relevant for this post).

I can make a final adjustment to bring my app closer to the one [Spring Initializr](https://start.spring.io/) provided out of the box. My app still woofs if I replace `@ComponentScan` with `@SpringBootApplication`.

```java
@SpringBootApplication
public class PetApp {
    public static void main(String[] args) {
        ConfigurableApplicationContext context
                = SpringApplication.run(PetApp.class, args);
        Dog dog = context.getBean(Dog.class);
        dog.speak();
    }
}
```
`@SpringBootApplication` is a "convenience" <sup>[Annotation Type SpringBootApplication](https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/autoconfigure/SpringBootApplication.html)</sup> annotation that is the same as using three annotations: `@Configuration`, `@EnableAutoConfiguration`, and `@ComponentScan`.

I wrote about `@Configuration` above (it tells the Spring container "this class contains beans") and `@ComponentScan` ("Spring container: go get all the `@Components`"), but I have not mentioned `@EnableAutoConfiguration` and it's not (yet) relevant for the case I laid out above.

## Conclusion

It took me a while to see how the handful of annotations in this post fit together (just the sheer quantity is intimidating and hard to keep straight). But my impression (really my _first_ impression given my lack of experience with Spring) is that the community prefers annotations to XML so my effort above is hopefully worthwhile.

Anyway. Configuring the Spring-container-dependency-injection-thing is a lot clearer now. From XML to configuration classes, like `AppConfig`, to just straight-up annotations, like `@ComponentScan` and  `@Component`, means my code is easier to read...with a little experience :)
