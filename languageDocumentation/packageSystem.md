

# Package System

This page documents the package system in OstraCode.

## Principles of Usage

A "package" is a directory containing an end-user application, or a library which may be imported by other packages. Each package must use the directory structure as documented on this page. Packages may provide code to be compiled for Node.js or web browsers.

OstraCode packages are designed to be compatible with Node.js packages, and may be distributed using package managers such as NPM. OstraCode packages are installed into the `node_modules` directory of their dependents. OstraCode packages contain a `package.json` file which specifies the entry point and dependencies of the package.

All packages must be distributed with source code, because dependents may require source code at compile-time. Packages may include compiled JavaScript, or may perform compilation during a `postinstall` step in `package.json`.

The steps below prepare a package to be run:

1. Generate `package.json` based on `ostraConfig.json`.
1. Install dependencies based on `package.json`.
1. Compile OstraCode into JavaScript.

Each JavaScript file compiled from OstraCode is an ECMAScript module. As a result, OstraCode is only compatible with Node.js 13 and higher, or most browsers updated after 2016.

## Directory Structure

Each package has the directory structure below:

* `ostraConfig.json` (file) stores package metadata and compilation rules.
* `package.json` (file) is consumed by Node.js and package managers. `package.json` is derived from `ostraConfig.json`.
* `node_modules` (directory) stores dependency packages which may be written in OstraCode or JavaScript. `node_modules` is set up by a Node.js package manager.
* `src` (directory) stores OstraCode source files. Each OstraCode file has the extension `.ostc`.
* `build` (directory) stores compiled JavaScript files. Each JavaScript file has the extension `.js`.
* `foreign` (directory) stores JavaScript which is not compiled from OstraCode, but may be imported by OstraCode with the `foreign` attribute statement.
* `data` (directory) stores general-purpose data used by the package during compilation or runtime.

## OstraConfig File

The content of `ostraConfig.json` conforms to the following type:

```
dictT [fields [
    name <strT>
    version <strT>
    ostraCodeVersion <strT>
    rules <dictT [
        fieldType <dictT [fields [
            compile <dictT [fields [
                src <strT>
                dest <strT> [optional]
            ]]> [optional]
            dependencies <dictT [fieldType <strT>]> [optional]
            constants <dictT> [optional]
            includeRules <listT [elemType <strT>]> [optional]
            platformNames <listT [elemType <strT>]> [optional]
        ]]>
    ]>
    platforms <dictT [
        fieldType <dictT [fields [
            mainRule <strT>
            entryPoint <strT> [optional]
        ]]>
    ]>
]]
```

* `name` is the name of the package.
* `version` is the semantic version number of the package.
* `ostraCodeVersion` is the semantic version number of OstraCode with which the package is compatible.
* `rules` is a map from compilation rule name to dictionary. Rule names have virtually no restrictions, and are chosen by the package developer. Different rules may be defined for various use-cases, such as package distribution, automated tests, and debugging.
    * `compile` indicates that OstraCode should be compiled into JavaScript. If `compile` is excluded, the rule will not compile any files.
        * `src` is a path relative to the `src` directory. If `src` is a path to a file, the single file will be compiled. If `src` is a path to a directory, all files in the directory will be compiled.
        * `dest` is the path relative to the `build` directory for compiled JavaScript. If `dest` is excluded, then the same relative path as `src` will be used.
    * `dependencies` is a map from dependency package name to semantic version number.
    * `constants` is a set of key-item pairs which will be added to the `configConstants` dictionary, which is available to OstraCode source files.
    * `includeRules` is the list of rule names which will be evaluated after the current rule.
    * `platformNames` is the list of platform names on which compiled JavaScript will run. Platform names include `"node"` and `"browser"`. If `platformNames` is excluded, then platform names will be inherited from any parent which includes the rule.
* `platforms` is a map from platform name to dictionary.
    * `mainRule` is the name of the rule to compile the package for distribution.
    * `entryPoint` specifies the path of the entry point for the given platform. When a dependent imports the package, the dependent may access exported members of the entry point. `entryPoint` is a path relative to the `src` directory.


