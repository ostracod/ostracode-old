
import { WordToken } from "./token.js";
import { PreGroup } from "./group.js";
import { ExprSeq } from "./groupSeq.js";
import { Stmt, ExprStmt, bhvrStmtConstructors, attrStmtConstructors } from "./stmt.js";

// PreStmt = Pre-statement
// A pre-statement is a statement which has not yet been resolved to a specific type.
export class PreStmt extends PreGroup {
    // Concrete subclasses of PreStmt must implement these methods:
    // getStmtConstructors
    
    resolve() {
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
    
    resolve() {
        if (this.components.length === 1 && this.components[0] instanceof ExprSeq) {
            return new ExprStmt(this.components);
        }
        return super.resolve();
    }
}

// AttrPreStmt = Attribute pre-statement
export class AttrPreStmt extends PreStmt {
    
    getStmtConstructors() {
        return attrStmtConstructors;
    }
    
    resolve() {
        const parentStmt = this.parent.parent;
        if (parentStmt instanceof Stmt) {
            const stmt = parentStmt.resolveChild(this);
            if (stmt !== null) {
                return stmt;
            }
        }
        return super.resolve();
    }
}


