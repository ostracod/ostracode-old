
import * as fs from "fs";
import * as pathUtils from "path";
import { CompilerError } from "./error.js";
import * as niceUtils from "./niceUtils.js";
import { RuleInclusion } from "./ruleInclusion.js";
import { parseVersionRange } from "./version.js";
import { OstraCodeFile } from "./ostraCodeFile.js";

const ostraCodeExtension = ".ostc";
const javaScriptExtension = ".js";

export class Compiler {
    
    constructor(packagePath) {
        this.packagePath = pathUtils.resolve(packagePath);
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
        this.srcPath = pathUtils.join(this.packagePath, "src");
        this.buildPath = pathUtils.join(this.packagePath, "build");
    }
    
    init() {
        this.includedRuleNames = new Set();
        // Map from package name to VersionRange.
        this.dependencies = new Map();
        // Map from constant name to value.
        this.constants = new Map();
        this.ostraCodeFiles = [];
        // Map from build path to OstraCodeFile.
        this.buildPathMap = new Map();
    }
    
    includeRule(ruleInclusion) {
        const { ruleName } = ruleInclusion;
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
            platformNames: ruleInclusion.inheritedPlatformNames,
            ...ruleWithoutDefaults,
        };
        if (rule.compile !== null) {
            let relativeSrcPath = rule.compile.src;
            let relativeDestPath = rule.compile.dest;
            if (typeof relativeSrcPath === "undefined") {
                throw new CompilerError(`Missing source path for rule with name "${ruleName}".`);
            }
            if (typeof relativeDestPath === "undefined") {
                relativeDestPath = relativeSrcPath;
            }
            const srcPath = pathUtils.resolve(
                pathUtils.join(this.srcPath, relativeSrcPath),
            );
            const destPath = pathUtils.resolve(
                pathUtils.join(this.buildPath, relativeDestPath),
            );
            const codeFiles = [];
            if (srcPath.endsWith(ostraCodeExtension)) {
                codeFiles.push(new OstraCodeFile(srcPath, destPath, rule.platformNames));
            } else {
                niceUtils.walkFiles(srcPath, (path) => {
                    if (!path.endsWith(ostraCodeExtension)) {
                        return;
                    }
                    const javaScriptPath = path.substring(
                        0,
                        path.length - ostraCodeExtension.length,
                    ) + javaScriptExtension;
                    codeFiles.push(new OstraCodeFile(
                        pathUtils.join(srcPath, path),
                        pathUtils.join(destPath, javaScriptPath),
                        rule.platformNames,
                    ));
                });
            }
            for (const codeFile of codeFiles) {
                const { destPath } = codeFile;
                const oldCodeFile = this.buildPathMap.get(destPath);
                if (typeof oldCodeFile === "undefined") {
                    this.ostraCodeFiles.push(codeFile);
                    this.buildPathMap.set(destPath, codeFile);
                } else if (!oldCodeFile.equals(codeFile)) {
                    throw new CompilerError(`Conflicting rules for build path "${destPath}".`);
                }
            }
        }
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
            this.includeRule(new RuleInclusion(name, rule.platformNames));
        }
    }
    
    getMainRuleName(platformName) {
        const platformDefinition = this.config.platforms[platformName];
        if (typeof platformDefinition === "undefined") {
            throw new CompilerError(`ostraConfig.json has no platform definition with name "${platformName}".`);
        }
        const ruleName = platformDefinition.mainRule;
        if (typeof ruleName === "undefined") {
            throw new CompilerError(`ostraConfig.json does not specify main rule for platform "${platformName}".`);
        }
        return ruleName;
    }
    
    initPackage() {
        console.log("Creating package.json file...");
        const destPath = pathUtils.join(this.packagePath, "package.json");
        const config = {
            name: this.config.name,
            version: this.config.version,
            type: "module",
        };
        if (this.dependencies.size > 0) {
            const dependencies = {};
            this.dependencies.forEach((versionRange, name) => {
                dependencies[name] = versionRange.toString();
            });
            config.dependencies = dependencies;
        }
        fs.writeFileSync(destPath, JSON.stringify(config, null, 4) + "\n");
    }
    
    compile() {
        // TODO: Implement.
        console.log(this.includedRuleNames);
        this.dependencies.forEach((range, name) => {
            console.log(name);
            console.log(range);
        });
        console.log(this.constants);
        console.log(this.ostraCodeFiles);
    }
}


