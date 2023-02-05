
export class Group {
    
    constructor(components) {
        this.components = components;
    }
    
    getLineNumber() {
        return this.components[0].getLineNumber();
    }
}

export class GroupSeq {
    
    constructor(groups) {
        this.groups = groups;
        this.lineNumber = null;
    }
    
    getLineNumber() {
        return this.lineNumber;
    }
}


