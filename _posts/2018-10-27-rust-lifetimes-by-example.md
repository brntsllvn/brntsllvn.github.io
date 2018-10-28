---
layout: post
title:  "Rust Lifetimes by Example"
date:   2018-10-27 20:00:00 -0700
categories: rust
---

## Introduction

Rust is a statically-typed, functional language that compiles to WebAssembly and uses _lifetimes_, rather than garbage-collection, to manage memory.

But why?

Garbage-collected languages like C# and Ruby constantly _mark and sweep_ objects on the heap. Depending on the number of live objects, the program pays a performance cost, "pause time," as the garbage collector frees up memory.

Without garbage collection, Rust is more like C, leaving memory management up to the developer. A common issue in C code is the "use after free" bug (UaF). The C program below tries to access memory after the program frees it. The result is a seg fault.

```c
int main() {
    char* str = malloc(5);
    strncpy(str, "hello", 5);
    free(str);
    printf("%s", str);
}

$ gcc -o ex ex.c
$ ./ex
Segmentation fault: 11
```

Rust prevents UaF by statically analyzing code _at compile time_ and refusing to produce an executable until the developer corrects the bug. Looking at Rust code roughly equivalent to the C code above:

```rust
fn main() {
    let str;
    {
        let greet = String::from("hello");
        str = &greet;
    }
    println!("{}", str);
}
```

Compiling, we get:

```rust
error[E0597]: `greet` does not live long enough
 --> src/main.rs:5:16
  |
5 |         str = &greet;
  |                ^^^^^ borrowed value does not live long enough
6 |     }
  |     - `greet` dropped here while still borrowed
7 |     println!("{}", str);
8 | }
  | - borrowed value needs to live until here
```

To facilitate compile time checking, Rust developers tell the compiler how long a binding to a reference is valid. In other words, we describe the _lifetime_ of the reference.

## Rust's Borrow Checker

Rust's _borrow checker_ is the part of the Rust compiler that identifies UaF and other common memory management bugs. In the case of functions, it examines the signature first.

```rust
fn f() -> &i32 {
    // literally nothing
}
```

The borrow checker provides the following feedback:

```
error[E0106]: missing lifetime specifier
 --> src/main.rs:1:11
  |
1 | fn f() -> &i32 {
  |           ^ expected lifetime parameter
  |
  = help: this function's return type contains a borrowed value, but there is no value for it to be borrowed from
  = help: consider giving it a 'static lifetime
```

Each part of the error message is useful for understanding lifetimes:
+ This is an error: the Rust compiler will not produce an executable until this issue is resolved.
+ The Rust compiler "expected [a] lifetime parameter," which means it cannot infer the lifetime of the borrow the function returns.
+ The first "help" suggestion - "this function's return type contains a borrowed value, but there is no value for it to be borrowed from" - provides a possible solution: specify an input parameter which the returned value borrows from.
+ The second "help" suggestion - "consider giving it a `'static` lifetime" - provides another possible solution: return static data, (i.e. immutable data with known size at compile time), so that the binding is always valid.

Let's try both solutions starting with making the reference always 
valid.

```rust
fn f1() -> &'static i32 {
    &1
}
```

After adding the `'static` lifetime annotation, the borrow checker moves past the function signature, so we add a minimal function body, `&1`, satisfying the signature, and the code compiles.

