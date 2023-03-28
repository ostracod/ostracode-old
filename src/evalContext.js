
import { CompilerError } from "./error.js";
import { CompVar, EvalVar } from "./var.js";
import { ResultRef, VarRef } from "./itemRef.js";

export class VarItem {
    
    constructor(item = undefined) {
        this.item = item;
    }
}

export class TypeIdCompartment {
    
    constructor(typeId = undefined) {
        this.typeId = typeId;
    }
}

export class EvalContext {
    
    constructor(vars = [], discerners = [], parent = null) {
        // Map from EvalVar to VarItem.
        this.varItemMap = new Map();
        for (const variable of vars) {
            if (variable instanceof EvalVar) {
                this.addEvalVar(variable);
            }
        }
        // Map from discerning Expr to TypeIdCompartment.
        this.compartmentMap = new Map();
        for (const discerner of discerners) {
            this.addDiscerner(discerner);
        }
        this.parent = parent;
    }
    
    addEvalVar(evalVar, varItem = null) {
        this.varItemMap.set(evalVar, varItem ?? new VarItem());
    }
    
    addDiscerner(discerner, compartment = null) {
        this.compartmentMap.set(discerner, compartment ?? new TypeIdCompartment());
    }
    
    getVarItem(evalVar) {
        const varItem = this.varItemMap.get(evalVar);
        if (typeof varItem !== "undefined") {
            return varItem;
        }
        return (this.parent === null) ? null : this.parent.getVarItem(evalVar);
    }
    
    getRef(variable) {
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
        return this.parent.getRef(variable);
    }
    
    getCompartment(discerner) {
        const compartment = this.compartmentMap.get(discerner);
        if (typeof compartment !== "undefined") {
            return compartment;
        }
        return (this.parent === null) ? null : this.parent.getCompartment(discerner);
    }
    
    stowTypeId(discerner, typeId) {
        const compartment = this.getCompartment(discerner);
        if (compartment !== null) {
            compartment.typeId = typeId;
        }
    }
    
    getTypeId(discerner) {
        const compartment = this.getCompartment(discerner);
        return (compartment === null) ? null : compartment.typeId;
    }
}


