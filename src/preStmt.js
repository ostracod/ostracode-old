
import { CompilerError } from "./error.js";
import { WordToken } from "./token.js";
import { PreGroup, PreGroupSeq } from "./preGroup.js";
import { PreExprSeq } from "./preExpr.js";
import { stmtConstructorMap, ExprStmt, BhvrStmtSeq, AttrStmtSeq } from "./stmt.js";

// PreStmt = Pre-statement
// A pre-statement is a statement which has not yet been resolved to a specific type.
export class PreStmt extends PreGroup {
    // Concrete subclasses of PreStmt must implement these methods:
    // resolve
    
}

// BhvrPreStmt = Behavior pre-statement
export class BhvrPreStmt extends PreStmt {
    
    resolve() {
        const firstComponent = this.components[0];
        if (firstComponent instanceof WordToken) {
            const keyword = firstComponent.text;
            const stmtConstructor = stmtConstructorMap[keyword]
            if (typeof stmtConstructor === "undefined") {
                throw new CompilerError(`Unrecognized statement keyword "${keyword}".`);
            }
            return new stmtConstructor(this.components);
        }
        if (firstComponent instanceof PreExprSeq && this.components.length === 1) {
            return new ExprStmt(this.components);
        }
        throw new CompilerError(`Unrecognized statement structure.`);
    }
}

// AttrPreStmt = Attribute pre-statement
export class AttrPreStmt extends PreStmt {
    
    resolve() {
        // TODO: Implement.
        return null;
    }
}

// PreStmtSeq = Pre-statement sequence
export class PreStmtSeq extends PreGroupSeq {
    // Concrete subclasses of PreStmtSeq must implement these methods:
    // createStmtSeq
    
    resolveStmts(parentStmt = null) {
        const stmts = this.preGroups.map((preStmt) => preStmt.resolve(parentStmt));
        const output = this.createStmtSeq(stmts);
        output.lineNumber = this.lineNumber;
        return output;
    }
}

// BhvrPreStmtSeq = Behavior pre-statement sequence
// Represents `{...}`.
export class BhvrPreStmtSeq extends PreStmtSeq {
    
    createStmtSeq(stmts) {
        return new BhvrStmtSeq(stmts);
    }
}

// AttrPreStmtSeq = Attribute pre-statement sequence
// Represents `[...]`.
export class AttrPreStmtSeq extends PreStmtSeq {
    
    createStmtSeq(stmts) {
        return new AttrStmtSeq(stmts);
    }
}


