
import * as fs from "fs";
import * as pathUtils from "path";
import { CompilerError } from "./error.js";
import { parseVersionRange } from "./version.js";

export class Compiler {
    
    constructor(packagePath) {
        this.packagePath = packagePath;
        const configPath = pathUtils.join(this.packagePath, "ostraConfig.json");
        if (!fs.existsSync(configPath)) {
            throw new CompilerError("ostraConfig.json file is missing in package.");
        }
        const configContent = fs.readFileSync(configPath);
        try {
            this.config = JSON.parse(configContent);
        } catch (error) {
            throw new CompilerError("ostraConfig.json contains malformed JSON.\n" + error.message);
        }
    }
    
    init() {
        this.includedRuleNames = new Set();
        // Map from package name to VersionRange.
        this.dependencies = new Map();
        // Map from constant name to value.
        this.constants = new Map();
    }
    
    includeRule(ruleName, inheritedPlatformNames) {
        if (this.includedRuleNames.has(ruleName)) {
            return;
        }
        const ruleWithoutDefaults = this.config.rules[ruleName];
        if (typeof ruleWithoutDefaults === "undefined") {
            throw new CompilerError(`ostraConfig.json has no rule with name "${ruleName}".`);
        }
        const rule = {
            compile: null,
            dependencies: {},
            constants: {},
            includeRules: [],
            platformNames: inheritedPlatformNames,
            ...ruleWithoutDefaults,
        };
        // TODO: Register files to compile.
        
        this.includedRuleNames.add(ruleName);
        for (const name in rule.dependencies) {
            const range = parseVersionRange(rule.dependencies[name]);
            const oldRange = this.dependencies.get(name);
            if (typeof oldRange === "undefined"
                    || oldRange.includesRange(range)) {
                this.dependencies.set(name, range);
            } else if (!range.includesRange(oldRange)) {
                throw new CompilerError(`Conflicting version ranges for dependency "${name}".`);
            }
        }
        for (const name in rule.constants) {
            const value = rule.constants[name];
            const oldValue = this.constants.get(name);
            if (typeof oldValue === "undefined") {
                this.constants.set(name, value);
            } else if (value !== oldValue) {
                throw new CompilerError(`Conflicting values for constant "${name}".`);
            }
        }
        for (const name of rule.includeRules) {
            this.includeRule(name, rule.platformNames);
        }
    }
    
    compileRule(ruleName) {
        this.init();
        this.includeRule(ruleName, []);
        this.compile();
    }
    
    compilePlatformMainRule(platformName) {
        const platformDefinition = this.config.platforms[platformName];
        if (typeof platformDefinition === "undefined") {
            throw new CompilerError(`ostraConfig.json has no platform definition with name "${platformName}".`);
        }
        const ruleName = platformDefinition.mainRule;
        if (typeof ruleName === "undefined") {
            throw new CompilerError(`ostraConfig.json does not specify main rule for platform "${platformName}".`);
        }
        this.init();
        this.includeRule(ruleName, [platformName]);
        this.compile();
    }
    
    compile() {
        // TODO: Implement.
        console.log(this.includedRuleNames);
        this.dependencies.forEach((range, name) => {
            console.log(name);
            console.log(range);
        });
        console.log(this.constants);
    }
}


