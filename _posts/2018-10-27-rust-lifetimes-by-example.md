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
+ This is an error: the Rust compiler will not produce an executable until I resolve the issue.
+ The Rust compiler "expected [a] lifetime parameter" and cannot infer the lifetime of the returned borrow.
+ The first "help" suggestion - "this function's return type contains a borrowed value, but there is no value for it to be borrowed from" - provides a solution: add a parameter which the returned value borrows from.
+ The second "help" suggestion - "consider giving it a `'static` lifetime" - provides another solution: return static data, (i.e. immutable data with known size at compile time), so that the binding is always valid.

Let's try both solutions starting with adding the `'static` lifetime annotation.

```rust
fn f1() -> &'static i32 {
    &1
}
```

After adding the `'static` lifetime annotation, the borrow checker moves past the function signature, so we add a minimal function body, `&1`, satisfying the signature, and the code compiles.

Note: string literals, like `"hello"`, and globals, like `77756`, live in the [data segment](https://en.wikipedia.org/wiki/Data_segment) of the resulting binary, separate from the heap. Rust only drops items on the heap and therefore literals and globals have a lifetime of the [whole program](https://doc.rust-lang.org/book/first-edition/lifetimes.html#static).

Trying the borrow checker's other suggestion - adding a parameter - also compiles successfully, even though the parameter, `x`, has nothing to do with the `&i32` returned:

```rust
fn f2(x: &i32) -> &i32 {
    &1
}
```

This compiles but is not very interesting because the returned value is static. The following, `f3`, is more interesting and appears to do the same thing as `f2`.

```rust
fn f3(x: &i32) -> &i32 {
    let y = 1;
    &y
}
```

`f3` declares a variable, `y`, binds a value, and returns a borrow of that value. The key difference is that `y` goes out of scope when the function body closes introducing UaF and therefore `f3` does not compile:

```rust
error[E0597]: `y` does not live long enough
 --> src/main.rs:5:6
  |
5 |     &y
  |      ^ borrowed value does not live long enough
6 | }
  | - borrowed value only lives until here
```

Excluding static items, a function returning a borrow _must_ receive that borrow as a parameter since variables created in the function body will be dropped when the function body closes. This is important for understanding an example provided in "The Rust Programming Language" by Klabnik and Nichols, which I discuss in the next section.

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

Rust's borrow checker explains that "the signature does not say whether [the returned borrow] is borrowed from `x` or `y`." In other words, if the function has more than one parameter, which one should Rust's borrow checker examine for UaF?

Both, it turns out. Using a lifetime annotation, `'a`, tells Rust's borrow checker that the returned borrow must have the same lifetime as both of the parameter borrows.
                    
```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

Stepping back, I am going to build `longest` from scratch with the goal of illustrating when Rust's borrow checker needs lifetime annotations and how it uses them. Take the following simplified example:

```rust
fn longest1(x: &str) -> &str {
    x
}
```

Comparing Klabnik and Nichols' `longest` to `longest1` the first thing that sticks out regarding lifetime annotations is that there are none; they have be _elided_ (i.e. omitted). Since there is only one input parameter, the borrow checker can infer which value the returned borrow refers to in order to check the underlying value is still valid.

Note: In the case above, lifetime annotations are optional. The following is equivalent to `longest1`.

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

Before introducing any conditional logic into the function body, I am back where I started with the "signature does not say whether it is borrowed from `x` or `y`" error. 

Introducing a lifetime annotation, `'a` on the parameter used in the function body, `x`, resolves the issue.

```rust
fn longest5<'a>(x: &'a str, y: &i32) -> &'a str {
    x
}
```

`longest5` uses a lifetime annotation, `'a`, to communicate to Rust's borrow checker that parameter `x` and the returned borrow must have the same lifetime in order to prevent UaF. The following example illustrates how the lifetime annotation helps Rust's borrow checker. (here, I borrow Klabnik and Nichols' helpful lifetime comment/illustrations).

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

Above, I define a `main` function that defines some values, an internal scope which calls `longest6`, and then prints.`longest6` is the closest thing to the original `longest` we have seen because both inputs are string slices, `&str`.

In the following example, I move one step closer to the original `longest` by actually doing something with `y` in the function body. Since `longest6` cannot return `y`, the lifetime of `y` is irrelevant and Rust's borrow checker confirms there is no UaF by successfully compiling.

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

Using the same runner, and creating `longest7`, which is nearly identical to the original `longest`, we run into a problem:

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

The difference between `longest7` and the original `longest` is that I have not included the lifetime annotation on the `y` parameter. Rust's borrow checker identifies that `longest7` could return `y` and throws a (surprisingly helpful) error:

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

Adding a lifetime annotation to parameter `y` finally makes the function identical to Klabnik and Nichols' original `longest`.

```rust
fn main() {
    let longer;                                 // -----------+-- 'a
    {                                           //            |
        let some_str = String::from("bye");     // ---+-- 'b  |
        longer = longest("hi", &some_str);      //    |       |
    }                                           // ---+       |
    println!("{}", longer);                     //            | some_str is dead, and the borrow checker is mad
}                                               // -----------+

fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

When I compile the code above, I get the following:

```rust
error[E0597]: `some_str` does not live long enough
 --> src/main.rs:5:33
  |
5 |         longer = longest("hi", &some_str);     //    |       |
  |                                 ^^^^^^^^ borrowed value does not live long enough
6 |     }                                           // ---+       |
  |     - `some_str` dropped here while still borrowed
7 |     println!("{}", longer);                     //            | some_str is dead, and the borrow checker is mad
8 | }                                               // -----------+
  | - borrowed value needs to live until here
