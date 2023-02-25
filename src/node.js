
import * as compUtils from "./compUtils.js";
import { CompilerErrorThrower } from "./error.js";

export class Node extends CompilerErrorThrower {
    
    constructor() {
        super();
        this.parent = null;
        this.children = [];
        // Map from variable name to Var.
        this.varMap = new Map();
    }
    
    addChild(child) {
        this.children.push(child);
        child.parent = this;
        return child;
    }
    
    setChildren(children) {
        for (const child of this.children) {
            if (child.parent === this) {
                child.parent = null;
            }
        }
        this.children = [];
        for (const child of children) {
            this.addChild(child);
        }
    }
    
    addVar(variable) {
        this.varMap.set(variable.name, variable);
    }
    
    addVars(vars) {
        for (const variable of vars) {
            this.addVar(variable);
        }
    }
    
    getVar(name) {
        const variable = this.varMap.get(name);
        if (typeof variable === "undefined") {
            return (this.parent === null) ? null : this.parent.getVar(name);
        } else {
            return variable;
        }
    }
    
    getDisplayStringDetail() {
        return null;
    }
    
    getDisplayString(indentation = "") {
        let text = indentation + this.constructor.name;
        const detail = this.getDisplayStringDetail();
        if (detail !== null) {
            text += ` (${detail})`;
        }
        const textList = [text];
        const nextIndentation = indentation + "    ";
        for (const child of this.children) {
            textList.push(child.getDisplayString(nextIndentation));
        }
        return textList.join("\n");
    }
    
    resolveCompItems() {
        return compUtils.resolveCompItems(this.children);
    }
}


