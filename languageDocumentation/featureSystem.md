
# Feature System

This page documents the feature system in OstraCode.

## Features and Interfaces

Every object in OstraCode includes one or more "features". A feature defines fields which may be accessed from the parent object. Fields declared in `itemFields` are stored in each instance of the object. Fields declared in `sharedFields` are shared between all objects which include the feature. Each feature must define a symbol "key" so that the compiler knows how to access different features in the same object. The example below declares a feature and creates two objects which include the feature:

```
// Define the symbol key which identifies `MyFeature`.
const MyFeatureK = (symbol())
// Define the feature `MyFeature`.
const MyFeature = (feature [
    key <@MyFeatureK>
    itemFields [
        myItemField <strT> [public]
    ]
    sharedFields [
        mySharedField <strT> [public]
    ]
])

// Creates two objects which include `MyFeature`.
const myObj1 = (obj (MyFeature))
const myObj2 = (obj (MyFeature))

// Assigns values to `myItemField` in each object.
(myObj1.myItemField = "Hello!")
(myObj2.myItemField = "Hi!")
// Prints "Hello!".
(print(myObj1.myItemField))
// Prints "Hi!".
(print(myObj2.myItemField))

// Assigns a value to `mySharedField`. Note that both `myObj1`
// and `myObj2` share the same value of `mySharedField`.
(myObj1.mySharedField = "Goodbye!")
// Prints "Goodbye!".
(print(myObj1.mySharedField))
// Also prints "Goodbye!".
(print(myObj2.mySharedField))
```

Feature fields can store methods which manipulate other fields in the parent object. When a method is invoked, `self` becomes bound to the instance of the parent object. The example below demonstrates usage of methods:

```
const CounterK = (symbol())
const Counter = (feature [
    key <@CounterK>
    itemFields [
        count <numT> [public] = (0)
    ]
    sharedFields [
        increment [publicGet] = (method {
            (self.count += 1)
        })
    ]
])

const myCounter = (obj (Counter))
// Invokes the `increment` method.
(myCounter.increment())
// Prints "1".
(print(myCounter.count))
```

An "interface" defines field types without providing default values. Every feature may implement a single interface. Features which implement the same interface may be used interchangeably. Interfaces must specify a symbol key in the same manner as features. The example below declares two features which implement the same interface:

```
// Declares an interface with one method.
const SpeakK = (symbol())
comp SpeakT = <interfaceT [
    key <@SpeakK>
    sharedFields [
        speak (methodT [returns (strT)]) [publicGet]
    ]
]>

// Declares a feature which implements `SpeakT`.
const DogSpeakK = (symbol())
const DogSpeak = (feature [
    key <@DogSpeakK>
    implements <SpeakT>
    sharedFields [
        speak [publicGet] = (method [returns <strT>] {
            return ("Woof!")
        })
    ]
])

// Declares another feature which implements `SpeakT`.
const CatSpeakK = (symbol())
const CatSpeak = (feature [
    key <@CatSpeakK>
    implements <SpeakT>
    sharedFields [
        speak [publicGet] = (method [returns <strT>] {
            return ("Meow!")
        })
    ]
])

// `mySpeaker` can store any object which includes a feature
// that implements `SpeakT`.
mutable mySpeaker <*SpeakT>
// Assign an object which includes the `DogSpeak` feature.
(mySpeaker = obj (DogSpeak))
// Prints "Woof!".
(print(mySpeaker.speak())
// Assign an object which includes the `CatSpeak` feature.
(mySpeaker = obj (CatSpeak))
// Prints "Meow!".
(print(mySpeaker.speak())
```

If a feature does not implement an interface, the feature cannot be used in a context which requires the interface, even if the feature defines the same fields as the interface. In a similar fashion, two features with different keys cannot be used interchangeably, even if they define the same fields. The example below demonstrates how structural compatibility does not suffice for type compatibility:

