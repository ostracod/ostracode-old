
import * as fs from "fs";
import * as pathUtils from "path";
import { CompilerError } from "./error.js";
import { baseImportStmt } from "./constants.js";
import * as niceUtils from "./niceUtils.js";
import * as compUtils from "./compUtils.js";
import { parseVersionRange } from "./version.js";
import { OstraCodeFile } from "./ostraCodeFile.js";
import { BuiltInNode } from "./builtIn.js";
import { Package } from "./package.js";
import { CompContext } from "./compContext.js";
import { CompItemAggregator } from "./aggregator.js";
import { BuildJsConverter, SupportJsConverter } from "./jsConverter.js";

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
        this.supportPath = pathUtils.join(this.packagePath, "support");
    }
    
    init() {
        // Map from rule to set of platform names.
        this.rulePlatformsMap = new Map();
        // Map from package name to VersionRange.
        this.dependencies = new Map();
        // Map from constant name to value.
        this.constants = new Map();
        this.builtInNode = new BuiltInNode();
        this.package = new Package(this.packagePath);
        this.builtInNode.addChild(this.package);
        this.ostraCodeFiles = [];
        // Map from src path to OstraCodeFile.
        this.srcPathMap = new Map();
        // Set of numbers.
        this.typeIdSet = new Set();
        this.compContext = null;
        this.aggregator = null;
    }
    
    addOstraCodeFile(codeFile) {
        const { srcPath } = codeFile;
        const oldCodeFile = this.srcPathMap.get(srcPath);
        if (typeof oldCodeFile === "undefined") {
            this.ostraCodeFiles.push(codeFile);
            this.package.addChild(codeFile);
            this.srcPathMap.set(srcPath, codeFile);
        } else if (!oldCodeFile.equals(codeFile)) {
            throw new CompilerError(`Conflicting rules for build path "${srcPath}".`);
        }
    }
    
    // platformNames is a set of strings.
    addOstraCodeFiles(relativeSrcPath, platformNames) {
        const srcPath = pathUtils.resolve(
            pathUtils.join(this.package.srcPath, relativeSrcPath),
        );
        if (srcPath.endsWith(ostraCodeExtension)) {
            const relativeDestPath = niceUtils.replaceExtension(
                relativeSrcPath, javaScriptExtension,
            );
            const destPath = pathUtils.resolve(
                pathUtils.join(this.package.buildPath, relativeDestPath),
            );
            this.addOstraCodeFile(new OstraCodeFile(srcPath, destPath, platformNames));
        } else {
            const destPath = pathUtils.resolve(
                pathUtils.join(this.package.buildPath, relativeSrcPath),
            );
            niceUtils.walkFiles(srcPath, (path) => {
                if (!path.endsWith(ostraCodeExtension)) {
                    return;
                }
                const javaScriptPath = niceUtils.replaceExtension(path, javaScriptExtension);
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
            srcPaths: [],
            dependencies: {},
            constants: {},
            includeRules: [],
            platforms: inheritedPlatformNames,
            ...ruleWithoutDefaults,
        };
        const platformNames = new Set(rule.platforms);
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
        for (const relativeSrcPath of rule.srcPaths) {
            this.addOstraCodeFiles(relativeSrcPath, platformNames);
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
    
    initPackage() {
        console.log("Creating package.json file...");
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
        const { exports } = this.config;
        if (typeof exports !== "undefined") {
            config.exports = {};
            for (const name in exports) {
                const srcPath = exports[name];
                const key = (name === "default") ? "." : name;
                config.exports[key] = pathUtils.join(
                    "build", niceUtils.replaceExtension(srcPath, javaScriptExtension),
                );
            }
        }
        const destPath = pathUtils.join(this.packagePath, "package.json");
        fs.writeFileSync(destPath, JSON.stringify(config, null, 4) + "\n");
    }
    
    createTypeIdsFile() {
        const codeList = [];
        for (const typeId of this.typeIdSet) {
            const identifier = compUtils.getJsTypeIdIdentifier(typeId);
            codeList.push(`export const ${identifier} = Symbol("typeId${typeId}");`);
        }
        const code = codeList.join("\n") + "\n";
        const path = pathUtils.join(this.supportPath, "typeIds.js");
        fs.writeFileSync(path, code);
    }
    
    createCompItemsFile() {
        const { itemIdMap, closureItemsMap } = this.aggregator;
        const jsConverter = new SupportJsConverter(this.aggregator);
        const codeList = [];
        for (const [item, id] of itemIdMap) {
            const identifier = compUtils.getJsCompItemIdentifier(id);
            const itemCode = jsConverter.convertItemToExpansion(item);
            jsConverter.visibleItems.add(item);
            codeList.push(`export const ${identifier} = ${itemCode};`);
        }
        const { assignments } = jsConverter;
        const closureVarDeclarations = [];
        for (const closureItemMap of closureItemsMap.values()) {
            for (const closureItem of closureItemMap.values()) {
                const identifier = closureItem.getJsIdentifier();
                const itemCode = jsConverter.convertItemToJs(closureItem.item);
                const declaration = `let ${identifier} = ${itemCode};`;
                closureVarDeclarations.push(declaration);
            }
        }
        const code = baseImportStmt + "\nimport * as typeIds from \"./typeIds.js\";\n" + codeList.concat(assignments, closureVarDeclarations).join("\n") + "\n";
        const path = pathUtils.join(this.supportPath, "compItems.js");
        fs.writeFileSync(path, code);
    }
    
    compile() {
        for (const codeFile of this.ostraCodeFiles) {
            codeFile.parse();
            console.log(codeFile.getDisplayString());
        }
        this.compContext = new CompContext(this.builtInNode);
        this.compContext.resolveCompItems();
        this.aggregator = new CompItemAggregator(this.compContext);
        for (const codeFile of this.ostraCodeFiles) {
            codeFile.aggregateCompTypeIds(this.compContext, this.typeIdSet);
            codeFile.aggregateCompItems(this.aggregator);
        }
        this.aggregator.addNestedItems();
        niceUtils.ensureDirectoryExists(this.supportPath);
        this.createTypeIdsFile();
        this.createCompItemsFile();
        const jsConverter = new BuildJsConverter(this.aggregator);
        for (const codeFile of this.ostraCodeFiles) {
            codeFile.createJsFile(jsConverter);
        }
    }
}


