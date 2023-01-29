
export class PreGroup {
    
    constructor(components) {
        this.components = components;
    }
}

export class PreGroupSeq {
    // Concrete subclasses of PreGroupSeq must implement these methods:
    // resolveStmts
    
    constructor(preGroups) {
        this.preGroups = preGroups;
    }
}


