---
layout: post
title:  "Rust Lifetimes by Example"
date:   2018-10-27 20:00:00 -0700
categories: rust
---

## Introduction

Rust is a statically-typed, functional language that compiles to WebAssembly and uses _lifetimes_, rather than garbage-collection, to manage memory.

But why? 

Garbage-collected languages like C# and Ruby constantly _mark and sweep_ objects on the heap. Depending on the number of live objects, the program pays a performance cost usually called "GC pause time."

Without garbage collection, Rust is more like C, leaving memory management up to the developer. A common issue in C code is the "use after free" (UaF) bug. The C program below tries to access memory that the program has freed. The result is a seg fault.

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

Rust prevents UaF bugs by statically analyzing code _at compile time_ and refusing to produce an executable until the developer corrects the bug. Looking at Rust code roughly equivalent to the C code above...

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

...and compiling, we get:

```rust
        str = &greet;
               ^^^^^ borrowed value does not live long enough
    }
    - `greet` dropped here while still borrowed
    println!("{}", str);
}
- borrowed value needs to live until here
```

To facilitate compile-time checking, Rust developers tell the compiler how long a binding to a reference is valid. In other words, she must describe the _lifetime_ of the reference.

## Lifetimes Case 0: The Borrow Checker

The _borrow checker_ is the part of the Rust compiler that identifies UaF and other common memory management bugs. In the case of functions, it examines the function signature first.

```rust
fn f() -> &i32 {
    // literally nothing
}
```

The borrow checker provides the following feedback:
```
error[E0106]: missing lifetime specifier
fn f() -> &i32 {
          ^ expected lifetime parameter

   = help: this function's return type contains a borrowed value, but there is no value for it to be borrowed from
   = help: consider giving it a 'static lifetime
```

Each part of the error message is useful for understanding lifetimes.
+ This is an error: the Rust compiler will not produce an executable until this issue is resolved.
+ The Rust compiler "expected [a] lifetime parameter," which means it cannot infer the lifetime of the borrow the function returns.
+ The first "help" suggestion "this function's return type contains a borrowed value, but there is no value for it to be borrowed from" provides the a possible solution to the problem: specify an input parameter which the returned value borrows from.
+ the second "help" suggestion "consider giving it a 'static lifetime" provides another possible solution: return static data, (i.e. immutable data with known size at compile time), so that the binding is always valid.

Let's try both solutions starting with making the reference always 
valid.

```rust
fn f1() -> &'static i32 {
    &1
}
```

After adding the `'static` lifetime annotation, the borrow checker moves past the function signature, so we must specify a function body that satisfies the signature. In this case, `&1`, will suffice.

How does the borrow checker know there is a problem only looking at the signature? Since the function originally returns a borrowed `i32`, written `&i32`, the borrowed value _must_ come from somewhere. 

The borrowed value could come from the function body, as we showed in function `f1` above, but this only works because the `&1` is static and not bound to a variable (As Klabnik and Nichols, authors of "The Rust Programming Language", say "the text is hardcoded directly into the final executable") and is therefore never dropped. There is no risk of a UaF bug.

Note: `f1` is equivalent to the following, which explicitly
declares the static item, then returns it.

```rust
fn f2() -> &'static i32 {
    static i: &'static i32 = &1;
    i
}
```

Static data (like a literal `1` or `"hello"`) are not very useful for understanding lifetimes since their lifetimes are the lifetime of the program. Lifetimes are mostly interesting when we write code binding references to variables and the underlying data live on the heap.

Trying the borrow checker's other suggestion, providing a parameter, also compiles successfully, even though the parameter, `x`, has nothing to do with the `&i32` returned:

```rust
fn f3(x: &i32) -> &i32 {
    &1
}
```

This compiles but, again, is not very interesting because the returned value is static. The following is more interesting (even though it appears to do exactly the same thing):

```rust
fn f4(x: &i32) -> &i32 {
    let y = 1;
    &y
}
```

`f4` declares a variable, `y`, and binds a value, then returns a reference to that value. The key difference is that `y` goes out of scope when the function body closes and therefore `f4` does not compile:

```rust
    &y
     ^ borrowed value does not live long enough
}
- borrowed value only lives until here
```

Excluding static items, if a function returns a borrow (i.e. contains `&`) then the source of the borrow _must_ be a borrow passed in as an input paramter since variables created in the function body will be dropped when the function body closes. This is important for understanding an example provided in Klabnik and Nichols', which I discuss in the next section.

## Lifetimes Case 1: Function Parameter Lifetime Ambiguity

Klabnik and Nichols provide the following example in the 2018 version of their book:

