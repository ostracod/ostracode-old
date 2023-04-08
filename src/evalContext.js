
import { CompilerError } from "./error.js";
import { CompVar, EvalVar } from "./var.js";
import { CompCompartment, EvalCompartment } from "./compartment.js";
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
    
    constructor(vars = [], compartments = [], parent = null) {
        // Map from EvalVar to VarContent.
        this.varContentMap = new Map();
        for (const variable of vars) {
            if (variable instanceof EvalVar) {
                this.addEvalVar(variable);
            }
        }
        // Map from EvalCompartment to CompartmentContent.
        this.compartmentContentMap = new Map();
        for (const compartment of compartments) {
            if (compartment instanceof EvalCompartment) {
                this.addEvalCompartment(compartment);
            }
        }
        this.parent = parent;
    }
    
    addEvalVar(evalVar, varContent = null) {
        this.varContentMap.set(evalVar, varContent ?? new VarContent());
    }
    
    addEvalCompartment(evalCompartment, compartmentContent = null) {
        this.compartmentContentMap.set(
            evalCompartment,
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
    
    getCompartmentContent(evalCompartment) {
        const compartmentContent = this.compartmentContentMap.get(evalCompartment);
        if (typeof compartmentContent !== "undefined") {
            return compartmentContent;
        }
        if (this.parent === null) {
            return null;
        } else {
            return this.parent.getCompartmentContent(evalCompartment);
        }
    }
    
    stowTypeId(discerner, typeId) {
        const evalCompartment = discerner.getDiscernerCompartment();
        const compartmentContent = this.getCompartmentContent(evalCompartment);
        if (compartmentContent !== null) {
            compartmentContent.typeId = typeId;
        }
    }
    
    getTypeId(compartment) {
        if (compartment instanceof CompCompartment) {
            return compartment.getCompTypeId();
        }
        const compartmentContent = this.getCompartmentContent(compartment);
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