```
const SizeK = (symbol())
comp SizeT = <interfaceT [
    key <@SizeK>
    itemFields [
        size (numT) [public]
    ]
]>

// Note how `CargoSize` and `ShirtSize` do not have
// `implements` statements.

const CargoSizeK = (symbol())
const CargoSize = (feature [
    key <@CargoSizeK>
    itemFields [
        size <numT> [public]
    ]
])

const ShirtSizeK = (symbol())
const ShirtSize = (feature [
    key <@ShirtSizeK>
    itemFields [
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

In order to access fields of a feature, the feature must have a known symbol key. A feature type is said to be "discerned" if it specifies a symbol key. The `discern` special helps in the case when a feature does not have a discerned type. The `discern` special accepts a feature, and returns the same feature with a discerned type. The example below demonstrates usage of the `discern` special:

```
// The output of `createCoinFeature` has a constraint type
// which is not discerned.
const createCoinFeature = (func [
    args [probability <numT>]
    returns <featureT [sharedFields [
        flip (methodT [returns (boolT)]) [publicGet]
    ]]>
] {
    // When the `feature` special does not have a `key` statement,
    // the special will create a new symbol to use as the key.
    return (feature [sharedFields [
        flip [publicGet] = (method [returns <boolT>] {
            return (mathUtils@random() < probability)
        })
    ]])
})

// `AmbiguousCoin` does not have a discerned type.
const AmbiguousCoin = (createCoinFeature(0.7))
mutable DiscernedCoinK <symbolT>
// `DiscernedCoin` has a discerned type.
const DiscernedCoin = (discern (AmbiguousCoin) <@DiscernedCoinK>)
const coin1 = (obj (AmbiguousCoin))
const coin2 = (obj (DiscernedCoin))
// Throws a compile-time error, because the feature of `coin1`
// does not have a discerned type.
(print(coin1.flip()))
// Does not throw a compile-time error.
(print(coin2.flip()))
```

## Bundles and Factors

A "bundle" is a data structure which can group several features together. When an object includes a bundle, the fields of all features in the bundle belong to the object. Fields may be selected from individual features by casting the object to a type. The example below declares a bundle and creates an object which includes the bundle:

```
const AddFiveK = (symbol())
const AddFive = (feature [
    key <@AddFiveK>
    sharedFields [
        addFive [publicGet] = (method [
            args [num <numT>]
            returns <numT>
        ] {
            return (num + 5)
        })
    ]
])

