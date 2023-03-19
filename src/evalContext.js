
import { CompilerError } from "./error.js";
import { CompVar, EvalVar } from "./var.js";
import { ResultRef, VarRef } from "./itemRef.js";

export class VarItem {
    
    constructor() {
        this.item = undefined;
    }
}

export class EvalContext {
    
    constructor(vars = [], discerners = [], parent = null) {
        // Map from EvalVar to VarItem.
        this.varItemMap = new Map();
        for (const variable of vars) {
            if (variable instanceof EvalVar) {
                this.varItemMap.set(variable, new VarItem());
            }
        }
        // Map from discerning Expr to type ID.
        this.typeIdMap = new Map();
        for (const discerner of discerners) {
            this.typeIdMap.set(discerner, undefined);
        }
        this.parent = parent;
    }
    
    getRefByVar(variable) {
        if (variable instanceof CompVar) {
            return new ResultRef(variable.getCompItem());
        }
        const varItem = this.varItemMap.get(variable);
        if (typeof varItem !== "undefined") {
            return new VarRef(varItem);
        }
        if (this.parent === null) {
            throw new CompilerError(`Cannot access variable "${variable.name}" in this context.`);
        }
        return this.parent.getRefByVar(variable);
    }
    
    stowTypeId(discerner, typeId) {
        if (this.typeIdMap.has(discerner)) {
            this.typeIdMap.set(discerner, typeId);
        }
        if (this.parent !== null) {
            this.parent.stowTypeId(discerner, typeId);
        }
    }
    
    getTypeId(discerner) {
        const typeId = this.typeIdMap.get(discerner);
        return (typeof typeId === "undefined") ? this.parent.getTypeId(discerner) : typeId;
    }
}


