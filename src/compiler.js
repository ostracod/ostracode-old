
import * as fs from "fs";
import * as pathUtils from "path";
import { CompilerError } from "./error.js";
import * as niceUtils from "./niceUtils.js";
import * as compUtils from "./compUtils.js";
import { parseVersionRange } from "./version.js";
import { OstraCodeFile } from "./ostraCodeFile.js";
import { BuiltInNode } from "./builtIn.js";

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
        // Map from rule to set of platform names.
        this.rulePlatformsMap = new Map();
        // Map from package name to VersionRange.
        this.dependencies = new Map();
        // Map from constant name to value.
        this.constants = new Map();
        this.builtInNode = new BuiltInNode();
        this.ostraCodeFiles = [];
        // Map from src path to list of OstraCodeFile.
        this.srcPathMap = new Map();
        // Map from build path to OstraCodeFile.
        this.buildPathMap = new Map();
        this.rootPlatformNames = new Set();
    }
    
    addOstraCodeFile(codeFile) {
        const { srcPath, destPath } = codeFile;
        const oldCodeFile = this.buildPathMap.get(destPath);
        if (typeof oldCodeFile === "undefined") {
            this.ostraCodeFiles.push(codeFile);
            this.builtInNode.addChild(codeFile);
            let codeFiles = this.srcPathMap.get(srcPath);
            if (typeof codeFiles === "undefined") {
                codeFiles = [];
                this.srcPathMap.set(srcPath, codeFiles);
            }
            codeFiles.push(codeFile);
            this.buildPathMap.set(destPath, codeFile);
        } else if (!oldCodeFile.equals(codeFile)) {
            throw new CompilerError(`Conflicting rules for build path "${destPath}".`);
        }
    }
    
    // platformNames is a set of strings.
    addOstraCodeFiles(relativeSrcPath, relativeDestPath, platformNames) {
        const srcPath = pathUtils.resolve(
            pathUtils.join(this.srcPath, relativeSrcPath),
        );
        const destPath = pathUtils.resolve(
            pathUtils.join(this.buildPath, relativeDestPath),
        );
        if (srcPath.endsWith(ostraCodeExtension)) {
            this.addOstraCodeFile(new OstraCodeFile(srcPath, destPath, platformNames));
        } else {
            niceUtils.walkFiles(srcPath, (path) => {
                if (!path.endsWith(ostraCodeExtension)) {
                    return;
                }
                const javaScriptPath = path.substring(
                    0, path.length - ostraCodeExtension.length,
                ) + javaScriptExtension;
                this.addOstraCodeFile(new OstraCodeFile(
                    pathUtils.join(srcPath, path),
                    pathUtils.join(destPath, javaScriptPath),
                    platformNames,
                ));
            });
        }
    }
    
    includeRule(ruleName, inheritedPlatformNames) {
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
        const platformNames = new Set(rule.platformNames);
        if (platformNames.size <= 0) {
            throw new CompilerError(`Rule with name "${ruleName}" was included with zero platforms.`);
        }
        const oldPlatformNames = this.rulePlatformsMap.get(ruleName);
        if (typeof oldPlatformNames !== "undefined") {
            if (!niceUtils.nameSetsAreEqual(platformNames, oldPlatformNames)) {
                throw new CompilerError(`Rule with name "${ruleName}" was included with inconsistent platforms.`);
            }
            return;
        }
        if (rule.compile !== null) {
            let relativeSrcPath = rule.compile.src;
            let relativeDestPath = rule.compile.dest;
            if (typeof relativeSrcPath === "undefined") {
                throw new CompilerError(`Missing source path for rule with name "${ruleName}".`);
            }
            if (typeof relativeDestPath === "undefined") {
                relativeDestPath = relativeSrcPath;
            }
            this.addOstraCodeFiles(relativeSrcPath, relativeDestPath, platformNames);
        }
        this.rulePlatformsMap.set(ruleName, platformNames);
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
            this.includeRule(name, platformNames);
        }
    }
    
    includePlatformMainRule(platformName) {
        const platformDefinition = this.config.platforms[platformName];
        if (typeof platformDefinition === "undefined") {
            throw new CompilerError(`ostraConfig.json has no platform definition with name "${platformName}".`);
        }
        const ruleName = platformDefinition.mainRule;
        if (typeof ruleName === "undefined") {
            throw new CompilerError(`ostraConfig.json does not specify main rule for platform "${platformName}".`);
        }
        this.includeRule(ruleName, new Set([platformName]));
        this.rootPlatformNames.add(platformName);
    }
    
    // parentPlatforms is a set of strings.
    getOstraCodeFile(srcPath, parentPlatforms) {
        const codeFiles = this.srcPathMap.get(srcPath);
        if (typeof codeFiles === "undefined") {
            throw new CompilerError(`Could not find source file for "${srcPath}"`);
        }
        const possibleCodeFiles = [];
        for (const codeFile of codeFiles) {
            const filePlatforms = codeFile.platformNames;
            if (parentPlatforms.every((name) => filePlatforms.has(name))) {
                if (parentPlatforms.size === filePlatforms.size) {
                    return codeFile;
                }
                possibleCodeFiles.push(codeFile);
            }
        }
        if (possibleCodeFiles.length < 1) {
            throw new CompilerError(`Could not find compatible source file for "${srcPath}"`);
        }
        if (possibleCodeFiles.length > 1) {
            throw new CompilerError(`Found ambiguous source files for "${srcPath}"`);
        }
        return possibleCodeFiles[0];
    }
    
    getIncludedRuleCount() {
        return this.rulePlatformsMap.size;
    }
    
    initPackage() {
        console.log("Creating package.json file...");
        const config = {
            name: this.config.name,
            version: this.config.version,
            type: "module",
        };
        const nodePlatformName = "node";
        if (this.rootPlatformNames.has(nodePlatformName)) {
            const nodePlatform = this.config.platforms[nodePlatformName];
            const relativeEntryPoint = nodePlatform.entryPoint;
            if (typeof relativeEntryPoint !== "undefined") {
                const entryPoint = pathUtils.resolve(
                    pathUtils.join(this.srcPath, relativeEntryPoint),
                );
                let entryPointFile;
                try {
                    entryPointFile = this.getOstraCodeFile(
                        entryPoint, [nodePlatformName],
                    );
                } catch (error) {
                    if (error instanceof CompilerError) {
                        throw new CompilerError("Could not resolve entry point: " + error.message);
                    } else {
                        throw error;
                    }
                }
                config.main = pathUtils.relative(this.packagePath, entryPointFile.destPath);
            }
        }
        if (this.dependencies.size > 0) {
            const dependencies = {};
            this.dependencies.forEach((versionRange, name) => {
                dependencies[name] = versionRange.toString();
            });
            config.dependencies = dependencies;
        }
        const destPath = pathUtils.join(this.packagePath, "package.json");
        fs.writeFileSync(destPath, JSON.stringify(config, null, 4) + "\n");
    }
    
    compile() {
        for (const codeFile of this.ostraCodeFiles) {
            codeFile.parse();
            console.log(codeFile.getDisplayString());
        }
        compUtils.resolveAllCompItems(this.ostraCodeFiles);
    }
}


