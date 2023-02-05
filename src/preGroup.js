
export class PreGroup {
    
    constructor(components) {
        this.components = components;
    }
    
    getLineNumber() {
        return this.components[0].getLineNumber();
    }
}

export class PreGroupSeq {
    // Concrete subclasses of PreGroupSeq must implement these methods:
    // resolveStmts
    
    constructor(preGroups) {
        this.preGroups = preGroups;
        this.lineNumber = null;
    }
    
    getLineNumber() {
        return this.lineNumber;
    }
}


