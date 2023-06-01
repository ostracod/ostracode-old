
import { CompilerError } from "./error.js";
import { CompVar, EvalVar } from "./var.js";
import { VarContent } from "./varContent.js";
import { ResultRef, VarRef } from "./itemRef.js";

export class EvalContext {
    
    constructor(options = {}) {
        const { compContext = null, parent = null, node = null } = options;
        // Map from name to VarContent.
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
        this.varContentMap.set(varContent.variable.name, varContent);
    }
    
    getVarHelper(name) {
        const content = this.varContentMap.get(name);
        if (typeof content === "undefined") {
            return null;
        } else {
            return { variable: content.variable, content };
        }
    }
    
    getVar(name) {
        const result = this.getVarHelper(name);
        if (result !== null) {
            return result;
        }
        if (this.node !== null) {
            const variable = this.node.getVar(name, false);
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
            const result = parentContext.getVarHelper(name);
            if (result !== null) {
                return result;
            }
            parentContext = parentContext.parent;
        }
        if (this.node !== null) {
            let parentNode = this.node.parent;
            while (parentNode !== null && parentNode !== endNode) {
                const variable = parentNode.getVar(name, false);
                if (variable !== null) {
                    return { variable, content: null };
                }
                parentNode = parentNode.parent;
            }
        }
        if (parentContext === null) {
            return { variable: null, content: null };
        } else {
            return parentContext.getVar(name);
        }
    }
    
    getVarContent(name) {
        return this.getVar(name).content;
    }
    
    getVarContentByVar(variable) {
        const result = this.getVar(variable.name);
        return (result.variable === variable) ? result.content : null;
    }
    
    getRef(name) {
        const { variable, content } = this.getVar(name);
        if (variable === null) {
            throw new CompilerError(`Cannot find variable with name "${name}".`);
        }
        const unwrappedVar = variable.unwrap(this.compContext);
        if (unwrappedVar instanceof CompVar) {
            return new ResultRef(this.compContext.getVarItem(unwrappedVar));
        }
        if (content !== null) {
            return new VarRef(content);
        }
        throw new CompilerError(`Cannot access variable "${name}" in this context.`);
    }
    
    getVarItemMap() {
        const output = new Map();
        for (const varContent of this.varContentMap.values()) {
            output.set(varContent.variable, varContent.item);
        }
        return output;
    }
    
    derefAnchor(anchor) {
        return this.getRef(anchor.variable.name);
    }
}


