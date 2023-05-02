
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
    
    convertToJs(jsConverter) {
        const typeId = jsConverter.getCompContext().getTypeId(this);
        return "typeIds." + compUtils.getJsTypeIdIdentifier(typeId);
    }
}

export class EvalCompartment extends Compartment {
    
    convertToJs(jsConverter) {
        return compUtils.getJsIdentifier(`${this.discerner.id}`, "D");
    }
}