const NameableK = (symbol())
const Nameable = (feature [
    key <@NameableK>
    itemFields [
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
const AFeatureK = (symbol())
const AFeature = (feature [
    key <@AFeatureK>
    itemFields [a <numT> [public] = (10)]
])
const BFeatureK = (symbol())
const BFeature = (feature [
    key <@BFeatureK>
    itemFields [b <numT> [public] = (20)]
])
const CFeatureK = (symbol())
const CFeature = (feature [
    key <@CFeatureK>
    itemFields [c <numT> [public] = (30)]
])

const BcBundle = (bundle [factors [(BFeature), (CFeature)]])

const AbcBundle = (bundle [factors [(AFeature), (BcBundle)]])

const myAbc = (obj (AbcBundle))
(print(myAbc:<*?AFeature>.a)) // Prints "10".
(print(myAbc:<*?BFeature>.b)) // Prints "20".
(print(myAbc:<*?CFeature>.c)) // Prints "30".
```

## Field Visibility

Every factor field is associated with an integer "visiblity". A field is only visible from the member access operator (`.`) if the field's visibility is greater than zero. By default, the visibility of every field is 1, but a different visibility may be specified with the `vis` statement. When a factor is included in a bundle, the visibility of all factor fields is decreased by 1. In order to be visible in the bundle, the factor fields must specifiy visibility 2 or higher. The example below demonstrates usage of visibility:

```
const IsBigK = (symbol())
const IsBig = (feature [
    key <@IsBigK>
    sharedFields [
        isBig [publicGet, vis <2>] = (method [
            args [value <numT>]
            returns <boolT>
        ] {
            return (value #gt 100)
        })
    ]
])

const IsSmallK = (symbol())
const IsSmall = (feature [
    key <@IsSmallK>
    sharedFields [
        isSmall [publicGet, vis <2>] = (method [
            args [value <numT>]
            returns <boolT>
        ] {
            return (value #lt 0.1)
        })
        // The visibility of `isTiny` is 1, because 1 is the default
        // visibility when a `vis` statement is not provided.
        isTiny [publicGet] = (method [
            args [value <numT>]
            returns <boolT>
        ] {
            return (value #lt 0.001)
        })
    ]
])

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
const AgeK = (symbol())
const Age = (feature [
    key <@AgeK>
    itemFields [age <numT> [public]]
])
const HeightK = (symbol())
const Height = (feature [
    key <@HeightK>
    itemFields [height <numT> [public]]
])

// Within the `Profile` bundle, the visibility of `age` is 1,
// while the visibility of `height` is 0.
const Profile = (bundle [factors [
    // The visibility of fields in `Age` will decrease by 0.
    (Age) [shield <0>]
    // The visibility of fields in `Height` will decrease by 1,
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

A "name collision" occurs when two fields with the same name are visible in a bundle. The compiler will throw an error when trying to access a field with a name collision. Effective management of field visibility can prevent this issue. The example below demonstrates a name collision:

```
const VideoManagerK = (symbol())
const VideoManager = (feature [
    key <@VideoManagerK>
    sharedFields [
        play [publicGet, vis <2>] = (method {
            (print("I will play the video!"))
        })
    ]
])

const AthleteK = (symbol())
const Athlete = (feature [
    key <@AthleteK>
    sharedFields [
        play [publicGet] = (method {
            (print("I will play the sportsball!"))
        })
    ]
])

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
const CountK = (symbol())
const Count = (feature [
    key <@CountK>
    itemFields [
        count <numT> [public, vis <2>] = (0)
    ]
])

const IncrementK = (symbol())
const Increment = (feature [
    key <@IncrementK>
    // The type of `this` in methods of `Increment` will
    // be `objT <?CountT>`.
    thisFactor <?Count>
    sharedFields [
        increment [publicGet, vis <2>] = (method {
            (this.count += 1)
        })
    ]
])

const counter = (obj (bundle [
    factors [(Count), (Increment)]
]))
(counter.increment())
(print(counter.count)) // Prints "1".
```

A `thisFactor` statement is "unresolved" when the feature is not included in a bundle with the required factor. The compiler will throw an error when creating an object with an unresolved `thisFactor` statement. The example below demonstrates an unresolved `thisFactor` statement:

```
const CreateGreetingK = (symbol())
const CreateGreeting = (feature [
    key <@CreateGreetingK>
    sharedFields [
        createGreeting [publicGet] = (method [
            args [name <strT>]
            returns <strT>
        ] {
            return ("Hello, " + name + "!")
        })
    ]
])

const GreetWorldK = (symbol())
const GreetWorld = (feature [
    key <@GreetWorldK>
    thisFactor <?CreateGreeting>
    sharedFields [
        greetWorld [publicGet] = (method {
            (print(this.createGreeting("world")))
        })
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

When referenced in a method, the type of `self` is determined by the feature in which the method is defined. Unlike `this`, the type of `self` cannot be changed with an attribute statement. `self` is used to access fields of the parent feature. The example below demonstrates usage of `self`:

```
const IsActiveK = (symbol())
const IsActive = (feature [
    key <@IsActiveK>
    itemFields [
        isActive <boolT> [public] = (false)
    ]
])

const ToggleK = (symbol())
const Toggle = (feature [
    key <@ToggleK>
    thisFactor <?IsActive>
    itemFields [
        toggleCount <numT> [public] = (0)
    ]
    sharedFields [
        toggle [publicGet] = (method {
            // The type of `this` is `objT <?IsActive>`.
            (this.isActive = !this.isActive)
            // The type of `self` is `objT <?Toggle>`.
            (self.toggleCount += 1)
        })
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

## Field Permission

The `publicGet`, `protectedGet`, and `privateGet` statements determine the contexts in which feature fields may be read. Public fields have no access restrictions. Protected fields may only be accessed by methods belonging to the same object. Private fields may only be accessed by methods which are defined in the same feature. The default read permission is `privateGet` when no permission statement is provided. The example below demonstrates usage of permission statements:

```
const UserK = (symbol())
const User = (feature [sharedFields [
    key <@UserK>
    getName [publicGet, vis<2>] = (method [
        returns <strT>
    ] {
        // Does not throw a compile-time error, because
        // `getSecret` is accessed in the same feature
        // as it was defined.
        if (self.getSecret().length > 5) {
            return ("Bob")
        } else {
            return ("Bobby")
        }
    })
    getTown [protectedGet, vis<2>] = (method [
        returns <strT>
    ] {
        return ("Townston")
    })
    getSecret [privateGet, vis<2>] = (method [
        returns <strT>
    ] {
        return ("sleepysheep")
    })
]])

const CitizenToolsK = (symbol())
const CitizenTools = (feature [sharedFields [
    key <@CitizenToolsK>
    thisFactor <?User>
    getWarning [publicGet] = (method [returns <strT>] {
        // Does not throw a compile-time error, because
        // `getName` is public.
        return (this.getName() + ", beware of tornados!")
    })
    isInTownston [publicGet] = (method [returns <bool>] {
        // Does not throw a compile-time error, because
        // `isInTownston` belongs to the same object
        // as `getTown`.
        return (this.getTown() #eq "Townston")
    })
    printSecret [publicGet] = (method {
        // Throws a compile-time error, because `printSecret`
        // is defined in a different feature than `getSecret`.
        (print(this.getSecret())
    })
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

Fields may specify write permission by using the `publicSet`, `protectedSet`, `privateSet`, and `forbiddenSet` statements. When a field has the `forbiddenSet` statement, it is unable to be modified after initialization. The default write permission is `privateSet` within `itemFields`, and `forbiddenSet` within `sharedFields`. The example below demonstrates usage of write permission statements:

```
const TransferK = (symbol())
const Transfer = (feature [
    key <@TransferK>
    itemFields [
        source <numT> [privateGet, publicSet]
        dest <numT> [publicGet, privateSet]
    ]
    sharedFields [
        transfer [publicGet] = (method {
            (self.dest = self.source)
        })
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

For convenience, read and write permissions may be specified together by using the `public`, `protected`, and `private` statements. The example below demonstrates usage of these permission statements:

```
const DualCounterK = (symbol())
const DualCounter = (feature [
    key <@DualCounterK>
    itemFields [
        hiddenCount <numT> [private] = (0)
        exposedCount <numT> [public] = (0)
    ]
    sharedFields [
        incrementHidden [publicGet] = (method {
            // Does not throw a compile-time error, because `hiddenCount`
            // may be written and read by methods in `DualCounter`.
            (self.hiddenCount += 1)
        })
        incrementExposed [publicGet] = (method {
            (self.exposedCount += 1)
        })
        countsAreEqual [publicGet] = (method [returns <boolT>] {
            return (self.hiddenCount #eq self.exposedCount)
        })
    ]
])

const dualCounter = (obj (DualCounter))
// Does not throw a compile-time error, because `exposedCount` has
// public read and write permission.
(dualCounter.exposedCount = 5)
(print(dualCounter.exposedCount))
// Throws a compile-time error, because `hiddenCount` has private
// read and write permission.
(dualCounter.hiddenCount = 6)
(print(dualCounter.hiddenCount))
```

## Generic Factors

A generic factor may be "qualified" with one or more arguments. Field types and method signatures may reference the generic arguments. Generic factors may be created by using the `generic` special. The example below demonstrates usage of generic factors:

```
const ListNodeK = (symbol())
// `ListNode` may be qualified with an argument named
// `contentT`, whose constraint type is `typeT`.
const ListNode = (generic [
    args [contentT <typeT>]
] (feature [
    key <@ListNodeK>
    itemFields [
        // The constraint type of `content` is equal to the
        // generic argument `contentT`.
        content <contentT> [public]
        // `next` can store another node which stores
        // the same type of content.
        next <*?ListNode+:<contentT>> [public]
    ]
]))

// `node1` and `node2` include `ListNode` qualified with `numT`.
const node1 = (obj (ListNode+:<numT>))
const node2 = (obj (ListNode+:<numT>))
// The type of `content` in `node1` and `node2` is `numT`.
(node1.content = 10)
(node2.content = 20)
// The type of `next` in `node1` and `node2`
// is `<*?ListNode+:<numT>>`.
(node1.next = node2)
```


