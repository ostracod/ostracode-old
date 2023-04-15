
# Feature System

This page documents the feature system in OstraCode.

## Features and Interfaces

Every object in OstraCode includes one or more "features". A feature defines fields and methods which belong to the parent object. The example below declares a feature and creates an object which includes the feature:

```
// Declares a feature with a field and a method.
const Counter = (feature [
    fields [
        count <numT> [public]
    ]
    methods [
        increment [public] {
            (self.count += 1)
        }
    ]
])

// Creates an object which includes the `Counter` feature.
const myCounter = (obj (Counter))
// Sets the initial value of the `count` field.
(myCounter.count = 2)
// Invokes the `increment` method.
(myCounter.increment())
// Prints "3".
(print(myCounter.count))
```

An "interface" defines field types and method signatures without providing implementations. Every feature may implement a single interface. Features which implement the same interface may be used interchangeably. The example below declares two features which implement the same interface:

```
// Declares an interface with one method signature.
comp SpeakT = <interfaceT [
    methods [
        speak [public, returns (strT)]
    ]
]>

// Declares a feature which implements `SpeakT`.
const DogSpeak = (feature [
    implements <SpeakT>
    methods [
        speak [public, returns <strT>] {
            return ("Woof!")
        }
    ]
])

// Declares another feature which implements `SpeakT`.
const CatSpeak = (feature [
    implements <SpeakT>
    methods [
        speak [public, returns <strT>] {
            return ("Meow!")
        }
    ]
])

// `mySpeaker` can store any object which includes a feature
// that implements `SpeakT`.
var mySpeaker <*SpeakT>
// Assign an object which includes the `DogSpeak` feature.
(mySpeaker = obj (DogSpeak))
// Prints "Woof!".
(print(mySpeaker.speak())
// Assign an object which includes the `CatSpeak` feature.
(mySpeaker = obj (CatSpeak))
// Prints "Meow!".
(print(mySpeaker.speak())
```

Unlike TypeScript, OstraCode enforces nominal typing for interfaces and features. The example below demonstrates how structural compatibility does not suffice for type compatibility:

```
comp SizeT = <interfaceT [
    fields [
        size (numT) [public]
    ]
]>

// Note how `CargoSize` and `ShirtSize` do not have
// `implements` statements.

const CargoSize = (feature [
    fields [
        size <numT> [public]
    ]
])

const ShirtSize = (feature [
    fields [
        size <numT> [public]
    ]
])

// Throws a compile-time error, because `CargoSize` does
// not implement `SizeT`.
const sizeObj1 <*SizeT> = (obj (CargoSize))
// Throws a compile-time error, because `ShirtSize` does
// not implement `SizeT`.
const sizeObj2 <*SizeT> = (obj (ShirtSize))

// Does not throw a compile-time error.
const myCargo <*?CargoSize> = (obj (CargoSize))
// Throws a compile-time error, because `<*?CargoSize>`
// does not conform to `<*?ShirtSize>`.
const myShirt <*?ShirtSize> = (obj (CargoSize))
```

In order to access members of a feature, the feature must have a "discerned" type. The output of the `feature` special always has a discerned type, but the output of the `featureT` special is not a discerned type. The `discern` special helps in the case when a feature does not have a discerned type. The `discern` special accepts a feature, and returns the same feature with a discerned type. The example below demonstrates usage of the `discern` special:

```
// The output of `createCoinFeature` has a constraint type
// which is not discerned.
const createCoinFeature = (func [
    args [probability <numT>]
    returns <featureT [methods [
        flip [returns (boolT)]
    ]]>
] {
    return (feature [methods [
        flip [returns <boolT>] {
            return (mathUtils.random() < probability)
        }
    ]])
})

// `AmbiguousCoin` does not have a discerned type.
const AmbiguousCoin = (createCoinFeature(0.7))
// `DiscernedCoin` has a discerned type.
const DiscernedCoin = (discern (AmbiguousCoin))
const coin1 = (obj (AmbiguousCoin))
const coin2 = (obj (DiscernedCoin))
// Throws a compile-time error, because the feature of `coin1`
// does not have a discerned type.
(print(coin1.flip()))
// Does not throw a compile-time error.
(print(coin2.flip()))
```

