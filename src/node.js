
import * as niceUtils from "./niceUtils.js";
import * as compUtils from "./compUtils.js";
import { CompilerErrorThrower } from "./error.js";
import { EvalCompartment } from "./compartment.js";

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
        // Map from discerning Expr to Compartment.
        this.compartmentMap = new Map();
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
    
    addCompartment(compartment) {
        this.compartmentMap.set(compartment.discerner, compartment);
    }
    
    addCompartments(compartments) {
        for (const compartment of compartments) {
            this.addCompartment(compartment);
        }
    }
    
    getCompartment(discerner) {
        const compartment = this.compartmentMap.get(discerner);
        if (typeof compartment === "undefined") {
            return (this.parent === null) ? null : this.parent.getCompartment(discerner);
        } else {
            return compartment;
        }
    }
    
    getCompartments() {
        return Array.from(this.compartmentMap.values());
    }
    
    // Assumes that this.isDiscerner returns true.
    getDiscernerCompartment() {
        return this.getCompartment(this);
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
    
    shouldStoreCompartmentsHelper() {
        return false;
    }
    
    overrideChildCompartments(child) {
        return false;
    }
    
    shouldStoreCompartments() {
        if (this.shouldStoreCompartmentsHelper()) {
            return true;
        }
        if (this.parent === null) {
            return false;
        }
        return (this.parent.overrideChildCompartments(this));
    }
    
    resolveCompartments() {
        const compartments = [];
        if (this.isDiscerner()) {
            compartments.push(new EvalCompartment(this));
        }
        for (const child of this.children) {
            const childCompartments = child.resolveCompartments();
            niceUtils.extendList(compartments, childCompartments);
        }
        if (this.shouldStoreCompartments()) {
            this.addCompartments(compartments);
            return [];
        } else {
            return compartments;
        }
    }
    
    resolveCompItems() {
        return compUtils.resolveCompItems(this.children);
    }
}


