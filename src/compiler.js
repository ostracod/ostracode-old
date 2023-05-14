
import * as pathUtils from "path";
import { BuiltInNode } from "./builtIn.js";
import { CompilationPackage } from "./package.js";

export class Compiler {
    
    constructor(packagePath) {
        this.packagePath = pathUtils.resolve(packagePath);
    }
    
    init() {
        this.builtInNode = new BuiltInNode();
        this.package = new CompilationPackage(this.packagePath);
        this.builtInNode.addChild(this.package);
    }
    
    includeRule(name) {
        this.package.includeRule(name);
    }
    
    initPackage() {
        this.package.createPackageJsonFile();
    }
    
    compile() {
        this.package.compile();
    }
}


