
import { Node } from "./node.js";

export class PreGroup extends Node {
    
    constructor(components) {
        super();
        this.components = components;
        this.setChildren(this.components);
    }
    
    getLineNumber() {
        return this.components[0].getLineNumber();
    }
}

export class PreGroupSeq extends Node {
    // Concrete subclasses of PreGroupSeq must implement these methods:
    // resolveStmts
    
    constructor(preGroups) {
        super();
        this.preGroups = preGroups;
        this.setChildren(this.preGroups);
        this.lineNumber = null;
    }
    
    getLineNumber() {
        return this.lineNumber;
    }
}


