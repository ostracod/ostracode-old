
# Statements

This page documents behavior statements and attribute statements in OstraCode.

## Behavior Statements

OstraCode has the following behavior statements:

### Variable Statements:

```
comp $name <$type> [$attrs] = <$initItem>
```

Declares a comptime variable with name identifier `$name`, constraint type `$type`, and initialization item `$initItem`. If `<$type>` is excluded, then the constraint type of the variable will be the constraint type of `$initItem`.

```
const $name <$type> [$attrs] = ($initItem)
```

Declares an immutable evaltime variable with name identifier `$name`, constraint type `$type`, and initialization item `$initItem`. If `<$type>` is excluded, then the constraint type of the variable will be the constraint type of `$initItem`.

```
var $name <$type> [$attrs] = ($initItem)
```

Declares a mutable evaltime variable with name identifier `$name`, constraint type `$type`, and initialization item `$initItem`. If `<$type>` is excluded, then the constraint type of the variable will be the constraint type of `$initItem`. If `= ($initItem)` is excluded, then the initial item of the variable will be `undef`. If both `<$type>` and `= ($initItem)` are excluded, then the constraint type of the variable will be `itemT`.

### Expression Statement:

```
($expr)
```

Evaluates expression `$expr` to achieve a side-effect.

### Scope Statement:

```
{$behavior}
```

Evaluates `$behavior` in a nested scope.

### If Statement:

```
if ($condition1) {$behavior1} elseIf ($condition2) {$behavior2} else {$behavior3}
```

If `$condition1` is true, then `$behavior1` is evaluated. Otherwise if `$condition2` is true, `$behavior2` is evaluated. If neither `$condition1` nor `$condition2` are true, then `$behavior3` is evaluated. `elseIf ($condition2) {$behavior2}` may be excluded or repeated any number of times. `else {$behavior3}` may be excluded.

### Loop Statements:

```
while ($condition) {$behavior}
```

Enters a loop evaluating `$behavior` until `$condition` is false.

```
for $name in ($iterable) {$behavior}
```

Iterates over each member in `$iterable`, assigning the member to a variable with name `$name` and evaluating `$behavior`. The type of `$iterable` must conform to `(*IterableT)`.

### Loop Control Statements:

```
break
```

Stops the current iteration of the parent loop statement, and exits the loop.

```
continue
```

Stops the current iteration of the parent loop statement, and jumps to the beginning of the loop again.

### Return Statement:

```
return ($item)
```

Stops evaluation of the parent function, and returns item `$item`. If `($item)` is excluded, then the return item is `undef`.

### Error Statements:

```
try {$behavior1} catch $name {$behavior2} finally {$behavior3}
```

Attempts to evaluate `$behavior1`. If `$behavior1` throws an error, the error will be stored in a variable with identifier name `$name`, and `$behavior2` will be evaluated. Regardless of whether any error occurred, `$behavior3` will be evaluated. Either `catch $name {$behavior2}` or `finally {$behavior3}` may be excluded, but not both.

```
throw ($item)
```

Throws error item `$item` which will be handled by a `try` statement.

### Import Statements:

```
importPath [$attrs] <$path>
```

Imports the module located at file path `$path`.

```
importPackage [$attrs] <$name>
```

Imports the package with name `$name`.

## Attribute Statements

OstraCode has the following attribute statements:

### List Value Statements:

Valid contexts for list value statements:

* `list` special

```
elemType <$type>
```

Asserts that the type of each element in the parent list value conforms to type `$type`.

```
length <$length>
```

Asserts that the number of elements in the parent list value is `$length`.

### List Type Statements:

Valid contexts for list type statements:

* `listT` special

```
elemType ($type)
```

Asserts that the type of each element in the parent list type conforms to type `$type`.

```
length ($length)
```

Asserts that the number of elements in the parent list type is `$length`.

### Function Statements:

Valid contexts for function statements:

* `func` and `funcT` specials
* Method statement
* `methodT` special

```
args [$args]
```

Declares the arguments which the parent function may accept.

```
async
```

Asserts that the parent function is asynchronous, and has a return type which conforms to `(*ThenT)`.

### Returns Statements:

```
returns <$type>
```

Valid contexts:

* `func` special
* Method statement

Asserts that the parent function value returns an item whose type conforms to type `$type`. The default return type is `undefT`.

```
returns ($type)
```

