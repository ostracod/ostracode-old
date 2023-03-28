
import * as niceUtils from "./niceUtils.js";
import * as compUtils from "./compUtils.js";
import { CompilerErrorThrower } from "./error.js";

let nextNodeId = 0;

export class Node extends CompilerErrorThrower {
    
    constructor() {
        super();
        this.id = nextNodeId;
        nextNodeId += 1;
        this.parent = null;
        this.children = [];
        // Map from variable name to Var.
        this.varMap = new Map();
        // List of Expr which discern feature types.
        this.discerners = [];
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
    
    getParent(nodeClass) {
        let node = this.parent;
        while (node !== null && !(node instanceof nodeClass)) {
            node = node.parent;
        }
        return node;
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
    
    getVars() {
        return Array.from(this.varMap.values());
    }
    
    buildClosureContext(destContext, srcContext) {
        for (const child of this.children) {
            child.buildClosureContext(destContext, srcContext);
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
    
    isDiscerner() {
        return false;
    }
    
    shouldStoreDiscernersHelper() {
        return false;
    }
    
    overrideChildDiscerners(child) {
        return false;
    }
    
    shouldStoreDiscerners() {
        if (this.shouldStoreDiscernersHelper()) {
            return true;
        }
        if (this.parent === null) {
            return false;
        }
        return (this.parent.overrideChildDiscerners(this));
    }
    
    resolveDiscerners() {
        const discerners = [];
        if (this.isDiscerner()) {
            discerners.push(this);
        }
        for (const child of this.children) {
            const childDiscerners = child.resolveDiscerners();
            niceUtils.extendList(discerners, childDiscerners);
        }
        if (this.shouldStoreDiscerners()) {
            this.discerners = discerners;
            return [];
        } else {
            this.discerners = [];
            return discerners;
        }
    }
    
    getDiscernerJsIdentifier() {
        return compUtils.getJsIdentifier(`${this.id}`, "D");
    }
    
    resolveCompItems() {
        return compUtils.resolveCompItems(this.children);
    }
}


