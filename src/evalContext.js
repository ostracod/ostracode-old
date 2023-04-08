
import { CompilerError } from "./error.js";
import { CompVar, EvalVar } from "./var.js";
import { ResultRef, VarRef } from "./itemRef.js";

export class VarContent {
    
    constructor(item = undefined) {
        this.item = item;
    }
}

export class CompartmentContent {
    
    constructor(typeId = undefined) {
        this.typeId = typeId;
    }
}

export class EvalContext {
    
    constructor(vars = [], discerners = [], parent = null) {
        // Map from EvalVar to VarContent.
        this.varContentMap = new Map();
        for (const variable of vars) {
            if (variable instanceof EvalVar) {
                this.addEvalVar(variable);
            }
        }
        // Map from discerning Expr to CompartmentContent.
        this.compartmentContentMap = new Map();
        for (const discerner of discerners) {
            this.addDiscerner(discerner);
        }
        this.parent = parent;
    }
    
    addEvalVar(evalVar, varContent = null) {
        this.varContentMap.set(evalVar, varContent ?? new VarContent());
    }
    
    addDiscerner(discerner, compartmentContent = null) {
        this.compartmentContentMap.set(
            discerner,
            compartmentContent ?? new CompartmentContent(),
        );
    }
    
    getVarContent(evalVar) {
        const varContent = this.varContentMap.get(evalVar);
        if (typeof varContent !== "undefined") {
            return varContent;
        }
        return (this.parent === null) ? null : this.parent.getVarContent(evalVar);
    }
    
    getRef(variable) {
        if (variable instanceof CompVar) {
            return new ResultRef(variable.getCompItem());
        }
        const varContent = this.varContentMap.get(variable);
        if (typeof varContent !== "undefined") {
            return new VarRef(varContent);
        }
        if (this.parent === null) {
            throw new CompilerError(`Cannot access variable "${variable.name}" in this context.`);
        }
        return this.parent.getRef(variable);
    }
    
    getCompartmentContent(discerner) {
        const compartmentContent = this.compartmentContentMap.get(discerner);
        if (typeof compartmentContent !== "undefined") {
            return compartmentContent;
        }
        return (this.parent === null) ? null : this.parent.getCompartmentContent(discerner);
    }
    
    stowTypeId(discerner, typeId) {
        const compartmentContent = this.getCompartmentContent(discerner);
        if (compartmentContent !== null) {
            compartmentContent.typeId = typeId;
        }
    }
    
    getTypeId(discerner) {
        const compartmentContent = this.getCompartmentContent(discerner);
        return (compartmentContent === null) ? null : compartmentContent.typeId;
    }
    
    getVarItemMap() {
        const output = new Map();
        for (const [variable, varContent] of this.varContentMap.entries()) {
            output.set(variable, varContent.item);
        }
        return output;
    }
}


