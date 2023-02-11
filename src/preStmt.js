
import { CompilerError } from "./error.js";
import { WordToken } from "./token.js";
import { PreGroup, PreGroupSeq } from "./preGroup.js";
import { PreExprSeq } from "./preExpr.js";
import { Stmt, ExprStmt, bhvrStmtConstructors, attrStmtConstructors, BhvrStmtSeq, AttrStmtSeq } from "./stmt.js";

// PreStmt = Pre-statement
// A pre-statement is a statement which has not yet been resolved to a specific type.
export class PreStmt extends PreGroup {
    // Concrete subclasses of PreStmt must implement these methods:
    // getStmtConstructors
    
    resolve(parentStmt) {
        const firstComponent = this.components[0];
        if (firstComponent instanceof WordToken) {
            const keyword = firstComponent.text;
            const stmtConstructor = this.getStmtConstructors()[keyword];
            if (typeof stmtConstructor === "undefined") {
                firstComponent.throwError(`Unrecognized statement keyword "${keyword}".`);
            }
            return new stmtConstructor(this.components);
        }
        this.throwError(`Unrecognized statement structure.`);
    }
}

// BhvrPreStmt = Behavior pre-statement
export class BhvrPreStmt extends PreStmt {
    
    getStmtConstructors() {
        return bhvrStmtConstructors;
    }
    
    resolve(parentStmt) {
        if (this.components.length === 1 && this.components[0] instanceof PreExprSeq) {
            return new ExprStmt(this.components);
        }
        return super.resolve(parentStmt);
    }
}

// AttrPreStmt = Attribute pre-statement
export class AttrPreStmt extends PreStmt {
    
    getStmtConstructors() {
        return attrStmtConstructors;
    }
    
    resolve(parentStmt) {
        if (parentStmt !== null) {
            const stmt = parentStmt.resolveChild(this);
            if (stmt !== null) {
                return stmt;
            }
        }
        return super.resolve(parentStmt);
    }
}

// PreStmtSeq = Pre-statement sequence
export class PreStmtSeq extends PreGroupSeq {
    // Concrete subclasses of PreStmtSeq must implement these methods:
    // getSeqConstructor
    
    resolveStmts(parentStmt = null) {
        const stmts = this.preGroups.map((preStmt) => preStmt.resolve(parentStmt));
        const seqConstructor = this.getSeqConstructor();
        const output = new seqConstructor(stmts);
        output.lineNumber = this.lineNumber;
        return output;
    }
}

// BhvrPreStmtSeq = Behavior pre-statement sequence
// Represents `{...}`.
export class BhvrPreStmtSeq extends PreStmtSeq {
    
    getSeqConstructor() {
        return BhvrStmtSeq;
    }
}

// AttrPreStmtSeq = Attribute pre-statement sequence
// Represents `[...]`.
export class AttrPreStmtSeq extends PreStmtSeq {
    
    getSeqConstructor() {
        return AttrStmtSeq;
    }
}


