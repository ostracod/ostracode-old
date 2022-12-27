
# Example Code

This page provides example OstraCode with minimal emphasis on the feature system.

## Basic Value Manipulation

The example below prints the prime numbers between 1 and 100:

```
const isPrime = (func [
    args [value <numT>]
    returns <boolT>
] {
    var factor = (2)
    while (factor #lt value) {
        if (value % factor #eq 0) {
            return (false)
        }
        (factor += 1)
    }
    return (true)
})

var value = (2)
while (value #lte 100) {
    if (isPrime(value)) {
        (print(value))
    }
    (value += 1)
}
```

The example below performs bubble sort on a list of numbers:

```
const nums = (list (30, 15, 18, 3, 20))
(print(nums))

while (true) {
    var isSorted = (true)
    var index = (1)
    while (index #lt nums.length) {
        const num1 = (nums @ (index - 1))
        const num2 = (nums @ index)
        if (num1 > num2) {
            (isSorted = false)
            (nums @ (index - 1) = num2)
            (nums @ index = num1)
        }
        (index += 1)
    }
    if (isSorted) {
        break
    }
}

(print(nums))
```

## Type Wrangling

The example below declares a function which creates dictionary types:

```
comp createDictType = <func [
    args [fieldName <strT>]
    returns <?dictT>
] {
    return (dictT [fields [
        (fieldName) <boolT>
    ]])
}>

// `myDictType` is equal to `dictT [fields [isCool <boolT>]]`.
comp myDictType = <createDictType("isCool")>

// Does not throw a compile-time error, because the type
// of `myDict1` conforms to `myDictType`.
const myDict1 <myDictType> = (dict [fields [isCool = true]])

// Throws a compile-time error, because the `isCool` field
// in `myDict2` stores the wrong type of item.
const myDict2 <myDictType> = (dict [fields [isCool = 123]])
```

The example below demonstrates the difference between constraint type and initialization type:

```
// The constraint type of `myData` is `valueT`.
// The initialization type of `myData` is `numT`.
const myData <valueT> = (123)
// Prints "valueT".
(print<?myData>)
// Prints "numT".
(print<??myData>)

// Does not throw a compile-time error, because `strT`
// conforms to `valueT`.
const myNum1 <?myData> = ("Hello")
// Throws a compile-time error, because `strT` does
// not conform to `numT`.
const myNum2 <??myData> = ("Hello")
```

The example below creates a function whose signature depends on the initialization type of the first argument:

```
const chooseOne = (func [
    args [
        param1 <itemT>
        param2 <??param1>
        useFirst <boolT>
    ]
    returns <??param1>
] {
    if (useFirst) {
        return (param1)
    } else {
        return (param2)
    }
})

// The constraint type of `result1` is `numT`.
// `result1` will store 10 at evaltime.
const result1 = (chooseOne(10, 20, true))
// The constraint type of `result2` is `strT`.
// `result2` will store "twenty" at evaltime.
const result2 = (chooseOne("ten", "twenty", false))
```

The example below demonstrates the constraint type and initialization type of value literals:

```
// `sevenConstraintT` is equal to `numT`.
comp sevenConstraintT = <?7>
// `sevenT` is a more specific type than `sevenConstraintT`,
// and refers to numbers which are equal to 7.
comp sevenT = <??7>

// Does not throw a compile-time error, because the constraint
// type of `50` is `numT`.
const myNumber <sevenConstraintT> = 50
// Does not throw a compile-time error. The initialization
// type of `7` is equal to `sevenT`, so `7` is implicitly
// cast to `sevenT`.
const myNumber <sevenT> = 7
// Throws a compile-time error. The initialization type of
// `50` is not equal to `sevenT`, so `50` cannot be
// implicitly cast to `sevenT`.
const myNumber <sevenT> = 50
```

The example below demonstrates usage of the `nominalT` special:

```
// `myNumT` conforms to `numT`, but `numT`
// does not conform to `myNumT`.
comp myNumT = <nominalT (numT)>

// Throws an error, because the constraint type of 123 is `numT`.
const myNum1 <myNumT> = (123)
// Does not throw a compile-time error.
const myNum2 <myNumT> = (123:<myNumT>)
```

The example below demonstrates type checking at runtime:

```
var myType <typeT>
if (mathUtils.random() > 0.5) {
    (myType = numT)
} else {
    (myType = strT)
}
// Prints "numT" or "strT" with equal probability.
print(myType)

// Prints "Number type!" or "Other type!" depending on
// the contents of `myType`.
if (myType.conformsTo(numT)) {
    print("Number type!")
} else {
    print("Other type!")
}
```

## Miscellaneous Statements

The example below demonstrates usage of the `throw` and `try` statements:

```
// This `try` statement will print the messages
// "No problem!" and "Clean up!".
try {
    (print("No problem!"))
} catch error {
    (print(error))
} finally {
    (print("Clean up!"))
}

// This `try` statement will print the messages
// "Ouch!" and "Clean up!".
try {
    throw ("Ouch!")
    (print("Not reached!"))
} catch error {
    (print(error))
} finally {
    (print("Clean up!"))
}
```

The example below demonstrates usage of import statements:

```
// Imports the module at path "./myModule.ostc" as `myModule`.
importPath [as myModule] <"./myModule.ostc">
// Invokes the member `performJob` in `myModule`.
(myModule.performJob())

// Imports the member named `generateMessage` from the module at path
// "./myUtils.ostc", and renames the member to `createMessage`.
importPath [members [
    generateMessage as createMessage
]] <"./myUtils.ostc">
// Prints the item returned by invoking `createMessage`.
(print(createMessage())

// Imports the member named `myNum` from the foreign module at path
// "./myConstants.js", and asserts that the constraint type of
// `myNum` is `numT`.
importPath [foreign, members [
    myNum <numT>
]] <"./myConstants.js">
// Stores the sum of `myNum` and 1.
const myResult = (myNum + 1)
```

The example below demonstrates usage of `async` and `await`:

```
// `sleep` returns a promise which resolves
// after `delay` seconds.
const sleep = (func [
    args [delay <numT>]
    returns <*ThenT>
] {
    return ((obj (Promise)).init(func [
        args [resolve <funcT>]
    ] {
        timeUtils.afterWait(delay, resolve)
    }))
})

// `tellJoke` waits 5 seconds between the
// question and the punchline.
const tellJoke = (func [async] {
    (print("Why is 6 afraid of 7?"))
    (await (sleep(5)))
    (print("Because 7 8 9!"))
})

(tellJoke())
```