## Bundles and Factors

A "bundle" is a data structure which can group several features together. When an object includes a bundle, the members of all features in the bundle belong to the object. Members may be selected from individual features by casting the object to a type. The example below declares a bundle and creates an object which includes the bundle:

```
const AddFive = (feature [
    methods [
        addFive [
            public
            args [num <numT>]
            returns <numT>
        ] {
            return (num + 5)
        }
    ]
])

const Nameable = (feature [
    fields [
        name <strT> [public]
    ]
])

// Declares a bundle which contains `AddFive` and `Nameable`.
const MyBundle = (bundle [
    factors [(AddFive), (Nameable)]
])

// Creates an object which includes `MyBundle`.
const myObj = (obj (MyBundle))
// Prints "15".
(print(myObj:<*?AddFive>.addFive(10)))
// Assigns "Steve" to the `name` field in the `Nameable`
// feature of `myObj`.
(myObj:<*?Nameable>.name = "Steve")
```

Features and bundles are both considered to be "factors". A bundle contains one or more factors, which means that a bundle may store features, other bundles, or a mixture of features and bundles. The example below declares a bundle which contains another bundle:

```
const AFeature = (feature [fields [
    a <numT> [public] = (10)
]])
const BFeature = (feature [fields [
    b <numT> [public] = (20)
]])
const CFeature = (feature [fields [
    c <numT> [public] = (30)
]])

const BcBundle = (bundle [factors [(BFeature), (CFeature)]])

const AbcBundle = (bundle [factors [(AFeature), (BcBundle)]])

const myAbc = (obj (AbcBundle))
(print(myAbc:<*?AFeature>.a)) // Prints "10".
(print(myAbc:<*?BFeature>.b)) // Prints "20".
(print(myAbc:<*?CFeature>.c)) // Prints "30".
```

## Member Visibility

Every factor member is associated with an integer "visiblity". A member is only visible from the member access operator (`.`) if the member's visibility is greater than zero. By default, the visibility of every member is 1, but a different visibility may be specified with the `vis` statement. When a factor is included in a bundle, the visibility of all factor members is decreased by 1. In order to be visible in the bundle, the factor members must specifiy visibility 2 or higher. The example below demonstrates usage of visibility:

```
const IsBig = (feature [methods [
    isBig [
        public, vis <2>
        args [value <numT>]
        returns <boolT>
    ] {
        return (value #gt 100)
    }
]])

const IsSmall = (feature [methods [
    isSmall [
        public, vis <2>
        args [value <numT>]
        returns <boolT>
    ] {
        return (value #lt 0.1)
    }
    // The visibility of `isTiny` is 1, because 1 is the default
    // visibility when a `vis` statement is not provided.
    isTiny [
        public
        args [value <numT>]
        returns <boolT>
    ] {
        return (value #lt 0.001)
    }
]])

// Within the `SizeCheck` bundle, `isBig` and `isSmall` have
// visibility 1, while `isTiny` has visibility 0.
const SizeCheck = (bundle [factors [(IsBig), (IsSmall)]])

const sizeChecker = (obj (SizeCheck))
// Does not throw a compile-time error, because the visibility of
// `isBig` in `SizeCheck` is greater than 0.
print(sizeChecker.isBig(1000))
// Does not throw a compile-time error, because the visibility of
// `isSmall` in `SizeCheck` is greater than 0.
print(sizeChecker.isSmall(1000))
// Throws a compile-time error, because the visibility of `isTiny`
// in `SizeCheck` is not greater than 0.
print(sizeChecker.isTiny(1000))
// Does not throw a compile-time error, because the visibility of
// `isTiny` in `IsSmall` is greater than 0.
print(sizeChecker:<*?IsSmall>.isTiny(1000))
```

