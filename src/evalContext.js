
import { CompilerError } from "./error.js";
import { CompVar, EvalVar } from "./var.js";
import { VarContent } from "./varContent.js";
import { ResultRef, VarRef } from "./itemRef.js";

export class EvalContext {
    
    constructor(options = {}) {
        const { compContext = null, parent = null, node = null } = options;
        // Map from name to VarContent.
        this.nameContentMap = new Map();
        // Map from EvalVar to VarContent.
        this.varContentMap = new Map();
        this.parent = parent;
        if (compContext === null) {
            this.compContext = (this.parent === null) ? null : this.parent.compContext;
        } else {
            this.compContext = compContext;
        }
        this.node = node;
        if (this.node !== null) {
            this.addVars(this.node.getVars());
        }
    }
    
    addVars(vars) {
        for (const variable of vars) {
            if (variable instanceof EvalVar) {
                this.addVar(variable);
            }
        }
    }
    
    addVar(evalVar, item = undefined) {
        const content = new VarContent(evalVar, item);
        this.addVarContent(content);
    }
    
    addVarContent(varContent) {
        const { variable } = varContent;
        this.nameContentMap.set(variable.name, varContent);
        this.varContentMap.set(variable, varContent);
    }
    
    // `checkContext` accepts an EvalContext, and returns VarContent or null.
    // `checkNode` accepts a Node, and returns a Var or null.
    findVar(checkContext, checkNode) {
        const content = checkContext(this);
        if (content !== null) {
            return { variable: content.variable, content };
        }
        if (this.node !== null) {
            const variable = checkNode(this.node);
            if (variable !== null) {
                return { variable, content: null };
            }
        }
        let endNode = null;
        let parentContext = this.parent;
        while (parentContext !== null) {
            const { node } = parentContext;
            if (node !== null) {
                endNode = node;
                break;
            }
            const content = checkContext(parentContext);
            if (content !== null) {
                return { variable: content.variable, content };
            }
            parentContext = parentContext.parent;
        }
        if (this.node !== null) {
            let parentNode = this.node.parent;
            while (parentNode !== null && parentNode !== endNode) {
                const variable = checkNode(parentNode);
                if (variable !== null) {
                    return { variable, content: null };
                }
                parentNode = parentNode.parent;
            }
        }
        if (parentContext === null) {
            return { variable: null, content: null };
        } else {
            return parentContext.findVar(checkContext, checkNode);
        }
    }
    
    findVarByName(name) {
        return this.findVar(
            (context) => {
                const content = context.nameContentMap.get(name);
                return (typeof content === "undefined") ? null : content;
            },
            (node) => node.getVar(name, false),
        );
    }
    
    getVarContent(variable) {
        return this.findVar(
            (context) => {
                const content = context.varContentMap.get(variable);
                return (typeof content === "undefined") ? null : content;
            },
            (node) => node.hasVar(variable) ? variable : null,
        ).content;
    }
    
    getRefHelper(variable, content) {
        const unwrappedVar = variable.unwrap(this.compContext);
        if (unwrappedVar instanceof CompVar) {
            return new ResultRef(this.compContext.getVarItem(unwrappedVar));
        }
        if (content !== null) {
            return new VarRef(content);
        }
        throw new CompilerError(`Cannot access variable "${variable.name}" in this context.`);
    }
    
    getRefByName(name) {
        const { variable, content } = this.findVarByName(name);
        if (variable === null) {
            throw new CompilerError(`Cannot find variable with name "${name}".`);
        }
        return this.getRefHelper(variable, content);
    }
    
    getRefByVar(variable) {
        const content = this.getVarContent(variable);
        return this.getRefHelper(variable, content);
    }
    
    getVarItemMap() {
        const output = new Map();
        for (const varContent of this.varContentMap.values()) {
            output.set(varContent.variable, varContent.item);
        }
        return output;
    }
    
    derefAnchor(anchor) {
        return this.getRefByVar(anchor.variable);
    }
}


