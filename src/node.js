
import * as niceUtils from "./niceUtils.js";
import { constructors } from "./constructors.js";
import { CompilerErrorThrower } from "./error.js";
import { OstraCodeFile } from "./ostraCodeFile.js";
import { CompVar } from "./var.js";
import { CompCompartment, EvalCompartment } from "./compartment.js";
import { CompContext } from "./compContext.js";

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
        return this.getParent(OstraCodeFile);
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
    
    addCompartment(compartment) {
        this.compartmentMap.set(compartment.discerner, compartment);
    }
    
    addCompartments(compartments) {
        for (const compartment of compartments) {
            this.addCompartment(compartment);
        }
    }
    
    getCompartment(discerner, checkParent = true) {
        const compartment = this.compartmentMap.get(discerner);
        if (typeof compartment === "undefined") {
            if (checkParent) {
                return (this.parent === null) ? null : this.parent.getCompartment(discerner);
            } else {
                return null;
            }
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
    
    createCompContext(parent = null) {
        const compExprSeqs = this.getNodesByClass(constructors.CompExprSeq);
        const compVars = this.getCompVars();
        return new CompContext(compExprSeqs, compVars, parent);
    }
    
    aggregateCompItems(aggregator) {
        this.iterateCompItems(aggregator.compContext, (item) => {
            aggregator.addItem(item);
        });
    }
    
    aggregateCompTypeIds(typeIdSet) {
        for (const compartment of this.compartmentMap.values()) {
            if (compartment instanceof CompCompartment) {
                const { typeId } = compartment;
                if (typeId !== null) {
                    typeIdSet.add(typeId);
                }
            }
        }
        for (const child of this.children) {
            child.aggregateCompTypeIds(typeIdSet);
        }
    }
    
    validateTypes(compContext) {
        for (const child of this.children) {
            child.validateTypes(compContext);
        }
    }
}