Valid contexts:

* `funcT` special
* `methodT` special

Asserts that the parent function type returns an item whose type conforms to type `$type`. The default return type is `undefT`.

### Argument Statements:

```
$name <$type> [$attrs] = ($defaultItem)
```

Valid contexts:

* `args` statement in one of the following contexts:
    * `func` special
    * Method statement
* `typeArgs` statement

Declares an argument with name identifier `$name`, constraint type `$type`, and default item `$defaultItem`. If `<$type>` is excluded, then the constraint type of the argument will be the constraint type of `$defaultItem`. If `= ($defaultItem)` is excluded, then the default item will be `undef`. If both `<$type>` and `= ($defaultItem)` are excluded, then the constraint type of the argument will be `itemT` within `args` statements, and `typeT` within `typeArgs` statements.

```
$name ($type) [$attrs]
```

Valid contexts:

* `args` statement in one of the following contexts:
    * `funcT` special
    * `methodT` special

Declares an argument with name identifier `$name` and constraint type `$type`. If `($type)` is excluded, then the constraint type of the argument will be `itemT`.

### Field Type Statements:

```
fieldType <$type>
```

Valid contexts:

* `dict` special

Asserts that the type of each field in the parent dictionary value conforms to type `$type`.

```
fieldType ($type)
```

Valid contexts:

* `dictT` special

Asserts that the type of each field in the parent dictionary type conforms to type `$type`.

### Fields Statement:

```
fields [$fields]
```

Valid contexts:

* `dict` and `dictT` specials
* `interfaceT` special
* `feature` and `featureT` specials

Declares the fields in the parent data structure.

### Field Statements:

```
$name <$type> [$attrs] = ($initItem)
```

Valid contexts:

* `fields` statement in one of the following contexts:
    * `dict` special
    * `feature` special

Declares a field with name identifier `$name`, constraint type `$type`, and initialization item `$initItem`. If `<$type>` is excluded, then the constraint type of the field will be the constraint type of `$initItem`. If `= ($initItem)` is excluded, then the initial item of the field will be `undef`. If both `<$type>` and `= ($initItem)` are excluded, then the constraint type of the field will be `itemT`.

```
($name) <$type> [$attrs] = ($initItem)
```

Valid contexts:

* `fields` statement in `dict` special

Declares a dictionary field whose name is the string returned by `$name`, and otherwise uses the same rules as described above.

```
$name ($type) [$attrs]
```

Valid contexts:

* `fields` statement in one of the following contexts:
    * `dictT` special
    * `interfaceT` special
    * `featureT` special

Declares a field with name identifier `$name` and constraint type `$type`. If `($type)` is excluded, then the constraint type of the field will be `itemT`.

```
($name) ($type) [$attrs]
```

Valid contexts:

* `fields` statement in `dictT` special

Declares a dictionary field whose name is the string returned by `$name`, and otherwise uses the same rules as described above.

### Optional Statement:

```
optional
```

Valid contexts:

* Argument statement
* Field statement in `dict` or `dictT` special

Asserts that the parent argument or field is optional.

### Methods Statement:

```
methods [$methods]
```

Valid contexts:

* `interfaceT` special
* `feature` and `featureT` specials

Declares the methods in the parent interface or feature.

### Method Statements:

```
$name [$attrs] {$behavior}
```

Valid contexts:

* `methods` statement in `feature` special

Declares a method with name identifier `$name`, whose signature is described by `$attrs`, and whose behavior is determined by `$body`.

```
$name [$attrs]
```

Valid contexts:

* `methods` statement in one of the following contexts:
    * `interfaceT` special
    * `featureT` special

Declares a method with name identifier `$name`, and whose signature is described by `$attrs`.

### Self Feature Statement:

```
selfFeature ($featureType)
```

Valid contexts:

* `methodT` special

Asserts that the type of `self` is `objT ($featureType)` when referenced in the body of the method. `$featureType` must conform to `featureT`.

### This Factor Statements:

```
thisFactor <$factorType>
```

Valid contexts:

* `feature` special
* Method statement

Asserts that the type of `this` is `objT ($factorType)` when referenced in the body of a method. `$factorType` must conform to `factorT`.

```
thisFactor ($factorType)
```

Valid contexts:

* `featureT` special
* `methodT` special

Asserts that the type of `this` is `objT ($factorType)` when referenced in the body of a method. `$factorType` must conform to `factorT`.

