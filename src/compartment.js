
import { UnresolvedItemError } from "./error.js";
import * as compUtils from "./compUtils.js";
import { Container } from "./container.js";

export class Compartment extends Container {
    // Concrete subclasses of Compartment must implement these methods:
    // convertToJs
    
    constructor(discerner) {
        super();
        this.discerner = discerner;
    }
}

export class CompCompartment extends Compartment {
    
    constructor(discerner) {
        super(discerner);
        this.typeId = null;
    }
    
    getCompTypeId() {
        if (this.typeId === null) {
            throw new UnresolvedItemError();
        }
        return this.typeId;
    }
    
    convertToJs() {
        return "typeIds." + compUtils.getJsTypeIdIdentifier(this.typeId);
    }
}

export class EvalCompartment extends Compartment {
    
    convertToJs() {
        return compUtils.getJsIdentifier(`${this.discerner.id}`, "D");
    }
}