In certain cases, it may be desirable to decrease factor visibility in a bundle by a different amount than 1. The `shield` statement may be used to decrease factor visibility by a custom amount. The example below demonstrates usage of the `shield` statement:

```
const Age = (feature [fields [
    age <numT> [public]
]])
const Height = (feature [fields [
    height <numT> [public]
]])

// Within the `Profile` bundle, the visibility of `age` is 1,
// while the visibility of `height` is 0.
const Profile = (bundle [factors [
    // The visibility of members in `Age` will decrease by 0.
    (Age) [shield <0>]
    // The visibility of members in `Height` will decrease by 1,
    // because that is the default amount when a `shield`
    // statement is not provided.
    (Height)
]])

const myProfile = (obj (Profile))
// Does not throw a compile time-error.
(myProfile.age = 30)
// Throw a compile time-error, because `height` is not visibile
// in `Profile`.
(myProfile.height = 180)
// Does not throw a compile time-error.
(myProfile:<*?Height>.height = 180)
```

A "name collision" occurs when two members with the same name are visible in a bundle. The compiler will throw an error when trying to access a member with a name collision. Effective management of member visibility can prevent this issue. The example below demonstrates a name collision:

```
const VideoManager = (feature [methods [
    play [public, vis <2>] {
        (print("I will play the video!"))
    }
]])

const Athlete = (feature [methods [
    play [public] {
        (print("I will play the sportsball!"))
    }
]])

const steve = (obj (bundle [
    factors [(VideoManager), (Athlete) [shield <0>]]
]))
// Throws a compile-time error, because `play` has a
// name collision.
(steve.play())
// Does not throw a compile-time error.
(steve:<*?VideoManager>.play())
// Does not throw a compile-time error.
(steve:<*?Athlete>.play())
```

## This and Self

The `thisFactor` statement determines the type of `this` when referenced in a method. By using the `thisFactor` statement, factors within the same bundle may interact with each other. The example below demonstrates usage of the `thisFactor` statement:

```
const Count = (feature [
    fields [
        count <numT> [public, vis <2>] = (0)
    ]
])

const Increment = (feature [
    // The type of `this` in methods of `Increment` will
    // be `objT <?CountT>`.
    thisFactor <?Count>
    methods [
        increment [public, vis <2>] {
            (this.count += 1)
        }
    ]
])

const counter = (obj (bundle [
    factors [(Count), (Increment)]
]))
(counter.increment())
(print(counter.count)) // Prints "1".
```

Note that the compiler will throw an error when creating an object with an unresolved `thisFactor` statement. The example below demonstrates an unresolved `thisFactor` statement:

```
const CreateGreeting = (feature [
    methods [
        createGreeting [
            public
            args [name <strT>]
            returns <strT>
        ] {
            return ("Hello, " + name + "!")
        }
    ]
])

const GreetWorld = (feature [
    thisFactor <?CreateGreeting>
    methods [
        greetWorld [public] {
            (print(this.createGreeting("world")))
        }
    ]
])

// Throws a compile-time error, because `CreateGreeting` must be
// included in the same object as `GreetWorld`.
const badGreeter = (obj (GreetWorld))
// Does not throw a compile-time error.
const goodGreeter = (obj (bundle [
    factors[(CreateGreeting), (GreetWorld)]
]))
```

When referenced in a method, the type of `self` is determined by the feature in which the method is defined. Unlike `this`, the type of `self` cannot be changed with an attribute statement. `self` is used to access members of the parent feature. The example below demonstrates usage of `self`:

```
const IsActive = (feature [
    fields [
        isActive <boolT> [public] = (false)
    ]
])

const Toggle = (feature [
    thisFactor <?IsActive>
    fields [
        toggleCount <numT> [public] = (0)
    ]
    methods [
        toggle [public] {
            // The type of `this` is `objT <?IsActive>`.
            (this.isActive = !this.isActive)
            // The type of `self` is `objT <?Toggle>`.
            (self.toggleCount += 1)
        }
    ]
])

const toggler = (obj (bundle [
    factors [
        (IsActive) [shield <0>]
        (Toggle) [shield <0>]
    ]
]))
(toggler.toggle())
(toggler.toggle())
(toggler.toggle())
(print(toggler.isActive)) // Prints "true".
(print(toggler.toggleCount)) // Prints "3".
```

