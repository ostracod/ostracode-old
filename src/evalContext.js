
import { CompilerError } from "./error.js";
import { CompVar, EvalVar } from "./var.js";
import { CompCompartment, EvalCompartment } from "./compartment.js";
import { VarContent, CompartmentContent } from "./containerContent.js";
import { ResultRef, VarRef } from "./itemRef.js";

const getNodeVar = (node, name) => {
    const variable = node.getVar(name, false);
    if (variable === null) {
        return null;
    } else {
        return { container: variable, content: null };
    }
};

const getNodeCompartment = (node, discerner) => {
    const compartment = node.getCompartment(discerner, false);
    if (compartment === null) {
        return null;
    } else {
        return { container: compartment, content: null };
    }
};

export class EvalContext {
    
    constructor(options = {}) {
        const { compContext = null, parent = null, node = null } = options;
        // Map from name to VarContent.
        this.varContentMap = new Map();
        // Map from discerning Expr to CompartmentContent.
        this.compartmentContentMap = new Map();
        this.parent = parent;
        if (compContext === null) {
            this.compContext = (this.parent === null) ? null : this.parent.compContext;
        } else {
            this.compContext = compContext;
        }
        this.node = node;
        if (this.node !== null) {
            this.addVars(this.node.getVars());
            this.addCompartments(this.node.getCompartments());
        }
    }
    
    addVars(vars) {
        for (const variable of vars) {
            if (variable instanceof EvalVar) {
                this.addVar(variable);
            }
        }
    }
    
    addCompartments(compartments) {
        for (const compartment of compartments) {
            if (compartment instanceof EvalCompartment) {
                this.addCompartment(compartment);
            }
        }
    }
    
    addVar(evalVar, item = undefined) {
        const content = new VarContent(evalVar, item);
        this.addVarContent(content);
    }
    
    addCompartment(evalCompartment, typeId = undefined) {
        const content = new CompartmentContent(evalCompartment, typeId);
        this.addCompartmentContent(content);
    }
    
    addVarContent(varContent) {
        this.varContentMap.set(varContent.variable.name, varContent);
    }
    
    addCompartmentContent(compartmentContent) {
        this.compartmentContentMap.set(
            compartmentContent.compartment.discerner,
            compartmentContent,
        );
    }
    
    // getContextContainer(evalContext, key) and getNodeContainer(node, key)
    // both return { container, content }.
    getContainer(key, getContextContainer, getNodeContainer) {
        const result = getContextContainer(this, key);
        if (result !== null) {
            return result;
        }
        if (this.node !== null) {
            const result = getNodeContainer(this.node, key);
            if (result !== null) {
                return result;
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
            const result = getContextContainer(parentContext, key);
            if (result !== null) {
                return result;
            }
            parentContext = parentContext.parent;
        }
        if (this.node !== null) {
            let parentNode = this.node.parent;
            while (parentNode !== null && parentNode !== endNode) {
                const result = getNodeContainer(parentNode, key);
                if (result !== null) {
                    return result;
                }
                parentNode = parentNode.parent;
            }
        }
        if (parentContext === null) {
            return { container: null, content: null };
        } else {
            return parentContext.getContainer(key, getContextContainer, getNodeContainer);
        }
    }
    
    getVarHelper(name) {
        const content = this.varContentMap.get(name);
        if (typeof content === "undefined") {
            return null;
        } else {
            return { container: content.variable, content };
        }
    }
    
    getCompartmentHelper(discerner) {
        const content = this.compartmentContentMap.get(discerner);
        if (typeof content === "undefined") {
            return null;
        } else {
            return { container: content.compartment, content };
        }
    }
    
    getVar(name) {
        return this.getContainer(
            name,
            (evalContext, name) => evalContext.getVarHelper(name),
            getNodeVar,
        );
    }
    
    getCompartment(discerner) {
        return this.getContainer(
            discerner,
            (evalContext, discerner) => evalContext.getCompartmentHelper(discerner),
            getNodeCompartment,
        );
    }
    
    getVarContent(name) {
        return this.getVar(name).content;
    }
    
    getCompartmentContent(discerner) {
        return this.getCompartment(discerner).content;
    }
    
    getRef(name) {
        const { container: variable, content } = this.getVar(name);
        if (variable === null) {
            throw new CompilerError(`Cannot find variable with name "${name}".`);
        }
        if (variable instanceof CompVar) {
            return new ResultRef(this.compContext.getVarItem(variable));
        }
        if (content !== null) {
            return new VarRef(content);
        }
        throw new CompilerError(`Cannot access variable "${name}" in this context.`);
    }
    
    stowTypeId(discerner, typeId) {
        const compartmentContent = this.getCompartmentContent(discerner);
        if (compartmentContent !== null) {
            compartmentContent.typeId = typeId;
        }
    }
    
    getTypeId(discerner) {
        const { container: compartment, content } = this.getCompartment(discerner);
        if (compartment instanceof CompCompartment) {
            return compartment.getCompTypeId();
        }
        return (content === null) ? null : content.typeId;
    }
    
    getVarItemMap() {
        const output = new Map();
        for (const varContent of this.varContentMap.values()) {
            output.set(varContent.variable, varContent.item);
        }
        return output;
    }
}


