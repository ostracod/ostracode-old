
import { UnresolvedItemError } from "./error.js";
import * as compUtils from "./compUtils.js";

export class Compartment {
    
    constructor(discerner) {
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
}

export class EvalCompartment extends Compartment {
    
    getJsIdentifier() {
        return compUtils.getJsIdentifier(`${this.discerner.id}`, "D");
    }
}


