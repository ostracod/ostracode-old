
# Fundamentals

This page documents time grades and data types in OstraCode.

## Time Grades

In OstraCode, each expression is associated with a "time grade". An expression's time grade determines when the expression is evaluated with respect to its parent context, which may be a statement or another expression. Each expression may have one of three time grades:

* Compile-time ("comptime") expressions are evaluated in advance of all other expressions in their parent context.
* Evaluation-time ("evaltime") expressions are evaluated when their parent context is evaluated.
* Never-time ("nevertime") expressions are never evaluated. Instead, the compiler may derive type information from nevertime expressions.

"Runtime" describes the time when compiled OstraCode is evaluated in a running application. Note that evaltime is not always equivalent to runtime, because an evaltime expression nested in a comptime expression would not be evaluated at runtime.

In an analagous fashion, each variable is also associated with a time grade. A variable's time grade determines when the content of the variable is known. Each variable may have one of two time grades:

* Comptime variables store items which are known before evaluation of their parent block.
* Evaltime variables store items which are only known during evaluation of their parent block.

Note that an expression may not reference an evaltime variable if the expression is comptime with respect to the variable.

## Data Types

In OstraCode, each variable is associated with a "constraint type" which must be known at comptime. Variables may only store items whose type conforms to the variable's constraint type. Each variable also has an "initialization type", which is the type of item assigned to the variable during initialization. A variable's initialization type may be more specific than its constraint type.

In an analagous fashion, each expression has a constraint type which is known at comptime. The compiler derives the constraint type of an expression based on the operations and operands in the expression.

OstraCode has the following data types:

* `undefT` is the type of an unintentionally missing item.
* `nullT` is the type of an intentionally missing item.
* `boolT` is the type of a boolean value. A boolean value is either true or false.
* `numT` is the type of a number. Every number is a double-precision floating-point number.
* `strT` is the type of a string. A string stores a sequence of characters.
* `listT` is the type of a list. A list stores a sequence of items.
* `dictT` is the type of a dictionary. A dictionary stores a map from string key to item.
* `funcT` is the type of a function. A function accepts argument items and return an item.
* `methodT` is the type of a method. A method behaves like a function, but references an object for behavior context.
* `interfaceT` is the type of an interface. An interface defines field types and method signatures.
* `featureT` is the type of a feature. A feature defines fields and methods, and may implement an interface.
* `bundleT` is the type of a bundle. A bundle contains one or more features.
* `objT` is the type of an object. An object contains one or more feature instances.

Data types may be categorized into the following supertypes:

* `itemT` is the most generic type. `itemT` is a supertype of all other types.
* `typeT` is the type of a type. Items with type `typeT` may be used as variable constraint types.
* `valueT` is the type of a value. Items with type `valueT` may not be used as variable constraint types.
* `missingT` is the type of a missing item. `missingT` is a supertype of `undefT` and `nullT`.
* `factorT` is the type of a factor. `factorT` is a supertype of `interfaceT`, `featureT`, and `bundleT`.
* `genericT` is the type of an item which may be qualified with one or more arguments.

Note that evaltime variables can store items with type `typeT` even at runtime. This allows applications to manipulate types which are not known during compilation.


