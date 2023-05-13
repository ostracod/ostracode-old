
import { UsageError, CompilerError } from "./src/error.js";
import { Compiler } from "./src/compiler.js";

class OptionDefinition {
    // Concrete subclasses of OptionDefintion must implement these methods:
    // getUsage
    
    constructor(name, abbreviation, description) {
        this.name = name;
        this.abbreviation = abbreviation;
        this.description = description;
    }
}

class FlagDefinition extends OptionDefinition {
    
    getUsage() {
        return `-${this.abbreviation}, --${this.name}: ${this.description}`;
    }
}

class LabelDefinition extends OptionDefinition {
    
    constructor(name, abbreviation, placeholderName, description) {
        super(name, abbreviation, description);
        this.placeholderName = placeholderName;
    }
    
    getUsage() {
        return `-${this.abbreviation} ${this.placeholderName}, --${this.name} ${this.placeholderName}: ${this.description}`;
    }
}

const optionDefinitions = [
    new FlagDefinition(
        "help", "h",
        "Print compiler usage instructions.",
    ),
    new FlagDefinition(
        "init", "i",
        "Create package.json file.",
    ),
    new LabelDefinition(
        "rule", "r", "NAME",
        "Use rule with given name.",
    ),
];

const printUsage = () => {
    console.log("Usage: node ./compile.js (packagePath) (options)\nValid options:");
    for (const definition of optionDefinitions) {
        console.log(definition.getUsage());
    }
};

const main = () => {
    const unlabeledArgs = [];
    // Map from label name to list of arguments.
    const labeledArgs = new Map();
    const flags = new Set();
    
    let index = 2;
    while (index < process.argv.length) {
        const term = process.argv[index];
        index += 1;
        if (term.startsWith("-")) {
            let definition;
            if (term.startsWith("--")) {
                const name = term.substring(2, term.length);
                definition = optionDefinitions.find((definition) => (
                    definition.name === name
                ));
            } else {
                const abbreviation = term.substring(1, term.length);
                definition = optionDefinitions.find((definition) => (
                    definition.abbreviation === abbreviation
                ));
            }
            if (typeof definition === "undefined") {
                throw new UsageError(`Unrecognized option "${term}".`);
            }
            const { name } = definition;
            if (definition instanceof FlagDefinition) {
                flags.add(name);
            } else if (definition instanceof LabelDefinition) {
                if (index >= process.argv.length) {
                    throw new UsageError(`Expected argument after "${term}".`);
                }
                const arg = process.argv[index];
                index += 1;
                let args = labeledArgs.get(name);
                if (typeof args === "undefined") {
                    args = [];
                    labeledArgs.set(name, args);
                }
                args.push(arg);
            } else {
                throw new Error("Invalid option definition.");
            }
        } else {
            unlabeledArgs.push(term);
        }
    }
    
    if (flags.has("help")) {
        printUsage();
        return;
    }
    if (unlabeledArgs.length < 1) {
        throw new UsageError("Expected package path.");
    }
    if (unlabeledArgs.length > 1) {
        throw new UsageError("Expected exactly one package path.");
    }
    const [packagePath] = unlabeledArgs;
    const compiler = new Compiler(packagePath);
    
    compiler.init();
    const ruleNames = labeledArgs.get("rule") ?? ["main"];
    for (const ruleName of ruleNames) {
        compiler.includeRule(ruleName);
    }
    if (flags.has("init")) {
        compiler.initPackage();
    } else {
        compiler.compile();
    }
    console.log("Finished.");
};

try {
    main();
} catch (error) {
    if (error instanceof UsageError) {
        console.log("Error: " + error.message);
        printUsage();
        process.exit(1);
    } else if (error instanceof CompilerError) {
        console.log(error.getLabel() + ": " + error.message);
        process.exit(1);
    } else {
        throw error;
    }
}