```

The code above illustrates why the borrow checker exists. I introduced a UaF and the borrow checker catches it at compile time. Fixing `main`, once `longest` has the necessary lifetime annotations, makes the program compile.

```rust
fn main() {
    let some_str = String::from("bye");     // -----------+-- 'a
    let longer = longest("hi", &some_str);  // ---+-- 'b  |
    println!("{}", longer);                 //    |       |
}                                           // -----------+ some_str and longer are cleaned
```

By fixing `main` so that both of the parameters of `longest` have lifetimes overlapping with their usage, I eliminate the UaF and Rust's borrow checker validates I have no memory integrity problems.

## Structs with References

I've found annotating lifetimes of references in structs much easier to understand after understanding the examples in the previous section. The following example is probably as simple as it gets:

```rust
struct Coordinate {
    x: &i32
}
```

The borrow checker tells me right away I have a problem:

```rust
error[E0106]: missing lifetime specifier
 --> src/main.rs:2:8
  |
2 |     x: &i32
  |        ^ expected lifetime parameter
```

This is because, as we saw earlier, if the borrowed value, `x`, is dropped before the `Coordinate` struct uses it, then I have a UaF. Take the following example:

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

I'll just do what Rust's borrow checker says and add a lifetime annotation `'a` to the borrowed value in the `Coordinate` struct:

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

I run into a familiar issue during compilation:

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

I introduced another UaF: `x` will be dropped and later printed. As in the previous section, fixing `main` so that the borrow passed to `Coordinate` has a lifetime overlapping with its usage eliminates the UaF and the following compiles.

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

Rust's borrow checker exists to ensure memory integrity. We add lifetime annotations to our programs so Rust's borrow checker can validate, at compile time, our programs do not contain use-after-free bugs. Lifetimes give us the best of both worlds: no garbage collection "pause time" and memory integrity.

<sub>
Providing instructions to the compiler via lifetime annotations seriously confused me at first. Having written mostly C# and rarely thinking about memory management (aside from disposing unmanaged resources), learning about lifetimes was broadening, to say the least. Thank you very much to Kevin Lynagh, @lynaghk, (whom I recently visited in Kraków, Poland!) for his patience and guidance and for the gentle nudge to start writing.
</sub>