## Member Permission

The `public`, `protected`, and `private` statements determine the contexts in which feature members may be accessed. Public members have no access restrictions. Protected members may only be accessed by methods belonging to the same object. Private members may only be accessed by methods which are defined in the same feature. By default, members are private when no permission statement is provided. The example below demonstrates usage of permission statements:

```
const User = (feature [methods [
    getName [public, vis<2>, returns <strT>] {
        // Does not throw a compile-time error, because
        // `getSecret` is accessed in the same feature
        // as it was defined.
        if (self.getSecret().length > 5) {
            return ("Bob")
        } else {
            return ("Bobby")
        }
    }
    getTown [protected, vis<2>, returns <strT>] {
        return ("Townston")
    }
    getSecret [private, vis<2>, returns <strT>] {
        return ("sleepysheep")
    }
]])

const CitizenTools = (feature [methods [
    thisFactor <?User>
    getWarning [public, returns <strT>] {
        // Does not throw a compile-time error, because
        // `getName` is public.
        return (this.getName() + ", beware of tornados!")
    }
    isInTownston [public, returns <bool>] {
        // Does not throw a compile-time error, because
        // `isInTownston` belongs to the same object
        // as `getTown`.
        return (this.getTown() #eq "Townston")
    }
    printSecret [public] {
        // Throws a compile-time error, because `printSecret`
        // is defined in a different feature than `getSecret`.
        (print(this.getSecret())
    }
]])

const citizen = (obj (bundle [
    factors [(User), (CitizenTools)]
]))
// Does not throw a compile-time error, because
// `getName` is public.
(print(citizen.getName()))
// Throws a compile-time error, because `getTown` may only
// be invoked in `User` or `CitizenTools`.
(print(citizen.getTown()))
// Throws a compile-time error, because `getSecret` may
// only be invoked in `User`.
(print(citizen.getSecret()))
```

Fields may specify read and write permissions separately. The `publicGet`, `protectedGet`, and `privateGet` statements determine field read permission. The `publicSet`, `protectedSet`, and `privateSet` statements determine field write permission. The example below demonstrates usage of read and write permission statements:

```
const Transfer = (feature [
    fields [
        source <numT> [privateGet, publicSet]
        dest <numT> [publicGet, privateSet]
    ]
    methods [
        transfer [public] {
            (self.dest = self.source)
        }
    ]
])

const myExchange = (obj (Transfer))
// Does not throw a compile-time error, because `source`
// has public write permission.
(myExchange.source = 123)
(myExchange.transfer())
// Does not throw a compile-time error, because `dest`
// has public read permission.
(print(myExchange.destination))
// Throws a compile-time error, because `source` has
// private read permission.
(print(myExchange.source))
// Throws a compile-time error, because `dest` has
// private write permission.
(myExchange.dest = 999)
```

## Generic Factors

A generic factor may be "qualified" with one or more arguments. Field types and method signatures may reference the generic arguments. Generic factors may be created by using the `generic` special. The example below demonstrates usage of generic factors:

```
// `ListNode` may be qualified with a type argument
// named `contentT`, whose constraint type is `typeT`.
const ListNode = (generic [
    args [contentT <typeT>]
] (feature [
    fields [
        // The constraint type of `content` is equal to the
        // type argument `contentT`.
        content <contentT> [public]
        // `next` can store another node which stores
        // the same type of content.
        next <*?ListNode+:<contentT>> [public]
    ]
]))

const node1 = (obj (ListNode+:<numT>))
const node2 = (obj (ListNode+:<numT>))
// The type of `content` in `node1` and `node2` is `numT`.
(node1.content = 10)
(node2.content = 20)
// The type of `next` in `node1` and `node2`
// is `<*?ListNode+:<numT>>`.
(node1.next = node2)
```


