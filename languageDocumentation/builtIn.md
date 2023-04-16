
# Built-In Identifiers

This page documents built-in constants, functions, interfaces, factors, and modules in OstraCode.

## Built-In Constants

OstraCode includes the following built-in constants:

* `undef` = Undefined value
* `null` = Null value
* `true` = True boolean value
* `false` = False boolean value
* `itemT`, `typeT`, `valueT`, `missingT`, `undefT`, `nullT`, `boolT`, `numT`, `strT`, and `factorT` = Types as described earlier in this documentation
* `this` = Current object whose factor type is specified by the `thisFactor` statement
* `self` = Current object whose factor type is the parent feature type
* `configConstants` = Dictionary determined by compilation rules in `ostraConfig.json`.

## Built-In Functions

OstraCode has the following built-in functions:

* `print($item)` prints item `$item` to standard output.
* `getType($item)` returns the type of item `$item` known at evaltime.
    * If the type of `$item` conforms to `typeT`, `getType` returns the type of the type.
    * If the type of `$item` conforms to `valueT`, `getType` may return a type which is less specific than the type known at comptime.
* `nominate($type)` creates a subtype of type `$type`. The subtype defines the same data structure as `$type`, but is distinguished through the nominal type system.

## Built-In Interfaces

OstraCode has the following built-in interfaces:

### To String Interface:

```
comp ToStringT = <interfaceT [
    sharedFields [
        toString (methodT [
            returns (strT)
        ]) [publicGet, vis (2)]
    ]
]>
```

The `toString` method converts the parent item to a string. Every non-object item implements `ToStringT`. The `ToStringT` interface interoperates with the concatenation operator (`+`).

### Length Interface:

```
comp LengthT = <interfaceT [
    itemFields [
        length (numT) [publicGet, protectedSet, vis (2)]
    ]
]>
```

The `length` field stores the number of members in the parent item. Strings, lists, and dictionaries implement `LengthT`.

### Conforms To Interface:

```
comp ConformsToT = <interfaceT [
    sharedFields [
        conformsTo (methodT [
            args [type (typeT)]
            returns (boolT)
        ]) [publicGet, vis (2)]
    ]
]>
```

The `conformsTo` method determines whether the parent item conforms to the given type. Every type implements `ConformsToT`.

### Subscript Get Interface:

```
comp SubscriptGetT = <genericT [
    args [subscriptT <typeT>, memberT = (itemT)]
] (interfaceT [
    sharedFields [
        getMember (methodT [
            args [subscript (subscriptT)]
            returns (memberT)
        ]) [publicGet, vis (2)]
    ]
])>
```

The `getMember` method retrieves the member located at `subscript`. Strings, lists, and dictionaries implement `SubscriptGetT`. The `SubscriptGetT` interface interoperates with the subscript operator (`@`).

### Subscript Set Interface:

```
comp SubscriptSetT = <genericT [
    args [subscriptT <typeT>, memberT = (itemT)]
] (interfaceT [
    sharedField [
        setMember (methodT [
            args [subscript (subscriptT), item (memberT)]
        ]) [publicGet, vis (2)]
    ]
])>
```

The `setMember` method modifies the member located at `subscript`. Lists and dictionaries implement `SubscriptSetT`. The `SubscriptSetT` interface interoperates with the subscript operator (`@`).


### Subscript Delete Interface:

```
comp SubscriptDeleteT = <genericT [
    args [subscriptT <typeT>]
] (interfaceT [
    sharedFields [
        deleteMember (methodT [
            args [subscript (subscriptT)]
        ]) [publicGet, vis (2)]
    ]
])>
```

The `deleteMember` method deletes the member located at `subscript`. Dictionaries implement `SubscriptDeleteT`.

### Iterator Interface:

```
comp IteratorT = <genericT [
    args [memberT = (itemT)]
] (interfaceT [
    sharedFields [
        getNext (methodT [
            returns (memberT)
        ]) [publicGet, vis (2)]
        isFinished (methodT [
            returns (boolT)
        ]) [publicGet, vis (2)]
    ]
])>
```

The `getNext` method retrieves the next member in the iteration. The `isFinished` method returns whether the iteration has finished. The `IteratorT` interface interoperates with the `IterableT` interface.

### Iterable Interface:

```
comp IterableT = <genericT [
    args [memberT = (itemT)]
] (interfaceT [
    sharedFields [
        createIterator (methodT [
            returns (*IteratorT+:(memberT))
        ]) [publicGet, vis (2)]
    ]
])>
```

The `createIterator` method creates a new iterator which iterates over members in the parent item. Strings, lists, and dictionaries implement `IterableT`. The `IterableT` interface interoperates with the `for` statement.

### Error Message Interface:

```
comp ErrorMessageT = <interfaceT [
    itemFields [
        message (strT) [publicGet, protectedSet, vis (2)]
    ]
]>
```

The `message` field stores an error message. The `Error` factor implements `ErrorMessageT`.

### Then Interface:

```
comp ThenT = <genericT [
    args [resultT <typeT> = (undefT)]
] (interfaceT [
    sharedFields [
        then (methodT [
            args [
                onResolve (funcT [args [result (resultT)]])
                onReject (funcT [args [error]]) [optional]
            ]
            returns <??self>
        ]) [publicGet, vis (2)]
    ]
])>
```

The `ThenT` interface represents an asynchronous task. The `Promise` factor implements `ThenT`. The `ThenT` interface interoperates with the `await` special.

## Built-In Factors

OstraCode has the following built-in factors:

### Error Factor:

`Error` stores an error. `Error` implements the `ToStringT` and `ErrorMessageT` interfaces. `Error` also provides the following methods:

* `$error.init($message)` initializes the error with string message `$message`.

### Promise Factor:

`Promise+:<$resultType>` stores an asynchronous task. `Promise` implements the `ToStringT` and `ThenT+:($resultType)` interfaces. `Promise` also provides the following methods:

* `$promise.init($task)` initializes the promise with function `$task`. The type of `$task` is below:
    ```
    funcT [args [
        resolve (funcT [args [result ($resultType)]])
        reject (funcT [args [error]])
    ]]
    ```

## Built-In Modules

OstraCode has the following built-in modules:

### Math Utils:

The `mathUtils` module exports the following members:

* `mathUtils.random()` returns a random floating-point number between 0 and 1.

### Time Utils:

The `timeUtils` module exports the following members:

* `timeUtils.afterWait($delay, $callback)` invokes function `$callback` after waiting `$delay` seconds.


