
import { Node } from "./node.js";
import { PreStmt } from "./preStmt.js";

export class GroupSeq extends Node {
    // Concrete subclasses of GroupSeq must implement these methods:
    // resolveStmts
    
    constructor(groups) {
        super();
        this.setGroups(groups);
        this.lineNumber = null;
    }
    
    setGroups(groups) {
        this.groups = groups;
        this.setChildren(this.groups);
    }
    
    getLineNumber() {
        return this.lineNumber;
    }
}

// StmtSeq = Statement sequence
export class StmtSeq extends GroupSeq {
    
    resolveStmts(parentStmt = null) {
        const stmts = this.groups.map((stmt) => {
            if (stmt instanceof PreStmt) {
                return stmt.resolve(parentStmt);
            } else {
                return stmt;
            }
        });
        this.setGroups(stmts);
    }
}

// BhvrStmtSeq = Behavior statement sequence
// Represents `{...}`.
export class BhvrStmtSeq extends StmtSeq {
    
}

// AttrStmtSeq = Attribute statement sequence
// Represents `[...]`.
export class AttrStmtSeq extends StmtSeq {
    
}

// ExprSeq = Expression sequence
export class ExprSeq extends GroupSeq {
    
    constructor(hasFactorType, exprs) {
        super(exprs);
        this.hasFactorType = hasFactorType;
    }
    
    resolveStmts(parentStmt = null) {
        for (const expr of this.groups) {
            expr.resolveStmts();
        }
    }
}

// EvalExprSeq = Evaltime expression sequence
// Represents `(...)`, and `(*...)`
export class EvalExprSeq extends ExprSeq {
    
}

// CompExprSeq = Comptime expression sequence
// Represents `<...>`, `<?...>`, `<??...>`, `<*...>`, `<*?...>`, and `<*??...>`.
export class CompExprSeq extends ExprSeq {
    
    constructor(hasFactorType, exprSeqSelector, exprs) {
        super(hasFactorType, exprs);
        this.exprSeqSelector = exprSeqSelector;
    }
}


