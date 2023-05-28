
import * as niceUtils from "./niceUtils.js";
import { CompilerErrorThrower } from "./error.js";
import { constructors } from "./constructors.js";
import { CompVar } from "./var.js";

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
    
    getNodesByClass(nodeClass) {
        const output = [];
        if (this instanceof nodeClass) {
            output.push(this);
        }
        for (const child of this.children) {
            niceUtils.extendList(output, child.getNodesByClass(nodeClass));
        }
        return output;
    }
    
    getOstraCodeFile() {
        return this.getParent(constructors.OstraCodeFile);
    }
    
    getLineNum() {
        return null;
    }
    
    addVar(variable) {
        this.varMap.set(variable.name, variable);
    }
    
    addVars(vars) {
        for (const variable of vars) {
            this.addVar(variable);
        }
    }
    
    getVar(name, checkParent = true) {
        const variable = this.varMap.get(name);
        if (typeof variable === "undefined") {
            if (checkParent) {
                return (this.parent === null) ? null : this.parent.getVar(name, checkParent);
            } else {
                return null;
            }
        } else {
            return variable;
        }
    }
    
    getVars() {
        return Array.from(this.varMap.values());
    }
    
    getCompVars() {
        const output = [];
        for (const variable of this.varMap.values()) {
            if (variable instanceof CompVar) {
                output.push(variable);
            }
        }
        for (const child of this.children) {
            const compVars = child.getCompVars();
            niceUtils.extendList(output, compVars);
        }
        return output;
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
    
    aggregateCompItems(aggregator) {
        this.iterateCompItems(aggregator.compContext, (item) => {
            aggregator.addItem(item);
        });
    }
    
    validateTypes(compContext) {
        for (const child of this.children) {
            child.validateTypes(compContext);
        }
    }
}