Note: string literals, like `"hello"`, and globals, like `77756`, live in the [data segment](https://en.wikipedia.org/wiki/Data_segment) of the resulting binary, separate from the heap. Rust only drops items on the heap and therefore literals and globals have a lifetime equal to the [lifetime of the whole program](https://doc.rust-lang.org/book/first-edition/lifetimes.html#static).

Trying the borrow checker's other suggestion - adding a parameter - also compiles successfully, even though the parameter, `x`, has nothing to do with the `&i32` returned:

```rust
fn f2(x: &i32) -> &i32 {
    &1
}
```

This compiles but, again, is not very interesting because the returned value is static. The following is more interesting (even though it appears to do exactly the same thing):

```rust
fn f3(x: &i32) -> &i32 {
    let y = 1;
    &y
}
```

`f3` declares a variable, `y`, binds a value, and returns a reference to that value. The key difference is that `y` goes out of scope when the function body closes and therefore `f3` does not compile:

```rust
error[E0597]: `y` does not live long enough
 --> src/main.rs:5:6
  |
5 |     &y
  |      ^ borrowed value does not live long enough
6 | }
  | - borrowed value only lives until here
```

Excluding static items, if a function returns a borrow (i.e. contains `&`) then the source of the borrow _must_ be a borrow passed in as an input paramter since variables created in the function body will be dropped when the function body closes. This is important for understanding an example provided in "The Rust Programming Language" by Klabnik and Nichols, which I discuss in the next section.

## Function Parameters

Klabnik and Nichols provide the following example in the [2018 version of their book](https://doc.rust-lang.org/book/2018-edition/ch10-03-lifetime-syntax.html):

```rust
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

Rust's borrow checker errors with "expected lifetime parameter" as we saw earlier, but provides a new suggestion.

```rust
error[E0106]: missing lifetime specifier
 --> src/main.rs:3:33
  |
3 | fn longest(x: &str, y: &str) -> &str {
  |                                 ^ expected lifetime parameter
  |
  = help: this function's return type contains a borrowed value, but the signature does not say whether it is borrowed from `x` or `y`
```

Rust's borrow checker mentions that the return type contains a borrowed value, but "the signature does not say whether it is borrowed from `x` or `y`." Excluding the case of static items, if a function returns a reference, then the reference must originate from one of the function's parameters.

If there is more than one input parameter, which one should the borrow checker validate?

Both, it turns out. Using a lifetime annotation, `'a`, tells Rust's borrow checker that the returned borrow has the same lifetime as both of the parameter borrows.
                    
```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

> **A quick aside...** Providing instructions, via lifetime annotations, to the compiler, confused me when I first encountered it. Coming from C# and rarely thinking about memory management (aside from disposing _unmanaged_ resources), this was a [broadening](https://www.newyorker.com/magazine/1995/01/30/an-interval) opportunity for me. I recently visited [Kevin Lynagh](https://twitter.com/lynaghk) in Kraków, Poland and he suggested experimenting, as a physicist would in a laboratory, by systematically forming a hypothesis and proving or disproving using a small experiment. What follows is the _result_ of that approach (but, to be clear, is not a demonstration of that approach).

 Stepping back, I am going to build the function from scratch with the goal of understanding how lifetimes work. Take the following example:

```rust
fn longest1(x: &str) -> &str {
    x
}
```

Comparing the original `longest` to `longest1` the first thing that sticks out regarding lifetime annotations is that there are none; they have be _elided_ (i.e. omitted). Since there is only one input parameter, the borrow checker can infer which value the returned borrow refers to in order to check it is still valid. 

Note: we can always include lifetime annotations. The following is equivalent to `longest1`.

```rust
fn longest2<'a>(x: &'a str) -> &'a str {
    x
}
```

Introducing a _value_ parameter, `y`, does not complicate things. The following compiles.

```rust
fn longest3(x: &str, y: i32) -> &str {
    x
}
```

But changing `y` to a _reference_ parameter, no matter the type, will generate a borrow checker error. For example:

```rust
fn longest4(x: &str, y: &i32) -> &str {
    x
}
```

Compiling, we get:

```rust
error[E0106]: missing lifetime specifier
 --> src/main.rs:3:34
  |
3 | fn longest4(x: &str, y: &i32) -> &str {
  |                                  ^ expected lifetime parameter
  |
  = help: this function's return type contains a borrowed value, but the signature does not say whether it is borrowed from `x` or `y`
```

Before introducing any conditional logic into the function body, we are back where we started with the "signature does not say whether it is borrowed 
from `x` or `y`" error. 

Introducing lifetime annotations no the parameter used in the function body, `x`, resolves the issue.

```rust
fn longest5<'a>(x: &'a str, y: &i32) -> &'a str {
    x
}
```

The above function, `longest5`, explicitly ties together the lifetime of the input parameter `x` and the lifetime of the returned borrow. Lifetime annotations do nothing other than tell the compiler how to validate references are still valid.

What does `longest5` tell us in practice? The following example sheds light on how lifetime annotations connect underlying values. (here, I borrow Klabnik and Nichols' helpful lifetime comment/illustrations).

```rust
fn main() {
    let longer;                                 // -----------+-- 'a
    {                                           //            |
        let some_str = String::from("bye");     // ---+-- 'b  |
        longer = longest6("hi", &some_str);     //    |       |
    }                                           // ---+       |
    println!("{}", longer);                     //            | some_str is dead, but longer does not care
}                                               // -----------+

fn longest6<'a>(x: &'a str, y: &str) -> &'a str {
    x
}
```

Above, I define a `main` function that itself defines some values, an internal scope which calls `longest6` and then prints.`longest6` is the closest thing to the original `longest` we have seen because both inputs are of type `&str`.

In the following example, I move one step closer to the original `longest` by actually doing something with `y` in the function body. It makes no difference.

```rust
fn main() {
    let longer;                                 // -----------+-- 'a
    {                                           //            |
        let some_str = String::from("bye");     // ---+-- 'b  |
        longer = longest6("hi", &some_str);     //    |       |
    }                                           // ---+       |
    println!("{}", longer);                     //            | some_str is dead, but longer still does not care
}                                               // -----------+

