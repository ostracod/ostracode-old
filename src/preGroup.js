
import { CompilerErrorThrower } from "./error.js";

export class PreGroup extends CompilerErrorThrower {
    
    constructor(components) {
        super();
        this.components = components;
    }
    
    getLineNumber() {
        return this.components[0].getLineNumber();
    }
}

export class PreGroupSeq extends CompilerErrorThrower {
    // Concrete subclasses of PreGroupSeq must implement these methods:
    // resolveStmts
    
    constructor(preGroups) {
        super();
        this.preGroups = preGroups;
        this.lineNumber = null;
    }
    
    getLineNumber() {
        return this.lineNumber;
    }
}


