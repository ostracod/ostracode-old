
// PreStmt = Pre-statement
// A pre-statement is a statement which has not yet been resolved to a specific type.
export class PreStmt {
    
    constructor(components) {
        this.components = components;
    }
}

// BhvrPreStmt = Behavior pre-statement
export class BhvrPreStmt extends PreStmt {
    
}

// AttrPreStmt = Attribute pre-statement
export class AttrPreStmt extends PreStmt {
    
}

// PreStmtSeq = Pre-statement sequence
export class PreStmtSeq {
    
    constructor(preStmts) {
        this.preStmts = preStmts;
    }
}

// BhvrPreStmtSeq = Behavior pre-statement sequence
// Represents `{...}`.
export class BhvrPreStmtSeq extends PreStmtSeq {
    
}

// AttrPreStmtSeq = Attribute pre-statement sequence
// Represents `[...]`.
export class AttrPreStmtSeq extends PreStmtSeq {
    
}