fn longest6<'a>(x: &'a str, y: &str) -> &'a str {
    println!("{}", y);
    x
}
```

Using the same runner, `longest7` now looks very similar to the original `longest`, but we run into a problem.

```rust
fn main() {
    let longer;                                 // -----------+-- 'a
    {                                           //            |
        let some_str = String::from("bye");     // ---+-- 'b  |
        longer = longest7("hi", &some_str);     //    |       |
    }                                           // ---+       |
    println!("{}", longer);                     //            | some_str is dead, and the borrow checker is mad
}                                               // -----------+

fn longest7<'a>(x: &'a str, y: &str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

The difference between `longest7` and the original `longest` is that I have not included the lifetime annotation on the `y` parameter. This does not compile since the borrow checker identifies that `longest7` could return `y`. The Rust compiler tells us what to do:

```rust
error[E0621]: explicit lifetime required in the type of `y`
  --> src/main.rs:14:9
   |
10 | fn longest7<'a>(x: &'a str, y: &str) -> &'a str {
   |                             - consider changing the type of `y` to `&'a str`
...
14 |         y
   |         ^ lifetime `'a` required
```

Adding a lifetime annotation to parameter `y` finally makes this function the Klabnik and Nichols' original `longest`.

```rust
fn main() {
    let longer;                                 // -----------+-- 'a
    {                                           //            |
        let some_str = String::from("bye");     // ---+-- 'b  |
        longer = longest("hi", &some_str);      //    |       |
    }                                           // ---+       |
    println!("{}", longer);                     //            | some_str is dead, and the borrow checker is still mad
}                                               // -----------+

fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

When I compiler the code above, I get the following:

```rust
error[E0597]: `some_str` does not live long enough
 --> src/main.rs:5:33
  |
5 |         longer = longest("hi", &some_str);     //    |       |
  |                                 ^^^^^^^^ borrowed value does not live long enough
6 |     }                                           // ---+       |
  |     - `some_str` dropped here while still borrowed
7 |     println!("{}", longer);                     //            | some_str is dead, but now longer cares
8 | }                                               // -----------+
  | - borrowed value needs to live until here
```

The code above illustrates why the borrow checker exists. I introduced a possible UaF and the borrow checker caught the bug at compile time. Fixing `main` such that 

```rust
fn main() {
    let some_str = String::from("bye");     // -----------+-- 'a
    let longer = longest("hi", &some_str);  // ---+-- 'b  |
    println!("{}", longer);                 //    |       |
}                                           // -----------+ some_str and longer are cleaned
```

By fixing `main` so that both of the parameters of `longest` have lifetimes overlapping with their usage, I eliminate the UaF and Rust's borrow checker validates I have no memory integrity problems.

## Structs with References

Annotating lifetimes of references in structs are much easier to understand if you understand the cases in the previous section. The following example is probably as simple as it gets:

```rust
struct Coordinate {
    x: &i32
}
```

The borrow checker tells us right away we have a problem:

```rust
error[E0106]: missing lifetime specifier
 --> src/main.rs:2:8
  |
2 |     x: &i32
  |        ^ expected lifetime parameter
```

This is because, as we saw earlier, if the borrowed value, `x` is dropped before the `Coordinate` struct uses it, then we have a UaF. Take the following concrete example:

```rust
fn main() {
    let coord: Coordinate;
    {
        let x = 12;
        coord = Coordinate { x: &x };
    }
    println!("{:?}", coord.x);
}

struct Coordinate {
    x: &i32
}
```

`main` creates a struct `Coordinate` and an internal scope that will, as we saw earlier, drop its local variable, `x`, at its closing brace `}`.

Let's just do what the borrow checker says and add a lifetime annotation `'a` to the borrowed value.

```rust
fn main() {
    let coord: Coordinate;
    {
        let x = 12;
        coord = Coordinate { x: &x };
    }
    println!("{:?}", coord.x);
}

struct Coordinate<'a> {
    x: &'a i32
}
```

We run into a familiar issue during compilation:

```rust
error[E0597]: `x` does not live long enough
 --> src/main.rs:5:34
  |
5 |         coord = Coordinate { x: &x };
  |                                  ^ borrowed value does not live long enough
6 |     }
  |     - `x` dropped here while still borrowed
7 |     println!("{:?}", coord.x);
8 | }
  | - borrowed value needs to live until here
```

I introduced another UaF because `x` will be dropped and later printed. The fix is the same as in the previous section: fixing `main` so that both of the parameters of `longest` have lifetimes overlapping with their usage. The following compiles.

```rust
fn main() {
    let x = 12;
    let coord = Coordinate { x: &x };
    println!("{:?}", coord.x);
}

struct Coordinate<'a> {
    x: &'a i32
}
```

## Conclusion

The borrow checker exists to validate memory integrity. 
