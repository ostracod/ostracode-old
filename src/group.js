
import { CompilerErrorThrower } from "./error.js";

export class Group extends CompilerErrorThrower {
    
    constructor(components) {
        super();
        this.components = components;
    }
    
    getLineNumber() {
        return this.components[0].getLineNumber();
    }
}

export class GroupSeq extends CompilerErrorThrower {
    
    constructor(groups) {
        super();
        this.groups = groups;
        this.lineNumber = null;
    }
    
    getLineNumber() {
        return this.lineNumber;
    }
}


