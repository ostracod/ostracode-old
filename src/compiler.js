
import * as fs from "fs";
import * as pathUtils from "path";
import { CompilerError } from "./error.js";

export class Compiler {
    
    constructor(packagePath) {
        this.packagePath = packagePath;
        const configPath = pathUtils.join(this.packagePath, "ostraConfig.json");
        if (!fs.existsSync(configPath)) {
            throw new CompilerError("Error: ostraConfig.json file is missing in package.");
        }
        const configContent = fs.readFileSync(configPath);
        try {
            this.config = JSON.parse(configContent);
        } catch (error) {
            throw new CompilerError("Error: ostraConfig.json contains malformed JSON.\n" + error.message);
        }
    }
    
    init() {
        this.includedRuleNames = new Set();
    }
    
    includeRule(ruleName, inheritedPlatformNames) {
        if (this.includedRuleNames.has(ruleName)) {
            return;
        }
        const rule = this.config.rules[ruleName];
        if (typeof rule === "undefined") {
            throw new CompilerError(`Error: ostraConfig.json has no rule with name "${ruleName}".`);
        }
        // TODO: Register files to compile.
        
        this.includedRuleNames.add(ruleName);
        let { platformNames } = rule;
        if (typeof platformNames === "undefined") {
            platformNames = inheritedPlatformNames;
        }
        let namesToInclude = rule.includeRules;
        if (typeof namesToInclude === "undefined") {
            namesToInclude = [];
        }
        for (const name of namesToInclude) {
            this.includeRule(name, platformNames);
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
            throw new CompilerError(`Error: ostraConfig.json has no platform definition with name "${platformName}".`);
        }
        const ruleName = platformDefinition.mainRule;
        if (typeof ruleName === "undefined") {
            throw new CompilerError(`Error: ostraConfig.json does not specify main rule for platform "${platformName}".`);
        }
        this.init();
        this.includeRule(ruleName, [platformName]);
        this.compile();
    }
    
    compile() {
        // TODO: Implement.
        console.log(this.includedRuleNames);
    }
}


