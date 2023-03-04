
import { CompilerError } from "./error.js";
import { CompVar, EvalVar } from "./var.js";

export class VarItem {
    
    constructor() {
        this.item = undefined;
    }
}

export class EvalContext {
    
    constructor(vars = [], parent = null) {
        // Map from EvalVar to VarItem.
        this.varItemMap = new Map();
        for (const variable of vars) {
            if (variable instanceof EvalVar) {
                this.varItemMap.set(variable, new VarItem());
            }
        }
        this.parent = parent;
    }
    
    getVarItem(evalVar) {
        const varItem = this.varItemMap.get(evalVar);
        if (typeof varItem !== "undefined") {
            return varItem;
        }
        if (this.parent === null) {
            throw new CompilerError(`Cannot read variable "${variable.name}" in this context.`);
        }
        return this.parent.getVarItem(evalVar);
    }
    
    getItem(variable) {
        if (variable instanceof CompVar) {
            return variable.getCompItem();
        } else if (variable instanceof EvalVar) {
            return this.getVarItem(variable).item;
        }
        throw new Error("Unexpected variable type.");
    }
    
    setItem(variable, item) {
        if (variable instanceof EvalVar) {
            this.getVarItem(variable).item = item;
        } else {
            throw new Error(`Cannot assign value to "${variable.name}".`);
        }
    }
}