### Factors Statement:

```
factors [$factors]
```

Valid contexts:

* `bundle` and `bundleT` specials

Asserts that the parent bundle contains the factors specified by `$factors`.

### Factor Statement:

```
($factor) [$attrs]
```

Valid contexts:

* `factors` statement

Asserts that the parent bundle contains factor `$factor`.

### Permission Statements:

Valid contexts for permission statements:

* Field statement in one of the following contexts:
    * `interfaceT` special
    * `feature` or `featureT` special
* Method statement
* `methodT` special

```
public
```

Asserts that the parent member is accessible in all contexts.

```
protected
```

Asserts that the parent member is only accessible by features in the same bundle.

```
private
```

Asserts that the parent member is only accessible by methods in the same feature.

### Get Permission Statements:

Valid contexts for get permission statements:

* Field statement in one of the following contexts:
    * `interfaceT` special
    * `feature` or `featureT` special

```
publicGet
```

Asserts that the parent field is readable in all contexts.

```
protectedGet
```

Asserts that the parent field is only readable by features in the same bundle.

```
privateGet
```

Asserts that the parent field is only readable by methods in the same feature.

### Set Permission Statements:

Valid contexts for set permission statements:

* Field statement in one of the following contexts:
    * `interfaceT` special
    * `feature` or `featureT` special

```
publicSet
```

Asserts that the parent field is writable in all contexts.

```
protectedSet
```

Asserts that the parent field is only writable by features in the same bundle.

```
privateSet
```

Asserts that the parent field is only writable by methods in the same feature.

### Visibility Statements:

```
vis <$vis>
```

Valid contexts:

* Field statement in `feature` special
* Method statement

Asserts that the visibility of the parent member is `$vis`. The default visibility is 1.

```
vis ($vis)
```

Valid contexts:

* Field statement in one of the following contexts:
    * `interfaceT` special
    * `featureT` special
* `methodT` special

Asserts that the visibility of the parent member is `$vis`. The default visibility is 1.

### Shield Statements:

```
shield <$amount>
```

Valid contexts:

* Factor statement in `bundle` special

Asserts that the visibility of members in the parent factor value should be decreased by `$amount`. The default shield amount is 1.

```
shield ($amount)
```

Valid contexts:

* Factor statement in `bundleT` special

Asserts that the visibility of members in the parent factor type should be decreased by `$amount`. The default shield amount is 1.

### Implements Statements:

```
implements <$interfaceType>
```

Valid contexts:

* `feature` special

Asserts that the parent feature value declares the fields and methods of interface type `$interfaceType`.

```
implements ($interfaceType)
```

Valid contexts:

* `featureT` special

Asserts that the parent feature type declares the fields and methods of interface type `$interfaceType`.

```
implements <$factorTypes>
```

Valid contexts:

* `bundle` special

Asserts that the parent bundle value includes features which satisfy factor types `$factorTypes`.

```
implements ($factorTypes)
```

Valid contexts:

* `bundleT` special

Asserts that the parent bundle type includes features which satisfy factor types `$factorTypes`.

### Type Arguments Statement:

```
typeArgs [$args]
```

Valid contexts:

* `listT` special
* `dictT` special
* `interfaceT` special
* `feature` and `featureT` specials
* `bundle` and `bundleT` specials

Declares type arguments with which the parent item may be qualified.

### Exported Statement:

```
exported
```

Valid contexts:

* Variable statement at top level of module

Asserts that the parent variable may be imported by other modules.

### Import Attribute Statements:

Valid contexts for import attribute statements:

* `importPath` statement
* `importPackage` statement

```
foreign
```

Asserts that the imported module contains JavaScript rather than OstraCode.

```
as $name
```

Declares that the imported module will be referenced with name identifier `$name` in the current module.

```
members [$members]
```

Declares the members to import from the external module.

### Member Statement:

```
$name1 <$type> as $name2
```

Valid contexts:

* `members` statement

Declares that the member with name identifier `$name1` in the external module will use name identifier `$name2` in the current module, and has constraint type `$type`. If `as $name2` is excluded, then the member will use name identifier `$name1` in the current module. If `<$type>` is excluded and the import is foreign, then the constraint type of the member will be `itemT`. If `<$type>` is excluded and the import is not foreign, then the member will have the same constraint type as defined in the external module.