```rust
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

The borrow checker errors with "expected lifetime parameter" as we saw earlier, but provides a new suggestion.

```rust
fn longest(x: &str, y: &str) -> &str {
                                ^ expected lifetime parameter

  = help: this function's return type contains a borrowed value, but the signature does not say whether it is borrowed from `x` or `y`
```

The borrow checker mentions that the return type contains a borrowed value, but "the signature does not say whether it is borrowed from `x` or `y`." Excluding the case of static items, if a function returns a reference, then the reference must originate from one of the function's inputs.

But if there is more than one input parameter,
which one should the borrow checker check still points to 
valid data?

Both, it turns out. Using lifetime annotation in the function
signature, here is the answer to the problem Klabnik and Nichols
posed.
                    
```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

Stepping back, I am going to build the function from scratch 
to understand how it works. Take the following example:

```rust
fn longest1(x: &str) -> &str {
    x
}
```

Comparing `longest` to `longest1` the first thing that sticks
out regarding lifetime annotations is that there are none; they
can be _elided_ (i.e. 'ommitted'). Since there is only one input 
parameter, the borrow checker needs no additional information:
it can infer which value the returned reference points to. 

Note: we can always include lifetime annotations. 
The following is equivalent to `longest1`.

```rust
fn longest2<'a>(x: &'a str) -> &'a str {
    x
}
```

Introducing another value parameter does not complicate
things. The following compiles.

```rust
fn longest3(x: &str, y: i32) -> &str {
    x
}
```

But another reference parameter, no matter the type, 
will generate an error. For example:

```rust
fn longest4(x: &str, y: &i32) -> &str {
    x
}
```

Before introducing any conditional logic into the 
function body, we are back where we started with
the "signature does not say whether it is borrowed 
from `x` or `y`" error. 

Introducing lifetime annotations to the parameter used 
in the function body, `x`, resolves the issue.

```rust
fn longest5<'a>(x: &'a str, y: &i32) -> &'a str {
    x
}
```

The above function, `longest5`, explicitly ties 
together the lifetime of the input parameter `x` and
the lifetime of the returned reference. The lifetime 
annotations do nothing other than tell the compiler how
to validate the references are still valid.

What does `longest5` tell us in practice? The following 
example sheds light on how lifetime annotations connect 
underlying values. (Here I borrow Klabnik and Nichols' 
helpful lifetime comment/illustrations).

```rust
fn main() {
    let z;                              // -----------+-- 'a
    {                                   //            |
        let y = String::from("bye");    // ---+-- 'b  |
        z = longest6("hi", &y);         //    |       |
    }                                   // ---+       |
    println!("{}", z);                  //            | y is dead, but z does not care
}                                       // -----------+

fn longest6<'a>(x: &'a str, y: &str) -> &'a str {
    x
}
```

Above, I define a runner function that itself defines some values, an
internal scope which calls `longest6` and then prints `z`.
`longest6` is the closest thing to the original `longest` 
we have seen (both inputs are of type `&str`).

In the following example, I move one step closer to the 
original `longest` by actually doing something with `y` in the
body of the function. It makes no difference.

```rust
fn main() {
    let z;                              // -----------+-- 'a
    {                                   //            |
        let y = String::from("bye");    // ---+-- 'b  |
        z = longest7("hi", &y);         //    |       |
    }                                   // ---+       |
    println!("{}", z);                  //            | y is dead, but z STILL does not care
}                                       // -----------+

fn longest7<'a>(x: &'a str, y: &str) -> &'a str {
    println!("{}", y);
    x
}
```

Using the same runner with a function extremely close
to the original `longest`, we run into a problem.

```rust
fn main() {
    let z;                              // -----------+-- 'a
    {                                   //            |
        let y = String::from("bye");    // ---+-- 'b  |
        z = longest("hi", &y);          //    |       |
    }                                   // ---+       |
    println!("{}", z);                  //            | y is dead, but z needs it
}                                       // -----------+

fn longest8<'a>(x: &'a str, y: &str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

The difference between `longest8` and the original 
`longest` is that I have not included the lifetime 
annotation on the `y` parameter. 

This does not compile since
the borrow checker identifies that `y` could possibly be 
returned by `longest8`. The Rust compiler tells 
us exactly what to do:

```rust
fn longest8<'a>(x: &'a str, y: &str) -> &'a str {
                            - consider changing the type of `y` to `&'a str`

        y
        ^ lifetime `'a` required
```

Taking the compiler's advice, we add the lifetime annotation
to `y`, which (finally) makes this function the original 
`longest`.

```rust
fn main() {
    let z;                              // -----------+-- 'a
    {                                   //            |
        let y = String::from("bye");    // ---+-- 'b  |
        z = longest8("hi", &y);         //    |       |
    }                                   // ---+       |
    println!("{}", z);                  //            | y is dead, but z needs it
}                                       // -----------+

fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

The point of this exercise is not to produce compiling code...yet. 
When I compiler the code above, I get the following:

```rust
        z = longest("hi", &y);          //    |       |
                           ^ borrowed value does not live long enough
    }                                   // ---+       |
    - `y` dropped here while still borrowed
    println!("{}", z);                  //            | y is dead, but now z needs it
}                                       // -----------+
- borrowed value needs to live until here
```

The code above illustrates why the borrow checker exists.
I introduced a possible UaF bug and the 
borrow checker caught the bug at compile time. 

```rust
fn main() {
    let y = String::from("bye");    // -----------+-- 'a
    let z = longest("hi", &y);      // ---+-- 'b  |
    println!("{}", z);              //    |       |
}                                   // -----------+ y and z are cleaned
```

By fixing `main` so that both inputs have the same lifetime, the 
Rust compiler validates I have no memory integrity issues.

## Lifetimes Case 2: Structs with References

Annotating lifetimes of references in structs are much 
easier to understand if you understand the cases above. 
The following example is probably as simple as it gets:

```rust
struct Coordinate {
    x: &i32
}
```

The borrow checker tells us right away we have a problem:

```rust
x: &i32
   ^ expected lifetime parameter
```

This is because, as we saw earlier, if the borrowed value, `x`
is dropped before the `Coordinate` struct uses it, then, again,
we have a UaF bug. Take the following concrete example:

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

`main` defines a struct `Coordinate` and an internal 
scope that will, as we saw earlier, drop its local variable, 
`x`, at its closing brace `}`.

Let's just do what the 
borrow checker says and add a lifetime annotation `'a` to the 
borrowed value.

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
        coord = Coordinate { x: &x };
                                 ^ borrowed value does not live long enough
    }
    - `x` dropped here while still borrowed
    println!("{:?}", coord.x);
}
- borrowed value needs to live until here
```

The reason the borrow checker exists is to maintain memory integrity. 
Here, it catches that the dropped `x` will later be consumed (a UaF bug),
so we can fix the issue.

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



## Lifetimes Case 3: Struct Implementations with References

Forthcoming...
